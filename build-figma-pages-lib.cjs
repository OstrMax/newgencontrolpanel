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

  /* Rounded-cap annulus sector -> filled path 'd'.
   * A sector spanning a full turn has coincident endpoints, and an SVG arc
   * between two identical points renders nothing — so a 100% slice would
   * silently disappear. Those degenerate to a plain ring instead. */
  function wedge(cx, cy, rMid, sw, t0, t1){
    const R = rMid + sw / 2, ri = rMid - sw / 2, cap = sw / 2;
    if (t1 - t0 >= 2 * Math.PI - 1e-6) return ring(cx, cy, rMid, sw);
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

  /* Full ring (track, or a slice that covers the whole circle).
   * The two subpaths are wound in OPPOSITE directions so the hole survives
   * under nonzero as well as evenodd. Figma flattens imported vectors with
   * nonzero, so a same-winding donut arrives as a solid disc — which is how
   * the earlier exports lost their centres. */
  function ring(cx, cy, rMid, sw){
    const R = rMid + sw / 2, ri = rMid - sw / 2;
    const c = (rad, sweep) =>
      `M${rnd(cx - rad)},${rnd(cy)} A${rnd(rad)},${rnd(rad)} 0 1 ${sweep} ${rnd(cx + rad)},${rnd(cy)} ` +
      `A${rnd(rad)},${rnd(rad)} 0 1 ${sweep} ${rnd(cx - rad)},${rnd(cy)} Z`;
    return c(R, 0) + ' ' + c(ri, 1);
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

  /* ---- 2b. outline stroked chart lines into filled shapes ----
   * Line and sparkline series are <polyline stroke>. A stroke is a rendering
   * instruction, not geometry: importers re-derive it from their own join and
   * cap rules, so the curve arrives a different weight or with mitred corners.
   * Emitting the swept area as fill makes the shape final.
   *
   * Each segment becomes a quad and each vertex a disc. All subpaths are wound
   * the same way, so nonzero unions them into exactly the stroked region —
   * no fill-rule dependency, and joins/caps come out round for free. */
  function disc(cx, cy, r){
    return `M${rnd(cx - r)},${rnd(cy)} A${rnd(r)},${rnd(r)} 0 1 0 ${rnd(cx + r)},${rnd(cy)} ` +
           `A${rnd(r)},${rnd(r)} 0 1 0 ${rnd(cx - r)},${rnd(cy)} Z`;
  }
  function outline(pts, w){
    const h = w / 2, subs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      if (L < 1e-9) continue;
      const nx = -dy / L * h, ny = dx / L * h;
      /* order the quad so its signed area always has the same sign as disc() */
      const q = [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]];
      let a = 0;
      for (let k = 0; k < 4; k++) {
        const p = q[k], n = q[(k + 1) % 4];
        a += p[0] * n[1] - n[0] * p[1];
      }
      if (a > 0) q.reverse();
      subs.push('M' + q.map(p => `${rnd(p[0])},${rnd(p[1])}`).join(' L') + ' Z');
    }
    pts.forEach(p => subs.push(disc(p[0], p[1], h)));
    return subs.join(' ');
  }

  document.querySelectorAll('svg polyline, svg polygon').forEach(el => {
    const cs = getComputedStyle(el);
    const stroke = literal(el, el.getAttribute('stroke') || cs.stroke);
    if (!stroke || stroke === 'none' || stroke === 'transparent') return;
    const w = parseFloat(el.getAttribute('stroke-width') || cs.strokeWidth) || 1;
    const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
    if (pts.length < 4) return;
    const P = [];
    for (let i = 0; i + 1 < pts.length; i += 2) P.push([pts[i], pts[i + 1]]);
    if (el.tagName.toLowerCase() === 'polygon') P.push(P[0]);
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', outline(P, w));
    p.setAttribute('fill', stroke);
    /* a polygon may also carry an area fill — keep it beneath the outline */
    const fill = literal(el, el.getAttribute('fill') || cs.fill);
    if (fill && fill !== 'none' && fill !== 'transparent') {
      const base = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      base.setAttribute('d', 'M' + P.map(q => `${rnd(q[0])},${rnd(q[1])}`).join(' L') + ' Z');
      base.setAttribute('fill', fill);
      el.parentNode.insertBefore(base, el);
    }
    el.parentNode.insertBefore(p, el);
    el.remove();
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
