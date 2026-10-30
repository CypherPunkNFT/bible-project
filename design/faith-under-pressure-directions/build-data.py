#!/usr/bin/env python3
"""Build data.js for the Faith under pressure mock-up from the study's content.md and the Berean text.

Run: python design/faith-under-pressure-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not exactly what its inputs build now. Writes nothing.

Checks: every line of content.md is consumed; block quotes equal the whole Berean text of their reference; every
Scripture reference resolves, with no gap in a range, and no chapter:verse is left unrecognised; each quoted phrase is
in one reference of its paragraph, or in one paragraph of its named source, or on a named list below; each mark is found
exactly once in its verse; each quoted pair shares wording inside the letter's quotation marks; every quotation mark
in a walked passage is a pair or a named exception. Counts on the page come from here.
"""
import hashlib
import html
import json
import os
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/faith-under-pressure/content.md"
BSB = WEBSITE / "data/plain/bsb"
LIBRARY = WEBSITE.parent / "sources/library"
CCEL = LIBRARY / "source-ccel"
FOUNDATION = WEBSITE.parent / "DOCTRINAL-FOUNDATION.md"
HELD = {
    "calvin-cor": CCEL / "asset-ready-text-edition-l06-calvin-39/calcom39.xml",
    "calvin-2cor": CCEL / "asset-ready-text-edition-l06-calvin-40/calcom40.xml",
    "calvin-php": CCEL / "asset-ready-text-edition-l06-calvin-42/calcom42.xml",
    "calvin-thess": CCEL / "asset-ready-text-edition-l06-calvin-42/calcom42.xml",
    "calvin-james": CCEL / "asset-ready-text-edition-l06-calvin-45/calcom45.xml",
    "calvin-peter": CCEL / "asset-ready-text-edition-l06-calvin-45/calcom45.xml",
    "maclaren-php": CCEL / "asset-sermons-maclaren-expositions-iicor-tim/original.xml",
}
BOOKS = {
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU", "Joshua": "JOS",
    "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Kings": "1KI", "2 Kings": "2KI",
    "1 Chronicles": "1CH", "2 Chronicles": "2CH", "Ezra": "EZR", "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB",
    "Psalm": "PSA", "Proverbs": "PRO", "Ecclesiastes": "ECC", "Song of Songs": "SNG", "Isaiah": "ISA", "Jeremiah": "JER",
    "Lamentations": "LAM", "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB", "Zephaniah": "ZEP",
    "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL", "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN",
    "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", "Galatians": "GAL",
    "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH",
    "1 Timothy": "1TI", "2 Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS",
    "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN", "3 John": "3JN", "Jude": "JUD", "Revelation": "REV",
}
SECTION = {"EXO": "history", "NUM": "history", "DEU": "history", "PSA": "poetry", "PRO": "poetry", "ISA": "prophets"}
SECTION_NAME = {"history": "History", "poetry": "Poetry & Wisdom", "prophets": "Prophets"}
REF_RE = re.compile(
    r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+):(\d+)(?:[–-](?:(\d+):)?(\d+))?"
)

# Quoted phrases from the confession. Those also in DOCTRINAL-FOUNDATION.md are checked there; the rest were consulted
# at bfm.sbc.net on 2026-10-30 through a tool that returns extracts, are not held, and are reported as unchecked.
QUOTED_CONFESSION = {
    "will never fall away from the state of grace",
    "cheerfully, regularly, systematically, proportionately, and liberally",
    "in His own time and in His own way",
}
MIN_SOURCE_QUOTE_WORDS = 3
SOURCE_TAGS = {"calvin-cor": "calvin-1cor", "calvin-2cor": "calvin-2cor", "calvin-php": "calvin-php-th",
               "calvin-thess": "calvin-php-th", "calvin-james": "calvin-jas-pe", "calvin-peter": "calvin-jas-pe",
               "maclaren-php": "maclaren"}

# What each passage says, hand-picked and sorted by this study. P = names the pressure, C = gives the call, G = states the ground.
MARKS = [
    ("James 1:2", "trials of many kinds", "P"), ("James 1:4", "Allow perseverance to finish its work", "C"),
    ("James 1:5", "he should ask God", "C"), ("James 1:5", "who gives generously to all without finding fault", "G"),
    ("Romans 5:1", "we have peace with God", "G"), ("Romans 5:3", "our sufferings", "P"),
    ("Romans 5:5", "God has poured out His love into our hearts", "G"),
    ("James 1:12", "the crown of life that God has promised", "G"), ("James 1:14", "by his own evil desires he is lured away and enticed", "P"),
    ("James 1:16", "Do not be deceived", "C"), ("James 1:17", "Every good and perfect gift is from above", "G"),
    ("1 Corinthians 10:6", "craving evil things", "P"), ("1 Corinthians 10:7", "Do not be idolaters", "C"),
    ("1 Corinthians 10:12", "should be careful not to fall", "C"), ("1 Corinthians 10:13", "No temptation has seized you", "P"),
    ("1 Corinthians 10:13", "God is faithful", "G"), ("1 Corinthians 10:13", "He will also provide an escape", "G"),
    ("1 Corinthians 10:14", "flee from idolatry", "C"),
    ("Philippians 4:5", "The Lord is near", "G"), ("Philippians 4:6", "Be anxious for nothing", "P"),
    ("Philippians 4:6", "present your requests to God", "C"), ("Philippians 4:7", "the peace of God", "G"),
    ("Philippians 4:8", "think on these things", "C"), ("Philippians 4:9", "put it into practice", "C"),
    ("Philippians 4:9", "the God of peace will be with you", "G"),
    ("1 Peter 5:6", "Humble yourselves", "C"), ("1 Peter 5:7", "your anxiety", "P"), ("1 Peter 5:7", "Cast all your anxiety on Him", "C"),
    ("1 Peter 5:7", "He cares for you", "G"), ("1 Peter 5:8", "Be sober-minded and alert", "C"),
    ("1 Peter 5:8", "Your adversary the devil prowls", "P"), ("1 Peter 5:9", "Resist him", "C"), ("1 Peter 5:10", "the God of all grace", "G"),
    ("1 Peter 3:14", "suffer for what is right", "P"), ("1 Peter 3:14", "you are blessed", "G"),
    ("1 Peter 3:15", "respond with gentleness and respect", "C"), ("1 Peter 3:16", "keeping a clear conscience", "C"),
    ("1 Peter 3:16", "those who slander you", "P"), ("1 Peter 4:12", "the fiery trial", "P"),
    ("1 Peter 4:13", "the revelation of His glory", "G"), ("1 Peter 4:14", "insulted for the name of Christ", "P"),
    ("1 Peter 4:14", "the Spirit of glory and of God rests on you", "G"), ("1 Peter 4:15", "none of you should suffer as a murderer", "C"),
    ("1 Peter 4:19", "entrust their souls", "C"), ("1 Peter 4:19", "their faithful Creator", "G"), ("1 Peter 4:19", "continue to do good", "C"),
    ("1 Thessalonians 4:13", "those who sleep in death", "P"), ("1 Thessalonians 4:14", "Jesus died and rose again", "G"),
    ("1 Thessalonians 4:16", "the dead in Christ will be the first to rise", "G"), ("1 Thessalonians 4:17", "we will always be with the Lord", "G"),
    ("1 Thessalonians 4:18", "encourage one another with these words", "C"),
    ("Philippians 4:11", "learned to be content", "C"), ("Philippians 4:12", "being hungry", "P"), ("Philippians 4:12", "having need", "P"),
    ("Philippians 4:13", "through Christ who gives me strength", "G"), ("Philippians 4:14", "share in my affliction", "C"),
    ("Philippians 4:19", "my God will supply all your needs", "G"),
    ("Hebrews 13:5", "the love of money", "P"), ("Hebrews 13:5", "be content with what you have", "C"),
    ("Hebrews 13:5", "Never will I leave you", "G"), ("Hebrews 13:6", "The Lord is my helper", "G"),
]
# Each pressure's own call in one word from its passage: (place, reference, word).
CALLS = [("trials", "James 1:5", "ask"), ("temptation", "1 Corinthians 10:14", "flee"), ("anxiety", "Philippians 4:6", "present"),
         ("opposition", "1 Peter 3:15", "respond"), ("grief", "1 Thessalonians 4:18", "encourage"), ("contentment", "Hebrews 13:5", "be content")]
# Older passage, the letter verse, how it is used. loose = no run of three shared words: the Greek translation differs from the Hebrew.
PAIRS = [
    ("Exodus 32:6", "1 Corinthians 10:7", "quoted", False), ("Isaiah 8:12", "1 Peter 3:14", "quoted", False),
    ("Proverbs 11:31", "1 Peter 4:18", "quoted", False), ("Deuteronomy 31:6", "Hebrews 13:5", "quoted", True),
    ("Psalm 118:6", "Hebrews 13:6", "quoted", False),
    ("Exodus 13:21", "1 Corinthians 10:1", "retold", True), ("Exodus 14:22", "1 Corinthians 10:1", "retold", True),
    ("Exodus 16:15", "1 Corinthians 10:3", "retold", True), ("Exodus 17:6", "1 Corinthians 10:4", "retold", True),
    ("Numbers 14:29", "1 Corinthians 10:5", "retold", True), ("Numbers 25:9", "1 Corinthians 10:8", "retold", True),
    ("Numbers 21:6", "1 Corinthians 10:9", "retold", True), ("Numbers 14:2", "1 Corinthians 10:10", "retold", True),
]
# Verses in the walked passages with quotation marks that are speech, not an Old Testament quotation.
QUOTE_MARK_EXCEPTIONS = {"James 1:13"}
STOP_WORDS = {"the", "a", "an", "and", "of", "to", "in", "on", "not", "do", "is", "be", "you", "i", "will", "my", "me",
              "at", "for", "it", "they", "their", "what", "who", "that", "with", "if", "up", "got", "sat", "down"}

SOURCES = [
    {"id": "bsb", "name": "The Holy Bible, Berean Standard Bible", "note": "Every verse quoted and opened on this page. Public domain, dedicated 2023. Courtesy credit: Berean Standard Bible, berean.bible. Read here from the site's own data/plain/bsb.", "href": "https://berean.bible"},
    {"id": "calvin-jas-pe", "name": "John Calvin, Commentaries on the Catholic Epistles, trans. John Owen", "note": "Read directly: parts of his comments on James 1:2, James 1:12–15 and 1 Peter 5:7 only. Reformed, not Baptist. Public domain.", "href": "https://ccel.org/ccel/calvin/calcom45.html"},
    {"id": "calvin-1cor", "name": "John Calvin, Commentary on Corinthians, vol. 1, trans. John Pringle", "note": "Read directly: parts of his comments on 1 Corinthians 10:8 and 10:13 only. Reformed, not Baptist. Public domain.", "href": "https://ccel.org/ccel/calvin/calcom39.html"},
    {"id": "calvin-2cor", "name": "John Calvin, Commentary on Corinthians, vol. 2, trans. John Pringle", "note": "Read directly: his comment on 2 Corinthians 1:8 only. Reformed, not Baptist. Public domain.", "href": "https://ccel.org/ccel/calvin/calcom40.html"},
    {"id": "calvin-php-th", "name": "John Calvin, Commentaries on Philippians, Colossians and Thessalonians, trans. John Pringle", "note": "Read directly: parts of his comments on Philippians 4:10–14 and 1 Thessalonians 4:13–17 only. Reformed, not Baptist. Public domain.", "href": "https://ccel.org/ccel/calvin/calcom42.html"},
    {"id": "maclaren", "name": "Alexander Maclaren, Expositions of Holy Scripture, on Philippians 4:10–14", "note": "Read directly: parts of this exposition only. A Baptist preacher. Public domain.", "href": "https://ccel.org/ccel/maclaren"},
    {"id": "bfm", "name": "The Baptist Faith and Message 2000, Articles 1, 5, 10 and 13", "note": "Consulted at bfm.sbc.net on 2026-10-30 through a tool that returned extracts, and in the site's doctrinal foundation file: these articles only. Copyright Southern Baptist Convention, so short phrases only, with a link. A witness to what Baptists hold; Scripture remains the authority.", "href": "https://bfm.sbc.net/bfm2000/"},
    {"id": "criswell", "name": "W. A. Criswell, sermon “Am I Ready for the Rapture?”, 1983", "note": "Read directly: the opening and the start of his first two reasons, not the whole sermon. Rights are restricted, so it is reported in this site's words and not quoted.", "href": "https://wacriswell.com/sermons/1983/am-i-ready-for-the-rapture/"},
    {"id": "piper", "name": "John Piper, “Definitions and Observations Concerning the Second Coming of Christ”", "note": "Read directly: the opening, the definitions and his first three arguments for this view, not the whole paper. Rights are restricted, so it is reported in this site's words and not quoted.", "href": "https://www.desiringgod.org/articles/definitions-and-observations-concerning-the-second-coming-of-christ"},
]


class BuildError(Exception):
    pass


def fold(text):
    """Compare text regardless of curly or straight quotes and dash kind. One character in, one character out."""
    return text.translate(str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "}))


def has_words(phrase, text):
    return re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text) is not None


def load_bible():
    bible = {}
    for code in sorted(set(BOOKS.values())):
        path = BSB / f"{code}.json"
        try:
            bible[code] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise BuildError(f"could not read Berean book {code} at {path}: {error}") from error
    return bible


def held_text(path):
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read held source {path}: {error}") from error
    raw = re.sub(r"<note.*?</note>", "", raw, flags=re.S)
    pieces = re.split(r"</?(?:p|div\d?|h\d)\b[^>]*>", raw)
    return [fold(re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", piece)))) for piece in pieces]


def verses_of(bible, label):
    """Every (chapter, verse, text) in a reference. Fails if a verse is missing or the range has a gap."""
    match = REF_RE.fullmatch(label)
    if not match:
        raise BuildError(f"not a whole Scripture reference: {label!r}")
    name, c1, v1, c2, v2 = match.groups()
    code = BOOKS[name]
    c1, v1 = int(c1), int(v1)
    c2, v2 = int(c2) if c2 else c1, int(v2) if v2 else v1
    if (c2, v2) < (c1, v1):
        raise BuildError(f"reference runs backwards: {label}")
    keys = sorted(tuple(map(int, key.split(":"))) for key in bible[code])
    found = [(c, v, bible[code][f"{c}:{v}"]) for c, v in keys if (c1, v1) <= (c, v) <= (c2, v2)]
    if not found or found[0][:2] != (c1, v1) or found[-1][:2] != (c2, v2):
        raise BuildError(f"reference does not resolve in the Berean: {label}")
    for (c_a, v_a, _), (c_b, v_b, _) in zip(found, found[1:]):
        if not ((c_a == c_b and v_b == v_a + 1) or (c_b == c_a + 1 and v_b == 1)):
            raise BuildError(f"gap in {label} between {c_a}:{v_a} and {c_b}:{v_b}")
    return code, found


def ref_id(label):
    name, c1, v1, c2, v2 = REF_RE.fullmatch(label).groups()
    end = f"-{c2}.{v2}" if c2 else (f"-{v2}" if v2 else "")
    return f"{BOOKS[name]}.{c1}.{v1}{end}"


class Builder:
    def __init__(self, bible, foundation):
        self.bible = bible
        self.passages = {}
        self.foundation = foundation
        self.held = {key: held_text(path) for key, path in HELD.items()}
        self.web_quotes = set()

    def passage(self, label):
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {
                "label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}),
                "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses],
            }
        return identity

    def runs(self, text, source=None):
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase."""
        labels = [m.group(0) for m in REF_RE.finditer(text)]
        ids = [self.passage(label) for label in labels]
        leftover = REF_RE.sub("", text)
        if re.search(r"\d+:\d+", leftover):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        if re.search(r"[“”]", text) or text.count('"') % 2:
            raise BuildError(f"curly or unbalanced quotation marks in prose: {text[:90]}")
        pools = [" ".join(fold(v["t"]) for v in self.passages[i]["verses"]).replace('"', "") for i in ids]
        for phrase in re.findall(r'"([^"]+)"', text):
            self.check_quoted(phrase, pools, source, text)
        out, last = [], 0
        for match, identity in zip(REF_RE.finditer(text), ids):
            if match.start() > last:
                out.append(text[last:match.start()])
            out.append({"r": identity, "t": match.group(0)})
            last = match.end()
        if last < len(text):
            out.append(text[last:])
        return out

    def check_quoted(self, phrase, pools, source, context):
        folded = fold(phrase)
        if any(has_words(folded, pool) for pool in pools):
            return
        if source:
            if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
                raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words, too short to tie to it: {phrase!r}")
            if not any(has_words(folded, paragraph) for paragraph in self.held[source]):
                raise BuildError(f"quote not found in one paragraph of its named source {source}: {phrase!r}")
            return
        if phrase in QUOTED_CONFESSION:
            if not has_words(folded, self.foundation):
                self.web_quotes.add(phrase)
            return
        raise BuildError(f"quoted phrase has no source: {phrase!r}, in: {context[:90]}")


def parse(builder, lines):
    """content.md into the study. Every non-blank line must be consumed by a rule here, or the build fails."""
    study = {"readings": []}
    reading = part = None
    keys_top = {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "Frame": "frame",
                "Way": "way", "Close": "close", "Question": "question", "Again": "again"}
    keys_reading = {"Hook": "hook", "Line": "line", "Setting": "setting", "Pressure": "pressure", "Call": "call",
                    "Ground": "ground", "Limit": "limit", "Look closely": "look", "Your response": "response"}
    index = 0
    while index < len(lines):
        line = lines[index].strip()
        index += 1
        if not line:
            continue
        if line.startswith("# "):
            study["title"] = line[2:]
        elif line.startswith("## "):
            heading = re.fullmatch(r"## (\d\d) (.+)", line)
            part = None
            if heading:
                reading = {"n": heading.group(1), "title": heading.group(2), "parts": []}
                study["readings"].append(reading)
            else:
                reading, study["closing"] = None, line[3:]
        elif line.startswith("### "):
            part = {"title": line[4:], "blocks": []}
            reading["parts"].append(part)
        elif line.startswith("> "):
            quote = line[2:]
            ref_at = next(j for j in range(index, len(lines)) if lines[j].strip())
            label, _, version = lines[ref_at].strip().partition(" · ")
            if version != "BSB":
                raise BuildError(f"block quote not followed by '<reference> · BSB': {quote[:50]}")
            _, verses = verses_of(builder.bible, label)
            if fold(quote) != fold(" ".join(v[2] for v in verses)):
                raise BuildError(f"block quote is not the whole Berean text of {label}: {quote[:60]}")
            index = ref_at + 1
            block = {"k": "quote", "t": quote, "r": builder.passage(label), "label": label}
            if part is not None:
                part["blocks"].append(block)
            else:
                study["opening"] = block
        elif line.startswith("["):
            tag = re.match(r"\[([a-z0-9:-]+)\] (.+)", line)
            if not tag:
                raise BuildError(f"bad paragraph tag: {line[:50]}")
            kind, text = tag.groups()
            if kind.startswith("source:"):
                source = kind.split(":", 1)[1]
                if source not in SOURCE_TAGS:
                    raise BuildError(f"unknown source tag: {source}")
                block = {"k": "source", "src": SOURCE_TAGS[source], "runs": builder.runs(text, source)}
            elif kind in ("care", "other", "open"):
                block = {"k": kind, "runs": builder.runs(text)}
            else:
                raise BuildError(f"unknown paragraph kind: {kind}")
            part["blocks"].append(block)
        else:
            key, sep, value = line.partition(": ")
            if sep and key == "Slug" and reading is not None:
                reading["slug"] = value
            elif sep and key == "Read" and reading is not None:
                reading["read"] = [builder.passage(item.strip()) for item in value.split(";")]
            elif sep and key == "Passage" and reading is None:
                study["passage"] = builder.passage(value)
            elif sep and key in keys_reading and reading is not None:
                reading[keys_reading[key]] = builder.runs(value)
            elif sep and key in keys_top and reading is None:
                study[keys_top[key]] = builder.runs(value)
            elif part is not None:
                part["blocks"].append({"k": "p", "runs": builder.runs(line)})
            else:
                raise BuildError(f"line belongs to nothing: {line[:70]}")
    return study


def spans_of_marks(bible):
    """{(code, chapter, verse): [(start, end, kind)]}. Each phrase must occur exactly once in its verse."""
    spans = {}
    for label, phrase, kind in MARKS:
        code, verses = verses_of(bible, label)
        c, v, text = verses[0]
        hits = [m.start() for m in re.finditer(r"(?<!\w)" + re.escape(fold(phrase)) + r"(?!\w)", fold(text))]
        if len(hits) != 1:
            raise BuildError(f"mark must occur exactly once in {label}, found {len(hits)}: {phrase!r}")
        spans.setdefault((code, c, v), []).append((hits[0], hits[0] + len(phrase), kind))
    return spans


def segments(text, spans):
    """Cut a verse at every mark's edges; each piece carries the kinds covering it, so marks may overlap."""
    cuts = sorted({0, len(text)} | {edge for start, end, _ in spans for edge in (start, end)})
    out = []
    for start, end in zip(cuts, cuts[1:]):
        kinds = sorted({kind for s, e, kind in spans if s <= start and end <= e})
        out.append({"t": text[start:end], "k": kinds})
    return out


def build_strips(builder, study):
    """One strip per passage per reading; every verse is a cell, with its marks. Every mark must land in a walked verse."""
    spans = spans_of_marks(builder.bible)
    used = set()
    strips = []
    names = {code: name for name, code in BOOKS.items()}
    for reading in study["readings"]:
        for identity in reading["read"]:
            passage = builder.passages[identity]
            cells = []
            for verse in passage["verses"]:
                key = (passage["code"], verse["c"], verse["v"])
                here = spans.get(key, [])
                if here:
                    used.add(key)
                label = f"{names[passage['code']]} {verse['c']}:{verse['v']}"
                cells.append({"v": verse["v"], "label": label, "r": builder.passage(label),
                              "kinds": sorted({s[2] for s in here}), "segs": segments(verse["t"], here)})
            strips.append({"place": reading["slug"], "p": identity, "label": passage["label"], "cells": cells})
    stray = set(spans) - used
    if stray:
        raise BuildError(f"marks outside the walked passages: {sorted(stray)}")
    for reading in study["readings"]:
        kinds = {k for s in strips if s["place"] == reading["slug"] for c in s["cells"] for k in c["kinds"]}
        if kinds != {"P", "C", "G"}:
            raise BuildError(f"reading {reading['slug']} does not have all three kinds of mark: {sorted(kinds)}")
    return strips


def build_calls(builder):
    out = {}
    for place, label, word in CALLS:
        _, verses = verses_of(builder.bible, label)
        if not has_words(word, fold(verses[0][2])):
            raise BuildError(f"call word {word!r} is not in {label}")
        out[place] = {"word": word, "r": builder.passage(label), "label": label}
    return out


def build_pairs(builder):
    out = []
    tokens = lambda text: re.sub(r"[^a-z' ]", " ", fold(text).lower()).split()
    for older, letter, kind, loose in PAIRS:
        code, older_verses = verses_of(builder.bible, older)
        _, letter_verses = verses_of(builder.bible, letter)
        letter_text = letter_verses[0][2]
        inside = re.findall(r"“([^”]*)”", letter_text)
        if kind == "quoted" and not inside:
            raise BuildError(f"{letter} has no quotation mark in the Berean, so it cannot be shown as a quotation")
        if not loose:
            older_words = " " + " ".join(tokens(" ".join(v[2] for v in older_verses))) + " "
            words = tokens(" ".join(inside))
            runs = [words[i:i + 3] for i in range(len(words) - 2)]
            if not any(" " + " ".join(run) + " " in older_words and set(run) - STOP_WORDS for run in runs):
                raise BuildError(f"{older} and {letter} share no run of three words with a content word")
        section = SECTION[code]
        out.append({"id": f"pair-{len(out) + 1}", "kind": kind, "older": builder.passage(older), "olderLabel": older,
                    "letter": builder.passage(letter), "letterLabel": letter, "section": section,
                    "sectionName": SECTION_NAME[section]})
    return out


def check_every_quotation(builder, study, pairs):
    """Rule T3: every Old Testament quotation inside the walked passages must be shown."""
    shown = {p["letterLabel"] for p in pairs if p["kind"] == "quoted"} | QUOTE_MARK_EXCEPTIONS
    names = {code: name for name, code in BOOKS.items()}
    for reading in study["readings"]:
        for identity in reading["read"]:
            passage = builder.passages[identity]
            for verse in passage["verses"]:
                label = f"{names[passage['code']]} {verse['c']}:{verse['v']}"
                if "“" in verse["t"] and label not in shown:
                    raise BuildError(f"{label} has a quotation mark but is neither a quoted pair nor a named exception")


def figures(builder, study, strips, pairs):
    verses, books = set(), set()
    for reading in study["readings"]:
        count = set()
        for identity in reading["read"]:
            passage = builder.passages[identity]
            count |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
            books.add(passage["code"])
        reading["verseCount"] = len(count)
        verses |= count
    no_call = [s["label"] for s in strips if not any("C" in c["kinds"] for c in s["cells"])]
    if no_call != ["Romans 5:1–5"]:
        raise BuildError(f"the page says only Romans 5:1–5 has no call; the marks say {no_call}")
    kinds = [k for s in strips for c in s["cells"] for k in c["kinds"]]
    return {
        "pressures": len(study["readings"]), "verses": len(verses), "letters": len(books), "passages": len(strips),
        "marks": len(MARKS), "marked": sum(1 for s in strips for c in s["cells"] if c["kinds"]), "markKinds": len(kinds),
        "quoted": sum(p["kind"] == "quoted" for p in pairs), "retold": sum(p["kind"] == "retold" for p in pairs),
    }


def fingerprints(builder):
    """sha256 of every file this data.js was built from, so a stale data.js can be told from a current one."""
    paths = [CONTENT, FOUNDATION, *sorted(set(HELD.values())), *(BSB / f"{code}.json" for code in sorted({p["code"] for p in builder.passages.values()}))]
    return {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}


def build_payload():
    """Read and check everything. Returns (the text of data.js, the figures, phrases not checked here)."""
    foundation = fold(FOUNDATION.read_text(encoding="utf-8"))
    builder = Builder(load_bible(), foundation)
    study = parse(builder, CONTENT.read_text(encoding="utf-8").splitlines())
    for reading in study["readings"]:
        missing = {"slug", "hook", "line", "read", "setting", "pressure", "call", "ground", "limit", "look", "response"} - set(reading)
        if missing:
            raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
    strips = build_strips(builder, study)
    calls = build_calls(builder)
    pairs = build_pairs(builder)
    check_every_quotation(builder, study, pairs)
    numbers = figures(builder, study, strips, pairs)
    data = {"study": study, "passages": builder.passages, "strips": strips, "calls": calls, "pairs": pairs,
            "sources": SOURCES, "numbers": numbers, "builtFrom": fingerprints(builder)}
    payload = "window.FP = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, len(builder.passages), sorted(builder.web_quotes)


def write_atomically(target, payload):
    """Write beside the target under a name no other run shares, swap it in, and never leave the temporary file behind."""
    handle, name = tempfile.mkstemp(prefix="data.js.", suffix=".tmp", dir=target.parent)
    temporary = Path(name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(payload)
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)


def main():
    check_only = sys.argv[1:] == ["--check"]
    if sys.argv[1:] and not check_only:
        print(f"build-data: FAILED: expected no arguments or --check, received {sys.argv[1:]}", file=sys.stderr)
        return 2
    try:
        payload, numbers, passage_count, web_quotes = build_payload()
        target = HERE / "data.js"
        if check_only:
            current = target.read_text(encoding="utf-8") if target.exists() else None
            if current != payload:
                print(f"build-data: STALE: {target} does not match what its inputs build. Run build-data.py.", file=sys.stderr)
                return 1
        else:
            write_atomically(target, payload)
    except (BuildError, OSError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    print(f"build-data: {'current' if check_only else 'ok'}. {numbers}; {passage_count} passages; "
          f"{len(web_quotes)} quoted phrases from web sources not checked by this script: {web_quotes}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
