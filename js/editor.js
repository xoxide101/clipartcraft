/* ClipArtCraft – Touch up (window.ClipArtEditor): one picture from the library made right by hand, with the same shapes
   as the Montage Slicer's touch-up (box, ellipse, a Photoshop-style lasso; keep, erase, inside or outside), brushes, a
   magic wand and one-click clean-ups for what cutting leaves behind (specks, holes, halos, soft edges, a background
   colour). Restore brings parts back from the picture as it was opened, or from the sheet it was cut from (when the
   working area still has it). Save replaces the picture (the first version is kept, to go back to); Save as a copy
   keeps both. */
(function () {
  'use strict';
  const L = window.CraftClipart, esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const copy = (img) => { const o = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height); return o; };
  const canvasOf = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c; };
  async function imageOf(blob) { const b = await createImageBitmap(blob), c = document.createElement('canvas'); c.width = b.width; c.height = b.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(b, 0, 0); return x.getImageData(0, 0, c.width, c.height); }

  // ------------------------------------------------------------------ what the tools do to the picture
  const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  function maskOf(pts, W, H) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); x.fill(); const d = x.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H); for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0; return m; }
  // a shape's pixels (inside, or outside): erased, or restored from `from` (the picture as opened, or the sheet)
  function applyShape(img, pts, op, side, from) {
    const W = img.width, H = img.height, m = maskOf(pts, W, H), o = copy(img), d = o.data;
    for (let k = 0; k < W * H; k++) { if ((m[k] === 1) !== (side !== 'out')) continue; const i = k * 4;
      if (op === 'erase') d[i + 3] = 0; else if (from) { d[i] = from.data[i]; d[i + 1] = from.data[i + 1]; d[i + 2] = from.data[i + 2]; d[i + 3] = from.data[i + 3]; } }
    return o;
  }
  function brush(img, x0, y0, x1, y1, r, op, from) {
    const W = img.width, H = img.height, d = img.data, n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / Math.max(1, r / 3)));
    for (let s = 0; s <= n; s++) { const cx = x0 + ((x1 - x0) * s) / n, cy = y0 + ((y1 - y0) * s) / n;
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue; const i = (y * W + x) * 4;
        if (op === 'erase') d[i + 3] = 0; else if (from) { d[i] = from.data[i]; d[i + 1] = from.data[i + 1]; d[i + 2] = from.data[i + 2]; d[i + 3] = from.data[i + 3]; } } }
  }
  // the magic wand: everything joined to the clicked pixel of about its colour, made see-through
  function wand(img, x, y, tol) {
    const W = img.width, H = img.height, o = copy(img), d = o.data, k0 = (y * W + x) * 4, seed = [d[k0], d[k0 + 1], d[k0 + 2], d[k0 + 3]], seen = new Uint8Array(W * H), st = [y * W + x]; seen[y * W + x] = 1;
    while (st.length) { const k = st.pop(), i = k * 4, px = k % W, py = (k / W) | 0;
      if (Math.abs(d[i] - seed[0]) + Math.abs(d[i + 1] - seed[1]) + Math.abs(d[i + 2] - seed[2]) + Math.abs(d[i + 3] - seed[3]) > tol * 3) continue; d[i + 3] = 0;
      for (const n of [px > 0 ? k - 1 : -1, px < W - 1 ? k + 1 : -1, py > 0 ? k - W : -1, py < H - 1 ? k + W : -1]) if (n >= 0 && !seen[n]) { seen[n] = 1; st.push(n); } }
    return o;
  }
  // parts joined together (solid pixels, 8 ways): label and size of each
  function parts(img, solidAt = 24) {
    const W = img.width, H = img.height, d = img.data, lab = new Int32Array(W * H), sizes = [0], st = []; let n = 0;
    for (let s0 = 0; s0 < W * H; s0++) { if (lab[s0] || d[s0 * 4 + 3] < solidAt) continue; n++; let size = 0; st.push(s0); lab[s0] = n;
      while (st.length) { const k = st.pop(), x = k % W, y = (k / W) | 0; size++; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const q = ny * W + nx; if (!lab[q] && d[q * 4 + 3] >= solidAt) { lab[q] = n; st.push(q); } } }
      sizes.push(size); }
    return { lab, sizes };
  }
  // the clean-ups
  const CLEAN = {
    specks: { label: 'Remove specks', hint: 'Loose bits much smaller than the picture go', run(img, v) { const { lab, sizes } = parts(img), big = Math.max(...sizes), o = copy(img); for (let k = 0; k < lab.length; k++) if (lab[k] && sizes[lab[k]] < Math.max(v, big * 0.002)) o.data[k * 4 + 3] = 0; for (let k = 0; k < lab.length; k++) if (!lab[k] && o.data[k * 4 + 3] < 24) o.data[k * 4 + 3] = 0; return o; }, value: 30, unit: 'pixels or fewer' },
    holes: { label: 'Fill holes', hint: 'See-through holes inside the picture filled from the picture as opened (or the sheet)', run(img, v, from) { const W = img.width, H = img.height, d = img.data, out = new Uint8Array(W * H), st = [], o = copy(img); const push = (k) => { if (!out[k] && d[k * 4 + 3] < 24) { out[k] = 1; st.push(k); } };
      for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
      while (st.length) { const k = st.pop(), x = k % W, y = (k / W) | 0; if (x > 0) push(k - 1); if (x < W - 1) push(k + 1); if (y > 0) push(k - W); if (y < H - 1) push(k + W); }
      // a hole: see-through, not reached from outside, and not bigger than the setting (a real gap, like between arms, stays)
      const hole = new Uint8Array(W * H), seen = new Uint8Array(W * H); for (let s0 = 0; s0 < W * H; s0++) { if (out[s0] || seen[s0] || d[s0 * 4 + 3] >= 24) continue; const group = [], q = [s0]; seen[s0] = 1;
        while (q.length) { const k = q.pop(); group.push(k); const x = k % W, y = (k / W) | 0; for (const n of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1]) if (n >= 0 && !seen[n] && !out[n] && d[n * 4 + 3] < 24) { seen[n] = 1; q.push(n); } }
        if (group.length <= W * H * (v / 100)) for (const k of group) hole[k] = 1; }
      for (let k = 0; k < W * H; k++) if (hole[k]) { const i = k * 4; if (from && from.data[i + 3] > 24) { o.data[i] = from.data[i]; o.data[i + 1] = from.data[i + 1]; o.data[i + 2] = from.data[i + 2]; o.data[i + 3] = from.data[i + 3]; } else { let r = 0, g = 0, b = 0, n = 0; const x = k % W, y = (k / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = (ny * W + nx) * 4; if (d[j + 3] > 128) { r += d[j]; g += d[j + 1]; b += d[j + 2]; n++; } } if (n) { o.data[i] = r / n; o.data[i + 1] = g / n; o.data[i + 2] = b / n; o.data[i + 3] = 255; } } }
      return o; }, value: 2, unit: '% of the picture at most' },
    halo: { label: 'Clean edges', hint: 'The pale (or dark) rim the old background left round the edge is taken off', run(img, v) { const W = img.width, H = img.height, d = img.data, o = copy(img), clear = (x, y) => x < 0 || y < 0 || x >= W || y >= H || d[(y * W + x) * 4 + 3] < 24;
      for (let r = 0; r < v; r++) { const cur = copy(o); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (cur.data[i + 3] < 24) continue; const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx < 0 || ny < 0 || nx >= W || ny >= H || cur.data[(ny * W + nx) * 4 + 3] < 24; }); if (edge) o.data[i + 3] = 0; } }
      return o; }, value: 1, unit: 'pixels off the edge' },
    hard: { label: 'Hard edges', hint: 'Half see-through pixels made solid or clear (crisp for pixel art and cutting machines)', run(img, v) { const o = copy(img); for (let i = 3; i < o.data.length; i += 4) o.data[i] = o.data[i] >= v ? 255 : 0; return o; }, value: 128, unit: 'how solid counts as solid (0–255)' },
    bg: { label: 'Take the background colour away', hint: 'The colour of the corners, reached from the edges, made see-through', run(img, v) { const W = img.width, H = img.height, d = img.data, o = copy(img), cs = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => (y * W + x) * 4).filter((i) => d[i + 3] > 128);
      if (!cs.length) return o; const bg = [0, 1, 2].map((c) => cs.reduce((a, i) => a + d[i + c], 0) / cs.length), seen = new Uint8Array(W * H), st = [];
      const near = (k) => { const i = k * 4; return d[i + 3] < 24 || Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) <= v; }, push = (k) => { if (!seen[k] && near(k)) { seen[k] = 1; st.push(k); } };
      for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
      while (st.length) { const k = st.pop(), x = k % W, y = (k / W) | 0; o.data[k * 4 + 3] = 0; if (x > 0) push(k - 1); if (x < W - 1) push(k + 1); if (y > 0) push(k - W); if (y < H - 1) push(k + W); }
      return o; }, value: 30, unit: 'how close counts as background' },
    trim: { label: 'Trim', hint: 'The see-through margin cut off (a little room kept)', run(img, v) { const W = img.width, H = img.height, d = img.data; let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] >= 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return img; x0 = Math.max(0, x0 - v); y0 = Math.max(0, y0 - v); x1 = Math.min(W - 1, x1 + v); y1 = Math.min(H - 1, y1 + v); const o = new ImageData(x1 - x0 + 1, y1 - y0 + 1); for (let y = y0; y <= y1; y++) o.data.set(d.subarray((y * W + x0) * 4, (y * W + x1 + 1) * 4), (y - y0) * o.width * 4); o.shift = { x: x0, y: y0 }; return o; }, value: 2, unit: 'pixels of room' },
  };

  // ------------------------------------------------------------------ the window
  // cur.off: where the picture now starts, in the pixels of the picture as opened (a trim moves it); sheetFull: its whole
  // sheet (when the working area has it), with item.cutAt saying where the picture as opened sat on it
  let el = null, item = null, cur = null, orig = null, sheetFull = null, past = [], future = [], opts = {}, zoom = 1, bgView = 'check';
  const offOf = (img) => img.off || { x: 0, y: 0 };
  const crop = (img, x, y, w, h) => { const o = new ImageData(w, h); for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const sx = x + xx, sy = y + yy; if (sx < 0 || sy < 0 || sx >= img.width || sy >= img.height) continue; const i = (sy * img.width + sx) * 4, k = (yy * w + xx) * 4; o.data[k] = img.data[i]; o.data[k + 1] = img.data[i + 1]; o.data[k + 2] = img.data[i + 2]; o.data[k + 3] = img.data[i + 3]; } return o; };
  const T = { tool: 'shape', shape: 'lasso', op: 'erase', side: 'in', from: 'opened', size: 8, tol: 30 };
  try { Object.assign(T, JSON.parse(localStorage.getItem('clipartcraft-editor') || '{}')); } catch (e) { /* blocked */ }
  const keepT = () => { try { localStorage.setItem('clipartcraft-editor', JSON.stringify(T)); } catch (e) { /* blocked */ } };
  // where Restore takes its pixels from, lined up with the picture as it is now
  const fromImg = () => { const o = offOf(cur); return T.from === 'sheet' && sheetFull && item.cutAt ? crop(sheetFull, item.cutAt.x + o.x, item.cutAt.y + o.y, cur.width, cur.height) : crop(orig, o.x, o.y, cur.width, cur.height); };
  const sheetPart = () => !!(sheetFull && item && item.cutAt);
  function change(next) { past.push(cur); if (past.length > 50) past.shift(); future = []; const o = offOf(cur); next.off = next.shift ? { x: o.x + next.shift.x, y: o.y + next.shift.y } : next.off || o; cur = next; draw(); status(); }
  function undo() { if (!past.length) return; future.push(cur); cur = past.pop(); draw(); status(); }
  function redo() { if (!future.length) return; past.push(cur); cur = future.pop(); draw(); status(); }
  const toast = (m) => opts.toast && opts.toast(m);
  const BGS = { check: 'repeating-conic-gradient(#c9ccd6 0 25%, #f4f5f8 0 50%) 0 0 / 16px 16px', white: '#fff', black: '#000', grey: '#808080', dark: 'repeating-conic-gradient(#2b2d36 0 25%, #22242c 0 50%) 0 0 / 16px 16px' };
  function draw() { if (!el || !cur) return; const c = el.querySelector('.ed-canvas'); c.width = cur.width; c.height = cur.height; c.getContext('2d').putImageData(cur, 0, 0); c.style.background = BGS[bgView]; applyZoom(); undoButtons(); }
  function undoButtons() { el.querySelectorAll('[data-hist=undo]').forEach((b) => { b.disabled = !past.length; }); el.querySelectorAll('[data-hist=redo]').forEach((b) => { b.disabled = !future.length; }); }
  function status() { const s = el.querySelector('.sl-status'); if (!s || !cur) return; let solid = 0; for (let i = 3; i < cur.data.length; i += 4) if (cur.data[i] >= 24) solid++;
    s.innerHTML = `<span><b>${esc(item.name)}</b></span><span>${cur.width} × ${cur.height} px</span><span>${Math.round((100 * solid) / (cur.width * cur.height))}% picture, the rest see-through</span><span>${sheetPart() ? 'its sheet is in the working area: Restore can bring parts back from it' : 'Restore brings back the picture as it was opened'}</span><span class="grow"></span><span>zoom ${Math.round(fitScale() * zoom * 100)}%</span>`; }
  const desk = () => el.querySelector('.sl-desk');
  function fitScale() { const d = desk(); return cur ? Math.min((d.clientWidth - 40) / cur.width, (d.clientHeight - 40) / cur.height, 8) : 1; }
  function applyZoom(at) { const c = el.querySelector('.ed-canvas'), d = desk(), before = c.getBoundingClientRect(), k = fitScale() * zoom; c.style.width = `${cur.width * k}px`; c.style.height = `${cur.height * k}px`; c.style.imageRendering = k > 2 ? 'pixelated' : 'auto';
    if (at && before.width) { const fx = (at.x - before.left) / before.width, fy = (at.y - before.top) / before.height, r = c.getBoundingClientRect(); d.scrollLeft += r.left + fx * r.width - at.x; d.scrollTop += r.top + fy * r.height - at.y; }
    const z = el.querySelector('.sl-zoom'); if (z) z.textContent = zoom === 1 ? 'Fit' : `${Math.round(k * 100)}%`; }
  const setZoom = (z, at) => { zoom = Math.max(0.2, Math.min(60, z)); applyZoom(at); status(); };

  function panel() {
    const seg = (k, list) => `<div class="seg" role="group">${list.map(([v, l]) => `<button class="btn" type="button" data-t="${k}:${v}" aria-pressed="${T[k] === v}">${l}</button>`).join('')}</div>`;
    return `<div class="props-head">Touch up</div><div class="sec">
      <div class="btns hist-row"><button class="btn outline sm" type="button" data-hist="undo" ${past.length ? '' : 'disabled'}>↶ Undo</button><button class="btn outline sm" type="button" data-hist="redo" ${future.length ? '' : 'disabled'}>↷ Redo</button></div>
      <div class="field"><span>Tool</span>${seg('tool', [['shape', 'Shape'], ['brush', 'Brush'], ['wand', 'Magic wand']])}</div>
      ${T.tool === 'shape' ? `<div class="touch-opts"><div class="field"><span>Shape</span>${seg('shape', [['box', 'Box'], ['ellipse', 'Ellipse'], ['lasso', 'Lasso']])}</div>
        <div class="field"><span>Do</span>${seg('op', [['erase', 'Erase'], ['keep', 'Restore']])}</div><div class="field"><span>Where</span>${seg('side', [['in', 'Inside'], ['out', 'Outside']])}</div></div>
        <p class="hint">${T.shape === 'lasso' ? 'Drag to draw freehand, or click (Shift-click) for straight corners; close on the first corner, a double-click or Enter. Backspace takes a corner off, Escape gives it up.' : 'Drag the shape over the part.'} Erase outside = keep only what you drew round.</p>`
      : T.tool === 'brush' ? `<div class="touch-opts"><div class="field"><span>Do</span>${seg('op', [['erase', 'Erase'], ['keep', 'Restore']])}</div><label class="field"><span>Size (pixels across)</span><input class="input" type="number" min="1" max="200" data-n="size" value="${T.size}"></label></div><p class="hint">Paint over the part. Alt: the other way (erase ⇄ restore).</p>`
      : `<div class="touch-opts"><label class="field"><span>How close a colour counts</span><input class="input" type="number" min="1" max="200" data-n="tol" value="${T.tol}"></label></div><p class="hint">Click a patch to make it and everything joined to it of about that colour see-through.</p>`}
      ${T.op === 'keep' && T.tool !== 'wand' ? `<div class="field"><span>Restore from</span>${seg('from', [['opened', 'The picture as opened'], ...(sheetPart() ? [['sheet', 'Its sheet']] : [])])}</div>` : ''}
      <div class="field"><span>Clean up <small class="hint">(the whole picture, one click each)</small></span><div class="ed-clean">${Object.entries(CLEAN).map(([k, c]) => `<div class="ed-crow"><button class="btn outline sm" type="button" data-clean="${k}" title="${esc(c.hint)}">${c.label}</button><input class="input" type="number" data-cv="${k}" value="${T['cv_' + k] ?? c.value}" title="${esc(c.unit)}"><small class="hint">${esc(c.unit)}</small></div>`).join('')}</div></div>
      <div class="field"><span>Background to look against</span>${(() => `<div class="seg" role="group">${[['check', 'Checks'], ['dark', 'Dark'], ['white', 'White'], ['grey', 'Grey'], ['black', 'Black']].map(([v, l]) => `<button class="btn" type="button" data-bg="${v}" aria-pressed="${bgView === v}">${l}</button>`).join('')}</div>`)()}<small class="hint">Specks and halos show up best against the opposite of the picture.</small></div>
      <div class="btns"><button class="btn primary" type="button" data-ed="save">Save</button><button class="btn outline" type="button" data-ed="copy">Save as a copy</button>${item && item.pngFirst ? '<button class="btn ghost" type="button" data-ed="first">Back to the original</button>' : ''}</div>
      <p class="hint">Save replaces the picture in the library (its SVG is traced again); its very first version is kept, to go back to.</p></div>`;
  }
  function renderPanel() { el.querySelector('.sl-side').innerHTML = panel(); undoButtons(); }

  // drawing on the picture
  let drag = null, poly = null;
  const ptOf = (e) => { const c = el.querySelector('.ed-canvas'), r = c.getBoundingClientRect(), k = cur.width / r.width; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, k, r }; };
  function preview(pts) { let v = el.querySelector('.sl-lasso'); if (!pts) { if (v) v.remove(); return; } const r = el.querySelector('.ed-canvas').getBoundingClientRect(), k = cur.width / r.width;
    if (!v) { v = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); v.setAttribute('class', 'sl-lasso'); v.innerHTML = '<polygon/>'; el.append(v); } v.dataset.op = T.op === 'keep' ? 'keep' : 'erase';
    v.querySelector('polygon').setAttribute('points', pts.map(([x, y]) => `${(r.left + x / k).toFixed(1)},${(r.top + y / k).toFixed(1)}`).join(' ')); }
  const shapePts = (a, b) => { const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    return T.shape === 'ellipse' ? Array.from({ length: 48 }, (_, i) => { const t = (i / 48) * Math.PI * 2; return [x0 + w / 2 + (Math.cos(t) * w) / 2, y0 + h / 2 + (Math.sin(t) * h) / 2]; }) : [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]]; };
  function closePoly(alt) { if (!poly) return; const pts = poly.pts; poly = null; preview(null); if (pts.length < 3) return; change(applyShape(cur, pts, alt ? 'erase' : T.op, T.side, fromImg())); }
  function onDown(e) {
    if (e.button !== 0 || !cur) return; const p = ptOf(e); e.preventDefault(); e.target.setPointerCapture(e.pointerId);
    if (T.tool === 'wand') { const x = Math.floor(p.x), y = Math.floor(p.y); if (x >= 0 && y >= 0 && x < cur.width && y < cur.height) change(wand(cur, x, y, +T.tol || 30)); return; }
    if (T.tool === 'brush') { past.push(cur); if (past.length > 50) past.shift(); future = []; { const o = offOf(cur); cur = copy(cur); cur.off = o; } drag = { brush: true, last: p, op: e.altKey ? (T.op === 'erase' ? 'keep' : 'erase') : T.op }; brush(cur, p.x, p.y, p.x, p.y, (+T.size || 8) / 2, drag.op, fromImg()); draw(); return; }
    if (T.shape === 'lasso') { if (poly && poly.pts.length >= 3 && Math.hypot(p.x - poly.pts[0][0], p.y - poly.pts[0][1]) <= 10 * p.k) { closePoly(e.altKey); return; } if (!poly) poly = { pts: [[p.x, p.y]], free: null }; else poly.pts.push([p.x, p.y]); drag = { lasso: true, p0: p, moved: false }; return; }
    drag = { p0: p, moved: false };
  }
  function onMove(e) {
    if (!cur) return; const p = ptOf(e);
    if (!drag) { if (poly) preview([...poly.pts, [p.x, p.y]]); return; }
    if (drag.brush) { brush(cur, drag.last.x, drag.last.y, p.x, p.y, (+T.size || 8) / 2, drag.op, fromImg()); drag.last = p; draw(); return; }
    if (!drag.moved && Math.hypot(p.x - drag.p0.x, p.y - drag.p0.y) < 3 * p.k) return; drag.moved = true;
    if (drag.lasso) { if (poly.free === null) poly.free = poly.pts.length === 1; const l = poly.pts[poly.pts.length - 1]; if (Math.hypot(p.x - l[0], p.y - l[1]) > 2 * p.k) poly.pts.push([p.x, p.y]); preview(poly.pts); return; }
    preview(shapePts(drag.p0, p));
  }
  function onUp(e) {
    if (!drag) return; const d = drag; drag = null; const p = ptOf(e);
    if (d.brush) { status(); undoButtons(); return; }
    if (d.lasso) { if (poly && poly.free && d.moved) closePoly(e.altKey); else if (poly && !d.moved && poly.free === null) poly.free = false; return; }
    preview(null); if (!d.moved) return; const pts = shapePts(d.p0, p); if (Math.abs(p.x - d.p0.x) < 2 || Math.abs(p.y - d.p0.y) < 2) return; change(applyShape(cur, pts, e.altKey ? 'erase' : T.op, T.side, fromImg()));
  }

  async function save(asCopy) {
    const btns = el.querySelectorAll('[data-ed]'); btns.forEach((b) => { b.disabled = true; });
    try {
      const png = await new Promise((ok) => canvasOf(cur).toBlob(ok, 'image/png')); let svg = null;
      if (window.CRAFT_RASTERTRACE) { try { svg = CRAFT_RASTERTRACE.traceImage(cur, { profile: 'icon' }).svg; } catch (e) { console.warn('Tracing failed', e); } }
      const fresh = await L.makeItem({ name: item.name, png, svg });
      if (asCopy) { const o = offOf(cur), it = { ...item, ...fresh, id: fresh.id, cutAt: item.cutAt ? { x: item.cutAt.x + o.x, y: item.cutAt.y + o.y, w: cur.width, h: cur.height } : undefined, name: item.name, serverId: undefined, links: undefined, pngFirst: undefined, edited: new Date().toISOString() }; delete it.serverId; delete it.links; delete it.pngFirst; await L.put(it); toast(`Saved as a copy: “${it.name}”.`); }
      else { if (!item.pngFirst) { item.pngFirst = item.png; if (item.cutAt) item.cutAtFirst = item.cutAt; } if (item.cutAt) { const o = offOf(cur); item.cutAt = { x: item.cutAt.x + o.x, y: item.cutAt.y + o.y, w: cur.width, h: cur.height }; } Object.assign(item, { png, svg: svg || item.svg, thumb: fresh.thumb, width: fresh.width, height: fresh.height, edited: new Date().toISOString() }); if (item.serverId) item.changed = true; await L.put(item); toast(`Saved “${item.name}”.`); }
      close(); opts.done && opts.done();
    } catch (e) { console.error(e); toast('Saving failed: ' + (e.message || e)); btns.forEach((b) => { b.disabled = false; }); }
  }
  async function backToFirst() { if (!item.pngFirst) return; const first = await imageOf(item.pngFirst), a = item.cutAt, f = item.cutAtFirst; first.off = a && f ? { x: f.x - a.x, y: f.y - a.y } : { x: 0, y: 0 }; change(first); toast('Back to the very first version: Save to keep it.'); }

  function build() {
    el = document.createElement('div'); el.className = 'slicer editor'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Touch up');
    el.innerHTML = `<div class="sl-bar"><b>Touch up</b><span class="hint ed-name"></span><span class="grow"></span><button class="btn outline" type="button" data-ed="close">Close</button></div>
      <div class="sl-main"><div class="sl-left"><div class="imp-tools sl-tools" role="toolbar"><button class="btn outline" type="button" data-hist="undo" disabled title="Undo (Ctrl+Z)">↶ Undo</button><button class="btn outline" type="button" data-hist="redo" disabled title="Redo (Ctrl+Y)">↷ Redo</button><span class="sep"></span>
        <div class="seg" role="group"><button class="btn" type="button" data-z="out">−</button><button class="btn sl-zoom" type="button" data-z="fit">Fit</button><button class="btn" type="button" data-z="in">+</button></div><button class="btn outline" type="button" data-z="100">100%</button></div>
        <div class="sl-desk"><div class="sl-stage"><canvas class="ed-canvas"></canvas></div></div><div class="sl-status"></div></div><aside class="sl-side side right"></aside></div>`;
    const cv = el.querySelector('.ed-canvas'); cv.style.cursor = 'crosshair'; cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('dblclick', (e) => { if (poly) { poly.pts.pop(); closePoly(e.altKey); } });
    const d = el.querySelector('.sl-desk'); let pan = null;
    d.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(zoom * Math.pow(1.15, e.deltaY < 0 ? 1 : -1), { x: e.clientX, y: e.clientY }); }, { passive: false });
    d.addEventListener('pointerdown', (e) => { if (e.button !== 1) return; e.preventDefault(); pan = { x: e.clientX, y: e.clientY, l: d.scrollLeft, t: d.scrollTop }; d.setPointerCapture(e.pointerId); });
    d.addEventListener('pointermove', (e) => { if (pan) { d.scrollLeft = pan.l - (e.clientX - pan.x); d.scrollTop = pan.t - (e.clientY - pan.y); } });
    d.addEventListener('pointerup', () => { pan = null; }); d.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
    el.addEventListener('click', (e) => {
      const h = e.target.closest('[data-hist]'); if (h) { if (h.dataset.hist === 'undo') undo(); else redo(); return; }
      const z = e.target.closest('[data-z]'); if (z) { const v = z.dataset.z; if (v === 'fit') setZoom(1); else if (v === '100') setZoom(1 / fitScale()); else { const r = desk().getBoundingClientRect(); setZoom(zoom * (v === 'in' ? 1.25 : 0.8), { x: r.left + r.width / 2, y: r.top + r.height / 2 }); } return; }
      const t = e.target.closest('[data-t]'); if (t) { const [k, v] = t.dataset.t.split(':'); T[k] = v; keepT(); poly = null; preview(null); renderPanel(); return; }
      const b = e.target.closest('[data-bg]'); if (b) { bgView = b.dataset.bg; draw(); renderPanel(); return; }
      const c = e.target.closest('[data-clean]'); if (c) { const k = c.dataset.clean, v = +(el.querySelector(`[data-cv="${k}"]`).value) || CLEAN[k].value; T['cv_' + k] = v; keepT(); const out = CLEAN[k].run(cur, v, fromImg()); change(out); toast(`${CLEAN[k].label}: done (Undo takes it back).`); return; }
      const a = e.target.closest('[data-ed]'); if (!a) return; if (a.dataset.ed === 'close') { if (past.length && !confirm('Close without saving the changes?')) return; close(); return; }
      if (a.dataset.ed === 'save') return save(false); if (a.dataset.ed === 'copy') return save(true); if (a.dataset.ed === 'first') return backToFirst();
    });
    el.addEventListener('input', (e) => { const n = e.target.dataset.n; if (n) { T[n] = +e.target.value; keepT(); } });
    document.addEventListener('keydown', (e) => {
      if (!el || el.hidden) return; if (poly) { if (e.key === 'Enter') { e.preventDefault(); closePoly(e.altKey); return; } if (e.key === 'Escape') { e.preventDefault(); poly = null; preview(null); return; } if (e.key === 'Backspace') { e.preventDefault(); poly.pts.pop(); if (!poly.pts.length) { poly = null; preview(null); } return; } }
      if ((e.ctrlKey || e.metaKey) && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) { const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); } }
    });
    window.addEventListener('resize', () => { if (el && !el.hidden && cur) applyZoom(); });
    document.body.append(el);
  }
  // the picture's place on its sheet, from the working area (when the sheet is still there)
  async function sheetOf(it) {
    if (!it.cutAt || !it.sheet || !window.CraftWork) return null;
    try { const src = await window.CraftWork.get(it.sheet); return src ? await imageOf(window.CraftWork.fileOf(src)) : null; } catch (e) { return null; }
  }
  async function open(it, o = {}) {
    if (!it || !it.png) return o.toast && o.toast('Only pictures (PNG) can be touched up here.');
    opts = o; item = it; if (!el) build(); el.hidden = false; past = []; future = []; zoom = 1; poly = null;
    cur = await imageOf(it.png); cur.off = { x: 0, y: 0 }; orig = copy(cur); sheetFull = await sheetOf(it); if (!sheetPart() && T.from === 'sheet') T.from = 'opened';
    el.querySelector('.ed-name').textContent = it.name; renderPanel(); draw(); status(); const d = desk(); d.scrollLeft = d.scrollTop = 0;
  }
  function close() { if (el) el.hidden = true; poly = null; preview(null); }
  window.ClipArtEditor = { open, close, CLEAN, applyShape, wand, _state: () => ({ w: cur && cur.width, h: cur && cur.height, past: past.length, sheet: sheetPart(), off: cur ? offOf(cur) : null, solid: cur ? (() => { let n = 0; for (let i = 3; i < cur.data.length; i += 4) if (cur.data[i] >= 24) n++; return Math.round((100 * n) / (cur.width * cur.height)); })() : 0 }) };
})();
