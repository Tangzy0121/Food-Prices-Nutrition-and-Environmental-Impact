import { useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, ArrowRight, ChartScatter, ChevronDown, CircleDot, FilterX, Package, ReceiptText, Search, SlidersHorizontal, X } from 'lucide-react';
import { useI18n } from './i18n';
import snapshot from './data/dashboard.json';
import { categories, environmentGrades, gradeLabel, matchesGrade, median, nutritionGrades, productName, searchText, subtypeLabel, unitPrice } from './dashboardModel';
import type { Category, DashboardData, Product } from './dashboardModel';
import DashboardCategoryPicker from './DashboardCategoryPicker';
import DashboardComparisonBoard from './DashboardComparisonBoard';
import DashboardPriceRange from './DashboardPriceRange';
import DashboardProductSearch from './DashboardProductSearch';
import { ExportButton, GradeBadge, GradeMetricIcon, IconButton } from './DashboardVisuals';
import MarketplacePlot from './DashboardMarketChart';
import type { MarketMetric, PriceRange } from './DashboardMarketChart';
import './dashboard.css';

const data = snapshot as DashboardData;
const views = [
  ['find', 'Find products', '找商品', Search],
  ['compare', 'Compare products', '商品对比', ArrowLeftRight],
] as const;
type View = typeof views[number][0];
type Selection = { category: Category; subtype: string };
const categoryProducts = Object.fromEntries(categories.map(category => [category, data.products.filter(p => p.category === category)])) as Record<Category, Product[]>;
const searchIndex = new Map(data.products.map(product => [product.code, {
  name: searchText(productName(product)),
  text: searchText([productName(product), product.brands, product.code].join(' ')),
}]));

export default function Dashboard() {
  const { language } = useI18n();
  const l = (en: string, zh: string) => language === 'zh' ? zh : en;
  const [view, setView] = useState<View>('find');
  const [selection, setSelection] = useState<Selection>();
  const [range, setRange] = useState<PriceRange>();
  const [query, setQuery] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [nutrition, setNutrition] = useState('');
  const [environment, setEnvironment] = useState('');
  const [multipleOffers, setMultipleOffers] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>();
  const [reference, setReference] = useState<Product>();
  const [sort, setSort] = useState('low');
  const [expanded, setExpanded] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [metric, setMetric] = useState<MarketMetric>('nutri_grade');
  const [zoom, setZoom] = useState<PriceRange>();
  const header = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const resultHead = useRef<HTMLDivElement>(null);
  const products = categoryProducts[selection?.category ?? 'breakfast_cereals'];
  const subtype = selection?.subtype ?? '';
  const scope = useMemo(() => subtype ? products.filter(p => (p.subtype ?? 'unknown') === subtype) : products, [products, subtype]);
  const prices = useMemo(() => scope.map(p => p.representative_price), [scope]);
  const unit = products[0].target_unit;
  const centre = useMemo(() => median(prices), [prices]);
  const selected = scope.find(p => p.code === selectedCode);
  const normalized = searchText(query);
  const filtered = scope.filter(p =>
    (!range || (p.representative_price >= range[0] && p.representative_price <= range[1])) &&
    (!normalized || searchIndex.get(p.code)!.text.includes(normalized)) &&
    matchesGrade(p.nutri_grade, nutrition, nutritionGrades) &&
    matchesGrade(p.environment_grade, environment, environmentGrades) &&
    (!multipleOffers || p.n_valid_regular_offers >= 2));
  const sorted = [...filtered].sort((a, b) => {
    const price = a.representative_price - b.representative_price;
    if (sort === 'name') return productName(a).localeCompare(productName(b));
    if (sort === 'offers') return b.n_valid_regular_offers - a.n_valid_regular_offers || price;
    if (sort === 'high') return -price;
    return price;
  });
  const suggested = normalized ? filtered.map(product => {
    const name = searchIndex.get(product.code)!.name;
    const rank = product.code === normalized || name === normalized ? 0 : name.startsWith(normalized) ? 1 : name.includes(normalized) ? 2 : 3;
    return { product, rank };
  }).sort((a, b) => a.rank - b.rank || productName(a.product).localeCompare(productName(b.product)))
    .slice(0, 6).map(({ product }) => product) : [];
  const visible = expanded ? sorted : sorted.slice(0, 5);
  const balanced = nutrition === 'through-c' && environment === 'through-c';
  const unknown = l('Unavailable', '未提供');
  const gradeFilterText = (grade: string, environmental: boolean) => grade === 'through-c'
    ? environmental ? 'A+–C' : 'A–C'
    : grade === 'unknown' ? unknown : gradeLabel(grade);
  const activeFilters = [
    nutrition ? { name: l('Nutrition', '营养') + ' ' + gradeFilterText(nutrition, false), clear: () => setNutrition('') } : null,
    environment ? { name: l('Environment', '环境') + ' ' + gradeFilterText(environment, true), clear: () => setEnvironment('') } : null,
    multipleOffers ? { name: l('At least 2 regular quotes', '至少 2 条常规报价'), clear: () => setMultipleOffers(false) } : null,
  ].filter(filter => filter !== null);

  function switchView(next: View, revealPanel = false) {
    setView(next);
    if (revealPanel) {
      header.current?.scrollIntoView({ block: 'start' });
      requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));
    }
  }

  function changeScope(category: Category, nextType: string) {
    if (selection?.category === category && subtype === nextType) return;
    setReference(undefined);
    setSelectedCode(undefined);
    setSelection({ category, subtype: nextType });
    setRange(undefined); setZoom(undefined); setQuery('');
    setExpanded(false);
  }

  function resetListFilters() {
    setQuery(''); setNutrition(''); setEnvironment(''); setMultipleOffers(false);
  }

  return <div className="food-dashboard">
    <header ref={header} className="dash-heading">
      <h1>{l('Find better food', '找到更好的食物')}</h1>
      <span className="dash-snapshot"><CircleDot size={14}/>{l('France · 2024–2025 quotes', '法国 · 2024–2025 年报价')}</span>
    </header>
    <div className="dash-tabs" role="tablist" aria-label={l('Dashboard views', '仪表板视图')}>
      {views.map(([id, en, zh, Icon], index) => <button key={id} type="button" role="tab" id={'dash-tab-' + id} aria-controls="dash-panel"
        aria-selected={view === id} tabIndex={view === id ? 0 : -1} onClick={() => switchView(id)}
        onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = views[event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index][0];
          switchView(next); document.getElementById('dash-tab-' + next)?.focus();
        }}><Icon size={17}/><span>{l(en, zh)}</span></button>)}
    </div>
    <div ref={panel} id="dash-panel" role="tabpanel" aria-labelledby={'dash-tab-' + view} tabIndex={-1}>
      {view === 'find' && <>
        <div className="dash-find-setup">
          <DashboardCategoryPicker products={categoryProducts} selection={selection} onSelect={changeScope}/>
          {selection ? <DashboardPriceRange prices={prices} range={range} onChange={setRange} median={centre} unit={unit}/> :
            <div className="dash-price-placeholder"><h2>{l('Select a price range', '选择价格区间')}</h2>
              <p>{l('Choose a food type to see its price distribution.', '选好食品类别后，这里会显示价格分布。')}</p></div>}
        </div>
        {selection && <>
          <div className="dash-find-results">
            <section className="dash-results" aria-labelledby="dash-products-heading">
              <div className="dash-section-head" ref={resultHead}>
                <div><h2 id="dash-products-heading">{l('Products', '商品列表')}</h2>
                  <p className="dash-muted" role="status">{l('Showing', '显示')} {visible.length} / {filtered.length} {l('matching products', '款匹配商品')}</p></div>
                <div className="dash-table-actions">
                  <label className="dash-field"><span className="sr-only">{l('Sort products', '商品排序')}</span><select aria-label={l('Sort products', '商品排序')} value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="low">{l('Price: low to high', '价格从低到高')}</option>
                    <option value="high">{l('Price: high to low', '价格从高到低')}</option>
                    <option value="offers">{l('Most regular quotes', '常规报价从多到少')}</option>
                    <option value="name">{l('Product name', '商品名称')}</option>
                  </select></label>
                  <ExportButton rows={sorted} file="food-signal-products" label={l('Export filtered products', '导出筛选商品')}/>
                </div>
              </div>
              <div className="dash-list-controls">
                <DashboardProductSearch key={selection.category + ':' + subtype} query={query} suggestions={suggested} total={filtered.length}
                  onChange={setQuery} onSelect={product => setSelectedCode(product.code)}/>
                <IconButton icon={SlidersHorizontal} label={l('More filters', '更多筛选')}
                  aria-expanded={advanced} aria-controls="dash-extra-filters" onClick={() => setAdvanced(!advanced)}>
                  {activeFilters.length > 0 && <span className="dash-filter-count" aria-hidden="true">{activeFilters.length}</span>}
                </IconButton>
              </div>
              <div className="dash-refine" id="dash-extra-filters" hidden={!advanced}>
                <label className="dash-field"><span>{l('Nutrition grade', '营养等级')}</span><select value={nutrition} onChange={e => setNutrition(e.target.value)}>
                  <option value="">{l('All grades', '所有等级')}</option><option value="through-c">A–C</option>
                  {nutritionGrades.map(grade => <option key={grade} value={grade}>{gradeLabel(grade)}</option>)}<option value="unknown">{unknown}</option>
                </select></label>
                <label className="dash-field"><span>{l('Environmental grade', '环境等级')}</span><select value={environment} onChange={e => setEnvironment(e.target.value)}>
                  <option value="">{l('All grades', '所有等级')}</option><option value="through-c">A+–C</option>
                  {environmentGrades.map(grade => <option key={grade} value={grade}>{gradeLabel(grade)}</option>)}<option value="unknown">{unknown}</option>
                </select></label>
                <label className="dash-field"><span>{l('Price evidence', '报价依据')}</span><select aria-label={l('Price evidence', '报价依据')} value={multipleOffers ? 'multiple' : ''} onChange={e => setMultipleOffers(e.target.value === 'multiple')}>
                  <option value="">{l('Any quote count', '不限报价次数')}</option><option value="multiple">{l('At least 2 regular quotes', '至少 2 条常规报价')}</option>
                </select></label>
                <div className="dash-quick-filters">
                  <button type="button" className="dash-button" aria-pressed={balanced} onClick={() => {
                    const grade = balanced ? '' : 'through-c'; setNutrition(grade); setEnvironment(grade);
                  }}>{l('Both grades C or better', '两项等级均为 C 或更好')}</button>
                  <IconButton icon={FilterX} label={l('Clear filters', '清除筛选')} className="dash-clear" onClick={resetListFilters}/>
                </div>
              </div>
              {!advanced && activeFilters.length > 0 && <div className="dash-active-filters">
                {activeFilters.map(filter => <button key={filter.name} className="dash-button" type="button"
                  aria-label={l('Remove filter', '移除筛选') + ' · ' + filter.name} onClick={filter.clear}>{filter.name}<X size={13}/></button>)}
              </div>}
              {visible.length > 0 ? <ul className="dash-simple-list" data-expanded={expanded}>
                {visible.map(product => <li key={product.code} data-product={product.code}>
                  <button type="button" aria-pressed={selected?.code === product.code} onClick={() => setSelectedCode(product.code)}>
                    <span className="dash-list-product"><strong>{productName(product)}</strong>
                      <small>{[product.brands, product.quantity_text].filter(Boolean).join(' · ') || product.code}</small>
                    </span>
                    <span className="dash-list-price"><strong>{unitPrice(product.representative_price, unit)}</strong>
                      <small className="dash-list-quote-count" data-offers={product.n_valid_regular_offers} title={l('Regular quotes', '常规报价')}>
                        <ReceiptText size={12} aria-hidden="true"/>{product.n_valid_regular_offers}<span className="sr-only"> {l('regular quotes', '条常规报价')}</span>
                      </small></span>
                    <span className="dash-list-grades">
                      <span><GradeMetricIcon metric="nutrition"/><GradeBadge grade={product.nutri_grade}/></span>
                      <span><GradeMetricIcon metric="environment"/><GradeBadge grade={product.environment_grade}/></span>
                    </span>
                  </button>
                </li>)}
              </ul> : <div className="dash-list-empty">
                <p>{l('No products match the current price and filters.', '没有商品符合当前价格区间和筛选。')}</p>
                {range && <button type="button" className="dash-button" onClick={() => setRange(undefined)}>{l('Reset range', '重置价格')}</button>}
                {(query || activeFilters.length > 0) && <button type="button" className="dash-button" onClick={resetListFilters}>{l('Clear list filters', '清除列表筛选')}</button>}
              </div>}
              {sorted.length > 5 && <button type="button" className="dash-button dash-expand-results" aria-expanded={expanded}
                onClick={() => { setExpanded(!expanded); if (expanded) resultHead.current?.scrollIntoView({ block: 'start' }); }}>
                {expanded ? l('Show first five', '收起至前 5 款') : l('Show all', '展开全部') + ' ' + sorted.length + ' ' + l('products', '款商品')}
                <ChevronDown size={16}/>
              </button>}
            </section>
            <aside className="dash-product-inspector" aria-labelledby="dash-inspector-heading" data-selected-product={selected?.code}>
              <h2 id="dash-inspector-heading"><Package size={17}/>{l('Selected product', '所选商品')}</h2>
              {selected ? <>
                <h3>{productName(selected)}</h3>
                <p>{[selected.brands, selected.quantity_text, subtypeLabel(selected.subtype, language)].filter(Boolean).join(' · ')}</p>
                {!filtered.some(p => p.code === selected.code) && <p>{l('Outside the current list filters', '这款商品在当前筛选范围之外。')}</p>}
                <dl>
                  <div><dt>{l('Historical unit price', '历史单位价格')}</dt><dd>{unitPrice(selected.representative_price, unit)}</dd></div>
                  <div><dt>{l('Nutrition grade', '营养等级')}</dt><dd><GradeBadge grade={selected.nutri_grade}/></dd></div>
                  <div><dt>{l('Environmental grade', '环境等级')}</dt><dd><GradeBadge grade={selected.environment_grade}/></dd></div>
                  <div><dt>{l('Regular quotes', '常规报价')}</dt><dd>{selected.n_valid_regular_offers}</dd></div>
                  <div><dt>{l('Latest record', '最近记录')}</dt><dd>{selected.last_price_date}</dd></div>
                </dl>
                <button type="button" className="dash-button" onClick={() => {
                  setReference(selected);
                  switchView('compare', true);
                }}>{l('Compare this product', '去对比这款商品')}<ArrowRight size={15}/></button>
              </> : <p>{l('Select a product in the list to see its price, grades and quote history.', '从左侧列表选择一款商品，查看价格、等级和报价情况。')}</p>}
            </aside>
          </div>
        </>}
      </>}
      {view === 'compare' && selection && <DashboardComparisonBoard key={selection.category + ':' + subtype}
        reference={reference} options={scope} products={products} quotes={data.quotes} range={range} onReference={setReference}/>}
      {view === 'find' && selection && <details className="dash-distribution-details" open={chartOpen} onToggle={e => setChartOpen(e.currentTarget.open)}>
            <summary><ChartScatter size={16} aria-hidden="true"/>{l('Product plot', '商品点图')}<ChevronDown size={15} aria-hidden="true"/></summary>
            {chartOpen && <section className="dash-chart-card">
              <MarketplacePlot key={selection.category + ':' + subtype} scope={scope} products={filtered} selected={selected}
                metric={metric} onMetric={setMetric} zoom={zoom} onZoom={setZoom} onSelect={product => setSelectedCode(product.code)}/>
              <div className="dash-legend dash-market-legend">
                <span><i className="dash-key product"/>{l('One product', '一款商品')}</span>
                <span><i className="dash-key median"/>{l('Scope median', '所选范围的中位价')}</span>
              </div>
            </section>}
      </details>}
      {view === 'compare' && !selection && <div className="dash-list-empty">
        <p>{l('Choose a food category before comparing products.', '先选择食品类别，再选择一款参照商品。')}</p>
        <button className="dash-button" type="button" onClick={() => switchView('find', true)}>{l('Find products', '找商品')}<ArrowRight size={16}/></button>
      </div>}
    </div>
  </div>;
}
