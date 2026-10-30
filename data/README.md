# 数据目录

## 已有文件

| 文件 | 用途与状态 |
| --- | --- |
| [`raw/open_prices/open_prices_2026-10-30.parquet`](raw/open_prices/open_prices_2026-10-30.parquet) | Open Prices 原始快照；337,631 条记录，约 34.6 MB；未清洗 |
| [`feasibility/food_product_sample_2026-10-30.json`](feasibility/food_product_sample_2026-10-30.json) | 200 条码的商品对象抽样，支持前期字段覆盖检查 |
| [`feasibility/food_numeric_sample_2026-10-30.json`](feasibility/food_numeric_sample_2026-10-30.json) | 30 条码的具体数值接口抽查，包含成功与失败记录 |
| `processed/` | 预留给 R 工作流生成的清洗数据，当前为空 |

快照来源：[Open Prices](https://huggingface.co/datasets/openfoodfacts/open-prices)。价格快照 SHA-256：`32aa1ca9de2663d4b455fdc70421ead1c7d7a1d01a4b2b76bfffabbabab91725`。下载记录日期为 2026-10-30。

## 使用规则

保留原始快照；新增快照采用不同日期文件名。抽样 JSON 是可行性记录，正式全量匹配及分析数据在 Step 3 建立。条码按字符读取，价格观察与商品表分开组织；保留来源、采集时间和匹配状态。

Step 3 将补充完整数据字典、字段和单位核验、许可与署名记录、API 获取或批量下载方案，以及可复现的 R 导入脚本。历史 Python 脚本保存在 `archive/analysis/`，不作为当前执行入口。

详细抽样方法和已知问题见[数据可行性汇总](../docs/03_data/feasibility_summary.md)。旧候选题数据继续保存在 `archive/data/`。
