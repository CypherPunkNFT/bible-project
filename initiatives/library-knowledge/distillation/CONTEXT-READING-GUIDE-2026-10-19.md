# Attribution and context reading guide — 19 October 2026

Use these source findings before a later revision of **justification, editor-voice or caritas**. They clarify what the held texts actually are and where the reader can inspect them. The live proposals, owner decisions and reader index remain unchanged.

| Case | Concrete finding | Open the source |
| --- | --- | --- |
| justification | Boyce’s selected text is the complete Justification subsection in **A Brief Catechism of Bible Doctrine**, contained in the EPUB catalogued as Abstract of Systematic Theology. Gill’s complete faith subsection is later than the saved fragment. | [Boyce page 25](http://127.0.0.1:8931/teachers/works/held-7824047daefbe859f7f5f167719ca85f?page=25) · [Gill page 58](http://127.0.0.1:8931/teachers/works/held-c6d2a4fae26109773599ac53919f9b51?page=58) |
| editor-voice | The complete conjectural note is located. The title/preface role chain supports an edition-level **John King** translator/editor attribution; the note itself signs Ed. | [Credit and preface, page 1](http://127.0.0.1:8931/teachers/works/held-c3e709ba58b60fead7cdb12ee5235226?page=1) · [Complete note, page 5](http://127.0.0.1:8931/teachers/works/held-c3e709ba58b60fead7cdb12ee5235226?page=5) |
| caritas | The selected span is a parallel Scripture table. Adjacent translated commentary is a separate unit with editorial notes. The exact Corinthians witness credits **Rev. John Pringle**. | [Table and commentary, page 21](http://127.0.0.1:8931/teachers/works/held-176ef9aa57b3973664dcf65d4ca12c1b?page=21) · [Commentary continuation, page 22](http://127.0.0.1:8931/teachers/works/held-176ef9aa57b3973664dcf65d4ca12c1b?page=22) |

Page numbers are local reading pages, not printed pages. The reader header may name the containing book; inspect the internal work/section heading as well.

## Boyce and Gill: compare complete, correctly labelled units

Boyce’s native member begins with A Brief Catechism of Bible Doctrine and a James P. Boyce byline. Its Justification subsection contains the eight questions in the existing candidate, ending before Good Works. The selection itself is complete; the missing distinction is the contained-work identity. Do not describe it as a paragraph from the main systematic treatise or assign every appended document to Boyce merely from the container title. No global work/edition IDs have been changed.

The saved Gill window begins mid-sentence, crosses the opening of section 5 and 5a1, and stops before the complete faith discussion. The source-numbered **5a5**, including a–f, supplies a self-contained inspection unit on faith’s role. It reports a view attributed to some, rejects it, and gives Gill’s reasons. Keep the opening negation and the distinction between faith as an act and its object; do not turn the reported position into Gill’s assent.

For the proposed comparison, inspect Boyce’s questions 4–7 alongside Gill’s complete 5a5 rather than infer a conclusion from the old Gill fragment. Boyce uses instrument/cause language; Gill’s inspected subsection has its own distinctions. Neither identical terminology nor full agreement/disagreement should be invented. This is a source-attributed reading comparison, with the existing Protestant scope and specific doctrinal cautions; wider theological review remains separate.

## The Genesis note: name the role and retain the conjecture

The current EPUB title names Rev. John King as translator. Its Translator’s Preface describes the Editor as the translator, explains that he appended notes, and distinguishes those notes from Calvin’s work. Those native title/preface representations equal the retained cache and reader text.

The selected conjectural note is also present, with the same wording after whitespace normalization, in the separately held CCEL Genesis volume 1 witness. That XML explicitly credits John King as translator and preserves the matching note ID. These are two representations of the same note/translation, not independent corroborating authors.

A careful attribution is **an editorial note in John King’s translation of Calvin**, with the title/preface/alternate-note basis retained. This is an edition-level inference supported by explicit role evidence; the note itself is signed only Ed. Do not assign all additions in the 2026 Monergism wrapper to King or present the note as Calvin’s own statement. The wrapper/use notices remain separate dependencies.

Use the complete note about **vocatio / vacatio**. It proposes a reading using reported edition/translation evidence; do not silently replace the source wording or turn the conjecture into a verified original reading. The return-link arrow belongs to EPUB navigation and is excluded from the proposed quotation interval without changing the underlying text.

## Caritas: preserve Scripture, translation and editorial voices

The saved 1,179-character span is the heading and parallel English/Latin Scripture table for 1 Corinthians 13:4–8. The English column prints Charity; the Latin column prints Caritas. The subsequent English commentary begins Love is patient. These are distinct source roles, not three interchangeable modern Bible translations or a demonstrated general rule for translating a word. The exact Bible-version/Latin-translation authorship of those columns has not been newly established here.

The verse 4 commentary is a separate 3,574-character unit crossing reading pages 21–22. It contains **five embedded notes: four explicitly signed Ed. and one unsigned**. Keep them separate from the translated commentary and preserve the unsigned note’s uncertainty. The native XML preserves the note containers and explicit signatures; it does not establish every note’s named author. [Signature details](context-review-2026-10-19/note-role-details.json).

Both the original DC.Creator Translator field and the internal title page name **Rev. John Pringle** for this Corinthians witness. Our original source inventory recorded that correctly. A later derivative preparation sheet incorrectly named William; the action table, preparation sheet and machine-readable preparation have been corrected, with [the previous claim and exact source proof retained](context-review-2026-10-19/credit-correction.json). The separately held Ephesians witness explicitly credits **Rev. William Pringle**. Do not merge the two translator identities. The live caritas candidate still has its prior unresolved translator wording; this correction did not write to curation.

The literal join Caritaspatiens exists in the native XML and retained cache. Preserve it as a source-text observation for later specialist/edition checking; it is not a new Latin lemma or permission for an automatic repair/discard rule.

## Exact supporting intervals

All coordinates are Unicode codepoints, half-open, within the listed source/cache locator. Existing candidate windows remain the unchanged baseline. These supporting intervals are proposed inspection annotations, not new live proposal revisions.

| Unit | Locator | Start → end |
| --- | --- | --- |
| Complete Boyce catechism Justification subsection | EPUB section 8: abstract_split_006.html | 12564 → 13632 |
| Complete Gill 5a5 with a–f | EPUB section 24: bodydivinity_split_022.html | 47006 → 50338 |
| Complete conjectural editorial note, excluding return-link separator/glyph | EPUB section 11: EPUB/chapter-02.xhtml | 23437 → 23707 |
| Caritas heading/Scripture table | calcom39.xml | 1005532 → 1006711 |
| Adjacent verse 4 commentary, including explicitly recorded embedded notes | calcom39.xml | 1006711 → 1010285 |

[Native source/reader proof](context-review-2026-10-19/native-context.json) checks all four selected native representations against their caches and reader locator text. [Six HTTP page checks and paratext links](context-review-2026-10-19/reader-and-paratext.json) pass. The inspection consumed 205 distinct inputs, approximately 24.7 MB; this is source-access work, not retrieval/query performance, full-book certification or truth validation.

[Source observations](context-review-2026-10-19/source-observations.json) and [proposed rehearsal clarifications](context-review-2026-10-19/rehearsal-clarifications.json) retain the same twelve records/twelve questions, explicitly declaring these work/role/window refinements before retrieval. No query or held-out judgment ran.

The new role/credit judgments can change while original bytes stay unchanged. A compatible dependency adapter must consume those findings before live proposal fingerprints can invalidate stale interpretations automatically. That adapter, current-generation vector/index mappings, public-use review and the semantic experiment remain open. [TODO](../TODO.md) holds the one execution order; the existing source completion owner remains protected.
