# Food / Signal — consumer Dashboard (Shiny)

Local Shiny shell for the same **Find products** and **Compare products** experience as the website Dashboard. Blue UI, bilingual EN/ZH chrome, category + food-type scope, dual-ended price range, product inspector, and criteria-based alternatives. No Overview, Six analyses, Methods, audience mode, or hero chrome.

Data: corrected Step 4 products (`analysis_products.rds`) plus frozen price observations for quote detail. Subtype rules live in `helpers.R` and are shared with `website/scripts/export-dashboard.R`.

Start from the project root:

```powershell
./scripts/run_shiny.ps1
```

Open http://127.0.0.1:3838. Stop with Ctrl+C. In RStudio: `shiny::runApp("shiny")` from the root.

Dependencies: shiny, bslib, ggplot2, jsonlite (for subtype tags). Optional regression checks: `Rscript --vanilla scripts/check_dashboard.R`.

1. **Find products:** choose a category and food type, set a price range (or up to the median), search/filter, inspect a product, optionally open the product plot.
2. **Compare products:** keep a reference from Find, toggle lower-price / grade-hold criteria, preview alternatives, expand a row for nutrient and quote evidence, export CSV.

All prices are historical French unit medians (2024–2025). Nutrients use 100 g for solids and 100 ml for juices.
