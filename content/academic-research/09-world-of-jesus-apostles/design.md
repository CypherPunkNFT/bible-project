# The world of Jesus & the apostles — Across the threshold

Design proposal, 14 October 2026. **Isolated prototype; not approved for integration or publication.** The approved C study and B’s warm gold palette remain the starting point. No A/B comparison returns.

[Open the working prototype](prototype.html) · [Content preservation map](content-map.json) · [Verification receipt](review/verification.json) · [Progress](progress.json)

## Subject and organizing idea

**Central question:** How do ordinary situations change our reading of Jesus and the early assemblies—and how much of those situations can we actually recover?

The strongest contrast is between an immediately imaginable environment and the uneven evidence beneath it. A reconstructed house feels complete. Its surviving rooms do not identify every occupant. Paul describes unequal eating but supplies no floor plan. A civic inscription can illuminate a later setting without verifying an earlier speech.

The signature experience is **a sequence of illustrated thresholds with an evidence lens**. Enter a village, assembly, pilgrimage, port, household, street, civic gathering or voyage. The selected environment is large enough to recognize. Numbered anchors connect it to source questions. Fade its reconstructed surroundings; the source anchors and the limits of the argument stay visible. At Corinth, add a proposed division between rooms while the words describing unequal eating remain unchanged.

Seeing the boundary between the imagined environment and the source argument makes this study more than a tour of ancient scenery. The eight situations remain a teaching sequence across places and decades, never one continuous historical journey.

### Three approaches considered

| Approach | Explanatory value | Evidence fit and cost | Decision |
| --- | --- | --- | --- |
| A geographic atlas with travel connections | Makes regional distance and mobility tangible | Requires vetted coordinates, coastlines, dated administrative boundaries and separately attested itineraries. A single map easily conflates Paul, pilgrims and comparative wrecks. High pan/zoom and mobile cost. | Reserve for a future sourced transport study. |
| An archaeological object cabinet | Strong inspection of Pilate’s dedication, the Migdal stone and coins | Good for objects, weaker for labour, food, legal status and letters. Risks reducing the entire subject to surviving elite objects. Medium interaction cost. | Use its source discipline, not its organizing composition. |
| Illustrated thresholds with an evidence lens | Keeps ordinary situations and source limitations in the same view | Uses the eight existing scenes, 28 viewpoints and already qualified reconstructions. No invented statistics or historical geography required. Moderate complexity. | **Selected.** |

## Existing material inspected

This is academic study **09**, not one of the separate 40 Scripture-and-Theology drafts. There is no matching `content.md`, `working.md` or `passage-notes.md` in that queue. Equivalent working material is the original dossier, merger record, expanded research, scene data and investigation data:

- [Original dossier](../09-world-of-jesus-apostles.json), [earlier design record](../09-design.json), [consolidation](../09-consolidation.json), [expanded research](../09-expanded-research.json).
- `src/pages/study/world/{MergedWorldPage,WorldInvestigations,WorldDrawings,MergedDrawings}.tsx` and `world-data.ts`, `merged-data.ts`, `investigation-data.ts`.
- The current canonical page was rendered on 8931. It preserves substantial research, but the most revealing art and investigations follow several introductory blocks. Repeated scene selectors, viewpoint menus and stacked explanation make the experience feel more sectional than connected.

The general study workflow, master list and progress were inspected. Its next-design position remains 06. This explicit request authorizes only this academic design exception; it does not advance either queue globally.

### Reference inspection and lessons

All five requested routes were rendered in Edge on the existing preview, with opening and experience screenshots in [review/](review/references.json). Source and styling were inspected as recorded in [source inspection](review/source-inspection.json).

- **Surviving witnesses:** the object, viewpoint and record occupy one coherent desk. A mark in the leaf inventory has a defined unit. Adopt that accountability, not the manuscript layout or leaf counts.
- **Worldviews:** different silhouettes establish identity before prose. Its collection artwork uses distinct compositions. Adopt recognizable filled forms and consistent materials rather than copying religious motifs.
- **Letters:** the routed page renders `LettersBrowse`, with collections and thematic ways in. Do not design against the obsolete overview. Reuse its complete-context reading principle, not its collection grid.
- **Preachers:** a large typographic invitation and a compact arc disclose individual lives. Learn from its restrained initial selection; do not turn the eight situations into quantitative marks.
- **Scholars:** `Constellation` currently defaults to `IdeaLineage`; the older view is query-selected. Adopt the link between selected item, explanation and source. Do **not** copy its automatic centering on ordinary selection; this design keeps scroll position stable.

## Concrete page composition

1. **Short opening:** established fixed site header; academic breadcrumb; two-line title on the left and a concise invitation on the right. Gold italic title ending. No separate decorative hero that delays the experience.
2. **Journey early in the page:** eight numbered positions on one ruled horizontal strip, named by situations. A short caption explicitly denies geographic or chronological scale. A selected underline and filled wash identify the active scene. No arrows implying attested travel between all eight.
3. **Expansive scene and intimate evidence:** a 57:43 split. Left: reconstructed environment, show/hide control, numbered anchors, short question buttons and schematic caption. Right: source question, evidence, citations, full-context passage links, inference and visible limit. The date and place sit above both columns.
4. **Context-specific close examination:** immediately below the relevant scene, retain the complete Migdal, Corinth and Ephesus investigations and the village economy discussion. Use their distinct mechanisms rather than a universal accordion. The prototype demonstrates coin contexts, room/timing assumptions and dated civic comparison; full scholarship prose remains mapped for integration.
5. **Broader comparison:** regional government becomes a compact comparison after the first encounter, rather than a prerequisite lecture. Retain the chronological changes, claim exercises and scholarly development as deliberately varied supporting compositions.
6. **Onward reading:** source registers, explicit access notes and the question “Where, when—and whose experience?” lead back to History & archaeology and the complete Bible passages.

Prose measure: roughly 55–70 characters. Never stretch an evidence paragraph across the entire scene width. No reserve sized to the longest scene; the surrounding document grows naturally. Existing research qualifications are not replaced with the shorter prototype invitation.

## Content-to-design map

The preamble’s generic six-section model does not describe this page: its merged draft has **eight scenes and 28 viewpoints**, plus supporting investigations. All are accounted for. The machine-readable [content map](content-map.json) lists each exact viewpoint and retained fields.

| Existing material | Proposed home | Preservation requirements |
| --- | --- | --- |
| Opening and source-method orientation | Short title invitation; visible reconstruction control and evidence limit | Preserve distinction between evidence, reconstruction and interpretation; longer source-survival explanation follows the first scene. |
| Village: household, shore, bread/labour, toll | Courtyard-and-shore scene, anchors 1–4 | Retain all evidence, labour/status qualifications and Mark links. No identification of Peter’s house. |
| Village economy discussion | Unfolded supporting argument under village | Preserve Fiensy, Hakola and Myles distinctions; trade is not a prosperity measure; Myles 2019 is not a reply to Hakola 2023. |
| Migdal: phases, stone, regional reading | Benched assembly illustration, anchors 1–3 | Preserve separate sites, dating limits and uncertain stone function. No universal synagogue service. |
| Migdal close investigation and 2026 update | Find-context comparator below the scene | Preserve all three contexts, terminus-post-quem explanation, Theodotos comparison and qualified public-building identification. |
| Pilgrimage: Temple access, lodging, Samaria, purity/wealth | Institutional compound schematic, anchors 1–4 | Boundary is an inner precinct, not all Temple access. No geographically accurate road or surveyed bath. |
| Caesarea: dedication, hearing, guarded departure | Port scene with editorially labelled stone, anchors 1–3 | Keep Pilate, Felix and Festus chronologically distinct; reuse is not original display. No counterfeit inscription text. |
| Corinth gathering: report, reconstruction, instruction, craft/support | Cutaway gathering scene, anchors 1–4 | Keep enslaved status, women’s networks and uncertain meeting-place discussion. No guest count or recovered room plan. |
| Corinth close reading and scholarly disagreement | Unchanged WEB phrases beside optional room/timing assumptions | All four annotations, Horrell/Theissen/Meggitt argument and absent-voices discussion retained. Instructions do not prove obedience. |
| Corinth street: market, invitation, cult meal | Counter, doorway and shrine-context anchors | Keep distinctions within 1 Corinthians 8–10; Pompeii stays an explicitly Italian comparison. |
| Ephesus: house phases, craft, civic procedure | House/workshop/theatre relationship illustration | Keep later architectural phases and diversity of local interests. Not a mapped street. |
| Ephesus close comparison | Two dated accounts below scene | Acts’ 50s events versus 104 endowment; keep literary account distinct from prescription and later performance. |
| Sea: season, status, cargo/welcome, earlier wreck | Ship/cargo composition, anchors 1–4 | Retain Acts’ selected itinerary, overland Puteoli–Rome leg, ORBIS circa-200 limit and 75–60 BCE wine-wreck comparison. |
| Four regional governments | Side-by-side heading and one selected office record | All four offices, dates, limits and Scripture/source links retained; no invented border map. |
| Four chronological moments | Unscaled, clearly dated editorial sequence | Retain 29/30 coin, mid-century networks, 70 and later phases, circa-200 model; not a numerical duration chart. |
| Three claim exercises | Short concluding evidence exercise | Keep exact claims, explanations and retry behaviour. No score, ranking or collected answers. |
| Deeper reading, scholarly development, both registers | Reading section with accessible disclosures | Preserve every URL and reading-access qualification; distinguish catalogues/abstracts from full works. |
| Closing and category navigation | Quiet full-width conclusion | One canonical study only; existing alias redirects remain an implementation concern, unchanged in this task. |

## Signature visual specification

### Composition, scale and meaning

- Use a 640 × 410 SVG coordinate frame for the selected environment. It is an illustration coordinate system, never metres or a historical map projection.
- Filled forms supply mass: dark basalt-like domestic walls, pale roof and floor planes, warm wooden hulls, muted sea surfaces. Thin strokes clarify edges rather than doing all the illustrative work.
- Numbers correspond to the existing viewpoint order. A ring identifies the active source question; numbers do not count artifacts or people. A labelled native button beneath the illustration reaches each anchor. The SVG is an accessible image with instructions; marks are not additional keyboard stops or undisclosed controls.
- Source anchors stay fixed when the reconstructed setting fades. The caption changes to: **“Numbered anchors point to source questions, not to measured or surviving fabric.”** This is a rhetorical separation, not archaeological image segmentation.
- A dashed division at Corinth means **proposed room separation**. It does not become a solid wall after selection. Tableware and two silhouettes illustrate contrast, not membership, seating capacity or portion counts.
- The publication record—not the drawing—remains authoritative about actual materials, phases and objects. The prototype’s plain Pilate label is explicitly editorial; no fabricated Latin inscription or restored letterform is drawn.

### Artwork direction

The focal point is a doorway or gathering space through which the reader enters an ordinary situation. Village artwork has a substantial courtyard dwelling, working installations and a lakeshore boat; assembly artwork uses benches around a shared floor; a gathering uses a cutaway wall and a table; the port emphasizes custody alongside a commercial hull. A theatre in the Ephesus composition is a generic civic form, not a reconstruction of the recovered theatre in Paul’s decade.

Palette retains B: light gold `#795727`, dark gold `#cfad73`, muted blue-green `#44686b` / `#9ab9bb`. Stone, charcoal and parchment provide depth. Gold marks selection and editorial emphasis; blue-green is a surface accent, not a coded ethnic or religious group. Literata headings and actual Scripture; Archivo explanatory prose. Prototype loads the repository’s local font files, not a remote font service.

No human figure is assigned an identity, ethnicity, gender or legal status from appearance. No borrowed photos, manuscript writing, exact object replicas, religious ranking or statistical chart. Every drawing is original code-native schematic artwork.

## Interaction contract

| Interaction | Before / selectable | Change / stable meaning | Return and access |
| --- | --- | --- | --- |
| Enter a situation | Village selected; eight named positions visible | Selected scene, date, anchors and evidence change. Learning order and page shell stay stable. Per-scene viewpoint retained. | Another position or Next; native buttons on desktop, labelled native select on phone. No automatic scroll on ordinary selection. Next explicitly returns to the journey heading. |
| Select source question | First viewpoint open, others labelled beneath art | Active ring, source heading, explanation and citations change. Scene geometry and date stay fixed. | Choose another numbered question. Tab/Enter/Space; 44px minimum control height. Focus remains on the selected control. |
| Show reconstructed setting | Architecture and its caption visible | Architecture fades to 8% opacity; source anchors and the textual evidence remain. Reveals dependence on contextual reconstruction. | Same checkbox restores it; Reset returns first viewpoint and full setting. No hidden information depends solely on opacity. |
| Examine passage | Complete reference and chapter link already visible | Inline passage excerpt expands below desk with verse numbers and WEB attribution. Surrounding chapter remains a real reader link. | Retract, ×, or Escape. Explicit close returns focus and viewport to opening control. No inner scroll container. |
| Corinth assumptions | Both off; unequal meal remains visible | Room hypothesis adds dashed division; timing changes the explicit hypothesis statement. The WEB quotation stays identical. | Uncheck independently or Reset; keyboard-native checkboxes. Neither choice establishes a historic floor plan or work schedule. |
| Migdal context | Foundation coin selected | Observation, inference and overclaim update; dates remain attached to contexts | Choose one of three contexts; ordinary selection does not scroll. No assembled cross-section falsely claims all contexts are one excavated section. |
| Ephesian comparison | Acts account selected | Account type, dated claim and source change; city and non-corroboration limit stay | Two clearly labelled choices, reset to Acts. No causal/influence arrow joining different decades. |
| Regional government | Galilee initially | Office/date/claim/limit and reference change | Labelled select; all four existing records available. No automatic scrolling. |

No overlay is needed. The expanded inline reading is the only general-purpose disclosure in the prototype. The stronger investigations are visible at their relevant scenes, not behind nested submenus.

## State, continuity and motion

- Initial: village / household viewpoint / reconstructed setting shown / inline reading closed / hypotheses off.
- Selected: scene and viewpoint encoded in the fragment; other per-scene selections and assumptions stored in browser history state. This is navigation state, not a saved journal, account or analytics collection.
- Expanded: reading follows the desk in normal document flow. Opening does not seize focus or scroll. Explicit close returns to the control if the reader has moved down the reading.
- Switched: a new scene closes the old scene’s passage, preserves its chosen viewpoint and retains relevant hypotheses for return. The place/date heading makes the new context explicit.
- Reset: resets only the current scene’s viewpoint, illustration visibility and experimental hypotheses. It does not restart the journey or discard unrelated site navigation.
- Browser Back from a Bible passage restores the selected scene, viewpoint and hypothesis state. Prototype verifies this with the real local reader.
- Proposed integration must continue using the site’s normal page transitions and fixed header; it must not adopt a private route-transition system. The isolated header is only a visual stand-in.
- Setting fade: 250ms opacity. Scene replacement: 180ms restrained fade, no animated flight between supposed coordinates. No perpetual motion. Reduced motion removes both. Do not reserve a large blank panel for the longest content.

## Desktop, laptop and phone

At 1440px, the overall content width is approximately 1300px within a 1380px container. Opening and journey are compact; the scene starts in the first screen. Evidence sits beside the artwork. At 1024px, reduce side margins and art/evidence gap, not the legibility of citations.

Below 720px the eight-position strip becomes a labelled native select. Its full ordered options retain all eight situations without forcing a horizontal pan or eight tiny pictures. Artwork precedes two-column, full-label question buttons; evidence follows in normal document flow. The shared illustration stays large enough to recognize, but fine labels live in HTML. The repeated invitation sentence is omitted on phones; the actual subject, explanatory copy and qualification remain. Supporting comparisons stack vertically. No sticky panel within the fixed site header, no nested scroll area.

Keyboard focus is a two-pixel contrasting outline with four-pixel offset. Selection uses a ring, number, button state and wording, not colour alone. Image alternatives explain the role of the drawing. A brief live region announces the selected situation; it does not repeatedly announce all body text. Text remains selectable. Usable control size is maintained at 320px. Screen-reader review remains a specific integration acceptance task.

## Data, reuse and dependencies

`prototype-data.js` snapshots the existing eight-scene data without editorial rewriting. `snapshot.mjs` also extracts the referenced WEB verses directly from `data/plain/web/`. [Content map](content-map.json) preserves every viewpoint field. The illustration coordinate positions are layout data only. No prices, transport durations, capacities, population figures or income estimates are added.

Reuse the original source dictionaries, `readerLink` convention, per-scene IDs, existing investigations and claim explanations. Reuse the site’s header, typography tokens, theme control and page transitions at integration. Art in `art.js` is an isolated prototype, not a production asset; it may inform a later typed React implementation.

Genuine unresolved dependencies: full-text access to the Horrell, Theissen, Meeks and Talgam works remains as documented in the dossier; exact archaeological plans would require separate verification and rights review; no such precision is required for this design. There is no blocker to a schematic implementation. External source availability was not re-audited in this design pass. Josephus-specific material remains excluded from the general study.

## Prototype scope and acceptance

**Implemented here:** opening, eight situations, 28 viewpoints, source and reader links, reconstruction fade, inline WEB excerpts, return state, reset, government comparison, three representative investigations, light/dark and responsive layouts. All existing body content remains in its working source. Chronology, quizzes, expanded scholarly prose and complete source registers are mapped above but not duplicated wholesale in the mockup; the onward link opens their current working page.

**Completed validation:** see [receipt](review/verification.json). Edge rendered local files directly; no server or new port. All 28 viewpoints were exercised at 1440, 1024, 390 and 320px; selected state, overflow, reset, coin contexts, both civic accounts, meal assumptions, inline reading close/focus, keyboard controls, reader/Back restoration and reduced-motion behaviour checked. Opening, selected and dark screenshots were visually inspected. Local fonts and generated passage data loaded successfully. Source and prototype syntax and local file references were checked. No application build or route change occurred.

**Acceptance checks for later integration, not claimed completed:**

1. Match all 28 retained evidence/meaning/limit records and every citation against the snapshot; preserve the full supporting material in the mapping above.
2. Confirm fixed site header and normal transitions from Academic → study → Bible → Back, with the same scene and viewpoint restored. No selection-induced viewport jump.
3. Exercise all scene/assumption combinations in both themes, including reading opened near the bottom, then close from its × and Escape.
4. Screen-reader test names, pressed states, image description, expanded state and focus return; test browser zoom at 200%.
5. Verify contrast against actual shared theme tokens, not just prototype swatches; keep every source reference comfortably readable on a phone.
6. Compare each drawing with its explicit qualification: no reconstructed surface can be mistaken for a recovered plan; every comparative date and region remains visible.
7. Review the longest source labels and Scripture excerpts at 320px and laptop widths without clipping, nested scroll, hidden focus or empty reserved bands.
8. Ensure the design’s novelty comes from the scene/evidence relationship; reject any implementation reduced to eight illustrations above repetitive collapsed prose.

The mockup is reviewable, not permission to integrate, rebuild, publish or deploy.
