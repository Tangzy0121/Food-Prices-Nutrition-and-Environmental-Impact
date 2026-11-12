source("R/formal_helpers.R", encoding = "UTF-8")
selection <- readr::read_csv("data/processed/formal_selection.csv", col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
acquired <- readRDS(file.path(formal_root, "products_formal.rds"))
requests <- readr::read_csv("outputs/tables/step3/formal_product_requests.csv", col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
stopifnot(nrow(requests) == nrow(selection), all(requests$attempted), !anyDuplicated(requests$code),
  all(requests$status %in% c("ok", "ok_confirmed", "not_found_confirmed")))
nutrients <- c("energy-kcal", "sugars", "fat", "saturated-fat", "proteins", "fiber", "salt")
valid_grade <- function(x, environment = FALSE) {
  x <- tolower(scalar_chr(x))
  if (is.na(x) || !x %in% c(letters[1:5], if (environment) c("a-plus", "f"))) NA_character_ else x
}
products <- bind_rows(lapply(seq_len(nrow(selection)), function(i) {
  s <- selection[i, ]; record <- acquired[[s$code]]
  p <- if (is.null(record)) list() else record$product
  tags <- as.character(unlist(p$categories_tags, use.names = FALSE))
  modern_environment <- !is.null(p$environmental_score_data)
  ed <- if (modern_environment) p$environmental_score_data else p$ecoscore_data
  ag <- ed$agribalyse
  source_grade <- valid_grade(p$nutriscore_grade)
  source_version <- scalar_chr(p$nutriscore_version)
  n23 <- p$nutriscore[["2023"]]; n21 <- p$nutriscore[["2021"]]
  grade23 <- valid_grade(n23$grade)
  if (is.na(grade23) && identical(source_version, "2023")) grade23 <- source_grade
  score23 <- scalar_num(n23$score)
  if (is.na(score23) && identical(source_version, "2023")) score23 <- scalar_num(p$nutriscore_score)
  grade23_reported <- grade23
  preparation23 <- scalar_chr(n23$preparation)
  if (!is.na(preparation23) && preparation23 != "as_sold") { grade23 <- NA_character_; score23 <- NA_real_ }
  env_fr <- valid_grade(ed$grades$fr, TRUE)
  env_global <- valid_grade(if (modern_environment) p$environmental_score_grade else p$ecoscore_grade, TRUE)
  quantity <- normalize_quantity(scalar_chr(p$product_quantity), scalar_chr(p$product_quantity_unit), scalar_chr(p$quantity))
  row <- tibble(code = s$code, category = s$category, category_tag = s$category_tag, target_unit = s$target_unit,
    sampling_order = s$sampling_order, product_name = scalar_chr(p$product_name), catalog_name = s$catalog_name,
    brands = scalar_chr(p$brands), match_status = if (is.null(record)) "not_found_confirmed" else "matched",
    categories_json = json_array(p$categories_tags), category_confirmed = s$category_tag %in% tags,
    quantity_text = scalar_chr(p$quantity), quantity_source = scalar_chr(p$product_quantity), quantity_unit_source = scalar_chr(p$product_quantity_unit),
    obsolete = isTRUE(as.logical(p$obsolete)), schema_version = scalar_num(p$schema_version),
    last_modified_t = scalar_num(p$last_modified_t), last_updated_t = scalar_num(p$last_updated_t),
    retrieved_at_utc = scalar_chr(record$fetched_at_utc), source_file = scalar_chr(record$source_file), source_endpoint = scalar_chr(record$endpoint),
    nutrition_data_per = scalar_chr(p$nutrition_data_per), no_nutrition_data = if (is.null(p$no_nutrition_data)) NA else isTRUE(as.logical(p$no_nutrition_data)),
    nutri_grade_source = source_grade, nutri_score_source = scalar_num(p$nutriscore_score), nutriscore_version_source = source_version,
    nutri_grade_2021 = valid_grade(n21$grade), nutri_score_2021 = scalar_num(n21$score),
    nutri_grade_2023_reported = grade23_reported, nutri_grade = grade23, nutri_score = score23, nutriscore_algorithm_version = ifelse(!is.na(grade23), "2023", NA_character_),
    nutriscore_2023_computed = scalar_num(n23$nutriscore_computed), nutriscore_2023_preparation = preparation23,
    nutriscore_json = as.character(jsonlite::toJSON(p$nutriscore, auto_unbox = TRUE, null = "null")),
    environment_field_source = if (is.null(record)) NA_character_ else if (modern_environment) "environmental_score_*" else "ecoscore_*",
    environment_grade_fr = env_fr, environment_grade_global = env_global,
    environment_grade = coalesce(env_fr, env_global), environment_grade_source = if (!is.na(env_fr)) "France" else if (!is.na(env_global)) "global_fallback" else NA_character_,
    environment_score = if (!is.na(env_fr)) scalar_num(ed$scores$fr) else scalar_num(if (modern_environment) p$environmental_score_score else p$ecoscore_score),
    environment_status = scalar_chr(ed$status), agribalyse_version = scalar_chr(ag$version),
    agribalyse_food_code = scalar_chr(ag$agribalyse_food_code), agribalyse_proxy_food_code = scalar_chr(ag$agribalyse_proxy_food_code),
    agribalyse_name = scalar_chr(ag$name_en), co2_total_reported = scalar_num(ag$co2_total),
    quality_errors_json = if (is.null(p$data_quality_errors_tags)) NA_character_ else json_array(p$data_quality_errors_tags), quality_warnings_json = if (is.null(p$data_quality_warnings_tags)) NA_character_ else json_array(p$data_quality_warnings_tags),
    numeric_fetch_status = if (is.null(record)) "not_found_confirmed" else "ok") %>% bind_cols(quantity)
  for (nm in nutrients) {
    alias <- gsub("-", "_", nm)
    value <- scalar_num(p$nutriments[[paste0(nm, "_100g")]])
    unit <- scalar_chr(p$nutriments[[paste0(nm, "_unit")]])
    upper <- if (nm == "energy-kcal") 1000 else 100
    expected_unit <- if (nm == "energy-kcal") "kcal" else "g"
    valid <- is.finite(value) && value >= 0 && value <= upper && !is.na(unit) && tolower(unit) == tolower(expected_unit) && !isTRUE(row$no_nutrition_data)
    row[[paste0(alias, "_100g_reported")]] <- value
    row[[paste0(alias, "_unit_source")]] <- unit
    row[[paste0(alias, "_100g")]] <- if (valid) value else NA_real_
    row[[paste0(alias, "_invalid")]] <- !is.na(value) && !valid
  }
  row
}))
products <- products %>% mutate(
  comparable_quantity = quantity_usable & coalesce(unit_basis == target_unit, FALSE),
  co2_mapping_available = !is.na(agribalyse_version) & (!is.na(agribalyse_food_code) | !is.na(agribalyse_proxy_food_code)),
  co2_total = ifelse(co2_mapping_available & is.finite(co2_total_reported) & co2_total_reported > 0, co2_total_reported, NA_real_))
all_prices <- readRDS("data/processed/price_observations.rds")
prices <- all_prices %>% filter(code %in% selection$code) %>% left_join(products %>% select(code, category, quantity_base, unit_basis, comparable_quantity, obsolete, category_confirmed), by = "code") %>%
  mutate(unit_price_eur = ifelse(comparable_quantity & !obsolete & category_confirmed & (is.na(price_per_source) | price_per_source == "UNIT"), price_eur / quantity_base, NA_real_),
    representative_keep = is.na(location_id) | !duplicated(pick(code, date, location_id, price_eur, price_is_discounted, price_per_source)))
price_summary <- function(df, grouping) df %>% group_by(across(all_of(grouping))) %>% summarise(
  n_prices = n(), n_regular_prices = sum(price_is_discounted %in% FALSE), n_discounted_prices = sum(price_is_discounted %in% TRUE),
  n_valid_regular_offers = sum(price_is_discounted %in% FALSE & representative_keep & is.finite(unit_price_eur)),
  n_stores = n_distinct(location_id, na.rm = TRUE), n_price_years = n_distinct(year), first_price_date = min(date), last_price_date = max(date),
  representative_price = median_or_na(unit_price_eur[price_is_discounted %in% FALSE & representative_keep]),
  median_with_repeats = median_or_na(unit_price_eur[price_is_discounted %in% FALSE]),
  median_all_prices = median_or_na(unit_price_eur[representative_keep]), .groups = "drop")
summary <- price_summary(prices, "code")
products <- products %>% left_join(summary, by = "code") %>% mutate(
  in_primary = match_status == "matched" & category_confirmed & comparable_quantity & !obsolete & is.finite(representative_price) & representative_price > 0,
  has_nutri = !is.na(nutri_grade), has_environment = !is.na(environment_grade), has_carbon = !is.na(co2_total),
  joint_grades_price = in_primary & has_nutri & has_environment,
  carbon_primary = in_primary & has_carbon & agribalyse_version == "3.2",
  exclusion_reason = case_when(match_status != "matched" ~ "product_not_found", obsolete ~ "obsolete_product", !category_confirmed ~ "category_not_confirmed",
    quantity_status == "conflict" ~ "quantity_conflict", quantity_status == "multipack_unresolved" ~ "multipack_unresolved",
    !comparable_quantity ~ "quantity_missing_or_wrong_basis", !is.finite(representative_price) ~ "no_valid_regular_price", TRUE ~ "included"))
saveRDS(products, "data/processed/products_formal.rds")
saveRDS(prices, "data/processed/prices_linked_formal.rds")
readr::write_csv(products, "data/processed/products_formal.csv", na = "")
write_table(price_summary(prices, c("code", "year")), "formal_prices_by_year.csv")
coverage <- products %>% group_by(category, target_unit) %>% summarise(n_selected = n(), n_matched = sum(match_status == "matched"),
  n_primary = sum(in_primary), n_nutri_2023 = sum(in_primary & has_nutri), n_environment = sum(in_primary & has_environment), n_joint = sum(joint_grades_price),
  n_sugars = sum(in_primary & !is.na(sugars_100g)), n_salt = sum(in_primary & !is.na(salt_100g)), n_fiber = sum(in_primary & !is.na(fiber_100g)),
  n_carbon = sum(in_primary & has_carbon), n_carbon_3_2 = sum(carbon_primary),
  nutri_grades = n_distinct(nutri_grade[in_primary & has_nutri]), environment_grades = n_distinct(environment_grade[in_primary & has_environment]),
  carbon_values_3_2 = n_distinct(round(co2_total[carbon_primary], 6)), .groups = "drop")
write_table(coverage, "formal_category_coverage.csv")
write_table(products %>% count(category, exclusion_reason, name = "n_products"), "formal_exclusions.csv")
write_table(products %>% filter(!in_primary) %>% select(code, category, product_name, quantity_text, quantity_source, quantity_unit_source, quantity_status, exclusion_reason) %>% mutate(decision = "excluded_from_primary_retained_in_selected_sample"), "formal_quality_decisions.csv")
write_table(products %>% count(category, nutriscore_version_source, nutriscore_algorithm_version, agribalyse_version, schema_version, name = "n_products"), "formal_versions.csv")
write_table(bind_rows(lapply(gsub("-", "_", nutrients), function(nm) tibble(nutrient = nm, n_requested = nrow(products),
  n_returned_value = sum(!is.na(products[[paste0(nm, "_100g_reported")]])), n_valid = sum(!is.na(products[[paste0(nm, "_100g")]])),
  n_invalid = sum(products[[paste0(nm, "_invalid")]])))), "formal_nutrient_coverage.csv")
write_table(products %>% select(code, category, product_name, ends_with("_invalid")) %>% filter(if_any(ends_with("_invalid"), identity)), "formal_nutrient_exceptions.csv")
write_table(products %>% filter(in_primary) %>% group_by(category) %>% summarise(n = n(), min_unit_price = min(representative_price), max_unit_price = max(representative_price),
  n_single_regular_offer = sum(n_valid_regular_offers == 1), n_two_price_years = sum(n_price_years == 2), .groups = "drop"), "formal_price_structure.csv")
writeLines(capture.output(sessionInfo()), "outputs/tables/step3/sessionInfo.txt")
message("FORMAL DATA PREPARED: selected ", nrow(products), ", primary ", sum(products$in_primary), ", joint ", sum(products$joint_grades_price))
