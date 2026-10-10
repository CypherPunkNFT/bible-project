# Eight country-panel component options

Preview: http://127.0.0.1:8931/apologetics/worldviews/islam?country=EGY&atlasDesign=a#muslim-world . The A-H review strip is above and outside the atlas; it never appears in a transplantable panel. These are options awaiting the owner's selection.

| Option | Design | Structure |
|---|---|---|
| A | Reading ledger | Larger flag left of the name; region under the name, population centred on the right, separately labelled proportional Muslim and Christian bars; a clean group ledger. |
| B | Editorial rows | Country identity and search with a metric ribbon; generous people-group rows with clear population and engagement. |
| C | Engagement chapters | Split country passport and preserved Gospel Presence cards; group lists organised into engagement chapters with accurate counts and population totals. |
| D | Open directory | Country banner and fact ledger; expandable group entries with source links and complete facts. |
| E | Group focus | Country identity and inline facts; selectable group index with a persistent detail panel. |
| F | Language index | Centred country identity; a group directory organised by language. |
| G | Comparison matrix | Country identity and facts separated by thin rules; groups compared across three engagement columns. |
| H | Field notes | Country identity with side rule; individual group fact sheets with population, language, religion and engagement. |

Each layout retains every recorded group and exact populations, language, religion and full engagement labels, plus count-bearing filters and search. Tables load only for the selected country and stay cached across layout changes. Native wheel/touch scrolling uses the shared external pill-only thumb. Theme colours come from src/index.css; surface/border/text use shared site tokens.

Components: CountryPanelPrototype.tsx, CountryPanelHeader.tsx, CountryPeopleGroups.tsx and their CSS; design metadata: src/lib/country-panel-designs.ts. MuslimWorldExplorer.tsx owns the external review controls and loads a prototype only for atlasDesign=a through h. Old mock-up bookmarks redirect to this existing page. No production deployment or owner acceptance.

## Eight theme-native panel options and corrected faith bars - 2026-10-09

The owner requested a full People Groups redesign, the site's own colours, four additional mock-ups, and a picker outside the mocked region. A-H now use shared theme tokens: history/terracotta, epistles/gold and poetry/teal on page/surface/surface-2 backgrounds with the site's line, ink and muted text. No bright custom orange/blue/green palette remains in the people-group views. The review picker is a separate sibling above #muslim-world, outside the country panel and atlas, with no overlay. All eight options preserve the real globe, selected country, tab, filters, cached geography and lazy country data.

The owner then specified Panel A: enlarged 80x60 flag left of the country name, region underneath, and population centred in the right column. Muslim and Christian identification each have their own labelled percentage and proportional bar; Egypt shows 95.2% and 4.8% respectively. The previous Muslim bar with a Christian-only caption is removed. All panel flags are larger. C's previously preferred Gospel Presence cards remain. Scroll thumbs remain pill-only, external on the right without a track. No demographics, IMB source records or globe styling changed.

## Adopted country panel: B header, C presence, B people groups - 2026-10-09

The owner selected B's top section, with Christian identification to the right of Muslim and the labels shortened to Muslim/Christian; C's Gospel Presence cards; and B's editorial People Groups rows. This combination is now the default on the actual Islam page without atlasDesign or a design picker. The larger flag, country search, theme-native colours, external pill-only scroll thumb, source links and complete lazy country tables remain.

Each Gospel Presence card is a keyboard-accessible button that opens People Groups filtered to its engagement category and focuses the People Groups tab. panel=groups and engagement=unengaged|engagedUnreached|noLongerUnreached preserve this view in shared links and refreshes; All groups removes the filter. Selecting countries retains the current tab/filter. The header shows Population, Muslim and Christian as three adjacent facts; Egypt is 109.3M, 95.2%, 4.8%. No demographic, IMB or globe-rendering change was made. The eight earlier options remain available only through explicit review links; they are not controls on the default page.
