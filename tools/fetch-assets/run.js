/* Fetch the original Wix site (carrosseriecornaux.ch): pages, media, reference
   screenshots and contact sheets into _source/, and build the optimized images the
   redesigned site expects in assets/img/.                                        */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { chromium } = require('playwright');

const BASE = 'https://www.carrosseriecornaux.ch/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const REPO = path.resolve(__dirname, '..', '..');
const ROOT = path.join(REPO, '_source');
const IMG = path.join(REPO, 'assets', 'img');
for (const d of ['pages', 'media', 'shots', 'sheets', 'preview']) fs.mkdirSync(path.join(ROOT, d), { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

/* Which original media (Wix id) becomes which site asset. */
const SELECTION = [
  // brand
  { id: 'b4bd25_aac0bc7390834572a18851f6098eceda', out: 'logo.png', kind: 'brand' },
  // hero + about
  { id: 'b4bd25_ace6627d58eb439c88008c038059fbd7', out: 'hero.webp', width: 2000, quality: 78 },
  { id: '78f6e2_079a23fab72e4def974aa5ebd5fb9dc6', out: 'batiment.webp', width: 1600 },
  { id: '78f6e2_e08191fd7f934cc6b014369d705398e4', out: 'atelier.webp', width: 1400 },
  { id: '78f6e2_991f1057d9184c588d0feab915c88cfd', out: 'batiment-cote.webp', width: 1400 },
  // service cards
  { id: '78f6e2_cb14a6abb694498fad563b97fe6f53f1', out: 'tolerie.webp', width: 1400 },
  { id: '78f6e2_53be8aff0d6243f684bb90088e295443', out: 'peinture.webp', width: 1400 },
  { id: 'b4bd25_08c4f3f70acd4bccba0a8b5cf36ae466', out: 'pare-brise.webp', width: 1400 },
  // service details (sticky section)
  { id: 'b4bd25_c3d3fbbc53834858b247fee5184786b0', out: 'tolerie-detail.webp', width: 1600 },
  { id: 'b4bd25_b0689977cb554eb5bdc72e98e6ad73f6', out: 'peinture-detail.webp', width: 1600 },
  { id: 'b4bd25_0e92a284af9143e3903a24bbdb4a8735', out: 'pare-brise-detail.webp', width: 1600 },
  // extra photos kept for later use
  { id: '78f6e2_c132a18f841549ac84a39d5da4cc0009', out: 'tolerie-atelier.webp', width: 1400 },
  { id: '78f6e2_0adc1498672f4589856676fe20f6743f', out: 'tolerie-site.webp', width: 1400 },
  { id: '78f6e2_5f97f58e101e471da908a60e7c76308c', out: 'peinture-11.webp', width: 1400 },
  { id: '78f6e2_388bcc3f860046c0944e4e94de5feded', out: 'peinture-12.webp', width: 1400 },
  { id: '78f6e2_b1cbc659d96b4e5ea55a878f389d392d', out: 'peinture-cabine.webp', width: 1400 },
  { id: 'b4bd25_a7e04fd947414ea4a86761d0bcf61534', out: 'img-06.webp', width: 1400 },
  { id: 'b4bd25_298c0b1e52c3432d8c56309d894ee294', out: 'img-14.webp', width: 1400 },
  { id: 'b4bd25_dfedeb99011b41e8a02fd365ca3c74cf', out: 'img-10.webp', width: 1400 },
  // gallery (home order first, then the réalisations page)
  { id: 'b4bd25_586c054664cb4136962042bb69d788a9', out: 'realisation-01.webp', width: 1200 },
  { id: 'b4bd25_870faf79b4a84ec3868440fdb1790bf4', out: 'realisation-02.webp', width: 1200 },
  { id: 'b4bd25_0129e059d44d43ca8e80224097142489', out: 'realisation-03.webp', width: 1200 },
  { id: 'b4bd25_6e0ebbfdb487413696085a682887a7e1', out: 'realisation-04.webp', width: 1200 },
  { id: 'b4bd25_06b95df321804577801bae450bae9d83', out: 'realisation-05.webp', width: 1200 },
  { id: 'b4bd25_9591be075a874cfcab91106c6d88f279', out: 'realisation-06.webp', width: 1200 },
  { id: 'b4bd25_68f437d67e434a899838ef6c240850d9', out: 'realisation-07.webp', width: 1200 },
  { id: 'b4bd25_3f607b411f6042aeaca4cc31c1d9a8fd', out: 'realisation-08.webp', width: 1200 },
  { id: 'b4bd25_17c6142dcf15422bb8b0b0e5d80a7d57', out: 'realisation-09.webp', width: 1200 },
  { id: 'b4bd25_f275abe369124b67b9121a2fa30fcd51', out: 'realisation-10.webp', width: 1200 },
  { id: 'b4bd25_ffd3c9a34b834488af200db61866b31a', out: 'realisation-11.webp', width: 1200 },
  { id: 'b4bd25_e596271985bb4b969ae21497c01cbced', out: 'realisation-12.webp', width: 1200 },
  { id: 'b4bd25_e9b4725d23584936ae2ec57dd5ef8340', out: 'realisation-13.webp', width: 1200 },
  { id: 'b4bd25_11172d39404f493faee9f41a0290ce97', out: 'realisation-14.webp', width: 1200 },
  { id: 'b4bd25_6b9d0391b6364bc8a7a95f8ec6d9d9b4', out: 'realisation-15.webp', width: 1200 },
  { id: '78f6e2_95f12b8470c1448aa5409857353fd324', out: 'realisation-16.webp', width: 1200 },
  { id: '78f6e2_56053f7a17594b38bb72b77a33fd0a92', out: 'realisation-17.webp', width: 1200 },
  { id: '78f6e2_ac7570102b464727a2b10c5d8f47a532', out: 'realisation-18.webp', width: 1200 },
  // partner logos
  { id: 'b4bd25_7b910b4fd4f24c589c45cb760407738a', out: 'logo-axa.png', kind: 'logo' },
  { id: 'b4bd25_702be1808f0c4d94bcf4438f227754d6', out: 'logo-vaudoise.png', kind: 'logo' },
  { id: 'b4bd25_1b828c1972be4d2ea9068abb227ee992', out: 'logo-generali.png', kind: 'logo' },
  { id: 'b4bd25_273c1ee3327e443f9e68c860709fb86e', out: 'logo-allianz.png', kind: 'logo' },
  { id: 'b4bd25_8ce7eaef62ea4f52bf10272c454658c2', out: 'logo-mobiliere.png', kind: 'logo' },
  { id: 'b4bd25_ca140090bd57445faee0a95132d285e1', out: 'logo-helvetia.png', kind: 'logo' },
  { id: 'b4bd25_fe1e35399ce249bca1c52c9b743f6dca', out: 'logo-baloise.png', kind: 'logo' },
  { id: 'b4bd25_782e4d71c41143c2a0d9041678448c68', out: 'logo-smile.png', kind: 'logo' },
  { id: 'b4bd25_7bd0096059d743dd933f65db12ea1941', out: 'logo-standox.png', kind: 'logo' },
  { id: 'b4bd25_d925255215634f96a85fee7ecc07255a', out: 'logo-andre-koch.png', kind: 'logo' },
  { id: 'b4bd25_34642d93f0434247923fe508c61d4ba4', out: 'logo-clearcarrep.png', kind: 'logo' },
  { id: 'b4bd25_13273d0155a344e5a1f065d3906ff177', out: 'logo-repanet.png', kind: 'logo' },
  { id: 'b4bd25_1be8c129c68d48d380032d5b7f8636ad', out: 'logo-upsa-agvs.png', kind: 'logo' },
  { id: 'b4bd25_8fdf14fcc9f4408c8fe17fb0971049a6', out: 'logo-carrosserie-relais.png', kind: 'logo' },
  // process icons (the site's own icons)
  { id: 'b4bd25_28061413dbdc43ad81d39e7360c35276', out: 'icon-devis.png', kind: 'icon' },
  { id: 'b4bd25_f1e5d07824954d0581fc7ca64dfe8812', out: 'icon-carrosserie.png', kind: 'icon' },
  { id: 'b4bd25_7d68bf668455478ba385ea7de6c1ac5d', out: 'icon-offre.png', kind: 'icon' },
  { id: 'b4bd25_c52739760e704844865464ac3eedbeff', out: 'icon-vehicule.png', kind: 'icon' },
  { id: 'b4bd25_5e561b023c324f0cba298a0cf772c64f', out: 'icon-entretien.png', kind: 'icon' },
  { id: 'b4bd25_61605feb75254018ba531ef0be50d38c', out: 'icon-experiences.png', kind: 'icon' },
  { id: 'b4bd25_df97eec9c9d744c286783a0fc30558cb', out: 'icon-pneus.png', kind: 'icon' }
];

async function get(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r;
}

(async () => {
  /* 1. Pages ------------------------------------------------------------- */
  const home = await (await get(BASE)).text();
  fs.writeFileSync(path.join(ROOT, 'pages', 'index.html'), home);
  const links = [...new Set([...home.matchAll(/href="(https:\/\/www\.carrosseriecornaux\.ch\/[^"#?]*)"/g)].map(m => m[1]))];
  const htmls = { 'index.html': home };
  for (const u of links) {
    const name = u.replace(BASE, '').replace(/\/$/, '').replace(/\//g, '_');
    if (!name) continue;
    try {
      const h = await (await get(u)).text();
      fs.writeFileSync(path.join(ROOT, 'pages', name + '.html'), h);
      htmls[name + '.html'] = h;
    } catch (e) { console.log('page fail', u, e.message); }
  }

  /* Social links, if the Wix site exposes them */
  const social = {};
  for (const h of Object.values(htmls)) {
    const ig = h.match(/href="(https?:\/\/(?:www\.)?instagram\.com\/[^"]+)"/);
    const li = h.match(/href="(https?:\/\/(?:[a-z]{2}\.)?linkedin\.com\/[^"]+)"/);
    if (ig && !social.instagram) social.instagram = ig[1];
    if (li && !social.linkedin) social.linkedin = li[1];
  }
  fs.mkdirSync(path.join(REPO, 'assets', 'js'), { recursive: true });
  fs.writeFileSync(path.join(REPO, 'assets', 'js', 'social.json'), JSON.stringify(social, null, 2));
  console.log('social', social);

  /* 2. Media ------------------------------------------------------------- */
  const media = new Set();
  for (const h of Object.values(htmls)) {
    for (const m of h.matchAll(/https:\/\/static\.wixstatic\.com\/media\/[A-Za-z0-9_%~.-]+/g)) media.add(m[0].replace(/%7E/g, '~'));
  }
  const list = [...media].sort();
  fs.writeFileSync(path.join(ROOT, 'media_urls.txt'), list.join('\n'));
  for (const u of list) {
    const f = path.join(ROOT, 'media', path.basename(u));
    if (fs.existsSync(f)) continue;
    try { fs.writeFileSync(f, Buffer.from(await (await get(u)).arrayBuffer())); } catch (e) { console.log('media fail', u, e.message); }
  }
  const mediaFiles = fs.readdirSync(path.join(ROOT, 'media')).sort();
  const findMedia = id => mediaFiles.find(f => f.startsWith(id));

  /* 3. Site assets --------------------------------------------------------- */
  for (const sel of SELECTION) {
    const f = findMedia(sel.id);
    if (!f) { console.log('MISSING media for', sel.out, sel.id); continue; }
    const src = path.join(ROOT, 'media', f);
    const out = path.join(IMG, sel.out);
    try {
      if (sel.kind === 'brand') {
        const meta = await sharp(src).metadata();
        await sharp(src).resize({ width: Math.min(meta.width, 900), withoutEnlargement: true }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(out);
        await sharp(src).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(IMG, 'favicon.png'));
      } else if (sel.kind === 'logo') {
        await sharp(src).resize({ width: 480, height: 240, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(out);
      } else if (sel.kind === 'icon') {
        await sharp(src).resize({ width: 144, height: 144, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(out);
      } else {
        await sharp(src).rotate().resize({ width: sel.width || 1400, withoutEnlargement: true }).webp({ quality: sel.quality || 76, effort: 5 }).toFile(out);
      }
      console.log('asset', sel.out, fs.statSync(out).size);
    } catch (e) { console.log('asset fail', sel.out, e.message); }
  }

  /* 4. Contact sheets + legend (reference material) ------------------------ */
  const legend = []; const thumbs = [];
  for (const f of mediaFiles) {
    try {
      const meta = await sharp(path.join(ROOT, 'media', f)).metadata();
      legend.push({ i: legend.length + 1, file: f, w: meta.width, h: meta.height, format: meta.format, bytes: fs.statSync(path.join(ROOT, 'media', f)).size, usedAs: (SELECTION.find(s => f.startsWith(s.id)) || {}).out || null });
      thumbs.push(await sharp(path.join(ROOT, 'media', f)).rotate().resize(300, 200, { fit: 'cover' }).jpeg({ quality: 60 }).toBuffer());
    } catch (e) { console.log('thumb fail', f, e.message); }
  }
  fs.writeFileSync(path.join(ROOT, 'legend.json'), JSON.stringify(legend, null, 1));
  const cols = 5, per = 30; let sheet = 0;
  for (let s = 0; s < thumbs.length; s += per) {
    const batch = thumbs.slice(s, s + per); const comps = [];
    batch.forEach((b, k) => {
      const x = (k % cols) * 310, y = Math.floor(k / cols) * 230;
      comps.push({ input: b, left: x + 5, top: y + 5 });
      const svg = Buffer.from(`<svg width="60" height="26"><rect width="60" height="26" fill="#000" fill-opacity="0.7"/><text x="30" y="19" font-size="18" font-family="sans-serif" fill="#fff" text-anchor="middle">${s + k + 1}</text></svg>`);
      comps.push({ input: svg, left: x + 5, top: y + 5 });
    });
    sheet++;
    await sharp({ create: { width: cols * 310 + 5, height: Math.ceil(batch.length / cols) * 230 + 5, channels: 3, background: '#ffffff' } }).composite(comps).jpeg({ quality: 72 }).toFile(path.join(ROOT, 'sheets', `sheet${sheet}.jpg`));
  }

  /* 5. Screenshots of the current site ------------------------------------ */
  const browser = await chromium.launch();
  const pages = { home: '', apropos: 'a-propos', services: 'services', tolerie: 'services/tolerie', peinture: 'services/peinture', parebrise: 'services/pare-brise-et-autres-prestations', realisations: 'realisations', contact: 'contact' };
  for (const [name, p] of Object.entries(pages)) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA, locale: 'fr-CH' });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + p, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(4000);
      const h = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(250); }
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1500);
      await sharp(await page.screenshot({ fullPage: false })).resize({ width: 1200 }).jpeg({ quality: 74 }).toFile(path.join(ROOT, 'shots', name + '_fold.jpg'));
      await sharp(await page.screenshot({ fullPage: true })).resize({ width: 1100 }).jpeg({ quality: 70 }).toFile(path.join(ROOT, 'shots', name + '_full.jpg'));
      console.log('shot ok', name, h);
    } catch (e) { console.log('shot fail', name, e.message); }
    await ctx.close();
  }
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(4000);
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 400) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(200); }
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1000);
    await sharp(await page.screenshot({ fullPage: true })).resize({ width: 500 }).jpeg({ quality: 70 }).toFile(path.join(ROOT, 'shots', 'home_mobile_full.jpg'));
    await ctx.close();
  } catch (e) { console.log('mobile fail', e.message); }
  await browser.close();

  /* Originals are not committed (20+ MB); the optimized copies live in assets/img. */
  fs.rmSync(path.join(ROOT, 'media'), { recursive: true, force: true });
  console.log('done:', legend.length, 'originals,', fs.readdirSync(IMG).length, 'site assets');
})().catch(e => { console.error(e); process.exit(1); });
