/* Craft rail (window.CraftRail): a slim bar down the left of every Craft app, to go from one app to another.
     Top: the unified apps (one account; your work saved on the server too: AccountCraft, ShiftCraft, ICalCraft, ClipArtCraft,
          ImageCraft, BarcodeCraft).  Bottom: the other apps (they keep their work on this computer).
   Logged in on a web address, it shows the apps on that site your account may use (AccountCraft's api/apps); otherwise the
   usual list. The app you are in is marked. The bar folds to a thin edge (remembered). Each app keeps what it has as you
   work; going to another app first sends 'craft-leave' (apps that keep things on leaving do it then).
   Each app keeps its own copy (from AccountCraft): include it after craft-account.js. */
(function () {
  'use strict';
  if (window.CraftRail || window.top !== window) return;   // once, and not inside a frame
  const UNIFIED = [['accountcraft', 'AccountCraft', '👤', 'your account: people, companies, locations, keys'], ['shiftcraft', 'ShiftCraft', '📅', 'schedules'], ['icalcraft', 'ICalCraft', '🗓', 'calendars: check, change, share'], ['filecraft', 'FileCraft', '📁', 'your files from every app'], ['labelcraft', 'LabelCraft', '🏷', 'labels'], ['logocraft', 'LogoCraft', '🔰', 'logos and seals'], ['presscraft', 'PressCraft', '📰', 'signs, cards, newsletters'],
    ['clipartcraft', 'ClipArtCraft', '🖼', 'clip-art library'], ['imagecraft', 'ImageCraft', '🎨', 'pictures: restore, convert'], ['barcodecraft', 'BarcodeCraft', '▥', 'barcodes and QR codes'], ['sitecraft', 'SiteCraft', '🌐', 'web sites']];
  // ArtCraft's apps (storytold), each with the Craft bar round it: the account and My files
  const ARTCRAFT = [['wordcraft', 'WordCraft', '📝', 'documents'], ['deckcraft', 'DeckCraft', '🖥', 'slides'], ['pdfcraft', 'PdfCraft', '📄', 'PDF'], ['photocraft', 'PhotoCraft', '📷', 'photos'], ['vectorcraft', 'VectorCraft', '✒', 'vector drawing'], ['designcraft', 'DesignCraft', '✏', 'design'], ['gridcraft', 'GridCraft', '▦', 'grids and sheets'], ['cadcraft', 'CadCraft', '📐', 'CAD'], ['figcraft', 'FigCraft', '🧩', 'figures'], ['effectcraft', 'EffectCraft', '✨', 'effects'], ['filmcraft', 'FilmCraft', '🎬', 'film'], ['soundcraft', 'SoundCraft', '🎵', 'sound'], ['lightcraft', 'LightCraft', '💡', 'lighting'], ['materialcraft', 'MaterialCraft', '🧱', 'materials'], ['texturecraft', 'TextureCraft', '🪵', 'textures']];
  const OTHER = [['3dcraft', '3DCraft', '🧊', '3D titles and logos']];
  const W = 52, KEY = 'craft-rail';
  // where this app is, and where its neighbours are (a web address, or a folder on this computer)
  const parts = location.pathname.split('/'), file = /\.html?$/i.test(parts[parts.length - 1]) ? parts.pop() : (parts.pop(), ''), here = (parts[parts.length - 1] || '').toLowerCase();
  const all = UNIFIED.concat(ARTCRAFT, OTHER), me = all.find((a) => a[0] === here) ? here : (all.find((a) => location.pathname.toLowerCase().includes('/' + a[0] + '/')) || [''])[0];
  const baseOf = () => { const i = location.href.toLowerCase().lastIndexOf('/' + me + '/'); return i < 0 ? null : location.href.slice(0, i + 1); };
  const urlOf = (app) => { const b = baseOf(); if (!b) return null; return b + app + '/' + (location.protocol === 'file:' ? 'index.html' : ''); };
  // folded or open, remembered: phones and folded phones (narrower than 600) on their own, and folded at first there (the page needs the room)
  const SMALL = () => innerWidth < 600, FKEY = () => (SMALL() ? KEY + '-phone' : KEY);
  const foldedNow = () => { let v = null; try { v = localStorage.getItem(FKEY()); } catch (e) { /* blocked */ } return v ? v === 'folded' : SMALL(); };
  let folded = foldedNow(), wasSmall = SMALL();
  window.addEventListener('resize', () => { if (SMALL() === wasSmall) return; wasSmall = SMALL(); const f = foldedNow(); if (f !== folded) { folded = f; paint(); } });
  // wide: the bar opened out to show the apps' names (» / «, remembered); WW its width
  let wide = false; try { wide = localStorage.getItem(KEY + '-wide') === '1'; } catch (e) { /* blocked */ }
  const WW = 196;
  let allowed = null;   // the apps on this site your account may use (null: the usual list)
  const css = `.craft-rail{position:fixed;left:0;top:0;bottom:0;width:${W}px;z-index:2400;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 0;background:#14151b;border-right:1px solid #2c2f3a;font:12px/1.2 "Segoe UI",system-ui,sans-serif;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#3a3e4c transparent;overscroll-behavior:contain;touch-action:pan-y}
.craft-rail::-webkit-scrollbar{width:5px}.craft-rail::-webkit-scrollbar-thumb{background:#3a3e4c;border-radius:3px}.craft-rail a{position:relative;display:grid;place-items:center;width:40px;height:38px;border-radius:9px;text-decoration:none;font-size:19px;color:#e8e9ee;flex:none}
.craft-rail a:hover{background:#2a2d38}.craft-rail a.on{background:#2f5bea;box-shadow:0 0 0 1px #6f8ff5 inset}.craft-rail a.off{opacity:.35;cursor:default}
.craft-rail .sep{flex:1 1 12px;min-height:12px}.craft-rail .lbl{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#7d8394;margin:6px 0 2px;text-align:center;line-height:1.1}
.craft-rail .ends{display:flex;gap:2px;flex:none}.craft-rail .ends .fold{width:19px}.craft-rail.wide{width:${WW}px;align-items:stretch;padding:6px 8px}.craft-rail.wide .ends{justify-content:space-between}.craft-rail.wide .ends .fold{width:30px}
.craft-rail .nm{display:none}.craft-rail.wide a{width:auto;grid-template-columns:28px 1fr;justify-items:start;gap:8px;padding:0 8px;font-size:18px}.craft-rail.wide a .nm{display:block;font-size:13px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.craft-rail.wide a .nm small{display:block;font-size:10.5px;color:#9aa0b0;overflow:hidden;text-overflow:ellipsis}.craft-rail.wide a.on .nm small{color:#dfe6ff}.craft-rail.wide a .tip{display:none!important}.craft-rail.wide .lbl{text-align:left;padding-left:8px}
.craft-rail .fold{width:40px;height:22px;border:0;border-radius:7px;background:none;color:#7d8394;cursor:pointer;font-size:13px}.craft-rail .fold:hover{background:#2a2d38;color:#e8e9ee}
.craft-rail a .tip{display:none;position:fixed;left:${W + 4}px;padding:4px 9px;border-radius:7px;background:#000d;color:#fff;white-space:nowrap;font-size:12.5px;pointer-events:none;z-index:2401}
.craft-rail a:hover .tip{display:block}.craft-rail-tab{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:2400;width:12px;height:56px;touch-action:manipulation;border:0;border-radius:0 7px 7px 0;background:#2f5bea;color:#fff;cursor:pointer;padding:0;font-size:11px}
html.craft-railed body{margin-left:var(--craft-rail,0px)!important}
/* the apps' start pages (What do you want to make?) cover the window: they begin right of the bar, and on tablets and phones everything on them is 10% smaller */
html.craft-railed :is(#start.start,#lc-start.lc-start){left:var(--craft-rail,0px)!important}
@media (max-width:1100px){:is(#start.start,#lc-start.lc-start)>*{zoom:.9}}
@media (pointer:coarse){.craft-rail-tab{width:18px;height:64px;font-size:14px}}
@media print{.craft-rail,.craft-rail-tab{display:none!important}html.craft-railed body{margin-left:0!important}}`;
  function paint() {
    document.querySelectorAll('.craft-rail, .craft-rail-tab').forEach((x) => x.remove());
    if (!document.getElementById('craft-rail-css')) { const s = document.createElement('style'); s.id = 'craft-rail-css'; s.textContent = css; document.head.append(s); }
    document.documentElement.classList.add('craft-railed');
    document.documentElement.style.setProperty('--craft-rail', folded ? '0px' : (wide ? WW : W) + 'px');
    if (folded) { const t = document.createElement('button'); t.className = 'craft-rail-tab'; t.title = 'Craft apps'; t.textContent = '›'; t.onclick = () => setFold(false); document.body.append(t); return; }
    const bar = document.createElement('nav'); bar.className = 'craft-rail' + (wide ? ' wide' : ''); bar.setAttribute('aria-label', 'Craft apps');
    const link = ([id, name, ic, what]) => { const a = document.createElement('a'), u = urlOf(id), may = !allowed || allowed.includes(id) || id === 'accountcraft';
      a.className = (id === me ? 'on' : '') + (may ? '' : ' off'); a.innerHTML = `${ic}<span class="nm">${name}${what ? `<small>${what}</small>` : ''}</span><span class="tip">${name}${what ? ' · ' + what : ''}${id === me ? ' (here)' : !may ? ' (not on this site, or not for your account)' : ''}</span>`;
      a.setAttribute('aria-label', name); if (u && id !== me && may) a.href = u; else a.removeAttribute('href');
      a.onclick = (e) => { if (!a.href || id === me) { e.preventDefault(); return; } window.dispatchEvent(new CustomEvent('craft-leave', { detail: { to: id } })); };
      return a; };
    const lbl = (t) => { const d = document.createElement('div'); d.className = 'lbl'; d.textContent = t; return d; };
    const fold = document.createElement('button'); fold.className = 'fold'; fold.title = 'Fold the apps bar away'; fold.textContent = '‹'; fold.onclick = () => setFold(true);
    const widen = document.createElement('button'); widen.className = 'fold'; widen.title = wide ? 'Narrow: icons only' : 'Open out: the apps with their names'; widen.textContent = wide ? '«' : '»'; widen.onclick = () => setWide(!wide);
    const ends = document.createElement('div'); ends.className = 'ends'; ends.append(fold, widen);
    const show = (list) => list.filter(([id]) => !allowed || allowed.includes(id) || id === me || id === 'accountcraft');
    bar.append(ends, lbl('One account'), ...show(UNIFIED).map(link), Object.assign(document.createElement('div'), { className: 'sep' }), lbl('ArtCraft apps'), ...show(ARTCRAFT).map(link), Object.assign(document.createElement('div'), { className: 'sep' }), lbl('Other apps'), ...show(OTHER).map(link));
    document.body.append(bar);
  }
  function setWide(f) { wide = f; try { localStorage.setItem(KEY + '-wide', f ? '1' : '0'); } catch (e) { /* blocked */ } paint(); window.dispatchEvent(new Event('resize')); }
  function setFold(f) { folded = f; try { localStorage.setItem(FKEY(), f ? 'folded' : 'open'); } catch (e) { /* blocked */ } paint(); window.dispatchEvent(new Event('resize')); }
  // the apps on this site (logged in, on a web address): only those that are there and that your account may use
  async function learn() {
    const A = window.CraftAccount; if (!A || !A.user || !A.user() || !/^https?:/.test(location.protocol)) { allowed = null; return paint(); }
    try { const r = await A.api('GET', 'apps'), mine = A.user().apps; allowed = (r.apps || []).filter((a) => !mine || mine.includes(a)).concat(['accountcraft', me]); } catch (e) { allowed = null; }
    paint();
  }
  const go = () => { paint(); learn(); window.addEventListener('craft-account', learn); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  window.CraftRail = { UNIFIED, ARTCRAFT, OTHER, fold: setFold, wide: setWide, refresh: learn };
})();
