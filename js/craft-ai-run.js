/* Craft AI run (window.CraftAIRun): one way for every Craft app to ask an AI, in any of the three tiers, with the
   tier lights and activity lists kept right (CraftKeys) and cloud keys taken from your account (CraftAccount unlocks
   them into this browser at login; CraftKeys.shared() reads them). MASTER COPY in AccountCraft; apps keep a copy.

     CraftAIRun.ask({ job: 'chat'|'see'|'draw', prompt, system, image (base64, no data: prefix), json, schema,
                      what: 'what this is for (shown in Activity)', use: 'auto' | 'browser' | 'local' | 'cloud' | a choice value })
        → { text, tier, engine, model, ms }
     CraftAIRun.engines({ force })  → every engine this browser can reach now, per tier
     CraftAIRun.test({ job, onRow })  → asks each engine the same small question; rows of { tier, engine, model, ok, ms, answer, error }

   Tiers (and what was learned making them work):
     browser  Transformers.js inside the page (lib/craft-ai-libs.js, when the app has it): a small instruct model
              (SmolLM2-360M, about 250 MB, downloaded once and kept by the browser). WebGPU when there is a graphics card,
              else the processor (WebAssembly): no program, no key, nothing sent. Slow for long answers; fine for short ones.
     local    Ollama (:11434), LM Studio (:1234), llama.cpp (:9931 router, :8080), on this computer or your network, found by
              CraftAISettings.scan(). A page from a web address needs the program to allow it (Ollama: OLLAMA_ORIGINS=*;
              LM Studio: Enable CORS; llama.cpp: allowed). Ollama: think:false, keep_alive; <think> blocks are stripped.
     cloud    Claude (needs the anthropic-dangerous-direct-browser-access header), Gemini (x-goog-api-key header, not in the
              address), GPT, OpenRouter, Together (OpenAI-style). Ollama Cloud cannot be asked by a web page: its models come
              through your own Ollama (':cloud' models), so they count as local here.
   Ollama ':cloud' models are asked through your own Ollama but worked out in the cloud: they light the cloud tier.
   Automatic order by the mode (CraftKeys.mode): 'local' → browser and local only; 'both' → local, then browser, then
   cloud; 'cloud' → cloud first, then local. A job's own choice (CraftAISettings › Use for) always wins. */
(function () {
  'use strict';
  const K = () => window.CraftKeys, S = () => window.CraftAISettings;
  const APP = () => (document.title.split(/[\s–—-]/)[0] || 'Craft').trim();
  const keys = () => (K() ? K().shared().keys : (() => { try { return (JSON.parse(localStorage.getItem('craft-ai-keys') || 'null') || {}).keys || {}; } catch (e) { return {}; } })());
  const mode = () => (K() ? K().mode() : 'both');
  const short = (s, n = 160) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const NAMES = { anthropic: 'Claude', gemini: 'Gemini', openai: 'GPT', openrouter: 'OpenRouter', together: 'Together.ai' };

  // ------------------------------------------------------------------ browser: Transformers.js in this page
  const BROWSER_MODEL = { id: 'HuggingFaceTB/SmolLM2-360M-Instruct', name: 'SmolLM2 360M', mb: 250 };
  let gen = null, genDevice = '';
  const lib = () => window.CraftTF || null;   // (lib/craft-ai-libs.js: Transformers.js, Apache-2.0)
  const hasBrowserLib = () => !!(lib() && lib().pipeline);
  const gpuOk = async () => { try { return !!(navigator.gpu && (await navigator.gpu.requestAdapter())); } catch (e) { return false; } };
  async function browserGen(onProgress) {
    if (gen) return gen; const T = lib(); if (!T || !T.pipeline) throw new Error('This app has no in-browser AI library.');
    if (T.env) { T.env.allowLocalModels = false; T.env.useBrowserCache = true; }
    const device = (await gpuOk()) ? 'webgpu' : 'wasm';
    try { gen = await T.pipeline('text-generation', BROWSER_MODEL.id, { device, dtype: device === 'webgpu' ? 'q4f16' : 'q4', progress_callback: onProgress }); genDevice = device; }
    catch (e) { if (device !== 'webgpu') throw e; gen = await T.pipeline('text-generation', BROWSER_MODEL.id, { device: 'wasm', dtype: 'q4', progress_callback: onProgress }); genDevice = 'wasm'; }   // (the graphics card failed: the processor)
    return gen;
  }
  async function askBrowser({ prompt, system, json }) {
    const g = await browserGen(), msgs = [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: prompt + (json ? '\nAnswer with JSON only.' : '') }];
    const out = await g(msgs, { max_new_tokens: 256, do_sample: false });
    const last = out && out[0] && out[0].generated_text; return Array.isArray(last) ? String((last[last.length - 1] || {}).content || '') : String(last || '');
  }
  const browserDevice = () => (genDevice === 'webgpu' ? 'graphics card (WebGPU)' : genDevice === 'wasm' ? 'processor (WebAssembly)' : '');

  // ------------------------------------------------------------------ cloud: straight from this page to the company, with your key
  async function askCloud(provider, { prompt, system, image, json, model }) {
    const k = keys()[provider]; if (!k) throw new Error(`No ${NAMES[provider] || provider} key yet (AI settings › Keys, or log in to your account).`);
    const j = async (r) => { const t = await r.text(); let x = {}; try { x = JSON.parse(t); } catch (e) { /* not JSON */ } if (!r.ok) { const er = new Error(`${NAMES[provider]} said ${r.status}: ${short((x.error && (x.error.message || x.error)) || t, 140)}`); er.status = r.status; throw er; } return x; };
    if (provider === 'anthropic') {
      const h = { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' };
      model = model || 'claude-haiku-4-5';
      const content = image ? [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: image } }, { type: 'text', text: prompt }] : prompt;
      const r = await j(await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: h, body: JSON.stringify({ model, max_tokens: 1024, ...(system ? { system } : {}), messages: [{ role: 'user', content }] }) }));
      return { text: ((r.content || []).find((c) => c.type === 'text') || {}).text || '', model: r.model || model };
    }
    if (provider === 'gemini') {
      model = model || 'gemini-2.5-flash'; const h = { 'x-goog-api-key': k, 'content-type': 'application/json' };
      const parts = [...(image ? [{ inline_data: { mime_type: 'image/png', data: image } }] : []), { text: prompt }];
      const r = await j(await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: h, body: JSON.stringify({ contents: [{ parts }], ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}), ...(json ? { generationConfig: { responseMimeType: 'application/json' } } : {}) }) }));
      return { text: ((((r.candidates || [])[0] || {}).content || {}).parts || []).map((p) => p.text || '').join(''), model };
    }
    const base = { openai: 'https://api.openai.com/v1', openrouter: 'https://openrouter.ai/api/v1', together: 'https://api.together.xyz/v1' }[provider];
    if (!base) throw new Error(`${provider}: not a chat service here.`);
    model = model || { openai: 'gpt-4.1-mini', openrouter: 'openrouter/auto', together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' }[provider];
    const content = image ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: 'data:image/png;base64,' + image } }] : prompt;
    const r = await j(await fetch(base + '/chat/completions', { method: 'POST', headers: { authorization: 'Bearer ' + k, 'content-type': 'application/json', ...(provider === 'openrouter' ? { 'x-title': 'Craft apps' } : {}) }, body: JSON.stringify({ model, messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content }], ...(json ? { response_format: { type: 'json_object' } } : {}) }) }));
    return { text: String((((r.choices || [])[0] || {}).message || {}).content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(), model: r.model || model };
  }

  // ------------------------------------------------------------------ what can be reached now
  let found = null;
  async function engines({ force = false } = {}) {
    const out = { browser: [], local: [], cloud: [] };
    if (hasBrowserLib()) out.browser.push({ tier: 'browser', engine: 'Transformers.js', model: BROWSER_MODEL.id, label: `${BROWSER_MODEL.name} in this page (${(await gpuOk()) ? 'graphics card' : 'processor'})`, value: 'browser|chat' });
    if (S()) { found = await S().scan({ force }); for (const srv of found) for (const m of srv.models) { if (m.paints || m.incomplete) continue; (m.cloud ? out.cloud : out.local).push({ tier: m.cloud ? 'cloud' : 'local', engine: srv.label || srv.name, kind: srv.kind, base: srv.base, model: m.id, sees: m.sees, label: `${m.id} · ${srv.label || srv.name}${m.cloud ? ' (Ollama Cloud, through your Ollama)' : ''}`, value: `local|${srv.kind}|${srv.base}|${m.id}` }); } }
    const k = keys(); for (const p of ['anthropic', 'gemini', 'openai', 'openrouter', 'together']) if (k[p]) out.cloud.push({ tier: 'cloud', engine: NAMES[p], provider: p, label: `${NAMES[p]} (your key)`, value: `cloud|${p}` });
    return out;
  }

  // ------------------------------------------------------------------ asking
  function plan(job, use) {
    const m = mode(), choice = use && use.includes('|') ? parse(use) : (!use || use === 'auto') && S() ? S().choice(job) : null;
    if (choice) return [choice];
    const tiers = use && ['browser', 'local', 'cloud'].includes(use) ? [use] : m === 'local' ? ['local', 'browser'] : m === 'cloud' ? ['cloud', 'local'] : ['local', 'browser', 'cloud'];
    return tiers.map((t) => ({ where: t, auto: true }));
  }
  const parse = (v) => { const p = String(v).split('|'); return p[0] === 'browser' ? { where: 'browser' } : p[0] === 'cloud' ? { where: 'cloud', provider: p[1], model: p[2] || '' } : { where: 'local', kind: p[1], base: p[2], model: p.slice(3).join('|') }; };
  async function pickLocal(job) {
    const list = (await engines()).local; if (!list.length) return null;
    const mine = list.filter((e) => e.tier === 'local'), want = job === 'see' ? mine.filter((e) => e.sees) : mine;
    return (want.find((e) => /localhost|127\.0\.0\.1/.test(e.base)) || want[0] || null);
  }
  async function ask(o) {
    const job = o.job || 'chat', what = o.what || ({ chat: 'Write and answer', see: 'Look at a picture', draw: 'Make a drawing' }[job] || 'AI'), errors = [];
    for (const step of plan(job, o.use)) {
      let tier = step.where, engine = '', model = '', provider = '';
      try {
        let run;
        if (tier === 'browser') { if (!hasBrowserLib() || o.image) continue; engine = 'Transformers.js'; model = BROWSER_MODEL.name; run = () => askBrowser(o).then((text) => ({ text, model })); }
        else if (tier === 'local') {
          const e = step.auto ? await pickLocal(job) : { kind: step.kind, base: step.base, model: step.model, engine: S() && S().KIND[step.kind] }; if (!e) continue;
          if (/:cloud$|-cloud$/.test(e.model)) { if (mode() === 'local') continue; tier = 'cloud'; }   // (Ollama Cloud models: asked through your Ollama, worked out in the cloud)
          engine = e.engine || e.kind; model = e.model; run = () => S().ask({ kind: e.kind, base: e.base, model: e.model, prompt: o.prompt, system: o.system, image: o.image, json: o.json, schema: o.schema }).then((text) => ({ text, model: e.model }));
        } else {
          const k = keys(); provider = step.provider || ['anthropic', 'gemini', 'openai', 'openrouter', 'together'].find((p) => k[p]); if (!provider) continue;
          engine = NAMES[provider]; run = () => askCloud(provider, { ...o, model: step.model || o.model });
        }
        const t0 = performance.now(), label = `${engine}${model ? ' · ' + model : ''}`;
        const r = K() ? await K().track(tier, run, { engine: label }) : await run();
        const ms = Math.round(performance.now() - t0);
        if (K()) K().activity(tier, { what, engine, model: r.model || model, device: tier === 'browser' ? browserDevice() : '', ms, ok: true, provider, sent: short(o.prompt), came: short(r.text) });
        return { text: r.text, tier, engine, model: r.model || model, ms };
      } catch (err) {
        errors.push(`${engine || tier}: ${err.message}`);
        if (K()) K().activity(tier, { what, engine, model, ms: 0, ok: false, provider, status: err.status, sent: short(o.prompt), came: short(err.message) });
        if (!step.auto) break;
      }
    }
    throw new Error(errors.length ? 'No AI could answer: ' + errors.join(' · ') : mode() === 'local' ? 'No local AI is reachable (in this page or an AI program here), and the mode is Local only.' : 'No AI is set up yet: add a key, start Ollama / LM Studio / llama.cpp, or use an app with AI in the page.');
  }

  // ------------------------------------------------------------------ testing every engine
  async function test({ job = 'chat', prompt = 'Reply with just the word: hello', onRow, browser = true } = {}) {
    const all = await engines({ force: true }), rows = [];
    const one = async (e) => { const row = { tier: e.tier, engine: e.engine, model: e.model || '', label: e.label };
      try { const r = await ask({ job, prompt, what: 'Test', use: e.value }); Object.assign(row, { ok: true, ms: r.ms, answer: short(r.text, 60), model: r.model || row.model }); }
      catch (err) { Object.assign(row, { ok: false, error: short(err.message, 200) }); }
      rows.push(row); if (onRow) onRow(row); };
    if (browser) for (const e of all.browser) await one(e);
    for (const e of all.local) await one(e);
    for (const e of all.cloud) await one(e);
    return rows;
  }

  window.CraftAIRun = { ask, engines, test, askCloud, BROWSER_MODEL, hasBrowserLib, version: 1 };
})();
