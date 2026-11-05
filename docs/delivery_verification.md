# Report and Shiny delivery verification

Date: 2026-11-05. Branch: `feat/report-shiny-delivery`, based on EDA revision `466f665` (`feat/step4-eda`). EDA PR #1 is merged (`origin/main` at `13a638f` when checked); this delivery targets `main` for PR review. Merge remains a separate action. This record includes the initial implementation and subsequent visual/decision-value revisions.

## Current deliverables

- English business report: `reports/report.tex` → `output/food-value-report-v3.pdf`, 9 pages including a full-page cover, background and consumer/supplier decisions. Four numerical tables still come directly from executed Step 4 CSVs. Body sections use continuous layout and floating figures, with no forced section page breaks. The preceding 10-page v2 remains local.
- Two generated editorial images: `reports/assets/food-choices-cover.png` and `shopping-decision.png`. Prompts, mode and interface limitations are in `reports/assets/provenance.json`. They are labelled as illustrations, not sampled products. Previous PDFs remain local; the build defaults to the sibling v3 filename.
- English bslib application: `shiny/global.R`, `ui.R`, `server.R`, `helpers.R`, `www/`. Launch with `scripts/run_shiny.ps1`; guide in `shiny/README.md`. Community comparison and source links: `docs/05_dashboard/community_references.md`.
- Local previews: `output/shiny-preview-v2.png`, `output/shiny-explore-v2.png`, `output/report-cover-v2.png`. Sources and project images are versioned; PDF/previews are ignored. Temporary renders and exports stay in `scratch/`.

## Automated R checks

`scripts/check_dashboard.R` passed in the existing conda R environment. It validates 598 primary products, 583 joint products, restored F grades, unique character barcodes, kg/L units, budget/grade/unknown semantics, all 562 EDA candidate cases, and fixed comparison selection when filters change.

New checks cover current-sample interpretation against the executed coefficient, no-data/constant-value messages, per-100-ml nutrient labels, numerical plot coverage, barcode search and no-match search, quote-count filters, descending price order, disjoint pagination, brush membership, zoom/reset and zoom-scope labelling. Only existing local packages are used; bslib 0.12.0 was already installed. No Plotly, DT or inference service was added.

Consumer/supplier role-switch tests passed: the role changes interpretation and next actions, preserves product counts, identifies the supplier benchmark as retail rather than wholesale, and lists costs, current prices, demand/margins/inventory as evidence to add before business action.

## Real-browser checks

Chrome clean startup displayed the redesigned masthead, editorial hero, category cards and overview. Biscuits showed 149 products, median 11.09 EUR/kg and 79 products with multiple regular offers. The under-median preset returned 74 products at the slider's displayed 11.09 ceiling and updated the explanation. The Read the chart option described axes, grade colour and unknown handling. The full-category environmental explanation reproduced rho +0.030 across 148 complete products.

The final role guide was checked in Chrome: the consumer view connected 149 products and 11.09 EUR/kg to a unit-price budget; the supplier view used the same figures for retail-positioning benchmarks and product-attribute review. Its expandable verification note listed current competitor prices, internal costs/terms, availability and customer evidence. Screenshot: `docs/images/decision-guide.png`.

The 12-row shortlist, literal barcode search and no-variation explanation were checked. Inspecting `3350031923081` selected A; the candidate action set B to `3410280136257`. The comparison explained B's 45.7% lower unit price, nutrition E to E, environment C to B, and sugar difference -6.20 g/100 g, while retaining package, quote counts and dates. The shortlist membership indicator correctly showed A inside the one-product search and B outside it.

Full-screen chart mode was exercised. Clicking the environmental-F point selected `3222472772880` (6.44 EUR/kg, nutrition E, environment F). A drawn brush selected 81 products with median 9.19 EUR/kg; zoom changed the visible region while retaining the 149-product shortlist. The final build adds an explicit visible/plottable count and explanation-scope note for zoomed views. Hover preview/tooltip is implemented with Shiny's point matching and local mouse positioning; point selection was the directly exercised native-pointer path.

The browser download was cancelled. The live download endpoint was then requested directly over loopback and its CSV parsed: the one-product search exported exactly one row with code `3350031923081`. This verifies the handler and filter identity; completion of a browser-managed file save remains unverified.

The initial delivery also exercised empty grade combinations, full-category juice switching, per-100-ml composition, dates and counts. Regression checks retain these cases. Clean final server startup was repeated after source changes. The local service runs on 127.0.0.1:3838; commands require access outside the command sandbox's network isolation for the browser to reach it.

## PDF checks

XeLaTeX completed two passes. The 9-page v3 PDF was rendered with Poppler and every page inspected. Replacing forced section breaks and fixed-position figures allows body text and illustrations to share pages. The short business-question callout stays together. The final reference page retains natural end-of-document space. Table/figure references, units, sample counts, bibliography and the new measure/meaning/action and audience sections were checked. No overfull boxes, missing characters or unresolved references were reported. The final text retains 562 candidate cases and the 583-product joint sample. Original EDA figures and frozen input files were not modified.

## Remaining work

- Team review and classroom user testing, especially whether the explanations improve understanding and candidate selection.
- Named member contributions, personal reflections, classroom feedback and slides for the final course submission.
- Current-price validation and user evidence before claiming realised savings, revenue or conversion effects.
- Review this report/Shiny PR before merge. EDA PR #1 is already merged, and the PR diff excludes its analysis changes.

No project moves, lifecycle changes or archive actions were performed. Existing archives remain unchanged.
