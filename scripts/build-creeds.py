"""Build the Catechisms & Creeds page data from the research corpus's modern Scripture layer.

Reads Research/Creeds/normalized-modern/ (built by the corpus's own tools; never written to here) and
writes data/creeds/: one index for the landing page and one file per document.

Scripture quoted inside a document is whatever the modern layer settled on: a *_modern field where a
quotation was restated in the Berean Standard Bible, the document's own older wording where the layer
declined to act. Proof-text references are resolved against the site's own BSB text, so a reference the
Berean text does not carry is shown as a reference with no verse words rather than guessed at.

    python scripts/build-creeds.py            # write data/creeds/
    python scripts/build-creeds.py --check    # fail if the output is missing or stale
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bible.books import OSIS_TO_CODE, verse_id  # noqa: E402

WEBSITE = Path(__file__).resolve().parent.parent
PROJECT = WEBSITE.parent
CORPUS = PROJECT / "Research" / "Creeds"
LAYER = CORPUS / "normalized-modern"
OUT = WEBSITE / "data" / "creeds"
PLAIN_BSB = WEBSITE / "data" / "plain" / "bsb"

SCHEMA = "bibleproject.creeds-site/v1"

# Longer citations are cut here and carry a link on into the reader instead; 97.7% of references are
# six verses or fewer, and a whole-chapter citation would otherwise bury the answer it supports.
MAX_PROOF_VERSES = 8

# A part of a document holds at most this many sections before it is split, so no single view renders
# hundreds of answers at once.
MAX_PART_SECTIONS = 80

# The biggest of these documents is a 3,938-section book. Its sections are written out in bundles of
# whole parts under this budget, so opening a part fetches a readable slice instead of the whole book,
# without going anywhere near one file per answer (Cloudflare Pages allows 20,000 files a release).
BUNDLE_BUDGET = 220_000

# --- the families the landing page groups documents into, in historical order ---------------------
# Each family is a tradition or a moment rather than a tidy licence category: the reader is looking for
# "the ancient creeds" or "the Baptist confessions", not for Creeds.json versus Schaff.
FAMILIES: list[dict] = [
    {
        "id": "scripture",
        "title": "Scripture's own confessions",
        "lead": "The oldest confessions in the Bible itself — Israel's creed, Peter's answer, and the hymns the apostles quote.",
        "art": "scroll",
        "tone": "poetry",
    },
    {
        "id": "rule-of-faith",
        "title": "The early church's rule of faith",
        "lead": "Before there were councils, teachers summarised the faith they had received in a few sentences.",
        "art": "lamp",
        "tone": "gospels",
    },
    {
        "id": "ancient-creeds",
        "title": "The ancient creeds",
        "lead": "The creeds the councils settled, still said aloud in most of the world's churches.",
        "art": "arches",
        "tone": "revelation",
    },
    {
        "id": "medieval-west",
        "title": "The medieval West",
        "lead": "A council on grace, and a confession from the valleys that kept its own way.",
        "art": "stone",
        "tone": "history",
    },
    {
        "id": "lutheran",
        "title": "Lutheran",
        "lead": "Luther's catechisms and the confessions the German churches signed.",
        "art": "rose",
        "tone": "prophets",
    },
    {
        "id": "swiss-continental",
        "title": "The Swiss and continental Reformation",
        "lead": "Zurich, Basel, Berne, Strasbourg, Heidelberg, the Low Countries and France.",
        "art": "mountains",
        "tone": "epistles",
    },
    {
        "id": "british-reformed",
        "title": "Westminster and the British Reformed",
        "lead": "The Scots and Westminster standards, and the catechisms written to explain them.",
        "art": "thistle",
        "tone": "poetry",
    },
    {
        "id": "anglican",
        "title": "Anglican",
        "lead": "The Articles of Religion and the catechism in the Book of Common Prayer.",
        "art": "crown",
        "tone": "apocrypha",
    },
    {
        "id": "baptist",
        "title": "Baptist",
        "lead": "The London confession and the catechisms the Baptist churches taught from it.",
        "art": "water",
        "tone": "gospels",
    },
    {
        "id": "methodist-arminian",
        "title": "Methodist and Arminian",
        "lead": "The Remonstrance that opened the argument, and the Articles Wesley sent to America.",
        "art": "flame",
        "tone": "history",
    },
    {
        "id": "roman-catholic",
        "title": "Roman Catholic",
        "lead": "Trent's canons, the creed that followed them, and the First Vatican Council.",
        "art": "keys",
        "tone": "revelation",
    },
    {
        "id": "orthodox",
        "title": "Eastern Orthodox",
        "lead": "The confessions of the Eastern patriarchs and Philaret's catechism.",
        "art": "dome",
        "tone": "prophets",
    },
]

# Which family each document belongs to. Written out document by document because tradition alone does
# not decide it: the Savoy Declaration is Congregational and the Exposition is Nonconformist, but a
# reader looking for either is looking in the Westminster shelf.
FAMILY_OF: dict[str, str] = {
    "shema-yisrael-1500-bc": "scripture",
    "confession-of-peter-30": "scripture",
    "christian-shema-55": "scripture",
    "christ-hymn-of-philippians-60": "scripture",
    "christ-hymn-of-colossians-60": "scripture",
    "ignatius-creed-110": "rule-of-faith",
    "irenaeus-rule-of-faith-180": "rule-of-faith",
    "tertullian-s-rule-of-faith-200": "rule-of-faith",
    "gregory-s-declaration-of-faith-265": "rule-of-faith",
    "nicene-creed-381": "ancient-creeds",
    "nicene-creed-381-schaff": "ancient-creeds",
    "chalcedonian-definition-451": "ancient-creeds",
    "chalcedonian-definition-451-schaff": "ancient-creeds",
    "athanasian-creed-800": "ancient-creeds",
    "athanasian-creed-quicunque-schaff": "ancient-creeds",
    "apostles-creed-710": "ancient-creeds",
    "apostles-creed-received-text-schaff": "ancient-creeds",
    "third-council-of-constantinople-680-schaff": "ancient-creeds",
    "council-of-orange-529": "medieval-west",
    "waldensian-confession-1120": "medieval-west",
    "luthers-large-catechism-1529": "lutheran",
    "luthers-small-catechism-1529": "lutheran",
    "augsburg-confession-1530": "lutheran",
    "smalcald-articles-1537": "lutheran",
    "formula-of-concord-epitome-1577": "lutheran",
    "saxon-visitation-articles-1592": "lutheran",
    "zwingli-s-67-articles-1523": "swiss-continental",
    "ten-theses-of-berne-1528": "swiss-continental",
    "tetrapolitan-confession-1530": "swiss-continental",
    "zwingli-s-fidei-ratio-1530": "swiss-continental",
    "first-confession-of-basel-1534": "swiss-continental",
    "first-helvetic-confession-1536": "swiss-continental",
    "consensus-tigurinus-1549": "swiss-continental",
    "french-confession-of-faith-1559": "swiss-continental",
    "belgic-confession-1561": "swiss-continental",
    "second-helvetic-confession-1562": "swiss-continental",
    "heidelberg-catechism-1563": "swiss-continental",
    "canons-of-dort-1619": "swiss-continental",
    "scots-confession-1560": "british-reformed",
    "second-scotch-confession-1580": "british-reformed",
    "westminster-confession-of-faith-1647": "british-reformed",
    "westminster-larger-catechism-1647": "british-reformed",
    "westminster-shorter-catechism-1647": "british-reformed",
    "savoy-declaration-1658": "british-reformed",
    "an-exposition-of-the-assemblies-catechism-1688": "british-reformed",
    "matthew-henry-s-scripture-catechism-1703": "british-reformed",
    "the-assembly-s-shorter-catechism-explained-1765": "british-reformed",
    "catechism-for-young-children-1840": "british-reformed",
    "thirty-nine-articles-1571": "anglican",
    "lambeth-articles-1595": "anglican",
    "irish-articles-of-religion-1615": "anglican",
    "anglican-catechism-1662": "anglican",
    "1689-london-baptist-confession-1677": "baptist",
    "1695-baptist-catechism-1695": "baptist",
    "keach-s-catechism-1794": "baptist",
    "new-hampshire-baptist-confession-1833": "baptist",
    "puritan-catechism-1855": "baptist",
    "abstract-of-principles-1858": "baptist",
    "five-arminian-articles-1610": "methodist-arminian",
    "methodist-articles-of-religion-1784": "methodist-arminian",
    "council-of-trent-canons-and-decrees-1563": "roman-catholic",
    "profession-of-the-tridentine-faith-1564": "roman-catholic",
    "vatican-council-dogmatic-decrees-1870": "roman-catholic",
    "orthodox-confession-of-the-eastern-church-1643": "orthodox",
    "confession-of-dositheus-1672": "orthodox",
    "longer-catechism-of-the-orthodox-church-1839": "orthodox",
}

# The four creeds held twice, from two different editors. Each page points at its sibling so two
# near-identical cards never look like a mistake.
SIBLINGS: dict[str, str] = {
    "nicene-creed-381": "nicene-creed-381-schaff",
    "nicene-creed-381-schaff": "nicene-creed-381",
    "chalcedonian-definition-451": "chalcedonian-definition-451-schaff",
    "chalcedonian-definition-451-schaff": "chalcedonian-definition-451",
    "athanasian-creed-800": "athanasian-creed-quicunque-schaff",
    "athanasian-creed-quicunque-schaff": "athanasian-creed-800",
    "apostles-creed-710": "apostles-creed-received-text-schaff",
    "apostles-creed-received-text-schaff": "apostles-creed-710",
}

# A flag whose reason is in here means a quotation was recognised but left in the document's own older
# wording. The rest of the reasons describe a citation with no quotation to restate. The short code is
# what the page carries; the sentence a reader sees is written beside it in the page's own code.
UNRESTATED_REASONS = {
    "partial-quotation-not-mappable": "partial",
    "loose-quotation": "loose",
    "quotation-too-short-to-confirm": "short",
    "overlapping-quotations": "overlap",
    "uncited-quotation-ambiguous": "uncited",
    "multiple-references": "several",
}

# Reasons that mean the Berean text cannot supply the reference at all.
UNAVAILABLE_REASONS = {"reference-absent-from-bsb", "verse-numbering-difference"}

LANGUAGE_NAMES = {"latin": "Latin", "greek": "Greek", "german": "German", "greek-latin": "Greek and Latin"}


# --- text repair ----------------------------------------------------------------------------------
# Replacing a quotation leaves the Berean sentence's own punctuation beside the punctuation that
# closed the original quotation, so 1,298 of the layer's restated fields end up with runs like `..`,
# `.,` or `.".`. Nothing here changes a word: it collapses an adjacent run of marks to the one mark
# that belongs there, and drops a space that ended up before punctuation.

_SPACE_BEFORE = re.compile(r"[ \t]+([.,;:!?])")
_RUN = re.compile(r"(?:[.,;:!?”’\"])*[.,;:!?](?:[.,;:!?”’\"])*")
_MARKS = ".,;:!?"
_QUOTES = "”’\""
_RANK = {".": 3, "!": 3, "?": 3, ";": 2, ":": 1, ",": 0}


def tidy(text: str | None) -> str | None:
    """Collapse the punctuation a quotation substitution doubled up. Wording is never touched."""
    if not text:
        return text
    text = _SPACE_BEFORE.sub(r"\1", text)
    pieces: list[str] = []
    cursor = 0
    for match in _RUN.finditer(text):
        run = match.group(0)
        marks = [c for c in run if c in _MARKS]
        if len(marks) < 2:
            continue
        ranks = {_RANK[c] for c in marks}
        # A sentence cannot end where the next word continues in lower case, so the clause mark the
        # document itself used wins there over the full stop the Berean sentence brought with it.
        following = text[match.end():].lstrip()
        best = max(r for r in ranks if r < 3) if following[:1].islower() and any(r < 3 for r in ranks) else max(ranks)
        keep = next(c for c in marks if _RANK[c] == best)
        quotes = "".join(dict.fromkeys(c for c in run if c in _QUOTES))
        pieces.append(text[cursor:match.start()] + keep + quotes)
        cursor = match.end()
    return ("".join(pieces) + text[cursor:]) if pieces else text


# --- Scripture ------------------------------------------------------------------------------------
@dataclass
class Bsb:
    """The site's own Berean Standard Bible words, read once per book."""

    books: dict[str, dict[str, str]]

    @classmethod
    def load(cls) -> "Bsb":
        if not PLAIN_BSB.is_dir():
            raise SystemExit(f"build-creeds: {PLAIN_BSB} is missing. Run scripts/build-data.py first.")
        books = {path.stem: json.loads(path.read_text("utf-8")) for path in sorted(PLAIN_BSB.glob("*.json"))}
        if not books:
            raise SystemExit(f"build-creeds: no Berean Standard Bible books in {PLAIN_BSB}.")
        return cls(books)

    def verses(self, code: str, start: tuple[int, int], end: tuple[int, int]) -> tuple[list[dict], bool]:
        """The verses of a span as canonical verse ids and words, cut at MAX_PROOF_VERSES."""
        book = self.books.get(code)
        if not book:
            return [], False
        lines: list[dict] = []
        for key, words in book.items():
            chapter, _, verse = key.partition(":")
            if not chapter.isdigit() or not verse.isdigit():
                continue
            position = (int(chapter), int(verse))
            if position < start or position > end:
                continue
            lines.append({"id": verse_id(code, position[0], position[1]), "text": words})
        lines.sort(key=lambda line: line["id"])
        return lines[:MAX_PROOF_VERSES], len(lines) > MAX_PROOF_VERSES


def reference_span(ref: dict) -> tuple[str, tuple[int, int], tuple[int, int], list[int]] | None:
    """A parsed reference as (book code, start chapter/verse, end chapter/verse, reader span)."""
    start = ref.get("start") or {}
    book = start.get("book")
    code = OSIS_TO_CODE.get(book)
    if not code:
        return None  # a deuterocanonical book: the Berean Standard Bible carries none
    end = ref.get("end") or start
    end_code = OSIS_TO_CODE.get(end.get("book", book), code)
    first = (int(start.get("chapter") or 1), int(start.get("verse") or 1))
    # A citation with no verse ("Romans 1") means the whole chapter.
    last = (int(end.get("chapter") or first[0]), int(end.get("verse") or 999))
    span = [verse_id(code, first[0], first[1]), verse_id(end_code, last[0], min(last[1], 999))]
    return code, first, last, span


def reference_label(ref: dict) -> str:
    """"Romans 14:7-9", from the reference's own parsed parts."""
    start = ref.get("start") or {}
    end = ref.get("end")
    name = start.get("book_name") or start.get("book") or "?"
    chapter, verse = start.get("chapter"), start.get("verse")
    head = f"{name} {chapter}" if chapter else name
    if verse:
        head = f"{head}:{verse}"
    if not end:
        return head
    end_name = end.get("book_name") or end.get("book")
    # A chapter range ("Genesis 1–2") has no end verse.
    end_place = ":".join(str(part) for part in (end.get("chapter"), end.get("verse")) if part)
    if end_name and end_name != name:
        return f"{head} – {end_name} {end_place}".rstrip()
    if end.get("chapter") and end.get("chapter") != chapter:
        return f"{head}–{end_place}"
    if end.get("verse") and end.get("verse") != verse:
        return f"{head}–{end['verse']}"
    return head


# --- documents ------------------------------------------------------------------------------------
def year_value(document: dict) -> int | None:
    """The document's date as a number, for sorting and for placing it on the time rail.

    Only the five documents that exist solely in the modern layer carry a numeric `year`; the rest
    record a label such as "1647", "c. 200" or "-1500", so the number is read back out of it.
    """
    year = document.get("year")
    if isinstance(year, int):
        return year
    match = re.search(r"-?\d+", str(document.get("year_label") or ""))
    return int(match.group(0)) if match else None


def year_label(document: dict) -> str:
    """"c. 1500 BC", "AD 30", "c. 200", "1647" — the date as a reader would say it."""
    raw = str(document.get("year_label") or "").strip()
    year = year_value(document)
    if year is None:
        return raw or "date unknown"
    if year < 0:
        return f"c. {abs(year)} BC"
    if year < 100:
        return f"AD {year}" if not raw.startswith("c.") else f"c. AD {year}"
    return raw or str(year)


def section_text(section: dict) -> tuple[str | None, str | None, bool]:
    """The question and answer to publish: the restated field where there is one, else the original."""
    question = section.get("question_modern") or section.get("question")
    text = section.get("text_modern") or section.get("text")
    restated = bool(section.get("question_modern") or section.get("text_modern"))
    return tidy(question), tidy(text), restated


def part_key(section: dict, previous: str | None) -> str:
    """The heading a section belongs under: the document's own grouping where it has one."""
    path = section.get("path") or []
    if path:
        return str(path[0])
    number = section.get("number")
    if section.get("kind") in {"question", "sub-question"} and number:
        # A question with no path either stands alone or heads the sub-questions that follow it.
        return f"Question {number}"
    return section.get("heading") or previous or "The text"


def chunk_parts(sections: list[dict], size: int = 25) -> list[dict]:
    """A flat run of questions or articles, cut into ranges a reader can hold in view.

    The document's own numbers are used for the labels only when every section carries one; one
    unnumbered preamble among 594 questions would otherwise make every later range read a verse off.
    """
    numbered = all(section.get("number") for section in sections)
    parts: list[dict] = []
    for start in range(0, len(sections), size):
        end = min(start + size, len(sections)) - 1
        first, last = sections[start], sections[end]
        noun = {"question": "Questions", "sub-question": "Questions", "article": "Articles",
                "canon": "Canons", "decree": "Decrees"}.get(str(first.get("kind")), "Sections")
        if numbered and str(first["number"]) != str(last["number"]):
            label = f"{noun} {first['number']}–{last['number']}"
        else:
            label = f"{noun} {start + 1}–{end + 1}" if end > start else f"{noun} {start + 1}"
        parts.append({"label": label, "from": start, "to": end})
    return parts


def build_parts(sections: list[dict]) -> list[dict]:
    """Contiguous runs of sections sharing a heading, split where a run is too long to read at once."""
    runs: list[dict] = []
    for index, section in enumerate(sections):
        key = section["partKey"]
        if runs and runs[-1]["label"] == key and runs[-1]["to"] - runs[-1]["from"] + 1 < MAX_PART_SECTIONS:
            runs[-1]["to"] = index
        else:
            runs.append({"label": key, "from": index, "to": index})

    # A flat list of questions produces one run per question, which is no use as a contents rail. Where
    # the document's own grouping does not actually group anything, fall back to ranges.
    if len(sections) > 40 and len(sections) / max(len(runs), 1) < 2:
        runs = chunk_parts(sections)

    # Where one heading had to be split for length, say it continues rather than repeating the label.
    counts: dict[str, int] = {}
    for run in runs:
        counts[run["label"]] = counts.get(run["label"], 0) + 1
    seen: dict[str, int] = {}
    for position, run in enumerate(runs):
        label = run["label"]
        run["id"] = f"p{position + 1}"
        if counts[label] > 1:
            seen[label] = seen.get(label, 0) + 1
            if seen[label] > 1:
                run["label"] = f"{label}, continued ({seen[label] - 1})"
        run["sections"] = run["to"] - run["from"] + 1
    return runs


def build_bundles(parts: list[dict], sections: list[dict]) -> list[dict]:
    """Group whole parts into files under BUNDLE_BUDGET, so one part never costs a whole book."""
    bundles: list[dict] = []
    for part in parts:
        weight = sum(len(json.dumps(section, ensure_ascii=False)) for section in sections[part["from"]:part["to"] + 1])
        if bundles and bundles[-1]["weight"] + weight <= BUNDLE_BUDGET:
            bundles[-1]["to"] = part["to"]
            bundles[-1]["weight"] += weight
        else:
            bundles.append({"from": part["from"], "to": part["to"], "weight": weight})
        part["bundle"] = f"b{len(bundles)}"
    for position, bundle in enumerate(bundles):
        bundle["id"] = f"b{position + 1}"
        del bundle["weight"]
    return bundles


def build_document(path: Path, bsb: Bsb) -> dict:
    raw = json.loads(path.read_text("utf-8"))
    sections: list[dict] = []
    verse_table: dict[str, str] = {}
    quotations = references = reference_only = unrestated_total = 0

    for source_section in raw.get("sections") or []:
        question, text, restated = section_text(source_section)
        flags = source_section.get("review_flags") or []

        # Which references this section's own quotation was left in older wording for, and why.
        unrestated: list[dict] = []
        unavailable: set[str] = set()
        seen_unrestated: set[tuple[str, str]] = set()
        for flag in flags:
            reason = flag.get("reason")
            if reason in UNAVAILABLE_REASONS and flag.get("reference_osis"):
                unavailable.add(str(flag["reference_osis"]))
            code = UNRESTATED_REASONS.get(str(reason))
            if not code:
                continue
            reference = flag.get("reference_display") or ""
            if (reference, code) in seen_unrestated:
                continue  # the same reference flagged twice in one answer reads as one note
            seen_unrestated.add((reference, code))
            unrestated.append({"reference": reference, "reason": code})
        unrestated_total += len(unrestated)

        restated_refs: list[str] = []
        for sub in source_section.get("quote_substitutions") or []:
            quotations += 1
            reference = sub.get("reference_display") or ""
            if reference and reference not in restated_refs:
                restated_refs.append(reference)

        # The proof-texts, grouped by the marker the document prints them against.
        markers: dict[str, dict] = {}
        for ref in source_section.get("scripture_references") or []:
            references += 1
            label = reference_label(ref)
            osis = str(ref.get("osis") or "")
            resolved = reference_span(ref)
            entry: dict = {"reference": label, "osis": osis}
            if resolved is None:
                entry["note"] = "the Berean Standard Bible carries no Apocrypha"
                reference_only += 1
            elif osis in unavailable:
                code, _first, _last, span = resolved
                entry["span"] = span
                entry["note"] = "no matching verse in the Berean Standard Bible"
                reference_only += 1
            else:
                code, first, last, span = resolved
                verses, cut = bsb.verses(code, first, last)
                entry["span"] = span
                if verses:
                    # The words go into the document's own verse table, so a verse cited twenty times
                    # is stored once; the reference keeps only its verse ids.
                    entry["verses"] = [verse["id"] for verse in verses]
                    for verse in verses:
                        verse_table.setdefault(str(verse["id"]), verse["text"])
                    if cut:
                        entry["more"] = True
                else:
                    entry["note"] = "no matching verse in the Berean Standard Bible"
                    reference_only += 1
            key = str(ref.get("marker") or "")
            markers.setdefault(key, {"marker": key, "references": []})["references"].append(entry)

        parallel = {
            LANGUAGE_NAMES.get(language, language.title()): body
            for language, body in (source_section.get("parallel_texts") or {}).items()
            if body
        }

        section: dict = {
            "id": str(source_section.get("id")),
            "kind": source_section.get("kind"),
            "number": source_section.get("number"),
            "depth": len(source_section.get("path") or []),
            "partKey": part_key(source_section, sections[-1]["partKey"] if sections else None),
        }
        if source_section.get("heading"):
            section["heading"] = source_section["heading"]
        if question:
            section["question"] = question
        if text:
            section["text"] = text
        if restated:
            section["restated"] = restated_refs
        if unrestated:
            section["unrestated"] = unrestated
        if markers:
            section["proofs"] = [markers[key] for key in sorted(markers, key=lambda k: (len(k), k))]
        if parallel:
            section["parallel"] = parallel
        if source_section.get("reference_display"):
            section["passageReference"] = source_section["reference_display"]
        sections.append(section)

    parts = build_parts(sections)
    for section in sections:
        del section["partKey"]
    bundles = build_bundles(parts, sections)

    source = raw.get("source") or {}
    document = {
        "schema": SCHEMA,
        "id": raw["id"],
        "title": raw["title"],
        "year": year_value(raw),
        "yearLabel": year_label(raw),
        "tradition": raw.get("tradition") or None,
        "documentType": raw.get("document_type"),
        "counts": {
            "sections": len(sections),
            "references": references,
            "quotations": quotations,
            "unrestated": unrestated_total,
            "referenceOnly": reference_only,
        },
        "source": {
            "title": source.get("title"),
            "publisher": source.get("publisher"),
            "url": source.get("url"),
            "licence": source.get("licence"),
            "attribution": source.get("attribution"),
            "retrieved": source.get("retrieved"),
        },
        "scripture": raw.get("scripture_translation") or {},
        "parts": parts,
        "bundles": [{"id": bundle["id"], "from": bundle["from"], "to": bundle["to"]} for bundle in bundles],
    }
    document["_bundles"] = bundles
    document["_sections"] = sections
    document["_verses"] = verse_table
    for key, field in (
        ("alternativeTitles", "alternative_titles"),
        ("authors", "authors"),
        ("location", "location"),
        ("originalLanguage", "original_language"),
        ("originStory", "origin_story"),
        ("note", "note"),
        ("modernLayerOnly", "modern_layer_only"),
    ):
        if raw.get(field):
            document[key] = raw[field]
    if raw["id"] in SIBLINGS:
        document["otherEdition"] = SIBLINGS[raw["id"]]
    return document


def build() -> tuple[dict, list[dict]]:
    if not LAYER.is_dir():
        raise SystemExit(f"build-creeds: the modern Scripture layer is missing at {LAYER}.")
    layer_index = json.loads((LAYER / "index.json").read_text("utf-8"))
    manifest = json.loads((CORPUS / "manifest.json").read_text("utf-8"))
    bsb = Bsb.load()

    documents = [build_document(path, bsb) for path in sorted((LAYER / "creeds").glob("*.json"))]
    by_id = {document["id"]: document for document in documents}

    missing = sorted(set(by_id) - set(FAMILY_OF))
    if missing:
        raise SystemExit(f"build-creeds: these documents have no family: {', '.join(missing)}")
    stale = sorted(set(FAMILY_OF) - set(by_id))
    if stale:
        raise SystemExit(f"build-creeds: these families name documents that are gone: {', '.join(stale)}")

    def sort_key(document: dict) -> tuple:
        year = document.get("year")
        return (year if isinstance(year, int) else 9999, document["title"])

    families = []
    for family in FAMILIES:
        members = sorted((d for d in documents if FAMILY_OF[d["id"]] == family["id"]), key=sort_key)
        if not members:
            raise SystemExit(f"build-creeds: family {family['id']} has no documents.")
        cards = []
        for d in members:
            card = {
                "id": d["id"],
                "title": d["title"],
                "year": d.get("year"),
                "yearLabel": d["yearLabel"],
                "tradition": d.get("tradition"),
                "documentType": d.get("documentType"),
                "sections": d["counts"]["sections"],
                "references": d["counts"]["references"],
                "quotations": d["counts"]["quotations"],
                "publisher": (d.get("source") or {}).get("publisher"),
            }
            if d.get("otherEdition"):
                card["otherEdition"] = d["otherEdition"]
            cards.append(card)
        families.append({
            **family,
            "span": f"{members[0]['yearLabel']} – {members[-1]['yearLabel']}",
            "documents": cards,
        })

    index = {
        "schema": SCHEMA,
        "built": layer_index.get("generated"),
        "scripture": {
            key: layer_index.get("scripture_translation", {}).get(key)
            for key in ("title", "abbreviation", "licence", "home", "distribution")
        },
        "counts": {
            "documents": len(documents),
            "families": len(families),
            "sections": sum(d["counts"]["sections"] for d in documents),
            "references": sum(d["counts"]["references"] for d in documents),
            "quotations": sum(d["counts"]["quotations"] for d in documents),
            "unrestated": sum(d["counts"]["unrestated"] for d in documents),
            "referenceOnly": sum(d["counts"]["referenceOnly"] for d in documents),
            "catechisms": sum(1 for d in documents if d.get("documentType") == "catechism"),
        },
        "sources": [
            {
                "slug": source["slug"],
                "title": source["title"],
                "publisher": source["publisher"],
                "url": source["url"],
                "licence": source["licence"],
                "attribution": source["attribution"],
            }
            for source in manifest.get("sources") or []
        ],
        "families": families,
    }
    return index, documents


def write(index: dict, documents: list[dict]) -> list[Path]:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "doc").mkdir(parents=True, exist_ok=True)
    written = []
    for document in documents:
        bundles = document.pop("_bundles")
        sections = document.pop("_sections")
        verses = document.pop("_verses")
        for bundle in bundles:
            slice_ = sections[bundle["from"]:bundle["to"] + 1]
            used = {str(verse_id): verses[str(verse_id)]
                    for section in slice_
                    for proof in section.get("proofs") or []
                    for reference in proof["references"]
                    for verse_id in reference.get("verses") or []}
            path = OUT / "doc" / f"{document['id']}.{bundle['id']}.json"
            payload = {"id": document["id"], "bundle": bundle["id"], "sections": slice_, "verses": used}
            path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
            written.append(path)
        path = OUT / "doc" / f"{document['id']}.json"
        path.write_text(json.dumps(document, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
        written.append(path)
    path = OUT / "index.json"
    path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", "utf-8")
    written.append(path)
    return written


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if the written data is missing or stale")
    arguments = parser.parse_args()

    index, documents = build()
    if arguments.check:
        problems = []
        if not (OUT / "index.json").is_file():
            problems.append("data/creeds/index.json is missing")
        else:
            existing = json.loads((OUT / "index.json").read_text("utf-8"))
            if existing.get("counts") != index["counts"]:
                problems.append("data/creeds/index.json is stale")
        for document in documents:
            if not (OUT / "doc" / f"{document['id']}.json").is_file():
                problems.append(f"data/creeds/doc/{document['id']}.json is missing")
        if problems:
            print("\n".join(f"build-creeds: {problem}" for problem in problems), file=sys.stderr)
            return 1
        print(f"build-creeds: {len(documents)} documents up to date.")
        return 0

    written = write(index, documents)
    total = sum(path.stat().st_size for path in written)
    counts = index["counts"]
    print(
        f"build-creeds: {counts['documents']} documents, {counts['families']} families, "
        f"{counts['sections']:,} sections, {counts['references']:,} proof-text references, "
        f"{counts['quotations']:,} quotations in the Berean text, "
        f"{counts['referenceOnly']:,} references shown without verse words "
        f"({total / 1_048_576:.1f} MB in {len(written)} files)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
