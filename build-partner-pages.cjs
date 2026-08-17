/* Build separated, self-contained HTML files for the PARTNER tier.
 *
 * Covers the flow the POC actually starts from:
 *   partner sign-in → MFA → partner dashboard → customer accounts
 *   → a single customer → a single location,
 * plus the customer control panel as it appears when a partner opened it,
 * for a Retail/FSW partner (no Billing) and a White-label partner (Billing).
 *
 * Reuses the Figma-safety pipeline from build-figma-pages.cjs verbatim
 * (donut arcs → filled vector wedges, var()/currentColor → literals,
 *  rotate(-90deg) baked into geometry, paint servers inlined per-SVG).
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'partner-pages');
const BASE = 'http://localhost:5510/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const fig = require('./build-figma-pages-lib.cjs');
const { VECTORIZE, REFLECT_STATE } = fig;

/* ---------- screen catalogue ----------
 * capture: 'auth'    → serialise the login split-screen only
 *          'shell'   → serialise .rail + .main (the application chrome)
 * setup:   name of an in-page routine run before serialisation
 */
/* the partner hierarchy travels to the control panel in the query string */
function CPQ(tier, acct, loc, partner){
  return '?partner=' + encodeURIComponent(partner || 'Northwind Communications') +
    '&tier=' + tier + '&acct=' + encodeURIComponent(acct) + '&loc=' + encodeURIComponent(loc);
}

const SCREENS = [
  { slug: '01-partner-signin',      title: 'Partner Sign-in',              app: 'partner', capture: 'auth',  setup: 'cred' },
  { slug: '02-partner-signin-error',title: 'Partner Sign-in \u2014 Error',  app: 'partner', capture: 'auth',  setup: 'crederr' },
  { slug: '03-partner-mfa',         title: 'Partner Sign-in \u2014 MFA',    app: 'partner', capture: 'auth',  setup: 'mfa' },
  { slug: '04-partner-dashboard',   title: 'Partner Dashboard',            app: 'partner', capture: 'shell', setup: 'go:pdash' },
  { slug: '05-customer-accounts',   title: 'Customer Accounts',            app: 'partner', capture: 'shell', setup: 'go:customers' },
  { slug: '06-support-tickets',     title: 'Support Tickets',              app: 'partner', capture: 'shell', setup: 'go:tickets' },
  { slug: '07-partner-orders',      title: 'Partner Orders',               app: 'partner', capture: 'shell', setup: 'go:orders' },
  { slug: '08-partner-team',        title: 'Partner Team',                 app: 'partner', capture: 'shell', setup: 'go:team' },
  { slug: '09-partner-analytics',   title: 'Partner Analytics',            app: 'partner', capture: 'shell', setup: 'go:preports' },

  /* Drilling into a customer lands in that customer's real control panel, with
     the partner hierarchy and the location picker carried across. */
  { slug: '10-cp-retail-no-billing', title: 'Control Panel \u2014 Retail/FSW (no Billing)',
    app: 'cp', query: CPQ('retail', 'Acme Manufacturing', 'Austin HQ'), hash: 'home', capture: 'shell' },
  { slug: '11-cp-retail-users',      title: 'Control Panel \u2014 Retail/FSW \u00b7 Users',
    app: 'cp', query: CPQ('retail', 'Acme Manufacturing', 'Austin HQ'), hash: 'users', capture: 'shell' },
  { slug: '12-cp-location-picker',   title: 'Control Panel \u2014 Location Picker',
    app: 'cp', query: CPQ('retail', 'Acme Manufacturing', 'Dallas Depot'), hash: 'home', capture: 'shell', setup: 'picker' },
  { slug: '13-cp-whitelabel-billing', title: 'Control Panel \u2014 White-label (Billing visible)',
    app: 'cp', query: CPQ('whitelabel', 'Belmont Health', 'Riverside Campus', 'Acme Telecom'), hash: 'billing', capture: 'shell' },
];
function read(p){ return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

/* =========================================================================
 * In-page routine: drive partner.html into the requested screen.
 * ========================================================================= */
function SETUP(step){
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  if (step === 'cred') return sleep(80);

  if (step === 'crederr') {
    const err = document.getElementById('authErr');
    if (err) err.hidden = false;
    const pw = document.getElementById('pPass');
    if (pw) pw.classList.add('bad');
    return sleep(80);
  }

  if (step === 'mfa') {
    document.getElementById('stepCred').classList.add('gone');
    document.getElementById('stepMfa').classList.remove('gone');
    // partial entry reads as a live screen rather than an empty form
    const cells = [...document.querySelectorAll('.mfa-code .inp')];
    ['4', '1', '9'].forEach((d, i) => { if (cells[i]) cells[i].value = d; });
    if (cells[3]) cells[3].focus();
    return sleep(120);
  }

  // everything below happens inside the shell
  document.body.setAttribute('data-view', 'app');

  if (step.startsWith('go:')) { window.pGo(step.slice(3)); return sleep(260); }

  if (step === 'picker') {
    const btn = document.querySelector('#locSel .cr-btn');
    if (btn) btn.click();
    return sleep(200);
  }

  return sleep(120);
}

/* ========================================================================= */
(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const stylesCss = read('assets/styles.css');
  const appCss = read('assets/app.css');
  const partnerCss = read('assets/partner.css');

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

  function shell(inner, title, theme, view){
    return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sangoma Partner Portal — ${title} (${theme})</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${stylesCss}
${appCss}
${partnerCss}
body{margin:0;min-width:1280px;background:var(--canvas)}
/* :indeterminate is a live DOM property and cannot serialise — mirror it statically */
.ck[data-indeterminate]{background:var(--grad);border-color:transparent}
.ck[data-indeterminate]::after{content:"";position:absolute;left:3px;top:7px;width:10px;height:2px;background:#fff;border-radius:2px}
</style>
</head>
<body data-theme="${theme}" data-view="${view}">
${inner}
</body>
</html>`;
  }

  const manifest = [];

  async function build(cfg, theme){
    const page = await browser.newPage();
    const url = cfg.app === 'partner'
      ? BASE + 'partner.html'
      : BASE + 'index.html' + (cfg.query || '');
    await page.goto(url + '#' + (cfg.hash || 'pdash'), { waitUntil: 'networkidle0' });

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

    if (cfg.setup) await page.evaluate(SETUP, cfg.setup);
    else await new Promise(r => setTimeout(r, 400));

    // charts are theme-coloured; redraw after the theme flip
    await page.evaluate(() => { if (typeof window.pDrawCharts === 'function') window.pDrawCharts(); });
    await new Promise(r => setTimeout(r, 260));

    await page.evaluate(REFLECT_STATE);
    await page.evaluate(VECTORIZE);

    const inner = await page.evaluate((c) => {
      function defsOf(scopes){
        const pg = document.getElementById('pgrad');
        if (!pg) return '';
        if (scopes.some(s => s && s.querySelector('#pgrad'))) return '';
        const holder = pg.closest('svg');
        return holder ? holder.outerHTML : '';
      }

      if (c.capture === 'auth') {
        const auth = document.querySelector('.auth').cloneNode(true);
        auth.querySelectorAll('.auth-card.gone').forEach(n => n.remove());
        return defsOf([auth]) + auth.outerHTML;
      }

      const rail = document.querySelector('.rail').cloneNode(true);
      const main = document.querySelector('.main').cloneNode(true);
      // keep only the visible page so the export is one screen, not thirteen
      const on = document.querySelector('.vpage.on');
      const keep = on ? on.id : null;
      main.querySelectorAll('.vpage').forEach(s => {
        if (s.id !== keep) s.remove();
        else { s.removeAttribute('style'); s.style.display = 'block'; }
      });

      let extra = '';
      const srcMain = document.querySelector('.main'), srcRail = document.querySelector('.rail');
      ['.drawer-scrim:not([hidden])', '.drawer.open', '.lightbox:not([hidden])', '.toasts', '.tip']
        .forEach(sel => document.querySelectorAll(sel).forEach(n => {
          if (srcMain.contains(n) || srcRail.contains(n)) return;
          extra += n.outerHTML;
        }));

      return defsOf([rail, main]) + rail.outerHTML + main.outerHTML + extra;
    }, cfg);

    const view = cfg.capture === 'auth' ? 'login' : 'app';
    const file = `${cfg.slug}-${theme}.html`;
    fs.writeFileSync(path.join(OUT, file), embedImages(shell(inner, cfg.title, theme, view)));
    manifest.push({ file, title: cfg.title, theme, slug: cfg.slug });
    console.log('  wrote', file);
    await page.close();
  }

  for (const s of SCREENS) for (const t of ['light', 'dark']) await build(s, t);

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
<html lang="en"><head><meta charset="UTF-8"><title>Partner Portal — Figma export</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body{font-family:Inter,system-ui,sans-serif;margin:0;padding:48px;background:#f6f7f9;color:#001221}
h1{font-size:24px;margin:0 0 6px}p{color:#5c6572;margin:0 0 28px;font-size:14px;max-width:70ch;line-height:1.6}
table{border-collapse:collapse;width:100%;max-width:900px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
th,td{text-align:left;padding:12px 16px;font-size:13.5px;border-bottom:1px solid #eceef1}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b747d;font-weight:600}
tr:last-child td{border-bottom:none}
td:first-child{font-variant-numeric:tabular-nums;color:#6b747d}
.lk a{display:inline-block;padding:4px 12px;margin-right:6px;border:1px solid #e3e6ea;border-radius:20px;
  text-decoration:none;color:#7a1f86;font-size:12.5px;font-weight:500}
.lk a:hover{background:#faf5fb;border-color:#7a1f86}
</style></head><body>
<h1>Sangoma Partner Portal — Figma export</h1>
<p>${manifest.length} files · ${Object.keys(groups).length} screens × light/dark.
Flow order: partner sign-in → MFA → partner dashboard → customer accounts → customer → location.
Screens 11–13 show the customer control panel opened from the portal: Retail/FSW partners have no Billing section, white-label partners do.</p>
<p>See also: <a href="../figma-pages/index.html">customer control panel export</a>.</p>
<table><thead><tr><th>Screen</th><th>Name</th><th>Theme</th></tr></thead><tbody>
${rows}
</tbody></table></body></html>`);

  await browser.close();
  console.log('\nDone →', OUT, `(${manifest.length} files)`);
})().catch(e => { console.error(e); process.exit(1); });
