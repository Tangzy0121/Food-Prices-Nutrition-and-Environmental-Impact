# Read-only reconstruction of the executed data-preparation steps for the website.
# Exports only sanitized record excerpts; never changes the research snapshots.
options(warn = 1)
root <- if (length(commandArgs(TRUE))) normalizePath(commandArgs(TRUE)[1]) else normalizePath(".")
setwd(root)
stopifnot(requireNamespace("jsonlite", quietly = TRUE), requireNamespace("nanoparquet", quietly = TRUE))
read_csv <- function(path) read.csv(path, colClasses = "character", check.names = FALSE, na.strings = "", encoding = "UTF-8")
p <- as.data.frame(readRDS("data/processed/frozen_v1/selected_products.rds"))
x <- as.data.frame(readRDS("data/processed/frozen_v1/price_observations.rds"))
all_prices <- as.data.frame(readRDS("data/processed/price_observations.rds"))
raw <- as.data.frame(nanoparquet::read_parquet("data/raw/open_prices/open_prices_2026-10-30.parquet"))
catalog <- read_csv("data/processed/formal_category_candidates.csv")
selection <- read_csv("data/processed/formal_selection.csv")
requests <- read_csv("outputs/tables/step3/formal_product_requests.csv")
corrections <- read_csv("outputs/step4/tables/environment_grade_corrections.csv")
trace <- list()
truth <- function(x) !is.na(x) & x %in% c(TRUE, "TRUE")
keep <- function(df, test) df[!is.na(test) & test, , drop = FALSE]
sample_rows <- function(df, columns, focus = character()) {
  columns <- intersect(columns, names(df))
  ids <- if ("code" %in% names(df)) match(focus, df$code) else integer()
  ids <- unique(c(ids[!is.na(ids)], seq_len(min(4L, nrow(df)))))
  rows <- df[head(ids, 4), columns, drop = FALSE]
  for (nm in names(rows)) {
    if (inherits(rows[[nm]], "Date") || inherits(rows[[nm]], "POSIXt")) rows[[nm]] <- as.character(rows[[nm]])
    if (is.factor(rows[[nm]])) rows[[nm]] <- as.character(rows[[nm]])
  }
  list(columns = unname(columns), rows = rows)
}
emit <- function(id, before, after, columns, file, pattern, lines = 3L, after_columns = columns, focus = character(), metrics = list()) {
  src <- readLines(file, warn = FALSE, encoding = "UTF-8")
  line <- grep(pattern, src, fixed = TRUE)[1]
  stopifnot(!is.na(line))
  before_view <- before
  if (nrow(before) > nrow(after) && identical(names(before), names(after))) {
    key <- intersect(c("price_id", "id", "code"), intersect(names(before), names(after)))[1]
    if (!is.na(key)) {
      removed <- before[!before[[key]] %in% after[[key]], , drop = FALSE]
      before_view <- rbind(head(removed, 2), head(after, 2))
    }
  }
  trace[[id]] <<- list(id = id, beforeCount = nrow(before), afterCount = nrow(after),
    before = sample_rows(before_view, columns, focus), after = sample_rows(after, after_columns, focus),
    source = file, line = unname(line), code = paste(src[seq.int(line, min(length(src), line + lines - 1L))], collapse = "\n"), metrics = metrics)
}
price_fields <- c("id", "product_code", "location_osm_address_country_code", "currency", "date", "price", "type")
emit("price_source", raw, raw, price_fields, "R/00_download_prices.R", "revision <-", 2)
emit("price_hash", raw, raw, price_fields, "R/00_download_prices.R", "stopifnot(digest::digest", 1)
emit("barcode_type", raw, raw, price_fields, "R/01_import_prices.R", "stopifnot(is.character", 1)
current <- raw
tests <- list(filter_fr = raw$location_osm_address_country_code == "FR", filter_eur = raw$currency == "EUR",
  filter_year = raw$date >= as.Date("2024-01-01") & raw$date <= as.Date("2025-12-31"),
  filter_barcode = raw$type == "PRODUCT" & !is.na(raw$product_code) & nzchar(trimws(raw$product_code)),
  filter_positive = is.finite(raw$price) & raw$price > 0)
patterns <- c(filter_fr = "france =", filter_eur = "eur =", filter_year = "period_2024_2025 =", filter_barcode = "barcode_product =", filter_positive = "positive_price =")
mask <- rep(TRUE, nrow(raw))
for (id in names(tests)) {
  mask <- mask & !is.na(tests[[id]]) & tests[[id]]
  after <- raw[mask, , drop = FALSE]
  emit(id, current, after, price_fields, "R/01_import_prices.R", patterns[[id]], 1)
  current <- after
}
emit("rename_prices", current, all_prices, price_fields, "R/01_import_prices.R", "prices <- selected %>% transmute", 8,
  after_columns = c("price_id", "code", "date", "year", "price_eur", "currency", "price_is_discounted"))
emit("flag_repeats", all_prices, all_prices, c("price_id", "code", "date", "price_eur"), "R/01_import_prices.R", "prices <- prices %>% group_by", 2,
  after_columns = c("price_id", "code", "price_eur", "potential_duplicate_n", "potential_duplicate"), metrics = list(marked = sum(all_prices$potential_duplicate)))
universe <- read_csv("data/processed/product_universe.csv")
emit("price_universe", all_prices, universe, c("code", "date", "price_eur"), "R/01_import_prices.R", "codes <- prices %>% group_by", 5,
  after_columns = c("code", "n_prices", "n_regular", "n_discounted"))

catalog_raw <- list()
for (file in list.files("data/raw/open_food_facts/formal_2026-11-02/catalog", pattern = "[.]json$", full.names = TRUE)) {
  cache <- jsonlite::read_json(file)
  category <- sub("_[0-9]+[.]json$", "", basename(file))
  scalar <- function(value) if (is.null(value)) NA_character_ else as.character(value[[1]])
  for (record in cache$body$items) catalog_raw[[length(catalog_raw) + 1L]] <- data.frame(code = scalar(record$code), category = category,
    quantity_source = scalar(record$product_quantity), quantity_unit_source = scalar(record$product_quantity_unit), quantity_text = scalar(record$quantity))
}
catalog_raw <- do.call(rbind, catalog_raw)
cat_fields <- c("code", "category", "quantity_source", "quantity_unit_source", "quantity_text")
emit("catalog_source", catalog_raw, catalog_raw, cat_fields, "R/05_select_formal_sample.R", "r <- formal_request", 2)
emit("catalog_distinct", catalog_raw, catalog, cat_fields, "R/05_select_formal_sample.R", "source_last_synced =", 1)
emit("catalog_units", catalog, catalog, cat_fields, "R/quantity_helpers.R", "factors <-", 6,
  after_columns = c("code", "quantity_source", "quantity_unit_source", "quantity_base", "unit_basis"))
emit("catalog_text", catalog, catalog, cat_fields, "R/quantity_helpers.R", "simple <-", 5,
  after_columns = c("code", "quantity_text", "quantity_status", "is_multipack", "quantity_usable"))
emit("catalog_join", catalog, catalog, c("code", "category"), "R/05_select_formal_sample.R", "df <- bind_cols(df, q)", 4,
  after_columns = c("code", "n_prices", "n_regular", "in_price_universe"))
catalog_matched <- keep(catalog, truth(catalog$in_price_universe))
emit("catalog_match", catalog, catalog_matched, c("code", "category", "in_price_universe"), "R/05_select_formal_sample.R", "eligible =", 1)
catalog_regular <- keep(catalog_matched, truth(catalog_matched$has_regular_quote))
emit("catalog_regular", catalog_matched, catalog_regular, c("code", "n_regular", "has_regular_quote"), "R/05_select_formal_sample.R", "in_price_universe =", 1)
eligible <- keep(catalog_regular, truth(catalog_regular$correct_unit))
emit("catalog_quantity", catalog_regular, eligible, c("code", "quantity_base", "unit_basis", "target_unit", "correct_unit"), "R/05_select_formal_sample.R", "correct_unit =", 2)
sorted <- eligible[order(eligible$category, eligible$code), ]
emit("sample_sort", eligible, sorted, c("code", "category"), "R/05_select_formal_sample.R", "x <- catalog %>%", 1)
emit("sample_select", sorted, selection, c("code", "category"), "R/05_select_formal_sample.R", "selected <- x[sample.int", 2,
  after_columns = c("code", "category", "sampling_order"), metrics = list(seed = 20261102L))
batch_codes <- requests$code[requests$status == "ok"]
batch <- p[p$code %in% batch_codes, ]
emit("fetch_batch", selection, batch, c("code", "category"), "R/06_acquire_formal_products.R", "r <- formal_request", 2,
  after_columns = c("code", "product_name", "match_status"))
emit("fetch_confirm", batch, p, c("code", "product_name", "match_status"), "R/06_acquire_formal_products.R", "for (cd in statuses$code", 7)
emit("extract_fields", p, p, c("code", "product_name", "quantity_text"), "R/07_prepare_formal_data.R", "row <- tibble", 7,
  after_columns = c("code", "product_name", "category", "retrieved_at_utc", "quantity_text"))
emit("confirm_category", p, p, c("code", "category_tag"), "R/07_prepare_formal_data.R", "categories_json =", 1,
  after_columns = c("code", "category_tag", "category_confirmed"), metrics = list(confirmed = sum(p$category_confirmed)))
emit("flag_obsolete", p, p, c("code", "product_name"), "R/07_prepare_formal_data.R", "obsolete =", 1,
  after_columns = c("code", "product_name", "obsolete"), metrics = list(obsolete = sum(p$obsolete)))
focus <- c("3017760805087", "20022464", "3350031923081")
# Inspect the original helper's real local parsing values without changing its
# source or any stored data. This makes a 110 g vs 110 g × 2 conflict visible.
source("R/quantity_helpers.R", encoding = "UTF-8")
quantity_preview <- normalize_quantity
preview_body <- as.list(body(quantity_preview))
preview_body[[length(preview_body)]] <- substitute({
  result <- ORIGINAL
  result$parsed_text_quantity <- parsed
  result$parsed_text_unit <- parsed_basis
  result$normalized_text <- txt
  result
}, list(ORIGINAL = preview_body[[length(preview_body)]]))
body(quantity_preview) <- as.call(preview_body)
parsed <- do.call(rbind, lapply(seq_len(nrow(p)), function(i) as.data.frame(quantity_preview(p$quantity_source[i], p$quantity_unit_source[i], p$quantity_text[i]))))
stopifnot(all((is.na(parsed$quantity_base) & is.na(p$quantity_base)) | (!is.na(parsed$quantity_base) & !is.na(p$quantity_base) & abs(parsed$quantity_base - p$quantity_base) < 1e-9)))
package_detail <- p
package_detail$parsed_text_quantity <- parsed$parsed_text_quantity
package_detail$parsed_text_unit <- parsed$parsed_text_unit
package_detail$normalized_text <- parsed$normalized_text
factors <- c(g = .001, kg = 1, ml = .001, cl = .01, dl = .1, l = 1)
package_detail$structured_quantity_base <- suppressWarnings(as.numeric(p$quantity_source)) * unname(factors[tolower(trimws(p$quantity_unit_source))])
emit("package_units", p, p, c("code", "quantity_source", "quantity_unit_source"), "R/quantity_helpers.R", "factors <-", 6,
  after_columns = c("code", "quantity_source", "quantity_base", "unit_basis"), focus = focus)
emit("package_text", package_detail, package_detail, c("code", "quantity_text", "quantity_source"), "R/quantity_helpers.R", "simple <-", 5,
  after_columns = c("code", "normalized_text", "parsed_text_quantity", "parsed_text_unit", "is_multipack"), focus = focus)
emit("package_check", package_detail, package_detail, c("code", "structured_quantity_base", "parsed_text_quantity", "parsed_text_unit"), "R/quantity_helpers.R", "status <- if", 8,
  after_columns = c("code", "quantity_status", "quantity_usable", "comparable_quantity"), focus = focus, metrics = list(unusable = sum(!p$comparable_quantity)))
emit("nutri_2023", p, p, c("code", "nutri_grade_source", "nutriscore_version_source", "nutri_grade_2021"), "R/07_prepare_formal_data.R", "n23 <-", 7,
  after_columns = c("code", "nutri_grade_2023_reported", "nutriscore_algorithm_version"))
emit("nutri_preparation", p, p, c("code", "nutri_grade_2023_reported", "nutriscore_2023_preparation"), "R/07_prepare_formal_data.R", "if (!is.na(preparation23)", 1,
  after_columns = c("code", "nutriscore_2023_preparation", "nutri_grade", "nutri_score"), focus = p$code[!is.na(p$nutriscore_2023_preparation) & p$nutriscore_2023_preparation != "as_sold"],
  metrics = list(prepared = sum(!is.na(p$nutriscore_2023_preparation) & p$nutriscore_2023_preparation != "as_sold")))
emit("nutrients", p, p, c("code", "sugars_100g_reported", "sugars_unit_source", "fiber_100g_reported"), "R/07_prepare_formal_data.R", "for (nm in nutrients)", 12,
  after_columns = c("code", "sugars_100g", "sugars_invalid", "fiber_100g", "fiber_invalid"))
emit("environment", p, p, c("code", "environment_field_source", "environment_grade_fr", "environment_grade_global"), "R/07_prepare_formal_data.R", "environment_grade = coalesce", 3,
  after_columns = c("code", "environment_grade", "environment_grade_source", "environment_score"))
emit("carbon_mapping", p, p, c("code", "agribalyse_version", "co2_total_reported"), "R/07_prepare_formal_data.R", "co2_mapping_available =", 2,
  after_columns = c("code", "agribalyse_food_code", "agribalyse_proxy_food_code", "co2_mapping_available", "co2_total"))
emit("select_quotes", all_prices, x, c("price_id", "code", "date", "price_eur"), "R/07_prepare_formal_data.R", "prices <- all_prices %>%", 1)
emit("join_quotes", x, x, c("price_id", "code", "price_eur"), "R/07_prepare_formal_data.R", "prices <- all_prices %>%", 1,
  after_columns = c("price_id", "code", "price_eur", "quantity_base", "unit_basis", "comparable_quantity"))
emit("unit_prices", x, x, c("code", "price_eur", "quantity_base", "unit_basis"), "R/07_prepare_formal_data.R", "mutate(unit_price_eur =", 1,
  after_columns = c("code", "price_eur", "quantity_base", "unit_price_eur"), metrics = list(valid = sum(is.finite(x$unit_price_eur))))
emit("mark_duplicates", x, x, c("code", "date", "price_eur"), "R/07_prepare_formal_data.R", "representative_keep =", 1,
  after_columns = c("code", "date", "price_eur", "representative_keep"), metrics = list(omitted = sum(!x$representative_keep)))
marked <- x
marked$median_eligible <- marked$price_is_discounted %in% FALSE & marked$representative_keep & is.finite(marked$unit_price_eur)
emit("regular_mask", x, marked, c("code", "price_is_discounted", "representative_keep", "unit_price_eur"), "R/07_prepare_formal_data.R", "n_valid_regular_offers =", 2,
  after_columns = c("code", "price_is_discounted", "representative_keep", "unit_price_eur", "median_eligible"), metrics = list(eligible = sum(marked$median_eligible)))
emit("aggregate_prices", marked, p, c("code", "unit_price_eur", "median_eligible"), "R/07_prepare_formal_data.R", "price_summary <-", 8,
  after_columns = c("code", "n_prices", "n_valid_regular_offers", "representative_price"))
emit("join_products", p, p, c("code", "product_name", "nutri_grade", "environment_grade"), "R/07_prepare_formal_data.R", "products <- products %>% left_join(summary", 1,
  after_columns = c("code", "product_name", "representative_price", "nutri_grade", "environment_grade"))
emit("quality_flags", p, p, c("code", "comparable_quantity", "representative_price"), "R/07_prepare_formal_data.R", "in_primary =", 7,
  after_columns = c("code", "in_primary", "exclusion_reason", "joint_grades_price", "carbon_primary"), focus = focus)
emit("freeze", p, p, c("code", "in_primary", "representative_price"), "R/08_validate_and_freeze.R", "saveRDS(p, file.path", 5)
emit("median_validation", p, p, c("code", "n_valid_regular_offers", "representative_price"), "R/10_eda.R", "medians <- prices %>%", 5,
  metrics = list(checked = sum(p$in_primary)))
corrected <- p
for (i in seq_len(nrow(corrections))) {
  at <- match(corrections$code[i], corrected$code)
  corrected$environment_grade[at] <- corrections$restored_grade[i]
  corrected$environment_score[at] <- as.numeric(corrections$restored_fr_score[i])
}
corrected$has_environment <- !is.na(corrected$environment_grade)
corrected$joint_grades_price <- corrected$in_primary & corrected$has_nutri & corrected$has_environment
emit("restore_environment", p, corrected, c("code", "environment_grade", "environment_score", "joint_grades_price"), "R/09b_restore_environment_grades.R", "updated <- dplyr::left_join", 3,
  focus = corrections$code, metrics = list(restored = nrow(corrections)))
current <- corrected
gates <- list(filter_matched = p$match_status == "matched", filter_category = p$category_confirmed, filter_quantity = p$comparable_quantity,
  filter_current = !p$obsolete, filter_representative = is.finite(p$representative_price) & p$representative_price > 0)
mask <- rep(TRUE, nrow(p))
for (id in names(gates)) {
  mask <- mask & !is.na(gates[[id]]) & gates[[id]]
  after <- corrected[mask, , drop = FALSE]
  emit(id, current, after, c("code", "match_status", "category_confirmed", "comparable_quantity", "obsolete", "representative_price"), "R/07_prepare_formal_data.R", "in_primary =", 1)
  current <- after
}
emit("excluded_products", corrected, keep(corrected, !corrected$in_primary), c("code", "product_name", "quantity_text", "exclusion_reason"), "R/07_prepare_formal_data.R", "exclusion_reason =", 3, focus = focus)
emit("order_grades", current, current, c("code", "category", "nutri_grade", "environment_grade"), "R/10_eda.R", "nutri_grade = ordered", 2)
for (id in c("subset_nutrition", "subset_environment", "subset_joint", "subset_carbon")) {
  mask <- switch(id, subset_nutrition = current$has_nutri, subset_environment = current$has_environment,
    subset_joint = current$joint_grades_price, subset_carbon = current$carbon_primary)
  emit(id, current, keep(current, mask), c("code", "representative_price", "nutri_grade", "environment_grade", "agribalyse_version"),
    if (id == "subset_carbon") "R/07_prepare_formal_data.R" else "R/10_eda.R", if (id == "subset_carbon") "carbon_primary =" else "coverage <-", if (id == "subset_carbon") 1 else 5)
}
stopifnot(length(trace) == 56L, trace$filter_positive$afterCount == 83141L, trace$catalog_quantity$afterCount == 3002L,
  trace$fetch_confirm$afterCount == 600L, trace$join_quotes$afterCount == 1541L, trace$filter_representative$afterCount == 598L,
  trace$subset_joint$afterCount == 583L, trace$restore_environment$metrics$restored == 16L)
export <- list(version = 1L, snapshot = "2026-11-05", steps = trace,
  note = "Row filters are cumulative views; field-only steps keep all rows. median_eligible is a presentation name for the R summary predicate. Previews are sanitized saved-record excerpts and reconstructed local values from the original R quantity parser.")
dir.create("website/src/data", recursive = TRUE, showWarnings = FALSE)
for (file in c("website/src/data/processing-trace.json", "website/public/evidence/processing-trace.json")) {
  jsonlite::write_json(export, file, auto_unbox = TRUE, pretty = TRUE, na = "null", null = "null", dataframe = "rows", digits = 10)
}
cat("Exported", length(trace), "processing operations with actual row counts and record previews.\n")
