import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { useI18n } from './i18n';
import { csvRows, fmt, gradeLabel, unitPrice } from './dashboardModel';
import type { Quote } from './dashboardModel';

export function GradeBadge({ grade }: { grade: string | null }) {
  const { language } = useI18n();
  return <span className="dash-grade" data-grade={grade ?? 'unknown'} aria-label={grade === null ? (language === 'zh' ? '未提供' : 'Unavailable') : undefined}>{gradeLabel(grade)}</span>;
}

export function ExportButton({ rows, file, label }: { rows: object[]; file: string; label: string }) {
  return <button className="dash-button dash-export" type="button" aria-label={label} disabled={!rows.length} onClick={() => {
    const url = URL.createObjectURL(new Blob([csvRows(rows as Record<string, unknown>[])], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file + '.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }}><ArrowDownToLine size={15}/> CSV</button>;
}

export function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(250, Math.floor(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export function spreadPlotOffsets(points: { code: string; group: string; x: number }[], rowHeight: number) {
  const offsets = new Map<string, number>();
  const lanes = [0];
  for (let distance = 4; distance <= rowHeight / 2 - 5; distance += 4) lanes.push(-distance, distance);
  const radius = 9;
  const placed = new Map<string, { x: number; y: number }[]>();
  const ordered = [...points].sort((a, b) => a.x - b.x || a.code.localeCompare(b.code));
  for (const point of ordered) {
    const nearby = (placed.get(point.group) ?? []).filter(previous => point.x - previous.x < radius);
    let offset = 0, best = -1;
    for (const lane of lanes) {
      const clearance = Math.min(Infinity, ...nearby.map(previous => (point.x - previous.x) ** 2 + (lane - previous.y) ** 2));
      if (clearance > best) { offset = lane; best = clearance; }
      if (clearance >= radius ** 2) break;
    }
    nearby.push({ x: point.x, y: offset });
    placed.set(point.group, nearby);
    offsets.set(point.code, offset);
  }
  return offsets;
}

export function QuotePlot({ first, second, unit }: { first: Quote[]; second: Quote[]; unit: string }) {
  const { language } = useI18n();
  const zh = language === 'zh';
  const { ref, width } = useChartWidth();
  const height = 216, left = 45, right = width - 15, top = 26, bottom = 171;
  const rows = [...first, ...second];
  const max = Math.ceil(Math.max(1, ...rows.map(row => row.unit_price)) / 5) * 5;
  const start = Date.parse('2024-01-01'), end = Date.parse('2025-12-31');
  const x = (date: string) => left + (Date.parse(date) - start) / (end - start) * (right - left);
  const y = (price: number) => bottom - price / max * (bottom - top);
  const tickDates = width < 450 ? ['2024-01-01', '2025-01-01', '2025-12-31'] :
    ['2024-01-01', '2024-07-01', '2025-01-01', '2025-07-01', '2025-12-31'];
  return <div ref={ref} className="dash-plot">
    <svg viewBox={`0 0 ${width} ${height}`} className="dash-svg" data-chart="quotes" role="img"
      aria-label={zh ? '两款商品的历史报价散点图' : 'Historical quotes for both products'}>
      <text x={left} y={13} className="dash-axis-head">€/{unit}</text>
      {[0, .25, .5, .75, 1].map(part => <g key={part}>
        <line className="dash-gridline" x1={left} x2={right} y1={y(max * part)} y2={y(max * part)}/>
        <text className="dash-axis-text" x={left - 8} y={y(max * part) + 4} textAnchor="end">{fmt(max * part)}</text>
      </g>)}
      {tickDates.map((date, index) => <text key={date} className="dash-axis-text" x={x(date)} y={195}
        textAnchor={index === 0 ? 'start' : index === tickDates.length - 1 ? 'end' : 'middle'}>{date.slice(0, 7)}</text>)}
      {[first, second].map((quotes, index) => quotes.map(quote => <g key={quote.id} className={`dash-quote-point quote-${index}${quote.discounted || !quote.kept ? ' quote-excluded' : ''}`}>
        <title>{quote.date} · {unitPrice(quote.unit_price, unit)}{quote.city ? ' · ' + quote.city : ''}</title>
        {index === 0
          ? <circle cx={x(quote.date)} cy={y(quote.unit_price)} r="4.5"/>
          : <rect x={x(quote.date) - 4} y={y(quote.unit_price) - 4} width="8" height="8" rx="1"/>}
      </g>))}
    </svg>
  </div>;
}
