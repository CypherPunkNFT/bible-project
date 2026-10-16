# Source and method notes

## Scripture provenance

These trials use the project's local **Berean Standard Bible (BSB)** files under `data/text/bsb/`. The exact normalized Scripture and hashes supplied to each evidence trial are preserved in its `sources.json`. The BSB publisher's licensing reference recorded during the earlier research is [Berean Bible licensing](https://berean.bible/licensing.htm). The broader website's source/acquisition ledger remains [Website/SOURCES.md](../../SOURCES.md).

The current generation pipeline does not retrieve online commentaries. Its source is supplied Scripture, plus limited same-book context. Do not describe method-reference URLs saved in a draft as proof that those sources independently verified that draft.

## Interpretation-method references used in the earlier design

These references were consulted in the earlier structure-design work. They are recorded here for provenance; this documentation pass did not perform a fresh web review. The format is our synthesis, not a claim of denominational consensus or an official format endorsed by any listed organization.

| Reference | Principle used in design |
| --- | --- |
| [Precept Bible Study Method](https://www.precept.org/study/precept-bible-study-method/) | Distinguish observation, interpretation, and application; attend to context, repeated words, and basic who/what/when/where questions |
| [BiblicalTraining: Four Key Principles of Exegesis](https://www.biblicaltraining.org/learn/foundations/nt110-biblical-exegesis/nt110-03-four-key-principles-of-exegesis) | Read with attention to original meaning, literary form, context, and the text itself |
| [Crossway: What Every Book of the Old Testament Is About](https://www.crossway.org/articles/what-every-book-of-the-old-testament-is-about/) | Preserve literary form and the book's actual presentation rather than reducing it to abstract themes |
| [Catechism discussion of interpreting Scripture](https://www.vatican.va/archive/ENG0015/__PQ.HTM) | Attend to forms of writing, context, and the literal sense; recognize the source's Catholic interpretive framework |
| [Etzion: Peshat and Derash](https://etzion.org.il/en/tanakh/studies-tanakh/core-studies-tanakh/peshat-and-derash-1) | Distinguish contextual reading from other interpretive uses; recognize the source's Jewish interpretive framework |

The five references above appear in the studio's `METHOD_SOURCES` metadata. Additional genre examples considered earlier were [BibleProject's Proverbs guide](https://bibleproject.com/guides/book-of-proverbs/) and [Job guide](https://bibleproject.com/guides/book-of-job/): wisdom sayings should not be flattened into unconditional guarantees, and a character's speech should not automatically be treated as the book's endorsed teaching.

## Practical summary standard

- Describe what the chapter says and how its movement develops before adding interpretation.
- Preserve the actual speaker, audience, subject, object, temporal language, conditions, negation, and scope of pronouns.
- Keep every outline claim inside its cited section and support every clause of a context note with its references.
- Use different reading expectations for narrative, law, poetry, genealogy, wisdom, letters, and visions.
- Do not import familiar facts, cross-book conclusions, historical claims, or literary labels merely because the model remembers them.
- Use an observation invitation that points the reader back to the text. Personal application is outside this summary format.
- Do not suppress difficult material or resolve disputed interpretation by assertion.

For example, Genesis 5's “after” should not become an exact age; Psalm 117's “us” should not silently become all humanity; and 1 Corinthians 13:13 should not gain a temporal qualifier absent from the supplied verse. These are controls on faithful representation of the chosen text, not claims to settle broader theological interpretation.

## Review provenance

The round critiques are Codex's source-based editorial inspection. They include concrete textual defects as well as requests for greater precision or clearer style. They are not independent human scholarly approval. The model's own review is also preserved so its missed errors and false positives remain inspectable. The five edited studio examples and the untouched evidence-trial drafts are separate artifacts with separate histories.
