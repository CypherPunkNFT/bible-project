# Table-first knowledge study interface

**Owner direction, 6 October 2026:** study relationships, categories and topics in tables before graph form. The graph is a secondary exploratory view. **Status:** inventory and interface specification written; interactive study tables are not implemented yet.

The [generated study map](STUDY-MAP.md) is the complete current register: actual relationship counts, reference-record types, eight collections, all 110 topic definitions and additional catalogue facets. [GRAPH-PLAN.md](GRAPH-PLAN.md) governs evidence and extraction. This document governs how that information is read and compared.

## The study desk

Start with a visible overview explaining each table's purpose and coverage. Default to a topic directory; a reader can also start from a passage, person, author or work. Opening a topic leads to its evidence table, with its definition and boundaries above the rows. Do not hide the map behind nested tabs or replace it with an unexplained network.

| Table | One row represents | Primary columns | Useful next action |
| --- | --- | --- | --- |
| Topics | One defined subject/sense | Family, topic, definition, aliases, catalogue works, located passages, unresolved candidates | Open the topic's evidence |
| Scripture connections | One located citation or imported cross-reference | From passage/source, relationship, target reference, source excerpt/record, numbering, evidence status | Read passages side by side |
| Authors and works | One identified work/edition | Author, title, date/era, genre, collection, subjects, acquired/indexed state, source | Open its edition and evidence |
| People and places | One explicit recorded relationship | Person/place, relationship written in words, related entity, supporting reference, attribution | Read the source passage |
| Topic evidence | One source occurrence/assertion | Author, work/edition, locator, topic, matching words/context, relation, basis/review state | Expand context and compare selected rows |
| Shared references | One compared section/work pair | Both works, common references, independent-work count, method, weight, evidence | Inspect the references creating the association |
| Interpretation comparison (later) | One attributed position on one question | Question, author/work, claim, Scripture used, reasoning, qualifications, quoted opponent, review | Compare evidence without flattening disagreement |

Unknown/unimplemented values display **Not analyzed** or **Unknown**, never a misleading zero. Separate catalogue assignments, extracted evidence, approved interpretation and statistical associations. “Indexed” and “acquired” are separate states. Counts show their unit, input snapshot and filtering scope.

## Readable relationship language

Raw relation codes are for the data model. Display subject-first sentences in the table. For example, stored `Aaron / parent / Amram` reads **Aaron — has parent — Amram**, not “Aaron is parent of Amram.” A source cross-reference reads **Passage A — source links to — Passage B**; the row names OpenBible and retains its destination range and votes. Votes describe the imported reference rating, not theological authority.

Collections, topics and relationships are distinct:

| Dimension | Answers | Example |
| --- | --- | --- |
| Collection | Which part of the library holds this? | Theology & doctrine |
| Topic/sense | What subject is classified or discussed? | Salvation > Justification |
| Relationship | How are two identified records connected? | This section cites Romans 4 |
| Evidence | Why do we say they are connected? | Exact source words, locator and attribution |
| Facet | Which study context narrows the material? | Commentary, historical period, audience, language |

Identical local IDs in separate vocabularies remain namespaced: `collection:scripture` and `topic:scripture` are not the same entity. Many-to-many assignment is expected; a sermon can address several topics across collections. Keep parent-topic rollups distinct from direct assignments and deduplicate works when showing totals.

## Interaction and comparison

- Stable sortable columns, labelled search, visible category/facet buttons, an active-filter summary and a clear reset. Keep the table anchored while filtering; preserve selected rows and reading position.
- Sticky full-width column headings within a rounded container. The scrollbar sits immediately outside the right edge, matching the owner's established preference. A persistent caption identifies row units and snapshot.
- Expand a row inline to show source context, acquisition link, exact locator, evidence method and uncertainty. Book bodies stay in their established reading surface; the table is the index into them.
- Compare two to four selected records side by side, preserving author, edition, Scripture reference and qualifications. Do not summarize away quoted disagreement. Offer a normal tabular comparison before an optional graph.
- Pagination or accessible incremental loading, not unbounded rendering of hundreds of thousands of rows. Stable secondary sort keys and shareable URL filters. Show matched/total counts and whether analysis is incomplete.
- Keyboard-accessible rows and controls, real table headers and captions. On phones, keep essential columns readable and expose additional fields in row details; a dedicated horizontally scrollable comparison can retain its headings.
- Download the currently filtered public-safe metadata table and retain source IDs and snapshot. Local-only evidence exports remain local; public website permissions do not follow automatically from a local study view.

## When to use the graph

“Explore these connections” opens a graph of the selected topic/rows with the same filters and evidence rules. Clicking an edge opens its source row. A table remains available alongside the graph, and returning to it preserves the filter and selection. Expansion limits and incomplete neighborhoods are visible. Graph position, node size and connectivity do not convey doctrinal authority.

## Delivery order

1. **Done:** generate the current inventory in STUDY-MAP.md from actual data, and document this table-first contract.
2. **Next:** implement the read-only topic/category/relationship tables using existing records, with clearly labelled catalogue and imported-source evidence. This can precede full enrichment.
3. Add located citation/topic rows as each extraction release passes the graph plan's quality gates.
4. Add shared-reference and reviewed interpretation comparisons only when their evidence exists.
5. Add the optional graph explorer after table lookup, sorting, evidence expansion and comparison are useful and verified.

Acceptance requires correct relationship direction, counts reconciled to the active filters/snapshot, distinction between not analyzed and zero matches, source context that resolves, no row duplication from joining evidence tables, and usable keyboard/mobile navigation. The test set must include reciprocal family rows, overlapping Scripture ranges, multiple editions and a topic with no direct catalogue assignments.
