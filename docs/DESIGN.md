# Atlas interface — screenshot-led redesign

The user supplied Human Atlas as the visual reference. The interface uses a light gray full-screen stage, small upper-left identity, compact floating white Systems card, upper-right search and information buttons, a narrow vertical camera rail, and a centered bottom explode slider. Structure details and provenance open on demand. The worm is displayed vertically using a rigid rotation; the source mesh data remain unchanged.

The main slider uses a damped display amount. 0% is the source assembly; 45% opens source-derived display systems; 100% uses a nonoverlapping, common-scale shelf layout for each visible source object. Camera orientation blends toward a side view and supports panning at the inventory endpoint. Reset reverses the same path. Reduced-motion users receive immediate position changes. Display separation is explicitly labelled.

The portrait mobile layout starts with Systems collapsed, keeps camera and explode controls available, and uses temporary overlays for search and selection. Neural EM remains a separate dataset mode with provenance in a collapsed disclosure.

Visual critique: checked assembled, opened-system, and complete inventory views in the live browser. Fine source objects need higher contrast and screen-space markers at the full inventory scale; display colors and lighting were adjusted accordingly without changing geometry. The native browser screenshot is used for inspection because the emulated viewport screenshot API can return a scaled rendering.

## User correction: inspiration, not reproduction

The latest layout supersedes the standing-specimen design above. The whole-body viewer uses only a rigid Y rotation, keeping the worm's long axis horizontal. A full-width specimen stage replaces the portrait composition. System switches sit in a compact control bench below the model; camera actions form a labelled horizontal strip. The interface uses muted green accents rather than duplicating the reference's slate palette.

The first 45% of separation displaces systems only across the long axis (world Y/Z), preserving their longitudinal X positions. The remaining motion reaches the common-scale packed object inventory. No source vertices are changed. The mobile viewer also starts horizontal and retains orbit/zoom controls.
