/* QA of the redesigned site: serves the repository root, takes desktop and mobile
   screenshots into _source/preview/ and writes a report with console errors,
   failed requests and horizontal-overflow checks.                            */
const fs = require('fs');
const path = require('path');
const http = require('http');
const sharp = require('sharp');
const { chromium } = require('playwright');

const REPO = path.resolve(__dirname, '..', '..');
const OUT = path.join(REPO, '_source', 'preview');
fs.mkdirSync(OUT, { recursive: true });

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(REPO, p);
  if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(8080, r));
  const browser = await chromium.launch();
  const report = { pages: {} };
  const targets = [
    { name: 'desktop', url: 'http://localhost:8080/index.html', viewport: { width: 1440, height: 900 } },
    { name: 'mobile', url: 'http://localhost:8080/index.html', viewport: { width: 390, height: 844 }, mobile: true },
    { name: 'legal-desktop', url: 'http://localhost:8080/politique-de-confidentialite.html', viewport: { width: 1440, height: 900 } }
  ];
  for (const t of targets) {
    const ctx = await browser.newContext({ viewport: t.viewport, deviceScaleFactor: t.mobile ? 2 : 1, isMobile: !!t.mobile, hasTouch: !!t.mobile });
    const page = await ctx.newPage();
    const errors = [], failed = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith('http://localhost')) failed.push(r.status() + ' ' + r.url()); });
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1200);
    await sharp(await page.screenshot()).jpeg({ quality: 80 }).toFile(path.join(OUT, `${t.name}-fold.jpg`));
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += Math.round(t.viewport.height * 0.6)) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(160); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    const broken = await page.evaluate(() => Array.from(document.images).filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
    await sharp(await page.screenshot({ fullPage: true })).resize({ width: t.mobile ? 500 : 1200 }).jpeg({ quality: 72 }).toFile(path.join(OUT, `${t.name}-full.jpg`));
    report.pages[t.name] = { height: h, overflow: overflow.scrollWidth > overflow.clientWidth ? overflow : null, consoleErrors: errors, failedRequests: failed, brokenImages: broken };
    await ctx.close();
  }
  await browser.close();
  server.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
