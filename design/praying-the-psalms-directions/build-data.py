#!/usr/bin/env python3
"""Build data.js for The book of Psalms mock-up from the study's content.md, checking it against the site's Berean.

Run from Website/: python design/praying-the-psalms-directions/build-data.py
  --check     run every check and fail if data.js is not what this build would write
  --selftest  feed wrong inputs in memory and fail unless every one is refused (writes nothing)
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import hashlib
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from scripture_text import BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402
from psalter import all_notes, read_psalter, stanzas_119  # noqa: E402
from refs import Finder  # noqa: E402
import study_lists as lists  # noqa: E402
from facts import check_claims, extras  # noqa: E402

WEBSITE = HERE.parents[1]
PROJECT = WEBSITE.parent
CONTENT = WEBSITE / "content/studies/christian-life/praying-the-psalms/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
QUOTE = re.compile(r'"([^"]+)"(?:\s*\(([^)]*)\))?')
SITE_LINK = re.compile(r"/(?!/)[^\s\\<>\"']*")


def held_text(relative: str) -> str:
    """A held outside source, folded so OCR line breaks, hyphens and tags do not hide a match."""
    path = (PROJECT / relative).resolve()
    if not path.is_relative_to(PROJECT.resolve()):
        raise BuildError(f"held source outside the project: {relative}")
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"held source missing, so its quotation cannot be checked: {path}: {error}") from error
    if path.suffix == ".xml":
        raw = re.sub(r"<note.*?</note>", " ", raw, flags=re.S)
        raw = re.sub(r"<[^>]+>", " ", raw)
    return squash(raw)


def squash(text: str) -> str:
    """Letters and punctuation only: a scan's line breaks, spaces and hyphens may fall anywhere, so all are dropped."""
    return re.sub(r"[\s\-]+", "", fold(text).replace("&amp;", "&"))


class Builder:
    def __init__(self, bible: dict, psalms: list) -> None:
        self.bible, self.psalms = bible, psalms
        self.finder = Finder(bible)
        self.passages: dict = {}
        self.held: dict = {}

    def passage(self, label: str) -> str:
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def key(self, kind: str, value) -> str:
        if kind == "p":
            return self.passage(value)
        if kind == "ps":
            return f"PS.{value}"
        return f"PSR.{value[0]}-{value[1]}"

    def text_of(self, key: str) -> str:
        """The words a quotation may come from: a passage's verses, or a psalm's heading and every verse."""
        if key.startswith("PSR."):
            first, last = map(int, key[4:].split("-"))
            return " ".join(self.text_of(f"PS.{n}") for n in range(first, last + 1))
        if key.startswith("PS."):
            record = self.psalms[int(key[3:]) - 1]
            return (record["heading"] + " " + plain_text(self.bible, f"Psalm {record['n']}:1–{record['verses']}")).replace('"', "")
        return plain_text(self.bible, self.passages[key]["label"])

    def label_key(self, label: str) -> str:
        found = self.finder.find(label)
        if len(found) != 1:
            raise BuildError(f"not one reference: {label!r}")
        return self.key(*found[0][2:])

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t} (a site link), {r,t} (a reference), {s,t} (a named study)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.fullmatch(url):
                    raise BuildError(f"only links on this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": self.plain_runs(bold, cited)})
            elif italic in lists.STUDY_LINKS:
                out.append({"s": lists.STUDY_LINKS[italic], "t": italic})
            else:
                out.append({"i": typographic(italic)})
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for start, end, kind, value in self.finder.find(text):
            if start > last:
                out.append(typographic(text[last:start]))
            key = self.key(kind, value)
            cited.append(key)
            out.append({"r": key, "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        return [run for run in out if run != ""]

    def outside(self, phrase: str) -> bool:
        if phrase in lists.OUTSIDE_BY_EYE:
            return True
        if phrase not in lists.OUTSIDE_QUOTES:
            return False
        _, relative = lists.OUTSIDE_QUOTES[phrase]
        if relative not in self.held:
            self.held[relative] = held_text(relative)
        squashed = squash(phrase)  # a quotation may start mid-sentence, so its first letter's case is free
        if not any(v in self.held[relative] for v in (squashed, squashed[:1].upper() + squashed[1:], squashed[:1].lower() + squashed[1:])):
            raise BuildError(f"outside quotation not found in its held source {relative}: {phrase!r}")
        return True

    def from_notes(self, phrase: str) -> bool:
        if phrase not in lists.NOTE_QUOTES:
            return False
        number = lists.NOTE_QUOTES[phrase]
        if not any(fold(phrase) in note for note in all_notes(number)):
            raise BuildError(f"the Berean's notes on Psalm {number} do not hold {phrase!r}")
        return True

    def check_quotes(self, raw: str, pool: list, where: str) -> None:
        """Each quoted phrase is in the reference right after it; failing that, in one bound to it, or in a verse its
        paragraph cites, its part's main readings or the passage printed above. One word alone must be bound."""
        found = self.finder.find(raw)
        for match in QUOTE.finditer(raw):
            phrase = match.group(1)
            if phrase in lists.OWN_TERMS or self.outside(phrase) or self.from_notes(phrase):
                continue
            own = [self.key(kind, value) for start, _, kind, value in found if match.end(1) < start < match.end()]
            bare_phrase = phrase.rstrip("!?.,")
            if bare_phrase in lists.QUOTE_REFS:
                own = [self.label_key(lists.QUOTE_REFS[bare_phrase])]
            pieces = [p.strip(" ,.") for p in re.split(r"…|\.\.\.", phrase) if p.strip(" ,.")]
            if not own and len(pieces) == 1 and len(pieces[0].split()) == 1:
                raise BuildError(f"{where}: one quoted word, {phrase!r}, with no reference bound to it; add it to QUOTE_REFS or OWN_TERMS")
            texts = [self.text_of(k).replace("'", "") for k in (own or pool)]
            for piece in pieces:
                folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")
                variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
                if not any(has_words(v, t) for v in variants for t in texts):
                    named = ", ".join(self.passages[k]["label"] if k in self.passages else k for k in (own or pool)) or "none"
                    raise BuildError(f"{where}: quoted words {piece!r} are not in {'the reference after them' if own else 'any verse this paragraph cites'} ({named})")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = fold(" ".join(line.removeprefix(">").strip() for line in quote_lines)).replace('"', "")
        if heading := re.fullmatch(r"Heading of Psalm (\d+)", label):
            number = int(heading.group(1))
            if not 1 <= number <= 150 or quoted != self.psalms[number - 1]["heading"].replace('"', ""):
                raise BuildError(f"block quotation is not word for word the heading of Psalm {number}: {quoted!r}")
            return {"k": "quote", "r": f"PS.{number}", "label": label, "heading": True}
        key = self.label_key(label)
        if quoted != plain_text(self.bible, self.passages[key]["label"]):
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {plain_text(self.bible, label)}")
        return {"k": "quote", "r": key, "label": label}


def para(builder: Builder, raw: str, where: str, section: dict | None) -> list:
    cited: list = []
    runs = builder.runs(typographic(raw), cited)  # curl quotes across the whole line, so a quote may span italics
    nearby = list((section or {}).get("readings", []))
    blocks = (section or {}).get("blocks", [])
    last = next((b for b in reversed(blocks) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + nearby + ([last["r"]] if last else []), where)
    return runs


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"opening": [], "parts": []}
    current, placed, i = None, 0, 0
    target = lambda: current["blocks"] if current else study["opening"]  # noqa: E731
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        placed += 1
        where = f"content.md line {i}"
        if line.startswith("# "):
            study["title"] = line[2:]
        elif re.fullmatch(r"\*\*Study \d+ · [^*]+\*\*", line):
            study["meta"] = line.strip("*")
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; placed += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: block quotation with no reference line after it")
            ref_line = lines[i].strip(); i += 1; placed += 1
            target().append(builder.block(quote, ref_line))
        elif line.startswith("## "):
            head = line[3:]
            if m := re.fullmatch(r"(\d\d) (.+)", head):
                current = {"n": m.group(1), "title": m.group(2), "blocks": []}
                study["parts"].append(current)
            else:
                current = {"title": head, "blocks": []}
                study["close"] = current
        elif line.startswith("### "):
            current["blocks"].append({"k": "h3", "t": line[4:]})
        elif m := re.fullmatch(r"\*\*(Main readings|Consider|Reflect|Your question):\*\* (.*)", line):
            label, body = m.groups()
            if current is None:
                raise BuildError(f"{where}: {label} outside any part")
            if label == "Main readings":
                cited: list = []
                current["readings_runs"] = builder.runs(body, cited)
                current["readings"] = cited
            else:
                current[label.lower().replace(" ", "_")] = para(builder, body, where, current)
        elif m := re.fullmatch(r"(- |\d\. )(.*)", line):
            kind = "ul" if m.group(1) == "- " else "ol"
            item = para(builder, m.group(2), where, current)
            blocks = target()
            if blocks and blocks[-1]["k"] == kind:
                blocks[-1]["items"].append(item)
            else:
                blocks.append({"k": kind, "items": [item]})
        elif current is not None and "readings" in current and "hook" not in current and not current["blocks"]:
            current["hook"] = para(builder, line, where, current)
        elif current is not None and current is study.get("close") and line == "Read the passage again before you answer.":
            current["again"] = line
        elif re.match(r"#|\||<|\[check|```|\* ", line):
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        else:
            target().append({"k": "p", "runs": para(builder, line, where, current)})
    total = sum(1 for line in lines if line.strip())
    if placed != total:
        raise BuildError(f"{total - placed} lines of content.md were not placed on the page")
    for key in ("title", "meta", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
    if "your_question" not in study["close"] or "again" not in study["close"]:
        raise BuildError("the close needs its question and 'Read the passage again before you answer.'")
    return study


def psalms_cited(builder: Builder, part: dict) -> list:
    """Every psalm a part names anywhere, for the strip that shows where in the book the part reads."""
    keys = set(part["readings"])
    def walk(node):
        if isinstance(node, dict):
            if "r" in node:
                keys.add(node["r"])
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)
    walk(part)
    numbers = set()
    for key in keys:
        if key.startswith("PSR."):
            first, last = map(int, key[4:].split("-"))
            numbers.update(range(first, last + 1))
        elif key.startswith("PS."):
            numbers.add(int(key[3:]))
        elif key.startswith("PSA."):
            label = builder.passages[key]["label"]
            m = re.fullmatch(r"Psalm (\d+):\d+(?:–(?:(\d+):)?\d+)?", label)
            numbers.update(range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1))
    return sorted(numbers)


def build(content_text: str | None = None) -> str:
    bible = load_bible()
    psalms = read_psalter(bible)
    builder = Builder(bible, psalms)
    text = CONTENT.read_text(encoding="utf-8") if content_text is None else content_text
    study = parse(builder, text)
    for part in study["parts"]:
        part["psalms"] = psalms_cited(builder, part)
    facts = check_claims(bible, psalms, text, stanzas_119())
    extra = extras(builder, bible, psalms, stanzas_119())
    for record in psalms:
        record["cited"] = [[verse, builder.passage(label)] for verse, label in record["cited"]]
    inputs = [CONTENT, *(HERE / name for name in ("build-data.py", "scripture_text.py", "psalter.py", "refs.py", "facts.py", "study_lists.py"))]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs} if content_text is None else {}
    data = {"study": study, "concepts": lists.CONCEPTS, "motto": lists.MOTTO, "passages": dict(sorted(builder.passages.items())),
            "psalms": psalms, "facts": facts, **extra, "related": lists.RELATED, "sources": lists.SOURCES,
            "outside": {k: v[0] for k, v in lists.OUTSIDE_QUOTES.items()} | lists.OUTSIDE_BY_EYE, "built_from": prints}
    import json
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.PS = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    if "--selftest" in sys.argv:
        from selftest import run_selftest
        return run_selftest(build, CONTENT, OUT)
    try:
        output = build()
    except (BuildError, OSError, KeyError, IndexError, TypeError, ValueError, AttributeError) as error:
        print(f"build-data: FAILED: {type(error).__name__}: {error}", file=sys.stderr)
        return 1
    encoded = output.encode("utf-8")
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_bytes() != encoded:
            print(f"build-data: stale: {OUT.name} is not what this build writes; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    temporary = OUT.with_suffix(".js.tmp")
    temporary.write_bytes(encoded)
    os.replace(temporary, OUT)
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(encoded):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
