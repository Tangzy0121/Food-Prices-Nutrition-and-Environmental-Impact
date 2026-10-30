# 食品数据可行性与现有证据

整理日期：2026-10-30。汇总前期检查，供 Step 2 的指标选择和 Step 3 的数据获取使用。正式数据范围与分析样本将在后续步骤确定。

## 已有数据与检查结果

### 价格快照与商品字段

Open Prices 的 2026-10-30 本地快照含 337,631 条价格记录。按法国（FR）、EUR、2024—2025 年、PRODUCT 类型、有条码、正价格筛选后，前期检查记录为 83,141 条价格观察，对应 44,789 个不同条码。

以随机种子 20261030 从这些条码中不放回抽取 200 个，通过接口取得 199 个当前商品对象。200 个条码中：

| 字段条件 | 商品数 |
| --- | ---: |
| 营养等级 a–e | 130 |
| 环境等级 a-plus、a–e | 115 |
| 两种等级均有 | 99 |
| 正规格且单位为 g/kg/ml/l/cl | 147 |
| 至少一个类别标签 | 163 |
| 两种等级、规格和类别标签均有 | 93 |

93/200（46.5%）描述本次样本的字段共现。食品类别、价格单位和规格还需核查后才能形成正式分析样本。

### 具体营养数值与碳排放估算

对上述随机条码中的前 30 个请求 Open Food Facts 产品 API，得到 13 个成功商品响应；其余为 8 次 HTTP 429、5 次 HTTP 404、4 次 SSL 错误。成功响应中，13 个含能量、糖、脂肪、饱和脂肪和蛋白质数值，7 个含纤维、12 个含盐，9 个含关联 AGRIBALYSE 食品类别的 `co2_total`。接口失败单独记录，覆盖率需在正式获取阶段重新评估。

## 已明确的处理事项

- 价格观察与独立商品分开统计；保留门店、日期、折扣和 `price_per`，再确定商品代表价格。
- 质量价格与体积价格分别统一为 EUR/kg 和 EUR/L，核对每件售价与商品净含量、多件装和单位售价的对应关系。
- 类别标签需整理为适合比较的分组；环境等级中的 A+ 单独保留，按实际方法版本处理。
- `nutriments` 的每 100 g/ml 数值与估算营养字段区分；`co2_total` 的版本、单位、类别匹配和同组变异在采用前核实。
- 当前商品资料与 2024—2025 年价格存在时点差异；社群贡献价格的门店与商品覆盖、环境类别模型的解释范围集中写入数据说明。
- 正式获取优先评估批量资料和缓存，遵守接口限流；以 R 编写正式导入、清洗和分析代码。

本阶段完成了字段和接口可行性检查，尚未计算价格与营养、环境表现之间的研究结果。

## 当前文件位置

| 材料 | 当前路径 |
| --- | --- |
| 原始价格快照 | [`data/raw/open_prices/open_prices_2026-10-30.parquet`](../../data/raw/open_prices/open_prices_2026-10-30.parquet) |
| 200 条码的商品对象抽样 | [`data/feasibility/food_product_sample_2026-10-30.json`](../../data/feasibility/food_product_sample_2026-10-30.json) |
| 30 条码的具体数值抽查 | [`data/feasibility/food_numeric_sample_2026-10-30.json`](../../data/feasibility/food_numeric_sample_2026-10-30.json) |
| 当时的试探脚本 | [`screen_food_sample.py`](../../archive/analysis/screen_food_sample.py)、[`screen_food_numeric.py`](../../archive/analysis/screen_food_numeric.py) |

脚本按当时的 `data/screening/` 路径编写，作为历史方法记录保留，未改造成正式运行入口。需要复用时，在新 R 工作流中明确使用当前路径及保存的新快照。

## 来源与核查记录

- [价格快照和商品抽样原记录](../../archive/2026-10-30_topic-exploration/notes/食品数据_可行性检查.md)。
- [营养和环境数值原记录](../../archive/2026-10-30_topic-exploration/notes/食品数据_具体数值抽查.md)。
- 价格来源：[Open Prices 数据集](https://huggingface.co/datasets/openfoodfacts/open-prices)。
- 商品字段：[Open Food Facts 营养文档](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_nutrition/)。
- 环境方法：[AGRIBALYSE 数据说明](https://doc.agribalyse.fr/documentation-en/agribalyse-data/data-access)。

以上为已有检查材料的整理；原始文件及其摘要校验见[归档索引](../../archive/README.md)。
