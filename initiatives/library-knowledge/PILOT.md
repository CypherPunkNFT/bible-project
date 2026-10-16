# First useful release

[Home](README.md) · [To-do](TODO.md)

## Proposed scope

One complete Bible book, 25 topic collections and 100 reader questions, with connections into existing reader, Teachers, topic and Study pages. These are planning targets, not existing generated content. **Ephesians is selected by LK-201** after a bounded comparison with Romans and Hebrews: [selection evidence and remaining gates](BOOK-SELECTION.md). Its six chapters have four held exposition/sermon works across three authors, with two existing on-site reading copies. New output-specific publication decisions remain pending; Romans is a strong subsequent candidate.

The book should have useful chapter/section coverage, not filler for every verse. Record verse-level gaps. Proposed topics include assurance, justification, covenant, baptism, the Lord's Supper, prayer, repentance, faith, sanctification, perseverance, suffering, forgiveness, resurrection, the Trinity, Christ's person, the Holy Spirit, Scripture, interpretation, the church, worship, mission, providence, conscience, wisdom and Christian hope. Reuse canonical topic IDs and refine scope before generation.

## Work sequence

1. Resolve a small representative input set and build several evidence collections with real locators.
2. Establish question evaluation before tuning: 80 development questions and 20 held-out questions, plus difficult attribution and disagreement cases.
3. Mine and review selected candidates, measuring how many distinct works add value.
4. Create prepared answers, passage connections and topic introductions using those collections.
5. Add compact discovery descriptions and existing-page integrations.
6. Verify public export, reader links, mobile behavior and operation with local knowledge services unavailable to the browser.

## Proposed release gates

| Area | Gate |
| --- | --- |
| Traceability | Every published quotation and attributed claim has a resolvable source and real locator |
| Publication | Every exported text use has an explicit allowed scope; zero known private-body leaks |
| Accuracy | Every pilot answer receives editorial review; no known critical attribution, quotation or reference error remains |
| Retrieval | At least 18/20 held-out questions have a reviewer-judged useful result in the top five; report keyword-only comparison and all misses |
| Breadth | Report distinct works/authors/genres and duplication; do not impose irrelevant diversity or pad thin topics |
| UI | All pilot reading destinations resolve; keyboard use, narrow screens and both themes work |
| Browser cost | Record added download, startup, peak memory and search latency on named devices; agree numeric budgets before public pack expansion |
| Independence | No public feature requests localhost/private-PC services; last published release remains usable when the PC is off |
| Refresh | Unchanged rebuild is stable; a changed source invalidates its dependent collection and public outputs |

The retrieval threshold is a proposed engineering gate, not a statistical guarantee of corpus-wide quality. Expand evaluation across genres and languages before extending those claims. Keep poor-quality or under-sourced subjects explicitly incomplete.

Pilot success should yield at least three uses of shared evidence: a passage companion, a topic/answer destination and an author/sermon reading link. Do not manufacture many separate thin pages to meet numerical targets.
