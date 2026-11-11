import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, Database, Download, GitMerge, Layers3, ScanLine, Table2, ChevronRight } from 'lucide-react';
import { data, number, categoryNames } from './workflow';
import { LanguageProvider, useI18n } from './i18n';
type Page = 'study' | 'pipeline' | 'sources';
const pageFromHash = (): Page => location.hash === '#pipeline' ? 'pipeline' : location.hash === '#sources' ? 'sources' : 'study';
const money = (n: number) => new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
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
    return <>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>{t("Skip to content")}</a>
    <header className="site-header"><div className="header-inner"><Brand /><nav aria-label={t("Main navigation")}>{([['study', t("The study")], ['pipeline', t("Data pipeline")], ['sources', t("Sources")]] as const).map(([id, label]) => <a key={id} className={page === id ? 'nav-link active' : 'nav-link'} href={`#${id}`} aria-current={page === id ? 'page' : undefined}>{label}</a>)}</nav><div className="header-actions"><div className="language-switch" role="group" aria-label={t("Language")}><button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button type="button" lang="zh-CN" aria-label="中文" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button></div><a className="repo-link" href={repo} target="_blank" rel="noreferrer">{t("R source")} <ArrowUpRight size={16}/></a></div></div></header>
    <main id="main-content" tabIndex={-1}>{page === 'study' ? <Study /> : page === 'pipeline' ? <Suspense fallback={<div style={{ padding: '64px', color: '#777' }} role="status">{language === 'zh' ? '正在载入完整数据流程…' : 'Loading the complete data flow…'}</div>}><DetailedPipeline /></Suspense> : <Sources />}</main>
    <footer className="site-footer"><div><span>{t("Food / Signal")}</span><span>{t("R for Data Science")}</span></div><p>{t("Open Prices & Open Food Facts contributors")} <span>{t("\u00B7")}</span> {t("ODbL")}</p><a href="#sources">{t("Sources & methodology")} <ArrowUpRight size={14}/></a></footer>
  </>;
}
function Study() {
    const { t, language } = useI18n();
    const c = data.counts;
    return <div className="study-page page-width">
    <section className="study-intro" aria-labelledby="study-title"><div className="intro-copy"><div className="study-index"><span className="green-dot"/>{t("A category-level study")}</div><h1 id="study-title">{t("Food prices,")}<br />{t("nutrition &")}<br className="small-only"/>{language === "en" ? " " : ""}{t("environment.")}</h1><p className="intro-description">{t("How price relates to nutritional quality and environmental performance within the same food category.")}</p><a className="button primary" href="#pipeline">{t("Explore the data pipeline")} <ArrowRight size={17}/></a></div><dl className="scope-list"><div><dt>{t("Market")}</dt><dd>{t("France \u00B7 EUR")}</dd></div><div><dt>{t("Price observations")}</dt><dd>{t("2024\u20132025")}</dd></div><div><dt>{t("Product information")}</dt><dd>{t("2 November 2026")}</dd></div><div><dt>{t("Analysis")}</dt><dd>{t("R \u00B7 reproducible snapshots")}</dd></div></dl></section>

    <section className="connection-section" aria-labelledby="connection-title"><div className="section-line"><h2 id="connection-title">{t("Linking prices to product attributes")}</h2><a className="text-link" href="#pipeline">{t("Inspect the connection")} <ArrowUpRight size={17}/></a></div><JoinIllustration /><div className="connection-caption"><p>{t("Price observations and product attributes share a barcode.")}<br />{t("Multiple quotes link to one product record.")}</p><span className="key-badge"><ScanLine size={17}/><code>{t("code")}</code><span>{t("character key")}</span></span></div></section>

    <section className="questions" aria-label={t("Research questions")}><div className="question-row"><span className="row-number">{t("01")}</span><p>{t("Do higher-priced products have better nutritional profiles?")}</p><span className="question-tag">{t("Price \u00D7 nutrition")}</span></div><div className="question-row"><span className="row-number">{t("02")}</span><p>{t("Does a higher price align with better environmental performance?")}</p><span className="question-tag">{t("Price \u00D7 environment")}</span></div><div className="question-row"><span className="row-number">{t("03")}</span><p>{t("Which lower-priced alternatives have comparable or better grades?")}</p><span className="question-tag">{t("Within-category comparison")}</span></div></section>

    <section className="sample-section" aria-labelledby="sample-title"><div className="sample-intro"><h2 id="sample-title">{t("The comparison sample")}</h2><p>{t("Four categories, sampled equally.")}<br />{t("Comparisons stay within each category.")}</p><div className="sample-total"><span>{number(c.primary)}</span> {t("comparable products")}</div></div><div className="category-table"><table><caption className="sr-only">{t("Selected and comparable products by category")}</caption><thead><tr><th>{t("Category")}</th><th>{t("Selected")}</th><th>{t("Comparable")}</th><th>{t("Price unit")}</th></tr></thead><tbody>{data.tables.categories.map(row => <tr key={row.category}><th scope="row">{t(categoryNames[row.category])}</th><td>{t("150")}</td><td>{row.n}</td><td>{t("EUR/")}{row.target_unit}</td></tr>)}</tbody><tfoot><tr><th>{t("Total")}</th><td>{c.selected}</td><td>{c.primary}</td><td /></tr></tfoot></table></div></section>
    <div className="study-end"><p>{t("Follow the data from source records to the final analysis sets.")}</p><a className="button secondary" href="#pipeline">{t("Open data pipeline")} <ArrowRight size={17}/></a></div>
  </div>;
}
function JoinIllustration() {
    const { t } = useI18n();
    const e = data.examples[0];
    return <div className="join-illustration"><div className="source-pair"><div className="mini-source"><div className="mini-source-top"><Database size={19}/><span>{t("Open Prices")}</span><span className="mini-count">{number(data.counts.linked)} {t("quotes")}</span></div><div className="mini-table"><div className="mini-table-head"><span>{t("product_code")}</span><span>{t("date")}</span><span>{t("price")}</span></div>{e.quotes.map(q => <div className="mini-table-row" key={q.id}><code>{q.code}</code><span>{q.date}</span><span>{t("\u20AC")}{money(q.price)}</span></div>)}</div><div className="mini-source-foot">{t("Multiple observations per product")} <span>{t("n")}</span></div></div><div className="mini-source"><div className="mini-source-top"><Layers3 size={19}/><span>{t("Open Food Facts")}</span><span className="mini-count">{number(data.counts.retrieved)} {t("products")}</span></div><div className="mini-table"><div className="mini-table-head product-head"><span>{t("code")}</span><span>{t("product")}</span></div><div className="mini-table-row product-head"><code>{e.code}</code><span>{e.name}</span></div></div><div className="mini-source-foot">{t("One record per product")} <span>{t("1")}</span></div></div></div><div className="connection-wires" aria-hidden="true"><svg viewBox="0 0 1000 80" preserveAspectRatio="none"><path d="M250 0V24Q250 40 266 40H484Q500 40 500 56V80M750 0V24Q750 40 734 40H516Q500 40 500 56"/></svg><span><GitMerge size={20}/></span></div><a href="#pipeline" className="joined-output"><span className="output-symbol"><Table2 size={20}/></span><span>{t("Linked product & price records")}</span><code>{t("by = \"code\"")}</code><ArrowUpRight size={18}/></a></div>;
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
