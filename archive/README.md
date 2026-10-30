# 历史材料与归档索引

整理日期：2026-10-30。项目已转入“食品价格、营养与环境影响”正式工作；当前入口为[项目 README](../README.md)。归档保留原内容，供追溯选题过程和前期方法使用。

## 归档内容

| 位置 | 内容 |
| --- | --- |
| [`2026-10-30_topic-exploration/notes/`](2026-10-30_topic-exploration/notes/) | 根目录原有的食品选题稿、可行性检查、具体数值抽查三份记录 |
| [`选题讨论.html`](选题讨论.html) | 近期候选数据讨论 |
| [`选题讨论_第一轮存档.html`](选题讨论_第一轮存档.html) | 第一轮电商、酒店、单车选题试探 |
| `analysis/` | 早期下载、筛查、报告生成脚本和 `pilot-output/` 结果；含两份食品试探脚本 |
| `data/pilot/` | 早期电商、酒店、单车原始数据及下载记录 |
| `data/screening/` | 其他候选题的数据筛查材料 |
| [`2026-10-30_reorganization_manifest.json`](2026-10-30_reorganization_manifest.json) | 本轮整理前全部 86 个文件的原路径、新路径、字节数和 SHA-256 |

归档文档中的“当前候选”、未定状态和相对路径反映当时的工作环境。正式项目状态以根目录 README 和 `docs/` 为准。归档脚本与历史文档未重写，直接在当前根目录运行会使用过期路径；查看记录时以本索引和路径清单定位。

## 移回当前工作区的食品材料

| 原位置 | 当前位置 |
| --- | --- |
| `archive/data/screening/open_prices_2026-10-30.parquet` | [`data/raw/open_prices/open_prices_2026-10-30.parquet`](../data/raw/open_prices/open_prices_2026-10-30.parquet) |
| `archive/data/screening/food_product_sample_2026-10-30.json` | [`data/feasibility/food_product_sample_2026-10-30.json`](../data/feasibility/food_product_sample_2026-10-30.json) |
| `archive/data/screening/food_numeric_sample_2026-10-30.json` | [`data/feasibility/food_numeric_sample_2026-10-30.json`](../data/feasibility/food_numeric_sample_2026-10-30.json) |

课程要求和介绍移至 `course/`，原 `reference/` 示例整体移至 `course/examples/`。原根目录三份食品笔记已归入上述日期目录，其内容汇总为[正式选题说明](../docs/01_topic/industry_selection.md)和[可行性汇总](../docs/03_data/feasibility_summary.md)。

## 文件保全

本轮只移动和新增文件，未删除原有材料。清单覆盖整理前的 86 个文件，逐一核验新路径的 SHA-256 与原文件一致。后续新增或修订的正式文档不在这份历史清单中。
