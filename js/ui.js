/* ClipArtCraft: the shared clip-art library of the Craft apps. Add pictures and SVGs (or a library ZIP from ImageCraft's
   Split a sheet), name them, sort them into categories, tag them, find them, and export or sync the library. Every Craft
   app reads the same library (js/library.js says how). */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id), L = window.CraftClipart, I = window.CraftIcons;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let items = [], cat = '*', query = '', sel = new Set(), last = null, size = 140;
  try { size = +localStorage.getItem('clipartcraft-size') || 140; } catch (e) { /* blocked storage */ }
  const toast = (m) => { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3200); };
  const download = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  const fail = (e) => { console.error(e); toast(String(e && e.message || e)); };

  // ------------------------------------------------------------------ what is shown
  const cats = () => { const m = new Map(); items.forEach((it) => { const c = it.category || ''; m.set(c, (m.get(c) || 0) + 1); }); return [...m].sort((a, b) => (a[0] === '' ? 1 : b[0] === '' ? -1 : a[0].localeCompare(b[0]))); };
  const shown = () => { const q = query.trim().toLowerCase(); return items.filter((it) => (cat === '*' || (it.category || '') === cat) && (!q || it.name.toLowerCase().includes(q) || (it.tags || []).some((t) => t.toLowerCase().includes(q)) || (it.category || '').toLowerCase().includes(q))).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })); };
  async function reload() { items = await L.all(); [...sel].forEach((id) => { if (!items.some((it) => it.id === id)) sel.delete(id); }); render(); }
  function render() {
    const C = cats(); $('cats').innerHTML = [['*', 'All clip art', items.length], ...C.map(([c, n]) => [c, c || 'No category', n])].map(([k, l, n]) => `<button type="button" class="cat" data-cat="${esc(k)}" aria-current="${cat === k}"><span>${esc(l)}</span><b>${n}</b></button>`).join('');
    const S = shown(), g = $('grid'); g.style.setProperty('--tile', size + 'px');
    g.innerHTML = S.map((it) => `<button type="button" class="tile" role="option" data-id="${it.id}" aria-selected="${sel.has(it.id)}" title="${esc(it.name)}${it.category ? ' · ' + esc(it.category) : ''}"><span class="pic"><img src="${it.thumb}" alt="" loading="lazy"></span><span class="nm">${esc(it.name)}</span>${it.svg ? '<i class="fmt">SVG</i>' : ''}</button>`).join('');
    $('start').hidden = items.length > 0; if (!items.length) renderStart();
    renderDetails(); status();
  }
  function renderStart() {
    $('start').innerHTML = `<div class="start-in"><h2>What do you want to do?</h2><div class="tiles">
      <button type="button" data-act="add"><b>Add pictures</b><small>PNG, JPEG, GIF, WebP or SVG files (a PNG and an SVG with the same name become one item)</small></button>
      <button type="button" data-act="slice"><b>Slice a montage</b><small>A sheet of clip art cut into separate pictures, named and added</small></button>
      <button type="button" data-act="zip"><b>Import a library ZIP</b><small>From ImageCraft’s Split a sheet, or one exported here</small></button>
      <button type="button" data-act="folder-in"><b>Open a library folder</b><small>A folder with library.json and its pictures (backup, or shared from another computer)</small></button></div>
      <p class="hint">The library is kept in this browser and shared with every Craft app opened in it. Nothing is uploaded.</p></div>`;
  }
  function renderDetails() {
    const d = $('details'), S = items.filter((it) => sel.has(it.id));
    if (!S.length) { d.innerHTML = `<div class="props-head">Library</div><div class="sec"><p class="hint"><b>${items.length}</b> item${items.length === 1 ? '' : 's'} in ${cats().length} categor${cats().length === 1 ? 'y' : 'ies'}.</p><p class="hint">Click a picture to see it and name it; Ctrl-click or Shift-click picks several (to give them a category together).</p></div>`; return; }
    const one = S.length === 1 ? S[0] : null, catList = cats().map(([c]) => c).filter(Boolean);
    d.innerHTML = `<div class="props-head">${one ? 'Clip art' : `${S.length} chosen`}</div><div class="sec">
      ${one ? `<div class="big check-bg"><img src="${one.svg ? L.svgUrl(one.svg) : URL.createObjectURL(one.png)}" alt=""></div>
      <label class="field"><span>Name</span><input class="input" data-f="name" value="${esc(one.name)}"></label>` : `<div class="many">${S.slice(0, 12).map((it) => `<img src="${it.thumb}" alt="">`).join('')}</div>`}
      <label class="field"><span>Category</span><input class="input" data-f="category" list="catlist" value="${esc(one ? one.category : (new Set(S.map((x) => x.category)).size === 1 ? S[0].category : ''))}" placeholder="Americana, Buildings, Transport…"><datalist id="catlist">${catList.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
      <label class="field"><span>Tags <small class="hint">(separated by commas)</small></span><input class="input" data-f="tags" value="${esc(one ? (one.tags || []).join(', ') : '')}" placeholder="${one ? 'farm, red, barn' : 'added to each'}"></label>
      ${one ? `<p class="hint">${one.width} × ${one.height} pixels · ${[one.png ? 'PNG' : '', one.svg ? 'SVG' : ''].filter(Boolean).join(' and ')}${one.source ? ` · from ${esc(one.source)}` : ''}</p>
      <div class="btns">${one.png ? '<button class="btn outline" type="button" data-act="dl-png">PNG</button>' : ''}${one.svg ? '<button class="btn outline" type="button" data-act="dl-svg">SVG</button>' : ''}<button class="btn outline" type="button" data-act="copy">Copy</button></div>` : ''}
      <div class="btns"><button class="btn outline" type="button" data-act="export-sel">Export ${one ? 'it' : 'these'} (ZIP)</button><button class="btn outline danger" type="button" data-act="delete">Delete</button></div></div>`;
  }
  function status() { const S = shown(); $('status').innerHTML = `<span><b>${items.length}</b> in the library</span><span>${cat === '*' && !query ? '' : `<b>${S.length}</b> shown`}</span><span>${sel.size ? `<b>${sel.size}</b> chosen` : ''}</span><span class="grow"></span><label class="hint">Size <input type="range" id="size" min="80" max="260" value="${size}" aria-label="Thumbnail size"></label>`; $('size').oninput = (e) => { size = +e.target.value; $('grid').style.setProperty('--tile', size + 'px'); try { localStorage.setItem('clipartcraft-size', size); } catch (err) { /* blocked */ } }; }

  // ------------------------------------------------------------------ actions
  function pick(accept, multiple = true) { return new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = multiple; i.onchange = () => ok([...i.files]); i.click(); }); }
  async function addFiles(files, how = 'Added') { if (!files.length) return; try { const made = await L.add(files, { category: cat !== '*' ? cat : '' }); await reload(); sel = new Set(made.map((m) => m.id)); render(); toast(`${how}: ${made.length} item${made.length === 1 ? '' : 's'}.`); } catch (e) { fail(e); } }
  const chosen = () => items.filter((it) => sel.has(it.id));
  // the Montage Slicer (js/slicer.js): what it added is shown and chosen
  const slicer = (file) => window.ClipArtSlicer.open({ file, toast, categories: cats().map(([c]) => c).filter(Boolean), done: async (made, category) => { await reload(); cat = category; sel = new Set(made.map((m) => m.id)); render(); toast(`${made.length} picture${made.length === 1 ? '' : 's'} added to “${category}”.`); } });
  async function act(a) {
    try {
      if (a === 'add') return addFiles(await pick('image/*,.svg,.zip'));
      if (a === 'zip') return addFiles(await pick('.zip', false), 'Imported');
      if (a === 'slice') return slicer();
      if (a === 'export-all') { if (!items.length) return toast('The library is empty.'); download(await L.toZip(shown()), cat === '*' ? 'Clip art library.zip' : `${cat || 'No category'} clip art.zip`); return; }
      if (a === 'export-sel') { download(await L.toZip(chosen()), chosen().length === 1 ? `${chosen()[0].name}.zip` : 'Clip art.zip'); return; }
      if (a === 'folder-out') { const n = await L.toFolder(items); toast(`Saved ${items.length} items to the folder “${n}”.`); return; }
      if (a === 'folder-in') { const made = await L.fromFolder(); await reload(); toast(`Added ${made.length} items from the folder.`); return; }
      if (a === 'folder-pick') { const h = await L.pickFolder(); toast(`Library folder: “${h.name}”.`); return; }
      if (a === 'select-all') { sel = new Set(shown().map((it) => it.id)); render(); return; }
      if (a === 'delete') { const S = chosen(); if (!S.length) return toast('Choose something first.'); if (!confirm(`Delete ${S.length === 1 ? `“${S[0].name}”` : `${S.length} items`} from the library? (Export first if you might want ${S.length === 1 ? 'it' : 'them'} back.)`)) return; await L.remove(S.map((x) => x.id)); sel.clear(); await reload(); toast('Deleted.'); return; }
      const one = chosen()[0]; if (!one) return;
      if (a === 'dl-png') download(one.png, `${one.name}.png`);
      if (a === 'dl-svg') download(new Blob([one.svg], { type: 'image/svg+xml' }), `${one.name}.svg`);
      if (a === 'copy') { if (one.png && navigator.clipboard && window.ClipboardItem) { await navigator.clipboard.write([new ClipboardItem({ 'image/png': one.png })]); toast('Copied the picture.'); } else if (one.svg) { await navigator.clipboard.writeText(one.svg); toast('Copied the SVG as text.'); } }
    } catch (e) { if (e && e.name === 'AbortError') return; fail(e); }
  }
  // a name, category or tags changed (for one, or the category/tags for several at once)
  $('details').addEventListener('change', async (e) => {
    const f = e.target.dataset.f; if (!f) return; const S = chosen(), v = e.target.value.trim();
    for (const it of S) { if (f === 'name' && v) it.name = v; if (f === 'category') it.category = v; if (f === 'tags') it.tags = S.length === 1 ? v.split(',').map((t) => t.trim()).filter(Boolean) : [...new Set([...(it.tags || []), ...v.split(',').map((t) => t.trim()).filter(Boolean)])]; await L.put(it); }
    await reload(); if (f === 'category' && v && cat !== '*' && cat !== v) toast(`Moved to “${v}”.`);
  });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  $('cats').onclick = (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; sel.clear(); render(); };
  $('search').oninput = (e) => { query = e.target.value; render(); };
  $('grid').addEventListener('click', (e) => {
    const t = e.target.closest('.tile'); if (!t) { if (e.target === $('grid')) { sel.clear(); render(); } return; } const id = t.dataset.id, S = shown();
    if (e.shiftKey && last) { const a = S.findIndex((x) => x.id === last), b = S.findIndex((x) => x.id === id); S.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((x) => sel.add(x.id)); }
    else if (e.ctrlKey || e.metaKey) { if (sel.has(id)) sel.delete(id); else sel.add(id); }
    else sel = new Set([id]);
    last = id; render();
  });
  $('grid').addEventListener('dblclick', (e) => { const t = e.target.closest('.tile'); if (t) { const n = $('details').querySelector('[data-f=name]'); if (n) { n.focus(); n.select(); } } });
  // drop files anywhere
  let dragN = 0;
  document.addEventListener('dragenter', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { dragN++; $('drop').hidden = false; } });
  document.addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) $('drop').hidden = true; });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => { e.preventDefault(); dragN = 0; $('drop').hidden = true; addFiles([...e.dataTransfer.files]); });
  document.addEventListener('keydown', (e) => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (e.key === 'Delete') act('delete'); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); act('select-all'); } });
  L.onChange(() => reload()); // another Craft app (or another tab) changed the library

  // ------------------------------------------------------------------ title bar and ribbon (this app's own copy)
  const IK = {
    add: '<rect x="3" y="5" width="18" height="14" rx="2" class="fill"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8M18 2v6M15 5h6"/>',
    zip: '<path d="M6 3h9l4 4v14H6Z" class="fill"/><path d="M10 3v2h2v2h-2v2h2v2h-2v3h2"/>',
    exportZ: '<path d="M6 3h9l4 4v14H6Z" class="fill"/><path d="M12 10v7M9 14l3 3 3-3"/>',
    slice: '<rect x="3" y="3" width="18" height="18" rx="2" class="fill"/><path d="M12 3v18M3 12h18" stroke-dasharray="2 2"/><path d="m16 14 3 3m0-3-3 3"/>',
    folder: '<path d="M3 6h6l2 2h10v11H3Z" class="fill"/>',
    up: '<path d="M3 6h6l2 2h10v11H3Z" class="fill"/><path d="M12 17v-6M9 13l3-3 3 3"/>',
    down: '<path d="M3 6h6l2 2h10v11H3Z" class="fill"/><path d="M12 10v6M9 13l3 3 3-3"/>',
  };
  const LOGO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity=".35"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><path d="m14 20 2.5-4 2 3 1-1.5 1.5 2.5Z" fill="currentColor"/></svg>';
  const B = (label, icon, run, o = {}) => ({ label, icon, run, ...o });
  const ribbon = window.CraftRibbon({
    mount: $('app'), storageKey: 'clipartcraft',
    tabs: [
      { id: 'home', label: 'Home', hue: '#c2410c', groups: [
        ['Add', [B('Add pictures', IK.add, () => act('add'), { big: true, key: 'Ctrl+O', title: 'PNG, JPEG, GIF, WebP or SVG files, or a library ZIP' }), B('Import a library', IK.zip, () => act('zip'), { big: true, title: 'A library ZIP (from ImageCraft’s Split a sheet, or exported here)' })]],
        ['Slice', [B('Montage Slicer', IK.slice, () => act('slice'), { big: true, title: 'Cut a sheet (montage) of clip art into separate pictures: found by themselves or by a grid, named in order, added to the library' })]],
        ['Library', [B('Export (ZIP)', IK.exportZ, () => act('export-all'), { big: true, title: 'Everything shown (the category you are in, or all) as one ZIP: pictures, SVGs and library.json' }), { col: [B('Save to the folder', IK.up, () => act('folder-out'), { title: 'Write the whole library to its folder (backup, sync, sharing)' }), B('Add from a folder', IK.down, () => act('folder-in'), { title: 'Read a library folder into this library' }), B('Choose the folder…', IK.folder, () => act('folder-pick'), { title: 'Which folder the library is saved to' })] }]],
        ['Edit', [{ col: [B('Choose all', I.selectAll, () => act('select-all'), { key: 'Ctrl+A' }), B('Delete', I.trash, () => act('delete'), { key: 'Delete', disabled: () => !sel.size })] }]],
      ] },
    ],
  });
  const tb = window.CraftTitlebar({ appName: 'ClipArtCraft', storageKey: 'clipartcraft', colors: ['#ea580c', '#b23a0a'], mount: $('app'), toast, logo: LOGO, menus: () => [], ribbon,
    quick: [{ icon: 'open', title: 'Add pictures', key: 'Ctrl+O', run: () => act('add') }, { icon: 'export', title: 'Export (ZIP)', run: () => act('export-all') }],
    getTitle: () => 'Clip-art library', getStatus: () => ({ text: `${items.length} item${items.length === 1 ? '' : 's'}` }), getInfo: () => [], rightEls: [] });
  const app = $('app'); app.prepend(ribbon.el); app.prepend(tb.el);
  const ic = document.createElement('link'); ic.rel = 'icon'; ic.href = 'data:image/svg+xml,' + encodeURIComponent(LOGO.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); document.head.append(ic);
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); act('add'); } });

  reload().catch(fail);
  window.ClipArtCraft = { reload, items: () => items };
})();
