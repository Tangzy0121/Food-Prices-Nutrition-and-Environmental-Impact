# Default: verify the completed formal freeze offline; build it only if absent.
args <- commandArgs(trailingOnly = TRUE)
if ("--pilot" %in% args) {
  scripts <- c("00_download_prices.R", "01_import_prices.R", "02_acquire_api_pilot.R", "03_profile_products.R", "04_write_data_report.R", "validate_step3.R")
} else if (file.exists("data/processed/frozen_v1/manifest.json")) {
  scripts <- c("08_validate_and_freeze.R", "09_write_formal_report.R")
} else {
  scripts <- c("00_download_prices.R", "01_import_prices.R", "05_select_formal_sample.R", "06_acquire_formal_products.R", "07_prepare_formal_data.R", "08_validate_and_freeze.R", "09_write_formal_report.R")
}
for (script in scripts) {
  message("Running ", script)
  source(file.path("R", script), local = new.env(parent = globalenv()), encoding = "UTF-8")
}
