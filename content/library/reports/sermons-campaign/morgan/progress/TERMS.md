# Terms checked before acquiring G. Campbell Morgan sermons (2026-10-08)

Copies of the robots/terms pages fetched are in [raw/terms/](raw/terms/).

Owner rule received mid-run (2026-10-08, via coordinator): **no exploratory or keyword web
searching — bulk routes only**: (1) the Internet Archive advancedsearch API + each volume's
existing full text (`_djvu.txt`) at its documented download URL; (2) Project Gutenberg's offline
catalogue CSV. Before that rule arrived, one web search was made, only to read the current
wording of archive.org's terms of use (its terms page renders only with JavaScript), and
robots/terms pages of archive.org, ccel.org and gutenberg.org were fetched. Nothing was taken
from CCEL or from any other site.

## Internet Archive — archive.org

- robots.txt — https://archive.org/robots.txt (fetched 2026-10-08)
  > `User-agent: *` / `Crawl-delay: 10` / `Disallow:` (plus `Disallow: /control/`, `/report/`)
  - Obeyed: every archive.org request was spaced at least 10.5 s apart (stricter than the 2 s minimum).
- Terms of use — https://archive.org/about/terms.php (page body needs JavaScript; wording
  taken from the Archive's own published text as quoted on its forum/blog):
  > "Access to the Archive's Collections is provided at no cost to you and is granted for
  > scholarship and research purposes only. In particular, you certify that your use of any part
  > of the Archive's Collections will be noncommercial and will be limited to noninfringing or
  > fair use under copyright law."
  - Blog, 2014-12-30 (https://blog.archive.org/2014/12/30/update-to-terms-of-use/): the update
    removed the old ban on copying any part of the Collections offsite without written
    permission; the noncommercial / non-infringing requirement remains.
- Routes used: `https://archive.org/advancedsearch.php?...&output=json` (one creator query),
  `https://archive.org/metadata/<identifier>` (to find the `_djvu.txt` file name and the
  publication date) and `https://archive.org/download/<identifier>/<file>` — all documented
  Internet Archive APIs/download URLs. No page scraping, no new OCR.
- Lending-library items (collections `inlibrary` / `printdisabled`) were NOT touched: their text
  is restricted, and the Westminster Pulpit volumes on archive.org are all of that kind
  (1954-55 Revell/Pickering reprints).
- Use here: private, noncommercial study; texts kept only if their US publication is 1930 or
  earlier (a work first published in 1930 entered the US public domain on 2026-01-01).

## Project Gutenberg — gutenberg.org

- robots.txt — https://www.gutenberg.org/robots.txt
  > `User-agent: *` / `Disallow: /ebooks/search`
- Robot access policy — https://www.gutenberg.org/policy/robot_access.html
  > "The Project Gutenberg website is intended for human users only. Any perceived use of
  > automated tools to access the Project Gutenberg website will result in a temporary or
  > permanent block of your IP address."
- Terms of use — https://www.gutenberg.org/policy/terms_of_use.html
  > "If you want to download many books manually or using an automated download software,
  > download them from one of our mirrors, not from the main site."
  > "If you want a machine-readable database of all our books, read the Offline Catalogs and Feeds page."
- How obeyed: the offline catalogue `https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv`
  (fetched 2026-10-09T00:20:01Z UTC by the sibling Moody run in this same session, sha256
  `25882f0e…cf62580`) was searched offline for Morgan. **It lists no work by G. Campbell Morgan**
  (no "Morgan, G. Campbell", "Morgan, George Campbell" or "1863-1945" author entry), so nothing
  was fetched from the Gutenberg mirror.

## CCEL — ccel.org

- robots.txt — https://ccel.org/robots.txt: `User-agent: *` / `Crawl-delay: 10` / `Disallow:` (empty).
- Copyright — https://ccel.org/about/copyright.html:
  > "These books may be used for personal, educational, or non-profit purposes."
- Not used: outside the bulk-routes-only rule.

## Common
- User-Agent on every request: `BibleProject-library/1.0 (private noncommercial study)`.
- Fetcher stops on any 403, 429 or 5xx. Never overwrites a file.
- Provenance on every held file: useScope private-noncommercial-reading; no public hosting; no
  public full-text index.
