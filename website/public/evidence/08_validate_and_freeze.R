source("R/formal_helpers.R", encoding = "UTF-8")
freeze_dir <- "data/processed/frozen_v1"
frozen_manifest_path <- file.path(freeze_dir, "manifest.json")
verify_hashes <- function(df) {
  for (i in seq_len(nrow(df))) {
    if (!file.exists(df$file[i]) || !identical(digest::digest(file = df$file[i], algo = "sha256"), unname(df$sha256[i]))) stop("Snapshot checksum mismatch: ", df$file[i])
  }
}
if (file.exists(frozen_manifest_path)) {
  frozen <- jsonlite::read_json(frozen_manifest_path, simplifyVector = TRUE)
  stopifnot(identical(frozen$status, "complete"))
  verify_hashes(frozen$files)
  verify_hashes(frozen$provenance_files)
  message("FROZEN V1 VERIFIED: ", frozen$n_selected, " selected / ", frozen$n_primary, " primary products")
} else {
  selection <- readr::read_csv("data/processed/formal_selection.csv", col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
  p <- readRDS("data/processed/products_formal.rds")
  x <- readRDS("data/processed/prices_linked_formal.rds")
  universe <- readRDS("data/processed/price_observations.rds")
  r <- readr::read_csv("outputs/tables/step3/formal_product_requests.csv", col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
  coverage <- readr::read_csv("outputs/tables/step3/formal_category_coverage.csv", show_col_types = FALSE)
  sm <- jsonlite::read_json("outputs/tables/step3/formal_selection_manifest.json", simplifyVector = TRUE)
  am <- jsonlite::read_json("outputs/tables/step3/formal_acquisition_manifest.json", simplifyVector = TRUE)
  stopifnot(nrow(p) == 600L, is.character(p$code), !anyDuplicated(p$code), !anyDuplicated(x$price_id),
    setequal(p$code, selection$code), setequal(p$code, r$code), nrow(r) == 600L, all(r$attempted),
    all(r$status %in% c("ok", "ok_confirmed", "not_found_confirmed")), !any(p$numeric_fetch_status == "not_requested"),
    nrow(x) == sum(universe$code %in% p$code), all(x$year %in% 2024:2025), all(x$currency == "EUR"),
    all(coverage$n_selected == 150L), all(coverage$n_primary >= 100L), all(coverage$n_joint >= 50L),
    all(p$representative_price[p$in_primary] > 0), all(is.finite(p$representative_price[p$in_primary])),
    all(p$unit_basis[p$in_primary] == p$target_unit[p$in_primary]),
    all(p$category_confirmed[p$in_primary]), !any(p$obsolete[p$in_primary]),
    all(p$nutriscore_algorithm_version[p$has_nutri] == "2023"),
    all(p$agribalyse_version[p$carbon_primary] == "3.2"),
    all(p$joint_grades_price == (p$in_primary & p$has_nutri & p$has_environment)))
  stopifnot(digest::digest(file = "data/processed/formal_selection.csv", algo = "sha256") == sm$selection_sha256,
    sm$selection_sha256 == am$selection_sha256,
    digest::digest(file = am$product_file, algo = "sha256") == am$product_sha256)
  verify_hashes(sm$raw_responses); verify_hashes(am$raw_responses)
  # Worked physical-unit examples are independent of observed product prices.
  q <- normalize_quantity(500, "g", "4 x 125 g")
  stopifnot(q$quantity_usable, abs(2 / q$quantity_base - 4) < 1e-10,
    !normalize_quantity(125, "g", "4 x 125 g")$quantity_usable,
    !normalize_quantity(500, "ml", "500 g")$quantity_usable,
    abs(normalize_quantity(1200, "ml", "1,2 L (6x20cl)")$quantity_base - 1.2) < 1e-10)
  # Independently check all observed unit-price calculations and all product medians.
  eligible_prices <- x$comparable_quantity & !x$obsolete & x$category_confirmed & (is.na(x$price_per_source) | x$price_per_source == "UNIT")
  stopifnot(all(is.na(x$unit_price_eur[!eligible_prices])),
    max(abs(x$unit_price_eur[eligible_prices] - x$price_eur[eligible_prices] / x$quantity_base[eligible_prices])) < 1e-9)
  for (cd in p$code[p$in_primary]) {
    a <- x[x$code == cd & x$price_is_discounted %in% FALSE & x$representative_keep, ]
    expected <- median(a$price_eur / a$quantity_base, na.rm = TRUE)
    stopifnot(abs(expected - p$representative_price[p$code == cd]) < 1e-9)
  }
  dir.create(freeze_dir, recursive = TRUE, showWarnings = FALSE)
  saveRDS(p, file.path(freeze_dir, "selected_products.rds"))
  readr::write_csv(p, file.path(freeze_dir, "selected_products.csv"), na = "")
  saveRDS(p[p$in_primary, ], file.path(freeze_dir, "analysis_products.rds"))
  readr::write_csv(p[p$in_primary, ], file.path(freeze_dir, "analysis_products.csv"), na = "")
  saveRDS(x, file.path(freeze_dir, "price_observations.rds"))
  readr::write_csv(selection, file.path(freeze_dir, "selection.csv"), na = "")
  file.copy("outputs/tables/step3/formal_prices_by_year.csv", file.path(freeze_dir, "prices_by_year.csv"), overwrite = TRUE)
  file.copy("outputs/tables/step3/formal_category_coverage.csv", file.path(freeze_dir, "category_coverage.csv"), overwrite = TRUE)
  file.copy("outputs/tables/step3/formal_product_requests.csv", file.path(freeze_dir, "source_requests.csv"), overwrite = TRUE)
  file.copy("docs/03_data/data_dictionary.md", file.path(freeze_dir, "data_dictionary.md"), overwrite = TRUE)
  dir.create(file.path(freeze_dir, "tables"), showWarnings = FALSE)
  table_paths <- list.files("outputs/tables/step3", pattern = "^formal_.*[.]csv$", full.names = TRUE)
  file.copy(table_paths, file.path(freeze_dir, "tables", basename(table_paths)), overwrite = TRUE)
  paths <- list.files(freeze_dir, full.names = TRUE, recursive = TRUE)
  provenance <- unique(c("data/raw/open_prices/open_prices_2026-10-30.parquet", "data/raw/open_prices/open_prices_2026-10-30_manifest.json",
    "config/formal_categories.csv", "outputs/tables/step3/formal_selection_manifest.json", "outputs/tables/step3/formal_acquisition_manifest.json",
    sm$raw_responses$file, am$raw_responses$file, am$product_file))
  scripts <- c("R/00_common.R", "R/00_download_prices.R", "R/01_import_prices.R", "R/formal_helpers.R", "R/quantity_helpers.R",
    "R/05_select_formal_sample.R", "R/06_acquire_formal_products.R", "R/07_prepare_formal_data.R", "R/08_validate_and_freeze.R", "R/09_write_formal_report.R", "R/run_step3.R")
  frozen <- list(snapshot = "frozen_v1", status = "complete", frozen_at_utc = utc_now(),
    n_selected = nrow(p), n_primary = sum(p$in_primary), n_joint = sum(p$joint_grades_price), n_price_observations = nrow(x),
    n_carbon_3_2 = sum(p$carbon_primary), category_counts = coverage,
    nutrition_algorithm = "Nutri-Score 2023, as-sold where preparation is recorded", carbon_primary_version = "AGRIBALYSE 3.2",
    files = response_hashes(paths), provenance_files = response_hashes(provenance), script_files = response_hashes(scripts),
    refresh_policy = "Do not overwrite this snapshot. Step 4 reads these files offline; a future refresh must use a new snapshot version.",
    license = "Open Prices / Open Food Facts contributors, ODbL-1.0; individual contents DbCL-1.0; OpenStreetMap contributors for source locations")
  verify_hashes(frozen$files)
  write_utf8(c(paste0("Frozen at UTC: ", frozen$frozen_at_utc), "PASS: complete request coverage; unique keys; joins; balanced selection; physical units; all representative medians; score/method versions; source and snapshot hashes."),
    "outputs/tables/step3/formal_validation.txt")
  jsonlite::write_json(frozen, frozen_manifest_path, auto_unbox = TRUE, pretty = TRUE)
  message("FORMAL V1 FROZEN: ", frozen$n_selected, " selected / ", frozen$n_primary, " primary / ", frozen$n_joint, " joint products")
}
