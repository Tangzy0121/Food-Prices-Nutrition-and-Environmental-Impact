# 食品价格、营养与环境影响

R for Data Science 课程期末项目。研究同类食品中价格与营养、环境表现的关系，并用 R 完成探索性分析，开发 Shiny 交互仪表板。

当前阶段：**Step 2 中英文文献综述初稿已完成，包含八篇研究、综述矩阵和更新后的研究问题。** 下一步准备正式数据获取与核查；小组信息与教师审批状态待补充。

## 从这里开始

- [正式选题说明（中文 Markdown）](docs/01_topic/industry_selection.md) · [英文版（Markdown）](docs/01_topic/industry_selection_en.md) · [中文一页 PDF](docs/01_topic/industry_selection.pdf)
- [按课程要求推进的项目计划](docs/project_plan.md)
- [文献综述（中文 Markdown）](docs/02_literature/literature_review_zh.md) · [英文版（Markdown）](docs/02_literature/literature_review_en.md)
- [数据可行性与现有材料](docs/03_data/feasibility_summary.md)
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
│   └── processed/            由 R 脚本生成的分析数据（后续）
├── R/                        正式获取、清洗和汇总脚本（后续）
├── scripts/                  文档生成等辅助工具
├── notebooks/                R Markdown / Quarto EDA（后续）
├── shiny/                    Shiny 应用和用户指南（后续）
├── outputs/                  figures/ 图表、tables/ 结果表（后续）
├── reports/                  最终报告源文件与 PDF/HTML（后续）
├── slides/                   10–15 分钟展示材料（后续）
├── reflections/              每位组员的个人反思（后续）
└── archive/                  旧选题、试探代码和整理清单
```

标注“后续”的目录已预留，当前没有正式分析代码、分析结果或可运行的 Shiny 应用。

## 工作约定

以项目根目录为工作目录，代码使用相对路径。原始快照保存在 `data/raw/`，清洗结果由代码生成到 `data/processed/`；食品条码按字符读取。前期 Python 试探脚本保存在归档区，正式课程分析使用 R。

新文件采用用途明确的英文名，数据快照使用 `YYYY-MM-DD` 日期；新的选题调整记录在正式文档中，过期版本另行归档。图表和表格统一写入 `outputs/`，避免在根目录堆放临时结果。

## 运行与提交

正式运行入口将在 Step 3、4、6 建立时补充到这里。目前请从选题说明和项目计划阅读项目。

修改选题说明的 Markdown 后，可在安装了 `reportlab` 的 Python 环境中运行 `python scripts/build_topic_pdf.py` 更新 PDF。该脚本优先嵌入 Windows 宋体；文档保持一页时需重新检查分页。

最终按课程要求提交单一压缩包或仓库链接，命名为 `GroupNumber_FoodRetail_FinalProject`，组号确定后替换 `GroupNumber`。交付内容包括最终报告、R Markdown/Quarto 源文件、R 脚本、Shiny 应用、数据或获取方式、展示材料、个人反思及本说明。课程原件、示例和历史归档属于工作资料，打包时按教师要求选择是否随附。
