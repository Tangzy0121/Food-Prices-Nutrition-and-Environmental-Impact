import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap, Handle, Position, useReactFlow, useViewport } from '@xyflow/react';
import type { Edge, Node, NodeProps } from '@xyflow/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronUp, Code2, Columns3, Copy, Database, Download, FileCode2, Filter, GitMerge, GripHorizontal, Layers3, List, Maximize, Minus, PanelBottomClose, PanelBottomOpen, PanelLeftClose, PanelLeftOpen, Plus, ScanLine, ShieldCheck, Shuffle, Table2, Workflow, X } from 'lucide-react';
import { useI18n } from './i18n';
import { number } from './workflow';
import { operations, connections, groups, kindLabels, metricLabels, traces } from './fullWorkflow';
import type { Bilingual, TraceTable } from './fullWorkflow';
import { flowBlocks, blockById, blockForOperation, blockConnections, blockCounts } from './groupedWorkflow';
import type { FlowBlock } from './groupedWorkflow';
import './pipeline.css';

const byId = Object.fromEntries(operations.map(op => [op.id, op]));
const icons = { source: Database, check: ShieldCheck, filter: Filter, clean: Workflow, join: GitMerge, aggregate: Layers3, sample: Shuffle, output: Table2 };
const nodeWidth = 176;
const nodeHeight = 116;
const readingZoom = 1;
const position = (item: FlowBlock) => ({ x: item.x, y: item.y });
type StepData = { block: FlowBlock; connected: boolean; inspect: (id: string) => void; [key: string]: unknown };
type StepNode = Node<StepData, 'operation'>;
type WorkspaceInsets = { left: number; bottom: number };

const OperationNode = memo(function OperationNode({ data, selected }: NodeProps<StepNode>) {
  const { language } = useI18n();
  const item = data.block;
  const count = blockCounts(item);
  const Icon = icons[item.kind];
  const countLabel = item.independentOutputs ? `${item.operationIds.length} ${language === 'zh' ? '个分析样本' : 'analysis sets'}` : `${number(count.after)} ${language === 'zh' ? '行' : 'rows'}`;
  return <>
    <Handle id="flow-in" type="target" position={Position.Left} style={{ top: 29, left: 58 }} />
    {item.id === 'product_attributes' && <Handle id="archived-out" type="source" position={Position.Top} style={{ top: 0, left: 88, opacity: 0 }} />}
    {item.id === 'validated_inputs' && <Handle id="archived-in" type="target" position={Position.Top} style={{ top: 0, left: 88, opacity: 0 }} />}
    {item.id === 'price_scope' && <Handle id="quotes-out" type="source" position={Position.Top} style={{ top: 0, left: 88, opacity: 0 }} />}
    {item.id === 'sampled_quotes' && <Handle id="quotes-in" type="target" position={Position.Top} style={{ top: 0, left: 88, opacity: 0 }} />}
    <button className={`prep-node kind-${item.kind}${selected ? ' is-selected' : ''}${data.connected ? ' is-connected' : ''}`} aria-label={`${item.title[language]}, ${item.operationIds.length} ${language === 'zh' ? '项操作' : 'operations'}, ${countLabel}`} aria-pressed={selected} onClick={() => data.inspect(item.operationIds[0])}>
      <span className="prep-node-symbol"><Icon size={25} /></span>
      {item.operationIds.length > 1 && <span className="prep-node-badge">{item.operationIds.length}</span>}
      <strong>{item.title[language]}</strong>
      <span className="prep-node-count">{countLabel}</span>
    </button>
    <Handle id="flow-out" type="source" position={Position.Right} style={{ top: 29, right: 58 }} />
  </>;
});
const nodeTypes = { operation: OperationNode };

function CanvasControls({ selected, insets, size }: { selected: string; insets: WorkspaceInsets; size: { width: number; height: number } }) {
  const { language } = useI18n();
  const text = (en: string, zh: string) => language === 'zh' ? zh : en;
  const flow = useReactFlow();
  const viewport = useViewport();
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const safeArea = { left: insets.left + 28, top: 80, width: Math.max(200, size.width - insets.left - 56), height: Math.max(140, size.height - insets.bottom - 142) };
  const areaRef = useRef(safeArea);
  areaRef.current = safeArea;
  const locate = useCallback((initial = false) => {
    const p = position(blockForOperation[selected]);
    const a = areaRef.current;
    const centerX = initial ? a.left + 80 : a.left + a.width / 2;
    void flowRef.current.setViewport({ x: centerX - (p.x + nodeWidth / 2) * readingZoom, y: a.top + a.height / 2 - (p.y + 29) * readingZoom, zoom: readingZoom }, { duration: 0 });
  }, [selected]);
  const hasSize = size.width > 0;
  const initialized = useRef(false);
  useEffect(() => {
    if (!hasSize || initialized.current) return;
    initialized.current = true;
    locate(true);
  }, [hasSize, locate]);
  const overview = () => {
    const points = flowBlocks.map(position);
    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y)) - 110;
    const width = Math.max(...points.map(p => p.x)) + nodeWidth - minX;
    const height = Math.max(...points.map(p => p.y)) + nodeHeight - minY;
    const a = areaRef.current;
    const zoom = Math.max(.025, Math.min(a.width / (width + 100), a.height / (height + 100), 1));
    void flow.setViewport({ x: a.left + a.width / 2 - (minX + width / 2) * zoom, y: a.top + a.height / 2 - (minY + height / 2) * zoom, zoom }, { duration: 0 });
  };
  return <div className="prep-canvas-controls" aria-label={text('Canvas controls', '画布控制')}>
    <button aria-label={text('Zoom out', '缩小')} title={text('Zoom out', '缩小')} onClick={() => flow.zoomOut({ duration: 0 })}><Minus size={17} /></button>
    <span>{Math.round(viewport.zoom * 100)}%</span>
    <button aria-label={text('Zoom in', '放大')} title={text('Zoom in', '放大')} onClick={() => flow.zoomIn({ duration: 0 })}><Plus size={17} /></button>
    <span className="prep-control-divider" />
    <button aria-label={text('Fit the complete flow', '查看完整流程总览')} title={text('Fit the complete flow', '查看完整流程总览')} onClick={overview}><Maximize size={17} /></button>
    <button className="prep-locate" onClick={() => locate()}><ScanLine size={16} /><span>{text('Locate step', '定位当前步骤')}</span></button>
  </div>;
}

function Diagram({ selected, inspect, insets }: { selected: string; inspect: (id: string) => void; insets: WorkspaceInsets }) {
  const { language } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  const selectedBlock = blockForOperation[selected].id;
  const nodes: StepNode[] = useMemo(() => {
    const neighbours = new Set(blockConnections.filter(edge => edge.source === selectedBlock || edge.target === selectedBlock).flatMap(edge => [edge.source, edge.target]));
    return flowBlocks.map(item => ({ id: item.id, type: 'operation', width: nodeWidth, height: nodeHeight, selected: item.id === selectedBlock, position: position(item), data: { block: item, connected: neighbours.has(item.id) && item.id !== selectedBlock, inspect } }));
  }, [selectedBlock, inspect]);
  const edges: Edge[] = useMemo(() => blockConnections.map((edge, i) => {
    const active = edge.source === selectedBlock || edge.target === selectedBlock;
    const quoteBypass = edge.source === 'price_scope' && edge.target === 'sampled_quotes';
    return { id: `connection-${i}`, source: edge.source, target: edge.target, sourceHandle: quoteBypass ? 'quotes-out' : edge.archived ? 'archived-out' : 'flow-out', targetHandle: quoteBypass ? 'quotes-in' : edge.archived ? 'archived-in' : 'flow-in', type: 'smoothstep', label: edge.label?.[language], ariaLabel: `${blockById[edge.source].title[language]} → ${blockById[edge.target].title[language]}`, style: { stroke: active ? '#23834f' : '#b6bfb9', strokeWidth: active ? 2 : 1.4, strokeDasharray: edge.archived ? '5 5' : undefined }, pathOptions: { borderRadius: 12, offset: quoteBypass ? 96 : edge.archived ? 48 : 24 }, labelStyle: { fill: '#626b65', fontSize: 12 }, labelBgStyle: { fill: '#f5f6f5' } };
  }), [selectedBlock, language]);
  return <ReactFlowProvider><div className="prep-canvas" ref={rootRef} aria-label={language === 'zh' ? `包含 ${flowBlocks.length} 个汇总节点的数据流程` : `Data flow with ${flowBlocks.length} grouped nodes`}>
    <ReactFlow<StepNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} minZoom={.025} maxZoom={2} nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable panOnScroll zoomOnScroll={false} zoomOnPinch zoomOnDoubleClick={false} preventScrolling attributionPosition="bottom-left">
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d6dbd7" />
      <MiniMap pannable zoomable nodeColor={node => node.id === selectedBlock ? '#23834f' : '#b7c2ba'} nodeBorderRadius={3} maskColor="rgba(244,246,244,0.7)" position="bottom-right" ariaLabel={language === 'zh' ? '完整流程导航缩略图，可拖动定位' : 'Complete flow minimap; drag to navigate'} />
    </ReactFlow>
    <CanvasControls selected={selected} insets={insets} size={size} />
    <span className="prep-pan-hint">{language === 'zh' ? '拖动画布平移 · 滚轮移动 · 双指缩放' : 'Drag to pan · Scroll to move · Pinch to zoom'}</span>
  </div></ReactFlowProvider>;
}

function RecordPreview({ table, label, count }: { table: TraceTable; label: string; count: number }) {
  const { language } = useI18n();
  const cell = (value: unknown) => {
    if (value === null || value === undefined) return <span className="prep-missing">NA</span>;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return Number.isInteger(value) ? String(value) : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 6 }).format(value);
    return String(value);
  };
  return <div className="prep-record-table"><div className="prep-table-heading"><strong>{label}</strong><span>{number(count)} {language === 'zh' ? '行' : 'rows'}<span> · </span>{table.columns.length} {language === 'zh' ? '字段' : 'fields'}</span></div>
    <div className="table-scroll"><table><thead><tr>{table.columns.map(column => <th key={column}><code>{column}</code></th>)}</tr></thead><tbody>{table.rows.map((row, i) => <tr key={i}>{table.columns.map(column => <td key={column} className={column === 'code' || column === 'product_code' ? 'prep-barcode' : undefined} title={String(row[column] ?? 'NA')}>{cell(row[column])}</td>)}</tr>)}</tbody></table>{table.rows.length === 0 && <p className="prep-empty">{language === 'zh' ? '没有符合该条件的记录。' : 'No records meet this condition.'}</p>}</div>
  </div>;
}

function FieldProfiles({ table }: { table: TraceTable }) {
  const { language } = useI18n();
  const text = (en: string, zh: string) => language === 'zh' ? zh : en;
  return <div className="prep-profiles"><p className="prep-excerpt-note">{text(`Profiles use only the ${table.rows.length} displayed after-records, not the complete dataset.`, `以下概览仅统计处理后的 ${table.rows.length} 条记录节选。`)}</p><div className="prep-profile-columns">{table.columns.map(column => {
    const values = table.rows.map(row => row[column]);
    const present = values.filter(value => value !== null && value !== undefined);
    const counts = new Map<string, number>();
    present.forEach(value => { const key = String(value); counts.set(key, (counts.get(key) ?? 0) + 1); });
    const isNumeric = present.length > 0 && present.every(value => typeof value === 'number');
    return <div className="prep-profile" key={column}><div className="prep-profile-title"><span>{isNumeric ? '#' : 'Abc'}</span><code title={column}>{column}</code></div><div className="prep-profile-meta">{counts.size} {text('distinct', '个不同值')} · {values.length - present.length} {text('null', '个缺失')}</div><div className="prep-profile-values">{[...counts.entries()].slice(0, 5).map(([value, count]) => <div key={value} title={`${value}: ${count}`}><span className="prep-profile-bar" style={{ width: `${count / Math.max(1, values.length) * 100}%` }} /><span>{value}</span><span>{count}</span></div>)}{!present.length && <span className="prep-missing">{text('All excerpt values are null', '节选值全部缺失')}</span>}</div></div>;
  })}</div></div>;
}

export default function DetailedPipeline() {
  const { language, t } = useI18n();
  const text = (en: string, zh: string) => language === 'zh' ? zh : en;
  const local = (value: Bilingual) => value[language];
  const [selected, setSelected] = useState('price_source');
  const [navigation, setNavigation] = useState<'stages' | 'list'>('stages');
  const [navigationOpen, setNavigationOpen] = useState(() => window.matchMedia('(min-width: 1100px)').matches);
  const [dockOpen, setDockOpen] = useState(true);
  const [dockHeight, setDockHeight] = useState(() => Math.round(Math.min(380, Math.max(310, window.innerHeight * .4))));
  const [changesOpen, setChangesOpen] = useState(() => window.matchMedia('(min-width: 1000px)').matches);
  const [detail, setDetail] = useState<'data' | 'profiles' | 'code'>('data');
  const [copied, setCopied] = useState(false);
  const [resizing, setResizing] = useState(false);
  const resizeRef = useRef<{ y: number; height: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const operationListRef = useRef<HTMLDivElement>(null);
  const selectedIndex = operations.findIndex(op => op.id === selected);
  const op = operations[selectedIndex];
  const block = blockForOperation[selected];
  const blockIndex = flowBlocks.indexOf(block);
  const trace = traces[selected];
  const previous = flowBlocks[blockIndex - 1]?.operationIds[0];
  const next = flowBlocks[blockIndex + 1]?.operationIds[0];
  const inputSteps = connections.filter(edge => edge.target === selected);
  const outputSteps = connections.filter(edge => edge.source === selected);
  const metrics = Object.entries(trace.metrics);
  const change = trace.afterCount - trace.beforeCount;
  const Icon = icons[op.kind];
  const inspect = useCallback((id: string) => { setSelected(id); setCopied(false); }, []);
  useEffect(() => {
    if (!navigationOpen || navigation !== 'list') return;
    const active = listRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (active) listRef.current?.scrollTo({ top: Math.max(0, active.offsetTop - 90), behavior: 'auto' });
  }, [selected, navigation, navigationOpen]);
  useEffect(() => {
    const root = operationListRef.current;
    const active = root?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (root && active) root.scrollTo({ left: Math.max(0, active.offsetLeft - root.clientWidth / 2 + active.offsetWidth / 2), behavior: 'auto' });
  }, [selected, dockOpen, language, navigationOpen]);
  useEffect(() => {
    const limit = () => setDockHeight(height => Math.max(180, Math.min(height, (rootRef.current?.clientHeight ?? window.innerHeight) - 160)));
    window.addEventListener('resize', limit);
    return () => window.removeEventListener('resize', limit);
  }, []);
  const clampDock = (height: number) => Math.max(180, Math.min(height, (rootRef.current?.clientHeight ?? window.innerHeight) - 160));
  const startResize = (event: PointerEvent<HTMLDivElement>) => { resizeRef.current = { y: event.clientY, height: dockHeight }; event.currentTarget.setPointerCapture(event.pointerId); setResizing(true); };
  const moveResize = (event: PointerEvent<HTMLDivElement>) => { if (resizeRef.current) setDockHeight(clampDock(resizeRef.current.height + resizeRef.current.y - event.clientY)); };
  const endResize = () => { resizeRef.current = null; setResizing(false); };
  const keyResize = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setDockHeight(height => clampDock(height + (event.key === 'ArrowUp' ? 24 : -24))); } };
  const copy = async () => { try { await navigator.clipboard.writeText(trace.code); setCopied(true); } catch { setCopied(false); } };
  const insets = { left: navigationOpen ? 224 : 0, bottom: dockOpen ? dockHeight : 0 };
  return <div ref={rootRef} className={`prep-workspace${dockOpen ? ' dock-open' : ''}${navigationOpen ? ' navigation-open' : ''}${resizing ? ' is-resizing' : ''}`} style={{ '--dock-height': `${dockHeight}px` } as CSSProperties}>
    <Diagram selected={selected} inspect={inspect} insets={insets} />

    <div className="prep-toolbar">
      <button className="prep-icon-button prep-navigation-toggle" aria-label={text('Toggle flow navigation', '展开或收起流程导航')} aria-expanded={navigationOpen} onClick={() => setNavigationOpen(open => !open)}>{navigationOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}</button>
      <div className="prep-flow-title"><Workflow size={19} /><h1>{t('Data pipeline')}</h1><span>{flowBlocks.length} {text('nodes', '个节点')} · {operations.length} {text('operations', '项操作')}</span></div>
      <div className="prep-step-navigation">
        <button className="prep-icon-button" disabled={!previous} aria-label={text('Previous flow node', '上一个流程节点')} onClick={() => previous && inspect(previous)}><ArrowLeft size={16} /></button>
        <div className="prep-step-select"><label className="sr-only" htmlFor="processing-step">{text('Jump to a step', '直接跳转')}</label><select id="processing-step" value={selected} onChange={event => inspect(event.target.value)}>{groups.map(group => <optgroup key={group.id} label={local(group.title)}>{operations.filter(item => item.group === group.id).map(item => <option key={item.id} value={item.id}>{String(operations.indexOf(item) + 1).padStart(2, '0')} · {local(item.title)}</option>)}</optgroup>)}</select><ChevronDown size={14} /></div>
        <button className="prep-icon-button" disabled={!next} aria-label={text('Next flow node', '下一个流程节点')} onClick={() => next && inspect(next)}><ArrowRight size={16} /></button>
      </div>
      <span className="prep-saved"><span className="green-dot" />{text('Saved R outputs', '已执行的 R 结果')}</span>
      <button className="prep-list-toggle prep-icon-button" aria-label={text('Browse all operations', '浏览全部操作')} aria-pressed={navigationOpen && navigation === 'list'} title={text('Browse all operations', '浏览全部操作')} onClick={() => { setNavigation('list'); setNavigationOpen(open => navigation === 'list' ? !open : true); }}><List size={19} /></button>
      <button className="prep-icon-button" aria-label={dockOpen ? text('Hide data panel', '收起数据面板') : text('Show data panel', '展开数据面板')} aria-expanded={dockOpen} onClick={() => setDockOpen(open => !open)}>{dockOpen ? <PanelBottomClose size={19} /> : <PanelBottomOpen size={19} />}</button>
    </div>

    {navigationOpen && <aside className="prep-navigator" aria-label={text('Flow navigation', '流程导航')}>
      <div className="prep-navigator-heading"><div className="prep-navigation-tabs"><button aria-pressed={navigation === 'stages'} onClick={() => setNavigation('stages')}>{text('Stages', '处理阶段')}</button><button aria-pressed={navigation === 'list'} onClick={() => setNavigation('list')}>{text('All operations', '全部操作')}</button></div><button className="prep-icon-button" aria-label={text('Close flow navigation', '收起流程导航')} onClick={() => setNavigationOpen(false)}><X size={16} /></button></div>
      <div className="prep-navigation-content" ref={listRef}>
        {navigation === 'stages' ? <><h2>{text('Inputs', '数据输入')}</h2><button className="prep-input" onClick={() => inspect('price_source')}><Database size={20} /><span><strong>Open Prices</strong><span>{text('Price snapshot', '原始报价快照')}</span><small>{number(traces.price_source.afterCount)} {text('rows', '行')}</small></span></button><button className="prep-input" onClick={() => inspect('catalog_source')}><Table2 size={20} /><span><strong>{text('Category catalog', '食品类别目录')}</strong><span>Open Prices</span><small>{number(traces.catalog_source.afterCount)} {text('entries', '条记录')}</small></span></button><h2>{text('Processing stages', '处理阶段')}</h2><div className="prep-stage-list">{groups.map((group, index) => <button key={group.id} aria-pressed={group.id === op.group} onClick={() => inspect(group.focus)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{local(group.title)}</strong><small>{operations.filter(item => item.group === group.id).length}</small></button>)}</div></> : groups.map(group => <section key={group.id} className="prep-step-group"><h2>{local(group.title)}</h2>{operations.filter(item => item.group === group.id).map(item => { const StepIcon = icons[item.kind]; return <button key={item.id} aria-pressed={item.id === selected} onClick={() => inspect(item.id)}><StepIcon size={16} /><span><strong>{String(operations.indexOf(item) + 1).padStart(2, '0')} · {local(item.title)}</strong><small>{number(traces[item.id].afterCount)} {text('rows', '行')}</small></span></button>; })}</section>)}
      </div>
      <a className="prep-navigation-source" href="#sources">{t('Sources & methodology')}<ArrowUpRight size={15} /></a>
    </aside>}

    {!dockOpen && <button className="prep-open-selection" onClick={() => setDockOpen(true)}><Icon size={18} /><span>{String(selectedIndex + 1).padStart(2, '0')} · {local(op.title)}</span><ChevronUp size={17} /></button>}
    {dockOpen && <section className={`prep-dock${changesOpen ? ' changes-open' : ''}`} aria-label={text('Selected step data and changes', '选中步骤的数据与处理说明')}>
      <div className="prep-dock-resizer" role="separator" aria-orientation="horizontal" aria-label={text('Resize data panel with arrow keys or drag', '拖动或使用上下方向键调整数据面板高度')} aria-valuenow={Math.round(dockHeight)} aria-valuemin={180} aria-valuemax={Math.max(180, (rootRef.current?.clientHeight ?? window.innerHeight) - 160)} tabIndex={0} onPointerDown={startResize} onPointerMove={moveResize} onPointerUp={endResize} onPointerCancel={endResize} onKeyDown={keyResize}><GripHorizontal size={20} /></div>
      <div className="prep-dock-heading"><div className="prep-selected-title"><span className={`prep-selected-symbol kind-${op.kind}`}><Icon size={18} /></span><div><span>{String(selectedIndex + 1).padStart(2, '0')} / {operations.length} · {local(kindLabels[op.kind])}</span><h2>{local(block.title)}</h2></div></div><div className="prep-dock-count"><span>{text('Operation rows', '当前操作行数')}</span><strong>{number(trace.beforeCount)}</strong><ArrowRight size={15} /><strong>{number(trace.afterCount)}</strong></div><button className="prep-icon-button" aria-label={text('Hide data panel', '收起数据面板')} onClick={() => setDockOpen(false)}><ChevronDown size={18} /></button></div>
      <div className="prep-operation-strip" ref={operationListRef} aria-label={text('Operations in this node', '节点内的具体操作')}><span>{block.operationIds.length} {text('operations', '项操作')}</span>{block.operationIds.map((id, index) => <button key={id} aria-pressed={id === selected} onClick={() => inspect(id)}><span>{index + 1}</span>{local(byId[id].title)}</button>)}</div>
      <div className="prep-detail-toolbar"><button className="prep-changes-toggle" aria-pressed={changesOpen} onClick={() => setChangesOpen(open => !open)}><Filter size={15} />{text('Operation details', '操作说明')}{changesOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}</button><div className="prep-detail-tabs" aria-label={text('Data panel view', '数据面板视图')}><button aria-pressed={detail === 'profiles'} onClick={() => setDetail('profiles')}><Columns3 size={15} /><span>{text('Field profiles', '字段概览')}</span></button><button aria-pressed={detail === 'data'} onClick={() => setDetail('data')}><Table2 size={15} /><span>{text('Before / after', '处理前后')}</span></button><button aria-pressed={detail === 'code'} onClick={() => setDetail('code')}><Code2 size={15} /><span>{t('R code')}</span></button></div><a className="prep-trace-download prep-icon-button" href={`${import.meta.env.BASE_URL}evidence/processing-trace.json`} download aria-label={text('Download the complete processing trace', '下载完整处理记录')} title={text('Download the complete processing trace', '下载完整处理记录')}><Download size={16} /></a></div>
      <div className="prep-dock-body">
        {changesOpen && <aside className="prep-changes" aria-label={t('Selected processing step')}><div className="prep-change-summary">{op.id === 'excluded_products' ? <><Check size={14} />{number(trace.afterCount)} {text('excluded products retained', '款排除商品已保留')}</> : change < 0 ? <><Minus size={14} />{number(-change)} {text(op.kind === 'aggregate' ? 'rows grouped' : 'rows excluded', op.kind === 'aggregate' ? '行在汇总后合并' : '行未进入本步骤结果')}</> : change > 0 ? <><Plus size={14} />{number(change)} {text('records recovered', '条记录补查成功')}</> : <><Check size={14} />{text('Row count unchanged', '记录数保持不变')}</>}</div><p>{local(op.description)}</p><div className="prep-rule">{local(op.condition)}</div>{op.view && <p className="prep-cumulative-note">{text('Cumulative view of the R condition; saved inputs stay intact.', '逐项展开 R 条件的累积视图，保留原始输入。')}</p>}{metrics.length > 0 && <dl className="prep-metrics">{metrics.map(([key, value]) => <div key={key}><dt>{metricLabels[key] ? local(metricLabels[key]) : key}</dt><dd>{number(value)}</dd></div>)}</dl>}<div className="prep-neighbours">{[{ label: text('From', '上游'), edges: inputSteps, key: 'source' as const }, { label: text('To', '下游'), edges: outputSteps, key: 'target' as const }].map(({ label, edges: links, key }) => links.length > 0 && <div key={key}><span>{label}</span>{links.map(edge => <button key={edge[key]} onClick={() => inspect(edge[key])}>{local(byId[edge[key]].title)}<ArrowUpRight size={12} /></button>)}</div>)}</div><a className="prep-source-link" href={`${import.meta.env.BASE_URL}evidence/${trace.source.split('/').at(-1)}`} download><FileCode2 size={15} />{trace.source}:{trace.line}<Download size={14} /></a></aside>}
        <div className="prep-detail-content" key={selected}>
          {detail === 'data' ? <><div className="prep-before-after"><RecordPreview label={text('Before', '处理前')} count={trace.beforeCount} table={trace.before} /><RecordPreview label={text('After', '处理后')} count={trace.afterCount} table={trace.after} /></div><p className="prep-excerpt-note">{text('Actual record excerpts from saved R inputs. Counts refer to the complete step output.', '表格展示保存的 R 输入中的真实记录节选，行数对应完整步骤结果。')}</p></> : detail === 'profiles' ? <FieldProfiles table={trace.after} /> : <div className="prep-code"><div><a href={`${import.meta.env.BASE_URL}evidence/${trace.source.split('/').at(-1)}`} download>{trace.source}:{trace.line}<ArrowUpRight size={13} /></a><button onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('Copied') : t('Copy')}</button></div><pre><code>{trace.code}</code></pre></div>}
        </div>
      </div>
    </section>}
  </div>;
}
