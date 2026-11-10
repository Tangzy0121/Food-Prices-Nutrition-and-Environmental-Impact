# Run from the repository root. Rebuild corrected data from the frozen snapshot.
library(dplyr)
source("R/09b_restore_environment_grades.R")
prepare_step4_inputs(readRDS("data/processed/frozen_v1/selected_products.rds"))
stage <- "scratch/shinylive-app"
dir.create(stage, recursive = TRUE, showWarnings = FALSE)
file.copy(list.files("shiny", full.names = TRUE), stage, recursive = TRUE, overwrite = TRUE)
dir.create(file.path(stage, "data"), showWarnings = FALSE)
file.copy("data/processed/step4_v1_1/analysis_products.rds", file.path(stage, "data/analysis_products.rds"), overwrite = TRUE)
dir.create(file.path(stage, "www/editorial"), recursive = TRUE, showWarnings = FALSE)
file.copy("reports/assets/shopping-decision.png", file.path(stage, "www/editorial/shopping-decision.png"), overwrite = TRUE)
writeLines(c('source("global.R", local = TRUE)', 'source("ui.R", local = TRUE)',
             'source("server.R", local = TRUE)', 'shiny::shinyApp(ui, server)'), file.path(stage, "app.R"))
shinylive::export(stage, "scratch/site", template_params = list(title = "Food / Signal · 中文 / English"))
