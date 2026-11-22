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
     CraftAccount.lock(obj, password) / unlock(box, password)       (the same lock, for keys files)
     CraftAccount.keyUse(app, provider, key, status, note)          (an app notes how a key did: only the key's ID is kept)
     A site's AccountCraft can name the one account server for every Craft app (Site › One account server): the apps follow it.
     CraftAccount.button(el)             a Log in / your-name button that opens the account page
     Home: CraftAccount.setHome(name) / revokeHome(id) / isHome() / homes(). A computer set as home keeps a key in this
     browser (localStorage 'craft-home'); every check uses the key up and brings a new one (a copied key stops working and
     revokes the home). Away from home, a login ends after 30 minutes without anyone at the keyboard (in any Craft tab;
     the account server ends it too, also when the page is closed).
   Changes fire window 'craft-account' (also when another app or tab logs in or out). */
(function () {
  'use strict';
  const STATE = 'craft-account', SERVER = 'craft-account-server', KEYS = 'craft-ai-keys', HOME = 'craft-home', ACT = 'craft-active', ROUNDS = 250000;
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
    if (r.status === 401 && j.login && s) { write(STATE, null); tell(); if (j.idle) setTimeout(() => idleNote(), 0); }
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
    write(STATE, { server: server(), token: r.token, user: r.user }); markActive(true); await homeCheck(); tell();
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

  // ------------------------------------------------------------------ home, and logging out when nobody is there
  const isHome = () => { const s = state(); return !!(s && s.token && s.server === server() && s.home); };
  const setState = (k, v) => { const s = state(); if (s) { s[k] = v; write(STATE, s); } };
  async function homeCheck() {
    const h = read(HOME);
    if (!h || h.server !== server() || !h.key) { if (isHome()) { setState('home', null); tell(); } return null; }
    let r; try { r = await api('POST', 'home/check', { key: h.key }); } catch (e) { return isHome() ? state().home : null; }   // (not reachable: as it was)
    if (r.key) { const now = read(HOME); if (now && now.key === h.key) write(HOME, { ...h, key: r.key, id: r.home.id, name: r.home.name }); }
    if (r.home) { setState('home', r.home); tell(); return r.home; }
    if (r.ended) write(HOME, null);
    setState('home', null); tell();
    if (r.ended) setTimeout(() => note('🏠 Not home any more', esc(r.why || 'This computer is no longer set as home.') + '<br><br>Away from home you are logged out after 30 minutes without activity.'), 0);
    return null;
  }
  async function setHome(name) {
    const r = await api('POST', 'home/set', { name: name || 'Home computer' });
    write(HOME, { server: server(), key: r.key, id: r.home.id, name: r.home.name }); setState('home', r.home); tell(); return r.home;
  }
  async function revokeHome(id) {
    const h = read(HOME), here = id || (h && h.id);
    if (here) await api('DELETE', 'me/homes/' + encodeURIComponent(here));
    if (!id || (h && h.id === id)) { write(HOME, null); setState('home', null); markActive(true); }
    tell();
  }
  const homes = () => api('GET', 'me/homes');
  // activity: any Craft tab on this site notes when someone last used it (mouse, keys, touch); the server hears it now and then
  let idleMin = 30, lastPing = 0;
  const lastActive = () => { const v = +(localStorage.getItem(ACT) || 0); return v || Date.now(); };
  function markActive(force) {
    const n = Date.now(); try { if (force || n - lastActive() > 15000) localStorage.setItem(ACT, String(n)); } catch (e) { /* blocked */ }
    if (user() && (force || n - lastPing > 240000)) { lastPing = n; api('POST', 'active').then((r) => { if (r && r.idleMinutes) idleMin = r.idleMinutes; }).catch(() => {}); }
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((e) => window.addEventListener(e, () => markActive(false), { passive: true, capture: true }));
  let moved = 0; window.addEventListener('mousemove', () => { const n = Date.now(); if (n - moved > 20000) { moved = n; markActive(false); } }, { passive: true });
  function idleNote() { note('Logged out', `Nobody was at the keyboard for ${idleMin} minutes and this computer is not set as home, so you were logged out of every Craft app.<br><br>At home? Log in again and choose <b>🏠 Set this computer as home</b> in your account menu.`, true); }
  async function idleCheck() {
    if (!user() || isHome()) return;
    if (Date.now() - lastActive() > idleMin * 60000) { await logout({ keepKeys: false }); idleNote(); }
  }
  setInterval(idleCheck, 30000);
  function note(title, html, login) {
    const b = box(`<h3>${title}</h3><p class="dim" style="margin:0 0 10px;font-size:13.5px">${html}</p><div class="row"><button type="button" data-x>OK</button>${login ? '<button type="button" class="main" data-f="in">Log in</button>' : ''}</div>`);
    const i = b.querySelector('[data-f=in]'); if (i) i.onclick = () => { b.remove(); loginDialog(); };
  }

  // a Log in / your-name button for an app's title bar: it opens the account page (log in there once for every app)
  function button(el) {
    if (!el) { el = document.createElement('button'); el.type = 'button'; }
    el.classList.add('craft-acct-btn');
    if (!document.getElementById('craft-acct-css')) { const s = document.createElement('style'); s.id = 'craft-acct-css'; s.textContent = '.craft-acct-btn{border:1px solid rgba(255,255,255,.55);background:transparent;color:#fff;border-radius:14px;padding:3px 11px;font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis}.craft-acct-btn:hover{background:rgba(255,255,255,.2)}.craft-acct-btn[hidden]{display:none}'; document.head.append(s); }
    const draw = () => { const u = user(), hm = isHome(); el.textContent = u ? `${hm ? '🏠' : '👤'} ${u.display || u.name}` : 'Log in'; el.title = u ? `Logged in as ${u.name}: your account, keys and settings` + (hm ? `\n🏠 This computer is set as home (${state().home.name}): you stay logged in. Revoke it in the account menu.` : `\nNot a home computer: logged out after ${idleMin} minutes without activity.`) : 'Log in for your own settings, keys and saved work in every Craft app (the apps work without it too)'; };
    el.addEventListener('click', () => (user() ? accountMenu(el) : loginDialog()));
    window.addEventListener('craft-account', draw); draw(); return el;
  }
  window.addEventListener('storage', (e) => { if (e.key === STATE) tell(); });

  // logging in from inside an app (also an app opened from a file, or from another web address than the account page)
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function box(html) {
    document.querySelectorAll('.cacc-back').forEach((x) => x.remove());
    if (!document.getElementById('cacc-css')) { const s = document.createElement('style'); s.id = 'cacc-css'; s.textContent = `.cacc-back{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:10000;padding:16px}.cacc{background:var(--panel,#1f2129);color:var(--text,#e8e9ee);border:1px solid var(--line,#3a3e4c);border-radius:12px;width:min(420px,100%);padding:16px 18px;font:14px/1.45 "Segoe UI",system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}.cacc h3{margin:0 0 10px;font-size:16px}.cacc label{display:grid;gap:3px;margin:0 0 9px}.cacc input{padding:7px 9px;border-radius:7px;border:1px solid var(--line,#3a3e4c);background:var(--panel-2,#2a2d38);color:inherit;font:inherit}.cacc .row{display:flex;gap:8px;justify-content:flex-end;align-items:center;flex-wrap:wrap;margin-top:6px}.cacc button{padding:7px 14px;border-radius:7px;border:1px solid var(--line,#3a3e4c);background:var(--panel-2,#2a2d38);color:inherit;font:inherit;cursor:pointer}.cacc button.main{background:var(--accent,#5b8cff);border-color:var(--accent,#5b8cff);color:#fff}.cacc .dim{color:var(--dim,#9aa0b0);font-size:12.5px}.cacc .bad{color:#f87171}.cacc a{color:#8fb0ff}`; document.head.append(s); }
    const back = document.createElement('div'); back.className = 'cacc-back'; back.innerHTML = `<div class="cacc" role="dialog">${html}</div>`; document.body.append(back);
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-x]')) back.remove(); });
    return back;
  }
  // an account made for you by the admin: the first time, choose your own password (the starting one stops working)
  function choosePassword(old) {
    const b = box(`<h3>Choose your own password</h3><p class="dim" style="margin:0 0 10px">The admin made this account with a starting password. Choose your own now: only you will know it.</p>
      <label><span>New password (8 or more)</span><input data-f="n1" type="password" autocomplete="new-password"></label>
      <label><span>The new password again</span><input data-f="n2" type="password" autocomplete="new-password"></label>
      <div class="dim" data-f="msg"></div><div class="row"><button type="button" class="main" data-f="go">Use it</button></div>`);
    const f = (k) => b.querySelector(`[data-f=${k}]`); setTimeout(() => f('n1').focus(), 0);
    f('go').onclick = async () => { const n = f('n1').value; if (n.length < 8) return void (f('msg').innerHTML = '<span class="bad">Use at least 8 characters.</span>'); if (n !== f('n2').value) return void (f('msg').innerHTML = '<span class="bad">The two are not the same.</span>');
      if (n === old) return void (f('msg').innerHTML = '<span class="bad">Choose a new one, not the starting password.</span>');
      f('go').disabled = true; try { await changePassword(old, n); await refresh(); b.remove(); } catch (e) { f('msg').innerHTML = `<span class="bad">${esc(e.message)}</span>`; f('go').disabled = false; } };
  }
  function loginDialog() {
    const sv = server(), b = box(`<h3>Log in</h3><p class="dim" style="margin:0 0 10px">One user ID for every Craft app: your settings, keys and saved work follow you. The app works without it too.</p>
      <label><span>Account server</span><input data-f="srv" value="${esc(sv)}" placeholder="http://your-site/craft/accountcraft/account.php"></label>
      <label><span>User ID or email</span><input data-f="name" autocomplete="username"></label>
      <label><span>Password</span><input data-f="pw" type="password" autocomplete="current-password"></label>
      <div class="dim" data-f="msg"></div>
      <div class="row"><a data-f="ask" href="#" target="_blank" rel="noopener" style="margin-right:auto">Ask for access</a><button type="button" data-x>Cancel</button><button type="button" class="main" data-f="go">Log in</button></div>`);
    const f = (k) => b.querySelector(`[data-f=${k}]`), srv = () => f('srv').value.trim().replace(/\/+$/, '').replace(/\/(api)?$/, '');
    const link = () => { const u = srv(); f('ask').href = u ? u.replace(/account\.php$/, '') : '#'; }; f('srv').addEventListener('input', link); link();
    if (sv && /^https?:$/.test(location.protocol) && sv.startsWith(location.origin)) f('srv').closest('label').hidden = true;   // (worked out from this page: nothing to type)
    setTimeout(() => (f('srv').closest('label').hidden || f('srv').value ? f('name') : f('srv')).focus(), 0);
    const go = async () => {
      const u = srv(); if (!/^https?:\/\/[^\s]+account\.php$/.test(u)) { f('msg').innerHTML = '<span class="bad">Give the account server’s address, ending in account.php.</span>'; return; }
      try { localStorage.setItem(SERVER, u); } catch (e) { /* blocked */ }
      if (/^http:/.test(u) && !/\/\/(localhost|127\.|192\.168\.|10\.)/.test(u)) f('msg').textContent = 'Note: plain http over the internet: the password travels unprotected.';
      f('go').disabled = true; f('go').textContent = 'Logging in…';
      try { const who = await login(f('name').value.trim(), f('pw').value); if (who && who.mustChange) return choosePassword(f('pw').value); b.remove(); }
      catch (e) { f('msg').innerHTML = `<span class="bad">${esc(e.message)}</span>`; f('go').disabled = false; f('go').textContent = 'Log in'; }
    };
    f('go').addEventListener('click', go); f('pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }
  function accountMenu() {
    const u = user(), b = box(`<h3>👤 ${esc(u.display || u.name)}</h3><p class="dim" style="margin:0 0 10px">Logged in as <b>${esc(u.name)}</b>${u.role === 'owner' ? ' (main site admin)' : u.role === 'admin' ? ' (admin)' : ''} at ${esc(server().replace(/\/account\.php$/, ''))}.</p>
      <div data-f="home" style="margin:0 0 10px;padding:8px 10px;border:1px solid var(--line,#3a3e4c);border-radius:8px"></div>
      <label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-f="forget" checked style="width:auto"> Forget my keys in this browser when I log out</label>
      <div class="row"><button type="button" data-f="page" style="margin-right:auto">My account…</button><button type="button" data-x>Close</button><button type="button" class="main" data-f="out">Log out</button></div>`);
    b.querySelector('[data-f=page]').addEventListener('click', () => { window.open(pageUrl(), 'craft-account'); b.remove(); });
    const hb = b.querySelector('[data-f=home]');
    const drawHome = () => {
      const hm = isHome() && state().home;
      hb.innerHTML = hm ? `🏠 <b>This computer is set as home</b> (${esc(hm.name)}): you stay logged in here.<div class="row" style="justify-content:flex-start"><button type="button" data-f="rv">Revoke home</button><span class="dim">its key is ended and can never be used again</span></div>`
        : `<b>Not a home computer:</b> you are logged out after ${idleMin} minutes without activity.<div class="row" style="justify-content:flex-start"><input data-f="hn" placeholder="Name it (Home PC, Laptop…)" style="flex:1;min-width:140px"><button type="button" class="main" data-f="sh">🏠 Set this computer as home</button></div>`;
      const rv = hb.querySelector('[data-f=rv]'), sh = hb.querySelector('[data-f=sh]');
      if (rv) rv.onclick = async () => { rv.disabled = true; try { await revokeHome(); } catch (e) { hb.insertAdjacentHTML('beforeend', `<div class="bad">${esc(e.message)}</div>`); } drawHome(); };
      if (sh) sh.onclick = async () => { sh.disabled = true; try { await setHome(hb.querySelector('[data-f=hn]').value.trim()); } catch (e) { hb.insertAdjacentHTML('beforeend', `<div class="bad">${esc(e.message)}</div>`); } drawHome(); };
    };
    drawHome();
    b.querySelector('[data-f=out]').addEventListener('click', async () => { await logout({ keepKeys: !b.querySelector('[data-f=forget]').checked }); b.remove(); });
  }

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
  if (user()) { if (!isHome() && Date.now() - lastActive() > idleMin * 60000) { setTimeout(idleCheck, 0); } else { markActive(true); homeCheck().then(() => refresh()).then((r) => { if (r) pullShared(); }); } }

  const allowed = (app) => { const u = user(); return !u || !Array.isArray(u.apps) || u.apps.includes(app); };   // (an app not given to this user keeps nothing in the account)
  // ------------------------------------------------------------------ key use: which app used which key, and how it went
  // (only the key's ID, the start of its SHA-256; kept in this browser under 'craft-key-use' and, logged in, in 'craft' / 'keys-use')
  const USE = 'craft-key-use'; let useTimer = 0;
  async function keyId(k) {
    const b = enc.encode(String(k || '').trim()); if (!b.length) return '';
    const h = subtle() ? new Uint8Array(await crypto.subtle.digest('SHA-256', b)) : JS() ? JS().sha256(b) : null; if (!h) return '';
    const s = Array.from(h.slice(0, 4), (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase(); return s.slice(0, 4) + '-' + s.slice(4);
  }
  async function keyUse(app, provider, key, status, note = '') {
    try {
      const id = await keyId(key); if (!id) return;
      const all = read(USE) || {}, e = all[id] || (all[id] = { p: provider, apps: {} }), a = e.apps[app] || (e.apps[app] = { n: 0, fails: 0 });
      const ok = status >= 200 && status < 300, t = new Date().toISOString(); a.n++; a.last = t; a.status = status; a.ok = ok;
      if (ok) a.lastOk = t; else { a.fails++; a.note = String(note || '').slice(0, 200); }
      write(USE, all); clearTimeout(useTimer); useTimer = setTimeout(sendUse, 4000);
    } catch (err) { /* only a note */ }
  }
  async function sendUse() {
    if (!user()) return;
    try {
      const mine = read(USE) || {}, there = (await get('craft', 'keys-use')) || {};
      for (const [id, e] of Object.entries(mine)) { const t = there[id] || (there[id] = { p: e.p, apps: {} }); for (const [app, a] of Object.entries(e.apps)) { const b = t.apps[app]; if (!b || (a.last || '') >= (b.last || '')) t.apps[app] = a; } }
      await put('craft', 'keys-use', there);
    } catch (err) { /* next time */ }
  }
  // one account server for every Craft app: when this site's AccountCraft names another one (its 'home'), use that
  (async () => {
    try {
      const HOME = 'craft-account-home', had = localStorage.getItem(HOME), set = localStorage.getItem(SERVER);
      if (set && set !== had) return;                    // chosen by hand in the login dialog: leave it
      if (location.pathname.includes('/accountcraft/')) return;   // AccountCraft's own page always manages its own site
      const own = (() => { localStorage.removeItem(SERVER); const s = server(); if (set) localStorage.setItem(SERVER, set); return s; })(); if (!own) return;
      const r = await fetch(own + '/api/info'); const j = await r.json().catch(() => ({})); const home = (j.home || '').trim();
      if (home && home !== own) { if (set !== home) { localStorage.setItem(SERVER, home); localStorage.setItem(HOME, home); tell(); } }
      else if (had) { localStorage.removeItem(HOME); if (set === had) { localStorage.removeItem(SERVER); tell(); } }
    } catch (err) { /* not there */ }
  })();
  window.CraftAccount = { user, server, pageUrl, button, loginDialog, api, allowed, login, signup, logout, changePassword, refresh, get, put, all, remove, lockKeys, unlockKeys, localKeys, useKeys, hasCrypto, lock, unlock, keyUse, keyId, choosePassword, isHome, setHome, revokeHome, homes, homeCheck };
})();
