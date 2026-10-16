# Alongside — interaction and integration contract

Open [the offline gallery](prototype/index.html), then [Passage](prototype/passage.html), [Topic](prototype/topic.html) or [Shelves](prototype/shelf.html). File URLs work; no server, npm install or application build is needed. Fonts and scripts are bundled locally. External links appear only in provenance footers.

## Page hierarchy

| Interface | First visible task | Secondary information | Phone composition |
| --- | --- | --- | --- |
| Passage companion | Read Ephesians while choosing a held treatment | Why this source is shown; separate editorial interpretation | Chapter first, companion immediately after; no clipped side panel |
| Topic/question | Select a narrower question, then inspect evidence | Attribution, disagreement, release requirements | Local chapter links wrap above the question; comparison columns stack |
| Acquired shelf | Find a contributor, open their shelf, select work/edition | Contributor information and source context | Contributor list precedes selected shelf; close returns focus to selected contributor |

The shelf is a section study for the current acquired-library location. It adds no top banner, biography requirement or new source catalogue. The live Preachers/Scholars section order and graphs are not reproduced or resized. No 560/640px shared panel minimums are introduced. Scholar/contributor details start closed. The 1232px desktop content measure follows the documented Teachers standard.

## Actions and states

| Control/action | Demonstrated outcome | Focus and navigation behavior |
| --- | --- | --- |
| Gallery or header link | Opens one of three local prototypes | Native anchor; browser Back works |
| Theme button | Changes parchment/dark tokens | Focus stays on button; accessible name describes next action |
| Preview state selector | Shows one of seven deterministic scenarios | Native select; polite result announcement; readiness is never auto-promoted |
| Previous/Next chapter | Moves 1–6 and updates companion context | Boundaries disabled; focus stays on control |
| Choose a treatment | Changes metadata and actual fixture availability | Native select; source structure is the displayed basis |
| Choose a question | Changes the question and restores candidate state | Pressed state on button; no answer/retrieval occurs |
| Contributor search | Filters three fixture names/roles | Count announced; clear restores focus to search |
| Contributor button | Opens only the selected shelf | Pressed state; details are initially closed |
| Work/edition select | Switches Calvin's two distinct works and translator credits | Does not merge works or substitute a readable edition for a catalogue-only citation |
| Read held edition | Shows an offline route simulation | Native modal focus containment; Escape closes; focus returns to trigger |
| View/inspect catalogue | Shows catalogue route simulation without reading promise | Same modal behavior; no external fallback |
| Why shown / interpretation / contributor details | Reveals secondary information | Native details/summary, operable by keyboard |
| Empty reset / loading cancel / stale restore | Restores unchanged selected fixture | Focus returns to scenario selector; no fake network retry |

State selector scenarios are design controls, not production controls. Selecting readable chooses the real readable Fergusson fixture; selecting catalogue chooses the real catalogue-only Hodge fixture. It never changes a catalogue-only record into a purportedly readable edition. Other scenarios deliberately simulate candidate/conflict/stale relationships without asserting new findings about the named author.

| State | Primary display | Allowed action |
| --- | --- | --- |
| On-site readable | Availability plus source-location/review distinction | Whole-work reading simulation |
| Catalogue-only | Held edition, no public reading copy | Catalogue record only |
| Candidate awaiting review | Unreviewed chapter/relationship basis | Inspect identity; no approved answer or verse binding |
| Source conflict | Disputed relationship withheld | Inspect identity; never silently repair or quote conflict |
| Empty/unsupported | No supported result in this selection | Reset; explicitly avoid whole-library absence claim |
| Loading | Busy source region with static skeleton | Keep surrounding navigation usable; explicit cancel demo |
| Stale | Last-known metadata plus verification notice | Inspect catalogue identity; evidence reuse withheld |

The production loading proposal is an abortable request scoped to the selected source/edition. Navigation cancels obsolete loads. A failed request should show a concise error and a user-operated retry, without clearing the Bible chapter or fabricating content; network failure handling is specified, not implemented against a service in this offline prototype. No automatic polling or retries are proposed.

## Existing routes and data contracts

Verified from current local source and four packaged metadata records; full evidence and hashes remain in the private P1 folder.

- Bible: `/read/:slug/:book/:chapter`; fixture targets `/read/kjv/EPH/1` through `/read/kjv/EPH/6`. No changed notebook or verse identifiers.
- Held work: `workUrl(id)` returns `/teachers/works/<encoded-id>`. Fergusson and Calvin sermons are `on-site-text`. Calvin commentary and Hodge are `permission-required`, displayed as catalogue-only.
- Contributor shelf: `/teachers/works?author=<existing-contributor-id>` is supported in `LibraryWorkPage.tsx`. This prototype allocates no contributor IDs, so no fabricated author query URL is emitted.
- Existing acquired entry points: `/teachers/preachers-and-authors#acquired` and the Scholars acquired/catalogue section. Keep their placement; do not create a duplicate announcement.
- `ReadingRecord` supplies identity, availability, author/contributor credits, source URL, page bundles and review warning. `getReadingPage` returns blocks with `text` and `locator`.
- The existing work reader stores reading-page selection in component state. No verified `?page=` parameter or passage fragment exists. Proposed source locations therefore cannot be converted to deep links yet.
- A new topic-question destination is **not registered here**. Use the existing topic catalogue after P2 resolves canonical mappings; do not invent a second taxonomy or URL namespace.

Fixture fields in `app.js`: author, title, edition label, credit, route and availability. Editorial/relationship states are scenario controls, separate from source availability. P4's eventual content blocks can occupy the source and interpretation regions without changing page navigation. Detailed source text, canonical identity sidecars and evidence review are absent by design.

## Integration decisions left open: five

1. Owner design acceptance and reconciliation with P4's content block contracts.
2. A verified reader locator/deep-link contract if exact passage navigation is wanted; preserve old routes and notes.
3. Canonical topic/question ID and route mapping from P2; fixture questions are not a taxonomy release.
4. Final source identity, claim review, reader availability and use decisions from the appropriate evidence owners; revalidate against the final intake snapshot.
5. Approved production placement/responsive behavior within Reader and Teachers, followed by shared build and route/mobile/accessibility checks at 8931. No shared integration is included in P1.

Proposed integration touchpoints: `ReaderPage.tsx` companion slot; existing topic page composition after route mapping; `AcquiredCatalogue.tsx`/Scholars `Catalogue.tsx` shelf behavior; `LibraryWorkPage.tsx` only if a locator contract is separately accepted. Use adapters to existing acquired/evidence contracts. No schema, route or component change has been applied.
