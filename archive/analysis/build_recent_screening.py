"""Build the current discussion document from the verified source screening."""
from pathlib import Path
from html import escape
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "选题讨论.html"
ARCHIVE = ROOT / "选题讨论_第一轮存档.html"
profile = json.loads((ROOT / "data/screening/profile.json").read_text(encoding="utf-8"))
old = DOC.read_text(encoding="utf-8")
if not ARCHIVE.exists():
    shutil.copy2(DOC, ARCHIVE)
css = re.search(r"<style>(.*?)</style>", old, re.S).group(1)
if "/* Recent screening refinements */" not in css:
    css += '''
    /* Recent screening refinements */
    h1 .title-zh{white-space:nowrap}
    #overview .comparison{table-layout:fixed}
    #overview .comparison td{width:auto}
    #overview .comparison th:nth-child(1){width:14%}
    #overview .comparison th:nth-child(2){width:33%}
    #overview .comparison th:nth-child(3){width:30%}
    #overview .comparison th:nth-child(4){width:23%}
    '''
nyc_count = profile["nyc"]["records"]
nyc_unique = profile["nyc"]["distinct_record_id"]
cfpb_count = profile["cfpb"]["matched_2025_purchase_disputes"]
airbnb_count = profile["airbnb"]["listings"]

body = f'''
<a class="skip" href="#main">跳到正文</a>
<div class="layout">
  <aside aria-label="文档导航">
    <p class="side-title">R FINAL PROJECT<span>新数据筛选 · 2026.10.30</span></p>
    <nav aria-label="目录">
      <a href="#overview"><span class="num">00</span>本轮筛选结论</a>
      <a href="#retail"><span class="num">01</span>零售消费投诉</a>
      <a href="#payments"><span class="num">02</span>购买与支付争议</a>
      <a href="#hospitality"><span class="num">03</span>平台住宿供给</a>
      <a href="#pending"><span class="num">04</span>暂缓与排除</a>
      <a href="#sources"><span class="num">05</span>来源与复现</a>
    </nav>
    <div class="side-end"><button type="button" onclick="window.print()">打印或保存 PDF</button></div>
  </aside>
  <main id="main">
    <header class="opening">
      <p class="eyebrow">真实数据 · 近期记录 · 可探索的问题</p>
      <h1>R Final Project <span class="title-zh">新数据筛选</span></h1>
      <p class="lead">单车已排除。以近期真实记录重新比较选题，优先考察零售消费与支付争议，并保留一个住宿方向作为备选。</p>
      <p class="meta">核查日期：2026 年 10 月 30 日　／　已读取三组数据　／　待定题</p>
    </header>

    <section id="overview" aria-labelledby="overview-title">
      <h2 id="overview-title"><span class="section-num">00</span>本轮筛选结论</h2>
      <p class="pilot-conclusion"><strong>优先继续试探零售消费投诉与信用卡购买争议。</strong>两者已确认来源、实际记录年份与可用字段；住宿备选也通过数据核查，但需进一步判断问题本身是否有足够价值。</p>
      <p>筛选遵循四个条件：实际记录足够新、提供方能说明数据如何产生、能下载到记录级数据、关键字段能支撑明确的探索问题。发布时间不替代采集时间；生成器、模拟商店和仅有宣传说明的数据不作为主候选。</p>
      <div class="table-wrap" tabindex="0" role="region" aria-label="新数据候选对比">
        <table class="comparison"><thead><tr><th scope="col">候选</th><th scope="col">实际时间与核查范围</th><th scope="col">可讨论的题目</th><th scope="col">判断</th></tr></thead><tbody>
          <tr><td><a href="#retail">零售投诉</a></td><td>2025 年受理且已收录于公开结案表；全年 {nyc_count:,} 行，{nyc_unique:,} 个不同记录 ID，已完整下载。</td><td>退款与未送达纠纷，结案速度和结案方式是否揭示不同的问题？</td><td><strong>优先试探</strong>。有业务分类、问题类型、时间与处理结果。</td></tr>
          <tr><td><a href="#payments">购买争议</a></td><td>2025 年信用卡购买账单争议，官方 API 匹配 {cfpb_count:,} 笔；已读取最早的 1,000 笔核查字段。</td><td>按时回应的购买争议，补救形式是否因问题类型而不同？</td><td><strong>优先试探</strong>。API 和字段清楚；不直接观察消费者是否满意。</td></tr>
          <tr><td><a href="#hospitality">平台住宿</a></td><td>新加坡 2026 年 9 月快照，{airbnb_count:,} 条挂牌；实际 last_scraped 为 9 月 25 至 26 日，已完整读取。</td><td>挂牌总量是否高估了满足短住门槛的住宿选择？</td><td><strong>保留备选</strong>。真实网页观测，混有估算字段，需明确排除。</td></tr>
        </tbody></table>
      </div>
      <p class="note">通过核查表示真实来源、时间、获取方式与关键字段可用，不表示已经发现有价值的关系。CFPB 的 1,000 笔是按时间排序的字段检查样本，不是随机样本，不能代表全年比例。</p>
      <div class="value"><p><strong>Value 的共同标准</strong>　从指标背后识别值得关注的具体问题，说明它集中在哪里、涉及多少记录及哪些比较会改变判断。建议放在讨论部分，主要贡献保留给 EDA 的发现与证据。</p></div>
    </section>

    <section class="topic" id="retail" aria-labelledby="retail-title">
      <h2 id="retail-title"><span class="section-num">01</span>零售消费投诉</h2>
      <p class="research-title">退款与未送达纠纷的结案速度和结案方式有何差异</p>
      <p class="audience">候选题目　·　面向消费者保护部门与零售服务分析人员　·　主数据年为 2025</p>
      <p><strong>来源：</strong><a href="https://data.cityofnewyork.us/Business/DCWP-Consumer-Complaints/nre2-6m2s" target="_blank" rel="noopener noreferrer">纽约 DCWP Consumer Complaints</a>。官方数据字典说明，记录来自 311、在线、邮件及现场等真实投诉受理渠道。不是模拟订单，也不是生成的评价。</p>
      <h3>数据支撑度</h3>
      <p>已下载当前公开表中 2025 年受理的全部 {nyc_count:,} 行，包含 {nyc_unique:,} 个不同记录 ID，日期覆盖 1 月 1 日至 12 月 31 日。按杂项非食品零售、电子产品、家具、服装、药店五类粗筛，有 <strong>3,295 行</strong>；其中匹配退换退款、未送达或退款政策问题关键词的有 <strong>1,064 行</strong>，可作为进一步收窄范围的起点。</p>
      <div class="table-wrap" tabindex="0" role="region" aria-label="零售投诉字段与用途">
        <table class="evidence"><thead><tr><th scope="col">字段</th><th scope="col">能支持的比较</th><th scope="col">需要明确的边界</th></tr></thead><tbody>
          <tr><td><code>intake_date</code><br><code>result_date</code></td><td>受理至结案的历时分布；长尾与问题类型的关系。</td><td>只比较已结案记录；无法从此表计算全体投诉的结案率或未结积压。</td></tr>
          <tr><td><code>business_category</code><br><code>complaint_code</code></td><td>零售行业与纠纷类型分层；退款、未送达、收费等比较。</td><td>一条问题字段可包含多个代码，需拆分；有缺失分类。</td></tr>
          <tr><td><code>result</code></td><td>转介、信息不足、无企业回复、达成满意解决、退款等处理结果构成。</td><td>结案并不统一等同于问题获得实质解决；分类须按字典解释。</td></tr>
          <tr><td><code>intake_channel</code><br><code>borough</code></td><td>受理渠道、商家地区与结案形式的关联。</td><td>受理渠道不是购买渠道；地区是商家位置，不能当作消费者居住地。</td></tr>
          <tr><td><code>refund_amount</code></td><td>仅在有记录时描述退款金额。</td><td>全年只有 506 行有金额；缺失不能填成零，也不能据此计算真实退款率。</td></tr>
        </tbody></table>
      </div>
      <h3>可探索问题</h3>
      <ol class="questions">
        <li><strong>较快结案的投诉，是否主要集中在转介、信息不足等处理方式？</strong><p>同时呈现历时与结果，避免只用平均处理时间评价服务表现。这里是待检验关系，不预设“结案越快越差”。</p></li>
        <li><strong>未送达与退换退款纠纷，在哪些结果类型上差异较大？</strong><p>识别主要摩擦是企业未回复、资料不足、转介还是其他结果；同时报告数量和比例。</p></li>
        <li><strong>不同受理渠道或零售类别的差异，是否由纠纷构成不同所解释？</strong><p>在相同纠纷类型内比较；不把观察到的渠道差异说成渠道本身造成的效果。</p></li>
      </ol>
      <p><strong>潜在价值：</strong>把笼统的“投诉处理完成”拆开，让读者看到不同纠纷实际上停在了什么处理结果，发现哪些环节值得进一步调查。</p>
      <h3>定题前必须处理的问题</h3>
      <ul>
        <li>官方字典明确只收录 2023 年 7 月 1 日及以后已结案的投诉；当前队列不包含尚未结案的 2025 年受理记录，分析处理时长存在结案样本选择。</li>
        <li>24,810 行对应 24,792 个 ID，存在少量一单多行。应先核查同 ID 的结果差异，不能直接把每行都当作独立投诉。</li>
        <li>不能将零售投诉全部称为电商投诉，也不能把投诉数量除以没有的数据得出购买失败率。</li>
        <li>对“退款”和“问题解决”应依据结果标签解释；没有结果标签时，不用金额缺失替代消费者的实际结果。</li>
      </ul>
      <p><strong>Shiny 可承接：</strong>纠纷类型、零售类别、受理月份筛选；联动历时分布、结果构成和样本量。文献可围绕投诉处理绩效、程序性结案与消费者救济展开。</p>
      <p class="data-links">已核查文件：<a href="data/screening/nyc_dcwp_dictionary.xlsx">官方数据字典</a> · <a href="data/screening/nyc_dcwp_count_2025.json">全年数量核对</a> · <a href="data/screening/nyc_dcwp_all_2025.json">全年选定字段</a></p>
    </section>

    <section class="topic" id="payments" aria-labelledby="payments-title">
      <h2 id="payments-title"><span class="section-num">02</span>购买与支付争议</h2>
      <p class="research-title">按时回应的信用卡购买争议记录了哪些补救形式</p>
      <p class="audience">候选题目　·　面向支付服务与消费者保护分析人员　·　主数据年为 2025</p>
      <p><strong>来源：</strong><a href="https://www.consumerfinance.gov/data-research/consumer-complaints/" target="_blank" rel="noopener noreferrer">美国 CFPB Consumer Complaint Database</a>。这是监管机构发布的真实投诉记录，有官方 API 和字段说明。投诉内容是当事人的报告，不代表已查证的事实。</p>
      <h3>数据支撑度</h3>
      <p>筛选实际接收时间为 2025 年、产品为 <code>Credit card</code>、问题为 <code>Problem with a purchase shown on your statement</code>，官方 API 返回 <strong>{cfpb_count:,} 笔匹配记录</strong>。已读取按创建时间排序最早的 1,000 笔检查字段，实际接收日期为 2025 年 1 月 1 至 23 日。</p>
      <div class="table-wrap" tabindex="0" role="region" aria-label="购买争议字段与用途">
        <table class="evidence"><thead><tr><th scope="col">字段</th><th scope="col">能支持的比较</th><th scope="col">需要明确的边界</th></tr></thead><tbody>
          <tr><td><code>issue</code><br><code>sub_issue</code></td><td>购买争议未解决、未授权扣款、购买金额过高等分类比较。</td><td>结构化类别可用于 EDA；本题不依赖大型文本模型。</td></tr>
          <tr><td><code>company_response</code></td><td>解释结案、金钱补救、非金钱补救等回应形式。</td><td>这是企业回应分类，不能解释为消费者确认满意或实际无损失。</td></tr>
          <tr><td><code>timely</code></td><td>官方及时回应标识与回应形式交叉比较。</td><td>没有最终回应日期，不能自行计算精确回复耗时。</td></tr>
          <tr><td><code>company</code><br><code>state</code><br><code>date_received</code></td><td>企业、地区、月份与问题构成分层。</td><td>缺少各公司用户数、购买笔数等暴露分母，不能做服务失败率排名。</td></tr>
        </tbody></table>
      </div>
      <h3>可探索问题</h3>
      <ol class="questions">
        <li><strong>在获得及时回应的购买争议中，补救形式怎样随问题类型而不同？</strong><p>把“回应是否及时”与“回应记录了什么”一起看，判断单个指标提供的信息是否充分。</p></li>
        <li><strong>不同公司的回应形式差异，在相同争议类型内是否仍存在？</strong><p>先看问题结构，再比较结果分类；不直接把“解释结案”认定为不当处理。</p></li>
        <li><strong>少见但值得关注的回应组合，集中在哪些争议类型和月份？</strong><p>例如延迟回应与特定购买争议是否共同出现；需全年数据与足够样本量支持。</p></li>
      </ol>
      <p><strong>潜在价值：</strong>揭示购买争议处理的不同形式，让读者理解及时回应指标覆盖和遗漏了哪些信息。数据能观察企业如何回应，不能完整判断消费者最后是否获得满意解决。</p>
      <h3>定题前必须处理的问题</h3>
      <ul>
        <li>当前 1,000 笔样本仅用于核查字段与可用值，尚不能报告全年回应比例；若采用此题，应再下载完整 19,810 笔并重新核对数量。</li>
        <li>当前接口样本未返回 <code>consumer_disputed</code>，不适合研究“消费者是否接受回应”；不使用当前不可用的历史字段硬凑题目。</li>
        <li>数据未标明所有购买是否在线完成，因此应称“信用卡购买争议”，不称纯电商纠纷。BNPL 也不能仅凭公司名称或旧资料直接归类。</li>
        <li>投诉是自选择报告，且官方发布有自己的覆盖规则；本题描述投诉记录，不估计所有持卡人的体验。</li>
      </ul>
      <p><strong>Shiny 可承接：</strong>争议类型、公司和月份筛选；联动及时回应标识、回应形式及记录量。文献可围绕投诉绩效指标、服务补救与支付争议展开。</p>
      <p class="data-links">已核查文件：<a href="data/screening/cfpb_purchase_disputes_2025_structured.json">1,000 笔结构化样本</a> · <a href="https://cfpb.github.io/api/ccdb/fields.html" target="_blank" rel="noopener noreferrer">官方字段说明</a></p>
    </section>

    <section class="topic" id="hospitality" aria-labelledby="hospitality-title">
      <h2 id="hospitality-title"><span class="section-num">03</span>平台住宿供给</h2>
      <p class="research-title">住宿平台的挂牌总量是否高估了满足短住门槛的选择</p>
      <p class="audience">备选题目　·　面向住宿供给与旅行信息分析人员　·　主数据为 2026 年 9 月快照</p>
      <p><strong>来源：</strong><a href="https://insideairbnb.com/get-the-data/" target="_blank" rel="noopener noreferrer">Inside Airbnb 新加坡数据</a>。这是独立项目对 Airbnb 公开网页的采集，不是 Airbnb 官方订单，也不是合成消费者记录。提供方允许按 CC BY 4.0 使用，并公布采集假设。</p>
      <h3>数据支撑度</h3>
      <p>已读取 <strong>{airbnb_count:,} 条挂牌、90 个字段</strong>以及 <strong>46,000 条评论</strong>。评论实际日期从 2011 年至 2026 年 9 月，不能把所有评论当近期记录；其中 2025 年以来有 <strong>18,607 条</strong>，涉及 <strong>1,055 个房源</strong>。</p>
      <p>目录路径标注 2026 年 9 月 23 日，但记录中的实际 <code>last_scraped</code> 为 <strong>9 月 25 至 26 日</strong>。报告应明确这一区别，以实际行内日期说明观察时间。</p>
      <div class="table-wrap" tabindex="0" role="region" aria-label="住宿挂牌字段与用途">
        <table class="evidence"><thead><tr><th scope="col">字段</th><th scope="col">能支持的比较</th><th scope="col">需要明确的边界</th></tr></thead><tbody>
          <tr><td><code>minimum_nights</code><br><code>room_type</code></td><td>不同入住长度门槛下的挂牌数量和房型组合。</td><td>满足最少入住门槛并不保证某个日期有房或能成功预订。</td></tr>
          <tr><td><code>neighbourhood_cleansed</code><br><code>price</code></td><td>筛选门槛前后的地区与标示价格分布。</td><td>有 480 条价格缺失；报价口径与日期需再核对，不等于实际成交价格。</td></tr>
          <tr><td><code>host_id</code><br><code>calculated_host_listings_count</code></td><td>挂牌在不同房东及多房源房东之间的集中程度。</td><td>多套挂牌不自动等于专业运营，也不能证明实际拥有全部房产。</td></tr>
          <tr><td>评论表的 <code>listing_id</code> 和 <code>date</code></td><td>限制近期评论范围，识别哪些挂牌有近期可见活动。</td><td>没有评论不等于没有入住；文本表不提供重建近期平均星级所需的每条评分。</td></tr>
        </tbody></table>
      </div>
      <h3>可探索问题</h3>
      <ol class="questions">
        <li><strong>以一周短住为例，加入最少入住门槛后，名义挂牌规模收缩多少？</strong><p>目前 3,011 条记录有有效最少入住信息，其中 1,491 条门槛不超过 7 晚、1,472 条至少为 90 晚。这里仅是字段分布检查，尚未加入日期和其他预订限制。</p></li>
        <li><strong>短住门槛筛选后，地区、房型与标价选择是否更集中？</strong><p>在缺失值和可比报价口径处理后，比较筛选前后的分布。</p></li>
        <li><strong>符合门槛且有近期评论的挂牌，是否更集中于少数房东？</strong><p>把挂牌规模、近期评论和房东集中程度一起观察，不直接推断实际入住或收入。</p></li>
      </ol>
      <p><strong>潜在价值：</strong>识别“平台上有多少挂牌”与“某类旅行需求能看到多少符合门槛的选择”之间的差别。能定位供给结构，不承诺计算真实可订数量。</p>
      <h3>明确排除的字段与推断</h3>
      <ul>
        <li>不把 <code>estimated_occupancy_l365d</code>、<code>estimated_revenue_l365d</code> 当真实入住率或收入；它们是提供方估算值。</li>
        <li>不把不可用日历等同于已经售出的夜晚；单次快照无法重建订单流转。</li>
        <li>197 条最少入住限制缺失、1,369 条整体评分缺失，不将缺失自动填成短住可用或低评分。</li>
        <li>不根据最少入住夜数推断房源是否合法。若需要法律背景，应另行核对当地适用规则。</li>
      </ul>
      <p><strong>Shiny 可承接：</strong>入住长度门槛、房型及地区筛选；联动挂牌规模变化、房东集中度与分布图。文献可围绕平台供给结构、可见性偏差与住宿可及性展开。</p>
      <p class="data-links">已核查文件：<a href="data/screening/airbnb_singapore_2026_listings.csv.gz">挂牌原始文件</a> · <a href="https://insideairbnb.com/data-assumptions/" target="_blank" rel="noopener noreferrer">提供方的假设与估算说明</a></p>
    </section>

    <section class="discussion" id="pending" aria-labelledby="pending-title">
      <h2 id="pending-title"><span class="section-num">04</span>暂缓与排除</h2>
      <h3>真实来源但尚未通过本轮获取或时间核查</h3>
      <div class="table-wrap" tabindex="0" role="region" aria-label="待核查数据来源">
        <table><thead><tr><th scope="col">来源</th><th scope="col">已经确认</th><th scope="col">当前状态</th></tr></thead><tbody>
          <tr><td><a href="https://www.ofcom.org.uk/about-ofcom/our-research/statistical-release-calendar-2026" target="_blank" rel="noopener noreferrer">Ofcom Residential Postal Tracker 2025</a></td><td>官方技术报告明确为 2025 年 1 至 12 月真实调查、6,171 位受访者，官网列有个体数据 XLSX 与 SAV。</td><td><strong>保留待获取</strong>。当前 XLSX 下载返回 403；尚未读取字段，不能提前承诺其中有完整投诉路径。与另一项 Parcel Delivery Survey 不应混用。</td></tr>
          <tr><td><a href="https://dados.mj.gov.br/dataset/reclamacoes-do-consumidor-gov-br" target="_blank" rel="noopener noreferrer">巴西 Consumidor.gov.br</a></td><td>政府来源，目录列有 2025 与 2026 年月度真实投诉文件。</td><td><strong>暂缓</strong>。旧目录及 API 在当前环境出现连接错误，新门户返回页面但未取得可复现的月度下载。尚未做行级核查。</td></tr>
          <tr><td><a href="https://recsys.synerise.com/data-set" target="_blank" rel="noopener noreferrer">Synerise RecSys 2025</a></td><td>提供方明确为真实零售网站行为，覆盖六个月；原始版本约 1.9 GB。</td><td><strong>暂缓</strong>。已读官方字段说明，但实际日历年份尚未核实；价格、类别和文字被编码，业务解释受限。2025 是发布与竞赛年份，不能据此判定记录发生在 2025 年。</td></tr>
        </tbody></table>
      </div>
      <h3>不再进入当前候选</h3>
      <ul>
        <li><strong>单车：</strong>按讨论决定排除。</li>
        <li><strong>Olist 与原酒店预订数据：</strong>实际记录分别为 2016 至 2018 年、2015 至 2017 年，仅保留为方法参考。</li>
        <li><strong>明确标注合成或模拟的数据：</strong>例如 <a href="https://huggingface.co/datasets/millat/e-commerce-orders" target="_blank" rel="noopener noreferrer">E-commerce Customer Order Behavior</a> 和 <a href="https://data.mendeley.com/datasets/nph2cnh6r2/1" target="_blank" rel="noopener noreferrer">Loyalty Status of Hotel Guests</a>，提供方明确说明为生成或模拟记录，排除。</li>
        <li><strong>只改年份或重新包装旧数据的版本：</strong>未核实真实记录年份和原始来源前不采纳；“最近上传”不视为“近期采集”。</li>
      </ul>
      <p>匿名化不等于合成。真实数据中的估算指标也不等于直接观测；本轮住宿备选仅采用挂牌和评论观测，不使用估算入住与营收。字段全齐但来源不明的数据，不优于存在缺失但收集过程清楚的数据。</p>
      <h3>下一步的选题顺序</h3>
      <p><strong>先看零售投诉，再看购买与支付争议。</strong>前者更接近退换退款和未送达问题，后者的数据接口与分类更清楚。若想继续住宿方向，再讨论挂牌选择的题目；Ofcom 若能够取得个体数据，也值得回到优先比较。</p>
      <p>本轮完成的是数据可行性筛选，尚未对新候选开展完整 EDA 或断言发现了业务规律。正式定题应在有效样本、结果分类和关键比较核查后进行，并用文献解释问题为何值得关注。</p>
    </section>

    <section id="sources" aria-labelledby="sources-title">
      <h2 id="sources-title"><span class="section-num">05</span>来源与复现</h2>
      <ol class="sources">
        <li><strong>纽约 DCWP 官方数据与字典</strong><p><a href="https://data.cityofnewyork.us/Business/DCWP-Consumer-Complaints/nre2-6m2s" target="_blank" rel="noopener noreferrer">数据目录</a> · <a href="data/screening/nyc_dcwp_dictionary.xlsx">已下载的官方字典</a>。字典确认真实投诉来源及只收录已结案记录的覆盖规则。API 查询以受理日期筛选 2025 年，下载数量与服务器计数一致。</p></li>
        <li><strong>CFPB 官方数据库与字段说明</strong><p><a href="https://www.consumerfinance.gov/data-research/consumer-complaints/" target="_blank" rel="noopener noreferrer">数据库和使用边界</a> · <a href="https://cfpb.github.io/api/ccdb/fields.html" target="_blank" rel="noopener noreferrer">字段说明</a>。个体投诉数据可自由使用；保留官方关于覆盖范围及非代表性样本的说明。</p></li>
        <li><strong>Inside Airbnb 提供方数据与方法</strong><p><a href="https://insideairbnb.com/get-the-data/" target="_blank" rel="noopener noreferrer">下载目录和 CC BY 4.0 许可</a> · <a href="https://insideairbnb.com/data-assumptions/" target="_blank" rel="noopener noreferrer">公开网页来源、日历限制与估算模型</a>。保留提供方归属；不输出不必要的个人名称、头像或评论者信息。</p></li>
        <li><strong>Ofcom 官方目录与采集背景</strong><p><a href="https://www.ofcom.org.uk/about-ofcom/our-research/statistical-release-calendar-2026" target="_blank" rel="noopener noreferrer">2026 年目录中的 2025 全年个体数据</a> · <a href="https://www.ofcom.org.uk/siteassets/resources/documents/research-and-data/data/statistics/2026/residential-postal-tracker/ofcom-residential-postal-tracker-q1-q4-2025-technical-appendix.pdf?v=414885" target="_blank" rel="noopener noreferrer">抽样、权重和问卷变化说明</a>。采集于 2025 年，发布于 2026 年，两者明确区分。</p></li>
      </ol>
      <details><summary>查看核查文件与处理说明</summary>
        <p><a href="data/screening/profile.json">字段与日期核查摘要</a> · <a href="data/screening/recent_download_manifest.json">已下载文件的来源与 SHA-256</a> · <a href="analysis/screen_recent_sources.py">可复现下载脚本</a> · <a href="analysis/profile_recent_sources.py">核查脚本</a></p>
        <p>本轮以 Python 检查获取、记录年份和字段；不是最终 R 分析交付。后续 EDA 和 Shiny 仍按课程要求在 R 中完成。当前 JSON 查询支持在 R 中用 jsonlite 读取，CSV/GZ 可用 readr 导入。</p>
        <p>所有规模均为本次查询或下载时的状态，公开平台可能继续更新。已下载的字典单独存储；Ofcom 的获取失败记录见 <a href="data/screening/ofcom_downloads.json">访问状态</a>。</p>
      </details>
      <p class="note"><a href="选题讨论_第一轮存档.html">查看早期选题与试探存档</a>。其中的旧年份数据和单车均不属于当前候选；原文件保留用于核对既有工作。</p>
    </section>
    <footer>R Final Project · 新数据筛选 · 2026 年 10 月 30 日 · 真实来源与采集时间优先，发现仍需 EDA 验证。</footer>
  </main>
</div>
'''
document = f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>R Final Project 新数据筛选</title><style>{css}</style></head><body>{body}</body></html>'''
DOC.write_text(document, encoding="utf-8")
print(f"Updated {DOC}; early pilot archived at {ARCHIVE}")
