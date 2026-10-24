#!/usr/bin/env python3
"""The provenance and licence facts for the batch-3 question books.

Counts, sizes, hashes and the per-book tables are measured by
build_manifest_batch3.py. Everything that needs a judgement is written here.
"""

RETRIEVED = "2026-10-17"
JOB = "Fortress Orchestrator job b88ef04acb4d4b38bd7df5d12b9f82b4"

BATCH_3: dict[str, dict] = {
    "internet-archive-sunday-school-question-books": {
        "title": "Sunday school and Bible question books, 1819-1927 (Internet Archive)",
        "source_url": "https://archive.org — 67 separate scanned items, each listed below",
        "source_kind": (
            "page scans of printed books, with the Internet Archive's machine-read text "
            "layer beside them"
        ),
        "revision": (
            "not applicable — each item is a fixed scan of a fixed printing. The SHA-256 "
            "of every file retrieved is recorded below, and each item's own metadata "
            "record was saved with it"
        ),
        "download_method": (
            "the Internet Archive's advanced-search API to find candidates, its metadata "
            "API to check each one, and its item-download service to fetch the "
            "machine-read text, the page-image PDF and the metadata record for each of "
            "the 67. No scraping, no HTML parsing, nothing behind a login — none of the "
            "67 is access-restricted or in the lending collection"
        ),
        "licence_as_stated": (
            "Public domain in the United States. 32 items are marked NOT_IN_COPYRIGHT; "
            "17 carry the Library of Congress's statement that it is unaware of any "
            "copyright restriction; 1 carries a Creative Commons public-domain mark; the "
            "remaining 17 state nothing, which for a pre-1929 American imprint is the "
            "ordinary case"
        ),
        "attribution_required": False,
        "questions_written_by": "human-written",
        "git": "no — 773 MB of page scans; the PDFs stay on disk, the JSON is committed",
        "copyright_check": (
            "Two independent checks, not one. First, the search itself was bounded to "
            "items dated 1700-1928, and every item's publication date was then read back "
            "out of its own metadata record: they run from 1819 to 1927, the newest being "
            "*Know Your Bible?* (W. A. Wilde Company, Boston, 1927). Anything published "
            "before 1929 is in the public domain in the United States with no further "
            "condition, which is the whole test. One item of the 67, *Intermediate Bible "
            "Narratives* from the Lutheran Book Concern, carries no exact year: its "
            "catalogue date is `[190-?]`, the librarian's notation for a book known to be "
            "from the 1900s without a printed date. Any year in that decade passes the "
            "test, so it is kept, but it is the one item whose date is an inference rather "
            "than a record. Second, each item's copyright field was recorded as the Internet "
            "Archive states it, and every item was checked for access restriction — none "
            "is restricted, which is itself a signal, because the Archive locks down the "
            "scans it believes are still in copyright. One item needed a closer look: "
            "*Bible Quiz Book* is catalogued as January 1920 but attributed to Baker Book "
            "House, a publisher not founded until 1939, so the date on the catalogue "
            "record cannot be right for that imprint. It is kept, the discrepancy is "
            "recorded here rather than buried, and it is the one item in the batch whose "
            "date would need confirming from the title page before anything from it ships."
        ),
        "licence_nuance": (
            "There is no licence here to interpret: these works are out of copyright and "
            "the Internet Archive adds no terms of its own to a public-domain scan. The "
            "only courtesy owed is a credit to the library that paid for the scanning, "
            "which the per-book table records. The real constraint is the text, not the "
            "terms — see the quality note."
        ),
        "format": (
            "Per book: the machine-read text (`<id>_djvu.txt`), the page-image PDF, and "
            "the Internet Archive's own metadata record saved as JSON so the provenance "
            "travels with the files. The extraction reads only the text; the PDF is kept "
            "so any question can be checked against the page it was printed on."
        ),
        "quality_note": (
            "This is machine-read text off nineteenth-century paper, and that is the "
            "thing to understand before using any of it. Three shapes of question book "
            "appear — question-and-answer pairs, numbered questions, and bare "
            "interrogatives — and each book was tried against all three with the best "
            "result kept; the per-book table records which shape won and what share of "
            "candidates survived the quality gate. That gate is deliberately strict: a "
            "candidate must open with an interrogative or imperative, end in a question "
            "mark, run 20 to 400 characters, carry no character that does not belong in "
            "English prose, and contain at most two stray single letters. Across the "
            "batch it threw out about a third of what the patterns matched. "
            "The commonest fault the scanner makes is reading a question mark as a 1, 7, "
            "l, I, P or ^, which welds two questions into one unusable record; those are "
            "put back where the surrounding shape is unmistakable, and the count of "
            "recoveries is recorded per book. What survives reads cleanly in sampling, "
            "but individual words are still misread here and there — *heing* for *being*, "
            "*togetiier* for *together*. **Nothing from this source should go in front of "
            "a reader until it has been checked against the page image.** That is what "
            "the PDFs are for, and why the page number is carried on 75% of the records."
        ),
    },
    "gutenberg-sunday-school-question-books": {
        "title": "Sunday school and catechism question books, 1692-1914 (Project Gutenberg)",
        "source_url": "https://www.gutenberg.org — 8 ebooks, each listed below",
        "source_kind": "human transcriptions of printed books, not scans",
        "revision": (
            "Project Gutenberg does not version its texts; the plain-text file and the "
            "RDF metadata record for each ebook were taken together on the retrieval "
            "date, and the SHA-256 of both is recorded below"
        ),
        "download_method": (
            "the full Gutenberg catalogue (`pg_catalog.csv.gz`) was downloaded and "
            "searched offline, then each kept ebook was fetched from "
            "`gutenberg.org/cache/epub/<n>/pg<n>.txt` with its RDF metadata record"
        ),
        "licence_as_stated": (
            "Public domain in the United States — Project Gutenberg hosts nothing else. "
            "All eight works were published between 1692 and 1914."
        ),
        "attribution_required": False,
        "questions_written_by": "human-written",
        "git": "yes — 3.1 MB of text and metadata, small enough to commit",
        "copyright_check": (
            "Project Gutenberg's whole premise is that it distributes only works in the "
            "US public domain, and each ebook's RDF record was saved alongside its text. "
            "Publication dates run 1692 to 1914, all comfortably before 1929. One "
            "candidate failed this test and was dropped: ebook 1670, *Luther's Little "
            "Instruction Book*, is a 1994 translation of a 1529 catechism — the "
            "underlying work is ancient but that English rendering of it is modern, and "
            "it is not what the brief asked for."
        ),
        "licence_nuance": (
            "Project Gutenberg asks that its trademark not be used once its boilerplate "
            "is stripped, which is exactly what the extraction does — the text is cut at "
            "the START and END markers before anything is parsed, so no Gutenberg licence "
            "text reaches the extraction. So credit the book, not Project Gutenberg. This "
            "is the same conclusion job 412 reached for the Baltimore Catechism, and it "
            "is applied here for consistency. Readers outside the United States should "
            "check their own country's term of copyright, as the Gutenberg header warns."
        ),
        "format": (
            "Per book: the plain-text transcription (`pg<n>.txt`) and the Gutenberg RDF "
            "metadata record (`pg<n>-metadata.rdf`), matching the naming job 412 used for "
            "the Baltimore Catechism. Each book has its own small parser, because a "
            "transcription has a reliable printed shape that a scan does not."
        ),
        "quality_note": (
            "Far cleaner than the scans, and the reason this source is worth having "
            "despite being a fifteenth the size: these are human transcriptions, so the "
            "text needs no proofreading pass, and 4,994 of the 6,125 questions arrive "
            "with the answer the book printed. Two books stand out. **Hurlbut's Bible "
            "Lessons for Boys and Girls** (1903) is the closest thing in the whole corpus "
            "to what the brief described — story-comprehension questions on the Bible "
            "narrative, grouped by lesson, each with its answer. **Bible Readings for the "
            "Home Circle** (1914) answers every one of its 2,520 questions with a quoted "
            "scripture and its reference, which is where 1,901 of this batch's references "
            "come from; its doctrinal slant is Seventh-day Adventist and shows in which "
            "topics it chooses to cover. "
            "Two transcription quirks were dealt with and are worth knowing about. "
            "Hurlbut's printed book marks every proper name for pronunciation and the "
            "transcription carries those marks as bracketed codes wrapped around the "
            "letters themselves, so deleting the brackets deletes the vowels with them; "
            "the letter inside each code is kept and the stress marks and syllable "
            "hyphens dropped, which turns `J[=e]'sus` back into `Jesus`. About 75 records "
            "of 6,125 still carry a stray transcription marker. Three of the eight books "
            "print their review questions without answers beside them, the answers being "
            "in the exposition above; those 1,127 records have a question and no answer, "
            "which is how the book published them."
        ),
    },
}
