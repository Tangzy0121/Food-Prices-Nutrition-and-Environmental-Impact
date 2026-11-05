# Report and Shiny delivery verification

Date: 2026-11-05. Branch: `feat/report-shiny-delivery`, based on EDA revision `466f665` (`feat/step4-eda`). The branch is local and has not been merged or published.

## Delivered

- English Tau-class business analysis report: `reports/report.tex`; PDF: `output/food-value-report.pdf` (8 pages). Four numerical tables are generated from executed Step 4 CSVs. The report covers the decision, evidence, three research questions, composition trade-offs, a reproducible comparison pair, proposed business validation, sensitivity, scope, reproduction and references.
- English local Shiny application: `shiny/global.R`, `ui.R`, `server.R`, `helpers.R`. Launch: `scripts/run_shiny.ps1`. Guide: `shiny/README.md`. The application uses corrected local data and no live API.
- Sources, scripts and generated LaTeX tables are versioned. The PDF and browser preview stay local in `output/`; build and visual-QA intermediates stay in `scratch/report-build/`. No new large binary is added to Git.

## Executed checks

`scripts/check_dashboard.R` passed with the existing conda R environment: 598 primary products, 583 joint products, restored F coverage, unique character barcodes, kg/L selection, budget constraints, cleared-grade empty sets, unknown-grade semantics, A+ through F order, and the candidate rule reconciled against all 562 EDA cases. `shiny::testServer` exercised linked scatter/table data, fixed product choices after budget changes, empty results, price-gap calculation and switching to juices.

Real Chrome verification: initial overview displayed 149 biscuits and median 11.09 EUR/kg; Discover displayed 149/149 with 149 table rows. Clearing nutrition grades with unknowns off produced 0/149 and readable empty messages. Switching to juices changed the ceiling to EUR/L; restoring conditions displayed 150/150 with 150 table rows. The comparison displayed distinct juice barcodes, package sizes, per-100-ml nutrients, regular-offer/store counts and first/last dates. Example juice pair displayed 2.89 vs 3.56 EUR/L and a +23.0% gap. Preview: `output/shiny-preview.png`.

Browser testing exposed an initialization problem with competing app.R and ui.R/server.R entry points. The delivered application uses the standard global.R/ui.R/server.R layout; a fresh server startup was verified in Chrome. The local service must run outside the command sandbox's network isolation for a real browser to reach it. The Kimi endpoint and the initial in-app-browser connection were unavailable; the final checks used local Chrome.

The report was built with XeLaTeX in two passes, rendered with Poppler, and all eight pages inspected. Figures and tables were checked for units, captions and layout. Build-table assertions passed for primary/joint counts. Font and line overflow corrections were incorporated before the final render. Source figures and frozen data were not changed.

## Remaining work

- Team review of narrative, code, literature reading coverage and selected comparison cases; classroom usability testing.
- Named member contributions, personal reflections and actual classroom feedback for final course assembly. Slides remain a separate project step.
- Actual savings, retailer revenue and conversion require current-price/user evidence; the report proposes a validation plan and does not report measured commercial uplift.
- CSV export is implemented using the shared filtered data; an actual browser download was not included in this verification.
- Review this branch before merge. If the EDA PR is still open, land/reconcile it first to avoid duplicating its commits. This branch contains the EDA ancestry plus the two delivery commits.

No project moves, lifecycle changes or archive actions were performed. Existing archives remain unchanged.
