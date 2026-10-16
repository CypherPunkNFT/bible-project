# Public-use eligibility — LK-105

**Completed 11 October 2026, evening EDT.** Recorded source-bound decisions for the three selected CCEL editions and the separate TCP Flavel candidate. Built and verified a reusable private decision tool and a metadata-only review projection. Private research, intake and embedding remain enabled independently of public-use decisions.

## Decisions

| Use | Manton CCEL | Flavel CCEL | Boyce CCEL | Flavel TCP A39682 |
| --- | --- | --- | --- | --- |
| Private analysis and embedding | Allowed | Allowed | Allowed | Allowed |
| Basic bibliographic facts and credits | Allowed | Allowed | Allowed | Allowed |
| Public quotation from the exact electronic edition | Conditional | Conditional | Conditional | Allowed within CC0 scope |
| Republishing the exact electronic text | Conditional | Conditional | Conditional | Allowed within CC0 scope |
| Publishing a translation of that electronic text | Conditional | Conditional | Conditional | Allowed within CC0 scope |
| Independently written analysis of ideas | Allowed within stated scope | Allowed within stated scope | Allowed within stated scope | Allowed within stated scope |

These are dated, AI-assisted operational decisions with explicit evidence and scope, not a legal opinion or approval of a particular editorial output. **4 sources, 20 public-use decisions: 11 allowed, 9 conditional, 0 unknown, 0 denied.** “Conditional” does not mean cleared: no consumer may treat an unmet condition as permission. There are **4 private-analysis approvals, 4 metadata-only preview records, 0 selected quotations ready for new export, and 0 public outputs written**.

### Why the exact editions matter

CCEL distinguishes historic books from modern introductions and other additions, permits personal/educational/nonprofit use, and asks users to obtain permission for republication or commercial use. Its policy does not establish blanket permission to republish every electronic component. [CCEL copyright policy](https://www.ccel.org/about/copyright.html).

The held Boyce and Flavel XML headers say “Public Domain.” Those statements and the historic print dates are retained as evidence. Flavel also records modern editorial comparison and corrections; both files include modern descriptive material. The operational decision therefore keeps republication of each **exact electronic edition** conditional. Resolution requires permission applicable to the proposed use, or a documented component-specific basis for the historic text that respects source terms and excludes uncleared additions. This is not a finding that the historic authors' writings are copyrighted, nor a blanket rejection of lawful quotation. No new fair-use determination or permission request was made.

The exact held TCP `A39682` XML carries a CC0 availability statement. That statement is verified against the original file and an XML-selector fingerprint; the [TCP release description](https://www.textpartnership.net/pages/eebo-tcp.html) and [CC0 legal code](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en) support the recorded scope. The allowance covers this transcription, not ProQuest page images or unrelated later additions. Credits remain, and no endorsement is implied. Its permissions do not transfer to the CCEL edition merely because the crosswalk relates their underlying work.

Metadata approval covers source-backed titles, authors, IDs, URLs and contributor credits, excluding publisher blurbs and artwork. Editorial approval covers independently written analysis of ideas, excluding copied wording, close paraphrase of protected expression and translations. These scopes follow the U.S. distinction between ideas/names/titles and protected expression. [U.S. Copyright Office, Circular 33](https://www.copyright.gov/circs/circ33.pdf).

## Implementation and verification

- [eligibility.py](../../knowledge/evidence_collections/eligibility.py): build, verify and metadata-only preview commands, documented in the [tool README](../../knowledge/evidence_collections/README.md).
- Private artifacts: `KnowledgeBase/library-knowledge/eligibility-pilot-20261011/eligibility.spec.json`, `eligibility.json`, `metadata-preview.json`, `verification.json`, `acceptance.json` and `pipeline-after.json`.
- Decisions bind to exact source SHA-256, immutable crosswalk and specification hashes, source-header assertions and the implementation. Changed dependencies invalidate them. Remote policy evidence is a dated review record; local reverification does not poll or certify future remote terms.
- [Regression tests](../../knowledge/tests/test_evidence_eligibility.py) verify separate permissions, unmet conditions, source/decision changes, missing reviews, retained private access, publication refusal, metadata gates and exclusion of private material. **66 tests passed** with the existing evidence/crosswalk/research tests.
- The metadata projection permits only selected factual fields and decision labels. It never emits source bodies, selected quotations, neighboring passages, claims, policy free text or local paths. It is saved privately for review; the existing public evidence-collection exporter still emits nothing.
- The real CLI rejects public output paths. Actual pilot previews were checked for captured quotes, body text, private paths and unexpected fields. Original evidence files were unchanged.

The web tool could not fetch the upstream raw TCP XML (cache miss), and Michigan's EEBO landing page returned 403. Neither was retried or bypassed. The existing hash-verified XML supplies the item-specific license; lookup failures are recorded in the private specification. Other policy references above were accessible.

## What remains

Permissions, canonical identity, readable text, output review and publication selection remain separate gates. Carry forward **2 missing selected canonical chains**, **3 unavailable exact-edition reading copies**, and the **TCP candidate's missing canonical asset record**. The existing TCP reading copy is left intact; its missing registration blocks new products through this pipeline, not its current reader. Boyce's reported opposing position remains attributed to Boyce and is not promoted to verified Catholic primary teaching.

No publication was selected, private text published, catalogue record changed, or running worker restarted. **LK-106 is next:** bounded FTS5/vector/reference retrieval with duplicate handling, context expansion and a held-out comparison against keyword-only retrieval. It may use all four lawfully held sources privately despite these public-use conditions.
