"""USFM -> the site's JSON shape. One stream of markers and text, never line by line.

Output for one book:
  {"code": "DAN", "chapters": [{"c": "2", "t": [runs]?, "v": [{"n": "34", "h": [[kind, text]]?, "r": [runs]}]}]}

A run is one of:
  "plain text"
  [text, flags, strong?]   flags: j words of Jesus, a added by translators, n divine name (small caps),
                           s selah, i italic, b bold, c small caps, u superscript
  {"f": "footnote text"}   at its exact place in the verse
  {"b": "p" | "q1" | "q2" | "q3" | "l1" | "l2" | "b"}   a paragraph, poetry line, list line or stanza break
"""

import re
import unicodedata

TOKEN = re.compile(r"\\(\+?[a-z]+[0-9]*)(\*?)")
STRONG_OK = re.compile(r"^[HG]\d{1,5}[a-z]?$")

BREAKS = {
    "p": "p", "m": "p", "nb": "p", "pmo": "p", "mi": "p", "pc": "p", "pi1": "p", "pi": "p", "tr": "p",
    "q1": "q1", "q": "q1", "qr": "q1", "qc": "q1", "q2": "q2", "q3": "q3",
    "li1": "l1", "li": "l1", "li2": "l2", "b": "b",
}
HEADINGS = {"s1": "s", "s": "s", "s2": "s2", "ms1": "ms", "ms": "ms", "ms2": "ms", "mr": "r", "sp": "sp",
            "r": "r", "qa": "qa"}
IGNORED_TEXT = {"id", "ide", "h", "toc1", "toc2", "toc3", "mt1", "mt2", "mt3", "mt4", "mt", "imt1", "ip", "im",
                "ib", "is1", "is2", "ili", "ili1", "cl", "cp", "rem", "sts", "usfm"}
CELLS = {"tc1", "tc2", "tc3", "tc4", "th1", "th2", "th3"}
CHAR_FLAGS = {"wj": "j", "add": "a", "nd": "n", "qs": "s", "it": "i", "bdit": "i", "tl": "i", "bk": "i",
              "em": "i", "sls": "i", "bd": "b", "sc": "c", "sup": "u"}
PLAIN_CHARS = {"w", "k", "pn", "qt", "ord", "no", "wh", "png", "addpn", "wg", "wa", "dc", "fig", "jmp", "rb"}
NOTE_PARTS = {"fr", "fk", "fq", "fqa", "fl", "ft", "fv", "fp", "fw", "fdc", "fm", "xo", "xt", "xq", "xta", "xk", "xdc"}


class UsfmError(ValueError):
    pass


def normalise_strongs(raw: str) -> str | None:
    numbers = []
    for token in re.split(r"[\s,]+", raw.strip()):
        match = re.match(r"^([HG])0*(\d{1,5}[a-z]?)$", token)
        if match and STRONG_OK.match(match.group(1) + match.group(2)):
            numbers.append(match.group(1) + match.group(2))
    return " ".join(numbers) or None


class _Book:
    """Parser state for one book. Kept small: each handler does one thing."""

    def __init__(self, source_name: str, keep_strongs: bool, warnings: list[str]):
        self.source_name = source_name
        self.keep_strongs = keep_strongs
        self.warnings = warnings
        self.code: str | None = None
        self.chapters: list[dict] = []
        self.verse: dict | None = None
        self.mode = "ignore"          # ignore | verse | title | heading | vp
        self.heading: list | None = None  # [kind, text]
        self.pending_breaks: list[str] = []
        self.pending_headings: list[list[str]] = []
        self.stack: list[dict] = []   # open character styles
        self.note: dict | None = None  # {"kind": "f"|"x", "part": str, "text": [], "first": bool}

    # ---------- helpers ----------
    def warn(self, message: str) -> None:
        self.warnings.append(f"{self.source_name}: {message}")

    def chapter(self) -> dict:
        if not self.chapters:
            raise UsfmError(f"{self.source_name}: text or verse before the first \\c")
        return self.chapters[-1]

    def target_runs(self) -> list | None:
        if self.mode == "verse" and self.verse is not None:
            return self.verse["r"]
        if self.mode == "title":
            return self.chapter().setdefault("t", [])
        return None

    def flags(self) -> str:
        return "".join(sorted({CHAR_FLAGS[f["name"]] for f in self.stack if f["name"] in CHAR_FLAGS}))

    def close_heading(self) -> None:
        if self.heading is not None:
            text = _squash(self.heading[1])
            if text:
                self.pending_headings.append([self.heading[0], text])
        self.heading = None
        if self.mode == "heading":
            self.mode = "ignore"

    def flush_pending_into_verse(self) -> None:
        if self.verse is None:
            return
        for kind in self.pending_breaks:
            self.verse["r"].append({"b": kind})
        self.pending_breaks = []

    # ---------- text ----------
    def text(self, text: str) -> None:
        if not text:
            return
        if self.note is not None:
            if self.note["first"]:
                text = re.sub(r"^\s*\S\s?", "", text, count=1)  # the caller character, e.g. "+"
                self.note["first"] = False
            if self.note["part"] != "fr":
                self.note["text"].append(text)
            return
        if self.mode == "vp":
            return
        if self.mode == "heading":
            self.heading[1] += text
            return
        frame = self.stack[-1] if self.stack else None
        if frame is not None and frame["name"] == "w":
            if frame["in_attrs"]:
                frame["attrs"] += text
                return
            if "|" in text:
                text, attrs = text.split("|", 1)
                frame["in_attrs"] = True
                frame["attrs"] += attrs
        if self.mode == "ignore":
            if text.strip() and self.chapters:
                if self.verse is None:
                    self.mode = "title"  # loose text before verse 1 (rare): keep it as the chapter's title
                else:
                    self.mode = "verse"
            else:
                return
        runs = self.target_runs()
        if runs is None:
            return
        if self.mode == "verse" and text.strip():
            self.flush_pending_into_verse()
        runs.append([text, self.flags(), None])

    # ---------- markers ----------
    def marker(self, name: str, closing: bool, rest: str) -> str:
        """Handle one marker; return the text that follows it (with any consumed argument removed)."""
        bare = name.lstrip("+")
        if closing:
            self.close_char(bare)
            return rest
        if self.note is not None and bare in NOTE_PARTS:
            self.note["part"] = bare
            return _drop_delimiter(rest)
        if bare in ("f", "fe", "x", "ef", "ex"):
            self.note = {"kind": bare[-1], "part": "ft", "text": [], "first": True}
            return _drop_delimiter(rest)
        if self.note is not None and bare in CHAR_FLAGS.keys() | PLAIN_CHARS:
            return _drop_delimiter(rest)  # styling inside a note: keep only the words
        if bare == "c":
            return self.start_chapter(rest)
        if bare == "v":
            return self.start_verse(rest)
        if bare == "vp":
            self.mode, self.vp_return = "vp", self.mode
            return _drop_delimiter(rest)
        if bare in BREAKS:
            self.close_heading()
            self.stack = []
            self.pending_breaks.append(BREAKS[bare])
            if self.verse is not None and self.mode in ("ignore", "title", "verse"):
                self.mode = "verse"
            return _drop_delimiter(rest)
        if bare == "d":
            self.close_heading()
            if self.chapters and not self.chapter()["v"]:
                self.mode = "title"
            else:
                self.mode, self.heading = "heading", ["d", ""]
            return _drop_delimiter(rest)
        if bare in HEADINGS:
            self.close_heading()
            self.mode, self.heading = "heading", [HEADINGS[bare], ""]
            return _drop_delimiter(rest)
        if bare in IGNORED_TEXT:
            self.close_heading()
            if bare == "id":
                self.code = rest.split()[0] if rest.split() else None
            self.mode = "ignore"
            return ""
        if bare in CELLS:
            self.text(" ")
            return _drop_delimiter(rest)
        if bare in CHAR_FLAGS or bare in PLAIN_CHARS:
            self.stack.append({"name": bare, "attrs": "", "in_attrs": False, "start": self.run_count()})
            return _drop_delimiter(rest)
        raise UsfmError(f"{self.source_name}: unknown marker \\{name}")

    def run_count(self) -> int:
        runs = self.target_runs()
        return len(runs) if runs is not None else 0

    def close_char(self, bare: str) -> None:
        if bare in ("f", "fe", "x", "ef", "ex"):
            if self.note is not None:
                text = _squash(re.sub(r'\|[^\s|]*="[^"]*"(\s+[\w-]+="[^"]*")*', "", "".join(self.note["text"])))
                if self.note["kind"] == "f" and text:
                    runs = self.target_runs()
                    if runs is not None and self.mode in ("verse", "title"):
                        runs.append({"f": text})
                self.note = None
            return
        if self.note is not None:
            return  # \fk* etc. inside a note
        if bare == "vp":
            self.mode = getattr(self, "vp_return", "verse")
            return
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["name"] == bare:
                frame = self.stack[index]
                del self.stack[index:]
                if bare == "w" and self.keep_strongs:
                    self.apply_strongs(frame)
                return
        if bare not in CHAR_FLAGS and bare not in PLAIN_CHARS:
            self.warn(f"closing \\{bare}* with no opening marker")

    def apply_strongs(self, frame: dict) -> None:
        match = re.search(r'strong="([^"]+)"', frame["attrs"])
        if not match:
            return
        number = normalise_strongs(match.group(1))
        runs = self.target_runs()
        if number is None or runs is None:
            return
        for run in runs[frame["start"]:]:
            if isinstance(run, list) and run[0].strip():
                run[2] = number

    def start_chapter(self, rest: str) -> str:
        self.close_heading()
        label, remainder = _take_label(rest)
        if not label:
            raise UsfmError(f"{self.source_name}: \\c without a chapter number")
        self.chapters.append({"c": label, "v": []})
        self.verse, self.mode, self.stack = None, "ignore", []
        self.pending_breaks, self.pending_headings = [], []
        return remainder

    def start_verse(self, rest: str) -> str:
        self.close_heading()
        label, remainder = _take_label(rest)
        if not label:
            raise UsfmError(f"{self.source_name}: \\v without a verse label")
        verse = {"n": label, "r": []}
        if self.pending_headings:
            verse["h"] = self.pending_headings
        self.chapter()["v"].append(verse)
        self.verse, self.mode, self.pending_headings = verse, "verse", []
        self.flush_pending_into_verse()
        return remainder.lstrip()


def _take_label(rest: str) -> tuple[str, str]:
    match = re.match(r"\s*(\S+)\s?", rest)
    if not match:
        return "", rest
    return match.group(1), rest[match.end():]


def _drop_delimiter(rest: str) -> str:
    return rest[1:] if rest[:1] in (" ", "\n", "\r", "\t") else rest


def _squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _finish_runs(runs: list) -> list:
    """Merge neighbours with equal style, collapse whitespace, trim the ends, compact plain runs."""
    merged: list = []
    for run in runs:
        if isinstance(run, list):
            text = re.sub(r"\s+", " ", run[0])
            if not text.strip(" ") and merged and isinstance(merged[-1], list):
                merged[-1][0] += text  # a bare space needs no style of its own: glue it to the word before
                continue
            if merged and isinstance(merged[-1], list) and merged[-1][1:] == run[1:]:
                merged[-1][0] += text
            else:
                merged.append([text, run[1], run[2]])
        else:
            merged.append(run)
    for run in merged:
        if isinstance(run, list):
            run[0] = re.sub(r" {2,}", " ", run[0])
    for index, run in enumerate(merged):
        if isinstance(run, list) and index > 0:
            previous = next((r for r in reversed(merged[:index]) if isinstance(r, list)), None)
            if previous is not None and previous[0].endswith(" ") and run[0].startswith(" "):
                run[0] = run[0].lstrip(" ")
    text_runs = [r for r in merged if isinstance(r, list)]
    if text_runs:
        text_runs[0][0] = text_runs[0][0].lstrip()
        text_runs[-1][0] = text_runs[-1][0].rstrip()
    while merged and isinstance(merged[-1], dict) and "b" in merged[-1]:
        merged.pop()  # a break at the very end of a verse belongs to the next one; drop the leftover
    out: list = []
    for run in merged:
        if isinstance(run, list):
            if not run[0]:
                continue
            if not run[1] and not run[2]:
                out.append(run[0])
            else:
                out.append([run[0], run[1]] + ([run[2]] if run[2] else []))
        else:
            out.append(run)
    return out


def parse_book(text: str, source_name: str, keep_strongs: bool, warnings: list[str]) -> dict:
    """Parse one USFM book file into the site's JSON shape. Raises UsfmError on anything unknown."""
    text = unicodedata.normalize("NFC", text.lstrip("\ufeff"))
    book = _Book(source_name, keep_strongs, warnings)
    position, pending_text = 0, ""
    for match in TOKEN.finditer(text):
        book.text(pending_text + text[position:match.start()])
        rest_end = _next_marker(text, match.end())
        rest = book.marker(match.group(1), match.group(2) == "*", text[match.end():rest_end])
        pending_text, position = rest, rest_end
    book.text(pending_text + text[position:])
    book.close_heading()
    if not book.code:
        raise UsfmError(f"{source_name}: no \\id line")
    for chapter in book.chapters:
        if "t" in chapter:
            chapter["t"] = _finish_runs(chapter["t"])
            if not chapter["t"]:
                del chapter["t"]
        for verse in chapter["v"]:
            verse["r"] = _finish_runs(verse["r"])
    return {"code": book.code, "chapters": book.chapters}


def _next_marker(text: str, start: int) -> int:
    found = text.find("\\", start)
    return len(text) if found == -1 else found


def plain_text(runs: list) -> str:
    """A verse's words only: no notes, no breaks."""
    parts = [run if isinstance(run, str) else run[0] for run in runs if isinstance(run, (str, list))]
    return re.sub(r"\s+", " ", "".join(parts)).strip()
