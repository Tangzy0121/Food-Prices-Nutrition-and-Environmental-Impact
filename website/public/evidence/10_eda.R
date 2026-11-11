# Step 4: descriptive, within-category analysis of the unchanged frozen_v1 data.
run_step4 <- function() {
  required <- c("dplyr", "tidyr", "readr", "ggplot2", "jsonlite", "digest")
  missing <- required[!vapply(required, requireNamespace, logical(1), quietly = TRUE)]
  if (length(missing)) stop("Missing packages: ", paste(missing, collapse = ", "))
  suppressPackageStartupMessages(library(dplyr))
  suppressPackageStartupMessages(library(tidyr))
  suppressPackageStartupMessages(library(ggplot2))
  options(stringsAsFactors = FALSE)
  if (.Platform$OS.type == "windows") invisible(Sys.setlocale("LC_CTYPE", "English_United States.UTF-8"))
  root <- "data/processed/frozen_v1"
  out <- "outputs/step4"
  for (sub in c("tables", "figures")) dir.create(file.path(out, sub), recursive = TRUE, showWarnings = FALSE)
  write_table <- function(x, name) readr::write_csv(x, file.path(out, "tables", paste0(name, ".csv")), na = "")
  write_text <- function(lines, path) {
    con <- file(path, open = "wb"); on.exit(close(con))
    writeLines(enc2utf8(sub("[[:blank:]]+$", "", lines)), con, useBytes = TRUE)
  }
  manifest <- jsonlite::read_json(file.path(root, "manifest.json"), simplifyVector = TRUE)
  needed <- file.path(root, c("analysis_products.rds", "selected_products.rds", "price_observations.rds", "prices_by_year.csv"))
  input_hashes <- tibble(file = needed, sha256 = vapply(needed, function(f) {
    bytes <- readBin(f, what = "raw", n = file.info(f)$size)
    digest::digest(bytes, algo = "sha256", serialize = FALSE)
  }, character(1)))
  expected <- manifest$files
  hash_check <- left_join(input_hashes, rename(expected, expected_sha256 = sha256), by = "file")
  stopifnot(nrow(hash_check) == 4L, all(!is.na(hash_check$expected_sha256)), all(hash_check$sha256 == hash_check$expected_sha256))
  p <- readRDS(file.path(root, "analysis_products.rds"))
  selected <- readRDS(file.path(root, "selected_products.rds"))
  prices <- readRDS(file.path(root, "price_observations.rds"))
  yearly <- readr::read_csv(file.path(root, "prices_by_year.csv"), col_types = readr::cols(code = readr::col_character(), .default = readr::col_guess()), show_col_types = FALSE)
  stopifnot(nrow(p) == 598L, nrow(selected) == 600L, nrow(prices) == 1541L,
    is.character(p$code), !anyDuplicated(p$code), !anyDuplicated(prices$price_id),
    setequal(p$code, selected$code[selected$in_primary]),
    all(prices$code %in% selected$code), all(p$in_primary),
    sum(p$joint_grades_price) == 568L, all(is.finite(p$representative_price)), all(p$representative_price > 0),
    all(p$unit_basis == p$target_unit), all(p$nutriscore_algorithm_version[p$has_nutri] == "2023"))
  # Recompute every product median from the imported observations, independently.
  medians <- prices %>% filter(code %in% p$code, price_is_discounted %in% FALSE, representative_keep,
    is.finite(unit_price_eur)) %>% group_by(code) %>% summarise(recomputed = median(unit_price_eur), .groups = "drop")
  median_check <- left_join(select(p, code, representative_price), medians, by = "code")
  stopifnot(!anyNA(median_check$recomputed), max(abs(median_check$representative_price - median_check$recomputed)) < 1e-9)
  source("R/09b_restore_environment_grades.R", encoding = "UTF-8")
  corrected <- prepare_step4_inputs(selected)
  selected <- corrected$selected
  p <- selected[selected$in_primary, ]
  category_order <- c("biscuits", "breakfast_cereals", "dark_chocolates", "fruit_juices")
  category_labels <- c(biscuits = "Biscuits (EUR/kg)", breakfast_cereals = "Breakfast cereals (EUR/kg)",
    dark_chocolates = "Dark chocolate (EUR/kg)", fruit_juices = "Fruit juices (EUR/L)")
  env_levels <- c("a-plus", "a", "b", "c", "d", "e", "f")
  p <- p %>% mutate(category = factor(category, levels = category_order),
    category_label = factor(unname(category_labels[as.character(category)]), levels = unname(category_labels)),
    nutri_grade = ordered(nutri_grade, levels = letters[1:5]),
    environment_grade = ordered(environment_grade, levels = env_levels))
  stopifnot(!anyNA(p$category), sum(!is.na(p$nutri_grade)) == sum(p$has_nutri),
    sum(!is.na(p$environment_grade)) == sum(p$has_environment))
  category_summary <- p %>% group_by(category, target_unit) %>% summarise(n = n(),
    median_price = median(representative_price), q1_price = quantile(representative_price, .25),
    q3_price = quantile(representative_price, .75), min_price = min(representative_price), max_price = max(representative_price),
    n_nutri = sum(!is.na(nutri_grade)), n_environment = sum(!is.na(environment_grade)), n_joint = sum(joint_grades_price),
    n_single_offer = sum(n_valid_regular_offers == 1), n_multiple_offers = sum(n_valid_regular_offers >= 2),
    n_two_years = sum(n_price_years == 2), .groups = "drop")
  coverage <- p %>% group_by(category, category_label) %>% summarise(
    Price = n(), `Nutri-Score 2023` = sum(!is.na(nutri_grade)), `Environment grade` = sum(!is.na(environment_grade)),
    `Joint grades and price` = sum(joint_grades_price), Sugars = sum(!is.na(sugars_100g)),
    Fibre = sum(!is.na(fiber_100g)), `Carbon 3.2` = sum(carbon_primary), .groups = "drop") %>%
    pivot_longer(-c(category, category_label), names_to = "indicator", values_to = "n_available") %>%
    left_join(select(category_summary, category, n), by = "category") %>% mutate(n_missing = n - n_available)
  exclusions <- selected %>% count(category, exclusion_reason, name = "n")
  grade_distribution <- bind_rows(
    p %>% transmute(category, dimension = "nutrition", grade = as.character(nutri_grade)),
    p %>% transmute(category, dimension = "environment", grade = as.character(environment_grade))) %>%
    count(category, dimension, grade, name = "n", .drop = FALSE)
  missing_comparison <- p %>% mutate(coverage_group = if_else(joint_grades_price, "joint_complete", "joint_missing")) %>%
    group_by(category, coverage_group) %>% summarise(n = n(), median_price = median(representative_price),
      median_offers = median(n_valid_regular_offers), .groups = "drop")
  grade_prices <- bind_rows(
    p %>% transmute(category, dimension = "nutrition", grade = as.character(nutri_grade), price = representative_price),
    p %>% transmute(category, dimension = "environment", grade = as.character(environment_grade), price = representative_price)) %>%
    filter(!is.na(grade)) %>% group_by(category, dimension, grade) %>% summarise(n = n(), median_price = median(price),
      q1_price = quantile(price, .25), q3_price = quantile(price, .75), .groups = "drop")
  rho <- function(x, y) {
    ok <- is.finite(x) & is.finite(y)
    if (sum(ok) < 3 || length(unique(x[ok])) < 2 || length(unique(y[ok])) < 2) return(NA_real_)
    unname(cor(x[ok], y[ok], method = "spearman"))
  }
  metrics <- c("nutri_score", "environment_score", "sugars_100g", "saturated_fat_100g", "fiber_100g")
  associations <- bind_rows(lapply(category_order, function(cat) {
    d <- p[p$category == cat, ]
    bind_rows(lapply(metrics, function(metric) {
      ok <- is.finite(d$representative_price) & is.finite(d[[metric]])
      tibble(category = cat, metric = metric, n = sum(ok), unique_metric = n_distinct(d[[metric]][ok]),
        rho = rho(d$representative_price, d[[metric]]),
        better_direction = if (metric %in% c("environment_score", "fiber_100g")) "higher" else "lower")
    }))
  }))
  # Grade orders below encode ordering only; no distance between grades is assumed.
  joint <- p %>% filter(joint_grades_price) %>% mutate(nutri_rank = as.integer(nutri_grade),
    environment_rank = as.integer(environment_grade), n_cheaper_no_worse = 0L,
    n_weakly_dominating = 0L, best_alternative_code = NA_character_, best_alternative_price = NA_real_)
  for (cat in category_order) {
    ids <- which(joint$category == cat)
    for (i in ids) {
      cheaper <- ids[joint$representative_price[ids] < joint$representative_price[i] - 1e-9 &
        joint$nutri_rank[ids] <= joint$nutri_rank[i] & joint$environment_rank[ids] <= joint$environment_rank[i]]
      dominated <- ids[joint$representative_price[ids] <= joint$representative_price[i] + 1e-9 &
        joint$nutri_rank[ids] <= joint$nutri_rank[i] & joint$environment_rank[ids] <= joint$environment_rank[i] &
        (joint$representative_price[ids] < joint$representative_price[i] - 1e-9 |
          joint$nutri_rank[ids] < joint$nutri_rank[i] | joint$environment_rank[ids] < joint$environment_rank[i])]
      joint$n_cheaper_no_worse[i] <- length(cheaper)
      joint$n_weakly_dominating[i] <- length(dominated)
      if (length(cheaper)) {
        j <- cheaper[order(joint$representative_price[cheaper], joint$code[cheaper])][1]
        joint$best_alternative_code[i] <- joint$code[j]
        joint$best_alternative_price[i] <- joint$representative_price[j]
      }
    }
  }
  joint <- joint %>% mutate(on_frontier = n_weakly_dominating == 0L,
    potential_price_difference_pct = 100 * (representative_price - best_alternative_price) / representative_price)
  stopifnot(nrow(joint) == sum(p$joint_grades_price), all(joint$n_cheaper_no_worse <= joint$n_weakly_dominating),
    all(joint$potential_price_difference_pct[!is.na(joint$best_alternative_code)] > 0))
  joint_summary <- joint %>% group_by(category) %>% summarise(n = n(), n_frontier = sum(on_frontier),
    n_with_cheaper_no_worse = sum(n_cheaper_no_worse > 0), pct_with_cheaper_no_worse = 100 * mean(n_cheaper_no_worse > 0), .groups = "drop")
  joint_cells <- joint %>% group_by(category, category_label, nutri_grade, environment_grade) %>%
    summarise(n = n(), median_price = median(representative_price), .groups = "drop") %>%
    left_join(select(category_summary, category, category_median = median_price), by = "category") %>%
    mutate(relative_price = median_price / category_median)
  alternatives <- joint %>% filter(n_cheaper_no_worse > 0) %>%
    select(category, code, product_name, representative_price, nutri_grade, environment_grade,
      best_alternative_code, best_alternative_price, potential_price_difference_pct) %>%
    left_join(p %>% transmute(best_alternative_code = code, alternative_name = product_name,
      alternative_nutri_grade = nutri_grade, alternative_environment_grade = environment_grade), by = "best_alternative_code")
  # Re-evaluate associations on identical goods for each changed price definition.
  variants <- bind_rows(
    p %>% transmute(code, scenario = "keep_duplicate_quotes", price_value = median_with_repeats),
    p %>% transmute(code, scenario = "include_discounts", price_value = median_all_prices),
    p %>% filter(n_valid_regular_offers >= 2) %>% transmute(code, scenario = "at_least_two_offers", price_value = representative_price),
    yearly %>% filter(code %in% p$code) %>% transmute(code, scenario = paste0("year_", year), price_value = representative_price),
    p %>% filter(is.finite(energy_kcal_100g), energy_kcal_100g > 0) %>%
      transmute(code, scenario = "per_100_kcal", price_value = representative_price * 10 / energy_kcal_100g)) %>%
    filter(is.finite(price_value), price_value > 0)
  sensitivity <- variants %>% left_join(select(p, code, category, representative_price, all_of(metrics)), by = "code") %>%
    group_by(category, scenario) %>% group_modify(function(d, key) {
      bind_rows(lapply(metrics, function(metric) {
        ok <- is.finite(d[[metric]])
        tibble(metric = metric, n = sum(ok), rho_main_same_goods = rho(d$representative_price[ok], d[[metric]][ok]),
          rho_variant = rho(d$price_value[ok], d[[metric]][ok]))
      }))
    }) %>% ungroup() %>% left_join(select(associations, category, metric, rho_main_full = rho), by = c("category", "metric"))
  price_sensitivity <- variants %>% filter(scenario != "per_100_kcal") %>%
    left_join(select(p, code, category, representative_price), by = "code") %>%
    group_by(category, scenario) %>% summarise(n = n(), n_changed = sum(abs(price_value - representative_price) > 1e-9),
      median_change_pct = median(100 * (price_value / representative_price - 1)),
      median_absolute_change_pct = median(abs(100 * (price_value / representative_price - 1))), .groups = "drop")
  yearly_paired <- yearly %>% filter(code %in% p$code, is.finite(representative_price), representative_price > 0) %>%
    select(code, year, representative_price) %>% pivot_wider(names_from = year, values_from = representative_price, names_prefix = "year_") %>%
    filter(!is.na(year_2024), !is.na(year_2025)) %>% left_join(select(p, code, category), by = "code") %>%
    mutate(change_pct = 100 * (year_2025 / year_2024 - 1))
  yearly_summary <- yearly_paired %>% group_by(category) %>% summarise(n = n(), median_change_pct = median(change_pct),
    q1 = quantile(change_pct, .25), q3 = quantile(change_pct, .75), .groups = "drop")
  # Carbon estimates are shared standard-food mappings: aggregate to references.
  carbon_references <- p %>% filter(carbon_primary) %>% group_by(category, category_label, agribalyse_food_code,
    agribalyse_proxy_food_code, agribalyse_name, co2_total) %>% summarise(n_products = n(),
      median_price = median(representative_price), .groups = "drop")
  carbon_summary <- carbon_references %>% group_by(category) %>% summarise(n_products = sum(n_products), n_references = n(),
    n_carbon_values = n_distinct(co2_total), rho_reference_medians = rho(median_price, co2_total), .groups = "drop")
  outliers <- p %>% group_by(category) %>% mutate(log_price = log10(representative_price),
    lower_log_fence = quantile(log_price, .25) - 1.5 * IQR(log_price),
    upper_log_fence = quantile(log_price, .75) + 1.5 * IQR(log_price),
    log_iqr_flag = log_price < lower_log_fence | log_price > upper_log_fence) %>% ungroup() %>%
    select(category, code, product_name, quantity_text, quantity_status, representative_price,
      n_valid_regular_offers, n_stores, first_price_date, last_price_date, log_iqr_flag)
  tables <- list(category_summary = category_summary, coverage = coverage, exclusions = exclusions,
    grade_distribution = grade_distribution, missingness_comparison = missing_comparison, price_by_grade = grade_prices,
    associations = associations, joint_summary = joint_summary, joint_cells = joint_cells,
    comparison_candidates = alternatives, association_sensitivity = sensitivity,
    price_sensitivity = price_sensitivity, paired_year_prices = yearly_paired, paired_year_summary = yearly_summary,
    carbon_references = carbon_references, carbon_summary = carbon_summary, product_price_review = outliers,
    input_hashes = input_hashes, environment_grade_corrections = corrected$corrections)
  for (name in names(tables)) write_table(tables[[name]], name)
  saveRDS(joint, file.path(out, "joint_products.rds"))
  saveRDS(p, file.path(out, "analysis_products.rds"))
  palette_env <- c("a-plus" = "#145A32", a = "#32945A", b = "#8AB66B", c = "#D9BC60", d = "#D98247", e = "#B94A48", f = "#7E283B")
  theme_set(theme_minimal(base_size = 11, base_family = "sans") + theme(
    plot.title = element_text(face = "bold", size = 16, colour = "#183B35"), plot.subtitle = element_text(size = 11),
    panel.grid.minor = element_blank(), strip.text = element_text(face = "bold", colour = "#183B35"),
    plot.caption = element_text(hjust = 0, size = 9, colour = "#5D6864"), legend.position = "bottom"))
  plots <- list()
  plots$`01_coverage` <- ggplot(coverage, aes(x = indicator, y = category_label, fill = n_available / n)) +
    geom_tile(colour = "white", linewidth = 1) + geom_text(aes(label = paste0(n_available, "/", n)), size = 3.5) +
    scale_fill_gradient(low = "#F1E6CE", high = "#73AD91", limits = c(0, 1), guide = "none") +
    labs(title = "Which comparisons does the sample support?", x = NULL, y = NULL,
      caption = "Counts refer to independent products in the 598-product primary sample.") + theme(axis.text.x = element_text(angle = 25, hjust = 1))
  plots$`02_price_distribution` <- ggplot(p, aes(x = "", y = representative_price)) +
    geom_boxplot(fill = "#B8D6C6", outlier.shape = NA, width = .5) +
    geom_point(size = 1.3, alpha = .45, colour = "#24594A", position = position_jitter(width = .13, height = 0, seed = 20261105)) +
    facet_wrap(~category_label, scales = "free_y") + scale_y_log10() + labs(title = "Price dispersion within each food category", x = NULL,
      y = "Representative unit price (log scale)", caption = "Non-discounted median prices. Independent panel scales; mass: EUR/kg, juices: EUR/L.")
  plots$`03_price_nutrition` <- ggplot(filter(p, !is.na(nutri_grade)), aes(nutri_grade, representative_price)) +
    geom_boxplot(fill = "#D4E5D9", outlier.shape = NA) + geom_point(alpha = .45, size = 1.3,
      position = position_jitter(width = .12, height = 0, seed = 20261105), colour = "#24594A") +
    facet_wrap(~category_label, scales = "free_y") + scale_y_log10() +
    labs(title = "Does a higher price accompany a better nutrition grade?", x = "Nutri-Score 2023 grade (A is better)",
      y = "Representative unit price (log scale)", caption = "Every dot is one product. Sparse grade cells need care; missing grades are excluded only in this view.")
  plots$`04_price_sugars` <- ggplot(filter(p, is.finite(sugars_100g)), aes(representative_price, sugars_100g)) +
    geom_point(alpha = .6, size = 1.6, colour = "#326C5B") + scale_x_log10() + facet_wrap(~category_label, scales = "free") +
    labs(title = "What does price tell us about sugar content?", x = "Representative unit price (log scale)",
      y = "Sugars (g per 100 g / 100 ml)", caption = "Within-category descriptive comparison; no causal or clinical interpretation.")
  plots$`05_price_environment` <- ggplot(filter(p, !is.na(environment_grade)), aes(environment_grade, representative_price, fill = environment_grade)) +
    geom_boxplot(outlier.shape = NA) + geom_point(alpha = .45, size = 1.2,
      position = position_jitter(width = .12, height = 0, seed = 20261105)) +
    scale_fill_manual(values = palette_env, guide = "none") + scale_y_log10() + facet_wrap(~category_label, scales = "free_y") +
    scale_x_discrete(labels = c("a-plus" = "A+", a = "A", b = "B", c = "C", d = "D", e = "E", f = "F")) +
    labs(title = "How does price vary across environmental grades?", x = "Environmental grade (A+ is better)",
      y = "Representative unit price (log scale)", caption = "Composite environmental grades are analysed separately from carbon estimates.")
  plots$`06_joint_comparison` <- ggplot(joint_cells, aes(nutri_grade, environment_grade, fill = relative_price)) +
    geom_tile(colour = "white", linewidth = 1) + geom_text(aes(label = paste0("n=", n, "\n", sprintf("%.2f", median_price))), size = 3) +
    facet_wrap(~category_label) + scale_fill_gradient2(low = "#87B09A", mid = "#F4F0DE", high = "#C87248", midpoint = 0, trans = "log10") +
    scale_y_discrete(labels = c("a-plus" = "A+", a = "A", b = "B", c = "C", d = "D", e = "E", f = "F"), limits = rev(env_levels)) +
    labs(title = "Nutrition, environment and price together", x = "Nutrition grade (A is better)", y = "Environment grade",
      fill = "Price / category median", caption = "Labels: product count and actual median unit price. Colour: price relative to the category median. Empty cells: no products.")
  sensitivity_plot <- sensitivity %>% filter(metric %in% c("nutri_score", "environment_score")) %>%
    mutate(scenario = factor(scenario, levels = c("keep_duplicate_quotes", "include_discounts", "at_least_two_offers", "year_2024", "year_2025", "per_100_kcal")))
  plots$`07_sensitivity` <- ggplot(sensitivity_plot, aes(x = rho_main_same_goods, xend = rho_variant, y = scenario, colour = metric)) +
    geom_vline(xintercept = 0, colour = "#CCCCCC") + geom_segment(position = position_dodge(width = .4), linewidth = .8) +
    geom_point(aes(x = rho_variant), position = position_dodge(width = .4), size = 2) +
    facet_wrap(~category) + scale_colour_manual(values = c(nutri_score = "#2D7963", environment_score = "#BC6840")) +
    coord_cartesian(xlim = c(-1, 1)) + labs(title = "Do price definitions change the observed associations?", x = "Spearman correlation", y = NULL,
      colour = NULL, caption = "Line starts: main price on the same goods. Dots: alternative price. Nutrition: lower score is better; environment: higher is better.")
  plots$`08_carbon_references` <- ggplot(carbon_references, aes(median_price, co2_total, size = n_products)) +
    geom_point(alpha = .7, colour = "#3D7C66") + scale_x_log10() + facet_wrap(~category_label, scales = "free") +
    labs(title = "Carbon estimates at the standard-food reference level", x = "Median unit price of mapped products (log scale)",
      y = "Model estimate (kg CO2e/kg food)", size = "Products mapped",
      caption = "One dot per reference and carbon value. Juices retain EUR/L prices; carbon stays on the original mass basis.")
  for (name in names(plots)) {
    height <- if (name == "01_coverage") 4.5 else if (name == "02_price_distribution") 5 else 7
    ggsave(file.path(out, "figures", paste0(name, ".png")), plots[[name]], width = 11, height = height,
      dpi = 160, bg = "white")
  }
  saveRDS(tables, file.path(out, "tables.rds"))
  write_text(capture.output(sessionInfo()), file.path(out, "sessionInfo.txt"))
  result <- list(tables = tables, products = p, joint = joint, figures = paste0(names(plots), ".png"))
  write_text(c("PASS: four frozen input hashes match the upstream snapshot manifest.",
    paste0("PASS: 600 selected / 598 primary / ", nrow(joint), " joint products; 1541 linked observations; keys and joins checked."),
    "PASS: 16 environmental F grades restored from the hash-verified original responses; French scores paired with French grades.",
    "PASS: all 598 representative prices recomputed from the imported price observations.",
    "PASS: comparison candidates obey within-category lower-price and no-worse-grade rules.",
    "Scope: Step 4 validates imported inputs and calculations; upstream raw-source acquisition was not rerun."), file.path(out, "validation.txt"))
  message("STEP 4 COMPLETE: ", nrow(p), " products, ", length(tables), " tables, ", length(plots), " figures.")
  result
}
