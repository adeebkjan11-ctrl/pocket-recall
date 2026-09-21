// Optional end-to-end evidence capture. Requires Playwright and a Chromium browser.
// Every displayed card comes from the live local QVAC endpoint; no fixtures or mocks.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const docs = join(root, 'docs');
const base = 'http://127.0.0.1:8787';
const server = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start:python'], {
  cwd: root, env: {...process.env, PORT: '8787'},
  detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe']
});
let logs = '', browser;
server.stdout.on('data', data => {logs += data;});
server.stderr.on('data', data => {logs += data;});
try {
  let listening = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(logs);
    if (logs.includes(`Pocket Recall: ${base}`)) {
      try {listening = (await fetch(base + '/api/status')).ok;} catch {}
    }
    if (listening) break;
    await delay(100);
  }
  assert(listening, 'Local server did not start');
  browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? {
    executablePath: process.env.CHROMIUM_EXECUTABLE
  } : {});
  const page = await browser.newPage({viewport: {width: 1440, height: 1120}, deviceScaleFactor: 1});
  const pageErrors = [], requests = new Set();
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => requests.add(request.url()));
  await page.goto(base);
  await page.getByRole('button', {name: 'Try sample', exact: true}).click();
  const sourceNotes = await page.getByLabel('What are you learning today?').inputValue();
  const preparation = page.waitForResponse(response => response.url() === base + '/api/prepare', {timeout: 180000});
  await page.getByRole('button', {name: 'Download & prepare model'}).click();
  assert.equal((await preparation).status(), 200);
  await page.getByText('Ready locally', {exact: true}).waitFor();
  const completion = page.waitForResponse(response => response.url() === base + '/api/generate', {timeout: 180000});
  await page.getByRole('button', {name: 'Make my study cards'}).click();
  const response = await completion;
  const generated = await response.json();
  assert.equal(response.status(), 200, JSON.stringify(generated));
  await page.locator('#results').waitFor({state: 'visible'});
  assert.equal(await page.locator('.card').count(), 3);
  assert.deepEqual(await page.locator('.card h3').allTextContents(), generated.cards.map(card => card.question));
  assert.deepEqual(await page.locator('.card details p').allTextContents(), generated.cards.map(card => card.answer));
  await page.locator('.card').nth(0).getByText('Reveal answer', {exact: true}).click();
  await page.locator('.card').nth(0).getByRole('button', {name: 'Got it'}).click();
  await page.locator('.card').nth(1).getByText('Reveal answer', {exact: true}).click();
  await page.locator('.card').nth(1).getByRole('button', {name: 'Practice again', exact: true}).click();
  assert.equal(await page.locator('#review-summary').innerText(), '1 remembered · 1 to practice · 1 to review');
  await page.locator('.card').nth(1).getByText('Reveal answer', {exact: true}).click();
  await mkdir(docs, {recursive: true});
  const downloadReady = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Export'}).click();
  const download = await downloadReady;
  const exportPath = join(docs, 'pocket-recall-cards.md');
  await download.saveAs(exportPath);
  const exported = await readFile(exportPath, 'utf8');
  for (const card of generated.cards) assert(exported.includes(card.question) && exported.includes(card.answer));
  assert(exported.includes('Review: known') && exported.includes('Review: again'));
  await page.screenshot({path: join(docs, 'pocket-recall-screenshot.png'), fullPage: true});
  await page.setViewportSize({width: 390, height: 844});
  const mobile = await page.evaluate(() => ({width: innerWidth, contentWidth: document.documentElement.scrollWidth}));
  assert(mobile.contentWidth <= mobile.width, 'Mobile layout overflows horizontally');
  assert.deepEqual(pageErrors, []);
  assert([...requests].every(url => url.startsWith(base + '/')), 'Frontend made a non-local request');
  const receipt = {test: 'REAL_QVAC_BROWSER_GENERATION', capturedAt: new Date().toISOString(),
    command: 'npm run start:python', sourceNotes, status: response.status(), ...generated,
    browser: await browser.version(), viewport: {width: 1440, height: 1120},
    screenshot: 'pocket-recall-screenshot.png', review: '1 remembered · 1 to practice · 1 to review',
    exportVerified: true, mobileLayout: mobile, pageErrors, browserRequests: [...requests]};
  await writeFile(join(docs, 'browser-verification.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    if (process.platform === 'win32') server.kill('SIGTERM');
    else process.kill(-server.pid, 'SIGTERM');
  }
}
