#!/usr/bin/env python3
"""Build data.js for the Baptism and the Lord's Supper mock-up from the study's content.md, checking it against the
site's Berean text and the outside sources held on this PC. (Adapted from the Life together and The good news builds.)

Run from Website/: python design/baptism-and-the-lords-supper-directions/build-data.py
  --check     rebuild in memory, run the refusal tests, and fail if data.js is stale or a file the page loads is missing
  --selftest  only the refusal tests: wrong inputs, tried in memory, each of which must be refused
Exit 1 with a message, and data.js unchanged, if any check fails. Nothing outside this folder is written.
"""
import sys

if sys.version_info < (3, 10):
    sys.exit("build-data: FAILED: Python 3.10 or newer is needed")

import hashlib  # noqa: E402
import json  # noqa: E402
import os  # noqa: E402
import re  # noqa: E402
import time  # noqa: E402
from pathlib import Path  # noqa: E402

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import study_lists  # noqa: E402
from drawn_checks import check_lists, check_outside, curl  # noqa: E402
from page_checks import check_crisis, check_page_files, negated, study_links  # noqa: E402
from scripture_text import BOOKS, BSB, CANON, REF_RE, BuildError, fold, load_bible, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/god-and-christian-faith/baptism-and-the-lords-supper/content.md"
LIFE = WEBSITE / "src/data/resources/life.json"
OUT = HERE / "data.js"
OWN_FILES = ("build-data.py", "drawn_checks.py", "scripture_text.py", "study_lists.py", "page_checks.py", "held.py", "selftest.py")
LIST_NAMES = ("NEGATED_ON_PURPOSE", "SIGNS", "PANEL", "DIRECTIONS", "ORDER", "TEXT_PATCHES", "CRISIS", "STUDY_LINKS", "OUTSIDE_QUOTES", "OLD_SPELLINGS", "OWN_TERMS", "SOURCES", "HELD_FACTS")
SCHEMA = 1
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
SITE_LINK = re.compile(r"^/(?![/\\])(?!.*\.\.)[A-Za-z0-9/_\-?=&#.]*$")
CHECK_NOTE = re.compile(r" ?\[check(?: before publishing)?(?:: [^\]\n]*?)?\]")
BOOK_NAMES = "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True))
BOOK_NAMED = re.compile(r"\b(?:" + BOOK_NAMES + r") \d")
CHAPTER_RE = re.compile(r"\b(" + BOOK_NAMES + r") (\d+)\b(?!:\d)")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(?:(\d+):)?(\d+))?(?![\d:])(?! [A-Z])")
FIELD = re.compile(r"([A-Z][A-Za-z]+):(?: (.*))?$")
FIELDS = ("Concepts", "Motto", "Lead", "Words", "Frame", "Selection", "Hook", "Limit", "PanelLead", "Panel", "PanelReads", "PanelCare",
          "Way", "Invite", "Question", "Again", "Passage")
PREFIXES = {"[care] ": "care", "[open] ": "open", "[read] ": "read", "[other] ": "other"}
# Verses the Berean leaves out, following the oldest manuscripts; a range may step over these and no others.
OMITTED = {"ACT 8:37"}


class Builder:
    def __init__(self, bible: dict, lists: dict) -> None:
        self.bible, self.lists = bible, lists
        self.passages: dict = {}
        self.checks: list = []
        self.outside_used: set = set()
        self.terms_used: set = set()
        self.links: dict = {}

    def passage(self, label: str) -> str:
        """A reference ("Acts 2:41") or a whole chapter ("Romans 6"), checked to exist with no gap."""
        label = label.replace("-", "–")
        chapter = CHAPTER_RE.fullmatch(label)
        if chapter:
            book, number = chapter.groups()
            code = BOOKS[book]
            found = sorted(int(k.split(":")[1]) for k in self.bible[code] if k.split(":")[0] == number)
            if not found:
                raise BuildError(f"reference does not resolve in the Berean: {label}")
            span, key = f"{label}:{found[0]}–{found[-1]}", f"{code}.{number}"
            verses = [(int(number), v, self.bible[code][f"{number}:{v}"]) for v in found]
        else:
            span, key = label, ref_id(label)
            verses, left_out = self.range_with_omissions(span)
            if left_out:
                self.passages[key] = {"label": label, "span": span, "verses": [[f"{c}:{v}", text] for c, v, text in verses], "leftOut": left_out}
                return key
        self.passages[key] = {"label": label, "span": span, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def range_with_omissions(self, span: str) -> tuple:
        """The verses of a range. A gap is allowed only at a verse the Berean leaves out on purpose (OMITTED), and is
        named so the sheet can say so; any other gap or missing verse is refused."""
        try:
            return verses_of(self.bible, span)[1], []
        except BuildError as error:
            if "gap in" not in str(error):
                raise
        book, c1, v1, c2, v2 = REF_RE.fullmatch(span).groups()
        code, chapter = BOOKS[book], int(c1)
        if c2 or not v2:
            raise BuildError(f"reference does not resolve in the Berean: {span}")
        verses, left_out = [], []
        for v in range(int(v1), int(v2) + 1):
            text = self.bible[code].get(f"{chapter}:{v}")
            if text is not None:
                verses.append((chapter, v, text))
            elif f"{code} {chapter}:{v}" in OMITTED:
                left_out.append(f"{chapter}:{v}")
            else:
                raise BuildError(f"gap in {span} at {chapter}:{v}, which is not a verse the Berean is known to leave out")
        return verses, left_out

    def verse_texts(self, key: str) -> list:
        return [fold(text).replace('"', "").replace("'", "") for _, text in self.passages[key]["verses"]]

    def refs_in(self, text: str) -> list:
        """Every reference in plain text with its span, including short continuations ("10:44, 47") and chapters."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter = match.group(1), match.group(4) or match.group(2)
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4) + ':' if more.group(4) else ''}{more.group(5)}" if more.group(5) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
                chapter = more.group(4) or chapter
                end = more.end()
        taken = [(s, e) for s, e, _ in found]
        for match in CHAPTER_RE.finditer(text):
            if not any(s < match.end() and match.start() < e for s, e in taken):
                found.append((match.start(), match.end(), match.group(0)))
        return sorted(found)

    def runs(self, text: str, cited: list) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t} (a site link), {r,t} (a reference), {s,t} (a named study)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.match(url):
                    raise BuildError(f"only links to this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": self.plain_runs(bold, cited)})
            elif (name := italic.replace("’", "'")) in self.lists["STUDY_LINKS"]:
                out.append({"s": self.links[name], "t": italic})
            else:
                out.append({"i": italic})
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

    def check_quotes(self, raw: str, cited: list, where: str) -> None:
        """Each quoted phrase is in a verse its own reference names, else one its paragraph cites, or on a named list.
        A listed phrase passes only where no Bible reference follows it, or where one follows as "(on Acts 16:15)",
        the place of a commentary note."""
        plain = raw.replace("’", "'")
        if "“" in plain or "”" in plain:
            raise BuildError(f"{where}: curly double quotes in the study text; write straight quotes so the build can check them")
        if plain.count('"') % 2:
            raise BuildError(f"{where}: an odd number of quotation marks, so a quotation cannot be told from the prose")
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', plain):
            phrase, after = match.groups()
            note_place = bool(after) and after.startswith("on ")
            own = [] if note_place else [label for _, _, label in self.refs_in(after or "")]
            if after and not own and not note_place and BOOK_NAMED.search(after):
                raise BuildError(f"{where}: the reference after {phrase!r} does not resolve: ({after})")
            if not own and phrase in self.lists["OUTSIDE_QUOTES"]:
                self.outside_used.add(phrase)
                continue
            if not own and phrase in self.lists["OWN_TERMS"]:
                self.terms_used.add(phrase)
                continue
            if note_place:
                raise BuildError(f"{where}: {phrase!r} is placed in a commentary note ({after}) but is not on the outside list")
            keys = [self.passage(label) for label in own] or cited
            reversed_ok = phrase in self.lists["NEGATED_ON_PURPOSE"]
            if reversed_ok:
                self.terms_used.add(phrase)
            if not any(self.quote_in(phrase, key, joined_ok=bool(own), reversed_ok=reversed_ok) for key in keys):
                labels = ", ".join(self.passages[k]["label"] for k in keys) or "none"
                raise BuildError(f"{where}: quoted words {phrase!r} are not in any verse this paragraph cites ({labels})")

    def quote_in(self, phrase: str, key: str, joined_ok: bool = False, reversed_ok: bool = False) -> bool:
        """True if the phrase is in the reference as whole words and not straight after a negation. A phrase split by an
        ellipsis must have every piece in one verse, in order, with no more than twelve words between pieces; only a
        quotation followed by its own reference may run its pieces across the verses of that reference."""
        pieces = [fold(p).replace('"', "").replace("*", "").replace("'", "").strip(" ,.") for p in re.split(r"\.\.\.|…", phrase)]
        pieces = [p for p in pieces if p]
        verses = self.verse_texts(key)
        texts = verses + ([" ".join(verses)] if joined_ok else []) if len(pieces) > 1 else [" ".join(verses)]
        gap = r"(?!\w)(?:\W+\w+){0,12}?\W+(?<!\w)"
        for first in {pieces[0], pieces[0][:1].lower() + pieces[0][1:], pieces[0][:1].upper() + pieces[0][1:]}:
            pattern = r"(?<!\w)" + gap.join(map(re.escape, [first] + pieces[1:])) + r"(?!\w)"
            for text in texts:
                for found in re.finditer(pattern, text):
                    if reversed_ok or not negated(text, found.start(), first):
                        return True
        return False

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        bible = fold(" ".join(v[1] for v in self.passages[key]["verses"]))
        # Double quotation marks are not compared (as in The good news build): a speech that runs on past the last verse
        # quoted has no closing mark in the Berean, and the study closes it. Every word and other mark must match.
        if fold(quoted).replace('"', "") != bible.replace('"', ""):
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label}

    def para(self, raw: str, where: str, section: dict | None = None, only: list | None = None) -> list:
        """A paragraph may quote the verses it cites, its section's main readings, or the passage printed just above it.
        With "only", it may quote nothing but those references (a panel row)."""
        cited: list = []
        clean = self.strip_checks(raw, where)
        runs = self.runs(curl(clean), cited)
        if only is not None:
            self.check_quotes(clean, only, where)
            return runs
        nearby = list((section or {}).get("readings", []))
        last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
        self.check_quotes(clean, cited + nearby + ([last["r"]] if last else []), where)
        return runs

    def strip_checks(self, raw: str, where: str) -> str:
        """Editorial "[check ...]" notes are kept off the page and listed in data.js, so the README can name them."""
        for note in CHECK_NOTE.findall(raw):
            self.checks.append({"where": where, "note": note.strip(" []")})
        clean = CHECK_NOTE.sub("", raw)
        if "[check" in clean:
            raise BuildError(f"{where}: a [check ...] note the build could not read: {clean[clean.index('[check'):][:60]!r}")
        return clean


def apply_patches(text: str, patches: list) -> str:
    """Corrections made in memory, never written to content.md. Each must match exactly once, so a fix made in
    content.md retires its patch (the build then fails until the patch is removed)."""
    for patch in patches:
        count = text.count(patch["old"])
        if count != 1:
            raise BuildError(f"text patch should match content.md exactly once, matched {count} times: {patch['old'][:50]!r}. "
                             "If content.md has been corrected, remove the patch from study_lists.py.")
        text = text.replace(patch["old"], patch["new"])
    return text


def panel_row(builder: Builder, part: dict, number: str, body: str, where: str) -> None:
    """One row of the part 03 panel: "Acts 2:41. what came first → the baptism", each quotation in the row's own verses."""
    m = re.match(r"(Acts \d+:\d+(?:–\d+)?)\. (.+?) → (.+)$", body)
    if not m:
        raise BuildError(f"{where}: a panel row must read '<Acts reference>. <what came first> → <the baptism>', found {body[:60]!r}")
    label, before, after = m.groups()
    key = builder.passage(label)
    rows = part.setdefault("panel", [])
    if int(number) != len(rows) + 1:
        raise BuildError(f"{where}: panel row {number} out of order (expected {len(rows) + 1})")
    rows.append({"n": int(number), "r": key, "label": label, "rawBefore": before, "rawAfter": after,
                 "before": builder.para(before, where, only=[key]), "after": builder.para(after.rstrip("."), where, only=[key])})


def place(builder: Builder, study: dict, current: dict | None, line: str, where: str) -> dict | None:
    """Put one line of content.md on the page. Returns the section later lines belong to."""
    if line.startswith("## "):
        head = line[3:]
        if re.match(r"\d\d ", head):
            part = {"n": head[:2], "title": head[3:], "blocks": []}
            study["parts"].append(part)
            return part
        if study.get("close") or not head.startswith("Close: "):
            raise BuildError(f"{where}: a heading the page does not know: {head!r}")
        study["close"] = {"title": head[7:], "readings": [study["opening"][0]["r"], study["closePassage"]]}
        return study["close"]
    if (m := FIELD.match(line)) and m.group(1) in FIELDS:
        return place_field(builder, study, current, m.group(1), m.group(2) or "", where)
    if current is None:
        raise BuildError(f"{where}: a line outside any section that the page does not know how to place: {line[:60]!r}")
    blocks = current.setdefault("blocks", [])
    if line.startswith("### "):
        blocks.append({"k": "h3", "t": curl(line[4:])})
    elif m := re.match(r"\*\*Main readings:\*\* (.*)", line):
        cited: list = []
        current["readingsText"] = builder.runs(curl(m.group(1)), cited)
        current["readings"] = cited
    elif m := re.match(r"\*\*(Consider|Reflect):\*\* (.*)", line):
        current[m.group(1).lower()] = builder.para(m.group(2), where, current)
    elif prefix := next((p for p in PREFIXES if line.startswith(p)), None):
        blocks.append({"k": PREFIXES[prefix], "runs": builder.para(line[len(prefix):], where, current)})
    elif (m := re.match(r"(\d+)\. (.*)", line)) and current.get("panelOpen"):
        panel_row(builder, current, m.group(1), m.group(2), where)
    elif m := re.match(r"- \*\*([^*]+)\*\* (.*)", line):
        blocks.append({"k": "word", "term": m.group(1), "runs": builder.para(m.group(2), where, current)})
    else:
        blocks.append({"k": "p", "runs": builder.para(line, where, current)})
    return current


def place_field(builder: Builder, study: dict, current: dict | None, field: str, body: str, where: str) -> dict | None:
    in_part = current is not None and "n" in current
    if field == "Concepts":
        study["concepts"] = body.split(" · ")
    elif field == "Motto":
        study["motto"] = body.split(" / ")
    elif field == "Lead":
        study["lead"] = builder.para(body, where)
    elif field == "Words":
        study["words"] = {"lead": builder.para(body, where), "blocks": []}
        return study["words"]
    elif field in ("Frame", "Selection"):
        if not study["opening"]:
            raise BuildError(f"{where}: {field} must follow the opening quotation")
        intro = study.setdefault("intro", {"readings": [study["opening"][0]["r"], study["closePassage"]], "blocks": []})
        intro[field.lower()] = builder.para(body, where, intro)
        return intro
    elif field in ("Hook", "Limit", "PanelLead", "Panel", "PanelReads", "PanelCare"):
        if not in_part:
            raise BuildError(f"{where}: {field} outside a numbered part")
        if field == "Limit":
            current["blocks"].append({"k": "limits", "runs": builder.para(body, where, current)})
        elif field == "Panel":
            current["panelOpen"] = True
            current["blocks"].append({"k": "panel"})
        else:
            current["panelOpen"] = False if field != "PanelLead" else current.get("panelOpen", False)
            current[field[0].lower() + field[1:]] = builder.para(body, where, current)
    else:
        close = study.get("close")
        if not close or current is not close:
            raise BuildError(f"{where}: {field} belongs in the closing section")
        close[field.lower()] = builder.passage(body) if field == "Passage" else builder.para(body, where, close)
    return current


def parse(builder: Builder, text: str) -> dict:
    lines = text.split("\n")
    passage_lines = [line for line in lines if line.startswith("Passage: ")]
    if len(passage_lines) != 1:
        raise BuildError(f"content.md should name one closing passage, found {len(passage_lines)}")
    study: dict = {"parts": [], "opening": [], "closePassage": builder.passage(passage_lines[0][9:].strip())}
    current, placed, i = None, 0, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        placed += 1
        where = f"content.md line {i}"
        if line.startswith("# "):
            study["title"], _, study["subtitle"] = line[2:].partition(": ")
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; placed += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip(); i += 1; placed += 1
            (current["blocks"] if current else study["opening"]).append(builder.block(quote, ref_line))
        else:
            current = place(builder, study, current, line, where)
    if placed != sum(1 for line in lines if line.strip()):
        raise BuildError("some lines of content.md were not placed on the page")
    for key in ("title", "concepts", "motto", "lead", "opening", "words", "intro", "close"):
        if not study.get(key):
            raise BuildError(f"content.md has no {key}")
    for key in ("way", "invite", "question", "again", "passage"):
        if key not in study["close"]:
            raise BuildError(f"the closing section has no {key.capitalize()}")
    if [p["n"] for p in study["parts"]] != [f"0{n}" for n in range(1, 8)]:
        raise BuildError(f"the page is drawn for parts 01 to 07, found {[p['n'] for p in study['parts']]}")
    for part in study["parts"]:
        part.pop("panelOpen", None)
        for key in ("hook", "readings", "consider", "reflect"):
            if not part.get(key):
                raise BuildError(f"part {part['n']} has no {key}")
    return study


def build_from(bible: dict, text: str, lists: dict, life: dict) -> tuple:
    """Everything the page needs, from the given inputs; touches no file. Returns (data.js text, builder)."""
    builder = Builder(bible, lists)
    builder.links = study_links(HERE.parent, lists["STUDY_LINKS"])
    study = parse(builder, apply_patches(text, lists["TEXT_PATCHES"]))
    drawn = check_lists(builder, lists, text, study)
    outside = check_outside(builder, lists)
    crisis = check_crisis(text, lists["CRISIS"], life)
    blocks = [b for p in study["parts"] for b in p["blocks"]]
    quoted = {b["r"] for b in blocks if b["k"] == "quote"} | {b["r"] for b in study["opening"]} | {study["close"]["passage"]}
    printed = sorted({(builder.passages[k]["span"].rsplit(" ", 1)[0], cv) for k in quoted for cv, _ in builder.passages[k]["verses"]})
    numbers = {"baptisms": len(drawn["panel"]), "namedFirst": sum(1 for r in drawn["panel"] if r["before"]),
               "other": sum(1 for b in blocks if b["k"] == "other"), "open": sum(1 for b in blocks if b["k"] == "open"),
               "versesPrinted": len(printed), "references": len(builder.passages),
               "compared": sum(1 for o in outside.values() if o["compared"]), "outside": len(outside)}
    data = {"schema": SCHEMA, "study": study, "passages": dict(sorted(builder.passages.items())), **drawn, "numbers": numbers,
            "crisis": crisis, "checks": builder.checks, "patches": [{"why": p["why"]} for p in lists["TEXT_PATCHES"]],
            "sources": lists["SOURCES"], "outside": outside, "heldFacts": [f[4] for f in lists["HELD_FACTS"]]}
    body = json.dumps(data, ensure_ascii=False, indent=1).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.BL = " + body + ";\n", builder


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")


def inputs() -> tuple:
    life = json.loads(read_text(LIFE))
    lists = {name: getattr(study_lists, name) for name in LIST_NAMES}
    return load_bible(), read_text(CONTENT), lists, life


def fingerprint(output: str, text: str) -> str:
    """data.js ends with the hashes of what it was built from (line endings normalised), so a stale file names its cause."""
    parts = {"content.md": text, "life.json": read_text(LIFE)} | {name: read_text(HERE / name) for name in OWN_FILES}
    parts["bsb"] = "".join((BSB / f"{code}.json").read_text(encoding="utf-8") for code in CANON)
    prints = {name: hashlib.sha256(body.encode("utf-8")).hexdigest()[:16] for name, body in sorted(parts.items())}
    return output + "window.BL_BUILT_FROM = " + json.dumps(prints) + ";\n"


def stale_inputs(old: str, new: str) -> list:
    def prints(body: str) -> dict:
        found = re.search(r"window\.BL_BUILT_FROM = (\{.*\});", body)
        return json.loads(found.group(1)) if found else {}
    before, after = prints(old), prints(new)
    return sorted(name for name in after if before.get(name) != after[name]) or ["data.js itself"]


def write_atomically(path: Path, body: bytes) -> None:
    if path.resolve().parent != HERE or path.is_symlink():
        raise BuildError(f"refusing to write outside this folder or through a link: {path}")
    temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    try:
        with open(temp, "wb") as handle:
            handle.write(body)
            handle.flush()
            os.fsync(handle.fileno())
        for attempt in range(10):
            try:
                os.replace(temp, path)
                return
            except PermissionError:
                if attempt == 9:
                    raise
                time.sleep(0.5)
    finally:
        try:
            temp.unlink(missing_ok=True)
        except OSError as error:
            print(f"build-data: could not remove the temporary file {temp}: {error}", file=sys.stderr)


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    try:
        bible, text, lists, life = inputs()
        output, builder = build_from(bible, text, lists, life)
        output = fingerprint(output, text)
        if "--selftest" in sys.argv or "--check" in sys.argv:
            from selftest import run_selftest
            print(run_selftest(build_from, bible, text, lists, life, OUT))
            if "--selftest" in sys.argv:
                return 0
        if "--check" in sys.argv:
            missing = check_page_files(HERE)
            if missing:
                raise BuildError(f"files the page loads are missing or not relative: {', '.join(missing)}")
            current = OUT.read_bytes().decode("utf-8").replace("\r\n", "\n") if OUT.exists() else None
            if current != output:
                print(f"build-data: stale: data.js does not match its inputs (changed: {', '.join(stale_inputs(current or '', output))}); run without --check", file=sys.stderr)
                return 1
            print(f"build-data: all checks pass; data.js is current ({len(builder.passages)} references, {len(builder.checks)} editorial notes listed)")
            return 0
        write_atomically(OUT, output.encode("utf-8"))
    except Exception as error:  # every failure is reported and leaves data.js as it was
        print(f"build-data: FAILED ({type(error).__name__}): {error}", file=sys.stderr)
        return 1
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} characters, {len(builder.passages)} references)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
