# Shared application environment for the consumer Find/Compare dashboard.
library(shiny)
library(ggplot2)
library(bslib)
root <- normalizePath("..", mustWork = TRUE)
source("helpers.R", local = TRUE)
products <- load_dashboard_data(root)
quotes <- load_dashboard_quotes(root, products$code)
