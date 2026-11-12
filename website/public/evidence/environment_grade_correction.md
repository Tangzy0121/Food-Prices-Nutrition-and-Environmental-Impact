# 环境等级 F 的恢复

2026-11-05。在 Step 4 检查环境分数与等级覆盖时，发现 frozen_v1 中部分商品有环境分数和 known 状态，环境等级却为空。

## 原因与原始证据

上游提交 eb4c9c27 的 `R/07_prepare_formal_data.R` 只接受营养等级 A—E，并给环境等级额外放行 A+。环境等级实际范围为 A+、A、B、C、D、E、F，因此 F 被转成 NA。

从该提交保存的 `data/raw/open_food_facts/formal_2026-11-02/products_formal.rds` 读取 600 个原始商品对象，核对各对象中的 `ecoscore_data$grades$fr` 或对应新字段。16 款主样本商品原始法国等级为 f：饼干 2 款、黑巧克力 13 款、果汁 1 款。原始对象的 Git blob 哈希与下载记录一致，SHA-256 与 frozen_v1 的来源 manifest 一致。此次恢复没有重新请求商品 API。

## 修正与覆盖变化

`R/09b_restore_environment_grades.R` 从同批原始对象重新映射法国等级及法国分数，输出 `data/processed/step4_v1_1/`，原 frozen_v1 原样保留。其他所有字段逐列相同；600 款入选、598 款主样本和价格中位数均不改变。

| 指标 | frozen_v1 | Step 4 修正版 |
|---|---:|---:|
| 主样本商品 | 598 | 598 |
| 主样本环境等级可用 | 580 | 596 |
| 三维联合可用 | 568 | 583 |

果汁新增的 F 级商品没有有效主营养等级，因此联合样本增加 15 款。条码 3596710507580 的原流程采用全局分数 13，本轮与法国 F 级配对使用法国分数 14。逐商品差异见 `outputs/step4/tables/environment_grade_corrections.csv`。

`R/07_prepare_formal_data.R` 已补上对 F 的接受规则，供未来新版本完整获取流程使用。后续刷新须另建快照；当前 EDA 通过独立恢复脚本复现修正，不覆盖旧冻结版。

## 验证条件

- 原始对象覆盖全部 600 条码，记录内条码与键一致。
- 恢复恰好 16 个 F 级，全部属于主样本。
- 等级、对应分数、地域来源及两个覆盖标志之外的全部字段保持一致。
- 两项等级有序比较包含完整的 F 类别；未知与 not-applicable 仍保留为缺失。

## 来源

[Open Food Facts 官方 Attributes 方法说明](https://openfoodfacts.github.io/openfoodfacts-server/dev/ref-perl-pod/ProductOpener/Attributes.html) 明确区分营养等级 A—E 与环境等级 A+—F。查阅日期：2026-11-05。
