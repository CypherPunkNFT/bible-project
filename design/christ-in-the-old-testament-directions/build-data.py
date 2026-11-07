#!/usr/bin/env python3
"""Build data.js for the Christ in the Old Testament mock-up from the study's content.md, checking it against the
site's Berean text and the held copies of the outside sources.

Run from Website/: python design/christ-in-the-old-testament-directions/build-data.py
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
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists as L  # noqa: E402
from scripture_text import BOOKS, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/jesus-christ/christ-in-the-old-testament/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CHECK_NOTE = re.compile(r"\s*\[check: ([^\]]+)\]")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; 1 Corinthians" is a new book, not verse 1
SHORT = re.compile(r"(?<![\w:–])(\d+):(\d+)(?:–(\d+))?")
QUOTE = re.compile(r'"([^"]+)"(?:\s*\(([^)]*)\))?')


def typographic(text: str) -> str:
    """Straight quotes become the Berean's curly ones; a single quote opening a nested quotation turns the right way."""
    text = re.sub(r'"([^"]*)"', "“\\1”", text)
    text = re.sub(r"(^|[\s“(])'", "\\1‘", text)
    return text.replace("'", "’")


def exact_in(words: str, label: str, bible: dict) -> bool:
    return has_words(fold(words).replace('"', ""), plain_text(bible, label))


class Builder:
    def __init__(self, bible: dict, lists) -> None:
        self.bible, self.lists = bible, lists
        self.passages: dict = {}
        self.short_used: set = set()
        self.part = "open"

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str) -> list:
        """Every reference in plain text with its span: whole ones, short continuations ("2:19, 21") and bare
        "chapter:verse" ones, whose book comes only from the SHORT_REFS table."""
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
        for match in SHORT.finditer(text):
            if any(a <= match.start() < b for a, b, _ in found):
                continue
            key = (self.part, match.group(0))
            if key not in self.lists.SHORT_REFS:
                raise BuildError(f"part {self.part}: bare reference {match.group(0)!r} has no book in SHORT_REFS")
            self.short_used.add(key)
            book = self.lists.SHORT_REFS[key]
            if book:
                found.append((match.start(), match.end(), f"{book} {match.group(0)}"))
        return sorted(found)

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {chk} (a note still to check)."""
        out, last = [], 0
        for match in CHECK_NOTE.finditer(text):
            out += self.inline_runs(text[last:match.start()], cited)
            out.append({"chk": typographic(match.group(1))})
            last = match.end()
        return out + self.inline_runs(text[last:], cited)

    def inline_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not url.startswith("/") or url.startswith("//") or ".." in url:
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            elif italic in self.lists.STUDY_LINKS:
                folder = self.lists.STUDY_LINKS[italic]
                out.append({"s": f"/mockups/{folder}/" if folder else None, "t": typographic(italic)})
            else:
                out.append({"i": typographic(italic)})
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
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
        paragraph cites, its part's main readings or the passage printed above it, or on the checked outside list."""
        raw = CHECK_NOTE.sub("", raw)
        for match in QUOTE.finditer(raw):
            phrase, after = match.groups()
            if phrase in self.lists.OUTSIDE_QUOTES or phrase in self.lists.OWN_TERMS:
                continue
            own = [self.passage(label) for _, _, label in self.refs_in(after or "")]
            labels = [self.passages[k]["label"] for k in (own or cited) if k in self.passages]
            texts = [plain_text(self.bible, label).replace("'", "") for label in labels]
            folded = fold(phrase).replace('"', "").replace("'", "").strip(" ,.?!")
            variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
            if not any(has_words(v, t) for v in variants for t in texts):
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
    nearby = list((section or {}).get("readings", []))
    last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + nearby + ([last["r"]] if last else []), where)
    return runs


def mark_of(heading: str) -> str:
    """Each sub-head carries one of the three marks drawn in section 00: first meaning, the line, where it stops."""
    if heading.startswith("How the New Testament") or heading == "The New Testament's own words":
        return "line"
    if heading.startswith("Where the picture stops") or heading.startswith("When a picture") or heading.startswith("Readings that go"):
        return "stop"
    if heading.startswith("How Jewish readers"):
        return "readers"
    return "first"


def parse(builder: Builder, text: str) -> dict:
    """Place every non-blank line of content.md, or fail."""
    lines = text.splitlines()
    used, i = 0, 0
    study: dict = {"opening": [], "frame": [], "parts": []}
    current = None
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        if line.startswith("# "):
            study["title"] = line[2:]
        elif re.fullmatch(r"\*\*Study \d+ · [^*]+\*\*", line) and current is None and "status" not in study:
            study["status"] = line.strip("*")  # the draft's status line: kept in data, not shown on the page
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i])
                i += 1
                used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip() if i < len(lines) else ""
            i += 1
            used += 1
            item = builder.block(quote, ref_line)
            if current is None:
                (study["frame"] if study["frame"] else study["opening"]).append(item)
            else:
                current["blocks"].append(item)
        elif line.startswith("## "):
            head = line[3:]
            if m := re.fullmatch(r"(\d\d) ([^:]+): (.+)", head):
                builder.part = m.group(1)
                current = {"n": m.group(1), "title": typographic(m.group(2)), "turn": typographic(m.group(3)), "blocks": []}
                study["parts"].append(current)
            else:
                builder.part = "close"
                current = {"title": head, "blocks": []}
                study["close"] = current
        elif line.startswith("### "):
            if current is None or current is study.get("close"):
                raise BuildError(f"{where}: a sub-head outside any part: {line[:60]!r}")
            current["blocks"].append({"k": "h3", "t": typographic(line[4:]), "mark": mark_of(line[4:])})
        elif m := re.match(r"\*\*(Main readings|Consider|Reflect|Your question):\*\* (.*)", line):
            label, body = m.groups()
            if current is None:
                raise BuildError(f"{where}: {label} outside any part")
            if label == "Main readings":
                current["readings"] = [builder.passage(lab) for _, _, lab in builder.refs_in(body.rstrip("."))]
            else:
                current[label.lower().replace(" ", "_")] = para(builder, body, where, current)
        elif m := re.match(r"(\d)\. \*\*([^*]+)\*\* (.*)", line):
            if current is not None:
                raise BuildError(f"{where}: the three questions belong before part 01")
            study["frame"].append({"k": "q3", "n": int(m.group(1)), "ask": typographic(m.group(2)), "runs": para(builder, m.group(3), where)})
        elif line == "Read the passage again before you answer.":
            if current is None or current is not study.get("close"):
                raise BuildError(f"{where}: the closing line belongs in the close")
            current["again"] = line
        elif current is None:
            if "lead" not in study:
                study["lead"] = para(builder, line, where)
            elif study["opening"]:
                study["frame"].append({"k": "p", "runs": para(builder, line, where)})
            else:
                raise BuildError(f"{where}: a line before the opening quotation the page cannot place: {line[:60]!r}")
        else:
            block = {"k": "p", "runs": para(builder, line, where, current)}
            if "n" in current and "hook" not in current and not current["blocks"]:
                current["hook"] = block["runs"]
            else:
                current["blocks"].append(block)
    if used != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    unused = set(builder.lists.SHORT_REFS) - builder.short_used
    if unused:
        raise BuildError(f"SHORT_REFS entries the text no longer uses: {sorted(unused)}")
    check_shape(study)
    return study


def check_shape(study: dict) -> None:
    for key in ("title", "lead", "opening", "frame", "close"):
        if not study.get(key):
            raise BuildError(f"content.md has no {key}")
    if [b["n"] for b in study["frame"] if b["k"] == "q3"] != [1, 2, 3]:
        raise BuildError("the opening must carry exactly the three questions, numbered 1 to 3")
    if [p["n"] for p in study["parts"]] != ["01", "02", "03", "04", "05", "06"]:
        raise BuildError("the study must have parts 01 to 06 in order")
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if not part.get(key):
                raise BuildError(f"part {part['n']} has no {key}")
    if not study["close"].get("your_question") or not study["close"].get("again"):
        raise BuildError("the close must end with the reader's question and 'Read the passage again before you answer.'")


def check_lists(builder: Builder) -> dict:
    """Every drawn phrase is in its verse, exact case and whole words; every absence is proved absent."""
    bible, lists = builder.bible, builder.lists
    band_of = {code: band["id"] for band in lists.BANDS for code in band["books"]}
    order = list(BOOKS.values())
    lines = []
    for line in lists.MAP_LINES:
        for side in ("nt", "ot"):
            words = line[f"{side}_words"]
            if len(words.split()) < 2 or not exact_in(words, line[side], bible):
                raise BuildError(f"map line ({line['fig']}): {words!r} is not in {line[side]}")
        ot, nt = REF_RE.fullmatch(line["ot"]), REF_RE.fullmatch(line["nt"])
        code, nt_code = BOOKS[ot.group(1)], BOOKS[nt.group(1)]
        if code not in band_of:
            raise BuildError(f"map line: {line['ot']} is in none of the three parts Luke 24:44 names")
        if order.index(nt_code) < order.index("MAT"):
            raise BuildError(f"map line: {line['nt']} is not a New Testament verse")
        lines.append({**line, "ntr": builder.passage(line["nt"]), "otr": builder.passage(line["ot"]), "band": band_of[code],
                      "node": f"{code}.{ot.group(2)}", "ntnode": f"{nt_code}.{nt.group(2)}"})
    if {l["band"] for l in lines if l["fig"] != "06"} != {b["id"] for b in lists.BANDS}:
        raise BuildError("the five figures must reach all three parts Luke 24:44 names")
    pinned = [(item["ref"], item["words"]) for item in lists.FIRST.values()]
    pinned += [(s["ref"], s["words"]) for stops in lists.STOPS.values() for s in stops]
    pinned += [(lists.BEYOND["ref"], lists.BEYOND["words"]), (lists.WARNING["ref"], lists.WARNING["words"])]
    pinned += [(lists.CONCEPTS["ref"], w) for w in lists.CONCEPTS["words"]] + [(lists.MOTTO["ref"], w) for w in lists.MOTTO["lines"]]
    for label, words in pinned:
        builder.passage(label)
        if len(words.split()) < 2 or not exact_in(words, label, bible):
            raise BuildError(f"drawn phrase {words!r} is not in {label}")
    for stops in lists.STOPS.values():
        for stop in stops:
            if "absent" in stop:
                label, words = stop["absent"]
                if has_words(fold(words).lower(), plain_text(bible, label).lower()):
                    raise BuildError(f"stop: {words!r} should not be in {label}, but it is")
    return {"lines": lines,
            "first": {n: {**f, "r": builder.passage(f["ref"])} for n, f in lists.FIRST.items()},
            "stops": {n: [{**s, "r": builder.passage(s["ref"])} for s in stops] for n, stops in lists.STOPS.items()},
            "beyond": {**lists.BEYOND, "r": builder.passage(lists.BEYOND["ref"])},
            "warning": {**lists.WARNING, "r": builder.passage(lists.WARNING["ref"])}}


def check_outside(lists, text: str) -> None:
    """Each outside quotation is found in its held copy, within 1,500 characters after its marker."""
    for phrase, item in lists.OUTSIDE_QUOTES.items():
        if f'"{phrase}"' not in text:
            raise BuildError(f"outside quotation no longer in the text: {phrase!r}")
        path = (WEBSITE / item["path"]).resolve()
        if not str(path).startswith(str(WEBSITE.parent.resolve())):
            raise BuildError(f"held source outside the project: {path}")
        try:
            held = re.sub(r"\s+", " ", path.read_text(encoding="utf-8", errors="replace"))
        except OSError as error:
            raise BuildError(f"could not read held source {path}: {error}") from error
        at = held.find(item["marker"])
        if at < 0 or fold(phrase) not in fold(held[at:at + 1500]):
            raise BuildError(f"outside quotation {phrase!r} is not found after {item['marker']!r} in {path.name}")
    for title in re.findall(r"Read more in \*([^*]+)\*", text):
        if title not in lists.STUDY_LINKS:
            raise BuildError(f"named study {title!r} is not in STUDY_LINKS")
    for title, folder in lists.STUDY_LINKS.items():
        if f"*{title}*" not in text:
            raise BuildError(f"STUDY_LINKS entry the text no longer names: {title!r}")
        if folder and not (HERE.parent / folder / "index.html").is_file():
            raise BuildError(f"STUDY_LINKS: {folder}/index.html does not exist")


def build(text: str, lists, bible: dict) -> str:
    builder = Builder(bible, lists)
    study = parse(builder, text)
    drawn = check_lists(builder)
    check_outside(lists, text)
    close_key = builder.passage(lists.CLOSE_PASSAGE)
    quoted = {b["r"] for part in study["parts"] for b in part["blocks"] if b["k"] == "quote"}
    quoted |= {b["r"] for b in study["opening"] + study["frame"] if b["k"] == "quote"} | {close_key}
    named = [l for l in drawn["lines"] if l["fig"] != "06"]
    numbers = {"figures": 5, "lines": len(named), "linesAll": len(drawn["lines"]),
               "parts": len({l["band"] for l in named}), "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted),
               "references": len(builder.passages),
               "uncertain": sum(1 for l in drawn["lines"] if l["kind"] == "either")}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    heading = {"trail": lists.TRAIL, "title": lists.TITLE, "concepts": lists.CONCEPTS, "motto": lists.MOTTO,
               "close": close_key, "bands": lists.BANDS, "figures": lists.FIGURES}
    data = {"study": study, "heading": heading, "passages": builder.passages, **drawn, "numbers": numbers,
            "sources": lists.SOURCES, "outside": {k: v["source"] for k, v in lists.OUTSIDE_QUOTES.items()}, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.COT = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


SELFTEST = [
    # (what is wrong, how to make it wrong, words the refusal must contain)
    ("a changed word in a block quotation", lambda t, l: t.replace("will distinguish them", "will protect them"), "word for word"),
    ("a block quotation under the wrong reference", lambda t, l: t.replace("Exodus 12:13 · BSB", "Exodus 12:12 · BSB"), "word for word"),
    ("a changed word in a quoted phrase", lambda t, l: t.replace('"an unblemished year-old male"', '"an unblemished two-year-old male"'), "not in"),
    ("a quote cited to the wrong verse", lambda t, l: t.replace("male\" (Exodus 12:5 · BSB)", "male\" (Exodus 12:6 · BSB)"), "not in"),
    ("a reference that does not exist", lambda t, l: t.replace("(John 1:29 · BSB)", "(John 1:99 · BSB)"), "does not resolve"),
    ("a link that leaves the site", lambda t, l: t.replace("Read the passage again before you answer.", "See [this](https://example.com).\n\nRead the passage again before you answer."), "only site links"),
    ("a sub-head the page cannot place", lambda t, l: t.replace("## 01 The lamb", "### Stray\n\n## 01 The lamb"), "outside any part"),
    ("a bare reference with no book", lambda t, l: t.replace("(12:27 · BSB)", "(12:28 · BSB)"), "has no book"),
    ("an outside quotation altered", lambda t, l: t.replace("there shall be redemption", "there shall be salvation"), "not in"),
    ("a map phrase not in its verse", lambda t, l: l.MAP_LINES[0].update(nt_words="Christ, our Passover sheep"), "is not in"),
    ("an absence that is not absent", lambda t, l: l.STOPS["04"][0].update(absent=("Hebrews 1:5", "My Son")), "should not be in"),
    ("a stop phrase not in its verse", lambda t, l: l.STOPS["03"][0].update(words="Like the other high priests"), "is not in"),
]


class Lists:
    """A deep copy of study_lists, so a self-test can break one list without touching the module."""
    def __init__(self) -> None:
        for name in dir(L):
            if name.isupper():
                setattr(self, name, copy.deepcopy(getattr(L, name)))


def selftest(text: str, bible: dict) -> int:
    failures = 0
    for what, spoil, expect in SELFTEST:
        lists = Lists()
        changed = spoil(text, lists)
        wrong = changed if isinstance(changed, str) else text
        if isinstance(changed, str) and changed == text:
            print(f"  NOT TESTED  {what}: the change did not apply to the text")
            failures += 1
            continue
        try:
            build(wrong, lists, bible)
        except BuildError as error:
            ok = expect in str(error)
            print(f"  {'refused' if ok else 'WRONG REASON'}  {what}: {str(error).splitlines()[0][:110]}")
            failures += 0 if ok else 1
            continue
        print(f"  ACCEPTED  {what}")
        failures += 1
    print(f"build-data selftest: {len(SELFTEST) - failures} of {len(SELFTEST)} wrong inputs refused for the right reason")
    return 1 if failures else 0


def main() -> int:
    try:
        text = CONTENT.read_text(encoding="utf-8")
        bible = load_bible()
        if "--selftest" in sys.argv:
            return selftest(text, bible)
        output = build(text, Lists(), bible)
    except (BuildError, OSError, KeyError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
            print("build-data: stale: data.js; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    temp = OUT.with_suffix(".js.tmp")
    temp.write_text(output, encoding="utf-8", newline="\n")
    os.replace(temp, OUT)
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
