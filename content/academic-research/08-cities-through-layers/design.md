# Cities through their layers — Section & evidence

Design and local implementation · 14 October 2026. The user's subsequent instruction authorizes integration into the existing local preview. No public deployment is authorized. The prototype below remains an isolated record of the design stage.

[Open the implemented local study](http://127.0.0.1:8931/study/cities-through-their-layers) · [Implementation and verification record](implementation.md)

[Open the working prototype](prototype.html) · [Research dossier](../08-cities-through-layers.json) · [Source snapshot](source-snapshot.json) · [Progress](progress.json)

## Scope and starting point

This is the design pass for the Cities study already developed in this conversation. It belongs to academic research item 08. It is **not** item 08, Freedom that serves, in the separate forty-study Scripture and Theology queue. That queue and its next-design position remain unchanged. The applicable study workflow, master list and progress record were inspected; the explicit present instruction authorizes this isolated design work. No new history category content folder or competing content draft is created.

The current content lives in `src/pages/study/history/evidence.ts`, `cities-research.ts`, `CitiesThroughLayersPage.tsx` and `CitiesEvidenceLab.tsx`, supplemented by the structured dossier and `docs/cities-expansion-research.md`. This academic study has no separate `content.md`, `passage-notes.md` or six-card draft in the forty-study workspace. Its existing passages, qualifications, access records and investigations serve those roles. Preserve them rather than inventing a six-card inventory.

The prototype copies the existing four cities, twelve horizons, finds, sources and investigations into `prototype-data.js`. `source-snapshot.json` records source hashes. The snapshot script transforms data only; it does not build the application. Existing routes, public assets, content files and the working preview are unchanged.

## The subject and the design decision

**Central question:** How do we move from a surviving deposit to a defensible account of a city's past?

**Most useful contrast:** A destruction deposit and a historical explanation are different kinds of knowledge. Lachish makes this particularly clear: the earlier and later crises are separated by rebuilding, while an earlier fortification dispute concerns a different problem again. Jericho separates a laboratory result from a calendar date; Jerusalem separates locations and periods; Corinth separates destruction from abandonment.

**Organizing idea: a section and an evidence desk.** Let readers retain the larger sequence while inspecting the observation, dating argument, limits and ordinary life of one selected horizon. Allow a second horizon to be placed alongside it when chronological distinction matters. Physical separation between illustrated blocks communicates different contexts; it never encodes elapsed time.

Three approaches considered:

| Approach | Explanatory value | Evidence fit | Complexity / decision |
| --- | --- | --- | --- |
| Shared chronological panorama | Strong for contemporaneity across cities | Jericho's prehistoric span overwhelms first-century changes; many ranges are broad or disputed | Requires scale changes and careful uncertainty data. Retain as a future supporting view, not the signature. |
| Excavation map with layered plans | Strong for space, changing footprint and sampling bias | We lack licensed, phase-specific measured plans for all four cities | Premature: a beautiful invented plan would imply evidence we do not hold. |
| Section & evidence desk | Strong for sequence, rebuilding and the difference between observation and interpretation | Works with the existing selected horizons and explicitly schematic illustration | Chosen. A bounded set of selections with a useful comparison; no camera navigation or hidden graph controls. |

## Reference inspection

All five requested routes rendered at the established port 8931. Screenshots are in `review/`; the capture report is [references.json](review/references.json). Source inspection included the named landing components, the current routing wrappers, manuscript drawing code, WorldviewCardArt/WideArtwork and WorldviewHeroArt, LettersBrowse and its data-driven routes, Preachers landing and its arc entry point, and Scholars Constellation and IdeaLineage. Relevant CSS was inspected for typography, spacing and responsive patterns.

- **Surviving witnesses:** the inspected object, interpretation and source occupy one coherent desk. Adopt their proximity, not its six-choice menu as a template.
- **Worldviews:** recognizable centerpiece forms sit within a consistent illustrative vocabulary. Adopt the scale and composition; no religious motifs, orbiting decoration or perpetual motion.
- **Letters:** the current route is LettersBrowse, with collections and ways into complete letters. Preserve paths to full biblical contexts; do not assume the old overview is its landing experience.
- **Preachers:** a mark stands for something defined, and the arc remains legible without opening every biography. A selected earth block likewise represents a named horizon, not an arbitrary decorative level.
- **Scholars:** the default is IdeaLineage, not LegacyConstellation. Its links have named meanings. Here, spatial and chronological relationships need equally explicit language. Do not copy its automatic scroll-to-detail on ordinary selection; this design keeps selection stationary.

## Page composition

1. **Short opening.** On desktop, title on the left and a two-line invitation on the right. No separate oversized hero illustration. The actual section is the main artwork and appears early, immediately after the city choices. Headline: “Cities through their layers.” Invitation: “A city is more than the moment it fell.”
2. **Section & evidence desk.** Four city choices span one rule. Below them, approximately 56% width belongs to the cutaway, 44% to the record. The selected date, observation, dating explanation, limit and sources are visible without expanding anything. Default: Lachish, Level III, because the later rebuilt town makes the opening contrast concrete.
3. **Comparison on demand.** A full-width foldout immediately below the desk aligns two horizon records. Lachish's default comparison is III against II. Each column retains its own date, excavated feature, association and sources. The label explicitly warns that side-by-side does not mean contemporary.
4. **An intimate finds tray.** One substantial material silhouette between the find selector and its evidence. A single-find context shows no redundant selector. Daily life and a complete-passage link sit immediately below. These are not detached cards.
5. **How the ground acquired its sequence.** The existing four-stage formation experiment follows the city investigation. Its late pit challenges the intuitive “lower means older” reading the reader has just used. Preserve the later-cut/fill distinction and the illustrative label. It is a short method interlude, not a second opening.
6. **Dates and arguments.** Keep the city's extended investigation. Jericho's actual dot-and-whisker measurements sit with its argument, not in a generic statistics section. Other cities use their documented relationships and qualitative process chains. Retain the four dating-method explanations, with the selected case's relevant method initially visible.
7. **Apply, then follow the scholarship.** Retain the burned-room exercise. Give the conclusion visual presence: “What survives — and what am I inferring?” Follow with a compact reading trail, access notes, unresolved research gaps and the onward link to the world of Jesus and the apostles.

The prototype demonstrates opening through finds, comparison and the full selected argument. It ends with an explicitly labeled continuation note rather than pretending that all later chapters have been implemented. The existing study remains the complete content source.

## Content-to-design map

| Existing material | Proposed home | Preservation requirement |
| --- | --- | --- |
| Opening, scope and caution about selected horizons | Opening + persistent section caption | Four cities, twelve selected horizons; not a complete occupation inventory. |
| FormationLab's four stages and relationship chain | Method interlude after the desk | Preserve floor, burning, late cut, fill and rebuilding; retain residual/intrusive distinction. |
| All city intros, three horizons each and excavation notes | Cutaway selection, record and excavation expansion | No horizon or excavation caveat dropped. Jerusalem uses separated-site language in every view. |
| Feature, dating, reconstruction and association fields | Observation/date/limit on desk; reconstruction overlay caption and full record | All four fields remain readable; proposed associations never become plain event labels. |
| Every find and its source/inference | Finds tray | Object/material illustrations are not facsimiles. Current catalogue links remain beside claims. |
| Daily-life paragraphs | Under the finds tray | Retain labor, storage, literacy, status, recycling and redevelopment alongside destruction. |
| Joshua 6; 2 Kings 18; Jeremiah 34; Mark 13; Acts 18 | Passage rail for applicable horizons | Link to full project Bible chapters and preserve existing contextual notes. No new quotation or rewritten Scripture. |
| Four extended city investigations | Selected record expansion; linked close examination below | Evidence, reasoning, limit and implication stay together. Important limits also remain on the unexpanded desk. |
| Jericho's six cereal determinations | Jericho dating close-up | Retain IDs, BP units, uncertainties and published source. Do not calculate a new BCE scale. |
| Four dating explanations | Method reading beside case investigations | Keep stratigraphy, pottery/coins, radiocarbon and inscriptions distinct. |
| Burned-room question and three responses | Application after the methods | No scoring, diagnostic profile or invented certainty measure. |
| ResearchTrail, nine works, perspectives and gaps | Reading trail + source directory | Preserve access depth; bibliographic leads are not described as full works read. |
| Historical source directory and onward route | Sources and conclusion | Keep claim-specific links, editorial placement rule and world-study navigation. |

## Signature visual: build specification

**Composition:** three exploded blocks form a single oblique cutaway, filling most of the left field. Each has a top surface, front face and darker right face. Structural silhouettes occupy the top of each block. The selected block has full contrast and a small upward displacement; other blocks remain recognizably present. No blur, glowing border or floating particles.

**Meaning of marks:** one block means one selected context from the current city. Vertical order is the study's younger-to-older ordering, not surveyed superposition. Numeric markers 1–3 connect the drawing to the three labeled buttons. Depth, thickness, wall size and gaps are invented illustration. Stipple means soil texture only; it is not a particle count. Dark hatch is illustrative, not a mapped ash extent. In Jerusalem, the visual must say that the contexts are from separate locations; never call it one excavated trench.

Jericho's “urban growth” is a broad multi-period overview that overlaps part of the destruction context's history; it is not a sealed stratum directly underneath it. Its caption explicitly says this. Dark faces are reserved for the selected contexts that discuss burning/destruction; the Roman colony at Corinth must not acquire an invented burn layer merely because it occupies the middle row.

**Lachish's visual identity:** thick earth faces, stone and mudbrick-like massing, an angled earthwork silhouette for the siege horizon. The block order, captions and records do the historical teaching. Neither the silhouettes nor the reconstruction envelope claim to reproduce an excavated plan. The contrast to explore is the Level III siege horizon versus the later Level II town, not an apparent measurement of destruction intensity.

**Other cities:** Jericho uses a tower form, fortification form and charred-material form; Jerusalem uses separated craft/residence/reuse motifs; Corinth uses civic platform, column and later building forms. No fabricated inscription, named priest's house, measured ramp or “Paul stood here” marker. Keep future higher-fidelity drawings behind an explicit dependency on licensed plans.

**Record hierarchy:** date → large horizon title → observation → dating → visible limit → source. This is the fundamental argument and must remain open. The expansion is for longer interpretation and excavation history, not for revealing the central caution.

## Art direction

The material language is an excavation notebook beside exposed earth: warm paper, graphite text, chalk-colored top surfaces, ochre and clay earth faces, restrained charcoal for the burned horizon. Specific prototype colors are documented in `prototype.css`; use equivalent project theme tokens at integration. Light palette: paper #f4f0e7, ink #292821, accent #885b25. Dark palette: paper #1b1d1b, ink #f0e8d8, accent #e1b77b. Category is never communicated by color alone.

Large serif headings establish the editorial voice; explanation stays in the sans-serif body font. The standalone prototype uses local system Georgia/Arial to remain offline and portable. Future integration uses the project's existing serif/sans tokens rather than introducing a font dependency. Body copy is 14–16px, sources 12px, desktop display title approximately 77px at wide size. Long prose is constrained to about 65–76 characters.

The object tray has a filled silhouette with edge detail and a restrained cast shadow, not a faint icon. The fragment is explicitly generic; no pseudo-writing appears. The serif headline is never styled as a biblical quotation. No raster assets or third-party artwork are required.

## Interaction and state contract

| Interaction | Before / selection / change | Stable elements | Return and access |
| --- | --- | --- | --- |
| City | Four visible labeled buttons; select a city to replace its three horizons and record | Workbench position and proportions; comparison/record open state | Native buttons, Enter/Space; selected button retains focus. No automatic scroll. |
| Horizon | Three block markers and three explicit buttons; select either a block or its button | Other horizons, site identity and sources' location | Buttons are the keyboard-equivalent path for pointer-selectable artwork. Number and label identify selection. |
| Find | Current find shown; only multiple-find contexts get selector controls | Horizon and surrounding evidence | Native buttons; exact evidence and limits replace together. |
| Reconstruction | Off initially; checkbox adds a dashed envelope | Surviving-context illustration and historical record | Toggle off; checkbox keyboard/touch works. Label says hypothetical, never “original city.” |
| Comparison | Collapsed, with named alternative horizon in the button | Current city and selected horizon | Down arrow opens; X closes. Closing returns focus to opener and scrolls only if opener is outside viewport. Escape closes. |
| Full record | Observation/date/limit already visible; down arrow opens longer argument and excavation history | Selection and page header | X in opener and explicit close at end. Bottom close returns to collapsed origin, avoiding a jump to unrelated following text. |
| External reading | Full source or project Bible chapter link | Relevant study state in query string | Browser Back restores city, layer, find, comparison, record and reconstruction flags. Source links open a separate tab; biblical links allow normal navigation. |

Prototype state keys: `city`, `layer`, `find`, `compare`, `record`, `restore`. No account, tracking, journal or stored personal data. Default reset is selecting a city; it selects that city's opening horizon and first find. Do not add a global reset button merely to increase controls. Query-state return is tested on reload; integration must also verify browser Back with the site's router.

## Desktop, laptop and phone

- Wide: 1360px maximum container, two-column opening and workbench, three compact horizon labels across the illustration's foot. No fixed-height biography region or internal vertical scroller.
- Laptop: retain illustration/record side by side; horizon labels stack to prevent dates becoming tiny. Comfortable record width takes priority over keeping labels in one row.
- Phone: compact two-row city selector; full-width cutaway; three horizontal label rows below; record follows in normal document flow. Comparison becomes two explicitly dated records stacked vertically. The finds tray retains a material image beside its heading and places prose below. No horizontal chart scrolling is required for the signature.
- Jericho's existing numeric close-up must retain its mobile-specific plot and exact-value controls; do not shrink a desktop chart to unreadable labels.
- No nested vertical scroll area. A selected city must not relocate a phone reader to the top. Important changes receive a concise live-region announcement; the entire record is not repeatedly announced.

## Motion and accessibility

Earth-block emphasis uses a 250–350ms opacity/position transition of only a few pixels. No repeating motion. Reduced motion makes changes immediate. Never animate the geometric shape into an invented intermediate archaeological state. At integration, preserve the actual header and standard route transitions; the prototype's simplified shell is contextual framing, not a replacement header.

For application integration, disclose comparison and record regions with a 240ms measured-height expansion and coordinated 160ms text fade; measure current content rather than reserve a maximum-height blank. On collapse, coordinate the return to the opener with the height reduction. Reduced motion uses an immediate disclosure and return. The isolated prototype verifies state/focus/return behavior but does not implement that application-level height choreography.

Controls use visible focus, semantic buttons and pressed/expanded states. All essential visual information is available as ordered horizon buttons plus textual records. Comparison never relies on red/green or differing opacity alone. Illustration is labeled as a schematic; explanatory data stays selectable HTML. Disclosure content is removed from keyboard navigation when closed. Keep tap controls at least 44px tall. Do not copy a reference's tiny secondary text into this study.

## Reuse and missing dependencies

Reuse existing city/layer IDs, `SourceLinks`, `Passages`, breadcrumb, route state and site typography. FormationLab, CityInvestigation and the verified cereal data remain valuable; reorganize them rather than replacing their research. Do not reuse Worldview motifs or transplant the manuscript desk layout wholesale. Read the current routed components before extracting any shared primitives.

Genuine missing dependencies: licensed measured plans for phase-accurate city views; publication-quality licensed object images; full Romano catalogue, Kenyon reports and Jerusalem supplementary models; independent modern Jericho recalibration. The proposed design does not require these to work and never fills the gaps with fabricated evidence. Josephus-specific content remains in Scholars only.

## Prototype boundaries and acceptance

The prototype is `prototype.html` with adjacent CSS, JS and a static data snapshot. Open directly from disk; no server, port, public directory or app route is needed. It demonstrates all four city and twelve horizon selections, evidence, find switching, hypothetical overlay, paired comparison, argument expansion, source links, passage links and light/dark appearance. Later full-page chapters are specified here but are not duplicated in the mockup.

Acceptance checks for this prototype:

1. Opening and signature form a continuous composition; no decorative hero pushes the real experience far down the page.
2. All twelve horizons show the matching original feature/date/association/source; one block alone is selected.
3. Lachish II versus III keeps dates and evidence separate. Jerusalem warns about different locations.
4. Single-find contexts have no single-option selector; multi-find contexts show every existing find.
5. Keyboard city/horizon selection retains focus and does not change document scroll unexpectedly.
6. Comparison and record close controls return to their opening when needed. Closed content cannot receive focus.
7. Reload preserves state, including the reconstruction flag.
8. At 320, 390, 1024 and 1440px, no page overflow; labels remain readable and no native control is clipped.
9. Light/dark and reduced/normal motion remain coherent, with no console errors.
10. Local artifact links resolve. Source URLs and biblical paths are copied from the existing study; no claim is made that every external source remains accessible.

Completed validation is recorded separately in [review/validation.json](review/validation.json), generated by `verify-prototype.mjs`. Screenshots require visual inspection in addition to test success. Screen-reader announcement quality, real-site integration, and all external-source availability remain separate verification tasks. This draft does not authorize integration or publication.

### Completed review

The prototype was rendered directly from its local file in headless Microsoft Edge. All four cities, twelve horizons, multiple-find selections, comparison, full-record expansion, bottom-close focus return, keyboard city/horizon focus, and query-state reload passed. Layout checks passed at 320, 390, 1024 and 1440px in both themes. Normal and reduced motion generated no runtime errors. Local artifact links were checked. Desktop opening, phone full page, paired comparison and dark-theme screenshots were visually inspected. Cutaway spacing and the non-sealed Jericho overview caveat were refined, then the suite was rerun successfully. See [desktop preview](review/prototype-desktop.png), [phone preview](review/prototype-390-light.png) and [comparison preview](review/prototype-comparison.png).
