#!/usr/bin/env python3
"""Build data.js for the Witness and the nations mock-up (study 09) from the study's content.md, checking it against the
site's Berean text and the Baptist Faith and Message held on this PC.

Run from Website/: python -B design/bearing-witness-directions/build-data.py
  --check     run every check and fail if data.js is not what this build would write
  --selftest  feed the checks wrong inputs in memory and confirm each one is refused (writes nothing)
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
import study_lists as L  # noqa: E402
from figures import build_figures, check_page_files  # noqa: E402
from held import PROJECT, check_outside, load_held  # noqa: E402
from scripture_text import BOOKS, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/bearing-witness/content.md"
OUT = HERE / "data.js"
SCHEMA = 2
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
# A short continuation such as "15:6, 9", but never the "1" of a following "1 Peter 2:12".
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])(?!\s+[A-Z][a-z])")
BOOK_NAMES = "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True))
CHAPTER_RE = re.compile(r"\b(" + BOOK_NAMES + r") (\d+)(?:–(\d+))?(?![\d:–-])")
CHECK_NOTE = re.compile(r"\[check(?: before publishing)?(?:: ([^\]]*))?\]")
MARKERS = {"[care] ": "care", "[read] ": "read", "[open] ": "open", "[other] ": "other"}
ARTICLE = re.compile(r"\b[Aa]rticle ([IVX]+)\b")
QUESTIONS_HEAD, CLOSE_HEAD = "Questions readers ask", "Close: Whose part is whose"
OPENING_SHAPE = ["p", "quote", "p", "p"]  # lead, the verse, what was chosen, two words first
CLOSE_KEYS = ("way", "invite", "question", "again")


def site_link(url: str) -> bool:
    """A path on this site only: one leading slash, no scheme, no second slash, no backslash, no space or control character."""
    return (url.startswith("/") and "//" not in url and "\\" not in url
            and not any(ch.isspace() or ord(ch) < 32 or ord(ch) == 127 for ch in url))


def straight(text: str) -> str:
    return text.replace("’", "'")


class Builder:
    def __init__(self, bible: dict, held: dict) -> None:
        self.bible, self.held = bible, held
        self.passages: dict = {}
        self.used = {"own": set(), "bfm": set(), "not_held": set(), "misquotes": set(), "links": set(), "italics": set()}

    def passage(self, label: str) -> str:
        """A verse reference, a whole chapter ("Romans 10") or a run of chapters ("Romans 9–11"). Returns its key."""
        label = label.replace("-", "–").strip()
        chapters = re.fullmatch(r"(.+) (\d+)(?:–(\d+))?", label)
        if chapters and chapters.group(1) in BOOKS:
            book, code, first = chapters.group(1), BOOKS[chapters.group(1)], int(chapters.group(2))
            last = int(chapters.group(3) or first)
            if last < first:
                raise BuildError(f"chapter range runs backwards: {label}")
            verses = sorted((tuple(map(int, k.split(":"))), text) for k, text in self.bible[code].items() if first <= int(k.split(":")[0]) <= last)
            if not verses or {c for (c, _), _ in verses} != set(range(first, last + 1)):
                raise BuildError(f"chapter does not exist in the Berean: {label}")
            key = f"{code}.{first}" + (f"-{last}" if last != first else "")
            self.passages[key] = {"label": label, "book": book, "code": code, "chapters": list(range(first, last + 1)),
                                  "verses": [[f"{c}:{v}", text] for (c, v), text in verses]}
            return key
        code, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "book": REF_RE.fullmatch(label).group(1), "code": code,
                              "chapters": sorted({c for c, _, _ in verses}), "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def text_of(self, key: str) -> str:
        return fold(" ".join(v[1] for v in self.passages[key]["verses"])).replace('"', "")

    def refs_in(self, text: str) -> list:
        """Every reference in plain text, with its span: verses, short continuations and whole chapters."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
                end = more.end()
        taken = [(s, e) for s, e, _ in found]
        for match in CHAPTER_RE.finditer(text):
            if not any(s <= match.start() < e for s, e in taken):
                found.append((match.start(), match.end(), match.group(0)))
        return sorted(found)

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {c} (a note still to check)."""
        out, last = [], 0
        for match in CHECK_NOTE.finditer(text):
            out += self.markup_runs(text[last:match.start()], cited)
            out.append({"c": (match.group(1) or "").strip() or "before publishing"})
            last = match.end()
        return out + self.markup_runs(text[last:], cited)

    def markup_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not site_link(url):
                    raise BuildError(f"only links on this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": bold})
            else:
                plain = straight(italic)
                if plain in L.STUDY_LINKS:
                    self.used["links"].add(plain)
                    out.append({"s": f"../{L.STUDY_LINKS[plain]}/", "t": italic})
                elif plain in L.ITALIC_TERMS:
                    self.used["italics"].add(plain)
                    out.append({"i": italic})
                else:
                    raise BuildError(f"italic {italic!r} is neither a study on STUDY_LINKS nor a term on ITALIC_TERMS")
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
            if start > last:
                out.append(text[last:start])
            key = self.passage(label)
            cited.append(key)
            out.append({"r": key, "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(text[last:])
        return [run for run in out if run != ""]

    def check_outside_quote(self, raw: str, phrase: str, where: str) -> bool:
        """A Baptist Faith and Message quotation in its own article (and the article the line names, if it names one), or
        a quotation from a source not held here, which the page marks. False if the phrase is neither."""
        key = straight(phrase).rstrip(".,;:")
        if key in L.BFM_QUOTES:
            article = L.BFM_QUOTES[key]
            named = set(ARTICLE.findall(raw))
            if named and article not in named:
                raise BuildError(f"{where}: the line names article {', '.join(sorted(named))} for {key!r}, which is in article {article}")
            check_outside(self.held, key, article)
            self.used["bfm"].add(key)
            return True
        if key in L.NOT_HELD_QUOTES:
            self.used["not_held"].add(key)
            return True
        if key in L.SCRIPTURE_MISQUOTES:
            label, berean = L.SCRIPTURE_MISQUOTES[key]
            text = plain_text(self.bible, label).replace("'", "")
            if has_words(fold(key).replace("'", ""), text):
                raise BuildError(f"SCRIPTURE_MISQUOTES lists {key!r}, but it is word for word in {label}; remove the entry")
            if not has_words(fold(berean).replace("'", ""), text):
                raise BuildError(f"SCRIPTURE_MISQUOTES gives {berean!r} as the Berean at {label}, but the verse does not have it")
            self.used["misquotes"].add(key)
            return True
        return False

    def check_quotes(self, raw: str, allowed: list, where: str, section: str) -> None:
        """Each quoted phrase is Scripture in the verses it cites (every one of them), or in a verse its paragraph cites,
        its section's readings or the passage printed just above it; or a named outside source; or an own term."""
        raw = CHECK_NOTE.sub("", raw)
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            if (section, straight(phrase)) in L.OWN_TERMS:
                self.used["own"].add((section, straight(phrase)))
                continue
            if self.check_outside_quote(raw, phrase, where):
                continue
            if not after:  # a reference later in the same sentence, before any other quotation, is still this quote's own
                rest = re.split(r'"|(?<=[.!?])\s', raw[match.end():], maxsplit=1)[0]
                later = re.search(r"\(([^)]*)\)", rest)
                after = later.group(1) if later else ""
            own = [label.replace("-", "–") for _, _, label in self.refs_in(after)]
            pieces = [p.strip(" ,.!?;:") for p in re.split(r"…|\.\.\.", phrase) if p.strip(" ,.!?;:")]
            for piece in pieces:
                folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")
                variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
                found = lambda k: any(has_words(v, self.text_of(k).replace("'", "")) for v in variants)  # noqa: E731
                if own:
                    for label in own:
                        if not found(self.passage(label)):
                            raise BuildError(f"{where}: quoted words {piece!r} are not in {label}, which is cited for them")
                elif not any(found(k) for k in allowed):
                    names = ", ".join(self.passages[k]["label"] for k in allowed) or "none"
                    raise BuildError(f"{where}: quoted words {piece!r} are not in any verse this paragraph may quote ({names})")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        """A block quotation is the Berean at its reference word for word: the whole of it, or its opening whole sentences
        (marked so on the page)."""
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        page_text = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        quoted = fold(page_text).replace('"', "")
        key = self.passage(label)
        bible = plain_text(self.bible, label)
        item = {"k": "quote", "r": key, "label": label, "t": typographic(page_text)}
        if quoted == bible:
            return item
        if bible.startswith(quoted) and quoted[-1:] in ".?!" and bible[len(quoted):len(quoted) + 1] == " ":
            return {**item, "partial": "first sentence" if len(re.findall(r"[.?!](?:\s|$)", quoted)) == 1 else "opening sentences"}
        raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")

    def readings(self, body: str, where: str) -> tuple:
        """"A" or "A; with B and C quoted" (or "with B quoted"). Anything else is refused."""
        main, _, rest = body.partition("; ")
        also = []
        if rest:
            m = re.fullmatch(r"with (.+) quoted", rest)
            if not m:
                raise BuildError(f"{where}: Main readings must read 'A' or 'A; with B and C quoted', found {body!r}")
            also = [self.passage(label) for label in re.split(r", | and ", m.group(1))]
        return [self.passage(main)], also


def mark_not_held(raw: str) -> str:
    """Add the page's mark after each quotation of a source not held on this PC, and after each Scripture quotation that
    is not word for word the Berean. The build counts the marks."""
    for phrase, name in L.NOT_HELD_QUOTES.items():
        raw = re.sub(r'("' + re.escape(phrase) + r'[.,]?")', r"\1[check: " + name + ", not held on this PC; wording not yet compared]", raw)
    for phrase, (label, berean) in L.SCRIPTURE_MISQUOTES.items():
        raw = re.sub(r'("' + re.escape(phrase) + r'[.,]?")', r"\1[check: the Berean at " + label + " reads “" + berean + "”]", raw)
    return raw


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"opening": [], "parts": [], "questions": [], "close": {"paragraphs": []}}
    state = {"current": None, "section": "opening"}
    deferred: list = []

    def para(raw: str, where: str) -> list:
        """Runs for a line, after its quotations are checked against what this line may quote."""
        cited: list = []
        runs = builder.runs(typographic(mark_not_held(raw)), cited)
        if state["section"] == "close":
            deferred.append((raw, cited, where))
            return runs
        holder = state["current"] if state["current"] is not None else {"blocks": study["opening"]}
        last = next((b["r"] for b in reversed(holder["blocks"]) if b["k"] == "quote"), None)
        allowed = cited + holder.get("readings", []) + holder.get("also", []) + ([last] if last else [])
        builder.check_quotes(raw, allowed, where, state["section"])
        return runs

    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        where = f"content.md line {i}"
        if line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: block quotation has no reference line after it")
            ref_line = lines[i].strip(); i += 1
            current = state["current"]
            if state["section"] in ("questions", "close") and current is None:
                raise BuildError(f"{where}: a block quotation outside any part or question")
            (current["blocks"] if current is not None else study["opening"]).append(builder.block(quote, ref_line))
            continue
        place_line(builder, study, state, line, where, para)
    finish(builder, study, deferred)
    return study


def place_line(builder: Builder, study: dict, state: dict, line: str, where: str, para) -> None:
    """Put one line of content.md in its place, or refuse it. Every non-empty line goes through here or the block branch."""
    current, section = state["current"], state["section"]
    if line.startswith("# "):
        if "title" in study:
            raise BuildError(f"{where}: a second title")
        study["title"] = line[2:]
    elif line.startswith("## "):
        head = line[3:]
        if head == QUESTIONS_HEAD and section not in ("questions", "close"):
            state.update(section="questions", current=None)
        elif head == CLOSE_HEAD and section == "questions":
            state.update(section="close", current=None)
        elif re.fullmatch(r"\d\d .+", head) and section not in ("questions", "close"):
            number, _, title = head.partition(" ")
            part = {"n": number, "title": typographic(title), "blocks": []}
            study["parts"].append(part)
            state.update(section=number, current=part)
        else:
            raise BuildError(f"{where}: a section heading the page does not know how to place: {head!r}")
    elif line.startswith("### "):
        if section != "questions":
            raise BuildError(f"{where}: a subheading outside the questions: {line[:60]!r}")
        question = {"id": f"q{len(study['questions']) + 1}", "title": typographic(line[4:]), "blocks": []}
        study["questions"].append(question)
        state["current"] = question
    elif m := re.fullmatch(r"(Concepts|Motto): (.+)", line):
        if section != "opening":
            raise BuildError(f"{where}: {m.group(1)} outside the opening")
        study[m.group(1).lower()] = m.group(2).split(" · " if m.group(1) == "Concepts" else " / ")
    elif m := re.fullmatch(r"\*\*(Main readings|Consider|Reflect):\*\* (.+)", line):
        label, body = m.groups()
        if current is None or "n" not in current or ("readings" if label == "Main readings" else label.lower()) in current:
            raise BuildError(f"{where}: {label} outside a part, or a second one in the same part")
        if label == "Main readings":
            current["readings"], current["also"] = builder.readings(body, where)
        else:
            current[label.lower()] = para(body, where)
    elif m := re.fullmatch(r"\*\*Its limits\.\*\* (.+)", line):
        if current is None or "n" not in current or any(b["k"] == "limits" for b in current["blocks"]):
            raise BuildError(f"{where}: 'Its limits' outside a part, or a second one in the same part")
        current["blocks"].append({"k": "limits", "runs": para(m.group(1), where)})
    elif m := re.fullmatch(r"- \*\*([^*]+)\*\* (.+)", line):
        if current is None or "n" not in current:
            raise BuildError(f"{where}: a list item outside a part")
        item = {"label": m.group(1), "runs": para(m.group(2), where)}
        if current["blocks"] and current["blocks"][-1]["k"] == "list":
            current["blocks"][-1]["items"].append(item)
        else:
            current["blocks"].append({"k": "list", "items": [item]})
    elif line.startswith("- "):
        raise BuildError(f"{where}: a list item the page does not know how to place: {line[:60]!r}")
    elif marker := next((k for k in MARKERS if line.startswith(k)), None):
        if current is None:
            raise BuildError(f"{where}: a {marker.strip()} note outside any part or question")
        current["blocks"].append({"k": MARKERS[marker], "runs": para(line[len(marker):], where)})
    elif line.startswith("Passage: "):
        if section != "close" or "passage" in study["close"]:
            raise BuildError(f"{where}: Passage: belongs once, at the end of the close")
        study["close"]["passage"] = builder.passage(line[9:])
    elif section == "close":
        if "passage" in study["close"]:
            raise BuildError(f"{where}: a line after the close's Passage:")
        study["close"]["paragraphs"].append(para(line, where))
    elif section == "opening":
        study["opening"].append({"k": "p", "runs": para(line, where)})
    elif current is not None:
        current["blocks"].append({"k": "p", "runs": para(line, where)})
    else:
        raise BuildError(f"{where}: a line outside any section that the page does not know how to place: {line[:60]!r}")


def finish(builder: Builder, study: dict, deferred: list) -> None:
    """Checks that need the whole text: the shape of the opening and close, each part's parts, and unused list entries."""
    for key in ("title", "concepts", "motto"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    if ": ".join(L.TITLE) != study["title"]:
        raise BuildError(f"TITLE {L.TITLE} does not make the study's title {study['title']!r}")
    if len(study["motto"]) != 2:
        raise BuildError(f"the motto must have two lines, found {len(study['motto'])}")
    shape = [b["k"] for b in study["opening"]]
    if shape != OPENING_SHAPE:
        raise BuildError(f"the opening must be {OPENING_SHAPE} (lead, verse, what was chosen, two words), found {shape}")
    study["lead"], study["verse"], study["selection"], study["words"] = study.pop("opening")
    close = study["close"]
    if len(close["paragraphs"]) != len(CLOSE_KEYS) or "passage" not in close:
        raise BuildError(f"the close must have {len(CLOSE_KEYS)} paragraphs and a Passage:, found {len(close['paragraphs'])}")
    close.update(zip(CLOSE_KEYS, close.pop("paragraphs")))
    every_quote = [b["r"] for s in study["parts"] + study["questions"] for b in s["blocks"] if b["k"] == "quote"]
    for raw, cited, where in deferred:
        builder.check_quotes(raw, cited + every_quote + [close["passage"]], where, "close")
    for part in study["parts"]:
        for key in ("readings", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
        if not any(b["k"] == "limits" for b in part["blocks"]):
            raise BuildError(f"part {part['n']} has no 'Its limits' line")
    if [p["n"] for p in study["parts"]] != [f"{n:02d}" for n in range(1, len(study["parts"]) + 1)]:
        raise BuildError("parts must be numbered 01, 02, … in order")
    if not study["questions"]:
        raise BuildError(f"content.md has no '## {QUESTIONS_HEAD}' questions")
    unused = [("OWN_TERMS", set(L.OWN_TERMS) - builder.used["own"]), ("BFM_QUOTES", set(L.BFM_QUOTES) - builder.used["bfm"]),
              ("NOT_HELD_QUOTES", set(L.NOT_HELD_QUOTES) - builder.used["not_held"]),
              ("SCRIPTURE_MISQUOTES", set(L.SCRIPTURE_MISQUOTES) - builder.used["misquotes"]),
              ("STUDY_LINKS", set(L.STUDY_LINKS) - builder.used["links"]), ("ITALIC_TERMS", set(L.ITALIC_TERMS) - builder.used["italics"])]
    for name, left in unused:
        if left:
            raise BuildError(f"{name} has entries the text does not use: {sorted(left)}")
    check_marks(study)


def check_marks(study: dict) -> None:
    """Every quotation from a source not held on this PC carries its mark on the page."""
    def notes(node):
        if isinstance(node, dict):
            return ([node["c"]] if "c" in node else []) + [n for v in node.values() for n in notes(v)]
        if isinstance(node, list):
            return [n for v in node for n in notes(v)]
        return []
    marks = " ".join(notes(study))
    expected = [f"{name}, not held on this PC" for name in L.NOT_HELD_QUOTES.values()]
    expected += [f"the Berean at {label} reads" for label, _ in L.SCRIPTURE_MISQUOTES.values()]
    for mark in expected:
        if mark not in marks:
            raise BuildError(f"a quotation reached the page without its mark: {mark!r}")


def build() -> str:
    builder = Builder(load_bible(), load_held(L.BFM_PATH))
    raw = CONTENT.read_text(encoding="utf-8")
    study = parse(builder, raw)
    figures = build_figures(builder, L, raw, study)
    check_page_files(HERE)
    walked = {k for part in study["parts"] for k in part["readings"]}
    numbers = {"parts": len(study["parts"]), "questions": len(study["questions"]), "links": len(figures["chain"]),
               "versesWalked": sum(len(builder.passages[k]["verses"]) for k in walked)}
    inputs = [CONTENT] + sorted(HERE.glob("*.py")) + [PROJECT / L.BFM_PATH]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    data = {"schema": SCHEMA, "study": study, "passages": builder.passages, **figures, "numbers": numbers,
            "sources": L.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.BW = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def warn_missing_links() -> None:
    for name, folder in L.STUDY_LINKS.items():
        if not (HERE.parent / folder / "index.html").is_file():
            print(f"build-data: warning: {name!r} links to design/{folder}/, which has no index.html yet", file=sys.stderr)


def main() -> int:
    unknown = [arg for arg in sys.argv[1:] if arg not in ("--check", "--selftest")]
    if unknown:
        print(f"build-data: unknown argument {unknown[0]!r}; use --check or --selftest", file=sys.stderr)
        return 2
    if "--selftest" in sys.argv:
        from build_selftest import run_selftest
        return run_selftest(sys.modules[__name__])
    try:
        output = build()
    except (BuildError, OSError, KeyError, ValueError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    warn_missing_links()
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
            print(f"build-data: stale: {OUT.name}; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    temporary = OUT.with_suffix(".js.tmp")
    try:
        temporary.write_text(output, encoding="utf-8", newline="\n")
        os.replace(temporary, OUT)
    finally:
        if temporary.exists():
            temporary.unlink()
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
