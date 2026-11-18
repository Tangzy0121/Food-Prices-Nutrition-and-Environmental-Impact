# 食品价格、营养与环境影响

R for Data Science 课程期末项目。研究同类食品中价格与营养、环境表现的关系，并用 R 完成探索性分析，开发 Shiny 交互仪表板。

当前阶段：**2026-11-18 已按消费者视角重做 HTML 仪表板，保留营养、环境、联合比较三页。** 使用现有 R 结果：正式入选 600 款，598 款进入主要比较集，三维联合可用 583 款。可直接打开 [独立 HTML](outputs/dashboard/2026-11-18-food-signal.html)；改版内容、解释口径与验证见 [本轮说明](docs/05_dashboard/2026-11-18-consumer-redesign.md)。原 Shiny 界面仍保留此前版本，R 数据处理与冻结输入不变。第三条结论待小组看联合图后确定，项目继续进行。

本轮改动与运行方式见 [HANDOFF.md](HANDOFF.md)。最新材料：[结果摘要](docs/04_eda/results_summary.md)、[notebook 源文件](notebooks/step4_eda.Rmd)、[环境等级修正](docs/04_eda/environment_grade_correction.md)、[Dashboard 设计与六方向说明](docs/05_dashboard/dashboard_spec.md)。项目根目录运行 `./scripts/run_step4.ps1` 可离线重建本轮结果，生成可独立打开的 `outputs/step4/step4_eda.html`；HTML 和 `outputs/step4/` 下的二进制结果由脚本生成。修正版商品表、源码、图表及结果 CSV 随版本保存。

## 从这里开始

- [正式选题说明（中文 Markdown）](docs/01_topic/industry_selection.md) · [英文版（Markdown）](docs/01_topic/industry_selection_en.md) · [中文一页 PDF](docs/01_topic/industry_selection.pdf)
- [按课程要求推进的项目计划](docs/project_plan.md)
- [文献综述（中文 Markdown）](docs/02_literature/literature_review_zh.md) · [英文版（Markdown）](docs/02_literature/literature_review_en.md)
- [数据可行性与现有材料](docs/03_data/feasibility_summary.md)
- [正式数据说明](docs/03_data/data_description.md) · [数据字典](docs/03_data/data_dictionary.md) · [本轮核查结果](docs/03_data/data_quality_review.md)
- [数据文件说明](data/README.md)
- [历史材料与归档索引](archive/README.md)
- [课程要求原件](course/R%20Final%20Project%20Requirements.pdf) · [课程介绍](course/Final%20project%20introduction.pdf)

## 文件夹结构

```text
R-final-project/
├── README.md                 项目入口、状态和运行说明
├── agent.md                  本项目写作约定
├── course/                   课程要求、介绍和 examples/ 示例
├── docs/
│   ├── project_plan.md       八个步骤、交付物和里程碑
│   ├── 01_topic/             正式选题说明及一页 PDF
│   ├── 02_literature/        中英文综述、文献矩阵与参考文献
│   ├── 03_data/              可行性记录、数据说明与字典
│   └── 05_dashboard/         框架、线框图与设计说明（后续）
├── data/
│   ├── raw/                  原始下载快照，保留原文件
│   ├── feasibility/          前期接口抽样，支持可行性记录
│   └── processed/            价格底表、正式商品数据与 frozen_v1 快照
├── R/                        Step 3 获取、导入与核查脚本
├── config/                   版本化食品类别规则
├── scripts/                  文档生成等辅助工具
├── notebooks/                R Markdown / Quarto EDA（后续）
├── shiny/                    Shiny 应用和用户指南（后续）
├── outputs/                  Step 3 核查表与后续 EDA 图表
├── reports/                  最终报告源文件与 PDF/HTML（后续）
├── slides/                   10–15 分钟展示材料（后续）
├── reflections/              每位组员的个人反思（后续）
└── archive/                  旧选题、试探代码和整理清单
```

`R/` 包含完整 Step 3 获取、整理、校验和冻结脚本；`data/processed/frozen_v1/` 是后续分析入口。EDA、Shiny 和最终报告将在后续步骤建立。

## 工作约定

以项目根目录为工作目录，代码使用相对路径。原始快照保存在 `data/raw/`，清洗结果由代码生成到 `data/processed/`；食品条码按字符读取。前期 Python 试探脚本保存在归档区，正式课程分析使用 R。

新文件采用用途明确的英文名，数据快照使用 `YYYY-MM-DD` 日期；新的选题调整记录在正式文档中，过期版本另行归档。图表和表格统一写入 `outputs/`，避免在根目录堆放临时结果。

## 运行与提交

Step 3 请在项目根目录运行。当前环境已用 R 4.6.0 执行；本轮依赖版本记录在 `outputs/tables/step3/sessionInfo.txt`。

```powershell
# 首次配置环境时安装依赖
Rscript --vanilla -e 'install.packages(c("DBI","duckdb","nanoparquet","dplyr","tidyr","readr","jsonlite","httr2","digest","stringr"), repos="https://cloud.r-project.org")'

# 校验正式冻结快照并重建核查报告；已有快照时不访问网络
Rscript --vanilla R/run_step3.R
```

默认入口读取冻结快照并校验数据及来源哈希。首次没有快照时，自动执行价格导入、四类目录完整枚举、分层抽样、600 款全字段获取、核查和冻结；原始请求响应可续用。正式商品通过只读批量搜索获取，搜索遗漏逐条确认。数据刷新使用新快照版本，保留 `frozen_v1`。

第四步从以下文件开始，不再安排常规数据获取：

```r
products <- readRDS("data/processed/frozen_v1/analysis_products.rds")
prices <- readRDS("data/processed/frozen_v1/price_observations.rds")
```

完整入选表为 `selected_products.rds`，其中保留 600 款商品及两项规格排除记录。`joint_grades_price` 标记三维等级比较样本，`carbon_primary` 标记 AGRIBALYSE 3.2 碳估算子样本；每个数值视图分别按所需字段筛选。早期试取记录见 [首轮报告](docs/03_data/pilot_quality_review_2026-11-02.md)。

以上为原 Step 3 获取流程说明。当前 Step 4 已计算价格—营养／环境关联结果；运行方式和修正数据入口见本页顶部与 HANDOFF.md。

修改选题说明的 Markdown 后，可在安装了 `reportlab` 的 Python 环境中运行 `python scripts/build_topic_pdf.py` 更新 PDF。该脚本优先嵌入 Windows 宋体；文档保持一页时需重新检查分页。

最终按课程要求提交单一压缩包或仓库链接，命名为 `GroupNumber_FoodRetail_FinalProject`，组号确定后替换 `GroupNumber`。交付内容包括最终报告、R Markdown/Quarto 源文件、R 脚本、Shiny 应用、数据或获取方式、展示材料、个人反思及本说明。课程原件、示例和历史归档属于工作资料，打包时按教师要求选择是否随附。

# English business report and Shiny application

The TypeScript [website](website/README.md) includes the study, a bilingual six-direction analysis Dashboard, the barcode-join examples and the interactive processing diagram. Run `cd website` then `npm ci` and `npm run dev`; open `#dashboard`. Build with `npm run build`. Vercel root directory: `website`; output: `dist`. `.github/workflows/deploy-pages.yml` builds the project-path site and deploys it to GitHub Pages from `main`. The Shiny course deliverable remains in `shiny/` because GitHub Pages hosts only the static React version.

The [English report](reports/README.md) translates the executed findings into consumer decisions, supplier retail-positioning benchmarks and a business validation plan. Build with `./scripts/build_report.ps1`; the current illustrated PDF is written to `output/food-value-report-v3.pdf` (9 pages, with continuous body layout).

The [Shiny guide](shiny/README.md) covers the six analysis directions and the bslib decision workflow: interpreted charts, hover/click/brush/zoom, quick presets, search/sort/pagination, two-product comparisons and CSV export. Run `./scripts/run_shiny.ps1` and open `http://127.0.0.1:3838`. To rebuild the included Step 4 data and results, run `./scripts/run_step4.ps1`. See [community references](docs/05_dashboard/community_references.md) and [verification](docs/delivery_verification.md) for design sources, checks and remaining course-submission work.
