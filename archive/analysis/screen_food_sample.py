import json, random, urllib.request, urllib.parse, concurrent.futures, collections, pathlib, time, hashlib
import pyarrow.parquet as pq
P=pathlib.Path('data/screening/open_prices_2026-10-30.parquet')
D=pq.read_table(P,columns=['product_code','date','currency','location_osm_address_country_code','type','price','price_is_discounted','price_per','location_id']).to_pandas()
D=D[(D.location_osm_address_country_code=='FR')&(D.currency=='EUR')&(D.type=='PRODUCT')&D.date.astype(str).str[:4].isin(['2024','2025'])&D.product_code.notna()]
D=D[D.price.map(lambda x: x is not None and x>0)]
codes=sorted(D.product_code.unique()); sample=random.Random(20261030).sample(codes,min(200,len(codes)))
def fetch(code):
 q=urllib.parse.urlencode({'product_code':code,'size':1})
 for attempt in range(2):
  try:
   req=urllib.request.Request('https://prices.openfoodfacts.org/api/v1/prices?'+q,headers={'User-Agent':'Academic feasibility study contact local project'})
   with urllib.request.urlopen(req,timeout=20) as res: out=json.load(res)
   items=out.get('items',[]); return {'code':code,'product':items[0].get('product') if items else None,'status':'ok' if items else 'empty'}
  except Exception as exc:
   if attempt==1: return {'code':code,'status':'error','error':str(exc)}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex: rec=list(ex.map(fetch,sample))
path=pathlib.Path('data/screening/food_product_sample_2026-10-30.json'); path.write_text(json.dumps(rec,ensure_ascii=False,indent=2),encoding='utf8')
ok=[x for x in rec if x['status']=='ok' and x.get('product')]; print('universe',len(codes),'records',len(D),'sample',len(sample),'with_product_object',len(ok),'missing_product_object',sum(not x.get('product') for x in rec),'request_status',collections.Counter(x['status'] for x in rec))
def flags(p):
 n=p.get('nutriscore_grade') in ['a','b','c','d','e']; e=p.get('ecoscore_grade') in ['a-plus','a','b','c','d','e']; q=p.get('product_quantity'); u=p.get('product_quantity_unit'); quant=isinstance(q,(float,int)) and q>0 and u in ['g','kg','ml','l','cl']; cat=bool(p.get('categories_tags')); return n,e,quant,cat
fs=[flags(x['product']) for x in ok]
for i,n in enumerate(['nutri','eco','quantity_mass_or_volume','category']): print(n,sum(f[i] for f in fs))
print('nutri_and_eco',sum(f[0] and f[1] for f in fs),'all_four',sum(all(f) for f in fs))
print('units',collections.Counter(str(x['product'].get('product_quantity_unit')) for x in ok)); print('scores',collections.Counter((x['product'].get('nutriscore_grade'),x['product'].get('ecoscore_grade')) for x in ok).most_common(12))
print('errors',[x for x in rec if x['status']!='ok'][:4]);print('sha256',hashlib.sha256(P.read_bytes()).hexdigest())
