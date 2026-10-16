# P4 · Design reusable evidence presentation

**Outcome:** five clear editorial templates that turn the same reviewed evidence into different useful formats while keeping quotations, interpretation, objections and uncertainty visible.

Build a standalone, responsive `gallery/` in this folder, using existing project fonts/theme conventions and labelled synthetic fixtures. Read EVIDENCE-CONTRACT.md, PILOT.md, PLAN.md and the existing evidence schema. Describe adapters to that schema; do not edit it or make a competing authoritative citation contract.

## Five templates

1. **Prepared answer:** question, direct response placeholder, supporting evidence, qualifications, objections, further on-site reading, provenance footer.
2. **Passage companion block:** Bible reference, author's treatment, exact available locator, distinction between explicit exposition and a candidate connection.
3. **Attributed comparison:** parallel positions with named authors, edition dates, objections/replies, unresolved interpretation; no forced consensus or false equivalence.
4. **Historical/archaeological dossier:** sourced observation, date/range, competing interpretations, evidence limitations, relation to a biblical question. Separate observation from theological inference.
5. **Lesson/editorial packet:** learning objective or editorial question, reusable evidence references, discussion sequence, applications as draft fields, provenance and revision history.

## Design and data requirements

Use one reusable source/citation block with separate author/translator roles and source URL footer. An unavailable on-site text has a clear availability label rather than an external reading button. Preserve source gaps and missing dates without filling them. Show candidate, reviewed, conflicting and stale examples; a review label states what was reviewed. A private specimen cannot imply public eligibility.

Deliver `template-contracts.json` documenting required/optional fields and mappings to the existing evidence contract, the visual gallery, a concise `CONTENT-RULES.md`, and desktop/phone/print specimens. Specify truncation and long-content behavior, provenance placement, related-reading rules and the response to changed evidence. No invented theological answers or copied private passages in fixtures.

## Acceptance and ownership

All five templates must render with missing optional fields and long attribution, support keyboard access and both themes, remain usable on a narrow screen, and produce readable print output. Demonstrate that multiple products reference the same fixture evidence ID without duplicating conflicting claim text. Record integration recommendations rather than adding production components.

P1 owns page navigation and surrounding layouts; P4 owns content blocks and editorial structure. Neither depends on the other's work. Finish with RESULT.md and handoff.json under the shared contract.
