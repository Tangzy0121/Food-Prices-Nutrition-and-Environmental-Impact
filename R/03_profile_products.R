source("R/00_common.R")
scope <- if ("--scope=full" %in% commandArgs(trailingOnly = TRUE)) "full" else "pilot"
raw_path <- paste0("data/raw/open_food_facts/products_", scope, "_", run_date, ".parquet")
api_path <- paste0("data/raw/open_food_facts/products_api_pilot_", run_date, ".rds")
nutrients <- c("energy-kcal", "sugars", "fat", "saturated-fat", "proteins", "fiber", "salt")
if (scope == "pilot" && file.exists(api_path) && !"--source=bulk" %in% commandArgs(trailingOnly = TRUE)) {
  raw_path <- api_path
  p <- readRDS(raw_path)
} else {
if (!file.exists(raw_path)) stop("Acquire products first with the same scope/source")
con <- DBI::dbConnect(duckdb::duckdb(shared_home = TRUE))
raw_sql <- DBI::dbQuoteString(con, raw_path)
nutrients <- c("energy-kcal", "sugars", "fat", "saturated-fat", "proteins", "fiber", "salt")
nutrient_fields <- unlist(lapply(nutrients, function(nm) {
  alias <- gsub("-", "_", nm)
  lookup <- paste0("list_extract(list_filter(nutriments, lambda n: n.name='", nm, "'), 1)")
  c(paste0(lookup, ".\"100g\" AS ", alias, "_100g_reported"), paste0(lookup, ".unit AS ", alias, "_unit_source"))
}))
extract <- c("code", "coalesce(list_extract(list_filter(product_name,lambda n: n.lang='fr'),1).text, list_extract(list_filter(product_name,lambda n: n.lang='main'),1).text, product_name[1].text) AS product_name",
  "brands", "quantity AS quantity_text", "product_quantity AS quantity_source", "product_quantity_unit AS quantity_unit_source",
  "to_json(categories_tags) AS categories_json", "to_json(food_groups_tags) AS food_groups_json",
  "nutriscore_grade AS nutri_grade_source", "nutriscore_score", "nutrition_data_per", "no_nutrition_data",
  "environmental_score_grade AS environment_grade_global", "environmental_score_score AS environment_score_global",
  "json_extract_string(try_cast(environmental_score_data AS JSON),'$.grades.fr') AS environment_grade_fr",
  "try_cast(json_extract_string(try_cast(environmental_score_data AS JSON),'$.scores.fr') AS DOUBLE) AS environment_score_fr",
  "json_extract_string(try_cast(environmental_score_data AS JSON),'$.agribalyse.version') AS agribalyse_version",
  "json_extract_string(try_cast(environmental_score_data AS JSON),'$.agribalyse.agribalyse_food_code') AS agribalyse_food_code",
  "json_extract_string(try_cast(environmental_score_data AS JSON),'$.agribalyse.agribalyse_proxy_food_code') AS agribalyse_proxy_food_code",
  "json_extract_string(try_cast(environmental_score_data AS JSON),'$.agribalyse.name_en') AS agribalyse_name",
  "try_cast(json_extract_string(try_cast(environmental_score_data AS JSON),'$.agribalyse.co2_total') AS DOUBLE) AS co2_total_reported",
  "json_extract_string(try_cast(environmental_score_data AS JSON),'$.status') AS environment_status",
  "schema_version", "last_modified_t", "last_updated_t", "obsolete",
  "to_json(data_quality_errors_tags) AS quality_errors_json", "to_json(data_quality_warnings_tags) AS quality_warnings_json", nutrient_fields)
p <- DBI::dbGetQuery(con, paste0("SELECT ", paste(extract, collapse = ", "), " FROM read_parquet(", raw_sql, ")"))
DBI::dbDisconnect(con, shutdown = TRUE)
  p$numeric_fetch_status <- "bulk"
  p$product_source <- "Open Food Facts pinned bulk export"
}
stopifnot(is.character(p$code), !anyDuplicated(p$code))
source("R/quantity_helpers.R")
quantities <- bind_rows(lapply(seq_len(nrow(p)), function(i) normalize_quantity(p$quantity_source[i], p$quantity_unit_source[i], p$quantity_text[i])))
p <- bind_cols(p, quantities)
p$nutri_grade <- ifelse(p$nutri_grade_source %in% letters[1:5], p$nutri_grade_source, NA_character_)
p$nutriscore_algorithm_version <- NA_character_ # Not included in this bulk export; schema_version is a different concept.
p$environment_grade <- ifelse(!is.na(p$environment_grade_fr), p$environment_grade_fr, p$environment_grade_global)
p$environment_grade_source <- ifelse(!is.na(p$environment_grade_fr), "France", "global_fallback")
p$environment_grade[!p$environment_grade %in% c("a-plus", letters[1:5])] <- NA_character_
p$environment_score <- ifelse(!is.na(p$environment_score_fr), p$environment_score_fr, p$environment_score_global)
for (nm in gsub("-", "_", nutrients)) {
  value <- p[[paste0(nm, "_100g_reported")]]
  unit <- p[[paste0(nm, "_unit_source")]]
  upper <- if (nm == "energy_kcal") 1000 else 100
  expected_unit <- if (nm == "energy_kcal") "kcal" else "g"
  valid <- is.finite(value) & value >= 0 & value <= upper & !is.na(unit) & tolower(unit) == tolower(expected_unit) & !(p$no_nutrition_data %in% TRUE)
  p[[paste0(nm, "_100g")]] <- ifelse(valid, value, NA_real_)
  p[[paste0(nm, "_invalid")]] <- !is.na(value) & !valid
}
p$co2_mapping_available <- (!is.na(p$agribalyse_food_code) | !is.na(p$agribalyse_proxy_food_code)) & !is.na(p$agribalyse_version)
p$co2_total <- ifelse(is.finite(p$co2_total_reported) & p$co2_total_reported > 0 & p$co2_mapping_available, p$co2_total_reported, NA_real_)
rules <- readr::read_csv("config/food_category_rules.csv", show_col_types = FALSE) %>% arrange(priority)
tags <- lapply(p$categories_json, function(x) if (is.na(x)) character() else as.character(unlist(jsonlite::fromJSON(x), use.names = FALSE)))
matches <- lapply(tags, function(t) rules$category[rules$tag %in% t])
p$category <- vapply(matches, function(x) if (length(x)) x[1] else "unassigned", character(1))
p$category_matches <- vapply(matches, paste, character(1), collapse = "|")
p$category_match_count <- lengths(matches)
p$product_obsolete <- p$obsolete %in% TRUE
universe <- readr::read_csv(if (scope == "full") "data/processed/product_universe.csv" else "data/processed/pilot_codes.csv", col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
products <- universe %>% left_join(p, by = "code") %>% mutate(match_status = ifelse(is.na(categories_json), "not_in_bulk_export", "matched"))
# A match is defined by code presence, independent of whether categories are missing.
products$match_status <- ifelse(products$code %in% p$code, "matched", "not_in_bulk_export")
if (identical(raw_path, api_path)) {
  sources <- readr::read_csv("outputs/tables/step3/pilot_product_sources.csv", col_types = readr::cols(.default = readr::col_character()), show_col_types = FALSE)
  products <- products %>% left_join(sources, by = "code") %>% mutate(match_status = case_when(
    code %in% p$code ~ "matched", product_database_source %in% c("obf", "opf", "opff") ~ "other_product_database",
    product_database_source == "not_linked" ~ "not_linked_in_open_prices", TRUE ~ "not_returned"))
  numeric_requests <- readr::read_csv("outputs/tables/step3/pilot_numeric_requests.csv", col_types = readr::cols(.default = readr::col_character()), show_col_types = FALSE)
  fallback_status <- numeric_requests$status[match(products$code, numeric_requests$code)]
  products$numeric_fetch_status <- coalesce(products$numeric_fetch_status, fallback_status, "not_requested")
}
saveRDS(products, paste0("data/processed/products_", scope, ".rds"))
prices <- readRDS("data/processed/price_observations.rds") %>% filter(code %in% universe$code) %>%
  left_join(p %>% select(code, quantity_base, unit_basis, quantity_usable, quantity_status, product_obsolete), by = "code") %>%
  mutate(unit_price_eur = ifelse(quantity_usable %in% TRUE & !product_obsolete %in% TRUE &
    (is.na(price_per_source) | price_per_source == "UNIT"), price_eur / quantity_base, NA_real_))
# Collapse potential repeats only for the candidate representative price. Raw observations remain intact.
prices <- prices %>% mutate(representative_keep = !duplicated(pick(code, date, location_id, price_eur, price_is_discounted, price_per_source)))
summarize_prices <- function(x, groups) x %>% group_by(across(all_of(groups))) %>% summarise(
  representative_price = median_or_na(unit_price_eur[price_is_discounted %in% FALSE & representative_keep]),
  median_with_repeats = median_or_na(unit_price_eur[price_is_discounted %in% FALSE]),
  median_all_prices = median_or_na(unit_price_eur[representative_keep]),
  n_valid_prices = sum(!is.na(unit_price_eur)),
  n_regular_valid = sum(!is.na(unit_price_eur) & price_is_discounted %in% FALSE & representative_keep),
  n_valid_stores = n_distinct(location_id[!is.na(unit_price_eur) & price_is_discounted %in% FALSE & representative_keep], na.rm = TRUE), .groups = "drop")
rep_prices <- summarize_prices(prices, c("code", "unit_basis"))
stopifnot(!anyDuplicated(rep_prices$code))
products <- products %>% left_join(rep_prices, by = c("code", "unit_basis")) %>% mutate(
  has_price = is.finite(representative_price), has_nutri = !is.na(nutri_grade),
  has_environment = !is.na(environment_grade), has_carbon = !is.na(co2_total),
  joint_grades_price = has_price & has_nutri & has_environment,
  category = coalesce(category, "unmatched"))
saveRDS(products, paste0("data/processed/products_", scope, ".rds"))
saveRDS(prices, paste0("data/processed/prices_linked_", scope, ".rds"))
readr::write_csv(products, paste0("data/processed/products_", scope, ".csv"), na = "")
write_table(summarize_prices(prices, c("code", "year", "unit_basis")), paste0(scope, "_prices_by_year.csv"))
write_table(products %>% count(match_status, name = "n_products"), paste0(scope, "_matching.csv"))
write_table(products %>% count(quantity_status, unit_basis, name = "n_products"), paste0(scope, "_quantity_status.csv"))
write_table(products %>% count(schema_version, agribalyse_version, environment_grade_source, name = "n_products"), paste0(scope, "_versions.csv"))
coverage <- products %>% group_by(category, unit_basis) %>% summarise(
  n_products = n(), n_price = sum(has_price), n_nutri = sum(has_price & has_nutri),
  n_environment = sum(has_price & has_environment), n_joint = sum(joint_grades_price),
  n_carbon = sum(has_price & has_carbon),
  n_nutri_grades = n_distinct(nutri_grade[has_price & has_nutri]),
  n_environment_grades = n_distinct(environment_grade[has_price & has_environment]),
  n_carbon_values = n_distinct(round(co2_total[has_price & has_carbon], 6)),
  n_agribalyse_versions = n_distinct(agribalyse_version[has_price & has_carbon]),
  n_sugars = sum(has_price & !is.na(sugars_100g)), n_fiber = sum(has_price & !is.na(fiber_100g)),
  .groups = "drop") %>% mutate(
  candidate_for_expansion = !category %in% c("unassigned", "unmatched") & n_price >= 5 & n_joint >= 3 & n_nutri_grades >= 2 & n_environment_grades >= 2,
  candidate_for_eda = !category %in% c("unassigned", "unmatched") & n_price >= 50 & n_joint >= 30 & n_nutri_grades >= 2 & n_environment_grades >= 2,
  carbon_has_variation = n_carbon >= 30 & n_carbon_values >= 3 & n_agribalyse_versions == 1) %>% arrange(desc(n_joint))
write_table(coverage, paste0(scope, "_category_coverage.csv"))
tag_rows <- bind_rows(lapply(seq_len(nrow(p)), function(i) tibble(code = p$code[i], tag = tags[[i]])))
tag_coverage <- tag_rows %>% left_join(products %>% select(code, has_price, has_nutri, has_environment, has_carbon, co2_total), by = "code") %>%
  group_by(tag) %>% summarise(n_products = n_distinct(code), n_price = sum(has_price), n_joint = sum(has_price & has_nutri & has_environment), n_carbon_values = n_distinct(round(co2_total[has_price & has_carbon], 6)), .groups = "drop") %>% arrange(desc(n_joint))
write_table(tag_coverage, paste0(scope, "_taxonomy_coverage.csv"))
write_table(products %>% filter(quantity_status %in% c("conflict", "multipack_unresolved") | category_match_count > 1) %>% select(code, product_name, quantity_text, quantity_source, quantity_unit_source, quantity_status, category_matches), paste0(scope, "_manual_review.csv"))
invalid <- tibble(nutrient = gsub("-", "_", nutrients), n_present = vapply(gsub("-", "_", nutrients), function(nm) sum(!is.na(p[[paste0(nm,"_100g_reported")]])), integer(1)),
  n_invalid = vapply(gsub("-", "_", nutrients), function(nm) sum(p[[paste0(nm,"_invalid")]]), integer(1))) %>%
  mutate(n_numeric_requested_in_matched_products = sum(p$numeric_fetch_status != "not_requested"))
write_table(invalid, paste0(scope, "_nutrient_checks.csv"))
write_table(products %>% count(numeric_fetch_status, name = "n_products"), paste0(scope, "_numeric_fetch_status.csv"))
jsonlite::write_json(list(scope = scope, run_date = run_date, requested = nrow(universe), matched = nrow(p),
  usable_price = sum(products$has_price), nutri_grade = sum(products$has_nutri), environment_grade = sum(products$has_environment),
  joint_price_grades = sum(products$joint_grades_price), carbon = sum(products$has_carbon),
  quantity_conflicts = sum(p$quantity_status == "conflict"), category_rule_version = "2026-11-02", raw_source = raw_path),
  paste0("outputs/tables/step3/", scope, "_profile_manifest.json"), auto_unbox = TRUE, pretty = TRUE)
writeLines(capture.output(sessionInfo()), "outputs/tables/step3/sessionInfo.txt")
message("Profiled ", scope, ": ", nrow(p), "/", nrow(universe), " matches, ", sum(products$joint_grades_price), " products with price and both grades")
