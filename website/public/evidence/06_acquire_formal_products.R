# Query all planned fields for every selected barcode via the documented JSON search endpoint.
source("R/formal_helpers.R", encoding = "UTF-8")
selection <- readr::read_csv("data/processed/formal_selection.csv", col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
started <- utc_now()
deadline <- Sys.time() + 15 * 60
batch_size <- 100L
fields <- paste(c("code", "product_name", "brands", "quantity", "product_quantity", "product_quantity_unit", "categories_tags", "nutriments",
  "nutriscore", "nutriscore_grade", "nutriscore_score", "nutriscore_version", "ecoscore_data", "ecoscore_grade", "ecoscore_score",
  "last_modified_t", "schema_version", "obsolete", "nutrition_data_per"), collapse = ",")
products <- list(); request_paths <- character(); request_status <- list()
for (batch in seq_len(ceiling(nrow(selection) / batch_size))) {
  if (Sys.time() > deadline) stop("Formal product acquisition reached its 15-minute deadline; rerun to resume caches")
  codes <- selection$code[seq.int((batch - 1) * batch_size + 1, min(batch * batch_size, nrow(selection)))]
  path <- file.path(formal_root, "products", sprintf("post_batch_%03d.json", batch))
  r <- formal_request("https://world.openfoodfacts.org/cgi/search.pl", list(action = "process", json = 1L,
    code = paste(codes, collapse = ","), fields = fields, page_size = 100L, page = 1L), path, service = "off_search", post = TRUE)
  if (r$http_status != 200L || is.null(r$body$products)) stop("Invalid formal search response")
  retrieved <- vapply(r$body$products, function(p) scalar_chr(p$code), character(1))
  stopifnot(!anyDuplicated(retrieved), all(retrieved %in% codes), length(retrieved) == scalar_num(r$body$count))
  for (p in r$body$products) products[[p$code]] <- list(product = p, fetched_at_utc = r$fetched_at_utc, source_file = path, endpoint = r$url)
  request_paths <- c(request_paths, path)
  request_status[[batch]] <- tibble(code = codes, batch = batch, attempted = TRUE, status = ifelse(codes %in% retrieved, "ok", "not_found_in_batch"), source_file = path)
  message("Formal product batch ", batch, "/", ceiling(nrow(selection) / batch_size), ": ", length(retrieved), "/", length(codes), " returned")
}
statuses <- bind_rows(request_status)
# Confirm every batch omission with the product endpoint, rather than treating search omissions as field missingness.
for (cd in statuses$code[statuses$status != "ok"]) {
  if (Sys.time() > deadline) stop("Formal missing-product confirmation reached deadline")
  path <- file.path(formal_root, "products", paste0("confirm_", cd, ".json"))
  r <- formal_request(paste0("https://world.openfoodfacts.org/api/v3.2/product/", cd, ".json"), list(fields = paste(fields, "environmental_score_data,environmental_score_grade,environmental_score_score", sep = ",")), path, service = "off_product")
  ok <- r$http_status == 200L && !is.null(r$body$product) && scalar_chr(r$body$product$code) == cd
  statuses$status[statuses$code == cd] <- if (isTRUE(ok)) "ok_confirmed" else "not_found_confirmed"
  statuses$source_file[statuses$code == cd] <- path
  if (isTRUE(ok)) products[[cd]] <- list(product = r$body$product, fetched_at_utc = r$fetched_at_utc, source_file = path, endpoint = r$url)
  request_paths <- c(request_paths, path)
}
saveRDS(products, file.path(formal_root, "products_formal.rds"))
readr::write_csv(statuses, "outputs/tables/step3/formal_product_requests.csv")
manifest <- list(started_at_utc = started, completed_at_utc = utc_now(), selected = nrow(selection), requested = nrow(statuses), matched = length(products),
  all_planned_fields_requested = fields, endpoint = "https://world.openfoodfacts.org/cgi/search.pl", http_method = "POST (read-only search action=process)",
  compatibility = "JSON search returns legacy schema and ecoscore_* fields; v3.2 confirmation requests also request environmental_score_*; source field retained",
  selection_sha256 = digest::digest(file = "data/processed/formal_selection.csv", algo = "sha256"),
  product_file = file.path(formal_root, "products_formal.rds"), product_sha256 = digest::digest(file = file.path(formal_root, "products_formal.rds"), algo = "sha256"),
  raw_responses = response_hashes(unique(request_paths)), license = "ODbL-1.0; individual contents DbCL-1.0")
jsonlite::write_json(manifest, "outputs/tables/step3/formal_acquisition_manifest.json", auto_unbox = TRUE, pretty = TRUE)
message("FORMAL ACQUISITION COMPLETE: ", length(products), "/", nrow(selection), " matched; no unrequested products")
