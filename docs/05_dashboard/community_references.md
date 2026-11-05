# Community references and redesign decision

Consulted: 2026-11-05. The aim is an English consumer decision interface that explains the data and supports a product comparison. Popularity is one signal alongside layout quality, compatibility and maintenance.

| Project | Stars shown by the consulted GitHub page snapshot | Reference pattern | Decision |
| --- | ---: | --- | --- |
| [bslib](https://github.com/rstudio/bslib) | 570 | Bootstrap 5 themes, sidebar, responsive cards, full-screen chart panels; [official dashboard examples](https://rstudio.github.io/bslib/articles/dashboards/) | Implement with bslib 0.12.0, already installed locally |
| [bs4Dash](https://github.com/RinteRface/bs4Dash) | 458 | AdminLTE3 dashboard shell, boxes, controls; [documentation and demos](https://rinterface.github.io/bs4Dash/) | Reference for information hierarchy; no AdminLTE dependency added |
| [shiny.fluent](https://github.com/Appsilon/shiny.fluent) | 291 | Microsoft's Fluent UI via React/shiny.react; [official tutorials](https://appsilon.github.io/shiny.fluent/) | Reference for a focused details panel and rich UI composition; no React wrapper added |

Counts are the page snapshots returned during this lookup, not a live popularity ranking. These are community UI frameworks and example collections rather than food-analysis templates. The implemented theme, content and domain interactions are project-specific. No community app or third-party source was copied wholesale.

## What changed

- **Hierarchy:** forest-green masthead, editorial hero, three current-state metric cards, a restrained green/ivory palette, and four task-based navigation panels. Hero appears on the overview; exploration prioritises the chart workspace.
- **Interpretation:** an explanation panel switches between reading the axes, describing the filtered-sample pattern and proposing the next comparison. Coefficients and denominators are computed from local current data. Ordinal environmental plots use numerical environmental scores for the separately labelled correlation.
- **Direct chart actions:** product hover preview and point selection, brush summary, zoom/reset, and full-screen chart mode. Unknown grades and missing numerical measures have explicit handling. Zoom labels distinguish visible points from the full shortlist used for interpretation.
- **Discovery:** unit budget, grade filters, under-median and A–C presets, an optional two-offer threshold, literal product/barcode search, sorting, 12-row pagination, and CSV export of all matching rows.
- **Decision:** select A from a plotted point or a table row, select B manually or from lower-price candidates, and read the price/grade/composition differences alongside quote context.

The explanations use deterministic descriptive rules, not an LLM endpoint. They describe the current data and provide a transparent answer to the three supported questions. No external inference service or new API credential is required.
