# 正式数据说明

> 本文记录 11 月 2 日 frozen_v1 的获取与冻结状态。11 月 5 日 Step 4 恢复了原始对象中的环境 F 等级；当前三维联合样本为 583 款，后续入口见[修正说明](../04_eda/environment_grade_correction.md)。

日期：2026-11-02。阶段：Step 3 已完成。正式数据冻结为 `data/processed/frozen_v1/`；第四步直接读取该快照。实际覆盖和核查结果见 [数据核查报告](data_quality_review.md)，字段定义见 [数据字典](data_dictionary.md)。

## 研究范围与数据层级

研究使用法国门店、EUR、2024—2025 年的包装食品价格。Open Prices 的 2026-10-30 原始快照含 337,631 条记录，按法国、欧元、时间窗口、条码商品和正价格筛选后，保留 83,141 条报价、44,789 个候选条码。

正式比较限定饼干、早餐谷物、黑巧克力和果汁四类。价格观察以报价记录为单位，商品比较以独立条码为单位；两层数据通过字符型条码连接。前三类采用 EUR/kg，果汁采用 EUR/L。

## 正式样本的确定

先通过 Open Prices 商品目录完整枚举四类中已有报价、来源为 OFF 的商品，共 8,337 个类别目录条目。与历史价格条码连接后，再要求至少一条常规报价、有效整包净含量及相应的质量／体积基准，得到 3,002 个可抽样候选。

按固定顺序饼干、早餐谷物、黑巧克力、果汁，用 R 随机种子 20261102 从各类候选中不放回抽取 150 款，共 600 款。目录先按条码排序，完整候选、抽样顺序、规则及来源均保存。入选不以营养或环境评分齐全为条件。这个平衡分层样本服务于四类食品内部比较，各类样本数不作为市场占比。

600 款均已请求完整计划字段并取得商品对象。当前规格核查后，598 款进入主要比较集，568 款同时具备价格、Nutri-Score 2023 和环境等级。另两款的规格排除决定已记录，仍保留在完整入选表中。正式商品共连接 1,541 条历史报价。

## 数据来源、背景与许可

Open Prices 由 Open Food Facts 维护，记录社群贡献的价签、收据以及导入价格，包含日期、门店和凭证类型。Open Food Facts 提供社群维护的商品名称、类别、包装规格、营养及计算评分。本轮使用历史价格与当前商品资料，分别保存价格日期、来源更新时间及获取时刻。

官方数据库采用 ODbL，个别数据库内容另采用 DbCL。项目署名 Open Prices / Open Food Facts contributors；门店地理资料另注明 OpenStreetMap contributors。分享数据时随附来源、处理和许可说明。项目不下载商品或收据图片，处理表不包含贡献者账号、图片路径或门店精确坐标。

## 完整获取与复现流程

1. `R/00_download_prices.R` 校验原始价格 SHA-256，文件缺失时从固定上游 revision 下载；`R/01_import_prices.R` 生成价格底表与条码清单。
2. `R/05_select_formal_sample.R` 完整分页枚举四类目录，与价格底表连接并按种子分层抽样。目录参数、响应、获取时间与校验值均保存。
3. `R/06_acquire_formal_products.R` 对全部 600 款请求商品名称、品牌、规格、类别、每 100 g/ml 营养值、营养算法及分数、环境等级和明细、修改时间及结构版本。正式使用 JSON 搜索接口，以 POST 提交只读搜索参数，每批 100 条码，请求开始间隔至少 6.5 秒。批次遗漏另以单商品接口确认；本轮两项遗漏均补取成功。
4. `R/07_prepare_formal_data.R` 核对条码与当前类别，规范价格和营养单位，明确版本，生成各指标覆盖及规格处理决定。
5. `R/08_validate_and_freeze.R` 校验请求完整性、主键、连接数量、全部代表价格、版本及来源哈希，导出 frozen_v1；`R/09_write_formal_report.R` 从冻结文件生成核查报告和字段清单。

搜索接口返回兼容字段 `ecoscore_*` 和旧结构版本，计算指标另外保存其实际方法版本；两者分别解释。原始 JSON、POST 参数和 UTC 获取时间位于 `data/raw/open_food_facts/formal_2026-11-02/`。每个正式条码均有终态请求记录，未请求数量为 0。

`R/run_step3.R` 是正式入口。已有冻结快照时只做本地文件与来源校验、重建报告，不发起网络请求。没有快照时按以上顺序运行，逐请求复用缓存。网络请求有超时、重试与阶段期限，失败不会被标为已完成。后续数据刷新应创建新版本，保留 frozen_v1。

## 价格、规格与重复报价

条码商品报价按整件零售包装计。Open Prices 对条码商品留空 `price_per` 符合其校验规则；该字段用于无条码类别价格。`receipt_quantity` 是购买数量，不再用它除一次商品价格。

规格优先采用结构化整包净含量，支持 g、kg、ml、cl、dl、l，并用简单文本及多件装文本交叉核对，例如 4 × 125 g、125 g × 4、500 g（4 × 125 g）。文本内外数量或结构化总量相差超过 2% 时标记冲突。正式样本中，一款 110 g × 2 与结构化 110 g 冲突，另一款缺少当前净含量；两款排除出主单位价格比较，不按猜测修正。

代表价格为有效非折扣单位报价的中位数。同条码、同日期、同已知门店、同报价、同折扣和计价单位的完全相同报价组合合并一次；未知门店不合并。原始观察保留，另提供保留重复观察的常规中位数、含折扣中位数和分年汇总。第四步使用这些字段检查年份、门店和报价次数构成。

## 营养指标与算法

主营养等级使用 `nutriscore.2023`，保留 A—E 有序类别及原始分数。源算法、2021 等级与分数、2023 原报等级及完整版本对象另存。明确按冲调状态计算的六款等级不进入销售状态的等级比较，商品及其销售状态营养数值仍保留。

能量、糖、脂肪、饱和脂肪、蛋白质、纤维和盐使用销售状态的每 100 g/ml 数值。能量单位为 kcal，其余为 g；冲调值不替代销售值。有效性核查包含有限值、非负、单位及物理边界：每 100 g/ml 能量 0—1000 kcal，所选其他数值 0—100 g。原值、源单位及异常标志均保存；本轮这些检查未发现数值／单位异常。字段未提供仍保留为缺失。

## 环境指标与功能单位

环境等级优先使用法国值，A+ 单独保留。源字段名 `ecoscore_*` 映射至统一 `environment_*` 变量，并保存实际源字段与兼容结构版本。

碳估算 `agribalyse.co2_total` 与环境综合等级分别保存，保留标准食品代码、代理代码、名称和 AGRIBALYSE 版本。主碳排放子样本使用 3.2 版，共 594 款主要比较商品；其他版本保留原值并单列。

碳估算沿用原模型的 kg CO₂e/kg 食品基准、食品状态与生命周期范围。食品类别内部的数值差异主要来自标准食品映射。`formal_carbon_references.csv` 提供参考项及其关联商品数，第四步据此按参考类别解释关系，避免将共享估算视为独立品牌测量。EUR/L 商品不推算每升碳排放。

## 固定数据与后续分析

`analysis_products.rds`／`.csv` 是 598 款主要比较商品；`selected_products.rds`／`.csv` 保留 600 款入选记录及全部缺失、排除标志。价格—营养、价格—环境、三维联合与碳排放分别使用对应标志和字段完整性筛选；不会为全部指标齐全而删去其他视图仍可使用的商品。

冻结目录还包含报价明细、分年价格、抽样清单、请求状态、覆盖表、字典和 manifest。第四步从这里开展缺失模式、异常值、分布、汇总口径敏感性及关联分析，常规数据获取已在第三步完成。

历史价格与当前包装资料的时点差异、社群贡献价格覆盖及标准食品环境估算粒度在解释结果时统一考虑。早期 500 条码／50 数值请求只作为试取记录，正式样本已独立重新抽取并完整获取。

## 来源与核查记录

查阅及获取日期：2026-11-02。

- [Open Prices 官方数据集](https://huggingface.co/datasets/openfoodfacts/open-prices)：价格固定 revision `3d4e029340f3a5128f84913ab1ee5197399518c2`，SHA-256 `32aa1ca9de2663d4b455fdc70421ead1c7d7a1d01a4b2b76bfffabbabab91725`。
- [Open Food Facts API 使用说明](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/)、[批量条码查询说明](https://openfoodfacts.github.io/openfoodfacts-server/api/ref-cheatsheet/)、[搜索 API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/v2/search/get-search/)。实际正式搜索端点为 `https://world.openfoodfacts.org/cgi/search.pl`，`action=process`、`json=1`，使用只读 POST 搜索。
- 商品目录端点：`https://prices.openfoodfacts.org/api/v1/products`，按类别、`source=off`、已有报价条件分页。
- [价格单位校验](https://github.com/openfoodfacts/open-prices/blob/main/open_prices/prices/validators.py)、[收据购买数量说明](https://github.com/openfoodfacts/open-prices/issues/499)。
- [营养字段 schema](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_nutrition/)、[API 与 schema 版本说明](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ref-api-and-product-schema-change-log/)。
- [AGRIBALYSE 数据说明](https://doc.agribalyse.fr/documentation-en/agribalyse-data/data-access)、[功能单位](https://doc.agribalyse.fr/documentation-en/agribalyse-program/agribalyse-supporting-ecological-transition)、[数据边界与类别粒度](https://doc.agribalyse.fr/documentation-en/data-use/agribalyse-data-perimeter)。
- 获取、抽样与冻结的文件级校验值分别见 `formal_acquisition_manifest.json`、`formal_selection_manifest.json` 和 `frozen_v1/manifest.json`。
