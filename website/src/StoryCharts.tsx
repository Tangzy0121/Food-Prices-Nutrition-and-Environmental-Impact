import { useI18n } from './i18n';
import { categoryLabels, environmentGrades, fmt, gradeLabel, jitter, logDomain, logTicks, median, nutritionGrades, productName } from './dashboardModel';
import type { Category, Product } from './dashboardModel';

/* Grade colours follow the dashboard's grade badges: green at the top of
   both scales, warm red at the bottom. */
const gradeColors: Record<string, string> = { 'a-plus': '#2f7d5b', a: '#2f7d5b', b: '#6a8f42', c: '#b28a2e', d: '#c07a3a', e: '#b4514a', f: '#a2453f' };

/* Correlation rows. Values are oriented so that positive always means
   "a higher price comes with the better grade". */
export type Signal = { category: Category; value: number; n: number };
const DOMAIN = .35;

export function SignalPlot({ rows, unit }: { rows: Signal[]; unit: string }) {
  const { t } = useI18n();
  return <div className="signal-plot">
    <div className="signal-axis" aria-hidden="true"><span /><span className="signal-ticks"><i>−0.3</i><i>0</i><i>+0.3</i></span><span /><span /></div>
    <div className="signal-rows">
      {rows.map(row => {
        const width = Math.min(50, Math.abs(row.value) / DOMAIN * 50);
        return <div className="signal-row" key={row.category}>
          <span className="signal-label">{t(categoryLabels[row.category])}</span>
          <span className="signal-track">
            <span className="signal-zero" aria-hidden="true" />
            <span className={`signal-bar${row.value < 0 ? ' is-negative' : ''}`} style={{ width: `${width}%`, left: row.value < 0 ? `${50 - width}%` : '50%' }} aria-hidden="true" />
          </span>
          <strong className="signal-value">{row.value.toFixed(2)}</strong>
          <span className="signal-n">n={row.n}</span>
        </div>;
      })}
    </div>
    <p className="signal-foot">{unit}</p>
  </div>;
}

/* Price thirds against the median of one composition measure. Every dot is
   a product; the line joins the median of each price third. */
export function TrendPlot({ products, metric, colour, label, unit }: { products: Product[]; metric: 'sugars_100g' | 'saturated_fat_100g' | 'fiber_100g'; colour: string; label: string; unit: string }) {
  const { language } = useI18n();
  const W = 340, H = 230, L = 40, R = 12, T = 16, B = 38;
  const rows = products.filter(p => p[metric] !== null).sort((a, b) => a.representative_price - b.representative_price);
  const domain = logDomain(rows.map(p => p.representative_price));
  const max = Math.max(...rows.map(p => p[metric]!), 1) * 1.15;
  const x = (v: number) => L + (Math.log10(v) - Math.log10(domain[0])) / (Math.log10(domain[1]) - Math.log10(domain[0])) * (W - L - R);
  const y = (v: number) => H - B - v / max * (H - B - T);
  const third = Math.ceil(rows.length / 3);
  const medians = [0, 1, 2].map(i => {
    const slice = rows.slice(i * third, (i + 1) * third);
    return slice.length ? { price: median(slice.map(p => p.representative_price)), value: median(slice.map(p => p[metric]!)) } : null;
  }).filter(Boolean) as { price: number; value: number }[];
  return <figure className="trend-plot">
    <figcaption><strong>{label}</strong><span>{unit}</span></figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={language === 'zh' ? `价格与${label}的关系，折线为价格三分位的中位数` : `Price against ${label}; the line joins the median of each price third`}>
      {[0, .5, 1].map(f => <g key={f}><line className="plot-grid" x1={L} x2={W - R} y1={y(f * max)} y2={y(f * max)} /><text x={L - 6} y={y(f * max) + 4} textAnchor="end">{(f * max).toFixed(0)}</text></g>)}
      {logTicks(domain).map(v => <text key={v} x={x(v)} y={H - B + 16} textAnchor="middle">{fmt(v, 0)}</text>)}
      {rows.map(p => <circle key={p.code} cx={x(p.representative_price)} cy={y(p[metric]!)} r={2.6} fill={colour} opacity={.34} />)}
      <polyline points={medians.map(m => `${x(m.price)},${y(m.value)}`).join(' ')} fill="none" stroke={colour} strokeWidth={2.4} strokeLinecap="round" />
      {medians.map((m, i) => <circle key={i} cx={x(m.price)} cy={y(m.value)} r={5} fill={colour} stroke="#fff" strokeWidth={2} />)}
    </svg>
  </figure>;
}

/* Joint view with a working budget: environment on x, price on y,
   nutrition as colour. Products above the budget fade out. */
export function JointBudget({ products, category, ceiling, onSelect }: { products: Product[]; category: Category; ceiling: number; onSelect: (p: Product) => void }) {
  const { language, t } = useI18n();
  const W = 1000, H = 400, L = 66, R = 26, T = 22, B = 48;
  const domain = logDomain(products.map(p => p.representative_price));
  const x = (g: string) => L + 26 + environmentGrades.indexOf(g) / (environmentGrades.length - 1) * (W - L - R - 52);
  const y = (v: number) => T + (Math.log10(domain[1]) - Math.log10(v)) / (Math.log10(domain[1]) - Math.log10(domain[0])) * (H - T - B);
  const visible = products.filter(p => p.category === category && p.nutri_grade && p.environment_grade);
  const ceilingY = y(Math.min(Math.max(ceiling, domain[0]), domain[1]));
  return <svg className="joint-budget" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={language === 'zh' ? '环境等级为横轴、价格为纵轴、颜色为营养等级的联合比较，可设置预算' : 'Environment on x, price on y, nutrition as colour, with a budget line'}>
    {logTicks(domain).map(v => <g key={v}><line className="plot-grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} /><text x={L - 10} y={y(v) + 4} textAnchor="end">{fmt(v, 0)}</text></g>)}
    {environmentGrades.map(g => <g key={g}><line className="plot-grid" x1={x(g)} x2={x(g)} y1={T} y2={H - B} /><text x={x(g)} y={H - B + 20} textAnchor="middle">{gradeLabel(g)}</text></g>)}
    <text x={L - 10} y={16} className="plot-unit">EUR/{products[0]?.target_unit ?? 'kg'} · log₁₀</text>
    <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle">{language === 'zh' ? '环境等级 · 左侧更好' : 'Environmental grade · better to the left'}</text>
    <line className="budget-line" x1={L} x2={W - R} y1={ceilingY} y2={ceilingY} />
    <text className="budget-label" x={W - R} y={ceilingY - 7} textAnchor="end">{language === 'zh' ? '预算' : 'Budget'} €{fmt(ceiling, 0)}</text>
    {visible.map(p => <circle key={p.code} className="joint-point" cx={x(p.environment_grade!) + jitter(p.code) * 22} cy={y(p.representative_price)} r={p.representative_price <= ceiling ? 4.2 : 3.4} fill={gradeColors[p.nutri_grade!]} opacity={p.representative_price <= ceiling ? .85 : .16} tabIndex={0} role="button" aria-label={productName(p)} onClick={() => onSelect(p)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p); } }}>
      <title>{`${productName(p)} · ${t(categoryLabels[p.category])} · €${fmt(p.representative_price)}/${p.target_unit} · ${language === 'zh' ? '营养' : 'Nutrition'} ${gradeLabel(p.nutri_grade)} · ${language === 'zh' ? '环境' : 'Environment'} ${gradeLabel(p.environment_grade)}`}</title>
    </circle>)}
  </svg>;
}

export function GradeLegend() {
  const { language } = useI18n();
  return <div className="grade-legend story-legend">{nutritionGrades.map(g => <span key={g}><i style={{ background: gradeColors[g] }} />{language === 'zh' ? '营养' : 'Nutrition'} {gradeLabel(g)}</span>)}</div>;
}
