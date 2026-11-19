const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const path = require('node:path');
const { mkdir } = require('node:fs/promises');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  try {
    const screenshots = path.resolve(__dirname, '../../scratch/dashboard-review/screenshots');
    await mkdir(screenshots, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.argv[2] || 'http://127.0.0.1:5173/#dashboard');
    await page.getByRole('button', { name: '中文', exact: true }).click();
    await page.getByRole('tab', { name: '找商品', exact: true }).waitFor();

    assert.equal(await page.getByRole('tab').count(), 2);
    const category = page.locator('.dash-category-trigger');
    const rows = page.locator('.dash-simple-list li');
    const lower = page.getByRole('slider', { name: '最低单位价格', exact: true });
    const upper = page.getByRole('slider', { name: '最高单位价格', exact: true });
    const rangeCount = page.locator('.dash-range-count');
    const reference = '3111902100044';
    const candidate = '3111900360174';
    assert.equal(await lower.count(), 0);
    assert.equal(await rows.count(), 0);
    await category.click();
    await page.getByRole('group', { name: '食品大类' }).getByRole('button', { name: /早餐谷物/ }).click();
    assert.equal(await lower.count(), 0, 'A parent choice only reveals food types');
    assert.equal(await rows.count(), 0);
    await page.screenshot({ path: path.join(screenshots, 'cascader-zh.png'), animations: 'disabled' });
    await page.getByRole('group', { name: '食品细分类' }).getByRole('button', { name: /脆麦片/ }).click();
    assert.equal(await category.getAttribute('aria-expanded'), 'false');
    assert.match(await category.textContent(), /早餐谷物.*脆麦片/);
    assert((await rangeCount.textContent()).includes('35 / 35'));
    assert.equal(await rows.count(), 5);
    const layout = await page.evaluate(() => {
      const box = selector => document.querySelector(selector).getBoundingClientRect();
      return {
        categoryBottom: box('.dash-category-picker').bottom,
        priceTop: box('.dash-price-card').top,
        listRight: box('.dash-results').right,
        inspectorLeft: box('.dash-product-inspector').left,
        listTop: box('.dash-results').top,
        inspectorTop: box('.dash-product-inspector').top,
      };
    });
    assert(layout.categoryBottom <= layout.priceTop && layout.listRight <= layout.inspectorLeft &&
      layout.listTop === layout.inspectorTop, 'Wide layout puts selected product details to the right of the list');
    await page.screenshot({ path: path.join(screenshots, 'find-zh.png'), animations: 'disabled' });

    const fullLower = Number(await lower.inputValue());
    const fullUpper = Number(await upper.inputValue());
    const plotBounds = await page.locator('.dash-budget-chart').boundingBox();
    const sliderBounds = await lower.boundingBox();
    assert(plotBounds && sliderBounds);
    const handleY = sliderBounds.y + sliderBounds.height / 2;
    await page.mouse.move(plotBounds.x, handleY);
    await page.mouse.down();
    await page.mouse.move(plotBounds.x + plotBounds.width * .23, handleY, { steps: 8 });
    assert(Number(await lower.inputValue()) > fullLower, 'Left endpoint changes during the drag');
    assert(!(await rangeCount.textContent()).includes('35 / 35'), 'Count updates before releasing the handle');
    await page.mouse.up();
    assert.equal(Number(await upper.inputValue()), fullUpper);
    await page.mouse.move(plotBounds.x + plotBounds.width, handleY);
    await page.mouse.down();
    await page.mouse.move(plotBounds.x + plotBounds.width * .75, handleY, { steps: 8 });
    assert(Number(await upper.inputValue()) < fullUpper, 'Right endpoint changes independently');
    await page.mouse.up();
    await page.screenshot({ path: path.join(screenshots, 'range-zh.png'), animations: 'disabled' });
    await page.getByRole('button', { name: '重置价格', exact: true }).click();
    await lower.press('ArrowRight');
    assert(Number(await lower.inputValue()) > fullLower);
    await page.getByRole('button', { name: '重置价格', exact: true }).click();
    assert((await rangeCount.textContent()).includes('35 / 35'));

    await page.getByRole('button', { name: /展开全部 35 款商品/ }).click();
    assert.equal(await rows.count(), 35);
    await page.getByRole('button', { name: '收起至前 5 款', exact: true }).click();
    assert.equal(await rows.count(), 5);
    const filters = page.locator('button[aria-controls="dash-extra-filters"]');
    await filters.click();
    await page.getByLabel('报价依据', { exact: true }).selectOption('multiple');
    await page.getByLabel('商品排序').selectOption('offers');
    const listedOffers = await rows.locator('[data-offers]').evaluateAll(items => items.map(item => Number(item.dataset.offers)));
    assert(listedOffers.length && listedOffers.every((count, i) => count >= 2 && (!i || listedOffers[i - 1] >= count)));
    await filters.click();
    await page.getByRole('button', { name: '移除筛选 · 至少 2 条常规报价', exact: true }).click();
    await page.getByLabel('商品排序').selectOption('low');

    const search = page.getByRole('combobox', { name: '查找商品' });
    await search.fill('muesli');
    assert(await page.getByRole('listbox', { name: '商品建议' }).getByRole('option').count() > 1);
    await search.press('ArrowDown');
    assert(await search.getAttribute('aria-activedescendant'));
    await search.press('Escape');
    assert.equal(await search.getAttribute('aria-expanded'), 'false');
    await search.fill('Cereales muesli croustillant superfruits');
    assert.equal(await rows.count(), 1);
    await search.press('ArrowDown');
    await search.press('Enter');
    assert.equal(await search.getAttribute('aria-expanded'), 'false');

    const board = page.locator('.dash-comparison-board');
    const referenceBadge = board.locator('[data-reference]');
    const comparisonPlot = board.locator('[data-chart="relative-comparisons"]');
    const comparisonPoints = comparisonPlot.locator('[data-comparison]');
    const candidateInspector = board.locator('.dash-candidate');
    const selectedCandidate = candidateInspector.locator('[data-selected-comparison]');
    const inspector = page.locator('.dash-product-inspector');
    assert.equal(await inspector.getAttribute('data-selected-product'), reference);
    assert.equal(await search.inputValue(), 'Cereales muesli croustillant superfruits');
    assert.equal(await board.count(), 0, 'Find shows details without an inline comparison');
    await page.getByRole('tab', { name: '商品对比', exact: true }).click();
    assert.equal(await referenceBadge.count(), 0, 'Browsing a product does not select a comparison reference');
    await page.getByRole('tab', { name: '找商品', exact: true }).click();
    assert.equal(await inspector.getAttribute('data-selected-product'), reference);
    await inspector.getByRole('button', { name: '去对比这款商品', exact: true }).click();
    assert.equal(await referenceBadge.getAttribute('data-reference'), reference);
    assert.equal(await comparisonPoints.count(), 34, 'Every matching alternative appears in the comparison plot');
    assert((await board.getByRole('status').textContent()).includes('34 款商品可对比'));
    assert((await board.getByRole('status').textContent()).includes('11 款更便宜且两项等级不降'));
    assert.equal(await board.locator('[data-comparison="' + reference + '"]').count(), 0);

    const noDrop = board.getByRole('button', { name: /更便宜且等级不降/ });
    await noDrop.click();
    assert.equal(await comparisonPoints.count(), 11);
    assert.equal(await board.locator('[data-no-grade-drop="true"]').count(), 11);
    const chosen = comparisonPlot.locator('[data-comparison="' + candidate + '"]');
    assert.equal(await chosen.getAttribute('data-grade-band'), 'holds');
    assert(Number(await chosen.locator('circle').first().getAttribute('cx')) <
      Number(await comparisonPlot.locator('.dash-relative-zero').getAttribute('x1')));
    const pointBounds = await chosen.locator('circle').first().boundingBox();
    assert(pointBounds, 'The comparison point can be reached by the pointer');
    await page.mouse.move(pointBounds.x + pointBounds.width / 2, pointBounds.y + pointBounds.height / 2);
    await board.locator('.dash-tooltip').waitFor();
    await page.mouse.down();
    await page.mouse.up();
    assert.equal(await selectedCandidate.getAttribute('data-selected-comparison'), candidate);
    await chosen.press('ArrowRight');
    await page.keyboard.press('Enter');
    assert.notEqual(await selectedCandidate.getAttribute('data-selected-comparison'), candidate);
    await chosen.press('Enter');
    assert.equal(await selectedCandidate.getAttribute('data-selected-comparison'), candidate);
    await selectedCandidate.getByText('−4.25 €/kg', { exact: true }).waitFor();
    await selectedCandidate.getByText('−30.7%', { exact: true }).waitFor();
    await selectedCandidate.getByText('更好', { exact: true }).waitFor();
    const download = page.waitForEvent('download');
    await board.getByRole('button', { name: '导出对比结果' }).click();
    assert.equal((await download).suggestedFilename(), 'food-signal-reference-comparison.csv');
    await candidateInspector.getByRole('button', { name: '查看完整明细', exact: true }).click();
    const detail = page.locator('.dash-compare');
    assert.equal(await detail.locator('[data-detail-product]').first().getAttribute('data-detail-product'), reference);
    assert.equal(await detail.locator('[data-detail-product]').last().getAttribute('data-detail-product'), candidate);
    await detail.getByText('−4.25 €/kg (−30.7%)', { exact: true }).waitFor();
    await detail.getByText('A → A+ · 更好', { exact: true }).waitFor();
    assert(await detail.locator('[data-chart="quotes"] .dash-quote-point').count() >= 2);
    await detail.getByText('查看报价明细', { exact: true }).click();
    const quotes = page.waitForEvent('download');
    await detail.getByRole('button', { name: '导出报价明细', exact: true }).click();
    assert.equal((await quotes).suggestedFilename(), 'food-signal-quotes.csv');
    await detail.getByRole('button', { name: '返回对比结果', exact: true }).click();
    assert.equal(await noDrop.getAttribute('aria-pressed'), 'true');
    assert.equal(await selectedCandidate.getAttribute('data-selected-comparison'), candidate);
    const browse = candidateInspector.getByRole('button', { name: '下一款', exact: true });
    if (await browse.isEnabled()) await browse.click();
    else await candidateInspector.getByRole('button', { name: '上一款', exact: true }).click();
    assert.notEqual(await selectedCandidate.getAttribute('data-selected-comparison'), candidate);
    await board.getByRole('combobox', { name: '比较范围' }).selectOption('category');
    assert((await board.getByRole('status').textContent()).includes('149 款商品可对比'));
    await board.getByRole('combobox', { name: '比较范围' }).selectOption('type');
    await board.getByRole('button', { name: '全部 34', exact: true }).click();
    assert.equal(await comparisonPoints.count(), 34);
    assert.equal(await board.locator('[data-comparison="' + reference + '"]').count(), 0);

    await page.getByRole('tab', { name: '找商品', exact: true }).click();
    await page.getByRole('button', { name: '不高于中位价', exact: true }).click();
    assert.equal(await inspector.getAttribute('data-selected-product'), reference);
    await inspector.getByRole('button', { name: '去对比这款商品', exact: true }).click();
    const limitedTotal = (await board.getByRole('status').textContent()).match(/[0-9]+/)[0];
    assert(Number(limitedTotal) < 34);
    await board.getByRole('checkbox', { name: /沿用价格区间/ }).uncheck();
    assert((await board.getByRole('status').textContent()).includes('34 款商品可对比'));
    await board.getByRole('combobox', { name: '参照商品' }).selectOption(candidate);
    assert.equal(await referenceBadge.getAttribute('data-reference'), candidate);

    await page.getByRole('tab', { name: '找商品', exact: true }).click();
    await category.click();
    const categoryPopup = page.locator('.dash-cascader');
    await categoryPopup.getByRole('group', { name: '食品大类' }).getByRole('button', { name: /果汁/ }).click();
    await categoryPopup.getByRole('button', { name: /全部细分类/ }).click();
    assert((await rangeCount.textContent()).includes('150 / 150'));
    assert((await lower.getAttribute('aria-valuetext')).endsWith('/L'));
    assert.equal(await referenceBadge.count(), 0);
    await rows.first().getByRole('button').click();
    assert(await inspector.getAttribute('data-selected-product'), 'Clicking a list row opens product details');
    assert.equal(await board.count(), 0);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });

    await page.getByRole('link', { name: 'EDA', exact: true }).click();
    await page.getByRole('heading', { name: 'EDA', exact: true }).waitFor();
    assert.equal(new URL(page.url()).hash, '#eda');
    assert.equal(await page.getByRole('link', { name: 'EDA', exact: true }).getAttribute('aria-current'), 'page');
    const directions = ['coverage', 'nutrition', 'environment', 'joint', 'sensitivity', 'years'];
    assert.deepEqual(await page.getByRole('tab').evaluateAll(tabs => tabs.map(tab => tab.id)), directions.map(direction => 'research-tab-' + direction));
    assert.equal(await page.locator('#research-tab-coverage').getAttribute('aria-selected'), 'true');
    await page.getByRole('button', { name: '中文', exact: true }).click();
    await page.getByLabel('研究类别').selectOption('fruit_juices');
    assert.equal(await page.locator('.coverage-heatmap tbody tr').count(), 1);
    await page.locator('.coverage-heatmap tbody button').nth(1).click();
    assert.equal(await page.locator('.research-product-table tbody tr').count(), 5);
    const coverageDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出 数据覆盖 CSV', exact: true }).click();
    assert.equal((await coverageDownload).suggestedFilename(), 'coverage.csv');
    for (const [direction, content] of [
      ['nutrition', '营养指标相关'], ['environment', '环境等级与价格'], ['joint', '营养 × 环境'],
      ['sensitivity', '价格口径敏感性'], ['years', '配对价格记录'],
    ]) {
      await page.locator('#research-tab-' + direction).click();
      await page.getByText(content, { exact: true }).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), direction + ' fits on mobile');
    }
    await page.locator('#research-tab-joint').click();
    await page.locator('.joint-heatmap button').first().click();
    assert(await page.locator('.research-product-table tbody tr').count() > 0);
    await page.locator('#research-tab-sensitivity').click();
    await page.getByLabel('敏感性指标').selectOption('environment_score');
    assert.equal(await page.locator('.sensitivity-svg').count(), 1);
    await page.locator('#research-tab-years').click();
    await page.getByLabel('搜索配对商品').fill('zzzz no match');
    await page.getByText('没有匹配的配对商品。', { exact: true }).waitFor();
    await page.getByText('指标与方法', { exact: true }).click();
    const sourceDownload = page.waitForEvent('download');
    await page.getByRole('link', { name: 'R/10_eda.R' }).click();
    assert.equal((await sourceDownload).suggestedFilename(), '10_eda.R');
    await page.locator('#research-tab-coverage').click();
    await page.getByLabel('研究类别').selectOption('all');
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(screenshots, 'eda-zh.png') });
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.reload();
    await page.getByRole('heading', { name: 'EDA', exact: true }).waitFor();
    await page.getByRole('tab', { name: /Data & prices/ }).focus();
    await page.keyboard.press('End');
    assert.equal(await page.locator('#research-tab-years').getAttribute('aria-selected'), 'true');
    await page.getByRole('link', { name: 'The study', exact: true }).click();
    assert.equal(await page.locator('.research-step-list li').count(), 6);
    await page.getByRole('link', { name: 'Sources', exact: true }).first().click();
    assert.equal(await page.locator('.resource-list > a').count(), 2);
    assert.deepEqual(errors, []);
    console.log('PASS: left list and right details, browsing/compare separation, reference handoff and comparison.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
