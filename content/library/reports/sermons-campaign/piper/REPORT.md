# John Piper: retrieval finished, sermons without a Bible text reduced to what the source states

**Date:** 2026-11-26 · **Job:** 6ca48b16 (the orchestrator's job for "finish Piper's retrieval and textless sermons") ·
**State last verified:** 2026-11-26 11:23 UTC (last request to Desiring God).

## In short

- **The October "491 unresolved destinations" record was out of date.** The same collector carried on later on
  5 October 2026, after the record was written. 486 of the 491 were downloaded and held that day, and 3 were fetched as
  short pages. Only 2 had never been read, and neither had failed on a rate limit: one was a dropped connection, the
  other an HTTP 500 server error.
- **Today, 2 requests to his message pages, 45 seconds apart, both answered normally.** There was no 429, no block and
  no retry. Every one of the 2,397 message destinations in his index has now been processed.
- **Sermons with no Bible text: 777 → 771.** Six were placed on the text their own page states. All 771 left are
  **textless at the source**: the publisher's page for each has no "Scripture:" field.
- **Audit: 0 errors in 98 checks.** That covers all 6 new placements, all 42 pages that list two or more texts, and 50
  random earlier placements.
- Ask Pastor John (2,632 episodes) is still counted as interviews through the overlay. vocabulary.json was not touched.

## Rights, read again before any request

| What | Read on 2026-11-26 | Matches job 1489's reading (reconciliation-20261126 Part 2) |
|---|---|---|
| [Permissions](https://www.desiringgod.org/permissions) | Piper's content may be used, shared and reproduced "for personal or noncommercial … uses provided that when publishing textual content online or in hard copy, only quotes and excerpts may be used, not the entire work". Audio and video may be embedded but not re-uploaded. | Yes |
| [robots.txt](https://www.desiringgod.org/robots.txt) | For all agents, it disallows only `/donate/create`, three Ask Pastor John listing pages, `*.rss`, `*/audio` and `*/video` (downloads allowed). It states **no crawl-delay**. `/messages/` pages are allowed. | Yes |

`sources.json` still records Desiring God as `automation: manual-only`, and that was not changed. The site links to the
original and republishes no text. The private copies are reading copies, as the permissions page allows.

## What was fetched, and how

[resume-piper-safely.py](../../../../../scripts/resume-piper-safely.py) wraps the existing collector
([collect-modern-texts.py](../../../../../scripts/collect-modern-texts.py) `collect_piper`). It gained two options,
and its default behaviour is unchanged:

- `--only-errors`: live requests go only to message pages whose recorded status is `error`. Before any request, a check
  confirms that everything else it reads is already in the verified cache: robots.txt, the permissions page, all 96
  index pages, and every processed message. Any other address is refused, and the run stops.
- `--delay`: the gap between live requests, never under 3 seconds. This run used **45 seconds**.
- A 403 or 429 now leaves the state at `review-access-stop` and blocks the next start until a cool-down is reviewed.
  Before this change, the run would have reported success. A lock file stops two runs at once. An interrupted run
  records `interrupted` or `failed` instead of staying at "running".

Command: `python -X utf8 scripts/resume-piper-safely.py --resume-after-cooldown --only-errors --delay 45`
(from Website/). Live requests: `a-kingdom-that-cannot-be-shaken` and `prayer-at-harvest-time-now`, both HTTP 200. The
checkpoint ([piper-resume.json](../../ready-text-completion/piper-resume.json)) now reads `inventory-processed`, with
missing `[]` and errors `{}`. Requests to Desiring God in the whole job: robots.txt and the permissions page (20 s
apart), then the 2 message pages.

**One defect found, and not fixed here.** Both pages came back in Desiring God's **new page design**. Each holds the full
written sermon (about 4,300 words) and a Scripture header. The collector's selectors (`.resource__body`,
`time.resource__date`) predate that design, so it recorded each page as "no-substantial-text, 0 words" with no date, and
kept no held asset. The page bytes are kept, sha256-checked, in the collector's private cache
(`.local/library/run-modern-texts-2026-10-05/http/`). Any future Desiring God download needs the collector updated for
the new design first. Otherwise every new page will be misfiled the same way.

## Passages

Made with the existing machinery, [sermon-passages.py](../../../../../scripts/sermon-passages.py), and the Piper overlay
([piper.json](../../../passage-overlays/piper.json)), which
[people.ts](../../../../../scripts/teacher-pages/people.ts) merges. Changes, Piper only:

- The 26 message pages the collector fetched but did not keep as assets are now read from its cache. These are short
  pages, or pages with several speakers. Each one is checked against its recorded sha256, and the run stops if one is
  missing. A cached page never overrides a held page. The locator carries the page's sha256.
- The "Scripture:" reader accepts the `<!-- -->` that the new page design puts between the label and the link. No
  existing placement changed. begg.json and spurgeon.json regenerate byte-identical, so they were not rewritten.

| Placed today | Page | Stated text |
|---|---|---|
| What Stirs the Church to Sing? | /messages/what-stirs-the-church-to-sing (short page, 73 words) | Ephesians 1:1–6 |
| Reset Your Mind on Jesus | /messages/reset-your-mind-on-jesus (61 words) | Colossians 3:1–4 |
| Sing in the Fullness of the Spirit | /messages/sing-in-the-fullness-of-the-spirit (52 words) | Ephesians 5:15–20 |
| Where to Stand When All Is Shaking | /messages/where-to-stand-when-all-is-shaking (144 words) | Romans 8:32 |
| A Kingdom That Cannot Be Shaken | /messages/a-kingdom-that-cannot-be-shaken (fetched today) | Hebrews 12:25–29 |
| Prayer at Harvest Time: Now! | /messages/prayer-at-harvest-time-now (fetched today) | Matthew 9:35–38 |

### The 771 still without a text, all textless at the source

| Count | What the publisher's page shows |
|---:|---|
| 754 | Held message page with no "Scripture:" field. None of them contains a `data-grouping-type="Scripture"` link anywhere. 14 contain the word "Scripture:" in a title or the body, and these are rightly not read. |
| 9 | Short single-speaker page (59–143 words), no "Scripture:" field |
| 8 | Page with several speakers (panels and Q&As), no "Scripture:" field |

Nothing was read out of a body or a title, and no passage was inferred. Each of the 771 is listed with its reason and
locator in the overlay's `unplaced`.

## Audit

The audit reads each page again by a separate method:

- the BeautifulSoup list of `a[data-grouping-type="Scripture"]` link texts;
- a check that the page is the record's own address;
- each stored verse id decoded with an independent book table.

The audit was first tested by planting a wrong book, a wrong chapter, a wrong reference and a dropped second text, and
it caught every one. Seed 20261126. Detail: [audit-20261126.json](audit-20261126.json).

| Group | Audited | Errors |
|---|---:|---:|
| New placements (all of them; only 6 exist, so 50 random new ones was not possible) | 6 | 0 |
| Pages listing 2+ texts (every listed text must be recorded) | 42 | 0 |
| Random earlier placements | 50 | 0 |

On all 2,371 held message pages, the overlay's reader and the collector's own list agree on every page.

## Teachers data

`npm run teacher-pages`: only John Piper's entry changed in people.json and people-opening.json, with 1,617 → 1,623
sermons on a passage. scholars.json and summary.json were rebuilt byte-identical.

## Left open

- The collector's selectors for Desiring God's new page design (see above).
- The app's copy of the teachers data is not synced, the same as after job 79c7008b. A sync would also carry other
  preachers' unsynced changes.
- Tests that already failed before this job and are unrelated to Piper: `facts.test.ts`, `library.test.ts` (scholars,
  74 vs 73) and the `test:teachers` file check (teachers.json counts, 11 vs 22 preachers).
