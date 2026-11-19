import { useId } from 'react';
import type { PointerEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { useI18n } from './i18n';
import { fmt, unitPrice } from './dashboardModel';
import type { PriceRange } from './DashboardMarketChart';
import { IconButton } from './DashboardVisuals';

export default function DashboardPriceRange({ prices, range, median, unit, onChange }: {
  prices: number[]; range?: PriceRange; median: number; unit: string; onChange: (range?: PriceRange) => void;
}) {
  const { language } = useI18n();
  const l = (en: string, zh: string) => language === 'zh' ? zh : en;
  const id = useId();
  const lower = Math.floor(Math.min(...prices) * 100) / 100;
  const upper = Math.max(lower + .01, Math.ceil(Math.max(...prices) * 100) / 100);
  const [from, to] = range ?? [lower, upper];
  const span = upper - lower;
  const x = (price: number) => (price - lower) / span * 1000;
  const bins = Array.from({ length: prices.length <= 14 ? 12 : 28 }, () => 0);
  for (const price of prices) bins[Math.min(bins.length - 1, Math.floor(x(price) / 1000 * bins.length))]++;
  const peak = Math.max(1, ...bins);
  const count = prices.filter(price => price >= from && price <= to).length;
  const tickValues = Array.from({ length: 5 }, (_, i) => lower + i * span / 4);
  const medianBound = Math.floor(median * 100 + 1e-8) / 100;
  const atMedian = from === lower && to === medianBound;

  function moveEnd(index: 0 | 1, value: number) {
    const next: PriceRange = index === 0 ? [Math.min(value, to), to] : [from, Math.max(value, from)];
    onChange(next[0] === lower && next[1] === upper ? undefined : next);
  }

  function selectNearest(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const price = Math.round(100 * (lower + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * span)) / 100;
    moveEnd(Math.abs(price - from) <= Math.abs(price - to) ? 0 : 1, price);
  }

  return <section className="dash-price-card" aria-labelledby={id + '-heading'}>
    <div className="dash-price-head">
      <div><h2 id={id + '-heading'}>{l('Select a price range', '选择价格区间')}</h2>
        <p>{l('Drag either end to set the range.', '拖动左右端点，设置最低价和最高价。')}</p></div>
      <div className="dash-range-count" role="status"><strong>{count} / {prices.length}</strong> {l('products in range', '款商品在区间内')}</div>
    </div>
    <div className="dash-budget-plot" data-close-range={(to - from) / span < .018}>
      <div className="dash-budget-chart">
        <svg viewBox="0 0 1000 96" preserveAspectRatio="none" aria-hidden="true" onPointerDown={selectNearest}>
          <defs><clipPath id={id + '-range'}><rect x={x(from)} width={Math.max(0, x(to) - x(from))} y="0" height="96"/></clipPath></defs>
          <rect x={x(from)} width={Math.max(0, x(to) - x(from))} y="0" height="96" fill="#e7efe3"/>
          {[false, true].map(active => <g key={String(active)} clipPath={active ? 'url(#' + id + '-range)' : undefined}
            className={active ? 'dash-budget-bars active' : 'dash-budget-bars'}>
            {bins.map((count, i) => {
              const step = 1000 / bins.length, height = count / peak * 84;
              return <rect key={i} x={i * step + 2} y={95 - height} width={step - 4} height={height} rx="2"/>;
            })}
          </g>)}
          <line className="dash-budget-median" x1={x(median)} x2={x(median)} y1="0" y2="96" vectorEffect="non-scaling-stroke"/>
        </svg>
        <div className="dash-budget-track" aria-hidden="true">
          <i style={{ left: x(from) / 10 + '%', width: (x(to) - x(from)) / 10 + '%' }}/>
        </div>
        <div className="dash-budget-handles">
          <input type="range" min={lower} max={upper} step="0.01" value={from}
            aria-label={l('Minimum unit price', '最低单位价格')} aria-valuetext={unitPrice(from, unit)}
            style={{ zIndex: from === upper ? 2 : 1 }} onChange={event => moveEnd(0, Number(event.target.value))}/>
          <input type="range" min={lower} max={upper} step="0.01" value={to}
            aria-label={l('Maximum unit price', '最高单位价格')} aria-valuetext={unitPrice(to, unit)}
            style={{ zIndex: from === upper ? 1 : 2 }} onChange={event => moveEnd(1, Number(event.target.value))}/>
        </div>
      </div>
      <div className="dash-budget-ticks" aria-hidden="true">{tickValues.map((price, i) => <span key={i}>{fmt(price, 1)}</span>)}</div>
    </div>
    <div className="dash-price-foot">
      <span><strong>€{from.toFixed(2)}–{to.toFixed(2)}/{unit}</strong><small>{l('Historical unit price', '历史单位价格')}</small></span>
      <span className="dash-price-median"><i className="dash-key median"/>{l('Median', '中位价')} {unitPrice(median, unit)}</span>
      <div>
        <button type="button" className="dash-button" aria-pressed={atMedian} onClick={() => onChange(atMedian ? undefined : [lower, medianBound])}>
          {l('Up to the median', '不高于中位价')}
        </button>
        {range && <IconButton icon={RotateCcw} label={l('Reset range', '重置价格')} className="dash-clear" onClick={() => onChange()}/>}
      </div>
    </div>
  </section>;
}
