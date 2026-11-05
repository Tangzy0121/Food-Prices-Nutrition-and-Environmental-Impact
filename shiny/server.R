server <- function(input, output, session) {
  category_data <- reactive({ req(input$category); products[products$category == input$category, , drop = FALSE] })
  output$budget_ui <- renderUI({
    d <- category_data()
    sliderInput("budget", paste0("Unit-price ceiling (EUR/", unique(d$target_unit), ")"),
      min = 0, max = ceiling(max(d$representative_price)), value = ceiling(max(d$representative_price)), step = .01)
  })
  filtered <- reactive({
    req(input$category, !is.null(input$budget))
    d <- filter_products(products, input$category, input$budget, input$nutrition, input$environment, isTRUE(input$unknown))
    if (isTRUE(input$multiple_offers)) d <- d[d$n_valid_regular_offers >= 2L, , drop = FALSE]
    if (!is.null(input$search) && nzchar(trimws(input$search))) {
      query <- tolower(trimws(input$search))
      d <- d[grepl(query, tolower(paste(d$product_name, d$code)), fixed = TRUE), , drop = FALSE]
    }
    d
  })
  output$overview_count <- renderText({ d <- category_data(); sprintf("%s | %d products | median %.2f EUR/%s", category_names[[input$category]], nrow(d), median(d$representative_price), unique(d$target_unit)) })
  output$distribution <- renderPlot({
    d <- category_data()
    ggplot(d, aes(representative_price)) + geom_histogram(bins = 24, fill = "#638a60", colour = "white") +
      geom_vline(xintercept = median(d$representative_price), linetype = "dashed", colour = "#b77537", linewidth = .8) +
      labs(x = paste0("Historical median price (EUR/", unique(d$target_unit), ")"), y = "Products") + theme_minimal(base_size = 12) + theme(panel.grid.minor = element_blank(), panel.grid.major.x = element_blank())
  })
  output$coverage <- renderTable({ d <- category_data(); data.frame(Measure = c("Unit price", "Nutrition grade", "Environmental grade", "Both grades and price", "One regular offer"), Products = c(nrow(d), sum(!is.na(d$nutri_grade)), sum(!is.na(d$environment_grade)), sum(d$joint_grades_price), sum(d$n_valid_regular_offers == 1))) })
  output$filtered_count <- renderText(sprintf("%d / %d category products match the current filters", nrow(filtered()), nrow(category_data())))
  metric <- reactive(if (is.null(input$metric)) "environment_grade" else input$metric)
  scatter_data <- reactive(scatter_products(filtered(), metric()))
  plot_data <- reactive({ d <- scatter_data(); d[is.finite(d$view_value), , drop = FALSE] })
  zoom <- reactiveVal(NULL)
  visible_data <- reactive({
    d <- plot_data(); z <- zoom(); if (is.null(z)) return(d)
    d[d$representative_price >= min(z$x) & d$representative_price <= max(z$x) & d$view_value >= min(z$y) & d$view_value <= max(z$y), , drop = FALSE]
  })
  observeEvent(list(input$category, input$metric), zoom(NULL))
  observeEvent(input$reset_zoom, zoom(NULL))
  observeEvent(input$zoom_brush, { b <- input$scatter_brush; if (!is.null(b)) zoom(list(x = c(b$xmin, b$xmax), y = c(b$ymin, b$ymax))) })
  output$scatter <- renderPlot({
    d <- plot_data(); validate(need(nrow(d) > 0, "No plottable products. Broaden filters or choose another measure."))
    spec <- metric_spec(metric(), unique(category_data()$target_unit))
    g <- ggplot(d, aes(representative_price, view_value, colour = nutrition_label)) +
      geom_point(size = 3.2, alpha = .8) +
      scale_colour_manual(values = c(A = "#268161", B = "#93ac4f", C = "#c5a949", D = "#d58d5c", E = "#b96a72", Unknown = "#929c94"), drop = FALSE) +
      labs(x = paste0("Historical median price (EUR/", unique(category_data()$target_unit), ")"), y = spec$label, colour = "Nutrition") +
      theme_minimal(base_size = 12) + theme(panel.grid.minor = element_blank(), legend.position = "bottom", legend.title = element_text(size = 10))
    if (spec$ordered) g <- g + scale_y_reverse(breaks = 1:8, labels = c("A+", LETTERS[1:6], "Unknown"), limits = c(8.5, .5))
    if (!is.null(input$product_a)) g <- g + geom_point(data = d[d$code == input$product_a, , drop = FALSE], shape = 1, size = 6, stroke = 1, colour = "#193e32")
    z <- zoom(); if (!is.null(z)) g <- g + coord_cartesian(xlim = z$x, ylim = if (spec$ordered) rev(z$y) else z$y)
    g
  })
  sorted_products <- reactive({
    d <- filtered(); sort <- if (is.null(input$sort)) "price" else input$sort
    indices <- switch(sort, price_desc = order(-d$representative_price, d$code), offers = order(-d$n_valid_regular_offers, d$representative_price, d$code), order(d$representative_price, d$code))
    d[indices, , drop = FALSE]
  })
  page_number <- reactiveVal(1L)
  observeEvent(filtered(), page_number(1L))
  observeEvent(input$previous_page, page_number(max(1L, page_number() - 1L)))
  observeEvent(input$next_page, page_number(min(max(1L, ceiling(nrow(filtered()) / 12)), page_number() + 1L)))
  page_products <- reactive({
    d <- sorted_products(); if (!nrow(d)) return(d)
    page <- min(page_number(), ceiling(nrow(d) / 12)); d[seq.int((page - 1L) * 12L + 1L, min(page * 12L, nrow(d))), , drop = FALSE]
  })
  output$results <- renderUI({ validate(need(nrow(filtered()) > 0, "No products match. Reset filters or clear the search.")); shortlist_html(page_products()) })
  output$page_status <- renderText(sprintf("Page %d of %d | %d products", if (nrow(filtered())) page_number() else 0L, ceiling(nrow(filtered()) / 12), nrow(filtered())))
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
  output$selection_status <- renderText({ d <- pair(); sprintf("In current Explore shortlist: A = %s; B = %s", ifelse(d$code[1] %in% filtered()$code, "yes", "no"), ifelse(d$code[2] %in% filtered()$code, "yes", "no")) })
  output$comparison <- renderTable({
    d <- pair(); nutrient_unit <- if (unique(d$target_unit) == "L") "g / 100 ml" else "g / 100 g"
    values <- function(i) c(d$product_name[i], d$code[i], d$brands[i], d$quantity_text[i], sprintf("%.2f EUR/%s", d$representative_price[i], d$target_unit[i]), grade_label(d$nutri_grade[i]), grade_label(d$environment_grade[i]), round(d$sugars_100g[i], 2), round(d$saturated_fat_100g[i], 2), round(d$fiber_100g[i], 2), d$n_valid_regular_offers[i], d$n_stores[i], as.character(d$first_price_date[i]), as.character(d$last_price_date[i]))
    data.frame(Measure = c("Product", "Barcode", "Brand", "Package", "Historical unit price", "Nutrition", "Environment", paste("Sugars", nutrient_unit), paste("Saturated fat", nutrient_unit), paste("Fibre", nutrient_unit), "Regular offers", "Stores", "First price date", "Last price date"), A = values(1), B = values(2), check.names = FALSE)
  }, na = "Unknown", striped = TRUE)
  output$price_gap <- renderText({ d <- pair(); sprintf("B minus A: %+.2f EUR/%s (%+.1f%% of A's historical unit price)", diff(d$representative_price), d$target_unit[1], 100 * (d$representative_price[2] / d$representative_price[1] - 1)) })
  output$alternatives <- renderUI({
    req(input$product_a); d <- cheaper_options(category_data(), input$product_a)
    validate(need(nrow(d) > 0, "No candidate under this rule, or A has an unknown grade."))
    shortlist_html(utils::head(d, 10), "alternative_code")
  })
  output$download <- downloadHandler(filename = function() paste0(input$category, "-shortlist.csv"), content = function(file) {
    readr::write_csv(filtered(), file, na = "")
  })

  reset_conditions <- function() {
    updateSliderInput(session, "budget", value = ceiling(max(category_data()$representative_price)))
    updateCheckboxGroupInput(session, "nutrition", selected = nutri_levels)
    updateCheckboxGroupInput(session, "environment", selected = environment_levels)
    updateCheckboxInput(session, "unknown", value = TRUE)
    updateCheckboxInput(session, "multiple_offers", value = FALSE)
    updateTextInput(session, "search", value = "")
    zoom(NULL)
  }
  observeEvent(input$reset_filters, reset_conditions())
  observeEvent(input$preset_value, { reset_conditions(); updateSliderInput(session, "budget", value = median(category_data()$representative_price)); bslib::nav_select("tab", "explore", session) })
  observeEvent(input$preset_balanced, {
    reset_conditions(); updateCheckboxGroupInput(session, "nutrition", selected = c("a", "b", "c")); updateCheckboxGroupInput(session, "environment", selected = c("a-plus", "a", "b", "c")); updateCheckboxInput(session, "unknown", value = FALSE); bslib::nav_select("tab", "explore", session)
  })
  observeEvent(input$start_explore, bslib::nav_select("tab", "explore", session))
  observeEvent(input$compare_selected, bslib::nav_select("tab", "compare", session))
  inspect_product <- function(code) {
    if (length(code) == 1L && code %in% category_data()$code) updateSelectInput(session, "product_a", selected = code)
  }
  observeEvent(input$inspect_code, inspect_product(input$inspect_code))
  observeEvent(input$alternative_code, {
    if (input$alternative_code != input$product_a && input$alternative_code %in% category_data()$code) updateSelectInput(session, "product_b", selected = input$alternative_code)
  })
  observeEvent(input$use_best_alternative, {
    req(input$product_a); d <- cheaper_options(category_data(), input$product_a)
    if (nrow(d)) updateSelectInput(session, "product_b", selected = d$code[1]) else showNotification("No lower-price candidate satisfies both grade conditions for A.", type = "message")
  })
  hovered <- reactive({
    d <- plot_data(); if (is.null(input$scatter_hover) || !nrow(d)) return(d[FALSE, ])
    nearPoints(d, input$scatter_hover, xvar = "representative_price", yvar = "view_value", threshold = 12, maxpoints = 1)
  })
  output$hover_tip <- renderUI({
    d <- hovered(); if (!nrow(d)) return(NULL)
    tagList(strong(d$product_name[1]), div(sprintf("%.2f EUR/%s", d$representative_price[1], d$target_unit[1])),
      div("Nutrition ", grade_badge(d$nutri_grade[1]), "  Environment ", grade_badge(d$environment_grade[1])),
      div(sprintf("%d regular offers | %s to %s", d$n_valid_regular_offers[1], d$first_price_date[1], d$last_price_date[1])), tags$small("Click to keep this as Product A."))
  })
  observeEvent(input$scatter_click, {
    d <- nearPoints(plot_data(), input$scatter_click, xvar = "representative_price", yvar = "view_value", threshold = 14, maxpoints = 1)
    if (nrow(d)) inspect_product(d$code[1])
  })
  brushed <- reactive({
    d <- plot_data(); b <- input$scatter_brush
    if (is.null(b)) return(d[FALSE, ])
    d[d$representative_price >= b$xmin & d$representative_price <= b$xmax & d$view_value >= b$ymin & d$view_value <= b$ymax, , drop = FALSE]
  })
  output$brush_summary <- renderUI({
    if (is.null(input$scatter_brush)) return(NULL)
    d <- brushed(); div(class = "brush-note", strong(sprintf("%d products in your brushed region", nrow(d))), p(if (nrow(d)) sprintf("Median %.2f EUR/%s. This region does not change the shortlist; use Zoom to examine it.", median(d$representative_price), d$target_unit[1]) else "Drag across some points to inspect a region."))
  })
  output$point_detail <- renderUI({
    d <- hovered()
    if (!nrow(d)) { d <- category_data(); index <- match(input$product_a, d$code); d <- d[if (length(index) && !is.na(index)) index else 1L, , drop = FALSE] }
    tagList(div(class = "insight-kicker", if (nrow(hovered())) "HOVER PREVIEW" else "SELECTED PRODUCT A"), h4(d$product_name[1]), span(class = "barcode", d$code[1]),
      div(class = "focus-price", sprintf("%.2f", d$representative_price[1]), span(class = "metric-unit", paste0("EUR/", d$target_unit[1]))),
      div("Nutrition ", grade_badge(d$nutri_grade[1]), "  Environment ", grade_badge(d$environment_grade[1])),
      div(class = "focus-details", div(tags$small("REGULAR OFFERS"), d$n_valid_regular_offers[1]), div(tags$small("STORES"), d$n_stores[1])),
      p(class = "muted", sprintf("Price dates: %s to %s", d$first_price_date[1], d$last_price_date[1])), p(class = "muted", paste("Package:", d$quantity_text[1])))
  })
  explanation <- reactive(explain_view(filtered(), metric(), if (is.null(input$question)) "pattern" else input$question))
  guidance <- reactive(decision_guidance(filtered(), if (is.null(input$audience)) "consumer" else input$audience))
  output$decision_value <- renderUI({
    g <- guidance(); div(class = "decision-guide", div(class = "eyebrow", "FROM THE NUMBER TO A DECISION"),
      h3(g$title), p(g$meaning), p(strong("Next action: "), g$action), tags$details(tags$summary("What to verify before acting"), p(g$next_data)))
  })
  output$audience_action <- renderUI({
    g <- guidance(); tagList(div(class = "insight-divider"), div(class = "insight-kicker", if (is.null(input$audience) || input$audience == "consumer") "FOR YOUR SHOPPING DECISION" else "FOR YOUR PRODUCT BENCHMARK"), p(g$action))
  })
  output$chart_explanation <- renderUI({
    e <- explanation(); tagList(div(class = "insight-kicker", "LIVE INTERPRETATION"), h4(e$title),
      if (is.finite(e$rho) && (is.null(input$question) || input$question == "pattern")) div(class = "big-rho", sprintf("ρ = %+.3f", e$rho)),
      p(e$body), div(class = "insight-divider"), p(class = "sample-note", e$note),
      if (!is.null(zoom())) p(class = "sample-note", "The chart is zoomed. This interpretation still uses the full filtered shortlist."))
  })
  output$plot_coverage <- renderText({
    if (!is.null(zoom())) return(sprintf("Zoomed view: %d visible / %d plottable products. Shortlist remains %d; interpretation uses the full shortlist.", nrow(visible_data()), nrow(plot_data()), nrow(filtered())))
    sprintf("Plotted: %d / %d matching products. %d missing this plotted measure. %s", nrow(plot_data()), nrow(filtered()), nrow(filtered()) - nrow(plot_data()), if (metric() == "environment_grade") "Unknown environmental grades use their own row." else "Missing numerical values remain in the shortlist.")
  })
  output$category_story <- renderUI({
    d <- category_data(); e <- explain_view(d, "environment_grade")
    p(sprintf("%s: %d products. %s", category_names[[input$category]], nrow(d), if (abs(e$rho) < .1) "Price has little rank association with environmental scores here. Compare the actual product attributes." else "Price and environmental scores move together to some extent, with individual exceptions worth inspecting."))
  })
  output$overview_takeaway <- renderUI({
    d <- category_data(); e <- explain_view(d, "nutri_score")
    tagList(div(class = "insight-kicker", "NUTRITION & PRICE"), h4(e$title), p(e$body), p(class = "sample-note", sprintf("Spearman ρ = %+.3f across %d complete products.", e$rho, view_association(d, "nutri_score")$n)),
      if (input$category == "dark_chocolates") p("Chocolate is a useful trade-off case: examine sugar and saturated fat side by side."))
  })
  output$distribution_note <- renderText({ d <- category_data(); sprintf("Dashed line = category median, %.2f EUR/%s. The bars count products in each price range.", median(d$representative_price), d$target_unit[1]) })
  output$top_metrics <- renderUI({
    d <- category_data(); f <- filtered()
    tile <- function(label, value, unit, foot, featured = FALSE) div(class = paste("metric-tile", if (featured) "featured"), span(class = "metric-label", label), div(class = "metric-value", value, span(class = "metric-unit", unit)), div(class = "metric-foot", foot))
    div(class = "metric-grid", tile("YOUR CURRENT SHORTLIST", nrow(f), paste0("/ ", nrow(d)), category_names[[input$category]], TRUE),
      tile("CATEGORY MEDIAN PRICE", sprintf("%.2f", median(d$representative_price)), paste0("EUR/", d$target_unit[1]), "Before budget and grade filters"),
      tile("WITH MULTIPLE REGULAR OFFERS", sum(f$n_valid_regular_offers >= 2), "products", "Within your current shortlist"))
  })
  output$comparison_story <- renderUI({
    d <- pair(); gap <- 100 * (d$representative_price[2] / d$representative_price[1] - 1)
    title <- if (abs(gap) < 1e-9) "The same historical unit price." else sprintf("B is %.1f%% %s in historical unit price.", abs(gap), if (gap < 0) "lower" else "higher")
    delta <- d$sugars_100g[2] - d$sugars_100g[1]
    composition <- if (is.finite(delta)) sprintf("Sugar changes by %+.2f g per %s. ", delta, if (d$target_unit[1] == "L") "100 ml" else "100 g") else "Sugar is missing for at least one product. "
    div(class = "comparison-summary", div(class = "eyebrow", "THE COMPARISON, EXPLAINED"), h3(title),
      p(sprintf("Nutrition: %s → %s. Environment: %s → %s. %sRead saturated fat and fibre below, then check the price-record dates and counts.", grade_label(d$nutri_grade[1]), grade_label(d$nutri_grade[2]), grade_label(d$environment_grade[1]), grade_label(d$environment_grade[2]), composition)))
  })
}
