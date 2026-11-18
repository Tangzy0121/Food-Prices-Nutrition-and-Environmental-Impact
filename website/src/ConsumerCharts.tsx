import { useI18n } from './i18n';
import { categoryLabels, environmentGrades, gradeLabel, jitter, logDomain, logTicks, metricLabels, productName } from './dashboardModel';
import type { Category, Carbon, Metric, Product } from './dashboardModel';
import { fmt } from './ResearchCharts';

export const categoryColors: Record<Category,string> = {biscuits:'#b46a36',breakfast_cereals:'#307a69',dark_chocolates:'#7762a2',fruit_juices:'#277ba3'};
export const gradeColors: Record<string,string> = {a:'#267349',b:'#74952b',c:'#bb9300',d:'#cf702e',e:'#b84148'};
export type Nutrient = Extract<Metric,'sugars_100g'|'saturated_fat_100g'|'fiber_100g'>;
export const nutrients: Nutrient[] = ['sugars_100g','saturated_fat_100g','fiber_100g'];
const W=1000,H=460,L=85,R=35,T=35,B=65;
const lin=(v:number,lo:number,hi:number,a:number,b:number)=>a+(v-lo)/(hi-lo||1)*(b-a);
const log=(v:number,d:[number,number],a:number,b:number)=>lin(Math.log10(v),Math.log10(d[0]),Math.log10(d[1]),a,b);
function PriceAxis({domain,vertical=false}:{domain:[number,number];vertical?:boolean}) {
  return <>{logTicks(domain).map(v=>vertical?<g key={v}><line className="plot-grid" x1={L} x2={W-R} y1={log(v,domain,H-B,T)} y2={log(v,domain,H-B,T)}/><text x={L-12} y={log(v,domain,H-B,T)+5} textAnchor="end">{fmt(v)}</text></g>:<text key={v} x={log(v,domain,L,W-R)} y={H-B+25} textAnchor="middle">{fmt(v)}</text>)}</>;
}
function Shape({index,x,y,...props}:{index:number;x:number;y:number} & React.SVGProps<SVGPathElement>) {
  const d=index===0?`M ${x-4},${y} a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0`:index===1?`M ${x},${y-5} l 5,9 h -10 Z`:`M ${x-4},${y-4} h 8 v 8 h -8 Z`;
  return <path d={d} {...props}/>;
}
export function NutrientPlot({products,universe,selected,onSelect}:{products:Product[];universe:Product[];selected:Nutrient[];onSelect:(p:Product)=>void}) {
  const {language,t}=useI18n();
  const domain=logDomain(universe.map(p=>p.representative_price));
  // Fix both axes across category/ingredient toggles so hiding points never rescales comparisons.
  const max=Math.ceil(Math.max(1,...universe.flatMap(p=>nutrients.map(m=>p[m]??0)))*1.08/10)*10;
  const x=(v:number)=>log(v,domain,L,W-R),y=(v:number)=>lin(v,0,max,H-B,T);
  return <svg className="research-svg combined-svg" data-chart="nutrients" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={language==='zh'?'四类食品价格与营养成分散点图':'Combined price and nutrient scatterplot'}>
    <text x={L} y={18} className="plot-unit">g / 100 g {language==='zh'?'（果汁：100 ml）':'(juice: 100 ml)'}</text>
    {[0,.25,.5,.75,1].map(f=><g key={f}><line className="plot-grid" x1={L} x2={W-R} y1={y(f*max)} y2={y(f*max)}/><text x={L-12} y={y(f*max)+5} textAnchor="end">{fmt(f*max)}</text></g>)}
    <PriceAxis domain={domain}/><text x={(L+W-R)/2} y={H-10} textAnchor="middle">{language==='zh'?'价格':'Price'} · EUR/kg {language==='zh'?'（果汁：EUR/L）':'(juice: EUR/L)'} · log₁₀</text>
    {products.flatMap(p=>selected.filter(m=>p[m]!==null).map(m=><Shape key={`${p.code}-${m}`} index={nutrients.indexOf(m)} x={x(p.representative_price)} y={y(p[m]!)} fill={categoryColors[p.category]} className="combined-point" data-point={p.code} data-category={p.category} data-metric={m} tabIndex={0} role="button" aria-label={`${productName(p)} · ${t(metricLabels[m])}`} onClick={()=>onSelect(p)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p);}}}><title>{`${productName(p)} · ${t(categoryLabels[p.category])}\n€${fmt(p.representative_price)}/${p.target_unit} · ${t(metricLabels[m])}: ${fmt(p[m])} g/100 ${p.target_unit==='L'?'ml':'g'}`}</title></Shape>))}
  </svg>;
}
export function CombinedCarbon({rows,universe}:{rows:Carbon[];universe:Carbon[]}) {
  const {language,t}=useI18n();
  const raw=logDomain(universe.map(r=>r.median_price));
  const domain: [number,number]=[raw[0]/1.3,raw[1]*1.3];
  const max=Math.max(1,...universe.map(r=>r.co2_total))*1.25;
  const y=(v:number)=>lin(v,-max*.1,max,H-B,T);
  return <svg className="research-svg combined-svg" data-chart="carbon" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={language==='zh'?'四类食品碳估算与价格气泡图':'Combined carbon and price bubbles'}>
    <text x={L} y={18}>kg CO₂e / kg {language==='zh'?'食品':'food'}</text>
    {[0,.25,.5,.75,1].map(f=><g key={f}><line className="plot-grid" x1={L} x2={W-R} y1={y(f*max*.8)} y2={y(f*max*.8)}/><text x={L-12} y={y(f*max*.8)+5} textAnchor="end">{fmt(f*max*.8)}</text></g>)}
    <PriceAxis domain={domain}/><text x={(L+W-R)/2} y={H-10} textAnchor="middle">{language==='zh'?'参考项内价格中位数':'Median mapped-product price'} · EUR/kg {language==='zh'?'（果汁：EUR/L）':'(juice: EUR/L)'} · log₁₀</text>
    {[...rows].sort((a,b)=>b.n_products-a.n_products).map((r,i)=><circle key={i} data-category={r.category} cx={log(r.median_price,domain,L,W-R)} cy={y(r.co2_total)} r={3.4*Math.sqrt(r.n_products)} fill={categoryColors[r.category]} fillOpacity={.42} stroke={categoryColors[r.category]} tabIndex={0}><title>{`${t(categoryLabels[r.category])} · ${r.agribalyse_name}\nn=${r.n_products} · €${fmt(r.median_price)}/${r.category==='fruit_juices'?'L':'kg'} · ${fmt(r.co2_total)} kg CO₂e/kg`}</title></circle>)}
  </svg>;
}
export function JointPlot({products,universe,onSelect}:{products:Product[];universe:Product[];onSelect:(p:Product)=>void}) {
  const {language,t}=useI18n();
  const domain=logDomain(universe.map(p=>p.representative_price));
  const x=(g:string)=>lin(environmentGrades.indexOf(g),0,6,L+40,W-R-40);
  return <svg className="research-svg combined-svg" data-chart="joint" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={language==='zh'?'环境等级为横轴、价格为纵轴、营养等级为颜色的联合比较':'Joint comparison: environment on x, price on y, nutrition colour'}>
    <text x={L} y={18}>EUR/kg {language==='zh'?'（果汁：EUR/L）':'(juice: EUR/L)'} · log₁₀</text><PriceAxis domain={domain} vertical/>
    {environmentGrades.map(g=><g key={g}><line className="plot-grid" x1={x(g)} x2={x(g)} y1={T} y2={H-B}/><text x={x(g)} y={H-B+25} textAnchor="middle">{gradeLabel(g)}</text></g>)}
    <text x={(L+W-R)/2} y={H-10} textAnchor="middle">{language==='zh'?'环境等级 · 左侧更好':'Environmental grade · better to the left'}</text>
    {products.filter(p=>p.nutri_grade&&p.environment_grade).map(p=><Shape key={p.code} index={0} x={x(p.environment_grade!)+jitter(p.code)*30} y={log(p.representative_price,domain,H-B,T)} fill={gradeColors[p.nutri_grade!]} className="combined-point" data-point={p.code} data-category={p.category} tabIndex={0} role="button" aria-label={productName(p)} onClick={()=>onSelect(p)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p);}}}><title>{`${productName(p)} · ${t(categoryLabels[p.category])}\n€${fmt(p.representative_price)}/${p.target_unit} · ${language==='zh'?'营养':'Nutrition'} ${gradeLabel(p.nutri_grade)} · ${language==='zh'?'环境':'Environment'} ${gradeLabel(p.environment_grade)}`}</title></Shape>)}
  </svg>;
}
