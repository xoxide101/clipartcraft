/* Craft cache stand-in (window.caches when the browser has none): Cache Storage, which keeps the downloaded AI models,
   exists only on https pages (and this computer's own); a Craft app served over plain http had no cache, so the AI
   library stopped with "Browser cache is not available in this environment". This gives the same open / match / put /
   keys / delete, kept in IndexedDB ('craft-cache'), so the models are still downloaded once. It is used only when the
   browser's own Cache Storage is missing or does not work. */
(function () {
  'use strict';
  function install() {
    let dbp = null;
    const db = () => dbp || (dbp = new Promise((ok, no) => { const r = indexedDB.open('craft-cache', 1); r.onupgradeneeded = () => r.result.createObjectStore('entries'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }));
    const run = async (mode, fn) => { const d = await db(); return new Promise((ok, no) => { const t = d.transaction('entries', mode), r = fn(t.objectStore('entries')); let out; if (r) r.onsuccess = () => { out = r.result; }; t.oncomplete = () => ok(out); t.onerror = () => no(t.error); t.onabort = () => no(t.error); }); };
    const urlOf = (q) => new URL(typeof q === 'string' ? q : q.url, location.href).href;
    const range = (name) => IDBKeyRange.bound(name + '|', name + '|￿');
    function cache(name) {
      const key = (q) => `${name}|${urlOf(q)}`;
      return {
        async match(q) { const v = await run('readonly', (s) => s.get(key(q))); return v ? new Response(v.body, { status: v.status || 200, headers: v.headers || [] }) : undefined; },
        async put(q, res) { const body = await res.blob(), headers = [...res.headers]; await run('readwrite', (s) => s.put({ body, status: res.status || 200, headers }, key(q))); },
        async add(q) { const r = await fetch(q); if (!r.ok) throw new TypeError(`Could not fetch ${urlOf(q)}`); await this.put(q, r); },
        async addAll(list) { for (const q of list) await this.add(q); },
        async delete(q) { await run('readwrite', (s) => s.delete(key(q))); return true; },
        async keys() { const all = await run('readonly', (s) => s.getAllKeys(range(name))); return (all || []).map((k) => new Request(k.slice(name.length + 1))); },
      };
    }
    const stand = {
      open: async (name) => cache(name),
      async has(name) { const n = await run('readonly', (s) => s.count(range(name))); return n > 0; },
      async delete(name) { await run('readwrite', (s) => s.delete(range(name))); return true; },
      async keys() { const all = await run('readonly', (s) => s.getAllKeys()); return [...new Set((all || []).map((k) => k.split('|')[0]))]; },
      async match(q) { for (const n of await stand.keys()) { const r = await cache(n).match(q); if (r) return r; } return undefined; },
      craftStandIn: true,
    };
    try { Object.defineProperty(window, 'caches', { value: stand, configurable: true, writable: true }); } catch (e) { window.caches = stand; }
  }
  // (no Cache Storage at all: at once; one that is there but fails to open, as on some file:// pages: as soon as that shows)
  if (typeof caches === 'undefined') install();
  else caches.open('craft-cache-check').then(() => caches.delete('craft-cache-check')).catch(install);
})();
