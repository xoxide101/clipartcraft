/* ClipArtCraft – Ask an AI (window.ClipArtAsk): who looks at the chosen pictures to name and sort them, from every AI
   that can see pictures, grouped by where it runs:
     In this browser   the built-in CLIP + Florence-2 (Sort with AI)
     This computer     LM Studio (models of type "vlm") and Ollama (models with the "vision" capability), asked at
                       localhost:1234 and localhost:11434: nothing leaves the computer
     Ollama Cloud      Ollama models ending in ":cloud" (they run on Ollama's servers)
     Cloud             Claude, Gemini, GPT, OpenRouter: each one with a key in the AI settings
   The choice is remembered; the title bar's switch (local only / both / cloud) turns off what it rules out.
     choose({ count }) → { kind: 'browser' | 'local' | 'cloud', url?, model?, name?, provider?, label } or null */
(function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const KEY = 'clipartcraft-ask';
  let last = ''; try { last = localStorage.getItem(KEY) || ''; } catch (e) { /* blocked storage */ }
  const mode = () => (window.CraftKeys ? CraftKeys.mode() : 'both');
  async function get(url, opts = {}, ms = 2000) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(url, { ...opts, signal: c.signal }); return r.ok ? await r.json() : null; } catch (e) { return null; } finally { clearTimeout(t); } }
  // the AIs on this computer that see pictures
  async function locals() {
    const out = [];
    const lms = await get('http://localhost:1234/api/v0/models');
    if (lms) for (const m of lms.data || []) if (m.type === 'vlm') out.push({ kind: 'local', name: 'LM Studio', url: 'http://localhost:1234/v1', model: m.id, note: m.state === 'loaded' ? 'loaded' : 'loads when asked' });
    const ol = await get('http://localhost:11434/api/tags');
    if (ol) await Promise.all((ol.models || []).map(async (m) => { const s = await get('http://localhost:11434/api/show', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: m.name }) }, 4000);
      if (s && (s.capabilities || []).includes('vision')) out.push({ kind: 'local', name: /:cloud$/.test(m.name) ? 'Ollama Cloud' : 'Ollama', url: 'http://localhost:11434/v1', model: m.name, note: m.details && m.details.parameter_size ? m.details.parameter_size : '' }); }));
    return out.sort((a, b) => a.name.localeCompare(b.name) || a.model.localeCompare(b.model));
  }
  const idOf = (o) => (o.kind === 'browser' ? 'browser' : o.kind === 'cloud' ? `cloud|${o.provider}` : `local|${o.url}|${o.model}`);
  function choose({ count = 1 } = {}) {
    return new Promise((done) => {
      const C = window.CraftCloud, back = document.createElement('div'); back.className = 'lists-dlg ask'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-label', 'Ask an AI');
      let list = null; const m = mode();
      const draw = () => {
        const browser = [{ kind: 'browser', label: 'CLIP + Florence-2', note: 'built in: names from the word lists' }];
        const cloud = C ? C.PROVIDERS.filter((p) => C.has(p)).map((p) => ({ kind: 'cloud', provider: p, label: C.NAMES[p], note: 'your key: a fraction of a cent a picture' })) : [];
        const here = (list || []).filter((o) => o.name !== 'Ollama Cloud'), oc = (list || []).filter((o) => o.name === 'Ollama Cloud');
        const group = (title, where, items, off, empty) => `<div class="ask-group"><b>${title}</b> <small class="hint">${where}</small>${items.length ? items.map((o) => { const id = idOf(o); return `<label class="ask-row${off ? ' off' : ''}"><input type="radio" name="ask-who" value="${esc(id)}" ${off ? 'disabled' : ''} ${id === last && !off ? 'checked' : ''}><span>${esc(o.label || `${o.model}`)}${o.kind === 'local' ? ` <small class="hint">${esc(o.name === 'Ollama Cloud' ? 'Ollama' : o.name)}${o.note ? ' · ' + esc(o.note) : ''}</small>` : o.note ? ` <small class="hint">${esc(o.note)}</small>` : ''}</span></label>`; }).join('') : `<p class="hint">${empty}</p>`}</div>`;
        back.innerHTML = `<div class="lists-in ask-in"><div class="lists-head"><b>Ask an AI</b><span class="grow"></span><span class="hint">${count} picture${count === 1 ? '' : 's'}</span></div>
          <p class="hint">Who looks at ${count === 1 ? 'it' : 'them'} and gives the name, category, style, form, tags and a description. Only AIs that can see pictures are listed.</p>
          ${group('In this browser', 'nothing sent anywhere', browser, false, '')}
          ${group('This computer', 'LM Studio and Ollama: nothing leaves the computer', here, m === 'cloud', list ? 'No model that sees pictures is running here: in LM Studio get one such as Gemma 3, in Ollama gemma3 or qwen2.5vl (and have the app open).' : 'Asking LM Studio and Ollama…')}
          ${oc.length ? group('Ollama Cloud', 'runs on Ollama’s servers', oc, m === 'local', '') : ''}
          ${group('Cloud', 'sent to that company, with your own key', cloud, m === 'local', 'No cloud AI key yet (the key in the title bar: AI settings).')}
          ${m !== 'both' ? `<p class="hint">The title bar is set to ${m === 'local' ? 'this computer only' : 'cloud'}: ${m === 'local' ? 'the cloud ones are off' : 'the ones on this computer are off'}.</p>` : ''}
          <div class="btns"><span class="grow"></span><button class="btn outline" type="button" data-a="cancel">Cancel</button><button class="btn primary" type="button" data-a="go">Ask</button></div></div>`;
        if (!back.querySelector('input[name=ask-who]:checked')) { const f = back.querySelector('input[name=ask-who]:not(:disabled)'); if (f) f.checked = true; }
        back._all = [...browser, ...(list || []), ...cloud];
      };
      draw(); document.body.append(back); locals().then((l) => { const keepChoice = back.querySelector('input[name=ask-who]:checked'); if (keepChoice) last = keepChoice.value; list = l; draw(); });
      back.addEventListener('click', (e) => {
        if (e.target === back || e.target.closest('[data-a=cancel]')) { back.remove(); return done(null); }
        if (e.target.closest('[data-a=go]')) { const r = back.querySelector('input[name=ask-who]:checked'); if (!r) return; const o = back._all.find((x) => idOf(x) === r.value); last = r.value; try { localStorage.setItem(KEY, last); } catch (err) { /* blocked */ } back.remove(); done({ ...o, label: o.kind === 'local' ? `${o.model} (${o.name})` : o.label }); }
      });
      back.addEventListener('keydown', (e) => { if (e.key === 'Escape') { back.remove(); done(null); } });
    });
  }
  window.ClipArtAsk = { choose, locals };
})();
