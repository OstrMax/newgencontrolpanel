/* Build separated, self-contained HTML files for Figma upload (html.to.design).
 *
 * One file per page + per dialog/state, in BOTH light and dark themes.
 *
 * Figma-safety work done here (this is the important part):
 *   1. Donut/ring charts are drawn in the app as <circle> with stroke-dasharray
 *      arcs. Figma cannot interpret dashed-arc segments and flattens them into a
 *      full ring. We re-draw every segment as a real filled <path> wedge
 *      (annulus sector with round end caps) so it imports as clean vector.
 *   2. Every var(--token) / currentColor inside SVG presentation attributes is
 *      resolved to a literal hex/rgb for the active theme. Figma does not
 *      evaluate CSS custom properties, so unresolved vars import as black.
 *   3. The -90deg rotate on the donut <svg> is baked into the path geometry and
 *      removed, because wrapper transforms are frequently dropped on import.
 *   4. url(#pgrad) gradient stops are resolved to literal colors too.
 *
 * Nothing is submitted or mutated server-side; this only reads the rendered DOM.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'figma-pages');
const URL = 'http://localhost:5510/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* ---------- screen catalogue ---------- */
const PAGES = [
  { key: 'home',      slug: '01-dashboard',         title: 'Dashboard' },
  { key: 'billing',   slug: '02-billing',           title: 'Billing' },
  { key: 'company',   slug: '03-company-profile',   title: 'Company Profile' },
  { key: 'inventory', slug: '04-inventory-usage',   title: 'Inventory & Usage' },
  { key: 'users',     slug: '05-users',             title: 'Users' },
  { key: 'security',  slug: '06-security',          title: 'Security' },
  { key: 'prodapps',  slug: '07-productivity-apps', title: 'Productivity Apps' },
  { key: 'chat',      slug: '08-chat',              title: 'Sangoma UC — Chat' },
  { key: 'sms',       slug: '09-sms',               title: 'Sangoma UC — SMS' },
  { key: 'video',     slug: '10-video',             title: 'Sangoma UC — Video' },
  { key: 'voice',     slug: '11-voice',             title: 'Sangoma UC — Voice' },
  { key: 'cpaas',     slug: '12-cpaas',             title: 'CPaaS' },
  { key: 'reports',   slug: '13-analytics',         title: 'Analytics' },
];

/* states are rendered on top of a base page, after a trigger runs in-page */
const STATES = [
  { key: 'billing', slug: '14-invoice-drawer',   title: 'Invoice Details — Drawer',  state: 'drawer',   crumb: 'Billing' },
  { key: 'billing', slug: '15-invoice-lightbox', title: 'Invoice — Full View',       state: 'lightbox', crumb: 'Billing' },
  { key: 'home',    slug: '16-period-popover',   title: 'Date Period — Popover',     state: 'period',   crumb: 'Dashboard' },
  { key: 'chat',    slug: '17-bulk-select',      title: 'Licenses — Bulk Selection', state: 'bulk',     crumb: 'Sangoma UC Chat' },
  { key: 'users',   slug: '18-toast-success',    title: 'Toast — Success',           state: 'tok',      crumb: 'Users' },
  { key: 'users',   slug: '19-toast-error',      title: 'Toast — Error',             state: 'terr',     crumb: 'Users' },
  { key: 'home',    slug: '20-tooltip-infodot',  title: 'Contextual Help — Tooltip', state: 'tip',      crumb: 'Dashboard' },
  { key: 'home',    slug: '21-onboarding-tour',  title: 'Onboarding — Coach Mark',   state: 'tour',     crumb: 'Dashboard' },
];

function read(p){ return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

/* VECTORIZE (chart -> vector, colors -> literals) and REFLECT_STATE
 * (DOM properties -> attributes) are shared with build-partner-pages.cjs. */
const { VECTORIZE, REFLECT_STATE } = require('./build-figma-pages-lib.cjs');

/* =========================================================================
 * In-page routine: open a dialog / force a state before serialization.
 * ========================================================================= */
function TRIGGER(state){
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (state === 'drawer' || state === 'lightbox') {
    // use the app's own opener so the invoice document is actually rendered
    if (typeof window.openInvoice === 'function') window.openInvoice('9151');
    if (state === 'lightbox') {
      if (typeof window.openLightbox === 'function') window.openLightbox();
      const lb = document.getElementById('inv-lightbox');
      if (lb) { lb.hidden = false; lb.classList.add('show'); }
      return sleep(320);
    }
    const s = document.getElementById('inv-scrim');
    if (s) { s.hidden = false; s.classList.add('show'); }
    return sleep(260);
  }
  if (state === 'period') {
    const pick = document.getElementById('periodPick'), pop = document.getElementById('periodPop');
    if (pick) pick.classList.add('open');
    if (pop) pop.hidden = false;
  }
  if (state === 'bulk') {
    // renderLic() wires [data-head]/[data-row] checkboxes and injects .bulkbar on change
    const mount = document.getElementById('chat-table');
    if (mount) [...mount.querySelectorAll('[data-row]')].slice(0, 3).forEach(cb => cb.click());
  }
  if (state === 'tok' || state === 'terr') {
    document.querySelectorAll('.toasts').forEach(b => b.remove());
    if (typeof window.toast === 'function') {
      if (state === 'tok') window.toast('ok', '12 chat licenses have been successfully updated', false);
      else window.toast('err', 'There was an error updating the chat licenses of 3 users. <a href="#">Click here to see the users who failed.</a>', false);
    }
  }
  if (state === 'tip') {
    // the tooltip engine listens on focusin — focusing an info dot renders the real tip
    const dot = document.querySelector('#v-home .info-dot[data-tip]') ||
                document.querySelector('.info-dot[data-tip]');
    if (dot) { dot.style.opacity = '1'; dot.focus(); }
    return sleep(260);
  }
  if (state === 'tour') {
    // the tour is an IIFE exposed only via the help button; drive it the same way
    const hb = document.getElementById('helpBtn');
    if (hb) {
      hb.click();
      return sleep(320).then(() => {
        const nx = document.getElementById('tNext'); // advance to an anchored coach-mark
        if (nx) nx.click();
        return sleep(420);
      });
    }
  }
  return sleep(120);
}

/* ========================================================================= */
(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const stylesCss = read('assets/styles.css');
  const appCss = read('assets/app.css');

  // embed raster assets so each export is fully self-contained (relative paths
  // would break from figma-pages/, and Figma needs the bytes inline)
  const IMAGES = {
    'assets/img/invoice-template.png':
      'data:image/png;base64,' +
      fs.readFileSync(path.join(ROOT, 'assets/img/invoice-template.png')).toString('base64'),
  };
  function embedImages(html){
    for (const [rel, uri] of Object.entries(IMAGES)) {
      html = html.split('"' + rel + '"').join('"' + uri + '"');
    }
    return html;
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
  });

  function shell(inner, title, theme){
    return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sangoma Control Panel — ${title} (${theme})</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${stylesCss}
${appCss}
body{margin:0;min-width:1280px;background:var(--canvas)}
/* :indeterminate is a live DOM property and cannot serialise — mirror it statically */
.ck[data-indeterminate]{background:var(--grad);border-color:transparent}
.ck[data-indeterminate]::after{content:"";position:absolute;left:3px;top:7px;width:10px;height:2px;background:#fff;border-radius:2px}
</style>
</head>
<body data-theme="${theme}">
${inner}
</body>
</html>`;
  }

  const manifest = [];

  async function build(cfg, theme){
    const page = await browser.newPage();
    await page.goto(URL + '#' + cfg.key, { waitUntil: 'networkidle0' });
    await page.evaluate(t => {
      document.documentElement.setAttribute('data-theme', t);
      // keep the header toggle in sync — core.js only does this on click
      const sw = document.querySelector('.tsw');
      if (sw) {
        const dark = t === 'dark';
        sw.setAttribute('aria-checked', dark ? 'true' : 'false');
        const l = sw.querySelector('.l');
        if (l) l.textContent = dark ? 'Dark' : 'Light';
      }
      localStorage.setItem('cpTourDone', '1');
      document.querySelectorAll('.tour-card,.tour-ring,.tour-backdrop').forEach(n => n.remove());
    }, theme);
    await page.evaluate(k => { location.hash = '#' + k; }, cfg.key);
    await new Promise(r => setTimeout(r, 450));

    if (cfg.state) await page.evaluate(TRIGGER, cfg.state);
    await new Promise(r => setTimeout(r, 250));

    await page.evaluate(REFLECT_STATE);
    await page.evaluate(VECTORIZE);

    const inner = await page.evaluate((c) => {
      const rail = document.querySelector('.rail').cloneNode(true);
      const main = document.querySelector('.main').cloneNode(true);
      main.querySelectorAll('.vpage').forEach(s => {
        if (s.id !== 'v-' + c.key) s.remove();
        else { s.removeAttribute('style'); s.style.display = 'block'; }
      });
      const cp = main.querySelector('#crumbPage');
      if (cp) cp.textContent = c.crumb || c.title;
      rail.querySelectorAll('.nav-item.active').forEach(n => n.classList.remove('active'));
      rail.querySelectorAll('.nav-item[data-key="' + c.key + '"]').forEach(n => n.classList.add('active'));

      let extra = '';
      // carry over overlays that live outside .main / .rail (skip any that are
      // already inside them, otherwise ids get duplicated in the export)
      const srcMain = document.querySelector('.main'), srcRail = document.querySelector('.rail');
      ['.drawer-scrim:not([hidden])', '.drawer.open', '.lightbox:not([hidden])', '.toasts', '.tip',
       '.tour-backdrop', '.tour-ring', '.tour-card'].forEach(sel => {
        document.querySelectorAll(sel).forEach(n => {
          if (srcMain.contains(n) || srcRail.contains(n)) return;
          extra += n.outerHTML;
        });
      });
      // shared paint-server defs live outside .rail/.main — carry them so any
      // stylesheet-driven url(#pgrad) reference still resolves in the export
      let defs = '';
      const pg = document.getElementById('pgrad');
      if (pg && !main.querySelector('#pgrad') && !rail.querySelector('#pgrad')) {
        const holder = pg.closest('svg');
        if (holder) defs = holder.outerHTML;
      }
      return defs + rail.outerHTML + main.outerHTML + extra;
    }, cfg);

    const file = `${cfg.slug}-${theme}.html`;
    fs.writeFileSync(path.join(OUT, file), embedImages(shell(inner, cfg.title, theme)));
    manifest.push({ file, title: cfg.title, theme, slug: cfg.slug });
    console.log('  wrote', file);
    await page.close();
  }

  console.log('Pages:');
  for (const p of PAGES) for (const t of ['light', 'dark']) await build(p, t);
  console.log('States / dialogs:');
  for (const s of STATES) for (const t of ['light', 'dark']) await build(s, t);

  /* ---- index ---- */
  const groups = {};
  manifest.forEach(m => { (groups[m.slug] = groups[m.slug] || { title: m.title, files: [] }).files.push(m); });
  const rows = Object.keys(groups).sort().map(slug => {
    const g = groups[slug];
    const links = g.files.sort((a, b) => a.theme.localeCompare(b.theme))
      .map(f => `<a href="${f.file}">${f.theme}</a>`).join('');
    return `<tr><td>${slug}</td><td>${g.title}</td><td class="lk">${links}</td></tr>`;
  }).join('\n');

  fs.writeFileSync(path.join(OUT, 'index.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Control Panel — Figma export</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body{font-family:Inter,system-ui,sans-serif;margin:0;padding:48px;background:#f6f7f9;color:#001221}
h1{font-size:24px;margin:0 0 6px}p{color:#5c6572;margin:0 0 28px;font-size:14px}
table{border-collapse:collapse;width:100%;max-width:860px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
th,td{text-align:left;padding:12px 16px;font-size:13.5px;border-bottom:1px solid #eceef1}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b747d;font-weight:600}
tr:last-child td{border-bottom:none}
td:first-child{font-variant-numeric:tabular-nums;color:#6b747d}
.lk a{display:inline-block;padding:4px 12px;margin-right:6px;border:1px solid #e3e6ea;border-radius:20px;
  text-decoration:none;color:#7a1f86;font-size:12.5px;font-weight:500}
.lk a:hover{background:#faf5fb;border-color:#7a1f86}
</style></head><body>
<h1>Sangoma Control Panel — Figma export</h1>
<p>${manifest.length} files · ${Object.keys(groups).length} screens × light/dark. Charts are flattened to filled vector paths with literal colors for clean Figma import.</p>
<p>See also: <a href="../partner-pages/index.html">partner portal export</a> — partner sign-in, account/location hierarchy, and Billing gating by partner tier.</p>
<table><thead><tr><th>Screen</th><th>Name</th><th>Theme</th></tr></thead><tbody>
${rows}
</tbody></table></body></html>`);

  await browser.close();
  console.log('\nDone →', OUT, `(${manifest.length} files)`);
})().catch(e => { console.error(e); process.exit(1); });
