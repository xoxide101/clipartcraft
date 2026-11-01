#!/usr/bin/env node
/* The Craft clip-art server: the shared clip-art library over http, so every Craft app (and any other program) can
   use it, with a real link for every picture. Nothing to install: Node 22.5 or newer (it has SQLite built in).

     node clipart-server.js                      start it (http://localhost:8790), libraries in ./libraries
     node clipart-server.js --share              let other computers on the network use it too (writes need the key)
     node clipart-server.js copy FROM TO         move or copy a library between databases, e.g.
         copy sqlite:libraries/main json:backup              (to library.json + pictures, the export format)
         copy json:backup sqlite:libraries/main              (back again)
         copy sqlite:libraries/main mysql://user:pass@host/clipart?files=libraries/main/files

   A library = a database (SQLite file, or MySQL/MariaDB) for the names, tags and properties + a folder of pictures.
   The JSON + files format (library.json beside the pictures) is the one for export, import and moving between servers.
   The same API is served by clipart-server.php for a web host. API.md lists it. */
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib'), crypto = require('node:crypto'), os = require('node:os');
const VERSION = '1.0';
const HERE = __dirname;

// ------------------------------------------------------------------ settings: clipart-settings.php beside this file
// The same file as the PHP server's, so the folder works under either: a first line that stops PHP showing it, then JSON.
// { key, port, share, main, connections: [{ id, name, db: 'sqlite'|'mysql'|'json', path, host, port, database, user,
//   password, files }] }. Each connection is a library; the setup page (/setup) edits them.
const SETTINGS = path.join(HERE, 'clipart-settings.php'), GUARD = '<?php exit; ?>\n';
const cid = () => 'k' + crypto.randomBytes(4).toString('hex');
// an old-style spec ('sqlite:folder', 'json:folder', 'mysql://user:pass@host:port/db?files=folder') as a connection
function connOf(name, spec) {
  if (/^(mysql|mariadb):/i.test(spec)) { const u = new URL(spec.replace(/^mariadb:/i, 'mysql:')); return { id: cid(), name, db: 'mysql', host: u.hostname, port: +u.port || 3306, database: decodeURIComponent(u.pathname.slice(1)), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), files: u.searchParams.get('files') || '' }; }
  if (/^json:/i.test(spec)) return { id: cid(), name, db: 'json', path: spec.slice(5) };
  return { id: cid(), name, db: 'sqlite', path: spec.replace(/^sqlite:/i, '') };
}
// a connection as the spec openDb() takes
function specOf(c) {
  if (c.db === 'mysql') return `mysql://${encodeURIComponent(c.user || '')}:${encodeURIComponent(c.password || '')}@${c.host || '127.0.0.1'}:${+c.port || 3306}/${encodeURIComponent(c.database || 'clipart')}?files=${encodeURIComponent(c.files || path.join('libraries', c.name, 'files'))}${c.socket ? '&socket=' + encodeURIComponent(c.socket) : ''}`;
  return `${c.db === 'json' ? 'json' : 'sqlite'}:${c.path || path.join('libraries', c.name)}`;
}
function settings() {
  let s = null;
  try { s = JSON.parse(fs.readFileSync(SETTINGS, 'utf8').replace(/^<\?php[^\n]*\n/, '')); } catch (e) { /* first run */ }
  if (!s) { // the old clipart-server.json, moved over once
    let old = {}; try { old = JSON.parse(fs.readFileSync(path.join(HERE, 'clipart-server.json'), 'utf8')); } catch (e) { /* none */ }
    s = { port: old.port || 8790, share: !!old.share, key: old.key || '', main: 'main', connections: Object.entries(old.libraries || { main: 'sqlite:libraries/main' }).map(([n, spec]) => connOf(n, spec)) };
  }
  s = { port: 8790, share: false, key: '', main: '', connections: [], ...s };
  if (!s.connections.length) s.connections.push({ id: cid(), name: 'main', db: 'sqlite', path: 'libraries/main' });
  if (!s.connections.some((c) => c.name === s.main)) s.main = s.connections[0].name;
  if (!s.key) s.key = crypto.randomBytes(12).toString('hex');
  saveSettings(s); return s;
}
// the admin login: only a salted hash is kept (PBKDF2-SHA256, 100,000 rounds; PHP checks the same with hash_pbkdf2)
function makeLogin(user, password) { const salt = crypto.randomBytes(16).toString('hex'); return { user, salt, rounds: 100000, hash: crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex') }; }
function checkLogin(a, user, password) {
  if (!a || String(user).toLowerCase() !== String(a.user).toLowerCase()) return false;
  const h = crypto.pbkdf2Sync(password, a.salt, a.rounds || 100000, 32, 'sha256'), want = Buffer.from(a.hash, 'hex');
  return h.length === want.length && crypto.timingSafeEqual(h, want);
}
function saveSettings(s) { try { fs.writeFileSync(SETTINGS, GUARD + JSON.stringify(s, null, 2)); return true; } catch (e) { return false; } }

// ------------------------------------------------------------------ the item: what every database keeps
// Columns are plain text and numbers so SQLite, MySQL and MariaDB hold them the same way.
const COLS = ['id', 'type', 'name', 'category', 'style', 'form', 'tags', 'description', 'kind', 'width', 'height', 'frames', 'colours', 'source', 'author', 'licence', 'hash', 'added', 'changed', 'files'];
const FILE_KINDS = ['png', 'svg', 'anim', 'orig', 'thumb', 'model']; // the files one item may have (model: a 3D mesh)
const TYPES = ['clipart', 'model']; // what an item is: clip art, or a 3D model (its png/thumb are pictures of it)
const MIME = { png: 'image/png', svg: 'image/svg+xml', gif: 'image/gif', webp: 'image/webp', apng: 'image/apng', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon', tif: 'image/tiff', tiff: 'image/tiff', json: 'application/json', zip: 'application/zip', glb: 'model/gltf-binary', gltf: 'model/gltf+json', obj: 'model/obj', stl: 'model/stl', ply: 'application/ply', '3mf': 'model/3mf' };
const toRow = (it) => ({ ...Object.fromEntries(COLS.map((c) => [c, it[c] ?? null])), tags: Array.isArray(it.tags) ? it.tags.join(', ') : it.tags || '', files: JSON.stringify(it.files || {}) });
const fromRow = (r) => r && ({ ...r, tags: String(r.tags || '').split(',').map((t) => t.trim()).filter(Boolean), files: (() => { try { return JSON.parse(r.files || '{}'); } catch (e) { return {}; } })() });
const uid = () => 'c' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const slug = (s) => String(s || 'item').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'item';
const extOf = (n) => (String(n).match(/\.([a-z0-9]+)$/i) || [, 'png'])[1].toLowerCase();

// Names stay unique in a library: a name already used gets _002, _003… (the first one keeps its plain name)
async function uniqueName(db, name, id) {
  const base = String(name || 'Untitled').trim().replace(/_\d{3,}$/, ''), taken = new Set((await db.namesLike(base)).filter((r) => r.id !== id).map((r) => r.name.toLowerCase()));
  if (!taken.has(base.toLowerCase()) && base === String(name).trim()) return base;
  if (!taken.has(String(name).trim().toLowerCase())) return String(name).trim();
  for (let n = 2; ; n++) { const t = `${base}_${String(n).padStart(3, '0')}`; if (!taken.has(t.toLowerCase())) return t; }
}

// ------------------------------------------------------------------ databases (drivers): sqlite, mysql/mariadb, json
// columns added since the first version: an older database gets them when it is opened
const ADDED = ['type VARCHAR(20)', 'style VARCHAR(40)', 'form VARCHAR(40)'];
const SCHEMA = (big) => `CREATE TABLE IF NOT EXISTS items (id VARCHAR(40) PRIMARY KEY, type VARCHAR(20), name VARCHAR(200) NOT NULL, category VARCHAR(200), style VARCHAR(40), form VARCHAR(40), tags ${big}, description ${big},
  kind VARCHAR(20), width INTEGER, height INTEGER, frames INTEGER, colours INTEGER, source VARCHAR(500), author VARCHAR(200), licence VARCHAR(200),
  hash VARCHAR(64), added VARCHAR(40), changed VARCHAR(40), files ${big})`;

function sqliteDb(dir) {
  const { DatabaseSync } = require('node:sqlite');
  fs.mkdirSync(path.join(dir, 'files'), { recursive: true });
  const d = new DatabaseSync(path.join(dir, 'clipart.sqlite'));
  d.exec(SCHEMA('TEXT')); for (const c of ADDED) try { d.exec(`ALTER TABLE items ADD COLUMN ${c}`); } catch (e) { /* has it */ } d.exec('CREATE INDEX IF NOT EXISTS items_type ON items(type); CREATE INDEX IF NOT EXISTS items_name ON items(name); CREATE INDEX IF NOT EXISTS items_cat ON items(category); CREATE INDEX IF NOT EXISTS items_hash ON items(hash)');
  const q = (sql, ...a) => d.prepare(sql).all(...a), one = (sql, ...a) => d.prepare(sql).get(...a);
  return {
    kind: 'sqlite', where: dir, filesDir: path.join(dir, 'files'),
    async list({ q: text = '', category = null, type = null, limit = 200, offset = 0 } = {}) { const [w, a] = filter(text, category, type); return { total: one(`SELECT COUNT(*) n FROM items ${w}`, ...a).n, items: q(`SELECT * FROM items ${w} ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?`, ...a, +limit, +offset).map(fromRow) }; },
    async get(id) { return fromRow(one('SELECT * FROM items WHERE id = ?', id)); },
    async byName(name) { return fromRow(one('SELECT * FROM items WHERE name = ? COLLATE NOCASE', name)); },
    async namesLike(base) { return q("SELECT id, name FROM items WHERE name = ? COLLATE NOCASE OR name LIKE ? ESCAPE '\\'", base, base.replace(/[\\%_]/g, '\\$&') + '\\_%'); },
    async put(it) { const r = toRow(it); d.prepare(`INSERT OR REPLACE INTO items (${COLS.join(',')}) VALUES (${COLS.map(() => '?').join(',')})`).run(...COLS.map((c) => r[c])); return it; },
    async remove(id) { d.prepare('DELETE FROM items WHERE id = ?').run(id); },
    async categories() { return q("SELECT COALESCE(category, '') category, COUNT(*) n FROM items GROUP BY COALESCE(category, '') ORDER BY category"); },
    async close() { d.close(); },
  };
}
// a search: every word must be found in the name, tags, category or description
function filter(text, category, type) {
  const w = [], a = []; if (type) { w.push("COALESCE(type, 'clipart') = ?"); a.push(type); } for (const word of String(text).toLowerCase().split(/\s+/).filter(Boolean)) { w.push("LOWER(CONCAT_WS(' ', name, tags, category, style, form, description)) LIKE ?"); a.push(`%${word}%`); }
  if (category !== null && category !== undefined) { w.push("COALESCE(category, '') = ?"); a.push(category); }
  return [w.length ? 'WHERE ' + w.join(' AND ') : '', a];
}

// MySQL / MariaDB: the same table. Needs the mysql2 package (npm install mysql2), only when this database is chosen.
function mysqlDb(url) {
  let mysql; try { mysql = require('mysql2/promise'); } catch (e) { throw new Error('MySQL/MariaDB needs the mysql2 package: run "npm install mysql2" in the server folder.'); }
  const u = new URL(url), files = u.searchParams.get('files') || path.join('libraries', decodeURIComponent(u.pathname.slice(1)) || 'mysql', 'files'), socket = u.searchParams.get('socket'); u.search = '';
  const filesDir = path.resolve(HERE, files); fs.mkdirSync(filesDir, { recursive: true });
  // through a socket file the login is user@localhost (on a QNAP only root@localhost may do everything)
  const how = (db) => socket ? { socketPath: socket, user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: db || undefined, charset: 'utf8mb4' } : { uri: (() => { const x = new URL(u.toString()); x.pathname = '/' + (db ? encodeURIComponent(db) : ''); return x.toString(); })(), charset: 'utf8mb4' };
  // the first time the database may not be there yet: it is made (if this login may), then the table in it
  const dbName = decodeURIComponent(u.pathname.slice(1)), made = (async () => {
    if (!dbName) throw new Error('The MySQL/MariaDB address needs a database name: mysql://user:pass@host:port/clipart');
    const c = await mysql.createConnection(how(''));
    try { await c.query(`CREATE DATABASE IF NOT EXISTS \`${dbName.replace(/`/g, '``')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); }
    catch (e) { const [rows] = await c.query('SHOW DATABASES LIKE ?', [dbName]); if (!rows.length) throw new Error(`The database “${dbName}” does not exist yet, and this login may not make it (${e.message}). Make it in phpMyAdmin, or use a login that may create databases.`); }
    finally { await c.end(); }
  })();
  const pool = mysql.createPool(how(dbName)), ready = made.then(() => pool.query(SCHEMA('MEDIUMTEXT'))).then(() => Promise.all(ADDED.map((c) => pool.query(`ALTER TABLE items ADD COLUMN ${c}`).catch(() => {})))).catch((e) => { throw new Error('The MySQL/MariaDB database could not be opened: ' + e.message); });
  const q = async (sql, a = []) => { await ready; return (await pool.query(sql, a))[0]; };
  return {
    kind: 'mysql', where: `${u.host}${u.pathname}`, filesDir,
    async list({ q: text = '', category = null, type = null, limit = 200, offset = 0 } = {}) { const [w, a] = filter(text, category, type); return { total: (await q(`SELECT COUNT(*) n FROM items ${w}`, a))[0].n, items: (await q(`SELECT * FROM items ${w} ORDER BY name LIMIT ? OFFSET ?`, [...a, +limit, +offset])).map(fromRow) }; },
    async get(id) { return fromRow((await q('SELECT * FROM items WHERE id = ?', [id]))[0]); },
    async byName(name) { return fromRow((await q('SELECT * FROM items WHERE name = ?', [name]))[0]); },
    async namesLike(base) { return q("SELECT id, name FROM items WHERE name = ? OR name LIKE ?", [base, base.replace(/[\\%_]/g, '\\$&') + '\\_%']); },
    async put(it) { const r = toRow(it); await q(`REPLACE INTO items (${COLS.join(',')}) VALUES (${COLS.map(() => '?').join(',')})`, COLS.map((c) => r[c])); return it; },
    async remove(id) { await q('DELETE FROM items WHERE id = ?', [id]); },
    async categories() { return q("SELECT COALESCE(category, '') category, COUNT(*) n FROM items GROUP BY COALESCE(category, '') ORDER BY category"); },
    async close() { await pool.end(); },
  };
}

// JSON + files: library.json beside the pictures (named after the items). The format for export, import and moving.
function jsonDb(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, 'library.json'); let lib = { library: path.basename(dir), items: [] };
  try { lib = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { /* new */ }
  const items = (lib.items || []).map((it) => ({ ...it, id: it.id || uid(), files: it.files || Object.fromEntries(FILE_KINDS.filter((k) => it[k]).map((k) => [k, it[k]])) }));
  const save = () => fs.writeFileSync(f, JSON.stringify({ library: lib.library, made: new Date().toISOString(), by: 'Craft clip-art server', items: items.map((it) => ({ ...it, ...it.files, files: undefined })) }, null, 1));
  return {
    kind: 'json', where: dir, filesDir: dir, named: true,
    async list({ q: text = '', category = null, type = null, limit = 200, offset = 0 } = {}) { const words = String(text).toLowerCase().split(/\s+/).filter(Boolean), m = items.filter((it) => (category === null || category === undefined || (it.category || '') === category) && words.every((w) => [it.name, (it.tags || []).join(' '), it.category, it.style, it.form, it.description].join(' ').toLowerCase().includes(w))).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })); return { total: m.length, items: m.slice(+offset, +offset + +limit) }; },
    async get(id) { return items.find((it) => it.id === id); },
    async byName(name) { return items.find((it) => it.name.toLowerCase() === String(name).toLowerCase()); },
    async namesLike(base) { const b = base.toLowerCase(); return items.filter((it) => it.name.toLowerCase() === b || it.name.toLowerCase().startsWith(b + '_')); },
    async put(it) { const i = items.findIndex((x) => x.id === it.id); if (i >= 0) items[i] = it; else items.push(it); save(); return it; },
    async remove(id) { const i = items.findIndex((x) => x.id === id); if (i >= 0) items.splice(i, 1); save(); },
    async categories() { const m = new Map(); items.forEach((it) => m.set(it.category || '', (m.get(it.category || '') || 0) + 1)); return [...m].sort().map(([category, n]) => ({ category, n })); },
    async close() { save(); },
  };
}

function openDb(spec) {
  if (/^mysql:|^mariadb:/i.test(spec)) return mysqlDb(spec.replace(/^mariadb:/i, 'mysql:'));
  if (/^json:/i.test(spec)) return jsonDb(path.resolve(HERE, spec.slice(5)));
  return sqliteDb(path.resolve(HERE, spec.replace(/^sqlite:/i, '')));
}

// ------------------------------------------------------------------ a library: database + its pictures
function library(name, spec) {
  const db = openDb(spec);
  // where a picture is kept: by id (sqlite/mysql), or by the item's name (json, so the folder is easy to browse)
  const fileName = (it, k, ext) => db.named ? `${slug(it.name)}${k === 'png' || k === 'svg' ? '' : '.' + k}.${ext}` : `${it.id}.${k}.${ext}`;
  async function setFile(it, k, bytes, ext) {
    if (it.files[k]) try { fs.unlinkSync(path.join(db.filesDir, it.files[k])); } catch (e) { /* gone */ }
    if (!bytes) { delete it.files[k]; return; }
    it.files[k] = fileName(it, k, ext); fs.writeFileSync(path.join(db.filesDir, it.files[k]), bytes);
  }
  const readFile = (it, k) => it.files && it.files[k] ? fs.readFileSync(path.join(db.filesDir, it.files[k])) : null;
  // add or change an item: meta fields and/or pictures { png: Buffer, svg: Buffer|string, … } with { ext }
  async function save(meta, pics = {}) {
    const old = meta.id ? await db.get(meta.id) : null, now = new Date().toISOString();
    const it = { ...(old || { id: meta.id || uid(), type: 'clipart', added: now, files: {} }), ...pick(meta), changed: now };
    it.files = { ...(old ? old.files : {}) };
    if (!old || (meta.name !== undefined && meta.name !== old.name)) it.name = await uniqueName(db, meta.name || (old && old.name) || 'Untitled', it.id);
    if (db.named && old && old.name !== it.name) for (const k of Object.keys(it.files)) { const b = readFile(old, k); if (b) await setFile(it, k, b, extOf(old.files[k])); }
    for (const k of FILE_KINDS) if (pics[k] !== undefined) await setFile(it, k, pics[k] && Buffer.from(pics[k]), pics[k + 'Ext'] || (k === 'svg' ? 'svg' : 'png'));
    return db.put(it);
  }
  const pick = (m) => m.type !== undefined && !TYPES.includes(m.type) ? (() => { throw Object.assign(new Error(`The type is ${TYPES.join(' or ')}.`), { code: 400 }); })() : Object.fromEntries(COLS.filter((c) => !['id', 'files', 'added', 'changed'].includes(c) && m[c] !== undefined).map((c) => [c, m[c]]));
  async function remove(id) { const it = await db.get(id); if (!it) return false; for (const k of Object.keys(it.files)) try { fs.unlinkSync(path.join(db.filesDir, it.files[k])); } catch (e) { /* gone */ } await db.remove(id); return true; }
  return { name, spec, db, save, remove, readFile };
}

// copy every item (and its pictures) from one library to another: the way to move between SQLite, MySQL/MariaDB and JSON
async function copyLibrary(from, to, log = console.log) {
  let n = 0; for (let off = 0; ; off += 500) {
    const { items, total } = await from.db.list({ limit: 500, offset: off }); if (!items.length) break;
    for (const it of items) { const pics = {}; for (const k of Object.keys(it.files || {})) { pics[k] = from.readFile(it, k); pics[k + 'Ext'] = extOf(it.files[k]); }
      const { files, ...meta } = it; await to.save(meta, pics); n++; }
    log(`  ${Math.min(off + items.length, total)} of ${total}`);
  }
  return n;
}

// ------------------------------------------------------------------ ZIP (library.json + pictures), stored out, stored/deflated in
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(files) {
  const parts = [], dir = []; let pos = 0;
  for (const f of files) { const nm = Buffer.from(f.name), c = crc32(f.bytes), h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x800, 6); h.writeUInt32LE(c, 14); h.writeUInt32LE(f.bytes.length, 18); h.writeUInt32LE(f.bytes.length, 22); h.writeUInt16LE(nm.length, 26);
    parts.push(h, nm, f.bytes); const d = Buffer.alloc(46); d.writeUInt32LE(0x02014b50, 0); d.writeUInt16LE(20, 4); d.writeUInt16LE(20, 6); d.writeUInt16LE(0x800, 8); d.writeUInt32LE(c, 16); d.writeUInt32LE(f.bytes.length, 20); d.writeUInt32LE(f.bytes.length, 24); d.writeUInt16LE(nm.length, 28); d.writeUInt32LE(pos, 42); dir.push(d, nm); pos += 30 + nm.length + f.bytes.length; }
  const ds = dir.reduce((a, b) => a + b.length, 0), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(ds, 12); e.writeUInt32LE(pos, 16);
  return Buffer.concat([...parts, ...dir, e]);
}
function unzip(b) {
  let e = b.length - 22; while (e >= 0 && b.readUInt32LE(e) !== 0x06054b50) e--; if (e < 0) throw new Error('Not a ZIP file.');
  const out = []; let p = b.readUInt32LE(e + 16); const n = b.readUInt16LE(e + 10);
  for (let i = 0; i < n; i++) { const m = b.readUInt16LE(p + 10), size = b.readUInt32LE(p + 20), nl = b.readUInt16LE(p + 28), el = b.readUInt16LE(p + 30), cl = b.readUInt16LE(p + 32), off = b.readUInt32LE(p + 42), name = b.toString('utf8', p + 46, p + 46 + nl);
    const st = off + 30 + b.readUInt16LE(off + 26) + b.readUInt16LE(off + 28), raw = b.subarray(st, st + size);
    if (!name.endsWith('/') && (m === 0 || m === 8)) out.push({ name, bytes: m === 0 ? raw : zlib.inflateRawSync(raw) }); p += 46 + nl + el + cl; }
  return out;
}
// export: library.json + pictures named after the items (what ClipArtCraft and ImageCraft read)
async function exportZip(lib, opts = {}) {
  const files = [], list = [], used = new Set();
  for (let off = 0; ; off += 500) { const { items } = await lib.db.list({ ...opts, limit: 500, offset: off }); if (!items.length) break;
    for (const it of items) { let base = slug(it.name), k = 2; while (used.has(base.toLowerCase())) base = `${slug(it.name)}_${k++}`; used.add(base.toLowerCase());
      const e = { ...it, files: undefined }; for (const fk of Object.keys(it.files || {})) { const ext = extOf(it.files[fk]), nm = `${base}${fk === 'png' || fk === 'svg' ? '' : '.' + fk}.${ext}`; const bytes = lib.readFile(it, fk); if (bytes) { files.push({ name: nm, bytes }); e[fk] = nm; } }
      list.push(e); } }
  files.push({ name: 'library.json', bytes: Buffer.from(JSON.stringify({ library: lib.name, made: new Date().toISOString(), by: 'Craft clip-art server', items: list }, null, 1)) });
  return zip(files);
}
async function importEntries(lib, entries, { category } = {}) {
  const by = new Map(entries.map((e) => [e.name.replace(/^.*\//, ''), e.bytes])), j = entries.find((e) => /(^|\/)library\.json$/i.test(e.name));
  let items; try { items = JSON.parse(j.bytes.toString('utf8')).items; } catch (e) { items = null; }
  if (!items) items = [...new Set(entries.filter((e) => /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(e.name)).map((e) => e.name.replace(/^.*\//, '').replace(/\.[^.]+$/, '')))].map((n) => ({ name: n.replace(/[_-]+/g, ' '), png: [...by.keys()].find((k) => k.replace(/\.[^.]+$/, '') === n && !/\.svg$/i.test(k)), svg: [...by.keys()].find((k) => k === n + '.svg') }));
  const made = [];
  for (const it of items) { const pics = {}; for (const k of FILE_KINDS) if (it[k] && by.get(it[k])) { pics[k] = by.get(it[k]); pics[k + 'Ext'] = extOf(it[k]); } if (!pics.png && !pics.svg && !pics.anim && !pics.model) continue;
    const meta = Object.fromEntries(COLS.filter((c) => it[c] !== undefined && c !== 'files' && c !== 'id').map((c) => [c, it[c]])); if (category && !meta.category) meta.category = category;
    made.push(await lib.save(meta, pics)); }
  return made;
}

// ------------------------------------------------------------------ http
function serve(S) {
  // the libraries, opened when first used (a database that is down does not stop the others)
  let libs = new Map();
  const libOf = (n) => {
    const c = S.connections.find((x) => x.name === (n || S.main)) || S.connections.find((x) => x.name === S.main); if (!c) throw Object.assign(new Error('No such library.'), { code: 404 });
    if (!libs.has(c.name)) libs.set(c.name, library(c.name, specOf(c))); return libs.get(c.name);
  };
  const closeAll = async () => { const old = [...libs.values()]; libs = new Map(); for (const l of old) try { await l.db.close(); } catch (e) { /* gone */ } };
  const base = (req) => `http://${req.headers.host}`;
  // what the API returns for an item: its fields and a real link for each picture
  const shown = (req, lib, it) => { if (!it) return null; const L = lib.name === S.main ? '' : encodeURIComponent(lib.name) + '/', nm = encodeURIComponent(it.name), links = {};
    for (const k of Object.keys(it.files || {})) links[k] = `${base(req)}/clipart/${L}${nm}${k === 'png' || k === 'svg' ? '' : '.' + k}.${extOf(it.files[k])}`;
    return { ...it, files: undefined, links, library: lib.name }; };
  const body = (req) => new Promise((ok, no) => { const c = []; let n = 0; req.on('data', (d) => { n += d.length; if (n > 200e6) { no(Object.assign(new Error('Too big.'), { code: 413 })); req.destroy(); } else c.push(d); }); req.on('end', () => ok(Buffer.concat(c))); req.on('error', no); });
  const send = (res, code, data, type = 'application/json; charset=utf-8', extra = {}) => { res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Private-Network': 'true', ...extra }); res.end(Buffer.isBuffer(data) || typeof data === 'string' ? data : JSON.stringify(data)); };
  const local = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  // the admin's login, sent with each setup call as x-craft-login: base64("user:password")
  const loginOk = (req) => { if (!S.admin || !req.headers['x-craft-login']) return false; const t = Buffer.from(String(req.headers['x-craft-login']), 'base64').toString('utf8'), i = t.indexOf(':'); return i > 0 && checkLogin(S.admin, t.slice(0, i), t.slice(i + 1)); };
  const mayWrite = (req) => local(req) || req.headers['x-craft-key'] === S.key || loginOk(req);

  return http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname).split('/').filter(Boolean), Q = Object.fromEntries(u.searchParams);
    try {
      if (req.method === 'OPTIONS') return send(res, 204, '');
      // the setup has its own login (below); everything else that changes the library needs this computer, the key or that login
      if (req.method !== 'GET' && req.method !== 'HEAD' && !(p[0] === 'api' && p[1] === 'setup') && !mayWrite(req)) return send(res, 403, { error: 'Only this computer, or a program with the key, can change the library.' });
      // pictures: /clipart/[library/]Name.png | Name.svg | Name.thumb.png | Name.anim.gif
      if (p[0] === 'clipart' && p.length >= 2) {
        const lib = p.length > 2 ? libOf(p[1]) : libOf(S.main), f = p[p.length - 1], m = f.match(/^(.*?)(?:\.(thumb|anim|orig|model))?\.([a-z0-9]+)$/i); if (!m) return send(res, 404, { error: 'No such picture.' });
        const it = (await lib.db.byName(m[1])) || (await lib.db.get(m[1])), k = m[2] || (m[3].toLowerCase() === 'svg' ? 'svg' : 'png');
        const b = it && (lib.readFile(it, k) || (k === 'thumb' && lib.readFile(it, 'png'))); if (!b) return send(res, 404, { error: 'No such picture.' });
        return send(res, 200, b, MIME[extOf((it.files[k] || it.files.png))] || 'application/octet-stream', { 'Cache-Control': 'no-cache' });
      }
      if (p[0] === 'setup' && p.length === 1) return send(res, 200, fs.readFileSync(path.join(HERE, 'setup.html')), 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });
      // the setup page's calls: the connections (passwords are never sent back), test one, copy one library into another
      if (p[0] === 'api' && p[1] === 'setup') {
        // who may: this computer, or the admin's user ID and password (made the first time the page is opened)
        const j = req.method === 'GET' ? {} : JSON.parse((await body(req)).toString('utf8') || '{}');
        if (p[2] === 'admin' && req.method === 'POST') {
          if (S.admin && !local(req) && !loginOk(req)) return send(res, 403, { error: 'Log in first.' });
          const user = String(j.user || '').trim(); if (!user || String(j.password || '').length < 6) return send(res, 400, { error: 'Give a user ID and a password of at least 6 characters.' });
          S.admin = makeLogin(user, String(j.password)); if (!saveSettings(S)) return send(res, 500, { error: 'The settings could not be saved (is the server folder read-only?).' });
          return send(res, 200, { saved: true, user });
        }
        if (!S.admin && !local(req)) return send(res, 200, { needAdmin: true, server: 'node' });
        if (!local(req) && !loginOk(req)) return send(res, 403, { error: 'The user ID or password is not right.', login: true });
        const hide = (c) => ({ ...c, password: undefined, hasPassword: !!c.password });
        if (!p[2] && req.method === 'GET') return send(res, 200, { server: 'node', drivers: ['sqlite', 'mysql', 'json'], port: S.port, share: S.share, main: S.main, admin: S.admin ? S.admin.user : '', key: S.key, connections: S.connections.map(hide), file: SETTINGS });
        const withPassword = (c) => ({ ...c, password: c.password !== undefined ? c.password : (S.connections.find((x) => x.id === c.id) || {}).password || '' });
        if (!p[2] && req.method === 'PUT') {
          const list = (j.connections || []).map((c) => withPassword({ ...c, id: c.id || cid(), name: String(c.name || '').trim() }));
          const bad = list.find((c) => !/^[\w\- ]{1,40}$/.test(c.name)); if (bad) return send(res, 400, { error: `“${bad.name}” cannot be a library name: use letters, numbers, spaces, - and _ (up to 40).` });
          if (new Set(list.map((c) => c.name.toLowerCase())).size !== list.length) return send(res, 400, { error: 'Two libraries have the same name.' });
          if (!list.length) return send(res, 400, { error: 'Keep at least one library.' });
          const restart = (j.port && +j.port !== S.port) || (j.share !== undefined && !!j.share !== S.share);
          Object.assign(S, { connections: list, main: list.some((c) => c.name === j.main) ? j.main : list[0].name, port: +j.port || S.port, share: j.share !== undefined ? !!j.share : S.share });
          if (j.key) S.key = String(j.key);
          await closeAll(); if (!saveSettings(S)) return send(res, 500, { error: 'The settings could not be saved (is the server folder read-only?).' });
          return send(res, 200, { saved: true, restart, main: S.main, connections: S.connections.map(hide) });
        }
        if (p[2] === 'test' && req.method === 'POST') {
          const c = withPassword(j.connection || {}); let l = null;
          try { l = library(c.name || 'test', specOf(c)); const r = await l.db.list({ limit: 1 }); return send(res, 200, { ok: true, items: r.total, where: l.db.where, database: l.db.kind }); }
          catch (e) { return send(res, 200, { ok: false, error: String(e.message || e) }); } finally { if (l) try { await l.db.close(); } catch (e) { /* gone */ } }
        }
        if (p[2] === 'copy' && req.method === 'POST') {
          if (j.from === j.to) return send(res, 400, { error: 'Choose two different libraries.' });
          for (const w of ['from', 'to']) if (!S.connections.some((c) => c.name === j[w])) return send(res, 400, { error: `There is no library called “${j[w] || ''}” (save the libraries first).` });
          const n = await copyLibrary(libOf(j.from), libOf(j.to), () => {}); return send(res, 200, { copied: n, from: j.from, to: j.to });
        }
        return send(res, 404, { error: 'Not found.' });
      }
      if (p[0] !== 'api') {
        if (!p.length) return send(res, 200, `<!doctype html><meta charset="utf-8"><title>Craft clip-art server</title><body style="font:16px system-ui;margin:2em;max-width:40em"><h1>Craft clip-art server</h1><p>It is running. Open ClipArtCraft and connect to <b>${base(req)}</b>, or see <a href="/api/info">/api/info</a>.</p>`, 'text/html; charset=utf-8');
        return send(res, 404, { error: 'Not found.' });
      }
      const lib = libOf(Q.library), db = lib.db;
      if (p[1] === 'info') return send(res, 200, { server: 'Craft clip-art server', version: VERSION, api: 1, writable: mayWrite(req), main: S.main, libraries: S.connections.map((c) => ({ name: c.name, database: c.db })) });
      if (p[1] === 'categories') return send(res, 200, await db.categories());
      if (p[1] === 'export.zip') return send(res, 200, await exportZip(lib, { q: Q.q, category: Q.category, type: Q.type }), 'application/zip', { 'Content-Disposition': `attachment; filename="${slug(lib.name)} clip art.zip"` });
      if (p[1] === 'import' && req.method === 'POST') { const made = await importEntries(lib, unzip(await body(req)), { category: Q.category }); return send(res, 200, { added: made.length, items: made.map((it) => shown(req, lib, it)) }); }
      if (p[1] === 'items') {
        const id = p[2];
        if (!id && req.method === 'GET') { const r = await db.list({ q: Q.q || '', category: Q.category, type: Q.type, limit: Math.min(+Q.limit || 200, 5000), offset: +Q.offset || 0 }); return send(res, 200, { total: r.total, items: r.items.map((it) => shown(req, lib, it)) }); }
        // POST: a new item (or PATCH an old one) as JSON; pictures inside as base64: { png: 'base64', pngExt: 'png', svg: '<svg…' }
        if ((!id && req.method === 'POST') || (id && req.method === 'PATCH')) {
          const j = JSON.parse((await body(req)).toString('utf8') || '{}'), pics = {};
          for (const k of FILE_KINDS) if (j[k] !== undefined) { pics[k] = j[k] === null ? null : k === 'svg' && !j.svgBase64 ? Buffer.from(j[k]) : Buffer.from(j[k], 'base64'); pics[k + 'Ext'] = j[k + 'Ext']; delete j[k]; }
          if (id && !(await db.get(id))) return send(res, 404, { error: 'No such item.' });
          return send(res, id ? 200 : 201, shown(req, lib, await lib.save({ ...j, id: id || j.id }, pics)));
        }
        if (id && p[3] && req.method === 'PUT') { const it = await db.get(id); if (!it) return send(res, 404, { error: 'No such item.' }); return send(res, 200, shown(req, lib, await lib.save({ id }, { [p[3]]: await body(req), [p[3] + 'Ext']: Q.ext || (p[3] === 'svg' ? 'svg' : 'png') }))); }
        if (id && req.method === 'GET') { const it = (await db.get(id)) || (await db.byName(id)); return it ? send(res, 200, shown(req, lib, it)) : send(res, 404, { error: 'No such item.' }); }
        if (id && req.method === 'DELETE') return (await lib.remove(id)) ? send(res, 200, { deleted: id }) : send(res, 404, { error: 'No such item.' });
      }
      send(res, 404, { error: 'Not found.' });
    } catch (e) { send(res, e.code >= 400 && e.code < 600 ? e.code : 500, { error: String(e.message || e) }); }
  });
}

// ------------------------------------------------------------------ command line
if (require.main === module) {
  const a = process.argv.slice(2);
  if (a[0] === 'copy') {
    if (a.length < 3) { console.log('node clipart-server.js copy FROM TO   (sqlite:folder, json:folder, mysql://user:pass@host/db?files=folder)'); process.exit(1); }
    // FROM and TO: a library's name from the settings, or a spec (sqlite:folder, json:folder, mysql://…)
    const S = settings(), lib = (x) => { const c = S.connections.find((k) => k.name === x); return library(c ? c.name : 'copy', c ? specOf(c) : x); };
    (async () => { const from = lib(a[1]), to = lib(a[2]); console.log(`Copying ${from.db.kind} ${from.db.where} → ${to.db.kind} ${to.db.where}`); const n = await copyLibrary(from, to); await from.db.close(); await to.db.close(); console.log(`Done: ${n} item${n === 1 ? '' : 's'}.`); })().catch((e) => { console.error(e.message); process.exit(1); });
  } else {
    // --port and --share are remembered, so the next start without them is the same
    const S = settings(); if (a.includes('--share')) S.share = true; const pi = a.indexOf('--port'); if (pi >= 0 && +a[pi + 1] > 0) S.port = +a[pi + 1];
    if (pi >= 0 || a.includes('--share')) saveSettings(S);
    const srv = serve(S); srv.listen(S.port, S.share ? '0.0.0.0' : '127.0.0.1', () => {
      console.log(`Craft clip-art server ${VERSION}: http://localhost:${S.port}/`);
      for (const c of S.connections) console.log(`  library “${c.name}”${c.name === S.main ? ' (main)' : ''}: ${c.db === 'mysql' ? `MySQL/MariaDB ${c.host}:${c.port}/${c.database}` : `${c.db} ${c.path}`}`);
      console.log(`  set up the databases: http://localhost:${S.port}/setup${S.admin ? '' : ' (make the admin login there first)'}`);
      if (S.share) { const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address); console.log(`  shared on the network: ${ips.map((ip) => `http://${ip}:${S.port}/`).join(' ')}`); console.log('  other computers can look; to change the library they need the key (on the setup page) or the admin login'); }
      console.log('Close this window to stop it.');
    });
  }
}
module.exports = { serve, library, copyLibrary, openDb, uniqueName, exportZip, importEntries, zip, unzip };
