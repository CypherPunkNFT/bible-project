# A passage through the manuscripts

Design proposal · 14 October 2026 · isolated prototype, not application integration.

[Open the working prototype](prototype/index.html) · [Research dossier](../02-passage-through-manuscripts.json) · [Earlier implementation design](../02-design.json)

## The subject and the decision

The central question is **what can a surviving witness establish about a passage—and where does an editor’s judgment begin?** The most revealing contrast is between an apparently tiny difference with grammatical consequences (Romans 5:1) and an apparently large absence that supplies no reading at all (P45 at Mark 16). Correction, loss and editorial selection must remain different operations.

The existing page has substantial research, three aligned comparisons, close readings, a restoration, an investigation of GA 304, a hypothetical copying model, an assessment and an editorial history. Preserve these. Its opportunity is compositional: the hero repeats a comparison that the reader must later find in a conventional table; the object/transcription/edition distinction precedes the encounter rather than emerging from it; its strongest later investigation is far down the page. The new opening brings actual comparison forward and lets the reader change a manuscript state while the edition stays still.

Three approaches considered:

| Approach | Explanatory value | Evidence fit | Interaction cost |
|---|---|---|---|
| Transmission network | Makes dependence visible | No documented genealogy among these selected objects; would require prominently hypothetical links | High; many nodes with little warranted detail |
| Passage through time | Connects editions and discoveries | Good for the final history, weak for local variants; risks confusing the age of a copy with the age of a reading | Moderate; navigation competes with close reading |
| **Collation light table** | Aligns a stable phrase while states and interpretations change | Uses verified, normalized extracts and explicit apparatus reports | Moderate; one state switch and one evidence inspector |

Choose the light table. Its registration column makes the vowel physically easy to compare without simulating handwriting. The fixed editorial row makes a second point: an edition is a selected text, not another manuscript. The broken-edge exercise then tests whether the reader can keep supplied letters distinct from preserved text.

## Concrete composition

1. **Opening and invitation.** Standard fixed site header; category breadcrumb. Large, left-aligned serif title occupies about three fifths of a 1224px content area. A short invitation occupies the remainder. No separate decorative hero object. The light table begins immediately below, visible in the first laptop viewport.
2. **The early encounter: Romans 5:1.** Three broad rows: Sinaiticus, Vaticanus, SBLGNT. Each row is an object/state label, a normalized Greek extract and an English gloss. First hands initially show omega. The copper edition row shows omicron. A teal result strip gives the essential distinction without requiring expansion.
3. **The argument.** An intimate two-column reading area presents attestation, a reversible copying explanation and context. The sources stay adjacent. No weighted score, probability dial or verdict button. Explain the disagreement between historical editions; NET’s preference remains attributed.
4. **Two further comparisons.** In the full implementation, a clearly labeled passage selector at the light table offers Galatians, Romans and Mark. Preserve the same evidence/edition distinction. Galatians switches spelling/word order and decodes the genuine comparative apparatus. Mark changes the visual grammar to coverage lanes, described below. Do not shrink twelve verses into one decorative token.
5. **The broken edge.** Full-width change of composition: explanation left; a single enlarged transcription right, divided at the boundary of supplied letters. The reader reveals ημα without restoring the paper or removing brackets. This contrasts uncertainty about missing matter with a transmitted alternative.
6. **An ending under investigation.** GA 304 moves into an object-sequence investigation, followed by the P45 assessment and manuscript-dependence explanation. It is a major chapter, not a footnote inside Mark.
7. **How editions learn.** A compact work-led history, keeping the existing selected developments and limitations. Finish with the durable habit: “First ask what survives. Then ask what it supports.” Offer the source register, deeper reading and the existing Academic category route.

## Content-to-design map

The six existing numbered sections are all retained; numbers need not become six cards.

| Existing material | Proposed home and treatment | Preservation rule |
|---|---|---|
| Hero and 01: object, transcription, edition | Opening light table; short explanatory key beneath it | State that displayed Greek is normalized, not a facsimile; object viewers supply the path to objects |
| 02: Galatians spelling and word order | Alternate light-table passage; separate variation units | Preserve P46/edition differences and Michigan normalization conventions |
| Galatians apparatus decoder | Close-reading strip under its comparison | Retain actual token sequence and explain edition sigla; do not present as manuscript census |
| 02: Romans first/corrected hands | Default signature experience | Same two objects; separate correction states; NET labels; no invented chronology |
| Romans three reasoning strands | Open argument area below desk | Sound confusion works both ways; contextual judgment is not autograph evidence |
| 02: Mark coverage and three narrative continuations | Coverage lanes plus readable narrative join comparison | Preserve Sinaiticus/Vaticanus intact conclusions, Alexandrinus continuation, P45 non-extant coverage, SBL brackets and Shorter Ending |
| Ancient argument: Irenaeus, Eusebius, Kelhoffer; Head/Snapp | Mark close reading, with reception/origin questions side by side | Early circulation is not proof of authorial origin; minority reconstruction labeled; no theological conclusion inferred automatically |
| 03: Galatians 1:4 damage | Enlarged broken-edge transcription | Brackets remain visible; Michigan’s open line-end bracket convention explained |
| 04: GA 304 / Houghton | Dedicated investigation of text, scholium, unused space and erased epigram | Schematic sequence, not measured layout; conclusions follow published research; cessation unexplained |
| Optional 8:2 dependence model | Supporting explanation beside manuscript-count question | Keep explicit “invented example”; no actual genealogy inferred; number alone cannot settle a reading |
| 05: P45 assessment | Immediately after coverage investigation | Correct answer remains “cannot witness this location”; no score or ranking |
| 06: FieldJourney | Work-led editorial history | Preserve Tregelles/WH, Nestle/Alands, Holmes, ECM/CBGM and split-guiding-line example; selected history, no false inevitability |
| Reading room, gaps, conventions, rights | Final reading area plus sources beside each example | Keep access depth for each work and all dossier source IDs; Josephus-specific material excluded |

## Signature visual specification

**Geometry.** At 1440px, content width is about 1224px. A shallow green-gray board frames three paper reading strips. Registration comes from identical column grids, not an arbitrary plotted scale. The Greek occupies the center; the changing vowel receives a solid pale teal field and a dark underline. The editorial row is separated by an eight-pixel board-colored gutter and a warm paper surface. No connecting arrow implies descent or influence.

**Meaning of marks.** A row represents a reported textual state or a critical edition, explicitly labeled. A highlight identifies the local variation unit, not uncertainty, importance or authenticity. The gutter separates evidence from an editor’s presentation. Superscripts are apparatus hand labels. The board is an illustrative reading surface, not an ancient desk reconstruction. All text remains selectable HTML.

**Before interaction.** The two first hands show ἔχωμεν, glossed “Let us have peace”; the edition shows ἔχομεν, “We have peace.” Both manuscript labels invite inspection with a downward chevron. The visible conclusion explains that the edition is a decision. Readers need not discover a hidden control to understand the starting comparison.

**Selected state.** “Recorded corrections” changes only the manuscript vowels, sigla, glosses and explanatory result. Object names, row positions and the edition remain stable. Both corrected states show omicron. Do not morph omega into a supposed physical correction: we have apparatus reports, not newly collated letter forms. The state change demonstrates why two hands are not two manuscripts.

**Expanded state.** Selecting a witness opens one shared inspector beneath the rows. It gives the location, source of the report, observation/reconstruction boundary and a direct record link. Selecting another witness replaces that inspector. The selected row shows ×; the inspector has an explicit close button. It is not a modal, does not trap focus and does not move the reader on opening.

**Closed/reset.** Click the same witness, click × or press Escape to close. The explicit close returns focus to the originating row. Scroll back only if the origin is above the fixed header; ordinary switching never scrolls. “First writing” restores the initial comparison; no redundant Reset control. State is recorded in URL parameters so returning from a source preserves the selected state.

**Switched passage, full design.** Keep the desk heading and selector stable. Romans has hand controls; Galatians has spelling/order controls; Mark has coverage inspection. Remove irrelevant controls rather than leaving disabled knobs. Preserve each passage’s local state in the route query or keyed state. No auto-centering on selection. Prototype implements Romans, damage and a separate Mark coverage scene; the integrated passage selector remains specified, not built.

**Mark coverage lanes.** Use a common semantic division: “Through 16:8” / “16:9–20”. This is a passage-extent diagram, not proportional manuscript dimensions. Sinaiticus and Vaticanus receive an explicit end mark after 16:8 and a label about the surviving conclusion. Alexandrinus continues. P45’s entire relevant lane uses a broken outline labeled “Not extant: no reading here”, never an empty omission cell. SBLGNT has a separate edition lane with double brackets. Select an end mark to inspect end-title/blank-column evidence. All essential information also appears as labeled text in reading order. Source and inference about the blank column stay separate.

## Artwork and typography

Palette: warm paper #f5f2e9, dark green ink #213c3b, manuscript teal #246861, editorial copper #8f462a. Quiet ruled edges, crisp fields and restrained offset paper shadows give the desk physical presence. The focal point is real typeset Greek at 34–37px, not a glowing book or tiny icon. No invented manuscript writing, texture, letter traces or archaeological detail. Prototype uses Georgia and Arial system fallbacks to remain portable; integration must use the existing site’s serif/body tokens and spacing scale, not ship replacement global fonts.

The broken edge is a typographic partition: surviving letters on warm paper, supplied letters across a dashed boundary. Its caption explicitly denies a traced torn edge. Brackets and wording carry the distinction independently of color. No new manuscript images are necessary; future images would require licensed files, custodial attribution and an accurate locator before use.

Representative copy: “Compare the same two objects”; “First writing”; “Recorded corrections”; “Typeset comparison · not a facsimile”; “Two objects. Later textual states”; “The word returns. The ink does not”; “Show supplied letters”; “Not extant: no reading here.”

## Evidence and dependencies

Use `src/pages/study/passages/evidence.ts` as the implementation’s typed reading/source basis and the structured dossier as the claim/access record. The prototype hand-copies a small frozen subset, with adjacent source links; do not let this become an independent production dataset. SBLGNT extracts and apparatus are adapted under CC BY 4.0. English phrases here are explanatory glosses, not quotations from a project Bible translation.

Romans relies on NET note 4, SBLGNT text/apparatus and Sinaiticus folio metadata. Corrections have not been freshly collated; their chronology remains unasserted. P46 restoration follows Michigan’s diplomatic transcription (line 8). The dossier retains fuller evidence on Mark and GA 304. No new historical findings are claimed by this design pass.

Full implementation should reuse the project’s `PassageText`, `studyRefLink` and catalog/Span data to make complete passages accessible in the established Bible reader, as `PassagePair.tsx` does. Prototype links to the complete Greek Romans text; it does not fabricate a Bible-reader URL or load a second Scripture source. Actual passage-span integration and standard route transitions remain implementation dependencies.

Genuine research gaps: physical verification of Romans correction forms; fresh GA 304 inspection; Monier 2019 inaccessible; full ECM volumes and Parker book unread; translated traditions, combined Mark endings and Freer Logion not comprehensively collated. A chronological network of manuscript descent cannot be built from this dataset. No quantities beyond explicitly hypothetical examples should be introduced.

## Responsive, motion and accessibility behavior

Desktop: three aligned columns, evidence inspector below the complete comparison, normal document scrolling. Laptop: narrower gaps and type while keeping complete words. Below 700px: each manuscript is a stacked band (label, Greek, gloss), preserving row order and the distinct edition band. No horizontal swiping or nested vertical scroll is needed. The hand switch remains visible above all rows. Damage explanation stacks above its enlarged word.

Use native buttons with `aria-pressed` for state selection; native checkbox for restoration; `aria-expanded` and `aria-controls` for evidence. Table roles preserve comparison semantics in the prototype’s responsive grid. Native Tab/Enter/Space operate controls; Escape closes evidence. Visible focus, 44px control targets, explicit labels and live result messages convey changes without color or motion. No hover-only content. Validate with a screen reader before production; automated checks alone do not establish spoken-table usability.

Motion: a short 200ms opacity entry for evidence only; no perpetual movement. State changes stay in place. Reduced motion removes entry animation. Integration must retain the site header outside the page-transition boundary and use the standard page transition. The prototype approximates a fixed header; it does not validate React route transitions.

## References inspected and reuse decisions

All five requested local pages were loaded in Edge at 1440×1000 and their opening screenshots inspected. Source inspection covered their routed entry components and relevant artwork/data components. Screenshots and the route/headings inventory are in `.local/passage-design-reference/` (working inspection artifacts, not production assets).

- **Surviving witnesses:** object forms, inspection lenses and P46 leaf inventory show why a visual needs defined units and evidence links. Borrow explicit schematic labeling and stable selection, not its folio hero or leaf grid.
- **Worldviews:** `WorldviewsPage`, `WorldviewCardArt`, `WorldviewHeroArt` and `worldview-card-art/art.tsx` demonstrate substantial SVG centerpieces, object placement and coherent collection identities. Borrow deliberate scale/palette, not religious symbols or decorative orbit animation.
- **Letters:** current `LettersPage` routes to `LettersBrowse`, not the older overview. Collection and exploration data support different modes. `PassagePair` connects comparisons to the project reader. Reuse passage infrastructure; avoid reproducing its navigation grid or auto-scrolling part changes.
- **Preachers:** `Landing`, `ArcBand` and `RadiatingBible` connect data-derived figures, search and selected people. Borrow the principle of one useful selected explanation, not radial marks where there is no comparable population.
- **Scholars:** `Constellation` defaults to `IdeaLineage`; legacy constellation requires another view. `idea-chains.ts` gives explicitly described work relationships. Borrow source-connected explanations, not undocumented manuscript links or automatic detail-centering.

The opening references were visually inspected. A follow-up browser inspection also selected Tyndale in Scholars’ Languages & texts chain, Kenyon in its Archaeology & places chain, focused Edwards on the Preachers arc and opened his profile. Screenshots of these four states were inspected. Other reference interactions were assessed from source, not exhaustively browser-tested. The existing study’s main page, `evidence.ts`, `CloseReadings.tsx`, dossier and earlier design were inspected. No separate academic passage-notes or existing-material inventory exists for this item: the dossier’s cases, expansion claims and access records supply those functions. The unrelated 40-study Scripture/Theology queue remains unchanged.

### Richness learned from Scholars and Preachers

Their strength is coordinated depth. A preacher’s mark leads to a profile with a lifetime, places, works and documented relationships. Scholars makes the relationship itself readable—translation, revision, challenge—then connects selection to an explanation and source. The displayed counts in Preachers are derived from its catalogue, not ornamental headline numbers. The manuscript study has no equivalent census and should not imitate those statistics.

The revised prototype therefore adds a second substantial visual scene: Mark’s passage-coverage lanes and a coordinated object-sequence inspector. Selecting Sinaiticus, Alexandrinus or P45 changes the schematic, preserved-evidence account, inference and source together. The coverage overview stays visible. There is always one selected witness, initially Sinaiticus, so no empty inspector or redundant close control; choosing Sinaiticus returns to the initial state. Native buttons work with touch, Enter and Space. Selection is retained in session storage across source visits and reloads. No selection scrolls the document. On phones, witness labels occupy a full line above the two passage regions; the inspector stacks underneath.

This scene implements three selected witnesses, not the full eventual five-row comparison. Vaticanus, the separate SBLGNT edition lane, the narrative continuations and GA 304 remain specified work. Its SVG shows labeled reading sequences, not invented writing or leaf dimensions. The goal is to carry a reader from one visible difference into several connected questions, while maintaining the evidence boundary.

## Prototype acceptance and completion boundary

Required checks for this artifact: load directly from file without a server; no JavaScript errors; correction switch changes two manuscript rows but not edition; evidence source and labels update; same-row/×/Escape collapse; focus returns; restoration retains brackets; state survives reload; local files resolve; no horizontal overflow at 1440, 1024, 390 and 320px; keyboard works; reduced-motion animation is disabled; inspect desktop/mobile screenshots. Results are recorded in [verification.json](prototype/verification.json).

Additional implementation acceptance, **not completed by this prototype**: all three passage modes wired to the typed dataset; Mark coverage lanes and GA 304 sequence reviewed against sources; apparatus decoder and full reading paths retained; project Bible context integrated; normal header/route transitions tested; back navigation preserves passage state; screen-reader review; full site light/dark typography and contrast checks; release mirroring only under a later implementation instruction.

This design task changes no application route, production asset or release source and performs no site build, deployment or new preview-server launch. The existing page remains at http://127.0.0.1:8931/study/passage-through-manuscripts. The local prototype is a review artifact, not authorization to replace it.
