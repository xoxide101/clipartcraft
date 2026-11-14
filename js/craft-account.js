/* Craft account (window.CraftAccount): the one login for every Craft app on this web site. Each app keeps its own copy (with craft-crypto.js before it).
   Without logging in an app works as always (guest). Logged in, your own things are kept on the site's account server,
   per app (or 'craft' for what every app shares), and your AI keys come with you: they are locked in this browser with
   your password (AES-GCM, key from PBKDF2-SHA256) before they are sent, so the server never sees them; logging in
   unlocks them into this browser's AI settings (localStorage 'craft-ai-keys', the same place CraftKeys keeps them).
   The login is kept in localStorage 'craft-account', so every app on the same site shares it (log in once).
     CraftAccount.user()                 → { name, display, role, … } or null
     CraftAccount.server()               → the account server's address ('' when there is none for this page)
     CraftAccount.login(name, password)  → user (and the keys unlocked)      logout({ keepKeys })
     CraftAccount.get(app, key) / put(app, key, value) / all(app) / remove(app, key)
     CraftAccount.lockKeys(keys, password) / unlockKeys(password)   (the vault: 'craft' / 'vault')
     CraftAccount.button(el)             a Log in / your-name button that opens the account page
   Changes fire window 'craft-account' (also when another app or tab logs in or out). */
(function () {
  'use strict';
  const STATE = 'craft-account', SERVER = 'craft-account-server', KEYS = 'craft-ai-keys', ROUNDS = 250000;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (u8) => btoa(String.fromCharCode(...u8)), unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* blocked */ } };
  const tell = () => window.dispatchEvent(new CustomEvent('craft-account', { detail: { user: user() } }));

  // where the account server is: set by hand (localStorage 'craft-account-server'), else next to the apps: …/craft/accountcraft/
  function server() {
    try { const s = localStorage.getItem(SERVER); if (s) return s.replace(/\/+$/, ''); } catch (e) { /* blocked */ }
    if (!/^https?:$/.test(location.protocol)) return '';
    const p = location.pathname, i = p.indexOf('/craft/');
    if (p.includes('/accountcraft/')) return location.origin + p.slice(0, p.indexOf('/accountcraft/')) + '/accountcraft/account.php';
    return i >= 0 ? location.origin + p.slice(0, i) + '/craft/accountcraft/account.php' : location.origin + '/accountcraft/account.php';
  }
  const state = () => read(STATE);
  const user = () => { const s = state(); return s && s.token && s.server === server() ? s.user : null; };
  const pageUrl = () => server().replace(/account\.php$/, '');

  async function api(method, path, body) {
    const s = state(), h = { 'content-type': 'application/json' }; if (s && s.token && s.server === server()) h['x-craft-token'] = s.token;
    try { const ak = sessionStorage.getItem('craft-admin-key'); if (ak) h['x-craft-admin-key'] = ak; } catch (e) { /* blocked */ }   // (the admin key: only while this tab is open)
    let r; try { r = await fetch(server() + '/api/' + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); }
    catch (e) { throw new Error('The account server could not be reached.'); }
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && j.login && s) { write(STATE, null); tell(); }
    if (!r.ok) { const err = new Error(j.error || `The account server said ${r.status}.`); err.status = r.status; err.info = j; throw err; }
    return j;
  }

  // the vault: your keys locked with your password (only this browser can open it)
  async function keyFrom(password, salt) { const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ROUNDS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }
  // (plain http on a network address has no crypto.subtle: then craft-crypto.js does the same in JavaScript, same results)
  const subtle = () => !!(window.crypto && crypto.subtle), JS = () => window.CraftCrypto;
  async function lock(obj, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), pt = enc.encode(JSON.stringify(obj));
    const data = subtle() ? new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(password, salt), pt)) : JS().seal(JS().pbkdf2(enc.encode(password), salt, ROUNDS), iv, pt);
    return { v: 1, salt: b64(salt), iv: b64(iv), data: b64(data) };
  }
  async function unlock(box, password) {
    const salt = unb64(box.salt), iv = unb64(box.iv), data = unb64(box.data);
    const plain = subtle() ? await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await keyFrom(password, salt), data) : JS().open(JS().pbkdf2(enc.encode(password), salt, ROUNDS), iv, data);
    return JSON.parse(dec.decode(plain));
  }
  const hasCrypto = () => subtle() || !!JS();
  const localKeys = () => { const s = read(KEYS); return { keys: { ...(s && s.keys) }, workspace: (s && s.workspace) || '' }; };
  function useKeys(v) { write(KEYS, { keys: { ...(v && v.keys) }, workspace: (v && v.workspace) || '' }); window.dispatchEvent(new CustomEvent('craft-keys')); }
  async function lockKeys(v, password) { if (!hasCrypto()) throw new Error('This browser cannot lock keys on this page (it needs https or this computer\'s own address).'); await put('craft', 'vault', await lock({ keys: v.keys || {}, workspace: v.workspace || '' }, password)); useKeys(v); }
  async function unlockKeys(password) { let box; try { box = (await api('GET', 'data/craft/vault')).value; } catch (e) { if (e.status === 404) return null; throw e; } if (!hasCrypto()) return null; const v = await unlock(box, password); useKeys(v); return v; }

  async function login(name, password) {
    const r = await api('POST', 'login', { name, password });
    write(STATE, { server: server(), token: r.token, user: r.user }); tell();
    // your keys come with you; the first time, the keys this browser already has go into the vault
    try { const v = await unlockKeys(password); if (!v) { const l = localKeys(); if (Object.keys(l.keys).length && hasCrypto()) await lockKeys(l, password); } }
    catch (e) { console.warn('Craft account: the keys could not be unlocked', e); }
    return r.user;
  }
  async function signup(o) { const r = await api('POST', 'signup', o); if (r.token) { write(STATE, { server: server(), token: r.token, user: r.user }); tell(); try { const l = localKeys(); if (Object.keys(l.keys).length && hasCrypto()) await lockKeys(l, o.password); } catch (e) { /* later */ } } return r; }
  async function logout({ keepKeys = false } = {}) { try { await api('POST', 'logout'); } catch (e) { /* gone already */ } write(STATE, null); if (!keepKeys) { write(KEYS, null); window.dispatchEvent(new CustomEvent('craft-keys')); } tell(); }
  // a new password: the vault is locked again with it (here, where both are known)
  async function changePassword(old, neu) { let v = null; try { v = await unlockKeys(old); } catch (e) { throw new Error('The old password does not open your keys: is it right?'); } await api('POST', 'me/password', { old, new: neu }); if (v) await lockKeys(v, neu); }
  async function refresh() { if (!state()) return null; try { const r = await api('GET', 'me'); const s = state(); if (s) { s.user = r.user; write(STATE, s); tell(); } return r; } catch (e) { return null; } }

  const get = async (app, key) => { try { return (await api('GET', `data/${app}/${encodeURIComponent(key)}`)).value; } catch (e) { if (e.status === 404) return undefined; throw e; } };
  const put = (app, key, value) => api('PUT', `data/${app}/${encodeURIComponent(key)}`, { value });
  const all = (app) => api('GET', `data/${app}`);
  const remove = (app, key) => api('DELETE', `data/${app}/${encodeURIComponent(key)}`);

  // a Log in / your-name button for an app's title bar: it opens the account page (log in there once for every app)
  function button(el) {
    if (!el) { el = document.createElement('button'); el.type = 'button'; }
    el.classList.add('craft-acct-btn');
    if (!document.getElementById('craft-acct-css')) { const s = document.createElement('style'); s.id = 'craft-acct-css'; s.textContent = '.craft-acct-btn{border:1px solid rgba(255,255,255,.55);background:transparent;color:#fff;border-radius:14px;padding:3px 11px;font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis}.craft-acct-btn:hover{background:rgba(255,255,255,.2)}.craft-acct-btn[hidden]{display:none}'; document.head.append(s); }
    const draw = () => { const u = user(); el.textContent = u ? `👤 ${u.display || u.name}` : 'Log in'; el.title = u ? `Logged in as ${u.name}: your account, keys and settings` : 'Log in for your own settings, keys and saved work in every Craft app (the apps work without it too)'; el.hidden = !server(); };
    el.addEventListener('click', () => window.open(pageUrl(), 'craft-account'));
    window.addEventListener('craft-account', draw); draw(); return el;
  }
  window.addEventListener('storage', (e) => { if (e.key === STATE) tell(); });

  // things every app shares that follow you (kept in your account as 'craft' / 'settings'): this browser's copies are
  // filled from the account when an app opens or you log in, and sent back when they change here
  const FOLLOW = ['craft-ai-mode', 'craft-ai-choices'];
  let following = false;
  async function pullShared() {
    if (!user()) return; let s; try { s = await get('craft', 'settings'); } catch (e) { return; }
    if (!s) return pushShared(); following = true;
    try { for (const k of FOLLOW) if (s[k] !== undefined && localStorage.getItem(k) !== s[k]) localStorage.setItem(k, s[k]); } catch (e) { /* blocked */ }
    following = false; window.dispatchEvent(new CustomEvent('craft-keys'));
  }
  let pushT = 0;
  function pushShared() {
    if (!user() || following) return; clearTimeout(pushT);
    pushT = setTimeout(() => { const s = {}; try { for (const k of FOLLOW) { const v = localStorage.getItem(k); if (v != null) s[k] = v; } } catch (e) { return; } put('craft', 'settings', s).catch(() => {}); }, 800);
  }
  window.addEventListener('craft-keys', pushShared);
  let was = user() && user().id;
  window.addEventListener('craft-account', () => { const now = user() && user().id; if (now && now !== was) pullShared(); was = now; });
  // on opening: is the login still good (ended elsewhere, or switched off)? then your shared settings
  if (user()) refresh().then((r) => { if (r) pullShared(); });

  window.CraftAccount = { user, server, pageUrl, button, api, login, signup, logout, changePassword, refresh, get, put, all, remove, lockKeys, unlockKeys, localKeys, useKeys, hasCrypto };
})();
