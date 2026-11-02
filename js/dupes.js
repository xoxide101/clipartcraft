/* ClipArtCraft – Find copies (window.ClipArtDupes): pictures that are the same picture (a sheet sent twice, a picture
   imported again), in this browser's library or on the clip-art server. Each picture's fingerprint (a difference hash
   of its thumbnail, 64 bits, the importer's copy check) finds the ones that may be the same; a closer look (64 × 64,
   under 1.5% of it different) decides. Lettering (ANTIC, SALLY on one chip) keeps pictures apart.
   The same subject in another style (Same DNA) is a different picture and is not counted. In each group the best one is
   kept (an SVG, the largest, a real name) and the rest marked to remove; marks can be changed. Removing from the server
   needs its key. */
(function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const lum = (d, i) => (d[i + 3] < 128 ? 255 : 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]);
  function hashOf(img) { const c = document.createElement('canvas'); c.width = 9; c.height = 8; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, 9, 8); x.drawImage(img, 0, 0, 9, 8);
    const d = x.getImageData(0, 0, 9, 8).data; let h = ''; for (let y = 0; y < 8; y++) { let v = 0; for (let k = 0; k < 8; k++) v = (v << 1) | (lum(d, (y * 9 + k) * 4) > lum(d, (y * 9 + k + 1) * 4) ? 1 : 0); h += v.toString(16).padStart(2, '0'); } return h; }
  const hamming = (a, b) => { let n = 0; for (let i = 0; i < 16; i += 2) { let v = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16); while (v) { n += v & 1; v >>= 1; } } return n; };
  // a closer look: the picture at 64 × 64 in grey on white; two pictures are the same when almost none of it differs
  // (lettering on a chip, a face, is enough to tell two otherwise alike pictures apart)
  function fineOf(img) { const n = 64, c = document.createElement('canvas'); c.width = n; c.height = n; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, n, n); x.drawImage(img, 0, 0, n, n); const d = x.getImageData(0, 0, n, n).data, o = new Uint8Array(n * n); for (let i = 0; i < o.length; i++) o[i] = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]; return o; }
  const sameFine = (a, b) => { if (!a || !b) return false; let n = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 40) n++; return n < a.length * 0.015; };
  const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
  // groups of copies: the pictures given as { id, name, thumb, width, height, svg (bool), hash? }
  async function groupsOf(list, progress) {
    let n = 0; for (const p of list) { try { const im = await loadImg(p.thumb); if (!p.hash) p.hash = hashOf(im); p.fine = fineOf(im); } catch (e) { p.hash = p.hash || null; p.fine = null; } if (++n % 20 === 0 && progress) progress(n, list.length); }
    const ok = list.filter((p) => p.hash), parent = ok.map((_, i) => i), find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    // (an aspect that differs a lot is not the same picture, whatever the fingerprint says)
    const shape = (p) => (p.width && p.height ? p.width / p.height : 1);
    for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) if (hamming(ok[i].hash, ok[j].hash) <= 6 && Math.abs(Math.log(shape(ok[i]) / shape(ok[j]))) < 0.15 && sameFine(ok[i].fine, ok[j].fine)) parent[find(i)] = find(j);
    const by = new Map(); ok.forEach((p, i) => { const r = find(i); if (!by.has(r)) by.set(r, []); by.get(r).push(p); });
    const placeholder = (nm) => /_\d{3,}$|^clip art|^img[_ -]?\d|^\d+$/i.test(nm || '');
    return [...by.values()].filter((g) => g.length > 1).map((g) => g.sort((a, b) => (b.svg - a.svg) || (placeholder(a.name) - placeholder(b.name)) || ((b.width * b.height) - (a.width * a.height)) || a.name.localeCompare(b.name)));
  }
  function open({ where = 'local', list = [], remove, done, toast } = {}) {
    const back = document.createElement('div'); back.className = 'lists-dlg'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-label', 'Find copies');
    back.innerHTML = `<div class="lists-in dup-in"><div class="lists-head"><b>Find copies</b><span class="hint">${where === 'server' ? 'on the clip-art server' : 'in this browser'}</span><span class="grow"></span><button class="btn outline" type="button" data-d="close">Close</button></div><div class="dup-body"><p class="hint">Looking at ${list.length} pictures…</p></div></div>`;
    document.body.append(back); let groups = [], marks = new Set();
    const body = () => back.querySelector('.dup-body');
    const draw = () => {
      if (!groups.length) { body().innerHTML = `<p class="hint">No copies: every one of the ${list.length} pictures is different.</p>`; return; }
      const n = marks.size;
      body().innerHTML = `<p class="hint">${groups.length} picture${groups.length === 1 ? '' : 's'} with copies. The best of each (an SVG, the largest, a real name) is kept; the others are marked to remove. Click a picture to change its mark.</p>
        <div class="dup-list">${groups.map((g, gi) => `<div class="dup-row">${g.map((p) => `<button type="button" class="dup-pic${marks.has(p.id) ? ' gone' : ''}" data-p="${esc(p.id)}" title="${esc(p.name)}"><span class="pic"><img src="${esc(p.thumb)}" alt=""></span><small>${esc(p.name)}</small><small class="hint">${p.width || '?'} × ${p.height || '?'}${p.svg ? ' · SVG' : ''}</small><i>${marks.has(p.id) ? 'remove' : 'keep'}</i></button>`).join('')}</div>`).join('')}</div>
        <div class="lists-foot"><span class="hint">${n} marked to remove</span><span class="grow"></span><button class="btn primary" type="button" data-d="remove" ${n ? '' : 'disabled'}>Remove the ${n} marked${where === 'server' ? ' from the server' : ''}</button></div>`;
    };
    back.addEventListener('click', async (e) => {
      if (e.target === back || e.target.closest('[data-d=close]')) { back.remove(); return; }
      const p = e.target.closest('[data-p]'); if (p) { const id = p.dataset.p, g = groups.find((x) => x.some((y) => y.id === id)); if (marks.has(id)) marks.delete(id); else if (g.filter((y) => !marks.has(y.id)).length > 1) marks.add(id); else return toast && toast('Keep at least one of them.'); draw(); return; }
      const r = e.target.closest('[data-d=remove]'); if (r) { const ids = [...marks]; if (!confirm(`Remove ${ids.length} picture${ids.length === 1 ? '' : 's'}${where === 'server' ? ' from the server' : ' from this browser'}? (One of each stays.)`)) return; r.disabled = true; r.textContent = 'Removing…';
        try { if ((await remove(ids)) === false) { r.disabled = false; draw(); return; } toast && toast(`Removed ${ids.length} copies.`); back.remove(); done && done(); } catch (err) { toast && toast('Removing failed: ' + (err.message || err)); r.disabled = false; draw(); } }
    });
    (async () => { groups = await groupsOf(list, (n, t) => { body().innerHTML = `<p class="hint">Looking at ${n} of ${t} pictures…</p>`; }); marks = new Set(groups.flatMap((g) => g.slice(1).map((p) => p.id))); draw(); })().catch((e) => { body().innerHTML = `<p class="hint warn">${esc(e.message || e)}</p>`; });
  }
  window.ClipArtDupes = { open, groupsOf, hashOf, hamming };
})();
