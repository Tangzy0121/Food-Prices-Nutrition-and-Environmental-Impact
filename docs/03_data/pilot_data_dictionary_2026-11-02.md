# 数据字典

版本：2026-11-02。下表解释研究字段和规则；实际列类型、缺失数量和唯一值数量由 `R/04_write_data_report.R` 输出至 `outputs/tables/step3/field_inventory.csv`。商品缓存保留上游原字段，处理表中条码均为字符型，缺失统一保存为 R `NA`，CSV 表现为空单元格。

## 价格观察与获取

| 字段 | 含义／类型 | 来源与单位 |
| --- | --- | --- |
| `price_id` | 价格记录唯一标识／字符 | Open Prices `id` |
| `code` | 商品条码、商品表连接键／字符 | `product_code`；保留前导零 |
| `date`、`year` | 报价日期、年份／日期、整数 | Open Prices `date` |
| `price_eur` | 整件包装报价／数值 | `price`，EUR |
| `price_is_discounted` | 是否折扣报价／逻辑 | Open Prices |
| `price_without_discount` | 来源记载的未折扣价格／数值 | EUR；未用其替代实际常规报价 |
| `discount_type` | 折扣类型／字符 | 原值保留 |
| `price_per_source` | 原始计价单位／字符 | `price_per`；本研究筛选后均空 |
| `currency` | 货币／字符 | 研究范围为 EUR |
| `location_id`、`city` | 门店标识、城市／整数、字符 | 门店表信息；未知仍为空 |
| `proof_id`、`proof_type` | 凭证标识、类型／整数、字符 | 用于了解收集渠道，不含凭证图片 |
| `receipt_quantity` | 收据购买数量／数值 | 不用于再次除价 |
| `source` | 贡献客户端／字符 | Open Prices |
| `source_created`、`source_updated` | 记录创建、更新时间／时间戳 | 上游时间，与报价日期分开 |
| `potential_duplicate_n`、`potential_duplicate` | 相同报价组合的观察数及标志／整数、逻辑 | 商品、日期、门店、价格、折扣和原计价单位分组 |
| `representative_keep` | 形成候选代表价格时是否保留／逻辑 | 相同报价组合取第一次；原始观察不删除 |
| `unit_price_eur` | 换算后的单位报价／数值 | EUR/kg 或 EUR/L，由 `unit_basis` 区分 |

## 商品识别、规格与匹配

| 字段 | 含义／类型 | 来源与处理 |
| --- | --- | --- |
| `code` | 商品条码、商品表主键／字符 | Open Food Facts |
| `product_name`、`brands` | 名称、品牌／字符 | 名称优先法语，其次上游 main，再次首个名称 |
| `match_status` | 商品匹配状态／字符 | `matched` 食品匹配；API 路线另分 `other_product_database`、`not_linked_in_open_prices`、`not_returned`；批量路线为 `not_in_bulk_export` |
| `product_database_source` | 上游连接的商品库／字符 | `off` 食品、`obf` 美妆、`opf` 其他商品、`opff` 宠物食品；`not_linked`、`not_returned` 另列 |
| `product_source`、`product_source_synced` | 商品资料来源、缓存上次同步时间／字符 | 保留 Open Prices 的同步时点 |
| `metadata_retrieved_at_utc` | 本轮取得元数据的 UTC 时刻／字符 | 与来源同步时刻区分 |
| `numeric_fetch_status` | 数值获取状态／字符 | `not_requested`、`ok`、`not_found`、`error`；批量入口为 `bulk` |
| `n_prices`、`n_regular`、`n_discounted` | 原始报价、非折扣、折扣观察数／整数 | 在价格范围内按条码汇总 |
| `n_stores` | 已知不同门店数／整数 | 不计未知门店 |
| `first_price_date`、`last_price_date` | 该条码最早、最晚报价日期／日期 | 当前价格窗口内 |
| `pilot_order` | 试取顺序／整数 | 仅 pilot 表；固定随机种子 20261102 |
| `quantity_text` | 包装上的原始规格文本／字符 | OFF `quantity` |
| `quantity_source`、`quantity_unit_source` | 结构化整包净含量及单位／字符 | OFF `product_quantity`、`product_quantity_unit` |
| `quantity_base` | 换算后的整包净含量／数值 | kg 或 L |
| `unit_basis` | 质量或体积基准／字符 | `kg` 或 `L`；二者不互换 |
| `quantity_status` | 规格核查结果／字符 | `confirmed` 两种资料一致；`structured_only` 仅结构化有效；`text_derived` 由简单文本补充；`conflict` 数量或量纲冲突；`multipack_unresolved` 多件装待解析；`missing_or_unsupported` 缺失／不支持 |
| `is_multipack`、`quantity_usable` | 多件装标志、可换算标志／逻辑 | 多件装使用整包总净含量；冲突和未解析多件装暂不换价 |
| `obsolete`、`product_obsolete` | 上游过期标志、标准化逻辑标志 | 已过期不生成代表单位价格 |
| `last_modified_t`、`last_updated_t` | 商品修改、更新时刻／Unix 秒 | 指本轮商品资料，不是历史配方快照 |
| `schema_version` | 商品对象结构版本／整数 | 不作为营养算法版本 |
| `quality_errors_json`、`quality_warnings_json` | 上游质量错误、警告标签／JSON 字符 | 保留检查线索 |

## 类别、营养和环境

| 字段 | 含义／类型 | 来源与单位 |
| --- | --- | --- |
| `categories_json`、`food_groups_json` | 原始食品类别、食品组标签／JSON 字符 | 标签列表可重叠 |
| `category` | 第一版比较类别／字符 | 按版本化规则优先级赋值；`unassigned` 为未命中，`unmatched` 为未匹配商品 |
| `category_matches`、`category_match_count` | 命中的全部预设类别、数量／字符、整数 | 保留交叉归类线索 |
| `nutri_grade_source`、`nutri_grade` | 原始、有效营养等级／字符 | 有效等级 a–e；后续按有序类别绘图 |
| `nutriscore_score` | 上游营养评分／数值 | 原值保留 |
| `nutriscore_algorithm_version` | 营养算法版本／字符 | 该批量导出未提供，记为 NA |
| `nutrition_data_per`、`no_nutrition_data` | 原始申报口径、无营养资料标志 | 使用标准化 `_100g` 数值而非直接使用申报份量 |
| `energy_kcal_100g` | 能量／数值 | 每 100 g/ml，kcal |
| `sugars_100g`、`fat_100g`、`saturated_fat_100g` | 糖、脂肪、饱和脂肪／数值 | 每 100 g/ml，g |
| `proteins_100g`、`fiber_100g`、`salt_100g` | 蛋白质、纤维、盐／数值 | 每 100 g/ml，g |
| 上述营养名 + `_100g_reported` | 清洗前上游数值／数值 | 出自 `nutriments` 中同名条目的 `100g` |
| 上述营养名 + `_unit_source` | 上游营养单位／字符 | kcal 或 g；单位不符单独标记 |
| 上述营养名 + `_invalid` | 数值／单位检查异常标志／逻辑 | 原值存在但未通过本项目有效性规则 |
| `environment_grade_fr`、`environment_score_fr` | 法国环境等级、分数 | `environmental_score_data.grades.fr`、`.scores.fr` |
| `environment_grade_global`、`environment_score_global` | 上游全局环境等级、分数 | 原始 `environmental_score_*` |
| `environment_grade`、`environment_score` | 采用的环境等级、分数 | 优先法国，缺失时回退全局；等级 a-plus、a–e |
| `environment_grade_source` | 等级来源／字符 | `France` 或 `global_fallback` |
| `environment_grade_field_source` | 缓存等级的源字段／字符 | 本轮为 Open Prices `ecoscore_grade` |
| `environment_status` | 环境计算状态／字符 | `environmental_score_data.status` |
| `agribalyse_food_code`、`agribalyse_proxy_food_code` | 食品及代理映射代码／字符 | `environmental_score_data.agribalyse` |
| `agribalyse_version`、`agribalyse_name` | 环境方法版本、匹配食品名称／字符 | 上游类别估算信息 |
| `co2_total_reported`、`co2_total` | 原始、有效碳排放估算／数值 | kg CO₂e/kg 食品；保留原模型的食品状态和边界 |
| `co2_mapping_available` | 是否具备类别代码和版本／逻辑 | 食品或代理代码至少一个，且版本存在 |

## 代表价格与样本标志

| 字段 | 含义／单位 | 处理 |
| --- | --- | --- |
| `representative_price` | 候选常规代表价格，EUR/kg 或 EUR/L | 去相同报价组合后的有效非折扣单位报价中位数 |
| `median_with_repeats` | 保留重复组合的常规价格中位数 | 第四步价格汇总敏感性比较 |
| `median_all_prices` | 含折扣中位数 | 去相同报价组合，保留折扣观察 |
| `n_valid_prices`、`n_regular_valid` | 有效报价数、去重后有效常规报价数 | 相应中位数的样本信息 |
| `n_valid_stores` | 候选代表价格对应的已知门店数 | 非折扣、有效、去重报价 |
| `has_price`、`has_nutri`、`has_environment`、`has_carbon` | 相应指标是否可用／逻辑 | 各指标分别保留样本 |
| `joint_grades_price` | 代表价格与营养、环境等级同时可用／逻辑 | 联合比较子样本标志 |

类别汇总表中的 `n_nutri`、`n_environment`、`n_carbon` 均要求同时有有效代表价格；`n_joint` 要求三者齐全。`n_carbon_values` 为四舍五入至六位小数后的不同碳估算数，`n_agribalyse_versions` 为该碳排放子样本的方法版本数。标签覆盖表允许一件商品计入多个标签，不能将各标签商品数直接相加。

## 文件与来源

文件路径和运行命令见 [项目入口](../../README.md) 与 [data/README.md](../../data/README.md)。字段依据及查阅日期集中列于 [数据说明](data_description.md) 文末。
