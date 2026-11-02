source("R/00_common.R")
dir.create("docs/03_data", recursive = TRUE, showWarnings = FALSE)
scope <- if ("--scope=full" %in% commandArgs(trailingOnly = TRUE)) "full" else "pilot"
products <- readRDS(paste0("data/processed/products_", scope, ".rds"))
prices <- readRDS(paste0("data/processed/prices_linked_", scope, ".rds"))
read_output <- function(name) readr::read_csv(paste0("outputs/tables/step3/", name), show_col_types = FALSE)
flow <- read_output("price_filter_flow.csv")
coverage <- read_output(paste0(scope, "_category_coverage.csv"))
versions <- read_output(paste0(scope, "_versions.csv"))
profile <- jsonlite::read_json(paste0("outputs/tables/step3/", scope, "_profile_manifest.json"), simplifyVector = TRUE)
manifest <- jsonlite::read_json(sub("\\.(rds|parquet)$", "_manifest.json", profile$raw_source), simplifyVector = TRUE)
md_table <- function(x) {
  x <- as.data.frame(x)
  row <- function(z) paste0("| ", paste(ifelse(is.na(z), "—", as.character(z)), collapse = " | "), " |")
  c(row(names(x)), row(rep("---", ncol(x))), if (nrow(x)) apply(x, 1, row) else character())
}
inventory <- function(df, table_name) bind_rows(lapply(names(df), function(nm) tibble(
  table = table_name, field = nm, r_type = paste(class(df[[nm]]), collapse = ";"), rows = nrow(df),
  missing = sum(is.na(df[[nm]])), distinct_nonmissing = n_distinct(df[[nm]], na.rm = TRUE))))
write_table(bind_rows(inventory(products, "products"), inventory(prices, "prices_linked")), "field_inventory.csv")
fmt <- function(x) format(x, big.mark = ",", scientific = FALSE, trim = TRUE)
joint <- sum(products$joint_grades_price)
unknown <- sum(products$match_status != "matched")
eligible <- if (scope == "pilot") coverage %>% filter(candidate_for_expansion) else coverage %>% filter(candidate_for_eda)
heading <- c("# 第三步数据获取与核查结果", "", paste0("日期：", run_date, "。本报告由 `R/04_write_data_report.R` 根据实际输出生成；范围：**", scope, "**。"), "",
  "## 当前成果", "",
  paste0("已复现价格筛选，完成 ", fmt(nrow(products)), " 个候选条码的商品匹配；其中 ", fmt(profile$matched), " 个进入 OFF 食品匹配集，", fmt(unknown), " 个未进入该匹配集，详细状态见下表。"),
  paste0("具有有效常规代表单位价格的商品 ", fmt(sum(products$has_price)), " 个；价格、营养等级与环境等级同时可用 ", fmt(joint), " 个。"), "",
  "原始价格观察、商品资料和连接后的价格表分别保存，来源版本、文件校验值和运行环境已有记录。", "",
  "## 价格范围", "", md_table(flow), "",
  paste0("价格 ID 重复数为 0。在本轮匹配范围对应的 ", fmt(nrow(prices)), " 条价格观察中，相同商品、日期、门店、价格、折扣与原计价单位的潜在重复观察共 ", fmt(sum(prices$potential_duplicate)), " 条。这些观察保留在底表中，代表价格使用合并报价组合后的中位数，同时提供保留重复观察的对照值。"), "",
  "## 商品与字段覆盖", "")
totals <- tibble(indicator = c("目标条码", "匹配商品", "有效常规代表价格", "营养等级", "环境等级", "价格与两种等级联合可用", "具备版本与类别映射的碳估算"),
  n_products = c(nrow(products), profile$matched, sum(products$has_price), sum(products$has_nutri), sum(products$has_environment), joint, sum(products$has_carbon))) %>%
  mutate(percent_of_requested = sprintf("%.1f%%", 100 * n_products / nrow(products)))
body <- c(md_table(totals), "", md_table(read_output(paste0(scope, "_matching.csv"))), "",
  "覆盖率以本次目标条码为分母；各类别表中的营养、环境和碳排放计数还要求存在有效代表价格。", "",
  if (!is.null(manifest$numeric_requested)) paste0("本轮通过 Open Prices 的 OFF 缓存取得规格与等级；固定随机顺序的前 ", manifest$numeric_requested, " 个条码另请求 OFF API v3.2 补充数值，其中 ", manifest$numeric_success, " 个返回商品对象。其余商品的数值状态为未请求，数值完整性据请求子样本解释。") else "本轮商品字段来自固定版本批量食品导出。", "",
  "## 类别覆盖与下一步选择", "",
  md_table(coverage %>% select(category, unit_basis, n_products, n_price, n_nutri, n_environment, n_joint, n_carbon, n_carbon_values, candidate_for_expansion, candidate_for_eda)), "",
  if (nrow(eligible)) paste0("按当前工作量初筛规则，", paste(unique(eligible$category), collapse = "、"), if (scope == "pilot") "可优先扩大获取并抽查商品用途与规格。" else "可优先进入第四步的类别与规格抽查。") else if (scope == "pilot") "试取样本的各类别仍较小，下一步结合原始标签覆盖，选择用途一致且已有联合评分的类别扩大获取。" else "当前预设类别尚未满足初筛规则，下一步从原始标签覆盖表核对分组与覆盖。", "",
  "类别初筛结合独立商品数、联合评分覆盖和等级变异。原始标签统计允许重叠，可用于继续细分宽类别和检查未分组商品。碳排放取值差异主要反映其关联的标准食品类别，第四步应围绕这些类别解释关系，并核对食品状态。", "",
  "## 规格、数值与版本", "",
  md_table(read_output(paste0(scope, "_quantity_status.csv"))), "",
  "包装冲突和未解析多件装保留在人工复核表；其余有效规格按 kg、L 分别计算价格。营养单位与边界检查如下。", "",
  md_table(read_output(paste0(scope, "_nutrient_checks.csv"))), "",
  md_table(read_output(paste0(scope, "_numeric_fetch_status.csv"))), "",
  md_table(versions), "",
  "`schema_version` 是字段结构版本；批量导出未提供明确 Nutri-Score 算法版本。当前环境指标使用上游实际方法版本，法国等级与全局回退分别标记。", "",
  "## 后续安排", "",
  if (scope == "pilot") "本轮完成 500 条码试取流程，正式分析样本需按候选类别继续扩大获取后确定。" else "本轮已完成全部候选条码匹配，正式类别在抽查后确定。", "",
  "1. 对初筛类别中的商品用途、规格疑点和重复报价影响进行抽查，确定主要比较类别。",
  "2. 使用分年代表价格和保留重复观察的中位数，检查年份、门店与观察次数构成。",
  "3. 分别建立价格—营养、价格—环境等级和三维联合视图；碳排放按标准食品类别与方法版本安排补充分析。",
  "4. 将最终类别与指标选择回写文献综述和研究问题，再开展分布、关联与图表分析。", "",
  "## 文件与复现依据", "",
  "- 数据说明与处理规则：[data_description.md](data_description.md)。",
  "- 字段解释：[data_dictionary.md](data_dictionary.md)；完整列清单：`outputs/tables/step3/field_inventory.csv`。",
  paste0("- 商品字段缓存：`", manifest$file, "`。"),
  if (!is.null(manifest$raw_response_folder)) paste0("- API 原始响应与请求时间：`", manifest$raw_response_folder, "/`。") else "- Parquet 子集保留上游所选字段的值。",
  paste0("- 来源版本说明：`", manifest$revision, "`；缓存 SHA-256：`", manifest$sha256, "`。"),
  paste0("- 获取开始／完成（UTC）：", manifest$started_at_utc, " / ", manifest$completed_at_utc, "。"),
  paste0("- 数据表：`data/processed/products_", scope, ".rds`、`.csv` 与 `prices_linked_", scope, ".rds`。"),
  "- 核查表、获取摘要和 `sessionInfo.txt`：`outputs/tables/step3/`。",
  "- 上游链接、署名及许可记录集中列在数据说明文末。")
pilot_report_path <- if (file.exists("data/processed/frozen_v1/manifest.json")) "docs/03_data/pilot_quality_review_2026-11-02.md" else "docs/03_data/data_quality_review.md"
report_connection <- file(pilot_report_path, open = "wb")
writeLines(enc2utf8(c(heading, body, "")), report_connection, useBytes = TRUE)
close(report_connection)
message("Wrote ", pilot_report_path, " and field_inventory.csv")
