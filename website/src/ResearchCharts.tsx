import { useI18n } from './i18n';
import { environmentGrades, gradeLabel, jitter, logDomain, logTicks, productName } from './dashboardModel';
import type { Box, Carbon, Product, Sensitivity } from './dashboardModel';

const W = 560, H = 330, L = 57, R = 20, T = 25, B = 55;
export const fmt = (v: number | null, digits = 2) => v === null || !Number.isFinite(v) ? '—' : Number(v.toFixed(digits)).toString();
const linear = (v: number, lo: number, hi: number, start: number, end: number) => start + (v - lo) / (hi - lo || 1) * (end - start);
const logScale = (v: number, d: [number, number], start: number, end: number) => linear(Math.log10(v), Math.log10(d[0]), Math.log10(d[1]), start, end);

export function BoxPlot({ products, boxes, grades, dimension }: { products: Product[]; boxes: Box[]; grades: string[]; dimension: 'all' | 'nutrition' | 'environment' }) {
  const { language } = useI18n();
  const width = dimension === 'all' ? 280 : W;
  const field = dimension === 'nutrition' ? 'nutri_grade' : 'environment_grade';
  const d = dimension === 'all' ? products : products.filter(p => p[field] !== null);
  const domain = logDomain(d.map(p => p.representative_price));
  const y = (v: number) => logScale(v, domain, H - B, T);
  const step = (width - L - R) / grades.length;
  const x = (index: number) => L + step * (index + .5);
  const unit = products[0].target_unit;
  return <svg className="research-svg" viewBox={`0 0 ${width} ${H}`} role="img" aria-label={language === 'zh' ? '对数价格箱线图，叠加每款商品的真实价格点' : 'Log-price boxplot with individual product prices'}>
    <text x={L} y={14} className="plot-unit">EUR/{unit} · log₁₀</text>
    {logTicks(domain).map(v => <g key={v}><line className="plot-grid" x1={L} x2={width - R} y1={y(v)} y2={y(v)}/><text x={L - 12} y={y(v) + 5} textAnchor="end">{fmt(v)}</text></g>)}
    {grades.map((grade, i) => {
      const box = boxes.find(b => b.grade === grade);
      const width = Math.min(step * .48, 105);
      return <g key={grade}>{box && <g className="plot-box"><title>{`${gradeLabel(grade)} · n=${box.n} · Q1=${fmt(box.q1)} · median=${fmt(box.middle)} · Q3=${fmt(box.q3)} EUR/${unit}`}</title><line x1={x(i)} x2={x(i)} y1={y(box.lower)} y2={y(box.upper)}/><line x1={x(i) - width / 4} x2={x(i) + width / 4} y1={y(box.lower)} y2={y(box.lower)}/><line x1={x(i) - width / 4} x2={x(i) + width / 4} y1={y(box.upper)} y2={y(box.upper)}/><rect x={x(i) - width / 2} y={y(box.q3)} width={width} height={Math.max(.8, y(box.q1) - y(box.q3))}/><line className="plot-median" x1={x(i) - width / 2} x2={x(i) + width / 2} y1={y(box.middle)} y2={y(box.middle)}/></g>}
        <text x={x(i)} y={H - B + 25} textAnchor="middle">{dimension === 'all' ? language === 'zh' ? '商品' : 'Products' : gradeLabel(grade)}</text><text className="plot-count" x={x(i)} y={H - B + 47} textAnchor="middle">n={box?.n ?? 0}</text>
      </g>;
    })}
    {d.map(p => { const index = dimension === 'all' ? 0 : grades.indexOf(p[field]!); return <circle className="plot-product" key={p.code} cx={x(index) + jitter(p.code) * step * .38} cy={y(p.representative_price)} r={3}><title>{`${productName(p)} · ${p.code} · €${p.representative_price.toFixed(2)}/${unit}`}</title></circle>; })}
  </svg>;
}

export function SugarPlot({ products }: { products: Product[] }) {
  const { language } = useI18n();
  const d = products.filter(p => p.sugars_100g !== null);
  const domain = logDomain(d.map(p => p.representative_price));
  const ymax = Math.ceil(Math.max(...d.map(p => p.sugars_100g!), 1) * 1.07 / 5) * 5;
  const x = (v: number) => logScale(v, domain, L, W - R), y = (v: number) => linear(v, 0, ymax, H - B, T);
  const unit = products[0].target_unit;
  return <svg className="research-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={language === 'zh' ? '价格与糖含量散点图，价格采用对数坐标' : 'Price–sugar scatterplot with log price axis'}>
    <text x={L} y={14} className="plot-unit">{language === 'zh' ? '糖' : 'Sugars'} · g / 100 {unit === 'L' ? 'ml' : 'g'}</text>
    {[0, .25, .5, .75, 1].map(f => <g key={f}><line className="plot-grid" x1={L} x2={W - R} y1={y(f * ymax)} y2={y(f * ymax)}/><text x={L - 12} y={y(f * ymax) + 5} textAnchor="end">{fmt(f * ymax, 1)}</text></g>)}
    {logTicks(domain).map(v => <text key={v} x={x(v)} y={H - B + 25} textAnchor="middle">{fmt(v)}</text>)}
    <text x={(L + W - R) / 2} y={H - 5} textAnchor="middle" className="plot-unit">EUR/{unit} · log₁₀</text>
    {d.map(p => <circle key={p.code} className="plot-product sugar-point" cx={x(p.representative_price)} cy={y(p.sugars_100g!)} r={3.7}><title>{`${productName(p)} · €${p.representative_price.toFixed(2)}/${unit} · ${fmt(p.sugars_100g)} g / 100 ${unit === 'L' ? 'ml' : 'g'}`}</title></circle>)}
  </svg>;
}

export function CarbonPlot({ references, unit }: { references: Carbon[]; unit: string }) {
  const { language } = useI18n();
  const raw = logDomain(references.map(r => r.median_price));
  const padding = (Math.log10(raw[1]) - Math.log10(raw[0])) * .12;
  const domain: [number, number] = [raw[0] / 10 ** padding, raw[1] * 10 ** padding];
  const max = Math.max(...references.map(r => r.co2_total), 1), ymax = max * 1.18;
  const x = (v: number) => logScale(v, domain, L, W - R), y = (v: number) => linear(v, -max * .16, ymax, H - B, T);
  return <svg className="research-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={language === 'zh' ? '食品参考项价格与碳估算气泡图，气泡面积表示商品数' : 'Reference-level price and carbon bubbles, area proportional to mapped products'}>
    <text x={L} y={14} className="plot-unit">kg CO₂e / kg {language === 'zh' ? '食品' : 'food'}</text>
    {[0, .25, .5, .75, 1].map(f => <g key={f}><line className="plot-grid" x1={L} x2={W - R} y1={y(f * max)} y2={y(f * max)}/><text x={L - 12} y={y(f * max) + 5} textAnchor="end">{fmt(f * max, 1)}</text></g>)}
    {logTicks(domain).map(v => <text key={v} x={x(v)} y={H - B + 25} textAnchor="middle">{fmt(v)}</text>)}
    <text x={(L + W - R) / 2} y={H - 5} textAnchor="middle" className="plot-unit">{language === 'zh' ? '参考项内价格中位数' : 'Median mapped-product price'} · EUR/{unit} · log₁₀</text>
    {[...references].sort((a, b) => b.n_products - a.n_products).map((r, i) => <circle key={i} className="plot-bubble" cx={x(r.median_price)} cy={y(r.co2_total)} r={3.5 * Math.sqrt(r.n_products)}><title>{`${r.agribalyse_name} · n=${r.n_products} · €${r.median_price.toFixed(2)}/${unit} · ${fmt(r.co2_total)} kg CO₂e/kg`}</title></circle>)}
  </svg>;
}

const scenarios = [
  ['keep_duplicate_quotes', 'Keep duplicate quotes', '保留重复报价'],
  ['include_discounts', 'Include discounts', '纳入折扣报价'],
  ['at_least_two_offers', 'At least two offers', '至少两条常规报价'],
  ['year_2024', '2024 prices', '2024 年价格'], ['year_2025', '2025 prices', '2025 年价格'],
  ['per_100_kcal', 'Price per 100 kcal', '每 100 kcal 价格'],
] as const;
export const scenarioLabel = (key: string, language: string) => { const row = scenarios.find(r => r[0] === key); return row ? row[language === 'zh' ? 2 : 1] : key; };
export function SensitivityPlot({ rows }: { rows: Sensitivity[] }) {
  const { language } = useI18n();
  const width = 620, height = 345, left = 183, right = 64, top = 26, bottom = 42;
  const x = (v: number) => linear(v, -1, 1, left, width - right);
  const y = (i: number) => top + i * 48;
  return <svg className="research-svg sensitivity-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={language === 'zh' ? '相同商品的主价格与替代价格相关系数连点图' : 'Connected correlations for main and alternative prices on identical products'}>
    {[-1, -.5, 0, .5, 1].map(v => <g key={v}><line className={v === 0 ? 'plot-zero' : 'plot-grid'} x1={x(v)} x2={x(v)} y1={10} y2={height - bottom}/><text x={x(v)} y={height - 18} textAnchor="middle">{fmt(v, 1)}</text></g>)}
    {scenarios.map(([key], i) => { const row = rows.find(r => r.scenario === key); return <g key={key}><text x={left - 15} y={y(i) + 5} textAnchor="end">{scenarioLabel(key, language)}</text>{row && <><text className="plot-count" x={width - right + 14} y={y(i) + 5}>n={row.n}</text>{row.rho_main_same_goods !== null && row.rho_variant !== null ? <g><title>{`${scenarioLabel(key, language)} · n=${row.n} · ${fmt(row.rho_main_same_goods, 4)} → ${fmt(row.rho_variant, 4)}`}</title><line className="plot-connection" x1={x(row.rho_main_same_goods)} x2={x(row.rho_variant)} y1={y(i)} y2={y(i)}/><circle className="plot-main-coefficient" cx={x(row.rho_main_same_goods)} cy={y(i)} r={5.5}/><circle className="plot-alternative-coefficient" cx={x(row.rho_variant)} cy={y(i)} r={3.8}/></g> : <text x={x(0)} y={y(i) + 5} textAnchor="middle">—</text>}</>}</g>; })}
    <text x={(left + width - right) / 2} y={height - 1} textAnchor="middle" className="plot-unit">Spearman ρ</text>
  </svg>;
}
export const jointFill = (ratio: number) => {
  const log = Math.max(-1.5, Math.min(1.5, Math.log2(ratio))) / 1.5;
  const opacity = .16 + Math.abs(log) * .68;
  return log < 0 ? `rgba(79, 130, 114, ${opacity})` : log > 0 ? `rgba(198, 109, 66, ${opacity})` : '#f5f0df';
};
export const envLabel = (index: number) => gradeLabel(environmentGrades[index]);
