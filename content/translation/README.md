# Translating Bible Guide

The site is to be translated into every modern language it has a Bible in, starting with Spanish and Brazilian
Portuguese (owner, 2026-10-31). Owner's rules: **translate everything** (creeds, hymns and debate transcripts too),
publish **without a native-speaker review**, and show **no machine-translation notice**. The language button sits in the
header between Contact and Search ([LanguageMenu.tsx](../../src/components/LanguageMenu.tsx)); it shows only on this
computer's preview until a translation is published.

## The full run (from 2026-10-31)

Haiku translates the site in Claude Code cloud sessions, paid from the owner's cloud credit, in its own private
repository: [CypherPunkNFT/site-translation](https://github.com/CypherPunkNFT/site-translation), checked out at
[SiteTranslation/](../../../SiteTranslation/). [extract.py](extract.py) writes the English into it: 819 chunks, 3.0
million words, every unique string once per kind of content. Its `SOURCES` list says which fields of which data files
are translated. Scripture quotations are left out (each language's Bible fills them by reference), and so are book
titles, authors, licences and catalogue metadata. `python extract.py --pages` adds the text written into the page code
(headings, buttons, labels) as chunks of kind `page` after the last chunk (0820–0850 so far), and is safe to rerun.
`python extract.py --documents` adds the debate transcripts (kind `transcript`, every spoken paragraph; paragraphs over
300 words are cut at sentence ends). Each chunk holds at most 100 strings and 4,000 words, so one translation call
carries it. Chunks 0868–0912 are transcripts and 0913–0951 are study drafts, which are no longer collected (stage 5,
job 11): only the local-preview mock-ups read them.

What counts as page text is [page_rules.py](page_rules.py)'s: the first rules (text between tags, labels, titles,
sentences in quotes), and since stage 5 job 11 also one-word labels under `group:` and `kind:` or in a choice
(`ok ? "Scripture says" : "Verdict"`, `role ?? "Ruler"`), strings after a `${}` template on the same line, paragraphs
up to 4,000 characters, lowercase phrases a page shows ("in four collections"; not search aliases, lookup tables or
the home banner's verses in other languages), text beside a `{value}` in JSX (", the only account"), and text a plain
script writes as HTML in a template (`<p>Named as his ${rel} in the family list</p>` becomes "Named as his {n} in the
family list"). The page code is every .ts, .tsx, .js, .mjs and .jsx file under `src/` outside mock-ups, `src/test/`,
`src/dev/` and `.test.` files, including `src/generated/` and the live /study/questions/test page;
`src/pages/places/old-maps-collection/data.js` is left out with its reason (`NOT_PAGE_CODE` in extract.py). Tests:
`python -m pytest content/translation/test_collector.py -q`.

When `--pages`, `--resources` or `--documents` collects English that was edited since the last collection, the old
translation is carried over to the new English in the same chunk and filed for a re-check
(review/<lang>/source-fixes/, by "collect"; the catalog marks it needs-re-check), instead of the text going back to
English ([retarget_collect.py](retarget_collect.py)). It only pairs text the collector itself collected last time
(SiteTranslation/collected.json, written by each collection) with a close new text, and never across a negation or
an opposite. `--dry-run` with any of those modes prints what would be carried and appended and writes nothing; every
writing mode holds the site-translation folder's shared lock. `--pages` leaves out text an apologetics chunk already
holds and text ruled not to be screen text in `unregistered-reviewed.json`.

## Seeing it on the site

`python apply.py` writes the translated copies: every data file in `SOURCES` with its English swapped for the
translations done so far, into `data/i18n/<es, pt, zh, ar, hi>/` (git-ignored like the rest of `data/`, so rerun it
after new chunks or a data rebuild), plus `ui.json`, the page-code strings. [seed/](seed/) holds page strings written by
hand that the chunks lack: the header and footer, the 66 Bible book names in each Bible's own form, everyday labels. A
chunk's translation wins over the seed. Picking a language in the header changes the words in place:
[language.ts](../../src/lib/language.ts) sends content-file requests to the translated copy (falling back to English
when there is none), and [page-translator.ts](../../src/lib/page-translator.ts) swaps the page code's text on screen.
The reader moves to that language's Bible ([verses.ts](../../src/lib/verses.ts)). Files under `public/` (apologetics,
the sources directory) and the pages drawn inside their own surface (Moses, Circles) are not translated yet. A release
leaves `data/i18n/` out until the languages are published.

Arabic reads right to left. `<html dir="rtl">` plus [logical-css.js](../../scripts/logical-css.js), a build step that
writes every left and right style rule as start and end, mirrors the whole layout with no page written twice; left to
right it is the same page. Drawings keep their own orientation (`svg { direction: ltr }` in `index.css`), and a page
that stays English sets `dir="ltr"` on itself.

## Finding English that never gets translated

[unregistered.py](unregistered.py) lists English that extract.py never registers, so it stays English in every
language (the Apologetics menu's "Practice" was one). It checks three things: text in the page code that looks shown on
screen but that extract.py's rules skip, sorted by which rule passed it by; fields of the content files that hold
prose but that no `SOURCES` path names, and content folders no rule reads at all; and registered page text that a
language's `ui.json` has no translation for yet. It writes
[reports/unregistered.md](../../../SiteTranslation/reports/unregistered.md), reads files only and costs nothing (about
three minutes, mostly the content files; `--check code` alone takes seconds). Its net is wider than extract.py's on
purpose, so some items are code or English on purpose: once checked, they go in `unregistered-reviewed.json` as
`{"check": "code" | "code-files" | "fields" | "files" | "untranslated", "item": ..., "why": ...}` and drop out of
later reports.

## The build check: no new unregistered English (from 2026-11-06)

[english_build_check.py](english_build_check.py) runs first in `npm run build` (prebuild) and in the quick release's
code build ([quick-release-build.mjs](../../scripts/quick-release-build.mjs)), with
[check-site-languages.ts](../../scripts/check-site-languages.ts) for the language file. It uses the "code" net above and
stops the build on any text beyond [english-baseline.json](english-baseline.json), the findings already there when it
began (keyed by the English text, with how many times it occurs). Its message names the file, the line, why the
collector skips the text and how to register it; text no reader sees, or English on purpose, takes a ruling in
`unregistered-reviewed.json` with its `why` instead. The baseline may only shrink: after registering text, run
`python content/translation/english_build_check.py --shrink`. About 9 seconds. The check reads the same files as the
collector but not `src/generated/` (rewritten by every content build and not in git; its text is checked in the
content files). Tests:
`python -m pytest content/translation/test_english_build_check.py -q`. The quick release passes `--since <live commit>`
and judges only what the picked commits add. Design and record: SiteTranslation/system/HANDOFF.md, stage 4.

The same check runs five language nets ([build_nets.py](build_nets.py), which hands the source files to
[language_nets.mjs](language_nets.mjs) and the TypeScript compiler), each with its own section in the baseline:
**pieced**, sentences built from pieces around values (`{d} of {t} debates`, `"Page " + n`), which a translator cannot
reorder; **plural**, hand-written plurals (`n === 1 ? "book" : "books"`, or a helper called with both forms); **format**,
numbers and dates fixed to one language (`toLocaleString("en-US")`) or left to the browser's own language; **title**, tab
titles and page descriptions not in the phrase lists (including the route titles in `page-head.ts`); and **data**, data
folders the pages read that are missing from `TRANSLATED_DATA` in `language.ts`, or listed there with no translated
copy. Findings are keyed by the shape of the code, with names written as `{n}`, so a rename or reformat is not new.
Section growth needs a widening that names the section; `--add-sections REASON` adds a missing section once. A ruling
for a net (`"check": "pieced" | "plural" | "format" | "title" | "data"`) needs the `file` it applies to. Together about
8.5 seconds. Tests: `python -m pytest content/translation/test_build_nets.py -q` (needs node).

## The pilot (2026-10-31)

[pilot/](pilot/) compared Haiku with the local model (HyperQwen) on 50 real items from every part of the site, in both
languages, scored blind by Claude Opus 5.5. Results: [pilot/RESULTS.md](pilot/RESULTS.md). Haiku won 43 of 50 items in
each language, and 45–46 of 50 scored publishable on accuracy, fluency and doctrinal terms, against 26–28 for the local model.

How it was run: [pick_items.py](pilot/pick_items.py) picks the items; the translator instructions are
[task-es.txt](pilot/task-es.txt) and [task-pt.txt](pilot/task-pt.txt); Haiku ran through BatchRunner, the local model
through [run_local.py](pilot/run_local.py); [prepare_judging.py](pilot/prepare_judging.py) checks and blinds;
[task-judge.txt](pilot/task-judge.txt) is the reviewer's brief; [score_report.py](pilot/score_report.py) writes the results.
