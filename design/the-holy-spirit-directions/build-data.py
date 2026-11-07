#!/usr/bin/env python3
"""Build data.js for The Holy Spirit mock-up from the study's content.md, checking it against the site's Berean text
and the held copy of the Baptist Faith and Message 2000.

Run from Website/: python design/the-holy-spirit-directions/build-data.py
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
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/the-holy-spirit/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
NOTE = re.compile(r"\s*\[check(?: before publishing)?(?::\s*([^\]]+))?\]|\[\[mis:([^\]]+)\]\]")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; 1 Corinthians" is a new book
QUOTE = re.compile(r'"([^"]+)"(?:\s*\(([^)]*)\))?')
SITE_LINK = re.compile(r"/[A-Za-z0-9/_?=&#.-]*")
MARKS = {"care": "With care", "other": "Another tradition, in its own words", "open": "Left open: Baptists differ",
         "read": "This site's reading"}
CLOSE_HEAD = "Following the light"
AGAIN = "Read the passage again before you answer."


def typographic(text: str) -> str:
    """Straight quotes become the Berean's curly ones; a quotation inside a quotation turns single."""
    text = re.sub(r'"([^"]*)"', lambda m: "“" + m.group(1).replace("“", "‘").replace("”", "’") + "”", text)
    text = re.sub(r"(^|[\s“(])'", "\\1‘", text)
    return text.replace("'", "’")


def exact_in(words: str, label: str, bible: dict) -> bool:
    return has_words(fold(words).replace('"', ""), plain_text(bible, label))


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
        """Every reference in plain text with its span, with short continuations such as "2:6, 9–11" and "3:22, 30"."""
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
            if match.group(2):
                fault = self.lists.MISQUOTED[match.group(2)]
                out.append({"chk": f"Not word for word: the Berean reads “{typographic(fault['berean'])}” at {fault['ref']}.",
                            "r": self.passage(fault["ref"])})
            else:
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
                folder = self.lists.STUDY_LINKS[italic]
                out.append({"s": f"/mockups/{folder}/" if folder else None, "t": typographic(italic)})
            elif italic in self.lists.BOOK_TITLES:
                out.append({"i": typographic(italic)})
            elif ":" in italic or len(italic.split()) >= 3:
                raise BuildError(f"italic title {italic!r} is on neither STUDY_LINKS nor BOOK_TITLES")
            else:
                out.append({"i": typographic(italic)})
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
        paragraph cites, its part's main readings or the passage printed above it, or on a named list. Pieces split by
        an ellipsis must all be in one reference, in order. A quote under three words must be on a named list."""
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
            if phrase in lists.MISQUOTED:
                fault = lists.MISQUOTED[phrase]
                if exact_in(phrase, fault["ref"], self.bible):
                    raise BuildError(f"MISQUOTED entry no longer needed: {phrase!r} is now in {fault['ref']}")
                if not exact_in(fault["berean"], fault["ref"], self.bible):
                    raise BuildError(f"MISQUOTED: the Berean words {fault['berean']!r} are not in {fault['ref']}")
                continue
            pieces = [fold(p).replace('"', "").replace("'", "").strip(" ,.?!") for p in re.split(r"\.\.\.|…", phrase)]
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


def para(builder: Builder, raw: str, where: str, section: dict | None = None) -> list:
    for phrase in builder.lists.MISQUOTED:
        raw = raw.replace(f'"{phrase}"', f'"{phrase}"[[mis:{phrase}]]')
    cited: list = []
    runs = builder.runs(raw, cited)
    nearby = list((section or {}).get("readings", []))
    last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + nearby + ([last["r"]] if last else []), where)
    for run in runs:
        text = run if isinstance(run, str) else run.get("t", run.get("i", run.get("b", "")))
        if "[" in text or "]" in text:
            raise BuildError(f"{where}: a note in square brackets the page cannot place: {text[:70]!r}")
    return runs


def parse(builder: Builder, text: str) -> dict:
    """Place every non-blank line of content.md, or fail."""
    lines = text.splitlines()
    used, i = 0, 0
    study: dict = {"opening": [], "frame": [], "parts": []}
    current = None  # a part, a question, the questions part, or the close
    questions = None
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        section = current if current is not None and current is not questions else (questions or {})
        if line.startswith("# "):
            study["title"] = line[2:]
        elif (m := re.fullmatch(r"(Concepts|Motto|Lead): (.+)", line)) and current is None:
            field, body = m.groups()
            if field == "Concepts":
                study["concepts"] = body.split(" · ")
            elif field == "Motto":
                study["motto"] = body.split(" / ")
            else:
                study["lead"] = para(builder, body, where)
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
                (study["frame"] if study["opening"] else study["opening"]).append(item)
            else:
                current["blocks"].append(item)
        elif line.startswith("## "):
            head = line[3:]
            if head == CLOSE_HEAD:
                current = study["close"] = {"title": head, "blocks": []}
            elif m := re.fullmatch(r"(0[1-6]) (.+?)(?:: (.+))?", head):
                current = {"n": m.group(1), "title": typographic(m.group(2)), "turn": typographic(m.group(3)) if m.group(3) else None, "blocks": []}
                study["parts"].append(current)
            elif m := re.fullmatch(r"07 (.+)", head):
                questions = current = study["questions"] = {"n": "07", "title": typographic(m.group(1)), "items": [], "blocks": []}
            else:
                raise BuildError(f"{where}: a heading the page does not know: {head!r}")
        elif line.startswith("### "):
            if current is None or "close" in study and current is study["close"]:
                raise BuildError(f"{where}: a sub-head outside any part: {line[:60]!r}")
            if questions is not None and current in (questions, *questions["items"]):
                current = {"title": typographic(line[4:]), "blocks": []}
                questions["items"].append(current)
            else:
                current["blocks"].append({"k": "h3", "t": typographic(line[4:])})
        elif m := re.match(r"\*\*(Main readings|Consider|Reflect|Question|Passage):\*\* (.*)", line):
            label, body = m.groups()
            owner = questions if questions is not None and current in (questions, *questions["items"]) else current
            if owner is None:
                raise BuildError(f"{where}: {label} outside any part")
            if label == "Main readings":
                owner["readings"] = [builder.passage(lab) for _, _, lab in builder.refs_in(body.rstrip("."))]
            elif label == "Passage":
                owner["passage"] = builder.passage(body.strip())
            else:
                owner[label.lower()] = para(builder, body, where, section)
        elif line == AGAIN:
            if current is None or current is not study.get("close"):
                raise BuildError(f"{where}: the closing line belongs in the close")
            current["again"] = line
        elif m := re.match(r"\[(care|other|open|read)\] (.*)", line):
            if current is None:
                raise BuildError(f"{where}: a marked note before part 01")
            current["blocks"].append({"k": "note", "mark": m.group(1), "label": MARKS[m.group(1)], "runs": para(builder, m.group(2), where, section)})
        elif current is None:
            if not study["opening"]:
                raise BuildError(f"{where}: a line before the opening quotation the page cannot place: {line[:60]!r}")
            study["frame"].append({"k": "p", "runs": para(builder, line, where)})
        else:
            block = {"k": "p", "runs": para(builder, line, where, section)}
            if ("n" in current) and "hook" not in current and not current["blocks"] and "readings" in current:
                current["hook"] = block["runs"]
            else:
                current["blocks"].append(block)
    if used != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    check_shape(study, text)
    return study


def check_shape(study: dict, text: str) -> None:
    for key in ("title", "concepts", "motto", "lead", "opening", "frame", "parts", "questions", "close"):
        if not study.get(key):
            raise BuildError(f"content.md has no {key}")
    if [p["n"] for p in study["parts"]] != ["01", "02", "03", "04", "05", "06"]:
        raise BuildError("the study must have parts 01 to 06 in order")
    for part in study["parts"] + [study["questions"]]:
        for key in ("readings", "hook", "consider", "reflect"):
            if not part.get(key):
                raise BuildError(f"part {part['n']} has no {key}")
    counted = {"Five": 5}
    said = re.match(r"(\w+) questions", "".join(r for r in study["questions"]["hook"] if isinstance(r, str)))
    if not said or counted.get(said.group(1)) != len(study["questions"]["items"]):
        raise BuildError(f"part 07 says {said.group(1) if said else 'nothing'} questions but has {len(study['questions']['items'])}")
    close = study["close"]
    if not all(close.get(k) for k in ("question", "again", "passage")):
        raise BuildError("the close must end with **Question:**, the 'Read the passage again' line, and **Passage:**")
    if not (text.index("**Question:**") < text.index(AGAIN) < text.index("**Passage:**")):
        raise BuildError("the close must run Question, then 'Read the passage again before you answer.', then Passage")
    if len(study["motto"]) != 2:
        raise BuildError("the motto must have two lines, split by ' / '")


def check_lists(builder: Builder, study: dict, text: str) -> dict:
    """Every drawn phrase is in its verse, exact case and whole words; every count is computed, not typed."""
    bible, lists = builder.bible, builder.lists

    def pin(label: str, words: str, what: str) -> str:
        key = builder.passage(label)
        if not exact_in(words, label, bible):
            raise BuildError(f"{what}: {words!r} is not in {label}")
        return key

    parts = {p["n"] for p in study["parts"]}
    if set(lists.CONCEPT_OF_PART) != parts or set(lists.CONCEPT_OF_PART.values()) != set(study["concepts"]):
        raise BuildError("CONCEPT_OF_PART must give every part one of the heading's concepts, and use every concept")
    targets = {t["id"] for t in lists.TARGETS}
    close_text = " ".join("".join(r if isinstance(r, str) else r.get("t", "") for r in b["runs"]) for b in study["close"]["blocks"] if b["k"] == "p")
    beams = []
    for beam in lists.BEAMS:
        if beam["target"] not in targets or beam["part"] not in parts:
            raise BuildError(f"beam {beam['ref']}: unknown target or part")
        if typographic(beam["close"]) not in close_text:
            raise BuildError(f"beam {beam['ref']}: the close does not say {beam['close']!r}")
        beams.append({**beam, "r": pin(beam["ref"], beam["words"], "beam")})
    for target in lists.TARGETS:
        if target["words"] not in text:
            raise BuildError(f"target {target['name']!r}: the study does not say {target['words']!r}")
        if sum(1 for b in beams if b["target"] == target["id"]) != 2:
            raise BuildError(f"target {target['name']!r} must have two beams")
    if sorted(b["part"] for b in beams) != sorted(parts):
        raise BuildError("every part must have exactly one beam")
    does = [{**d, "r": pin(d["ref"], d["words"], "what He does")} for d in lists.DOES]
    if any(d["part"] not in parts for d in does) or {d["part"] for d in does} != parts:
        raise BuildError("every part must have at least one line of what the Spirit does, and no other part may")
    strips = {}
    for n, strip in lists.STRIPS.items():
        steps = [{"label": label, "r": pin(ref, words, f"strip {n}"), "label_ref": ref, "words": words} for label, ref, words in strip["steps"]]
        if strip.get("note") and strip["note"] not in text:
            raise BuildError(f"strip {n}: its note {strip['note']!r} is not the study's words")
        strips[n] = {**strip, "steps": steps}
    nations = {**lists.NATIONS, "r": builder.passage(lists.NATIONS["ref"]), "hr": pin(*lists.NATIONS["heard"], "Acts 2 line")}
    for word in lists.NATIONS["words"]:
        pin(lists.NATIONS["ref"], word, "nations")
    flesh, fruit = lists.FLESH, lists.FRUIT
    for word in flesh["words"]:
        pin(flesh["ref"], word, "acts of the flesh")
    pin(*flesh["middle"], "the flesh's middle run")
    if f'"{flesh["middle"][1]}"' not in text:
        raise BuildError("the flesh's middle run must be the words the study itself quotes")
    middle = [w for w in flesh["words"] if has_words(w, flesh["middle"][1])]
    for word in fruit["words"]:
        pin(fruit["ref"], word, "fruit of the Spirit")
    pin(*fruit["singular"], "fruit, singular")
    named_line = next((line for line in text.splitlines() if "stand out in a quarrelling church" in line), "")
    if not set(fruit["named"]) <= set(fruit["words"]) or not all(w in named_line for w in fruit["named"]):
        raise BuildError("the four named qualities must be in the fruit and in the study's own sentence")
    gifts = []
    for item in lists.GIFTS:
        for word in item["words"]:
            pin(item["ref"], word, f"gifts in {item['name']}")
        gifts.append({**item, "r": builder.passage(item["ref"])})
    shared = [w for w in gifts[0]["words"] if w in gifts[1]["words"]]
    readings = [r for p in study["parts"] for r in p["readings"]]
    if len(readings) != lists.READINGS_CLAIMED or "These eight passages" not in text:
        raise BuildError(f"eight passages: the study must say 'These eight passages', READINGS_CLAIMED must be 8 "
                         f"(it is {lists.READINGS_CLAIMED}), and parts 01-06 must have 8 main readings (they have {len(readings)})")
    return {"beams": beams, "targets": lists.TARGETS, "does": does, "strips": strips, "nations": nations,
            "flesh": {**flesh, "r": builder.passage(flesh["ref"]), "middleWords": middle},
            "fruit": {**fruit, "r": builder.passage(fruit["ref"])}, "gifts": gifts, "shared": shared,
            "readings": len(readings)}


def check_outside(lists, text: str) -> None:
    """Each held quotation is found in its held copy, within 1,500 characters after its marker; every named list
    entry is still used by the text; every linked study's mock-up exists."""
    for phrase, item in lists.HELD_QUOTES.items():
        if f'"{phrase}"' not in text:
            raise BuildError(f"held quotation no longer in the text: {phrase!r}")
        path = (WEBSITE / item["path"]).resolve()
        if not path.is_relative_to(WEBSITE.resolve()):
            raise BuildError(f"held source outside the Website folder: {path}")
        try:
            held = re.sub(r"\s+", " ", path.read_text(encoding="utf-8", errors="replace"))
        except OSError as error:
            raise BuildError(f"could not read held source {path}: {error}") from error
        at = held.find(item["marker"])
        if at < 0 or fold(phrase) not in fold(held[at:at + 1500]):
            raise BuildError(f"held quotation {phrase!r} is not found after {item['marker']!r} in {path.name}")
    for name in ("NOT_HELD_QUOTES", "OWN_TERMS", "MISQUOTED", "PINNED_SHORT"):
        for phrase in getattr(lists, name):
            if f'"{phrase}"' not in text:
                raise BuildError(f"{name} entry the text no longer quotes: {phrase!r}")
    for title, folder in lists.STUDY_LINKS.items():
        if f"*{title}*" not in text:
            raise BuildError(f"STUDY_LINKS entry the text no longer names: {title!r}")
        if folder and not (HERE.parent / folder / "index.html").is_file():
            raise BuildError(f"STUDY_LINKS: {folder}/index.html does not exist")


def build(text: str, lists, bible: dict) -> str:
    builder = Builder(bible, lists)
    study = parse(builder, text)
    drawn = check_lists(builder, study, text)
    check_outside(lists, text)
    if study["close"]["passage"] != ref_id(lists.CLOSE_PASSAGE):
        raise BuildError(f"the close's passage must be {lists.CLOSE_PASSAGE}")
    blocks = [b for p in study["parts"] for b in p["blocks"]] + [b for q in study["questions"]["items"] for b in q["blocks"]]
    quoted = {b["r"] for b in blocks + study["opening"] + study["frame"] if b["k"] == "quote"} | {study["close"]["passage"]}
    numbers = {"readings": drawn.pop("readings"), "targets": len(lists.TARGETS),
               "verbs": sum(1 for d in drawn["does"] if d.get("verb")),
               "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted),
               "references": len(builder.passages), "questions": len(study["questions"]["items"])}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    heading = {"trail": lists.TRAIL, "title": lists.TITLE, "closeTitle": lists.CLOSE_TITLE, "back": lists.BACK,
               "conceptOf": lists.CONCEPT_OF_PART}
    outside = {**{k: v["source"] for k, v in lists.HELD_QUOTES.items()}, **lists.NOT_HELD_QUOTES}
    data = {"study": study, "heading": heading, "passages": builder.passages, **drawn, "numbers": numbers,
            "sources": lists.SOURCES, "outside": outside, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.HS = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


class Lists:
    """A deep copy of study_lists, so a self-test can break one list without touching the module."""
    def __init__(self) -> None:
        for name in dir(L):
            if name.isupper():
                setattr(self, name, copy.deepcopy(getattr(L, name)))


def write(output: str) -> None:
    """Write through a temporary file in the same folder, so a failed write never leaves half a data.js."""
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
