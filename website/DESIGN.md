# Design

User direction: neutral gray-white canvas with blue used sparingly as accent; restrained copy; few headings; layout communicates content. Apple-inspired component proportions, adapted for a website, rather than a claim of exact platform conformance.

## Scene

A reviewer reads the study on a laptop in a bright classroom, then inspects the processing steps. Use a neutral surface, clear type, and blue only for emphasis.

## Foundations

- System UI typography: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif. Do not download proprietary Apple fonts.
- Primary canvas #f7f7f8, surface #fff, text #1d2330, secondary text #5c6570, separators #e3e5e8.
- Accent #2865a5 for active states and meaningful links; navy #173b68 for primary actions. Soft panels use neutral #f2f3f5; pressed controls may use a light blue tint #e8f0fa. Violet #6352a0 is reserved for contrasting chart series only.
- Body 16–18px, controls 14–16px, minimum secondary text 13px. Numbers use tabular lining figures.
- Main width 1240px; immersive pipeline width 1440px. Spacing uses 4px multiples, with larger section gaps.
- Controls target 44px height, soft 10–12px corners; segmented controls use a neutral track and selected white surface.
- Nodes use 14px corners and a 1px neutral border. A restrained shadow distinguishes the diagram's interactive elements.
- Interaction transitions 180ms ease-out. No decorative entrance animation, gradients or glass backgrounds.

## Structure

Compact shared navigation. The study presents a factual title, brief consumer context and three research-question rows, followed by an ordered eight-step research workflow. Each step explains its purpose and activities, from defining the scope through the final presentation. Detailed data-processing operations and sample statistics remain in the pipeline and sources pages. The pipeline is a viewport-filling Tableau Prep-style workspace: the canvas forms the page background, with no framed graph container or document footer. Seventeen compact grouped nodes preserve all external connections; badges show the number of underlying operations. The collapsible left navigation contains inputs, stages and the complete 56-operation list. A resizable bottom data panel exposes each operation inside the selected node, its changes, before/after excerpts, clearly labelled excerpt-based field profiles and exact R source. Panels can be hidden to free the canvas; selection and camera persist across language changes. Selecting a node or operation keeps the existing pan and zoom; moving to the selection requires the explicit Locate step control. Mobile keeps the full canvas, with overlay navigation and vertically stacked record previews. Sources has a compact document list with meaningful download links.

## Dashboard

User direction, 13 November 2026: avoid slogans and direct appeals; use fewer secondary headings and small explanatory captions. Let layout, alignment, whitespace, table headers and control placement communicate the content. Keep essential units, sample sizes and price dates readable.

Open on Find products. A single cascader commits the food category and type together. The price histogram sits below it and reports the live count between two independently adjustable handles. Show five matching products on the left, with search, local filters and expansion in the list. Opening a row updates product details on the right. A link takes that product to Compare products as the starting reference.

Compare products starts with a reference and defaults to alternatives of the same food type that cost less and maintain or improve both grades. Price, nutrition and environment are independent criteria. Preview the first five matches by unit price and let users reveal the full list or clear the criteria. Show unit-price differences on a shared scale inside the list, with the reference as the zero point, and show both grade changes in each row. Allow comparison across the full category and show any inherited price-range constraint. Expand a product row to reveal its nutrient, carbon and quote evidence inline.

## EDA

The EDA page restores the original six analysis tabs and defaults to Data & prices. Category filters, chart scales, drill-downs and CSV exports follow the original research interface.
