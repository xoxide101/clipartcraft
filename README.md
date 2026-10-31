# ClipArtCraft

The shared clip-art library of the Craft apps. Add pictures and SVGs (or a library ZIP from ImageCraft's **Split a sheet**), name them, sort them into categories, tag them, find them, and export or back up the library. Every Craft app opened in the same browser reads the same library, so clip art added here can be inserted in PressCraft, LogoCraft, LabelCraft, ImageCraft and the rest.

Runs in the browser, offline, straight from the folder (open `index.html`); no install, no account, nothing uploaded.

## Use

- **Add pictures**: PNG, JPEG, GIF, WebP or SVG (drop them on the window too). A PNG and an SVG with the same name become one item with both.
- **Import a library**: a ZIP with `library.json` (from ImageCraft's Split a sheet, or exported here), or any ZIP of pictures.
- **Montage Slicer** (Home › Slice, or *Slice a montage* on the start screen): choose a sheet of clip art and it is cut into separate pictures. *Find the pictures* finds each one on a plain or old-paper background (parts closer than the join distance stay together; only the background outside each picture is taken away, with clean edges). *Grid* cuts rows × columns of equal cells for montages whose pictures touch, and can cut each picture out of its cell. Click a box to leave that picture out; type names in order and a category; each can also be traced to SVG. **Add to the library** and they are there, chosen, ready to tag.
- **Name, category, tags**: click an item; Ctrl-click or Shift-click several to give them a category or tags together; double-click to rename.
- **Find**: categories on the left, search by name, tag or category.
- **Export (ZIP)**: everything shown (all, or the category you are in) with `library.json`.
- **Library folder**: Save to the folder / Add from a folder: a backup, a copy to OneDrive or Google Drive, or a library shared with another computer.

## How the apps share it

- **In the browser**: IndexedDB database `craft-clipart` (version 1), stores `items` and `meta`. Chrome and Edge share it between pages opened from disk (any folder), and between apps hosted on one site.
- **On disk or in a ZIP**: `library.json` beside the pictures:

```json
{ "library": "Clip art", "made": "2026-10-31T…", "by": "ClipArtCraft",
  "items": [ { "name": "Red Barn", "category": "Americana", "tags": ["farm"], "width": 352, "height": 208, "png": "Red Barn.png", "svg": "Red Barn.svg" } ] }
```

An item in the browser store: `{ id, name, category, tags, width, height, added, source, png (Blob), svg (text), thumb (small PNG data URL) }`. Other apps keep their own copy of the reading code (`js/library.js`).

Firefox keeps each page opened from disk separate, so there the library is per app; use the folder or ZIPs to move it.

## Credits

SVG tracing uses RasterTrace by bradsec (MIT) with VTracer by VisionCortex (MIT), bundled in `lib/craft-rastertrace.js` to work offline. The slicer's finding and cutting is ClipArtCraft's own copy of ImageCraft's Split a sheet.
