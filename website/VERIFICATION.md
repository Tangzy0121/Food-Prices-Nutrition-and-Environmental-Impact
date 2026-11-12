# Presentation verification

Checked on 11 November 2026.

- Production build: `npm run build` passed, including TypeScript and R-output synchronization.
- Standalone Vercel bundle: `node scripts/sync-presentation.mjs --check-bundle` passed. Validates stored source/download agreement, category totals, example barcode identity, regular-offer medians and SHA-256 of published evidence files.
- Data: 600 selected/matched products; 1,541 associated quote rows; 598 primary products; 583 corrected joint-grade products. Product keys are unique, and the leading-zero barcode remains a string.
- Base-R export produced four real quote rows for three selected products. Example 3350031923081 joins €0.95 and €0.89 quotes to a 0.125 kg package; unit prices are €7.60/kg and €7.12/kg, and their median is €7.36/kg.
- Complete flow: `npm run check:flow` verifies 56 operations and 59 connections, two source roots, reachability of every node, no cycles, unique IDs, complete bilingual metadata and a record trace for every node. Every R excerpt is checked against its actual file and line number during synchronization.
- Browser: the canvas and minimap each contained all 56 nodes, including after changing processing regions. Previous/next navigation, direct selection, whole-flow zoom and locating the selected step were exercised. Canvas/list switching retained and located the selected node; the list contained all 56 operations.
- The package-conflict preview displayed structured quantity 0.11 kg against parsed text quantity 0.22 kg, followed by `conflict` and `quantity_usable = FALSE`. The duplicate-handling node retained 1,541 rows and showed 32 rows excluded from repeated counting in the median. The joint-grade output displayed 598 → 583 rows.
- Responsive browser checks at 390 × 844 and 1366 × 900. Both sizes support the complete canvas; mobile also has the full, scrolling step list. The pipeline's document width matched its mobile viewport, with data tables scrolling within their containers.
- Loopback evidence requests returned HTTP 200 for quote examples, the preparation R script, corrected coverage, presentation JSON and favicon.
- A clean browser reload produced no new console errors or warnings. Production dependency audit reported zero vulnerabilities.

Dashboard and Vercel publication are outside this version's implemented scope. The analytical R and Shiny files were not changed.

## English / Simplified Chinese switching

- Header language controls switch navigation, research content, workflow names/rules, diagram edge labels, source-page content, table labels and accessibility labels.
- Browser checks confirmed `html lang` and page titles change, and both English and Chinese preferences survive reload.
- Switching languages retained the selected package-check operation and identical R code. The full-flow checker validates English and Chinese titles, descriptions and conditions for every operation. Scientific identifiers, product names and source code intentionally retain their original form.
- Chinese sources and category tables were inspected. At the 390 × 844 mobile test size, both language controls remained visible and the page had no horizontal document overflow.
- Production build passed with TypeScript and the existing data validation.
