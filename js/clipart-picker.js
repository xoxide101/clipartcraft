/* Clip art for any Craft app (window.CraftClipartPicker): a window that shows the clip-art library and hands the
   picture chosen to the app, as a file (each app puts it where its own "insert picture" would). Every Craft app keeps
   its own copy of this file (the same as clipartcraft/js/clipart-picker.js).
   Where the pictures come from:
     - the clip-art server (the one ClipArtCraft is connected to, or one beside this app on the same website): browsed
       straight from the server (its thumbnails); only the picture chosen is fetched, nothing else is copied
     - this browser's library (IndexedDB 'craft-clipart', the store every Craft app shares)
     - My pictures: pictures you keep for every Craft app (from any app, or a picture file), kept as data: in this browser
       (IndexedDB 'craft-pictures') and, logged in, in your account (AccountCraft data 'pictures', one key a picture), so
       they follow you to any computer. Never loose files on a server.
   CraftClipartPicker.open({ app, svg: true, onPick(pic) })
     pic = { name, file (a File: the SVG when svg is true and there is one, else the PNG), png: Blob, svg: string | null,
             width, height, category, style, tags }
   CraftClipartPicker.keep({ name, file, from, source }) → the kept picture (My pictures)      .mine() → the list      .forget(id)
     source: the app's own working file, to change it again later (like a PSD): { app, name, type, text }; the picture
     (file) is kept with it for looking and for other apps
   CraftClipartPicker.keepAsk({ name, from, png: async () => Blob, svg?: async () => Blob, source?: async () => { name, type, text }, pick? })
     asks how to keep it: a picture (PNG), SVG (vector, every detail), or the working file (with a picture of it)
   open({ …, onSource(source) }): a kept working file made by this app gets "Open it here" */
(function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // ------------------------------------------------------------------ this browser's library (read only)
  let dbp = null;
  const db = () => (dbp = dbp || new Promise((ok, no) => { const r = indexedDB.open('craft-clipart', 1); r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('items')) d.createObjectStore('items', { keyPath: 'id' }); if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta'); }; r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }));
  // this browser's own pictures only (big sets are kept in books, ids starting "!": browsed on the server instead)
  const readMain = async () => { const d = await db(); return new Promise((ok, no) => { const q = d.transaction('items', 'readonly').objectStore('items').getAll(IDBKeyRange.lowerBound('"')); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); }); };
  const read = async (store, key) => { const d = await db(); return new Promise((ok, no) => { const t = d.transaction(store, 'readonly'), s = t.objectStore(store), q = key === undefined ? s.getAll() : s.get(key); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); }); };
  // ------------------------------------------------------------------ the server
  const tidy = (u) => String(u || '').trim().replace(/\/+$/, '');
  async function answers(u) { try { const c = new AbortController(), t = setTimeout(() => c.abort(), 2500), r = await fetch(u + '/api/info', { signal: c.signal }); clearTimeout(t); const j = await r.json(); return !!(j && j.server); } catch (e) { return false; } }
  // the one ClipArtCraft uses (kept in the shared library), else one beside this app on its website
  async function findServer() {
    const tries = []; try { const s = tidy(await read('meta', 'server')); if (s) tries.push(s); } catch (e) { /* no library yet */ }
    if (/^https?:$/.test(location.protocol)) tries.push(tidy(new URL('../clipartcraft/server/clipart-server.php', location.href).href), tidy(new URL('server/clipart-server.php', location.href).href));
    for (const u of tries) if (await answers(u)) return u;
    return '';
  }
  // your Craft login (AccountCraft), for a clip-art server on the same website as your account: it shows what your login
  // may see there (your own pictures, your companies' and locations'), as set in AccountCraft
  const loginFor = (u) => { try { const A = window.CraftAccount, s = JSON.parse(localStorage.getItem('craft-account') || 'null'); if (!A || !A.user || !A.user() || !s || !s.token) return null; return new URL(u, location.href).origin === new URL(A.server(), location.href).origin ? { token: s.token, name: (A.user() || {}).name || '' } : null; } catch (e) { return null; } };
  // the key ClipArtCraft is connected with (kept in the shared library), sent to that same server: pictures only for me show too
  async function keyFor(u) { const h = {}, L = loginFor(u); if (L) h['x-craft-token'] = L.token; try { if (tidy(await read('meta', 'server')) === tidy(u)) { const k = await read('meta', 'serverKey'); if (k) h['x-craft-key'] = k; } } catch (e) { /* no library yet */ } return Object.keys(h).length ? { headers: h } : {}; }
  async function serverItems(u, q, category, offset) { const r = await fetch(`${u}/api/items?limit=120&offset=${offset || 0}&q=${encodeURIComponent(q || '')}${category ? `&category=${encodeURIComponent(category)}` : ''}`, await keyFor(u)); if (!r.ok) throw new Error('The server did not answer.'); return r.json(); }
  async function serverCats(u) { try { return (await (await fetch(u + '/api/categories', await keyFor(u))).json()).filter((c) => c.category); } catch (e) { return []; } }

  // ------------------------------------------------------------------ My pictures (every Craft app's, kept as data)
  let pdb = null;
  const picDb = () => (pdb = pdb || new Promise((ok, no) => { const r = indexedDB.open('craft-pictures', 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('items')) r.result.createObjectStore('items', { keyPath: 'id' }); }; r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }));
  const picTx = async (mode, fn) => { const d = await picDb(); return new Promise((ok, no) => { const t = d.transaction('items', mode), q = fn(t.objectStore('items')); t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error); }); };
  const acct = () => { const A = window.CraftAccount; return A && A.user && A.user() ? A : null; };
  const toData = (blob) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r.readAsDataURL(blob); });
  // a picture as data: an SVG as it is (up to 300 KB: sharp at any size), else a PNG at most 1000 pixels across
  async function asData(file) {
    if (/svg/.test(file.type) && file.size < 300000) return { data: await toData(file), w: 0, h: 0 };
    const u = URL.createObjectURL(file);
    try { const img = new Image(); img.src = u; await img.decode(); const n = Math.max(img.naturalWidth, img.naturalHeight) || 1000, k = Math.min(1, 1000 / n), c = document.createElement('canvas'); c.width = Math.max(1, Math.round((img.naturalWidth || 1000) * k)); c.height = Math.max(1, Math.round((img.naturalHeight || 1000) * k)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return { data: c.toDataURL('image/png'), w: c.width, h: c.height }; }
    finally { URL.revokeObjectURL(u); }
  }
  // your pictures: this browser's and your account's together (the newest of each); this browser's only ones go up
  async function mine() {
    const here = await picTx('readonly', (s) => s.getAll()).catch(() => []) || [], all = new Map(here.map((p) => [p.id, p])), A = acct();
    if (A) { try { const r = await A.all('pictures'); const there = new Set();
      for (const [id, v] of Object.entries(r || {})) { const p = v && v.value; if (!p || !p.data) continue; there.add(id); const o = all.get(id); if (!o || (p.saved || '') > (o.saved || '')) { all.set(id, p); picTx('readwrite', (s) => s.put(p)).catch(() => {}); } }
      for (const p of here) if (!there.has(p.id) && !p.gone) A.put('pictures', p.id, p).catch(() => {}); } catch (e) { /* not now */ } }
    return [...all.values()].filter((p) => !p.gone).sort((a, b) => (b.saved || '').localeCompare(a.saved || ''));
  }
  async function keep({ name, file, from = '', source = null }) {
    const d = await asData(file), p = { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: String(name || file.name || 'Picture').replace(/\.\w+$/, ''), from, ...d, ...(source ? { source: { app: source.app || from, name: source.name || '', type: source.type || 'application/json', text: String(source.text || '') } } : {}), saved: new Date().toISOString() };
    await picTx('readwrite', (s) => s.put(p)); const A = acct();
    if (A) { if (JSON.stringify(p).length > 3900000) throw new Error('Kept in this browser only: it is more than your account takes at once (4 MB).');
      await A.put('pictures', p.id, p).catch((e) => { throw new Error(e.status === 413 ? 'Kept in this browser only: it is too big for your account.' : 'Kept in this browser; your account did not answer (it goes up next time).'); }); }
    return p;
  }
  // how to keep it: a picture, SVG (vector), or the working file (to change it again in the app that made it)
  function keepAsk({ name = 'Picture', from = '', png, svg, source, pick } = {}) {
    return new Promise((done) => {
      const opts = [svg && ['svg', 'SVG: vector, every detail', 'Sharp at any size; other apps can still change its shapes and colours.'], png && ['png', 'Picture (PNG)', 'A plain picture, as it looks now.'], source && ['source', `Working file: change it again in ${from || 'the app'}`, `The ${from || 'app'} file with everything in it (like a PSD), kept with a picture of it. Open it here again later, or save it as a file.`]].filter(Boolean);
      const first = pick && opts.some((o) => o[0] === pick) ? pick : opts[0][0];
      const back = document.createElement('div'); back.className = 'craft-clip'; back.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.5)';
      back.innerHTML = `<form role="dialog" aria-modal="true" aria-label="Keep in My pictures" style="width:min(460px,100%);display:grid;gap:10px;padding:16px;border-radius:12px;border:1px solid var(--line,#555);background:var(--panel,#222);color:var(--fg,#eee);font:14px system-ui,sans-serif">
        <b style="font-size:16px">Keep in My pictures</b><small style="opacity:.75">Every Craft app has My pictures (Clip art › My pictures)${acct() ? ', in your account on any computer' : ', in this browser'}.</small>
        <label style="display:grid;gap:3px">Name<input data-n value="${esc(name)}" style="padding:7px 9px;border-radius:7px;border:1px solid var(--line,#555);background:var(--panel-2,#2a2a2a);color:inherit;font:inherit"></label>
        ${opts.map(([k, l, t]) => `<label style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;padding:8px;border-radius:8px;border:1px solid var(--line,#555);cursor:pointer"><input type="radio" name="how" value="${k}" ${k === first ? 'checked' : ''} style="grid-row:span 2"><b>${esc(l)}</b><small style="opacity:.75">${esc(t)}</small></label>`).join('')}
        <small data-msg style="min-height:1.2em;color:#f87171"></small>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-a="no" class="btn outline">Cancel</button><button class="btn primary">Keep</button></div></form>`;
      const shut = (r) => { back.remove(); done(r); };
      back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-a=no]')) shut(null); });
      back.addEventListener('keydown', (e) => { if (e.key === 'Escape') shut(null); });
      back.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault(); const how = back.querySelector('input[name=how]:checked').value, nm = back.querySelector('[data-n]').value.trim() || name, b = back.querySelector('form button:not([type])'), msg = back.querySelector('[data-msg]');
        b.disabled = true; b.textContent = 'Keeping…';
        try {
          let p;
          if (how === 'svg') { const s = await svg(); p = await keep({ name: nm, file: new File([s], nm + '.svg', { type: 'image/svg+xml' }), from }); }
          else if (how === 'png') { const g = await png(); p = await keep({ name: nm, file: new File([g], nm + '.png', { type: g.type || 'image/png' }), from }); }
          else { const [g, src] = await Promise.all([(svg && !png ? svg() : png()), source()]); p = await keep({ name: nm, file: new File([g], nm + (/svg/.test(g.type) ? '.svg' : '.png'), { type: g.type || 'image/png' }), from, source: { app: from, ...src } }); }
          shut(p);
        } catch (x) { b.disabled = false; b.textContent = 'Keep'; msg.textContent = x.message || String(x); if (/^Kept in this browser/.test(msg.textContent)) { b.textContent = 'Close'; b.disabled = false; b.onclick = (ev) => { ev.preventDefault(); shut({}); }; } }
      });
      (document.body || document.documentElement).append(back); back.querySelector('[data-n]').select();
    });
  }
  async function forget(id) { await picTx('readwrite', (s) => s.delete(id)).catch(() => {}); const A = acct(); if (A) await A.remove('pictures', id).catch(() => {}); }

  // ------------------------------------------------------------------ the window
  function open({ app = 'Craft', svg: takesSvg = true, onPick, onSource, tab } = {}) {
    let source = tab === 'mine' || tab === 'local' ? tab : 'server', server = '', q = '', cat = '', items = [], total = 0, cats = [], chosen = null, localAll = null, timer = 0, minePics = null;
    const back = document.createElement('div'); back.className = 'craft-clip'; back.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;box-sizing:border-box;z-index:2147483000;display:grid;place-items:center;grid-template-rows:100%;padding:16px;background:rgba(0,0,0,.5)';
    const shut = () => back.remove();
    back.innerHTML = `<div role="dialog" aria-modal="true" aria-label="Clip art" style="width:min(1100px,100%);height:min(760px,calc(100vh - 32px));min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:10px;padding:16px;border-radius:12px;border:1px solid var(--line,#555);background:var(--panel,#222);color:var(--fg,#eee);font:14px system-ui,sans-serif">
      <div style="display:flex;align-items:center;gap:10px"><b style="font-size:16px">Clip art</b><span data-where style="opacity:.75;font-size:12.5px;flex:1"></span><button type="button" data-a="close" class="btn outline">Close</button></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><div role="tablist" data-src style="display:flex;gap:4px"></div>
        <input data-q type="search" placeholder="Search names, tags, styles…" style="flex:1;min-width:180px;padding:7px 10px;border-radius:7px;border:1px solid var(--line,#555);background:var(--panel-2,#2a2a2a);color:inherit;font:inherit">
        <select data-cat style="padding:7px 8px;border-radius:7px;border:1px solid var(--line,#555);background:var(--panel-2,#2a2a2a);color:inherit;font:inherit"></select></div>
      <div data-body style="display:grid;grid-template-columns:1fr 260px;gap:12px;min-height:0"><div data-grid style="overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;align-content:start;padding-right:4px"></div>
        <div data-side style="overflow:auto;display:grid;align-content:start;gap:8px;padding:10px;border-radius:9px;background:var(--panel-2,#2a2a2a)"></div></div>
      <div style="display:flex;gap:8px;align-items:center"><span data-count style="opacity:.75;font-size:12.5px;flex:1"></span><button type="button" data-a="addfile" class="btn outline" hidden>Add a picture file…</button><button type="button" data-a="more" class="btn outline" hidden>More</button><button type="button" data-a="insert" class="btn primary" disabled>Insert</button></div></div>`;
    // phones and tablets: one column (the picture's details under the pictures), the whole screen, finger-sized buttons
    if (!document.getElementById('craft-clip-css')) { const st = document.createElement('style'); st.id = 'craft-clip-css'; st.textContent = '.craft-clip{height:100dvh!important;overscroll-behavior:contain}.craft-clip [role=dialog]{height:min(760px,calc(100dvh - 32px))!important}'
      + '@media(max-width:700px){.craft-clip{padding:6px!important}.craft-clip [role=dialog]{height:calc(100dvh - 12px)!important;padding:10px!important;gap:8px!important}.craft-clip [data-body]{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr) auto}.craft-clip [data-side]{max-height:30vh;grid-template-columns:96px 1fr;align-items:start}.craft-clip [data-side]>div:first-child{height:96px!important}.craft-clip [data-side] img{max-height:96px!important}.craft-clip [data-grid]{grid-template-columns:repeat(auto-fill,minmax(84px,1fr))!important}.craft-clip [data-grid] button{grid-template-rows:72px auto!important}.craft-clip input,.craft-clip select{font-size:16px!important}}'
      + '@media(pointer:coarse){.craft-clip button,.craft-clip select,.craft-clip input{min-height:40px}}'; document.head.append(st); }
    const $ = (s) => back.querySelector(s), check = 'repeating-conic-gradient(#d9dbe3 0 25%, #fff 0 50%) 0 0 / 12px 12px';
    const tile = (it, i) => `<button type="button" data-i="${i}" title="${esc(it.name)}${it.style ? ' · ' + esc(it.style) : ''}" style="display:grid;grid-template-rows:96px auto;gap:4px;padding:6px;border-radius:8px;border:2px solid ${chosen === it ? 'var(--accent,#7c6cf0)' : 'transparent'};background:var(--panel-2,#2a2a2a);color:inherit;cursor:pointer;font:12px system-ui,sans-serif"><span style="display:grid;place-items:center;border-radius:6px;background:${check};overflow:hidden"><img loading="lazy" src="${esc(it.thumbUrl)}" alt="" style="max-width:100%;max-height:96px"></span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.name)}</span></button>`;
    function drawGrid() { $('[data-grid]').innerHTML = items.length ? items.map(tile).join('') : `<p style="opacity:.75;grid-column:1/-1">${source === 'mine' ? 'No pictures kept yet. <b>Add a picture file…</b> keeps one here; on the clip-art server, <b>Keep in My pictures</b> keeps the one chosen.' : source === 'server' && !server ? 'No clip-art server answers: connect one in ClipArtCraft (Server › Connect…), or choose This browser.' : 'Nothing found.'}</p>`; $('[data-count]').textContent = items.length ? `${items.length} of ${total} picture${total === 1 ? '' : 's'} · double-click one to insert it` : ''; $('[data-a=more]').hidden = !(source === 'server' && items.length < total); $('[data-a=addfile]').hidden = source !== 'mine'; }
    function drawSide() {
      const s = $('[data-side]'); $('[data-a=insert]').disabled = !chosen; if (!chosen) { s.innerHTML = '<p style="opacity:.75;margin:0">Choose a picture.</p>'; return; }
      const sib = items.filter((x) => x !== chosen && x.subject && x.subject === chosen.subject && x.from === chosen.from);
      s.innerHTML = `<div style="display:grid;place-items:center;height:200px;border-radius:8px;background:${check}"><img src="${esc(chosen.thumbUrl)}" alt="" style="max-width:100%;max-height:200px"></div><b>${esc(chosen.name)}</b>
        <small style="opacity:.8">${[chosen.category, chosen.style, chosen.width && `${chosen.width} × ${chosen.height} px`, chosen.hasSvg ? 'PNG and SVG' : 'PNG'].filter(Boolean).map(esc).join(' · ')}</small>
        ${chosen.pic && chosen.pic.source ? `<div style="display:grid;gap:6px;padding:8px;border-radius:8px;border:1px solid var(--line,#555)"><small><b>Working file</b> from ${esc(chosen.pic.source.app)}: everything in it, to change it again</small>${onSource && chosen.pic.source.app === app ? `<button type="button" data-a="opensrc" class="btn primary">Open it here (in ${esc(app)})</button>` : ''}<button type="button" data-a="savesrc" class="btn outline">Save the working file…</button></div>` : ''}
        ${chosen.pic ? '<button type="button" data-a="forget" class="btn outline">Remove from My pictures</button>' : '<button type="button" data-a="keepit" class="btn outline">Keep in My pictures</button>'}
        ${(chosen.tags || []).length ? `<small style="opacity:.7">${esc(chosen.tags.slice(0, 10).join(', '))}</small>` : ''}
        ${sib.length ? `<div><small style="opacity:.8">Same DNA / style</small><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${sib.map((x) => `<button type="button" data-i="${items.indexOf(x)}" title="${esc(x.name)}" style="width:52px;height:52px;padding:2px;border-radius:6px;border:1px solid var(--line,#555);background:${check};cursor:pointer"><img src="${esc(x.thumbUrl)}" alt="" style="max-width:100%;max-height:100%"></button>`).join('')}</div></div>` : ''}`;
    }
    const subjectOf = (it) => String(it.original || it.name || '').replace(/\s*[–-]\s.*$/, '').replace(/_\d{3,}$/, '').trim().toLowerCase();
    async function load(more) {
      if (source === 'mine') {
        minePics = minePics || await mine(); const words = q.toLowerCase().split(/\s+/).filter(Boolean);
        items = minePics.filter((p) => (!cat || p.from === cat) && words.every((w) => (p.name + ' ' + (p.from || '')).toLowerCase().includes(w))).map((p) => ({ name: p.name, category: (p.from ? 'From ' + p.from : '') + (p.source ? ' · working file' : ''), tags: [], width: p.w, height: p.h, thumbUrl: p.data, data: p.data, pic: p, hasSvg: /^data:image\/svg/.test(p.data), from: '' }));
        total = items.length; if (!items.includes(chosen)) chosen = null; drawGrid(); drawSide(); return;
      }
      if (source === 'server') {
        if (!server) { items = []; total = 0; drawGrid(); return; }
        const r = await serverItems(server, q, cat, more ? items.length : 0), got = r.items.map((it) => ({ name: it.name, category: it.category, style: it.style, tags: it.tags || [], width: it.width, height: it.height, original: it.original, thumbUrl: (it.links || {}).thumb || (it.links || {}).png, pngUrl: (it.links || {}).png, svgUrl: (it.links || {}).svg, hasSvg: !!(it.links || {}).svg, from: it.source || '' }));
        got.forEach((it) => { it.subject = subjectOf(it); }); items = more ? [...items, ...got] : got; total = r.total;
      } else {
        localAll = localAll || (await readMain()).filter((it) => it.png || it.svg || it.links).map((it) => ({ name: it.name, category: it.category, style: it.style, tags: it.tags || [], width: it.width, height: it.height, original: it.original, thumbUrl: it.thumb, item: it, hasSvg: !!it.svg, from: it.collection || it.sheet || it.source || '' }));
        const words = q.toLowerCase().split(/\s+/).filter(Boolean);
        items = localAll.filter((it) => (!cat || it.category === cat) && words.every((w) => [it.name, it.category, it.style, it.tags.join(' ')].join(' ').toLowerCase().includes(w))).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        items.forEach((it) => { it.subject = subjectOf(it); }); total = items.length;
      }
      if (!items.includes(chosen)) chosen = null; drawGrid(); drawSide();
    }
    async function drawTabs() {
      const nLocal = (await read('items').catch(() => [])).length;
      const nMine = (minePics || []).length;
      $('[data-src]').innerHTML = [['server', `Clip-art server${server ? '' : ' (none)'}`], ['mine', `My pictures${minePics ? ` (${nMine})` : ''}`], ['local', `This browser (${nLocal})`]].map(([k, l]) => `<button type="button" role="tab" data-s="${k}" aria-selected="${source === k}" class="btn ${source === k ? 'primary' : 'outline'}">${l}</button>`).join('');
      $('[data-where]').textContent = source === 'mine' ? (acct() ? 'Pictures you keep for every Craft app: in your account, on any computer.' : 'Pictures you keep for every Craft app (in this browser; log in to have them everywhere).') : source === 'server' ? (server ? `From ${server.replace(/^https?:\/\//, '').replace(/\/clipart-server\.php$/, '')}${loginFor(server) ? ` as ${loginFor(server).name || 'you'} (what your login may see)` : ''}: only the picture you insert is fetched.` : 'No server found.') : 'The library kept in this browser (ClipArtCraft).';
      const cl = source === 'mine' ? [...new Set((minePics || []).map((p) => p.from).filter(Boolean))].sort().map((c) => [c, 'From ' + c]) : source === 'server' ? cats.map((c) => [c.category, `${c.category} (${c.n})`]) : [...new Set((localAll || []).map((it) => it.category).filter(Boolean))].sort().map((c) => [c, c]);
      $('[data-cat]').innerHTML = `<option value="">All categories</option>${cl.map(([v, l]) => `<option value="${esc(v)}" ${v === cat ? 'selected' : ''}>${esc(l)}</option>`).join('')}`;
    }
    // the picture chosen, fetched (server) or read (this browser), handed to the app
    async function insert() {
      if (!chosen) return; const b = $('[data-a=insert]'); b.disabled = true; b.textContent = 'Getting it…';
      try {
        let png = null, svg = null;
        if (chosen.data) { const b = await (await fetch(chosen.data)).blob(); if (/svg/.test(b.type)) { svg = await b.text(); } else png = b; if (svg && !takesSvg) { png = await svgToPng(svg); } }
        else if (chosen.item) { png = chosen.item.png || null; svg = chosen.item.svg || null; const l = chosen.item.links || {}; if (!png && !svg) { if (l.png) png = await (await fetch(l.png)).blob(); if (takesSvg && l.svg) { try { const r = await fetch(l.svg); if (r.ok) svg = await r.text(); } catch (e) { /* the PNG will do */ } } } } // (one here as its data only: its files from the server)
        else { if (chosen.pngUrl) png = await (await fetch(chosen.pngUrl)).blob(); if (takesSvg && chosen.svgUrl) { try { const r = await fetch(chosen.svgUrl); if (r.ok) svg = await r.text(); } catch (e) { /* the PNG will do */ } } }
        if (!png && svg && !takesSvg) png = await svgToPng(svg);
        const safe = chosen.name.replace(/[\\/:*?"<>|]+/g, '-'), file = takesSvg && svg ? new File([svg], safe + '.svg', { type: 'image/svg+xml' }) : new File([png], safe + '.png', { type: 'image/png' });
        shut(); onPick && onPick({ name: chosen.name, file, png, svg, source: (chosen.pic && chosen.pic.source) || null, width: chosen.width, height: chosen.height, category: chosen.category, style: chosen.style, tags: chosen.tags });
      } catch (e) { console.error(e); b.disabled = false; b.textContent = 'Insert'; $('[data-count]').textContent = 'Getting the picture failed: ' + (e.message || e); }
    }
    back.addEventListener('click', async (e) => {
      if (e.target === back || e.target.closest('[data-a=close]')) return shut();
      const s = e.target.closest('[data-s]'); if (s) { source = s.dataset.s; cat = ''; chosen = null; await drawTabs(); await load(); return; }
      const t = e.target.closest('[data-i]'); if (t) { chosen = items[+t.dataset.i]; drawGrid(); drawSide(); return; }
      if (e.target.closest('[data-a=more]')) return load(true);
      if (e.target.closest('[data-a=addfile]')) { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true; i.onchange = async () => { for (const f of i.files) { try { await keep({ name: f.name, file: f, from: app }); } catch (x) { $('[data-count]').textContent = x.message; } } minePics = null; await load(); await drawTabs(); }; i.click(); return; }
      if (e.target.closest('[data-a=opensrc]') && chosen && chosen.pic && chosen.pic.source) { const s = chosen.pic.source; shut(); onSource(s); return; }
      if (e.target.closest('[data-a=savesrc]') && chosen && chosen.pic && chosen.pic.source) { const s = chosen.pic.source, a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s.text], { type: s.type || 'application/json' })); a.download = s.name || (chosen.name + '.json'); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return; }
      if (e.target.closest('[data-a=forget]') && chosen && chosen.pic) { if (!confirm(`Remove “${chosen.name}” from My pictures (every Craft app)?`)) return; await forget(chosen.pic.id); minePics = null; chosen = null; await load(); await drawTabs(); return; }
      if (e.target.closest('[data-a=keepit]') && chosen) { const b = e.target.closest('[data-a=keepit]'); b.disabled = true; b.textContent = 'Keeping…';
        try { const f = chosen.item ? (chosen.item.svg ? new Blob([chosen.item.svg], { type: 'image/svg+xml' }) : chosen.item.png) : await (await fetch(chosen.svgUrl || chosen.pngUrl)).blob(); await keep({ name: chosen.name, file: new File([f], chosen.name + (/svg/.test(f.type) ? '.svg' : '.png'), { type: f.type }), from: 'Clip art' }); minePics = null; b.textContent = 'Kept in My pictures ✓'; drawTabs(); }
        catch (x) { b.disabled = false; b.textContent = 'Keep in My pictures'; $('[data-count]').textContent = 'Could not keep it: ' + (x.message || x); } return; }
      if (e.target.closest('[data-a=insert]')) return insert();
    });
    back.addEventListener('dblclick', (e) => { const t = e.target.closest('[data-grid] [data-i]'); if (t) { chosen = items[+t.dataset.i]; insert(); } });
    back.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { q = e.target.value; clearTimeout(timer); timer = setTimeout(() => load(), 250); } });
    back.addEventListener('change', (e) => { if (e.target.matches('[data-cat]')) { cat = e.target.value; load(); } });
    back.addEventListener('keydown', (e) => { if (e.key === 'Escape') shut(); if (e.key === 'Enter' && chosen && !e.target.matches('[data-q]')) insert(); });
    (document.body || document.documentElement).append(back); $('[data-q]').focus();
    (async () => { $('[data-count]').textContent = 'Looking for the clip-art server…'; server = await findServer(); if (server) cats = await serverCats(server); else if (source === 'server') source = 'local'; await drawTabs(); await load(); })().catch((e) => { console.error(e); $('[data-count]').textContent = 'The clip art could not be read: ' + (e.message || e); });
  }
  // an SVG drawn as a PNG (for an app that takes pictures only)
  async function svgToPng(svg) { const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); try { const img = new Image(); img.src = u; await img.decode(); const w = img.naturalWidth || 512, h = img.naturalHeight || 512, k = Math.max(1, 1024 / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return await new Promise((ok) => c.toBlob(ok, 'image/png')); } finally { URL.revokeObjectURL(u); } }
  window.CraftClipartPicker = { open, keep, keepAsk, mine, forget };
})();
