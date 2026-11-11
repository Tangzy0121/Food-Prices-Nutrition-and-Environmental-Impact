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
assert.deepEqual([...ids].sort(), Object.keys(traces).sort(), 'Every exported operation must have a visible node');
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
assert.equal(traces.restore_environment.metrics.restored, 16);
assert.equal(traces.subset_joint.afterCount, 583);
assert(traces.rename_prices.after.rows.some(row => typeof row.code === 'string'), 'Barcode preview keys must remain character data');
console.log(`Processing flow verified: ${operations.length} operations, ${connections.length} connections, two inputs, no cycles, complete bilingual copy and matched R excerpts.`);
