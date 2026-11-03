/* ClipArtCraft – Make with AI (window.ClipArtMake): a picture made from words, on the fly. A drawing (SVG, the default)
   or a picture (PNG); on this computer or in the cloud (the title bar's switch says which may be used).
     This computer: a local AI program, when one is running here (nothing leaves the computer):
       drawings - Ollama (localhost:11434) or LM Studio (localhost:1234), their OpenAI-style /v1/chat/completions
       pictures - Automatic1111 / Forge (127.0.0.1:7860, /sdapi/v1/txt2img; started with --api)
     Cloud: the keys in the AI settings (CraftCloud.draw / CraftCloud.paint)
   The SVG that comes back is made safe (no scripts, no outside links) and kept in its own units; its PNG is drawn from
   it at a whole number of pixels per unit (CraftClipart.svgPng).
     open({ toast, categories, prompt, done(item) }) */
(function () {
  'use strict';
  const L = window.CraftClipart;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const KEY = 'clipartcraft-make';
  let S = { kind: 'svg', where: 'local', who: '', style: '', privacy: '', localUrl: '', localModel: '', sdUrl: 'http://127.0.0.1:7860' };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* blocked storage */ }
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* blocked */ } };
  const STYLES = [['', 'As I asked'], ['clip art', 'Clip art'], ['flat icon', 'Flat icon'], ['line art', 'Line art (black and white)'], ['cartoon', 'Cartoon'], ['sticker', 'Sticker (white edge)'], ['3D render', '3D render, glossy'], ['pixel art', 'Pixel art'], ['watercolour', 'Watercolour'], ['silhouette', 'Silhouette']];
  const mode = () => (window.CraftKeys ? CraftKeys.mode() : 'both');
  const track = (w, p) => (window.CraftKeys && CraftKeys.track ? CraftKeys.track(w, p) : p);
  const log = (w, o) => window.CraftKeys && CraftKeys.activity(w, o);

  // ------------------------------------------------------------------ what to ask for
  function drawPrompt(words, style) {
    return `Draw this as one piece of clip art, written as a single standalone SVG file: ${words}${style ? ` (style: ${style})` : ''}.
Rules: viewBox="0 0 1024 1024" with width="1024" height="1024", whole-number coordinates where you can; real shapes (path, circle, rect, polygon, gradients are fine); a see-through background (no full-size background rectangle); no <text> unless the words are asked for; no <image>, no scripts, no outside links or fonts; the subject centred, filling most of the space, with a little room round it.
Answer with the SVG code only, starting with <svg and ending with </svg>.`;
  }
  const paintPrompt = (words, style) => `${words}${style ? `, ${style} style` : ''}, a single piece of clip art, centred on a plain see-through (or plain white) background, no frame, no text unless asked`;
  // the SVG answer made safe: scripts, event handlers, foreign content and outside links taken out; a viewBox for sure
  function cleanSvg(text) {
    // (a model that thinks out loud first: its thinking left out; the last whole SVG in the answer is the one)
    const t = String(text).replace(/<think>[\s\S]*?<\/think>/gi, ''), all = t.match(/<svg\b[\s\S]*?<\/svg>/gi), m = all && [all[all.length - 1]]; if (!m) throw new Error('The answer had no SVG in it.');
    const doc = new DOMParser().parseFromString(m[0], 'image/svg+xml'), r = doc.documentElement; if (!r || r.nodeName !== 'svg' || doc.querySelector('parsererror')) throw new Error('The SVG in the answer could not be read.');
    r.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((e) => e.remove());
    for (const e of [r, ...r.querySelectorAll('*')]) for (const a of [...e.attributes]) { const n = a.name.toLowerCase(), v = a.value.trim(); if (n.startsWith('on') || ((n === 'href' || n === 'xlink:href' || n === 'src') && !/^#|^data:image\//i.test(v)) || /url\(\s*['"]?(?!#)/i.test(v) && n !== 'style') e.removeAttribute(a.name); }
    r.querySelectorAll('style').forEach((st) => { st.textContent = st.textContent.replace(/@import[^;]*;?/gi, '').replace(/url\(\s*['"]?(?!#)[^)]*\)/gi, 'none'); });
    if (!r.getAttribute('xmlns')) r.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!r.getAttribute('viewBox')) { const w = parseFloat(r.getAttribute('width')) || 1024, h = parseFloat(r.getAttribute('height')) || 1024; r.setAttribute('viewBox', `0 0 ${w} ${h}`); }
    return new XMLSerializer().serializeToString(r);
  }

  // ------------------------------------------------------------------ on this computer
  const LOCALS = ['http://localhost:11434/v1', 'http://localhost:1234/v1'];
  async function answers(url, ms = 1500) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(url, { signal: c.signal }); return r.ok ? r : null; } catch (e) { return null; } finally { clearTimeout(t); } }
  // the local chat servers that answer (Ollama, LM Studio, the address typed in) and their models (not embedding ones)
  const nameOf = (u) => (/11434/.test(u) ? 'Ollama' : /1234/.test(u) ? 'LM Studio' : 'Local AI server');
  async function localServers() {
    const out = [];
    for (const u of [...new Set([S.localUrl, ...LOCALS].filter(Boolean).map((x) => x.replace(/\/+$/, '')))]) { const r = await answers(u + '/models'); if (!r) continue; try { const j = await r.json(), list = (j.data || j.models || []).map((x) => x.id || x.name).filter((x) => x && !/embed/i.test(x)); if (list.length) out.push({ url: u, models: list, name: nameOf(u) }); } catch (e) { /* not that */ } }
    return out;
  }
  // the one to use: the server and model chosen (when it still answers), else the first found
  async function findLocal() { const all = await localServers(); const lc = all.find((x) => x.url === S.localUrl) || all[0]; return lc ? { ...lc, all } : null; }
  async function findPainter() { const u = (S.sdUrl || 'http://127.0.0.1:7860').replace(/\/+$/, ''); return (await answers(u + '/sdapi/v1/sd-models')) ? u : ''; }
  const bestLocal = (list) => (S.localModel && list.includes(S.localModel) ? S.localModel : list.find((x) => /coder/i.test(x)) || list.find((x) => /qwen|llama|mistral|gemma|phi|deepseek|nemotron/i.test(x)) || list[0]);
  async function drawLocal(prompt) {
    const lc = await findLocal(); if (!lc) throw new Error('No local AI found on this computer: start Ollama (with a model such as qwen2.5-coder) or LM Studio (its server on), or choose Cloud.');
    const m = bestLocal(lc.models), t0 = performance.now();
    const r = await track('local', fetch(lc.url + '/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: m, messages: [{ role: 'user', content: prompt }], temperature: 0.4 }) }));
    if (!r.ok) throw new Error(`${lc.name} said ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const text = (await r.json()).choices?.[0]?.message?.content || '';
    log('local', { what: 'Draw a picture (SVG)', model: `${m} (${lc.name})`, ms: Math.round(performance.now() - t0), came: `${text.length} characters` });
    return { text, model: `${m} (${lc.name}, this computer)` };
  }
  async function paintLocal(prompt) {
    const u = await findPainter(); if (!u) throw new Error('No local picture maker found: start Automatic1111 or Forge with --api (at 127.0.0.1:7860), or choose Cloud.');
    const t0 = performance.now(), r = await track('local', fetch(u + '/sdapi/v1/txt2img', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, negative_prompt: 'text, watermark, frame, border, blurry', width: 1024, height: 1024, steps: 28 }) }));
    if (!r.ok) throw new Error(`The local picture maker said ${r.status}.`);
    const b64 = (await r.json()).images?.[0]; if (!b64) throw new Error('The local picture maker sent no picture back.');
    const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    log('local', { what: 'Make a picture', model: 'Stable Diffusion (this computer)', ms: Math.round(performance.now() - t0), came: `${Math.round(u8.length / 1024)} KB` });
    return { blob: new Blob([u8], { type: 'image/png' }), model: 'Stable Diffusion (this computer)' };
  }

  // ------------------------------------------------------------------ the window
  function open(o = {}) {
    const C = window.CraftCloud, cloudOk = mode() !== 'local', localOk = mode() !== 'cloud';
    if (!localOk && S.where === 'local') S.where = 'cloud'; if (!cloudOk && S.where === 'cloud') S.where = 'local';
    let result = null, busy = false;
    const back = document.createElement('div'); back.className = 'lists-dlg mk'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-label', 'Make with AI');
    const providers = () => (C ? C.PROVIDERS.filter((p) => C.has(p) && (S.kind === 'svg' || C.canPaint().includes(p))) : []);
    function draw() {
      const ps = providers(); if (S.who && !ps.includes(S.who)) S.who = '';
      back.innerHTML = `<div class="lists-in mk-in"><div class="lists-head"><b>Make with AI</b><span class="grow"></span><button class="btn outline" type="button" data-m="close">Close</button></div>
        <label class="field"><span>What to make</span><textarea class="input" data-m="words" rows="3" placeholder="a red vintage pickup truck, side view">${esc(o.prompt || '')}</textarea></label>
        <div class="two"><div class="field"><span>Make</span><div class="seg" role="group"><button class="btn" type="button" data-kind="svg" aria-pressed="${S.kind === 'svg'}" title="A drawing: sharp at any size, editable in Edit the drawing">A drawing (SVG)</button><button class="btn" type="button" data-kind="png" aria-pressed="${S.kind === 'png'}" title="A painted picture (shading, photo-like)">A picture (PNG)</button></div></div>
          <label class="field"><span>Style</span><select class="input" data-m="style">${STYLES.map(([v, l]) => `<option value="${esc(v)}" ${S.style === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>
        <div class="field"><span>Where</span><div class="seg" role="group"><button class="btn" type="button" data-where="local" aria-pressed="${S.where === 'local'}" ${localOk ? '' : 'disabled title="The title bar says cloud only"'}>This computer</button><button class="btn" type="button" data-where="cloud" aria-pressed="${S.where === 'cloud'}" ${cloudOk ? '' : 'disabled title="The title bar says local only"'}>Cloud</button></div></div>
        ${S.where === 'cloud' ? (ps.length ? `<label class="field"><span>Cloud AI</span><select class="input" data-m="who">${ps.map((p) => `<option value="${p}" ${(S.who || ps[0]) === p ? 'selected' : ''}>${esc(C.NAMES[p])}</option>`).join('')}</select></label><p class="hint">Uses your own key; a drawing costs a few cents, a picture a few cents more.</p>` : `<p class="hint">${S.kind === 'png' ? 'Making a picture needs a key for GPT (OpenAI), Gemini or OpenRouter' : 'No cloud AI key yet'}: add one with the key in the title bar (AI settings).</p>`)
          : `<p class="hint mk-local">${S.kind === 'svg' ? 'Looking for Ollama or LM Studio on this computer…' : 'Looking for Automatic1111 / Forge on this computer…'}</p><details class="names-more"><summary>Local AI addresses</summary><label class="field"><span>Chat server (drawings)</span><input class="input" data-m="localUrl" value="${esc(S.localUrl)}" placeholder="http://localhost:11434/v1 (Ollama) or :1234/v1 (LM Studio)"></label><label class="field"><span>Picture maker</span><input class="input" data-m="sdUrl" value="${esc(S.sdUrl)}"></label></details>`}
        <div class="btns"><button class="btn primary" type="button" data-m="go" ${busy ? 'disabled' : ''}>${busy ? 'Making it…' : result ? 'Make another' : 'Make it'}</button></div>
        <div class="mk-out">${result ? `<div class="mk-pic check-bg"><img src="${result.url}" alt=""></div><p class="hint">${esc(result.model)} · ${result.ms} s${result.svg ? ` · SVG ${Math.round(result.svg.length / 1024)} KB` : ''}</p>
          <div class="two"><label class="field"><span>Name</span><input class="input" data-m="name" value="${esc(result.name)}"></label><label class="field"><span>Category</span><input class="input" data-m="cat" list="mk-cats" value="${esc(result.cat || '')}" placeholder="Not sorted yet"><datalist id="mk-cats">${(o.categories || []).map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label></div>
          <label class="field"><span>Who can see it</span><select class="input" data-m="privacy"><option value="" ${S.privacy !== 'me' ? 'selected' : ''}>Everyone</option><option value="me" ${S.privacy === 'me' ? 'selected' : ''}>Only me (on the server: only with your key)</option></select></label>
          <div class="btns"><button class="btn primary" type="button" data-m="add">Add to the library</button></div>` : `<p class="hint mk-err"></p>`}</div></div>`;
      if (S.where === 'local' && S.kind === 'svg') findLocal().then((lc) => { const h = back.querySelector('.mk-local'); if (!h) return; if (!lc) { h.textContent = 'No Ollama or LM Studio answers on this computer: start one (a model such as qwen2.5-coder draws well), or choose Cloud.'; return; }
        const cur = `${lc.url}|${bestLocal(lc.models)}`; h.outerHTML = `<label class="field mk-local"><span>Local AI</span><select class="input" data-m="local">${lc.all.map((sv) => `<optgroup label="${esc(sv.name)}">${sv.models.map((m) => `<option value="${esc(sv.url + '|' + m)}" ${sv.url + '|' + m === cur ? 'selected' : ''}>${esc(m)}</option>`).join('')}</optgroup>`).join('')}</select></label>`; });
      if (S.where === 'local' && S.kind !== 'svg') (S.kind === 'svg' ? null : findPainter().then((u) => u ? `Found a picture maker at ${u}.` : 'No Automatic1111 / Forge answers at 127.0.0.1:7860 (start it with --api), or choose Cloud.')).then((t) => { const h = back.querySelector('.mk-local'); if (h) h.textContent = t; });
    }
    async function go() {
      const words = back.querySelector('[data-m=words]').value.trim(); if (!words) return back.querySelector('[data-m=words]').focus(); o.prompt = words;
      busy = true; const keepName = result && result.nameTyped ? result.name : ''; draw(); const t0 = performance.now();
      try {
        let r; if (S.kind === 'svg') { const a = S.where === 'local' ? await drawLocal(drawPrompt(words, S.style)) : await C.draw(drawPrompt(words, S.style), S.who || undefined); const svg = cleanSvg(a.text); r = { svg, model: a.model, url: L.svgUrl(svg) }; }
        else { const a = S.where === 'local' ? await paintLocal(paintPrompt(words, S.style)) : await C.paint(paintPrompt(words, S.style), S.who || undefined); r = { blob: a.blob, model: a.model, url: URL.createObjectURL(a.blob) }; }
        const name = keepName || words.replace(/^(a|an|the)\s+/i, '').split(/[,.;:]/)[0].split(/\s+/).slice(0, 4).join(' ');
        result = { ...r, name: name.charAt(0).toUpperCase() + name.slice(1), cat: result ? result.cat : '', ms: ((performance.now() - t0) / 1000).toFixed(1), words };
      } catch (e) { busy = false; draw(); const er = back.querySelector('.mk-err') || back.querySelector('.mk-out'); if (er) { er.className = 'hint mk-err'; er.textContent = e.message || String(e); } if (o.toast) o.toast(e.message || String(e)); return; }
      busy = false; draw();
    }
    async function add() {
      const b = back.querySelector('[data-m=add]'); b.disabled = true; b.textContent = 'Adding…';
      try {
        const name = back.querySelector('[data-m=name]').value.trim() || 'Made with AI', category = back.querySelector('[data-m=cat]').value.trim();
        const png = result.svg ? (await L.svgPng(result.svg)).blob : result.blob;
        const it = await L.makeItem({ name, category, png, svg: result.svg || null, tags: S.style ? [S.style] : [], source: `Made with AI: ${result.model}` });
        Object.assign(it, { type: 'clipart', description: result.words, style: S.style || '', privacy: S.privacy === 'me' ? 'me' : '', author: `AI (${result.model})`, checked: true });
        await L.put(it); if (o.toast) o.toast(`Added “${it.name}”${result.svg ? ' (SVG, and a PNG drawn from it)' : ''}.`); back.remove(); if (o.done) o.done(it);
      } catch (e) { b.disabled = false; b.textContent = 'Add to the library'; if (o.toast) o.toast('Adding failed: ' + (e.message || e)); }
    }
    back.addEventListener('click', (e) => {
      if (e.target === back || e.target.closest('[data-m=close]')) return back.remove();
      const k = e.target.closest('[data-kind]'); if (k) { S.kind = k.dataset.kind; keep(); o.prompt = back.querySelector('[data-m=words]').value; draw(); return; }
      const w = e.target.closest('[data-where]'); if (w && !w.disabled) { S.where = w.dataset.where; keep(); o.prompt = back.querySelector('[data-m=words]').value; draw(); return; }
      if (e.target.closest('[data-m=go]') && !busy) return go();
      if (e.target.closest('[data-m=add]')) return add();
    });
    back.addEventListener('change', (e) => { const m = e.target.dataset.m; if (m === 'local') { const [u, ...mm] = e.target.value.split('|'); S.localUrl = u; S.localModel = mm.join('|'); keep(); return; } if (['style', 'who', 'privacy', 'localUrl', 'sdUrl'].includes(m)) { S[m] = e.target.value.trim(); keep(); if (m === 'localUrl' || m === 'sdUrl') { o.prompt = back.querySelector('[data-m=words]').value; draw(); } } if (m === 'cat' && result) result.cat = e.target.value; });
    back.addEventListener('input', (e) => { if (e.target.dataset.m === 'name' && result) { result.name = e.target.value; result.nameTyped = true; } });
    back.addEventListener('keydown', (e) => { if (e.key === 'Escape') back.remove(); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !busy) go(); });
    draw(); document.body.append(back); back.querySelector('[data-m=words]').focus();
  }
  window.ClipArtMake = { open, cleanSvg, drawPrompt };
})();
