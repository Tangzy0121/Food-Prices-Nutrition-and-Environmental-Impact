import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const site = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(site, '..');
const processingTrace = JSON.parse(await readFile(path.join(site, 'src/data/processing-trace.json'), 'utf8'));
assert.deepEqual(processingTrace, JSON.parse(await readFile(path.join(site, 'public/evidence/processing-trace.json'), 'utf8')), 'Source and downloadable processing traces must agree');
assert.equal(Object.keys(processingTrace.steps).length, 56);
assert.equal(processingTrace.steps.filter_positive.afterCount, 83141);
assert.equal(processingTrace.steps.join_quotes.beforeCount, processingTrace.steps.join_quotes.afterCount, 'The quote join must preserve row cardinality');
assert.equal(processingTrace.steps.subset_joint.afterCount, 583);
let sourcesAvailable = false;
try { await access(path.join(root, 'outputs/tables/step3/price_filter_flow.csv')); sourcesAvailable = true; } catch {}
if (!sourcesAvailable || process.argv.includes('--check-bundle')) {
  // Vercel may build only the website directory. The checked-in, R-derived
  // presentation bundle is sufficient and never depends on a live R service.
  const stored = JSON.parse(await readFile(path.join(site, 'src/data/presentation.json'), 'utf8'));
  const published = JSON.parse(await readFile(path.join(site, 'public/evidence/presentation.json'), 'utf8'));
  assert.deepEqual(stored, published, 'Source and downloadable presentation snapshots must agree');
  assert.equal(stored.counts.joint, 583);
  assert.equal(stored.tables.categories.reduce((n, r) => n + Number(r.n), 0), stored.counts.primary);
  assert.equal(stored.tables.selection.reduce((n, r) => n + Number(r.n_selected), 0), stored.counts.selected);
  assert.equal(stored.counts.retrieved, stored.counts.selected);
  for (const example of stored.examples) {
    assert.equal(typeof example.code, 'string');
    assert(example.quotes.every(q => q.code === example.code));
    const values = example.quotes.filter(q => !q.discounted && q.kept).map(q => q.unitPrice).sort((a,b) => a-b);
    const middle = Math.floor(values.length / 2);
    const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    assert(Math.abs(median - example.representativePrice) < 1e-8);
  }
  assert(stored.examples.some(e => e.code.startsWith('00')));
  const { createHash } = await import('node:crypto');
  for (const [file, digest] of Object.entries(stored.evidenceHashes)) {
    const bytes = await readFile(path.join(site, 'public/evidence', file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), digest, `Evidence changed: ${file}`);
  }
  console.log('Standalone presentation bundle verified: keys, counts, example medians and evidence hashes.');
  process.exit(0);
}
const csv = async (relative) => {
  const input = (await readFile(path.join(root, relative), 'utf8')).replace(/^\uFEFF/, '');
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if (c === '\n' && !quoted) { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const headers = rows.shift();
  assert(headers?.length, `Missing CSV headers: ${relative}`);
  return rows.filter(r => r.some(Boolean)).map(r => {
    assert.equal(r.length, headers.length, `Malformed CSV: ${relative}`);
    return Object.fromEntries(headers.map((h, i) => [h, r[i]]));
  });
};
const files = {
  flow: 'outputs/tables/step3/price_filter_flow.csv',
  selection: 'outputs/tables/step3/formal_selection_flow.csv',
  coverage: 'outputs/step4/tables/coverage.csv',
  categories: 'outputs/step4/tables/category_summary.csv',
  corrections: 'outputs/step4/tables/environment_grade_corrections.csv',
  exclusions: 'outputs/step4/tables/exclusions.csv',
};
for (const step of Object.values(processingTrace.steps)) {
  const sourceLines = (await readFile(path.join(root, step.source), 'utf8')).split(/\r?\n/);
  const excerpt = sourceLines.slice(step.line - 1, step.line - 1 + step.code.split('\n').length).join('\n');
  assert.equal(excerpt, step.code, `R excerpt drifted: ${step.source}:${step.line}; refresh export-processing-trace.R`);
}
const tables = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([k, f]) => [k, await csv(f)])));
const products = await csv('data/processed/frozen_v1/selected_products.csv');
const quotes = await csv('website/public/evidence/link-examples.csv');
const acquisition = JSON.parse(await readFile(path.join(root, 'outputs/tables/step3/formal_acquisition_manifest.json'), 'utf8'));
const selectionManifest = JSON.parse(await readFile(path.join(root, 'outputs/tables/step3/formal_selection_manifest.json'), 'utf8'));
const sum = (rows, field) => rows.reduce((a, r) => a + Number(r[field]), 0);
const coverageCount = (indicator) => sum(tables.coverage.filter(r => r.indicator === indicator), 'n_available');
const counts = {
  raw: Number(tables.flow[0].price_observations),
  scoped: Number(tables.flow.at(-1).price_observations),
  barcodes: Number(tables.flow.at(-1).products),
  catalog: sum(tables.selection, 'n_catalog'),
  eligible: sum(tables.selection, 'n_eligible'),
  selected: sum(tables.selection, 'n_selected'),
  retrieved: acquisition.matched,
  primary: sum(tables.categories, 'n'),
  linked: sum(products, 'n_prices'),
  joint: coverageCount('Joint grades and price'),
  carbon: coverageCount('Carbon 3.2'),
  environment: coverageCount('Environment grade'),
  corrections: tables.corrections.length,
};
assert.equal(new Set(products.map(p => p.code)).size, products.length, 'Product key must be unique');
assert.equal(counts.selected, products.length);
assert.equal(counts.retrieved, counts.selected);
assert.equal(counts.primary, products.filter(p => p.in_primary === 'TRUE').length);
assert.equal(counts.primary, coverageCount('Price'));
assert(counts.joint <= counts.primary && counts.environment <= counts.primary);
assert.equal(counts.corrections, 16);
assert.equal(counts.joint, 583, 'Use the corrected Step 4 coverage, not frozen_v1 joint coverage');
const examples = ['3350031923081', '8410376055856', '0016229901189'].map(code => {
  const p = products.find(p => p.code === code);
  assert(p, `Product not found: ${code}`);
  const rows = quotes.filter(q => q.code === code);
  assert.equal(rows.length, Number(p.n_prices));
  const regular = rows.filter(q => q.price_is_discounted === 'FALSE' && q.representative_keep === 'TRUE').map(q => Number(q.unit_price_eur)).sort((a, b) => a - b);
  const mid = Math.floor(regular.length / 2);
  const median = regular.length % 2 ? regular[mid] : (regular[mid - 1] + regular[mid]) / 2;
  assert(Math.abs(median - Number(p.representative_price)) < 1e-8, `Representative price mismatch: ${code}`);
  const correction = tables.corrections.find(c => c.code === code);
  return {
    code, name: p.product_name, brand: p.brands, category: p.category,
    quantity: p.quantity_text, quantityBase: Number(p.quantity_base), unit: p.target_unit,
    nutrition: p.nutri_grade.toUpperCase(), environment: (correction?.restored_grade ?? p.environment_grade).toUpperCase(),
    retrieved: p.retrieved_at_utc, representativePrice: Number(p.representative_price),
    quotes: rows.map(q => ({ id: q.price_id, code: q.code, date: q.date, price: Number(q.price_eur), unitPrice: Number(q.unit_price_eur), discounted: q.price_is_discounted === 'TRUE', kept: q.representative_keep === 'TRUE' })),
  };
});
assert(examples.some(e => e.code.startsWith('00')), 'Keep the leading-zero example');
const data = { counts, seed: selectionManifest.seed, tables, examples, snapshot: '2026-11-05', productSnapshot: '2026-11-02', evidenceHashes: {} };
await mkdir(path.join(site, 'src/data'), { recursive: true });
await mkdir(path.join(site, 'public/evidence'), { recursive: true });
for (const f of Object.values(files)) await copyFile(path.join(root, f), path.join(site, 'public/evidence', path.basename(f)));
for (const f of ['R/00_download_prices.R', 'R/01_import_prices.R', 'R/05_select_formal_sample.R', 'R/06_acquire_formal_products.R', 'R/07_prepare_formal_data.R', 'R/08_validate_and_freeze.R', 'R/quantity_helpers.R', 'R/09b_restore_environment_grades.R', 'R/10_eda.R', 'docs/03_data/data_description.md', 'docs/04_eda/environment_grade_correction.md']) {
  await copyFile(path.join(root, f), path.join(site, 'public/evidence', path.basename(f)));
}
const { createHash } = await import('node:crypto');
const { readdir } = await import('node:fs/promises');
for (const filename of (await readdir(path.join(site, 'public/evidence'))).sort()) {
  if (filename === 'presentation.json') continue;
  data.evidenceHashes[filename] = createHash('sha256').update(await readFile(path.join(site, 'public/evidence', filename))).digest('hex');
}
await writeFile(path.join(site, 'src/data/presentation.json'), JSON.stringify(data, null, 2) + '\n');
await writeFile(path.join(site, 'public/evidence/presentation.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`Presentation synced: ${counts.selected} matched products, ${counts.linked} linked quotes, ${counts.primary} primary / ${counts.joint} joint products. Barcode and example-price checks passed.`);
