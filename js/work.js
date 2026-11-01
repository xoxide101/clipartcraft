/* The working area (window.CraftWork): the sheets and files clip art was imported from, kept until they are deleted, so
   a sheet can be sliced again, or its pictures imported again with other settings. Only ClipArtCraft uses it, so it
   is a browser store of its own ('craft-clipart-work'), apart from the shared library.
   A source: { id, name, fileName, type, size, added, used (pictures made from it), file: Blob, thumb, width, height,
   pending: 'import' | 'slice' while it is open in the importer or slicer and nothing has been added from it yet } */
(function () {
  'use strict';
  const DB = 'craft-clipart-work', VERSION = 1;
  let dbp = null;
  const open = () => (dbp = dbp || new Promise((ok, no) => {
    const r = indexedDB.open(DB, VERSION);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('sources')) d.createObjectStore('sources', { keyPath: 'id' }); };
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error || new Error('The working area could not be opened (browser storage blocked?).'));
  }));
  const req = (r) => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  const tx = async (mode, fn) => { const d = await open(); return new Promise((ok, no) => { const t = d.transaction('sources', mode), s = t.objectStore('sources'); let out; Promise.resolve(fn(s)).then((v) => { out = v; }); t.oncomplete = () => ok(out); t.onerror = () => no(t.error); }); };
  const listeners = new Set(), changed = () => listeners.forEach((f) => { try { f(); } catch (e) { /* closed */ } });

  async function all() { return (await tx('readonly', (s) => req(s.getAll()))).sort((a, b) => b.added.localeCompare(a.added)); }
  async function get(id) { return tx('readonly', (s) => req(s.get(id))); }
  async function put(src) { await tx('readwrite', (s) => req(s.put(src))); changed(); return src; }
  async function remove(ids) { await tx('readwrite', (s) => Promise.all([].concat(ids).map((id) => req(s.delete(id))))); changed(); }

  // a small picture of the file (any format the importer reads)
  async function thumbOf(file) {
    let img = null;
    try { img = await createImageBitmap(file); } catch (e) {
      try { const r = window.CraftFormats ? await window.CraftFormats.read(file) : null; if (r) img = await createImageBitmap(r.img); } catch (err) { /* no picture */ }
      if (!img && /svg/.test(file.type || file.name)) { const u = URL.createObjectURL(file); try { img = new Image(); img.src = u; await img.decode(); } catch (err) { img = null; } finally { URL.revokeObjectURL(u); } }
    }
    if (!img) return { thumb: '', width: 0, height: 0 };
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, k = Math.min(1, 240 / Math.max(w, h)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { thumb: c.toDataURL('image/png'), width: w, height: h };
  }
  // keep a file (the same file again, by name and size, is the same source); used = pictures made from it this time
  // pending: 'import' / 'slice' when a file is opened and not processed yet; '' when it is done (or given up)
  async function add(file, { used = 0, pending } = {}) {
    const old = (await all()).find((s) => s.fileName === file.name && s.size === file.size);
    if (old) { old.used = (old.used || 0) + used; old.lastUsed = new Date().toISOString(); if (pending !== undefined) old.pending = pending; return put(old); }
    const t = await thumbOf(file);
    return put({ id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: file.name.replace(/\.[^.]+$/, ''), fileName: file.name, type: file.type, size: file.size, added: new Date().toISOString(), used, pending: pending || '', file, ...t });
  }
  // a source as a File again (to slice or import once more)
  const fileOf = (src) => new File([src.file], src.fileName, { type: src.type || src.file.type });

  window.CraftWork = { all, get, put, remove, add, fileOf, onChange: (f) => { listeners.add(f); return () => listeners.delete(f); } };
})();
