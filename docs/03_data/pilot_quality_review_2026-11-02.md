# 第三步数据获取与核查结果

日期：2026-11-02。本报告由 `R/04_write_data_report.R` 根据实际输出生成；范围：**pilot**。

## 当前成果

已复现价格筛选，完成 500 个候选条码的商品匹配；其中 400 个进入 OFF 食品匹配集，100 个未进入该匹配集，详细状态见下表。
具有有效常规代表单位价格的商品 328 个；价格、营养等级与环境等级同时可用 199 个。

原始价格观察、商品资料和连接后的价格表分别保存，来源版本、文件校验值和运行环境已有记录。

## 价格范围

| stage | price_observations | products |
| --- | --- | --- |
| raw | 337631 | 147645 |
| france | 216623 |  78069 |
| eur | 216458 |  78010 |
| period_2024_2025 |  89163 |  44791 |
| barcode_product |  83143 |  44791 |
| positive_price |  83141 |  44789 |

价格 ID 重复数为 0。在本轮匹配范围对应的 964 条价格观察中，相同商品、日期、门店、价格、折扣与原计价单位的潜在重复观察共 51 条。这些观察保留在底表中，代表价格使用合并报价组合后的中位数，同时提供保留重复观察的对照值。

## 商品与字段覆盖

| indicator | n_products | percent_of_requested |
| --- | --- | --- |
| 目标条码 | 500 | 100.0% |
| 匹配商品 | 400 | 80.0% |
| 有效常规代表价格 | 328 | 65.6% |
| 营养等级 | 297 | 59.4% |
| 环境等级 | 271 | 54.2% |
| 价格与两种等级联合可用 | 199 | 39.8% |
| 具备版本与类别映射的碳估算 |  31 | 6.2% |

| match_status | n_products |
| --- | --- |
| matched | 400 |
| not_linked_in_open_prices |  72 |
| not_returned |   2 |
| other_product_database |  26 |

覆盖率以本次目标条码为分母；各类别表中的营养、环境和碳排放计数还要求存在有效代表价格。

本轮通过 Open Prices 的 OFF 缓存取得规格与等级；固定随机顺序的前 50 个条码另请求 OFF API v3.2 补充数值，其中 43 个返回商品对象。其余商品的数值状态为未请求，数值完整性据请求子样本解释。

## 类别覆盖与下一步选择

| category | unit_basis | n_products | n_price | n_nutri | n_environment | n_joint | n_carbon | n_carbon_values | candidate_for_expansion | candidate_for_eda |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| unassigned | kg | 246 | 240 | 192 | 165 | 145 | 20 | 19 | FALSE | FALSE |
| unassigned | L |  48 |  46 |  27 |  33 |  18 |  5 |  4 | FALSE | FALSE |
| biscuits | kg |   7 |   7 |   7 |   7 |   7 |  2 |  2 | TRUE | FALSE |
| breakfast_cereals | kg |   5 |   5 |   5 |   5 |   5 |  0 |  0 | TRUE | FALSE |
| milk_chocolates | kg |   6 |   6 |   5 |   6 |   5 |  1 |  1 | FALSE | FALSE |
| breads | kg |   4 |   4 |   4 |   4 |   4 |  0 |  0 | FALSE | FALSE |
| dark_chocolates | kg |   4 |   4 |   4 |   4 |   4 |  0 |  0 | FALSE | FALSE |
| dry_pasta | kg |   5 |   5 |   5 |   3 |   3 |  1 |  1 | FALSE | FALSE |
| fruit_juices | L |   3 |   3 |   3 |   3 |   3 |  0 |  0 | FALSE | FALSE |
| dairy_desserts | kg |   4 |   4 |   4 |   2 |   2 |  0 |  0 | FALSE | FALSE |
| milks | kg |   2 |   2 |   2 |   2 |   2 |  0 |  0 | FALSE | FALSE |
| yogurts | kg |   1 |   1 |   1 |   1 |   1 |  0 |  0 | FALSE | FALSE |
| biscuits | — |   1 |   0 |   0 |   0 |   0 |  0 |  0 | FALSE | FALSE |
| breads | — |   1 |   0 |   0 |   0 |   0 |  0 |  0 | FALSE | FALSE |
| breakfast_cereals | — |   1 |   0 |   0 |   0 |   0 |  0 |  0 | FALSE | FALSE |
| dairy_desserts | — |   1 |   0 |   0 |   0 |   0 |  0 |  0 | FALSE | FALSE |
| dark_chocolates | — |   1 |   0 |   0 |   0 |   0 |  0 |  0 | FALSE | FALSE |
| milk_chocolates | — |   1 |   0 |   0 |   0 |   0 |  0 |  0 | FALSE | FALSE |
| milks | L |   1 |   1 |   0 |   1 |   0 |  0 |  0 | FALSE | FALSE |
| unassigned | — |  58 |   0 |   0 |   0 |   0 |  0 |  0 | FALSE | FALSE |
| unmatched | — | 100 |   0 |   0 |   0 |   0 |  0 |  0 | FALSE | FALSE |

按当前工作量初筛规则，biscuits、breakfast_cereals可优先扩大获取并抽查商品用途与规格。

类别初筛结合独立商品数、联合评分覆盖和等级变异。原始标签统计允许重叠，可用于继续细分宽类别和检查未分组商品。碳排放取值差异主要反映其关联的标准食品类别，第四步应围绕这些类别解释关系，并核对食品状态。

## 规格、数值与版本

| quantity_status | unit_basis | n_products |
| --- | --- | --- |
| confirmed | L |  43 |
| confirmed | kg | 233 |
| conflict | kg |   1 |
| missing_or_unsupported | — |  63 |
| multipack_unresolved | kg |   4 |
| multipack_unresolved | — |   1 |
| structured_only | L |   9 |
| structured_only | kg |  46 |
| — | — | 100 |

包装冲突和未解析多件装保留在人工复核表；其余有效规格按 kg、L 分别计算价格。营养单位与边界检查如下。

| nutrient | n_present | n_invalid | n_numeric_requested_in_matched_products |
| --- | --- | --- | --- |
| energy_kcal | 34 | 0 | 43 |
| sugars | 34 | 0 | 43 |
| fat | 34 | 0 | 43 |
| saturated_fat | 34 | 0 | 43 |
| proteins | 34 | 0 | 43 |
| fiber | 26 | 0 | 43 |
| salt | 34 | 0 | 43 |

| numeric_fetch_status | n_products |
| --- | --- |
| not_found |   7 |
| not_requested | 450 |
| ok |  43 |

| schema_version | agribalyse_version | environment_grade_source | n_products |
| --- | --- | --- | --- |
| 1001 | 3.1.1 | France |   3 |
| 1001 | 3.2 | France |  28 |
| 1001 | — | global_fallback |  12 |
| — | — | global_fallback | 357 |
| — | — | — | 100 |

`schema_version` 是字段结构版本；批量导出未提供明确 Nutri-Score 算法版本。当前环境指标使用上游实际方法版本，法国等级与全局回退分别标记。

## 后续安排

本轮完成 500 条码试取流程，正式分析样本需按候选类别继续扩大获取后确定。

1. 对初筛类别中的商品用途、规格疑点和重复报价影响进行抽查，确定主要比较类别。
2. 使用分年代表价格和保留重复观察的中位数，检查年份、门店与观察次数构成。
3. 分别建立价格—营养、价格—环境等级和三维联合视图；碳排放按标准食品类别与方法版本安排补充分析。
4. 将最终类别与指标选择回写文献综述和研究问题，再开展分布、关联与图表分析。

## 文件与复现依据

- 数据说明与处理规则：[data_description.md](data_description.md)。
- 字段解释：[data_dictionary.md](data_dictionary.md)；完整列清单：`outputs/tables/step3/field_inventory.csv`。
- 商品字段缓存：`data/raw/open_food_facts/products_api_pilot_2026-11-02.rds`。
- API 原始响应与请求时间：`data/raw/open_food_facts/api_pilot_2026-11-02/`。
- 来源版本说明：`live API responses cached individually; see request URLs and UTC timestamps`；缓存 SHA-256：`8264a28c0fa6d83bbd7f0ab96283765102f5ee42bb8afe46fcb54b3484de4682`。
- 获取开始／完成（UTC）：2026-11-02T00:52:03Z / 2026-11-02T00:52:05Z。
- 数据表：`data/processed/products_pilot.rds`、`.csv` 与 `prices_linked_pilot.rds`。
- 核查表、获取摘要和 `sessionInfo.txt`：`outputs/tables/step3/`。
- 上游链接、署名及许可记录集中列在数据说明文末。
