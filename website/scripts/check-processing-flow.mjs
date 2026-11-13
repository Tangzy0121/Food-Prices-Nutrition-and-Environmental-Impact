import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = fileURLToPath(new URL('../src/fullWorkflow.ts', import.meta.url));
const compiled = ts.transpileModule(await readFile(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
const exports = {};
runInNewContext(compiled.outputText, { exports, require: createRequire(source) }, { timeout: 3000 });
const { operations, connections, traces, groups } = exports;
assert.equal(operations.length, 56);
const ids = operations.map(op => op.id);
assert.equal(new Set(ids).size, ids.length, 'Operation IDs must be unique');
assert.deepEqual([...ids].sort(), Object.keys(traces).sort(), 'Every inspectable operation must have an exported trace');
for (const op of operations) {
  for (const field of ['title', 'description', 'condition']) {
    assert(op[field].en?.trim() && op[field].zh?.trim(), `${op.id}: missing bilingual ${field}`);
  }
  const trace = traces[op.id];
  assert(trace.source && trace.line > 0 && trace.code, `${op.id}: missing R source provenance`);
  assert(trace.beforeCount >= trace.before.rows.length && trace.afterCount >= trace.after.rows.length);
}
for (const edge of connections) assert(ids.includes(edge.source) && ids.includes(edge.target), 'An edge references an unknown node');
const visiting = new Set(); const visited = new Set();
function visit(id) {
  assert(!visiting.has(id), `Cycle in processing flow at ${id}`);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const edge of connections.filter(edge => edge.source === id)) visit(edge.target);
  visiting.delete(id); visited.add(id);
}
const roots = ids.filter(id => !connections.some(edge => edge.target === id));
assert.deepEqual(Array.from(roots), ['price_source', 'catalog_source']);
roots.forEach(visit);
assert.equal(visited.size, operations.length, 'Every node must be reachable from a real input');
for (const group of groups) assert(operations.some(op => op.id === group.focus && op.group === group.id));
assert.equal(connections.filter(edge => edge.target === 'join_quotes').length, 2, 'The quote join must show both inputs');
assert.equal(traces.join_quotes.beforeCount, 1541);
assert.equal(traces.join_quotes.afterCount, 1541);
assert.equal(traces.aggregate_prices.afterCount, 600);
assert.equal(traces.filter_quantity.afterCount, 598);
assert.equal(traces.excluded_products.afterCount, 2);
assert.equal(traces.median_validation.beforeCount, 598);
assert.equal(traces.median_validation.afterCount, 598);
assert.equal(traces.median_validation.metrics.checked, 598);
assert(traces.median_validation.after.rows.every(row => row.in_primary === true), 'Median validation must preview only primary products');
assert.equal(traces.restore_environment.metrics.restored, 16);
assert.equal(traces.subset_joint.afterCount, 583);
for (const id of ['subset_nutrition', 'subset_environment', 'subset_joint', 'subset_carbon']) {
  assert(!operations.find(op => op.id === id).view, `${id}: independent analysis subsets are not cumulative views`);
}
assert(traces.rename_prices.after.rows.some(row => typeof row.code === 'string'), 'Barcode preview keys must remain character data');
console.log(`Processing flow verified: ${operations.length} operations, ${connections.length} connections, two inputs, no cycles, complete bilingual copy and matched R excerpts.`);

const groupedSource = fileURLToPath(new URL('../src/groupedWorkflow.ts', import.meta.url));
const groupedCompiled = ts.transpileModule(await readFile(groupedSource, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const groupedExports = {};
runInNewContext(groupedCompiled.outputText, { exports: groupedExports, require: id => id === './fullWorkflow' ? exports : createRequire(groupedSource)(id) }, { timeout: 3000 });
const { flowBlocks, blockConnections, blockForOperation, blockCounts } = groupedExports;
const blockIds = flowBlocks.map(block => block.id);
assert.equal(new Set(blockIds).size, flowBlocks.length, 'Grouped node IDs must be unique');
assert(flowBlocks.length < operations.length / 2, 'The canvas should substantially reduce the number of nodes');
assert.deepEqual(Array.from(flowBlocks.flatMap(block => block.operationIds)).sort(), [...ids].sort(), 'Every operation must belong to exactly one grouped node');
for (const block of flowBlocks) {
  assert(block.title.en?.trim() && block.title.zh?.trim(), `${block.id}: missing bilingual title`);
  assert(block.operationIds.every(id => operations.find(op => op.id === id)?.group === block.group), `${block.id}: group crosses unrelated stages`);
  if (block.independentOutputs) assert(block.operationIds.every(id => operations.find(op => op.id === id)?.kind === 'output'));
}
for (const edge of connections) {
  const source = blockForOperation[edge.source].id;
  const target = blockForOperation[edge.target].id;
  if (source !== target) assert(blockConnections.some(link => link.source === source && link.target === target && Boolean(link.archived) === Boolean(edge.archived)), `Lost dependency: ${edge.source} → ${edge.target}`);
}
const blockVisited = new Set(); const blockVisiting = new Set();
function visitBlock(id) {
  assert(!blockVisiting.has(id), `Grouped flow cycle at ${id}`);
  if (blockVisited.has(id)) return;
  blockVisiting.add(id);
  for (const edge of blockConnections.filter(edge => edge.source === id)) {
    assert(blockIds.includes(edge.target), `Unknown grouped target ${edge.target}`);
    visitBlock(edge.target);
  }
  blockVisiting.delete(id); blockVisited.add(id);
}
const blockRoots = blockIds.filter(id => !blockConnections.some(edge => edge.target === id));
assert.deepEqual(Array.from(blockRoots), ['price_input', 'category_input']);
blockRoots.forEach(visitBlock);
assert.equal(blockVisited.size, flowBlocks.length, 'Every grouped node must be reachable from a real input');
assert.equal(blockCounts(blockForOperation.filter_quantity).before, 600);
assert.equal(blockCounts(blockForOperation.filter_quantity).after, 598);
assert.equal(blockCounts(blockForOperation.aggregate_prices).before, 1541);
assert.equal(blockCounts(blockForOperation.aggregate_prices).after, 600);
assert(blockForOperation.subset_joint.independentOutputs, 'Analysis subsets overlap and must not be presented as one summed row count');
console.log(`Grouped canvas verified: ${flowBlocks.length} nodes, ${blockConnections.length} connections, all ${operations.length} operations inspectable exactly once.`);
