#!/usr/bin/env python3
"""Build data.js for The Ten Commandments mock-up from the study's content.md, checking it against the site's Berean
text and the held sources. Writes data.js only; nothing outside this folder.

Run from Website/:  python design/the-ten-commandments-directions/build-data.py
  --check     run every check and fail if data.js is stale (writes nothing)
  --selftest  feed wrong inputs in memory and prove each is refused (writes nothing)
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists as LISTS  # noqa: E402
from scripture_text import BOOKS, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402
from tc_checks import check_issue_tests, check_lists, check_outside, quote_scope_ok  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/the-ten-commandments/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])")
CHAPTER_RE = re.compile(r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+)(?![:\d–])")
CHECK_RE = re.compile(r" ?\[check(?::\s*([^\]]*))?[^\]]*\]")
NOTE = re.compile(r"⟦(\d+)⟧")
SAFE_LINK = re.compile(r"/(?![/\\])[^\s\\]*")
FIELDS = ("Subtitle", "Concepts", "Motto", "Lead", "Frame", "Selection", "Close", "Way", "Invite", "Question", "Again", "Passage")
TAGS = {"[care] ": "care", "[source:luther-small] ": "luther", "[open] ": "open", "[other] ": "other"}


class Builder:
    def __init__(self, bible: dict) -> None:
        self.bible = bible
        self.passages: dict = {}
        self.notes: list = []

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        if (m := CHAPTER_RE.fullmatch(label)):
            code = BOOKS[m.group(1)]
            last = max((int(k.split(":")[1]) for k in self.bible[code] if k.split(":")[0] == m.group(2)), default=0)
            if not last:
                raise BuildError(f"reference does not resolve in the Berean: {label}")
            key = f"{code}.{m.group(2)}"
            verses = verses_of(self.bible, f"{label}:1–{last}")[1]
        else:
            key, verses = ref_id(label), verses_of(self.bible, label)[1]
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str) -> list:
        """Every reference in plain text with its span: full references, short continuations ("4:13; 10:4"), and
        whole chapters ("Exodus 20")."""
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
        for match in CHAPTER_RE.finditer(text):
            if not any(s <= match.start() < e for s, e, _ in found):
                found.append((match.start(), match.end(), match.group(0)))
        return sorted(found)

    def lift_notes(self, raw: str, issues: list) -> str:
        """Editor's marks become placeholders before anything else reads the line, so a note's references and quotes
        never count as the text's own. Issues the build found are marked after their anchor."""
        for issue in issues:
            if issue["anchor"] in raw:
                self.notes.append({"kind": "issue", "t": issue["note"]})
                raw = raw.replace(issue["anchor"], f"{issue['anchor']}⟦{len(self.notes) - 1}⟧", 1)
                issue["used"] = True

        def keep(match: re.Match) -> str:
            body = (match.group(1) or match.group(0).strip(" []")).replace("*", "").strip()
            self.notes.append({"kind": "check", "t": body})
            return f"⟦{len(self.notes) - 1}⟧"
        return CHECK_RE.sub(keep, raw)

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {c} (an editor's mark)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SAFE_LINK.fullmatch(url) or "://" in url:
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out += [{"b": r} if isinstance(r, str) else r for r in self.plain_runs(bold, cited)]
            elif italic in LISTS.STUDY_LINKS:
                out.append({"s": LISTS.STUDY_LINKS[italic], "t": italic})
            else:
                out.append({"i": italic})
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out = []
        for index, piece in enumerate(NOTE.split(text)):
            if index % 2:
                out.append({"c": int(piece)})
                continue
            last = 0
            for start, end, label in self.refs_in(piece):
                out.append(piece[last:start])
                key = self.passage(label)
                cited.append(key)
                out.append({"r": key, "t": piece[start:end]})
                last = end
            out.append(piece[last:])
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, cited: list, fallback: list, where: str) -> None:
        """Each quoted phrase is in a verse its own reference names; failing that, a verse its paragraph cites (or, in
        a paragraph that cites nothing, the part's main readings), or the quotation printed just above."""
        if raw.count('"') % 2:
            raise BuildError(f"{where}: an odd number of straight quotation marks; a quotation is not closed")
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            bare = phrase.rstrip(".")
            if any(bare == key.rstrip(".") for key in (*LISTS.HELD_QUOTES, *LISTS.NOT_HELD_QUOTES, *LISTS.MISMATCHED, *LISTS.OWN_TERMS)):
                continue
            own = [self.passage(label) for _, _, label in self.refs_in(after or "")]
            scope = own or fallback
            texts = [plain_text(self.bible, self.label_for(k)).replace("'", "") for k in scope]
            if not quote_scope_ok(phrase, texts):
                raise BuildError(f"{where}: quoted words {phrase!r} are not in "
                                 f"{'the verse cited for them' if own else 'any verse this paragraph may quote'} "
                                 f"({', '.join(self.passages[k]['label'] for k in scope) or 'none'})")

    def label_for(self, key: str) -> str:
        label = self.passages[key]["label"]
        if CHAPTER_RE.fullmatch(label):
            return f"{label}:1–{self.passages[key]['verses'][-1][0].split(':')[1]}"
        return label

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        page, verse = bare_quotes(quoted), bare_quotes(plain_text(self.bible, label))
        # A quotation may stop at the end of a sentence inside its last verse; the page then says so.
        partial = page != verse and verse.startswith(page) and page[-1:] in ".?!" and verse[len(page):len(page) + 1] == " "
        if page != verse and not partial:
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {plain_text(self.bible, label)}")
        last = self.passages[key]["verses"][-1][0].split(":")[1]
        return {"k": "quote", "r": key, "label": label, **({"partial": f"verse {last} in part", "text": typographic(quoted)} if partial else {})}


def bare_quotes(text: str) -> str:
    """Compare a block quotation regardless of how its nested quotation marks are drawn (single on the page, double
    in the verse), keeping apostrophes inside words."""
    text = fold(text).replace('"', "")
    return re.sub(r"(?<!\w)'|'(?!\w)", "", text).strip()


def para(builder: Builder, raw: str, where: str, section: dict | None, issues: list) -> list:
    raw = builder.lift_notes(raw, issues)
    cited: list = []
    runs = builder.runs(typographic(raw), cited)
    last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
    fallback = (cited or list((section or {}).get("readings", []))) + ([last["r"]] if last else [])
    builder.check_quotes(NOTE.sub("", raw), cited, fallback, where)
    return runs


def table(builder: Builder, rows: list, where: str) -> dict:
    cells = [[c.strip() for c in row.strip().strip("|").split("|")] for row in rows]
    head, sep, body = cells[0], cells[1], cells[2:]
    if not all(set(c) <= set("-: ") for c in sep) or len(head) != 5 or any(len(r) != 5 for r in body):
        raise BuildError(f"{where}: the counting table must have five columns and a separator line")
    out = {"k": "table", "head": head, "rows": []}
    for what, verses, *counts in body:
        key = builder.passage(f"Exodus 20:{verses}")
        out["rows"].append({"what": what, "r": key, "v": verses, "counts": counts})
    return out


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    issues = [dict(i) for i in LISTS.ISSUES] + [
        {"anchor": f'{phrase}"', "note": f"Not the wording of the site's copy of {item['source']}, which reads: “{item['held']}”"}
        for phrase, item in LISTS.MISMATCHED.items()]
    study: dict = {"parts": []}
    current, used, i = None, 0, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        if line.startswith("# "):
            study["title"] = line[2:]
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip(); i += 1; used += 1
            item = builder.block(quote, ref_line)
            (current["blocks"] if current else study.setdefault("opening", [])).append(item)
        elif line.startswith("|"):
            rows = [line]
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(lines[i]); i += 1; used += 1
            current["blocks"].append(table(builder, rows, where))
        elif (m := re.fullmatch(r"## (\d\d) (.+)", line)):
            current = {"n": m.group(1), "title": m.group(2), "blocks": []}
            study["parts"].append(current)
        elif line.startswith("## "):
            current = None
            study["close"] = {"title": line[3:]}
        elif line.startswith("### "):
            current["blocks"].append({"k": "h3", "t": line[4:]})
        elif (m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line)):
            label, body = m.groups()
            if label == "Main readings":
                current["readings"] = [builder.passage(label) for _, _, label in builder.refs_in(body)]
                current["readings_text"] = body
            else:
                current[label.lower()] = para(builder, body, where, current, issues)
        elif (tag := next((t for t in TAGS if line.startswith(t)), None)):
            current["blocks"].append({"k": TAGS[tag], "runs": para(builder, line[len(tag):], where, current, issues)})
        elif (m := re.match(r"([A-Z][a-z]+): (.*)", line)) and m.group(1) in FIELDS:
            field, body = m.groups()
            target = study["close"] if "close" in study else study
            if field == "Concepts":
                target["concepts"] = body.split(" · ")
            elif field == "Motto":
                target["motto"] = body.split(" / ")
            elif field == "Subtitle":
                target["subtitle"] = body
            elif field == "Passage":
                target["passage"] = builder.passage(body)
            else:
                target[field.lower()] = para(builder, body, where, None, issues)
        elif current is not None:
            current["blocks"].append({"k": "p", "runs": para(builder, line, where, current, issues)})
        else:
            raise BuildError(f"{where}: a line outside any section that the page does not know how to place: {line[:60]!r}")
    if used != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    for issue in issues:
        if not issue.get("used"):
            raise BuildError(f"ISSUES anchor no longer in the text: {issue['anchor']!r}")
    check_shape(study)
    return study


def check_shape(study: dict) -> None:
    for key in ("title", "subtitle", "concepts", "motto", "lead", "opening", "frame", "selection", "parts", "close"):
        if not study.get(key):
            raise BuildError(f"content.md has no {key}")
    if [p["n"] for p in study["parts"]] != ["01", "02", "03", "04", "05"]:
        raise BuildError("the study must have parts 01 to 05 in order")
    for part in study["parts"]:
        for key in ("readings", "consider", "reflect"):
            if not part.get(key):
                raise BuildError(f"part {part['n']} has no {key}")
    if not all(study["close"].get(k) for k in ("close", "way", "invite", "question", "again", "passage")):
        raise BuildError("the close must carry Close, Way, Invite, Question, Again and Passage")
    if len(study["motto"]) != 2:
        raise BuildError("the motto must have two lines, split by ' / '")
    if " ".join(LISTS.TITLE) != study["title"]:
        raise BuildError(f"TITLE {LISTS.TITLE!r} does not make the study's title {study['title']!r}")


def build(text: str, bible: dict) -> str:
    builder = Builder(bible)
    study = parse(builder, text)
    extra = check_lists(builder, study, text)
    check_outside(WEBSITE, text)
    check_issue_tests(bible)
    quoted = {b["r"] for part in study["parts"] for b in part["blocks"] if b["k"] == "quote"} | {b["r"] for b in study["opening"]}
    shown = sum(len(builder.passages[k]["verses"]) for k in quoted | {study["close"]["passage"]})
    numbers = {"parts": len(study["parts"]), "versesShown": shown, "references": len(builder.passages), **extra.pop("numbers")}
    prints = {p.name: hashlib.sha256(p.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:16]
              for p in (HERE / "study_lists.py", HERE / "build-data.py", HERE / "tc_checks.py", HERE / "scripture_text.py")}
    prints["content.md"] = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
    data = {"study": study, "passages": builder.passages, "notes": builder.notes, **extra, "numbers": numbers,
            "title": LISTS.TITLE, "sources": LISTS.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.TC = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def warn_links() -> None:
    for title, url in LISTS.STUDY_LINKS.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            print(f"build-data: warning: the linked mock-up for {title!r} is missing ({url})", file=sys.stderr)


def main() -> int:
    if "--selftest" in sys.argv:
        from tc_checks import selftest
        return selftest(build, CONTENT.read_text(encoding="utf-8").replace("\r\n", "\n"), load_bible())
    try:
        output = build(CONTENT.read_text(encoding="utf-8").replace("\r\n", "\n"), load_bible())
    except (BuildError, OSError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    warn_links()
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
