import { useId, useState } from 'react';
import { useI18n } from './i18n';
import { gradeChange, productName, signedDifference } from './dashboardModel';
import type { Product } from './dashboardModel';
import { spreadPlotOffsets, useChartWidth } from './DashboardVisuals';

type GradeChange = ReturnType<typeof gradeChange>;
export type ComparisonResult = {
  product: Product;
  priceDelta: number;
  pct: number;
  nutrition: GradeChange;
  environment: GradeChange;
  cheaper: boolean;
  noGradeDrop: boolean;
};

const bands = [
  ['holds', 'Both grades hold', 'or improve', '两项等级持平或更好'],
  ['nutrition', 'Nutrition grade lower', '', '营养等级较差'],
  ['environment', 'Environmental grade', 'lower', '环境等级较差'],
  ['both', 'Both grades lower', '', '两项等级较差'],
  ['unknown', 'Grade data missing', '', '等级资料不全'],
] as const;
type Band = typeof bands[number][0];

function bandOf(row: ComparisonResult): Band {
  if (row.nutrition === 'missing' || row.environment === 'missing') return 'unknown';
  if (row.nutrition === 'worse' && row.environment === 'worse') return 'both';
  if (row.nutrition === 'worse') return 'nutrition';
  if (row.environment === 'worse') return 'environment';
  return 'holds';
}

export default function DashboardComparisonPlot({ rows, priceExtent, selected, onSelect }: {
  rows: ComparisonResult[]; priceExtent: [number, number]; selected: ComparisonResult;
  onSelect: (productCode: string) => void;
}) {
  const { language } = useI18n();
  const l = (en: string, zh: string) => language === 'zh' ? zh : en;
  const { ref, width } = useChartWidth();
  const prefix = useId();
  const [hoveredCode, setHoveredCode] = useState<string>();
  const rangeMin = Math.min(-5, priceExtent[0]);
  const rangeMax = Math.max(5, priceExtent[1]);
  const target = (rangeMax - rangeMin) / (width >= 660 ? 6 : 4);
  const base = 10 ** Math.floor(Math.log10(target));
  const step = ([1, 2, 5, 10].find(value => value * base >= target) ?? 10) * base;
  const minTick = Math.floor(rangeMin / step), maxTick = Math.ceil(rangeMax / step);
  const top = 32, rowHeight = width < 520 ? 55 : 62;
  const left = width < 380 ? 108 : width < 560 ? 147 : 174;
  const right = width - 18;
  const x = (percent: number) => left + (percent / step - minTick) / (maxTick - minTick) * (right - left);
  const zero = x(0);
  const counts = new Map<Band, number>();
  const points = rows.map(row => {
    const band = bandOf(row);
    counts.set(band, (counts.get(band) ?? 0) + 1);
    return { row, band, code: row.product.code, x: x(row.pct) };
  });
  const usedBands = bands.filter(([band]) => counts.has(band));
  const bottom = top + usedBands.length * rowHeight;
  const height = bottom + 54;
  const offsets = spreadPlotOffsets(points.map(point => ({ code: point.code, group: point.band, x: point.x })), rowHeight);
  const bandOrder = new Map(usedBands.map(([band], index) => [band, index]));
  const y = (point: typeof points[number]) => top + (bandOrder.get(point.band)! + .5) * rowHeight + (offsets.get(point.code) ?? 0);
  const keyboardOrder = [...points].sort((a, b) => bandOrder.get(a.band)! - bandOrder.get(b.band)! || a.x - b.x);
  const selectedPoint = points.find(point => point.code === selected.product.code)!;
  const hovered = points.find(point => point.code === hoveredCode);
  const pointId = (code: string) => prefix + '-' + code;
  const pctLabel = (pct: number) => signedDifference(pct, 1) + '%';

  return <div className="dash-relative-chart" ref={ref}>
    <svg className="dash-svg" viewBox={`0 0 ${width} ${height}`} role="group" data-chart="relative-comparisons"
      aria-label={l('Products grouped by grade changes, with relative price as the horizontal axis. Use arrow keys to move among products, then press Enter to select.',
        '按等级变化分组，横轴为相对价差。用方向键浏览商品，回车选中。')}>
      {zero - left >= 68 && <text className="dash-axis-head" x={(left + zero) / 2} y={16} textAnchor="middle">{l('Cheaper', '更便宜')}</text>}
      {right - zero >= (language === 'zh' ? 68 : 136) && <text className="dash-axis-head" x={(right + zero) / 2} y={16} textAnchor="middle">{l('More expensive', '更贵')}</text>}
      <text className="dash-relative-zero-label" x={zero} y={16} textAnchor={zero - left < 47 ? 'start' : right - zero < 47 ? 'end' : 'middle'}>{l('Reference', '参照价')}</text>
      {usedBands.map(([band, en, enExtra, zh], i) => {
        const start = top + rowHeight * i;
        const line1 = language === 'zh' ? zh : en;
        const line2 = language === 'en' && enExtra ? enExtra + ' · ' : '';
        return <g key={band} data-band={band} data-count={counts.get(band)}>
          <rect x={left} y={start} width={right - left} height={rowHeight} className={i % 2 ? 'dash-plot-band alt' : 'dash-plot-band'}/>
          {band === 'holds' && <rect x={left} y={start} width={zero - left} height={rowHeight} className="dash-relative-value-zone"/>}
          <line x1={left} x2={right} y1={start + rowHeight} y2={start + rowHeight} className="dash-gridline"/>
          <text x={4} y={start + rowHeight / 2 - 3} className="dash-relative-band-label">{line1}</text>
          <text x={4} y={start + rowHeight / 2 + 12} className="dash-axis-text">{line2}{counts.get(band)} {l('products', '款')}</text>
        </g>;
      })}
      {Array.from({ length: maxTick - minTick + 1 }, (_, i) => (minTick + i) * step).map(tick => <g key={tick}>
        <line className={tick === 0 ? 'dash-relative-zero' : 'dash-gridline'} x1={x(tick)} x2={x(tick)} y1={tick === 0 ? top - 5 : top} y2={bottom}/>
        <text className={tick === 0 ? 'dash-relative-zero-label' : 'dash-axis-text'} x={x(tick)} y={bottom + 20} textAnchor="middle">
          {signedDifference(tick, Number.isInteger(step) ? 0 : 1)}%
        </text>
      </g>)}
      <text className="dash-axis-head" x={(left + right) / 2} y={bottom + 43} textAnchor="middle">{l('Unit price change vs. reference', '相对参照的单位价差')}</text>
      {points.map(point => {
        const { row, code } = point;
        const isSelected = code === selected.product.code;
        const cx = point.x, cy = y(point);
        const description = bands.find(([band]) => band === point.band)!;
        const bandLabel = l(description[1] + (description[2] ? ' ' + description[2] : ''), description[3]);
        return <g key={code} id={pointId(code)} role="button" data-comparison={code} data-no-grade-drop={row.noGradeDrop}
          data-price-pct={row.pct} data-grade-band={point.band} tabIndex={isSelected ? 0 : -1} aria-pressed={isSelected}
          aria-label={productName(row.product) + ' · ' + pctLabel(row.pct) + ' · ' + bandLabel}
          onMouseEnter={() => setHoveredCode(code)} onMouseLeave={() => setHoveredCode(undefined)}
          onFocus={() => setHoveredCode(code)} onBlur={() => setHoveredCode(undefined)}
          onClick={() => onSelect(code)} onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(code); return; }
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const index = keyboardOrder.indexOf(point);
            const movement = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? keyboardOrder.length - 1 :
              (index + movement + keyboardOrder.length) % keyboardOrder.length;
            document.getElementById(pointId(keyboardOrder[next].code))?.focus();
          }}>
          <circle cx={cx} cy={cy} r={7} fill="transparent"/>
          {row.noGradeDrop ? <path className="dash-relative-mark qualified" d={`M ${cx} ${cy - 5} l 5 5 -5 5 -5 -5 Z`}/> :
            <circle cx={cx} cy={cy} r={4.2} className="dash-relative-mark"/>}
        </g>;
      })}
      <circle cx={selectedPoint.x} cy={y(selectedPoint)} r={8} className="dash-relative-selected"/>
    </svg>
    {hovered && <div className="dash-tooltip" aria-hidden="true" style={{ left: Math.max(0, Math.min(width - 205, hovered.x - 80)), top: Math.max(2, y(hovered) - 55) }}>
      <strong>{productName(hovered.row.product)}</strong><span>{pctLabel(hovered.row.pct)}</span>
    </div>}
  </div>;
}
