# Country-panel component mock-ups

Preview in the existing atlas: http://127.0.0.1:8931/apologetics/worldviews/islam?country=EGY&atlasDesign=a#muslim-world .

The A/B/C/D pill switches only the country-panel component beside the real globe on the existing Islam page. The page header, surrounding content, country selection and map stay in place. The component uses the real country facts and existing complete people-group loader. Ordinary URLs omit atlasDesign and use the current panel; these options await the owner's selection.

- A: compact boxed ledger.
- B: tinted engagement rows and coloured group-table rows.
- C: three compact status cards and card-like table rows.
- D: ring with a compact ledger and coloured engagement chips.

All four have smaller country facts beside “Search all 53 countries”, no region dropdown, coloured Lucide icon tabs and complete searchable tables. Search selects the actual country and updates the real globe. Switching preserves country, tab and map state without remounting the renderer.

Scrollbars are a pill-shaped thumb only, without a visible track, outside the scroll viewport on its right. PillScroll supplies native wheel/touch scrolling, a draggable thumb and keyboard controls. It is used for the people-group table and search results. Resizing/filtering updates the thumb; listeners and observers are disposed on unmount.

Transplantable files: src/components/apologetics/CountryPanelPrototype.tsx and country-panel-prototype.css. The component takes country/design/tab props and selection callbacks, reusing CountryPeopleGroups.tsx and PillScroll.tsx. MuslimWorldExplorer.tsx has a lazy preview branch enabled by atlasDesign=a|b|c|d. Adopting an option means fixing the chosen design and removing the toggle; no new page or data layer is needed.

Old /mockups/muslim-world-panels/?d=a bookmarks redirect to the real atlas. Earlier standalone HTML/JS/CSS assets remain as a superseded experiment and are not used by the active mock-up. Existing data, flag provenance and icon licensing apply.

Checked all four options at 1440, 768, 390 and 320 px: original globe/cached atlas retained, country selection, complete group rows, external thumb placement, hidden native scrollbars, wheel/keyboard controls and no overflow or browser errors. Regression: e2e/atlas-panel-prototype.spec.ts with e2e/atlas-panel-prototype.config.ts. No option is owner-approved or deployed.
