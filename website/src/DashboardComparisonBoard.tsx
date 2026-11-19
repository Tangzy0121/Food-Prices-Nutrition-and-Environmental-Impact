import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from './i18n';
import { environmentGrades, gradeChange, nutritionGrades, productName, signedDifference, subtypeLabel, unitPrice } from './dashboardModel';
import type { Product } from './dashboardModel';
import type { PriceRange } from './DashboardMarketChart';
import DashboardComparisonPlot from './DashboardComparisonPlot';
import { ExportButton, GradeBadge } from './DashboardVisuals';

type Filter = 'all' | 'no-grade-drop' | 'cheaper';

export default function DashboardComparisonBoard({ reference, options, products, range, onReference, onDetails }: {
  reference?: Product; options: Product[]; products: Product[]; range?: PriceRange;
  onReference: (product?: Product) => void; onDetails: (product: Product) => void;
}) {
  const { language } = useI18n();
  const l = (en: string, zh: string) => language === 'zh' ? zh : en;
  const [allTypes, setAllTypes] = useState(false);
  const [useRange, setUseRange] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState('recommended');
  const [selectedCode, setSelectedCode] = useState<string>();

  const sameType = Boolean(reference?.subtype && !allTypes);
  const unit = reference?.target_unit ?? products[0].target_unit;
  const rows = reference ? products
    .filter(p => p.code !== reference.code && (!sameType || p.subtype === reference.subtype) &&
      (!range || !useRange || (p.representative_price >= range[0] && p.representative_price <= range[1])))
    .map(product => {
      const priceDelta = product.representative_price - reference.representative_price;
      const nutrition = gradeChange(reference.nutri_grade, product.nutri_grade, nutritionGrades);
      const environment = gradeChange(reference.environment_grade, product.environment_grade, environmentGrades);
      const cheaper = priceDelta < -1e-9;
      const noGradeDrop = cheaper && (nutrition === 'same' || nutrition === 'better') &&
        (environment === 'same' || environment === 'better');
      return { product, priceDelta, pct: priceDelta / reference.representative_price * 100, nutrition, environment, cheaper, noGradeDrop };
    }) : [];
  const recommended = rows.filter(row => row.noGradeDrop).length;
  const cheaper = rows.filter(row => row.cheaper).length;
  const matched = rows.filter(row => filter === 'all' || (filter === 'no-grade-drop' ? row.noGradeDrop : row.cheaper))
    .sort((a, b) => {
      const price = a.priceDelta - b.priceDelta;
      if (sort === 'price') return price;
      if (sort === 'offers') return b.product.n_valid_regular_offers - a.product.n_valid_regular_offers || price;
      return Number(b.noGradeDrop) - Number(a.noGradeDrop) || price;
    });
  const selectedIndex = Math.max(0, matched.findIndex(row => row.product.code === selectedCode));
  const selected = matched[selectedIndex];
  const changes = rows.map(row => row.pct);
  const ordered = [...options].sort((a, b) => productName(a).localeCompare(productName(b)));
  const effects = {
    same: l('Same', '持平'), better: l('Better', '更好'), worse: l('Worse', '较差'), missing: l('Unknown', '未知'),
  };
  const filters = [
    ['all', l('All', '全部'), rows.length],
    ['no-grade-drop', l('Cheaper, no grade drop', '更便宜且等级不降'), recommended],
    ['cheaper', l('Cheaper', '只看更便宜'), cheaper],
  ] as const;
  const exportRows = matched.map(row => ({
    reference_code: reference?.code,
    reference_unit_price: reference?.representative_price,
    product_code: row.product.code,
    product_name: productName(row.product),
    unit_price: row.product.representative_price,
    price_unit: 'EUR/' + unit,
    price_difference: row.priceDelta,
    price_difference_pct: row.pct,
    nutrition_grade: row.product.nutri_grade,
    nutrition_change: row.nutrition,
    environment_grade: row.product.environment_grade,
    environment_change: row.environment,
    regular_quotes: row.product.n_valid_regular_offers,
  }));

  function renderGrade(before: string | null, after: string | null, change: keyof typeof effects) {
    return <span className="dash-grade-change" data-change={change}>
      <GradeBadge grade={before}/><span aria-hidden="true">→</span><GradeBadge grade={after}/><small>{effects[change]}</small>
    </span>;
  }

  return <section className="dash-comparison-board" aria-labelledby="dash-board-heading">
    <div className="dash-section-head">
      <div><h2 id="dash-board-heading">{l('Compare with other products', '与其他商品对比')}</h2>
        {reference && <p className="dash-muted" role="status">{rows.length} {l('comparable products', '款商品可对比')} · {recommended} {l('cheaper with no grade drop', '款更便宜且两项等级不降')}</p>}</div>
      {reference && <ExportButton rows={exportRows} file="food-signal-reference-comparison" label={l('Export comparison results', '导出对比结果')}/>}
    </div>
    <label className="dash-field dash-reference-select"><span>{l('Reference product', '参照商品')}</span>
      <select aria-label={l('Reference product', '参照商品')} value={reference?.code ?? ''} onChange={e => onReference(ordered.find(p => p.code === e.target.value))}>
        <option value="">{l('Choose a reference', '选择一款参照商品')}</option>
        {ordered.map(p => <option key={p.code} value={p.code}>{productName(p)} · {unitPrice(p.representative_price, unit)}</option>)}
      </select>
    </label>
    {!reference ? <p className="dash-list-empty">{l('Select one reference to see the comparison results.', '选一款参照商品，即可查看一组对比结果。')}</p> : <>
      <div className="dash-reference-summary" data-reference={reference.code}>
        <div>
          <small>{l('Reference', '参照商品')}</small>
          <strong>{productName(reference)}</strong>
          <p>{[reference.brands, reference.quantity_text, subtypeLabel(reference.subtype, language)].filter(Boolean).join(' · ')}</p>
        </div>
        <dl>
          <div><dt>{l('Historical unit price', '历史单位价')}</dt><dd>{unitPrice(reference.representative_price, unit)}</dd></div>
          <div><dt>{l('Nutrition', '营养')}</dt><dd><GradeBadge grade={reference.nutri_grade}/></dd></div>
          <div><dt>{l('Environment', '环境')}</dt><dd><GradeBadge grade={reference.environment_grade}/></dd></div>
          <div><dt>{l('Regular quotes', '常规报价')}</dt><dd>{reference.n_valid_regular_offers}</dd></div>
        </dl>
      </div>
        <div className="dash-many-scope">
          {reference.subtype ? <label className="dash-field"><span>{l('Comparison scope', '比较范围')}</span>
            <select aria-label={l('Comparison scope', '比较范围')} value={allTypes ? 'category' : 'type'} onChange={event => {
              setAllTypes(event.target.value === 'category');
            }}>
              <option value="type">{l('Same food type', '同一细分类')} · {subtypeLabel(reference.subtype, language)}</option>
              <option value="category">{l('Same food category', '同一食品大类')}</option>
            </select>
          </label> : <p className="dash-comparison-context">{l('The reference has no food-type label. The comparison uses its food category.', '参照商品未归入细分类，比较范围为同一食品大类。')}</p>}
          {range && <label className="dash-check-field"><input type="checkbox" checked={useRange} onChange={event => {
            setUseRange(event.target.checked);
          }}/>{l('Use selected price range', '沿用价格区间')} · €{range[0].toFixed(2)}–{range[1].toFixed(2)}/{unit}</label>}
        </div>
        <div className="dash-many-controls">
          <div className="dash-quick-filters" role="group" aria-label={l('Comparison filters', '对比结果筛选')}>
            {filters.map(([id, label, count]) => <button key={id} type="button" className="dash-button" aria-pressed={filter === id}
              onClick={() => setFilter(id)}>{label} <span>{count}</span></button>)}
          </div>
        </div>
      {selected ? <div className="dash-comparison-workspace">
        <div className="dash-comparison-figure">
          <h3>{l('Price and grade changes', '价差与等级变化')}</h3>
          <p>{l('Each point is a product. Select one to see how it compares with the reference.',
            '每个点代表一款商品，点选即可查看它与参照商品的差异。')}</p>
          <DashboardComparisonPlot rows={matched} priceExtent={[Math.min(0, ...changes), Math.max(0, ...changes)]}
            selected={selected} onSelect={setSelectedCode}/>
          {matched.some(row => row.noGradeDrop) && <div className="dash-comparison-legend">
            <span aria-hidden="true">◆</span>{l('Cheaper, with both grades maintained or improved', '更便宜，且两项等级持平或更好')}
          </div>}
        </div>
        <aside className="dash-candidate" aria-label={l('Selected comparison product', '当前对比商品')}>
          <div className="dash-candidate-nav">
            <span>{l('Selected product', '当前对比商品')}</span>
            <div>
              <button className="dash-button" type="button" aria-label={l('Previous product', '上一款')}
                disabled={selectedIndex === 0} onClick={() => setSelectedCode(matched[selectedIndex - 1].product.code)}><ChevronLeft size={16}/></button>
              <span>{selectedIndex + 1} / {matched.length}</span>
              <button className="dash-button" type="button" aria-label={l('Next product', '下一款')}
                disabled={selectedIndex === matched.length - 1} onClick={() => setSelectedCode(matched[selectedIndex + 1].product.code)}><ChevronRight size={16}/></button>
            </div>
          </div>
          <div data-selected-comparison={selected.product.code}>
            <h3 aria-live="polite">{productName(selected.product)}</h3>
            <p>{[selected.product.brands, selected.product.quantity_text, subtypeLabel(selected.product.subtype, language)].filter(Boolean).join(' · ')}</p>
            <div className="dash-candidate-price">
              <div><span>{l('Unit price difference', '比参照价')}</span><strong className="dash-price-delta" data-cheaper={selected.cheaper}>{signedDifference(selected.priceDelta)} €/{unit}</strong></div>
              <span className="dash-candidate-percent" data-cheaper={selected.cheaper}>{signedDifference(selected.pct, 1)}%</span>
            </div>
            <dl>
              <div><dt>{l('Historical unit price', '历史单位价')}</dt><dd>{unitPrice(selected.product.representative_price, unit)}</dd></div>
              <div><dt>{l('Nutrition', '营养')}</dt><dd>{renderGrade(reference.nutri_grade, selected.product.nutri_grade, selected.nutrition)}</dd></div>
              <div><dt>{l('Environment', '环境')}</dt><dd>{renderGrade(reference.environment_grade, selected.product.environment_grade, selected.environment)}</dd></div>
              <div><dt>{l('Regular quotes', '常规报价')}</dt><dd>{selected.product.n_valid_regular_offers}</dd></div>
            </dl>
          </div>
          <button className="dash-button dash-primary" type="button" onClick={() => onDetails(selected.product)}>
            {l('View full comparison', '查看完整明细')}<ArrowRight size={16}/>
          </button>
          {matched.length > 1 && <label className="dash-field"><span>{l('Browse order', '逐款浏览顺序')}</span>
            <select value={sort} onChange={event => setSort(event.target.value)}>
              <option value="recommended">{l('Cheaper, no grade drop first', '降价且等级不降优先')}</option>
              <option value="price">{l('Lowest price first', '价格从低到高')}</option>
              <option value="offers">{l('Most regular quotes first', '报价从多到少')}</option>
            </select>
          </label>}
        </aside>
      </div> : <p className="dash-list-empty">{l('No products match these comparison conditions.', '当前比较条件下没有匹配的商品。')}</p>}
    </>}
  </section>;
}
