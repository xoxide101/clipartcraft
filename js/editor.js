/* ClipArtCraft – Touch up (window.ClipArtEditor): one picture from the library made right by hand. Select a part (box,
   ellipse, a Photoshop-style lasso, or the magic wand; Shift adds to it, Alt takes away), then fill it with a colour,
   erase it, restore it or keep only it. The brush paints, erases or restores; Fill colours a patch (or one colour
   everywhere); the Eyedropper takes a colour from the picture, and the picture's own colours are offered as swatches.
   With a selection, every tool stays inside it. Copy, Cut and Paste (also pictures copied in other programs) and Text
   make a floating piece: drag it into place, then click off it or press Enter to put it down (Escape drops it). Your own
   colours can be added to the swatches.
   Layers (the picture, a background, pasted pieces, words, effects) can be hidden, faded, moved up and down, merged,
   and given a mask (what it hides, painted with the brushes or a gradient, so nothing is lost); Save flattens them.
   Background: removed by finding its edge (or by the AI cut-out), selected, completed (see-through gaps filled from
   round them), or a new one made behind the picture (a colour, a gradient, a pattern, or the picture's own edges
   carried out). Mend: a selected part filled from round it (Telea's method), or by the AI (MI-GAN). Effects: an
   outline, a shadow or a glow, each a layer under the picture. Vector: how the SVG is traced (detail, how many
   colours), shown before saving, and its colours changed one by one. The ribbon's Touch up tab (ui.js) drives the same tools through the API below. One-click clean-ups for what cutting leaves behind (specks, holes,
   halos, soft edges, a background colour). Restore brings parts back from the picture as it was opened, or from the sheet it was cut from (when the
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
  function brush(img, x0, y0, x1, y1, r, op, from, col, mask) {
    const W = img.width, H = img.height, d = img.data, n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / Math.max(1, r / 3)));
    for (let s = 0; s <= n; s++) { const cx = x0 + ((x1 - x0) * s) / n, cy = y0 + ((y1 - y0) * s) / n;
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r || (mask && !mask[y * W + x])) continue; const i = (y * W + x) * 4;
        if (op === 'erase') d[i + 3] = 0; else if (op === 'paint') { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; } else if (from) { d[i] = from.data[i]; d[i + 1] = from.data[i + 1]; d[i + 2] = from.data[i + 2]; d[i + 3] = from.data[i + 3]; } } }
  }
  // the magic wand: everything joined to the clicked pixel of about its colour, made see-through
  function wand(img, x, y, tol) {
    const W = img.width, H = img.height, o = copy(img), d = o.data, k0 = (y * W + x) * 4, seed = [d[k0], d[k0 + 1], d[k0 + 2], d[k0 + 3]], seen = new Uint8Array(W * H), st = [y * W + x]; seen[y * W + x] = 1;
    while (st.length) { const k = st.pop(), i = k * 4, px = k % W, py = (k / W) | 0;
      if (Math.abs(d[i] - seed[0]) + Math.abs(d[i + 1] - seed[1]) + Math.abs(d[i + 2] - seed[2]) + Math.abs(d[i + 3] - seed[3]) > tol * 3) continue; d[i + 3] = 0;
      for (const n of [px > 0 ? k - 1 : -1, px < W - 1 ? k + 1 : -1, py > 0 ? k - W : -1, py < H - 1 ? k + W : -1]) if (n >= 0 && !seen[n]) { seen[n] = 1; st.push(n); } }
    return o;
  }
  // the pixels of about the colour of (x, y): joined to it (4 ways), or anywhere in the picture
  function regionOf(img, x, y, tol, joined) {
    const W = img.width, H = img.height, d = img.data, k0 = (y * W + x) * 4, s0 = [d[k0], d[k0 + 1], d[k0 + 2], d[k0 + 3]], m = new Uint8Array(W * H);
    const near = (k) => { const i = k * 4; return (s0[3] < 24 && d[i + 3] < 24) || Math.abs(d[i] - s0[0]) + Math.abs(d[i + 1] - s0[1]) + Math.abs(d[i + 2] - s0[2]) + Math.abs(d[i + 3] - s0[3]) <= tol * 3; };
    if (!joined) { for (let k = 0; k < W * H; k++) if (near(k)) m[k] = 1; return m; }
    const st = [y * W + x]; m[y * W + x] = 1;
    while (st.length) { const k = st.pop(), px = k % W, py = (k / W) | 0; for (const n of [px > 0 ? k - 1 : -1, px < W - 1 ? k + 1 : -1, py > 0 ? k - W : -1, py < H - 1 ? k + W : -1]) if (n >= 0 && !m[n] && near(n)) { m[n] = 1; st.push(n); } }
    return m;
  }
  // the marked pixels: erased, painted in a colour, or restored from `from`
  function applyMask(img, m, op, from, col) {
    const o = copy(img), d = o.data;
    for (let k = 0; k < m.length; k++) { if (!m[k]) continue; const i = k * 4;
      if (op === 'erase') d[i + 3] = 0; else if (op === 'paint') { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; } else if (from) { d[i] = from.data[i]; d[i + 1] = from.data[i + 1]; d[i + 2] = from.data[i + 2]; d[i + 3] = from.data[i + 3]; } }
    return o;
  }
  const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
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
  const T = { tool: 'select', shape: 'lasso', mode: 'new', op: 'paint', from: 'opened', size: 8, tol: 30, joined: true, col: '#e8483f', font: 'Arial', fsize: 32, bold: false, mine: [], col2: '#3f8be8', gshape: 'linear', gsrc: 'picture', fx: 6, bgStyle: 'gradient', bgStep: 12, vprofile: 'icon', vcolors: 0 };
  try { Object.assign(T, JSON.parse(localStorage.getItem('clipartcraft-editor') || '{}')); } catch (e) { /* blocked */ }
  // (the tools before selections: shapes and the wand erased straight away)
  if (T.tool === 'shape') T.tool = 'select'; if (T.tool === 'wand') { T.tool = 'select'; T.shape = 'wand'; } if (!['select', 'brush', 'fill', 'gradient', 'pick', 'text'].includes(T.tool)) T.tool = 'select';
  // the selection: 1 for each chosen pixel (null: none), and how it is shown (a light blue with a black and white edge)
  let sel = null, selView = null;
  function setSel(m, mode = 'new') {
    if (m && sel && mode !== 'new') { const o = new Uint8Array(sel); for (let k = 0; k < o.length; k++) o[k] = mode === 'add' ? o[k] | m[k] : o[k] && !m[k] ? 1 : 0; m = o; }
    else if (m && mode === 'sub') m = null;
    sel = m && m.some((v) => v) ? m : null; selView = null; draw(); renderPanel(); status();
  }
  const selCount = () => { let n = 0; if (sel) for (let k = 0; k < sel.length; k++) n += sel[k]; return n; };
  function selOverlay() {
    if (!sel) return null; if (selView) return selView;
    const W = cur.width, H = cur.height, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), o = x.createImageData(W, H), d = o.data;
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const k = y * W + xx; if (!sel[k]) continue; const i = k * 4;
      if (xx === 0 || y === 0 || xx === W - 1 || y === H - 1 || !sel[k - 1] || !sel[k + 1] || !sel[k - W] || !sel[k + W]) { const v = ((xx + y) >> 1) & 1 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } else { d[i] = 40; d[i + 1] = 120; d[i + 2] = 255; d[i + 3] = 60; } }
    x.putImageData(o, 0, 0); return (selView = c);
  }
  // the picture's own colours (the most used ones, near repeats left out)
  let palFor = null, pal = [];
  function pictureColours() {
    if (palFor === cur) return pal; palFor = cur; const d = cur.data, m = new Map();
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; m.set(k, (m.get(k) || 0) + 1); }
    const out = []; for (const [k] of [...m].sort((a, b) => b[1] - a[1])) { const c = [k >> 16, (k >> 8) & 255, k & 255]; if (out.some((o) => Math.abs(o[0] - c[0]) + Math.abs(o[1] - c[1]) + Math.abs(o[2] - c[2]) < 24)) continue; out.push(c); if (out.length >= 16) break; }
    return (pal = out.map((c) => toHex(...c)));
  }
  const keepT = () => { try { localStorage.setItem('clipartcraft-editor', JSON.stringify(T)); } catch (e) { /* blocked */ } };
  // where Restore takes its pixels from, lined up with the picture as it is now
  const fromImg = () => { const o = offOf(cur); return T.from === 'sheet' && sheetFull && item.cutAt ? crop(sheetFull, item.cutAt.x + o.x, item.cutAt.y + o.y, cur.width, cur.height) : crop(orig, o.x, o.y, cur.width, cur.height); };
  const sheetPart = () => !!(sheetFull && item && item.cutAt);
  // (a picture of another size, after a trim or going back, cannot keep the selection)
  const fitSel = () => { if (sel && sel.length !== cur.width * cur.height) { sel = null; selView = null; renderPanel(); } };
  // ------------------------------------------------------------------ layers: the bottom one first; cur is the one being worked on
  // layer: { name, img (ImageData, the picture's size), vis, op (0–1), mask (Uint8Array 0–255, 255 = shown) | null }
  let layers = [], active = 0, maskEdit = false;
  const L0 = () => layers[active];
  const snap = () => ({ layers: layers.map((l) => ({ ...l })), active });
  function restore(st) { layers = st.layers.map((l) => ({ ...l })); active = Math.min(st.active, layers.length - 1); cur = L0().img; if (maskEdit && !L0().mask) maskEdit = false; }
  const remember = () => { past.push(snap()); const step = layers.reduce((n, l) => n + l.img.width * l.img.height * 4, 0), most = Math.max(4, Math.min(50, Math.floor(400e6 / Math.max(1, step)))); if (past.length > most) past.splice(0, past.length - most); future = []; vec = vec && { ...vec, stale: true }; };
  function change(next) {
    remember(); const o = offOf(cur); next.off = next.shift ? { x: o.x + next.shift.x, y: o.y + next.shift.y } : next.off || o;
    // a trim (or going back to the first version) moves every layer the same way
    if (next.width !== cur.width || next.height !== cur.height || next.off.x !== o.x || next.off.y !== o.y) { const dx = next.off.x - o.x, dy = next.off.y - o.y;
      layers = layers.map((l, i) => ({ ...l, img: i === active ? l.img : crop(l.img, dx, dy, next.width, next.height), mask: l.mask ? cropMask(l.mask, cur.width, cur.height, dx, dy, next.width, next.height) : null })); }
    cur = next; L0().img = cur; fitSel(); draw(); status();
  }
  // a change to the layers themselves (added, removed, moved, faded, masked)
  function layerChange(fn) { remember(); fn(); cur = L0().img; if (maskEdit && !L0().mask) maskEdit = false; fitSel(); draw(); renderPanel(); status(); }
  function undo() { if (flt) { flt = null; draw(); return; } if (!past.length) return; future.push(snap()); restore(past.pop()); fitSel(); draw(); renderPanel(); status(); }
  function redo() { if (!future.length) return; past.push(snap()); restore(future.pop()); fitSel(); draw(); renderPanel(); status(); }
  const cropMask = (m, W, H, x, y, w, h) => { const o = new Uint8Array(w * h).fill(255); for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const sx = x + xx, sy = y + yy; if (sx >= 0 && sy >= 0 && sx < W && sy < H) o[yy * w + xx] = m[sy * W + sx]; } return o; };
  // each layer drawn (its mask applied); kept until its pixels or mask change (the one being worked on is drawn fresh)
  function layerCanvas(l, live) {
    if (!live && l.cv && l.cvImg === l.img && l.cvMask === l.mask) return l.cv;
    let img = l.img; if (l.mask) { img = copy(img); for (let k = 0; k < l.mask.length; k++) img.data[k * 4 + 3] = (img.data[k * 4 + 3] * l.mask[k]) / 255; }
    const c = canvasOf(img); if (!live) { l.cv = c; l.cvImg = l.img; l.cvMask = l.mask; } return c;
  }
  const plain = () => layers.length === 1 && !layers[0].mask && layers[0].vis && layers[0].op === 1;
  function composite() { const c = document.createElement('canvas'); c.width = cur.width; c.height = cur.height; const x = c.getContext('2d'); layers.forEach((l, i) => { if (!l.vis) return; x.globalAlpha = l.op; x.drawImage(layerCanvas(l, i === active), 0, 0); }); return c; }
  // the picture as it will be saved: every layer shown, flattened
  const flat = () => (plain() ? cur : composite().getContext('2d').getImageData(0, 0, cur.width, cur.height));
  const toast = (m) => opts.toast && opts.toast(m);
  const BGS = { check: 'repeating-conic-gradient(#c9ccd6 0 25%, #f4f5f8 0 50%) 0 0 / 16px 16px', white: '#fff', black: '#000', grey: '#808080', dark: 'repeating-conic-gradient(#2b2d36 0 25%, #22242c 0 50%) 0 0 / 16px 16px' };
  function draw() { if (!el || !cur) return; const c = el.querySelector('.ed-canvas'); c.width = cur.width; c.height = cur.height; const x = c.getContext('2d'); if (plain()) x.putImageData(cur, 0, 0); else { x.clearRect(0, 0, c.width, c.height); x.drawImage(composite(), 0, 0); }
    // painting a mask: what it hides shows red
    if (maskEdit && L0().mask) { const m = L0().mask, o = x.createImageData(cur.width, cur.height); for (let k = 0; k < m.length; k++) if (m[k] < 255) { o.data[k * 4] = 230; o.data[k * 4 + 1] = 30; o.data[k * 4 + 2] = 40; o.data[k * 4 + 3] = (255 - m[k]) * 0.5; } const t = document.createElement('canvas'); t.width = cur.width; t.height = cur.height; t.getContext('2d').putImageData(o, 0, 0); x.drawImage(t, 0, 0); }
    if (vec && vec.show && vec.url) { if (!vec.im || vec.im.src !== vec.url) { vec.im = new Image(); vec.im.onload = () => draw(); vec.im.src = vec.url; } if (vec.im.complete) { x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, 0, c.width, c.height); x.drawImage(vec.im, 0, 0, c.width, c.height); } }
    const so = selOverlay(); if (so) x.drawImage(so, 0, 0);
    if (flt) { x.drawImage(fltCanvas(), Math.round(flt.x), Math.round(flt.y)); const k = Math.max(1, cur.width / (c.getBoundingClientRect().width || cur.width)); x.lineWidth = k; x.setLineDash([4 * k, 3 * k]); x.strokeStyle = '#000'; x.strokeRect(Math.round(flt.x) - k / 2, Math.round(flt.y) - k / 2, flt.img.width + k, flt.img.height + k); x.lineDashOffset = 4 * k; x.strokeStyle = '#fff'; x.strokeRect(Math.round(flt.x) - k / 2, Math.round(flt.y) - k / 2, flt.img.width + k, flt.img.height + k); }
    c.style.background = BGS[bgView]; applyZoom(); undoButtons(); tell(); }
  // the ribbon (ui.js) listens, to show the tools, sizes and colours as they are now
  const tell = () => document.dispatchEvent(new Event('clipart-editor'));
  function undoButtons() { el.querySelectorAll('[data-hist=undo]').forEach((b) => { b.disabled = !past.length; }); el.querySelectorAll('[data-hist=redo]').forEach((b) => { b.disabled = !future.length; }); }
  function status() { const s = el.querySelector('.sl-status'); if (!s || !cur) return; let solid = 0; for (let i = 3; i < cur.data.length; i += 4) if (cur.data[i] >= 24) solid++;
    s.innerHTML = `<span><b>${esc(item.name)}</b></span><span>${cur.width} × ${cur.height} px</span><span>${Math.round((100 * solid) / (cur.width * cur.height))}% picture, the rest see-through</span>${sel ? `<span>selected: ${selCount()} px</span>` : ''}${layers.length > 1 || maskEdit ? `<span>layer: <b>${esc(L0().name)}</b>${maskEdit ? ' (painting its mask)' : ''}</span>` : ''}${busyNow ? `<span class="warn">${esc(busyNow)}</span>` : ''}<span>${sheetPart() ? 'its sheet is in the working area: Restore can bring parts back from it' : 'Restore brings back the picture as it was opened'}</span><span class="grow"></span><span>zoom ${Math.round(fitScale() * zoom * 100)}%</span>`; }
  const desk = () => el.querySelector('.sl-desk');
  function fitScale() { const d = desk(); return cur ? Math.min((d.clientWidth - 40) / cur.width, (d.clientHeight - 40) / cur.height, 8) : 1; }
  function applyZoom(at) { const c = el.querySelector('.ed-canvas'), d = desk(), before = c.getBoundingClientRect(), k = fitScale() * zoom; c.style.width = `${cur.width * k}px`; c.style.height = `${cur.height * k}px`; c.style.imageRendering = k > 2 ? 'pixelated' : 'auto';
    if (at && before.width) { const fx = (at.x - before.left) / before.width, fy = (at.y - before.top) / before.height, r = c.getBoundingClientRect(); d.scrollLeft += r.left + fx * r.width - at.x; d.scrollTop += r.top + fy * r.height - at.y; }
    const z = el.querySelector('.sl-zoom'); if (z) z.textContent = zoom === 1 ? 'Fit' : `${Math.round(k * 100)}%`; }
  const setZoom = (z, at) => { zoom = Math.max(0.2, Math.min(60, z)); applyZoom(at); status(); };

  function panel() {
    const slide = (n, label, min, max) => `<label class="field"><span>${label}</span><div class="ed-slide"><input type="range" min="${min}" max="${max}" data-n="${n}" value="${T[n]}"><input class="input" type="number" min="${min}" max="${max}" data-n="${n}" value="${T[n]}"></div></label>`;
    const matchFields = () => `${slide('tol', 'How close a colour counts', 1, 200)}<label class="field check"><input type="checkbox" data-chk="joined" ${T.joined !== false ? 'checked' : ''}> Joined only (off: that colour everywhere)</label>`;
    const seg = (k, list) => `<div class="seg" role="group">${list.map(([v, l]) => `<button class="btn" type="button" data-t="${k}:${v}" aria-pressed="${T[k] === v}">${l}</button>`).join('')}</div>`;
    return `<div class="props-head">Touch up</div><div class="sec">
      <div class="btns hist-row"><button class="btn outline sm" type="button" data-hist="undo" ${past.length ? '' : 'disabled'}>↶ Undo</button><button class="btn outline sm" type="button" data-hist="redo" ${future.length ? '' : 'disabled'}>↷ Redo</button></div>
      <div class="field"><span>Tool</span>${seg('tool', [['select', 'Select'], ['brush', 'Brush'], ['fill', 'Fill'], ['gradient', 'Gradient'], ['pick', 'Eyedropper'], ['text', 'Text']])}</div>
      ${T.tool === 'select' ? `<div class="touch-opts"><div class="field"><span>Select with</span>${seg('shape', [['box', 'Box'], ['ellipse', 'Ellipse'], ['lasso', 'Lasso'], ['wand', 'Magic wand']])}</div>
        <div class="field"><span>Selecting</span>${seg('mode', [['new', 'New'], ['add', 'Add to it'], ['sub', 'Take away']])}</div>${T.shape === 'wand' ? matchFields() : ''}</div>
        <p class="hint">${T.shape === 'lasso' ? 'Drag to draw freehand, or click (Shift-click) for straight corners; close on the first corner, a double-click or Enter. Backspace takes a corner off, Escape gives it up.' : T.shape === 'wand' ? 'Click a patch: it and everything of about its colour is selected.' : 'Drag the shape over the part.'} Shift adds to the selection, Alt takes away; a click off it lets it go.</p>
        <div class="field"><span>With the selection</span><div class="btns ed-selbtns"><button class="btn outline sm" type="button" data-sel="paint" ${sel ? '' : 'disabled'} title="Fill the selection with the colour">Fill with the colour</button><button class="btn outline sm" type="button" data-sel="erase" ${sel ? '' : 'disabled'} title="Make it see-through (Delete)">Erase</button><button class="btn outline sm" type="button" data-sel="keep" ${sel ? '' : 'disabled'} title="Bring it back from the picture as opened (or its sheet)">Restore</button><button class="btn outline sm" type="button" data-sel="only" ${sel ? '' : 'disabled'} title="Erase everything else">Keep only this</button><button class="btn outline sm" type="button" data-sel="invert" title="Select everything else (Ctrl+Shift+I)">Invert</button><button class="btn outline sm" type="button" data-sel="all" title="Ctrl+A">Select all</button><button class="btn outline sm" type="button" data-sel="none" ${sel ? '' : 'disabled'} title="Ctrl+D">Deselect</button></div></div>`
      : T.tool === 'brush' ? `<div class="touch-opts"><div class="field"><span>Do</span>${seg('op', [['paint', 'Paint'], ['erase', 'Erase'], ['keep', 'Restore']])}</div>${slide('size', 'Size (pixels across)', 1, 200)}</div><p class="hint">Paint over the part. Alt: erase (or restore when erasing).${sel ? ' It stays inside the selection.' : ''}</p>`
      : T.tool === 'fill' ? `<div class="touch-opts">${matchFields()}</div><p class="hint">Click a patch: ${T.joined !== false ? 'it and everything joined to it' : 'every pixel anywhere'} of about that colour takes the colour.${T.joined !== false ? ' Untick “Joined only” to change a colour everywhere.' : ''}${sel ? ' It stays inside the selection.' : ''}</p>`
      : T.tool === 'gradient' ? `<div class="touch-opts"><div class="field"><span>Shape</span>${seg('gshape', [['linear', 'Straight across'], ['radial', 'Round']])}</div><div class="field"><span>Colours</span>${seg('gsrc', [['picture', 'From the picture'], ['colours', 'Colour 1 → colour 2']])}</div>
        ${T.gsrc === 'colours' ? `<div class="field"><span>Colour 2</span><div class="ed-colour"><input type="color" data-col2 value="${T.col2}"><code>${T.col2}</code><button class="btn outline sm" type="button" data-swapcol title="Colour 1 and colour 2 change places">⇄ Swap</button></div></div>` : ''}</div>
        <p class="hint">${sel ? 'Drag across the selection' : '<b>Select the area first</b> (Select tool), then drag across it'}: ${T.gsrc === 'picture' ? 'it blends from the picture’s colour just outside the selection where you start to the one where you let go (for a background that changes slowly)' : 'colour 1 where you start, colour 2 where you let go'}${T.gshape === 'radial' ? ', round from where you start' : ''}.</p>`
      : T.tool === 'text' ? `<div class="touch-opts"><label class="field"><span>Font</span><select class="input" data-s="font">${FONTS.map((f) => `<option ${f === T.font ? 'selected' : ''} style="font-family:'${f}'">${f}</option>`).join('')}</select></label>${slide('fsize', 'Size (pixels tall)', 6, 400)}<label class="field check"><input type="checkbox" data-chk="bold" ${T.bold ? 'checked' : ''}> Bold</label></div><p class="hint">Click where the words go, type, then Enter. They float: drag them into place (the font, size and colour still change them), then click off them or press Enter.</p>`
      : `<p class="hint">Click the picture to take its colour; then you are back on ${esc({ select: 'Select', brush: 'Brush', fill: 'Fill' }[T.back] || 'Brush')}.</p>`}
      ${T.tool !== 'pick' ? `<div class="field"><span>Colour</span><div class="ed-colour"><input type="color" data-col value="${T.col}"><code>${T.col}</code><button class="btn outline sm" type="button" data-t="tool:pick" title="Take a colour from the picture">Eyedropper</button></div>
        <div class="ed-swatches" title="The picture's own colours">${pictureColours().map((h) => `<button type="button" class="ed-sw" data-sw="${h}" title="${h}" style="background:${h}" aria-pressed="${h === T.col}"></button>`).join('')}</div><small class="hint">The picture's own colours: click one to use it.</small>
        <div class="ed-swatches" title="Your colours">${(T.mine || []).map((h) => `<button type="button" class="ed-sw" data-sw="${h}" title="${h} (right-click: take it off)" style="background:${h}" aria-pressed="${h === T.col}"></button>`).join('')}<button class="btn outline sm" type="button" data-addcol title="Keep this colour in your colours (for every picture)">+ Add colour</button></div></div>` : ''}
      ${(T.tool === 'brush' && T.op === 'keep') || T.tool === 'select' ? `<div class="field"><span>Restore from</span>${seg('from', [['opened', 'The picture as opened'], ...(sheetPart() ? [['sheet', 'Its sheet']] : [])])}</div>` : ''}
      <div class="field"><span>Layers <small class="hint">(top first; Save flattens them)</small></span><div class="ed-layers">${layers.map((l, i) => i).reverse().map((i) => { const l = layers[i]; return `<div class="ed-layer" data-lpick="${i}" aria-selected="${i === active}"><button type="button" class="ed-eye" data-lvis="${i}" title="${l.vis ? 'Hide' : 'Show'} it">${l.vis ? '👁' : '–'}</button><canvas data-th="${i}" width="40" height="30"></canvas><span class="nm" title="Double-click to rename">${esc(l.name)}</span>${l.mask ? `<i class="ed-mtag${maskEdit && i === active ? ' on' : ''}">mask</i>` : ''}${l.op < 1 ? `<small class="hint">${Math.round(l.op * 100)}%</small>` : ''}</div>`; }).join('')}</div>
        <label class="field"><span>How solid this layer is</span><div class="ed-slide"><input type="range" min="0" max="100" data-lop value="${Math.round(L0().op * 100)}"><input class="input" type="number" min="0" max="100" data-lop value="${Math.round(L0().op * 100)}"></div></label>
        <div class="btns ed-selbtns"><button class="btn outline sm" type="button" data-ly="new">New</button><button class="btn outline sm" type="button" data-ly="dup">Duplicate</button><button class="btn outline sm" type="button" data-ly="fromsel" ${sel ? '' : 'disabled'} title="Ctrl+J">From the selection</button><button class="btn outline sm" type="button" data-ly="up">Up</button><button class="btn outline sm" type="button" data-ly="down">Down</button><button class="btn outline sm" type="button" data-ly="merge" ${active ? '' : 'disabled'}>Merge down</button><button class="btn outline sm" type="button" data-ly="flatten" ${layers.length > 1 ? '' : 'disabled'}>Flatten</button><button class="btn outline sm" type="button" data-ly="del" ${layers.length > 1 ? '' : 'disabled'}>Delete</button></div>
        <div class="btns ed-selbtns"><button class="btn ${maskEdit ? 'primary' : 'outline'} sm" type="button" data-ly="mask" title="${L0().mask ? 'Paint the mask (or the picture again)' : 'A mask hides parts of the layer without losing them (from the selection, if there is one)'}">${L0().mask ? (maskEdit ? 'Painting the mask' : 'Paint the mask') : 'Add a mask'}</button>${L0().mask ? '<button class="btn outline sm" type="button" data-ly="maskapply">Apply the mask</button><button class="btn outline sm" type="button" data-ly="maskdel">Delete the mask</button>' : ''}</div></div>
      <div class="field"><span>Vector (the SVG saved with it)</span><label class="field"><span>Detail</span><select class="input" data-s="vprofile">${PROFILES.map(([v, n]) => `<option value="${v}" ${v === T.vprofile ? 'selected' : ''}>${n}</option>`).join('')}</select></label>${slide('vcolors', 'Colours (0: as the picture needs)', 0, 64)}
        <div class="btns"><button class="btn outline sm" type="button" data-vec="trace">Trace now</button>${vec ? `<button class="btn ${vec.show ? 'primary' : 'outline'} sm" type="button" data-vec="show">${vec.show ? 'Showing the vector' : 'Show the vector'}</button>` : ''}</div>
        ${vec ? `<small class="hint">${vec.stale ? 'The picture has changed since: Save traces it again.' : 'Save keeps this SVG.'} Its colours (click to change one):</small><div class="ed-swatches">${vec.fills.slice(0, 40).map((h) => `<label class="ed-sw" style="background:${h}" title="${h}"><input type="color" data-vfill="${h}" value="${h.length === 4 ? '#' + [...h.slice(1)].map((c) => c + c).join('') : h.slice(0, 7)}"></label>`).join('')}</div>` : '<small class="hint">See the SVG before saving; fewer colours or Icon detail make it simpler.</small>'}</div>
      <div class="field"><span>Clean up <small class="hint">(the whole picture, one click each)</small></span><div class="ed-clean">${Object.entries(CLEAN).map(([k, c]) => `<div class="ed-crow"><button class="btn outline sm" type="button" data-clean="${k}" title="${esc(c.hint)}">${c.label}</button><input class="input" type="number" data-cv="${k}" value="${T['cv_' + k] ?? c.value}" title="${esc(c.unit)}"><small class="hint">${esc(c.unit)}</small></div>`).join('')}</div></div>
      <div class="field"><span>Background to look against</span>${(() => `<div class="seg" role="group">${[['check', 'Checks'], ['dark', 'Dark'], ['white', 'White'], ['grey', 'Grey'], ['black', 'Black']].map(([v, l]) => `<button class="btn" type="button" data-bg="${v}" aria-pressed="${bgView === v}">${l}</button>`).join('')}</div>`)()}<small class="hint">Specks and halos show up best against the opposite of the picture.</small></div>
      <div class="btns"><button class="btn primary" type="button" data-ed="save">Save</button><button class="btn outline" type="button" data-ed="copy">Save as a copy</button>${item && item.pngFirst ? '<button class="btn ghost" type="button" data-ed="first">Back to the original</button>' : ''}</div>
      <p class="hint">Save replaces the picture in the library (its SVG is traced again); its very first version is kept, to go back to.</p></div>`;
  }
  function renderPanel() { el.querySelector('.sl-side').innerHTML = panel(); undoButtons(); renderLayers(); tell(); }

  // drawing on the picture
  let drag = null, poly = null;
  const ptOf = (e) => { const c = el.querySelector('.ed-canvas'), r = c.getBoundingClientRect(), k = cur.width / r.width; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, k, r }; };
  function preview(pts) { let v = el.querySelector('.sl-lasso'); if (!pts) { if (v) v.remove(); return; } const r = el.querySelector('.ed-canvas').getBoundingClientRect(), k = cur.width / r.width;
    if (!v) { v = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); v.setAttribute('class', 'sl-lasso'); v.innerHTML = '<polygon/>'; el.append(v); } v.dataset.op = (poly ? poly.mode : drag && drag.mode) === 'sub' ? 'erase' : 'keep';
    v.querySelector('polygon').setAttribute('points', pts.map(([x, y]) => `${(r.left + x / k).toFixed(1)},${(r.top + y / k).toFixed(1)}`).join(' ')); }
  const shapePts = (a, b) => { const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    return T.shape === 'ellipse' ? Array.from({ length: 48 }, (_, i) => { const t = (i / 48) * Math.PI * 2; return [x0 + w / 2 + (Math.cos(t) * w) / 2, y0 + h / 2 + (Math.sin(t) * h) / 2]; }) : [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]]; };
  function closePoly() { if (!poly) return; const { pts, mode } = poly; poly = null; preview(null); if (pts.length < 3) return; setSel(maskOf(pts, cur.width, cur.height), mode); }
  function onDown(e) {
    if (e.button !== 0 || !cur) return; const p = ptOf(e); e.preventDefault(); e.target.setPointerCapture(e.pointerId);
    const x = Math.floor(p.x), y = Math.floor(p.y), inside = x >= 0 && y >= 0 && x < cur.width && y < cur.height;
    if (flt) { if (inFloat(p)) { drag = { float: true, dx: p.x - flt.x, dy: p.y - flt.y }; return; } putDown(); return; }
    if (T.tool === 'text') { if (inside) textAt(p, e); return; }
    if (T.tool === 'gradient') { if (!sel && !(maskEdit && L0().mask)) return toast('Select the area first (Select tool), then drag across it.'); drag = { grad: true, p0: p, moved: false }; return; }
    if (T.tool === 'pick') { if (!inside) return; const F = flat(), i = (y * cur.width + x) * 4; if (F.data[i + 3] < 24) return toast('That spot is see-through: click a coloured one.');
      T.col = toHex(F.data[i], F.data[i + 1], F.data[i + 2]); T.tool = T.back || 'brush'; if (T.tool === 'brush') T.op = 'paint'; keepT(); renderPanel(); toast(`Colour ${T.col} taken.`); return; }
    if (T.tool === 'fill') { if (!inside) return; const m = regionOf(cur, x, y, +T.tol || 30, T.joined !== false); if (sel) for (let k = 0; k < m.length; k++) if (!sel[k]) m[k] = 0; change(applyMask(cur, m, 'paint', null, rgbOf(T.col))); return; }
    if (T.tool === 'brush' && maskEdit && L0().mask) { remember(); layers[active] = { ...L0(), mask: new Uint8Array(L0().mask) }; const show = (T.op === 'keep') !== e.altKey; drag = { mbrush: true, last: p, v: show ? 255 : 0 }; maskBrush(L0().mask, p, p, drag.v); draw(); return; }
    if (T.tool === 'brush') { remember(); { const o = offOf(cur); cur = copy(cur); cur.off = o; L0().img = cur; } drag = { brush: true, last: p, op: e.altKey ? (T.op === 'erase' ? 'keep' : 'erase') : T.op }; brush(cur, p.x, p.y, p.x, p.y, (+T.size || 8) / 2, drag.op, fromImg(), rgbOf(T.col), sel); draw(); return; }
    const mode = e.shiftKey ? 'add' : e.altKey ? 'sub' : T.mode;
    if (T.shape === 'wand') { if (inside) setSel(regionOf(cur, x, y, +T.tol || 30, T.joined !== false), mode); return; }
    if (T.shape === 'lasso') { if (poly && poly.pts.length >= 3 && Math.hypot(p.x - poly.pts[0][0], p.y - poly.pts[0][1]) <= 10 * p.k) { closePoly(); return; } if (!poly) poly = { pts: [[p.x, p.y]], free: null, mode }; else poly.pts.push([p.x, p.y]); drag = { lasso: true, p0: p, moved: false }; return; }
    drag = { p0: p, moved: false, mode };
  }
  function onMove(e) {
    if (!cur) return; const p = ptOf(e);
    if (!drag) { if (poly) preview([...poly.pts, [p.x, p.y]]); el.querySelector('.ed-canvas').style.cursor = inFloat(p) ? 'move' : T.tool === 'text' ? 'text' : 'crosshair'; return; }
    if (drag.grad) { drag.moved = true; preview([[drag.p0.x, drag.p0.y], [p.x, p.y], [drag.p0.x + 0.01, drag.p0.y + 0.01]]); return; }
    if (drag.float) { flt.x = Math.round(p.x - drag.dx); flt.y = Math.round(p.y - drag.dy); draw(); return; }
    if (drag.mbrush) { maskBrush(L0().mask, drag.last, p, drag.v); drag.last = p; draw(); return; }
    if (drag.brush) { brush(cur, drag.last.x, drag.last.y, p.x, p.y, (+T.size || 8) / 2, drag.op, fromImg(), rgbOf(T.col), sel); drag.last = p; draw(); return; }
    if (!drag.moved && Math.hypot(p.x - drag.p0.x, p.y - drag.p0.y) < 3 * p.k) return; drag.moved = true;
    if (drag.lasso) { if (poly.free === null) poly.free = poly.pts.length === 1; const l = poly.pts[poly.pts.length - 1]; if (Math.hypot(p.x - l[0], p.y - l[1]) > 2 * p.k) poly.pts.push([p.x, p.y]); preview(poly.pts); return; }
    preview(shapePts(drag.p0, p));
  }
  function onUp(e) {
    if (!drag) return; const d = drag; drag = null; const p = ptOf(e);
    if (d.brush || d.mbrush) { status(); undoButtons(); renderLayers(); return; }
    if (d.float) return;
    if (d.grad) { preview(null); if (Math.hypot(p.x - d.p0.x, p.y - d.p0.y) < 2) return toast('Drag across the selection: from where the gradient starts to where it ends.'); if (maskEdit && L0().mask) { const m = maskFade(L0().mask, sel, d.p0, p); return layerChange(() => { layers[active] = { ...L0(), mask: m }; }); } change(gradient(cur, sel, d.p0, p)); return; }
    if (d.lasso) { if (poly && poly.free && d.moved) closePoly(); else if (poly && !d.moved && poly.free === null) poly.free = false; return; }
    preview(null); if (!d.moved) { if (sel && d.mode === 'new') setSel(null); return; } if (Math.abs(p.x - d.p0.x) < 2 || Math.abs(p.y - d.p0.y) < 2) return; setSel(maskOf(shapePts(d.p0, p), cur.width, cur.height), d.mode);
  }

  // ------------------------------------------------------------------ floating pieces (a paste, or words), moved, then put down
  let flt = null, clip = null, textBox = null;
  const FONTS = ['Arial', 'Arial Black', 'Verdana', 'Trebuchet MS', 'Georgia', 'Times New Roman', 'Courier New', 'Impact', 'Comic Sans MS'];
  function fltCanvas() { if (!flt.c) flt.c = canvasOf(flt.img); return flt.c; }
  function putDown(asLayer) { if (!flt) return; if (asLayer === true) { const f = flt, im = new ImageData(cur.width, cur.height); flt = null; return addLayer(im, f.text ? 'Words' : 'Pasted', f); } const c = canvasOf(cur), x = c.getContext('2d'); x.drawImage(fltCanvas(), Math.round(flt.x), Math.round(flt.y)); const o = x.getImageData(0, 0, c.width, c.height); flt = null; change(o); }
  function dropFloat() { flt = null; draw(); }
  function float(img, x, y, text) { putDown(); flt = { img, x: Math.max(-img.width + 4, Math.min(cur.width - 4, x)), y: Math.max(-img.height + 4, Math.min(cur.height - 4, y)), text }; draw(); }
  const inFloat = (p) => flt && p.x >= flt.x && p.y >= flt.y && p.x < flt.x + flt.img.width && p.y < flt.y + flt.img.height;
  // the selected part (only its pixels; the rest of its box see-through)
  function selBox() { let x0 = cur.width, y0 = cur.height, x1 = -1, y1 = -1; for (let k = 0; k < sel.length; k++) if (sel[k]) { const x = k % cur.width, y = (k / cur.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; }
  function copySel(cut) {
    if (flt) { clip = { img: flt.img, x: flt.x, y: flt.y }; if (cut) dropFloat(); return toast(cut ? 'Cut.' : 'Copied.'); }
    if (!sel) return toast('Select a part first (Select, then Box, Ellipse, Lasso or Magic wand).');
    const b = selBox(), o = new ImageData(b.w, b.h);
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) { const k = (b.y + y) * cur.width + b.x + x; if (!sel[k]) continue; const i = k * 4, j = (y * b.w + x) * 4; for (let q = 0; q < 4; q++) o.data[j + q] = cur.data[i + q]; }
    clip = { img: o, x: b.x, y: b.y };
    // (other programs can paste it too)
    try { canvasOf(o).toBlob((bl) => { if (bl && navigator.clipboard && window.ClipboardItem) navigator.clipboard.write([new ClipboardItem({ 'image/png': bl })]).catch(() => {}); }); } catch (e) { /* not allowed */ }
    if (cut) change(applyMask(cur, sel, 'erase'));
    toast(cut ? 'Cut: Paste puts it back, to drag where you like.' : 'Copied: Paste puts a copy in, to drag where you like.');
  }
  // Paste: what was copied here (where it came from), or a picture copied in another program (at the top left)
  async function pasteNow(blob) {
    if (!cur) return;
    if (!blob && !clip && navigator.clipboard && navigator.clipboard.read) { try { for (const it of await navigator.clipboard.read()) { const t = it.types.find((x) => x.startsWith('image/')); if (t) { blob = await it.getType(t); break; } } } catch (e) { /* not allowed */ } }
    if (blob) { const img = await imageOf(blob); if (clip && img.width === clip.img.width && img.height === clip.img.height) return float(clip.img, clip.x, clip.y); return float(img, 0, 0); }
    if (!clip) return toast('Copy a part first (or copy a picture in another program, then Paste).');
    float(clip.img, clip.x, clip.y);
  }
  // words as a picture, in the colour, font and size chosen
  function textImg(t) {
    const font = `${T.bold ? 'bold ' : ''}${Math.max(6, +T.fsize || 32)}px "${T.font}", sans-serif`, m = document.createElement('canvas').getContext('2d'); m.font = font;
    const lines = String(t).split('\n'), h = Math.ceil((+T.fsize || 32) * 1.25), w = Math.max(1, Math.ceil(Math.max(...lines.map((l) => m.measureText(l).width)) + 4));
    const c = document.createElement('canvas'); c.width = w; c.height = h * lines.length; const x = c.getContext('2d'); x.font = font; x.fillStyle = T.col; x.textBaseline = 'top';
    lines.forEach((l, i) => x.fillText(l, 2, i * h + (+T.fsize || 32) * 0.1)); return x.getImageData(0, 0, c.width, c.height);
  }
  function closeText() { if (textBox) { textBox.inp.remove(); textBox = null; } }
  function textAt(p, e) {
    putDown(); closeText(); const inp = document.createElement('input'); inp.className = 'input ed-textin'; inp.placeholder = 'Type, then Enter'; inp.style.left = `${e.clientX}px`; inp.style.top = `${e.clientY}px`;
    el.append(inp); textBox = { inp, x: p.x, y: p.y }; setTimeout(() => inp.focus(), 0);
    inp.addEventListener('keydown', (k) => { k.stopPropagation(); if (k.key === 'Enter') { k.preventDefault(); const t = inp.value, at = textBox; closeText(); if (t.trim()) float(textImg(t), Math.round(at.x), Math.round(at.y), t); } else if (k.key === 'Escape') { k.preventDefault(); closeText(); } });
    inp.addEventListener('blur', () => setTimeout(() => { if (textBox && textBox.inp === inp && !inp.value) closeText(); }, 200));
  }
  // a setting changed (from the panel or the ribbon)
  function setT(k, v) {
    if (k === 'tool') { if (v !== T.tool) { putDown(); closeText(); } if (v === 'pick' && T.tool !== 'pick') T.back = T.tool; }
    T[k] = v; keepT(); poly = null; preview(null);
    if (flt && flt.text && ['font', 'fsize', 'bold', 'col'].includes(k)) { flt.img = textImg(flt.text); flt.c = null; draw(); }
    renderPanel();
  }
  function addColour(h) { T.mine = [...new Set([h || T.col, ...(T.mine || [])])].slice(0, 24); keepT(); renderPanel(); }
  function dropColour(h) { T.mine = (T.mine || []).filter((x) => x !== h); keepT(); renderPanel(); }
  // a gradient over the selection, from a to b: the picture's own colours under a and b (an average of the solid pixels
  // round each), or colour 1 to colour 2; a little noise so it does not show bands
  // the picture's colour near (x, y) but outside the selection (the part being mended is not the colour to mend it with):
  // the solid, unselected pixels round it, looking further out until there are enough
  function colourAt(img, x, y, m) { const cx = Math.round(x), cy = Math.round(y);
    for (let rad = 2; rad <= 60; rad += rad < 8 ? 2 : 6) { let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const xx = cx + dx, yy = cy + dy; if (xx < 0 || yy < 0 || xx >= img.width || yy >= img.height) continue; const k = yy * img.width + xx, i = k * 4; if ((m && m[k]) || img.data[i + 3] < 128) continue; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++; }
      if (n >= 6) return [r / n, g / n, b / n]; }
    return null; }
  function gradient(img, m, a, b) {
    const c0 = (T.gsrc === 'picture' && colourAt(img, a.x, a.y, m)) || rgbOf(T.col), c1 = (T.gsrc === 'picture' && colourAt(img, b.x, b.y, m)) || rgbOf(T.gsrc === 'picture' ? T.col : T.col2);
    const o = copy(img), d = o.data, W = img.width, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1, L = Math.sqrt(L2);
    for (let k = 0; k < m.length; k++) { if (!m[k]) continue; const x = k % W + 0.5, y = ((k / W) | 0) + 0.5, i = k * 4;
      const t = Math.max(0, Math.min(1, T.gshape === 'radial' ? Math.hypot(x - a.x, y - a.y) / L : ((x - a.x) * dx + (y - a.y) * dy) / L2)), n = Math.random() - 0.5;
      d[i] = c0[0] + (c1[0] - c0[0]) * t + n; d[i + 1] = c0[1] + (c1[1] - c0[1]) * t + n; d[i + 2] = c0[2] + (c1[2] - c0[2]) * t + n; d[i + 3] = 255; }
    return o;
  }
  // ------------------------------------------------------------------ layer commands
  function addLayer(img, name, f) { layerChange(() => { if (f) { const c = canvasOf(img); c.getContext('2d').drawImage(canvasOf(f.img), Math.round(f.x), Math.round(f.y)); img = c.getContext('2d').getImageData(0, 0, c.width, c.height); } img.off = offOf(cur); layers.splice(active + 1, 0, { name, img, vis: true, op: 1, mask: null }); active++; }); }
  function layerDo(a, v) {
    if (!cur) return; const W = cur.width, H = cur.height;
    if (a === 'new') return addLayer(new ImageData(W, H), `Layer ${layers.length + 1}`);
    if (a === 'dup') return addLayer(copy(cur), L0().name + ' copy');
    if (a === 'fromsel') { if (!sel) return toast('Select a part first: it is copied to a layer of its own (Ctrl+J).'); const o = new ImageData(W, H); for (let k = 0; k < sel.length; k++) if (sel[k]) for (let q = 0; q < 4; q++) o.data[k * 4 + q] = cur.data[k * 4 + q]; return addLayer(o, 'From the selection'); }
    if (['pick', 'vis', 'rename'].includes(a) && !layers[+v]) return;
    if (a === 'pick') { if (+v === active) return; active = +v; cur = L0().img; if (maskEdit && !L0().mask) maskEdit = false; draw(); renderPanel(); status(); return; }
    if (a === 'vis') return layerChange(() => { layers[+v] = { ...layers[+v], vis: !layers[+v].vis }; });
    if (a === 'rename') { const n = prompt('Name of the layer:', layers[+v].name); if (n && n.trim()) layerChange(() => { layers[+v] = { ...layers[+v], name: n.trim() }; }); return; }
    if (a === 'op') { if (Math.round(L0().op * 100) === Math.round(v)) return; } if (a === 'op') return layerChange(() => { layers[active] = { ...L0(), op: Math.max(0, Math.min(1, v / 100)) }; });
    if (a === 'del') { if (layers.length < 2) return toast('The last layer stays (erase it instead).'); return layerChange(() => { layers.splice(active, 1); active = Math.max(0, active - 1); }); }
    if (a === 'up' || a === 'down') { const j = active + (a === 'up' ? 1 : -1); if (j < 0 || j >= layers.length) return; return layerChange(() => { [layers[active], layers[j]] = [layers[j], layers[active]]; active = j; }); }
    if (a === 'merge') { if (active === 0) return toast('There is no layer under this one.'); return layerChange(() => { const c = canvasOf(layers[active - 1].mask ? (() => { const t = layerCanvas(layers[active - 1]); return t.getContext('2d').getImageData(0, 0, W, H); })() : layers[active - 1].img), x = c.getContext('2d'); x.globalAlpha = L0().op; if (L0().vis) x.drawImage(layerCanvas(L0()), 0, 0); const img = x.getImageData(0, 0, W, H); img.off = offOf(cur); layers.splice(active - 1, 2, { ...layers[active - 1], img, mask: null }); active--; }); }
    if (a === 'flatten') { if (plain()) return; return layerChange(() => { const img = composite().getContext('2d').getImageData(0, 0, W, H); img.off = offOf(cur); layers = [{ name: 'Picture', img, vis: true, op: 1, mask: null }]; active = 0; }); }
    // masks: what a layer hides, without losing it (painted with the brushes, a gradient or the selection commands)
    if (a === 'mask') { if (L0().mask) { maskEdit = !maskEdit; draw(); renderPanel(); return toast(maskEdit ? 'Painting the mask: the eraser and brush hide, the restore brush shows again; a gradient fades it.' : 'Painting the picture again.'); }
      const m = new Uint8Array(W * H).fill(255); if (sel) for (let k = 0; k < m.length; k++) m[k] = sel[k] ? 255 : 0; maskEdit = true; return layerChange(() => { layers[active] = { ...L0(), mask: m }; }); }
    if (a === 'maskapply') { if (!L0().mask) return; maskEdit = false; return layerChange(() => { const img = copy(cur); for (let k = 0; k < img.width * img.height; k++) img.data[k * 4 + 3] = (img.data[k * 4 + 3] * L0().mask[k]) / 255; img.off = offOf(cur); layers[active] = { ...L0(), img, mask: null }; }); }
    if (a === 'maskdel') { if (!L0().mask) return; maskEdit = false; return layerChange(() => { layers[active] = { ...L0(), mask: null }; }); }
  }
  function maskBrush(m, a, b, v) {
    const W = cur.width, H = cur.height, r = (+T.size || 8) / 2, n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / Math.max(1, r / 3)));
    for (let s2 = 0; s2 <= n; s2++) { const cx = a.x + ((b.x - a.x) * s2) / n, cy = a.y + ((b.y - a.y) * s2) / n;
      for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && (!sel || sel[y * W + x])) m[y * W + x] = v; }
  }
  // a mask faded along a line: shown where it starts, hidden where it ends (inside the selection, or everywhere)
  function maskFade(m0, lim, a, b) { const m = new Uint8Array(m0), W = cur.width, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
    for (let k = 0; k < m.length; k++) { if (lim && !lim[k]) continue; const x = k % W + 0.5, y = ((k / W) | 0) + 0.5, t = Math.max(0, Math.min(1, T.gshape === 'radial' ? Math.hypot(x - a.x, y - a.y) / Math.sqrt(L2) : ((x - a.x) * dx + (y - a.y) * dy) / L2)); m[k] = Math.round(m0[k] * (1 - t)); }
    return m; }
  function renderLayers() {
    const box = el && el.querySelector('.ed-layers'); if (!box) return;
    box.querySelectorAll('canvas[data-th]').forEach((c) => { const l = layers[+c.dataset.th]; if (!l) return; const x = c.getContext('2d'), k = Math.min(c.width / cur.width, c.height / cur.height); x.clearRect(0, 0, c.width, c.height); x.drawImage(layerCanvas(l, true), 0, 0, cur.width * k, cur.height * k); });
  }

  // ------------------------------------------------------------------ background: found by its edge (or the AI), completed, or made new
  // the background: reached from the picture's edges in small steps of colour (a shadow or a slow gradient is followed;
  // the edge of the subject, a bigger step, stops it); see-through pixels count as background
  function edgeBg(img, step) {
    const W = img.width, H = img.height, d = img.data, m = new Uint8Array(W * H), st = [], diff = (a, b) => Math.abs(d[a * 4] - d[b * 4]) + Math.abs(d[a * 4 + 1] - d[b * 4 + 1]) + Math.abs(d[a * 4 + 2] - d[b * 4 + 2]);
    const seed = (k) => { if (!m[k]) { m[k] = 1; st.push(k); } };
    for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); } for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (st.length) { const k = st.pop(), x = k % W, y = (k / W) | 0, clear = d[k * 4 + 3] < 24;
      for (const q of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1]) { if (q < 0 || m[q]) continue; const qc = d[q * 4 + 3] < 24; if (qc || (!clear && diff(k, q) <= step * 3)) { m[q] = 1; st.push(q); } } }
    return m;
  }
  // the AI cut-out (U²-Net): how sure it is that each pixel is the subject, at the picture's size
  async function aiSubject() {
    if (!window.CRAFTAI) throw new Error('The AI helpers are not here.'); const r = await CRAFTAI.cutout(canvasOf(flat())), W = cur.width, H = cur.height;
    const c = document.createElement('canvas'); c.width = r.W; c.height = r.H; const id = c.getContext('2d').createImageData(r.W, r.H); for (let i = 0; i < r.a.length; i++) { id.data[i * 4 + 3] = r.a[i]; } c.getContext('2d').putImageData(id, 0, 0);
    const o = document.createElement('canvas'); o.width = W; o.height = H; const x = o.getContext('2d'); x.drawImage(c, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data, a = new Uint8Array(W * H); for (let k = 0; k < a.length; k++) a[k] = d[k * 4 + 3]; return a;
  }
  let busyNow = '';
  const busy = (t) => { busyNow = t || ''; status(); tell(); };
  async function bgDo(a) {
    if (!cur || busyNow) return; const W = cur.width, H = cur.height;
    try {
      if (a === 'select') return setSel(edgeBg(cur, +T.bgStep || 12));
      if (a === 'edge' || a === 'ai') {
        let keep; if (a === 'edge') { const bg = edgeBg(cur, +T.bgStep || 12); keep = new Uint8Array(W * H); for (let k = 0; k < keep.length; k++) keep[k] = bg[k] ? 0 : 255; }
        else { busy('The AI is finding the subject (the first time it downloads, about 5 MB)…'); keep = await aiSubject(); busy(); }
        // as a mask: nothing is lost, and the restore brush paints it back
        if (L0().mask) for (let k = 0; k < keep.length; k++) keep[k] = Math.min(keep[k], L0().mask[k]);
        maskEdit = true; layerChange(() => { layers[active] = { ...L0(), mask: keep }; }); return toast('Background hidden by a mask, which you are painting now: the restore brush shows parts again, the eraser hides more. Mask (Layers & fixes) to stop; Apply the mask to make it final.');
      }
      if (a === 'complete' || a === 'complete-ai') { // every see-through pixel (or the selection) filled from what is round it
        const hole = new Float32Array(W * H); let n = 0; for (let k = 0; k < hole.length; k++) if (sel ? sel[k] : cur.data[k * 4 + 3] < 128) { hole[k] = 1; n++; }
        if (!n) return toast('Nothing to fill: no see-through gaps (select the part to fill).');
        return change(await mend(cur, hole, a === 'complete-ai'));
      }
      if (a === 'new') return makeBackground();
    } catch (e) { busy(); console.error(e); toast('That did not work: ' + (e.message || e)); }
  }
  // mend: the hole filled from round it (Telea: quick, best for thin gaps and smooth backgrounds) or by the AI (MI-GAN)
  async function mend(img, hole, ai) {
    const W = img.width, H = img.height, n = W * H; let out;
    // see-through pixels outside the hole are not colours to copy: they are filled too, then left see-through
    const h2 = new Float32Array(n); for (let k = 0; k < n; k++) h2[k] = hole[k] || img.data[k * 4 + 3] < 128 ? 1 : 0;
    if (ai) { if (!window.CRAFTAI) throw new Error('The AI helpers are not here.'); busy('The AI is mending (the first time it downloads, about 30 MB)…'); try { const pre = telea(img, h2); out = await CRAFTAI.inpaint(pre, hole); } finally { busy(); } }
    else { busy('Mending…'); await new Promise((r) => setTimeout(r, 20)); try { out = telea(img, h2); } finally { busy(); } }
    const o = copy(img); for (let k = 0; k < n; k++) if (hole[k]) { for (let q = 0; q < 3; q++) o.data[k * 4 + q] = out.data[k * 4 + q]; o.data[k * 4 + 3] = 255; }
    return o;
  }
    // Telea's fast-marching inpainting (2004): the gap is filled from its edge inwards, nearest first; each pixel takes a
  // weighted mean of the known pixels within a few pixels, each continued by its own slope (value + gradient · offset),
  // weighted towards the direction the fill is moving, to nearer pixels, and to pixels on the same "level" of the
  // march. Good for thin cracks, scratches and specks; wide holes need the AI.
  function telea(img, hole, R = 5, slope = 1) {
    const W = img.width, H = img.height, n = W * H, s = img.data, F = new Float32Array(n * 3), T = new Float32Array(n).fill(1e6), flag = new Uint8Array(n); // 0 known, 1 band, 2 unknown
    for (let p = 0; p < n; p++) { for (let c = 0; c < 3; c++) F[p * 3 + c] = s[p * 4 + c]; if (hole[p] > 0.5) flag[p] = 2; }
    // the band: unknown pixels next to a known one
    const heap = [], push = (t, p) => { heap.push([t, p]); let i = heap.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (heap[j][0] <= heap[i][0]) break; [heap[i], heap[j]] = [heap[j], heap[i]]; i = j; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[i], heap[m]] = [heap[m], heap[i]]; i = m; } } return top; };
    for (let p = 0; p < n; p++) if (flag[p] === 0) { T[p] = 0; const x = p % W, y = (p / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = x + dx, v = y + dy; if (u >= 0 && v >= 0 && u < W && v < H && flag[v * W + u] === 2) { flag[p] = 1; push(0, p); break; } } }
    for (let p = 0; p < n; p++) if (flag[p] === 1) flag[p] = 0; // known pixels stay known; the heap holds the edge
    const solve = (a, b, c, d) => { // the march's arrival time from two neighbours (eikonal)
      let r = 1e6; const t1 = a, t2 = b; if (Math.min(t1, t2) >= 1e6) return Math.min(c, d) + 1;
      const s2 = 2 - (t1 - t2) * (t1 - t2); if (s2 > 0) r = (t1 + t2 + Math.sqrt(s2)) / 2; else r = Math.min(t1, t2) + 1; return r; };
    const tAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1e6 : T[y * W + x]);
    const gradOf = (q, c) => { const x = q % W, y = (q / W) | 0, k = (u, v) => (u >= 0 && v >= 0 && u < W && v < H && flag[v * W + u] !== 2 ? v * W + u : -1); const xr = k(x + 1, y), xl = k(x - 1, y), yd = k(x, y + 1), yu = k(x, y - 1);
      const gx = xr >= 0 && xl >= 0 ? (F[xr * 3 + c] - F[xl * 3 + c]) / 2 : xr >= 0 ? F[xr * 3 + c] - F[q * 3 + c] : xl >= 0 ? F[q * 3 + c] - F[xl * 3 + c] : 0;
      const gy = yd >= 0 && yu >= 0 ? (F[yd * 3 + c] - F[yu * 3 + c]) / 2 : yd >= 0 ? F[yd * 3 + c] - F[q * 3 + c] : yu >= 0 ? F[q * 3 + c] - F[yu * 3 + c] : 0; return [gx, gy]; };
    while (heap.length) {
      const [, p] = pop(); const x = p % W, y = (p / W) | 0; if (flag[p] === 3) continue; flag[p] = 3; // 0 known, 1 filled and waiting, 2 still to fill, 3 done
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const u = x + dx, v = y + dy; if (u < 0 || v < 0 || u >= W || v >= H) continue; const q = v * W + u; if (flag[q] !== 2) continue;
        const t = Math.min(solve(tAt(u - 1, v), tAt(u, v - 1), tAt(u + 1, v), tAt(u, v + 1)), solve(tAt(u + 1, v), tAt(u, v - 1), 1e6, 1e6), solve(tAt(u - 1, v), tAt(u, v + 1), 1e6, 1e6), solve(tAt(u + 1, v), tAt(u, v + 1), 1e6, 1e6));
        T[q] = Math.min(T[q], t);
        // fill q from the known pixels round it
        const gTx = (tAt(u + 1, v) < 1e6 && tAt(u - 1, v) < 1e6 ? (tAt(u + 1, v) - tAt(u - 1, v)) / 2 : 0), gTy = (tAt(u, v + 1) < 1e6 && tAt(u, v - 1) < 1e6 ? (tAt(u, v + 1) - tAt(u, v - 1)) / 2 : 0);
        const acc = [0, 0, 0]; let ws = 0;
        for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
          const a = u + i, b = v + j; if (a < 0 || b < 0 || a >= W || b >= H) continue; const k = b * W + a; if (flag[k] === 2 || (i === 0 && j === 0)) continue; const d2 = i * i + j * j; if (d2 > R * R) continue;
          const dir = Math.max(1e-6, Math.abs((-i * gTx - j * gTy) / Math.sqrt(d2))), dst = 1 / d2, lev = 1 / (1 + Math.abs(T[q] - T[k])), w = dir * dst * lev;
          for (let c = 0; c < 3; c++) { const [gx, gy] = gradOf(k, c); acc[c] += w * (F[k * 3 + c] + slope * (gx * -i + gy * -j)); } ws += w;
        }
        if (ws > 0) for (let c = 0; c < 3; c++) F[q * 3 + c] = acc[c] / ws;
        flag[q] = 1; push(T[q], q);
      }
    }
    const out = new ImageData(new Uint8ClampedArray(s), W, H), d = out.data; for (let p = 0; p < n; p++) if (hole[p] > 0.5) for (let c = 0; c < 3; c++) d[p * 4 + c] = Math.round(F[p * 3 + c]);
    return out;
  }
  // a new background, a layer under everything: colour 1, a gradient or round glow from colour 1 to 2, a pattern in the
  // two colours, or the picture's own edges carried out to fill it
  async function makeBackground() {
    const W = cur.width, H = cur.height, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), st = T.bgStyle;
    if (st === 'solid') { x.fillStyle = T.col; x.fillRect(0, 0, W, H); }
    else if (st === 'gradient' || st === 'round') { const g = st === 'round' ? x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2) : x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, T.col); g.addColorStop(1, T.col2); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    else if (st === 'edges') { const F = flat(), hole = new Float32Array(W * H); let n = 0; for (let k = 0; k < hole.length; k++) if (F.data[k * 4 + 3] < 128) { hole[k] = 1; n++; } if (!n) return toast('The picture has no see-through background to carry its edges into.'); busy('Carrying the edges out…'); await new Promise((r) => setTimeout(r, 20)); const out = telea(F, hole); busy(); for (let k = 0; k < hole.length; k++) out.data[k * 4 + 3] = 255; x.putImageData(out, 0, 0); }
    else { const s2 = Math.max(4, Math.round(Math.min(W, H) / 12)); x.fillStyle = T.col2; x.fillRect(0, 0, W, H); x.fillStyle = T.col;
      for (let yy = 0; yy < H; yy += s2) for (let xx = 0; xx < W; xx += s2) { const i = Math.round(xx / s2), j = Math.round(yy / s2);
        if (st === 'checks' && (i + j) % 2) x.fillRect(xx, yy, s2, s2); else if (st === 'stripes' && i % 2) x.fillRect(xx, yy, s2, s2); else if (st === 'dots') { x.beginPath(); x.arc(xx + s2 / 2, yy + s2 / 2, s2 / 4, 0, 7); x.fill(); } } }
    const img = x.getImageData(0, 0, W, H); img.off = offOf(cur);
    layerChange(() => { layers.unshift({ name: 'Background', img, vis: true, op: 1, mask: null }); active++; });
    toast('A new background is the bottom layer (Layers: hide it, fade it, or paint its mask).');
  }
  // effects: an outline, a shadow or a glow round what the layer shows, as a layer under it
  function fxDo(a) {
    if (!cur) return; const W = cur.width, H = cur.height, r = Math.max(1, +T.fx || 6), src = layerCanvas(L0()), sil = document.createElement('canvas'); sil.width = W; sil.height = H;
    const sx = sil.getContext('2d'); sx.drawImage(src, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = a === 'shadow' ? '#000' : T.col; sx.fillRect(0, 0, W, H);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    if (a === 'outline') { for (let i = 0; i < 32; i++) { const t = (i / 32) * Math.PI * 2; for (const k of [0.5, 1]) x.drawImage(sil, Math.cos(t) * r * k, Math.sin(t) * r * k); } }
    else if (a === 'shadow') { x.filter = `blur(${r / 2}px)`; x.globalAlpha = 0.55; x.drawImage(sil, r * 0.7, r * 0.7); }
    else { x.filter = `blur(${r}px)`; for (let i = 0; i < 3; i++) x.drawImage(sil, 0, 0); }
    const img = x.getImageData(0, 0, W, H), name = { outline: 'Outline', shadow: 'Shadow', glow: 'Glow' }[a]; img.off = offOf(cur);
    layerChange(() => { layers.splice(active, 0, { name, img, vis: true, op: 1, mask: null }); active++; });
    toast(`${name}: a layer under this one (Layers: fade it, hide it, or Undo).`);
  }

  // ------------------------------------------------------------------ vector: the SVG traced from the picture, shown and recoloured before saving
  // vec: { svg, url, show, stale (the picture changed since), fills: [hex] }
  let vec = null;
  const PROFILES = [['icon', 'Icon (few, smooth shapes)'], ['web', 'Web (16 colours)'], ['balanced', 'Balanced'], ['detail', 'Detail'], ['pixelExact', 'Pixel exact (pixel art)']];
  function traceOf(img) { const o = { profile: T.vprofile || 'icon' }; if (+T.vcolors) o.colors = +T.vcolors; return CRAFT_RASTERTRACE.traceImage(img, o); }
  const fillsOf = (svg) => [...new Set((svg.match(/fill="#[0-9a-fA-F]{3,8}"/g) || []).map((f) => f.slice(6, -1).toLowerCase()))];
  function setVec(svg, show = true) { if (vec && vec.url) URL.revokeObjectURL(vec.url); vec = { svg, url: URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), show, stale: false, fills: fillsOf(svg) }; draw(); renderPanel(); }
  async function vecDo(a, v, to) {
    if (!cur) return;
    if (a === 'trace') { if (!window.CRAFT_RASTERTRACE) return toast('The tracer is not here.'); busy('Tracing…'); await new Promise((r) => setTimeout(r, 20)); try { const F = flat(), t = traceOf(F), m = await L.svgMatch(t.svg, F); setVec(t.svg); toast(`Traced: ${fillsOf(t.svg).length} colours, ${Math.round(t.svg.length / 1024)} KB. ${m.ok ? 'It matches the picture: Save keeps this SVG (until the picture changes).' : `It does not match the picture well (${m.wrong}% of it off): Save keeps the PNG only. Try a finer Detail.`}`); } catch (e) { toast('Tracing failed: ' + (e.message || e)); } finally { busy(); } return; }
    if (a === 'show') { if (!vec) return vecDo('trace'); vec.show = !vec.show; draw(); renderPanel(); return; }
    if (a === 'recolour' && vec) { const re = new RegExp(`fill="${v.replace('#', '#')}"`, 'gi'); setVec(vec.svg.replace(re, `fill="${to}"`), true); return; }
  }
  // the selection commands
  function selDo(a) {
    if (!cur) return; const n = cur.width * cur.height;
    if (a === 'all') return setSel(new Uint8Array(n).fill(1)); if (a === 'none') return setSel(null);
    if (a === 'invert') { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = sel && sel[k] ? 0 : 1; return setSel(o); }
    if (!sel) return toast('Select a part first.');
    if (maskEdit && L0().mask && ['erase', 'paint', 'keep', 'only'].includes(a)) { const m = new Uint8Array(L0().mask); for (let k = 0; k < n; k++) if (a === 'only' ? !sel[k] : sel[k]) m[k] = a === 'keep' ? 255 : 0; return layerChange(() => { layers[active] = { ...L0(), mask: m }; }); }
    if (a === 'only') { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = sel[k] ? 0 : 1; return change(applyMask(cur, o, 'erase')); }
    change(applyMask(cur, sel, a, fromImg(), rgbOf(T.col)));
  }

  // ------------------------------------------------------------------ Size up: four sizes to choose from, each shown at
  // its real pixels before anything changes. From the picture's drawing (an SVG that matches it, nothing changed yet) the
  // detail is new, at a whole number of pixels per unit of the drawing; otherwise the pixels are enlarged (smoother, no
  // new detail). Taken, it is a fresh start at that size: Undo starts again, Restore takes from the picture as sized.
  const SIZES = [600, 1200, 2400, 4800];
  let svgGood = false, sized = false;
  function sizeChoices() {
    const u = item.svg && svgGood && !past.length && layers.length === 1 ? L.svgUnits(item.svg) : null, now = Math.max(cur.width, cur.height);
    return SIZES.map((t) => {
      if (u) { const k = L.scaleFor(u, t), w = Math.round(u.w * k), h = Math.round(u.h * k); return { t, w, h, k, svg: true, ok: Math.max(w, h) > now }; }
      const f = t / now; return { t, w: Math.round(cur.width * f), h: Math.round(cur.height * f), f, svg: false, ok: f > 1.01 };
    });
  }
  const loadPic = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('That picture could not be drawn.')); i.src = src; });
  // a picture drawn at another size (smoothly); a mask the same way
  function enlarged(img, w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(canvasOf(img), 0, 0, w, h); return x.getImageData(0, 0, w, h); }
  function enlargedMask(m, W, H, w, h) { const a = new ImageData(W, H); for (let i = 0; i < m.length; i++) a.data[i * 4 + 3] = m[i]; const b = enlarged(a, w, h), o = new Uint8Array(w * h); for (let i = 0; i < o.length; i++) o[i] = b.data[i * 4 + 3]; return o; }
  // the middle of the part of a picture with the most edges (as fractions of its width and height)
  function busiest(img) {
    const W = img.width, H = img.height, d = img.data, G = 16, e = new Float64Array(G * G), v = (i) => (d[i] + d[i + 1] + d[i + 2]) * (d[i + 3] / 255);
    for (let y = 1; y < H; y++) for (let x = 1; x < W; x++) { const i = (y * W + x) * 4; e[Math.min(G - 1, Math.floor((y * G) / H)) * G + Math.min(G - 1, Math.floor((x * G) / W))] += Math.abs(v(i) - v(i - 4)) + Math.abs(v(i) - v(i - W * 4)); }
    let best = 0; for (let k = 1; k < e.length; k++) if (e[k] > e[best]) best = k;
    return { x: ((best % G) + 0.5) / G, y: (Math.floor(best / G) + 0.5) / G };
  }
  async function sizeUp() {
    if (!cur || busyNow) return; putDown(); closeText();
    const list = sizeChoices(), fromSvg = list[0].svg, src = fromSvg ? await loadPic(L.svgUrl(item.svg)) : canvasOf(flat()), mb = (c) => Math.max(1, Math.round((c.w * c.h * 4 * layers.length) / 1048576));
    const box = document.createElement('div'); box.className = 'ed-size'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Size up');
    box.innerHTML = `<div class="ed-size-in"><div class="lists-head"><b>Size up</b><span class="grow"></span><span class="hint">now ${cur.width} × ${cur.height}</span></div>
      <p class="hint">${fromSvg ? 'From its drawing (the SVG matches the picture): each size is drawn fresh, with new detail, at a whole number of pixels per unit.' : item.svg && past.length ? 'Enlarged from the pixels (changes made already, so not from its drawing): smoother, no new detail.' : 'Enlarged from the pixels (no drawing that matches it): smoother, no new detail.'} Each card shows the same small part, at that size’s own pixels.</p>
      <div class="ed-size-cards">${list.map((c, i) => `<button type="button" class="ed-size-card" data-i="${i}" ${c.ok ? '' : 'disabled'}><canvas width="150" height="150" class="check-bg"></canvas><b>${c.w} × ${c.h}</b><small>${c.ok ? (c.svg ? `${c.k} px per unit · new detail` : `× ${c.f.toFixed(2).replace(/\.?0+$/, '')} · enlarged`) : 'already this big'}</small><small class="hint">Undo: about ${mb(c)} MB a step${c.t >= 4800 ? ' (a heavy picture)' : ''}</small></button>`).join('')}</div>
      <p class="hint">Nothing changes until you choose a size and click Use this size. Undo starts again from the new size (Don’t save still goes back to how it was).</p>
      <div class="btns"><span class="grow"></span><button class="btn outline" type="button" data-sz="cancel">Cancel</button><button class="btn primary" type="button" data-sz="go" disabled>Use this size</button></div></div>`;
    el.append(box);
    // the same small part of the picture on every card (where it has the most edges), at each size's own pixels shown big:
    // what each size really holds
    const spot = busiest(flat()), fw = 1 / 16, fh = Math.min(1, fw * (cur.width / cur.height));
    box.querySelectorAll('.ed-size-card').forEach((b) => { const c = list[+b.dataset.i], n = Math.max(1, Math.round(fw * c.w)), m = Math.max(1, Math.round(fh * c.h)), k = document.createElement('canvas'); k.width = n; k.height = m;
      const kx = k.getContext('2d'); kx.imageSmoothingQuality = 'high'; kx.drawImage(src, -(spot.x - fw / 2) * c.w, -(spot.y - fh / 2) * c.h, c.w, c.h);
      const x = b.querySelector('canvas').getContext('2d'); x.imageSmoothingEnabled = false; const s2 = 150 / Math.max(n, m); x.drawImage(k, (150 - n * s2) / 2, (150 - m * s2) / 2, n * s2, m * s2); });
    let pick = null;
    return new Promise((done) => {
      box.addEventListener('click', async (e) => {
        const card = e.target.closest('.ed-size-card'); if (card && !card.disabled) { pick = list[+card.dataset.i]; box.querySelectorAll('.ed-size-card').forEach((b) => b.setAttribute('aria-pressed', b === card)); box.querySelector('[data-sz=go]').disabled = false; return; }
        const a = e.target.closest('[data-sz]'); if (!a) return;
        if (a.dataset.sz === 'go' && pick) { a.disabled = true; a.textContent = 'Sizing…'; await sizeTo(pick, src); }
        box.remove(); done(a.dataset.sz === 'go' ? pick : null);
      });
    });
  }
  async function sizeTo(c, src) {
    busy(`Sizing up to ${c.w} × ${c.h}…`); await new Promise((r) => setTimeout(r, 20));
    try {
      if (c.svg) { const k = document.createElement('canvas'); k.width = c.w; k.height = c.h; const x = k.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, c.w, c.h); const im = x.getImageData(0, 0, c.w, c.h); im.off = { x: 0, y: 0 }; layers = [{ ...layers[0], img: im, mask: null }]; orig = copy(im); }
      else {
        const f = c.w / cur.width, o = offOf(cur);
        layers = layers.map((l) => ({ ...l, img: enlarged(l.img, c.w, c.h), mask: l.mask ? enlargedMask(l.mask, l.img.width, l.img.height, c.w, c.h) : null }));
        layers[active].img.off = { x: Math.round(o.x * f), y: Math.round(o.y * f) }; orig = enlarged(orig, Math.round(orig.width * f), Math.round(orig.height * f));
      }
      active = Math.min(active, layers.length - 1); cur = L0().img; sheetFull = null; if (T.from === 'sheet') T.from = 'opened';
      sel = null; selView = null; past = []; future = []; vec = null; sized = true; zoom = 1;
      draw(); renderPanel(); status(); undoButtons(); toast(`Sized up to ${c.w} × ${c.h}${c.svg ? `, drawn from its SVG at ${c.k} px per unit` : ''}.`);
    } finally { busy(); }
  }
  async function save(asCopy) {
    putDown(); closeText(); const btns = el.querySelectorAll('[data-ed]'); btns.forEach((b) => { b.disabled = true; });
    try {
      const F = flat(), png = await new Promise((ok) => canvasOf(F).toBlob(ok, 'image/png')); let svg = vec && !vec.stale ? vec.svg : item.svg || null, saved = null;
      if (svg && !(await L.svgMatch(svg, F)).ok) svg = null;
      if (!svg && F.width * F.height <= 4e6) svg = (await L.traceMatched(F, [T.vprofile || 'icon', 'balanced'])).svg;
      const lost = !!item.svg && !svg;
      const fresh = await L.makeItem({ name: item.name, png, svg });
      if (asCopy) { const o = offOf(cur), it = { ...item, ...fresh, id: fresh.id, cutAt: item.cutAt && !sized ? { x: item.cutAt.x + o.x, y: item.cutAt.y + o.y, w: cur.width, h: cur.height } : undefined, name: item.name, serverId: undefined, links: undefined, pngFirst: undefined, edited: new Date().toISOString() }; delete it.serverId; delete it.links; delete it.pngFirst; await L.put(it); toast(`Saved as a copy: “${it.name}”.`); saved = it; }
      else { if (!item.pngFirst) { item.pngFirst = item.png; if (item.cutAt) item.cutAtFirst = item.cutAt; } if (item.cutAt && sized) { if (!item.cutAtFirst) item.cutAtFirst = item.cutAt; delete item.cutAt; } else if (item.cutAt) { const o = offOf(cur); item.cutAt = { x: item.cutAt.x + o.x, y: item.cutAt.y + o.y, w: cur.width, h: cur.height }; } Object.assign(item, { png, svg, noSvg: !svg, thumb: fresh.thumb, width: fresh.width, height: fresh.height, edited: new Date().toISOString() }); if (item.serverId) item.changed = true; await L.put(item); toast(`Saved “${item.name}” (${cur.width} × ${cur.height})${lost ? ': its drawing (SVG) no longer matched the picture, so it is a PNG only now (Edit the drawing keeps a drawing)' : ''}.`); saved = item; }
      past = []; future = []; close(); if (opts.done) await opts.done(saved);
    } catch (e) { console.error(e); toast('Saving failed: ' + (e.message || e)); btns.forEach((b) => { b.disabled = false; }); }
  }
  async function backToFirst() { if (!item.pngFirst) return; const first = await imageOf(item.pngFirst), a = item.cutAt, f = item.cutAtFirst; first.off = a && f ? { x: f.x - a.x, y: f.y - a.y } : { x: 0, y: 0 }; if (layers.length > 1) layerChange(() => { layers = [layers[active]]; active = 0; }); change(first); toast('Back to the very first version: Save to keep it.'); }

  function build() {
    el = document.createElement('div'); el.className = 'slicer editor'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Touch up');
    el.innerHTML = `<div class="sl-bar"><b>Touch up</b><span class="hint ed-name"></span><span class="ed-navs" hidden><button class="btn outline ed-nav" type="button" data-ed="prev" title="The previous picture (Page Up)"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="currentColor" opacity=".16"/><path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Previous</span></button><b class="ed-pos"></b><button class="btn outline ed-nav" type="button" data-ed="next" title="The next picture (Page Down)"><span>Next</span><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="currentColor" opacity=".16"/><path d="M9.5 6.5 15 12l-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></span><span class="grow"></span><button class="btn outline" type="button" data-ed="size" title="Four bigger sizes to choose from, each shown at real size first (from its drawing when it has a matching SVG: new detail)">Size up…</button><button class="btn outline ed-drawing" type="button" data-ed="drawing" hidden title="This picture has an SVG: edit it as a drawing (its shapes and words), and Save makes the drawing the picture">Edit the drawing</button><button class="btn outline" type="button" data-ed="close">Close</button></div>
      <div class="sl-main"><div class="sl-left"><div class="imp-tools sl-tools" role="toolbar"><button class="btn outline" type="button" data-hist="undo" disabled title="Undo (Ctrl+Z)">↶ Undo</button><button class="btn outline" type="button" data-hist="redo" disabled title="Redo (Ctrl+Y)">↷ Redo</button><span class="sep"></span>
        <div class="seg" role="group"><button class="btn" type="button" data-z="out">−</button><button class="btn sl-zoom" type="button" data-z="fit">Fit</button><button class="btn" type="button" data-z="in">+</button></div><button class="btn outline" type="button" data-z="100">100%</button></div>
        <div class="sl-desk"><div class="sl-stage"><canvas class="ed-canvas"></canvas></div></div><div class="sl-status"></div></div><aside class="sl-side side right"></aside></div>`;
    const cv = el.querySelector('.ed-canvas'); cv.style.cursor = 'crosshair'; cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('dblclick', () => { if (poly) { poly.pts.pop(); closePoly(); } });
    const d = el.querySelector('.sl-desk'); let pan = null;
    d.addEventListener('wheel', (e) => { e.preventDefault(); setZoom(zoom * Math.pow(1.15, e.deltaY < 0 ? 1 : -1), { x: e.clientX, y: e.clientY }); }, { passive: false });
    d.addEventListener('pointerdown', (e) => { if (e.button !== 1) return; e.preventDefault(); pan = { x: e.clientX, y: e.clientY, l: d.scrollLeft, t: d.scrollTop }; d.setPointerCapture(e.pointerId); });
    d.addEventListener('pointermove', (e) => { if (pan) { d.scrollLeft = pan.l - (e.clientX - pan.x); d.scrollTop = pan.t - (e.clientY - pan.y); } });
    d.addEventListener('pointerup', () => { pan = null; }); d.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
    el.addEventListener('click', (e) => {
      const h = e.target.closest('[data-hist]'); if (h) { if (h.dataset.hist === 'undo') undo(); else redo(); return; }
      const z = e.target.closest('[data-z]'); if (z) { const v = z.dataset.z; if (v === 'fit') setZoom(1); else if (v === '100') setZoom(1 / fitScale()); else { const r = desk().getBoundingClientRect(); setZoom(zoom * (v === 'in' ? 1.25 : 0.8), { x: r.left + r.width / 2, y: r.top + r.height / 2 }); } return; }
      const sb = e.target.closest('[data-sel]'); if (sb) { selDo(sb.dataset.sel); return; }
      const lv = e.target.closest('[data-lvis]'); if (lv) { layerDo('vis', lv.dataset.lvis); return; }
      const lp = e.target.closest('[data-lpick]'); if (lp) { layerDo('pick', lp.dataset.lpick); return; }
      const ly = e.target.closest('[data-ly]'); if (ly) { layerDo(ly.dataset.ly); return; }
      const vc = e.target.closest('[data-vec]'); if (vc) { vecDo(vc.dataset.vec); return; }
      const sw = e.target.closest('[data-sw]'); if (sw) { setT('col', sw.dataset.sw); return; }
      if (e.target.closest('[data-addcol]')) { addColour(); return; }
      if (e.target.closest('[data-swapcol]')) { const c = T.col; T.col = T.col2; setT('col2', c); return; }
      const t = e.target.closest('[data-t]'); if (t) { const [k, v] = t.dataset.t.split(':'); setT(k, v); return; }
      const b = e.target.closest('[data-bg]'); if (b) { bgView = b.dataset.bg; draw(); renderPanel(); return; }
      const c = e.target.closest('[data-clean]'); if (c) { const k = c.dataset.clean, v = +(el.querySelector(`[data-cv="${k}"]`).value) || CLEAN[k].value; T['cv_' + k] = v; keepT(); const out = CLEAN[k].run(cur, v, fromImg()); change(out); toast(`${CLEAN[k].label}: done (Undo takes it back).`); return; }
      const a = e.target.closest('[data-ed]'); if (!a) return; if (a.dataset.ed === 'close') { if (opts.onClose) return opts.onClose(); if (past.length && !confirm('Close without saving the changes?')) return; close(); return; }
      if (a.dataset.ed === 'drawing') return opts.drawing && opts.drawing();
      if (a.dataset.ed === 'size') return sizeUp();
      if (a.dataset.ed === 'prev' || a.dataset.ed === 'next') return opts.nav && opts.nav.step(a.dataset.ed === 'next' ? 1 : -1);
      if (a.dataset.ed === 'save') return save(false); if (a.dataset.ed === 'copy') return save(true); if (a.dataset.ed === 'first') return backToFirst();
    });
    el.addEventListener('dblclick', (e) => { const lp = e.target.closest('[data-lpick]'); if (lp && !e.target.closest('[data-lvis]')) layerDo('rename', lp.dataset.lpick); });
    el.addEventListener('contextmenu', (e) => { const sw = e.target.closest('.ed-sw'); if (sw && (T.mine || []).includes(sw.dataset.sw)) { e.preventDefault(); dropColour(sw.dataset.sw); } });
    el.addEventListener('input', (e) => { if (e.target.matches('[data-lop]')) el.querySelectorAll('[data-lop]').forEach((x) => { if (x !== e.target) x.value = e.target.value; }); const n = e.target.dataset.n; if (n) { T[n] = +e.target.value; keepT(); el.querySelectorAll(`[data-n="${n}"]`).forEach((x) => { if (x !== e.target) x.value = e.target.value; }); if (n === 'fsize' && flt && flt.text) { flt.img = textImg(flt.text); flt.c = null; draw(); } tell(); } if (e.target.matches('[data-col]')) { T.col = e.target.value; keepT(); const c = el.querySelector('.ed-colour code'); if (c) c.textContent = T.col; } });
    el.addEventListener('change', (e) => { if (e.target.matches('[data-lop]')) layerDo('op', +e.target.value); if (e.target.dataset.vfill) vecDo('recolour', e.target.dataset.vfill, e.target.value); if (e.target.matches('[data-col]')) setT('col', e.target.value); if (e.target.matches('[data-col2]')) setT('col2', e.target.value); const k = e.target.dataset.chk; if (k) setT(k, e.target.checked); if (e.target.dataset.s) setT(e.target.dataset.s, e.target.value); });
    document.addEventListener('keydown', (e) => {
      if (!el || el.hidden) return; if (poly) { if (e.key === 'Enter') { e.preventDefault(); closePoly(e.altKey); return; } if (e.key === 'Escape') { e.preventDefault(); poly = null; preview(null); return; } if (e.key === 'Backspace') { e.preventDefault(); poly.pts.pop(); if (!poly.pts.length) { poly = null; preview(null); } return; } }
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if ((e.key === 'PageDown' || e.key === 'PageUp') && opts.nav && !e.ctrlKey) { e.preventDefault(); opts.nav.step(e.key === 'PageDown' ? 1 : -1); return; }
      if (flt && !e.ctrlKey && !e.metaKey) { if (e.key === 'Enter') { e.preventDefault(); putDown(); return; } if (e.key === 'Escape' || e.key === 'Delete') { e.preventDefault(); dropFloat(); return; } }
      if (e.ctrlKey || e.metaKey) { const k = e.key.toLowerCase(); if (k === 'c' && !String(getSelection())) { e.preventDefault(); copySel(false); } else if (k === 'x') { e.preventDefault(); copySel(true); } else if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); } else if (k === 'a') { e.preventDefault(); selDo('all'); } else if (k === 'd') { e.preventDefault(); selDo('none'); } else if (k === 'i' && e.shiftKey) { e.preventDefault(); selDo('invert'); } else if (k === 'j') { e.preventDefault(); layerDo(sel ? 'fromsel' : 'dup'); } return; }
      if (sel && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); selDo('erase'); } else if (sel && e.key === 'Escape') { e.preventDefault(); selDo('none'); }
    });
    document.addEventListener('paste', (e) => { if (!el || el.hidden || !cur || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return; e.preventDefault(); const f = [...(e.clipboardData ? e.clipboardData.files : [])].find((x) => x.type.startsWith('image/')); pasteNow(f || null); });
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
    opts = o; item = it; if (!el) build(); el.classList.toggle('embedded', !!o.mount); if (o.mount) o.mount.insertBefore(el, o.before || null); else document.body.append(el);
    el.querySelector('[data-ed=close]').textContent = o.mount ? 'Back to the library' : 'Close'; el.hidden = false; past = []; future = []; zoom = 1; poly = null; sel = null; selView = null; flt = null; closeText(); maskEdit = false; vec = null;
    el.querySelectorAll('[data-ed]').forEach((b) => { b.disabled = false; });
    sized = false; svgGood = false; if (it.svg) L.svgMatch(it.svg, it.png).then((m) => { if (item === it) svgGood = m.ok; }).catch(() => {});
    cur = await imageOf(it.png); cur.off = { x: 0, y: 0 }; orig = copy(cur); layers = [{ name: 'Picture', img: cur, vis: true, op: 1, mask: null }]; active = 0; sheetFull = await sheetOf(it); if (!sheetPart() && T.from === 'sheet') T.from = 'opened';
    el.querySelector('.ed-name').textContent = it.name; navBar(); el.querySelector('.ed-drawing').hidden = !(it.svg && o.drawing); renderPanel(); draw(); status(); const d = desk(); d.scrollLeft = d.scrollTop = 0;
  }
  // Previous / Next (when Touch up is going through a set of pictures): where this one is in it
  function navBar() { const n = el.querySelector('.ed-navs'), t = opts.nav ? opts.nav.label() : ''; n.hidden = !t; el.querySelector('.ed-pos').textContent = t; }
  function close() { if (el) el.hidden = true; poly = null; preview(null); }
  // shown again (its tab chosen again): the picture and its changes as they were
  function show() { if (el && item) { el.hidden = false; draw(); status(); } }
  window.ClipArtEditor = { open, close, show, save, undo, redo, layerDo, bgDo, fxDo, vecDo, layers: () => layers.map((l, i) => ({ name: l.name, vis: l.vis, op: l.op, mask: !!l.mask, active: i === active })), maskEditing: () => maskEdit, busy: () => busyNow, mendSel: async (ai) => { if (!sel) return toast('Select the part to mend first.'); const h = new Float32Array(sel.length); for (let k = 0; k < sel.length; k++) h[k] = sel[k]; try { change(await mend(cur, h, ai)); } catch (e) { busy(); toast('Mending failed: ' + (e.message || e)); } }, PROFILES, _flat: () => flat(), hasVec: () => !!vec, vecShown: () => !!(vec && vec.show), T: () => T, setT, addColour, dropColour, FONTS, palette: () => (cur ? pictureColours() : []), copy: () => copySel(false), cut: () => copySel(true), paste: () => pasteNow(), selDo, hasSel: () => !!sel, floating: () => !!flt, putDown, isOpen: () => !!(el && !el.hidden && item), item: () => item, changed: () => past.length > 0 || sized, sizeUp, CLEAN, applyShape, wand, regionOf, applyMask, _state: () => ({ sel: selCount(), tool: T.tool, col: T.col, w: cur && cur.width, h: cur && cur.height, past: past.length, sheet: sheetPart(), off: cur ? offOf(cur) : null, solid: cur ? (() => { let n = 0; for (let i = 3; i < cur.data.length; i += 4) if (cur.data[i] >= 24) n++; return Math.round((100 * n) / (cur.width * cur.height)); })() : 0 }) };
})();
