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
  async function put(item) { await tx('items', 'readwrite', (s) => req(s.put(item))); changed(); return item; }
  async function remove(ids) { await tx('items', 'readwrite', (s) => Promise.all([].concat(ids).map((id) => req(s.delete(id))))); changed(); }
  async function meta(key, value) { return value === undefined ? tx('meta', 'readonly', (s) => req(s.get(key))) : tx('meta', 'readwrite', (s) => req(s.put(value, key))); }

  // a picture as a small thumbnail and its size
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('That picture could not be read.')); i.src = src; });
  async function thumbOf(src) { const i = await loadImg(src), k = Math.min(1, 160 / Math.max(i.naturalWidth, i.naturalHeight)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(i.naturalWidth * k)); c.height = Math.max(1, Math.round(i.naturalHeight * k)); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(i, 0, 0, c.width, c.height); return { thumb: c.toDataURL('image/png'), width: i.naturalWidth, height: i.naturalHeight }; }
  const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
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
  async function fromZip(file, opts = {}) { return fromEntries(await unzip(new Uint8Array(await file.arrayBuffer())), { source: file.name, ...opts }); }
  const safe = (s) => String(s).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'item';
  async function entriesOf(items) {
    const files = [], list = [], enc = new TextEncoder(), used = new Set();
    for (const it of items) { let base = safe(it.name), k = 2; while (used.has(base.toLowerCase())) base = `${safe(it.name)} ${k++}`; used.add(base.toLowerCase());
      const e = { name: it.name, category: it.category || '', tags: it.tags || [], width: it.width, height: it.height };
      if (it.png) { files.push({ name: `${base}.png`, bytes: new Uint8Array(await it.png.arrayBuffer()) }); e.png = `${base}.png`; }
      if (it.svg) { files.push({ name: `${base}.svg`, bytes: enc.encode(it.svg) }); e.svg = `${base}.svg`; }
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
  const META = ['type', 'name', 'original', 'seen', 'matched', 'category', 'style', 'form', 'tags', 'description', 'kind', 'width', 'height', 'frames', 'colours', 'source', 'author', 'licence', 'hash'];
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
  async function push(items, progress = () => {}) { return guard(() => pushNow(items, progress)); }
  async function pushNow(items, progress) {
    const out = []; let n = 0, left = new Set([...((await meta('pushQueue')) || []), ...items.map((it) => it.id)]);
    await meta('pushQueue', [...left]);
    for (const it of items) {
      const j = Object.fromEntries(META.filter((k) => it[k] !== undefined).map((k) => [k, it[k]]));
      if (it.png) { j.png = await b64(it.png); j.pngExt = it.png.type === 'image/jpeg' ? 'jpg' : 'png'; }
      if (it.svg) j.svg = it.svg; if (it.anim) { j.anim = await b64(it.anim); j.animExt = (it.anim.type.split('/')[1] || 'gif').replace('apng', 'png'); }
      if (it.thumb) { j.thumb = it.thumb.replace(/^data:[^,]*,/, ''); j.thumbExt = 'png'; }
      let s; try { s = await call(it.serverId ? '/api/items/' + it.serverId : '/api/items', { method: it.serverId ? 'PATCH' : 'POST', body: JSON.stringify(j) }); } catch (e) { if (!it.serverId || !/No such item/.test(e.message)) throw e; delete it.serverId; s = await call('/api/items', { method: 'POST', body: JSON.stringify(j) }); }
      it.serverId = s.id; it.links = s.links; it.name = s.name; it.serverChanged = s.changed; await tx('items', 'readwrite', (st) => req(st.put(it))); out.push(it); progress(++n, items.length);
      left.delete(it.id); await meta('pushQueue', [...left]);
    }
    changed(); return out;
  }
  // bring the server's items into this browser (ones already here are updated if the server's copy is newer)
  async function pull(progress = () => {}, opts = {}) { return guard(() => pullNow(progress, opts)); }
  async function pullNow(progress, { q = '', category } = {}) {
    // (a picture the server lists but cannot hand over, its file missing there, is skipped and counted, not the end of it)
    const here = new Map((await all()).filter((it) => it.serverId).map((it) => [it.serverId, it])), made = [], missing = [], skip = await notHere(), gone = new Set((await meta('deleteQueue')) || []), seen = new Set(); let n = 0, total = 0;
    for (let off = 0; ; off += 500) {
      const r = await call(`/api/items?limit=500&offset=${off}&q=${encodeURIComponent(q)}${category !== undefined ? '&category=' + encodeURIComponent(category) : ''}`); total = r.total; if (!r.items.length) break;
      for (const s of r.items) {
        const old = here.get(s.id); seen.add(s.id); progress(++n, total); if ((old && old.serverChanged === s.changed) || (!old && (skip.has(s.id) || gone.has(s.id)))) continue;
        const get = async (k) => { if (!s.links[k]) return null; const r = await fetch(s.links[k]); return r.ok ? r.blob() : null; };
        let png = null, svg = null, anim = null; try { png = await get('png'); if (s.links.svg) { const r = await fetch(s.links.svg); if (r.ok) svg = await r.text(); } anim = await get('anim'); } catch (e) { /* counted below */ }
        if (!png && !svg) { missing.push(s.name); continue; }
        const it = old || { id: uid(), added: s.added || new Date().toISOString() };
        Object.assign(it, Object.fromEntries(META.map((k) => [k, s[k] ?? it[k] ?? (k === 'tags' ? [] : '')])), { png, svg, anim, serverId: s.id, links: s.links, serverChanged: s.changed, source: s.source || 'clip-art server' });
        try { if (!it.thumb || !old) it.thumb = (await thumbOf(png ? URL.createObjectURL(png) : svgUrl(svg))).thumb; } catch (e) { missing.push(s.name); continue; }
        await tx('items', 'readwrite', (st) => req(st.put(it))); made.push(it);
      }
    }
    // (a whole pull: pictures here that the server had but no longer has were deleted there, from another machine: they go here too)
    const removed = []; if (!q && category === undefined && seen.size === total) { for (const [sid, it] of here) if (!seen.has(sid)) removed.push(it); if (removed.length) await remove(removed.map((it) => it.id)); }
    changed(); return { made, total, missing, removed };
  }
  // deleting: from the server too (queued until the server answers; Sync sends what is left), or from this browser only
  // (remembered, so Sync and Get do not bring it back; keeping it again from the server forgets that)
  async function notHere(add, drop) { let s = new Set((await meta('notHere')) || []); if (add) add.forEach((x) => s.add(x)); if (drop) drop.forEach((x) => s.delete(x)); if (add || drop) await meta('notHere', [...s]); return s; }
  async function sendDeletes() {
    const q = (await meta('deleteQueue')) || []; let n = 0; if (!q.length) return 0;
    for (const id of [...q]) { try { await call('/api/items/' + id, { method: 'DELETE' }); n++; } catch (e) { if (!/No such item/.test(e.message)) { await meta('deleteQueue', q); throw e; } } q.splice(q.indexOf(id), 1); await meta('deleteQueue', q); }
    return n;
  }
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
  window.CraftClipart = { DB, lists, lessons, server, serverKey, serverInfo, push, pull, pending, forgetPending, guard, removeFromServer, deleteItems, deleteOnServer, sendDeletes, notHere, all, get, put, remove, add, makeItem, fromZip, toZip, toFolder, fromFolder, pickFolder, folder, onChange: (f) => { listeners.add(f); return () => listeners.delete(f); }, svgUrl, unzip };
})();
