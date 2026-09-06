# C. elegans Atlas

[Explore the live atlas](https://c-elegans-atlas.vercel.app/)

Interactive 3D explorer with a **Whole body** view of the Virtual Worm February 2012 adult hermaphrodite reconstruction and a separate **Neural EM** view of archived NeuroSC meshes. The source descriptions and study attribution are recorded in the [whole-body provenance notes](public/atlas/accuracy-notes.md) and [neural source notes](public/neurosc/README.md).

Search source objects, control their visibility, rotate, pan, zoom, and compare display arrangements. **Light mode is the default** when no theme preference is saved; the sun/moon button switches themes and remembers the choice when browser storage is available.

**Move without rotating:** enable **Pan** in either viewer, then drag with the left mouse button or one finger. Turn **Pan** off to rotate again. With Pan off, Shift-drag or right-drag also pans. Scroll or pinch to zoom. Pan is automatic while whole-body separation is above 80% or Neural EM objects are aligned; return to a lower separation or **Source arrangement** to enable rotation again.

## Run locally

Install Node.js and npm, then run these commands from the repository root:

```sh
npm ci
node scripts/prepare-geometry.cjs
npm run dev
```

Open the URL printed by Vite, normally http://127.0.0.1:3017/. Use a browser with WebGL support.

The [geometry preparation script](scripts/prepare-geometry.cjs) reconstructs `public/atlas/geometry.bin` from the tracked gzip and verifies its byte length and SHA-256 against the [manifest](public/atlas/manifest.json). The uncompressed file is ignored by Git, so prepare it after a fresh clone for the fallback download and geometry tests.

## Build and serve

`dist/` is generated locally and is **not included in Git**. To create the static site using the same build command configured for Vercel:

```sh
npm run build:vercel
python3 -m http.server 3020 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:3020/. Serve the build over HTTP instead of opening `index.html` directly.

`build:vercel` prepares the geometry, runs TypeScript checks, and bundles the site with [the static builder](scripts/build-static.cjs). After geometry preparation, `npm run build` is an alternative that checks TypeScript and builds with Vite; `npm run preview` serves that output, normally on port 3017. The scripts are defined in [package.json](package.json).

The built site includes its geometry and Draco decoder for local viewing. Installing dependencies, updating source catalogs, and opening external source links require network access. Local viewing does not require API keys or a backend service.

## Controls

### Whole body

- **Systems:** toggle a display layer, or click its name to show that system. **All** restores the default layer opacities. **Display settings** reveals opacity and cutaway controls; cutaway is disabled while anatomy is separated.
- **Find a structure**, or `/`: search display names, original source names, source groups, and system names. Selecting a result opens the structure inspector.
- **Focus** frames the selected object. **Isolate** shows only that object; **Show context** restores the surrounding display.
- **Pan** switches ordinary dragging between translation and rotation. **Oblique**, **Side**, and **Reverse** choose camera views; **Fit anatomy** reframes the current arrangement.
- **Separate anatomy:** the slider starts at source positions at 0%, opens systems through 45%, then moves visible objects toward individual aligned positions at 100%. These are display translations, not anatomical coordinates. The [layout implementation](src/layout.ts) and [layout tests](scripts/layout.test.mjs) define and check this behavior.
- **Add to comparison**, then **Align comparison**, displays a packed arrangement of the chosen objects. At least two selections are required. The slider also works on this set.
- **Reset** returns to the oblique view and source positions, clears cutaway and isolation, and exits the comparison arrangement. It retains layer visibility, the selected object, the comparison list, and the Pan setting.
- **Source & credits** opens provenance, limitations, source links, and the source-inventory download. Original object names remain available under **Object details & sources** in the inspector.

The systems panel starts collapsed when the initial window width is 760 pixels or less. Open it with the layers button. Control behavior is implemented in [App.tsx](src/App.tsx) and [Scene.tsx](src/Scene.tsx).

### Neural EM

Choose a source dataset, search its archived object identifiers, and select up to 12 objects for display. Each listed object has a source-mesh download link. **Source arrangement** uses the dataset's stored arrangement; **Align objects** translates the selected objects into separate display positions. **Fit view** reframes them. **Pan** works in source arrangement and is automatic in aligned mode. See [NeuralAtlas.tsx](src/NeuralAtlas.tsx) and [NeuralScene.tsx](src/NeuralScene.tsx).

## Source inventory and limits

The following counts describe the files in this repository's snapshot, not biological cell totals:

| View / source label | Archived source objects | Evidence |
|---|---:|---|
| Whole body / Virtual Worm February 2012 | 692 | [Manifest](public/atlas/manifest.json), [source inventory](public/atlas/inventory.tsv) |
| Neural EM / L1, 0 h (NeuroSC label) | 197 | [Neural catalog](public/neurosc/catalog.json), `neurosc-0` dataset |
| Neural EM / Adult, 45 h (NeuroSC label) | 233 | [Neural catalog](public/neurosc/catalog.json), `neurosc-45` dataset |

The [whole-body manifest](public/atlas/manifest.json) records a compressed geometry size of **27,836,459 bytes** (27.8 MB) and an uncompressed size of **77,248,440 bytes** (77.2 MB), using decimal MB. These are whole-body geometry sizes, not the total site download or a GPU-memory estimate. The browser uses the gzip when `DecompressionStream` is available and otherwise requests the uncompressed file; see [Scene.tsx](src/Scene.tsx).

The [recorded whole-body validation](public/atlas/validation.json) reports exact agreement of every converted triangle corner's Float32 position and normal with the pinned browser decoder. This checks conversion fidelity; it does not establish biological accuracy or completeness. The source export's quantization and interpretation limits are described in the [accuracy notes](public/atlas/accuracy-notes.md).

No AIZR-named geometry occurs in the whole-body [manifest](public/atlas/manifest.json). AIZR is present in both archived neural datasets in the [neural catalog](public/neurosc/catalog.json). Those separate meshes do not repair or replace the whole-body export.

The [neural source notes](public/neurosc/README.md) attribute the archived regional meshes to Witvliet et al. (2021), distributed through NeuroSC, whose platform paper is dated 2025. Those notes describe the datasets as separate specimens and document that this application performs no registration between timepoints or to Virtual Worm. The catalog's stage and timepoint labels are retained as source metadata.

Colors, transparency, separation, and cutaway are display settings. The interface does not calculate biological size measurements or simulate neural activity. The class-level WormAtlas annotations in [references.tsx](src/references.tsx) provide linked context, not independent verification of a mesh's identity. WormFindr is mentioned there as a candidate source; its geometry is not included.

## Validate

After installing dependencies and preparing the geometry:

```sh
npm run check
npm test
```

The test suite covers:

- [Camera gestures](scripts/camera.test.mjs): mouse/touch panning without rotation, switching back to rotation, modifier/right-button panning, and wheel/pinch zoom.
- [Geometry conversion](scripts/geometry.test.mjs): source hashes, geometry checksums, gzip roundtrip, buffer validity, original-decoder comparison, and classification rules.
- [Display layouts](scripts/layout.test.mjs): packed positions, preserved dimensions, and restoration of source positions.
- [Neural files](scripts/neurosc.test.mjs): catalog correspondence, file hashes, embedded buffers, and Draco decoding. This test refreshes `public/neurosc/validation.json`.

The files in [docs/VERIFICATION.md](docs/VERIFICATION.md), [docs/UI-VERIFICATION.md](docs/UI-VERIFICATION.md), and [docs/UPDATE-VERIFICATION.md](docs/UPDATE-VERIFICATION.md) are dated records of earlier checks and layouts. They are not an automatic report for the current checkout. Those records do not certify physical touch hardware, low-memory mobile performance, or anatomical correctness.

## Regenerate source assets

The tracked [whole-body source snapshot](data/source/) contains the model metadata, encoded meshes, original decoder, and license. Its pinned upstream commit and file hashes are in [source-files.json](public/atlas/source-files.json). To regenerate the converted model and check it:

```sh
npm run data:build
npm test
```

To update the neural API catalogs and download missing meshes:

```sh
python3 scripts/import-neurosc.py
npm test
```

The [import script](scripts/import-neurosc.py) reuses mesh files already present locally; it does not force a fresh download of every existing mesh. Review the resulting catalog and validation changes before committing a source update.

## Deploy on Vercel

Import this repository with its root as the project directory. [vercel.json](vercel.json) configures `npm ci`, `npm run build:vercel`, and `dist/` as the output directory. No environment variables or server functions are configured. The build reconstructs and checks the uncompressed fallback before copying public assets into the output.

For a CLI deployment after signing in, run `npx vercel --prod` from the repository root. CLI upload exclusions are listed in [.vercelignore](.vercelignore); generated local files are excluded from Git by [.gitignore](.gitignore).

## Credits and reuse

Whole-body provenance credits Chris Grove, WormBase, and Caltech; see the [source notes](public/atlas/accuracy-notes.md). The OpenWorm export's MIT notice is retained in [LICENSE-OpenWorm.txt](public/atlas/LICENSE-OpenWorm.txt). The interface concept is credited to Human Atlas by ashemag in those notes.

Neural data attribution and reuse caveats are recorded in the [NeuroSC source notes](public/neurosc/README.md); the platform's software license is not asserted as a license for every hosted mesh. Third-party notices are retained in [public/atlas/](public/atlas/) and [public/draco/LICENSE](public/draco/LICENSE).
