const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const path = require('node:path');
const { mkdir } = require('node:fs/promises');

/* Browser checks for the eight-chapter narrative. Run the preview server
   first: npm run preview -- --port 4173, then
   npm run check:story -- http://127.0.0.1:4173 */
(async () => {
  const base = (process.argv[2] || 'http://127.0.0.1:4173').replace(/#.*$/, '');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const screenshots = path.resolve(__dirname, '../../.scratch/story-check');
    await mkdir(screenshots, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(`${base}/#story/opening`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.chapter-rail a').count(), 8, 'Eight chapters in the rail');
    assert((await page.locator('.rail-inner a[aria-current="step"]').innerText()).includes('Opening'), 'Rail marks the current chapter');
    assert((await page.locator('h1').first().innerText()).includes('Does paying more'), 'Opening headline');

    await page.getByRole('link', { name: '03 Method' }).click();
    await page.waitForTimeout(350);
    assert((await page.locator('h1').first().innerText()).includes('receipt'), 'Rail jumps to the method chapter');
    assert.equal(await page.evaluate(() => location.hash), '#story/method');

    await page.getByRole('link', { name: /Next.*Price and nutrition/ }).click();
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => location.hash), '#story/nutrition', 'Pager moves forward');

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => location.hash), '#story/environment', 'Keyboard moves between chapters');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => location.hash), '#story/nutrition', 'Keyboard moves back');

    await page.getByRole('link', { name: '06 Similar prices' }).click();
    await page.waitForTimeout(400);
    const readout = page.locator('.budget-readout');
    assert((await readout.innerText()).includes('146'), 'Joint view shows the chocolate sample');
    await page.getByRole('button', { name: 'Biscuits', exact: true }).click();
    await page.waitForTimeout(300);
    assert((await page.locator('.budget-control strong').innerText()).startsWith('€'), 'Budget ceiling follows the category');
    await page.locator('input[type="range"]').fill('0');
    await page.waitForTimeout(300);
    assert((await readout.innerText()).startsWith('1 /'), 'Minimum budget keeps the cheapest product');
    await page.locator('.joint-budget circle').first().click({ force: true });
    await page.waitForTimeout(250);
    assert.equal(await page.locator('.story-selected').count(), 1, 'Product detail opens from the plot');
    await page.locator('.story-selected button').click();
    await page.screenshot({ path: path.join(screenshots, 'joint.png'), fullPage: true });

    await page.getByRole('link', { name: '07 The answer' }).click();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.end-card').count(), 4, 'End card offers four routes');
    const href = await page.locator('.end-card[download]').getAttribute('href');
    assert(href && href.endsWith('.pdf'), 'Download link points at the report');
    const response = await page.request.get(new URL(href, page.url()).toString());
    assert.equal(response.status(), 200, 'Report PDF is published');
    assert.equal(response.headers()['content-type'], 'application/pdf');


    await page.getByRole('button', { name: '中文', exact: true }).click();
    await page.waitForTimeout(300);
    assert((await page.locator('h1').first().innerText()).includes('价格是一个很弱的标签'), 'Chinese copy renders');
    await page.screenshot({ path: path.join(screenshots, 'answer-zh.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('link', { name: '04 营养' }).click();
    await page.waitForTimeout(400);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow on mobile');
    await page.screenshot({ path: path.join(screenshots, 'nutrition-mobile.png'), fullPage: true });

    assert.deepEqual(errors, []);
    console.log('PASS: eight chapters, rail, pager, keyboard, budget interaction, product detail, PDF link, bilingual and mobile.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
