import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, ChevronRight } from 'lucide-react';
import { LanguageProvider, useI18n } from './i18n';
type Page = 'study' | 'pipeline' | 'dashboard' | 'sources';
const pageFromHash = (): Page => location.hash === '#pipeline' ? 'pipeline' : location.hash === '#dashboard' ? 'dashboard' : location.hash === '#sources' ? 'sources' : 'study';
const repo = 'https://github.com/Tangzy0121/Food-Prices-Nutrition-and-Environmental-Impact';
const DetailedPipeline = lazy(() => import('./DetailedPipeline'));
const Dashboard = lazy(() => import('./Dashboard'));
function Brand() {
    const { t } = useI18n();
    return <a className="brand" href="#study" aria-label={t("Food / Signal, the study")}><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span>{t("Food")} <span className="brand-slash">{t("/")}</span> {t("Signal")}</span></a>;
}
function AppContent() {
    const { t, language, setLanguage } = useI18n();
    const [page, setPage] = useState<Page>(pageFromHash);
    useEffect(() => {
        const navigate = () => { setPage(pageFromHash()); window.scrollTo(0, 0); };
        window.addEventListener('hashchange', navigate);
        return () => window.removeEventListener('hashchange', navigate);
    }, []);
    useEffect(() => { document.title = `Food / Signal · ${page === 'study' ? t("The study") : page === 'pipeline' ? t("Data pipeline") : page === 'dashboard' ? t("Dashboard") : t("Sources")}`; }, [page, t]);
    useEffect(() => { window.scrollTo(0, 0); }, [page]);
    return <div className={`app-shell${page === 'pipeline' ? ' is-pipeline' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>{t("Skip to content")}</a>
    <header className="site-header"><div className="header-inner"><Brand /><nav aria-label={t("Main navigation")}>{([['study', t("The study")], ['pipeline', t("Data pipeline")], ['dashboard', t("Dashboard")], ['sources', t("Sources")]] as const).map(([id, label]) => <a key={id} className={page === id ? 'nav-link active' : 'nav-link'} href={`#${id}`} aria-current={page === id ? 'page' : undefined}>{label}</a>)}</nav><div className="header-actions"><div className="language-switch" role="group" aria-label={t("Language")}><button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button type="button" lang="zh-CN" aria-label="中文" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button></div><a className="repo-link" href={repo} target="_blank" rel="noreferrer">{t("R source")} <ArrowUpRight size={16}/></a></div></div></header>
    <main id="main-content" tabIndex={-1}>{page === 'study' ? <Study /> : page === 'pipeline' ? <Suspense fallback={<div style={{ padding: '64px', color: '#777' }} role="status">{language === 'zh' ? '正在载入完整数据流程…' : 'Loading the complete data flow…'}</div>}><DetailedPipeline /></Suspense> : page === 'dashboard' ? <Suspense fallback={<div className="dashboard-loading" role="status">{language === 'zh' ? '正在载入研究图表…' : 'Loading research charts…'}</div>}><Dashboard /></Suspense> : <Sources />}</main>
    {page !== 'pipeline' && <footer className="site-footer"><div><span>{t("Food / Signal")}</span><span>{t("R for Data Science")}</span></div><p>{t("Open Prices & Open Food Facts contributors")} <span>{t("\u00B7")}</span> {t("ODbL")}</p><a href="#sources">{t("Sources & methodology")} <ArrowUpRight size={14}/></a></footer>}
  </div>;
}
function Study() {
    const { t, language } = useI18n();
    const l = (en: string, zh: string) => language === 'zh' ? zh : en;
    const researchSteps = [
      { title: 'Define the research scope', description: 'Focus on everyday consumers and their trade-offs between budget, nutrition and environmental performance.' },
      { title: 'Review the literature', description: 'Review academic and industry evidence on food affordability, nutritional quality and environmental impact. Use it to refine the research questions and select meaningful indicators.' },
      { title: 'Acquire and prepare the data', description: 'Collect Open Prices quotes and Open Food Facts product attributes. Link them by barcode, standardize package units, check data quality and save reproducible analysis inputs.' },
      { title: 'Explore the data in R', description: 'Examine missing values, price distributions and grade coverage. Use summaries and charts to compare price, nutrition and environmental performance within each food category.' },
      { title: 'Design the dashboard', description: 'Turn the research questions into user tasks. Choose indicators, charts, filters and comparison views, then arrange them in a clear dashboard layout.' },
      { title: 'Build the Shiny application', description: 'Implement the dashboard in R Shiny with category filters, indicator switching, product comparisons and data export. Check that the main user tasks work from start to finish.' },
    ];
    return <div className="study-page page-width">
    <section className="study-intro problem-intro" aria-labelledby="study-title">
      <div className="intro-copy">
        <div className="study-index">{l("Research for everyday consumers", "面向普通消费者的食品研究")}</div>
        <h1 id="study-title">{t("Food prices,")}<br />{t("nutrition &")}<br className="small-only"/>{language === "en" ? " " : ""}{t("environment.")}</h1>
        <p className="intro-description">{l('Growing interest in health and the environment has increased demand for green, healthy foods. Many consumers are willing to pay a premium. When choosing similar foods, we balance price, nutrition and environmental impact: does a higher price come with better ingredients or greener production?', '随着环保与健康意识增强，消费者对食品的营养成分与生产环节提出了更高要求，也愿意为健康或环保认证支付溢价。选购同类食品时，我们需要根据预算在价格、营养与环境影响之间权衡：价格更高，是否意味着生产商投入了更好的营养成分或更环保的生产方式？')}</p><p className="research-note">{l('We use product scores and observed prices to examine this question; the data contain no producer spending records.', '本研究用商品评分与实际报价观察这一问题，数据中没有企业成本或资金用途记录。')}</p>
      </div>
    </section>

    <section className="questions" aria-label={t("Research questions")}><div className="question-row"><span className="row-number">{t("01")}</span><p>{t("Do higher-priced products have better nutritional profiles?")}</p><span className="question-tag">{t("Price \u00D7 nutrition")}</span></div><div className="question-row"><span className="row-number">{t("02")}</span><p>{t("Does a higher price align with better environmental performance?")}</p><span className="question-tag">{t("Price \u00D7 environment")}</span></div><div className="question-row"><span className="row-number">{t("03")}</span><p>{t("Do greener products also have better nutritional profiles?")}</p><span className="question-tag">{t("Environment × nutrition")}</span></div></section>
    <section className="consumer-findings"><h2>{l('What the current sample shows', '当前样本告诉我们什么')}</h2><div className="finding-grid"><article><span>01</span><h3>{l('Higher prices offer different nutritional trade-offs', '高价带来的营养变化因类别而异')}</h3><p>{l('Cereals and dark chocolate show a modest tendency toward better nutrition scores at higher prices. In dark chocolate, lower sugar comes with more saturated fat; its observed grades are still D or E. Biscuits and juice have near-zero price–nutrition correlations.', '早餐谷物与黑巧克力中，较高价格与较好的营养评分有一定关联。黑巧克力随价格上升呈现糖更少、饱和脂肪更多的权衡，样本营养等级仍集中于 D、E。饼干与果汁的价格—营养评分相关接近零。')}</p></article><article><span>02</span><h3>{l('Price is an uneven environmental signal', '价格传递的环保信号并不一致')}</h3><p>{l('Price and environment scores correlate positively for cereals (ρ = 0.307) and dark chocolate (ρ = 0.243), but are close to unrelated for biscuits (0.030) and juice (0.035). The highest-priced product in each category does not have that category’s best observed environmental grade.', '早餐谷物（ρ = 0.307）与黑巧克力（ρ = 0.243）的价格与环境评分呈正相关，饼干（0.030）与果汁（0.035）则接近零。各类别最昂贵的商品均未达到该类别样本中的最佳环境等级。')}</p></article><article><span>03</span><h3>{l('Compare nutrition at similar prices', '在相近价格下比较营养与环境')}</h3><p>{l('Use the joint chart to compare similarly priced products within one category. Environment is on the horizontal axis and nutrition is shown by colour. The third conclusion will be settled after reviewing this view.', '联合图以环境等级为横轴、价格为纵轴、营养等级为颜色，便于在同一类别内比较相近价格的商品。第三条结论留待审阅该图后确定。')}</p><a href="#dashboard">{t('Open dashboard')} <ArrowRight size={16}/></a></article></div></section>
    <section className="research-workflow" aria-labelledby="research-workflow-title">
      <h2 id="research-workflow-title">{t("Research workflow")}</h2>
      <ol className="research-step-list">
        {researchSteps.map((step, index) => <li key={step.title}>
          <span className="research-step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <h3>{t(step.title)}</h3>
          <p>{t(step.description)}</p>
        </li>)}
      </ol>
    </section>
    <div className="study-end"><a className="button primary" href="#dashboard">{t("Open dashboard")} <ArrowRight size={17}/></a><a className="button secondary" href="#pipeline">{t("Open data pipeline")} <ArrowRight size={17}/></a></div>
  </div>;
}
function Sources() {
    const { t, language } = useI18n();
    const l = (en: string, zh: string) => language === 'zh' ? zh : en;
    const resources = [
        { name: 'Open Prices', description: l('Retail price observations · France · EUR · 2024–2025', '零售报价 · 法国 · EUR · 2024–2025 年'), href: 'https://huggingface.co/datasets/openfoodfacts/open-prices' },
        { name: 'Open Food Facts', description: l('Product nutrition, environmental grades and AGRIBALYSE carbon references · retrieved 2 November 2026', '营养资料、环境等级与 AGRIBALYSE 碳估算参考项 · 获取于 2026-11-02'), href: 'https://world.openfoodfacts.org/' },
    ];
    return <div className="sources-page page-width"><div className="breadcrumb"><a href="#study">{t('The study')}</a><ChevronRight size={14}/><span>{t('Sources')}</span></div><h1>{l('Data sources & processing.', '数据来源与处理流程')}</h1><p className="sources-intro">{t('Open Prices and Open Food Facts contributors. Database: ODbL; individual database contents: DbCL. Store geography originates from OpenStreetMap contributors.')}</p><div className="resource-list">{resources.map(r => <a key={r.name} href={r.href} target="_blank" rel="noreferrer"><div><span>{r.name}</span><p>{r.description}</p></div><ArrowUpRight size={20}/></a>)}</div><section className="consumer-processing"><h2>{l('From quotes to comparable products', '从报价到可比较的商品')}</h2><ol><li>{l('Select French EUR food quotes from 2024–2025; remove invalid prices and duplicate observations. Keep discounts separate.', '筛选 2024–2025 年法国 EUR 食品报价，去除无效价格与重复记录，折扣报价另行保留。')}</li><li>{l('Join quotes to product attributes by exact character barcode. Preserve leading zeroes; multiple quotes can belong to one product.', '按字符型条码精确连接商品属性，保留条码前导零；同一商品可对应多条报价。')}</li><li>{l('Standardise package quantities into EUR/kg for solid foods and EUR/L for juice. Use each product’s median valid regular price.', '根据包装净含量统一计价：固体食品 EUR/kg，果汁 EUR/L；每款商品取有效常规报价的中位数。')}</li><li>{l('Select 150 products per category. Exclude two invalid package specifications, leaving 598 products. Match nutrition and environment grades; restore 16 F grades from the saved original objects. Joint comparisons use 583 products.', '四类各入选 150 款，排除两款规格异常商品后保留 598 款；匹配营养与环境等级，并从原始对象恢复 16 款 F 等级。联合比较可用 583 款。')}</li><li>{l('Use R to calculate grade-price distributions, within-category rank correlations and reference-level carbon estimates. The website reads these saved results.', '使用 R 计算等级价格分布、类别内秩相关与参考项碳估算，网页读取已保存的结果。')}</li></ol><p>{l('Historical quotes are linked to product information retrieved on 2 November 2026. Prices and attributes therefore have different reference dates.', '历史报价连接到 2026-11-02 获取的商品资料，价格日期与属性日期分别保留。')}</p><a className="button secondary" href="#pipeline">{l('Explore the processing flow', '查看交互清洗流程')} <ArrowRight size={17}/></a></section><a className="button primary" href={repo} target="_blank" rel="noreferrer">{t('View the R project')} <ArrowUpRight size={17}/></a></div>;
}

export default function App() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}
