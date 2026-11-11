# Recover current environmental grade F from the same archived product responses.
# frozen_v1 and all its raw values remain unchanged.
prepare_step4_inputs <- function(selected) {
  path <- "data/raw/open_food_facts/formal_2026-11-02/products_formal.rds"
  frozen <- jsonlite::read_json("data/processed/frozen_v1/manifest.json", simplifyVector = TRUE)
  expected <- frozen$provenance_files$sha256[frozen$provenance_files$file == path]
  actual <- digest::digest(readBin(path, what = "raw", n = file.info(path)$size), algo = "sha256", serialize = FALSE)
  stopifnot(length(expected) == 1L, actual == expected)
  records <- readRDS(path)
  stopifnot(length(records) == 600L, setequal(names(records), selected$code))
  scalar <- function(x) if (is.null(x) || !length(x)) NA_character_ else as.character(x[[1]])
  valid <- function(x) {
    v <- tolower(scalar(x))
    if (is.na(v) || !v %in% c("a-plus", letters[1:6])) NA_character_ else v
  }
  restored <- dplyr::bind_rows(lapply(selected$code, function(cd) {
    z <- records[[cd]]$product
    stopifnot(as.character(z$code) == cd)
    modern <- !is.null(z$environmental_score_data)
    env <- if (modern) z$environmental_score_data else z$ecoscore_data
    fr <- valid(env$grades$fr)
    global <- valid(if (modern) z$environmental_score_grade else z$ecoscore_grade)
    grade <- if (!is.na(fr)) fr else global
    score <- if (!is.na(fr)) env$scores$fr else if (modern) z$environmental_score_score else z$ecoscore_score
    score <- suppressWarnings(as.numeric(scalar(score)))
    if (is.na(grade) || !is.finite(score)) score <- NA_real_
    dplyr::tibble(code = cd, environment_grade_fr = fr, environment_grade_global = global,
      environment_grade = grade, environment_grade_source = if (!is.na(fr)) "France" else if (!is.na(global)) "global_fallback" else NA_character_,
      environment_score = score)
  }))
  before <- selected
  fields <- setdiff(names(restored), "code")
  updated <- dplyr::left_join(dplyr::select(selected, -dplyr::all_of(fields)), restored, by = "code") %>%
    dplyr::mutate(has_environment = !is.na(environment_grade),
      joint_grades_price = in_primary & has_nutri & has_environment)
  updated <- updated[, names(before)]
  untouched <- setdiff(names(before), c(fields, "has_environment", "joint_grades_price"))
  stopifnot(identical(before[, untouched], updated[, untouched]), !anyDuplicated(updated$code))
  changed <- (is.na(before$environment_grade) != is.na(updated$environment_grade)) |
    (!is.na(before$environment_grade) & !is.na(updated$environment_grade) & before$environment_grade != updated$environment_grade) |
    (is.na(before$environment_score) != is.na(updated$environment_score)) |
    (!is.na(before$environment_score) & !is.na(updated$environment_score) & abs(before$environment_score - updated$environment_score) > 1e-9)
  changed[is.na(changed)] <- FALSE
  corrections <- dplyr::tibble(code = before$code, category = before$category, product_name = before$product_name,
    before_grade = before$environment_grade, restored_grade = updated$environment_grade,
    before_score = before$environment_score, restored_fr_score = updated$environment_score,
    in_primary = before$in_primary, source_file = before$source_file) %>% dplyr::filter(changed)
  stopifnot(nrow(corrections) == 16L, all(corrections$restored_grade == "f"),
    all(corrections$in_primary), sum(!is.na(before$environment_grade)) + 16L == sum(!is.na(updated$environment_grade)))
  folder <- "data/processed/step4_v1_1"
  dir.create(folder, recursive = TRUE, showWarnings = FALSE)
  saveRDS(updated, file.path(folder, "selected_products.rds"))
  saveRDS(updated[updated$in_primary, ], file.path(folder, "analysis_products.rds"))
  readr::write_csv(corrections, file.path(folder, "environment_grade_corrections.csv"), na = "")
  jsonlite::write_json(list(version = "step4_v1_1", source_snapshot = "frozen_v1", raw_object_sha256 = actual,
    rule = "Environmental grade order is A+, A, B, C, D, E, F; prefer French grade and French score together.",
    restored_grades = nrow(corrections), n_primary = sum(updated$in_primary), n_environment = sum(updated$in_primary & updated$has_environment),
    n_joint = sum(updated$joint_grades_price), snapshot_policy = "Original frozen_v1 files are unchanged.",
    method_reference = "https://openfoodfacts.github.io/openfoodfacts-server/dev/ref-perl-pod/ProductOpener/Attributes.html"),
    file.path(folder, "manifest.json"), pretty = TRUE, auto_unbox = TRUE)
  list(selected = updated, corrections = corrections)
}
