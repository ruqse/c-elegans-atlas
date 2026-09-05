# Clean interface and continuous explosion — 2026-09-05

Implemented from the user's Human Atlas screenshot: light full-screen stage, floating system switches, search popover, selection-only detail sheet, vertical camera controls, bottom-center 0–100% explode slider, and source dialog. Neural datasets remain available through the compact dataset selector.

## Checks completed

- Production build: `node scripts/build-static.cjs` passed. Current immutable bundles: `atlas-3c7408f241d0.js` and `atlas-c71a5f3941bf.css`.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` passed.
- `node scripts/layout.test.mjs`: 3 tests passed. All 692 source bounding boxes receive distinct packed cells at multiple aspect ratios. Explosion retains box dimensions, has finite intermediate offsets and a continuous system-to-piece transition, ends at the packed offset, and returns exactly zero translation at the assembly endpoint.
- All 430 production neural glTF files match their catalog SHA-256 checksums after the build.
- Live browser: assembled model, 46% opened systems, 100% aligned inventory, reset, source search, AVAL selection/isolation, and clicking an exploded piece were checked. Full explosion from the opposite camera was checked after switching the camera blend to spherical interpolation.
- Live browser: Neural EM default adult AVAL/AVAR meshes render on the light stage. Source coverage disclosure remains available. No browser errors were reported in the final test tab.
- Responsive check: 390 × 844 viewport; body initially assembled, Systems collapsed, named search button available, slider and camera controls visible, document scroll width equals 390 pixels. Temporary viewport override reset after testing.

## Notes

Explosion is a display transformation, not a biological registration. Geometry buffers were not edited. Source-derived system membership uses the existing first membership for separation; shared membership counts remain overlapping. At full inventory scale, fine source objects can be very small; markers, forgiving pointer targets, zoom, search, and focus provide access without rescaling individual meshes.

Local dependency reads stalled during validation. Direct icon imports reduce unnecessary module reads; TypeScript's implicit type inclusion is limited to React. The static builder skips public files whose size and modification time show no update. The initial test-runner invocation failed when the esbuild service stopped; the direct test invocation and final typecheck passed. Final production neural asset checksums also passed.

Physical low-memory mobile hardware, touch gestures on physical devices, and external review of anatomical identities were not newly certified by this interface work.

## Horizontal workspace correction

The worm now starts horizontal using a rigid Y rotation. Systems open across the long body axis rather than spreading longitudinally. Source bounding-box tests were updated to the horizontal coordinate transform, and a fourth test confirms that the first 45% of separation leaves longitudinal positions unchanged. All four layout tests and the TypeScript check passed. Desktop and phone layouts were rechecked in the live browser, including the horizontal model and explosion endpoints.
