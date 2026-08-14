/* Shared in-page routines for the Figma exporters.
 *
 * These functions are stringified and executed inside Chrome by
 * build-figma-pages.cjs and build-partner-pages.cjs, so they must stay
 * self-contained: no closures over Node scope, no require().
 */

/* =========================================================================
 * In-page routine: vectorize charts + resolve colors. Runs inside Chrome.
 * ========================================================================= */
function VECTORIZE(){
  const P = 4; // coordinate precision
  const rnd = n => Number(n.toFixed(P));

  /* resolve any color expression (var(), currentColor, inherit) to a literal.
   * Custom properties inherit, so reading them off the node itself yields the
   * correct theme-scoped value. Resolves nested vars (e.g. --ch-ok: var(--ok)). */
  function literal(el, raw){
    if (!raw) return raw;
    let v = String(raw).trim();
    if (v === 'none' || v === 'transparent') return v;
    if (v.startsWith('url(')) return v;               // gradient refs handled separately
    const scope = (el && el.nodeType === 1) ? el : document.documentElement;
    if (v === 'currentColor' || v === 'inherit') return getComputedStyle(scope).color;
    let guard = 0;
    while (v.includes('var(') && guard++ < 10) {
      v = v.replace(/var\(\s*(--[A-Za-z0-9-_]+)\s*(?:,([^()]*))?\)/g, (m, name, fb) => {
        const got = getComputedStyle(scope).getPropertyValue(name).trim();
        return got || (fb != null ? fb.trim() : m);
      });
    }
    return v;
  }

  /* point on circle: angle measured CLOCKWISE from 12 o'clock (bakes rotate(-90)) */
  function pt(cx, cy, rad, t){
    return [rnd(cx + rad * Math.sin(t)), rnd(cy - rad * Math.cos(t))];
  }

  /* rounded-cap annulus sector -> filled path 'd' */
  function wedge(cx, cy, rMid, sw, t0, t1){
    const R = rMid + sw / 2, ri = rMid - sw / 2, cap = sw / 2;
    const large = (t1 - t0) > Math.PI ? 1 : 0;
    const o0 = pt(cx, cy, R, t0),  o1 = pt(cx, cy, R, t1);
    const i0 = pt(cx, cy, ri, t0), i1 = pt(cx, cy, ri, t1);
    return [
      `M${i0[0]},${i0[1]}`,
      `A${rnd(cap)},${rnd(cap)} 0 0 1 ${o0[0]},${o0[1]}`,   // start cap
      `A${rnd(R)},${rnd(R)} 0 ${large} 1 ${o1[0]},${o1[1]}`, // outer arc
      `A${rnd(cap)},${rnd(cap)} 0 0 1 ${i1[0]},${i1[1]}`,   // end cap
      `A${rnd(ri)},${rnd(ri)} 0 ${large} 0 ${i0[0]},${i0[1]}`, // inner arc back
      'Z',
    ].join(' ');
  }

  /* full ring (track) -> evenodd donut path, no stroke */
  function ring(cx, cy, rMid, sw){
    const R = rMid + sw / 2, ri = rMid - sw / 2;
    const c = (rad) =>
      `M${rnd(cx - rad)},${rnd(cy)} A${rnd(rad)},${rnd(rad)} 0 1 0 ${rnd(cx + rad)},${rnd(cy)} ` +
      `A${rnd(rad)},${rnd(rad)} 0 1 0 ${rnd(cx - rad)},${rnd(cy)} Z`;
    return c(R) + ' ' + c(ri);
  }

  /* ---- 1. resolve gradient stops, then inline each referenced gradient into
   * the SVG that uses it. The app defines #pgrad once in a shared <defs> block
   * that lives outside .rail/.main, so without this the exported line charts
   * would reference a gradient that does not exist in the file. ---- */
  document.querySelectorAll('linearGradient stop, radialGradient stop').forEach(s => {
    const sc = s.getAttribute('stop-color');
    if (sc) s.setAttribute('stop-color', literal(s.closest('svg') || document.documentElement, sc));
  });

  /* Paint-server refs also arrive via CSS (e.g. `fill:url(#pgrad)` in the
   * stylesheets), not just attributes. Promote the computed value onto the
   * element so the inliner below can make each SVG self-contained. */
  document.querySelectorAll('svg, svg *').forEach(el => {
    const cs = getComputedStyle(el);
    ['fill', 'stroke'].forEach(a => {
      const v = cs[a];
      if (v && v.includes('url(') && !String(el.getAttribute(a) || '').includes('url(')) {
        el.setAttribute(a, v.replace(/url\(["']?#([^"')]+)["']?\)/, 'url(#$1)'));
      }
    });
  });

  let gradSeq = 0;
  document.querySelectorAll('svg').forEach(svg => {
    const ids = new Set();
    svg.querySelectorAll('*').forEach(n => {
      ['fill', 'stroke'].forEach(a => {
        const m = /url\(#([^)]+)\)/.exec(n.getAttribute(a) || '');
        if (m) ids.add(m[1]);
      });
    });
    ids.forEach(id => {
      if (svg.querySelector('#' + CSS.escape(id))) return;   // already self-contained
      const src = document.getElementById(id);
      if (!src) return;
      const uid = id + '-x' + (++gradSeq);                   // unique per SVG copy
      const clone = src.cloneNode(true);
      clone.setAttribute('id', uid);
      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.insertBefore(defs, svg.firstChild);
      }
      defs.appendChild(clone);
      svg.querySelectorAll('*').forEach(n => {
        ['fill', 'stroke'].forEach(a => {
          const val = n.getAttribute(a);
          if (val && val.includes('url(#' + id + ')')) {
            n.setAttribute(a, val.replace('url(#' + id + ')', 'url(#' + uid + ')'));
          }
        });
      });
    });
  });

  /* ---- 2. convert donut/ring charts to filled vector paths ---- */
  document.querySelectorAll('svg').forEach(svg => {
    const circles = [...svg.querySelectorAll('circle')];
    const arcs = circles.filter(c => c.hasAttribute('stroke-dasharray'));
    if (!arcs.length) return;                       // not a donut chart

    const rotated = /rotate\(-90deg\)/.test(svg.getAttribute('style') || '');
    const frag = [];

    circles.forEach(c => {
      const cx = parseFloat(c.getAttribute('cx'));
      const cy = parseFloat(c.getAttribute('cy'));
      const rM = parseFloat(c.getAttribute('r'));
      const sw = parseFloat(c.getAttribute('stroke-width'));
      const col = literal(svg, c.getAttribute('stroke'));
      if (col === 'none' || col === 'transparent') return;

      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      if (!c.hasAttribute('stroke-dasharray')) {
        p.setAttribute('d', ring(cx, cy, rM, sw));
        p.setAttribute('fill-rule', 'evenodd');
      } else {
        const dash = parseFloat(c.getAttribute('stroke-dasharray').split(/[\s,]+/)[0]);
        const off = -parseFloat(c.getAttribute('stroke-dashoffset') || 0);
        if (!(dash > 0)) return;
        const t0 = off / rM;                        // arc-length -> radians
        const t1 = (off + dash) / rM;
        p.setAttribute('d', wedge(cx, cy, rM, sw, t0, t1));
      }
      p.setAttribute('fill', col);
      frag.push(p);
    });

    if (!frag.length) return;
    circles.forEach(c => c.remove());
    frag.forEach(p => svg.appendChild(p));
    if (rotated) svg.removeAttribute('style');       // rotation is baked into geometry
  });

  /* ---- 3. resolve remaining var()/currentColor on every SVG node ---- */
  document.querySelectorAll('svg, svg *').forEach(el => {
    ['fill', 'stroke', 'stop-color'].forEach(a => {
      const raw = el.getAttribute(a);
      if (raw && (raw.includes('var(') || raw === 'currentColor')) {
        el.setAttribute(a, literal(el, raw, a));
      }
    });
    // inline styles too
    const st = el.getAttribute('style');
    if (st && st.includes('var(')) {
      el.setAttribute('style', st.replace(/var\((--[^),]+)(,[^)]*)?\)/g, (m) => literal(el, m)));
    }
  });

  /* icons inherit color via CSS `currentColor` with no attribute — bake it */
  document.querySelectorAll('svg').forEach(svg => {
    const c = getComputedStyle(svg).color;
    svg.querySelectorAll('[stroke="currentColor"], [fill="currentColor"]').forEach(n => {
      if (n.getAttribute('stroke') === 'currentColor') n.setAttribute('stroke', c);
      if (n.getAttribute('fill') === 'currentColor') n.setAttribute('fill', c);
    });
  });
}

/* =========================================================================
 * In-page routine: reflect live DOM *properties* into *attributes*.
 * outerHTML only serializes attributes, so a checkbox ticked via
 * `el.checked = true` (or a select/input value set by script) would otherwise
 * be silently lost from the export.
 * ========================================================================= */
function REFLECT_STATE(){
  document.querySelectorAll('input[type=checkbox],input[type=radio]').forEach(i => {
    if (i.checked) i.setAttribute('checked', ''); else i.removeAttribute('checked');
    if (i.indeterminate) i.setAttribute('data-indeterminate', 'true');
  });
  document.querySelectorAll('select').forEach(s => {
    [...s.options].forEach(o => {
      if (o.selected) o.setAttribute('selected', ''); else o.removeAttribute('selected');
    });
  });
  document.querySelectorAll('input:not([type=checkbox]):not([type=radio])').forEach(i => {
    if (i.value) i.setAttribute('value', i.value);
  });
  document.querySelectorAll('textarea').forEach(t => { if (t.value) t.textContent = t.value; });
}

module.exports = { VECTORIZE, REFLECT_STATE };
