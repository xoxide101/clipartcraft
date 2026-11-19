/* Craft AI settings (window.CraftAISettings): every AI a Craft app can use, in one place, and which one does each job.
   Each app keeps its own copy (from AccountCraft). Grouped by where the AI runs:
     In this browser   the app's own small models (the app lists them: CLIP, Florence-2, cut-outs…); no graphics card needed
     This computer     Ollama (:11434), LM Studio (:1234), llama.cpp (:9931 router, :8080 llama-server), Automatic1111 /
                       Forge (:7860): found by themselves, with what each model can do (see pictures, think, make pictures)
     Your network      other computers running any of those: add their address
     Cloud             Claude, Gemini, GPT, OpenRouter, Ollama Cloud, Runware, Together.ai: your keys (AI keys / AccountCraft)
   Use for: which AI does each job (look at pictures, make drawings, make pictures, write and answer); 'Automatic' lets
   the app choose. Kept in localStorage 'craft-ai-choices' (logged in, it follows you to every app and browser).
     CraftAISettings.open({ app, builtIn: [{ id, name, jobs: ['see', …], note }] })
     CraftAISettings.scan({ force }) → [{ kind, name, base, models: [{ id, sees, thinks, loaded, gb, cloud }] }]
     CraftAISettings.options(job, builtIn) → [{ value, label, group, note }]
     CraftAISettings.choice(job) → { where: 'browser'|'local'|'cloud', kind, base, model, provider, id } or null (automatic)
     CraftAISettings.ask({ kind, base, model, prompt, image (base64, no data: prefix), json }) → text (a local or network AI)
   A page served from a web address asks the AI programs on this computer straight from the browser: Ollama needs
   OLLAMA_ORIGINS set to allow it (LM Studio: "Enable CORS"; llama.cpp allows it already). */
(function () {
  'use strict';
  const STORE = 'craft-ai-choices', KEYS = 'craft-ai-keys';
  const JOBS = [['see', 'Look at pictures', 'name, sort and describe pictures'], ['draw', 'Make drawings', 'SVG drawings from words'], ['paint', 'Make pictures', 'pictures from words, and redrawing'], ['chat', 'Write and answer', 'text, help and the Ask box']];
  const DEFAULTS = [['ollama', 'http://localhost:11434'], ['lmstudio', 'http://localhost:1234'], ['llamacpp', 'http://127.0.0.1:9931'], ['llamacpp', 'http://127.0.0.1:8080'], ['a1111', 'http://127.0.0.1:7860']];
  const KIND = { ollama: 'Ollama', lmstudio: 'LM Studio', llamacpp: 'llama.cpp', a1111: 'Automatic1111 / Forge', nvidia: 'NVIDIA NIM', other: 'AI server' };
  const CLOUD = [['anthropic', 'Claude (Anthropic)', ['see', 'draw', 'chat']], ['gemini', 'Gemini (Google)', ['see', 'draw', 'paint', 'chat']], ['openai', 'GPT (OpenAI)', ['see', 'draw', 'paint', 'chat']], ['openrouter', 'OpenRouter', ['see', 'draw', 'paint', 'chat']], ['ollama', 'Ollama Cloud', ['see', 'draw', 'chat']], ['runware', 'Runware', ['paint']], ['together', 'Together.ai', ['see', 'draw', 'paint', 'chat']]];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = () => { try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); return { ...s, jobs: { ...(s && s.jobs) }, servers: (s && s.servers) || [], named: (s && s.named) || [] }; } catch (e) { return { jobs: {}, servers: [], named: [] }; } };   // named: AccountCraft › Local AI
  const write = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* blocked */ } window.dispatchEvent(new CustomEvent('craft-keys')); };
  const keys = () => { try { return (JSON.parse(localStorage.getItem(KEYS) || 'null') || {}).keys || {}; } catch (e) { return {}; } };
  // a server of yours that asks for a key (llama.cpp listening on your network makes one): kept with your keys as 'local:<address>'
  const authFor = (url) => { const k = keys(), b = Object.keys(k).filter((x) => x.startsWith('local:') && url.startsWith(x.slice(6))).sort((x, y) => y.length - x.length)[0]; return b && k[b] ? { authorization: 'Bearer ' + k[b] } : {}; };
  async function get(url, opts = {}, ms = 2500) { opts = { ...opts, headers: { ...authFor(url), ...(opts.headers || {}) } }; const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(url, { ...opts, signal: c.signal }); return r.ok ? await r.json() : null; } catch (e) { return null; } finally { clearTimeout(t); } }

  // ------------------------------------------------------------------ finding the AI programs
  async function probe(kind, base) {
    base = base.replace(/\/+$/, '').replace(/\/v1$/, '');
    if (kind === 'ollama' || kind === 'auto') {
      const t = await get(base + '/api/tags');
      if (t && Array.isArray(t.models)) {
        const models = await Promise.all(t.models.map(async (m) => { const s = await get(base + '/api/show', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: m.name }) }, 4000); const cap = (s && s.capabilities) || []; return { id: m.name, sees: cap.includes('vision'), thinks: cap.includes('thinking'), cloud: /:cloud$|-cloud$/.test(m.name), gb: m.size ? +(m.size / 1e9).toFixed(1) : 0 }; }));
        return { kind: 'ollama', name: KIND.ollama, base, models };
      }
      if (kind === 'ollama') return null;
    }
    if (kind === 'lmstudio' || kind === 'auto') {
      const j = await get(base + '/api/v0/models');
      if (j && Array.isArray(j.data)) return { kind: 'lmstudio', name: KIND.lmstudio, base, models: j.data.filter((m) => m.type !== 'embeddings').map((m) => ({ id: m.id, sees: m.type === 'vlm', loaded: m.state === 'loaded', thinks: /thinking|reason|r1|qwq/i.test(m.id) })) };
      if (kind === 'lmstudio') return null;
    }
    if (kind === 'a1111' || kind === 'auto') {
      const j = await get(base + '/sdapi/v1/sd-models');
      if (Array.isArray(j)) return { kind: 'a1111', name: KIND.a1111, base, models: j.map((m) => ({ id: m.title || m.model_name, paints: true })) };
      if (kind === 'a1111') return null;
    }
    const j = await get(base + '/v1/models');   // llama.cpp (and any OpenAI-style server)
    if (j && Array.isArray(j.data)) {
      const ll = j.data.some((m) => m.owned_by === 'llamacpp');
      return { kind: ll ? 'llamacpp' : 'openai-style', name: ll ? KIND.llamacpp : 'AI server', base, models: j.data.map((m) => { const inp = (m.architecture && m.architecture.input_modalities) || null; return { id: m.id, sees: inp ? inp.includes('image') : null, loaded: m.status ? m.status.value === 'loaded' : undefined, incomplete: !!(m.status && m.status.value === 'incomplete') }; }) };
    }
    return null;
  }
  let cache = null, cacheAt = 0;
  async function scan({ force = false } = {}) {
    if (cache && !force && Date.now() - cacheAt < 60000) return cache;
    // your named servers (AccountCraft › Local AI) first, with their kind and name; then the usual places here, and addresses added in the apps
    const s = read(), named = s.named.filter((n) => !n.off), list = named.map((n) => [n.kind === 'nvidia' || n.kind === 'other' ? 'openai' : n.kind, n.base]).concat(DEFAULTS.map(([k, b]) => [k, b]), s.servers.map((b) => ['auto', b]));
    const seen = new Set(), found = (await Promise.all(list.map(([k, b]) => probe(k, b)))).filter((x) => x && !seen.has(x.base) && seen.add(x.base));
    // the same program reached two ways (localhost here, and its network address in your list): keep the named one
    const same = (a, b) => a.kind === b.kind && a.models.length === b.models.length && a.models.every((m, i) => m.id === b.models[i].id);
    for (let i = found.length - 1; i >= 0; i--) { const f = found[i]; if (named.some((n) => n.base.replace(/\/+$/, '') === f.base)) continue; if (found.some((g, j) => j !== i && named.some((n) => n.base.replace(/\/+$/, '') === g.base) && same(f, g))) found.splice(i, 1); }
    for (const f of found) { const n = named.find((x) => x.base.replace(/\/+$/, '') === f.base); if (n) { f.label = n.name; if (n.kind === 'nvidia') f.name = KIND.nvidia; } }
    cache = found; cacheAt = Date.now(); return found;
  }
  const isLocal = (b) => /\/\/(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(b + '/');

  // ------------------------------------------------------------------ the choices
  function options(job, builtIn = [], found = cache || []) {
    const o = [{ value: '', label: 'Automatic (the app chooses)', group: '' }];
    for (const b of builtIn) if ((b.jobs || []).includes(job)) o.push({ value: `browser|${b.id}`, label: b.name, group: 'In this browser', note: b.note || '' });
    for (const srv of found) for (const m of srv.models) {
      if (job === 'paint' ? !m.paints : m.paints) continue;
      if (job === 'see' && m.sees === false) continue;
      if (m.incomplete) continue;   // not fully downloaded yet
      o.push({ value: `local|${srv.kind}|${srv.base}|${m.id}`, label: `${m.id}`, group: m.cloud ? 'Ollama Cloud (through Ollama here)' : `${isLocal(srv.base) ? 'This computer' : 'Your network'}: ${srv.label ? srv.label + ' (' + srv.name + ')' : srv.name}`, note: [m.sees ? 'sees pictures' : m.sees === null ? 'pictures: unknown' : '', m.thinks ? 'thinks' : '', m.gb ? `${m.gb} GB` : '', m.loaded ? 'loaded' : ''].filter(Boolean).join(', ') });
    }
    const k = keys();
    for (const [id, name, jobs] of CLOUD) if (jobs.includes(job) && id !== 'ollama')   /* Ollama Cloud: web pages cannot ask it; its models come through your Ollama (the ':cloud' ones) */
      o.push({ value: `cloud|${id}`, label: name, group: 'Cloud (your keys)', note: k[id] ? 'key saved' : 'no key yet', off: !k[id] });
    return o;
  }
  function parse(v) {
    if (!v) return null; const p = v.split('|');
    if (p[0] === 'browser') return { where: 'browser', id: p[1] };
    if (p[0] === 'cloud') return { where: 'cloud', provider: p[1], model: p[2] || '' };
    if (p[0] === 'local') return { where: 'local', kind: p[1], base: p[2], model: p.slice(3).join('|') };
    return null;
  }
  const choice = (job) => parse(read().jobs[job] || '');
  function setChoice(job, value) { const s = read(); if (value) s.jobs[job] = value; else delete s.jobs[job]; write(s); }

  // ------------------------------------------------------------------ asking a local or network AI (one way for all of them)
  // schema: a JSON schema the answer must fill (Ollama: format; LM Studio / llama.cpp: response_format json_schema)
  async function ask({ kind, base, model, prompt, system = '', image = null, json = false, schema = null, ms = 180000 }) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    try {
      if (kind === 'ollama') {
        const r = await fetch(base + '/api/chat', { method: 'POST', signal: c.signal, headers: { 'content-type': 'application/json', ...authFor(base) }, body: JSON.stringify({ model, stream: false, think: false, ...(schema ? { format: schema } : json ? { format: 'json' } : {}), keep_alive: '10m', options: { temperature: 0.2, ...(image ? { num_ctx: 8192 } : {}) }, messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt, ...(image ? { images: [image] } : {}) }] }) });
        const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || `Ollama said ${r.status}`); return (j.message && j.message.content) || '';
      }
      const content = image ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: 'data:image/png;base64,' + image } }] : prompt;
      const r = await fetch(base + '/v1/chat/completions', { method: 'POST', signal: c.signal, headers: { 'content-type': 'application/json', ...authFor(base) }, body: JSON.stringify({ model, temperature: 0.2, messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content }], ...(schema ? { response_format: { type: 'json_schema', json_schema: { name: 'answer', schema, strict: false } } } : json && kind === 'llamacpp' ? { response_format: { type: 'json_object' } } : {}) }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && (j.error.message || j.error)) || `${KIND[kind] || 'The AI'} said ${r.status}`);
      return String(((j.choices || [])[0] || {}).message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } catch (e) { if (e.name === 'AbortError') throw new Error('The AI took too long to answer.'); throw e; } finally { clearTimeout(t); }
  }

  // ------------------------------------------------------------------ the panel
  function open({ app = 'Craft', builtIn = [] } = {}) {
    document.querySelectorAll('.cais-back').forEach((x) => x.remove());
    if (!document.getElementById('cais-css')) { const s = document.createElement('style'); s.id = 'cais-css'; s.textContent = `
.cais-back{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:9999;padding:16px}
.cais{background:var(--panel,#1f2129);color:var(--text,#e8e9ee);border:1px solid var(--line,#3a3e4c);border-radius:12px;width:min(820px,100%);max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.5);font:14px/1.45 "Segoe UI",system-ui,sans-serif}
.cais header{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line,#3a3e4c)}.cais header b{font-size:16px}.cais header button{margin-left:auto}
.cais .body{overflow:auto;padding:12px 16px}.cais h3{font-size:13.5px;margin:14px 0 6px;color:var(--dim,#9aa0b0);text-transform:uppercase;letter-spacing:.04em}
.cais .job{display:grid;grid-template-columns:190px 1fr;gap:8px;align-items:center;margin:0 0 7px}@media(max-width:600px){.cais .job{grid-template-columns:1fr}}
.cais select,.cais input{width:100%;padding:6px 8px;border-radius:7px;border:1px solid var(--line,#3a3e4c);background:var(--panel-2,#2a2d38);color:inherit;font:inherit}
.cais button{padding:6px 12px;border-radius:7px;border:1px solid var(--line,#3a3e4c);background:var(--panel-2,#2a2d38);color:inherit;font:inherit;cursor:pointer}
.cais .srv{border:1px solid var(--line,#3a3e4c);border-radius:8px;padding:8px 10px;margin:0 0 8px}.cais .srv small{color:var(--dim,#9aa0b0)}
.cais .tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}.cais .tags span{background:var(--panel-2,#2a2d38);border-radius:10px;padding:1px 8px;font-size:12px}
.cais .dim{color:var(--dim,#9aa0b0)}.cais .ok{color:#4ade80}.cais .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cais .modes{display:flex;gap:6px;flex-wrap:wrap}.cais .modes button.on{background:var(--accent,#5b8cff);border-color:var(--accent,#5b8cff);color:#fff}`; document.head.append(s); }
    const back = document.createElement('div'); back.className = 'cais-back';
    back.innerHTML = `<div class="cais" role="dialog" aria-label="AI settings"><header><b>AI settings</b><span class="dim">${esc(app)} · the same in every Craft app</span><button type="button" data-a="close">Close</button></header><div class="body"></div></div>`;
    document.body.append(back); const body = back.querySelector('.body'); let found = cache;
    const close = () => back.remove();
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-a=close]')) close(); });
    document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc_); } });

    function draw() {
      const s = read(), K = window.CraftKeys, mode = K ? K.mode() : 'both', k = keys(), acct = window.CraftAccount && CraftAccount.user();
      body.innerHTML = `
        <h3>Where AI may run</h3><div class="modes">${[['local', 'Local only'], ['both', 'Both'], ['cloud', 'Cloud']].map(([m, l]) => `<button type="button" data-mode="${m}" class="${m === mode ? 'on' : ''}">${l}</button>`).join('')}</div>
        <p class="dim">${mode === 'local' ? 'Only AI in this browser, on this computer or your network: nothing is sent to a cloud company.' : mode === 'cloud' ? 'The cloud AI does the work, with your keys.' : 'Local AI first; the cloud where you choose it or it does better.'}</p>
        <h3>Use for</h3>${JOBS.map(([j, l, d]) => `<div class="job"><label for="cais-${j}"><b>${l}</b><br><span class="dim">${d}</span></label><select id="cais-${j}" data-job="${j}">${groupOpts(options(j, builtIn, found || []), s.jobs[j] || '')}</select></div>`).join('')}
        <h3>In this browser</h3>${builtIn.length ? `<div class="tags">${builtIn.map((b) => `<span title="${esc(b.note || '')}">${esc(b.name)}</span>`).join('')}</div><p class="dim">Small models that run inside the page (on the graphics card when there is one, else the processor): downloaded once, then offline.</p>` : '<p class="dim">This app has no built-in AI models.</p>'}
        <h3>This computer and your network</h3><div class="srvs">${found ? (found.length ? found.map(srvHtml).join('') : '<p class="dim">No AI program answered. Start Ollama, LM Studio or llama.cpp, then Look again. (A page from a web address needs the program to allow it: Ollama: set OLLAMA_ORIGINS=*; LM Studio: Developer › Enable CORS.)</p>') : '<p class="dim">Looking…</p>'}</div>
        <div class="row"><button type="button" data-a="scan">Look again</button><input data-a="addr" placeholder="another computer, e.g. http://192.168.1.30:11434" style="flex:1;min-width:200px"><button type="button" data-a="add">Add</button></div>
        ${s.servers.length ? `<p class="dim">Added: ${s.servers.map((b) => `${esc(b)} <button type="button" data-del="${esc(b)}" style="padding:0 6px">×</button>`).join(' ')}</p>` : ''}
        <h3>Cloud</h3><div class="tags">${CLOUD.map(([id, n]) => `<span>${esc(n)}: ${k[id] ? '<b class="ok">key saved</b>' : 'no key'}</span>`).join('')}</div>
        <p class="row">${K ? '<button type="button" data-a="keys">Keys…</button>' : ''}${window.CraftAccount && CraftAccount.server() ? `<button type="button" data-a="acct">${acct ? 'Your account (keys follow you)' : 'Log in: keys and choices follow you'}</button>` : ''}</p>`;
    }
    const groupOpts = (opts, cur) => { const groups = new Map(); for (const o of opts) { if (!groups.has(o.group)) groups.set(o.group, []); groups.get(o.group).push(o); } let h = ''; for (const [g, list] of groups) { const inner = list.map((o) => `<option value="${esc(o.value)}"${o.value === cur ? ' selected' : ''}>${esc(o.label)}${o.note ? ` (${esc(o.note)})` : ''}</option>`).join(''); h += g ? `<optgroup label="${esc(g)}">${inner}</optgroup>` : inner; } if (cur && !opts.some((o) => o.value === cur)) h += `<option value="${esc(cur)}" selected>${esc(cur.split('|').pop())} (not answering now)</option>`; return h; };
    const srvHtml = (srv) => `<div class="srv"><b>${esc(srv.name)}</b> <small>${esc(srv.base)} · ${isLocal(srv.base) ? 'this computer' : 'your network'} · ${srv.models.length} model${srv.models.length === 1 ? '' : 's'}</small><div class="tags">${srv.models.slice(0, 40).map((m) => `<span title="${esc(m.id)}">${esc(m.id.length > 38 ? m.id.slice(0, 36) + '…' : m.id)}${m.sees ? ' 👁' : ''}${m.thinks ? ' 💭' : ''}${m.paints ? ' 🎨' : ''}${m.cloud ? ' ☁' : ''}</span>`).join('')}</div></div>`;
    body.addEventListener('change', (e) => { const j = e.target.dataset.job; if (j) setChoice(j, e.target.value); });
    body.addEventListener('click', async (e) => {
      const m = e.target.closest('[data-mode]'); if (m && window.CraftKeys) { CraftKeys.setMode(m.dataset.mode); draw(); return; }
      const a = e.target.closest('[data-a]'), d = e.target.closest('[data-del]');
      if (d) { const s = read(); s.servers = s.servers.filter((b) => b !== d.dataset.del); write(s); found = await scan({ force: true }); draw(); return; }
      if (!a) return;
      if (a.dataset.a === 'scan') { found = null; draw(); found = await scan({ force: true }); draw(); }
      if (a.dataset.a === 'add') { const v = body.querySelector('[data-a=addr]').value.trim().replace(/\/+$/, ''); if (!/^https?:\/\/[^\s/]+/.test(v)) return; const s = read(); if (!s.servers.includes(v)) s.servers.push(v); write(s); found = null; draw(); found = await scan({ force: true }); draw(); }
      if (a.dataset.a === 'keys' && window.CraftKeys) { CraftKeys.open({ app }); }
      if (a.dataset.a === 'acct') window.open(CraftAccount.pageUrl(), 'craft-account');
    });
    window.addEventListener('craft-keys', function again() { if (!document.body.contains(back)) return window.removeEventListener('craft-keys', again); if (!back.contains(document.activeElement) || document.activeElement.tagName !== 'SELECT') draw(); });
    draw(); if (!found) scan().then((f) => { found = f; draw(); });
  }

  window.CraftAISettings = { open, scan, probe, authFor, options, choice, setChoice, ask, JOBS, KIND };
})();
