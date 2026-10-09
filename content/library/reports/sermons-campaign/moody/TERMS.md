# Terms checked before acquiring D. L. Moody sermons (2026-10-08)

Copies of every page quoted here are saved in [raw/terms/](raw/terms/).

## CCEL (Christian Classics Ethereal Library) — ccel.org

- robots.txt — https://ccel.org/robots.txt
  > `User-agent: *` / `Crawl-delay: 10` / `Disallow:` (empty — nothing disallowed for general agents)
  - Obeyed: every ccel.org request was spaced at least 10.5 s apart (stricter than the 2 s minimum).
- Copyright policy — https://ccel.org/about/copyright.html
  > "Most of the editions at the Christian Classics Ethereal library are based on books that are public domain in the United States. However, they may have copyrighted introductions, cover art, and other special contents."
  > "These books may be used for personal, educational, or non-profit purposes. Contact us for permission to republish CCEL works or to use them commercially."
- Result: CCEL's author page for Moody (https://ccel.org/ccel/moody) lists exactly one work, *Moody's Anecdotes and Illustrations* — a topical anthology of stories, not sermons. Nothing was taken from CCEL. Five requests total (robots.txt, the copyright page, the author page, that work's info page, one site search).

## Project Gutenberg — gutenberg.org and its mirrors

- robots.txt — https://www.gutenberg.org/robots.txt
  > `User-agent: *` / `Disallow: /ebooks/search`
- Robot access policy — https://www.gutenberg.org/policy/robot_access.html
  > "The Project Gutenberg website is intended for human users only. Any perceived use of automated tools to access the Project Gutenberg website will result in a temporary or permanent block of your IP address."
  > "The best way to have a local up-to-date copy of all files is to setup a private mirror"
  > (its own example uses `wget -w 2`, i.e. a 2-second wait)
- Terms of use — https://www.gutenberg.org/policy/terms_of_use.html
  > "If you want to download many books manually or using an automated download software, download them from one of our mirrors, not from the main site."
  > "If you want a machine-readable database of all our books, read the Offline Catalogs and Feeds page."
  > Deep linking: "When linking to a Project Gutenberg item, link to the main landing page such as www.gutenberg.org/ebooks/11."
  > Footnote: "Many books: i.e., more than ~100 per day"
- Offline catalogues — https://www.gutenberg.org/ebooks/offline_catalogs.html
  > "Please use one of these files as input to a database or other tools you may be developing, instead of crawling or roboting the website." … "An Excel-compatible CSV spreadsheet of eBook metadata is also available"
- Mirror list — https://www.gutenberg.org/MIRRORS.ALL
  > "Project Gutenberg | https://gutenberg.pglaf.org/ | High-speed mirror. Includes cache/generated files"
- Licence for what is downloaded: the Project Gutenberg License inside each file. These US public-domain texts may be copied and reused; the "Project Gutenberg" trademark rules apply only to redistribution under that name.

### How these terms were obeyed
- No crawling of www.gutenberg.org. The only main-site requests were the five policy/robots pages and the one machine-readable catalogue file (`cache/epub/feeds/pg_catalog.csv`), which the site offers for exactly this purpose. Moody's books were found from that catalogue, offline.
- The 13 book files came from the official mirror gutenberg.pglaf.org, at least 2.5 s apart — far below the ~100 books/day threshold.
- Reading addresses in the manifest point to the Gutenberg landing pages (`/ebooks/<n>`), as the deep-linking rule asks.

## Common to both hosts
- User-Agent on every request: `BibleProject-library/1.0 (private noncommercial study)`.
- No 429 or block responses were seen. The fetcher was set to stop on any 403, 429 or 5xx response.
- Use scope recorded in provenance: private, noncommercial reading; no public hosting; no public full-text index.
