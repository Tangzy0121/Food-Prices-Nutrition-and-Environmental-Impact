/* Copy the built English report into the published site so the Download
   button always serves the same PDF that was last assembled.
   Run after `./scripts/build_report.ps1`. */
import { copyFile, mkdir, stat, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(site, '..');
const candidates = ['output/food-value-report-v3.pdf', 'output/food-value-report-en.pdf'];
const target = path.join(site, 'public/downloads/food-choices-report.pdf');
let source = null;
for (const relative of candidates) {
  const file = path.join(root, relative);
  try { await access(file); source = file; break; } catch { /* try the next candidate */ }
}
if (!source) {
  try {
    await stat(target);
    console.log('No built report found; keeping the published PDF.');
    process.exit(0);
  } catch {
    console.error('No report PDF found. Run ./scripts/build_report.ps1 first.');
    process.exit(1);
  }
}
await mkdir(path.dirname(target), { recursive: true });
await copyFile(source, target);
const { size } = await stat(target);
console.log(`Published ${path.relative(root, source)} (${Math.round(size / 1024)} KB) as public/downloads/food-choices-report.pdf`);
