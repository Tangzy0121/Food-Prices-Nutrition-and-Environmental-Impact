# Food Prices, Nutrition, and Environmental Impact: Comparing Products Within Food Categories

**Industry Selection and Problem Context | R for Data Science Final Project**  
Version: 1.0 | Date: 2026-10-30 

## Industry and Problem Context

This project focuses on the food retail industry, examining the prices, nutritional profiles, and environmental impacts of packaged foods. When comparing similar products, consumers need to balance their budgets with nutritional information and environmental considerations. Retail category analysts also need to understand the characteristics of products across price ranges. Guided by the question “Does a higher price mean a better product?”, the project brings price, nutrition, and environmental performance into a common framework to explore their relationships and trade-offs.

## Target Audience and Decision Context

The primary audience is consumers comparing products within the same food category. The secondary audience is food retail category analysts. The analysis will help these audiences understand how nutritional and environmental performance vary across price ranges within a category, identify sets of products worth comparing more closely, and inform product information displays and category positioning.

## Research Questions

1. Within the same food category, do products with higher unit prices have better nutritional profiles?
2. Within the same food category, what is the relationship between unit price and environmental performance?
3. How do nutritional and environmental performance vary together? Are there lower-priced products that perform well on both dimensions, and how does this pattern vary across food categories?

## Research Scope and Data Approach

The initial scope covers packaged foods with price records from 2024–2025 in France, denominated in euros. Open Prices records will be linked to Open Food Facts product information using barcodes. Products will be the main unit of comparison, while store and date information will be retained for individual price observations. Food categories and measurement units will be standardized before a representative price is determined for each product.

Candidate indicators include nutrition and environmental scores, nutrient values such as sugar, saturated fat, and protein, and carbon emission estimates associated with the products’ corresponding AGRIBALYSE food categories. The final categories, indicators, and sample scope will be determined by the literature and data coverage.

## Expected Outputs and Study Scope

The project will proceed through a literature review, data acquisition, exploratory data analysis in R, dashboard design, and Shiny implementation. The dashboard will present price distributions within food categories and the relationships among price, nutrition, and environmental performance. Specific indicators and interactive features will be selected after the literature review and exploratory analysis. The study will primarily use observational comparisons. The data documentation and final report will address the coverage of crowdsourced price records, the timing differences between historical prices and current product information, and the interpretation of category-based environmental estimates.

## Sources and Preliminary Work

- Course requirements: [R Final Project Requirements, Step 1, page 1](../../course/R%20Final%20Project%20Requirements.pdf).
- Data approach: [Open Prices dataset](https://huggingface.co/datasets/openfoodfacts/open-prices) and [Open Food Facts documentation](https://openfoodfacts.github.io/documentation/).
- Existing materials: [Data feasibility summary (in Chinese)](../03_data/feasibility_summary.md). The formal literature review is scheduled for Step 2.
