# Session-local language: never change process-wide options for a user's choice.
translations <- jsonlite::fromJSON(if (file.exists("www/translations.json")) "www/translations.json" else "shiny/www/translations.json", simplifyVector = TRUE)
tr <- function(text) {
  domain <- shiny::getDefaultReactiveDomain()
  lang <- if (is.null(domain)) "en" else domain$input$lang
  if (is.null(lang) || lang != "zh") return(text)
  vapply(text, function(x) if (x %in% names(translations)) translations[[x]] else x, character(1), USE.NAMES = FALSE)
}
