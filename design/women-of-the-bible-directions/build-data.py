#!/usr/bin/env python3
"""Build data.js for the Women of the Bible mock-up from the study's content.md, checking it against the site's Berean text.

Run from Website/: python design/women-of-the-bible-directions/build-data.py
  --check     run every check and fail if data.js is stale; writes nothing
  --selftest  feed wrong inputs in memory and prove each is refused; writes nothing
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import copy
import hashlib
import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists as lists  # noqa: E402
from scripture_text import (BOOKS, CANON, REF_RE, BuildError, fold, has_words, load_bible, plain_text,  # noqa: E402
                            ref_id, typographic, verses_of)

WEBSITE = HERE.parents[1]
PROJECT = WEBSITE.parent
CONTENT = WEBSITE / "content/studies/people-of-scripture/women-of-the-bible/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
# A short continuation such as "; 18:9–15" or ", 40". Not "; 1 Peter": a number followed by a book name is a new reference.
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")
CHECK_NOTE = re.compile(r"\s*\[check: ([^\]]+)\]")
STOP_HEADS = ("Where the passage stops", "What the text gives them")
SECTIONS = [("history", "GEN", "EST"), ("poetry", "JOB", "SNG"), ("prophets", "ISA", "MAL"), ("gospels", "MAT", "JHN"),
            ("acts", "ACT", "ACT"), ("epistles", "ROM", "JUD"), ("revelation", "REV", "REV")]


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
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chap}:{more.group(3)}{tail}"))
                end = more.end()
        return found

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not url.startswith("/") or url.startswith("//"):
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            elif italic in lists.STUDY_LINKS:
                out.append({"s": lists.STUDY_LINKS[italic], "t": italic})
            else:
                out.append({"i": typographic(italic)})
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
            if start < last:
                raise BuildError(f"overlapping references near {text[max(0, start - 20):end]!r}")
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
            if phrase in lists.OUTSIDE_QUOTES or phrase in lists.OWN_TERMS:
                continue
            pieces = [p.strip(" ,.") for p in phrase.split("…") if p.strip(" ,.")]
            # A quote with its own reference right after it must be in that reference, not just somewhere nearby.
            own = [ref_id(label.replace("-", "–")) for _, _, label in self.refs_in(after or "")]
            texts = [plain_text(self.bible, self.passages[k]["label"]).replace("'", "") for k in (own or cited)]
            for piece in pieces:
                folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")
                variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
                if not any(has_words(v, t) for v in variants for t in texts):
                    raise BuildError(f"{where}: quoted words {piece!r} are not in any verse this paragraph cites "
                                     f"({', '.join(self.passages[k]['label'] for k in (own or cited)) or 'none'})")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        page, bible = fold(quoted).replace('"', ""), plain_text(self.bible, label)
        # A block quotation is the whole passage, or one unbroken run of whole words from it (marked as part of the verse).
        if page != bible and not has_words(page, bible):
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label, "text": typographic(quoted), "part": page != bible}


def para(builder: Builder, raw: str, where: str, section: dict | None) -> list:
    """A paragraph may quote the verses it cites, its section's main readings, or the passage printed just above it."""
    cited: list = []
    runs = builder.runs(typographic(raw), cited)
    nearby = list((section or {}).get("readings", []))
    last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + nearby + ([last["r"]] if last else []), where)
    return runs


def h3_block(head: str, part: dict) -> dict:
    block = h3_kind(head, part)
    return {**block, "t": typographic(head), "key": head}


def h3_kind(head: str, part: dict) -> dict:
    owners = {h: w["id"] for w in lists.WOMEN if w["part"] == part.get("n") for h in w["h3"]}
    if head == lists.EXTRA["h3"]:
        return {"k": "h3", "t": head, "who": lists.EXTRA["id"]}
    if head in owners:
        return {"k": "h3", "t": head, "who": owners[head]}
    if head.startswith(STOP_HEADS):
        return {"k": "stop", "t": head}
    return {"k": "h3", "t": head}


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"opening": [], "parts": [], "checks": []}
    current = None
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        where = f"content.md line {i}"
        for note in CHECK_NOTE.finditer(line):
            study["checks"].append({"line": i, "note": note.group(1)})
        line = CHECK_NOTE.sub("", line)
        target = current["blocks"] if current else study["opening"]
        if line.startswith("# "):
            study["title"] = line[2:]
        elif re.fullmatch(r"\*\*Study \d+ · [^*]+\*\*", line):
            study["meta"] = line.strip("*")
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: block quotation with no reference line after it")
            target.append(builder.block(quote, lines[i].strip())); i += 1
        elif line.startswith("## "):
            head = line[3:]
            if head.startswith("A question: "):
                current = {"title": "A question:", "turn": head[12:], "blocks": []}
                study["question"] = current
            elif head == "What these women show":
                current = {"title": head, "blocks": []}
                study["close"] = current
            elif (m := re.fullmatch(r"(\d\d) ([^:]+): (.+)", head)):
                current = {"n": m.group(1), "title": m.group(2), "turn": m.group(3), "blocks": []}
                study["parts"].append(current)
            else:
                raise BuildError(f"{where}: a section heading the page does not know: {head!r}")
        elif line.startswith("### "):
            if current is None:
                raise BuildError(f"{where}: a sub-head outside any part")
            current["blocks"].append(h3_block(line[4:], current))
        elif m := re.match(r"\*\*(Main readings|Consider|Reflect|Your question):\*\* (.*)", line):
            label, body = m.groups()
            if current is None:
                raise BuildError(f"{where}: {label} outside any part")
            if label == "Main readings":
                labels = [label for _, _, label in builder.refs_in(body)]
                rest = re.sub(r"[;,\s.]", "", REF_RE.sub("", CONTINUE.sub("", body)))
                if not labels or rest:
                    raise BuildError(f"{where}: main readings must be references only, left over {rest!r}")
                current["readings"] = [builder.passage(label) for label in labels]
                current["readings_text"] = body.rstrip(".")
            else:
                current[label.lower().replace(" ", "_")] = para(builder, body, where, current)
        elif m := re.match(r"(\d)\. \*\*([^*]+)\*\* (.*)", line):
            target.append({"k": "ask", "n": m.group(1), "label": typographic(m.group(2)), "runs": para(builder, m.group(3), where, current)})
            builder.check_quotes(m.group(2), [], where)
        elif m := re.match(r"- \*\*([^*]+)\*\*\s*(.*)", line):
            builder.check_quotes(m.group(1), [], where)
            target.append({"k": "view", "label": typographic(m.group(1)), "runs": para(builder, m.group(2), where, current)})
        elif m := re.match(r"\*\*([^*]+[.?])\*\* (.*)", line):
            builder.check_quotes(m.group(1), (current or {}).get("readings", []), where)
            target.append({"k": "step", "label": typographic(m.group(1)), "runs": para(builder, m.group(2), where, current)})
        elif line.startswith("[open] "):
            target.append({"k": "open", "runs": para(builder, line[7:], where, current)})
        elif line == "Read the passage again before you answer." and current is not None and current is study.get("close"):
            current["again"] = line
        elif re.match(r"[#>\[\-*\d]", line) and not re.match(r"\d+ ", line):
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        else:
            kind = "hook" if current is not None and "readings" in current and not current["blocks"] else "p"
            target.append({"k": kind, "runs": para(builder, line, where, current), "raw": line if current is study.get("close") else None})
    for key in ("title", "meta", "question", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    if [p["n"] for p in study["parts"]] != [f"{n:02d}" for n in range(1, len(study["parts"]) + 1)]:
        raise BuildError("the parts must be numbered 01, 02, … in order")
    for part in study["parts"]:
        if "readings" not in part:
            raise BuildError(f"part {part['n']} has no main readings")
        if ("consider" in part) != ("reflect" in part):
            raise BuildError(f"part {part['n']} has one of Consider and Reflect without the other")
    if "your_question" not in study["close"] or "again" not in study["close"]:
        raise BuildError("the close must end with the reader's question and 'Read the passage again before you answer.'")
    return study


def held_text(key: str) -> str:
    path = PROJECT / lists.HELD[key]
    try:
        files = sorted(path.glob("*.json")) if path.is_dir() else [path]
        raw = " ".join(f.read_text(encoding="utf-8", errors="replace") for f in files)
    except OSError as error:
        raise BuildError(f"could not read held source {key} at {path}: {error}") from error
    raw = html.unescape(re.sub(r"<[^>]+>", " ", raw))
    return re.sub(r"\s+", " ", fold(raw)).replace("’", "'")


def check_outside(text: str) -> list:
    """Every outside quotation is used in the text; each held one is found, word for word, in its held copy."""
    found, cache = [], {}
    for phrase, key in lists.OUTSIDE_QUOTES.items():
        if f'"{phrase}"' not in text:
            raise BuildError(f"outside quotation listed in study_lists.py is not in content.md: {phrase!r}")
        if key is not None:
            source = cache.setdefault(key, held_text(key))
            if re.sub(r"\s+", " ", fold(phrase)).rstrip(" ,.;") not in source:  # the study's own comma or full stop may close it
                raise BuildError(f"outside quotation not found in its held source ({key}): {phrase!r}")
        found.append({"q": typographic(phrase), "src": lists.OUTSIDE_NAMES[key], "held": key is not None})
    return found


def section_of(code: str) -> str:
    at = CANON.index(code)
    return next(name for name, first, last in SECTIONS if CANON.index(first) <= at <= CANON.index(last))


def in_verse(builder: Builder, phrase: str, label: str, what: str) -> str:
    key = builder.passage(label)
    if not has_words(fold(phrase).lower().replace("'", ""), plain_text(builder.bible, label).lower().replace("'", "")):
        raise BuildError(f"{what}: {phrase!r} is not in {label}")
    return key


def covered(builder: Builder, label: str, cited: set) -> bool:
    """Every verse of a reference lies inside a passage content.md itself cites."""
    code, verses = verses_of(builder.bible, label.replace("-", "–"))
    return all((code, f"{c}:{v}") in cited for c, v, _ in verses)


def check_lists(builder: Builder, study: dict, cited: set) -> dict:
    parts = {p["n"]: p for p in study["parts"]}
    women = []
    if len(lists.WOMEN) != lists.STORIES or sum(w.get("women", 1) for w in lists.WOMEN) != lists.WOMEN_NAMED:
        raise BuildError(f"the study reads {lists.STORIES} stories of {lists.WOMEN_NAMED} women; the list has {len(lists.WOMEN)}")
    opening = " ".join(json.dumps(b, ensure_ascii=False) for b in study["opening"])
    if "sixteen women’s stories" not in opening:
        raise BuildError("the opening no longer says it reads sixteen women's stories; check STORIES in study_lists.py")
    for w in lists.WOMEN:
        part = parts.get(w["part"])
        if part is None:
            raise BuildError(f"{w['name']}: no part {w['part']}")
        heads = {b["key"] for b in part["blocks"] if b["k"] == "h3"}
        if missing := [h for h in w["h3"] if h not in heads]:
            raise BuildError(f"{w['name']}: part {w['part']} has no sub-head {missing[0]!r}")
        phrase, label = w["line"]
        if not covered(builder, label, cited):
            raise BuildError(f"{w['name']}: her line's verse {label} is not cited in content.md")
        if REF_RE.fullmatch(label).group(1) != w["book"]:
            raise BuildError(f"{w['name']}: her story is placed in {w['book']}, but her line is from {label}")
        entry = {**{k: w[k] for k in ("id", "name", "part")}, "short": w.get("short", w["name"]), "line": typographic(phrase),
                 "r": in_verse(builder, phrase, label, w["name"]), "book": BOOKS[w["book"]], "memory": [], "note": w.get("memory_note")}
        for label, kind, name_in, said in w["memory"]:
            key = builder.passage(label)
            if not covered(builder, label, cited):
                raise BuildError(f"{w['name']}: the memory {label} is not cited in content.md")
            if kind in ("named", "aside") and not has_words(name_in, plain_text(builder.bible, label)):
                raise BuildError(f"{w['name']}: {label} is marked as naming her, but does not hold {name_in!r}")
            if kind == "echo" and name_in is not None:
                raise BuildError(f"{w['name']}: an echo does not name her")
            in_verse(builder, said, label, f"{w['name']} memory")
            code = REF_RE.fullmatch(label).group(1)
            entry["memory"].append({"r": key, "kind": kind, "said": typographic(said), "book": BOOKS[code]})
        if "echo_of" in w:
            entry["echo_of"] = {"r": in_verse(builder, w["echo_of"][1], w["echo_of"][0], f"{w['name']} echo"), "said": w["echo_of"][1]}
        women.append(entry)
    extra = lists.EXTRA
    if extra["h3"] not in {b["key"] for b in parts[extra["part"]]["blocks"] if b["k"] == "h3"}:
        raise BuildError(f"{extra['name']}: no sub-head {extra['h3']!r}")
    junia = {"id": extra["id"], "name": extra["name"], "part": extra["part"], "line": extra["line"][0],
             "r": in_verse(builder, extra["line"][0], extra["line"][1], extra["name"])}
    close_text = fold(" ".join(b["raw"] for b in study["close"]["blocks"] if b.get("raw")))
    ids = {w["id"] for w in lists.WOMEN}
    litany = []
    for verb, rest, who in lists.LITANY:
        if fold(f"{verb} {rest}") not in close_text:
            raise BuildError(f"close list: {verb} {rest!r} is not a clause of the closing paragraph")
        if unknown := [x for x in who if x not in ids]:
            raise BuildError(f"close list: unknown story {unknown[0]!r}")
        litany.append({"verb": verb, "rest": typographic(rest), "who": who})
    motto = " ".join(lists.MOTTO["lines"]).rstrip(".")
    motto_r = in_verse(builder, motto, lists.MOTTO["ref"], "motto")
    for name, href in lists.STUDY_LINKS.items():
        if not (HERE / href / "index.html").is_file():
            raise BuildError(f"study link {name!r} points to {href}, which has no index.html")
    canon = [{"c": code, "s": section_of(code), "n": name} for name, code in BOOKS.items()]
    return {"women": women, "junia": junia, "litany": litany, "motto": {"lines": lists.MOTTO["lines"], "r": motto_r}, "canon": canon}


def build(text: str) -> str:
    builder = Builder(load_bible())
    study = parse(builder, text)
    cited = {(key.split(".")[0], cv) for key, item in builder.passages.items() for cv, _ in item["verses"]}
    drawn = check_lists(builder, study, cited)
    outside = check_outside(text)
    close = builder.passage(lists.CLOSE_PASSAGE)
    if not covered(builder, "Mark 14:9", cited):
        raise BuildError("the study no longer opens with Mark 14:9, the passage the close returns to")
    quoted = {b["r"] for sec in [study, *study["parts"], study["question"], study["close"]]
              for b in sec.get("blocks", sec.get("opening", [])) if b["k"] == "quote"}
    women = drawn["women"]
    numbers = {"stories": lists.STORIES, "women": lists.WOMEN_NAMED,
               "named": sum(1 for w in women if any(m["kind"] == "named" for m in w["memory"])),
               "echoed": sum(1 for w in women if w["memory"] and all(m["kind"] != "named" for m in w["memory"])),
               "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted | {close}),
               "references": len(builder.passages), "history": sum(1 for w in women if section_of(w["book"]) == "history")}
    for block in study["close"]["blocks"]:
        block.pop("raw", None)
    for sec in [*study["parts"], study["question"]]:
        for block in sec["blocks"]:
            block.pop("raw", None)
    for block in study["opening"]:
        block.pop("raw", None)
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    data = {"study": study, "passages": builder.passages, **drawn, "close_passage": close, "concepts": lists.CONCEPTS,
            "title": lists.TITLE, "trail": lists.TRAIL, "numbers": numbers, "outside": outside,
            "sources": lists.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.WB = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def main() -> int:
    if "--selftest" in sys.argv:
        from selftest import run_selftest  # noqa: E402  (kept beside this file)
        return run_selftest(build, CONTENT.read_text(encoding="utf-8"), lists)
    try:
        output = build(CONTENT.read_text(encoding="utf-8"))
    except (BuildError, OSError, KeyError, ValueError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
            print("build-data: stale: data.js; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    OUT.write_text(output, encoding="utf-8", newline="\n")
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
