#!/usr/bin/env python3
"""Build data.js for the Learning to discern mock-up from the study's content.md, checking it against the site's
Berean text and the outside sources held on this PC.

Run from Website/: python design/learning-to-discern-directions/build-data.py
  --check     run every check and fail if data.js is stale; write nothing
  --selftest  feed wrong inputs in memory and prove each is refused for the right reason; write nothing
Exit 1, with data.js unchanged, if any check fails; exit 2 if a file cannot be read or written.
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
from scripture_text import REF_RE, BuildError, fold, load_bible, ref_id, typographic, verses_of  # noqa: E402
import study_lists as L  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/learning-to-discern/content.md"
OUT = HERE / "data.js"
CHECK_NOTE = re.compile(r"\[check(?:: ([^\]]+)| before publishing)\]")
INLINE = re.compile(CHECK_NOTE.pattern + r"|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; 1 John" is a new book
SHORT = re.compile(r"(?<![\w:.–])(\d+):(\d+)(?:–(\d+))?(?![\d:])")
QUOTE = re.compile(r'"([^"]+)"')
CHAIN = re.compile(r'(?:\s*(?:,|and|or)?\s*"[^"]*")*')
OWN_REF = re.compile(r'\s*\(((?:[1-3] )?[A-Za-z ]*\d+:\d+[^()"]*)\)')
PART_HEAD = re.compile(r"## (\d\d) (.+)")
QUESTIONS_HEAD, CLOSE_HEAD = "## Questions readers ask", "## Learning to discern"
FIELDS = ("Concepts", "Motto", "Lead", "Frame", "Selection", "Hook", "Way", "Close", "Invite", "Question", "Again", "Passage")
MARKS = {"[care] ": "care", "[read] ": "read", "[open] ": "open"}


def words(text: str) -> str:
    """Words only, lower case: quotation marks, punctuation and dashes are ignored when a phrase is matched."""
    return " " + re.sub(r"[^a-z0-9]+", " ", fold(text).replace("'", "").lower()).strip() + " "


def phrase_in(phrase: str, text_words: str) -> bool:
    return words(phrase) != "  " and words(phrase) in text_words


def pieces(phrase: str) -> list:
    return [p for p in re.split(r"\.\.\.|…", phrase) if words(p).strip()]


class Held:
    """The outside sources held on this PC, read once each and folded to words."""

    def __init__(self) -> None:
        self.cache: dict = {}

    def text(self, key: str) -> str:
        if key not in self.cache:
            spec = L.SOURCES_HELD[key]
            path = Path(spec["path"]).resolve()
            if not any(path.is_relative_to(root.resolve()) for root in L.SOURCE_ROOTS):
                raise BuildError(f"held source {key!r} is outside the allowed source folders: {path}")
            raw = path.read_text(encoding="utf-8", errors="replace")
            if path.suffix == ".json":
                found: list = []
                stack = [json.loads(raw)]
                while stack:
                    node = stack.pop()
                    if isinstance(node, str):
                        found.append(node)
                    elif isinstance(node, dict):
                        stack.extend(node.values())
                    elif isinstance(node, list):
                        stack.extend(node)
                raw = "\n".join(found)
            self.cache[key] = words(raw)
        return self.cache[key]


class Builder:
    def __init__(self, bible: dict, held: Held) -> None:
        self.bible = bible
        self.held = held
        self.passages: dict = {}
        self.checks: list = []
        self.used: dict = {"outside": set(), "pinned": set(), "short": set()}

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def text_of(self, key: str) -> str:
        return words(" ".join(t for _, t in self.passages[key]["verses"]))

    def require(self, label: str, phrase: str, what: str) -> str:
        """A drawn phrase must be in its verse, as whole words. Returns the verse's key."""
        key = self.passage(label)
        if not phrase_in(phrase, self.text_of(key)):
            raise BuildError(f"{what}: {phrase!r} is not in {label}")
        return key

    def refs_in(self, text: str, section: str) -> list:
        """Every reference in plain text as (start, end, label), with short continuations such as "1:1, 14"."""
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
        taken = [(s, e) for s, e, _ in found]
        for match in SHORT.finditer(text):
            if any(s <= match.start() < e for s, e in taken) or text[:match.start()].endswith(L.NOT_SCRIPTURE):
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
        return out + self.plain_runs(text[last:], section, cited), cited

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
        paragraph cites, its part's main readings or the passage printed above it; under three words, it must be
        pinned to its verse. An outside quotation is named in OUTSIDE_QUOTES, and checked if its source is held."""
        if raw.count('"') % 2:
            raise BuildError(f"{where}: an odd number of quotation marks, so a quotation cannot be told from its context")
        for match in QUOTE.finditer(raw):
            phrase = match.group(1)
            if (section, phrase) in L.OWN_TERMS:
                continue
            if (section, phrase) in L.OUTSIDE_QUOTES:
                self.used["outside"].add((section, phrase))
                name, held = L.OUTSIDE_QUOTES[(section, phrase)]
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
                targets = own or (cited + nearby)
            for piece in pieces(phrase):
                if not any(phrase_in(piece, self.text_of(k)) for k in targets):
                    labels = ", ".join(self.passages[k]["label"] for k in targets) or "none"
                    raise BuildError(f"{where}: quoted words {piece.strip()!r} are not in {labels}")

    def block(self, quote_lines: list, ref_line: str, where: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line.strip():
            raise BuildError(f"{where}: block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        bible = fold(" ".join(t for _, t in self.passages[key]["verses"])).replace('"', "")
        if fold(quoted).replace('"', "") != bible:
            raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label}


def paragraph(builder: Builder, raw: str, section: str, where: str, nearby: list) -> list:
    runs, cited = builder.runs(typographic(raw), section)
    builder.check_quotes(raw, section, cited, nearby, where)
    return runs


def readings(builder: Builder, body: str, section: str, where: str) -> list:
    """Main readings: references only, each optionally "carried forward" from an earlier part."""
    out = []
    for item in body.rstrip(".").split("; "):
        label, carried = item.removesuffix(", carried forward"), item.endswith(", carried forward")
        if not REF_RE.fullmatch(label):
            raise BuildError(f"{where}: main readings hold words that are not a reference: {item!r}")
        out.append({"r": builder.passage(label), "t": label, "carried": carried})
    return out


def parse(builder: Builder, text: str) -> dict:
    """Place every non-blank line of content.md, or refuse the build."""
    lines = text.splitlines()
    study: dict = {"intro": {}, "parts": [], "questions": [], "close": {}}
    section, holder, target, near, last_quote = "intro", None, study["intro"], [], None
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
            study["title"] = line[2:]
        elif line.startswith(">"):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; placed += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: block quotation has no reference line after it")
            item = builder.block(quote, lines[i], where); i += 1; placed += 1
            if holder is None:
                target.setdefault("quotes", []).append(item)
            else:
                holder.append(item)
            last_quote = item["r"]
        elif m := PART_HEAD.fullmatch(line):
            section, near, last_quote = m.group(1), [], None
            target = {"n": section, "title": m.group(2), "subs": []}
            study["parts"].append(target)
            holder = None
        elif line == QUESTIONS_HEAD:
            section, target, holder, near, last_quote = "questions", None, None, [], None
        elif line == CLOSE_HEAD:
            section, target, holder, near, last_quote = "close", study["close"], None, [], None
        elif line.startswith("### ") and section == "questions":
            item = {"q": line[4:], "blocks": []}
            study["questions"].append(item)
            holder, last_quote = item["blocks"], None
        elif line.startswith("### ") and section not in ("intro", "close"):
            sub = {"title": line[4:], "blocks": []}
            target["subs"].append(sub)
            holder = sub["blocks"]
        elif (m := re.fullmatch(r"\*\*Main readings:\*\* (.+)", line)) and section[:1].isdigit():
            target["readings"] = readings(builder, m.group(1), section, where)
            near = [r["r"] for r in target["readings"]]
        elif (m := re.fullmatch(r"\*\*(Consider|Reflect):\*\* (.+)", line)) and section[:1].isdigit():
            target[m.group(1).lower()] = paragraph(builder, m.group(2), section, where, nearby)
        elif (m := re.fullmatch(r"([A-Z][a-z]+): (.+)", line)) and m.group(1) in FIELDS and holder is None and target is not None:
            field, body = m.groups()
            if field == "Concepts":
                target["concepts"] = body.split(" · ")
            elif field == "Motto":
                target["motto"] = body.split(" / ")
            elif field == "Passage":
                target["passage"] = builder.passage(body)
            else:
                target[field.lower()] = paragraph(builder, body, section, where, nearby)
        elif (m := re.fullmatch(r"- \*\*([^*]+?)[.:]\*\* (.+)", line)) and holder is not None:
            if not holder or holder[-1]["k"] != "list":
                holder.append({"k": "list", "items": []})
            holder[-1]["items"].append({"label": m.group(1), "runs": paragraph(builder, m.group(2), section, where, nearby)})
        elif (mark := next((k for k in MARKS if line.startswith(k)), None)) and holder is not None:
            holder.append({"k": MARKS[mark], "runs": paragraph(builder, line[len(mark):], section, where, nearby)})
        elif line.startswith(("#", "- ", "* ", "|", "<", "[")) or holder is None:
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        else:
            holder.append({"k": "p", "runs": paragraph(builder, line, section, where, nearby)})
    total = sum(1 for line in lines if line.strip())
    if placed != total:
        raise BuildError(f"{total - placed} lines of content.md were not placed on the page")
    check_shape(study)
    return study


def check_shape(study: dict) -> None:
    """The page places the opening, the parts and the close in fixed places; content.md must still have that shape."""
    intro, close = study["intro"], study["close"]
    for key in ("concepts", "motto", "lead", "quotes", "frame", "selection"):
        if key not in intro:
            raise BuildError(f"the opening has no {key}")
    for key in ("way", "close", "invite", "question", "again", "passage"):
        if key not in close:
            raise BuildError(f"the close has no {key}")
    if len(intro["motto"]) != 2:
        raise BuildError(f"the motto must be two lines, found {intro['motto']}")
    if [p["n"] for p in study["parts"]] != list(L.PART_CHECKS):
        raise BuildError(f"the page draws parts {list(L.PART_CHECKS)}; content.md has {[p['n'] for p in study['parts']]}")
    for part in study["parts"]:
        missing = [k for k in ("readings", "hook", "consider", "reflect") if k not in part]
        if missing or not part["subs"]:
            raise BuildError(f"part {part['n']} needs main readings, a hook, sub-heads, Consider and Reflect (missing {missing})")
    if not study["questions"]:
        raise BuildError("content.md has no questions readers ask")


def build(text: str, bible: dict, held: Held) -> str:
    builder = Builder(bible, held)
    study = parse(builder, text)
    from drawn import check_drawn
    drawn = check_drawn(builder, study, text, words, phrase_in)
    for kind, table, name in (("outside", L.OUTSIDE_QUOTES, "OUTSIDE_QUOTES"), ("pinned", L.PINNED_QUOTES, "PINNED_QUOTES"), ("short", L.SHORT_REFS, "SHORT_REFS")):
        if unused := set(table) - builder.used[kind]:
            raise BuildError(f"{name} has entries the text no longer uses: {sorted(unused)}")
    for title, url in L.STUDY_NAMES.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"study {title!r} links to {url}, which has no index.html on this PC")
    walked = [r["r"] for p in study["parts"] for r in p["readings"] if not r["carried"]]
    quoted = {b["r"] for p in study["parts"] for s in p["subs"] for b in s["blocks"] if b["k"] == "quote"}
    quoted |= {b["r"] for q in study["questions"] for b in q["blocks"] if b["k"] == "quote"}
    quoted |= {b["r"] for b in study["intro"]["quotes"]} | {study["close"]["passage"]}
    shown = len({(builder.passages[k]["label"].rsplit(" ", 1)[0], cv) for k in quoted for cv, _ in builder.passages[k]["verses"]})
    held = sum(1 for _, h in L.OUTSIDE_QUOTES.values() if h)
    numbers = {"parts": len(study["parts"]), "walked": len(walked), "versesShown": shown, "references": len(builder.passages),
               "qualities": 1 + len(L.WISDOM["then"]), "listen": len(drawn["listen"]), "questions": len(study["questions"]),
               "outside": len(L.OUTSIDE_QUOTES), "outsideHeld": held, "openChecks": len(builder.checks)}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "drawn.py", HERE / "scripture_text.py"]
    # Hashed with line endings made the same, so a Windows or Unix checkout does not make data.js look stale.
    prints = {p.name: hashlib.sha256(p.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:16] for p in inputs}
    outside = [{"t": phrase, "from": name, "checked": bool(h)} for (_, phrase), (name, h) in L.OUTSIDE_QUOTES.items()]
    data = {"study": study, "passages": builder.passages, **drawn, "numbers": numbers, "title": L.TITLE,
            "openChecks": builder.checks, "outside": outside, "sources": L.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.LTD = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


# Wrong text, fed in memory: (what it is, the words replaced, the wrong words, a phrase the refusal must contain).
SELFTEST = [
    ("a changed word in a block quotation", "> Beloved, do not believe every spirit", "> Beloved, do not trust every spirit", "not word for word"),
    ("a block quotation under the wrong reference", "James 3:17 · BSB", "James 3:16 · BSB", "not word for word"),
    ("a changed word in a quoted phrase", '"many of them believed"', '"most of them believed"', "not in"),
    ("a quote cited to the wrong verse", "(Galatians 1:10)", "(Galatians 1:11)", "not in"),
    ("a reference that does not exist", "(1 John 2:19)", "(1 John 6:19)", "does not resolve"),
    ("a link that leaves the site", "Read the passage again before you answer.", "Read the [passage](https://example.com) again before you answer.", "only site links"),
    ("a line the page cannot place", "## 01 Test the spirits", "#### stray\n\n## 01 Test the spirits", "does not know how to place"),
    ("an unbalanced quotation mark", '"Whoever knows God listens to us".', '"Whoever knows God listens to us.', "odd number"),
    ("an outside quotation edited away from its named wording", "possesses full dignity", "possesses full worth", "are not in"),
    ("a fifth mark renamed in part 05", "- **They want something.**", "- **They want money.**", "do not match"),
    ("a short quote with no verse", "Read again tomorrow if you need to;", 'Read "again" tomorrow if you need to;', "short quote"),
]

# Wrong entries in study_lists.py, patched in memory: (what it is, attribute path, wrong value, refusal phrase).
LIST_CASES = [
    ("a station verse phrase not in its verse", ("CHECKS", 1, "verses"), [("Acts 17:11", "examined the Scriptures once")], "is not in"),
    ("a station question the study does not ask", ("CHECKS", 2, "from_text"), "Am I being clever?", "is not in content.md"),
    ("a clause's verdict moved to the wrong verse", ("CLAUSES",), [("1 John 4:2", "Every spirit that confesses", "is not from God")], "is not in"),
    ("a wider view that does not hold the verse", ("WIDEN",), [("Acts 17:11", "The verse"), ("Acts 17:13–15", "x")], "does not hold"),
    ("James's qualities out of his order", ("WISDOM", "then"), ["gentle", "peace-loving", "accommodating", "full of mercy and good fruit", "impartial", "sincere"], "in this order"),
    ("a listening question sent to the wrong part", ("LISTEN", "Scripture"), "02", "cites no verse"),
    ("an outside quotation looked for in the wrong held copy", ("SOURCES_HELD", "foundation", "path"), CONTENT.with_name("working.md"), "not in the site's doctrinal"),
    ("a held source outside the allowed folders", ("SOURCES_HELD", "foundation", "path"), L.PROJECT.parent / "elsewhere.json", "outside the allowed"),
]


def _set(path: tuple, value):
    """Patch one entry of study_lists in memory; returns a function that puts it back."""
    holder = L if len(path) == 1 else getattr(L, path[0])
    for step in path[1:-1]:
        holder = holder[step]
    last = path[-1]
    if holder is L:
        saved = copy.deepcopy(getattr(L, last))
        setattr(L, last, value)
        return lambda: setattr(L, last, saved)
    saved = copy.deepcopy(holder[last])
    holder[last] = value
    return lambda: holder.__setitem__(last, saved)


def selftest(text: str, bible: dict) -> int:
    build(text, bible, Held())  # the real text must build, or every refusal below proves nothing
    failures = 0

    def attempt(name: str, expected: str, new_text: str) -> None:
        nonlocal failures
        try:
            build(new_text, bible, Held())
            print(f"selftest: NOT REFUSED: {name}", file=sys.stderr)
            failures += 1
        except BuildError as error:
            ok = expected in str(error)
            failures += not ok
            print(f"selftest: {'refused' if ok else 'REFUSED FOR THE WRONG REASON'}: {name}: {str(error).splitlines()[0]}")

    for name, old, new, expected in SELFTEST:
        if old not in text:
            print(f"selftest: cannot apply {name!r}: {old!r} is not in content.md", file=sys.stderr)
            failures += 1
            continue
        attempt(name, expected, text.replace(old, new, 1))
    for name, path, value, expected in LIST_CASES:
        restore = _set(path, value)
        try:
            attempt(name, expected, text)
        finally:
            restore()
    build(text, bible, Held())  # every patch was put back
    total = len(SELFTEST) + len(LIST_CASES)
    print(f"selftest: {total - failures} of {total} wrong inputs refused as expected; nothing written")
    return 1 if failures else 0


def main() -> int:
    try:
        text = CONTENT.read_text(encoding="utf-8")
        bible = load_bible()
        if "--selftest" in sys.argv:
            return selftest(text, bible)
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
