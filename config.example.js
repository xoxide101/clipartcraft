/* ClipArtCraft: your own settings (an example). Server › Connect… › Save my places to a file makes a real config.js;
   put it beside index.html. A browser that has no places yet starts with these, so a new browser needs no setting up.
   Keys: only in a copy on your own computer (on a website anyone can read this file). config.js is git-ignored. */
window.CLIPARTCRAFT_CONFIG = {
  auto: true, // when ClipArtCraft opens, use the first place that answers (top to bottom)
  places: [
    { name: 'Home', url: 'http://192.168.1.20:3370' },
    { name: 'Internet', url: 'https://www.example.com/craft/clipartcraft/server/clipart-server.php' },
  ],
};
