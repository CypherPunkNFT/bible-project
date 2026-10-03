# Bible Project

Read the whole Bible in every free, public-domain version, side by side, with charts, a satellite atlas of
its places, study pages and every open cross-reference. Free for everyone, with no account, no ads and no
paywall. The code, the data pipeline and the sources list are all here, to use, change, take apart and
build on.

## What is in it

- **Library**: the reading chart (every chapter, mark what you have read) and all 24 versions.
- **Reader**: up to three versions side by side, including the Hebrew (right to left), Greek and Latin;
  red letters, footnotes, and each verse's cross-references.
- **Study**: a harmony of the Gospels, the miracles, the letters, people, prophets and the names of God.
- **Charts**: every cross-reference as an arc, book-to-book links, book sizes and the words of Jesus.
- **Atlas**: 1,252 places of the Bible on NASA satellite imagery, each with the verses that name it.
- **Search**: any word or phrase in any version, with a chart of where it falls.

## The texts and data, and their licences

Every Bible text is in the public domain. They come from eBible.org: the King James Version, Geneva,
Tyndale, Wycliffe, Douay-Rheims, Webster, Young's Literal, Darby, Revised Version, American Standard, JPS 1917,
Brenton's Septuagint, Basic English, World English Bible, Berean Standard, Majority Standard, the Westminster
Leningrad Codex (Hebrew), five Greek texts and the Clementine Vulgate. Cross-references and places come from
OpenBible.info (CC-BY), proper names from STEP Bible (CC BY 4.0), and the map imagery is NASA's Blue Marble
(public domain). Every file, its source and its checksum are listed in [SOURCES.md](SOURCES.md); what you
must credit if you reuse them is in [NOTICE.md](NOTICE.md).

## Run it yourself

You need [Python 3.12+](https://www.python.org/), [Node.js 20+](https://nodejs.org/) and
[bun](https://bun.sh/).

```bash
git clone https://github.com/CYPKNFT/bible-project.git
cd bible-project
python scripts/fetch-sources.py          # downloads every source from its publisher (~135 MB) into sources/
python scripts/build-data.py             # builds the Bible data into data/ (~250 MB, about 90 seconds)
python scripts/build-study.py            # builds the study pages' data
node scripts/fetch-imagery.mjs           # downloads the atlas's NASA imagery into public/atlas/
bun install
bun run build && bun run preview         # http://127.0.0.1:8931
```

The sources list records exactly which copy of each source this site was built from. Publishers sometimes
update their files in place. If a fresh download differs, the build stops and says which file changed. To build
from the newer copy anyway, set `BIBLE_ACCEPT_SOURCE_CHANGES=1`.

Checks: `bun run typecheck`, `bun run lint`, `bun run test`, `python -m pytest scripts/tests -q`,
`bunx playwright test` (browser checks at phone, tablet and desktop widths).

## How it is built

React 18, Vite, TypeScript and Tailwind on the front end. A plain-Python pipeline (`scripts/`) turns the
publishers' files (USFM Bible text, CSV, JSON, XML) into static JSON, so the site needs no server or database.
`scripts/build-map.mjs` draws the coastlines from Natural Earth, and the satellite picture is cut to the map's
area by NASA's image service once, at build time. Nothing calls an outside service while you read.

## Licence

The code is under the [MIT licence](LICENSE): use it, change it, share it, sell it, take it apart. The Bible
texts are public domain; the other data keeps its own licence (see [NOTICE.md](NOTICE.md)).
