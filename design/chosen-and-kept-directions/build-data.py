#!/usr/bin/env python3
"""Build data.js for the Chosen and kept mock-up from the study's content.md, checking it against the site's Berean
text and the held copy of the Baptist Faith and Message 2000.

Run from Website/: python design/chosen-and-kept-directions/build-data.py
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
from scripture_text import CANON, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/chosen-and-kept/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
NOTE = re.compile(r"\s*\[check(?: before publishing)?(?::\s*([^\]]+))?\]|\[\[mis:([^\]]+)\]\]")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; 1 John" is a new book
QUOTE = re.compile(r'"([^"]+)"(?:\s*\(([^)]*)\))?')
SITE_LINK = re.compile(r"/[A-Za-z0-9/_?=&#.-]*")
CLOSE_HEAD = "Closing: Held, and knowing it"
AGAIN = "Read the passage again before you answer."
GOSPELS = {"MAT", "MRK", "LUK", "JHN"}
LETTERS = set(CANON[CANON.index("ROM"):CANON.index("JUD") + 1])  # Romans to Jude


def typographic(text: str) -> str:
    """Straight quotes become the Berean's curly ones; a quotation inside a quotation turns single."""
    text = re.sub(r'"([^"]*)"', lambda m: "“" + m.group(1).replace("“", "‘").replace("”", "’") + "”", text)
    text = re.sub(r"(^|[\s“(])'", "\\1‘", text)
    return text.replace("'", "’")


def exact_in(words: str, label: str, bible: dict, any_case: bool = False) -> bool:
    text, words = plain_text(bible, label), fold(words).replace('"', "")
    variants = {words, words[:1].lower() + words[1:], words[:1].upper() + words[1:]} if any_case else {words}
    return any(has_words(v, text) for v in variants)


class Builder:
    def __init__(self, bible: dict, lists) -> None:
        self.bible, self.lists = bible, lists
        self.passages: dict = {}

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        code, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "sec": "gospels" if code in GOSPELS else "epistles" if code in LETTERS else "other",
                              "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str) -> list:
        """Every reference in plain text with its span, with short continuations such as "6:1, 12, 14"."""
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
                if not exact_in(phrase, lists.PINNED_SHORT[phrase], self.bible, any_case=True):
                    raise BuildError(f"{where}: pinned quotation {phrase!r} is not in {lists.PINNED_SHORT[phrase]}")
                continue
            if phrase in lists.MISQUOTED:
                fault = lists.MISQUOTED[phrase]
                if all(in_order([p], plain_text(self.bible, fault["ref"])) for p in split_pieces(phrase)):
                    raise BuildError(f"MISQUOTED entry no longer needed: {phrase!r} is now in {fault['ref']}")
                if not exact_in(fault["berean"], fault["ref"], self.bible):
                    raise BuildError(f"MISQUOTED: the Berean words {fault['berean']!r} are not in {fault['ref']}")
                continue
            pieces = split_pieces(phrase)
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
        # A verse that ends on a dash runs straight on into the next one, with no space ("the coming age—and then").
        verses = [text for _, text in self.passages[key]["verses"]]
        bible = fold("".join(text if i == 0 or verses[i - 1].endswith("—") else " " + text
                             for i, text in enumerate(verses))).replace('"', "")
        if fold(quoted).replace('"', "") != bible:
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label}


def split_pieces(phrase: str) -> list:
    pieces = [fold(p).replace('"', "").replace("'", "").strip(" ,.?!") for p in re.split(r"\.\.\.|…", phrase)]
    return [p for p in pieces if p]


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


def take_quote(builder: Builder, lines: list, i: int, first: str) -> tuple:
    """A block quotation and the '<reference> · BSB' line under it; returns the block, the next index and lines used."""
    quote, used = [first], 1
    while i < len(lines) and lines[i].startswith(">"):
        quote.append(lines[i])
        i, used = i + 1, used + 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    ref_line = lines[i].strip() if i < len(lines) else ""
    return builder.block(quote, ref_line), i + 1, used + 1


def parse(builder: Builder, text: str) -> dict:
    """Place every non-blank line of content.md, or fail."""
    lines = text.splitlines()
    used, i = 0, 0
    study: dict = {"opening": [], "frame": [], "parts": []}
    current = None  # a part, or the close
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
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
            item, i, more = take_quote(builder, lines, i, line)
            used += more - 1
            if current is None:
                (study["frame"] if study["opening"] else study["opening"]).append(item)
            else:
                current["blocks"].append(item)
        elif line.startswith("## "):
            head = line[3:]
            if head == CLOSE_HEAD:
                current = study["close"] = {"title": head, "blocks": []}
            elif m := re.fullmatch(r"(0[1-7]) (.+?)(?:: (.+))?", head):
                current = {"n": m.group(1), "title": typographic(m.group(2)), "turn": typographic(m.group(3)) if m.group(3) else None, "blocks": []}
                study["parts"].append(current)
            else:
                raise BuildError(f"{where}: a heading the page does not know: {head!r}")
        elif line.startswith("### "):
            if current is None or current is study.get("close"):
                raise BuildError(f"{where}: a sub-head outside any part: {line[:60]!r}")
            current["blocks"].append({"k": "h3", "t": typographic(line[4:])})
        elif m := re.match(r"\*\*(Main readings|Consider|Reflect|Question|Passage):\*\* (.*)|(Passage): (.*)", line):
            label, body = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
            if current is None:
                raise BuildError(f"{where}: {label} outside any part")
            if label == "Main readings":
                main, _, quoted = body.rstrip(".").partition("; quoted, ")
                current["readings"] = [builder.passage(lab) for _, _, lab in builder.refs_in(main)]
                current["quoted"] = [builder.passage(lab) for _, _, lab in builder.refs_in(quoted)]
            elif label == "Passage":
                current["passage"] = builder.passage(body.strip())
            else:
                current[label.lower()] = para(builder, body, where, current)
        elif line.strip("*") == AGAIN:
            if current is None or current is not study.get("close"):
                raise BuildError(f"{where}: the closing line belongs in the close")
            current["again"] = AGAIN
        elif current is None:
            if not study["opening"]:
                raise BuildError(f"{where}: a line before the opening quotation the page cannot place: {line[:60]!r}")
            study["frame"].append({"k": "p", "runs": para(builder, line, where)})
        else:
            block = body_block(builder, line, where, current)
            if block["k"] != "skip":
                current["blocks"].append(block)
    if used != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    check_shape(study, text)
    return study


def body_block(builder: Builder, line: str, where: str, current: dict) -> dict:
    """One line inside a part: the hook, a marked note, a list item, or a paragraph. List items join the list above."""
    if m := re.fullmatch(r"\*Hook:\* (.+)", line):
        if "n" not in current or "hook" in current:
            raise BuildError(f"{where}: a hook outside a part, or a second hook")
        current["hook"] = para(builder, m.group(1), where, current)
        return {"k": "hook", "runs": current["hook"]}
    if m := re.fullmatch(r"\[care\] (.+)", line):
        return {"k": "care", "runs": para(builder, m.group(1), where, current)}
    if m := re.fullmatch(r"(?:- |(\d)\. )(.+)", line):
        kind = "ol" if m.group(1) else "ul"
        item = para(builder, m.group(2), where, current)
        last = current["blocks"][-1] if current["blocks"] else None
        if last and last["k"] == kind:
            last["items"].append(item)
            return {"k": "skip"}
        return {"k": kind, "items": [item]}
    return {"k": "p", "runs": para(builder, line, where, current)}


def check_shape(study: dict, text: str) -> None:
    for key in ("title", "concepts", "motto", "lead", "opening", "frame", "parts", "close"):
        if not study.get(key):
            raise BuildError(f"content.md has no {key}")
    if [p["n"] for p in study["parts"]] != ["01", "02", "03", "04", "05", "06", "07"]:
        raise BuildError("the study must have parts 01 to 07 in order")
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if not part.get(key):
                raise BuildError(f"part {part['n']} has no {key}")
    close = study["close"]
    if not all(close.get(k) for k in ("question", "again", "passage")):
        raise BuildError("the close must end with **Question:**, the 'Read the passage again' line, and Passage:")
    if not (text.index("**Question:**") < text.index(AGAIN) < text.index("\nPassage: ")):
        raise BuildError("the close must run Question, then 'Read the passage again before you answer.', then Passage")
    if len(study["motto"]) != 2:
        raise BuildError("the motto must have two lines, split by ' / '")
    seven = study["parts"][6]["blocks"]
    if not seven or seven[0]["k"] != "care" or "988" not in json.dumps(seven[0], ensure_ascii=False):
        raise BuildError("part 07 must open with its crisis note, before anything else, as the study places it")


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
    import figures_data
    builder = Builder(bible, lists)
    study = parse(builder, text)
    drawn = figures_data.check(builder, study, text, exact_in, typographic)
    check_outside(lists, text)
    if study["close"]["passage"] != ref_id(lists.CLOSE_PASSAGE):
        raise BuildError(f"the close's passage must be {lists.CLOSE_PASSAGE}")
    blocks = [b for p in study["parts"] for b in p["blocks"]]
    quoted = {b["r"] for b in blocks + study["opening"] + study["frame"] if b["k"] == "quote"} | {study["close"]["passage"]}
    numbers = {**drawn.pop("numbers"), "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted),
               "references": len(builder.passages)}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "figures_data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    heading = {"trail": lists.TRAIL, "title": lists.TITLE, "closeTitle": lists.CLOSE_TITLE, "back": lists.BACK}
    outside = {**{k: v["source"] for k, v in lists.HELD_QUOTES.items()}, **lists.NOT_HELD_QUOTES}
    data = {"study": study, "heading": heading, "passages": builder.passages, **drawn, "numbers": numbers,
            "sources": lists.SOURCES, "outside": outside, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.CK = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


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
