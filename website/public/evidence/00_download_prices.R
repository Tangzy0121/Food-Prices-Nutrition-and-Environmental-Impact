source("R/00_common.R")
revision <- "3d4e029340f3a5128f84913ab1ee5197399518c2"
source_url <- paste0("https://huggingface.co/datasets/openfoodfacts/open-prices/resolve/", revision, "/prices.parquet")
method <- "existing local snapshot, verified against pinned upstream SHA-256"
if (!file.exists(price_path)) {
  dir.create(dirname(price_path), recursive = TRUE, showWarnings = FALSE)
  tmp <- paste0(price_path, ".partial")
  httr2::request(source_url) %>% httr2::req_timeout(180) %>%
    httr2::req_retry(max_tries = 3, retry_on_failure = TRUE) %>%
    httr2::req_perform(path = tmp)
  if (digest::digest(file = tmp, algo = "sha256") != price_sha256) stop("Downloaded price snapshot has an unexpected SHA-256")
  if (!file.rename(tmp, price_path)) stop("Could not finalize price download")
  method <- "downloaded pinned upstream file"
}
stopifnot(digest::digest(file = price_path, algo = "sha256") == price_sha256)
jsonlite::write_json(list(source = "Open Prices / Open Food Facts contributors", revision = revision,
  source_url = source_url, file = price_path, original_local_snapshot_date = "2026-10-30",
  verified_at_utc = utc_now(), sha256 = price_sha256, bytes = file.info(price_path)$size,
  method = method, license = "ODbL-1.0"), sub(".parquet$", "_manifest.json", price_path), pretty = TRUE, auto_unbox = TRUE)
message("Verified pinned price snapshot")
