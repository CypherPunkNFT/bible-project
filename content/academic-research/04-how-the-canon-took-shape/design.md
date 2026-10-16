# How the canon took shape — Registers of reception

Design approved and implemented locally, 14 October 2026. **No public deployment.**

[Open the working prototype](prototype/index.html) · [Opening screenshot](prototype/opening.png) · [Verification report](prototype/verification.json) · [Existing research dossier](../04-how-the-canon-took-shape.json)

## Scope and editorial decision

This records the design and approved local implementation of Academic study 04, under **The Bible: formation & transmission**. It is not item 04 in the separate forty-study Scripture/Theology queue. That queue, its current position and its completed drafts remain unchanged. The subsequent instruction “Implement the design and put it up on local” authorized working-route integration, a local build and focused release-source mirrors. Public deployment remains outside this task.

The central question is **how particular communities and writers distinguish a valued writing from a member of a recognized collection**. The most revealing contrast is that the same writing receives different descriptions, and that different descriptions do not always amount to opposing verdicts. Not enumerated, not addressed, recommended and canonical must remain distinct.

The existing study is materially rich: eighteen historical records, five evidence kinds, three writing trails, three close investigations, six named tradition comparisons, reasoning exercises and a scholarly guide. Its strongest comparisons occur well below the opening and present only one writing at a time. A reader has to remember the previous state to perceive the pattern. The design should expose that pattern early, without sacrificing the detailed source work.

## Three approaches considered

| Approach | Explanatory value | Evidence fit | Interaction cost / decision |
| --- | --- | --- | --- |
| A chronological landscape | Makes the long process and overlapping dates visible. | Dates frequently denote ranges, compilations or disputed composition; precise plotting would be misleading. | Useful supporting register, but a poor opening: it can suggest inevitable progress toward a final universal Bible. |
| A geographic atlas of collections | Emphasizes place and plurality. | Provenance is uneven; a writer's address is not a territorial boundary or an entire region's canon. | Reject as organizing experience. It requires geographic coverage and jurisdiction data that this dossier does not contain. |
| **Registers of reception** | Aligns the same writings across three contemporary-ish witnesses; makes categorical differences immediately inspectable. | Uses the dossier's existing passage-level judgments, including silence. Requires no invented quantities, influence lines or manuscript imagery. | **Selected.** Three reading controls and nine direct entry controls; one source inspection. Expand to chronology and tradition comparison only after the distinction is understood. |

## Concrete composition

1. **Opening, approximately 250–300px below the standard header and breadcrumb on desktop.** Title left; invitation right: “The writing stays the same. The claim changes.” The next section begins within the first screen. No separate decorative hero illustration pushes the real experience away.
2. **The three registers, full content width.** Three large, paper-like document surfaces form one comparison, not three destinations. Athanasius, Augustine and Jerome occupy equal-width columns; Wisdom & Sirach, Esther and Hermas retain the same row order. All nine judgments are visible on desktop. A compact legend and named passage references are part of the figure.
3. **A reading sentence and source inspection.** A sentence immediately under the registers explains the selected writing's contrast. Selecting any entry opens one normal-flow inspection below the composition: passage, actual criterion excerpt, editorial explanation, limitation and source. The main point does not depend on opening this panel.
4. **Every list has an address.** The eighteen-record chronological register follows. Retain date, place, kind, evidence, interpretation and limit as one coherent source record. The prototype implements all eighteen through a native selector; the eventual application may retain the existing period controls and record index. No continuous numeric axis is required.
5. **Two changes of scale.** Move from the expansive comparison to the more intimate Psalms-scroll argument, then to the physical ending of Alexandrinus. Keep Eusebius's two conditional Revelation clauses as a short bridge between the registers and the historical index. These close investigations use their existing source-linked material.
6. **Collections in reception.** Retain independent choices of two named traditions and the selected-writing comparison, followed by the 24/39 grouping explanation. This is a different question from the ancient three-register comparison; do not merge their data or impose a universal canon.
7. **Test and continue.** Keep the three inference exercises, then the five substantial scholarly reading paths and full access directory. End with “Whose collection? When? For what use?” and the Academic category route.

Normal reading remains vertical. No nested vertical scrolling, modal archive, carousel or forced multi-step tour.

## Content-to-design map

The original six numbered sections remain accounted for. Additional investigations introduced in the expanded study retain explicit destinations.

| Existing material | Proposed destination and treatment | Preservation rule |
| --- | --- | --- |
| Hero: Hermas copied, recommended, outside canon | Opening register selection “Shepherd of Hermas”; material copying remains in the Sinaiticus timeline record and Hermas trail | Do not turn the three claims into sequential stages. |
| 01: five evidence kinds | Compact explanatory key next to the historical register, with existing examples available directly beneath each term in the integrated page | Preserve all five meanings, examples and citations; prototype shows terms only. |
| 02: eighteen records and four periods | “Every list has an address” | All eighteen entries retained, including Irenaeus, Jerome, Peshitta and Alexandrinus. All uncertainty labels stay verbatim. |
| Timeline bridge: councils and Septuagint | Short visible conclusion after the historical register | Preserve the warning against a single universal decision and a single ancient Septuagint contents page. |
| Investigation A: Sirach, 11Q5, two hypotheses, scholarly disagreement, Yavneh | Intimate two-column evidence/argument workspace after the historical overview | Retain both hypotheses and their assumptions, manuscript-versus-composition dates, access limits and the distinction between transmitted rabbinic discussion and a reconstructed council narrative. |
| Investigation B: Athanasius, Augustine, Jerome | **Opening signature experience** | Exact existing statuses and three short excerpts; no inferred judgment where the passage is silent. |
| Investigation B: Eusebius and Revelation | Two-clause reading immediately after the registers | Conditional wording remains visible; expand the second clause with a down arrow and retract with X. Do not reduce to one yes/no result. |
| Investigation C: Alexandrinus and Peshitta | Broad physical-sequence diagram after the Psalter investigation | Preserve folio references, solid/partial/listed distinctions and the contents-list toggle. Peshitta remains a version's collection, not a universal modern Syriac statement. |
| 03: Hermas, Esther and Revelation trails | Optional alternate entry into the historical register, beside the index | Keep every existing relevant stop and its source-record link. Selection should highlight the relevant index entries without deleting others; “Clear trail” restores the full index. |
| 04: six traditions / eleven selected comparison rows | Dedicated reception comparison | Retain both independent selectors, all cells, scope/naming notes and “not specified” qualifications. |
| 04: why 24 and 39 can mean the same writings | Adjacent grouping explanation | No new totals; retain 4→8, 1→12, 19→19 and their limits. |
| 05: three reasoning questions | Compact final practice area | Preserve question wording, supported/unsupported feedback and citations. |
| 06: thirty-four sources, five reading paths, research limits | Visible scholarly reading sequence plus expandable access directory | Located works must not be presented as read. Full reading recommendations and gaps remain available. |

The isolated mockup implements the **opening registers and all eighteen source records**, not the complete reorganization. The existing application and dossier remain the authoritative full-content versions.

## Signature experience: exact visual grammar

The surface is a pale sage reading table, approximately 1240px wide at a 1440px viewport, with three cream document faces. Each document has a narrow margin rule, a substantial top binding edge and two offset paper edges. These are **illustrative document forms**, not facsimiles of a letter, codex or historical binding. They contain readable modern labels, never invented handwriting.

Each row has a 25×32px document mark, the writing's name, its exact status and a down arrow. One entry represents one writing or explicitly named pair in one selected passage. Wisdom & Sirach is a pair, not one historical book. Nine marks do not count the books of anyone's canon.

| Mark | Meaning | Text that prevents ambiguity |
| --- | --- | --- |
| Filled enclosure with inner border | Explicit canonical inclusion in the selected passage | “Canonical” |
| Open right edge, firm left bracket | Reading distinguished from canonical or doctrinal status | “Instruction outside the canon” or “Edifying; not canonical here” |
| Dashed empty frame | Limit of this selected evidence | Exact “Not enumerated” or “Not addressed here”; these are not collapsed into “rejected” |

Shape and wording convey meaning together; color alone conveys nothing essential. The witnesses have equal scale. Row position identifies a writing; column position identifies a witness. Neither encodes authority, influence, geography or elapsed time. There are no connecting arrows between writers.

### Artwork direction

Use Literata for names, headings and short primary excerpts; Archivo for ordinary explanation, status labels and controls. Palette: parchment `#f5f0e6`, cream `#fffdf7`, ink `#282b26`, deep green `#315e4e`, terracotta `#934d3c`, sage table `#e8e9df`. Dark green and terracotta are restrained ink colors, not approval/error signals. The selection wash is `#e7ece2`.

The focal point is the repeating writing row changing its boundary across substantial document surfaces. This is code-native artwork made from CSS geometry and real type. It does not need bitmap texture, glowing books, particles, decorative maps or historical coats of arms. An SVG export could preserve the same geometry, but semantic HTML is preferable for selectable text and controls.

## Controls and states

| Interaction | Before | Selection / change | Stable context | Understanding and return |
| --- | --- | --- | --- | --- |
| Follow a writing | Wisdom & Sirach highlighted; all nine desktop entries visible | Choose Esther or Hermas; change highlighted row and the reading sentence. If an inspection is open, retain its witness and switch its writing. | Document order, row order, dates, passage names, scroll position | Makes different kinds of judgment comparable. Reset restores Wisdom & Sirach and closes inspection. Native buttons accept Enter/Space. |
| Inspect an entry | Exact short status visible; down arrow promises detail | Click/tap/Enter opens one passage inspection. Another entry replaces its content in the same region. | Full register stays in place; no automatic centering or scrolling on selection | Shows source, criterion and qualification together. X or Escape returns focus to the originating entry; only closing from an origin outside the viewport scrolls back to that origin. |
| Historical record | Athanasius selected; full evidence record visible | Native select changes date, place, genre, explanation and citations | Heading, column structure and normal document position | Places the judgment in its own context. Choose another record to return; no extra close layer. |
| External source | Source title beside the claim | Open in a new tab | Selection remains in the original document | Full context accessible without discarding state. URL parameters preserve selection on reload. |

Representative copy: “Follow a writing”; “Inspect passage”; “What this passage says”; “How far the claim reaches”; “Selected passages, not complete inventories”; “Reset comparison”; “One entry = one writing or named pair in one selected passage.”

The quotation in the inspection is explicitly labelled as an excerpt from the passage's **general criterion**. It must not imply that Jerome's words about doctrinal use directly mention Esther or Hermas. The full source link remains visible.

## Responsive behavior

At desktop/laptop widths above 760px, show all three document columns and all nine entries. At 1024px, reduce gutters and heading scale, not the status text below 11px. Source notes are at least 12px outside the schematic document captions. A 1440px opening shows the signature before the end of its first screen.

At 760px and below, compare **one writing across three vertically stacked witnesses**. Hide the other two entries in each document, not entire witnesses. The writing controls remain above the comparison. Keep the document's author, date, selected status and passage name together. This is a deliberate transposition of the comparison, not a shrunken desktop chart. The inspection becomes one column. At 320px there is no horizontal page scroll; long names wrap naturally. No swiping or hover is needed.

## Motion, continuity and accessibility

Only a brief 180ms opacity reveal accompanies source inspection. Entries stay at fixed positions; there are no moving books, reshuffled layouts, perpetual animation or empty regions reserved for worst-case panels. Reduced motion removes this fade and smooth scrolling.

The eventual integration must reuse the existing site's fixed header and PageTransitions; this prototype uses a labelled visual stand-in and does not attempt to simulate route transitions. Ordinary selections update state without a page transition or scroll. Preserve selected writing/witness/record in URL parameters, and preserve existing `record` deep links when integrating. Source links open separately. No account, analytics or journal storage is added.

Use native buttons with `aria-pressed` for writing choices, `aria-expanded` and `aria-controls` for entries, an explicitly labelled inspection region and a native select for historical records. Do not make the decorative paper edges focusable. The three documents are semantic articles with headings and a stable DOM order. The visible text supplies the same information as the marks; a separate inaccessible image is never the only explanation. Focus has a 3px terracotta outline. Touch entries exceed 44px. Updated finding text is announced politely. Validate real screen-reader reading and announcement behavior before integration.

## Data, reuse and dependencies

Use `investigations.boundaries` from the [dossier](../04-how-the-canon-took-shape.json), including its exact nine states, three excerpts, translations and source IDs. Historical detail comes from `records`; source URLs and access notes from `sources`. The prototype's [data snapshot](prototype/data.js) is copied, not a second editorial source. [Provenance](prototype/provenance.json) records its source hash. No live fetch is needed to open the mockup locally.

Reuse the site's fonts, spacing tokens, standard transitions and citations pattern. Reuse the existing `CanonInvestigations` datasets and historical register behavior; transpose the comparison presentation rather than rewriting the research. Keep the original Alexandrinus and Psalter interactions. The prototype font files come from installed project dependencies and include their licenses.

Reference inspection, on the existing port 8931:

- **Surviving witnesses:** opening inspected in Edge; source includes Folio illustration, inspection desk and attributed leaf inventory. Borrow the integration of form, legend and source; do not copy its manuscript drawing.
- **Worldviews:** opening inspected in Edge; `WorldviewsPage`, `WorldviewCardArt`, `WorldviewHeroArt`, artwork centerpieces and CSS inspected. Borrow cohesive scale and specific visual identities, not religious motifs or background animation.
- **Letters:** confirmed current route uses `LettersBrowse`, not an older overview. Opening, routing, artwork and comparison components inspected. Borrow several meaningful ways into one source base, not its card grid.
- **Preachers:** opening inspected in Edge; ArcBand, RadiatingBible and landing styles inspected. Initial screenshot caught the arc during its entrance; the source was used to understand the complete interaction rather than claiming that early frame verified every mark.
- **Scholars:** opening inspected in Edge and `Constellation` wrapper checked; default is `IdeaLineage`, with legacy visualization behind query options. Borrow overview→selection→source linkage. Do not adopt its selection-triggered automatic centering, which conflicts with this brief.

Genuine remaining dependencies: integration approval; assistive-technology testing; actual dark-theme adaptation using site tokens; restoration tests across application navigation; full original-language critical editions and unavailable manuscript images if any later design requires facsimile inspection. None is necessary for the present typographic comparison. No source images are licensed or fabricated for this mockup. Existing scholarship-access limits remain unchanged. The editorial restriction on general-study material remains in force.

## Acceptance and completed validation

Prototype checks are recorded by [verify.mjs](prototype/verify.mjs) in [verification.json](prototype/verification.json); the report, not this proposed checklist, determines what has passed.

- All nine statuses match the dossier; both kinds of silence remain distinct.
- All nine entries can be opened from the keyboard; exactly one inspection is open.
- Switching writing preserves the selected witness and does not move the page.
- X/Escape closes the inspection, restores focus and returns to the origin when necessary.
- Reset restores the documented initial state; reload retains URL-selected state.
- All eighteen historical entries display evidence, interpretation, limits and working source anchors.
- Disputed date labels survive the design unchanged.
- 1440, 1024, 768, 390 and 320px layouts have no horizontal overflow, including open inspection and long labels.
- On phones, three visible entries always compare the same writing across all witnesses.
- Reduced motion removes animation; focus remains visible; source text can be selected.
- Local files and document links resolve; fonts load locally; no browser exception occurs.
- Rendered opening, selected desktop/laptop and mobile views are visually inspected, not merely generated.

Before eventual integration, additionally test full site transitions, live header behavior, browser Back from passage/person routes, light/dark contrast, NVDA or equivalent, and the complete content map. These are **not** claimed as prototype verification. The isolated mockup does not implement the remaining close investigations or modern tradition comparator; it links to the existing complete study and specifies their retained locations above.

### Recorded result

On 14 October 2026, all fourteen automated prototype checks passed in native Edge. The desktop opening, 1024px selected inspection and 390px selected inspection were visually reviewed; a 320px full-page render was also inspected. Screenshot capture finishes finite animations so contrast is judged in the settled state. Browser tests use local file access; no preview server, application route, build or deployment was created. The full report records remaining limits.

## Approved local implementation — 14 October 2026

The existing route now opens with the three-register comparison. CanonRegisters.tsx reads the canonical dossier directly; it does not ship the prototype data snapshot. All nine judgments remain available, with the three-witness comparison preserved on phones. Source inspection retains its witness when the writing changes, stores selection in URL parameters alongside the timeline record, and restores focus on close. The former repeated boundary ledger was removed from investigation B; its source material moved to the opening and its Eusebius close reading remains. All eighteen records, five evidence kinds, three writing trails, six collection choices, counting explanation, three reasoning exercises, scholarly guide and access limits remain.

### Additional reference inspection

Current local Atlas/map, Preachers, Scholars, Theology landing, Salvation and Law/covenant pages were rendered in Edge and their implementation inspected. Reference screenshots are in .local/canon-design-reference. Atlas contributes stable overview plus source detail, URL selection and a different phone arrangement. Preachers contributes readable mark semantics and controlled visual scale. Scholars’ current IdeaLineage contributes the relationship between selection, explanation and the underlying work; its automatic centering was not adopted. The theological topic pages contribute readable type hierarchy and explicit source/context boundaries. No geographic data, historical influence arrows or quantitative measures were invented for the canon comparison.

### Implementation verification

Focused TypeScript check, frontend build and editorial-source audit passed. Browser suites scripts/check-canon-study.mjs, scripts/check-canon-investigations.mjs and scripts/check-canon-registers.mjs cover the full study and the new comparison. They verify all nine judgments, keyboard activation, Escape/close focus return, reset, query fallback, reload/Back retention, 320/390/768/1024/1440px layouts, light/dark themes, reduced motion, fixed header and standard site transitions. Screenshot review corrected the light document surfaces and narrow-desktop row alignment. A fresh 320px source-inspection render confirmed the complete explanation and source remain visible in normal document flow.

Reports and screenshots: .local/canon-qa. Original isolated prototype verification is retained as design history. Focused source mirrors: .local/release-atlas-loop and .local/release-circles-20261013. No new preview server or public publication. Research dossier preserved unchanged; its recorded access gaps and interpretive limits remain. No screen-reader or physical-device audit is claimed.
