#!/usr/bin/env python3
"""Build data.js for the Reading Daniel and Revelation mock-up from the study's content.md, checking it against the
site's Berean text (verses, footnotes and headings) and the held copies of the outside sources it quotes.

Run from Website/: python design/reading-daniel-and-revelation-directions/build-data.py
  --check     run every check and fail if data.js is stale; write nothing
  --selftest  feed wrong inputs in memory and prove each is refused; write nothing
Exit 1, with data.js unchanged, if any check fails; exit 2 if a file cannot be read or written.
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
from scripture_text import BOOKS, REF_RE, BuildError, fold, load_bible, ref_id, typographic, verses_of  # noqa: E402
import study_lists as L  # noqa: E402

WEBSITE = HERE.parents[1]
CONTENT = WEBSITE / "content/studies/explore-the-bible/reading-daniel-and-revelation/content.md"
NOTED = WEBSITE / "data/text/bsb"  # the Berean with its footnotes and headings
OUT = HERE / "data.js"
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
CONTINUE = re.compile(r"(; |, | and )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:]| [A-Z])")  # "; Revelation" is a new book
SHORT = re.compile(r"(?<![\w:.–])(\d+):(\d+)(?:–(\d+))?(?![\d:])")
CHAPTER = re.compile(r"\b(" + "|".join(map(re.escape, L.CHAPTER_BOOKS)) + r") (\d+)(?![\d:–])")
STUDY = re.compile(r"\bStudy (\d+)\b")
PART_LINK = re.compile(r"(?<=\()part (\d\d)(?=\))")
QUOTE = re.compile(r'"([^"]+)"')
CHAIN = re.compile(r'(?:\s*(?:,|and|or)?\s*"[^"]*")*')
OWN_REF = re.compile(r'\s*\(?([^()"]*?\d+[^()"]*?·\s*BSB)\)?|\s*\(((?:[1-3] )?[A-Za-z ]*\d+:\d+[^()"]*)\)')
PART_HEAD = re.compile(r"## (\d\d) (.+)")
SUBHEADS = {"What the text shows": "shows", "What it means": "means", "Where the reading stops": "stops"}
CLOSE_HEAD = "## Read Daniel and Revelation again"
HINGE_START = "What Daniel was told to close"
HINT_WINDOW = 120  # characters before a short reference searched for its hint word


def words(text: str) -> str:
    """Words only, lower case: quotation marks, punctuation and dashes are ignored when a phrase is matched."""
    return " " + re.sub(r"[^a-z0-9]+", " ", fold(text).replace("'", "").lower()).strip() + " "


def phrase_in(phrase: str, text_words: str) -> bool:
    return words(phrase) != "  " and words(phrase) in text_words


def pieces(phrase: str) -> list:
    return [p for p in re.split(r"\.\.\.|…", phrase) if words(p).strip()]


def load_noted() -> dict:
    """The Berean's footnotes and headings by book code and "c:v", from the noted text the site reads."""
    noted: dict = {}
    for code in ("DAN", "REV"):
        book: dict = {}
        for path in sorted((NOTED / code).glob("*.json")):
            for chapter, body in json.loads(path.read_text(encoding="utf-8")).items():
                for verse in body["v"]:
                    notes = [run["f"] for run in verse["r"] if isinstance(run, dict) and "f" in run]
                    heads = [text for _, text in verse.get("h", [])]
                    book[f"{chapter}:{verse['n']}"] = {"notes": notes, "heads": heads}
        if not book:
            raise BuildError(f"no noted Berean text for {code} under {NOTED}")
        noted[code] = book
    return noted


class Held:
    """The held copies of outside sources, read once each and folded to words."""

    def __init__(self) -> None:
        self.cache: dict = {}

    def text(self, key: str) -> str:
        if key not in self.cache:
            spec = L.SOURCES_HELD[key]
            path = Path(spec["path"]).resolve()
            if not any(path == root.resolve() or path.is_relative_to(root.resolve()) for root in L.SOURCE_ROOTS):
                raise BuildError(f"held source {key!r} is outside the allowed source folders: {path}")
            raw = path.read_text(encoding="utf-8", errors="replace")
            if path.suffix in (".xml", ".html"):
                raw = html.unescape(re.sub(r"<[^<>]{0,400}>", " ", raw))
            raw = re.sub(r"\[\d+\]", " ", raw)                    # footnote markers inside a sentence
            raw = re.sub(r"(\w)-[ \t]*\r?\n\s*(\w)", r"\1\2", raw)  # a word broken at a line end
            self.cache[key] = words(raw)
        return self.cache[key]

    def check(self, phrase: str, key: str, where: str) -> None:
        for piece in pieces(phrase):
            if not phrase_in(piece, self.text(key)):
                raise BuildError(f"{where}: outside quotation {piece.strip()!r} is not in {L.SOURCES_HELD[key]['name']}")


class Builder:
    def __init__(self, bible: dict, noted: dict, held: Held) -> None:
        self.bible, self.noted, self.held = bible, noted, held
        self.passages: dict = {}
        self.used: dict = {"SHORT_REFS": set(), "OUTSIDE_QUOTES": set(), "BEREAN_NOTES": set(), "OWN_TERMS": set(), "PINNED_QUOTES": set()}

    def passage(self, label: str) -> str:
        label = label.replace("-", "–")
        _, verses = verses_of(self.bible, label)
        key = ref_id(label)
        self.passages[key] = {"label": label, "verses": [[f"{c}:{v}", text] for c, v, text in verses]}
        return key

    def verse_words(self, keys: list) -> list:
        return [words(" ".join(t for _, t in self.passages[k]["verses"])) for k in keys]

    def short_book(self, section: str, ref: str, before: str) -> str:
        entry = L.SHORT_REFS.get((section, ref))
        if entry is None:
            raise BuildError(f"part {section}: short reference {ref!r} has no book in SHORT_REFS")
        self.used["SHORT_REFS"].add((section, ref))
        if isinstance(entry, str):
            return entry
        found = {book for hint, book in entry.items() if hint in before[-HINT_WINDOW:]}
        if len(found) != 1:
            raise BuildError(f"part {section}: short reference {ref!r} needs exactly one hint word before it, found {sorted(found) or 'none'}")
        return found.pop()

    def chain(self, text: str, end: int, book: str, chapter: str, found: list) -> None:
        while (more := CONTINUE.match(text, end)):
            chapter = more.group(2) or chapter
            tail = f"–{more.group(4)}" if more.group(4) else ""
            found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
            end = more.end()

    def refs_in(self, text: str, section: str, before: str = "") -> list:
        """Every reference in plain text as (start, end, label): whole references and their continuations, whole
        chapters of the listed books, and short references whose book comes from SHORT_REFS."""
        found: list = []
        for match in REF_RE.finditer(text):
            found.append((match.start(), match.end(), match.group(0)))
            self.chain(text, match.end(), match.group(1), match.group(4) or match.group(2), found)
        taken = [(s, e) for s, e, _ in found]
        for match in CHAPTER.finditer(text):
            if any(s <= match.start() < e for s, e in taken):
                continue
            book, chapter = match.group(1), match.group(2)
            last = max(int(cv.split(":")[1]) for cv in self.bible[BOOKS[book]] if cv.split(":")[0] == chapter)
            found.append((match.start(), match.end(), f"{book} {chapter}:1–{last}"))
        taken = [(s, e) for s, e, _ in found]
        for match in SHORT.finditer(text):
            if any(s <= match.start() < e for s, e, _ in found):  # a chained continuation may already hold it
                continue
            book = self.short_book(section, match.group(0), before + text[:match.start()])
            found.append((match.start(), match.end(), f"{book} {match.group(0)}"))
            self.chain(text, match.end(), book, match.group(1), found)
        found.sort()
        for (_, end_a, a), (start_b, _, b) in zip(found, found[1:]):
            if start_b < end_a:
                raise BuildError(f"part {section}: references overlap: {a!r} and {b!r} in {text[:60]!r}")
        return found

    def runs(self, text: str, section: str) -> tuple:
        """Inline markup to runs: strings, {i}, {b}, {a,t}, {r,t}, {s,t}, {p,t}. Returns (runs, cited passage keys)."""
        out, cited, last = [], [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()], section, cited, text[:match.start()])
            link_text, url, bold, italic = match.groups()
            if url:
                if not url.startswith("/") or url.startswith("//"):
                    raise BuildError(f"only site links are allowed in the study text, found {url!r}")
                out.append({"a": url, "t": link_text})
            elif bold:
                out.append({"b": self.plain_runs(bold, section, cited, text[:match.start()])})
            elif italic in L.STUDY_TITLES:
                out.append({"s": L.STUDY_TITLES[italic], "t": italic})
            else:
                out.append({"i": italic})
            last = match.end()
        return out + self.plain_runs(text[last:], section, cited, text[:last]), cited

    def plain_runs(self, text: str, section: str, cited: list, before: str) -> list:
        spans = [(s, e, "r", label) for s, e, label in self.refs_in(text, section, before)]
        spans += [(m.start(), m.end(), "s", m.group(1)) for m in STUDY.finditer(text)]
        spans += [(m.start(), m.end(), "p", m.group(1)) for m in PART_LINK.finditer(text)]
        out, last = [], 0
        for start, end, kind, value in sorted(spans):
            if start < last:
                raise BuildError(f"part {section}: overlapping references near {text[start:end]!r}")
            out.append(text[last:start])
            if kind == "r":
                key = self.passage(value)
                cited.append(key)
                out.append({"r": key, "t": text[start:end]})
            elif kind == "s":
                if value not in L.STUDY_LINKS:
                    raise BuildError(f"part {section}: Study {value} is named but not in STUDY_LINKS")
                out.append({"s": L.STUDY_LINKS[value], "t": text[start:end]})
            else:
                out.append({"p": value, "t": text[start:end]})
            last = end
        out.append(text[last:])
        for piece in out:
            if isinstance(piece, str) and re.search(r"\d+:\d+", piece):
                raise BuildError(f"part {section}: a reference was left unlinked in {piece.strip()[:60]!r}")
        return [run for run in out if run != ""]

    def special(self, section: str, phrase: str, where: str) -> bool:
        """Quoted words that are an outside source, a Berean footnote or the study's own term. True if handled."""
        key = (section, phrase)
        if key in L.OUTSIDE_QUOTES:
            self.held.check(phrase, L.OUTSIDE_QUOTES[key], where)
            self.used["OUTSIDE_QUOTES"].add(key)
            return True
        if key in L.BEREAN_NOTES:
            label = L.BEREAN_NOTES[key]
            book, cv = label.rsplit(" ", 1)
            notes = words(" ".join(self.noted[BOOKS[book]][cv]["notes"]))
            if not phrase_in(phrase, notes):
                raise BuildError(f"{where}: {phrase!r} is not in the Berean's note at {label}")
            self.used["BEREAN_NOTES"].add(key)
            return True
        if key in L.PINNED_QUOTES:
            if not phrase_in(phrase, self.verse_words([self.passage(L.PINNED_QUOTES[key])])[0]):
                raise BuildError(f"{where}: quoted words {phrase!r} are not in {L.PINNED_QUOTES[key]}")
            self.used["PINNED_QUOTES"].add(key)
            return True
        if key in L.OWN_TERMS:
            code = BOOKS[L.OWN_TERMS[key]["absent_from"]]
            if any(phrase_in(phrase, words(t)) for t in self.bible[code].values()):
                raise BuildError(f"{where}: the study says {L.OWN_TERMS[key]['absent_from']} never says {phrase!r}, but it does")
            self.used["OWN_TERMS"].add(key)
            return True
        return False

    def check_quotes(self, raw: str, section: str, cited: list, nearby: list, where: str) -> None:
        """A quote with its own reference beside it must be in that reference. Otherwise it may be in a verse its
        paragraph cites, its part's main readings or the passage printed above it; under three words, it must have
        its own reference."""
        for match in QUOTE.finditer(raw):
            phrase = match.group(1)
            if self.special(section, phrase, where):
                continue
            rest = raw[match.end():]
            skip = CHAIN.match(rest).end()
            own_match = OWN_REF.match(rest[skip:])
            own_text = own_match and (own_match.group(1) or own_match.group(2))
            own = []
            if own_text:
                before = raw[:match.end() + skip]
                own = [self.passage(label) for _, _, label in self.refs_in(own_text, section, before)]
            if not own and len(words(phrase).split()) < 3:
                raise BuildError(f"{where}: short quote {phrase!r} has no reference beside it")
            targets = own or (cited + nearby)
            texts = self.verse_words(targets)
            for piece in pieces(phrase):
                if not any(phrase_in(piece, t) for t in texts):
                    labels = ", ".join(self.passages[k]["label"] for k in targets) or "none"
                    raise BuildError(f"{where}: quoted words {piece.strip()!r} are not in {labels}")

    def block(self, quote_lines: list, ref_line: str, where: str) -> dict:
        label = ref_line.strip().removesuffix(" · BSB").strip()
        if label == ref_line.strip():
            raise BuildError(f"{where}: block quotation must be followed by '<reference> · BSB', found {ref_line!r}")
        quoted = " ".join(line.removeprefix(">").strip() for line in quote_lines)
        key = self.passage(label)
        bible = fold(" ".join(t for _, t in self.passages[key]["verses"])).replace('"', "")
        page = fold(quoted).replace('"', "")
        # Whole verses, or whole sentences from the start of the verse; a part is marked as a part on the page.
        part = page != bible and bible.startswith(page) and page.endswith((".", "!", "?")) and bible[len(page):][:1] == " "
        if page != bible and not part:
            raise BuildError(f"{where}: block quotation is not word for word the Berean at {label}:\n  page: {quoted}\n  bible: {bible}")
        return {"k": "quote", "r": key, "label": label, "part": part, **({"text": quoted} if part else {})}

    def paragraph(self, raw: str, section: str, where: str, nearby: list) -> list:
        runs, cited = self.runs(typographic(raw), section)
        self.check_quotes(raw, section, cited, nearby, where)
        return runs


def parse(builder: Builder, text: str) -> dict:
    lines = text.splitlines()
    study: dict = {"intro": [], "questions": [], "parts": []}
    section, part, holder, readings, last_quote = "intro", None, study["intro"], [], None
    placed, i = 0, 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line:
            continue
        placed += 1
        where = f"content.md line {i}"
        nearby = readings + ([last_quote] if last_quote else [])
        para = lambda body: builder.paragraph(body, section, where, nearby)  # noqa: E731
        if line.startswith("# "):
            study["title"] = line[2:]
        elif m := re.fullmatch(r"\*\*(Study \d+ · .+)\*\*", line):
            study["byline"] = m.group(1)
        elif line.startswith(">"):
            quote = [line]
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i]); i += 1; placed += 1
            while i < len(lines) and not lines[i].strip():
                i += 1
            if i >= len(lines):
                raise BuildError(f"{where}: block quotation has no reference line after it")
            item = builder.block(quote, lines[i], where); i += 1; placed += 1
            holder.append(item)
            last_quote = item["r"]
        elif m := PART_HEAD.fullmatch(line):
            section, readings, last_quote = m.group(1), [], None
            part = {"n": section, "title": m.group(2), "hook": [], "subs": []}
            study["parts"].append(part)
            holder = part["hook"]
        elif line == CLOSE_HEAD:
            section, part, readings, last_quote = "close", None, [], None
            study["close"] = {"title": line[3:], "blocks": []}
            holder = study["close"]["blocks"]
        elif line.startswith("### ") and part is not None:
            sub = {"kind": SUBHEADS.get(line[4:], "views"), "title": line[4:], "blocks": []}
            part["subs"].append(sub)
            holder = sub["blocks"]
        elif (m := re.fullmatch(r"\*\*Main readings:\*\* (.+)", line)) and part is not None:
            body = m.group(1).rstrip(".")
            found = builder.refs_in(body, section)
            rest = body
            for start, end, _ in found:
                rest = rest[:start] + " " * (end - start) + rest[end:]
            if rest.replace(";", "").replace(",", "").strip():
                raise BuildError(f"{where}: main readings hold words that are not references: {rest.strip()!r}")
            readings = [builder.passage(label) for _, _, label in found]
            part["readings"] = [{"r": key, "t": body[start:end]} for key, (start, end, _) in zip(readings, found)]
        elif (m := re.fullmatch(r"\*\*(Consider|Reflect):\*\* (.+)", line)) and part is not None:
            part[m.group(1).lower()] = para(m.group(2))
        elif (m := re.fullmatch(r"\*\*Your question:\*\* (.+)", line)) and section == "close":
            study["close"]["question"] = para(m.group(1))
        elif line == "Read the passage again before you answer." and section == "close":
            study["close"]["again"] = line
        elif (m := re.fullmatch(r"(\d)\. \*\*([^*]+)\*\* (.+)", line)) and section == "intro":
            study["questions"].append({"q": m.group(2), "then": para(m.group(3))})
        elif line.startswith(HINGE_START) and section == "intro":
            hinge, _, lead = line.partition(". ")
            study["hinge"], study["lead"] = para(hinge + "."), para(lead)
        elif m := re.fullmatch(r"- \*\*([^*]+)\.\*\* (.+)", line):
            if not holder or holder[-1]["k"] != "views":
                holder.append({"k": "views", "items": []})
            holder[-1]["items"].append({"label": m.group(1), "runs": para(m.group(2))})
        elif m := re.fullmatch(r"- (.+)", line):
            if not holder or holder[-1]["k"] != "list":
                holder.append({"k": "list", "items": []})
            holder[-1]["items"].append(para(m.group(1)))
        elif line.startswith(("#", "* ", "|", "<")):
            raise BuildError(f"{where}: a line the page does not know how to place: {line[:60]!r}")
        else:
            holder.append({"k": "p", "runs": para(line)})
    total = sum(1 for line in lines if line.strip())
    if placed != total:
        raise BuildError(f"{total - placed} lines of content.md were not placed on the page")
    for key in ("title", "byline", "close", "hinge", "lead"):
        if key not in study:
            raise BuildError(f"content.md has no {key}")
    found = [b["k"] for b in study["intro"]]
    if found != ["p", "quote", "quote", "p"]:
        raise BuildError(f"the page places the opening as a paragraph, two quotations and a paragraph, but content.md has {found}")
    if [b["k"] for b in study["close"]["blocks"]] != ["p"] or "question" not in study["close"] or "again" not in study["close"]:
        raise BuildError("the close must be one paragraph, 'Your question' and 'Read the passage again before you answer.'")
    if len(study["questions"]) != 3:
        raise BuildError(f"the study should carry three questions into every vision, found {len(study['questions'])}")
    if len(study["parts"]) != 7:
        raise BuildError(f"the page draws seven seals, one per part, but content.md has {len(study['parts'])} parts")
    for part in study["parts"]:
        if not part["subs"] or part["subs"][0]["kind"] != "shows" or not all(k in part for k in ("readings", "consider", "reflect")):
            raise BuildError(f"part {part['n']} must have main readings, open with 'What the text shows', and end with Consider and Reflect")
    return study


class Drawn:
    """Checks for the phrases the page draws beside the text."""

    def __init__(self, builder: Builder, study: dict, text: str) -> None:
        self.b, self.study = builder, study
        self.part_text = {p.split(" ", 1)[0]: p for p in re.split(r"\n## ", text)[1:]}

    def verse(self, label: str) -> str:
        return self.b.verse_words([self.b.passage(label)])[0]

    def need(self, phrase: str, label: str, what: str) -> str:
        if not phrase_in(phrase, self.verse(label)):
            raise BuildError(f"{what}: {phrase!r} is not in {label}")
        return self.b.passage(label)

    def said(self, part: str, phrase: str, what: str) -> None:
        if phrase not in self.part_text[part]:
            raise BuildError(f"{what}: {phrase!r} is not in part {part}'s text")

    def apparatus(self, label: str) -> str:
        book, cv = label.rsplit(" ", 1)
        entry = self.b.noted[BOOKS[book]][cv]
        return " ".join(entry["notes"] + entry["heads"])


def chart(d: Drawn) -> dict:
    """Both books chapter by chapter: verses, and every verse whose Berean text holds each counted word."""
    bible = d.b.bible
    patterns = {name: re.compile(p, re.I) for name, p in L.CHART_WORDS.items()}
    books = []
    for name in ("Daniel", "Revelation"):
        code = BOOKS[name]
        chapters: dict = {}
        for cv, verse_text in bible[code].items():
            c, v = map(int, cv.split(":"))
            row = chapters.setdefault(c, {"c": c, "v": 0, **{w: [] for w in patterns}})
            row["v"] = max(row["v"], v)
            for word, pattern in patterns.items():
                if pattern.search(verse_text):
                    row[word].append(v)
                    d.b.passage(f"{name} {c}:{v}")
        rows = [chapters[c] for c in sorted(chapters)]
        for row in rows:
            for word in patterns:
                row[word].sort()
        books.append({"name": name, "code": code, "chapters": rows})
    marks = [{**m, "r": d.need(m["t"], m["ref"], f"chart mark {m['label']!r}")} for m in L.CHART_MARKS]
    return {"books": books, "marks": marks}


def facts(d: Drawn, drawn_chart: dict) -> dict:
    """The stated facts the page and the text rest on, each tested against the Berean."""
    dan, rev = drawn_chart["books"]
    first = lambda book, word: next((r["c"], r[word][0]) for r in book["chapters"] if r[word])  # noqa: E731
    if not ("Daniel 7" in d.apparatus("Revelation 13:1") and "Revelation 13" in d.apparatus("Daniel 7:1")):
        raise BuildError("the text says the Berean's headings pair Revelation 13 with Daniel 7; the headings do not")
    beasts_7 = next(r for r in dan["chapters"] if r["c"] == 7)
    if not (beasts_7["beast"][0] < 9 and 9 in beasts_7["throne"]):
        raise BuildError("part 05 says that in Daniel 7 the beasts come first and then the thrones (7:9)")
    throne_first, beast_first = first(rev, "throne"), first(rev, "beast")
    if not throne_first < (4, 1) < beast_first:
        raise BuildError(f"part 05 says Revelation opens heaven before it shows a beast: throne {throne_first}, beast {beast_first}")
    d.need("rising out of the sea", "Revelation 13:1", "part 05's beast from the sea")
    if 13 - 4 != 9:
        raise BuildError("part 05 says the beast rises nine chapters after the throne of chapter 4")
    if 42 * L.DAYS_IN_MONTH != 1260:
        raise BuildError("part 04 says 1,260 days is 42 months of 30 days")
    names = d.verse("Revelation 1:11")
    for church in L.CHURCHES:
        if not phrase_in(church["name"], names) or not phrase_in(church["name"], d.verse(church["opens"])):
            raise BuildError(f"{church['name']} should be in Revelation 1:11 and in {church['opens']}")
        if "overcome" not in d.verse(church["ref"]):
            raise BuildError(f"{church['ref']} should hold the promise to the one who overcomes")
    note = d.apparatus(L.ARAMAIC["note_ref"])
    if L.ARAMAIC["note_says"] not in note:
        raise BuildError(f"the Berean's note at {L.ARAMAIC['note_ref']} should say {L.ARAMAIC['note_says']!r}")
    span = verses_of(d.b.bible, f"Daniel {L.ARAMAIC['from']}–{L.ARAMAIC['to']}")[1]
    seven = sum(1 for t in d.b.bible["REV"].values() if re.search(r"\bseven\b", t, re.I))
    return {"aramaic": len(span), "throneFirst": f"{throne_first[0]}:{throne_first[1]}", "beastFirst": f"{beast_first[0]}:{beast_first[1]}",
            "revThrone": sum(len(r["throne"]) for r in rev["chapters"]), "revBeast": sum(len(r["beast"]) for r in rev["chapters"]),
            "sevenVerses": seven, "danVerses": len(d.b.bible["DAN"]), "revVerses": len(d.b.bible["REV"]),
            "danChapters": len(dan["chapters"]), "revChapters": len(rev["chapters"])}


def figures(d: Drawn) -> dict:
    out: dict = {"motto": {**L.MOTTO, "r": d.need(" ".join(L.MOTTO["lines"]), L.MOTTO["ref"], "motto")}}
    out["names"] = [{**n, "r": d.need(n["t"], n["ref"], "part 01's names")} for n in L.NAMES]
    out["halves"] = [{**h, "r": d.need(h["t"], h["ref"], "part 01's halves")} for h in L.HALVES]
    out["heardSeen"] = [{**p, "h": d.need(p["heard"], p["hr"], "heard"), "s": d.need(p["seen"], p["sr"], "seen")} for p in L.HEARD_SEEN]
    out["keyGlyphs"] = L.KEY_GLYPHS
    out["unexplained"] = [{**u, "r": d.need(u["t"], u["ref"], "unexplained")} for u in L.UNEXPLAINED]
    lists = [b for s in [{"blocks": d.study["parts"][1]["hook"]}, *d.study["parts"][1]["subs"]] for b in s["blocks"] if b["k"] == "list"]
    if len(lists) != 1 or len(lists[0]["items"]) != len(L.KEY_GLYPHS):
        raise BuildError(f"part 02's key draws {len(L.KEY_GLYPHS)} pictures; its list has {[len(x['items']) for x in lists]}")
    echoes = []
    for e in L.ECHOES:
        rr, orr = d.need(e["rev"], e["rr"], f"echo {e['name']!r}"), d.need(e["old"], e["or"], f"echo {e['name']!r}")
        found = next((label for label in e["look"] if e["names"] in d.apparatus(label)), None)
        how = "side" if found is None else ("heading" if e["names"] in " ".join(d.b.noted["REV"][found.rsplit(" ", 1)[1]]["heads"]) else "note")
        d.said("03", e["or"].rsplit(":", 1)[0].rsplit(" ", 1)[0], f"echo {e['name']!r}")
        echoes.append({**e, "r": rr, "o": orr, "how": how, "at": found})
    out["echoes"] = echoes
    for form in L.HALF_SEVEN:
        for label in form["refs"]:
            d.need(form["form"], label, "part 04's three and a half")
        d.said("04", form["form"], "part 04's three and a half")
    if [f["count"] for f in L.HALF_SEVEN[1:]] != [42, 42 * L.DAYS_IN_MONTH] or sum(L.HALF_SEVEN[0]["units"]) != 3.5:
        raise BuildError("part 04's three forms must be 3½ times, 42 months and 1,260 days")
    out["half"] = [{**f, "rs": [d.b.passage(r) for r in f["refs"]]} for f in L.HALF_SEVEN]
    w = L.WEEKS
    out["weeks"] = {**w, "r": d.need(w["t"], w["ref"], "seventy weeks"), "lr": d.need(w["last"], w["last_ref"], "seventy weeks"),
                    "cr": d.need(w["cut"], w["cut_ref"], "seventy weeks"), "readings": L.WEEK_READINGS}
    if sum(w["split"]) + 1 != 70:
        raise BuildError("the weeks drawn must add to seventy")
    for reading in L.WEEK_READINGS:
        d.said("04", reading["says"], "the weeks readings")
        d.said("04", reading["who"].split()[-1], "the weeks readings")
    out["statue"] = [{**s, "r": d.need(s["metal"], s["ref"], "statue"), "m": d.need(s["means"], s["mr"], "statue")} for s in L.STATUE]
    out["stone"] = {**L.STONE, "r": d.need(L.STONE["t"], L.STONE["ref"], "stone"), "m": d.need(L.STONE["means"], L.STONE["mr"], "stone")}
    for reading in L.EMPIRES:
        for name in filter(None, reading["names"]):
            d.said("05", name, "which empires")
    out["empires"] = L.EMPIRES
    out["given"] = [{**g, "r": d.need(g["t"], g["ref"], "what the beast was given")} for g in L.GIVEN]
    for way in L.FOUR_WAYS:
        for key in ("way", "beast", "holder"):
            d.said("06", way[key], "four ways")
    for phrase in L.SHARED:
        d.said("06", phrase, "what all four share")
    out["ways"], out["shared"] = L.FOUR_WAYS, L.SHARED
    out["patmos"] = {**L.PATMOS, "r": d.need("Patmos", L.PATMOS["ref"], "Patmos")}
    out["churches"] = [{**c, "r": d.need(c["promise"], c["ref"], f"{c['name']}'s promise")} for c in L.CHURCHES]
    for number, url in L.STUDY_LINKS.items():
        if url and not (WEBSITE / "design" / url.removeprefix("/mockups/") / "index.html").is_file():
            raise BuildError(f"Study {number} links to {url}, which has no index.html on this PC")
    return out


def build(text: str, bible: dict, noted: dict, held: Held) -> str:
    builder = Builder(bible, noted, held)
    study = parse(builder, text)
    drawn = Drawn(builder, study, text)
    the_chart = chart(drawn)
    counted = facts(drawn, the_chart)
    figs = figures(drawn)
    for table, used in builder.used.items():
        if unused := set(getattr(L, table)) - used:
            raise BuildError(f"{table} has entries the text no longer uses: {sorted(unused)}")
    quoted = {b["r"] for blocks in [study["intro"], *[s["blocks"] for p in study["parts"] for s in [{"blocks": p["hook"]}, *p["subs"]]]] for b in blocks if b["k"] == "quote"}
    numbers = {**counted, "parts": len(study["parts"]), "references": len(builder.passages),
               "versesShown": sum(len(builder.passages[k]["verses"]) for k in quoted), "outside": len(L.OUTSIDE_QUOTES)}
    inputs = [CONTENT, HERE / "study_lists.py", HERE / "build-data.py", HERE / "scripture_text.py"]
    prints = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in inputs}
    data = {"study": study, "passages": builder.passages, "chart": the_chart, **figs, "numbers": numbers, "title": L.TITLE,
            "concepts": L.CONCEPTS, "sources": L.SOURCES, "built_from": prints}
    return "// Built by build-data.py from the study's content.md. Do not edit by hand.\nwindow.RDR = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"


SELFTEST = [
    ("a changed word in a block quotation", "shut up these words and seal the book", "shut up these words and close the book", "not word for word"),
    ("a block quotation under the wrong reference", "Daniel 12:13 · BSB", "Daniel 12:12 · BSB", "not word for word"),
    ("a changed word in a quoted phrase", "a multitude too large to count", "a multitude too great to count", "not in"),
    ("a quote cited to the wrong verse", "(Daniel 7:17 · BSB)", "(Daniel 7:18 · BSB)", "not in"),
    ("a reference that does not exist", "(Mark 13:32 · BSB)", "(Mark 13:82 · BSB)", "does not resolve"),
    ("a short reference with no book in the table", "(17:14 · BSB)", "(17:15 · BSB)", "has no book"),
    ("a link that leaves the site", "Read the passage again before you answer.", "Read the [passage](https://example.com) again before you answer.\n\nRead the passage again before you answer.", "only site links"),
    ("a line the page cannot place", "## 01 What kind", "#### stray\n\n## 01 What kind", "does not know how to place"),
    ("a changed word in an outside quotation", "we are to avoid pressing details", "we are to avoid reading details", "not in"),
]
# Wrong entries in study_lists.py, patched in memory (a list index or a table key).
LIST_CASES = [
    ("a drawn phrase that is not in its verse", "GIVEN", 1, {"t": "The beast was given a crown", "ref": "Revelation 13:5"}, "not in"),
    ("a city whose letter is another church's", "CHURCHES", 2, {**L.CHURCHES[2], "opens": "Revelation 2:18"}, "should be in"),
    ("a reading the text does not name", "FOUR_WAYS", 0, {**L.FOUR_WAYS[0], "holder": "Hal Lindsey"}, "is not in part 06"),
    ("an outside quotation given to the wrong held source", "OUTSIDE_QUOTES", ("02", "we are to avoid pressing details"), "irenaeus", "outside quotation"),
    ("a footnote looked for at the wrong verse", "BEREAN_NOTES", ("06", "Or suddenly or quickly"), "Revelation 1:2", "note at"),
    ("a phrase said to be absent from a book that has it", "OWN_TERMS", ("03", "as it is written"), {"absent_from": "Mark"}, "never says"),
]


def selftest(text: str, bible: dict, noted: dict, held: Held) -> int:
    build(text, bible, noted, held)  # the real text must build, or every refusal below proves nothing
    failures = 0

    def attempt(name: str, expected: str, run) -> None:
        nonlocal failures
        try:
            run()
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
        attempt(name, expected, lambda: build(text.replace(old, new, 1), bible, noted, held))
    for name, table, index, value, expected in LIST_CASES:
        saved = getattr(L, table)[index]
        getattr(L, table)[index] = value
        try:
            attempt(name, expected, lambda: build(text, bible, noted, held))
        finally:
            getattr(L, table)[index] = saved
    total = len(SELFTEST) + len(LIST_CASES)
    print(f"selftest: {total - failures} of {total} wrong inputs refused as expected; nothing written")
    return 1 if failures else 0


def main() -> int:
    try:
        text = CONTENT.read_text(encoding="utf-8")
        bible, noted, held = load_bible(), load_noted(), Held()
        if "--selftest" in sys.argv:
            return selftest(text, bible, noted, held)
        output = build(text, bible, noted, held)
    except BuildError as error:
        print(f"build-data: FAILED: {error}", file=sys.stderr)
        return 1
    except (OSError, ValueError, KeyError) as error:
        print(f"build-data: could not read an input: {type(error).__name__}: {error}", file=sys.stderr)
        return 2
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_bytes() != output.encode("utf-8"):
            print("build-data: stale: data.js does not match content.md; run without --check", file=sys.stderr)
            return 1
        print("build-data: all checks pass; data.js is current")
        return 0
    try:
        temp = OUT.with_suffix(".js.tmp")
        temp.write_bytes(output.encode("utf-8"))
        os.replace(temp, OUT)
    except OSError as error:
        print(f"build-data: could not write {OUT}: {error}", file=sys.stderr)
        return 2
    print(f"build-data: all checks pass; wrote {OUT.name} ({len(output):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
