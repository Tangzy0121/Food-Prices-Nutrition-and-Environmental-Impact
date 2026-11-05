ui <- fluidPage(
  tags$head(tags$style(HTML("
    body{background:#f4f6f3;color:#213b35;font-family:Arial,sans-serif}
    .container-fluid{max-width:1480px;margin:auto;padding:24px}
    h2{font-weight:700;letter-spacing:-.7px} h3{font-size:21px}
    .well{background:#fff;border:1px solid #dbe3dc;border-radius:12px}
    .nav-tabs{margin-bottom:20px} .tab-content{background:white;padding:22px;border-radius:12px}
    .metric{background:#e7f0e8;border-left:4px solid #427c62;padding:18px;margin-bottom:20px;font-size:18px}
    .table{font-size:13px} .context{color:#576a61;max-width:1050px;margin-bottom:22px}
    .shiny-output-error-validation{color:#875c28;padding:24px;background:#fff4df}
  "))),
  titlePanel("Food choices | Value within reach"),
  p(class = "context", "Compare prices, nutrition and environmental grades within four food categories. France · historical EUR prices, 2024–2025 · product information retrieved 2 November 2026."),
  sidebarLayout(
    sidebarPanel(width = 3,
      selectInput("category", "1. Choose a category", choices = setNames(names(category_names), category_names)),
      uiOutput("budget_ui"),
      checkboxGroupInput("nutrition", "2. Nutrition grades", choices = setNames(nutri_levels, toupper(nutri_levels)), selected = nutri_levels, inline = TRUE),
      checkboxGroupInput("environment", "3. Environmental grades", choices = setNames(environment_levels, c("A+", LETTERS[1:6])), selected = environment_levels, inline = TRUE),
      checkboxInput("unknown", "Also include unknown grades", TRUE),
      p("Unknown grades pass only their missing dimension; other selected conditions still apply."),
      downloadButton("download", "Download filtered CSV"),
      hr(), p("Prices are medians of recorded regular unit offers. Compare dates and offer counts before interpreting a price gap.")
    ),
    mainPanel(width = 9,
      tabsetPanel(id = "tab",
        tabPanel("Category overview",
          div(class = "metric", textOutput("overview_count")),
          plotOutput("distribution", height = "320px"),
          h3("Grade coverage in this category"), tableOutput("coverage"),
          p("The overview always uses the entire selected category. Filters apply to Discover only.")),
        tabPanel("Discover",
          div(class = "metric", textOutput("filtered_count")),
          plotOutput("scatter", height = "390px"),
          p("Each point is one product; overlapping points may coincide. Unknown environmental grades have their own row. Nutrition grades use colour."),
          tableOutput("results")),
        tabPanel("Compare two products",
          p("Selections stay fixed when budget or grade filters change. Choose two distinct products from the selected category."),
          fluidRow(column(6, selectInput("product_a", "Product A", choices = NULL)),
                   column(6, selectInput("product_b", "Product B", choices = NULL))),
          textOutput("selection_status"), tableOutput("comparison"),
          div(class = "metric", textOutput("price_gap")),
          h3("Lower-price candidates for A"),
          p("Same category, strictly lower historical unit price, and neither grade worse. Check recipe, use and packaging before treating these as substitutes."),
          tableOutput("alternatives")),
        tabPanel("Methods & guide",
          h3("Three tasks"),
          tags$ol(tags$li("Choose a category and inspect its price distribution and grade coverage."),
                  tags$li("Open Discover, set a unit-price budget and grade conditions, then export a shortlist."),
                  tags$li("Open Compare two products to inspect composition, packaging and price-record context.")),
          h3("How to read the measures"),
          p("Nutrition: Nutri-Score 2023, A to E; lower numerical score is better. Environment: A+, A, B, C, D, E, F; higher numerical score is better. Grades are ordered categories, not equal numerical intervals."),
          p("Solid products use EUR/kg and nutrients per 100 g. Fruit juices use EUR/L and nutrients per 100 ml. Categories are analysed separately."),
          p("600 products were selected; 598 remain after two specification exclusions. 583 have both grades and a price. Frozen inputs are preserved; the corrected dataset restores 16 environmental F grades."),
          p("Contributor-recorded prices and a later product snapshot support exploratory sample comparisons. Suggested price gaps are historical comparisons, not verified savings or causal effects. AGRIBALYSE values share reference foods and are discussed in the report rather than ranked as brand measurements."),
          p("Sources: Open Prices and Open Food Facts. See data/README.md for snapshot provenance and licensing; docs/04_eda/ for analysis and corrections. No live API is required."))
      )
    )
  )
)
