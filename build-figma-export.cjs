/* Build separated, self-contained HTML files for Figma upload (html.to.design).
 * Loads the live control-panel (post-JS render) in headless Chrome, then for
 * each view serializes a trimmed <div class="app"> (sidebar + that one section),
 * inlines both stylesheets, base64-embeds the invoice image, and strips all JS.
 * Nothing is clicked/submitted; this only reads the already-rendered DOM. */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'figma-export');
const URL = 'http://localhost:5510/index.html';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const VIEWS = [
  { key: 'home',     file: 'dashboard.html', title: 'Dashboard' },
  { key: 'users',    file: 'users.html',     title: 'Users' },
  { key: 'billing',  file: 'billing.html',   title: 'Billing' },
  { key: 'chat',     file: 'sangoma-uc-chat.html', title: 'Sangoma UC — Chat' },
];

function read(p){ return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const stylesCss = read('assets/styles.css');
  const appCss    = read('assets/app.css');
  const invB64    = fs.readFileSync(path.join(ROOT, 'assets/img/invoice-template.png')).toString('base64');
  const invData   = 'data:image/png;base64,' + invB64;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => new Promise(r => setTimeout(r, 400))); // let renderers settle

  function shell(inner, title, theme){
    const css = stylesCss + '\n' + appCss;
    return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sangoma Control Panel — ${title}</title>
<style>
${css}
body{margin:0;min-width:1280px;background:var(--bg)}
</style>
</head>
<body data-theme="${theme}">
<svg aria-hidden="true" width="0" height="0" style="position:absolute" focusable="false"><defs><linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--g1)"/><stop offset="0.8" stop-color="var(--g2)"/><stop offset="1" stop-color="var(--g3)"/></linearGradient></defs></svg>
${inner}
</body>
</html>`;
  }

  for (const v of VIEWS){
    const inner = await page.evaluate((cfg) => {
      const view = cfg.key;
      const rail = document.querySelector('.rail').cloneNode(true);
      const main = document.querySelector('.main').cloneNode(true);
      main.querySelectorAll('.vpage').forEach(function(s){
        if (s.id !== 'v-' + view) s.remove();
        else { s.removeAttribute('style'); s.style.display = 'block'; s.setAttribute('data-active', view); }
      });
      // set breadcrumb + active nav item (nav items are DIV.nav-item[data-key])
      const cp = main.querySelector('#crumbPage'); if (cp) cp.textContent = cfg.title;
      rail.querySelectorAll('.nav-item.active').forEach(function(n){ n.classList.remove('active'); });
      rail.querySelectorAll('.nav-item[data-key="'+cfg.key+'"]').forEach(function(n){ n.classList.add('active'); });
      // body is the flex row container (styles.css: body{display:flex}); rail+main are DIRECT children.
      return rail.outerHTML + main.outerHTML;
    }, v);

    const html = shell(inner, v.title, 'light');
    fs.writeFileSync(path.join(OUT, v.file), html);
    console.log('wrote', v.file, (html.length/1024).toFixed(0)+'KB');
  }

  // Dedicated full invoice document view (the "entire view" of the invoice)
  const invoiceInner = `<main class="main" style="align-items:center;justify-content:center;min-height:100vh;padding:40px">
    <div style="max-width:820px;width:100%;background:#fff;border-radius:12px;box-shadow:var(--shadow-pop);overflow:hidden">
      <img src="${invData}" alt="Invoice — Sangoma" style="display:block;width:100%;height:auto">
    </div>
  </main>`;
  fs.writeFileSync(path.join(OUT, 'invoice.html'), shell(invoiceInner, 'Invoice', 'light'));
  console.log('wrote invoice.html');

  await browser.close();
  console.log('\nDone →', OUT);
})().catch(e => { console.error(e); process.exit(1); });
