import exported from './data/processing-trace.json';

export type Bilingual = { en: string; zh: string };
export const words = (en: string, zh: string): Bilingual => ({ en, zh });
export type TraceTable = { columns: string[]; rows: Record<string, unknown>[] };
export type Trace = { beforeCount: number; afterCount: number; before: TraceTable; after: TraceTable; source: string; line: number; code: string; metrics: Record<string, number> };
export const traces = exported.steps as unknown as Record<string, Trace>;
export type OperationKind = 'source' | 'check' | 'filter' | 'clean' | 'join' | 'aggregate' | 'sample' | 'output';
export type Group = 'prices' | 'selection' | 'products' | 'link' | 'verify' | 'outputs';
export type Operation = { id: string; title: Bilingual; description: Bilingual; condition: Bilingual; kind: OperationKind; group: Group; x: number; y: number; view?: boolean };
const op = (id: string, group: Group, kind: OperationKind, x: number, y: number, en: string, zh: string, enText: string, zhText: string, enRule: string, zhRule: string, view = false): Operation => ({ id, group, kind, x, y, title: words(en, zh), description: words(enText, zhText), condition: words(enRule, zhRule), view });

export const operations: Operation[] = [
  op('price_source', 'prices', 'source', 0, 0, 'Read price snapshot', '读取原始报价', 'Load the pinned Open Prices Parquet file.', '读取固定版本的 Open Prices Parquet 文件。', 'Snapshot: 30 October 2026', '价格快照：2026 年 10 月 30 日'),
  op('price_hash', 'prices', 'check', 250, 0, 'Verify source hash', '校验原始文件哈希', 'Compare the saved file with its pinned SHA-256 before using it.', '先将原始文件与固定的 SHA-256 校验值比较，再开始处理。', 'Stop on a checksum mismatch', '哈希不符时停止，不继续使用文件'),
  op('barcode_type', 'prices', 'clean', 500, 0, 'Keep barcode strings', '保留字符型条码', 'Check that product_code is character data, preserving leading zeros.', '确认 product_code 为字符型，完整保留条码前导零。', 'is.character(product_code)', 'is.character(product_code)'),
  op('filter_fr', 'prices', 'filter', 750, 0, 'France only', '筛选法国门店', 'Keep observations recorded in French stores.', '仅保留门店国家为法国的报价。', 'country_code == "FR"', 'country_code == "FR"'),
  op('filter_eur', 'prices', 'filter', 1000, 0, 'EUR only', '筛选欧元报价', 'Keep prices in euros, without currency conversion.', '仅保留欧元报价，不进行跨币种换算。', 'currency == "EUR"', 'currency == "EUR"'),
  op('filter_year', 'prices', 'filter', 1250, 0, '2024–2025 only', '筛选 2024–2025 年', 'Apply the research date window to the remaining observations.', '在已保留的记录中，继续限定研究日期范围。', '2024-01-01 ≤ date ≤ 2025-12-31', '2024-01-01 ≤ date ≤ 2025-12-31'),
  op('filter_barcode', 'prices', 'filter', 1500, 0, 'Barcode products only', '筛选条码商品', 'Keep PRODUCT records with a non-empty product barcode.', '保留 PRODUCT 类型，且条码非缺失、非空白的记录。', 'type == "PRODUCT"; non-empty barcode', 'type == "PRODUCT"；条码非空'),
  op('filter_positive', 'prices', 'filter', 1750, 0, 'Positive prices', '保留有效正价格', 'Remove zero, negative and non-finite prices.', '排除零价格、负价格和非有限价格。', 'is.finite(price) & price > 0', 'is.finite(price) & price > 0'),
  op('rename_prices', 'prices', 'clean', 2000, 0, 'Select & rename fields', '选择字段并统一命名', 'Rename product_code to code and price to price_eur; derive year and keep research fields.', '将 product_code 改名为 code、price 改名为 price_eur，提取年份，只保留研究所需字段。', 'product_code → code; price → price_eur', 'product_code → code；price → price_eur'),
  op('flag_repeats', 'prices', 'clean', 2250, 0, 'Flag repeated quotes', '标记疑似重复报价', 'Count identical quote combinations. Records are flagged and retained at this stage.', '按相同报价组合计数，新增重复标记；这一步保留全部记录。', 'code + date + store + price + discount + price unit', '条码＋日期＋门店＋价格＋折扣＋计价单位'),
  op('price_universe', 'prices', 'aggregate', 2500, 0, 'Group by barcode', '汇总历史报价条码', 'Make one row per barcode with quote counts, regular-quote counts and date coverage.', '按条码汇总报价次数、常规报价次数与日期范围，形成每条码一行的历史价格目录。', 'group_by(code) → 44,789 products', 'group_by(code) → 44,789 个条码'),

  op('catalog_source', 'selection', 'source', 1500, 340, 'Read category pages', '读取四类商品目录', 'Read the saved Open Prices catalog pages for all four categories. Product details in this catalog come from Open Food Facts.', '读取 Open Prices 中四类食品的全部已保存目录分页，目录中的商品资料来自 Open Food Facts。', 'Four categories; Open Food Facts products with at least one quote', '四类食品；商品资料来自 Open Food Facts；至少有一条报价'),
  op('catalog_distinct', 'selection', 'clean', 1750, 340, 'Distinct catalog barcodes', '类别内条码去重', 'Within each category, keep the first record per barcode.', '在每个食品类别内按条码去重，保留首条记录。', 'distinct(code, .keep_all = TRUE), within category', '每类分别 distinct(code, .keep_all = TRUE)'),
  op('catalog_units', 'selection', 'clean', 2000, 340, 'Normalize catalog units', '换算目录规格单位', 'Convert structured g/kg to kg and ml/cl/dl/L to L.', '将结构化的 g/kg 换算为 kg，将 ml/cl/dl/L 换算为 L。', 'g × 0.001; ml × 0.001; cl × 0.01; dl × 0.1', 'g × 0.001；ml × 0.001；cl × 0.01；dl × 0.1'),
  op('catalog_text', 'selection', 'clean', 2250, 340, 'Parse catalog pack text', '解析目录包装文本', 'Parse simple quantities and multipacks, then check agreement with structured quantities.', '解析单件和多件装文本，再与结构化净含量交叉核对。', '4 × 125 g; 125 g × 4; outer/inner packs', '4 × 125 g、125 g × 4、外包装与内包装'),
  op('catalog_join', 'selection', 'join', 2500, 340, 'Join historical coverage', '连接历史报价覆盖', 'Left-join historical per-barcode counts to the category catalog using code.', '用 code 将历史报价的条码级次数左连接到类别目录。', 'catalog LEFT JOIN price_universe BY code', '类别目录 LEFT JOIN 历史报价目录 BY code'),
  op('catalog_match', 'selection', 'filter', 2750, 340, 'Require historical match', '保留有历史报价的条码', 'Show the first component of the eligibility condition: a match in the historical universe.', '展开可抽样条件的第一项：条码在历史报价目录中存在。', 'in_price_universe == TRUE', 'in_price_universe == TRUE', true),
  op('catalog_regular', 'selection', 'filter', 3000, 340, 'Require a regular quote', '要求至少一条常规报价', 'Among historically matched products, require a non-discounted quote.', '在已匹配历史报价的商品中，要求至少一条非折扣报价。', 'has_regular_quote == TRUE', 'has_regular_quote == TRUE', true),
  op('catalog_quantity', 'selection', 'filter', 3250, 340, 'Require usable quantity', '要求有效可比规格', 'Keep usable net quantities with the correct mass or volume basis.', '要求净含量有效，且质量或体积基准与该食品类别一致。', 'quantity_usable & unit_basis == target_unit', 'quantity_usable 且 unit_basis == target_unit', true),
  op('sample_sort', 'selection', 'clean', 3500, 340, 'Sort eligible barcodes', '按条码排序候选商品', 'Sort the eligible pool by barcode within category before reproducible sampling.', '每类候选商品先按条码排序，为可复现抽样固定顺序。', 'arrange(code), within category', '每个类别内 arrange(code)'),
  op('sample_select', 'selection', 'sample', 3750, 340, 'Sample 150 per category', '每类随机抽取 150 款', 'Sample without replacement using the fixed R seed. Grade completeness is not required.', '按固定随机种子不放回抽样，不以评分齐全作为入选条件。', 'seed 20261102; 150 × 4 categories', '随机种子 20261102；150 款 × 4 类'),

  op('fetch_batch', 'products', 'source', 4000, 340, 'Fetch product details', '批量获取商品资料', 'Retrieve product details from Open Food Facts in batches of 100 barcodes. Two missing products are checked individually next.', '从 Open Food Facts 每批获取 100 款商品的名称、规格、营养和环境资料，再单独补查两款未返回的商品。', '6 batches; complete planned field list', '共 6 个批次，获取全部计划字段'),
  op('fetch_confirm', 'products', 'source', 4250, 340, 'Check missing products', '补查遗漏商品', 'Look up the two missing products individually; all 600 selected products have saved details.', '单独查询批量获取时遗漏的两款商品，最终保存全部 600 款入选商品的资料。', '598 batch matches + 2 confirmed = 600', '598 款批量匹配＋2 款补查成功＝600 款'),
  op('extract_fields', 'products', 'clean', 4500, 340, 'Organize product fields', '整理商品字段', 'Organize saved product details into a table with one row per barcode, retaining the source and retrieval time.', '将已保存的商品资料整理成每个条码一行的表格，保留资料来源与获取时间。', 'One product record per barcode', '每个条码对应一条商品记录'),
  op('confirm_category', 'products', 'clean', 4750, 340, 'Confirm current category', '核对当前商品类别', 'Check the selected category tag against the full current product tags.', '用完整商品对象的当前类别标签，复核抽样时指定的类别。', 'category_tag %in% categories_tags', 'category_tag %in% categories_tags'),
  op('flag_obsolete', 'products', 'clean', 5000, 340, 'Flag obsolete products', '标记停用商品状态', 'Retain the obsolete flag for the later primary-sample condition.', '保留商品停用标记，供主要样本筛选使用。', 'obsolete = isTRUE(as.logical(p$obsolete))', 'obsolete = isTRUE(as.logical(p$obsolete))'),
  op('package_units', 'products', 'clean', 5250, 340, 'Convert package units', '换算商品净含量单位', 'Normalize the full product record quantities to kg or L.', '对完整商品资料中的净含量重新换算，统一为 kg 或 L。', 'quantity_base = quantity × unit factor', 'quantity_base = 净含量 × 单位系数'),
  op('package_text', 'products', 'clean', 5500, 340, 'Parse multipack quantities', '解析多件装总净含量', 'Normalize decimal commas and spaces; parse simple and multipack quantities.', '统一小数逗号与空格，解析单件、多件装及外包装总净含量。', 'Simple, multiplier, reverse and outer-pack patterns', '单件、倍数、反向倍数与外包装格式'),
  op('package_check', 'products', 'check', 5750, 340, 'Check package agreement', '核对文本与结构化规格', 'Compare parsed and structured quantities. Flag a conflict above 2%; retain the two problematic records.', '核对文本与结构化规格，差异超过 2% 标记冲突；两款问题商品此时仍保留。', 'Relative difference ≤ 2%; correct kg/L basis', '相对差异 ≤ 2%；质量／体积基准正确'),
  op('nutri_2023', 'products', 'clean', 6000, 340, 'Select Nutri-Score 2023', '选择 2023 营养算法', 'Use the 2023 grade and score; fall back to source fields only when explicitly versioned 2023.', '优先读取 2023 等级与分数，仅当源字段明确为 2023 版本时才回退使用。', '2023 grade/score; retain older versions separately', '采用 2023 等级／分数，旧版本另行保留'),
  op('nutri_preparation', 'products', 'clean', 6250, 340, 'Handle prepared-state grades', '处理冲调状态营养等级', 'Set prepared-state grades/scores to missing for the as-sold comparison; keep the product and nutrient values.', '将明确按冲调状态计算的等级与分数置为缺失，商品和销售状态营养值继续保留。', '6 prepared-state grades set to missing', '6 款冲调状态等级置为缺失'),
  op('nutrients', 'products', 'check', 6500, 340, 'Validate 7 nutrient fields', '校验七项营养字段', 'Check finite, non-negative values, expected units and physical bounds. Missing fields remain missing.', '核查有限值、非负、源单位与物理范围，未提供的字段仍保留缺失。', 'Energy 0–1000 kcal; six other nutrients 0–100 g / 100 g or ml', '能量 0–1000 kcal；其余六项 0–100 g／每 100 g 或 ml'),
  op('environment', 'products', 'clean', 6750, 340, 'Map environmental fields', '统一环境评分字段', 'Map old/new environment fields and prefer the French grade with its matching French score.', '兼容新旧环境字段，优先采用法国等级及对应的法国分数。', 'French value first; global fallback with provenance', '优先法国值；回退全局值时保留来源'),
  op('carbon_mapping', 'products', 'clean', 7000, 340, 'Validate carbon mapping', '核查碳估算参考映射', 'Keep positive carbon estimates only with an explicit food/proxy reference and version.', '只有具备食品／代理参考项及版本，且估算为有效正数时，才保留碳估算。', 'Reference code + version + finite positive estimate', '参考代码＋版本＋有限正估算值'),

  op('select_quotes', 'link', 'filter', 7250, 0, 'Select sampled quotes', '提取入选商品报价', 'Filter the 83,141 retained observations using the 600 sampled barcodes.', '按 600 个入选条码，从 83,141 条研究范围内报价中提取记录。', 'code %in% selection$code', 'code %in% selection$code'),
  op('join_quotes', 'link', 'join', 7500, 0, 'Join quotes to products', '连接报价与商品属性', 'Attach one product quantity/category record to each quote. The many-to-one join preserves all quote rows.', '为每条报价补充唯一商品的规格与类别。多对一连接保留全部报价行。', '1,541 quotes LEFT JOIN 600 products BY code', '1,541 条报价 LEFT JOIN 600 款商品 BY code'),
  op('unit_prices', 'link', 'clean', 7750, 0, 'Compute unit prices', '计算单位价格', 'Divide package price by usable kg/L quantity. Unusable specifications yield missing unit prices.', '用整包价格除以可用的 kg/L 净含量；规格不可用时单位价格置为缺失。', 'price_eur / quantity_base; valid category and pack basis', 'price_eur / quantity_base；类别与规格基准有效'),
  op('mark_duplicates', 'link', 'clean', 8000, 0, 'Mark representative repeats', '标记代表价格重复项', 'Known-store identical quote combinations count once for aggregation. Unknown stores remain separate.', '已知门店的完全相同报价组合在汇总中计一次，未知门店不合并。原报价行继续保留。', 'representative_keep = unknown store OR first combination', 'representative_keep = 门店未知，或该组合首次出现'),
  op('regular_mask', 'link', 'clean', 8250, 0, 'Choose median inputs', '标记中位数参与记录', 'Select regular, retained, finite unit quotes inside each product median calculation.', '在每件商品的中位数计算中，选用非折扣、保留且单位价格有限的报价。', 'median_eligible shows the R summary predicate', 'median_eligible 为页面展示的 R 汇总条件标记'),
  op('aggregate_prices', 'link', 'aggregate', 8500, 0, 'Median per barcode', '按条码计算代表价格', 'Group all quotes by code and summarize valid regular unit prices, counts, stores and dates.', '按 code 分组，计算有效常规单位价格中位数，同时汇总次数、门店与日期。', '1,541 rows → 600 groups; invalid medians remain missing', '1,541 行 → 600 组；无有效价格的组保留缺失'),
  op('join_products', 'link', 'join', 8750, 0, 'Attach product price summary', '连接回完整商品资料', 'Left-join the per-code price summary to the full attributes, including nutrition and environment grades.', '将条码级价格汇总左连接回完整商品资料，与营养和环境等级对应。', '600 products LEFT JOIN summary BY code', '600 款商品 LEFT JOIN 价格汇总 BY code'),

  op('quality_flags', 'verify', 'clean', 9000, 0, 'Set quality/sample flags', '生成质量与样本标记', 'Compute primary, joint-grade and carbon flags and an explicit exclusion reason without deleting selected products.', '计算主要样本、联合等级和碳估算标记，记录明确的排除原因，保留全部入选商品。', 'in_primary; joint_grades_price; carbon_primary; exclusion_reason', '主要样本、联合样本、碳样本与排除原因'),
  op('freeze', 'verify', 'output', 9250, 0, 'Validate & freeze inputs', '核验并冻结分析输入', 'Validate keys, joins, physical units, versions and hashes; save the full selection, primary set and quote records.', '核验主键、连接、物理单位、版本与哈希，保存完整入选表、主要比较集及报价明细。', '600 selected; 598 primary; 1,541 quote records preserved', '600 款入选、598 款主要样本、1,541 条报价分别保存'),
  op('median_validation', 'verify', 'check', 9500, 0, 'Recompute all primary medians', '独立复算主要样本价格', 'Independently recompute each primary product median from the saved quotes before EDA.', 'EDA 开始前，从保存的报价独立复算全部主要样本商品的价格中位数。', '598 medians; absolute difference < 1e-9', '核对 598 个中位数；绝对差 < 1e-9'),
  op('restore_environment', 'verify', 'clean', 9750, 0, 'Recover environmental F', '恢复环境 F 等级', 'Reuse the product details previously saved from Open Food Facts to recover 16 omitted F grades. Match French grades with their scores and update coverage.', '从此前保存的 Open Food Facts 商品资料中恢复遗漏的 16 个 F 等级，使法国等级与对应分数一致，并重新计算指标覆盖情况。', 'Keep frozen_v1; write corrected step4_v1_1', '保留原冻结版 frozen_v1，另存修正版 step4_v1_1'),

  op('filter_matched', 'outputs', 'filter', 10000, 0, 'Require matched product', '主要样本：匹配成功', 'Expand the first component of the R in_primary condition as a cumulative view.', '将 R 中 in_primary 的条件逐项展开为累积筛选视图，先要求商品匹配成功。', 'match_status == "matched"', 'match_status == "matched"', true),
  op('filter_category', 'outputs', 'filter', 10250, 0, 'Require confirmed category', '主要样本：类别确认', 'Continue the primary-sample condition with the confirmed-category flag.', '继续要求商品当前类别已确认。', 'category_confirmed == TRUE', 'category_confirmed == TRUE', true),
  op('filter_quantity', 'outputs', 'filter', 10500, 0, 'Require comparable quantity', '主要样本：规格可比', 'Exclude the conflicting multipack and the product missing a usable net quantity.', '排除一款多件装规格冲突和一款缺少有效净含量的商品。', '600 → 598; retain excluded records in selected_products', '600 → 598；排除记录仍保留在完整入选表中', true),
  op('filter_current', 'outputs', 'filter', 10750, 0, 'Require active product', '主要样本：商品未停用', 'Continue the primary condition by excluding obsolete products.', '继续按主要样本条件，要求商品未被标记为停用。', '!obsolete', '!obsolete', true),
  op('filter_representative', 'outputs', 'filter', 11000, 0, 'Require valid representative price', '主要样本：代表价格有效', 'Require a finite positive representative unit price, completing the primary-sample view.', '要求代表单位价格为有限正数，完成主要比较样本的筛选。', 'is.finite(representative_price) & representative_price > 0', 'is.finite(representative_price) 且 representative_price > 0', true),
  op('excluded_products', 'outputs', 'output', 10500, 340, 'Keep exclusion records', '保留两款排除记录', 'The two excluded products stay in the full selection with their barcode and decision reason.', '两款排除商品继续保留在完整入选表中，附条码、规格和处理原因。', 'quantity_conflict; quantity_missing_or_wrong_basis', '包装规格冲突；有效净含量缺失'),
  op('order_grades', 'outputs', 'clean', 11250, 0, 'Order grade categories', '设置等级有序顺序', 'Set explicit category and grade ordering for the corrected analysis inputs.', '对修正后的分析输入设置明确的类别和等级顺序。', 'Nutrition A–E; environment A+, A, B, C, D, E, F', '营养 A–E；环境 A+、A、B、C、D、E、F'),
  op('subset_nutrition', 'outputs', 'output', 11500, -300, 'Nutrition comparison set', '价格与营养比较样本', 'Use primary products with an available nutrition grade. Other products remain available to other views.', '在主要样本中选取营养等级可用的商品，其余商品仍可用于其他视图。', 'in_primary & has_nutri', 'in_primary 且 has_nutri'),
  op('subset_environment', 'outputs', 'output', 11500, -100, 'Environment comparison set', '价格与环境比较样本', 'Use primary products with an available corrected environmental grade.', '在主要样本中选取修正后环境等级可用的商品。', 'in_primary & has_environment', 'in_primary 且 has_environment'),
  op('subset_joint', 'outputs', 'output', 11500, 100, 'Joint grade comparison set', '三维联合比较样本', 'Use products with representative price and both grades available.', '选取同时具备代表价格、营养等级与环境等级的商品。', '598 primary → 583 joint-grade products', '598 款主要样本 → 583 款联合样本'),
  op('subset_carbon', 'outputs', 'output', 11500, 300, 'AGRIBALYSE 3.2 set', 'AGRIBALYSE 3.2 子样本', 'Use a valid carbon reference and method version 3.2; shared references remain shared.', '采用有效碳参考映射且方法版本为 3.2 的商品，共用参考值的商品仍共用该估算。', 'in_primary & has_carbon & version == "3.2"', '主要样本＋有效碳映射＋3.2 版本'),
];

export const groups: { id: Group; title: Bilingual; focus: string }[] = [
  { id: 'prices', title: words('Price cleaning', '报价清洗'), focus: 'filter_fr' },
  { id: 'selection', title: words('Sample selection', '样本选择'), focus: 'catalog_join' },
  { id: 'products', title: words('Product cleaning', '商品清洗'), focus: 'package_check' },
  { id: 'link', title: words('Join & aggregate', '连接与汇总'), focus: 'join_quotes' },
  { id: 'verify', title: words('Validate & correct', '核验与修正'), focus: 'restore_environment' },
  { id: 'outputs', title: words('Analysis outputs', '分析样本'), focus: 'filter_quantity' },
];
export type Connection = { source: string; target: string; label?: Bilingual; archived?: boolean };
const chain = (...ids: string[]): Connection[] => ids.slice(1).map((target, i) => ({ source: ids[i], target }));
export const connections: Connection[] = [
  ...chain('price_source', 'price_hash', 'barcode_type', 'filter_fr', 'filter_eur', 'filter_year', 'filter_barcode', 'filter_positive', 'rename_prices', 'flag_repeats', 'price_universe'),
  ...chain('catalog_source', 'catalog_distinct', 'catalog_units', 'catalog_text', 'catalog_join', 'catalog_match', 'catalog_regular', 'catalog_quantity', 'sample_sort', 'sample_select', 'fetch_batch', 'fetch_confirm', 'extract_fields', 'confirm_category', 'flag_obsolete', 'package_units', 'package_text', 'package_check', 'nutri_2023', 'nutri_preparation', 'nutrients', 'environment', 'carbon_mapping'),
  { source: 'price_universe', target: 'catalog_join', label: words('Match by barcode', '按商品条码匹配') },
  { source: 'flag_repeats', target: 'select_quotes', label: words('83,141 quote records', '83,141 条报价明细') },
  { source: 'sample_select', target: 'select_quotes', label: words('600 selected product barcodes', '600 个入选商品条码') },
  ...chain('select_quotes', 'join_quotes', 'unit_prices', 'mark_duplicates', 'regular_mask', 'aggregate_prices', 'join_products', 'quality_flags', 'freeze', 'median_validation', 'restore_environment', 'filter_matched', 'filter_category', 'filter_quantity', 'filter_current', 'filter_representative', 'order_grades'),
  { source: 'carbon_mapping', target: 'join_quotes', label: words('Attach product details by barcode', '按条码补充商品资料') },
  { source: 'carbon_mapping', target: 'join_products', label: words('Nutrition and environment details', '商品营养与环境资料') },
  { source: 'fetch_confirm', target: 'restore_environment', archived: true, label: words('Reuse saved product details', '复用已保存的商品资料') },
  { source: 'quality_flags', target: 'excluded_products', label: words('2 records retained', '2 条排除记录保留') },
  ...['subset_nutrition', 'subset_environment', 'subset_joint', 'subset_carbon'].map(target => ({ source: 'order_grades', target })),
];

export const kindLabels: Record<OperationKind, Bilingual> = {
  source: words('Input', '输入'), check: words('Validate', '核验'), filter: words('Filter', '筛选'), clean: words('Clean', '清洗'),
  join: words('Join', '连接'), aggregate: words('Aggregate', '汇总'), sample: words('Sample', '抽样'), output: words('Output', '输出'),
};
export const metricLabels: Record<string, Bilingual> = {
  marked: words('Potential repeat rows marked', '疑似重复标记行'), confirmed: words('Categories confirmed', '类别确认数'),
  obsolete: words('Obsolete products flagged', '停用商品标记数'), unusable: words('Unusable package specifications', '不可比规格数'),
  prepared: words('Prepared-state grades cleared', '冲调等级置缺失数'), valid: words('Finite unit prices', '有效单位价格数'),
  omitted: words('Repeat rows not used in median', '中位数不重复计入行数'), eligible: words('Quotes used in medians', '参与中位数计算的报价数'),
  checked: words('Product medians independently checked', '独立复核价格的商品数'), restored: words('F grades restored', '恢复的 F 等级数'), seed: words('R random seed', 'R 随机种子'),
};
