"""Insert the empirical pilot into the existing discussion document, idempotently."""
from pathlib import Path
import base64
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "选题讨论_第一轮存档.html"
OUT = ROOT / "analysis/pilot-output"
results = json.loads((OUT / "results.json").read_text(encoding="utf-8"))
hotel = results["hotel"]["channels"]
bike = results["bike"]["summary"]
pct = lambda x: f"{x * 100:.1f}%"
num = lambda x: f"{x:,}"

hotel_rows = ""
for row in hotel:
    if row["distribution_channel"] not in ("Corporate", "TA/TO"):
        continue
    name = "城市酒店" if row["hotel"] == "City Hotel" else "度假酒店"
    hotel_rows += f'''<tr><td>{name}</td><td>{row['distribution_channel']}</td>
      <td>{num(row['bookings'])}</td><td>{pct(row['cancellation_rate'])}</td>
      <td>{num(row['late_cancel_n'])} / {num(row['bookings'])}<br><strong>{pct(row['late_cancel_per_booking'])}</strong></td>
      <td>{pct(row['late_share_of_canceled'])}</td></tr>'''
bike_rows = "".join(f'''<tr><td>{r['month']}</td><td>{num(r['balanced_station_days'])}</td>
    <td>{r['masked_station_days']}</td><td>{pct(r['masked_share_of_balanced'])}</td>
    <td>{r['stations_with_masked_day']}</td></tr>''' for r in bike)

fragment = f'''
<!-- PILOT-RESULTS-START -->
<section id="pilot" aria-labelledby="pilot-title">
  <h2 id="pilot-title"><span class="section-num">实测</span>第一轮数据试探</h2>
  <p class="pilot-conclusion"><strong>优先讨论酒店的取消时间切口；如果更看重独特性，电商的评价时点值得单独成题。</strong>共享单车也观察到重复模式，但目前更接近对已知日内流动的具体刻画。</p>
  <p>这次实际读取了三组公开数据，用 R 完成比较，并用独立的 Python 计算核对关键计数。目标是判断题目是否值得继续做，不做因果推断，也不把初步发现当作最终结论。</p>
  <div class="table-wrap" tabindex="0" role="region" aria-label="实际使用的数据范围">
    <table><thead><tr><th scope="col">方向</th><th scope="col">实际数据范围</th><th scope="col">试探判断</th></tr></thead><tbody>
      <tr><td>电商</td><td>99,441 笔订单；95,824 笔已送达、时间有效且有评价的订单进入评价时点比较。</td><td>出现意外切口：评价时点会大幅改变被观察到的逾期低评分情况。</td></tr>
      <tr><td>酒店</td><td>119,390 笔预订；主体使用计划于 2016 年入住的 56,707 笔记录。</td><td>取消比例与临近入住取消比例，对渠道的判断存在反转。</td></tr>
      <tr><td>共享单车</td><td>JC 官方档案，2024 年 9、10 月共 233,865 条行程；范围含 Jersey City 与 Hoboken。</td><td>日汇总掩盖小时差异的现象存在，但集中在部分站点。</td></tr>
    </tbody></table>
  </div>
  <p class="note">电商与酒店通过公开镜像获取，已记录具体来源和 SHA-256；单车来自官方 S3。这里的“独特性”仅是选题判断，尚未完成文献检索，不能据此声称研究原创。</p>

  <article class="pilot-article" id="pilot-hotel">
    <h3>酒店　取消率较低的渠道，也可能有更多临近入住取消</h3>
    <p><strong>更聚焦的题目：</strong>酒店渠道的取消率是否掩盖了取消发生时间的差异</p>
    <p>在 2016 年的城市酒店记录中，Corporate 渠道的明确取消率为 <strong>19.2%</strong>，低于 TA/TO 的 <strong>42.3%</strong>。但把指标改成“入住前 0 至 7 天取消的订单占该渠道全部预订的比例”，Corporate 为 <strong>11.8%</strong>，TA/TO 为 <strong>5.1%</strong>。这并非只是在已取消订单里更换分母造成的表象。</p>
    <div class="table-wrap" tabindex="0" role="region" aria-label="酒店渠道取消比例与时间比较">
      <table class="pilot-wide"><thead><tr><th scope="col">酒店</th><th scope="col">分销渠道</th><th scope="col">预订数</th><th scope="col">取消 / 全部预订</th><th scope="col">0 至 7 天取消 / 全部预订</th><th scope="col">0 至 7 天取消 / 已取消</th></tr></thead>
      <tbody>{hotel_rows}</tbody></table>
    </div>
    <p class="note">取消仅指最终状态 Canceled；No-Show 单列。TA/TO 表示旅行代理及旅游运营商。“临近入住”按计划入住日期减取消日期计算，含当天至提前 7 天。</p>
    <figure><img src="analysis/pilot-output/hotel-channels.svg" alt="两家酒店中，Corporate 渠道的总体取消比例较低，但其取消订单中临近入住取消的占比高于 TA/TO"><figcaption>两种指标的分母不同，需结合上表中的每笔预订取消比例与数量一起理解。</figcaption></figure>
    <p><strong>为什么值得做：</strong>总体取消率不能完整表达时间上的不确定性。这个发现可以让酒店运营人员重新理解渠道指标，同时观察发生频率、取消时间和订单规模。TA/TO 的临近取消绝对数量仍更大，不能直接把 Corporate 说成“更应优先处理”。</p>
    <h4>进一步核查了什么</h4>
    <ul>
      <li>度假酒店也呈现相同方向；把时间窗口改为 3 天或 14 天，Corporate 与 TA/TO 的这一反转仍在两家酒店中出现。</li>
      <li>按 2016 年的月份拆开，每家酒店都有 9 个月同时出现“Corporate 总取消率较低、但 0 至 7 天取消占全部预订比例较高”。</li>
      <li>提前预订时间明显不同：城市酒店 Corporate 的中位数为 10 天，TA/TO 为 82 天。按提前预订区间分组后，差异并非每组都存在，不能解释为渠道本身的独立作用。</li>
      <li>全数据有 31,994 条与前面记录完全相同的行，且没有预订唯一标识可判定是否错误重复。保留为主体；另做完全相同行去重的敏感性比较后，城市酒店每笔预订的临近取消比例变为 6.8% 与 5.8%，方向保留、差距明显缩小。</li>
    </ul>
    <p><strong>判断：</strong>问题具体、字段充足，可以优先讨论。正式研究应把提前预订结构和相同行处理作为核心解释边界，不能推断实际损失，也不能将取消时间直接换算成可转售时间。</p>
    <p class="data-links">核对数据：<a href="analysis/pilot-output/hotel_channels_2016.csv">渠道比较 CSV</a> · <a href="analysis/pilot-output/hotel_lead_bins.csv">提前预订分层</a> · <a href="analysis/pilot-output/hotel_dedup_sensitivity.csv">相同行敏感性比较</a></p>
  </article>

  <article class="pilot-article" id="pilot-ecommerce">
    <h3>电商　评价时点本身，可能比原来的配送题目更值得研究</h3>
    <p><strong>更特别的候选题目：</strong>消费者在送达前评价时，电商评价指标反映了什么</p>
    <p>在 6,381 笔已送达、逾期且有评价的有效订单中，有 <strong>4,476 笔，约 70.1%</strong> 的首条评价回答时间早于记录的实际送达时间。相比之下，准时订单中这一比例仅约 <strong>0.3%</strong>。</p>
    <div class="table-wrap" tabindex="0" role="region" aria-label="电商逾期订单的评价时点比较">
      <table><thead><tr><th scope="col">逾期订单的评价范围</th><th scope="col">订单数</th><th scope="col">低评分数</th><th scope="col">低评分比例</th></tr></thead><tbody>
        <tr><td>全部有效首条评价</td><td>6,381</td><td>3,979</td><td>62.4%</td></tr>
        <tr><td>回答在记录的送达时间之前</td><td>4,476</td><td>3,609</td><td>80.6%</td></tr>
        <tr><td>回答在记录的送达时间当时或之后</td><td>1,905</td><td>370</td><td>19.4%</td></tr>
      </tbody></table>
    </div>
    <p class="note">低评分定义为 1 或 2 分。每单使用回答时间最早的一条评价，避免多条评价导致订单重复计数。使用的是 review_answer_timestamp，并非问卷创建日期。</p>
    <figure><img src="analysis/pilot-output/olist-review-timing.svg" alt="逾期订单在记录的送达之前提交的评价，低评分比例为80.6%，送达当时或之后为19.4%；准时订单的送达前评价样本很少"><figcaption>这是不同订单群体的比较，没有同一位消费者送达前后修改评分的配对数据。</figcaption></figure>
    <p><strong>为什么值得做：</strong>“只保留送达后评价”看似合理，却会选择性地移除大量逾期低评分订单。因此，先要明确评价指标想描述的是完整履约后的体验，还是包含等待阶段的购物体验。这比简单重复“配送越慢，评分越低”更有辨识度。</p>
    <h4>进一步核查了什么</h4>
    <ul>
      <li>这批送达前回答的逾期订单，回答距记录的送达时间中位数约 5.8 天；其中 3,945 笔至少相隔 24 小时，不只是同一天时间戳精度造成的差别。</li>
      <li>改用每单最后一条评价后，送达后评价子样本中各耗时组的低评分比例变化很小。主要问题是评价时点筛选，而非少数多次评价订单。</li>
      <li>原题“准时率是否等于体验好”也有描述性信号：在不依赖评价筛选的已送达订单中，承诺 35 天及以上组准时率约 96.4%、实际耗时中位数 15.2 天；承诺不足 14 天组约为 93.2% 和 4.5 天。地区与订单构成尚未调整。</li>
    </ul>
    <p><strong>判断：</strong>如果追求更 niche 的切口，可把“评价时点与评价指标解释”升为主问题。送达前的评价不能自动当成脏数据删除；但时间戳也未必精确等同于消费者真正收到包裹的时点，需结合数据生成说明讨论。</p>
    <p class="data-links">核对数据：<a href="analysis/pilot-output/olist_review_timing.csv">评价时点 CSV</a> · <a href="analysis/pilot-output/olist_review_selection.csv">筛选前后比较</a> · <a href="analysis/pilot-output/olist_delivery_promise_all_delivered.csv">全体有效已送达订单的承诺比较</a></p>
  </article>

  <article class="pilot-article" id="pilot-bike">
    <h3>共享单车　现象存在，但集中在少数站点</h3>
    <p><strong>可保留的题目：</strong>共享单车的日汇总指标在多大程度上掩盖了站点的日内流动失衡</p>
    <p>在预先设定的活动量和平衡门槛下，9 月有 <strong>99 / 1,297，约 7.6%</strong> 的“全天近似平衡站点日”仍出现明显小时失衡；10 月为 <strong>96 / 1,327，约 7.2%</strong>。现象重复出现，但不是所有平衡站点普遍存在的问题。</p>
    <div class="table-wrap" tabindex="0" role="region" aria-label="共享单车站点日比较">
      <table><thead><tr><th scope="col">月份</th><th scope="col">全天平衡站点日</th><th scope="col">其中存在明显小时失衡</th><th scope="col">占比</th><th scope="col">涉及站点数</th></tr></thead>
      <tbody>{bike_rows}</tbody></table>
    </div>
    <p class="note">站点日指一个站点在某一天的记录。仅分析日历周一至周五，月首日排除以避免上月跨夜到达缺失；每日借还总量至少 40 次。全天平衡定义为 |流入 − 流出| / 借还总量 ≤ 10%；明显小时失衡要求该小时总量 ≥ 20 次、净流量绝对值 ≥ 10 次且失衡比例 ≥ 50%。这些是探索阈值，不是行业标准。</p>
    <figure><img src="analysis/pilot-output/bike-example.svg" alt="Grove St PATH站点在9月和10月都呈现早晨净流入、傍晚净流出的重复日内模式"><figcaption>Grove St PATH 是按两个月反复出现的掩盖天数选出的示例，并非代表所有站点。</figcaption></figure>
    <p>以 Grove St PATH 为例，9 月与 10 月的工作日总净流量，仅分别占借还总量的 <strong>3.3%</strong> 和 <strong>5.9%</strong>；但早间 07 至 09 时的净流入分别达到窗口内借还总量的 <strong>79.1%</strong> 与 <strong>82.2%</strong>，晚间 17 至 19 时则呈反向净流出。在这两个时间窗口都至少有 100 次活动的 77 个站点中，各月分别有 32 和 33 个达到方向相反、比例均至少 20% 的条件。</p>
    <p><strong>稳健性与边界：</strong>将全天平衡门槛从 10% 改为 5% 或 15%，并把小时净流量门槛提高到 15 次，现象仍存在，但计数会变化。只有行程数据，仍不能证明缺车、满桩或未满足需求，日内反转也不能直接证明骑行目的。</p>
    <p><strong>判断：</strong>数据可行、图表直观，但早晚流动反转本身并不稀奇。若选这个方向，价值应落在问题集中位置、反复程度和汇总指标的局限，不能仅靠一张高峰曲线。</p>
    <p class="data-links">核对数据：<a href="analysis/pilot-output/bike_summary.csv">月度汇总 CSV</a> · <a href="analysis/pilot-output/bike_repeated_stations.csv">重复出现的站点</a> · <a href="analysis/pilot-output/bike_threshold_sensitivity.csv">阈值敏感性比较</a></p>
  </article>

  <h3>现在怎么选</h3>
  <p><strong>希望问题具体、业务解释清楚：</strong>优先酒店，围绕“取消频率与取消时间给出的渠道判断不同”展开。<strong>希望切口更特别：</strong>优先继续挖电商评价时点，研究评价指标究竟覆盖了哪一阶段的体验。单车暂作第三候选。</p>
  <p>三个方向都已有可继续讨论的证据，但还没有完成正式文献综述、充分的构成调整或跨时期验证。接下来应选定一个主问题深化，避免把所有支线装进最终项目。</p>
  <details><summary>查看可复现文件与数据处理范围</summary>
    <p>从项目根目录运行 <code>python analysis/download_pilot.py</code> 下载输入，再运行 <code>Rscript analysis/pilot.R</code> 重建 CSV 和图表。实际环境版本见 <a href="analysis/pilot-output/sessionInfo.txt">R sessionInfo</a>。</p>
    <ul>
      <li><a href="analysis/pilot.R">R 分析脚本</a> · <a href="analysis/download_pilot.py">下载脚本</a> · <a href="data/pilot/download_manifest.json">来源与校验值</a> · <a href="analysis/pilot-output/results.json">完整摘要 JSON</a></li>
      <li>单车 233,865 条原始行程无重复 ride_id；剔除不满 60 秒或超过 24 小时及起终点站点缺失等记录后保留 233,293 条。各排除条件有重叠，不应直接相加。仅统计 JC/HB 站点事件。</li>
      <li>日期均按数据中的当地钟表值比较。单车时间字符串按 UTC 解析仅用于保持钟表小时和间隔计算，不代表把当地时间转换为 UTC。</li>
      <li>电商主数据源是 Olist 的公开镜像，酒店是 TidyTuesday 对原始酒店数据的整理镜像。原始 Kaggle 接口下载返回 404，故使用明确记录来源的镜像；尚未与原发布文件逐字节核验。</li>
    </ul>
  </details>
</section>
<!-- PILOT-RESULTS-END -->
'''

css = '''
    /* Empirical pilot additions */
    .pilot-article{margin-top:36px;padding-top:10px;border-top:1px solid var(--line)}
    .pilot-conclusion{font-size:18px;line-height:1.8}.pilot-wide{min-width:730px}
    figure{margin:24px 0}figure img{display:block;width:100%;height:auto;border:1px solid var(--line)}
    figcaption,.data-links{font-size:12px;line-height:1.8;color:var(--muted);margin-top:9px}
    details{margin:22px 0;padding:15px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
    summary{cursor:pointer;color:var(--blue);font-weight:600}details p{margin-top:14px}
    summary:focus-visible{outline:3px solid var(--blue);outline-offset:4px}
    @media print{figure{break-inside:avoid}figure img{max-height:150mm;object-fit:contain}.pilot-wide{min-width:0}.pilot-article{break-before:page}.pilot-conclusion{font-size:12pt}summary{color:var(--ink)}}
'''
for image in ("hotel-channels.svg", "olist-review-timing.svg", "bike-example.svg"):
    encoded = base64.b64encode((OUT / image).read_bytes()).decode("ascii")
    fragment = fragment.replace(f'src="analysis/pilot-output/{image}"',
                                f'src="data:image/svg+xml;base64,{encoded}"')
text = DOC.read_text(encoding="utf-8")
if "/* Empirical pilot additions */" not in text:
    text = text.replace("  </style>", css + "  </style>")
if '<a href="#pilot">' not in text:
    text = text.replace('<nav aria-label="目录">', '<nav aria-label="目录">\n      <a href="#pilot"><span class="num">→</span><strong>第一轮试探结果</strong></a>')
text = re.sub(r'<!-- PILOT-RESULTS-START -->.*?<!-- PILOT-RESULTS-END -->', '', text, flags=re.S)
text = text.replace('    <section id="overview"', fragment + '\n    <section id="overview"', 1)
text = text.replace('<title>R Final Project 选题讨论</title>', '<title>R Final Project 选题讨论与数据试探</title>')
text = text.replace('三个候选方向　／　2026 年 10 月 30 日', '三个候选方向与实测结果　／　2026 年 10 月 30 日')
text = text.replace('支撑度是根据数据提供方的说明和字段定义作出的初步判断，尚未下载数据或完成样本核查。下文均为待探索问题，实际结果可以支持、修正或否定最初设想。',
  '本表保留初始选题比较。第一轮数据试探已完成，实测范围与发现见上文；以下列出的扩展问题仍需进一步验证，不能全部视为已有发现。')
text = text.replace('数据支撑度为初步评估，最终范围以样本核查与小组讨论为准。', '已加入第一轮数据试探；最终范围以进一步核查、文献与小组讨论为准。')
DOC.write_text(text, encoding="utf-8")
print(DOC)
