# Shared application environment for the ui.R / server.R Shiny layout.
library(shiny)
library(ggplot2)
root <- normalizePath("..", mustWork = TRUE)
source("helpers.R", local = TRUE)
products <- load_dashboard_data(root)
