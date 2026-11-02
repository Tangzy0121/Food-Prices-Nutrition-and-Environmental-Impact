source("R/formal_helpers.R", encoding = "UTF-8")
frozen <- jsonlite::read_json("data/processed/frozen_v1/manifest.json", simplifyVector = TRUE)
p <- readRDS("data/processed/frozen_v1/selected_products.rds")
x <- readRDS("data/processed/frozen_v1/price_observations.rds")
read_output <- function(name) {
  path <- file.path("data/processed/frozen_v1/tables", name)
  header <- readr::read_csv(path, n_max = 0, show_col_types = FALSE)
  spec <- if ("code" %in% names(header)) readr::cols(code = readr::col_character(), .default = readr::col_guess()) else readr::cols(.default = readr::col_guess())
  readr::read_csv(path, col_types = spec, show_col_types = FALSE)
}
md_table <- function(x) {
  x <- as.data.frame(x)
  row <- function(z) paste0("| ", paste(ifelse(is.na(z), "—", as.character(z)), collapse = " | "), " |")
  c(row(names(x)), row(rep("---", ncol(x))), if (nrow(x)) apply(x, 1, row) else character())
}
inventory <- function(df, name) bind_rows(lapply(names(df), function(nm) tibble(table = name, field = nm,
  r_type = paste(class(df[[nm]]), collapse = ";"), rows = nrow(df), missing = sum(is.na(df[[nm]])), distinct_nonmissing = n_distinct(df[[nm]], na.rm = TRUE))))
write_table(bind_rows(inventory(p, "selected_products"), inventory(x, "price_observations")), "formal_field_inventory.csv")
carbon_ref <- p %>% filter(carbon_primary) %>% group_by(category, agribalyse_version, agribalyse_food_code, agribalyse_proxy_food_code, agribalyse_name, co2_total) %>%
  summarise(n_products = n(), .groups = "drop")
write_table(carbon_ref, "formal_carbon_references.csv")
coverage <- read_output("formal_category_coverage.csv")
lines <- c("# 第三步数据获取与核查结果", "", paste0("日期：", run_date, "。状态：**正式获取完成，数据已冻结为 frozen_v1，可进入 Step 4 EDA。**"), "",
  "## 正式数据集", "",
  paste0("正式分层抽取 600 款食品，所有商品均完成计划字段请求并取得商品对象。", frozen$n_primary, " 款进入主要比较集，", frozen$n_joint,
    " 款同时具备有效代表单位价格、Nutri-Score 2023 和环境等级。正式商品对应 ", frozen$n_price_observations, " 条价格观察。"), "",
  "饼干、早餐谷物、黑巧克力和果汁各抽取 150 款。入选依据是类别、法国历史常规报价与可换算包装规格；抽样不要求营养或环境评分齐全。", "",
  md_table(read_output("formal_selection_flow.csv")), "",
  "## 类别与指标覆盖", "",
  md_table(coverage %>% select(category, target_unit, n_selected, n_primary, n_nutri_2023, n_environment, n_joint, n_sugars, n_fiber, n_carbon_3_2)), "",
  "表中的指标计数均以各类主要比较集为基础。营养等级统一使用 2023 算法；有明确冲调状态的等级不进入销售状态的等级比较。各数值视图按所需字段筛选，保留独立覆盖分母。", "",
  md_table(read_output("formal_nutrient_coverage.csv")), "",
  "所有 600 款均已请求能量、糖、脂肪、饱和脂肪、蛋白质、纤维、盐和环境明细。上述缺失是本轮源数据的字段缺失，未请求数量为 0。", "",
  "## 价格与规格核查", "",
  md_table(read_output("formal_price_structure.csv")), "",
  "质量商品采用 EUR/kg，果汁采用 EUR/L。代表价格为合并相同报价组合后的非折扣单位价格中位数；保留原始观察、保留重复的中位数、含折扣中位数及分年汇总。", "",
  md_table(read_output("formal_quality_decisions.csv") %>% select(code, category, quantity_text, quantity_source, exclusion_reason)), "",
  "两项规格问题已作出排除决定：条码 3017760805087 的包装文本为 110 g × 2，结构化净含量为 110 g；条码 20022464 的当前资料缺失有效净含量。两者保留在 600 款入选记录中，单位价格主分析使用其余 598 款。", "",
  "## 评分版本与环境参考", "",
  paste0("主比较集中 ", sum(p$carbon_primary), " 款具有带映射的 AGRIBALYSE 3.2 碳估算。其他版本保留原值与版本，主碳排放视图使用 `carbon_primary` 标志。"), "",
  md_table(coverage %>% select(category, nutri_grades, environment_grades, carbon_values_3_2)), "",
  "碳估算采用原模型的 kg CO₂e/kg 食品基准和食品状态。类别内部的不同估算值来自标准食品映射，`formal_carbon_references.csv` 汇总各参考项与关联商品数，供 EDA 按参考类别解释；体积价格不换算为每升碳排放。", "",
  "## 冻结与复现", "",
  paste0("冻结时刻（UTC）：", frozen$frozen_at_utc, "。文件与来源 SHA-256 已写入 `data/processed/frozen_v1/manifest.json`，关键约束、全部代表价格、条码连接和来源缓存校验通过。"), "",
  "- `analysis_products.rds`／`.csv`：598 款主要比较商品，作为第四步默认入口。",
  "- `selected_products.rds`／`.csv`：600 款完整入选记录，包含缺失与排除标志。",
  "- `price_observations.rds`、`prices_by_year.csv`：价格观察明细及分年汇总。",
  "- `selection.csv`、`source_requests.csv`、`category_coverage.csv`：抽样、请求与覆盖记录。",
  "- `data_dictionary.md`、`manifest.json`：冻结字典与文件校验记录。", "",
  "运行 `Rscript --vanilla R/run_step3.R` 可校验冻结数据并重建核查报告，已有快照时不发起网络请求。第四步读取冻结文件开展缺失模式、分布、异常值、价格口径敏感性和关联分析。", "",
  "## 来源与材料", "",
  "来源、许可、收集背景和方法解释见 [数据说明](data_description.md)，字段定义见 [数据字典](data_dictionary.md)。原始响应保存在 `data/raw/open_food_facts/formal_2026-11-02/`，完整获取、抽样与校验记录位于 `outputs/tables/step3/formal_*`。", "",
  "早期 500 条码试取记录见 [首轮核查](pilot_quality_review_2026-11-02.md)，保留为前期工作，正式 EDA 使用 frozen_v1。")
write_utf8(lines, "docs/03_data/data_quality_review.md")
report <- readLines("docs/03_data/data_quality_review.md", encoding = "UTF-8", warn = FALSE)
stopifnot(grepl("\u7b2c\u4e09\u6b65", report[1], fixed = TRUE), !any(grepl("[\x01-\x08\x0b\x0c\x0e-\x1f]", report)))
message("FORMAL REPORT WRITTEN: docs/03_data/data_quality_review.md")
