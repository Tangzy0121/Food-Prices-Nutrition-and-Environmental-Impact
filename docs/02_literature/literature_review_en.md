# Food Prices, Nutrition and Environmental Impacts: Scientific Background and Literature Review

Date: 2026-10-30 · Version: 1.0 · Course stage: Step 2  
[中文版](literature_review_zh.md) · [Project plan](../project_plan.md)

## 1. Background and review objectives

This project addresses a practical food retail question: when consumers compare similar packaged foods, do higher prices correspond to better nutritional and environmental performance? Price, nutrition and environmental impact provide three dimensions for joint assessment. Masset et al. (2014) compared these dimensions at food level; Bai et al. (2025) examined costs and emissions of healthy diet baskets. These different scales highlight the need to define the comparison before interpreting lower prices or better performance.

The review brings together eight studies on price and nutrition, price and environmental impact, functional units, and multidimensional trade-offs. It develops an analytical framework for packaged foods with French, euro-denominated price observations from 2024–2025. Its purpose is to establish research questions, candidate measures and priorities for subsequent data checks.

## 2. Literature synthesis

### 2.1 Price and nutrition: overall differences and within-category relationships

Using UK data from 2013–2023, Hoenink et al. (2024) found that healthier foods cost more per 100 kcal. In the international study by Martinez et al. (2025), within-group price–nutrition relationships varied across food groups, price ranges and nutritional attributes. Together, these findings make the analytical scale and price denominator central to interpretation.

The project should therefore begin with foods serving similar purposes. Category-level price and nutrition distributions can provide context before examining relationships within categories. Nutritional measures should have complementary roles: overall grades provide an overview, while individual nutrients help explain product differences. Sugars, salt, saturated fat, protein and fibre are candidates; their eventual inclusion depends on their meaning and coverage. Individual nutrient levels will be interpreted in their food-category context.

### 2.2 Price and environmental impact: testing the green premium

Martinez et al. (2025) found larger carbon and water footprints among more expensive foods within most groups studied. In a preprint using Swedish supermarket products, Nakavachara et al. (2025) found no overall positive green premium after controlling for package size, nutritional attributes and fixed effects; some groups showed an inverse relationship.

The project will consequently treat price–environment relationships as open questions, examining direction, distributions and exceptions separately by category. Package size, discounts, stores and observation dates will be retained to distinguish product characteristics from price-observation conditions. EDA will initially emphasize grouped distributions and associations. Any subsequent modelling will depend on the data structure and the scope of the course project.

### 2.3 Price denominators and functional units

Masset et al. (2015) compared 100 g and 100 kcal functional units and found that the choice changed the relationships between nutrition, prices and emissions, as well as the foods identified as favourable. The unit should therefore match the research context.

For comparisons of similar retail products, the proposed starting point is EUR/kg for mass-based products and EUR/L for volume-based products, analysed separately. Nutrient quantities will use the corresponding 100 g or 100 ml basis. For comparable products with complete, positive energy values, price per 100 kcal can provide a sensitivity analysis, with any change in sample composition reported alongside it. Environmental quantities will retain their documented functional unit, food state, system boundary and method version.

### 2.4 Nutrition and environmental impact: joint benefits and trade-offs

Clark et al. (2022) found frequent alignment between nutritional and environmental performance in UK and Irish products, alongside exceptions. In a Danish near-expiry promotion study, Desiderio et al. (2026) linked products to Open Food Facts scores, with validated nutritional and environmental grades covering 72 and 66 products respectively. Matching coverage is therefore an important part of the analytical design.

The proposed approach is to examine joint distributions of price, nutritional grades, environmental grades and selected numerical measures within categories. Each view will report its own number of distinct products and field coverage, rather than requiring every product to have all candidate measures at the outset. Later screening of favourable options could compare within-category median rules or clearly defined multidimensional dominance. The chosen rule should accompany the visualization.

## 3. The project's research focus

The selected studies cover generic food items, diet baskets, supermarket products in other countries and specific promotion settings. This project focuses on connecting French price observations to barcode-level product information and presenting relationships among price, nutrition and environmental performance within comparable packaged-food categories.

Its contribution will be a transparent comparison process: explaining unit-price normalization, aggregation of repeated prices into product-level values, the products covered by each measure, and whether overall patterns persist within categories. Category selection will consider substitutability, the number of eligible distinct barcodes and variation in the measures. Products combining lower prices with favourable nutritional and environmental performance will be presented as options for further comparison.

## 4. Refined research questions

1. **Price and nutrition:** Within a food category, how does a product's representative unit price relate to its nutritional grade and selected nutrient quantities per 100 g/ml?
2. **Price and environmental impact:** How does unit price relate to environmental grade within a category? In subsets with valid food-category matching and sufficient environmental variation, what relationship appears between price and estimated carbon emissions?
3. **Joint performance and trade-offs:** Which comparable products occupy relatively favourable positions across price, nutrition and environmental dimensions? How do these patterns vary by category, price denominator and discount status?

## 5. Implications for subsequent analysis

The following are project design proposals arising from the synthesis, to be operationalized during Step 3.

| Analytical element | Proposed approach | Subsequent checks |
| --- | --- | --- |
| Unit of analysis and price | Compare products; validate package versus unit prices and retain observation-level records. Consider the median valid non-discounted unit price within a defined period as the representative value. | Dates, stores, duplicates, quantities, multipacks, and sensitivity to year and store composition. |
| Nutrition | Use grades for overview and nutrient quantities for interpretation; treat grades as ordered categories. | Algorithm version, units, as-sold versus prepared state, and missingness. |
| Environment | Analyse grades and food-category carbon estimates separately; retain actual grades, including A+. | Method version, functional unit, matching and number of distinct environmental values; use category descriptions when values are constant. |
| Categories and units | Compare similar foods first; keep EUR/kg and EUR/L analyses separate. | Classification depth, product use and the energy-based sensitivity sample. |
| EDA and presentation | Use distributions, grouped scatter plots, grade cross-tabulations and coverage summaries; consider descriptive rank associations such as Spearman correlation. | Product counts per view, outliers, and differences between pooled and grouped patterns. |

The study uses observational comparisons. The coverage of contributed prices, timing differences between historical prices and current product information, and the granularity of category-level environmental estimates will be documented together in the data description. These proposals have not yet produced empirical findings for this project.

## Appendix A. Literature review matrix

Publication years and data periods are distinguished below. Sample sizes refer to the original studies.

| Study | Theme and analytical scale | Data scope | Measures and methods | Main finding or methodological feature | Project relevance |
| --- | --- | --- | --- | --- | --- |
| Masset et al. (2014) | Three-dimensional food comparison | France; 363 common foods | SAIN:LIM, environmental impacts and prices; median rules | Favourable selections depend on the price basis. | Multidimensional comparison framework. |
| Masset et al. (2015) | Functional units | French INCA2, 2006–2007; 373 foods; 2006 prices | 100 g/100 kcal; two nutrient models; rank correlations | Unit changes alter comparisons substantially. | Unit sensitivity analysis. |
| Hoenink et al. (2024) | Price–nutrition trends | UK, 2013–2023 | £/100 kcal; nutrient-profile classification; longitudinal comparison | Higher energy-based prices for healthier foods. | Explicit price denominator. |
| Martinez et al. (2025) | Within/between-group relationships | 181 countries, 2011 and 2017; 860 foods, 48,316 prices | Prices, footprints and nutrient profiles; grouped comparisons | Environmental and nutritional price gradients differ. | Separate the two outcomes. |
| Nakavachara et al. (2025), preprint | Product-level green premium | Sweden, March 2025; 5,458 cleaned products, with further score availability filtering for regressions | Climate grades; log-price regressions and controls | No overall positive premium. | Package and category controls. |
| Clark et al. (2022) | Product nutrition–environment links | UK and Ireland; 57,185 products | Ingredient inference, four environmental indicators and Nutri-Score | Alignment with exceptions. | Trade-off displays and measure interpretation. |
| Desiderio et al. (2026) | Promotions and score linkage | Denmark; three 2024–2025 windows, 153 days | Spatial/network grouping; Open Food Facts scores | Scores cover a subset of products. | Report coverage and selection separately. |
| Bai et al. (2025) | Diet costs and emissions | 171 countries, 2021 | Low-cost/low-emission healthy diet comparisons | Different objectives yield different baskets. | Multidimensional research context. |

## Appendix B. Search and evidence record

- **Date and approach:** Targeted follow-up searches on 2026-10-30, starting from six existing leads. Sources included academic web searches, PubMed, publisher pages, university manuscripts and arXiv. Search terms included `food price nutrition environmental impact`, `within food groups`, `green premium food products` and `functional unit sustainable foods`.
- **Selection:** Priority was given to joint comparisons of price, nutrition and environment, complemented by methods relevant to price denominators, product scores and data linkage. The eight core studies comprise seven journal articles and one explicitly identified preprint. This focused review serves the course project.
- **Evidence consulted:** Public full texts of Hoenink, Masset (2015) and Nakavachara, and Desiderio's publisher full text supported method checks. Martinez was checked through the publication record, abstract and public author manuscript. Clark was checked through the abstract and searchable publisher full-text excerpts. Masset (2014) and Bai were summarized from journal abstracts/PubMed records; extraction is confined to what those records report.
- **Publication update:** The earlier Martinez lead was a 2024 preprint; this review cites the 2025 AJCN journal article. Nakavachara is cited as the arXiv version consulted.
- **Follow-up for Step 3:** Extend full-text reading of Masset (2014) and Bai; verify score and environmental-model versions, price time windows and within-category environmental variation. Existing feasibility evidence is in the [data summary](../03_data/feasibility_summary.md).

## References

Bai, Y., Martinez, E. M., Yamanaka, M., Rissanen, M., Herforth, A. W., & Masters, W. A. (2025). Environmental impacts and monetary costs of healthy diets worldwide. *Nature Food, 6*, 1176–1185. [Journal DOI](https://doi.org/10.1038/s43016-025-01270-4) · [Abstract record](https://pubmed.ncbi.nlm.nih.gov/41366143/)

Clark, M., Springmann, M., Rayner, M., Scarborough, P., Hill, J., Tilman, D., Macdiarmid, J. I., Fanzo, J., Bandy, L., & Harrington, R. A. (2022). Estimating the environmental impacts of 57,000 food products. *Proceedings of the National Academy of Sciences, 119*(33), e2120584119. [Journal DOI](https://doi.org/10.1073/pnas.2120584119) · [Abstract record](https://pubmed.ncbi.nlm.nih.gov/35939701/)

Desiderio, A., Galdeman, A., Bäuerlein, F., & Lehmann, S. (2026). Mapping regional disparities in discounted grocery products. *npj Science of Food, 10*, Article 112. [Publisher full text](https://www.nature.com/articles/s41538-026-00764-0)

Hoenink, J. C., Garrott, K., Jones, N. R. V., Conklin, A. I., Monsivais, P., & Adams, J. (2024). Changes in UK price disparities between healthy and less healthy foods over 10 years: An updated analysis with insights in the context of inflationary increases in the cost-of-living from 2021. *Appetite, 197*, 107290. [Journal DOI](https://doi.org/10.1016/j.appet.2024.107290) · [University repository full text](https://api.repository.cam.ac.uk/server/api/core/bitstreams/1c2664bc-000a-44f7-8334-a0ca35d326f8/content)

Martinez, E. M., Tichenor Blackstone, N., Wilde, P. E., Herforth, A. W., & Masters, W. A. (2025). Retail prices, environmental footprints, and nutritional profiles of commonly sold retail food items in 181 countries. *The American Journal of Clinical Nutrition, 122*(5), 1265–1274. [Journal DOI](https://doi.org/10.1016/j.ajcnut.2025.08.002) · [Publication record](https://pubmed.ncbi.nlm.nih.gov/40812564/) · [Public author manuscript v2](https://arxiv.org/abs/2401.13159v2)

Masset, G., Soler, L.-G., Vieux, F., & Darmon, N. (2014). Identifying sustainable foods: The relationship between environmental impact, nutritional quality, and prices of foods representative of the French diet. *Journal of the Academy of Nutrition and Dietetics, 114*(6), 862–869. [Journal DOI](https://doi.org/10.1016/j.jand.2014.02.002) · [Abstract record](https://pubmed.ncbi.nlm.nih.gov/24703928/)

Masset, G., Vieux, F., & Darmon, N. (2015). Which functional unit to identify sustainable foods? *Public Health Nutrition, 18*(13), 2488–2497. [Journal DOI](https://doi.org/10.1017/S1368980015000579) · [Publisher full text](https://www.cambridge.org/core/journals/public-health-nutrition/article/which-functional-unit-to-identify-sustainable-foods/C07D9A2919219DE64CF35313A059FE81)

Nakavachara, V., Thongtai, C., Chalidabhongse, T., & Pharino, C. (2025). *The green premium puzzle: Empirical evidence from climate-friendly food products* [Preprint, v1]. arXiv. [Preprint and full-text access](https://arxiv.org/abs/2507.10333v1)

## Supplementary data-method sources and version notes

The following official documentation supports field interpretation and is additional to the eight studies:

- Open Food Facts. (n.d.). [Product-Nutrition schema](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_nutrition/). Accessed 2026-10-30. The documentation defines `_100g` as standardized as-sold values per 100 g, or per 100 ml for liquids; prepared-product values have separate fields.
- Open Food Facts. (n.d.). [API and product schema change log](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ref-api-and-product-schema-change-log/). Accessed 2026-10-30. The 2024-12-12 entry records the rename from Eco-Score to Green-Score and the change to `environmental_score_*` fields. Existing samples contain `ecoscore_*`; acquisition will require mapping by actual API/schema version while retaining source fields.
- ADEME. (n.d.). [AGRIBALYSE: Data access](https://doc.agribalyse.fr/documentation-en/agribalyse-data/data-access). Accessed 2026-10-30. Before using category carbon values, check the corresponding official version, method, functional unit and food-category code.
