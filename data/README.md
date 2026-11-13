# 数据目录与冻结快照

完整的数据来源、整理逻辑、价格构造、分析方法和结果见 [数据分析流程](analysis_workflow.md)。

正式数据已获取并冻结为 `processed/frozen_v1/`，四类各 150 款，共 600 款入选商品，598 款进入主要比较集。当前分析从原冻结版恢复环境 F 等级，使用 `processed/step4_v1_1/` 修正版，三维联合样本为 583 款；原冻结版保留的 568 款是修正前口径。

## 当前分析读取

首次使用时，在项目根目录重建修正版及 EDA 结果。`step4_v1_1/` 中的派生 RDS 文件由这一步在本地生成：

```powershell
Rscript --vanilla -e "source('R/10_eda.R', encoding='UTF-8'); run_step4()"
```

```r
products <- readRDS("data/processed/step4_v1_1/analysis_products.rds")
selected <- readRDS("data/processed/step4_v1_1/selected_products.rds")
prices <- readRDS("data/processed/frozen_v1/price_observations.rds")
```

## 原始冻结文件

以下文件保存在 `processed/frozen_v1/`，用于核查、追溯和重建修正版：

| 冻结文件 | 用途 |
| --- | --- |
| `analysis_products.rds`／`.csv` | 598 款主要比较商品 |
| `selected_products.rds`／`.csv` | 600 款完整入选记录，保留缺失、排除及方法版本 |
| `price_observations.rds` | 1,541 条对应报价及单位价格核查状态 |
| `prices_by_year.csv` | 按条码、年份的报价构成与代表价格 |
| `selection.csv` | 类别、抽样顺序及候选资料 |
| `source_requests.csv` | 600 个条码的完整请求终态 |
| `category_coverage.csv`、`tables/` | 冻结时的指标覆盖与核查表 |
| `data_dictionary.md`、`manifest.json` | 字段定义、来源与文件 SHA-256 |

`joint_grades_price` 在原冻结版中标记 568 款，在当前修正版中标记 583 款三维等级比较商品。`carbon_primary` 标记 594 款主要比较集中具备 AGRIBALYSE 3.2 碳估算的商品。各营养数值视图按相应字段筛选，保留自己的分母。

## 原始来源与工作表

| 路径 | 用途 |
| --- | --- |
| `raw/open_prices/open_prices_2026-10-30.parquet` | 337,631 条原始价格记录，约 34.6 MB，保持原文件 |
| `raw/open_prices/open_prices_2026-10-30_manifest.json` | 固定版本、来源 URL 和 SHA-256 |
| `raw/open_food_facts/formal_2026-11-02/catalog/` | 四类完整候选目录的分页响应 |
| `raw/open_food_facts/formal_2026-11-02/products/` | 正式商品批量搜索、补取及获取过程响应，实际采用文件见 manifest |
| `raw/open_food_facts/formal_2026-11-02/products_formal.rds` | 正式商品响应提取对象 |
| `processed/price_observations.rds`、`product_universe.csv` | 83,141 条法国历史报价、44,789 个候选条码的底表 |
| `processed/formal_category_candidates.csv`、`formal_selection.csv` | 类别目录筛选与 600 款正式抽样清单 |
| `processed/products_formal.rds`、`.csv`、`prices_linked_formal.rds` | 冻结前正式工作表；当前 EDA 从冻结版重建修正输入 |
| `feasibility/`、`raw/open_food_facts/api_pilot_2026-11-02/`、`processed/*pilot*` | 早期可行性与试取过程材料 |

价格来源：[Open Prices 官方数据集](https://huggingface.co/datasets/openfoodfacts/open-prices)，revision `3d4e029340f3a5128f84913ab1ee5197399518c2`，SHA-256 `32aa1ca9de2663d4b455fdc70421ead1c7d7a1d01a4b2b76bfffabbabab91725`。

## 使用与复现

在项目根目录运行 `Rscript --vanilla R/run_step3.R`。已有 frozen_v1 时只校验快照与来源文件、重建核查报告，不发起网络请求。冻结文件保持不变，未来数据刷新另建版本。

条码按字符读取。原始响应保留来源、请求参数、HTTP 方法、UTC 时间和版本；不把重新访问在线接口视为同一历史快照。公开数据随项目保留来源、许可和署名，详情见 [正式数据说明](../docs/03_data/data_description.md)、[字典](../docs/03_data/data_dictionary.md)、[核查报告](../docs/03_data/data_quality_review.md)。
