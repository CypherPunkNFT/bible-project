# The Dead Sea Scrolls — landing artwork refinement

## Main-study design expansion — implemented locally

The subsequent editorial correction identified a real shortfall: the first revisions had improved the hero while leaving much of the main study as a button row followed by changing prose. The current pass redesigns three substantial teaching experiences without replacing the accepted opening or rewriting the research.

### Organizing idea and alternatives

**A collection becomes evidence under examination.** Begin with distinct surviving objects, distinguish the histories we can date, then inspect independent observations before assessing a join. The visuals answer different questions and use different compositions.

Three approaches were considered: a geographic cave map, a chronological exhibition, and an object-led collection with separate evidence workspaces. The map would overemphasize caves again and require surveyed locations not present in the dossier. A single timeline would conflate literary history, physical copying and modern recovery unless heavily qualified. The third approach uses the actual six-object inventory and keeps each method’s limits visible; it was selected.

### Page composition and content mapping

| Existing material | Implemented presentation |
| --- | --- |
| Opening and significance | Accepted moving scroll, glass and fragments retained; existing explanation retained |
| Six objects and all catalogue fields | A shared illustrated collection above one two-column inspection desk; all six objects remain visible when filtering |
| Five cave contexts | A separate context line beneath the desk; selected object connects to its cave record and citation |
| Discovery chronology and wider desert archive | Existing deeper-reading disclosures retained immediately below the collection |
| Isaiah photograph, 54 columns and scribal argument | Retained in full; no fabricated manuscript close-ups introduced |
| Composition, copy and recovery | Three simultaneously visible visual histories; selection reveals method and inference boundary beside the existing explanation |
| 2025 dating qualifications | Retained as deeper reading directly below the date workspace |
| Psalm 145 and Psalter disagreement | Retained in full with existing passages, attribution and consultation limits |
| Three fictional fragment scenarios | A line-art inspection table with independent ink, ruling and broken-edge overlays; explicit assessment below |
| DNA qualification and real-world method limits | Retained beneath the workbench |
| Community, archaeology, conservation, scholarship and source directory | Retained in full |

### Visual and interaction specifications

**Collection:** six forms share a baseline, rather than six enclosed topic cards. Gold is used for scroll/metal formats and blue for fragment formats; it does not encode certainty or religious authority. Each native button shows its identifier, title, language and kind. Selecting changes the record and recovery context, not the object positions. The current query parameter preserves the selected object through reload. Filters fade and disable nonmatching objects without relocating the remaining ones; “All writings” resets the filter. Selecting a cave resets filtering and selects a represented object from that cave. The record distinguishes manuscript date, attributed date basis, recovery, collection and inference limit. Sources remain adjacent.

**Three histories:** an open dashed thread with a question mark stands for an undated literary history; a bounded band stands for the attributed approximate copy date; two dated marks show modern discovery and unrolling. These are semantic diagrams, explicitly not a continuous time scale. No band length is a measured interval. The selected history receives a restrained blue rule and wash. Its text sits beside “Ask this evidence” and “Stop at this boundary.” The date-source references remain at the section entrance, with the 2025 study at its own explanation.

**Workbench:** a large reference/candidate pair occupies the left side; three independent evidence switches occupy the right. The surfaces are restrained fills with precise outlines, rather than shaded parchment. Hand/ink is gold, ruling and highlighted breaks blue. Candidate A differs in strokes and spacing; B shows compatible observations across an unknown gap; C shows contact, continuous ruling and crossing strokes. Drawings are fictional and labelled accordingly. “What does this evidence support?” reveals the existing assessment, and “Close the assessment” retracts it. Evidence switches remain selected when changing candidates, allowing like-for-like inspection. Candidate changes close the assessment. “Reset the inspection” turns off all layers and closes the assessment. No numerical confidence score is assigned.

Initial states: Isaiah selected, all writings visible; physical-copy history selected; candidate A with no evidence layers and no assessment. Selected, switched, expanded and reset states were exercised in the browser. No new hover-only information is introduced.

### Responsive, motion and accessibility behaviour

At desktop the six collection forms run in one row; at tablet they form two rows of three, and at phone three rows of two. The shared detail desk stacks on phones. Cave controls remain a compact labelled context line. The three histories stack into horizontally composed rows on phones, keeping each diagram beside its date. The workbench stacks the drawing above the evidence switches without nested scrolling. Prose remains selectable.

All controls are native buttons with pressed/expanded states and visible focus. Selected record and date explanations use polite live regions. Diagram descriptions expose the currently visible observations. Colour is reinforced by labels, text and border treatment. Evidence fades and slight illustration lifts are disabled with reduced motion. The fixed site header and route transition system are unchanged.

### Data, reuse and limits

All six objects, five caves, dates, sources and qualifications come from the existing structured dossier. No additional historical assertions or measurements were introduced. Original format drawings are schematic, not exact damage outlines, transcriptions or measured size comparisons. The workbench geometry is deliberately fictional. The source-access gaps already recorded in the dossier remain unresolved.

The design draws on Preachers’ explicit mark definitions, Scholars’ connection from selection to an actual work, the theological studies’ passage-oriented depth, and Atlas’s separation of context from selected evidence. It does not transplant those pages’ layouts or map geometry.

### Verification and review artifact

`body-design-verification.json` records completed browser checks. The portable build, editorial source check and application TypeScript check passed. Both themes were checked at 320, 390, 768 and 1440px; rendered desktop and mobile screenshots were inspected. All six objects, filter reset, cave selection, URL persistence, three date histories, all nine candidate/layer combinations, assessment close/reset and reduced motion were exercised. No browser exceptions or horizontal page overflow were found. Manual screen-reader testing remains unperformed.

Review artifact: [three-section visual review](../../../design/dead-sea-scrolls/body-redesign.html). It contains captured renders; use the linked local study for the working interactions. Only focused application files were mirrored into release source. No public deployment occurred. The separate Scripture/Theology queue was not advanced.

Latest interaction refinement: the user requested moving lens contents, individual fragment responses and separate 01/02/03 labels. The scroll and its magnified copy now share the same pointer-driven translation and rotation, applied before the lens’s 1.65× enlargement. The glass itself remains fixed. Leaving the scroll resets both surfaces together. Each fragment lifts on hover or keyboard focus; click, tap, Enter or Space toggles a persistent lift, with another activation returning it. Labels travel with their own fragment, without crossing leader lines. Reduced motion suppresses these movements while preserving outline emphasis and pressed state. This supersedes the static lens and decorative-only fragment states in the original proposal below. The manuscript outlines and research remain unchanged.

Status: approved refinement implemented and verified on the local preview, 14 October 2026. No public deployment. The proposal below preserves the original design rationale and isolated review artifact.

## Chosen idea

**Look closely at a surviving surface.** Preserve the accepted gold scroll and blue fragments. Correct the malformed left curl and place a blue, line-drawn looking glass above the writing. The lens enlarges the same abstract strokes already present in the illustration, making inspection visible without suggesting a new manuscript reading.

The immediate request is authoritative: only the left scroll end changes on the scroll itself. The right end, sheet outline, seam, columns, fragments, background lines, typography, page copy and research remain unchanged. The looking glass is an added layer. The application files and release source are untouched in this design pass.

### Alternatives considered

1. **Stationary, suspended looking glass — selected.** Recognizable at phone scale, shows actual enlargement of existing illustrative marks, requires no instructions or new controls. Its overlapping rim and angled handle create the floating effect.
2. **Pointer-following magnifier.** Gives more inspection freedom, but requires a separate touch/keyboard mechanism and invites readers to treat schematic writing as evidence. Too much interaction for this small revision.
3. **Separate circular detail inset.** Makes comparison easy but changes the composition and resembles an additional diagram rather than the requested looking glass.

## Subject and existing content

Central question: what do these manuscripts preserve, and how can physical and textual observations support responsible historical conclusions? The productive contrast is between a continuous work and the fragmentary objects that survive. Observation, reconstruction and interpretation must remain distinct.

The existing dossier is `../03-dead-sea-scrolls.json`. It preserves object records, claim-level references, recovery histories, dating qualifications, scholarship and explicit access gaps. This refinement neither rewrites nor duplicates that research. The complete study remains the reading experience; the isolated artifact demonstrates its opening only.

## Concrete composition and content map

| Existing material | Location and treatment |
| --- | --- |
| Opening: what the scrolls are, their age and significance | Existing left column, exact text retained; revised artwork occupies its existing right column |
| Six objects, caves, languages, materials, custody and provenance | Existing manuscript explorer, unchanged |
| Isaiah photograph and 54-column scribal argument | Existing close-examination section; the opening’s real-object link leads here |
| Composition, physical copying and recovery dates; 2025 model limits | Existing three-clock comparison, unchanged |
| Psalm 145, nun line, hymn excerpt and Psalter debate | Existing reading sequence and interpretation controls, unchanged |
| Fragment identification and three proposed/established joining scenarios | Existing workbench, unchanged; no actual join implied by landing fragments |
| Community Rule, Qumran association and Room 101 excavation | Existing textual/archaeological comparison, unchanged |
| Conservation and history of access | Existing preservation section, unchanged |
| Annotated works, research gaps, source directory and onward route | Existing scholarly reading trail and Academic link, unchanged |

The original six main content areas are therefore all retained; subsequent expanded evidence sections also remain accounted for. No six-card reorganization is proposed.

## Signature visual specification

Use the existing 640 × 520 SVG coordinate system and existing art footprint. The scroll retains its original rotated group. Replace only its two malformed left-end paths with a regular curl: a narrow body with gently curved lower closure, one elliptical top rim, a smaller opening and one return contour. An opaque page-colour backing inside this small curl prevents the underlying sheet contour from creating overlapping horns. A 5.5% current-colour wash keeps the material consistent with the accepted line art.

Add the looking glass outside the scroll’s rotated group: centre (421, 224), outer radius 51, inner radius 45. Its handle runs diagonally toward (509, 305). Use the fragment blue for rim and handle. A page-colour lens backing and a circular clip hold a 1.65× transformed copy of the existing scroll surface. This is an illustrative enlargement, not a measured historical scale. Two fine rings and one restrained reflection arc give the glass its identity. No raster texture, gradient, glow, cast shadow, 3D tilt or continual bobbing.

The prototype uses a copy of the rendered opening, not a rewritten hero. The unchanged illustration paths can be compared mechanically against the captured baseline. The added lens is clearly an editorial inspection tool, not an object claimed to have been found with the scrolls.

## States and controls

| State | What changes | What remains stable / how to return |
| --- | --- | --- |
| Initial / proposed | Clean left curl and looking glass visible over the scroll | Existing composition, copy and layout |
| Scroll selected | Existing gold scroll emphasis; blue lens fully visible | Select Fragments to switch |
| Fragments selected | Existing fragment movement and scroll dimming; looking glass dims with the scroll context | Buttons remain in place; select Scroll to reset |
| Current, in review toolbar | Displays captured existing illustration with the original left curl and no lens | Review-only comparison; Proposed restores the revision |
| Expanded / closed | No new expanded feature or modal | No close action needed; the existing real-object link leads to the actual Isaiah section |
| Theme switched | Existing dark/light gold and blue palette; lens backing follows page colour | Selection and layout stay stable |

Representative copy remains “The scroll”, “The fragments”, “See the real object”, and “Illustrative forms · not manuscript facsimiles or proposed joins.” Review-only labels “Current” and “Proposed” are outside the study. The glass is decorative: it is not a misleading button, not draggable, and adds no keyboard stop.

## Desktop, mobile, motion and accessibility

Desktop retains the split text/art opening. The glass shares the SVG viewBox, so its rim and handle remain attached to the illustration on laptop and phone widths. Phones use the existing stacked composition and normal page scrolling. No nested scrolling or new navigation is introduced.

Existing native selection buttons work with click, tap, Enter and Space, expose pressed state and retain a live description. The lens adds no facts unavailable in text. Fine lines use the existing theme-specific gold and blue. Essential control text remains separate from the diagram. The drawing’s accessible title and description identify it as schematic. Reduced motion disables transitions; every state still has a complete static composition. No perpetual animation is proposed.

## Reuse and evidence requirements

- Reuse the exact current hero markup, fonts and illustration palette in this isolated snapshot.
- Reuse current SVG writing marks; do not invent Hebrew or quotations inside the lens.
- Preserve the existing institutional photograph and attribution in the study below.
- No new historical data, image licences, manuscript transcriptions or measurements are required.
- Existing scholarly access gaps remain those in the dossier. This art pass resolves none of them and makes no new research claims.

## References and workflow

The current openings of all five supplied reference routes were captured in Edge. Relevant source entry points were inspected: Witnesses’ Folio and CSS, Worldviews and its HeroArt, Letters’ routed LettersBrowse entry, and the Preachers and Scholars landing entry points. The narrow revision borrows only the established line-art language; no reference layout is transplanted. The study workflow was read. The independent forty-study Scripture/Theology queue does not contain this Academic item and is not advanced.

## Artifact and acceptance checks

Working artifact: [isolated opening](../../../design/dead-sea-scrolls-lens/index.html), served by the existing preview at `/mockups/dead-sea-scrolls-lens/`. It includes a current/proposed comparison and functioning original scroll/fragment controls.

Acceptance checks:

1. The original two left-end paths are absent only in Proposed; its replacement contains one coherent rim and return.
2. Every other baseline path remains identical, including the right end, body, seam, marks and fragments.
3. Lens enlargement reuses the existing surface through SVG `use`; no invented text or statistical data.
4. Current/Proposed, both content states and light/dark modes work with keyboard and touch-sized review controls.
5. At 1440, 1024, 768, 390 and 320 px: no horizontal page overflow; lens stays within the art.
6. No perpetual animation, and reduced-motion mode has no transitions.
7. Source and onward links point to the existing study, not nonexistent prototype sections.
8. Application sources, routes, built assets and release source remain unchanged.

Completed checks and any limitations are recorded in `progress.json` and the artifact’s `verification.json`. Integration and production transitions are not validated by this isolated prototype.

## Approved local implementation

The user subsequently authorized implementation on the existing local preview. The looking glass and replacement left curl are now in `ScrollsHeroArt.tsx`, with theme and selection styles in `scrolls-hero-art.css`. Only these two application files were mirrored into the release source. The portable build and editorial source check passed. No public deployment was performed. Earlier design-only scope statements above describe the proposal phase.

### Visualization references inspected during integration

- **Preachers:** `landing/ArcBand.tsx` and the rendered birth-year arc. Borrow the discipline of explicitly defined marks, restrained lines and keyboard-accessible selection.
- **Scholars:** the currently routed `IdeaLineage.tsx`, not the older constellation. Relationships carry meaningful labels and selected works lead to explanation. Preserve that evidence-first approach in the scroll study; do not add unsupported historical arrows.
- **Theological studies:** Letters’ routed collection experience and Names of God’s visual overview and passage expansion. Preserve the movement from an approachable overview into actual text, with consistent colour and visible controls.
- **Atlas:** `AtlasPage.tsx`, its collection opening and map selection/filter source. Keep selected evidence attached to its context and maintain a direct route from illustration to source. Geographic-looking artwork must not imply surveyed precision.

These references guide the study’s visual language and future evidence graphics. This approved integration changes only the requested landing details; it does not replace the existing charts or research. Screenshots of all five reference openings were inspected.

### Completed local verification

Desktop and phone screenshots were inspected. Automated browser checks covered both themes at 320, 390, 768, 1024 and 1440px, keyboard scroll/fragment selection, the dimmed lens state, reduced motion, the real Isaiah anchor, and Academic navigation with browser return. Every original SVG path except the two replaced left-curl paths remains present. No browser exceptions were recorded. The lens references the existing surface using a unique SVG ID. Manual screen-reader testing remains unperformed.
