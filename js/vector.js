/* ClipArtCraft – Edit the drawing (window.ClipArtVector): a picture's SVG edited as a drawing, its shapes and words
   chosen with a click and moved, sized, recoloured, put in front or behind, clipped to another shape or taken out.
   Save makes the drawing the master: the SVG is kept and the PNG drawn again from it at a whole number of pixels per
   unit (CraftClipart.svgPng), so the two always match.
     open(item, { toast, ask, mount, before, done(saved), back() })   close()   hide()   show()   isOpen()   item()
   Moving and sizing go into each shape's own transform, in the units of the drawing (arrow keys: 1 unit, Shift: 10). */
(function () {
  'use strict';
  const L = window.CraftClipart, NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const SHAPES = 'path, rect, circle, ellipse, line, polyline, polygon, text, image, use';
  const KIND = { path: 'shape', rect: 'rectangle', circle: 'circle', ellipse: 'ellipse', line: 'line', polyline: 'line', polygon: 'shape', text: 'words', image: 'picture', use: 'copy', g: 'group' };
  let el = null, item = null, opts = {}, root = null, units = { x: 0, y: 0, w: 100, h: 100 }, chosen = [], past = [], future = [], zoom = 1, clipNext = false, drag = null, clipN = 0;
  const toast = (m) => opts.toast && opts.toast(m);
  const art = () => el.querySelector('.vx-art'), over = () => el.querySelector('.vx-over'), desk = () => el.querySelector('.sl-desk');

  // ------------------------------------------------------------------ the drawing
  function load(svg) {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml'); let r = doc.documentElement;
    if (!r || r.nodeName !== 'svg' || doc.querySelector('parsererror')) throw new Error('This SVG could not be read.');
    r = document.importNode(r, true);
    const u = L.svgUnits(svg) || { w: parseFloat(r.getAttribute('width')) || 100, h: parseFloat(r.getAttribute('height')) || 100 };
    const v = (r.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number); units = v.length === 4 && v.every(isFinite) && v[2] > 0 ? { x: v[0], y: v[1], w: v[2], h: v[3] } : { x: 0, y: 0, w: u.w, h: u.h };
    if (!r.getAttribute('viewBox')) r.setAttribute('viewBox', `${units.x} ${units.y} ${units.w} ${units.h}`);
    // its own size kept to give back on Save (shown here at the size of the window)
    r.dataset.vxW = r.getAttribute('width') ?? ''; r.dataset.vxH = r.getAttribute('height') ?? '';
    const a = art(); a.innerHTML = ''; a.append(r); root = r; chosen = []; fit();
  }
  // the drawing as it will be saved: its own size again, nothing of the editor's left in it
  function text() {
    const c = root.cloneNode(true);
    for (const [k, d] of [['width', c.dataset.vxW], ['height', c.dataset.vxH]]) { if (d) c.setAttribute(k, d); else c.removeAttribute(k); }
    delete c.dataset.vxW; delete c.dataset.vxH; c.style.removeProperty('width'); c.style.removeProperty('height'); c.style.removeProperty('display'); if (!c.getAttribute('style')) c.removeAttribute('style');
    return new XMLSerializer().serializeToString(c);
  }
  const fitScale = () => { const d = desk(); return Math.max(0.01, Math.min((d.clientWidth - 48) / units.w, (d.clientHeight - 48) / units.h)); };
  function fit() { if (!root) return; const k = fitScale() * zoom; root.setAttribute('width', Math.round(units.w * k)); root.setAttribute('height', Math.round(units.h * k)); root.style.display = 'block'; art().style.width = Math.round(units.w * k) + 'px'; art().style.height = Math.round(units.h * k) + 'px'; marks(); status(); }

  // ------------------------------------------------------------------ undo
  function remember() { past.push(text()); if (past.length > 60) past.shift(); future = []; undoButtons(); }
  function back(from, to) { if (!from.length) return; to.push(text()); const keepZoom = zoom; load(from.pop()); zoom = keepZoom; fit(); panel(); undoButtons(); }
  const undo = () => back(past, future), redo = () => back(future, past);
  function undoButtons() { if (!el) return; el.querySelector('[data-vx=undo]').disabled = !past.length; el.querySelector('[data-vx=redo]').disabled = !future.length; }

  // ------------------------------------------------------------------ choosing
  const pickable = (t) => { if (!t || !root.contains(t) || t === root || t.closest('defs, clipPath, mask, pattern, symbol, marker')) return null; return t.closest('text') || (t.matches(SHAPES) ? t : null); };
  function choose(list) { chosen = list; marks(); panel(); }
  // the box round what is chosen, and its four corner handles (in the window's pixels over the drawing)
  function boxOf(list) { const a = art().getBoundingClientRect(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const e of list) { const b = e.getBoundingClientRect(); if (!b.width && !b.height) continue; x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom); } return x1 < x0 ? null : { x: x0 - a.left, y: y0 - a.top, w: x1 - x0, h: y1 - y0, sx: x0, sy: y0 }; }
  function marks() {
    const o = over(); if (!o || !root) return; const a = art(); o.setAttribute('width', a.clientWidth); o.setAttribute('height', a.clientHeight);
    const b = chosen.length ? boxOf(chosen) : null; if (!b) { o.innerHTML = ''; return; }
    const each = chosen.length > 1 ? chosen.map((e) => boxOf([e])).filter(Boolean).map((q) => `<rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" fill="none" stroke="#2563eb" stroke-dasharray="3 3"/>`).join('') : '';
    o.innerHTML = `${each}<rect x="${b.x - 1}" y="${b.y - 1}" width="${b.w + 2}" height="${b.h + 2}" fill="none" stroke="#2563eb" stroke-width="1.5"/>` +
      [['nw', b.x, b.y], ['ne', b.x + b.w, b.y], ['sw', b.x, b.y + b.h], ['se', b.x + b.w, b.y + b.h]].map(([k, x, y]) => `<rect class="vx-h" data-h="${k}" x="${x - 5}" y="${y - 5}" width="10" height="10" fill="#fff" stroke="#2563eb" stroke-width="1.5" style="cursor:${k === 'nw' || k === 'se' ? 'nwse' : 'nesw'}-resize"/>`).join('');
  }

  // ------------------------------------------------------------------ moving and sizing (into each shape's own transform)
  // a point or a step in the window's pixels, in the units of a shape's parent
  const parentCTM = (e) => (e.parentNode && e.parentNode.getScreenCTM ? e.parentNode.getScreenCTM() : root.getScreenCTM());
  const toParent = (e, x, y) => { const m = parentCTM(e).inverse(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };
  const stepIn = (e, dx, dy) => { const m = parentCTM(e).inverse(); return { x: m.a * dx + m.c * dy, y: m.b * dx + m.d * dy }; };
  const n3 = (v) => +v.toFixed(3);
  function moveBy(list, dx, dy, from) { for (const e of list) { const s = stepIn(e, dx, dy), t = from ? from.get(e) : e.getAttribute('transform') || ''; e.setAttribute('transform', `translate(${n3(s.x)} ${n3(s.y)})${t ? ' ' + t : ''}`); } }
  function sizeBy(list, ax, ay, kx, ky, from) { for (const e of list) { const o = toParent(e, ax, ay), t = from.get(e) || ''; e.setAttribute('transform', `translate(${n3(o.x)} ${n3(o.y)}) scale(${n3(kx)} ${n3(ky)}) translate(${n3(-o.x)} ${n3(-o.y)})${t ? ' ' + t : ''}`); } }
  function onDown(e) {
    if (!root || e.button !== 0) return; const h = e.target.closest && e.target.closest('.vx-h');
    if (h && chosen.length) { const b = boxOf(chosen), corner = h.dataset.h; drag = { kind: 'size', corner, b, from: new Map(chosen.map((q) => [q, q.getAttribute('transform') || ''])), before: text(), x: e.clientX, y: e.clientY }; e.preventDefault(); return; }
    const t = pickable(e.target);
    if (clipNext) { clipNext = false; el.classList.remove('vx-clipping'); if (t) clipTo(t); else toast('That is not a shape: nothing clipped.'); return; }
    if (!t) { if (!e.shiftKey) choose([]); return; }
    if (e.shiftKey) { chosen = chosen.includes(t) ? chosen.filter((q) => q !== t) : [...chosen, t]; marks(); panel(); return; }
    if (!chosen.includes(t)) { chosen = [t]; marks(); panel(); }
    drag = { kind: 'move', from: new Map(chosen.map((q) => [q, q.getAttribute('transform') || ''])), before: text(), x: e.clientX, y: e.clientY, moved: false }; e.preventDefault();
  }
  function onMove(e) {
    status(e);
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (drag.kind === 'move') { if (!drag.moved && Math.hypot(dx, dy) < 3) return; drag.moved = true; moveBy(chosen, dx, dy, drag.from); marks(); return; }
    // sizing from a corner: the opposite corner stays; the same in both ways unless Shift is held
    const b = drag.b, c = drag.corner, ax = c.includes('w') ? b.sx + b.w : b.sx, ay = c.includes('n') ? b.sy + b.h : b.sy;
    let kx = (c.includes('w') ? ax - e.clientX : e.clientX - ax) / Math.max(1, b.w), ky = (c.includes('n') ? ay - e.clientY : e.clientY - ay) / Math.max(1, b.h);
    kx = Math.max(0.02, kx); ky = Math.max(0.02, ky); if (!e.shiftKey) kx = ky = Math.max(kx, ky);
    sizeBy(chosen, ax, ay, kx, ky, drag.from); drag.moved = true; marks();
  }
  function onUp() { if (!drag) return; const d = drag; drag = null; if (d.moved) { past.push(d.before); if (past.length > 60) past.shift(); future = []; undoButtons(); panel(); } }
  function nudge(dx, dy) { if (!chosen.length) return; remember(); const k = root.getScreenCTM().a; moveBy(chosen, dx * k, dy * k); marks(); }

  // ------------------------------------------------------------------ the other changes
  function del() { if (!chosen.length) return; remember(); chosen.forEach((e) => e.remove()); choose([]); }
  function order(d) { if (!chosen.length) return; remember(); for (const e of d > 0 ? [...chosen].reverse() : chosen) { const p = e.parentNode; if (d > 0) { let n = e.nextElementSibling; if (n) p.insertBefore(n, e); } else { const n = e.previousElementSibling; if (n && n.tagName.toLowerCase() !== 'defs') p.insertBefore(e, n); } } marks(); }
  function group() { if (!chosen.length) return; const g = chosen[0].parentNode.closest('g'); if (!g || !root.contains(g)) return toast('It is not in a group.'); chosen = [g]; marks(); panel(); }
  function setAll(k, v) { if (!chosen.length) return; remember(); for (const e of chosen) { const list = e.tagName.toLowerCase() === 'g' ? [e, ...e.querySelectorAll(SHAPES)] : [e]; for (const q of list) { if (v === null || v === '') q.removeAttribute(k); else q.setAttribute(k, v); q.style.removeProperty(k); } } panel(); }
  // the blend modes (overlay, colour dodge...) mix with what was behind on the sheet; on a see-through picture they look wrong
  const blended = () => [...root.querySelectorAll('*')].filter((e) => e.style && e.style.mixBlendMode && e.style.mixBlendMode !== 'normal');
  function unblend(all) { const list = all ? blended() : chosen.flatMap((e) => [e, ...e.querySelectorAll('*')]).filter((e) => e.style && e.style.mixBlendMode); if (!list.length) return; remember(); list.forEach((e) => { e.style.removeProperty('mix-blend-mode'); if (!e.getAttribute('style')) e.removeAttribute('style'); }); panel(); toast(`${list.length} blend${list.length === 1 ? '' : 's'} taken off.`); }
  // what is chosen kept inside a shape clicked next (the flares on a disc that run past its edge): each wrapped in a group
  // clipped by a copy of that shape, placed where the shape is
  function clipTo(shape) {
    const keep = chosen.filter((e) => e !== shape && !e.contains(shape)); if (!keep.length) return toast('Choose what to keep inside first (not the shape itself).');
    remember(); let defs = root.querySelector(':scope > defs'); if (!defs) { defs = document.createElementNS(NS, 'defs'); root.prepend(defs); }
    const parts = shape.matches(SHAPES) ? [shape] : [...shape.querySelectorAll(SHAPES)];
    for (const e of keep) {
      const g = document.createElementNS(NS, 'g'); e.parentNode.insertBefore(g, e); g.append(e);
      const cp = document.createElementNS(NS, 'clipPath'); let id; do { id = `vx-clip-${++clipN}`; } while (root.querySelector('#' + id)); cp.id = id;
      const inv = g.getScreenCTM().inverse();
      for (const p of parts) { const c = p.cloneNode(false); c.removeAttribute('id'); for (const k of ['filter', 'style', 'fill', 'stroke', 'opacity', 'clip-path', 'mask']) c.removeAttribute(k); const m = inv.multiply(p.getScreenCTM()); c.setAttribute('transform', `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((v) => +v.toFixed(4)).join(' ')})`); if (p.tagName.toLowerCase() === 'text') c.textContent = p.textContent; cp.append(c); }
      defs.append(cp); g.setAttribute('clip-path', `url(#${id})`);
    }
    chosen = keep.map((e) => e.parentNode); marks(); panel(); toast(`Kept inside the shape: ${keep.length} part${keep.length === 1 ? '' : 's'}.`);
  }

  // ------------------------------------------------------------------ the side panel
  const hex = (c) => { if (!c || /^url|none/.test(c)) return '#000000'; const k = document.createElement('canvas').getContext('2d'); k.fillStyle = c; return /^#[0-9a-f]{6}$/i.test(k.fillStyle) ? k.fillStyle : '#000000'; };
  const attr = (e, k) => e.getAttribute(k) || e.style.getPropertyValue(k) || '';
  function panel() {
    const s = el && el.querySelector('.sl-side'); if (!s) return; const one = chosen.length === 1 ? chosen[0] : null, tag = one ? one.tagName.toLowerCase() : '', nb = blended().length;
    const fill = one ? attr(one, 'fill') : '', stroke = one ? attr(one, 'stroke') : '', sw = one ? attr(one, 'stroke-width') : '', op = one ? attr(one, 'opacity') : '';
    s.innerHTML = `<div class="props-head">Edit the drawing</div><div class="sec">
      ${!chosen.length ? `<p class="hint">Click a shape or words on the drawing to choose it; Shift+click to choose more. Drag to move, drag a corner to size (Shift: not in step), arrow keys move by 1 unit (Shift: 10). Delete takes it out.</p>
        <p class="hint">${units.w} × ${units.h} units. Save makes this drawing the picture: the SVG kept, the PNG drawn again from it.</p>` :
      `<p><b>${chosen.length === 1 ? esc(KIND[tag] || tag).replace(/^./, (c) => c.toUpperCase()) : `${chosen.length} chosen`}</b>${one && one.id ? ` <small class="hint">#${esc(one.id)}</small>` : ''}</p>
        <div class="btns"><button class="btn outline sm" type="button" data-vx="group" title="Choose the whole group this is part of">Select the group</button><button class="btn outline sm" type="button" data-vx="front" title="One step in front">Bring forward</button><button class="btn outline sm" type="button" data-vx="behind" title="One step behind">Send back</button><button class="btn outline sm" type="button" data-vx="delete" title="Take it out (Delete)">Delete</button></div>
        <label class="field"><span>Fill${/^url/.test(fill) ? ' <small class="hint">(a gradient now)</small>' : ''}</span><span class="vx-row"><input type="color" data-vp="fill" value="${hex(fill)}"><button class="btn ghost sm" type="button" data-vnone="fill">None</button></span></label>
        <label class="field"><span>Outline</span><span class="vx-row"><input type="color" data-vp="stroke" value="${hex(stroke)}"><input class="input" type="number" min="0" step="0.5" data-vp="stroke-width" value="${esc(sw)}" placeholder="width" style="width:80px"><button class="btn ghost sm" type="button" data-vnone="stroke">None</button></span></label>
        <label class="field"><span>Shown <small class="hint">(%, 100 = solid)</small></span><input class="input" type="number" min="0" max="100" step="5" data-vp="opacity" value="${op === '' ? 100 : Math.round(+op * 100)}"></label>
        ${tag === 'text' ? `<label class="field"><span>Words</span><input class="input" data-vp="text" value="${esc(one.textContent)}"></label><label class="field"><span>Size <small class="hint">(units)</small></span><input class="input" type="number" min="1" step="0.5" data-vp="font-size" value="${esc(attr(one, 'font-size') || parseFloat(getComputedStyle(one).fontSize) || '')}"></label>` : ''}
        <button class="btn outline" type="button" data-vx="clip" title="Keep what is chosen inside a shape you click next (colour drawn past a disc's edge, words off it)">Keep inside a shape…</button>
        ${chosen.some((e) => [e, ...e.querySelectorAll('*')].some((q) => q.style && q.style.mixBlendMode)) ? '<button class="btn outline" type="button" data-vx="unblend">No blend</button>' : ''}`}
      ${nb ? `<p class="hint">${nb} part${nb === 1 ? '' : 's'} of this drawing blend with what is behind them (made for the sheet's dark page), so the colours change on a see-through picture.</p><button class="btn outline sm" type="button" data-vx="unblend-all">Take all blends off</button>` : ''}
    </div>`;
  }
  function status(e) {
    const s = el && el.querySelector('.sl-status'); if (!s || !root) return; let at = '';
    if (e && e.clientX !== undefined) { const m = root.getScreenCTM().inverse(), x = m.a * e.clientX + m.c * e.clientY + m.e, y = m.b * e.clientX + m.d * e.clientY + m.f; if (x >= units.x && y >= units.y && x <= units.x + units.w && y <= units.y + units.h) at = ` · at ${x.toFixed(1)}, ${y.toFixed(1)}`; }
    s.textContent = `${units.w} × ${units.h} units${at} · zoom ${Math.round(fitScale() * zoom * 100)}%${chosen.length ? ` · ${chosen.length} chosen` : ''}`;
  }

  // ------------------------------------------------------------------ saving
  async function save(asCopy) {
    const svg = text(); el.querySelectorAll('[data-vx]').forEach((b) => { b.disabled = true; });
    try {
      const p = await L.svgPng(svg), fresh = await L.makeItem({ name: item.name, png: p.blob, svg }); let saved;
      if (asCopy) { saved = { ...item, ...fresh, id: fresh.id, name: item.name, edited: new Date().toISOString() }; for (const k of ['serverId', 'links', 'pngFirst', 'svgFirst', 'cutAt', 'cutAtFirst', 'changed', 'noSvg']) delete saved[k]; await L.put(saved); toast(`Saved as a copy of “${item.name}”.`); }
      else { if (!item.pngFirst) item.pngFirst = item.png; if (!item.svgFirst && item.svg) item.svgFirst = item.svg; Object.assign(item, { svg, png: p.blob, thumb: fresh.thumb, width: fresh.width, height: fresh.height, noSvg: false, edited: new Date().toISOString() }); if (item.serverId) item.changed = true; await L.put(item); saved = item; toast(`Saved “${item.name}”: the drawing and a ${p.width} × ${p.height} PNG drawn from it${item.serverId ? ' (Sync sends it to the server)' : ''}.`); }
      past = []; future = []; close(); if (opts.done) await opts.done(saved);
    } catch (e) { console.error(e); toast('Saving failed: ' + (e.message || e)); } finally { el.querySelectorAll('[data-vx]').forEach((b) => { b.disabled = false; }); undoButtons(); }
  }
  async function leave() {
    if (past.length && opts.ask) { const v = await opts.ask('Changes not saved', `The drawing of “${esc(item.name)}” has changes not saved.`, [{ label: 'Save', value: 'save', primary: true }, { label: 'Don’t save', value: 'leave' }, { label: 'Cancel', value: null }]); if (!v) return; if (v === 'save') return save(false); }
    past = []; future = []; close(); opts.back && opts.back();
  }

  // ------------------------------------------------------------------ the page
  function build() {
    el = document.createElement('div'); el.className = 'slicer editor vx'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Edit the drawing');
    el.innerHTML = `<div class="sl-bar"><b>Edit the drawing</b><span class="hint vx-name"></span><span class="grow"></span><button class="btn outline" type="button" data-vx="leave" title="Back to Touch up (the picture as pixels)">Back to Touch up</button><button class="btn outline" type="button" data-vx="copy">Save as a copy</button><button class="btn primary" type="button" data-vx="save" title="Keep this drawing as the picture: the SVG, and the PNG drawn from it">Save</button></div>
      <div class="sl-main"><div class="sl-left"><div class="imp-tools sl-tools" role="toolbar"><button class="btn outline" type="button" data-vx="undo" disabled title="Undo (Ctrl+Z)">↶ Undo</button><button class="btn outline" type="button" data-vx="redo" disabled title="Redo (Ctrl+Y)">↷ Redo</button><span class="sep"></span>
        <div class="seg" role="group"><button class="btn" type="button" data-vz="out">−</button><button class="btn" type="button" data-vz="fit">Fit</button><button class="btn" type="button" data-vz="in">+</button></div><span class="sep"></span>
        <button class="btn outline" type="button" data-vx="all" title="Choose every shape and word (Ctrl+A)">Choose all</button></div>
        <div class="sl-desk"><div class="vx-stage"><div class="vx-wrap"><div class="vx-art check-bg"></div><svg class="vx-over" xmlns="${NS}"></svg></div></div></div><div class="sl-status"></div></div><aside class="sl-side side right"></aside></div>`;
    const st = el.querySelector('.vx-stage');
    st.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', (e) => { if (el && !el.hidden) onMove(e); }); window.addEventListener('pointerup', () => onUp());
    el.addEventListener('click', (e) => {
      const z = e.target.closest('[data-vz]'); if (z) { zoom = z.dataset.vz === 'fit' ? 1 : Math.max(0.2, Math.min(20, zoom * (z.dataset.vz === 'in' ? 1.25 : 0.8))); fit(); return; }
      const n = e.target.closest('[data-vnone]'); if (n) return setAll(n.dataset.vnone, 'none');
      const b = e.target.closest('[data-vx]'); if (!b) return; const a = b.dataset.vx;
      if (a === 'undo') return undo(); if (a === 'redo') return redo(); if (a === 'save') return save(false); if (a === 'copy') return save(true); if (a === 'leave') return leave();
      if (a === 'all') { chosen = [...root.querySelectorAll(SHAPES)].filter((q) => pickable(q) === q); marks(); panel(); return; }
      if (a === 'group') return group(); if (a === 'front') return order(1); if (a === 'behind') return order(-1); if (a === 'delete') return del();
      if (a === 'unblend') return unblend(false); if (a === 'unblend-all') return unblend(true);
      if (a === 'clip') { if (!chosen.length) return; clipNext = true; el.classList.add('vx-clipping'); toast('Now click the shape to keep them inside (the disc, say).'); }
    });
    el.addEventListener('change', (e) => {
      const p = e.target.dataset.vp; if (!p || !chosen.length) return; const v = e.target.value;
      if (p === 'text') { remember(); chosen[0].textContent = v; marks(); return; }
      if (p === 'opacity') return setAll('opacity', +v >= 100 ? null : String(Math.max(0, +v) / 100));
      setAll(p, v); marks();
    });
    el.querySelector('.sl-desk').addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); zoom = Math.max(0.2, Math.min(20, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); fit(); }, { passive: false });
    window.addEventListener('resize', () => { if (el && !el.hidden) fit(); });
    document.addEventListener('keydown', (e) => {
      if (!el || el.hidden || !root || e.target.closest('input, textarea, select, .ask-in')) return; const k = e.key;
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); return undo(); }
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'y') { e.preventDefault(); return redo(); }
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'a') { e.preventDefault(); chosen = [...root.querySelectorAll(SHAPES)].filter((q) => pickable(q) === q); marks(); panel(); return; }
      if (k === 'Delete' || k === 'Backspace') { if (chosen.length) { e.preventDefault(); e.stopPropagation(); del(); } return; }
      if (k === 'Escape') { clipNext = false; el.classList.remove('vx-clipping'); choose([]); return; }
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k]; if (d && chosen.length) { e.preventDefault(); const s = e.shiftKey ? 10 : 1; nudge(d[0] * s, d[1] * s); }
    }, true);
  }
  function open(it, o = {}) {
    if (!it || !it.svg) return o.toast && o.toast('This picture has no drawing (SVG) to edit.');
    opts = o; item = it; if (!el) build(); if (o.mount) o.mount.insertBefore(el, o.before || null); else document.body.append(el);
    el.classList.toggle('embedded', !!o.mount); el.hidden = false; past = []; future = []; zoom = 1; clipNext = false; el.classList.remove('vx-clipping');
    el.querySelector('.vx-name').textContent = it.name;
    try { load(it.svg); } catch (e) { toast(e.message); return close(); }
    panel(); undoButtons(); requestAnimationFrame(fit);
  }
  function close() { if (el) el.hidden = true; item = null; root = null; chosen = []; }
  function hide() { if (el) el.hidden = true; }
  function show() { if (el && item) { el.hidden = false; fit(); } }
  window.ClipArtVector = { open, close, hide, show, isOpen: () => !!(el && !el.hidden && item), item: () => item, changed: () => past.length > 0, undo, redo, save, _choose: (sel) => { chosen = [...root.querySelectorAll(sel)]; marks(); panel(); return chosen.length; }, _text: () => text(), clipTo: (sel) => clipTo(root.querySelector(sel)), unblend };
})();
