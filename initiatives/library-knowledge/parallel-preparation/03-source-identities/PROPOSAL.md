# P3 · Make the four pilot source identities explicit

**Outcome:** a reviewable private crosswalk for the four Ephesians sources already selected, with edition and reader gaps made concrete. No whole-library audit.

Read IDENTITY-CROSSWALK.md, BOOK-SELECTION.md, EPHESIANS-CONNECTIONS.md, EVIDENCE-CONTRACT.md, and `Website/knowledge/evidence_collections/README.md`. Use the existing `KnowledgeBase/library-knowledge/ephesians-connections-20261012/spec.json` and `release-final/manifest.json` as read-only source selection. Inspect existing crosswalk tooling; reuse it through a track-local adapter if appropriate without changing shared implementation.

## Fixed source scope

- James Fergusson, TCP A41197, Galatians/Ephesians exposition.
- John Calvin, TCP A17705, Ephesians sermons, Arthur Golding translation.
- John Calvin, held CCEL Galatians/Ephesians commentary, William Pringle translation.
- Charles Hodge, held CCEL Ephesians commentary.

For each, resolve existing document/resource/work/edition/asset/contributor identifiers where supported. Bind the selected original bytes and exact source-header assertions. Distinguish author, translator, editor and publisher; composition, publication and electronic edition dates; actual work boundaries versus multi-work containers. Calvin's two works remain separate works by one author. Matching titles or author names never authorize merging.

Inspect the existing canonical registry records and only these sources' reader records/bundles. Record reader state as verified readable, catalogue-only, unresolved or unavailable, with the real route and its supported locator behavior. Reuse existing whole-work routes; no guessed passage anchors. Existing private-use permissions and public dispositions are recorded as existing assertions, not newly granted licences.

## Deliverables and acceptance

Write `identity-crosswalk.json`, a source-header evidence sidecar, `registration-proposals.json` and one validation summary to the private track folder. Registration proposals describe exact missing fields/relationships and their evidence; they are not applied. Missing canonical IDs stay null. Human/AI review type is explicit.

All four sources must have a resolution outcome for original bytes, work/edition/asset chain, contributor roles, date roles and reader availability. Report resolved versus unresolved counts for each dimension. Validate hashes, selected registry bindings, route availability where feasible and input fingerprints. Recheck only selected inputs; a changed live corpus build marks corpus-dependent results for later reconciliation.

**Boundary:** no catalogue registration, source edits, new IDs, evidence recapture, public-use expansion or bibliography-wide research. P5 may locate text independently using existing document IDs; it need not wait for this crosswalk. Finish with RESULT.md and handoff.json under the shared contract.
