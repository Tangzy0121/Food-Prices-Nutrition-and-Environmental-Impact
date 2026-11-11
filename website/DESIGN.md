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

Compact shared navigation. The study has a factual title, project scope, research-question rows, and a deliberately drawn data-flow preview. The pipeline is one continuous Tableau Prep-style canvas containing every data-preparation operation, with compact operation symbols, labels, counts and explicit input/output branches. Stage controls move the viewport instead of filtering nodes. A selected-step inspector, paired before/after tables, exact R excerpts, minimap and sequential navigation make the entire flow inspectable. Mobile has a complete step-list alternative. Sources has a compact document list with meaningful download links.
