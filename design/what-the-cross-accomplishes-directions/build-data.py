#!/usr/bin/env python3
"""Build data.js for The cross, the empty tomb and the throne mock-up from the study's content.md, checked against the
site's Berean text.

Run from Website/: python design/what-the-cross-accomplishes-directions/build-data.py   (add --check to verify only)
Exit 1 with a one-line message, and data.js unchanged, if any check fails. Writes only data.js in this folder.
"""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from scripture_text import REF_RE, BOOKS, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402
import study_lists as lists  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/what-the-cross-accomplishes/content.md"
OUT = HERE / "data.js"
MODEL_READER = WEBSITE / "design/the-good-news-directions/scripture_text.py"
# A [check: …] note, with or without a colon, comes out before links and references are read, so its text stays plain.
CHECK = re.compile(r"\s?\[check[^\]]*\]")
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|\x00(\d+)\x00")
# A short continuation such as "15:6, 9" or "41:8; 49:3", but never one that runs into a new book name ("; 1 Peter 2").
BOOK_AHEAD = "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True))
CONTINUE = re.compile(r"(; |, | with | and )(?!(?:" + BOOK_AHEAD + r") )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])")
SITE_LINK = re.compile(r"^/(?![/\\])[^:\s]*$")
FIELDS = ("Concepts", "Motto", "Lead", "Frame", "Selection", "Way", "Invite", "Question", "Again", "Passage")


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

    def runs(self, text: str, cited: list, notes: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {c} (a note still to check)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic, note = match.groups()
            if note is not None:
                out.append({"c": notes[int(note)]})
            elif url:
                if not SITE_LINK.match(url):
                    raise BuildError(f"only links to this site are allowed in the study text, found {url!r}")
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
            if start > last:
                out.append(typographic(text[last:start]))
            key = self.passage(label)
            cited.append(key)
            out.append({"r": key, "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        return [run for run in out if run != ""]

    def check_quotes(self, raw: str, allowed: list, where: str) -> None:
        """Each quoted phrase is in a verse the paragraph may quote, or on the named outside or own-term lists.
        A quote with its own reference right after it must be in that reference, not just somewhere nearby."""
        for match in re.finditer(r'"([^"]+)"', raw):
            phrase = match.group(1)
            # Its own reference: the first bracket after it in the same sentence, before any other quotation.
            ahead = re.match(r'[^"().]*\(([^)]*)\)', raw[match.end():])
            after = ahead.group(1) if ahead else ""
            if phrase in lists.OUTSIDE_QUOTES or phrase in lists.OWN_TERMS:
                continue
            own = [ref_id(label.replace("-", "–")) for _, _, label in self.refs_in(after or "")]
            keys = own or allowed
            # A space after a dash is spacing, not a word: the Berean prints "death— even", the study "death—even".
            texts = [re.sub(r"-\s+", "-", plain_text(self.bible, self.passages[k]["label"]).replace("'", "")) for k in keys]
            folded = re.sub(r"-\s+", "-", fold(phrase).replace('"', "").replace("*", "").replace("'", ""))
            variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:], folded.rstrip(".,!?")}
            if not any(has_words(v, t) for v in variants for t in texts):
                raise BuildError(f"{where}: quoted words {phrase!r} are not in "
                                 f"{', '.join(self.passages[k]['label'] for k in keys) or 'any cited verse'}")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"a block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        page, bible = fold(quoted).replace('"', ""), plain_text(self.bible, label)
        if page == bible:
            return {"k": "quote", "r": key, "label": label}
        # Part of a verse is allowed only as whole sentences (or a whole speech, opened by its quotation mark), word for
        # word, ending where the passage ends. The page shows the study's words, which this has just proved are Berean.
        speech = quoted.lstrip("> ").startswith('"')
        if bible.endswith(" " + page) and re.search(r"[.!?:;]$" if not speech else r"[.!?:;,]$", bible[: -len(page) - 1]):
            return {"k": "quote", "r": key, "label": label, "part": True, "text": typographic(quoted)}
        raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")


def para(builder: Builder, raw: str, where: str, section: dict | None = None, next_quote: str | None = None) -> list:
    """A paragraph may quote: the verses it cites, its part's readings and quoted passages, the passage printed just above
    it, and (when it introduces one) the passage printed just below it."""
    notes = [m.group(0).strip(" []").removeprefix("check").strip(" :").replace("*", "") or "before publishing" for m in CHECK.finditer(raw)]
    counter = iter(range(len(notes)))
    marked = CHECK.sub(lambda _m: f" \x00{next(counter)}\x00", raw)
    cited: list = []
    runs = builder.runs(typographic(marked), cited, notes)
    section = section or {}
    nearby = list(section.get("readings", [])) + list(section.get("quoted", []))
    last = next((b for b in reversed(section.get("blocks", [])) if b["k"] == "quote"), None)
    below = [builder.passage(next_quote)] if next_quote else []
    builder.check_quotes(CHECK.sub("", raw), cited + nearby + ([last["r"]] if last else []) + below, where)
    return runs


def readings(builder: Builder, body: str) -> tuple:
    """'Hebrews 9:15–28. **Quoted:** Romans 3:25–26.' or 'A; B.' or 'A with B.'"""
    main, _, quoted = body.partition(" **Quoted:** ")
    split = lambda text: [p.strip() for p in re.split(r"; | with ", text.strip().rstrip(".")) if p.strip()]
    return [builder.passage(r) for r in split(main)], [builder.passage(r) for r in split(quoted)]


def next_block_ref(lines: list, i: int) -> str | None:
    """The reference of the block quotation that directly follows line i (after blank lines), if there is one."""
    j = i
    while j < len(lines) and not lines[j].strip():
        j += 1
    if j < len(lines) and lines[j].startswith(">"):
        while j < len(lines) and (lines[j].startswith(">") or not lines[j].strip()):
            j += 1
        if j < len(lines):
            return lines[j].strip().removesuffix(" · BSB")
    return None


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    used = 0
    study: dict = {"parts": []}
    current = None
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        below = next_block_ref(lines, i)
        if line.startswith("# "):
            study["title"] = line[2:]
        elif "title" in study and "subtitle" not in study and re.fullmatch(r"\*[^*]+\*", line):
            study["subtitle"] = line.strip("*")
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: a block quotation has no reference line after it")
            ref_line = lines[i].strip(); i += 1; used += 1
            item = builder.block(quote, ref_line)
            (current["blocks"] if current else study.setdefault("opening", [])).append(item)
        elif line.startswith("## "):
            head = line[3:]
            if head.startswith("Close: "):
                current = None
                study["close"] = {"title": head[7:]}
            else:
                number, _, title = head.partition(" ")
                if not re.fullmatch(r"\d\d", number):
                    raise BuildError(f"{where}: a part heading must start with its two-digit number, found {head!r}")
                current = {"n": number, "title": title, "blocks": [], "quoted": []}
                study["parts"].append(current)
        elif current is None and "close" not in study and not re.match(r"([A-Z][a-z]+): ", line):
            raise BuildError(f"{where}: a line outside any part that the page does not know how to place: {line[:60]!r}")
        elif line.startswith("### "):
            current["blocks"].append({"k": "h3", "t": line[4:]})
        elif current is not None and not current["blocks"] and "hook" not in current and re.fullmatch(r"\*[^*]+\*", line):
            current["hook"] = typographic(line.strip("*"))
        elif line.startswith("**Main readings:** "):
            current["readings"], current["quoted"] = readings(builder, line[19:])
        elif m := re.match(r"\*\*(Consider|Reflect):\*\* (.*)", line):
            current[m.group(1).lower()] = para(builder, m.group(2), where, current)
        elif m := re.match(r"\*\*(Where the [a-z]+ stops)\.\*\* (.*)", line):
            current["blocks"].append({"k": "stops", "label": m.group(1), "runs": para(builder, m.group(2), where, current, below)})
        elif m := re.match(r"\*\*(A question readers ask): ([^*]+\?)\*\* (.*)", line):
            current["blocks"].append({"k": "ask", "label": m.group(1), "q": m.group(2)[:1].upper() + m.group(2)[1:], "runs": para(builder, m.group(3), where, current)})
        elif m := re.match(r"\[open\] \*\*([^*]+\?)\*\* (.*)", line):
            current["blocks"].append({"k": "open", "q": m.group(1), "runs": para(builder, m.group(2), where, current)})
        elif line.startswith("[care] "):
            current["blocks"].append({"k": "care", "runs": para(builder, line[7:], where, current, below)})
        elif (m := re.match(r"([A-Z][a-z]+): (.*)", line)) and m.group(1) in FIELDS:
            field, body = m.groups()
            target = study["close"] if "close" in study else study
            if field == "Concepts":
                target["concepts"] = body.split(" · ")
            elif field == "Motto":
                target["motto"] = body.split(" / ")
            elif field == "Passage":
                target["passage"] = builder.passage(body)
            else:
                target[field.lower()] = para(builder, body, where, None, below)
        elif current is not None:
            current["blocks"].append({"k": "p", "runs": para(builder, line, where, current, below)})
        else:
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
    total = sum(1 for line in lines if line.strip())
    if used != total:
        raise BuildError(f"{total - used} lines of content.md were not placed on the page")
    for key in ("title", "subtitle", "concepts", "motto", "lead", "opening", "frame", "selection", "close"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    for part in study["parts"]:
        for key in ("hook", "readings", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
    if [p["n"] for p in study["parts"]] != [f"{n:02d}" for n in range(1, 10)]:
        raise BuildError("the study should have parts 01 to 09, in order")
    return study


def part_text(text: str, number: str) -> str:
    match = re.search(rf"^## {number} .*?(?=^## )", text, flags=re.S | re.M)
    if not match:
        raise BuildError(f"content.md has no part {number}")
    return match.group(0)


def must_have(builder: Builder, label: str, phrase: str, what: str) -> str:
    key = builder.passage(label)
    if not has_words(fold(phrase), plain_text(builder.bible, label)):
        raise BuildError(f"{what}: {phrase!r} is not in {label}")
    return key


def check_lists(builder: Builder, text: str, study: dict) -> dict:
    """Every phrase the page draws beside the text is in its verse, or (for a limit) in the study's own words."""
    lead = fold("".join(r if isinstance(r, str) else r.get("t", r.get("i", r.get("b", ""))) for r in study["lead"])).lower()
    positions = [lead.find(p["home"].removeprefix("the ").removeprefix("a ")) for p in lists.PICTURES]
    if -1 in positions or positions != sorted(positions):
        raise BuildError(f"the six homes must appear in the Lead, in order: {[p['home'] for p in lists.PICTURES]}")
    pictures = []
    for picture in lists.PICTURES:
        key = must_have(builder, picture["ref"], picture["phrase"], f"picture {picture['n']}")
        if picture["stops"] not in part_text(text, picture["n"]):
            raise BuildError(f"picture {picture['n']}: its limit {picture['stops']!r} is not, word for word, in part {picture['n']} of content.md")
        pictures.append({**picture, "r": key})
    centre = {**lists.CENTRE, "r": must_have(builder, lists.CENTRE["ref"], lists.CENTRE["phrase"], "the centre")}

    four = lists.FOUR_LINES
    whole = plain_text(builder.bible, four["ref"])
    for line in four["lines"]:
        for phrase in filter(None, (line["event"], line["why"])):
            must_have(builder, four["ref"], phrase, "the four lines")
    if whole.count("according to the Scriptures") != sum(1 for line in four["lines"] if line["scripture"]):
        raise BuildError("the four lines mark 'according to the Scriptures' where 1 Corinthians 15:3–5 does not")
    after = four["after"]
    lines = {**four, "r": builder.passage(four["ref"]), "after": {**after, "r": must_have(builder, after["ref"], after["event"], "the throne line")}}

    witnesses = {"luke": [], "paul": [], "joins": lists.WITNESSES["joins"]}
    for side in ("luke", "paul"):
        for person in lists.WITNESSES[side]:
            key = must_have(builder, person["ref"], person["who"], f"witness {person['id']}")
            seen = {}
            if person.get("saw"):
                seen = {"sr": must_have(builder, person.get("saw_ref", person["ref"]), person["saw"], f"witness {person['id']}")}
            witnesses[side].append({**person, "r": key, **seen})
    ids = {p["id"] for side in ("luke", "paul") for p in lists.WITNESSES[side]}
    for a, b in lists.WITNESSES["joins"]:
        if a not in ids or b not in ids:
            raise BuildError(f"a witness join names someone not on the lists: {a} – {b}")

    echo = lists.ECHO
    for phrase in echo["shared"]:  # Isaiah opens a sentence with it ("Every knee"), so case is not compared
        for label in (echo["from"], echo["to"]):
            if not has_words(phrase.lower(), plain_text(builder.bible, label).lower()):
                raise BuildError(f"Isaiah's words in Philippians: {phrase!r} is not in {label}")
    echo = {**echo, "fr": builder.passage(echo["from"]), "tr": builder.passage(echo["to"])}

    for fact in lists.FACTS:
        for label, phrase in fact["in"]:
            must_have(builder, label, phrase, f"fact {fact['says']!r}")
        for label, phrase in fact["not_in"]:
            builder.passage(label)
            if phrase in plain_text(builder.bible, label).lower():
                raise BuildError(f"fact {fact['says']!r}: {phrase!r} should not be in {label}")
    romans = plain_text(builder.bible, lists.ROMANS_FIVE["ref"])
    found = [romans.find(word) for word in lists.ROMANS_FIVE["words"]]
    if -1 in found or found != sorted(found):
        raise BuildError(f"Romans 5:6–10 should hold {lists.ROMANS_FIVE['words']} in that order")

    for name, url in lists.STUDY_LINKS.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/").strip("/") / "index.html").is_file():
            raise BuildError(f"the study link for {name!r} points to a mock-up that is not on this PC: {url}")
    return {"pictures": pictures, "centre": centre, "lines": lines, "witnesses": witnesses, "echo": echo}


def build() -> str:
    if MODEL_READER.is_file() and MODEL_READER.read_bytes() != (HERE / "scripture_text.py").read_bytes():
        raise BuildError("scripture_text.py is no longer a copy of the model's reader; compare them before building")
    bible = load_bible()
    builder = Builder(bible)
    text = CONTENT.read_text(encoding="utf-8")
    study = parse(builder, text)
    drawn = check_lists(builder, text, study)
    quoted = {b["r"] for part in study["parts"] for b in part["blocks"] if b["k"] == "quote"} | {b["r"] for b in study["opening"]}
    shown = sum(len(builder.passages[k]["verses"]) for k in quoted | {study["close"]["passage"]})
    numbers = {"pictures": len(drawn["pictures"]), "lines": len(drawn["lines"]["lines"]),
               "appearances": len(drawn["witnesses"]["paul"]), "versesShown": shown, "references": len(builder.passages),
               "checks": sum(1 for _ in re.finditer(r"\[check", text))}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    data = {"study": study, "passages": builder.passages, **drawn, "numbers": numbers, "sources": lists.SOURCES,
            "outside": lists.OUTSIDE_QUOTES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.WC = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


def main() -> int:
    try:
        output = build()
    except (BuildError, OSError, KeyError, ValueError) as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
            print("build-data: stale: data.js does not match content.md and the lists; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    temporary = HERE / "data.js.tmp"
    temporary.write_text(output, encoding="utf-8", newline="\n")
    os.replace(temporary, OUT)  # the live preview never serves a half-written file
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
