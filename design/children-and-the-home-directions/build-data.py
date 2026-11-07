#!/usr/bin/env python3
"""Build data.js for the Children and the home mock-up from the study's content.md, checking it against the site's
Berean text and the copy of the Baptist Faith and Message 2000 held on this PC.

Run from Website/: python -B design/children-and-the-home-directions/build-data.py
  --check     run every check and fail if data.js is not what this build would write; writes nothing
  --selftest  feed the checks wrong inputs in memory and confirm each one is refused; writes nothing
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
from figures import build_figures  # noqa: E402
from held import check_outside, load_held  # noqa: E402
from scripture_text import BOOKS, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/children-and-the-home/content.md"
OUT = HERE / "data.js"
BOOK_NAMES = "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True))
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])")
CHAPTER_RE = re.compile(r"\b(" + BOOK_NAMES + r") (\d+)(?![\d:–-])")
BARE_RE = re.compile(r"(?<![\w:–.-])(\d+):(\d+)(?:–(?:(\d+):)?(\d+))?(?![\d:])")
CHECK_NOTE = re.compile(r"\[check(?: before publishing)?(?:: ([^\]]*))?\]")
SITE_LINK = re.compile(r"^/(?![/\\])[A-Za-z0-9/_?=&#.-]*$")
MARKERS = {"[care] ": "care", "[open] ": "open"}
LIMITS = "**Its limits.** "
FIELDS = ("Concepts", "Motto", "Lead", "Frame", "Selection", "Hook", "Way", "Close", "Invite", "Question", "Again", "Passage")
QUESTIONS_HEAD = "Questions readers bring"


class Builder:
    def __init__(self, bible: dict, held: dict, lists) -> None:
        self.bible, self.held, self.lists = bible, held, lists
        self.passages: dict = {}
        self.used = {"own": set(), "outside": set(), "links": set(), "italics": set(), "pinned": set(), "spelling": set(), "kinds": set()}

    def passage(self, label: str) -> str:
        """A verse reference ("Genesis 25:27–28") or a whole chapter ("Genesis 27"). Returns its key."""
        label = label.replace("-", "–").strip()
        chapter = re.fullmatch(r"(.+) (\d+)", label)
        if chapter and chapter.group(1) in BOOKS:
            code, number = BOOKS[chapter.group(1)], int(chapter.group(2))
            verses = sorted((int(k.split(":")[1]), text) for k, text in self.bible[code].items() if int(k.split(":")[0]) == number)
            if not verses:
                raise BuildError(f"chapter does not exist in the Berean: {label}")
            key = f"{code}.{number}"
            self.passages[key] = {"label": label, "verses": [[f"{number}:{v}", text] for v, text in verses]}
            return key
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def readings(self, body: str) -> list:
        """The main readings line: references split by ';', a note in brackets dropped, "Psalms 127–128" as two chapters."""
        keys = []
        for piece in re.sub(r"\s*\([^)]*\)\s*$", "", body).split(";"):
            piece = piece.strip()
            if m := re.fullmatch(r"Psalms (\d+)–(\d+)", piece):
                keys += [self.passage(f"Psalm {n}") for n in range(int(m.group(1)), int(m.group(2)) + 1)]
            else:
                keys.append(self.passage(piece))
        return keys

    def text_of(self, key: str) -> str:
        return fold(" ".join(v[1] for v in self.passages[key]["verses"])).replace('"', "")

    def refs_in(self, text: str, book: str | None) -> list:
        """Every reference in plain text with its span: verses, short continuations ("6:1, 12"), chapters, and bare
        "6:9" read in the book named last before it, or the part's own book."""
        found = []
        for match in REF_RE.finditer(text):
            name, chapter = match.group(1), match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{name} {chapter}:{more.group(3)}{tail}"))
                end = more.end()
        taken = [(s, e) for s, e, _ in found]
        for match in CHAPTER_RE.finditer(text):
            if not any(s <= match.start() < e for s, e in taken):
                found.append((match.start(), match.end(), match.group(0)))
        taken = [(s, e) for s, e, _ in found]
        for match in BARE_RE.finditer(text):
            if any(s <= match.start() < e for s, e in taken):
                continue
            before = [label for s, _, label in sorted(found) if s < match.start()]
            name = re.match(r"(" + BOOK_NAMES + ")", before[-1]).group(1) if before else book
            if not name:
                raise BuildError(f"a bare reference {match.group(0)!r} with no book named before it: {text[:60]!r}")
            found.append((match.start(), match.end(), f"{name} {match.group(0)}"))
        return sorted(found)

    def runs(self, text: str, cited: list, book: str | None) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {c} (a note still to check)."""
        out, last = [], 0
        for match in CHECK_NOTE.finditer(text):
            out += self.markup_runs(text[last:match.start()], cited, book)
            out.append({"c": (match.group(1) or "").strip() or "before publishing"})
            last = match.end()
        return out + self.markup_runs(text[last:], cited, book)

    def markup_runs(self, text: str, cited: list, book: str | None) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited, book)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.match(url) or ".." in url:
                    raise BuildError(f"only links on this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": bold})
            else:
                plain = italic.replace("’", "'")
                if plain in self.lists.STUDY_LINKS:
                    self.used["links"].add(plain)
                    out.append({"s": f"../{self.lists.STUDY_LINKS[plain]}/", "t": italic})
                elif plain in self.lists.ITALIC_TERMS:
                    self.used["italics"].add(plain)
                    out.append({"i": italic})
                else:
                    raise BuildError(f"italic {italic!r} is neither a study on STUDY_LINKS nor a term on ITALIC_TERMS")
            last = match.end()
        return out + self.plain_runs(text[last:], cited, book)

    def plain_runs(self, text: str, cited: list, book: str | None) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text, book):
            if start > last:
                out.append(text[last:start])
            key = self.passage(label)
            cited.append(key)
            out.append({"r": key, "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(text[last:])
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, allowed: list, where: str, section: str, book: str | None) -> None:
        """Each quoted phrase is Scripture in the verses it cites (every one of them), or in a verse its paragraph cites,
        its part's readings or the passage printed just above it; or pinned to a verse; or a held outside source; or
        one of the study's own terms."""
        raw = CHECK_NOTE.sub("", raw)
        lists = self.lists
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            plain = phrase.replace("’", "'")
            if (section, plain) in lists.OWN_TERMS:
                self.used["own"].add((section, plain))
                continue
            if plain in lists.OUTSIDE_QUOTES:
                check_outside(self.held, plain, lists.OUTSIDE_QUOTES[plain])
                self.used["outside"].add(plain)
                continue
            if (section, plain) in lists.SPELLING:
                self.check_spelling(section, plain)
                continue
            if (section, plain) in lists.PINNED:
                after = lists.PINNED[(section, plain)]
                self.used["pinned"].add((section, plain))
            if not after:  # a reference later in the same sentence, before any other quotation, is still this quote's own
                rest = re.split(r'"|(?<=[.!?])\s', raw[match.end():], maxsplit=1)[0]
                later = re.search(r"\(([^)]*)\)", rest)
                after = later.group(1) if later else ""
            named = self.refs_in(raw[:match.start()], book)  # the book in force where the quotation stands
            here = re.match(r"(" + BOOK_NAMES + ")", named[-1][2]).group(1) if named else book
            own = [label for _, _, label in self.refs_in(after, here)]
            pieces = [p.strip(" ,.!?;:") for p in re.split(r"…|\.\.\.", phrase) if p.strip(" ,.!?;:")]
            for piece in pieces:
                folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")
                variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
                found = lambda key: any(has_words(v, self.text_of(key).replace("'", "")) for v in variants)  # noqa: E731
                if own:
                    for label in own:
                        if not found(self.passage(label)):
                            raise BuildError(f"{where}: quoted words {piece!r} are not in {label}, which is cited for them")
                elif not any(found(key) for key in allowed):
                    names = ", ".join(self.passages[k]["label"] for k in allowed) or "none"
                    raise BuildError(f"{where}: quoted words {piece!r} are not in any verse this paragraph may quote ({names})")

    def check_spelling(self, section: str, phrase: str) -> None:
        label, berean = self.lists.SPELLING[(section, phrase)]
        swapped = phrase
        for british, american in self.lists.BRITISH.items():
            swapped = re.sub(rf"\b{british}", american, swapped, flags=re.I)
        if swapped.lower() != berean.lower() or swapped == phrase:
            raise BuildError(f"SPELLING: {phrase!r} does not differ from {berean!r} only in British spelling")
        if not has_words(fold(berean), plain_text(self.bible, label)):
            raise BuildError(f"SPELLING gives {berean!r} as the Berean at {label}, but the verse does not have it")
        self.used["spelling"].add((section, phrase))

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = fold(" ".join(line.removeprefix(">").strip() for line in quote_lines)).replace('"', "")
        key = self.passage(label)
        bible = plain_text(self.bible, label)
        if quoted != bible:
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        if label not in self.lists.QUOTE_KINDS:
            raise BuildError(f"block quotation at {label} has no kind of sentence on QUOTE_KINDS")
        self.used["kinds"].add(label)
        kind = self.lists.QUOTE_KINDS[label]
        return {"k": "quote", "r": key, "label": label, "kind": kind, "why": self.lists.NO_KIND.get(label) if kind is None else None}


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"opening": [], "parts": [], "questions": []}
    current, section, deferred, book = None, "opening", [], None
    used = i = 0

    def para(raw: str, where: str) -> list:
        """Runs for a line, after its quotations are checked against what this line may quote."""
        cited: list = []
        runs = builder.runs(typographic(raw), cited, book)
        if section == "close":
            deferred.append((raw, cited, where))
            return runs
        holder = current if current is not None else {"blocks": study["opening"]}
        last = next((b["r"] for b in reversed(holder["blocks"]) if b["k"] == "quote"), None)
        builder.check_quotes(raw, cited + holder.get("readings", []) + ([last] if last else []), where, section, book)
        return runs

    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        target = current["blocks"] if current is not None else study["opening"]
        if line.startswith("# "):
            study["title"] = line[2:]
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip() if i < len(lines) else ""
            i += 1; used += 1
            target.append(builder.block(quote, ref_line))
        elif line.startswith("## "):
            head, book = line[3:], None
            if head == QUESTIONS_HEAD:
                section, current = "questions", None
            elif m := re.fullmatch(r"(0[1-9]) (.+)", head):
                section = m.group(1)
                current = {"n": section, "title": typographic(m.group(2)), "blocks": []}
                study["parts"].append(current)
            elif "close" not in study and study["questions"]:
                section, current = "close", None
                study["close"] = {"title": head}
            else:
                raise BuildError(f"{where}: a heading the page does not know: {head!r}")
        elif line.startswith("### "):
            if section == "questions" or (current is not None and current.get("id")):
                section = f"q{len(study['questions']) + 1}"
                current = {"id": section, "title": [], "blocks": []}
                study["questions"].append(current)
                current["title"] = para(line[4:], where)
            elif current is not None:
                para(line[4:], where)
                current["blocks"].append({"k": "h3", "t": typographic(line[4:])})
            else:
                raise BuildError(f"{where}: a sub-head outside any part: {line[:60]!r}")
        elif m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line):
            label, body = m.groups()
            if current is None or "n" not in current:
                raise BuildError(f"{where}: {label} outside any part")
            if label == "Main readings":
                current["readings"] = builder.readings(body)
                book = builder.passages[current["readings"][0]]["label"].rsplit(" ", 1)[0]
                current["readingsNote"] = (re.search(r"\(([^)]*)\)\s*$", body) or [None, None])[1]
            else:
                current[label.lower()] = para(body, where)
        elif line.startswith(LIMITS):
            if current is None or "n" not in current:
                raise BuildError(f"{where}: an 'Its limits' note outside any part")
            target.append({"k": "limits", "runs": para(line[len(LIMITS):], where)})
        elif marker := next((k for k in MARKERS if line.startswith(k)), None):
            target.append({"k": MARKERS[marker], "runs": para(line[len(marker):], where)})
        elif line.startswith("- ") and target and target[-1]["k"] == "care":
            target[-1].setdefault("items", []).append(para(line[2:], where))
        elif (m := re.match(r"([A-Z][a-z]+): (.*)", line)) and m.group(1) in FIELDS:
            field, body = m.groups()
            holder = study["close"] if section == "close" else (current if current is not None else study)
            if field == "Concepts":
                holder["concepts"] = body.split(" · ")
            elif field == "Motto":
                holder["motto"] = body.split(" / ")
            elif field == "Passage":
                holder["passage"] = builder.passage(body)
            else:
                holder[field.lower()] = para(body, where)
                if field == "Frame":
                    study["frameRaw"] = body
                if field == "Way":
                    study["close"]["wayRaw"] = body
        elif section == "opening" and target and target[-1]["k"] == "care" and target[-1].get("items") and not target[-1].get("more"):
            target[-1].setdefault("more", []).append(para(line, where))
        elif current is not None:
            current["blocks"].append({"k": "p", "runs": para(line, where)})
        else:
            raise BuildError(f"{where}: a line outside any section that the page does not know how to place: {line[:60]!r}")
    if used != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    finish(builder, study, deferred)
    return study


def finish(builder: Builder, study: dict, deferred: list) -> None:
    """Checks that need the whole text: the close's quotations, the shape, the kinds, and that every list is used."""
    lists = builder.lists
    for key in ("title", "concepts", "motto", "lead", "frame", "selection", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    if " ".join(lists.TITLE) != study["title"]:
        raise BuildError(f"TITLE {lists.TITLE} does not make the study's title {study['title']!r}")
    if len(study["motto"]) != 2:
        raise BuildError("the motto must have two lines, split by ' / '")
    for key in ("way", "close", "invite", "question", "again", "passage"):
        if key not in study["close"]:
            raise BuildError(f"the close has no {key.title()}:")
    every_quote = [b["r"] for s in [{"blocks": study["opening"]}] + study["parts"] for b in s["blocks"] if b["k"] == "quote"]
    for raw, cited, where in deferred:
        builder.check_quotes(raw, cited + every_quote + [study["close"]["passage"]], where, "close", None)
    if [p["n"] for p in study["parts"]] != [f"{n:02d}" for n in range(1, len(study["parts"]) + 1)]:
        raise BuildError("the parts must run 01, 02, … in order")
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
        if sum(1 for b in part["blocks"] if b["k"] == "limits") != 1:
            raise BuildError(f"part {part['n']} must have exactly one 'Its limits' note")
    if not study["opening"] or study["opening"][0]["k"] != "quote" or not any(b["k"] == "care" and b.get("items") for b in study["opening"]):
        raise BuildError("the opening must print its passage, then the care note with its help lines")
    for name, kind in lists.KINDS.items():
        if f'"{kind["sample"]}"' not in study["frameRaw"]:
            raise BuildError(f"KINDS: the frame no longer quotes the {name} sample {kind['sample']!r}")
        pieces = [p.strip(" ,.;") for p in kind["sample"].split("…")]
        text = plain_text(builder.bible, kind["ref"]).replace("'", "")
        if not all(has_words(fold(p).replace("'", ""), text) for p in pieces):
            raise BuildError(f"KINDS: the {name} sample is not in {kind['ref']}")
        if kind["asks"] not in study["frameRaw"] or kind["way"] not in study["close"]["wayRaw"]:
            raise BuildError(f"KINDS: the {name} wording is not the study's own (frame {kind['asks']!r}, way {kind['way']!r})")
        kind["r"] = builder.passage(kind["ref"])
    unused = [("OWN_TERMS", set(lists.OWN_TERMS) - builder.used["own"]),
              ("OUTSIDE_QUOTES", set(lists.OUTSIDE_QUOTES) - builder.used["outside"]),
              ("STUDY_LINKS", set(lists.STUDY_LINKS) - builder.used["links"]),
              ("ITALIC_TERMS", set(lists.ITALIC_TERMS) - builder.used["italics"]),
              ("PINNED", set(lists.PINNED) - builder.used["pinned"]),
              ("SPELLING", set(lists.SPELLING) - builder.used["spelling"]),
              ("QUOTE_KINDS", set(lists.QUOTE_KINDS) - builder.used["kinds"])]
    for name, left in unused:
        if left:
            raise BuildError(f"{name} has entries the text does not use: {sorted(left)}")
    del study["frameRaw"], study["close"]["wayRaw"]


def build_study(text: str, lists, bible: dict, held: dict) -> tuple:
    builder = Builder(bible, held, lists)
    study = parse(builder, text)
    return builder, study, build_figures(builder)


def build() -> str:
    builder, study, figures = build_study(CONTENT.read_text(encoding="utf-8"), L, load_bible(), load_held(L.HELD))
    blocks = [b for s in [{"blocks": study["opening"]}] + study["parts"] for b in s["blocks"]]
    quoted = {b["r"] for b in blocks if b["k"] == "quote"} | {study["close"]["passage"]}
    kinds_on_page = {name: sum(1 for b in blocks if b["k"] == "quote" and b["kind"] == name) for name in L.KINDS}
    numbers = {"kinds": len(L.KINDS), "parts": len(study["parts"]), "limits": sum(1 for b in blocks if b["k"] == "limits"),
               "links": len(figures["chain"]["links"]), "quotes": sum(1 for b in blocks if b["k"] == "quote"),
               "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted), "kindsOnPage": kinds_on_page}
    inputs = [CONTENT] + sorted(HERE.glob("*.py"))
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    data = {"study": study, "kinds": L.KINDS, "passages": builder.passages, "figures": figures, "numbers": numbers,
            "trail": L.TRAIL, "titleParts": L.TITLE, "sources": L.SOURCES,
            "outside": {k: v[0] for k, v in L.OUTSIDE_QUOTES.items()}, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.CH = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def warn_missing_links() -> None:
    for name, folder in L.STUDY_LINKS.items():
        if not (HERE.parent / folder / "index.html").is_file():
            print(f"build-data: warning: {name!r} links to design/{folder}/, which has no index.html yet", file=sys.stderr)


def main() -> int:
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
    temporary.write_text(output, encoding="utf-8", newline="\n")
    os.replace(temporary, OUT)
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
