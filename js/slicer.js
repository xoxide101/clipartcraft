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
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = Math.round(a.x + c * cw + inset), y = Math.round(a.y + r * ch + inset), x1 = Math.round(a.x + (c + 1) * cw - inset), y1 = Math.round(a.y + (r + 1) * ch - inset); if (x1 - x > 2 && y1 - y > 2) out.push({ x, y, w: x1 - x, h: y1 - y }); }
    return out;
  }
  // one grid cell: the whole cell (its background see-through or not), or its picture found in it and cut out
  // (everything in the cell kept together)
  function gridItem(img, cell, { cut = true, see = true, pad = 6, tol = 40 } = {}) {
    const c = cropOf(img, cell.x, cell.y, cell.w, cell.h); c.at = { ...cell }; if (!cut) return see ? boxClear(c, tol) : c;
    const sh = splitSheet(c, { gap: Math.max(c.width, c.height), min: 0.002 }); if (!sh.items.length) return c;
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

  // ------------------------------------------------------------------ the slicer window
  const S = { combine: true, mode: 'find', gap: 0, min: 0.2, pad: 6, see: true, rows: 3, cols: 3, inset: 0, cut: true, tol: 16, edges: { t: 'auto', b: 'auto', l: 'auto', r: 'auto' }, roomPx: 2, view: 'result', names: '', category: '', svg: true };
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
      ${autoSaid ? `<p class="hint auto-said">${esc(autoSaid)} <small>Change anything below.</small></p>` : ''}
      <div class="field"><span>Show</span><div class="seg" role="group"><button class="btn" type="button" data-view="result" aria-pressed="${S.view === 'result'}">The result (live)</button><button class="btn" type="button" data-view="boxes" aria-pressed="${S.view === 'boxes'}">The boxes</button></div></div>
      <div class="field"><span>How to cut</span><div class="seg" role="group"><button class="btn" type="button" data-mode="find" aria-pressed="${S.mode === 'find'}">Find the pictures</button><button class="btn" type="button" data-mode="grid" aria-pressed="${S.mode === 'grid'}">Grid</button></div></div>
      ${S.mode === 'find' ? `<p class="hint">For pictures with space round them on a plain or old-paper background.</p>
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
      <div class="field"><span>Names, in order <small class="hint">(one per line or with commas)</small></span><textarea class="input" rows="4" data-k="names" placeholder="Barn, Bible, Buffalo…">${esc(S.names)}</textarea></div>
      ${field('Category', `<input class="input" data-k="category" list="sl-cats" value="${esc(S.category)}" placeholder="Empty: sorted by the AI"><datalist id="sl-cats">${cats}</datalist>`)}
      <p class="hint">Each picture is added as PNG and SVG: ${svgSheet ? 'this sheet is an SVG, so each is cut out of the drawing itself' : 'the SVG is traced from the picture'}.</p>
      <p class="hint" id="sl-count"></p>
      <button class="btn primary wide" type="button" data-sl="add" ${sheet ? '' : 'disabled'}>Add to the library</button>
      <p class="hint">Click a box on the sheet to leave that picture out (or put it back).</p></div>`;
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
  function renderPanel() { el.querySelector('.sl-side').innerHTML = panel(); count(); }
  function count() { const c = el.querySelector('#sl-count'); if (!c) return; const n = boxes.length - skip.size; c.innerHTML = sheet ? `<b>${n}</b> picture${n === 1 ? '' : 's'} to add${skip.size ? ` (${skip.size} left out)` : ''}.` : ''; const a = el.querySelector('[data-sl=add]'); if (a) { a.disabled = !n; a.textContent = n ? `Add ${n} to the library` : 'Add to the library'; } }
  function find() {
    if (!sheet) return;
    if (S.mode === 'find') { found = splitSheet(sheet, { gap: +S.gap, min: Math.max(0.0005, S.min / 100) }); splitJoined(found, sheet.width, sheet.height); if (S.combine !== false) combine(found, sheet.width, sheet.height); boxes = found.items.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, item: b })); }
    else { found = null; boxes = gridCells(sheet, { rows: Math.max(1, +S.rows | 0), cols: Math.max(1, +S.cols | 0), inset: +S.inset }); }
    skip = new Set([...skip].filter((i) => i < boxes.length)); draw(); count();
  }
  // one picture as it will be added (the same cutting as Add uses)
  const cutOne = (b) => { const o = { cut: S.cut, see: S.see, pad: +S.pad, tol: +S.tol || 16 }, img = S.mode === 'find' ? findItem(sheet, found, b.item, o) : gridItem(sheet, b, o);
    return edgeRoom(img, Math.max(0, +S.roomPx || 0), edgesNow()); };
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
    o.at = img.at; return o;
  }
  let drawRun = 0;
  // how many pictures touch each side (cut as now, before any room is added), for the room box
  function countTouches() {
    const o = { cut: S.cut, see: S.see, pad: +S.pad, tol: +S.tol || 16 }, n = { t: 0, b: 0, l: 0, r: 0 };
    boxes.forEach((b, i) => { if (skip.has(i)) return; const at = touches(S.mode === 'find' ? findItem(sheet, found, b.item, o) : gridItem(sheet, b, o)); for (const k in n) if (at[k]) n[k]++; });
    touchCount = n; const r = el.querySelector('.room-row'); if (r) { const f = r.closest('.field'); f.outerHTML = roomHtml(); }
  }
  async function draw() {
    const c = el.querySelector('canvas'); if (!sheet) { c.hidden = true; return; } c.hidden = false;
    const run = ++drawRun, live = S.view === 'result';
    setTimeout(() => { if (run === drawRun) countTouches(); }, 0);
    // the result is worked out off-screen and shown when ready, so the sheet never flickers while settings change
    const off = document.createElement('canvas'); off.width = sheet.width; off.height = sheet.height;
    const x = off.getContext('2d'), names = nameList(), big = Math.max(sheet.width, sheet.height), lw = Math.max(2, Math.round(big / 400)), fs = Math.max(12, Math.round(big / 60)), pad = S.mode === 'find' || S.cut ? +S.pad : 0;
    if (live) { const k = Math.max(8, Math.round(big / 80)); for (let yy = 0; yy < off.height; yy += k) for (let xx = 0; xx < off.width; xx += k) { x.fillStyle = ((xx + yy) / k) % 2 ? '#c9ccd6' : '#f4f5f8'; x.fillRect(xx, yy, k, k); } }
    else x.putImageData(sheet, 0, 0);
    if (live) {
      const t0 = performance.now();
      for (let i = 0; i < boxes.length; i++) {
        if (run !== drawRun) return; // the settings changed again: this picture is out of date
        const b = boxes[i];
        if (skip.has(i)) { const pp = S.mode === 'find' ? pad : 0, part = cropOf(sheet, b.x - pp, b.y - pp, b.w + pp * 2, b.h + pp * 2); x.globalAlpha = 0.25; x.drawImage(canvasOf(part), b.x - pp, b.y - pp); x.globalAlpha = 1; continue; }
        const img = cutOne(b); x.drawImage(canvasOf(img), img.at.x, img.at.y);
        if (performance.now() - t0 > 40) { await wait(0); } // a big sheet: let the page breathe between pictures
      }
      if (run !== drawRun) return;
    }
    x.lineWidth = Math.max(1, Math.round(lw / (live ? 2 : 1))); x.font = `700 ${fs}px system-ui, sans-serif`; x.textBaseline = 'top';
    let n = 0;
    boxes.forEach((b, i) => {
      const skipped = skip.has(i), p = S.mode === 'find' ? pad : 0, bx = b.x - p, by = b.y - p, bw = b.w + p * 2, bh = b.h + p * 2;
      if (skipped && !live) { x.fillStyle = 'rgba(30,30,40,.55)'; x.fillRect(bx, by, bw, bh); }
      x.strokeStyle = skipped ? '#8a8fa3' : live ? 'rgba(230,57,70,.45)' : '#e63946'; x.setLineDash(skipped || live ? [lw * 3, lw * 2] : []); x.strokeRect(bx, by, bw, bh); x.setLineDash([]);
      const label = skipped ? '✕' : `${++n}${names[n - 1] ? ' ' + names[n - 1] : ''}`, tw = x.measureText(label).width, ly = by - fs - 6 >= 0 ? by - fs - 6 : by;
      x.fillStyle = skipped ? '#8a8fa3' : '#e63946'; x.fillRect(bx, ly, tw + 10, fs + 6); x.fillStyle = '#fff'; x.fillText(label, bx + 5, ly + 3);
    });
    c.width = sheet.width; c.height = sheet.height; c.getContext('2d').drawImage(off, 0, 0);
  }
  const later = (ms = 200) => { clearTimeout(timer); timer = setTimeout(find, ms); };
  async function cuts(onStep) {
    const meaningless = (n) => !n || /^[0-9a-f]{6,}(?:[\s-]+[0-9a-f]{3,})+/i.test(n) || /^[\d\s_-]{5,}$/.test(n) || (n.replace(/[^0-9a-f]/gi, '').length > n.length * 0.8 && n.length > 12);
    const names = nameList(), base = meaningless(sheetName) ? 'Clip art' : /^\d+$/.test(sheetName) ? `Sheet ${sheetName}` : sheetName, seen = {}, out = []; let n = 0;
    for (let i = 0; i < boxes.length; i++) {
      if (skip.has(i)) continue; const b = boxes[i]; n++;
      let nm = safe(names[n - 1] || `${base} – ${n}`) || `${base} – ${n}`; seen[nm] = (seen[nm] || 0) + 1; if (seen[nm] > 1) nm += ` ${seen[nm]}`;
      onStep(n, nm); await wait(0);
      out.push({ name: nm, img: cutOne(b), keep: true });
    }
    return out;
  }
  // is the sheet's page a clean, even colour? (the spread of brightness round its edge)
  let pagePlain = null;
  function plainPage() {
    if (pagePlain !== null) return pagePlain;
    const W = sheet.width, H = sheet.height, d = sheet.data, b = Math.max(2, Math.round(Math.min(W, H) * 0.02)), v = [];
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
      const strict = boxClear(cropOf(sheet, img.at.x, img.at.y, img.at.w, img.at.h), 8), sd = strict.data; let lost = 0;
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
      showReview();
    }
    catch (e) { console.error(e); opts.toast && opts.toast('Slicing failed: ' + (e.message || e)); }
    count(); btn.disabled = false;
  }
  function showReview() {
    let box = el.querySelector('.sl-review'); if (!box) { box = document.createElement('div'); box.className = 'sl-review'; el.append(box); }
    const n = review.filter((r) => r.keep).length, flagged = review.filter((r) => r.doubts.length).length;
    box.hidden = false;
    box.innerHTML = `<div class="sl-bar"><b>Are these what you want?</b><span class="hint">${review.length} picture${review.length === 1 ? '' : 's'}${flagged ? ` · <span class="warn">${flagged} to look at</span>` : ' · nothing looks wrong'} · untick any to leave out, change any name</span><span class="grow"></span>
        <button class="btn outline" type="button" data-rv="back">Back to the sheet</button><button class="btn primary" type="button" data-rv="add" ${n ? '' : 'disabled'}>Add ${n} to the library</button></div>
      <div class="rv-grid">${review.map((r, i) => `<div class="rv-card${r.keep ? '' : ' off'}${r.doubts.length ? ' doubt' : ''}" data-i="${i}">
        <div class="rv-pic"><img src="${canvasOf(r.img).toDataURL('image/png')}" alt=""></div>
        <label class="rv-keep"><input type="checkbox" data-keep ${r.keep ? 'checked' : ''}> Add</label>
        <input class="input" data-name value="${esc(r.name)}" aria-label="Name">
        <span class="hint">${r.img.width} × ${r.img.height}</span>
        ${r.doubts.map((d) => `<span class="hint warn">⚠ ${esc(d)}</span>`).join('')}</div>`).join('')}</div>`;
  }
  async function addReviewed(btn) {
    const keep = review.filter((r) => r.keep), category = String(S.category || '').trim(); if (!keep.length) return;
    btn.disabled = true;
    try { await L.guard(async () => {
      // the sheet first (to the working area), so if the page is closed half way it can simply be sliced again
      const src = sheetFile && window.CraftWork ? await window.CraftWork.add(sheetFile, { used: 0 }) : null;
      const made = []; let k = 0;
      for (const r of keep) {
        btn.textContent = `Adding ${++k} of ${keep.length}: ${r.name}…`; await wait(0);
        const png = await new Promise((ok) => canvasOf(r.img).toBlob(ok, 'image/png')); let svg = null;
        if (svgSheet && r.img.at) { try { svg = svgCut(svgSheet, r.img.at); } catch (e) { console.warn('Cutting the SVG failed', r.name, e); } }
        if (!svg && window.CRAFT_RASTERTRACE) { try { svg = CRAFT_RASTERTRACE.traceImage(r.img, { profile: 'icon' }).svg; } catch (e) { console.warn('Tracing failed', r.name, e); } }
        const it = await L.makeItem({ name: r.name.trim() || 'Clip art', category, png, svg, source: 'Montage Slicer: ' + sheetName }); if (src) it.sheet = src.id;
        made.push(await L.put(it));
      }
      if (src) await window.CraftWork.add(sheetFile, { used: made.length, pending: '' });
      el.querySelector('.sl-review').hidden = true; review = []; close(); opts.done && opts.done(made, category, sheetFile);
    }); } catch (e) { console.error(e); opts.toast && opts.toast('Adding failed: ' + (e.message || e)); btn.disabled = false; }
  }
  async function load(file) {
    if (!file) return; try { sheet = await readSheet(file); } catch (e) { opts.toast && opts.toast('That picture could not be read.'); return; }
    if (window.CraftWork) window.CraftWork.add(file, { used: 0, pending: 'slice' }).catch(() => {});
    pagePlain = null; sheetFile = file; sheetName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(); skip.clear(); S.names = ''; S.category = ''; el.querySelector('.sl-empty').hidden = true;
    try { const a = autoCut(sheet); Object.assign(S, a.settings); autoSaid = a.said; } catch (e) { console.warn('Working out the cut failed', e); autoSaid = ''; }
    renderPanel(); find();
  }
  // How to cut a sheet, worked out from the sheet itself:
  //  - a grid: straight lines of plain page (gutters) running right across it, between rows and between columns
  //  - tiles or loose pictures: whether each cell is mostly filled (an app tile: keep it whole, only the page
  //    see-through) or a picture with space round it (cut it out)
  //  - anything else (sizes and places that do not line up): Find the pictures, which follows each one wherever it is
  let autoSaid = '';
  function autoCut(img) {
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
  function pickSheet() { return new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*,.svg'; i.onchange = () => ok(i.files[0]); i.click(); }); }
  function build() {
    el = document.createElement('div'); el.className = 'slicer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Montage Slicer');
    el.innerHTML = `<div class="sl-bar"><b>Montage Slicer</b><span class="hint">Cut a sheet of clip art into separate pictures for the library</span><span class="grow"></span><button class="btn outline" type="button" data-sl="close">Close</button></div>
      <div class="sl-main"><div class="sl-desk"><canvas hidden></canvas><div class="sl-empty"><button class="btn primary" type="button" data-sl="open">Choose a sheet…</button><p class="hint">or drop a picture here</p></div></div><aside class="sl-side side right"></aside></div>`;
    el.addEventListener('click', async (e) => {
      const rv = e.target.closest('[data-rv]');
      if (rv && rv.dataset.rv === 'back') { el.querySelector('.sl-review').hidden = true; return; }
      if (rv && rv.dataset.rv === 'add') return addReviewed(rv);
      if (e.target.matches('[data-keep]')) { const i = +e.target.closest('[data-i]').dataset.i; review[i].keep = e.target.checked; const y = el.querySelector('.rv-grid').scrollTop; showReview(); el.querySelector('.rv-grid').scrollTop = y; return; }
      const a = e.target.closest('[data-sl]'), m = e.target.closest('[data-mode]');
      if (a && a.dataset.sl === 'close') return close();
      if (a && a.dataset.sl === 'open') return load(await pickSheet());
      if (a && a.dataset.sl === 'add') return addAll();
      if (m) { S.mode = m.dataset.mode; autoSaid = ''; keep(); skip.clear(); renderPanel(); find(); return; }
      const sd = e.target.closest('[data-side]'); if (sd) { const k = sd.dataset.side, ed = { t: 'auto', b: 'auto', l: 'auto', r: 'auto', ...(S.edges || {}) }; ed[k] = { auto: 'on', on: 'off', off: 'auto' }[ed[k]]; S.edges = ed; keep(); renderPanel(); draw(); return; }
      const ae = e.target.closest('[data-edges]'); if (ae) { const v = ae.dataset.edges; S.edges = { t: v, b: v, l: v, r: v }; keep(); renderPanel(); draw(); return; }
      const v = e.target.closest('[data-view]'); if (v) { S.view = v.dataset.view; keep(); renderPanel(); draw(); return; }
      if (e.target.tagName === 'CANVAS') { const r = e.target.getBoundingClientRect(), k = sheet.width / r.width, px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k, p = S.mode === 'find' ? +S.pad : 0;
        const i = boxes.findIndex((b) => px >= b.x - p && px <= b.x + b.w + p && py >= b.y - p && py <= b.y + b.h + p); if (i >= 0) { if (skip.has(i)) skip.delete(i); else skip.add(i); draw(); count(); } }
    });
    el.addEventListener('input', (e) => { if (e.target.matches('[data-name]')) { review[+e.target.closest('[data-i]').dataset.i].name = e.target.value; return; } const k = e.target.dataset.k; if (!k) return; S[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? +e.target.value : e.target.value; keep();
      if (k === 'names') draw(); else if (k === 'cut' || k === 'see') { renderPanel(); later(0); } else if (k === 'tol' || k === 'roomPx') { clearTimeout(timer); timer = setTimeout(draw, 150); } else if (k !== 'category' && k !== 'svg') later(); });
    el.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    el.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); const f = [...e.dataTransfer.files].find((x) => /^image\//.test(x.type)); if (f) load(f); });
    el.addEventListener('dragenter', (e) => e.stopPropagation()); el.addEventListener('dragleave', (e) => e.stopPropagation());
    document.body.append(el);
  }
  function onKey(e) { if (e.key === 'Escape' && el && !el.hidden) close(); }
  function open(o = {}) {
    opts = o; if (!el) { build(); document.addEventListener('keydown', onKey); } el.hidden = false; renderPanel(); el.querySelector('.sl-empty').hidden = !!sheet; if (o.file) load(o.file); else if (sheet) find();
  }
  function close() { if (el) { el.hidden = true; const r = el.querySelector('.sl-review'); if (r) r.hidden = true; } }
  window.ClipArtSlicer = { open, close, autoCut, combine, splitJoined, edgeRoom, splitSheet, sheetItem, findItem, boxClear, gridCells, gridItem, svgCut, readSheet, state: () => ({ mode: S.mode, boxes: boxes.length, skipped: skip.size }) };
})();
