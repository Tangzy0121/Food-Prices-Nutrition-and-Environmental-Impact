# 正式数据字典：frozen_v1

日期：2026-11-02。适用于正式 600 款入选商品及其 1,541 条报价。主要比较集为其中 598 款。实际字段类型、缺失数量与唯一值数由 `R/09_write_formal_report.R` 输出至 `outputs/tables/step3/formal_field_inventory.csv`。条码为字符型，缺失为 R 的 NA，CSV 中为空单元格。

## 数据表与主键

| 文件 | 行粒度与用途 |
| --- | --- |
| `selected_products.rds`／`.csv` | 一条码一行，600 行，保留全部入选及排除记录 |
| `analysis_products.rds`／`.csv` | 一条码一行，598 行，第四步默认商品表 |
| `price_observations.rds` | 一条报价一行，1,541 行，主键 `price_id`，通过 `code` 连接商品表 |
| `prices_by_year.csv` | 一条码一年一行，分年代表价格及观察构成 |
| `selection.csv` | 分层抽样顺序、类别、候选规格及历史报价信息 |
| `source_requests.csv` | 每个正式条码的请求批次、终态及源响应路径 |
| `category_coverage.csv` | 每类别一行，正式样本与指标覆盖 |

## 商品标识、类别与来源

| 字段 | 含义／类型 | 来源与处理 |
| --- | --- | --- |
| `code` | 条码，商品表主键／字符 | 保留前导零，不转数值 |
| `category`、`category_tag` | 正式类别及其 OFF 标签／字符 | 饼干、早餐谷物、黑巧克力、果汁；由抽样规则确定 |
| `target_unit` | 该类价格基准／字符 | 前三类 kg，果汁 L |
| `sampling_order` | 类别内抽样顺序／整数 | 固定种子 20261102 |
| `product_name`、`brands` | 当前商品名称、品牌／字符 | 本轮 OFF 响应 |
| `catalog_name` | 构建候选清单时的目录名称／字符 | Open Prices 的 OFF 缓存 |
| `match_status` | 商品匹配状态／字符 | `matched`；确认找不到时为 `not_found_confirmed`，本轮全部匹配 |
| `categories_json` | 当前完整类别标签／JSON 字符 | 保留源标签列表 |
| `category_confirmed` | 当前标签是否确认正式类别／逻辑 | 与 `category_tag` 核对 |
| `schema_version` | 返回对象结构版本／数值 | 搜索兼容结构版本，与评分算法分开 |
| `last_modified_t` | 商品修改时刻／Unix 秒 | 来源字段 |
| `retrieved_at_utc` | 本轮获取时刻／字符 | UTC，ISO 格式 |
| `source_file`、`source_endpoint` | 原始响应路径、请求端点／字符 | 指向缓存 JSON 与官方搜索／确认接口 |
| `numeric_fetch_status` | 全部计划数值字段请求状态／字符 | 本轮均为 `ok`，没有 `not_requested` |
| `obsolete` | 是否标为过期／逻辑 | 上游为真时不进入主比较 |

`last_updated_t`、`no_nutrition_data`、`quality_errors_json`、`quality_warnings_json` 为兼容辅助列，本轮正式搜索字段未提供时记为 NA，不将缺失解释为无质量问题。具体营养数值按单项单位与物理边界核查。

## 规格与价格

| 字段 | 含义／类型 | 规则或单位 |
| --- | --- | --- |
| `quantity_text` | 原始规格文本／字符 | OFF `quantity` |
| `quantity_source`、`quantity_unit_source` | 原始结构化整包净含量及单位／字符 | OFF `product_quantity`、`product_quantity_unit` |
| `quantity_base` | 规范后的整包净含量／数值 | kg 或 L，由 `unit_basis` 区分 |
| `unit_basis` | 实际规格基准／字符 | kg 或 L |
| `quantity_status` | 规格核查状态／字符 | `confirmed` 文本与结构化一致；`structured_only` 结构化有效；`text_derived` 用文本补充；`conflict` 总量或量纲冲突；`multipack_unresolved` 未解析多件装；`missing_or_unsupported` 缺失或不支持 |
| `is_multipack`、`quantity_usable` | 多件装、规格可用标志／逻辑 | 多件装使用整包总量；冲突不换价 |
| `comparable_quantity` | 规格可用且量纲符合类别／逻辑 | `quantity_usable` 与 `target_unit` 一致 |
| `representative_price` | 常规代表单位价格／数值 | 有效非折扣、合并相同报价组合后的中位数；EUR/kg 或 EUR/L |
| `median_with_repeats` | 保留重复观察的常规价格中位数／数值 | 敏感性对照 |
| `median_all_prices` | 包括折扣的单位价格中位数／数值 | 合并相同报价组合，敏感性对照 |
| `n_prices`、`n_regular_prices`、`n_discounted_prices` | 全部、常规、折扣报价数／整数 | 该条码在历史窗口内 |
| `n_valid_regular_offers` | 形成代表价格的有效常规报价组合数／整数 | 相同组合合并后 |
| `n_stores`、`n_price_years` | 已知门店数、报价年份数／整数 | 未知门店不计入门店数 |
| `first_price_date`、`last_price_date` | 最早、最晚报价日期／日期 | 当前历史价格窗口 |

## 营养与环境

| 字段 | 含义／类型 | 单位或规则 |
| --- | --- | --- |
| `nutrition_data_per` | 原始营养申报口径／字符 | 实际使用标准化 `_100g` 数值，不直接使用份量值 |
| `nutri_grade_source`、`nutri_score_source`、`nutriscore_version_source` | 原始等级、分数、算法版本 | 原报值保留 |
| `nutri_grade_2021`、`nutri_score_2021` | 2021 算法等级与分数 | 留作版本比较 |
| `nutri_grade_2023_reported` | 2023 算法原报等级 | 包含冲调状态等级 |
| `nutri_grade`、`nutri_score` | 主营养等级与分数 | 使用 2023 算法；明确为冲调状态的等级在此留空 |
| `nutriscore_algorithm_version` | 主营养算法版本／字符 | 主等级有效时为 `2023` |
| `nutriscore_2023_computed`、`nutriscore_2023_preparation` | 2023 计算标志与食品状态 | `as_sold`、`prepared` 或缺失；明确冲调状态不参与销售状态等级比较 |
| `nutriscore_json` | 完整营养算法对象／JSON 字符 | 包含年份、计算状态和基础信息 |
| `energy_kcal_100g` | 能量／数值 | 销售状态每 100 g/ml 的 kcal |
| `sugars_100g`、`fat_100g`、`saturated_fat_100g` | 糖、脂肪、饱和脂肪／数值 | 销售状态每 100 g/ml 的 g |
| `proteins_100g`、`fiber_100g`、`salt_100g` | 蛋白质、纤维、盐／数值 | 销售状态每 100 g/ml 的 g |
| 营养名 + `_100g_reported`、`_unit_source`、`_invalid` | 原始数值、源单位、检查异常标志 | 保留原值；有效边界为能量 0—1000 kcal、其他 0—100 g，且单位匹配 |
| `environment_field_source` | 环境源字段／字符 | `ecoscore_*` 或 `environmental_score_*` |
| `environment_grade_fr`、`environment_grade_global` | 法国等级、全局等级／字符 | 原字段分别保留 |
| `environment_grade`、`environment_score` | 主环境等级与分数 | 优先法国值；等级 a-plus、a—e |
| `environment_grade_source`、`environment_status` | 采用等级的地域来源、计算状态／字符 | 本轮有效主等级来自 France |
| `agribalyse_version` | 碳估算方法版本／字符 | 与商品结构、营养算法版本分别记录 |
| `agribalyse_food_code`、`agribalyse_proxy_food_code` | 标准食品和代理代码／字符 | 类别映射 |
| `agribalyse_name` | 匹配的标准食品名称／字符 | 上游环境明细 |
| `co2_total_reported`、`co2_total` | 原始、有效碳估算／数值 | kg CO₂e/kg 食品；有效值为正，具备版本和至少一个映射代码 |
| `co2_mapping_available` | 是否具备方法版本与映射／逻辑 | 关联标准食品的信息可追踪 |

等级均存字符，EDA 中按明确次序创建有序因子；不把 A—E 直接当等距数值。碳估算共享的标准食品参考项及关联商品数见 `formal_carbon_references.csv`。

## 样本与排除标志

| 字段 | 含义／类型 |
| --- | --- |
| `in_primary` | 当前商品匹配、类别确认、规格基准正确、未过期且代表价格有效；598 款为真 |
| `has_nutri`、`has_environment`、`has_carbon` | 对应主营养等级、环境等级、碳估算是否有效，各自独立保留样本 |
| `joint_grades_price` | `in_primary` 且营养、环境等级同时有效；568 款为真 |
| `carbon_primary` | `in_primary` 且有效碳估算采用 AGRIBALYSE 3.2；594 款为真 |
| `exclusion_reason` | `included` 或明确排除原因；本轮排除为 `quantity_conflict`、`quantity_missing_or_wrong_basis` |

## 价格观察明细

| 字段 | 含义／类型 | 单位或规则 |
| --- | --- | --- |
| `price_id`、`code` | 价格唯一标识、连接条码／字符 | 来自 Open Prices |
| `date`、`year` | 报价日期、年份 | 2024—2025 |
| `price_eur` | 整件包装价格／数值 | EUR |
| `price_is_discounted`、`price_without_discount`、`discount_type` | 折扣标志、原报常规价、类型 | 原报常规价不替代实际常规报价 |
| `price_per_source`、`currency` | 原始计价单位、货币 | 条码商品的前者为空；货币 EUR |
| `location_id`、`city` | 门店 ID、城市 | 不含精确坐标 |
| `proof_id`、`proof_type` | 凭证 ID、类型 | 不含图片 |
| `receipt_quantity` | 收据购买数量 | 不再除一次包装价格 |
| `source`、`source_created`、`source_updated` | 客户端、创建和更新时间 | 与报价日期分开 |
| `potential_duplicate_n`、`potential_duplicate` | 相同报价组合数与标志 | 原观察保留 |
| `representative_keep` | 是否进入代表价格计算 | 同一已知门店的相同报价组合取一次；未知门店保留各观察 |
| `unit_price_eur` | 规范单位价格／数值 | `price_eur / quantity_base`；EUR/kg 或 EUR/L |
| `category`、`quantity_base`、`unit_basis`、`comparable_quantity`、`obsolete`、`category_confirmed` | 来自商品表的连接核查字段 | 与商品定义一致 |

来源、许可与处理依据统一记录在项目的 `docs/03_data/data_description.md`。首轮试取字典另保存在 `docs/03_data/pilot_data_dictionary_2026-11-02.md`，不作为正式字段定义。
