"""Turning the study's prose into page runs for the Prayer across Scripture mock-up, and checking every quotation in it.

A quoted phrase is found in the reference given for it (in brackets straight after it, or else any reference in its sentence),
and nowhere else. Only a sentence with no reference may quote from its section's readings, and each such binding is logged.
Otherwise it must be a Baptist Faith and Message phrase found in its article, a phrase from the held source its paragraph
names, or one of the study's own listed terms. This proves the words are there; it does not prove a reading is right."""
import re
from pathlib import Path

import study_lists as L
from scripture_text import BOOKS, REF_RE, BuildError, fold, has_words, held_paragraphs, ref_id, typographic, verses_of

PROJECT = Path(__file__).resolve().parents[3]
LIBRARY = PROJECT / "sources/library"
CCEL, BULK, CREEDS = LIBRARY / "source-ccel", LIBRARY / "bulk/ccel", PROJECT / "Website/data/creeds/doc"
# A quotation must fall inside one paragraph of the named file. These are whole files; the source notes say what was read.
HELD = {
    "calvin-eph": CCEL / "asset-ready-text-edition-l06-calvin-41/calcom41.xml",
    "calvin-tim": CCEL / "asset-ready-text-edition-l06-calvin-43/calcom43.xml",
    "calvin-cor": CCEL / "asset-ready-text-edition-l06-calvin-40/calcom40.xml",
    "wesley": BULK / "wesley_notes.xml",
    "boyce": BULK / "boyce_theology.xml",
    "lbc": CREEDS / "1689-london-baptist-confession-1677.b1.json",
    "trent": CREEDS / "council-of-trent-canons-and-decrees-1563.b2.json",
}
MIN_SOURCE_QUOTE_WORDS = 3
MAX_OWN_TERM_WORDS = 5
SOURCE_IDS = {source["id"] for source in L.SOURCES}
INLINE = re.compile(r"\*\*([^*]+)\*\*|\*([^*]+)\*")
CHECK_NOTE = re.compile(r"\[check(?: before publishing)?(?:: ([^\]]*))?\]")
SOURCE_MARK = re.compile(r"\[source:([a-z0-9-]+)\] ")
CONTINUE = re.compile(r"(; |, )(?:(\d+):)?(\d+)(?:–(\d+))?(?![\d:])(?! [A-Z])")  # not the "2" of "2 Thessalonians"
CHAPTER_RE = re.compile(r"\b(" + "|".join(sorted(map(re.escape, BOOKS), key=len, reverse=True)) + r") (\d+)(?![\d:–-])")
FORBIDDEN = ("](", "://", "<", ">", "javascript:", "data:", "“", "”", "…", "...")
SENTENCE_END = re.compile(r"(?:(?<=[.!?])|(?<=[.!?]\"))\s+(?!\()")
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"]


def words(text: str) -> str:
    """Lower-case letters only, one space between: quotes, apostrophes and punctuation do not count."""
    return " ".join(re.findall(r"[a-z]+", text.lower().replace("’", "").replace("'", "")))


def bfm_articles(path: Path) -> dict:
    """Article number → its words, from the held Baptist Faith and Message, whose articles start a line "X. Title"."""
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError as error:
        raise BuildError(f"could not read the held Baptist Faith and Message at {path}: {error}") from error
    start = raw.find("\nI. The Scriptures")
    if start < 0:
        raise BuildError(f"held Baptist Faith and Message at {path}: could not find where article I begins")
    parts = re.split(r"\n(?=(?:" + "|".join(ROMAN) + r")\. [A-Z])", raw[start:])
    articles = {part.strip().split(".", 1)[0]: words(part) for part in parts if part.strip().split(".", 1)[0] in ROMAN}
    if len(articles) < 17:
        raise BuildError(f"held Baptist Faith and Message: found {len(articles)} articles, expected at least 17")
    return articles


def mask_quotes(text: str) -> str:
    """The same text with every quotation's inside blanked, so its full stops do not end a sentence."""
    return re.sub(r'"[^"]*"', lambda m: '"' + "x" * (len(m.group(0)) - 2) + '"', text)


class Builder:
    def __init__(self, bible: dict) -> None:
        self.bible = bible
        self.passages: dict = {}
        self.held = {key: held_paragraphs(path, None, None) for key, path in HELD.items()}
        self.bfm = bfm_articles(PROJECT / L.BFM_HELD)
        self.used = {"absent": set(), "own": set(), "bfm": set(), "misquotes": set(), "links": set(), "named": set(), "italics": set()}
        self.fallbacks: list = []
        self.checks: list = []

    def passage(self, label: str) -> str:
        """A verse reference or a whole chapter ("Exodus 16"). Returns its key; fails if it is not in the Berean."""
        label = label.replace("-", "–").strip()
        chapter = re.fullmatch(r"(.+) (\d+)", label)
        if chapter and chapter.group(1) in BOOKS:
            code, number = BOOKS[chapter.group(1)], int(chapter.group(2))
            found = sorted((tuple(map(int, k.split(":"))), t) for k, t in self.bible[code].items() if int(k.split(":")[0]) == number)
            if not found:
                raise BuildError(f"chapter does not exist in the Berean: {label}")
            key, verses = f"{code}.{number}", [(c, v, t) for (c, v), t in found]
        else:
            code, verses = verses_of(self.bible, label)
            key = ref_id(label)
        self.passages.setdefault(key, {"label": label, "code": code, "chapters": sorted({c for c, _, _ in verses}),
                                       "verses": [{"c": c, "v": v, "t": t} for c, v, t in verses]})
        return key

    def text_of(self, key: str) -> str:
        return fold(" ".join(v["t"] for v in self.passages[key]["verses"])).replace('"', "")

    def refs_in(self, text: str) -> list:
        """Every reference with its span: verses, short continuations ("6:12, 14–15", "4:3; 5:18") and whole chapters."""
        found = []
        for match in REF_RE.finditer(text):
            book, chapter, end = match.group(1), match.group(2), match.end()
            found.append((match.start(), end, match.group(0)))
            while (more := CONTINUE.match(text, end)):
                chapter = more.group(2) or chapter
                tail = f"–{more.group(4)}" if more.group(4) else ""
                found.append((more.start() + len(more.group(1)), more.end(), f"{book} {chapter}:{more.group(3)}{tail}"))
                end = more.end()
        for match in CHAPTER_RE.finditer(text):
            if not any(s <= match.start() < e for s, e, _ in found):
                found.append((match.start(), match.end(), match.group(0)))
        found.sort()
        bare = text
        for start, end, _ in reversed(found):
            bare = bare[:start] + " " * (end - start) + bare[end:]
        if re.search(r"\b\d+:\d+", bare):
            raise BuildError(f"a chapter and verse was not recognised as a reference: {text[:90]}")
        return found

    def runs(self, text: str, section: str, scope: list) -> list:
        """Prose to runs: strings, {r,t} verse links, {s,t} named studies, {i}, {b}, {c} notes still to check, {src} a source label.
        `scope` is the keys of the readings a sentence with no reference may quote."""
        for bad in FORBIDDEN:
            if bad in text:
                raise BuildError(f"{section}: {bad!r} is not allowed in the study text (links come only from references and listed studies): {text[:80]}")
        if text.count('"') % 2:
            raise BuildError(f"{section}: unbalanced quotation marks: {text[:90]}")
        for phrase, (article, reading) in L.BFM_MISQUOTES.items():
            text = text.replace(f'"{phrase}"', f'"{phrase}"[check: the held Baptist Faith and Message, article {article}, reads {reading}]')
        for phrase, (ref, reading) in L.SCRIPTURE_MISQUOTES.items():
            text = text.replace(f'"{phrase}"', f'"{phrase}"[check: the Berean at {ref} reads {reading}]')
        out, last, source = [], 0, None
        for match in SOURCE_MARK.finditer(text):
            out += self.segment(text[last:match.start()], section, scope, source)
            source = match.group(1)
            if source not in SOURCE_IDS:
                raise BuildError(f"{section}: unknown source {source!r}")
            out.append({"src": source})
            last = match.end()
        return out + self.segment(text[last:], section, scope, source)

    def segment(self, text: str, section: str, scope: list, source: str | None) -> list:
        if text.count('"') % 2:
            raise BuildError(f"{section}: a quotation runs across a source label: {text[:90]}")
        for note in CHECK_NOTE.finditer(text):
            if '"' in note.group(0):
                raise BuildError(f"{section}: a quotation inside a note still to check would not be checked: {note.group(0)[:60]}")
        self.check_quotes(CHECK_NOTE.sub(lambda m: " " * len(m.group(0)), text), section, scope, source)
        out, last = [], 0
        for match in CHECK_NOTE.finditer(text):
            out += self.markup(text[last:match.start()], section)
            note = (match.group(1) or "").strip() or "before publishing"
            self.checks.append((section, note))
            out.append({"c": note})
            last = match.end()
        return out + self.markup(text[last:], section)

    def markup(self, text: str, section: str) -> list:
        out, last = [], 0
        for match in INLINE.finditer(text):
            out += self.plain(text[last:match.start()])
            bold, italic = match.groups()
            if bold:
                out.append({"b": typographic(bold)})
            elif italic in L.STUDY_LINKS:
                self.used["links"].add(italic)
                out.append({"s": f"/mockups/{L.STUDY_LINKS[italic]}-directions/", "t": typographic(italic)})
            elif italic in L.NAMED_STUDIES:
                self.used["named"].add(italic)
                out.append({"n": typographic(italic)})
            elif italic in L.ITALIC_TERMS:
                self.used["italics"].add(italic)
                out.append({"i": typographic(italic)})
            else:
                raise BuildError(f"{section}: italic {italic!r} is not a listed study, named study or term")
            last = match.end()
        return out + self.plain(text[last:])

    def plain(self, text: str) -> list:
        out, last = [], 0
        for start, end, label in self.refs_in(text):
            if start > last:
                out.append(typographic(text[last:start]))
            out.append({"r": self.passage(label), "t": text[start:end]})
            last = end
        if last < len(text):
            out.append(typographic(text[last:]))
        # A phone number such as 800 911 2000 must not break across lines; only the spaces between its digits change.
        return [re.sub(r"(?<=\d) (?=\d)", chr(160), run) if isinstance(run, str) else run for run in out if run != ""]

    def found_in(self, phrase: str, keys: list) -> list:
        """The keys whose Berean text holds the phrase as whole words. Its first letter may change case; nothing else may."""
        folded = fold(phrase).strip(" ,.;:!?")
        variants = {folded, folded[:1].swapcase() + folded[1:]}
        return [k for k in keys if any(has_words(v, self.text_of(k)) for v in variants)]

    def check_quotes(self, text: str, section: str, scope: list, source: str | None) -> None:
        masked = mask_quotes(text)
        bounds = [0] + [m.end() for m in SENTENCE_END.finditer(masked)] + [len(text)]
        for match in re.finditer(r'"([^"]+)"', text):
            phrase = match.group(1)
            plain = phrase.rstrip(".,;:!?")
            if (section, plain) in L.ABSENT_WORDS:
                ref = L.ABSENT_WORDS[(section, plain)]
                if re.search(r"(?<!\w)" + re.escape(plain) + r"(?!\w)", self.text_of(self.passage(ref))):
                    raise BuildError(f"{section}: the study says {plain!r} is not in {ref}, but it is")
                self.used["absent"].add((section, plain))
                continue
            if plain in L.BFM_QUOTES:
                article = L.BFM_QUOTES[plain]
                if f" {words(plain)} " not in f" {self.bfm.get(article, '')} ":
                    raise BuildError(f"{section}: {plain!r} is not in article {article} of the held Baptist Faith and Message")
                self.used["bfm"].add(plain)
                continue
            if plain in L.BFM_MISQUOTES:
                article, reading = L.BFM_MISQUOTES[plain]
                body = f" {self.bfm.get(article, '')} "
                if f" {words(plain)} " in body or f" {words(reading)} " not in body:
                    raise BuildError(f"{section}: BFM_MISQUOTES entry for {plain!r} no longer matches article {article} of the held copy")
                self.used["misquotes"].add(plain)
                continue
            if plain in L.SCRIPTURE_MISQUOTES:
                ref, reading = L.SCRIPTURE_MISQUOTES[plain]
                key = self.passage(ref)
                if self.found_in(plain, [key]) or not self.found_in(reading, [key]):
                    raise BuildError(f"{section}: SCRIPTURE_MISQUOTES entry for {plain!r} no longer matches {ref}")
                self.used["misquotes"].add(plain)
                continue
            after = re.match(r"\s*\(([^)]*)\)", text[match.end():])
            own = [self.passage(label) for _, _, label in self.refs_in(after.group(1))] if after else []
            if not own:
                start = max(b for b in bounds if b <= match.start())
                end = min(b for b in bounds if b >= match.end())
                sentence = mask_quotes(text[start:end])
                own = [self.passage(label) for _, _, label in self.refs_in(sentence)]
            if own and self.found_in(phrase, own):
                continue
            if not own and (hits := self.found_in(phrase, scope)):
                self.fallbacks.append((section, phrase, self.passages[hits[0]]["label"]))
                continue
            if source and self.in_held(phrase, source, section):
                continue
            if not own and (section, plain) in L.OWN_TERMS:
                if len(plain.split()) > MAX_OWN_TERM_WORDS:
                    raise BuildError(f"{section}: own term {plain!r} is over {MAX_OWN_TERM_WORDS} words")
                self.used["own"].add((section, plain))
                continue
            where = ", ".join(self.passages[k]["label"] for k in own) if own else "this section's readings"
            raise BuildError(f"{section}: quoted words {phrase!r} are not in {where}, and are not a listed source or term")

    def in_held(self, phrase: str, source: str, section: str) -> bool:
        if source not in HELD:
            raise BuildError(f"{section}: {source} is told in the site's words only, but its paragraph quotes {phrase!r}")
        folded = fold(phrase).strip(" ,.;:!?")
        if len(folded.split()) < MIN_SOURCE_QUOTE_WORDS:
            raise BuildError(f"{section}: quote from {source} is under {MIN_SOURCE_QUOTE_WORDS} words: {phrase!r}")
        variants = {folded, folded[:1].swapcase() + folded[1:]}
        if not any(has_words(v, paragraph) for v in variants for paragraph in self.held[source]):
            raise BuildError(f"{section}: quote not found in one paragraph of {source}: {phrase!r}")
        return True

    def block_quote(self, quote: str, ref_line: str) -> dict:
        label, _, version = ref_line.strip().partition(" · ")
        if version != "BSB":
            raise BuildError(f"block quote not followed by '<reference> · BSB': {quote[:50]}")
        key = self.passage(label)
        if fold(quote).replace('"', "") != self.text_of(key):
            raise BuildError(f"block quote is not word for word the whole Berean text of {label}: {quote[:60]}")
        return {"k": "quote", "t": quote, "r": key, "label": label}

    def unused(self) -> list:
        """List entries the study no longer uses, so none can sit unchecked."""
        stale = [f"own term {k}" for k in set(L.OWN_TERMS) - self.used["own"]]
        stale += [f"absent word {k}" for k in set(L.ABSENT_WORDS) - self.used["absent"]]
        stale += [f"confession phrase {k!r}" for k in set(L.BFM_QUOTES) - self.used["bfm"]]
        stale += [f"misquote {k!r}" for k in (set(L.BFM_MISQUOTES) | set(L.SCRIPTURE_MISQUOTES)) - self.used["misquotes"]]
        stale += [f"study link {k!r}" for k in set(L.STUDY_LINKS) - self.used["links"]]
        stale += [f"named study {k!r}" for k in L.NAMED_STUDIES - self.used["named"]]
        stale += [f"italic term {k!r}" for k in L.ITALIC_TERMS - self.used["italics"]]
        return stale
