import type { ReactNode } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useI18n } from './i18n';
import { environmentGrades, fmt, gradeChange, gradeLabel, nutrientFields, nutritionGrades, productName, signedDifference, subtypeLabel, unitPrice } from './dashboardModel';
import type { Product, Quote } from './dashboardModel';
import { ExportButton, GradeBadge, QuotePlot } from './DashboardVisuals';

export default function DashboardCompare({ first, second, quotes, onBack }: {
  first: Product; second: Product; quotes: Quote[]; onBack: () => void;
}) {
  const { language } = useI18n();
  const label = (en: string, zh: string) => language === 'zh' ? zh : en;
  const unit = first.target_unit;
  const amount = unit === 'L' ? '100 ml' : '100 g';
  const unknown = label('Unavailable', '未提供');
  const difference = (a: number | null, b: number | null, unit: string) => a === null || b === null ? null : signedDifference(b - a) + ' ' + unit;
  const firstQuotes = quotes.filter(q => q.code === first.code);
  const secondQuotes = quotes.filter(q => q.code === second.code);
  const priceChange = second.representative_price - first.representative_price;
  const sameReference = first.carbon_primary && second.carbon_primary &&
    first.agribalyse_food_code === second.agribalyse_food_code &&
    first.agribalyse_proxy_food_code === second.agribalyse_proxy_food_code &&
    first.agribalyse_name === second.agribalyse_name && first.co2_total === second.co2_total;
  const panels = [
    { product: first, name: label('Reference', '参照商品') },
    { product: second, name: label('Compared product', '对比商品') },
  ];
  const renderRow = (name: string, render: (product: Product) => ReactNode, delta?: ReactNode) => <tr key={name}>
    <th scope="row">{name}</th><td>{render(first)}</td><td>{render(second)}{delta && <small className="dash-delta">{delta}</small>}</td>
  </tr>;
  const showNumber = (value: number | null, unit: string) => value === null ? unknown : fmt(value) + ' ' + unit;
  const explainGrade = (from: string | null, to: string | null, grades: string[]) => {
    const change = gradeChange(from, to, grades);
    if (change === 'missing') return label('Incomplete grades', '等级不全');
    if (change === 'same') return gradeLabel(from) + ' · ' + label('unchanged', '持平');
    const direction = change === 'better' ? label('better', '更好') : label('worse', '较差');
    return gradeLabel(from) + ' → ' + gradeLabel(to) + ' · ' + direction;
  };
  const sameType = first.subtype && first.subtype === second.subtype;
  const oneQuote = [first, second].filter(product => product.n_valid_regular_offers === 1);

  return <section className="dash-compare">
    <div className="dash-section-head">
      <h2>{label('Comparison details', '商品对比明细')}</h2>
      <button type="button" className="dash-button" onClick={onBack}><ArrowLeft size={16}/>{label('Back to comparisons', '返回对比结果')}</button>
    </div>
    <div className="dash-pair">
      {panels.map(({ product, name }, i) => <section key={name} className={`dash-pair-panel pair-${i}`} data-detail-product={product.code}>
          <span className="dash-pair-role">{name}</span>
          <h3 className="dash-pair-name">{productName(product)}</h3>
          <p className="dash-pair-meta">{[product.brands, product.quantity_text, subtypeLabel(product.subtype, language)].filter(Boolean).join(' · ')}</p>
          <p className="dash-pair-price">{unitPrice(product.representative_price, unit)}</p>
          <div className="dash-pair-grades">
            <span><GradeBadge grade={product.nutri_grade}/>{label('Nutrition', '营养')}</span>
            <span><GradeBadge grade={product.environment_grade}/>{label('Environment', '环境')}</span>
          </div>
      </section>)}
    </div>
    <div className="dash-comparison-summary" role="status">
      <dl className="dash-comparison-note">
        <div><dt>{label('Historical unit price difference', '历史单位价差')}</dt><dd>{signedDifference(priceChange)} €/{unit} ({signedDifference(100 * priceChange / first.representative_price, 1)}%)</dd></div>
        <div><dt>{label('Nutrition grade', '营养等级')}</dt><dd>{explainGrade(first.nutri_grade, second.nutri_grade, nutritionGrades)}</dd></div>
        <div><dt>{label('Environmental grade', '环境等级')}</dt><dd>{explainGrade(first.environment_grade, second.environment_grade, environmentGrades)}</dd></div>
      </dl>
      {!sameType && <p>{first.subtype && second.subtype
        ? label('These products belong to different food types. Check whether the pack size and intended use suit your comparison.', '两款商品分属不同细分类。比较前可核对规格和食用方式。')
        : label('One or both food types are unclassified. Check the pack sizes and intended use.', '至少一款商品的细分类未知。比较前可核对规格和食用方式。')}</p>}
      {oneQuote.length > 0 && <p>{oneQuote.length === 2
        ? label('Each historical unit price is based on one regular quote.', '两款商品的历史单位价格各基于一条常规报价。')
        : oneQuote[0]?.code === first.code
          ? label('The reference price is based on one regular quote.', '参照商品的历史单位价格基于一条常规报价。')
          : label('The compared price is based on one regular quote.', '对比商品的历史单位价格基于一条常规报价。')}</p>}
    </div>
      <section className="dash-evidence-section">
        <div className="dash-section-head"><h2>{label('Nutrition and environment', '营养与环境')}</h2><span className="dash-muted">{label('Nutrition per ', '营养成分每 ')}{amount}</span></div>
        <div className="dash-table-wrap">
          <table className="dash-table dash-comparison-table">
            <thead><tr><th scope="col">{label('Measure', '指标')}</th><th scope="col">{label('Reference', '参照商品')}</th><th scope="col">{label('Compared product', '对比商品')}</th></tr></thead>
            <tbody>
              {renderRow(label('Package', '包装规格'), p => p.quantity_text ?? unknown)}
              {renderRow(label('Nutrition grade', '营养等级'), p => <GradeBadge grade={p.nutri_grade}/>)}
              {renderRow(label('Environmental grade', '环境等级'), p => <GradeBadge grade={p.environment_grade}/>)}
              {nutrientFields.map(([key, en, zh, measureUnit]) => {
                const max = Math.max(first[key] ?? 0, second[key] ?? 0, .01);
                return renderRow(label(en, zh), p => <div className="dash-nutrient-value">
                  <span>{showNumber(p[key], measureUnit)}</span>
                  {p[key] !== null && <span className="dash-nutrient-track" aria-hidden="true"><i style={{ width: `${100 * p[key]! / max}%` }}/></span>}
                </div>, difference(first[key], second[key], measureUnit));
              })}
              {renderRow(label('Carbon estimate', '碳估算'), p => showNumber(p.carbon_primary ? p.co2_total : null, 'kg CO₂e/kg'))}
              {renderRow(label('Food reference', '标准食品参考项'), p => p.carbon_primary ? p.agribalyse_name ?? unknown : unknown)}
            </tbody>
          </table>
        </div>
        <p className="dash-footnote">{sameReference
          ? label('Both products share the same AGRIBALYSE 3.2 food reference and carbon estimate.', '两款商品共享同一个 AGRIBALYSE 3.2 食品参考项与碳估算。')
          : label('Carbon estimates describe AGRIBALYSE 3.2 standard food references, in kg CO₂e per kg of food.', '碳估算来自 AGRIBALYSE 3.2 标准食品参考项，单位为 kg CO₂e/kg 食品。')}</p>
      </section>
      <section className="dash-evidence-section">
        <div className="dash-section-head"><h2>{label('Historical quotes', '历史报价')}</h2><span className="dash-muted">{label('France · 2024–2025', '法国 · 2024–2025 年')}</span></div>
        <div className="dash-table-wrap">
          <table className="dash-table dash-comparison-table">
            <thead><tr><th scope="col">{label('Price evidence', '价格依据')}</th><th scope="col">{label('Reference', '参照商品')}</th><th scope="col">{label('Compared product', '对比商品')}</th></tr></thead>
            <tbody>
              {renderRow(label('Valid regular quotes', '有效常规报价'), p => p.n_valid_regular_offers)}
              {renderRow(label('Known stores', '已知门店数'), p => p.n_stores)}
              {renderRow(label('Recorded dates', '报价日期'), p => p.first_price_date === p.last_price_date ? p.first_price_date : <>{p.first_price_date}<br/>{p.last_price_date}</>)}
            </tbody>
          </table>
        </div>
        <div className="dash-legend quote-legend"><span><i className="dash-key quote-first"/>{label('Reference', '参照商品')}</span><span><i className="dash-key reference"/>{label('Compared product', '对比商品')}</span><span><i className="dash-key excluded"/>{label('Outside the median', '未计入中位价')}</span></div>
        <QuotePlot first={firstQuotes} second={secondQuotes} unit={unit}/>
        <details className="dash-details">
          <summary>{label('View quote records', '查看报价明细')} <ChevronDown size={16}/></summary>
          <div className="dash-record-toolbar"><ExportButton rows={[...firstQuotes, ...secondQuotes]} file="food-signal-quotes" label={label('Export quote records', '导出报价明细')}/></div>
          <div className="dash-table-wrap" tabIndex={0} role="region" aria-label={label('Quote records', '报价明细')}>
            <table className="dash-table dash-quote-table">
              <thead><tr>{[label('Product', '商品'), label('Date', '日期'), label('Location', '门店'), label('Price per package', '整包价格'), label('Unit price', '单位价格'), label('Price basis', '价格口径')].map(name => <th key={name} scope="col">{name}</th>)}</tr></thead>
              <tbody>{[...firstQuotes, ...secondQuotes].map(quote => <tr key={quote.id}>
                <th scope="row">{quote.code === first.code ? label('Reference', '参照商品') : label('Compared product', '对比商品')}</th>
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
