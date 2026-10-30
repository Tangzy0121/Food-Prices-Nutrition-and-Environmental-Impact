import json,urllib.request,concurrent.futures,collections,pathlib
s=json.loads(pathlib.Path('data/screening/food_product_sample_2026-10-30.json').read_text(encoding='utf8'))[:30]
fields='code,product_name,nutriments,ecoscore_data,nutrition_data_per,last_modified_t'
def get(x):
 code=x['code'];u='https://world.openfoodfacts.org/api/v2/product/'+code+'.json?fields='+fields
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'R-Final-Project/1.0 educational research'}),timeout=20) as r: obj=json.load(r)
  p=obj.get('product',{});n=p.get('nutriments') or {};e=(p.get('ecoscore_data') or {}).get('agribalyse') or {};keys=['energy-kcal_100g','sugars_100g','fat_100g','saturated-fat_100g','proteins_100g','fiber_100g','salt_100g','carbon-footprint_100g']
  return {'code':code,'status':obj.get('status'),'nutrients':{k:n.get(k) for k in keys},'agribalyse':{k:e.get(k) for k in ['co2_total','agribalyse_food_code','name_en','version']},'product_name':p.get('product_name'),'nutrition_data_per':p.get('nutrition_data_per'),'last_modified_t':p.get('last_modified_t')}
 except Exception as e: return {'code':code,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex: a=list(ex.map(get,s))
path=pathlib.Path('data/screening/food_numeric_sample_2026-10-30.json');path.write_text(json.dumps(a,indent=2,ensure_ascii=False),encoding='utf8')
print('total',len(a),'success',sum(x.get('status')==1 for x in a),'errors',collections.Counter(x.get('error','none') for x in a))
for k in ['energy-kcal_100g','sugars_100g','fat_100g','saturated-fat_100g','proteins_100g','fiber_100g','salt_100g','carbon-footprint_100g']: print(k, sum(x.get('nutrients',{}).get(k) is not None for x in a))
print('co2',sum(x.get('agribalyse',{}).get('co2_total') is not None for x in a)); print('joint_sugar_co2',sum(x.get('nutrients',{}).get('sugars_100g') is not None and x.get('agribalyse',{}).get('co2_total') is not None for x in a));print('codes',collections.Counter(x.get('agribalyse',{}).get('agribalyse_food_code') for x in a).most_common(6))
