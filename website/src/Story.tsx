import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Download, RotateCcw, X } from 'lucide-react';
import { useI18n } from './i18n';
import snapshot from './data/dashboard.json';
import bundle from './data/presentation.json';
import { categories, categoryLabels, gradeLabel, productName } from './dashboardModel';
import type { Category, DashboardData, Product } from './dashboardModel';
import { SignalPlot, TrendPlot, JointBudget, GradeLegend } from './StoryCharts';
import './story.css';

const data = snapshot as unknown as DashboardData;
const pad = (n: number) => String(n).padStart(2, '0');
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const storySlugs = ['opening', 'gap', 'sample', 'method', 'nutrition', 'environment', 'joint', 'answer'] as const;
export type StorySlug = typeof storySlugs[number];

const chapterNames: Record<StorySlug, [string, string, string, string]> = {
  opening: ['Opening', '起点', 'Opening', '起点'],
  gap: ['The gap', '问题', 'The comparison gap', '比较的缺口'],
  sample: ['Sample', '样本', 'The sample', '样本'],
  method: ['Method', '方法', 'The method', '研究方法'],
  nutrition: ['Nutrition', '营养', 'Price and nutrition', '价格与营养'],
  environment: ['Environment', '环境', 'Price and environment', '价格与环境'],
  joint: ['Similar prices', '同价位', 'At similar prices', '相近价格下'],
  answer: ['The answer', '结论', 'The answer', '结论'],
};

const hashFor = (slug: StorySlug) => `#story/${slug}`;

function Rail({ current }: { current: number }) {
  const { language } = useI18n();
  return <nav className="chapter-rail" aria-label={language === 'zh' ? '章节' : 'Chapters'}>
    <div className="rail-inner">
      <ol>
        {storySlugs.map((slug, index) => {
          const names = chapterNames[slug];
          return <li key={slug}>
            <a href={hashFor(slug)} aria-label={`${pad(index)} ${names[language === 'zh' ? 1 : 0]}`} className={index === current ? 'is-current' : index < current ? 'is-past' : undefined} aria-current={index === current ? 'step' : undefined}>
              <span className="rail-num">{pad(index)}</span>
              <span className="rail-label">{names[language === 'zh' ? 1 : 0]}</span>
            </a>
          </li>;
        })}
      </ol>
      <span className="rail-count">{pad(current + 1)} / {pad(storySlugs.length)}</span>
    </div>
    <span className="rail-progress" aria-hidden="true"><span style={{ width: `${(current + 1) / storySlugs.length * 100}%` }} /></span>
  </nav>;
}

function Pager({ current }: { current: number }) {
  const { language } = useI18n();
  const copy = (index: number) => chapterNames[storySlugs[index]][language === 'zh' ? 3 : 2];
  const previous = current > 0 ? current - 1 : null;
  const next = current < storySlugs.length - 1 ? current + 1 : 0;
  return <nav className="chapter-pager" aria-label={language === 'zh' ? '章节导航' : 'Chapter navigation'}>
    {previous === null ? <span /> : <a href={hashFor(storySlugs[previous])}><ArrowLeft size={16} /><span><small>{language === 'zh' ? '上一节' : 'Previous'}</small>{copy(previous)}</span></a>}
    <a className="pager-next" href={hashFor(storySlugs[next])}>
      <span><small>{current === storySlugs.length - 1 ? (language === 'zh' ? '回到开头' : 'Back to the opening') : (language === 'zh' ? '下一节' : 'Next')}</small>{copy(next)}</span>
      {current === storySlugs.length - 1 ? <RotateCcw size={16} /> : <ArrowRight size={16} />}
    </a>
  </nav>;
}

function Head({ index, label, title, lead }: { index: number; label: string; title: ReactNode; lead?: ReactNode }) {
  return <header className="chapter-head">
    <p className="chapter-kicker"><span>{pad(index)}</span><i aria-hidden="true" />{label}</p>
    <h1>{title}</h1>
    {lead && <p className="chapter-lead">{lead}</p>}
  </header>;
}

/* ------------------------------------------------------------------ */

function Opening() {
  const { language } = useI18n();
  const zh = language === 'zh';
  return <section className="chapter chapter-opening">
    <div className="opening-grid">
      <div className="opening-copy">
        <p className="chapter-kicker"><span>00</span><i aria-hidden="true" />Food / Signal</p>
        <h1>{zh ? '花更多钱，' : 'Does paying more'}<br />{zh ? '就买到更好的食物吗？' : 'buy better food?'}</h1>
        <p className="chapter-lead">{zh
          ? '货架上，一瓶有机果汁可能比旁边那瓶贵出三倍。多付的钱，会不会出现在营养标签上，或者出现在环境等级里？我们用法国在售的 598 款包装食品检验了这个直觉。'
          : 'A bottle of organic juice can cost three times as much as the one beside it. We tested whether the extra money shows up in the nutrition label or in the environmental grade, using 598 packaged foods sold in France.'}</p>
        <div className="opening-actions">
          <a className="button primary" href={hashFor('gap')}>{zh ? '开始阅读' : 'Start the story'} <ArrowRight size={17} /></a>
          <a className="text-link" href={hashFor('answer')}>{zh ? '直接看结论' : 'Skip to the answer'}</a>
        </div>
        <dl className="opening-facts">
          <div><dt>598</dt><dd>{zh ? '款可比商品' : 'comparable products'}</dd></div>
          <div><dt>4</dt><dd>{zh ? '个食品类别' : 'food categories'}</dd></div>
          <div><dt>2024–25</dt><dd>{zh ? '法国零售报价' : 'French price quotes'}</dd></div>
        </dl>
      </div>
      <figure className="opening-art">
        <img src={asset('img/counter.webp')} alt={zh ? '桌面上的饼干、早餐谷物、橙汁与黑巧克力' : 'Biscuits, breakfast cereal, orange juice and dark chocolate on a table'} width={1200} height={1696} />
        <figcaption>{zh ? '示意图 · AI 生成' : 'Editorial illustration · AI-generated'}</figcaption>
      </figure>
    </div>
  </section>;
}

function Gap() {
  const { language } = useI18n();
  const zh = language === 'zh';
  const signals = [
    { tag: '€/kg', title: zh ? '价格' : 'Price', body: zh ? '货架价取决于包装大小。同一条货架上同时有 125 g 和 1.2 kg 的包装，只有换算成 €/kg 才能比较。' : 'The shelf price depends on pack size. A 125 g pack and a 1.2 kg pack sit on the same shelf; only €/kg makes them comparable.' },
    { tag: 'A–E', title: zh ? '营养等级' : 'Nutrition grade', body: zh ? '一个字母同时概括糖、盐、饱和脂肪、纤维和蛋白质。字母相同的两款商品，配方可以差别很大。' : 'One letter summarises sugar, salt, saturated fat, fibre and protein together. Two products with the same letter can differ in what they contain.' },
    { tag: 'A+–F', title: zh ? '环境等级' : 'Environmental grade', body: zh ? '按每 100 g 计算的综合评分，随配方与采购变化，却不会随价签变化。' : 'A composite score per 100 g. It moves with recipe and sourcing, not with the price tag.' },
  ];
  return <section className="chapter">
    <Head index={1} label={zh ? '比较的缺口' : 'The comparison gap'}
      title={<>{zh ? '一个货架，三种答案，' : 'One shelf, three answers.'}<br />{zh ? '没有一个叫“值不值”。' : 'None of them is “value”.'}</>}
      lead={zh
        ? '购物者被要求同时读懂三套从未打算互相比较的系统。我们想知道：在这三套系统之间，价格到底透露了多少信息。'
        : 'Shoppers are asked to combine three systems that were never designed to be compared. We asked how much the price tag actually tells you about the other two.'} />
    <div className="signal-cards">
      {signals.map(s => <article key={s.tag}>
        <span className="signal-tag">{s.tag}</span>
        <h2>{s.title}</h2>
        <p>{s.body}</p>
      </article>)}
    </div>
    <div className="evidence-pair">
      <blockquote>
        <p>{zh ? '“更健康的饮食平均更贵，但价格差距随食品类别变化。”' : '“Healthier diets tended to cost more on average, but the price difference varied by food group.”'}</p>
        <cite>Rao et al. (2013), BMJ Open</cite>
      </blockquote>
      <blockquote>
        <p>{zh ? '“同一种食物，不同生产方式的环境影响差异很大。”' : '“Environmental impacts varied widely across producers of the same food.”'}</p>
        <cite>Poore &amp; Nemecek (2018), Science</cite>
      </blockquote>
    </div>
    <ol className="question-list">
      {[
        [zh ? '价格更高的商品，营养构成更好吗？' : 'Do higher-priced products have better nutritional profiles?', zh ? '价格 × 营养' : 'Price × nutrition'],
        [zh ? '更高的价格，对应更好的环境表现吗？' : 'Does a higher price align with better environmental performance?', zh ? '价格 × 环境' : 'Price × environment'],
        [zh ? '在相近价格下，是否有两项都不更差的替代品？' : 'At a similar price, is there an alternative with neither grade worse?', zh ? '环境 × 营养' : 'Environment × nutrition'],
      ].map(([question, tag], i) => <li key={question}>
        <span className="question-number">{pad(i + 1)}</span>
        <p>{question}</p>
        <span className="question-tag">{tag}</span>
      </li>)}
    </ol>
  </section>;
}

function Sample() {
  const { language, t } = useI18n();
  const zh = language === 'zh';
  const summary = data.tables.category_summary;
  const funnel = [
    { value: bundle.counts.scoped.toLocaleString('en-US'), label: zh ? '条法国 EUR 食品报价' : 'French EUR food quotes' },
    { value: String(bundle.counts.selected), label: zh ? '款入选商品' : 'products selected' },
    { value: String(bundle.counts.primary), label: zh ? '款通过规格核查' : 'passed the package check' },
    { value: String(bundle.counts.joint), label: zh ? '款同时具备两项等级' : 'carry both grades' },
  ];
  return <section className="chapter">
    <Head index={2} label={zh ? '样本' : 'The sample'}
      title={zh ? <>四个货架，598 款商品，<br />每款一个可比价格。</> : <>Four aisles, 598 products,<br />one comparable price each.</>}
      lead={zh
        ? '我们把 2024–2025 年法国零售报价与商品资料按条码连接。每款商品最终得到一个可比的单位价格，以及在数据允许时的两个等级。'
        : 'We linked French retail quotes from 2024–2025 to product information by barcode. Every product ends with one comparable unit price and, where the data allow, two grades.'} />
    <ol className="funnel">
      {funnel.map(step => <li key={step.label}><strong>{step.value}</strong><span>{step.label}</span></li>)}
    </ol>
    <figure className="category-figure">
      <img src={asset('img/categories.webp')} alt={zh ? '饼干、加奶早餐谷物、黑巧克力与橙汁' : 'Biscuits, breakfast cereal with milk, dark chocolate and orange juice'} width={1800} height={600} />
      <figcaption>{zh ? '四个类别各抽 150 款；两款因包装规格无法换算被排除。' : '150 products per category at selection; two were excluded because their package size could not be converted.'}</figcaption>
    </figure>
    <div className="category-cards">
      {categories.map(c => {
        const row = summary.find(r => r.category === c);
        return <article key={c}>
          <h2>{t(categoryLabels[c])}</h2>
          <p className="category-price">€{row ? row.median_price.toFixed(2) : '—'}<span>/{row?.target_unit ?? 'kg'}</span></p>
          <p className="category-meta">{row?.n ?? 0} {zh ? '款 · 中位价格' : 'products · median'}</p>
        </article>;
      })}
    </div>
    <div className="source-strip">
      <div><span className="source-tag">{zh ? '报价' : 'Prices'}</span><strong>Open Prices</strong><p>{zh ? '法国 · 欧元 · 2024–2025 年' : 'France · EUR · 2024–2025'}</p></div>
      <div><span className="source-tag">{zh ? '商品资料' : 'Attributes'}</span><strong>Open Food Facts</strong><p>{zh ? '获取于 2026 年 11 月 2 日' : 'retrieved 2 November 2026'}</p></div>
      <div><span className="source-tag">{zh ? '连接键' : 'Join key'}</span><strong>{zh ? '字符型条码' : 'Character barcode'}</strong><p>{zh ? '保留前导零，多条报价对一款商品' : 'Leading zeros kept; many quotes, one product'}</p></div>
    </div>
  </section>;
}

function Method() {
  const { language } = useI18n();
  const zh = language === 'zh';
  const example = bundle.examples[0];
  const steps = [
    [zh ? '保留有效常规报价' : 'Keep valid regular quotes', zh ? '剔除折扣与异常价格，折扣记录单独保留。' : 'Discounts and invalid prices are removed; discount rows stay separate.'],
    [zh ? '按条码连接商品' : 'Join to the product', zh ? '字符型条码精确匹配，前导零不丢。' : 'Exact match on the character barcode, leading zeros preserved.'],
    [zh ? '除以净含量' : 'Divide by net quantity', zh ? '固体换算为 €/kg，果汁为 €/L。' : 'Solids become €/kg; juice becomes €/L.'],
    [zh ? '取中位数' : 'Take the median', zh ? '同一商品的多条常规报价合成一个代表价格。' : 'Several regular quotes for one product become one representative price.'],
    [zh ? '核对覆盖与样本' : 'Check coverage', zh ? '598 款可比，583 款同时具备两项等级。' : '598 are comparable; 583 carry both grades.'],
  ];
  return <section className="chapter">
    <Head index={3} label={zh ? '研究方法' : 'The method'}
      title={zh ? <>从一张小票，到一个可比价格。</> : <>From a receipt to a comparable price.</>}
      lead={zh
        ? '这一步决定了后面所有图表能不能读。规则只有五条，完整审计可以逐条展开到 56 个操作。'
        : 'This is what makes the charts readable. Five rules carry the whole dataset; the full audit expands to 56 operations.'} />
    <ol className="method-steps">
      {steps.map(([title, body], i) => <li key={title}>
        <span className="method-number">{pad(i + 1)}</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </li>)}
    </ol>
    <div className="worked-example">
      <div className="worked-copy">
        <p className="eyebrow">{zh ? '真实案例' : 'One real product'}</p>
        <h2>{example.name}</h2>
        <p>{example.brand} · {example.quantity} · {zh ? '营养' : 'Nutrition'} {example.nutrition} · {zh ? '环境' : 'Environment'} {example.environment}</p>
        <p className="worked-note">{zh ? '两条历史报价，换算后取中位数。' : 'Two historical quotes, converted and reduced to one median.'}</p>
      </div>
      <table className="quote-table">
        <thead><tr><th>{zh ? '报价日期' : 'Quote date'}</th><th>{zh ? '整包价格' : 'Pack price'}</th><th>{zh ? '单位价格' : 'Unit price'}</th></tr></thead>
        <tbody>
          {example.quotes.map(q => <tr key={q.id}><td>{q.date}</td><td>€{q.price.toFixed(2)}</td><td>€{q.unitPrice.toFixed(2)}/{example.unit}</td></tr>)}
          <tr className="quote-result"><th>{zh ? '代表价格' : 'Representative price'}</th><td colSpan={2}>€{example.representativePrice.toFixed(2)}/{example.unit}</td></tr>
        </tbody>
      </table>
    </div>
    <a className="inline-link" href="#pipeline">{zh ? '逐条查看 56 个处理步骤与 R 源码' : 'Inspect all 56 processing steps and the R source'} <ArrowUpRight size={16} /></a>
  </section>;
}

function correlation(metric: 'nutri_score' | 'environment_score', category: Category) {
  const row = data.tables.associations.find(r => r.category === category && r.metric === metric);
  return { value: row?.rho ?? 0, n: row?.n ?? 0 };
}

function Nutrition() {
  const { language } = useI18n();
  const zh = language === 'zh';
  const signals = categories.map(c => { const r = correlation('nutri_score', c); return { category: c, value: -r.value, n: r.n }; });
  const chocolate = data.products.filter(p => p.category === 'dark_chocolates');
  return <section className="chapter">
    <Head index={4} label={zh ? '价格与营养' : 'Price and nutrition'}
      title={zh ? <>两个货架上，价格与营养同向；<br />另外两个，价格几乎不说明问题。</> : <>In two aisles, price tracks nutrition.<br />In two, it does not.</>}
      lead={zh
        ? '我们把价格与营养分数在类别内做秩相关。取值为正，表示价格越高、等级越好；取值越接近零，表示价签越读不出营养信息。'
        : 'We rank-correlated price and nutrition score inside each category. Positive means a higher price comes with the better grade; values near zero mean the price tag carries little nutrition information.'} />
    <SignalPlot rows={signals} unit={zh ? 'Spearman ρ · 正值为“价格更高、营养更好”' : 'Spearman ρ · positive means higher price, better grade'} />
    <div className="reading-pair">
      <p>{zh
        ? '早餐谷物与黑巧克力在最上面：ρ 分别是 0.20 和 0.27。饼干与果汁贴着零线，意味着贵一倍的商品，营养等级和便宜那款几乎没有系统性差别。'
        : 'Breakfast cereals and dark chocolate sit at the top, at 0.20 and 0.27. Biscuits and juice sit on the zero line: a product that costs twice as much has, on average, essentially the same nutrition grade.'}</p>
      <p className="muted-note">{zh
        ? '即使是最强的关系也只是“温和”：ρ ≈ 0.2 意味着价格只能解释两款商品之间很小一部分差异。类别内的单个比较仍然必要。'
        : 'Even the strongest link is modest. A ρ near 0.2 means price explains only a small part of the difference between two products, so the individual comparison still matters.'}</p>
    </div>
    <div className="tradeoff">
      <div className="tradeoff-copy">
        <p className="eyebrow">{zh ? '为什么等级不够用' : 'Why the grade compresses'}</p>
        <h2>{zh ? '黑巧克力：糖更少，饱和脂肪更多。' : 'Dark chocolate: less sugar, more saturated fat.'}</h2>
        <p>{zh
          ? '黑巧克力里，价格与糖的相关系数是 −0.46：越贵，糖越少。但同样这批商品，价格与饱和脂肪是 +0.40。多付的钱同时买到了“更好”和“更差”，而营养等级只有一个字母——本类别里所有商品都是 D 或 E。'
          : 'In dark chocolate the price–sugar correlation is −0.46: the expensive bars carry less sugar. The same products also show +0.40 for saturated fat. The extra money buys an improvement and a deterioration at the same time, and the grade reports one letter — in this category, always D or E.'}</p>
      </div>
      <div className="tradeoff-plots">
        <TrendPlot products={chocolate} metric="sugars_100g" colour="#b4514a" label={zh ? '糖' : 'Sugars'} unit={zh ? 'g / 100 g · ρ = −0.46' : 'g / 100 g · ρ = −0.46'} />
        <TrendPlot products={chocolate} metric="saturated_fat_100g" colour="#4c7fa8" label={zh ? '饱和脂肪' : 'Saturated fat'} unit={zh ? 'g / 100 g · ρ = +0.40' : 'g / 100 g · ρ = +0.40'} />
      </div>
    </div>
    <p className="chart-note">{zh ? '每个点是一款商品，折线为价格三分位内的中位数。完整分布与下钻见仪表板。' : 'Each dot is a product; the line joins the median of each price third. Full distributions and drill-down are in the dashboard.'}</p>
  </section>;
}

function Environment() {
  const { language } = useI18n();
  const zh = language === 'zh';
  const signals = categories.map(c => { const r = correlation('environment_score', c); return { category: c, value: r.value, n: r.n }; });
  return <section className="chapter">
    <Head index={5} label={zh ? '价格与环境' : 'Price and environment'}
      title={zh ? <>更环保的货架更贵，<br />但只在两个货架上成立。</> : <>A greener shelf costs more,<br />but only in two aisles.</>}
      lead={zh
        ? '环境等级按 A+ 到 F 排序。这里同样是类别内的秩相关：早餐谷物 0.31，黑巧克力 0.24，饼干 0.03，果汁 0.04。'
        : 'Environmental grades run A+ to F. The within-category rank correlation is 0.31 for cereals, 0.24 for chocolate, 0.03 for biscuits and 0.04 for juice.'} />
    <SignalPlot rows={signals} unit={zh ? 'Spearman ρ · 正值为“价格更高、环境更好”' : 'Spearman ρ · positive means higher price, better grade'} />
    <div className="callout">
      <p className="eyebrow">{zh ? '一个具体的例外' : 'A concrete exception'}</p>
      <h2>{zh ? '每类里最贵的那款，环境等级都不是该类最好的。' : 'The most expensive product in every category is never the best environmental grade in it.'}</h2>
      <div className="callout-body">
        <div>
          <p>{zh
            ? '早餐谷物里最贵的是 Priméal 的藜麦膨化谷物，€46.50/kg。它的营养等级是 A，这一类里最好的一档；环境等级却是 D。'
            : 'The priciest cereal is Priméal quinoa soufflé at €46.50/kg. Its nutrition grade is A, the best grade in this category. Its environmental grade is D.'}</p>
          <p>{zh
            ? '这正是价格的问题：它把两件事打包成一个数字。贵，可能意味着更好的配方，也可能只是更小的包装、更远的运输、或者一个愿意为货架位置付钱的品牌。'
            : 'This is the problem with price: it bundles two different things into one number. Expensive can mean a better recipe, a smaller pack, a longer journey, or a brand paying for shelf position.'}</p>
        </div>
        <dl className="callout-facts">
          <div><dt>€46.50</dt><dd>{zh ? '每公斤' : 'per kg'}</dd></div>
          <div><dt>A</dt><dd>{zh ? '营养等级' : 'nutrition grade'}</dd></div>
          <div><dt className="is-warm">D</dt><dd>{zh ? '环境等级' : 'environment grade'}</dd></div>
        </dl>
      </div>
    </div>
    <div className="caveat">
      <p className="eyebrow">{zh ? '关于碳的数字' : 'On the carbon numbers'}</p>
      <p>{zh
        ? 'AGRIBALYSE 3.2 的碳估算覆盖 594 款商品，但它们映射到标准食品参考项：早餐谷物 150 款商品只对应 4 个不同的碳值。因此这些数字适合看参考项之间的差异，不适合排品牌榜。'
        : 'AGRIBALYSE 3.2 estimates cover 594 products, but they map to standard food references: the 150 cereals share just four distinct carbon values. Read them as reference-level differences, not a brand ranking.'}</p>
    </div>
  </section>;
}

function Joint() {
  const { language, t } = useI18n();
  const zh = language === 'zh';
  const [category, setCategory] = useState<Category>('dark_chocolates');
  const [detail, setDetail] = useState<Product | null>(null);
  const rows = useMemo(() => data.products.filter(p => p.category === category), [category]);
  const bounds = useMemo(() => {
    const prices = rows.map(p => p.representative_price).sort((a, b) => a - b);
    return [prices[0], prices[prices.length - 1]] as const;
  }, [rows]);
  const [position, setPosition] = useState(.55);
  const ceiling = 10 ** (Math.log10(bounds[0]) + position * (Math.log10(bounds[1]) - Math.log10(bounds[0])));
  const within = rows.filter(p => p.representative_price <= ceiling && p.nutri_grade && p.environment_grade).length;
  const total = rows.filter(p => p.nutri_grade && p.environment_grade).length;
  const choose = (value: Category) => { setCategory(value); setPosition(.55); setDetail(null); };
  return <section className="chapter">
    <Head index={6} label={zh ? '相近价格下' : 'At similar prices'}
      title={zh ? <>把预算往下拖，<br />权衡就出现了。</> : <>Drag the budget down, and the trade-off appears.</>}
      lead={zh
        ? '横轴是环境等级（越左越好），纵轴是价格，颜色是营养等级。选一个类别，再用预算滑动条筛掉买不起的商品。'
        : 'Environment is on the horizontal axis (better to the left), price on the vertical, nutrition in the colour. Pick a category, then use the budget slider to fade out what you would not buy.'} />
    <div className="joint-controls">
      <div className="chip-row" role="group" aria-label={zh ? '食品类别' : 'Food category'}>
        {categories.map(c => <button key={c} type="button" aria-pressed={category === c} onClick={() => choose(c)}>{t(categoryLabels[c])}</button>)}
      </div>
      <label className="budget-control">
        <span>{zh ? '预算上限' : 'Budget ceiling'} <strong>€{ceiling.toFixed(0)}/{rows[0]?.target_unit ?? 'kg'}</strong></span>
        <input type="range" min={0} max={100} value={position * 100} onChange={e => setPosition(Number(e.target.value) / 100)} aria-label={zh ? '预算上限' : 'Budget ceiling'} />
      </label>
      <p className="budget-readout" role="status">{within} / {total} <span>{zh ? '款在预算内' : 'products within budget'}</span></p>
    </div>
    <GradeLegend />
    <div className="joint-scroll"><JointBudget products={data.products} category={category} ceiling={ceiling} onSelect={setDetail} /></div>
    {detail && <aside className="story-selected" aria-live="polite">
      <button aria-label={zh ? '关闭商品详情' : 'Close product detail'} onClick={() => setDetail(null)}><X size={17} /></button>
      <h3>{productName(detail)}</h3>
      <p>{t(categoryLabels[detail.category])} · {detail.code} · €{detail.representative_price.toFixed(2)}/{detail.target_unit}</p>
      <p>{zh ? '营养' : 'Nutrition'} {gradeLabel(detail.nutri_grade)} · {zh ? '环境' : 'Environment'} {gradeLabel(detail.environment_grade)} · {zh ? '糖' : 'Sugars'} {detail.sugars_100g ?? '—'} g / 100 {detail.target_unit === 'L' ? 'ml' : 'g'}</p>
    </aside>}
    <div className="finding-strip">
      <p className="finding-number">562<span>/583</span></p>
      <p>{zh
        ? '在同时具备两项等级的 583 款商品中，562 款都能在同类里找到“价格更低、两项等级都不更差”的替代品。剩下 21 款，才是真正在要求溢价的商品。'
        : 'Of the 583 products that carry both grades, 562 have a cheaper alternative in the same category with neither grade worse. The remaining 21 are the ones genuinely asking for a premium.'}</p>
    </div>
    <p className="chart-note">{zh ? '等级是序数，不假设等级之间的距离；规则只问“是否不更差”。数字与报告一致，逐款清单见数据处理流程。' : 'Grades are ordinal: no distance between letters is assumed, and the rule only asks whether a grade is no worse. The counts follow the report; the product-level list is in the data pipeline.'}</p>
  </section>;
}

function Answer() {
  const { language } = useI18n();
  const zh = language === 'zh';
  const points = [
    [zh ? '先定类别，再谈价格。' : 'Set the category first.', zh ? '四个货架的价格区间和计价单位都不同。跨类别排一个“性价比榜”，在方法上就不成立。' : 'The four aisles have different price ranges and units. A single cross-category value ranking is not a meaningful object.'],
    [zh ? '把溢价当成问题，而不是信号。' : 'Treat a premium as a question, not a signal.', zh ? '饼干与果汁里，价格几乎读不出营养和环境信息；谷物与巧克力里有一点，但远不足以替代具体比较。' : 'In biscuits and juice, price carries almost no information about either grade. In cereals and chocolate it carries some, but far too little to replace an actual comparison.'],
    [zh ? '打开配方看。' : 'Open the composition.', zh ? '黑巧克力里，多付的钱同时买到更少的糖和更多的饱和脂肪。一个字母的等级压不住这种权衡。' : 'In dark chocolate, the extra money buys less sugar and more saturated fat at once. A single-letter grade cannot hold that trade-off.'],
  ];
  return <section className="chapter">
    <Head index={7} label={zh ? '结论' : 'The answer'}
      title={zh ? <>价格是一个很弱的标签。<br />类别，才是有用的那个。</> : <>Price is a weak label.<br />The category is the useful one.</>}
      lead={zh
        ? '回答开头的问题：不一定。多付的钱有时买到更好的营养，有时只是买到更小的包装；而在每个类别里，它都没有买到该类最好的环境等级。'
        : 'The answer to the opening question is: not reliably. Sometimes the extra money buys better nutrition; sometimes it buys only a smaller pack. In every category it never bought the best environmental grade on the shelf.'} />
    <ol className="takeaways">
      {points.map(([title, body], i) => <li key={title}>
        <span className="method-number">{pad(i + 1)}</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </li>)}
    </ol>
    <div className="actors">
      <div className="actors-copy">
        <p className="eyebrow">{zh ? '谁能用上' : 'Who can use this'}</p>
        <h2>{zh ? '消费者挑商品，零售商看位置。' : 'Shoppers choose products; retailers read position.'}</h2>
        <p>{zh
          ? '对消费者，用途是缩小候选：先定类别与预算，再看两款商品的配方差异，而不是把“贵”当作质量标签。对零售商，同样的视图是一张位置图：哪些商品在更低价格上提供了不更差的等级，值得在定价或配方复核时拿出来看。'
          : 'For a shopper, the use is narrowing a choice: set the category and the budget, then compare two compositions instead of reading “expensive” as a quality label. For a retailer, the same view is a positioning map: which products offer no-worse grades at a lower price, and therefore deserve a look in a pricing or reformulation review.'}</p>
        <p className="muted-note">{zh
          ? '这些是零售比较基准。成本、需求、货架条款与当前价格都不在数据里，任何商业决定都需要另补证据。'
          : 'These are retail comparison benchmarks. Costs, demand, shelf terms and current prices are not in the data; any commercial decision needs separate evidence.'}</p>
      </div>
      <figure className="actors-art">
        <img src={asset('img/shelf.webp')} alt={zh ? '超市里，顾客在比较两袋谷物' : 'A shopper comparing two bags of cereal in a supermarket'} width={1700} height={957} />
        <figcaption>{zh ? '示意图 · AI 生成' : 'Editorial illustration · AI-generated'}</figcaption>
      </figure>
    </div>
    <div className="story-end">
      <div className="end-copy">
        <p className="eyebrow">{zh ? '故事到这里' : 'End of the story'}</p>
        <h2>{zh ? '接下来，自己去看。' : 'Now go and look for yourself.'}</h2>
        <p>{zh ? '完整的仪表板、逐步清洗流程与数据来源都在下面。报告可以下载。' : 'The full dashboard, the step-by-step pipeline and the sources are below. The report is available as a PDF.'}</p>
      </div>
      <div className="end-actions">
        <a className="end-card is-primary" href="#dashboard"><div><span>{zh ? '打开仪表板' : 'Open the dashboard'}</span><small>{zh ? '按类别筛选、对比两款商品、导出 CSV' : 'Filter by category, compare two products, export CSV'}</small></div><ArrowRight size={18} /></a>
        <a className="end-card" href={asset('downloads/food-choices-report.pdf')} download><div><span>{zh ? '下载报告' : 'Download the report'}</span><small>{zh ? 'PDF · 商业分析报告' : 'PDF · business analytics report'}</small></div><Download size={18} /></a>
        <a className="end-card" href="#pipeline"><div><span>{zh ? '数据处理流程' : 'Data pipeline'}</span><small>{zh ? '56 个步骤、前后数据与 R 源码' : '56 steps, before/after rows and R source'}</small></div><ArrowUpRight size={18} /></a>
        <a className="end-card" href="#sources"><div><span>{zh ? '来源与方法' : 'Sources & method'}</span><small>{zh ? '四个来源、连接规则与时间口径' : 'Four sources, linking rule and dates'}</small></div><ArrowUpRight size={18} /></a>
      </div>
      <a className="replay" href={hashFor('opening')}><RotateCcw size={15} />{zh ? '从开头再看一遍' : 'Replay from the opening'}</a>
    </div>
  </section>;
}

const sections = [Opening, Gap, Sample, Method, Nutrition, Environment, Joint, Answer];

export default function Story({ index }: { index: number }) {
  const current = Math.min(Math.max(index, 0), sections.length - 1);
  const Section = sections[current];
  useEffect(() => { window.scrollTo(0, 0); }, [current]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowRight' && current < sections.length - 1) location.hash = hashFor(storySlugs[current + 1]);
      if (event.key === 'ArrowLeft' && current > 0) location.hash = hashFor(storySlugs[current - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current]);
  return <>
    <Rail current={current} />
    <main id="main-content" className="story-main" tabIndex={-1}>
      <Section />
      <Pager current={current} />
      <StoryFoot />
    </main>
  </>;
}

function StoryFoot() {
  const { language } = useI18n();
  return <div className="story-foot">
    <span>Food / Signal</span>
    <span>{language === 'zh' ? '法国 · 2024–2025 年报价' : 'France · 2024–2025 price quotes'}</span>
    <span>R for Data Science</span>
  </div>;
}
