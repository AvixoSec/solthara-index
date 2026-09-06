import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, sep, extname } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve('.'), data = JSON.parse(await readFile('all-configs.json', 'utf8'));
const models = Array.isArray(data.models) ? data.models : Object.values(data.models);
const results = [], errors = [];
await mkdir('audit/screenshots', { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream'); res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const record = (name, extra = {}) => results.push({ name, status: 'passed', ...extra });
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, reducedMotion: 'reduce' });
  await context.route('**/*', (route) => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message)); page.setDefaultTimeout(15000);
  const countIs = (n) => page.waitForFunction(({ n, total }) => document.querySelector('.result-count')?.textContent.replace(/\s/g, '') === `${n}/${total}`, { n, total: models.length });
  const nav = (name) => page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name, exact: true }).click();
  await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' }); await countIs(models.length);
  record('Complete dataset loads', { models: models.length });
  await page.screenshot({ path: 'audit/screenshots/registry-1440.png', fullPage: true });
  const search = page.getByRole('searchbox');
  await search.fill('no-such-model-audit-regression'); await countIs(0);
  await page.getByRole('button', { name: 'Reset all filters', exact: true }).click(); await countIs(models.length);
  record('Empty results and reset');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  for (const [label, value, field] of [['Attention bias', 'with bias', 'attention_bias_display'], ['Weight tying', 'tied', 'tie_display']]) {
    await page.getByLabel(label).selectOption(value);
    await countIs(models.filter((m) => m.math_tricks?.[field] === value).length);
    await page.getByLabel(label).selectOption('all');
  }
  record('Bias and tying filters');
  await page.getByRole('button', { name: 'Next results page', exact: true }).click();
  assert.match(await page.locator('.page-controls').innerText(), /9[–-]16/);
  await page.getByRole('button', { name: 'Previous results page', exact: true }).click(); record('Pagination');
  await page.getByLabel('Sort models').selectOption('oldest');
  assert.equal(await page.locator('.model-name').first().innerText(), [...models].filter((m) => m.release_date).sort((a, b) => a.release_date.localeCompare(b.release_date))[0].model_name); record('Date sort');
  let renderedTabs = 0;
  for (const model of models) {
    await search.fill(model.model_id); await page.getByRole('button', { name: model.model_name, exact: true }).first().click();
    const dialog = page.locator('dialog.dossier[open]'); await dialog.waitFor();
    const tabs = dialog.getByRole('tab'); assert.equal(await tabs.count(), 8);
    for (let i = 0; i < 8; i++) {
      const tab = tabs.nth(i), id = await tab.getAttribute('id'); await tab.click();
      await page.waitForFunction((id) => document.getElementById(id)?.getAttribute('aria-selected') === 'true', id);
      assert.ok((await dialog.getByRole('tabpanel').innerText()).trim()); renderedTabs++;
    }
    if (model.model_id === 'gpt-2-xl-1-5b') {
      await dialog.getByRole('tab', { name: 'Math & config', exact: true }).click();
      const text = await dialog.getByRole('tabpanel').innerText(); assert.match(text, /LayerNorm/); assert.match(text, /Learned absolute/);
      await page.screenshot({ path: 'audit/screenshots/gpt2-1440.png', fullPage: true });
      const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Record JSON', exact: true }).click()]);
      assert.deepEqual(JSON.parse(await readFile(await download.path(), 'utf8')), model); record('Complete corrected record export');
      await tabs.first().click(); await tabs.first().focus(); await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.getElementById('tab-architecture')?.getAttribute('aria-selected') === 'true'); record('Keyboard tab navigation');
    }
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
  }
  record('Every real dossier and tab', { dossiers: models.length, tabs: renderedTabs });
  await search.fill(''); await countIs(models.length);
  const boxes = page.getByRole('checkbox');
  await boxes.nth(0).check(); await boxes.nth(1).check(); await boxes.nth(2).check(); await boxes.nth(3).click();
  assert.equal(await page.locator('input[type=checkbox]:checked').count(), 3);
  await page.getByRole('button', { name: 'Compare', exact: true }).click(); await page.locator('dialog.comparison[open]').waitFor();
  assert.equal(await page.locator('dialog.comparison thead th').count(), 4);
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Clear', exact: true }).click(); record('Comparison and selection limit');
  await page.getByRole('button', { name: 'Gallery view', exact: true }).click(); await page.locator('.gallery-card').first().waitFor(); record('Gallery with external requests blocked');
  await nav('Architecture matrix'); await search.fill('gpt-2-xl-1-5b'); assert.match(await page.locator('.matrix-table tbody').innerText(), /LayerNorm/);
  await nav('Release timeline'); assert.equal(await page.locator('.milestone').count(), data.milestones.length);
  const mixtral = page.locator('.milestone').filter({ has: page.getByRole('heading', { name: 'Mixtral 8x22B', exact: true }) });
  assert.equal(await mixtral.locator('time').getAttribute('datetime'), '2024-04-17'); record('Corrected matrix and timeline');
  await nav('Theory library');
  const categories = page.getByRole('group', { name: 'Theory category' }).getByRole('button');
  const theoryKeys = Object.keys(data.theory).filter((k) => Array.isArray(data.theory[k]));
  assert.equal(await categories.count(), theoryKeys.length);
  for (let i = 0; i < theoryKeys.length; i++) { await categories.nth(i).click(); await page.waitForFunction((n) => document.querySelectorAll('.theory-card').length === n, data.theory[theoryKeys[i]].length); }
  record('All theory categories');
  await nav('About & sources');
  const [full] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Full dataset JSON', exact: true }).click()]);
  assert.deepEqual(JSON.parse(await readFile(await full.path(), 'utf8')), data); record('Complete dataset export');
  await page.goto(origin + '/index.html', { waitUntil: 'domcontentloaded' }); await page.setViewportSize({ width: 390, height: 844 }); await countIs(models.length);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert.ok(overflow <= 2, `Mobile overflow: ${overflow}`);
  await page.getByRole('button', { name: 'Toggle navigation', exact: true }).click(); await nav('Release timeline');
  await page.screenshot({ path: 'audit/screenshots/mobile-390.png', fullPage: true }); record('Mobile layout and navigation', { width: 390, overflow });
  await page.goto(origin + '/Solthara-VECTOR-v2.html', { waitUntil: 'domcontentloaded' }); await countIs(models.length);
  assert.equal(await page.locator('script[src]').count(), 0); record('Actual standalone page');
  assert.deepEqual(errors, []); record('No uncaught browser errors');
} catch (error) {
  results.push({ name: 'Browser suite', status: 'failed', error: error.stack }); process.exitCode = 1; console.error(error.stack);
  const failedPage = browser?.contexts()[0]?.pages()[0];
  if (failedPage) await failedPage.screenshot({ path: 'audit/screenshots/failure.png', fullPage: true }).catch(() => {});
}
finally {
  await writeFile('audit/browser-results.json', JSON.stringify({ status: process.exitCode ? 'failed' : 'passed', dataset: 'actual_repository', models: models.length, milestones: data.milestones.length, browser: browser ? await browser.version() : null, external_network: 'blocked', results, page_errors: errors, note: 'Automated functional coverage, not scientific or manual visual certification.' }, null, 2) + '\n');
  if (browser) await browser.close(); await new Promise((done) => server.close(done));
}
console.log(JSON.stringify({ checks: results.length, passed: results.filter((r) => r.status === 'passed').length }));
