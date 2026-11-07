"""content.md into the study's data for the Who do you say that I am mock-up, checking every quotation as it goes.

Every non-blank line must be placed by a rule here, or the build fails. A quotation must be in the reference its own sentence gives. With no reference in its
sentence it must be in the block quotation above it in the same part, or the question's own passage, or on one of the closed lists in study_lists.py.
"""
import re

from scripture_text import REF_RE, BuildError, fold, has_words, plain_text, ref_id, typographic, verses_of
import study_lists as L

KING_JAMES = re.compile(r"\b(?:thee|thou|thy|thine|unto|saith|hath|ye)\b", re.I)
SENTENCE_BREAK = re.compile(r"[.!?][\"']?\s+[\"A-Z(\[*]")
CHECK_NOTE = re.compile(r"\s*\[check: ([^\]]*)\]")
INLINE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
BARE_REF = re.compile(r"(?<![\w:–-])(\d+):(\d+)(?:–(\d+))?(?![\d:])")
MORE_VERSE = re.compile(r"(, | and )(\d+)(?![\d:])")
ARTICLE_AFTER = re.compile(r"\s*\(Article (\d+)(?:, ([^)]+))?\)")
TAG = re.compile(r"\[(read|care|open|source)(?::([a-z]+))?\] (.+)")
TOP_KEYS = {"Concepts", "Motto", "Lead", "Habit", "Stance", "Selection", "Words"}
CLOSE_KEYS = {"Close", "Way", "Invite", "Question", "Again"}
FORBIDDEN_START = re.compile(r"[-*+] |\*\*[^*]+:\*\*|\d+\. ")


def has_phrase(phrase: str, text: str) -> bool:
    """A quotation may change the case of its first letter to start or continue a sentence. Nothing else may differ."""
    return has_words(phrase, text) or has_words(phrase[0].swapcase() + phrase[1:], text)


def clean(text: str) -> str:
    """Compare without double quotes, and without single ones: a speech inside a quotation is single on the page and double in the verse."""
    return fold(text).replace('"', "").replace("'", "")


class Text:
    """Turns the study's prose into runs, and holds what the checks found, for the build to cross-check."""

    def __init__(self, bible: dict, held: dict) -> None:
        self.bible, self.held = bible, held
        self.passages: dict = {}
        self.notes: list = []  # (note, line source tag, quote checks that passed in a held text, known issue)
        self.used: set = set()  # list entries that a quotation used
        self.issues_seen: set = set()
        self.partial: list = []  # block quotations that give a whole-sentence part of their reference

    def passage(self, label: str) -> str:
        identity = ref_id(label)
        if identity not in self.passages:
            code, verses = verses_of(self.bible, label)
            self.passages[identity] = {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}), "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]}
        return identity

    def refs_in(self, text: str) -> list:
        """(start, end, label) for each reference, with short continuations ("7:18, 27") and bare ones ("(5:33)") taking the book of the reference before them."""
        found = []
        for match in REF_RE.finditer(text):
            found.append((match.start(), match.end(), match.group(0)))
            end = match.end()
            while more := MORE_VERSE.match(text, end):
                found.append((more.start(2), more.end(), f"{match.group(1)} {match.group(4) or match.group(2)}:{more.group(2)}"))
                end = more.end()
        taken = [(start, end) for start, end, _ in found]
        for bare in BARE_REF.finditer(text):
            if any(start <= bare.start() < end for start, end in taken):
                continue
            before = [item for item in found if item[1] <= bare.start()]
            if not before:
                raise BuildError(f"a chapter and verse has no book before it: {text[:90]}")
            book = REF_RE.match(max(before)[2]).group(1)
            tail = f"–{bare.group(3)}" if bare.group(3) else ""
            found.append((bare.start(), bare.end(), f"{book} {bare.group(1)}:{bare.group(2)}{tail}"))
        return sorted(found)

    def runs(self, raw: str, source: str | None = None, last_quote: str | None = None, where: str = "") -> list:
        """Check one line of prose and split it into runs: strings, {r,t} verses, {a,t} site links, {s,t} other studies, {i} italic, {b} bold."""
        notes = CHECK_NOTE.findall(raw)
        text = CHECK_NOTE.sub("", raw)
        if "[check" in text:
            raise BuildError(f"{where}: a check note this build cannot read: {raw[:90]}")
        if "“" in text or "”" in text:
            raise BuildError(f"{where}: curly double quote in prose would slip past the quotation checks: {text[:90]}")
        if KING_JAMES.search(re.sub(r'"[^"]*"', "", text)):
            raise BuildError(f"{where}: older wording in the site's own voice: {text[:90]}")
        if text.count('"') % 2:
            raise BuildError(f"{where}: unbalanced quotation marks: {text[:90]}")
        for title in re.findall(r"Read more in \*([^*]+)\*", text):
            if title not in L.STUDY_LINKS:
                raise BuildError(f"{where}: a study named for further reading is not on the study link list: {title!r}")
        plain = INLINE.sub(lambda m: m.group(1) or m.group(3) or m.group(4), text)
        passed = []
        for quoted in re.finditer(r'"([^"]+)"', plain):
            passed.append(self.check_quoted(quoted, plain, source, last_quote, where))
        self.notes += [(note, source, [kind for kind in passed if kind == "held"], self.issues_seen.copy()) for note in notes]
        return self.split(text)

    def split(self, text: str) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain_runs(text[last:match.start()])
            link_text, url, bold, italic = match.groups()
            if url is not None:
                if url not in L.SITE_LINKS:
                    raise BuildError(f"a link in content.md is not on the site link list: {url!r}")
                out.append({"a": url, "t": typographic(link_text)})
            elif bold is not None:
                out.append({"b": typographic(bold)})
            elif italic in L.STUDY_LINKS:
                out.append({"s": L.STUDY_LINKS[italic], "t": typographic(italic)})
            else:
                out.append({"i": typographic(italic)})
            last = match.end()
        return out + self.plain_runs(text[last:])

    def plain_runs(self, text: str) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
            if start > last:
                out.append(typographic(text[last:start]))
            out.append({"r": self.passage(label), "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        return [run for run in out if run != ""]

    def citing(self, quoted: re.Match, text: str) -> tuple:
        """The reference after the quotation in its own sentence cites it; with none, the one before it in its own sentence. Returns (refs, sentence has a ref)."""
        refs = self.refs_in(text)
        breaks = [m.start() + 1 for m in SENTENCE_BREAK.finditer(text) if not quoted.start() < m.start() + 1 < quoted.end()]
        start = max([0] + [b for b in breaks if b <= quoted.start()])
        stop = min([len(text)] + [b for b in breaks if b >= quoted.end()])
        in_sentence = [item for item in refs if start <= item[0] < stop]
        following = [label for s, _, label in in_sentence if s >= quoted.end()]
        preceding = [label for s, _, label in in_sentence if s < quoted.start()]
        return (following[:1] or preceding[-1:]), bool(in_sentence), text[start:stop]

    def check_quoted(self, quoted: re.Match, text: str, source: str | None, last_quote: str | None, where: str) -> str:
        phrase = quoted.group(1)
        if phrase in L.ABSENT_MENTIONS or phrase in L.GLOSSES:
            self.used.add(phrase)
            return "list"
        if phrase in L.QUOTED_CONFESSION:
            number, name = L.QUOTED_CONFESSION[phrase]
            after = ARTICLE_AFTER.match(text[quoted.end():])
            if not after or after.group(1) != number or (after.group(2) or None) != name:
                raise BuildError(f"{where}: confession phrase is not cited to its own article {number}, {name}: {phrase!r}")
            self.used.add(phrase)
            return "confession"
        refs, has_ref, sentence = self.citing(quoted, text)
        if phrase in L.OUTSIDE_QUOTES:
            key, name = L.OUTSIDE_QUOTES[phrase]
            if name not in sentence or not any(has_phrase(clean(phrase), clean(p)) for p in self.held[key]):
                raise BuildError(f"{where}: outside quotation is not in one paragraph of {key}, or its sentence does not name {name}: {phrase!r}")
            self.used.add(phrase)
            return "held"
        if source:
            self.check_held(source, phrase, sentence, where)
            return "held"
        if phrase in L.IMPLIED:
            refs = [L.IMPLIED[phrase]]
            self.used.add(phrase)
        elif phrase in L.MENTIONS:
            refs = [L.MENTIONS[phrase]]
            self.used.add(phrase)
        elif not has_ref:
            refs = [last_quote] if last_quote else []
        pieces = [piece.strip(" ,.") for piece in phrase.split("…") if piece.strip(" ,.")]
        for label in refs:
            verse_text = clean(plain_text(self.bible, label))
            if all(has_phrase(clean(piece), verse_text) for piece in pieces) and self.in_order(pieces, verse_text):
                return "scripture"
        raise BuildError(f"{where}: quoted words are not in the reference that cites them {refs!r}: {phrase!r}")

    @staticmethod
    def in_order(pieces: list, text: str) -> bool:
        place = 0
        for piece in pieces:
            found = text.find(clean(piece), place) if text.find(clean(piece), place) >= 0 else text.find(clean(piece[0].swapcase() + piece[1:]), place)
            if found < 0:
                return False
            place = found + len(piece)
        return True

    def check_held(self, source: str, phrase: str, sentence: str, where: str) -> None:
        """A commentary or creed quotation: in one paragraph of its own source, under its heading, in the note of the place it is said to be on."""
        if source not in self.held:
            raise BuildError(f"{where}: unknown source {source!r}")
        place = L.SOURCE_PLACES.get(phrase)
        if place is None:
            raise BuildError(f"{where}: commentary quotation has no entry for its place: {phrase!r}")
        folded = clean(phrase)
        index = next((i for i, paragraph in enumerate(self.held[source]) if has_phrase(folded, clean(paragraph))), None)
        if index is None:
            raise BuildError(f"{where}: quotation not found in one paragraph of {source}: {phrase!r}")
        self.used.add(phrase)
        if place["anchor"] is None:
            return
        before = " ".join(self.held[source][max(0, index - 400):index + 1])[-20000:]
        if fold(place["anchor"]) not in fold(before):
            raise BuildError(f"{where}: {source} quotation is not under its heading {place['anchor']!r}: {phrase!r}")
        if place["place"] is not None and self.held_place(source, index) != place["place"]:
            raise BuildError(f"{where}: {source} quotation is in the note on {self.held_place(source, index)}, the list says {place['place']}: {phrase!r}")
        if place["named"] is not None:
            words, chapter = place["named"]
            if words not in sentence:
                raise BuildError(f"{where}: the text no longer says {words!r} of this quotation: {phrase!r}")
            if chapter != place["place"][0]:
                if place.get("issue") not in L.KNOWN_ISSUES:
                    raise BuildError(f"{where}: the text puts this {source} quotation {words}, and the held note is on chapter {place['place'][0]}: {phrase!r}")
                self.issues_seen.add(place["issue"])
            elif place.get("issue"):
                raise BuildError(f"{where}: KNOWN_ISSUES entry {place['issue']} is no longer true; remove it")

    def held_place(self, source: str, index: int) -> tuple:
        """The chapter and verse of the note a paragraph sits in: the last CHAPTER heading before it, and the last paragraph that opens with a verse number."""
        chapter = verse = None
        for paragraph in reversed(self.held[source][:index + 1]):
            head = paragraph.strip()
            if (m := re.search(r"- Chapter (\d+) - Verse (\d+)$", head)):
                return int(m.group(1)), int(m.group(2))
            if verse is None and (m := re.match(r"(?:Verse )?(\d+)\. ", head)):
                verse = int(m.group(1))
            if m := re.match(r"(?:[A-Z]+ )?CHAPTER (\d+)\b", head):
                chapter = int(m.group(1))
                break
        return chapter, verse


def block_quote(text: Text, lines: list, index: int, quote: str) -> tuple:
    """A block quotation is one '> ' line, then '<reference> · BSB', and must be the whole Berean text of that reference."""
    ref_at = next((j for j in range(index, len(lines)) if lines[j].strip()), None)
    if ref_at is None:
        raise BuildError(f"block quotation at the end of the file has no reference: {quote[:50]}")
    label, _, version = lines[ref_at].strip().partition(" · ")
    if version != "BSB" or not REF_RE.fullmatch(label):
        raise BuildError(f"block quotation not followed by '<reference> · BSB': {quote[:50]}")
    whole, given = clean(plain_text(text.bible, label)), clean(quote)
    # The whole passage, or the end of it from a sentence start (or from the start of a speech), or the start of it up to a sentence end: word for word, with nothing left out in the middle.
    partial = given != whole and ((whole.endswith(given) and re.search(r"[.!?]['\"]? $" if not quote.startswith("“") else r"[.!?,:]['\"]? $", whole[:len(whole) - len(given)])) or (whole.startswith(given) and re.search(r"[.!?]['\"]?$", given)))
    if given != whole and not partial:
        raise BuildError(f"block quotation is not the whole Berean text of {label}, nor a whole-sentence start or end of it: {quote[:60]}")
    if partial:
        text.partial.append(label)
    return {"k": "quote", "t": typographic(quote), "r": text.passage(label), "label": label}, ref_at + 1


def heading(study: dict, line: str) -> tuple:
    """Open the section a level-two heading names. Returns (zone, the dict that receives its keys)."""
    numbered = re.fullmatch(r"## (\d\d) (.+)", line)
    question = re.fullmatch(r"## Question ([a-z]+): (.+)", line)
    closing = re.fullmatch(r"## Close: (.+)", line)
    if numbered:
        expected = L.READINGS[len(study["readings"])] if len(study["readings"]) < len(L.READINGS) else None
        if not expected or (numbered.group(1), numbered.group(2)) != expected[:2]:
            raise BuildError(f"reading heading is not the expected one in order, {expected}: {line}")
        holder = {"n": expected[0], "slug": expected[2], "title": typographic(expected[1]), "intro": [], "parts": []}
        study["readings"].append(holder)
        return "reading", holder
    if question:
        holder = {"id": question.group(1), "title": typographic(question.group(2)), "blocks": []}
        study["questions"].append(holder)
        return "question", holder
    if closing:
        study["closing"] = typographic(closing.group(1))
        return "close", study
    raise BuildError(f"heading not recognised: {line}")


def put(holder: dict, key: str, value: object) -> None:
    if key in holder:
        raise BuildError(f"the key {key} is given twice in one section")
    holder[key] = value


def keyed(text: Text, zone: str, holder: dict, part: dict | None, line: str, where: str) -> bool:
    """The lines that carry a key. Returns False if the line has none."""
    bold = re.fullmatch(r"\*\*(Main readings|Consider|Reflect):\*\* (.+)", line)
    key, sep, value = line.partition(": ")
    if zone == "reading" and bold:
        name, body = bold.groups()
        if name == "Main readings":
            put(holder, "read", [{"r": text.passage(item.strip()), "t": item.strip()} for item in body.split(";")])
        else:
            put(holder, name.lower(), text.runs(body, where=where))
    elif zone == "reading" and part is None and sep and key == "Hook":
        put(holder, "hook", text.runs(value, where=where))
    elif zone == "question" and sep and key == "Text" and "text" not in holder:
        put(holder, "text", text.passage(value))
    elif zone == "close" and sep and key == "Passage":
        put(holder, "passage", text.passage(value))
    elif zone == "close" and sep and key in CLOSE_KEYS:
        put(holder, key.lower(), text.runs(value, where=where))
    elif zone == "top" and sep and key in TOP_KEYS:
        if key in ("Concepts", "Motto"):
            put(holder, key.lower(), [typographic(item) for item in value.split(" · " if key == "Concepts" else " / ")])
        else:
            put(holder, key.lower(), text.runs(value, where=where))
            holder.setdefault("raw", {})[key.lower()] = value
    else:
        return False
    return True


def tagged(text: Text, line: str, last_quote: str | None, where: str) -> dict:
    tag = TAG.fullmatch(line)
    if not tag:
        raise BuildError(f"{where}: unknown paragraph tag: {line[:60]}")
    kind, source, body = tag.groups()
    if (kind == "source") != bool(source):
        raise BuildError(f"{where}: only [source:...] takes a source: {line[:60]}")
    if source and source not in {item["id"] for item in L.SOURCES}:
        raise BuildError(f"{where}: source {source!r} is not on the source list")
    return {"k": kind, "src": source, "runs": text.runs(body, source, last_quote, where)}


def parse(text: Text, content: str) -> dict:
    """content.md into the study. Every non-blank line must be placed by a rule here, or the build fails."""
    lines = content.split("\n")
    study = {"readings": [], "questions": [], "titles": []}
    zone, holder, part, index, last_quote = "top", study, None, 0, None
    while index < len(lines):
        line = lines[index].strip()
        index += 1
        where = f"content.md line {index}"
        if not line:
            continue
        target = holder["blocks"] if zone == "question" else (part["blocks"] if part is not None else holder.get("intro"))
        if line.startswith("# "):
            title, _, subtitle = line[2:].partition("? ")
            put(study, "title", typographic(title + "?"))
            put(study, "subtitle", typographic(subtitle))
        elif line.startswith("## "):
            zone, holder = heading(study, line)
            part, last_quote = None, None
        elif line.startswith("### "):
            if zone != "reading":
                raise BuildError(f"{where}: a part outside a reading: {line}")
            part, last_quote = {"title": typographic(line[4:]), "blocks": []}, None
            holder["parts"].append(part)
        elif line.startswith("> "):
            block, index = block_quote(text, lines, index, line[2:])
            last_quote = block["label"]
            if zone == "top" and "opening" not in study:
                study["opening"] = block
            elif zone in ("reading", "question") and target is not None:
                target.append(block)
            else:
                raise BuildError(f"{where}: a block quotation with nowhere to go: {line[:60]}")
        elif keyed(text, zone, holder, part, line, where):
            pass
        elif line.startswith("- ") and zone == "top" and "words" in study.get("raw", {}):
            study["titles"].append(text.runs(line[2:], where=where))
        elif line.startswith("- ") and target is not None:
            if not target or target[-1]["k"] != "list":
                target.append({"k": "list", "items": []})
            target[-1]["items"].append(text.runs(line[2:], None, last_quote, where))
        elif TAG.match(line) or line.startswith("["):
            if target is None:
                raise BuildError(f"{where}: a tagged paragraph outside a part or question: {line[:60]}")
            extra = text.passages[holder["text"]]["label"] if zone == "question" and "text" in holder else None
            target.append(tagged(text, line, last_quote or extra, where))
        elif FORBIDDEN_START.match(line):
            raise BuildError(f"{where}: a line this page does not know how to place: {line[:60]}")
        elif target is not None:
            extra = text.passages[holder["text"]]["label"] if zone == "question" and "text" in holder else None
            target.append({"k": "p", "runs": text.runs(line, None, last_quote or extra, where)})
        else:
            raise BuildError(f"{where}: a line that belongs to nothing, or a key this section does not allow: {line[:70]}")
    return study
