# 项目概况

- 项目：R for Data Science 课程期末项目，选题为“食品价格、营养与环境影响：同类食品比较”。
- 研究方向：探索同类食品的单位价格与营养、环境表现之间的关系，使用 R 完成 EDA，并开发 Shiny 交互仪表板。
- 正式数据路线：法国、EUR、2024—2025 年 Open Prices 价格，通过条码连接当前 Open Food Facts 商品资料；四类各 150 款，共 600 款，主要比较集 598 款，冻结数据位于 `data/processed/frozen_v1/`，Step 3 已完成。
- 详细步骤、进度、交付物和里程碑统一维护在独立计划文件中；本文件保留项目概况、文件入口和工作约定。
- 当前状态：Step 4 初稿已运行，Step 5 设计草稿已形成。环境 F 等级已从同批原始对象恢复，修正版在 `data/processed/step4_v1_1/`，主要比较 598 款、三维联合 583 款；原 frozen_v1 保留。最终展示与提交为 2026-11-20。

# 文件入口

| 内容 | 地址 |
| --- | --- |
| 项目入口与目录结构 | [README.md](README.md) |
| 独立项目计划及 requirement 八个步骤 | [docs/project_plan.md](docs/project_plan.md) |
| 课程要求原件 | [course/R Final Project Requirements.pdf](course/R%20Final%20Project%20Requirements.pdf) |
| 正式选题说明 | [docs/01_topic/industry_selection.md](docs/01_topic/industry_selection.md) |
| 文献综述工作目录 | [docs/02_literature/](docs/02_literature/) |
| 第二步文献综述（中文） | [docs/02_literature/literature_review_zh.md](docs/02_literature/literature_review_zh.md) |
| 第二步文献综述（英文） | [docs/02_literature/literature_review_en.md](docs/02_literature/literature_review_en.md) |
| 数据可行性汇总 | [docs/03_data/feasibility_summary.md](docs/03_data/feasibility_summary.md) |
| 第三步数据说明与字典 | [数据说明](docs/03_data/data_description.md)；[数据字典](docs/03_data/data_dictionary.md) |
| 第三步实际核查结果 | [docs/03_data/data_quality_review.md](docs/03_data/data_quality_review.md) |
| 数据文件与使用说明 | [data/README.md](data/README.md) |
| 历史材料与归档索引 | [archive/README.md](archive/README.md) |

# 文档产出格式

- 默认只产出 Markdown（`.md`）文档。在用户明确要求导出 PDF 之前，不生成或更新 PDF，也不主动生成其他文档格式。

# 写作风格

- 禁止防御性写作。直接、自然地说明背景、行动、判断和结果，避免把项目叙述写成审计报告或免责声明。
- 不反复使用“不能据此”“不代表”“不等同于”“仅支持”“尚不能证明”等限定和自证表述。
- 已确认的事实直接陈述，不反复标注“本人已确认”或解释为什么可以这样写。
- 来源、证据、核对过程和待补充事项集中放在文末，不穿插在正文中打断叙述。
- 必要的限制与当前状态简短说明一次，不逐句补充免责说明。
