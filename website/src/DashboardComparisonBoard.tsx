import { Fragment, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, CircleHelp, Minus } from 'lucide-react';
import { useI18n } from './i18n';
import { environmentGrades, gradeChange, gradeLabel, nutritionGrades, productName, subtypeLabel, unitPrice } from './dashboardModel';
import type { Product, Quote } from './dashboardModel';
import type { PriceRange } from './DashboardMarketChart';
import DashboardCompare from './DashboardCompare';
import { ExportButton, GradeBadge, GradeMetricIcon } from './DashboardVisuals';

const PREVIEW_COUNT = 5;
const DEFAULT_CRITERIA = { lowerPrice: true, nutrition: true, environment: true };
type GradeChange = ReturnType<typeof gradeChange>;
const maintainsGrade = (change: GradeChange) => change === 'same' || change === 'better';
const gradeChangeIcons = { same: Minus, better: ArrowUp, worse: ArrowDown, missing: CircleHelp };

export default function DashboardComparisonBoard({ reference, options, products, quotes, range, onReference }: {
  reference?: Product; options: Product[]; products: Product[]; quotes: Quote[]; range?: PriceRange;
  onReference: (product?: Product) => void;
}) {
  const { language } = useI18n();
  const l = (en: string, zh: string) => language === 'zh' ? zh : en;
  const [allTypes, setAllTypes] = useState(false);
  const [useRange, setUseRange] = useState(true);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [expanded, setExpanded] = useState(false);
  const [openCode, setOpenCode] = useState<string>();
  const clearButton = useRef<HTMLButtonElement>(null);
  const resultId = useId();
  const detailId = useId();
  const count = (n: number) => n.toLocaleString(language === 'zh' ? 'zh-CN' : 'en');

  const sameType = Boolean(reference?.subtype && !allTypes);
  const unit = reference?.target_unit ?? products[0].target_unit;
  const ordered = [...options].sort((a, b) => productName(a).localeCompare(productName(b)));
  const rows = reference ? products
    .filter(p => p.code !== reference.code && (!sameType || p.subtype === reference.subtype) &&
      (!range || !useRange || (p.representative_price >= range[0] && p.representative_price <= range[1])))
    .map(product => {
      const priceDelta = product.representative_price - reference.representative_price;
      const nutrition = gradeChange(reference.nutri_grade, product.nutri_grade, nutritionGrades);
      const environment = gradeChange(reference.environment_grade, product.environment_grade, environmentGrades);
      return { product, priceDelta, nutrition, environment };
    }).sort((a, b) => a.priceDelta - b.priceDelta || productName(a.product).localeCompare(productName(b.product))) : [];
  const matched = rows.filter(row =>
    (!criteria.lowerPrice || row.priceDelta < -1e-9) &&
    (!criteria.nutrition || maintainsGrade(row.nutrition)) &&
    (!criteria.environment || maintainsGrade(row.environment)));
  const hasCriteria = criteria.lowerPrice || criteria.nutrition || criteria.environment;
  const visible = expanded ? matched : matched.slice(0, PREVIEW_COUNT);
  const maxDelta = Math.max(.01, ...matched.map(row => Math.abs(row.priceDelta)));
  const zero = criteria.lowerPrice ? 100 : 50;
  const allLabel = sameType ? l('All in this food type', '全部同类') : l('All in this category', '同大类全部商品');
  const criterionOptions = [
    ['lowerPrice', l('Lower unit price', '单位价更低')],
    ['nutrition', l('Nutrition grade holds or improves', '营养等级不降')],
    ['environment', l('Environmental grade holds or improves', '环境等级不降')],
  ] as const;
  const effects = {
    same: l('Same', '持平'), better: l('Improved', '提升'), worse: l('Lower', '下降'), missing: l('Unknown', '未知'),
  };
  const exportRows = reference ? matched.map(row => ({
    reference_code: reference.code,
    reference_unit_price: reference.representative_price,
    product_code: row.product.code,
    product_name: productName(row.product),
    unit_price: row.product.representative_price,
    price_unit: 'EUR/' + unit,
    price_difference: row.priceDelta,
    price_difference_pct: row.priceDelta / reference.representative_price * 100,
    nutrition_grade: row.product.nutri_grade,
    nutrition_change: row.nutrition,
    environment_grade: row.product.environment_grade,
    environment_change: row.environment,
    regular_quotes: row.product.n_valid_regular_offers,
  })) : [];

  function resetList() {
    setExpanded(false);
    setOpenCode(undefined);
  }

  function clearCriteria() {
    if (!hasCriteria) return;
    setCriteria({ lowerPrice: false, nutrition: false, environment: false });
    resetList();
  }

  function renderGrade(before: string | null, after: string | null, change: GradeChange) {
    const Icon = gradeChangeIcons[change];
    return <span className="dash-grade-change" data-change={change}>
      <span>{gradeLabel(before)} <span aria-hidden="true">→</span><span className="sr-only">{l('to', '变为')}</span> {gradeLabel(after)}</span>
      <span className="dash-grade-effect" title={effects[change]}>
        <Icon size={14} aria-hidden="true"/><span className="sr-only">{effects[change]}</span>
      </span>
    </span>;
  }

  return <section className="dash-comparison-board" aria-label={l('Product comparison', '商品对比')}>
    <div className="dash-compare-reference" data-reference={reference?.code}>
      {reference && <div className="dash-compare-baseline">
        <div>
          <p className="dash-compare-label">{l('Reference product', '参照商品')}</p>
          <h2>{productName(reference)}</h2>
          <p className="dash-compare-meta">{[reference.brands, reference.quantity_text, subtypeLabel(reference.subtype, language)].filter(Boolean).join(' · ')}</p>
        </div>
        <dl>
          <div><dt>{l('Historical unit price', '历史单位价')}</dt><dd>{unitPrice(reference.representative_price, unit)}</dd></div>
          <div><dt><GradeMetricIcon metric="nutrition"/></dt><dd><GradeBadge grade={reference.nutri_grade}/></dd></div>
          <div><dt><GradeMetricIcon metric="environment"/></dt><dd><GradeBadge grade={reference.environment_grade}/></dd></div>
        </dl>
      </div>}
      <div className="dash-compare-toolbar">
        <label className="dash-field dash-reference-select">
          <span>{reference ? l('Change reference', '更换参照') : l('Reference product', '参照商品')}</span>
          <select value={reference?.code ?? ''} onChange={event => {
            onReference(ordered.find(p => p.code === event.target.value));
            setAllTypes(false);
            setUseRange(true);
            resetList();
          }}>
            <option value="">{l('Choose a reference', '选择一款参照商品')}</option>
            {ordered.map(p => <option key={p.code} value={p.code}>{productName(p)} · {unitPrice(p.representative_price, unit)}</option>)}
          </select>
        </label>
        {reference && <>
          <label className="dash-field dash-compare-scope">
            <span>{l('Comparison scope', '比较范围')}</span>
            <select value={sameType ? 'type' : 'category'} disabled={!reference.subtype}
              onChange={event => {
                setAllTypes(event.target.value === 'category');
                resetList();
              }}>
              {reference.subtype && <option value="type">{l('Same food type', '同一细分类')} · {subtypeLabel(reference.subtype, language)}</option>}
              <option value="category">{l('Same food category', '同一食品大类')}</option>
            </select>
          </label>
          {range && <label className="dash-check-field">
            <input type="checkbox" checked={useRange} onChange={event => {
              setUseRange(event.target.checked);
              resetList();
            }}/>
            <span>{l('Use selected price range', '沿用价格区间')}<small>€{range[0].toFixed(2)}–{range[1].toFixed(2)}/{unit}</small></span>
          </label>}
        </>}
      </div>
    </div>
    {reference && <section className="dash-comparison-results" aria-labelledby={resultId}>
      <div className="dash-comparison-results-head">
        <div>
          <h2 id={resultId}>{l('Alternatives', '候选商品')}</h2>
          <p role="status">
            <strong>{count(matched.length)}</strong> {hasCriteria
              ? l('match your filters, from lowest unit price', '款符合条件，按单位价从低到高')
              : l('alternatives, from lowest unit price', '款候选商品，按单位价从低到高')}
          </p>
        </div>
        <div className="dash-comparison-filters" role="group" aria-label={l('Filter alternatives', '候选商品筛选')}>
          {criterionOptions.map(([key, name]) => <label key={key}>
            <input type="checkbox" checked={criteria[key]} onChange={event => {
              const checked = event.target.checked;
              setCriteria(current => ({ ...current, [key]: checked }));
              resetList();
            }}/>{name}
          </label>)}
          <button ref={clearButton} type="button" className="dash-button" aria-pressed={!hasCriteria} onClick={clearCriteria}>{allLabel}</button>
        </div>
      </div>
      {visible.length ? <div className="dash-alternatives-frame">
        <table className="dash-alternatives" role="table" aria-labelledby={resultId} data-diverging={!criteria.lowerPrice}>
          <thead role="rowgroup"><tr role="row">
            <th role="columnheader" scope="col">{l('Product', '商品')}</th>
            <th role="columnheader" scope="col">
              {l('Unit price vs. reference', '相对参照的单位价差')}
              <span className="dash-price-zero-label" aria-hidden="true">{l('Reference', '参照价')}</span>
            </th>
            <th role="columnheader" scope="col">{l('Nutrition grade', '营养等级')}</th>
            <th role="columnheader" scope="col">{l('Environment grade', '环境等级')}</th>
          </tr></thead>
          <tbody role="rowgroup">{visible.map(({ product, priceDelta, nutrition, environment }) => {
            const active = product.code === openCode;
            const direction = priceDelta < -1e-9 ? 'lower' : priceDelta > 1e-9 ? 'higher' : 'same';
            const magnitude = Math.abs(priceDelta);
            const difference = unitPrice(Math.max(.01, magnitude), unit);
            const underCent = magnitude < .01;
            const priceText = {
              lower: l('Save ' + (underCent ? '< ' : '') + difference, '省 ' + (underCent ? '不到 ' : '') + difference),
              higher: l((underCent ? '< ' : '') + difference + ' more', '贵 ' + (underCent ? '不到 ' : '') + difference),
              same: l('Same price', '价格持平'),
            };
            const width = magnitude / maxDelta * zero;
            return <Fragment key={product.code}>
              <tr role="row" className="dash-alternative" data-product={product.code} data-active={active}>
                <th role="rowheader" scope="row">
                  <button type="button" aria-expanded={active} aria-controls={active ? detailId : undefined}
                    onClick={() => setOpenCode(active ? undefined : product.code)}>
                    <span>
                      <strong>{productName(product)}</strong>
                      <small>{[product.brands, product.quantity_text, !sameType && subtypeLabel(product.subtype, language)].filter(Boolean).join(' · ')}</small>
                    </span>
                    <ChevronDown size={16} aria-hidden="true"/>
                  </button>
                </th>
                <td role="cell" className="dash-alternative-price" data-direction={direction}>
                  <strong>{priceText[direction]}</strong>
                  <span className="dash-price-track" aria-hidden="true">
                    {direction !== 'same' && <i style={{ left: direction === 'lower' ? zero - width + '%' : zero + '%', width: width + '%' }}/>}
                  </span>
                </td>
                <td role="cell"><span className="dash-alternative-mobile-label" aria-hidden="true"><GradeMetricIcon metric="nutrition"/></span>
                  {renderGrade(reference.nutri_grade, product.nutri_grade, nutrition)}</td>
                <td role="cell"><span className="dash-alternative-mobile-label" aria-hidden="true"><GradeMetricIcon metric="environment"/></span>
                  {renderGrade(reference.environment_grade, product.environment_grade, environment)}</td>
              </tr>
              {active && <tr role="row" className="dash-alternative-details"><td role="cell" colSpan={4}>
                <DashboardCompare id={detailId} first={reference} second={product} quotes={quotes}/>
              </td></tr>}
            </Fragment>;
          })}</tbody>
        </table>
        <div className="dash-alternatives-footer">
          {matched.length > PREVIEW_COUNT && <button className="dash-button" type="button" aria-expanded={expanded}
            onClick={event => {
              if (expanded) {
                event.currentTarget.closest('.dash-comparison-results')?.scrollIntoView({ block: 'start' });
                setOpenCode(undefined);
              }
              setExpanded(!expanded);
            }}>{expanded ? l('Show first five', '收起至前 5 款') : l('Show all ' + count(matched.length), '展开全部 ' + count(matched.length) + ' 款')}<ChevronDown size={15}/>
          </button>}
          <ExportButton rows={exportRows} file="food-signal-reference-comparison" label={l('Export comparison results', '导出对比结果')}/>
        </div>
      </div> : <div className="dash-list-empty dash-comparison-empty">
        <p>{rows.length ? l('Adjust your filters or view all alternatives.', '可调整筛选条件，或查看其他候选商品。') :
          l('No other products match the current scope and price range.', '当前比较范围与价格区间内没有其他商品。')}</p>
        {hasCriteria && rows.length > 0 && <button className="dash-button" type="button" onClick={() => {
          clearCriteria();
          clearButton.current?.focus();
        }}>
          {sameType ? l('View all alternatives', '查看全部同类') : l('View all alternatives', '查看同大类全部商品')}
        </button>}
      </div>}
    </section>}
  </section>;
}
