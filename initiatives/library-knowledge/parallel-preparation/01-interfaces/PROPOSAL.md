# P1 · Design the connected study experience

**Outcome:** a reader can move from Scripture or a topic to an identified held work, see why it is relevant, and understand whether its text is available on-site.

Build three interactive, responsive prototypes in this folder's `prototype/`: (1) passage companion alongside an Ephesians reading context, (2) topic/question destination with evidence and disagreement sections, (3) acquired author/scholar shelf with work/edition selection. Use one index/gallery to reach all three. These are design proposals, not new production routes.

Read `Website/AGENTS.md`, the existing Teachers and reader components/styles, `Pages/Study/PLAN.md`, and the initiative's EVIDENCE-CONTRACT.md, BOOK-SELECTION.md and EPHESIANS-CONNECTIONS.md. Inspect current route/data contracts before proposing an interaction. Preserve the acquired-shelf placement and existing Teachers sizing standard; no duplicate contributor announcement banner. Reuse visual conventions without changing their source files.

## Required design decisions

- Establish page hierarchy, navigation, layout, keyboard/focus behavior, progressive disclosure and phone behavior. Identify what a reader sees first and what remains behind a details action.
- Demonstrate five states: on-site readable, catalogue-only, candidate awaiting review, source conflict, and empty/unsupported. Loading and stale-data behavior must also be specified.
- Separate source relevance from claim approval. A sample's rank is not an endorsement. Keep Bible text, author exposition and editorial interpretation visibly distinguishable.
- Reading actions use actual supported local route shapes. Catalogue-only states must not send readers to an external text. Do not fabricate passage anchors or page parameters. Original-source links belong in a provenance footer.
- Use synthetic excerpts labelled as design fixtures, or metadata-only examples. No theological answers or private source bodies are needed. All mockups must work with networking disabled.

## Deliverables and acceptance

Produce the gallery HTML/CSS/JS, a short `INTERACTIONS.md` mapping actions to states and existing/proposed route contracts, and desktop/phone screenshots. Verify three prototypes, all five availability states, keyboard operation, both themes and no horizontal page overflow. Record unresolved interactions rather than inventing backend support. Use shared static fixture shapes defined locally; consuming P2/P3/P4/P5 outputs is not required.

**Boundary:** own only this track's directories. P4 owns reusable editorial block templates; P1 owns page composition and navigation. Do not implement production components, rebuild dist, register routes or publish. Finish with RESULT.md and handoff.json under the shared contract.
