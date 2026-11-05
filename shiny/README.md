# Food choices | Value within reach

English-language local Shiny app for the corrected Step 4 dataset. It reads local files and makes no API requests.

From the project root:

```powershell
./scripts/run_step4.ps1  # first use: reconstruct corrected data from frozen inputs
./scripts/run_shiny.ps1
```

Open http://127.0.0.1:3838 in a browser. Stop the foreground R process with Ctrl+C. In RStudio, use `shiny::runApp("shiny")` from the project root. Dependencies: shiny, ggplot2, readr, and the existing Step 4 R packages. `ui.R` defines the interface, `server.R` the reactive workflow, `helpers.R` the data contract and decision rules.

1. **Category overview:** choose a category, read unit-price distribution and coverage. This page uses the entire selected category.
2. **Discover:** set a budget and grade filters. Count, plot, table and CSV use the same filtered products. Clear conditions to try an empty state. Unknown grades pass only their own missing dimension when enabled.
3. **Compare two products:** choose two distinct same-category products. Compare composition, packaging, quote counts and dates. Choices stay fixed under budget/grade changes; membership in the current shortlist is shown. The lower-price candidates table shows up to ten eligible products for A, sorted by unit price.

All price comparisons are historical. Nutrient units switch between 100 g and 100 ml. A+ through F and nutrition A through E have separate orders. Unknown grades remain visible when requested. Raw fields in the CSV retain their original names; juice `_100g` fields are standardised per 100 ml, as described in the data dictionary.

Run `Rscript --vanilla scripts/check_dashboard.R` from the root for the data, ordinal-rule and reactive checks. Browser verification results are recorded in `docs/delivery_verification.md`.

Implementation references: [Shiny runApp](https://shiny.posit.co/r/reference/shiny/latest/runapp.html), [testServer](https://shiny.posit.co/r/reference/shiny/latest/testserver.html).
