<?php
// Copy this to clipart-config.php (it is not shared in git) and fill it in.
return [
  // Changing the library from another computer needs this key (the apps ask for it once). Make up a long one.
  'key' => 'change-me-to-something-long',
  // One or more libraries. The first is the main one (its links are /clipart/Name.png; others /clipart/library/Name.png).
  'libraries' => [
    // SQLite: nothing to set up, one file.
    'main' => ['dsn' => 'sqlite:libraries/main/clipart.sqlite', 'files' => 'libraries/main/files'],
    // MySQL / MariaDB (e.g. the one on the same box as the web site). Make the database and a user for it first.
    // 'main' => ['dsn' => 'mysql:host=localhost;dbname=clipart;charset=utf8mb4', 'user' => 'clipart', 'password' => '...', 'files' => 'libraries/main/files'],
  ],
];
