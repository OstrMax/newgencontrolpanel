/* Builds a single self-contained partner-portal.html with CSS/JS inlined and
   local images embedded as base64. The NetOps dashboard, which the live site
   loads from netops/index.html and netops/dark.html, is inlined as two data
   URIs exposed on window.__NETOPS__ so the file has no external dependencies.
   Google Fonts stays as a remote link. */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('partner.html');

// 1) inline local images referenced in HTML (src="assets/...")
html = html.replace(/src="(assets\/[^"]+\.(png|jpg|jpeg|gif|svg))(\?[^"]*)?"/g, (m, file, ext) => {
  try {
    const buf = fs.readFileSync(path.join(root, file));
    const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `src="data:${mime};base64,${buf.toString('base64')}"`;
  } catch (e) { return m; }
});

// 2) inline stylesheets: <link rel="stylesheet" href="assets/x.css?v=N">
html = html.replace(/<link[^>]+href="(assets\/[^"]+\.css)(\?[^"]*)?"[^>]*>/g, (m, file) => {
  return `<style>\n${read(file)}\n</style>`;
});

// 3) inline the NetOps docs, exposed on window.__NETOPS__ before any script
//    runs so netopsSrc() picks them up instead of the netops/*.html paths.
//    They are turned into blob: URLs at load time — unlike data: URLs, blobs
//    can both be framed AND opened as a top-level tab (browsers block top-level
//    data: navigation), and they inherit the page origin.
const b64 = (p) => fs.readFileSync(path.join(root, p)).toString('base64');
const netopsGlobal =
  '<script>window.__NETOPS__=(function(){' +
  'function u(b){var s=atob(b),a=new Uint8Array(s.length);' +
  'for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);' +
  'return URL.createObjectURL(new Blob([a],{type:"text/html"}));}' +
  'return{light:u(' + JSON.stringify(b64('netops/index.html')) + '),' +
  'dark:u(' + JSON.stringify(b64('netops/dark.html')) + ')};})();</script>\n';
html = html.replace('<script src="assets/core.js', netopsGlobal + '<script src="assets/core.js');

// the "Open in new tab" anchor has a static netops/ href for the hosted site;
// in the single file, point it at the inlined light doc (its click handler
// re-syncs to the current theme anyway).
html = html.replace(/href="netops\/index\.html"/g, 'href="#" data-netops-open');

// 4) inline scripts: <script src="assets/x.js?v=N"></script>
html = html.replace(/<script[^>]+src="(assets\/[^"]+\.js)(\?[^"]*)?"[^>]*><\/script>/g, (m, file) => {
  return `<script>\n${read(file)}\n</script>`;
});

fs.writeFileSync(path.join(root, 'partner-portal.html'), html);
const kb = (fs.statSync(path.join(root, 'partner-portal.html')).size / 1024).toFixed(0);
console.log(`Wrote partner-portal.html (${kb} KB)`);
