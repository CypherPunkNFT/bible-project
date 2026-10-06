# Bible Project

**SOURCES & CORPUS DASHBOARD:** [Inventory, provenance and refresh handbook](content/library/SOURCES-DASHBOARD.md). `/sources` now joins collection dashboards, authors, works and acquisition links: 16,498 reference records, including 15,479 verified acquired files in the shared library snapshot. Attribution and collection gaps remain explicit; counts and embedding coverage are dated.

**KNOWLEDGE GRAPH PLAN:** [Evidence, identity, schema and phased implementation](knowledge/GRAPH-PLAN.md). The expanded corpus is fully embedded and verified (1,710,344 passages). Next: a separate evidence-backed graph, starting with explicit bibliographic and Scripture connections, then a measured term/citation pilot. Graph implementation remains planned.

**KNOWLEDGE BASE ENRICHMENT STRATEGY:** [LLM-authored terms, deterministic Python and FTS5 analysis](knowledge/ENRICHMENT-STRATEGY.md). Author and validate reusable vocabulary/rules, then enrich the independent local database through repeatable passes without per-document model calls. See the [analytical roadmap](knowledge/ANALYSIS.md) for the resulting graph layers. Strategy documented; enrichment runner planned.

**LIBRARY DOWNLOADS · MASTER CATEGORY INDEX · CROSS-CHAT HANDOFF:** [All collection categories and mission status (L00–L15)](content/library/BACKLOG.md) · [Actual text/download inventory](content/library/reports/text-backlog/REPORT.md) · [Collection desk](content/library/README.md). Collection chats share these mission IDs and consult the latest category acquisition manifest to avoid duplicate downloads. Prioritize permitted readable texts; catalog links, acquired files and published selections have separate statuses.

Read the whole Bible in every free version we can find, in sixteen languages, side by side, with charts, a satellite atlas of
its places, study pages and every open cross-reference. Free for everyone, with no account, no ads and no
paywall. The code, the data pipeline and the sources list are all here, to use, change, take apart and
build on.

## What is in it

- **Library**: the reading chart (every chapter, mark what you have read) and all 24 versions.
- **Reader**: up to three versions side by side, including the Hebrew (right to left), Greek and Latin;
  red letters, footnotes, and each verse's cross-references.
- **Study**: nine illustrated collections covering Jesus and the Gospels, connected passages, Bible structure,
  people and prophets, places, miracles, letters, names of God, and versions. Each collection brings its guides,
  charts and maps together; former Charts links redirect here.
- **Atlas**: 1,252 places of the Bible on NASA satellite imagery, each with the verses that name it.
- **Search**: any word or phrase in any version, with a chart of where it falls.
- **Testimonies**: written stories connected by personal invitations, with QR links, private author access,
  editing, withdrawal and an invitation tree at `/testimonies`.
- **Apologetics**: 21 connected guides, learning paths, worldview comparisons, debate records and conversation
  practice, with Scripture and source citations beside substantive explanations.

## The texts and data, and their licences

Every Bible text but one is in the public domain. They come from eBible.org: the King James Version, Geneva,
Tyndale, Wycliffe, Douay-Rheims, Webster, Young's Literal, Darby, Revised Version, American Standard, JPS 1917,
Brenton's Septuagint, Basic English, World English Bible, Berean Standard, Majority Standard, the Westminster
Leningrad Codex (Hebrew), five Greek texts, the Clementine Vulgate, and translations in Spanish, Arabic, Chinese,
French, German, Hindi, Portuguese, Russian, Japanese, Vietnamese, Persian and Italian. The one exception is the
Hindi Indian Revised Version, © Bridge Connectivity Solutions, under CC BY-SA 4.0 (credit in
[NOTICE.md](NOTICE.md)). Cross-references and places come from
OpenBible.info (CC-BY), proper names from STEP Bible (CC BY 4.0), and the map imagery is NASA's Blue Marble
(public domain). Every file, its source and its checksum are listed in [SOURCES.md](SOURCES.md); what you
must credit if you reuse them is in [NOTICE.md](NOTICE.md).

## Apologetics: doctrinal and editorial basis

Scripture is the final authority. These guides use the Westminster Confession of Faith as a subordinate
Reformed standard, with exposition from Calvin, Sproul, Ferguson, Kruger and Ligonier. The public source
room at `/apologetics/sources` explains each source's role and limits. These are original editorial notes;
citations do not claim that an author or a theological reviewer approved the website.

- Author apologetics in `content/apologetics/`: individual structured documents drive the website and its
  downloadable reading copies. See the [document handbook](content/apologetics/README.md) for editing,
  AI review packets, source impact reports, draft publication and review records. Every answer, reasoning
  step, conclusion, explanatory section, reply, limitation and conversation application requires citations.
  Use readable Scripture references and precise source locators, not an unrelated bibliography.
- Keep human sin, the continuing image of God and common grace distinct. Outwardly beneficial conduct
  does not justify a sinner. State justification through faith alone, Christ's substitutionary atonement,
  Scripture's authority and God's sovereign providence clearly wherever those doctrines are discussed.
- Catholic or patristic contributions require a specific scope compatible with the stated Reformed
  position. Aquinas is used on causation and dependence, Augustine on the gift of faith, and Athanasius
  as a historical witness to the New Testament list. None is a blanket endorsement of an author's theology.
- Qur'anic texts, humanist statements, manuscripts and debate transcripts serve as documentary evidence,
  not doctrinal authorities. Craig's debate participation is not a Reformed endorsement. Represent other
  positions accurately from their own texts. Mark invented scenarios and practical applications as editorial.
- Keep comparisons and legacy summaries consistent with the full guides. Preserve stable guide IDs for
  saved notes. Source roles and scope notes live in `content/apologetics/sources/`; the legacy foundations
  now derive from the same guides instead of maintaining duplicate answers.

The library tests check citation coverage, source relationships and every Scripture endpoint against the
local Bible data. `npx playwright test --config e2e/apologetics.config.ts` verifies desktop, tablet and phone
reading, source links, comparisons and saved notes. These automated checks catch structural failures;
they do not establish theological correctness. Reopen the cited section and assess the actual claim when
editing doctrine. Last comprehensive editorial source pass: **2026-10-05**.

The **Reformed theology branch** at `/apologetics/topics/reformed` connects four additional sourced guides
and a six-study learning path to the historic reading library at `/apologetics/texts`. The reading library
currently offers 46 works by 30 authors, with 48 identified editions/holdings, source links, reading pointers,
tradition notes and shareable filters. These are catalogue entries and external reading links; book files
have not been bulk-ingested. Historic text rights are separate from modern translation and host-file rights.

Its canonical records live in `content/library/`, under the explicit `publication.json` selection. See the
[Reformed reading handbook](content/library/REFORMED-READING.md) for the author list, edition findings,
JSON/Markdown exports and review commands. Normal content builds and release preparation validate both
the study documents and this selected reading catalogue; unrelated collection missions remain separate.

## Scrolling tables and lists

Vertical table scrollbars belong outside the right border, with a small gap. Keep the rounded frame fixed,
and let headings and row dividers span the full interior without a scrollbar gutter. Use
`src/components/OutsideScroll.tsx` for new bounded tables and reference lists; it synchronizes native
scrolling in both directions and updates the thumb when content or the viewport changes. Keep its ancestors
from clipping the outside scrollbar. Harmony and the Library versions list already use the same pattern.
Keep vertical overscroll behavior `auto` on both the content viewport and its outside scrollbar: once a
table reaches either end, scrolling should continue up or down the page. Do not trap page scrolling inside tables.

Check with native browser scrollbars visible: `bunx playwright test -c e2e/outside-scroll.config.ts`.
The checks cover Miracles, book pairs, measure evidence, place references and the testimonies list, including
keyboard scrolling, filters and expanded passages. They also verify page scrolling past both ends of the
Miracles, Harmony and Library versions tables, plus the reader's verse references, chapter references and
every-version view on desktop and mobile. Testimony checks use browser fixtures without API writes.

## Run it yourself

You need [Python 3.12+](https://www.python.org/), [Node.js 22.16+](https://nodejs.org/) and
[bun](https://bun.sh/).

```bash
git clone https://github.com/CYPKNFT/bible-project.git
cd bible-project
python scripts/fetch-sources.py          # downloads every source from its publisher (~160 MB) into sources/
python scripts/build-data.py             # builds the Bible data into data/ (~560 MB in 84,000 small files, about 3 minutes)
python scripts/build-study.py            # builds the study pages' data
node scripts/fetch-imagery.mjs           # downloads the atlas's NASA imagery into public/atlas/
bun install
bun run build && bun run preview         # http://127.0.0.1:8931
```

The sources list records exactly which copy of each source this site was built from. Publishers sometimes
update their files in place. If a fresh download differs, the build stops and says which file changed. To build
from the newer copy anyway, set `BIBLE_ACCEPT_SOURCE_CHANGES=1`. Expect this for the newer translations that eBible
still calls drafts (the World Chinese Bible, the Bíblia Portuguesa Mundial and the Japanese Freedom Bible): they
are revised often.

Checks: `bun run typecheck`, `bun run lint`, `bun run test`, `python -m pytest scripts/tests -q`,
`bunx playwright test` (browser checks at phone, tablet and desktop widths).

## How it is built

The separate atlas mockup is at `/study/places/mockup`. It copies the current atlas's filters and place
details, with a colored SVG coastline, markers that stay small when zoomed, collision-aware labels and
searchable groups for crowded/co-located places. It offers Biblical world, Holy Land and Galilee views.
Zoom now reaches k=8192 (64 times closer than the initial mockup); markers stay the same screen size.
Locations recorded at identical coordinates remain accessible in their searchable group.
The current `/study/places` atlas and navigation are unchanged. The mockup reuses the existing Natural
Earth outline and OpenBible coordinates; it does not add historical borders or more precise location data.
Run its checks with `node node_modules/@playwright/test/cli.js test -c e2e/atlas-mockup.config.ts`.

React 18, Vite, TypeScript and Tailwind on the front end. A plain-Python pipeline (`scripts/`) turns the
publishers' files (USFM Bible text, CSV, JSON, XML) into static JSON, so Bible reading needs no database.
`scripts/build-map.mjs` draws the coastlines from Natural Earth, and the satellite picture is cut to the map's
area by NASA's image service once, at build time. Nothing calls an outside service while you read.

Testimonies use Cloudflare Pages Functions and D1. The same handler runs locally in Miniflare, with persistent
storage in ignored `.local/testimonies/`. This is one invitation tree rooted in founder Lucas. Until he
publishes, the empty view shows only a Lucas anchor with no invented testimony; it creates no database
record. The old fictional forest and tree picker are removed. Automated tests use separate disposable
databases, never the real collection.

## Working with testimonies

Run `bun run testimonies:setup` once to initialize the local collection. Open the private owner invitation
from `.local/testimonies-owner-link.txt` and enter the first real story. Do not commit or share that file.
Restart Vite if it was already running before adding the API middleware. Ordinary frontend edits only need
another build. Private access links let authors return from another device; there is no email sender or
password setup. Keep the owner access link safe: anyone holding it can manage the owner account.

Invitation and access links use `PUBLIC_SITE_URL`, currently `https://bible-project-4af.pages.dev`. A local
story exists only in the local database. To test a generated link locally, keep its path and fragment and
replace the origin with `http://127.0.0.1:8931`; it will work on the public domain after the production release.

The form has no consent or inviter-confirmation checkboxes. Clicking Publish testimony confirms the public
submission, and the inviter comes from the single-use token. The two main destinations are Explore the
branches and Invite someone. The invitation's guest preview uses the same form with a faded, disabled
publication button; it creates no story, invitation or saved draft. Invitations always originate from the
signed-in contributor, regardless of which story is selected. Valid submissions publish immediately.
Authors provide a required 20–600 character blurb and can add an optional full testimony, up to 100,000
characters (5,000 words and more). The side panel shows the blurb; Read the full testimony opens a scrollable
reader with larger text, reading time and preserved paragraphs. Full bodies load only when opened. The tree
remains a bounded, paged view with controls on nodes to follow more invitations; there is no global forest.
Migration 0004 preserves existing full text and derives an editable blurb from its first 600 characters.
`PublicationCheck` in `src/lib/testimonies.ts`
is called on the server for each revision; its current adapter is disabled and publishes immediately. No AI
service has been built or enabled. Anonymous reports and owner hide/resolve controls work independently.

Checks: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run test:api`, `bun run build`, then
`bunx playwright test -c e2e/testimonies.config.ts`. The browser suite creates its own database on port 8934.
Runtime checks cover simultaneous claims, retries, permissions, expiry/revocation, edits, withdrawal,
moderation, private access rotation, public projections and persistence across runtime restart.

## Releasing testimonies on the existing Pages site

The repository's `wrangler.jsonc` has a **local-only placeholder database ID**. Never use it for deployment.
The production D1 database is now created and bound (2026-10-04): `bible-testimonies`, ID
`e80eb6c8-2d9b-4da9-86f7-3ffaf94f18c5`. All four migrations are applied. The public API health check returns
`{"ready":true}`. Preparing a release does not deploy anything. For subsequent releases, reuse this ID;
do not create another database or replace the existing root invitation.

The first owner's private invitation is saved locally in
`.local/production-owner-39bd783c-5b21-4c62-9ddf-d0eeff55cc9f/private-link.txt`.
Its adjacent SQL has already been applied. No story was published during deployment.

1. Build and run the checks above. Run `bun run testimonies:prepare` to verify the complete package locally.
   It creates a fresh `.release/testimonies-*/site/` containing the frontend, Bible data, compiled Pages
   Worker, API-only routing and cache/security headers. It refuses more than 20,000 files.
2. Set `TESTIMONY_D1_ID` to the existing production database ID above. For a new installation only,
   create the free-plan D1 database with `bunx wrangler d1 create bible-testimonies`.
   Set the returned UUID as `TESTIMONY_D1_ID` (PowerShell: `$env:TESTIMONY_D1_ID = '<uuid>'`).
   If using a custom domain, also set `PUBLIC_SITE_URL` to its HTTPS origin.
3. Run `bun run testimonies:prepare` again. The new directory includes a production `wrangler.jsonc` and
   migrations. Change into that directory. Use the installed Wrangler through the absolute path to
   `Website/node_modules/wrangler/bin/wrangler.js`, or `bunx wrangler` from a terminal with network access.
4. Apply `wrangler d1 migrations apply bible-testimonies --remote`. For an existing collection, first export
   a backup with `wrangler d1 export bible-testimonies --remote --output <private-backup.sql>` and verify
   restoration into a separate local/staging database. Never copy the local/test database into production.
5. From `Website`, run `bun run testimonies:owner`. This generates a private link and adjacent `owner.sql`
   in `.local/production-owner-*/`, without contacting Cloudflare. From the release directory, apply that
   exact file with `wrangler d1 execute bible-testimonies --remote --file <absolute-owner.sql>`.
   It inserts only into an empty collection; an existing root invitation is never replaced. Apply once.
6. From the release directory run `wrangler pages deploy site --project-name bible-project --branch main`.
   Its configuration binds `DB` and sets the canonical website origin. Verify `/api/testimonies/health`,
   `/testimonies`, a Bible chapter, and the private owner invitation on the actual website. Then publish the
   owner's real story, save its private access link, and verify an invitation from a second device.

Keep database exports, access links and root-invitation files private. Deployment/database configuration,
actual phone scanning and production backup recovery remain launch checks, not claims made by local tests.

## Licence

The code is under the [MIT licence](LICENSE): use it, change it, share it, sell it, take it apart. The Bible
texts are public domain except the Hindi IRV (CC BY-SA 4.0); the other data keeps its own licence (see
[NOTICE.md](NOTICE.md)).
