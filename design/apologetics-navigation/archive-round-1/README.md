# Apologetics navigation concepts A–E and the B + E merge

Open http://localhost:8931/mockups/apologetics-navigation/.

Direct collection: http://localhost:8931/mockups/apologetics-navigation/#/apologetics/worldviews/islam.

The owner's request is to resolve the hierarchy mismatch between the Apologetics menu, multiple worldview collections, and Islam's deeper study material. This is a separate local navigation concept. The production pages and the previous Christianity & Islam concept remain unchanged.

## B + E merge — latest owner direction

Open http://localhost:8931/mockups/apologetics-navigation/?d=f. F is labelled B + E in the direction switcher; A–E remain available.

The owner prefers E's container and column browser, with B's main options always visible. The merge places all nine main section links and their expansion buttons across the top of E's bordered container. Section links open their pages; adjacent chevrons open the matching branch of the three-column browser. The main row remains visible when that browser is collapsed.

The redundant All worldviews toolbar shortcut and fallback context label are removed in F. The duplicated page's standalone back link is also hidden in F because Worldviews remains in the main navigation. The actual source pages and their navigation are unchanged.

The expansion control currently reads **Browse Apologetics**. This is an interim copy choice for the owner to review. The separate search control reads **Search Apologetics**. Other suggested expansion labels: Find your next study, Choose a starting point, Browse sections, and Open the study menu. These suggestions belong in the conversation/docs, not in an explanatory banner on the page.

merge-verification.json records 25 successful check groups covering all nine main links and branch expansions, four worldviews, preserved question selection, keyboard focus, separate search, and open/collapsed layouts at 1440, 1024, 768, 390 and 320 pixels. Complete collection/atlas checks and source fingerprints passed without browser errors. Desktop and mobile screenshots were visually reviewed. The F gallery card has light and dark images.

## Five directions

B was subsequently refined at the owner's request: its navigation and expanded mega-menu now share E's single bordered container. The entire collapsed context row — All worldviews / Choose a worldview and the repeated four-worldview list — is removed. The four collections remain accessible through the Worldviews expansion button.

The original direction is preserved as A. The floating A–E control sits outside the product shell and changes the navigation without changing the current page, selected question, reading selection or study data. The `d` query parameter appears before the hash route and persists in shareable links and reloads.

| Direction | Local link | Navigation pattern |
| --- | --- | --- |
| A · Two rows | http://localhost:8931/mockups/apologetics-navigation/?d=a | The original contained section/worldview rows and contextual Islam sidebar. |
| B · Mega-menu | http://localhost:8931/mockups/apologetics-navigation/?d=b | Section links with expandable menus; illustrated worldview choices; Islam destinations in a horizontal strip. |
| C · Library tree | http://localhost:8931/mockups/apologetics-navigation/?d=c | A persistent sidebar containing the full section, worldview and Islam study hierarchy; expandable on mobile. |
| D · Context bar | http://localhost:8931/mockups/apologetics-navigation/?d=d | Three selectors for section, collection and local study; popovers on desktop and inline disclosures on mobile. |
| E · Column browser | http://localhost:8931/mockups/apologetics-navigation/?d=e | Browse sections, worldviews and destinations in adjacent columns; open a destination to close the browser and read. |

All five use the same content and complete collections. The B and E menus begin open when directly loading the worldview index, so their navigation is immediately reviewable. They can be closed to read. Escape closes open menus; the B, D and E disclosures restore focus to their trigger. Each direction has a separate gallery card and light/dark thumbnails.

## Original A hierarchy

1. The first row retains all nine Apologetics sections: Explore, Questions, Reformed theology, Historic texts, Learning paths, Worldviews, Debates, Practice and My study.
2. The second row belongs to the selected section. Under Worldviews it shows All worldviews, Islam, Secular thought, Buddhism and Hinduism together. Those choices remain visible when visiting an individual collection.
3. Islam's five study destinations live in a contextual side menu: Overview, Understanding Islam, Ministry, Texts & studies, and Christianity & Islam. This menu collapses into an expandable section selector below 901 pixels. It does not occupy the row belonging to the peer worldviews.

Browse library opens a searchable native dialog. It offers the main destinations, all four worldviews, topic pages, learning paths, debate studies and individual studies. Ctrl/Cmd+K opens it, Escape closes it, and focus returns to its trigger. It is a destination search, not full-text source-document search.

## Content and implementation

The current source implementation and generated library data were inspected directly. The older content handbook still lists two worldviews, while the current data and page contain four; the concept uses the four current collections.

All existing Apologetics page components are reused through bundle-time adaptations. The complete Christianity & Islam collection retains its twelve-question desk, source reading, Muslim-world atlas and connected studies. The three other complete worldview collections also work. Understanding Islam and Ministry reuse the preceding local concept; their article content remains design-stage material, with readiness notes kept outside the visitor interface.

The local build replaces the Apologetics shell in memory, adds the guide routes and exports existing private components in memory. It does not edit the production components. Hash-based routes keep the entire navigation review at its localhost address without introducing production routes or redirects. Source fingerprints are recorded in source-baseline.json. The local study notebook uses bp-apologetics-menu-notebook-v1 to avoid modifying saved production study data.

No development banners, mockup status labels or explanatory implementation text belong in the rendered interface. Preserve the site's theme, typography, illustrations and reader-facing destination names.

From Website:

```powershell
node design/apologetics-navigation/build.mjs
node design/apologetics-navigation/verify.mjs
node design/apologetics-navigation/verify-variants.mjs
node design/apologetics-navigation/verify-merge.mjs
```

The build has content-hashed JS and CSS. It copies the inspected base stylesheet and fonts from the previous local concept's bundle. The concept is registered in design/catalog.json with light and dark gallery images.

## Verification

verification.json records the original 34 checks for A. variants-verification.json records 143 successful checks across A–E: all four worldview collections, all nine main sections, Islam study destinations, responsive layouts at 1440, 1024, 768, 390 and 320 pixels, mobile menus and navigation, search, keyboard focus, and preservation of the current page/question when switching variants. There were no browser page errors or document horizontal overflow. The current production files and previous Christianity & Islam concept matched their pre-build fingerprints. Desktop dark/light and mobile screenshots were visually reviewed. Screenshots should disable animations or load the desired theme before rendering to avoid capturing an unfinished theme transition.

The full site-wide gallery inventory has unrelated pre-existing unregistered folders; this concept is registered individually. This navigation concept is for review and does not establish approval of the larger content implementation plan.
