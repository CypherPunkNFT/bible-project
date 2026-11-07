#!/usr/bin/env python3
"""Build data.js for the Reading the Bible well mock-up from the study's content.md, checking it against the site's
Berean text and the outside source held on this PC.

Run from Website/: python design/books-in-their-settings-directions/build-data.py
  --check     run every check and fail if data.js is stale; write nothing
  --selftest  feed wrong inputs in memory and prove each is refused for the right reason; write nothing
Exit 1, with data.js unchanged, if any check fails; exit 2 if a file cannot be read or written.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from scripture_text import BOOKS, CANON, REF_RE, BuildError, fold, load_bible, typographic, verses_of  # noqa: E402
import study_lists as L  # noqa: E402
from figures import check_figures  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/explore-the-bible/books-in-their-settings/content.md"
NOTED = WEBSITE / "data/text/bsb"
OUT = HERE / "data.js"
BOOK_NAMES = "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True))
CHAPTER_RE = re.compile(r"\b(" + BOOK_NAMES + r") (\d+)(?:–(\d+))?(?![\d:–-])")
CHECK_NOTE = re.compile(r"\[check(?: before publishing)?(?:: ([^\]]+))?\]")
INLINE = re.compile(CHECK_NOTE.pattern + r"|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; 2 Kings" is a new book
SHORT = re.compile(r"(?<![\w:.–])(\d+):(\d+)(?:–(\d+))?(?![\d:])")
QUOTE = re.compile(r'"([^"]+)"')
CHAIN = re.compile(r'(?:\s*(?:,|and|or)?\s*"[^"]*")*')
OWN_REF = re.compile(r'\s*\(((?:[1-3] )?[A-Za-z ]*\d+:\d+[^()"]*)\)')
PART_HEAD = re.compile(r"## (\d\d) (.+)")
STEP = re.compile(r"(\d+)\. \*\*([^*]+)\*\*(?: (.*))?")
BULLET = re.compile(r"- \*\*([^*]+)\*\*(?: (.*))?")
FIELDS = ("Concepts", "Motto", "Lead", "Selection", "Hook", "Way", "Close", "Invite", "Question", "Again", "Passage")
MARKS = {"[care] ": "care", "[limit] ": "limit"}
LEFTOVER = ("[check", "[care]", "[limit]", "**", "](")


def words(text: str) -> str:
    """Words only, lower case: quotation marks, punctuation and dashes are ignored when a phrase is matched."""
    return " " + re.sub(r"[^a-z0-9]+", " ", fold(text).replace("'", "").lower()).strip() + " "


def phrase_in(phrase: str, text_words: str) -> bool:
    return words(phrase) != "  " and words(phrase) in text_words


def load_noted(code: str) -> dict:
    """The Berean's editors' headings for one book, by "c:v", from the noted text the site reads."""
    heads: dict = {}
    for path in sorted((NOTED / code).glob("*.json")):
        for chapter, body in json.loads(path.read_text(encoding="utf-8")).items():
            for verse in body["v"]:
                heads[f"{chapter}:{verse['n']}"] = [text for kind, text in verse.get("h", []) if kind == "s"]
    if not heads:
        raise BuildError(f"no noted Berean text for {code} under {NOTED}")
    return heads


class Held:
    """The outside source held on this PC, read once and folded to words."""

    def __init__(self) -> None:
        self.cache: dict = {}

    def text(self, key: str) -> str:
        if key not in self.cache:
            path = Path(L.SOURCES_HELD[key]["path"]).resolve()
            if not any(path.is_relative_to(root.resolve()) for root in L.SOURCE_ROOTS):
                raise BuildError(f"held source {key!r} is outside the allowed source folders: {path}")
            self.cache[key] = words(path.read_text(encoding="utf-8", errors="replace"))
        return self.cache[key]


class Builder:
    def __init__(self, bible: dict, held: Held) -> None:
        self.bible, self.held = bible, held
        self.passages: dict = {}  # key -> {"label", "book", "cvs": [...]}; the text is stored once per verse
        self.checks: list = []
        self.used: dict = {"outside": set(), "pinned": set(), "short": set()}

    def passage(self, label: str) -> str:
        """A verse reference ("Jonah 1:3", "John 20:30–31") or a chapter one ("Jonah 1–4", "Exodus 3")."""
        label = label.replace("-", "–")
        if REF_RE.fullmatch(label):
            code, verses = verses_of(self.bible, label)
            name, c1, v1, c2, v2 = REF_RE.fullmatch(label).groups()
            key = f"{code}.{c1}.{v1}" + (f"-{c2}.{v2}" if c2 else (f"-{v2}" if v2 else ""))
        elif match := CHAPTER_RE.fullmatch(label):
            name, c1, c2 = match.groups()
            code = BOOKS[name]
            first, last = int(c1), int(c2 or c1)
            verses = sorted((tuple(map(int, cv.split(":"))) + (t,) for cv, t in self.bible[code].items()))
            verses = [v for v in verses if first <= v[0] <= last]
            if last < first or {v[0] for v in verses} != set(range(first, last + 1)):
                raise BuildError(f"no chapter {label} in the Berean")
            key = f"{code}.{c1}" + (f"-{c2}" if c2 else "")
        else:
            raise BuildError(f"not a Scripture reference: {label!r}")
        self.passages[key] = {"label": label, "book": code, "cvs": [f"{c}:{v}" for c, v, _ in verses], "chapter": "." not in key[4:]}
        return key

    def text_of(self, key: str) -> str:
        item = self.passages[key]
        return words(" ".join(self.bible[item["book"]][cv] for cv in item["cvs"]))

    def require(self, label: str, phrase: str, what: str) -> str:
        """A drawn phrase must be in its verse, as whole words. Returns the verse's key."""
        key = self.passage(label)
        if not phrase_in(phrase, self.text_of(key)):
            raise BuildError(f"{what}: {phrase!r} is not in {label}")
        return key

    def refs_in(self, text: str, section: str) -> list:
        """Every reference in plain text as (start, end, label): verses, short continuations, chapters, short refs."""
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
        taken = lambda at: any(s <= at < e for s, e, _ in found)  # noqa: E731
        for match in CHAPTER_RE.finditer(text):
            if not taken(match.start()):
                found.append((match.start(), match.end(), match.group(0)))
        for match in SHORT.finditer(text):
            if taken(match.start()) or text[:match.start()].endswith(L.NOT_SCRIPTURE):
                continue
            book = L.SHORT_REFS.get((section, match.group(0)))
            if book is None:
                raise BuildError(f"part {section}: short reference {match.group(0)!r} has no book in SHORT_REFS")
            self.used["short"].add((section, match.group(0)))
            found.append((match.start(), match.end(), f"{book} {match.group(0)}"))
        return sorted(found)

    def runs(self, text: str, section: str) -> tuple:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t}, {chk}. Returns (runs, cited passage keys)."""
        out, cited, last = [], [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], section, cited)
            check, link_text, url, bold, italic = match.groups()
            if match.group(0).startswith("[check"):
                note = (check or "check before publishing").replace("*", "")
                self.checks.append({"part": section, "note": note})
                out.append({"chk": note})
            elif url:
                if not re.match(r"/[A-Za-z0-9_-]", url):  # "//host" and "/\host" leave the site
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": self.plain_runs(bold, section, cited)})
            elif italic in L.STUDY_NAMES:
                out.append({"s": L.STUDY_NAMES[italic], "t": italic})
            else:
                out.append({"i": italic})
            last = match.end()
        out += self.plain_runs(text[last:], section, cited)
        for run in out:
            shown = run if isinstance(run, str) else " ".join(x for x in (run.get("t"), run.get("i")) if isinstance(x, str))
            if any(mark in shown for mark in LEFTOVER):
                raise BuildError(f"part {section}: leftover markup would show as text: {shown[:60]!r}")
        return out, cited

    def plain_runs(self, text: str, section: str, cited: list) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text, section):
            out.append(text[last:start])
            key = self.passage(label)
            cited.append(key)
            out.append({"r": key, "t": text[start:end]})
            last = end
        out.append(text[last:])
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, section: str, cited: list, nearby: list, where: str) -> None:
        """A quote with its own reference beside it must be in that reference. Otherwise it may be in a verse its
        paragraph cites, its part's main readings or the passage printed above it; a whole chapter is never evidence.
        Under three words, it must be pinned to its verse. An outside quotation is named in OUTSIDE_QUOTES."""
        if raw.count('"') % 2:
            raise BuildError(f"{where}: an odd number of quotation marks, so a quotation cannot be told from its context")
        verse_level = lambda keys: [k for k in keys if not self.passages[k]["chapter"]]  # noqa: E731
        for match in QUOTE.finditer(raw):
            phrase = match.group(1)
            if (section, phrase) in L.OWN_TERMS:
                continue
            if (section, phrase) in L.OUTSIDE_QUOTES:
                self.used["outside"].add((section, phrase))
                _, held = L.OUTSIDE_QUOTES[(section, phrase)]
                if held and not phrase_in(phrase, self.held.text(held)):
                    raise BuildError(f"{where}: outside quotation {phrase!r} is not in {L.SOURCES_HELD[held]['name']}")
                continue
            if (section, phrase) in L.PINNED_QUOTES:
                self.used["pinned"].add((section, phrase))
                targets = [self.passage(L.PINNED_QUOTES[(section, phrase)])]
            else:
                tail = raw[match.end():]
                tail = tail[CHAIN.match(tail).end():]
                own_text = (m := OWN_REF.match(tail)) and m.group(1)
                own = [self.passage(label) for _, _, label in self.refs_in(own_text, section)] if own_text else []
                if not own and len(words(phrase).split()) < 3:
                    raise BuildError(f"{where}: short quote {phrase!r} has no reference beside it; pin it in PINNED_QUOTES")
                targets = verse_level(own or (cited + nearby))
            for piece in [p for p in re.split(r"\.\.\.|…", phrase) if words(p).strip()]:
                if not any(phrase_in(piece, self.text_of(k)) for k in targets):
                    labels = ", ".join(self.passages[k]["label"] for k in targets) or "none"
                    raise BuildError(f"{where}: quoted words {piece.strip()!r} are not in {labels}")

    def block(self, quote_lines: list, ref_line: str, where: str) -> dict:
        label = ref_line.strip().removesuffix(" · BSB").strip()
        if label == ref_line.strip():
            raise BuildError(f"{where}: block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        item = self.passages[key]
        bible = fold(" ".join(self.bible[item["book"]][cv] for cv in item["cvs"])).replace('"', "")
        if fold(quoted).replace('"', "") != bible:
            raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key}


def paragraph(builder: Builder, raw: str, section: str, where: str, nearby: list) -> tuple:
    runs, cited = builder.runs(typographic(raw), section)
    builder.check_quotes(raw, section, cited, nearby, where)
    return runs, cited


def add_item(holder: list, kind: str, item: dict, where: str) -> None:
    """Bullets and numbered steps gather into one list block; numbered steps must run 1, 2, 3 with nothing between."""
    if not holder or holder[-1]["k"] != kind:
        holder.append({"k": kind, "items": []})
    items = holder[-1]["items"]
    if kind == "steps" and item["n"] != len(items) + 1:
        raise BuildError(f"{where}: numbered step {item['n']} follows step {len(items)}; steps must run in order")
    items.append(item)


def parse(builder: Builder, text: str) -> dict:
    """Place every non-blank line of content.md, or refuse the build."""
    lines = text.splitlines()
    study: dict = {"intro": {"paras": []}, "parts": [], "close": {}}
    section, target, near, last_quote = "intro", study["intro"], [], None
    holder = None  # where paragraphs go: none until the opening quotation, then the intro, then each part
    placed, i = 0, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        placed += 1
        where = f"content.md line {i}"
        nearby = near + ([last_quote] if last_quote else [])
        if line.startswith("# ") and "title" not in study:
            study["title"], _, study["subtitle"] = line[2:].partition(": ")
        elif line.startswith(">"):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; placed += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: block quotation has no reference line after it")
            item = builder.block(quote, lines[i], where); i += 1; placed += 1
            if section == "intro":
                target.setdefault("quotes", []).append(item)
                holder = target["paras"]
            elif holder is None:
                raise BuildError(f"{where}: a block quotation outside any part")
            else:
                holder.append(item)
            last_quote = item["r"]
        elif m := PART_HEAD.fullmatch(line):
            section, near, last_quote = m.group(1), [], None
            target = {"n": section, "title": m.group(2), "tone": L.PART_TONE.get(section), "blocks": []}
            study["parts"].append(target)
            holder = target["blocks"]
        elif line.startswith("## Close: "):
            section, target, holder, near, last_quote = "close", study["close"], None, [], None
            target["title"] = line[10:]
        elif line.startswith("### ") and section[:1].isdigit():
            holder.append({"k": "h3", "t": line[4:]})
        elif (m := re.fullmatch(r"\*\*Main readings:\*\* (.+)", line)) and section[:1].isdigit():
            target["readings"], cited = paragraph(builder, m.group(1), section, where, [])
            near = cited
        elif (m := re.fullmatch(r"\*\*(Consider|Reflect):\*\* (.+)", line)) and section[:1].isdigit():
            target[m.group(1).lower()] = paragraph(builder, m.group(2), section, where, nearby)[0]
        elif (m := re.fullmatch(r"([A-Z][a-z]+): (.+)", line)) and m.group(1) in FIELDS:
            field, body = m.groups()
            if field == "Concepts":
                target["concepts"] = body.split(" · ")
            elif field == "Motto":
                target["motto"] = body.split(" / ")
            elif field == "Passage":
                target["passage"] = builder.passage(body)
            else:
                target[field.lower()] = paragraph(builder, body, section, where, nearby)[0]
        elif (m := STEP.fullmatch(line)) and holder is not None:
            runs = paragraph(builder, m.group(3), section, where, nearby)[0] if m.group(3) else []
            add_item(holder, "steps", {"n": int(m.group(1)), "label": paragraph(builder, m.group(2), section, where, nearby)[0], "runs": runs}, where)
        elif (m := BULLET.fullmatch(line)) and holder is not None:
            runs = paragraph(builder, m.group(2), section, where, nearby)[0] if m.group(2) else []
            add_item(holder, "list", {"label": paragraph(builder, m.group(1), section, where, nearby)[0], "runs": runs}, where)
        elif (mark := next((k for k in MARKS if line.startswith(k)), None)) and holder is not None:
            holder.append({"k": MARKS[mark], "runs": paragraph(builder, line[len(mark):], section, where, nearby)[0]})
        elif line.startswith(("#", "- ", "* ", "|", "<", "[")) or re.match(r"\d+\. ", line) or holder is None:
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        else:
            holder.append({"k": "p", "runs": paragraph(builder, line, section, where, nearby)[0]})
    total = sum(1 for line in lines if line.strip())
    if placed != total:
        raise BuildError(f"{total - placed} lines of content.md were not placed on the page")
    check_shape(study)
    return study


def check_shape(study: dict) -> None:
    """The page places the opening, the parts and the close in fixed places; content.md must still have that shape."""
    intro, close = study["intro"], study["close"]
    if study.get("title") != " ".join(L.TITLE):
        raise BuildError(f"the page's title is drawn as {' '.join(L.TITLE)!r}; content.md has {study.get('title')!r}")
    for key in ("concepts", "motto", "lead", "quotes", "selection"):
        if key not in intro:
            raise BuildError(f"the opening has no {key}")
    if len(intro["paras"]) != 2:
        raise BuildError(f"the opening places two paragraphs beside the shelf; content.md has {len(intro['paras'])}")
    for key in ("title", "way", "close", "invite", "question", "again", "passage"):
        if key not in close:
            raise BuildError(f"the close has no {key}")
    if len(intro["motto"]) != 2:
        raise BuildError(f"the motto must be two lines, found {intro['motto']}")
    if [p["n"] for p in study["parts"]] != list(L.PART_TONE):
        raise BuildError(f"the page draws parts {list(L.PART_TONE)}; content.md has {[p['n'] for p in study['parts']]}")
    for part in study["parts"]:
        missing = [k for k in ("readings", "hook", "consider", "reflect") if k not in part]
        if missing:
            raise BuildError(f"part {part['n']} needs main readings, a hook, Consider and Reflect (missing {missing})")


def verse_store(builder: Builder) -> tuple:
    """Every verse the page shows, stored once: text[book] is a list of [c:v, text]; a passage is a run in it."""
    needed: dict = {}
    for item in builder.passages.values():
        needed.setdefault(item["book"], set()).update(item["cvs"])
    order = lambda cv: tuple(map(int, cv.split(":")))  # noqa: E731
    text = {code: [[cv, builder.bible[code][cv]] for cv in sorted(cvs, key=order)] for code, cvs in needed.items()}
    index = {code: {cv: n for n, (cv, _) in enumerate(rows)} for code, rows in text.items()}
    passages = {key: {"label": p["label"], "b": p["book"], "a": index[p["book"]][p["cvs"][0]], "z": index[p["book"]][p["cvs"][-1]]}
                for key, p in builder.passages.items()}
    return passages, text


def build(text: str, bible: dict, held: Held) -> str:
    builder = Builder(bible, held)
    study = parse(builder, text)
    figures = check_figures(builder, study, text, load_noted("JON"), words, phrase_in)
    for kind, table, name in (("outside", L.OUTSIDE_QUOTES, "OUTSIDE_QUOTES"), ("pinned", L.PINNED_QUOTES, "PINNED_QUOTES"), ("short", L.SHORT_REFS, "SHORT_REFS")):
        if unused := set(table) - builder.used[kind]:
            raise BuildError(f"{name} has entries the text no longer uses: {sorted(unused)}")
    for title, url in L.STUDY_NAMES.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"study {title!r} links to {url}, which has no index.html on this PC")
    passages, verses = verse_store(builder)
    numbers = {"books": len(CANON), "references": len(builder.passages), "openChecks": len(builder.checks),
               **figures.pop("numbers")}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "figures.py", HERE / "selftest.py", HERE / "scripture_text.py"]
    # Hashed with line endings made the same, so a Windows or Unix checkout does not make data.js look stale.
    prints = {p.name: hashlib.sha256(p.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:16] for p in inputs}
    outside = [{"t": phrase, "from": name, "checked": bool(h)} for (_, phrase), (name, h) in L.OUTSIDE_QUOTES.items()]
    data = {"study": study, "passages": passages, "text": verses, **figures, "numbers": numbers, "title": L.TITLE,
            "trail": L.TRAIL, "openChecks": builder.checks, "outside": outside, "sources": L.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.RBW = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(errors="backslashreplace")
    try:
        text = CONTENT.read_text(encoding="utf-8-sig")
        bible = load_bible()
        if "--selftest" in sys.argv:
            from selftest import selftest
            return selftest(text, bible, build, Held)
        output = build(text, bible, Held())
    except BuildError as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    except (OSError, ValueError, KeyError) as error:
        print(f"build-data: could not read an input: {type(error).__name__}: {error}", file=sys.stderr)
        return 2
    opened = output.count('"chk":')
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_bytes() != output.encode("utf-8"):
            print("build-data: stale: data.js does not match content.md; run without --check", file=sys.stderr)
            return 1
        print(f"build-data: all checks pass; data.js is current ({opened} points in the text still marked to check before publishing)")
        return 0
    temp = OUT.with_suffix(".js.tmp")
    try:
        temp.write_bytes(output.encode("utf-8"))
        os.replace(temp, OUT)
    except OSError as error:
        print(f"build-data: could not write {OUT}: {error}", file=sys.stderr)
        return 2
    finally:
        if temp.exists():
            temp.unlink()
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes; {opened} points still marked to check before publishing)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
