# Terms checked before acquiring Alexander Maclaren's sermons (2026-10-08)

Copies of the pages quoted here are saved in [raw/terms/](raw/terms/).

## CCEL (Christian Classics Ethereal Library) — ccel.org

- robots.txt — https://www.ccel.org/robots.txt (fetched 2026-10-08, full text):
  > `User-agent: meta-externalagent` / `Disallow: /`
  > `User-agent: Applebot` / `Crawl-delay: 20`
  > `User-agent: *` / `Crawl-delay: 10` / `Disallow:`
  - Obeyed: every ccel.org request was spaced at least 10.5 s apart. Nothing is disallowed for general agents.
- Copyright policy — https://ccel.org/about/copyright.html
  > "Most of the editions at the Christian Classics Ethereal library are based on books that are public domain in the United States. However, they may have copyrighted introductions, cover art, and other special contents. A few books are under another publisher's copyright and are used by permission; these are noted on the book information page."
  > "These books may be used for personal, educational, or non-profit purposes. Contact us for permission to republish CCEL works or to use them commercially."
  > "CCEL.org website and special contents copyright 1993-2020 Harry Plantinga."
- Maclaren (1826–1910) died over a century ago; the texts are public domain. CCEL's own additions (e.g. the staff-written description in each file's header, markup) are CCEL's and are kept only for private reading.

## What was requested from ccel.org (19 requests in total)
1. robots.txt, the copyright page, Maclaren's one author page (https://ccel.org/ccel/maclaren).
2. One book information page (The Acts) to learn the whole-book download link pattern (`/ccel/m/maclaren/<book>.xml`).
3. The 14 *Expositions of Holy Scripture* volumes, each ONCE as whole-book ThML (`.xml`). One request was reset by the server mid-run (connection reset, no HTTP status); the run paused 90 s and resumed from its checkpoint. No 403/429/5xx was received.
- No page-by-page crawling, no keyword searching.

## Use scope recorded in provenance
Private, noncommercial reading; no public hosting; no public full-text index.
User-Agent on every request: `BibleProject-library/1.0 (private noncommercial study)`.

## Fallback
Project Gutenberg (offline catalogue CSV + official mirror) was the agreed fallback; it was not needed.
