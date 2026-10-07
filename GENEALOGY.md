## 2026-10-07 ? full branches and Gospel accounts

- Shared 24-family selector, Jesus first. Real People genealogy opens Jesus / Matthew / full ancestry. Six quick choices plus all 24 in a compact selector, shared by tree and circular views.
- `src/lib/genealogy-catalog.ts` contains the preset IDs and independently sourced Matthew 1:1?17 and Luke 3:23?38 ancestry projections. Public-domain KJV sequence, with existing corpus display-name spellings. Matthew: 41 main-line entries plus Tamar, Rahab, Ruth, Bathsheba and Mary (46). Luke: 76 human entries through Adam, with the closing ?of God? explained in the source note. Luke 3:33 follows KJV Aram; the Admin/Arni textual variant is acknowledged.
- Sources: https://www.biblegateway.com/passage/?search=Matthew+1%3A1-17&version=KJV and https://www.biblegateway.com/passage/?search=Luke+3%3A23-38&version=KJV . These are listed ancestry sequences, not a claim that every link represents an immediate biological generation. Joseph?s relationship to Jesus and Matthew?s omissions are explained. Do not label Luke as Mary?s genealogy: Luke names Joseph and Heli.
- Source projections are immutable and separate. No added unnamed Matthew generations, no Mary?Heli harmonization in Gospel views. The underlying imported TIPNR network remains intact for other families and can contain identifications/interpretations not directly asserted by these Gospel passages. ?Full? means every recorded reachable entry in this corpus, not exhaustive independent verification of every biblical identification.
- Full branch computes the longest recorded path and includes all reachable entries; the old 9-generation/600-person display caps are removed. Choosing a preset opens its complete recorded descendants, except Jesus opens complete ancestors. Number controls remain available for narrowing the view. Direction, depth and Gospel account survive expand/minimize and mode switching.
- Family/group entries are retained. Filtering sex/type G previously cut off Appaim?Ishi?Sheshan and later descendants. The Abraham nine-generation regression now includes 430 entries (previously 426). Existing saved arrangements are preserved; Gospel arrangement keys are account-specific.
- Regression coverage independently checks descendant reachability for all 23 non-Jesus presets, complete ordered Gospel sequences, unchanged source data, local spouse alignment, camera bounds, and expanded/circular account persistence. This is a coverage audit of imported family records; it does not fabricate missing relatives.

# Biblical genealogy explorer

## Dedicated map header and complete navigation (2026-10-07)

Fullscreen circle/tree canvases now occupy the area below a dedicated responsive header rather than extending beneath a gradient overlay. Header rows group identity/search/direction/generations/minimize, then family presets/zoom/fit/root-center and circle/tree icons. Zoom and mode buttons no longer sit at the bottom. Tree fit uses the actual unobscured canvas dimensions and can go below the former 4% minimum. Panning clamps at screen-relative margins so every graph edge can reach the viewport center at every supported zoom, while preventing unlimited empty-space drift. Center root person restores a readable view of the chosen root. Circle fit likewise allows a sufficiently small scale for its full extent. Geometry tests cover very wide trees and edge/center reachability across zoom levels; expanded-page regression covers preserved controls and state.

## Real People-page integration and expansion (2026-10-07)

People & genealogies / Families now uses the aligned tree with one straight stem per sibling group and C markers. Its Expand button opens a body-level fullscreen portal, initially in tree mode, with the current root/direction/generation count and both circle/tree mode buttons. Minimize appears in either expanded mode and returns current view settings to the embedded tree without navigating away. A 300ms clipped expansion/collapse follows the embedded SVG bounds; reduced motion skips it. Background content is inert and page scrolling locked while expanded; minimizing restores scrolling and focus to Expand. The embedded modern explorer supports nine generations/up to 600 people, matching fullscreen. Older notes saying the normal People page remains unchanged are superseded.

Regression test expands the real explorer, changes to Jacob/six generations, minimizes, and checks settings, animation phase, focus and scroll restoration. Existing drawer/mode-switch and family connection tests pass. The mock URLs remain available for comparison.

## Compact hierarchy toolbar (2026-10-07)

Owner rejected the search/filter card. Fullscreen hierarchy now uses the ring view's compact top-right control row: Find a person, direction toggle, generation number and Close. The right-side person drawer and C-marker connection list remain. Normal People-page filters are unchanged.

## Right-side controls and person drawer (2026-10-07)

Fullscreen family-tree search, generations and direction now live in a compact right rail beneath Close. Styling follows the Atlas PlacePanel: rounded bordered surfaces, subtle shadow, separated header/body/actions and a slim scrolling area. Person details start closed and open on node click or keyboard activation in a right-side card; Close and Escape dismiss it. A short entrance animation respects reduced-motion preferences. Cross-family connections share the rail; mode icons stay at the bottom right. The normal People page retains its existing inline layout. No node positions, relationship rules or camera behavior changed. Mounted-page tests cover opening Jochebed, closing/reopening, Escape and preserved view switching.

## Local co-parent alignment and two marker unions (2026-10-07)

Fullscreen tree presentation now puts Mahalath at the edge of Ishmael's children nearest Esau, with no sibling between the pair. Amram's sibling corridor and its owned descendants reflect toward Jochebed; Jochebed moves within her own family band to 132 units beside Amram's x-position where clear. The alignment helper clones positions/boxes, rejects overlapping reflections and never changes generation or source relationships. These are explicitly requested display rules for the identified people, not name-based parentage inference.

Hezron (Perez's son) with Machir's daughter, and Aaron with Elisheba, retain their primary child-group stems but replace their long co-parent joins with matching C markers beneath the parents. Clicking either marker highlights the connection and its people; the cross-family list is available again. Optional spouse links do not redraw the same removed joins. Tests verify adjacency/alignment, all-pairs person clearance, unchanged input, parentage coverage and four clickable marker endpoints for these two unions.

## Straight sibling-group connections in the tree view (2026-10-07)

The fullscreen conventional tree now uses `routeSiblingGroups`: one straight stem into each exact parent-set/generation/row sibling group and a shared horizontal sibling band behind the person circles. Additional recorded parents join the common stem; partial/shared-parent families are never merged into a false shared parentage. Single children receive one direct connection. Optional spouse/sibling edges stay straight. The conventional view no longer runs the expensive obstacle-routing/curve-sampling algorithm or starts its worker; routes are memoized, with straight SVG segments only. Normal People-page routing remains unchanged. This simplifies lines but does not guarantee no crossing for every cross-family relationship.

Tests verify exact parent-set grouping, coverage of every visible parent relationship, fewer primary stems, two-point straight geometry, no input mutation, and preserved circle/tree switching. The previous worker description below records an earlier implementation.

## Map presentation: circle and conventional tree (2026-10-07)

The circular mock pages now omit the modification panel by default. Two accessible icon buttons in the lower-right select Circular genealogy or Family tree. The conventional view reuses `GenealogyTree` from the real People genealogy page, entering with the current root, direction and depth, with nine generations and up to 600 people in fullscreen mode. The normal People page retains its existing defaults. The circular canvas remains mounted at full size while hidden, preserving its coordinates and camera when switching back. The conventional tree has search, generation/direction filters, person selection, zoom/fit and right-drag pan. Its family-connection routing runs in a worker for the large fullscreen branch, with pending/error status and cancellation when leaving. Source relationships are shared; circular presentation offsets are not imposed on the conventional layout. The modification controls remain available only as an explicit component option for maintenance/regression tests; no normal route enables them.

Validation: mounted-page test confirms no modification panel, both accessible mode buttons, the same 426-person branch, routing-worker request/termination and unchanged circular coordinates/camera after switching back. Type/lint checks and existing genealogy/routing tests pass. No browser or screen control used.

## Uniform close spacing for single-track generations (2026-10-06)

Compaction revision 2 removes the unused width left over from multi-track bands. At 100%, each single-track generation has an 80-unit band around its 54-unit person circles, with a 12-unit edge gap: centers are 92 units apart, including the last two rings. Band widths interpolate along with radius changes; 0 restores the baseline widths and positions. Multiple-track bands retain their needed width. Existing compressed views update once at their current slider percentage on reload. Undo restores the previous spacing without triggering the update again. The saved-spot checkpoint remains untouched. Source snapshot: `docs/genealogy-layouts/before-narrow-bands/`. Mounted-page tests verify equal generation 2-to-3 and outermost spacing, all-person clearance, camera stability and restoration.

## Current: family-aware ring compaction and saved spot (2026-10-06)

The fixed-angle slider below is superseded: it was blocked by tightly packed people even where most of a ring was empty. Bring rings closer now redistributes angular space in existing cyclic order, retaining extra clearance between different sibling groups. Capacity is calculated from actual person sizes and track offsets. Ring targets have 12 units between band edges, including the outer rings; spare radial gaps are filled inward. The control derives every slider value from one unchanged baseline, so changes do not compound. At zero it restores exact baseline angles and radii. Manual edits start a new baseline. No size multiplier, automatic fit, live optimizer or camera reset was added. Source relationships and straight connector rendering stay unchanged; this is not a graph-wide proof against every connector crossing.

**Restore saved spot** restores the per-view checkpoint persisted before compaction in `bible-family-bands-before-family-compaction-v1`. Checkpoint capture happens on next page load before the control becomes enabled; failed storage blocks compaction. Source snapshot before this change: `docs/genealogy-layouts/before-family-compaction/`. Tests verify substantial radius reduction in the 426-person Abraham view, 12-unit gaps between all neighboring generation bands, circle clearance, intermediate packing values, unchanged camera/sizes and restoration. Earlier entries below describe superseded experiments.

## Current: original person sizes and global ring spacing (2026-10-06)

Owner requested rollback of 2x sizing. Circle-2 now defaults to radius 27 (root 40), original labels and band thickness. On load, previously spaced views restore their saved pre-spacing offsets once, while backing up the current arrangements to `bible-family-bands-arrangements-v2-before-ring-compression`. The automatic 2x spacing effect is removed. Source checkpoint before this change: `docs/genealogy-layouts/before-ring-compression/`.

**Bring rings closer** is a global 0-100% slider: 0 restores its baseline radii; 100 brings each ring toward a 12-unit gap between band edges. Each ring stops sooner if its fixed-angle people need more circumference. Sizes, angular offsets, relationships and camera remain unchanged. No automatic fit or layout optimizer runs. Compression stores its original radii rather than repeatedly shrinking the previous result, so it cannot compound. Undo and persistence remain available. Individual ring size/width/track edits establish a fresh compression baseline. The older 2x experiment notes below are historical, not the current default.

## One-time spacing of the smooth 2x view (2026-10-06)

Circle-2 saves each existing single-track arrangement to `bible-family-bands-smooth-2x-checkpoints-v1` before spacing enlarged people. This browser checkpoint is created on the next load, before any offsets change; source code before this experiment is saved with checksums in `docs/genealogy-layouts/smooth-2x-source/`. **Restore 2x checkpoint** returns to that arrangement even after reload. Undo also restores it. Both suppress repeat spacing.

The pass preserves circle sizes, ring radii, tracks, cyclic person order and camera. Clear rings stay unchanged; crowded rings expand insufficient angular gaps, borrowing spare circumference when needed. No family-sector optimizer or camera fit runs for this pass. `spacingPass: 2x-v1` prevents reruns during interaction or reload. Failed checkpoint writes prevent spacing. Insufficient capacity leaves the arrangement intact and reports that more room is needed. Abraham's nine-generation view passes at 2x; some smaller-ring views genuinely lack circumference. Tests cover those outcomes plus all-pairs clearance for 426 rendered people, persistent restoration, hover and right-drag behavior. Source relationships and connector rules are unchanged.

## Stable baseline and controlled enlargement plan (2026-10-06)

The owner confirmed the pre-sizing rollback is smooth. Preserve its interaction behavior. Source snapshots and SHA-256 checksums are in `.local/genealogy-stable-before-single-track/`. Do not change sizing, family topology, automatic layout, persistence migrations and zoom behavior together again.

### First isolated experiment: one track per generation

Circle-2 keeps person radius **27**, root radius **40**, existing labels, ring radii, widths, zoom behavior, generation assignments and relationship data. Existing arrangements are projected to each generation's center track. Clear rings keep their exact angular offsets. Crowded rings retain cyclic person order, increasing only insufficient neighboring gaps and retaining the occupied arc's center. If a ring cannot accommodate its people, reject the conversion and keep the old arrangement; do not silently grow rings or shrink circles.

This conversion runs once per view and is marked `trackLayout: single-v1`. It does not run on hover, drag, zoom, resize or ordinary edits. The previous arrangement is retained in Undo, study history, and a `before-single-track` storage backup. Undo marks the restored view handled so it is not converted again. Tracks remain manually adjustable. New views and explicit automatic layout use one track by default. Existing arrangements do not run the family-sector optimizer during conversion.

Tests cover generated single-track layouts and conversion of existing layouts for five roots, six generation depths and both directions (60 combinations). Additional tests cover unchanged clear rings, no mutation of saved offsets, conversion idempotence, insufficient ring capacity, saved-view conversion and Undo without repeat conversion. These tests establish geometry and state behavior, not subjective browser frame smoothness. No browser control was used.

### Why the previous size experiment failed

The initial size change also changed ring spacing, track padding and sector allocation. The later migration replaced saved positions; fitting the expanded graph reduced camera scale, cancelling much of the apparent enlargement. A subsequent display multiplier compounded with already-enlarged stored sizes (216 times 4 became radius 864, versus original 27). These were multiple coupled changes, not a controlled size adjustment. Separately, hover renders can be costly, but the subsequent mounted-page tests did not demonstrate an idle self-running layout loop. Do not label that unconfirmed symptom an established infinite loop.

### Dependencies to separate before enlarging

| Concern | Current behavior | Required boundary for sizing work |
| --- | --- | --- |
| Person geometry | Radius 27; root 40; label 10/13; sibling band 54 | One absolute size factor based on these originals, never on a saved multiplied radius |
| Layout | Angles, ring radii, tracks and family ordering | Remain unchanged during a size preview |
| Collision checks | World-space circle radius plus clearance | Use the proposed visible size; report crowded pairs without moving them |
| Connectors | Circle-edge clipping, band anchors and paired-parent junctions | Recalculate endpoints once from proposed size and unchanged positions |
| Pointer interaction | Circle hit targets, pointer capture, angular dragging and track selection | Keep capture owner and drag baseline stable for the complete gesture |
| Camera | D3 transform, initial fit, explicit Fit and resize handling | A size adjustment must not call Fit or recreate the zoom controller |
| Persistence | Per-view arrangements and study/Undo history | Store an explicit size preference independently; no automatic layout migration |

At zoom `k`, a circle's screen diameter is `2 * radius * k`. If radius and the fitted graph extent both double, the fitted circle may appear unchanged. Measurements must compare at **the same camera transform**, and separately report fitted overview readability.

For two equal circles on a ring of radius `R`, minimum angular separation is `2 * asin((2*r + clearance)/(2*R))`. For `N` evenly spaced people, the necessary circumference-capacity check is `2*R*sin(pi/N) >= 2*r + clearance`. Family constraints and uneven spacing can require more room; passing this simple bound does not guarantee a feasible genealogy layout.

### Enlargement sequence after the one-track review

1. Confirm this one-track version remains smooth before changing circle size. Preserve the previous layout and exact camera transform as the comparison baseline.
2. Consolidate the original circle, root, label, band and collision sizes into a shared geometry definition, with parity tests proving factor 1 changes no coordinates, endpoints or interaction behavior.
3. Add a small, reversible absolute-size preview, starting at 1.25x. Keep positions and camera fixed. Run a non-mutating clearance audit once per size change. Do not rebalance from effects or pointer movement.
4. Offer spacing as a separate intentional operation only if needed, with a candidate preview, collision/crossing checks, unchanged family order and Undo. Ring expansion and camera fitting must be separate choices too.
5. Verify persistence/reload, Undo/Redo if available, pan from blank space and nodes, wheel zoom, individual and family drag, release-only overlap rejection, selection and connection highlighting. Test root/depth changes and the angular seam.

Acceptance: no background layout runs; no coordinates, camera transform or ring sizes change during sizing; no multiplication of a prior saved size; no extra pointer capture cancellations; no new parent/child generation changes. An integration test must distinguish DOM rendering work from layout invocation, and any frame-performance claim requires actual measurements rather than inferring smoothness from passing geometry tests.

The `/study/people` collection opens with **People & families** selected. Below the collection cards, an SVG family explorer offers drag, wheel/pinch zoom, keyboard panning, fit, person search, six starting families, one to five generations, ancestor/descendant directions and spouse/sibling filters. Selecting a person opens a summary, first reference and their existing Scripture-linked directory entry. **Prophets through time** slides the lower panel into the existing timeline and prophet directory; the cards stay in place. The selected panel is recorded in `?view=prophets`, including browser back/forward support. Reduced motion is respected. The standalone `/study/prophets` route remains available.

## Records and limits

The explorer starts at five generations, showing the next layer of ancestors and descendants immediately. The generation selector still supports one through five generations.

`public/content/study/genealogy.json` projects the 3,130 existing STEP TIPNR person identities and matched family links. Refresh after rebuilding the source study data:

```powershell
python -X utf8 scripts/build-genealogy.py
```

No model calls or knowledge-base writes occur. Person identities remain distinct even when names match. Reciprocal parent/child and spouse/sibling records are deduplicated for display. Each branch is capped at 120 people; additional relatives are one-hop context, not recursively expanded. Re-root on a selected person to continue exploring.

These are the source's recorded relationships, not independent theological conclusions. Parent links do not distinguish biological, adoptive or legal descent. The explorer does not harmonize Matthew and Luke. The existing STEP attribution, CC BY 4.0 license and AI-adapted summary notice remain on the page. Missing/unmatched source links are not invented.

## Validation

`src/lib/genealogy.test.ts` covers reciprocal deduplication, unknown identities, ancestor/descendant direction, nonrecursive relatives and bounded cyclic traversal. TypeScript, scoped lint and production build verify the UI integration. Local preview uses port 8931; production release is separate.

## Node appearance

People are circles containing only their full names. Circle outlines identify the recorded era, with a legend for the eras in the current branch. Selection adds an outer dashed ring without replacing the era color. Generation rows are spaced 465 SVG units apart, three times the previous spacing.

## Family layout and identity cleanup

The explorer excludes STEP group identities (s=G) from search and traversal. The person identity israel-gen-25-26 is displayed as Jacob / Israel; source IDs and relationships are preserved. Source placeholder names have underscores removed, and numbered Unnamed labels display as Unnamed person.

Generation layers use alternating parent/child ordering sweeps rather than alphabetical order, then align children with parents when space permits. This reduces avoidable crossings without deleting links or rewriting ancestry. Verified the actual Adam branch places Irad above Mehujael and Kenan above Mahalalel, and the Jesus branch places the imported father-of-Elizabeth record above the imported wife-of-Heli record. These placements retain source identifications, not independent endorsement of disputed genealogical interpretations. Shared ancestry can still require crossings.

Selected life sits directly beneath the canvas; the era legend follows it. The visible instructions, counts, branch-limit message and relationship key are removed. Keyboard instructions remain available to screen readers; traversal remains bounded at 120 people.

## Balanced branch placement (2026-10-06)

Replaced the one-sided horizontal collision shove with alternating parent/child relaxation and pooled-adjacent-violators projection of each generation onto non-overlap constraints. Parents move toward the middle of their child span; children move toward their parents; both directions contribute equally so a large family does not overwhelm the whole ancestry. Circle pitch is 144 units (104-unit circles plus clearance), while generation spacing remains 465. Bounds are computed from the final positions. Source identities, edges, generation assignments and the 120-person cap are unchanged.

On the held corpus, default five-generation Both/Spouses branches: Abraham total horizontal parent-child span fell from 285,236 to 104,811 units (63.3%); Jacob from 154,908 to 88,331 (43.0%). This measures sideways link distance, not a guarantee of zero crossings. Seven regressions pass, including the actual Abraham branch, non-overlap, bounds and deterministic placement; TypeScript, scoped lint, build and local browser visual check pass.

Reviewed upstream ELK (https://github.com/kieler/elkjs) and d3-dag Sugiyama (https://erikbrinkman.github.io/d3-dag/interfaces/src.Sugiyama.html). Both provide automatic directed graph layout. No dependency was added: this change improves the existing generation-preserving renderer synchronously. Manual node editing is not implemented.

## Generation bands and tiered sibling groups (2026-10-06)

Each relative generation is now a bounded horizontal SVG band. Roman numerals run separately upward for ancestors and downward for descendants; Self marks the selected person's generation. Hover or focus the band label to highlight it, click to pin/unpin, and Escape clears the highlight. Hover/focus a person emphasizes their visible parents, siblings sharing a recorded parent, children and partners. Generation and family highlights dim unrelated nodes and links.

Rows with more than 14 people stagger entire descendant-family groups into two presentation tiers within the same band. Every sibling group stays on one level; groups sharing any recorded parent are locked to the same tier, including half-siblings. Source generation values never change. Clusters use the complete matched recorded parent set, even for parents outside the displayed branch; distinct parent sets stay separate and unknown-parent identities are not combined. Exact-parent sibling groups share incoming connector trunks; each family connector branches to siblings on one horizontal row. All original relationship endpoints remain represented.

Canvas selection and the SVG perimeter outline are disabled during mouse interaction, fixing the four-sided drag highlight. Keyboard focus is indicated at the zoom controls and individual generation/person controls. Pan, zoom and reduced-motion behavior are retained.

Nine layout tests, TypeScript, scoped lint and the local production build pass. Browser checks verified band pinning, two-tier rendering, Escape reset and actual drag with computed outline:none and user-select:none. The earlier horizontal-span measurements describe the preceding single-row layout, not this tiered version. Production deployment remains separate.

Correction: siblings are never split across tiers. The stagger is between different descendant families (for example, the children of two siblings), not between children within a family. Eleven regressions now verify this, including large sibling groups and half-siblings. Local build, types and lint pass.

## Exclusive family corridors and obstacle-aware routes (2026-10-06)

Descendant families now receive exclusive horizontal corridors sized recursively by their visible descendants. Siblings remain level; only different descendant families stagger. Corridors stay separate even when their families occupy different tiers, preventing a lower family from sitting beneath an unrelated upper family. The layout may be wider by design. Choosing an ownership parent for sizing is only a layout scaffold; all source parent relationships remain represented.

`src/lib/genealogy-routing.ts` builds shared sibling connectors and orthogonal routes on a compressed visibility grid. Family boxes, reserved endpoint exits and previously routed unrelated wires are obstacles. Legitimate shared parent trunks and same-family junctions are allowed to meet. Default five-generation Abraham routes entirely with no continuation markers.

When this router cannot produce a noncrossing path (especially cross-family marriages and secondary parent links), it uses matching C-number continuation markers at both ends rather than drawing through other wires or silently dropping the relationship. A Cross-family connections disclosure lists these links; clicking a marker or list item identifies the relationship and highlights both ends. These markers are a routing fallback, not a claim that the genealogy is mathematically nonplanar. Jacob currently needs one continuation; the more densely interrelated David view needs more.

Seventeen tests pass. Routing tests cover all six presets with default five-generation Both/Spouses settings, verify every source relationship has a routed or continuation representation, and reject crossings between unrelated wires and entries into unrelated family rectangles. TypeScript, scoped lint and build pass. Browser verification checked the full Abraham layout plus Jacob continuation selection/clear. This supersedes earlier compact-layout metrics. Local preview only.


## Taller bands and smooth connectors (2026-10-06)

Generation bands are now 380 units tall (800 for staggered descendant families), with 420 units between bands. Distinct family tiers are 420 units apart; siblings and half-siblings remain level. Horizontal family corridors remain exclusive.

Routing now tracks incoming direction and charges for turns, avoiding the many equally short staircase paths. Visible elbows use quadratic curves, with radii up to 140 units where space permits. Each curve stays within a checked rectangular envelope that avoids family boxes, unrelated original wires and other unrelated curve envelopes. Tight constrained turns receive a smaller radius. Continuation markers still preserve connections that cannot be routed safely.

All 17 genealogy tests pass, including new curve-envelope clearance assertions across the six presets. TypeScript, scoped ESLint and local build pass. Local preview only.


## Density-aware tiers and central large branches (2026-10-06)

Tier decisions now happen after exclusive horizontal corridors have been allocated. A generation uses two tiers only with more than 14 visible people, multiple independent sibling groups and occupied person pitches exceeding 55% of its horizontal span. Sparse generations remain level regardless of headcount. Half-siblings remain locked together. Tier alternation follows final left-to-right family order, not the earlier provisional order.

Within sibling groups and each parent's family branches, the widest descendant subtree is placed centrally with smaller subtrees balanced on either side. This changes presentation only; parent identities and generation numbers remain unchanged. Width reduction/proximity work is deferred to the next requested refinement.

The real Abraham regression explicitly requires descendant generation II to have one level and IV to retain two. All 17 tests, TypeScript, scoped lint and local build pass; six preset routing checks still include curve clearance and every recorded connection. Local preview only.


## Adaptive branch contours and direct parent links (2026-10-06)

Replaced full-height descendant rectangles with recursive per-generation contour packing. Short branches can sit beside a deep branch's narrow upper levels, while family rectangles retain clearance on each generation. Actual sibling boxes shrink to their member span. Larger subtrees retain central ordering. Tier decisions now compare adjacent family groups for local density rather than using the entire generation; half-siblings remain level.

Removed synthetic family junctions and shared sibling buses. Every rendered parent link is a cubic curve from the parent's circle to the child's circle, carrying exactly those two identities. Three curve tensions are tried against family obstacles and reserved unrelated links. Parent links that cannot fit use the existing paired continuation markers rather than a branching detour. Abraham's default view requires no markers. Spouse/sibling routes retain obstacle-aware rounded routing with per-route obstacle caching.

Geometry validation samples each cubic at 96 intervals; this is a numerical clearance check, not an analytic proof for every possible branch. All six preset checks pass. Twelve layout regressions plus six routing regressions pass, including a short branch beside a 20-child subtree, Abraham generation II on one level and IV on two, and direct two-person parent paths. Types, scoped lint and local build pass. Browser verification confirms the rebuilt Abraham view uses direct curves. Local preview only.


## Compact sparse generations (2026-10-06)

Generations with at most three people spanning no more than 500 SVG units now use compact presentation: no full-width background band, a generation label 220 units left of the first node, and 280-unit row pitch instead of 800. Wide or populous generations retain broad bands and existing local tier logic. Labels preserve highlighting and keyboard interaction. This is derived from visible geometry, with no person-specific overrides.

19 tests pass including a compact single-file ancestry regression and all six routing presets. Types, scoped lint and local build pass.


## Circular genealogy mock (2026-10-06)

Separate full-screen prototype at /mock/genealogy-circle, outside the site's header/footer shell. Reuses the local family records and branch selection, then projects generations onto concentric colored rings. Includes drag/pinch/wheel zoom, fit controls, family presets, search, ancestor/descendant toggle, 1-5 rings, ring highlighting, person selection and recentering. Existing study genealogy is unchanged. This is a visual experiment: radial curves do not yet use the production no-crossing router, and complex cross-parent relationships may cross. Spouse/sibling edges are omitted in this mock. Types, scoped lint and build checked; browser visually reviewed.


## Circular mock manual arrangement controls (2026-10-06)

The separate circular mock now starts at 300% ring radius, adjustable from 100% to 600%. Physical ring size is independent of camera zoom; resizing preserves angular arrangements and rejects sizes that violate node clearance. Fit circles uses the current radius. Person-disc sizes stay fixed.

Lock & move offers person only, person plus ancestors, person plus descendants, or person plus both. Both traverses each direction independently so it does not accidentally pull in siblings through an ancestor. Pointer dragging rotates the locked visible group by one angular delta while preserving each member's ring and all relative angles. The center remains fixed; Rotate left/right can rotate its relatives. Pan remains on the background; wheel zoom also works over people.

Every proposed rotation checks Euclidean circle clearance, including the angular seam and different rings, with 10-unit clearance beyond the discs. Colliding drag previews return to the starting positions; a blocked drop or pointer cancellation restores the original arrangement. Successful drops commit together. Undo and Reset view are provided. Arrangements and ring sizes save to browser localStorage by root/direction/depth; undo history is session-only. This persists presentation, never edits source genealogy. Radial connector crossing avoidance remains a prototype limitation.

Seven focused tests verify direction scopes, cycle handling, rigid rotation, wraparound collision and resizing clearance. Types, scoped lint and local build pass. Browser verified Benjamin locks 12 people, a colliding drag restores positions, a clear drag saves, reload restores its exact transform, Undo works, and ring-size keyboard control changes 300% to 310%. Test moves were reset afterward.


## Learning layout rules from manual examples (2026-10-06)

The circular editor now captures an automatic baseline (named nodes, angles, radii, generations, edges and algorithm version) on the first recorded action for each root/direction/depth. The latest 200 events persist in browser storage: drag, rotation button, ring resize, reset, undo and blocked/cancelled attempts. Each includes timestamp, selected person, lock scope, affected IDs, before/after arrangement and whether accepted. Older event count is reported rather than silently implying complete history. Edits made before this recorder cannot have their sequence reconstructed.

The bottom-right panel includes Explain your choices and Export layout study. The JSON export contains captured baselines, exact edited arrangements, events and notes, plus comparisons: normalized rotation by person, visible descendant counts, angular ring order, minimum disc clearance and mean parent-child angular separation. Baseline metrics at BOTH default and edited radii distinguish simple enlargement from angular improvements. These are descriptive measurements, not a learned quality score. Existing saved arrangements remain intact. No data is uploaded.

Workflow for generalizing an example:
1. The user arranges a branch and exports the study, adding optional intent notes.
2. Read that artifact and reconstruct original/edited geometry. Separate accepted edits from undo/reset and failed proposals; account for truncated history.
3. Describe candidate structural rules (branch-size allocation, sibling order, family angular span, parent placement relative to children, minimum clearance). Avoid person-name exceptions.
4. Implement a versioned candidate layout and compare its distance from the user's preferred geometry after removing global rotation/scale differences. Preserve ancestry and generations as hard constraints.
5. Validate against other roots/depths, dense and sparse branches, shared-parent networks, collision and link-crossing checks; inspect before/after views. Do not infer a universal preference from one example or equate shorter edges with better theology/readability.
6. Only then integrate the general rule into automatic layout. Keep manual examples as regression fixtures.

Capture/export is implemented; automatic preference fitting and cross-tree rollout are not. Ten editor/comparison tests, types, scoped lint and build pass. Browser confirmed the new export control and its completion status; the downloaded file's final destination was not verified. Source families and the production study graph remain unchanged.


## Drop-only snap-back and independent rings (2026-10-06)

Drag previews now always follow the pointer, including temporary overlaps. The existing collision result controls acceptance on pointer release only; an invalid drop restores the pre-drag group. A clear drop commits. Pointer cancellation also restores the original arrangement.

Ring sizing is now per-generation via optional ringScales, preserving old global-scale saves as defaults. The slider is faded/disabled until a visible ring is selected. Click either the band stroke or its generation label. Only that ring and its people change radius; neighbors remain fixed. Resizing rejects node collisions and ring separation below 90 units. Undo, persistence and layout-study exports retain individual ring sizes. Browser checked disabled-to-enabled selection and generation I changing from 570 to 579.5 units while the other radii stayed 1140/1710/2835.883; test resize undone. Eleven editor/export tests, types, lint and build pass.


## Circular sibling spacing and shared trunks (2026-10-06)

Empty canvas clicks and Escape clear ring and hover highlighting. Background pan gestures retain selection through D3's click-distance suppression. Family spacing targets either the selected person's visible same-ring siblings (shared recorded parent, including half-siblings), or their visible children. Tighten/Spread adjusts angular distances around each group's shortest-arc midpoint, handles the 0/360 seam, preserves ring membership, and rejects collisions. It moves the named sibling group only, not their descendants. Changes support Undo, local persistence and layout-study event recording.

For this circular mock, parent links now bundle per recorded parent and child generation. A common trunk leaves the parent circle and splits at 75% of the radial interval toward the child ring; distinct terminal curves retain each recorded child connection. This supersedes the mock's earlier individual full-length paths, without changing the production study graph. Secondary parent facts remain separate parent bundles. Crossings remain possible in this experimental radial layout.

13 focused editor/export tests pass, including seam-safe tightening and reciprocal spacing. Types, scoped lint and build pass. Browser verified empty-space deselection disables the ring slider and tightening Benjamin's 11 children succeeds; test movement undone.

## Circular routing, sibling bands and pinned highlights (2026-10-06)

The circular mock routes parent trunks and child terminals in polar coordinates, interpolating radius monotonically and easing angular displacement along the short arc. This keeps adjacent-generation connectors in the space between their endpoint rings instead of letting a Cartesian curve cut through the interior. Shared trunks still split 75% of the way toward the children. This is annular routing, not a general obstacle solver: links spanning skipped generations and crossings between families may still need further work.

Lighter, wide arcs connect neighboring siblings along their own ring. Bands break at unrelated people and avoid wrapping across a large empty gap. Clicking a person pins highlighting for their connected ancestors and descendants; hovering temporarily previews another lineage, and clicking empty space or Escape restores the normal view. Existing saved arrangements are preserved.

Validation: 16 focused tests pass, including annular path bounds and sibling-band breaks. TypeScript, scoped ESLint and production build pass. Local browser view checked with the saved Abraham arrangement.

- 2026-10-06: Connections touching the center person are now direct straight lines, trimmed to each person's circle edge, in both ancestor and descendant views. Outer-ring connections retain curved routing and shared trunks; sibling bands remain visible. TypeScript, scoped ESLint and build pass.

- 2026-10-06: All noncentral family bundles now stagger branch departure by angular distance from the sibling midpoint: outermost children split at 35% of the radial interval, middle children at 82%, with continuous interpolation between. Departure points follow the same eased trunk. Recomputed from current positions after manual edits; works inward and outward and across the angular seam. Center connections remain straight. Five routing tests, types, scoped lint and build pass.

- 2026-10-06: Fixed dangling shared-trunk tails in even sibling groups such as Jokshan's children. Trunk now ends at the furthest actual departure point, retaining the original curve parameterization so branch joins stay aligned. Six routing tests and TypeScript/build pass.

- 2026-10-06: Second generation band widened to 160 without changing its radius. Third generation has two concentric tracks; fourth and later generations have three. Whole sibling groups share a track, assigned in family order; node collision checks, resize candidates, sibling arcs and parent bundles use actual track radii. Track spacing scales with the selected ring. Layout-study baseline uses radial-family-tracks-v2. Types, scoped lint and build pass. These tracks reduce crowding but do not constitute a universal edge-crossing solver.

- 2026-10-06: Tighten siblings now compresses available angular gaps individually, preserving the collision clearance for pairs already close together. Previously the uniform 15% contraction could reject an entire group because of one close pair even when other gaps had room. Ten editing tests and TypeScript/build pass, including seam-safe constrained tightening. External-person collision checks still reject unsafe proposals.

- 2026-10-06: Added Balance family beside sibling spacing. Selected siblings/children are compacted with uniform angular spacing on each track, symmetrically centered on their parent's radial direction (current midpoint when parent is the center or unavailable). Maintains sibling order and minimum circle clearance. Entire proposal is rejected if any affected person overlaps another; accepted changes persist, record layout-study events and support Undo. Eleven editing tests, TypeScript, scoped lint and build pass.

- 2026-10-06: Ring width (80-600) and track count (1-6) now editable after selecting a ring. Track centers are equally spaced across width minus 32 units of edge padding on each side; one track is centered. Width is independent of center radius and radius scale. Whole sibling families cycle through tracks. Geometry updates validate affected-person collisions, persist and support Undo. Defaults retain generation track counts 1/1/2/3; track offsets now derive from actual width rather than a hardcoded 80-unit spacing. TypeScript, scoped lint and build pass.

- 2026-10-06: Sibling bands now match the 54-unit person-circle diameter. Dragging a person inward/outward chooses the nearest track within that person's generation ring; angular movement retains existing locked-group behavior, while track reassignment applies to the grabbed person. Preview updates connectors and bands; collision checking uses the candidate track radii, and invalid drops restore original geometry only on release. Per-person track overrides persist, export with arrangements, support Undo, and clamp when track count decreases. Types, scoped lint and build pass.

- 2026-10-06: Sibling bands now support pointer/keyboard family selection. Straighten siblinghood processes the selected family and visible descendants from parent outward, packing each same-track sibling group evenly around its parent's updated radial direction. Keeps generation/track assignments and sibling ordering, checks final affected-person collisions, rejects unsafe proposals, persists accepted layouts and supports Undo. Balance family remains available for the immediate group only. TypeScript, scoped lint and build pass. Compact symmetric heuristic, not a globally optimal graph solver.

- 2026-10-06: Balance family now respects ring selection. With a ring selected, groups all visible people on that generation by recorded parent and actual track radius, balances each group toward its parent, then collision-checks the combined proposal. Single-family selection retains previous behavior. Ring-wide updates are atomic, saved and undoable; unsafe results retain original positions. TypeScript, scoped lint and build pass.

- 2026-10-06: Any sibling-band segment now selects the whole recorded siblinghood for that generation, with all segments visibly selected together. Band pointer drag rotates all siblings as a group and assigns them together to the nearest track in their generation ring, preserving angular spacing. Pointer capture is held on the stable SVG canvas so track changes do not cancel the gesture when band elements rerender. Whole-group candidate collision checks retain drop-only snap-back; Undo/persistence/event capture remain supported. TypeScript, scoped lint and build pass.

- 2026-10-06: Balance family now packs each selected same-track sibling group around its existing midpoint, without alignment to ancestors or movement of descendants. Ring-wide Balance retains this behavior for every family on the selected ring. Circle clearance uses the shared collision threshold plus a small numeric margin; connectors redraw from the new person positions. Straighten siblinghood remains the separate ancestor-alignment action. Twelve editing tests, TypeScript, scoped lint and build pass.

## Curved generation mock (2026-10-06)

New separate route /mock/genealogy-curves uses broad open arcs from a virtual 12,000-unit circle center, with generations layered downward. No closed generation rings are drawn. Copies the circular mock's controls, person/siblinghood track dragging, compact balancing, ancestor straightening, widths/tracks, selection, Undo and layout capture. Saved arrangements and capture logs use separate curved storage keys; circular mock remains unchanged. Pan/zoom and pointer coordinates account for the shifted circle center, and Fit curves frames visible people. TypeScript, scoped ESLint and build pass; local browser screenshot reviewed. This remains an exploratory mock; global edge-crossing optimization and export-model calibration for the virtual center remain future work.

- 2026-10-06: Curved mock flattened further: virtual radius 36,000 with one-third angular span, retaining broad horizontal capacity with substantially less sag. Default generation widths are 600 (maximum) and six equally spaced tracks (maximum). Default Lock & move is This person only. Base generation spacing increased to accommodate wider bands. Existing explicitly saved widths/counts remain respected. TypeScript, scoped lint and build pass.

- 2026-10-06, production genealogy camera: Background dots now follow pan translation and zoom spacing (minimum 6px to stay legible). Noncompact generation bands dynamically span the viewport in world coordinates, eliminating visible left/right endpoints. D3 pan bounds cover family extents with 160-unit padding, and minimum zoom is the fitted-family scale. Keeps compact-generation exceptions and existing graph layout. TypeScript, scoped lint and build pass.

- 2026-10-06: Circular mock adds Sibling connections: Staggered splits or One movable branch point for the selected family. Point mode draws one parent-to-junction stem and direct junction-to-child links across all tracks. Junction drag is independent of people/rings, captures on the SVG, previews freely and persists coordinates with Undo and layout-study events. Switching back restores staggered routing. Source genealogy relationships are unchanged. TypeScript, scoped lint and build pass.

- 2026-10-06: Removed production genealogy's dotted background and its zoom-time background updates after dense zoomed-out dots obscured the tree. Stage uses a plain surface; viewport-wide generation bands and bounded pan/zoom remain. Build passes.

## Manual reference and automatic family sectors (2026-10-06)

The owner's manually arranged Abraham / descendants / four-generation view is preserved in docs/genealogy-layouts/manual-2026-10-06.json (116 actual rendered person positions, all saved arrangements, settings and the last 200 edit events). Its history is truncated, so it cannot reconstruct every earlier decision. The public/content/study/genealogy-manual-reference.json restore fixture includes the active arrangement, actual geometry, and SHA-256 of the full report. Save was verified before resetting. The temporary localhost checkpoint receiver was stopped after capture.

Observed preferences, confirmed by the owner: terminal siblings form tight contiguous groups; large siblinghoods use longer outer tracks; small families use inner tracks; growing branches occupy the edges of sibling groups, with childless siblings together between them. Allocate enough angular room for descendants so parents can align with their own families. In this algorithm, terminal means no further relatives in the visible branch, not a historical claim about childlessness.

Apply layout rules implements these principles from topology and visible generation counts, without names or manual-coordinate lookups. It selects a placement parent for shared descendants, retains every recorded relationship for rendering, measures subtree angular demand from the outside inward, and lays out disjoint sectors from the root outward. Growing branches are ordered by visible subtree size toward the two edges; terminal siblings use equal compact gaps. Family size selects inner/middle/outer tracks; generation bands and radii are recomputed. Crowded trees expand their radii until sectors fit. Final circle collision checks reject unsafe results. The algorithm is deterministic, supports Undo and saved arrangements, and is opt-in on the circular mock. Curved and production layouts are unchanged.

Manual vs generated Abraham geometry: both contain 116 people. Minimum circle-edge clearance is 10.001 vs 12.000 units. Mean absolute parent/child angular separation excluding the center is 10.623 vs 8.763 degrees (about 17.5% lower). This is an alignment measure, not a guarantee of fewer rendered crossings or a complete visual-quality score. Shared-parent links remain possible crossings. Source facts are not removed to force a tree. Comparison and generated geometry are saved beside the manual report.

Browser verification: reset to the earlier arrangement, applied the new rules, inspected the result, restored the manual reference, and verified the rendered count and coordinate checksums exactly match the saved reference. Returned to reset-plus-automatic result afterward. The UI exposes Apply layout rules and Restore manual reference. Thirty-three focused tests pass, including five roots in both directions with no overlapping circles, deterministic output, unchanged person membership, and compact leaves between growing branches. TypeScript, scoped lint and production build pass.

The legacy export comparison cannot model all later per-person track overrides; the report now includes renderedGeometry and generationRadii for accurate reconstruction. Original pre-edit baselines and event history remain preserved. No statistical model has been trained from this one example; this is an explicit general algorithm based on the owner's stated principles.

## Five-generation family-band comparison mock (2026-10-06)

/mock/genealogy-circle-2 is a second circular mock sharing the editing component with an explicit familyBands variant. It starts at five descendant generations and applies family-sector layout rules automatically for unsaved views. Browser arrangements/history use distinct family-bands keys. Navigation links connect the original and second mock. The original manual reference and first circular arrangement remain independently stored.

Each recorded parent's same-track sibling band receives one stem ending at the band's edge/midpoint; single children receive one connection to their circle. No individual child fan paths or movable junctions are drawn in this variant. If a user splits siblings across tracks, each resulting physical band receives its own stem; distinct recorded parents retain their own relationship connections. Band click/drag, person drag, track/width controls, Balance family, Straighten siblinghood, Undo, layout rules and export remain available. Stems use a constant screen stroke for visibility at overview zoom.

The comparison limit is 600 people and a visible footer says whether the selected branch is complete or capped. Abraham at five generations contains 182 people, including 66 people in generation V, with no omissions (the old 180 cap would omit two). Browser checked 182 person nodes, 40 family stems and zero individual fan paths. Forty-three focused tests pass, covering four/five generations across five starting people and both directions, circle collisions, editing and routing. TypeScript, scoped lint and production build pass; browser overview reviewed. This compares visual scaling; it does not claim that readability is solved at every zoom or for arbitrarily large branches.

- 2026-10-06: Extended the family-band mock to six generations by default, with a VI ring label and the original mock retaining its five-generation control limit. Abraham now shows 263 people, including 81 in generation VI, with no omissions. Browser verified 67 family stems and zero individual fan paths. Saved layouts remain keyed by depth, preserving the five-generation arrangement. Expanded this variant's ring-size range and saved-layout validation to 12x because Jacob's six-generation automatic layout needs about 8x on its outer ring. Automatic placement rules and sibling-band connections are unchanged. All 53 focused tests pass across four/five/six generations, five roots and both directions; TypeScript, scoped lint and build pass. Browser overview reviewed.

- 2026-10-06: Corrected misleading parent-to-person appearance in the family-band mock. Amram shares a displayed generation with Aaron/Moses/Miriam because the shared branch traversal reaches them through Jochebed's shorter lineage; the recorded father/child relationships remain intact. Same-generation stems now curve through inner clear space and sibling-group endpoints attach between people on an actual uninterrupted band, rather than at a central person's circle or an unrelated-family gap. Single-child connections remain direct to that child. Browser verified Amram's stem clears Aaron/Moses/Miriam (minimum center distances 98/291/115, circle radius 27), while retaining 263 people and 67 stems. Added routing regressions; all 56 focused tests, app types, scoped lint and build pass. No person coordinates or source relationships changed.

## Ordered generations and co-parent proximity (2026-10-06)

The family-band mock now opts into longest-path generation layers, topologically ordered so every visible recorded parent precedes their child. This replaces shortest-path placement for this variant only; the shared production branch default is unchanged. Layers outside the selected depth are excluded. Contradictory parent-child cycles raise an explicit error rather than silently reversing a relationship. Full siblings with the same recorded parents share a layer; half siblings with a later-generation other parent can occupy different layers. These layers are a presentation of ancestry, not dates or equal distances through every lineage.

Verified Abraham: Amram V, Aaron/Moses/Miriam VI; Hezron V, daughter of Machir VI, Segub VII. Six layers now contain 256 people; seven contain 337, with no display-cap omissions. VII is available in the control, default remains VI. Fit supports the smaller zoom needed to show the full seven-ring arrangement.

Automatic placement now considers secondary parents and co-parent pairs. A bounded deterministic search reorders whole nested family sectors to reduce angular separation, preserving sector boundaries and person clearance. Connected parents move toward the facing ends of their sibling groups; unrelated terminal siblings remain compact. Mahalath is on the facing end of Ishmael's group toward Esau/Reuel, and Isaac/Ishmael's sectors become neighbors. Hezron and Machir's daughter are brought nearer when Segub is visible. This is a local improvement heuristic, not a promise that every shared-parent line can avoid every crossing.

New family-band v2 browser keys prevent old coordinates from being silently applied to corrected layers. Prior v1 arrangements/history remain stored, and the archived manual reference is unchanged. Within the new layout, subsequent Apply layout rules and edits retain Undo/history.

Right-button dragging pans from any graph element; left-button person/family editing remains independent. The graph suppresses its browser context menu for this gesture. Grabbing cursors depend on actual pan/edit state rather than the CSS active state shared by all mouse buttons.

Validation: 79 focused tests pass, including four through seven layers, five roots in both directions, strict parent-before-child ordering, named regressions, facing-end placement, deterministic output and collision checks. TypeScript, scoped lint and build pass. Browser checks confirm corrected layers and counts.

- 2026-10-06: Owner requested straight ancestry connections. Family-band mock now draws each parent-to-band stem as one straight segment, clipped at the parent circle (and child circle for singleton families). Stroke increased slightly from 1.15px to 1.4px with non-scaling screen width. Curved sibling bands, generation ordering, positions and controls remain unchanged. This supersedes the curved connector detour in this variant. Types, scoped lint and build pass.

- 2026-10-06: Clarified paired-parent rendering: the father's straight stem goes to the shared children band, and the mother's orthogonal branch joins the midpoint of that stem at 90 degrees. Consolidation applies only when both visible parents have exactly the same displayed child group on the same track, avoiding attribution of unrelated half siblings. The sibling band is drawn once. Source sex selects the father as the main stem where recorded. Unpaired stems remain straight at 1.4px. Ten routing tests, types, scoped lint and build pass.

- 2026-10-06: Maternal junctions now use the midpoint only when it is forward of the mother. Otherwise the join advances toward the children with clearance for her circle; the final turn remains perpendicular. If manual positioning leaves no forward junction on the father's stem, the mother connects directly to the child group instead. Shared-child-set matching remains strict: Mahalath's Reuel connection is not merged with Esau's whole five-child band. Twelve routing tests, types/lint/build pass.

- 2026-10-06: Owner clarified that the spousal junction belongs at the center of the empty space between generation rings. Replaced line-midpoint/mother-projection rules with an exact line-circle intersection: junction radius is halfway between the parents' ring boundary toward the children and the children's near ring boundary. Uses actual ring widths/radii; for parents on different rings, the nearer boundary controls. Mother still joins the straight father stem at a right angle. Eleven routing checks (including track-independent location and inward/outward angled stems), types/lint/build pass. Supersedes prior midpoint-forward rules.

- 2026-10-06: Family-band mock now opens at VIII and supports eight generation layers, with a distinct eighth color and Roman numeral. Abraham shows 391 people, 58 in VIII, no display-cap omissions. Increased the variant's supported ring-size range to 16x so Jacob's eighth ring (about 12.65x) persists correctly. Existing depth-keyed saved layouts remain intact. All 91 focused tests pass, covering four through eight layers across five roots and both directions, ordering/collisions and routing; types/lint/build pass. Browser verified the VIII label, counts and fitted overview.

- 2026-10-06: Added collision-checked continuation alignment for single-child chains. The next circle lies on the ray of its incoming paternal connection (recorded sex preferred), so Hezron -> Segub -> Jair no longer changes direction at Segub. A generation-skipping paternal connection is supported, with maternal junction geometry unchanged. Applied during automatic layout; existing edited layouts retain their coordinates until Apply layout rules is used. Depth IX is now available and the default, with its own color/label: Abraham has 426 people, 35 on IX, no display-cap omissions. Old depth saves remain intact. 101 focused tests pass, including explicit collinearity/direction checks at VIII and IX, all root/direction/depth collision checks; types/lint/build pass.

- 2026-10-06: Repaired over-aggressive chain straightening. A collision-free destination alone had allowed people to leap past neighboring families, and moving one circle could strand its descendants. Alignment now moves an entire placement subtree together, rejects changes to ring ordering, and skips children shared by multiple visible parents. If exact straightening requires crossing another family's space, keep the existing family order. Supersedes the unconditional Hezron-chain collinearity claim above. All 101 checks pass with new per-generation ordering comparisons against the unaligned sector layout, alongside collisions and ancestry ordering. Types/lint/build pass. Applied revised rules to the current IX view through the UI: 41 positions adjusted, 426 people preserved, zero generation changes, Undo enabled; browser overview reviewed.
- 2026-10-06: Parent centering now runs bottom-up after descendant placement, targeting the angular midpoint of immediate children rather than the allocated span of the whole subtree. Moves are clamped to preserve ring ordering and checked for circle clearance; when blocked, use the nearest safe point. No named-person exceptions. Isaac and Perez now align exactly with their children's angular centers, and Machir's daughter with Segub. Added explicit IX regressions for all three. All 101 focused tests, types, scoped lint and build pass. Applied through Apply layout rules in the live IX view; DOM geometry confirms all three alignments, 426 people remain, and Undo is available.

- 2026-10-06: Corrected Machir's daughter's maternal connection. Child-angle centering alone left the orthogonal join crossing Machir's incoming family stem. Single-child mothers with a visible father now face the actual midpoint-of-gap junction after fathers settle. Move the sibling group and obstructing ring neighbors together when necessary, preserving circular order and circle clearance; fall back to a constrained individual move if blocked. Added geometric regressions for her junction alignment, outward approach, and nonintersection with Machir's family stem. All 101 focused tests pass; types, scoped lint and build pass. Applied to the current IX view with Undo. This supersedes the previous claim that alignment with Segub alone resolved her placement. User requests code/geometry verification only; do not control their browser for further layout work unless asked.

- 2026-10-06: Sector ordering now prioritizes eliminating intersections involving secondary parent connections before minimizing angular distance; generation-skipping connections receive stronger proximity weight. Uses whole-family sector repacking, retaining adjacency-based placement and recorded generations. After maternal clearance shifts, recenter the affected groups' unpaired ancestors (not every node, which can undo clearance). IX regression now tests the complete Hezron/Segub stem and maternal join against surrounding family stems, beyond the earlier Machir-only check. Zero intersections in that regression; Machir's angle equals his children's span center. 426 people remain. All 101 tests, types, scoped lint and build pass. Existing saved views are intentionally not rewritten: refresh and Apply layout rules to update, with Undo. No browser control used this turn. General graph-wide crossing freedom is not claimed.

- 2026-10-06: Owner opted for the mother-only visible connection in the Machir-daughter case. Family-band pairs now use the mother alone when she is on a later ring than the father and before the shared children. Removes the paternal crossing stem and union elbow; source parent records remain unchanged, and the stem title names the omitted father. Same-ring pairs and Amram/Jochebed retain their joined connections. Auto placement targets the child instead of the omitted union for these mothers. 102 focused tests pass, including maternal-only geometry against surrounding stems; types and scoped lint pass. Refresh shows the connector change even on saved layouts; Apply layout rules also updates placement. No browser control.

- 2026-10-06: Reduced unnecessary slanted ancestor stems. Family-band anchors now accept any safe point between sibling circles rather than forcing the gap midpoint. Prefer the parent's radial direction, with 30-unit lateral circle clearance and angular-seam handling. Automatic unpaired-parent centering aligns to an actual clear band attachment; final recentering uses the same rule. Blocked placements retain order/collision constraints, and paired-parent/multiple-band cases can still require angled stems. Updated crossing regression uses current attachment geometry; 104 tests, types, scoped lint and build pass. Refresh improves anchors on saved layouts; Apply layout rules updates parent positions. No screen control.

- 2026-10-06: Full-circle family-band layout profile added. Stretch family sectors to a 1.94-pi allocation with a seam gap; Abraham IX actual occupied span is about 346 degrees. Person radius 54 (previously 27), label size doubled, sibling-band thickness and connector/drag clearance scale with person size. Reduce excessive outer ring spacing; fitted circle/name size improves about 2.24x for Abraham IX. New arrangement personRadius persists with Undo; legacy saved arrangements keep their old sizing until Apply layout rules. Applying rules now refits automatically. Circle clearance verified across 60 root/depth/direction cases for the new profile; 104 total tests/types/lint/build pass. 426-person overview remains too dense for comfortably reading every name without zooming. No browser control; refresh and Apply layout rules.

- 2026-10-06: Person circles increased 4x from the previous full-circle profile (radius 54 -> 216); names and sibling bands scale proportionally. Track padding clamps at zero on narrower bands; increased minimum radial separation prevents adjacent-generation overlap. Raised persisted scale limit to 128 and lowered minimum zoom to .002 to accommodate the enlarged layout. Existing views retain their sizing until Apply layout rules. 61 layout tests including 60 full-profile collision fixtures pass; types/scoped lint pass. The 4x size is at equal zoom; fitting the expanded entire graph changes apparent screen size. No browser control.

- 2026-10-06: Circle-2 now upgrades outdated saved views automatically on load using FAMILY_LAYOUT_REVISION (currently 3). No Apply layout rules click is needed for releases. The prior arrangement enters Undo and the persisted layout-study event before replacement. Undo restores previous geometry with the current revision so a reload honors the restoration. Manual changes at the current revision remain intact; bump the revision for future automatic layout releases. New and migrated views fit automatically. Types/scoped lint/build verified; no browser control.

- 2026-10-06: Corrected the sizing/rebalancing feedback. Removed automatic revision upgrades for existing saved arrangements; only an absent view is generated automatically. Person-circle and label display scale is now 4x the stored node size in family-band mode, independent of stored angles, radii and track spacing. Size changes no longer request layout or fit. Removed resize-observer refitting that could unexpectedly reset zoom. Explicit Apply layout rules and Fit remain user actions. Refresh alone shows larger circles in place. This supersedes the prior automatic-migration requirement and fitted-size promises. Enlarging in place can expose crowded siblings; no automatic movement is performed to hide that. Types/scoped lint verified; no browser control.

- 2026-10-06: Family-band display size is now absolute 7x original radius: 27*7=189 (diameter 378 SVG units), independent of saved personRadius. Labels scale from the original too; coordinates/rings remain unchanged. Previous compounding produced radius 864 (32x original) in revision-3 views. Avoid constructing unused staggered branch paths in family-band rendering; suppress hover-driven selection changes while dragging/panning to reduce interaction churn. Types/scoped lint pass. No browser control; subjective glitching has not been visually reproduced.

- 2026-10-06: Investigated suspected feedback loop without browser control. Added mounted-page regression using real 426-person data and a saved IX arrangement. Repeated hover and right-mouse pan do not invoke automatic layout or change person coordinates/storage; panning changes only the viewport. Replaced hover React state with paint-only SVG attributes and cached relationship membership, eliminating whole-graph hover rebuilds. React Profiler now records zero commits for hover and pan in this test; radius stays189. Panning clears transient hover. Integration test, types/scoped lint/build pass. No claim that every subjective glitch is reproduced; asked owner which interaction triggers it.

- 2026-10-06: Owner requested rollback to before sizing changes. Restored original radius27/root40, font10/13, normal sector allocation, original ring spacing/track padding, scale cap16, zoom minimum .015, and pre-sizing hover/fit behavior. Removed full-circle sizing profile and automatic revision upgrades. Pre-sizing maternal-only and radial-attachment fixes retained. Sized saved views recover the earliest recorded pre-sizing snapshot automatically; if absent, the original layout is generated once. A separate before-size-rollback localStorage backup preserves the resized version. Mounted regression verifies recovery, original radius, stable coordinates and backup. Types/scoped lint pass. No browser control. This supersedes the full-circle and size experimentation entries above.

- 2026-10-06: Owner authorized controlled 2x display. Circle-2 uses an absolute sizeScale=2: radius54/root80, labels20/26 and sibling bands108. Original-circle mock remains1x. The scale is a view prop, not saved arrangement geometry; angles, ring radii, tracks and zoom effect dependencies are untouched. Collision checks and connector endpoints use visible size. No automatic spacing or layout pass is triggered by size changes. Mounted regression switches a saved view from1x to2x and verifies identical coordinates, ring radii, camera transform and persisted arrangement, with no layout invocation; hover/right-drag and track Undo regressions pass. Existing close siblings can now crowd; spacing remains a separate deliberate operation. Types/scoped lint pass. No browser control.
