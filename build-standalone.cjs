/* Builds a single self-contained control-panel.html with CSS/JS inlined
   and local images embedded as base64. Google Fonts stays as a remote link. */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

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

// 3) inline scripts: <script src="assets/x.js?v=N"></script>
html = html.replace(/<script[^>]+src="(assets\/[^"]+\.js)(\?[^"]*)?"[^>]*><\/script>/g, (m, file) => {
  return `<script>\n${read(file)}\n</script>`;
});

fs.writeFileSync(path.join(root, 'control-panel.html'), html);
const kb = (fs.statSync(path.join(root, 'control-panel.html')).size / 1024).toFixed(0);
console.log(`Wrote control-panel.html (${kb} KB)`);
