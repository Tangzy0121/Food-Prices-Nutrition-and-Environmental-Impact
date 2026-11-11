# Food / Signal presentation website

React, TypeScript and Vite. A presentation of the research questions and the complete R data-preparation flow, with 56 inspectable operations and 59 connections on one Tableau Prep-style canvas. No dashboard is implemented.

Each filter, field transformation, quantity check, barcode join, aggregation and analysis-subset condition has its own node. Stage buttons locate a region without hiding the rest of the graph. Previous/next controls, a step selector, pan/zoom and a minimap navigate the flow. Each node exposes actual before/after counts, sanitized record excerpts, and exact R source lines. Cumulative views that expand an inline R predicate are labelled explicitly; flagging steps preserve their row counts.

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

## Vercel

Import the Git repository and set **Root Directory** to `website`. Framework: **Vite**. Build: `npm run build`. Output: `dist`. Use Node.js 22 or 24. The site needs no environment variables, database or server functions.

When the parent repository is available, the data-sync step refreshes its presentation bundle from the committed R outputs. For isolated-directory builds, it validates the checked-in bundle, including evidence-file hashes and the displayed example medians. Run `node scripts/sync-presentation.mjs --check-bundle` to exercise that standalone path locally. Refresh the bundle locally after changes to R outputs and commit it together with the website.

The website's `.gitattributes` preserves evidence and generated-data bytes so Git line-ending conversion does not invalidate the committed hashes.

Navigation uses URL hashes, so study, pipeline and source links work without a server rewrite. The site is ready for deployment; no Vercel deployment is created by the local development workflow.

## Design

See `PRODUCT.md` and `DESIGN.md`. Component proportions follow the user's Apple reference: system UI fonts, generous target areas and restrained controls. Button hit areas target 44 CSS px where practical; native-platform points and web pixels are not asserted to be equivalent. Reference: [Apple buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography).
