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
    // see-through: a real share of it is clear (AI-made pictures are 98-99% solid all over, which is not see-through)
    { let k = 0; for (let p = 0; p < n; p++) if (d[p * 4 + 3] < 128 && ++k > n * 0.01) { clear = true; break; } }
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
  // Two pictures close together can be found as one (a medal beside a sign, a boat under a soldier's boots). A picture
  // more than twice the usual size is looked at again joining only what truly touches: if it falls apart into two or more
  // big parts, those are pictures of their own (each small bit goes with the big part nearest to it).
  function splitJoined(sheet, W, H) {
    const items = sheet.items; if (items.length < 3) return sheet;
    const areas = items.map((b) => b.w * b.h).sort((a, b) => a - b), median = areas[areas.length >> 1] || 1;
    let next = 0; for (let p = 0; p < sheet.lab.length; p++) if (sheet.lab[p] > next) next = sheet.lab[p];
    const out = [];
    for (const b of items) {
      if (b.w * b.h < median * 2) { out.push(b); continue; } // (twice the usual size: one picture made of two parts stays whole)
      // the item's own picture pixels, joined only where they touch (8 ways)
      const w = b.w, h = b.h, comp = new Int32Array(w * h), st = new Int32Array(w * h), parts = []; let k = 0;
      const own = (x, y) => { const p = (b.y + y) * W + b.x + x; return sheet.lab[p] === b.id && sheet.m[p]; };
      for (let s0 = 0; s0 < w * h; s0++) {
        if (comp[s0] || !own(s0 % w, (s0 / w) | 0)) continue; k++; let top = 0, x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0; st[top++] = s0; comp[s0] = k;
        while (top) { const q = st[--top], x = q % w, y = (q / w) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const r = ny * w + nx; if (!comp[r] && own(nx, ny)) { comp[r] = k; st[top++] = r; } } }
        parts.push({ k, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, n });
      }
      const total = parts.reduce((a, c) => a + c.n, 0), bigs = parts.filter((c) => c.n >= total * 0.08 && c.w * c.h >= median * 0.25);
      if (bigs.length < 2) { out.push(b); continue; }
      // every part goes with the nearest big one (a big one is its own)
      const gap = (a, c) => Math.max(0, a.x - (c.x + c.w), c.x - (a.x + a.w)) + Math.max(0, a.y - (c.y + c.h), c.y - (a.y + a.h));
      const owner = new Map(); for (const c of parts) owner.set(c.k, bigs.includes(c) ? c : bigs.slice().sort((p1, p2) => gap(c, p1) - gap(c, p2))[0]);
      const ids = new Map(bigs.map((c, i) => [c, i === 0 ? b.id : ++next])), box = new Map(bigs.map((c) => [c, { x0: W, y0: H, x1: -1, y1: -1, area: 0 }]));
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = comp[y * w + x]; if (!c) continue; const big = owner.get(c), bb = box.get(big), gx = b.x + x, gy = b.y + y; sheet.lab[gy * W + gx] = ids.get(big); bb.area++; if (gx < bb.x0) bb.x0 = gx; if (gx > bb.x1) bb.x1 = gx; if (gy < bb.y0) bb.y0 = gy; if (gy > bb.y1) bb.y1 = gy; }
      // the grown ring round the picture (the see-through edge): each pixel to the nearest big part's label
      const pad = 10; for (let y = Math.max(0, b.y - pad); y < Math.min(H, b.y + b.h + pad); y++) for (let x = Math.max(0, b.x - pad); x < Math.min(W, b.x + b.w + pad); x++) {
        const p = y * W + x; if (sheet.lab[p] !== b.id || sheet.m[p]) continue; let best = null, bd = 1e9; for (const [c, bb] of box) { const d = Math.max(0, bb.x0 - x, x - bb.x1) + Math.max(0, bb.y0 - y, y - bb.y1); if (d < bd) { bd = d; best = c; } } sheet.lab[p] = ids.get(best); }
      for (const [c, bb] of box) if (bb.x1 >= 0) out.push({ id: ids.get(c), x: bb.x0, y: bb.y0, w: bb.x1 - bb.x0 + 1, h: bb.y1 - bb.y0 + 1, area: bb.area });
    }
    const rows = []; out.sort((a, b) => a.y - b.y);
    for (const b of out) { const r = rows.find((row) => b.y < row.mid); if (r) r.items.push(b); else rows.push({ mid: b.y + b.h * 0.6, items: [b] }); }
    sheet.items = rows.flatMap((r) => r.items.sort((a, b) => a.x - b.x)); return sheet;
  }
  // Pieces of one picture can come apart (a sign's posts, smoke, a rifle). Each small piece joins the big picture it
  // touches or sits close to (within a little of the sheet's size); a tiny speck with nothing near is left out.
  function combine(sheet, W, H) {
    const items = sheet.items; if (items.length < 2) return sheet;
    const areas = items.map((b) => b.w * b.h).sort((a, b) => a - b), big = areas[Math.floor(areas.length * 0.75)] || 1;
    const reach = Math.max(4, Math.round(Math.hypot(W, H) * 0.012)), small = (b) => b.w * b.h < big * 0.12;
    const near = (a, b) => a.x - reach <= b.x + b.w && b.x - reach <= a.x + a.w && a.y - reach <= b.y + b.h && b.y - reach <= a.y + a.h;
    const gap = (a, b) => Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w)) + Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h));
    let keep = items.filter((b) => !small(b)); const out = new Set();
    for (const b of items.filter(small)) {
      const host = keep.filter((k) => near(b, k)).sort((x, y) => gap(b, x) - gap(b, y))[0];
      if (host) { // the piece becomes part of its host: same label, and the host's box grows round it
        for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { const p = y * W + x; if (sheet.lab[p] === b.id) sheet.lab[p] = host.id; }
        const x0 = Math.min(host.x, b.x), y0 = Math.min(host.y, b.y), x1 = Math.max(host.x + host.w, b.x + b.w), y1 = Math.max(host.y + host.h, b.y + b.h); Object.assign(host, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      } else if (b.w * b.h < big * 0.02) out.add(b); else keep.push(b);
    }
    // in reading order again
    keep = keep.filter((b) => !out.has(b)).sort((a, b) => a.y - b.y); const rows = [];
    for (const b of keep) { const r = rows.find((row) => b.y < row.mid); if (r) r.items.push(b); else rows.push({ mid: b.y + b.h * 0.6, items: [b] }); }
    sheet.items = rows.flatMap((r) => r.items.sort((a, b) => a.x - b.x)); return sheet;
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
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = Math.round(a.x + c * cw + inset), y = Math.round(a.y + r * ch + inset), x1 = Math.round(a.x + (c + 1) * cw - inset), y1 = Math.round(a.y + (r + 1) * ch - inset); if (x1 - x > 2 && y1 - y > 2) out.push({ x, y, w: x1 - x, h: y1 - y, r, c }); }
    return out;
  }
  // one grid cell: the whole cell (its background see-through or not), or its picture found in it and cut out
  // (everything in the cell kept together)
  // (ctol: how close to the page counts as page when cutting out; lower keeps more of a light picture)
  function gridItem(img, cell, { cut = true, see = true, pad = 6, tol = 40, ctol = 40 } = {}) {
    const c = cropOf(img, cell.x, cell.y, cell.w, cell.h); c.at = { ...cell }; if (!cut) return see ? boxClear(c, tol) : c;
    const sh = splitSheet(c, { gap: Math.max(c.width, c.height), min: 0.002, tolerance: ctol }); if (!sh.items.length) return c;
    const keep = new Set(sh.items.map((i) => i.id)), x0 = Math.min(...sh.items.map((i) => i.x)), y0 = Math.min(...sh.items.map((i) => i.y)), x1 = Math.max(...sh.items.map((i) => i.x + i.w)), y1 = Math.max(...sh.items.map((i) => i.y + i.h));
    for (let p = 0; p < sh.lab.length; p++) if (keep.has(sh.lab[p])) sh.lab[p] = 1;
    const o = sheetItem(c, sh, { id: 1, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, { pad, see }); o.at = { x: cell.x + o.at.x, y: cell.y + o.at.y, w: o.at.w, h: o.at.h }; return o;
  }
  // a whole box, its background made see-through: the colour of its corners, reached from the edges (so the same colour
  // inside the picture stays), then clean edges
  function boxClear(src, tolerance = 40) {
    const w = src.width, h = src.height, o = new ImageData(new Uint8ClampedArray(src.data), w, h), d = o.data, bg = cornerBg(src), out = new Uint8Array(w * h), st = new Int32Array(w * h); let top = 0;
    const near = (k) => d[k * 4 + 3] < 16 || Math.abs(d[k * 4] - bg[0]) + Math.abs(d[k * 4 + 1] - bg[1]) + Math.abs(d[k * 4 + 2] - bg[2]) <= tolerance;
    const push = (k) => { if (!out[k] && near(k)) { out[k] = 1; st[top++] = k; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); } for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (top) { const k = st[--top], x = k % w, y = (k / w) | 0; if (x > 0) push(k - 1); if (x < w - 1) push(k + 1); if (y > 0) push(k - w); if (y < h - 1) push(k + w); }
    for (let k = 0; k < w * h; k++) if (out[k]) d[k * 4 + 3] = 0;
    const r = defringe(o, bg, { reach: 2 }); r.at = src.at; return r;
  }
  // one found picture: cut out of the sheet (see sheetItem), or its whole box (with room round it) as it is on the sheet
  function findItem(img, sheet, item, { cut = true, see = true, pad = 6, tol = 40 } = {}) {
    if (cut) return sheetItem(img, sheet, item, { pad, see });
    const x0 = Math.max(0, item.x - pad), y0 = Math.max(0, item.y - pad), x1 = Math.min(img.width, item.x + item.w + pad), y1 = Math.min(img.height, item.y + item.h + pad);
    const c = cropOf(img, x0, y0, x1 - x0, y1 - y0); c.at = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; return see ? boxClear(c, tol) : c;
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

  // Words written into a PNG file itself (iTXt chunks, UTF-8, after the header), so they go wherever the file goes:
  // other programs show them as the picture's title, description and keywords.
  let crcT = null;
  const crc32 = (u8) => { if (!crcT) { crcT = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; } } let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  async function pngText(blob, fields) {
    const src = new Uint8Array(await blob.arrayBuffer()), enc = new TextEncoder(), chunks = [];
    for (const [k, v] of Object.entries(fields)) { if (!v) continue; const body = new Uint8Array([...enc.encode(k), 0, 0, 0, 0, 0, ...enc.encode(String(v))]), type = enc.encode('iTXt'), c = new Uint8Array(12 + body.length), dv = new DataView(c.buffer);
      dv.setUint32(0, body.length); c.set(type, 4); c.set(body, 8); const both = new Uint8Array(4 + body.length); both.set(type); both.set(body, 4); dv.setUint32(8 + body.length, crc32(both)); chunks.push(c); }
    if (!chunks.length || src.length < 33) return blob; const at = 33; // the signature (8) and the header chunk (25)
    return new Blob([src.slice(0, at), ...chunks, src.slice(at)], { type: 'image/png' });
  }
  // ------------------------------------------------------------------ the slicer window
  const S = { combine: true, mode: 'find', gap: 0, min: 0.2, pad: 6, see: true, rows: 3, cols: 3, inset: 0, cut: true, tol: 16, edges: { t: 'auto', b: 'auto', l: 'auto', r: 'auto' }, roomPx: 2, view: 'result', names: '', category: '', svg: true, autoread: true, quick: false, touch: { shape: 'box', op: 'keep', side: 'in' }, showNames: true, showBoxes: true };
  try { Object.assign(S, JSON.parse(localStorage.getItem('clipartcraft-slicer') || '{}'), { names: '', category: '', notext: false }); } catch (e) { /* blocked storage */ }
  const keep = () => { try { const { names, category, notext, ...rest } = S; localStorage.setItem('clipartcraft-slicer', JSON.stringify(rest)); } catch (e) { /* blocked */ } };
  let sheetFile = null, sheet = null, sheetName = '', found = null, boxes = [], skip = new Set(), el = null, timer = 0, opts = {};
  // Per sheet, in the sheet's pixels: the main area (only it is cut; null = all of it), parts ruled out, the table found,
  // rows and columns left out, their names (row labels, column headings), captions read, and boxes moved by hand
  // (keyed by where the box was found). `work` is the main area with ruled-out parts and left-out text painted over as
  // page: everything is found and cut from it; (wx, wy) is where it sits on the sheet.
  let area = null, outs = [], table = null, offRows = new Set(), offCols = new Set(), rowNames = [], colNames = [], captions = [], readText = new Map(), moved = new Map(), prefs = new Map(), splits = new Map(), zones = [], marks = [], joins = [], chosenBoxes = new Set(), sheetTitle = '', tool = 'pick', work = null, wx = 0, wy = 0;
  const keyOf = (b) => `${Math.round(b.x + wx)},${Math.round(b.y + wy)},${Math.round(b.w)},${Math.round(b.h)}`;
  function prep() {
    const a = area || { x: 0, y: 0, w: sheet.width, h: sheet.height }; wx = a.x; wy = a.y; work = cropOf(sheet, a.x, a.y, a.w, a.h); pagePlain = null;
    let clear = false, k = 0; for (let i = 3; i < work.data.length; i += 4) if (work.data[i] < 128 && ++k > work.data.length / 400) { clear = true; break; }
    work.page = clear ? null : cornerBg(work);
    for (const o of outs) paint(work, { x: o.x - wx, y: o.y - wy, w: o.w, h: o.h }, work.page);
  }
  // The main area moved by hand over rows or columns the table does not have (a row of faint pictures taken for part of
  // the headings): the table is carried on into it at its own row height (or column width) and line spacing, as many
  // as fit; whatever was there before (the wrong kind of row) gives way.
  function fitTable() {
    if (S.mode !== 'table' || !table || !area) return;
    const grow = (list, kinds, lo, hi) => {
      const pics = list.map((r, i) => i).filter((i) => kinds[i] === 'pic'); if (!pics.length) return;
      const size = median(pics.map((i) => list[i][1] - list[i][0] + 1)), gaps = pics.slice(1).map((i, k) => list[i][0] - list[pics[k]][1] - 1), gap = gaps.length ? Math.max(1, median(gaps)) : 4;
      const add = (span) => { for (let i = list.length - 1; i >= 0; i--) if (list[i][1] >= span[0] && list[i][0] <= span[1]) { list.splice(i, 1); kinds.splice(i, 1); } let at = list.findIndex((r) => r[0] > span[0]); if (at < 0) at = list.length; list.splice(at, 0, span); kinds.splice(at, 0, 'pic'); };
      for (let n = 0; n < 30; n++) { const f = list[list.findIndex((r, i) => kinds[i] === 'pic')], span = [f[0] - gap - size, f[0] - gap - 1]; if (span[0] < lo - size * 0.35) break; add([Math.max(0, span[0]), span[1]]); }
      for (let n = 0; n < 30; n++) { const ps = list.map((r, i) => i).filter((i) => kinds[i] === 'pic'), l = list[ps[ps.length - 1]], span = [l[1] + gap + 1, l[1] + gap + size]; if (span[1] > hi + size * 0.35) break; add(span); }
    };
    // the names already read (or typed) stay with their own rows and columns: new ones before them push them along
    const firstPic = (list, kinds) => { const i = kinds.indexOf('pic'); return i < 0 ? 0 : list[i][0]; }, r0 = firstPic(table.rows, table.rowKind), c0 = firstPic(table.cols, table.colKind);
    const nr = table.rowKind.filter((k) => k === 'pic').length, nc = table.colKind.filter((k) => k === 'pic').length;
    grow(table.rows, table.rowKind, area.y, area.y + area.h); grow(table.cols, table.colKind, area.x, area.x + area.w);
    const before = (list, kinds, at) => list.filter((r, i) => kinds[i] === 'pic' && r[0] < at).length, ar = before(table.rows, table.rowKind, r0), ac = before(table.cols, table.colKind, c0);
    const shift = (arr, n) => [...Array(n).fill(''), ...arr], shiftSet = (set, n) => new Set([...set].map((i) => i + n));
    if (ar) { rowNames = shift(rowNames, ar); offRows = shiftSet(offRows, ar); } if (ac) { colNames = shift(colNames, ac); offCols = shiftSet(offCols, ac); }
    // new rows or columns: their labels are read too (when reading by itself is on)
    if ((table.rowKind.filter((k) => k === 'pic').length !== nr || table.colKind.filter((k) => k === 'pic').length !== nc) && S.autoread !== false) setTimeout(() => readLabels(null, true), 0);
  }
  // the table's picture cells in the work's pixels, each with its row and column (counted over picture rows and columns);
  // a cell whose edge is not plain (a photo) is kept whole
  function tableCells() {
    const t = table, out = [], W = work.width, H = work.height, pr = t.rows.map((r, i) => i).filter((i) => t.rowKind[i] === 'pic'), pc = t.cols.map((c, j) => j).filter((j) => t.colKind[j] === 'pic');
    pr.forEach((i, r) => pc.forEach((j, c) => {
      const x0 = Math.max(0, t.cols[j][0] + 2 - wx), y0 = Math.max(0, t.rows[i][0] + 2 - wy), x1 = Math.min(W - 1, t.cols[j][1] - 2 - wx), y1 = Math.min(H - 1, t.rows[i][1] - 2 - wy);
      if (x1 - x0 < 8 || y1 - y0 < 8) return; const ring = ringOf(onWhite(cropOf(work, x0, y0, x1 - x0 + 1, y1 - y0 + 1)), 0, 0, x1 - x0, y1 - y0);
      out.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, r, c, whole: ring.even < 0.7, row: i, col: j });
    }));
    return out;
  }
  const rowCount = () => (S.mode === 'table' && table ? table.rowKind.filter((k) => k === 'pic').length : S.mode === 'grid' ? Math.max(1, +S.rows | 0) : 0);
  const colCount = () => (S.mode === 'table' && table ? table.colKind.filter((k) => k === 'pic').length : S.mode === 'grid' ? Math.max(1, +S.cols | 0) : 0);
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
      <button class="btn outline" type="button" data-sl="open" title="Choose one sheet or several (they are done one after another)">${sheet ? 'Other sheets…' : 'Choose sheets…'}</button>
      ${queueN > 1 ? `<div class="sl-queue"><span><b>Sheet ${queueN - queue.length} of ${queueN}</b>${queue.length ? ` · next: ${esc(queue[0].name)}` : ' · the last one'}</span><button class="btn outline sm" type="button" data-sl="skip">${queue.length ? 'Skip to the next' : 'Skip it'}</button></div>` : ''}
      ${autoSaid ? `<p class="hint auto-said">${esc(autoSaid)} <small>Change anything below.</small></p>` : ''}
      <div class="field"><span>Show</span><div class="seg" role="group"><button class="btn" type="button" data-view="result" aria-pressed="${S.view === 'result'}">The result (live)</button><button class="btn" type="button" data-view="boxes" aria-pressed="${S.view === 'boxes'}">The boxes</button></div></div>
      <div class="field"><span>How to cut</span><div class="seg" role="group"><button class="btn" type="button" data-mode="find" aria-pressed="${S.mode === 'find'}">Find the pictures</button><button class="btn" type="button" data-mode="grid" aria-pressed="${S.mode === 'grid'}">Grid</button><button class="btn" type="button" data-mode="table" aria-pressed="${S.mode === 'table'}">Table</button></div></div>
      ${areaHtml()}
      ${S.mode === 'table' ? `<p class="hint">For a table of pictures between ruled lines, with headings and row labels (left out, and they can name the pictures).</p>
        ${table ? `<p class="hint">${table.rowKind.filter((k) => k === 'pic').length} rows × ${table.colKind.filter((k) => k === 'pic').length} columns of pictures${table.rowKind.some((k) => k === 'head') ? ', headings above' : ''}${table.colKind.includes('label') ? ', row labels at the side' : ''}${table.rowKind.includes('caption') ? ', a caption row under each' : ''}.</p>` : '<p class="hint warn">No ruled lines found on this sheet: try Grid.</p>'}
        ${S.cut ? field('Room round each (pixels)', num('pad', 0, 80)) : ''}`
      : S.mode === 'find' ? `<p class="hint">For pictures with space round them on a plain or old-paper background.</p>
        ${field('Join parts closer than (pixels; 0 = automatic)', num('gap', 0, 200))}
        ${field('Smallest picture (% of the sheet)', num('min', 0, 10, 0.05))}
        ${field('Room round each (pixels)', num('pad', 0, 80))}
        ${chk('combine', 'Join small pieces to the picture they sit by (smoke, posts, loose bits)')}`
      : `<p class="hint">For montages whose pictures sit in equal cells, even touching.</p>
        <div class="two">${field('Rows', num('rows', 1, 30))}${field('Columns', num('cols', 1, 30))}</div>
        ${field('Trim off each cell’s edge (pixels: borders, gutters)', num('inset', 0, 200))}
        ${S.cut ? field('Room round each (pixels)', num('pad', 0, 80)) : ''}`}
      ${chk('cut', S.mode === 'find' ? 'Cut each picture out (off: its whole box)' : 'Cut each picture out of its cell (off: the whole cell)')}
      ${chk('see', 'See-through background')}
      ${roomHtml()}
      ${S.see && !S.cut ? field('How close to the background counts as background <small class="hint">(lower keeps light parts, like a white tile)</small>', num('tol', 1, 120)) : ''}
      <p class="hint">${S.cut ? (S.see ? 'Each picture cut out, the background see-through.' : 'Each picture cut out, the background colour kept.') : (S.see ? 'Each picture is its whole box (a tile keeps its own shape and colour); only the page round it is see-through.' : 'Each picture is its whole box, exactly as on the sheet.')}</p>
      <div id="sl-names"></div>
      <div class="field"><span>Names, in order <small class="hint">(one per line or with commas; these come first)</small></span><textarea class="input" rows="4" data-k="names" placeholder="Barn, Bible, Buffalo…">${esc(S.names)}</textarea></div>
      ${field('Category', `<input class="input" data-k="category" list="sl-cats" value="${esc(S.category)}" placeholder="Empty: sorted by the AI"><datalist id="sl-cats">${cats}</datalist>`)}
      <p class="hint">Each picture is added as PNG and SVG: ${svgSheet ? 'this sheet is an SVG, so each is cut out of the drawing itself' : 'the SVG is traced from the picture'}.</p>
      <p class="hint" id="sl-count"></p>
      ${chk('quick', 'Add straight away when nothing looks wrong (no review)')}
      <button class="btn primary wide" type="button" data-sl="add" ${sheet ? '' : 'disabled'}>Add to the library</button>
      <p class="hint">Click a box on the sheet to leave that picture out (or put it back); drag its edges to make it bigger or smaller.</p></div>`;
  }
  // the main area, ruled-out parts and text: what a drag on the sheet does, and the margins as numbers
  const TOOLS = { pick: 'Click a box to leave it out; Ctrl-click several to join them (right-click); drag a box’s edge to move it (to trim off a name, or take in a bit that was missed).', area: 'Drag a box round the part to cut: everything outside it is left out. Drag its edges to move them.', out: 'Drag a box over anything to leave out (a title, a label, a watermark, a picture). Click one to take it away again.', solid: 'Draw a box, an ellipse or a lasso on a picture (lasso: drag to draw freehand, click or Shift-click for straight corners, close on the first corner, a double-click or Enter; Backspace takes a corner off, Escape cancels; hold Alt to erase with that one). Keep puts that part back exactly as on the sheet (a face the colour of the page); Erase makes it see-through. Outside does it to the rest of that picture instead. They are done after everything automatic, in order; click one to take it away.', grid: 'Drag a box over a row or a part that came out wrong, then say how many pictures across and down: it is cut as that grid. Right-click one of its pictures to change or remove it.' };
  function areaHtml() {
    if (!sheet) return '';
    const a = area || { x: 0, y: 0, w: sheet.width, h: sheet.height }, m = { t: a.y, l: a.x, b: sheet.height - a.y - a.h, r: sheet.width - a.x - a.w };
    return `<div class="field"><span>On the sheet</span><div class="seg" role="group"><button class="btn" type="button" data-tool="pick" aria-pressed="${tool === 'pick'}">Pick</button><button class="btn" type="button" data-tool="area" aria-pressed="${tool === 'area'}">Main area</button><button class="btn" type="button" data-tool="out" aria-pressed="${tool === 'out'}">Rule out</button><button class="btn" type="button" data-tool="grid" aria-pressed="${tool === 'grid'}">Grid here</button><button class="btn" type="button" data-tool="solid" aria-pressed="${tool === 'solid'}">Touch up</button></div></div>
      ${tool === 'solid' ? (() => { const t = S.touch || {}, seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button class="btn" type="button" data-touch="${k}:${v}" aria-pressed="${t[k] === v}">${l}</button>`).join('')}</div>`;
        return `<div class="touch-opts"><div class="field"><span>Shape</span>${seg('shape', [['box', 'Box'], ['ellipse', 'Ellipse'], ['lasso', 'Lasso']])}</div><div class="field"><span>Do</span>${seg('op', [['keep', 'Keep (add)'], ['erase', 'Erase (subtract)']])}</div><div class="field"><span>Where</span>${seg('side', [['in', 'Inside'], ['out', 'Outside']])}</div></div>`; })() : ''}
      <div class="btns hist-row"><button class="btn outline sm" type="button" data-hist="undo" ${past.length ? '' : 'disabled'} title="Undo (Ctrl+Z)">↶ Undo</button><button class="btn outline sm" type="button" data-hist="redo" ${future.length ? '' : 'disabled'} title="Redo (Ctrl+Y)">↷ Redo</button>${tool !== 'pick' ? `<button class="btn primary sm" type="button" data-tool="pick" title="Apply and go back to choosing cells (Esc)">✓ Apply</button>` : ''}</div>
      <p class="hint">${TOOLS[tool]}</p>
      <div class="field"><span>Main area: margins <small class="hint">(pixels left off each side)</small></span><div class="four">${[['t', 'Top'], ['b', 'Bottom'], ['l', 'Left'], ['r', 'Right']].map(([k, w]) => `<label><small>${w}</small><input class="input" type="number" min="0" step="1" data-m="${k}" value="${Math.round(m[k])}"></label>`).join('')}</div></div>
      <div class="btns"><button class="btn outline sm" type="button" data-sl="whole" ${area ? '' : 'disabled'}>Whole sheet</button><button class="btn outline sm" type="button" data-sl="clear-outs" ${outs.length ? '' : 'disabled'}>Clear ${outs.length || ''} ruled out</button>${marks.length ? `<button class="btn outline sm" type="button" data-sl="unsolid">Clear ${marks.length} touch-up${marks.length === 1 ? '' : 's'}</button>` : ''}${zones.length ? `<button class="btn outline sm" type="button" data-sl="unzone">Remove ${zones.length} grid${zones.length === 1 ? '' : 's'} set by hand</button>` : ''}${moved.size || prefs.size || splits.size ? `<button class="btn outline sm" type="button" data-sl="unmove">Undo ${moved.size + splits.size + [...prefs.keys()].filter((k) => !moved.has(k)).length} changed box${moved.size + prefs.size + splits.size === 1 ? '' : 'es'}</button>` : ''}</div>
      ${chk('notext', 'Leave out text: labels and captions (they can become names)')}`;
  }
  // a table's (or grid's) rows and columns: untick to leave one out; row labels name the pictures, column headings
  // become a tag. Captions read under pictures name them too.
  // Headings are remembered (in this browser): the ones used before are offered while typing, and the last sheet's can
  // fill a new sheet's columns at once (sheets made from one template share them)
  const HEADS = 'clipartcraft-headings';
  // named lists of headings (a template's columns), to fill a sheet's columns in one go; the style table's comes first
  const STARTER = { 'Classic to modern (7 styles)': ['Original Pixel Clip Art', 'Restored Original', 'Modern Illustrated Sticker', 'Dimensional Puffy Sticker', 'Glazed / Resin Collectible', 'Modern Realistic Illustration', 'Contemporary Realism'] };
  const heads = () => { let h; try { h = JSON.parse(localStorage.getItem(HEADS) || 'null'); } catch (e) { h = null; } h = { all: [], last: [], ...(h || {}) }; if (!h.sets) h.sets = { ...STARTER }; return h; };
  const saveHeads = (h) => { try { localStorage.setItem(HEADS, JSON.stringify(h)); } catch (e) { /* blocked */ } };
  function rememberHeads() { const now = colNames.map((h) => String(h || '').trim()); if (!now.some(Boolean)) return; const h = heads(); h.last = now; h.all = [...new Set([...now.filter(Boolean), ...h.all])].slice(0, 200); saveHeads(h); }
  function renderNames() {
    const box = el && el.querySelector('#sl-names'); if (!box) return;
    const R = rowCount(), C = colCount(), caps = captions.filter((t) => t.own).length;
    const list = (n, off, names, kind, word) => `<div class="rc-list">${Array.from({ length: n }, (_, i) => `<label class="rc"><input type="checkbox" data-${kind}="${i}" ${off.has(i) ? '' : 'checked'} title="Untick to leave this ${word} out"><input class="input" data-${kind}name="${i}" value="${esc(names[i] || '')}" placeholder="${word === 'row' ? 'Row' : 'Column'} ${i + 1}"${kind === 'col' ? ' list="sl-heads"' : ''}></label>`).join('')}</div>`;
    box.innerHTML = `${R ? `<div class="field"><span>Rows <small class="hint">(the label names each picture in the row)</small></span>${list(R, offRows, rowNames, 'row', 'row')}</div>` : ''}
      ${C ? `<datalist id="sl-heads">${heads().all.map((h) => `<option value="${esc(h)}">`).join('')}</datalist><div class="field"><span>Headings from a list</span><div class="head-sets"><select class="input" data-headset>${Object.entries(heads().sets).map(([n, l]) => `<option value="${esc(n)}">${esc(n)} (${l.length})</option>`).join('')}</select><button class="btn outline sm" type="button" data-sl="useset">Use</button></div>
        <div class="btns"><button class="btn ghost sm" type="button" data-sl="saveset">Save these headings as a list…</button><button class="btn ghost sm" type="button" data-sl="delset">Remove the list</button>${heads().last.some(Boolean) ? `<button class="btn ghost sm" type="button" data-sl="lastheads" title="${esc(heads().last.filter(Boolean).join(' · '))}">The last sheet’s (${heads().last.filter(Boolean).length})</button>` : ''}</div></div>` : ''}
      ${C ? `<div class="field"><span>Columns <small class="hint">(the heading becomes a tag, like the style)</small></span>${list(C, offCols, colNames, 'col', 'column')}</div>` : ''}
      <label class="field"><span>Sheet title <small class="hint">(kept with every picture as its collection)</small></span><input class="input" data-title value="${esc(sheetTitle)}" placeholder="${esc(sheetName)}"></label>
      ${chk('autoread', 'Read them by itself when a sheet opens (when the AI is downloaded)')}
      ${(S.mode === 'table' && table) || caps ? `<button class="btn outline" type="button" ${readingNow ? 'disabled' : ''} data-sl="read" title="The describing AI (Florence-2, about 250 MB once) reads the words in the row labels, headings and captions">${readingNow || readLabel()}</button>` : ''}`;
  }
  // room at the edges: a box whose four sides are clicked through yellow (auto: where a picture touches), blue (always)
  // and grey (none); the counts say how many pictures touch each side now
  let touchCount = { t: 0, b: 0, l: 0, r: 0 };
  const SIDE = { t: 'top', b: 'bottom', l: 'left', r: 'right' };
  function roomHtml() {
    const e = { t: 'auto', b: 'auto', l: 'auto', r: 'auto', ...(S.edges || {}) }, word = { auto: 'auto', on: 'always', off: 'none' };
    const say = ['t', 'b', 'l', 'r'].map((k) => `${SIDE[k]}: ${word[e[k]]}${e[k] === 'auto' ? ` (${touchCount[k]} touch${touchCount[k] === 1 ? 'es' : ''})` : ''}`).join(' · ');
    return `<div class="field"><span>Room at the edges <small class="hint">(see-through space round each picture: click a side)</small></span>
      <div class="room-row"><svg class="room-box" viewBox="0 0 64 64" role="group" aria-label="Room at the edges: click a side">
        <rect x="16" y="16" width="32" height="32" rx="3" class="room-pic"/>
        ${[['t', 'M10 8H54'], ['b', 'M10 56H54'], ['l', 'M8 10V54'], ['r', 'M56 10V54']].map(([k, d]) => `<path d="${d}" class="room-side ${e[k]}" data-side="${k}"><title>${SIDE[k]}: ${word[e[k]]} (click to change)</title></path>`).join('')}</svg>
        <div class="room-ctl"><div class="btns"><button class="btn outline" type="button" data-edges="auto">All auto</button><button class="btn outline" type="button" data-edges="off">Clear all</button></div>
        <label class="field"><span>Pixels</span>${num('roomPx', 0, 200)}</label></div>
        <p class="hint"><span class="room-key auto"></span> auto (only where a picture touches) <span class="room-key on"></span> always <span class="room-key off"></span> none<br>${say}${S.see ? '' : '<br>See-through is off, so auto sides get no room.'}</p></div></div>`;
  }
  function renderPanel() { el.querySelector('.sl-side').innerHTML = panel(); count(); renderNames(); }
  function count() { status(); const c = el.querySelector('#sl-count'); if (!c) return; const n = boxes.length - skip.size; c.innerHTML = sheet ? `<b>${n}</b> picture${n === 1 ? '' : 's'} to add${skip.size ? ` (${skip.size} left out)` : ''}.` : ''; const a = el.querySelector('[data-sl=add]'); if (a) { a.disabled = !n; a.textContent = n ? `Add ${n} to the library` : 'Add to the library'; } }
  function find() {
    if (!sheet) return;
    prep(); captions = []; const W = work.width, H = work.height;
    if (S.mode === 'find') {
      // words on the sheet (captions) are taken off first, so they are neither pictures nor joined to one
      if (S.notext) for (const t of sheetText(work)) { captions.push(t); paint(work, { x: t.x - 2, y: t.y - 2, w: t.w + 4, h: t.h + 4 }, work.page); }
      found = splitSheet(work, { gap: +S.gap, min: Math.max(0.0005, S.min / 100) }); splitJoined(found, W, H); if (S.combine !== false) combine(found, W, H); boxes = found.items.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, item: b }));
    } else {
      found = null; boxes = S.mode === 'table' && table ? tableCells() : gridCells(work, { rows: Math.max(1, +S.rows | 0), cols: Math.max(1, +S.cols | 0), inset: +S.inset });
      if (S.notext) for (const b of boxes) { if (b.whole) continue; const bg = work.page ? cornerBg(cropOf(work, b.x, b.y, b.w, b.h)) : null; for (const t of textBits(work, b)) { if (t.below) captions.push({ ...t, own: b }); paint(work, { x: t.x - 2, y: t.y - 2, w: t.w + 4, h: t.h + 4 }, bg); } }
      // a table's caption rows: each cell names the picture above it
      if (S.mode === 'table' && table) table.rows.forEach((r, i) => { if (table.rowKind[i] !== 'caption') return; let up = i - 1; while (up >= 0 && table.rowKind[up] !== 'pic') up--; if (up < 0) return;
        table.cols.forEach((c, j) => { const own = boxes.find((b) => b.row === up && b.col === j); if (own) captions.push({ x: c[0] + 2 - wx, y: r[0] + 1 - wy, w: c[1] - c[0] - 3, h: r[1] - r[0] - 1, below: true, own }); }); });
      boxes = boxes.filter((b) => !offRows.has(b.r) && !offCols.has(b.c));
    }
    // a caption belongs to the picture just above it
    for (const t of captions) if (!t.own) { let best = null, bd = 1e9; for (const b of boxes) { const cx = t.x + t.w / 2; if (cx < b.x - 4 || cx > b.x + b.w + 4) continue; const g = t.y - (b.y + b.h); if (g > -t.h && g < bd) { bd = g; best = b; } } t.own = best; }
    // boxes moved by hand (found where they were found before)
    // a part of the sheet set by hand as a grid (Grid here): its cells replace whatever was found in it, in the same place in
    // the order; in a table each cell keeps the row and column it sits in (for its label and heading)
    for (const [zi, z] of zones.entries()) {
      const zx = z.x - wx, zy = z.y - wy, inside = (b) => { const cx = b.x + b.w / 2, cy = b.y + b.h / 2; return cx >= zx && cx <= zx + z.w && cy >= zy && cy <= zy + z.h; };
      const at = boxes.findIndex(inside), cells = [];
      for (let r = 0; r < z.rows; r++) for (let c = 0; c < z.cols; c++) { const x = Math.round(zx + (z.w * c) / z.cols), y = Math.round(zy + (z.h * r) / z.rows), cw = Math.round(zx + (z.w * (c + 1)) / z.cols) - x, ch = Math.round(zy + (z.h * (r + 1)) / z.rows) - y;
        const cell = { x: x + 2, y: y + 2, w: cw - 4, h: ch - 4, fixed: true, zone: zi, zr: r, zc: c };
        if (S.mode === 'table' && table) { const pr = table.rows.map((q, i) => i).filter((i) => table.rowKind[i] === 'pic'), pc = table.cols.map((q, j) => j).filter((j) => table.colKind[j] === 'pic'), sx = x + cw / 2 + wx, sy = y + ch / 2 + wy;
          const ri = pr.findIndex((i) => sy >= table.rows[i][0] && sy <= table.rows[i][1]), ci = pc.findIndex((j) => sx >= table.cols[j][0] && sx <= table.cols[j][1]); if (ri >= 0) cell.r = ri; if (ci >= 0) cell.c = ci; }
        cells.push(cell); }
      const rest = boxes.filter((b) => !inside(b)); boxes = at < 0 ? [...rest, ...cells] : [...rest.slice(0, boxes.slice(0, at).filter((b) => !inside(b)).length), ...cells, ...rest.slice(boxes.slice(0, at).filter((b) => !inside(b)).length)];
    }
    const fit = (b) => { const m = moved.get(b.key), pf = prefs.get(b.key); if (m) Object.assign(b, { x: m.x - wx, y: m.y - wy, w: m.w, h: m.h, fixed: true }); if (pf) Object.assign(b, pf); return b; };
    for (const b of boxes) { b.key = b.zone !== undefined ? `zone:${zones[b.zone].x},${zones[b.zone].y}/${b.zr}/${b.zc}` : keyOf(b); fit(b); }
    // boxes split by hand into 2 or 3 (side by side, or one above the other); each part can be moved and set on its own
    boxes = boxes.flatMap((b) => { const sp = splits.get(b.key); if (!sp) return [b]; const out = [];
      for (let i = 0; i < sp.k; i++) { const part = sp.down ? { x: b.x, y: b.y + (b.h * i) / sp.k, w: b.w, h: b.h / sp.k } : { x: b.x + (b.w * i) / sp.k, y: b.y, w: b.w / sp.k, h: b.h };
        out.push(fit({ ...b, item: null, x: Math.round(part.x), y: Math.round(part.y), w: Math.round(part.w), h: Math.round(part.h), fixed: true, key: `${b.key}/${i}`, part: i })); }
      return out; });
    // boxes joined by hand: one box over all of them, where the first one was
    for (const j of joins) { const at = boxes.findIndex((b) => j.keys.includes(b.key)); if (at < 0) continue;
      const one = { x: j.rect.x - wx, y: j.rect.y - wy, w: j.rect.w, h: j.rect.h, fixed: true, key: 'join:' + j.keys.join('+'), joined: j.keys.length, r: boxes[at].r, c: boxes[at].c, row: boxes[at].row, col: boxes[at].col };
      boxes = [...boxes.slice(0, at).filter((b) => !j.keys.includes(b.key)), fit(one), ...boxes.slice(at).filter((b) => !j.keys.includes(b.key))]; }
    skip = new Set([...skip].filter((i) => i < boxes.length)); draw(); count(); renderNames();
  }
  // What the sheet itself says about a picture, which is more than an AI can see: the row's label (its subject; words in
  // brackets are another name for it), the column's heading (how it is drawn, matched to a style on the lists), the
  // sheet's title (the set it belongs to) and where it sat.
  const STYLE_WORDS = [[/pixel|8-?bit|16-?bit|sprite/i, 'pixel art'], [/line ?art|outline|lineart/i, 'line art'], [/silhouette/i, 'silhouette'], [/water ?colou?r/i, 'watercolour'], [/oil|painting/i, 'oil painting'],
    [/puffy|dimensional|3-?d\b|render|glaze|resin|clay|plastic/i, '3D render'], [/realism|realistic|photo/i, 'photo'], [/cartoon|comic|anime/i, 'cartoon'], [/hand-?drawn|sketch|pencil|ink/i, 'hand-drawn'], [/flat|vector|icon/i, 'flat icon'], [/sticker|clip ?art|illustrat/i, 'clip art']];
  function styleFor(heading) { const list = (window.CraftNamer && CraftNamer.STYLES) || []; for (const [re, st] of STYLE_WORDS) if (re.test(heading) && (!list.length || list.includes(st))) return st; return ''; }
  function metaOf(b) {
    const label = labelOf(b), heading = headingOf(b), m = label.match(/^(.*?)\s*\(([^)]*)\)\s*$/), subject = (m ? m[1] : label).trim(), also = m ? m[2].trim() : '';
    const title = String(sheetTitle || '').trim(), style = heading ? styleFor(heading) : '';
    const tags = [...new Set([heading, also, ...(also ? [] : []), title && !/^set\b/i.test(title) ? title : ''].filter(Boolean).map((t) => t.toLowerCase()))];
    const where = b.r !== undefined ? `row ${b.r + 1}, column ${b.c + 1}` : '';
    const description = [subject ? `${subject}${also ? ` (${also})` : ''}` : '', heading ? `drawn as “${heading}”${style ? ` (${style})` : ''}` : '', title ? `from the sheet “${title}”` : '', where].filter(Boolean).join(', ');
    return { subject, also, heading, style, title, tags, description: description ? description.charAt(0).toUpperCase() + description.slice(1) + '.' : '', where, fromSheet: !!(subject || heading) };
  }
  // what a box is called from the sheet itself: its row's label or the caption read under it; its column's heading
  const labelOf = (b) => { const t = captions.find((c) => c.own === b && readText.get(keyOf(c))); return (b.r !== undefined && rowNames[b.r]) || (t ? readText.get(keyOf(t)) : '') || ''; };
  const headingOf = (b) => (b.c !== undefined && colNames[b.c]) || '';
  // one picture as it will be added (the same cutting as Add uses); a box moved by hand is cut from just that box
  const cutOne = (b) => edgeRoom(baseCut(b), Math.max(0, +S.roomPx || 0), edgesNow());
  // a box's picture before any room is added: a photo cell whole as it is; a box set to "whole box" not cut out; its
  // shadow taken off when asked
  function baseCut(b) {
    const o0 = { cut: S.cut, see: S.see, pad: +S.pad, tol: +S.tol || 16 }, o = b.whole ? { ...o0, cut: false, see: false } : b.boxOnly ? { ...o0, cut: false } : b.cutOut ? { ...o0, cut: true } : o0;
    // a box with its own "how much background" is cut from just its box, at that setting
    const own = b.ctol ? { ...o, ctol: b.ctol, tol: Math.max(4, Math.round((b.ctol / 40) * o.tol)) } : o;
    let img = b.fixed || S.mode !== 'find' || b.ctol ? gridItem(work, b.fixed || S.mode !== 'find' ? b : (() => { const sb = sheetBox(b); return { x: Math.max(0, Math.round(sb.x - wx)), y: Math.max(0, Math.round(sb.y - wy)), w: Math.round(sb.w), h: Math.round(sb.h) }; })(), own) : findItem(work, found, b.item, o);
    // A cell cut out can lose light parts that touch the page (a realistic picture's highlights on white): the whole cell
    // with only the page reached from its edges cleared (strictly) keeps them. When cutting out keeps clearly less, that is used.
    if (S.mode !== 'find' && o === o0 && S.cut && S.see && !b.ctol) {
      const alt = gridItem(work, b, { ...o, cut: false, see: true }), n = (q) => { let k = 0; for (let i = 3; i < q.data.length; i += 4) if (q.data[i] > 128) k++; return k; };
      if (n(img) < n(alt) * 0.85 && n(alt) < alt.width * alt.height * 0.85) img = alt; // (and it did clear the page: at least 15% of the cell)
    }
    if (b.fillShape) img = fillShape(img);
    if (b.noShadow) img = dropShadow(img, pageOf(b));
    if (b.wand && b.wand.length) img = wandApply(img, b.wand);
    return marks.length ? applyMarks(img) : img;
  }
  // Touch-ups, after everything automatic, in the order they were made: a box or lasso shape (sheet pixels) that keeps
  // (puts back exactly as on the sheet) or erases (makes see-through) what is inside it, or what is outside it within the
  // picture it was drawn on (the one whose box holds its middle).
  const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const midOf = (pts) => [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length];
  function applyMarks(img) {
    const at = img.at || { x: 0, y: 0 }, W = img.width, H = img.height, src = work.data, SW = work.width, ox = wx + at.x, oy = wy + at.y; let o = null;
    for (const mk of marks) {
      const xs = mk.pts.map((q) => q[0]), ys = mk.pts.map((q) => q[1]), bx0 = Math.min(...xs) - ox, bx1 = Math.max(...xs) - ox, by0 = Math.min(...ys) - oy, by1 = Math.max(...ys) - oy;
      if (mk.side === 'out') { const [mx, my] = midOf(mk.pts); if (mx < ox || my < oy || mx >= ox + W || my >= oy + H) continue; }
      else if (bx1 < 0 || by1 < 0 || bx0 >= W || by0 >= H) continue;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.beginPath(); mk.pts.forEach(([px, py], i) => (i ? x.lineTo(px - ox, py - oy) : x.moveTo(px - ox, py - oy))); x.closePath(); x.fill(); const m = x.getImageData(0, 0, W, H).data;
      if (!o) o = new ImageData(new Uint8ClampedArray(img.data), W, H); const d = o.data;
      for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const k = (y * W + xx) * 4, inside = m[k + 3] > 127; if (inside !== (mk.side !== 'out')) continue;
        if (mk.op === 'erase') { d[k + 3] = 0; continue; }
        const sx = at.x + xx, sy = at.y + y; if (sx >= SW || sy >= work.height) continue; const q = (sy * SW + sx) * 4; d[k] = src[q]; d[k + 1] = src[q + 1]; d[k + 2] = src[q + 2]; d[k + 3] = src[q + 3]; }
    }
    if (!o) return img; o.at = img.at; return o;
  }
  // Everything inside the outline of what was kept, brought back as it is on the sheet: for a solid thing whose face is
  // the colour of the page (a silver drive on light grey). The outline is the convex hull of the kept pixels.
  function fillShape(img) {
    const W = img.width, H = img.height, d = img.data, pts = [];
    for (let y = 0; y < H; y++) { let a = -1, b = -1; for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) { if (a < 0) a = x; b = x; } if (a >= 0) { pts.push([a, y]); if (b !== a) pts.push([b, y]); } }
    if (pts.length < 3) return img; pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const hull = [...lo.slice(0, -1), ...hi.slice(0, -1)], c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
    x.beginPath(); hull.forEach(([px, py], i) => (i ? x.lineTo(px + 0.5, py + 0.5) : x.moveTo(px + 0.5, py + 0.5))); x.closePath(); x.fill(); const m = x.getImageData(0, 0, W, H).data;
    const o = new ImageData(new Uint8ClampedArray(d), W, H), at = img.at || { x: 0, y: 0 }, src = work.data, SW = work.width;
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const k = (y * W + xx) * 4; if (m[k + 3] < 128 || d[k + 3] > 200) continue; const sx = at.x + xx, sy = at.y + y; if (sx >= SW || sy >= work.height) continue; const q = (sy * SW + sx) * 4; o.data[k] = src[q]; o.data[k + 1] = src[q + 1]; o.data[k + 2] = src[q + 2]; o.data[k + 3] = src[q + 3]; }
    o.at = img.at; return o;
  }
  // The magic wand, at points clicked on the sheet: from each, everything joined to it of about the same colour (on the
  // sheet as it is) is made see-through ("erase") or brought back as it is on the sheet ("keep").
  function wandApply(img, pts) {
    const o = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), d = o.data, W = img.width, H = img.height, at = img.at || { x: 0, y: 0 }, src = work.data, SW = work.width;
    for (const pt of pts) {
      const lx = Math.round(pt.x - wx - at.x), ly = Math.round(pt.y - wy - at.y); if (lx < 0 || ly < 0 || lx >= W || ly >= H) continue;
      const sp = (x, y) => ((at.y + y) * SW + at.x + x) * 4, s0 = sp(lx, ly), seed = [src[s0], src[s0 + 1], src[s0 + 2]], tol = pt.tol || 30, seen = new Uint8Array(W * H), st = [ly * W + lx]; seen[ly * W + lx] = 1;
      while (st.length) { const k = st.pop(), x = k % W, y = (k / W) | 0, q = sp(x, y); if (at.x + x >= SW || at.y + y >= work.height) continue;
        if (Math.abs(src[q] - seed[0]) + Math.abs(src[q + 1] - seed[1]) + Math.abs(src[q + 2] - seed[2]) > tol) continue;
        if (pt.keep) { d[k * 4] = src[q]; d[k * 4 + 1] = src[q + 1]; d[k * 4 + 2] = src[q + 2]; d[k * 4 + 3] = src[q + 3]; } else d[k * 4 + 3] = 0;
        for (const n of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1]) if (n >= 0 && !seen[n]) { seen[n] = 1; st.push(n); } }
    }
    o.at = img.at; return o;
  }
  // the page round a box: the sheet's own, or (a cell) its corners'
  const pageOf = (b) => (work.page && S.mode === 'find' ? work.page : cornerBg(cropOf(work, b.x, b.y, b.w, b.h)));
  // is a pixel a shadow on the page? a darker shade of the page's own colour (grey on white, deep blue on light blue),
  // or on a see-through sheet a dark, half see-through pixel
  function shadowy(d, i, page) {
    if (d[i + 3] < 16) return true; if (!page) return d[i + 3] < 220 && d[i] + d[i + 1] + d[i + 2] < 300;
    const k = [0, 1, 2].map((c) => (d[i + c] + 1) / (page[c] + 1)), m = (k[0] + k[1] + k[2]) / 3;
    return m > 0.35 && m < 0.97 && Math.max(...k) - Math.min(...k) < 0.12;
  }
  // a cut picture with its shadow taken off: from the see-through outside, inwards over shadow (the picture itself stops it)
  function dropShadow(img, page) {
    const W = img.width, H = img.height, o = new ImageData(new Uint8ClampedArray(img.data), W, H), d = o.data, seen = new Uint8Array(W * H), st = new Int32Array(W * H); let top = 0;
    const push = (k) => { if (!seen[k] && shadowy(d, k * 4, page)) { seen[k] = 1; st[top++] = k; } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (top) { const k = st[--top], x = k % W, y = (k / W) | 0; if (x > 0) push(k - 1); if (x < W - 1) push(k + 1); if (y > 0) push(k - W); if (y < H - 1) push(k + W); }
    for (let k = 0; k < W * H; k++) if (seen[k]) d[k * 4 + 3] = 0;
    const r = page ? defringe(o, page, { reach: 2 }) : o; r.at = img.at; return r;
  }
  // a box drawn tight round what is in it (in the work's pixels): everything that is not page, or not page or shadow
  function snapBox(b, keepShadow) {
    const sb = sheetBox(b), x0 = Math.max(0, Math.round(sb.x - wx)), y0 = Math.max(0, Math.round(sb.y - wy)), x1 = Math.min(work.width, Math.round(sb.x - wx + sb.w)), y1 = Math.min(work.height, Math.round(sb.y - wy + sb.h));
    const page = work.page ? (S.mode === 'find' ? work.page : cornerBg(cropOf(work, x0, y0, x1 - x0, y1 - y0))) : null, d = work.data, W = work.width; let X0 = 1e9, Y0 = 1e9, X1 = -1, Y1 = -1;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4;
      const pg = page ? Math.abs(d[i] - page[0]) + Math.abs(d[i + 1] - page[1]) + Math.abs(d[i + 2] - page[2]) <= 40 : d[i + 3] < 16; if (pg || (!keepShadow && shadowy(d, i, page))) continue;
      if (x < X0) X0 = x; if (x > X1) X1 = x; if (y < Y0) Y0 = y; if (y > Y1) Y1 = y; }
    if (X1 < 0) return null; const m = 2; X0 = Math.max(0, X0 - m); Y0 = Math.max(0, Y0 - m); X1 = Math.min(W - 1, X1 + m); Y1 = Math.min(work.height - 1, Y1 + m);
    return { x: X0 + wx, y: Y0 + wy, w: X1 - X0 + 1, h: Y1 - Y0 + 1 };
  }
  // how many pictures across and down a part of the sheet holds (asked when a Grid here box is drawn or changed)
  function askGrid(b, z) {
    const guess = z ? `${z.cols} x ${z.rows}` : (() => { const n = boxes.filter((q) => { const cx = q.x + wx + q.w / 2, cy = q.y + wy + q.h / 2; return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h; }).length; return b.w > b.h * 2 ? `${Math.max(1, n)} x 1` : `${Math.max(1, n)}`; })();
    const v = prompt('How many pictures across, and how many rows down? (for example 7, or 7 x 2)', guess); if (v === null) return null;
    const m = String(v).match(/(\d+)\s*(?:[x×*,\s]\s*(\d+))?/i); if (!m) return null; const cols = Math.max(1, Math.min(60, +m[1])), rows = Math.max(1, Math.min(60, +(m[2] || 1)));
    return { cols, rows };
  }
  // the chosen boxes (Ctrl-click) joined into one picture: the box round them all
  function joinChosen() {
    const bs = boxes.filter((b) => chosenBoxes.has(b.key)); if (bs.length < 2) return;
    const r = bs.map(sheetBox), x0 = Math.min(...r.map((q) => q.x)), y0 = Math.min(...r.map((q) => q.y)), x1 = Math.max(...r.map((q) => q.x + q.w)), y1 = Math.max(...r.map((q) => q.y + q.h));
    const keys = bs.flatMap((b) => (b.key.startsWith('join:') ? (joins.find((j) => 'join:' + j.keys.join('+') === b.key) || { keys: [b.key] }).keys : [b.key]));
    joins = joins.filter((j) => !j.keys.some((k) => keys.includes(k))); joins.push({ keys, rect: clampBox({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }) });
    chosenBoxes.clear(); skip.clear(); renderPanel(); find(); opts.toast && opts.toast(`${bs.length} joined into one picture.`);
  }
  // a table's row joined with the one below (a row cut in two), or a column with the next: every column (row) at once
  function joinTable(b, down) {
    const list = down ? table.rows : table.cols, kinds = down ? table.rowKind : table.colKind, i = down ? b.row : b.col; let n = i + 1; while (n < list.length && kinds[n] !== 'pic' && kinds[n] !== 'caption' && kinds[n] !== 'gap') n++;
    if (n >= list.length) return opts.toast && opts.toast(down ? 'There is no row below it.' : 'There is no column after it.');
    list.splice(i, n - i + 1, [list[i][0], list[n][1]]); kinds.splice(i, n - i + 1, 'pic');
    if (down) { offRows.clear(); rowNames = []; } else { offCols.clear(); colNames = []; }
    skip.clear(); moved.clear(); prefs.clear(); splits.clear(); joins = []; renderPanel(); find();
  }
  // a box split by hand (its parts are then moved and set one by one)
  function splitBox(b, k, down) { splits.set(b.key, { k, down }); skip.clear(); renderPanel(); find(); if (opts.toast) opts.toast(`Split into ${k}: drag the edges to fit each one (zoom in with the mouse wheel to be exact).`); }
  // a table's column or row split into equal parts (a line too faint to find): every row (or column) at once
  function splitTable(b, k, down) {
    const list = down ? table.rows : table.cols, kinds = down ? table.rowKind : table.colKind, i = down ? b.row : b.col, [a, e] = list[i], step = (e - a + 1) / k, parts = [];
    for (let n = 0; n < k; n++) parts.push([Math.round(a + n * step) + (n ? 2 : 0), Math.round(a + (n + 1) * step) - 1 - (n < k - 1 ? 2 : 0)]);
    list.splice(i, 1, ...parts); kinds.splice(i, 1, ...parts.map(() => 'pic'));
    if (down) { offRows.clear(); rowNames = []; } else { offCols.clear(); colNames = []; }
    skip.clear(); moved.clear(); prefs.clear(); splits.clear(); renderPanel(); find();
  }
  // ------------------------------------------------------------------ one Undo and Redo for every change made by hand
  // Everything set on the sheet is kept as a snapshot each time the sheet is redrawn after a change; Undo and Redo step
  // through them (Ctrl+Z, Ctrl+Y, the tool bar, the right-click menus).
  let past = [], future = [], now = '', restoring = false;
  const snapshot = () => JSON.stringify({ area, outs, zones, marks, joins, moved: [...moved], prefs: [...prefs], splits: [...splits], skip: [...skip], offRows: [...offRows], offCols: [...offCols], rowNames, colNames, sheetTitle, table, mode: S.mode, rows: S.rows, cols: S.cols, inset: S.inset, cut: S.cut, see: S.see, notext: S.notext });
  function checkpoint() { if (!sheet || restoring) return; const s2 = snapshot(); if (s2 === now) return; if (now) { past.push(now); if (past.length > 200) past.shift(); } now = s2; future = []; undoButtons(); }
  function restore(js) {
    const o = JSON.parse(js); restoring = true;
    ({ area, outs, zones, marks, rowNames, colNames, sheetTitle, table } = o); joins = o.joins || []; chosenBoxes.clear(); moved = new Map(o.moved); prefs = new Map(o.prefs); splits = new Map(o.splits); skip = new Set(o.skip); offRows = new Set(o.offRows); offCols = new Set(o.offCols);
    Object.assign(S, { mode: o.mode, rows: o.rows, cols: o.cols, inset: o.inset, cut: o.cut, see: o.see, notext: o.notext }); now = js;
    renderPanel(); find(); restoring = false; undoButtons();
  }
  function undo() { if (!past.length) return; future.push(now); restore(past.pop()); }
  function redo() { if (!future.length) return; past.push(now); restore(future.pop()); }
  function undoButtons() { if (!el) return; el.querySelectorAll('[data-hist=undo]').forEach((u) => { u.disabled = !past.length; }); el.querySelectorAll('[data-hist=redo]').forEach((r) => { r.disabled = !future.length; }); }
  const histItems = () => [{ label: 'Undo', key: 'Ctrl+Z', disabled: !past.length, run: undo }, { label: 'Redo', key: 'Ctrl+Y', disabled: !future.length, run: redo }];
  // Back to how the sheet was found: every change by hand undone and the sheet worked out again (the labels, headings
  // and title already read stay, so they need not be read again)
  function resetSheet() {
    if (!sheet) return; // (Undo brings it all back)
    const keepNames = { rowNames: rowNames.slice(), colNames: colNames.slice(), sheetTitle };
    area = null; outs = []; zones = []; marks = []; joins = []; chosenBoxes.clear(); table = null; offRows.clear(); offCols.clear(); moved.clear(); prefs.clear(); splits.clear(); skip.clear(); poly = null; showLasso(null);
    try { const a = autoCut(sheet); Object.assign(S, a.settings); autoSaid = a.said; table = a.table || null; area = a.area || null; S.notext = !!a.notext; } catch (e) { autoSaid = ''; }
    ({ rowNames, colNames, sheetTitle } = keepNames); tool = 'pick'; renderPanel(); find(); opts.toast && opts.toast('The sheet is back to how it was found (Undo brings your changes back).');
  }
  // one picture back to how it was found: its moved edges, split, settings, wand and the touch-ups drawn on it
  function resetBox(b) {
    const base = b.key.replace(/\/\d+$/, ''); moved.delete(b.key); prefs.delete(b.key); splits.delete(base); if (b.part !== undefined) { moved.delete(base); prefs.delete(base); }
    const sb = sheetBox(b); marks = marks.filter((mk) => { const [mx, my] = midOf(mk.pts); return !(mx >= sb.x && mx <= sb.x + sb.w && my >= sb.y && my <= sb.y + sb.h); });
    renderPanel(); find();
  }
  // right-click on the sheet: what can be done to the box under the mouse (or to the sheet)
  function onMenu(e) {
    e.preventDefault(); if (!sheet || !window.CraftMenu) return; const p = ptOf(e);
    const i = boxes.findIndex((b) => { const sb = sheetBox(b); return p.x >= sb.x && p.x <= sb.x + sb.w && p.y >= sb.y && p.y <= sb.y + sb.h; });
    const many = (b) => (chosenBoxes.size > 1 && chosenBoxes.has(b.key) ? boxes.filter((x) => chosenBoxes.has(x.key)) : [b]);
    // (right-clicking one of several chosen boxes: the setting goes to all of them)
    const setPref = (b, o) => { for (const x of many(b)) prefs.set(x.key, { ...(prefs.get(x.key) || {}), ...o }); find(); };
    const snap = (b, keepShadow) => () => { const r = snapBox(b, keepShadow); if (!r) return opts.toast && opts.toast('Nothing in that box but page.'); moved.set(b.key, r); if (!keepShadow) prefs.set(b.key, { ...(prefs.get(b.key) || {}), noShadow: true }); renderPanel(); find(); };
    const tools = [{ label: 'Touch up', checked: tool === 'solid', run: () => { tool = 'solid'; renderPanel(); } }, { label: 'Grid here', checked: tool === 'grid', run: () => { tool = 'grid'; renderPanel(); } }, { label: 'Pick', checked: tool === 'pick', run: () => { tool = 'pick'; renderPanel(); } }, { label: 'Main area', checked: tool === 'area', run: () => { tool = 'area'; renderPanel(); } }, { label: 'Rule out', checked: tool === 'out', run: () => { tool = 'out'; renderPanel(); } }];
    if (i < 0) {
      const o = outs.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
      return CraftMenu.show(e.clientX, e.clientY, [...histItems(), '-', ...(o >= 0 ? [{ label: 'Take this ruled-out box away', run: () => { outs.splice(o, 1); renderPanel(); find(); } }, '-'] : []), ...tools, '-',
        { label: 'Whole sheet (no main area)', disabled: !area, run: () => { area = null; skip.clear(); renderPanel(); find(); } }, { label: 'Clear all ruled out', disabled: !outs.length, run: () => { outs = []; renderPanel(); find(); } }, { label: 'Undo all moved and split boxes', disabled: !moved.size && !prefs.size && !splits.size, run: () => { moved.clear(); prefs.clear(); splits.clear(); renderPanel(); find(); } }, '-', { label: 'Reset the whole sheet', run: resetSheet }]);
    }
    const b = boxes[i], off = skip.has(i), isCell = S.mode !== 'find' && b.r !== undefined, plan = namesNow().get(i), mt = metaOf(b);
    // what the sheet says about it (the name it will get, its style and tags, where it sits), then what can be done
    const group = many(b), info = group.length > 1 ? [{ info: `${group.length} chosen: what you pick here goes to all of them`, strong: true }] : off ? [{ info: 'Left out: it will not be added', strong: true }] : [{ info: `${plan.n} · ${plan.name}`, strong: true },
      ...(mt.style || mt.tags.length ? [{ info: [mt.style && `Style: ${mt.style}`, mt.tags.length && `Tags: ${mt.tags.join(', ')}`].filter(Boolean).join(' · ') }] : []),
      ...(mt.where || mt.title ? [{ info: [mt.where && mt.where.charAt(0).toUpperCase() + mt.where.slice(1), mt.title && `from “${mt.title}”`].filter(Boolean).join(' · ') }] : []),
      ...(!mt.fromSheet && S.mode === 'table' ? [{ info: 'No row label or heading yet: read them with the AI, or type them in the panel' }] : [])];
    CraftMenu.show(e.clientX, e.clientY, [...info, '-', ...histItems(), '-',
      { label: 'Name this picture…', disabled: off, run: () => { const v = prompt('Name for this picture:', b.name || plan.name); if (v === null) return; setPref(b, { name: v.trim() }); } },
      group.length > 1 ? { label: `Leave these ${group.length} out (or put them back)`, run: () => { const idx = group.map((g) => boxes.indexOf(g)), allOff = idx.every((j) => skip.has(j)); idx.forEach((j) => (allOff ? skip.delete(j) : skip.add(j))); chosenBoxes.clear(); draw(); count(); } }
        : { label: off ? 'Put this picture back' : 'Leave this picture out', run: () => { if (off) skip.delete(i); else skip.add(i); draw(); count(); } },
      ...(group.length > 1 ? [{ label: `Reset these ${group.length} cells`, run: () => { group.forEach((g) => { moved.delete(g.key); prefs.delete(g.key); }); chosenBoxes.clear(); renderPanel(); find(); } }] : []),
      { label: 'Reset just this cell', disabled: !moved.has(b.key) && !prefs.has(b.key) && b.part === undefined && !marks.some((mk) => { const [mx, my] = midOf(mk.pts), sb = sheetBox(b); return mx >= sb.x && mx <= sb.x + sb.w && my >= sb.y && my <= sb.y + sb.h; }), run: () => resetBox(b) },
      '-', { label: 'Snap the box to the picture', run: snap(b, true) }, { label: 'Snap to the picture, leaving out its shadow', run: snap(b, false) },
      '-', { label: 'Background', disabled: off, sub: [{ label: 'How much background to take', disabled: off, sub: [[12, 'Much less (keeps light parts)'], [24, 'Less'], [0, 'Normal'], [60, 'More']].map(([v, l]) => ({ label: l, checked: (b.ctol || 0) === v, run: () => setPref(b, { ctol: v || undefined }) })) },
      { label: 'Touch up', disabled: off, sub: [['box', 'keep', 'in', 'Keep inside a box'], ['lasso', 'keep', 'in', 'Keep inside a lasso'], ['lasso', 'erase', 'in', 'Erase inside a lasso'], ['lasso', 'erase', 'out', 'Erase outside a lasso'], ['lasso', 'keep', 'out', 'Keep outside a lasso']].map(([shape, op, side, label]) => ({ label: label + '…', run: () => { tool = 'solid'; S.touch = { shape, op, side }; keep(); renderPanel(); opts.toast && opts.toast(`${shape === 'box' ? 'Drag a box' : 'Draw round the part'} on the picture.`); } })) },
      ...(marks.some((mk) => inPoly(mk.pts, p.x, p.y)) ? [{ label: 'Take away the touch-up here', run: () => { let i = -1; marks.forEach((mk, j) => { if (inPoly(mk.pts, p.x, p.y)) i = j; }); marks.splice(i, 1); renderPanel(); draw(); } }] : []),
      { label: 'Fill its shape: keep everything inside its outline', checked: !!b.fillShape, disabled: off, run: () => setPref(b, { fillShape: !b.fillShape }) },
      { label: 'Magic wand: erase from here', disabled: off, run: () => setPref(b, { wand: [...(b.wand || []), { x: p.x, y: p.y }] }) }, { label: 'Magic wand: keep from here', disabled: off, run: () => setPref(b, { wand: [...(b.wand || []), { x: p.x, y: p.y, keep: true }] }) },
      '-', { label: 'Keep its shadow', checked: !b.noShadow, run: () => setPref(b, { noShadow: false }) }, { label: 'Leave out its shadow', checked: !!b.noShadow, run: () => setPref(b, { noShadow: true }) },
      '-', { label: 'Cut the picture out', checked: !b.whole && !b.boxOnly && (S.cut || b.cutOut), run: () => setPref(b, { whole: false, boxOnly: false, cutOut: true }) }, { label: 'Keep the whole box', checked: !!b.boxOnly || (!S.cut && !b.whole && !b.cutOut), run: () => setPref(b, { whole: false, boxOnly: true, cutOut: false }) }, { label: 'Keep the whole box as it is (a photo)', checked: !!b.whole, run: () => setPref(b, { whole: true, boxOnly: false, cutOut: false }) }] },
      '-', { label: 'Split this box', sub: [{ label: 'Into 2, side by side', run: () => splitBox(b, 2, false) }, { label: 'Into 3, side by side', run: () => splitBox(b, 3, false) }, '-', { label: 'Into 2, one above the other', run: () => splitBox(b, 2, true) }, { label: 'Into 3, one above the other', run: () => splitBox(b, 3, true) }] },
      ...(chosenBoxes.size >= 2 ? [{ label: `Join the ${chosenBoxes.size} chosen into one picture`, run: joinChosen }] : [{ label: 'Join with others: Ctrl-click the boxes, then right-click', disabled: true }]),
      ...(b.joined ? [{ label: `Undo this join (${b.joined} boxes)`, run: () => { joins = joins.filter((j) => 'join:' + j.keys.join('+') !== b.key); renderPanel(); find(); } }] : []),
      ...(S.mode === 'table' && table && b.row !== undefined ? [{ label: 'Join this row with the one below (all columns)', run: () => joinTable(b, true) }, { label: 'Join this column with the next (all rows)', run: () => joinTable(b, false) }] : []),
      ...(S.mode === 'table' && table && b.col !== undefined ? [{ label: 'Split this column (all rows)', sub: [{ label: 'Into 2', run: () => splitTable(b, 2, false) }, { label: 'Into 3', run: () => splitTable(b, 3, false) }] }, { label: 'Split this row (all columns)', sub: [{ label: 'Into 2', run: () => splitTable(b, 2, true) }, { label: 'Into 3', run: () => splitTable(b, 3, true) }] }] : []),
      '-', ...(isCell ? [{ label: 'Leave out this whole row', run: () => { offRows.add(b.r); skip.clear(); renderPanel(); find(); } }, { label: 'Leave out this whole column', run: () => { offCols.add(b.c); skip.clear(); renderPanel(); find(); } }, '-'] : []),
      ...(b.zone !== undefined ? [{ label: `Change this grid (${zones[b.zone].cols} × ${zones[b.zone].rows})…`, run: () => { const z = zones[b.zone], n = askGrid(z, z); if (!n) return; Object.assign(z, n); skip.clear(); renderPanel(); find(); } }, { label: 'Remove this grid', run: () => { zones.splice(b.zone, 1); skip.clear(); renderPanel(); find(); } }] : []),
      { label: 'Grid here: cut this box as a grid…', run: () => { const sb = clampBox(sheetBox(b)), n = askGrid(sb); if (!n) return; zones.push({ ...sb, ...n }); skip.clear(); renderPanel(); find(); } },
      { label: 'Rule out what is in this box', run: () => { const sb = clampBox(sheetBox(b)); outs.push(sb); renderPanel(); find(); } },
      '-', { label: 'Reset the whole sheet', run: resetSheet }, '-', { label: 'Tools', sub: tools }]);
  }
  // the sides as they apply now: auto only means something when the background is see-through (a whole box touches all round)
  const edgesNow = () => { const e = { t: 'auto', b: 'auto', l: 'auto', r: 'auto', ...(S.edges || {}) }; if (!S.see) for (const k in e) if (e[k] === 'auto') e[k] = 'off'; return e; };
  // which sides of a picture it touches (something there, not see-through, on its outermost line)
  function touches(img) {
    const W = img.width, H = img.height, d = img.data, on = (x, y) => d[(y * W + x) * 4 + 3] > 16, o = { t: false, b: false, l: false, r: false };
    for (let x = 0; x < W && !(o.t && o.b); x++) { if (on(x, 0)) o.t = true; if (on(x, H - 1)) o.b = true; }
    for (let y = 0; y < H && !(o.l && o.r); y++) { if (on(0, y)) o.l = true; if (on(W - 1, y)) o.r = true; }
    return o;
  }
  // a see-through strip added round the picture (its box stays where it was on the sheet), side by side:
  // 'on' always, 'auto' where the picture touches that side, 'off' never
  function edgeRoom(img, n = 2, edges = { t: 'auto', b: 'auto', l: 'auto', r: 'auto' }) {
    if (!n) return img;
    const W = img.width, H = img.height, d = img.data, at = touches(img), want = (k) => edges[k] === 'on' || (edges[k] === 'auto' && at[k]);
    const t = want('t'), b = want('b'), l = want('l'), r = want('r');
    if (!t && !b && !l && !r) return img;
    const L = l ? n : 0, T = t ? n : 0, o = new ImageData(W + L + (r ? n : 0), H + T + (b ? n : 0));
    for (let y = 0; y < H; y++) o.data.set(d.subarray(y * W * 4, (y + 1) * W * 4), ((y + T) * o.width + L) * 4);
    o.at = img.at; o.room = { l: L, t: T }; return o;
  }
  let drawRun = 0;
  // how many pictures touch each side (cut as now, before any room is added), for the room box
  function countTouches() {
    const o = { cut: S.cut, see: S.see, pad: +S.pad, tol: +S.tol || 16 }, n = { t: 0, b: 0, l: 0, r: 0 };
    boxes.forEach((b, i) => { if (skip.has(i)) return; const at = touches(baseCut(b)); for (const k in n) if (at[k]) n[k]++; });
    touchCount = n; const r = el.querySelector('.room-row'); if (r) { const f = r.closest('.field'); f.outerHTML = roomHtml(); }
  }
  async function draw() {
    const c = el.querySelector('canvas'); if (!sheet) { c.hidden = true; return; } c.hidden = false; checkpoint();
    const run = ++drawRun, live = S.view === 'result';
    setTimeout(() => { if (run === drawRun) countTouches(); }, 0);
    // the result is worked out off-screen and shown when ready, so the sheet never flickers while settings change
    const off = document.createElement('canvas'); off.width = sheet.width; off.height = sheet.height;
    const x = off.getContext('2d'), names = nameList(), big = Math.max(sheet.width, sheet.height), lw = Math.max(2, Math.round(big / 400)), fs = Math.max(12, Math.round(big / 60)), pad = S.mode === 'find' || S.cut ? +S.pad : 0;
    if (live) { const k = Math.max(8, Math.round(big / 80)); for (let yy = 0; yy < off.height; yy += k) for (let xx = 0; xx < off.width; xx += k) { x.fillStyle = ((xx + yy) / k) % 2 ? '#c9ccd6' : '#f4f5f8'; x.fillRect(xx, yy, k, k); }
      // what is not cut (outside the main area, ruled out) shows faintly
      x.save(); x.beginPath(); x.rect(0, 0, off.width, off.height); x.rect(wx, wy, work.width, work.height); for (const o of outs) x.rect(o.x, o.y, o.w, o.h); x.clip('evenodd'); x.globalAlpha = 0.22; x.drawImage(canvasOf(sheet), 0, 0); x.restore(); }
    else x.putImageData(sheet, 0, 0);
    x.translate(wx, wy);
    if (live) {
      const t0 = performance.now();
      for (let i = 0; i < boxes.length; i++) {
        if (run !== drawRun) return; // the settings changed again: this picture is out of date
        const b = boxes[i];
        if (skip.has(i)) { const pp = S.mode === 'find' && !b.fixed ? pad : 0, part = cropOf(work, b.x - pp, b.y - pp, b.w + pp * 2, b.h + pp * 2); x.globalAlpha = 0.25; x.drawImage(canvasOf(part), b.x - pp, b.y - pp); x.globalAlpha = 1; continue; }
        const img = cutOne(b); x.drawImage(canvasOf(img), img.at.x, img.at.y);
        if (performance.now() - t0 > 40) { await wait(0); } // a big sheet: let the page breathe between pictures
      }
      if (run !== drawRun) return;
    }
    x.lineWidth = Math.max(1, Math.round(lw / (live ? 2 : 1))); x.font = `700 ${fs}px system-ui, sans-serif`; x.textBaseline = 'top';
    let n = 0;
    // left-out text: green dotted, with what was read
    x.lineWidth = Math.max(1, Math.round(lw / 2)); x.strokeStyle = '#16a34a'; x.setLineDash([lw, lw]); for (const t of captions) x.strokeRect(t.x, t.y, t.w, t.h); x.setLineDash([]);
    x.lineWidth = Math.max(1, Math.round(lw / (live ? 2 : 1)));
    if (S.showBoxes !== false) boxes.forEach((b, i) => {
      const skipped = skip.has(i), p = S.mode === 'find' && !b.fixed ? pad : 0, bx = b.x - p, by = b.y - p, bw = b.w + p * 2, bh = b.h + p * 2;
      if (skipped && !live) { x.fillStyle = 'rgba(30,30,40,.55)'; x.fillRect(bx, by, bw, bh); }
      x.strokeStyle = skipped ? '#8a8fa3' : live ? 'rgba(230,57,70,.45)' : '#e63946'; x.setLineDash(skipped || live ? [lw * 3, lw * 2] : []); x.strokeRect(bx, by, bw, bh); x.setLineDash([]);
      if (chosenBoxes.has(b.key)) { x.fillStyle = 'rgba(37,99,235,.25)'; x.fillRect(bx, by, bw, bh); x.strokeStyle = '#2563eb'; x.lineWidth = lw * 1.5; x.setLineDash([]); x.strokeRect(bx, by, bw, bh); x.lineWidth = Math.max(1, Math.round(lw / (live ? 2 : 1))); }
      if (b.fixed && !skipped) { x.fillStyle = '#e63946'; const hs = lw * 2.5; for (const [hx, hy] of [[bx + bw / 2, by], [bx + bw / 2, by + bh], [bx, by + bh / 2], [bx + bw, by + bh / 2]]) x.fillRect(hx - hs, hy - hs, hs * 2, hs * 2); }
      const nm = skipped ? '' : names[n] || labelOf(b), label = skipped ? '✕' : `${++n}${nm ? ' ' + nm : ''}`, tw = x.measureText(label).width, ly = by; // (inside the box's top: above it, it reads as the row above's)
      if (S.showNames !== false || skipped) { x.fillStyle = skipped ? '#8a8fa3' : '#e63946'; x.fillRect(bx, ly, tw + 10, fs + 6); x.fillStyle = '#fff'; x.fillText(label, bx + 5, ly + 3); }
    });
    x.setTransform(1, 0, 0, 1, 0, 0);
    // the main area (blue) and the ruled-out parts (grey, crossed); outside the main area darkened on the sheet view
    if (!live) { x.save(); x.beginPath(); x.rect(0, 0, off.width, off.height); x.rect(wx, wy, work.width, work.height); x.clip('evenodd'); x.fillStyle = 'rgba(20,24,36,.55)'; x.fillRect(0, 0, off.width, off.height); x.restore(); }
    if (area) { x.strokeStyle = '#2563eb'; x.lineWidth = lw; x.setLineDash([lw * 4, lw * 2]); x.strokeRect(wx, wy, work.width, work.height); x.setLineDash([]);
      // its handles: drag one in any tool to move that edge
      x.fillStyle = '#2563eb'; const hs = lw * 4; for (const [hx, hy] of areaHandles()) { x.fillRect(hx - hs, hy - hs, hs * 2, hs * 2); x.strokeStyle = '#fff'; x.lineWidth = Math.max(1, lw / 2); x.strokeRect(hx - hs, hy - hs, hs * 2, hs * 2); } }
    for (const mk of marks) { const keepIt = mk.op !== 'erase'; x.beginPath(); mk.pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath();
      if (mk.side !== 'out') { x.fillStyle = keepIt ? 'rgba(34,197,94,.16)' : 'rgba(220,38,38,.16)'; x.fill(); }
      x.strokeStyle = keepIt ? '#16a34a' : '#dc2626'; x.lineWidth = lw; x.setLineDash(mk.side === 'out' ? [lw * 4, lw * 2] : [lw * 2, lw]); x.stroke(); x.setLineDash([]); }
    for (const z of zones) { x.strokeStyle = '#f97316'; x.lineWidth = lw; x.setLineDash([lw * 2, lw]); x.strokeRect(z.x, z.y, z.w, z.h); x.setLineDash([]); x.fillStyle = '#f97316'; const t = `${z.cols} × ${z.rows}`; x.fillRect(z.x + z.w - x.measureText(t).width - 10, z.y + z.h - fs - 6, x.measureText(t).width + 10, fs + 6); x.fillStyle = '#fff'; x.fillText(t, z.x + z.w - x.measureText(t).width - 5, z.y + z.h - fs - 3); }
    for (const o of outs) { x.fillStyle = 'rgba(70,75,90,.55)'; x.fillRect(o.x, o.y, o.w, o.h); x.strokeStyle = '#fff'; x.lineWidth = lw; x.strokeRect(o.x, o.y, o.w, o.h); x.beginPath(); x.moveTo(o.x, o.y); x.lineTo(o.x + o.w, o.y + o.h); x.moveTo(o.x + o.w, o.y); x.lineTo(o.x, o.y + o.h); x.stroke(); }
    // a table's rows and columns left out: their label and heading cells crossed
    if (S.mode === 'table' && table) { const pr = table.rows.map((r, i) => i).filter((i) => table.rowKind[i] === 'pic'), pc = table.cols.map((c, j) => j).filter((j) => table.colKind[j] === 'pic');
      x.fillStyle = 'rgba(230,57,70,.35)'; offRows.forEach((r) => { const R = table.rows[pr[r]]; if (R) x.fillRect(0, R[0], off.width, R[1] - R[0]); }); offCols.forEach((cc) => { const C = table.cols[pc[cc]]; if (C) x.fillRect(C[0], 0, C[1] - C[0], off.height); }); }
    c.width = sheet.width; c.height = sheet.height; c.getContext('2d').drawImage(off, 0, 0);
  }
  const later = (ms = 200) => { clearTimeout(timer); timer = setTimeout(find, ms); };
  // the name each box (not left out) will be added with, in order: typed names first, then what the sheet says
  function namesNow() {
    const meaningless = (n) => !n || /^[0-9a-f]{6,}(?:[\s-]+[0-9a-f]{3,})+/i.test(n) || /^[\d\s_-]{5,}$/.test(n) || (n.replace(/[^0-9a-f]/gi, '').length > n.length * 0.8 && n.length > 12);
    const names = nameList(), base = meaningless(sheetName) ? 'Clip art' : /^\d+$/.test(sheetName) ? `Sheet ${sheetName}` : sheetName, seen = {}, out = new Map(); let n = 0;
    boxes.forEach((b, i) => {
      if (skip.has(i)) return; n++;
      const mt = metaOf(b), own = b.name || (mt.subject && mt.heading && !names[n - 1] ? `${mt.subject} – ${mt.heading}` : mt.subject);
      let nm = safe(b.name || names[n - 1] || own || `${base} – ${n}`) || `${base} – ${n}`; const k = nm.toLowerCase(); seen[k] = (seen[k] || 0) + 1; if (seen[k] > 1) nm += `_${String(seen[k]).padStart(3, '0')}`;
      out.set(i, { n, name: nm, meta: mt });
    });
    return out;
  }
  async function cuts(onStep) {
    const meaningless = (n) => !n || /^[0-9a-f]{6,}(?:[\s-]+[0-9a-f]{3,})+/i.test(n) || /^[\d\s_-]{5,}$/.test(n) || (n.replace(/[^0-9a-f]/gi, '').length > n.length * 0.8 && n.length > 12);
    const plan = namesNow(), out = []; let n = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (skip.has(i)) continue; const b = boxes[i]; n++; const { name: nm, meta: mt } = plan.get(i);
      onStep(n, nm); await wait(0);
      out.push({ name: nm, img: cutOne(b), keep: true, tags: mt.tags, meta: mt });
    }
    return out;
  }
  // is the sheet's page a clean, even colour? (the spread of brightness round its edge)
  let pagePlain = null;
  function plainPage() {
    if (pagePlain !== null) return pagePlain;
    const W = work.width, H = work.height, d = work.data, b = Math.max(2, Math.round(Math.min(W, H) * 0.02)), v = [];
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) { if (x >= b && y >= b && x < W - b && y < H - b) continue; const i = (y * W + x) * 4; v.push(0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]); }
    const m = v.reduce((a, c) => a + c, 0) / v.length, sd = Math.sqrt(v.reduce((a, c) => a + (c - m) * (c - m), 0) / v.length);
    return (pagePlain = sd < 4);
  }
  // what might be wrong with a picture, in plain words (shown in the review before anything is added)
  function doubts(img) {
    const d = img.data, W = img.width, H = img.height, out = []; let clear = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 16) clear++;
    const share = clear / (W * H);
    if (share > 0.9) out.push('Almost nothing is left: lower “how close”, or turn off See-through.');
    if (S.see && share < 0.005) out.push('Nothing is see-through: the background was not found.');
    // cut out: compared with only the page round its box made see-through (strictly), did it lose parts of the picture?
    // (a white tile on white paper, light parts at the edge)
    // (only on a clean, even page: on old or textured paper the paper itself is light, so this cannot tell)
    if (S.see && S.cut && img.at && plainPage()) {
      const strict = boxClear(cropOf(work, img.at.x, img.at.y, img.at.w, img.at.h), 8), sd = strict.data; let lost = 0;
      // only light parts count (a white tile on white paper); a dark or speckled background can differ a little anyway
      for (let i = 3; i < d.length && i < sd.length; i += 4) if (sd[i] > 128 && d[i] < 16 && 0.3 * sd[i - 3] + 0.59 * sd[i - 2] + 0.11 * sd[i - 1] > 200) lost++;
      if (lost > W * H * 0.04) out.push('Light parts of the picture may have gone with the background (a white tile?): try Cut out off with See-through on.');
    }
    if (W < 24 || H < 24) out.push(`Very small (${W} × ${H} pixels).`);
    return out;
  }
  // the review: every picture as it will be added, to name, keep or leave out, before anything is added
  let review = [];
  async function addAll() {
    const btn = el.querySelector('[data-sl=add]'), total = boxes.length - skip.size;
    btn.disabled = true;
    try {
      review = await cuts((n) => { btn.textContent = `Getting ${n} of ${total} ready…`; }); review.forEach((r) => { r.doubts = doubts(r.img); });
      // on a sheet of like pictures, one clearly smaller than the rest has probably lost a part (a white tile on white paper)
      // (only on a sheet whose pictures really are alike in size: most within a tenth of the usual size)
      const med = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1], mw = med(review.map((r) => r.img.width)), mh = med(review.map((r) => r.img.height)), alike = review.filter((r) => Math.abs(r.img.width - mw) <= mw * 0.1 && Math.abs(r.img.height - mh) <= mh * 0.1).length;
      if (review.length >= 4 && alike >= review.length * 0.7) {
        for (const r of review) if (r.img.width < mw * 0.92 || r.img.height < mh * 0.92) r.doubts.push(`Smaller than the others (${r.img.width} × ${r.img.height}, most are about ${mw} × ${mh}): part of it may have gone with the background. Try Cut out off with See-through on.`); }
      if (S.quick && !review.some((r) => r.doubts.length)) { count(); btn.disabled = false; return addReviewed(btn); }
      showReview();
    }
    catch (e) { console.error(e); opts.toast && opts.toast('Slicing failed: ' + (e.message || e)); }
    count(); btn.disabled = false;
  }
  // all dark (black line art): shown on a light checkerboard so it can be seen
  function darkPic(img) { if (img.dark !== undefined) return img.dark; const d = img.data; let k = 0, sum = 0, light = 0; for (let i = 0; i < d.length; i += 16) { if (d[i + 3] < 128) continue; const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; k++; sum += l; if (l > 150) light++; } return (img.dark = k > 8 && sum / k < 80 && light < k * 0.12); }
  function showReview() {
    let box = el.querySelector('.sl-review'); if (!box) { box = document.createElement('div'); box.className = 'sl-review'; el.append(box); }
    const n = review.filter((r) => r.keep).length, flagged = review.filter((r) => r.doubts.length).length;
    box.hidden = false;
    box.innerHTML = `<div class="sl-bar"><b>Are these what you want?</b><span class="hint">${review.length} picture${review.length === 1 ? '' : 's'}${flagged ? ` · <span class="warn">${flagged} to look at</span>` : ' · nothing looks wrong'} · untick any to leave out, change any name</span><span class="grow"></span>
        <button class="btn outline" type="button" data-rv="back">Back to the sheet</button><button class="btn primary" type="button" data-rv="add" ${n ? '' : 'disabled'}>Add ${n} to the library</button></div>
      <div class="rv-grid">${review.map((r, i) => `<div class="rv-card${r.keep ? '' : ' off'}${r.doubts.length ? ' doubt' : ''}" data-i="${i}">
        <div class="rv-pic${darkPic(r.img) ? ' lit' : ''}"><img src="${canvasOf(r.img).toDataURL('image/png')}" alt=""></div>
        <label class="rv-keep"><input type="checkbox" data-keep ${r.keep ? 'checked' : ''}> Add</label>
        <input class="input" data-name value="${esc(r.name)}" aria-label="Name">
        <span class="hint">${r.img.width} × ${r.img.height}${r.meta && r.meta.style ? ` · style: ${esc(r.meta.style)}` : ''}${r.tags && r.tags.length ? ` · tags: ${esc(r.tags.join(', '))}` : ''}</span>
        ${r.meta && r.meta.description ? `<span class="hint rv-meta" title="Kept with the picture and written into its PNG">${esc(r.meta.description)}</span>` : ''}
        ${r.doubts.map((d) => `<span class="hint warn">⚠ ${esc(d)}</span>`).join('')}</div>`).join('')}</div>`;
  }
  async function addReviewed(btn) {
    const keep = review.filter((r) => r.keep), category = String(S.category || '').trim(); if (!keep.length) return;
    btn.disabled = true;
    rememberHeads();
    try { await L.guard(async () => {
      // the sheet first (to the working area), so if the page is closed half way it can simply be sliced again
      const src = sheetFile && window.CraftWork ? await window.CraftWork.add(sheetFile, { used: 0 }) : null;
      const made = []; let k = 0;
      for (const r of keep) {
        btn.textContent = `Adding ${++k} of ${keep.length}: ${r.name}…`; await wait(0);
        const mt = r.meta || {}, raw = await new Promise((ok) => canvasOf(r.img).toBlob(ok, 'image/png')), png = await pngText(raw, { Title: r.name.trim(), Description: mt.description || '', Keywords: (r.tags || []).join(', '), Source: `${sheetName}${mt.where ? ` (${mt.where})` : ''}`, Collection: mt.title || '', Software: 'ClipArtCraft Montage Slicer' }); let svg = null;
        if (svgSheet && r.img.at) { try { svg = svgCut(svgSheet, { ...r.img.at, x: r.img.at.x + wx, y: r.img.at.y + wy }); } catch (e) { console.warn('Cutting the SVG failed', r.name, e); } }
        if (!svg && window.CRAFT_RASTERTRACE) { try { svg = CRAFT_RASTERTRACE.traceImage(r.img, { profile: 'icon' }).svg; } catch (e) { console.warn('Tracing failed', r.name, e); } }
        const it = await L.makeItem({ name: r.name.trim() || 'Clip art', category, tags: r.tags || [], png, svg, source: 'Montage Slicer: ' + sheetName }); if (src) it.sheet = src.id;
        // what the sheet said: kept as the picture's own information (the AI's sorting fills in only what is missing)
        if (mt.style) it.style = mt.style; if (mt.description) it.description = mt.description; if (mt.title) it.collection = mt.title; if (mt.where) it.place = mt.where;
        if (mt.subject) { it.original = mt.subject; it.seen = mt.subject; } if (mt.fromSheet) it.checked = true;
        // where it sat on the sheet (sheet pixels of its top-left, and its size): the editor can bring parts back from the sheet
        if (r.img.at) it.cutAt = { x: r.img.at.x + wx - ((r.img.room || {}).l || 0), y: r.img.at.y + wy - ((r.img.room || {}).t || 0), w: r.img.width, h: r.img.height };
        made.push(await L.put(it));
      }
      if (src) await window.CraftWork.add(sheetFile, { used: made.length, pending: '' });
      const rv = el.querySelector('.sl-review'); if (rv) rv.hidden = true; review = []; const doneFile = sheetFile;
      if (!next()) { forget(); close(); } else opts.toast && opts.toast(`${made.length} added. Next sheet: ${sheetFile.name}`);
      opts.done && opts.done(made, category, doneFile, { more: queueN > 0 });
    }); } catch (e) { console.error(e); opts.toast && opts.toast('Adding failed: ' + (e.message || e)); btn.disabled = false; }
  }
  async function load(file) {
    if (!file) return; try { sheet = await readSheet(file); } catch (e) { opts.toast && opts.toast('That picture could not be read.'); return; }
    if (window.CraftWork) window.CraftWork.add(file, { used: 0, pending: 'slice' }).catch(() => {});
    pagePlain = null; sheetFile = file; sheetName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(); skip.clear(); S.names = ''; S.category = ''; el.querySelector('.sl-empty').hidden = true;
    original = sheet; zoom = 1; past = []; future = []; now = '';
    area = null; outs = []; table = null; offRows.clear(); offCols.clear(); rowNames = []; colNames = []; captions = []; readText.clear(); moved.clear(); prefs.clear(); splits.clear(); zones = []; marks = []; joins = []; chosenBoxes.clear(); sheetTitle = ''; tool = 'pick';
    try { const a = autoCut(sheet); Object.assign(S, a.settings); autoSaid = a.said; table = a.table || null; area = a.area || null; S.notext = !!a.notext; } catch (e) { console.warn('Working out the cut failed', e); autoSaid = ''; S.notext = false; }
    renderPanel(); find(); applyZoom(); const d = desk(); d.scrollLeft = d.scrollTop = 0;
    if (S.autoread !== false && ((S.mode === 'table' && table) || captions.some((t) => t.own))) readLabels(null, true);
  }
  // How to cut a sheet, worked out from the sheet itself:
  //  - a grid: straight lines of plain page (gutters) running right across it, between rows and between columns
  //  - tiles or loose pictures: whether each cell is mostly filled (an app tile: keep it whole, only the page
  //    see-through) or a picture with space round it (cut it out)
  //  - anything else (sizes and places that do not line up): Find the pictures, which follows each one wherever it is
  let autoSaid = '';
  function autoCut(img) {
    // a table between ruled lines: only its picture cells are cut, its headings and labels left out (they can name them)
    // (not when the sheet has plain gutters between its pictures: that is a grid, the tiles' own edges only look like
    // lines; nor when cells that touch repeat far more often than the lines found)
    const loose = autoCutLoose(img), lg = loose.settings.mode === 'grid', touching = lg && /touch/.test(loose.said);
    const t = lg && !touching ? null : tableOf(img), pics = t ? t.rowKind.filter((k) => k === 'pic').length * t.colKind.filter((k) => k === 'pic').length : 0;
    const framed = t && t.rowKind.includes('head') && t.colKind.includes('label') && pics * 2 >= (lg ? loose.settings.rows * loose.settings.cols : 0); // (cells that touch: only a table with both, and about as many cells) // headings and row labels: surely a table
    if (t && pics >= 4 && (framed || !touching)) { const a = tableArea(t), parts = [t.rowKind.includes('head') && 'headings', t.colKind.includes('label') && 'row labels', t.rowKind.includes('caption') && 'captions'].filter(Boolean);
      return { settings: { mode: 'table', pad: 6, cut: true, see: true }, table: t, area: a, notext: true, said: `Found by itself: a table of ${t.rowKind.filter((k) => k === 'pic').length} × ${t.colKind.filter((k) => k === 'pic').length} pictures between ruled lines${parts.length ? `; its ${parts.join(' and ')} are left out (Read them with the AI to name the pictures)` : ''}.` }; }
    const r = loose, words = sheetText(img).length;
    if (words >= 3) { r.notext = true; r.said += ` ${words} captions or labels found: left out (they can become names).`; }
    return r;
  }
  function autoCutLoose(img) {
    const W = img.width, H = img.height, d = img.data, bg = cornerBg(img), box = contentBox(img, 40);
    const plain = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] < 16 || Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) <= 30; };
    // runs of plain lines inside the content: the gutters
    const gutters = (len, across, isPlain) => { const runs = []; let start = -1; for (let i = 0; i < len; i++) { let p = 0, n = 0; for (let j = 0; j < across.n; j += Math.max(1, (across.n / 300) | 0)) { n++; if (isPlain(i, across.from + j)) p++; } const g = p / n >= 0.985; if (g && start < 0) start = i; if (!g && start >= 0) { runs.push([start, i - 1]); start = -1; } } return runs; };
    const colRuns = gutters(box.w, { from: box.y, n: box.h }, (i, y) => plain(box.x + i, y)).filter(([a, b]) => a > 0 && b < box.w - 1);
    const rowRuns = gutters(box.h, { from: box.x, n: box.w }, (i, x) => plain(x, box.y + i)).filter(([a, b]) => a > 0 && b < box.h - 1);
    const cols = colRuns.length + 1, rows = rowRuns.length + 1;
    // the cells between the gutters should be about the same size (a grid), and there should be more than one
    const sizes = (runs, len) => { const cuts = [0, ...runs.flatMap(([a, b]) => [a, b + 1]), len], out = []; for (let i = 0; i < cuts.length; i += 2) out.push(cuts[i + 1] - cuts[i]); return out; };
    const even = (a) => a.length > 1 && Math.min(...a) >= Math.max(...a) * 0.8;
    const cw = sizes(colRuns, box.w), ch = sizes(rowRuns, box.h);
    const isGrid = rows * cols >= 2 && (cols === 1 || even(cw)) && (rows === 1 || even(ch));
    if (isGrid) {
      // how full the cells are: the share of each cell that is not plain page
      const cells = gridCells(img, { rows, cols }); let f = 0; for (const c of cells) { let n = 0, k = 0; for (let y = c.y; y < c.y + c.h; y += 3) for (let x = c.x; x < c.x + c.w; x += 3) { k++; if (!plain(x, y)) n++; } f += n / Math.max(1, k); }
      if (f / cells.length > 0.55) return { settings: { mode: 'grid', rows, cols, inset: 0, pad: 6, cut: false, see: true, tol: 16 }, said: `Found by itself: a ${rows} × ${cols} grid of tiles, each kept whole with the page round it see-through.` };
      return { settings: { mode: 'grid', rows, cols, inset: 0, pad: 6, cut: true, see: true }, said: `Found by itself: a ${rows} × ${cols} grid, each picture cut out of its cell.` };
    }
    // no gutters. Finding each picture works for most sheets; but where pictures touch, it joins neighbours together
    // (some found far bigger than the rest). Then: edges that repeat at an even spacing across the sheet, both ways,
    // are cells that touch
    const sh0 = combine(splitJoined(splitSheet(img, { min: 0.002 }), img.width, img.height), img.width, img.height), items = sh0.items, areas = items.map((b) => b.w * b.h).sort((a, b) => a - b), median = areas[areas.length >> 1] || 0;
    const joined = items.length >= 2 && areas[areas.length - 1] > median * 2.5;
    if (joined) {
      const pc = period(img, box, true), pr = period(img, box, false);
      if (pc >= 2 && pr >= 2 && pc <= 16 && pr <= 16 && pr * pc >= items.length && pr * pc <= items.length * 3) return { settings: { mode: 'grid', rows: pr, cols: pc, inset: 0, pad: 6, cut: true, see: true }, said: `Found by itself: a ${pr} × ${pc} grid of cells that touch, each picture cut out of its cell.` };
    }
    return { settings: { mode: 'find', gap: 0, min: 0.2, pad: 6, combine: true, cut: true, see: true }, said: 'Found by itself: pictures in no set grid, so each one is found where it is and cut out.' };
  }
  // how many equal cells a sheet's edges repeat in, along one direction (0: no clear repeat). The edge strength of each
  // line across the content is compared with itself shifted: cells that touch make it repeat at the cell size.
  function period(img, box, across) {
    const W = img.width, d = img.data, len = across ? box.w : box.h, other = across ? box.h : box.w, prof = new Float32Array(len), lum = (x, y) => { const i = (y * W + x) * 4; return 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; };
    const step = Math.max(1, (other / 400) | 0);
    for (let i = 0; i < len - 1; i++) { let s = 0; for (let j = 0; j < other; j += step) s += across ? Math.abs(lum(box.x + i + 1, box.y + j) - lum(box.x + i, box.y + j)) : Math.abs(lum(box.x + j, box.y + i + 1) - lum(box.x + j, box.y + i)); prof[i] = s; }
    let mean = 0; for (const v of prof) mean += v / len; for (let i = 0; i < len; i++) prof[i] -= mean;
    const ac = (k) => { let s = 0; for (let i = 0; i + k < len; i++) s += prof[i] * prof[i + k]; return s / (len - k); }, a0 = ac(0) || 1;
    let best = 0, bestK = 0; const lo = Math.max(8, (len / 40) | 0), hi = (len / 2) | 0;
    for (let k = lo; k <= hi; k++) { const v = ac(k); if (v > best) { best = v; bestK = k; } }
    if (!bestK || best / a0 < 0.25) return 0;
    // the shortest spacing that repeats nearly as strongly is the cell (twice the cell repeats too)
    for (let m = 6; m >= 2; m--) { const k = Math.round(bestK / m); if (k >= lo && ac(k) > best * 0.8) { bestK = k; break; } }
    const n = Math.round(len / bestK); return n >= 2 && Math.abs(len / n - bestK) < bestK * 0.12 ? n : 0;
  }
  // ------------------------------------------------------------------ tables, the main area, ruled-out parts and text
  // the sheet as it looks on white (see-through cells read as white page)
  function onWhite(img) { const o = copy(img), d = o.data; for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; if (a < 1) { d[i] = d[i] * a + 255 * (1 - a); d[i + 1] = d[i + 1] * a + 255 * (1 - a); d[i + 2] = d[i + 2] * a + 255 * (1 - a); d[i + 3] = 255; } } return o; }
  // a reading that looks like words (letters, not a stray mark or the reader describing an empty picture)
  const readsLikeWords = (t) => /[A-Za-z]{2,}/.test(t) && !/^(unanswerable|none|blank|empty|white|no text)\b/i.test(t.trim());
  // the ways a label is shown to the reader, tried in turn when one gives nothing
  const scaled = (img, k) => { const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(canvasOf(img), 0, 0, c.width, c.height); return x.getImageData(0, 0, c.width, c.height); };
  const bolder = (img) => { const o = copy(img), d = o.data, s = img.data, W = img.width, H = img.height; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let m = 255; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H) m = Math.min(m, s[(ny * W + nx) * 4]); } const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = m; } return o; };
  const negative = (img) => { const o = copy(img), d = o.data; for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } return o; };
  // (as seen: on white, and on black, where white words show; each also turned inside out)
  const onBlack = (img) => { const o = copy(img), d = o.data; for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; d[i] *= a; d[i + 1] *= a; d[i + 2] *= a; d[i + 3] = 255; } return o; };
  const TRIES = [(r) => inkOf(r), (r) => onWhite(r), (r) => negative(onWhite(r)), (r) => onBlack(r), (r) => negative(onBlack(r)), (r) => inkOf(scaled(r, 3)), (r) => bolder(inkOf(scaled(r, 2))), (r) => negative(inkOf(scaled(r, 2)))];
  // words made plain for the reader: dark ink on white, however they were drawn (faint grey, white, on a see-through
  // sheet, or white on a pale half see-through band, where onWhite leaves them nearly invisible). Ink is whatever differs
  // from the label's usual pixel, in colour or in how see-through it is (each pixel as its colour times how solid it is,
  // and how solid); the usual difference is white, the strongest few per cent black.
  function inkOf(img) {
    const o = copy(img), d = o.data, n = img.width * img.height, f = new Float32Array(n * 4);
    for (let p = 0; p < n; p++) { const a = d[p * 4 + 3] / 255; f[p * 4] = d[p * 4] * a; f[p * 4 + 1] = d[p * 4 + 1] * a; f[p * 4 + 2] = d[p * 4 + 2] * a; f[p * 4 + 3] = d[p * 4 + 3]; }
    const med = [0, 1, 2, 3].map((c) => { const h = new Uint32Array(256); for (let p = 0; p < n; p++) h[Math.min(255, Math.round(f[p * 4 + c]))]++; let acc = 0; for (let v = 0; v < 256; v++) { acc += h[v]; if (acc >= n / 2) return v; } return 0; });
    const v = new Float32Array(n); for (let p = 0; p < n; p++) v[p] = Math.abs(f[p * 4] - med[0]) + Math.abs(f[p * 4 + 1] - med[1]) + Math.abs(f[p * 4 + 2] - med[2]) + Math.abs(f[p * 4 + 3] - med[3]);
    const sorted = Float32Array.from(v).sort(), lo = sorted[n >> 1], hi = Math.max(lo + 24, sorted[Math.min(n - 1, Math.floor(n * 0.98))]);
    for (let p = 0; p < n; p++) { const g = 255 * (1 - Math.max(0, Math.min(1, (v[p] - lo) / (hi - lo)))), i = p * 4; d[i] = d[i + 1] = d[i + 2] = g; d[i + 3] = 255; }
    return o;
  }
  function lumOf(img) { const n = img.width * img.height, L = new Float32Array(n), d = img.data; for (let p = 0; p < n; p++) { const i = p * 4; L[p] = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; } return L; }
  // the ruled lines of a table, one way: lines that are smooth along themselves and differ from the line two away,
  // over most of the sheet (a picture's edge never runs right across). across: the upright lines
  // how much line i looks like a ruled line: the share of it that is smooth along itself and differs from the line two away
  // (from j0 to j1 along the line only, when given)
  function lineScore(L, W, H, across, i, diff = 8, j0 = 0, j1 = 0) {
    const len = across ? W : H, other = across ? H : W, at = across ? (a, j) => L[j * W + a] : (a, j) => L[a * W + j], end = j1 || other - 1; let n = 0;
    for (let j = j0; j < end; j++) { const v = at(i, j); if (Math.abs(at(i, j + 1) - v) >= 6) continue; if ((i >= 2 && Math.abs(v - at(i - 2, j)) > diff) || (i < len - 2 && Math.abs(v - at(i + 2, j)) > diff)) n++; }
    return n / Math.max(1, end - j0);
  }
  function ruleLines(L, W, H, across) {
    const len = across ? W : H, runs = [];
    for (let i = 0; i < len; i++) { if (lineScore(L, W, H, across, i) < 0.6) continue; const last = runs[runs.length - 1]; if (last && i - last[1] <= 6) last[1] = i; else runs.push([i, i]); }
    return runs;
  }
  // a cell much wider (or taller) than the narrowest of the others is looked at again for a fainter line (grey on a dark
  // sheet): the strongest line well inside it, clearly stronger than the rest of it, splits it (again, if still too wide)
  function fainter(list, L, W, H, across, img) {
    if (list.length < 3) return list; const inner = list.slice(1, -1).map(([a, b]) => b - a + 1), small = Math.min(...inner), out = [];
    const split = ([a, b], depth) => {
      if (depth > 4 || b - a + 1 < small * 1.6) return out.push([a, b]);
      const lo = a + Math.round(small * 0.6), hi = b - Math.round(small * 0.6); let best = -1, bs = 0; const sc = [];
      for (let i = lo; i <= hi; i++) { const v = lineScore(L, W, H, across, i, 4); sc.push(v); if (v > bs) { bs = v; best = i; } }
      const mid = median(sc) || 0;
      if (best < 0 || bs < 0.3 || bs < mid * 2.5 + 0.05) {
        // no line at all (pictures side by side in one plain column): the spacing they repeat at, if they do (columns only:
        // rows of mixed heights repeat too loosely)
        const n = depth || !across ? 0 : period(img, across ? { x: a, y: 0, w: b - a + 1, h: H } : { x: 0, y: a, w: W, h: b - a + 1 }, across);
        if (n >= 2 && (b - a + 1) / n >= small * 0.6) { const step = (b - a + 1) / n; for (let i = 0; i < n; i++) out.push([Math.round(a + i * step), Math.round(a + (i + 1) * step) - 1]); return; }
        return out.push([a, b]);
      }
      split([a, best - 3], depth + 1); split([best + 3, b], depth + 1);
    };
    for (const c of list) split(c, 0);
    return out;
  }
  const cellsOf = (runs, len) => { const cuts = [[-1, -1], ...runs, [len, len]], out = []; for (let k = 0; k + 1 < cuts.length; k++) { const s = cuts[k][1] + 1, e = cuts[k + 1][0] - 1; if (e - s >= Math.max(8, len * 0.02)) out.push([s, e]); } return out; };
  const median = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
  // A line too faint to find (a thin grey line on a dark sheet) joins two or three cells into one: a row or column about
  // two, three… times the usual size is split into that many equal cells.
  function evenSplit(list) {
    if (list.length < 2) return list; const med = median(list.map(([a, b]) => b - a + 1)), out = [];
    for (const [a, b] of list) { const w = b - a + 1, k = Math.round(w / med);
      if (k >= 2 && Math.abs(w - k * med) < med * 0.25) { const step = w / k; for (let i = 0; i < k; i++) out.push([Math.round(a + i * step) + (i ? 2 : 0), Math.round(a + (i + 1) * step) - 1 - (i < k - 1 ? 2 : 0)]); }
      else out.push([a, b]); }
    return out;
  }
  // the colour round the inside edge of a box, and how much it varies (a plain cell or a photo)
  function ringOf(img, x0, y0, x1, y1, k = 4) {
    const W = img.width, d = img.data, v = [[], [], []], L = [];
    const take = (x, y) => { const i = (y * W + x) * 4; v[0].push(d[i]); v[1].push(d[i + 1]); v[2].push(d[i + 2]); L.push(0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]); };
    for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) if (x < x0 + k || x > x1 - k || y < y0 + k || y > y1 - k) take(x, y);
    const m = L.reduce((a, c) => a + c, 0) / Math.max(1, L.length), sd = Math.sqrt(L.reduce((a, c) => a + (c - m) * (c - m), 0) / Math.max(1, L.length));
    // plain: most of the edge is one even colour (a picture may touch it here and there; a photo varies all round)
    const mid = median(L), even = L.filter((x) => Math.abs(x - mid) <= 12).length / Math.max(1, L.length);
    return { rgb: v.map(median), sd, even };
  }
  // A table: cells between ruled lines. Short rows at the top are the title and headings, at the bottom a footer, and in
  // between captions (the names under the row above). The first column is the row labels when it is narrow or a
  // different colour from the cells (a heading column); the last one only when it is narrow.
  function tableOf(img) {
    const w = onWhite(img), W = img.width, H = img.height, L = lumOf(w);
    const hr = ruleLines(L, W, H, false);
    const rows = evenSplit(fainter(cellsOf(hr, H), L, W, H, false, w)), cols = evenSplit(fainter(cellsOf(ruleLines(L, W, H, true), W), L, W, H, true, w));
    if (rows.length < 2 || cols.length < 2) return null;
    let mh = median(rows.map(([a, b]) => b - a)); const mw = median(cols.map(([a, b]) => b - a));
    // a row cut in two by a line that is not one (keyboards' long edges, window title bars all at one height): two short
    // rows side by side that together make about one row are joined back (between the first and last full rows only:
    // the title and headings above are short on purpose)
    { const full = rows.map(([a, b]) => b - a >= mh * 0.75), f = full.indexOf(true), l = full.lastIndexOf(true);
      for (let i = Math.max(0, f); i + 1 <= l && i + 1 < rows.length; i++) { const h1 = rows[i][1] - rows[i][0], h2 = rows[i + 1][1] - rows[i + 1][0], both = rows[i + 1][1] - rows[i][0];
        if (h1 < mh * 0.75 && h2 < mh * 0.75 && both >= mh * 0.8 && both <= mh * 1.3) { rows.splice(i, 2, [rows[i][0], rows[i + 1][1]]); i--; } }
      mh = median(rows.map(([a, b]) => b - a)); }
    const short = rows.map(([a, b]) => b - a < mh * 0.7);
    const rowKind = rows.map(() => 'pic'), colKind = cols.map(() => 'pic');
    let t = 0; while (t < rows.length && short[t]) rowKind[t++] = 'head';
    let b = rows.length - 1; while (b > t && short[b]) rowKind[b--] = 'foot';
    // a short strip between rows: words (thin ink on the page) are captions; a thin strip of solid picture (a row of little
    // windows' title bars that looked like a line) belongs to the row below, so it is joined back onto it; a short row
    // that is all picture is a row of pictures
    for (let i = t; i <= b; i++) if (short[i]) { const r = ringOf(w, cols[0][0], rows[i][0], cols[cols.length - 1][1], rows[i][1], 1e6); rowKind[i] = r.sd <= 6 ? 'gap' : r.even >= 0.6 ? 'caption' : i < b && rows[i][1] - rows[i][0] < mh * 0.4 ? 'join' : 'pic'; } // (a short row full of picture, like monitors, is a picture row)
    for (let i = rows.length - 2; i >= 0; i--) if (rowKind[i] === 'join') { rows.splice(i, 2, [rows[i][0], rows[i + 1][1]]); rowKind.splice(i, 2, 'pic'); short.splice(i, 2, false); }
    // a row or column with nothing in it (the see-through or plain page under a table) is not pictures
    const empty = (x0, y0, x1, y1) => { const r = ringOf(w, x0, y0, x1, y1, 1e6); return r.sd < 3; };
    rows.forEach(([a, b2], i) => { if (rowKind[i] === 'pic' && empty(cols[0][0], a, cols[cols.length - 1][1], b2)) rowKind[i] = i > rows.length / 2 ? 'foot' : 'gap'; });
    const picRows = rows.map((r, i) => i).filter((i) => rowKind[i] === 'pic'); if (!picRows.length) return null;
    const ringAt = (i, j) => ringOf(w, cols[j][0] + 2, rows[i][0] + 2, cols[j][1] - 2, rows[i][1] - 2).rgb;
    const inner = cols.length > 2 ? cols.slice(1, -1).map((c, j) => j + 1) : cols.map((c, j) => j), content = [0, 1, 2].map((k) => median(picRows.flatMap((i) => inner.map((j) => ringAt(i, j)[k]))));
    const first = [0, 1, 2].map((k) => median(picRows.map((i) => ringAt(i, 0)[k]))), diff = Math.abs(first[0] - content[0]) + Math.abs(first[1] - content[1]) + Math.abs(first[2] - content[2]);
    if (cols.length > 2 && (cols[0][1] - cols[0][0] < mw * 0.75 || diff > 40)) colKind[0] = 'label';
    const z = cols.length - 1; if (cols.length > 2 && cols[z][1] - cols[z][0] < mw * 0.75) colKind[z] = 'label';
    return { rows, cols, rowKind, colKind };
  }
  // the box round a table's picture cells (its main area)
  function tableArea(t) {
    const R = t.rows.filter((r, i) => t.rowKind[i] === 'pic' || t.rowKind[i] === 'caption'), C = t.cols.filter((c, j) => t.colKind[j] === 'pic');
    if (!R.length || !C.length) return null; const x = C[0][0], y = R[0][0]; return { x, y, w: C[C.length - 1][1] - x + 1, h: R[R.length - 1][1] - y + 1 };
  }
  // Words in a part of the sheet (a cell, or a found picture with its caption): parts found joining only what is close
  // (letters into words), much lower than the biggest part and wider than tall, not inside the picture itself
  // (the word on a can stays). below: only those under the picture (a caption), not a heading above it.
  function textBits(img, box) {
    const c = cropOf(img, box.x, box.y, box.w, box.h), sh = splitSheet(c, { gap: Math.max(3, Math.round(Math.min(box.w, box.h) / 45)), min: 0.0003 }); if (sh.items.length < 2) return [];
    const main = sh.items.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a)), out = [];
    for (const it of sh.items) {
      if (it === main || it.h >= main.h * 0.3 || it.w < it.h * 1.2) continue;
      // wholly above or below the picture, and about the middle of the cell (a word written across it, smoke or a
      // loose bit beside it stays)
      if (it.y + it.h > main.y && it.y < main.y + main.h) continue;
      if (Math.abs(it.x + it.w / 2 - box.w / 2) > box.w * 0.2) continue;
      out.push({ x: box.x + it.x, y: box.y + it.y, w: it.w, h: it.h, below: it.y >= main.y + main.h * 0.6 });
    }
    return out;
  }
  // does a part look like written words? letters: two or more upright strokes with gaps between them, neither a solid
  // strip (a frame's edge, a shadow) nor a few faint dots
  function wordy(m, W, b) {
    let runs = 0, inRun = false, ink = 0;
    for (let x = b.x; x < b.x + b.w; x++) { let n = 0; for (let y = b.y; y < b.y + b.h; y++) n += m[y * W + x]; ink += n; const on = n > 0; if (on && !inRun) runs++; inRun = on; }
    const fill = ink / (b.w * b.h); return runs >= 2 && fill > 0.12 && fill < 0.75;
  }
  // text found on a whole sheet of loose pictures: words much lower than the usual picture, wider than tall
  function sheetText(img) {
    const sh = splitJoined(splitSheet(img, { gap: Math.max(3, Math.round(Math.max(img.width, img.height) / 300)), min: 0.00002 }), img.width, img.height), items = sh.items; if (items.length < 3) return [];
    const big = items.filter((b) => b.w * b.h > median(items.map((i) => i.w * i.h))), mh = median(big.map((b) => b.h)) || 1;
    // a caption sits centred just under a picture (smoke, grass and loose bits are not centred under one)
    const under = (t) => big.some((b) => Math.abs(t.x + t.w / 2 - (b.x + b.w / 2)) < b.w * 0.2 && t.y >= b.y + b.h - 2 && t.y <= b.y + b.h + Math.max(16, b.h * 0.6));
    const out = items.filter((b) => b.h < mh * 0.35 && b.w >= b.h * 1.2 && under(b) && wordy(sh.m, img.width, b)).map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, below: true }));
    // only a sheet where many pictures have one has captions at all
    return out.length >= Math.max(3, big.length * 0.4) ? out : [];
  }
  // paint a box over with the page (see-through on a see-through sheet)
  function paint(img, b, rgb) {
    const W = img.width, H = img.height, d = img.data, x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y)), x1 = Math.min(W, Math.ceil(b.x + b.w)), y1 = Math.min(H, Math.ceil(b.y + b.h));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4; if (rgb) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; } else d[i + 3] = 0; }
  }
  // the words in the row labels, headings and captions, read by the describing AI
  // The reader sometimes gets one letter wrong (Fants for Fonts). A word of four letters or more that is not one ClipArtCraft
  // knows, but is one letter away from one it does (the AI's picture words, the styles, and their plurals), is corrected.
  let vocab = null;
  function fixSpelling(text) {
    if (!vocab) { vocab = new Set(); const add = (w) => String(w).toLowerCase().split(/[^a-z]+/).forEach((x) => { if (x.length >= 3) { vocab.add(x); vocab.add(x + 's'); vocab.add(x.replace(/y$/, 'ies')); } });
      const N = window.CraftNamer; if (N) { (N.WORDS || []).forEach(add); (N.STYLES || []).forEach(add); (N.FORMS || []).forEach(add); (N.CATEGORIES || []).forEach(add); }
      'original restored modern illustrated sticker dimensional puffy glazed resin collectible realistic illustration contemporary realism pixel clip art classic set icons symbols everyday hardware devices system fonts program network places internet drive optical recycle bin cloud'.split(' ').forEach(add); }
    // only letters the reader mixes up because they look alike (Fants for Fonts, not Pants); when unsure, it is left alone
    const ALIKE = ['ao', 'ec', 'ce', 'il', 'li', 'mn', 'nm', 'uv', 'vu', 'rn', 'hn', 'nh', 'oe', 'eo', 'ae', 'ea', 'yv', 'tf', 'ft', 'oa', 'ij', 'ji', 'gq', 'qg', 'bh', 'hb', 'cl'];
    const looksAlike = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return ALIKE.includes(a[i] + b[i]); return false; };
    const one = (a, b) => { if (Math.abs(a.length - b.length) > 1) return false; let i = 0, j = 0, d = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++d > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } } return d + (a.length - i) + (b.length - j) <= 1; };
    return String(text).replace(/[A-Za-z]{4,}/g, (w) => { const lw = w.toLowerCase(); if (vocab.has(lw)) return w; const near = [...vocab].filter((v) => v.length >= 4 && v.length === lw.length && one(lw, v) && looksAlike(lw, v)), hit = near.length === 1 ? near[0] : ''; if (!hit) return w;
      return w === w.toUpperCase() ? hit.toUpperCase() : w[0] === w[0].toUpperCase() ? hit[0].toUpperCase() + hit.slice(1) : hit; });
  }
  // the reader squeezes what it reads into a square: a long strip (a title, a heading) is put on a square of its own page
  // first, so its letters keep their shape
  function squareOf(img) { const n = Math.max(img.width, img.height), c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), bg = cornerBg(img); x.fillStyle = `rgb(${bg.join(',')})`; x.fillRect(0, 0, n, n); x.drawImage(canvasOf(img), 0, Math.round((n - img.height) / 2)); return c; }
  let readingNow = '';
  const sayReading = (t) => { readingNow = t; const b = el && el.querySelector('[data-sl=read]'); if (b) { b.disabled = !!t; b.textContent = t || readLabel(); } };
  const readLabel = () => `Read the ${S.mode === 'table' && table ? 'labels and headings' : `captions (${captions.filter((t) => t.own).length})`} with the AI`;
  async function readLabels(btn, quiet) {
    const N = window.CraftNamer; if (!N || !N.read) return quiet || (opts.toast && opts.toast('The describing AI is not here.'));
    if (readingNow) return; const mine = sheet;
    if (!(await N.describerDownloaded()) && (quiet || !confirm('Reading the words needs the describing AI (about 250 MB, downloaded once and kept). Download it now?'))) return;
    // the reader runs lines together ("OriginalPixel Clip Art", "Submarine(Sub)"): a space goes back where a small letter
    // meets a capital, and before a bracket
    const spaced = (t) => String(t || '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/(\S)\(/g, '$1 (').replace(/\)(\S)/g, ') $1').replace(/\s+/g, ' ').trim();
    const tidy = (t) => fixSpelling(spaced(t).replace(/^\s*\d+\s*[.):]?\s*/, '').trim()), jobs = [];
    if (S.mode === 'table' && table) {
      const pr = table.rows.map((r, i) => i).filter((i) => table.rowKind[i] === 'pic'), pc = table.cols.map((c, j) => j).filter((j) => table.colKind[j] === 'pic'), lc = table.colKind.indexOf('label');
      let hr = -1; for (let i = 0; i < table.rows.length && table.rowKind[i] !== 'pic'; i++) if (table.rowKind[i] === 'head') hr = i;
      // above the headings, the sheet's title (read across the whole sheet)
      const tr = table.rowKind.indexOf('head'); if (tr >= 0 && tr < hr) jobs.push({ box: { x: 0, y: table.rows[tr][0], w: sheet.width, h: table.rows[tr][1] - table.rows[tr][0] + 1 }, set: (t) => { const raw = String(t || '').trim(), cut = raw.search(/[a-z0-9][A-Z]/); sheetTitle = spaced(cut > 8 ? raw.slice(0, cut + 1) : raw); } }); // (a subtitle run on after it is left off)
      if (lc >= 0) pr.forEach((i, r) => jobs.push({ box: { x: table.cols[lc][0], y: table.rows[i][0], w: table.cols[lc][1] - table.cols[lc][0] + 1, h: table.rows[i][1] - table.rows[i][0] + 1 }, set: (t) => { rowNames[r] = tidy(t); } }));
      if (hr >= 0) pc.forEach((j, c) => jobs.push({ box: { x: table.cols[j][0], y: table.rows[hr][0], w: table.cols[j][1] - table.cols[j][0] + 1, h: table.rows[hr][1] - table.rows[hr][0] + 1 }, set: (t) => { colNames[c] = tidy(t); } }));
    }
    for (const t of captions) if (t.own) jobs.push({ box: { x: t.x + wx - 2, y: t.y + wy - 2, w: t.w + 4, h: t.h + 4 }, set: (x) => { readText.set(keyOf(t), tidy(x)); } });
    if (!jobs.length) return quiet || (opts.toast && opts.toast('No labels, headings or captions to read.'));
    let k = 0; sayReading('Reading…');
    try {
      for (const j of jobs) {
        if (sheet !== mine) { sayReading(''); return; } // another sheet was opened meanwhile
        sayReading(`Reading ${++k} of ${jobs.length}…`);
        const b = j.box, x0 = Math.max(0, Math.round(b.x)), y0 = Math.max(0, Math.round(b.y)), raw = cropOf(sheet, x0, y0, Math.min(sheet.width - x0, Math.round(b.w)), Math.min(sheet.height - y0, Math.round(b.h)));
        // tries, one after another until one reads like words: the words as dark ink; as seen on white and on black, and each
        // inverted; then bigger, bolder, light on dark
        let said = '';
        for (const make of TRIES) {
          const part = make(raw), readIt = () => N.read(squareOf(part), { progress: (a, t) => sayReading(`Getting the AI: ${Math.round((a / t) * 100)}%`) });
          said = String((window.CraftKeys ? await CraftKeys.track('local', readIt) : await readIt()) || '').trim(); if (sheet !== mine) { sayReading(''); return; }
          if (readsLikeWords(said)) break; said = '';
        }
        j.set(said); if (k % 4 === 0) { renderNames(); draw(); }
      }
      opts.toast && opts.toast(`${jobs.length} label${jobs.length === 1 ? '' : 's'} read${quiet ? ' by itself' : ''}: check them in the panel.`);
    } catch (e) { console.error(e); opts.toast && opts.toast('Reading failed: ' + (e.message || e)); }
    sayReading(''); rememberHeads(); renderNames(); draw();
  }
  // dragging on the sheet: the main area, ruled-out boxes and the found boxes' edges (in the sheet's pixels)
  let drag = null;
  const ptOf = (e) => { const c = el.querySelector('canvas'), r = c.getBoundingClientRect(), k = sheet.width / r.width; return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, k, r }; };
  // the main area's four handles (the middles of its edges), and which edge a point is on
  const areaHandles = () => (area ? [[area.x + area.w / 2, area.y], [area.x + area.w / 2, area.y + area.h], [area.x, area.y + area.h / 2], [area.x + area.w, area.y + area.h / 2]] : []);
  const onHandle = (p, t) => { const k = areaHandles().findIndex(([hx, hy]) => Math.abs(p.x - hx) <= t * 1.6 && Math.abs(p.y - hy) <= t * 1.6); return k < 0 ? null : [{ t: 1 }, { b: 1 }, { l: 1 }, { r: 1 }][k]; };
  // which edges of a box a point is on (within t)
  function edgesAt(b, p, t) {
    const inY = p.y >= b.y - t && p.y <= b.y + b.h + t, inX = p.x >= b.x - t && p.x <= b.x + b.w + t, e = {};
    if (inY && Math.abs(p.x - b.x) <= t) e.l = 1; if (inY && Math.abs(p.x - (b.x + b.w)) <= t) e.r = 1; if (inX && Math.abs(p.y - b.y) <= t) e.t = 1; if (inX && Math.abs(p.y - (b.y + b.h)) <= t) e.b = 1;
    return Object.keys(e).length ? e : null;
  }
  const sheetBox = (b) => { const p = S.mode === 'find' && !b.fixed ? +S.pad : 0; return { x: b.x + wx - p, y: b.y + wy - p, w: b.w + p * 2, h: b.h + p * 2 }; };
  // the box a drag makes: its edges moved, or from where it began to here
  function dragBox(d, p) {
    if (d.edges) { let { x, y, w, h } = d.from, x1 = x + w, y1 = y + h; const dx = p.x - d.p0.x, dy = p.y - d.p0.y; if (d.edges.l) x += dx; if (d.edges.r) x1 += dx; if (d.edges.t) y += dy; if (d.edges.b) y1 += dy;
      return { x: Math.min(x, x1), y: Math.min(y, y1), w: Math.abs(x1 - x), h: Math.abs(y1 - y) }; }
    return { x: Math.min(d.p0.x, p.x), y: Math.min(d.p0.y, p.y), w: Math.abs(p.x - d.p0.x), h: Math.abs(p.y - d.p0.y) };
  }
  const clampBox = (b) => { const x = Math.max(0, Math.round(b.x)), y = Math.max(0, Math.round(b.y)); return { x, y, w: Math.max(1, Math.min(sheet.width - x, Math.round(b.w + b.x - x))), h: Math.max(1, Math.min(sheet.height - y, Math.round(b.h + b.y - y))) }; };
  function showDrag(b, r, k, as) { if (b && tool === 'solid' && (S.touch || {}).shape === 'ellipse' && as === 'solid') { const pts = shapeOf(b); showLasso(pts, r, k); return; } if (!b && !poly) showLasso(null); let d = el.querySelector('.sl-drag'); if (!b) { if (d) d.remove(); return; } if (!d) { d = document.createElement('div'); d.className = 'sl-drag'; el.append(d); } d.dataset.tool = as || tool; Object.assign(d.style, { left: `${r.left + b.x / k}px`, top: `${r.top + b.y / k}px`, width: `${b.w / k}px`, height: `${b.h / k}px` }); }
  // The lasso, the way Photoshop's works: drag to draw freehand (it closes when let go, if it was begun with a drag), or
  // click (or Shift-click) to put straight corners, mixing both; the first corner, a double-click or Enter closes it,
  // Backspace takes the last corner off, Escape gives it up. Alt held when it closes: that one erases.
  let poly = null;
  function closePoly(alt) {
    if (!poly) return; const pts = poly.pts; poly = null; showLasso(null); if (pts.length < 3) return;
    const t = S.touch || {}; marks.push({ pts: pts.map(([x, y]) => [Math.round(x), Math.round(y)]), op: alt ? 'erase' : t.op || 'keep', side: t.side || 'in' }); renderPanel(); draw();
  }
  function lassoKey(e) {
    if (!poly) return false;
    if (e.key === 'Enter') { closePoly(e.altKey); return true; }
    if (e.key === 'Escape') { poly = null; showLasso(null); return true; }
    if (e.key === 'Backspace') { poly.pts.pop(); if (!poly.pts.length) { poly = null; showLasso(null); } else if (lastPt) showLasso([...poly.pts, lastPt.at], lastPt.r, lastPt.k); return true; }
    return false;
  }
  let lastPt = null;
  // a shape the touch-up makes from a dragged box: the box itself, or the ellipse in it
  const shapeOf = (b) => (S.touch || {}).shape === 'ellipse' ? Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; return [b.x + b.w / 2 + (Math.cos(a) * b.w) / 2, b.y + b.h / 2 + (Math.sin(a) * b.h) / 2]; }) : [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]];
  // the lasso as it is drawn (an outline over the sheet)
  function showLasso(pts, r, k) {
    let v = el.querySelector('.sl-lasso'); if (!pts) { if (v) v.remove(); return; }
    if (!v) { v = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); v.setAttribute('class', 'sl-lasso'); v.innerHTML = '<polygon/>'; el.append(v); }
    v.querySelector('polygon').setAttribute('points', pts.map(([x, y]) => `${(r.left + x / k).toFixed(1)},${(r.top + y / k).toFixed(1)}`).join(' ')); v.dataset.op = (S.touch || {}).op || 'keep';
  }
  function onDown(e) {
    if (!sheet || e.button !== 0) return; const p = ptOf(e), t = 8 * p.k; let target = null, edges = null, from = null;
    if (tool === 'area' && area) { edges = edgesAt(area, p, t); if (edges) from = { ...area }; }
    let areaDrag = false; if (!edges && area) { edges = onHandle(p, t); if (edges) { from = { ...area }; areaDrag = true; } }
    if (tool === 'pick') for (let i = boxes.length - 1; i >= 0 && !edges; i--) { if (skip.has(i)) continue; const sb = sheetBox(boxes[i]); edges = edgesAt(sb, p, t); if (edges) { from = sb; target = boxes[i]; } }
    let lasso = false;
    if (tool === 'solid' && (S.touch || {}).shape === 'lasso' && !areaDrag) {
      lasso = true;
      if (poly && poly.pts.length >= 3 && Math.hypot(p.x - poly.pts[0][0], p.y - poly.pts[0][1]) <= 10 * p.k) { closePoly(e.altKey); e.preventDefault(); return; } // back on the first corner
      if (!poly) poly = { pts: [[p.x, p.y]], free: null }; else poly.pts.push([p.x, p.y]);
    }
    drag = { p0: p, edges, from, target, moved: false, areaDrag, lasso }; e.target.setPointerCapture(e.pointerId); e.preventDefault();
  }
  function onMove(e) {
    if (!sheet) return; const p = ptOf(e), c = e.target;
    hover = { x: Math.max(0, Math.min(sheet.width - 1, Math.floor(p.x))), y: Math.max(0, Math.min(sheet.height - 1, Math.floor(p.y))) }; status();
    if (!drag && poly) { lastPt = { at: [p.x, p.y], r: p.r, k: p.k }; showLasso([...poly.pts, [p.x, p.y]], p.r, p.k); c.style.cursor = 'crosshair'; return; } // the line to the next corner
    if (!drag) { // the cursor says what a press would do
      const t = 8 * p.k; let ed = onHandle(p, t); if (!ed && tool === 'area' && area) ed = edgesAt(area, p, t); if (tool === 'pick') for (let i = 0; i < boxes.length && !ed; i++) if (!skip.has(i)) ed = edgesAt(sheetBox(boxes[i]), p, t);
      c.style.cursor = ed ? (ed.l || ed.r ? (ed.t || ed.b ? ((ed.l && ed.t) || (ed.r && ed.b) ? 'nwse-resize' : 'nesw-resize') : 'ew-resize') : 'ns-resize') : tool === 'pick' ? 'pointer' : 'crosshair'; return; }
    if (!drag.moved && Math.hypot(p.x - drag.p0.x, p.y - drag.p0.y) < 4 * p.k) return;
    if (tool === 'pick' && !drag.edges) return; drag.moved = true;
    if (drag.lasso && poly) { if (poly.free === null) poly.free = poly.pts.length === 1; const l = poly.pts[poly.pts.length - 1]; if (Math.hypot(p.x - l[0], p.y - l[1]) > 2 * p.k) poly.pts.push([p.x, p.y]); showLasso(poly.pts, p.r, p.k); return; }
    showDrag(dragBox(drag, p), p.r, p.k, drag.areaDrag ? 'area' : tool);
  }
  function onUp(e) {
    if (!drag) return; const d = drag, p = ptOf(e); drag = null; showDrag(null);
    if (d.lasso) { if (poly && poly.free && d.moved) closePoly(e.altKey); else if (poly && d.moved === false && poly.free === null) poly.free = false; return; } // (begun with a drag: closes when let go; begun with clicks: stays open)
    if (!d.moved) { // a click
      if (tool === 'out') { const i = outs.findIndex((o) => p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y && p.y <= o.y + o.h); if (i >= 0) { outs.splice(i, 1); renderPanel(); find(); } return; }
      if (tool === 'solid') { let i = -1; marks.forEach((mk, j) => { if (inPoly(mk.pts, p.x, p.y)) i = j; }); if (i >= 0) { marks.splice(i, 1); renderPanel(); draw(); } return; }
      if (tool !== 'pick') return;
      const i = boxes.findIndex((b) => { const sb = sheetBox(b); return p.x >= sb.x && p.x <= sb.x + sb.w && p.y >= sb.y && p.y <= sb.y + sb.h; });
      // Ctrl-click: choose several (to join them); a plain click leaves a picture out (or puts it back)
      if (i >= 0 && (e.ctrlKey || e.metaKey)) { const k = boxes[i].key; if (chosenBoxes.has(k)) chosenBoxes.delete(k); else chosenBoxes.add(k); draw(); if (chosenBoxes.size === 2) opts.toast && opts.toast('Right-click to join the chosen boxes into one picture.'); return; }
      if (chosenBoxes.size) { chosenBoxes.clear(); draw(); }
      if (i >= 0) { if (skip.has(i)) skip.delete(i); else skip.add(i); draw(); count(); return; }
      // a table's row label or column heading: that whole row or column out (or back)
      if (S.mode === 'table' && table) { const pr = table.rows.map((r, j) => j).filter((j) => table.rowKind[j] === 'pic'), pc = table.cols.map((c, j) => j).filter((j) => table.colKind[j] === 'pic');
        const ci = table.cols.findIndex((c) => p.x >= c[0] && p.x <= c[1]), ri = table.rows.findIndex((r) => p.y >= r[0] && p.y <= r[1]);
        if (ri >= 0 && table.colKind[ci] === 'label' && pr.includes(ri)) { const r = pr.indexOf(ri); if (offRows.has(r)) offRows.delete(r); else offRows.add(r); skip.clear(); renderPanel(); find(); return; }
        if (ci >= 0 && table.rowKind[ri] === 'head' && pc.includes(ci)) { const c = pc.indexOf(ci); if (offCols.has(c)) offCols.delete(c); else offCols.add(c); skip.clear(); renderPanel(); find(); return; } }
      return;
    }
    const b = clampBox(dragBox(d, p)); if (b.w < 6 || b.h < 6) return;
    if (d.areaDrag || tool === 'area') { area = b.x === 0 && b.y === 0 && b.w === sheet.width && b.h === sheet.height ? null : b; skip.clear(); fitTable(); }
    else if (tool === 'out') outs.push(b);
    else if (tool === 'solid') { const t = S.touch || {}; marks.push({ pts: shapeOf(b).map(([x, y]) => [Math.round(x), Math.round(y)]), op: e.altKey ? 'erase' : t.op || 'keep', side: t.side || 'in' }); renderPanel(); draw(); return; }
    else if (tool === 'grid') { const n = askGrid(b); if (!n) return; zones.push({ ...b, ...n }); skip.clear(); }
    else if (d.target) moved.set(d.target.key, b); // a box moved by hand: cut from just that box from now on
    renderPanel(); find();
  }
  // ------------------------------------------------------------------ looking at the sheet: zoom, pan, turn, and its properties
  // zoom is relative to fitting the window (1 = fit); the mouse wheel zooms round the mouse, the middle button held pans
  let zoom = 1, hover = null, original = null;
  const desk = () => el.querySelector('.sl-desk');
  function fitScale() { const d = desk(); return sheet ? Math.min((d.clientWidth - 40) / sheet.width, (d.clientHeight - 40) / sheet.height) : 1; }
  function applyZoom(at) {
    if (!sheet) return; const c = el.querySelector('.sl-desk canvas'), d = desk(), before = c.getBoundingClientRect();
    const k = fitScale() * zoom; c.style.width = `${Math.max(1, sheet.width * k)}px`; c.style.height = `${Math.max(1, sheet.height * k)}px`;
    if (at && before.width) { const fx = (at.x - before.left) / before.width, fy = (at.y - before.top) / before.height, r = c.getBoundingClientRect(); d.scrollLeft += r.left + fx * r.width - at.x; d.scrollTop += r.top + fy * r.height - at.y; }
    const z = el.querySelector('.sl-zoom'); if (z) z.textContent = zoom === 1 ? 'Fit' : `${Math.round(k * 100)}%`; status();
  }
  function setZoom(z, at) { zoom = Math.max(0.1, Math.min(40, z)); applyZoom(at); }
  function wireView() {
    const d = desk();
    d.addEventListener('wheel', (e) => { if (!sheet) return; e.preventDefault(); setZoom(zoom * Math.pow(1.15, e.deltaY < 0 ? 1 : -1), { x: e.clientX, y: e.clientY }); }, { passive: false });
    let pan = null;
    d.addEventListener('pointerdown', (e) => { if (e.button !== 1 || !sheet) return; e.preventDefault(); pan = { x: e.clientX, y: e.clientY, l: d.scrollLeft, t: d.scrollTop }; d.setPointerCapture(e.pointerId); d.classList.add('panning'); });
    d.addEventListener('pointermove', (e) => { if (!pan) return; d.scrollLeft = pan.l - (e.clientX - pan.x); d.scrollTop = pan.t - (e.clientY - pan.y); });
    const stop = () => { pan = null; d.classList.remove('panning'); }; d.addEventListener('pointerup', stop); d.addEventListener('pointercancel', stop);
    d.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); }); // no auto-scroll arrows
    d.addEventListener('pointerleave', () => { hover = null; status(); });
    addEventListener('resize', () => { if (el && !el.hidden) applyZoom(); });
  }
  // the sheet turned or flipped (everything found on it starts again: the boxes no longer fit)
  function transform(kind) {
    if (!sheet) return; const W = sheet.width, H = sheet.height, src = canvasOf(sheet), c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
    if (kind === 'reset') { if (!original) return; sheet = original; }
    else {
      const deg = kind === 'left' ? -90 : kind === 'right' ? 90 : kind === 'straight' ? +(el.querySelector('[data-straight]').value || 0) : 0; if (kind === 'straight' && !deg) return;
      const a = (deg * Math.PI) / 180, cw = Math.round(Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a))), ch = Math.round(Math.abs(W * Math.sin(a)) + Math.abs(H * Math.cos(a)));
      c.width = kind === 'flipx' || kind === 'flipy' ? W : cw; c.height = kind === 'flipx' || kind === 'flipy' ? H : ch;
      // a slant leaves corners: filled with the page (see-through on a see-through sheet)
      if (kind === 'straight') { let clear = false; for (let i = 3; i < sheet.data.length; i += 4) if (sheet.data[i] < 250) { clear = true; break; } if (!clear) { const bg = cornerBg(sheet); x.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`; x.fillRect(0, 0, c.width, c.height); } }
      x.translate(c.width / 2, c.height / 2); if (kind === 'flipx') x.scale(-1, 1); else if (kind === 'flipy') x.scale(1, -1); else x.rotate(a); x.imageSmoothingQuality = 'high'; x.drawImage(src, -W / 2, -H / 2);
      sheet = x.getImageData(0, 0, c.width, c.height);
    }
    past = []; future = []; now = ''; svgSheet = null; area = null; outs = []; zones = []; marks = []; joins = []; chosenBoxes.clear(); table = null; offRows.clear(); offCols.clear(); rowNames = []; colNames = []; captions = []; readText.clear(); moved.clear(); prefs.clear(); splits.clear(); skip.clear(); pagePlain = null;
    try { const a = autoCut(sheet); Object.assign(S, a.settings); autoSaid = a.said; table = a.table || null; area = a.area || null; S.notext = !!a.notext; } catch (e) { autoSaid = ''; }
    zoom = 1; renderPanel(); find(); applyZoom();
  }
  // the properties bar under the sheet: the file, its size, its page, the zoom, and the pixel under the mouse
  function status() {
    const b = el && el.querySelector('.sl-status'); if (!b) return; if (!sheet) { b.innerHTML = '<span class="hint">No sheet open</span>'; return; }
    let clear = false; for (let i = 3; i < sheet.data.length; i += 4 * 97) if (sheet.data[i] < 250) { clear = true; break; }
    const pg = work && work.page, f = sheetFile, kb = f ? (f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`) : '', fmt = f ? (f.name.split('.').pop() || '').toUpperCase() : '';
    let px = ''; if (hover) { const i = (hover.y * sheet.width + hover.x) * 4, d = sheet.data; px = `<span>x ${hover.x}, y ${hover.y}</span><span><i class="sw" style="background:rgba(${d[i]},${d[i + 1]},${d[i + 2]},${d[i + 3] / 255})"></i>#${[d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}${d[i + 3] < 255 ? ` · ${Math.round((d[i + 3] / 255) * 100)}% seen` : ''}</span>`; }
    b.innerHTML = `<span title="${esc(f ? f.name : '')}"><b>${esc(sheetName)}</b>${fmt ? ` · ${esc(fmt)}` : ''}${kb ? ` · ${kb}` : ''}</span><span>${sheet.width} × ${sheet.height} px${sheet === original ? '' : ' (turned)'}</span>
      <span>${clear ? 'see-through background' : pg ? `page <i class="sw" style="background:rgb(${pg.join(',')})"></i>` : ''}</span>${area ? `<span>main area ${area.w} × ${area.h}</span>` : ''}${outs.length ? `<span>${outs.length} ruled out</span>` : ''}
      <span><b>${boxes.length - skip.size}</b> of ${boxes.length} pictures</span><span class="grow"></span>${px}<span>zoom ${Math.round(fitScale() * zoom * 100)}%</span>`;
  }
  function pickSheet() { return new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.svg'; i.multiple = true; i.onchange = () => ok([...i.files]); i.click(); }); }
  // Several sheets at once: the first is opened, the rest wait; adding (or skipping) one opens the next.
  let queue = [], queueN = 0;
  function loadMany(files) { files = (files || []).filter((f) => /^image\//.test(f.type) || /\.svg$/i.test(f.name)); if (!files.length) return; queue = files.slice(1); queueN = files.length; load(files[0]); }
  function next() { if (!queue.length) { queueN = 0; return false; } load(queue.shift()); return true; }
  function build() {
    el = document.createElement('div'); el.className = 'slicer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Montage Slicer');
    el.innerHTML = `<div class="sl-bar"><b>Montage Slicer</b><span class="hint">Cut a sheet of clip art into separate pictures for the library</span><span class="grow"></span><button class="btn outline" type="button" data-sl="close">Close</button></div>
      <div class="sl-main"><div class="sl-left"><div class="imp-tools sl-tools" role="toolbar" aria-label="Sheet tools">
        <button class="btn outline" type="button" data-hist="undo" disabled title="Undo (Ctrl+Z)">↶ Undo</button><button class="btn outline" type="button" data-hist="redo" disabled title="Redo (Ctrl+Y)">↷ Redo</button><span class="sep"></span>
        <div class="seg" role="group" aria-label="Zoom"><button class="btn" type="button" data-z="out" title="Zoom out (mouse wheel down)">−</button><button class="btn sl-zoom" type="button" data-z="fit" title="Fit the sheet in the window (Ctrl+0)">Fit</button><button class="btn" type="button" data-z="in" title="Zoom in (mouse wheel up)">+</button></div>
        <button class="btn outline" type="button" data-z="100" title="Actual pixels (Ctrl+1)">100%</button><span class="sep"></span>
        <button class="btn outline" type="button" data-tf="left" title="Turn the sheet a quarter to the left">⟲ Left</button><button class="btn outline" type="button" data-tf="right" title="Turn the sheet a quarter to the right">⟳ Right</button>
        <button class="btn outline" type="button" data-tf="flipx" title="Flip left to right">⇋ Flip</button><button class="btn outline" type="button" data-tf="flipy" title="Flip top to bottom">⇅ Flip</button><span class="sep"></span>
        <label class="hint sl-straight" title="Straighten a scanned sheet that sits at a slant (degrees, minus is to the left)">Straighten <input class="input" type="number" step="0.1" min="-45" max="45" value="0" data-straight> °</label><button class="btn outline" type="button" data-tf="straight">Turn</button>
        <button class="btn outline" type="button" data-tf="reset" title="Back to the sheet as it was opened">As opened</button><span class="sep"></span>
        <div class="seg" role="group" aria-label="Show on the sheet"><button class="btn" type="button" data-show="showNames" aria-pressed="${S.showNames !== false}" title="Show the numbers and names (N)">Names</button><button class="btn" type="button" data-show="showBoxes" aria-pressed="${S.showBoxes !== false}" title="Show the boxes (B)">Boxes</button></div></div>
        <div class="sl-desk"><div class="sl-stage"><canvas hidden></canvas></div><div class="sl-empty"><button class="btn primary" type="button" data-sl="open">Choose a sheet…</button><p class="hint">or drop a picture here</p></div></div>
        <div class="sl-status" aria-live="off"></div></div><aside class="sl-side side right"></aside></div>`;
    wireView();
    el.addEventListener('click', async (e) => {
      const rv = e.target.closest('[data-rv]');
      if (rv && rv.dataset.rv === 'back') { el.querySelector('.sl-review').hidden = true; return; }
      if (rv && rv.dataset.rv === 'add') return addReviewed(rv);
      if (e.target.matches('[data-keep]')) { const i = +e.target.closest('[data-i]').dataset.i; review[i].keep = e.target.checked; const y = el.querySelector('.rv-grid').scrollTop; showReview(); el.querySelector('.rv-grid').scrollTop = y; return; }
      const a = e.target.closest('[data-sl]'), m = e.target.closest('[data-mode]');
      if (a && a.dataset.sl === 'close') return close();
      if (a && a.dataset.sl === 'open') return loadMany(await pickSheet());
      if (a && a.dataset.sl === 'skip') { if (!next()) { forget(); close(); } return; }
      if (a && a.dataset.sl === 'add') return addAll();
      if (m) { S.mode = m.dataset.mode; autoSaid = ''; keep(); skip.clear(); offRows.clear(); offCols.clear(); rowNames = []; colNames = [];
        if (S.mode === 'table') { table = tableOf(sheet); if (table) { area = tableArea(table) || area; S.notext = true; } }
        renderPanel(); find(); return; }
      const sd = e.target.closest('[data-side]'); if (sd) { const k = sd.dataset.side, ed = { t: 'auto', b: 'auto', l: 'auto', r: 'auto', ...(S.edges || {}) }; ed[k] = { auto: 'on', on: 'off', off: 'auto' }[ed[k]]; S.edges = ed; keep(); renderPanel(); draw(); return; }
      const ae = e.target.closest('[data-edges]'); if (ae) { const v = ae.dataset.edges; S.edges = { t: v, b: v, l: v, r: v }; keep(); renderPanel(); draw(); return; }
      const v = e.target.closest('[data-view]'); if (v) { S.view = v.dataset.view; keep(); renderPanel(); draw(); return; }
      const hb = e.target.closest('[data-hist]'); if (hb) { if (hb.dataset.hist === 'undo') undo(); else redo(); return; }
      const zb = e.target.closest('[data-z]'); if (zb) { const z = zb.dataset.z; if (z === 'fit') setZoom(1); else if (z === '100') setZoom(1 / fitScale()); else { const r = desk().getBoundingClientRect(); setZoom(zoom * (z === 'in' ? 1.25 : 0.8), { x: r.left + r.width / 2, y: r.top + r.height / 2 }); } return; }
      const tf = e.target.closest('[data-tf]'); if (tf) return transform(tf.dataset.tf);
      const tl = e.target.closest('[data-tool]'); if (tl) { poly = null; showLasso(null); tool = tl.dataset.tool; renderPanel(); return; }
      if (a && a.dataset.sl === 'whole') { area = null; skip.clear(); renderPanel(); find(); return; }
      if (a && a.dataset.sl === 'clear-outs') { outs = []; renderPanel(); find(); return; }
      if (a && a.dataset.sl === 'unsolid') { marks = []; renderPanel(); draw(); return; }
      const tc = e.target.closest('[data-touch]'); if (tc) { const [k, v] = tc.dataset.touch.split(':'); S.touch = { shape: 'box', op: 'keep', side: 'in', ...(S.touch || {}), [k]: v }; keep(); renderPanel(); return; }
      const vw = e.target.closest('[data-show]'); if (vw) { const k = vw.dataset.show; S[k] = S[k] === false; keep(); vw.setAttribute('aria-pressed', S[k] !== false); draw(); return; }
      if (a && a.dataset.sl === 'unzone') { zones = []; skip.clear(); renderPanel(); find(); return; }
      if (a && a.dataset.sl === 'unmove') { moved.clear(); prefs.clear(); splits.clear(); renderPanel(); find(); return; }
      if (a && a.dataset.sl === 'read') return readLabels(a);
      if (a && a.dataset.sl === 'lastheads') { colNames = heads().last.slice(0, colCount()); renderNames(); draw(); return; }
      const setName = () => (el.querySelector('[data-headset]') || {}).value;
      if (a && a.dataset.sl === 'useset') { const l = heads().sets[setName()]; if (!l) return; colNames = l.slice(0, colCount()); if (l.length !== colCount()) opts.toast && opts.toast(`That list has ${l.length} headings; this sheet has ${colCount()} columns.`); renderNames(); draw(); return; }
      if (a && a.dataset.sl === 'saveset') { const now = colNames.slice(0, colCount()).map((h) => String(h || '').trim()); if (!now.some(Boolean)) return opts.toast && opts.toast('Type or read the headings first.'); const n = prompt('Name for this list of headings:', sheetTitle || ''); if (!n || !n.trim()) return; const h = heads(); h.sets[n.trim()] = now; saveHeads(h); renderNames(); opts.toast && opts.toast(`Saved the list “${n.trim()}”.`); return; }
      if (a && a.dataset.sl === 'delset') { const n = setName(); if (!n || !confirm(`Remove the list “${n}”?`)) return; const h = heads(); delete h.sets[n]; saveHeads(h); renderNames(); return; }
      const rc = e.target.closest('input[data-row], input[data-col]'); if (rc) { const set = rc.dataset.row !== undefined ? offRows : offCols, i = +(rc.dataset.row ?? rc.dataset.col); if (rc.checked) set.delete(i); else set.add(i); skip.clear(); find(); return; }
    });
    const cv = el.querySelector('canvas'); cv.addEventListener('dblclick', (e) => { if (poly) { poly.pts.pop(); closePoly(e.altKey); } }); cv.addEventListener('contextmenu', onMenu); cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', () => { drag = null; showDrag(null); });
    el.addEventListener('input', (e) => { if (e.target.matches('[data-name]')) { review[+e.target.closest('[data-i]').dataset.i].name = e.target.value; return; }
      if (e.target.dataset.rowname !== undefined) { rowNames[+e.target.dataset.rowname] = e.target.value; clearTimeout(timer); timer = setTimeout(draw, 200); return; }
      if (e.target.dataset.colname !== undefined) { colNames[+e.target.dataset.colname] = e.target.value; return; }
      if (e.target.dataset.title !== undefined) { sheetTitle = e.target.value; return; }
      if (e.target.dataset.m) { // the main area's margins typed in
        const a = area || { x: 0, y: 0, w: sheet.width, h: sheet.height }, m = { t: a.y, l: a.x, b: sheet.height - a.y - a.h, r: sheet.width - a.x - a.w }; m[e.target.dataset.m] = Math.max(0, +e.target.value || 0);
        const w = sheet.width - m.l - m.r, h = sheet.height - m.t - m.b; if (w < 8 || h < 8) return; area = m.t || m.l || m.b || m.r ? { x: m.l, y: m.t, w, h } : null; skip.clear(); fitTable(); later(); return; }
      const k = e.target.dataset.k; if (!k) return; S[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? +e.target.value : e.target.value; keep();
      if (k === 'names') draw(); else if (k === 'cut' || k === 'see' || k === 'notext') { renderPanel(); later(0); } else if (k === 'tol' || k === 'roomPx') { clearTimeout(timer); timer = setTimeout(draw, 150); } else if (k !== 'category' && k !== 'svg') later(); });
    el.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    el.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); loadMany([...e.dataTransfer.files]); });
    el.addEventListener('dragenter', (e) => e.stopPropagation()); el.addEventListener('dragleave', (e) => e.stopPropagation());
    document.body.append(el);
  }
  function onKey(e) {
    if (!el || el.hidden) return; if (lassoKey(e)) { e.preventDefault(); return; }
    if (e.key === 'Escape' && chosenBoxes.size) { e.preventDefault(); chosenBoxes.clear(); draw(); return; }
    if (e.key === 'Escape' && tool !== 'pick' && !(window.CraftMenu && CraftMenu.isOpen()) && !el.querySelector('.sl-review:not([hidden])')) { e.preventDefault(); tool = 'pick'; renderPanel(); opts.toast && opts.toast('Applied: back to choosing cells.'); return; }
    if ((e.ctrlKey || e.metaKey) && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && sheet) { const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; } if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return; } } // (Escape never closes the slicer: too easy to lose one's place; the Close button does)
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'n' || e.key === 'b') && sheet) { const b = el.querySelector(`[data-show=${e.key === 'n' ? 'showNames' : 'showBoxes'}]`); if (b) b.click(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.key === '1') && sheet) { e.preventDefault(); setZoom(e.key === '0' ? 1 : 1 / fitScale()); }
  }
  function open(o = {}) {
    opts = o; if (!el) { build(); document.addEventListener('keydown', onKey); } el.hidden = false; renderPanel(); el.querySelector('.sl-empty').hidden = !!sheet; if (o.files && o.files.length) loadMany(o.files); else if (o.file) loadMany([o.file]); else if (sheet) find();
  }
  // a sheet that has been added is let go, so the slicer opens empty for the next one (it stays in the working area:
  // Slice the sheet again on the left brings it back)
  function forget() {
    sheet = null; sheetFile = null; sheetName = ''; work = null; found = null; boxes = []; skip.clear(); area = null; outs = []; zones = []; marks = []; table = null; offRows.clear(); offCols.clear();
    rowNames = []; colNames = []; captions = []; readText.clear(); moved.clear(); prefs.clear(); splits.clear(); joins = []; chosenBoxes.clear(); sheetTitle = ''; autoSaid = ''; past = []; future = []; now = ''; poly = null; tool = 'pick'; queueN = 0; queue = [];
    if (el) { const c = el.querySelector('.sl-desk canvas'); c.hidden = true; el.querySelector('.sl-empty').hidden = false; const st = el.querySelector('.sl-status'); if (st) st.innerHTML = ''; renderPanel(); }
  }
  function close() { if (el) { el.hidden = true; const r = el.querySelector('.sl-review'); if (r) r.hidden = true; } }
  window.ClipArtSlicer = { fixSpelling, pngText, styleFor, _cut: (i) => baseCut(boxes[i]), _boxes: () => boxes.map(sheetBox), _table: () => table, open, close, autoCut, combine, splitJoined, edgeRoom, splitSheet, sheetItem, findItem, boxClear, gridCells, gridItem, svgCut, readSheet, tableOf, state: () => ({ mode: S.mode, boxes: boxes.length, skipped: skip.size, area, outs: outs.length, notext: S.notext, captions: captions.length, owned: captions.filter((t) => t.own).length, said: autoSaid, rows: rowCount(), cols: colCount(), moved: moved.size, prefs: prefs.size, marks: marks.length, whole: boxes.filter((b) => b.whole).map((b) => b.r + ':' + b.c).join(' ') }) };
})();
