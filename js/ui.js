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
  const shown = () => { const q = query.trim().toLowerCase(); const words = q.split(/\s+/).filter(Boolean); if (cat === '#work') return work.filter((w) => words.every((x) => w.name.toLowerCase().includes(x))); return items.filter((it) => (cat === '*' || (cat === '#unsorted' ? !KNOWN().includes(it.category || '') : cat.startsWith('#src:') ? srcOf(it) === cat.slice(5) : cat.startsWith('#sub:') ? (() => { const [c, sj] = cat.slice(5).split('|'); return it.category === c && subjectOf(it) === sj; })() : cat.startsWith('#srcat:') ? (() => { const [k, c] = cat.slice(7).split('|'); return srcOf(it) === k && (c === 'Not sorted yet' ? !KNOWN().includes(it.category || '') : it.category === c); })() : (it.category || '') === cat)) && words.every((x) => [it.name, it.original, it.seen, it.matched, (it.tags || []).join(' '), it.category, it.style, it.form, it.kind === 'bw' ? 'black and white' : it.kind, it.anim ? 'animated animation' : '', it.description].join(' ').toLowerCase().includes(x))).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })); };
  // the agreed categories (the AI's), and which pictures still need sorting: no category from them, or a name that
  // only says where it came from (Sheet 6 – 3, IMG_2041, clip art 12)
  const KNOWN = () => (window.CraftNamer ? CraftNamer.CATEGORIES : []);
  const subjectOf = (it) => String(it.name || '').replace(/_\d{3,}$/, '').replace(/\s*[–-]\s*\d+$/, '').replace(/\s+\d+$/, '').trim() || 'Untitled';
  // the tree: which branches are open (kept in this browser)
  let openTree = new Set(); try { openTree = new Set(JSON.parse(localStorage.getItem('clipartcraft-tree') || '[]')); } catch (e) { /* blocked */ }
  const keepTree = () => { try { localStorage.setItem('clipartcraft-tree', JSON.stringify([...openTree])); } catch (e) { /* blocked */ } };
  const groupBy = (list, key) => { const m = new Map(); list.forEach((it) => { const k = key(it); m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true })); };
  const srcOf = (it) => String(it.source || '').replace(/^Montage Slicer:\s*/i, '').replace(/^ImageCraft:\s*/i, '').replace(/\.[a-z0-9]{2,5}$/i, '').trim() || 'Added by hand';
  // the sheets and files pictures came from, most first: [key, label, count]
  const sources = () => { const m = new Map(); items.forEach((it) => { const k = srcOf(it); m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, n]) => [k, k, n]); };
  const placeholderName = (n) => { const t = String(n).trim(), u = t.replace(/_\d{3,}$/, ''); return /^(sheet\b.*[–-]\s*\d+|clip ?art(\s*[–-]?\s*\d+)?|img[ _-]?\d+|dsc\S*\d+|untitled|picture\s*\d*|item\s*\d*)$/i.test(t) || /^(clip ?art(\s*[–-]?\s*\d+)?|untitled|picture\s*\d*|item\s*\d*)$/i.test(u) || /^[0-9a-f]{6,}(?:[\s-]+[0-9a-f]{3,})+/i.test(u) || /\s[–-]\s*\d+$/.test(u); };
  const needsSort = (it) => !KNOWN().includes(it.category || '') || placeholderName(it.name);
  // learning from a correction: the picture's look and the user's answer are remembered (and a new name word is added
  // to that category's words), so pictures like it are named and sorted that way from now on
  async function teach(it, quiet) {
    if (!it.vec || !window.CraftNamer) return; const subject = subjectOf(it), all = (await L.lessons()).filter((l) => l.id !== it.id);
    all.push({ id: it.id, vec: it.vec, name: subject, category: it.category || '', style: it.style || '', form: it.form || '', at: new Date().toISOString() });
    await L.lessons(all.slice(-2000));
    if (it.category && CraftNamer.learnWord(subject, it.category)) await L.lists(CraftNamer.lists());
    if (!quiet) toast(`The AI will remember: pictures like this are “${subject}”${it.category ? ` in ${it.category}` : ''}.`);
  }
  // describing each picture (Florence-2): better names, a little slower; on unless turned off
  const describeOn = () => { try { return localStorage.getItem('clipartcraft-describe') !== '0'; } catch (e) { return true; } };
  // the first time: what will be downloaded
  async function aiOk() {
    const N = window.CraftNamer, a = await N.downloaded(), b = !describeOn() || (await N.describerDownloaded()); if (a && b) return true;
    return confirm(`The AI looks at each picture in this browser (nothing is uploaded). The first time it downloads about ${(a ? 0 : N.MB) + (b ? 0 : N.DESCRIBER_MB)} MB (kept for next time, then it works offline). Go ahead?`);
  }
  async function sortWithAI(list, { quiet = false, again = false } = {}) {
    const N = window.CraftNamer; if (!N || !list.length) return 0;
    return L.guard(async () => {
      const prog = (got, total, what) => busy(what === 'words' ? `Learning the words… ${got} of ${total}` : `Getting the AI (once)… ${Math.round(got / 1048576)} of ${Math.round(total / 1048576)} MB${what ? ` · ${String(what).split('/').pop()}` : ''}`);
      if (describeOn()) { busy('Getting the describing AI ready…'); try { await N.describeReady(prog); } catch (e) { console.warn(e); toast('The describing AI could not start here; names come from the word list.'); } }
      await N.ready((got, total, what) => busy(what === 'words' ? `Learning the words… ${got} of ${total}` : `Getting the AI (once, about ${N.MB} MB)… ${Math.round(got / 1048576)} of ${Math.round(total / 1048576)} MB`));
      const taken = new Set(items.map((it) => it.name.toLowerCase())); let n = 0;
      for (const it of list) {
        busy(`Sorting ${++n} of ${list.length}: ${it.name}…`);
        let src; try { src = it.png ? await createImageBitmap(it.png) : await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = L.svgUrl(it.svg); }); } catch (e) { continue; }
        const c = document.createElement('canvas'); c.width = src.width || 224; c.height = src.height || 224; c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
        const ai = await N.name(c, { lessons: await L.lessons(), describe: describeOn() }); it.ai = ai.words; it.vec = ai.vec; if (ai.description) it.description = ai.description;
        // the names side by side: the one it came with (kept for good), what the AI sees, and the nearest word on the lists
        if (!it.original) it.original = it.name; if (ai.described) it.seen = ai.seenAs || ai.name; const mw = (ai.words || []).find((w) => !w.described && !w.learnt); if (mw) it.matched = mw.word.charAt(0).toUpperCase() + mw.word.slice(1);
        if (!KNOWN().includes(it.category || '') || again) it.category = it.checked && !again ? it.category : ai.category;
        it.style = it.style || ai.style; it.form = it.form || ai.form; it.tags = [...new Set([...(it.tags || []), ...ai.tags])];
        if (placeholderName(it.name) || (again && !it.checked)) { taken.delete(it.name.toLowerCase()); let nm = ai.name; for (let k = 2; taken.has(nm.toLowerCase()); k++) nm = `${ai.name}_${String(k).padStart(3, '0')}`; it.name = nm; taken.add(nm.toLowerCase()); }
        await L.put(it);
      }
      busy(); if (!quiet) toast(`Sorted ${list.length} picture${list.length === 1 ? '' : 's'}: each has a category, style, form and tags.`);
      return list.length;
    });
  }
  // after new pictures come in: sorted at once if the AI is already here, otherwise the button in the menu offers it
  async function sortNew(made) {
    const todo = made.filter(needsSort); if (!todo.length || !window.CraftNamer) return;
    if ((await CraftNamer.downloaded()) && (!describeOn() || (await CraftNamer.describerDownloaded()))) { await sortWithAI(todo, { quiet: true }); await reload(); toast(`${todo.length} new picture${todo.length === 1 ? '' : 's'} sorted into categories by the AI.`); }
  }
  async function reload() { items = await L.all(); work = WA ? await WA.all() : []; [...sel].forEach((id) => { if (!items.some((it) => it.id === id)) sel.delete(id); }); render(); }
  function render() {
    const C = cats(); const catBtn = ([k, l, n]) => `<button type="button" class="cat" data-cat="${esc(k)}" aria-current="${cat === k}"><span>${esc(l)}</span><b>${n}</b></button>`;
    const branch = (key, label, n, kids, dim) => { const open = openTree.has(key) && kids.length; return `<div class="tree-row">${kids.length ? `<button type="button" class="tw" data-tree="${esc(key)}" aria-expanded="${!!open}" aria-label="${open ? 'Close' : 'Open'} ${esc(label)}">${open ? '▾' : '▸'}</button>` : '<span class="tw"></span>'}${catBtn([key, label, n]).replace('class="cat"', `class="cat${dim ? ' empty' : ''}"`)}</div>${open ? `<div class="tree-kids">${kids.map(([k, l, c]) => `<div class="tree-row"><span class="tw"></span>${catBtn([k, l, c])}</div>`).join('')}</div>` : ''}`; };
    const count = new Map(C), unsorted = items.filter((it) => !KNOWN().includes(it.category || '')).length, toSort = items.filter(needsSort).length, srcs = sources();
    $('cats').innerHTML = catBtn(['*', 'All clip art', items.length])
      + `<div class="work-head">Categories</div>` + KNOWN().map((c) => branch(c, c, count.get(c) || 0, count.get(c) ? groupBy(items.filter((it) => it.category === c), subjectOf).map(([sj, n]) => ['#sub:' + c + '|' + sj, sj, n]) : [], !count.get(c))).join('')
      + (unsorted ? catBtn(['#unsorted', 'Not sorted yet', unsorted]) : '')
      + (toSort ? `<button type="button" class="btn outline sort-ai" data-act="sort-ai" title="The AI looks at each picture and gives it a category, style, form and tags (and a name, where it only has a number)">Sort ${toSort} with AI</button>` : '')
      + (srcs.length ? `<div class="work-head">From sheets and files</div>` + srcs.map(([k, l, n]) => branch('#src:' + k, l, n, groupBy(items.filter((it) => srcOf(it) === k), (it) => (KNOWN().includes(it.category || '') ? it.category : 'Not sorted yet')).map(([c, m]) => ['#srcat:' + k + '|' + c, c, m]))).join('') : '')
      + `<div class="work-head">Working area</div>` + catBtn(['#work', 'Files imported from', work.length]);
    const S = shown(), g = $('grid'); g.style.setProperty('--tile', size + 'px');
    g.innerHTML = cat === '#work' ? S.map((w) => `<button type="button" class="tile" role="option" data-id="${w.id}" aria-selected="${sel.has(w.id)}" title="${esc(w.fileName)}"><span class="pic">${w.thumb ? `<img src="${w.thumb}" alt="" loading="lazy">` : ''}</span><span class="nm">${esc(w.name)}</span>${w.used ? `<i class="used">${w.used} made</i>` : ''}<i class="fmt">${esc((w.fileName.split('.').pop() || '').toUpperCase())}</i></button>`).join('') : S.map((it) => `<button type="button" class="tile" role="option" data-id="${it.id}" aria-selected="${sel.has(it.id)}" title="${esc(it.name)}${it.category ? ' · ' + esc(it.category) : ''}"><span class="pic"><img src="${it.thumb}" alt="" loading="lazy"></span><span class="nm">${esc(it.name)}</span>${it.anim ? '<i class="fmt">▶</i>' : it.svg ? '<i class="fmt">SVG</i>' : ''}</button>`).join('');
    const showIt = startOpen || (!items.length && cat !== '#work'); $('start').hidden = !showIt; if (showIt) renderStart();
    renderDetails(); syncProps(); status(); lightUp(g); lightUp($('details')); if (propsBox && !propsBox.hidden) lightUp(propsBox);
  }
  function renderStart() {
    $('start').innerHTML = `<div class="start-in"><h2>What do you want to do?</h2>${items.length ? `<p class="hint">${items.length} picture${items.length === 1 ? '' : 's'} in the library. <button class="btn outline" type="button" data-act="start-close">Back to the library</button></p>` : ''}<div class="tiles">
      <button type="button" data-act="add"><b>Import pictures</b><small>Any picture files: PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, TIFF, SVG, animations and classic formats. Named for you, cropped, black and white made see-through</small></button>
      <button type="button" data-act="slice"><b>Slice a montage</b><small>A sheet of clip art cut into separate pictures, named and added</small></button>
      <button type="button" data-act="zip"><b>Import a library ZIP</b><small>From ImageCraft’s Split a sheet, or one exported here</small></button>
      <button type="button" data-act="folder-in"><b>Open a library folder</b><small>A folder with library.json and its pictures (backup, or shared from another computer)</small></button></div>
      <p class="hint">The library is kept in this browser and shared with every Craft app opened in it. Nothing is uploaded.</p></div>`;
  }
  // a drop-down from one of the lists; a value not on the list is still shown (marked), and several chosen can be "unchanged"
  function pickField(f, label, list, value, many) {
    const v = value || '', opts = [...(many ? [['', '(leave as they are)']] : [['', f === 'category' ? 'Not sorted yet' : '—']]), ...list.map((x) => [x, x]), ...(v && !list.includes(v) ? [[v, `${v} (not on the list)`]] : [])];
    return `<label class="field"><span>${label}</span><select class="input" data-f="${f}">${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  }
  // what the AI thought (its best guesses, each with its category): click one to use it
  function aiChips(it) {
    if (!it.ai || !it.ai.length) return '';
    return `<div class="field"><span>The AI’s guesses <small class="hint">(click one to use its name and category)</small></span><div class="ai-chips">${it.ai.map((w, i) => `<button type="button" class="ai-chip${subjectOf(it).toLowerCase() === w.word.toLowerCase() ? ' on' : ''}" data-ai="${i}" title="${esc(w.category)} · ${Math.round(w.score * 100)}"><b>${esc(w.word.charAt(0).toUpperCase() + w.word.slice(1))}</b><small>${esc(w.category)}</small></button>`).join('')}</div></div>`;
  }
  function renderDetails() {
    if (cat === '#work') return renderWork();
    const d = $('details'), S = items.filter((it) => sel.has(it.id));
    if (!S.length) { d.innerHTML = `<div class="props-head">Library</div><div class="sec"><p class="hint"><b>${items.length}</b> item${items.length === 1 ? '' : 's'} in ${cats().length} categor${cats().length === 1 ? 'y' : 'ies'}.</p><p class="hint">Click a picture to see it and name it; Ctrl-click or Shift-click picks several (to give them a category together).</p><button class="btn ghost sm" type="button" data-act="edit-lists">Edit the lists…</button></div>`; return; }
    const one = S.length === 1 ? S[0] : null, catList = [...new Set([...KNOWN(), ...cats().map(([c]) => c).filter(Boolean)])];
    d.innerHTML = `<div class="props-head">${one ? 'Clip art' : `${S.length} chosen`}</div><div class="sec">
      ${one ? `<div class="big check-bg"><img src="${one.anim ? URL.createObjectURL(one.anim) : one.svg ? L.svgUrl(one.svg) : URL.createObjectURL(one.png)}" alt=""></div>
      <label class="field"><span>Name</span><input class="input" data-f="name" value="${esc(one.name)}"></label>` : `<div class="many">${S.slice(0, 12).map((it) => `<img src="${it.thumb}" alt="">`).join('')}</div>`}
      ${pickField('category', 'Category', KNOWN(), one ? one.category : (new Set(S.map((x) => x.category)).size === 1 ? S[0].category : ''), !one)}
      <div class="two">${pickField('style', 'Style', window.CraftNamer ? CraftNamer.STYLES : [], one ? one.style : (new Set(S.map((x) => x.style || '')).size === 1 ? S[0].style : ''), !one)}${pickField('form', 'Form', window.CraftNamer ? CraftNamer.FORMS : [], one ? one.form : (new Set(S.map((x) => x.form || '')).size === 1 ? S[0].form : ''), !one)}</div>
      ${one && (one.original || one.seen || one.matched || one.description) ? `<details class="names-more" open><summary>Other names</summary>
        <div class="two"><label class="field"><span>Original name</span><input class="input" data-f="original" value="${esc(one.original || '')}"></label><label class="field"><span>Seen as <small class="hint">(the AI’s description)</small></span><input class="input" data-f="seen" value="${esc(one.seen || '')}"></label></div>
        <label class="field"><span>Matched word <small class="hint">(nearest on the lists)</small></span><input class="input" data-f="matched" value="${esc(one.matched || '')}"></label>
        <label class="field"><span>Description</span><textarea class="input" data-f="description" rows="2">${esc(one.description || '')}</textarea></label></details>` : ''}
      ${one ? aiChips(one) : ''}
      <div class="btns"><button class="btn outline sm" type="button" data-act="ai-again" title="The AI looks at ${one ? 'this picture' : 'these pictures'} again: new guesses to choose from">Ask the AI${one && one.ai ? ' again' : ''}</button><button class="btn outline sm" type="button" data-act="cloud-ask" title="A cloud AI (Claude, Gemini, GPT or OpenRouter, with your own key) looks at ${one ? 'it' : 'them'}: for pictures the AI here gets wrong. Costs a little per picture">Ask a cloud AI</button><button class="btn ghost sm" type="button" data-act="edit-lists" title="Add, rename or remove categories (and the words the AI knows for each), styles and forms">Edit the lists…</button></div>
      <label class="field"><span>Tags <small class="hint">(separated by commas)</small></span><input class="input" data-f="tags" value="${esc(one ? (one.tags || []).join(', ') : '')}" placeholder="${one ? 'farm, red, barn' : 'added to each'}"></label>
      ${one ? `<p class="hint">${one.width} × ${one.height} pixels · ${[one.png ? 'PNG' : '', one.svg ? 'SVG' : '', one.anim ? `moving (${one.frames || '?'} frames)` : ''].filter(Boolean).join(', ')}${one.kind === 'bw' ? ' · black and white' : one.kind === 'grey' ? ' · grey' : ''}${one.source ? ` · from ${esc(one.source)}` : ''}${one.cloud ? ` · named by ${esc(one.cloud)}` : ''}</p>
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
  function status() { const S = shown(); $('status').innerHTML = `<span title="${esc(serverUrl)}">${serverUrl ? `Server: <b>${serverOk ? 'connected' : 'not answering'}</b> · ${items.filter((it) => it.serverId).length} on it` : 'No server'}</span><span>${cat === '*' && !query ? '' : `<b>${S.length}</b> shown`}</span><span class="grow"></span><span><b>${items.length}</b> in the library</span><label class="hint">Size <input type="range" id="size" min="80" max="260" value="${size}" aria-label="Thumbnail size"></label><span class="sel-n">${sel.size ? `<b>${sel.size}</b> chosen` : 'none chosen'}</span>`; $('size').oninput = (e) => { size = +e.target.value; $('grid').style.setProperty('--tile', size + 'px'); try { localStorage.setItem('clipartcraft-size', size); } catch (err) { /* blocked */ } }; }

  // ------------------------------------------------------------------ actions
  function pick(accept, multiple = true) { return new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = multiple; i.onchange = () => ok([...i.files]); i.click(); }); }
  async function addFiles(files, how = 'Added') { if (!files.length) return; try { const made = await L.add(files, { category: cat !== '*' ? cat : '' }); await reload(); sel = new Set(made.map((m) => m.id)); render(); toast(`${how}: ${made.length} item${made.length === 1 ? '' : 's'}.`); } catch (e) { fail(e); } }
  const chosen = () => items.filter((it) => sel.has(it.id));
  // the Montage Slicer (js/slicer.js): what it added is shown and chosen
  const slicer = (file) => window.ClipArtSlicer.open({ file, toast, categories: KNOWN(), done: async (made, category, sheetFile, o = {}) => {
    await reload(); offerResume(); cat = category || '*'; sel = new Set(made.map((m) => m.id)); render(); if (!o.more) toast(`${made.length} picture${made.length === 1 ? '' : 's'} added${category ? ` to “${category}”` : ''}.`); sortNew(made); } });
  // Import pictures (js/importer.js): what it added is shown and chosen
  const importer = (files) => window.ClipArtImporter.open({ files, toast, server: !!serverUrl && serverOk, categories: KNOWN(), done: async (made) => { setTimeout(() => sortNew(made), 0); await reload(); offerResume(); cat = '*'; sel = new Set(made.map((m) => m.id)); render(); toast(`${made.length} picture${made.length === 1 ? '' : 's'} added to the library.`); } });
  async function act(a) {
    try {
      if (a === 'ai-again') { const S = chosen(); if (!S.length) return; if (!(await aiOk())) return; await sortWithAI(S, { again: true }); await reload(); return; }
      if (a === 'edit-lists') return editLists();
      if (a === 'cloud-settings') return cloudSettings();
      if (a === 'cloud-ask') { const S = chosen(); if (!S.length) return toast('Choose the pictures to ask about first.'); if (!window.CraftCloud.ready()) return cloudSettings(() => act('cloud-ask')); if (S.length > 1 && !confirm(`Send ${S.length} pictures to ${CraftCloud.NAMES[CraftCloud.provider()]}? Each one costs a little on your account.`)) return; await askCloud(S); await reload(); return; }
      if (a === 'sort-ai') { const S = sel.size ? chosen() : items.filter(needsSort); if (!S.length) return toast('Everything is sorted already.'); if (!(await aiOk())) return; await sortWithAI(S); await reload(); return; }
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
      if (a === 'connect') return connectWindow();
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
  async function onDetailsChange(e) {
    const f = e.target.dataset.f; if (!f) return; const S = chosen(), v = e.target.value.trim(); if (e.target.tagName === 'SELECT' && S.length > 1 && !v) return;
    const teachIt = S.length === 1 && S[0].vec && ['name', 'category', 'style', 'form'].includes(f);
    for (const it of S) { if (f === 'name' && v) it.name = v; if (f === 'category') it.category = v; if (f === 'style' || f === 'form') it[f] = v; if (['original', 'seen', 'matched', 'description'].includes(f)) it[f] = e.target.value.trim(); it.checked = true; if (f === 'tags') it.tags = S.length === 1 ? v.split(',').map((t) => t.trim()).filter(Boolean) : [...new Set([...(it.tags || []), ...v.split(',').map((t) => t.trim()).filter(Boolean)])]; await L.put(it); }
    if (teachIt) await teach(S[0]);
    await reload(); if (!teachIt && f === 'category' && v && cat !== '*' && cat !== v) toast(`Moved to “${v}”.`);
  }
  $('details').addEventListener('change', onDetailsChange);
  // one of the AI's guesses chosen: its name (numbered if taken) and its category
  async function onDetailsClick(e) {
    const b = e.target.closest('[data-ai]'); if (!b) return; const it = chosen()[0]; if (!it || !it.ai) return; const w = it.ai[+b.dataset.ai];
    const base = w.word.charAt(0).toUpperCase() + w.word.slice(1), taken = new Set(items.filter((x) => x.id !== it.id).map((x) => x.name.toLowerCase())); let nm = base; for (let k = 2; taken.has(nm.toLowerCase()); k++) nm = `${base}_${String(k).padStart(3, '0')}`;
    it.name = nm; it.category = w.category; it.checked = true; await L.put(it); await teach(it); await reload();
  }
  $('details').addEventListener('click', onDetailsClick);
  // ------------------------------------------------------------------ Properties as a window, and right-click menus
  // The same properties as the panel on the right, in a window of their own (Alt+Enter, or Properties… on the menu):
  // it follows what is chosen and changes the same way.
  let propsBox = null;
  function openProps(focus) {
    if (!sel.size) return toast('Choose a picture first.');
    if (!propsBox) {
      propsBox = document.createElement('div'); propsBox.className = 'lists-dlg props-dlg'; propsBox.setAttribute('role', 'dialog'); propsBox.setAttribute('aria-label', 'Properties');
      propsBox.innerHTML = `<div class="lists-in props-in"><div class="lists-head"><b>Properties</b><span class="grow"></span><button class="btn outline" type="button" data-c="close">Close</button></div><div class="props-body side"></div></div>`;
      const body = propsBox.querySelector('.props-body'); body.addEventListener('change', onDetailsChange); body.addEventListener('click', onDetailsClick);
      propsBox.addEventListener('click', (e) => { if (e.target.closest('[data-c=close]') || e.target === propsBox) closeProps(); });
      propsBox.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeProps(); } });
      document.body.append(propsBox);
    }
    propsBox.hidden = false; syncProps();
    const f = propsBox.querySelector(`[data-f=${focus || 'name'}]`) || propsBox.querySelector('select, input'); if (f) { f.focus(); if (f.select) f.select(); }
  }
  function closeProps() { if (propsBox) propsBox.hidden = true; }
  function syncProps() { if (!propsBox || propsBox.hidden) return; if (!sel.size) return closeProps(); const y = propsBox.querySelector('.props-body').scrollTop; propsBox.querySelector('.props-body').innerHTML = $('details').innerHTML; propsBox.querySelector('.props-body').scrollTop = y; }
  // right-click a picture (or a file in the working area): what can be done to it, like the panel and the ribbon
  $('grid').addEventListener('contextmenu', (e) => {
    const t = e.target.closest('.tile'); if (!t || !window.CraftMenu) return; e.preventDefault();
    const id = t.dataset.id; if (!sel.has(id)) { sel = new Set([id]); last = id; render(); }
    const n = sel.size, one = n === 1, them = one ? 'it' : `these ${n}`;
    if (cat === '#work') return CraftMenu.show(e.clientX, e.clientY, [
      { label: one ? 'Import it again…' : `Import these ${n} again…`, run: () => act('work-import') }, { label: 'Slice it…', run: () => act('work-slice'), disabled: !one },
      { label: 'Save the file…', run: () => act('work-dl'), disabled: !one }, '-', { label: `Delete ${them}`, key: 'Del', danger: true, run: () => act('work-del') }]);
    const S = chosen(), it = S[0], move = (c) => async () => { for (const x of chosen()) { x.category = c; x.checked = true; await L.put(x); } await reload(); toast(c ? `Moved to “${c}”.` : 'Category taken off.'); };
    // what is known about it, first (its name, category and style; the set and place on the sheet it came from)
    const info = one ? [{ info: it.name, strong: true }, { info: [it.category || 'Not sorted yet', it.style, it.form].filter(Boolean).join(' · ') }, ...(it.collection || it.place ? [{ info: [it.collection && `from “${it.collection}”`, it.place].filter(Boolean).join(' · ') }] : []), ...((it.tags || []).length ? [{ info: `Tags: ${it.tags.slice(0, 8).join(', ')}` }] : [])]
      : [{ info: `${n} chosen`, strong: true }, { info: [...new Set(S.map((x) => x.category || 'Not sorted yet'))].slice(0, 3).join(', ') }];
    CraftMenu.show(e.clientX, e.clientY, [...info, '-',
      { label: 'Properties…', key: 'Alt+Enter', run: () => openProps() }, { label: 'Rename…', key: 'F2', disabled: !one, run: () => openProps('name') },
      { label: 'Category', sub: [...KNOWN().map((c) => ({ label: c, checked: S.every((x) => x.category === c), run: move(c) })), '-', { label: 'Not sorted yet', run: move('') }] },
      '-', { label: one && it.ai ? 'Ask the AI again' : 'Ask the AI', run: () => act('ai-again') }, { label: 'Ask a cloud AI…', run: () => act('cloud-ask') },
      '-', { label: 'Copy', key: 'Ctrl+C', disabled: !one, run: () => act('copy') }, { label: 'Save as PNG…', disabled: !one || !it.png, run: () => act('dl-png') }, { label: 'Save as SVG…', disabled: !one || !it.svg, run: () => act('dl-svg') },
      { label: one ? 'Export it (ZIP)…' : `Export these ${n} (ZIP)…`, run: () => act('export-sel') },
      '-', { label: 'Select all', key: 'Ctrl+A', run: () => act('select-all') }, { label: `Delete ${them}`, key: 'Del', danger: true, run: () => act('delete') }]);
  });
  // right-click a category, a sheet or file, or a branch under one on the left: the same for all the pictures in it
  $('cats').addEventListener('contextmenu', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b || !window.CraftMenu) return; e.preventDefault(); const key = b.dataset.cat, label = b.querySelector('span')?.textContent || key;
    if (key === '#work') return CraftMenu.show(e.clientX, e.clientY, [{ label: 'Show the working area', run: () => { cat = key; sel.clear(); render(); } }, { label: 'Delete the used files…', disabled: !work.some((w) => w.used), run: () => act('work-del-used') }]);
    const keepCat = cat, keepQ = query; cat = key; query = ''; const list = shown(); cat = keepCat; query = keepQ; const n = list.length, them = `${n} picture${n === 1 ? '' : 's'}`;
    const use = (fn) => async () => { cat = key; sel = new Set(list.map((it) => it.id)); render(); await fn(); };
    const move = (c) => async () => { for (const it of list) { it.category = c; it.checked = true; await L.put(it); } await reload(); toast(c ? `${them} moved to “${c}”.` : `${them}: category taken off.`); };
    const src = key.startsWith('#src:') ? key.slice(5) : '', file = src && work.find((w) => w.name === src || (w.fileName || '').replace(/\.[^.]+$/, '') === src);
    CraftMenu.show(e.clientX, e.clientY, [
      { label: `Show ${label}`, run: () => { cat = key; sel.clear(); render(); } }, { label: `Choose all ${them}`, disabled: !n, run: use(async () => {}) },
      '-', { label: 'Move all to a category', disabled: !n, sub: [...KNOWN().map((c) => ({ label: c, checked: n && list.every((it) => it.category === c), run: move(c) })), '-', { label: 'Not sorted yet', run: move('') }] },
      { label: `Sort ${them} with AI`, disabled: !n, run: use(() => act('ai-again')) }, { label: 'Ask a cloud AI about them…', disabled: !n, run: use(() => act('cloud-ask')) },
      '-', { label: `Export ${them} (ZIP)…`, disabled: !n, run: use(() => act('export-sel')) }, ...(file ? [{ label: 'Slice the sheet again…', run: () => slicer(WA.fileOf(file)) }] : []),
      '-', { label: `Delete all ${them}…`, danger: true, disabled: !n, run: use(() => act('delete')) }]);
  });
  // A picture that is all dark (black line art, a black silhouette) is hard to see on the dark checkerboard: its tile
  // gets a light one instead. Worked out once per picture from its thumbnail.
  const darkOf = new Map();
  function isDark(img) {
    const c = document.createElement('canvas'), n = 32; c.width = c.height = n; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, n, n); const d = x.getImageData(0, 0, n, n).data; let k = 0, sum = 0, light = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; k++; sum += l; if (l > 150) light++; }
    return k > 8 && sum / k < 80 && light < k * 0.12;
  }
  function lightUp(root) {
    root.querySelectorAll('.tile[data-id] .pic img, .big.check-bg img').forEach((im) => {
      const host = im.parentElement, id = im.closest('[data-id]')?.dataset.id || (host.classList.contains('big') && sel.size === 1 ? [...sel][0] : '');
      const set = (v) => { host.classList.toggle('lit', !!v); }; if (id && darkOf.has(id)) return set(darkOf.get(id));
      const go = () => { try { const v = isDark(im); if (id) darkOf.set(id, v); set(v); } catch (err) { /* not readable */ } };
      if (im.complete && im.naturalWidth) go(); else im.addEventListener('load', go, { once: true });
    });
  }
  document.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || document.querySelector('.slicer:not([hidden]), .imp:not([hidden])')) return;
    if (e.key === 'F2' && sel.size === 1 && cat !== '#work') { e.preventDefault(); openProps('name'); }
    if (e.key === 'Enter' && e.altKey && sel.size && cat !== '#work') { e.preventDefault(); openProps(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && sel.size === 1 && cat !== '#work' && !String(getSelection())) { e.preventDefault(); act('copy'); }
  });
  document.addEventListener('click', (e) => { if (startOpen && e.target.closest('.start .tiles [data-act]')) { startOpen = false; $('start').hidden = true; } const c = e.target.closest('[data-copy]'); if (c) { navigator.clipboard.writeText(c.dataset.copy).then(() => toast('Link copied: paste it into any app or web page.')); return; } const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  // the clip-art server (optional): is it there?
  const busy = (m) => { const t = $('toast'); if (m) { t.textContent = m; t.hidden = false; clearTimeout(toast.t); } else t.hidden = true; };
  // ------------------------------------------------------------------ places: the clip-art servers this browser knows
  // Saved places (Home, This PC, Work, Away…) each with an address and its key; ClipArtCraft can use the first one that
  // answers when it opens, so the same copy works at home and at work. Kept in this browser (with the keys: typed by the user).
  const PLACES = 'clipartcraft-places';
  const places = () => { try { const v = JSON.parse(localStorage.getItem(PLACES) || 'null'); if (v && Array.isArray(v.list)) return v; } catch (e) { /* blocked */ } return { auto: true, list: [] }; };
  const savePlaces = (v) => { try { localStorage.setItem(PLACES, JSON.stringify(v)); } catch (e) { /* blocked */ } };
  const tidyUrl = (u) => { u = String(u || '').trim().replace(/\/+$/, ''); if (u && !/^https?:\/\//i.test(u)) u = 'http://' + u; return u; };
  const kindOf = (u) => { try { const h = new URL(u).hostname; return /^(localhost|127\.|\[?::1\]?$)/.test(h) ? 'this' : /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(h) || /\.(local|lan|home)$/.test(h) || !h.includes('.') ? 'lan' : /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h) || /\.ts\.net$/.test(h) ? 'tailnet' : 'web'; } catch (e) { return 'web'; } };
  const KIND = { this: 'this computer only', lan: 'its own network only (home or work)', tailnet: 'your Tailscale network', web: 'the internet' };
  // ask a place who it is (a couple of seconds at most)
  async function probe(url, key) {
    url = tidyUrl(url); if (!url) return { ok: false, why: 'No address' };
    if (location.protocol === 'https:' && url.startsWith('http:')) return { ok: false, why: 'blocked', note: 'This page is on https, so the browser will not let it talk to an http address.' };
    try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 2500); const r = await fetch(url + '/api/info', { headers: key ? { 'x-craft-key': key } : {}, signal: ctl.signal }); clearTimeout(t);
      const j = await r.json(); if (!j || !j.server) return { ok: false, why: 'Something answers, but it is not a clip-art server' }; return { ok: true, info: j }; }
    catch (e) { return { ok: false, why: 'No answer' }; }
  }
  // when ClipArtCraft opens: if the server in use does not answer, the first saved place that does
  async function autoPlace() {
    const P = places(); if (!P.auto || !P.list.length || serverOk) return;
    for (const pl of P.list) { const r = await probe(pl.url, pl.key); if (!r.ok) continue; await L.server(pl.url); await L.serverKey(pl.key || ''); await checkServer(); toast(`Connected to ${pl.name} (${pl.url}).`); return; }
  }
  function connectWindow() {
    const P = places(); let found = [];
    (async () => { const u = await L.server(); if (u && !P.list.some((pl) => tidyUrl(pl.url) === tidyUrl(u))) { P.list.push({ name: kindOf(u) === 'this' ? 'This computer' : kindOf(u) === 'lan' ? 'Home network' : 'My server', url: u, key: await L.serverKey() }); savePlaces(P); draw(); } })();
    const box = document.createElement('div'); box.className = 'lists-dlg'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Clip-art server');
    const state = new Map(); // url → probe result
    const where = location.protocol === 'file:' ? 'opened from files on this computer: it can use a server on this computer, on your network, or on the internet' : `opened from ${location.host}${location.protocol === 'https:' ? ' (https: only https servers can be used from here)' : ''}`;
    function stat(u) { const r = state.get(tidyUrl(u)); if (!r) return '<span class="cn-st wait">…</span>'; if (!r.ok) return `<span class="cn-st bad" title="${esc(r.note || '')}">✕ ${esc(r.why)}</span>`;
      const i = r.info; return `<span class="cn-st good">✓ answers</span> <span class="hint">${esc((i.libraries || []).map((l) => `${l.name}: ${l.database}`).join(', '))}${i.writable ? '' : ' · <b>needs its key to change things</b>'}</span>`; }
    // what to do, worked out from what answered
    function advice() {
      const out = [], rs = [...state.entries()], ok = rs.filter(([, r]) => r.ok), lanDown = P.list.filter((pl) => ['lan'].includes(kindOf(pl.url)) && state.get(tidyUrl(pl.url)) && !state.get(tidyUrl(pl.url)).ok);
      if (!rs.length) return '<li>Press <b>Look for servers</b>, or add a place with its address.</li>';
      if (!ok.length && !P.list.some((pl) => kindOf(pl.url) === 'this')) out.push('Nothing answers. To use this computer: start the server with <code>server/start-server.cmd</code> (it needs Node 22.5 or newer), then look again.');
      if (P.list.some((pl) => kindOf(pl.url) === 'this' && !(state.get(tidyUrl(pl.url)) || {}).ok)) out.push('The server on this computer does not answer: is it started (<code>server/start-server.cmd</code>)? Its window must stay open.');
      if (lanDown.length) out.push(`<b>${esc(lanDown.map((pl) => pl.name).join(', '))}</b> ${lanDown.length === 1 ? 'is' : 'are'} on a home or office network (an address like 192.168.x.x), which only works inside that network. Away from it (at work, travelling): add the address it has <b>on the internet</b> (the one you open it with from outside) as another place, and it is used wherever you are. If you would rather not have it open: a VPN into that network (your router’s, or the QNAP’s QVPN / WireGuard), <b>Tailscale</b>, or myQNAPcloud. Or keep working: the library stays in this browser, and <b>Sync</b> catches up when you are back.`);
      for (const [u, r] of ok) { const i = r.info, rc = i.reach || {};
        if (!i.writable) out.push(`<b>${esc(u)}</b> answers, but changing the library from here needs its key: it is on the server’s setup page (<a href="${esc(u)}/setup" target="_blank" rel="noopener">${esc(u)}/setup</a>, Key for apps). Paste it in the place’s Key.`);
        if (rc.kind === 'node' && !rc.shared && kindOf(u) === 'this') out.push(`The server on this computer is only for this computer. To use it from your other computers too, choose <b>Shared on the network</b> on its <a href="${esc(u)}/setup" target="_blank" rel="noopener">setup page</a> and start it again.`);
        const more = (rc.addresses || []).filter((a) => kindOf(a) !== 'this' && !P.list.some((pl) => tidyUrl(pl.url) === tidyUrl(a)));
        if (more.length) out.push(`From your other computers on the same network, the same server is at ${more.map((a) => `<code>${esc(a)}</code>`).join(' or ')} (add it as a place there).`); }
      if (location.protocol === 'https:' && P.list.some((pl) => pl.url.startsWith('http:'))) out.push('This page is on https, so it cannot use http servers: open ClipArtCraft from its files (or an http address), or give the server https.');
      if (ok.length && !out.length) out.push(`All good: <b>${esc(ok[0][0])}</b> answers${ok[0][1].info.writable ? ' and can be changed from here' : ''}.`);
      return out.map((x) => `<li>${x}</li>`).join('');
    }
    function draw() {
      const cur = tidyUrl(serverUrl);
      box.innerHTML = `<div class="lists-in conn-in"><div class="lists-head"><b>Clip-art server</b><span class="grow"></span><button class="btn outline" type="button" data-c="close">Close</button></div>
        <p class="hint">This ClipArtCraft is ${esc(where)}. ${cur ? `Now using <b>${esc(cur)}</b> (${serverOk ? 'answering' : 'not answering'}).` : 'Not using a server now: the library is kept in this browser.'}</p>
        <div class="cn-list">${P.list.map((pl, i) => `<div class="cn-row${tidyUrl(pl.url) === cur ? ' on' : ''}" data-i="${i}">
          <input class="input cn-name" data-f="name" value="${esc(pl.name)}" aria-label="Name" placeholder="Name (Home, Work…)">
          <input class="input cn-url" data-f="url" value="${esc(pl.url)}" aria-label="Address" placeholder="http://192.168.1.20:3370">
          <input class="input cn-key" data-f="key" type="password" autocomplete="off" value="${esc(pl.key || '')}" aria-label="Key" placeholder="Key (to change things)">
          <div class="cn-tools"><button class="btn ${tidyUrl(pl.url) === cur ? 'primary' : 'outline'} sm" type="button" data-c="use">${tidyUrl(pl.url) === cur ? 'In use' : 'Use'}</button><button class="btn ghost sm" type="button" data-c="up" ${i ? '' : 'disabled'} title="Try it earlier">↑</button><button class="btn ghost sm" type="button" data-c="del" title="Remove this place">✕</button></div>
          <div class="cn-stat">${stat(pl.url)} <span class="hint">· reaches ${KIND[kindOf(pl.url)]}</span></div></div>`).join('') || '<p class="hint">No places yet.</p>'}</div>
        <div class="btns"><button class="btn outline" type="button" data-c="add">+ Add a place</button><button class="btn outline" type="button" data-c="look">Look for servers</button><button class="btn ghost" type="button" data-c="none">Don’t use a server</button></div>
        ${found.length ? `<div class="cn-found"><b>Found</b>${found.map((u, i) => `<div class="cn-frow"><code>${esc(u)}</code> ${stat(u)} <button class="btn outline sm" type="button" data-found="${i}">Add as a place</button></div>`).join('')}</div>` : ''}
        <label class="check"><input type="checkbox" data-auto ${P.auto ? 'checked' : ''}> When ClipArtCraft opens, use the first place that answers (top to bottom): the same copy works at home and at work</label>
        <div class="cn-advice"><b>What to do</b><ul>${advice()}</ul></div>
        <details class="cn-help"><summary>Which server should the library live on?</summary><ul>
          <li><b>This computer</b> (<code>server/start-server.cmd</code>, Node): the simplest; only while this computer is on. Share it on the network to use it from your other computers.</li>
          <li><b>A NAS or web host</b> (like the QNAP: <code>clipart-server.php</code> with MariaDB or SQLite): always on; anyone on that network can use it, changes need the key.</li>
          <li><b>A small always-on box</b> (a Proxmox container or a Raspberry Pi running the Node server): always on, without a web host.</li>
          <li><b>Open on the internet</b>: the server reached directly at its internet address (a web host, or the NAS or this computer with its port open on the router). The simplest from anywhere: anyone can look, changing the library needs the key (user logins can come later). Add that address as a place.</li>
          <li><b>Kept private</b>: any of these reached through a VPN or Tailscale instead, so nothing is open to the internet.</li>
          <li><b>No server</b>: the library stays in this browser; Export and the folder buttons move it between computers.</li></ul></details></div>`;
    }
    async function probeAll(urls) { await Promise.all([...new Set(urls.map(tidyUrl).filter(Boolean))].map(async (u) => { state.set(u, await probe(u, (P.list.find((pl) => tidyUrl(pl.url) === u) || {}).key)); })); draw(); }
    box.addEventListener('input', (e) => { const row = e.target.closest('[data-i]'), f = e.target.dataset.f; if (row && f) { P.list[+row.dataset.i][f] = e.target.value; savePlaces(P); } if (e.target.matches('[data-auto]')) { P.auto = e.target.checked; savePlaces(P); } });
    box.addEventListener('change', (e) => { if (e.target.dataset.f === 'url' || e.target.dataset.f === 'key') { const pl = P.list[+e.target.closest('[data-i]').dataset.i]; pl.url = tidyUrl(pl.url); savePlaces(P); probeAll([pl.url]); } });
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-c], [data-found]'); if (!b) { if (e.target === box) box.remove(); return; }
      if (b.dataset.found !== undefined) { const u = found[+b.dataset.found]; P.list.push({ name: kindOf(u) === 'this' ? 'This computer' : kindOf(u) === 'lan' ? 'Home network' : 'Server', url: u, key: '' }); found = found.filter((x) => x !== u); savePlaces(P); draw(); return; }
      const c = b.dataset.c, i = +((b.closest('[data-i]') || {}).dataset || {}).i;
      if (c === 'close') { box.remove(); return; }
      if (c === 'add') { P.list.push({ name: '', url: '', key: '' }); savePlaces(P); draw(); box.querySelector('.cn-row:last-child .cn-name').focus(); return; }
      if (c === 'del') { P.list.splice(i, 1); savePlaces(P); draw(); return; }
      if (c === 'up') { const [x] = P.list.splice(i, 1); P.list.splice(i - 1, 0, x); savePlaces(P); draw(); return; }
      if (c === 'none') { await L.server(''); await checkServer(); draw(); toast('Not using a server now (the pictures stay here).'); return; }
      if (c === 'use') { const pl = P.list[i]; pl.url = tidyUrl(pl.url); if (!pl.url) return toast('Type its address first.'); savePlaces(P); await L.server(pl.url); await L.serverKey(pl.key || ''); await checkServer(true); await probeAll([pl.url]); return; }
      if (c === 'look') { b.disabled = true; b.textContent = 'Looking…';
        const cands = [...P.list.map((pl) => pl.url), 'http://localhost:3370', 'http://localhost:8790', ...(/^https?:$/.test(location.protocol) ? [location.origin, location.origin + '/clipartcraft/server/clipart-server.php', location.origin + '/server/clipart-server.php'] : [])];
        await probeAll(cands);
        // what answered can tell its other addresses
        const more = []; for (const [, r] of state) if (r.ok) for (const a of (r.info.reach || {}).addresses || []) more.push(a); if (more.length) await probeAll(more);
        found = [...state.entries()].filter(([u, r]) => r.ok && !P.list.some((pl) => tidyUrl(pl.url) === u)).map(([u]) => u); draw(); return; }
    });
    document.body.append(box); draw(); probeAll(P.list.map((pl) => pl.url));
  }
  async function checkServer(say) { serverUrl = await L.server(); serverOk = false; if (serverUrl) { try { const i = await L.serverInfo(); serverOk = true; if (say) toast(`Connected to the clip-art server (${i.libraries.map((l) => `${l.name}: ${l.database}`).join(', ')}).${i.writable ? '' : ' It can only be read from here.'}`); } catch (e) { if (say) toast(e.message); } } status(); }
  async function need() { if (!serverUrl) { await act('connect'); if (!serverUrl) throw new Error('Connect to a server first.'); } if (!serverOk) await checkServer(); if (!serverOk) throw new Error(`The clip-art server at ${serverUrl} did not answer (is it running?).`); }
  $('cats').onclick = (e) => { const t = e.target.closest('[data-tree]'); if (t) { const k = t.dataset.tree; if (openTree.has(k)) openTree.delete(k); else openTree.add(k); keepTree(); render(); return; } const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; sel.clear(); render(); };
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
        ['Sort', [B('Sort with AI', I.wand, () => act('sort-ai'), { big: true, title: 'The AI looks at each picture (the chosen ones, or every one not yet in a category) and gives it a category, style, form and tags, and a name where it only has a number' }), { col: [B('Ask a cloud AI', I.globe, () => act('cloud-ask'), { title: 'A cloud AI (Claude, Gemini, GPT or OpenRouter, with your own key) names and sorts the chosen pictures: for the ones the AI here gets wrong. Costs a little per picture', disabled: () => !sel.size }), B('Cloud AI settings…', I.gear, () => act('cloud-settings'), { title: 'Your own key for Claude, Gemini, GPT or OpenRouter, and which model to use' })] }]],
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
  // the user's own lists (categories with their words, styles, forms), kept in the shared store
  async function loadLists() { try { const l = await L.lists(); if (l && window.CraftNamer) CraftNamer.configure(l); } catch (e) { /* the starting lists */ } }
  function editLists() {
    const N = window.CraftNamer; if (!N) return; let l = N.lists(), tab = 'categories';
    const box = document.createElement('div'); box.className = 'lists-dlg'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Edit the lists');
    const paint = () => {
      box.innerHTML = `<div class="lists-in"><div class="lists-head"><b>The lists</b><div class="seg" role="group">${[['categories', 'Categories'], ['styles', 'Styles'], ['forms', 'Forms']].map(([k, t]) => `<button class="btn" type="button" data-tab="${k}" aria-pressed="${tab === k}">${t}</button>`).join('')}</div><span class="grow"></span><button class="btn outline" type="button" data-l="close">Close</button></div>
        ${tab === 'categories' ? `<p class="hint">Each category, and the words the AI knows for it (it picks the nearest word, and that word’s category). Add your own words: they are learnt the next time the AI is used (about half a minute).</p>
          <div class="lists-rows">${l.categories.map((c, i) => `<div class="lists-row" data-i="${i}"><input class="input" data-k="name" value="${esc(c.name)}" aria-label="Category name"><textarea class="input" data-k="words" rows="2" aria-label="Words for ${esc(c.name)}">${esc(c.words.join(', '))}</textarea><button class="btn ghost sm" type="button" data-l="del" title="Remove this category (its pictures become Not sorted yet)">✕</button></div>`).join('')}</div>
          <button class="btn outline" type="button" data-l="add">Add a category</button>`
        : `<p class="hint">One per line.</p><textarea class="input lists-one" data-k="${tab}" rows="14">${esc(l[tab].join('\n'))}</textarea>`}
        <label class="check"><input type="checkbox" data-describe ${describeOn() ? 'checked' : ''}> Describe each picture (Florence-2, about 250 MB once): better names for close things like a stagecoach and a wagon, a second or two per picture</label>
        <p class="hint" data-lessons>The AI also learns from your corrections (a name, category, style or form you change, or a guess you pick): pictures that look like a corrected one get your answer.</p>
        <div class="lists-foot"><button class="btn ghost" type="button" data-l="reset">Back to the starting lists</button><button class="btn ghost" type="button" data-l="forget">Forget my corrections</button><span class="grow"></span><button class="btn primary" type="button" data-l="save">Save the lists</button></div></div>`;
    };
    const read = () => { box.querySelectorAll('.lists-row').forEach((r) => { const c = l.categories[+r.dataset.i]; c.name = r.querySelector('[data-k=name]').value.trim(); c.words = r.querySelector('[data-k=words]').value.split(/[,\n]+/).map((w) => w.trim()).filter(Boolean); }); const one = box.querySelector('.lists-one'); if (one) l[one.dataset.k] = one.value.split('\n').map((w) => w.trim()).filter(Boolean); };
    box.addEventListener('change', (e) => { if (e.target.matches('[data-describe]')) { try { localStorage.setItem('clipartcraft-describe', e.target.checked ? '1' : '0'); } catch (err) { /* blocked */ } } });
    box.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-tab]'), b = e.target.closest('[data-l]');
      if (t) { read(); tab = t.dataset.tab; paint(); return; }
      if (!b) return; read();
      if (b.dataset.l === 'close') { box.remove(); return; }
      if (b.dataset.l === 'add') { l.categories.push({ name: 'New category', words: [] }); paint(); const rows = box.querySelectorAll('.lists-row'); const n = rows[rows.length - 1].querySelector('[data-k=name]'); n.focus(); n.select(); return; }
      if (b.dataset.l === 'del') { l.categories.splice(+b.closest('.lists-row').dataset.i, 1); paint(); return; }
      if (b.dataset.l === 'forget') { const n = (await L.lessons()).length; if (!n) return toast('There are no corrections to forget.'); if (!confirm(`Forget the ${n} correction${n === 1 ? '' : 's'} the AI has learnt from?`)) return; await L.lessons([]); toast('Forgotten. The AI goes by its own judgement again.'); return; }
      if (b.dataset.l === 'reset') { if (!confirm('Go back to the starting lists? (Your own categories and words are removed from the lists; pictures keep their category.)')) return; l = N.startingLists(); paint(); return; }
      if (b.dataset.l === 'save') { l.categories = l.categories.filter((c) => c.name); const seen = new Set(); l.categories = l.categories.filter((c) => !seen.has(c.name.toLowerCase()) && seen.add(c.name.toLowerCase()));
        N.configure({ ...l, removed: N.startingLists().categories.flatMap((c) => c.words).filter((w) => !l.categories.some((c) => c.words.map((x) => x.toLowerCase()).includes(w.toLowerCase()))) }); await L.lists(N.lists()); box.remove(); render(); toast(`Lists saved: ${l.categories.length} categories, ${l.styles.length} styles, ${l.forms.length} forms. Every Craft app sees them.`); }
    });
    document.body.append(box); paint();
  }
  // ------------------------------------------------------------------ a cloud AI for the hard ones (js/cloud.js)
  // Its answer is taken as a correction: the name (numbered if taken), category, style and form, and the AI here
  // learns from it, so pictures that look like it are named that way from now on.
  async function askCloud(list) {
    const C = window.CraftCloud, N = window.CraftNamer, lists = { categories: KNOWN(), styles: N ? N.STYLES : [], forms: N ? N.FORMS : [] };
    return L.guard(async () => {
      const taken = new Set(items.map((it) => it.name.toLowerCase())); let n = 0, done = 0;
      for (const it of list) {
        busy(`Asking ${C.NAMES[C.provider()]}: ${++n} of ${list.length}, ${it.name}…`);
        let src; try { src = it.png ? await createImageBitmap(it.png) : await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = L.svgUrl(it.svg); }); } catch (e) { continue; }
        const c = document.createElement('canvas'); c.width = src.width || 512; c.height = src.height || 512; c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
        let a; try { a = await C.look(c, lists); } catch (e) { busy(); if (!done) throw e; toast(`${done} done, then: ${e.message}`); return done; }
        if (!it.original) it.original = it.name;
        if (a.name) { taken.delete(it.name.toLowerCase()); let nm = a.name; for (let k = 2; taken.has(nm.toLowerCase()); k++) nm = `${a.name}_${String(k).padStart(3, '0')}`; it.name = nm; taken.add(nm.toLowerCase()); it.seen = a.name; }
        if (a.category) it.category = a.category; if (a.style) it.style = a.style; if (a.form) it.form = a.form;
        it.tags = [...new Set([...(it.tags || []), ...a.tags, ...(a.text ? [a.text.toLowerCase()] : [])])]; if (a.description) it.description = a.description;
        it.cloud = a.model; it.checked = true; await L.put(it); if (it.vec) await teach(it, true); done++;
      }
      const one = list.length === 1 ? list[0] : null;
      busy(); toast(one ? `${C.NAMES[C.provider()]} says: “${one.name}”${one.category ? ` in ${one.category}` : ''}.${one.vec ? ' The AI here will remember it.' : ''}` : `${done} picture${done === 1 ? '' : 's'} named and sorted by ${C.NAMES[C.provider()]}.`);
      return done;
    });
  }
  function cloudSettings(then) {
    const C = window.CraftCloud, s = C.settings(), fromIC = C.imageCraftKeys();
    const box = document.createElement('div'); box.className = 'lists-dlg'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cloud AI settings');
    box.innerHTML = `<div class="lists-in cloud-in"><div class="lists-head"><b>Cloud AI</b><span class="grow"></span><button class="btn outline" type="button" data-c="close">Close</button></div>
      <p class="hint">For pictures the AI in this browser gets wrong. A cloud AI looks much more closely (it reads signs and knows a stagecoach from a wagon), but it needs the internet and costs a little per picture on your own account. Your key stays in this browser and goes only to that company.</p>
      ${C.PROVIDERS.map((p) => `<label class="field"><span><input type="radio" name="cloud-p" value="${p}" ${C.provider() === p || (!C.provider() && p === 'anthropic') ? 'checked' : ''}> ${C.NAMES[p]}</span><input class="input" type="password" autocomplete="off" spellcheck="false" data-key="${p}" value="${esc(s.keys[p] || '')}" placeholder="${C.has(p) ? '' : 'Paste your key here'}"></label>`).join('')}
      ${Object.keys(fromIC).length ? `<button class="btn ghost sm" type="button" data-c="ic">Use the keys ImageCraft has (${Object.keys(fromIC).map((p) => C.NAMES[p].split(' ')[0]).join(', ')})</button>` : ''}
      <label class="field"><span>Model <small class="hint">(a quick, cheap one is picked if you leave it)</small></span><div class="cloud-model"><select class="input" data-model><option value="">Pick for me</option>${s.model ? `<option value="${esc(s.model)}" selected>${esc(s.model)}</option>` : ''}</select><button class="btn outline sm" type="button" data-c="models">List the models</button></div></label>
      <div class="lists-foot"><span class="grow"></span><button class="btn primary" type="button" data-c="save">Save</button></div></div>`;
    const read = () => { const keys = {}; box.querySelectorAll('[data-key]').forEach((i) => { keys[i.dataset.key] = i.value.trim(); }); const p = (box.querySelector('[name=cloud-p]:checked') || {}).value || ''; return { keys, provider: p, model: box.querySelector('[data-model]').value }; };
    box.addEventListener('change', (e) => { if (e.target.name === 'cloud-p') box.querySelector('[data-model]').innerHTML = '<option value="">Pick for me</option>'; });
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      if (b.dataset.c === 'close') { box.remove(); return; }
      if (b.dataset.c === 'ic') { Object.entries(fromIC).forEach(([p, k]) => { box.querySelector(`[data-key="${p}"]`).value = k; }); toast('Keys copied from ImageCraft: Save to keep them.'); return; }
      if (b.dataset.c === 'models') {
        const v = read(); C.set({ keys: v.keys, provider: v.provider }); if (!C.has(v.provider)) return toast('Paste a key for that one first.'); b.disabled = true; b.textContent = 'Asking…';
        try { const list = await C.models(v.provider); box.querySelector('[data-model]').innerHTML = '<option value="">Pick for me</option>' + list.map((m) => `<option value="${esc(m.id)}" ${m.id === v.model ? 'selected' : ''}>${esc(m.name)}</option>`).join(''); toast(`${list.length} models that can look at pictures.`); } catch (err) { fail(err); }
        b.disabled = false; b.textContent = 'List the models'; return;
      }
      if (b.dataset.c === 'save') { const v = read(); if (v.provider && !v.keys[v.provider]) v.provider = C.PROVIDERS.find((p) => v.keys[p]) || ''; C.set(v); box.remove(); render(); if (!C.ready()) return toast('No key saved: the cloud AI stays off.'); toast(`Cloud AI: ${C.NAMES[C.provider()]}.`); if (then) then(); }
    });
    document.body.append(box); (box.querySelector('[data-key]:placeholder-shown') || box.querySelector('[data-key]')).focus();
  }
  loadLists().then(reload).then(() => checkServer()).then(autoPlace).then(offerResume).catch(fail);
  window.ClipArtCraft = { reload, items: () => items };
})();
