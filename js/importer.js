/* Import pictures (window.ClipArtImporter): files of any kind (PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, TIFF, SVG, APNG and
   the classic formats js/formats.js reads) become clip art. Every page of a TIFF, every size in an icon and every frame
   of an animation is offered; each picture can be cropped, turned, cut into pictures (Montage Slicer), left out, and
   named (from the file name, by what is in it with AI, or numbered). Black-and-white pictures become ink on see-through
   so they show on any background; copies of pictures already in the library are spotted; textures are checked for
   whether they tile (stitch) seamlessly. The files themselves are kept in the working area until deleted.
     open({ files, toast, categories, done(made) }) */
(function () {
  'use strict';
  const L = window.CraftClipart, F = () => window.CraftFormats, N = () => window.CraftNamer, W = () => window.CraftWork;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const S = { naming: 'smart', base: '', category: '', bwInk: true, animKeep: true, skipCopies: true, keepSources: true, alsoServer: false, svg: 'auto', view: 'checker' };
  try { Object.assign(S, JSON.parse(localStorage.getItem('clipartcraft-import-2') || '{}'), { base: '', category: '' }); } catch (e) { /* blocked */ }
  const keep = () => { try { const { base, category, source, author, licence, ...rest } = S; localStorage.setItem('clipartcraft-import-2', JSON.stringify(rest)); } catch (e) { /* blocked */ } };
  let el = null, opts = {}, pages = [], files = [], cur = -1, busy = false, libHashes = null, aiState = '';

  // ------------------------------------------------------------------ pictures
  const canvasOf = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c; };
  const blobOf = (img) => new Promise((r) => canvasOf(img).toBlob(r, 'image/png'));
  function turned(img, rot, flip) {
    if (!rot && !flip) return img;
    const s = canvasOf(img), c = document.createElement('canvas'), q = rot % 2 === 1; c.width = q ? img.height : img.width; c.height = q ? img.width : img.height;
    const x = c.getContext('2d'); x.translate(c.width / 2, c.height / 2); x.rotate((rot * Math.PI) / 2); if (flip) x.scale(-1, 1); x.drawImage(s, -img.width / 2, -img.height / 2);
    return x.getImageData(0, 0, c.width, c.height);
  }
  function cropOf(img, r) { if (!r) return img; const x = Math.max(0, Math.round(r.x)), y = Math.max(0, Math.round(r.y)), w = Math.min(img.width - x, Math.round(r.w)), h = Math.min(img.height - y, Math.round(r.h)); if (w < 2 || h < 2) return img; return canvasOf(img).getContext('2d').getImageData(x, y, w, h); }
  const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  // what kind of picture: colour, grey (no colour), or black and white (two tones); and whether it is see-through already
  function kindOf(img) {
    const d = img.data; let n = 0, grey = 0, two = 0, clear = 0, darkBg = 0;
    const step = Math.max(4, Math.floor(d.length / 4 / 60000) * 4);
    for (let i = 0; i < d.length; i += step) { if (d[i + 3] < 250) clear++; if (d[i + 3] < 128) continue; n++; const c = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]), l = lum(d, i); if (c < 24) grey++; if (l < 70 || l > 185) two++; }
    // the background: the corners
    const W = img.width, H = img.height, corner = [0, W - 1, (H - 1) * W, H * W - 1].map((p) => lum(d, p * 4)); darkBg = corner.filter((v) => v < 90).length >= 3;
    const isGrey = n && grey / n > 0.97, kind = isGrey && two / n > 0.92 ? 'bw' : isGrey ? 'grey' : 'colour';
    return { kind, clear: clear / Math.max(1, d.length / step) > 0.02, darkBg };
  }
  // ink: black (or white) lines become the only thing there; the paper turns see-through
  function ink(img, darkBg, colour) {
    const o = new ImageData(img.width, img.height), s = img.data, d = o.data, [r, g, b] = colour;
    for (let i = 0; i < s.length; i += 4) { const l = lum(s, i), v = darkBg ? l : 255 - l, a = Math.max(0, Math.min(255, (v - 40) * 255 / 175)); d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = Math.round(a * s[i + 3] / 255); }
    return o;
  }
  function recolour(img, mode) {
    const o = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), d = o.data;
    for (let i = 0; i < d.length; i += 4) { const l = lum(d, i); if (mode === 'grey') d[i] = d[i + 1] = d[i + 2] = l; else if (mode === 'bw') d[i] = d[i + 1] = d[i + 2] = l < 128 ? 0 : 255; else if (mode === 'invert') { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } }
    return o;
  }
  // does it stitch? the opposite edges look like neighbours (a seamless tile) rather than strangers
  function seamless(img) {
    const W = img.width, H = img.height, d = img.data; if (W < 24 || H < 24) return false;
    const px = (x, y) => (y * W + x) * 4, diff = (a, b) => Math.abs(d[a] - d[b]) + Math.abs(d[a + 1] - d[b + 1]) + Math.abs(d[a + 2] - d[b + 2]);
    let lr = 0, near = 0, tb = 0, nearV = 0;
    for (let y = 0; y < H; y++) { lr += diff(px(0, y), px(W - 1, y)); near += diff(px(0, y), px(1, y)) + diff(px(W - 2, y), px(W - 1, y)); }
    for (let x = 0; x < W; x++) { tb += diff(px(x, 0), px(x, H - 1)); nearV += diff(px(x, 0), px(x, 1)) + diff(px(x, H - 2), px(x, H - 1)); }
    lr /= H; near /= 2 * H; tb /= W; nearV /= 2 * W;
    let flat = 0; for (let i = 0; i < d.length; i += 4 * 97) flat += diff(i, 0); flat /= d.length / 4 / 97;
    // plain edges (a picture on paper) match too, but are not a tile: something must change along the edges
    const spread = (pts) => { let lo = 1e9, hi = -1; for (const q of pts) { const v = lum(d, q); if (v < lo) lo = v; if (v > hi) hi = v; } return hi - lo; };
    const edges = [Array.from({ length: H }, (_, y) => px(0, y)), Array.from({ length: W }, (_, x) => px(x, 0))].map(spread);
    return flat > 12 && edges[0] > 20 && edges[1] > 20 && lr <= near * 1.6 + 6 && tb <= nearV * 1.6 + 6;
  }
  // a fingerprint for spotting copies (difference hash, 64 bits as 16 hex digits)
  function hashOf(src) {
    const c = document.createElement('canvas'); c.width = 9; c.height = 8; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 9, 8); x.drawImage(src instanceof ImageData ? canvasOf(src) : src, 0, 0, 9, 8);
    const d = x.getImageData(0, 0, 9, 8).data; let h = ''; for (let y = 0; y < 8; y++) { let v = 0; for (let k = 0; k < 8; k++) v = (v << 1) | (lum(d, (y * 9 + k) * 4) > lum(d, (y * 9 + k + 1) * 4) ? 1 : 0); h += v.toString(16).padStart(2, '0'); } return h;
  }
  const hamming = (a, b) => { let n = 0; for (let i = 0; i < 16; i += 2) { let v = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16); while (v) { n += v & 1; v >>= 1; } } return n; };
  async function libraryHashes() {
    if (libHashes) return libHashes;
    const out = []; for (const it of await L.all()) { let h = it.hash; if (!h && it.thumb) { try { const i = new Image(); i.src = it.thumb; await i.decode(); h = hashOf(i); it.hash = h; await L.put(it); } catch (e) { /* no thumb */ } } if (h) out.push({ h, name: it.name }); }
    return (libHashes = out);
  }
  // the picture as it will be added
  function result(p) {
    let img = cropOf(turned(p.orig, p.rot, p.flip), p.crop);
    const mode = p.mode === 'auto' ? (p.kind === 'bw' && S.bwInk && !p.clear ? 'ink' : 'keep') : p.mode;
    if (mode === 'ink') img = ink(img, p.darkBg, p.darkBg ? [255, 255, 255] : [0, 0, 0]); else if (mode === 'inkb' || mode === 'inkw') img = ink(img, p.darkBg, mode === 'inkw' ? [255, 255, 255] : [0, 0, 0]); else if (mode !== 'keep') img = recolour(img, mode);
    return img;
  }
  const modeName = (p) => (p.mode === 'auto' ? (p.kind === 'bw' && S.bwInk && !p.clear ? 'ink' : 'keep') : p.mode);

  // ------------------------------------------------------------------ reading files
  async function addFiles(list) {
    // many at once (a folder of thousands): the big import takes them (a batch at a time, with the size, the count and how it goes)
    if (list.length > 300 && opts.big) { close(); opts.big(list); return; }
    busy = true; render();
    for (const file of list) {
      if (/\.zip$/i.test(file.name)) { opts.toast && opts.toast(`${file.name}: a library ZIP is added with Import a library.`); continue; }
      let got; try { got = await F().pages(file); } catch (e) { opts.toast && opts.toast(`${file.name}: ${/jxl|jp2|j2k|jpx/i.test(file.name) ? 'this browser cannot read JPEG XL or JPEG 2000 yet' : e.message || 'could not be read'}`); continue; }
      if (S.keepSources && W()) W().add(file, { used: 0, pending: 'import' }).catch(() => {});
      const fi = files.push({ file, name: file.name, svgText: /\.svg$/i.test(file.name) || file.type === 'image/svg+xml' ? await file.text() : null }) - 1, base = N().fromFile(file.name);
      const list2 = got.animated && S.animKeep ? [{ ...got[0], label: `Animation · ${got.frames} frames`, anim: { blob: got.blob, frames: got.frames } }] : got;
      list2.forEach((g, k) => {
        // an icon holds the same picture at several sizes: the biggest is added, the rest can be ticked
        const kd = kindOf(g.img), icon = g.info && g.info.format === 'ICO' && list2.length > 1;
        pages.push({ id: pages.length, file: fi, label: g.label || '', orig: g.img, rot: 0, flip: false, crop: null, mode: 'auto', ...kd, include: !icon || k === 0, anim: g.anim || null,
          auto: base, name: '', typed: false, tags: [], category: '', style: '', form: '', svgText: files[fi].svgText && list2.length === 1 ? files[fi].svgText : null, multi: list2.length > 1, n: k + 1 });
      });
      if (cur < 0) cur = 0;
    }
    busy = false; await checks(); render(); if (S.naming === 'ai' || S.naming === 'smart') nameAll();
  }
  // copies and stitching, for every picture
  async function checks() {
    const lib = await libraryHashes();
    for (const p of pages) { if (p.hash) continue; const img = result(p); p.hash = hashOf(img); const d = lib.find((x) => hamming(x.h, p.hash) <= 4); p.dup = d ? d.name : ''; if (p.dup && S.skipCopies) p.include = false; p.seam = !p.clear && seamless(img); if (p.seam) { p.form = 'tile'; p.tags = [...new Set([...p.tags, 'seamless'])]; } }
  }
  // names by what is in them (CLIP, in the browser)
  async function nameAll() {
    if (!N()) return; aiState = 'loading'; render();
    try {
      await N().ready((got, total, what) => { aiState = what === 'words' ? `Learning the words… ${got} of ${total}` : `Getting the AI (once, about ${N().MB} MB)… ${Math.round(got / 1048576)} of ${Math.round(total / 1048576)} MB`; status(); });
      let k = 0; for (const p of pages) { k++; if (p.ai) continue; aiState = `Looking at ${k} of ${pages.length}…`; status(); p.ai = await N().name(result(p), { describe: (() => { try { return localStorage.getItem('clipartcraft-describe') !== '0'; } catch (e) { return true; } })(), lessons: await L.lessons() }); if (!p.seam) p.form = p.ai.form === 'tile' ? 'background' : p.ai.form; p.style = p.ai.style; p.category = p.ai.category; p.tags = [...new Set([...p.ai.tags, ...p.tags])]; renderCard(p); if (p.id === cur) renderSide(); }
      aiState = 'done';
      if (pages.some((p) => !p.ai)) return nameAll(); // cropped or turned while it was looking: look again
    } catch (e) { console.error(e); aiState = ''; opts.toast && opts.toast('The AI could not be used: ' + (e.message || e) + '. Names come from the file names.'); S.naming = 'file'; }
    render();
  }
  const nameFor = (p) => p.typed ? p.name : S.naming === 'base' ? (S.base.trim() || 'Clip art') : S.naming === 'ai' && p.ai ? p.ai.name : S.naming === 'smart' && !p.auto && p.ai ? p.ai.name : (p.auto || (p.ai && p.ai.name) || files[p.file].name.replace(/\.[^.]+$/, '') || 'Clip art');

  // ------------------------------------------------------------------ the window
  function build() {
    el = document.createElement('div'); el.className = 'slicer imp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Import pictures');
    el.innerHTML = `<div class="sl-bar"><b>Import pictures</b><span class="hint" id="imp-status"></span><span class="grow"></span><button class="btn outline" type="button" data-im="more">Add files…</button><button class="btn outline" type="button" data-im="close">Close</button></div>
      <div class="sl-main"><div class="imp-left"><div class="imp-tools" id="imp-tools"></div><div class="imp-stage" id="imp-stage"><canvas></canvas><div class="sl-empty"><button class="btn primary" type="button" data-im="more">Choose pictures…</button><p class="hint">or drop them here: PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, TIFF, SVG, APNG, TGA, PCX, IFF, Atari, C64, Spectrum and Mac pictures</p></div></div><div class="imp-strip" id="imp-strip" role="listbox" aria-label="Pictures to import"></div></div><aside class="sl-side side right" id="imp-side"></aside></div>`;
    el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('change', onChange);
    const st = el.querySelector('#imp-stage');
    st.addEventListener('pointerdown', dragStart);
    el.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    el.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); addFiles([...e.dataTransfer.files]); });
    el.addEventListener('dragenter', (e) => e.stopPropagation()); el.addEventListener('dragleave', (e) => e.stopPropagation());
    document.addEventListener('keydown', (e) => { if (!el || el.hidden || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight' && cur < pages.length - 1) { cur++; render(); } if (e.key === 'ArrowLeft' && cur > 0) { cur--; render(); } if (e.key === ' ' && pages[cur]) { e.preventDefault(); pages[cur].include = !pages[cur].include; render(); } });
    document.body.append(el);
  }
  const P = () => pages[cur];
  function render() { if (!el) return; renderTools(); renderStage(); renderStrip(); renderSide(); status(); }
  function status() {
    const s = el.querySelector('#imp-status'), n = pages.filter((p) => p.include).length;
    s.textContent = busy ? 'Reading…' : !pages.length ? 'Pictures, scans, icons, animations and sheets into the library' : `${n} of ${pages.length} to add${aiState && aiState !== 'done' ? ' · ' + aiState : ''}`;
    const b = el.querySelector('[data-im=add]'); if (b && !b.dataset.running) { b.disabled = !n; b.textContent = n ? `Add ${n} to the library` : 'Add to the library'; }
  }
  function renderTools() {
    const p = P(); el.querySelector('#imp-tools').innerHTML = !p ? '' : `
      <div class="seg" role="group" aria-label="Show it on">${[['checker', 'See-through'], ['white', 'White'], ['black', 'Black'], ['colour', 'Colour']].map(([k, l]) => `<button class="btn" type="button" data-view="${k}" aria-pressed="${S.view === k}">${l}</button>`).join('')}</div>
      <span class="sep"></span>
      <button class="btn outline" type="button" data-im="whole" ${p.crop ? '' : 'disabled'} title="Undo the crop">Whole picture</button>
      <button class="btn outline" type="button" data-im="trim" title="Crop to what is there (plain edges off)">Trim edges</button>
      <button class="btn outline" type="button" data-im="rot" title="Turn a quarter to the right">Turn</button>
      <button class="btn outline" type="button" data-im="flip" title="Mirror left to right">Flip</button>
      <span class="sep"></span>
      <button class="btn outline" type="button" data-im="cut" title="A sheet of several pictures: cut them apart with the Montage Slicer">Cut into pictures…</button>
      <span class="hint">Drag on the picture to crop it.</span>`;
  }
  const BG = { white: '#ffffff', black: '#000000', colour: '#3b82f6' };
  function renderStage() {
    const st = el.querySelector('#imp-stage'), c = st.querySelector('canvas'), p = P(); st.querySelector('.sl-empty').hidden = !!pages.length || busy; c.hidden = !p;
    st.dataset.bg = S.view; if (!p) return;
    const base = turned(p.orig, p.rot, p.flip), out = result(p); c.width = base.width; c.height = base.height; const x = c.getContext('2d');
    if (BG[S.view]) { x.fillStyle = BG[S.view]; x.fillRect(0, 0, c.width, c.height); } else x.clearRect(0, 0, c.width, c.height);
    const r = p.crop || { x: 0, y: 0, w: base.width, h: base.height };
    if (p.crop) { x.globalAlpha = 0.25; x.drawImage(canvasOf(base), 0, 0); x.globalAlpha = 1; }
    x.drawImage(canvasOf(out), Math.round(r.x), Math.round(r.y));
    if (p.crop) { const lw = Math.max(2, Math.round(Math.max(c.width, c.height) / 300)); x.lineWidth = lw; x.setLineDash([lw * 4, lw * 3]); x.strokeStyle = '#e63946'; x.strokeRect(r.x, r.y, r.w, r.h); }
  }
  function card(p) {
    const t = canvasOf(result(p)), k = Math.min(1, 120 / Math.max(t.width, t.height)), c = document.createElement('canvas'); c.width = Math.max(1, t.width * k); c.height = Math.max(1, t.height * k); c.getContext('2d').drawImage(t, 0, 0, c.width, c.height);
    const badges = [p.anim ? `▶ ${p.anim.frames} frames` : '', p.kind === 'bw' ? 'B&W' : p.kind === 'grey' ? 'Grey' : '', p.seam ? 'Seamless' : '', p.dup ? 'Copy' : '', p.cut ? `Cut: ${p.cut}` : ''].filter(Boolean);
    return `<button type="button" class="imp-card" role="option" data-pg="${p.id}" aria-selected="${p.id === cur}" data-off="${!p.include}" title="${esc(nameFor(p))}${p.dup ? ` · already in the library as “${esc(p.dup)}”` : ''}">
      <span class="pic check-bg"><img src="${c.toDataURL()}" alt=""></span><span class="nm">${esc(nameFor(p))}</span>
      <span class="sub">${esc(p.label || (p.multi ? '' : files[p.file].name))}</span>${badges.map((b) => `<i class="bdg">${esc(b)}</i>`).join('')}
      <input type="checkbox" class="inc" data-inc="${p.id}" ${p.include ? 'checked' : ''} title="Add this one" aria-label="Add this one"></button>`;
  }
  function renderStrip() { el.querySelector('#imp-strip').innerHTML = pages.map(card).join(''); const s = el.querySelector(`[data-pg="${cur}"]`); if (s) s.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  function renderCard(p) { const o = el.querySelector(`[data-pg="${p.id}"]`); if (o) o.outerHTML = card(p); }
  function renderSide() {
    const p = P(), cats = [...new Set([...(N() ? N().CATEGORIES : []), ...(opts.categories || [])])].map((c) => `<option value="${esc(c)}">`).join(''), styles = N() ? N().STYLES : [], forms = N() ? N().FORMS : [];
    const opt = (list, v) => ['', ...list].map((s) => `<option value="${esc(s)}" ${s === v ? 'selected' : ''}>${esc(s || '—')}</option>`).join('');
    el.querySelector('#imp-side').innerHTML = `<div class="props-head">This picture</div><div class="sec">${!p ? '<p class="hint">Choose pictures to import.</p>' : `
      <label class="check"><input type="checkbox" data-p="include" ${p.include ? 'checked' : ''}> Add this one</label>
      ${p.dup ? `<p class="hint warn">Looks like “${esc(p.dup)}”, already in the library.</p>` : ''}
      <label class="field"><span>Name</span><input class="input" data-p="name" value="${esc(nameFor(p))}"></label>
      <div class="two"><label class="field"><span>Style</span><select class="input" data-p="style">${opt(styles, p.style)}</select></label><label class="field"><span>Form</span><select class="input" data-p="form">${opt(forms, p.form)}</select></label></div>
      <label class="field"><span>Category <small class="hint">(empty: the one for all)</small></span><input class="input" data-p="category" list="imp-cats" value="${esc(p.category)}"></label>
      <label class="field"><span>Tags</span><input class="input" data-p="tags" value="${esc(p.tags.join(', '))}"></label>
      <label class="field"><span>Colours</span><select class="input" data-p="mode">${[['auto', `As found (${p.kind === 'bw' ? 'black and white' : p.kind === 'grey' ? 'grey' : 'colour'})`], ['keep', 'Keep as it is'], ['ink', 'Ink only (paper see-through)'], ['inkb', 'Ink only, black (for light backgrounds)'], ['inkw', 'Ink only, white (for dark backgrounds)'], ['grey', 'Greyscale'], ['bw', 'Black and white'], ['invert', 'Swap light and dark']].map(([k, l]) => `<option value="${k}" ${p.mode === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <p class="hint">${(() => { const o = result(p); return `${o.width} × ${o.height} pixels · ${/^ink/.test(modeName(p)) ? `${modeName(p) === 'inkw' || (modeName(p) === 'ink' && p.darkBg) ? 'white' : 'black'} ink on see-through` : p.kind}${p.seam ? ' · tiles seamlessly' : ''}${p.anim ? ` · moves (${p.anim.frames} frames)` : ''}`; })()}</p>`}</div>
      <div class="props-head">For all</div><div class="sec">
      <div class="field"><span>Names</span><div class="seg" role="group">${[['smart', 'Smart'], ['ai', 'By the AI'], ['file', 'File names'], ['base', 'One name']].map(([k, l]) => `<button class="btn" type="button" data-naming="${k}" aria-pressed="${S.naming === k}">${l}</button>`).join('')}</div></div>
      ${S.naming === 'base' ? `<label class="field"><span>Name <small class="hint">(the same names get _002, _003…)</small></span><input class="input" data-s="base" value="${esc(S.base)}" placeholder="Cat"></label>` : ''}
      ${S.naming === 'ai' || S.naming === 'smart' ? `<p class="hint">${S.naming === 'smart' ? 'A file name with real words is kept; pictures called IMG_2041 and the like are named by what is in them. ' : ''}${aiState === 'done' ? 'Each has a category, style, form and tags from the AI. Change any you like.' : aiState ? esc(aiState) : `The AI looks at each picture in this browser (nothing is uploaded). The first time it downloads about ${N() ? N().MB : 150} MB, then works offline.`}</p>` : '<p class="hint">Names that are the same get _002, _003… on the end.</p>'}
      <label class="field"><span>Category</span><input class="input" data-s="category" list="imp-cats" value="${esc(S.category)}" placeholder="${S.naming === 'ai' ? 'Each its own (from the AI)' : 'Animals, Holidays…'}"><datalist id="imp-cats">${cats}</datalist></label>
      <label class="field"><span>Who can see them</span><select class="input" data-s="privacy"><option value="" ${S.privacy !== 'me' ? 'selected' : ''}>Everyone</option><option value="me" ${S.privacy === 'me' ? 'selected' : ''}>Only me (on the server: only with your key)</option></select></label>
      <div class="two"><label class="field"><span>Source</span><input class="input" data-s="source" value="${esc(S.source || '')}" placeholder="the file’s name"></label><label class="field"><span>Author</span><input class="input" data-s="author" value="${esc(S.author || '')}"></label></div>
      <label class="field"><span>Licence</span><input class="input" data-s="licence" value="${esc(S.licence || '')}" placeholder="CC0, own work, for use with Office…"></label>
      <label class="check"><input type="checkbox" data-s="bwInk" ${S.bwInk ? 'checked' : ''}> Black-and-white pictures: ink only (white paper see-through)</label>
      <label class="check"><input type="checkbox" data-s="animKeep" ${S.animKeep ? 'checked' : ''}> Animations stay moving (off: each frame its own picture)</label>
      <label class="check"><input type="checkbox" data-s="skipCopies" ${S.skipCopies ? 'checked' : ''}> Leave out copies of pictures already in the library</label>
      <label class="field"><span>SVG too</span><select class="input" data-s="svg">${[['auto', 'For drawings (not photos)'], ['always', 'Always'], ['never', 'Never']].map(([k, l]) => `<option value="${k}" ${S.svg === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="check"><input type="checkbox" data-s="keepSources" ${S.keepSources ? 'checked' : ''}> Keep the files in the working area (delete them there later)</label>
      ${opts.server ? `<label class="check"><input type="checkbox" data-s="alsoServer" ${S.alsoServer ? 'checked' : ''}> Also send them to the clip-art server</label>` : ''}
      <button class="btn primary wide" type="button" data-im="add" disabled>Add to the library</button>
      <p class="hint">Space adds or leaves out the picture shown; ← → go through them.</p></div>`;
    status();
  }

  // ------------------------------------------------------------------ cropping by dragging on the picture
  let drag = null;
  function dragStart(e) {
    const p = P(), c = el.querySelector('#imp-stage canvas'); if (!p || e.target !== c) return;
    const r = c.getBoundingClientRect(), k = c.width / r.width, at = (ev) => ({ x: Math.max(0, Math.min(c.width, (ev.clientX - r.left) * k)), y: Math.max(0, Math.min(c.height, (ev.clientY - r.top) * k)) });
    drag = at(e); c.setPointerCapture(e.pointerId);
    const move = (ev) => { const b = at(ev); if (Math.abs(b.x - drag.x) < 4 && Math.abs(b.y - drag.y) < 4) return; p.crop = { x: Math.min(drag.x, b.x), y: Math.min(drag.y, b.y), w: Math.abs(b.x - drag.x), h: Math.abs(b.y - drag.y) }; renderStage(); };
    const up = () => { c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); drag = null; if (p.crop && (p.crop.w < 4 || p.crop.h < 4)) p.crop = null; p.hash = null; p.ai = null; checks().then(() => { renderCard(p); renderSide(); renderTools(); if (aiState === 'done') nameAll(); }); };
    c.addEventListener('pointermove', move); c.addEventListener('pointerup', up);
  }
  // crop to what is there: rows and columns that are see-through or the corner colour are taken off
  function trim(p) {
    const img = turned(p.orig, p.rot, p.flip), d = img.data, W = img.width, H = img.height, bg = [d[0], d[1], d[2], d[3]];
    const empty = (i) => d[i + 3] < 16 || (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) < 40 && Math.abs(d[i + 3] - bg[3]) < 40);
    let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!empty((y * W + x) * 4)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return; const pad = 2; p.crop = { x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), w: Math.min(W, x1 + pad + 1) - Math.max(0, x0 - pad), h: Math.min(H, y1 + pad + 1) - Math.max(0, y0 - pad) };
  }

  // ------------------------------------------------------------------ events
  async function onClick(e) {
    const a = e.target.closest('[data-im]'), v = e.target.closest('button[data-view]'), nm = e.target.closest('[data-naming]'), inc = e.target.closest('[data-inc]'), pg = e.target.closest('[data-pg]');
    if (inc) { const p = pages[+inc.dataset.inc]; p.include = inc.checked; renderCard(p); if (p.id === cur) renderSide(); e.stopPropagation(); return; }
    if (pg) { cur = +pg.dataset.pg; render(); return; }
    if (v) { S.view = v.dataset.view; keep(); renderTools(); renderStage(); return; }
    if (nm) { S.naming = nm.dataset.naming; keep(); renderStrip(); renderSide(); if ((S.naming === 'ai' || S.naming === 'smart') && aiState !== 'done' && aiState !== 'loading') nameAll(); return; }
    if (!a) return; const p = P();
    if (a.dataset.im === 'close') return close();
    if (a.dataset.im === 'more') return addFiles(await pick());
    if (a.dataset.im === 'add') return addAll(a);
    if (!p) return;
    if (a.dataset.im === 'whole') p.crop = null;
    if (a.dataset.im === 'trim') trim(p);
    if (a.dataset.im === 'rot') { p.rot = (p.rot + 1) % 4; p.crop = null; }
    if (a.dataset.im === 'flip') { p.flip = !p.flip; p.crop = null; }
    if (a.dataset.im === 'cut') return cutUp(p);
    p.hash = null; p.ai = null; await checks(); render(); if (aiState === 'done') nameAll();
  }
  function onInput(e) {
    const s = e.target.dataset.s, k = e.target.dataset.p, p = P();
    if (['base', 'category', 'source', 'author', 'licence'].includes(s)) { S[s] = e.target.value; if (s === 'base') renderStrip(); status(); }
    if (k === 'name' && p) { p.name = e.target.value; p.typed = !!e.target.value.trim(); renderCard(p); }
  }
  async function onChange(e) {
    const s = e.target.dataset.s, k = e.target.dataset.p, p = P();
    if (s && !['base', 'category', 'source', 'author', 'licence'].includes(s)) { S[s] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; keep();
      if (s === 'skipCopies') pages.forEach((q) => { if (q.dup) q.include = !S.skipCopies; });
      if (s === 'bwInk') pages.forEach((q) => { q.hash = null; });
      if (s === 'animKeep') opts.toast && opts.toast('Takes effect for files added from now on.');
      await checks(); render(); return; }
    if (!p || !k || k === 'name') return;
    if (k === 'include') p.include = e.target.checked;
    if (k === 'tags') p.tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
    if (k === 'category' || k === 'style' || k === 'form') p[k] = e.target.value.trim();
    if (k === 'mode') { p.mode = e.target.value; p.hash = null; await checks(); renderStage(); }
    renderCard(p); renderSide();
  }
  function pick() { return new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.accept = F().ACCEPT; i.onchange = () => ok([...i.files]); i.click(); }); }
  // a sheet of pictures: the Montage Slicer cuts it (the picture shown, as cropped and turned)
  async function cutUp(p) {
    const blob = await blobOf(cropOf(turned(p.orig, p.rot, p.flip), p.crop)), f = new File([blob], `${nameFor(p)}.png`, { type: 'image/png' });
    window.ClipArtSlicer.open({ file: f, toast: opts.toast, categories: opts.categories, done: async (made) => { p.include = false; p.cut = made.length; madeBySlicer.push(...made); const src = files[p.file]; src.used = (src.used || 0) + made.length; renderCard(p); renderSide(); opts.toast && opts.toast(`${made.length} pictures cut from it and added.`); } });
  }
  let madeBySlicer = [];

  // ------------------------------------------------------------------ adding to the library
  async function uniqueNames(list) {
    const taken = new Set((await L.all()).map((it) => it.name.toLowerCase())), out = [];
    for (const n0 of list) { const n = n0.trim() || 'Clip art', base = n.replace(/_\d{3,}$/, ''); let t = n; for (let k = 2; taken.has(t.toLowerCase()); k++) t = `${base}_${String(k).padStart(3, '0')}`; taken.add(t.toLowerCase()); out.push(t); }
    return out;
  }
  async function addAll(btn) {
    const todo = pages.filter((p) => p.include); if (!todo.length) return;
    btn.dataset.running = '1'; btn.disabled = true;
    try { await L.guard(() => addNow(btn, todo)); } finally { delete btn.dataset.running; status(); }
  }
  async function addNow(btn, todo) {
    try {
      // the files first (to the working area), so if the page is closed half way they can simply be imported again
      const srcOf = new Map();
      if (S.keepSources && W()) { btn.textContent = 'Keeping the files in the working area…'; for (const fi of new Set(todo.map((p) => p.file))) srcOf.set(fi, await W().add(files[fi].file, { used: 0 })); }
      const names = await uniqueNames(todo.map(nameFor)), made = [], perFile = new Map();
      for (let i = 0; i < todo.length; i++) {
        const p = todo[i]; btn.textContent = `Adding ${i + 1} of ${todo.length}: ${names[i]}…`; await wait(0);
        const img = result(p), png = await blobOf(img), drawing = p.style !== 'photo' && (p.kind !== 'colour' || p.style || (F().countColours ? F().countColours(img, 4096) <= 4096 : true));
        let svg = !p.crop && !p.rot && !p.flip && p.mode === 'auto' ? p.svgText : null;
        if (!svg && (S.svg === 'always' || (S.svg === 'auto' && drawing)) && window.CRAFT_RASTERTRACE && img.width * img.height <= 4e6) svg = (await L.traceMatched(img)).svg;
        const it = await L.makeItem({ name: names[i], category: S.category.trim() || p.category || '', tags: p.tags, png, svg, source: (S.source || '').trim() || files[p.file].name });
        Object.assign(it, { privacy: S.privacy === 'me' ? 'me' : '', author: (S.author || '').trim(), licence: (S.licence || '').trim() });
        Object.assign(it, { type: 'clipart', style: p.style || '', form: p.form || '', kind: /^ink/.test(modeName(p)) ? 'bw' : p.kind, hash: p.hash || hashOf(img) });
        if (p.anim) { it.anim = p.anim.blob; it.frames = p.anim.frames; }
        if (srcOf.has(p.file)) it.sheet = srcOf.get(p.file).id;
        made.push(await L.put(it)); perFile.set(p.file, (perFile.get(p.file) || 0) + 1);
      }
      // how many pictures each file gave (and the ones cut up with the slicer)
      if (S.keepSources && W()) { for (const [fi, n] of perFile) await W().add(files[fi].file, { used: n, pending: '' }); for (const f of files) if (!perFile.has(files.indexOf(f))) await W().add(f.file, { used: f.used || 0, pending: '' }); }
      if (S.alsoServer && opts.server) { btn.textContent = 'Sending to the server…'; try { await L.push(made); } catch (e) { opts.toast && opts.toast('Added here, but the server said: ' + e.message); } }
      const all = [...madeBySlicer, ...made]; reset(); close(); opts.done && opts.done(all);
    } catch (e) { console.error(e); opts.toast && opts.toast('Importing failed: ' + (e.message || e)); }
  }
  function reset() { pages = []; files = []; cur = -1; madeBySlicer = []; libHashes = null; if (aiState !== 'done') aiState = ''; }
  function open(o = {}) {
    opts = o; if (!el) build(); el.hidden = false; libHashes = null; render();
    if (o.files && o.files.length) addFiles(o.files);
  }
  function close() { if (el) el.hidden = true; }
  window.ClipArtImporter = { open, close, state: () => ({ pages: pages.map((p) => ({ name: nameFor(p), include: p.include, kind: p.kind, mode: modeName(p), seam: p.seam, dup: p.dup, anim: !!p.anim, label: p.label, category: p.category, style: p.style, form: p.form, tags: p.tags, crop: p.crop })), naming: S.naming, ai: aiState }), kindOf, seamless, hashOf };
})();
