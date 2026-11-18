import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownToLine, X } from 'lucide-react';
import { useI18n } from './i18n';
import snapshot from './data/dashboard.json';
import { categories, categoryLabels, csvRows, environmentGrades, gradeLabel, metricLabels, nutritionGrades, productName, logDomain } from './dashboardModel';
import type { Category, DashboardData, Product } from './dashboardModel';
import { BoxPlot, fmt } from './ResearchCharts';
import { categoryColors, gradeColors, nutrients, NutrientPlot, CombinedCarbon, JointPlot } from './ConsumerCharts';
import type { Nutrient } from './ConsumerCharts';
import './dashboard.css';
const data=snapshot as DashboardData;
const directions=[['nutrition','Nutrition','营养'],['environment','Environment','环境'],['joint','Joint comparison','联合比较']] as const;
type Direction=typeof directions[number][0];
function Figure({title,meta,rows,name,children}:{title:string;meta:string;rows:object[];name:string;children:ReactNode}) {
  const {language}=useI18n();
  const download=()=>{const url=URL.createObjectURL(new Blob([csvRows(rows as Record<string,unknown>[])],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return <figure className="research-figure"><figcaption><strong>{title}</strong><div>{meta}<button onClick={download} disabled={!rows.length} aria-label={`${language==='zh'?'导出':'Export'} ${title} CSV`}><ArrowDownToLine size={15}/>CSV</button></div></figcaption>{children}</figure>;
}
export default function Dashboard(){
 const {language,t}=useI18n(); const l=(en:string,zh:string)=>language==='zh'?zh:en;
 const [direction,setDirection]=useState<Direction>('nutrition');
 const [selected,setSelected]=useState<Category[]>([...categories]);
 const [ingredients,setIngredients]=useState<Nutrient[]>(['sugars_100g']);
 const [detail,setDetail]=useState<Product|null>(null);
 const products=data.products.filter(p=>selected.includes(p.category));
 const changeDirection=(d:Direction)=>{setDirection(d);setDetail(null);};
 const toggle=(c:Category)=>{setSelected(prev=>prev.includes(c)?prev.filter(v=>v!==c):[...prev,c]);setDetail(null);};
 const exportNutrients=products.flatMap(p=>ingredients.filter(m=>p[m]!==null).map(m=>({code:p.code,product_name:productName(p),category:p.category,price:p.representative_price,price_unit:`EUR/${p.target_unit}`,nutrient:m,value:p[m],nutrient_unit:`g/100 ${p.target_unit==='L'?'ml':'g'}`})));
 const priceDomain=logDomain(data.products.map(p=>p.representative_price));
 return <div className="research-dashboard">
  <header className="research-heading"><h1>{t('Dashboard')}</h1><span>{l('France · 2024–2025 quotes','法国 · 2024–2025 年报价')}</span></header>
  <div className="research-directions" role="tablist" aria-label={l('Analysis direction','分析方向')}>{directions.map(([id,en,zh],i)=><button key={id} role="tab" id={`research-tab-${id}`} aria-selected={direction===id} aria-controls="research-panel" tabIndex={direction===id?0:-1} onClick={()=>changeDirection(id)} onKeyDown={e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%directions.length;else if(e.key==='ArrowLeft')n=(i+directions.length-1)%directions.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=directions.length-1;else return;e.preventDefault();changeDirection(directions[n][0]);document.getElementById(`research-tab-${directions[n][0]}`)?.focus();}}><span>{String(i+1).padStart(2,'0')}</span>{language==='zh'?zh:en}</button>)}</div>
  <div className="consumer-controls"><fieldset><legend>{l('Show food categories','显示食品类别')}</legend><div className="check-options">{categories.map(c=><label key={c}><input type="checkbox" checked={selected.includes(c)} onChange={()=>toggle(c)}/><i style={{background:categoryColors[c]}}/>{t(categoryLabels[c])}</label>)}<button onClick={()=>setSelected([...categories])}>{l('Show all','显示全部')}</button><button onClick={()=>{setSelected([]);setDetail(null);}}>{l('Hide all','隐藏全部')}</button></div></fieldset><span role="status">{products.length} {l('products','款商品')}</span></div>
  <div id="research-panel" role="tabpanel" aria-labelledby={`research-tab-${direction}`}>
  {!selected.length?<p className="research-empty">{l('Select at least one food category.','请选择至少一类食品。')}</p>:<>
  {direction==='nutrition'&&<>
   <Figure title={l('Nutrition grade and price','营养等级与价格')} meta={l('A is best · shared log-price axis','A 级最好 · 统一对数价格坐标')} name="price-nutrition" rows={products.filter(p=>p.nutri_grade)}><div className="research-facets">{categories.filter(c=>selected.includes(c)).map(c=><div className="research-facet" key={c}><div className="research-facet-label"><strong>{t(categoryLabels[c])}</strong><span>n={products.filter(p=>p.category===c&&p.nutri_grade).length}</span></div><BoxPlot products={products.filter(p=>p.category===c)} boxes={data.boxes.filter(b=>b.category===c&&b.dimension==='nutrition')} grades={nutritionGrades} dimension="nutrition" priceDomain={priceDomain}/></div>)}</div></Figure>
   <Figure title={l('Price and nutrient composition','价格与营养成分')} meta={l('Colour: category · shape: nutrient · click a point','颜色：食品类别 · 形状：营养成分 · 点击查看商品')} name="price-nutrients" rows={exportNutrients}>
    <fieldset className="nutrient-controls"><legend>{l('Show nutrients','显示营养成分')}</legend><div className="check-options">{nutrients.map((m,i)=><label key={m}><input type="checkbox" checked={ingredients.includes(m)} onChange={()=>setIngredients(prev=>prev.includes(m)?prev.filter(v=>v!==m):[...prev,m])}/><span aria-hidden="true">{['●','▲','■'][i]}</span>{t(metricLabels[m])}</label>)}</div></fieldset>
    {ingredients.length?<div className="combined-scroll"><NutrientPlot products={products} universe={data.products} selected={ingredients} onSelect={setDetail}/></div>:<p className="research-empty">{l('Select at least one nutrient.','请选择至少一种营养成分。')}</p>}
    <p className="research-note">{l('All categories share fixed axes. Each selected nutrient adds a point for every product with that value. Juice uses EUR/L and g/100 ml; other foods use EUR/kg and g/100 g.','四类商品共用固定坐标；每勾选一种成分，就增加该成分有数据的商品点。果汁按 EUR/L、g/100 ml，其余按 EUR/kg、g/100 g 展示。')}</p>
   </Figure>
  </>}
  {direction==='environment'&&<>
   <Figure title={l('Environmental grade and price','环境等级与价格')} meta={l('A+ is best · shared log-price axis','A+ 级最好 · 统一对数价格坐标')} name="price-environment" rows={products.filter(p=>p.environment_grade)}><div className="research-facets">{categories.filter(c=>selected.includes(c)).map(c=><div className="research-facet" key={c}><div className="research-facet-label"><strong>{t(categoryLabels[c])}</strong><span>n={products.filter(p=>p.category===c&&p.environment_grade).length}</span></div><BoxPlot products={products.filter(p=>p.category===c)} boxes={data.boxes.filter(b=>b.category===c&&b.dimension==='environment')} grades={environmentGrades} dimension="environment" priceDomain={priceDomain}/></div>)}</div></Figure>
   <Figure title={l('Price and carbon estimates','价格与碳估算')} meta={l('Bubble area: mapped product count','气泡面积：共享参考项的商品数')} name="carbon-references" rows={data.tables.carbon_references.filter(r=>selected.includes(r.category))}><div className="combined-scroll"><CombinedCarbon rows={data.tables.carbon_references.filter(r=>selected.includes(r.category))} universe={data.tables.carbon_references}/></div><p className="research-note">{l('One bubble is one food reference and carbon value, not a measured product footprint. Carbon uses kg CO₂e/kg food for all categories; juice prices use EUR/L. The current export contains carbon estimates and a composite environment score, with no separate water or land-use indicators.','每个气泡对应一个食品参考项与碳估算值，表示模型参考值。碳估算统一按 kg CO₂e/kg 食品；果汁价格为 EUR/L。现有数据可用碳估算与环境综合评分，没有独立导出的用水、土地占用等指标。')}</p></Figure>
  </>}
  {direction==='joint'&&<Figure title={l('At similar prices, are greener products healthier?','相近价格下，更环保的商品是否更健康？')} meta={l('X: environment · Y: price · colour: nutrition','横轴：环境等级 · 纵轴：价格 · 颜色：营养等级')} name="joint-products" rows={products.filter(p=>p.nutri_grade&&p.environment_grade)}><div className="grade-legend">{nutritionGrades.map(g=><span key={g}><i style={{background:gradeColors[g]}}/>{l('Nutrition','营养')} {gradeLabel(g)}</span>)}</div><div className="combined-scroll"><JointPlot products={products} universe={data.products} onSelect={setDetail}/></div><p className="research-note">{l('Compare points at a similar height within a food category. Horizontal jitter separates overlapping products; grade positions are unchanged. Missing grades are excluded. Use category checkboxes to isolate comparable foods; EUR/L and EUR/kg are different price units.','同一食品类别内，比较高度接近的点：越靠左环境等级越好，颜色显示营养等级。横向轻微错开重叠点，等级位置不变；缺失等级的商品不展示。可勾选单一类别比较，EUR/L 与 EUR/kg 是不同计价单位。')}</p></Figure>}
   {detail&&selected.includes(detail.category)&&<aside className="selected-product" aria-live="polite"><button aria-label={l('Close product','关闭商品详情')} onClick={()=>setDetail(null)}><X size={18}/></button><h2>{productName(detail)}</h2><p>{t(categoryLabels[detail.category])} · {detail.code}</p><p>€{fmt(detail.representative_price)}/{detail.target_unit} · {l('Nutrition','营养')} {gradeLabel(detail.nutri_grade)} · {l('Environment','环境')} {gradeLabel(detail.environment_grade)}</p><p>{nutrients.map(m=>`${t(metricLabels[m])}: ${fmt(detail[m])}`).join(' · ')} g/100 {detail.target_unit==='L'?'ml':'g'}</p></aside>}
  </>}
  </div>
 </div>;
}
