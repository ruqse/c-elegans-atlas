# Verification record — 2026-09-05

## Data preservation

`node --test scripts/geometry.test.mjs` passed all four test groups. The preserved source export contains 692 named objects, 713 segments and 3,200,748 triangles. Every triangle corner's position and normal is exactly equal to the original decoder output. The detailed log is `geometry-tests.tap`; the public machine-readable record is `public/atlas/validation.json`.

These checks establish conversion fidelity only. They do not establish biological accuracy. Source gaps and interpretation limits are described in `public/atlas/accuracy-notes.md`.

## Build

TypeScript checking and the initial Vite production build passed. Subsequent compiler/development-server processes intermittently stalled in local filesystem reads. The final static application was successfully bundled with esbuild, using the equivalent command preserved in `scripts/build-static.cjs`, and served using Python's static HTTP server. The final CSS viewport correction was verified in the browser. No network runtime dependency is needed for the bundled application or geometry.

## Browser checks

Tested the production `dist/` website in the Codex in-app browser:

- Model geometry visibly rendered in assembled view.
- Exact source-name search `vm1l_ant` returned one result; inspector retained the source name and showed the Vulval muscles group.
- Isolate changed the visible inventory to one object and framed its geometry.
- AVAL search, neuron selection and isolation worked.
- Muscle-only preset displayed 135 source objects and disabled other layer sliders.
- Reproductive-only preset displayed 131 source objects.
- Cutaway accepted a depth of 50; reset cleared it to zero.
- Direct clicking on a visible reproductive mesh selected `gonadal_sheath_a1r`.
- The 390 × 844 viewport had document width 390 and scroll width 390, with a 390-pixel-wide specimen viewport; no horizontal overflow.

The earlier viewport issue, where the long index expanded the 3D canvas below the fold, was fixed by constraining the desktop grid row and allowing the index to scroll.

Physical touch hardware, browser engines other than the tested in-app browser, low-memory mobile performance, and expert anatomical correctness are not certified.
