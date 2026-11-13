import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, Download, ChevronRight } from 'lucide-react';
import { LanguageProvider, useI18n } from './i18n';
type Page = 'study' | 'pipeline' | 'sources';
const pageFromHash = (): Page => location.hash === '#pipeline' ? 'pipeline' : location.hash === '#sources' ? 'sources' : 'study';
const repo = 'https://github.com/Tangzy0121/Food-Prices-Nutrition-and-Environmental-Impact';
const DetailedPipeline = lazy(() => import('./DetailedPipeline'));
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
    useEffect(() => { document.title = `Food / Signal · ${page === 'study' ? t("The study") : page === 'pipeline' ? t("Data pipeline") : t("Sources")}`; }, [page, t]);
    useEffect(() => { window.scrollTo(0, 0); }, [page]);
    return <div className={`app-shell${page === 'pipeline' ? ' is-pipeline' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>{t("Skip to content")}</a>
    <header className="site-header"><div className="header-inner"><Brand /><nav aria-label={t("Main navigation")}>{([['study', t("The study")], ['pipeline', t("Data pipeline")], ['sources', t("Sources")]] as const).map(([id, label]) => <a key={id} className={page === id ? 'nav-link active' : 'nav-link'} href={`#${id}`} aria-current={page === id ? 'page' : undefined}>{label}</a>)}</nav><div className="header-actions"><div className="language-switch" role="group" aria-label={t("Language")}><button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button type="button" lang="zh-CN" aria-label="中文" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button></div><a className="repo-link" href={repo} target="_blank" rel="noreferrer">{t("R source")} <ArrowUpRight size={16}/></a></div></div></header>
    <main id="main-content" tabIndex={-1}>{page === 'study' ? <Study /> : page === 'pipeline' ? <Suspense fallback={<div style={{ padding: '64px', color: '#777' }} role="status">{language === 'zh' ? '正在载入完整数据流程…' : 'Loading the complete data flow…'}</div>}><DetailedPipeline /></Suspense> : <Sources />}</main>
    {page !== 'pipeline' && <footer className="site-footer"><div><span>{t("Food / Signal")}</span><span>{t("R for Data Science")}</span></div><p>{t("Open Prices & Open Food Facts contributors")} <span>{t("\u00B7")}</span> {t("ODbL")}</p><a href="#sources">{t("Sources & methodology")} <ArrowUpRight size={14}/></a></footer>}
  </div>;
}
function Study() {
    const { t, language } = useI18n();
    const researchSteps = [
      { title: 'Define the research scope', description: 'Choose food retail as the industry, identify consumers and category analysts as the audience, and frame the questions about price, nutrition and environmental performance.' },
      { title: 'Review the literature', description: 'Review academic and industry evidence on food affordability, nutritional quality and environmental impact. Use it to refine the research questions and select meaningful indicators.' },
      { title: 'Acquire and prepare the data', description: 'Collect Open Prices quotes and Open Food Facts product attributes. Link them by barcode, standardize package units, check data quality and save reproducible analysis inputs.' },
      { title: 'Explore the data in R', description: 'Examine missing values, price distributions and grade coverage. Use summaries and charts to compare price, nutrition and environmental performance within each food category.' },
      { title: 'Design the dashboard', description: 'Turn the research questions into user tasks. Choose indicators, charts, filters and comparison views, then arrange them in a clear dashboard layout.' },
      { title: 'Build the Shiny application', description: 'Implement the dashboard in R Shiny with category filters, indicator switching, product comparisons and data export. Check that the main user tasks work from start to finish.' },
      { title: 'Write the final report', description: 'Bring together the literature, data, methods and findings. Explain implications for consumers and retailers, document limitations and references, and include team contributions and individual reflections.' },
      { title: 'Present and demonstrate', description: 'Prepare a 10–15 minute presentation of the research questions, key evidence and findings. Demonstrate the Shiny application and discuss the results during questions.' },
    ];
    return <div className="study-page page-width">
    <section className="study-intro problem-intro" aria-labelledby="study-title">
      <div className="intro-copy">
        <div className="study-index">{t("Research problem")}</div>
        <h1 id="study-title">{t("Food prices,")}<br />{t("nutrition &")}<br className="small-only"/>{language === "en" ? " " : ""}{t("environment.")}</h1>
        <p className="intro-description">{t("When choosing similar foods, consumers balance their budget with nutritional quality and environmental impact. Does a higher price mean a better product?")}</p>
      </div>
    </section>

    <section className="questions" aria-label={t("Research questions")}><div className="question-row"><span className="row-number">{t("01")}</span><p>{t("Do higher-priced products have better nutritional profiles?")}</p><span className="question-tag">{t("Price \u00D7 nutrition")}</span></div><div className="question-row"><span className="row-number">{t("02")}</span><p>{t("Does a higher price align with better environmental performance?")}</p><span className="question-tag">{t("Price \u00D7 environment")}</span></div><div className="question-row"><span className="row-number">{t("03")}</span><p>{t("Which lower-priced alternatives offer comparable or better nutrition and environmental performance?")}</p><span className="question-tag">{t("Within-category comparison")}</span></div></section>
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
    <div className="study-end"><a className="button secondary" href="#pipeline">{t("Open data pipeline")} <ArrowRight size={17}/></a></div>
  </div>;
}
function Sources() {
    const { t } = useI18n();
    const resources = [
        { name: 'Open Prices', description: t("Retail price observations, France \u00B7 EUR \u00B7 2024\u20132025"), href: 'https://huggingface.co/datasets/openfoodfacts/open-prices', external: true },
        { name: 'Open Food Facts', description: t("Product attributes and scoring data, retrieved 2 November 2026"), href: 'https://world.openfoodfacts.org/', external: true },
        { name: t("Data description"), description: t("Sources, selection, units and analytical definitions"), href: '/evidence/data_description.md' },
        { name: t("Barcode-link examples"), description: t("Four real quote rows for three products, including a leading-zero barcode"), href: '/evidence/link-examples.csv' },
        { name: t("Corrected indicator coverage"), description: t("View-specific sample sizes from the executed R analysis"), href: '/evidence/coverage.csv' },
        { name: t("Environmental grade correction"), description: t("Recovery of 16 F grades from the saved product objects"), href: '/evidence/environment_grade_correction.md' },
        { name: t("Presentation snapshot"), description: t("The data behind this website, exported as JSON"), href: '/evidence/presentation.json' },
        { name: t("Complete processing trace"), description: t("56 operations with before/after record excerpts and exact R source lines"), href: '/evidence/processing-trace.json' },
    ];
    return <div className="sources-page page-width"><div className="breadcrumb"><a href="#study">{t("The study")}</a><ChevronRight size={14}/><span>{t("Sources")}</span></div><h1>{t("Sources & methodology.")}</h1><p className="sources-intro">{t("The presentation reads saved outputs. Data preparation, validation and analysis are implemented in R.")}</p><div className="resource-list">{resources.map(r => <a key={r.name} href={r.href} download={!r.external} target={r.external ? '_blank' : undefined} rel={r.external ? 'noreferrer' : undefined}><div><span>{r.name}</span><p>{r.description}</p></div>{r.external ? <ArrowUpRight size={20}/> : <Download size={19}/>}</a>)}</div><div className="method-notes"><div><span>{t("Linking rule")}</span><p>{t("Exact character-barcode equality. Multiple price records link to one product record. Package quantities then make prices comparable within each category.")}</p></div><div><span>{t("Time reference")}</span><p>{t("Historical 2024\u20132025 quotes are linked to product information retrieved in November 2026. Quote dates and product-retrieval dates stay separate.")}</p></div><div><span>{t("Attribution")}</span><p>{t("Open Prices and Open Food Facts contributors. Database: ODbL; individual database contents: DbCL. Store geography originates from OpenStreetMap contributors.")}</p></div></div><a className="button primary" href={repo} target="_blank" rel="noreferrer">{t("View the R project")} <ArrowUpRight size={17}/></a></div>;
}

export default function App() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}
