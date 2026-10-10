# Christianity and Islam — local architecture mockup

Open http://127.0.0.1:8931/mockups/christianity-islam/ on the existing Bible Project preview server.

This revision follows the owner's instruction to build the proposed hierarchy around the current interface. The running Worldviews and Islam pages were inspected in a browser alongside their source code and the supplied screenshots. Page READMEs were contextual references; the implementation and rendered pages determined what was reused. `current-audit.json` and `current-*.png` record that inspection.

## Reused implementation

- The actual `Layout` header, footer, theme switch, Archivo/Literata fonts and site palette.
- `WorldviewIndex`, including the existing Islam, secular, Buddhist and Hindu collections.
- `IslamHeroArt`, `CollectionArt`, `StudyArtwork` and `ClaimsDiagram`.
- `IslamClaimsDesk`, all twelve authored questions and the real `BasisReader` with selectable paired passages.
- `ReadingPlanRoom`, all four stages and ten authored reading entries.
- Seven existing `IllustratedStudy` cards and the reflection component.
- The real `MuslimWorldExplorer`, geographical data, country search, globe/flat projections, country panels and people-group filters.

`build.mjs` exports otherwise-private components in memory during the preview build. It does not edit production modules. The preview notebook uses `bp-islam-design-notebook-v1` so design interactions do not alter existing saved study notes. The normal theme preference is shared with the site.

## Proposed additions

The nine view keys are `hub`, `understanding`, `ministry`, `questions`, `reading`, `world`, `library`, `article`, and `worldviews`. Use `?view=<key>` on the mockup URL. Question, reading and country selections remain shareable query parameters.

The main hub has Understanding Islam and Ministering to Muslim Friends entrances. The renamed comparison sits under ministry and keeps the full question desk, reading plan and studies. The reading plan also has a direct entrance from the shared library. Understanding Islam has four interactive topic areas and connects to the working atlas. Library filters separate primary passages, existing studies and proposed article previews.

New descriptive articles are clearly labelled sample outlines. The source excerpt shown in the article template comes from the existing reading plan. These previews do not claim that the planned research articles have been authored or source-reviewed. Existing study links open the current site's real study pages; they leave the isolated mockup.

## Build and verification

From `Website/`, run `node design/christianity-islam/build.mjs`. The generated bundle and captured base stylesheet/font assets are served by the existing `/mockups/` middleware. The mockup stays out of the production app build. Bible passages, basis texts and atlas data load from the same local server.

Run `node design/christianity-islam/verify.mjs` for browser verification. It covers nine views at four viewport widths in both themes, the twelve-question inventory, a selected comparison and paired source expansion, all four reading stages and ten passages, contextual links, topic/article navigation and browser back. `verification.json` and `screenshots/` contain the results. `final-check.mjs` additionally verifies local redirects, copied CSS/fonts, country search, presence-card filtering, refresh persistence, both map projections, notebook isolation and library filters. `source-baseline.json` fingerprints the source modules reused by the build.

Browser checks passed with no page errors or failed HTTP responses. The repository-wide gallery inventory check still reports two unrelated existing unregistered folders, `research-phase-2` and `review`. This mockup is registered and has both gallery thumbnails; those other folders were not changed.

The earlier `http://localhost:8765/` link redirects here. The strategy's original five-view concept is preserved as `design-preview-v1.html`. The hosted Sites copy has not been updated; this revision is local only.
