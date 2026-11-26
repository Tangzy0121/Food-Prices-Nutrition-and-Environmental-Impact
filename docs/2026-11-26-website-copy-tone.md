# Website story copy: AI-tone pass

Date: 2026-11-26. Scope: the eight story chapters (`website/src/Story.tsx`), English and Chinese. The dashboard, EDA and pipeline copy were not touched.

## Method

The rendered text of each chapter was exported to Markdown and checked with `lieflat-less-ai-tone` (`detect.py`, v2 rules). The Chinese pass ran the script and the four semantic candidate sets; the English pass could not use the script (its thresholds are calibrated on Chinese characters and skip texts under 500 characters), so the same rule set was applied by hand with explicit counts.

Counts are per-piece hits, not a significance claim about the author or the tool used to draft the copy. Human baselines come from the skill's two calibration corpora and are quoted only to show direction.

## Metrics

| Item | Before | After | Reference |
|---|---|---|---|
| Prompt colon, Chinese | 2 (0.966/1,000 chars) | 0 | human ≈0.08 |
| Explanatory colons, English | 9 | 1 (section label) | rule hit, no English baseline |
| Semicolons, Chinese | 3.38/1,000 chars | 0 | GPT fingerprint δ+0.80 |
| Semicolons, English | 13 | 2 (both deliberate pairs) | same direction |
| Dense comma lists, Chinese | 4 (1.931/1,000) | 3 (1.454/1,000) | human ≈1.78 |
| Em dashes, Chinese | 0.483/1,000 | 0.485/1,000 | action line 2; human 0.80 |
| MTLD (synonym churn) | 481 | 415 | human ≈143, AI ≈227 |
| Three-clause isomorphism | 0 | 0 | — |
| Section-length CV | 0.302 | 0.301 | below human 0.83; left alone |

## Changes

Representative edits; the full set is 44 string pairs in `Story.tsx`.

| Location | Before | After |
|---|---|---|
| 07 answer lead | The answer to the opening question is: not reliably. | The short answer is no. |
| 05 callout | This is the problem with price: it bundles two different things into one number. | Price bundles two different things into one number. |
| 06 note | Grades are ordinal: no distance between letters is assumed… | Grades are ordinal. No distance between letters is assumed… |
| 04 reading | …sit on the zero line: a product that costs twice as much… | …sit on the zero line. A product that costs twice as much… |
| 07 takeaway | Treat a premium as a question, not a signal. | A premium is a question. |
| 07 actors | …narrowing a choice: set the category… | …narrowing a choice. Set the category… |
| 04 heading | In two aisles, price tracks nutrition. / In two, it does not. | Price tracks nutrition in two. / In the other two, it does not. |
| 05 heading | A greener shelf costs more, but only in two aisles. | Greener products cost more, but only in two categories. |
| 02 heading | Four aisles, 598 products… | Four categories, 598 products… |
| 07 takeaway | The four aisles have different price ranges… | The four categories have different price ranges… |
| 03 steps | Solids become €/kg; juice becomes €/L. | Solids become €/kg. Juice becomes €/L. |
| 01 lead | …how much the price tag actually tells you | …how much the price actually tells you |

The vocabulary now uses one name per concept in analytical sentences: `category` for the four groups, `shelf` and `aisle` only in the opening scene. `price tag` was replaced by `price`.

## Retained, with reasons

- `Leading zeros kept; many quotes, one product` and `Shoppers choose products; retailers read position.`: two-clause contrasts where a full stop would break the pairing.
- `Read them as reference-level differences, not a brand ranking`: a data-scope limit, not a strawman reversal.
- `It moves with recipe and sourcing, not with price`: factual contrast.
- One em dash in 04 (`the grade reports one letter — in this category, always D or E`): a deliberate pause, and the density stays below the action line.
- Three dense lists remain: the five Nutri-Score components, the four cost items, and the UI caption `Filter by category, compare two products, export CSV`. All are definitional or interface text.
- Heading density (3.878/1,000) and section-length CV are structural properties of a website with chapter markers; the report keeps them as observations and does not reshape sections for rhythm.

## Verification

`npm run build`, `npm run check:story` and `npm run check:consumer` pass after the rewrite. No structural, numerical or citation changes were made; every edited sentence keeps its figures, qualifiers and dates.
