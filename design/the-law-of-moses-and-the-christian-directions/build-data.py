#!/usr/bin/env python3
"""Build data.js for the Leviticus: holiness and sacrifice mock-up from the study's content.md, checking it against the
site's Berean text, the Berean's footnotes and the held copies of the outside sources it quotes.

Run from Website/: python design/the-law-of-moses-and-the-christian-directions/build-data.py
  --check     run every check and fail if data.js is stale; write nothing
  --selftest  feed wrong inputs in memory and prove each is refused; write nothing
Exit 1, with data.js unchanged, if any check fails; exit 2 if a file cannot be read or written.
The parser and the held-source check follow the Angels, demons and spiritual powers mock-up's build.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from scripture_text import BOOKS, CANON, REF_RE, BuildError, fold, load_bible, ref_id, typographic, verses_of  # noqa: E402
import study_lists as L  # noqa: E402
from held_text import Held, footnotes_of, phrase_in, pieces, words  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/the-law-of-moses-and-the-christian/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[check: ([^\]]+)\]|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; 1 Peter" is a new book
WHOLE_CHAPTER = re.compile(r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+)(?![\d:])")
SHORT = re.compile(r"(?<![\w:.–])(\d+):(\d+)(?:–(\d+))?(?![\d:])")
STUDY = re.compile(r"\bStudy (\d+)\b")
PART_LINK = re.compile(r"\bPart (\d\d)\b")
QUOTE = re.compile(r'"([^"]+)"')
CHAIN = re.compile(r'(?:\s*(?:,|and|or)?\s*"[^"]*")*')
OWN_REF = re.compile(r'\s*\(?([^()"]*?\d+[^()"]*?·\s*BSB)\)?|\s*\(((?:[1-3] )?[A-Za-z ]*\d+:\d+[^()"]*)\)')
PART_HEAD = re.compile(r"## (\d\d) (.+)")
SUBHEADS = {"In Israel": "israel", "How the New Testament reads it": "nt", "Where the reading stops": "stops"}
PART_08 = ["Where Christians agree", "Three kinds of law", "The law of Moses ended as a whole: the dispensational reading",
           "Fulfilled in Christ: progressive covenantalism and new covenant theology", "A further question: Israel's penalties",
           "Where this study stands"]


class Builder:
    def __init__(self, bible: dict, held: Held) -> None:
        self.bible = bible
        self.held = held
        self.passages: dict = {}
        self.used: dict = {"OTHER_BOOK": set(), "OUTSIDE_QUOTES": set(), "PINNED_QUOTES": set(), "FOOTNOTE_QUOTES": set(), "OWN_TERMS": set()}

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def chapter(self, name: str, chapter: str) -> str:
        last = max(int(k.split(":")[1]) for k in self.bible[BOOKS[name]] if k.split(":")[0] == chapter)
        return self.passage(f"{name} {chapter}:1–{last}")

    def verse_words(self, keys: list) -> list:
        return [words(" ".join(t for _, t in self.passages[k]["verses"])) for k in keys]

    def refs_in(self, text: str, section: str) -> list:
        """Every reference in plain text as (start, end, label): whole references with their short continuations, and
        short references ("16:10"), which are Leviticus unless OTHER_BOOK names their book."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or (match.group(4) or chapter)
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
                end = more.end()
        taken = [(s, e) for s, e, _ in found]
        for match in SHORT.finditer(text):
            if any(s <= match.start() < e for s, e in taken):
                continue
            key = (section, match.group(0))
            book = L.OTHER_BOOK.get(key)
            if book:
                self.used["OTHER_BOOK"].add(key)
            else:
                before = [label for s, _, label in found if s < match.start()]
                last_book = REF_RE.match(before[-1]).group(1) if before else "Leviticus"
                said = text.rfind("Leviticus", 0, match.start())
                last_start = max((s for s, _, _ in found if s < match.start()), default=-1)
                if last_book != "Leviticus" and said < last_start:
                    raise BuildError(f"part {section}: short reference {match.group(0)!r} follows a reference to {last_book}; "
                                     f"name its book in OTHER_BOOK, or write the book in content.md")
                book = "Leviticus"
            found.append((match.start(), match.end(), f"{book} {match.group(0)}"))
        found.sort()
        for (_, end_a, a), (start_b, _, b) in zip(found, found[1:]):
            if start_b < end_a:
                raise BuildError(f"part {section}: references overlap: {a!r} and {b!r} in {text[:60]!r}")
        return found

    def runs(self, text: str, section: str) -> tuple:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t}, {c} (an open check). Returns (runs, cited keys)."""
        out, cited, last = [], [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], section, cited)
            check, link_text, url, bold, italic = match.groups()
            if check:
                out.append({"c": check})
            elif url:
                if not url.startswith("/") or url.startswith("//"):
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": self.plain_runs(bold, section, cited)})
            elif italic in L.STUDY_TITLES:
                out.append({"s": L.STUDY_TITLES[italic], "t": italic})
            else:
                out.append({"i": italic})
            last = match.end()
        return out + self.plain_runs(text[last:], section, cited), cited

    def plain_runs(self, text: str, section: str, cited: list) -> list:
        spans = [(s, e, "r", label) for s, e, label in self.refs_in(text, section)]
        spans += [(m.start(), m.end(), "s", m.group(1)) for m in STUDY.finditer(text)]
        spans += [(m.start(), m.end(), "p", m.group(1)) for m in PART_LINK.finditer(text)]
        out, last = [], 0
        for start, end, kind, value in sorted(spans):
            if start < last:
                raise BuildError(f"part {section}: overlapping references near {text[start:end]!r}")
            out.append(text[last:start])
            if kind == "r":
                key = self.passage(value)
                cited.append(key)
                out.append({"r": key, "t": text[start:end]})
            elif kind == "p":
                out.append({"a": f"#part-{value}", "t": text[start:end]})
            else:
                if value not in L.STUDY_LINKS:
                    raise BuildError(f"part {section}: Study {value} is named but not in STUDY_LINKS")
                out.append({"s": L.STUDY_LINKS[value], "t": text[start:end]})
            last = end
        out.append(text[last:])
        for piece in out:
            if isinstance(piece, str) and re.search(r"\d+:\d+", piece):
                raise BuildError(f"part {section}: a reference was left unlinked in {piece.strip()[:60]!r}")
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, section: str, cited: list, nearby: list, where: str) -> None:
        """A quote with its own reference beside it must be in that reference. Otherwise it may be in a verse its
        paragraph cites, its part's main readings or the passage printed above it; under three words, it must be
        pinned to its verse. Outside quotations must be in their held source; footnote quotations in the footnote."""
        for match in QUOTE.finditer(re.sub(r"\[check: [^\]]+\]", "", raw)):
            phrase = match.group(1)
            same = lambda table: next((k for k in table if k[0] == section and words(k[1]) == words(phrase)), None)
            if (key := same(L.OWN_TERMS)):
                self.used["OWN_TERMS"].add(key)
                continue
            if (key := same(L.OUTSIDE_QUOTES)):
                source, near = L.OUTSIDE_QUOTES[key]
                self.held.check(phrase, source, near, where)
                self.used["OUTSIDE_QUOTES"].add(key)
                continue
            if (key := same(L.FOOTNOTE_QUOTES)):
                if not phrase_in(phrase, footnotes_of(L.FOOTNOTE_QUOTES[key])):
                    raise BuildError(f"{where}: {phrase!r} is not in the Berean's footnote on {L.FOOTNOTE_QUOTES[key]}")
                self.used["FOOTNOTE_QUOTES"].add(key)
                continue
            if (key := same(L.PINNED_QUOTES)):
                self.used["PINNED_QUOTES"].add(key)
                targets = [self.passage(L.PINNED_QUOTES[key])]
            else:
                tail = raw[match.end():]
                tail = tail[CHAIN.match(tail).end():]
                own_text = (m := OWN_REF.match(tail)) and (m.group(1) or m.group(2))
                own = [self.passage(label) for _, _, label in self.refs_in(own_text, section)] if own_text else []
                if not own and len(words(phrase).split()) < 3:
                    raise BuildError(f"{where}: short quote {phrase!r} has no reference beside it; pin it in PINNED_QUOTES")
                targets = own or (cited + nearby)
            texts = self.verse_words(targets)
            for piece in pieces(phrase):
                if not any(phrase_in(piece, t) for t in texts):
                    labels = ", ".join(self.passages[k]["label"] for k in targets) or "none"
                    raise BuildError(f"{where}: quoted words {piece.strip()!r} are not in {labels}")

    def block(self, quote_lines: list, ref_line: str, where: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line.strip():
            raise BuildError(f"{where}: block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        bible = fold(" ".join(t for _, t in self.passages[key]["verses"])).replace('"', "")
        # A quotation may leave out words with "...", so each kept run must be in the passage, in order, and the
        # quotation must start and end where the passage does unless it marks the cut.
        kept = [fold(p).replace('"', "").strip() for p in quoted.split("...")]
        position = 0
        for piece in kept:
            found = bible.find(piece, position)
            if found < 0:
                raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
            position = found + len(piece)
        # A quotation that stops at the end of a sentence before the passage does is allowed, and marked as a part.
        whole_sentences = kept[0] != bible and bible.startswith(kept[0]) and kept[0][-1:] in ".?!" and bible[len(kept[0]):len(kept[0]) + 1] == " "
        if len(kept) == 1 and kept[0] != bible and not whole_sentences:
            raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label, "text": curly(quoted), "part": len(kept) > 1 or whole_sentences}


def curly(text: str) -> str:
    """typographic() turns every straight single quote into a closing one; an opening one starts a word."""
    return re.sub(r"(^|[\s“(—])’", r"\1‘", typographic(text))


def paragraph(builder: Builder, raw: str, section: str, where: str, nearby: list) -> list:
    runs, cited = builder.runs(curly(raw), section)
    builder.check_quotes(raw, section, cited, nearby, where)
    return runs


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"intro": [], "questions": [], "parts": []}
    section, part, holder, readings, last_quote = "intro", None, study["intro"], [], None
    placed, i = 0, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        placed += 1
        where = f"content.md line {i}"
        nearby = readings + ([last_quote] if last_quote else [])
        if line.startswith("# "):
            study["title"] = line[2:]
        elif m := re.fullmatch(r"\*\*(Study \d+ · .+)\*\*", line):
            study["byline"] = m.group(1)
        elif line.startswith(">"):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; placed += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: block quotation has no reference line after it")
            item = builder.block(quote, lines[i], where); i += 1; placed += 1
            holder.append(item)
            last_quote = item["r"]
        elif m := PART_HEAD.fullmatch(line):
            section, readings, last_quote = m.group(1), [], None
            title, _, turn = m.group(2).partition(": ")
            part = {"n": section, "title": title, "turn": turn, "hook": [], "subs": []}
            study["parts"].append(part)
            holder = part["hook"]
        elif line == "## Read Leviticus again":
            section, part, readings, last_quote = "close", None, [], None
            study["close"] = {"title": line[3:], "blocks": []}
            holder = study["close"]["blocks"]
        elif line.startswith("### ") and part is not None:
            sub = {"kind": SUBHEADS.get(line[4:], "other"), "title": line[4:], "blocks": []}
            part["subs"].append(sub)
            holder = sub["blocks"]
        elif (m := re.fullmatch(r"\*\*Main readings:\*\* (.+)", line)) and part is not None:
            body = m.group(1).rstrip(".")
            found = builder.refs_in(body, section)
            spans = [(s, e) for s, e, _ in found]
            keys = [builder.passage(label) for _, _, label in found]
            for whole in WHOLE_CHAPTER.finditer(body):
                if not any(s <= whole.start() < e for s, e in spans):
                    spans.append((whole.start(), whole.end()))
                    keys.append(builder.chapter(whole.group(1), whole.group(2)))
            rest = body
            for start, end in spans:
                rest = rest[:start] + " " * (end - start) + rest[end:]
            if rest.replace(";", "").replace(",", "").strip():
                raise BuildError(f"{where}: main readings hold words that are not references: {rest.strip()!r}")
            order = sorted(range(len(spans)), key=lambda n: spans[n][0])
            readings = [keys[n] for n in order]
            part["readings"] = [{"r": keys[n], "t": body[spans[n][0]:spans[n][1]]} for n in order]
        elif (m := re.fullmatch(r"\*\*(Consider|Reflect):\*\* (.+)", line)) and part is not None:
            part[m.group(1).lower()] = paragraph(builder, m.group(2), section, where, nearby)
        elif (m := re.fullmatch(r"\*\*Your question:\*\* (.+)", line)) and section == "close":
            study["close"]["question"] = paragraph(builder, m.group(1), section, where, nearby)
        elif (m := re.fullmatch(r"(\d)\. \*\*([^*]+)\*\* (.+)", line)) and section == "intro":
            study["questions"].append({"q": m.group(2), "then": paragraph(builder, m.group(3), section, where, nearby)})
        elif (m := re.fullmatch(r"\*\*([^*]+)\.\*\* (.+)", line)) and part is not None:
            holder.append({"k": "lead", "label": m.group(1), "runs": paragraph(builder, m.group(2), section, where, nearby)})
        elif line.startswith(("#", "- ", "* ", "|", "<")):
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        else:
            holder.append({"k": "p", "runs": paragraph(builder, line, section, where, nearby)})
    total = sum(1 for line in lines if line.strip())
    if placed != total:
        raise BuildError(f"{total - placed} lines of content.md were not placed on the page")
    check_shape(study)
    return study


def check_shape(study: dict) -> None:
    for key in ("title", "byline", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    found = [b["k"] for b in study["intro"]]
    if found != ["p", "quote", "p", "p"]:
        raise BuildError(f"the page places the opening as ['p', 'quote', 'p', 'p'], but content.md has {found}")
    if len(study["questions"]) != 3:
        raise BuildError(f"the study should carry three questions into every part, found {len(study['questions'])}")
    if [b["k"] for b in study["close"]["blocks"]] != ["p", "p"] or "question" not in study["close"]:
        raise BuildError("the close should be a paragraph, the question for the reader, and 'Read the passage again'")
    if [p["n"] for p in study["parts"]] != [f"{n:02d}" for n in range(1, 9)]:
        raise BuildError(f"the page draws parts 01 to 08 in order, found {[p['n'] for p in study['parts']]}")
    for part in study["parts"]:
        titles = [s["title"] for s in part["subs"]]
        expected = PART_08 if part["n"] == "08" else list(SUBHEADS)
        if titles != expected or "readings" not in part or "consider" not in part or "reflect" not in part:
            raise BuildError(f"part {part['n']} must have main readings, the sub-heads {expected}, Consider and Reflect; found {titles}")


def check_lists(builder: Builder, study: dict, text: str) -> dict:
    """Every phrase the page draws beside the text is in its verse or in the study; counts are made from the Berean."""
    def verse(label: str) -> str:
        return builder.verse_words([builder.passage(label)])[0]

    def need(phrase: str, label: str, what: str) -> str:
        if not phrase_in(phrase, verse(label)):
            raise BuildError(f"{what}: {phrase!r} is not in {label}")
        return builder.passage(label)

    for line in L.MOTTO["lines"]:
        need(line, L.MOTTO["ref"], "motto")
    numbers = [p["n"] for p in study["parts"]]
    plan = []
    for point in L.PLAN:
        if point["n"] not in numbers or point["zone"] not in L.ZONES:
            raise BuildError(f"plan: part {point['n']} or zone {point['zone']!r} is not on the page")
        plan.append({**point, "r": need(point["phrase"], point["ref"], f"plan, part {point['n']}"),
                     "ntr": need(point["nt"], point["nt_ref"], f"plan, part {point['n']}, New Testament")})
    facts = [{"t": phrase, "r": need(phrase, label, "plan sentence")} for phrase, label in L.PLAN_FACTS]
    wild = {**L.WILDERNESS, "r": need(L.WILDERNESS["phrase"], L.WILDERNESS["ref"], "plan, wilderness"),
            "ntr": need(L.WILDERNESS["nt"], L.WILDERNESS["nt_ref"], "plan, wilderness, New Testament")}
    sevens = [{**row, "r": need(row["phrase"], row["ref"], f"sevens, {row['unit']}")} for row in L.SEVENS]
    seven_times = {"t": L.SEVEN_TIMES[0], "r": need(*L.SEVEN_TIMES, "sevens, seven times seven")}
    part8 = words(text.split("\n## 08 ", 1)[1].split("\n## ", 1)[0])
    for phrase in [L.ROUTES["caption"], *[v["arrive"] for v in L.ROUTES["verses"]], *[r for f in L.ROUTES["families"] for r in f["routes"]]]:
        if not phrase_in(phrase, part8):
            raise BuildError(f"two verses, three routes: {phrase!r} is not the study's own words in part 08")
    families = [f for f in L.ROUTES["families"]]
    if [f["name"] for f in families] != ["Three kinds of law", "Ended as a whole", "Fulfilled in Christ"]:
        raise BuildError("two verses, three routes: the families must be the study's three, in its order")
    routes = {**L.ROUTES, "verses": [{**v, "r": builder.passage(v["ref"])} for v in L.ROUTES["verses"]]}
    neighbour = re.compile(L.NEIGHBOUR_PATTERN, re.I)
    nt_hits = [f"{code} {cv}" for code in CANON[39:] for cv, t in builder.bible[code].items() if neighbour.search(t)]
    for number, url in L.STUDY_LINKS.items():
        if number not in L.PENDING_LINKS and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"Study {number} links to {url}, which has no index.html on this PC")
    for title, url in L.STUDY_TITLES.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"{title} links to {url}, which has no index.html on this PC")
    return {"plan": plan, "planFacts": facts, "wilderness": wild, "sevens": sevens, "sevenTimes": seven_times,
            "routes": routes, "neighbour": nt_hits, "motto": {**L.MOTTO, "r": builder.passage(L.MOTTO["ref"])},
            "closePair": [builder.passage(label) for label in L.CLOSE_PAIR], "again": builder.passage(L.PASSAGE_AGAIN)}


def build(text: str, bible: dict, held: Held) -> str:
    builder = Builder(bible, held)
    study = parse(builder, text)
    drawn = check_lists(builder, study, text)
    for name, used in builder.used.items():
        if unused := set(getattr(L, name)) - used:
            raise BuildError(f"{name} has entries the text no longer uses: {sorted(unused)}")
    blocks = study["intro"] + [b for p in study["parts"] for s in [{"blocks": p["hook"]}, *p["subs"]] for b in s["blocks"]]
    quoted = {b["r"] for b in blocks if b["k"] == "quote"} | set(drawn["closePair"]) | {drawn["again"]}
    numbers = {"chapters": len({k.split(":")[0] for k in bible["LEV"]}), "parts": len(study["parts"]),
               "neighbour": len(drawn["neighbour"]), "references": len(builder.passages),
               "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted),
               "outside": len(L.OUTSIDE_QUOTES), "checks": sum(1 for p in study["parts"] for s in [{"blocks": p["hook"]}, *p["subs"]]
                                                               for b in s["blocks"] for r in b.get("runs", []) if isinstance(r, dict) and "c" in r)}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py", HERE / "held_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    data = {"study": study, "passages": builder.passages, **drawn, "numbers": numbers, "title": L.TITLE,
            "concepts": L.CONCEPTS, "sources": L.SOURCES, "pending": sorted(L.STUDY_LINKS[n] for n in L.PENDING_LINKS), "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.LEV = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


SELFTEST = [
    ("a changed word in a block quotation", "Then the LORD called to Moses", "Then the LORD spoke to Moses", "not word for word"),
    ("a block quotation under the wrong reference", "Leviticus 16:21 · BSB", "Leviticus 16:22 · BSB", "not word for word"),
    ("a changed word in a quoted phrase", "make perfect those who draw near to worship", "make holy those who draw near to worship", "not in"),
    ("a quote cited to the wrong verse", "(Hebrews 13:12 · BSB)", "(Hebrews 13:13 · BSB)", "not in"),
    ("a reference that does not exist", "(Leviticus 16:27)", "(Leviticus 16:72)", "does not resolve"),
    ("a short reference after another book, with no book given", "(Galatians 5:14 · BSB)", "(Galatians 5:14 · BSB; compare 5:13)", "follows a reference"),
    ("a link that leaves the site", "Read the passage again before you answer.", "Read the [passage](https://example.com) again before you answer.", "only site links"),
    ("a line the page cannot place", "## 01 The offerings", "#### stray\n\n## 01 The offerings", "does not know how to place"),
    ("a changed word in an outside quotation", "Jehovah opens up sin under the figure of leprosy", "Jehovah opens up sin under the picture of leprosy", "not in"),
    ("a changed word in a quoted footnote", "literally \"to Azazel\"", "literally \"to Azazael\"", "no reference beside it"),
    ("a named study with no link", "(Study 25, What the cross", "(Study 99, What the cross", "STUDY_LINKS"),
]
# Wrong entries in study_lists.py, patched in memory.
LIST_CASES = [
    ("a plan point whose phrase is not in its verse", "PLAN", 2, {**L.PLAN[2], "ref": "Leviticus 13:45"}, "is not in"),
    ("a seven whose words are in another verse", "SEVENS", 0, {**L.SEVENS[0], "ref": "Leviticus 23:4"}, "is not in"),
    ("a route the study does not say", "ROUTES", "families", [{**L.ROUTES["families"][0], "routes": ["19:18 is ceremonial", "19:19 is moral"]}, *L.ROUTES["families"][1:]], "own words"),
    ("a footnote quotation looked for on the wrong verse", "FOOTNOTE_QUOTES", ("04", "to Azazel"), "Leviticus 16:9", "footnote"),
    ("an outside quotation given to the wrong held source", "OUTSIDE_QUOTES", ("08", "doth for ever bind all"), ("calvin", "judicial law"), "not in"),
]


def selftest(text: str, bible: dict, held: Held) -> int:
    build(text, bible, held)  # the real text must build, or every refusal below proves nothing
    failures = 0
    def attempt(name: str, expected: str, run) -> None:
        nonlocal failures
        try:
            run()
            print(f"selftest: NOT REFUSED: {name}", file=sys.stderr)
            failures += 1
        except BuildError as error:
            ok = expected in str(error)
            failures += not ok
            print(f"selftest: {'refused' if ok else 'REFUSED FOR THE WRONG REASON'}: {name}: {str(error).splitlines()[0]}")
    for name, old, new, expected in SELFTEST:
        if old not in text:
            print(f"selftest: cannot apply {name!r}: {old!r} is not in content.md", file=sys.stderr)
            failures += 1
            continue
        attempt(name, expected, lambda: build(text.replace(old, new, 1), bible, held))
    for name, table, key, value, expected in LIST_CASES:
        saved = getattr(L, table)[key]
        getattr(L, table)[key] = value
        try:
            attempt(name, expected, lambda: build(text, bible, held))
        finally:
            getattr(L, table)[key] = saved
    total = len(SELFTEST) + len(LIST_CASES)
    print(f"selftest: {total - failures} of {total} wrong inputs refused as expected; nothing written")
    return 1 if failures else 0


def main() -> int:
    try:
        text = CONTENT.read_text(encoding="utf-8")
        bible, held = load_bible(), Held()
        if "--selftest" in sys.argv:
            return selftest(text, bible, held)
        output = build(text, bible, held)
    except BuildError as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    except (OSError, ValueError, KeyError) as error:
        print(f"build-data: could not read an input: {type(error).__name__}: {error}", file=sys.stderr)
        return 2
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_bytes() != output.encode("utf-8"):
            print("build-data: stale: data.js does not match content.md; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    try:
        temp = OUT.with_suffix(".js.tmp")
        temp.write_bytes(output.encode("utf-8"))
        os.replace(temp, OUT)
    except OSError as error:
        print(f"build-data: could not write {OUT}: {error}", file=sys.stderr)
        return 2
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
