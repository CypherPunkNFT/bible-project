#!/usr/bin/env python3
"""Build data.js for the What Scripture promises the sick mock-up from the study's content.md, checking it against the
site's Berean text and the outside sources held on this PC.

Run from Website/: python design/illness-and-healing-directions/build-data.py
  --check     run every check and fail if data.js is stale; writes nothing
  --selftest  feed wrong inputs in memory and prove each is refused for the right reason; writes nothing
Exit 1 with a message, and data.js unchanged, if any check fails.
"""
import hashlib
import html
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from scripture_text import BOOKS, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, verses_of  # noqa: E402
import study_lists as L  # noqa: E402

WEBSITE = HERE.parents[1]
PROJECT = WEBSITE.parent
CONTENT = WEBSITE / "content/studies/christian-life/illness-and-healing/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
BOOK_NAMES = "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True))
# A whole chapter ("Psalm 6", "Mark 5"): never followed by a colon, a digit or a dash, so "Psalm 102" is not "Psalm 10".
CHAPTER_RE = re.compile(r"\b(" + BOOK_NAMES + r") (\d+)(?![\d:–-])")
# "15:6, 9", "1:8 · BSB; 1:10–12": more verses after a reference. Never "; 1 Peter", whose "1" is a book.
CONTINUE = re.compile(r"(?: · BSB)?(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])(?!\s+[A-Z])")
CHECK_NOTE = re.compile(r"\s*\[check:([^\]]*)\]")
MARK = re.compile(r"⟦(\d+)⟧")
SITE_LINK = re.compile(r"^/(?![/\\])[^\s]*$")


def typographic(text: str) -> str:
    """Straight quotes to the curly ones the Berean uses; an opening single quote turns the right way."""
    text = re.sub(r'"([^"]*)"', "“\\1”", text)
    text = re.sub(r"(^|[\s(“—])'", "\\1‘", text)
    return text.replace("'", "’")


def loose(text: str) -> str:
    """For comparing quotations: no quote marks of either kind, one space, any case."""
    return re.sub(r"\s+", " ", fold(text).replace('"', "").replace("'", "")).strip().lower()


class Builder:
    def __init__(self, bible: dict, held: dict) -> None:
        self.bible, self.held = bible, held
        self.passages: dict = {}
        self.checks: list = []

    def chapter_label(self, book: str, chapter: str) -> str:
        code = BOOKS[book]
        last = max((int(k.split(":")[1]) for k in self.bible[code] if k.split(":")[0] == chapter), default=0)
        if not last:
            raise BuildError(f"chapter does not exist in the Berean: {book} {chapter}")
        return f"{book} {chapter}:1–{last}"

    def passage(self, label: str, shown: str | None = None) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": shown or label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str, part: str) -> list:
        """Every reference in plain text as (start, end, label): full ones, their continuations, whole chapters, and
        the short ones listed in SHORT_REFS. A bare chapter:verse left over fails the build."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(4) or match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start(2) if more.group(2) else more.start(3), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
                end = more.end()
        for match in CHAPTER_RE.finditer(text):
            found.append((match.start(), match.end(), self.chapter_label(match.group(1), match.group(2))))
        for (key_part, short), book in L.SHORT_REFS.items():
            if key_part == part:
                for match in re.finditer(r"(?<![\d:])" + re.escape(short) + r"(?![\d:])", text):
                    if not any(s <= match.start() < e for s, e, _ in found):
                        found.append((match.start(), match.end(), f"{book} {short}"))
        found.sort()
        for (s1, e1, l1), (s2, _, l2) in zip(found, found[1:]):
            if s2 < e1:
                raise BuildError(f"part {part}: overlapping references {l1!r} and {l2!r}")
        rest = text
        for start, end, _ in reversed(found):
            rest = rest[:start] + " " * (end - start) + rest[end:]
        if (bare := re.search(r"\d+:\d+", rest)):
            raise BuildError(f"part {part}: a bare reference {bare.group(0)!r} with no book; add it to SHORT_REFS")
        return found

    def runs(self, text: str, cited: list, part: str) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {c} (wording to confirm)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited, part)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.match(url):
                    raise BuildError(f"part {part}: only links within this site are allowed, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": bold})
            elif italic in L.STUDY_LINKS:
                folder = L.STUDY_LINKS[italic]
                if folder and not (HERE.parent / folder / "index.html").is_file():
                    raise BuildError(f"study link for {italic!r} points to design/{folder}/, which has no index.html")
                out.append({"s": f"/mockups/{folder}/" if folder else None, "t": italic})
            else:
                out.append({"i": italic})
            last = match.end()
        return out + self.plain_runs(text[last:], cited, part)

    def plain_runs(self, text: str, cited: list, part: str) -> list:
        out = []
        for index, piece in enumerate(MARK.split(text)):
            if index % 2:
                out.append({"c": int(piece)})
                continue
            last = 0
            for start, end, label in self.refs_in(piece, part):
                out.append(piece[last:start])
                key = self.passage(label)
                cited.append(key)
                out.append({"r": key, "t": piece[start:end]})
                last = end
            out.append(piece[last:])
        return [run for run in out if run != ""]

    def check_outside(self, phrase: str, where: str) -> None:
        source, path = L.OUTSIDE_QUOTES[phrase]
        if path is None:
            return
        if loose(phrase).rstrip(".") not in self.held[path]:
            raise BuildError(f"{where}: the words {phrase!r} are not in the held copy of {source} ({path})")

    def check_quotes(self, raw: str, cited: list, where: str, part: str) -> None:
        """Each quoted phrase is in a verse its own reference names, or one its paragraph cites; or it is a named
        outside quotation found in its held source; or it is a title or the study's own term."""
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            if phrase in L.OUTSIDE_QUOTES:
                self.check_outside(phrase, where)
                continue
            if phrase in L.OWN_TERMS:
                continue
            own = [self.passage(label) for _, _, label in self.refs_in(after or "", part)]
            texts = [plain_text(self.bible, self.passages[k]["label"]).replace("'", "") for k in (own or cited)]
            for piece in [p.strip(" ,.") for p in phrase.split("…") if p.strip(" ,.")]:
                folded = fold(piece).replace('"', "").replace("'", "")
                variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
                if not any(has_words(v, t) for v in variants for t in texts):
                    raise BuildError(f"{where}: quoted words {piece!r} are not in "
                                     f"{'the verse cited for them' if own else 'any verse this paragraph cites'} "
                                     f"({', '.join(self.passages[k]['label'] for k in (own or cited)) or 'none'})")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line.strip():
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        page, bible = fold(quoted).replace('"', ""), plain_text(self.bible, label)
        if page == bible:
            return {"k": "quote", "r": key, "label": label}
        # A block may quote part of its verse, but only an unbroken run of the verse's own words.
        if len(page.split()) >= 6 and has_words(page.strip("'"), bible.replace("'", "")):
            return {"k": "quote", "r": key, "label": label, "part": typographic(quoted)}
        raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")

    def para(self, raw: str, where: str, part: str, section: dict | None = None) -> list:
        """A paragraph may quote the verses it cites, its part's main readings, or the passage printed just above it."""
        def note(match: re.Match) -> str:
            self.checks.append({"part": part, "note": match.group(1).strip()})
            return f"⟦{len(self.checks) - 1}⟧"
        marked = CHECK_NOTE.sub(note, raw)
        clean = MARK.sub("", marked)
        cited: list = []
        runs = self.runs(typographic(marked), cited, part)
        nearby = list((section or {}).get("readings", []))
        last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
        self.check_quotes(clean, cited + nearby + ([last["r"]] if last else []), where, part)
        return runs


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"opening": [], "questions": [], "parts": []}
    current: dict | None = None
    i, used = 0, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        part = current.get("n", "close") if current else "opening"
        if line.startswith("# "):
            study["title"] = line[2:]
        elif m := re.fullmatch(r"\*\*(Study \d+ · [^*]+)\*\*", line):
            study["byline"] = m.group(1)
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip(); i += 1; used += 1
            if current is None:
                raise BuildError(f"{where}: a block quotation outside any part")
            current["blocks"].append(builder.block(quote, ref_line))
        elif m := re.fullmatch(r"## (\d\d) (.+)", line):
            current = {"n": m.group(1), "title": m.group(2), "blocks": []}
            study["parts"].append(current)
        elif line.startswith("## "):
            current = {"title": line[3:], "blocks": []}
            study["close"] = current
        elif line.startswith("### "):
            if current is None:
                raise BuildError(f"{where}: a sub-heading outside any part")
            current["blocks"].append({"k": "h3", "t": typographic(line[4:])})
        elif m := re.match(r"\*\*Main readings:\*\* (.*)", line):
            readings_text = m.group(1)
            current["readings_runs"] = builder.runs(typographic(readings_text), [], part)
            current["readings"] = [r["r"] for r in current["readings_runs"] if isinstance(r, dict) and "r" in r]
            leftover = re.sub(r"\[[^\]]*\]", "", "".join(r for r in current["readings_runs"] if isinstance(r, str)))
            if re.sub(r"[\s;,.()]|and|briefly", "", leftover):
                raise BuildError(f"{where}: main readings hold words that are not references: {leftover!r}")
        elif m := re.match(r"\*\*(Consider|Reflect|Your question):\*\* (.*)", line):
            label, body = m.groups()
            current[label.split()[-1].lower()] = builder.para(body, where, part, current)
        elif m := re.match(r"(\d)\. \*\*([^*]+)\*\* (.*)", line):
            if current is not None:
                raise BuildError(f"{where}: a numbered question inside a part")
            builder.check_quotes(m.group(2) + " " + m.group(3), [], where, part)
            study["questions"].append({"n": int(m.group(1)), "ask": typographic(m.group(2)), "runs": builder.para(m.group(3), where, part)})
        elif m := re.match(r"- \*\*([^*]+)\*\* (.*)", line):
            current["blocks"].append({"k": "view", "label": typographic(m.group(1)), "runs": builder.para(m.group(2), where, part, current)})
        elif m := re.match(r"\[(care|open)\] (.*)", line):
            block = {"k": m.group(1), "runs": builder.para(m.group(2), where, part, current)}
            (current["blocks"] if current else study["opening"]).append(block)
        elif line.startswith(("#", ">", "|", "* ", "<")) or re.match(r"\[\w+\] ", line):
            raise BuildError(f"{where}: a line the page cannot place: {line[:60]!r}")
        elif current is None:
            study["opening"].append({"k": "p", "runs": builder.para(line, where, part)})
        else:
            block = {"k": "p", "runs": builder.para(line, where, part, current)}
            if "n" in current and not current["blocks"]:
                block["k"] = "hook"
            current["blocks"].append(block)
    total = sum(1 for line in lines if line.strip())
    if used != total:
        raise BuildError(f"{total - used} lines of content.md were not placed on the page")
    for part in study["parts"]:
        builder.check_quotes(part["title"], part.get("readings", []), f"heading of part {part['n']}", part["n"])
        part["title"] = typographic(part["title"])
        for key in ("readings", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
    for key in ("title", "byline", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    if len(study["questions"]) != 3 or len(study["parts"]) != 7:
        raise BuildError(f"the study should carry 3 questions and 7 parts, found {len(study['questions'])} and {len(study['parts'])}")
    if "question" not in study["close"]:
        raise BuildError("the close has no **Your question:**")
    return study


def load_held() -> dict:
    """The outside sources held on this PC, as loose text. Only files under the BibleProject folder are read."""
    held = {}
    for path in sorted({p for _, p in L.OUTSIDE_QUOTES.values() if p}):
        full = (PROJECT / path).resolve()
        if PROJECT.resolve() not in full.parents:
            raise BuildError(f"held source outside the project folder: {path}")
        try:
            raw = full.read_text(encoding="utf-8", errors="replace")
            if full.suffix == ".json":
                strings: list = []
                stack = [json.loads(raw)]
                while stack:
                    item = stack.pop()
                    if isinstance(item, str):
                        strings.append(item)
                    elif isinstance(item, dict):
                        stack.extend(item.values())
                    elif isinstance(item, list):
                        stack.extend(item)
                raw = " ".join(strings)
        except (OSError, ValueError) as error:
            raise BuildError(f"could not read held source {full}: {error}") from error
        held[path] = loose(html.unescape(re.sub(r"<[^>]+>", " ", raw)))
    return held


def in_verse(builder: Builder, label: str, phrase: str, what: str) -> str:
    """The phrase is in the verse, as whole words; returns the passage key."""
    key = builder.passage(label)
    text = plain_text(builder.bible, label).replace("'", "")
    folded = fold(phrase).replace('"', "").replace("'", "")
    if not folded or not has_words(folded, text):
        raise BuildError(f"{what}: {phrase!r} is not in {label}")
    return key


def pinned(builder: Builder, pair, what: str):
    return None if pair is None else {"r": in_verse(builder, pair[0], pair[1], what), "t": pair[1], "label": pair[0]}


def check_register(builder: Builder) -> list:
    register = []
    for row in L.REGISTER:
        if row["kind"] not in L.KINDS:
            raise BuildError(f"register: {row['who']} has an unknown kind {row['kind']!r}")
        what = f"register row {row['who']}"
        register.append({"who": row["who"], "part": row["part"], "kind": row["kind"],
                         "label": row.get("label", L.KINDS[row["kind"]]),
                         **{k: pinned(builder, row.get(k), what) for k in ("ill", "said", "then", "later")}})
    return register


def check_offered(builder: Builder, text: str) -> list:
    offered = []
    for row in L.OFFERED:
        if "ref" in row:
            item = {"r": in_verse(builder, row["ref"], row["says"], "offered words"), "label": row["ref"]}
        else:
            if row["says"] not in text:
                raise BuildError(f"offered words: {row['says']!r} ({row['source']}) are not in the study's text")
            item = {"source": row["source"], "answer": builder.passage(row["answer_ref"]), "answerLabel": row["answer_ref"]}
        offered.append({**item, **{k: row[k] for k in ("says", "part", "kind", "when", "who")}})
    return offered


def check_psalms(builder: Builder) -> list:
    psalms = []
    for row in L.PSALM_ENDS:
        whole = builder.chapter_label("Psalm", str(row["psalm"]))
        verses = builder.passages[builder.passage(whole)]["verses"]
        last_label = f"Psalm {row['psalm']}:{verses[-1][0].split(':')[1]}"
        marked = pinned(builder, row["marked"], f"Psalm {row['psalm']}")
        psalms.append({"psalm": row["psalm"], "r": ref_id(whole), "count": len(verses), "ends": row["ends"],
                       "marked": {**marked, "verse": int(row["marked"][0].split(":")[1])},
                       "last": pinned(builder, (last_label, row["last"]), f"last verse of Psalm {row['psalm']}")})
    return psalms


def check_figures(builder: Builder, study: dict, text: str) -> dict:
    figures = {
        "hezekiah": [{"step": s["step"], **pinned(builder, (s["ref"], s["says"]), "Hezekiah")} for s in L.HEZEKIAH],
        "pair": [{"who": p["who"], **pinned(builder, (p["ref"], p["says"]), "part 04 pair")} for p in L.PAIR],
        "pairBeneath": pinned(builder, (L.PAIR_BENEATH["ref"], L.PAIR_BENEATH["says"]), "part 04"),
        "faith": [{"who": f["who"], "asked": pinned(builder, f["asked"], "part 05"), "followed": pinned(builder, f["followed"], "part 05")} for f in L.FAITH],
        "actors": [{"who": a["who"], **pinned(builder, (a["ref"], a["does"]), "part 06")} for a in L.ACTORS],
        "song": [{"applied": s["applied"], **{k: pinned(builder, s[k], "part 07") for k in ("from", "to", "context")}} for s in L.SONG],
    }
    if L.FAITH_LINE not in text:
        raise BuildError("the part 05 figure's line is not word for word in the study")
    figures["faithLine"] = typographic(L.FAITH_LINE)
    close_text = " ".join(fold(r) if isinstance(r, str) else fold(r.get("t", "")) for b in study["close"]["blocks"] for r in b["runs"])
    for line in L.NOT_PROMISED + [p["line"] for p in L.PROMISES]:
        if fold(typographic(line)) not in close_text:
            raise BuildError(f"close: {line!r} is not in the study's closing paragraph")
    figures["notPromised"] = L.NOT_PROMISED
    figures["promises"] = [{"line": p["line"], **pinned(builder, (p["ref"], p["says"]), "close")} for p in L.PROMISES]
    return figures


def check_lists(builder: Builder, study: dict, text: str) -> dict:
    """Every drawn phrase is in its verse; every figure count comes from the Berean or from these lists."""
    title = f"{L.HERO['ink']} {L.HERO['turn']}"
    if title != study["title"]:
        raise BuildError(f"the heading's two parts make {title!r}, but the study's title is {study['title']!r}")
    for line in L.HERO["motto"]:
        in_verse(builder, L.HERO["motto_ref"], line.rstrip(";."), "motto")
    for key in list(L.OUTSIDE_QUOTES) + sorted(L.OWN_TERMS):
        if f'"{key}' not in text:
            raise BuildError(f"study_lists.py names {key!r}, but content.md never quotes it; remove the stale entry")
    return {"register": check_register(builder), "offered": check_offered(builder, text),
            "psalms": check_psalms(builder), "figures": check_figures(builder, study, text)}


def build(text: str, bible: dict, held: dict) -> str:
    builder = Builder(bible, held)
    study = parse(builder, text)
    lists = check_lists(builder, study, text)
    quoted = {b["r"] for part in study["parts"] for b in part["blocks"] if b["k"] == "quote"}
    promised = {p["r"] for p in lists["figures"]["promises"]}
    recovered = sum(1 for row in lists["register"] if row["kind"] == "recovered")
    numbers = {"parts": len(study["parts"]), "register": len(lists["register"]), "recovered": recovered,
               "notRecovered": len(lists["register"]) - recovered,
               "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted | promised),
               "references": len(builder.passages), "toConfirm": len(builder.checks)}
    hero = {**L.HERO, "trail": [list(t) for t in L.HERO["trail"]], "motto_r": builder.passage(L.HERO["motto_ref"])}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_text(encoding="utf-8").replace("\r\n", "\n").encode("utf-8")).hexdigest()[:16] for p in inputs}
    outside = {typographic(k): {"source": s, "held": bool(p)} for k, (s, p) in L.OUTSIDE_QUOTES.items()}
    data = {"study": study, "hero": hero, **lists, "kinds": L.KINDS, "numbers": numbers, "passages": builder.passages,
            "toConfirm": builder.checks, "outside": outside, "sources": [list(s) for s in L.SOURCES], "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.IH = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


SELFTEST = [
    ("a changed word in a block quotation", "but no one spoke a word to him", "but no one spoke a single word to him", "not word for word"),
    ("a block quotation under the wrong reference", "Job 2:13 · BSB", "Job 2:12 · BSB", "not word for word"),
    ("a changed word in a quoted phrase", '"Trophimus I left sick in Miletus"', '"Trophimus I left ill in Miletus"', "not in the verse cited"),
    ("a quotation cited to the wrong verse", "(Psalm 102:27 · BSB)", "(Psalm 102:26 · BSB)", "not in the verse cited"),
    ("a reference that does not exist", "(2 Timothy 4:20)", "(2 Timothy 4:23)", "does not resolve"),
    ("a chapter that does not exist", "Psalm 102 (and", "Psalm 152 (and", "chapter does not exist"),
    ("a link that leaves the site", "(/study/miracles)", "(https://example.com/miracles)", "only links within this site"),
    ("a link that looks local but leaves the site", "(/study/miracles)", "(//example.com/miracles)", "only links within this site"),
    ("a bare chapter:verse with no book", "(Philippians 2:27)", "(2:27)", "bare reference"),
    ("a line the page cannot place", "## 01 Job", "#### stray\n\n## 01 Job", "cannot place"),
    ("a note marker the page does not know", "[open] What is the oil?", "[aside] What is the oil?", "cannot place"),
    ("a changed word in an outside quotation, which then counts as Scripture", "they also are of God", "they also are from God", "not in any verse"),
    ("a changed promise in the close", "that His grace is enough", "that His grace is ample", "closing paragraph"),
]


def selftest(text: str, bible: dict, held: dict) -> int:
    """Wrong inputs, each changed in memory only. Each must be refused, and for the reason expected."""
    failed = 0
    # Two wrong lists: an outside quotation said to be in the wrong held source, and a register phrase in the wrong verse.
    for name, table, key, value, expected in [
        ("an outside quotation given to the wrong held source", L.OUTSIDE_QUOTES, "a bedlam of differing voices", ("John Calvin", L.CALVIN), "not in the held copy"),
        ("a register phrase given the wrong verse", L.REGISTER[8], "ill", ("2 Timothy 4:19", "Trophimus I left sick in Miletus"), "is not in 2 Timothy 4:19"),
    ]:
        saved = table[key]
        table[key] = value
        try:
            build(text, bible, held)
            print(f"  ACCEPTED {name}"); failed += 1
        except BuildError as error:
            ok = expected in str(error)
            failed += not ok
            print(f"  {'refused ' if ok else 'WRONG   '} {name}: {str(error).splitlines()[0][:120]}")
        finally:
            table[key] = saved
    for name, old, new, expected in SELFTEST:
        if old not in text:
            print(f"  NOT RUN  {name}: {old!r} is not in content.md"); failed += 1; continue
        try:
            build(text.replace(old, new, 1), bible, held)
            print(f"  ACCEPTED {name}"); failed += 1
        except BuildError as error:
            ok = expected in str(error)
            failed += not ok
            print(f"  {'refused ' if ok else 'WRONG   '} {name}: {str(error).splitlines()[0][:120]}")
    print(f"selftest: {len(SELFTEST) + 2 - failed} of {len(SELFTEST) + 2} wrong inputs refused for the expected reason; nothing written")
    return 1 if failed else 0


def main() -> int:
    try:
        text = CONTENT.read_text(encoding="utf-8")
        bible, held = load_bible(), load_held()
        if "--selftest" in sys.argv:
            return selftest(text, bible, held)
        output = build(text, bible, held)
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
