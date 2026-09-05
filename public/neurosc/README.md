# NeuroSC source snapshot — 5 September 2026

The catalog archives the full `/neurons` endpoint result for two NeuroSC timepoints: L1 (0 h label) and Adult (45 h label). Both are mapped by the source platform to Witvliet et al. (2021). The 2025 date belongs to the NeuroSC platform paper, not a new EM acquisition.

- NeuroSC: https://neurosc.net/
- Koonce, Emerson et al. (2025): https://doi.org/10.7554/eLife.103977.3
- Witvliet et al. (2021): https://doi.org/10.1038/s41586-021-03778-8
- Dataset-to-study mapping in the source application: https://github.com/colonramoslab/NeuroSCAN/blob/main/frontend/src/utilities/constants.js

`catalog.json` records original API identifiers, filename, URL, SHA-256 and byte count for every file. `0/source-api.json` and `45/source-api.json` preserve API response snapshots. Files are unmodified Draco-compressed glTF downloads with embedded buffers. `validation.json` records decoder checks. Object and triangle counts describe this snapshot only.

The viewer renders at most 12 selected objects at once to bound GPU memory. All archived objects remain searchable and downloadable. Dataset geometry is regional and is not a complete reconstruction of every neuron. The original paper describes removal of CAN from early-stage datasets for comparisons. Do not infer biological absence from a missing catalog object.

The datasets represent separate specimens. No registration to Virtual Worm or between timepoints has been performed here. One shared rendering scale is applied per scene, never a per-object normalization. Alignment translates objects only. No biological size measurements are asserted.

## Attribution and rights

Credit the NeuroSC authors and the original EM study when using these data. The NeuroSC application code is MIT-licensed (Bilte Co, 2025); that software license is not asserted to be the license for every hosted mesh. The platform paper is CC BY. Refer to the original sources for data reuse terms. This local snapshot preserves provenance rather than assigning a new data license.

The Draco decoder is distributed with Three.js and is licensed under Apache 2.0 by the Draco authors; see ../draco/LICENSE.
