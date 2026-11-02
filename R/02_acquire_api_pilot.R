# Bounded alternative when remote bulk scanning is slow. Grade/quantity pilot: 500;
# direct OFF numeric enrichment: first 50 in the fixed random sampling order.
source("R/00_common.R")
if ("--scope=full" %in% commandArgs(trailingOnly = TRUE)) stop("This script is for the pilot; use the bulk script for full acquisition")
folder <- paste0("data/raw/open_food_facts/api_pilot_", run_date)
dir.create(folder, recursive = TRUE, showWarnings = FALSE)
out <- paste0("data/raw/open_food_facts/products_api_pilot_", run_date, ".rds")
manifest_path <- sub(".rds$", "_manifest.json", out)
pilot <- readr::read_csv("data/processed/pilot_codes.csv", col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
selection_hash <- digest::digest(sort(pilot$code), algo = "sha256")
if (file.exists(out) && file.exists(manifest_path) && !"--refresh-normalized" %in% commandArgs(trailingOnly = TRUE)) {
  manifest <- jsonlite::read_json(manifest_path, simplifyVector = TRUE)
  stopifnot(manifest$selection_hash == selection_hash, manifest$sha256 == digest::digest(file = out, algo = "sha256"))
  if (!is.null(manifest$raw_responses)) for (i in seq_len(nrow(manifest$raw_responses))) {
    stopifnot(file.exists(manifest$raw_responses$file[i]), digest::digest(file = manifest$raw_responses$file[i], algo = "sha256") == manifest$raw_responses$sha256[i])
  }
  message("Using verified API pilot cache")
} else {
  started <- utc_now()
  deadline <- Sys.time() + 10 * 60
  fetch <- function(url, query = list(), path) {
    if (file.exists(path)) return(jsonlite::read_json(path, simplifyVector = FALSE))
    if (Sys.time() >= deadline) stop("API pilot acquisition reached its 10-minute deadline; rerun to resume cached requests")
    request <- httr2::request(url) %>% httr2::req_user_agent("FoodRetailFinalProject/0.1 (academic data acquisition)") %>%
      httr2::req_timeout(20) %>% httr2::req_retry(max_tries = 2, max_seconds = 35, retry_on_failure = TRUE) %>% httr2::req_error(is_error = function(resp) FALSE)
    if (length(query)) request <- do.call(httr2::req_url_query, c(list(request), query))
    r <- httr2::req_perform(request)
    data <- httr2::resp_body_json(r)
    wrapper <- list(url = url, query = query, fetched_at_utc = utc_now(), http_status = httr2::resp_status(r), body = data)
    if (wrapper$http_status >= 400 && wrapper$http_status != 404) stop("HTTP ", wrapper$http_status, " at ", url)
    jsonlite::write_json(wrapper, path, auto_unbox = TRUE, pretty = TRUE, null = "null")
    wrapper
  }
  product_list <- list()
  source_by_code <- setNames(rep("not_returned", nrow(pilot)), pilot$code)
  for (batch in seq_len(ceiling(nrow(pilot) / 50))) {
    codes <- pilot$code[seq.int((batch - 1) * 50 + 1, min(batch * 50, nrow(pilot)))]
    page <- 1L
    repeat {
      response <- fetch("https://prices.openfoodfacts.org/api/v1/prices", list(product_code__in = paste(codes, collapse = ","), size = 100L, page = page), file.path(folder, sprintf("op_batch_%02d_page_%02d.json", batch, page)))
      for (item in response$body$items) {
        cd <- scalar_chr(item$product_code)
        if (cd %in% codes && !is.null(item$product)) source_by_code[[cd]] <- if (is.null(item$product$source)) "not_linked" else item$product$source
        if (cd %in% codes && !is.null(item$product) && identical(item$product$source, "off")) {
          prod <- item$product; prod$cache_retrieved_at_utc <- response$fetched_at_utc
          product_list[[cd]] <- prod
        }
      }
      if (all(codes %in% names(product_list)) || page >= scalar_num(response$body$pages)) break
      page <- page + 1L
      if (page > 20L) stop("Exceeded bounded pagination for Open Prices pilot batch ", batch)
    }
    message("Metadata batch ", batch, ": ", length(product_list), " OFF products cached")
  }
  write_table(tibble(code = names(source_by_code), product_database_source = unname(source_by_code)), "pilot_product_sources.csv")
  target <- head(pilot$code, 50)
  numeric_list <- list()
  last_request <- as.POSIXct("1970-01-01", tz = "UTC")
  fields <- paste(c("code", "nutriments", "nutrition_data_per", "no_nutrition_data", "environmental_score_data", "environmental_score_grade", "environmental_score_score", "last_modified_t", "last_updated_t", "schema_version", "obsolete", "data_quality_errors_tags", "data_quality_warnings_tags"), collapse = ",")
  for (i in seq_along(target)) {
    cd <- target[i]
    path <- file.path(folder, paste0("off_", cd, ".json"))
    if (!file.exists(path)) {
      pause <- 4.3 - as.numeric(difftime(Sys.time(), last_request, units = "secs"))
      if (pause > 0) Sys.sleep(pause)
      last_request <- Sys.time()
    }
    # v3.2 explicitly requests the documented pre-nutrition-schema-change shape.
    numeric_list[[cd]] <- tryCatch(fetch(paste0("https://world.openfoodfacts.org/api/v3.2/product/", cd, ".json"), list(fields = fields), path),
      error = function(e) list(http_status = 0L, error = conditionMessage(e), body = list()))
    message("Numeric enrichment ", i, "/", length(target), ": HTTP ", numeric_list[[cd]]$http_status)
  }
  nutrients <- c("energy-kcal", "sugars", "fat", "saturated-fat", "proteins", "fiber", "salt")
  p <- bind_rows(lapply(names(product_list), function(cd) {
    prod <- product_list[[cd]]
    nr <- numeric_list[[cd]]
    np <- if (!is.null(nr) && nr$http_status == 200L && !is.null(nr$body$product)) nr$body$product else list()
    ed <- np$environmental_score_data
    ag <- ed$agribalyse
    row <- tibble(code = cd, product_name = scalar_chr(prod$product_name), brands = scalar_chr(prod$brands),
      quantity_text = scalar_chr(prod$quantity), quantity_source = scalar_chr(prod$product_quantity), quantity_unit_source = scalar_chr(prod$product_quantity_unit),
      categories_json = as.character(jsonlite::toJSON(as.character(unlist(prod$categories_tags, use.names = FALSE)), auto_unbox = FALSE)), food_groups_json = "[]",
      nutri_grade_source = scalar_chr(prod$nutriscore_grade), nutriscore_score = NA_real_, nutrition_data_per = scalar_chr(np$nutrition_data_per),
      no_nutrition_data = if (is.null(np$no_nutrition_data)) NA else as.logical(np$no_nutrition_data),
      environment_grade_global = scalar_chr(prod$ecoscore_grade), environment_score_global = scalar_num(np$environmental_score_score),
      environment_grade_fr = scalar_chr(ed$grades$fr), environment_score_fr = scalar_num(ed$scores$fr),
      agribalyse_version = scalar_chr(ag$version), agribalyse_food_code = scalar_chr(ag$agribalyse_food_code),
      agribalyse_proxy_food_code = scalar_chr(ag$agribalyse_proxy_food_code), agribalyse_name = scalar_chr(ag$name_en),
      co2_total_reported = scalar_num(ag$co2_total), environment_status = scalar_chr(ed$status), schema_version = scalar_num(np$schema_version),
      last_modified_t = scalar_num(np$last_modified_t), last_updated_t = scalar_num(np$last_updated_t),
      obsolete = if (is.null(np$obsolete)) NA else as.logical(np$obsolete),
      quality_errors_json = if (is.null(np$data_quality_errors_tags)) NA_character_ else as.character(jsonlite::toJSON(as.character(unlist(np$data_quality_errors_tags, use.names = FALSE)), auto_unbox = FALSE)),
      quality_warnings_json = if (is.null(np$data_quality_warnings_tags)) NA_character_ else as.character(jsonlite::toJSON(as.character(unlist(np$data_quality_warnings_tags, use.names = FALSE)), auto_unbox = FALSE)),
      product_source = "Open Prices cached OFF subset", product_source_synced = scalar_chr(prod$source_last_synced),
      environment_grade_field_source = "Open Prices ecoscore_grade",
      metadata_retrieved_at_utc = scalar_chr(prod$cache_retrieved_at_utc),
      numeric_fetch_status = if (is.null(nr)) "not_requested" else if (length(np)) "ok" else if (nr$http_status == 404L) "not_found" else "error")
    for (nm in nutrients) {
      alias <- gsub("-", "_", nm)
      row[[paste0(alias, "_100g_reported")]] <- scalar_num(np$nutriments[[paste0(nm, "_100g")]])
      row[[paste0(alias, "_unit_source")]] <- scalar_chr(np$nutriments[[paste0(nm, "_unit")]])
    }
    row
  }))
  saveRDS(p, out)
  statuses <- tibble(code = target, status = vapply(target, function(cd) {
    nr <- numeric_list[[cd]]
    if (nr$http_status == 200L && !is.null(nr$body$product)) "ok" else if (nr$http_status == 404L) "not_found" else "error"
  }, character(1)))
  write_table(statuses, "pilot_numeric_requests.csv")
  response_files <- list.files(folder, pattern = "[.]json$", full.names = TRUE)
  response_hashes <- tibble(file = response_files, sha256 = vapply(response_files, function(f) digest::digest(file = f, algo = "sha256"), character(1)))
  jsonlite::write_json(list(scope = "pilot", source = "Open Prices cached OFF subset; Open Food Facts API v3.2 numeric enrichment",
    revision = "live API responses cached individually; see request URLs and UTC timestamps", started_at_utc = started, completed_at_utc = utc_now(),
    requested = nrow(pilot), matched = nrow(p), numeric_requested = length(target), numeric_success = sum(statuses$status == "ok"),
    selection_hash = selection_hash, file = out, sha256 = digest::digest(file = out, algo = "sha256"),
    raw_response_folder = folder, raw_responses = response_hashes, license = "ODbL-1.0; individual contents DbCL-1.0"), manifest_path, auto_unbox = TRUE, pretty = TRUE)
}
