# Food / Signal — value within reach

English local Shiny decision interface for the corrected Step 4 dataset, redesigned using bslib and project-specific CSS. No live API or external inference endpoint is required. Community references and the framework choice are recorded in `docs/05_dashboard/community_references.md`.

From the project root:

```powershell
./scripts/run_step4.ps1  # first use: reconstruct corrected data from frozen inputs
./scripts/run_shiny.ps1
```

Open http://127.0.0.1:3838. Stop the foreground R process with Ctrl+C. In RStudio use `shiny::runApp("shiny")` from the root. Dependencies: shiny, bslib (developed with 0.12.0), ggplot2, readr, and the existing Step 4 packages. `global.R` loads data and the local editorial image resource; `ui.R` defines the interface, `server.R` the reactive workflow, and `helpers.R` the decision and explanation rules. `www/` contains local CSS and table/hover interactions.

1. **The big picture:** choose a category, read its price distribution, median and grade coverage. This page always uses the entire category.
2. **Explore & explain:** set a unit budget and grades or try a quick preset. Optionally require two regular offers. Switch among environmental grade, nutrition score, sugar, saturated fat and fibre. The explanation panel answers how to read the view, what pattern appears and what to compare next. It computes descriptive correlations and valid sample sizes from the filtered data.
3. **Inspect a point:** hover to preview a product; click it to select A. Drag across a region to see its product count and median price. Zoom to that region or reset. Full-screen chart mode is available from the card's expand control. Zoom does not change the shortlist; the footer and explanation distinguish the zoomed view from the full filtered data.
4. **Organise a shortlist:** search by product or barcode, sort by price or offer count, and page through 12 rows at a time. Inspect selects A. The CSV contains all matching products, not just the displayed page. Unknown grades pass only their own missing dimension; numerical plots explicitly report omitted values.
5. **Compare & decide:** keep two distinct same-category products selected while changing filters. Read the generated price/grade/composition summary and quote context. Find a lower-price candidate for A or Inspect a candidate row to set B. Candidate suggestions use strictly lower historical unit price and neither grade worse.

Choose **Consumer** or **Supplier / product analyst** in the sidebar. The decision guide explains the current shortlist's median, the next practical comparison and what to verify before acting. Consumers use it to orient a budget and inspect suitable alternatives. Suppliers use historical retail positioning and attribute comparisons to identify benchmarks for a product or premium-price review. The role changes the guidance without changing the underlying filters or counts. The Methods page explains every displayed measure, including why rho is not a probability and why product counts are not sales volumes.

All prices are historical. Nutrients use 100 g for solids and 100 ml for juices. Environmental A+ through F and nutrition A through E have separate orders. Unknown grades remain visible when requested. Raw CSV `_100g` fields for juices represent per-100-ml standardised nutrients, as documented in the data dictionary.

Run `Rscript --vanilla scripts/check_dashboard.R` from the root for decision-rule, interpretation, coverage and reactive regression checks. Browser verification is recorded in `docs/delivery_verification.md`.

References: [bslib dashboard examples](https://rstudio.github.io/bslib/articles/dashboards/), [Shiny runApp](https://shiny.posit.co/r/reference/shiny/latest/runapp.html), [testServer](https://shiny.posit.co/r/reference/shiny/latest/testserver.html). The overview photograph is an AI-generated editorial illustration; prompts and provenance live in `reports/assets/provenance.json`.
