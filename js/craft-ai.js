/* ClipArtCraft AI helpers (window.CRAFTAI; ClipArtCraft's own copy of the Craft AI helpers, from ImageCraft's): small AI models that run
   inside the browser, on the graphics card when there is one (WebGPU) or on the processor (WebAssembly) when not. No
   server, no account, no key: each model downloads once (when first used, or with "Download now"), is kept by the
   browser and works offline after that.
     cutout(src)            → { W, H, a: Uint8Array 0–255 (255 = keep) }  U²-Net (Apache-2.0; U²-Netp on a basic computer),
                                                                           or BEN2 (MIT) for the best quality (slower)
     pick(src, pts)         → { W, H, a }  pts = [[u, v, 1 keep | 0 not]]  SlimSAM (Apache-2.0)
     find(src, words)       → { w, h, maps: [Float32Array 0–1] } one map per word or phrase   CLIPSeg (Apache-2.0)
     inpaint(img, hole)     → ImageData with the hole (Float32Array, 1 = fill) drawn in      MI-GAN (MIT)
     upscale(src, kind)     → canvas, 2× or 4× bigger                       Swin2SR (Apache-2.0): 'sharp' 2×, 'photo' 4×
                                                                           (real-world photos: noise and blur), 'jpeg' 4×
   The models come from huggingface.co; the library (Transformers.js, Apache-2.0) is lib/craft-ai-libs.js. */
(function () {
  'use strict';
  const KEY = 'clipartcraft-ai';
  const MODELS = {
    cutout: { id: 'BritishWerewolf/U-2-Net', cpuId: 'BritishWerewolf/U-2-Netp', file: 'onnx/model.onnx', name: 'Background cut-out', what: 'Finds the main subject of a photo and takes the background away, even on busy backgrounds. (About 4 seconds a picture; on a basic computer a small, quicker version is used.)', mb: { gpu: 176, cpu: 176 }, licence: 'Apache-2.0' },
    best: { id: 'onnx-community/BEN2-ONNX', name: 'Best-quality cut-out', what: 'Finer edges (hair, fur) for the background cut-out, but slow: about 20 seconds a picture, and only with a graphics card.', mb: { gpu: 219, cpu: 219 }, licence: 'MIT', gpuOnly: true },
    sharp: { gpuDtype: 'fp32', id: 'Xenova/swin2SR-classical-sr-x2-64', name: 'Upscale 2× (clean pictures)', what: 'Doubles the size of a clean picture and keeps edges sharp instead of blurring them.', mb: { gpu: 48, cpu: 15 }, licence: 'Apache-2.0', scale: 2 },
    photo: { gpuDtype: 'fp32', id: 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr', name: 'Upscale 4× (old photos)', what: 'Makes an old, small or noisy photo four times bigger and cleans the noise and blur as it goes.', mb: { gpu: 50, cpu: 15 }, licence: 'Apache-2.0', scale: 4 },
    jpeg: { gpuDtype: 'fp32', id: 'Xenova/swin2SR-compressed-sr-x4-48', name: 'Upscale 4× (JPEG clean-up)', what: 'For pictures spoilt by JPEG blocks and smudges: four times bigger with the blocks taken out.', mb: { gpu: 30, cpu: 10 }, licence: 'Apache-2.0', scale: 4 },
    esrgan: { raw: 'https://huggingface.co/SceneWorks/real-esrgan-onnx/resolve/main/real_esrgan_x4.onnx', name: 'Upscale 4× (Real-ESRGAN, real photos)', what: 'The standard for real-world photos: four times bigger, with crisp edges and natural texture in grass, gravel, fabric and leaves; also cleans JPEG blocks and noise.', mb: { gpu: 67, cpu: 67 }, licence: 'BSD-3-Clause', scale: 4 },
    esrgan3: { embedded: 'lib/craft-esrgan-v3.js', global: 'CRAFT_ESRGAN_V3', name: 'Upscale 4× (Real-ESRGAN compact, noise control)', what: 'A small, fast Real-ESRGAN for real photos, four times bigger, with a noise-removal slider (its two versions blended). It comes with ImageCraft: nothing to download.', mb: { gpu: 0, cpu: 0 }, licence: 'BSD-3-Clause', scale: 4 },
    esrgan2: { raw: 'https://huggingface.co/SceneWorks/real-esrgan-onnx/resolve/main/real_esrgan_x2.onnx', name: 'Upscale 2× (Real-ESRGAN)', what: 'Real-ESRGAN at twice the size, for photos that only need a little more.', mb: { gpu: 67, cpu: 67 }, licence: 'BSD-3-Clause', scale: 2 },
    find: { id: 'Xenova/clipseg-rd64-refined', name: 'Find things by name', what: 'Finds sky, grass, trees, people, clothes, buildings and anything you name in a picture, by what they are rather than by their colour, so it works on sepia and faded prints too. (About 15 seconds a picture on the processor.)', mb: { gpu: 139, cpu: 139 }, licence: 'Apache-2.0' },
    inpaint: { raw: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx', name: 'Repair (fill in damage)', what: 'Fills tears, scratches, holes and stamps from what is around them (MI-GAN, Picsart). It invents what is missing, so use it where the original is lost.', mb: { gpu: 28, cpu: 28 }, licence: 'MIT', cpuOnly: true }, // on the graphics-card runtime a run could hang; the processor takes 2 s
    codeformer: { raw: 'https://huggingface.co/bluefoxcreation/Codeformer-ONNX/resolve/main/codeformer.onnx', name: 'Restore faces (CodeFormer)', what: 'Redraws small, blurred or damaged faces from a model of faces, with a slider for how closely it keeps to the original. Large: about 377 MB the first time. Non-commercial use only (S-Lab License 1.0).', mb: { gpu: 377, cpu: 377 }, licence: 'S-Lab 1.0 (non-commercial)' },
    colourise: { raw: 'https://huggingface.co/edgetools/ddcolor/resolve/main/ddcolor-tiny-fp16.onnx', name: 'Colourise (DDColor)', what: 'Gives a black-and-white or faded photo likely colours (DDColor-tiny, Apache-2.0). Only the colour is guessed; the brightness and every detail stay the photo’s own. About 135 MB the first time.', mb: { gpu: 135, cpu: 135 }, licence: 'Apache-2.0', cpuOnly: true }, // one of its MatMul steps fails on the graphics-card runtime: the processor (about 10 s)
    gfpgan: { raw: 'https://huggingface.co/neurobytemind/GFPGANv1.4.onnx/resolve/main/GFPGANv1.4.onnx', name: 'Restore faces (GFPGAN 1.4)', what: 'Redraws small, blurred or damaged faces (Tencent ARC). Natural skin and colour; no closeness slider. Large: about 340 MB the first time. Trained on FFHQ faces: non-commercial use.', mb: { gpu: 340, cpu: 340 }, licence: 'Apache-2.0 (code); FFHQ-trained weights, non-commercial' },
    scratches: { raw: 'https://huggingface.co/Saimon8420/old-photo-scratch-detection-web/resolve/main/scratch_detection_fp16w.onnx', name: 'Find scratches (old photos)', what: 'Finds scratches, cracks and dust on old photos so Repair can fill them (Microsoft’s Bringing Old Photos Back to Life, MIT). About 75 MB the first time.', mb: { gpu: 75, cpu: 75 }, licence: 'MIT' },
    depth: { id: 'onnx-community/depth-anything-v2-small', name: 'Depth (near to far)', what: 'Works out how near each part of a photo is: the Depth, Near, Middle and Far maps.', mb: { gpu: 50, cpu: 27 }, licence: 'Apache-2.0' },
    pick: { id: 'Xenova/slimsam-77-uniform', name: 'Pick an object', what: 'Click an object in a picture and it is outlined for you, to keep or take out.', mb: { gpu: 21, cpu: 14 }, licence: 'Apache-2.0' },
  };
  const DEFAULTS = { on: true, gpu: null, use: { depth: true, cutout: true, best: false, sharp: true, photo: true, jpeg: true, esrgan: true, esrgan2: true, esrgan3: true, find: true, inpaint: true, codeformer: true, gfpgan: true, scratches: true, colourise: true, pick: true } };
  let settings = DEFAULTS;
  try { settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; settings.use = { ...DEFAULTS.use, ...(settings.use || {}) }; } catch (e) { /* ignore */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } };

  // ------------------------------------------------------------------ what this computer can do
  let found = null;
  async function probe() {
    const r = { webgpu: false, gpu: '', f16: false, bigBuffers: false, cores: navigator.hardwareConcurrency || 2, memory: navigator.deviceMemory || 0, cache: false };
    try {
      if (navigator.gpu) {
        const a = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (a && !a.isFallbackAdapter) {
          const i = a.info || {};
          r.webgpu = true; r.gpu = [i.vendor, i.architecture, i.description].filter(Boolean).join(' ') || 'a graphics card';
          r.f16 = a.features.has('shader-f16'); r.bigBuffers = (a.limits.maxBufferSize || 0) >= 1024 ** 3; r.maxStorage = a.limits.maxStorageBufferBindingSize || 0; r.maxBuffer = a.limits.maxBufferSize || 0;
        }
      }
    } catch (e) { /* no WebGPU */ }
    try { await caches.open('craft-ai-test'); await caches.delete('craft-ai-test'); r.cache = true; } catch (e) { /* no cache */ }
    // a level: high (a strong graphics card), medium (any graphics card), basic (the processor only)
    r.level = r.webgpu && r.f16 && r.bigBuffers ? 'high' : r.webgpu ? 'medium' : 'basic';
    found = r;
    if (settings.gpu == null) settings.gpu = r.webgpu;
    return r;
  }
  const probed = probe();
  // ------------------------------------------------------------------ local quality: how much computing each AI step spends
  // The same models at every level; higher levels run more passes (the picture flipped, then averaged back: steadier
  // detail), bigger tiles with more overlap, and look at scratches at a larger size. Auto picks the highest level that
  // keeps an AI step on this picture within the time budget, from the measured speed of this computer.
  const LEVELS = {
    fast: { name: 'Fast', tile: 128, ov: 16, tta: 1, faceTta: 1, fillTta: 1, scr: 768, what: 'one pass, small tiles: quickest' },
    balanced: { name: 'Balanced', tile: 160, ov: 24, tta: 1, faceTta: 1, fillTta: 1, scr: 1024, what: 'one pass (as before)' },
    best: { name: 'Best', tile: 256, ov: 32, tta: 2, faceTta: 2, fillTta: 2, scr: 1536, what: 'two passes averaged, bigger tiles, scratches looked at larger' },
    max: { name: 'Max', tile: 320, ov: 48, tta: 4, faceTta: 2, fillTta: 2, scr: 2048, what: 'four passes for upscaling and scratches, two for faces and repair, the biggest tiles' },
  };
  const FLIPS = [[0, 0], [1, 0], [0, 1], [1, 1]];
  // relative cost of each upscaler to the built-in compact one (rough; refined by what this computer has measured)
  const COST = { esrgan3: 1, esrgan: 9, esrgan2: 9, sharp: 12, photo: 12, jpeg: 10 };
  if (!settings.quality) settings.quality = 'auto'; if (!settings.budget) settings.budget = 120;
  let lastLevel = 'balanced'; const noteLevel = (L) => { lastLevel = L.key; };
  const tileCap = () => (found && found.maxStorage ? Math.max(128, Math.floor(Math.sqrt(found.maxStorage / (64 * 4 * 3)) / 32) * 32) : 320);
  const devNow = () => (device() === 'webgpu' ? 'gpu' : 'cpu');
  // seconds for an upscaler on P input pixels at a level, on this computer (null if not measured yet)
  function estimate(kind, P, key, dev = devNow()) {
    const b = settings.bench && settings.bench[dev]; if (!b) return null; const L = LEVELS[key];
    return (b * (COST[kind] || 1) * (P / 1e6) * L.tta * ((L.tile + 2 * L.ov) / L.tile) ** 2) / 1000;
  }
  function autoKey(P) {
    if (!settings.bench || !settings.bench[devNow()]) return 'balanced';
    for (const k of ['max', 'best', 'balanced']) { const t = estimate('esrgan3', P || 1e6, k); if (t != null && t <= settings.budget) return k; }
    return 'fast';
  }
  const levelKey = (P) => (settings.quality === 'auto' ? autoKey(P) : LEVELS[settings.quality] ? settings.quality : 'balanced');
  const levelFor = (P) => { const k = levelKey(P); return { key: k, ...LEVELS[k] }; };
  // the measurement: the built-in compact upscaler (no download) on a 96 × 96 square, on the graphics card and on the processor
  let forceDev = null;
  async function bench(say) {
    const f = await probed, c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d');
    for (let i = 0; i < 400; i++) { x.fillStyle = `hsl(${(i * 37) % 360},${30 + (i % 50)}%,${20 + (i % 60)}%)`; x.fillRect((i * 13) % 96, (i * 29) % 96, 3 + (i % 9), 3 + (i % 7)); }
    const out = { at: Date.now(), cores: f.cores, memory: f.memory, gpuName: f.gpu, threaded: !!self.crossOriginIsolated };
    const keep = settings.quality; settings.quality = 'balanced';
    try {
      for (const dev of f.webgpu ? ['gpu', 'cpu'] : ['cpu']) {
        forceDev = dev === 'gpu' ? 'webgpu' : 'wasm'; say && say(`Measuring the ${dev === 'gpu' ? 'graphics card' : 'processor'}…`);
        await upscale(c, 'esrgan3'); const t0 = performance.now(); await upscale(c, 'esrgan3'); await upscale(c, 'esrgan3'); const ms = (performance.now() - t0) / 2;
        out[dev] = Math.round((ms / (96 * 96)) * 1e6); // milliseconds per megapixel of input
      }
    } finally { forceDev = null; settings.quality = keep; }
    settings.bench = out; save(); return out;
  }
  const quality = () => ({ setting: settings.quality, budget: settings.budget, bench: settings.bench || null, levels: LEVELS, last: lastLevel, levelKey });
  const setQuality = (q, budget) => { if (q) settings.quality = q; if (budget) settings.budget = budget; save(); };
  const device = () => (forceDev || (settings.gpu && found && found.webgpu ? 'webgpu' : 'wasm'));
  // about how many MB a helper downloads on this computer
  const sizeOf = (k) => (k === 'cutout' && cutoutId() === MODELS.cutout.cpuId ? 5 : MODELS[k].mb[device() === 'webgpu' ? 'gpu' : 'cpu']);
  const cutoutId = () => (found && found.level !== 'basic' ? MODELS.cutout.id : MODELS.cutout.cpuId);

  // ------------------------------------------------------------------ the library, loaded the first time it is needed
  let libP = null;
  function lib() {
    if (window.CraftTF) return Promise.resolve(window.CraftTF);
    if (!libP) libP = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'lib/craft-ai-libs.js';
      s.onload = async () => {
        const T = window.CraftTF; T.env.allowLocalModels = false; T.env.useBrowserCache = true;
        // the runtime itself (a 20 MB file) is kept too, so it is not fetched again; its small loader stays in the browser's own cache
        try {
          const W = T.ort.env.wasm, base = typeof W.wasmPaths === 'string' ? W.wasmPaths : 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/';
          W.wasmBinary = await fetchCached(base + 'ort-wasm-simd-threaded.jsep.wasm');
        } catch (e) { /* the runtime fetches them itself */ }
        res(T);
      };
      s.onerror = () => { libP = null; rej(new Error('The AI library (lib/craft-ai-libs.js) is missing from the ClipArtCraft folder.')); };
      document.head.append(s);
    });
    return libP;
  }

  // a file kept in the browser's cache (the same one Transformers.js uses), fetched the first time with progress
  async function fetchCached(url, onProg) {
    let c = null; try { c = await caches.open('transformers-cache'); const hit = await c.match(url); if (hit) return hit.arrayBuffer(); } catch (e) { /* no cache */ }
    const r = await fetch(url); if (!r.ok) throw new Error(`could not download ${url.split('/').pop()} (${r.status})`);
    const total = +r.headers.get('content-length') || 0, rd = r.body.getReader(), parts = []; let got = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; if (onProg && total) onProg(got, total); }
    const buf = await new Blob(parts).arrayBuffer();
    if (c) try { await c.put(url, new Response(buf, { headers: { 'content-type': 'application/octet-stream', 'content-length': String(buf.byteLength) } })); } catch (e) { /* full */ }
    return buf;
  }

  // ------------------------------------------------------------------ models: loaded once, with progress
  const loaded = {}, listeners = new Set();
  const progress = (k, p) => listeners.forEach((f) => f(k, p));
  function onProgress(f) { listeners.add(f); return () => listeners.delete(f); }
  const cpuOnly = new Set();   // models that failed on the graphics card: they use the processor from then on
  const deviceFor = (k) => (cpuOnly.has(k) || MODELS[k].cpuOnly ? 'wasm' : device());
  // one model at a time: they share one runtime, which must not be entered twice
  let queue = Promise.resolve();
  const inTurn = (fn) => { const p = queue.then(fn, fn); queue = p.catch(() => {}); return p; };
  function run(k, fn) { return inTurn(() => run1(k, fn)); }
  // every run is reported (onActivity): which model, on what, how long, whether it downloaded first
  let actHook = null; const onActivity = (fn) => { actHook = fn; };
  async function run1(k, fn) {
    const key = k + ':' + (k === 'cutout' ? cutoutId() : deviceFor(k)), e = { kind: 'ai', at: Date.now(), level: LEVELS[lastLevel] ? LEVELS[lastLevel].name : '', model: MODELS[k].name, device: deviceFor(k) === 'webgpu' ? 'graphics card' : 'processor', first: !loaded[key], state: 'running' }; if (actHook) actHook(e);
    const end = (state, err) => { e.state = state; e.secs = (Date.now() - e.at) / 1000; if (err) e.error = String(err.message || err); if (actHook) actHook(e); };
    try { const r = await fn(await ready(k)); end('done'); return r; }
    catch (err) {
      if (deviceFor(k) !== 'webgpu' || !/OrtRun|webgpu|shader|GPU/i.test(err.message)) { end('failed', err); throw err; }
      if (window.ICLOG) ICLOG.warn(`AI model “${MODELS[k].name}” failed on the graphics card; using the processor`, err);
      cpuOnly.add(k); progress(k, { status: 'cpu' }); e.device = 'processor (the graphics card failed)';
      try { const r = await fn(await ready(k)); end('done'); return r; } catch (err2) { end('failed', err2); throw err2; }
    }
  }
  function ready(k) {
    if (!settings.on) return Promise.reject(new Error('AI helpers are switched off (AI helpers… to switch them on).'));
    if (!settings.use[k] && k !== 'best') return Promise.reject(new Error(`“${MODELS[k].name}” is switched off in AI helpers.`));
    const key = k + ':' + (k === 'cutout' ? cutoutId() : deviceFor(k));
    if (!loaded[key]) loaded[key] = (async () => {
      await probed; const T = await lib(), m = MODELS[k], files = {};
      // the upscalers (Swin2SR) only run on the graphics card in full precision: their half-precision files fail there
      const dv = deviceFor(k), opts = { device: dv, dtype: dv === 'webgpu' ? (m.gpuDtype || (found.f16 || k === 'cutout' ? 'fp16' : 'fp32')) : 'q8', progress_callback: (e) => {
        if (e.status === 'progress' && e.total) { files[e.file] = [e.loaded, e.total]; const v = Object.values(files); progress(k, { loaded: v.reduce((s, x) => s + x[0], 0), total: v.reduce((s, x) => s + x[1], 0) }); }
      } };
      progress(k, { status: 'starting' });
      try {
        let r;
        if (m.embedded) { // a model that comes with ImageCraft, wrapped as a script (a page opened from a file cannot fetch files)
          if (!window[m.global]) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = m.embedded; sc.onload = res; sc.onerror = () => rej(new Error(`${m.embedded} is missing from the ClipArtCraft folder.`)); document.head.append(sc); });
          const bytes = Uint8Array.from(atob(window[m.global]), (ch) => ch.charCodeAt(0));
          r = await T.ort.InferenceSession.create(bytes, { executionProviders: dv === 'webgpu' ? ['webgpu'] : ['wasm'], graphOptimizationLevel: 'all' }); r.isRaw = true;
        }
        else if (m.raw) { // a plain ONNX file (Real-ESRGAN): ONNX Runtime directly, graphics card first
          const buf = await fetchCached(m.raw, (l, t) => progress(k, { loaded: l, total: t }));
          r = await T.ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: dv === 'webgpu' ? ['webgpu'] : ['wasm'], graphOptimizationLevel: 'all' });
          r.isRaw = true;
        }
        else if (k === 'depth') r = await T.pipeline('depth-estimation', m.id, opts);
        else if (m.scale) r = await T.pipeline('image-to-image', m.id, opts);
        else if (k === 'best') r = await T.pipeline('background-removal', m.id, { ...opts, dtype: 'fp16' });
        else if (k === 'cutout') {
          // U²-Net runs on the processor (the graphics-card runtime cannot run one of its steps yet): the full model on a
          // capable computer (about 4 seconds a picture), the small one on a basic computer
          const url = `https://huggingface.co/${cutoutId()}/resolve/main/${m.file}`;
          const buf = await fetchCached(url, (l, t) => progress(k, { loaded: l, total: t }));
          r = await T.ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: ['wasm'] });
        }
        // CLIPSeg runs on the processor in 8-bit (dependable everywhere; the full-precision file is 545 MB)
        else if (k === 'find') r = { tok: await T.AutoTokenizer.from_pretrained(m.id), processor: await T.AutoProcessor.from_pretrained(m.id), model: await T.AutoModel.from_pretrained(m.id, { ...opts, device: 'wasm', dtype: 'q8' }) };
        else r = { model: await T.SamModel.from_pretrained(m.id, opts), processor: await T.AutoProcessor.from_pretrained(m.id, { progress_callback: opts.progress_callback }) };
        progress(k, { status: 'ready' }); return r;
      } catch (e) {
        delete loaded[key];
        // a model the graphics card cannot run: the processor runs it instead (slower, but it works)
        if (window.ICLOG) ICLOG.warn(`AI model “${m.name}” did not load on ${dv === 'webgpu' ? 'the graphics card' : 'the processor'} (${opts.dtype})`, e);
        if (dv === 'webgpu' && !m.gpuOnly) { cpuOnly.add(k); progress(k, { status: 'cpu' }); return ready(k); }
        const msg = (e && (e.message || String(e))) || 'unknown error'; if (window.ICLOG) ICLOG.error(`AI model “${m.name}” could not be loaded`, e); progress(k, { status: 'error', message: msg }); throw new Error(`${m.name} could not be loaded: ${msg}`);
      }
    })();
    return loaded[key];
  }

  // pictures: a data URL, an <img> or a <canvas>, read as a canvas (at most max pixels across) and a RawImage
  const imgOf = (src) => new Promise((res, rej) => { if (src instanceof HTMLCanvasElement || src instanceof HTMLImageElement) return res(src); const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That picture could not be read.')); i.src = src; });
  async function canvasOf(src, max) {
    const im = await imgOf(src), iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.min(1, max / Math.max(iw, ih));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(iw * k)); c.height = Math.max(1, Math.round(ih * k));
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); return c;
  }
  const rawOf = async (T, c) => T.RawImage.fromCanvas ? T.RawImage.fromCanvas(c) : T.RawImage.fromURL(c.toDataURL('image/png'));
  // a few answers are kept, so moving a slider does not run a model again
  const memo = new Map();
  const remember = (key, p) => { memo.set(key, p); if (memo.size > 12) memo.delete(memo.keys().next().value); p.catch(() => memo.delete(key)); return p; };
  const keyOf = (src) => (typeof src === 'string' ? src.length + ':' + src.slice(-64) : src);

  // a float grid from a tensor [.., h, w], resampled to W × H
  function resample(data, w, h, W, H) {
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const fx = ((x + 0.5) * w) / W - 0.5, fy = ((y + 0.5) * h) / H - 0.5, x0 = Math.max(0, Math.min(w - 1, Math.floor(fx))), y0 = Math.max(0, Math.min(h - 1, Math.floor(fy))), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), tx = Math.max(0, Math.min(1, fx - x0)), ty = Math.max(0, Math.min(1, fy - y0));
      out[y * W + x] = (data[y0 * w + x0] * (1 - tx) + data[y0 * w + x1] * tx) * (1 - ty) + (data[y1 * w + x0] * (1 - tx) + data[y1 * w + x1] * tx) * ty;
    }
    return out;
  }

  // ------------------------------------------------------------------ the helpers
  function cutout(src) {
    return remember('cutout:' + (settings.use.best ? 'best:' : '') + keyOf(src), (async () => {
      const T = await lib(), c = await canvasOf(src, 1024);
      if (!(settings.use.best && device() === 'webgpu')) {
        // U²-Net: the picture at 320 × 320 in ImageNet colours; out comes how likely each point is the subject
        const N = 320, s2 = document.createElement('canvas'); s2.width = s2.height = N; s2.getContext('2d').drawImage(c, 0, 0, N, N);
        const D = s2.getContext('2d').getImageData(0, 0, N, N).data, x = new Float32Array(3 * N * N), mean = [0.485, 0.456, 0.406], sd = [0.229, 0.224, 0.225];
        let mx = 1; for (let i = 0; i < N * N; i++) mx = Math.max(mx, D[i * 4], D[i * 4 + 1], D[i * 4 + 2]);
        for (let i = 0; i < N * N; i++) for (let q = 0; q < 3; q++) x[q * N * N + i] = (D[i * 4 + q] / mx - mean[q]) / sd[q];
        const out = await run('cutout', (ses) => ses.run({ [ses.inputNames[0]]: new T.ort.Tensor('float32', x, [1, 3, N, N]) }).then((o) => o[ses.outputNames[0]]));
        const d = out.data; let lo = Infinity, hi = -Infinity; for (let i = 0; i < d.length; i++) { if (d[i] < lo) lo = d[i]; if (d[i] > hi) hi = d[i]; }
        const f = resample(d, N, N, c.width, c.height), k = 255 / Math.max(1e-6, hi - lo), a = new Uint8Array(f.length);
        for (let i = 0; i < f.length; i++) a[i] = Math.max(0, Math.min(255, (f[i] - lo) * k));
        return { W: c.width, H: c.height, a };
      }
      const raw0 = await rawOf(T, c), out = await run('best', (pipe) => pipe(raw0)), im = Array.isArray(out) ? out[0] : out;
      const ch = im.channels || 4, a = new Uint8Array(im.width * im.height); for (let i = 0; i < a.length; i++) a[i] = im.data[i * ch + ch - 1];
      if (im.width === c.width && im.height === c.height) return { W: c.width, H: c.height, a };
      const f = resample(Float32Array.from(a), im.width, im.height, c.width, c.height); return { W: c.width, H: c.height, a: Uint8Array.from(f) };
    })());
  }
  // Upscale in tiles (so a big picture fits in memory and progress can be shown); the tiles overlap and only their
  // middles are kept, so no seams show. See-through parts keep their see-through, scaled up smoothly.
  async function upscale(src, kind = 'sharp', onTile, opts = {}) {
    const T = await lib(), m = MODELS[kind], S = m.scale, im = await imgOf(src), W = im.naturalWidth || im.width, H = im.naturalHeight || im.height;
    const out = document.createElement('canvas'); out.width = W * S; out.height = H * S; const ox = out.getContext('2d');
    // Tiles overlap by OV pixels and are faded into each other (weights ramp down over the overlap), so no seam shows.
    // The model pads each tile to a multiple of its window, so its output can be a little bigger than the tile: only
    // the tile's own part (exactly S times its size, from the top left) is used.
    const L = levelFor(W * H), TILE = Math.min(L.tile, tileCap()), OV = L.ov, tiles = []; noteLevel(L);
    const runTile = async (c, cx) => {
      if (m.raw || m.embedded) {
        // Real-ESRGAN: [1, 3, h, w] RGB 0–1 in, [1, 3, S·h, S·w] out
        const cw = c.width, chh = c.height, px = cx.getImageData(0, 0, cw, chh).data, inp = new Float32Array(3 * cw * chh);
        for (let i = 0; i < cw * chh; i++) { inp[i] = px[i * 4] / 255; inp[cw * chh + i] = px[i * 4 + 1] / 255; inp[2 * cw * chh + i] = px[i * 4 + 2] / 255; }
        const o = await run(kind, (ses) => ses.run({ [ses.inputNames[0]]: new T.ort.Tensor('float32', inp, [1, 3, chh, cw]), ...(ses.inputNames.includes('strength') ? { strength: new T.ort.Tensor('float32', new Float32Array([opts.strength ?? 0.5]), [1]) } : {}) }).then((x) => x[ses.outputNames[0]]));
        const ow = o.dims[3], oh = o.dims[2], od = o.data, hwc = new Uint8ClampedArray(ow * oh * 3), plane = ow * oh;
        for (let i = 0; i < plane; i++) { hwc[i * 3] = od[i] * 255; hwc[i * 3 + 1] = od[plane + i] * 255; hwc[i * 3 + 2] = od[2 * plane + i] * 255; }
        return { data: hwc, width: ow, height: oh, channels: 3 };
      } else { const raw = await rawOf(T, c), r = await run(kind, (pipe) => pipe(raw)); return Array.isArray(r) ? r[0] : r; }
    };
    for (let y = 0; y < H; y += TILE) for (let x = 0; x < W; x += TILE) tiles.push([x, y]);
    const OW = W * S, OH = H * S, acc = new Float32Array(OW * OH * 3), wsum = new Float32Array(OW * OH);
    let n = 0;
    for (const [x, y] of tiles) {
      const x0 = Math.max(0, x - OV), y0 = Math.max(0, y - OV), x1 = Math.min(W, x + TILE + OV), y1 = Math.min(H, y + TILE + OV);
      const c = document.createElement('canvas'); c.width = x1 - x0; c.height = y1 - y0; const cx = c.getContext('2d');
      cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(im, -x0, -y0);
      const tw0 = (x1 - x0) * S, th0 = (y1 - y0) * S;
      let res = await runTile(c, cx);
      if (L.tta > 1) { // the same tile flipped, run again, flipped back and averaged: steadier detail, fewer made-up textures
        const n0 = Math.min(tw0, res.width), m0 = Math.min(th0, res.height), ch0 = res.channels, sum = new Float32Array(n0 * m0 * ch0);
        for (let v = 0; v < m0; v++) for (let u = 0; u < n0; u++) for (let q = 0; q < ch0; q++) sum[(v * n0 + u) * ch0 + q] = res.data[(v * res.width + u) * ch0 + q];
        for (const [fh, fv] of FLIPS.slice(1, L.tta)) {
          const c2 = document.createElement('canvas'); c2.width = c.width; c2.height = c.height; const x2 = c2.getContext('2d'); x2.setTransform(fh ? -1 : 1, 0, 0, fv ? -1 : 1, fh ? c.width : 0, fv ? c.height : 0); x2.drawImage(c, 0, 0); x2.setTransform(1, 0, 0, 1, 0, 0);
          const r2 = await runTile(c2, x2);
          for (let v = 0; v < m0; v++) for (let u = 0; u < n0; u++) { const su = fh ? n0 - 1 - u : u, sv = fv ? m0 - 1 - v : v; for (let q = 0; q < ch0; q++) sum[(v * n0 + u) * ch0 + q] += r2.data[(sv * r2.width + su) * r2.channels + q]; }
        }
        const avg = new Uint8ClampedArray(n0 * m0 * ch0); for (let k2 = 0; k2 < avg.length; k2++) avg[k2] = sum[k2] / L.tta; res = { data: avg, width: n0, height: m0, channels: ch0 };
      }
      const ch = res.channels, rw = res.width;
      const tw = Math.min((x1 - x0) * S, res.width), th = Math.min((y1 - y0) * S, res.height);
      // how much each output pixel of this tile counts: full in the middle, fading to the tile's edges inside the
      // picture (not at the picture's own edges)
      const ramp = (pos, lo, hi, atLo, atHi) => { const a = atLo ? 1 : Math.min(1, (pos - lo + 0.5) / (OV * S)), b = atHi ? 1 : Math.min(1, (hi - pos - 0.5) / (OV * S)); return Math.max(0.001, Math.min(a, b)); };
      for (let v = 0; v < th; v++) {
        const Y = y0 * S + v, wy = ramp(v, 0, th, y0 === 0, y1 === H);
        for (let u = 0; u < tw; u++) {
          const X = x0 * S + u, w = wy * ramp(u, 0, tw, x0 === 0, x1 === W), q = Y * OW + X, i = (v * rw + u) * ch;
          acc[q * 3] += res.data[i] * w; acc[q * 3 + 1] += res.data[i + 1] * w; acc[q * 3 + 2] += res.data[i + 2] * w; wsum[q] += w;
        }
      }
      n++; if (onTile) onTile(n, tiles.length);
      await new Promise((r2) => setTimeout(r2, 0)); // let the page breathe between tiles
    }
    const od = ox.createImageData(OW, OH);
    for (let q = 0; q < OW * OH; q++) { const w = wsum[q] || 1; od.data[q * 4] = acc[q * 3] / w; od.data[q * 4 + 1] = acc[q * 3 + 1] / w; od.data[q * 4 + 2] = acc[q * 3 + 2] / w; od.data[q * 4 + 3] = 255; }
    ox.putImageData(od, 0, 0);
    // see-through: the original's alpha, scaled smoothly
    const a = document.createElement('canvas'); a.width = out.width; a.height = out.height; const ax = a.getContext('2d'); ax.imageSmoothingQuality = 'high'; ax.drawImage(im, 0, 0, a.width, a.height);
    const ad = ax.getImageData(0, 0, a.width, a.height).data;
    let any = false; for (let i = 3; i < ad.length; i += 4) if (ad[i] < 255) { any = true; break; }
    if (any) { const od = ox.getImageData(0, 0, out.width, out.height); for (let i = 3; i < ad.length; i += 4) od.data[i] = ad[i]; ox.putImageData(od, 0, 0); }
    return out;
  }
  // Find things by name (CLIPSeg): one 352 × 352 map of 0–1 per word, for the whole picture
  async function find(src, words) {
    const T = await lib(), c = await canvasOf(src, 1024), raw = await rawOf(T, c);
    return run('find', async ({ tok, processor, model }) => {
      const ti = tok(words, { padding: true, truncation: true }), ii = await processor(words.map(() => raw)), { logits } = await model({ ...ti, ...ii });
      const dims = logits.dims, h = dims[dims.length - 2], w = dims[dims.length - 1], d = logits.data, maps = [];
      for (let k = 0; k < words.length; k++) { const m = new Float32Array(w * h); for (let i = 0; i < m.length; i++) m[i] = 1 / (1 + Math.exp(-d[k * w * h + i])); maps.push(m); }
      return { w, h, maps };
    });
  }
  // Fill in damage (MI-GAN): the picture (8-bit, channels first) and a mask (255 = keep, 0 = fill) in; the picture
  // back with the gaps drawn from their surroundings (the model's own pipeline file crops, resizes and blends)
  async function inpaint(img, hole) { const L = levelFor(img.width * img.height); noteLevel(L); const a = await inpaint1(img, hole); if (L.fillTta < 2) return a; const b = mirror(await inpaint1(mirror(img), mirrorMap(hole, img.width, img.height))); for (let i = 0; i < a.data.length; i++) if ((i & 3) !== 3) a.data[i] = (a.data[i] + b.data[i] + 1) >> 1; return a; }
  const mirror = (im) => { const W = im.width, H = im.height, o = new ImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (y * W + x) * 4, d = (y * W + W - 1 - x) * 4; o.data[d] = im.data[s]; o.data[d + 1] = im.data[s + 1]; o.data[d + 2] = im.data[s + 2]; o.data[d + 3] = im.data[s + 3]; } return o; };
  const mirrorMap = (m, W, H) => { const o = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) o[y * W + W - 1 - x] = m[y * W + x]; return o; };
  async function inpaint1(img, hole) {
    const T = await lib(), W = img.width, H = img.height, N = W * H, s = img.data, im = new Uint8Array(3 * N), mk = new Uint8Array(N);
    for (let p = 0; p < N; p++) { for (let c = 0; c < 3; c++) im[c * N + p] = s[p * 4 + c]; mk[p] = hole[p] > 0.5 ? 0 : 255; }
    const o = await run('inpaint', (ses) => ses.run({ [ses.inputNames[0]]: new T.ort.Tensor('uint8', im, [1, 3, H, W]), [ses.inputNames[1]]: new T.ort.Tensor('uint8', mk, [1, 1, H, W]) }).then((x) => x[ses.outputNames[0]]));
    const d = o.data, oh = o.dims[o.dims.length - 2], ow = o.dims[o.dims.length - 1]; if (oh !== H || ow !== W) throw new Error(`The repair model gave ${ow} × ${oh} for ${W} × ${H}.`);
    const out = new ImageData(W, H), od = out.data, f = d instanceof Float32Array ? (v) => Math.round(Math.max(0, Math.min(255, v))) : (v) => v;
    for (let p = 0; p < N; p++) { for (let c = 0; c < 3; c++) od[p * 4 + c] = f(d[c * N + p]); od[p * 4 + 3] = s[p * 4 + 3]; }
    return out;
  }
  // CodeFormer: an aligned 512 × 512 face (RGB scaled to −1…1) and w (0 = most redrawing, 1 = closest to the input)
  async function codeformer(face, w) { const L = levelFor(512 * 512 * 8); noteLevel(L); const a = await codeformer1(face, w); if (L.faceTta < 2) return a; const b = mirror(await codeformer1(mirror(face), w)); for (let i = 0; i < a.data.length; i++) if ((i & 3) !== 3) a.data[i] = (a.data[i] + b.data[i] + 1) >> 1; return a; }
  async function codeformer1(face, w) {
    const T = await lib(), N = 512 * 512, d = face.data, x = new Float32Array(3 * N);
    for (let p = 0; p < N; p++) for (let c = 0; c < 3; c++) x[c * N + p] = d[p * 4 + c] / 127.5 - 1;
    const o = await run('codeformer', (ses) => ses.run({ x: new T.ort.Tensor('float32', x, [1, 3, 512, 512]), w: new T.ort.Tensor('float64', new Float64Array([w]), []) }).then((r) => r.y));
    const y = o.data, out = new ImageData(512, 512); for (let p = 0; p < N; p++) { for (let c = 0; c < 3; c++) out.data[p * 4 + c] = Math.round(Math.max(0, Math.min(255, (y[c * N + p] + 1) * 127.5))); out.data[p * 4 + 3] = 255; }
    return out;
  }
  // DDColor: a 512 × 512 grey picture (RGB 0–1, rebuilt from lightness alone) in; the colour (Lab a and b) out
  async function colourise(grey512) {
    const T = await lib(), N = 512 * 512;
    const o = await run('colourise', (ses) => ses.run({ [ses.inputNames[0]]: new T.ort.Tensor('float32', grey512, [1, 3, 512, 512]) }).then((r) => r[ses.outputNames[0]]));
    return { a: o.data.slice(0, N), b: o.data.slice(N, 2 * N) };
  }
  // GFPGAN 1.4: an aligned 512 × 512 face (RGB scaled to −1…1) in, the restored face out
  async function gfpgan(face) { const L = levelFor(512 * 512 * 8); noteLevel(L); const a = await gfpgan1(face); if (L.faceTta < 2) return a; const b = mirror(await gfpgan1(mirror(face))); for (let i = 0; i < a.data.length; i++) if ((i & 3) !== 3) a.data[i] = (a.data[i] + b.data[i] + 1) >> 1; return a; }
  async function gfpgan1(face) {
    const T = await lib(), N = 512 * 512, d = face.data, x = new Float32Array(3 * N);
    for (let p = 0; p < N; p++) for (let c = 0; c < 3; c++) x[c * N + p] = d[p * 4 + c] / 127.5 - 1;
    const o = await run('gfpgan', (ses) => ses.run({ [ses.inputNames[0]]: new T.ort.Tensor('float32', x, [1, 3, 512, 512]) }).then((r) => r[ses.outputNames[0]]));
    const y = o.data, out = new ImageData(512, 512); for (let p = 0; p < N; p++) { for (let c = 0; c < 3; c++) out.data[p * 4 + c] = Math.round(Math.max(0, Math.min(255, (y[c * N + p] + 1) * 127.5))); out.data[p * 4 + 3] = 255; }
    return out;
  }
  // Find scratches (Bringing Old Photos Back to Life): grey in ((v/255 − 0.5)/0.5, sides a multiple of 16), the
  // chance of a scratch out; looked at no bigger than 1024 px across (as the original's own working size), then
  // enlarged smoothly to the picture's size
  async function scratches(img, max) {
    const L = levelFor(img.width * img.height); noteLevel(L); if (!max) max = L.scr;
    if (L.tta > 1) { const W = img.width, H = img.height, flip = (im, fh, fv) => { const o = new ImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = (y * W + x) * 4, d = ((fv ? H - 1 - y : y) * W + (fh ? W - 1 - x : x)) * 4; for (let q = 0; q < 4; q++) o.data[d + q] = im.data[s + q]; } return o; }, sum = await scratches1(img, max);
      for (const [fh, fv] of FLIPS.slice(1, L.tta)) { const m = await scratches1(flip(img, fh, fv), max); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sum[y * W + x] += m[(fv ? H - 1 - y : y) * W + (fh ? W - 1 - x : x)]; }
      for (let i = 0; i < sum.length; i++) sum[i] /= L.tta; return sum; }
    return scratches1(img, max);
  }
  async function scratches1(img, max) {
    const T = await lib(), W = img.width, H = img.height, k = Math.min(1, max / Math.max(W, H)), w = Math.max(16, Math.round((W * k) / 16) * 16), h = Math.max(16, Math.round((H * k) / 16) * 16);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; const src = document.createElement('canvas'); src.width = W; src.height = H; src.getContext('2d').putImageData(img, 0, 0); x.drawImage(src, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, inp = new Float32Array(w * h); for (let p = 0; p < w * h; p++) inp[p] = (0.299 * d[p * 4] + 0.587 * d[p * 4 + 1] + 0.114 * d[p * 4 + 2]) / 127.5 - 1;
    const o = await run('scratches', (ses) => ses.run({ [ses.inputNames[0]]: new T.ort.Tensor('float32', inp, [1, 1, h, w]) }).then((r) => r[ses.outputNames[0]]));
    const pr = o.data, out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) { const sy = Math.min(h - 1, Math.max(0, ((y + 0.5) * h) / H - 0.5)), y0 = Math.floor(sy), y1 = Math.min(h - 1, y0 + 1), ty = sy - y0;
      for (let xx = 0; xx < W; xx++) { const sx = Math.min(w - 1, Math.max(0, ((xx + 0.5) * w) / W - 0.5)), x0 = Math.floor(sx), x1 = Math.min(w - 1, x0 + 1), tx = sx - x0; out[y * W + xx] = (pr[y0 * w + x0] * (1 - tx) + pr[y0 * w + x1] * tx) * (1 - ty) + (pr[y1 * w + x0] * (1 - tx) + pr[y1 * w + x1] * tx) * ty; } }
    return out;
  }
  // Depth Anything V2 Small: how near each point is, 0 (farthest) to 1 (nearest), at most 768 px across
  function depth(src) {
    return remember('depth:' + keyOf(src), (async () => {
      const T = await lib(), c = await canvasOf(src, 768), raw0 = await rawOf(T, c), r = await run('depth', (pipe) => pipe(raw0));
      const t = r.predicted_depth, dims = t.dims, h = dims[dims.length - 2], w = dims[dims.length - 1], raw = t.data;
      let lo = Infinity, hi = -Infinity; for (let i = 0; i < raw.length; i++) { if (raw[i] < lo) lo = raw[i]; if (raw[i] > hi) hi = raw[i]; }
      const d = resample(raw, w, h, c.width, c.height), k = 1 / Math.max(1e-6, hi - lo); for (let i = 0; i < d.length; i++) d[i] = (d[i] - lo) * k;
      return { W: c.width, H: c.height, d };
    })());
  }
  function pick(src, pts) {
    return remember('pick:' + keyOf(src) + JSON.stringify(pts), (async () => {
      const T = await lib(), c = await canvasOf(src, 1024), image = await rawOf(T, c);
      const { out, masks } = await run('pick', async (sam) => {
        const ek = 'emb:' + keyOf(src) + ':' + deviceFor('pick');
        if (!memo.has(ek)) remember(ek, sam.processor(image).then((inp) => sam.model.get_image_embeddings(inp)));
        const emb = await memo.get(ek);
        const inp = await sam.processor(image, { input_points: [[pts.map(([u, v]) => [u * c.width, v * c.height])]], input_labels: [[pts.map((p) => (p[2] === 0 ? 0 : 1))]] });
        const o = await sam.model({ ...emb, input_points: inp.input_points, input_labels: inp.input_labels });
        return { out: o, masks: await sam.processor.post_process_masks(o.pred_masks, inp.original_sizes, inp.reshaped_input_sizes) };
      });
      const m = masks[0], sc = out.iou_scores.data;
      let best = 0; for (let i = 1; i < sc.length; i++) if (sc[i] > sc[best]) best = i;
      const dims = m.dims, H = dims[dims.length - 2], W = dims[dims.length - 1], a = new Uint8Array(W * H), off = best * W * H;
      for (let i = 0; i < W * H; i++) a[i] = m.data[off + i] ? 255 : 0;
      return { W, H, a };
    })());
  }

  // ------------------------------------------------------------------ downloaded or not
  async function downloaded() {
    const have = {}; Object.keys(MODELS).forEach((k) => { have[k] = false; });
    try { const c = await caches.open('transformers-cache'), keys = (await c.keys()).map((r) => r.url); Object.entries(MODELS).forEach(([k, m]) => { const id = k === 'cutout' ? cutoutId() : m.id; have[k] = keys.some((u) => u.includes(id + '/') && /\.onnx/.test(u)); }); } catch (e) { /* none */ }
    return have;
  }
  async function forget() { try { await caches.delete('transformers-cache'); } catch (e) { /* ignore */ } Object.keys(loaded).forEach((k) => delete loaded[k]); memo.clear(); }
  const enabled = (k) => settings.on && settings.use[k];

  // ------------------------------------------------------------------ the AI helpers dialog
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  async function openSettings() {
    await probed;
    let back = document.getElementById('aidlg');
    if (!back) { back = document.createElement('div'); back.className = 'backdrop'; back.id = 'aidlg'; document.body.append(back); }
    const LEVEL = { high: 'High: a strong graphics card. Every helper runs quickly.', medium: 'Medium: a graphics card. Every helper works; the cut-out takes a few seconds.', basic: 'Basic: no graphics card the browser can use, so the processor does the work. Slower, but everything still works.' };
    const draw = async () => {
      const have = await downloaded(), dev = device() === 'webgpu' ? 'gpu' : 'cpu';
      back.innerHTML = `<div class="dialog wide" role="dialog" aria-modal="true" aria-labelledby="ai-title">
        <h2 id="ai-title">AI helpers</h2>
        <p class="hint">Small AI models that run inside this browser: nothing is sent anywhere, no account or key. Each downloads once when first used (or now), then works offline.</p>
        <div class="field"><span>This computer (checked automatically)</span>
          <p style="margin:4px 0">${found.webgpu ? `Graphics card: <b>${esc(found.gpu)}</b>${found.f16 ? ', fast half-precision maths' : ''}` : 'No graphics card the browser can use for AI.'} · ${found.cores} processor threads${found.memory ? ` · ${found.memory >= 32 ? '32 GB or more' : found.memory + ' GB'} memory` : ''}</p>
          <p class="hint" style="margin:0">${LEVEL[found.level]}</p></div>
        <label class="check"><input type="checkbox" data-ai="on" ${settings.on ? 'checked' : ''}> Use AI helpers</label>
        <label class="check"><input type="checkbox" data-ai="gpu" ${settings.gpu ? 'checked' : ''} ${found.webgpu ? '' : 'disabled'}> Use the graphics card ${found.webgpu ? '(found)' : '(none found)'}</label>
        <div class="field"><span>Helpers</span>${Object.entries(MODELS).map(([k, m]) => `
          <div class="ai-row" style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;border-top:1px solid var(--line)">
            <label class="check" style="flex:1"><input type="checkbox" data-use="${k}" ${settings.use[k] ? 'checked' : ''} ${m.gpuOnly && !found.webgpu ? 'disabled' : ''}> <span><b>${m.name}</b><br><span class="hint">${m.what} About ${sizeOf(k)} MB · ${m.licence}</span></span></label>
            <span class="hint" data-state="${k}" style="min-width:110px;text-align:right">${have[k] ? '✓ Downloaded' : 'Not downloaded'}</span></div>`).join('')}</div>
        <p class="hint" id="ai-note"></p>
        <div class="dialog-actions"><button class="btn" type="button" data-act="forget">Remove downloaded models</button><button class="btn" type="button" data-act="get">Download now</button><button class="btn primary" type="button" data-act="close">Close</button></div></div>`;
    };
    await draw(); back.hidden = false;
    back.onchange = (e) => {
      const t = e.target;
      if (t.dataset.ai === 'on') settings.on = t.checked; else if (t.dataset.ai === 'gpu') settings.gpu = t.checked; else if (t.dataset.use) settings.use[t.dataset.use] = t.checked;
      save();
    };
    const off = onProgress((k, p) => {
      const el = back.querySelector(`[data-state="${k}"]`); if (!el) return;
      el.title = p.status === 'error' ? p.message || '' : ''; // the reason, on hover (and in the Debug log)
      el.textContent = p.status === 'ready' ? '✓ Ready' : p.status === 'error' ? 'Could not load' : p.total ? `Downloading ${Math.round((p.loaded / p.total) * 100)}%` : 'Starting…';
    });
    back.onclick = async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'close') { back.hidden = true; off(); return; }
      if (b.dataset.act === 'forget') { await forget(); await draw(); back.querySelector('#ai-note').textContent = 'Downloaded models removed. They download again when next used.'; return; }
      if (b.dataset.act === 'get') {
        b.disabled = true; const note = back.querySelector('#ai-note');
        for (const k of Object.keys(MODELS)) { if (!enabled(k)) continue; try { note.textContent = `Getting ${MODELS[k].name}…`; await ready(k); } catch (err) { note.textContent = err.message; } }
        if (!/could not/.test(note.textContent)) note.textContent = 'All set: the helpers that are ticked are ready, and work offline from now on.';
        b.disabled = false;
      }
    };
  }

  window.CRAFTAI = { depth, quality, setQuality, bench, estimate, onActivity, scratches, gfpgan, colourise, codeformer, inpaint, find, sizeOf, probe: () => probed, found: () => found, settings: () => settings, enabled, ready, cutout, pick, upscale, onProgress, downloaded, forget, openSettings, MODELS };
})();
