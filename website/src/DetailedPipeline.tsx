import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap, Handle, Position, useReactFlow, useViewport } from '@xyflow/react';
import type { Edge, Node, NodeProps } from '@xyflow/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Copy, Database, Download, FileCode2, Filter, GitMerge, Layers3, List, Maximize, Minus, Plus, ScanLine, ShieldCheck, Shuffle, Table2, Workflow } from 'lucide-react';
import { useI18n } from './i18n';
import { number } from './workflow';
import { operations, connections, groups, kindLabels, metricLabels, traces } from './fullWorkflow';
import type { Bilingual, Operation, TraceTable } from './fullWorkflow';
import './pipeline.css';

const byId = Object.fromEntries(operations.map(op => [op.id, op]));
type StepData = { operation: Operation; selected: boolean; connected: boolean; inspect: (id: string) => void; [key: string]: unknown };
type StepNode = Node<StepData, 'operation'>;
const icons = { source: Database, check: ShieldCheck, filter: Filter, clean: Workflow, join: GitMerge, aggregate: Layers3, sample: Shuffle, output: Table2 };

function OperationNode({ data }: NodeProps<StepNode>) {
  const { language } = useI18n();
  const op = data.operation;
  const trace = traces[op.id];
  const Icon = icons[op.kind];
  const difference = trace.beforeCount - trace.afterCount;
  return <>
    <Handle type="target" position={Position.Left} style={{ top: 70 }} />
    <button className={`operation-node kind-${op.kind} ${data.selected ? 'is-selected' : ''} ${data.connected ? 'is-connected' : ''}`} aria-pressed={data.selected} onClick={() => data.inspect(op.id)}>
      <span className="operation-symbol"><Icon size={23} />{op.kind === 'check' && <span className="check-indicator" />}</span>
      <strong>{op.title[language]}</strong>
      <span className="operation-output">{number(trace.afterCount)} <span>{language === 'zh' ? '行' : 'rows'}</span>{difference > 0 && op.kind === 'filter' && <span className="operation-removed">−{number(difference)}</span>}</span>
      <span className="operation-hover" aria-hidden="true"><span>{language === 'zh' ? '点击查看这一步' : 'Click to inspect this step'}</span><strong>{op.title[language]}</strong><span>{op.description[language]}</span><code>{op.condition[language]}</code></span>
    </button>
    <Handle type="source" position={Position.Right} style={{ top: 70 }} />
  </>;
}
const nodeTypes = { operation: OperationNode };
const nodeWidth = 220;
const nodeHeight = 140;
const readingZoom = 1.15;

function CanvasActions({ selected, camera }: { selected: string; camera: number }) {
  const { language } = useI18n();
  const text = (en: string, zh: string) => language === 'zh' ? zh : en;
  const flow = useReactFlow();
  const viewport = useViewport();
  const flowRef = useRef(flow);
  flowRef.current = flow;
  useEffect(() => {
    const currentFlow = flowRef.current;
    if (camera === 0 && selected === 'price_source') {
      void currentFlow.setViewport({ x: 45, y: 80, zoom: readingZoom }, { duration: 0 });
      return;
    }
    const op = byId[selected];
    const parents = connections.filter(edge => edge.target === selected && !edge.archived).map(edge => byId[edge.source]);
    const sameRegion = parents.filter(parent => Math.abs(parent.x - op.x) <= 600);
    const rows = [op.y, ...sameRegion.map(parent => parent.y)];
    const centerY = op.kind === 'join' ? (Math.min(...rows) + Math.max(...rows) + nodeHeight) / 2 : op.y + nodeHeight / 2;
    void currentFlow.setCenter(op.x + nodeWidth / 2, centerY, { zoom: readingZoom, duration: 0 });
  }, [camera, selected]);
  return <div className="trace-canvas-controls">
    <button aria-label={text('Zoom out', '缩小')} title={text('Zoom out', '缩小')} onClick={() => flow.zoomOut({ duration: 0 })}><Minus size={17} /></button>
    <span>{Math.round(viewport.zoom * 100)}%</span>
    <button aria-label={text('Zoom in', '放大')} title={text('Zoom in', '放大')} onClick={() => flow.zoomIn({ duration: 0 })}><Plus size={17} /></button>
    <span className="control-divider" />
    <button aria-label={text('Show the whole connected flow as an overview', '查看完整流程总览')} title={text('Whole-flow overview; use Locate step to return to readable size', '完整流程总览；点击“定位当前步骤”返回阅读大小')} onClick={() => flow.fitView({ padding: 0.08, duration: 0 })}><Maximize size={17} /></button>
    <button className="locate-step" onClick={() => { const op = byId[selected]; void flow.setCenter(op.x + nodeWidth / 2, op.y + nodeHeight / 2, { zoom: readingZoom, duration: 0 }); }}><ScanLine size={16} />{text('Locate step', '定位当前步骤')}</button>
  </div>;
}

function Diagram({ selected, camera, inspect }: { selected: string; camera: number; inspect: (id: string) => void }) {
  const { language } = useI18n();
  const neighbours = new Set(connections.filter(edge => edge.source === selected || edge.target === selected).flatMap(edge => [edge.source, edge.target]));
  const nodes: StepNode[] = useMemo(() => operations.map(op => ({ id: op.id, type: 'operation', width: nodeWidth, height: nodeHeight, position: { x: op.x, y: op.y }, data: { operation: op, selected: op.id === selected, connected: neighbours.has(op.id) && op.id !== selected, inspect } })), [selected, inspect]);
  const edges: Edge[] = connections.map((edge, i) => {
    const connected = edge.source === selected || edge.target === selected;
    return {
      id: `connection-${i}`, source: edge.source, target: edge.target, type: 'smoothstep',
      label: edge.label?.[language], ariaLabel: `${byId[edge.source].title[language]} → ${byId[edge.target].title[language]}`,
      style: { stroke: connected ? '#23834f' : '#c5cbc6', strokeWidth: connected ? 2.4 : 1.4, strokeDasharray: edge.archived ? '5 5' : undefined },
      pathOptions: { borderRadius: 18, offset: edge.archived ? 60 : 24 },
      labelStyle: { fill: connected ? '#23683e' : '#777', fontSize: 13 }, labelBgStyle: { fill: '#fafbfa' },
    };
  });
  const selectedOp = byId[selected];
  const selectedTrace = traces[selected];
  const selectedIndex = operations.findIndex(op => op.id === selected);
  return <ReactFlowProvider><div className="trace-canvas" aria-label={language === 'zh' ? '包含全部 56 个步骤的完整数据流程' : 'Complete data flow with all 56 steps'}>
    <div className="trace-canvas-label"><span className="green-dot" />{language === 'zh' ? '完整流程' : 'Complete flow'}<span>·</span>{language === 'zh' ? '悬停预览，点击节点定位并查看详情' : 'Hover to preview; click a node to locate and inspect it'}</div>
    <ReactFlow<StepNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} defaultViewport={{ x: 45, y: 80, zoom: readingZoom }} minZoom={0.035} maxZoom={2} nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable zoomOnScroll zoomOnDoubleClick preventScrolling={false} attributionPosition="bottom-left">
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#dfe3df" />
      <MiniMap pannable zoomable style={{ width: 180, height: 96 }} nodeColor={node => node.id === selected ? '#23834f' : '#c7cfca'} nodeBorderRadius={3} maskColor="rgba(246,248,246,0.65)" position="bottom-right" ariaLabel={language === 'zh' ? '完整流程导航缩略图，可拖动定位' : 'Complete flow minimap; drag to navigate'} />
    </ReactFlow>
    <div className="canvas-selection" aria-live="polite"><span>{language === 'zh' ? '当前步骤' : 'Current step'} · {String(selectedIndex + 1).padStart(2, '0')} / {operations.length}</span><strong>{selectedOp.title[language]}</strong><p>{selectedOp.description[language]}</p><div>{number(selectedTrace.beforeCount)} → {number(selectedTrace.afterCount)} {language === 'zh' ? '行' : 'rows'}</div></div>
    <CanvasActions selected={selected} camera={camera} />
  </div></ReactFlowProvider>;
}

function RecordPreview({ table, label }: { table: TraceTable; label: string }) {
  const { language } = useI18n();
  const cell = (value: unknown) => {
    if (value === null || value === undefined) return <span className="missing-value">NA</span>;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return Number.isInteger(value) ? String(value) : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 6 }).format(value);
    return String(value);
  };
  return <div className="trace-record-table"><div className="trace-table-title"><span>{label}</span><span>{language === 'zh' ? '实际记录节选' : 'Actual record excerpt'}</span></div><div className="table-scroll"><table><thead><tr>{table.columns.map(column => <th key={column}><code>{column}</code></th>)}</tr></thead><tbody>{table.rows.map((row, i) => <tr key={i}>{table.columns.map(column => <td key={column} className={column === 'code' || column === 'product_code' ? 'trace-barcode' : undefined}>{cell(row[column])}</td>)}</tr>)}</tbody></table></div>{table.rows.length === 0 && <p className="trace-empty">{language === 'zh' ? '没有符合该条件的记录。' : 'No records meet this condition.'}</p>}</div>;
}

export default function DetailedPipeline() {
  const { language, t } = useI18n();
  const text = (en: string, zh: string) => language === 'zh' ? zh : en;
  const local = (value: Bilingual) => value[language];
  const [selected, setSelected] = useState('price_source');
  const [camera, setCamera] = useState(0);
  const [view, setView] = useState<'canvas' | 'list'>('canvas');
  const [detail, setDetail] = useState<'data' | 'code'>('data');
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view !== 'list') return;
    const active = listRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (active) listRef.current?.scrollTo({ top: Math.max(0, active.offsetTop - 70), behavior: 'auto' });
  }, [selected, view]);
  const inspect = useCallback((id: string) => { setSelected(id); setCamera(n => n + 1); setCopied(false); }, []);
  const selectedIndex = operations.findIndex(op => op.id === selected);
  const op = operations[selectedIndex];
  const trace = traces[selected];
  const previous = selectedIndex > 0 ? operations[selectedIndex - 1] : undefined;
  const next = operations[selectedIndex + 1];
  const inputSteps = connections.filter(edge => edge.target === selected);
  const outputSteps = connections.filter(edge => edge.source === selected);
  const metrics = Object.entries(trace.metrics);
  const change = trace.afterCount - trace.beforeCount;
  const copy = async () => { try { await navigator.clipboard.writeText(trace.code); setCopied(true); } catch { setCopied(false); } };
  return <div className="detailed-pipeline wide-width">
    <div className="trace-heading"><div><div className="breadcrumb"><a href="#study">{t('The study')}</a><span>/</span><span>{t('Data pipeline')}</span></div><h1>{text('Data preparation, step by step.', '数据如何一步步清洗')}</h1></div><span className="trace-count">{operations.length} {text('operations', '个处理步骤')}<span>·</span>{text('Saved R outputs', '已执行的 R 结果')}</span></div>
    <div className="trace-toolbar"><div className="trace-group-links" aria-label={text('Locate a processing stage', '定位处理阶段')}>{groups.map((group, i) => <button key={group.id} onClick={() => inspect(group.focus)} aria-pressed={group.id === op.group}><span>{String(i + 1).padStart(2, '0')}</span>{local(group.title)}</button>)}</div><div className="segmented"><button aria-label={t('Canvas view')} aria-pressed={view === 'canvas'} className={view === 'canvas' ? 'selected' : ''} onClick={() => setView('canvas')}><Workflow size={16} />{t('Canvas')}</button><button aria-label={t('List view')} aria-pressed={view === 'list'} className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}><List size={16} />{t('List')}</button></div></div>
    <div className="trace-stepper"><div><button disabled={!previous} aria-label={text('Previous processing step', '上一个处理步骤')} onClick={() => previous && inspect(previous.id)}><ArrowLeft size={16} /></button><span>{String(selectedIndex + 1).padStart(2, '0')} / {operations.length}</span><button disabled={!next} aria-label={text('Next processing step', '下一个处理步骤')} onClick={() => next && inspect(next.id)}><ArrowRight size={16} /></button></div><div className="trace-step-select"><label htmlFor="processing-step">{text('Jump to a step', '直接跳转')}</label><select id="processing-step" value={selected} onChange={event => inspect(event.target.value)}>{groups.map(group => <optgroup key={group.id} label={local(group.title)}>{operations.filter(item => item.group === group.id).map(item => <option key={item.id} value={item.id}>{String(operations.indexOf(item) + 1).padStart(2, '0')} · {local(item.title)}</option>)}</optgroup>)}</select><ChevronDown size={14} /></div><span className="trace-connected-note">{text('Click any node, or switch to List to browse all steps', '可点击任意节点，或切换列表查看全部步骤')}</span></div>
    <div className="trace-workspace">
      {view === 'canvas' ? <Diagram selected={selected} camera={camera} inspect={inspect} /> : <div className="complete-step-list" ref={listRef} style={{ position: 'relative' }}>{groups.map(group => <section key={group.id}><div className="step-list-group">{local(group.title)}</div>{operations.filter(item => item.group === group.id).map(item => <button key={item.id} aria-pressed={item.id === selected} onClick={() => inspect(item.id)} className={item.id === selected ? 'selected' : ''}><span>{String(operations.indexOf(item) + 1).padStart(2, '0')}</span><div><strong>{local(item.title)}</strong><p>{number(traces[item.id].beforeCount)} → {number(traces[item.id].afterCount)} {text('rows', '行')}</p></div><ArrowRight size={16} /></button>)}</section>)}</div>}
      <aside className="trace-inspector" aria-label={t('Selected processing step')}><div className="trace-step-index"><span>{local(kindLabels[op.kind])}</span><span>{String(selectedIndex + 1).padStart(2, '0')} / {operations.length}</span></div><h2>{local(op.title)}</h2><div className="trace-io"><div><span>{text('Input rows', '处理前')}</span><strong>{number(trace.beforeCount)}</strong></div><ArrowRight size={19} /><div><span>{text('Output rows', '处理后')}</span><strong>{number(trace.afterCount)}</strong></div></div>
        <div className="trace-change">{op.id === 'excluded_products' ? <><Check size={14} />{number(trace.afterCount)} {text('excluded products retained with their reasons', '款排除商品及其原因已保留')}</> : change < 0 ? <><Minus size={14} />{number(-change)} {text(op.kind === 'aggregate' ? 'fewer rows after grouping' : 'rows excluded from this view', op.kind === 'aggregate' ? '行在汇总后合并' : '行未进入本步骤结果')}</> : change > 0 ? <><Plus size={14} />{number(change)} {text('records recovered', '条记录补查成功')}</> : <><Check size={14} />{text('Row count unchanged', '记录数保持不变')}</>}</div>
        <p className="trace-description">{local(op.description)}</p><div className="trace-condition">{local(op.condition)}</div>
        {op.view && <p className="trace-view-note">{text('The R condition is expanded here as a cumulative view; saved inputs remain intact.', '此处将 R 条件逐项展开为累积视图，原始保存记录继续保留。')}</p>}
        {metrics.length > 0 && <dl className="trace-metrics">{metrics.map(([key, value]) => <div key={key}><dt>{metricLabels[key] ? local(metricLabels[key]) : key}</dt><dd>{number(value)}</dd></div>)}</dl>}
        <div className="trace-neighbours">{inputSteps.length > 0 && <div><span>{text('From', '上游')}</span>{inputSteps.map(edge => <button key={edge.source} onClick={() => inspect(edge.source)}>{local(byId[edge.source].title)}<ArrowUpRight size={13} /></button>)}</div>}{outputSteps.length > 0 && <div><span>{text('To', '下游')}</span>{outputSteps.map(edge => <button key={edge.target} onClick={() => inspect(edge.target)}>{local(byId[edge.target].title)}<ArrowUpRight size={13} /></button>)}</div>}</div>
        <a className="trace-source" href={`/evidence/${trace.source.split('/').at(-1)}`} download><FileCode2 size={16} /><span>{trace.source}:{trace.line}</span><Download size={15} /></a>
      </aside>
    </div>

    <section className="trace-detail" aria-labelledby="trace-data-title"><div className="trace-detail-heading"><h2 id="trace-data-title">{local(op.title)}</h2><div className="trace-detail-actions"><div className="segmented"><button aria-pressed={detail === 'data'} className={detail === 'data' ? 'selected' : ''} onClick={() => setDetail('data')}><Table2 size={16} />{text('Before / after', '处理前后')}</button><button aria-pressed={detail === 'code'} className={detail === 'code' ? 'selected' : ''} onClick={() => setDetail('code')}><Code2 size={16} />{t('R code')}</button></div><a href="/evidence/processing-trace.json" download aria-label={text('Download the complete processing trace', '下载完整处理记录')} title={text('Download the complete processing trace', '下载完整处理记录')}><Download size={17} /></a></div></div>
      {detail === 'data' ? <div className="trace-before-after"><RecordPreview label={`${text('Before', '处理前')} · ${number(trace.beforeCount)} ${text('rows', '行')}`} table={trace.before} /><span className="trace-between-arrow"><ArrowRight size={19} /></span><RecordPreview label={`${text('After', '处理后')} · ${number(trace.afterCount)} ${text('rows', '行')}`} table={trace.after} /></div> : <div className="trace-code"><div><span>{trace.source}:{trace.line}</span><button onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('Copied') : t('Copy')}</button></div><pre><code>{trace.code}</code></pre></div>}
      <p className="trace-preview-note">{text('Record excerpts are reconstructed from saved inputs, including actual R parsing intermediates. Field and flag steps can preserve every row. Quote rows and product rows refer to different record levels.', '表格从保存的输入还原，包含真实记录和 R 解析得到的中间值。字段和标记处理可以保留全部记录；报价行数和商品行数分别对应各自的数据层级。')}</p>
    </section>
    <div className="trace-final-note"><span><Database size={17} />Open Prices <GitMerge size={16} />Open Food Facts</span><p>{text('Price dates: 2024–2025. Product attributes: 2 November 2026. Exact character barcodes connect the datasets; the original snapshots are preserved.', '报价日期为 2024–2025 年，商品资料获取于 2026 年 11 月 2 日。两份数据按字符型条码精确连接，原始快照保持保留。')}</p><a href="#sources">{t('Sources & methodology')}<ArrowUpRight size={15} /></a></div>
  </div>;
}
