# Enumerate the priced category catalog before sampling; do not select on score availability.
source("R/formal_helpers.R", encoding = "UTF-8")
rules <- readr::read_csv("config/formal_categories.csv", show_col_types = FALSE)
universe <- readr::read_csv("data/processed/product_universe.csv", col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
started <- utc_now()
deadline <- Sys.time() + 20 * 60
all_catalog <- list()
catalog_paths <- character()
for (k in seq_len(nrow(rules))) {
  rule <- rules[k, ]
  page <- 1L; items <- list(); pages <- 1L
  repeat {
    if (Sys.time() > deadline) stop("Category enumeration reached its 20-minute deadline; rerun to resume caches")
    path <- file.path(formal_root, "catalog", paste0(rule$category, sprintf("_%03d.json", page)))
    r <- formal_request("https://prices.openfoodfacts.org/api/v1/products", list(categories_tags__contains = rule$tag,
      price_count__gte = 1L, source = "off", size = 100L, page = page, order_by = "code"), path)
    if (r$http_status != 200L) stop("Catalog request was not successful")
    pages <- scalar_num(r$body$pages)
    if (!is.finite(pages) || pages > 150L) stop("Unexpected category pagination")
    items <- c(items, r$body$items)
    catalog_paths <- c(catalog_paths, path)
    message(rule$category, " page ", page, "/", pages, ": ", length(items), " catalog products")
    if (page >= pages) break
    page <- page + 1L
  }
  df <- bind_rows(lapply(items, function(x) tibble(code = scalar_chr(x$code), category = rule$category,
    category_tag = rule$tag, target_unit = rule$unit_basis, catalog_name = scalar_chr(x$product_name),
    quantity_text = scalar_chr(x$quantity), quantity_source = scalar_chr(x$product_quantity),
    quantity_unit_source = scalar_chr(x$product_quantity_unit), categories_json = json_array(x$categories_tags),
    catalog_nutri_grade = scalar_chr(x$nutriscore_grade), catalog_environment_grade = scalar_chr(x$ecoscore_grade),
    source_last_synced = scalar_chr(x$source_last_synced)))) %>% distinct(code, .keep_all = TRUE)
  q <- bind_rows(lapply(seq_len(nrow(df)), function(i) normalize_quantity(df$quantity_source[i], df$quantity_unit_source[i], df$quantity_text[i])))
  df <- bind_cols(df, q) %>% left_join(universe, by = "code") %>% mutate(
    in_price_universe = !is.na(n_prices), has_regular_quote = coalesce(n_regular > 0, FALSE),
    correct_unit = quantity_usable & unit_basis == target_unit,
    eligible = in_price_universe & has_regular_quote & coalesce(correct_unit, FALSE))
  all_catalog[[rule$category]] <- df
}
catalog <- bind_rows(all_catalog)
readr::write_csv(catalog, "data/processed/formal_category_candidates.csv", na = "")
set.seed(20261102)
selection <- bind_rows(lapply(seq_len(nrow(rules)), function(k) {
  x <- catalog %>% filter(category == rules$category[k], eligible) %>% arrange(code)
  if (nrow(x) < 100L) stop("Too few comparable priced products in ", rules$category[k], ": ", nrow(x))
  selected <- x[sample.int(nrow(x), min(nrow(x), rules$target_n[k])), ]
  selected %>% mutate(sampling_order = row_number())
}))
stopifnot(!anyDuplicated(selection$code), nrow(selection) >= 450L, nrow(selection) <= 800L)
readr::write_csv(selection, "data/processed/formal_selection.csv", na = "")
write_table(catalog %>% group_by(category) %>% summarise(n_catalog = n(), n_in_price_universe = sum(in_price_universe),
  n_regular = sum(in_price_universe & has_regular_quote), n_eligible = sum(eligible), .groups = "drop") %>%
  left_join(selection %>% count(category, name = "n_selected"), by = "category"), "formal_selection_flow.csv")
jsonlite::write_json(list(started_at_utc = started, completed_at_utc = utc_now(), seed = 20261102L,
  sampling = "stratified simple random sample of currently categorized, quantity-comparable barcodes with 2024-2025 FR/EUR regular quotes; no score-availability filter",
  selected = nrow(selection), selection_file = "data/processed/formal_selection.csv",
  selection_sha256 = digest::digest(file = "data/processed/formal_selection.csv", algo = "sha256"),
  category_config_sha256 = digest::digest(file = "config/formal_categories.csv", algo = "sha256"),
  raw_responses = response_hashes(catalog_paths)), "outputs/tables/step3/formal_selection_manifest.json", auto_unbox = TRUE, pretty = TRUE)
message("FORMAL SELECTION COMPLETE: ", nrow(selection), " products")
