# Source and arrangement update verification — 2026-09-05

## Delivered

- Separate NeuroSC neural EM view: complete archived `/neurons` catalogs for L1 (0 h label, 197 objects) and Adult (45 h label, 233 objects). These are source inventory counts. Source study: Witvliet et al. 2021; platform paper: Koonce, Emerson et al. 2025.
- All 430 glTF files are locally available and retain their downloaded bytes; catalog includes SHA-256, original URL and metadata. AIZR is present in both catalogs. The old whole-body gap is unchanged.
- Search/select/download each archived neural object; up to 12 objects displayed at once to bound GPU usage. Source arrangement and aligned comparison are independent of the whole-body model.
- Whole-body arrangement modes: source positions, separate systems, packed aligned inventory of visible objects, and selected-object comparison. Adjustable separation 0–100%; one-click reassembly.
- Reference context for AVA, pharynx, egg-laying and somatic gonad, with scoped WormAtlas citations and dates. WormFindr is disclosed as a candidate, not imported.

## Automated checks

- TypeScript strict check passed after the final UI changes.
- Production bundle built with `node scripts/build-static.cjs`; emitted JS syntax checked with `node --check`.
- Packed-layout tests passed using all 692 Virtual Worm source objects at three aspect ratios: unique nonoverlapping cells, unchanged dimensions, exact original positions at zero separation, input immutability, empty and selected subsets.
- Neural source snapshot checks passed for all 430 files: hash, byte length, source API inventory correspondence and self-contained buffers.
- All 430 meshes decoded successfully with the shipped Draco decoder. Every position was finite; every triangle index was valid. The decoder inventory is in `public/neurosc/validation.json`. These checks establish file integrity and renderability, not independently validated cell identity.
- All 430 final production copies were separately checked against catalog SHA-256.
- Original Virtual Worm assets were not modified. The previous original-decoder geometry validation remains applicable.

## Browser checks

- Adult AVAL/AVAR meshes render; adding AIZR and aligning displays three separate source objects.
- Switching to L1 preserves available selected IDs and renders L1 meshes with its own dataset label and archive count.
- Whole-body vm1l_ant and vm1r_ant can be added to comparison and aligned; the view reports two visible objects.
- Muscles preset and aligned inventory show 135 source objects; the complete arranged geometry stays clear of controls.
- Reassemble returns to source positions. Aligned views use pan/zoom, while assembled views allow orbit.
- Mobile breakpoint 390 × 844: body and neural pages both have document scrollWidth 390 (no horizontal overflow), and accessible selectors remain within the viewport.
- Temporary mobile viewport was reset after testing.

An early overlapping build corrupted an obsolete asset. Fixed by building in memory, naming output bundles by content hash and replacing HTML atomically. The final content-hashed bundle passes syntax checking and browser rendering. The earlier console errors refer only to the obsolete bundle.

## Scope

The 2012 whole-body model remains a historical reconstruction. New EM meshes are regional and belong to separate specimens. No cross-dataset registration, complete modern whole-body replacement, new synapse-edge dataset or 100% biological accuracy is claimed.
