# Ready-text acquisitions and modern sermon completion

Snapshot: October 5, 2026. **Named historical acquisitions are complete at file level. Modern acquisition remains partial because Desiring God returned HTTP 429.** No new OCR, scan downloads or audio transcription were performed. [Machine-readable totals](summary.json) and [integrity checks](validation.json).

## Historical texts now held

| Collection | Result | Edition and completeness limits |
|---|---|---|
| Perkins, *A Golden Chaine* | EEBO-TCP A09339 XML acquired under CC0; readable derivative and structural index generated | 1600 Cambridge printing with appended treatises, distinct from the catalog's 1591 scan. The XML contains 1,121 page markers and 2,416 encoded editorial gaps; gaps and special characters remain explicit. This is an existing keyboarded edition, not a claim of flawless text or reproduced diagrams. |
| Goodwin, *Works* | All twelve Nichol-edition volumes acquired as existing Internet Archive text | Volume numbers verified against item metadata and Roman-numbered front matter; downloaded bytes match the host's MD5 as well as recorded SHA-256. Source-provided OCR remains unproofread. Volume 11 uses the Princeton Theological Commons witness. |
| Machen, *Christianity and Liberalism* | All seven CCEL HTML chapters acquired, with printed-page labels retained | Complete source-listed chapter inventory; modern electronic presentation remains distinct from a critical collation of the 1923 printing. |
| Belgic Confession, Heidelberg Catechism, Canons of Dort, Thirty-Nine Articles | Four already-cached complete Schaff document bodies promoted to acquired holdings without repeat downloads | Keep translations, parallel languages, footnotes and proof references with their particular witness. No synthetic reconciliation of confessional differences. |
| Savoy Declaration | Complete EEBO-TCP A89790 XML acquired under CC0: preface, 32 confession chapters and church order | 1659 printing of the 1658 declaration, with 43 page markers and 43 encoded editorial gaps. Schaff's partial witness was also retained separately; it does not become a full confession by relabeling. |

This is **26 historical source files: 21 new downloads and five unchanged promotions of cached evidence files**. Originals, timestamps, hashes and destinations are in [historical results](historical-results.json) and the [acquisition manifest](acquisition-manifest.json). [Encoded-text index](encoded-text-index.json) links XML headings and local readable derivatives. Raw files remain under `BibleProject/sources/library`; derivatives remain under `Website/.local/library/ready-text-completion/texts`.

CC0 permissions come from the [Perkins repository](https://github.com/textcreationpartnership/A09339) and [Savoy repository](https://github.com/textcreationpartnership/A89790), including their TEI availability statements. CCEL acquisitions retain the limits of its [personal, educational and nonprofit permission](https://www.ccel.org/about/copyright.html); this batch does not republish CCEL texts on the website.

## Begg: 80 transcripts acquired; missing texts identified

All **102 source-listed sermon pages** across five biblical books were processed. **80** contain substantial publisher transcripts; **22** do not. Audio was not transcribed to fill those gaps.

| Source-listed series | Pages checked | Transcripts acquired | Missing substantial transcript |
|---|---:|---:|---:|
| Titus, three volumes | 17 | 17 | 0 |
| 1 Timothy, two volumes | 23 | 21 | 2 |
| 2 Timothy, four volumes | 38 | 18 | 20 |
| Philemon | 3 | 3 | 0 |
| Philippians, two volumes | 21 | 21 | 0 |

Titus, Philemon and Philippians are complete against the publisher's listed series. This does not establish a census of every sermon Begg ever delivered on those books. Source-assigned passages, sermon numbers, order, resource/delivery dates, web publication dates, audio durations and official destinations are preserved. Scripture endpoints were checked against the app's Bible index; an assigned whole-book text is not automatically proof of exposition of every verse.

See [Titus inventory](begg-titus-inventory.json), [Titus results](begg-titus-results.json), [additional series inventory](begg-letters-inventory.json), and [additional results and gaps](begg-letters-results.json). All 80 original and derivative hashes passed verification; extracted transcript bodies match their source containers.

Begg's previously provisional acquisition eligibility was resolved using the ministry's [doctrinal statement](https://www.truthforlife.org/about/what-we-believe/), the existing grace-sermon evidence, and [Ligonier's documented teaching and publishing reception](https://learn.ligonier.org/teachers/alistair-begg). This permits qualifying acquisition under the broader Calvinist evangelical scope; it is not blanket endorsement. The [written-content policy](https://www.truthforlife.org/about/policies/) requires unchanged content, credit, and original/ministry links. Scripture notices stay attached. No new public publication occurred.

## Piper: recovered, then stopped on source rate limiting

The earlier worker stopped on a Windows checkpoint rename error. It was resumed using cached pages and originals, with retry handling for local file locks. A subsequent source request returned **HTTP 429 Too Many Requests**, and the collector stopped rather than repeatedly requesting the denied page. No proxy, alternate identity or alternate-host workaround was used. The recovery briefly used a one-second sequential interval; the resume script now restores the more conservative three-second interval and requires explicit cooldown review before another run.

| Current checkpoint | Count |
|---|---:|
| Inventoried author-message destinations | 2,397 |
| Substantial written messages acquired and hash-verified | 1,885 |
| Pages without substantial written text | 13 |
| Multiple-author entries kept for attribution/eligibility review | 8 |
| Rate-limited request | 1 |
| Destinations not yet processed | 490 |

Thus **491 requests remain unresolved**: the rate-limited page and 490 unprocessed destinations. All 1,885 original HTML files and their 1,885 text derivatives passed SHA-256 verification. These are existing written messages, not certified verbatim delivery transcripts. The count incorporates work from the other collection chat; it is not attributed entirely to this turn.

The [verified snapshot](piper-snapshot.json), [exact pending/exception list](piper-remaining.json), and [recovery checkpoint](piper-resume.json) are authoritative for this stop. Earlier modern reports and the original runner state can be stale. The [Desiring God permission](https://www.desiringgod.org/permissions) supports the recorded private noncommercial copies; public full-text publication and app indexing remain separate.

## Remaining source decisions

- **Piper:** review the source cooldown, then resume the one stopped queue. Do not launch a second worker or re-download completed URLs. Leave audio-only/short-description pages and mixed-speaker records distinct.
- **Begg:** the 22 absent transcripts remain explicit source gaps; do not create transcripts from audio in this acquisition mission. Any newer source edition must retain its own date and relationship to the original sermon.
- **Sproul/Ferguson:** existing Ligonier transcript pages remain useful links; its [policy](https://www.ligonier.org/copyright-policy) does not establish permission for this proposed bulk text corpus. Already offered ebook editions elsewhere remain separate holdings.
- **MacArthur, Criswell and MLJ Trust:** retain the existing access/permission queue, without another crawl or workaround. See [modern source decisions](../modern-texts/SOURCE-QUEUE.md).
- **Other chats:** the modern author-library and historical EPUB passes have separate ledgers. This batch does not duplicate them or change their author classifications. Commercial books and publisher samples are not missing-OCR assignments.

## Reuse and verification

- `scripts/finish-ready-texts.py` resumes the named historical and Begg acquisitions by URL; saved files are reused with hashes. It never runs OCR.
- `scripts/catalog-ready-completion.py` registers these holdings and source relationships; `scripts/verify-ready-completion.py` checks bodies, volume identity, hashes and series inventories offline.
- `scripts/report-ready-completion.py` verifies the saved Piper originals/derivatives and records the exact queue snapshot without network access.
- `scripts/resume-piper-safely.py` wraps the existing Piper collector with Windows-safe checkpoint retries. After reviewing source cooldown, `--resume-after-cooldown` explicitly reopens the stopped queue. Its project-local dependency is `typing_extensions==4.16.0`; existing BeautifulSoup remains the collection dependency.

The catalog additions comprise **80 sermon works, 94 editions, 106 text assets and ten series records**. The full library validator and seven acquisition-integrity checks pass. Private acquisition, author eligibility, work review and public publication remain distinct states.
