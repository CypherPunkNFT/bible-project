# Apologetics navigation: compact worldview selectors A-D

Open http://localhost:8931/mockups/apologetics-navigation/?d=a#/apologetics/worldviews/islam (change `d` to b, c or d).

## Current direction

Round three retains A's compact subpage row. The prior split panels, extra worldview-tab row and expandable cards are superseded. The main nine options remain inside the shared outer container. No redundant heading, descriptions, breadcrumb, CTA or internal dividers were restored.

- **A / Fade in place.** Click Islam to crossfade its subpages and the worldview choices in the same slot. The container keeps its height. The active main section is a full-height solid yellow block.
- **B / Left icon rail.** Four simple line drawings form a discreet vertical rail to the left of the submenu and content. Selecting a worldview changes the same compact subpage row. Labels appear on hover or keyboard focus. The active main section has a yellow outline and amber fill.
- **C / Floating selector.** Click Islam to open a small anchored palette over the page, without moving content. Escape or clicking outside closes it. The active main section has an amber background, a yellow dot and a thick yellow underline.
- **D / Inline icon dock.** Four small worldview selectors sit beside the selected collection and subpage links in one row. The active main section is a solid yellow capsule.

The yellow treatment follows the current top-level route (Questions, Worldviews, etc.), independently of which disclosure is open. Opening another menu does not falsely mark it as the current page.

## Interaction and responsive behavior

Islam links: Overview, Understanding Islam, Ministry, Texts & studies, Christianity & Islam. Other collections link to their existing overview, claims, sources and studies. All destinations work inside the local HashRouter. The main Worldviews disclosure closes/reopens the submenu; Escape restores trigger focus. A/C first dismiss the worldview picker when it is open. Hidden fade layers are inert and excluded from accessibility navigation.

On narrow screens the subpage links scroll horizontally within one row. Keyboard focus scrolls a destination fully into view. B retains its left rail, D retains the inline icon group. Reduced-motion preferences disable the transitions. The floating A-D control preserves the current page and selected question.

## Source boundaries

Production Apologetics and the previous Christianity & Islam concept remain unchanged. `build.mjs` adapts them in memory and checks source hashes. The complete current Islam collection is reused: twelve questions, four reading stages, atlas and studies. The guide concept supplies the four other Islam destinations. This round changes navigation only.

Previous sources are kept in `archive-round-1/` and `archive-round-2/` as reference, not runnable previews. Older verifier scripts and round-two results are historical.

## Files and verification

- `worldview-menus.tsx`: compact selectors, SVG glyphs and common navigation.
- `variants.css`: selector layouts, transitions and four active-section treatments.
- `preview.tsx`: destination registry, search, routes and A-D control.
- `verify-submenus.mjs` / `verify.mjs`: current behavior checks and source hash verification.
- `verification-round3.json`: current results.
- `capture-submenus.mjs`: refreshes light/dark screenshots and gallery pictures.

Run from Website with localhost:8931 serving:

```sh
node design/apologetics-navigation/build.mjs
node design/apologetics-navigation/verify.mjs
node design/apologetics-navigation/capture-submenus.mjs
```

Checks cover all Islam destinations, all four worldview switches, current main/subpage highlights, same-height menus at 1440/1024/768/390/320px, zero page overflow, keyboard visibility, Escape and focus, fade/palette layout stability, outside dismissal, reduced motion, preserved question query and source hashes. Screenshots cover light/dark desktop, phone layouts and A/C open pickers.

The repository-wide gallery check previously reported unrelated unlisted `research-phase-2` and `review` folders. This task refreshes only the four navigation cards and their eight pictures.
