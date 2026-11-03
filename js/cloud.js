/* ClipArtCraft – Ask a cloud AI (window.CraftCloud): for the pictures the AI in this browser gets wrong. It uses the
   user's own key for Claude (Anthropic), Gemini (Google), GPT (OpenAI) or OpenRouter, typed into ClipArtCraft and kept
   only in this browser (localStorage); each request goes straight from this page to that company and nowhere else.
     look(canvas, lists)  → { name, category, style, form, tags, description, text, model }
     models(provider)     → the models that key can use that can look at pictures (asked from the service itself)
   One picture costs a fraction of a cent on the small models. */
(function () {
  'use strict';
  const KEY = 'clipartcraft-cloud';
  const NAMES = { anthropic: 'Claude (Anthropic)', gemini: 'Gemini (Google)', openai: 'GPT (OpenAI)', openrouter: 'OpenRouter (many models)' };
  const PROVIDERS = Object.keys(NAMES);
  let cfg = { keys: { anthropic: '', gemini: '', openai: '', openrouter: '' }, provider: '', model: '' };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) cfg = { keys: { ...cfg.keys, ...(s.keys || {}) }, provider: s.provider || '', model: s.model || '' }; } catch (e) { /* blocked storage */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* blocked storage */ } };
  // the keys every Craft app shares (AI settings in the title bar): they fill in what this one has not got, and keys
  // typed here are shared with the others
  const K = () => window.CraftKeys;
  const fromShared = () => { if (!K()) return; const s = K().shared(); for (const p of Object.keys(cfg.keys)) if (s.keys[p]) cfg.keys[p] = s.keys[p]; };
  fromShared(); window.addEventListener('craft-keys', (e) => { if (e.detail && e.detail.forget) { for (const p of Object.keys(cfg.keys)) cfg.keys[p] = ''; save(); return; } fromShared(); });
  const has = (p) => !!(cfg.keys[p] || '').trim();
  // the provider in use: the one chosen, or the first with a key
  const provider = () => (has(cfg.provider) ? cfg.provider : PROVIDERS.find(has) || '');
  // ImageCraft keeps its own keys; opened from files on this computer both apps share the browser's storage, so they can be copied over
  function imageCraftKeys() { try { const s = JSON.parse(localStorage.getItem('imagecraft-cloud') || 'null'); return s && s.keys ? PROVIDERS.filter((p) => (s.keys[p] || '').trim()).reduce((o, p) => ({ ...o, [p]: s.keys[p].trim() }), {}) : {}; } catch (e) { return {}; } }

  async function call(url, opts, who) {
    let r; try { r = await (window.CraftKeys ? CraftKeys.track('cloud', fetch(url, opts)) : fetch(url, opts)); } catch (e) { throw new Error(`${NAMES[who]} could not be reached (no internet, or the browser blocked it).`); }
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* not JSON */ }
    if (!r.ok) {
      const m = (j && j.error && (j.error.message || j.error.type)) || t.slice(0, 200);
      if (/quota|billing|credit balance|insufficient_quota|insufficient credits|more credits/i.test(t)) throw new Error(`${NAMES[who]}: this account has no paid credit for it yet. ${m}`);
      throw new Error(`${NAMES[who]}: ${r.status === 401 || r.status === 403 ? 'the key was refused (check it in Cloud AI settings). ' : ''}${m}`);
    }
    return j;
  }
  const anthHeaders = (k, json) => ({ ...(json ? { 'content-type': 'application/json' } : {}), 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' });
  const orHeaders = (k) => ({ 'content-type': 'application/json', Authorization: `Bearer ${k}`, 'X-Title': 'ClipArtCraft' });

  // which models the key can use that look at pictures, the cheap quick ones first
  async function models(p) {
    const k = (cfg.keys[p] || '').trim(); if (!k) return [];
    let list = [];
    if (p === 'anthropic') { const j = await call('https://api.anthropic.com/v1/models?limit=100', { headers: anthHeaders(k) }, p); list = (j.data || []).map((m) => ({ id: m.id, name: m.display_name || m.id })); }
    else if (p === 'gemini') { const j = await call(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(k)}`, {}, p); list = (j.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent') && !/embedding|aqa|tts|image|audio|live/i.test(m.name)).map((m) => ({ id: m.name.replace(/^models\//, ''), name: m.displayName || m.name })); }
    else if (p === 'openrouter') { const j = await call('https://openrouter.ai/api/v1/models', { headers: orHeaders(k) }, p); list = (j.data || []).filter((m) => (m.architecture?.input_modalities || []).includes('image') && !(m.architecture?.output_modalities || []).includes('image')).map((m) => ({ id: m.id, name: m.name || m.id })); }
    else { const j = await call('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${k}` } }, p); list = (j.data || []).filter((m) => /^(gpt-4o|gpt-4\.1|gpt-5|o3|o4)/.test(m.id) && !/audio|realtime|transcribe|tts|search/.test(m.id)).map((m) => ({ id: m.id, name: m.id })); }
    const quick = /haiku|flash|mini|nano|lite/i;
    return list.sort((a, b) => (quick.test(b.id) - quick.test(a.id)) || a.name.localeCompare(b.name));
  }
  // the model to use: the one chosen, or a quick, cheap one that can see
  async function model(p) {
    if (cfg.provider === p && cfg.model) return cfg.model;
    const list = await models(p), pref = { anthropic: /haiku/i, gemini: /flash(?!.*(lite|thinking))/i, openai: /^gpt-(5|4\.1|4o)-mini$/i, openrouter: /gemini.*flash/i }[p];
    const m = (list.find((x) => pref.test(x.id)) || list[0] || {}).id; if (!m) throw new Error(`${NAMES[p]}: that key has no model that can look at pictures.`);
    return m;
  }

  // a JPEG of at most `max` pixels across on white (what the services take; smaller is quicker and cheaper)
  function jpeg(canvas, max = 768) {
    const k = Math.min(1, max / Math.max(canvas.width, canvas.height)), o = document.createElement('canvas'); o.width = Math.max(1, Math.round(canvas.width * k)); o.height = Math.max(1, Math.round(canvas.height * k));
    const x = o.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, o.width, o.height); x.imageSmoothingQuality = 'high'; x.drawImage(canvas, 0, 0, o.width, o.height);
    return o.toDataURL('image/jpeg', 0.9).split(',')[1];
  }
  const promptFor = (lists) => `This is one piece of clip art from a clip-art library. Look at it closely and say exactly what it shows.
Answer with JSON only, in this form: {"name": "...", "category": "...", "style": "...", "form": "...", "tags": ["..."], "description": "...", "text": "..."}
- name: what it is, in 1 to 3 plain words, as specific as you can tell (for example "Stagecoach" rather than "Wagon", "Purple Heart medal" rather than "Medal"). Capitalise the first word only.
- category: exactly one of: ${lists.categories.join(' | ')}
- style: exactly one of: ${lists.styles.join(' | ')}
- form: exactly one of: ${lists.forms.join(' | ')}
- tags: 3 to 8 short search words (things in it, colours, era, use)
- description: one plain sentence describing the picture
- text: any words written on the picture, or ""`;

  // the answer read: only words from the lists count for category, style and form (matched without minding case)
  function answerOf(text, lists, label) {
    const js = String(text).replace(/<think>[\s\S]*?<\/think>/gi, '').match(/\{[\s\S]*\}/); if (!js) throw new Error(`${label} did not answer in the expected form.`);
    let a; try { a = JSON.parse(js[0]); } catch (e) { throw new Error(`${label} did not answer in the expected form.`); }
    const fit = (v, list) => list.find((x) => x.toLowerCase() === String(v || '').trim().toLowerCase()) || '';
    const name = String(a.name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return { name: name ? name.charAt(0).toUpperCase() + name.slice(1) : '', category: fit(a.category, lists.categories), style: fit(a.style, lists.styles), form: fit(a.form, lists.forms),
      tags: (Array.isArray(a.tags) ? a.tags : []).map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10), description: String(a.description || '').trim(), text: String(a.text || '').trim(), model: label };
  }
  // the same question to an AI on this computer (LM Studio, Ollama: their OpenAI-style /v1/chat/completions), one that sees pictures
  async function lookLocal(canvas, lists, { url, model, name }) {
    const t0 = performance.now(), label = `${model} (${name})`, track = (pr) => (window.CraftKeys && CraftKeys.track ? CraftKeys.track(name === 'Ollama Cloud' ? 'cloud' : 'local', pr) : pr), where = name === 'Ollama Cloud' ? 'cloud' : 'local';
    try {
      const r = await track(fetch(url + '/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${jpeg(canvas)}` } }, { type: 'text', text: promptFor(lists) }] }] }) }));
      if (!r.ok) throw new Error(`${name} said ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const text = (await r.json()).choices?.[0]?.message?.content || '', a = answerOf(text, lists, label);
      if (window.CraftKeys) CraftKeys.activity(where, { what: 'Name and sort a picture', model: label, ms: Math.round(performance.now() - t0), came: text.slice(0, 300) });
      return a;
    } catch (e) { if (window.CraftKeys) CraftKeys.activity(where, { what: 'Name and sort a picture', model: label, ok: false, came: e.message }); throw e; }
  }
  async function look(canvas, lists, who) {
    const p = who && has(who) ? who : provider(); if (!p) throw new Error('No cloud AI key yet: add one in Cloud AI settings.'); const t0 = performance.now(), logIt = (o) => window.CraftKeys && CraftKeys.activity('cloud', { what: 'Name and sort a picture', model: `${o.m || ''} (${NAMES[p]})`, ms: Math.round(performance.now() - t0), sent: `a ${canvas.width} × ${canvas.height} picture (as a 768 px JPEG) and the lists`, ...o });
    try {
    const k = cfg.keys[p].trim(), m = await model(p), b64 = jpeg(canvas), prompt = promptFor(lists); let text = '';
    if (p === 'anthropic') {
      const j = await call('https://api.anthropic.com/v1/messages', { method: 'POST', headers: anthHeaders(k, true), body: JSON.stringify({ model: m, max_tokens: 600, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }, { type: 'text', text: prompt }] }] }) }, p);
      text = (j.content || []).map((c) => c.text || '').join('');
    } else if (p === 'gemini') {
      const j = await call(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(k)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }) }, p);
      text = ((j.candidates || [])[0]?.content?.parts || []).map((x) => x.text || '').join('');
    } else {
      const url = p === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions', headers = p === 'openrouter' ? orHeaders(k) : { 'content-type': 'application/json', Authorization: `Bearer ${k}` };
      const j = await call(url, { method: 'POST', headers, body: JSON.stringify({ model: m, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } }, { type: 'text', text: prompt }] }] }) }, p);
      text = j.choices?.[0]?.message?.content || '';
    }
    const js = text.match(/\{[\s\S]*\}/); if (!js) throw new Error(`${NAMES[p]} did not answer in the expected form.`); logIt({ m, came: text.slice(0, 300) });
    let a; try { a = JSON.parse(js[0]); } catch (e) { throw new Error(`${NAMES[p]} did not answer in the expected form.`); }
    // only words from the lists count for category, style and form (matched without minding case)
    const fit = (v, list) => list.find((x) => x.toLowerCase() === String(v || '').trim().toLowerCase()) || '';
    const name = String(a.name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    return { name: name ? name.charAt(0).toUpperCase() + name.slice(1) : '', category: fit(a.category, lists.categories), style: fit(a.style, lists.styles), form: fit(a.form, lists.forms),
      tags: (Array.isArray(a.tags) ? a.tags : []).map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10), description: String(a.description || '').trim(), text: String(a.text || '').trim(), model: `${m} (${NAMES[p]})` };
    } catch (e) { logIt({ ok: false, came: e.message }); throw e; }
  }

  // ------------------------------------------------------------------ making pictures (Make with AI, js/makeai.js)
  // A drawing (SVG) is written by a text model (Claude, Gemini, GPT, OpenRouter: a capable one, not the quickest);
  // a picture (PNG) by an image model: GPT-image (OpenAI), Gemini's image model, or one of OpenRouter's. Claude makes no pictures.
  const DRAWERS = { anthropic: /sonnet|opus/i, gemini: /pro(?!.*(image|tts|vision))/i, openai: /^gpt-(5|4\.1)(?!.*(mini|nano))/i, openrouter: /anthropic\/claude.*sonnet|google\/gemini.*pro/i };
  async function drawModel(p) { if (cfg.provider === p && cfg.drawModel) return cfg.drawModel; const list = await models(p); const m = (list.find((x) => DRAWERS[p].test(x.id)) || list.find((x) => !/haiku|flash|mini|nano|lite/i.test(x.id)) || list[0] || {}).id; if (!m) throw new Error(`${NAMES[p]}: that key has no model to draw with.`); return m; }
  async function chat(p, m, prompt, max = 16000) {
    const k = cfg.keys[p].trim();
    if (p === 'anthropic') { const j = await call('https://api.anthropic.com/v1/messages', { method: 'POST', headers: anthHeaders(k, true), body: JSON.stringify({ model: m, max_tokens: max, messages: [{ role: 'user', content: prompt }] }) }, p); return (j.content || []).map((c) => c.text || '').join(''); }
    if (p === 'gemini') { const j = await call(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(k)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: max } }) }, p); return ((j.candidates || [])[0]?.content?.parts || []).map((x) => x.text || '').join(''); }
    const url = p === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions', headers = p === 'openrouter' ? orHeaders(k) : { 'content-type': 'application/json', Authorization: `Bearer ${k}` };
    const j = await call(url, { method: 'POST', headers, body: JSON.stringify({ model: m, messages: [{ role: 'user', content: prompt }] }) }, p); return j.choices?.[0]?.message?.content || '';
  }
  async function draw(prompt, who) {
    const p = who && has(who) ? who : provider(); if (!p) throw new Error('No cloud AI key yet: add one in the AI settings.'); const t0 = performance.now(), m = await drawModel(p);
    try { const text = await chat(p, m, prompt); if (window.CraftKeys) CraftKeys.activity('cloud', { what: 'Draw a picture (SVG)', model: `${m} (${NAMES[p]})`, ms: Math.round(performance.now() - t0), sent: prompt.slice(0, 300), came: `${text.length} characters` }); return { text, model: `${m} (${NAMES[p]})` }; }
    catch (e) { if (window.CraftKeys) CraftKeys.activity('cloud', { what: 'Draw a picture (SVG)', model: `${m} (${NAMES[p]})`, ok: false, came: e.message }); throw e; }
  }
  // which providers with a key can paint (make a picture)
  const PAINTERS = ['openai', 'gemini', 'openrouter'];
  const canPaint = () => PAINTERS.filter(has);
  async function paint(prompt, who, { transparent = true } = {}) {
    const p = who && PAINTERS.includes(who) && has(who) ? who : canPaint()[0]; if (!p) throw new Error('Making a picture needs a key for GPT (OpenAI), Gemini or OpenRouter (Claude makes no pictures).');
    const k = cfg.keys[p].trim(), t0 = performance.now(); let m = '', b64 = '', type = 'image/png';
    try {
      if (p === 'openai') { m = 'gpt-image-1'; const j = await call('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${k}` }, body: JSON.stringify({ model: m, prompt, size: '1024x1024', ...(transparent ? { background: 'transparent' } : {}), output_format: 'png' }) }, p); b64 = j.data?.[0]?.b64_json || ''; }
      else if (p === 'gemini') {
        const all = await call(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(k)}`, {}, p), list = (all.models || []).map((x) => x.name.replace(/^models\//, '')).filter((x) => /image/i.test(x) && !/imagen/i.test(x));
        m = list.find((x) => /flash.*image/i.test(x)) || list[0]; if (!m) throw new Error('Gemini: that key has no image model.');
        const j = await call(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(k)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }) }, p);
        const part = ((j.candidates || [])[0]?.content?.parts || []).find((x) => x.inlineData || x.inline_data); const d = part && (part.inlineData || part.inline_data); if (d) { b64 = d.data; type = d.mimeType || d.mime_type || type; }
      } else {
        const all = await call('https://openrouter.ai/api/v1/models', { headers: orHeaders(k) }, p), list = (all.data || []).filter((x) => (x.architecture?.output_modalities || []).includes('image')).map((x) => x.id);
        m = list.find((x) => /gemini.*image/i.test(x)) || list[0]; if (!m) throw new Error('OpenRouter: no model that makes pictures.');
        const j = await call('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: orHeaders(k), body: JSON.stringify({ model: m, modalities: ['image', 'text'], messages: [{ role: 'user', content: prompt }] }) }, p);
        const u = j.choices?.[0]?.message?.images?.[0]?.image_url?.url || ''; const mm = u.match(/^data:([^;]+);base64,(.*)$/); if (mm) { type = mm[1]; b64 = mm[2]; }
      }
      if (!b64) throw new Error(`${NAMES[p]} sent no picture back (it may have turned the request down).`);
      const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      if (window.CraftKeys) CraftKeys.activity('cloud', { what: 'Make a picture', model: `${m} (${NAMES[p]})`, ms: Math.round(performance.now() - t0), sent: prompt.slice(0, 300), came: `${Math.round(u8.length / 1024)} KB ${type}` });
      return { blob: new Blob([u8], { type }), model: `${m} (${NAMES[p]})` };
    } catch (e) { if (window.CraftKeys) CraftKeys.activity('cloud', { what: 'Make a picture', model: `${m || '?'} (${NAMES[p]})`, ok: false, came: e.message }); throw e; }
  }

  window.CraftCloud = {
    NAMES, PROVIDERS, has, provider, models, look, lookLocal, imageCraftKeys, draw, paint, canPaint, model,
    ready: () => !!provider(),
    settings: () => ({ keys: { ...cfg.keys }, provider: cfg.provider, model: cfg.model }),
    set(o) { cfg = { keys: { ...cfg.keys, ...(o.keys || {}) }, provider: o.provider ?? cfg.provider, model: o.model ?? cfg.model }; save(); if (K() && o.keys) K().share({ keys: o.keys }); },
    // where AI runs (the title bar's switch): local only, both, or cloud
    mode: () => (K() ? K().mode() : 'both'),
  };
})();
