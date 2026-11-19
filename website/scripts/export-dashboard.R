# Export the six-direction research dashboard from corrected R data and executed EDA tables.
args <- commandArgs(trailingOnly = TRUE)
root <- if (length(args)) normalizePath(args[[1]]) else normalizePath(".")
setwd(root)
suppressPackageStartupMessages(library(dplyr))
source("shiny/helpers.R")
if (!file.exists("data/processed/step4_v1_1/analysis_products.rds")) {
  source("R/09b_restore_environment_grades.R")
  prepare_step4_inputs(readRDS("data/processed/frozen_v1/selected_products.rds")) |> invisible()
}
p <- load_dashboard_data(root)
subtype_rules <- list(
  biscuits = c(filled_biscuits = 'filled-biscuits|sandwich-biscuits|jaffa-cakes',
    chocolate_biscuits = 'chocolate.*biscuits|chocolate-chip-cookies|digestives-covered-with-chocolate',
    shortbread = 'shortbread-cookies|brittany-style-galette-biscuits',
    plain_biscuits = 'dry-biscuits|petit-beurre|digestive-biscuits'),
  breakfast_cereals = c(rolled_oats = 'rolled-oats|oat-flakes',
    crunchy_muesli = 'crunchy-mueslis.*|crunchy-cereal-clusters.*|cereal-clusters-with-.*',
    muesli = 'mueslis.*', filled_cereals = 'filled-cereals.*',
    cereal_flakes = 'corn-flakes.*|cereal-flakes.*', extruded_cereals = 'extruded-cereals.*'),
  dark_chocolates = c(cooking_chocolate = 'dark-chocolate-bars-for-cooking',
    filled_chocolate = 'filled-(dark-)?chocolates|chocolate-candies',
    flavored_chocolate = '(dark-)?chocolates-with-.*|salted-(dark-)?chocolates',
    chocolate_bars = 'dark-chocolate-bar.*|chocolate-bars'),
  fruit_juices = c(nectars = 'fruit-nectars', mixed_juices = '(squeezed-)?multifruit-juices|fruit-and-vegetable-juices',
    orange_juice = '(squeezed-)?orange-juices.*', apple_juice = '(squeezed-)?apple-juices.*',
    grape_juice = '(squeezed-)?grape-juices.*', pineapple_juice = '(squeezed-)?pineapple-juices.*',
    lemon_juice = '(squeezed-)?lemon-juice.*', other_concentrate = 'fruit-juices-from-concentrate')
)
# The most specific matching rule wins. A broad category tag alone leaves the subtype unknown.
p$subtype <- vapply(seq_len(nrow(p)), function(i) {
  tags <- sub('^en:', '', jsonlite::fromJSON(p$categories_json[[i]]))
  rules <- subtype_rules[[as.character(p$category[[i]])]]
  matches <- vapply(rules, function(pattern) any(grepl(paste0('^(', pattern, ')$'), tags)), logical(1))
  if (any(matches)) names(rules)[which(matches)[1L]] else NA_character_
}, character(1))
fields <- c("code", "category", "product_name", "brands", "quantity_text", "target_unit",
  "representative_price", "nutri_grade", "environment_grade", "nutri_score", "environment_score",
  "sugars_100g", "saturated_fat_100g", "fiber_100g", "n_valid_regular_offers", "n_stores",
  "first_price_date", "last_price_date", "joint_grades_price", "carbon_primary", "co2_total",
  "agribalyse_food_code", "agribalyse_proxy_food_code", "agribalyse_name", "subtype",
  "energy_kcal_100g", "fat_100g", "proteins_100g", "salt_100g")
quote_path <- "data/processed/frozen_v1/price_observations.rds"
quotes <- readRDS(quote_path) |>
  filter(code %in% p$code, is.finite(unit_price_eur), unit_price_eur > 0) |>
  transmute(id = as.character(price_id), code, date = as.character(date), unit_price = unit_price_eur,
    package_price = price_eur, store = if_else(location_id > 0, as.character(location_id), NA_character_),
    city = na_if(trimws(city), ""), discounted = price_is_discounted, kept = representative_keep) |>
  arrange(date, id)
table_names <- c("coverage", "category_summary", "associations", "joint_cells", "association_sensitivity",
  "carbon_references", "carbon_summary", "paired_year_prices", "paired_year_summary")
table_paths <- paste0("outputs/step4/tables/", table_names, ".csv")
tables <- setNames(lapply(table_paths, function(file) {
  headers <- names(read.csv(file, nrows = 0, check.names = FALSE))
  classes <- setNames(rep(NA_character_, length(headers)), headers)
  classes[intersect(headers, c("code", "agribalyse_food_code", "agribalyse_proxy_food_code"))] <- "character"
  read.csv(file, colClasses = classes, check.names = FALSE, na.strings = "", fileEncoding = "UTF-8")
}), table_names)
# ggplot's log scale transforms prices BEFORE stat_boxplot. Use identical type-7
# quartiles and 1.5-IQR whiskers, and retain every original point in the web view.
boxes <- list()
for (category in names(category_names)) {
  d <- p[p$category == category, ]
  for (dimension in c("all", "nutrition", "environment")) {
    grades <- switch(dimension, all = "all", nutrition = nutri_levels, environment = environment_levels)
    field <- if (dimension == "nutrition") "nutri_grade" else "environment_grade"
    for (grade in grades) {
      q <- if (dimension == "all") d else d[which(d[[field]] == grade), ]
      if (!nrow(q)) next
      log_prices <- log10(q$representative_price)
      hinges <- unname(quantile(log_prices, c(.25, .5, .75), type = 7))
      iqr <- hinges[3] - hinges[1]
      inside <- log_prices[log_prices >= hinges[1] - 1.5 * iqr & log_prices <= hinges[3] + 1.5 * iqr]
      boxes[[length(boxes) + 1]] <- data.frame(category = category, dimension = dimension, grade = grade,
        n = nrow(q), lower = 10^min(inside), q1 = 10^hinges[1], middle = 10^hinges[2],
        q3 = 10^hinges[3], upper = 10^max(inside))
    }
  }
}
source_paths <- c("data/processed/frozen_v1/selected_products.rds",
  "data/raw/open_food_facts/formal_2026-11-02/products_formal.rds", "R/09b_restore_environment_grades.R",
  "R/10_eda.R", "shiny/helpers.R", "website/scripts/export-dashboard.R",
  "data/processed/step4_v1_1/analysis_products.rds", quote_path, table_paths)
# Git checkouts may convert text to CRLF on Windows; hash a portable LF form.
# Frozen RDS inputs retain exact byte hashes.
hashes <- setNames(lapply(source_paths, function(f) {
  bytes <- readBin(f, what = "raw", n = file.info(f)$size)
  if (grepl("\\.(R|csv)$", f)) bytes <- charToRaw(gsub("\r\n", "\n", rawToChar(bytes), fixed = TRUE, useBytes = TRUE))
  digest::digest(bytes, algo = "sha256", serialize = FALSE)
}), source_paths)
bundle <- list(version = "step4_v1_1", pricePeriod = "2024–2025", attributesDate = "2026-11-02",
  sourceHashes = hashes, products = as.data.frame(p[, fields]), quotes = as.data.frame(quotes),
  tables = tables, boxes = do.call(rbind, boxes))
jsonlite::write_json(bundle, "website/src/data/dashboard.json", dataframe = "rows", na = "null", auto_unbox = TRUE, digits = 17)
message("Exported 598 products, 9 executed R tables and ", length(boxes), " log-scale box summaries.")
