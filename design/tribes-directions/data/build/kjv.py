"""Shared helpers: the site's KJV (plain), places, people, verse ids, KJV number words."""
import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

SITE = Path("D:/FortressOfSolitude/Jarvis/Projects/BibleProject/Website")
DATA = SITE / "data"

_catalog = json.loads((DATA / "catalog.json").read_text(encoding="utf-8"))
BOOK_NUM = {b["code"]: b["num"] for b in _catalog["books"]}
BOOK_NAME = {b["num"]: b["name"] for b in _catalog["books"]}
BOOK_CODE = {b["num"]: b["code"] for b in _catalog["books"]}

_cache = {}


def book(code):
    if code not in _cache:
        raw = json.loads((DATA / "plain" / "kjv" / f"{code}.json").read_text(encoding="utf-8"))
        _cache[code] = {int(k.split(":")[0]) * 1000 + int(k.split(":")[1]): clean(v) for k, v in raw.items()}
    return _cache[code]


def clean(text):
    return re.sub(r"\s+", " ", text.replace("\u00b6", "")).strip()


def vid(code, chapter, verse):
    return BOOK_NUM[code] * 1_000_000 + chapter * 1000 + verse


def ref(r):
    """'NUM 1:21' or 'NUM 1:21-23' or 'GEN 29:31-30:24' -> [first, last]."""
    code, rest = r.split(" ")
    if "-" in rest:
        a, b = rest.split("-")
    else:
        a = b = rest
    ca, va = map(int, a.split(":"))
    if ":" in b:
        cb, vb = map(int, b.split(":"))
    else:
        cb, vb = ca, int(b)
    return [vid(code, ca, va), vid(code, cb, vb)]


def verse(v):
    code = BOOK_CODE[v // 1_000_000]
    return book(code).get(v % 1_000_000)


def verses_in(span):
    """All existing verse ids in [first, last] (same book)."""
    a, b = span
    code = BOOK_CODE[a // 1_000_000]
    assert a // 1_000_000 == b // 1_000_000, f"span crosses books: {span}"
    return [book(code) and (a // 1_000_000) * 1_000_000 + k for k in sorted(book(code)) if a % 1_000_000 <= k <= b % 1_000_000]


def span_text(span):
    return " ".join(verse(v) for v in verses_in(span))


def label(span):
    a, b = span
    bk = BOOK_NAME[a // 1_000_000]
    ca, va = (a % 1_000_000) // 1000, a % 1000
    cb, vb = (b % 1_000_000) // 1000, b % 1000
    if a == b:
        return f"{bk} {ca}:{va}"
    if ca == cb:
        return f"{bk} {ca}:{va}\u2013{vb}"
    return f"{bk} {ca}:{va}\u2013{cb}:{vb}"


UNITS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
         "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
         "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
         "seventy": 70, "eighty": 80, "ninety": 90, "threescore": 60, "fourscore": 80, "score": 20}
NUM_WORDS = set(UNITS) | {"hundred", "thousand", "and"}


def kjv_numbers(text):
    """Every number written in KJV words in the text, e.g. 'forty and six thousand and five hundred' -> 46500."""
    words = re.findall(r"[A-Za-z]+", text.lower())
    words = ["one" if w in ("a", "an") and i + 1 < len(words) and words[i + 1] in ("hundred", "thousand") else w
             for i, w in enumerate(words)]
    out, run = [], []
    for w in words + ["."]:
        if w in NUM_WORDS:
            run.append(w)
        else:
            while run and run[-1] == "and":
                run.pop()
            while run and run[0] == "and":
                run.pop(0)
            if run:
                out.append(words_to_int(run))
            run = []
    return out


def words_to_int(ws):
    total, current = 0, 0
    for w in ws:
        if w == "and":
            continue
        if w == "hundred":
            current = (current or 1) * 100
        elif w == "thousand":
            total += (current or 1) * 1000
            current = 0
        else:
            current += UNITS[w]
    return total + current


def norm(s):
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    return re.sub(r"\s+", " ", s).strip()


def quote_ok(text, span):
    """Every '…'-separated piece of the quote occurs, in order, in the span's text (word for word)."""
    hay = norm(span_text(span))
    pos = 0
    for piece in [p.strip(" ,;:.") for p in text.split("\u2026")]:
        if not piece:
            continue
        i = norm(hay).find(norm(piece), pos)
        if i < 0:
            return False
        pos = i + len(norm(piece))
    return True


def load_places():
    return json.loads((DATA / "places.json").read_text(encoding="utf-8"))


def load_people():
    out = {}
    for f in (DATA / "study" / "people").glob("*.json"):
        out[f.stem] = json.loads(f.read_text(encoding="utf-8"))
    return out


def load_people_index():
    return {p["id"]: p for p in json.loads((DATA / "study" / "people.json").read_text(encoding="utf-8"))}
