# Design

User direction: black and white with a small amount of green emphasis; restrained copy; few headings; layout communicates content. Apple-inspired component proportions, adapted for a website, rather than a claim of exact platform conformance.

## Scene

A reviewer reads the study on a laptop in a bright classroom, then inspects the processing steps. Use a light neutral surface, strong dark type, and clear controls.

## Foundations

- System UI typography: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif. Do not download proprietary Apple fonts.
- Primary canvas #fafafa, surface #fff, text #191919, secondary text #626262, separators #e7e7e7.
- Accent #23834f for active states and meaningful links. Pale green #eff7f1 for selected nodes only.
- Body 16–18px, controls 14–16px, minimum secondary text 13px. Numbers use tabular lining figures.
- Main width 1240px; immersive pipeline width 1440px. Spacing uses 4px multiples, with larger section gaps.
- Controls target 44px height, soft 10–12px corners; segmented controls use a neutral track and selected white surface.
- Nodes use 14px corners and a 1px neutral border. A restrained shadow distinguishes the diagram's interactive elements.
- Interaction transitions 180ms ease-out. No decorative entrance animation, gradients or glass backgrounds.

## Structure

Compact shared navigation. The study presents a factual title, brief consumer context and three research-question rows, followed by an ordered eight-step research workflow. Each step explains its purpose and activities, from defining the scope through the final presentation. Detailed data-processing operations and sample statistics remain in the pipeline and sources pages. The pipeline is a viewport-filling Tableau Prep-style workspace: the canvas forms the page background, with no framed graph container or document footer. Seventeen compact grouped nodes preserve all external connections; badges show the number of underlying operations. The collapsible left navigation contains inputs, stages and the complete 56-operation list. A resizable bottom data panel exposes each operation inside the selected node, its changes, before/after excerpts, clearly labelled excerpt-based field profiles and exact R source. Panels can be hidden to free the canvas; selection and camera persist across language changes. Selecting a node or operation keeps the existing pan and zoom; moving to the selection requires the explicit Locate step control. Mobile keeps the full canvas, with overlay navigation and vertically stacked record previews. Sources has a compact document list with meaningful download links.

## Dashboard

User direction, 13 November 2026: avoid slogans and direct appeals; use fewer secondary headings and small explanatory captions. Let layout, alignment, whitespace, table headers and control placement communicate the content. Keep essential units, sample sizes and price dates readable.

The user's six-direction chart plan is the dashboard's governing reference; see `../docs/05_dashboard/research_dashboard.md`. Use one factual title, a row of six analysis tabs, a shared category selector and flat chart sections. Show all four categories as separate facets by default. Use coverage and joint heatmaps; log-price boxplots with individual product points; price–sugar scatterplots; reference-level carbon bubbles; connected sensitivity coefficients; and tables for paired annual changes. Consumer budget filters and A/B shopping comparisons are outside this research dashboard's main flow. Preserve the existing light monochrome identity rather than adopting the dark background of the reference table. Green carries meaningful low-relative-price cells and alternative coefficients. Method explanations belong in an expandable section.
