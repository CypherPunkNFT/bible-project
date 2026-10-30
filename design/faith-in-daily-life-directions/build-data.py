#!/usr/bin/env python3
"""Build data.js for the Faith in daily life mock-up from the study's content.md and the Berean text.

Run: python design/faith-in-daily-life-directions/build-data.py   (exit 1 and no data.js change if any check fails)

Checks: every line of content.md is consumed; block quotes are verbatim Berean at their reference; every Scripture
reference resolves; every quoted phrase in the prose is found in that paragraph's verses, in a held source, or on a
named list below; every reason phrase is in its verse; every older-Scripture pair shares wording; every verse with a
quotation mark inside the walked passages is either a pair or a named exception. Counts on the page come from here.
"""
import html
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/faith-in-daily-life/content.md"
BSB = WEBSITE / "data/plain/bsb"
CCEL = WEBSITE.parent / "sources/library/source-ccel"
HELD = {
    "calvin-eph": CCEL / "asset-ready-text-edition-l06-calvin-41/calcom41.xml",
    "calvin-rom": CCEL / "asset-ready-text-edition-l06-calvin-38/calcom38.xml",
    "gill": CCEL / "asset-l11-gill-practical-xml/practical.xml",
}
BOOKS = {
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Deuteronomy": "DEU", "Psalm": "PSA", "Proverbs": "PRO",
    "Isaiah": "ISA", "Acts": "ACT", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO",
    "Ephesians": "EPH", "Colossians": "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI",
    "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "1 Peter": "1PE",
}
SECTION = {"GEN": "history", "EXO": "history", "LEV": "history", "DEU": "history", "PSA": "poetry", "PRO": "poetry", "ISA": "prophets"}
SECTION_NAME = {"history": "History", "poetry": "Poetry & Wisdom", "prophets": "Prophets"}
REF_RE = re.compile(
    r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+):(\d+)(?:[–-](?:(\d+):)?(\d+))?"
)

# Quoted phrases that are not Berean: each names where it comes from. Held sources are checked against the file; the
# two web sources were consulted on 2026-10-30 and are not held, so they are listed as unchecked by this script.
QUOTED_HELD = {
    "mutual subjection": "calvin-eph",
    "comes now to the various conditions of life": "calvin-eph",
    "yoke of marriage": "calvin-eph",
    "were not hired servants, like those of the present day, but slaves": "calvin-eph",
    "yet the obedience due to princes ought to be rendered to them": "calvin-rom",
    "not in anything that is contrary to the laws of God and Christ; for God is to be obeyed rather than men": "gill",
    "is not a servile one": "gill",
    "bitter language, threatening words, sour looks, and especially bitter blows": "gill",
    "cruel, churlish, barbarous, and brutish, unbecoming the man and the Christian": "gill",
    "not contrary to the laws of God, and the fundamental laws of the kingdom": "gill",
}
QUOTED_WEB = {
    "the uniting of one man and one woman in covenant commitment for a lifetime": "bfm",
    "cheerfully, regularly, systematically, proportionately, and liberally": "bfm",
    "contrary to the revealed will of God": "bfm",
    "God alone is Lord of the conscience": "bfm",
    "the role that slavery played in the formation of the Southern Baptist Convention": "sbc-1995",
    "we genuinely repent of racism of which we have been guilty": "sbc-1995",
}
QUOTED_OWN_WORDS = {"may I?", "employee", "employer"}

# The sentence's own reason: hand-picked by this study, sorted by this study. L = toward the Lord, N = toward another person.
REASONS = [
    ("home", "Ephesians 5:22", "as to the Lord", "L"), ("home", "Ephesians 5:25", "just as Christ loved the church", "L"),
    ("home", "Ephesians 6:1", "in the Lord", "L"), ("home", "Colossians 3:20", "pleasing to the Lord", "L"),
    ("home", "Ephesians 5:28", "as their own bodies", "N"), ("home", "Colossians 3:21", "so they will not become discouraged", "N"),
    ("work", "Ephesians 6:7", "as to the Lord and not to men", "L"), ("work", "Ephesians 6:9", "He who is both their Master and yours is in heaven", "L"),
    ("work", "Colossians 3:24", "It is the Lord Christ you are serving", "L"), ("work", "Ephesians 4:28", "something to share with the one in need", "N"),
    ("work", "1 Thessalonians 4:12", "behave properly toward outsiders", "N"), ("work", "2 Thessalonians 3:8", "so that we would not be a burden", "N"),
    ("money", "2 Corinthians 8:9", "the grace of our Lord Jesus Christ", "L"), ("money", "2 Corinthians 9:7", "God loves a cheerful giver", "L"),
    ("money", "2 Corinthians 9:11", "thanksgiving to God", "L"), ("money", "1 Timothy 6:17", "in God, who richly provides", "L"),
    ("money", "2 Corinthians 8:14", "your surplus will meet their need", "N"), ("money", "2 Corinthians 9:12", "supplying the needs of the saints", "N"),
    ("table", "1 Peter 4:10", "good stewards of the manifold grace of God", "L"), ("table", "1 Peter 4:11", "so that in all things God may be glorified", "L"),
    ("table", "Hebrews 13:3", "as if you were bound with them", "N"), ("table", "1 Peter 4:10", "to serve one another", "N"),
    ("street", "Romans 12:19", "leave room for God’s wrath", "L"), ("street", "Romans 13:1", "appointed by God", "L"),
    ("street", "1 Peter 2:13", "for the Lord’s sake", "L"), ("street", "Acts 5:29", "obey God rather than men", "L"),
    ("street", "Romans 13:8", "he who loves his neighbor has fulfilled the law", "N"), ("street", "Romans 13:10", "Love does no wrong to its neighbor", "N"),
    ("conscience", "Romans 14:3", "for God has accepted him", "L"), ("conscience", "Romans 14:8", "we belong to the Lord", "L"),
    ("conscience", "Romans 15:7", "just as Christ accepted you", "L"), ("conscience", "1 Corinthians 8:12", "you sin against Christ", "L"),
    ("conscience", "Romans 14:13", "any stumbling block or obstacle", "N"), ("conscience", "Romans 15:2", "please his neighbor for his good", "N"),
    ("conscience", "1 Corinthians 8:13", "so that I will not cause him to stumble", "N"),
]
# Older passage, the letter verse quoting it. "loose" pairs are commandments Paul lists in short form (no shared run of words).
PAIRS = [
    ("Genesis 2:24", "Ephesians 5:31", False), ("Exodus 20:12", "Ephesians 6:2", False), ("Exodus 16:18", "2 Corinthians 8:15", False),
    ("Psalm 112:9", "2 Corinthians 9:9", False), ("Deuteronomy 32:35", "Romans 12:19", False), ("Proverbs 25:21–22", "Romans 12:20", False),
    ("Exodus 20:13–17", "Romans 13:9", True), ("Leviticus 19:18", "Romans 13:9", False), ("Isaiah 45:23", "Romans 14:11", False),
    ("Psalm 69:9", "Romans 15:3", False),
]
# Verses in the walked passages with quotation marks that are speech or a saying, not an Old Testament quotation.
QUOTE_MARK_EXCEPTIONS = {"Ephesians 6:3", "2 Thessalonians 3:10", "Acts 5:28", "Acts 5:29"}

SOURCES = [
    {"id": "bsb", "name": "The Holy Bible, Berean Standard Bible", "note": "Every verse quoted and opened on this page. Public domain, dedicated 2023. Courtesy credit: Berean Standard Bible, berean.bible. Read here from the site's own data/plain/bsb.", "href": "https://berean.bible"},
    {"id": "calvin-eph", "name": "John Calvin, Commentary on Galatians and Ephesians, trans. William Pringle", "note": "Read directly: his comments on Ephesians 5:21–25 and 6:5 only, not the whole book. Reformed, not Baptist. Public domain.", "href": "https://ccel.org/ccel/calvin/calcom41.html"},
    {"id": "calvin-rom", "name": "John Calvin, Commentary on Romans, trans. John Owen", "note": "Read directly: his comments on Romans 13:1–7 only. Reformed, not Baptist. Public domain.", "href": "https://ccel.org/ccel/calvin/calcom38.html"},
    {"id": "gill", "name": "John Gill, A Body of Practical Divinity, Book IV, chapters 1 and 4", "note": "Read directly: the chapters on husband and wife and on magistrates and subjects, not the whole book. A Baptist work of doctrine, not a verse-by-verse commentary. Public domain.", "href": "https://ccel.org/ccel/gill/practical.html"},
    {"id": "bfm", "name": "The Baptist Faith and Message 2000, Articles 13, 17 and 18", "note": "Consulted at bfm.sbc.net on 2026-10-30: these three articles only. Copyright Southern Baptist Convention, so short phrases only, with a link. A witness to what Baptists hold; Scripture remains the authority.", "href": "https://bfm.sbc.net/bfm2000/"},
    {"id": "sbc-1995", "name": "Southern Baptist Convention, Resolution on Racial Reconciliation, Atlanta, 1995", "note": "Consulted at sbc.net on 2026-10-30: this one resolution. Short phrases only, with a link.", "href": "https://www.sbc.net/resource-library/resolutions/resolution-on-racial-reconciliation-on-the-150th-anniversary-of-the-southern-baptist-convention/"},
]
SOURCE_TAGS = {"calvin-eph": "calvin-eph", "calvin-eph-slaves": "calvin-eph", "gill": "gill"}


class BuildError(Exception):
    pass


def fold(text):
    """Compare text regardless of curly or straight quotes and dash kind. One character in, one character out."""
    return text.translate(str.maketrans({"’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "}))


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
    raw = re.sub(r"<[^>]+>", " ", raw)
    return fold(re.sub(r"\s+", " ", html.unescape(raw)))


def verses_of(bible, label):
    """Every (chapter, verse, text) in a reference such as 'Ephesians 5:21–6:4'. Fails on any verse that is missing."""
    match = REF_RE.fullmatch(label)
    if not match:
        raise BuildError(f"not a whole Scripture reference: {label!r}")
    name, c1, v1, c2, v2 = match.groups()
    code = BOOKS[name]
    c1, v1 = int(c1), int(v1)
    c2, v2 = int(c2) if c2 else c1, int(v2) if v2 else v1
    if (c2, v2) < (c1, v1):
        raise BuildError(f"reference runs backwards: {label}")
    keys = sorted((tuple(map(int, key.split(":"))) for key in bible[code]))
    found = [(c, v, bible[code][f"{c}:{v}"]) for c, v in keys if (c1, v1) <= (c, v) <= (c2, v2)]
    if not found or found[0][:2] != (c1, v1) or found[-1][:2] != (c2, v2):
        raise BuildError(f"reference does not resolve in the Berean: {label}")
    return code, found


def ref_id(label):
    name, c1, v1, c2, v2 = REF_RE.fullmatch(label).groups()
    end = f"-{c2}.{v2}" if c2 else (f"-{v2}" if v2 else "")
    return f"{BOOKS[name]}.{c1}.{v1}{end}"


class Builder:
    def __init__(self, bible):
        self.bible = bible
        self.passages = {}
        self.held = {key: held_text(path) for key, path in HELD.items()}
        self.web_quotes = []

    def passage(self, label):
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            chapters = sorted({c for c, _, _ in verses})
            self.passages[identity] = {
                "label": label, "code": code,
                "chapters": chapters,
                "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses],
            }
        return identity

    def runs(self, text):
        """Split prose into plain strings and {r, t} reference links; checks every double-quoted phrase."""
        labels = [m.group(0) for m in REF_RE.finditer(text)]
        ids = [self.passage(label) for label in labels]
        pool = " ".join(fold(v["t"]) for i in ids for v in self.passages[i]["verses"]).replace('"', "")
        for phrase in re.findall(r'"([^"]+)"', text):
            self.check_quoted(phrase, pool, text)
        out, last = [], 0
        for match, identity in zip(REF_RE.finditer(text), ids):
            if match.start() > last:
                out.append(text[last:match.start()])
            out.append({"r": identity, "t": match.group(0)})
            last = match.end()
        if last < len(text):
            out.append(text[last:])
        return out

    def check_quoted(self, phrase, pool, context):
        folded = fold(phrase)
        if folded in pool:
            return
        if phrase in QUOTED_HELD:
            if folded not in self.held[QUOTED_HELD[phrase]]:
                raise BuildError(f"quote not found in held source {QUOTED_HELD[phrase]}: {phrase!r}")
            return
        if phrase in QUOTED_WEB:
            self.web_quotes.append(phrase)
            return
        if phrase in QUOTED_OWN_WORDS:
            return
        raise BuildError(f"quoted phrase has no source: {phrase!r}, in: {context[:90]}")


def parse(builder, lines):
    """content.md into the study. Every non-blank line must be consumed by a rule here, or the build fails."""
    study = {"readings": []}
    reading = part = None
    keys_top = {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Selection": "selection", "Frame": "frame",
                "Way": "way", "Close": "close", "Question": "question", "Again": "again"}
    keys_reading = {"Hook": "hook", "Line": "line", "Says": "says", "Setting": "setting", "Respond": "respond",
                    "Look closely": "look", "Your response": "response"}
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
            ref_line = next((lines[j].strip() for j in range(index, len(lines)) if lines[j].strip()), "")
            label, _, version = ref_line.partition(" · ")
            if version != "BSB":
                raise BuildError(f"block quote not followed by '<reference> · BSB': {quote[:50]}")
            _, verses = verses_of(builder.bible, label)
            if fold(quote) not in fold(" ".join(v[2] for v in verses)):
                raise BuildError(f"block quote is not verbatim Berean at {label}: {quote[:60]}")
            index = next(j for j in range(index, len(lines)) if lines[j].strip()) + 1
            block = {"k": "quote", "t": quote, "r": builder.passage(label), "label": label}
            if part is not None:
                part["blocks"].append(block)
            else:
                study["opening"] = block
        elif line.startswith("["):
            tag = re.match(r"\[([a-z:-]+)\] (.+)", line)
            if not tag:
                raise BuildError(f"bad paragraph tag: {line[:50]}")
            kind, text = tag.groups()
            block = {"k": kind, "runs": builder.runs(text)}
            if kind.startswith("source:"):
                source = kind.split(":", 1)[1]
                if source not in SOURCE_TAGS:
                    raise BuildError(f"unknown source tag: {source}")
                block = {"k": "source", "src": SOURCE_TAGS[source], "runs": block["runs"]}
            elif kind not in ("care", "other", "open"):
                raise BuildError(f"unknown paragraph kind: {kind}")
            part["blocks"].append(block)
        else:
            key, sep, value = line.partition(": ")
            if sep and key == "Slug" and reading is not None:
                reading["slug"] = value
            elif sep and key == "Read" and reading is not None:
                labels = [item.strip() for item in value.split(";")]
                reading["read"] = [builder.passage(label) for label in labels]
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


def build_reasons(builder):
    out = []
    for place, label, phrase, pole in REASONS:
        _, verses = verses_of(builder.bible, label)
        text = verses[0][2]
        at = fold(text).find(fold(phrase))
        if at < 0:
            raise BuildError(f"reason phrase not in {label}: {phrase!r}")
        end = at + len(phrase)
        out.append({"place": place, "r": builder.passage(label), "label": label, "pole": pole,
                    "pre": text[:at], "mark": text[at:end], "post": text[end:]})
    return out


def build_pairs(builder):
    out = []
    for older, letter, loose in PAIRS:
        code, older_verses = verses_of(builder.bible, older)
        _, letter_verses = verses_of(builder.bible, letter)
        letter_text = letter_verses[0][2]
        if "“" not in letter_text:
            raise BuildError(f"{letter} has no quotation mark in the Berean, so it cannot be shown as a quotation")
        words = lambda text: re.sub(r"[^a-z' ]", " ", fold(text).lower()).split()
        older_words = " " + " ".join(words(" ".join(v[2] for v in older_verses))) + " "
        letter_words = words(letter_text)
        shared = any(" " + " ".join(letter_words[i:i + 3]) + " " in older_words for i in range(len(letter_words) - 2))
        if not shared and not loose:
            raise BuildError(f"{older} and {letter} share no run of three words")
        section = SECTION[code]
        out.append({"id": f"pair-{len(out) + 1}", "older": builder.passage(older), "olderLabel": older,
                    "letter": builder.passage(letter), "letterLabel": letter, "section": section,
                    "sectionName": SECTION_NAME[section]})
    return out


def check_every_quotation(builder, study, pairs):
    """Rule T3: every Old Testament quotation inside the walked passages must be shown."""
    shown = {p["letterLabel"] for p in pairs} | QUOTE_MARK_EXCEPTIONS
    for reading in study["readings"]:
        for identity in reading["read"]:
            passage = builder.passages[identity]
            book = next(name for name, code in BOOKS.items() if code == passage["code"])
            for verse in passage["verses"]:
                label = f"{book} {verse['c']}:{verse['v']}"
                if "“" in verse["t"] and label not in shown:
                    raise BuildError(f"{label} has a quotation mark but is neither an older-Scripture pair nor a named exception")


def figures(builder, study, reasons, pairs):
    verses, letters = set(), set()
    for reading in study["readings"]:
        count = set()
        for identity in reading["read"]:
            passage = builder.passages[identity]
            count |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
            letters.add(passage["code"])
        reading["verseCount"] = len(count)
        verses |= count
    if "ACT" not in letters:
        raise BuildError("expected Acts among the walked passages")
    letters.discard("ACT")
    toward_lord = sum(r["pole"] == "L" for r in reasons)
    toward_person = len(reasons) - toward_lord
    for reading in study["readings"]:
        poles = {r["pole"] for r in reasons if r["place"] == reading["slug"]}
        if poles != {"L", "N"}:
            raise BuildError(f"place {reading['slug']} does not have both kinds of reason: {poles}")
    letter_verses = {p["letterLabel"] for p in pairs}
    return {
        "places": len(study["readings"]), "verses": len(verses), "letters": len(letters), "reasons": len(reasons),
        "towardLord": toward_lord, "towardPerson": toward_person, "older": len(pairs), "letterVerses": len(letter_verses),
    }


def main():
    try:
        builder = Builder(load_bible())
        lines = CONTENT.read_text(encoding="utf-8").splitlines()
        study = parse(builder, lines)
        for reading in study["readings"]:
            missing = {"slug", "hook", "line", "read", "says", "setting", "respond", "look", "response"} - set(reading)
            if missing:
                raise BuildError(f"reading {reading['n']} lacks {sorted(missing)}")
        reasons = build_reasons(builder)
        pairs = build_pairs(builder)
        check_every_quotation(builder, study, pairs)
        numbers = figures(builder, study, reasons, pairs)
    except BuildError as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    data = {"study": study, "passages": builder.passages, "reasons": reasons, "pairs": pairs,
            "sources": SOURCES, "numbers": numbers}
    payload = "window.FD = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    target = HERE / "data.js"
    temporary = HERE / "data.js.tmp"
    temporary.write_text(payload, encoding="utf-8", newline="\n")
    os.replace(temporary, target)
    print(f"build-data: ok. {numbers}; {len(builder.passages)} passages; "
          f"{len(set(builder.web_quotes))} quoted phrases from web sources not checked by this script.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
