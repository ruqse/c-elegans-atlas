# Accuracy and provenance

This application preserves the geometry in a specific historical export. It does **not** certify complete or 100% biologically accurate anatomy.

## Source and scope

The model is Virtual Worm February 2012, obtained from OpenWorm/wormbrowser commit `937839d19f505d0dff9aebb1e3bc69f7855942a8`.

- [Pinned model metadata](https://github.com/openworm/wormbrowser/blob/937839d19f505d0dff9aebb1e3bc69f7855942a8/org.openworm.wormbrowser/war/models/Virtual_Worm/Virtual_Worm_February_2012.js)
- [Virtual Worm project](https://caltech.wormbase.org/virtualworm/)
- Yook et al. *WormBase 2012: more genomes, more data, new website*. Nucleic Acids Research 40(D1):D735–D741. [doi:10.1093/nar/gkr954](https://doi.org/10.1093/nar/gkr954), [full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC3245152/).

The paper's “New graphics” section describes the model as an adult hermaphrodite and states it “was manually constructed using the open-source 3D graphics software, Blender”. This supports treating it as a reference reconstruction, not a direct scan of one specimen. Object counts reported for the paper's model are not substituted for counts in this export.

## What the conversion verifies

All quantities below are extracted from the pinned model files and the generated `inventory.tsv` and `manifest.json`; they refer only to this export.

| Quantity | Count |
|---|---:|
| Named source objects | 692 |
| Exported mesh segments | 713 |
| Triangles | 3,200,748 |
| Referenced vertices after per-segment remapping | 1,618,311 |
| Neuron-named objects in source neuron material groups | 301 |

The independent converter is compared with the original browser decoder. For every triangle corner, the decoded position and normal must be exactly equal as Float32 values and occur in the same order. Tests also check source checksums, unique names, valid indices, finite coordinates, bounds, gzip roundtrip and output checksum. This is a **software data-preservation check**, not a biological validation.

The source export already uses quantized coordinates. We do not undo that quantization or claim original Blender precision. We do not decimate, smooth, deform, mirror, or infer anatomical geometry. A rigid rotation and translation frame the model in the viewer. Separated-system mode adds explicitly labelled display offsets, and cutaway mode clips surfaces without reconstructing interior sections.

## Known gaps and ambiguities

- AIZR is listed in the [WormAtlas individual-neuron table](https://www.wormatlas.org/neurons/Individual%20Neurons/neuronsmainframe.htm), whose row labels it “Anterior Interneuron Z Right”. No `aizr` object exists in this pinned export. No replacement geometry is supplied. This is a demonstrated gap; it is not a claim that every other anatomical structure is complete.
- Source names and shapes have not been independently checked against microscopy or a current anatomy ontology. A named object may contain several pieces or represent tissue rather than one cell. Do not interpret inventory totals as biological cell counts.
- The source material groups contain historical functional classifications. These are disclosed in metadata and are not endorsed as current neuron-function assignments.
- XXX objects are placed in “Other cells” rather than inheriting the legacy `socketcell` display category. The source material remains recorded. The `anus` object is labelled as an anus object while disclosing its legacy pharyngeal-epithelium material.
- Uterine/vulval muscle objects are available in both muscular and reproductive layers. Pharyngeal and alimentary muscle objects are available in both muscular and alimentary layers. The display uses the highest opacity of their active memberships. Layer counts overlap.
- No male, larval, developmental, synaptic-connectivity, functional simulation or gene-expression dataset is included. There is no claim of a physical coordinate scale or of validated tissue volumes.
- Colors are display choices, not tissue colors. Transparency and open clipped surfaces can obscure depth relationships. Use isolation and camera rotation to inspect a selected object.

## Reuse and attribution

Virtual Worm was built by Chris Grove for WormBase at Caltech. The Virtual Worm project page states that dissemination with attribution is permitted under the MIT license. The OpenWorm export carries its own MIT notice, retained in `data/source/LICENSE` and `public/atlas/LICENSE-OpenWorm.txt`.

The interaction concept is inspired by [Human Atlas](https://github.com/ashemag/human-atlas). This application uses newly written React/Three.js viewer code and contains no human anatomical data.

Before using this as a research measurement tool or claiming a complete anatomical atlas, a worm-anatomy expert would need to review source identity, coverage, geometry and coordinate calibration against appropriate primary data.

## Update: separate neural datasets and display arrangements (2026-09-05)

The limitations above describe the Virtual Worm whole-body export. This application now additionally archives NeuroSC L1 (0 h label) and Adult (45 h label) meshes, attributed by NeuroSC to Witvliet et al. (2021), and displays them in a separate dataset view. These meshes are not registered to this whole-body model. Source study and platform dates are shown separately. See ../neurosc/README.md and ../neurosc/catalog.json. The 2012 source anatomy and its missing AIZR object remain unchanged.

Separate systems, Align all visible structures, and Align comparison are display-only translations. They do not alter mesh vertices, rotate individual structures into invented biological orientations, normalize individual sizes, or claim anatomical registration. Shared objects remain single source objects. Reassemble restores source positions. A source object may be a cell, tissue, fused structure or fragment, so the packed inventory must not be interpreted as an organ count.

New WormAtlas reference notes are scoped to tissue or neuron class, not presented as independent confirmation of the selected mesh. Source references and quoted evidence for these notes are recorded in src/references.tsx. WormFindr is a candidate noted from the WormAtlas March 2026 announcement; no WormFindr geometry is imported here.
