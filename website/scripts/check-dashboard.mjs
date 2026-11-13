import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { categories, nutritionGrades, environmentGrades, logBox, association, median, quantile, logDomain, logTicks, csvRows } from '../src/dashboardModel.ts';
const bundle = JSON.parse(await readFile(new URL('../src/data/dashboard.json', import.meta.url), 'utf8'));
const { products: p, boxes, tables: t } = bundle;
const near = (a, b, message) => assert(Math.abs(a - b) < 1e-9, message);
assert.equal(p.length, 598);
assert.equal(new Set(p.map(p => p.code)).size, 598);
assert.equal(p.filter(p => p.joint_grades_price).length, 583);
assert.equal(p.filter(p => p.environment_grade === 'f').length, 16);
assert(p.every(p => typeof p.code === 'string' && p.representative_price > 0));
assert(p.some(p => p.code.startsWith('00')));
for (const [file, expected] of Object.entries(bundle.sourceHashes)) {
  let bytes;
  try { bytes = await readFile(new URL(file.startsWith('website/') ? `../${file.slice(8)}` : `../../${file}`, import.meta.url)); }
  catch (error) { if (error.code === 'ENOENT' && !file.startsWith('website/')) continue; throw error; }
  const portableBytes = /\.(R|csv)$/.test(file) ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes;
  assert.equal(createHash('sha256').update(portableBytes).digest('hex'), expected, `Refresh export-dashboard.R: ${file}`);
}
const groups = (cat, dimension, grade) => p.filter(p => p.category === cat && (dimension === 'all' || p[dimension === 'nutrition' ? 'nutri_grade' : 'environment_grade'] === grade));
for (const b of boxes) {
  const rows = groups(b.category, b.dimension, b.grade);
  assert.equal(rows.length, b.n);
  const actual = logBox(rows.map(p => p.representative_price));
  for (const key of ['lower', 'q1', 'middle', 'q3', 'upper']) near(actual[key], b[key], `R box: ${b.category}/${b.grade}/${key}`);
}
const coverageFields = { Price: () => true, 'Nutri-Score 2023': p => p.nutri_grade !== null, 'Environment grade': p => p.environment_grade !== null, 'Joint grades and price': p => p.joint_grades_price, Sugars: p => p.sugars_100g !== null, Fibre: p => p.fiber_100g !== null, 'Carbon 3.2': p => p.carbon_primary };
for (const row of t.coverage) {
  const d = p.filter(p => p.category === row.category);
  assert.equal(d.length, row.n);
  assert.equal(d.filter(coverageFields[row.indicator]).length, row.n_available);
  assert.equal(row.n_available + row.n_missing, row.n);
}
for (const row of t.associations) {
  const actual = association(p.filter(p => p.category === row.category), row.metric);
  assert.equal(actual.n, row.n);
  if (row.rho === null) assert.equal(actual.rho, null); else near(actual.rho, row.rho, 'R association');
}
for (const row of t.joint_cells) {
  const d = p.filter(p => p.category === row.category && p.nutri_grade === row.nutri_grade && p.environment_grade === row.environment_grade);
  assert.equal(d.length, row.n);
  near(median(d.map(p => p.representative_price)), row.median_price, 'Joint median');
  near(row.median_price / row.category_median, row.relative_price, 'Joint colour basis');
}
assert.equal(t.joint_cells.reduce((n, r) => n + r.n, 0), 583);
for (const row of t.carbon_references) {
  const d = p.filter(p => p.carbon_primary && p.category === row.category && p.agribalyse_food_code === row.agribalyse_food_code && p.agribalyse_proxy_food_code === row.agribalyse_proxy_food_code && p.agribalyse_name === row.agribalyse_name && p.co2_total === row.co2_total);
  assert.equal(d.length, row.n_products);
  near(median(d.map(p => p.representative_price)), row.median_price, 'Reference median');
}
assert.equal(t.carbon_references.reduce((n, r) => n + r.n_products, 0), 594);
for (const c of categories) {
  const summary = t.paired_year_summary.find(r => r.category === c), d = t.paired_year_prices.filter(r => r.category === c);
  assert.equal(summary.n, d.length);
  near(median(d.map(r => r.change_pct)), summary.median_change_pct, 'Paired year median');
  near(quantile(d.map(r => r.change_pct), .25), summary.q1, 'Paired year Q1');
  near(quantile(d.map(r => r.change_pct), .75), summary.q3, 'Paired year Q3');
}
for (const row of t.paired_year_prices) near(100 * (row.year_2025 / row.year_2024 - 1), row.change_pct, 'Paired product change');
assert.equal(t.paired_year_prices.length, 193);
assert.equal(t.association_sensitivity.length, 120);
for (const row of t.association_sensitivity) {
  assert(row.n >= 0 && row.n <= p.filter(p => p.category === row.category).length);
  for (const key of ['rho_main_same_goods', 'rho_variant', 'rho_main_full']) assert(row[key] === null || Math.abs(row[key]) <= 1);
  if (row.scenario === 'at_least_two_offers') near(row.rho_main_same_goods, row.rho_variant, 'Same-price sensitivity');
}
assert.deepEqual(nutritionGrades, ['a','b','c','d','e']);
assert.deepEqual(environmentGrades, ['a-plus','a','b','c','d','e','f']);
assert(logTicks(logDomain([.77,13.98])).every(v => v > 0));
assert(csvRows([{code:'00123',name:'=SUM(1,2)',rho:-.25}]).includes('"-0.25"'));
console.log(`Research dashboard verified: 6 directions, ${boxes.length} R boxes, 28 coverage cells, 20 correlations, ${t.joint_cells.length} joint cells, ${t.carbon_references.length} carbon references, 120 sensitivity rows and 193 paired products.`);
