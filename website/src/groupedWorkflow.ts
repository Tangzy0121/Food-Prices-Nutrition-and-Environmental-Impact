import { connections, operations, traces, words } from './fullWorkflow';
import type { Bilingual, Group, OperationKind } from './fullWorkflow';

export type FlowBlock = {
  id: string; group: Group; kind: OperationKind; title: Bilingual;
  operationIds: string[]; x: number; y: number; independentOutputs?: boolean;
};
const block = (id: string, group: Group, kind: OperationKind, x: number, y: number, en: string, zh: string, operationIds: string[], independentOutputs = false): FlowBlock => ({ id, group, kind, x, y, title: words(en, zh), operationIds, independentOutputs });

// Group only related operations. The original traces remain the source of truth.
export const flowBlocks: FlowBlock[] = [
  block('price_input', 'prices', 'source', 0, -160, 'Read & verify prices', '读取与核验报价', ['price_source', 'price_hash', 'barcode_type']),
  block('price_scope', 'prices', 'filter', 230, -160, 'Clean research quotes', '筛选与整理报价', ['filter_fr', 'filter_eur', 'filter_year', 'filter_barcode', 'filter_positive', 'rename_prices', 'flag_repeats']),
  block('price_directory', 'prices', 'aggregate', 460, -160, 'Summarize barcode coverage', '汇总条码覆盖', ['price_universe']),
  block('category_input', 'selection', 'source', 230, 140, 'Prepare category catalog', '整理食品类别目录', ['catalog_source', 'catalog_distinct', 'catalog_units', 'catalog_text']),
  block('eligible_pool', 'selection', 'filter', 690, 0, 'Build eligible product pool', '筛选候选商品', ['catalog_join', 'catalog_match', 'catalog_regular', 'catalog_quantity']),
  block('balanced_sample', 'selection', 'sample', 920, 0, 'Sample 600 products', '分层抽取 600 款', ['sample_sort', 'sample_select']),
  block('product_attributes', 'products', 'source', 1150, 220, 'Retrieve & check products', '获取与核对商品', ['fetch_batch', 'fetch_confirm', 'extract_fields', 'confirm_category', 'flag_obsolete']),
  block('package_quantities', 'products', 'clean', 1380, 220, 'Normalize package quantities', '统一包装规格', ['package_units', 'package_text', 'package_check']),
  block('nutrition_fields', 'products', 'clean', 1610, 220, 'Prepare nutrition fields', '整理营养指标', ['nutri_2023', 'nutri_preparation', 'nutrients']),
  block('environment_fields', 'products', 'clean', 1840, 220, 'Prepare environment fields', '整理环境指标', ['environment', 'carbon_mapping']),
  block('sampled_quotes', 'link', 'filter', 1150, -160, 'Extract sampled quotes', '提取样本报价', ['select_quotes']),
  block('unit_quote_inputs', 'link', 'join', 2070, 0, 'Join & prepare unit prices', '连接与整理单位报价', ['join_quotes', 'unit_prices', 'mark_duplicates', 'regular_mask']),
  block('product_prices', 'link', 'aggregate', 2300, 0, 'Summarize product prices', '汇总代表价格', ['aggregate_prices', 'join_products']),
  block('validated_inputs', 'verify', 'check', 2530, 0, 'Validate & correct inputs', '核验与修正数据', ['quality_flags', 'freeze', 'median_validation', 'restore_environment']),
  block('primary_products', 'outputs', 'filter', 2760, 0, 'Form primary comparison set', '形成主要比较样本', ['filter_matched', 'filter_category', 'filter_quantity', 'filter_current', 'filter_representative', 'order_grades']),
  block('exclusion_log', 'outputs', 'output', 2760, 260, 'Preserve exclusion records', '保留排除记录', ['excluded_products']),
  block('analysis_sets', 'outputs', 'output', 2990, -110, 'Create analysis subsets', '生成分析子样本', ['subset_nutrition', 'subset_environment', 'subset_joint', 'subset_carbon'], true),
];

export const blockById = Object.fromEntries(flowBlocks.map(item => [item.id, item]));
export const blockForOperation: Record<string, FlowBlock> = Object.fromEntries(flowBlocks.flatMap(item => item.operationIds.map(id => [id, item])));
export const blockCounts = (item: FlowBlock) => ({ before: traces[item.operationIds[0]].beforeCount, after: traces[item.operationIds.at(-1)!].afterCount });

// Retain all external dependencies, including the archived-object correction link.
const externalConnections = new Map<string, { source: string; target: string; label?: Bilingual; archived?: boolean }>();
for (const edge of connections) {
  const source = blockForOperation[edge.source].id;
  const target = blockForOperation[edge.target].id;
  if (source === target) continue;
  const key = `${source}:${target}:${Boolean(edge.archived)}`;
  const previous = externalConnections.get(key);
  externalConnections.set(key, { source, target, archived: edge.archived, label: previous?.label ?? edge.label });
}
export const blockConnections = [...externalConnections.values()];

// Keep this derived count separate from the number of visible diagram nodes.
export const underlyingOperationCount = operations.length;
