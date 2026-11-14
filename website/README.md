# Food / Signal presentation website

React, TypeScript and Vite. A presentation of the research questions and the complete R data-preparation flow. The Tableau Prep-style workspace uses 17 grouped nodes and 20 external connections, with all 56 underlying operations available for inspection. The shared navigation also includes the six-direction research dashboard at `#dashboard`, following the user-confirmed EDA chart plan.

The canvas fills the page beneath the shared navigation. Related filters, field transformations and checks share a compact node; its badge shows how many operations it contains. A collapsible navigation panel, previous/next node controls, a direct operation selector, pan/zoom and a minimap navigate the flow. The resizable bottom panel lists the selected node's operations and shows each operation's actual counts, sanitized before/after records, excerpt-based field profiles and exact R source lines. Independent analysis subsets share an output node labelled as four datasets, without adding their overlapping row counts. Cumulative R predicates remain labelled and flagging steps preserve their row counts.

Selecting a node or operation updates its highlight and details while preserving the current pan and zoom. Use Locate step to move the camera to the selected node; the overview, minimap and zoom controls remain explicit camera actions.

The header switches between English and Simplified Chinese. The language is remembered in browser local storage; switching preserves the selected workflow step, canvas position and data/code view. R code, source files, product names, barcodes and scientific units remain in their original form. Shared translations live in `src/i18n.tsx`; complete bilingual operation metadata lives in `src/fullWorkflow.ts`.

## Run

```powershell
cd website
npm ci
npm run dev
```

`npm run build` validates and exports the presentation data, checks graph completeness and bilingual copy, checks TypeScript and builds `dist/`. `npm run check:flow` verifies all processing nodes and connections independently. `npm run preview` serves the build. npm scripts launch foreground servers; automated background launches on Windows must use the project-required `Start-CodexBackground.ps1` launcher.

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

Navigation uses URL hashes, so study, pipeline and source links work without a server rewrite. The site is ready for deployment; no Vercel deployment is created by the local development workflow.

## Design

See `PRODUCT.md` and `DESIGN.md`. Component proportions follow the user's Apple reference: system UI fonts, generous target areas and restrained controls. Button hit areas target 44 CSS px where practical; native-platform points and web pixels are not asserted to be equivalent. Reference: [Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography).

## Research dashboard

The chart contract is [research_dashboard.md](../docs/05_dashboard/research_dashboard.md). The six views cover data and prices, nutrition, environment, joint comparison, sensitivity, and paired annual changes. Charts preserve the R analysis units and statistical definitions. All four categories appear as separate facets by default; the category selector limits the active view. Coverage cells reveal missing products; joint cells reveal their member products. CSV buttons export the active figure’s data for the selected categories. Year tables support search, sorting and pagination; export includes every matching record.

`src/data/dashboard.json` contains 598 corrected products, nine executed R tables and 45 R box summaries. To refresh from existing local inputs, run from the repository root:

```powershell
Rscript --vanilla website/scripts/export-dashboard.R .
```

The exporter uses the existing environmental correction routine and reads `outputs/step4/tables/`. It does not regenerate EDA result tables; run the Step 4 workflow first if analytical inputs change. Commit the refreshed bundle with the source. Production builds require no R runtime or Shiny service. `npm run check:dashboard` checks source hashes when available and independently checks boxes, coverage, correlations, joint cells, carbon reference grouping and paired-year summaries. R and CSV source hashes normalize CRLF to LF so Windows and Linux checkouts agree; frozen RDS hashes preserve exact bytes. It also works with the checked-in bundle when only `website/` is deployed.
