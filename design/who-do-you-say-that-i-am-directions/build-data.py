#!/usr/bin/env python3
"""Build data.js for the Who do you say I am mock-up from the study's content.md, study_lists.py and the Berean text.

Run: python design/who-do-you-say-that-i-am-directions/build-data.py   (exit 1 and no data.js change if any check fails)
Check: add --check to run the same checks and fail if data.js is not what its inputs build now. Writes nothing.

Checks: every content.md line is consumed by a closed list of keys; block quotes equal the whole Berean text of their reference; every reference resolves;
each quoted phrase is in the reference that cites it in its own sentence, one paragraph of its named held source after its anchor, or the named confession list
with its article; each answer's words are in one verse, inside the speech it is credited to; a word lens must find exactly the lines typed for it, and none of its
negative controls; counts are computed; what the page says is absent is searched for, with the same pattern proved on a control verse.
All this proves the words are there, or are not. It does not prove who a speaker is, that a line is in the right group or that a reading is right.
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
BULK = WEBSITE.parent / "sources/library/bulk/ccel"
CONTENT = WEBSITE / "content/studies/jesus-christ/who-do-you-say-that-i-am/content.md"
HELD = {"barnes": [BULK / "barnes_ntnotes.xml"], "jfb": [BULK / "jamieson_jfb.xml"], "maclaren": [BULK / "maclaren_matt2.xml", BULK / "maclaren_john2.xml"], "boyce": [BULK / "boyce_theology.xml"],
        "vatican": [WEBSITE / "data/creeds/doc/vatican-council-dogmatic-decrees-1870.b1.json"]}
ANCHOR_WINDOW = 12000
ANCHOR_AFTER = 300
MIN_SOURCE_QUOTE_WORDS = 3
EXPECTED_JS = {"theme.js", "art.js", "wy-core.js", "wy-hero.js", "wy-wall.js", "wy-forms.js", "wy-readings.js", "wy-changed.js", "wy-questions.js", "wy.js"}
EXPECTED_QUESTIONS = 5
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
from scripture_text import (BSB, CANON, REF_RE, BuildError, fold, has_words, held_paragraphs, load_bible, plain_text, ref_id, typographic, verses_of)  # noqa: E402
from study_lists import (ABSENT_BOOKS, ABSENT_MENTIONS, ABSENT_RANGES, ANSWERS, CHANGED, FORMS, GROUPS, HOW, INTERNAL, MENTIONS, OLDER, PAIRS, QUOTED_CONFESSION, READING_ORDER, RELATED, SECOND_QUESTION, SECOND_QUESTION_AT, SOURCE_ANCHORS, SOURCES, WAY_IN, WORD_LENSES)  # noqa: E402

WORDS = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve"}
TYPED_COUNT = re.compile(r"\b(?:" + "|".join(word for word in WORDS.values() if word != "one") + r"|\d+)\s+(?:verses?|answers?|lines?|groups?|speakers?|questions?|readings?)\b", re.I)
ARTICLE_NEAR = re.compile(r"\s*\(Article (\d+)\)")
KING_JAMES = re.compile(r"\b(?:thee|thou|thy|thine|unto|saith|hath|ye)\b", re.I)
BRACKET = re.compile(r"\[([^\]]+)\]")
SENTENCE_BREAK = re.compile(r"[.!?][\"']?\s+[\"A-Z(\[]")
LEFTOVER = re.compile(r"\bsw-|SWK|signs and works", re.I)


def has_phrase(phrase: str, text: str) -> bool:
    """A quotation may change the case of its first letter to start or continue a sentence. Nothing else may differ."""
    return has_words(phrase, text) or has_words(phrase[0].swapcase() + phrase[1:], text)


def clean(text: str) -> str:
    return fold(text).replace('"', "")


def tidy_held(text: str) -> str:
    """Stripped italics leave a space before punctuation in the held notes. Close it so a quotation can be compared."""
    return re.sub(r"\s+([,.;:!?])", r"\1", text)


def word_of(value: int) -> str:
    if value not in WORDS:
        raise BuildError(f"no word for the count {value}")
    return WORDS[value]


def speeches(verse: str) -> list:
    """The quoted speeches in a verse, in order, by its curly double quotes. A closing mark with no opener means the speech began before this verse; an opener with no closer means it runs on."""
    out, start = [], None
    closes_first = verse.find("”") != -1 and (verse.find("“") == -1 or verse.find("”") < verse.find("“"))
    if closes_first:
        start = 0
    for index, mark in enumerate(verse):
        if mark == "“" and start is None:
            start = index + 1
        elif mark == "”" and start is not None:
            out.append(verse[start:index])
            start = None
    if start is not None:
        out.append(verse[start:])
    return out


class Builder:
    def __init__(self, bible: dict) -> None:
        self.bible = bible
        self.passages = {}
        self.held = {key: [tidy_held(p) for path in paths for p in held_paragraphs(path, None, None)] for key, paths in HELD.items()}
        self.whole = {key: re.sub(r"\s+", " ", " ".join(paragraphs)) for key, paragraphs in self.held.items()}
        self.used_confession = set()
        self.used_mentions = set()
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

    def runs(self, text: str, source: str | None = None, extra: str | None = None) -> list:
        """Split prose into plain strings, {r, t} reference links and {href, t} site links; checks every double-quoted phrase against the citation that goes with it."""
        text = self.fill(text)
        if "“" in text or "”" in text:
            raise BuildError(f"curly double quote in prose would slip past the quotation checks: {text[:90]}")
        if KING_JAMES.search(re.sub(r'"[^"]*"', "", text)):
            raise BuildError(f"older wording in the site's own voice: {text[:90]}")
        for token in BRACKET.findall(text):
            if token not in INTERNAL:
                raise BuildError(f"unknown bracket {token!r} in prose: {text[:90]}")
        references = list(REF_RE.finditer(text))
        for match in references:
            self.passage(match.group(0))
        if re.search(r"\b\d+:\d+", REF_RE.sub("", text)):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        if text.count('"') % 2:
            raise BuildError(f"unbalanced quotation marks in prose: {text[:90]}")
        for quoted in re.finditer(r'"([^"]+)"', text):
            self.check_quoted(quoted, text, self.citing(references, quoted, text, extra), source)
        return self.split_runs(typographic(text))

    def split_runs(self, text: str) -> list:
        out, last = [], 0
        pattern = re.compile(REF_RE.pattern + r"|" + BRACKET.pattern)
        for match in pattern.finditer(text):
            if match.start() > last:
                out.append(text[last:match.start()])
            whole = match.group(0)
            if whole.startswith("["):
                out.append({"href": INTERNAL[whole[1:-1]], "t": whole[1:-1]})
            else:
                out.append({"r": self.passage(whole), "t": whole})
            last = match.end()
        if last < len(text):
            out.append(text[last:])
        return out

    @staticmethod
    def citing(references: list, quoted: re.Match, text: str, extra: str | None) -> list:
        """The reference after the quotation in its own sentence cites it. With none, the one before it in its own sentence does. A reference in another sentence proves nothing. A question's own passage is always allowed."""
        following = next((m for m in references if m.start() >= quoted.end()), None)
        if following and not SENTENCE_BREAK.search(text[quoted.end():following.start()]):
            return [following.group(0), *([extra] if extra else [])]
        preceding = next((m for m in reversed(references) if m.end() <= quoted.start()), None)
        found = [preceding.group(0)] if preceding and not SENTENCE_BREAK.search(text[preceding.end():quoted.start()]) else []
        return [*found, extra] if extra else found

    def check_quoted(self, quoted: re.Match, text: str, references: list, source: str | None) -> None:
        phrase = quoted.group(1)
        folded = fold(phrase)
        if any(has_phrase(folded, clean(plain_text(self.bible, reference))) for reference in references):
            return
        if phrase in ABSENT_MENTIONS:
            return  # the absence itself is searched for in check_absent
        if phrase in MENTIONS:
            if not has_phrase(folded, clean(plain_text(self.bible, MENTIONS[phrase]))):
                raise BuildError(f"a word named as a word is not in its verse {MENTIONS[phrase]}: {phrase!r}")
            self.used_mentions.add(phrase)
            return
        if phrase in QUOTED_CONFESSION:
            near = ARTICLE_NEAR.match(text[quoted.end():])
            if not near or near.group(1) != QUOTED_CONFESSION[phrase]:
                raise BuildError(f"confession phrase is not cited to its own article {QUOTED_CONFESSION[phrase]}: {phrase!r}")
            self.used_confession.add(phrase)
            return
        if source and source in self.held:
            self.check_held(source, phrase, folded)
            return
        raise BuildError(f"quoted phrase is not in {references!r} and has no other source: {phrase!r}, in: {text[:90]}")

    def check_held(self, source: str, phrase: str, folded: str) -> None:
        if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
            raise BuildError(f"quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
        if not any(has_phrase(folded, re.sub(r"\s+", " ", paragraph)) for paragraph in self.held[source]):
            raise BuildError(f"quote not found in one paragraph of {source}: {phrase!r}")
        anchor = SOURCE_ANCHORS.get(phrase)
        if not anchor:
            raise BuildError(f"commentary quote has no anchor to its own verse's note: {phrase!r}")
        text = self.whole[source]
        places = [match.start() for match in re.finditer(re.escape(folded), text)]
        for place in places:
            if fold(anchor) in text[max(0, place - ANCHOR_WINDOW):place + len(folded) + ANCHOR_AFTER]:
                return
        raise BuildError(f"{source} quote is not in the note it is cited to ({anchor}), found at {len(places)} places: {phrase!r}")

    def phrase(self, pair: tuple) -> dict:
        """A phrase in one verse, whole words."""
        if not (isinstance(pair, tuple) and len(pair) == 2 and all(isinstance(item, str) for item in pair) and REF_RE.fullmatch(pair[0])):
            raise BuildError(f"expected (one verse, its words), received {pair!r}")
        label, words = pair
        _, verses = verses_of(self.bible, label)
        if len(verses) != 1:
            raise BuildError(f"a phrase must name one verse: {label}")
        if not has_phrase(clean(words), clean(verses[0][2])):
            raise BuildError(f"phrase not found, as whole words, in {label}: {words!r}")
        return {"r": self.passage(label), "label": label, "t": typographic(words)}

    def tagged(self, triple: tuple) -> dict:
        who, label, words = triple
        return {"who": typographic(who), **self.phrase((label, words))}


def build_answers(builder: Builder) -> list:
    groups = {group["id"] for group in GROUPS}
    seen, out = set(), []
    for item in ANSWERS:
        if item["id"] in seen:
            raise BuildError(f"two answers share the id {item['id']}")
        seen.add(item["id"])
        if item["group"] not in groups:
            raise BuildError(f"{item['id']}: unknown group {item['group']}")
        if item["how"] not in HOW:
            raise BuildError(f"{item['id']}: unknown way of saying {item['how']}")
        said = builder.phrase((item["ref"], item["words"]))
        check_speech(builder, item)
        read = builder.passage(item["read"])
        keys = {(verse["c"], verse["v"]) for verse in builder.passages[read]["verses"]}
        if verse_key(item["ref"]) not in keys:
            raise BuildError(f"{item['id']}: the passage {item['read']} does not hold its answer at {item['ref']}")
        following = None
        if item["next"] is not None:
            following = builder.phrase(item["next"])
            if verse_key(item["next"][0]) not in keys:
                raise BuildError(f"{item['id']}: the passage {item['read']} does not hold what came next, at {item['next'][0]}")
            if verse_key(item["next"][0]) < verse_key(item["ref"]):
                raise BuildError(f"{item['id']}: what came next, at {item['next'][0]}, is before the answer at {item['ref']}")
        out.append({"id": item["id"], "group": item["group"], "who": typographic(item["who"]), "how": item["how"], "howLabel": HOW[item["how"]], "t": said["t"], "r": said["r"], "label": said["label"], "next": following, "read": read})
    for group in GROUPS:
        if not any(entry["group"] == group["id"] for entry in out):
            raise BuildError(f"group {group['id']} has no answers")
    return out


def verse_key(label: str) -> tuple:
    match = REF_RE.fullmatch(label)
    return int(match.group(2)), int(match.group(3))


def check_speech(builder: Builder, item: dict) -> None:
    """Credit a line to the right mouth: a verse may hold two speakers, so the words must sit inside the speech named for them."""
    if item["narrated"]:
        return
    _, verses = verses_of(builder.bible, item["ref"])
    spoken = speeches(verses[0][2])
    if item["span"] >= len(spoken):
        raise BuildError(f"{item['id']}: {item['ref']} has {len(spoken)} speeches, and this line names speech {item['span']}")
    if not has_phrase(clean(item["words"]), clean(spoken[item["span"]])):
        raise BuildError(f"{item['id']}: the words are in {item['ref']} but not in the speech credited to {item['who']}: {spoken}")


def build_lenses(builder: Builder, answers: list, study: dict) -> tuple:
    lenses, counts = [], {}
    for lens in WORD_LENSES:
        pattern = re.compile(lens["pattern"])
        found = {entry["id"] for entry in answers if pattern.search(fold(entry["t"]))}
        if found != lens["expect"]:
            raise BuildError(f"word {lens['id']}: search found {sorted(found)}, the list says {sorted(lens['expect'])}")
        for control in lens["never"]:
            if pattern.search(control):
                raise BuildError(f"word {lens['id']}: the search wrongly finds {control!r}")
        lenses.append({"id": lens["id"], "label": lens["label"], "text": study[lens["text"]], "ids": sorted(found)})
        counts[lens["id"]] = found
    return lenses, counts


def compute_counts(answers: list, found: dict | None) -> dict:
    by = {entry["id"]: entry for entry in answers}
    gap = FORMS["turn"]
    numbers = {"answers": len(answers), "groups": len(GROUPS), "readings": len(READING_ORDER), "questions": EXPECTED_QUESTIONS, "turnGap": verse_key(gap["rebuked"])[1] - verse_key(gap["blessed"])[1]}
    for lens in WORD_LENSES:
        ids = (found or {}).get(lens["id"], lens["expect"])
        numbers[lens["id"]] = len(ids)
    son = (found or {}).get("son", WORD_LENSES[0]["expect"])
    king = (found or {}).get("king", WORD_LENSES[2]["expect"])
    numbers["sonGroups"] = len({by[i]["group"] for i in son})
    numbers["sonClaim"] = sum(by[i]["how"] == "said" for i in son)
    numbers["kingClaim"] = sum(by[i]["how"] == "said" for i in king)
    if numbers["kingClaim"] != 1:
        raise BuildError(f"the page says one line states King; found {numbers['kingClaim']}")
    prophet = next(lens for lens in WORD_LENSES if lens["id"] == "prophet")["expect"]
    if {by[i]["how"] for i in prophet} - {"said", "reported"}:
        raise BuildError("the page says each prophet line is said with respect; one of them is thrown or asked")
    holy = next(lens for lens in WORD_LENSES if lens["id"] == "holy")["expect"]
    if {by[i]["t"] for i in holy} != {"the Holy One of God"} or len({by[i]["group"] for i in holy}) != 2:
        raise BuildError("the page says the Holy One lines are the same words from two speakers")
    return numbers


def fill_words(numbers: dict) -> dict:
    filled = {"answers": str(numbers["answers"])}
    for key, value in numbers.items():
        if key == "answers":
            continue
        word = word_of(value)
        filled[key] = word
        filled[key[0].upper() + key[1:]] = word.capitalize()
    return filled


KEYS = {
    "top": {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Stance": "stance", "Selection": "selection", "WayInLead": "wayInLead", "WallLead": "wallLead", "WallReads": "wallReads", "WallCare": "wallCare",
            "WordSon": "WordSon", "WordChrist": "WordChrist", "WordKing": "WordKing", "WordLord": "WordLord", "WordProphet": "WordProphet", "WordHoly": "WordHoly", "WordTeacher": "WordTeacher", "WordDavid": "WordDavid",
            "PairsLead": "pairsLead", "PairsReads": "pairsReads", "ReadingsLead": "readingsLead", "ChangedLead": "changedLead", "ChangedReads": "changedReads", "ChangedCare": "changedCare", "OlderLead": "olderLead", "QuestionsLead": "questionsLead"},
    "reading": {"Ask": "ask", "Hook": "hook"},
    "after": {"Consider": "consider", "Reflect": "reflect"},
    "close": {"Close": "close", "Way": "way", "Invite": "invite", "Question": "question", "Again": "again"},
}
STRAY_KEY = re.compile(r"[A-Z][\w'-]*(?: [\w'-]+){0,3}: ")


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


def put(holder: dict, key: str, value: object) -> None:
    if key in holder:
        raise BuildError(f"the key {key} is given twice in one section")
    holder[key] = value


def keyed(builder: Builder, zone: str, holder: dict, part: dict | None, line: str) -> None:
    key, sep, value = line.partition(": ")
    if zone == "reading" and sep and part is None and key == "Slug":
        put(holder, "slug", value)
    elif zone == "reading" and sep and part is None and key == "Read":
        put(holder, "read", [{"r": builder.passage(item.strip()), "t": item.strip()} for item in value.split(";")])
    elif zone == "question" and sep and key == "Text":
        put(holder, "text", builder.passage(value))
    elif zone == "close" and sep and key == "Passage":
        put(holder, "passage", builder.passage(value))
    elif zone == "reading" and sep and key in KEYS["after"]:
        put(holder, KEYS["after"][key], builder.runs(value))
    elif zone != "question" and sep and part is None and key in KEYS[zone]:
        put(holder, KEYS[zone][key], builder.runs(value))
    elif zone == "question" and not STRAY_KEY.match(line):
        extra = builder.passages[holder["text"]]["label"]
        holder["blocks"].append({"k": "p", "runs": builder.runs(line, None, extra)})
    elif part is not None and not STRAY_KEY.match(line):
        part["blocks"].append({"k": "p", "runs": builder.runs(line)})
    else:
        raise BuildError(f"line belongs to nothing, or uses a key this section does not allow: {line[:70]}")


def tagged_block(builder: Builder, line: str, extra: str | None) -> dict:
    tag = re.match(r"\[([a-z]+)(?::([a-z0-9-]+))?\] (.+)", line)
    if not tag:
        raise BuildError(f"bad paragraph tag: {line[:50]}")
    kind, source, text = tag.groups()
    if kind in ("care", "read"):
        if source:
            raise BuildError(f"{kind} takes no source: {line[:60]}")
    elif kind != "source" or source not in builder.held:
        raise BuildError(f"unknown tag or source: {line[:60]}")
    return {"k": kind, "src": source, "runs": builder.runs(text, source, extra)}


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
            if zone != "top":
                raise BuildError(f"block quote outside the opening: {line[:60]}")
            study["opening"] = block
        elif re.match(r"\[[a-z]+(?::[a-z0-9-]+)?\] ", line):
            target = holder["blocks"] if zone == "question" else (part["blocks"] if part is not None else None)
            if target is None:
                raise BuildError(f"tagged paragraph outside a part or question: {line[:60]}")
            extra = builder.passages[holder["text"]]["label"] if zone == "question" else None
            target.append(tagged_block(builder, line, extra))
        else:
            keyed(builder, zone, holder, part, line)
    return study


def build_forms(builder: Builder) -> dict:
    road, turn, council, voice, thomas, written = (FORMS[slug] for slug in READING_ORDER)
    phrase, tagged = builder.phrase, builder.tagged
    for label in SECOND_QUESTION_AT:
        if SECOND_QUESTION not in clean(plain_text(builder.bible, label)):
            raise BuildError(f"the page says the second question is the same in all three; it is not at {label}")
    rows = [key for key, _ in road["rows"]]
    forms = {"road": {**road, "columns": [{"book": column["book"], **{key: phrase(column[key]) for key in rows}} for column in road["columns"]]}}
    gap = verse_key(turn["rebuked"])[1] - verse_key(turn["blessed"])[1]
    if not turn["name"].lower().startswith(word_of(gap)):
        raise BuildError(f"the turn's name says {turn['name']!r}, and the gap is {gap} verses")
    forms["turn"] = {"kind": turn["kind"], "name": turn["name"], "steps": [tagged(step) for step in turn["steps"]]}
    forms["council"] = {"kind": council["kind"], "name": council["name"], "steps": [tagged(step) for step in council["steps"]], "witnessesTitle": council["witnessesTitle"], "witnesses": [tagged(item) for item in council["witnesses"]]}
    if voice["added"] in clean(plain_text(builder.bible, voice["first"][0])) or voice["added"] not in clean(plain_text(builder.bible, voice["second"][0])):
        raise BuildError("the page says the second sentence adds Listen to Him! and the first does not have it")
    for pair in (voice["first"], voice["second"]):
        if voice["shared"] not in pair[1]:
            raise BuildError(f"the shared words are not in {pair}")
    forms["voice"] = {**{key: voice[key] for key in ("kind", "name", "firstPlace", "secondPlace")}, "first": phrase(voice["first"]), "second": phrase(voice["second"]), "shared": voice["shared"], "added": voice["added"], "others": [phrase(item) for item in voice["others"]]}
    forms["thomas"] = {**{key: thomas[key] for key in ("kind", "name", "leftTitle", "rightTitle", "note")}, "rows": [[phrase(left), phrase(right)] for left, right in thomas["rows"]], "result": phrase(thomas["result"])}
    keys = [verse_key(stop[1]) for stop in written["stops"]]
    if keys != sorted(keys):
        raise BuildError("John's answers are not in the order of his book")
    forms["written"] = {"kind": written["kind"], "name": written["name"], "stops": [tagged(stop) for stop in written["stops"]], "last": written["last"]}
    return forms


def build_changed(builder: Builder) -> tuple:
    changed = [{"who": row["who"], "before": builder.phrase(row["before"]), "between": builder.phrase(row["between"]), "after": [builder.phrase(item) for item in row["after"]]} for row in CHANGED]
    older = [{"by": row["by"], "then": builder.phrase(row["then"]), "now": builder.phrase(row["now"])} for row in OLDER]
    return changed, older


def build_pairs(builder: Builder, answers: list) -> list:
    by = {entry["id"]: entry for entry in answers}
    out = []
    for pair in PAIRS:
        sides = []
        for side in (pair["left"], pair["right"]):
            if side["answer"] not in by:
                raise BuildError(f"a pair names an unknown answer: {side['answer']}")
            sides.append({"answer": side["answer"], "around": builder.phrase(side["around"])})
        out.append({"word": pair["word"], "left": sides[0], "right": sides[1]})
    return out


def check_absent(builder: Builder) -> None:
    for item in ABSENT_BOOKS:
        pattern = re.compile(item["pattern"])
        if not pattern.search(clean(plain_text(builder.bible, item["control"]))):
            raise BuildError(f"control failed: {item['pattern']!r} should be found in {item['control']}")
        for code in item["books"]:
            for place, verse in builder.bible[code].items():
                if pattern.search(clean(verse)):
                    raise BuildError(f"the page says {item['says']}, and {item['pattern']!r} is at {code} {place}")
    for item in ABSENT_RANGES:
        pattern = re.compile(item["pattern"], re.I)
        if not pattern.search(clean(plain_text(builder.bible, item["control"]))):
            raise BuildError(f"control failed: {item['pattern']!r} should be found in {item['control']}")
        if pattern.search(clean(plain_text(builder.bible, item["label"]))):
            raise BuildError(f"the page says {item['says']}, and {item['pattern']!r} is in {item['label']}")


def check_complete(study: dict) -> None:
    if [r.get("slug") for r in study["readings"]] != READING_ORDER:
        raise BuildError(f"the readings are not the expected ones, in order: {[r.get('slug') for r in study['readings']]}")
    for reading in study["readings"]:
        for key in ("read", "ask", "hook", "consider", "reflect"):
            if key not in reading:
                raise BuildError(f"reading {reading['n']} lacks {key}")
    if len(study["questions"]) != EXPECTED_QUESTIONS:
        raise BuildError(f"the page says {EXPECTED_QUESTIONS} questions; found {len(study['questions'])}")
    for question in study["questions"]:
        if "text" not in question or not question["blocks"]:
            raise BuildError(f"question {question['id']} lacks its passage or its reading")
    for key in ("title", "opening", *KEYS["top"].values(), *KEYS["close"].values(), "passage", "closing"):
        if key not in study:
            raise BuildError(f"content.md lacks {key}")


def check_code() -> None:
    """The one innerHTML is in wy-core.js, for the fixed drawings. No inline handlers, no script from elsewhere, nothing left from the page this was copied from, and only the expected files."""
    found = {path.name for path in (HERE / "js").glob("*.js")}
    if found != EXPECTED_JS:
        raise BuildError(f"page files differ from the expected list: {sorted(found ^ EXPECTED_JS)}")
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        allowed = 1 if path.name == "wy-core.js" else 0
        if text.count(".innerHTML") != allowed:
            raise BuildError(f"{path.name} uses innerHTML {text.count('.innerHTML')} times; {allowed} allowed")
        if "eval(" in text or "document.write" in text:
            raise BuildError(f"{path.name} uses a banned call")
        if LEFTOVER.search(text):
            raise BuildError(f"{path.name} holds something left from the page it was copied from")
    if LEFTOVER.search((HERE / "css/wy.css").read_text(encoding="utf-8")):
        raise BuildError("wy.css holds something left from the page it was copied from")
    art = (HERE / "js/art.js").read_text(encoding="utf-8")
    if re.search(r"\$\{|<script|\bon[a-z]+=", art):
        raise BuildError("art.js must hold fixed drawings only")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"\bon[a-z]+=", page) or re.search(r"<script(?![^>]*\bsrc=)", page):
        raise BuildError("index.html has inline script or a handler")


def fingerprints(content: bytes) -> dict:
    """Only this study's own inputs. A shared frame file edited by another job must not make this page read as stale."""
    paths = {HERE / "build-data.py", HERE / "study_lists.py", HERE / "scripture_text.py", *(path for paths in HELD.values() for path in paths), *(BSB / f"{code}.json" for code in CANON)}
    out = {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(paths)}
    out[CONTENT.relative_to(WEBSITE.parent).as_posix()] = hashlib.sha256(content).hexdigest()
    return out


def build_payload() -> tuple:
    builder = Builder(load_bible())
    answers = build_answers(builder)
    numbers = compute_counts(answers, None)
    builder.counts = fill_words(numbers)
    check_absent(builder)
    raw = CONTENT.read_bytes()
    text = raw.decode("utf-8-sig").replace("\r\n", "\n")
    typed = TYPED_COUNT.search(re.sub(r"\{\{\w+\}\}", "", text))
    if typed:
        raise BuildError(f"a count is typed into content.md, and must be named: {typed.group(0)}")
    study = parse(builder, text.split("\n"))
    check_complete(study)
    check_code()
    lenses, found = build_lenses(builder, answers, study)
    if compute_counts(answers, found) != numbers:
        raise BuildError("the counts differ between the typed lists and the search")
    for source in SOURCES:
        if not source["href"].startswith(("https://", "/study/")):
            raise BuildError(f"source link must be https or a site page: {source['id']}")
    forms = build_forms(builder)
    changed, older = build_changed(builder)
    pairs = build_pairs(builder, answers)
    way_in = {"asks": builder.phrase(WAY_IN["asks"]), "reports": [builder.phrase(item) for item in WAY_IN["reports"]], "turns": builder.phrase(WAY_IN["turns"]), "then": builder.phrase(WAY_IN["then"])}
    missing = (set(QUOTED_CONFESSION) - builder.used_confession) | (set(MENTIONS) - builder.used_mentions)
    if missing:
        raise BuildError(f"listed phrases are not used on the page: {sorted(missing)}")
    sources = [{**source, "name": typographic(source["name"]), "note": typographic(source["note"])} for source in SOURCES]
    data = {"schema": 1, "study": study, "groups": GROUPS, "answers": answers, "lenses": lenses, "pairs": pairs, "wayIn": way_in, "forms": forms, "changed": changed, "older": older, "related": [list(item) for item in RELATED],
            "words": builder.counts, "passages": builder.passages, "sources": sources, "numbers": numbers, "builtFrom": fingerprints(raw)}
    payload = "window.WY = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
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
