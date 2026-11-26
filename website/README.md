# Food / Signal presentation website

React, TypeScript and Vite. An eight-chapter narrative of the study, followed by three deep dives: the complete R data-preparation flow at `#pipeline`, the six research views at `#eda`, the consumer comparison Dashboard at `#dashboard` and the sources at `#sources`.

The story runs `#story/opening` through `#story/answer`. Each chapter carries one argument, one visual and a hand-off line: the opening question, the comparison gap and the literature, the sample, the five pricing rules, price × nutrition, price × environment, the joint view with a working budget, and the answer. A sticky chapter rail jumps to any chapter; the pager and the left/right arrow keys move one chapter at a time; the last chapter returns to the opening and links to the dashboard, the report PDF, the pipeline and the sources. Chapters are separate hash routes, so one can be linked or refreshed directly, and the old `#study` address resolves to the opening. Navigation order is The story, Data pipeline, EDA, Dashboard, Sources.

The Tableau Prep-style workspace uses 17 grouped nodes and 20 external connections, with all 56 underlying operations available for inspection.

The canvas fills the page beneath the shared navigation. Related filters, field transformations and checks share a compact node; its badge shows how many operations it contains. A collapsible navigation panel, previous/next node controls, a direct operation selector, pan/zoom and a minimap navigate the flow. The resizable bottom panel lists the selected node's operations and shows each operation's actual counts, sanitized before/after records, excerpt-based field profiles and exact R source lines. Independent analysis subsets share an output node labelled as four datasets, without adding their overlapping row counts. Cumulative R predicates remain labelled and flagging steps preserve their row counts.

Selecting a node or operation updates its highlight and details while preserving the current pan and zoom. Use Locate step to move the camera to the selected node; the overview, minimap and zoom controls remain explicit camera actions.

The header switches between English and Simplified Chinese. The language is remembered in browser local storage; switching preserves the selected workflow step, canvas position and data/code view. R code, source files, product names, barcodes and scientific units remain in their original form. Shared translations live in `src/i18n.tsx`; complete bilingual operation metadata lives in `src/fullWorkflow.ts`.

## Run

```powershell
cd website
npm ci
npm run dev
```

`npm run build` validates and exports the presentation data, checks graph completeness and bilingual copy, checks TypeScript and builds `dist/`. `npm run check:flow` verifies all processing nodes and connections independently. `npm run preview` serves the build.

After rebuilding the report, run `npm run sync:report` to copy `output/food-value-report-v3.pdf` (or the English PDF) into `public/downloads/food-choices-report.pdf`, which is what the Download button serves. The committed PDF is a snapshot of the last assembled report.

`npm run check:story -- http://127.0.0.1:4173` exercises the eight chapters, the rail, the pager, keyboard navigation, the budget interaction, the product detail, the PDF link and both languages with headless Chrome. npm scripts launch foreground servers; automated background launches on Windows must use the project-required `Start-CodexBackground.ps1` launcher.

## Data

`scripts/sync-presentation.mjs` reads committed Step 3 selection tables, corrected Step 4 coverage and frozen product records. It checks unique product keys, sample counts and every displayed example's regular-offer median. It copies only explicitly listed evidence files into `public/evidence/`. Nothing recalculates the research or fetches live data in the browser.

The four real quote-example rows in `public/evidence/link-examples.csv` are generated with base R from the frozen `price_observations.rds`. To refresh them, run from the repository root:

```powershell
Rscript --vanilla website/scripts/export-link-examples.R .
Rscript --vanilla website/scripts/export-processing-trace.R .
```

The processing exporter reads the existing Parquet, cached category pages, frozen RDS files and correction CSV without changing them. It requires the project's existing R packages `jsonlite` and `nanoparquet`. The two generated `processing-trace.json` files are checked in for Vercel builds. The sync step checks that every R excerpt still matches its source file and line number; refresh the trace when those files change. Record previews omit contributor identifiers, receipt image paths and precise store coordinates.

The barcode examples include a multi-quote product, a single-quote product and a barcode with leading zeros. Environmental corrections are applied using the corrected Step 4 table. Dates remain separate for historical prices and current product attributes.

## GitHub Pages

`.github/workflows/deploy-pages.yml` builds pull requests and deploys `website/dist` from `main`. Set the repository's **Pages → Source** to **GitHub Actions** before the first deployment. The workflow supplies `VITE_BASE_PATH=/Food-Prices-Nutrition-and-Environmental-Impact/`; evidence links use Vite's base URL and hash navigation needs no rewrite. The Dashboard address is `https://tangzy0121.github.io/Food-Prices-Nutrition-and-Environmental-Impact/#dashboard`. Pages serves only this static React Dashboard; run the Shiny application separately for the course deliverable.

## Vercel

Import the Git repository and set **Root Directory** to `website`. Framework: **Vite**. Build: `npm run build`. Output: `dist`. Use Node.js 24, or 22.18 and newer. Dashboard validation uses Node’s built-in TypeScript support. The site needs no environment variables, database or server functions.

When the parent repository is available, the data-sync step refreshes its presentation bundle from the committed R outputs. For isolated-directory builds, it validates the checked-in bundle, including evidence-file hashes and the displayed example medians. Run `node scripts/sync-presentation.mjs --check-bundle` to exercise that standalone path locally. Refresh the bundle locally after changes to R outputs and commit it together with the website.

The website's `.gitattributes` preserves evidence and generated-data bytes so Git line-ending conversion does not invalidate the committed hashes.

Navigation uses URL hashes. Open `#eda` for exploratory analysis or `#dashboard` for product comparison.

## Exploratory data analysis

EDA restores the six-tab research interface from `8c5714c`: Data & prices, Nutrition, Environment, Joint comparison, Sensitivity and Year-to-year. It includes category filters, drill-down tables and CSV exports and reads the existing Step 4 data bundle.

## Design

See `PRODUCT.md` and `DESIGN.md`. Component proportions follow the user's Apple reference: system UI fonts, generous target areas and restrained controls. Button hit areas target 44 CSS px where practical; native-platform points and web pixels are not asserted to be equivalent. Reference: [Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography).

## Consumer dashboard

Find products uses a category and food-type cascader, followed by a two-ended price histogram with a live count. Select a row to see its details beside the list. Compare this product opens the separate comparison view with that item as its starting reference. The plot places cheaper alternatives left of the reference price and more expensive ones right of it, with rows for the changes in nutrition and environmental grades. Select a point to see the exact differences and quote count. The same food type and selected price range are the defaults, and the filtered results can be exported. Full comparison shows the nutrient profile, mapped carbon reference and historical quotes for the selected pair.

`src/data/dashboard.json` contains 598 corrected products, 1,538 price observations, nine executed R tables and 45 R box summaries. The food types use an ordered mapping of source category tags. Unmatched products are labelled Unclassified. To refresh from existing local inputs, run from the repository root:

```powershell
Rscript --vanilla website/scripts/export-dashboard.R .
```

The exporter reads the corrected product RDS, frozen quotes and `outputs/step4/tables/`. Run the Step 4 workflow first when analytical inputs change. Commit the refreshed bundle with the source. Production builds require no R runtime or Shiny service. `npm run check:dashboard` verifies source hashes when available, all product price medians, same-type alternatives, R boxes and the evidence tables. R and CSV source hashes normalize CRLF to LF so Windows and Linux checkouts agree. Frozen RDS hashes preserve exact bytes.

## Preview and browser verification

`npm run build:standalone` embeds the JavaScript, CSS and data into `../scratch/dashboard-review/food-signal-dashboard.html`, which opens directly on the dashboard. Use `#eda` to open the six-tab analysis directly. The archived 18 November version is described in [its release notes](../docs/05_dashboard/2026-11-18-consumer-redesign.md).

`npm run check:consumer -- http://127.0.0.1:5173/#dashboard` tests the product and research workflow with headless Chrome. It accepts a `file:///...html#dashboard` URL for the standalone build. Install dependencies with `npm ci` and set `CHROME_PATH` when Chrome is installed elsewhere. Screenshots are saved in `../scratch/dashboard-review/screenshots/`.

This redesign applies to the HTML/React website. The separate Shiny application still uses its previous interface; the underlying R inputs and statistical outputs were preserved.
