# Evidence contract implementation — LK-103

**Completed 11 October 2026, evening EDT.** Implemented a reusable private evidence-collection contract and verified real examples against selected held originals and the current corpus. No intake, embedding, graph extraction or public publication was started or changed.

## Delivered

| Output | Location |
| --- | --- |
| Implementation and command reference | [knowledge/evidence_collections/README.md](../../knowledge/evidence_collections/README.md) |
| JSON Schema | [collection.schema.json](../../knowledge/evidence_collections/collection.schema.json) |
| Validation and review integrity | [contract.py](../../knowledge/evidence_collections/contract.py) |
| Read-only source capture and dependency verification | [capture.py](../../knowledge/evidence_collections/capture.py) |
| Private command-line interface | [__main__.py](../../knowledge/evidence_collections/__main__.py) |
| Regression coverage | [test_evidence_collections.py](../../knowledge/tests/test_evidence_collections.py) |
| Real samples, specifications and result manifest | `KnowledgeBase/library-knowledge/contract-pilot-20261011/` |

The implementation extends the existing research citation schema and validation code; it does not replace their source identities or public projection. Collection v1 is deliberately private-draft-only. It preserves metadata/quotation/full-text permissions and separately records translation/editorial decisions, all unknown in these examples. This is not an `evidenceOnly` intake hold.

## Real sample results

| Collection | Selected evidence | What it demonstrates |
| --- | --- | --- |
| `assurance-contract-pilot.json` | Manton, Complete Works vol. II; Flavel, Keeping the Heart | Located author statements, unknown edition dates, source segment locators and adjacent context |
| `reported-position-contract-pilot.json` | Boyce, Abstract of Systematic Theology | An opposing position as reported by Boyce, with his following objections retained as context; not his endorsement or direct verification of Catholic primary documents |

**2 collections; 3 evidence spans; 3 source documents; 1 known canonical work/edition; 2 documents with unresolved canonical work/edition IDs; 3 unverified reader targets; 0 public exports.** Three edition dates remain unknown. Source document IDs and exact original/chunk hashes are retained even when bibliographic IDs are missing. These are selected examples, not an exhaustive search or a claim of three independently reconciled bibliographic works.

Private specifications retain explicit chunk IDs, expected hashes, Unicode character offsets, AI-assisted attribution notes, claims and review limits. Copies of neighboring corpus segments provide context. No printed page number, author authority ID or on-site reading destination was invented.

## Validation and limitations

**27 tests passed**, including the existing research citation tests. Coverage includes deterministic capture, source/context changes, attribution/quotation tampering, duplicate evidence, fabricated canonical IDs, distinct claim identities, unknown dates/identities and public/external-route rejection. Fixture database bytes remained unchanged during capture.

Both real collections passed original-byte, chunk-span, metadata and neighboring-context checks; rebuilding from the same specification produced identical records. The actual CLI captured both collections and correctly rejected an output path outside the private evidence directory. Detailed results are in `verification.json` alongside the samples.

Checksums and fingerprints detect changes; they are not signatures or proof of human review. The tool verifies locations and recorded dependencies, not the theological truth of a supplied claim. Review is explicitly AI-assisted and limited to these passages and their context. No human approval, multilingual coverage, full-corpus vector mining, public rights decision or route verification is claimed.

On a changed corpus build or selected dependency, verification marks the collection stale and requires explicit recapture/review. LK-107/LK-501 still own automated dependency refresh at scale. The code records null vector-model/graph-run fields because neither was used in this capture.

## Next

LK-104 is now complete in the [identity crosswalk](IDENTITY-CROSSWALK.md). It preserves these immutable captures, recovers source-header edition statements, verifies catalogue-only destinations and a separate readable TCP edition, and documents remaining identity/reading deferrals. LK-105 is next: establish use-specific public eligibility. Only then should later work broaden retrieval and prepare publication. The current intake, original embedding worker and graph monitor remain authoritative and independent.
