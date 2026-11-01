/* Naming pictures by what is in them (window.CraftNamer). CLIP (ViT-B/32, MIT) runs in the browser: the picture and a
   list of plain words are turned into directions, and the nearest words become the name, the category, the style, the
   form and the tags. Nothing is uploaded. The model (about 150 MB) downloads from huggingface.co the first time, then
   works offline.
     ready(progress)            → loads the model (and works out the words once; they are kept)
     name(canvas | ImageData)   → { name, category, style, form, tags, words: [{ word, score }], colours }
     fromFile(fileName)         → real words from a file name ('IMG_2041' → '', 'red-barn_2' → 'Red barn')
     colourWords(imageData)     → ['red', 'blue'] the main colours, by name
   Three things describe a picture: its CATEGORY (what it shows), its STYLE (how it is drawn) and its FORM (what kind of
   picture: one object, a scene, a background, a tile, a border…). The library (Transformers.js 3.8.1, Apache-2.0) is
   lib/craft-ai-libs.js, ClipArtCraft's own build. */
(function () {
  'use strict';
  const MODEL = 'Xenova/clip-vit-base-patch32', MB = 150;
  // the words, in the groups that are the categories
  const GROUPS = {
    Animals: 'cat kitten dog puppy horse pony cow bull pig sheep lamb goat chicken rooster hen chick duck goose turkey rabbit bunny mouse rat hamster squirrel chipmunk deer moose elk bear polar_bear panda koala kangaroo monkey gorilla lion tiger leopard cheetah zebra giraffe elephant rhino hippo camel llama fox wolf raccoon skunk beaver otter seal walrus penguin owl eagle hawk parrot flamingo peacock swan pigeon crow robin bluebird hummingbird bat frog toad turtle tortoise snake lizard crocodile alligator dinosaur dragon unicorn fish goldfish shark whale dolphin octopus jellyfish crab lobster starfish seahorse seashell snail butterfly bee ladybug dragonfly spider ant caterpillar worm bird paw_print',
    'Nature & weather': 'tree pine_tree palm_tree oak_tree leaf autumn_leaves flower rose tulip daisy sunflower lily cactus grass bush mushroom mountain hill volcano river lake waterfall ocean wave beach island desert forest meadow cloud rain snow snowflake lightning tornado rainbow sun moon star comet planet earth fire rock crystal spring_blossoms winter_landscape sunset',
    'People & occupations': 'man woman boy girl baby child children family couple grandparents teacher doctor nurse police_officer firefighter construction_worker chef farmer mechanic scientist artist cowboy pirate knight king queen prince princess clown magician astronaut soldier sailor angel fairy witch wizard ghost skeleton zombie vampire mermaid elf santa_claus snowman face hands handshake crowd',
    'Holidays & celebrations': 'christmas_tree ornament wreath candy_cane gift stocking reindeer sleigh jingle_bell easter_egg easter_bunny jack_o_lantern witch_hat valentine_heart cupid shamrock leprechaun fireworks birthday_cake balloons party_hat confetti champagne wedding_rings wedding_cake bouquet ribbon_bow new_year_clock menorah dreidel lantern festival_parade carnival_mask',
    'Education & school': 'book books notebook pencil pen crayon marker ruler eraser scissors glue paper school_bus backpack school_desk chalkboard globe graduation_cap diploma alphabet_blocks abacus microscope test_tube flask beaker magnifying_glass worksheet',
    'Food & drink': 'apple banana orange lemon lime pear peach cherry strawberry grapes watermelon pineapple coconut mango carrot potato tomato corn pumpkin onion pepper broccoli lettuce cucumber eggplant bread croissant pretzel donut bagel cake cupcake cookie pie muffin pancake waffle ice_cream candy lollipop chocolate popcorn pizza hamburger hot_dog sandwich taco sushi noodles spaghetti soup salad egg bacon steak cheese milk coffee tea juice soda lemonade wine beer cocktail honey',
    'Business & finance': 'briefcase money coin coins banknote dollar_sign credit_card piggy_bank safe gold_bar bar_chart pie_chart line_graph calculator office_desk contract signature receipt cash_register shopping_cart shopping_bag price_tag storefront calendar clipboard paperclip stapler folder envelope postage_stamp',
    'Healthcare & services': 'stethoscope syringe pill medicine_bottle bandage first_aid_kit thermometer tooth toothbrush human_heart brain hospital ambulance wheelchair crutches hospital_bed dentist veterinarian pharmacy mail_carrier delivery_truck plumber electrician hairdresser barber_pole',
    'Sports & recreation': 'football soccer_ball basketball baseball baseball_bat tennis_racket golf_ball golf_club hockey_stick bowling_pin volleyball boxing_glove trophy medal whistle dumbbell skis snowboard surfboard swimmer runner cyclist sports_field stadium chess_piece playing_cards dice jigsaw_puzzle kite teddy_bear doll toy_train camping_tent fishing_rod',
    'Buildings & architecture': 'house barn farmhouse castle church cathedral temple mosque school_building hospital_building store restaurant hotel bank factory office_building skyscraper lighthouse windmill tower bridge cabin igloo pyramid palace greenhouse gazebo garage city_skyline column arch doorway window staircase living_room kitchen bedroom bathroom classroom',
    'Transportation & travel': 'tank army_tank armoured_vehicle military_jeep military_truck rocket_launcher missile_launcher warship battleship fighter_plane biplane stagecoach covered_wagon horse_carriage horse_and_buggy wagon carriage car truck van bus taxi police_car fire_truck tractor bulldozer crane motorcycle scooter bicycle skateboard train locomotive tram airplane jet helicopter hot_air_balloon rocket spaceship boat sailboat ship canoe submarine anchor wheel traffic_light road_sign gas_pump suitcase passport compass eiffel_tower statue_of_liberty',
    'Technology & media': 'computer laptop monitor keyboard computer_mouse smartphone tablet printer robot computer_chip circuit_board satellite_dish solar_panel wind_turbine lightbulb battery plug camera video_camera movie_camera film_strip clapperboard projector video_player play_button television radio headphones microphone game_controller floppy_disk cd usb_stick cloud_upload wifi_symbol email chat_bubble web_browser settings_gear map_pin padlock notification_bell',
    'Games & software': 'video_game arcade_machine game_cartridge game_console joystick game_box retro_computer floppy_disk_box pixel_character space_invader maze_game racing_game platform_game title_screen high_score_table pinball_machine handheld_game',
    'Home & equipment': 'chair table sofa bed lamp candle clock mirror key lock bathtub toilet sink towel broom vacuum_cleaner bucket basket vase flower_pot picture_frame rug pillow fireplace telephone mailbox fence ladder umbrella cup mug teapot kettle plate bowl fork knife spoon frying_pan cooking_pot oven stove refrigerator toaster blender hammer saw screwdriver wrench pliers drill axe shovel rake wheelbarrow toolbox paintbrush gear magnet flashlight forklift factory_machine welding_torch hard_hat oil_barrel conveyor_belt',
    'Music & arts': 'guitar violin cello piano drum drum_kit trumpet trombone saxophone flute harp banjo accordion music_note treble_clef record_player paint_palette easel sculpture theater_masks ballet_dancer',
    'Clothing & fashion': 'shirt t-shirt dress skirt pants jeans jacket coat sweater hat cap top_hat cowboy_hat crown shoe boot sneaker sock glove scarf necktie bow_tie glasses sunglasses watch ring necklace purse handbag',
    'Religion, culture & flags': 'cross crucifix star_of_david crescent_moon_and_star om_symbol buddha praying_hands dove rosary flag american_flag british_flag national_flag totem_pole samurai viking roman_soldier egyptian_pharaoh medieval_knight',
    'Maps & places': 'world_map country_map city_map treasure_map topographic_map compass_rose road_map floor_plan',
    'Signs, symbols & logos': 'arrow check_mark cross_mark question_mark exclamation_mark plus_sign percent_sign at_sign hashtag recycle_symbol peace_sign yin_yang infinity_sign warning_sign stop_sign no_entry_sign biohazard_sign wheelchair_sign male_symbol female_symbol heart star circle square triangle hexagon diamond spiral badge shield emblem company_logo monogram letter number speech_bubble',
    'Borders, frames & backgrounds': 'border frame ornate_frame divider banner ribbon_banner decorative_corner scroll label certificate_border background abstract_background gradient_background',
    'Textures & patterns': 'texture pattern seamless_pattern wallpaper wood_texture stone_texture brick_wall fabric_texture paper_texture marble polka_dots stripes plaid checkerboard floral_pattern geometric_pattern mandala kaleidoscope',
  };
  // how it is drawn, what kind of picture it is, and old or new (each: [the word kept, what CLIP is shown])
  const STYLES = [['flat icon', 'a simple flat vector icon'], ['cartoon', 'a cartoon or comic drawing'], ['hand-drawn', 'a hand-drawn pencil or ink sketch'], ['line art', 'black line art with no colour'], ['watercolour', 'a watercolour painting'], ['oil painting', 'an oil painting'], ['3D render', 'a 3D rendered object'], ['silhouette', 'a solid black silhouette'], ['photo', 'a photograph'], ['pixel art', 'pixel art'], ['clip art', 'colourful clip art']];
  const FORMS = [['object', 'a single object on a plain background'], ['scene', 'a scene or landscape'], ['background', 'a background or wallpaper'], ['tile', 'a seamless repeating tile texture'], ['border', 'a decorative border, frame or banner'], ['map', 'a map'], ['logo', 'a logo or emblem'], ['lettering', 'words or lettering'], ['ornament', 'a symmetric ornament'], ['box art', 'the front of a game or product box'], ['screenshot', 'a screenshot of a computer or video game screen']];
  const ERAS = [['vintage', 'an old vintage illustration'], ['modern', 'a modern illustration']];
  // the starting lists (as the user's lists begin); configure() replaces them with the user's own
  const START = { categories: Object.entries(GROUPS).map(([name, list]) => ({ name, words: list.split(/\s+/).map((w) => w.replace(/_/g, ' ')) })), styles: STYLES.map((x) => x[0]), forms: FORMS.map((x) => x[0]) };
  const PROMPT = Object.fromEntries([...STYLES, ...FORMS]);
  let cats = START.categories, styles = STYLES, forms = FORMS, EXTRA = [];
  const WORDS = [], CAT = [];
  function build() {
    WORDS.length = 0; CAT.length = 0;
    for (const c of cats) for (const w of c.words) { const word = String(w).trim(); if (word && !WORDS.includes(word)) { WORDS.push(word); CAT.push(c.name); } }
    EXTRA = [...styles, ...forms, ...ERAS]; wordsP = null;
  }
  // the user's lists: { categories: [{ name, words: [] }], styles: [names], forms: [names] } (missing parts keep the starting ones)
  function configure(l = {}) {
    if (Array.isArray(l.categories) && l.categories.length) {
      cats = l.categories.filter((c) => c && c.name).map((c) => ({ name: String(c.name), words: (c.words || []).map(String) }));
      // words added to the starting lists since (a stagecoach, a tank…) join the user's same category, unless the user took them out
      const removed = new Set((l.removed || []).map((w) => String(w).toLowerCase()));
      for (const sc of START.categories) { const c = cats.find((x) => x.name === sc.name); if (!c) continue; const have = new Set(c.words.map((w) => w.toLowerCase())); for (const w of sc.words) if (!have.has(w.toLowerCase()) && !removed.has(w.toLowerCase())) c.words.push(w); }
    }
    if (Array.isArray(l.styles) && l.styles.length) styles = l.styles.map((n) => [n, PROMPT[n] || `${/^[aeiou]/i.test(n) ? 'an' : 'a'} ${n} picture`]);
    if (Array.isArray(l.forms) && l.forms.length) forms = l.forms.map((n) => [n, PROMPT[n] || `${/^[aeiou]/i.test(n) ? 'an' : 'a'} ${n}`]);
    build();
  }

  // ------------------------------------------------------------------ the model, loaded once
  let libP = null, visP = null, wordsP = null; build();
  const lib = () => (libP = libP || new Promise((ok, no) => {
    if (window.CraftTF) return ok(window.CraftTF);
    const s = document.createElement('script'); s.src = 'lib/craft-ai-libs.js';
    s.onload = () => { const T = window.CraftTF; T.env.allowLocalModels = false; T.env.useBrowserCache = true; ok(T); };
    s.onerror = () => { libP = null; no(new Error('The AI library (lib/craft-ai-libs.js) is missing from the ClipArtCraft folder.')); };
    document.head.append(s);
  }));
  const norm = (v) => { let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1; return Float32Array.from(v, (x) => x / n); };
  async function vision(progress) {
    return (visP = visP || (async () => {
      const T = await lib(), cb = (p) => { if (progress && p.status === 'progress' && p.total) progress(p.loaded, p.total, p.file); };
      return { proc: await T.AutoProcessor.from_pretrained(MODEL), model: await T.CLIPVisionModelWithProjection.from_pretrained(MODEL, { device: 'wasm', dtype: 'q8', progress_callback: cb }) };
    })().catch((e) => { visP = null; throw e; }));
  }
  // the words as directions: worked out once (about half a minute), then kept in the browser's cache
  const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const WKEY = () => 'https://craft.local/clipartcraft-words-v4-' + hash(WORDS.join('|') + '#' + EXTRA.map(([, t]) => t).join('|'));
  async function words(progress) {
    return (wordsP = wordsP || (async () => {
      const all = [...WORDS.map((w) => `an illustration of a ${w}`), ...EXTRA.map(([, t]) => t)];
      try { const c = await caches.open('clipartcraft-ai'), hit = await c.match(WKEY()); if (hit) return split(new Float32Array(await hit.arrayBuffer()), all.length); } catch (e) { /* no cache */ }
      const { tok, model } = await textModel();
      const out = []; for (let i = 0; i < all.length; i += 48) { const part = all.slice(i, i + 48), { text_embeds: e } = await model(tok(part, { padding: true, truncation: true })), d = e.dims[1]; for (let k = 0; k < part.length; k++) out.push(norm(e.data.slice(k * d, (k + 1) * d))); if (progress) progress(Math.min(i + 48, all.length), all.length, 'words'); }
      const flat = new Float32Array(out.length * out[0].length); out.forEach((v, i) => flat.set(v, i * v.length));
      try { const c = await caches.open('clipartcraft-ai'); await c.put(WKEY(), new Response(flat.buffer)); } catch (e) { /* not kept */ }
      return split(flat, all.length);
    })().catch((e) => { wordsP = null; throw e; }));
  }
  const split = (flat, n) => { const d = flat.length / n, v = []; for (let i = 0; i < n; i++) v.push(flat.subarray(i * d, (i + 1) * d)); return { words: v.slice(0, WORDS.length), extra: v.slice(WORDS.length) }; };
  let textP = null;
  const textModel = () => (textP = textP || (async () => { const T = await lib(); return { tok: await T.AutoTokenizer.from_pretrained(MODEL), model: await T.CLIPTextModelWithProjection.from_pretrained(MODEL, { device: 'wasm', dtype: 'q8' }) }; })().catch((e) => { textP = null; throw e; }));
  async function embedText(t) { const { tok, model } = await textModel(), { text_embeds: e } = await model(tok([t], { padding: true, truncation: true })); return norm(e.data); }

  // ------------------------------------------------------------------ describing a picture (Florence-2, MIT): a sentence
  // about what it shows ("a stagecoach with a driver's bench"), from which the subject is taken. On the graphics card
  // when there is one (WebGPU), on the processor otherwise. About 250 MB the first time.
  const DESCRIBER = 'onnx-community/Florence-2-base-ft';
  let descP = null;
  async function describer(progress) {
    return (descP = descP || (async () => {
      const T = await lib(), cb = (p) => { if (progress && p.status === 'progress' && p.total) progress(p.loaded, p.total, p.file); };
      let gpu = false; try { gpu = !!(navigator.gpu && (await navigator.gpu.requestAdapter())); } catch (e) { gpu = false; }
      const dtype = gpu ? { embed_tokens: 'fp16', vision_encoder: 'fp16', encoder_model: 'q4', decoder_model_merged: 'q4' } : 'q8';
      const model = await T.Florence2ForConditionalGeneration.from_pretrained(DESCRIBER, { dtype, device: gpu ? 'webgpu' : 'wasm', progress_callback: cb });
      return { model, processor: await T.AutoProcessor.from_pretrained(DESCRIBER), tokenizer: await T.AutoTokenizer.from_pretrained(DESCRIBER), gpu };
    })().catch((e) => { descP = null; throw e; }));
  }
  async function describe(src, { progress, detail = false } = {}) {
    const { model, processor, tokenizer } = await describer(progress), T = await lib();
    const c = document.createElement('canvas'), k = Math.min(1, 768 / Math.max(src.width, src.height)); c.width = Math.max(1, Math.round(src.width * k)); c.height = Math.max(1, Math.round(src.height * k));
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(src instanceof ImageData ? canvasOf(src) : src, 0, 0, c.width, c.height);
    const img = T.RawImage.fromCanvas(c), task = detail ? '<DETAILED_CAPTION>' : '<CAPTION>';
    const ids = await model.generate({ ...tokenizer(processor.construct_prompts(task)), ...(await processor(img)), max_new_tokens: 60 });
    const text = tokenizer.batch_decode(ids, { skip_special_tokens: false })[0];
    return String(processor.post_process_generation(text, task, img.size)[task] || '').trim();
  }
  // the subject of a description: "An illustration of an old stagecoach with four wheels." → "old stagecoach"
  const KINDS = /^(?:(?:a|an|the|this|that)\s+)?(?:(?:image|picture|drawing|illustration|cartoon|clip ?art|clipart|painting|photo(?:graph)?|icon|sketch|logo|vector|graphic|rendering|render|close[- ]up|view|pixel art|line drawing)\s+(?:of\s+)?)+/i;
  const STOP = new Set(['with', 'on', 'in', 'at', 'that', 'which', 'who', 'is', 'are', 'has', 'have', 'sitting', 'standing', 'holding', 'being', 'pulled', 'and', 'against', 'over', 'under', 'next', 'near', 'from', 'by', 'for', 'to', 'of', 'while', 'as', 'its', 'their', 'his', 'her']);
  function subjectOf(caption) {
    let t = String(caption).toLowerCase().replace(/[.,;:!?"“”()]/g, ' ').replace(/\s+/g, ' ').trim();
    t = t.replace(/^(?:in\s+)?(?:the|this)\s+(?:image|picture|illustration|drawing|photo)\s+(?:shows|depicts|features|contains|is of|is)\s+/, '');
    for (let i = 0; i < 3; i++) t = t.replace(KINDS, '').replace(/^(?:a|an|the)\s+/, '');
    // up to the first word that is not part of the thing itself (with, on, holding, filled…)
    const words = []; for (const w of t.split(' ')) { if (!w || STOP.has(w) || (words.length && /(?:ing|ed)$/.test(w) && w.length > 4)) break; words.push(w); if (words.length >= 4) break; }
    // age, size, colour and the like belong in the tags, not the name
    const SOFT = /^(?:old|older|vintage|antique|retro|modern|new|little|small|tiny|large|big|huge|cute|simple|plain|white|black|grey|gray|red|blue|green|yellow|orange|purple|pink|brown|colou?rful|bright|dark|light)$/;
    while (words.length > 1 && SOFT.test(words[0])) words.shift();
    return words.join(' ').trim();
  }
  async function describeReady(progress) { await describer(progress); return true; }
  async function describerDownloaded() { try { const c = await caches.open('transformers-cache'); return !!(await c.keys()).find((r) => r.url.includes('Florence-2')); } catch (e) { return false; } }

  async function ready(progress) { await vision(progress); await words(progress); return true; }
  async function downloaded() { try { const c = await caches.open('transformers-cache'); return !!(await c.keys()).find((r) => r.url.includes('clip-vit-base-patch32') && r.url.includes('vision_model')); } catch (e) { return false; } }

  // ------------------------------------------------------------------ naming one picture
  // see-through parts go white (clip art is usually seen on paper); the picture is padded square so CLIP sees all of it
  function prepare(src) {
    const w = src.width, h = src.height, s = 224 / Math.max(w, h), c = document.createElement('canvas'); c.width = c.height = 224;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 224, 224); x.imageSmoothingQuality = 'high';
    x.drawImage(src instanceof ImageData ? canvasOf(src) : src, (224 - w * s) / 2, (224 - h * s) / 2, w * s, h * s); return c;
  }
  const canvasOf = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c; };
  // lessons: [{ vec, name, category, style, form }] — the user's corrections, each with how the picture looked (vec).
  // A new picture that looks very like one of them takes the user's answer; one that looks a bit like it gets it as a guess.
  async function name(src, { progress, lessons = [], describe: useDescriber = false } = {}) {
    const [{ proc, model }, W] = await Promise.all([vision(progress), words(progress)]), T = await lib();
    const c = prepare(src), { image_embeds: e } = await model(await proc(T.RawImage.fromCanvas(c))), q = norm(e.data);
    const dot = (v) => { let s = 0; for (let k = 0; k < v.length; k++) s += v[k] * q[k]; return s; };
    const sc = W.words.map(dot), order = sc.map((_, i) => i).sort((a, b) => sc[b] - sc[a]), top = order.slice(0, 5).map((i) => ({ word: WORDS[i], category: CAT[i], score: +sc[i].toFixed(3) }));
    const ex = W.extra.map(dot), pick = (list, off) => { let b = 0; for (let i = 1; i < list.length; i++) if (ex[off + i] > ex[off + b]) b = i; return list[b][0]; };
    const style = pick(styles, 0), form = pick(forms, styles.length), eo = styles.length + forms.length, era = ex[eo] > ex[eo + 1] + 0.015 ? 'vintage' : ex[eo + 1] > ex[eo] + 0.015 ? 'modern' : '';
    const best = top[0], near = top.filter((t) => t.score > best.score - 0.02).map((t) => t.word);
    const colours = colourWords(src instanceof ImageData ? src : c.getContext('2d').getImageData(0, 0, 224, 224));
    const out = { name: cap(best.word), category: best.category, style, form, era, tags: [...new Set([...near, ...colours, ...(era === 'vintage' ? ['vintage'] : [])])], words: top, colours, vec: Array.from(q, (v) => +v.toFixed(5)) };
    if (useDescriber) {
      try {
        const caption = await describe(src, { progress }), subject = subjectOf(caption);
        out.description = caption;
        if (subject) {
          // the subject's category: the word on the lists nearest to it in meaning (and how near)
          const sv = await embedText('an illustration of a ' + subject), ws = W.words.map((v) => { let t = 0; for (let k2 = 0; k2 < v.length; k2++) t += v[k2] * sv[k2]; return t; });
          let bi = 0; for (let i = 1; i < ws.length; i++) if (ws[i] > ws[bi]) bi = i;
          const cat = ws[bi] > 0.78 ? CAT[bi] : best.category;
          // the name is what the describer saw (general or not, it is never wrong in a silly way); the matched words stay as guesses
          Object.assign(out, { name: cap(subject), category: cat, described: true, seenAs: cap(subject) });
          // words it read on the picture ("a sign that says freedom of the press") go into the tags, for searching
          const said = (caption.match(/(?:says|reads|saying|reading|with the words?)\s+["“']?([^"”'.]+)/i) || [])[1];
          if (said) out.saidText = said.trim();
          out.words = [{ word: subject, category: cat, score: +ws[bi].toFixed(3), described: true }, ...top.filter((w) => w.word !== subject)].slice(0, 6);
          out.tags = [...new Set([...subject.split(' ').filter((w) => w.length > 2), ...(out.saidText ? [out.saidText.toLowerCase()] : []), ...out.tags])];
        }
      } catch (e) { console.warn('Describing failed; the matched word is used', e); }
    }
    let lesson = null, ls = -1; for (const l of lessons) { if (!l.vec || l.vec.length !== q.length) continue; const v = dot(l.vec); if (v > ls) { ls = v; lesson = l; } }
    if (lesson && ls > 0.86) { Object.assign(out, { name: lesson.name || out.name, category: lesson.category || out.category, style: lesson.style || out.style, form: lesson.form || out.form, learnt: +ls.toFixed(3) }); }
    if (lesson && ls > 0.78) out.words = [{ word: lesson.name || out.name, category: lesson.category || out.category, score: +ls.toFixed(3), learnt: true }, ...out.words.filter((w) => w.word.toLowerCase() !== String(lesson.name || '').toLowerCase())].slice(0, 6);
    return out;
  }
  // a word the user taught (a name it did not know) added to a category's words, so it is matched from now on
  function learnWord(word, category) {
    const w = String(word || '').trim().toLowerCase(); if (!w || !category || WORDS.includes(w)) return false;
    let c = cats.find((x) => x.name === category); if (!c) { c = { name: category, words: [] }; cats.push(c); }
    c.words.push(w); build(); return true;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ------------------------------------------------------------------ names without AI
  // real words from a file name; camera and scanner names (IMG_2041, DSC00012, scan0003) give nothing
  const JUNK = /^(img|image|images|pic|pics|picture|pictures|photo|photos|dsc|dscn|dcim|scan|scans|scanned|screenshot|screenshots|clipart|cliparts|pages|sheets|files|frames|layers|sprites|assets|icons|items|untitled|copy|page|sheet|final|new|file|export|download|downloaded|edited|output|frame|layer|sprite|asset|icon|item|unnamed|default|temp|tmp|test)$/i;
  function fromFile(file) {
    let s = String(file).replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
    s = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-.+]+/g, ' ').replace(/\(\d+\)/g, ' ');
    const words = s.split(/\s+/).filter((w) => w && !/^\d+$/.test(w) && !/^[a-z]{0,4}\d{3,}[a-z]?$/i.test(w) && !JUNK.test(w) && /[a-z]{2,}/i.test(w));
    return words.length ? cap(words.join(' ').toLowerCase()) : '';
  }
  // the main colours by name (ignoring see-through, near-white paper and tiny amounts)
  const HUES = [[0, 'red'], [25, 'orange'], [50, 'yellow'], [80, 'green'], [160, 'teal'], [195, 'blue'], [255, 'purple'], [295, 'pink'], [340, 'red']];
  function colourWords(img) {
    const d = img.data, n = new Map(); let total = 0;
    for (let i = 0; i < d.length; i += 16) { if (d[i + 3] < 128) continue; const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      let w; if (l > 0.93) continue; if (l < 0.12) w = 'black'; else if (s < 0.18) w = l > 0.7 ? 'white' : 'grey'; else { let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h = (h * 60 + 360) % 360; w = HUES.filter(([a]) => h >= a).pop()[1]; if (w === 'orange' && l < 0.35) w = 'brown'; }
      n.set(w, (n.get(w) || 0) + 1); total++; }
    return [...n].filter(([, k]) => k / Math.max(1, total) > 0.12).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
  }

  window.CraftNamer = { ready, downloaded, name, describe, describeReady, describerDownloaded, subjectOf, fromFile, colourWords, configure, learnWord, MB, DESCRIBER_MB: 250,
    get WORDS() { return WORDS; }, get CATEGORIES() { return cats.map((c) => c.name); }, get STYLES() { return styles.map((x) => x[0]); }, get FORMS() { return forms.map((x) => x[0]); },
    lists: () => { const all = new Set(cats.flatMap((c) => c.words.map((w) => w.toLowerCase()))); return { categories: cats.map((c) => ({ name: c.name, words: c.words.slice() })), styles: styles.map((x) => x[0]), forms: forms.map((x) => x[0]), removed: START.categories.flatMap((c) => c.words).filter((w) => !all.has(w.toLowerCase())) }; },
    startingLists: () => JSON.parse(JSON.stringify(START)) };
})();
