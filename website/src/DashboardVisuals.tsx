import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { Apple, ArrowDownToLine, Leaf } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from './i18n';
import { csvRows, gradeLabel } from './dashboardModel';

export function IconButton({ icon: Icon, label, title = label, className = '', children, ...props }:
  ComponentPropsWithRef<'button'> & { icon: LucideIcon; label: string }) {
  return <button type="button" {...props} className={`dash-button dash-icon-button ${className}`} aria-label={label} title={title}>
    <Icon size={16} aria-hidden="true"/>{children}
  </button>;
}

export function GradeMetricIcon({ metric }: { metric: 'nutrition' | 'environment' }) {
  const { language } = useI18n();
  const nutrition = metric === 'nutrition';
  const Icon = nutrition ? Apple : Leaf;
  const label = language === 'zh' ? (nutrition ? '营养等级' : '环境等级')
    : (nutrition ? 'Nutrition grade' : 'Environmental grade');
  return <span className="dash-grade-metric-icon" title={label}>
    <Icon size={14} aria-hidden="true"/><span className="sr-only">{label}</span>
  </span>;
}

export function GradeBadge({ grade }: { grade: string | null }) {
  const { language } = useI18n();
  return <span className="dash-grade" data-grade={grade ?? 'unknown'} aria-label={grade === null ? (language === 'zh' ? '未提供' : 'Unavailable') : undefined}>{gradeLabel(grade)}</span>;
}

export function ExportButton({ rows, file, label }: { rows: object[]; file: string; label: string }) {
  return <IconButton icon={ArrowDownToLine} className="dash-export" label={label} title={label + ' (CSV)'} disabled={!rows.length} onClick={() => {
    const url = URL.createObjectURL(new Blob([csvRows(rows as Record<string, unknown>[])], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file + '.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }}/>;
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
