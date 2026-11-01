/* File formats (window.CraftFormats): ClipArtCraft's own copy of ImageCraft's js/formats.js, plus pages() for files
   that hold several pictures (TIFF pages, the sizes in an ICO, the frames of an animated GIF, APNG or WebP).
   ImageCraft file formats (IC.formats). Everything is read into plain RGBA pixels ({ width, height, data } ImageData)
   and written back out from them. The browser reads the everyday formats; the rest are read and written here, by hand,
   from the published file layouts (nothing copied from other programs).
     read(file | { name, bytes })  → Promise<{ img: ImageData, info: { format, bits, colours?, note? } }>
     write(img, format, opts)      → Promise<Blob>   (opts: quality, bits, palette (for indexed), …)
   Indexed formats are written from a picture that already has few colours (IC.colour reduces it first); the writer only
   collects its colours. */
(function () {
  'use strict';
  const IC = {};
  const fail = (m) => { throw new Error(m); };
  const newImg = (w, h) => new ImageData(w, h);
  const ext = (name) => (/\.([a-z0-9]+)$/i.exec(name || '') || [, ''])[1].toLowerCase();
  const u16le = (b, o) => b[o] | (b[o + 1] << 8), u16be = (b, o) => (b[o] << 8) | b[o + 1];
  const u32le = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0, u32be = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  const str = (b, o, n) => String.fromCharCode(...b.subarray(o, o + n));
  // Deep colour: 16 bits per channel (Uint16Array RGBA, 0–65535) shown and saved at 8 bits through a 4 × 4 ordered
  // dither, so the in-between levels survive as a fine pattern instead of bands
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  function down16(deep, W, H) {
    const img = new ImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = (y * W + x) * 4, t = BAYER[(y & 3) * 4 + (x & 3)]; for (let c = 0; c < 3; c++) d[p + c] = Math.min(255, Math.floor(deep[p + c] / 257 + t)); d[p + 3] = Math.round(deep[p + 3] / 257); }
    return img;
  }
  const up16 = (img) => { const s = img.data, o = new Uint16Array(s.length); for (let i = 0; i < s.length; i++) o[i] = s[i] * 257; return o; };

  // a growing byte buffer for the writers
  function Out() {
    let a = new Uint8Array(1 << 16), n = 0;
    const room = (k) => { if (n + k > a.length) { const b = new Uint8Array(Math.max(a.length * 2, n + k)); b.set(a.subarray(0, n)); a = b; } };
    return {
      u8(v) { room(1); a[n++] = v & 255; return this; },
      u16le(v) { room(2); a[n++] = v & 255; a[n++] = (v >> 8) & 255; return this; },
      u16be(v) { room(2); a[n++] = (v >> 8) & 255; a[n++] = v & 255; return this; },
      u32le(v) { room(4); for (let i = 0; i < 4; i++) a[n++] = (v >>> (8 * i)) & 255; return this; },
      u32be(v) { room(4); for (let i = 3; i >= 0; i--) a[n++] = (v >>> (8 * i)) & 255; return this; },
      bytes(b) { room(b.length); a.set(b, n); n += b.length; return this; },
      ascii(s) { for (let i = 0; i < s.length; i++) this.u8(s.charCodeAt(i)); return this; },
      at: () => n, set32be(o, v) { for (let i = 3; i >= 0; i--) a[o + 3 - i] = (v >>> (8 * i)) & 255; }, set32le(o, v) { for (let i = 0; i < 4; i++) a[o + i] = (v >>> (8 * i)) & 255; },
      done: () => a.slice(0, n),
    };
  }

  // ------------------------------------------------------------------ colours of a picture
  // The picture's colours as a palette (at most max), with see-through pixels as their own entry (index of it in `clear`).
  function indexed(img, max = 256) {
    const d = img.data, map = new Map(), pal = [], idx = new Uint8Array(img.width * img.height); let clear = -1;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      let key;
      if (d[i + 3] < 128) { if (clear < 0) { clear = pal.length; pal.push([0, 0, 0]); map.set(-1, clear); } idx[p] = clear; continue; }
      key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      let k = map.get(key);
      if (k === undefined) { if (pal.length >= max) return null; k = pal.length; pal.push([d[i], d[i + 1], d[i + 2]]); map.set(key, k); }
      idx[p] = k;
    }
    if (!pal.length) pal.push([0, 0, 0]);
    return { pal, idx, clear };
  }
  const countColours = (img, stop = 1 << 24) => { const s = new Set(), d = img.data; for (let i = 0; i < d.length; i += 4) { s.add(d[i + 3] < 128 ? -1 : (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); if (s.size > stop) break; } return s.size; };
  const hasClear = (img) => { const d = img.data; for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true; return false; };
  const needIndexed = (img, max, what) => indexed(img, max) || fail(`${what} holds at most ${max} colours, and this picture has more. Choose the colour depth (or let ImageCraft reduce it) when saving.`);

  // ------------------------------------------------------------------ run-length packing (PackBits / ByteRun1)
  function unpackBits(b, o, outLen) {
    const out = new Uint8Array(outLen); let n = 0;
    while (n < outLen && o < b.length) {
      const c = b[o++];
      if (c < 128) { for (let i = 0; i <= c && n < outLen; i++) out[n++] = b[o++]; }
      else if (c > 128) { const v = b[o++]; for (let i = 0; i < 257 - c && n < outLen; i++) out[n++] = v; }
    }
    return { out, o };
  }
  function packBits(row) {
    const out = []; let i = 0;
    while (i < row.length) {
      let j = i; while (j + 1 < row.length && row[j + 1] === row[i] && j - i < 127) j++;
      if (j > i) { out.push(257 - (j - i + 1), row[i]); i = j + 1; continue; }
      let k = i; while (k + 1 < row.length && row[k + 1] !== row[k] && k - i < 127) k++;
      if (k + 1 < row.length && k > i && row[k + 1] === row[k]) k--;
      out.push(k - i); for (let q = i; q <= k; q++) out.push(row[q]); i = k + 1;
    }
    return out;
  }

  // ------------------------------------------------------------------ the browser's own formats
  async function viaBrowser(blob) {
    let bmp;
    try { bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }); }
    catch (e) {
      // SVG (and a few others) only load through an <img>
      const url = URL.createObjectURL(blob);
      try { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('This file could not be read as a picture.')); i.src = url; }); }
      finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
    }
    let w = bmp.naturalWidth || bmp.width, h = bmp.naturalHeight || bmp.height;
    if (!w || !h) { w = 800; h = 600; }
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0, w, h);
    return x.getImageData(0, 0, w, h);
  }
  const canvasOf = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c; };
  const blobOf = (img, type, q) => new Promise((res, rej) => canvasOf(img).toBlob((b) => (b ? res(b) : rej(new Error(`This browser cannot write ${type}.`))), type, q));

  // ------------------------------------------------------------------ PNG (written here so it can be 1, 2, 4 or 8-bit)
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b, c = 0xffffffff) => { for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return c; };
  const crcDone = (b) => (crc32(b) ^ 0xffffffff) >>> 0;
  async function zlib(bytes) {
    const s = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  async function inflate(bytes, raw = false) {
    const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(raw ? 'deflate-raw' : 'deflate'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  // opts.bits: 1 | 2 | 4 | 8 (indexed), 'grey' (8-bit grey), 24, 32; default: the smallest that keeps every colour
  async function writePNG(img, opts = {}) {
    const W = img.width, H = img.height, d = img.data;
    let bits = opts.bits, ix = null;
    if (bits === 48 || bits === 64) { // 16 bits per channel, from the deep copy when there is one
      const D = opts.deep && opts.deep.length === W * H * 4 ? opts.deep : up16(img), a = bits === 64, ch = a ? 4 : 3, rowLen = W * ch * 2, raw = new Uint8Array((rowLen + 1) * H);
      for (let y = 0; y < H; y++) { const o = y * (rowLen + 1); raw[o] = 0; for (let x = 0; x < W; x++) for (let c = 0; c < ch; c++) { const v = D[(y * W + x) * 4 + c], q = o + 1 + (x * ch + c) * 2; raw[q] = v >> 8; raw[q + 1] = v & 255; } }
      const cks = [], ck = (type, data) => { const out = Out(); out.u32be(data.length); const td = new Uint8Array(4 + data.length); for (let i = 0; i < 4; i++) td[i] = type.charCodeAt(i); td.set(data, 4); out.bytes(td).u32be(crcDone(td)); cks.push(out.done()); };
      const hdr = Out(); hdr.u32be(W).u32be(H).u8(16).u8(a ? 6 : 2).u8(0).u8(0).u8(0); ck('IHDR', hdr.done());
      if (opts.dpi) { const ppm = Math.round(opts.dpi / 0.0254), o = Out(); o.u32be(ppm).u32be(ppm).u8(1); ck('pHYs', o.done()); }
      ck('IDAT', await zlib(raw)); ck('IEND', new Uint8Array(0));
      return new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), ...cks], { type: 'image/png' });
    }
    if (!bits || bits <= 8) { ix = indexed(img, 256); if (ix) { const n = ix.pal.length; bits = bits && (1 << bits) >= n ? bits : n <= 2 ? 1 : n <= 4 ? 2 : n <= 16 ? 4 : 8; } else bits = hasClear(img) ? 32 : 24; }
    const chunks = [], chunk = (type, data) => { const o = Out(); o.u32be(data.length); const td = new Uint8Array(4 + data.length); for (let i = 0; i < 4; i++) td[i] = type.charCodeAt(i); td.set(data, 4); o.bytes(td).u32be(crcDone(td)); chunks.push(o.done()); };
    const hdr = Out(); hdr.u32be(W).u32be(H);
    let rowLen, fill;
    if (bits <= 8 && ix) {
      hdr.u8(bits).u8(3).u8(0).u8(0).u8(0); chunk('IHDR', hdr.done());
      const p = new Uint8Array(ix.pal.length * 3); ix.pal.forEach((c, i) => p.set(c, i * 3)); chunk('PLTE', p);
      if (ix.clear >= 0) { const t = new Uint8Array(ix.clear + 1).fill(255); t[ix.clear] = 0; chunk('tRNS', t); }
      rowLen = Math.ceil((W * bits) / 8); const per = 8 / bits;
      fill = (y, row) => { for (let x = 0; x < W; x++) row[(x / per) | 0] |= ix.idx[y * W + x] << ((per - 1 - (x % per)) * bits); };
    } else if (bits === 'grey') {
      hdr.u8(8).u8(0).u8(0).u8(0).u8(0); chunk('IHDR', hdr.done()); rowLen = W;
      fill = (y, row) => { for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; row[x] = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114); } };
    } else {
      const a = bits === 32; hdr.u8(8).u8(a ? 6 : 2).u8(0).u8(0).u8(0); chunk('IHDR', hdr.done()); const ch = a ? 4 : 3; rowLen = W * ch;
      fill = (y, row) => { for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; row[x * ch] = d[i]; row[x * ch + 1] = d[i + 1]; row[x * ch + 2] = d[i + 2]; if (a) row[x * ch + 3] = d[i + 3]; } };
    }
    // each row with filter 0 (none) or 1 (sub) for true colour; a simple choice that compresses well
    const raw = new Uint8Array((rowLen + 1) * H), row = new Uint8Array(rowLen), bpp = bits === 32 ? 4 : bits === 24 ? 3 : 1;
    for (let y = 0; y < H; y++) {
      row.fill(0); fill(y, row); const o = y * (rowLen + 1);
      if (bits === 24 || bits === 32) { raw[o] = 1; for (let i = 0; i < rowLen; i++) raw[o + 1 + i] = (row[i] - (i >= bpp ? row[i - bpp] : 0)) & 255; }
      else { raw[o] = 0; raw.set(row, o + 1); }
    }
    if (opts.dpi) { const ppm = Math.round(opts.dpi / 0.0254), o = Out(); o.u32be(ppm).u32be(ppm).u8(1); chunk('pHYs', o.done()); }
    chunk('IDAT', await zlib(raw)); chunk('IEND', new Uint8Array(0));
    return new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks], { type: 'image/png' });
  }
  // a 16-bit PNG, read here so all 16 bits are kept (not interlaced; the browser reads the rest)
  async function readPNG16(b) {
    if (b.length < 33 || u32be(b, 0) !== 0x89504e47 || b[24] !== 16 || b[28] !== 0) return null;
    const W = u32be(b, 16), H = u32be(b, 20), ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[b[25]]; if (!ch) return null;
    const parts = []; let o = 8; while (o + 8 <= b.length) { const len = u32be(b, o), type = str(b, o + 4, 4); if (type === 'IDAT') parts.push(b.subarray(o + 8, o + 8 + len)); if (type === 'IEND') break; o += 12 + len; }
    const z = new Uint8Array(parts.reduce((s, p) => s + p.length, 0)); let k = 0; parts.forEach((p) => { z.set(p, k); k += p.length; });
    const raw = await inflate(z), bpp = ch * 2, rowLen = W * bpp, px = new Uint8Array(rowLen * H); let prev = new Uint8Array(rowLen);
    for (let y = 0; y < H; y++) {
      const f = raw[y * (rowLen + 1)], src = raw.subarray(y * (rowLen + 1) + 1, (y + 1) * (rowLen + 1)), row = px.subarray(y * rowLen, (y + 1) * rowLen);
      for (let i = 0; i < rowLen; i++) {
        const a = i >= bpp ? row[i - bpp] : 0, up = prev[i], c = i >= bpp ? prev[i - bpp] : 0; let v = src[i];
        if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1; else if (f === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
        row[i] = v & 255;
      }
      prev = row;
    }
    const deep = new Uint16Array(W * H * 4);
    for (let p = 0; p < W * H; p++) { const s = p * bpp, g = (q) => (px[s + q * 2] << 8) | px[s + q * 2 + 1], o4 = p * 4; if (ch < 3) { deep[o4] = deep[o4 + 1] = deep[o4 + 2] = g(0); deep[o4 + 3] = ch === 2 ? g(1) : 65535; } else { deep[o4] = g(0); deep[o4 + 1] = g(1); deep[o4 + 2] = g(2); deep[o4 + 3] = ch === 4 ? g(3) : 65535; } }
    return { img: down16(deep, W, H), deep, info: { format: 'PNG', bits: ch * 16, note: '16 bits per colour (kept)' } };
  }
  // what bits a PNG file holds (the browser reads the pixels)
  function pngInfo(b) {
    if (b.length < 29 || u32be(b, 0) !== 0x89504e47) return null;
    const depth = b[24], type = b[25], ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type] || 3;
    return { bits: type === 3 ? depth : depth * ch, note: type === 3 ? `${1 << depth}-colour palette` : type === 0 || type === 4 ? 'greyscale' : '' };
  }

  // ------------------------------------------------------------------ BMP
  function readBMP(b) {
    if (str(b, 0, 2) !== 'BM') return null;
    const off = u32le(b, 10), hs = u32le(b, 14), W = hs === 12 ? u16le(b, 18) : u32le(b, 18) | 0, Hs = hs === 12 ? u16le(b, 20) : u32le(b, 22) | 0;
    const bits = hs === 12 ? u16le(b, 24) : u16le(b, 28), comp = hs === 12 ? 0 : u32le(b, 30);
    if (comp !== 0 && comp !== 3 && comp !== 6) return null; // RLE and others: the browser reads those
    const H = Math.abs(Hs), up = Hs > 0, img = newImg(W, H), d = img.data, stride = Math.ceil((W * bits) / 32) * 4;
    let pal = [], masks = null;
    if (bits <= 8) { const n = (hs >= 40 && u32le(b, 46)) || 1 << bits, ps = hs === 12 ? 3 : 4; for (let i = 0; i < n; i++) { const o = 14 + hs + i * ps; pal.push([b[o + 2], b[o + 1], b[o]]); } }
    if (comp === 3 || comp === 6) masks = [u32le(b, 54), u32le(b, 58), u32le(b, 62), hs >= 56 || comp === 6 ? u32le(b, 66) : 0];
    if (bits === 16 && !masks) masks = [0x7c00, 0x03e0, 0x001f, 0];
    if (bits === 32 && !masks) masks = [0xff0000, 0xff00, 0xff, 0];
    const chan = (v, m) => { if (!m) return 255; let s = 0; while (!((m >>> s) & 1)) s++; const top = m >>> s; return Math.round((((v & m) >>> s) * 255) / top); };
    let anyA = false;
    for (let y = 0; y < H; y++) {
      const ro = off + (up ? H - 1 - y : y) * stride;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4; let r, g, bl, a = 255;
        if (bits <= 8) { const v = (b[ro + ((x * bits) >> 3)] >> (8 - bits - ((x * bits) & 7))) & ((1 << bits) - 1); [r, g, bl] = pal[v] || [0, 0, 0]; }
        else if (bits === 24) { const o = ro + x * 3; bl = b[o]; g = b[o + 1]; r = b[o + 2]; }
        else { const v = bits === 16 ? u16le(b, ro + x * 2) : u32le(b, ro + x * 4); r = chan(v, masks[0]); g = chan(v, masks[1]); bl = chan(v, masks[2]); a = masks[3] ? chan(v, masks[3]) : 255; if (masks[3] && a) anyA = true; }
        d[i] = r; d[i + 1] = g; d[i + 2] = bl; d[i + 3] = a;
      }
    }
    if (bits === 32 && masks[3] && !anyA) for (let i = 3; i < d.length; i += 4) d[i] = 255; // an alpha mask of all zero: not really see-through
    return { img, info: { format: 'BMP', bits, colours: bits <= 8 ? pal.length : undefined } };
  }
  // bits: 1, 4, 8 (palette), 16 (5-6-5), 24, 32 (with see-through)
  function writeBMP(img, opts = {}) {
    const W = img.width, H = img.height, d = img.data; let bits = opts.bits || 24, ix = null;
    if (bits <= 8) { ix = needIndexed(img, 1 << bits, `A ${bits}-bit BMP`); }
    const stride = Math.ceil((W * bits) / 32) * 4, palN = bits <= 8 ? 1 << bits : 0, hs = bits === 32 || bits === 16 ? 108 : 40, off = 14 + hs + palN * 4, size = off + stride * H;
    const o = Out(); o.ascii('BM').u32le(size).u32le(0).u32le(off);
    o.u32le(hs).u32le(W).u32le(H).u16le(1).u16le(bits).u32le(hs === 108 ? 3 : 0).u32le(stride * H).u32le(2835).u32le(2835).u32le(palN).u32le(0);
    if (hs === 108) { const m = bits === 16 ? [0xf800, 0x07e0, 0x001f, 0] : [0xff0000, 0xff00, 0xff, 0xff000000]; m.forEach((v) => o.u32le(v)); o.ascii('BGRs'); for (let i = 0; i < 12; i++) o.u32le(0); }
    for (let i = 0; i < palN; i++) { const c = (ix && ix.pal[i]) || [0, 0, 0]; o.u8(c[2]).u8(c[1]).u8(c[0]).u8(0); }
    const row = new Uint8Array(stride);
    for (let y = H - 1; y >= 0; y--) {
      row.fill(0);
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (bits <= 8) row[(x * bits) >> 3] |= ix.idx[y * W + x] << (8 - bits - ((x * bits) & 7));
        else if (bits === 16) { const v = ((d[i] >> 3) << 11) | ((d[i + 1] >> 2) << 5) | (d[i + 2] >> 3); row[x * 2] = v & 255; row[x * 2 + 1] = v >> 8; }
        else if (bits === 24) { row[x * 3] = d[i + 2]; row[x * 3 + 1] = d[i + 1]; row[x * 3 + 2] = d[i]; }
        else { row[x * 4] = d[i + 2]; row[x * 4 + 1] = d[i + 1]; row[x * 4 + 2] = d[i]; row[x * 4 + 3] = d[i + 3]; }
      }
      o.bytes(row);
    }
    return new Blob([o.done()], { type: 'image/bmp' });
  }

  // ------------------------------------------------------------------ GIF (written here: LZW, one frame, see-through)
  function writeGIF(img) {
    const ix = needIndexed(img, 256, 'GIF'), W = img.width, H = img.height;
    let bits = 1; while (1 << bits < ix.pal.length) bits++;
    const o = Out(); o.ascii('GIF89a').u16le(W).u16le(H).u8(0x80 | ((bits - 1) << 4) | (bits - 1)).u8(0).u8(0);
    for (let i = 0; i < 1 << bits; i++) { const c = ix.pal[i] || [0, 0, 0]; o.u8(c[0]).u8(c[1]).u8(c[2]); }
    if (ix.clear >= 0) o.u8(0x21).u8(0xf9).u8(4).u8(1).u16le(0).u8(ix.clear).u8(0);
    o.u8(0x2c).u16le(0).u16le(0).u16le(W).u16le(H).u8(0);
    const minCode = Math.max(2, bits); o.u8(minCode);
    // LZW
    const clearC = 1 << minCode, eoi = clearC + 1, bytes = []; let cur = 0, nb = 0, size = minCode + 1, next = eoi + 1, dict = new Map();
    const put = (code) => { cur |= code << nb; nb += size; while (nb >= 8) { bytes.push(cur & 255); cur >>>= 8; nb -= 8; } };
    put(clearC); let prefix = ix.idx[0];
    for (let p = 1; p < ix.idx.length; p++) {
      const k = ix.idx[p], key = (prefix << 8) | k, got = dict.get(key);
      if (got !== undefined) { prefix = got; continue; }
      put(prefix);
      if (next < 4096) { dict.set(key, next++); if (next > 1 << size && size < 12) size++; }
      else { put(clearC); dict = new Map(); size = minCode + 1; next = eoi + 1; }
      prefix = k;
    }
    put(prefix); put(eoi); if (nb > 0) bytes.push(cur & 255);
    for (let i = 0; i < bytes.length; i += 255) { const part = bytes.slice(i, i + 255); o.u8(part.length).bytes(part); }
    o.u8(0).u8(0x3b);
    return new Blob([o.done()], { type: 'image/gif' });
  }

  // ------------------------------------------------------------------ ICO (PNG pictures inside, several sizes)
  async function writeICO(img, opts = {}) {
    const sizes = (opts.sizes || [16, 32, 48, 64, 128, 256]).filter((s) => s <= Math.max(img.width, img.height) * 4 || s <= 32);
    const src = canvasOf(img), pngs = [];
    for (const s of sizes) {
      const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      const k = Math.min(s / img.width, s / img.height), w = img.width * k, h = img.height * k; x.drawImage(src, (s - w) / 2, (s - h) / 2, w, h);
      pngs.push([s, new Uint8Array(await (await writePNG(x.getImageData(0, 0, s, s), { bits: 32 })).arrayBuffer())]);
    }
    const o = Out(); o.u16le(0).u16le(1).u16le(pngs.length); let off = 6 + 16 * pngs.length;
    pngs.forEach(([s, b]) => { o.u8(s >= 256 ? 0 : s).u8(s >= 256 ? 0 : s).u8(0).u8(0).u16le(1).u16le(32).u32le(b.length).u32le(off); off += b.length; });
    pngs.forEach(([, b]) => o.bytes(b));
    return new Blob([o.done()], { type: 'image/x-icon' });
  }

  // ------------------------------------------------------------------ TGA (Targa)
  function readTGA(b) {
    const idLen = b[0], cmType = b[1], type = b[2], cmFirst = u16le(b, 3), cmLen = u16le(b, 5), cmBits = b[7], W = u16le(b, 12), H = u16le(b, 14), bits = b[16], desc = b[17];
    if (![1, 2, 3, 9, 10, 11].includes(type) || !W || !H || ![8, 15, 16, 24, 32].includes(bits)) return null;
    let o = 18 + idLen; const pal = [];
    const px = (v, n) => n === 15 || n === 16 ? [((v >> 10) & 31) * 255 / 31, ((v >> 5) & 31) * 255 / 31, (v & 31) * 255 / 31, 255] : null;
    if (cmType === 1) { const bpe = Math.ceil(cmBits / 8); for (let i = 0; i < cmLen; i++, o += bpe) { if (bpe === 2) pal[cmFirst + i] = px(u16le(b, o), 15); else pal[cmFirst + i] = [b[o + 2], b[o + 1], b[o], bpe === 4 ? b[o + 3] : 255]; } }
    const bpp = Math.ceil(bits / 8), n = W * H, raw = new Uint8Array(n * bpp);
    if (type >= 9) { let p = 0; while (p < n * bpp && o < b.length) { const c = b[o++], k = (c & 127) + 1; if (c & 128) { for (let i = 0; i < k; i++) for (let j = 0; j < bpp; j++) raw[p++] = b[o + j]; o += bpp; } else { raw.set(b.subarray(o, o + k * bpp), p); p += k * bpp; o += k * bpp; } } }
    else raw.set(b.subarray(o, o + n * bpp));
    const img = newImg(W, H), d = img.data, top = !!(desc & 32), alphaBits = desc & 15; let anyA = false;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const s = (y * W + x) * bpp, ty = top ? y : H - 1 - y, i = (ty * W + x) * 4; let c;
      if (type === 1 || type === 9) c = pal[bpp === 2 ? u16le(raw, s) : raw[s]] || [0, 0, 0, 255];
      else if (type === 3 || type === 11) c = [raw[s], raw[s], raw[s], 255];
      else if (bpp === 2) c = px(u16le(raw, s), 15);
      else c = [raw[s + 2], raw[s + 1], raw[s], bpp === 4 && alphaBits ? raw[s + 3] : 255];
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3]; if (c[3]) anyA = true;
    }
    if (!anyA) for (let i = 3; i < d.length; i += 4) d[i] = 255;
    return { img, info: { format: 'TGA (Targa)', bits, colours: pal.length || undefined } };
  }
  // bits: 8 (palette), 16, 24, 32; rle
  function writeTGA(img, opts = {}) {
    const W = img.width, H = img.height, d = img.data, bits = opts.bits || (hasClear(img) ? 32 : 24), rle = opts.rle !== false;
    const ix = bits === 8 ? needIndexed(img, 256, 'An 8-bit TGA') : null;
    const o = Out(); o.u8(0).u8(ix ? 1 : 0).u8((ix ? 1 : 2) + (rle ? 8 : 0)).u16le(0).u16le(ix ? ix.pal.length : 0).u8(ix ? 24 : 0).u16le(0).u16le(0).u16le(W).u16le(H).u8(bits).u8(32 | (bits === 32 ? 8 : bits === 16 ? 1 : 0));
    if (ix) ix.pal.forEach((c) => o.u8(c[2]).u8(c[1]).u8(c[0]));
    const bpp = bits / 8 | 0 || 2, pix = (p) => { const i = p * 4; if (ix) return [ix.idx[p]]; if (bits === 16) { const v = (d[i + 3] >= 128 ? 0x8000 : 0) | ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3); return [v & 255, v >> 8]; } return bits === 32 ? [d[i + 2], d[i + 1], d[i], d[i + 3]] : [d[i + 2], d[i + 1], d[i]]; };
    const same = (a, b) => a.every((v, i) => v === b[i]);
    for (let y = 0; y < H; y++) {
      const row = []; for (let x = 0; x < W; x++) row.push(pix(y * W + x));
      if (!rle) { row.forEach((p) => o.bytes(p)); continue; }
      let x = 0;
      while (x < W) {
        let k = 1; while (x + k < W && k < 128 && same(row[x + k], row[x])) k++;
        if (k > 1) { o.u8(128 | (k - 1)).bytes(row[x]); x += k; continue; }
        k = 1; while (x + k < W && k < 128 && !(x + k + 1 < W && same(row[x + k], row[x + k + 1]))) k++;
        o.u8(k - 1); for (let j = 0; j < k; j++) o.bytes(row[x + j]); x += k;
      }
    }
    void bpp;
    return new Blob([o.done()], { type: 'image/x-tga' });
  }

  // ------------------------------------------------------------------ PCX (PC Paintbrush)
  const EGA = [[0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170], [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]];
  function readPCX(b) {
    if (b[0] !== 10 || b.length < 129) return null;
    const bpp = b[3], W = u16le(b, 8) - u16le(b, 4) + 1, H = u16le(b, 10) - u16le(b, 6) + 1, planes = b[65], bpl = u16le(b, 66), ver = b[1];
    if (W <= 0 || H <= 0 || W > 30000 || H > 30000) return null;
    const line = planes * bpl, raw = new Uint8Array(line * H); let o = 128, n = 0;
    if (b[2] === 1) { while (n < raw.length && o < b.length) { const c = b[o++]; if ((c & 0xc0) === 0xc0) { const v = b[o++]; for (let i = 0; i < (c & 63) && n < raw.length; i++) raw[n++] = v; } else raw[n++] = c; } }
    else raw.set(b.subarray(128, 128 + raw.length));
    let pal = [];
    if (bpp === 8 && planes === 1 && b.length >= 769 && b[b.length - 769] === 12) for (let i = 0; i < 256; i++) pal.push([b[b.length - 768 + i * 3], b[b.length - 767 + i * 3], b[b.length - 766 + i * 3]]);
    else if (bpp === 8 && planes === 1) for (let i = 0; i < 256; i++) pal.push([i, i, i]);
    else for (let i = 0; i < 16; i++) pal.push([b[16 + i * 3], b[17 + i * 3], b[18 + i * 3]]);
    if (bpp * planes === 4 && (ver < 2 || pal.every((c) => !c[0] && !c[1] && !c[2]))) pal = EGA;
    if (bpp === 1 && planes === 1) pal = [[0, 0, 0], [255, 255, 255]];
    const img = newImg(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const r = y * line, i = (y * W + x) * 4; let c;
      if (planes >= 3 && bpp === 8) { d[i] = raw[r + x]; d[i + 1] = raw[r + bpl + x]; d[i + 2] = raw[r + 2 * bpl + x]; d[i + 3] = planes === 4 ? raw[r + 3 * bpl + x] : 255; continue; }
      if (planes === 1) c = (raw[r + ((x * bpp) >> 3)] >> (8 - bpp - ((x * bpp) & 7))) & ((1 << bpp) - 1);
      else { c = 0; for (let p = 0; p < planes; p++) c |= ((raw[r + p * bpl + (x >> 3)] >> (7 - (x & 7))) & 1) << p; }
      const col = pal[c] || [0, 0, 0]; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    return { img, info: { format: 'PCX (PC Paintbrush)', bits: bpp * planes, colours: bpp * planes <= 8 ? pal.length : undefined } };
  }
  // bits: 1 (black and white), 4 (16 colours, 4 planes), 8 (256 colours), 24
  function writePCX(img, opts = {}) {
    const W = img.width, H = img.height, d = img.data, bits = opts.bits || 8;
    const ix = bits <= 8 ? needIndexed(img, 1 << bits, `A ${bits}-bit PCX`) : null;
    const planes = bits === 24 ? 3 : bits === 4 ? 4 : 1, bpp = bits === 24 ? 8 : bits === 4 ? 1 : bits, bpl = Math.ceil((W * bpp) / 16) * 2;
    const o = Out(); o.u8(10).u8(5).u8(1).u8(bpp).u16le(0).u16le(0).u16le(W - 1).u16le(H - 1).u16le(72).u16le(72);
    for (let i = 0; i < 16; i++) { const c = (ix && bits <= 4 && ix.pal[i]) || (bits === 1 ? [i ? 255 : 0, i ? 255 : 0, i ? 255 : 0] : [0, 0, 0]); o.u8(c[0]).u8(c[1]).u8(c[2]); }
    o.u8(0).u8(planes).u16le(bpl).u16le(1).u16le(0).u16le(0); for (let i = 0; i < 54; i++) o.u8(0);
    // a 1-bit picture: 0 is black, 1 white; put the lighter colour as 1
    let flip = false; if (bits === 1 && ix && ix.pal.length === 2) flip = ix.pal[0][0] + ix.pal[0][1] + ix.pal[0][2] > ix.pal[1][0] + ix.pal[1][1] + ix.pal[1][2];
    const line = new Uint8Array(planes * bpl);
    for (let y = 0; y < H; y++) {
      line.fill(0);
      for (let x = 0; x < W; x++) {
        const p = y * W + x, i = p * 4;
        if (bits === 24) { line[x] = d[i]; line[bpl + x] = d[i + 1]; line[2 * bpl + x] = d[i + 2]; }
        else if (bits === 8) line[x] = ix.idx[p];
        else if (bits === 4) { const c = ix.idx[p]; for (let q = 0; q < 4; q++) if ((c >> q) & 1) line[q * bpl + (x >> 3)] |= 0x80 >> (x & 7); }
        else { const c = ix.idx[p] ^ (flip ? 1 : 0); if (c) line[x >> 3] |= 0x80 >> (x & 7); }
      }
      for (let i = 0; i < line.length;) { let k = 1; while (i + k < line.length && k < 63 && line[i + k] === line[i]) k++; if (k > 1 || (line[i] & 0xc0) === 0xc0) o.u8(0xc0 | k).u8(line[i]); else o.u8(line[i]); i += k; }
    }
    if (bits === 8) { o.u8(12); for (let i = 0; i < 256; i++) { const c = ix.pal[i] || [0, 0, 0]; o.u8(c[0]).u8(c[1]).u8(c[2]); } }
    return new Blob([o.done()], { type: 'image/x-pcx' });
  }

  // ------------------------------------------------------------------ IFF ILBM (Amiga Deluxe Paint), and PBM (chunky)
  function readIFF(b) {
    if (str(b, 0, 4) !== 'FORM' || !['ILBM', 'PBM '].includes(str(b, 8, 4))) return null;
    const chunky = str(b, 8, 4) === 'PBM '; let o = 12, bm = null, pal = [], camg = 0, body = null;
    while (o + 8 <= b.length) {
      const id = str(b, o, 4), len = u32be(b, o + 4), s = o + 8;
      if (id === 'BMHD') bm = { w: u16be(b, s), h: u16be(b, s + 2), planes: b[s + 8], mask: b[s + 9], comp: b[s + 10], clear: u16be(b, s + 12) };
      else if (id === 'CMAP') for (let i = 0; i + 2 < len; i += 3) pal.push([b[s + i], b[s + i + 1], b[s + i + 2]]);
      else if (id === 'CAMG') camg = u32be(b, s);
      else if (id === 'BODY') body = [s, len];
      o = s + len + (len & 1);
    }
    if (!bm || !body) return null;
    const W = bm.w, H = bm.h, P = bm.planes, ham = !!(camg & 0x800), ehb = !!(camg & 0x80) || (P === 6 && !ham && pal.length === 32);
    // old 4-bit palettes (values 0–15 stored in the low nibble) are scaled up
    if (pal.length && pal.every((c) => c.every((v) => (v & 15) === 0))) { /* proper 8-bit with low nibble zero: fine */ }
    if (ehb) for (let i = 0; i < 32; i++) pal[32 + i] = (pal[i] || [0, 0, 0]).map((v) => v >> 1);
    const rowB = chunky ? W + (W & 1) : Math.ceil(W / 16) * 2, rows = chunky ? 1 : P + (bm.mask === 1 ? 1 : 0), need = rowB * rows * H;
    const raw = bm.comp === 1 ? unpackBits(b, body[0], need).out : b.subarray(body[0], body[0] + need);
    const img = newImg(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
      let r = 0, g = 0, bl = 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, base = y * rowB * rows; let c = 0;
        if (chunky) c = raw[base + x];
        else for (let p = 0; p < P; p++) c |= ((raw[base + p * rowB + (x >> 3)] >> (7 - (x & 7))) & 1) << p;
        if (P === 24) { d[i] = c & 255; d[i + 1] = (c >> 8) & 255; d[i + 2] = (c >> 16) & 255; d[i + 3] = 255; continue; }
        if (ham) {
          // hold-and-modify: the top two bits say keep two channels and change one
          const hb = P === 8 ? 6 : 4, cmd = c >> hb, v = c & ((1 << hb) - 1), full = (v * 255) / ((1 << hb) - 1);
          if (cmd === 0) [r, g, bl] = pal[v] || [0, 0, 0]; else if (cmd === 1) bl = full; else if (cmd === 2) r = full; else g = full;
          d[i] = r; d[i + 1] = g; d[i + 2] = bl; d[i + 3] = 255; continue;
        }
        const col = pal[c] || [c, c, c]; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = bm.mask === 2 && c === bm.clear ? 0 : 255;
      }
    }
    return { img, info: { format: chunky ? 'IFF PBM (Deluxe Paint)' : 'IFF ILBM (Amiga)', bits: P, colours: P <= 8 && !ham ? pal.length : undefined, note: ham ? 'Hold-and-modify (HAM)' : ehb ? 'Extra half-brite' : '' } };
  }
  // planes: 1–8 from the picture's colours, or 24 (true colour); compressed with ByteRun1
  function writeIFF(img, opts = {}) {
    const W = img.width, H = img.height, d = img.data; let P = opts.bits || 8, ix = null;
    if (P <= 8) { ix = needIndexed(img, 1 << P, `A ${1 << P}-colour IFF`); }
    const rowB = Math.ceil(W / 16) * 2, body = [];
    for (let y = 0; y < H; y++) for (let p = 0; p < P; p++) {
      const row = new Uint8Array(rowB);
      for (let x = 0; x < W; x++) { const q = y * W + x, c = ix ? ix.idx[q] : d[q * 4 + (p >> 3)] >> (p & 7); if ((ix ? c >> p : c) & 1) row[x >> 3] |= 0x80 >> (x & 7); }
      body.push(...packBits(row));
    }
    const o = Out(); o.ascii('FORM').u32be(0).ascii('ILBM');
    o.ascii('BMHD').u32be(20).u16be(W).u16be(H).u16be(0).u16be(0).u8(P).u8(ix && ix.clear >= 0 ? 2 : 0).u8(1).u8(0).u16be(ix && ix.clear >= 0 ? ix.clear : 0).u8(1).u8(1).u16be(W).u16be(H);
    if (ix) { const n = 1 << P; o.ascii('CMAP').u32be(n * 3); for (let i = 0; i < n; i++) { const c = ix.pal[i] || [0, 0, 0]; o.u8(c[0]).u8(c[1]).u8(c[2]); } if ((n * 3) & 1) o.u8(0); }
    o.ascii('BODY').u32be(body.length).bytes(body); if (body.length & 1) o.u8(0);
    const out = o.done(); const len = out.length - 8; out[4] = len >>> 24; out[5] = (len >> 16) & 255; out[6] = (len >> 8) & 255; out[7] = len & 255;
    return new Blob([out], { type: 'image/x-ilbm' });
  }

  // ------------------------------------------------------------------ Atari ST: Degas (PI1–3, PC1–3) and NEOchrome
  const ST_MODES = [{ w: 320, h: 200, planes: 4 }, { w: 640, h: 200, planes: 2 }, { w: 640, h: 400, planes: 1 }];
  // ST palette words are 0x0RGB with 3 bits each (STE: 4 bits, the extra bit at the top)
  function stPalette(b, o, n = 16) {
    const words = []; for (let i = 0; i < n; i++) words.push(u16be(b, o + i * 2));
    const ste = words.some((w) => w & 0x888);
    return words.map((w) => [8, 4, 0].map((s) => { const v = (w >> s) & 15; return ste ? (((v & 7) << 1) | ((v >> 3) & 1)) * 17 : Math.round(((v & 7) * 255) / 7); }));
  }
  // ST (3 bits a colour) when every colour is one of the ST's 512, otherwise STE (4 bits, the extra one at the top)
  const onST = (pal) => pal.every((c) => c.every((x) => Math.abs((Math.round((x * 7) / 255) * 255) / 7 - x) < 1.5));
  const stWord = (c, ste) => { if (!ste) return c.reduce((s, x, i) => s | (Math.round((x * 7) / 255) << (8 - i * 4)), 0); const v = c.map((x) => Math.max(0, Math.min(15, Math.round(x / 17)))); return v.reduce((s, x, i) => s | ((((x >> 1) & 7) | ((x & 1) << 3)) << (8 - i * 4)), 0); };
  function stScreen(scr, mode, pal) {
    const { w: W, h: H, planes: P } = ST_MODES[mode], img = newImg(W, H), d = img.data, line = (W * P) / 8;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const g = (x >> 4) * P * 2, bit = 15 - (x & 15); let c = 0;
      for (let p = 0; p < P; p++) { const w = u16be(scr, y * line + g + p * 2); c |= ((w >> bit) & 1) << p; }
      const col = mode === 2 ? (c ? [0, 0, 0] : [255, 255, 255]) : pal[c] || [0, 0, 0], i = (y * W + x) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    return img;
  }
  function readDegas(b, name) {
    const e = ext(name); if (!/^p[ic][123]$/.test(e) || b.length < 34) return null;
    const rw = u16be(b, 0), mode = rw & 3, packed = !!(rw & 0x8000); if (mode > 2) return null;
    const pal = stPalette(b, 2); let scr;
    if (packed) {
      // Degas Elite: each line packed plane by plane (ByteRun1); put back into the ST's interleaved words
      const { planes: P } = ST_MODES[mode], lb = mode === 2 ? 80 : 160, pl = lb / P, un = unpackBits(b, 34, 32000).out; scr = new Uint8Array(32000);
      const lines = mode === 2 ? 400 : 200;
      for (let y = 0; y < lines; y++) for (let p = 0; p < P; p++) for (let wd = 0; wd < pl / 2; wd++) { const s = y * lb + p * pl + wd * 2, t = y * lb + wd * P * 2 + p * 2; scr[t] = un[s]; scr[t + 1] = un[s + 1]; }
    } else { if (b.length < 32034) return null; scr = b.subarray(34, 34 + 32000); }
    return { img: stScreen(scr, mode, pal), info: { format: packed ? 'Degas Elite (Atari ST, packed)' : 'Degas (Atari ST)', bits: ST_MODES[mode].planes, colours: 1 << ST_MODES[mode].planes, note: ['Low resolution', 'Medium resolution', 'High resolution'][mode] } };
  }
  function readNEO(b, name) {
    if (ext(name) !== 'neo' || b.length < 32128) return null;
    const mode = u16be(b, 2); if (mode > 2) return null;
    return { img: stScreen(b.subarray(128, 128 + 32000), mode, stPalette(b, 4)), info: { format: 'NEOchrome (Atari ST)', bits: ST_MODES[mode].planes, colours: 1 << ST_MODES[mode].planes } };
  }
  // the screen and palette words from a picture that already fits the mode (size and colours)
  function stEncode(img, mode) {
    const { w: W, h: H, planes: P } = ST_MODES[mode];
    if (img.width !== W || img.height !== H) fail(`This Atari ST format needs a picture of exactly ${W} × ${H}. Save it with "Fit to the screen" on.`);
    const ix = needIndexed(img, 1 << P, `The Atari ST ${['low', 'medium', 'high'][mode]} resolution`);
    const scr = new Uint8Array(32000), line = (W * P) / 8;
    let map = (c) => c;
    if (mode === 2) { const dark = ix.pal.map((c) => c[0] + c[1] + c[2] < 384); map = (c) => (dark[c] ? 1 : 0); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = map(ix.idx[y * W + x]), g = y * line + (x >> 4) * P * 2, bit = 15 - (x & 15);
      for (let p = 0; p < P; p++) if ((c >> p) & 1) { const o = g + p * 2 + (bit >= 8 ? 0 : 1); scr[o] |= 1 << (bit & 7); }
    }
    const ste = !onST(ix.pal), words = []; for (let i = 0; i < 16; i++) words.push(mode === 2 ? (i ? 0 : 0x777) : ix.pal[i] ? stWord(ix.pal[i], ste) : 0);
    return { scr, words };
  }
  function writeDegas(img, opts = {}) {
    const mode = opts.mode || 0, { scr, words } = stEncode(img, mode), o = Out(); o.u16be(mode); words.forEach((w) => o.u16be(w)); o.bytes(scr);
    for (let i = 0; i < 16; i++) o.u16be(0); // the colour-cycling settings Degas Elite adds at the end
    return new Blob([o.done()], { type: 'application/octet-stream' });
  }
  function writeNEO(img, opts = {}) {
    const mode = opts.mode || 0, { scr, words } = stEncode(img, mode), o = Out(); o.u16be(0).u16be(mode); words.forEach((w) => o.u16be(w));
    o.ascii('        .   ').u16be(0).u16be(0).u16be(0).u16be(0).u16be(0).u16be(W0(mode)).u16be(ST_MODES[mode].h); while (o.at() < 128) o.u8(0); o.bytes(scr);
    return new Blob([o.done()], { type: 'application/octet-stream' });
  }
  const W0 = (mode) => ST_MODES[mode].w;

  // ------------------------------------------------------------------ Commodore 64: Koala Painter
  const C64 = [[0, 0, 0], [255, 255, 255], [129, 51, 56], [117, 206, 200], [142, 60, 151], [86, 172, 77], [46, 44, 155], [237, 241, 113], [142, 80, 41], [85, 56, 0], [196, 108, 113], [74, 74, 74], [123, 123, 123], [169, 255, 159], [112, 109, 235], [178, 178, 178]];
  function readKoala(b, name) {
    if (!/^(koa|kla)$/.test(ext(name)) || b.length < 10001) return null;
    const o = b.length >= 10003 ? 2 : 0, bmp = o, scr = o + 8000, col = o + 9000, bg = b[o + 10000] & 15, img = newImg(320, 200), d = img.data;
    for (let cy = 0; cy < 25; cy++) for (let cx = 0; cx < 40; cx++) for (let r = 0; r < 8; r++) {
      const byte = b[bmp + (cy * 40 + cx) * 8 + r], s = b[scr + cy * 40 + cx], c = b[col + cy * 40 + cx] & 15;
      for (let p = 0; p < 4; p++) {
        const v = (byte >> (6 - p * 2)) & 3, k = v === 0 ? bg : v === 1 ? s >> 4 : v === 2 ? s & 15 : c, rgb = C64[k], y = cy * 8 + r;
        for (let dx = 0; dx < 2; dx++) { const i = (y * 320 + cx * 8 + p * 2 + dx) * 4; d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; }
      }
    }
    return { img, info: { format: 'Koala Painter (Commodore 64)', bits: 4, colours: 16, note: 'Multicolour: pixels twice as wide' } };
  }
  // from a 320 × 200 picture already in C64 colours (see IC.colour.c64Cells): 2 pixels across make one
  function writeKoala(img) {
    if (img.width !== 320 || img.height !== 200) fail('Koala Painter needs a 320 × 200 picture. Save it with "Fit to the screen" on.');
    const d = img.data, near = (i) => { let b = 0, bd = Infinity; C64.forEach((c, k) => { const e = (d[i] - c[0]) ** 2 + (d[i + 1] - c[1]) ** 2 + (d[i + 2] - c[2]) ** 2; if (e < bd) { bd = e; b = k; } }); return b; };
    const idx = new Uint8Array(160 * 200); for (let y = 0; y < 200; y++) for (let x = 0; x < 160; x++) idx[y * 160 + x] = near((y * 320 + x * 2) * 4);
    const hist = new Array(16).fill(0); idx.forEach((k) => hist[k]++); const bg = hist.indexOf(Math.max(...hist));
    const out = new Uint8Array(10003); out[0] = 0x00; out[1] = 0x60; out[10002] = bg;
    for (let cy = 0; cy < 25; cy++) for (let cx = 0; cx < 40; cx++) {
      const h = new Array(16).fill(0); for (let r = 0; r < 8; r++) for (let p = 0; p < 4; p++) h[idx[(cy * 8 + r) * 160 + cx * 4 + p]]++;
      const top = h.map((n, k) => [n, k]).filter(([n, k]) => n && k !== bg).sort((a, b2) => b2[0] - a[0]).slice(0, 3).map(([, k]) => k);
      while (top.length < 3) top.push(0);
      out[2 + 8000 + cy * 40 + cx] = (top[0] << 4) | top[1]; out[2 + 9000 + cy * 40 + cx] = top[2];
      const opts = [bg, ...top];
      for (let r = 0; r < 8; r++) {
        let byte = 0;
        for (let p = 0; p < 4; p++) { const k = idx[(cy * 8 + r) * 160 + cx * 4 + p]; let v = opts.indexOf(k); if (v < 0) { let bd = Infinity; opts.forEach((o, j) => { const e = C64[o].reduce((s, x, q) => s + (x - C64[k][q]) ** 2, 0); if (e < bd) { bd = e; v = j; } }); } byte |= v << (6 - p * 2); }
        out[2 + (cy * 40 + cx) * 8 + r] = byte;
      }
    }
    return new Blob([out], { type: 'application/octet-stream' });
  }

  // ------------------------------------------------------------------ ZX Spectrum screen (.scr)
  const ZX = (() => { const p = []; for (const br of [0, 1]) for (let c = 0; c < 8; c++) { const v = br ? 255 : 215; p.push([(c & 2) ? v : 0, (c & 4) ? v : 0, (c & 1) ? v : 0]); } return p; })();
  const zxAddr = (x, y) => ((y & 0xc0) << 5) | ((y & 7) << 8) | ((y & 0x38) << 2) | (x >> 3);
  function readZX(b, name) {
    if (ext(name) !== 'scr' || b.length < 6912) return null;
    const img = newImg(256, 192), d = img.data;
    for (let y = 0; y < 192; y++) for (let x = 0; x < 256; x++) {
      const on = (b[zxAddr(x, y)] >> (7 - (x & 7))) & 1, a = b[6144 + (y >> 3) * 32 + (x >> 3)], br = (a >> 6) & 1, c = ZX[br * 8 + (on ? a & 7 : (a >> 3) & 7)], i = (y * 256 + x) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    return { img, info: { format: 'ZX Spectrum screen', bits: 4, colours: 15, note: 'Two colours in each 8 × 8 square' } };
  }
  // from a 256 × 192 picture (IC.colour.zxCells makes one that follows the two-colours-a-square rule)
  function writeZX(img) {
    if (img.width !== 256 || img.height !== 192) fail('A ZX Spectrum screen needs a 256 × 192 picture. Save it with "Fit to the screen" on.');
    const d = img.data, out = new Uint8Array(6912), near = (i, set) => { let b = 0, bd = Infinity; set.forEach((k) => { const c = ZX[k], e = (d[i] - c[0]) ** 2 + (d[i + 1] - c[1]) ** 2 + (d[i + 2] - c[2]) ** 2; if (e < bd) { bd = e; b = k; } }); return b; };
    const all = [...Array(16).keys()];
    for (let cy = 0; cy < 24; cy++) for (let cx = 0; cx < 32; cx++) {
      const h = new Array(16).fill(0); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) h[near(((cy * 8 + y) * 256 + cx * 8 + x) * 4, all)]++;
      const top = h.map((n, k) => [n, k]).sort((a, b2) => b2[0] - a[0]); let ink = top[0][1], paper = top[1][0] ? top[1][1] : top[0][1];
      const br = (ink >= 8 || paper >= 8) ? 1 : 0; ink &= 7; paper &= 7; const set = [br * 8 + ink, br * 8 + paper];
      out[6144 + cy * 32 + cx] = (br << 6) | (paper << 3) | ink;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const px = cx * 8 + x, py = cy * 8 + y; if (near((py * 256 + px) * 4, set) === set[0] && ink !== paper) out[zxAddr(px, py)] |= 0x80 >> (px & 7); }
    }
    return new Blob([out], { type: 'application/octet-stream' });
  }

  // ------------------------------------------------------------------ MacPaint (.mac, 576 × 720 black and white)
  function readMacPaint(b, name) {
    if (!/^(mac|pntg|pnt)$/.test(ext(name)) || b.length < 640) return null;
    let o = str(b, 65, 4) === 'PNTG' && b[0] === 0 ? 128 : 0; o += 512;
    const raw = unpackBits(b, o, 72 * 720).out, img = newImg(576, 720), d = img.data;
    for (let i = 0; i < 576 * 720; i++) { const v = (raw[i >> 3] >> (7 - (i & 7))) & 1 ? 0 : 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
    return { img, info: { format: 'MacPaint', bits: 1, colours: 2 } };
  }
  function writeMacPaint(img) {
    if (img.width !== 576 || img.height !== 720) fail('MacPaint needs a 576 × 720 picture. Save it with "Fit to the screen" on.');
    const d = img.data, o = Out(); for (let i = 0; i < 512; i++) o.u8(0); o.set32be(0, 2);
    for (let y = 0; y < 720; y++) { const row = new Uint8Array(72); for (let x = 0; x < 576; x++) { const i = (y * 576 + x) * 4; if (d[i] + d[i + 1] + d[i + 2] < 384 && d[i + 3] >= 128) row[x >> 3] |= 0x80 >> (x & 7); } o.bytes(packBits(row)); }
    return new Blob([o.done()], { type: 'application/octet-stream' });
  }

  // ------------------------------------------------------------------ Netpbm (PBM, PGM, PPM)
  function readPNM(b) {
    if (b[0] !== 80 || b[1] < 49 || b[1] > 54) return null;
    const kind = b[1] - 48; let o = 2;
    const tok = () => { for (;;) { while (o < b.length && /\s/.test(String.fromCharCode(b[o]))) o++; if (b[o] === 35) { while (o < b.length && b[o] !== 10) o++; continue; } break; } let s = ''; while (o < b.length && !/\s/.test(String.fromCharCode(b[o]))) s += String.fromCharCode(b[o++]); return +s; };
    const W = tok(), H = tok(), max = kind === 1 || kind === 4 ? 1 : tok(); o++;
    const img = newImg(W, H), d = img.data, wide = max > 255, scale = (v) => Math.round((v * 255) / max);
    for (let p = 0; p < W * H; p++) {
      const i = p * 4; let r, g, bl;
      if (kind === 1) { let t; do { t = b[o++]; } while (t !== 48 && t !== 49 && o < b.length); r = g = bl = t === 49 ? 0 : 255; }
      else if (kind === 4) { const x = p % W, y = (p / W) | 0, rb = Math.ceil(W / 8); r = g = bl = (b[o + y * rb + (x >> 3)] >> (7 - (x & 7))) & 1 ? 0 : 255; }
      else if (kind === 2) r = g = bl = scale(tok());
      else if (kind === 3) { r = scale(tok()); g = scale(tok()); bl = scale(tok()); }
      else if (kind === 5) { r = g = bl = scale(wide ? u16be(b, o + p * 2) : b[o + p]); }
      else { const s = o + p * 3 * (wide ? 2 : 1); r = scale(wide ? u16be(b, s) : b[s]); g = scale(wide ? u16be(b, s + 2) : b[s + 1]); bl = scale(wide ? u16be(b, s + 4) : b[s + 2]); }
      d[i] = r; d[i + 1] = g; d[i + 2] = bl; d[i + 3] = 255;
    }
    return { img, info: { format: ['', 'PBM', 'PGM', 'PPM', 'PBM', 'PGM', 'PPM'][kind] + ' (Netpbm)', bits: kind === 1 || kind === 4 ? 1 : kind === 2 || kind === 5 ? 8 : 24 } };
  }
  function writePNM(img, opts = {}) {
    const W = img.width, H = img.height, d = img.data, kind = opts.kind || 'ppm', o = Out();
    if (kind === 'pbm') { o.ascii(`P4\n${W} ${H}\n`); const rb = Math.ceil(W / 8); for (let y = 0; y < H; y++) { const row = new Uint8Array(rb); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i] + d[i + 1] + d[i + 2] < 384) row[x >> 3] |= 0x80 >> (x & 7); } o.bytes(row); } }
    else if (kind === 'pgm') { o.ascii(`P5\n${W} ${H}\n255\n`); for (let i = 0; i < d.length; i += 4) o.u8(Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114)); }
    else { o.ascii(`P6\n${W} ${H}\n255\n`); for (let i = 0; i < d.length; i += 4) o.u8(d[i]).u8(d[i + 1]).u8(d[i + 2]); }
    return new Blob([o.done()], { type: 'image/x-portable-anymap' });
  }

  // ------------------------------------------------------------------ TIFF (uncompressed, PackBits, LZW, Deflate; strips)
  function lzwTIFF(b) {
    const out = []; let pos = 0, size = 9; const dict = [];
    const reset = () => { dict.length = 0; for (let i = 0; i < 256; i++) dict.push([i]); dict.push(null, null); size = 9; };
    const read = () => { let v = 0; for (let i = 0; i < size; i++) { const byte = b[(pos + i) >> 3]; v = (v << 1) | ((byte >> (7 - ((pos + i) & 7))) & 1); } pos += size; return v; };
    reset(); let prev = null;
    while ((pos + size) <= b.length * 8) {
      const c = read(); if (c === 257) break;
      if (c === 256) { reset(); prev = null; continue; }
      let e; if (c < dict.length && dict[c]) e = dict[c]; else if (prev) e = [...prev, prev[0]]; else break;
      for (const v of e) out.push(v);
      if (prev) dict.push([...prev, e[0]]);
      prev = e;
      if (dict.length + 1 >= 1 << size && size < 12) size++;
    }
    return Uint8Array.from(out);
  }
  async function readTIFF(b, at) {
    const le = b[0] === 73 && b[1] === 73; if (!le && !(b[0] === 77 && b[1] === 77)) return null;
    const r16 = (o) => (le ? u16le(b, o) : u16be(b, o)), r32 = (o) => (le ? u32le(b, o) : u32be(b, o)); if (r16(2) !== 42) return null;
    const ifd = at || r32(4), n = r16(ifd), tags = {};
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12, tag = r16(e), type = r16(e + 2), cnt = r32(e + 4), sz = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8 }[type] || 1;
      const at = cnt * sz > 4 ? r32(e + 8) : e + 8, vals = [];
      for (let k = 0; k < Math.min(cnt, 70000); k++) vals.push(type === 3 ? r16(at + k * 2) : type === 4 ? r32(at + k * 4) : b[at + k]);
      tags[tag] = vals;
    }
    const W = tags[256][0], H = tags[257][0], bps = (tags[258] || [1])[0], comp = (tags[259] || [1])[0], photo = (tags[262] || [1])[0], spp = (tags[277] || [1])[0], rps = (tags[278] || [H])[0], pred = (tags[317] || [1])[0];
    if (tags[322]) fail('This TIFF is stored in tiles, which ImageCraft cannot read yet.');
    if (![1, 5, 8, 32946, 32773].includes(comp)) fail('This TIFF uses a kind of compression ImageCraft cannot read (JPEG or fax).');
    if ((tags[284] || [1])[0] !== 1) fail('This TIFF stores each colour separately, which ImageCraft cannot read yet.');
    const offs = tags[273], cnts = tags[279], rowB = Math.ceil((W * bps * spp) / 8), raw = new Uint8Array(rowB * H);
    for (let s = 0; s < offs.length; s++) {
      let part = b.subarray(offs[s], offs[s] + cnts[s]);
      if (comp === 5) part = lzwTIFF(part); else if (comp === 32773) part = unpackBits(part, 0, rowB * Math.min(rps, H - s * rps)).out; else if (comp === 8 || comp === 32946) part = await inflate(part);
      raw.set(part.subarray(0, Math.min(part.length, raw.length - s * rps * rowB)), s * rps * rowB);
    }
    if (pred === 2 && bps === 8) for (let y = 0; y < H; y++) for (let x = spp; x < rowB; x++) raw[y * rowB + x] = (raw[y * rowB + x] + raw[y * rowB + x - spp]) & 255;
    const r16v = (o) => (le ? raw[o] | (raw[o + 1] << 8) : (raw[o] << 8) | raw[o + 1]), w16v = (o, v) => { if (le) { raw[o] = v & 255; raw[o + 1] = v >> 8; } else { raw[o] = v >> 8; raw[o + 1] = v & 255; } };
    if (pred === 2 && bps === 16) for (let y = 0; y < H; y++) for (let x = spp; x < W * spp; x++) w16v(y * rowB + x * 2, (r16v(y * rowB + x * 2) + r16v(y * rowB + (x - spp) * 2)) & 65535);
    if (bps === 16 && (photo === 2 || photo === 1 || photo === 0)) { // all 16 bits kept
      const extraA = tags[338] && spp > (photo === 2 ? 3 : 1), deep = new Uint16Array(W * H * 4);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, s = y * rowB + x * spp * 2; if (photo === 2) { deep[i] = r16v(s); deep[i + 1] = r16v(s + 2); deep[i + 2] = r16v(s + 4); deep[i + 3] = extraA ? r16v(s + 6) : 65535; } else { const g = r16v(s), gg = photo === 0 ? 65535 - g : g; deep[i] = deep[i + 1] = deep[i + 2] = gg; deep[i + 3] = spp > 1 && extraA ? r16v(s + 2) : 65535; } }
      return { img: down16(deep, W, H), deep, info: { format: 'TIFF', bits: bps * spp, note: '16 bits per colour (kept)' } };
    }
    const img = newImg(W, H), d = img.data, cmap = tags[320], extraA = tags[338] && spp > 3;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, ro = y * rowB;
      if (photo === 2) { const s = ro + x * spp * (bps / 8); const g = (k) => (bps === 16 ? b16(raw, s + k * 2, le) : raw[s + k]); d[i] = g(0); d[i + 1] = g(1); d[i + 2] = g(2); d[i + 3] = extraA ? g(3) : 255; continue; }
      const v = bps === 16 ? b16(raw, ro + x * 2, le) : (raw[ro + ((x * bps) >> 3)] >> (8 - bps - ((x * bps) & 7))) & ((1 << bps) - 1);
      if (photo === 3 && cmap) { const N = 1 << bps; d[i] = cmap[v] >> 8; d[i + 1] = cmap[N + v] >> 8; d[i + 2] = cmap[2 * N + v] >> 8; }
      else { const g = bps === 16 ? v : Math.round((v * 255) / ((1 << bps) - 1)), gg = photo === 0 ? 255 - g : g; d[i] = d[i + 1] = d[i + 2] = gg; }
      d[i + 3] = 255;
    }
    return { img, info: { format: 'TIFF', bits: bps * spp, colours: photo === 3 ? 1 << bps : undefined } };
  }
  const b16 = (r, o, le) => (le ? r[o + 1] : r[o]); // the top byte of a 16-bit value
  function writeTIFF(img, opts = {}) {
    const W = img.width, H = img.height, d = img.data, b16 = opts.bits === 48 || opts.bits === 64, a = b16 ? opts.bits === 64 : opts.bits === 24 ? false : hasClear(img), spp = a ? 4 : 3, bw = b16 ? 2 : 1, data = new Uint8Array(W * H * spp * bw);
    if (b16) { const D = opts.deep && opts.deep.length === W * H * 4 ? opts.deep : up16(img); for (let p = 0; p < W * H; p++) for (let k = 0; k < spp; k++) { const v = D[p * 4 + k]; data[(p * spp + k) * 2] = v & 255; data[(p * spp + k) * 2 + 1] = v >> 8; } }
    else for (let p = 0; p < W * H; p++) for (let k = 0; k < spp; k++) data[p * spp + k] = d[p * 4 + k];
    const o = Out(); o.ascii('II').u16le(42).u32le(8);
    const tags = [[256, 4, [W]], [257, 4, [H]], [258, 3, Array(spp).fill(b16 ? 16 : 8)], [259, 3, [1]], [262, 3, [2]], [273, 4, [0]], [277, 3, [spp]], [278, 4, [H]], [279, 4, [data.length]], [282, 5, [72, 1]], [283, 5, [72, 1]], [284, 3, [1]], [296, 3, [2]]];
    if (a) tags.push([338, 3, [2]]);
    const ifdLen = 2 + tags.length * 12 + 4; let extra = 8 + ifdLen; const blobs = [];
    o.u16le(tags.length);
    tags.forEach(([t, ty, v]) => {
      o.u16le(t).u16le(ty).u32le(ty === 5 ? v.length / 2 : v.length);
      const sz = (ty === 3 ? 2 : 4) * v.length;
      if (t === 273) { o.u32le(0); return; }
      if (sz <= 4) { if (ty === 3) { o.u16le(v[0]).u16le(v[1] || 0); } else o.u32le(v[0]); return; }
      o.u32le(extra); blobs.push([ty, v]); extra += sz;
    });
    o.u32le(0);
    blobs.forEach(([ty, v]) => v.forEach((x) => (ty === 3 ? o.u16le(x) : o.u32le(x))));
    const at = o.at(); o.bytes(data);
    const out = o.done(); // the strip offset (tag 273) points at the pixels
    const k = tags.findIndex(([t]) => t === 273), slot = 8 + 2 + k * 12 + 8; out[slot] = at & 255; out[slot + 1] = (at >> 8) & 255; out[slot + 2] = (at >> 16) & 255; out[slot + 3] = (at >>> 24) & 255;
    return new Blob([out], { type: 'image/tiff' });
  }

  // ------------------------------------------------------------------ PDF (one page, the picture as JPEG or lossless)
  async function writePDF(img, opts = {}) {
    // white behind see-through parts; JPEG keeps the file small
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(canvasOf(img), 0, 0);
    const jpg = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/jpeg', opts.quality || 0.92))).arrayBuffer());
    const dpi = opts.dpi || 150, pw = (img.width * 72) / dpi, ph = (img.height * 72) / dpi;
    const objs = [`<< /Type /Catalog /Pages 2 0 R >>`, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`, null, null];
    const content = `q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im0 Do Q`;
    const enc = new TextEncoder(), parts = [enc.encode('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')]; const offs = []; let pos = parts[0].length;
    const add = (u8) => { parts.push(u8); pos += u8.length; };
    objs.forEach((s, i) => {
      offs.push(pos);
      if (i === 3) { add(enc.encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`)); add(jpg); add(enc.encode('\nendstream\nendobj\n')); }
      else if (i === 4) add(enc.encode(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`));
      else add(enc.encode(`${i + 1} 0 obj\n${s}\nendobj\n`));
    });
    const xref = pos; add(enc.encode(`xref\n0 6\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
    return new Blob(parts, { type: 'application/pdf' });
  }

  // ------------------------------------------------------------------ ZIP (for several files at once; stored, not packed)
  function zip(files) {
    const enc = new TextEncoder(), parts = [], dir = []; let pos = 0;
    const dt = new Date(), time = (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1), date = ((dt.getFullYear() - 1980) << 9) | ((dt.getMonth() + 1) << 5) | dt.getDate();
    files.forEach(({ name, bytes }) => {
      const nm = enc.encode(name), crc = crcDone(bytes), h = Out();
      h.u32le(0x04034b50).u16le(20).u16le(0x800).u16le(0).u16le(time).u16le(date).u32le(crc).u32le(bytes.length).u32le(bytes.length).u16le(nm.length).u16le(0).bytes(nm);
      const hd = h.done(); parts.push(hd, bytes);
      const c = Out(); c.u32le(0x02014b50).u16le(20).u16le(20).u16le(0x800).u16le(0).u16le(time).u16le(date).u32le(crc).u32le(bytes.length).u32le(bytes.length).u16le(nm.length).u16le(0).u16le(0).u16le(0).u16le(0).u32le(0).u32le(pos).bytes(nm);
      dir.push(c.done()); pos += hd.length + bytes.length;
    });
    const size = dir.reduce((s, x) => s + x.length, 0), e = Out(); e.u32le(0x06054b50).u16le(0).u16le(0).u16le(files.length).u16le(files.length).u32le(size).u32le(pos).u16le(0);
    return new Blob([...parts, ...dir, e.done()], { type: 'application/zip' });
  }

  // ------------------------------------------------------------------ reading any file
  const READERS = [readIFF, readPCX, readDegas, readNEO, readKoala, readZX, readMacPaint, readPNM];
  const BROWSER = { png: 'PNG', jpg: 'JPEG', jpeg: 'JPEG', jfif: 'JPEG', gif: 'GIF', webp: 'WebP', avif: 'AVIF', ico: 'ICO (icon)', cur: 'CUR (cursor)', svg: 'SVG', bmp: 'BMP', apng: 'PNG' };
  async function read(file) {
    // a File or Blob (whose new .bytes() is a function, not the bytes), or { name, bytes } from a test or a ZIP
    const name = file.name || 'picture', bytes = file instanceof Blob ? new Uint8Array(await file.arrayBuffer()) : file.bytes, e = ext(name);
    // by content first, where the file says what it is
    if (str(bytes, 0, 4) === 'FORM') { const r = readIFF(bytes); if (r) return r; }
    if ((bytes[0] === 73 && bytes[1] === 73 && bytes[2] === 42) || (bytes[0] === 77 && bytes[1] === 77 && bytes[3] === 42)) { const r = await readTIFF(bytes); if (r) return r; }
    if (str(bytes, 0, 2) === 'BM') { const r = readBMP(bytes); if (r) return r; }
    if (e === 'tga' || e === 'targa' || e === 'icb' || e === 'vda' || e === 'vst') { const r = readTGA(bytes); if (r) return r; }
    if (e === 'pcx' || e === 'pcc') { const r = readPCX(bytes); if (r) return r; }
    if (bytes[0] === 0x89 && bytes[24] === 16) { try { const r = await readPNG16(bytes); if (r) return r; } catch (err) { /* the browser reads it (8 bits) */ } }
    for (const f of READERS) { try { const r = f(bytes, name); if (r) return r; } catch (err) { /* not this one */ } }
    // the browser's own formats
    const type = e === 'svg' ? 'image/svg+xml' : '';
    const img = await viaBrowser(new Blob([bytes], type ? { type } : {}));
    const magic = bytes[0] === 0x89 ? 'png' : bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpg' : str(bytes, 0, 3) === 'GIF' ? 'gif' : str(bytes, 8, 4) === 'WEBP' ? 'webp' : str(bytes, 4, 8) === 'ftypavif' ? 'avif' : str(bytes, 0, 2) === 'BM' ? 'bmp' : e;
    const pi = magic === 'png' ? pngInfo(bytes) : null;
    return { img, info: { format: BROWSER[magic] || e.toUpperCase() || 'Picture', bits: pi ? pi.bits : magic === 'jpg' ? 24 : magic === 'gif' ? 8 : undefined, note: pi ? pi.note : '' } };
  }

  // ------------------------------------------------------------------ writing
  // Each format: what it is called, its extension, which colour depths it can hold, and the writer.
  // depth: the choices offered when saving (bits); 'fixed' formats have a fixed screen (fit: [w, h], palette rules).
  const FORMATS = {
    png: { name: 'PNG', ext: 'png', group: 'Everyday', depths: [1, 2, 4, 8, 24, 32, 48, 64], what: 'Sharp, lossless, see-through. The best all-rounder (and 16 bits per colour).', write: (img, o) => writePNG(img, o) },
    jpg: { name: 'JPEG', ext: 'jpg', group: 'Everyday', depths: [24], quality: true, what: 'Small files for photos. No see-through (white behind).', write: (img, o) => blobOf(flatten(img, o.back), 'image/jpeg', o.quality ?? 0.9) },
    webp: { name: 'WebP', ext: 'webp', group: 'Everyday', depths: [32], quality: true, what: 'Small files for the web, with see-through.', write: (img, o) => blobOf(img, 'image/webp', o.quality ?? 0.9) },
    gif: { name: 'GIF', ext: 'gif', group: 'Everyday', depths: [1, 2, 4, 8], what: 'Up to 256 colours, with see-through. Old and everywhere.', write: (img) => writeGIF(img) },
    bmp: { name: 'BMP (Windows bitmap)', ext: 'bmp', group: 'Everyday', depths: [1, 4, 8, 16, 24, 32], what: 'Windows bitmap, any depth from 1 to 32 bits.', write: (img, o) => writeBMP(img, o) },
    tif: { name: 'TIFF', ext: 'tif', group: 'Everyday', depths: [24, 32, 48, 64], what: 'For printing and archives (lossless; 16 bits per colour too).', write: (img, o) => writeTIFF(img, o) },
    ico: { name: 'ICO (icon)', ext: 'ico', group: 'Everyday', depths: [32], what: 'A Windows or website icon, with every size from 16 to 256.', write: (img, o) => writeICO(img, o) },
    pdf: { name: 'PDF', ext: 'pdf', group: 'Everyday', depths: [24], quality: true, what: 'One page with the picture, for printing or sending.', write: (img, o) => writePDF(img, o) },
    tga: { name: 'TGA (Targa)', ext: 'tga', group: 'Classic', depths: [8, 16, 24, 32], what: 'Truevision Targa, from the 1980s; still used in games.', write: (img, o) => writeTGA(img, o) },
    pcx: { name: 'PCX (PC Paintbrush)', ext: 'pcx', group: 'Classic', depths: [1, 4, 8, 24], what: 'The DOS paint format: 2, 16 or 256 colours, or true colour.', write: (img, o) => writePCX(img, o) },
    iff: { name: 'IFF ILBM (Amiga)', ext: 'iff', group: 'Classic', depths: [1, 2, 3, 4, 5, 6, 7, 8, 24], what: 'Amiga Deluxe Paint picture: 2 to 256 colours.', write: (img, o) => writeIFF(img, o) },
    pi1: { name: 'Degas low (Atari ST)', ext: 'pi1', group: 'Classic', depths: [4], fit: [320, 200], levels: 8, what: '320 × 200, 16 colours from the ST’s 512.', write: (img) => writeDegas(img, { mode: 0 }) },
    pi2: { name: 'Degas medium (Atari ST)', ext: 'pi2', group: 'Classic', depths: [2], fit: [640, 200], aspect: 2, levels: 8, what: '640 × 200 (tall pixels), 4 colours.', write: (img) => writeDegas(img, { mode: 1 }) },
    pi3: { name: 'Degas high (Atari ST)', ext: 'pi3', group: 'Classic', depths: [1], fit: [640, 400], what: '640 × 400, black and white (the mono monitor).', write: (img) => writeDegas(img, { mode: 2 }) },
    neo: { name: 'NEOchrome (Atari ST)', ext: 'neo', group: 'Classic', depths: [4], fit: [320, 200], levels: 8, what: '320 × 200, 16 colours from the ST’s 512.', write: (img) => writeNEO(img, { mode: 0 }) },
    koa: { name: 'Koala Painter (Commodore 64)', ext: 'koa', group: 'Classic', depths: [4], fit: [320, 200], palette: 'c64', cells: 'c64', what: '160 × 200 wide pixels, the C64’s 16 colours, 4 in each little square.', write: (img) => writeKoala(img) },
    scr: { name: 'ZX Spectrum screen', ext: 'scr', group: 'Classic', depths: [4], fit: [256, 192], palette: 'zx', cells: 'zx', what: '256 × 192, two colours in each 8 × 8 square (the famous colour clash).', write: (img) => writeZX(img) },
    mac: { name: 'MacPaint', ext: 'mac', group: 'Classic', depths: [1], fit: [576, 720], what: '576 × 720 black and white, the 1984 Macintosh.', write: (img) => writeMacPaint(img) },
    ppm: { name: 'PPM / PGM / PBM (Netpbm)', ext: 'ppm', group: 'Classic', depths: [1, 8, 24], what: 'Plain Unix picture files: black and white (PBM), grey (PGM) or colour (PPM).', write: (img, o) => writePNM(img, { kind: o.bits === 1 ? 'pbm' : o.bits === 8 ? 'pgm' : 'ppm' }), extFor: (o) => (o.bits === 1 ? 'pbm' : o.bits === 8 ? 'pgm' : 'ppm') },
  };
  const flatten = (img, back = '#ffffff') => { const c = canvasOf(img), o = document.createElement('canvas'); o.width = img.width; o.height = img.height; const x = o.getContext('2d'); x.fillStyle = back; x.fillRect(0, 0, o.width, o.height); x.drawImage(c, 0, 0); return x.getImageData(0, 0, o.width, o.height); };
  async function write(img, fmt, opts = {}) { const f = FORMATS[fmt] || fail('Unknown format ' + fmt); return f.write(img, opts); }

  // what files can be opened (for the Open box)
  const ACCEPT = 'image/*,.png,.jpg,.jpeg,.gif,.webp,.avif,.bmp,.ico,.cur,.svg,.tif,.tiff,.tga,.pcx,.pcc,.iff,.ilbm,.lbm,.pbm,.pgm,.ppm,.pnm,.pi1,.pi2,.pi3,.pc1,.pc2,.pc3,.neo,.koa,.kla,.scr,.mac,.pntg';

  IC.formats = { down16, up16, read, write, FORMATS, ACCEPT, indexed, countColours, hasClear, canvasOf, zip, crc32: crcDone, ST_MODES, C64, ZX, EGA, flatten, ext };

  // ------------------------------------------------------------------ every picture in a file (ClipArtCraft)
  // → [{ img: ImageData, label, info, delay? }]; an animation also gives { animated: true, frames, blob } on the list
  async function pages(file, { maxFrames = 400 } = {}) {
    const name = file.name || 'picture', bytes = file instanceof Blob ? new Uint8Array(await file.arrayBuffer()) : file.bytes, e = ext(name), out = [];
    // TIFF: one picture per page (IFD)
    if ((bytes[0] === 73 && bytes[1] === 73 && bytes[2] === 42) || (bytes[0] === 77 && bytes[1] === 77 && bytes[3] === 42)) {
      const le = bytes[0] === 73, r16 = (o) => (le ? u16le(bytes, o) : u16be(bytes, o)), r32 = (o) => (le ? u32le(bytes, o) : u32be(bytes, o));
      let at = r32(4), k = 0; const seen = new Set();
      while (at && at < bytes.length && !seen.has(at) && k < 500) { seen.add(at); k++; try { const r = await readTIFF(bytes, at); if (r) out.push({ ...r, label: `Page ${k}` }); } catch (err) { out.push({ error: err.message, label: `Page ${k}` }); } at = r32(at + 2 + r16(at) * 12); }
      return out.filter((p) => p.img).length ? out.filter((p) => p.img) : [await read({ name, bytes })];
    }
    // ICO / CUR: every size inside (each made into a one-picture icon the browser can read)
    if (bytes[0] === 0 && bytes[1] === 0 && (bytes[2] === 1 || bytes[2] === 2) && bytes[3] === 0 && /^(ico|cur)$/.test(e)) {
      const n = u16le(bytes, 4);
      for (let i = 0; i < n; i++) { const d = 6 + i * 16, size = u32le(bytes, d + 8), off = u32le(bytes, d + 12), one = new Uint8Array(22 + size);
        one.set(bytes.subarray(0, 4)); one[4] = 1; one.set(bytes.subarray(d, d + 12), 6); one[18] = 22; one.set(bytes.subarray(off, off + size), 22);
        try { const img = await viaBrowser(new Blob([one], { type: 'image/x-icon' })); out.push({ img, label: `${img.width} × ${img.height}`, info: { format: 'ICO', bits: u16le(bytes, d + 6) || 32 } }); } catch (err) { /* a size the browser cannot read */ } }
      if (out.length) return out.sort((a, b) => b.img.width - a.img.width);
    }
    // animations: every frame (Chrome and Edge read them with ImageDecoder)
    const type = bytes[0] === 0x89 ? 'image/png' : str(bytes, 0, 3) === 'GIF' ? 'image/gif' : str(bytes, 8, 4) === 'WEBP' ? 'image/webp' : str(bytes, 4, 8) === 'ftypavif' || str(bytes, 4, 8) === 'ftypavis' ? 'image/avif' : '';
    if (type && window.ImageDecoder && (await ImageDecoder.isTypeSupported(type).catch(() => false))) {
      try {
        const dec = new ImageDecoder({ data: bytes, type }); await dec.tracks.ready; const tr = dec.tracks.selectedTrack, n = tr ? tr.frameCount : 1;
        if (tr && tr.animated && n > 1) {
          const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
          for (let i = 0; i < Math.min(n, maxFrames); i++) { const { image } = await dec.decode({ frameIndex: i }); c.width = image.displayWidth; c.height = image.displayHeight; x.clearRect(0, 0, c.width, c.height); x.drawImage(image, 0, 0); out.push({ img: x.getImageData(0, 0, c.width, c.height), label: `Frame ${i + 1}`, delay: (image.duration || 0) / 1000, info: { format: type.split('/')[1].toUpperCase() } }); image.close(); }
          dec.close(); out.animated = true; out.frames = n; out.blob = new Blob([bytes], { type: type === 'image/png' ? 'image/apng' : type }); return out;
        }
        dec.close();
      } catch (err) { /* read it as one picture */ }
    }
    return [{ ...(await read({ name, bytes })), label: '' }];
  }
  window.CraftFormats = { ...IC.formats, pages, ACCEPT: IC.formats.ACCEPT + ',.apng,.jp2,.j2k,.jpx,.jxl' };
})();
