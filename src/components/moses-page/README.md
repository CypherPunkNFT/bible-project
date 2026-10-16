# Moses individual page

Production adaptation of the approved `design/moses-directions/#merged` design, mounted at `/people/moses` by `PersonPage`. The old record-ID address redirects through the shared people-slug map. Existing leader and prophet routes remain available.

`MosesPage.tsx` connects the design to the real site header, theme, person record, Scripture reader, router and back-navigation state. `runtime.js` contains the approved illustrations and interactions as a mount-scoped module. Its shadow root isolates the design's CSS; it does not embed an iframe or request anything from `/mockups/`. Unmounting releases window listeners, observers, timers and animation frames.

The current person record supplies the biography and full reference list. The three JSON files preserve the reviewed design's scenes, source layers, map, questions and verse visualization. The original six paragraphs, seven relatives and 786 verse IDs were compared before integration; the preservation bundle is in `docs/moses-preservation-2026-10-12/`. Keep the memory dataset in sync if the underlying Moses reference index changes.

The design picker and debugging ticker are not part of the production UI. “The long memory” opens in place and provides both the visualization with per-book counts and an accessible full reference list. Family details include links to each person's real page. Scene drawers manage focus, hidden scenes/maps are inert, and animations respect reduced motion.

Run `node scripts/check-moses-page.mjs` against the existing port 8931 preview. Set `MOSES_TEST_ORIGIN` to verify the same integration against a deployed site; the script does not start another server.

`chapter-topics.js` and `chapter-topics.css` implement the approved horizontal three-icon controls beneath each chapter's existing event scroller. They regroup the original ledger topic blocks, preserving their content and reader links. Category buttons omit numbers and subsection counts; subsection controls retain focus and preserve reading space so changing content does not move the viewport. The mockup heading, chapter selector, event scroller, and layout picker are not included. `scripts/check-moses-topics.mjs` compares every event entry and subsection citation with the preceding production package and checks stable switching on desktop and mobile.
