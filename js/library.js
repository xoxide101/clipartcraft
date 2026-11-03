/* The shared clip-art library (ClipArtCraft's own copy; the other Craft apps copy js/clipart-picker.js, which reads the
   same store). THE CONTRACT, shared by every Craft app:

   - Browser store: IndexedDB database 'craft-clipart', version 1, object store 'items' (keyPath 'id') and 'meta'.
     Pages opened from disk (file://) share it in Chrome and Edge, and so do apps hosted on one site.
   - An item: { id, name, category, tags: [], width, height, added (ISO time), source, png: Blob | null,
     svg: string | null, thumb: 'data:image/png…' (at most 160 px) }. Optional: type ('clipart' | 'model'), style (flat icon, cartoon, hand-drawn,
     line art, watercolour, 3D render, silhouette, photo…), form (object, scene, background, tile, border, map, logo…),
     description, kind ('colour' | 'grey' | 'bw'),
     author, licence, hash (to spot copies), frames + anim: Blob (an animated GIF/APNG/WebP; png is its first frame),
     serverId + links { png, svg, … } (where the clip-art server keeps it, real http links).
   - The clip-art server (server/clipart-server.js, or clipart-server.php on a web host) keeps libraries in SQLite or
     MySQL/MariaDB with the pictures in a folder; server/API.md lists its API.
   - A library on disk or in a ZIP: library.json { library, made, by, items: [{ name, category, tags, width, height,
     png: 'Name.png', svg: 'Name.svg' }] } beside the files (what ImageCraft's Split a sheet writes).

   window.CraftClipart: all, get, put, remove, add (from files), fromZip, toZip, toFolder, fromFolder. */
(function () {
  'use strict';
  const DB = 'craft-clipart', VERSION = 1;
  let dbp = null;
  const open = () => (dbp = dbp || new Promise((ok, no) => {
    const r = indexedDB.open(DB, VERSION);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('items')) d.createObjectStore('items', { keyPath: 'id' }); if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta'); };
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error || new Error('The library could not be opened (browser storage blocked?).'));
  }));
  const tx = async (store, mode, fn) => { const d = await open(); return new Promise((ok, no) => { const t = d.transaction(store, mode), s = t.objectStore(store); let out; Promise.resolve(fn(s)).then((v) => { out = v; }); t.oncomplete = () => ok(out); t.onerror = () => no(t.error); }); };
  const req = (r) => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const listeners = new Set(); const changed = () => { listeners.forEach((f) => { try { f(); } catch (e) { /* a closed view */ } }); try { if (window.BroadcastChannel) new BroadcastChannel('craft-clipart').postMessage('changed'); } catch (e) { /* no channel */ } };
  try { if (window.BroadcastChannel) new BroadcastChannel('craft-clipart').onmessage = () => listeners.forEach((f) => f()); } catch (e) { /* no channel */ }

  async function all() { return tx('items', 'readonly', (s) => req(s.getAll())); }
  async function get(id) { return tx('items', 'readonly', (s) => req(s.get(id))); }
  // (quiet: a big import saves many and tells the views once, with tell())
  async function put(item, quiet) { await tx('items', 'readwrite', (s) => req(s.put(item))); if (!quiet) changed(); return item; }
  async function remove(ids) { await tx('items', 'readwrite', (s) => Promise.all([].concat(ids).map((id) => req(s.delete(id))))); changed(); }
  async function meta(key, value) { return value === undefined ? tx('meta', 'readonly', (s) => req(s.get(key))) : tx('meta', 'readwrite', (s) => req(s.put(value, key))); }

  // a picture as a small thumbnail and its size
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('That picture could not be read.')); i.src = src; });
  async function thumbOf(src) { const i = await loadImg(src), k = Math.min(1, 160 / Math.max(i.naturalWidth, i.naturalHeight)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(i.naturalWidth * k)); c.height = Math.max(1, Math.round(i.naturalHeight * k)); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, c.width, c.height); return { thumb: c.toDataURL('image/png'), width: i.naturalWidth, height: i.naturalHeight }; }
  const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  // An SVG is kept only when it looks like its PNG: drawn at the PNG's size (on grey), the colours are on average
  // within MATCH.mean (0-255) of it and at most MATCH.wrong % of the pixels are badly wrong (writing lost, a part
  // gone). A trace of a small picture often is not: then the PNG is the picture, and no SVG is made.
  const MATCH = { mean: 10, wrong: 4 };
  const pixelsOf = (im, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h); return x.getImageData(0, 0, w, h); };
  async function svgMatch(svg, pic) {
    let ref = pic; if (!(pic instanceof ImageData)) { const i = await loadImg(typeof pic === 'string' ? pic : URL.createObjectURL(pic)); ref = pixelsOf(i, i.naturalWidth, i.naturalHeight); }
    const w = ref.width, h = ref.height;
    const b = pixelsOf(await loadImg(svgUrl(svg)), w, h).data, a = ref.data; let s = 0, n = 0, bad = 0;
    for (let k = 0; k < a.length; k += 4) {
      const aa = a[k + 3] / 255, ba = b[k + 3] / 255; if (aa < 0.05 && ba < 0.05) continue;
      let d = 0; for (let c = 0; c < 3; c++) d += Math.abs(a[k + c] * aa + 128 * (1 - aa) - (b[k + c] * ba + 128 * (1 - ba)));
      d /= 3; s += d; n++; if (d > 48) bad++;
    }
    const mean = n ? s / n : 0, wrong = n ? (100 * bad) / n : 0;
    return { mean: Math.round(mean * 10) / 10, wrong: Math.round(wrong * 10) / 10, ok: mean <= MATCH.mean && wrong <= MATCH.wrong };
  }
  // a trace that matches the picture (ImageData), or none: the usual setting, then a finer one, then pixel-exact (it keeps
  // small glossy pictures that the others smooth away); not one many times bigger than the PNG it stands for
  async function traceMatched(img, profiles = ['icon', 'balanced', 'pixelExact']) {
    if (!window.CRAFT_RASTERTRACE) return { svg: null };
    const most = Math.max(160000, img.width * img.height * 10); let best = null;
    for (const profile of profiles) {
      let svg; try { svg = CRAFT_RASTERTRACE.traceImage(img, { profile }).svg; } catch (e) { continue; }
      if (svg.length > most) continue;
      const m = await svgMatch(svg, img); if (m.ok) return { svg, match: m };
      if (!best || m.mean < best.mean) best = m;
    }
    return { svg: null, match: best };
  }
  // An SVG drawn as pixels: a whole number of pixels per unit of its own (1 mm = 5 px stays 5 px, edges on pixel
  // boundaries, no rounding drift), as many as reach about TARGET pixels on the longer side (at least 1).
  const TARGET = 2400;
  function svgUnits(svg) {
    const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement; if (!root || root.nodeName !== 'svg') return null;
    const v = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (v.length === 4 && v.every((n) => isFinite(n)) && v[2] > 0 && v[3] > 0) return { w: v[2], h: v[3] };
    const w = parseFloat(root.getAttribute('width')), h = parseFloat(root.getAttribute('height')); return w > 0 && h > 0 && !/%/.test(root.getAttribute('width') + root.getAttribute('height')) ? { w, h } : null;
  }
  const scaleFor = (u, target = TARGET) => Math.max(1, Math.round(target / Math.max(u.w, u.h)));
  async function svgPng(svg, target = TARGET) {
    const u = svgUnits(svg) || { w: 512, h: 512 }, k = scaleFor(u, target), W = Math.max(1, Math.round(u.w * k)), H = Math.max(1, Math.round(u.h * k));
    const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement; root.setAttribute('width', W); root.setAttribute('height', H);
    const i = await loadImg(svgUrl(new XMLSerializer().serializeToString(root))), c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(i, 0, 0, W, H);
    return { blob: await new Promise((ok) => c.toBlob(ok, 'image/png')), width: W, height: H, k };
  }
  // the PNG of a picture, drawn from it to ImageData (for svgMatch)
  async function pixelsOfItem(it) { const i = await loadImg(URL.createObjectURL(it.png)); return pixelsOf(i, i.naturalWidth, i.naturalHeight); }
  const nameOf = (file) => String(file).replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Untitled';

  // one item from a PNG/JPEG/GIF/WebP blob and/or SVG text
  async function makeItem({ name, category = '', tags = [], png = null, svg = null, source = '' }) {
    const t = await thumbOf(png ? URL.createObjectURL(png) : svgUrl(svg));
    return { id: uid(), name, category, tags, width: t.width, height: t.height, added: new Date().toISOString(), source, png, svg, thumb: t.thumb };
  }
  // files dropped or picked: pictures become items; a PNG and an SVG with the same name become one item; ZIPs are libraries
  async function add(files, { category = '', source = 'added' } = {}) {
    const groups = new Map(), zips = [];
    for (const f of files) { if (/\.zip$/i.test(f.name)) { zips.push(f); continue; } const k = nameOf(f.name).toLowerCase(), g = groups.get(k) || { name: nameOf(f.name) }; if (/\.svg$/i.test(f.name)) g.svg = await f.text(); else if (/^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name)) g.png = f; else continue; groups.set(k, g); }
    const made = [];
    for (const g of groups.values()) made.push(await put(await makeItem({ ...g, category, source })));
    for (const z of zips) made.push(...(await fromZip(z, { category })));
    return made;
  }

  // ------------------------------------------------------------------ ZIP (stored or deflated in, stored out)
  async function unzip(bytes) {
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), dec = new TextDecoder(), out = [];
    let e = bytes.length - 22; while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--; if (e < 0) throw new Error('Not a ZIP file.');
    let p = v.getUint32(e + 16, true); const n = v.getUint16(e + 10, true);
    for (let i = 0; i < n; i++) {
      const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true), name = dec.decode(bytes.subarray(p + 46, p + 46 + nl));
      const lnl = v.getUint16(off + 26, true), lel = v.getUint16(off + 28, true), start = off + 30 + lnl + lel, raw = bytes.subarray(start, start + size);
      if (!name.endsWith('/')) out.push({ name, bytes: method === 0 ? raw : method === 8 ? new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()) : null });
      p += 46 + nl + el + cl;
    }
    return out.filter((f) => f.bytes);
  }
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), parts = [], dir = []; let pos = 0;
    for (const f of files) { const nm = enc.encode(f.name), c = crc32(f.bytes), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true); h.setUint32(14, c, true); h.setUint32(18, f.bytes.length, true); h.setUint32(22, f.bytes.length, true); h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, f.bytes); const d = new DataView(new ArrayBuffer(46)); d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x800, true); d.setUint32(16, c, true); d.setUint32(20, f.bytes.length, true); d.setUint32(24, f.bytes.length, true); d.setUint16(28, nm.length, true); d.setUint32(42, pos, true); dir.push(new Uint8Array(d.buffer), nm); pos += 30 + nm.length + f.bytes.length; }
    const dsize = dir.reduce((a, b) => a + b.length, 0), end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, dsize, true); end.setUint32(16, pos, true);
    return new Blob([...parts, ...dir, new Uint8Array(end.buffer)], { type: 'application/zip' });
  }

  // a library in a ZIP: library.json if there is one (names, categories), else every picture in it
  async function fromEntries(entries, { category = '', source = 'library' } = {}) {
    const byName = new Map(entries.map((e) => [e.name.replace(/^.*\//, ''), e])), json = entries.find((e) => /(^|\/)library\.json$/i.test(e.name)), made = [];
    let list = null; try { list = json ? JSON.parse(new TextDecoder().decode(json.bytes)) : null; } catch (e) { list = null; }
    const libName = (list && list.library) || '', items = list && Array.isArray(list.items) ? list.items : [...new Set(entries.filter((e) => /\.(png|jpe?g|gif|webp|svg)$/i.test(e.name)).map((e) => nameOf(e.name)))].map((n) => ({ name: n, png: [...byName.keys()].find((k) => nameOf(k) === n && !/\.svg$/i.test(k)), svg: [...byName.keys()].find((k) => nameOf(k) === n && /\.svg$/i.test(k)) }));
    for (const it of items) { const pf = it.png && byName.get(it.png), sf = it.svg && byName.get(it.svg); if (!pf && !sf) continue;
      made.push(await put(await makeItem({ name: it.name, category: it.category || category || libName, tags: it.tags || [], png: pf ? new Blob([pf.bytes], { type: /\.jpe?g$/i.test(it.png) ? 'image/jpeg' : 'image/png' }) : null, svg: sf ? new TextDecoder().decode(sf.bytes) : null, source }))); }
    return made;
  }

  // ------------------------------------------------------------------ the picture's details inside its files
  // Whenever a picture leaves this browser (sent to the server, a ZIP), its name, source, author and licence go inside the
  // files themselves, so they travel with them: in the PNG as text (iTXt; earlier ones of the same name replaced), in the
  // SVG as <metadata> (Dublin Core).
  // (crc32: the ZIP writer's, above)
  const fieldsOf = (it) => ({ Title: it.name || '', Source: it.source || '', Author: it.author || '', Copyright: it.licence || '', Description: it.description || '' });
  async function stampPng(blob, fields) {
    const src = new Uint8Array(await blob.arrayBuffer()); if (src.length < 33 || src[1] !== 0x50) return blob; // (not a PNG)
    const enc = new TextEncoder(), dec = new TextDecoder(), keys = new Set(Object.keys(fields)), keep = [src.slice(0, 33)];
    const chunk = (type, body) => { const c = new Uint8Array(12 + body.length), dv = new DataView(c.buffer), t = enc.encode(type); dv.setUint32(0, body.length); c.set(t, 4); c.set(body, 8); const both = new Uint8Array(4 + body.length); both.set(t); both.set(body, 4); dv.setUint32(8 + body.length, crc32(both)); return c; };
    for (const [k, v] of Object.entries(fields)) if (v) keep.push(chunk('iTXt', new Uint8Array([...enc.encode(k), 0, 0, 0, 0, 0, ...enc.encode(String(v))])));
    const dv = new DataView(src.buffer, src.byteOffset, src.byteLength);
    for (let at = 33; at + 12 <= src.length; ) { const n = dv.getUint32(at), type = dec.decode(src.subarray(at + 4, at + 8)), end = at + 12 + n; if (end > src.length) { keep.push(src.slice(at)); break; }
      const text = type === 'iTXt' || type === 'tEXt' || type === 'zTXt', key = text ? dec.decode(src.subarray(at + 8, at + 8 + Math.max(0, src.subarray(at + 8, end).indexOf(0)))) : '';
      if (!(text && keys.has(key))) keep.push(src.slice(at, end)); at = end; }
    return new Blob(keep, { type: 'image/png' });
  }
  const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function stampSvg(svg, f) {
    const clean = String(svg).replace(/<metadata id="craft-meta">[\s\S]*?<\/metadata>/, ''), m = clean.match(/<svg\b[^>]*>/); if (!m) return clean;
    const dc = [['title', f.Title], ['source', f.Source], ['creator', f.Author], ['rights', f.Copyright], ['description', f.Description]].filter(([, v]) => v).map(([k, v]) => `<dc:${k}>${xmlEsc(v)}</dc:${k}>`).join('');
    if (!dc) return clean;
    const meta = `<metadata id="craft-meta"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description>${dc}</rdf:Description></rdf:RDF></metadata>`;
    return clean.slice(0, m.index + m[0].length) + meta + clean.slice(m.index + m[0].length);
  }
  // A file's fingerprint: CRC32 and length of what the picture itself is, the words written into it left out (a PNG's
  // text chunks, an SVG's <metadata id="craft-meta">): the same on both servers (core_sum / coreSum), so they can be compared
  async function coreSum(data, k) {
    let b = typeof data === 'string' ? new TextEncoder().encode(k === 'svg' ? data.replace(/<metadata id="craft-meta">[\s\S]*?<\/metadata>/, '') : data) : new Uint8Array(await data.arrayBuffer());
    if (k === 'png' && b.length > 8 && b[0] === 0x89 && b[1] === 0x50) { const keep = [b.subarray(0, 8)], dv = new DataView(b.buffer, b.byteOffset, b.byteLength), dec = new TextDecoder('latin1'); let n = 8;
      for (let at = 8; at + 12 <= b.length; ) { const len = dv.getUint32(at), t = dec.decode(b.subarray(at + 4, at + 8)); if (!['tEXt', 'iTXt', 'zTXt'].includes(t)) { keep.push(b.subarray(at, at + 12 + len)); n += 12 + len; } at += 12 + len; }
      const o = new Uint8Array(n); let w = 0; for (const c of keep) { o.set(c, w); w += c.length; } b = o; }
    return crc32(b).toString(16).padStart(8, '0') + '-' + b.length;
  }
  async function sumsOf(it) { const s = {}; if (it.png) s.png = await coreSum(it.png, 'png'); if (it.svg) s.svg = await coreSum(it.svg, 'svg'); if (it.anim) s.anim = await coreSum(it.anim, 'anim'); return s; }
  const stamped = async (it) => ({ png: it.png ? (it.png.type === 'image/png' ? await stampPng(it.png, fieldsOf(it)) : it.png) : null, svg: it.svg ? stampSvg(it.svg, fieldsOf(it)) : null });
  async function fromZip(file, opts = {}) { return fromEntries(await unzip(new Uint8Array(await file.arrayBuffer())), { source: file.name, ...opts }); }
  const safe = (s) => String(s).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'item';
  async function entriesOf(items) {
    const files = [], list = [], enc = new TextEncoder(), used = new Set();
    for (const it of items) { let base = safe(it.name), k = 2; while (used.has(base.toLowerCase())) base = `${safe(it.name)} ${k++}`; used.add(base.toLowerCase());
      const e = { name: it.name, category: it.category || '', tags: it.tags || [], width: it.width, height: it.height }, st = await stamped(it);
      for (const k of ['source', 'author', 'licence', 'privacy', 'style', 'form', 'description']) if (it[k]) e[k] = it[k];
      if (st.png) { files.push({ name: `${base}.png`, bytes: new Uint8Array(await st.png.arrayBuffer()) }); e.png = `${base}.png`; }
      if (st.svg) { files.push({ name: `${base}.svg`, bytes: enc.encode(st.svg) }); e.svg = `${base}.svg`; }
      list.push(e); }
    files.push({ name: 'library.json', bytes: enc.encode(JSON.stringify({ library: 'Clip art', made: new Date().toISOString(), by: 'ClipArtCraft', items: list }, null, 2)) });
    return files;
  }
  async function toZip(items) { return zip(await entriesOf(items)); }

  // ------------------------------------------------------------------ a library folder (backup, sync, sharing)
  async function pickFolder() { if (!window.showDirectoryPicker) throw new Error('This browser cannot open folders (use Chrome or Edge), but ZIPs work.'); const h = await window.showDirectoryPicker({ id: 'craft-clipart', mode: 'readwrite' }); await meta('folder', h); return h; }
  async function folder(ask) { let h = await meta('folder'); if (h && (await h.queryPermission({ mode: 'readwrite' })) !== 'granted' && ask) { if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') h = null; } else if (h && (await h.queryPermission({ mode: 'readwrite' })) !== 'granted') h = null; return h; }
  async function toFolder(items, h) { h = h || (await folder(true)) || (await pickFolder()); for (const f of await entriesOf(items)) { const fh = await h.getFileHandle(f.name, { create: true }), w = await fh.createWritable(); await w.write(f.bytes); await w.close(); } return h.name; }
  async function fromFolder(h, opts = {}) { h = h || (await folder(true)) || (await pickFolder()); const entries = []; for await (const [name, e] of h.entries()) if (e.kind === 'file' && /\.(png|jpe?g|gif|webp|svg|json)$/i.test(name)) entries.push({ name, bytes: new Uint8Array(await (await e.getFile()).arrayBuffer()) }); return fromEntries(entries, { source: h.name, ...opts }); }

  // ------------------------------------------------------------------ the clip-art server (optional)
  const b64 = (blob) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).replace(/^data:[^,]*,/, '')); r.onerror = () => no(r.error); r.readAsDataURL(blob); });
  const NUMS = ['width', 'height', 'frames', 'colours'];
  const META = ['type', 'name', 'original', 'seen', 'matched', 'category', 'style', 'form', 'tags', 'description', 'kind', 'width', 'height', 'frames', 'colours', 'source', 'author', 'licence', 'hash', 'privacy'];
  async function server(url) { if (url !== undefined) { await meta('server', url ? String(url).trim().replace(/\/+$/, '') : ''); } return (await meta('server')) || ''; }
  async function serverKey(k) { if (k !== undefined) await meta('serverKey', k || ''); return (await meta('serverKey')) || ''; }
  async function call(path, opts = {}) { const u = await server(); if (!u) throw new Error('No clip-art server is connected.'); const k = await serverKey(); if (k) opts = { ...opts, headers: { ...(opts.headers || {}), 'x-craft-key': k } }; let r; try { r = await fetch(u + path, opts); } catch (e) { throw new Error(`The clip-art server at ${u} did not answer (is it running?).`); } const j = r.headers.get('content-type')?.includes('json') ? await r.json() : null; if (!r.ok) throw Object.assign(new Error((j && j.error) || `The server said ${r.status}.`), { status: r.status }); return j; }
  const serverInfo = () => call('/api/info');
  // a long job (importing, slicing, sending): while it runs, closing or refreshing the page asks first
  let jobs = 0; const leaving = (e) => { e.preventDefault(); e.returnValue = ''; return ''; };
  async function guard(fn) { if (jobs++ === 0) window.addEventListener('beforeunload', leaving); try { return await fn(); } finally { if (--jobs === 0) window.removeEventListener('beforeunload', leaving); } }
  // what is still to be sent (kept in the store, so a send cut short by a refresh can be finished afterwards)
  async function forgetPending() { await meta('pushQueue', []); }
  async function pending() { const ids = (await meta('pushQueue')) || []; if (!ids.length) return []; const all = await tx('items', 'readonly', (s) => req(s.getAll())); return all.filter((it) => ids.includes(it.id)); }
  // send items to the server (new ones are added, ones it has are updated); the server may number a name (Cat_002)
  // (here: false = sent only, not kept in this browser: a big archive straight to the server)
  async function push(items, progress = () => {}, { here = true } = {}) { return guard(() => pushNow(items, progress, here)); }
  async function pushNow(items, progress, here = true) {
    const out = []; let n = 0, left = new Set([...((await meta('pushQueue')) || []), ...(here ? items.map((it) => it.id) : [])]);
    if (here) await meta('pushQueue', [...left]);
    for (const it of items) {
      // (a number left empty goes as nothing: MySQL refuses '' for a number column)
      const j = Object.fromEntries(META.filter((k) => it[k] !== undefined).map((k) => [k, NUMS.includes(k) && (it[k] === '' || it[k] === null || !isFinite(it[k])) ? null : it[k]]));
      const st = await stamped(it); if (!j.privacy) j.privacy = ''; // (its details go inside the files it sends)
      if (st.png) { j.png = await b64(st.png); j.pngExt = it.png.type === 'image/jpeg' ? 'jpg' : 'png'; }
      if (st.svg) j.svg = st.svg; else if (it.noSvg && it.serverId) j.svg = null; if (it.anim) { j.anim = await b64(it.anim); j.animExt = (it.anim.type.split('/')[1] || 'gif').replace('apng', 'png'); }
      if (it.thumb) { j.thumb = it.thumb.replace(/^data:[^,]*,/, ''); j.thumbExt = 'png'; }
      let s; try { s = await call(it.serverId ? '/api/items/' + it.serverId : '/api/items', { method: it.serverId ? 'PATCH' : 'POST', body: JSON.stringify(j) }); } catch (e) { if (!it.serverId || !/No such item/.test(e.message)) throw e; delete it.serverId; s = await call('/api/items', { method: 'POST', body: JSON.stringify(j) }); }
      it.serverId = s.id; it.links = s.links; it.name = s.name; it.serverChanged = s.changed; it.thumbFrom = s.changed; delete it.changed; if (here) await tx('items', 'readwrite', (st) => req(st.put(it))); out.push(it); progress(++n, items.length);
      if (here) { left.delete(it.id); await meta('pushQueue', [...left]); }
    }
    changed(); return out;
  }
  // bring the server's items into this browser (ones already here are updated if the server's copy is newer)
  async function pull(progress = () => {}, opts = {}) { return guard(() => pullNow(progress, opts)); }
  // why a picture came down again: its picture (PNG), its drawing (SVG) or its details changed on the server
  const DETAIL = ['name', 'category', 'style', 'form', 'description', 'source', 'author', 'licence', 'privacy'];
  async function files(it) {
    if (!it || !it.remote) return it; const l = it.links || {};
    const get = async (u, text) => { if (!u) return null; const r = await fetch(u); if (!r.ok) throw new Error(`The server could not hand over “${it.name}” (${r.status}).`); return text ? r.text() : r.blob(); };
    const png = await get(l.png), svg = await get(l.svg, true), anim = await get(l.anim); if (!png && !svg) throw new Error(`“${it.name}” has no picture on the server.`);
    Object.assign(it, { png, svg, anim, remote: false }); try { const t = await thumbOf(png ? URL.createObjectURL(png) : svgUrl(svg)); it.thumb = t.thumb; it.width = t.width; it.height = t.height; } catch (e) { /* the server's thumbnail stays */ }
    await tx('items', 'readwrite', (st) => req(st.put(it))); return it;
  }
  async function whyOf(old, s, png, svg) {
    const w = [];
    try { if (!!old.png !== !!png || (png && (await coreSum(old.png, 'png')) !== (await coreSum(png, 'png')))) w.push('picture changed'); } catch (e) { /* unreadable */ }
    if (!!old.svg !== !!svg || (svg && (await coreSum(old.svg, 'svg')) !== (await coreSum(svg, 'svg')))) w.push(!svg ? 'drawing taken off' : !old.svg ? 'drawing added' : 'drawing changed');
    const d = DETAIL.filter((k) => String(old[k] ?? '') !== String(s[k] ?? '')); if ((old.tags || []).join(',') !== (s.tags || []).join(',')) d.push('tags');
    if (d.length) w.push(`details changed (${d.join(', ')})`);
    return w.length ? w.join('; ') : 'changed on the server';
  }
  async function pullNow(progress, { q = '', category, since = '', newMax = 300 } = {}) {
    // (a picture the server lists but cannot hand over, its file missing there, is skipped and counted, not the end of it)
    const here = new Map((await all()).filter((it) => it.serverId).map((it) => [it.serverId, it])), made = [], updated = [], thumbs = [], missing = [], skip = await notHere(), gone = new Set((await meta('deleteQueue')) || []), seen = new Set(); let n = 0, total = 0;
    // one picture from the server into this browser (new here, or a newer copy of one here), with its own thumbnail
    const take = async (s, old) => {
        const get = async (k) => { if (!s.links[k]) return null; const r = await fetch(s.links[k]); return r.ok ? r.blob() : null; };
        let png = null, svg = null, anim = null; try { png = await get('png'); if (s.links.svg) { const r = await fetch(s.links.svg); if (r.ok) svg = await r.text(); } anim = await get('anim'); } catch (e) { /* counted below */ }
        if (!png && !svg) { missing.push(s.name); return; }
        const why = old ? await whyOf(old, s, png, svg) : 'new on the server';
        const it = old || { id: uid(), added: s.added || new Date().toISOString() }; it.why = why;
        Object.assign(it, Object.fromEntries(META.map((k) => [k, s[k] ?? it[k] ?? (k === 'tags' ? [] : NUMS.includes(k) ? null : '')])), { png, svg, anim, serverId: s.id, links: s.links, serverChanged: s.changed, source: s.source || 'clip-art server' }); delete it.changed;
        try { const t = await thumbOf(png ? URL.createObjectURL(png) : svgUrl(svg)); it.thumb = t.thumb; it.width = t.width; it.height = t.height; it.thumbFrom = s.changed; } /* (always: a newer picture needs its own thumbnail) */ catch (e) { missing.push(s.name); return; }
        await tx('items', 'readwrite', (st) => req(st.put(it))); made.push(it); if (old) updated.push(it);
    };
    // its data only: details, links and the server's thumbnail (a link), no files; they come when it is used (files())
    const datas = []; const note = (s, old) => {
      const it = old || { id: uid(), added: s.added || new Date().toISOString() };
      Object.assign(it, Object.fromEntries(META.map((k) => [k, s[k] ?? it[k] ?? (k === 'tags' ? [] : NUMS.includes(k) ? null : '')])), { serverId: s.id, links: s.links, serverChanged: s.changed, source: s.source || it.source || 'clip-art server', remote: true, thumb: s.links.thumb || s.links.png || s.links.svg || '', thumbFrom: s.changed });
      delete it.changed; datas.push(it); made.push(it); if (old) updated.push(it); return it;
    };
    const fresh = []; let leftNew = 0, newestSeen = '';
    // (read in the order added or changed: pictures added while this reads come at the end, so none are missed)
    for (let off = 0; ; off += 500) {
      const r = await call(`/api/items?limit=500&offset=${off}&q=${encodeURIComponent(q)}${category !== undefined ? '&category=' + encodeURIComponent(category) : ''}${since ? '&since=' + encodeURIComponent(since) : ''}&order=changed`); total = r.total; if (!r.items.length) break;
      for (const s of r.items) {
        const old = here.get(s.id); seen.add(s.id); progress(++n, total, 'list'); if ((s.changed || '') > newestSeen) newestSeen = s.changed; // (in step already: its thumbnail remade once if it was made from an older copy, as a pull before this kept the old one)
        if (old && old.serverChanged === s.changed) { if (old.thumbFrom !== s.changed && (old.png || old.svg)) { try { const t = await thumbOf(old.png ? URL.createObjectURL(old.png) : svgUrl(old.svg)); old.thumb = t.thumb; old.thumbFrom = s.changed; await tx('items', 'readwrite', (st) => req(st.put(old))); thumbs.push(old); } catch (e) { /* unreadable */ } } continue; }
        if (!old && (skip.has(s.id) || gone.has(s.id))) continue;
        // changed here and on the server too: the newer one wins (a change here older than the server's copy gives way)
        if (old && old.changed && Date.parse(old.edited || old.added || 0) >= Date.parse(s.changed || 0)) continue;
        if (!old) { fresh.push(s); continue; }
        // (a picture here as data only: its data again; one here with its files: those again too)
        if (old.remote) { old.why = await whyOf(old, s, null, null); note(s, old); } else { progress(n, total, 'files'); await take(s, old); }
      }
    }
    // new on the server: brought down only when they are few (a big collection there, an archive of thousands, is browsed
    // on the server a page at a time: brought into this browser it would be too much for the page)
    for (const s of fresh) note(s, null).why = 'new on the server (its details; the picture comes when it is used)';
    // (the data saved a few hundred to a transaction: thousands, one by one, would take minutes)
    for (let i = 0; i < datas.length; i += 500) { const part = datas.slice(i, i + 500); await tx('items', 'readwrite', (st) => Promise.all(part.map((x) => req(st.put(x))))); progress(Math.min(datas.length, i + 500), datas.length, 'save'); }
    // (a whole pull: pictures here that the server had but no longer has were deleted there, from another machine: they go here too)
    const removed = []; if (!q && !since && category === undefined && seen.size === total) { for (const [sid, it] of here) if (!seen.has(sid)) removed.push(it); if (removed.length) await remove(removed.map((it) => it.id)); }
    changed(); return { made, updated, thumbs, total, missing, removed, leftNew, newest: newestSeen };
  }
  // deleting: from the server too (queued until the server answers; Sync sends what is left), or from this browser only
  // (remembered, so Sync and Get do not bring it back; keeping it again from the server forgets that)
  async function notHere(add, drop) { let s = new Set((await meta('notHere')) || []); if (add) add.forEach((x) => s.add(x)); if (drop) drop.forEach((x) => s.delete(x)); if (add || drop) await meta('notHere', [...s]); return s; }
  async function sendDeletes() {
    const q = (await meta('deleteQueue')) || []; let n = 0; if (!q.length) return 0;
    for (const id of [...q]) { try { await call('/api/items/' + id, { method: 'DELETE' }); n++; } catch (e) { if (!/No such item/.test(e.message)) { await meta('deleteQueue', q); throw e; } } q.splice(q.indexOf(id), 1); await meta('deleteQueue', q); }
    return n;
  }
  // the server's SVG of one of its pictures taken away (it did not match the PNG)
  async function dropServerSvg(id) { return call('/api/items/' + encodeURIComponent(id), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ svg: null }) }); }
  async function deleteOnServer(ids) { await meta('deleteQueue', [...new Set([...((await meta('deleteQueue')) || []), ...ids])]); return sendDeletes(); }
  async function deleteItems(items, { server = false } = {}) {
    const ids = items.filter((it) => it.serverId).map((it) => it.serverId);
    if (ids.length && server) await meta('deleteQueue', [...new Set([...((await meta('deleteQueue')) || []), ...ids])]); else if (ids.length) await notHere(ids);
    await remove(items.map((it) => it.id)); if (!ids.length || !server) return { sent: 0, waiting: 0 };
    try { const sent = await sendDeletes(); return { sent, waiting: 0 }; } catch (e) { return { sent: 0, waiting: ((await meta('deleteQueue')) || []).length, error: e }; }
  }
  async function removeFromServer(items) { for (const it of items) if (it.serverId) { try { await call('/api/items/' + it.serverId, { method: 'DELETE' }); } catch (e) { if (!/No such item/.test(e.message)) throw e; } delete it.serverId; delete it.links; await tx('items', 'readwrite', (st) => req(st.put(it))); } changed(); }

  // the category, style and form lists (editable; shared by every Craft app through the store)
  async function lists(value) { return meta('lists', value); }
  // the user's corrections the AI learns from: [{ id (the picture's), vec, name, category, style, form, at }]
  async function lessons(value) { return value === undefined ? (await meta('lessons')) || [] : meta('lessons', value); }
  // the original IDs of every picture on the server (a big archive skips those it has), read a page of 5,000 at a time
  async function serverOriginals() { const out = new Set(); for (let off = 0; ; off += 5000) { const r = await call(`/api/items?limit=5000&offset=${off}`); r.items.forEach((x) => x.original && out.add(x.original)); if (!r.items.length || off + r.items.length >= r.total) break; } return out; }
  window.CraftClipart = { files, serverOriginals, tell: () => changed(), zip, DB, lists, lessons, server, serverKey, serverInfo, push, pull, pending, forgetPending, guard, removeFromServer, deleteItems, deleteOnServer, sendDeletes, notHere, all, get, put, remove, add, makeItem, fromZip, toZip, toFolder, fromFolder, pickFolder, folder, onChange: (f) => { listeners.add(f); return () => listeners.delete(f); }, svgUrl, unzip, stampPng, stampSvg, coreSum, sumsOf, svgMatch, traceMatched, pixelsOfItem, dropServerSvg, MATCH, svgUnits, scaleFor, svgPng, TARGET };
})();
