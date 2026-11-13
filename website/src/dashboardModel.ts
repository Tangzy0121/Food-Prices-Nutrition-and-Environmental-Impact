export const categories = ['biscuits', 'breakfast_cereals', 'dark_chocolates', 'fruit_juices'] as const;
export type Category = typeof categories[number];
export const categoryLabels: Record<Category, string> = { biscuits: 'Biscuits', breakfast_cereals: 'Breakfast cereals', dark_chocolates: 'Dark chocolate', fruit_juices: 'Fruit juices' };
export const nutritionGrades = ['a', 'b', 'c', 'd', 'e'];
export const environmentGrades = ['a-plus', 'a', 'b', 'c', 'd', 'e', 'f'];
export const metricLabels = { nutri_score: 'Nutrition score', environment_score: 'Environmental score', sugars_100g: 'Sugars', saturated_fat_100g: 'Saturated fat', fiber_100g: 'Fibre' };
export type Metric = keyof typeof metricLabels;
export type Product = {
  code: string; category: Category; product_name: string | null; brands: string | null; quantity_text: string | null;
  target_unit: string; representative_price: number; nutri_grade: string | null; environment_grade: string | null;
  nutri_score: number | null; environment_score: number | null; sugars_100g: number | null;
  saturated_fat_100g: number | null; fiber_100g: number | null; n_valid_regular_offers: number;
  n_stores: number; first_price_date: string; last_price_date: string; joint_grades_price: boolean;
  carbon_primary: boolean; co2_total: number | null; agribalyse_food_code: string | null;
  agribalyse_proxy_food_code: string | null; agribalyse_name: string | null;
};
export type Box = { category: Category; dimension: 'all' | 'nutrition' | 'environment'; grade: string; n: number; lower: number; q1: number; middle: number; q3: number; upper: number };
export type Coverage = { category: Category; indicator: string; n_available: number; n: number; n_missing: number };
export type Association = { category: Category; metric: Metric; n: number; rho: number | null };
export type JointCell = { category: Category; nutri_grade: string; environment_grade: string; n: number; median_price: number; category_median: number; relative_price: number };
export type Carbon = { category: Category; agribalyse_food_code: string | null; agribalyse_proxy_food_code: string | null; agribalyse_name: string; co2_total: number; n_products: number; median_price: number };
export type Sensitivity = { category: Category; scenario: string; metric: Metric; n: number; rho_main_same_goods: number | null; rho_variant: number | null; rho_main_full: number | null };
export type YearPair = { code: string; category: Category; year_2024: number; year_2025: number; change_pct: number };
export type YearSummary = { category: Category; n: number; median_change_pct: number; q1: number; q3: number };
export type DashboardData = {
  version: string; products: Product[]; boxes: Box[];
  tables: { coverage: Coverage[]; category_summary: { category: Category; n: number; median_price: number; target_unit: string }[];
    associations: Association[]; joint_cells: JointCell[]; carbon_references: Carbon[];
    carbon_summary: { category: Category; n_products: number; n_references: number }[];
    association_sensitivity: Sensitivity[]; paired_year_prices: YearPair[]; paired_year_summary: YearSummary[] };
};
export const gradeLabel = (grade: string | null) => grade === 'a-plus' ? 'A+' : grade?.toUpperCase() ?? '—';
export const productName = (p: Product) => p.product_name?.trim() || p.code;
export const quantile = (values: number[], probability: number): number => {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * probability, lower = Math.floor(index), fraction = index - lower;
  return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
};
export const median = (values: number[]) => quantile(values, .5);
export function logBox(values: number[]) {
  const log = values.map(Math.log10), q1 = quantile(log, .25), middle = quantile(log, .5), q3 = quantile(log, .75);
  const inside = log.filter(v => v >= q1 - 1.5 * (q3 - q1) && v <= q3 + 1.5 * (q3 - q1));
  return { lower: 10 ** Math.min(...inside), q1: 10 ** q1, middle: 10 ** middle, q3: 10 ** q3, upper: 10 ** Math.max(...inside) };
}
function ranks(values: number[]): number[] {
  const sorted = values.map((value, i) => ({ value, i })).sort((a, b) => a.value - b.value), result = Array<number>(values.length);
  for (let i = 0; i < sorted.length;) {
    let j = i + 1;
    while (j < sorted.length && sorted[j].value === sorted[i].value) j++;
    for (let k = i; k < j; k++) result[sorted[k].i] = (i + j + 1) / 2;
    i = j;
  }
  return result;
}
export function association(products: Product[], metric: Metric): { n: number; rho: number | null } {
  const pairs = products.filter(p => p[metric] !== null && Number.isFinite(p[metric]));
  if (pairs.length < 3) return { n: pairs.length, rho: null };
  const xs = ranks(pairs.map(p => p.representative_price)), ys = ranks(pairs.map(p => p[metric]!)), mean = (pairs.length + 1) / 2;
  let xy = 0, xx = 0, yy = 0;
  xs.forEach((x, i) => { const dx = x - mean, dy = ys[i] - mean; xy += dx * dy; xx += dx * dx; yy += dy * dy; });
  return { n: pairs.length, rho: xx && yy ? xy / Math.sqrt(xx * yy) : null };
}
export function jitter(key: string): number {
  let hash = 2166136261;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return ((hash >>> 0) % 1000) / 999 - .5;
}
export function logDomain(values: number[]): [number, number] {
  const finite = values.filter(v => Number.isFinite(v) && v > 0);
  if (!finite.length) return [1, 10];
  const low = Math.log10(Math.min(...finite)), high = Math.log10(Math.max(...finite));
  const padding = Math.max(.06, (high - low) * .06);
  return [10 ** (low - padding), 10 ** (high + padding)];
}
export function logTicks(domain: [number, number]): number[] {
  const ticks = [];
  for (let exponent = Math.floor(Math.log10(domain[0])); exponent <= Math.ceil(Math.log10(domain[1])); exponent++) {
    for (const multiplier of [1, 2, 5]) { const v = multiplier * 10 ** exponent; if (v >= domain[0] && v <= domain[1]) ticks.push(v); }
  }
  return ticks;
}
export function csvRows(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const fields = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    let text = value == null ? '' : String(value);
    if (typeof value === 'string' && /^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [fields.join(','), ...rows.map(row => fields.map(f => escape(row[f])).join(','))].join('\r\n');
}
