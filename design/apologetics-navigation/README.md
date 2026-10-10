# Apologetics navigation: selected hierarchy, lower-row arrangements

Current baseline A: http://localhost:8931/mockups/apologetics-navigation/?d=a#/apologetics/worldviews/islam

## Round four: fixed decisions

The user chose round-three C's main section highlight and round-three D's horizontal icon dock. Their combination is now A. B-D vary only how the worldview icons and lower row are arranged.

All four use:

- The same yellow dot, tinted background and thick underline for the current main section.
- The same treatment for the current subpage, using the selected worldview's actual accent color.
- Identical top/lower row height: 56px normally, 54px on phones.
- No right arrows in lower navigation links, including other Apologetics sections.
- A mosque drawing with dome, crescent and two minarets for Islam; a three-orbit atom for secular thought; wheel and lotus for Buddhism and Hinduism.
- The same destinations, main menu disclosures, source components, and local URL routing.

## Lower-row arrangements

- **A / Inline dock:** the four icons, followed by the current worldview name and its page links. This is the new baseline.
- **B / Integrated name:** the current name sits inside its selected icon item, removing the separate title.
- **C / Compact cluster:** the four icons form a two-by-two group within the same row height, followed by the title and more widely spaced page links.
- **D / Labelled icons:** small permanent names below the icons identify all four worldviews; page links sit alongside.

Main selection styling is identical across the four directions. The A-D control preserves the current route and question.

## Behavior and content

Islam links: Overview, Understanding Islam, Ministry, Texts & studies, Christianity & Islam. Other worldview links reach their existing overview, claims, source texts and studies. At the worldviews index, all four collection names are shown with no implied selected collection.

The top row scrolls horizontally when necessary. On phones the entire lower row scrolls horizontally, keeping the matching row heights and allowing every destination to fit. Keyboard focus reveals the focused destination. Icon links have accessible names and native title hints; custom hover/focus labels appear when space allows. Escape closes the expanded main menu and returns focus to its disclosure.

The complete current Islam page is reused, including twelve questions, four reading stages, atlas and connected studies. Its production source is unchanged, as is the separate Christianity & Islam guide concept. The guide supplies the four additional Islam pages through the existing build adapter.

## Files and verification

- `worldview-menus.tsx`: navigation, mosque/atom/wheel/lotus SVG drawings, routes and focus handling.
- `variants.css`: shared selection rules and equal row heights; A-D arrangements.
- `preview.tsx`: shared registry, search, routes and direction control.
- `build.mjs`: in-memory adaptation of existing components and source hash verification.
- `verify-submenus.mjs` / `verify.mjs`: current verification entry points.
- `verification-round4.json`: passing results for all four directions.
- `capture-submenus.mjs`: light/dark desktop screenshots and eight gallery images.

Run from Website with localhost:8931 serving:

```sh
node design/apologetics-navigation/build.mjs
node design/apologetics-navigation/verify.mjs
node design/apologetics-navigation/capture-submenus.mjs
```

Verified equal heights and no page overflow at 1440, 1024, 768, 390 and 320 pixels; all Islam and worldview destinations; no lower-link arrows; matching selected styles and worldview-specific colors; original content; keyboard scrolling and Escape/focus; main route highlights; source hashes; no browser errors. Desktop light/dark and phone screenshots are in `screenshots/round4-*`.

Previous rounds remain in `archive-round-1/`, `archive-round-2/` and `archive-round-3/` as source references, not separate runnable previews. Earlier screenshots/results and verifier scripts are historical. The repository-wide gallery previously reported unrelated unlisted `research-phase-2` and `review` folders; this task updates only the navigation cards and pictures.

The selected item in the main Bible Project header now uses the same yellow dot, tint and underline as the Apologetics section selection, across A-D. The rule is scoped to the local design wrapper; the original shared Layout source is unchanged. Gallery pictures include this header treatment.

## Compact mosque comparison

Eight selectable mosque drawings: http://localhost:8931/mockups/apologetics-navigation/?d=a&icons=mosques#/apologetics/worldviews/islam . The cards show enlarged, 29px and 22px samples. Selecting a card updates the live menu and stores its number in the outer `m` query parameter; the chosen icon can also be viewed without the gallery by removing `icons=mosques`. `mosque-icons.tsx` owns the drawings and shared selection hook. A low dome is the compact default. All eight selections, desktop/phone fit, and zero browser errors were checked. The menu now has a one-pixel divider between its equal-height rows.

## Production migration (2026-10-10)

The approved A menu and final widened option-2 mosque were moved into real source components and built for http://localhost:8931/apologetics/worldviews/islam. Production entry points are `src/components/apologetics/ApologeticsNavigationHeader.tsx`, `WorldviewNavigation.tsx`, `MosqueIcon.tsx`, `navigation.css`, and `src/lib/apologetics-navigation.ts`. The main website selection is in `src/components/site-navigation.css`. Guide routes render `src/pages/IslamGuidePage.tsx`; the existing comparison remains `/apologetics/worldviews/islam`. The original notebook is retained, including its saved-study count. Build and application TypeScript checks pass, with targeted lint passing. The static concept bundles remain historical; their old source adapter assumes the former page layout.

Production navigation now animates the secondary row open/closed over 260ms and fades the worldview name between icon selections, keeping the icon strip in place. Destination links remain visible and their accent colors, selection tint and underline transition over 280ms. Shared destination links retain their elements while their URLs update to the selected collection. Reduced-motion preferences remove those animations. Collection headings share a consistent vertical start, including wrapped introductory labels on narrow phones. Hero artwork has no side divider or introductory horizontal rules; Secular, Buddhism and Hinduism use expanded SVG illustrations with surrounding reading and geometry motifs in `src/components/apologetics/WorldviewHeroArt.tsx`. Islam retains its existing illustration and study content.

Selected tabs in the website header and both Apologetics rows now use color, background tint and underline without the additional dot.

Moving from the worldview index to a collection now fades the four collection labels before their space closes and the icons group together. Returning to the index expands the spacing before fading the labels back in. The selected collection name has persistent left/right borders and an intrinsic width reserved for the widest of all four names, including on phones; only its text crossfades when switching collections. Reduced motion disables the staged transitions. The live check samples intermediate icon positions and label opacity and verifies the name width and both borders across all collections and viewport sizes. It also checks that shared destination links persist at full opacity while their accent color interpolates and the title fades.

`check-live-motion.mjs` verifies the real routes, matching row heights, aligned headings and no overflow at 1440, 1024, 768, 390 and 320px; intermediate opening height and submenu opacity; rapid icon switching; reduced motion; Escape/focus; the five Islam destinations; and the original questions and atlas. Results are in `live-motion-verification.json`, with `screenshots/live-*-motion.png` captures. Build, application TypeScript and targeted lint pass.

The Islam hero scroll now has consistent rolled ends and an exposed sheet; its quill and closed book have clearer structural details. Section 01 uses a wider overlap that fully contains its book, with supporting scroll, globe, quill and closed-book drawings. Country selection rotates the globe to the selected country's geographic centroid, decelerates over 850–1600ms, and stops there. This also applies to the initial Pakistan selection: the atlas opens with a centering turn rather than continuous unattended rotation. Selecting the same country after a manual turn also recenters it. Keyboard country selection prevents the Enter key from reopening the search. `check-art-globe.mjs` checks book clearance, initial centering and deceleration with no further idle rotation, country changes, repeated selection, rapid retargeting, reduced motion, view switching, responsive overflow and browser errors. Results are in `art-globe-verification.json`; light/dark captures are `screenshots/islam-*-redrawn-*.png`, with initial globe position in `screenshots/globe-initial-pakistan-centered.png`.
