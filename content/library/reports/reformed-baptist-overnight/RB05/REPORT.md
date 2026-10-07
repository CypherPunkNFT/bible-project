# RB05: church membership, polity, discipline and ministry

**Acquisition finished and checkpointed on 7 October 2026.** Eight immutable originals, **21,171,393 bytes**, were acquired: **seven offered journal PDFs and one HTML response containing Dagg's missing historical introduction**. These represent seven new issue witnesses and completion of a held work, **not eight new complete books**. Seven journal files contain 372 file pages altogether and substantial existing text layers; no OCR was needed.

The session started at **08:57:21 UTC**. The acquisition, mapping, verification and documentation checkpoint was reached roughly **43 minutes** later; commit/push closeout follows within the approximate 60-minute budget. This is a bounded completed batch, not a claim that every possible church resource has been found.

**New RB05 originals are not ingested or embedded.** No new DB/vector/graph/enrichment worker, OCR, audio/video acquisition, scheduler/watchdog change, public full-text hosting or deployment was performed. No next mission was launched automatically.

[Manifest and original/derivative hashes](acquisition-manifest.json) · [Source-first bibliography](bibliography.json) · [Exact checkpoint](checkpoint.json) · [Verification](verification.json) · [Source/rights exceptions](source-exceptions.json)

## Actual acquisitions

| Work / offered witness | Verified extent | Private derivative words | Useful new coverage |
|---|---|---:|---|
| 9Marks, *Living as a Church* | May/June 2008, volume 5 issue 3; 102 PDF pages | 62,664 | All thirteen course lessons: membership, preaching, prayer, government, fellowship, discontentment, leadership, discipline, encouragement, serving/giving, worship and evangelism. Joint course credit: Jamie Dunlop, Papu Sandhu and Greg Gilbert; individual lesson authors are not invented. |
| 9Marks, *Church Discipline, Part II* | November/December 2009, volume 6 issue 6; 42 pages | 18,873 | Teaching before discipline, non-attendance, resignation, witnesses, a multi-pastor forum and membership-roll care. Reviews excluded from selected teaching components. |
| 9Marks, *Deacons* | May/June 2010; publisher's later reoffered file; 34 pages | 10,523 | Seven substantial articles on qualifications, titles, service, task-specific ministry, elder/deacon distinctions and patient polity transition. |
| 9Marks, *Lay Elders* | November/December 2012, Part I; 40 pages | 15,902 | Seven articles on elder responsibilities, time, character, training, accountability and delegation. Includes paid/unpaid elder comparisons without treating different work schedules as different biblical offices. |
| Founders Journal 73, *Church Purity* | Summer 2008; 36 pages | 17,125 | Nettles on regenerate membership/holiness, Boyce's 1852 discipline article and 1879 commencement address, Robinson's historical study of H. H. Tucker. Five selected articles; news/reviews excluded, including on shared last pages. |
| Founders Journal 90, *Singing in the Church* | Fall 2012; 47 pages | 17,418 | Ascol's introduction and Exodus 15 exposition, DeYoung's congregational-music principles and Puls's substantial teaching notes. Four selected units; Presbyterian comparison and publisher/contributor rights remain distinct. |
| Founders Journal 129, *Baptists, Puritans, and Preaching* | Fall 2025; 71 pages | 28,529 | Five articles: Nettles's introduction and Smyth biography, Marsh on Collins/credobaptism, Scheiderer on listening/preaching, Carpenter on Baptist/Puritan history. Historical quoted positions are not automatically approved teaching. |
| John Leadley Dagg, *Obedience to Christ* | Complete selected Introduction to the 1858 Church Order treatise, from SermonIndex HTML; duplicate preface/TOC and reformatter footer excluded | 1,404 | Repairs a genuine held-work gap. Thirteen correct RB01 historical components plus this introduction form the offered component set across two hosts. Transcription errors retained; no claim of critical-edition collation. |

**172,438 total derivative words include reviews, quotations, publisher material and overlap.** They are not a unique endorsed-corpus measurement. Every acquired source URL is listed in [SOURCES.md](../../../../../SOURCES.md); the manifest records final URLs, retrieval dates, edition, format, immutable source path, SHA-256, completeness and rights evidence. Private bodies and caches were not placed in Git.

## Holdings audit and duplicates avoided

The [input audit](input-audit.json) records 41 governance, registry, earlier report and ledger inputs. The [holdings audit](holdings-audit.json) verifies **129 actual relevant originals** against recorded hashes and inspects available EPUB/XML structure. This is a point-in-time identity/structure audit, not exhaustive theological reading of all 129 works. Broad surname matches remain discovery context: Francis Fuller is not Andrew Fuller.

Already held and reused:

- **Keach, Glory of a True Church:** readable 2024 Crowdedship edited/formatted EPUB, 11, 531 audit words. Sixteen resolved navigation units: To the Reader, fourteen sections and the covenant. Its modern editorial work and CC BY-NC-ND conditions remain attached; it is not untouched 1697 typography.
- **Spurgeon, Lectures to My Students:** readable combined EPUB, 227,144 audit words; all thirty navigation targets resolve, including two introductions and **28 numbered lectures**. The final lecture treats scientific sources of illustration. An All Around Ministry, Only a Prayer Meeting, Pastor in Prayer, Soul Winner and Commenting and Commentaries also already have bodies. The last is XML, not an EPUB or missing book.
- **Broadus, Preparation and Delivery of Sermons:** readable 157,546-word EPUB, **1898 new/twenty-third edition edited by Edwin Charles Dargan**. All29 navigation targets resolve, covering prefaces/introduction and five parts: material, arrangement, style, delivery and conduct of public worship. This is not a first-edition autograph.
- **Dagg, Church Order:** preface, ten chapters, conclusion and appendix already held. ChapterVII covers public worship, VIII ministry and IX discipline. The introduction required the correction below.
- Prior Founders church/reformation, worship and ordinance issues and the RB04 Fuller collection were reused instead of blindly acquiring another author-wide bundle.

## Important prior identity and contributor corrections

**RB01's Founders “Introduction” was misattributed.** The page is signed **Stan Reeves** and discusses the modern1689 confession, not Dagg's *Obedience to Christ*. [identity-corrections.json](identity-corrections.json) preserves the previous/corrected identities and unchanged original SHA. The RB01 target, manifest, bibliography, intake metadata and private provenance now identify Reeves and keep the file metadata-only. The earlier RB01 report is clearly qualified as a historical snapshot.

The recovered historical introduction is a **different original**, `asset-rb05-20bf4bdf56c07737c44b`. No original was overwritten and no DB row was changed. Later intake must remove/relabel any old Dagg attribution already indexed, rather than leave contradictory identities searchable.

Dagg's preface also expressly credits **G. W. Samson with the chief Appendix article**. The held Appendix now carries a mixed-contributor authorship note and an explicit metadata-only hold. Dagg framing, Samson contribution and quoted geography must be separated before teaching intake; no global Samson approval was inferred.

## Study locations, theology and useful scope

[READING-MAP.md](READING-MAP.md) opens with seven church-study questions and records **260 source reading/navigation units across 29 witnesses**. Units include lessons, articles, essay bands, parts, chapters and front matter; they are not 260 new chapters/books or a Scripture-coverage percentage. File pages are one-based and distinguished from printed pagination. EPUB members/anchors and derivative line ranges are tied to exact hashes in [chapter-map.json](chapter-map.json).

[48 exact private journal slices](selected-components.json) supply **140,089 derivative words** in selected church-life lessons/articles. News, advertisements and reviews are excluded. Shared last pages in Church Purity were trimmed at actual news/review boundaries, retaining the article's closing notes.

[Five additional Fuller components](fuller-components.json), **50, 535 words**, were prepared from the **already acquired RB04** 1846 collection: church polity/private judgment/creeds/dissent/discipline/union; ordination and ministry counsel; communion; instrumental music; singing. These are new reading locations, not new downloads. Running headings sometimes appear before the previous article ends; boundaries were checked against body endings rather than guessed from header matches. The anthology's prior intake hold is unchanged.

[Primary theological evidence](theological-evidence.json) and [work-specific decisions](admission-decisions.json) distinguish publisher frameworks, actual biographies/arguments, six-anchor confession evidence and unresolved contributors. Named CHBC members/elders/pastors have their actual issue biographies linked to the church's member confession. Merkle's SEBTS affiliation is paired with primary faculty-confession requirements; Rinne/Kell and selected Founders authors have their own church/context evidence. Current confessions remain current evidence, not proof those exact editions governed older articles. **No global author-registry approvals changed.** Unverified contributors remain provisional.

[THEOLOGICAL-DISTINCTIONS.md](THEOLOGICAL-DISTINCTIONS.md) retains congregational keys versus elder oversight/deacon service; credible-profession membership versus infallible regeneration judgments; patient restorative discipline versus untaught implementation; inability to attend versus willful abandonment; contested resignation procedures; different communion boundaries; Merkle's wives reading versus Del Ray's current deaconess practice; Presbyterian music counsel versus Baptist government; and Fuller/Keach/modern worship applications. Fuller argues for strict communion and questions instrumental music; these do not silently become the owner's policy. Smyth's changing historical positions and quoted opponents remain historical evidence.

## Rights and intake holds

The **four historical 9Marks issues contain explicit, work-specific permission notices**: unchanged wording, retained credit, cost-only charging and at most 1,000 physical copies; source links are preferred for web posting. The course separately permits adaptation for teaching. Exact notice pages are in the manifest. These notices do not authorize all 9Marks works or override the owner's no-public-full-text scope.

The 2025 *Healthy Churches Beginner Guide* was inspected for access/terms but **not promoted into the acquisition manifest**: PDF page 2 expressly restricts retrieval-system storage without permission. The 2017 discipline issue and adjacent counseling/pastoral issues remain discovery-only/deferred; offered access and an HTTP cache are not completed acquisitions or cleared indexing rights.

Founders' current issue pages explicitly offer the three acquired PDFs. The Fall 2012 issue says past PDFs are free, while other ebook formats are separate products; Puls's notes are labelled used by permission. These facts support bounded private acquisition and source identity, **not a blanket external full-text/AI-corpus license**. Contributor and indexing-rights questions remain attached. No login, paywall, registration or paid-book route was bypassed.

**Seven mixed journal parents are explicitly `evidenceOnly: true`.** The current generic importer recognizes this as metadata-only. Exact selected components are advisory; full contributor, review, quotation and rights enforcement is not implemented here. Keep parent holds until [INTAKE-NOTES.md](INTAKE-NOTES.md) is fulfilled. Incidental Catholic/progressive reviewed books are excluded from teaching intake; none was deliberately acquired as teaching or opposing-source material.

## Verification and exact resumption

**457 verification checks pass**, including eight original/provenance/derivative sets and extraction replays, 129 held original hashes, 260 reading units, 53 private source slices, source/bibliography parity, seven parent holds and read-only intake planner parity. All selected held EPUB navigation targets resolve. Python compilation, library structural validation (**76 authors, 32 sources, eight collections, 110 subjects, 13,440 formal records**) and Git whitespace checks pass. Source-first entries do not claim the formal catalogue already absorbed these acquisitions.

The successful filtered [runtime check](runtime-check.json), dated 09:35 UTC, found zero relevant active RB01–RB05 collectors or Bible acquisition/intake/embedding processes after excluding its own inspection process. The [existing embedding snapshot](embedding-snapshot.json) is complete at **1,901,555 / 1,901,555**, zero remaining, timestamp07:20:27 UTC; it predates RB05 and does not include these new originals.

The [checkpoint](checkpoint.json) is exact and resumable:

1. Run its named verification commands to check local hashes and planner hints. The collector skips all eight acquired URLs; no unchanged-source retry is needed.
2. At the owner-directed **post-RB14 aggregate intake**, reconcile the Reeves/Dagg identity and Samson attribution hold; integrate the 48 journal and five Fuller components with contributor, rights, duplicate and quotation scopes before releasing parent holds.
3. For a later RB05 extension, resolve the explicit contributor/rights queue. The 2025 guide remains permission-dependent, and deferred issues do not count as solved work gaps. Do not rerun earlier report writers over the documented attribution correction.
4. **RB06 begins only when requested.** Reuse held pastoral/prayer resources. No automatic next mission, embedding or enrichment launch occurred.

SOURCES, source identities, acquisition BACKLOG, the mission document and project TODO/HANDOFF are updated. The fourteen-mission runtime gate and watchdog remain unchanged.
