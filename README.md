# C. elegans Atlas

[Explore the live atlas](https://c-elegans-atlas.vercel.app/)

Interactive 3D explorer with two views: **Whole body** using [Virtual Worm](public/atlas/accuracy-notes.md) and **Neural EM** using [archived NeuroSC meshes](public/neurosc/README.md). Search structures, toggle visibility, and compare objects.

## Controls

- Drag to rotate; enable **Pan** to move without rotating. Scroll or pinch to zoom.
- Search and select structures to inspect, focus, or isolate them.
- Use **Separate anatomy** or **Align objects** to spread objects apart for viewing.
- Pan is automatic in aligned views and above 80% whole-body separation; restore the source arrangement or lower separation to rotate again.

Separation and alignment change display positions. See the source notes below for dataset limitations.

## Run locally

Requires Node.js, npm, and a browser with WebGL support.

```sh
npm ci
node scripts/prepare-geometry.cjs
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:3017/).

## Build and check

After local setup:

```sh
npm run check
npm test
npm run build:vercel
```

The build produces `dist/`. Import the repository into Vercel using the included [configuration](vercel.json), or serve `dist/` with a static HTTP server.

## Sources and credits

- **Whole body:** Virtual Worm / OpenWorm; credits include Chris Grove, WormBase, and Caltech. [Provenance and limitations](public/atlas/accuracy-notes.md) · [MIT notice](public/atlas/LICENSE-OpenWorm.txt).
- **Neural EM:** meshes distributed through NeuroSC. [Dataset attribution, limitations, and reuse notes](public/neurosc/README.md).
- **Interface inspiration:** Human Atlas by ashemag, credited in the [source notes](public/atlas/accuracy-notes.md).
