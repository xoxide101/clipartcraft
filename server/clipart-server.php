<?php
/* The Craft clip-art server for a web host (Apache/Nginx + PHP 7.4 or newer with PDO): the same API as
   clipart-server.js, so the Craft apps can't tell them apart. Put this folder on the web server and open …/setup
   (or clipart-server.php/setup): make the admin login, then the databases (SQLite needs nothing; MySQL/MariaDB needs
   a host and login, and the database is made the first time). The settings are kept in clipart-settings.php, the same
   file the Node server uses. With .htaccess (Apache) the links are /clipart/Name.png; without it they still work as
   clipart-server.php/clipart/Name.png. Changes need the key (on the setup page; the apps ask for it once). */
declare(strict_types=1);
const VERSION = '1.0';
const COLS = ['id', 'type', 'name', 'original', 'seen', 'matched', 'category', 'style', 'form', 'tags', 'description', 'kind', 'width', 'height', 'frames', 'colours', 'source', 'author', 'licence', 'hash', 'added', 'changed', 'files'];
const FILE_KINDS = ['png', 'svg', 'anim', 'orig', 'thumb', 'model']; // model: a 3D mesh
const TYPES = ['clipart', 'model'];
const MIME = ['png' => 'image/png', 'svg' => 'image/svg+xml', 'gif' => 'image/gif', 'webp' => 'image/webp', 'apng' => 'image/apng', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'avif' => 'image/avif', 'bmp' => 'image/bmp', 'ico' => 'image/x-icon', 'tif' => 'image/tiff', 'tiff' => 'image/tiff', 'glb' => 'model/gltf-binary', 'gltf' => 'model/gltf+json', 'obj' => 'model/obj', 'stl' => 'model/stl', 'ply' => 'application/ply', '3mf' => 'model/3mf'];

// ------------------------------------------------------------------ settings: clipart-settings.php (shared with the Node server)
// A first line that stops PHP showing it, then JSON: { key, main, admin, connections: [{ id, name, db: 'sqlite'|'mysql',
// path, host, port, database, user, password, files }] }. The setup page edits it.
const SETTINGS = __DIR__ . '/clipart-settings.php';
function cid(): string { return 'k' . bin2hex(random_bytes(4)); }
// an old clipart-config.php library ['dsn' => …, 'user', 'password', 'files'] as a connection
function conn_from_dsn(string $name, array $l): array {
  $dsn = $l['dsn'] ?? '';
  if (stripos($dsn, 'mysql:') === 0) { $o = []; foreach (explode(';', substr($dsn, 6)) as $kv) { [$k, $v] = array_pad(explode('=', $kv, 2), 2, ''); $o[strtolower(trim($k))] = trim($v); }
    return ['id' => cid(), 'name' => $name, 'db' => 'mysql', 'host' => $o['host'] ?? '127.0.0.1', 'port' => (int) ($o['port'] ?? 3306), 'database' => $o['dbname'] ?? 'clipart', 'user' => $l['user'] ?? '', 'password' => $l['password'] ?? '', 'files' => $l['files'] ?? ''];
  }
  return ['id' => cid(), 'name' => $name, 'db' => 'sqlite', 'path' => dirname(substr($dsn, 7) ?: "libraries/$name/clipart.sqlite")];
}
function cfg(?array $set = null): array {
  static $c = null; if ($set !== null) return $c = $set; if ($c !== null) return $c;
  if (is_file(SETTINGS)) $c = json_decode(preg_replace('/^<\?php[^\n]*\n/', '', (string) file_get_contents(SETTINGS)), true);
  if (!$c) { // the old clipart-config.php, moved over once
    $old = is_file(__DIR__ . '/clipart-config.php') ? (require __DIR__ . '/clipart-config.php') : [];
    $c = ['key' => $old['key'] ?? '', 'connections' => array_map(fn ($n) => conn_from_dsn((string) $n, $old['libraries'][$n]), array_keys($old['libraries'] ?? []))];
    $c['main'] = $c['connections'][0]['name'] ?? 'main';
  }
  $c += ['key' => '', 'main' => '', 'connections' => [], 'admin' => null, 'port' => 8790, 'share' => false];
  if (!$c['connections']) $c['connections'][] = ['id' => cid(), 'name' => 'main', 'db' => 'sqlite', 'path' => 'libraries/main'];
  if (!in_array($c['main'], array_column($c['connections'], 'name'), true)) $c['main'] = $c['connections'][0]['name'];
  if ($c['key'] === '') { $c['key'] = bin2hex(random_bytes(12)); save_cfg($c); }
  return $c;
}
function save_cfg(array $c): bool { return @file_put_contents(SETTINGS, "<?php exit; ?>\n" . json_encode($c, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)) !== false; }
// the admin login: only a salted hash (PBKDF2-SHA256, the same as the Node server makes)
function make_login(string $user, string $password): array { $salt = bin2hex(random_bytes(16)); return ['user' => $user, 'salt' => $salt, 'rounds' => 100000, 'hash' => hash_pbkdf2('sha256', $password, $salt, 100000, 64)]; }
function check_login(?array $a, string $user, string $password): bool {
  if (!$a || strtolower($user) !== strtolower((string) $a['user'])) return false;
  return hash_equals((string) $a['hash'], hash_pbkdf2('sha256', $password, (string) $a['salt'], (int) ($a['rounds'] ?? 100000), 64));
}
function out(int $code, $data, string $type = 'application/json; charset=utf-8', array $extra = []): void {
  http_response_code($code);
  header('Content-Type: ' . $type); header('Access-Control-Allow-Origin: *'); header('Access-Control-Allow-Headers: *');
  header('Access-Control-Allow-Methods: GET,POST,PATCH,PUT,DELETE,OPTIONS'); header('Access-Control-Allow-Private-Network: true');
  foreach ($extra as $k => $v) header("$k: $v");
  echo is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit;
}
function fail(int $code, string $msg): void { out($code, ['error' => $msg]); }
function uid(): string { return 'c' . base_convert((string) floor(microtime(true) * 1000), 10, 36) . bin2hex(random_bytes(3)); }
function slug(string $s): string { $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s; $s = trim(preg_replace('/[^\w\- ]+/', '', $s)); return preg_replace('/\s+/', '_', $s) ?: 'item'; }
function ext_of(string $n): string { return preg_match('/\.([a-z0-9]+)$/i', $n, $m) ? strtolower($m[1]) : 'png'; }
function now(): string { return gmdate('Y-m-d\TH:i:s.v\Z'); }

// ------------------------------------------------------------------ a library: database (SQLite or MySQL/MariaDB) + its pictures
class Library {
  public string $name; public PDO $db; public string $files; public bool $mysql;
  public string $where = '';
  // $c: a connection from the settings (problems are thrown, so the setup page's Test can show them)
  function __construct(string $name, array $c) {
    $this->name = $name; $db = $c['db'] ?? 'sqlite'; $this->mysql = $db === 'mysql';
    $abs = fn (string $p): string => preg_match('#^(/|[A-Za-z]:)#', $p) ? $p : __DIR__ . '/' . $p;
    if ($db === 'json') throw new RuntimeException('The PHP server keeps libraries in SQLite or MySQL/MariaDB (a JSON folder is for export and import).');
    if ($this->mysql) {
      $dbname = trim((string) ($c['database'] ?? '')) ?: 'clipart'; $host = trim((string) ($c['host'] ?? '')) ?: '127.0.0.1'; $port = (int) ($c['port'] ?? 3306) ?: 3306;
      // through the socket file the login is user@localhost (on a QNAP only root@localhost may do everything)
      $socket = trim((string) ($c['socket'] ?? ''));
      $dsn = $socket !== '' ? "mysql:unix_socket=$socket;dbname=$dbname;charset=utf8mb4" : "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
      $files = $abs(trim((string) ($c['files'] ?? '')) ?: "libraries/$name/files"); $this->where = $socket !== '' ? "$socket/$dbname" : "$host:$port/$dbname";
    } else {
      if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) throw new RuntimeException('This PHP has no SQLite (pdo_sqlite); use MySQL/MariaDB.');
      $dir = $abs(trim((string) ($c['path'] ?? '')) ?: "libraries/$name"); @mkdir($dir, 0775, true); $dsn = "sqlite:$dir/clipart.sqlite"; $files = "$dir/files"; $this->where = $dir;
    }
    $this->files = $files; @mkdir($this->files, 0775, true);
    if (!is_dir($this->files) || !is_writable($this->files)) throw new RuntimeException("The pictures folder {$this->files} cannot be made or written (the web server needs write access to the server folder).");
    $o = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
    $user = $this->mysql ? (string) ($c['user'] ?? '') : null; $pass = $this->mysql ? (string) ($c['password'] ?? '') : null;
    try { $this->db = new PDO($dsn, $user, $pass, $o); }
    catch (PDOException $e) {
      // the first time: MySQL/MariaDB has no such database yet (1049), so it is made, then opened
      $code = (int) ($e->errorInfo[1] ?? 0);
      if ($this->mysql && $code === 1044) throw new RuntimeException("This login may not use the database “{$dbname}” (it may not exist yet, and this login may not make it). Make it in phpMyAdmin and give this login all rights on it, or use a login that may create databases.");
      if ($this->mysql && $code === 1045) throw new RuntimeException('MySQL/MariaDB did not accept that user ID and password.');
      if ($this->mysql && $code === 2002) throw new RuntimeException($socket !== '' ? "There is no MariaDB socket at {$socket} (over SSH, ls /var/run/*.sock /tmp/*.sock shows where it is)." : "Nothing answered at {$this->where} (is the host and port right? the QNAP's MariaDB 10 is usually port 3307).");
      if (!$this->mysql || $code !== 1049) throw new RuntimeException('The library database could not be opened: ' . $e->getMessage());
      try {
        $server = new PDO(preg_replace('/dbname=[^;]*;?/i', '', $dsn), $user, $pass, $o);
        $server->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '``', $dbname) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $this->db = new PDO($dsn, $user, $pass, $o);
      } catch (Throwable $e2) { throw new RuntimeException("The database “{$dbname}” does not exist yet, and this login may not make it (" . $e2->getMessage() . '). Make it in phpMyAdmin, or use a login that may create databases.'); }
    }
    $big = $this->mysql ? 'MEDIUMTEXT' : 'TEXT';
    $this->db->exec("CREATE TABLE IF NOT EXISTS items (id VARCHAR(40) PRIMARY KEY, type VARCHAR(20), name VARCHAR(200) NOT NULL, original VARCHAR(200), seen VARCHAR(200), matched VARCHAR(200), category VARCHAR(200), style VARCHAR(40), form VARCHAR(40), tags $big, description $big,
      kind VARCHAR(20), width INTEGER, height INTEGER, frames INTEGER, colours INTEGER, source VARCHAR(500), author VARCHAR(200), licence VARCHAR(200),
      hash VARCHAR(64), added VARCHAR(40), changed VARCHAR(40), files $big)" . ($this->mysql ? ' CHARACTER SET utf8mb4' : ''));
    // columns added since the first version: an older database gets them now
    foreach (['type VARCHAR(20)', 'style VARCHAR(40)', 'form VARCHAR(40)', 'original VARCHAR(200)', 'seen VARCHAR(200)', 'matched VARCHAR(200)'] as $c) try { $this->db->exec("ALTER TABLE items ADD COLUMN $c"); } catch (Throwable $e) { /* has it */ }
  }
  private function q(string $sql, array $a = []): array { $s = $this->db->prepare($sql); $s->execute($a); return $s->fetchAll(); }
  private function row(?array $r): ?array { if (!$r) return null; $r['tags'] = array_values(array_filter(array_map('trim', explode(',', (string) $r['tags'])), 'strlen')); $r['files'] = json_decode($r['files'] ?: '{}', true) ?: []; foreach (['width', 'height', 'frames', 'colours'] as $k) if ($r[$k] !== null) $r[$k] = (int) $r[$k]; return $r; }
  private function nocase(): string { return $this->mysql ? '' : ' COLLATE NOCASE'; }
  function filter(string $text, ?string $cat, ?string $type = null): array {
    $w = []; $a = []; if ($type) { $w[] = "COALESCE(type, 'clipart') = ?"; $a[] = $type; } $all = $this->mysql ? "CONCAT_WS(' ', name, original, seen, matched, tags, category, style, form, description)" : "(COALESCE(name,'') || ' ' || COALESCE(original,'') || ' ' || COALESCE(seen,'') || ' ' || COALESCE(matched,'') || ' ' || COALESCE(tags,'') || ' ' || COALESCE(category,'') || ' ' || COALESCE(style,'') || ' ' || COALESCE(form,'') || ' ' || COALESCE(description,''))";
    foreach (preg_split('/\s+/', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY) as $word) { $w[] = "LOWER($all) LIKE ?"; $a[] = "%$word%"; }
    if ($cat !== null) { $w[] = "COALESCE(category, '') = ?"; $a[] = $cat; }
    return [$w ? 'WHERE ' . implode(' AND ', $w) : '', $a];
  }
  function list(string $text = '', ?string $cat = null, int $limit = 200, int $offset = 0, ?string $type = null): array {
    [$w, $a] = $this->filter($text, $cat, $type);
    return ['total' => (int) $this->q("SELECT COUNT(*) n FROM items $w", $a)[0]['n'], 'items' => array_map([$this, 'row'], $this->q("SELECT * FROM items $w ORDER BY name{$this->nocase()} LIMIT $limit OFFSET $offset", $a))];
  }
  function get(string $id): ?array { return $this->row($this->q('SELECT * FROM items WHERE id = ?', [$id])[0] ?? null); }
  function by_name(string $n): ?array { return $this->row($this->q("SELECT * FROM items WHERE name = ?{$this->nocase()}", [$n])[0] ?? null); }
  function categories(): array { return array_map(fn ($r) => ['category' => $r['category'], 'n' => (int) $r['n']], $this->q("SELECT COALESCE(category, '') category, COUNT(*) n FROM items GROUP BY COALESCE(category, '') ORDER BY category")); }
  // names stay unique: a name already used gets _002, _003… (the first one keeps its plain name)
  function unique_name(string $name, string $id): string {
    $name = trim($name) ?: 'Untitled'; $base = preg_replace('/_\d{3,}$/', '', $name);
    $taken = []; foreach ($this->q("SELECT id, name FROM items WHERE name = ?{$this->nocase()} OR name LIKE ? ESCAPE '!'", [$base, str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $base) . '!_%']) as $r) if ($r['id'] !== $id) $taken[mb_strtolower($r['name'])] = 1;
    if (!isset($taken[mb_strtolower($name)])) return $name;
    for ($n = 2; ; $n++) { $t = $base . '_' . str_pad((string) $n, 3, '0', STR_PAD_LEFT); if (!isset($taken[mb_strtolower($t)])) return $t; }
  }
  function read_file(array $it, string $k): ?string { $f = $it['files'][$k] ?? null; return $f && is_file($this->files . '/' . $f) ? file_get_contents($this->files . '/' . $f) : null; }
  // add or change an item: fields and/or pictures ['png' => bytes, 'pngExt' => 'png', …]
  function save(array $meta, array $pics = []): array {
    if (isset($meta['type']) && !in_array($meta['type'], TYPES, true)) fail(400, 'The type is ' . implode(' or ', TYPES) . '.');
    $old = !empty($meta['id']) ? $this->get($meta['id']) : null; $t = now();
    $it = $old ?: ['id' => $meta['id'] ?? uid(), 'type' => 'clipart', 'added' => $t, 'files' => []];
    foreach (COLS as $c) if (!in_array($c, ['id', 'files', 'added', 'changed'], true) && array_key_exists($c, $meta)) $it[$c] = $meta[$c];
    $it['changed'] = $t;
    if (!$old || (isset($meta['name']) && $meta['name'] !== $old['name'])) $it['name'] = $this->unique_name((string) ($meta['name'] ?? ($old['name'] ?? 'Untitled')), $it['id']);
    foreach (FILE_KINDS as $k) if (array_key_exists($k, $pics)) {
      if (!empty($it['files'][$k])) @unlink($this->files . '/' . $it['files'][$k]);
      if ($pics[$k] === null) { unset($it['files'][$k]); continue; }
      $it['files'][$k] = $it['id'] . ".$k." . preg_replace('/[^a-z0-9]/', '', strtolower($pics[$k . 'Ext'] ?? ($k === 'svg' ? 'svg' : 'png')));
      file_put_contents($this->files . '/' . $it['files'][$k], $pics[$k]);
    }
    $r = []; foreach (COLS as $c) $r[] = $c === 'tags' ? (is_array($it['tags'] ?? null) ? implode(', ', $it['tags']) : ($it['tags'] ?? '')) : ($c === 'files' ? json_encode((object) $it['files']) : ($it[$c] ?? null));
    $this->q(($this->mysql ? 'REPLACE' : 'INSERT OR REPLACE') . ' INTO items (' . implode(',', COLS) . ') VALUES (' . implode(',', array_fill(0, count(COLS), '?')) . ')', $r);
    return $this->get($it['id']);
  }
  function remove(string $id): bool { $it = $this->get($id); if (!$it) return false; foreach ($it['files'] as $f) @unlink($this->files . '/' . $f); $this->q('DELETE FROM items WHERE id = ?', [$id]); return true; }
}

// ------------------------------------------------------------------ http
$C = cfg();
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
// where this server lives: …/clipart-server.php/api/… (no rewriting), the folder (Apache with .htaccess), or PHP's
// own test server (php -S host:port clipart-server.php), where every request comes here
$self = '/' . basename(__FILE__); $script = $_SERVER['SCRIPT_NAME'] ?? '';
if (($i = strpos($uri, $self)) !== false) { $prefix = substr($uri, 0, $i + strlen($self)); $rest = substr($uri, $i + strlen($self)); }
elseif (substr($script, -strlen($self)) === $self) { $prefix = rtrim(str_replace('\\', '/', dirname($script)), '/'); $rest = substr($uri, strlen($prefix)); }
elseif (preg_match('#^(.*?)(/(?:api|clipart)(?:/.*)?|/setup/?)$#', $uri, $m)) { $prefix = $m[1]; $rest = $m[2]; }
else { $prefix = rtrim($uri, '/'); $rest = ''; }
$base = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $prefix;
$p = array_values(array_filter(array_map('rawurldecode', explode('/', $rest)), 'strlen'));
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET'; $Q = $_GET;
$local = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
$key = $_SERVER['HTTP_X_CRAFT_KEY'] ?? '';
// the admin's login, sent with each setup call as x-craft-login: base64("user:password")
$login_ok = (function () use ($C): bool { $t = base64_decode((string) ($_SERVER['HTTP_X_CRAFT_LOGIN'] ?? ''), true); if (!$t || ($i = strpos($t, ':')) === false) return false; return check_login($C['admin'], substr($t, 0, $i), substr($t, $i + 1)); })();
$may_write = $local || ($C['key'] !== '' && hash_equals((string) $C['key'], $key)) || $login_ok;

if ($method === 'OPTIONS') out(204, '');
// the libraries: one per connection, opened when first used (one that is down does not stop the others)
$conn_of = fn (?string $n): ?array => array_values(array_filter($C['connections'], fn ($c) => $c['name'] === ($n ?: $C['main'])))[0] ?? null;
$lib_of = function (?string $n) use ($conn_of, $C): Library { static $open = []; $c = $conn_of($n) ?? $conn_of($C['main']); if (!$c) fail(404, 'No such library.'); return $open[$c['name']] ??= new Library($c['name'], $c); };

// ------------------------------------------------------------------ the setup page and its calls
if (($p[0] ?? '') === 'setup' && count($p) === 1) { header('Cache-Control: no-cache'); out(200, (string) file_get_contents(__DIR__ . '/setup.html'), 'text/html; charset=utf-8'); }
if (($p[0] ?? '') === 'api' && ($p[1] ?? '') === 'setup') {
  @set_time_limit(0);
  $j = $method === 'GET' ? [] : (json_decode((string) file_get_contents('php://input'), true) ?: []);
  if (($p[2] ?? '') === 'admin' && $method === 'POST') {
    if ($C['admin'] && !$local && !$login_ok) fail(403, 'Log in first.');
    $user = trim((string) ($j['user'] ?? '')); if ($user === '' || strlen((string) ($j['password'] ?? '')) < 6) fail(400, 'Give a user ID and a password of at least 6 characters.');
    $C['admin'] = make_login($user, (string) $j['password']); if (!save_cfg($C)) fail(500, 'The settings could not be saved: the web server needs write access to the server folder (clipart-settings.php).');
    out(200, ['saved' => true, 'user' => $user]);
  }
  if (!$C['admin'] && !$local) out(200, ['needAdmin' => true, 'server' => 'php']);
  if (!$local && !$login_ok) out(403, ['error' => 'The user ID or password is not right.', 'login' => true]);
  $hide = fn (array $c): array => array_merge(array_diff_key($c, ['password' => 1]), ['hasPassword' => !empty($c['password'])]);
  if (!isset($p[2]) && $method === 'GET') out(200, ['server' => 'php', 'drivers' => array_values(array_filter(['sqlite', 'mysql'], fn ($d) => in_array($d, PDO::getAvailableDrivers(), true))), 'main' => $C['main'], 'admin' => $C['admin']['user'] ?? '', 'key' => $C['key'], 'connections' => array_map($hide, $C['connections']), 'file' => SETTINGS]);
  // a password left empty on the page means: keep the one saved for that connection
  $with_password = function (array $c) use ($C): array { if (!array_key_exists('password', $c)) { foreach ($C['connections'] as $o) if (($o['id'] ?? '') === ($c['id'] ?? '-')) $c['password'] = $o['password'] ?? ''; } unset($c['hasPassword']); return $c; };
  if (!isset($p[2]) && $method === 'PUT') {
    $list = []; $names = [];
    foreach (($j['connections'] ?? []) as $c) { $c = $with_password($c); $c['id'] = $c['id'] ?? cid(); $c['name'] = trim((string) ($c['name'] ?? ''));
      if (!preg_match('/^[\w\- ]{1,40}$/', $c['name'])) fail(400, "“{$c['name']}” cannot be a library name: use letters, numbers, spaces, - and _ (up to 40).");
      if (isset($names[strtolower($c['name'])])) fail(400, 'Two libraries have the same name.'); $names[strtolower($c['name'])] = 1; $list[] = $c; }
    if (!$list) fail(400, 'Keep at least one library.');
    $C['connections'] = $list; $C['main'] = in_array($j['main'] ?? '', array_column($list, 'name'), true) ? $j['main'] : $list[0]['name'];
    if (!save_cfg($C)) fail(500, 'The settings could not be saved: the web server needs write access to the server folder (clipart-settings.php).');
    out(200, ['saved' => true, 'restart' => false, 'main' => $C['main'], 'connections' => array_map($hide, $C['connections'])]);
  }
  if (($p[2] ?? '') === 'test' && $method === 'POST') {
    $c = $with_password((array) ($j['connection'] ?? []));
    try { $l = new Library((string) ($c['name'] ?? 'test'), $c); $r = $l->list('', null, 1, 0); out(200, ['ok' => true, 'items' => $r['total'], 'where' => $l->where, 'database' => $l->mysql ? 'mysql' : 'sqlite']); }
    catch (Throwable $e) { out(200, ['ok' => false, 'error' => $e->getMessage()]); }
  }
  if (($p[2] ?? '') === 'copy' && $method === 'POST') {
    if (($j['from'] ?? '') === ($j['to'] ?? '')) fail(400, 'Choose two different libraries.');
    foreach (['from', 'to'] as $w) if (!$conn_of((string) ($j[$w] ?? '')) || ($j[$w] ?? '') === '') fail(400, 'There is no library called “' . ($j[$w] ?? '') . '” (save the libraries first).');
    try { $from = $lib_of($j['from'] ?? null); $to = $lib_of($j['to'] ?? null); } catch (Throwable $e) { fail(500, $e->getMessage()); }
    $n = 0;
    try { for ($off = 0; ; $off += 200) { $r = $from->list('', null, 200, $off); if (!$r['items']) break;
      foreach ($r['items'] as $it) { $pics = []; foreach ($it['files'] as $k => $f) { $pics[$k] = $from->read_file($it, $k); $pics[$k . 'Ext'] = ext_of($f); } $meta = $it; unset($meta['files'], $meta['id']); $to->save($meta, $pics); $n++; } } }
    catch (Throwable $e) { fail(500, "Copying stopped after $n items: " . $e->getMessage()); }
    out(200, ['copied' => $n, 'from' => $from->name, 'to' => $to->name]);
  }
  fail(404, 'Not found.');
}

if ($method !== 'GET' && $method !== 'HEAD' && !$may_write) fail(403, 'Changing the library needs the key (on the server’s setup page).');
$shown = function (Library $lib, ?array $it) use ($base, $C) { if (!$it) return null; $L = $lib->name === $C['main'] ? '' : rawurlencode($lib->name) . '/'; $links = [];
  foreach ($it['files'] as $k => $f) $links[$k] = "$base/clipart/$L" . rawurlencode($it['name']) . ($k === 'png' || $k === 'svg' ? '' : ".$k") . '.' . ext_of($f);
  unset($it['files']); $it['links'] = (object) $links; $it['library'] = $lib->name; return $it; };
$body = fn () => file_get_contents('php://input');

try {
  // pictures: /clipart/[library/]Name.png | Name.svg | Name.thumb.png | Name.anim.gif
  if (($p[0] ?? '') === 'clipart' && count($p) >= 2) {
    $lib = count($p) > 2 ? $lib_of($p[1]) : $lib_of(null); $f = end($p);
    if (!preg_match('/^(.*?)(?:\.(thumb|anim|orig|model))?\.([a-z0-9]+)$/i', $f, $m)) fail(404, 'No such picture.');
    $it = $lib->by_name($m[1]) ?: $lib->get($m[1]); $k = $m[2] ?: (strtolower($m[3]) === 'svg' ? 'svg' : 'png');
    $b = $it ? ($lib->read_file($it, $k) ?? ($k === 'thumb' ? $lib->read_file($it, 'png') : null)) : null;
    if ($b === null) fail(404, 'No such picture.');
    out(200, $b, MIME[ext_of($it['files'][$k] ?? $it['files']['png'])] ?? 'application/octet-stream', ['Cache-Control' => 'no-cache']);
  }
  if (($p[0] ?? '') !== 'api') {
    if (!$p) out(200, "<!doctype html><meta charset=\"utf-8\"><title>Craft clip-art server</title><body style=\"font:16px system-ui;margin:2em;max-width:40em\"><h1>Craft clip-art server</h1><p>It is running. Open ClipArtCraft and connect to <b>" . htmlspecialchars($base) . "</b>, or see <a href=\"" . htmlspecialchars($prefix) . "/api/info\">api/info</a>.</p>", 'text/html; charset=utf-8');
    fail(404, 'Not found.');
  }
  $what = $p[1] ?? '';
  // where it can be reached from: the web server's own address (whoever can open this site can use it)
  if ($what === 'info') out(200, ['server' => 'Craft clip-art server (PHP)', 'version' => VERSION, 'api' => 1, 'writable' => $may_write, 'main' => $C['main'], 'libraries' => array_map(fn ($c) => ['name' => $c['name'], 'database' => $c['db'] ?? 'sqlite'], $C['connections']),
    'reach' => ['kind' => 'php', 'host' => gethostname() ?: '', 'shared' => true, 'here' => $base, 'addresses' => array_values(array_unique(array_filter([$base, !empty($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] !== '127.0.0.1' && $_SERVER['SERVER_ADDR'] !== '::1' ? preg_replace('#//[^/:]+#', '//' . (str_contains($_SERVER['SERVER_ADDR'], ':') ? '[' . $_SERVER['SERVER_ADDR'] . ']' : $_SERVER['SERVER_ADDR']), $base, 1) : ''])))]]);
  $lib = $lib_of($Q['library'] ?? null);
  if ($what === 'categories') out(200, $lib->categories());
  if ($what === 'export.zip' || ($what === 'import' && $method === 'POST')) {
    if (!class_exists('ZipArchive')) fail(501, 'This PHP has no ZIP support (the zip extension); export and import need it.');
    $tmp = tempnam(sys_get_temp_dir(), 'cz');
    if ($what === 'export.zip') {
      $z = new ZipArchive(); $z->open($tmp, ZipArchive::OVERWRITE); $list = []; $used = [];
      for ($off = 0; ; $off += 500) { $r = $lib->list($Q['q'] ?? '', $Q['category'] ?? null, 500, $off, $Q['type'] ?? null); if (!$r['items']) break;
        foreach ($r['items'] as $it) { $b0 = slug($it['name']); $b = $b0; $k = 2; while (isset($used[strtolower($b)])) $b = $b0 . '_' . $k++; $used[strtolower($b)] = 1;
          $e = $it; unset($e['files']); foreach ($it['files'] as $fk => $f) { $nm = $b . ($fk === 'png' || $fk === 'svg' ? '' : ".$fk") . '.' . ext_of($f); $bytes = $lib->read_file($it, $fk); if ($bytes !== null) { $z->addFromString($nm, $bytes); $e[$fk] = $nm; } }
          $list[] = $e; } }
      $z->addFromString('library.json', json_encode(['library' => $lib->name, 'made' => now(), 'by' => 'Craft clip-art server (PHP)', 'items' => $list], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)); $z->close();
      $data = file_get_contents($tmp); @unlink($tmp); out(200, $data, 'application/zip', ['Content-Disposition' => 'attachment; filename="' . slug($lib->name) . ' clip art.zip"']);
    }
    file_put_contents($tmp, $body()); $z = new ZipArchive(); if ($z->open($tmp) !== true) fail(400, 'Not a ZIP file.');
    $by = []; for ($i = 0; $i < $z->numFiles; $i++) { $n = $z->getNameIndex($i); if (substr($n, -1) !== '/') $by[basename($n)] = $i; }
    $items = isset($by['library.json']) ? (json_decode($z->getFromIndex($by['library.json']), true)['items'] ?? null) : null;
    if (!$items) { $items = []; foreach (array_keys($by) as $n) if (preg_match('/^(.*)\.(png|jpe?g|gif|webp|avif|bmp)$/i', $n, $m)) $items[] = ['name' => str_replace(['_', '-'], ' ', $m[1]), 'png' => $n, 'svg' => isset($by[$m[1] . '.svg']) ? $m[1] . '.svg' : null]; foreach (array_keys($by) as $n) if (preg_match('/^(.*)\.svg$/i', $n, $m) && !array_filter(array_keys($by), fn ($o) => $o !== $n && pathinfo($o, PATHINFO_FILENAME) === $m[1])) $items[] = ['name' => str_replace(['_', '-'], ' ', $m[1]), 'svg' => $n]; }
    $made = [];
    foreach ($items as $it) { $pics = []; foreach (FILE_KINDS as $k) if (!empty($it[$k]) && isset($by[$it[$k]])) { $pics[$k] = $z->getFromIndex($by[$it[$k]]); $pics[$k . 'Ext'] = ext_of($it[$k]); }
      if (!isset($pics['png']) && !isset($pics['svg']) && !isset($pics['anim']) && !isset($pics['model'])) continue;
      $meta = array_intersect_key($it, array_flip(array_diff(COLS, ['id', 'files']))); if (!empty($Q['category']) && empty($meta['category'])) $meta['category'] = $Q['category'];
      $made[] = $shown($lib, $lib->save($meta, $pics)); }
    $z->close(); @unlink($tmp); out(200, ['added' => count($made), 'items' => $made]);
  }
  if ($what === 'items') {
    $id = $p[2] ?? null;
    if (!$id && $method === 'GET') { $r = $lib->list($Q['q'] ?? '', $Q['category'] ?? null, min((int) ($Q['limit'] ?? 200) ?: 200, 5000), (int) ($Q['offset'] ?? 0), $Q['type'] ?? null); out(200, ['total' => $r['total'], 'items' => array_map(fn ($it) => $shown($lib, $it), $r['items'])]); }
    if ((!$id && $method === 'POST') || ($id && $method === 'PATCH')) {
      $j = json_decode($body() ?: '{}', true) ?: []; $pics = [];
      foreach (FILE_KINDS as $k) if (array_key_exists($k, $j)) { $pics[$k] = $j[$k] === null ? null : ($k === 'svg' && empty($j['svgBase64']) ? $j[$k] : base64_decode($j[$k])); $pics[$k . 'Ext'] = $j[$k . 'Ext'] ?? null; unset($j[$k]); }
      if ($id && !$lib->get($id)) fail(404, 'No such item.');
      $j['id'] = $id ?: ($j['id'] ?? null); out($id ? 200 : 201, $shown($lib, $lib->save($j, $pics)));
    }
    if ($id && isset($p[3]) && $method === 'PUT') { if (!$lib->get($id)) fail(404, 'No such item.'); out(200, $shown($lib, $lib->save(['id' => $id], [$p[3] => $body(), $p[3] . 'Ext' => $Q['ext'] ?? ($p[3] === 'svg' ? 'svg' : 'png')]))); }
    if ($id && $method === 'GET') { $it = $lib->get($id) ?: $lib->by_name($id); $it ? out(200, $shown($lib, $it)) : fail(404, 'No such item.'); }
    if ($id && $method === 'DELETE') $lib->remove($id) ? out(200, ['deleted' => $id]) : fail(404, 'No such item.');
  }
  fail(404, 'Not found.');
} catch (Throwable $e) { fail(500, $e->getMessage()); }
