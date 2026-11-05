# Shared, deterministic data and comparison rules. No network calls.
category_names <- c(biscuits = "Biscuits", breakfast_cereals = "Breakfast cereals",
                    dark_chocolates = "Dark chocolate", fruit_juices = "Fruit juices")
nutri_levels <- letters[1:5]
environment_levels <- c("a-plus", letters[1:6])
grade_label <- function(x) ifelse(is.na(x), "Unknown", ifelse(x == "a-plus", "A+", toupper(x)))

load_dashboard_data <- function(root) {
  path <- file.path(root, "data/processed/step4_v1_1/analysis_products.rds")
  if (!file.exists(path)) stop("Corrected data missing. Run scripts/run_step4.ps1 from the project root first.")
  p <- readRDS(path)
  stopifnot(nrow(p) == 598L, is.character(p$code), !anyDuplicated(p$code),
            sum(p$joint_grades_price) == 583L,
            all(is.na(p$environment_grade) | p$environment_grade %in% environment_levels),
            sum(p$environment_grade == "f", na.rm = TRUE) == 16L,
            all(p$representative_price > 0))
  p
}

filter_products <- function(p, category, budget, nutrition, environment, unknown = FALSE) {
  ng <- as.character(p$nutri_grade); eg <- as.character(p$environment_grade)
  keep <- p$category == category & p$representative_price <= budget &
    ((!is.na(ng) & ng %in% nutrition) | (unknown & is.na(ng))) &
    ((!is.na(eg) & eg %in% environment) | (unknown & is.na(eg)))
  d <- p[which(keep), , drop = FALSE]
  d[order(d$representative_price, d$code), , drop = FALSE]
}

cheaper_options <- function(p, code) {
  a <- p[p$code == code, , drop = FALSE]
  if (nrow(a) != 1L || !a$joint_grades_price) return(p[FALSE, ])
  keep <- p$category == a$category & p$representative_price < a$representative_price &
    match(as.character(p$nutri_grade), nutri_levels) <= match(as.character(a$nutri_grade), nutri_levels) &
    match(as.character(p$environment_grade), environment_levels) <= match(as.character(a$environment_grade), environment_levels)
  d <- p[which(keep), , drop = FALSE]
  d[order(d$representative_price, d$code), , drop = FALSE]
}

product_table <- function(p) {
  result <- data.frame(Barcode = p$code, Product = p$product_name,
    `EUR per kg/L` = round(p$representative_price, 2),
    Nutrition = grade_label(p$nutri_grade), Environment = grade_label(p$environment_grade),
    `Regular offers` = p$n_valid_regular_offers, check.names = FALSE)
  units <- unique(p$target_unit)
  names(result)[3] <- if (length(units) == 1L) paste0("EUR/", units) else "EUR per unit"
  result
}
