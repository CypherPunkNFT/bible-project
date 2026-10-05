# Annotated study path collection

Created 2026-10-05 from existing catalog material. [Open the five study paths](PATHS.md).

The collection contains **five paths, 15 ordered stages, 17 Scripture assignments, 15 sermon assignments and 15 substantial reading assignments**. It uses **24 existing catalog works** through 28 specific source selections. Thirteen distinct sermons appear; two are revisited for a different learning purpose. No books, recordings or transcripts were acquired for this mission.

| Audience or need | Path | Progression |
|---|---|---|
| New believers | [Grace and the beginning of Christian life](new-believers.md) | Grace, repentance and faith, new life and fellowship |
| Deeper theological study | [Christ and justification in deeper study](deeper-theology.md) | Christ’s representative work, justification, living faith and obedience |
| Apologetic questions | [Scripture miracles and resurrection](apologetic-questions.md) | Define inspiration, examine miracle arguments, assess resurrection testimony |
| Pastoral concerns | [Grief assurance and care at home](pastoral-concerns.md) | Accompany sorrow, distinguish weak faith from lack of faith, practice household care |
| Ministry preparation | [Character teaching and mission in ministry](ministry-preparation.md) | Personal character, understanding and application, accountable service and mission |

Each stage gives its purpose, source-linked Scripture, an explicitly delimited sermon selection, a substantial reading, reasons for both selections, a reflection question and an exercise. Each path states preparation, suggested pace and a completion objective. Pacing is editorial advice, not a measured reading-time estimate. The two uses of Spurgeon 126 and 460 deliberately move from introductory explanation to closer doctrinal examination.

## What verified means here

The [selection register](resources.json) preserves work, edition and asset IDs, source URLs, assignment boundaries, passages actually inspected, reasons for inclusion, limits and existing rights decisions. Existing bibliographic or publication status alone was not treated as a complete content review. Relevant passages were checked in acquired PDFs, source pages or prior scoped body assessments from the completed missions.

For acquired PDFs, the builder checks original-file SHA-256 and retains a hash of text extracted from the selected pages. Extracted text is used for local verification, not saved as a new public corpus. Web selections retain exact section locators and inspection dates; no retained full-page snapshot or verbatim edition collation is claimed. The [input manifest](input-manifest.json) fingerprints catalog records, source assessment files and the existing KJV endpoint index.

All recommendations use eligible core-teaching authors. The guides are AI-assisted editorial recommendations, not approval by an external pastor, theologian or institution. No canonical work was promoted to fully reviewed or newly published. The historical source’s original argument remains accessible, including disagreements and contextual limitations.

Important boundaries are visible in the paths:

- Spurgeon’s *The Bible* explains Christian conviction but explicitly declines to develop external proofs. It is assigned to clarify the claim, not as a complete evidential defense.
- Alexander’s chapter V argues reasonableness under theism, not proof that a particular miracle occurred. His use of Paul and early Christian belief is examined as historical argument; reported witnesses are not counted as independently surviving documents.
- Newton distinguishes weak faith from full assurance. A reader’s current emotional confidence is not used as the admission requirement for the pastoral path.
- Piper’s group arrangements remain applications of mutual care. His Ruth sermon is not used to diagnose why a particular person suffers or promise an earthly resolution.
- Whitefield’s household language and Ryle’s historical parenting advice remain contextualized. The assigned selections do not license parental control over another person’s conversion.
- Spurgeon’s historical discussion of discouragement is pastoral testimony, not contemporary clinical instruction.

The sermon assignments remain concentrated: **Spurgeon 11, Piper 2, Newton 1, Whitefield 1**. This reflects the currently checked holdings. Broader author representation is a continuation item; no unreviewed source was added simply to balance the count. The apologetics path addresses three foundational questions, not the whole L09 question inventory or a completed Christianity-and-Islam course.

## Source access

The four supplied policies were rechecked on 2026-10-05 and recorded in [source-access.json](source-access.json). PRDL is a discovery database linking to external holdings, not their host. [PRDL purpose](https://www.prdl.org/about.php).

Monergism permits source discussion and linking while restricting redistribution of its curated files. The Ryle selection directs readers to its source. [Monergism permissions](https://www.monergism.com/monergism-copyright-permissions).

Desiring God distinguishes excerpts, permitted embeds, and full-text/media republication, with additional book-license exceptions. These paths use official links and original annotations; no whole text or media was copied. [Desiring God permissions](https://www.desiringgod.org/permissions).

MLJ Trust prohibits systematic retrieval to construct collections or databases. No MLJ material was systematically retrieved, transcribed or included in these paths. [MLJ Trust terms](https://www.mljtrust.org/terms-use/).

Existing asset permissions were not broadened. No public download package, full-text search ingestion, media embed, website publication change or deployment was performed.

## Files and validation

`paths.json` stores the sequences and purposes; `resources.json` stores source and review boundaries; the five readable guides and overview are generated from those records. The builder makes no network requests and creates no duplicate work, edition or asset records. One L14 run record records the mission boundary.

```powershell
D:/Python/python.exe -X utf8 scripts/build-study-paths.py
D:/Python/python.exe -X utf8 scripts/test_study_paths.py
node scripts/validate-library.mjs
```

Tests check the five requested audiences, ordered stages, source resolution and eligibility, Scripture endpoints and reader links, immutable input/source hashes, source access boundaries, local guide links, and unchanged publication selection. These are integrity checks, not independent theological certification. See [checkpoint.json](checkpoint.json) for human review, wider topics and future public integration.
