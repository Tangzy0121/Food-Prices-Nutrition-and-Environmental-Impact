import { useCallback, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { ScanLine, RotateCcw, ZoomIn } from 'lucide-react';
import { useI18n } from './i18n';
import { environmentGrades, fmt, gradeLabel, nutrientFields, nutritionGrades, productName, quantile, unitPrice } from './dashboardModel';
import type { Product } from './dashboardModel';
import { IconButton, spreadPlotOffsets, useChartWidth } from './DashboardVisuals';

const gradeMetrics = [
  ['nutri_grade', 'Nutrition grade', '营养等级', nutritionGrades],
  ['environment_grade', 'Environmental grade', '环境等级', environmentGrades],
] as const;
const numericMetrics = [['nutri_score', 'Nutrition score', '营养分数', ''], ...nutrientFields] as const;
export type MarketMetric = typeof gradeMetrics[number][0] | typeof numericMetrics[number][0];
export type PriceRange = [number, number];
const orderedRange = (a: number, b: number): PriceRange => [Math.min(a, b), Math.max(a, b)];
const inRange = (value: number, [lo, hi]: PriceRange) => value >= lo && value <= hi;
const chartStep = (span: number, divisions: number) => {
  const target = span / divisions;
  const base = 10 ** Math.floor(Math.log10(target));
  return ([1, 2, 5, 10].find(value => value * base >= target) ?? 10) * base;
};

export default function MarketplacePlot({ scope, products, selected, metric, onMetric, zoom, onZoom, onSelect }: {
  scope: Product[]; products: Product[]; selected?: Product;
  metric: MarketMetric; onMetric: (metric: MarketMetric) => void;
  zoom?: PriceRange; onZoom: (range?: PriceRange) => void; onSelect: (product: Product) => void;
}) {
  const { language } = useI18n();
  const l = (en: string, zh: string) => language === 'zh' ? zh : en;
  const { ref, width } = useChartWidth();
  const [hover, setHover] = useState<string>();
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draft, setDraft] = useState<[string, string]>(['', '']);
  const [drag, setDrag] = useState<PriceRange>();
  const dragStart = useRef<number | null>(null);
  const rangeButton = useRef<HTMLButtonElement>(null);
  const unit = scope[0]?.target_unit ?? 'kg';
  const prices = scope.map(product => product.representative_price);
  const max = Math.max(1, ...prices);
  const step = chartStep(max, width < 510 ? 4 : 7);
  const maxAxis = Math.ceil(max / step) * step;
  const domain = zoom ?? [0, maxAxis];
  const [minPrice, maxPrice] = domain;
  const span = maxPrice - minPrice;
  const left = 48, right = width - 20, histTop = 10, histBottom = 59, top = 87;
  const x = useCallback((price: number) => left + (price - minPrice) / span * (right - left), [left, minPrice, right, span]);
  const [q1, centre, q3] = [.25, .5, .75].map(p => quantile(prices, p));
  const bins = Array.from({ length: width < 510 ? 15 : 24 }, () => 0);
  for (const price of prices.filter(price => inRange(price, domain))) {
    const index = Math.floor((price - domain[0]) / span * bins.length);
    bins[Math.min(bins.length - 1, index)]++;
  }
  const maxBin = Math.max(1, ...bins);
  const grade = gradeMetrics.find(field => field[0] === metric);
  const numeric = numericMetrics.find(field => field[0] === metric);
  const grades = [...(grade?.[3] ?? []), 'unknown'];
  const rowHeight = width < 510 ? 30 : 36;
  const bottom = top + (grade ? grades.length * rowHeight : 188), height = bottom + 46;
  const offsets = useMemo(() => grade
    ? spreadPlotOffsets(scope.filter(product => inRange(product.representative_price, [minPrice, maxPrice])).map(product => ({
      code: product.code, group: product[grade[0]] ?? 'unknown', x: x(product.representative_price),
    })), rowHeight)
    : undefined, [grade, maxPrice, minPrice, rowHeight, scope, x]);
  const values = numeric ? scope.map(p => p[numeric[0]]).filter(value => value !== null) : [];
  const valueMin = Math.min(0, ...values), valueMax = Math.max(1, ...values);
  const yStep = chartStep(valueMax - valueMin, 4);
  const yMin = Math.floor(valueMin / yStep) * yStep, yMax = Math.ceil(valueMax / yStep) * yStep;
  const yValue = (value: number) => bottom - (value - yMin) / (yMax - yMin) * (bottom - top);
  const y = (product: Product) => grade
    ? top + (grades.indexOf(product[grade[0]] ?? 'unknown') + .5) * rowHeight + (offsets?.get(product.code) ?? 0)
    : yValue(numeric ? product[numeric[0]]! : 0);
  const valid = numeric ? products.filter(product => product[numeric[0]] !== null) : products;
  const points = valid.filter(product => inRange(product.representative_price, domain))
    .sort((a, b) => y(a) - y(b) || a.representative_price - b.representative_price);
  const hovered = points.find(p => p.code === hover);
  const tabCode = points.some(p => p.code === selected?.code) ? selected?.code : points[0]?.code;
  const drawOrder = [...points.filter(p => p.code !== selected?.code), ...points.filter(p => p.code === selected?.code)];
  const zoomDivisions = width < 510 ? 3 : 5;
  const axisTicks = zoom
    ? Array.from({ length: zoomDivisions + 1 }, (_, i) => domain[0] + i * span / zoomDivisions)
    : Array.from({ length: Math.round(maxAxis / step) + 1 }, (_, i) => i * step);
  const field = grade ?? numeric!;
  const nutrientUnit = numeric?.[3] ? numeric[3] + (unit === 'L' ? ' / 100 ml' : ' / 100 g') : '';
  const metricLabel = l(field[1], field[2]);
  const rangeLo = Number(draft[0]), rangeHi = Number(draft[1]);
  const validDraft = draft[0] !== '' && draft[1] !== '' && rangeLo >= 0 &&
    rangeHi <= maxAxis && rangeHi - rangeLo >= .01 - 1e-9;
  const marked = drag ?? (validDraft ? [rangeLo, rangeHi] as PriceRange : undefined);
  const markedProducts = marked ? valid.filter(product => inRange(product.representative_price, marked)) : [];
  const bandLo = Math.max(q1, domain[0]), bandHi = Math.min(q3, domain[1]);
  const typical: PriceRange = [
    Math.floor(quantile(prices, .05) * 100) / 100,
    Math.ceil(quantile(prices, .95) * 100) / 100,
  ];
  const canFocusTypical = prices.length >= 10 && typical[1] - typical[0] >= .01;
  const typicalActive = zoom?.[0] === typical[0] && zoom?.[1] === typical[1];

  function priceAt(event: PointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width * width;
    const ratio = Math.min(1, Math.max(0, (position - left) / (right - left)));
    return domain[0] + ratio * span;
  }

  function closeRange() {
    dragStart.current = null;
    setRangeOpen(false);
    setDraft(['', '']);
    setDrag(undefined);
  }

  return <>
    <div className="dash-plot-tools" onKeyDown={event => {
      if (event.key === 'Escape' && rangeOpen) { closeRange(); rangeButton.current?.focus(); }
    }}>
      <label className="dash-field dash-chart-metric"><span>{l('Plot against price', '价格对照指标')}</span>
        <select aria-label={l('Plot against price', '价格对照指标')} value={metric} onChange={e => { setHover(undefined); onMetric(e.target.value as MarketMetric); }}>
          {[...gradeMetrics, ...numericMetrics].map(([id, en, zh]) => <option key={id} value={id}>{l(en, zh)}</option>)}
        </select>
      </label>
      <div className="dash-view-tools">
        {canFocusTypical && <button type="button" className="dash-button" aria-pressed={typicalActive}
          title={l('Zoom to roughly the middle 90% of scope prices', '缩放到当前食品范围内约中间 90% 的价格')}
          onClick={() => { closeRange(); onZoom(typicalActive ? undefined : typical); }}>
          <ZoomIn size={15}/>{l('Typical prices', '常见价位')}
        </button>}
        <IconButton ref={rangeButton} icon={ScanLine} label={l('Price range', '框选价格')}
          aria-expanded={rangeOpen} aria-controls={rangeOpen ? 'dash-price-range' : undefined}
          onClick={() => { if (rangeOpen) closeRange(); else setRangeOpen(true); }}/>
        {zoom && <IconButton icon={RotateCcw} label={l('Reset zoom', '重置缩放')}
          onClick={() => { onZoom(); closeRange(); rangeButton.current?.focus(); }}/>}
      </div>
    </div>
    {rangeOpen && <div className="dash-range" id="dash-price-range" onKeyDown={event => {
      if (event.key === 'Escape') { closeRange(); rangeButton.current?.focus(); }
    }}>
      <p>{l('Drag across the chart or enter a range. Zoom changes the chart only.', '在图上拖选，或输入价格区间。缩放只影响图表。')}</p>
      <form onSubmit={event => {
        event.preventDefault();
        if (!validDraft) return;
        onZoom([rangeLo, rangeHi]);
        closeRange();
        rangeButton.current?.focus();
      }}>
        <label className="dash-field"><span>{l('From', '最低')} · €/{unit}</span><input aria-label={l('Zoom minimum', '缩放最低价')} type="number" min="0" max={maxAxis} step="any" inputMode="decimal" value={draft[0]}
          onChange={e => setDraft([e.target.value, draft[1]])}/></label>
        <label className="dash-field"><span>{l('To', '最高')} · €/{unit}</span><input aria-label={l('Zoom maximum', '缩放最高价')} type="number" min="0" max={maxAxis} step="any" inputMode="decimal" value={draft[1]}
          onChange={e => setDraft([draft[0], e.target.value])}/></label>
        <button className="dash-button" type="submit" disabled={!validDraft}>{l('Zoom to range', '放大区间')}</button>
      </form>
      {marked && <p className="dash-range-result" role="status" data-selection-size={markedProducts.length}>
        {l('In range', '框选范围内')} · {markedProducts.length} {l('products', '款')}
        {markedProducts.length > 0 && <> · {l('Median', '中位价')} {unitPrice(quantile(markedProducts.map(p => p.representative_price), .5), unit)}</>}
      </p>}
    </div>}
    <div className="dash-plot" ref={ref}>
      <svg viewBox={`0 0 ${width} ${height}`} className="dash-svg" data-chart="marketplace" data-zoomed={Boolean(zoom)} role="group"
        aria-label={l('Historical unit prices and ' + metricLabel + '. Use arrow keys to browse products.', '历史单位价格与' + metricLabel + '。可用方向键浏览商品。')}>
        <text x={left} y={9} className="dash-axis-head">{l('Price distribution · before filters', '价格分布 · 该类全部商品')}</text>
        {bandHi > bandLo && <rect x={x(bandLo)} y={histTop + 5} width={x(bandHi) - x(bandLo)} height={histBottom - histTop - 5} className="dash-price-band"/>}
        {bins.map((count, i) => {
          const binWidth = (right - left) / bins.length;
          const h = count * 38 / maxBin;
          return <rect key={i} className="dash-hist-bar" x={left + i * binWidth + 1} y={histBottom - h} width={Math.max(1, binWidth - 2)} height={h} rx={1}>
            <title>{fmt(domain[0] + i * span / bins.length)}–{fmt(domain[0] + (i + 1) * span / bins.length)} €/{unit} · {count}</title>
          </rect>;
        })}
        {inRange(centre, domain) && <line x1={x(centre)} x2={x(centre)} y1={histTop + 5} y2={histBottom} className="dash-median-line">
          <title>{l('Median', '中位数')} · {unitPrice(centre, unit)}</title>
        </line>}
        <text x={left} y={74} className="dash-axis-head">{metricLabel}{nutrientUnit ? ' · ' + nutrientUnit : ''}
          {metric === 'nutri_score' ? l(' · lower is better', ' · 越低越好') : ''}</text>
        {grade ? grades.map((value, i) => <g key={value}>
          <rect className={i % 2 ? 'dash-plot-band alt' : 'dash-plot-band'} x={left} y={top + i * rowHeight} width={right - left} height={rowHeight}/>
          <line x1={left} x2={right} y1={top + (i + 1) * rowHeight} y2={top + (i + 1) * rowHeight} className="dash-gridline"/>
          <text x={left - 11} y={top + (i + .5) * rowHeight + 4} textAnchor="end" className="dash-grade-axis">{value === 'unknown' ? '—' : gradeLabel(value)}</text>
        </g>) : Array.from({ length: Math.round((yMax - yMin) / yStep) + 1 }, (_, i) => yMin + i * yStep).map(value => <g key={value}>
          <line className="dash-gridline" x1={left} x2={right} y1={yValue(value)} y2={yValue(value)}/>
          <text className="dash-grade-axis" x={left - 9} y={yValue(value) + 4} textAnchor="end">{fmt(value)}</text>
        </g>)}
        {axisTicks.map(tick => <g key={tick}>
          <line className="dash-gridline" x1={x(tick)} x2={x(tick)} y1={top} y2={bottom}/>
          <text className="dash-axis-text" x={x(tick)} y={bottom + 18} textAnchor="middle">{fmt(tick)}</text>
        </g>)}
        <text className="dash-axis-head" x={(left + right) / 2} y={bottom + 39} textAnchor="middle">{l('Historical unit price', '历史单位价格')} · €/{unit}</text>
        {inRange(centre, domain) && <line className="dash-median-guide" x1={x(centre)} x2={x(centre)} y1={top} y2={bottom}/>}
        {rangeOpen && marked && inRange(marked[0], [0, domain[1]]) && marked[1] >= domain[0] &&
          <rect className="dash-brush-fill" x={x(Math.max(domain[0], marked[0]))} y={top}
            width={Math.max(0, x(Math.min(marked[1], domain[1])) - x(Math.max(marked[0], domain[0])))} height={bottom - top}/>}
        {drawOrder.map(product => {
          const active = product.code === selected?.code;
          const cx = x(product.representative_price), cy = y(product);
          const pointLabel = [productName(product), unitPrice(product.representative_price, unit),
            l('Nutrition', '营养') + ' ' + gradeLabel(product.nutri_grade), l('Environment', '环境') + ' ' + gradeLabel(product.environment_grade)].join(' · ');
          return <g key={product.code} id={`market-point-${product.code}`} role="button" data-point={product.code}
            tabIndex={!rangeOpen && product.code === tabCode ? 0 : -1}
            aria-label={pointLabel} aria-pressed={active}
            onMouseEnter={() => setHover(product.code)} onMouseLeave={() => setHover(undefined)}
            onBlur={() => setHover(undefined)} onFocus={() => setHover(product.code)}
            onClick={() => onSelect(product)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(product); return; }
              if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const index = points.indexOf(product);
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 :
                (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + points.length) % points.length;
              document.getElementById(`market-point-${points[next].code}`)?.focus();
            }}>
            <circle cx={cx} cy={cy} r={8} fill="transparent"/>
            {active && <circle className="dash-point-ring" cx={cx} cy={cy} r={8}/>}
            <circle className={active ? 'dash-point is-selected' : 'dash-point'} cx={cx} cy={cy} r={active ? 4.8 : 3.9}/>
          </g>;
        })}
        {rangeOpen && <rect className="dash-brush-target" data-brush-target="true" x={left} y={top} width={right - left} height={bottom - top}
          onPointerDown={event => {
            if (event.button !== 0 || !event.isPrimary) return;
            const start = priceAt(event);
            dragStart.current = start;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDrag([start, start]);
          }}
          onPointerMove={event => { if (dragStart.current !== null) setDrag(orderedRange(dragStart.current, priceAt(event))); }}
          onPointerUp={event => {
            if (dragStart.current === null) return;
            const [lo, hi] = orderedRange(dragStart.current, priceAt(event));
            if (hi - lo > span * .01) setDraft([String(Math.floor(lo * 100) / 100), String(Math.min(maxAxis, Math.ceil(hi * 100) / 100))]);
            dragStart.current = null;
            setDrag(undefined);
          }}
          onPointerCancel={() => { dragStart.current = null; setDrag(undefined); }}/>}
      </svg>
      {!points.length && <p className="dash-chart-empty" role="status">{!products.length
        ? l('No products match. Adjust or clear the filters.', '没有符合条件的商品，请调整或清除筛选。')
        : !valid.length ? l('The matching products are missing this measure.', '符合筛选的商品缺少此指标。')
          : l('No matching products fall in this price range.', '图示价位内没有符合筛选的商品。')}</p>}
      {!rangeOpen && hovered && <div className="dash-tooltip" style={{
        left: Math.max(0, Math.min(width - 205, x(hovered.representative_price) - 72)), top: Math.max(5, y(hovered) - 62),
      }}>
        <strong>{productName(hovered)}</strong>
        <span>{unitPrice(hovered.representative_price, unit)} · {l('Nutrition', '营养')} {gradeLabel(hovered.nutri_grade)} · {l('Env.', '环境')} {gradeLabel(hovered.environment_grade)}</span>
        {numeric && <span>{metricLabel} · {fmt(hovered[numeric[0]])} {nutrientUnit}</span>}
      </div>}
    </div>
    {(numeric || zoom) && <p className="dash-plot-count" role="status" data-visible-points={points.length}>
      {l('Plotted', '图中显示')} {points.length} / {products.length} {l('matching products', '款符合筛选的商品')}
      {numeric && valid.length !== products.length && <> · {products.length - valid.length} {l('missing this measure', '款缺少此指标')}</>}
      {zoom && <> · {valid.length - points.length} {l('outside this price range', '款在图示价位之外')}</>}
    </p>}
  </>;
}
