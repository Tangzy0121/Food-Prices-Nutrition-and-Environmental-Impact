# Export the six-direction research dashboard from corrected R data and executed EDA tables.
args <- commandArgs(trailingOnly = TRUE)
root <- if (length(args)) normalizePath(args[[1]]) else normalizePath(".")
setwd(root)
suppressPackageStartupMessages(library(dplyr))
source("R/09b_restore_environment_grades.R")
source("shiny/helpers.R")
prepare_step4_inputs(readRDS("data/processed/frozen_v1/selected_products.rds")) |> invisible()
p <- load_dashboard_data(root)
fields <- c("code", "category", "product_name", "brands", "quantity_text", "target_unit",
  "representative_price", "nutri_grade", "environment_grade", "nutri_score", "environment_score",
  "sugars_100g", "saturated_fat_100g", "fiber_100g", "n_valid_regular_offers", "n_stores",
  "first_price_date", "last_price_date", "joint_grades_price", "carbon_primary", "co2_total",
  "agribalyse_food_code", "agribalyse_proxy_food_code", "agribalyse_name")
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
  "R/10_eda.R", "shiny/helpers.R", "website/scripts/export-dashboard.R", table_paths)
# Git checkouts may convert text to CRLF on Windows; hash a portable LF form.
# Frozen RDS inputs retain exact byte hashes.
hashes <- setNames(lapply(source_paths, function(f) {
  bytes <- readBin(f, what = "raw", n = file.info(f)$size)
  if (grepl("\\.(R|csv)$", f)) bytes <- charToRaw(gsub("\r\n", "\n", rawToChar(bytes), fixed = TRUE, useBytes = TRUE))
  digest::digest(bytes, algo = "sha256", serialize = FALSE)
}), source_paths)
bundle <- list(version = "step4_v1_1", pricePeriod = "2024–2025", attributesDate = "2026-11-02",
  sourceHashes = hashes, products = as.data.frame(p[, fields]), tables = tables, boxes = do.call(rbind, boxes))
jsonlite::write_json(bundle, "website/src/data/dashboard.json", dataframe = "rows", na = "null", auto_unbox = TRUE, digits = 17)
message("Exported 598 products, 9 executed R tables and ", length(boxes), " log-scale box summaries.")
