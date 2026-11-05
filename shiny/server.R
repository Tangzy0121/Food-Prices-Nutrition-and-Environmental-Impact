server <- function(input, output, session) {
  category_data <- reactive({ req(input$category); products[products$category == input$category, , drop = FALSE] })
  output$budget_ui <- renderUI({
    d <- category_data()
    sliderInput("budget", paste0("Unit-price ceiling (EUR/", unique(d$target_unit), ")"),
      min = 0, max = ceiling(max(d$representative_price)), value = ceiling(max(d$representative_price)), step = .01)
  })
  filtered <- reactive({
    req(input$category, !is.null(input$budget))
    filter_products(products, input$category, input$budget, input$nutrition, input$environment, isTRUE(input$unknown))
  })
  output$overview_count <- renderText({ d <- category_data(); sprintf("%s | %d products | median %.2f EUR/%s", category_names[[input$category]], nrow(d), median(d$representative_price), unique(d$target_unit)) })
  output$distribution <- renderPlot({
    ggplot(category_data(), aes(representative_price)) + geom_histogram(bins = 24, fill = "#427c62", colour = "white") +
      labs(x = paste0("Historical median price (EUR/", unique(category_data()$target_unit), ")"), y = "Products") + theme_minimal(base_size = 13)
  })
  output$coverage <- renderTable({ d <- category_data(); data.frame(Measure = c("Unit price", "Nutrition grade", "Environmental grade", "Both grades and price", "One regular offer"), Products = c(nrow(d), sum(!is.na(d$nutri_grade)), sum(!is.na(d$environment_grade)), sum(d$joint_grades_price), sum(d$n_valid_regular_offers == 1))) })
  output$filtered_count <- renderText(sprintf("%d / %d category products match the current filters", nrow(filtered()), nrow(category_data())))
  scatter_data <- reactive({
    d <- filtered()
    d$environment_row <- match(as.character(d$environment_grade), environment_levels)
    d$environment_row[is.na(d$environment_row)] <- 8L
    d$nutrition_label <- factor(grade_label(d$nutri_grade), levels = c(LETTERS[1:5], "Unknown"))
    d
  })
  output$scatter <- renderPlot({
    d <- scatter_data(); validate(need(nrow(d) > 0, "No matching products. Increase the budget or broaden the selected grades."))
    ggplot(d, aes(representative_price, environment_row, colour = nutrition_label)) +
      geom_point(size = 3, alpha = .7) + scale_y_reverse(breaks = 1:8, labels = c("A+", LETTERS[1:6], "Unknown"), limits = c(8.5, .5)) +
      scale_colour_manual(values = c(A = "#177245", B = "#76a641", C = "#b38a00", D = "#d56a2d", E = "#ac3542", Unknown = "#777777"), drop = FALSE) +
      labs(x = paste0("Historical median price (EUR/", unique(category_data()$target_unit), ")"), y = "Environmental grade", colour = "Nutrition") + theme_minimal(base_size = 13)
  })
  output$results <- renderTable({ validate(need(nrow(filtered()) > 0, "No products match these conditions.")); product_table(filtered()) }, striped = TRUE, rownames = FALSE)
  observeEvent(input$category, {
    d <- category_data(); choices <- setNames(d$code, paste(d$product_name, d$code, sep = " | "))
    updateSelectInput(session, "product_a", choices = choices, selected = d$code[1])
  })
  observeEvent(list(input$product_a, input$category), {
    req(input$product_a)
    d <- category_data(); d <- d[d$code != input$product_a, , drop = FALSE]
    if (!nrow(d)) return()
    chosen <- if (!is.null(input$product_b) && input$product_b %in% d$code) input$product_b else d$code[1]
    updateSelectInput(session, "product_b", choices = setNames(d$code, paste(d$product_name, d$code, sep = " | ")), selected = chosen)
  })
  pair <- reactive({
    req(input$product_a, input$product_b)
    validate(need(input$product_a != input$product_b, "Choose two different products."))
    d <- category_data(); d <- d[match(c(input$product_a, input$product_b), d$code), , drop = FALSE]
    req(!anyNA(d$code)); d
  })
  output$selection_status <- renderText({ d <- pair(); sprintf("In current Discover shortlist: A = %s; B = %s", ifelse(d$code[1] %in% filtered()$code, "yes", "no"), ifelse(d$code[2] %in% filtered()$code, "yes", "no")) })
  output$comparison <- renderTable({
    d <- pair(); nutrient_unit <- if (unique(d$target_unit) == "L") "g / 100 ml" else "g / 100 g"
    values <- function(i) c(d$product_name[i], d$code[i], d$brands[i], d$quantity_text[i], sprintf("%.2f EUR/%s", d$representative_price[i], d$target_unit[i]), grade_label(d$nutri_grade[i]), grade_label(d$environment_grade[i]), round(d$sugars_100g[i], 2), round(d$saturated_fat_100g[i], 2), round(d$fiber_100g[i], 2), d$n_valid_regular_offers[i], d$n_stores[i], as.character(d$first_price_date[i]), as.character(d$last_price_date[i]))
    data.frame(Measure = c("Product", "Barcode", "Brand", "Package", "Historical unit price", "Nutrition", "Environment", paste("Sugars", nutrient_unit), paste("Saturated fat", nutrient_unit), paste("Fibre", nutrient_unit), "Regular offers", "Stores", "First price date", "Last price date"), A = values(1), B = values(2), check.names = FALSE)
  }, na = "Unknown", striped = TRUE)
  output$price_gap <- renderText({ d <- pair(); sprintf("B minus A: %+.2f EUR/%s (%+.1f%% of A's historical unit price)", diff(d$representative_price), d$target_unit[1], 100 * (d$representative_price[2] / d$representative_price[1] - 1)) })
  output$alternatives <- renderTable({
    req(input$product_a); d <- cheaper_options(category_data(), input$product_a)
    validate(need(nrow(d) > 0, "No candidate under this rule, or A has an unknown grade."))
    product_table(utils::head(d, 10))
  }, striped = TRUE)
  output$download <- downloadHandler(filename = function() paste0(input$category, "-shortlist.csv"), content = function(file) {
    readr::write_csv(filtered(), file, na = "")
  })
}
