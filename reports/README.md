# 中英文课程研究报告

2026-11-11 修订。中文源文件为 `report_zh.tex`，英文为 `report.tex`。两版按 Introduction、Data and Methods、Results、Discussion、Shiny Dashboard、Conclusion 展开，附复现、来源和 AI 协助说明。

结果回答三个研究问题，解释类别差异、黑巧克力的成分取舍与低价候选。每张图说明研究问题、坐标、商品点和主要发现。黑巧克力以糖和饱和脂肪两幅图并排展示。

在项目入口运行：

```powershell
# 本机使用 WSL 的 R 绘图，Windows XeLaTeX 编译
./scripts/build_report.ps1 -UseWSL

# Windows R 环境继续通过 -RPrefix 指定
./scripts/build_report.ps1 -RPrefix 'C:/path/to/r-environment'
```

首次使用时先按项目说明恢复 `data/processed/step4_v1_1/analysis_products.rds`。R 依赖为 ggplot2、dplyr、tidyr。构建还需要 Python 3 和 XeLaTeX。`-Language en` 或 `zh` 可选择单版。

报告写入 `output/food-value-report-en.pdf` 与 `output/food-value-report-zh.pdf`。四份数值表由 `scripts/build_report_tables.py` 从 EDA CSV 生成，六张双语图由 `scripts/build_report_figures.R` 从修正数据绘制，保存在 `reports/generated/figures/`。构建中间物位于 `.scratch/report-build/`。

写作检测与前后对照见 [2026-11-11-writing-review.md](2026-11-11-writing-review.md)。本轮按用户确认的结构重排内容，保留文献来源与 AI 协助披露。署名贡献、个人反思和课堂反馈由小组补充。

模板为 Guillermo Jimenez 的 Tau-class 2.6.0，许可 CC BY 4.0。数学排版改用 unicode-math 与 TeX Gyre Termes Math，以正确显示相关系数的负号。
