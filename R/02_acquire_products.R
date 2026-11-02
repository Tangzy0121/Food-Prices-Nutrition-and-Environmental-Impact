# Bulk projection from the official OFF Parquet export; no product-by-product crawl.
# Default scope is the reproducibly selected 500-code pilot. Use --scope=full to expand.
source("R/00_common.R")
args <- commandArgs(trailingOnly = TRUE)
scope <- if ("--scope=full" %in% args) "full" else "pilot"
revision <- "f9ed2be201b9da02328fe23a96eeb7530049a698"
source_url <- paste0("https://huggingface.co/datasets/openfoodfacts/product-database/resolve/", revision, "/food.parquet")
out <- paste0("data/raw/open_food_facts/products_", scope, "_", run_date, ".parquet")
manifest_path <- sub(".parquet$", "_manifest.json", out)
codes_path <- if (scope == "full") "data/processed/product_universe.csv" else "data/processed/pilot_codes.csv"
codes <- readr::read_csv(codes_path, col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)$code
selection_hash <- digest::digest(sort(codes), algo = "sha256")
if (file.exists(out) && file.exists(manifest_path)) {
  manifest <- jsonlite::read_json(manifest_path, simplifyVector = TRUE)
  stopifnot(manifest$revision == revision, manifest$selection_hash == selection_hash,
            manifest$sha256 == digest::digest(file = out, algo = "sha256"))
  message("Using verified cache: ", out)
} else {
  started <- utc_now()
  con <- DBI::dbConnect(duckdb::duckdb(shared_home = TRUE))
  tryCatch({
    DBI::dbExecute(con, "INSTALL httpfs; LOAD httpfs; SET http_timeout=30; SET http_retries=1; SET threads=8; SET memory_limit='2GB'; SET allow_asterisks_in_http_paths=true; SET dynamic_or_filter_threshold=1000;")
    # curl follows the Hub redirect; passing the resolved CDN URL avoids httpfs redirect timeouts.
    response <- httr2::request(source_url) %>% httr2::req_method("HEAD") %>%
      httr2::req_user_agent("FoodRetailFinalProject/0.1 academic bulk data acquisition") %>%
      httr2::req_timeout(30) %>% httr2::req_retry(max_tries = 3, max_seconds = 100, retry_on_failure = TRUE) %>% httr2::req_perform()
    remote <- DBI::dbQuoteString(con, httr2::resp_url(response))
    DBI::dbWriteTable(con, "selected_codes", data.frame(code = codes))
    fields <- c("code", "product_name", "brands", "quantity", "product_quantity", "product_quantity_unit",
      "categories_tags", "food_groups_tags", "countries_tags", "nutriscore_grade", "nutriscore_score",
      "nutriments", "nutrition_data_per", "no_nutrition_data", "environmental_score_grade",
      "environmental_score_score", "environmental_score_data", "categories_properties", "last_modified_t",
      "last_updated_t", "schema_version", "obsolete", "data_quality_errors_tags", "data_quality_warnings_tags")
    field_sql <- paste(paste0("p.", fields), collapse = ", ")
    tmp <- paste0(out, ".partial")
    # The local output is an unmodified row/column subset of a pinned upstream revision.
    # A small literal predicate enables selective Parquet filtering for the pilot.
    predicate <- if (scope == "pilot") paste0(" WHERE p.code IN (", paste(DBI::dbQuoteString(con, codes), collapse = ","), ")") else " SEMI JOIN selected_codes s ON p.code=s.code"
    query <- paste0("COPY (SELECT ", field_sql, " FROM read_parquet(", remote,
      ") p", predicate, ") TO ", DBI::dbQuoteString(con, tmp), " (FORMAT PARQUET, COMPRESSION ZSTD)")
    message("Acquiring ", scope, ": ", length(codes), " target barcodes from pinned bulk export")
    DBI::dbExecute(con, query)
    n <- DBI::dbGetQuery(con, paste0("SELECT count(*) n FROM read_parquet(", DBI::dbQuoteString(con, tmp), ")"))$n
    if (!n) stop("Bulk export returned zero products")
    if (!file.rename(tmp, out)) stop("Could not finalize raw product cache")
    jsonlite::write_json(list(scope = scope, source = "Open Food Facts contributors", source_url = source_url,
      revision = revision, started_at_utc = started, completed_at_utc = utc_now(), requested = length(codes),
      matched = n, selection_hash = selection_hash, file = out, sha256 = digest::digest(file = out, algo = "sha256"),
      selection_file = codes_path, method = "DuckDB column projection and barcode semi join against official bulk Parquet",
      fields = fields, license = "ODbL-1.0; individual contents DbCL-1.0"), manifest_path, auto_unbox = TRUE, pretty = TRUE)
  }, error = function(e) {
    jsonlite::write_json(list(scope = scope, source_url = source_url, started_at_utc = started,
      failed_at_utc = utc_now(), status = "failed", error = gsub("https://[^ ']+", "[download URL]", conditionMessage(e))),
      sub(".parquet$", "_failure.json", out), auto_unbox = TRUE, pretty = TRUE)
    stop(e)
  }, finally = DBI::dbDisconnect(con, shutdown = TRUE))
}
