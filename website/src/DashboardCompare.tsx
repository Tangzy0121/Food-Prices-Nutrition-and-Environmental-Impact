import { ChevronDown } from 'lucide-react';
import { useI18n } from './i18n';
import { fmt, median, nutrientFields, signedDifference, unitPrice } from './dashboardModel';
import type { Product, Quote } from './dashboardModel';
import { ExportButton } from './DashboardVisuals';

export default function DashboardCompare({ id, first, second, quotes }: {
  id: string; first: Product; second: Product; quotes: Quote[];
}) {
  const { language } = useI18n();
  const label = (en: string, zh: string) => language === 'zh' ? zh : en;
  const unit = first.target_unit;
  const amount = unit === 'L' ? '100 ml' : '100 g';
  const reference = label('Reference', '参照商品');
  const compared = label('Compared product', '对比商品');
  const unknown = label('Unavailable', '未提供');
  const showNumber = (value: number | null, measureUnit: string) =>
    value === null ? unknown : fmt(value) + ' ' + measureUnit;
  const pairs = [first, second].map(product => {
    const records = quotes.filter(quote => quote.code === product.code);
    const regular = records.filter(quote => quote.kept && !quote.discounted);
    return { product, records, regular };
  });
  const [referenceCount, comparedCount] = pairs.map(pair => pair.regular.length);
  const priceRecords = pairs.flatMap(pair => pair.records);
  const purchaseRows = [
    [label('Median pack price', '历史整包中位价'), pairs.map(({ regular }) =>
      regular.length ? '€' + median(regular.map(quote => quote.package_price)).toFixed(2) : unknown)],
    [label('Pack size', '包装规格'), pairs.map(({ product }) => product.quantity_text ?? unknown)],
    [label('Median unit price', '历史单位中位价'), pairs.map(({ product }) => unitPrice(product.representative_price, unit))],
  ] as const;
  const carbonRefs = [first, second].map(product => product.carbon_primary ? product.agribalyse_name : null);
  const sharedCarbonRef = first.carbon_primary && second.carbon_primary && carbonRefs[0] &&
    first.agribalyse_food_code === second.agribalyse_food_code &&
    first.agribalyse_proxy_food_code === second.agribalyse_proxy_food_code &&
    carbonRefs[0] === carbonRefs[1];

  function renderMeasurement(name: string, before: number | null, after: number | null, measureUnit: string) {
    const max = Math.max(before ?? 0, after ?? 0) || 1;
    const delta = before === null || after === null ? null : after - before;
    return <tr key={name}>
      <th scope="row">{name}</th>
      <td>
        <div className="dash-nutrient-values">
          <span><span className="sr-only">{reference} </span>{showNumber(before, measureUnit)}</span>
          <span><span className="sr-only">{compared} </span>{showNumber(after, measureUnit)}</span>
        </div>
        {(before !== null || after !== null) && <div className="dash-nutrient-track" aria-hidden="true">
          {before !== null && <i className="dash-nutrient-bar" style={{ width: 100 * before / max + '%' }}/>}
          {after !== null && <i className="dash-nutrient-bar compared" style={{ width: 100 * after / max + '%' }}/>}
        </div>}
      </td>
      <td className="dash-nutrient-delta">
        {delta === null ? <><span aria-hidden="true">—</span><span className="sr-only">{unknown}</span></>
          : delta === 0 ? label('Same', '持平') : signedDifference(delta) + ' ' + measureUnit}
      </td>
    </tr>;
  }

  return <section id={id} className="dash-compare" aria-label={label('Comparison details', '商品对比明细')}>
    <section className="dash-evidence-section">
      <div className="dash-section-head">
        <h3>{label('Nutrition and environment', '营养与环境')}</h3>
        <span className="dash-muted">{label('Nutrition per ', '营养成分每 ')}{amount}</span>
      </div>
      <div className="dash-table-wrap">
        <table className="dash-table dash-comparison-table dash-nutrient-table">
          <thead><tr>
            <th scope="col">{label('Measure', '指标')}</th>
            <th scope="col"><div className="dash-nutrient-values">
              <span className="dash-nutrient-key">{label('Reference', '参照')}</span>
              <span className="dash-nutrient-key compared">{label('Compared', '对比')}</span>
            </div></th>
            <th scope="col">{label('Difference', '差值')}<span className="sr-only">{label(' (compared minus reference)', '（对比减参照）')}</span></th>
          </tr></thead>
          <tbody>
            {nutrientFields.map(([key, en, zh, measureUnit]) => renderMeasurement(label(en, zh), first[key], second[key], measureUnit))}
            {renderMeasurement(label('Carbon estimate', '碳估算'), first.carbon_primary ? first.co2_total : null,
              second.carbon_primary ? second.co2_total : null, 'kg CO₂e/kg')}
          </tbody>
        </table>
      </div>
      <p className="dash-footnote">
        {sharedCarbonRef
          ? label(`Both carbon estimates use the AGRIBALYSE 3.2 reference ${carbonRefs[0]}.`,
            `两款商品的碳估算均采用 AGRIBALYSE 3.2 的食品参考项 ${carbonRefs[0]}。`)
          : label('Carbon estimates use AGRIBALYSE 3.2 standard food references.', '碳估算来自 AGRIBALYSE 3.2 标准食品参考项。')}
        {!sharedCarbonRef && carbonRefs.some(Boolean) && <span className="dash-carbon-references">
          {reference} {carbonRefs[0] ?? unknown} · {compared} {carbonRefs[1] ?? unknown}
        </span>}
      </p>
    </section>
    <section className="dash-evidence-section">
      <div className="dash-section-head"><h3>{label('Pack price and size', '整包价格与规格')}</h3></div>
      <div className="dash-table-wrap">
        <table className="dash-table dash-comparison-table dash-purchase-table">
          <thead><tr><th scope="col">{label('Measure', '指标')}</th><th scope="col">{reference}</th><th scope="col">{compared}</th></tr></thead>
          <tbody>{purchaseRows.map(([name, values]) => <tr key={name}>
            <th scope="row">{name}</th><td>{values[0]}</td><td>{values[1]}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="dash-footnote">{label(
        `Regular quotes used for the medians · Reference ${referenceCount} · Compared ${comparedCount}`,
        `中位价基于有效常规报价，参照商品 ${referenceCount} 条，对比商品 ${comparedCount} 条。`
      )}</p>
      <details className="dash-details">
        <summary>{label('View quote records', '查看报价明细')} <ChevronDown size={16}/></summary>
        <div className="dash-record-toolbar"><ExportButton rows={priceRecords} file="food-signal-quotes" label={label('Export quote records', '导出报价明细')}/></div>
        <div className="dash-table-wrap" tabIndex={0} role="region" aria-label={label('Quote records', '报价明细')}>
          <table className="dash-table dash-quote-table">
            <thead><tr>{[label('Product', '商品'), label('Date', '日期'), label('Location', '门店'), label('Pack price', '整包价格'), label('Unit price', '单位价格'), label('Price basis', '价格口径')].map(name => <th key={name} scope="col">{name}</th>)}</tr></thead>
            <tbody>{priceRecords.map(quote => <tr key={quote.id}>
              <th scope="row">{quote.code === first.code ? reference : compared}</th>
              <td>{quote.date}</td><td>{[quote.city, quote.store ? '#' + quote.store : null].filter(Boolean).join(' · ') || unknown}</td>
              <td>€{quote.package_price.toFixed(2)}</td><td>{unitPrice(quote.unit_price, unit)}</td>
              <td>{quote.discounted ? label('Discounted', '折扣报价') : quote.kept ? label('Used in median', '计入中位价') : label('Duplicate quote', '重复报价')}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </details>
    </section>
  </section>;
}
