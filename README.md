# Bible Project

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

React 18, Vite, TypeScript and Tailwind on the front end. A plain-Python pipeline (`scripts/`) turns the
publishers' files (USFM Bible text, CSV, JSON, XML) into static JSON, so Bible reading needs no database.
`scripts/build-map.mjs` draws the coastlines from Natural Earth, and the satellite picture is cut to the map's
area by NASA's image service once, at build time. Nothing calls an outside service while you read.

Testimonies use Cloudflare Pages Functions and D1. The same handler runs locally in Miniflare, with persistent
storage in ignored `.local/testimonies/`. The public collection contains no sample stories. Test fixtures
are used only by tests in separate disposable databases.

## Working with testimonies

Run `bun run testimonies:setup` once to initialize the local collection. Open the private owner invitation
from `.local/testimonies-owner-link.txt` and enter the first real story. Do not commit or share that file.
Restart Vite if it was already running before adding the API middleware. Ordinary frontend edits only need
another build. Private access links let authors return from another device; there is no email sender or
password setup. Keep the owner access link safe: anyone holding it can manage the owner account.

Invitation and access links use `PUBLIC_SITE_URL`, currently `https://bible-project-4af.pages.dev`. A local
story exists only in the local database. To test a generated link locally, keep its path and fragment and
replace the origin with `http://127.0.0.1:8931`; it will work on the public domain after the production release.

The form defaults the public-sharing choice to checked, requires it at publication, and infers the inviter
from the single-use token. Valid submissions publish immediately. `PublicationCheck` in `src/lib/testimonies.ts`
is called on the server for each revision; its current adapter is disabled and publishes immediately. No AI
service has been built or enabled. Anonymous reports and owner hide/resolve controls work independently.

Checks: `bun run typecheck`, `bun run lint`, `bun run test`, `bun run test:api`, `bun run build`, then
`bunx playwright test -c e2e/testimonies.config.ts`. The browser suite creates its own database on port 8934.
Runtime checks cover simultaneous claims, retries, permissions, expiry/revocation, edits, withdrawal,
moderation, private access rotation, public projections and persistence across runtime restart.

## Releasing testimonies on the existing Pages site

The repository's `wrangler.jsonc` has a **local-only placeholder database ID**. Never use it for deployment.
The production D1 database has not been created or bound. Preparing a release does not deploy anything.

1. Build and run the checks above. Run `bun run testimonies:prepare` to verify the complete package locally.
   It creates a fresh `.release/testimonies-*/site/` containing the frontend, Bible data, compiled Pages
   Worker, API-only routing and cache/security headers. It refuses more than 20,000 files.
2. At launch, create the free-plan D1 database with `bunx wrangler d1 create bible-testimonies`.
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
