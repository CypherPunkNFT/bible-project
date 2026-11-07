#!/usr/bin/env python3
"""Build data.js for the Rulers and their choices mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/rulers-and-their-choices-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their reference; every reference
resolves with no gap; each quoted phrase is in a reference beside it, one paragraph of its named held source, or the named confession list; each ruler's
name and stated length are in the reign verse; each verdict sits between the ruler's own account opening and the next ruler's; each shape follows the
verdict's words; a scan of Kings for verdict wording finds nothing that is neither on a ruler's record nor on a named list; each thread's words name its
man; a phrase said to be told by one account is not in the other; no verse of Esther holds God or Lord (with a control proving the test can see them);
the page's counts are computed and written in by this script. All this proves the words are there and unaltered. It does not prove that a later verse is
about that ruler, that two verses tell one event, or that a reading is right.
"""
import hashlib
import json
import os
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEBSITE = HERE.parents[1]
LIBRARY = WEBSITE.parent / "sources/library"
CONTENT = WEBSITE / "content/studies/people-of-scripture/rulers-and-their-choices/content.md"
PEOPLE = WEBSITE / "data/study/people"
BULK = LIBRARY / "bulk/ccel"
HELD = {"jfb": BULK / "jamieson_jfb.xml", "mhcc": BULK / "henry_mhcc.xml"}
ANCHOR_WINDOW = 6000
MIN_SOURCE_QUOTE_WORDS = 3
EXPECTED_JS = {"theme.js", "art.js", "rc-core.js", "rc-hero.js", "rc-measure.js", "rc-readings.js", "rc-threads.js", "rc-letters.js", "rc-questions.js", "rc.js"}
EXPECTED_QUESTIONS = 6
EXPECTED_RULERS = {"israel": 19, "judah": 20}
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
from scripture_text import (BOOKS, BSB, CANON, REF_RE, BuildError, fold, has_words, held_paragraphs, load_bible, plain_text, ref_id, typographic, verses_of)  # noqa: E402
from study_lists import (ESTHER_TURN, FORMS, ISRAEL, ISRAEL_END, JUDAH, JUDAH_END, LETTER_ROWS, LETTERS, QUOTED_CONFESSION, READING_ORDER, RELATED, SCAN_OTHERS, SOURCE_ANCHORS, SOURCES, THREAD_BOOKS, THREAD_ORDER, THREADS)  # noqa: E402

SOURCE_IDS = {source["id"] for source in SOURCES}
SCAN = re.compile(r"\b(?:did|doing|done|do) (?:great )?evil\b|(?:did|done|doing|do) what was (?:right|good)|\b[Ii]n (?:My|His) sight|(?:sight|eyes) of the LORD|\bhigh places\b")
GOD_WORDS = re.compile(r"\b(?:LORD|Lord|God)\b")
NUMBERS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "sixteen": 16, "seventeen": 17, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50}
WORDS = {value: key for key, value in NUMBERS.items()} | {13: "thirteen", 14: "fourteen", 15: "fifteen", 18: "eighteen", 19: "nineteen", 39: "thirty-nine"}
SHORT_YEARS = 2  # a reign under this is drawn at this length, dashed, so that it can be seen


def has_phrase(phrase: str, text: str) -> bool:
    """A quotation may change the case of its first letter to start or continue a sentence. Nothing else may differ."""
    return has_words(phrase, text) or has_words(phrase[0].swapcase() + phrase[1:], text)


def clean(text: str) -> str:
    return fold(text).replace('"', "")


class Builder:
    def __init__(self, bible: dict) -> None:
        self.bible = bible
        self.passages = {}
        self.held = {key: held_paragraphs(path, None, None) for key, path in HELD.items()}
        self.whole = {key: re.sub(r"\s+", " ", " ".join(paragraphs)) for key, paragraphs in self.held.items()}
        self.used_confession = set()
        self.counts = {}

    def passage(self, label: str) -> str:
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}), "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]}
        return identity

    def fill(self, text: str) -> str:
        """Counts in the study's text are named, never typed, so they cannot drift from the lists."""
        def one(match: re.Match) -> str:
            if match.group(1) not in self.counts:
                raise BuildError(f"content.md names a count this build does not compute: {match.group(1)}")
            return str(self.counts[match.group(1)])
        return re.sub(r"\{\{(\w+)\}\}", one, text)

    def runs(self, text: str, source: str | None = None) -> list:
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase against the citation beside it."""
        text = self.fill(text)
        if "“" in text or "”" in text:
            raise BuildError(f"curly double quote in prose would slip past the quotation checks: {text[:90]}")
        references = list(REF_RE.finditer(text))
        for match in references:
            self.passage(match.group(0))
        if re.search(r"\b\d+:\d+", REF_RE.sub("", text)):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        if text.count('"') % 2:
            raise BuildError(f"unbalanced quotation marks in prose: {text[:90]}")
        for quoted in re.finditer(r'"([^"]+)"', text):
            self.check_quoted(quoted.group(1), self.nearest(references, quoted), source, text)
        text = typographic(text)
        out, last = [], 0
        for match in REF_RE.finditer(text):
            if match.start() > last:
                out.append(text[last:match.start()])
            out.append({"r": self.passage(match.group(0)), "t": match.group(0)})
            last = match.end()
        if last < len(text):
            out.append(text[last:])
        return out

    @staticmethod
    def nearest(references: list, quoted: re.Match) -> list:
        """The reference a quotation names is the next one after it, or failing that the one before. A further reference proves nothing."""
        following = next((m for m in references if m.start() >= quoted.end()), None)
        preceding = next((m for m in reversed(references) if m.end() <= quoted.start()), None)
        return [m.group(0) for m in (following, preceding) if m]

    def check_quoted(self, phrase: str, references: list, source: str | None, context: str) -> None:
        folded = fold(phrase)
        if any(has_phrase(folded, clean(plain_text(self.bible, reference))) for reference in references):
            return
        if phrase in QUOTED_CONFESSION:
            self.used_confession.add(phrase)
            return
        if source and source in self.held:
            if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
                raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
            if not any(has_phrase(folded, re.sub(r"\s+", " ", paragraph)) for paragraph in self.held[source]):
                raise BuildError(f"quote not found in one paragraph of {source}: {phrase!r}")
            self.check_anchor(source, phrase, folded)
            return
        raise BuildError(f"quoted phrase is not in {references!r} and has no other source: {phrase!r}, in: {context[:90]}")

    def check_anchor(self, source: str, phrase: str, folded: str) -> None:
        anchor = SOURCE_ANCHORS.get(phrase)
        if not anchor:
            raise BuildError(f"commentary quote has no anchor to its own verse's note: {phrase!r}")
        text = self.whole[source]
        places = [match.start() for match in re.finditer(re.escape(folded), text)]
        if len(places) != 1:
            raise BuildError(f"{source} quote must occur once in the file, found {len(places)}: {phrase!r}")
        if fold(anchor) not in text[max(0, places[0] - ANCHOR_WINDOW):places[0]]:
            raise BuildError(f"{source} quote is not in the note it is cited to ({anchor}): {phrase!r}")

    def phrase(self, pair: tuple) -> dict:
        """A phrase in one verse, whole words. Returns what the page shows."""
        label, words = pair
        _, verses = verses_of(self.bible, label)
        if len(verses) != 1:
            raise BuildError(f"a phrase must name one verse: {label}")
        if not has_phrase(clean(words), clean(verses[0][2])):
            raise BuildError(f"phrase not found, as whole words, in {label}: {words!r}")
        return {"r": self.passage(label), "label": label, "t": typographic(words)}

    def voiced(self, item: tuple) -> dict:
        voice, label, words = item
        return {"voice": typographic(voice), **self.phrase((label, words))}


def tagged_block(builder: Builder, line: str) -> dict:
    tag = re.match(r"\[([a-z]+)(?::([a-z0-9-]+))?\] (.+)", line)
    if not tag:
        raise BuildError(f"bad paragraph tag: {line[:50]}")
    kind, source, text = tag.groups()
    if kind in ("care", "read"):
        if source:
            raise BuildError(f"{kind} takes no source: {line[:60]}")
    elif kind != "source" or source not in builder.held or source not in SOURCE_IDS:
        raise BuildError(f"unknown tag or held source: {line[:60]}")
    return {"k": kind, "src": source, "runs": builder.runs(text, source)}


def block_quote(builder: Builder, lines: list, index: int, quote: str) -> tuple:
    ref_at = next((j for j in range(index, len(lines)) if lines[j].strip()), None)
    if ref_at is None:
        raise BuildError(f"block quote at the end of the file has no reference: {quote[:50]}")
    label, _, version = lines[ref_at].strip().partition(" · ")
    if version != "BSB":
        raise BuildError(f"block quote not followed by '<reference> · BSB': {quote[:50]}")
    if clean(quote) != clean(plain_text(builder.bible, label)):
        raise BuildError(f"block quote is not the whole Berean text of {label}: {quote[:60]}")
    return {"k": "quote", "t": typographic(quote), "r": builder.passage(label), "label": label}, ref_at + 1


KEYS = {
    "top": {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "MeasureLead": "measureLead", "MeasureReads": "measureReads", "MeasureCare": "measureCare", "ReadingsLead": "readingsLead",
            "ThreadsLead": "threadsLead", "ThreadsReads": "threadsReads", "ThreadsCare": "threadsCare", "SealLead": "sealLead", "SealReads": "sealReads", "SealCare": "sealCare", "QuestionsLead": "questionsLead"},
    "reading": {"Ask": "ask", "Hook": "hook"},
    "after": {"Consider": "consider", "Reflect": "reflect"},
    "close": {"Close": "close", "Way": "way", "Invite": "invite", "Question": "question", "Again": "again"},
}
STRAY_KEY = re.compile(r"[A-Z][\w']*(?: [\w']+){0,2}: ")


def heading(study: dict, line: str) -> tuple:
    """Open the section a level-two heading names. Returns (zone, the dict that receives its keys)."""
    numbered = re.fullmatch(r"## (\d\d) (.+)", line)
    question = re.fullmatch(r"## Question ([a-z]+): (.+)", line)
    closing = re.fullmatch(r"## Close: (.+)", line)
    if numbered:
        holder = {"n": numbered.group(1), "title": typographic(numbered.group(2)), "parts": []}
        study["readings"].append(holder)
        return "reading", holder
    if question:
        holder = {"id": question.group(1), "title": typographic(question.group(2)), "blocks": []}
        study["questions"].append(holder)
        return "question", holder
    if closing:
        study["closing"] = typographic(closing.group(1))
        return "close", study
    raise BuildError(f"heading not recognised: {line}")


def keyed(builder: Builder, zone: str, holder: dict, part: dict | None, line: str) -> None:
    key, sep, value = line.partition(": ")
    if zone == "reading" and sep and part is None and key == "Slug":
        holder["slug"] = value
    elif zone == "reading" and sep and part is None and key == "Read":
        holder["read"] = [{"r": builder.passage(item.strip()), "t": item.strip()} for item in value.split(";")]
    elif zone == "question" and sep and key == "Text":
        holder["text"] = builder.passage(value)
    elif zone == "close" and sep and key == "Passage":
        holder["passage"] = builder.passage(value)
    elif zone == "reading" and sep and key in KEYS["after"]:
        holder[KEYS["after"][key]] = builder.runs(value)
    elif zone != "question" and sep and part is None and key in KEYS[zone]:
        holder[KEYS[zone][key]] = builder.runs(value)
    elif part is not None and not STRAY_KEY.match(line):
        part["blocks"].append({"k": "p", "runs": builder.runs(line)})
    else:
        raise BuildError(f"line belongs to nothing, or uses a key this section does not allow: {line[:70]}")


def parse(builder: Builder, lines: list) -> dict:
    """content.md into the study. Every non-blank line must be consumed by a rule here, or the build fails."""
    study = {"readings": [], "questions": []}
    zone, holder, part, index = "top", study, None, 0
    while index < len(lines):
        line = lines[index].strip()
        index += 1
        if not line:
            continue
        if line.startswith("# "):
            study["title"] = typographic(line[2:])
        elif line.startswith("## "):
            zone, holder = heading(study, line)
            part = None
        elif line.startswith("### "):
            if zone != "reading":
                raise BuildError(f"part outside a reading: {line}")
            part = {"title": typographic(line[4:]), "blocks": []}
            holder["parts"].append(part)
        elif line.startswith("> "):
            block, index = block_quote(builder, lines, index, line[2:])
            if zone == "top":
                study["opening"] = block
            elif part is not None:
                part["blocks"].append(block)
            else:
                raise BuildError(f"block quote outside a part: {line[:60]}")
        elif line.startswith("["):
            target = holder["blocks"] if zone == "question" else (part["blocks"] if part is not None else None)
            if target is None:
                raise BuildError(f"tagged paragraph outside a part or question: {line[:60]}")
            target.append(tagged_block(builder, line))
        else:
            keyed(builder, zone, holder, part, line)
    return study


def position(bible: dict, label: str) -> tuple:
    code, verses = verses_of(bible, label)
    return (CANON.index(code), verses[0][0], verses[0][1])


def length_of(words: str) -> tuple:
    """A stated length as (value, unit). Accepts only what Kings says here, so a new wording fails rather than guesses."""
    match = re.fullmatch(r"(?P<n>[a-z-]+)(?: full)? (?P<unit>year|month|day)s?", words)
    if not match:
        raise BuildError(f"cannot read this stated length: {words!r}")
    total = 0
    for piece in match.group("n").split("-"):
        if piece not in NUMBERS:
            raise BuildError(f"cannot read the number in this stated length: {words!r}")
        total += NUMBERS[piece]
    return total, match.group("unit")


def shape_of(words: str | None, against: tuple | None) -> str:
    """The shape comes from the verdict's own words."""
    if words is None:
        return "none"
    if against:
        return "both"
    if re.search(r"did not do what was right|\bevil\b|\bsins\b", words):
        return "charge"
    if words.startswith("did what was right"):
        return "right"
    raise BuildError(f"this verdict's words fit no shape: {words!r}")


def build_ruler(builder: Builder, item: dict, kingdom: str, next_start: str, index: int) -> dict:
    book_name = "1 Kings" if item["reign"].startswith("1") else "2 Kings"
    if not item["reign"].startswith(book_name):
        raise BuildError(f"{item['id']}: reign reference not in Kings")
    reign_text = clean(plain_text(builder.bible, item["reign"]))
    named = item["name"].split(",")[0].split(" ")[0]
    if not has_words(named, reign_text):
        raise BuildError(f"{item['id']}: the reign reference {item['reign']} does not name {named}")
    if not has_words(item["length"], reign_text):
        raise BuildError(f"{item['id']}: {item['length']!r} is not in {item['reign']}")
    if not (PEOPLE / f"{item['person']}.json").is_file():
        raise BuildError(f"{item['id']}: no person page {item['person']}")
    value, unit = length_of(item["length"])
    years = {"year": value, "month": value / 12, "day": value / 365}[unit]
    shape = shape_of(item["words"], item.get("against"))
    out = {"id": item["id"], "name": typographic(item["name"]), "short": item["short"], "person": item["person"], "kingdom": kingdom, "at": index, "length": item["length"], "years": years, "short_reign": years < SHORT_YEARS, "shape": shape, "reign": builder.passage(item["reign"]), "reignLabel": item["reign"]}
    if item["verdict"]:
        out["verdict"] = builder.phrase((item["verdict"], item["words"]))
        start, here, end = position(builder.bible, item["starts"]), position(builder.bible, item["verdict"]), position(builder.bible, next_start)
        if not start <= here < end:
            raise BuildError(f"{item['id']}: verdict {item['verdict']} is outside the ruler's own account ({item['starts']} to {next_start})")
    for key in ("against", "note", "hight", "removed", "names"):
        if item.get(key):
            out[key] = builder.phrase(item[key])
    if item.get("thread"):
        relation, label, words = item["thread"]
        out["thread"] = {"rel": relation, **builder.phrase((label, words))}
    if item.get("said"):
        out["said"] = builder.runs(item["said"])
    return out


def build_rulers(builder: Builder, items: list, kingdom: str, end: str) -> list:
    if len(items) != EXPECTED_RULERS[kingdom]:
        raise BuildError(f"{kingdom} must have {EXPECTED_RULERS[kingdom]} rulers; the list has {len(items)}")
    previous = None
    out = []
    for index, item in enumerate(items):
        here = position(builder.bible, item["starts"])
        if previous and here <= previous:
            raise BuildError(f"{item['id']} is out of the order Kings tells them")
        previous = here
        out.append(build_ruler(builder, item, kingdom, items[index + 1]["starts"] if index + 1 < len(items) else end, index))
    return out


def check_threads(rulers: list) -> None:
    for ruler in rulers:
        thread = ruler.get("thread")
        if not thread:
            continue
        man = "David" if ruler["kingdom"] == "judah" else "Jeroboam"
        if man not in thread["t"] and "his father" not in thread["t"]:
            raise BuildError(f"{ruler['id']}: the thread's words do not name {man}: {thread['t']!r}")
        if ruler["kingdom"] == "israel" and ruler["id"] == "jeroboam":
            raise BuildError("Jeroboam son of Nebat cannot have a thread to himself")
        if ruler["kingdom"] == "israel" and "Jeroboam" not in thread["t"] and ruler["id"] != "nadab":
            raise BuildError(f"{ruler['id']}: only Nadab, Jeroboam's son, may be tied to him as his father")
        if thread["rel"] not in ("as", "not"):
            raise BuildError(f"{ruler['id']}: a thread is as or not")
        if thread["rel"] == "as" and re.search(r"\bnot\b|unlike", thread["t"]):
            raise BuildError(f"{ruler['id']}: the thread reads as a contrast and is marked as a likeness: {thread['t']!r}")
        if thread["rel"] == "not" and not re.search(r"\bnot\b|unlike", thread["t"]):
            raise BuildError(f"{ruler['id']}: the thread is marked as a contrast and does not read as one: {thread['t']!r}")


def check_scan(builder: Builder, rulers: list) -> None:
    """Every verse of Kings from the parting on with verdict wording is on a ruler's record, or named with a reason."""
    used = set()
    for item in [*ISRAEL, *JUDAH]:
        for key in ("verdict",):
            if item.get(key):
                used.add(item[key])
        for key in ("against", "note", "hight", "removed", "names", "thread"):
            if item.get(key):
                used.add(item[key][-2])
    found = set()
    for code, book, first in (("1KI", "1 Kings", (12, 1)), ("2KI", "2 Kings", (1, 1))):
        for key, text in builder.bible[code].items():
            chapter, verse = (int(n) for n in key.split(":"))
            if (chapter, verse) >= first and SCAN.search(fold(text)):
                found.add(f"{book} {key}")
    if "2 Kings 21:2" not in found:
        raise BuildError("the scan for verdict wording failed its control: it must find 2 Kings 21:2")
    unlisted = found - used - set(SCAN_OTHERS)
    if unlisted:
        raise BuildError(f"Kings has verdict wording on no ruler's record and no named list: {sorted(unlisted)}")
    stale = set(SCAN_OTHERS) - found
    if stale:
        raise BuildError(f"the named list holds verses the scan does not find: {sorted(stale)}")


def build_form(builder: Builder, slug: str) -> dict:
    form = FORMS[slug]
    out = {"name": form["name"], "kind": form["kind"], "ask": form["ask"]}
    for key in ("taken", "left", "under"):
        if key in form:
            out[key] = builder.voiced(form[key])
    for key in ("voices", "claims", "says", "paid", "after"):
        if key in form:
            out[key] = [builder.voiced(item) for item in form[key]]
    if "pairs" in form:
        out["pairs"] = [[builder.voiced(a), builder.voiced(b)] for a, b in form["pairs"]]
    for key in ("kings", "chronicles"):
        if key in form:
            out[key] = [builder.phrase(item) for item in form[key]]
    return out


def account_text(builder: Builder, books: tuple) -> str:
    joined = []
    for book in books:
        joined.extend(builder.bible[BOOKS[book]].values())
    return clean(" ".join(joined))


def build_threads(builder: Builder) -> list:
    if [thread["id"] for thread in THREADS] != THREAD_ORDER:
        raise BuildError("the threads must follow THREAD_ORDER")
    texts = {side: account_text(builder, books) for side, books in THREAD_BOOKS.items()}
    out = []
    for thread in THREADS:
        stops = []
        for stop in thread["stops"]:
            kind = stop["kind"]
            if kind == "both" and not ("first" in stop and "second" in stop):
                raise BuildError(f"{stop['what']}: a stop told by both needs both verses")
            for side, other in (("first", "second"), ("second", "first")):
                if side in stop and not stop[side][0].startswith(THREAD_BOOKS[side]):
                    raise BuildError(f"{stop[side][0]} is on the wrong thread")
                if kind == side:
                    if other in stop:
                        raise BuildError(f"{stop['what']}: told by one account, and gives both")
                    if has_phrase(clean(stop[side][1]), texts[other]):
                        raise BuildError(f"{stop['what']}: said to be told by one account, and its words are in the other too: {stop[side][1]!r}")
            stops.append({"kind": kind, "what": typographic(stop["what"]), **{side: builder.phrase(stop[side]) for side in ("first", "second") if side in stop}})
        out.append({"id": thread["id"], "name": thread["name"], "books": thread["books"], "stops": stops})
    return out


def build_letters(builder: Builder) -> dict:
    letters = []
    for letter in LETTERS:
        if len(letter["cells"]) != len(LETTER_ROWS):
            raise BuildError(f"{letter['id']} must have one cell for each of the {len(LETTER_ROWS)} rows")
        cells = []
        for index, cell in enumerate(letter["cells"]):
            if cell:
                cells.append(builder.phrase(cell))
            elif letter["missing"].get(index):
                cells.append({"none": typographic(letter["missing"][index])})
            else:
                raise BuildError(f"{letter['id']}: row {index} has neither a phrase nor a stated reason")
        letters.append({"id": letter["id"], "title": letter["title"], "read": {"r": builder.passage(letter["read"]), "t": letter["read"]}, "cells": cells})
    no_god = [key for key, text in builder.bible["EST"].items() if GOD_WORDS.search(text)]
    if no_god:
        raise BuildError(f"the page says Esther never names God, and these verses do: {no_god[:6]}")
    if not any(GOD_WORDS.search(text) for text in builder.bible["NEH"].values()):
        raise BuildError("the Esther check failed its control: it must find God in Nehemiah")
    return {"rows": LETTER_ROWS, "letters": letters, "turn": [builder.phrase(item) for item in ESTHER_TURN]}


def word_of(number: int) -> str:
    if number not in WORDS:
        raise BuildError(f"no written form for the count {number}")
    return WORDS[number]


def count(rulers: list) -> dict:
    israel = [r for r in rulers if r["kingdom"] == "israel"]
    judah = [r for r in rulers if r["kingdom"] == "judah"]
    tied = [r for r in israel if r.get("thread")]
    david = [r for r in judah if r.get("thread")]
    david_as = [r for r in david if r["thread"]["rel"] == "as"]
    right = [r for r in rulers if r["shape"] == "right"]
    noted = [r for r in right if r.get("hight")]
    longest = max(rulers, key=lambda r: r["years"])
    if longest["id"] != "manasseh":
        raise BuildError(f"the page says Manasseh's reign is the longest; the list says {longest['id']}")
    if any(r["shape"] == "right" and r["kingdom"] != "judah" for r in rulers):
        raise BuildError("the page says the rulers who did right are in Judah")
    if {r["id"] for r in rulers if r["shape"] == "none"} != {"shallum", "athaliah"}:
        raise BuildError("the page says Shallum and Athaliah are the two with no line of verdict")
    if {r["id"] for r in rulers if r["shape"] == "both"} != {"jehu"}:
        raise BuildError("the page says Jehu is the one where both are said")
    numbers = {"rulersCount": len(rulers), "israel": len(israel), "judah": len(judah), "tiedCount": len(tied), "afterCount": len(israel) - 1, "davidCount": len(david), "davidAsCount": len(david_as), "rightCount": len(right), "notedCount": len(noted),
               "plainCount": len(right) - len(noted), "chargeCount": sum(1 for r in rulers if r["shape"] == "charge"), "longYears": longest["years"], "shortCount": sum(1 for r in rulers if r["short_reign"])}
    return numbers


def check_code() -> None:
    """The only markup strings allowed are the fixed drawings. Missing page files, inline scripts or handlers fail the build."""
    found = {path.name for path in (HERE / "js").glob("*.js")}
    if found != EXPECTED_JS:
        raise BuildError(f"page files differ from the expected list: missing {sorted(EXPECTED_JS - found)}, extra {sorted(found - EXPECTED_JS)}")
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        for word in ("insertAdjacentHTML", "outerHTML", "document.write", "eval(", "new Function", "javascript:"):
            if word in text:
                raise BuildError(f"{path.name} uses {word}")
        allowed = 1 if path.name == "rc-core.js" else 0
        if text.count("innerHTML") > allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in rc-core.js may, once")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"<script(?![^>]*\bsrc=)", page) or re.search(r"\son[a-z]+=", page):
        raise BuildError("index.html has an inline script or handler")
    art_text = (HERE / "js/art.js").read_text(encoding="utf-8")
    if "${" in art_text:
        raise BuildError("art.js must hold fixed drawings only, with nothing filled in from data")


def check_complete(study: dict) -> None:
    required = {"slug", "ask", "hook", "read", "consider", "reflect"}
    for reading in study["readings"]:
        missing = required - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
    if [r["slug"] for r in study["readings"]] != READING_ORDER or set(FORMS) != set(READING_ORDER):
        raise BuildError("the readings and forms must follow READING_ORDER")
    for question in study["questions"]:
        if "text" not in question or not question["blocks"] or question["blocks"][0]["k"] != "read":
            raise BuildError(f"question {question['id']} must name its text and open with this study's reading")
    if len(study["questions"]) != EXPECTED_QUESTIONS:
        raise BuildError(f"the page says {EXPECTED_QUESTIONS} questions; found {len(study['questions'])}")
    for key in ("title", "opening", *KEYS["top"].values(), *KEYS["close"].values(), "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")


def check_no_typed_counts(text: str) -> None:
    """Counts of rulers in the top sections are named placeholders. A digit or stray count word in these lines would drift."""
    for line in text.split("\n"):
        if not line.startswith(("MeasureReads: ", "Close: ", "Selection: ")):
            continue
        stripped = REF_RE.sub("", re.sub(r"\{\{\w+\}\}", "", line))
        if re.search(r"\b\d+\b", stripped) or re.search(r"\b(?:fifteen|eighteen|nineteen|thirty-nine)\b", stripped):
            raise BuildError(f"a count is typed into this line, and must be named: {line[:70]}")


def fingerprints(content: bytes) -> dict:
    """Only this study's own inputs. A shared frame file edited by another job must not make this page read as stale."""
    paths = {HERE / "build-data.py", HERE / "study_lists.py", HERE / "scripture_text.py", *HELD.values(), *(BSB / f"{code}.json" for code in CANON)}
    out = {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}
    out[CONTENT.relative_to(WEBSITE.parent).as_posix()] = hashlib.sha256(content).hexdigest()
    return out


def build_payload() -> tuple:
    builder = Builder(load_bible())
    rulers = [*build_rulers(builder, ISRAEL, "israel", ISRAEL_END), *build_rulers(builder, JUDAH, "judah", JUDAH_END)]
    check_threads(rulers)
    check_scan(builder, rulers)
    numbers = count(rulers)
    builder.counts = {"rulers": word_of(numbers["rulersCount"]), "judah": word_of(numbers["judah"]), "tied": word_of(numbers["tiedCount"]), "afterJeroboam": word_of(numbers["afterCount"]), "david": word_of(numbers["davidCount"]), "davidAs": word_of(numbers["davidAsCount"]), "davidNot": word_of(numbers["davidCount"] - numbers["davidAsCount"]),
                      "longest": "fifty-five years", "drawnLong": word_of(numbers["shortCount"]), "right": word_of(numbers["rightCount"]), "rightNoted": word_of(numbers["notedCount"]), "rightPlain": word_of(numbers["plainCount"])}
    if numbers["longYears"] != 55:
        raise BuildError("the page writes Manasseh's reign as fifty-five years")
    raw = CONTENT.read_bytes()
    text = raw.decode("utf-8-sig").replace("\r\n", "\n")
    check_no_typed_counts(text)
    study = parse(builder, text.split("\n"))
    check_complete(study)
    check_code()
    for source in SOURCES:
        if not (source["href"].startswith("https://") or source["href"].startswith("/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}: {source['href']}")
    forms = {slug: build_form(builder, slug) for slug in READING_ORDER}
    threads, letters = build_threads(builder), build_letters(builder)
    if QUOTED_CONFESSION - builder.used_confession:
        raise BuildError(f"listed confession phrases are not used on the page: {sorted(QUOTED_CONFESSION - builder.used_confession)}")
    sources = [{**source, "name": typographic(source["name"]), "note": typographic(source["note"])} for source in SOURCES]
    data = {"schema": 1, "study": study, "rulers": rulers, "forms": forms, "threads": threads, "letters": letters, "related": [list(item) for item in RELATED],
            "passages": builder.passages, "sources": sources, "numbers": numbers, "builtFrom": fingerprints(raw)}
    payload = "window.RC = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, len(builder.passages)


def write_atomically(target: Path, payload: str) -> None:
    handle, name = tempfile.mkstemp(prefix="data.js.", suffix=".tmp", dir=target.parent)
    temporary = Path(name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(payload)
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    check_only = sys.argv[1:] == ["--check"]
    if sys.argv[1:] and not check_only:
        print(f"build-data: FAILED: expected no arguments or --check, received {sys.argv[1:]}", file=sys.stderr)
        return 2
    try:
        payload, numbers, passage_count = build_payload()
        target = HERE / "data.js"
        if check_only:
            current = target.read_text(encoding="utf-8") if target.exists() else None
            if current != payload:
                print(f"build-data: STALE: {target} does not match what its inputs build. Run build-data.py.", file=sys.stderr)
                return 1
        else:
            write_atomically(target, payload)
    except (BuildError, OSError, ValueError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    print(f"build-data: {'current' if check_only else 'ok'}. {numbers}; {passage_count} passages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
