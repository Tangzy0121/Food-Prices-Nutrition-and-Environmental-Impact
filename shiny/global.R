# Shared application environment for the ui.R / server.R Shiny layout.
library(shiny)
library(ggplot2)
library(bslib)
root <- normalizePath("..", mustWork = TRUE)
source("helpers.R", local = TRUE)
products <- load_dashboard_data(root)
analysis <- load_dashboard_analysis(root)
addResourcePath("editorial", file.path(root, "reports/assets"))
