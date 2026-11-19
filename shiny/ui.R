library(bslib)

dash_theme <- bs_theme(
  version = 5,
  bg = "#f5f8fd",
  fg = "#142c49",
  primary = "#2865a5",
  secondary = "#edf4fc",
  base_font = font_collection("-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "sans-serif")
)

ui <- page_fluid(
  theme = dash_theme,
  title = "Food / Signal — Dashboard",
  tags$head(
    tags$meta(name = "theme-color", content = "#f9fbff"),
    tags$link(rel = "stylesheet", href = "style.css"),
    tags$script(src = "interactions.js")
  ),
  div(
    class = "food-dashboard",
    div(
      class = "dash-shell-header",
      div(
        class = "brand",
        span(class = "brand-mark", span(), span(), span()),
        span(class = "brand-text", "Food", tags$span(class = "brand-slash", " / "), "Signal")
      ),
      div(
        class = "dash-header-actions",
        div(
          class = "language-switch",
          role = "group",
          `aria-label` = "Language",
          actionButton("lang_en", "EN", class = "lang-btn"),
          actionButton("lang_zh", "中文", class = "lang-btn")
        )
      )
    ),
    uiOutput("dash_heading"),
    uiOutput("dash_tabs"),
    div(
      id = "dash-panel",
      class = "dash-panel",
      tabsetPanel(
        id = "view",
        type = "hidden",
        tabPanelBody("find", uiOutput("find_setup"), uiOutput("find_results"), uiOutput("find_plot")),
        tabPanelBody("compare", uiOutput("compare_board"))
      )
    )
  ),
  div(class = "app-footer", span("FOOD / SIGNAL"), span(class = "app-footer-note", "Open Prices & Open Food Facts · ODbL"))
)
