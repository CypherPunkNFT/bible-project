#!/usr/bin/env python3
"""Build data.js for the What the Bible says about itself mock-up from the study's content.md, checking it against
the site's Berean text and the held copies of the Baptist Faith and Message 2000 and two confessions.

Run from Website/: python design/scripture-and-its-witness-directions/build-data.py
  --check     run every check and fail if data.js is stale; writes nothing
  --selftest  feed wrong inputs in memory and prove each is refused for the right reason; writes nothing
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import copy
import hashlib
import json
import os
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists as L  # noqa: E402
from scripture_text import REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/scripture-and-its-witness/content.md"
APP_ROUTES = WEBSITE / "src/App.tsx"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
NOTE = re.compile(r"\s*\[check(?::\s*([^\]]+))?\]")
# A continuation such as "; 6:13" or ", 27" stays in the same book; "; 1 Corinthians" starts a new one.
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")
QUOTE = re.compile(r'"([^"]+)"(?:\s*\(([^)]*)\))?')
SITE_LINK = re.compile(r"/[A-Za-z0-9/_?=&#.-]*")
MARKS = {"care": "With care", "other": "Another view, in its own words", "read": "This site's reading"}
OPENING_FIELDS = ("Concepts", "Motto", "Lead", "Frame", "Selection")
CLOSE_FIELDS = ("Way", "Close", "Invite", "Question", "Again", "Passage")


def typographic(text: str) -> str:
    """Straight quotes become the Berean's curly ones; a quotation inside a quotation turns single."""
    text = re.sub(r'"([^"]*)"', lambda m: "“" + m.group(1).replace("“", "‘").replace("”", "’") + "”", text)
    text = re.sub(r"(^|[\s“(])'", "\\1‘", text)
    return text.replace("'", "’")


def words(text: str) -> list:
    return re.findall(r"[a-z0-9]+", fold(text).lower())


def in_order(pieces: list, text: str) -> bool:
    """Every piece is in the text as whole words, each after the one before, allowing a capital at the start."""
    at = 0
    for piece in pieces:
        found = None
        for variant in (piece, piece[:1].lower() + piece[1:], piece[:1].upper() + piece[1:]):
            match = re.compile(r"(?<!\w)" + re.escape(variant) + r"(?!\w)").search(text, at)
            if match and (found is None or match.start() < found.start()):
                found = match
        if not found:
            return False
        at = found.end()
    return True


def exact_in(phrase: str, label: str, bible: dict) -> bool:
    piece = fold(phrase).replace('"', "").strip(" ,.?!:")
    return in_order([piece], plain_text(bible, label))


def nocase_in(phrase: str, label: str, bible: dict) -> bool:
    return has_words(fold(phrase).lower(), plain_text(bible, label).lower())


class Builder:
    def __init__(self, bible: dict, lists) -> None:
        self.bible, self.lists = bible, lists
        self.passages: dict = {}

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str) -> list:
        """Every reference in plain text with its span, with short continuations such as "6:16 and 6:13"."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chap = more.group(2) or (match.group(4) or chapter)
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chap}:{more.group(3)}{tail}"))
                end = more.end()
        return found

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {chk} (a note to check)."""
        out, last = [], 0
        for match in NOTE.finditer(text):
            out += self.inline_runs(text[last:match.start()], cited)
            out.append({"chk": typographic((match.group(1) or "check before publishing").replace("*", ""))})
            last = match.end()
        return out + self.inline_runs(text[last:], cited)

    def inline_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.fullmatch(url) or url.startswith("//") or ".." in url:
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            elif italic in self.lists.STUDY_LINKS:
                out.append({"s": self.lists.STUDY_LINKS[italic], "t": typographic(italic)})
            elif italic in self.lists.BOOK_TITLES:
                out.append({"i": typographic(italic)})
            else:  # every italic in this study is a title, so an unknown one is a link silently lost
                raise BuildError(f"italic title {italic!r} is on neither STUDY_LINKS nor BOOK_TITLES")
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
            if start < last:
                raise BuildError(f"two references overlap in {text[:60]!r}")
            if start > last:
                out.append(typographic(text[last:start]))
            key = self.passage(label)
            cited.append(key)
            out.append({"r": key, "t": typographic(text[start:end])})
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, cited: list, where: str) -> None:
        """A quote with its own reference beside it must be in that reference. Any other quote must be in a verse its
        paragraph cites, its part's readings or the passage printed above it, or on a named list. Pieces split by an
        ellipsis must all be in one reference, in order. A quote under three words must be on a named list."""
        raw = NOTE.sub("", raw)
        lists = self.lists
        for match in QUOTE.finditer(raw):
            phrase, after = match.groups()
            if phrase in lists.HELD_QUOTES or phrase in lists.NOT_HELD_QUOTES or phrase in lists.OWN_TERMS:
                continue
            if phrase in lists.PINNED_SHORT:
                if not exact_in(phrase, lists.PINNED_SHORT[phrase], self.bible):
                    raise BuildError(f"{where}: pinned quotation {phrase!r} is not in {lists.PINNED_SHORT[phrase]}")
                continue
            pieces = [fold(p).replace('"', "").replace("'", "").strip(" ,.?!:") for p in re.split(r"\.\.\.|…", phrase)]
            pieces = [p for p in pieces if p]
            if len(" ".join(pieces).split()) < 3:
                raise BuildError(f"{where}: short quotation {phrase!r} must be on a named list in study_lists.py")
            own = [self.passage(label) for _, _, label in self.refs_in(after or "")]
            labels = [self.passages[k]["label"] for k in (own or cited) if k in self.passages]
            if not any(in_order(pieces, plain_text(self.bible, label).replace("'", "")) for label in labels):
                raise BuildError(f"{where}: quoted words {phrase!r} are not in {', '.join(labels) or 'any cited verse'}")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        if fold(quoted).replace('"', "") != plain_text(self.bible, label):
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {plain_text(self.bible, label)}")
        return {"k": "quote", "r": key, "label": label}


def para(builder: Builder, raw: str, where: str, section: dict | None = None) -> list:
    cited: list = []
    runs = builder.runs(raw, cited)
    nearby = list((section or {}).get("readings", [])) + list((section or {}).get("quoted", []))
    last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + nearby + ([last["r"]] if last else []), where)
    for run in runs:
        text = run if isinstance(run, str) else run.get("t", run.get("i", run.get("b", "")))
        if "[" in text or "]" in text:
            raise BuildError(f"{where}: a note in square brackets the page cannot place: {text[:70]!r}")
    return runs


def take_block(builder: Builder, lines: list, i: int, first: str) -> tuple:
    """A block quotation and the '<reference> · BSB' line under it. Returns the block, the next index, lines used."""
    quote, used = [first], 0
    while i < len(lines) and lines[i].startswith(">"):
        quote.append(lines[i])
        i += 1
        used += 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    ref_line = lines[i].strip() if i < len(lines) else ""
    return builder.block(quote, ref_line), i + 1, used + 1


def readings_line(builder: Builder, body: str) -> tuple:
    """'2 Peter 1:16–21. **Quoted:** John 10:35; Matthew 5:17–18' to (readings, quoted). Split on Quoted first."""
    main, _, quoted = body.partition("**Quoted:**")
    readings = [builder.passage(label) for _, _, label in builder.refs_in(main.strip().rstrip("."))]
    if not readings:
        raise BuildError(f"main readings line has no reference: {body!r}")
    return readings, [builder.passage(label) for _, _, label in builder.refs_in(quoted.strip().rstrip("."))]


def field_line(builder: Builder, study: dict, current, line: str, where: str) -> bool:
    """The 'Name: text' lines: the heading's fields, a part's Hook, a question's Text, the close's fields."""
    m = re.fullmatch(r"([A-Z][a-z]+): (.+)", line)
    if not m:
        return False
    field, body = m.groups()
    if current is None and field in OPENING_FIELDS:
        if field == "Concepts":
            study["concepts"] = body.split(" · ")
        elif field == "Motto":
            study["motto"] = body.split(" / ")
        else:
            study[field.lower()] = para(builder, body, where)
    elif field == "Hook" and current is not None and "n" in current:
        current["hook"] = para(builder, body, where, current)
    elif field == "Text" and current is not None and "id" in current:
        current["text"] = builder.passage(body.strip())
    elif field in CLOSE_FIELDS and current is not None and current is study.get("close"):
        current[field.lower()] = builder.passage(body.strip()) if field == "Passage" else para(builder, body, where)
    else:
        return False
    return True


def heading_line(study: dict, head: str, where: str) -> dict:
    if m := re.fullmatch(r"Close: (.+)", head):
        study["close"] = {"title": typographic(m.group(1)), "blocks": []}
        return study["close"]
    if m := re.fullmatch(r"Question ([a-z-]+): (.+)", head):  # headings are never quote-checked
        study["questions"].append({"id": m.group(1), "title": typographic(m.group(2)), "blocks": []})
        return study["questions"][-1]
    if m := re.fullmatch(r"(0[1-6]) (.+?)(?:: (.+))?", head):
        study["parts"].append({"n": m.group(1), "title": typographic(m.group(2)),
                               "turn": typographic(m.group(3)) if m.group(3) else None, "blocks": []})
        return study["parts"][-1]
    raise BuildError(f"{where}: a heading the page does not know: {head!r}")


def parse(builder: Builder, text: str) -> dict:
    """Place every non-blank line of content.md, or fail."""
    lines = text.splitlines()
    used, i = 0, 0
    study: dict = {"opening": [], "parts": [], "questions": []}
    current = None  # a part, a question, or the close
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        in_part = current is not None and "n" in current
        if line.startswith("# "):
            study["title"] = line[2:]
        elif line.startswith("> "):
            item, i, extra = take_block(builder, lines, i, line)
            used += extra
            (current["blocks"] if current is not None else study["opening"]).append(item)
        elif line.startswith("## "):
            current = heading_line(study, line[3:], where)
        elif line.startswith("### "):
            if not in_part:
                raise BuildError(f"{where}: a sub-head outside any part: {line[:60]!r}")
            current["blocks"].append({"k": "h3", "t": typographic(line[4:])})
        elif m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line):
            if not in_part:
                raise BuildError(f"{where}: {m.group(1)} outside any part")
            if m.group(1) == "Main readings":
                current["readings"], current["quoted"] = readings_line(builder, m.group(2))
            else:
                current[m.group(1).lower()] = para(builder, m.group(2), where, current)
        elif field_line(builder, study, current, line, where):
            pass
        elif m := re.match(r"\[(care|other|read)\] (.*)", line):
            if current is None or current is study.get("close"):
                raise BuildError(f"{where}: a marked note outside a part or question")
            current["blocks"].append({"k": "note", "mark": m.group(1), "label": MARKS[m.group(1)], "runs": para(builder, m.group(2), where, current)})
        elif m := re.match(r"\[source:([a-z0-9-]+)\] (.*)", line):
            if current is None or m.group(1) not in builder.lists.SOURCE_MARKS:
                raise BuildError(f"{where}: a source note outside a part, or not named in SOURCE_MARKS: {m.group(1)!r}")
            current["blocks"].append({"k": "note", "mark": "source", "label": builder.lists.SOURCE_MARKS[m.group(1)], "runs": para(builder, m.group(2), where, current)})
        elif current is None or current is study.get("close"):
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        else:
            kind = "more" if line.startswith("Read more in ") else "p"
            current["blocks"].append({"k": kind, "runs": para(builder, line, where, current)})
    if used != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    check_shape(study)
    return study


def check_shape(study: dict) -> None:
    for key in ("title", "concepts", "motto", "lead", "opening", "frame", "selection", "parts", "questions", "close"):
        if not study.get(key):
            raise BuildError(f"content.md has no {key}")
    if [p["n"] for p in study["parts"]] != ["01", "02", "03", "04", "05", "06"]:
        raise BuildError("the study must have parts 01 to 06 in order")
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if not part.get(key):
                raise BuildError(f"part {part['n']} has no {key}")
    for question in study["questions"]:
        if not question.get("text") or not question["blocks"]:
            raise BuildError(f"question {question['id']!r} needs a 'Text:' verse and an answer")
    missing = [f for f in CLOSE_FIELDS if not study["close"].get(f.lower())]
    if missing:
        raise BuildError(f"the close has no {', '.join(missing)}")
    if len(study["motto"]) != 2:
        raise BuildError("the motto must have two lines, split by ' / '")
    if len(study["opening"]) != 1:
        raise BuildError("the heading takes exactly one opening quotation")


def build(text: str, lists, bible: dict) -> str:
    import study_checks
    builder = Builder(bible, lists)
    study = parse(builder, text)
    drawn = study_checks.check_lists(builder, study, text, exact_in, nocase_in)
    held_notes = study_checks.check_outside(lists, text, WEBSITE, APP_ROUTES, HERE.parent)
    if study["close"]["passage"] != ref_id(lists.CLOSE_PASSAGE):
        raise BuildError(f"the close's passage must be {lists.CLOSE_PASSAGE}")
    blocks = [b for p in study["parts"] + study["questions"] for b in p["blocks"]]
    quoted = {b["r"] for b in blocks + study["opening"] if b["k"] == "quote"} | {study["close"]["passage"]}
    numbers = {**drawn.pop("numbers"), "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted),
               "references": len(builder.passages), "questions": len(study["questions"]),
               "walked": len({r for p in study["parts"] for r in p["readings"]})}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "study_checks.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    heading = {"trail": lists.TRAIL, "title": lists.TITLE, "back": lists.BACK, "conceptOf": lists.CONCEPT_OF_PART}
    outside = {**{k: v["source"] for k, v in lists.HELD_QUOTES.items()}, **lists.NOT_HELD_QUOTES}
    data = {"study": study, "heading": heading, "passages": builder.passages, **drawn, "numbers": numbers,
            "sources": lists.SOURCES, "outside": outside, "heldNotes": held_notes, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.SW = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


class Lists:
    """A deep copy of study_lists, so a self-test can break one list without touching the module."""
    def __init__(self) -> None:
        for name in dir(L):
            if name.isupper():
                setattr(self, name, copy.deepcopy(getattr(L, name)))


def write(output: str) -> None:
    """Write through a temporary file in the same folder, so a failed write never leaves half a data.js."""
    for stale in HERE.glob("*.tmp"):  # left by a run that was killed mid-write
        stale.unlink()
    handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="\n", dir=HERE, suffix=".tmp", delete=False)
    try:
        with handle:
            handle.write(output)
        os.replace(handle.name, OUT)
    except OSError:
        Path(handle.name).unlink(missing_ok=True)
        raise


def main() -> int:
    try:
        text = CONTENT.read_text(encoding="utf-8")
        bible = load_bible()
        if "--selftest" in sys.argv:
            import build_selftest
            return build_selftest.run(text, bible, build, Builder, Lists, BuildError)
        output = build(text, Lists(), bible)
        if "--check" in sys.argv:
            if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
                print("build-data: stale: data.js; run without --check", file=sys.stderr)
                return 1
            print("build-data: all checks pass; data.js is current")
            return 0
        write(output)
    except (BuildError, OSError, KeyError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} characters)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
