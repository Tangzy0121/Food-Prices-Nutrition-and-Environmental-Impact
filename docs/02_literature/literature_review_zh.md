# 食品价格、营养与环境影响：科学背景与文献综述

日期：2026-10-30　版本：1.0　课程阶段：Step 2  
[English version](literature_review_en.md) · [项目计划](../project_plan.md)

## 1. 研究背景与综述目标

本项目关注食品零售中的一个实际问题：消费者比较同类包装食品时，较高价格是否对应较好的营养与环境表现？价格、营养和环境构成三个需要共同观察的维度。Masset 等（2014）将三者纳入食品层面的比较；Bai 等（2025）则在健康饮食组合层面比较成本与排放。这两种分析尺度提示我们，应先明确比较对象，再解释“价格较低”和“表现较好”的含义。

本综述围绕价格与营养、价格与环境、计量单位及多维权衡四个主题，整理八篇研究，为法国、EUR、2024—2025 年有价格记录的包装食品研究建立分析框架。核心任务是形成研究问题、候选指标及后续数据核查重点。

## 2. 文献综合

### 2.1 价格与营养：总体差异与类别内部关系

Hoenink 等（2024）在英国 2013—2023 年数据中，发现按每 100 kcal 计价时，较健康食品的价格较高。Martinez 等（2025）的跨国研究则显示，类别内部的价格—营养关系会随食品组别、价格区间和营养属性变化。两项结果共同说明，分析尺度与价格口径应在解释结果之前明确。

对本项目而言，首先应在具有相似用途的食品中比较。不同类别可以分别展示价格和营养分布，再考察类别内部的关系。营养指标也应分工使用：综合等级用于概览，具体营养成分用于解释商品差异。糖、盐、饱和脂肪、蛋白质和纤维可以作为候选数值，最终保留哪些指标取决于文献含义与数据覆盖。单一营养成分的高低应结合食品类别解读。

### 2.2 价格与环境：绿色溢价需要经验检验

Martinez 等（2025）发现，在其研究的大多数食品组别内部，价格较高的食品具有较大的碳与水足迹。Nakavachara 等（2025）的预印本在瑞典超市商品数据中，控制包装规格、营养属性和固定效应后，未发现整体正向绿色溢价，并在部分组别观察到反向关系。

因此，本项目将价格—环境关系作为开放问题，分别观察不同类别的关系方向、分布和例外。包装规格、折扣、门店与观察日期将保留在数据中，用来区分商品特征与价格观察条件。EDA 优先展示分组分布和关联；后续是否增加模型分析，由数据结构和课程工作量决定。

### 2.3 计价与功能单位：先说明比较的对象

Masset 等（2015）比较了每 100 g 与每 100 kcal 两种功能单位，发现单位选择会改变营养、价格与排放之间的关系及被识别为有利选项的食品。单位应服务于研究情境。

本项目以同类零售商品比较为主，建议先将质量商品统一为 EUR/kg，体积商品统一为 EUR/L，并分别分析。营养数值采用相应的每 100 g 或每 100 ml 基准。对于能量值完整且大于零的可比子样本，可补充每 100 kcal 价格，观察主要模式是否随单位变化；这一补充需要同步报告样本变化。环境数值沿用原方法的功能单位，并在数据字典中注明食品状态、系统边界和版本。

### 2.4 营养与环境：关注共同改善与权衡

Clark 等（2022）的英国和爱尔兰商品研究发现，营养与环境表现经常相互支持，也存在例外。Desiderio 等（2026）的丹麦临期促销研究将商品连接到 Open Food Facts 评分，但营养与环境评分分别覆盖 72 和 66 个经验证商品，显示匹配覆盖本身就是分析设计的重要组成部分。

本项目据此采用多维展示：在类别内部观察价格、营养等级、环境等级及选定数值的联合分布，识别可能同时具有价格优势和较好评分的商品。每个视图分别报告独立商品数与字段覆盖，避免为了所有指标齐全而过早缩小整个分析样本。对于有利选项的筛选，后续可以比较类别内中位数规则或清楚定义的多维支配关系；判定规则应与图表一同呈现。

## 3. 本项目的研究切入点

这些研究分别涉及一般食品条目、饮食组合、其他国家的超市商品和特定促销场景。本项目的切入点是，将法国的价格观察与条码级商品资料连接，在同类包装食品内部呈现价格、营养和环境之间的关系，并将结果转化为可交互探索的信息。

具体贡献在于比较过程的透明性：说明价格如何归一化、多个价格观察如何形成商品代表值、每个指标覆盖哪些商品，以及总体模式在类别内部是否仍然存在。类别选择将同时考虑商品可替代性、有效独立条码数量和指标变异。价格较低、两方面表现较好的组合将作为值得继续比较的选项呈现。

## 4. 更新后的研究问题

1. **价格与营养：** 在同一食品类别内，商品代表单位价格与营养等级，以及选定的每 100 g/ml 营养数值，存在怎样的关系？
2. **价格与环境：** 在同一类别内，单位价格与环境等级如何关联？在具有有效类别匹配和足够环境数值变异的子样本中，价格与碳排放估算又呈现什么关系？
3. **联合表现与权衡：** 同类商品中，哪些选项在价格、营养和环境维度上同时处于相对有利位置？这些模式如何随食品类别、价格口径及折扣状态变化？

## 5. 文献对后续分析的具体启示

下表是基于综述形成的项目设计建议，将在 Step 3 的数据核查中落实。

| 分析环节 | 建议口径 | 后续核查重点 |
| --- | --- | --- |
| 分析单位与价格 | 商品为主要比较单位；先核对每件与单位售价，保留观察层明细；在明确的时间范围内，以非折扣有效单位价格中位数作为候选代表值 | 日期、门店、重复记录、规格、多件装及代表价格对年份和门店构成的敏感性 |
| 营养 | 综合等级概览，具体营养数值解释差异；等级作为有序类别处理 | 算法版本、数值单位、销售状态与冲调状态、缺失模式 |
| 环境 | 环境等级与类别碳排放估算分开分析，保留 A+ 等实际等级 | 方法版本、功能单位、类别匹配、独立环境取值数量；同类数值恒定时改做类别描述 |
| 类别与单位 | 先在相似食品类别内比较；EUR/kg 与 EUR/L 分开 | 分类层级、食品用途、每 100 kcal 敏感性样本 |
| EDA 与展示 | 分布图、分组散点图、等级交叉表和覆盖统计；数值关联可考虑 Spearman 等描述方法 | 每图的商品数、离群值及总体与分组结果的差异 |

研究采用观察性比较。社群贡献价格的覆盖、历史价格与当前商品资料的时点差异，以及环境类别估算的粒度，将集中纳入数据说明。以上设计建议尚未产生本项目的实证结果。

## 附录 A. 文献综述矩阵

发表年份与数据时点分开记录；下列样本量均为原研究的信息。

| 文献 | 主题与分析尺度 | 数据范围 | 指标与方法 | 主要发现／方法信息 | 对本项目的用途 |
| --- | --- | --- | --- | --- | --- |
| Masset et al. (2014) | 食品三维比较 | 法国，363 种常见食品 | SAIN:LIM、环境影响、价格；中位数规则 | 有利食品的识别依赖计价基准 | 借鉴多维比较框架 |
| Masset et al. (2015) | 功能单位 | 法国 INCA2 2006—2007；373 种食品；价格来自 2006 年 | 100 g／100 kcal；两种营养模型；秩相关 | 更换单位显著改变比较结果 | 安排单位敏感性分析 |
| Hoenink et al. (2024) | 价格—营养趋势 | 英国，2013—2023 | £/100 kcal；营养模型分类；纵向比较 | 较健康组的能量单位价格较高 | 明确价格口径 |
| Martinez et al. (2025) | 类别内外三维关联 | 181 国，2011、2017；860 种食品，48,316 条价格 | 价格、足迹及营养指标；分组比较 | 环境与营养的价格关系不同 | 分开研究两类表现 |
| Nakavachara et al. (2025)，预印本 | 商品绿色溢价 | 瑞典，2025 年 3 月；整理样本 5,458 件，回归另筛评分可用项 | 气候等级；对数价格回归及控制变量 | 整体未发现正向溢价 | 参考规格和类别控制 |
| Clark et al. (2022) | 商品营养—环境 | 英国、爱尔兰；57,185 件商品 | 成分推断、四项环境指标、Nutri-Score | 总体协同中存在例外 | 展示权衡和指标含义 |
| Desiderio et al. (2026) | 促销与评分连接 | 丹麦，2024—2025 年三个窗口；153 天 | 空间／网络分组；Open Food Facts 评分 | 评分匹配为部分商品 | 单独报告覆盖与筛选 |
| Bai et al. (2025) | 饮食成本—排放 | 171 国，2021 年 | 健康饮食组合的低成本／低排放比较 | 两种优化目标产生不同组合 | 建立多目标研究背景 |

## 附录 B. 检索与证据核查记录

- **检索日期与方式：** 2026-10-30，围绕已有六条线索进行定向补充检索；使用网页学术检索、PubMed、出版社页面、大学作者稿及 arXiv。关键词包括 `food price nutrition environmental impact`、`within food groups`、`green premium food products` 和 `functional unit sustainable foods`。
- **纳入原则：** 优先纳入联合比较价格、营养和环境的研究，并补充直接支持计价单位、商品评分或数据连接的方法研究。八篇核心文献中，七篇为期刊论文，一篇为明确标记的预印本。该定向综述服务于课程项目。
- **核查材料：** Hoenink、Masset（2015）、Nakavachara 的公开全文，以及 Desiderio 的出版社全文用于方法核查；Martinez 使用正式出版信息、摘要和公开作者稿。Clark 使用摘要及出版社可检索全文片段；Masset（2014）与 Bai 使用期刊摘要／PubMed 记录，其提炼限于这些材料明确报告的内容。
- **出版信息更新：** Martinez 的旧线索为 2024 年预印本，本综述改引 2025 年 AJCN 正式版本；Nakavachara 按本次查阅的 arXiv 版本引用。
- **进入 Step 3 的事项：** 补充 Masset（2014）和 Bai 的全文阅读；核对评分和环境模型版本、价格时间窗口及同类环境数值变异。现有数据可行性证据见[汇总记录](../03_data/feasibility_summary.md)。

## 参考文献

Bai, Y., Martinez, E. M., Yamanaka, M., Rissanen, M., Herforth, A. W., & Masters, W. A. (2025). Environmental impacts and monetary costs of healthy diets worldwide. *Nature Food, 6*, 1176–1185. [期刊 DOI](https://doi.org/10.1038/s43016-025-01270-4) · [摘要记录](https://pubmed.ncbi.nlm.nih.gov/41366143/)

Clark, M., Springmann, M., Rayner, M., Scarborough, P., Hill, J., Tilman, D., Macdiarmid, J. I., Fanzo, J., Bandy, L., & Harrington, R. A. (2022). Estimating the environmental impacts of 57,000 food products. *Proceedings of the National Academy of Sciences, 119*(33), e2120584119. [期刊 DOI](https://doi.org/10.1073/pnas.2120584119) · [摘要记录](https://pubmed.ncbi.nlm.nih.gov/35939701/)

Desiderio, A., Galdeman, A., Bäuerlein, F., & Lehmann, S. (2026). Mapping regional disparities in discounted grocery products. *npj Science of Food, 10*, Article 112. [期刊全文](https://www.nature.com/articles/s41538-026-00764-0)

Hoenink, J. C., Garrott, K., Jones, N. R. V., Conklin, A. I., Monsivais, P., & Adams, J. (2024). Changes in UK price disparities between healthy and less healthy foods over 10 years: An updated analysis with insights in the context of inflationary increases in the cost-of-living from 2021. *Appetite, 197*, 107290. [期刊 DOI](https://doi.org/10.1016/j.appet.2024.107290) · [大学仓储全文](https://api.repository.cam.ac.uk/server/api/core/bitstreams/1c2664bc-000a-44f7-8334-a0ca35d326f8/content)

Martinez, E. M., Tichenor Blackstone, N., Wilde, P. E., Herforth, A. W., & Masters, W. A. (2025). Retail prices, environmental footprints, and nutritional profiles of commonly sold retail food items in 181 countries. *The American Journal of Clinical Nutrition, 122*(5), 1265–1274. [期刊 DOI](https://doi.org/10.1016/j.ajcnut.2025.08.002) · [正式出版记录](https://pubmed.ncbi.nlm.nih.gov/40812564/) · [公开作者稿 v2](https://arxiv.org/abs/2401.13159v2)

Masset, G., Soler, L.-G., Vieux, F., & Darmon, N. (2014). Identifying sustainable foods: The relationship between environmental impact, nutritional quality, and prices of foods representative of the French diet. *Journal of the Academy of Nutrition and Dietetics, 114*(6), 862–869. [期刊 DOI](https://doi.org/10.1016/j.jand.2014.02.002) · [摘要记录](https://pubmed.ncbi.nlm.nih.gov/24703928/)

Masset, G., Vieux, F., & Darmon, N. (2015). Which functional unit to identify sustainable foods? *Public Health Nutrition, 18*(13), 2488–2497. [期刊 DOI](https://doi.org/10.1017/S1368980015000579) · [期刊全文](https://www.cambridge.org/core/journals/public-health-nutrition/article/which-functional-unit-to-identify-sustainable-foods/C07D9A2919219DE64CF35313A059FE81)

Nakavachara, V., Thongtai, C., Chalidabhongse, T., & Pharino, C. (2025). *The green premium puzzle: Empirical evidence from climate-friendly food products* [Preprint, v1]. arXiv. [预印本及全文入口](https://arxiv.org/abs/2507.10333v1)

## 数据方法补充来源与版本事项

以下官方资料用于字段解释，另列于八篇研究之外：

- Open Food Facts. (n.d.). [Product-Nutrition schema](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_nutrition/). 查阅日期：2026-10-30。文档说明 `_100g` 为销售状态下每 100 g，液体为每 100 ml 的标准化值；冲调状态另有字段。
- Open Food Facts. (n.d.). [API and product schema change log](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ref-api-and-product-schema-change-log/). 查阅日期：2026-10-30。2024-12-12 条目记录 Eco-Score 更名为 Green-Score，相关字段改为 `environmental_score_*`。现有抽样含 `ecoscore_*`，正式获取需根据实际 API／schema 版本映射并保留来源字段。
- ADEME. (n.d.). [AGRIBALYSE: Data access](https://doc.agribalyse.fr/documentation-en/agribalyse-data/data-access). 查阅日期：2026-10-30。类别碳排放字段在采用前需与相应版本的官方方法、功能单位和类别代码核对。
