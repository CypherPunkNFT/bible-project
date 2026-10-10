# Apologetics navigation: worldview submenus A-D

Local entry: http://localhost:8931/mockups/apologetics-navigation/?d=a#/apologetics/worldviews/islam

This round supersedes the previous A-F set. The edited B is now A: all nine main sections remain visible within one shared outer container. The menu no longer includes the Across beliefs heading, Four starting points / One thoughtful conversation slogan, Explore worldviews link, breadcrumb, descriptions, or internal divider lines.

## Directions

- A, Replace in place: Islam and its five subpages form one row. Click Islam to replace those subpages with the four worldview choices; click it again to return without navigating.
- B, Side by side: all four worldview choices remain alongside the selected collection's collapsible subpages. On phones, the two groups stack.
- C, Worldview tabs: the four worldview links remain above a collapsible subpage row.
- D, Expandable cards: each worldview has a collection link and a separate disclosure. Expanding a card previews its subpages; following a link navigates. Entering a collection automatically expands its card.

Each URL uses `?d=a`, `?d=b`, `?d=c`, or `?d=d`. The floating A-D control preserves the current route and question. All variants open the Islam subpages by default when on an Islam route, including phones. The Worldviews disclosure can close the entire panel. Escape closes it and restores trigger focus.

## Content and scope

Islam links: Overview, Understanding Islam, Ministry, Texts & studies, Christianity & Islam. The first four reuse the separate guide concept; the last reuses the complete current Christianity & Islam collection, including its twelve questions, reading stages, atlas, and studies.

Other worldviews link to their existing collection overview, claims, sources, and studies. These are section anchors, not newly authored pages. Other main sections retain their destinations; this round explores only worldview submenu dynamics.

Production source and the prior Christianity & Islam concept are unchanged. `build.mjs` makes source adaptations in memory and records hashes in `source-baseline.json`. The previous navigation source is retained in `archive-round-1/` for reference; the archive is not a runnable deployment. Older `verify-variants.mjs` and related round-one scripts are historical, not current acceptance checks.

## Files and checks

- `preview.tsx`: shared registry, search, route adapter, direction switcher.
- `worldview-menus.tsx`: common main navigation and four submenu interactions.
- `variants.css`: current common container and A-D layouts.
- `build.mjs`: generates local `index.html` and bundled assets.
- `verify-submenus.mjs` (also `verify.mjs`): checks every Islam subpage, all worldview switches, collapse/reopen, Escape/focus, route retention, original content, no browser errors, and no horizontal overflow at 1440, 768, 390 and 320 pixels.
- `capture-submenus.mjs`: refreshes A-D desktop screenshots and light/dark gallery thumbnails.
- `verification-round2.json`: latest browser results.

Run from Website with the local preview server on port 8931:

```sh
node design/apologetics-navigation/build.mjs
node design/apologetics-navigation/verify.mjs
node design/apologetics-navigation/capture-submenus.mjs
node scripts/mockup-gallery.mjs --check
```

Validation note: the A-D browser checks pass and their eight gallery pictures were refreshed. The repository-wide gallery check currently reports two unrelated folders without catalog cards (`research-phase-2`, `review`); these were left outside this navigation change.
