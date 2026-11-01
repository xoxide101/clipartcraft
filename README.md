# ClipArtCraft

The shared clip-art library of the Craft apps. Import pictures of any kind, cut sheets of clip art apart, name them (by hand, from the file names, or by what is in them with AI in the browser), sort them by category, style and form, tag them, find them, and export, back up or serve the library. Every Craft app opened in the same browser reads the same library, so clip art added here can be inserted in PressCraft, LogoCraft, LabelCraft, ImageCraft and the rest. With the **clip-art server** every picture also gets a real http link that any app or web page can use.

Runs in the browser, offline, straight from the folder (open `index.html`); no install, no account, nothing uploaded. The server is optional.

## Use

- **Import pictures** (Home, the start screen, or drop files on the window): PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, TIFF, SVG, APNG and the classic formats (TGA, PCX, IFF, Atari Degas and NEOchrome, Koala, Spectrum, MacPaint, PBM/PGM/PPM).
  - Every **page** of a TIFF, every **size** in an icon (the biggest is ticked) and every **frame** of an animation is offered. Animations stay moving (or each frame becomes its own picture).
  - Each picture can be **cropped** (drag on it), trimmed, turned, flipped, left out, or **cut into pictures** with the Montage Slicer.
  - **Names**: *Smart* keeps a file name with real words and names pictures called IMG_2041 and the like by what is in them; *By the AI* names everything by what is in it; *File names*; or *One name*. Names that are the same get `_002`, `_003`… on the end.
  - The AI (CLIP, in the browser; about 150 MB the first time, then offline) also gives each picture a **category**, a **style** (flat icon, cartoon, hand-drawn, line art, watercolour, oil painting, 3D render, silhouette, photo, pixel art, clip art), a **form** (object, scene, background, tile, border, map, logo, lettering, ornament, box art, screenshot) and tags (what else it might be, its main colours, vintage).
  - **Black and white** pictures become ink on see-through, so they show on any background (black ink, or white for dark backgrounds); or greyscale, pure black and white, or light and dark swapped. Look at a picture on see-through, white, black or colour.
  - **Copies** of pictures already in the library are spotted and left out.
  - **Textures** are checked for whether they tile (stitch) seamlessly: those get the form *tile* and the tag *seamless*.
  - SVGs are kept; drawings also get a traced SVG.
- **Montage Slicer** (Home › Slice, or *Slice a montage*): choose a sheet of clip art and it is cut into separate pictures. *Find the pictures* finds each one on a plain or old-paper background; *Grid* cuts rows × columns of equal cells, even touching, and can cut each picture out of its cell (its colour and long shadow too). Each new sheet is **worked out by itself** (whatever the last sheet's settings were): a grid with gutters (tiles kept whole, or pictures cut out of their cells), cells that touch (edges repeating at an even spacing), or pictures in no set grid (each found where it is); it says what it decided, and anything can be changed. **Room at the edges**: a little box whose four sides are clicked through yellow (auto: see-through space only where a picture touches that side), blue (always) and grey (none), with *All auto*, *Clear all* and how many pixels; it shows how many pictures touch each side. Two boxes decide each picture: **Cut each picture out** (off: its whole box or cell, e.g. an app tile with its own shape and colour) and **See-through background** (with a *how close* setting: lower keeps light parts like a white tile). The sheet shows **the result, live**, over a checkerboard, as settings change (or just the boxes). Click a picture to leave it out; type names in order and a category. **Add** first shows a **review**: every picture as it will be, to rename or untick, with anything that looks wrong flagged (smaller than the others, light parts lost, almost nothing left, nothing see-through). Every picture is added as PNG **and SVG** (cut from an SVG sheet exactly, traced otherwise).
  - **Tables**: a sheet of pictures between ruled lines (style charts: one subject per row, one style per column) is found by itself, lines too faint to see included. Its title, headings and row labels are left out of the cuts, photo cells are kept whole, and *Read the labels and headings with the AI* fills in the row names, column headings and the sheet's title (or type them). Untick a row or column, or click its label on the sheet, to leave it out.
  - **What the sheet says becomes the picture's information**: the row label is its name (words in brackets become a tag), the column heading becomes a tag and its style (pixel art, 3D render, photo…), the sheet's title its collection, and a description says all of it with the row and column. It is written into the PNG file too (title, description, keywords, source), and the AI's sorting only fills in what is missing.
  - **On the sheet**: *Pick* (click a box to leave it out; drag a box's edges to make it bigger or smaller, to trim off a name or take in a missed bit), *Main area* (drag a box: only what is inside is cut; or type the margins) and *Rule out* (drag boxes over anything to leave out: a title, a label, a watermark) and *Grid here* (drag over a row or part that came out wrong and say how many pictures across and down: it is cut as that grid). The main area's blue edges have handles to drag in any tool. *Leave out text* takes captions and labels off the pictures (captions can be read as names).
  - **Many sheets at once**: choose or drop several; they are done one after another (*Sheet 3 of 18*, *Skip to the next*), each worked out by itself, its **labels read by themselves** as it opens (once the describing AI is downloaded; it can be turned off), and *Add straight away when nothing looks wrong* skips the review.
  - **The background, picture by picture** (right-click): how much background to take (less keeps light parts), *Fill its shape* (everything inside its outline, for a solid thing the colour of the page), a **magic wand** to erase or keep from the spot clicked, and the **Touch up** tool: a box, an ellipse or a lasso (drag freehand, or click straight corners, as in Photoshop; Alt erases) that **keeps** (puts back exactly as on the sheet) or **erases** what is **inside** it, or everything **outside** it in that picture. *Names* and *Boxes* (N, B) hide the labels and boxes while working on a picture, and right-click offers **Reset just this cell** or **Reset the whole sheet**. One **Undo** and **Redo** (Ctrl+Z, Ctrl+Y, the tool bar or any right-click menu) step through every change made by hand, resets included. Cells whose light parts would be lost when cut out are kept with only the page round them cleared, by themselves.
  - **Right-click a box**: it first shows what the sheet says about it (the number and name it will get, its style and tags, its row and column and the sheet's title), then: name this picture, snap it to the picture (with or without its shadow), keep or leave out its shadow, cut it out or keep the whole box, split it into 2 or 3 (or a table's whole column or row), **join** boxes (Ctrl-click several, then right-click; or a table's row with the one below), leave out its row or column, rule it out, or undo the changes to it.
  - **Zoom** with the mouse wheel, **pan** with the middle button held, *Fit* and *100%*; turn, flip or straighten a slanted scan. The bar under the sheet shows the file, its size, the page colour, the main area, how many pictures, and the position and colour under the mouse.
- **Server › Connect…**: the places you use (This computer, Home, Work…) each with its address and key, checked as you look (answers, needs its key, no answer), *Look for servers*, and plain advice on what to do (start it, share it, a home address away from home: VPN or Tailscale, or keep working and Sync later). With *use the first place that answers*, the same copy works at home and at work. *Save my places to a file* makes a `config.js` to put beside `index.html`: any new browser opening that copy starts with your places (see `config.example.js`; keys only in a copy on your own computer). Put on a website, ClipArtCraft finds the server beside it (`server/clipart-server.php`) by itself. The server's setup page shows the addresses it can be reached at.
- **Same DNA / style**: a picture from a style sheet shows the same subject in the other styles (the pixel-art phone, the sticker, the glazed one, the photo…) under it and on its right-click menu: click one to go to it, or choose them all.
- **Right-click a picture** in the library (one or several chosen): Properties (a window with the same properties as the right side, Alt+Enter), Rename (F2), Category, ask the AI or a cloud AI, Copy, Save as PNG or SVG, Export, Select all, Delete. **Right-click a category or a sheet on the left** to choose, move, sort, export or delete all its pictures, or slice the sheet again.
- All-dark pictures (black line art) are shown on a light checkerboard so they can be seen in the dark theme.
- **Working area** (left, under the categories): the sheets and files clip art was imported from, kept so they can be sliced or imported again, with how many pictures were made from each. Delete them one by one, or all the used ones at once; the clip art stays.
- **Ask a cloud AI** (Home › Sort, or the button by a picture): for the pictures the AI here gets wrong, Claude, Gemini, GPT or OpenRouter names and sorts them, using your own key (Cloud AI settings). It needs the internet and costs a little per picture on your account; your key stays in your browser. The AI here learns from its answers.
- **Name, category, style, form, tags**: click an item; Ctrl-click or Shift-click several to give them a category or tags together; double-click to rename.
- **Find**: categories on the left; search by any words in the name, tags, category, style, form or kind ("black and white", "animated").
- **Export (ZIP)**: everything shown with `library.json`. **Library folder**: Save to the folder / Add from a folder.
- **Server** tab: connect to a clip-art server, then **Sync**, **Send to the server** or **Get from the server**. Items on the server show their links (PNG, SVG…) with **Copy link**.

## The clip-art server

The library over http: `server/clipart-server.js` (Node 22.5 or newer, on a PC or in a Linux container; double-click `server/start-server.cmd` on Windows) or `server/clipart-server.php` (a web host with PHP 7.4+, e.g. a NAS web server). Both give the same API (`server/API.md`).

- Every picture has a real link: `http://server/clipart/Red%20barn.png`, `….svg`, `….thumb.png`, `….anim.gif`, `….model.glb`.
- Libraries are kept in **SQLite** (built in, one file) or **MySQL / MariaDB**, with the pictures in a folder beside them. Several libraries can sit side by side.
- **JSON + files** (`library.json` beside the pictures) is the format for export, import and moving: `node clipart-server.js copy FROM TO` moves a library between SQLite, MySQL/MariaDB and JSON.
- Items are clip art or **3D models** (GLB, glTF, OBJ, STL, PLY, 3MF, with pictures of them), searchable by type.
- **Setup page** (`…/setup`): an admin login (made the first time), then the libraries and their databases: add, edit and **Test** each connection (a MySQL/MariaDB database is made the first time), choose the main one, and **copy** a library from one database to another when moving. Settings are kept in `clipart-settings.php`, the same file for Node and PHP.
- Anyone may look; changes are allowed from the same computer, with the server's key, or with the admin login.

## How the apps share it

- **In the browser**: IndexedDB database `craft-clipart` (version 1), stores `items` and `meta`. Chrome and Edge share it between pages opened from disk (any folder), and between apps hosted on one site. The working area is ClipArtCraft's own store (`craft-clipart-work`).
- **On disk or in a ZIP**: `library.json` beside the pictures:

```json
{ "library": "Clip art", "made": "2026-10-31T…", "by": "ClipArtCraft",
  "items": [ { "name": "Red Barn", "category": "Americana", "tags": ["farm"], "width": 352, "height": 208, "png": "Red Barn.png", "svg": "Red Barn.svg" } ] }
```

An item in the browser store: `{ id, name, category, tags, width, height, added, source, png (Blob), svg (text), thumb (small PNG data URL) }`, and optionally `type, style, form, kind, hash, anim, frames, sheet, serverId, links`. Other apps keep their own copy of the reading code (`js/library.js`).

Firefox keeps each page opened from disk separate, so there the library is per app; use the folder, ZIPs or the server to move it.

## How this was made

This app is **vibe coded**: its author designed and directed it in plain conversation, feature by feature, and an AI coding assistant (Claude, by Anthropic) wrote the code.

It is a **genuine clean-room build**, not a decompiled or AI-rebuilt copy of anything:
- Nothing was decompiled, disassembled or reverse-engineered, in whole or in part.
- No code, artwork, fonts, icons or data files from any other clip-art program were used, and none were given to the AI to work from.
- The picture file formats are read from their publicly documented layouts; the ideas (finding pictures on a sheet, sorting by category) are the general, well-known ones. Every line of ClipArtCraft's own code was made new.

This is an **alpha**: it works and is tested, but it is young and still changing.

## Credits

SVG tracing uses RasterTrace by bradsec (MIT) with VTracer by VisionCortex (MIT), bundled in `lib/craft-rastertrace.js`. Naming by what is in a picture uses CLIP ViT-B/32 (OpenAI, MIT; the Xenova ONNX copy) and Florence-2 base (Microsoft, MIT; the onnx-community copy) through Transformers.js (Hugging Face, Apache-2.0), bundled in `lib/craft-ai-libs.js` (`lib/ai-build` builds it). The slicer's finding and cutting is ClipArtCraft's own copy of ImageCraft's Split a sheet, and the file formats are its own copy of ImageCraft's readers.
