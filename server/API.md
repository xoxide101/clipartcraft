# Craft clip-art server API

The same API is served by `clipart-server.js` (Node 22.5+, on a PC or a Linux container) and `clipart-server.php`
(any web host with PHP 7.4+ and PDO). Apps can't tell them apart. Every answer allows any origin (CORS), so pages
opened from disk can use it.

## Libraries and databases

A library is a database for the names, tags and properties plus a folder for the files. Several libraries can sit
side by side (`?library=name` on any call; the first one is the main one).

| Database | Node (`clipart-server.json`) | PHP (`clipart-config.php`) |
|---|---|---|
| SQLite (one file, nothing to set up) | `"main": "sqlite:libraries/main"` | `'dsn' => 'sqlite:libraries/main/clipart.sqlite'` |
| MySQL / MariaDB | `"main": "mysql://user:pass@host/clipart?files=libraries/main/files"` (needs `npm install mysql2`) | `'dsn' => 'mysql:host=…;dbname=clipart;charset=utf8mb4', 'user' => …, 'password' => …` |
| JSON + files (export, import, moving) | `"main": "json:folder"` | via export/import ZIP |

Moving a library between any of them: `node clipart-server.js copy FROM TO`, e.g.
`copy sqlite:libraries/main json:backup`, then `copy json:backup mysql://…`. The export ZIP is the same JSON + files.

## Who may change things

Anyone may look (guest first). Changes are allowed from the same computer, or with the header `x-craft-key: KEY`
(the key is in `clipart-server.json` / `clipart-config.php`; the apps ask for it once).

## An item

```json
{ "id": "c…", "type": "clipart | model", "name": "Red barn_002", "category": "Farm", "tags": ["barn", "red"],
  "description": "", "kind": "colour | grey | bw", "width": 400, "height": 300, "frames": 1, "colours": 12,
  "source": "", "author": "", "licence": "", "hash": "", "added": "ISO time", "changed": "ISO time",
  "links": { "png": "http://…/clipart/Red%20barn_002.png", "svg": "…/Red%20barn_002.svg",
             "thumb": "…/Red%20barn_002.thumb.png", "anim": "…/Name.anim.gif", "orig": "…/Name.orig.tif",
             "model": "…/Name.model.glb" } }
```

Names are unique in a library: a name already used gets `_002`, `_003`… Files an item may have: `png` (the picture;
for a model, a picture of it), `svg`, `anim` (animated GIF/APNG/WebP), `orig` (the file it came from), `thumb`,
`model` (a 3D mesh: GLB, glTF, OBJ, STL, PLY, 3MF).

## Calls

| | |
|---|---|
| `GET /clipart/[library/]Name.png` (`.svg`, `.thumb.png`, `.anim.gif`, `.model.glb` …) | the file itself: a real link for any app or page |
| `GET /api/info` | server, version, libraries and their databases, whether you may write |
| `GET /api/items?q=words&category=&type=&limit=200&offset=0` | `{ total, items }`; every word must be in the name, tags, category or description |
| `GET /api/items/ID` (or `/api/items/Name`) | one item |
| `POST /api/items` | a new item: JSON fields, files inside as base64 (`"png": "…", "pngExt": "png"`; `svg` as text) |
| `PATCH /api/items/ID` | change fields and/or files (`"png": null` removes one) |
| `PUT /api/items/ID/png?ext=png` | one file as the raw body |
| `DELETE /api/items/ID` | delete it and its files |
| `GET /api/categories` | `[{ category, n }]` |
| `GET /api/export.zip?q=&category=&type=` | library.json + files, named after the items |
| `POST /api/import?category=` | a ZIP like that (or just pictures) as the body |

## Fields added since 1.0

`type` (`clipart` | `model`), `style` (flat icon, cartoon, hand-drawn, line art, watercolour, oil painting, 3D render,
silhouette, photo, pixel art, clip art) and `form` (object, scene, background, tile, border, map, logo, lettering,
ornament, box art, screenshot). Searching looks in them too. An older database gets the columns when it is opened.
