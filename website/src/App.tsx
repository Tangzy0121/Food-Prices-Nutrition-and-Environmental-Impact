import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, ChevronRight, Download } from 'lucide-react';
import { LanguageProvider, useI18n } from './i18n';
import Story, { storySlugs } from './Story';

const pages = [['story', 'The story'], ['pipeline', 'Data pipeline'], ['eda', 'EDA'], ['dashboard', 'Dashboard'], ['sources', 'Sources']] as const;
type Page = typeof pages[number][0];
type Route = { page: Page; chapter: number };
const repo = 'https://github.com/Tangzy0121/Food-Prices-Nutrition-and-Environmental-Impact';
const report = `${import.meta.env.BASE_URL}downloads/food-choices-report.pdf`;
const DetailedPipeline = lazy(() => import('./DetailedPipeline'));
const Eda = lazy(() => import('./eda/Eda'));
const Dashboard = lazy(() => import('./Dashboard'));

function readRoute(): Route {
    const raw = location.hash.replace(/^#\/?/, '');
    if (raw.startsWith('pipeline')) return { page: 'pipeline', chapter: 0 };
    if (raw.startsWith('eda')) return { page: 'eda', chapter: 0 };
    if (raw.startsWith('dashboard')) return { page: 'dashboard', chapter: 0 };
    if (raw.startsWith('sources')) return { page: 'sources', chapter: 0 };
    const slug = raw.split('/')[1];
    const index = storySlugs.indexOf(slug as typeof storySlugs[number]);
    return { page: 'story', chapter: index < 0 ? 0 : index };
}

function Brand() {
    const { t } = useI18n();
    return <a className="brand" href="#story" aria-label={t("Food / Signal, the story")}><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span>{t("Food")} <span className="brand-slash">{t("/")}</span> {t("Signal")}</span></a>;
}

function AppContent() {
    const { t, language, setLanguage } = useI18n();
    const [route, setRoute] = useState<Route>(readRoute);
    useEffect(() => {
        const navigate = () => setRoute(readRoute());
        window.addEventListener('hashchange', navigate);
        return () => window.removeEventListener('hashchange', navigate);
    }, []);
    const { page, chapter } = route;
    useEffect(() => {
        document.title = page === 'story'
            ? `Food / Signal · ${['Does paying more buy better food?', 'One shelf, three answers', 'Four aisles, 598 products', 'From a receipt to a price', 'Price and nutrition', 'Price and environment', 'At similar prices', 'The answer'][chapter] ?? 'The story'}`
            : `Food / Signal · ${t(pages.find(([id]) => id === page)![1])}`;
    }, [page, chapter, t]);
    useEffect(() => { if (page !== 'story') window.scrollTo(0, 0); }, [page]);
    return <div className={`app-shell${page === 'pipeline' ? ' is-pipeline' : ''}`}>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>{t("Skip to content")}</a>
    <header className="site-header"><div className="header-inner"><Brand /><nav aria-label={t("Main navigation")}>{pages.map(([id, label]) => <a key={id} className={page === id ? 'nav-link active' : 'nav-link'} href={`#${id}`} aria-current={page === id ? 'page' : undefined}>{t(label)}</a>)}</nav><div className="header-actions"><a className="download-link" href={report} download><Download size={15} />{t("Download report")}</a><div className="language-switch" role="group" aria-label={t("Language")}><button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button><button type="button" lang="zh-CN" aria-label="中文" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button></div><a className="repo-link" href={repo} target="_blank" rel="noreferrer">{t("R source")} <ArrowUpRight size={16}/></a></div></div></header>
    {page === 'story' ? <Story index={chapter} /> : <main id="main-content" tabIndex={-1}>
      {page === 'pipeline' && <Suspense fallback={<div className="route-loading page-width" role="status">{language === 'zh' ? '正在载入完整数据流程…' : 'Loading the complete data flow…'}</div>}><DetailedPipeline /></Suspense>}
      {page === 'eda' && <Suspense fallback={<div className="page-width route-loading" role="status">{language === 'zh' ? '正在载入 EDA…' : 'Loading EDA…'}</div>}><Eda /></Suspense>}
      {page === 'dashboard' && <Suspense fallback={<div className="dashboard-loading" role="status">{language === 'zh' ? '正在载入研究图表…' : 'Loading research charts…'}</div>}><Dashboard /></Suspense>}
      {page === 'sources' && <Sources />}
    </main>}
    {page !== 'pipeline' && page !== 'story' && <footer className="site-footer"><div><span>{t("Food / Signal")}</span><span>{t("R for Data Science")}</span></div><p>{t("Open Prices & Open Food Facts contributors")} <span>{t("\u00B7")}</span> {t("ODbL")}</p><a href="#sources">{t("Sources & methodology")} <ArrowUpRight size={14}/></a></footer>}
  </div>;
}

function Sources() {
    const { t, language } = useI18n();
    const l = (en: string, zh: string) => language === 'zh' ? zh : en;
    const resources = [
        { name: 'Open Prices', description: l('Retail price observations · France · EUR · 2024–2025', '零售报价 · 法国 · EUR · 2024–2025 年'), href: 'https://huggingface.co/datasets/openfoodfacts/open-prices' },
        { name: 'Open Food Facts', description: l('Product nutrition, environmental grades and AGRIBALYSE carbon references · retrieved 2 November 2026', '营养资料、环境等级与 AGRIBALYSE 碳估算参考项 · 获取于 2026-11-02'), href: 'https://world.openfoodfacts.org/' },
    ];
    return <div className="sources-page page-width"><div className="breadcrumb"><a href="#story">{t('The story')}</a><ChevronRight size={14}/><span>{t('Sources')}</span></div><h1>{l('Data sources & processing.', '数据来源与处理流程')}</h1><p className="sources-intro">{t('Open Prices and Open Food Facts contributors. Database: ODbL; individual database contents: DbCL. Store geography originates from OpenStreetMap contributors.')}</p><div className="resource-list">{resources.map(r => <a key={r.name} href={r.href} target="_blank" rel="noreferrer"><div><span>{r.name}</span><p>{r.description}</p></div><ArrowUpRight size={20}/></a>)}</div><section className="consumer-processing"><h2>{l('From quotes to comparable products', '从报价到可比较的商品')}</h2><ol><li>{l('Select French EUR food quotes from 2024–2025; remove invalid prices and duplicate observations. Keep discounts separate.', '筛选 2024–2025 年法国 EUR 食品报价，去除无效价格与重复记录，折扣报价另行保留。')}</li><li>{l('Join quotes to product attributes by exact character barcode. Preserve leading zeroes; multiple quotes can belong to one product.', '按字符型条码精确连接商品属性，保留条码前导零；同一商品可对应多条报价。')}</li><li>{l('Standardise package quantities into EUR/kg for solid foods and EUR/L for juice. Use each product’s median valid regular price.', '根据包装净含量统一计价：固体食品 EUR/kg，果汁 EUR/L；每款商品取有效常规报价的中位数。')}</li><li>{l('Select 150 products per category. Exclude two invalid package specifications, leaving 598 products. Match nutrition and environment grades; restore 16 F grades from the saved original objects. Joint comparisons use 583 products.', '四类各入选 150 款，排除两款规格异常商品后保留 598 款；匹配营养与环境等级，并从原始对象恢复 16 款 F 等级。联合比较可用 583 款。')}</li><li>{l('Use R to calculate grade-price distributions, within-category rank correlations and reference-level carbon estimates. The website reads these saved results.', '使用 R 计算等级价格分布、类别内秩相关与参考项碳估算，网页读取已保存的结果。')}</li></ol><p>{l('Historical quotes are linked to product information retrieved on 2 November 2026. Prices and attributes therefore have different reference dates.', '历史报价连接到 2026-11-02 获取的商品资料，价格日期与属性日期分别保留。')}</p><a className="button secondary" href="#pipeline">{l('Explore the processing flow', '查看交互清洗流程')} <ArrowRight size={17}/></a></section><a className="button primary" href={repo} target="_blank" rel="noreferrer">{t('View the R project')} <ArrowUpRight size={17}/></a></div>;
}

export default function App() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}
