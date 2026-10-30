# 选题试探

## 当前候选更新

用户已排除单车，旧电商和酒店数据因年份较早移出主候选。
当前 `选题讨论.html` 为近期真实数据筛选；旧试探保留在 `选题讨论_第一轮存档.html`。

近期来源核查依次运行：

```powershell
python analysis/screen_recent_sources.py
python analysis/profile_recent_sources.py
python analysis/build_recent_screening.py
```

下载、来源及字段核查结果在 `../data/screening/`。CFPB 样本按创建时间升序，
不是随机样本。纽约表仅包含已结案记录；Inside Airbnb 仅使用挂牌与评论观测，
不采用估算入住率和营收。Ofcom 个体数据当前下载受限，未声称已读取。

以下是早期试探的复现说明；其报告更新脚本现仅更新存档，不覆盖当前文档。

目标是检验三个候选问题是否值得继续研究，非最终课程报告，也不包含因果推断。
图表、结果表和数据审计见项目根目录的 `选题讨论.html` 的第一轮数据试探部分。

## 复现

在项目根目录执行：

```powershell
python analysis/download_pilot.py
Rscript analysis/pilot.R
python analysis/update_pilot_report.py
```

Python 下载程序只使用标准库；R 使用 dplyr、tidyr、readr、ggplot2、data.table 和 jsonlite。
本次 R 版本和包版本记录在 `pilot-output/sessionInfo.txt`。

下载脚本会复用已有文件。文件来源、大小和 SHA-256 在
`../data/pilot/download_manifest.json` 中；若希望重新获取，先将原文件另存，再运行下载。
报告生成程序使用既定的讨论叙述，不会自动将所有叙述重新概括；更换数据或分析定义后，
应核对报告内的数字、判断和来源。CSV 与 JSON 始终由 R 重新计算。

## 来源

- Olist 原发布页：https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
- 实际镜像：https://github.com/anggid/Brazilian-E-Commerce-Public-Dataset-by-Olist
- 酒店原始论文：https://doi.org/10.1016/j.dib.2018.11.126
- 实际镜像及整理说明：https://github.com/rfordatascience/tidytuesday/tree/main/data/2020/2020-02-11
- Citi Bike 官方说明：https://citibikenyc.com/system-data
- 实际输入：官方 S3 的 JC-202409-citibike-tripdata.csv.zip 与 JC-202410-citibike-tripdata.csv.zip。

原始 Kaggle API 返回 404，所以 Olist 使用公开镜像；未进行原发布文件的逐字节核验。
酒店镜像的总行数和两个酒店分组数与论文样本规模一致。
输入数据使用时须继续保留提供方归属并遵循原许可；Olist 为 CC BY-NC-SA 4.0，
Citi Bike 按 NYCBS Data Use Policy，酒店论文与附带数据的使用参照原发布说明。

## 关键分析口径

### 电商

- 订单、客户 ID 的唯一性显式检查。
- 每笔订单选回答时间最早的评价；最后评价的结果另作敏感性比较。
- 已送达、实际与预计耗时非负、且有评分的订单进入评价时点比较。
- 逾期按实际送达日是否晚于预计送达日定义；低评分为 1 或 2 分。
- `review_answer_timestamp` 与实际送达时间比较；送达前评价不自动视为错误。
- `olist-duration.svg` 和 `olist-states.svg` 是送达后评价子样本的附加图，存在选择性。
  主结果使用 `olist_review_timing.csv`；全体有效已送达订单的服务指标另存，
  不能将送达后评价子样本的准时率当成平台整体准时率。

### 酒店

- 主体为计划 2016 年入住的完整年度预订；最终 Canceled、No-Show、Check-Out 分开。
- 临近入住取消的主窗口为距计划入住日 0 至 7 天；3 天与 14 天另作比较。
- 同时报告每笔预订的临近取消比例和已取消订单中的临近取消占比。
- 无唯一预订 ID，不能证明完全相同行一定是错误重复；主结果保留，去重仅作敏感性分析。
- 按提前预订区间、月份和酒店拆分，用于识别总体关系的边界。

### 单车

- 2024 年 9、10 月 JC 官方档案，统计 JC/HB 站点事件，涵盖 Jersey City 与 Hoboken。
- 行程持续 60 秒至 24 小时且起终点站点 ID 非空；源数据检查 ride_id 重复。
- 起点按出发时点、终点按到达时点独立计入站点小时，避免按出发小时错误归入到达。
- 当地钟表字符串按 UTC 解析仅保持民用小时与时间差运算；没有真实时区转换。
- 仅日历周一至周五。剔除每月首日，避免未下载前一个月而缺少跨月到达事件。
- 站点日最低活动量为 40 次；平衡阈值为绝对净流量 / 活动量 ≤ 10%。
- 强小时失衡要求至少 20 次活动、绝对净流量 ≥ 10 且比例 ≥ 50%。
- 平衡阈值 5%、15% 与小时绝对净流量 8、15 另作敏感性分析。
- 全日平衡不代表库存平衡；没有同期库存，不能声称实际缺车、满桩或估计未满足需求。

## 校验

用独立 Python/pandas 路径重算并核对了：

1. 电商按逾期分组的评价数量、送达后保留数量与低评分比例。
2. 酒店按酒店及渠道分组的预订、取消及临近入住取消计数。
3. 单车从原始 ZIP 重建事件，核对两个月的全天平衡及掩盖小时失衡的站点日数量。

以上关键计算与 R 输出一致。探索未做多重比较后的推断检验；报告不声称统计显著或因果效果。
