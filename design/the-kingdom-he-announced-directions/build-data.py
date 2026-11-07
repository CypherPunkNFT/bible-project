#!/usr/bin/env python3
"""Build data.js for The kingdom he announced mock-up from the study's content.md, checking it against the Berean.

Run from Website/:  python design/the-kingdom-he-announced-directions/build-data.py
  --check     run every check and fail if data.js is not exactly what the inputs build now; writes nothing
  --selftest  feed wrong inputs in memory and fail unless every one is refused; writes nothing (build_selftest.py)
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
from scripture_text import REF_RE, BuildError, fold, has_words, load_bible, plain_text, ref_id, typographic, verses_of  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/jesus-christ/the-kingdom-he-announced/content.md"
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
NOTE = re.compile(r"\s*\[(check|proposed): ([^\]]+)\]")
SAFE_LINK = re.compile(r"/(?![/\\])[A-Za-z0-9._~/?=&#%-]*")
CONTINUE = re.compile(r"(; |, | with | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")
QUOTE = re.compile(r'"([^"]+)"(?:\s*\(([^)]*)\))?')
MARKER = re.compile(r"\[(read|open|other|care|source:[a-z]+)\] (.*)")
CHAPTERS = re.compile(r"(?:and )?(Psalms|[A-Z][a-z]+) (\d+(?:(?:, | and )\d+)*)")
FIELDS = ("Subtitle", "Concepts", "Motto", "Lead", "Frame", "Selection", "Hook", "Text",
          "Way", "Invite", "Question", "Again", "Passage")
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


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
            out += self.inline_runs(text[last:match.start()], cited)
            note = {"n": len(self.checks) + 1, "t": typographic(match.group(2)), "where": where}
            # A note on a confession phrase is answered by the check_quotes run on this same line, against the held text.
            before = re.search(r'"([^"]+)"\s*$', text[:match.start()])
            if before and before.group(1) in self.lists.CONFESSION_QUOTES:
                note["held"] = f"Matches article {self.lists.CONFESSION_QUOTES[before.group(1)]} of the Baptist Faith and Message 2000 held on this PC, word for word; checked by script at every build."
            self.checks.append(note)
            out.append({"chk": len(self.checks)})
            last = match.end()
        return out + self.inline_runs(text[last:], cited)

    def inline_runs(self, text: str, cited: list) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], cited)
            link_text, url, bold, italic = match.groups()
            if url:
                if not SAFE_LINK.fullmatch(url) or ".." in url:
                    raise BuildError(f"only plain links on this site are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold:
                out.append({"b": typographic(bold)})
            elif italic in self.lists.STUDY_LINKS:
                out.append({"s": self.lists.STUDY_LINKS[italic], "t": italic})
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

    def in_order(self, pieces: list, text: str) -> bool:
        """Every piece of a quotation cut with "…", as whole words, in order, in one passage."""
        at = 0
        for piece in pieces:
            folded = fold(piece).replace('"', "").replace("*", "").replace("'", "")
            found = None
            for variant in (folded, folded[:1].lower() + folded[1:], folded[:1].upper() + folded[1:]):
                match = re.compile(r"(?<!\w)" + re.escape(variant) + r"(?!\w)").search(text, at)
                if match and (found is None or match.start() < found.start()):
                    found = match
            if not found:
                return False
            at = found.end()
        return True

    def check_quotes(self, raw: str, pool: list, where: str) -> None:
        """A quote with its own reference after it must be in that reference. Any other quote must be in a verse the
        paragraph cites, the part's walked passages, or the passage printed just above it; or be on a named list."""
        lists = self.lists
        for match in QUOTE.finditer(NOTE.sub("", raw)):
            phrase, after = match.groups()
            if phrase in lists.OWN_TERMS:
                continue
            if phrase in lists.CONFESSION_QUOTES:
                self.check_confession(phrase, raw, where)
                continue
            if phrase in lists.OUTSIDE_QUOTES:
                if any(has_words(fold(phrase), plain_text(self.bible, self.passages[k]["label"])) for k in pool):
                    raise BuildError(f"{where}: {phrase!r} is listed as outside Scripture but is in a verse this paragraph cites")
                continue
            own = [self.passage(label) for _, _, label in self.refs_in(after or "")]
            if not own and phrase in lists.SCRIPTURE_ELSEWHERE:
                own = [self.passage(lists.SCRIPTURE_ELSEWHERE[phrase])]
            keys = own or pool
            pieces = [p.strip(" ,.?!") for p in phrase.split("…") if p.strip(" ,.?!")]
            texts = [plain_text(self.bible, self.passages[k]["label"]).replace("'", "") for k in keys]
            if not any(self.in_order(pieces, t) for t in texts):
                labels = ", ".join(self.passages[k]["label"] for k in keys) or "none"
                raise BuildError(f"{where}: quoted words {phrase!r} are not, in order, in {labels}")

    def check_confession(self, phrase: str, raw: str, where: str) -> None:
        article = self.lists.CONFESSION_QUOTES[phrase]
        if not re.search(rf"\barticle {article}\b", raw, re.I):
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
    strings = []
    walk = [raw]
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


def readings(builder: Builder, body: str) -> list:
    """Main readings: "Isaiah 52:7–10; with Psalms 93, 97 and 99, and Daniel 2 and 7". Whole chapters are expanded."""
    out = []
    for item in (piece.strip() for piece in body.split(";")):
        also = item.startswith("with ")
        item = item.removeprefix("with ")
        if REF_RE.fullmatch(item.replace("-", "–")):
            out.append({"r": builder.passage(item), "t": item, "with": also})
            continue
        rest = item
        for match in CHAPTERS.finditer(item):
            book = "Psalm" if match.group(1) == "Psalms" else match.group(1)
            for chapter in re.split(r", | and ", match.group(2)):
                key = whole_chapter(builder, book, int(chapter))
                out.append({"r": key, "t": f"{book} {chapter}", "with": also})
            rest = rest.replace(match.group(0), "")
        if rest.strip(" ,") or not also:
            raise BuildError(f"main readings: could not read {item!r}")
    return out


def whole_chapter(builder: Builder, book: str, chapter: int) -> str:
    from scripture_text import BOOKS
    if book not in BOOKS:
        raise BuildError(f"main readings: unknown book {book!r}")
    last = max(int(k.split(":")[1]) for k in builder.bible[BOOKS[book]] if k.split(":")[0] == str(chapter))
    return builder.passage(f"{book} {chapter}:1–{last}")


def para(builder: Builder, raw: str, where: str, section: dict | None) -> list:
    cited: list = []
    runs = builder.runs(raw, cited, where)
    section = section or {}
    walked = [r["r"] for r in section.get("readings", []) if not r["with"]] + section.get("texts", [])
    last = next((b for b in reversed(section.get("blocks", [])) if b["k"] == "quote"), None)
    builder.check_quotes(raw, cited + walked + ([last["r"]] if last else []), where)
    return typographic_runs(runs)


def typographic_runs(runs: list) -> list:
    """Curl the quotation marks across the whole paragraph, so a quotation may span italics or a reference. A curly
    mark is one character, as the straight one is, so each string run is cut back out at its own offsets."""
    joined = "".join(r if isinstance(r, str) else "\0" for r in runs)
    curled = re.sub(r'"([^"]*)"', r"“\1”", joined)
    out, at = [], 0
    for run in runs:
        size = len(run) if isinstance(run, str) else 1
        out.append(curled[at:at + size] if isinstance(run, str) else run)
        at += size
    return [r for r in out if r != ""]


def head(builder: Builder, study: dict, line: str) -> dict | None:
    text = line[3:]
    if text.startswith("Question: "):
        current = {"title": typographic(text[10:]), "blocks": []}
        study["questions"].append(current)
        return current
    if text.startswith("Close: "):
        study["close"] = {"title": text[7:]}
        return None
    number, _, title = text.partition(" ")
    if not re.fullmatch(r"\d\d", number):
        raise BuildError(f"a part heading must start with its two-digit number: {line!r}")
    saying = re.match(r'"([^"]+)": (.*)', title)
    current = {"n": number, "title": typographic(title), "blocks": [],
               "saying": saying.group(1) if saying else "", "rest": saying.group(2) if saying else title}
    study["parts"].append(current)
    return current


def field(builder: Builder, study: dict, current: dict | None, name: str, body: str, where: str) -> None:
    target = study["close"] if "close" in study else (current if name in ("Hook", "Text") else study)
    if target is None:
        raise BuildError(f"{where}: {name} line outside a part")
    if name == "Concepts":
        target["concepts"] = body.split(" · ")
    elif name == "Motto":
        target["motto"] = body.split(" / ")
    elif name == "Passage":
        target["passage"] = builder.passage(body)
    elif name == "Text":
        target["texts"] = [builder.passage(r.strip()) for r in body.split(";")]
    elif name == "Subtitle":
        target["subtitle"] = NOTE.sub("", body).strip()
        target["subtitleNote"] = "; ".join(m.group(2) for m in NOTE.finditer(body))
    else:
        target[name.lower()] = para(builder, body, where, current if name == "Hook" else None)


def parse(builder: Builder, text: str) -> dict:
    lines = text.replace("\r\n", "\n").split("\n")
    study: dict = {"parts": [], "questions": []}
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
            (current["blocks"] if current else study.setdefault("opening", [])).append(builder.block(quote, ref_line))
        elif line.startswith("## "):
            current = head(builder, study, line)
        elif line.startswith("### ") and current is not None:
            current["blocks"].append({"k": "h3", "t": typographic(line[4:])})
        elif (m := re.match(r"\*\*(Main readings|Consider|Reflect):\*\* (.*)", line)) and current is not None:
            if m.group(1) == "Main readings":
                current["readings"] = readings(builder, m.group(2))
            else:
                current[m.group(1).lower()] = para(builder, m.group(2), where, current)
        elif (m := MARKER.fullmatch(line)) and current is not None:
            current["blocks"].append({"k": "note", "kind": m.group(1), "label": builder.lists.NOTE_LABELS[m.group(1)],
                                      "runs": para(builder, m.group(2), where, current)})
        elif line.startswith("- ") and current is not None:
            current["blocks"].append({"k": "li", "runs": para(builder, line[2:], where, current)})
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
    for part in study["parts"]:
        for key in ("readings", "hook", "consider", "reflect"):
            if key not in part:
                raise BuildError(f"part {part['n']} has no {key}")
        if part["saying"]:
            builder.check_quotes(f'"{part["saying"]}"', [r["r"] for r in part["readings"] if not r["with"]], f"part {part['n']} title")
    return study


def mark(builder: Builder, verb: dict) -> dict:
    """Where the verb sits in its verse, as character offsets into the verse text the page prints."""
    key = builder.passage(verb["ref"])
    if not has_words(fold(verb["clause"]), plain_text(builder.bible, verb["ref"])):
        raise BuildError(f"tense table: {verb['clause']!r} is not in {verb['ref']}")
    if not has_words(verb["verb"], verb["clause"]):
        raise BuildError(f"tense table: the verb {verb['verb']!r} is not in its clause {verb['clause']!r}")
    raw = " ".join(text for _, text in builder.passages[key]["verses"])
    start = raw.find(verb["clause"])
    if start < 0:
        raise BuildError(f"tense table: could not place {verb['clause']!r} in the printed text of {verb['ref']}")
    at = start + verb["clause"].find(verb["verb"])
    return {**verb, "r": key, "at": [at, at + len(verb["verb"])]}


def check_lists(builder: Builder, study: dict) -> dict:
    lists, bible = builder.lists, builder.bible
    parts = {p["n"]: p for p in study["parts"]}
    tenses = []
    for row in lists.TENSES:
        if row["part"] not in parts:
            raise BuildError(f"tense table: no part {row['part']}")
        tenses.append({**row, "verbs": [mark(builder, verb) for verb in row["verbs"]]})
    if sorted(row["part"] for row in lists.TENSES) != sorted(parts):
        raise BuildError("tense table: every part needs exactly one line")
    consider = fold("".join(r if isinstance(r, str) else r.get("t", "") for r in parts["03"]["consider"])).lower()
    for _, name in lists.KINDS:
        if name.lower() not in consider:
            raise BuildError(f"Matthew 13: the kind {name!r} is not named in part 03's Consider question")
    kinds = {k for k, _ in lists.KINDS}
    parables = []
    for item in lists.PARABLES:
        _, verses = verses_of(bible, item["ref"])
        if item["kind"] not in kinds or not has_words(fold(item["opening"]), fold(verses[0][2]).replace('"', "")):
            raise BuildError(f"Matthew 13: {item['name']} opening {item['opening']!r} is not in {item['ref']}'s first verse, or its kind is unknown")
        done = {**item, "r": builder.passage(item["ref"]), "from": verses[0][1], "to": verses[-1][1]}
        if "explained" in item:
            proof = item["explained"]
            if not has_words(fold(proof["proof"]), plain_text(bible, proof["ref"])):
                raise BuildError(f"Matthew 13: {proof['proof']!r} is not in {proof['ref']}")
            done["explained"] = {**proof, "r": builder.passage(proof["ref"])}
        parables.append(done)
    marks = []
    for item in lists.CHAPTER_MARKS:
        pairs = [(item.get("proof_ref", item["ref"]), item["phrase"])] + ([item["also"]] if "also" in item else [])
        for label, phrase in pairs:
            if not has_words(fold(phrase), plain_text(bible, label)):
                raise BuildError(f"Matthew 13: {phrase!r} is not in {label}")
        _, verses = verses_of(bible, item["ref"])
        marks.append({**item, "r": builder.passage(item["ref"]), "from": verses[0][1]})
    last = max(int(k.split(":")[1]) for k in bible["MAT"] if k.startswith("13:"))
    if last != lists.MATTHEW_13_LAST_VERSE:
        raise BuildError(f"Matthew 13 should end at verse {lists.MATTHEW_13_LAST_VERSE}, the Berean has {last}")
    waiting = []
    for item in lists.WAITING:
        if not has_words(fold(item["phrase"]), plain_text(bible, item["ref"])):
            raise BuildError(f"waiting: {item['phrase']!r} is not in {item['ref']}")
        waiting.append({**item, "r": builder.passage(item["ref"])})
    if lists.WAITING_QUESTION not in [q["title"] for q in study["questions"]]:
        raise BuildError(f"waiting: no question titled {lists.WAITING_QUESTION!r}")
    way = "".join(r if isinstance(r, str) else r.get("t", r.get("i", "")) for r in study["close"]["way"])
    for ask in lists.ASKS:
        if ask not in way:
            raise BuildError(f"close: the ask {ask!r} is not in the Way paragraph")
    for name, url in lists.STUDY_LINKS.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"study link for {name!r} points to {url}, which has no page on this PC")
    return {"tenses": tenses, "parables": parables, "marks": marks, "waiting": waiting}


def count_figures(builder: Builder, study: dict, lists_data: dict) -> dict:
    walked = [r for p in study["parts"] for r in p["readings"] if not r["with"]]
    selection = "".join(r for r in study["selection"] if isinstance(r, str))
    if len(walked) != 7 or "seven passages" not in selection:
        raise BuildError(f"the selection must say \"seven passages\" and the main readings must walk seven; they walk {len(walked)}")
    shown = set()
    keys = [b["r"] for p in study["parts"] + study["questions"] for b in p["blocks"] if b["k"] == "quote"]
    for key in keys + [b["r"] for b in study["opening"]] + [study["close"]["passage"]]:
        shown |= {f"{key.split('.')[0]} {cv}" for cv, _ in builder.passages[key]["verses"]}
    kingdom = sum(1 for k, v in builder.bible["MAT"].items() if k.startswith("13:") and "kingdom" in v)
    return {"walked": len(walked), "sayings": sum(len(t["verbs"]) for t in lists_data["tenses"]),
            "lines": len(lists_data["tenses"]), "matthew13Kingdom": kingdom, "matthew13Verses": builder.lists.MATTHEW_13_LAST_VERSE,
            "versesShown": len(shown), "references": len(builder.passages), "questions": len(study["questions"]), "checks": len(builder.checks)}


def build(bible: dict, content: str, lists) -> str:
    builder = Builder(bible, lists)
    study = parse(builder, content)
    lists_data = check_lists(builder, study)
    numbers = count_figures(builder, study, lists_data)
    inputs = {"content.md": content, "study_lists.py": (HERE / "study_lists.py").read_text(encoding="utf-8"),
              "build-data.py": (HERE / "build-data.py").read_text(encoding="utf-8"),
              "scripture_text.py": (HERE / "scripture_text.py").read_text(encoding="utf-8")}
    prints = {name: hashlib.sha256(text.replace("\r\n", "\n").encode("utf-8")).hexdigest()[:16] for name, text in inputs.items()}
    data = {"study": study, "passages": builder.passages, **lists_data, "kinds": lists.KINDS, "asks": lists.ASKS, "waitingQuestion": lists.WAITING_QUESTION, "numbers": numbers,
            "checks": builder.checks, "sources": lists.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.KH = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


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
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != output:
            print("build-data: stale: data.js is not what the inputs build now; run without --check", file=sys.stderr)
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
