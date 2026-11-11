# Shared, deterministic data and comparison rules. No network calls.
category_names <- c(biscuits = "Biscuits", breakfast_cereals = "Breakfast cereals",
                    dark_chocolates = "Dark chocolate", fruit_juices = "Fruit juices")
nutri_levels <- letters[1:5]
environment_levels <- c("a-plus", letters[1:6])
grade_label <- function(x) ifelse(is.na(x), "Unknown", ifelse(x == "a-plus", "A+", toupper(x)))

load_dashboard_data <- function(root) {
  path <- file.path(root, "data/analysis_products.rds")
  if (!file.exists(path)) path <- file.path(root, "data/processed/step4_v1_1/analysis_products.rds")
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

metric_spec <- function(metric, unit = "kg") {
  nutrient_unit <- if (unit == "L") "g / 100 ml" else "g / 100 g"
  switch(metric,
    environment_grade = list(label = tr("Environmental grade"), field = "environment_score", better = tr("higher"), ordered = TRUE),
    environment_score = list(label = tr("Environmental score (higher is better)"), field = "environment_score", better = tr("higher"), ordered = FALSE),
    nutri_score = list(label = tr("Nutrition score (lower is better)"), field = "nutri_score", better = tr("lower"), ordered = FALSE),
    sugars_100g = list(label = paste(tr("Sugars"), nutrient_unit), field = "sugars_100g", better = "context", ordered = FALSE),
    saturated_fat_100g = list(label = paste(tr("Saturated fat"), nutrient_unit), field = "saturated_fat_100g", better = "context", ordered = FALSE),
    fiber_100g = list(label = paste(tr("Fibre"), nutrient_unit), field = "fiber_100g", better = "context", ordered = FALSE),
    stop("Unknown chart metric"))
}

scatter_products <- function(d, metric) {
  if (metric == "environment_grade") {
    d$view_value <- match(as.character(d$environment_grade), environment_levels)
    d$view_value[is.na(d$view_value)] <- 8L
  } else d$view_value <- d[[metric]]
  d$nutrition_label <- factor(grade_label(d$nutri_grade), levels = c(LETTERS[1:5], "Unknown"))
  d
}

view_association <- function(d, metric) {
  field <- metric_spec(metric)$field
  ok <- is.finite(d$representative_price) & is.finite(d[[field]])
  x <- d$representative_price[ok]; y <- d[[field]][ok]
  rho <- if (length(x) >= 3L && length(unique(x)) > 1L && length(unique(y)) > 1L) cor(x, y, method = "spearman") else NA_real_
  list(n = sum(ok), rho = rho, field = field)
}

explain_view <- function(d, metric, question = "pattern") {
  spec <- metric_spec(metric, if (nrow(d)) as.character(d$target_unit[1]) else "kg")
  a <- view_association(d, metric)
  note <- sprintf(tr("Current filtered sample: %d products; %d have both values used for this correlation."), nrow(d), a$n)
  if (!nrow(d)) return(list(title = tr("No products match this view"), body = tr("Broaden the budget or grade filters, or clear the product search. Your selected comparison stays available."), note = note, rho = NA_real_))
  if (question == "read") {
    body <- if (spec$ordered) tr("Each point is one product. Left means lower unit price; the top rows have better environmental grades. Colour shows nutrition grade. The Unknown row keeps missing environmental grades visible. Some points overlap.") else paste(tr("Each point is one product. Left means lower unit price; vertical position shows"), tolower(spec$label), tr(". Colour shows nutrition grade. Products missing this numerical value stay in the shortlist but are omitted from the plot."))
    return(list(title = tr("Read the axes, then inspect a point"), body = body, note = note, rho = a$rho))
  }
  if (question == "action") return(list(title = tr("Move from a pattern to a specific choice"), body = tr("Hover over a point for its product profile. Click it to keep it as A, then open Compare. Try a lower-price candidate and check composition, pack size, offer count and dates before deciding whether it fits the same purpose."), note = note, rho = a$rho))
  if (!is.finite(a$rho)) return(list(title = tr("Too little variation to describe a trend"), body = tr("This selection has fewer than three complete products, or constant prices or metric values. Inspect individual products or broaden your filters."), note = note, rho = a$rho))
  direction <- if (a$rho > 0) tr("higher") else tr("lower")
  metric_name <- switch(metric,
    environment_grade = tr("environmental scores"), environment_score = tr("environmental scores"),
    nutri_score = tr("nutrition scores"), sugars_100g = tr("sugar content"),
    saturated_fat_100g = tr("saturated-fat content"), fiber_100g = tr("fibre content"))
  title <- if (abs(a$rho) < .1) tr("Price gives little guidance on this attribute") else sprintf(tr("Higher prices tend to accompany %s %s"), direction, metric_name)
  body <- if (abs(a$rho) < .1) tr("Products at higher prices have a mix of attribute values. Inspect the individual products to compare what you would get for the price.") else sprintf(tr("Across %d complete products, the price and attribute rankings have rho = %+.3f. Points spread around this pattern, so the two-product comparison shows how a specific choice fits it."), a$n, a$rho)
  if (spec$ordered) body <- paste(body, tr("The correlation uses numerical environmental scores; the plotted rows show their ordered grades."))
  if (abs(a$rho) >= .1 && spec$better %in% c(tr("higher"), tr("lower"))) {
    favourable <- (spec$better == tr("higher") && a$rho > 0) || (spec$better == tr("lower") && a$rho < 0)
    body <- paste(body, sprintf(tr("This direction aligns with %s scores at higher prices in this sample."), if (favourable) tr("more favourable") else tr("less favourable")))
  }
  if (metric %in% c("sugars_100g", "saturated_fat_100g") && any(d$category == "dark_chocolates")) {
    sugar <- view_association(d, "sugars_100g")
    fat <- view_association(d, "saturated_fat_100g")
    if (is.finite(sugar$rho) && is.finite(fat$rho)) body <- paste(body, sprintf(tr("In this chocolate selection, sugar has rho = %+.3f and saturated fat has rho = %+.3f. Switch between the two panels to inspect the trade-off."), sugar$rho, fat$rho))
  }
  list(title = title, body = body, note = note, rho = a$rho)
}

category_finding <- function(d) {
  nutrition <- view_association(d, "nutri_score")
  environment <- view_association(d, "environment_score")
  if (!is.finite(nutrition$rho) || !is.finite(environment$rho)) return(tr("Choose a category with enough complete products to compare price and scores."))
  finding <- if (abs(nutrition$rho) < .1 && abs(environment$rho) < .1)
    tr("Higher prices give little guidance on either score in this category. Compare grades and composition directly.") else if (nutrition$rho < 0 && environment$rho > 0)
    tr("Higher-priced products tend to have better nutrition and environmental scores in this category. Individual products vary around this pattern.") else
    tr("The two score relationships point to different product comparisons. Explore each score alongside unit price.")
  paste(finding, sprintf(tr("Nutrition rho = %+.3f (n = %d); environment rho = %+.3f (n = %d)."), nutrition$rho, nutrition$n, environment$rho, environment$n))
}

grade_badge <- function(x) {
  value <- as.character(x)
  shiny::span(class = paste0("grade grade-", ifelse(is.na(value), "unknown", value)), grade_label(value))
}

decision_guidance <- function(d, audience = "consumer") {
  if (!nrow(d)) return(list(title = tr("Start with a usable comparison set"), meaning = tr("No products match the current conditions."), action = tr("Broaden the budget or grades, or clear the search before making a comparison."), next_data = tr("The category overview still shows the full category.")))
  benchmark <- sprintf("%.2f EUR/%s", median(d$representative_price), as.character(d$target_unit[1]))
  if (audience == "supplier") return(list(
    title = tr("Use the shortlist as a retail-positioning benchmark"),
    meaning = sprintf(tr("The median historical retail price of these %d matching products is %s. Use it to locate a product within this comparison set."), nrow(d), benchmark),
    action = tr("Compare a product's price, grades and composition with same-category alternatives. A cheaper option with neither grade worse is a concrete benchmark to inspect when reviewing a premium position or a product brief."),
    next_data = tr("A pricing review would add current competitor prices, internal costs, availability and customer demand.")))
  list(title = tr("Turn the shortlist into a shopping comparison"),
    meaning = sprintf(tr("The median of these %d matching products is %s. Use it to orient your unit-price budget within this food category."), nrow(d), benchmark),
    action = tr("Inspect a product, compare a lower-price candidate, and read both grades plus sugar, saturated fat and fibre. Check that recipe and pack size fit your intended use."),
    next_data = tr("Before buying, compare the current store prices and check that both products fit the same use."))
}

shortlist_html <- function(d, target = "inspect_code") {
  shiny::div(class = "table-scroll", shiny::tags$table(class = "shortlist-table",
    shiny::tags$thead(shiny::tags$tr(lapply(c(tr("Product"), paste0("EUR/", unique(d$target_unit)[1]), tr("Nutrition"), tr("Environment"), tr("Offers"), ""), shiny::tags$th))),
    shiny::tags$tbody(lapply(seq_len(nrow(d)), function(i) shiny::tags$tr(
      shiny::tags$td(class = "product-name", d$product_name[i], shiny::span(class = "barcode", d$code[i])),
      shiny::tags$td(sprintf("%.2f", d$representative_price[i])), shiny::tags$td(grade_badge(d$nutri_grade[i])), shiny::tags$td(grade_badge(d$environment_grade[i])),
      shiny::tags$td(d$n_valid_regular_offers[i]), shiny::tags$td(shiny::tags$button(type = "button", class = "inspect-button", `data-inspect-code` = d$code[i], `data-target` = target, tr("Inspect"))))))))
}
