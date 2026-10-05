# Sermon coverage audit — all 66 books

Checked 2026-10-05. L05 bounded catalog audit and gap research.

The catalog reaches **all 66 books by main-text assignment**, but it is not a complete exposition library. Its **3,795 core sermon units** are highly concentrated: Charles Haddon Spurgeon supplies **3,545 (93.4%)**. Main-text ranges span **4,218/31,102 verses (13.56%)**; **354 chapters** have no mapped main text. This percentage measures bibliographic assignments, not how much Scripture has been substantially explained.

## What the evidence supports

- 3,807 sermon-genre records minus 9 historical-context sermons and three collection/container records yield 3,795 core units. These are catalogued published units, not distinct delivered occasions. Newton's author-abridged discourses, intended-for-pulpit texts, and posthumous collections keep their original classifications in L03.
- 3,682 units have at least one verified main-text mapping; 113 have none. 121 main-text assignments remain unresolved; 0 individual units have no passage record. See [exact exceptions](passage-exceptions.json) and [summary](summary.json).
- The canonical catalog contains 0 works with an explicit substantial-exposition mapping. A targeted, AI-assisted review of four existing texts establishes two narrowly bounded verse treatments, one application-dominant sermon and one book-level thematic survey. The other 3,791 units are **unassessed here**, not judged non-expository. No statistical estimate is extrapolated from this purposive sample.
- A supporting quotation is a citation, not passage coverage. Source-assigned main texts, assessed exposition, thematic surveys and incidental citations remain separate. A main-text label alone cannot certify exposition; a small main-text span can also understate a sermon’s actual scope.
- Counts use unique work IDs and canonical verse unions. Multiple formats, edition copies and overlapping passage assignments do not multiply coverage. Different numbered sermons with repeated titles remain distinct. Published-work identity still depends on the acquisition inventories; undiscovered duplicate occasions cannot be ruled out.
- English/KJV chapter and verse numbering comes from the project's 66-book Scripture index. Cross-chapter ranges enumerate actual verses. Other numbering systems and unresolved references are excluded with an exception, never silently guessed.

## Reviewed examples: the limits of the metadata

Substantial exposition means sustained explanation of a passage’s language, argument or narrative and its application. It need not be verse-by-verse, but a passing quotation or transferred analogy does not establish contextual exposition. These are passage-treatment judgments, not full theological or transcription reviews.

| Existing sermon | Assessment | Evidence and limit |
|---|---|---|
| [The Immutability of God (no. 1)](https://www.spurgeongems.org/sermon/chs1.pdf) | substantial-exposition: Malachi 3:6 | PDF pages 1-6, with concluding structural heading on page 8. Explains God's unchangeableness, the sons of Jacob and their preservation through the clauses of the announced text. This is sustained doctrinal/textual exposition of one verse, not a survey of Malachi. |
| [Good Cause for Great Zeal (no. 1097)](https://www.spurgeongems.org/sermon/chs1097.pdf) | application-dominant: Ezra 4:14 | PDF pages 1-2; structural headings on pages 4 and 7. Identifies the hostile letter to Artaxerxes, then transfers its language about royal maintenance and honor to Christian service. Retain main-text status, but do not certify contextual exposition of Ezra from this chiefly analogical application. |
| [The Parent’s and Pastor’s Joy (no. 1148)](https://www.spurgeongems.org/sermon/chs1148.pdf) | substantial-exposition: 3 John 1:4 | PDF pages 1-2; pastoral section heading on page 6. Distinguishes John's spiritual children from the parental application and explains walking in truth. Qualifies narrowly for verse 4, not the rest of the letter. |
| [Providence—As Seen in the Book of Esther (no. 1201)](https://www.spurgeongems.org/sermon/chs1201.pdf) | book-level-thematic-survey: Esther 9:1 (source main text) | PDF pages 1-5; deliverance heading on page 7. Surveys providence across Esther's narrative: placement of agents, restraint of enemies, trials, small events and deliverance. The main-text tag understates scope, but no whole-book verse coverage is inferred from the survey. |

The brief James 1:17 quotation in sermon 0001 is recorded as incidental, adding no exposition coverage to James. Citation indexing is illustrative, not exhaustive. [Assessment records](assessments.json) pin each judgment to the retained asset SHA-256; they do not rewrite the source PDF or silently promote the canonical editorial state.

## Where acquisition and review will help most

1. **Ezra, Obadiah, 2 John and 3 John:** only one mapped core sermon apiece. Ezra 4:14 is application-dominant in the inspected sermon. The 3 John treatment establishes verse 4, not the whole letter. Prioritize contextual units across the remaining passages, and a second preacher for each book.
2. **Esther and Philemon:** two mapped units each. Esther already has a broader thematic survey, so its low main-text count must not be read as proof that the narrative is absent. Whole-letter Philemon exposition and an explicitly mapped Esther sequence remain priorities.
3. **Long historical and legal books:** Leviticus, Numbers, Deuteronomy and Chronicles have low assigned-verse density and many untouched chapters. Seek continuous contextual treatment of laws, genealogies, covenant obligations and narrative transitions, rather than another isolated familiar verse.
4. **Short prophetic books:** Haggai 1 has no mapped main text; chapter 2 has five mapped verses. Obadiah is represented only by verse 17. The verified resources below address missing spans and author diversity, while retaining each preacher’s interpretations. Haggai 2:4–5 already appears in an unresolved Spurgeon reference (sermon 1918): not every unmapped verse is a missing resource.
5. **Review before claiming completion:** Ruth and 2 Peter have full main-text span coverage through the L04 pilots. Review their bodies before calling either book fully expounded. Prioritize body review of the sole-book witnesses and broad chapter labels next.

## Preacher concentration

| Author | Core sermon units | Share |
|---|---:|---:|
| Charles Haddon Spurgeon | 3,545 | 93.41% |
| John Newton | 84 | 2.21% |
| Jonathan Edwards | 64 | 1.69% |
| George Whitefield | 57 | 1.50% |
| J. C. Ryle | 29 | 0.76% |
| R. C. Sproul | 12 | 0.32% |
| John Piper | 4 | 0.11% |

**25 books** have only one mapped author: Leviticus, Numbers, Judges, 1 Samuel, 2 Samuel, 1 Chronicles, 2 Chronicles, Ezra, Nehemiah, Esther, Song of Songs, Joel, Amos, Obadiah, Nahum, Habakkuk, Zephaniah, Galatians, Colossians, 2 Thessalonians, Titus, Philemon, 2 John, 3 John, Jude.
**61 books** receive at least 80% of mapped units from one author. Book-level shares and work IDs are in [book-coverage.json](book-coverage.json). This is acquisition imbalance, not a judgment on preacher quality. The next broad historical acquisition should add Calvin/Perkins and other eligible voices, while targeted Piper additions solve immediate holes. Adding Piper alone would merely shift the concentration over time.

## Series completeness and holdings gaps

All **83** recorded series were checked for expected counts, duplicate memberships/positions, unresolved work IDs and missing ordinals. **0** have membership problems or declared missing entries. [Full series audit with inventory sources](series-audit.json).
The 64 Spurgeon series records represent 63 published-volume inventories plus their volume collection; the 17 L03 records are bounded historical divisions. They are not 81 continuous biblical-book sermon series. The two L04 records are complete four-part Ruth and twelve-part 2 Peter source inventories. None of these facts establishes an author-wide or body-reviewed exposition corpus.

| Incomplete or unestablished unit | Known boundary and next action |
|---|---|
| L02 Puritan components | Acquisitions reached Calvin, Perkins, Owen, Sibbes, Watson and Flavel volumes 1–3; Flavel volume 4 interrupted the queue. Goodwin, Bunyan and Boston remain planned. Index and reconcile retained scans; do not count raw files as sermon units. [Checkpoint](../puritan-sermons/REPORT.md). |
| Perkins Jude exposition | L02 identified 66 sermons in the acquired edition. The component catalog is unfinished: eligible future sermon units, not 66 current coverage records. Preserve print/OCR page alignment before mapping passages. |
| Bullinger / Flavel aggregate links | Existing collection-level records lack component inventories; Bullinger's linked volume does not establish all five decades. Expected missing-unit counts are unknown. |
| Historic author corpora | L03 completed selected editions/divisions, not exhaustive Edwards, Whitefield, Newton or Ryle bibliographies. Review their documented expansion gaps and original/posthumous distinctions. [L03 report](../historic-preaching/REPORT.md). |
| Modern author breadth | L04 has no admitted individual sermon series for Ferguson, Packer or Murray; source availability and completeness remain to be established. MLJ Trust database retrieval requires prior written permission. These are catalog/access gaps, not claims that sermons do not exist. [L04 report](../modern-preaching/REPORT.md). |
| Piper Minor Prophets | Two relevant 1982 messages are verified below; no complete series contents census was performed. Expected total and missing positions remain unknown. |

Availability is independent of exposition and inventory completeness. Current units by asset relationship: downloaded-direct-or-parent: 3,779; source-record-only: 16. Parent-volume assets count as availability for embedded sermons; this avoids falsely reporting historical components as unacquired. Status comes from the asset catalog, not a fresh integrity check of every source byte, and it does not grant republication rights.

## Verified gap-filling discoveries

All authors below are eligible in the shared registry. These are **discovery records outside the baseline**, not newly acquired or published sermons. [Structured resource records and next actions](gap-resources.json).

| Resource | Passage and contribution | Acquisition boundary |
|---|---|---|
| [Fasting for the Safety of the Little Ones](https://www.desiringgod.org/messages/fasting-for-the-safety-of-the-little-ones) — John Piper, 1995-01-22 | Ezra 8:21-23. Adds a second preacher and three currently unassigned main-text verses in Ezra. An occasional sermon, not a complete Ezra series. Contemporary political/medical claims are outside this passage audit and are not independently endorsed or verified. | Retain bibliographic facts and official links. No whole-text republication or audio re-upload. Any future embed must satisfy current policy; systematic retrieval requires a separate access decision. |
| [Eagle Edom Will Come Down](https://www.desiringgod.org/messages/eagle-edom-will-come-down) — John Piper, 1982-11-07 | Obadiah. A sustained whole-book treatment that could add twenty currently unassigned main-text verses and a second preacher. Piper's covenant/inheritance interpretation remains his own; not a merged consensus reading. | Official links only under this mission; no text/media republication or automated archive retrieval. |
| [Take Courage: You Build More Than You See](https://www.desiringgod.org/messages/take-courage-you-build-more-than-you-see) — John Piper, 1982-11-28 | Haggai. Adds a third mapped preacher and targets seven currently unassigned verses within 2:1-9. Two of those verses (4-5) already occur in an unresolved Spurgeon reference, so part of the apparent gap is metadata debt. Chapter 1 remains unmapped. Whole-book source tagging does not establish exposition of all 38 verses. | Official links only under this mission; no text/media republication or automated archive retrieval. |
| [The Sermons of M. Iohn Calvin upon the fifth booke of Moses called Deuteronomie](https://commons.ptsem.edu/id/sermonsofmiohnca1583calv) — John Calvin, 1583 | Deuteronomy. Promising substantial historical corpus for an underserved long book, with a different preacher and era. No numerical gap closure claimed before component indexing. | Library labels this edition No Known Copyright. Confirm the linked asset and source access conditions before retrieval; this is not an unrestricted license for every modern Calvin edition. |

The three Piper bodies were inspected at the named headings recorded in the discovery register. Together their narrow targets contain **30 currently unassigned main-text verses**, but zero have been added to this snapshot. Two of those verses (Haggai 2:4–5) already have an unresolved catalog reference, so this is not a claim of thirty wholly absent passage treatments. The [Desiring God policy](https://www.desiringgod.org/permissions) supports source links and qualified sharing; entire textual republication and audio re-upload are not granted here. The [Calvin library record](https://commons.ptsem.edu/id/sermonsofmiohnca1583calv) verifies an English 1583 edition with a No Known Copyright label; its contents and source-specific download conditions still need checking. No modern curated edition was copied.

No qualifying complete Esther, 2 John, 3 John or Philemon sermon series was established by this bounded search. Those gaps remain open. General articles, quoted excerpts from an eligible preacher inside someone else’s sermon, and sermons by unregistered preachers were not substituted for qualifying corpora.

## All 66 books

**Units** counts sermons with a verified source-assigned main text in the book; a multi-book sermon can appear in several rows. **Span** is unique assigned verses, not exposition. **Reviewed exp.** is the narrow assessed exposition layer (zero means not established, not absent). Empty chapters have no mapped main text; exact remaining verse ranges are in [book-coverage.json](book-coverage.json).

| Book | Units | Main-text span | Chapters touched | Authors | Reviewed exp. verses | Chapters with no mapped main text |
|---|---:|---:|---:|---:|---:|---|
| Genesis | 98 | 116/1533 (7.6%) | 31/50 | 4 | 0 | 2, 10, 13, 18, 20, 23, 25, 29–30, 33–34, 36–38, 40, 43–44, 47, 50 |
| Exodus | 55 | 85/1213 (7.0%) | 24/40 | 3 | 0 | 2, 5, 18–19, 22–27, 31, 35–37, 39–40 |
| Leviticus | 13 | 18/859 (2.1%) | 8/27 | 1 | 0 | 3, 6–10, 12, 14–15, 17–21, 23–27 |
| Numbers | 26 | 46/1288 (3.6%) | 17/36 | 1 | 0 | 1–3, 5, 7–8, 12, 15, 18, 20, 25, 27–31, 33–34, 36 |
| Deuteronomy | 46 | 63/959 (6.6%) | 17/34 | 2 | 0 | 3, 5, 9, 12–14, 16–17, 19–21, 24–28, 31 |
| Joshua | 15 | 18/658 (2.7%) | 9/24 | 2 | 0 | 4, 9–16, 18–23 |
| Judges | 17 | 26/618 (4.2%) | 13/21 | 1 | 0 | 2, 10, 12, 17–21 |
| Ruth | 10 | 85/85 (100.0%) | 4/4 | 3 | 0 | — |
| 1 Samuel | 38 | 50/810 (6.2%) | 19/31 | 1 | 0 | 6, 8, 11, 13–14, 19, 23–24, 26, 28–29, 31 |
| 2 Samuel | 33 | 39/695 (5.6%) | 15/24 | 1 | 0 | 4, 8–10, 13, 20–22, 24 |
| 1 Kings | 32 | 45/816 (5.5%) | 12/22 | 2 | 0 | 1, 3, 6–7, 11, 13, 15–16, 21–22 |
| 2 Kings | 29 | 39/719 (5.4%) | 13/25 | 2 | 0 | 1, 9, 12, 14–16, 19, 21–25 |
| 1 Chronicles | 15 | 26/942 (2.8%) | 8/29 | 1 | 0 | 1–3, 5–11, 14, 17–20, 23–27, 29 |
| 2 Chronicles | 24 | 40/822 (4.9%) | 17/36 | 1 | 0 | 1, 3–4, 8–11, 13–15, 18–19, 21–23, 25–26, 29, 36 |
| Ezra | 1 | 1/280 (0.4%) | 1/10 | 1 | 0 | 1–3, 5–10 |
| Nehemiah | 10 | 12/406 (3.0%) | 8/13 | 1 | 0 | 6–7, 10–11, 13 |
| Esther | 2 | 3/167 (1.8%) | 2/10 | 1 | 0 | 1–3, 5–8, 10 |
| Job | 90 | 108/1070 (10.1%) | 33/42 | 3 | 0 | 2, 4, 20, 24–26, 31, 39, 41 |
| Psalms | 444 | 466/2461 (18.9%) | 121/150 | 4 | 0 | 3, 6, 13, 15, 20, 43, 49, 52–54, 58, 64, 75, 79, 82, 93, 109, 114, 117, 122, 128–129, 133–134, 137, 140, 142, 148, 150 |
| Proverbs | 48 | 52/915 (5.7%) | 21/31 | 4 | 0 | 1–3, 7, 9–10, 12–13, 19, 21 |
| Ecclesiastes | 16 | 17/222 (7.7%) | 8/12 | 2 | 0 | 1–2, 5, 10 |
| Song of Songs | 63 | 58/117 (49.6%) | 8/8 | 1 | 0 | — |
| Isaiah | 283 | 248/1292 (19.2%) | 50/66 | 4 | 0 | 4, 10, 13, 15–18, 20–21, 23–24, 29, 31, 34, 37, 39 |
| Jeremiah | 96 | 107/1364 (7.8%) | 31/52 | 4 | 0 | 7, 16, 19–22, 25–27, 34–37, 39–43, 45–46, 52 |
| Lamentations | 15 | 16/154 (10.4%) | 4/5 | 2 | 0 | 5 |
| Ezekiel | 59 | 81/1273 (6.4%) | 26/48 | 2 | 0 | 2, 4–8, 10, 21, 25–26, 28–32, 38–39, 41–42, 44–46 |
| Daniel | 20 | 22/357 (6.2%) | 9/12 | 3 | 0 | 2, 7, 12 |
| Hosea | 53 | 49/197 (24.9%) | 13/14 | 3 | 0 | 9 |
| Joel | 6 | 5/73 (6.8%) | 2/3 | 1 | 0 | 1 |
| Amos | 16 | 16/146 (11.0%) | 8/9 | 1 | 0 | 1 |
| Obadiah | 1 | 1/21 (4.8%) | 1/1 | 1 | 0 | — |
| Jonah | 12 | 12/48 (25.0%) | 4/4 | 2 | 0 | — |
| Micah | 21 | 19/105 (18.1%) | 6/7 | 2 | 0 | 3 |
| Nahum | 4 | 3/47 (6.4%) | 2/3 | 1 | 0 | 2 |
| Habakkuk | 8 | 6/56 (10.7%) | 3/3 | 1 | 0 | — |
| Zephaniah | 4 | 5/53 (9.4%) | 2/3 | 1 | 0 | 1 |
| Haggai | 4 | 5/38 (13.2%) | 1/2 | 2 | 0 | 1 |
| Zechariah | 38 | 52/211 (24.6%) | 12/14 | 3 | 0 | 5, 11 |
| Malachi | 14 | 12/55 (21.8%) | 4/4 | 2 | 1 | — |
| Matthew | 250 | 294/1071 (27.4%) | 28/28 | 5 | 0 | — |
| Mark | 93 | 136/678 (20.1%) | 15/16 | 3 | 0 | 13 |
| Luke | 239 | 322/1151 (28.0%) | 24/24 | 5 | 0 | — |
| John | 329 | 324/879 (36.9%) | 21/21 | 5 | 0 | — |
| Acts | 100 | 129/1007 (12.8%) | 25/28 | 4 | 0 | 21–22, 25 |
| Romans | 143 | 142/433 (32.8%) | 16/16 | 3 | 0 | — |
| 1 Corinthians | 97 | 93/437 (21.3%) | 14/16 | 4 | 0 | 8, 14 |
| 2 Corinthians | 68 | 52/257 (20.2%) | 13/13 | 5 | 0 | — |
| Galatians | 43 | 41/149 (27.5%) | 6/6 | 1 | 0 | — |
| Ephesians | 71 | 62/155 (40.0%) | 6/6 | 4 | 0 | — |
| Philippians | 36 | 38/104 (36.5%) | 4/4 | 3 | 0 | — |
| Colossians | 32 | 27/95 (28.4%) | 4/4 | 1 | 0 | — |
| 1 Thessalonians | 18 | 19/89 (21.4%) | 5/5 | 4 | 0 | — |
| 2 Thessalonians | 14 | 9/47 (19.1%) | 3/3 | 1 | 0 | — |
| 1 Timothy | 24 | 16/113 (14.2%) | 6/6 | 2 | 0 | — |
| 2 Timothy | 23 | 24/83 (28.9%) | 4/4 | 3 | 0 | — |
| Titus | 8 | 14/46 (30.4%) | 3/3 | 1 | 0 | — |
| Philemon | 2 | 2/25 (8.0%) | 1/1 | 1 | 0 | — |
| Hebrews | 142 | 120/303 (39.6%) | 13/13 | 5 | 0 | — |
| James | 29 | 37/108 (34.3%) | 5/5 | 3 | 0 | — |
| 1 Peter | 46 | 40/105 (38.1%) | 5/5 | 2 | 0 | — |
| 2 Peter | 23 | 61/61 (100.0%) | 3/3 | 2 | 0 | — |
| 1 John | 55 | 45/105 (42.9%) | 5/5 | 2 | 0 | — |
| 2 John | 1 | 1/13 (7.7%) | 1/1 | 1 | 0 | — |
| 3 John | 1 | 1/14 (7.1%) | 1/1 | 1 | 1 | — |
| Jude | 13 | 11/25 (44.0%) | 1/1 | 1 | 0 | — |
| Revelation | 80 | 86/404 (21.3%) | 16/22 | 4 | 0 | 6, 9–10, 13, 17–18 |

## Reproduce and resume

Run `python -X utf8 scripts/analyze-sermon-coverage.py` from Website, then `python -X utf8 -m unittest discover -s scripts/tests -p test_sermon_coverage.py` and `node scripts/validate-library.mjs`. The generator reads catalog works, editions, assets, series, the author registry, canonical verse counts, and the two explicit review/discovery inputs. [Input hashes](input-manifest.json) and [summary fingerprint](summary.json) make the evidence boundary reproducible. It performs no network calls.

Next: (1) reconcile unresolved main-text assignments; (2) body-review sole-book witnesses and the Ruth/2 Peter pilots; (3) admit the three official sermon links with full L04 recording metadata; (4) finish L02 component indexing and collate Calvin's Deuteronomy edition; (5) search for continuous Esther and short-epistle series across other eligible ministries. Preserve dates, rights, uncertain identities and disagreements at every step.

This report is saved in the collection desk. It changes neither website publication selection nor search ingestion. All-book reach, acquisition completeness, substantial exposition, text quality and permission to publish are separate claims.
