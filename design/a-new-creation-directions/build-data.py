#!/usr/bin/env python3
"""Build data.js for the A new creation mock-up from the study's content.md, study_lists.py, the site's Berean text and the
outside sources held on this PC.

Run from anywhere: python -B design/a-new-creation-directions/build-data.py
  --check     run every check and fail if data.js is not what this build would write (writes nothing)
  --selftest  feed the checks wrong inputs in memory and confirm each one is refused (writes nothing)
Exit 1 with a message, and data.js unchanged, if any check fails.

Checks: every content.md line is placed by a closed list of rules; block quotations are the whole Berean text of their
reference; every reference resolves with no gap; each quoted phrase is in the verse cited beside it, or (with none beside
it) in a verse its paragraph, part or the passage above may quote, or in the one part of the held source it is credited
to; italics are known studies (whose folders exist) or known terms; links stay on the site; every phrase in the lists is
in its stated verse as whole words. This proves the words are there. It does not prove a reading or a pairing is right.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True
import study_lists as L  # noqa: E402
from folds import build_lines, close_pairs, part_folds, text_folds  # noqa: E402
from held import check_outside, held_paths, load_held  # noqa: E402
from scripture_text import BOOKS, BSB, CANON, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/a-new-creation/content.md"
OUT = HERE / "data.js"
SCHEMA = 2
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(, | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])")
BARE = re.compile(r"(?<![\w:–])(\d+):(\d+)(?:–(\d+))?")
BOOK_NAME = re.compile(r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r")\b")
CHECK_NOTE = re.compile(r"\[check(?: before publishing)?(?:: ([^\]]*))?\]")
SITE_LINK = re.compile(r"^/(?![/\\])")
TAGS = ("read", "open", "care", "other")
TOP_FIELDS = {"Concepts": "concepts", "Motto": "motto", "Lead": "lead", "Frame": "frame", "Selection": "selection",
              "FoldLead": "foldLead", "FoldReads": "foldReads", "LinesLead": "linesLead"}
CLOSE_FIELDS = {"Close": "close", "Way": "way", "Invite": "invite", "Question": "question", "Again": "again", "Passage": "passage"}
KNOWN_KEYS = {*TOP_FIELDS, *CLOSE_FIELDS, "Hook", "Text"}
EXPECTED_JS = {"theme.js", "art.js", "nc-core.js", "nc-hero.js", "nc-figures.js", "nc-fold.js", "nc-more.js", "nc-questions.js", "nc.js"}
EXPECTED_QUESTIONS = 6


class Builder:
    def __init__(self, bible: dict, held: dict) -> None:
        self.bible, self.held = bible, held
        self.passages: dict = {}
        self.used = {"own": set(), "outside": set(), "links": set(), "italics": set(), "partial": set(), "exceptions": set()}
        self.checks: list = []

    def passage(self, label: str) -> str:
        label = label.replace("-", "–").strip()
        identity = ref_id(label) if REF_RE.fullmatch(label) else None
        if identity is None:
            raise BuildError(f"not a whole Scripture reference: {label!r}")
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}),
                                       "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]}
        return identity

    def text_of(self, identity: str) -> str:
        return fold(" ".join(v["t"] for v in self.passages[identity]["verses"])).replace('"', "").replace("'", "")

    def refs_in(self, text: str) -> list:
        """Every reference with its span: full ones, short continuations ("4:25, 28, 29") and bare "4:25" after a book name."""
        found = []
        def follow(book: str, chapter: str, end: int) -> None:
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
                end = more.end()
        for match in REF_RE.finditer(text):
            found.append((match.start(), match.end(), match.group(0)))
            follow(match.group(1), match.group(2), match.end())
        for match in BARE.finditer(text):
            if any(s <= match.start() < e for s, e, _ in found):
                continue
            books = [b.group(1) for b in BOOK_NAME.finditer(text, 0, match.start())]
            if not books:
                raise BuildError(f"a chapter and verse with no book named before it: {text[:90]!r}")
            tail = f"–{match.group(3)}" if match.group(3) else ""
            found.append((match.start(), match.end(), f"{books[-1]} {match.group(1)}:{match.group(2)}{tail}"))
            follow(books[-1], match.group(1), match.end())
        return sorted(found)

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {r,t} a verse, {s,t} a named study, {i} an italic term, {b} bold, {c} a note to check."""
        out, last = [], 0
        for match in CHECK_NOTE.finditer(text):
            out += self.markup_runs(text[last:match.start()], cited)
            out.append({"c": (match.group(1) or "").strip() or "before publishing"})
            self.checks.append(out[-1]["c"])
            last = match.end()
        return out + self.markup_runs(text[last:], cited)

    def markup_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.match(url):
                    raise BuildError(f"only links on this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            else:
                plain = italic.replace("’", "'")
                if plain in L.STUDY_LINKS:
                    self.used["links"].add(plain)
                    out.append({"s": f"../{L.STUDY_LINKS[plain]}/", "t": typographic(italic)})
                elif plain in L.ITALIC_TERMS:
                    self.used["italics"].add(plain)
                    out.append({"i": typographic(italic)})
                else:
                    raise BuildError(f"italic {italic!r} is neither a study on STUDY_LINKS nor a term on ITALIC_TERMS")
            last = match.end()
        return out + self.plain_runs(text[last:], cited)

    def plain_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
            if start > last:
                out.append(typographic(text[last:start]))
            identity = self.passage(label)
            cited.append(identity)
            out.append({"r": identity, "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, allowed: list, where: str, section: str) -> None:
        """Each quoted phrase: a credited outside source in its one part; else Scripture in the verses cited beside it (all of
        them), or, with none beside it, in a verse this paragraph may quote; else one of the study's own terms."""
        raw = CHECK_NOTE.sub("", raw).replace("*", "")
        if raw.count('"') % 2:
            raise BuildError(f"{where}: unbalanced quotation marks: {raw[:80]!r}")
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            plain = phrase.replace("’", "'")
            if plain in L.OUTSIDE_QUOTES:
                self.check_outside_quote(raw, plain, where)
                continue
            if not after:  # a reference later in the same sentence, before any other quotation, is still this quote's own
                rest = re.split(r'"|(?<=[.!?])\s', raw[match.end():], maxsplit=1)[0]
                later = re.search(r"\(([^)]*)\)", rest)
                after = later.group(1) if later else ""
            own = [label for _, _, label in self.refs_in(after)] if after and re.search(r"\d:\d", after) else []
            problem = self.scripture_problem(phrase, own, allowed)
            if problem is None:
                continue
            if (section, plain) in L.OWN_TERMS:
                self.used["own"].add((section, plain))
                continue
            raise BuildError(f"{where}: {problem}")

    def scripture_problem(self, phrase: str, own: list, allowed: list) -> str | None:
        pieces = [p.strip(" ,.!?;:") for p in re.split(r"…|\.\.\.", phrase) if p.strip(" ,.!?;:")]
        for piece in pieces:
            folded = fold(piece).replace('"', "").replace("'", "")
            variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
            found = lambda identity: any(has_words(v, self.text_of(identity)) for v in variants)  # noqa: E731
            bound = [label for label in own if (piece, label) not in L.QUOTE_EXCEPTIONS]
            self.used["exceptions"] |= {(piece, label) for label in own} & set(L.QUOTE_EXCEPTIONS)
            if bound:
                for label in bound:
                    if not found(self.passage(label)):
                        return f"quoted words {piece!r} are not in {label}, which is cited for them"
            elif not any(found(identity) for identity in allowed):
                names = ", ".join(self.passages[i]["label"] for i in dict.fromkeys(allowed)) or "none"
                return f"quoted words {piece!r} are not in any verse this paragraph may quote ({names})"
        return None

    def check_outside_quote(self, raw: str, phrase: str, where: str) -> None:
        name, key, part = L.OUTSIDE_QUOTES[phrase]
        if key == "bfm":
            named = re.findall(r"article ([IVX]+)\b", raw)
            if part not in named:
                raise BuildError(f"{where}: {phrase!r} is credited to article {part}, but its paragraph names {named or 'no article'}")
        check_outside(self.held, phrase, (name, key, part))
        self.used["outside"].add(phrase)

    def block(self, quote_lines: list, ref_line: str, where: str) -> dict:
        label, _, version = ref_line.strip().partition(" · ")
        if version != "BSB":
            raise BuildError(f"{where}: block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        text = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        quoted, bible = fold(text).replace('"', ""), plain_text(self.bible, label)
        rest = bible[len(quoted):]
        if label in L.PARTIAL_BLOCKS and bible.startswith(quoted) and quoted[-1] in ".!?" and rest.startswith(" "):
            self.used["partial"].add(label)  # the quotation stops at the end of a sentence; the page says how the verse goes on
            last = self.passages[self.passage(label)]["verses"][-1]["t"]
            start = max(i for i in range(len(last)) if fold(last[i:]).replace('"', "").strip() == rest.strip())
            return {"k": "quote", "t": text, "r": self.passage(label), "label": label, "goesOn": last[start:].strip()}
        if quoted != bible:
            raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {text}\n  bible: {plain_text(self.bible, label)}")
        return {"k": "quote", "t": text, "r": self.passage(label), "label": label}


class Parser:
    """content.md into the study. Every non-blank line must be placed by a rule here, or the build fails."""

    def __init__(self, builder: Builder) -> None:
        self.b = builder
        self.study: dict = {"parts": [], "questions": []}
        self.zone, self.part, self.section, self.question = "top", None, None, None
        self.deferred: list = []

    def scope(self) -> str:
        return {"part": self.part and self.part["n"], "question": self.question and self.question["id"]}.get(self.zone, self.zone)

    def pool(self) -> list:
        if self.zone == "part":
            quotes = [b["r"] for s in self.part["sections"] for b in s["blocks"] if b["k"] == "quote"]
            return self.part.get("readings", []) + quotes[-1:]
        if self.zone == "question":
            return [self.question["text"]] if "text" in self.question else []
        return []

    def para(self, raw: str, where: str) -> list:
        cited: list = []
        runs = self.b.runs(raw, cited)
        if self.zone in ("top", "close"):  # checked once the opening verse and every block quotation are known
            self.deferred.append((raw, cited, where, self.zone))
        else:
            self.b.check_quotes(raw, cited + self.pool(), where, self.scope())
        return runs

    def target(self, where: str) -> list:
        if self.zone == "question":
            return self.question["blocks"]
        if self.zone == "part" and self.section is not None:
            return self.section["blocks"]
        raise BuildError(f"{where}: a paragraph outside any part section or question")

    def heading(self, line: str, where: str) -> None:
        if m := re.fullmatch(r"## (\d\d) (.+)", line):
            index = len(self.study["parts"])
            if index >= len(L.PART_SLUGS):
                raise BuildError(f"{where}: more parts than PART_SLUGS names")
            self.part = {"n": m.group(1), "slug": L.PART_SLUGS[index], "title": typographic(m.group(2)), "sections": []}
            self.study["parts"].append(self.part)
            self.zone, self.section = "part", None
        elif m := re.fullmatch(r"## Question ([a-z]+): (.+)", line):
            self.question = {"id": m.group(1), "title": typographic(m.group(2)), "rawTitle": m.group(2), "blocks": []}
            self.study["questions"].append(self.question)
            self.zone = "question"
        elif m := re.fullmatch(r"## Close: (.+)", line):
            self.study["close"] = {"title": typographic(m.group(1))}
            self.zone = "close"
        else:
            raise BuildError(f"{where}: heading not recognised: {line}")

    def keyed(self, line: str, where: str) -> bool:
        if m := re.fullmatch(r"\*\*(Main readings|Consider|Reflect):\*\* (.+)", line):
            if self.zone != "part":
                raise BuildError(f"{where}: {m.group(1)} outside a part")
            if m.group(1) == "Main readings":
                self.part["readings"] = [self.b.passage(r) for r in m.group(2).split("; ")]
            else:
                self.part[m.group(1).lower()] = self.para(m.group(2), where)
            return True
        m = re.fullmatch(r"([A-Z][A-Za-z]+): (.+)", line)
        if not m:
            return False
        key, value = m.groups()
        if self.zone == "top" and key in TOP_FIELDS:
            name = TOP_FIELDS[key]
            self.study[name] = [typographic(x) for x in value.split(" · " if key == "Concepts" else " / ")] if key in ("Concepts", "Motto") else self.para(value, where)
            if key == "FoldReads":
                self.study["foldReadsRaw"] = value
        elif self.zone == "part" and key == "Hook" and self.section is None:
            self.part["hook"] = self.para(value, where)
        elif self.zone == "question" and key == "Text":
            self.question["text"] = self.b.passage(value)
        elif self.zone == "close" and key in CLOSE_FIELDS:
            close = self.study["close"]
            if key == "Passage":
                close["passage"] = self.b.passage(value)
            elif key == "Close":
                close["raw"] = value
                close["close"] = self.para(value, where)
            else:
                close[CLOSE_FIELDS[key]] = self.para(value, where)
        else:
            return False
        return True

    def parse(self, text: str) -> dict:
        lines = text.replace("\r\n", "\n").split("\n")
        used, i = 0, 0
        while i < len(lines):
            line = lines[i].strip()
            i += 1
            if not line:
                continue
            used += 1
            where = f"content.md line {i}"
            if line.startswith("# "):
                self.study["title"] = typographic(line[2:])
            elif line.startswith("## "):
                self.heading(line, where)
            elif line.startswith("### "):
                if self.zone != "part":
                    raise BuildError(f"{where}: a section heading outside a part: {line}")
                self.section = {"title": typographic(line[4:]), "blocks": []}
                self.part["sections"].append(self.section)
            elif line.startswith("> "):
                quote = [line]
                while i < len(lines) and lines[i].startswith(">"):
                    quote.append(lines[i]); i += 1; used += 1
                while i < len(lines) and not lines[i].strip():
                    i += 1
                if i >= len(lines):
                    raise BuildError(f"{where}: block quotation at the end of the file has no reference")
                block = self.b.block(quote, lines[i], where)
                i += 1; used += 1
                if self.zone == "top" and "opening" not in self.study:
                    self.study["opening"] = block
                else:
                    self.target(where).append(block)
            elif m := re.fullmatch(r"\[source:([a-z0-9-]+)\] (.+)", line):
                if m.group(1) not in L.SOURCE_LABELS:
                    raise BuildError(f"{where}: unknown source marker [source:{m.group(1)}]")
                self.target(where).append({"k": "source", "src": m.group(1), "runs": self.para(m.group(2), where)})
            elif m := re.fullmatch(r"\[([a-z]+)\] (.+)", line):
                if m.group(1) not in TAGS:
                    raise BuildError(f"{where}: unknown paragraph tag [{m.group(1)}]")
                self.target(where).append({"k": m.group(1), "runs": self.para(m.group(2), where)})
            elif self.keyed(line, where):
                pass
            elif re.match(r"[A-Z][A-Za-z]+: ", line) and (self.zone != "part" or line.split(":")[0] in KNOWN_KEYS):
                raise BuildError(f"{where}: a key this section does not allow: {line[:60]!r}")
            else:
                self.target(where).append({"k": "p", "runs": self.para(line, where)})
        if used != sum(1 for line in lines if line.strip()):
            raise BuildError("some lines of content.md were not placed on the page")
        return self.study


def finish(builder: Builder, parser: Parser) -> None:
    """Checks that need the whole text: the close's quotations, question titles, what must be there, unused list entries."""
    study = parser.study
    for key in ("title", "opening", *TOP_FIELDS.values(), "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    for key in (*CLOSE_FIELDS.values(), "raw"):
        if key not in study["close"]:
            raise BuildError(f"the close has no {key}")
    every_quote = [b["r"] for p in study["parts"] for s in p["sections"] for b in s["blocks"] if b["k"] == "quote"]
    for raw, cited, where, zone in parser.deferred:
        wider = every_quote + [study["close"]["passage"]] if zone == "close" else []
        builder.check_quotes(raw, cited + wider + [study["opening"]["r"]], where, zone)
    if len(study["parts"]) != len(L.PART_SLUGS):
        raise BuildError(f"PART_SLUGS names {len(L.PART_SLUGS)} parts; the text has {len(study['parts'])}")
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
    if len(study["questions"]) != EXPECTED_QUESTIONS:
        raise BuildError(f"the page says {EXPECTED_QUESTIONS} questions; the text has {len(study['questions'])}")
    for question in study["questions"]:
        if "text" not in question or not question["blocks"] or question["blocks"][0]["k"] != "read":
            raise BuildError(f"question {question['id']} must name its Text and open with this study's reading")
        builder.check_quotes(question.pop("rawTitle"), [question["text"]], f"question {question['id']} title", question["id"])
    unused = [("OWN_TERMS", set(L.OWN_TERMS) - builder.used["own"]), ("OUTSIDE_QUOTES", set(L.OUTSIDE_QUOTES) - builder.used["outside"]),
              ("STUDY_LINKS", set(L.STUDY_LINKS) - builder.used["links"]), ("ITALIC_TERMS", set(L.ITALIC_TERMS) - builder.used["italics"]),
              ("PARTIAL_BLOCKS", set(L.PARTIAL_BLOCKS) - builder.used["partial"]), ("QUOTE_EXCEPTIONS", set(L.QUOTE_EXCEPTIONS) - builder.used["exceptions"])]
    for name, left in unused:
        if left:
            raise BuildError(f"{name} has entries the text does not use: {sorted(left)}")


def check_code() -> None:
    """Expected page files only; the one markup string allowed is the fixed drawings in nc-core.js; no inline script or handler."""
    found = {path.name for path in (HERE / "js").glob("*.js")}
    if found != EXPECTED_JS:
        raise BuildError(f"page files differ from the expected list: missing {sorted(EXPECTED_JS - found)}, extra {sorted(found - EXPECTED_JS)}")
    for path in (HERE / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        for word in ("insertAdjacentHTML", "outerHTML", "document.write", "eval(", "new Function", "javascript:"):
            if word in text:
                raise BuildError(f"{path.name} uses {word}")
        if text.count("innerHTML") > (1 if path.name == "nc-core.js" else 0):
            raise BuildError(f"{path.name} uses innerHTML {text.count('innerHTML')} times; only art() in nc-core.js may, once")
    page = (HERE / "index.html").read_text(encoding="utf-8")
    if re.search(r"<script(?![^>]*\bsrc=)", page) or re.search(r"\son[a-z]+=", page):
        raise BuildError("index.html has an inline script or handler")
    for source in L.SOURCES:
        if not (source["href"].startswith("https://") or source["href"].startswith("/study/")):
            raise BuildError(f"source link must be https or a site page: {source['name']}: {source['href']}")
    for name, folder in L.STUDY_LINKS.items():
        if not re.fullmatch(r"[a-z0-9-]+-directions", folder) or not (HERE.parent / folder / "index.html").is_file():
            raise BuildError(f"study link {name!r} points at design/{folder}/, which has no index.html")


def figures(builder: Builder, study: dict, folds: list, more: list) -> dict:
    walked, books = set(), set()
    for part in study["parts"]:
        for identity in part["readings"]:
            passage = builder.passages[identity]
            walked |= {(passage["code"], v["c"], v["v"]) for v in passage["verses"]}
            books.add(passage["code"])
    spans, named = {f["span"] for f in folds}, {f["span"] for f in more}
    return {"parts": len(study["parts"]), "verses": len(walked), "books": len(books), "places": len(spans | named),
            "shared": len(spans & named), "questions": len(study["questions"])}


def fingerprints() -> dict:
    """Only this study's own inputs, so another job editing a shared frame file cannot make this page read as stale."""
    paths = {CONTENT, *HERE.glob("*.py"), *held_paths(L.HELD), *(BSB / f"{code}.json" for code in CANON)}
    return {path.relative_to(WEBSITE.parent).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()[:16] for path in sorted(paths)}


def build(text: str | None = None, bible: dict | None = None, held: dict | None = None) -> tuple:
    builder = Builder(bible or load_bible(), held or load_held(L.HELD))
    parser = Parser(builder)
    study = parser.parse(text if text is not None else CONTENT.read_text(encoding="utf-8-sig"))
    finish(builder, parser)
    check_code()
    folds, more = part_folds(builder, study), text_folds(builder, study)
    lines = build_lines(builder, study)
    close_pairs(builder, study["close"])
    study.pop("foldReadsRaw")
    numbers = figures(builder, study, folds, more)
    data = {"schema": SCHEMA, "study": study, "folds": folds, "more": more, "lines": lines, "linesPart": L.LINES_PART,
            "passages": builder.passages, "sources": L.SOURCES, "sourceLabels": L.SOURCE_LABELS, "numbers": numbers,
            "builtFrom": fingerprints() if text is None else {}}
    payload = "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.NC = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    return payload, numbers, builder


def report(numbers: dict, builder: Builder) -> None:
    """What the owner should know each run: notes marked to check, and a claim in the text the readings do not bear out."""
    notes = sorted(set(builder.checks))
    print(f"build-data: {len(builder.checks)} notes in the text are marked to check ({len(notes)} different): " + " | ".join(notes))
    if numbers["books"] != 6:
        print(f"build-data: owner: the Selection says the passages come from six letters; the main readings come from {numbers['books']} books")


def main() -> int:
    if sys.argv[1:] == ["--selftest"]:
        from build_selftest import run_selftest
        return run_selftest(sys.modules[__name__])
    check_only = sys.argv[1:] == ["--check"]
    if sys.argv[1:] and not check_only:
        print(f"build-data: FAILED: expected no arguments, --check or --selftest; received {sys.argv[1:]}", file=sys.stderr)
        return 2
    try:
        payload, numbers, builder = build()
        if check_only:
            if not OUT.exists() or OUT.read_text(encoding="utf-8") != payload:
                print(f"build-data: STALE: {OUT.name} is not what its inputs build now. Run build-data.py.", file=sys.stderr)
                return 1
        else:
            temporary = OUT.with_suffix(".js.tmp")
            temporary.write_text(payload, encoding="utf-8", newline="\n")
            os.replace(temporary, OUT)
    except (BuildError, OSError, KeyError, ValueError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    report(numbers, builder)
    done = "all checks pass; data.js is current" if check_only else f"all checks pass; wrote {OUT.name} ({len(payload):,} bytes)"
    print(f"build-data: {done}. {numbers}; {len(builder.passages)} passages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
