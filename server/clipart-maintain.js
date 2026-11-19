#!/usr/bin/env node
/* Craft clip-art server maintenance, from a command line (no browser needed):

     node clipart-maintain.js status            how many pictures, how many sorted by an AI, how many still to do
     node clipart-maintain.js sort              make sure every picture is sorted: each one not sorted yet is looked at
                                                by an AI on this computer and gets its category, style, form, tags and a
                                                description, and the mark "sorted" (which AI, when)

   Options:
     --server URL    the clip-art server (default http://localhost:3370, the one on this computer: no key needed there);
                     for the QNAP's: --server http://192.168.1.20/craft/clipartcraft/server/clipart-server.php --key …
     --key KEY       the server's key (or set CLIPART_KEY): needed for a server on another computer, to see the pictures
                     only for me and to save
     --ai URL        the AI program (default: every one that answers: Ollama :11434, LM Studio :1234, llama.cpp :9931 (the Llama App) or :8080)
     --model NAME    which of its models (default: one that can see pictures, a quick one first)
     --only N        stop after N pictures (to try it)
     --again         sort again the ones sorted already (their category is replaced too)
     --jobs N        how many pictures the AI looks at at once (default 2; Ollama decides how many it really runs together)

   It can be stopped any time (Ctrl+C) and run again: every picture is saved as soon as it is done, and the ones done
   are marked, so it carries on with the rest. A line per picture goes to maintain.log beside it. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

// ------------------------------------------------------------------ the command line
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : d; };
const task = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'status';
const SERVER = String(opt('server', 'http://localhost:3370')).replace(/\/+$/, ''), KEY = String(opt('key', process.env.CLIPART_KEY || '') || '');
const JOBS = Math.max(1, Math.min(8, +opt('jobs', 2) || 2)), ONLY = +opt('only', 0) || 0, AGAIN = !!opt('again', false), LOG = path.join(__dirname, 'maintain.log');
const say = (t) => process.stdout.write(t + '\n'), log = (t) => { try { fs.appendFileSync(LOG, `${new Date().toISOString()} ${t}\n`); } catch (e) { /* read-only folder */ } };

// the AI's lists (categories, styles, forms): the same ones ClipArtCraft starts with (its js/namer.js)
function lists() {
  const ctx = { localStorage: { getItem: () => null, setItem() {} }, document: { createElement: () => ({}) }, console };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'namer.js'), 'utf8'), ctx);
  const N = ctx.CraftNamer; return { categories: [...N.CATEGORIES], styles: [...N.STYLES], forms: [...N.FORMS] };
}

// ------------------------------------------------------------------ the server
async function api(p, o = {}) {
  const r = await fetch(SERVER + p, { ...o, headers: { ...(o.headers || {}), ...(KEY ? { 'x-craft-key': KEY } : {}), ...(o.body ? { 'content-type': 'application/json' } : {}) } });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { /* not JSON */ }
  if (!r.ok) throw new Error((j && j.error) || `the server said ${r.status}`); return j;
}
async function counts() { const all = await api('/api/items?limit=1'), left = await api('/api/items?limit=1&unsorted=1'); return { total: all.total, left: left.total, hidden: all.hidden || 0 }; }

// ------------------------------------------------------------------ the AI on this computer
async function answers(u, ms = 2500) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(u, { signal: c.signal }); return r.ok ? await r.json() : null; } catch (e) { return null; } finally { clearTimeout(t); } }
// every model on this computer that can see pictures, from each AI program that answers
async function visionModels() {
  const out = [], only = opt('ai', '');
  const tries = only ? [String(only).replace(/\/+$/, '').replace(/\/v1$/, '')] : ['http://localhost:11434', 'http://localhost:1234', 'http://127.0.0.1:9931', 'http://localhost:8080'];
  for (const base of tries) {
    const ol = await answers(base + '/api/tags');
    if (ol && ol.models) { for (const m of ol.models) { if (/:cloud$/.test(m.name)) continue; const s = await fetch(base + '/api/show', { method: 'POST', body: JSON.stringify({ model: m.name }) }).then((r) => r.json()).catch(() => null); if (s && (s.capabilities || []).includes('vision')) out.push({ kind: 'ollama', base, name: 'Ollama', model: m.name, size: m.size || 0, think: (s.capabilities || []).includes('thinking') }); } continue; }
    const lm = await answers(base + '/api/v0/models');
    if (lm && lm.data) { for (const m of lm.data) if (m.type === 'vlm') out.push({ kind: 'openai', base, name: 'LM Studio', model: m.id }); continue; }
    const oa = await answers(base + '/v1/models');
    if (oa && (oa.data || oa.models)) for (const m of oa.data || oa.models) out.push({ kind: 'openai', base, name: m.owned_by === 'llamacpp' || /8080|9931/.test(base) ? 'llama.cpp' : 'AI server', model: m.id || m.name }); // (llama.cpp: Hugging Face's Llama App on 9931, or llama-server on 8080; a model that sees pictures has its mmproj)
  }
  return out;
}
// the one to use: the model asked for, else a quick one that sees well (no long thinking first)
function choose(list) {
  const want = opt('model', ''); if (want) return list.find((m) => m.model === want) || list.find((m) => m.model.toLowerCase().includes(String(want).toLowerCase()));
  const rank = (m) => (/gemma3(?!.*27)|qwen2\.5-?vl|minicpm|llava|moondream|granite.*vision/i.test(m.model) ? 0 : m.think ? 3 : /27b|32b|70b/i.test(m.model) ? 2 : 1);
  return [...list].sort((a, b) => rank(a) - rank(b) || (a.size || 0) - (b.size || 0))[0];
}
const promptFor = (L, name, tags) => `This is one piece of clip art from a clip-art library${name ? `, called “${name}”` : ''}${tags && tags.length ? ` (its keywords: ${tags.slice(0, 12).join(', ')})` : ''}. Look at it closely and say what it shows.
Answer with JSON only, in this form: {"name": "...", "category": "...", "style": "...", "form": "...", "tags": ["..."], "description": "..."}
- name: what it is, in 1 to 3 plain words, as specific as you can tell. Capitalise the first word only.
- category: exactly one of: ${L.categories.join(' | ')}
- style: exactly one of: ${L.styles.join(' | ')}
- form: exactly one of: ${L.forms.join(' | ')}
- tags: 3 to 8 short search words (things in it, colours, era, use)
- description: one plain sentence describing the picture`;
async function ask(M, L, img, it) {
  const b64 = Buffer.from(img).toString('base64'), prompt = promptFor(L, it.name, it.tags);
  let text = '';
  if (M.kind === 'ollama') { // (its own way: thinking turned off, so an answer comes at once)
    const r = await fetch(M.base + '/api/chat', { method: 'POST', body: JSON.stringify({ model: M.model, stream: false, think: M.think ? false : undefined, format: 'json', options: { temperature: 0.2 }, messages: [{ role: 'user', content: prompt, images: [b64] }] }) });
    if (!r.ok) throw new Error(`${M.name} said ${r.status}: ${(await r.text()).slice(0, 150)}`); text = (await r.json()).message?.content || '';
  } else {
    const r = await fetch(M.base + '/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: M.model, temperature: 0.2, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } }, { type: 'text', text: prompt }] }] }) });
    if (!r.ok) throw new Error(`${M.name} said ${r.status}: ${(await r.text()).slice(0, 150)}`); text = (await r.json()).choices?.[0]?.message?.content || '';
  }
  const js = String(text).replace(/<think>[\s\S]*?<\/think>/gi, '').match(/\{[\s\S]*\}/); if (!js) throw new Error('the answer was not in the expected form');
  const a = JSON.parse(js[0]), fit = (v, l) => l.find((x) => x.toLowerCase() === String(v || '').trim().toLowerCase()) || '';
  return { name: String(a.name || '').trim().slice(0, 60), category: fit(a.category, L.categories), style: fit(a.style, L.styles), form: fit(a.form, L.forms), tags: (Array.isArray(a.tags) ? a.tags : []).map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10), description: String(a.description || '').trim() };
}

// ------------------------------------------------------------------ the tasks
const fmt = (s) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : s >= 90 ? `${Math.round(s / 60)} min` : `${Math.round(s)} s`);
async function status() {
  const c = await counts(), done = c.total - c.left;
  say(`Server ${SERVER}`); say(`  ${c.total.toLocaleString()} pictures · ${done.toLocaleString()} sorted by an AI (${c.total ? Math.round((100 * done) / c.total) : 0}%) · ${c.left.toLocaleString()} still to sort`);
  if (c.hidden) say(`  ${c.hidden.toLocaleString()} more are Only me and hidden: give the key (--key, or CLIPART_KEY) to see them`);
  const ms = await visionModels(); say(ms.length ? `  AI on this computer that can see pictures: ${ms.map((m) => `${m.model} (${m.name})`).join(', ')}` : '  No AI on this computer that can see pictures answers (start Ollama, LM Studio or llama-server).');
  if (ms.length) say(`  sort would use: ${choose(ms).model} (${choose(ms).name})`);
}
async function sort() {
  const L = lists(), ms = await visionModels(), M = choose(ms);
  if (!M) { say('No AI on this computer that can see pictures answers. Start Ollama (with a model such as gemma3), LM Studio (a vision model such as Gemma 3) or llama-server (with --mmproj), then run this again.'); process.exitCode = 1; return; }
  const c0 = await counts(); say(`Making sure every picture on ${SERVER} is sorted, with ${M.model} (${M.name}).`); say(`  ${c0.left.toLocaleString()} of ${c0.total.toLocaleString()} still to sort${AGAIN ? ' (and the sorted ones again)' : ''}. Ctrl+C stops it; run it again to carry on.\n`);
  const skip = new Set(); let n = 0, ok = 0, failed = 0; const t0 = Date.now(), goal = ONLY || (AGAIN ? c0.total : c0.left);
  for (let off = 0; ; ) {
    if (ONLY && n >= ONLY) break;
    // (the unsorted ones: those done drop out of the list, so the next page starts where the failed ones end)
    const page = AGAIN ? await api(`/api/items?limit=50&order=changed&offset=${off}`) : await api(`/api/items?limit=50&order=changed&unsorted=1&offset=${skip.size}`);
    const todo = page.items.filter((x) => !skip.has(x.id)); if (!todo.length) break; if (AGAIN) off += page.items.length;
    // (JOBS at a time: the AI program works on a few pictures at once on one card)
    let qi = 0; await Promise.all(Array.from({ length: JOBS }, async () => { while (qi < todo.length) { const it = todo[qi++];
      if (ONLY && n >= ONLY) break; n++;
      const link = (it.links || {}).thumb || (it.links || {}).png;
      try {
        if (!link) throw new Error('no picture to look at (an SVG only, without a thumbnail)');
        const r = await fetch(link, { headers: KEY ? { 'x-craft-key': KEY } : {} }); if (!r.ok) throw new Error(`its picture: ${r.status}`);
        const a = await ask(M, L, new Uint8Array(await r.arrayBuffer()), it);
        const upd = { sorted: `${M.model} · ${new Date().toISOString()}`, seen: a.name || it.seen || '', description: a.description || it.description || '', tags: [...new Set([...(it.tags || []), ...a.tags])] };
        if (a.category && (AGAIN || !it.category)) upd.category = a.category; if (a.style && (AGAIN || !it.style)) upd.style = a.style; if (a.form && (AGAIN || !it.form)) upd.form = a.form;
        await api('/api/items/' + encodeURIComponent(it.id), { method: 'PATCH', body: JSON.stringify(upd) }); ok++;
        log(`sorted ${it.id} “${it.name}” → ${upd.category || it.category || '-'} · ${upd.style || it.style || '-'} · ${a.name} (${M.model})`);
        const secs = (Date.now() - t0) / 1000, rate = ok / secs;
        process.stdout.write(`\r  ${ok.toLocaleString()} sorted${failed ? `, ${failed} failed` : ''} of ${goal.toLocaleString()} · ${(rate * 60).toFixed(1)} a minute · ${rate ? `about ${fmt((goal - n) / rate)} left` : ''} · last: ${it.name.slice(0, 28)} → ${upd.category || it.category || '?'}          `);
      } catch (e) { failed++; skip.add(it.id); log(`failed ${it.id} “${it.name}”: ${e.message}`); process.stdout.write(`\n  “${it.name}”: ${e.message}\n`); }
    } }));
  }
  const c1 = await counts(); say(`\n\nDone: ${ok.toLocaleString()} sorted${failed ? `, ${failed} could not be (see maintain.log; they stay to do)` : ''} in ${fmt((Date.now() - t0) / 1000)}. ${c1.left.toLocaleString()} of ${c1.total.toLocaleString()} still to sort.`);
}

(async () => {
  try { if (task === 'sort') await sort(); else if (task === 'status') await status(); else say('Tasks: status, sort (see the top of clipart-maintain.js)'); }
  catch (e) { say(`\nStopped: ${e.message}${/fetch failed|ECONNREFUSED/.test(String(e.message + (e.cause || ''))) ? ` (is the server at ${SERVER} running?)` : ''}`); process.exitCode = 1; }
})();
