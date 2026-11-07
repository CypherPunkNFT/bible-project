#!/usr/bin/env python3
"""Build data.js for the Following Jesus mock-up from the study's content.md, checking it against the site's Berean text.

Run from Website/: python design/following-jesus-directions/build-data.py
  --check     run every check and fail if data.js is stale; writes nothing
  --selftest  feed deliberately wrong inputs in memory and confirm each one is refused; writes nothing
Exit 1 with a message, and data.js unchanged, if any check fails.
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
import study_lists  # noqa: E402
from scripture_text import REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/jesus-christ/following-jesus/content.md"
HELP_LINES = WEBSITE / "src/data/resources/life.json"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CHECK_NOTE = re.compile(r"\s*\[check(?:: ([^\]]+)| before publishing)\]")
SITE_LINK = re.compile(r"^/(?![/\\])[\w\-./?#=&%]*$")  # same-site path only; refuses //host and /\host
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])")
RELATIVE = re.compile(r"\bverses? (\d+)(?:–(\d+))?(?: and (\d+))?\b")  # "verse 16", "verses 27–32", "verses 21 and 27"
FIELDS = ("Concepts", "Motto", "Lead", "Passage")
FIRST_PERSON = re.compile(r"\b(I|my|myself)\b")
LIST_NAMES = ("SERMON", "NOT_READ", "FRAMES", "PART_RANGES", "LINES", "BEATITUDES", "SAYINGS", "PRACTICES", "REFRAIN",
              "HYPOCRITES", "RICH_MAN", "PAIRS", "BESIDE", "VINE", "FACTS", "CRISIS_NUMBERS", "CARE_NOTES", "MISQUOTE_FIXES",
              "STUDY_LINKS", "OUTSIDE_QUOTES", "OWN_TERMS", "QUOTE_HOMES", "CLOSE_CALLBACKS", "SOURCES")


def default_lists() -> dict:
    return copy.deepcopy({name: getattr(study_lists, name) for name in LIST_NAMES})


class Builder:
    def __init__(self, bible: dict, lists: dict) -> None:
        self.bible, self.lists = bible, lists
        self.passages: dict = {}
        self.checks: list = []  # notes the study still marks "[check …]", shown on the page and listed at the foot

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def refs_in(self, text: str, section: dict | None) -> list:
        """Every reference in plain text with its span: whole ones, short continuations ("5:22, 48") and, inside a
        part, "verse 16" or "verses 27–32", read against that part's main reading and refused if outside it."""
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
        if section and section.get("readings"):
            found += self.relative_refs(text, section, found)
        return sorted(found)

    def relative_refs(self, text: str, section: dict, taken: list) -> list:
        home = self.passages[section["readings"][0]]["label"]
        book, chapter = REF_RE.fullmatch(home).group(1), REF_RE.fullmatch(home).group(2)
        allowed = {cv for key in section["readings"] for cv, _ in self.passages[key]["verses"]}
        out = []
        for match in RELATIVE.finditer(text):
            if any(start <= match.start() < end for start, end, _ in taken):
                continue
            first, last, extra = match.groups()
            label = f"{book} {chapter}:{first}" + (f"–{last}" if last else "")
            span = [f"{chapter}:{v}" for v in range(int(first), int(last or first) + 1)] + ([f"{chapter}:{extra}"] if extra else [])
            if not set(span) <= allowed:
                raise BuildError(f"'{match.group(0)}' in part {section.get('n', '?')} reads as {book} {chapter}, but is outside its main readings")
            if extra:
                out.append((match.start(), match.start() + len(match.group(0)) - len(f" and {extra}"), label))
                out.append((match.end() - len(extra), match.end(), f"{book} {chapter}:{extra}"))
            else:
                out.append((match.start(), match.end(), label))
        return out

    def runs(self, text: str, cited: list, section: dict | None) -> list:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t} (a named study), {c} (a note still to check)."""
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited, section)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SITE_LINK.match(url):
                    raise BuildError(f"only links to this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            else:
                out.append(self.italic(italic))
            last = match.end()
        return out + self.plain_runs(text[last:], cited, section)

    def italic(self, text: str) -> dict:
        """A named study links to its mock-up (or is marked as not yet a page); a book title or a term stays italic."""
        target = self.lists["STUDY_LINKS"].get(text.replace("’", "'"), False)
        if target is False:
            return {"i": typographic(text)}
        if target is not None and not SITE_LINK.match(target):
            raise BuildError(f"study link for {text!r} leaves the site: {target!r}")
        return {"s": target, "t": text}

    def plain_runs(self, text: str, cited: list, section: dict | None) -> list:
        out, last = [], 0
        for start, end, kind, value in self.tokens(text, section):
            if start > last:
                out.append(typographic(text[last:start]))
            if kind == "ref":
                key = self.passage(value)
                cited.append(key)
                out.append({"r": key, "t": text[start:end]})
            else:
                out.append({"c": value})
                self.checks.append(value)
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        return [run for run in out if run != ""]

    def tokens(self, text: str, section: dict | None) -> list:
        notes = [(m.start(), m.end(), "check", re.sub(r'["“”]', "", m.group(1) or "before publishing")) for m in CHECK_NOTE.finditer(text)]
        clear = CHECK_NOTE.sub(lambda m: " " * len(m.group(0)), text)  # a reference inside a note is not a link
        refs = [(s, e, "ref", label) for s, e, label in self.refs_in(clear, section)]
        return sorted(notes + refs)

    def check_quotes(self, raw: str, cited: list, where: str) -> None:
        """Each quoted phrase is in a verse its own paragraph cites, or in its named home, or on the outside list."""
        lists = self.lists
        if raw.count('"') % 2:
            raise BuildError(f"{where}: an odd number of quotation marks, so the quotations cannot be paired")
        for match in re.finditer(r'"([^"]+)"(?:\s*\(([^)]*)\))?', raw):
            phrase, after = match.groups()
            if phrase in lists["OUTSIDE_QUOTES"] or phrase in lists["OWN_TERMS"]:
                continue
            pieces = [p.strip(" ,.") for p in phrase.split("…") if p.strip(" ,.")]
            # A quote with its own reference right after it must be in that reference (all of them, if several).
            own = [ref_id(label.replace("-", "–")) for _, _, label in self.refs_in(after or "", None)]
            if phrase in lists["QUOTE_HOMES"]:
                own = [self.passage(lists["QUOTE_HOMES"][phrase])]
            texts = [plain_text(self.bible, self.passages[k]["label"]).replace("'", "") for k in (own or cited)]
            for piece in pieces:
                folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")
                variants = {folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]}
                if not any(has_words(v, t) for v in variants for t in texts):
                    raise BuildError(f"{where}: quoted words {piece!r} are not in any verse this paragraph cites "
                                     f"({', '.join(self.passages[k]['label'] for k in (own or cited)) or 'none'})")

    def block(self, quote_lines: list, ref_line: str) -> dict:
        label = ref_line.removesuffix(" · BSB").strip()
        if label == ref_line:
            raise BuildError(f"block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        # Word for word: the whole reference, or one unbroken run of its words (a speech inside "He said to them, …").
        page, bible = fold(quoted).replace('"', ""), plain_text(self.bible, label)
        if page != bible and (len(page) < 20 or not has_words(page, bible)):
            raise BuildError(f"block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label, "text": typographic(quoted), "part": page != bible}


def para(builder: Builder, raw: str, where: str, section: dict | None = None) -> list:
    """A paragraph may quote the verses it cites, its section's main readings, or the passage printed just above it."""
    cited: list = []
    runs = builder.runs(typographic(raw), cited, section)  # curl quotes across the whole line, so a quote may span italics
    nearby = list((section or {}).get("readings", [])) + list((section or {}).get("quoted", []))
    last = next((b for b in reversed((section or {}).get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(CHECK_NOTE.sub("", raw), cited + nearby + ([last["r"]] if last else []), where)
    return runs


def apply_fixes(text: str, lists: dict, bible: dict) -> tuple:
    """Put the Berean's words where content.md's differ (each listed in study_lists.py and in the README)."""
    applied = []
    for fix in lists["MISQUOTE_FIXES"]:
        if fix["was"] not in text:
            raise BuildError(f"misquote fix no longer applies: {fix['was']!r} is not in content.md; remove it from study_lists.py")
        if not has_words(fold(fix.get("check", fix["now"])), plain_text(bible, fix["ref"])):
            raise BuildError(f"misquote fix: {fix.get('check', fix['now'])!r} is not in {fix['ref']}")
        text = text.replace(fix["was"], fix["now"])
        applied.append({"was": fix["was"].replace('"', ""), "now": fix["now"].replace('"', ""), "ref": fix["ref"]})
    return text, applied


def readings(builder: Builder, body: str) -> tuple:
    """'Matthew 6:1–4; Matthew 6:16–18 (with 6:9–13 quoted)' -> read passages, quoted-only passages."""
    read, quoted, book = [], [], None
    for item in (piece.strip() for piece in body.split(";")):
        extra = re.search(r"\(with ([^)]+) quoted\)", item)
        main = re.sub(r"\s*\(with [^)]+ quoted\)", "", item).strip()
        book = REF_RE.fullmatch(main).group(1) if REF_RE.fullmatch(main) else book
        read.append(builder.passage(main))
        if extra:
            label = extra.group(1) if REF_RE.fullmatch(extra.group(1)) else f"{book} {extra.group(1)}"
            quoted.append(builder.passage(label))
    return read, quoted


def place(builder: Builder, study: dict, current: dict | None, line: str, where: str) -> None:
    """One line of a section, or of the opening before the first section."""
    if current is None:
        if (m := re.match(r"([A-Z][a-z]+): (.*)", line)) and m.group(1) in FIELDS:
            field, body = m.groups()
            study[field.lower()] = body.split(" · ") if field == "Concepts" else body.split(" / ") if field == "Motto" else para(builder, body, where)
        elif line.startswith(("#", "-", "[")):
            raise BuildError(f"{where}: a line before the first part that the page does not know how to place: {line[:60]!r}")
        else:
            study.setdefault("intro", []).append(para(builder, line, where))
        return
    if m := re.match(r"\*\*(Main readings|Consider|Reflect|Question):\*\* (.*)", line):
        label, body = m.groups()
        if label == "Main readings":
            current["readings"], current["quoted"] = readings(builder, body)
        else:
            current[label.lower()] = para(builder, body, where, current)
    elif line.startswith("Passage: ") and current.get("kind") == "close":
        current["passage"] = builder.passage(line[9:])
    elif line == "Read the passage again before you answer." and current.get("kind") == "close":
        current["again"] = line
    elif line.startswith("[care] "):
        current["blocks"].append({"k": "care", "runs": para(builder, line[7:], where, current)})
    elif m := re.match(r"\*\*Its limits\.\*\* (.*)", line):
        current["blocks"].append({"k": "limits", "runs": para(builder, m.group(1), where, current)})
    elif m := re.match(r"- \*\*([^*]+)\.\*\* (.*)", line):
        current["blocks"].append({"k": "item", "label": m.group(1), "runs": para(builder, m.group(2), where, current)})
    elif m := re.match(r"\*\*([^*]+)\.\*\* (.*)", line):
        current["blocks"].append({"k": "voice", "label": m.group(1), "runs": para(builder, m.group(2), where, current)})
    elif line.startswith(("#", "-", "[", "**")):
        raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
    else:
        current["blocks"].append({"k": "p", "runs": para(builder, line, where, current)})


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"parts": [], "questions": [], "opening": []}
    current, used, i = None, 0, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        used += 1
        where = f"content.md line {i}"
        if line.startswith("# "):
            study["title"] = line[2:]
        elif line.startswith("> "):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; used += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            ref_line = lines[i].strip(); i += 1; used += 1
            (current["blocks"] if current else study["opening"]).append(builder.block(quote, ref_line))
        elif line.startswith("## "):
            current = section(study, line[3:], where)
        else:
            place(builder, study, current, line, where)
    total = sum(1 for line in lines if line.strip())
    if used != total:
        raise BuildError(f"{total - used} lines of content.md were not placed on the page")
    for key in ("title", "concepts", "motto", "lead", "opening", "intro", "close"):
        if not study.get(key):
            raise BuildError(f"content.md has no {key}")
    for key in ("question", "again", "passage"):
        if key not in study["close"]:
            raise BuildError(f"the closing section has no {key}")
    return study


def section(study: dict, head: str, where: str) -> dict:
    if head.startswith("Question: "):
        current = {"kind": "question", "title": head[10:], "blocks": []}
        study["questions"].append(current)
    elif head.startswith("Closing: "):
        current = {"kind": "close", "title": head[9:], "blocks": []}
        study["close"] = current
    elif re.match(r"\d\d ", head):
        number, _, title = head.partition(" ")
        current = {"kind": "part", "n": number, "title": title, "blocks": []}
        study["parts"].append(current)
    else:
        raise BuildError(f"{where}: a section heading the page does not know: {head!r}")
    return current


def need(builder: Builder, label: str, phrase: str, what: str) -> str:
    """Register a passage and prove the phrase is in it, as whole words."""
    key = builder.passage(label)
    if not has_words(fold(phrase).replace('"', ""), plain_text(builder.bible, label)):
        raise BuildError(f"{what}: {phrase!r} is not in {label}")
    return key


def within(builder: Builder, inner: str, outer: str, what: str) -> None:
    inside = {cv for cv, _ in builder.passages[builder.passage(outer)]["verses"]}
    if not {cv for cv, _ in builder.passages[builder.passage(inner)]["verses"]} <= inside:
        raise BuildError(f"{what}: {inner} is not inside {outer}")


def check_map(builder: Builder) -> dict:
    """The sermon, its two frames, the parts' ranges, and the ten famous lines, each inside its whole."""
    lists = builder.lists
    sermon = builder.passage(lists["SERMON"])
    for frame in lists["FRAMES"]:
        frame["o"] = need(builder, frame["open"], frame["open_words"], f"frame {frame['id']}")
        frame["s"] = need(builder, frame["shut"], frame["shut_words"], f"frame {frame['id']}")
    order = [cv for key in [builder.passage(r) for r in lists["PART_RANGES"].values()] for cv, _ in builder.passages[key]["verses"]]
    whole = [cv for cv, _ in builder.passages[sermon]["verses"]]
    if order != whole:
        raise BuildError("the parts' ranges do not cover the sermon exactly once, in order")
    within(builder, lists["NOT_READ"], lists["PART_RANGES"]["03"], "the prayer left to its own study")
    lines = []
    for line in lists["LINES"]:
        what = f"famous line {line['id']}"
        keys = {"r": need(builder, line["ref"], line["phrase"], what), "w": builder.passage(line["whole"]),
                "wr": need(builder, line["who_ref"], line["who_phrase"], what),
                "br": need(builder, line["before_ref"], line["before_phrase"], what),
                "ar": need(builder, line["after_ref"], line["after_phrase"], what)}
        for field in ("ref", "who_ref", "before_ref", "after_ref"):
            within(builder, line[field], line["whole"], what)
        lines.append({**line, **keys})
    if len({line["id"] for line in lines}) != len(lines):
        raise BuildError("two famous lines share an id")
    ranges = {n: builder.passage(label) for n, label in lists["PART_RANGES"].items()}
    return {"sermon": sermon, "notRead": builder.passage(lists["NOT_READ"]), "frames": lists["FRAMES"], "ranges": ranges, "lines": lines}


def check_parts(builder: Builder) -> dict:
    """The drawings inside parts 01–09: every phrase in its verse."""
    lists = builder.lists
    blessed = [{"r": need(builder, ref, f"{who}", "beatitude"), "who": who, "promise": promise} for ref, who, promise in lists["BEATITUDES"]]
    for row in blessed:
        need(builder, builder.passages[row["r"]]["label"], row["promise"], "beatitude promise")
    sayings = [{**s, "sr": need(builder, s["said_ref"], s["said"], "saying"), "tr": need(builder, s["tell_ref"], s["tell"], "saying")} for s in lists["SAYINGS"]]
    for s in sayings:
        need(builder, s["tell_ref"], "But I tell you", f"saying {s['topic']}")
    practices = []
    for item in lists["PRACTICES"]:
        practices.append({**item, "wr": need(builder, item["when_ref"], item["when"], "practice"),
                          "xr": need(builder, item["secret_ref"], item["secret"], "practice"),
                          "rr": need(builder, item["refrain_ref"], lists["REFRAIN"], "practice refrain")})
        need(builder, item["when_ref"], lists["HYPOCRITES"], "practice")
    pairs = [{**p, "or": need(builder, p["one_ref"], p["one"], "pair"), "tr": need(builder, p["two_ref"], p["two"], "pair")} for p in lists["PAIRS"]]
    beside = [{"r": need(builder, ref, phrase, "beside"), "t": phrase} for ref, phrase in lists["BESIDE"]]
    return {"blessed": blessed, "sayings": sayings, "practices": practices, "refrain": lists["REFRAIN"],
            "pairs": pairs, "beside": beside, "rich": rich_man(builder), "vine": vine(builder)}


def rich_man(builder: Builder) -> dict:
    """Luke 12:17–19 split into runs, with every "I", "my" and "myself" marked and counted."""
    item = builder.lists["RICH_MAN"]
    key = builder.passage(item["words"])
    verses = []
    for cv, text in builder.passages[key]["verses"]:
        runs, last = [], 0
        for match in FIRST_PERSON.finditer(text):
            runs += [text[last:match.start()], {"m": match.group(0)}]
            last = match.end()
        verses.append([cv, [r for r in runs + [text[last:]] if r != ""]])
    count = sum(1 for _, runs in verses for r in runs if isinstance(r, dict))
    if not 1 <= count <= 99:
        raise BuildError(f"rich man: {count} first-person words is not a believable count")
    return {"r": key, "verses": verses, "count": count, "answer": item["answer"],
            "ar": need(builder, item["answer_ref"], item["answer"], "rich man's answer")}


def vine(builder: Builder) -> dict:
    """One leaf for each verse of John 15:1–17 that says "remain", sized by how often it says it."""
    item = builder.lists["VINE"]
    key = builder.passage(item["passage"])
    pattern = re.compile(rf"\b{item['word']}\w*", re.IGNORECASE)
    leaves = [{"cv": cv, "r": builder.passage(f"John {cv}"), "n": len(pattern.findall(text))} for cv, text in builder.passages[key]["verses"] if pattern.search(text)]
    if not leaves or any(not 1 <= leaf["n"] <= 9 for leaf in leaves):
        raise BuildError(f"vine: unexpected counts {[leaf['n'] for leaf in leaves]}")
    return {"r": key, "leaves": leaves, "total": sum(leaf["n"] for leaf in leaves)}


def check_facts(builder: Builder, study: dict) -> list:
    out = []
    for says, label, phrase, expected in builder.lists["FACTS"]:
        builder.passage(label)
        found = len(re.findall(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", plain_text(builder.bible, label)))
        if found != expected:
            raise BuildError(f"fact {says!r}: {phrase!r} is in {label} {found} times, not {expected}")
        out.append({"says": says, "count": found})
    care_text = json.dumps([b for part in study["parts"] + study["questions"] for b in part["blocks"] if b["k"] == "care"], ensure_ascii=False)
    try:
        help_lines = HELP_LINES.read_text(encoding="utf-8")
    except OSError as error:
        raise BuildError(f"could not read the site's help lines at {HELP_LINES}: {error}") from error
    for number in builder.lists["CRISIS_NUMBERS"]:
        if number not in care_text:
            raise BuildError(f"crisis number {number} is not in any care note on the page")
        if f'"value": "{number}"' not in help_lines:
            raise BuildError(f"crisis number {number} is not one of the site's checked help lines in {HELP_LINES.name}")
    return out


def check_care(study: dict, openings: list) -> None:
    def plain(runs: list) -> str:
        return "".join(r if isinstance(r, str) else r.get("t") or r.get("b") or r.get("i") or "" for r in runs)
    starts = [plain(b["runs"]) for part in study["parts"] + study["questions"] for b in part["blocks"] if b["k"] == "care"]
    for words in openings:
        if not any(start.startswith(words) for start in starts):
            raise BuildError(f"care note beginning {words!r} is not drawn as a care note")


def check_callbacks(builder: Builder, study: dict, lines: list) -> dict:
    ids = {line["id"] for line in lines}
    close_text = json.dumps(study["close"]["blocks"], ensure_ascii=False)
    for phrase, line_id in builder.lists["CLOSE_CALLBACKS"].items():
        if line_id not in ids or f"“{phrase}”" not in close_text:
            raise BuildError(f"close callback {phrase!r} -> {line_id!r}: the phrase is not quoted in the close, or the line does not exist")
    return builder.lists["CLOSE_CALLBACKS"]


def read_content() -> str:
    try:
        return CONTENT.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    except OSError as error:
        raise BuildError(f"could not read the study text at {CONTENT}: {error}") from error


def build(text: str, lists: dict, bible: dict) -> tuple:
    """Every check, then data.js as a string. Inputs are passed in, so the self-test can feed wrong ones in memory."""
    builder = Builder(bible, lists)
    text, fixes = apply_fixes(text, lists, bible)
    care_lines = sum(1 for line in text.splitlines() if line.startswith("[care] "))
    study = parse(builder, text)
    care_blocks = sum(1 for part in study["parts"] + study["questions"] for b in part["blocks"] if b["k"] == "care")
    if care_blocks != care_lines or care_blocks != len(lists["CARE_NOTES"]):
        raise BuildError(f"{len(lists['CARE_NOTES'])} care notes expected, {care_lines} marked in content.md, {care_blocks} placed on the page")
    check_care(study, lists["CARE_NOTES"])
    title, _, turn = study["title"].partition(" and ")
    study["titleParts"] = [title, f"and {turn}" if turn else ""]
    figures = check_map(builder)
    drawings = check_parts(builder)
    facts = check_facts(builder, study)
    callbacks = check_callbacks(builder, study, figures["lines"])
    quoted = {b["r"] for part in study["parts"] + study["questions"] + [study["close"]] for b in part["blocks"] if b["k"] == "quote"}
    quoted |= {b["r"] for b in study["opening"]}
    sermon_verses = len(builder.passages[figures["sermon"]]["verses"])
    numbers = {"parts": len(study["parts"]), "sermonVerses": sermon_verses,
               "sermonRead": sermon_verses - len(builder.passages[figures["notRead"]]["verses"]),
               "butITellYou": facts[0]["count"], "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted | {study["close"]["passage"]}),
               "lines": len(figures["lines"]), "references": len(builder.passages)}
    for name, value in numbers.items():
        if not isinstance(value, int) or not 0 < value < 10000:
            raise BuildError(f"count {name} = {value!r} is out of range")
    data = {"study": study, "passages": builder.passages, "map": figures, "drawings": drawings, "numbers": numbers,
            "callbacks": callbacks, "fixes": fixes, "checks": builder.checks, "outside": lists["OUTSIDE_QUOTES"],
            "sources": lists["SOURCES"]}
    # The fingerprint covers this study's own inputs only. The Berean text itself is not hashed: every verse the page
    # uses is written into data.js, so a change there still makes --check fail.
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    data["built_from"] = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.FJ = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", fixes


def main() -> int:
    if "--selftest" in sys.argv:
        from selftest import run_selftest
        return run_selftest(build, default_lists, read_content, load_bible, OUT)
    try:
        output, fixes = build(read_content(), default_lists(), load_bible())
    except (BuildError, OSError, KeyError, AttributeError) as error:
        print(f"build-data: FAILED: {type(error).__name__}: {error}", file=sys.stderr)
        return 1
    for fix in fixes:
        print(f"build-data: note: showing the Berean's words at {fix['ref']}: {fix['now']!r} where content.md has {fix['was']!r}")
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
            print("build-data: stale: data.js does not match content.md; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    temporary = OUT.with_suffix(".js.tmp")
    temporary.write_text(output, encoding="utf-8", newline="\n")
    os.replace(temporary, OUT)  # a reader never sees a half-written data.js
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
