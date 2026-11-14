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

  analysis_category <- function(name) {
    d <- analysis[[name]]
    d[d$category == input$category, , drop = FALSE]
  }
  output$analysis_coverage <- renderPlot({
    d <- analysis$coverage
    d$indicator <- factor(d$indicator, levels = rev(unique(d$indicator)))
    d$category_label <- factor(d$category_label, levels = rev(unique(d$category_label)))
    ggplot(d, aes(indicator, category_label, fill = n_available / n)) +
      geom_tile(colour = "white", linewidth = 1) +
      geom_text(aes(label = sprintf("%d/%d", n_available, n)), size = 3.4) +
      scale_fill_gradient(low = "#e8ddc8", high = "#4f8272", limits = c(0, 1), labels = scales::percent) +
      labs(x = NULL, y = NULL, fill = "Coverage") + dashboard_theme() +
      theme(axis.text.x = element_text(angle = 30, hjust = 1), panel.grid = element_blank())
  })
  output$analysis_price_distribution <- renderPlot({
    d <- category_data(); unit <- unique(d$target_unit)
    ggplot(d, aes(category, representative_price)) +
      geom_boxplot(width = .38, outlier.shape = NA, fill = "#c3d8cb", colour = "#214d41") +
      geom_jitter(width = .12, height = 0, size = 2, alpha = .48, colour = "#2d6f5e") +
      scale_y_log10() + scale_x_discrete(labels = category_names[[input$category]]) +
      labs(x = NULL, y = paste0("Median unit price (EUR/", unit, ", log scale)")) + dashboard_theme()
  })
  output$analysis_price_note <- renderText({
    d <- category_data(); sprintf("%d products. Boxes show quartiles and medians; every point is one product. Range: %.2f–%.2f EUR/%s.", nrow(d), min(d$representative_price), max(d$representative_price), unique(d$target_unit))
  })
  output$analysis_nutrition_count <- renderText({
    d <- category_data(); sprintf("%s: %d products; %d have a nutrition grade and %d have both price and sugars.", category_names[[input$category]], nrow(d), sum(!is.na(d$nutri_grade)), sum(is.finite(d$sugars_100g)))
  })
  output$analysis_nutrition_box <- renderPlot({
    d <- category_data(); d <- d[!is.na(d$nutri_grade), , drop = FALSE]
    d$nutri_grade <- factor(d$nutri_grade, levels = nutri_levels)
    ggplot(d, aes(nutri_grade, representative_price)) +
      geom_boxplot(width = .58, outlier.shape = NA, fill = "#dce8c8", colour = "#435f36") +
      geom_jitter(width = .12, height = 0, alpha = .35, colour = "#647a3f") +
      scale_y_log10() + scale_x_discrete(labels = toupper) +
      labs(x = "Nutrition grade (A is best)", y = paste0("EUR/", unique(category_data()$target_unit), " (log scale)")) + dashboard_theme()
  })
  output$analysis_sugar_scatter <- renderPlot({
    d <- category_data(); d <- d[is.finite(d$sugars_100g), , drop = FALSE]
    d$nutrition_label <- factor(grade_label(d$nutri_grade), levels = c(LETTERS[1:5], "Unknown"))
    ggplot(d, aes(representative_price, sugars_100g, colour = nutrition_label)) +
      geom_point(size = 2.7, alpha = .72) + scale_x_log10() +
      scale_colour_manual(values = c(A = "#268161", B = "#78913f", C = "#b28a2e", D = "#c36d3f", E = "#a94f57", Unknown = "#7a847e"), drop = FALSE) +
      labs(x = paste0("EUR/", unique(category_data()$target_unit), " (log scale)"), y = if (unique(category_data()$target_unit) == "L") "Sugars (g/100 ml)" else "Sugars (g/100 g)", colour = "Nutrition") + dashboard_theme()
  })
  output$analysis_nutrition_table <- renderTable({
    d <- analysis_category("associations")
    d <- d[d$metric != "environment_score", , drop = FALSE]
    data.frame(Metric = unname(analysis_metric_labels[d$metric]), Products = d$n,
               `Spearman rho` = sprintf("%+.3f", d$rho), `Better direction` = d$better_direction, check.names = FALSE)
  }, striped = TRUE)
  output$analysis_environment_box <- renderPlot({
    d <- category_data(); d <- d[!is.na(d$environment_grade), , drop = FALSE]
    d$environment_grade <- factor(d$environment_grade, levels = environment_levels)
    ggplot(d, aes(environment_grade, representative_price)) +
      geom_boxplot(width = .62, outlier.shape = NA, fill = "#c3ddd5", colour = "#285d4f") +
      geom_jitter(width = .12, height = 0, alpha = .35, colour = "#3c7666") +
      scale_y_log10() + scale_x_discrete(labels = function(x) ifelse(x == "a-plus", "A+", toupper(x))) +
      labs(x = "Environmental grade", y = paste0("EUR/", unique(category_data()$target_unit), " (log scale)")) + dashboard_theme()
  })
  output$analysis_carbon_bubble <- renderPlot({
    d <- analysis_category("carbon_references")
    validate(need(nrow(d) > 0, "No carbon reference estimates for this category."))
    ggplot(d, aes(median_price, co2_total, size = n_products)) +
      geom_point(fill = "#6b9c8b", colour = "#285d4f", alpha = .68) +
      scale_x_log10() + scale_size_continuous(range = c(2, 12)) +
      labs(x = paste0("Median unit price of mapped products (EUR/", unique(category_data()$target_unit), ", log scale)"),
           y = "Carbon estimate (kg CO₂e/kg food)", size = "Products mapped") + dashboard_theme()
  })
  output$analysis_joint_count <- renderText({
    d <- analysis_category("joint_cells"); sprintf("%s: %d products with price and both grades.", category_names[[input$category]], sum(d$n))
  })
  output$analysis_joint_heatmap <- renderPlot({
    d <- analysis_category("joint_cells")
    d$nutri_grade <- factor(d$nutri_grade, levels = nutri_levels)
    d$environment_grade <- factor(d$environment_grade, levels = rev(environment_levels))
    ggplot(d, aes(nutri_grade, environment_grade, fill = relative_price)) +
      geom_tile(colour = "white", linewidth = 1.2) +
      geom_text(aes(label = sprintf("n=%d\n%.2f", n, median_price)), size = 3.4) +
      scale_fill_gradient2(low = "#4f8272", mid = "#f5f0df", high = "#c66d42", midpoint = 1, trans = "log", labels = function(x) sprintf("%.1f×", x)) +
      scale_x_discrete(labels = toupper) + scale_y_discrete(labels = function(x) ifelse(x == "a-plus", "A+", toupper(x))) +
      labs(x = "Nutrition grade (A is best)", y = "Environmental grade", fill = "Price / category median") + dashboard_theme() + theme(panel.grid = element_blank())
  })
  output$analysis_sensitivity_plot <- renderPlot({
    d <- analysis_category("association_sensitivity")
    d <- d[d$metric %in% c("nutri_score", "environment_score"), , drop = FALSE]
    d$scenario <- factor(d$scenario, levels = rev(unique(d$scenario)))
    d$metric <- factor(d$metric, levels = c("nutri_score", "environment_score"), labels = c("Nutrition score", "Environmental score"))
    ggplot(d, aes(y = scenario, colour = metric)) +
      geom_segment(aes(x = rho_main_same_goods, xend = rho_variant, yend = scenario), linewidth = 1.1, alpha = .7) +
      geom_point(aes(x = rho_main_same_goods), shape = 1, size = 3.2, stroke = 1.1) +
      geom_point(aes(x = rho_variant), size = 2.8) +
      geom_vline(xintercept = 0, colour = "#87938c", linetype = "dashed") +
      scale_colour_manual(values = c("Nutrition score" = "#21705a", "Environmental score" = "#b66036")) +
      labs(x = "Spearman correlation", y = "Alternative price scenario", colour = "Metric") + dashboard_theme()
  })
  output$analysis_year_table <- renderTable({
    d <- analysis_category("paired_year_summary")
    data.frame(Category = category_names[[d$category[1]]], `Paired products` = d$n,
               `Median change` = sprintf("%+.1f%%", d$median_change_pct),
               Q1 = sprintf("%+.1f%%", d$q1), Q3 = sprintf("%+.1f%%", d$q3), check.names = FALSE)
  }, striped = TRUE)
}
