#!/usr/bin/env python3
"""Build data.js for the Fear, anxiety and despair mock-up from the study's content.md, checking it against the site's
Berean text and the one outside source held on this PC.

Run from Website/: python design/fear-anxiety-and-despair-directions/build-data.py
  --check     run every check and fail if data.js is stale; write nothing
  --selftest  feed wrong inputs in memory and prove each is refused for the right reason; write nothing (selftest.py)
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
from scripture_text import BOOKS, REF_RE, BuildError, fold, load_bible, ref_id, typographic, verses_of  # noqa: E402
import study_lists as L  # noqa: E402
from drawn import check_drawn  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/christian-life/fear-anxiety-and-despair/content.md"
OUT = HERE / "data.js"
CHECK_NOTE = re.compile(r"\[check(?:: ([^\]]+)| before publishing)\]")
INLINE = re.compile(CHECK_NOTE.pattern + r"|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; 1 John" is a new book
SHORT = re.compile(r"(?<![\w:.–])(\d+):(\d+)(?:–(\d+))?(?![\d:])")
# A whole chapter named without a verse: "Psalm 88", "Job 3", "1 Kings 18", "Psalms 42–43".
CHAPTER = re.compile(r"\b(Psalms(?= \d+–)|" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+)(?:–(\d+))?(?![\d:–])")
QUOTE = re.compile(r'"([^"]+)"')
CHAIN = re.compile(r'(?:\s*(?:,|and|or)?\s*"[^"]*")*')
OWN_REF = re.compile(r'\s*\(((?:[1-3] )?[A-Za-z ]*\d+:\d+[^()"]*)\)')
PART_HEAD = re.compile(r"## (\d\d) (.+)")
HELP_HEAD, QUESTIONS_HEAD, CLOSE_HEAD = "## Help first", "## Questions readers bring", "## Keep reading to what God does next"
FIELDS = {"intro": ("Concepts", "Motto", "Lead", "Words", "Selection"), "help": ("Lead",),
          "part": ("Hook", "Line", "Setting", "Limit"), "close": ("Way", "Close", "Invite", "Help", "Question", "Again", "Passage")}
MARKS = {"[care] ": "care", "[read] ": "read"}
STAR = "\x00"  # an escaped asterisk ("\*4141") is kept out of the bold and italic markup, then put back


def words(text: str) -> str:
    """Words only, lower case: quotation marks, punctuation and dashes are ignored when a phrase is matched."""
    return " " + re.sub(r"[^a-z0-9]+", " ", fold(text).replace("'", "").lower()).strip() + " "


def phrase_in(phrase: str, text_words: str) -> bool:
    return words(phrase) != "  " and words(phrase) in text_words


def pieces(phrase: str) -> list:
    return [p for p in re.split(r"\.\.\.|…", phrase) if words(p).strip()]


def chapter_label(bible: dict, book: str, first: str, last: str | None) -> str:
    """A whole chapter (or run of chapters) as a verse range, read to the last verse the Berean has."""
    name = "Psalm" if book == "Psalms" else book
    end = int(last or first)
    verses = [int(k.split(":")[1]) for k in bible[BOOKS[name]] if k.split(":")[0] == str(end)]
    if not verses:
        raise BuildError(f"chapter does not exist in the Berean: {name} {end}")
    return f"{name} {first}:1–{end}:{max(verses)}" if last else f"{name} {first}:1–{max(verses)}"


class Held:
    """The outside sources held on this PC, read once each and folded to words."""

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
        self.bible = bible
        self.held = held
        self.passages: dict = {}
        self.checks: list = []
        self.used: dict = {"outside": set(), "pinned": set(), "wording": set(), "own": set()}

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
        """Every reference in plain text as (start, end, label): verses, short continuations ("42:5, 42:11") and
        whole chapters ("Psalm 88"). A bare "chapter:verse" with no book fails the build."""
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
        for match in CHAPTER.finditer(text):
            if not taken(match.start()):
                found.append((match.start(), match.end(), chapter_label(self.bible, *match.groups())))
        for match in SHORT.finditer(text):
            if not taken(match.start()) and not text[:match.start()].endswith(L.NOT_SCRIPTURE or ("\x01",)):
                raise BuildError(f"part {section}: short reference {match.group(0)!r} has no book")
        return sorted(found)

    def runs(self, text: str, section: str) -> tuple:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t}, {chk}. Returns (runs, cited passage keys)."""
        text = text.replace("\\*", STAR)
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
        return [run.replace(STAR, "*") if isinstance(run, str) else run for run in out if run != ""]

    def wording(self, section: str, phrase: str, where: str) -> dict:
        """A quotation the study gives in words that are not the Berean's: prove both halves of that claim."""
        label, bsb = L.WORDING[(section, phrase)]
        key = self.passage(label)
        if phrase_in(phrase, self.text_of(key)):
            raise BuildError(f"{where}: {phrase!r} is now the Berean's wording at {label}; remove it from WORDING")
        if not phrase_in(bsb, self.text_of(key)):
            raise BuildError(f"{where}: WORDING says the Berean reads {bsb!r} at {label}, and it does not")
        self.used["wording"].add((section, phrase))
        return {"said": phrase, "bsb": bsb, "r": key}

    def check_quotes(self, raw: str, section: str, cited: list, nearby: list, where: str) -> list:
        """A quote with its own reference beside it must be in that reference. Otherwise it may be in a verse its
        paragraph cites, its part's main readings or the passage printed above it; under three words, it must be
        pinned to its verse. Outside quotations are named, and checked if their source is held. Returns the
        quotations whose wording is not the Berean's, so the page can mark them."""
        if raw.count('"') % 2:
            raise BuildError(f"{where}: an odd number of quotation marks, so a quotation cannot be told from its context")
        flagged = []
        for match in QUOTE.finditer(raw):
            phrase = match.group(1)
            if (section, phrase) in L.OWN_TERMS:
                self.used["own"].add((section, phrase))
                continue
            if (section, phrase) in L.WORDING:
                flagged.append(self.wording(section, phrase, where))
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
        return flagged

    def block(self, quote_lines: list, ref_line: str, where: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line.strip():
            raise BuildError(f"{where}: block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        bible = fold(" ".join(t for _, t in self.passages[key]["verses"])).replace('"', "")
        page = fold(quoted).replace('"', "")
        if page == bible:
            return {"k": "quote", "r": key, "label": label}
        # Part of a verse: an unbroken run of at least six of the verse's own words, labelled as part on the page.
        if page.rstrip(".,;:") in bible and len(page.split()) >= 6:
            return {"k": "quote", "r": key, "label": label, "part": True, "t": quoted}
        raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")


def mark_wording(runs: list, flagged: list) -> list:
    """Put a marker run straight after each quotation whose wording is not the Berean's."""
    for item in flagged:
        target = typographic(f'"{item["said"]}"')
        for i, run in enumerate(runs):
            if isinstance(run, str) and target in run:
                at = run.index(target) + len(target)
                runs[i:i + 1] = [run[:at], {"w": item}, run[at:]]
                break
        else:
            raise BuildError(f"could not place the wording mark after {item['said']!r}")
    return [run for run in runs if run != ""]


def paragraph(builder: Builder, raw: str, section: str, where: str, nearby: list) -> list:
    runs, cited = builder.runs(typographic(raw), section)
    return mark_wording(runs, builder.check_quotes(raw, section, cited, nearby, where))


def readings(builder: Builder, body: str, where: str) -> list:
    """Main readings: references or whole chapters only."""
    out = []
    for item in body.rstrip(".").split("; "):
        if REF_RE.fullmatch(item):
            label = item
        elif m := CHAPTER.fullmatch(item):
            label = chapter_label(builder.bible, *m.groups())
        else:
            raise BuildError(f"{where}: main readings hold words that are not a reference: {item!r}")
        out.append({"r": builder.passage(label), "t": item})
    return out


def parse(builder: Builder, text: str) -> dict:
    """Place every non-blank line of content.md, or refuse the build."""
    lines = text.splitlines()
    study: dict = {"intro": {"quotes": []}, "help": [], "parts": [], "questions": [], "close": {}}
    section, kind, holder, target, near, last_quote = "intro", "intro", None, study["intro"], [], None
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
            if holder is None and kind == "intro":
                target["quotes"].append(item)
            elif holder is None:
                raise BuildError(f"{where}: a block quotation outside any sub-heading the page can place")
            else:
                holder.append(item)
            last_quote = item["r"]
        elif line == HELP_HEAD:
            section, kind, holder = "help", "help", study["help"]
        elif m := PART_HEAD.fullmatch(line):
            section, kind, holder, near, last_quote = m.group(1), "part", None, [], None
            target = {"n": section, "title": m.group(2), "subs": []}
            study["parts"].append(target)
        elif line == QUESTIONS_HEAD:
            section, kind, target, holder, near, last_quote = "questions", "questions", None, None, [], None
        elif line == CLOSE_HEAD:
            section, kind, target, holder, near, last_quote = "close", "close", study["close"], None, [], None
        elif line.startswith("### ") and kind == "questions":
            item = {"q": line[4:], "blocks": []}
            study["questions"].append(item)
            holder, last_quote = item["blocks"], None
        elif line.startswith("### ") and kind == "part":
            sub = {"title": line[4:], "blocks": []}
            target["subs"].append(sub)
            holder = sub["blocks"]
        elif (m := re.fullmatch(r"\*\*Main readings:\*\* (.+)", line)) and kind == "part":
            target["readings"] = readings(builder, m.group(1), where)
            near = [r["r"] for r in target["readings"]]
            # A quotation in the part's heading must be in its readings, or named in WORDING.
            target["titleNotes"] = builder.check_quotes(target["title"], section, [], near, f"{where} (part heading)")
        elif (m := re.fullmatch(r"\*\*(Consider|Reflect):\*\* (.+)", line)) and kind == "part":
            target[m.group(1).lower()] = paragraph(builder, m.group(2), section, where, nearby)
        elif (m := re.fullmatch(r"([A-Z][a-z]+): (.+)", line)) and m.group(1) in FIELDS.get(kind, ()):
            field, body = m.groups()
            if field == "Lead" and kind == "help":
                section, kind, target = "intro", "intro", study["intro"]
            if kind != "part" or field == "Limit":
                holder = None
            if field == "Concepts":
                target["concepts"] = body.split(" · ")
            elif field == "Motto":
                target["motto"] = body.split(" / ")
            elif field == "Passage":
                target["passage"] = builder.passage(body)
            else:
                target[field.lower()] = paragraph(builder, body, section, where, nearby)
            if field == "Close":
                holder = target["closeBlocks"] = []
            elif field == "Limit":  # notes after a part's limit stay at the part's end, before Consider
                holder = target["after"] = []
        elif (m := re.fullmatch(r"- \*\*([^*]+?)[.:]\*\* (.+)", line)) and holder is not None:
            if not holder or holder[-1]["k"] != "list":
                holder.append({"k": "list", "items": []})
            holder[-1]["items"].append({"label": m.group(1), "runs": paragraph(builder, m.group(2), section, where, nearby)})
        elif (mark := next((k for k in MARKS if line.startswith(k)), None)) and holder is not None:
            holder.append({"k": MARKS[mark], "runs": paragraph(builder, line[len(mark):], section, where, nearby)})
        elif (m := re.match(r"\[source:([a-z-]+)\] (.+)", line)) and holder is not None:
            if m.group(1) not in L.NOTE_SOURCES:
                raise BuildError(f"{where}: source note {m.group(1)!r} is not named in NOTE_SOURCES")
            holder.append({"k": "source", "src": L.NOTE_SOURCES[m.group(1)], "runs": paragraph(builder, m.group(2), section, where, nearby)})
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
    """The page places the help, the opening, the parts and the close in fixed places; content.md must keep that shape."""
    intro, close = study["intro"], study["close"]
    for key in ("concepts", "motto", "lead", "words", "selection"):
        if key not in intro:
            raise BuildError(f"the opening has no {key}")
    if len(intro["quotes"]) != 1 or len(intro["motto"]) != 2:
        raise BuildError("the opening must print one verse under the lead and a motto of two lines")
    if not any(b["k"] == "list" for b in study["help"]) or not any(b["k"] == "care" for b in study["help"]):
        raise BuildError("the help section must keep its care note and its list of lines, before the lead")
    for key in ("way", "close", "closeBlocks", "invite", "help", "question", "again", "passage"):
        if key not in close:
            raise BuildError(f"the close has no {key}")
    if [p["n"] for p in study["parts"]] != ["01", "02", "03", "04", "05", "06"]:
        raise BuildError(f"the page draws parts 01–06; content.md has {[p['n'] for p in study['parts']]}")
    for part in study["parts"]:
        missing = [k for k in ("readings", "hook", "line", "consider", "reflect") if k not in part]
        if missing or not part["subs"]:
            raise BuildError(f"part {part['n']} needs main readings, hook, line, sub-heads, Consider and Reflect (missing {missing})")
    if len(study["questions"]) != 4:
        raise BuildError(f"the page lays out four questions readers bring, found {len(study['questions'])}")


def build(text: str, bible: dict, held: Held) -> str:
    builder = Builder(bible, held)
    study = parse(builder, text)
    drawn = check_drawn(builder, study, text, words, phrase_in)
    for kind, table, name in (("outside", L.OUTSIDE_QUOTES, "OUTSIDE_QUOTES"), ("pinned", L.PINNED_QUOTES, "PINNED_QUOTES"),
                              ("wording", L.WORDING, "WORDING"), ("own", L.OWN_TERMS, "OWN_TERMS")):
        if unused := set(table) - builder.used[kind]:
            raise BuildError(f"{name} has entries the text no longer uses: {sorted(unused)}")
    for title, url in L.STUDY_NAMES.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"study {title!r} links to {url}, which has no index.html on this PC")
        if f"*{title}*" not in text:
            raise BuildError(f"STUDY_NAMES lists {title!r}, which content.md no longer names")
    quoted = {b["r"] for p in study["parts"] for s in p["subs"] for b in s["blocks"] if b["k"] == "quote"}
    quoted |= {b["r"] for b in study["intro"]["quotes"] + study["close"]["closeBlocks"] if b["k"] == "quote"}
    quoted |= {study["close"]["passage"]}
    shown = len({(builder.passages[k]["label"].rsplit(" ", 1)[0], cv) for k in quoted for cv, _ in builder.passages[k]["verses"]})
    numbers = {"parts": len(study["parts"]), "walked": sum(len(p["readings"]) for p in study["parts"]), "versesShown": shown,
               "references": len(builder.passages), "rows": len(drawn["rows"]), "elders": drawn["elders"]["n"],
               "questions": len(study["questions"]), "helpLines": sum(len(b["items"]) for b in study["help"] if b["k"] == "list"),
               "outside": len(L.OUTSIDE_QUOTES), "outsideHeld": sum(1 for _, h in L.OUTSIDE_QUOTES.values() if h),
               "openChecks": len(builder.checks), "wording": len(L.WORDING)}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "drawn.py", HERE / "scripture_text.py"]
    # Hashed with line endings made the same, so a Windows or Unix checkout does not make data.js look stale.
    prints = {p.name: hashlib.sha256(p.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:16] for p in inputs}
    outside = [{"t": phrase, "from": name, "checked": bool(h)} for (_, phrase), (name, h) in L.OUTSIDE_QUOTES.items()]
    data = {"study": study, "passages": builder.passages, **drawn, "numbers": numbers, "title": L.TITLE,
            "openChecks": builder.checks, "outside": outside, "sources": L.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.FAD = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def main() -> int:
    try:
        text = CONTENT.read_text(encoding="utf-8")
        bible = load_bible()
        if "--selftest" in sys.argv:
            from selftest import selftest
            return selftest(sys.modules[__name__], text, bible)
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
