# Craft clip-art server API

The same API is served by `clipart-server.js` (Node 22.5+, on a PC or a Linux container) and `clipart-server.php`
(any web host with PHP 7.4+ and PDO). Apps can't tell them apart. Every answer allows any origin (CORS), so pages
opened from disk can use it.

## Setting it up: …/setup

Open `http://server:8790/setup` (Node) or `…/setup` beside `clipart-server.php` (PHP). The first time it asks for an
admin user ID and password (only a salted PBKDF2-SHA256 hash is kept). Then:

- **Libraries and their databases**: one or more, each in **SQLite** (one file, nothing to set up), **MySQL / MariaDB**
  (host, port, database name, user ID, password, pictures folder) or, on the Node server, a **JSON + files** folder.
  **Test** connects (and makes a MySQL/MariaDB database the first time, if the login may); one library is the **main**
  one (its links are `/clipart/Name.png`, the others `/clipart/library/Name.png`).
- **Copy a library** from one to another: the way to move to a new database or server.
- The **key for apps**, and the admin login.

Everything is kept in `clipart-settings.php` beside the server: the same file for Node and PHP (its first line stops PHP
showing it; `.htaccess` blocks it too). Database passwords are kept there, so the server can connect; they are never
sent back to the page. The Node server needs `npm install mysql2` for MySQL/MariaDB; PHP has it built in (PDO).

On the command line (Node): `node clipart-server.js copy FROM TO`, where FROM and TO are library names from the
settings, or `sqlite:folder`, `json:folder`, `mysql://user:pass@host:port/db?files=folder`.

## Who may change things

Anyone may look (guest first). Changes are allowed from the same computer, with the header `x-craft-key: KEY` (the key
is on the setup page; the apps ask for it once), or with the admin login (`x-craft-login: base64(user:password)`).

| Setup call | |
|---|---|
| `GET /api/setup` | the settings (no passwords), or `{ needAdmin: true }` the first time |
| `POST /api/setup/admin` | `{ user, password }`: make (first time) or change the admin login |
| `PUT /api/setup` | `{ main, connections: [...] }`; a connection without `password` keeps its saved one |
| `POST /api/setup/test` | `{ connection }` → `{ ok, items, where }` or `{ ok: false, error }` |
| `POST /api/setup/copy` | `{ from, to }` → `{ copied }` |

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
