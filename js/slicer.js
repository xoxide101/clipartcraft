/* The Montage Slicer: a sheet (montage) of clip art cut into separate pictures and added to the library. Two ways to cut:
   Find the pictures (items on a plain or old-paper background, found by themselves) and Grid (rows × columns, for
   montages whose pictures touch). Each box can be left out with a click; names are given in reading order.
   The finding and cutting is ClipArtCraft's own copy of ImageCraft's Split a sheet (js/filters.js there). */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id), L = window.CraftClipart;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ------------------------------------------------------------------ finding and cutting (from ImageCraft)
  const copy = (img) => new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
  const canvasOf = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c; };
  const cropOf = (img, x, y, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const k = c.getContext('2d'); k.drawImage(canvasOf(img), -x, -y); return k.getImageData(0, 0, w, h); };
  const srgbToLin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)), fLab = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  function toLab(r, g, b) { const R = srgbToLin(r), G = srgbToLin(g), B = srgbToLin(b), X = (0.412453 * R + 0.35758 * G + 0.180423 * B) / 0.950456, Y = 0.212671 * R + 0.71516 * G + 0.072169 * B, Z = (0.019334 * R + 0.119193 * G + 0.950227 * B) / 1.088754; const fy = fLab(Y); return [Y > 0.008856 ? 116 * fy - 16 : 903.3 * Y, 500 * (fLab(X) - fy), 200 * (fy - fLab(Z))]; }
  function cornerBg(img) { const W = img.width, H = img.height, d = img.data, cs = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; }); let best = cs[0], bn = -1; for (const c of cs) { const n = cs.filter((e) => Math.abs(e[0] - c[0]) + Math.abs(e[1] - c[1]) + Math.abs(e[2] - c[2]) < 30).length; if (n > bn) { bn = n; best = c; } } return best; }
  function distanceTo(mask, W, H) {
    const D = new Float32Array(W * H), INF = 1e9; for (let p = 0; p < W * H; p++) D[p] = mask[p] ? 0 : INF;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x; let v = D[p]; if (x > 0) v = Math.min(v, D[p - 1] + 1); if (y > 0) { v = Math.min(v, D[p - W] + 1); if (x > 0) v = Math.min(v, D[p - W - 1] + 1.414); if (x < W - 1) v = Math.min(v, D[p - W + 1] + 1.414); } D[p] = v; }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const p = y * W + x; let v = D[p]; if (x < W - 1) v = Math.min(v, D[p + 1] + 1); if (y < H - 1) { v = Math.min(v, D[p + W] + 1); if (x < W - 1) v = Math.min(v, D[p + W + 1] + 1.414); if (x > 0) v = Math.min(v, D[p + W - 1] + 1.414); } D[p] = v; }
    return D;
  }
  // the soft edge pixels next to what was taken away get their true colour back and become as see-through as they were background
  function defringe(img, bg, { reach = 2 } = {}) {
    const W = img.width, H = img.height, d = img.data, o = copy(img), od = o.data, n = W * H, clear = new Uint8Array(n);
    for (let p = 0; p < n; p++) clear[p] = d[p * 4 + 3] < 16 ? 1 : 0;
    const dist = (i) => Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x; if (clear[p]) continue; let near = false;
      for (let j = -reach; j <= reach && !near; j++) for (let i = -reach; i <= reach; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < W && yy < H && clear[yy * W + xx]) { near = true; break; } }
      if (!near) continue;
      let F = -1, fd = 0; const R = reach + 2; for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = (yy * W + xx) * 4; if (d[q + 3] < 240) continue; const e = dist(q); if (e > fd) { fd = e; F = q; } }
      if (F < 0 || fd < 24) continue;
      const q = p * 4, a = Math.max(0, Math.min(1, dist(q) / fd));
      if (a < 0.06) { od[q + 3] = 0; continue; }
      for (let c = 0; c < 3; c++) od[q + c] = Math.max(0, Math.min(255, Math.round(bg[c] + (d[q + c] - bg[c]) / a)));
      od[q + 3] = Math.round(Math.min(d[q + 3], a * 255));
    }
    return o;
  }
  // the items on a plain background (the paper learnt from the sheet's border, in Lab), parts closer than `gap` joined,
  // specks smaller than `min` (share of the sheet) left out, in reading order
  function splitSheet(img, { gap = 0, min = 0.002, tolerance = 40 } = {}) {
    const W = img.width, H = img.height, n = W * H, d = img.data, bg = cornerBg(img), m = new Uint8Array(n); let clear = false;
    for (let p = 0; p < n; p++) if (d[p * 4 + 3] < 250) { clear = true; break; }
    const b0 = Math.max(2, Math.round(Math.min(W, H) * 0.03)), Ls = [], As = [], Bs = [];
    if (!clear) for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { if (x >= b0 && y >= b0 && x < W - b0 && y < H - b0) continue; const i = (y * W + x) * 4, q = toLab(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255); Ls.push(q[0]); As.push(q[1]); Bs.push(q[2]); }
    const pct = (a, t) => { const s2 = a.slice().sort((u, v) => u - v); return s2[Math.min(s2.length - 1, Math.floor(t * s2.length))]; }, tl = tolerance / 40;
    const Lmin = clear ? 0 : pct(Ls, 0.03) - 6 * tl, Alo = clear ? 0 : pct(As, 0.03) - 4 * tl, Ahi = clear ? 0 : pct(As, 0.97) + 4 * tl, Blo = clear ? 0 : pct(Bs, 0.03) - 5 * tl, Bhi = clear ? 0 : pct(Bs, 0.97) + 5 * tl;
    for (let p = 0; p < n; p++) { const i = p * 4; if (clear) { m[p] = d[i + 3] >= 64 ? 1 : 0; continue; } const q = toLab(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255); m[p] = q[0] >= Lmin && q[1] >= Alo && q[1] <= Ahi && q[2] >= Blo && q[2] <= Bhi ? 0 : 1; }
    const g = gap || Math.max(3, Math.round(Math.max(W, H) / 250)), grown = new Uint8Array(n);
    { const D = distanceTo(m, W, H); for (let p = 0; p < n; p++) grown[p] = D[p] <= g / 2 ? 1 : 0; }
    const lab = new Int32Array(n), st = new Int32Array(n), boxes = []; let id = 0;
    for (let s0 = 0; s0 < n; s0++) { if (!grown[s0] || lab[s0]) continue; id++; let top = 0, x0 = W, y0 = H, x1 = -1, y1 = -1, area = 0; st[top++] = s0; lab[s0] = id;
      while (top) { const p = st[--top], x = p % W, y = (p / W) | 0; if (m[p]) { area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) if (q >= 0 && grown[q] && !lab[q]) { lab[q] = id; st[top++] = q; } }
      if (x1 >= 0 && area >= min * n) boxes.push({ id, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, area }); }
    boxes.sort((a, b) => a.y - b.y); const rows = [];
    for (const b of boxes) { const r = rows.find((row) => b.y < row.mid); if (r) { r.items.push(b); } else rows.push({ mid: b.y + b.h * 0.6, items: [b] }); }
    return { items: rows.flatMap((r) => r.items.sort((a, b) => a.x - b.x)), lab, bg, clear, m };
  }
  // one item cut out: its box with room round it; only the background reachable from outside is taken away (white walls,
  // smoke and highlights inside stay), then clean edges
  function sheetItem(img, sheet, item, { pad = 6, see = true } = {}) {
    const W = img.width, H = img.height, x0 = Math.max(0, item.x - pad), y0 = Math.max(0, item.y - pad), x1 = Math.min(W, item.x + item.w + pad), y1 = Math.min(H, item.y + item.h + pad), w = x1 - x0, h = y1 - y0;
    let o = new ImageData(w, h); const bg = sheet.bg, solid = new Uint8Array(w * h), out = new Uint8Array(w * h), st = new Int32Array(w * h); let top = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = (y0 + y) * W + x0 + x, i = p * 4, q = (y * w + x) * 4; o.data[q] = img.data[i]; o.data[q + 1] = img.data[i + 1]; o.data[q + 2] = img.data[i + 2]; o.data[q + 3] = img.data[i + 3]; solid[y * w + x] = sheet.lab[p] === item.id && sheet.m[p] ? 1 : 0; }
    if (!see) { for (let k = 0; k < w * h; k++) if (!solid[k] && sheet.lab[(y0 + ((k / w) | 0)) * W + x0 + (k % w)] !== item.id) { o.data[k * 4] = bg[0]; o.data[k * 4 + 1] = bg[1]; o.data[k * 4 + 2] = bg[2]; } o.at = { x: x0, y: y0, w, h }; return o; }
    const push = (k) => { if (!solid[k] && !out[k]) { out[k] = 1; st[top++] = k; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (top) { const k = st[--top], x = k % w, y = (k / w) | 0; if (x > 0) push(k - 1); if (x < w - 1) push(k + 1); if (y > 0) push(k - w); if (y < h - 1) push(k + w); }
    for (let k = 0; k < w * h; k++) if (out[k]) o.data[k * 4 + 3] = 0;
    if (!sheet.clear) o = defringe(o, bg, { reach: 2 });
    o.at = { x: x0, y: y0, w, h }; return o;
  }
  // the part of the sheet that is not plain margin (the corner colour all round)
  function contentBox(img, tolerance = 40) {
    const W = img.width, H = img.height, d = img.data, bg = cornerBg(img), off = (x, y) => { const i = (y * W + x) * 4; return Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > tolerance; };
    let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (off(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? { x: 0, y: 0, w: W, h: H } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  // a grid montage: rows × columns of equal cells over the sheet (its plain margins left off), an even margin taken off
  // each cell (borders and gutters)
  function gridCells(img, { rows = 3, cols = 3, inset = 0, margins = true } = {}) {
    const a = margins ? contentBox(img) : { x: 0, y: 0, w: img.width, h: img.height }, out = [], cw = a.w / cols, ch = a.h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = Math.round(a.x + c * cw + inset), y = Math.round(a.y + r * ch + inset), x1 = Math.round(a.x + (c + 1) * cw - inset), y1 = Math.round(a.y + (r + 1) * ch - inset); if (x1 - x > 2 && y1 - y > 2) out.push({ x, y, w: x1 - x, h: y1 - y }); }
    return out;
  }
  // one grid cell: as it is, or its picture found in it and cut out (everything in the cell kept together)
  function gridItem(img, cell, { cut = true, pad = 6 } = {}) {
    const c = cropOf(img, cell.x, cell.y, cell.w, cell.h); c.at = { ...cell }; if (!cut) return c;
    const sh = splitSheet(c, { gap: Math.max(c.width, c.height), min: 0.002 }); if (!sh.items.length) return c;
    const keep = new Set(sh.items.map((i) => i.id)), x0 = Math.min(...sh.items.map((i) => i.x)), y0 = Math.min(...sh.items.map((i) => i.y)), x1 = Math.max(...sh.items.map((i) => i.x + i.w)), y1 = Math.max(...sh.items.map((i) => i.y + i.h));
    for (let p = 0; p < sh.lab.length; p++) if (keep.has(sh.lab[p])) sh.lab[p] = 1;
    const o = sheetItem(c, sh, { id: 1, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, { pad, see: true }); o.at = { x: cell.x + o.at.x, y: cell.y + o.at.y, w: o.at.w, h: o.at.h }; return o;
  }
  // An SVG sheet: each picture cut out of the drawing itself (exact, not traced). The SVG keeps only the shapes that
  // reach into the picture's box, leaves out the sheet's background (shapes covering half the sheet or more), and its
  // viewBox is the box. `at` is the box in the pixels of the picture the sheet was drawn as (W × H).
  function svgCut(src, at) {
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-100000px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none';
    host.innerHTML = src.text; const root = host.querySelector('svg'); document.body.append(host);
    try {
      const vb = src.vb, kx = vb.w / src.W, ky = vb.h / src.H, ux = vb.x + at.x * kx, uy = vb.y + at.y * ky, uw = at.w * kx, uh = at.h * ky, big = vb.w * vb.h * 0.5;
      root.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); root.setAttribute('width', src.W); root.setAttribute('height', src.H); root.setAttribute('preserveAspectRatio', 'none');
      const toRoot = root.getScreenCTM().inverse(), gone = [];
      for (const e of root.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text, image, use')) {
        if (e.parentElement.closest('defs, clipPath, mask, pattern, symbol, marker')) continue;
        let b; try { b = e.getBBox(); } catch (err) { continue; } const sm = e.getScreenCTM(); if (!sm) continue; const m = toRoot.multiply(sm);
        const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
        const X0 = Math.min(...pts.map((q) => q[0])), X1 = Math.max(...pts.map((q) => q[0])), Y0 = Math.min(...pts.map((q) => q[1])), Y1 = Math.max(...pts.map((q) => q[1]));
        const meets = X1 >= ux && X0 <= ux + uw && Y1 >= uy && Y0 <= uy + uh; if (!meets || (X1 - X0) * (Y1 - Y0) >= big) gone.push(e);
      }
      gone.forEach((e) => e.remove());
      root.setAttribute('viewBox', `${+ux.toFixed(3)} ${+uy.toFixed(3)} ${+uw.toFixed(3)} ${+uh.toFixed(3)}`); root.setAttribute('width', at.w); root.setAttribute('height', at.h); root.removeAttribute('preserveAspectRatio');
      return new XMLSerializer().serializeToString(root);
    } finally { host.remove(); }
  }

  // ------------------------------------------------------------------ the slicer window
  const S = { mode: 'find', gap: 0, min: 0.2, pad: 6, see: true, rows: 3, cols: 3, inset: 0, cut: true, names: '', category: '', svg: true };
  try { Object.assign(S, JSON.parse(localStorage.getItem('clipartcraft-slicer') || '{}'), { names: '', category: '' }); } catch (e) { /* blocked storage */ }
  const keep = () => { try { const { names, category, ...rest } = S; localStorage.setItem('clipartcraft-slicer', JSON.stringify(rest)); } catch (e) { /* blocked */ } };
  let sheetFile = null, sheet = null, sheetName = '', found = null, boxes = [], skip = new Set(), el = null, timer = 0, opts = {};
  const nameList = () => String(S.names || '').split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  const safe = (s) => s.replace(/[\\/:*?"<>|]+/g, '-').trim();

  // an SVG sheet is drawn as a picture (its longer side at least 2,000 pixels) to find the pictures; its text is kept
  let svgSheet = null;
  async function readSheet(file) {
    svgSheet = null;
    if (/\.svg$/i.test(file.name) || file.type === 'image/svg+xml') {
      const text = await file.text(), doc = new DOMParser().parseFromString(text, 'image/svg+xml'), root = doc.documentElement; if (root.nodeName !== 'svg') throw new Error('Not an SVG');
      let v = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number); if (v.length !== 4 || v.some((n) => !isFinite(n)) || !v[2] || !v[3]) v = [0, 0, parseFloat(root.getAttribute('width')) || 1000, parseFloat(root.getAttribute('height')) || 1000];
      const k = Math.min(4000, Math.max(2000, v[2], v[3])) / Math.max(v[2], v[3]), W = Math.round(v[2] * k), H = Math.round(v[3] * k);
      root.setAttribute('viewBox', v.join(' ')); root.setAttribute('width', W); root.setAttribute('height', H); root.setAttribute('preserveAspectRatio', 'none');
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' }));
      try { const i = new Image(); i.src = url; await i.decode(); const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0, W, H); svgSheet = { text, vb: { x: v[0], y: v[1], w: v[2], h: v[3] }, W, H }; return x.getImageData(0, 0, W, H); } finally { URL.revokeObjectURL(url); }
    }
    const url = URL.createObjectURL(file); try { const i = new Image(); i.src = url; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const k = c.getContext('2d', { willReadFrequently: true }); k.drawImage(i, 0, 0); return k.getImageData(0, 0, c.width, c.height); } finally { URL.revokeObjectURL(url); }
  }
  function field(label, html) { return `<label class="field"><span>${label}</span>${html}</label>`; }
  const num = (k, min, max, step = 1) => `<input class="input" type="number" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${S[k]}">`;
  const chk = (k, label) => `<label class="check"><input type="checkbox" data-k="${k}" ${S[k] ? 'checked' : ''}> ${label}</label>`;
  function panel() {
    const cats = (opts.categories || []).map((c) => `<option value="${esc(c)}">`).join('');
    return `<div class="props-head">Montage Slicer</div><div class="sec">
      ${sheet ? '' : '<p class="hint">Choose a sheet of clip art (a montage) to slice.</p>'}
      <button class="btn outline" type="button" data-sl="open">${sheet ? 'Another sheet…' : 'Choose a sheet…'}</button>
      <div class="field"><span>How to cut</span><div class="seg" role="group"><button class="btn" type="button" data-mode="find" aria-pressed="${S.mode === 'find'}">Find the pictures</button><button class="btn" type="button" data-mode="grid" aria-pressed="${S.mode === 'grid'}">Grid</button></div></div>
      ${S.mode === 'find' ? `<p class="hint">For pictures with space round them on a plain or old-paper background.</p>
        ${field('Join parts closer than (pixels; 0 = automatic)', num('gap', 0, 200))}
        ${field('Smallest picture (% of the sheet)', num('min', 0, 10, 0.05))}
        ${field('Room round each (pixels)', num('pad', 0, 80))}
        ${chk('see', 'See-through background, clean edges')}`
      : `<p class="hint">For montages whose pictures sit in equal cells, even touching.</p>
        <div class="two">${field('Rows', num('rows', 1, 30))}${field('Columns', num('cols', 1, 30))}</div>
        ${field('Trim off each cell’s edge (pixels: borders, gutters)', num('inset', 0, 200))}
        ${chk('cut', 'Cut each picture out of its cell (see-through)')}
        ${S.cut ? field('Room round each (pixels)', num('pad', 0, 80)) : ''}`}
      <div class="field"><span>Names, in order <small class="hint">(one per line or with commas)</small></span><textarea class="input" rows="4" data-k="names" placeholder="Barn, Bible, Buffalo…">${esc(S.names)}</textarea></div>
      ${field('Category', `<input class="input" data-k="category" list="sl-cats" value="${esc(S.category)}" placeholder="${esc(sheetName || 'Americana, Buildings…')}"><datalist id="sl-cats">${cats}</datalist>`)}
      <p class="hint">Each picture is added as PNG and SVG: ${svgSheet ? 'this sheet is an SVG, so each is cut out of the drawing itself' : 'the SVG is traced from the picture'}.</p>
      <p class="hint" id="sl-count"></p>
      <button class="btn primary wide" type="button" data-sl="add" ${sheet ? '' : 'disabled'}>Add to the library</button>
      <p class="hint">Click a box on the sheet to leave that picture out (or put it back).</p></div>`;
  }
  function renderPanel() { el.querySelector('.sl-side').innerHTML = panel(); count(); }
  function count() { const c = el.querySelector('#sl-count'); if (!c) return; const n = boxes.length - skip.size; c.innerHTML = sheet ? `<b>${n}</b> picture${n === 1 ? '' : 's'} to add${skip.size ? ` (${skip.size} left out)` : ''}.` : ''; const a = el.querySelector('[data-sl=add]'); if (a) { a.disabled = !n; a.textContent = n ? `Add ${n} to the library` : 'Add to the library'; } }
  function find() {
    if (!sheet) return;
    if (S.mode === 'find') { found = splitSheet(sheet, { gap: +S.gap, min: S.min / 100 }); boxes = found.items.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, item: b })); }
    else { found = null; boxes = gridCells(sheet, { rows: Math.max(1, +S.rows | 0), cols: Math.max(1, +S.cols | 0), inset: +S.inset }); }
    skip = new Set([...skip].filter((i) => i < boxes.length)); draw(); count();
  }
  function draw() {
    const c = el.querySelector('canvas'); if (!sheet) { c.hidden = true; return; } c.hidden = false; c.width = sheet.width; c.height = sheet.height;
    const x = c.getContext('2d'), names = nameList(), big = Math.max(sheet.width, sheet.height), lw = Math.max(2, Math.round(big / 400)), fs = Math.max(12, Math.round(big / 60)), pad = S.mode === 'find' || S.cut ? +S.pad : 0;
    x.putImageData(sheet, 0, 0); x.lineWidth = lw; x.font = `700 ${fs}px system-ui, sans-serif`; x.textBaseline = 'top';
    let n = 0;
    boxes.forEach((b, i) => {
      const off = skip.has(i), p = S.mode === 'find' ? pad : 0, bx = b.x - p, by = b.y - p, bw = b.w + p * 2, bh = b.h + p * 2;
      if (off) { x.fillStyle = 'rgba(30,30,40,.55)'; x.fillRect(bx, by, bw, bh); }
      x.strokeStyle = off ? '#8a8fa3' : '#e63946'; x.setLineDash(off ? [lw * 3, lw * 2] : []); x.strokeRect(bx, by, bw, bh); x.setLineDash([]);
      const label = off ? '✕' : `${++n}${names[n - 1] ? ' ' + names[n - 1] : ''}`, tw = x.measureText(label).width, ly = by - fs - 6 >= 0 ? by - fs - 6 : by;
      x.fillStyle = off ? '#8a8fa3' : '#e63946'; x.fillRect(bx, ly, tw + 10, fs + 6); x.fillStyle = '#fff'; x.fillText(label, bx + 5, ly + 3);
    });
  }
  const later = (ms = 200) => { clearTimeout(timer); timer = setTimeout(find, ms); };
  async function cuts(onStep) {
    const names = nameList(), base = !sheetName ? 'Clip art' : /^\d+$/.test(sheetName) ? `Sheet ${sheetName}` : sheetName, seen = {}, out = []; let n = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (skip.has(i)) continue; const b = boxes[i]; n++;
      let nm = safe(names[n - 1] || `${base} – ${n}`) || `${base} – ${n}`; seen[nm] = (seen[nm] || 0) + 1; if (seen[nm] > 1) nm += ` ${seen[nm]}`;
      onStep(n, nm); await wait(0);
      const img = S.mode === 'find' ? sheetItem(sheet, found, b.item, { pad: +S.pad, see: S.see }) : gridItem(sheet, b, { cut: S.cut, pad: +S.pad });
      const png = await new Promise((r) => canvasOf(img).toBlob(r, 'image/png')); let svg = null;
      if (svgSheet && img.at) { try { svg = svgCut(svgSheet, img.at); } catch (e) { console.warn('Cutting the SVG failed', nm, e); } }
      if (!svg && window.CRAFT_RASTERTRACE) { try { svg = CRAFT_RASTERTRACE.traceImage(img, { profile: 'icon' }).svg; } catch (e) { console.warn('Tracing failed', nm, e); } }
      out.push({ name: nm, png, svg, img });
    }
    return out;
  }
  async function addAll() {
    const btn = el.querySelector('[data-sl=add]'), total = boxes.length - skip.size, category = String(S.category || '').trim() || sheetName;
    btn.disabled = true;
    try {
      const made = [];
      for (const c of await cuts((n, nm) => { btn.textContent = `Adding ${n} of ${total}: ${nm}…`; })) made.push(await L.put(await L.makeItem({ name: c.name, category, png: c.png, svg: c.svg, source: 'Montage Slicer: ' + sheetName })));
      close(); opts.done && opts.done(made, category, sheetFile);
    } catch (e) { console.error(e); opts.toast && opts.toast('Slicing failed: ' + (e.message || e)); count(); btn.disabled = false; }
  }
  async function load(file) {
    if (!file) return; try { sheet = await readSheet(file); } catch (e) { opts.toast && opts.toast('That picture could not be read.'); return; }
    sheetFile = file; sheetName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(); skip.clear(); S.names = ''; S.category = ''; el.querySelector('.sl-empty').hidden = true; renderPanel(); find();
  }
  function pickSheet() { return new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.svg'; i.onchange = () => ok(i.files[0]); i.click(); }); }
  function build() {
    el = document.createElement('div'); el.className = 'slicer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Montage Slicer');
    el.innerHTML = `<div class="sl-bar"><b>Montage Slicer</b><span class="hint">Cut a sheet of clip art into separate pictures for the library</span><span class="grow"></span><button class="btn outline" type="button" data-sl="close">Close</button></div>
      <div class="sl-main"><div class="sl-desk"><canvas hidden></canvas><div class="sl-empty"><button class="btn primary" type="button" data-sl="open">Choose a sheet…</button><p class="hint">or drop a picture here</p></div></div><aside class="sl-side side right"></aside></div>`;
    el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-sl]'), m = e.target.closest('[data-mode]');
      if (a && a.dataset.sl === 'close') return close();
      if (a && a.dataset.sl === 'open') return load(await pickSheet());
      if (a && a.dataset.sl === 'add') return addAll();
      if (m) { S.mode = m.dataset.mode; keep(); skip.clear(); renderPanel(); find(); return; }
      if (e.target.tagName === 'CANVAS') { const r = e.target.getBoundingClientRect(), k = sheet.width / r.width, px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k, p = S.mode === 'find' ? +S.pad : 0;
        const i = boxes.findIndex((b) => px >= b.x - p && px <= b.x + b.w + p && py >= b.y - p && py <= b.y + b.h + p); if (i >= 0) { if (skip.has(i)) skip.delete(i); else skip.add(i); draw(); count(); } }
    });
    el.addEventListener('input', (e) => { const k = e.target.dataset.k; if (!k) return; S[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? +e.target.value : e.target.value; keep();
      if (k === 'names') draw(); else if (k === 'cut') { renderPanel(); later(0); } else if (k !== 'category' && k !== 'svg') later(); });
    el.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    el.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); const f = [...e.dataTransfer.files].find((x) => /^image\//.test(x.type)); if (f) load(f); });
    el.addEventListener('dragenter', (e) => e.stopPropagation()); el.addEventListener('dragleave', (e) => e.stopPropagation());
    document.body.append(el);
  }
  function onKey(e) { if (e.key === 'Escape' && el && !el.hidden) close(); }
  function open(o = {}) {
    opts = o; if (!el) { build(); document.addEventListener('keydown', onKey); } el.hidden = false; renderPanel(); el.querySelector('.sl-empty').hidden = !!sheet; if (o.file) load(o.file); else if (sheet) find();
  }
  function close() { if (el) el.hidden = true; }
  window.ClipArtSlicer = { open, close, splitSheet, sheetItem, gridCells, gridItem, svgCut, readSheet, state: () => ({ mode: S.mode, boxes: boxes.length, skipped: skip.size }) };
})();
