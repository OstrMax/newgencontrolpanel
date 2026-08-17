/* Validate the figma-pages exports: no dangling url(#id) refs, no unresolved
 * CSS vars / currentColor in SVG, no dash-arc charts left, no duplicate ids. */
const fs = require('fs');
const path = require('path');
/* usage: node verify-figma-pages.cjs [dir] [census-file] */
const DIR = path.join(__dirname, process.argv[2] || 'figma-pages');
const CENSUS = process.argv[3] || '01-dashboard-light.html';

let bad = 0;
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const f of files) {
  const h = fs.readFileSync(path.join(DIR, f), 'utf8');
  const problems = [];

  // dangling gradient / filter references
  const refs = [...h.matchAll(/url\(#([^)"']+)\)/g)].map(m => m[1]);
  const ids = new Set([...h.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const dangling = [...new Set(refs.filter(r => !ids.has(r)))];
  if (dangling.length) problems.push('dangling url refs: ' + dangling.join(', '));

  // duplicate ids
  const idList = [...h.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  const dupes = [...new Set(idList.filter((x, i) => idList.indexOf(x) !== i))];
  if (dupes.length) problems.push('duplicate ids: ' + dupes.slice(0, 5).join(', '));

  // figma-hostile chart constructs
  if (/stroke-dasharray/.test(h)) problems.push('stroke-dasharray still present');
  if (/rotate\(-90deg\)/.test(h)) problems.push('rotate(-90deg) wrapper still present');

  // unresolved colour tokens inside SVG markup
  const svgs = h.match(/<svg[\s\S]*?<\/svg>/g) || [];
  const svgBlob = svgs.join('');
  const varAttr = svgBlob.match(/(fill|stroke|stop-color)="[^"]*var\(/g) || [];
  if (varAttr.length) problems.push(varAttr.length + ' unresolved var() in svg attrs');
  const cc = svgBlob.match(/(fill|stroke)="currentColor"/g) || [];
  if (cc.length) problems.push(cc.length + ' currentColor in svg attrs');

  if (problems.length) { bad++; console.log('FAIL ' + f + '\n   - ' + problems.join('\n   - ')); }
}

console.log('\n' + files.length + ' files checked, ' + bad + ' with problems.');

// chart census on a representative page
const d = fs.readFileSync(path.join(DIR, CENSUS), 'utf8');
console.log(CENSUS + ': ' + (d.match(/fill-rule="evenodd"/g) || []).length + ' track rings, ' +
  (d.match(/<path d="M[\d.]/g) || []).length + ' vector paths, ' +
  (d.match(/<polyline/g) || []).length + ' polylines');
process.exit(bad ? 1 : 0);
