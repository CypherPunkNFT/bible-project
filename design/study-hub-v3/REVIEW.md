# Connected Study review record

**Date:** 2026-10-10 · **Scope:** Local mockup; agent verification, not owner design acceptance.

## Pass 1 — structure, content and navigation

- Parent composition follows the owner's order: two branch entrances, Writers/Scholars as section 01, Atlas as section 02. The subject accordion and separate parent source shelf are removed. A short two-link closing invitation remains a review choice.
- Both branches contain five functioning subject selections with grouped destinations from the S2 inventory. Existing Letters guides provide academic depth beyond the two new cases.
- Local cases, source records and the prayer lesson carry Preview labels. The four church-history topics are identified as outlines awaiting studies. No acquired-file totals or draft records inflate lesson counts.
- Shared collections and individual people retain existing routes. The Writers CTA opens the theological subject and its directory preview. Scholars opens the existing catalogue; the in-place profile rebuild is still S6.
- Selected subjects, Atlas mode and place are encoded in the mockup URL. Fixed the first-click case so choosing the default subject also gives it an explicit shareable query.
- All 59 distinct outgoing destination URLs gathered during the walkthrough loaded actual page headings without Not Found results or page exceptions. The selected Jerusalem city link opened Jerusalem, and Letters section links opened their specific sections.

## Pass 2 — visual and interaction review

- Captured all three pages at 320, 390, 768 and 1440 pixels in both themes: **24 layouts**, without document overflow or failed asset responses.
- Exercised all ten subject selections at all eight width/theme combinations: **80 selections**. Keyboard arrows/Home/End are scoped to the subject links; Enter selects. Verified query refresh, browser back, invalid-query fallback and the writer-directory entrance.
- Checked search, no-results, Escape; the retained writer and scholar-field selectors; all three Atlas modes; keyboard map-point selection; and Atlas browser-back restoration.
- A focused follow-up at phone/desktop widths verified that every subject hint keeps the same height on focus, Home/End reach the first/last subject, and the live theme switch changes theme. The phone Paul-map view was captured and inspected.
- Inspected desktop parent and theological layouts, the light academic page, a phone academic page and Paul's map view. Centred the branch hero eyebrows and increased map-label sizes on small screens during review.
- The coastline and first-journey projection match the existing Atlas data. Paul's route is explicitly schematic. Only his implemented Story/Letters experiences receive journey actions.
- The final browser run recorded **zero page errors, failed assets or failed destination visits**. Script syntax checks passed for all five hand-authored/retained JavaScript modules.

## Execution review and remaining scope

### Owner refinements — 2026-10-10

- Applied the requested compact map header/footer, circular inset compass, direct Atlas subsection arrows, prominent full-Atlas button and footer sentence. Removed the connected-design strip on all three pages.
- Replaced Isaiah with Moses in the four-writer feature. Added a letter/ink/pen/seal for Paul, scroll and tablets for Luke, staff and tablets for Moses, and lyre/psalm scroll for David. Tested ground-line-only, ellipse-only and two open compositions. Existing person endpoints and qualified attributions are preserved; these are symbolic drawings, not archaeological reproductions.
- Rechecked all three map modes at 320, 390, 768 and 1440px in both themes: 24 map states, zero document overflow, page exceptions or failed assets. Compass stays inside the map; header measures at most 30px; footer sentence remains visible. Keyboard city selection and browser Back work.
- Exercised all four writer choices in each width/theme combination. Opened all eight distinct writer and Atlas navigation destinations and confirmed their actual page headings. Both branch pages retain five subject entrances and omit the review strip.
- Inspected all four desktop writer illustrations, Moses on mobile in light/dark, and desktop/mobile Atlas captures. The phone footer was also measured directly to confirm the sentence fits inside its panel. Syntax checks and scoped `git diff --check` pass.
- Focused audit: `node .local/check-study-v3-refinements.mjs`; evidence: `design/review/study-hub-v3/refinements/`. Original wider audit remains valid for unchanged subject content. Generator preserves hand-authored people artwork on regeneration.
- Follow-up owner request: made the Writers and Scholars collection links cover their entire cards, using the top cards' hover border, artwork lift and rotating circular arrow. Checked heading, description, artwork and padding hit targets at desktop/phone widths in both themes; all writer tabs and scholar filters still operate independently. Actual card navigation, keyboard Enter, Ctrl-click into a new tab and the individual Moses link passed with no page errors or document overflow. Inspected `refinements/cards-hover.png`. The implementation uses an extended native link, without nested links or a scripted card click handler.

The intended S3 artifact is delivered: three connected, populated review pages with working controls and existing reading destinations. Source: `design/study-hub-v3/`; screenshots/results: `design/review/study-hub-v3/`; reproducible check: `.local/check-study-v3.mjs`.

### Follow Paul motion refinement — 2026-10-10

- Replaced the instant camera swap with a continuous approach to Antioch, followed by framing the journey. Route drawing begins after the 2.2-second camera sequence, with the Atlas's accent-colored drop shadow, rounded joins and unchanged route circles. Returning to the overview animates from the current camera, including when interrupted mid-flight.
- Motion-enabled browser checks confirmed the initial camera exactly matches the previous view; the route is invisible during zoom; its dash offset decreases only after the camera settles; the camera remains stationary during drawing; and the completed line remains visible. Fixed the footer's changing text triggering a resize that prematurely ended the entrance animation by updating layout before measuring the viewport.
- Verified rapid map/Paul/cities changes, switching away during route drawing, keyboard city selection, browser Back, resize, light-theme phone playback, live reduced-motion changes and a reduced-motion saved Paul URL. No page errors. Inspected zoom, Antioch approach, route progress/completion and phone captures.
- Focused audit: `.local/check-study-v3-motion.mjs`; evidence: `design/review/study-hub-v3/refinements/motion-checks.json` and `motion-*.png`. Syntax and scoped whitespace checks pass.
- Reran the existing refinement audit after the camera rewrite: all 24 responsive/theme map states and eight actual destinations pass, with no page/asset errors or document overflow.

The pages await owner review of composition, labels and Atlas treatment. They do not implement production branch routes, origin-aware return changes, a completed Writers collection, expanded Scholar profiles, new public case publication or the real header change. The screenshot audit ran against the local static mockup, not a clean production-release build. It is not a full accessibility certification or a fresh historical review of linked content.

Shared gallery files were already dirty in another chat; the proposed card is saved in `gallery-entry.json` rather than overwriting them. Existing mockups and production code were preserved. S4 branch foundations follow the settled design.
