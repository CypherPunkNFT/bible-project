#!/usr/bin/env python3
"""Build data.js for the Angels, demons and spiritual powers mock-up from the study's content.md, checking it against
the site's Berean text and the held copies of the outside sources it quotes.

Run from Website/: python design/angels-demons-and-spiritual-powers-directions/build-data.py
  --check     run every check and fail if data.js is stale; write nothing
  --selftest  feed twelve wrong inputs in memory and prove each is refused; write nothing
Exit 1, with data.js unchanged, if any check fails; exit 2 if a file cannot be read or written.
"""
import hashlib
import html
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from scripture_text import BOOKS, CANON, REF_RE, BuildError, fold, load_bible, ref_id, typographic, verses_of  # noqa: E402
import study_lists as L  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/angels-demons-and-spiritual-powers/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; 1 Peter" is a new book
ONE_CHAPTER = re.compile(r"\b(Jude|Obadiah|Philemon|2 John|3 John) (\d+)(?![\d:])")
SHORT = re.compile(r"(?<![\w:.–])(\d+):(\d+)(?:–(\d+))?(?![\d:])")
STUDY = re.compile(r"\bStudy (\d+)\b")
QUOTE = re.compile(r'"([^"]+)"')
CHAIN = re.compile(r'(?:\s*(?:,|and|or)?\s*"[^"]*")*')
OWN_REF = re.compile(r'\s*\(?([^()"]*?\d+[^()"]*?·\s*BSB)\)?|\s*\(((?:[1-3] )?[A-Za-z ]*\d+:\d+[^()"]*)\)')
PART_HEAD = re.compile(r"## (\d\d) (.+)")
SUBHEADS = {"What the text shows": "shows", "What it means": "means", "What Scripture leaves unsaid": "unsaid"}


def words(text: str) -> str:
    """Words only, lower case: quotation marks, punctuation and dashes are ignored when a phrase is matched."""
    return " " + re.sub(r"[^a-z0-9]+", " ", fold(text).replace("'", "").lower()).strip() + " "


def phrase_in(phrase: str, text_words: str) -> bool:
    return words(phrase) != "  " and words(phrase) in text_words


def pieces(phrase: str) -> list:
    return [p for p in re.split(r"\.\.\.|…", phrase) if words(p).strip()]


class Held:
    """The held copies of outside sources, read once each and folded to words."""

    def __init__(self) -> None:
        self.cache: dict = {}

    def text(self, key: str) -> str:
        if key in self.cache:
            return self.cache[key]
        spec = L.SOURCES_HELD[key]
        path = Path(spec["path"]).resolve()
        if not any(path.is_relative_to(root.resolve()) for root in L.SOURCE_ROOTS):
            raise BuildError(f"held source {key!r} is outside the allowed source folders: {path}")
        raw = path.read_text(encoding="utf-8", errors="replace")
        if path.suffix == ".json":
            found: list = []
            def walk(node) -> None:
                if isinstance(node, str):
                    found.append(node)
                elif isinstance(node, dict):
                    for value in node.values():
                        walk(value)
                elif isinstance(node, list):
                    for value in node:
                        walk(value)
            walk(json.loads(raw))
            raw = "\n".join(found)
        elif path.suffix == ".xml":
            raw = html.unescape(re.sub(r"<[^<>]{0,400}>", " ", raw))
        raw = re.sub(r"\[\d+\]", " ", raw)                    # footnote markers inside a sentence
        raw = re.sub(r"(\w)-[ \t]*\r?\n\s*(\w)", r"\1\2", raw)  # a word broken at a line end
        folded = words(raw)
        for wrong, right in spec.get("fixes", []):
            folded = folded.replace(words(wrong), words(right))
        self.cache[key] = folded
        return folded

    def check(self, phrase: str, key: str, near: str | None, where: str) -> None:
        if L.SOURCES_HELD[key]["path"] is None:
            return  # no copy on this PC: named on the page and in the README as not checked by script
        text = self.text(key)
        anchors = [m.start() for m in re.finditer(re.escape(words(near)), text)]
        if not anchors:
            raise BuildError(f"{where}: the place-marker {near!r} is not in {L.SOURCES_HELD[key]['name']}")
        for piece in pieces(phrase):
            hits = [m.start() for m in re.finditer(re.escape(words(piece)), text)]
            if not any(abs(h - a) <= L.NEAR_WINDOW for h in hits for a in anchors):
                raise BuildError(f"{where}: outside quotation {piece.strip()!r} is not in {L.SOURCES_HELD[key]['name']} "
                                 f"near {near!r} (found {len(hits)} times elsewhere)")


class Builder:
    def __init__(self, bible: dict, held: Held) -> None:
        self.bible = bible
        self.held = held
        self.passages: dict = {}
        self.used_short: set = set()
        self.used_outside: set = set()
        self.used_pinned: set = set()
        self.unchecked: list = []

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def verse_words(self, keys: list) -> list:
        return [words(" ".join(t for _, t in self.passages[k]["verses"])) for k in keys]

    def refs_in(self, text: str, section: str) -> list:
        """Every reference in plain text as (start, end, label): whole references with their short continuations,
        one-chapter books ("Jude 6"), and short references ("16:10") whose book comes from SHORT_REFS."""
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
        for match in ONE_CHAPTER.finditer(text):
            found.append((match.start(), match.end(), f"{match.group(1)} 1:{match.group(2)}"))
        taken = [(s, e) for s, e, _ in found]
        for match in SHORT.finditer(text):
            if any(s <= match.start() < e for s, e in taken):
                continue
            book = L.SHORT_REFS.get((section, match.group(0)))
            if book is None:
                raise BuildError(f"part {section}: short reference {match.group(0)!r} has no book in SHORT_REFS")
            self.used_short.add((section, match.group(0)))
            found.append((match.start(), match.end(), f"{book} {match.group(0)}"))
        found.sort()
        for (_, end_a, a), (start_b, _, b) in zip(found, found[1:]):
            if start_b < end_a:
                raise BuildError(f"part {section}: references overlap: {a!r} and {b!r} in {text[:60]!r}")
        return found

    def runs(self, text: str, section: str) -> tuple:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t}. Returns (runs, cited passage keys)."""
        out, cited, last = [], [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], section, cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not url.startswith("/") or url.startswith("//"):
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": self.plain_runs(bold, section, cited)})
            else:
                out.append({"i": italic})
            last = match.end()
        return out + self.plain_runs(text[last:], section, cited), cited

    def plain_runs(self, text: str, section: str, cited: list) -> list:
        spans = [(s, e, "r", label) for s, e, label in self.refs_in(text, section)]
        spans += [(m.start(), m.end(), "s", m.group(1)) for m in STUDY.finditer(text)]
        out, last = [], 0
        for start, end, kind, value in sorted(spans):
            if start < last:
                raise BuildError(f"part {section}: overlapping references near {text[start:end]!r}")
            out.append(text[last:start])
            if kind == "r":
                key = self.passage(value)
                cited.append(key)
                out.append({"r": key, "t": text[start:end]})
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
        pinned to its verse. An outside quotation must be in its held source."""
        for match in QUOTE.finditer(raw):
            phrase = match.group(1)
            key = next((k for k in [*L.OUTSIDE_QUOTES, *L.PINNED_QUOTES] if k[0] == section and words(k[1]) == words(phrase)), None)
            if key in L.OUTSIDE_QUOTES:
                source, near = L.OUTSIDE_QUOTES[key]
                self.held.check(phrase, source, near, where)
                self.used_outside.add(key)
                if L.SOURCES_HELD[source]["path"] is None:
                    self.unchecked.append((phrase, L.SOURCES_HELD[source]["name"]))
                continue
            if key in L.PINNED_QUOTES:
                self.used_pinned.add(key)
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
        if fold(quoted).replace('"', "") != bible:
            raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label}


def paragraph(builder: Builder, raw: str, section: str, where: str, nearby: list) -> list:
    runs, cited = builder.runs(typographic(raw), section)
    builder.check_quotes(raw, section, cited, nearby, where)
    return runs


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"intro": [], "questions": [], "parts": []}
    section, part, sub, holder, readings, last_quote = "intro", None, None, study["intro"], [], None
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
            section, sub, readings, last_quote = m.group(1), None, [], None
            part = {"n": section, "title": m.group(2), "hook": [], "subs": []}
            study["parts"].append(part)
            holder = part["hook"]
        elif line == "## The question for your life":
            section, part, sub, readings, last_quote = "close", None, None, [], None
            study["close"] = {"title": line[3:], "blocks": []}
            holder = study["close"]["blocks"]
        elif line.startswith("### ") and part is not None and line[4:] in SUBHEADS:
            sub = {"kind": SUBHEADS[line[4:]], "title": line[4:], "blocks": []}
            part["subs"].append(sub)
            holder = sub["blocks"]
        elif (m := re.fullmatch(r"\*\*Main readings:\*\* (.+)", line)) and part is not None:
            body = m.group(1).rstrip(".")
            found = builder.refs_in(body, section)
            rest = body
            for start, end, _ in found:
                rest = rest[:start] + " " * (end - start) + rest[end:]
            if rest.replace(";", "").replace(",", "").strip():
                raise BuildError(f"{where}: main readings hold words that are not references: {rest.strip()!r}")
            readings = [builder.passage(label) for _, _, label in found]
            part["readings"] = [{"r": key, "t": body[start:end]} for key, (start, end, _) in zip(readings, found)]
        elif (m := re.fullmatch(r"\*\*(Consider|Reflect):\*\* (.+)", line)) and part is not None:
            part[m.group(1).lower()] = paragraph(builder, m.group(2), section, where, nearby)
        elif (m := re.fullmatch(r"(\d)\. \*\*([^*]+)\*\* (.+)", line)) and section == "intro":
            study["questions"].append({"q": m.group(2), "then": paragraph(builder, m.group(3), section, where, nearby)})
        elif m := re.fullmatch(r"- \*\*([^*]+)\.\*\* (.+)", line):
            if not holder or holder[-1]["k"] != "views":
                holder.append({"k": "views", "items": []})
            holder[-1]["items"].append({"label": m.group(1), "runs": paragraph(builder, m.group(2), section, where, nearby)})
        elif line.startswith(("#", "- ", "* ", "|", "<")):
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        else:
            holder.append({"k": "p", "runs": paragraph(builder, line, section, where, nearby)})
    total = sum(1 for line in lines if line.strip())
    if placed != total:
        raise BuildError(f"{total - placed} lines of content.md were not placed on the page")
    for key in ("title", "byline", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    shapes = {"intro": ([b["k"] for b in study["intro"]], ["p", "quote", "p", "p", "p", "quote", "p"]),
              "close": ([b["k"] for b in study["close"]["blocks"]], ["p", "quote", "p", "p"])}
    for name, (found, expected) in shapes.items():
        if found != expected:
            raise BuildError(f"the page places the {name} as {expected}, but content.md has {found}")
    if len(study["questions"]) != 3:
        raise BuildError(f"the study should carry three questions into every passage, found {len(study['questions'])}")
    for part in study["parts"]:
        kinds = [s["kind"] for s in part["subs"]]
        if kinds != ["shows", "means", "unsaid"] or "readings" not in part or "consider" not in part or "reflect" not in part:
            raise BuildError(f"part {part['n']} must have main readings, the three sub-heads in order, Consider and Reflect; found {kinds}")
    return study


def check_lists(builder: Builder, study: dict, text: str) -> dict:
    """Every phrase the page draws beside the text is in its verse; counts are made from the Berean."""
    def verse(label: str) -> str:
        return builder.verse_words([builder.passage(label)])[0]

    def need(phrase: str, label: str, what: str) -> None:
        if not phrase_in(phrase, verse(label)):
            raise BuildError(f"{what}: {phrase!r} is not in {label}")

    need(" ".join(L.MOTTO["lines"]), L.MOTTO["ref"], "motto")
    for phrase, label in [L.ONE_LINE["above"], L.ONE_LINE["rule"], *L.ONE_LINE["below"]]:
        need(phrase, label, "part 01's line")
    order_text = verse(L.ORDER["ref"])
    position = -1
    for phrase, _ in L.ORDER["steps"]:
        need(phrase, L.ORDER["ref"], "part 06's order")
        found = order_text.find(words(phrase), position + 1)
        if found <= position:
            raise BuildError(f"part 06's order: {phrase!r} does not come after the step before it in {L.ORDER['ref']}")
        position = found
    passage = verse(L.NOT_SEPARATE["ref"])
    for phrase in [L.NOT_SEPARATE["centre"], *[w for pair in L.NOT_SEPARATE["pairs"] for w in pair]]:
        if not phrase_in(phrase, passage):
            raise BuildError(f"close: {phrase!r} is not in {L.NOT_SEPARATE['ref']}")
    parts_raw = re.split(r"\n## ", text)
    numbers = [p["n"] for p in study["parts"]]
    if sorted(L.EDGE_ROWS) != numbers:
        raise BuildError(f"the edge chart needs one row per part: rows {sorted(L.EDGE_ROWS)}, parts {numbers}")
    edge = []
    for part in study["parts"]:
        row = L.EDGE_ROWS[part["n"]]
        need(row["revealed"], row["ref"], f"edge chart row {part['n']}")
        raw = next(p for p in parts_raw if p.startswith(f"{part['n']} "))
        for name in row["views"]:
            if name not in raw:
                raise BuildError(f"edge chart row {part['n']}: {name!r} is not named in that part")
        bullets = sum(len(b["items"]) for s in [{"blocks": part["hook"]}, *part["subs"]] for b in s["blocks"] if b["k"] == "views")
        if bullets and bullets != len(row["views"]):
            raise BuildError(f"edge chart row {part['n']}: {len(row['views'])} views named, but the part shows {bullets}")
        edge.append({**row, "n": part["n"], "r": builder.passage(row["ref"]), "bullets": bullets})
    counts = []
    for count in L.COUNTS:
        pattern = re.compile(count["pattern"], re.I)
        hits = [sum(1 for verse_text in builder.bible[code].values() if pattern.search(verse_text)) for code in CANON]
        old, new = sum(hits[:39]), sum(hits[39:])  # Genesis to Malachi, then Matthew to Revelation
        counts.append({**count, "value": old + new, "ot": old, "nt": new})
    named = {}
    for name, labels in L.NAMED_ANGELS.items():
        pattern = re.compile(rf"\b{name}\b")
        found = {f"{code}.{cv}" for code in BOOKS.values() for cv, t in builder.bible[code].items() if pattern.search(t)
                 and (name != "Michael" or code in L.MICHAEL_BOOKS)}
        expected = {f"{BOOKS[re.match(r'(.+) (\d+):(\d+)', label).group(1)]}.{label.rsplit(' ', 1)[1]}" for label in labels}
        if found != expected:
            raise BuildError(f"named angels: {name} is in {sorted(found)}, the list says {sorted(expected)}")
        named[name] = [builder.passage(label) for label in labels]
    for number, url in L.STUDY_LINKS.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"Study {number} links to {url}, which has no index.html on this PC")
    one_line = {"above": L.ONE_LINE["above"][0], "aboveRef": builder.passage(L.ONE_LINE["above"][1]),
                "rule": L.ONE_LINE["rule"][0], "ruleRef": builder.passage(L.ONE_LINE["rule"][1]),
                "below": [{"t": p, "r": builder.passage(label)} for p, label in L.ONE_LINE["below"]]}
    order = {"r": builder.passage(L.ORDER["ref"]), "steps": [{"t": p, "plain": s} for p, s in L.ORDER["steps"]]}
    close = {**L.NOT_SEPARATE, "r": builder.passage(L.NOT_SEPARATE["ref"])}
    return {"edge": edge, "counts": counts, "named": named, "oneLine": one_line, "order": order, "notSeparate": close,
            "motto": {**L.MOTTO, "r": builder.passage(L.MOTTO["ref"])}}


def build(text: str, bible: dict, held: Held) -> str:
    builder = Builder(bible, held)
    study = parse(builder, text)
    drawn = check_lists(builder, study, text)
    for used, table, name in ((builder.used_short, L.SHORT_REFS, "SHORT_REFS"), (builder.used_outside, L.OUTSIDE_QUOTES, "OUTSIDE_QUOTES"),
                              (builder.used_pinned, L.PINNED_QUOTES, "PINNED_QUOTES")):
        if unused := set(table) - used:
            raise BuildError(f"{name} has entries the text no longer uses: {sorted(unused)}")
    quoted = {b["r"] for blocks in [study["intro"], study["close"]["blocks"]] for b in blocks if b["k"] == "quote"}
    numbers = {"parts": len(study["parts"]), "references": len(builder.passages),
               "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted),
               "outsideChecked": len(L.OUTSIDE_QUOTES) - len(builder.unchecked), "outside": len(L.OUTSIDE_QUOTES)}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    data = {"study": study, "passages": builder.passages, **drawn, "numbers": numbers, "title": L.TITLE,
            "concepts": L.CONCEPTS, "sources": L.SOURCES, "unchecked": builder.unchecked, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.ADP = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


SELFTEST = [
    ("a changed word in a block quotation", "The secret things belong", "The hidden things belong", "not word for word"),
    ("a block quotation under the wrong reference", "Deuteronomy 29:29 · BSB", "Deuteronomy 29:28 · BSB", "not word for word"),
    ("a changed word in a quoted phrase", "ministering spirits sent to serve those", "ministering spirits sent to guard those", "not in"),
    ("a quote cited to the wrong verse", "(Hebrews 1:14 · BSB)", "(Hebrews 1:13 · BSB)", "not in"),
    ("a reference that does not exist", "(Jude 6 · BSB)", "(Jude 26 · BSB)", "does not resolve"),
    ("a short reference with no book in the table", "(16:10 · BSB)", "(16:11 · BSB)", "has no book"),
    ("a link that leaves the site", "Read the passage again before you answer.", "Read the [passage](https://example.com) again before you answer.", "only site links"),
    ("a line the page cannot place", "## 01 Made by him", "#### stray\n\n## 01 Made by him", "does not know how to place"),
    ("a changed word in an outside quotation", "particular guardian angel,", "personal guardian angel,", "not in"),
]
# Wrong entries in study_lists.py, patched in memory: an outside quotation looked for in the wrong chapter of its
# source, a place-marker the source does not hold, and a drawn phrase that is not in its verse.
LIST_CASES = [
    ("an outside quotation placed in the wrong chapter of its source", "OUTSIDE_QUOTES", ("02", "that they all with one consent watch for our salvation"), ("calvin", "celestial hierarchy"), "near"),
    ("a place-marker its source does not hold", "OUTSIDE_QUOTES", ("01", "mere babbling"), ("calvin", "nine choirs of seraphim"), "place-marker"),
    ("a quotation given to the wrong held source", "OUTSIDE_QUOTES", ("04", "probable that pride was the sin of Satan"), ("calvin", "puffed up"), "not in"),
]


def selftest(text: str, bible: dict, held: Held) -> int:
    build(text, bible, held)  # the real text must build, or every refusal below proves nothing
    failures = 0
    for name, old, new, expected in SELFTEST:
        if old not in text:
            print(f"selftest: cannot apply {name!r}: {old!r} is not in content.md", file=sys.stderr)
            failures += 1
            continue
        try:
            build(text.replace(old, new, 1), bible, held)
            print(f"selftest: NOT REFUSED: {name}", file=sys.stderr)
            failures += 1
        except BuildError as error:
            ok = expected in str(error)
            failures += not ok
            print(f"selftest: {'refused' if ok else 'REFUSED FOR THE WRONG REASON'}: {name}: {str(error).splitlines()[0]}")
    for name, table, key, value, expected in LIST_CASES:
        saved = getattr(L, table)[key]
        getattr(L, table)[key] = value
        try:
            build(text, bible, held)
            print(f"selftest: NOT REFUSED: {name}", file=sys.stderr)
            failures += 1
        except BuildError as error:
            ok = expected in str(error)
            failures += not ok
            print(f"selftest: {'refused' if ok else 'REFUSED FOR THE WRONG REASON'}: {name}: {str(error).splitlines()[0]}")
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
