# Built on their work: four alternatives

Local comparison at http://127.0.0.1:8931/mockups/scholars-built-directions/.

Four vertically stacked, interactive mockups: feature shelves; one source connection; author credits; grouped works index. The production Scholars components are untouched.

Data snapshot from content/teachers/feature-usage.json: all 1,011 source records grouped by exact trimmed author and title into 567 groups. Distinct titles and credits are retained. Individual source URLs, record types, locators and page links remain available. Group counts do not claim bibliographic deduplication across variant titles. Lists progressively append at 40% of their scroll range.

Checked in Edge at 1440px and 390px: four sections, selectors, search, source dialog, expanded records, progressive loading, both themes, no JavaScript errors or horizontal overflow.

## Circles of study (2026-10-12)

Local inspection prototype: http://127.0.0.1:8931/mockups/scholars-built-directions/rings.html. Study centre, rings of five leading works, recorded authors, and connected studies. Selecting a work exposes its original evidence; selecting a related study recentres the map. Search and progressively loaded work lists can replace one of the five visible works. No force simulation or continuous animation. Phone map scrolls horizontally with a readable minimum size. Checked in Edge: node inspection, author works, study navigation, choosing an off-map work, search, light theme, no page overflow, and no JavaScript errors.

## Circles of study v2 (2026-10-12)

`rings.html` is the expanded local design. `rings-v1.html` preserves the first direction. Six supercategories and 19 subjects have category cards, subcategory tabs and an Apologetics-style searchable menu. Study rings show up to 24 works in three priority bands of eight. Only works are graph nodes. The right-hand containers hold inspection, a linked contributor card, and connected studies based on shared works. `rings.html?leader=author-charles-spurgeon` demonstrates the individual contributor page, with First / Later / Final works by recorded lifetime dates; dates are shown on its nodes. Undated and posthumous-edition entries remain on its shelf.

Rebuild the prototype snapshot with `node design/scholars-built-directions/build-rings-data.mjs`. It uses feature-usage, scholar profiles, preacher profiles, and the teachers index; contributor attribution uses exact names and the existing explicit aliases, retaining unmatched/joint credits separately. New subject shelves are proposed curated reading, clearly identified in work details; they do not claim verified site use. Priority uses recorded citations when available and a deterministic provisional order for curated works. Live scholar/preacher profiles remain untouched. All deep links for individual pages are local prototype URLs.
Validated in Edge: all 19 subject maps respect the 24-work maximum; keyboard selection, contributor links, chronological dates, search and empty state, browse-menu Escape, zoom, both themes, and 390px layout passed. No JavaScript errors or page-level horizontal overflow.

## Spurgeon full-density trial (2026-10-12)

The individual example now imports all 3,556 Spurgeon-attributed numbered entries from the reconciled local sermon inventory, alongside six summary/library works. Creator identity is filtered explicitly; guest contributors are excluded. Delivery dates are preferred, then lifetime publication dates. Flagged delivery dates and two impossible printed dates are excluded from placement; original source links and sermon identifiers remain available. The combined example has 3,562 catalogue entries: 3,146 can be dated in his lifetime and 416 remain on the undated/later-edition shelf. These are catalogue entries including collections, not a claim of 3,562 non-overlapping texts.

Defaults to 24 works, eight sampled across each chronological period. Controls show 48, 96 or all 3,146 dated entries. The all-dated view uses compact dots in narrow bands around each chronological ring, with source inspection on selection; the full shelf is searchable and progressively rendered. `&count=all` opens the maximum directly. Verified 24/48/96/3,146 rendered entries, eight per ring at 24, direct PDF links, dense-point selection, search, and phone overflow.

## Increasing ring capacity (2026-10-12)

Removed all radial spokes, including the selected-work line. The default now shows up to 48 works: eight on the first ring, sixteen on the second, and twenty-four on the third. Study priority ranges are 1-8, 9-24, and 25-48. Individual chronology samples use the same 1:2:3 capacity ratio; periods with fewer recorded works can leave room for another period. The 24, 96, and all-dated controls remain available. Labels remain visible at the new 48-work default, with shorter wrapping on the outer rings.

Checked in Edge: study and Spurgeon default counts of 8/16/24, weighted 24- and 96-work settings, all 3,146 dated entries, no straight lines before or after selection, work inspection, study priority labels, search, and 390px layout without page overflow or JavaScript errors. Visually inspected both 48-work maps.

## Reading shelf and work reader (2026-10-12)

The contributor heading now reads "Prominent works & selected sermons", with a direct link to the full collection. The rings retain known profile works first, include relevant selections from the existing reviewed study paths, then sample across the lifetime dates. This is an editorial starting point, not a measured popularity ranking. The 8/16/24 default, larger density options and works-only rings remain.

The reading shelf has a prominent "All 3,562 collected works" heading, stable catalogue numbering, its own title/author/sermon-number/passage search, and a standard-scrollbar container. An IntersectionObserver appends 24 entries near the bottom without a button or pagination. It preserves the loaded entries and scroll position while works are inspected or read; all entries remain reachable.

Shelf clicks and the inspector's Read this work button open a modal reader. Every Spurgeon entry in this prototype has a local reading copy. Original sermon PDFs are preserved byte-for-byte; the corrected contained-in-volume entry opens at its source page. The collection entry offers all 63 pulpit volumes. Treasury of David offers six locally held volumes; Commenting and Commentaries uses its held scanned-edition OCR. All of Grace and Morning and Evening use held CCEL texts. Lectures to My Students identifies its held first-series edition. Source credits, original-source links and OCR identification remain visible.

Prepare local reading payloads with `node design/scholars-built-directions/build-readers.mjs` after rebuilding rings data. It writes `readers.json` and ignored `reader-files/` JSON payloads containing base64 original source bytes. This allows on-demand local reading through the existing mockup JSON route without changing the shared preview server. Do not publish or package these local reading payloads with the design. PDF.js 6.4.299 is vendored under `vendor/` with its Apache licence, loaded only when opening a PDF. PDF pages render near the viewport and release offscreen canvases. Book text appends as the reader scrolls. Closing or switching editions cancels outstanding loading and rendering.

Validated in Edge: all 3,562 shelf entries reached by scrolling; stable numbers and independent search; original PDF content rendered with selectable text; text continues on scroll; six Treasury volumes and 63 pulpit volumes selectable; modal close restores focus; desktop/390px layout and page enlargement; every reader-manifest file exists. No JavaScript errors in the completed browser checks.

## Compact section and expanded map workspace (2026-10-12)

The inline overview is always capped at 48, including old count=all deep links. Its heading is now "A life in words." with prominent works / selected sermons as a small kicker. Removed the lifetime subtitle, shelf jump, density selector, dated-count caption and repetitive footer. Search/reset sits beneath the inspector in the former date-details position. The circular expand icon opens a full-viewport dialog.

Expanded density options are 48, 96, 192, 384, 768, 1,536 and All. All includes the complete 3,562-entry Spurgeon collection; 416 undated/later-edition entries occupy a separately labelled fourth ring rather than an invented lifetime position. Finite densities retain weighted chronological sampling. Larger study collections can also expand beyond 48.

The workspace supports pointer panning, individual work dragging, wheel zoom, two-pointer pinch, plus/minus controls, and fit/reset. Keyboard arrows pan, +/- zoom and 0 fits; Escape closes. Drag positions persist during the expanded session, and reset returns them to their ring positions. At closer zoom, visible dense works gain collision-filtered labels. No spokes are introduced. The same inspection and source reader remain available inside the workspace. On phones, the search/details toggle reveals the panel above the map. Closing restores the inline layout and expand-button focus.

Checked in Edge: base48 despite max URL, all seven expanded counts through3562, fourth ring, pan, node drag, reset, node inspection, nested original-work reader, zoom labels, close restoring48, mobile search/overlay and absence of page overflow or JavaScript errors. Captured desktop overview, expanded map and mobile review images under .local/.

## Expanded controls and wider inspection column (2026-10-12)

Expanded work densities are now bold yellow filter tabs in a centred gold container above the map. Removed the dropdown and +/- controls. The zoom percentage is a small fit/reset action beside the bottom-left "Scroll to zoom ? Drag to move" hint. Wheel and pinch zoom remain available.

The desktop inspection column is up to 660px wide (44vw at smaller desktop sizes), twice its previous maximum. It spans the entire dialog height; the map header stops at the same divider. Its typography and card padding are expanded accordingly. Phone search/details remains an overlay.

Checked all seven density tabs through 3,562, wheel zoom, header/divider alignment, 660px sidebar width, mobile search and overflow, and close restoring the 48-work inline overview. No JavaScript errors.

## Thin map toolbar (2026-10-12)

Replaced the large work-filter container with a 56px desktop toolbar (about 40% of its previous height). Compact tabs use a restrained gold selected state. Scroll/drag guidance and the fit percentage moved into that same top row. Removed the legend from both map views and removed the bottom control area. Mobile uses a compact 72px two-row toolbar. Verified filter selection, full map height, mobile fit and no JavaScript errors.

## Interactive ring detail (2026-10-12)

Expanded works now distribute over additional rings with 240 world-unit radial spacing and circumference-based capacity, keeping chronology/priority and date ranges attached to each ring. The 192-work example uses seven rings; the full 3,562-entry example uses 30. Fit includes the entire expanded extent. The page overview remains three rings and at most 48 works.

Detail responds continuously to zoom: overview dots grow into year badges, and titles become more detailed and larger while remaining readable at 13-24 screen pixels instead of shrinking to tiny text or scaling without bound. Visible labels try four placements and avoid badges, ring headings and other labels. Hover and keyboard focus reveal a work's year/title at any scale. Closely spaced ring captions are sampled at the far overview. Source inspection, original reading copies, node dragging and viewport panning remain available. Redraw requests are coalesced to animation frames; SVG parts are cached and there is no continuous animation loop.

Verified 192/full collection ring counts and work counts, year-badge transitions at both densities, readable title sizing, correct ring dates, inspection and source reader, panning, fit, phone overflow, and closing to the 48-work overview. No JavaScript errors.

## Proportional detail and boxed filters (2026-10-12)

Title size now follows zoom (22 world units, bounded at 7-28 screen pixels), rather than remaining at a near-constant font size. At 47% titles are approximately 10.3px. Year circles appear from 26% and their year text scales in proportion to the badge radius. Dense maps above 96 works hide unselected titles below 58%; hover/selection can still reveal a title. At 39% the 192-work view shows all year circles with no unselected titles. Ring headings scale with zoom and hide below 22%, replacing the crowded overview stack with a compact colour legend at top left. Scroll/drag guidance moved to the right. All filter buttons have visible borders and backgrounds, with a solid gold active state.

Verified exact 47%/39% states, closer zoom revealing text, all filter borders, legend bands and placement, full collection counts, mobile fit and absence of JavaScript errors.

## Anchored expansion and header legend (2026-10-12)

Expand now keeps the existing SVG, selected work, world coordinates and screen transform. A screen-matrix capture places that same SVG inside the expanded workspace; opening does not redraw or fit it. The surrounding dialog reveals over 620ms, its controls fade in, and the sidebar moves from its former bounds into the wider column. A layout placeholder preserves the underlying page and scroll position. Reduced-motion settings make the transition immediate.

The initial expanded view retains 48 works and the original three-ring geometry; interaction activates the zoom-aware marks in that same geometry. Higher density filters still create additional, spaced rings. Resizing no longer implicitly fits an expanded view. Closing restores the original graph/page position and focus, preserving the same SVG if the user has not changed it. The colour legend now occupies the top-right header above the inspection cards, entirely off the graph.

Verified all 48 node coordinates remain within 0.1px of their previous screen positions during and after expansion, the same SVG remains in use, page scroll restores on close, wheel interaction works, higher densities remain functional, Escape closes, and phone layout fits. No JavaScript errors.

## Return reconstruction (2026-10-12)

Close now reverses the expanded shell over the same 620ms duration: the workspace contracts toward the original section, toolbar/legend recede, graph moves toward its saved screen transform, and the sidebar returns to its original position and width. Sidebar width, padding and heading font size animate directly so its text reflows rather than stretching. Page heading and reading shelf reveal in sequence, then smaller page cards settle into place. A changed-density graph crossfades back to the 48-work overview. Scroll and focus restore, and reduced motion remains immediate. Verified unchanged and 192-work returns, delayed dismissal, restored scroll/focus and 48-work geometry, Escape, and no JavaScript errors.

## Large-collection dots-only experiment (2026-10-12)

The 1,536 and All filters now use a separate dots-only renderer. Every work keeps its existing chronological position and colour, but the graph has no text, year badges, orbit strokes, work hit targets, or per-work DOM. Circular subpaths are batched into at most four SVG paths, one per colour. Pan and zoom transform the existing SVG without looping over works or running label placement. Dots remain dots at every zoom for this experiment; progressive information should be evaluated separately, using only visible works rather than restoring thousands of live work elements. The smaller filters retain their current information and inspection behaviour.

Verified exactly 1,536 and 3,562 circular subpaths, no text/title nodes, preserved SVG identity during wheel zoom, panning, switching back to the 192-work detail view, and closing to 48 inline works without JavaScript errors. In the same local headless Edge 1500x1050 automated 60-frame wheel sequence, All went from 17,877 graph elements and a 389 ms median frame interval (482 ms p95) to five elements and 16.6 ms median (17.1 ms p95). This is a local comparison, not a guarantee for every device.

## Reading inside the expanded workspace (2026-10-12)

Selecting a work in the expanded map now widens the right column and places the existing reader directly there. Its header, volume controls, actual PDF/text reading copy, and source footer move into a bounded inline container; no second dialog opens. Selecting another work aborts and replaces the previous document load. Closing that reader restores the overview cards, while leaving the expanded map open. Exiting the expanded workspace aborts the reader and restores its DOM to the reading-shelf dialog. PDFs respond to panel-width changes with a debounced relayout that preserves the active page. Phones use the available right-panel overlay space. Source and lifecycle paths were inspected; browser verification was unavailable because the local process/browser launcher failed.

## Progressive detail for large collections (2026-10-12)

The large views now retain that batched dot overview and add a separate detail layer from `dense-map.js`. Year circles fade in between 28% and 40% zoom; titles fade in between 65% and 85%, then allow longer labels above 120%. Unknown dates use an em dash. A spatial index queries only the viewport and a small surrounding margin. Detail elements are reused by work ID and removed when they leave that area, with hard budgets of 320 badges and 96 titles. Labels avoid nearby badges and other titles. Zooming back out removes the detail layer entirely; the base dots fade away when the year circles take over, preventing oversized solid dots at close zoom. No extra work-content fetches occur while navigating the map.

Work inspection, keyboard selection, individual work dragging, viewport panning, reset, and return to the inline map remain available. Verified both large filters at 10%, 47%, 90%, and 150%; the 3,562-work view had zero detail elements at 10%, 137 nearby badges at 47%, and 57 at 90%. Local headless Edge zoom frame medians remained approximately 16.7 ms with p95 below 18 ms at these stages. Panning with year detail likewise measured 16.7 ms median / 17.6 ms p95. Verified dragging, inspection, removal of the solid base at close zoom, reset, smaller filters, and return without JavaScript errors.
