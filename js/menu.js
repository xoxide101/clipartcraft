/* ClipArtCraft – right-click menus (window.CraftMenu), the way Windows and Office show them: under the mouse, kept on
   the screen, a line between groups, greyed-out items that cannot be used now, ▸ for a list that opens beside it, and
   the keyboard short cut on the right. Closed by a click elsewhere, Escape, scrolling or the window losing focus.
     CraftMenu.show(x, y, [{ label, run, key, disabled, danger, checked, sub: [...] }, { info: 'a line of information', strong }, '-', …]) */
(function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let open = [];
  function close() { open.forEach((m) => m.remove()); open = []; }
  function place(m, x, y, beside) {
    document.body.append(m); const r = m.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    if (x + r.width > W - 4) x = beside ? beside.left - r.width + 2 : W - r.width - 4;
    if (y + r.height > H - 4) y = Math.max(4, H - r.height - 4);
    m.style.left = `${Math.max(4, x)}px`; m.style.top = `${Math.max(4, y)}px`;
  }
  function build(items, level) {
    const m = document.createElement('div'); m.className = 'ctx-menu'; m.setAttribute('role', 'menu');
    m.innerHTML = items.map((it, i) => it === '-' ? '<div class="ctx-sep" role="separator"></div>' : it.info !== undefined ? `<div class="ctx-info${it.strong ? ' strong' : ''}">${esc(it.info)}</div>`
      : `<button type="button" role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}${it.sub ? ' has-sub' : ''}" ${it.disabled ? 'disabled' : ''}><span class="ctx-tick">${it.checked ? '✓' : ''}</span><span class="ctx-label">${esc(it.label)}</span><span class="ctx-key">${it.sub ? '▸' : esc(it.key || '')}</span></button>`).join('');
    const subOf = (b) => { const it = items[+b.dataset.i]; open.slice(level + 1).forEach((x) => x.remove()); open = open.slice(0, level + 1);
      if (it && it.sub && !it.disabled) { const s = build(it.sub, level + 1), r = b.getBoundingClientRect(); open.push(s); place(s, r.right - 2, r.top - 4, r); } };
    m.addEventListener('pointerover', (e) => { const b = e.target.closest('button'); if (b && !b.disabled) { b.focus(); subOf(b); } });
    m.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; const it = items[+b.dataset.i]; if (it.sub) return subOf(b); close(); if (it.run) it.run(); });
    m.addEventListener('keydown', (e) => {
      const bs = [...m.querySelectorAll('button:not([disabled])')], i = bs.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); bs[(i + (e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length]?.focus(); }
      else if (e.key === 'ArrowRight' && document.activeElement?.classList.contains('has-sub')) { e.preventDefault(); subOf(document.activeElement); open[level + 1]?.querySelector('button:not([disabled])')?.focus(); }
      else if (e.key === 'ArrowLeft' && level > 0) { e.preventDefault(); m.remove(); open = open.slice(0, level); open[level - 1].querySelector('button:focus, button')?.focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    return m;
  }
  function show(x, y, items) {
    close(); const list = items.filter((it, i, a) => it !== '-' || (i > 0 && i < a.length - 1 && a[i - 1] !== '-')); if (!list.length) return;
    const m = build(list, 0); open.push(m); place(m, x, y); m.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
  }
  document.addEventListener('pointerdown', (e) => { if (open.length && !e.target.closest('.ctx-menu')) close(); }, true);
  addEventListener('blur', close); addEventListener('resize', close); document.addEventListener('scroll', (e) => { if (!(e.target instanceof Element && e.target.closest('.ctx-menu'))) close(); }, true);
  window.CraftMenu = { show, close, isOpen: () => open.length > 0 };
})();
