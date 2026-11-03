/* ClipArtCraft – a big archive (window.ClipArtArchive): a ZIP of thousands of pictures (Microsoft's old Office clip-art
   archive: 57,015 SVGs, 2.2 GB) read without loading it: only its table of contents first (the end of the file, ZIP64
   too), then each picture straight from its place in the file, in chunks of 200 (stored or deflated).
   Each SVG is kept as the master with a small thumbnail (no big PNG: it is drawn when something needs it). Names, tags
   and the original ID come from the file names (Microsoft's: "keyword,keyword,…,MC900326838.svg"). Progress is kept:
   the same archive chosen again carries on where it stopped, and pictures already here (by their ID) are skipped.
     open(file, { toast, categories, server (bool), done(madeCount) }) */
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
  async function open(file, o = {}) {
    const KEY = `clipartcraft-archive:${file.name}:${file.size}`; let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { /* blocked */ }
    const S = { which: 'first', first: 200, words: '', privacy: 'me', source: /svgs|office|microsoft/i.test(file.name) ? 'Microsoft Office clip art' : file.name.replace(/\.zip$/i, ''), licence: /svgs|office|microsoft/i.test(file.name) ? 'For use with Microsoft Office documents' : '', category: '', send: false, where: o.server ? 'server' : 'here', ...saved.S }; if (!o.server) S.where = 'here';
    const back = document.createElement('div'); back.className = 'lists-dlg arc'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-label', 'Import an archive');
    back.innerHTML = `<div class="lists-in arc-in"><div class="lists-head"><b>Import an archive</b><span class="grow"></span><span class="hint">${esc(file.name)} · ${(file.size / 1073741824).toFixed(2)} GB</span></div><p class="hint">Reading its table of contents…</p></div>`;
    document.body.append(back);
    let list; try { list = await contents(file); } catch (e) { back.remove(); return o.toast && o.toast(e.message); }
    if (!list.length) { back.remove(); return o.toast && o.toast('No pictures in that archive.'); }
    const have = new Set((await L.all()).map((it) => it.original).filter(Boolean)), kinds = {}; list.forEach((e) => { const k = (e.name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase(); kinds[k] = (kinds[k] || 0) + 1; });
    let running = false, stop = false, done = saved.done || 0, made = 0, serverHave = null;
    const picked = () => { const w = S.words.toLowerCase().split(/\s+/).filter(Boolean); let l = list; if (S.which === 'words' && w.length) l = l.filter((e) => w.every((x) => e.name.toLowerCase().replace(/_/g, ' ').includes(x))); return S.which === 'first' ? l.slice(0, Math.max(1, +S.first || 200)) : l; };
    const sample = list.slice(0, 4).map((e) => nameOf(e.name));
    function draw() {
      const p = picked(), left = p.filter((e) => !have.has(nameOf(e.name).id || e.name)).length;
      back.innerHTML = `<div class="lists-in arc-in"><div class="lists-head"><b>Import an archive</b><span class="grow"></span><button class="btn outline" type="button" data-a="close">${running ? 'Stop and close' : 'Close'}</button></div>
        <p><b>${list.length.toLocaleString()} pictures</b> in ${esc(file.name)} (${Object.entries(kinds).map(([k, n]) => `${n.toLocaleString()} ${k.toUpperCase()}`).join(', ')}), ${(list.reduce((a, e) => a + e.usize, 0) / 1073741824).toFixed(2)} GB. ${have.size ? `${list.filter((e) => have.has(nameOf(e.name).id)).length.toLocaleString()} are here already.` : ''}</p>
        <p class="hint">Names and tags from the file names, for example: ${sample.map((s) => `<b>${esc(s.name)}</b> (${esc(s.tags.slice(0, 4).join(', '))}${s.id ? ` · ${esc(s.id)}` : ''})`).join('; ')}.</p>
        <div class="field"><span>Which</span><div class="seg" role="group"><button class="btn" type="button" data-w="first" aria-pressed="${S.which === 'first'}">The first</button><button class="btn" type="button" data-w="words" aria-pressed="${S.which === 'words'}">Those with words</button><button class="btn" type="button" data-w="all" aria-pressed="${S.which === 'all'}">All</button></div></div>
        ${S.which === 'first' ? `<label class="field"><span>How many</span><input class="input" type="number" min="1" step="100" data-s="first" value="${esc(S.first)}"></label>` : S.which === 'words' ? `<label class="field"><span>Words in their names or tags</span><input class="input" data-s="words" value="${esc(S.words)}" placeholder="cats, holidays, computers…"></label>` : ''}
        <p class="hint">${p.length.toLocaleString()} chosen, ${left.toLocaleString()} not here yet.</p>
        <div class="two"><label class="field"><span>Who can see them</span><select class="input" data-s="privacy"><option value="me" ${S.privacy === 'me' ? 'selected' : ''}>Only me (on the server: only with your key)</option><option value="" ${S.privacy !== 'me' ? 'selected' : ''}>Everyone</option></select></label><label class="field"><span>Category</span><input class="input" data-s="category" list="arc-cats" value="${esc(S.category)}" placeholder="Not sorted yet (Sort with AI later)"><datalist id="arc-cats">${(o.categories || []).map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label></div>
        <div class="two"><label class="field"><span>Source</span><input class="input" data-s="source" value="${esc(S.source)}"></label><label class="field"><span>Licence</span><input class="input" data-s="licence" value="${esc(S.licence)}"></label></div>
        <div class="field"><span>Keep them</span><div class="seg" role="group"><button class="btn" type="button" data-k="server" aria-pressed="${S.where === 'server'}" ${o.server ? '' : 'disabled title="Connect to a server first (Server › Connect…)"'}>On the server only</button><button class="btn" type="button" data-k="here" aria-pressed="${S.where === 'here'}">In this browser</button></div></div>
        ${S.where === 'server' ? '<p class="hint">Best for a big archive: each chunk goes straight to the server and nothing is kept in this browser; “On the server” and every app’s clip-art picker browse them a page at a time.</p>' : `${o.server ? `<label class="check"><input type="checkbox" data-s="send" ${S.send ? 'checked' : ''}> Send them to the server too, chunk by chunk</label>` : ''}${p.length > 5000 ? `<p class="hint mk-err">${p.length.toLocaleString()} kept in this browser make ClipArtCraft slow (it holds the whole library while open): the server is better for this many.</p>` : ''}`}
        <p class="hint">Each is kept as its SVG with a small thumbnail (a PNG is drawn when something needs it), ${CHUNK} at a time. It can be stopped: choosing this archive again carries on.</p>
        <div class="arc-bar"><i style="width:${p.length ? Math.round((100 * Math.min(done, p.length)) / p.length) : 0}%"></i></div><p class="hint arc-say">${running ? 'Working…' : done ? `${done.toLocaleString()} looked at so far.` : ''}</p>
        <div class="btns"><span class="grow"></span><button class="btn primary" type="button" data-a="go" ${running || !left ? 'disabled' : ''}>${running ? 'Importing…' : done && done < p.length ? 'Carry on' : `Import ${left.toLocaleString()}`}</button></div></div>`;
    }
    const keepState = () => { try { localStorage.setItem(KEY, JSON.stringify({ S, done })); } catch (e) { /* blocked */ } };
    async function go() {
      running = true; stop = false; made = 0; const p = picked(); draw(); const say = (t, k) => { const s = back.querySelector('.arc-say'); if (s) s.textContent = t; const b = back.querySelector('.arc-bar i'); if (b) b.style.width = Math.round((100 * k) / p.length) + '%'; };
      if (done >= p.length) done = 0;
      if (S.where === 'server' && !serverHave) { say('Asking the server what it has already…', done); try { serverHave = await L.serverOriginals(); serverHave.forEach((x) => have.add(x)); } catch (e) { running = false; draw(); return say('The server did not answer: ' + e.message, done); } }
      try {
        await L.guard(async () => {
          for (let i = done; i < p.length && !stop; i += CHUNK) {
            const part = p.slice(i, i + CHUNK), batch = [];
            // (four at a time: most of the time goes on drawing the thumbnails)
            const one = async (e) => {
              const nm = nameOf(e.name); if (have.has(nm.id || e.name)) return; have.add(nm.id || e.name);
              try {
                const b = await bytesOf(file, e), isSvg = /\.svg$/i.test(e.name);
                const it = await L.makeItem({ name: nm.name, category: S.category, tags: nm.tags, svg: isSvg ? new TextDecoder().decode(b) : null, png: isSvg ? null : new Blob([b], { type: /\.jpe?g$/i.test(e.name) ? 'image/jpeg' : /\.gif$/i.test(e.name) ? 'image/gif' : /\.webp$/i.test(e.name) ? 'image/webp' : 'image/png' }), source: S.source });
                Object.assign(it, { type: 'clipart', original: nm.id || e.name.replace(/^.*\//, ''), privacy: S.privacy === 'me' ? 'me' : '', licence: S.licence, collection: S.source, checked: false });
                if (S.where !== 'server') await L.put(it, true); batch.push(it); made++;
              } catch (err) { console.warn('Skipped', e.name, err); }
            };
            let qi = 0; await Promise.all(Array.from({ length: 4 }, async () => { while (qi < part.length && !stop) await one(part[qi++]); }));
            if (S.where === 'server' && batch.length) { say(`Sending ${batch.length} to the server…`, done); try { await L.push(batch, () => {}, { here: false }); } catch (err) { stop = true; made -= batch.length; say(`Sending stopped: ${err.message}. Choose this archive again to carry on.`, done); break; } }
            else L.tell();
            done = Math.min(p.length, i + part.length); keepState(); say(`${done.toLocaleString()} of ${p.length.toLocaleString()} looked at · ${made.toLocaleString()} added${S.send && o.server ? ' · sending…' : ''}`, done);
            if (S.where !== 'server' && S.send && o.server && batch.length) { try { await L.push(batch); } catch (err) { say(`Sending stopped (${err.message}): they are here; Sync sends the rest later.`, done); S.send = false; } }
          }
        });
      } finally { running = false; }
      keepState(); draw(); say(stop ? `Stopped at ${done.toLocaleString()} of ${p.length.toLocaleString()}: choose this archive again to carry on.` : `Done: ${made.toLocaleString()} added.`, done);
      if (o.done && made) o.done(made, S.where);
    }
    back.addEventListener('click', (e) => {
      if (e.target.closest('[data-a=close]')) { if (running) { stop = true; } back.remove(); return; }
      const kk = e.target.closest('[data-k]'); if (kk && !running && !kk.disabled) { S.where = kk.dataset.k; keepState(); draw(); return; }
      const w = e.target.closest('[data-w]'); if (w && !running) { S.which = w.dataset.w; done = 0; keepState(); draw(); return; }
      if (e.target.closest('[data-a=go]') && !running) go();
    });
    back.addEventListener('change', (e) => { const k = e.target.dataset.s; if (!k) return; S[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; if (['first', 'words'].includes(k)) done = 0; keepState(); if (!running) draw(); });
    draw();
  }
  window.ClipArtArchive = { open, contents, nameOf };
})();
