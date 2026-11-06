#!/usr/bin/env python3
"""Build data.js for The good news mock-up from the study's content.md, checking it against the site's Berean text.

Run from Website/: python design/the-good-news-directions/build-data.py   (add --check to verify without writing)
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from scripture_text import REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402
from study_lists import FACTS, LOST_THINGS, NEWS_ROWS, OUTSIDE_QUOTES, OWN_TERMS, SOURCES, STUDY_LINKS  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/the-good-news/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])")
FIELDS = ("Concepts", "Motto", "Lead", "Frame", "Selection", "Way", "Invite", "Question", "Again", "Passage")


class Builder:
    def __init__(self, bible: dict) -> None:
        self.bible = bible
        self.passages: dict = {}

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str) -> list:
        """Every reference in plain text, with its span, including short continuations such as "15:6, 9"."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chap = more.group(2) or (match.group(4) or chapter)
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chap}:{more.group(3)}{tail}", ))
                end = more.end()
        return found

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not url.startswith("/"):
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            elif italic in STUDY_LINKS:
                out.append({"s": STUDY_LINKS[italic], "t": italic})
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
            out.append({"r": key, "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, cited: list, where: str) -> None:
        """Each quoted phrase is in a verse its own paragraph cites, or on the named outside or own-term lists."""
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            if phrase in OUTSIDE_QUOTES or phrase in OWN_TERMS:
                continue
            pieces = [p.strip(" ,.") for p in phrase.split("…") if p.strip(" ,.")]
            # A quote with its own reference right after it must be in that reference, not just somewhere nearby.
            own = [ref_id(label.replace("-", "–")) for _, _, label in self.refs_in(after or "")]
            texts = [plain_text(self.bible, self.passages[k]["label"]).replace("'", "") for k in (own or cited)]
            for piece in pieces:
                folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")  # a nested quote is single on the page, double in the verse
                variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
                if not any(has_words(v, t) for v in variants for t in texts):
                    raise BuildError(f"{where}: quoted words {piece!r} are not in any verse this paragraph cites "
                                     f"({', '.join(self.passages[k]['label'] for k in cited) or 'none'})")

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
    """A paragraph may quote the verses it cites, its section's main readings, or the passage printed just above it."""
    cited: list = []
    runs = builder.runs(typographic(raw), cited)  # curl quotes across the whole line, so a quote may span italics
    nearby = list((section or {}).get("readings", []))
    last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + nearby + ([last["r"]] if last else []), where)
    return runs


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    used = 0
    study: dict = {"parts": [], "questions": []}
    current = None
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        if line.startswith("# "):
            title, _, sub = line[2:].partition(": ")
            study["title"], study["subtitle"] = title, sub
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip(); i += 1; used += 1
            item = builder.block(quote, ref_line)
            (current["blocks"] if current else study.setdefault("opening", [])).append(item)
        elif line.startswith("## "):
            head = line[3:]
            if head.startswith("Question: "):
                current = {"title": head[10:], "blocks": []}
                study["questions"].append(current)
            elif head.startswith("Close: "):
                current = None
                study["close"] = {"title": head[7:]}
            else:
                number, _, title = head.partition(" ")
                current = {"n": number, "title": title, "blocks": []}
                study["parts"].append(current)
        elif line.startswith("### "):
            current["blocks"].append({"k": "h3", "t": line[4:]})
        elif m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line):
            label, body = m.groups()
            if label == "Main readings":
                current["readings"] = [builder.passage(r.strip()) for r in body.split(";")]
            else:
                current[label.lower()] = para(builder, body, where, current)
        elif m := re.match(r"\*\*([^*]+)\.\*\* (.*)", line):
            current["blocks"].append({"k": "step", "label": m.group(1), "runs": para(builder, m.group(2), where, current)})
        elif line.startswith("[care] "):
            current["blocks"].append({"k": "care", "runs": para(builder, line[7:], where, current)})
        elif line.startswith("Its limits: "):
            current["blocks"].append({"k": "limits", "runs": para(builder, line[12:], where, current)})
        elif (m := re.match(r"([A-Z][a-z]+): (.*)", line)) and m.group(1) in FIELDS:
            field, body = m.groups()
            target = study["close"] if "close" in study else study
            if field == "Concepts":
                target["concepts"] = body.split(" · ")
            elif field == "Motto":
                target["motto"] = body.split(" / ")
            elif field == "Passage":
                target["passage"] = builder.passage(body)
            else:
                target[field.lower()] = para(builder, body, where)
        elif current is not None:
            current["blocks"].append({"k": "p", "runs": para(builder, line, where, current)})
        else:
            raise BuildError(f"{where}: a line outside any section that the page does not know how to place: {line[:60]!r}")
    total = sum(1 for line in lines if line.strip())
    if used != total:
        raise BuildError(f"{total - used} lines of content.md were not placed on the page")
    for key in ("title", "concepts", "motto", "lead", "opening", "frame", "selection", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    return study


def check_lists(builder: Builder) -> tuple:
    bible = builder.bible
    rows = []
    for row in NEWS_ROWS:
        builder.passage(row["ref"])
        if not has_words(fold(row["news"]), plain_text(bible, row["ref"])):
            raise BuildError(f"news row: {row['news']!r} is not in {row['ref']}")
        then = row.get("then_ref") or row["ref"]
        if row["response"] is None:
            if row["open_check"] in plain_text(bible, row["open_ref"]):
                raise BuildError(f"news row says {row['open_ref']} leaves it open, but it holds {row['open_check']!r}")
            then = row["open_ref"]
        elif not has_words(fold(row["response"]), plain_text(bible, then)):
            raise BuildError(f"news row: {row['response']!r} is not in {then}")
        rows.append({**row, "r": ref_id(row["ref"]), "then": builder.passage(then)})
    lost = []
    for item in LOST_THINGS:
        pairs = [(item["ref"], item["count_words"]), (item.get("search_ref", item["ref"]), item["search"]), (item["end_ref"], item["end"])]
        for label, phrase in pairs:
            builder.passage(label)
            if not has_words(fold(phrase), plain_text(bible, label)):
                raise BuildError(f"Luke 15 drawing: {phrase!r} is not in {label}")
        lost.append({**item, "r": builder.passage(item["ref"]), "sr": builder.passage(item.get("search_ref", item["ref"])), "er": builder.passage(item["end_ref"])})
    if [i["count"] for i in LOST_THINGS] != [100, 10, 2]:
        raise BuildError("the Luke 15 counts must be 100, 10 and 2, as the verses say")
    for fact in FACTS:
        for label, phrase in fact["in"]:
            if phrase not in plain_text(bible, label):
                raise BuildError(f"fact {fact['says']!r}: {phrase!r} should be in {label}")
        for label, phrase in fact["not_in"]:
            if phrase in plain_text(bible, label).lower():
                raise BuildError(f"fact {fact['says']!r}: {phrase!r} should not be in {label}")
    return rows, lost


def build() -> str:
    bible = load_bible()
    builder = Builder(bible)
    text = CONTENT.read_text(encoding="utf-8")
    study = parse(builder, text)
    rows, lost = check_lists(builder)
    quoted = {b["r"] for part in study["parts"] + study["questions"] for b in part["blocks"] if b["k"] == "quote"}
    quoted |= {b["r"] for b in study["opening"]}
    shown = sum(len(builder.passages[k]["verses"]) for k in quoted | {study["close"]["passage"]})
    numbers = {"parts": len(study["parts"]), "questions": len(study["questions"]),
               "versesShown": shown, "references": len(builder.passages),
               "luke15": len(builder.passages[ref_id("Luke 15:1–32")]["verses"]) if ref_id("Luke 15:1–32") in builder.passages else 0}
    if numbers["luke15"] != 32:
        raise BuildError("Luke 15:1–32 should be read whole, 32 verses")
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    data = {"study": study, "passages": builder.passages, "news": rows, "lost": lost, "numbers": numbers,
            "sources": SOURCES, "outside": OUTSIDE_QUOTES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.GN = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def main() -> int:
    try:
        output = build()
    except (BuildError, OSError, KeyError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != output:
            print("build-data: data.js is stale; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    OUT.write_text(output, encoding="utf-8", newline="\n")
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
