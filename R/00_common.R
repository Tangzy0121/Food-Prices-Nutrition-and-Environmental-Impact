# Run all scripts from the project root. Barcodes are always character strings.
if (.Platform$OS.type == "windows") invisible(Sys.setlocale("LC_CTYPE", "English_United States.UTF-8"))
required_packages <- c("DBI", "duckdb", "nanoparquet", "dplyr", "tidyr", "readr", "jsonlite", "httr2", "digest", "stringr")
missing_packages <- required_packages[!vapply(required_packages, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing_packages)) stop("Install packages first: ", paste(missing_packages, collapse = ", "))
suppressPackageStartupMessages(library(dplyr))
options(stringsAsFactors = FALSE)
run_date <- "2026-11-02"
price_path <- "data/raw/open_prices/open_prices_2026-10-30.parquet"
price_sha256 <- "32aa1ca9de2663d4b455fdc70421ead1c7d7a1d01a4b2b76bfffabbabab91725"
for (p in c("data/processed", "data/raw/open_food_facts", "outputs/tables/step3")) dir.create(p, recursive = TRUE, showWarnings = FALSE)
write_table <- function(x, name) readr::write_csv(x, file.path("outputs/tables/step3", name), na = "")
scalar_chr <- function(x) if (is.null(x) || !length(x)) NA_character_ else as.character(x[[1]])
scalar_num <- function(x) suppressWarnings(as.numeric(scalar_chr(x)))
median_or_na <- function(x) if (all(is.na(x))) NA_real_ else median(x, na.rm = TRUE)
utc_now <- function() format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
