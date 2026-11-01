/* ClipArtCraft: the shared clip-art library of the Craft apps. Add pictures and SVGs (or a library ZIP from ImageCraft's
   Split a sheet), name them, sort them into categories, tag them, find them, and export or sync the library. Every Craft
   app reads the same library (js/library.js says how). */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id), L = window.CraftClipart, I = window.CraftIcons, WA = window.CraftWork;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let startOpen = false, items = [], work = [], cat = '*', query = '', sel = new Set(), last = null, size = 140, serverUrl = '', serverOk = false;
  try { size = +localStorage.getItem('clipartcraft-size') || 140; } catch (e) { /* blocked storage */ }
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3200); };
  const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  const fail = (e) => { console.error(e); toast(String(e && e.message || e)); };

  // ------------------------------------------------------------------ what is shown
  const cats = () => { const m = new Map(); items.forEach((it) => { const c = it.category || ''; m.set(c, (m.get(c) || 0) + 1); }); return [...m].sort((a, b) => (a[0] === '' ? 1 : b[0] === '' ? -1 : a[0].localeCompare(b[0]))); };
  const shown = () => { const q = query.trim().toLowerCase(); const words = q.split(/\s+/).filter(Boolean); if (cat === '#work') return work.filter((w) => words.every((x) => w.name.toLowerCase().includes(x))); return items.filter((it) => (cat === '*' || (it.category || '') === cat) && words.every((x) => [it.name, (it.tags || []).join(' '), it.category, it.style, it.form, it.kind === 'bw' ? 'black and white' : it.kind, it.anim ? 'animated animation' : '', it.description].join(' ').toLowerCase().includes(x))).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })); };
  async function reload() { items = await L.all(); work = WA ? await WA.all() : []; [...sel].forEach((id) => { if (!items.some((it) => it.id === id)) sel.delete(id); }); render(); }
  function render() {
    const C = cats(); const catBtn = ([k, l, n]) => `<button type="button" class="cat" data-cat="${esc(k)}" aria-current="${cat === k}"><span>${esc(l)}</span><b>${n}</b></button>`;
    $('cats').innerHTML = [['*', 'All clip art', items.length], ...C.map(([c, n]) => [c, c || 'No category', n])].map(catBtn).join('') + `<div class="work-head">Working area</div>` + catBtn(['#work', 'Files imported from', work.length]);
    const S = shown(), g = $('grid'); g.style.setProperty('--tile', size + 'px');
    g.innerHTML = cat === '#work' ? S.map((w) => `<button type="button" class="tile" role="option" data-id="${w.id}" aria-selected="${sel.has(w.id)}" title="${esc(w.fileName)}"><span class="pic">${w.thumb ? `<img src="${w.thumb}" alt="" loading="lazy">` : ''}</span><span class="nm">${esc(w.name)}</span>${w.used ? `<i class="used">${w.used} made</i>` : ''}<i class="fmt">${esc((w.fileName.split('.').pop() || '').toUpperCase())}</i></button>`).join('') : S.map((it) => `<button type="button" class="tile" role="option" data-id="${it.id}" aria-selected="${sel.has(it.id)}" title="${esc(it.name)}${it.category ? ' · ' + esc(it.category) : ''}"><span class="pic"><img src="${it.thumb}" alt="" loading="lazy"></span><span class="nm">${esc(it.name)}</span>${it.anim ? '<i class="fmt">▶</i>' : it.svg ? '<i class="fmt">SVG</i>' : ''}</button>`).join('');
    const showIt = startOpen || (!items.length && cat !== '#work'); $('start').hidden = !showIt; if (showIt) renderStart();
    renderDetails(); status();
  }
  function renderStart() {
    $('start').innerHTML = `<div class="start-in"><h2>What do you want to do?</h2>${items.length ? `<p class="hint">${items.length} picture${items.length === 1 ? '' : 's'} in the library. <button class="btn outline" type="button" data-act="start-close">Back to the library</button></p>` : ''}<div class="tiles">
      <button type="button" data-act="add"><b>Import pictures</b><small>Any picture files: PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, TIFF, SVG, animations and classic formats. Named for you, cropped, black and white made see-through</small></button>
      <button type="button" data-act="slice"><b>Slice a montage</b><small>A sheet of clip art cut into separate pictures, named and added</small></button>
      <button type="button" data-act="zip"><b>Import a library ZIP</b><small>From ImageCraft’s Split a sheet, or one exported here</small></button>
      <button type="button" data-act="folder-in"><b>Open a library folder</b><small>A folder with library.json and its pictures (backup, or shared from another computer)</small></button></div>
      <p class="hint">The library is kept in this browser and shared with every Craft app opened in it. Nothing is uploaded.</p></div>`;
  }
  function renderDetails() {
    if (cat === '#work') return renderWork();
    const d = $('details'), S = items.filter((it) => sel.has(it.id));
    if (!S.length) { d.innerHTML = `<div class="props-head">Library</div><div class="sec"><p class="hint"><b>${items.length}</b> item${items.length === 1 ? '' : 's'} in ${cats().length} categor${cats().length === 1 ? 'y' : 'ies'}.</p><p class="hint">Click a picture to see it and name it; Ctrl-click or Shift-click picks several (to give them a category together).</p></div>`; return; }
    const one = S.length === 1 ? S[0] : null, catList = cats().map(([c]) => c).filter(Boolean);
    d.innerHTML = `<div class="props-head">${one ? 'Clip art' : `${S.length} chosen`}</div><div class="sec">
      ${one ? `<div class="big check-bg"><img src="${one.anim ? URL.createObjectURL(one.anim) : one.svg ? L.svgUrl(one.svg) : URL.createObjectURL(one.png)}" alt=""></div>
      <label class="field"><span>Name</span><input class="input" data-f="name" value="${esc(one.name)}"></label>` : `<div class="many">${S.slice(0, 12).map((it) => `<img src="${it.thumb}" alt="">`).join('')}</div>`}
      <label class="field"><span>Category</span><input class="input" data-f="category" list="catlist" value="${esc(one ? one.category : (new Set(S.map((x) => x.category)).size === 1 ? S[0].category : ''))}" placeholder="Americana, Buildings, Transport…"><datalist id="catlist">${catList.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
      ${one ? `<div class="two"><label class="field"><span>Style</span><input class="input" data-f="style" list="stylelist" value="${esc(one.style || '')}"></label><label class="field"><span>Form</span><input class="input" data-f="form" list="formlist" value="${esc(one.form || '')}"></label></div><datalist id="stylelist">${(window.CraftNamer ? CraftNamer.STYLES : []).map((c) => `<option value="${esc(c)}">`).join('')}</datalist><datalist id="formlist">${(window.CraftNamer ? CraftNamer.FORMS : []).map((c) => `<option value="${esc(c)}">`).join('')}</datalist>` : ''}
      <label class="field"><span>Tags <small class="hint">(separated by commas)</small></span><input class="input" data-f="tags" value="${esc(one ? (one.tags || []).join(', ') : '')}" placeholder="${one ? 'farm, red, barn' : 'added to each'}"></label>
      ${one ? `<p class="hint">${one.width} × ${one.height} pixels · ${[one.png ? 'PNG' : '', one.svg ? 'SVG' : '', one.anim ? `moving (${one.frames || '?'} frames)` : ''].filter(Boolean).join(', ')}${one.kind === 'bw' ? ' · black and white' : one.kind === 'grey' ? ' · grey' : ''}${one.source ? ` · from ${esc(one.source)}` : ''}</p>
      ${one.links ? `<div class="links"><span class="hint">On the server:</span>${Object.entries(one.links).filter(([k]) => k !== 'thumb').map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener" title="${esc(u)}">${k.toUpperCase()}</a><button type="button" class="btn ghost sm" data-copy="${esc(u)}" title="Copy the link">Copy link</button>`).join('')}</div>` : ''}
      <div class="btns">${one.png ? '<button class="btn outline" type="button" data-act="dl-png">PNG</button>' : ''}${one.anim ? '<button class="btn outline" type="button" data-act="dl-anim">Animation</button>' : ''}${one.svg ? '<button class="btn outline" type="button" data-act="dl-svg">SVG</button>' : ''}<button class="btn outline" type="button" data-act="copy">Copy</button></div>` : ''}
      <div class="btns"><button class="btn outline" type="button" data-act="export-sel">Export ${one ? 'it' : 'these'} (ZIP)</button><button class="btn outline danger" type="button" data-act="delete">Delete</button></div></div>`;
  }
  // the working area: the files clip art came from (kept until deleted)
  function renderWork() {
    const d = $('details'), S = work.filter((w) => sel.has(w.id)), one = S.length === 1 ? S[0] : null, usedN = work.filter((w) => w.used).length;
    if (!S.length) { d.innerHTML = `<div class="props-head">Working area</div><div class="sec"><p class="hint">The sheets and files clip art was imported from, kept so they can be sliced or imported again. Delete them when you are done with them; the clip art made from them stays.</p><p class="hint"><b>${work.length}</b> file${work.length === 1 ? '' : 's'} · ${usedN} used.</p>${usedN ? `<button class="btn outline danger" type="button" data-act="work-del-used">Delete the ${usedN} used file${usedN === 1 ? '' : 's'}</button>` : ''}</div>`; return; }
    d.innerHTML = `<div class="props-head">${one ? 'File' : `${S.length} files`}</div><div class="sec">
      ${one ? `<div class="big check-bg">${one.thumb ? `<img src="${one.thumb}" alt="">` : ''}</div><p class="hint"><b>${esc(one.fileName)}</b><br>${one.width || '?'} × ${one.height || '?'} pixels · ${Math.round(one.size / 1024)} KB · kept ${new Date(one.added).toLocaleDateString()}<br>${one.used ? `${one.used} picture${one.used === 1 ? '' : 's'} made from it` : 'Nothing made from it yet'}</p>
      <div class="btns"><button class="btn primary" type="button" data-act="work-import">Import again</button><button class="btn outline" type="button" data-act="work-slice">Slice it</button><button class="btn outline" type="button" data-act="work-dl">Save the file</button></div>` : `<div class="many">${S.slice(0, 12).map((w) => `<img src="${w.thumb}" alt="">`).join('')}</div><div class="btns"><button class="btn primary" type="button" data-act="work-import">Import them again</button></div>`}
      <div class="btns"><button class="btn outline danger" type="button" data-act="work-del">Delete ${one ? 'it' : 'them'}</button></div></div>`;
  }
  function status() { const S = shown(); $('status').innerHTML = `<span><b>${items.length}</b> in the library</span><span>${cat === '*' && !query ? '' : `<b>${S.length}</b> shown`}</span><span>${sel.size ? `<b>${sel.size}</b> chosen` : ''}</span><span class="grow"></span><span title="${esc(serverUrl)}">${serverUrl ? `Server: <b>${serverOk ? 'connected' : 'not answering'}</b> · ${items.filter((it) => it.serverId).length} on it` : 'No server'}</span><label class="hint">Size <input type="range" id="size" min="80" max="260" value="${size}" aria-label="Thumbnail size"></label>`; $('size').oninput = (e) => { size = +e.target.value; $('grid').style.setProperty('--tile', size + 'px'); try { localStorage.setItem('clipartcraft-size', size); } catch (err) { /* blocked */ } }; }

  // ------------------------------------------------------------------ actions
  function pick(accept, multiple = true) { return new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = multiple; i.onchange = () => ok([...i.files]); i.click(); }); }
  async function addFiles(files, how = 'Added') { if (!files.length) return; try { const made = await L.add(files, { category: cat !== '*' ? cat : '' }); await reload(); sel = new Set(made.map((m) => m.id)); render(); toast(`${how}: ${made.length} item${made.length === 1 ? '' : 's'}.`); } catch (e) { fail(e); } }
  const chosen = () => items.filter((it) => sel.has(it.id));
  // the Montage Slicer (js/slicer.js): what it added is shown and chosen
  const slicer = (file) => window.ClipArtSlicer.open({ file, toast, categories: cats().map(([c]) => c).filter(Boolean), done: async (made, category, sheetFile) => {
    await reload(); offerResume(); cat = category; sel = new Set(made.map((m) => m.id)); render(); toast(`${made.length} picture${made.length === 1 ? '' : 's'} added to “${category}”.`); } });
  // Import pictures (js/importer.js): what it added is shown and chosen
  const importer = (files) => window.ClipArtImporter.open({ files, toast, server: !!serverUrl && serverOk, categories: cats().map(([c]) => c).filter(Boolean), done: async (made) => { await reload(); offerResume(); cat = '*'; sel = new Set(made.map((m) => m.id)); render(); toast(`${made.length} picture${made.length === 1 ? '' : 's'} added to the library.`); } });
  async function act(a) {
    try {
      if (a === 'start') { startOpen = true; render(); return; }
      if (a === 'start-close') { startOpen = false; render(); return; }
      if (a === 'add') return importer([]);
      if (a === 'add-plain') return addFiles(await pick('image/*,.svg,.zip'));
      if (a.startsWith('work-')) {
        const S = work.filter((w) => sel.has(w.id));
        if (a === 'work-del-used') { const U = work.filter((w) => w.used); if (!confirm(`Delete ${U.length} used file${U.length === 1 ? '' : 's'} from the working area? (The clip art made from them stays in the library.)`)) return; await WA.remove(U.map((w) => w.id)); sel.clear(); await reload(); toast('Deleted.'); return; }
        if (!S.length) return toast('Choose a file first.');
        if (a === 'work-import') return importer(S.map(WA.fileOf));
        if (a === 'work-slice') return slicer(WA.fileOf(S[0]));
        if (a === 'work-dl') return download(S[0].file, S[0].fileName);
        if (a === 'work-del') { if (!confirm(`Delete ${S.length === 1 ? `“${S[0].fileName}”` : `${S.length} files`} from the working area? (The clip art made from ${S.length === 1 ? 'it' : 'them'} stays in the library.)`)) return; await WA.remove(S.map((w) => w.id)); sel.clear(); await reload(); toast('Deleted.'); return; }
      }
      if (a === 'zip') return addFiles(await pick('.zip', false), 'Imported');
      if (a === 'slice') return slicer();
      if (a === 'export-all') { if (!items.length) return toast('The library is empty.'); download(await L.toZip(shown()), cat === '*' ? 'Clip art library.zip' : `${cat || 'No category'} clip art.zip`); return; }
      if (a === 'export-sel') { download(await L.toZip(chosen()), chosen().length === 1 ? `${chosen()[0].name}.zip` : 'Clip art.zip'); return; }
      if (a === 'folder-out') { const n = await L.toFolder(items); toast(`Saved ${items.length} items to the folder “${n}”.`); return; }
      if (a === 'folder-in') { const made = await L.fromFolder(); await reload(); toast(`Added ${made.length} items from the folder.`); return; }
      if (a === 'folder-pick') { const h = await L.pickFolder(); toast(`Library folder: “${h.name}”.`); return; }
      if (a === 'select-all') { sel = new Set(shown().map((it) => it.id)); render(); return; }
      if (a === 'delete' && cat === '#work') return act('work-del');
      if (a === 'delete') { const S = chosen(); if (!S.length) return toast('Choose something first.'); if (!confirm(`Delete ${S.length === 1 ? `“${S[0].name}”` : `${S.length} items`} from the library? (Export first if you might want ${S.length === 1 ? 'it' : 'them'} back.)`)) return; await L.remove(S.map((x) => x.id)); sel.clear(); await reload(); toast('Deleted.'); return; }
      if (a === 'connect') { const u = prompt('The clip-art server’s address (start it with server/start-server.cmd; on a web host, the folder where clipart-server.php is):', serverUrl || 'http://localhost:8790'); if (u === null) return; await L.server(u); await checkServer(true); return; }
      if (a === 'disconnect') { await L.server(''); await checkServer(); toast('Not using a server now (the pictures stay here).'); return; }
      if (a === 'push') { const S = sel.size ? chosen() : items; if (!S.length) return toast('The library is empty.'); await need(); const done = await L.push(S, (n, t) => busy(`Sending ${n} of ${t}…`)); busy(); await reload(); toast(`Sent ${done.length} item${done.length === 1 ? '' : 's'} to the server.`); return; }
      if (a === 'resume') { await need(); const left = await L.pending(); const d = await L.push(left, (n, t) => busy(`Sending ${n} of ${t}…`)); busy(); await reload(); await offerResume(); toast(`Finished sending: ${d.length} picture${d.length === 1 ? '' : 's'}.`); return; }
      if (a === 'resume-forget') { await L.forgetPending(); await offerResume(); return; }
      if (a.startsWith('undone-go-')) { const w = undone[+a.slice(10)]; if (!w) return; return w.pending === 'slice' ? slicer(WA.fileOf(w)) : importer([WA.fileOf(w)]); }
      if (a.startsWith('undone-cancel-')) { await dropUndone(undone[+a.slice(14)]); await reload(); await offerResume(); return; }
      if (a === 'undone-flush') { if (!confirm('Clear the whole Still to do list? (Pictures waiting to be sent stay here, just not sent; files nothing was made from leave the working area.)')) return; await L.forgetPending(); for (const w of undone) await dropUndone(w); await reload(); await offerResume(); return; }
      if (a === 'pull') { await need(); const r = await L.pull((n, t) => busy(`Getting ${n} of ${t}…`)); busy(); await reload(); toast(r.made.length ? `Got ${r.made.length} new or changed item${r.made.length === 1 ? '' : 's'} from the server (it has ${r.total}).` : `Already up to date (the server has ${r.total}).`); return; }
      if (a === 'sync') { await need(); const r = await L.pull((n, t) => busy(`Getting ${n} of ${t}…`)); const fresh = (await L.all()).filter((it) => !it.serverId); const d = await L.push(fresh, (n, t) => busy(`Sending ${n} of ${t}…`)); busy(); await reload(); toast(`In step with the server: got ${r.made.length}, sent ${d.length}.`); return; }
      if (a === 'unserver') { const S = chosen().filter((it) => it.serverId); if (!S.length) return toast('Choose something that is on the server.'); if (!confirm(`Take ${S.length === 1 ? `“${S[0].name}”` : `${S.length} items`} off the server? (They stay in this library.)`)) return; await L.removeFromServer(S); await reload(); toast('Taken off the server.'); return; }
      if (a === 'open-server') { if (!serverUrl) return toast('Connect to a server first.'); window.open(serverUrl + '/', '_blank'); return; }
      const one = chosen()[0]; if (!one) return;
      if (a === 'dl-png') download(one.png, `${one.name}.png`);
      if (a === 'dl-anim') download(one.anim, `${one.name}.${(one.anim.type.split('/')[1] || 'gif').replace('apng', 'png')}`);
      if (a === 'dl-svg') download(new Blob([one.svg], { type: 'image/svg+xml' }), `${one.name}.svg`);
      if (a === 'copy') { if (one.png && navigator.clipboard && window.ClipboardItem) { await navigator.clipboard.write([new ClipboardItem({ 'image/png': one.png })]); toast('Copied the picture.'); } else if (one.svg) { await navigator.clipboard.writeText(one.svg); toast('Copied the SVG as text.'); } }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      // a server elsewhere wants its key before anything changes: ask once, keep it, try again
      if (e && e.status === 403 && !act.asked) { const k = prompt('This clip-art server needs its key to change the library (it is on the server’s setup page, …/setup):', ''); if (k) { await L.serverKey(k.trim()); act.asked = true; try { return await act(a); } finally { act.asked = false; } } }
      busy(); fail(e);
    }
  }
  // a name, category or tags changed (for one, or the category/tags for several at once)
  $('details').addEventListener('change', async (e) => {
    const f = e.target.dataset.f; if (!f) return; const S = chosen(), v = e.target.value.trim();
    for (const it of S) { if (f === 'name' && v) it.name = v; if (f === 'category') it.category = v; if (f === 'style' || f === 'form') it[f] = v; if (f === 'tags') it.tags = S.length === 1 ? v.split(',').map((t) => t.trim()).filter(Boolean) : [...new Set([...(it.tags || []), ...v.split(',').map((t) => t.trim()).filter(Boolean)])]; await L.put(it); }
    await reload(); if (f === 'category' && v && cat !== '*' && cat !== v) toast(`Moved to “${v}”.`);
  });
  document.addEventListener('click', (e) => { if (startOpen && e.target.closest('.start .tiles [data-act]')) { startOpen = false; $('start').hidden = true; } const c = e.target.closest('[data-copy]'); if (c) { navigator.clipboard.writeText(c.dataset.copy).then(() => toast('Link copied: paste it into any app or web page.')); return; } const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  // the clip-art server (optional): is it there?
  const busy = (m) => { const t = $('toast'); if (m) { t.textContent = m; t.hidden = false; clearTimeout(toast.t); } else t.hidden = true; };
  async function checkServer(say) { serverUrl = await L.server(); serverOk = false; if (serverUrl) { try { const i = await L.serverInfo(); serverOk = true; if (say) toast(`Connected to the clip-art server (${i.libraries.map((l) => `${l.name}: ${l.database}`).join(', ')}).${i.writable ? '' : ' It can only be read from here.'}`); } catch (e) { if (say) toast(e.message); } } status(); }
  async function need() { if (!serverUrl) { await act('connect'); if (!serverUrl) throw new Error('Connect to a server first.'); } if (!serverOk) await checkServer(); if (!serverOk) throw new Error(`The clip-art server at ${serverUrl} did not answer (is it running?).`); }
  $('cats').onclick = (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; sel.clear(); render(); };
  $('search').oninput = (e) => { query = e.target.value; render(); };
  $('grid').addEventListener('click', (e) => {
    const t = e.target.closest('.tile'); if (!t) { if (e.target === $('grid')) { sel.clear(); render(); } return; } const id = t.dataset.id, S = shown();
    if (e.shiftKey && last) { const a = S.findIndex((x) => x.id === last), b = S.findIndex((x) => x.id === id); S.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((x) => sel.add(x.id)); }
    else if (e.ctrlKey || e.metaKey) { if (sel.has(id)) sel.delete(id); else sel.add(id); }
    else sel = new Set([id]);
    last = id; render();
  });
  $('grid').addEventListener('dblclick', (e) => { const t = e.target.closest('.tile'); if (t && cat === '#work') return act('work-import'); if (t) { const n = $('details').querySelector('[data-f=name]'); if (n) { n.focus(); n.select(); } } });
  // drop files anywhere
  let dragN = 0;
  document.addEventListener('dragenter', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { dragN++; $('drop').hidden = false; } });
  document.addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) $('drop').hidden = true; });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => { e.preventDefault(); dragN = 0; $('drop').hidden = true; const f = [...e.dataTransfer.files], z = f.filter((x) => /\.zip$/i.test(x.name)), p = f.filter((x) => !/\.zip$/i.test(x.name)); if (z.length) addFiles(z, 'Imported'); if (p.length) importer(p); });
  document.addEventListener('keydown', (e) => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (e.key === 'Delete') act('delete'); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); act('select-all'); } });
  L.onChange(() => reload()); if (WA) WA.onChange(() => reload()); // another Craft app (or another tab) changed the library

  // ------------------------------------------------------------------ title bar and ribbon (this app's own copy)
  const IK = {
    add: '<rect x="3" y="5" width="18" height="14" rx="2" class="fill"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8M18 2v6M15 5h6"/>',
    zip: '<path d="M6 3h9l4 4v14H6Z" class="fill"/><path d="M10 3v2h2v2h-2v2h2v2h-2v3h2"/>',
    exportZ: '<path d="M6 3h9l4 4v14H6Z" class="fill"/><path d="M12 10v7M9 14l3 3 3-3"/>',
    slice: '<rect x="3" y="3" width="18" height="18" rx="2" class="fill"/><path d="M12 3v18M3 12h18" stroke-dasharray="2 2"/><path d="m16 14 3 3m0-3-3 3"/>',
    folder: '<path d="M3 6h6l2 2h10v11H3Z" class="fill"/>',
    up: '<path d="M3 6h6l2 2h10v11H3Z" class="fill"/><path d="M12 17v-6M9 13l3-3 3 3"/>',
    server: '<rect x="4" y="3" width="16" height="7" rx="1.5" class="fill"/><rect x="4" y="14" width="16" height="7" rx="1.5" class="fill"/><path d="M8 6.5h.01M8 17.5h.01"/>',
    send: '<rect x="4" y="13" width="16" height="7" rx="1.5" class="fill"/><path d="M12 10V2M8.5 5.5 12 2l3.5 3.5"/>',
    get: '<rect x="4" y="13" width="16" height="7" rx="1.5" class="fill"/><path d="M12 2v8M8.5 6.5 12 10l3.5-3.5"/>',
    sync: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    down: '<path d="M3 6h6l2 2h10v11H3Z" class="fill"/><path d="M12 10v6M9 13l3 3 3-3"/>',
  };
  const LOGO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity=".35"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><path d="m14 20 2.5-4 2 3 1-1.5 1.5 2.5Z" fill="currentColor"/></svg>';
  const B = (label, icon, run, o = {}) => ({ label, icon, run, ...o });
  const ribbon = window.CraftRibbon({
    mount: $('app'), storageKey: 'clipartcraft',
    tabs: [
      { id: 'home', label: 'Home', hue: '#c2410c', groups: [
        ['Start', [B('Start', I.wand, () => act('start'), { big: true, title: 'The start page: what do you want to do? (import, slice a sheet, open a library…)' })]],
        ['Add', [B('Import pictures', IK.add, () => act('add'), { big: true, key: 'Ctrl+O', title: 'Any picture files (PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, TIFF, SVG, animations, classic formats): every page and frame, cropped, named for you, black and white made see-through' }), B('Import a library', IK.zip, () => act('zip'), { big: true, title: 'A library ZIP (from ImageCraft’s Split a sheet, or exported here)' })]],
        ['Slice', [B('Montage Slicer', IK.slice, () => act('slice'), { big: true, title: 'Cut a sheet (montage) of clip art into separate pictures: found by themselves or by a grid, named in order, added to the library' })]],
        ['Library', [B('Export (ZIP)', IK.exportZ, () => act('export-all'), { big: true, title: 'Everything shown (the category you are in, or all) as one ZIP: pictures, SVGs and library.json' }), { col: [B('Save to the folder', IK.up, () => act('folder-out'), { title: 'Write the whole library to its folder (backup, sync, sharing)' }), B('Add from a folder', IK.down, () => act('folder-in'), { title: 'Read a library folder into this library' }), B('Choose the folder…', IK.folder, () => act('folder-pick'), { title: 'Which folder the library is saved to' })] }]],
        ['Edit', [{ col: [B('Choose all', I.selectAll, () => act('select-all'), { key: 'Ctrl+A' }), B('Delete', I.trash, () => act('delete'), { key: 'Delete', disabled: () => !sel.size })] }]],
      ] },
      { id: 'server', label: 'Server', hue: '#0f766e', groups: [
        ['Connect', [B('Connect…', IK.server, () => act('connect'), { big: true, title: 'Use a clip-art server: on this computer (server/start-server.cmd) or on a web host. Every picture then has a real http link any app can use.' }), { col: [B('Open the server page', IK.link, () => act('open-server')), B('Stop using it', IK.link, () => act('disconnect'), { title: 'Forget the server (nothing is deleted anywhere)' })] }]],
        ['Share', [B('Sync', IK.sync, () => act('sync'), { big: true, title: 'Get what is new on the server, and send what is new here' }), B('Send to the server', IK.send, () => act('push'), { big: true, title: 'The chosen items (or everything) go to the server' }), B('Get from the server', IK.get, () => act('pull'), { big: true, title: 'Everything on the server comes into this library' })]],
        ['Remove', [B('Take off the server', I.trash, () => act('unserver'), { title: 'The chosen items are deleted from the server but stay here', disabled: () => !sel.size })]],
      ] },
    ],
  });
  const tb = window.CraftTitlebar({ appName: 'ClipArtCraft', storageKey: 'clipartcraft', colors: ['#ea580c', '#b23a0a'], mount: $('app'), toast, logo: LOGO, menus: () => [], ribbon,
    quick: [{ icon: 'wand', title: 'Start (wizard)', run: () => act('start') }, { icon: 'open', title: 'Import pictures', key: 'Ctrl+O', run: () => act('add') }, { icon: 'export', title: 'Export (ZIP)', run: () => act('export-all') }],
    getTitle: () => 'Clip-art library', getStatus: () => ({ text: `${items.length} item${items.length === 1 ? '' : 's'}` }), getInfo: () => [], rightEls: [] });
  const app = $('app'); app.prepend(ribbon.el); app.prepend(tb.el);
  const ic = document.createElement('link'); ic.rel = 'icon'; ic.href = 'data:image/svg+xml,' + encodeURIComponent(LOGO.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); document.head.append(ic);
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); act('add'); } });

  // Still to do: everything not processed when the page was last closed or refreshed (pictures still to send, files
  // opened in the importer or the slicer and not added), each to process or cancel, or all flushed at once
  let undone = [];
  async function offerResume() {
    const left = await L.pending(), files = WA ? (await WA.all()).filter((w) => w.pending) : []; let bar = $('resume');
    undone = files;
    if (!left.length && !files.length) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'resume'; bar.className = 'resume'; $('desk').prepend(bar); }
    const row = (text, go, cancel, label = 'Process') => `<li><span>${text}</span><button class="btn primary sm" type="button" data-act="${go}">${label}</button><button class="btn outline sm" type="button" data-act="${cancel}">Cancel</button></li>`;
    bar.innerHTML = `<div class="resume-head"><b>Still to do</b><span class="hint">not finished when the page was last closed</span><span class="grow"></span><button class="btn outline sm" type="button" data-act="undone-flush">Flush all</button></div><ul>
      ${left.length ? row(`<b>${left.length}</b> picture${left.length === 1 ? '' : 's'} still to send to the server`, 'resume', 'resume-forget', 'Send') : ''}
      ${files.map((w, i) => row(`<b>${esc(w.fileName)}</b>: ${w.pending === 'slice' ? 'a sheet loaded in the slicer' : 'opened to import'}, nothing added from it yet`, 'undone-go-' + i, 'undone-cancel-' + i)).join('')}</ul>`;
  }
  // cancel a file: off the list (and out of the working area if nothing was ever made from it)
  async function dropUndone(w) { if (!w) return; if (!w.used) await WA.remove(w.id); else { w.pending = ''; await WA.put(w); } }
  reload().then(() => checkServer()).then(offerResume).catch(fail);
  window.ClipArtCraft = { reload, items: () => items };
})();
