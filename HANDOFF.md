# Step 4 给小组的整合说明

日期：2026-11-05。最终展示与提交：2026-11-20。

后续交付已在本地 `feat/report-shiny-delivery` 实现：英文 Tau-class 商业分析报告（`output/food-value-report.pdf`）及英文 Shiny（`shiny/`）。启动方式、测试记录和课程总提交剩余事项见 `docs/delivery_verification.md`。本文件以下保留原 EDA 交接背景。

## 先看什么

1. `docs/04_eda/results_summary.md`：研究问题的结果与解释。
2. `outputs/step4/step4_eda.html`：可直接打开的完整已执行 notebook。
3. `docs/04_eda/environment_grade_correction.md`：需要小组首先核对的 F 级修正。
4. `docs/05_dashboard/dashboard_spec.md`：接下来 Shiny 的页面和交互草稿。
5. `docs/project_plan.md`：已确认的最终日期与建议内部进度。

## 本轮内容

R 实际执行了 598 款商品的类别内分析，输出 8 图和 19 表。原环境清洗遗漏 16 个 F 级，已从同次获取的原始商品对象恢复，联合比较样本由 568 修正到 583。冻结输入原样保留，修正版运行时写入 `data/processed/step4_v1_1/`。

## 分支与复现

本轮工作位于 `feat/step4-eda` 分支，基于上游 `main` 的 eb4c9c27，保留原始提交历史。改动按环境等级修正、可复现 EDA、结果与设计文档分成提交，通过该分支到 `main` 的 Pull Request 接受小组评审。

图表、结果 CSV、计算源码和 notebook 作为贡献随版本保存。执行生成的独立 HTML、中间 Markdown、二进制派生表和本机运行日志由命令重建。新增课堂附件、本机技能配置及临时下载文件保留在本地。

上游提交 eb4c9c27 已有离线运行所需的四份冻结输入与原始 `products_formal.rds`。在包含这些输入的工作副本根目录运行：

```powershell
./scripts/run_step4.ps1
```

PowerShell 脚本默认本机 conda R 路径，可用 `-RPrefix` 指定另一环境。也可以在 RStudio 从项目根目录设置 knitr root 后执行 notebook，再用 Pandoc 渲染。R 依赖为 dplyr、tidyr、readr、ggplot2、jsonlite、digest、knitr。

## 接下来谁做什么

姓名由组内填写，按工作包认领：数据同学核对 16 个 F 等级与价格口径；分析同学逐图解释、挑选可解释案例；文献同学补读全文并把发现与三项问题对应；实现同学按设计草稿做类别筛选和两商品对比。成员共同理解课程代码，并在最终报告登记贡献与外部协助。

建议 11 月 6—7 日完成结果复核，8 日确定原型范围，9—10 日做出可运行 Shiny，11—13 日接受课堂反馈，14—19 日修改、写报告和排练。11 月 20 日展示并提交。

## 验证范围

本轮检查冻结输入与原始商品对象哈希、主键、连接、全部代表价格、恢复等级及商品对比规则；notebook 已执行，环境记录随附。未重新获取全量上游原始价格，Shiny 当前为设计草稿。
