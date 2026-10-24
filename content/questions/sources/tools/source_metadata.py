"""Provenance and licence facts for the second batch of Bible question banks.

Data only, no logic: build_manifest.py reads this, adds the mechanical facts it can
measure (file sizes, SHA-256 hashes, question counts, sample questions) and writes
MANIFEST.md and manifest.json.

Every 'licence_as_stated' is what the source itself says, quoted where the wording
matters. Every 'licence_nuance' is where that statement does not settle the question.
'publishable' means: may this text go on the public website as things stand.
"""

RETRIEVED = "2026-10-17"

BATCH_2 = {
    # ------------------------------------------------------------------ catechisms
    "baptist-know-the-truth-catechism": {
        "title": "Know the Truth: 60 Questions and Answers on Christian Beliefs",
        "source_url": "https://baptiststudiesonline.com/wp-content/uploads/2007/11/catechism-bfm-2000.pdf",
        "source_kind": "pdf_download",
        "revision": 'HTTP ETag "4834c-632d43652595d", Last-Modified 2025-04-15T17:08:06Z',
        "revision_kind": "no version control; the server's own validators for the file as served",
        "revision_date": "2025-04-15T17:08:06Z",
        "download_method": "single curl GET of the published PDF; response headers kept in headers.txt",
        "licence_as_stated": (
            'Quoted from the PDF: "You may make copies and distribute freely. You may '
            'distribute the electronic document freely. You may not sell it. You may '
            "contact Pastor Derek Gentle at derek@fbctallassee.com about permissions for "
            'other uses." The 2000 Baptist Faith & Message it is based on is stated to be '
            "public domain."
        ),
        "licence_nuance": (
            "This is a real grant of reuse, which is more than the brief assumed, but it is "
            "not an open licence: free distribution and no selling, with no derivative-works "
            "grant and no commercial use. Held as research-only pending the owner's decision. "
            "The separate trap is the Scripture quotations: most are Holman Christian "
            "Standard Bible, with others from NKJV, NASB, NIV and The Message, each 'used by "
            "permission' for this document only. That permission does not travel to us. The "
            "KJV quotations are public domain. So the 60 questions and answers are the "
            "reusable part; the quoted verses must be dropped or swapped for a public-domain "
            "translation before any of it ships."
        ),
        "attribution_required": True,
        "attribution_note": (
            "Credit: Know the Truth: 60 Questions and Answers on Christian Beliefs, Edition "
            "2.1, used at First Baptist Church, Tallassee, Alabama; based on the 2000 Baptist "
            "Faith and Message. Permissions contact: Pastor Derek Gentle."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "A pastor-written catechism for children, each entry pairing a doctrinal answer "
            "with a Scripture quotation and often a 'See also' list of further verses."
        ),
        "record_unit": "one catechism question with its answer, a quoted proof verse and optional further references",
        "format": (
            "54-page PDF. Text extracted with pdftotext -layout into "
            "catechism-bfm-2000.layout.txt, which is what the extractor parses; a plain "
            "pdftotext rendering is kept alongside it. Entries read 'Question N:', 'Answer:', "
            "'Scripture:'. A form feed rather than a newline precedes the first question on "
            "each page, and words are hyphenated across line breaks."
        ),
        "publishable": True,
        "publishable_reason": (
            "Free distribution granted, no selling; publishable for this non-commercial project under the owner's rule of 2026-10-17. The owner has also ruled that the short Scripture quotations from copyrighted translations inside this otherwise freely-distributable document do not block publishing."
        ),
        "usability": "usable",
        "usability_note": (
            "Publishable since the owner's rule of 2026-10-17: free distribution with no selling "
            "is enough for this non-commercial project, and the owner has ruled the short "
            "modern-translation verse quotations acceptable. Credit is required and it must never "
            "be sold. Its remaining limit is shape, not licence: these are doctrinal questions "
            "whose answers are paragraphs of confession, not facts you can mark right or wrong."
        ),
        "quality_note": (
            "Clean, coherent and well-cited, and the whole 1-to-60 sequence came out intact. "
            "Two things found by reading it: the answers are confessional statements rather "
            "than markable facts, so nothing here can be scored as a quiz; and question 13's "
            "citation is wrong in the published PDF, which gives '1st Corinthians 1:11-12' "
            "for a quotation that is plainly 1 Corinthians 2:11-12 ('no one knows the "
            "concerns of God except the Spirit of God'). That is the source's error, not the "
            "extraction's."
        ),
    },
    "creeds-json-reformed-catechisms": {
        "title": "Reformed catechisms from Creeds.json",
        "source_url": "https://github.com/NonlinearFruit/Creeds.json",
        "source_kind": "github_repo",
        "revision": "2ae21a4c5387ecc91f474c9d3d67c826d2a6b9d5",
        "revision_kind": "git commit sha on branch master",
        "revision_date": "2026-08-26T17:19:20-06:00",
        "download_method": (
            "git clone at that commit, then the seven catechism files used here plus the "
            "licence-bearing README.md copied into raw/ byte for byte. The other 36 creeds in "
            "the repository were not taken."
        ),
        "licence_as_stated": (
            'Quoted from README.md: "This repo as a whole is not licensed for reuse due to '
            "the copyright right status of several texts (listed below) ... These documents "
            'aside, the rest of this repo is licensed under the Unlicense."'
        ),
        "licence_nuance": (
            "The eight texts carved out of the Unlicense are the Chicago Statement on "
            "Biblical Inerrancy, four Crossway-copyright scripture hymns, the Helvetic "
            "Consensus translation, the Savoy Declaration and the Shema Yisrael. None of the "
            "seven catechisms taken here is among them, so all seven fall under the "
            "Unlicense, a public-domain dedication. They are also public domain by age in "
            "their own right, the newest being 1855. GitHub reports no licence for the "
            "repository because the Unlicense statement is prose in the README rather than a "
            "LICENSE file; the statement is explicit all the same."
        ),
        "attribution_required": False,
        "attribution_note": (
            "The Unlicense requires nothing. Crediting NonlinearFruit/Creeds.json for the "
            "transcription is courteous."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "Historic catechisms written by assemblies and individual divines between 1563 "
            "and 1855, transcribed into JSON with the proof-text apparatus preserved."
        ),
        "record_unit": "one numbered catechism question with its answer and, where the document has them, its proof texts",
        "format": (
            "One JSON file per catechism, each an object with Metadata (title, year, authors, "
            "origin story, upstream source URL) and Data (a list of {Number, Question, "
            "Answer, AnswerWithProofs, Proofs}). Proofs are [{Id, References}] with "
            "references in a compact 'Isa.44.6' style, and AnswerWithProofs carries inline "
            "[n] markers tying each clause to its proof."
        ),
        "publishable": True,
        "publishable_reason": (
            "The Unlicense is a public-domain dedication, and the underlying catechisms are public domain by age. Publishable; no obligation attached."
        ),
        "usability": "usable",
        "usability_note": (
            "The best-licensed catechism material in the corpus and the one to build on: an "
            "explicit public-domain dedication over texts that are themselves out of "
            "copyright, in clean structured JSON with proof texts attached."
        ),
        "quality_note": (
            "High quality and faithful to the printed documents, with proof texts on 779 of "
            "the 891 answers. Two gaps worth knowing. The Westminster Shorter Catechism copy "
            "carries no proof texts at all, even though the historic document has them, which "
            "is why a second proof-text copy of it was fetched separately. And three answers "
            "in the 1695 Baptist Catechism (questions 43, 59 and 60) have an empty Answer "
            "field upstream; the full text was recovered from their AnswerWithProofs field by "
            "stripping the [n] markers. As quiz material these are doctrinal questions with "
            "long answers, not markable facts."
        ),
    },
    "westminster-proof-texts": {
        "title": "Westminster Shorter and Larger Catechisms with the Assembly's proof texts",
        "source_url": "https://github.com/Sundar1205/westminster-catechism",
        "source_kind": "github_repo",
        "revision": "8e7351d8e6424cad3ce8f8d647ced10a281d3f7a",
        "revision_kind": "git commit sha on branch master, the head at retrieval",
        "revision_date": "2026-08-15T17:25:45Z",
        "download_method": (
            "curl of the individual files from raw.githubusercontent.com at branch master; "
            "the commit sha above was read from the GitHub API at the same time and is the "
            "revision those files came from."
        ),
        "licence_as_stated": "None. No LICENSE file and no licence field on GitHub.",
        "licence_nuance": (
            "Two layers pull in opposite directions. The catechism text and the Assembly's "
            "proof-text citations are public domain, printed in 1647 and 1648. What has no "
            "licence is this repository's own work: the parsing, the clause-by-clause "
            "splitting of each answer, and the corrections. With no licence, default "
            "copyright leaves that compilation with its author, so the structured JSON is "
            "research-only. The underlying words are free regardless. Take the publishable "
            "copy of these two catechisms from the Creeds.json source instead; the cost of "
            "doing so is that its Shorter Catechism has no proof texts."
        ),
        "attribution_required": True,
        "attribution_note": (
            "No licence states terms. The repository traces its own sources to a public "
            "gist of the 1647 Shorter Catechism text and to the Free Presbyterian Church of "
            "Scotland's edition of the 1648 Larger Catechism."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "The Westminster Assembly, 1647 and 1648, with the Assembly's own scripture "
            "proofs. The modern work is transcription and structuring, not authorship."
        ),
        "record_unit": "one catechism question, its answer split into clauses, each clause carrying its primary and secondary proof texts",
        "format": (
            "Two JSON files of {catechism, divisions, questions}, each question holding "
            "clauses with character offsets, 'proofs' and 'secondaryProofs' that carry a "
            "display string, book, chapter and expanded verse ids. The extraction flattens "
            "proofs per question and keeps the clause structure. The two plain-text sources "
            "and a CORRECTIONS.md are kept alongside."
        ),
        "publishable": True,
        "publishable_reason": (
            "no licence stated; owner rule 2026-10-17: unlicensed public content treated as publishable for non-commercial use"
        ),
        "usability": "usable",
        "usability_note": (
            "The richest proof-text apparatus in the corpus, and the only copy here of the "
            "Shorter Catechism with the Assembly's proofs. The compilation is unlicensed, never "
            "the text; under the owner's rule of 2026-10-17 unlicensed public content is "
            "publishable for this non-commercial project, with the repository credited."
        ),
        "quality_note": (
            "Unusually careful for an unlicensed repository: every proof is tied to the "
            "clause it supports rather than to the answer as a whole, and a CORRECTIONS.md "
            "records every edit made to the source text with its reason, including a "
            "duplicated proof marker in Shorter question 93 that would otherwise have shown "
            "the Lord's Supper's proof against Baptism. It also flags that Acts 8:37, cited "
            "three times by the Assembly, is absent from the World English Bible. All 303 "
            "questions carry primary proof texts. Its README reads as though written in this "
            "workspace's own voice, so it may be the owner's work or another agent's under a "
            "different account: if it is the owner's, licensing it would make this copy "
            "publishable at a stroke."
        ),
    },
    "gutenberg-baltimore-catechism": {
        "title": "Baltimore Catechism No. 1 and No. 2 (A Catechism of Christian Doctrine)",
        "source_url": "https://www.gutenberg.org/ebooks/14551 and https://www.gutenberg.org/ebooks/14552",
        "source_kind": "project_gutenberg_ebook",
        "revision": "ebook 14551 and ebook 14552, both most recently updated 2024-10-28",
        "revision_kind": "Project Gutenberg ebook number and its stated update date",
        "revision_date": "2024-10-28",
        "download_method": (
            "curl of each ebook's plain-text UTF-8 edition plus its RDF metadata record, "
            "with a pause between requests"
        ),
        "licence_as_stated": (
            "Public domain in the United States. The ebook header states it may be copied, "
            "given away or re-used under the Project Gutenberg License, and warns readers "
            "outside the United States to check their own law."
        ),
        "licence_nuance": (
            "The text was published in 1885 and its authors died long ago, so the work itself "
            "is out of copyright rather than merely licensed. The Project Gutenberg Licence "
            "only bites while its trademark and boilerplate are attached: strip those and the "
            "text is unencumbered, which is exactly what this extraction does by parsing only "
            "between the START and END markers. So credit the catechism, not Project "
            "Gutenberg."
        ),
        "attribution_required": False,
        "attribution_note": (
            "None required. Honest description: A Catechism of Christian Doctrine, prepared "
            "and enjoined by order of the Third Plenary Council of Baltimore, 1885, with the "
            "imprimatur of Cardinal McCloskey and Archbishop Gibbons."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "Written by order of the Third Plenary Council of Baltimore in 1885 and used to "
            "catechize American Catholic children for most of a century."
        ),
        "record_unit": "one numbered question with its answer, grouped under the lesson heading it falls within",
        "format": (
            "Project Gutenberg plain text. Entries read 'N. Q. <question>' then "
            "'A. <answer>', grouped under 'LESSON FIRST', 'LESSON SECOND' and so on. No. 1's "
            "numbering has deliberate gaps because it abridges No. 2, as its transcriber's "
            "note explains. Neither carries proof-text references."
        ),
        "publishable": True,
        "publishable_reason": (
            "Published 1885, so public domain in the United States. Publishable; no obligation attached."
        ),
        "usability": "usable",
        "usability_note": (
            "Freely publishable, and the largest single block of clean public-domain "
            "question-and-answer text in the corpus at 627 entries. The caveat is content, "
            "not rights: much of it is specifically Catholic sacramental teaching, so it "
            "suits a Bible quiz only in part."
        ),
        "quality_note": (
            "Clean extraction: 206 questions from No. 1 and 421 from No. 2, with every answer "
            "parsed and the Gutenberg licence boilerplate excluded by construction. The "
            "questions are short and have single checkable answers, which is the right shape "
            "for a quiz. The limit is subject matter: a large share asks about sacramentals, "
            "holy water, chrism and the sign of the cross rather than about anything in the "
            "Bible, so this needs filtering by topic before it could feed Bible questions. "
            "No. 1 is a strict subset of No. 2 in substance, so the two overlap heavily."
        ),
    },
    # --------------------------------------------------------------------- trivia
    "ministry-to-children-kids-bible-trivia": {
        "title": "300 Bible Trivia Questions and Answers for Kids",
        "source_url": "https://ministry-to-children.com/kids-bible-trivia/",
        "source_kind": "web_page",
        "revision": "page as served on 2026-10-17; the site's Terms of Service state 'Last updated: October 9, 2026'",
        "revision_kind": "retrieval date; the page sends no Last-Modified or ETag",
        "revision_date": RETRIEVED,
        "download_method": (
            "single curl GET of the page, saved verbatim as HTML, with the site's combined "
            "Privacy Policy and Terms of Service page saved next to it as the evidence for "
            "the licence. No crawler, no login, one request per page."
        ),
        "licence_as_stated": (
            'CC BY-SA 4.0. Quoted from the site\'s Terms of Service: "Unless otherwise '
            "stated, content on this website is (c) Ministry-To-Children.com and is available "
            "under the Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA "
            '4.0) license. That means you may share and adapt our content as long as you: '
            "Provide appropriate credit to Ministry-To-Children.com, and Distribute any "
            'adapted work under the same (or a compatible) license." The page footer repeats: '
            '"Free to share and adapt with credit (CC BY-SA 4.0)."'
        ),
        "licence_nuance": (
            "This is the opposite of what the brief expected, and it is worth the owner's "
            "attention. The brief said to mark this source copyrighted and research-only, so "
            "it is held that way here. But the site grants CC BY-SA 4.0 outright, there is no "
            "login or paywall, and robots.txt returns HTTP 404 so there are no crawl "
            "directives to honour. Nothing forbids this use. The owner can upgrade it to "
            "publishable; the price of CC BY-SA is crediting Ministry-To-Children.com and "
            "licensing whatever these questions are mixed into under a compatible share-alike "
            "licence, which is a real constraint on a website that may want its own terms."
        ),
        "attribution_required": True,
        "attribution_note": (
            "Required by CC BY-SA 4.0: credit Ministry-To-Children.com (Tony Kummer) and "
            "license any adaptation under the same or a compatible licence."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "Written for children's ministry by Tony Kummer, a former children's pastor, and "
            "sorted on the page by Bible book and topic."
        ),
        "record_unit": "one question with its answer, under the topic heading it appears below on the page",
        "format": (
            "HTML. Questions appear as 'Q: ...' followed by 'A: ...', with a second "
            "'True or False: ...' form whose answer line carries the verdict and sometimes an "
            "explanation. Topic headings separate the sections. Three sample questions sit "
            "above the main heading in a different shape and are skipped so nothing is "
            "counted twice."
        ),
        "publishable": True,
        "publishable_reason": (
            "CC BY-SA 4.0, granted by the site's own Terms of Service. Publishable with credit to Ministry-To-Children.com and share-alike on anything built from it."
        ),
        "usability": "usable",
        "usability_note": (
            "The strongest trivia source in the corpus and now marked publishable: genuinely "
            "well-made children's quiz questions under a real open licence, CC BY-SA 4.0, needing "
            "only attribution and share-alike. It had been held research-only on an instruction "
            "that the evidence contradicted."
        ),
        "quality_note": (
            "The best-shaped quiz questions in this batch. All 300 parsed, each short with a "
            "single checkable answer, and the coverage runs deliberately across the Bible "
            "from Genesis to the New Testament with sections on the Ten Commandments, the "
            "Lord's Prayer and the Fruit of the Spirit. Two blemishes: 7 of the 300 are "
            "duplicate question texts, leaving 293 distinct; and a few answers are lists "
            "rather than single values, such as 'Name one of Jesus' brothers?' answered "
            "'James, Joseph, Simon and Judas', which needs handling before auto-marking."
        ),
    },
    "liaaron1-bible-trivia-alpaca": {
        "title": "Bible trivia, Alpaca-formatted (liaaron1/bibile_trivia_alpaca)",
        "source_url": "https://huggingface.co/datasets/liaaron1/bibile_trivia_alpaca",
        "source_kind": "huggingface_dataset",
        "revision": "079b588e8c6ab7318ed91fb74a752817632898ae",
        "revision_kind": "git commit sha of the dataset repo on the Hub",
        "revision_date": "2023-08-28T06:17:31Z",
        "download_method": "curl of each file at the pinned revision via https://huggingface.co/datasets/<id>/resolve/<sha>/<file>",
        "licence_as_stated": "apache-2.0, in the dataset card YAML and in the Hub's licence tag",
        "licence_nuance": (
            "The stated licence does not survive checking. 244 of the 293 distinct questions "
            "on ministry-to-children.com's trivia page, 83 per cent of them, appear in this "
            "dataset verbatim and in the same order, starting from the identical opening "
            "question. This set is therefore substantially a copy of that page relabelled "
            "Apache-2.0. An uploader cannot relicense someone else's work, so for at least "
            "the overlapping portion the governing terms are the site's CC BY-SA 4.0, which "
            "requires attribution and share-alike; Apache-2.0 carries neither. Treat the "
            "Apache-2.0 tag as unreliable and the set as research-only. Its remaining value "
            "is that it is larger than the page it copies, so roughly a thousand questions "
            "come from somewhere else that is not recorded anywhere."
        ),
        "attribution_required": True,
        "attribution_note": (
            "Unsettled. If used at all, credit Ministry-To-Children.com for the overlapping "
            "questions; the provenance of the rest is unknown."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "Human-written quiz questions, but not by the uploader: at least 83 per cent of "
            "the overlap with ministry-to-children.com is that site's own work. Who wrote the "
            "remainder is not recorded."
        ),
        "record_unit": "one question-and-answer pair per line, in Alpaca instruction/response form",
        "format": (
            "JSON Lines, each line {instruction, context, response}. 'instruction' is the "
            "question and 'response' the answer; every 'context' field in the set is empty. "
            "950 of the 1,290 answers end with their verse, as in 'Mary (Matt 1:18)'; that "
            "citation is lifted into the reference field during extraction and the published "
            "wording kept in answer_as_published."
        ),
        "publishable": True,
        "publishable_reason": (
            "the stated Apache-2.0 is unreliable and is not relied on, leaving no dependable licence; owner rule 2026-10-17: unlicensed public content treated as publishable for non-commercial use"
        ),
        "usability": "usable",
        "usability_note": (
            "The clearest lesson in this batch about trusting a stated licence: it cannot be "
            "published on the strength of its Apache-2.0 tag, which is why that tag is not relied "
            "on. 244 records reproduce ministry-to-children.com and are keyed to that site's CC "
            "BY-SA 4.0, with credit and share-alike; the rest have no dependable licence and are "
            "publishable under the owner's rule of 2026-10-17 for unlicensed public content. The "
            "provenance gap is recorded, not closed."
        ),
        "quality_note": (
            "The questions themselves are good: short, factual, single-answer, and 950 of "
            "1,290 carry a verse citation, which is a higher proportion than any other "
            "trivia source here. All 1,290 lines parsed cleanly and the count matches the "
            "card exactly. The problems are provenance, not craft: the 83 per cent verbatim "
            "overlap with a CC BY-SA site under an Apache-2.0 label, and visible typos "
            "carried over from that source such as 'Ture or False' for 'True or False'."
        ),
    },
    "ayandangubane-bible-quiz": {
        "title": "Scripture Buzzer question set (AyandaNgubane/Bible-Quiz)",
        "source_url": "https://github.com/AyandaNgubane/Bible-Quiz",
        "source_kind": "github_repo",
        "revision": "f2341765d2511f12c1524700ca9f63d520e356f9",
        "revision_kind": "git commit sha on branch main",
        "revision_date": "2026-09-29T08:48:53+02:00",
        "download_method": (
            "git clone, then `git archive HEAD` extracted into raw/, so the folder holds the "
            "tracked tree at that commit with no .git directory"
        ),
        "licence_as_stated": "None. No LICENSE file and GitHub reports no licence.",
        "licence_nuance": (
            "With no licence, default copyright applies and all rights stay with the author. "
            "Downloading to study it is one thing; publishing it is another."
        ),
        "attribution_required": True,
        "attribution_note": "No licence states terms. Credit AyandaNgubane/Bible-Quiz if permission is ever obtained.",
        "questions_written_by": "template-generated",
        "questions_written_by_detail": (
            "The README calls these '1,005 original multiple-choice questions, "
            "hand-organized across 25 categories'. The repository's own gen/ directory shows "
            "what that means: 29 Python scripts expand hand-written fact tables into "
            "questions from sentence templates, drawing wrong answers at random from a pool "
            "under a fixed seed. The underlying facts and the templates are human work, but "
            "the individual questions were not written one at a time, so this sits between "
            "human-written and machine-made and should not be counted as either."
        ),
        "record_unit": "one multiple-choice question with four options, a correct-answer index, a difficulty and a category",
        "format": (
            "A single JSON array of {question, options, correct_index, difficulty, category, "
            "id}. The answer is options[correct_index] and the option order is as published. "
            "Difficulty runs easy, medium, hard across 25 named categories."
        ),
        "publishable": True,
        "publishable_reason": (
            "no licence stated; owner rule 2026-10-17: unlicensed public content treated as publishable for non-commercial use"
        ),
        "usability": "usable",
        "usability_note": (
            "No licence is stated, so it is publishable under the owner's rule of 2026-10-17 for "
            "unlicensed public content, with the repository credited. Of limited value as a model "
            "even so: the template construction shows through. Its one distinctive feature is a "
            "Pentecostal and Charismatic doctrine category, which no other source here has."
        ),
        "quality_note": (
            "Well-formed on the surface, with four options, a difficulty and a category on "
            "every one of the 1,005 records, and no broken answer indexes. The templating "
            "costs it, though. The very first question asks 'Is the book of Genesis found in "
            "the Old Testament or the New Testament?' and then offers four options including "
            "'Apocrypha' and 'The Torah only', so the stem and the options disagree about "
            "what is being asked. Because wrong answers are drawn from a shared pool, "
            "implausible distractors recur, and whole runs of questions are the same sentence "
            "with one noun swapped, book by book through the canon. Fine for drilling, weak "
            "as a quality benchmark."
        ),
    },
    "brianchanda-bible-quiz": {
        "title": "Bible Quiz question bank (BRIANCHANDA/Bible-Quiz)",
        "source_url": "https://github.com/BRIANCHANDA/Bible-Quiz",
        "source_kind": "github_repo",
        "revision": "8d586f2661e2adfabd060e6ad7253f831028c8b6",
        "revision_kind": "git commit sha on branch main",
        "revision_date": "2025-08-11T19:44:27+02:00",
        "download_method": (
            "git clone at that commit, then the question bank and the LICENSE and README "
            "copied into raw/ byte for byte. The rest of the repository is a Java desktop "
            "application and was not taken."
        ),
        "licence_as_stated": "MIT, with a full LICENSE file: 'MIT License, Copyright (c) 2025 Eric Sakala'",
        "licence_nuance": (
            "A real licence file naming its copyright holder, so reuse is granted provided "
            "the notice travels with it. MIT is a software licence applied to data, which is "
            "slightly unusual but unambiguous about what it permits. Note the copyright "
            "holder named in the licence, Eric Sakala, is not the repository owner's "
            "username; that is common and does not undermine the grant."
        ),
        "attribution_required": True,
        "attribution_note": (
            "MIT requires the copyright notice and permission notice to be included: "
            "Copyright (c) 2025 Eric Sakala."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "Written one at a time: the questions vary in shape and difficulty and show no "
            "sign of templating, and include negative forms such as 'Which of the following "
            "was NOT one of the gifts given to Jesus by the Wise Men?'"
        ),
        "record_unit": "one multiple-choice question with four lettered options and the letter of the correct one",
        "format": (
            "A single JSON array of {id, question, options, answer}, where options is an "
            "object keyed A to D and answer is the correct letter. The extraction resolves "
            "the letter to the answer text and lists the options in letter order. No "
            "difficulty, category or proof-text fields."
        ),
        "publishable": True,
        "publishable_reason": (
            "MIT licensed. Publishable, on condition the copyright and permission notice travels with it: Copyright (c) 2025 Eric Sakala."
        ),
        "usability": "usable",
        "usability_note": (
            "Found by searching GitHub rather than named in the brief, and one of the two "
            "best finds of that search: 200 human-written multiple-choice Bible questions "
            "under a clean MIT licence. Publishable with the copyright notice."
        ),
        "quality_note": (
            "Genuinely good quiz questions and the cleanest licence position of any trivia "
            "source in this batch. All 200 parsed, every answer letter resolved to a real "
            "option, four plausible distractors throughout, and the spread covers Genesis, "
            "the Gospels, the disciples and the patriarchs. Weaknesses are mild: no verse "
            "references anywhere, no difficulty labels, and the questions stay at an easy to "
            "moderate level, so this will not stretch an adult player."
        ),
    },
    "danielkorsah-bible-trivia-game": {
        "title": "Bible Trivia Game question bank (DanielKorsah03/Bible-Trivia-Game)",
        "source_url": "https://github.com/DanielKorsah03/Bible-Trivia-Game",
        "source_kind": "github_repo",
        "revision": "6d7a71f5a63ac01d8fa4e80ae142fc85bc467f38",
        "revision_kind": "git commit sha on branch main",
        "revision_date": "2026-07-03T12:34:30Z",
        "download_method": (
            "git clone at that commit, then the two SQL files holding the questions plus the "
            "LICENSE and README copied into raw/ byte for byte. The PHP web application was "
            "not taken."
        ),
        "licence_as_stated": "MIT, with a full LICENSE file: 'MIT License, Copyright (c) 2026 Daniel Korsah'",
        "licence_nuance": (
            "A real licence file naming its copyright holder. As with the other MIT source "
            "here, it is a software licence applied to data, but it plainly permits reuse and "
            "redistribution with the notice attached."
        ),
        "attribution_required": True,
        "attribution_note": (
            "MIT requires the copyright notice and permission notice to be included: "
            "Copyright (c) 2026 Daniel Korsah."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "Written individually, and by someone who knows the text: the hard tier asks "
            "after the servant girl who recognised Peter's voice at the gate, the name of the "
            "bronze serpent, and the father of the exiled priest Jehozadak."
        ),
        "record_unit": "one question with a difficulty label, a category id and four answer rows of which one is flagged correct",
        "format": (
            "MySQL dump. Each question is an INSERT INTO questions carrying the question "
            "text, a numeric category id and a difficulty from easy through very_hard, "
            "followed by an INSERT INTO answers with four rows, one flagged TRUE. The files "
            "do not say what the category ids mean."
        ),
        "publishable": True,
        "publishable_reason": (
            "MIT licensed. Publishable, on condition the copyright and permission notice travels with it: Copyright (c) 2026 Daniel Korsah."
        ),
        "usability": "usable",
        "usability_note": (
            "The other good find from searching GitHub. Small at 132 questions, but cleanly "
            "MIT licensed and by some margin the hardest and most precise trivia set in the "
            "corpus, which makes it the most useful yardstick here for what a strong Bible "
            "question looks like."
        ),
        "quality_note": (
            "The best-written trivia questions in this batch. All 132 parsed with their four "
            "answer rows and difficulty labels intact, and the difficulty tiers are honest: "
            "the very_hard entries demand real textual knowledge (Nehushtan, Meribah, "
            "Seraiah as Jehozadak's father) rather than recognition, and the distractors are "
            "chosen to be genuinely tempting. Two limits: it is the smallest bank taken here, "
            "and it carries no verse references, so every answer would need its citation "
            "added before the questions could be checked or taught from."
        ),
    },
    # ---------------------------------------- filtered general-knowledge trivia
    "uberspot-opentriviaqa": {
        "title": "OpenTriviaQA religion-faith category, Bible questions only",
        "source_url": "https://github.com/uberspot/OpenTriviaQA",
        "source_kind": "github_repo",
        "revision": "dcc1cdf36c2985ed5c849d1f2265c5041ffcdfb9",
        "revision_kind": "git commit sha on branch master",
        "revision_date": "2026-05-21T14:10:45+01:00",
        "download_method": (
            "git clone at that commit, then the religion-faith category file plus LICENSE and "
            "README.md copied into raw/ byte for byte. The other 21 categories were not "
            "taken, as the brief asked for the religion category only."
        ),
        "licence_as_stated": (
            "CC BY-SA 4.0, stated in README.md, carried in full in the LICENSE file, and "
            "detected as CC-BY-SA-4.0 by GitHub's own licence API"
        ),
        "licence_nuance": (
            "The cleanest licence statement of any source in this batch, agreed across three "
            "places. The honest caveat is upstream: the README says the questions 'were "
            "gathered' some years ago from sources it does not name, so the maintainer's "
            "CC BY-SA 4.0 covers this collection without establishing that the original "
            "questions were his to license. Good enough for a quiz; worth knowing before "
            "building anything load-bearing on it."
        ),
        "attribution_required": True,
        "attribution_note": (
            "Required by CC BY-SA 4.0: credit uberspot/OpenTriviaQA and license any "
            "adaptation under the same or a compatible licence."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "Human-written multiple-choice trivia, gathered rather than authored by the "
            "maintainer, with the original writers unrecorded."
        ),
        "record_unit": "one multiple-choice question with its correct answer and the full option list",
        "format": (
            "A plain-text block format: '#Q <question>', then '^ <correct answer>', then one "
            "lettered line per option. Apostrophes are stripped throughout the source file."
        ),
        "publishable": True,
        "publishable_reason": (
            "CC BY-SA 4.0 stated in the README and the LICENSE file. Publishable with credit to uberspot/OpenTriviaQA and share-alike on anything built from it."
        ),
        "usability": "usable",
        "usability_note": (
            "Publishable with attribution and share-alike, and the largest filtered yield of "
            "the three general-knowledge sources at 247 Bible questions."
        ),
        "quality_note": (
            "Solid multiple-choice questions with real distractors, drawn across both "
            "testaments and including some that quote the text directly. The category needed "
            "heavy filtering rather than trimming: of the questions parsed from "
            "religion-faith, only a minority are about the Bible, the rest being Judaism and "
            "Jewish history, the modern state of Israel, Catholic devotion to later saints, "
            "Buddhism, Scientology, witch trials and, in the very first entry, a film about "
            "Casanova. Two quality marks on what was kept: apostrophes are missing throughout "
            "('Bibles interpretation', 'Moses life'), so the text needs repunctuating, and a "
            "few answers are 'All of these', which does not survive being shuffled."
        ),
    },
    "el-cms-open-trivia-database": {
        "title": "el-cms Open-trivia-database, Bible questions only",
        "source_url": "https://github.com/el-cms/Open-trivia-database",
        "source_kind": "github_repo",
        "revision": "6026af588466d582622fd4c99767a901f3483127",
        "revision_kind": "git commit sha on branch master",
        "revision_date": "2022-01-04T20:46:39+01:00",
        "download_method": (
            "git clone at that commit, then the two English category files Bible questions "
            "occur in, plus README.md, copied into raw/ byte for byte. The French tree and "
            "the other English categories were not taken."
        ),
        "licence_as_stated": (
            'No licence. Quoted in full from README.md: "Facts are fact, we can\'t license '
            "that. If you use this work, please cite this repository and add a link to it in "
            'your work."'
        ),
        "licence_nuance": (
            "A request to cite is not a grant of licence, and the premise behind it is wrong: "
            "facts cannot be copyrighted but the wording of a question can, and these are "
            "written questions rather than bare facts. With no licence the default is all "
            "rights reserved, so this is research-only however generous the intent reads."
        ),
        "attribution_required": True,
        "attribution_note": (
            "The README asks for a citation and a link to the repository. That is its own "
            "stated wish, not a licence condition, because there is no licence."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": (
            "Crowd-collected written questions. Some records carry a 'source' URL field "
            "upstream, though none of the Bible questions kept here has one filled in."
        ),
        "record_unit": "one question with its answer, kept from the religion-and-mythology and uncategorized category files",
        "format": (
            "Files that open with '[' and close with ']' but put no commas between objects, "
            "so they are JSON Lines wrapped in brackets and cannot be parsed as one JSON "
            "document. Each object is {category_id, lang, tags, question, answer, answers, "
            "source}, where 'answer' is an index into 'answers'."
        ),
        "publishable": True,
        "publishable_reason": (
            "no licence stated; owner rule 2026-10-17: unlicensed public content treated as publishable for non-commercial use"
        ),
        "usability": "usable",
        "usability_note": (
            "No licence is stated, so it is publishable under the owner's rule of 2026-10-17 for "
            "unlicensed public content; the repository's own request to be cited and linked is "
            "met by the per-record credit. Its distinctive value is breadth: 300 of its 329 Bible "
            "questions were found in a 31,000-record uncategorized pile, so it reaches questions "
            "the religion category alone would have missed."
        ),
        "quality_note": (
            "The questions are decent and often specific, but the data is the roughest in the "
            "corpus. Every one of the 329 kept records gives the answer alone with no "
            "distractors, so despite looking like multiple choice these are open-answer "
            "questions and the options field is left empty rather than holding a one-item "
            "list. 1,643 of the 31,304 records in the large file, about 5 per cent, carry "
            "unescaped double quotes inside their question text and are not valid JSON; 1,599 "
            "were recovered by re-escaping, and the remaining 44 were checked individually "
            "and hold no Bible question that the filter would have kept. Punctuation and "
            "capitalisation are inconsistent throughout ('How many sayings did jesus say from "
            "the cross'), and a few kept questions rest on legend rather than text, such as "
            "the Last Supper chalice being called the Holy Grail."
        ),
    },
    "opentdb-api": {
        "title": "Open Trivia Database, Bible questions from the public API",
        "source_url": "https://opentdb.com/api.php",
        "source_kind": "public_api",
        "revision": f"API pull of {RETRIEVED}; session token 1ac4be1cdc9404b50286d383cc9cff6a725afa0df0e94e608ee87fdc2e87e847",
        "revision_kind": "retrieval date and the session token used, which the API issues to stop repeats within a pull",
        "revision_date": RETRIEVED,
        "download_method": (
            "10 requests to the public API at 50 questions each, one request every 6 seconds "
            "against the service's documented limit of one per 5 seconds, using a session "
            "token so no question was returned twice and base64 encoding so the text is "
            "byte-exact. Each response is kept exactly as returned, one file per request, "
            "with a fetch-log.json recording the pull."
        ),
        "licence_as_stated": "CC BY-SA 4.0, as stated by opentdb.com for the Open Trivia Database",
        "licence_nuance": (
            "Clean and unambiguous for the compilation. The questions are submitted by the "
            "public and checked by the site's moderators before publication."
        ),
        "attribution_required": True,
        "attribution_note": (
            "Required by CC BY-SA 4.0: credit the Open Trivia Database (opentdb.com) and "
            "license any adaptation under the same or a compatible licence."
        ),
        "questions_written_by": "human-written",
        "questions_written_by_detail": "Submitted by members of the public and verified by the database's moderators.",
        "record_unit": "one question with its correct answer and, for multiple-choice entries, its wrong answers",
        "format": (
            "JSON API responses of {response_code, results}, each result holding category, "
            "type, difficulty, question, correct_answer and incorrect_answers, all base64 "
            "encoded. Options are listed alphabetically in the extraction because the API "
            "returns the correct answer separately from the wrong ones, so the published "
            "order is not an order any player ever saw."
        ),
        "publishable": True,
        "publishable_reason": (
            "CC BY-SA 4.0 stated by opentdb.com. Publishable with credit to the Open Trivia Database and share-alike on anything built from it."
        ),
        "usability": "usable",
        "usability_note": (
            "Publishable with attribution, but the yield is so small that it barely counts as "
            "a source: 3 questions. Recorded in full because the brief asked for it and "
            "because the negative result is the useful finding."
        ),
        "quality_note": (
            "The questions are fine, being moderator-verified, but there are almost none. The "
            "Open Trivia Database has no religion category at all, so the two nearest pools "
            "were taken in their entirety: Mythology, which is Greek and Roman rather than "
            "biblical, and General Knowledge. 500 questions came back and exactly 3 are about "
            "the Bible. Worth noting for anyone repeating this: the count endpoint advertised "
            "71 Mythology and 469 General Knowledge questions, but the token-based pull "
            "returned 50 and 450, the gap being questions the API holds back from a verified "
            "pull. This source is a dead end for Bible material and should not be revisited."
        ),
    },
}
