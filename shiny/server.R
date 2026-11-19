server <- function(input, output, session) {
  language <- reactiveVal("en")
  selected_code <- reactiveVal(NULL)
  reference_code <- reactiveVal(NULL)
  list_expanded <- reactiveVal(FALSE)
  alts_expanded <- reactiveVal(FALSE)
  open_compare_code <- reactiveVal(NULL)
  advanced_open <- reactiveVal(FALSE)
  plot_open <- reactiveVal(FALSE)
  last_category <- reactiveVal(NULL)
  last_subtype <- reactiveVal(NULL)

  observeEvent(input$lang_en, language("en"))
  observeEvent(input$lang_zh, language("zh"))
  observeEvent(input$selected_code, {
    if (!is.null(input$selected_code) && nzchar(input$selected_code)) selected_code(input$selected_code)
  }, ignoreNULL = FALSE)
  observeEvent(input$open_compare_code, {
    code <- input$open_compare_code
    if (is.null(code) || !nzchar(code)) return()
    open_compare_code(if (identical(open_compare_code(), code)) NULL else code)
  })

  lang <- reactive(language())
  L <- function(key) tr(key, lang())

  observe({
    session$sendCustomMessage("dash-lang", list(lang = lang()))
  })

  output$dash_heading <- renderUI({
    div(
      class = "dash-heading",
      h1(L("find_better")),
      span(class = "dash-snapshot", L("snapshot"))
    )
  })

  output$dash_tabs <- renderUI({
    view <- if (is.null(input$view)) "find" else input$view
    div(
      class = "dash-tabs",
      role = "tablist",
      actionButton("tab_find", L("find_tab"), class = if (identical(view, "find")) "dash-tab active" else "dash-tab"),
      actionButton("tab_compare", L("compare_tab"), class = if (identical(view, "compare")) "dash-tab active" else "dash-tab")
    )
  })

  observeEvent(input$tab_find, updateTabsetPanel(session, "view", selected = "find"))
  observeEvent(input$tab_compare, updateTabsetPanel(session, "view", selected = "compare"))

  category_choices <- reactive({
    setNames(names(category_names), vapply(names(category_names), category_label, character(1), language = lang()))
  })

  subtype_choices <- reactive({
    all_label <- setNames("", L("all_types"))
    if (is.null(input$category) || !nzchar(input$category)) return(all_label)
    d <- products[products$category == input$category, , drop = FALSE]
    keys <- ifelse(is.na(d$subtype), "unknown", as.character(d$subtype))
    counts <- sort(table(keys), decreasing = TRUE)
    c(all_label, setNames(
      paste0(vapply(names(counts), function(k) subtype_label(if (identical(k, "unknown")) NA_character_ else k, lang()), character(1)), " (", as.integer(counts), ")"),
      names(counts)
    ))
  })

  output$find_setup <- renderUI({
    div(
      class = "dash-find-setup",
      tags$section(
        class = "dash-category-picker",
        div(class = "dash-category-head", h2(L("food_category"))),
        selectInput("category", NULL, choices = c(setNames("", L("select_category")), category_choices()), selected = isolate(input$category)),
        conditionalPanel(
          "input.category !== '' && input.category != null",
          selectInput("subtype", L("food_type"), choices = subtype_choices(), selected = isolate(input$subtype))
        )
      ),
      uiOutput("price_range_ui")
    )
  })

  observeEvent(input$category, {
    if (identical(last_category(), input$category)) return()
    last_category(input$category)
    list_expanded(FALSE)
    selected_code(NULL)
    open_compare_code(NULL)
    if (!is.null(input$category) && nzchar(input$category)) {
      updateSelectInput(session, "subtype", choices = subtype_choices(), selected = "")
    }
  }, ignoreInit = TRUE)

  observeEvent(input$subtype, {
    if (identical(last_subtype(), input$subtype)) return()
    last_subtype(input$subtype)
    list_expanded(FALSE)
    selected_code(NULL)
    open_compare_code(NULL)
  }, ignoreInit = TRUE)

  scoped <- reactive({
    req(input$category, nzchar(input$category))
    subtype <- if (is.null(input$subtype)) "" else input$subtype
    scope_products(products, input$category, subtype)
  })

  price_bounds <- reactive({
    d <- scoped()
    prices <- d$representative_price
    c(floor(min(prices) * 100) / 100, max(floor(min(prices) * 100) / 100 + 0.01, ceiling(max(prices) * 100) / 100))
  })

  output$price_range_ui <- renderUI({
    if (is.null(input$category) || !nzchar(input$category)) {
      return(div(class = "dash-price-placeholder", h2(L("price_range")), p(L("choose_type_first"))))
    }
    bounds <- price_bounds()
    d <- scoped()
    centre <- stats::median(d$representative_price)
    current <- if (!is.null(input$price_range) && length(input$price_range) == 2L) input$price_range else bounds
    tags$section(
      class = "dash-price-card",
      div(
        class = "dash-price-head",
        div(h2(L("price_range")), p(L("price_hint"))),
        div(class = "dash-range-count", role = "status",
          tags$strong(sum(d$representative_price >= current[1] & d$representative_price <= current[2]), " / ", nrow(d)),
          L("products_in_range")
        )
      ),
      plotOutput("price_hist", height = "110px"),
      sliderInput(
        "price_range", NULL,
        min = bounds[1], max = bounds[2], value = current, step = 0.01,
        width = "100%"
      ),
      div(
        class = "dash-price-foot",
        span(tags$strong(sprintf("€%.2f – €%.2f / %s", current[1], current[2], unique(d$target_unit))),
             tags$small(sprintf("%s €%.2f", if (lang() == "zh") "中位" else "Median", centre))),
        div(
          actionButton("to_median", L("up_to_median"), class = "dash-button"),
          actionButton("reset_range", L("reset_range"), class = "dash-button")
        )
      )
    )
  })

  output$price_hist <- renderPlot({
    d <- scoped()
    bounds <- price_bounds()
    rng <- if (!is.null(input$price_range) && length(input$price_range) == 2L) input$price_range else bounds
    centre <- stats::median(d$representative_price)
    ggplot(d, aes(representative_price)) +
      annotate("rect", xmin = rng[1], xmax = rng[2], ymin = -Inf, ymax = Inf, fill = "#e4eefb", alpha = 0.9) +
      geom_histogram(bins = if (nrow(d) <= 14) 12 else 28, fill = "#5a85b3", colour = "white", boundary = bounds[1]) +
      geom_vline(xintercept = centre, linetype = "dashed", colour = "#315983", linewidth = 0.8) +
      scale_x_continuous(limits = bounds, expand = c(0, 0)) +
      theme_void() +
      theme(plot.margin = margin(4, 8, 0, 8))
  })

  observeEvent(input$to_median, {
    d <- scoped()
    bounds <- price_bounds()
    updateSliderInput(session, "price_range", value = c(bounds[1], floor(stats::median(d$representative_price) * 100 + 1e-8) / 100))
  })
  observeEvent(input$reset_range, updateSliderInput(session, "price_range", value = price_bounds()))

  filtered <- reactive({
    req(input$category, nzchar(input$category))
    filter_find_products(
      products,
      category = input$category,
      subtype = if (is.null(input$subtype)) "" else input$subtype,
      range = input$price_range,
      nutrition = if (is.null(input$nutrition)) "" else input$nutrition,
      environment = if (is.null(input$environment)) "" else input$environment,
      multiple_offers = isTRUE(input$multiple_offers == "multiple"),
      query = if (is.null(input$search)) "" else input$search
    )
  })

  sorted_products <- reactive({
    d <- filtered()
    sort <- if (is.null(input$sort)) "low" else input$sort
    idx <- switch(sort,
      high = order(-d$representative_price, d$code),
      offers = order(-d$n_valid_regular_offers, d$representative_price, d$code),
      name = order(product_name(d), d$code),
      order(d$representative_price, d$code)
    )
    d[idx, , drop = FALSE]
  })

  selected_product <- reactive({
    code <- selected_code()
    if (is.null(code)) return(NULL)
    hit <- products[products$code == code, , drop = FALSE]
    if (!nrow(hit)) NULL else hit
  })

  observeEvent(input$toggle_advanced, advanced_open(!advanced_open()))
  observeEvent(input$clear_filters, {
    updateTextInput(session, "search", value = "")
    updateSelectInput(session, "nutrition", selected = "")
    updateSelectInput(session, "environment", selected = "")
    updateSelectInput(session, "multiple_offers", selected = "")
  })
  observeEvent(input$both_c, {
    if (identical(input$nutrition, "through-c") && identical(input$environment, "through-c")) {
      updateSelectInput(session, "nutrition", selected = "")
      updateSelectInput(session, "environment", selected = "")
    } else {
      updateSelectInput(session, "nutrition", selected = "through-c")
      updateSelectInput(session, "environment", selected = "through-c")
    }
  })
  observeEvent(input$expand_list, list_expanded(!list_expanded()))
  observeEvent(input$compare_selected, {
    prod <- selected_product()
    req(nrow(prod) == 1L)
    reference_code(prod$code)
    open_compare_code(NULL)
    updateTabsetPanel(session, "view", selected = "compare")
  })

  output$find_results <- renderUI({
    if (is.null(input$category) || !nzchar(input$category)) return(NULL)
    d <- sorted_products()
    selected <- selected_product()
    grade_opts <- function(levels, through_label) {
      c(
        setNames("", L("all_grades")),
        setNames("through-c", through_label),
        setNames(levels, vapply(levels, grade_label, character(1), language = lang())),
        setNames("unknown", L("unknown"))
      )
    }
    div(
      class = "dash-find-results",
      tags$section(
        class = "dash-results",
        div(
          class = "dash-section-head",
          div(
            h2(L("products")),
            p(class = "dash-muted", role = "status",
              L("showing"), " ", min(if (list_expanded()) nrow(d) else min(5L, nrow(d)), nrow(d)),
              " / ", nrow(d), " ", L("matching"))
          ),
          div(
            class = "dash-table-actions",
            selectInput("sort", NULL, choices = c(
              setNames("low", L("sort_low")),
              setNames("high", L("sort_high")),
              setNames("offers", L("sort_offers")),
              setNames("name", L("sort_name"))
            ), selected = isolate(input$sort) %||% "low", width = "180px"),
            downloadButton("download_products", L("export_products"), class = "dash-button")
          )
        ),
        div(
          class = "dash-list-controls",
          div(class = "dash-searchbox", textInput("search", NULL, value = isolate(input$search), placeholder = L("search_ph"))),
          actionButton("toggle_advanced", L("more_filters"), class = "dash-button")
        ),
        if (isTRUE(advanced_open())) div(
          class = "dash-refine",
          selectInput("nutrition", L("nutrition"), choices = grade_opts(nutri_levels, "A–C"), selected = isolate(input$nutrition) %||% ""),
          selectInput("environment", L("environment"), choices = grade_opts(environment_levels, "A+–C"), selected = isolate(input$environment) %||% ""),
          selectInput("multiple_offers", L("price_evidence"), choices = c(
            setNames("", L("any_quotes")),
            setNames("multiple", L("two_quotes"))
          ), selected = isolate(input$multiple_offers) %||% ""),
          div(class = "dash-quick-filters",
            actionButton("both_c", L("both_c"), class = "dash-button"),
            actionButton("clear_filters", L("clear_filters"), class = "dash-button dash-clear")
          )
        ),
        product_list_html(d, selected_code = selected_code(), language = lang(), expanded = list_expanded()),
        if (nrow(d) > 5L) actionButton(
          "expand_list",
          if (list_expanded()) L("show_first_five") else paste(L("show_all"), nrow(d)),
          class = "dash-button dash-expand-results"
        )
      ),
      tags$aside(
        class = "dash-product-inspector",
        h2(L("selected")),
        if (is.null(selected)) {
          p(L("select_hint"))
        } else {
          tagList(
            h3(product_name(selected)),
            p(paste(c(selected$brands, selected$quantity_text, subtype_label(selected$subtype, lang())), collapse = " · ")),
            if (!selected$code %in% d$code) p(L("outside_filters")),
            tags$dl(
              tags$div(tags$dt(L("unit_price")), tags$dd(unit_price_text(selected$representative_price, selected$target_unit))),
              tags$div(tags$dt(L("nutrition")), tags$dd(grade_badge(selected$nutri_grade, lang()))),
              tags$div(tags$dt(L("environment")), tags$dd(grade_badge(selected$environment_grade, lang()))),
              tags$div(tags$dt(L("regular_quotes")), tags$dd(selected$n_valid_regular_offers)),
              tags$div(tags$dt(L("latest")), tags$dd(as.character(selected$last_price_date)))
            ),
            actionButton("compare_selected", L("compare_this"), class = "dash-button dash-primary")
          )
        }
      )
    )
  })

  output$download_products <- downloadHandler(
    filename = function() "food-signal-products.csv",
    content = function(file) write.csv(product_table(sorted_products()), file, row.names = FALSE, fileEncoding = "UTF-8")
  )

  observeEvent(input$toggle_plot, plot_open(!plot_open()))

  output$find_plot <- renderUI({
    if (is.null(input$category) || !nzchar(input$category)) return(NULL)
    div(
      class = "dash-distribution-details",
      actionButton("toggle_plot", L("product_plot"), class = "dash-button dash-plot-toggle"),
      if (isTRUE(plot_open())) tags$section(
        class = "dash-chart-card",
        selectInput("metric", L("compare_metric"), choices = c(
          "Environmental grade" = "environment_grade",
          "Nutrition grade" = "nutri_grade",
          "Sugars" = "sugars_100g",
          "Saturated fat" = "saturated_fat_100g",
          "Fibre" = "fiber_100g"
        ), selected = isolate(input$metric) %||% "nutri_grade"),
        plotOutput("market_plot", height = "360px", click = "market_click")
      )
    )
  })

  output$market_plot <- renderPlot({
    d <- scatter_products(sorted_products(), if (is.null(input$metric)) "nutri_grade" else input$metric)
    d <- d[is.finite(d$view_value), , drop = FALSE]
    validate(need(nrow(d) > 0, L("no_match")))
    unit <- unique(scoped()$target_unit)
    spec <- metric_spec(if (is.null(input$metric)) "nutri_grade" else input$metric, unit)
    centre <- stats::median(scoped()$representative_price)
    g <- ggplot(d, aes(representative_price, view_value)) +
      geom_vline(xintercept = centre, linetype = "dashed", colour = "#6b8db6", linewidth = 0.7) +
      geom_point(colour = "#3e73ae", alpha = 0.83, size = 2.8) +
      labs(x = paste0("EUR/", unit), y = spec$label) +
      dashboard_theme()
    selected <- selected_code()
    if (!is.null(selected) && selected %in% d$code) {
      g <- g + geom_point(data = d[d$code == selected, , drop = FALSE], colour = "#1c4879", size = 4.2)
    }
    if (isTRUE(spec$ordered) && identical(input$metric, "environment_grade")) {
      g <- g + scale_y_reverse(breaks = 1:8, labels = c("A+", LETTERS[1:6], "—"), limits = c(8.5, 0.5))
    } else if (isTRUE(spec$ordered) && identical(input$metric, "nutri_grade")) {
      g <- g + scale_y_reverse(breaks = 1:6, labels = c(LETTERS[1:5], "—"), limits = c(6.5, 0.5))
    }
    g
  })

  observeEvent(input$market_click, {
    click <- input$market_click
    d <- scatter_products(sorted_products(), if (is.null(input$metric)) "nutri_grade" else input$metric)
    d <- d[is.finite(d$view_value), , drop = FALSE]
    if (!nrow(d) || is.null(click$x) || is.null(click$y)) return()
    sx <- stats::sd(d$representative_price); if (!is.finite(sx) || sx == 0) sx <- 1
    sy <- stats::sd(d$view_value); if (!is.finite(sy) || sy == 0) sy <- 1
    dist <- ((d$representative_price - click$x) / sx)^2 + ((d$view_value - click$y) / sy)^2
    selected_code(d$code[which.min(dist)])
  })

  reference_product <- reactive({
    code <- reference_code()
    if (is.null(code)) return(NULL)
    hit <- products[products$code == code, , drop = FALSE]
    if (!nrow(hit)) NULL else hit
  })

  observeEvent(input$clear_reference, {
    reference_code(NULL)
    open_compare_code(NULL)
  })
  observeEvent(input$change_reference, updateTabsetPanel(session, "view", selected = "find"))
  observeEvent(input$go_find, updateTabsetPanel(session, "view", selected = "find"))
  observeEvent(input$expand_alts, alts_expanded(!alts_expanded()))
  observeEvent(input$reference_pick, {
    if (!is.null(input$reference_pick) && nzchar(input$reference_pick)) {
      reference_code(input$reference_pick)
      open_compare_code(NULL)
    }
  })

  alternatives <- reactive({
    ref <- reference_product()
    req(!is.null(ref))
    same_type <- !isTRUE(input$scope == "category")
    comparison_rows(
      products = products,
      reference = ref,
      same_type = same_type,
      range = input$price_range,
      use_range = isTRUE(input$use_range),
      lower_price = isTRUE(input$crit_price %||% TRUE),
      nutrition = isTRUE(input$crit_nutrition %||% TRUE),
      environment = isTRUE(input$crit_environment %||% TRUE)
    )
  })

  output$compare_board <- renderUI({
    if (is.null(input$category) || !nzchar(input$category)) {
      return(div(class = "dash-list-empty", p(L("need_category")), actionButton("go_find", L("go_find"), class = "dash-button")))
    }
    ref <- reference_product()
    if (is.null(ref)) {
      choices <- scoped()
      return(div(
        class = "dash-compare-reference",
        p(L("need_reference")),
        selectInput("reference_pick", L("change_ref"),
          choices = c(setNames("", L("select_hint")), setNames(choices$code, paste(product_name(choices), choices$code, sep = " · ")))),
        actionButton("go_find", L("go_find"), class = "dash-button")
      ))
    }
    rows <- alternatives()
    div(
      class = "dash-comparison-board",
      tags$section(
        class = "dash-compare-reference",
        div(
          class = "dash-compare-baseline",
          div(
            p(class = "dash-compare-label", L("reference")),
            h2(product_name(ref)),
            p(class = "dash-compare-meta", paste(c(ref$brands, ref$quantity_text, subtype_label(ref$subtype, lang())), collapse = " · ")),
            tags$dl(
              tags$div(tags$dt(L("unit_price")), tags$dd(unit_price_text(ref$representative_price, ref$target_unit))),
              tags$div(tags$dt(L("nutrition")), tags$dd(grade_badge(ref$nutri_grade, lang()))),
              tags$div(tags$dt(L("environment")), tags$dd(grade_badge(ref$environment_grade, lang())))
            )
          ),
          div(
            class = "dash-compare-toolbar",
            actionButton("change_reference", L("change_ref"), class = "dash-button"),
            actionButton("clear_reference", L("clear_ref"), class = "dash-button")
          )
        ),
        div(
          class = "dash-compare-controls",
          checkboxInput("crit_price", L("lower_price"), value = isolate(input$crit_price) %||% TRUE),
          checkboxInput("crit_nutrition", L("nutrition_holds"), value = isolate(input$crit_nutrition) %||% TRUE),
          checkboxInput("crit_environment", L("environment_holds"), value = isolate(input$crit_environment) %||% TRUE),
          radioButtons("scope", NULL, choices = c(
            setNames("type", L("same_type")),
            setNames("category", L("whole_category"))
          ), selected = isolate(input$scope) %||% "type", inline = TRUE),
          checkboxInput("use_range", L("use_range"), value = isolate(input$use_range) %||% TRUE)
        )
      ),
      tags$section(
        class = "dash-comparison-results",
        div(
          class = "dash-section-head",
          h2(L("alternatives")),
          span(class = "dash-muted", nrow(rows)),
          downloadButton("download_compare", L("export"), class = "dash-button")
        ),
        alternatives_html(rows, ref, language = lang(), expanded = alts_expanded(),
          open_code = open_compare_code(), quotes = quotes),
        if (nrow(rows) > 5L) actionButton(
          "expand_alts",
          if (alts_expanded()) L("show_first_five") else paste(L("show_all"), nrow(rows)),
          class = "dash-button dash-expand-results"
        )
      )
    )
  })

  output$download_compare <- downloadHandler(
    filename = function() "food-signal-comparison.csv",
    content = function(file) {
      ref <- reference_product()
      rows <- alternatives()
      out <- data.frame(
        reference_code = ref$code,
        reference_unit_price = ref$representative_price,
        product_code = rows$code,
        product_name = product_name(rows),
        unit_price = rows$representative_price,
        price_difference = rows$price_delta,
        nutrition_grade = rows$nutri_grade,
        nutrition_change = rows$nutrition_change,
        environment_grade = rows$environment_grade,
        environment_change = rows$environment_change,
        regular_quotes = rows$n_valid_regular_offers,
        stringsAsFactors = FALSE
      )
      write.csv(out, file, row.names = FALSE, fileEncoding = "UTF-8")
    }
  )
}
