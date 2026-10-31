# ClipArtCraft notes

- Started 2026-10-31 as the shared library for the Craft apps (the apps keep their own copies of code; the library data is what is shared).
- Works both ways: offline from disk (Chrome/Edge share browser storage between file:// pages) and hosted together on one site.
- Library format is the one ImageCraft's Split a sheet exports (library.json + PNG/SVG).
- ImageCraft's Split a sheet adds straight into the library (Add to the clip-art library, with a category).
- Montage Slicer (js/slicer.js, window.ClipArtSlicer): a copy of ImageCraft's splitSheet/sheetItem (Lab paper model from a 3% border ring, grow by gap/2, connected parts, reading order, exterior-only background removal, defringe) plus a Grid mode (rows × columns, inset per cell; each cell's picture found with one join-everything split and cut out). Click a box to leave it out. Settings except names and category are kept in localStorage.
- Next: an "Insert clip art…" picker for the other apps (each its own copy), tags and categories from Print Shop-style groups, maybe guess the grid size by itself.
