/* ClipArtCraft – a big archive (window.ClipArtArchive): a ZIP of thousands of pictures (Microsoft's old Office clip-art
   archive: 57,015 SVGs, 2.2 GB) read without loading it: only its table of contents first (the end of the file, ZIP64
   too), then each picture straight from its place in the file, in chunks of 200 (stored or deflated).
   Each SVG is kept as the master with a small thumbnail (no big PNG: it is drawn when something needs it). Names, tags
   and the original ID come from the file names (Microsoft's: "keyword,keyword,…,MC900326838.svg"). Progress is kept:
   the same archive chosen again carries on where it stopped, and pictures already here (by their ID) are skipped.
     open(file | { folder, files }, { toast, categories, server (bool), done(madeCount, where) })
   A folder chosen (its files and their paths) goes the same way: folder names become tags. Before anything it says how
   big it is and how many; how many at a time is chosen; while it runs a strip at the bottom shows what is being done, how
   many of how many, how fast and how long is left (it keeps going when the window is hidden). */
(function () {
  'use strict';
  const L = window.CraftClipart;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const CHUNK = 200, KINDS = /\.(svg|png|jpe?g|gif|webp)$/i;
  const u8 = async (file, at, n) => new Uint8Array(await file.slice(at, at + n).arrayBuffer());

  // ------------------------------------------------------------------ the table of contents
  async function contents(file) {
    const tail = Math.min(file.size, 65557 + 20), end = await u8(file, file.size - tail, tail), dv = new DataView(end.buffer);
    let e = -1; for (let i = end.length - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; } if (e < 0) throw new Error('This is not a ZIP file (no table of contents at its end).');
    let count = dv.getUint16(e + 10, true), size = dv.getUint32(e + 12, true), off = dv.getUint32(e + 16, true);
    // ZIP64: the real numbers are in the ZIP64 end record, found through its locator just before
    if ((count === 0xffff || off === 0xffffffff || size === 0xffffffff) && e >= 20 && dv.getUint32(e - 20, true) === 0x07064b50) {
      const at = Number(dv.getBigUint64(e - 20 + 8, true)), z = new DataView((await u8(file, at, 56)).buffer); count = Number(z.getBigUint64(32, true)); size = Number(z.getBigUint64(40, true)); off = Number(z.getBigUint64(48, true)); }
    const cd = await u8(file, off, size), cv = new DataView(cd.buffer), dec = new TextDecoder(), out = [];
    for (let p = 0, n = 0; n < count && p + 46 <= cd.length; n++) {
      if (cv.getUint32(p, true) !== 0x02014b50) break;
      const flags = cv.getUint16(p + 8, true), method = cv.getUint16(p + 10, true); let csize = cv.getUint32(p + 20, true), usize = cv.getUint32(p + 24, true);
      const nl = cv.getUint16(p + 28, true), xl = cv.getUint16(p + 30, true), cl = cv.getUint16(p + 32, true); let at = cv.getUint32(p + 42, true);
      const name = (flags & 0x800 ? dec : new TextDecoder('latin1')).decode(cd.subarray(p + 46, p + 46 + nl));
      // (ZIP64 sizes and place, in the extra field)
      if (csize === 0xffffffff || usize === 0xffffffff || at === 0xffffffff) for (let q = p + 46 + nl; q + 4 <= p + 46 + nl + xl; ) { const id = cv.getUint16(q, true), len = cv.getUint16(q + 2, true); if (id === 1) { let r = q + 4; if (usize === 0xffffffff) { usize = Number(cv.getBigUint64(r, true)); r += 8; } if (csize === 0xffffffff) { csize = Number(cv.getBigUint64(r, true)); r += 8; } if (at === 0xffffffff) at = Number(cv.getBigUint64(r, true)); } q += 4 + len; }
      if (!name.endsWith('/') && KINDS.test(name)) out.push({ name, method, csize, usize, at });
      p += 46 + nl + xl + cl;
    }
    return out;
  }
  // one file's bytes, straight from its place in the archive
  async function bytesOf(file, e) {
    if (e.file) return new Uint8Array(await e.file.arrayBuffer()); // (a folder's file)
    const h = await u8(file, e.at, 30), hv = new DataView(h.buffer); if (hv.getUint32(0, true) !== 0x04034b50) throw new Error('A damaged entry.');
    const data = await u8(file, e.at + 30 + hv.getUint16(26, true) + hv.getUint16(28, true), e.csize);
    if (e.method === 0) return data; if (e.method !== 8) throw new Error('A packing this cannot read.');
    return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  }
  // a picture's name, tags and ID from its file name: Microsoft's "keyword,keyword,…,MC900326838.svg", or a plain name
  const GENERIC = new Set(['symbols', 'symbol', 'text', 'texts', 'icons', 'icon', 'cartoons', 'concepts', 'businesses', 'people', 'academic', 'academics', 'special occasions', 'illustrations']);
  function nameOf(path) {
    const base = path.replace(/^.*\//, '').replace(/\.[^.]+$/, ''), parts = base.split(',').map((x) => x.replace(/_+/g, ' ').trim()).filter(Boolean);
    const id = parts.length > 1 && /^[A-Z]{2}\d{5,}$/i.test(parts[parts.length - 1]) ? parts.pop() : '';
    if (parts.length < 2) { const n = (parts[0] || base).replace(/[_-]+/g, ' ').trim(); return { name: n.charAt(0).toUpperCase() + n.slice(1), tags: [], id }; }
    const first = parts.find((x) => /[a-z]{2}/i.test(x) && !GENERIC.has(x.toLowerCase())) || parts[0];
    return { name: first.charAt(0).toUpperCase() + first.slice(1), tags: [...new Set(parts.map((x) => x.toLowerCase()).filter((x) => x !== first.toLowerCase()))].slice(0, 20), id };
  }

  // ------------------------------------------------------------------ the window
  // A ZIP (a File) or a folder ({ folder: name, files: [File…] }, from a folder chosen: each file with its path in it)
  const fmtGB = (n) => (n >= 1073741824 ? `${(n / 1073741824).toFixed(2)} GB` : n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  const fmtTime = (s) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : s >= 90 ? `${Math.round(s / 60)} min` : `${Math.max(1, Math.round(s))} s`);
  let strip = null;
  async function open(arg, o = {}) {
    const folder = !(arg instanceof Blob), title = folder ? arg.folder : arg.name;
    const files = folder ? (arg.files || []).filter((f) => KINDS.test(f.name)) : null, total = folder ? files.reduce((a, f) => a + f.size, 0) : arg.size;
    const KEY = folder ? `clipartcraft-archive:folder:${title}:${files.length}:${total}` : `clipartcraft-archive:${arg.name}:${arg.size}`; let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { /* blocked */ }
    const ms = /svgs|office|microsoft/i.test(title);
    const S = { which: 'all', first: 200, chunk: 200, words: '', privacy: 'me', source: ms ? 'Microsoft Office clip art' : title.replace(/\.zip$/i, ''), licence: ms ? 'For use with Microsoft Office documents' : '', category: '', send: false, where: o.server ? 'server' : 'here', ...saved.S }; if (!o.server) S.where = 'here';
    const what = folder ? 'a folder' : 'an archive';
    const back = document.createElement('div'); back.className = 'lists-dlg arc'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-label', `Import ${what}`);
    back.innerHTML = `<div class="lists-in arc-in"><div class="lists-head"><b>Import ${what}</b><span class="grow"></span><span class="hint">${esc(title)} · ${fmtGB(total)}</span></div><p class="hint">${folder ? 'Looking through the folder…' : 'Reading its table of contents…'}</p></div>`;
    document.body.append(back);
    let list; try { list = folder ? files.map((f) => ({ name: f.webkitRelativePath || f.name, usize: f.size, file: f })) : await contents(arg); } catch (e) { back.remove(); return o.toast && o.toast(e.message); }
    if (!list.length) { back.remove(); return o.toast && o.toast(`No pictures in that ${folder ? 'folder' : 'archive'}.`); }
    // (a folder's names: the file's own, its folders as tags; Microsoft's comma names as in the archive)
    const nameFor = (e) => { const nm = nameOf(e.name); if (folder) { const dirs = e.name.split('/').slice(1, -1).map((x) => x.replace(/[_-]+/g, ' ').trim().toLowerCase()).filter(Boolean); nm.tags = [...new Set([...dirs, ...nm.tags])].slice(0, 20); if (!nm.id) nm.id = e.name; } return nm; };
    const have = new Set((await L.facts(['original'])).map((it) => it.original).filter(Boolean)), kinds = {}; list.forEach((e) => { const k = (e.name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase(); kinds[k] = (kinds[k] || 0) + 1; });
    let running = false, stop = false, done = saved.done || 0, made = 0, skipped = 0, serverHave = null, stats = null;
    const picked = () => { const w = S.words.toLowerCase().split(/\s+/).filter(Boolean); let l = list; if (S.which === 'words' && w.length) l = l.filter((e) => w.every((x) => e.name.toLowerCase().replace(/_/g, ' ').includes(x))); return S.which === 'first' ? l.slice(0, Math.max(1, +S.first || 200)) : l; };
    const sample = list.slice(0, 4).map(nameFor);
    // the status line: what is being done now, how many of how many, how fast, how much is left (here and in the strip)
    function statusLine() {
      if (!stats) return done ? `${done.toLocaleString()} looked at so far.` : '';
      const secs = (performance.now() - stats.t0) / 1000, rate = secs > 0.5 ? stats.n / secs : 0, eta = rate ? Math.max(0, stats.of - stats.at) / rate : 0;
      return `${stats.phase ? stats.phase + ' · ' : ''}${stats.now ? `now: ${stats.now} · ` : ''}${stats.at.toLocaleString()} of ${stats.of.toLocaleString()} (${stats.of ? ((100 * stats.at) / stats.of).toFixed(1) : 0}%) · ${rate ? `${rate >= 10 ? Math.round(rate) : rate.toFixed(1)} a second · ` : ''}${fmtGB(stats.bytes)} of ${fmtGB(stats.total)}${eta && running ? ` · about ${fmtTime(eta)} left` : ''} · added ${made.toLocaleString()}${skipped ? `, skipped ${skipped.toLocaleString()} (here already)` : ''}`;
    }
    function showStatus() {
      const t = statusLine(), pct = stats && stats.of ? (100 * stats.at) / stats.of : 0;
      const s = back.querySelector('.arc-say'); if (s) s.textContent = t; const b = back.querySelector('.arc-bar i'); if (b) b.style.width = pct + '%';
      if (strip && strip.owner === back) { strip.querySelector('.arc-strip-t').textContent = `${folder ? 'Folder' : 'Archive'} ${title}: ${t}`; strip.querySelector('.arc-bar i').style.width = pct + '%'; }
    }
    // the strip at the bottom of the app while it runs: it keeps going with the window hidden
    function makeStrip() {
      if (strip) strip.remove(); strip = document.createElement('div'); strip.className = 'arc-strip'; strip.owner = back;
      strip.innerHTML = '<div class="arc-bar"><i></i></div><span class="arc-strip-t"></span><button class="btn ghost sm" type="button" data-st="show">Show</button><button class="btn ghost sm" type="button" data-st="stop">Stop</button>';
      strip.addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (!b) return; if (b.dataset.st === 'show') { back.hidden = false; } else { stop = true; b.disabled = true; b.textContent = 'Stopping…'; } });
      document.body.append(strip);
    }
    function draw() {
      const p = picked(), left = p.filter((e) => !have.has(nameFor(e).id || e.name)).length, size = p.reduce((a, e) => a + (e.usize || 0), 0), off = running ? 'disabled' : '';
      back.innerHTML = `<div class="lists-in arc-in"><div class="lists-head"><b>Import ${what}</b><span class="grow"></span>${running ? '<button class="btn outline" type="button" data-a="hide" title="It keeps going: the strip at the bottom shows how it is doing">Hide (keeps going)</button><button class="btn outline" type="button" data-a="stop">Stop</button>' : '<button class="btn outline" type="button" data-a="close">Close</button>'}</div>
        <p class="arc-you">You have <b>${fmtGB(list.reduce((a, e) => a + e.usize, 0))}</b> in <b>${list.length.toLocaleString()} pictures</b> (${esc(title)}: ${Object.entries(kinds).map(([k, n]) => `${n.toLocaleString()} ${k.toUpperCase()}`).join(', ')}). ${have.size ? `${list.filter((e) => have.has(nameFor(e).id)).length.toLocaleString()} are here already.` : ''}</p>
        <p class="hint">Names and tags from the ${folder ? 'file and folder names' : 'file names'}, for example: ${sample.map((x) => `<b>${esc(x.name)}</b> (${esc(x.tags.slice(0, 4).join(', '))}${x.id && !folder ? ` · ${esc(x.id)}` : ''})`).join('; ')}.</p>
        <div class="field"><span>Which</span><div class="seg" role="group"><button class="btn" type="button" data-w="first" aria-pressed="${S.which === 'first'}" ${off}>The first</button><button class="btn" type="button" data-w="words" aria-pressed="${S.which === 'words'}" ${off}>Those with words</button><button class="btn" type="button" data-w="all" aria-pressed="${S.which === 'all'}" ${off}>All</button></div></div>
        ${S.which === 'first' ? `<label class="field"><span>How many</span><input class="input" type="number" min="1" step="100" data-s="first" value="${esc(S.first)}" ${off}></label>` : S.which === 'words' ? `<label class="field"><span>Words in their names or tags</span><input class="input" data-s="words" value="${esc(S.words)}" placeholder="cats, holidays, computers…" ${off}></label>` : ''}
        <div class="two"><p class="hint"><b>${p.length.toLocaleString()} chosen</b> (${fmtGB(size)}), ${left.toLocaleString()} not here yet.</p><label class="field"><span>How many at a time</span><select class="input" data-s="chunk" ${off}>${[50, 100, 200, 500, 1000].map((n) => `<option value="${n}" ${+S.chunk === n ? 'selected' : ''}>${n.toLocaleString()} (${Math.ceil(left / n).toLocaleString()} batches)</option>`).join('')}</select></label></div>
        <div class="two"><label class="field"><span>Who can see them</span><select class="input" data-s="privacy" ${off}><option value="me" ${S.privacy === 'me' ? 'selected' : ''}>Only me (on the server: only with your key)</option><option value="" ${S.privacy !== 'me' ? 'selected' : ''}>Everyone</option></select></label><label class="field"><span>Category</span><input class="input" data-s="category" list="arc-cats" value="${esc(S.category)}" placeholder="Not sorted yet (Sort with AI later)" ${off}><datalist id="arc-cats">${(o.categories || []).map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label></div>
        <div class="two"><label class="field"><span>Source</span><input class="input" data-s="source" value="${esc(S.source)}" ${off}></label><label class="field"><span>Licence</span><input class="input" data-s="licence" value="${esc(S.licence)}" ${off}></label></div>
        <div class="field"><span>Keep them</span><div class="seg" role="group"><button class="btn" type="button" data-k="server" aria-pressed="${S.where === 'server'}" ${!o.server ? 'disabled title="Connect to a server first (Server › Connect…)"' : off}>On the server only</button><button class="btn" type="button" data-k="here" aria-pressed="${S.where === 'here'}" ${off}>In this browser</button></div></div>
        ${S.where === 'server' ? '<p class="hint">Best for many pictures: each chunk goes straight to the server and nothing is kept in this browser; “On the server” and every app’s clip-art picker browse them a page at a time.</p>' : `${o.server ? `<label class="check"><input type="checkbox" data-s="send" ${S.send ? 'checked' : ''} ${off}> Send them to the server too, chunk by chunk</label>` : ''}${p.length > 5000 ? `<p class="hint mk-err">${p.length.toLocaleString()} kept in this browser make ClipArtCraft slow (it holds the whole library while open): the server is better for this many.</p>` : ''}`}
        <p class="hint">${(+S.chunk || CHUNK).toLocaleString()} at a time, till they are all in; an SVG is kept with a small thumbnail (its PNG is drawn when something needs it). It can be hidden (it keeps going) or stopped: choosing this ${folder ? 'folder' : 'archive'} again carries on.</p>
        <div class="arc-bar"><i style="width:${stats && stats.of ? (100 * stats.at) / stats.of : p.length ? (100 * Math.min(done, p.length)) / p.length : 0}%"></i></div><p class="hint arc-say">${esc(statusLine())}</p>
        <div class="btns"><span class="grow"></span><button class="btn primary" type="button" data-a="go" ${running || !left ? 'disabled' : ''}>${running ? 'Importing…' : done && done < p.length ? 'Carry on' : `Start processing ${left.toLocaleString()}`}</button></div></div>`;
    }
    const keepState = () => { try { localStorage.setItem(KEY, JSON.stringify({ S, done })); } catch (e) { /* blocked */ } };
    async function go() {
      running = true; stop = false; made = 0; skipped = 0; const p = picked(); if (done >= p.length) done = 0;
      stats = { t0: performance.now(), n: 0, at: done, of: p.length, bytes: p.slice(0, done).reduce((a, e) => a + (e.usize || 0), 0), total: p.reduce((a, e) => a + (e.usize || 0), 0), now: '', phase: '' };
      draw(); makeStrip(); showStatus(); let last = 0; const tick = (force) => { const t = performance.now(); if (force || t - last > 250) { last = t; showStatus(); } };
      if (S.where === 'server' && !serverHave) { stats.phase = 'asking the server what it has already'; tick(true); try { serverHave = await L.serverOriginals(); serverHave.forEach((x) => have.add(x)); } catch (e) { running = false; stats.phase = 'the server did not answer: ' + e.message; draw(); showStatus(); return; } stats.phase = ''; }
      try {
        await L.guard(async () => {
          const step = Math.max(10, +S.chunk || CHUNK);
          for (let i = done; i < p.length && !stop; i += step) {
            const part = p.slice(i, i + step), batch = [];
            // (four at a time: most of the time goes on drawing the thumbnails)
            const one = async (e) => {
              const nm = nameFor(e); stats.now = nm.name; stats.at++; stats.n++; stats.bytes += e.usize || 0; tick();
              if (have.has(nm.id || e.name)) { skipped++; return; } have.add(nm.id || e.name);
              try {
                const b = await bytesOf(arg, e), isSvg = /\.svg$/i.test(e.name);
                const it = await L.makeItem({ name: nm.name, category: S.category, tags: nm.tags, svg: isSvg ? new TextDecoder().decode(b) : null, png: isSvg ? null : new Blob([b], { type: /\.jpe?g$/i.test(e.name) ? 'image/jpeg' : /\.gif$/i.test(e.name) ? 'image/gif' : /\.webp$/i.test(e.name) ? 'image/webp' : 'image/png' }), source: S.source });
                Object.assign(it, { type: 'clipart', original: nm.id || e.name.replace(/^.*\//, ''), privacy: S.privacy === 'me' ? 'me' : '', licence: S.licence, collection: S.source, checked: false });
                if (S.where !== 'server') await L.put(it, true); batch.push(it); made++;
              } catch (err) { console.warn('Skipped', e.name, err); }
            };
            let qi = 0; await Promise.all(Array.from({ length: 4 }, async () => { while (qi < part.length && !stop) await one(part[qi++]); }));
            if (S.where === 'server' && batch.length) { stats.phase = `sending ${batch.length} to the server`; tick(true); try { await L.push(batch, () => {}, { here: false }); } catch (err) { stop = true; made -= batch.length; stats.phase = `sending stopped: ${err.message}`; break; } stats.phase = ''; }
            else L.tell();
            done = Math.min(p.length, i + part.length); keepState(); tick(true);
            if (S.where !== 'server' && S.send && o.server && batch.length) { try { await L.push(batch); } catch (err) { stats.phase = `sending stopped (${err.message}): they are here; Sync sends the rest later`; S.send = false; } }
          }
        });
      } finally { running = false; }
      stats.now = ''; if (!stats.phase) stats.phase = stop ? `stopped: choose this ${folder ? 'folder' : 'archive'} again to carry on` : 'done';
      keepState(); draw(); showStatus();
      if (strip && strip.owner === back) { const st = strip, sb = st.querySelector('[data-st=stop]'); if (sb) sb.remove(); setTimeout(() => { if (strip === st) { st.remove(); strip = null; } }, back.hidden ? 15000 : 4000); }
      if (o.done && made) o.done(made, S.where);
    }
    back.addEventListener('click', (e) => {
      if (e.target.closest('[data-a=close]')) { back.remove(); return; }
      if (e.target.closest('[data-a=hide]')) { back.hidden = true; showStatus(); return; }
      const sb = e.target.closest('[data-a=stop]'); if (sb) { stop = true; sb.disabled = true; sb.textContent = 'Stopping…'; return; }
      const kk = e.target.closest('[data-k]'); if (kk && !running && !kk.disabled) { S.where = kk.dataset.k; keepState(); draw(); return; }
      const w = e.target.closest('[data-w]'); if (w && !running) { S.which = w.dataset.w; done = 0; keepState(); draw(); return; }
      if (e.target.closest('[data-a=go]') && !running) go();
    });
    back.addEventListener('change', (e) => { const k = e.target.dataset.s; if (!k || running) return; S[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; if (['first', 'words', 'chunk'].includes(k)) done = 0; keepState(); draw(); });
    draw();
  }
  window.ClipArtArchive = { open, contents, nameOf };
})();
