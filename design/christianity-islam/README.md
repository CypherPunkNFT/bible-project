# Islam study guide — alongside the existing page

Open http://127.0.0.1:8931/mockups/christianity-islam/.

The current **Christianity & Islam** page at /apologetics/worldviews/islam stays unchanged: title, URL, layout, comparison desk, paired source reader, reading plan, globe, country panels, people groups, studies and reflections. The owner explicitly rejected replacing or changing this page.

The new guide adds Understanding Islam, Ministry, Library and article pages alongside it. Following the owner's latest instruction, the local concept includes a complete duplicate of Christianity & Islam at http://localhost:8931/mockups/christianity-islam/?view=collection. Both the guide landing and Ministry prominently link to this duplicate through **Explore the collection**. The local navigation and local Worldviews card also open it. The production Worldviews card and its destination are unchanged.

Questions, reading and atlas shortcuts use the duplicate's #comparison, #reading-sources and #muslim-world anchors. Query selections are preserved. Old questions/reading/world mockup URLs resolve to the complete duplicate at the relevant section; there are no separate extracted comparison, reading or atlas pages.

The Apologetics navigation and the guide navigation form one contained, adjacent two-row block above the content, including on the complete collection page. There is no breadcrumb row or development banner. A single All worldviews back arrow sits above the title area. Navigation wraps within the container on narrow screens.

## Local implementation

Seven views are available: hub, understanding, ministry, library, article, worldviews and collection. The mockup reuses the site's header, footer, theme, typography and artwork. The collection renders the complete current Collection component without editing its production source. Article bodies are still design-stage content; authoring status is tracked here, outside the visitor interface. Existing studies and source passages lead into their current pages.

The original page was inspected in the browser and against implementation, rather than relying on potentially stale READMEs. current-audit.json and current-*.png record that review. build.mjs exposes Collection and private artwork components in memory while bundling; production modules are not modified. Study-card save controls throughout the local concept use a separate preview notebook. The actual page uses its normal notebook. Content-hashed entry filenames prevent stale JS/CSS bundles being reused after rebuilding.

From Website/, run node design/christianity-islam/build.mjs. The bundle lives under the existing local /mockups/ middleware and stays outside the production app build. The old localhost:8765 address redirects here. No hosted deployment was made for these revisions.

## Verification and planning

Run node design/christianity-islam/verify-preservation.mjs (also exposed through verify.mjs). It checks the full local duplicate, grouped navigation, responsive layouts, source links, local Worldviews-card destination, browser Back, legacy mockup redirects and unchanged production source fingerprints. navigation-verification.json records the latest 12 layout checks at 1440, 768, 390 and 320 pixels, plus selection links, complete collection content, absent development copy and unchanged source files. Checks passed without page errors. navigation-*.png captures the latest desktop and mobile arrangement. Current gallery images are in design/_gallery/thumbs/.

Earlier verification.json, final-verification.json and *-component-reuse-v2 files are historical evidence for the superseded mockup. The gallery inventory check reports two unrelated unregistered folders, research-phase-2 and review; this mockup is registered.

The controlling planning correction is Research/Apologetics/Islam/2026-10-09/strategy/preserve-existing-page.md. It supersedes earlier renaming, relocation, extraction and redirect instructions. A separate /apologetics/worldviews/islam/guide route is proposed for new material; older manifests require rebasing before implementation. No production route was added.

## Visitor-facing copy

The owner requires the local design to read like the finished product. Do not expose mockup, preview, existing/current-page, proposed-article, sample-outline, preservation or development-status language in headings, navigation, calls to action, banners or article introductions. Use the actual destination name and a reader-focused action. Keep content-readiness and implementation notes in these internal documents.
