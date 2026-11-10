# Run from the project root. Regression checks for meaningful decision rules.
if (.Platform$OS.type == "windows") invisible(Sys.setlocale("LC_CTYPE", "English_United States.UTF-8"))
source("shiny/i18n.R")
source("shiny/helpers.R")
p <- load_dashboard_data(".")
all_cat <- function(cat, budget = Inf, ng = nutri_levels, eg = environment_levels, unknown = TRUE)
  filter_products(p, cat, budget, ng, eg, unknown)
stopifnot(nrow(all_cat("biscuits")) == 149L,
          nrow(all_cat("fruit_juices")) == 150L,
          nrow(all_cat("biscuits", 0)) == 0L,
          nrow(all_cat("biscuits", ng = character(), unknown = FALSE)) == 0L,
          nrow(all_cat("biscuits", eg = character(), unknown = FALSE)) == 0L,
          nrow(all_cat("biscuits", unknown = FALSE)) == 146L,
          all(all_cat("fruit_juices")$target_unit == "L"),
          all(all_cat("dark_chocolates")$target_unit == "kg"),
          names(product_table(all_cat("fruit_juices")))[3] == "EUR/L",
          names(product_table(all_cat("dark_chocolates")))[3] == "EUR/kg")
# Missing grades pass their own dimension only, not the budget or the other grade.
synthetic <- p[rep(1, 4), ]
synthetic$code <- as.character(1:4); synthetic$category <- "biscuits"
synthetic$representative_price <- c(2, 2, 2, 20)
synthetic$nutri_grade <- c(NA, "a", NA, NA)
synthetic$environment_grade <- c("f", NA, "a-plus", "a-plus")
stopifnot(identical(filter_products(synthetic, "biscuits", 5, "a", "a-plus", TRUE)$code, c("2", "3")))
stopifnot(match("a-plus", environment_levels) < match("a", environment_levels),
          match("f", environment_levels) == 7L)
stopifnot(abs(view_association(all_cat("biscuits"), "environment_grade")$rho - .029616135379307174) < 1e-10,
          grepl("Very little", explain_view(all_cat("biscuits"), "environment_grade")$title),
          grepl("saturated fat", explain_view(all_cat("dark_chocolates"), "sugars_100g")$body),
          grepl("No products", explain_view(p[FALSE, ], "nutri_score")$title),
          grepl("Too little", explain_view(p[1, ], "nutri_score")$title),
          grepl("Unknown row", explain_view(all_cat("biscuits"), "environment_grade", "read")$body),
          metric_spec("fiber_100g", "L")$label == "Fibre g / 100 ml")
alt <- cheaper_options(p, "3350031923081")
stopifnot("3410280136257" %in% alt$code, all(alt$representative_price < 7.36))
# Reconcile every dominance decision with the executed EDA, not a duplicate formula.
candidates <- sum(vapply(p$code[p$joint_grades_price], function(code) nrow(cheaper_options(p, code)) > 0L, logical(1)))
stopifnot(candidates == 562L)
library(shiny); library(ggplot2)
products <- p
source("shiny/server.R")
testServer(server, {
  session$setInputs(category = "biscuits", budget = 10, nutrition = nutri_levels,
                   environment = environment_levels, unknown = TRUE)
  stopifnot(nrow(scatter_data()) == nrow(filtered()), nrow(filtered()) > 0L,
            all(filtered()$representative_price <= 10))
  session$setInputs(product_a = "3350031923081", product_b = "3410280136257")
  stopifnot(nrow(pair()) == 2L, grepl("45.7", output$price_gap, fixed = TRUE))
  session$setInputs(budget = 0)
  stopifnot(nrow(filtered()) == 0L, nrow(pair()) == 2L,
            grepl("A = no; B = no", output$selection_status, fixed = TRUE))
  session$setInputs(category = "fruit_juices", budget = 14)
  stopifnot(nrow(category_data()) == 150L, all(filtered()$target_unit == "L"),
            nrow(scatter_data()) == nrow(filtered()))
  initial_count <- nrow(filtered())
  session$setInputs(audience = "supplier")
  stopifnot(grepl("retail-positioning", guidance()$title), grepl("wholesale", guidance()$meaning),
            grepl("Demand, margins and inventory", guidance()$next_data), nrow(filtered()) == initial_count)
  session$setInputs(audience = "consumer")
  stopifnot(grepl("shopping comparison", guidance()$title), nrow(filtered()) == initial_count)
  # Search drives chart, pagination and the shared CSV source together.
  juice_code <- category_data()$code[1]
  session$setInputs(search = juice_code)
  stopifnot(nrow(filtered()) == 1L, filtered()$code == juice_code,
            nrow(page_products()) == 1L, nrow(plot_data()) == 1L)
  session$setInputs(search = "no-such-product-!@#")
  stopifnot(nrow(filtered()) == 0L, nrow(page_products()) == 0L,
            grepl("No products", explanation()$title))
  session$setInputs(search = "", multiple_offers = TRUE, metric = "fiber_100g", sort = "price_desc")
  stopifnot(all(filtered()$n_valid_regular_offers >= 2L), nrow(page_products()) == 12L,
            nrow(plot_data()) == sum(is.finite(filtered()$fiber_100g)),
            all(diff(page_products()$representative_price) <= 0))
  first_page <- page_products()$code
  session$setInputs(next_page = 1L)
  stopifnot(page_number() == 2L, !any(page_products()$code %in% first_page))
  session$setInputs(previous_page = 1L, metric = "environment_grade")
  d <- plot_data()
  session$setInputs(scatter_brush = list(xmin = min(d$representative_price), xmax = max(d$representative_price), ymin = min(d$view_value), ymax = max(d$view_value)))
  stopifnot(nrow(brushed()) == nrow(plot_data()))
  session$setInputs(zoom_brush = 1L)
  stopifnot(!is.null(zoom()), nrow(visible_data()) == nrow(plot_data()), grepl("Zoomed view", output$plot_coverage))
  session$setInputs(reset_zoom = 1L)
  stopifnot(is.null(zoom()))
  # A language change must only affect presentation, including the live narrative.
  session$setInputs(product_a = category_data()$code[1], product_b = category_data()$code[2])
  snapshot <- list(codes = filtered()$code, page = page_number(), pair = pair()$code,
                   metric = metric(), zoom = zoom())
  session$setInputs(lang = "zh")
  stopifnot(grepl("当前筛选样本", explanation()$note),
            grepl("购物比较", guidance()$title),
            grepl("当前筛选匹配", output$filtered_count),
            identical(snapshot, list(codes = filtered()$code, page = page_number(), pair = pair()$code,
                                    metric = metric(), zoom = zoom())))
  session$setInputs(lang = "en")
  stopifnot(grepl("Current filtered sample", explanation()$note),
            grepl("category products", output$filtered_count),
            identical(filtered()$code, snapshot$codes))
})
cat("PASS: data contract, 562 EDA candidates, live explanations, numerical coverage, search, sorting, pagination, quote filters, brush/zoom and comparison state.\n")
