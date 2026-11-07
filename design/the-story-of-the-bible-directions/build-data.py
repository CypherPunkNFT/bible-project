#!/usr/bin/env python3
"""Build data.js for The story of the Bible mock-up from the study's content.md, checking it against the Berean.

Run from Website/:  python design/the-story-of-the-bible-directions/build-data.py
  --check     run every check and fail if data.js is not exactly what the inputs build now; writes nothing
  --selftest  feed wrong inputs in memory and fail unless each is refused for its own reason (build_selftest.py)
Exit 1 with a message, and data.js unchanged, if any check fails. Writes only data.js, beside this file.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # six design jobs share this folder tree; leave no caches behind
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists  # noqa: E402
from scripture_text import BOOKS, CANON, REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/explore-the-bible/the-story-of-the-bible/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
NOTE = re.compile(r"\s*\[(check|proposed): ([^\]]+)\]")
SAFE_LINK = re.compile(r"/(?![/\\])[A-Za-z0-9._~/?=&#%-]*")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")
QUOTE = re.compile(r'"([^"]+)"(?:\s*\(([^)]*)\))?')
MARKER = re.compile(r"\[(read|open|other|care)\] (.*)")
MORE = re.compile(r"Read more in \*([^*]+)\*\.")
BOOK_NAMES = "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)).replace("Psalm", "Psalms?")
CHAPTER_MENTION = re.compile(rf"\b({BOOK_NAMES}) (\d+)(?:–(\d+))?(?![\d:])")
OUTLINE = re.compile(rf"((?:{BOOK_NAMES})(?: and (?:{BOOK_NAMES}))*)(?: (\d+)–(\d+))? in outline")
FIELDS = ("Concepts", "Motto", "Lead", "Frame", "Selection", "Hook", "Line", "Way", "Close", "Invite", "Question", "Again", "Passage")
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


def code_of(name: str) -> str:
    return BOOKS["Psalm" if name == "Psalms" else name]


class Builder:
    def __init__(self, bible: dict, lists) -> None:
        self.bible, self.lists = bible, lists
        self.passages: dict = {}
        self.checks: list = []  # notes still to be checked, in page order

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str) -> list:
        """Every reference in plain text, with its span, including short continuations such as "13:19–22, 23"."""
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
        return found

    def runs(self, text: str, cited: list, where: str) -> list:
        """Notes still to check come out first, so their words are never read as references or quotations."""
        out, last = [], 0
        for match in NOTE.finditer(text):
            out += self.inline_runs(text[last:match.start()], cited, where)
            self.checks.append({"n": len(self.checks) + 1, "t": typographic(match.group(2)), "where": where})
            out.append({"chk": len(self.checks)})
            last = match.end()
        rest = text[last:]
        if "[check" in rest or "[proposed" in rest:
            raise BuildError(f"{where}: a note to check is not closed or not in the form [check: …]")
        return out + self.inline_runs(rest, cited, where)

    def inline_runs(self, text: str, cited: list, where: str) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SAFE_LINK.fullmatch(url) or ".." in url:
                    raise BuildError(f"{where}: only plain links on this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            elif italic in self.lists.STUDY_LINKS:
                out.append({"s": self.lists.STUDY_LINKS[italic], "t": italic})
            elif italic in self.lists.BOOK_TITLES:
                out.append({"i": typographic(italic)})
            else:
                raise BuildError(f"{where}: italic {italic!r} is neither a named study in STUDY_LINKS nor a book title in BOOK_TITLES")
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

    def check_quotes(self, raw: str, pool: list, where: str) -> None:
        """A quote with its own reference after it must be in that reference. Any other quote must be in a verse the
        paragraph cites, the part's main readings, or the passage printed just above it; or be on a named list."""
        lists = self.lists
        for match in QUOTE.finditer(NOTE.sub("", raw)):
            phrase, after = match.groups()
            if phrase in lists.OWN_TERMS:
                continue
            if phrase in lists.CONFESSION_QUOTES:
                self.check_confession(phrase, raw, where)
                continue
            if phrase in lists.LOOSE_QUOTES:
                self.check_loose(phrase, after or "", where)
                continue
            own = [self.passage(label) for _, _, label in self.refs_in(after or "")]
            if not own and phrase in lists.SCRIPTURE_ELSEWHERE:
                own = [self.passage(lists.SCRIPTURE_ELSEWHERE[phrase])]
            keys = own or pool
            folded = fold(phrase).replace("'", "")
            texts = [plain_text(self.bible, self.passages[k]["label"]).replace("'", "") for k in keys]
            if not any(has_words(variant, t) for t in texts for variant in (folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:])):
                labels = ", ".join(self.passages[k]["label"] for k in keys) or "none"
                raise BuildError(f"{where}: quoted words {phrase!r} are not in {labels}")

    def check_loose(self, phrase: str, after: str, where: str) -> None:
        """A quotation the study gives with a word left out. Its words must still be in its own reference, in order;
        the README lists each one for the editor to restore."""
        cited = [label for _, _, label in self.refs_in(after)]
        if cited != [self.lists.LOOSE_QUOTES[phrase][0]]:
            raise BuildError(f"{where}: the loose quotation {phrase!r} must be cited to {self.lists.LOOSE_QUOTES[phrase][0]}, found {cited}")
        text, at = plain_text(self.bible, cited[0]).lower(), 0
        for word in fold(phrase).lower().split():
            found = re.compile(r"(?<!\w)" + re.escape(word) + r"(?!\w)").search(text, at)
            if not found:
                raise BuildError(f"{where}: the words of {phrase!r} are not, in order, in {cited[0]}")
            at = found.end()

    def check_confession(self, phrase: str, raw: str, where: str) -> None:
        article = self.lists.CONFESSION_QUOTES[phrase]
        named = re.findall(r"\barticle ([IVX]+)\b", raw)
        if (named and article not in named) or (not named and "the confession" not in raw):
            raise BuildError(f"{where}: the confession phrase {phrase!r} belongs to article {article}, which this paragraph does not name")
        if not has_words(fold(phrase), confession(self.lists)[article]):
            raise BuildError(f"{where}: {phrase!r} is not word for word in article {article} of the held Baptist Faith and Message 2000")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        if fold(quoted).replace('"', "") != plain_text(self.bible, label):
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {plain_text(self.bible, label)}")
        return {"k": "quote", "r": key, "label": label}


_CONFESSION: dict = {}


def confession(lists) -> dict:
    """The articles of the Baptist Faith and Message 2000 as held on this PC, each cut at the next article's heading."""
    if _CONFESSION:
        return _CONFESSION
    path = WEBSITE / lists.CONFESSION_FILE
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise BuildError(f"could not read the held confession at {path}: {error}") from error
    strings, walk = [], [raw]
    while walk:
        item = walk.pop()
        if isinstance(item, dict):
            walk += item.values()
        elif isinstance(item, list):
            walk += item
        elif isinstance(item, str) and lists.CONFESSION_TITLE in item:
            strings.append(item)
    if len(set(strings)) != 1:  # the file holds the same text twice, under two keys of one question
        raise BuildError(f"expected one text holding {lists.CONFESSION_TITLE!r} in {path}, found {len(set(strings))} different")
    text = fold(re.sub(r"\s+", " ", strings[0].split(lists.CONFESSION_TITLE, 1)[1]))
    starts, at = [], 0
    for roman in ROMAN:
        match = re.compile(rf"(?<![A-Za-z]){roman}\. [A-Z]").search(text, at)
        if not match:
            raise BuildError(f"could not find article {roman} of the confession in {path}")
        starts.append(match.start())
        at = match.end()
    for i, roman in enumerate(ROMAN):
        _CONFESSION[roman] = text[starts[i]:starts[i + 1] if i + 1 < len(ROMAN) else len(text)]
    return _CONFESSION


def readings(builder: Builder, body: str, where: str) -> list:
    """Main readings: whole references open their verses; "Genesis 12–50 in outline" names chapters, checked to exist."""
    out = []
    for item in (piece.strip() for piece in body.split(";")):
        if REF_RE.fullmatch(item.replace("-", "–")):
            out.append({"r": builder.passage(item), "t": item})
            continue
        match = OUTLINE.fullmatch(item)
        if not match:
            raise BuildError(f"{where}: main readings: could not read {item!r}")
        books = [code_of(name) for name in match.group(1).split(" and ")]
        if match.group(2):
            have = {int(k.split(":")[0]) for k in builder.bible[books[0]]}
            if not {int(match.group(2)), int(match.group(3))} <= have:
                raise BuildError(f"{where}: main readings: {item!r} names a chapter the Berean does not have")
        out.append({"outline": item, "books": books})
    return out


def para(builder: Builder, raw: str, where: str, section: dict | None) -> list:
    cited: list = []
    runs = builder.runs(raw, cited, where)
    section = section or {}
    walked = [r["r"] for r in section.get("readings", []) if "r" in r]
    last = next((b for b in reversed(section.get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + walked + ([last["r"]] if last else []), where)
    return typographic_runs(runs)


def typographic_runs(runs: list) -> list:
    """Curl the quotation marks across the whole paragraph, so a quotation may span italics or a reference."""
    joined = "".join(r if isinstance(r, str) else "\0" for r in runs)
    curled = re.sub(r'"([^"]*)"', r"“\1”", joined)
    out, at = [], 0
    for run in runs:
        size = len(run) if isinstance(run, str) else 1
        out.append(curled[at:at + size] if isinstance(run, str) else run)
        at += size
    return [r for r in out if r != ""]


def head(study: dict, line: str, where: str) -> dict:
    text = line[3:]
    number, _, title = text.partition(" ")
    if not re.fullmatch(r"\d\d", number):
        if "close" in study or not study["parts"]:
            raise BuildError(f"{where}: an unnumbered heading may only close the study, after the parts: {line!r}")
        study["close"] = {"title": typographic(text), "more": []}
        return study["close"]
    if "close" in study:
        raise BuildError(f"{where}: a numbered part after the close: {line!r}")
    name, _, turn = title.partition(": ")
    part = {"n": number, "title": typographic(title), "name": typographic(name), "turn": typographic(turn), "blocks": [], "more": []}
    study["parts"].append(part)
    return part


def field(builder: Builder, study: dict, current: dict | None, name: str, body: str, where: str) -> None:
    target = current if (current is not None and (name in ("Hook", "Line") or "close" in study)) else study
    if name in ("Hook", "Line") and current is None:
        raise BuildError(f"{where}: {name} line outside a part")
    if name in target:
        raise BuildError(f"{where}: a second {name} line")
    if name == "Concepts":
        target["concepts"] = body.split(" · ")
    elif name == "Motto":
        target["motto"] = body.split(" / ")
    elif name == "Passage":
        target["passage"] = builder.passage(body)
    else:
        target[name.lower()] = para(builder, body, where, current)


def parse(builder: Builder, text: str) -> dict:
    lines = text.replace("\r\n", "\n").split("\n")
    study: dict = {"parts": []}
    current, used, i = None, 0, 0
    lists = builder.lists
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        if line.startswith("# "):
            study["title"], _, study["subtitle"] = (typographic(t) for t in line[2:].partition(": "))
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip(); i += 1; used += 1
            (current["blocks"] if current else study.setdefault("opening", [])).append(builder.block(quote, ref_line))
        elif line.startswith("## "):
            current = head(study, line, where)
        elif (m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line)) and current is not None:
            if m.group(1) == "Main readings":
                current["readings"] = readings(builder, m.group(2), where)
            else:
                current[m.group(1).lower()] = para(builder, m.group(2), where, current)
        elif (m := MORE.fullmatch(line)) and current is not None:
            if m.group(1) not in lists.STUDY_LINKS:
                raise BuildError(f"{where}: 'Read more in' names {m.group(1)!r}, which is not in STUDY_LINKS")
            current["more"].append({"s": lists.STUDY_LINKS[m.group(1)], "t": m.group(1)})
        elif line.startswith("[") and current is not None:
            m = MARKER.fullmatch(line)
            if not m:
                raise BuildError(f"{where}: unknown note marker: {line[:30]!r}")
            kind = m.group(1)
            must = lists.NOTE_MUST_SAY.get(kind)
            if must and must not in m.group(2):
                raise BuildError(f"{where}: a [{kind}] note is labelled {lists.NOTE_LABELS[kind]!r} but does not say {must!r}")
            current["blocks"].append({"k": "note", "kind": kind, "label": lists.NOTE_LABELS[kind], "runs": para(builder, m.group(2), where, current)})
        elif (m := re.match(r"([A-Z][a-z]+): (.*)", line)) and m.group(1) in FIELDS:
            field(builder, study, current, m.group(1), m.group(2), where)
        elif current is not None:
            current["blocks"].append({"k": "p", "runs": para(builder, line, where, current)})
        else:
            raise BuildError(f"{where}: a line outside any part that the page does not know how to place: {line[:60]!r}")
    if used != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    for key in ("title", "subtitle", "concepts", "motto", "lead", "opening", "frame", "selection", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    for key in ("way", "close", "invite", "question", "again", "passage"):
        if key not in study["close"]:
            raise BuildError(f"the closing section has no {key.title()} line")
    for part in study["parts"]:
        for key in ("readings", "hook", "line", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
    return study


def words(runs: list) -> str:
    return "".join(r if isinstance(r, str) else r.get("t", r.get("i", r.get("b", ""))) for r in runs)


def pointed_chapters(builder: Builder, content: str) -> set:
    """Every (book, chapter) the study points to: a chapter of any cited reference, and every chapter named or ranged
    in the text ("Genesis 10–11", "Acts 10")."""
    found = {(key.split(".")[0], int(cv.split(":")[0])) for key, item in builder.passages.items() for cv, _ in item["verses"]}
    for match in CHAPTER_MENTION.finditer(content):
        first, last = int(match.group(2)), int(match.group(3) or match.group(2))
        found |= {(code_of(match.group(1)), chapter) for chapter in range(first, last + 1)}
    return found


def in_study(study_text: str, phrase: str, where: str) -> None:
    if fold(phrase).replace('"', "") not in study_text:
        raise BuildError(f"{where}: the study's words {phrase!r} are not in content.md")


def check_threads(builder: Builder, study: dict, content: str) -> list:
    lists, bible = builder.lists, builder.bible
    parts = [p["n"] for p in study["parts"]]
    chapters = pointed_chapters(builder, content)
    text = re.sub(r"\s+", " ", fold(content).replace('"', ""))
    threads = []
    for thread in lists.THREADS:
        marks, seen = [], []
        for mark in thread["marks"]:
            where = f"thread {thread['id']}, mark at {mark['at']}"
            if mark["at"] not in parts or mark["state"] not in lists.STATES:
                raise BuildError(f"{where}: unknown movement or state {mark['state']!r}")
            if seen and parts.index(mark["at"]) <= parts.index(seen[-1]):
                raise BuildError(f"{where}: marks must run forward through the story, one to a movement")
            seen.append(mark["at"])
            if not has_words(fold(mark["phrase"]).replace('"', ""), plain_text(bible, mark["ref"])):
                raise BuildError(f"{where}: {mark['phrase']!r} is not in {mark['ref']}")
            book, chapter = REF_RE.fullmatch(mark["ref"]).group(1, 2)
            if (BOOKS[book], int(chapter)) not in chapters:
                raise BuildError(f"{where}: the study never points to {book} {chapter}, so the map may not mark it")
            in_study(text, mark["study"], where)
            marks.append({**mark, "r": builder.passage(mark["ref"]), "stateName": lists.STATES[mark["state"]]})
        for at, phrase in thread.get("waits", {}).items():
            if at in seen or at not in parts:
                raise BuildError(f"thread {thread['id']}: a waiting note at {at} must stand in a movement with no mark")
            in_study(text, phrase, f"thread {thread['id']}, waiting at {at}")
        if thread.get("ends") and thread["ends"] != seen[-1]:
            raise BuildError(f"thread {thread['id']}: it ends at {thread['ends']}, but its last mark is at {seen[-1]}")
        threads.append({**thread, "marks": marks})
    return threads


def check_lists(builder: Builder, study: dict, content: str) -> dict:
    lists = builder.lists
    parts = {p["n"]: p for p in study["parts"]}
    if sorted(parts) != sorted(lists.MOVEMENT_SECTION) or len(parts) != 8:
        raise BuildError(f"the study must have the eight movements 01–08 the map is drawn for; it has {sorted(parts)}")
    if study["concepts"] != lists.STATION_NAMES:
        raise BuildError(f"the concepts line {study['concepts']} is not the station names {lists.STATION_NAMES}")
    for n, section in lists.MOVEMENT_SECTION.items():
        _, first, last = lists.SECTIONS[section]
        span = CANON[CANON.index(first):CANON.index(last) + 1]
        books = [r["r"].split(".")[0] for r in parts[n]["readings"] if "r" in r] + [b for r in parts[n]["readings"] for b in r.get("books", [])]
        if not any(book in span for book in books):
            raise BuildError(f"part {n} is coloured as {section}, but none of its main readings is in those books")
    lead, way, selection = words(study["lead"]), words(study["close"]["way"]), words(study["selection"])
    if "sixty-six books" not in lead or len(CANON) != 66:
        raise BuildError("the lead's \"sixty-six books\" does not match the canon the page reads")
    if "eight movements" not in lead or "eight movements" not in way:
        raise BuildError("the lead and the Way paragraph must both say \"eight movements\", as the page draws eight")
    for name, _ in lists.FOUR_PART:
        if name not in selection:
            raise BuildError(f"the selection paragraph no longer names {name!r}, which the two-maps figure draws")
    for place, asks in lists.QUESTIONS.items():
        held = words(study["frame"] if place == "frame" else study["close"]["way"])
        for ask in asks:
            if ask not in held:
                raise BuildError(f"the {place} paragraph no longer asks {ask!r}")
    for name, url in lists.STUDY_LINKS.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"study link for {name!r} points to {url}, which has no page on this PC")
    return {"threads": check_threads(builder, study, content)}


def count_figures(builder: Builder, study: dict, data: dict) -> dict:
    shown = set()
    keys = [b["r"] for p in study["parts"] for b in p["blocks"] if b["k"] == "quote"]
    for key in keys + [b["r"] for b in study["opening"]] + [study["close"]["passage"]]:
        shown |= {f"{key.split('.')[0]} {cv}" for cv, _ in builder.passages[key]["verses"]}
    books = {key.split(".")[0] for key in builder.passages}
    return {"movements": len(study["parts"]), "books": len(books), "canon": len(CANON), "threads": len(data["threads"]),
            "marks": sum(len(t["marks"]) for t in data["threads"]), "versesShown": len(shown),
            "references": len(builder.passages), "checks": len(builder.checks)}


def build(bible: dict, content: str, lists) -> str:
    builder = Builder(bible, lists)
    study = parse(builder, content)
    data = check_lists(builder, study, content)
    numbers = count_figures(builder, study, data)
    inputs = {"content.md": content, "study_lists.py": (HERE / "study_lists.py").read_text(encoding="utf-8"),
              "build-data.py": (HERE / "build-data.py").read_text(encoding="utf-8"),
              "scripture_text.py": (HERE / "scripture_text.py").read_text(encoding="utf-8")}
    prints = {name: hashlib.sha256(text.replace("\r\n", "\n").encode("utf-8")).hexdigest()[:16] for name, text in inputs.items()}
    sections = {key: name for key, (name, _, _) in lists.SECTIONS.items()}
    out = {"study": study, "passages": builder.passages, **data, "states": lists.STATES, "stations": lists.STATION_NAMES,
           "movementSection": lists.MOVEMENT_SECTION, "sections": sections, "fourPart": lists.FOUR_PART,
           "questions": lists.QUESTIONS, "numbers": numbers, "checks": builder.checks, "sources": lists.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.SB = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n"


def stale_reason(old: str, new: str) -> str:
    """Name what changed, so a link that appeared because a sister job finished its page reads as that, not a fault."""
    def links(text: str) -> set:
        return set(re.findall(r'"s": "(/mockups/[^"]+)"', text))
    gained, lost = links(new) - links(old), links(old) - links(new)
    if gained or lost:
        return f"study links changed (now linked: {sorted(gained) or 'none'}; no longer: {sorted(lost) or 'none'}); rebuild needed"
    return "data.js is not what the inputs build now; run without --check"


def main() -> int:
    try:
        bible = load_bible()
        content = CONTENT.read_text(encoding="utf-8")
        if "--selftest" in sys.argv:
            from build_selftest import selftest
            return selftest(bible, content, build, OUT)
        output = build(bible, content, study_lists)
    except (BuildError, OSError, KeyError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        old = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if old != output:
            print(f"build-data: stale: {stale_reason(old, output)}", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    temp = OUT.with_suffix(".js.tmp")
    temp.write_text(output, encoding="utf-8", newline="\n")
    os.replace(temp, OUT)
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output.encode('utf-8')):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
