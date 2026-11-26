# Run from the project root. Regression checks for the Find/Compare dashboard helpers.
source("shiny/helpers.R")
p <- load_dashboard_data(".")
stopifnot(nrow(p) == 598L, "subtype" %in% names(p), sum(!is.na(p$subtype)) > 100L)

cereals <- scope_products(p, "breakfast_cereals", "crunchy_muesli")
stopifnot(nrow(cereals) > 0L, all(cereals$category == "breakfast_cereals"),
          all(cereals$subtype == "crunchy_muesli"))

biscuits <- filter_find_products(p, "biscuits", range = c(0, 10), nutrition = "through-c")
stopifnot(nrow(biscuits) > 0L, all(biscuits$representative_price <= 10),
          all(is.na(biscuits$nutri_grade) | match(as.character(biscuits$nutri_grade), nutri_levels) <= match("c", nutri_levels)))

ref <- p[p$code == "3350031923081", , drop = FALSE]
alts <- comparison_rows(p, ref, same_type = TRUE, lower_price = TRUE, nutrition = TRUE, environment = TRUE)
stopifnot(nrow(ref) == 1L, nrow(alts) >= 1L, all(alts$price_delta < 0),
          "3410280136257" %in% alts$code || any(alts$representative_price < ref$representative_price))

q <- load_dashboard_quotes(".", p$code)
stopifnot(nrow(q) > 1000L, all(q$code %in% p$code), all(q$unit_price > 0))

stopifnot(names(product_table(scope_products(p, "fruit_juices")))[3] == "EUR/L",
          names(product_table(scope_products(p, "dark_chocolates")))[3] == "EUR/kg",
          identical(grade_change("c", "a", nutri_levels), "better"),
          identical(grade_change("a", "c", nutri_levels), "worse"),
          identical(grade_change(NA_character_, "a", nutri_levels), "missing"),
          tr("find_tab", "zh") == "找商品")

library(shiny)
library(ggplot2)
products <- p
quotes <- q
source("shiny/server.R")
testServer(server, {
  session$setInputs(category = "biscuits", subtype = "", price_range = c(0, 10),
                    nutrition = "", environment = "", multiple_offers = "", search = "", sort = "low")
  stopifnot(nrow(filtered()) > 0L, all(filtered()$representative_price <= 10),
            all(filtered()$category == "biscuits"))
  session$setInputs(selected_code = filtered()$code[1])
  stopifnot(!is.null(selected_product()), selected_product()$code == filtered()$code[1])
  session$setInputs(search = "no-such-product-!@#")
  stopifnot(nrow(filtered()) == 0L)
  session$setInputs(search = "", category = "fruit_juices")
  bounds <- price_bounds()
  session$setInputs(price_range = bounds)
  stopifnot(nrow(scoped()) == 150L, all(scoped()$target_unit == "L"))
  session$setInputs(category = "breakfast_cereals", subtype = "crunchy_muesli")
  session$setInputs(price_range = price_bounds())
  code <- scoped()$code[1]
  session$setInputs(selected_code = code)
  stopifnot(identical(selected_code(), code))
  session$setInputs(compare_selected = 1L)
  stopifnot(identical(reference_code(), code))
  session$setInputs(crit_price = TRUE, crit_nutrition = TRUE, crit_environment = TRUE,
                    scope = "type", use_range = FALSE)
  stopifnot(nrow(alternatives()) >= 0L)
})
message("Dashboard checks passed.")
