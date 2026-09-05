# C. elegans Atlas

Interactive 3D anatomy explorer for the Virtual Worm adult hermaphrodite reference reconstruction.

Rotate and zoom, search named source structures, toggle eight display layers, adjust opacity, select/focus/isolate objects, separate systems for inspection, and clip the view. The evidence panel links each selected object to its source and describes known limitations.

**This is not certified as 100% biologically accurate or complete.** All geometry in the pinned browser export is preserved; the known missing AIZR object and source reconstruction limits are disclosed. See [accuracy notes](public/atlas/accuracy-notes.md).

## Open the ready-built atlas

The `dist/` folder is a standalone static website. No API keys or internet connection are needed to view the bundled model after downloading this project. External source links require internet access.

From this directory, run:

```sh
python3 -m http.server 3020 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:3020/ in a browser with WebGL support. Serve over HTTP; double-clicking `index.html` as a local file will block model fetches in many browsers.

## Develop and validate

Use a current Node.js LTS release.

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
```

To regenerate the model from the included source snapshot:

```sh
npm run data:build
npm test
```

The complete source snapshot is in `data/source/`; its commit and hashes are recorded in `public/atlas/source-files.json`. The model inventory is `public/atlas/inventory.tsv`. Geometry conversion checks preserve every source triangle and referenced Float32 position and normal. No additional mesh simplification is applied.

An alternative static bundler is available as `node scripts/build-static.cjs` (uses esbuild, installed with Vite). The shipped `dist/` was built with this route after local filesystem stalls affected Vite. See [verification record](docs/VERIFICATION.md) for completed checks and limitations.

The browser downloads roughly 27.8 MB of compressed geometry; the uncompressed geometry buffer is approximately 77.2 MB. These sizes are measured from this build's manifest. WebGL memory use is higher. Performance on low-memory mobile devices and physical multitouch hardware is not certified.

## Reading the controls

- **Sun/moon button** in the upper right: switch light/dark themes. The atlas remembers the choice locally; on first use it follows the system color preference.

- Systems: toggle a layer, or click its name to show only that system. **All** restores defaults. Display settings reveals opacity and cutaway controls.
- **Find a structure** (or `/`): search source names, display names, source groups or system names. Selecting a result opens a compact detail sheet.
- **Focus** frames a selected object. **Isolate** shows only that object.
- **Explode anatomy**: one continuous slider opens systems through 45%, then translates every visible object into its own aligned space at 100%. Intermediate locations are display arrangements, not anatomical coordinates.
- At full separation, drag to pan and scroll/pinch to zoom. Small markers and forgiving click targets help select fine structures. Relative sizes and mesh shapes are preserved.
- **Reset** reverses the animation to exact source positions and removes clipping/isolation/comparison mode; layer visibility is preserved.
- **Add to comparison**, then **Align comparison**, isolates a packed layout of the chosen objects. The main slider still works on this set.
- **Source & credits** opens dataset evidence, dates, known gaps, citations and download links.
- On smaller screens, the systems panel starts collapsed. Open it with the layers icon.

Names are preserved in the inspector. Underscores become spaces in display names, and neuron display names are uppercased. These presentation changes are not ontology mappings. No biological measurements, simulated activity, or unverified functional descriptions are generated.

## Credits

Virtual Worm: Chris Grove, WormBase, Caltech. Source browser export: OpenWorm, MIT license (included). Interface concept: Human Atlas by ashemag. Third-party software retains its own licenses; notices are in `public/atlas/`.

## Source and arrangement update — 2026-09-05

Use **Whole body → Explode anatomy** to open systems and align every visible source structure. The single slider runs from original positions (0%) to fully arranged (100%). To compare particular pieces, select each through search or the viewer, click **Add to comparison**, then **Align comparison**. **Reset** restores source positions. The layout changes translations only; shapes and relative sizes remain unchanged.

Use **Neural EM** for two additional source datasets: L1 (NeuroSC label 0 h) and Adult (45 h). There are 197 and 233 archived source objects respectively, as recorded in `public/neurosc/catalog.json`; these are dataset object counts, not claims about total biological cell counts. Select up to 12 at a time, search any archived source name, download the original glTF, and switch between source arrangement and aligned comparison.

These regional meshes come from the Witvliet et al. 2021 study through NeuroSC (platform paper 2025). They are separate specimen views, not registered replacements for the 2012 whole-body anatomy. The source snapshot includes AIZR in both neural catalogs; this does not fill the missing whole-body geometry. See `public/neurosc/README.md` for provenance and reuse notes.

The inspector now includes sourced WormAtlas context for AVA, pharyngeal, egg-laying and somatic-gonad structures. Each note names the reference and distinguishes page revision dates from the date consulted. WormFindr is listed as a 2026 candidate, not as imported data.

Refresh the archived neural data with `python3 scripts/import-neurosc.py`. Run `npm test` for source conversion, packed-layout and neural hash/decoder checks. Build with `node scripts/build-static.cjs`, then serve `dist/` over HTTP.

## Deploy on Vercel

The project root is this directory (`outputs/c-elegans-atlas` in the original workspace). It includes `vercel.json` with a static build configuration. Import this directory from a Git repository into Vercel, or run `npx vercel --prod` here after signing in.

The Vercel build runs `npm run build:vercel` and serves `dist/`. No API keys, environment variables, or server functions are required. The source upload excludes local build output, the conversion source snapshot, and the uncompressed geometry duplicate. The exact uncompressed fallback is reconstructed from the bundled gzip and SHA-256 checked before building; every geometry file remains available in the deployed site.

Local validation: `npm run build:vercel`. The Git repository tracks the compressed model and source inventory; `scripts/prepare-geometry.cjs` regenerates the ignored uncompressed file. The original conversion source files remain tracked for reproducibility.
