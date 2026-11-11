source("R/00_common.R")
stopifnot(file.exists(price_path), digest::digest(file = price_path, algo = "sha256") == price_sha256)
x <- nanoparquet::read_parquet(price_path)
stopifnot(is.character(x$product_code))
steps <- list(
  raw = rep(TRUE, nrow(x)),
  france = x$location_osm_address_country_code == "FR",
  eur = x$currency == "EUR",
  period_2024_2025 = x$date >= as.Date("2024-01-01") & x$date <= as.Date("2025-12-31"),
  barcode_product = x$type == "PRODUCT" & !is.na(x$product_code) & nzchar(trimws(x$product_code)),
  positive_price = is.finite(x$price) & x$price > 0
)
keep <- rep(TRUE, nrow(x))
flow <- bind_rows(lapply(names(steps), function(nm) {
  keep <<- keep & !is.na(steps[[nm]]) & steps[[nm]]
  tibble(stage = nm, price_observations = sum(keep), products = n_distinct(x$product_code[keep], na.rm = TRUE))
}))
write_table(flow, "price_filter_flow.csv")
selected <- x[keep, ]
stopifnot(nrow(selected) == 83141L, n_distinct(selected$product_code) == 44789L, !anyDuplicated(selected$id))
# Retain only fields needed for research; contributor IDs and receipt image paths stay in the raw source.
prices <- selected %>% transmute(
  price_id = as.character(id), code = product_code, date, year = as.integer(format(date, "%Y")),
  price_eur = price, price_is_discounted, price_without_discount, discount_type,
  price_per_source = price_per, currency, location_id, city = location_osm_address_city,
  proof_id, proof_type, receipt_quantity, source,
  source_created = created, source_updated = updated
)
# Different IDs sharing these observed values are potential repeats, not automatically errors.
prices <- prices %>% group_by(code, date, location_id, price_eur, price_is_discounted, price_per_source) %>%
  mutate(potential_duplicate_n = n(), potential_duplicate = n() > 1L) %>% ungroup()
saveRDS(prices, "data/processed/price_observations.rds")
codes <- prices %>% group_by(code) %>% summarise(
  n_prices = n(), n_regular = sum(!is.na(price_is_discounted) & !price_is_discounted),
  n_discounted = sum(price_is_discounted, na.rm = TRUE), n_stores = n_distinct(location_id, na.rm = TRUE),
  first_price_date = min(date), last_price_date = max(date), .groups = "drop") %>% arrange(code)
readr::write_csv(codes, "data/processed/product_universe.csv")
set.seed(20261102)
pilot <- codes[sample.int(nrow(codes), min(500L, nrow(codes))), ] %>% mutate(pilot_order = row_number())
readr::write_csv(pilot, "data/processed/pilot_codes.csv")
write_table(prices %>% count(year, price_is_discounted, name = "n_prices"), "price_year_discount.csv")
write_table(prices %>% count(price_per_source, name = "n_prices"), "price_units.csv")
write_table(prices %>% count(proof_type, name = "n_prices"), "price_proof_types.csv")
write_table(codes %>% count(n_prices, name = "n_products"), "price_repetition.csv")
write_table(prices %>% filter(potential_duplicate) %>% select(price_id, code, date, location_id, price_eur, potential_duplicate_n), "potential_duplicates.csv")
jsonlite::write_json(list(run_date = run_date, source_file = price_path, sha256 = price_sha256,
  raw_rows = nrow(x), filtered_rows = nrow(prices), products = nrow(codes), pilot_size = nrow(pilot),
  pilot_seed = 20261102L, pilot_sampling = "R sample.int without replacement from sorted distinct barcodes",
  duplicate_ids = sum(duplicated(prices$price_id)), potential_repeat_rows = sum(prices$potential_duplicate),
  r_version = R.version.string), "outputs/tables/step3/price_manifest.json", pretty = TRUE, auto_unbox = TRUE)
message("Imported ", nrow(prices), " prices / ", nrow(codes), " products; selected ", nrow(pilot), " pilot barcodes.")
