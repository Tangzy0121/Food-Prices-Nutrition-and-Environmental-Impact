# Presentation-only excerpts. Analytical inputs and R transformations stay unchanged.
args <- commandArgs(trailingOnly = TRUE)
root <- if (length(args)) normalizePath(args[[1]]) else normalizePath(".")
prices <- readRDS(file.path(root, "data/processed/frozen_v1/price_observations.rds"))
codes <- c("3350031923081", "8410376055856", "0016229901189")
stopifnot(nrow(prices) == 1541L, is.character(prices$code), all(codes %in% prices$code))
fields <- c("price_id", "code", "date", "price_eur", "price_is_discounted", "quantity_base", "unit_basis", "unit_price_eur", "representative_keep")
example <- as.data.frame(prices[prices$code %in% codes, fields])
example <- example[order(example$code, example$date, example$price_id), ]
write.csv(example, file.path(root, "website/public/evidence/link-examples.csv"), row.names = FALSE, na = "", fileEncoding = "UTF-8")
message("Exported ", nrow(example), " real price rows for ", length(codes), " barcode examples.")
