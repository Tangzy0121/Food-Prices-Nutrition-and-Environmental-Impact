# Run from the project root. Regression checks for meaningful decision rules.
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
})
cat("PASS: data contract, missing-grade semantics, empty sets, kg/L, 562 EDA candidates and Shiny reactive interactions.\n")
