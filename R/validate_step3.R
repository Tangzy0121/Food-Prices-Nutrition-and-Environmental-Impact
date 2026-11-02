source("R/00_common.R")
source("R/quantity_helpers.R")
# Independent worked examples catch pack/unit errors that would scale every price.
q <- normalize_quantity(500, "g", "4 x 125 g")
stopifnot(q$quantity_usable, q$unit_basis == "kg", abs(2 / q$quantity_base - 4) < 1e-10)
q <- normalize_quantity(125, "g", "4 x 125 g")
stopifnot(!q$quantity_usable, q$quantity_status == "conflict")
q <- normalize_quantity(NA_real_, NA_character_, "6 x 25 cl")
stopifnot(q$quantity_usable, q$unit_basis == "L", abs(q$quantity_base - 1.5) < 1e-10)
stopifnot(!normalize_quantity(0, "g", NA_character_)$quantity_usable,
  !normalize_quantity(12, "pieces", "12 pieces")$quantity_usable,
  !normalize_quantity(500, "ml", "500 g")$quantity_usable,
  normalize_quantity(1, "l", "1 L")$quantity_base == 1,
  normalize_quantity(500, "g", "maxi format")$quantity_usable)
q <- normalize_quantity(1200, "ml", "1,2L (6x20cl)")
stopifnot(q$quantity_usable, abs(q$quantity_base - 1.2) < 1e-10,
  !normalize_quantity(500, "g", "500 g (4x100g)")$quantity_usable)
scope <- if ("--scope=full" %in% commandArgs(trailingOnly = TRUE)) "full" else "pilot"
p <- readRDS(paste0("data/processed/products_", scope, ".rds"))
x <- readRDS(paste0("data/processed/prices_linked_", scope, ".rds"))
all_prices <- readRDS("data/processed/price_observations.rds")
stopifnot(is.character(p$code), !anyDuplicated(p$code), !anyDuplicated(x$price_id),
  nrow(x) == sum(all_prices$code %in% p$code), all(x$code %in% p$code),
  !any(is.infinite(x$unit_price_eur)), all(p$representative_price[p$has_price] > 0),
  all(is.na(x$unit_price_eur[!x$quantity_usable %in% TRUE])),
  all(is.na(p$co2_total[!p$co2_mapping_available %in% TRUE])),
  all(p$joint_grades_price == (p$has_price & p$has_nutri & p$has_environment)))
if (scope == "full") stopifnot(nrow(p) == 44789L, nrow(x) == 83141L)
# Recalculate real product medians independently with base R, including a multi-observation product.
sample_codes <- unique(c(head(p$code[p$has_price], 5), head(p$code[p$n_regular_valid > 1 & p$has_price], 5)))
for (cd in sample_codes) {
  rows <- x[x$code == cd & x$price_is_discounted %in% FALSE & x$representative_keep & !is.na(x$unit_price_eur), ]
  stopifnot(abs(median(rows$price_eur / rows$quantity_base) - p$representative_price[p$code == cd]) < 1e-10)
}
profile <- jsonlite::read_json(paste0("outputs/tables/step3/", scope, "_profile_manifest.json"), simplifyVector = TRUE)
manifest <- jsonlite::read_json(sub("\\.(rds|parquet)$", "_manifest.json", profile$raw_source), simplifyVector = TRUE)
stopifnot(digest::digest(file = manifest$file, algo = "sha256") == manifest$sha256,
  sum(p$match_status == "matched") == manifest$matched)
report_lines <- readLines("docs/03_data/data_quality_review.md", encoding = "UTF-8", warn = FALSE)
stopifnot(grepl("\u7b2c\u4e09\u6b65", report_lines[1], fixed = TRUE),
  !any(grepl("[\x01-\x08\x0b\x0c\x0e-\x1f]", report_lines)))
writeLines(c(paste0("Validated scope: ", scope), paste0("Validated at UTC: ", utc_now()),
  "PASS: worked unit/pack examples; unique keys; join cardinality; price validity; subset flags; independent median checks; raw cache SHA-256."),
  paste0("outputs/tables/step3/", scope, "_validation.txt"))
message("PASS: Step 3 ", scope, " validation")
