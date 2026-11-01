"""Data files hold verse ids, never verse wording: the site looks the words up in the reader's Bible (src/lib/verses.ts).

The builders call these as their last step, so a rebuild cannot bring copied wording back; running this file applies
the same steps to the data already built:  py -3.12 scripts/bible/verse_wording.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

WEBSITE = Path(__file__).resolve().parents[2]
EDGE = "“”‘’\"' ,;:.!?—"


def _bare(word: str) -> str:
    return word.strip(EDGE)


def word_cut(words: str, text: str) -> tuple[list[list[int]], bool]:
    """Where a short quotation stands in its verse, as [first word, word count] runs, so that a page can cut the same
    words from the Berean Standard Bible at show time without the file holding them."""
    tokens = [_bare(token) for token in text.split()]
    more = words.endswith("…")
    runs: list[list[int]] = []
    start = 0
    for part in re.split(r"\s*…\s*", words):
        wanted = [_bare(token) for token in part.split() if _bare(token)]
        if not wanted:
            continue
        at = next((i for i in range(start, len(tokens) - len(wanted) + 1) if tokens[i:i + len(wanted)] == wanted), None)
        if at is None:
            raise ValueError(f"word_cut: {part!r} is not in its verse {text!r}")
        runs.append([at, len(wanted)])
        start = at + len(wanted)
    return runs, more


def strip_passage(passage: dict) -> None:
    for verse in passage.get("verses") or []:
        verse.pop("text", None)


def strip_echo(echo: dict) -> None:
    words = echo.pop("words", None)
    if words:
        text = " ".join(verse.get("text", "") for verse in echo["verses"])
        runs, more = word_cut(words, text)
        echo["cut"] = runs
        if more:
            echo["cutMore"] = True
    strip_passage(echo)


def strip_hymn(hymn: dict) -> dict:
    """A hymn page or song, as written: its passages keep book, chapter and verse numbers only."""
    heading = hymn.get("heading")
    if heading and heading.get("passage"):
        strip_passage(heading["passage"])
    main = hymn.get("mainPassage")
    if main and main.get("passage"):
        strip_passage(main["passage"])
    for echo in hymn.get("echoes") or []:
        strip_echo(echo)
    for book in hymn.get("placed") or []:
        for ref in book.get("refs") or []:
            strip_passage(ref)
    return hymn


def strip_topic(topic: dict) -> dict:
    for verse in topic.get("keyVerses") or []:
        verse.pop("text", None)
    return topic


def _catalog_codes() -> dict[int, str]:
    catalog = json.loads((WEBSITE / "data" / "catalog.json").read_text(encoding="utf-8"))
    return {book["num"]: book["code"] for book in catalog["books"]}


_CODES: dict[int, str] = {}
_PLAIN: dict[tuple[str, str], dict] = {}
_WORD = re.compile(r"[^\W_]+")
QUOTE_BIBLES = ("kjv", "bsb", "web", "asv")


def _plain(slug: str, code: str) -> dict:
    key = (slug, code)
    if key not in _PLAIN:
        path = WEBSITE / "data" / "plain" / slug / f"{code}.json"
        _PLAIN[key] = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    return _PLAIN[key]


def _words(text: str) -> list[str]:
    return _WORD.findall(text.lower().replace("’", "").replace("'", ""))


def passage_words(first: int, last: int, slug: str) -> str:
    """The words of a span in one Bible, as one lower-case string, for checking a quotation before removing it."""
    if not _CODES:
        _CODES.update(_catalog_codes())
    code = _CODES.get(first // 1_000_000)
    if not code:
        return ""
    out: list[str] = []
    for key, text in _plain(slug, code).items():
        chapter, _, verse = key.partition(":")
        number = re.match(r"\d+", verse)
        if chapter.isdigit() and number:
            at = first // 1_000_000 * 1_000_000 + int(chapter) * 1000 + int(number.group())
            if first <= at <= (last or first):
                out.append(text)
    return " " + " ".join(_words(" ".join(out))) + " "


def is_quotation(text: str, first: int, last: int) -> bool:
    """Does this text stand, word for word, inside the span in one of the Bibles the site's pages have quoted?"""
    parts = [" " + " ".join(_words(part)) + " " for part in re.split(r"…|\.\.\.", text) if _words(part)]
    return bool(parts) and any(all(part in passage_words(first, last, slug) for part in parts) for slug in QUOTE_BIBLES)


# A whole text that is one quotation, with at most its reference after it.
ONLY_QUOTATION = re.compile(r"""^["“]([^"“”]+)["”][.,;]?(?: \([^()]*\))?\.?$""")
LONGEST_QUOTED_CLAIM = 3


def only_quotes(text: str, span: list[int]) -> bool:
    found = ONLY_QUOTATION.match(text)
    return bool(found) and span[1] - span[0] < LONGEST_QUOTED_CLAIM and is_quotation(found.group(1), span[0], span[1])


class Left:
    """What strip_quoted kept, so a run can say so."""
    kept: list[str] = []


def strip_quoted(node: object, where: str = "") -> None:
    """Every `{ text, span | ref }` whose text is that span's Scripture becomes `{ span | ref, quoted: true }`. A claim
    (`layer`, `refs`, `cites`) is the site's own sentence and stays; so does anything that fails the word-for-word check."""
    if isinstance(node, list):
        for item in node:
            strip_quoted(item, where)
    elif isinstance(node, dict):
        span = node.get("span") or node.get("ref")
        if isinstance(node.get("text"), str) and isinstance(span, list) and len(span) == 2 and all(isinstance(n, int) for n in span) \
                and not {"layer", "refs", "cites", "claim"} & node.keys():
            if is_quotation(node["text"], span[0], span[1]):
                del node["text"]
                node["quoted"] = True
            else:
                Left.kept.append(f"{where}: {span} {node['text'][:70]}")
        refs = node.get("refs")
        if isinstance(node.get("text"), str) and not span and isinstance(refs, list):
            quoted = next((ref for ref in refs if only_quotes(node["text"], ref)), None)
            if quoted:
                del node["text"]
                node["span"] = quoted
                node["quoted"] = True
                node["marks"] = True
        for key, value in node.items():
            strip_quoted(value, where)


def strip_verse_table(data: dict, key: str) -> None:
    """A table verse id -> words becomes the list of its ids."""
    if isinstance(data.get(key), dict):
        data[key] = sorted(data[key])


def strip_apostle(page: dict) -> dict:
    strip_verse_table(page, "verses")
    for account in page.get("accounts") or []:
        for column in account.get("cols") or []:
            for verse in column.get("verses") or []:
                if verse.pop("text", None) is not None:
                    verse["quoted"] = True
    landing = page.get("landing") or {}
    for key in ("line", "also"):
        if isinstance(landing.get(key), dict):
            landing[key].pop("t", None)
    strip_quoted(page, page.get("id", ""))
    return page


def strip_ruled_quotes(node: object) -> None:
    """Who-ruled statements: a quotation with a span is that span; a psalm's title has no verse number and stays."""
    if isinstance(node, list):
        for item in node:
            strip_ruled_quotes(item)
    elif isinstance(node, dict):
        if "quote" in node and node.get("span"):
            del node["quote"]
        for value in node.values():
            strip_ruled_quotes(value)


def strip_study_verses(data: dict) -> dict:
    """A study's table: verses[label] keeps book, chapter and verse. Its own samples keep their numbers the same way."""
    for verse in (data.get("verses") or {}).values():
        if isinstance(verse, dict):
            verse.pop("text", None)
    return data


def strip_home(home: dict) -> dict:
    """The landing's verses, each with its span."""
    for verse in [*(home.get("hero") or {}).values(), home.get("thesis") or {}, *(home.get("movements") or [])]:
        if verse.pop("text", None) is not None:
            verse["quoted"] = True
    return home


def _rewrite(path: Path, change) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    change(data)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")


def _strip_built_data() -> None:
    data = WEBSITE / "data"
    for path in sorted((data / "hymns" / "pages").glob("*.json")):
        if path.name != "index.json":
            _rewrite(path, lambda bundle: [strip_hymn(page) for page in bundle.values()])
    for path in sorted((data / "hymns" / "songs").glob("*.json")):
        _rewrite(path, strip_hymn)
    for path in sorted((data / "topics" / "t").glob("*.json")):
        _rewrite(path, lambda bundle: [strip_topic(topic) for topic in bundle.values()])
    _rewrite(data / "study" / "home.json", strip_home)
    for path in sorted((data / "creeds" / "doc").glob("*.json")):
        _rewrite(path, lambda document: document.pop("verses", None))


def _rewrite_source(path: Path, change) -> None:
    """A file kept in git: its own layout (indented or not) stays, so the diff shows only what left."""
    raw = path.read_text(encoding="utf-8")
    newline = "\r\n" if b"\r\n" in path.read_bytes() else "\n"
    data = json.loads(raw)
    change(data)
    indent = 2 if raw[:3] in ('{\n ', '[\n ') else None
    text = json.dumps(data, ensure_ascii=False, indent=indent, separators=None if indent else (",", ":"))
    path.write_text(text + ("\n" if raw.endswith("\n") else ""), encoding="utf-8", newline=newline)


def _book_chapter_verse(reference: str, names: dict[str, int]) -> tuple[int, int, int] | None:
    match = re.match(r"^(.+?) (\d+):(\d+)", reference)
    if not match or match.group(1) not in names:
        return None
    return names[match.group(1)], int(match.group(2)), int(match.group(3))


def _strip_faith_names(data: dict, names: dict[str, int]) -> None:
    for entry in data.get("entries") or []:
        for passage in entry.get("passages") or []:
            found = re.match(r"^(.+?) (\d+)(?::|$)", passage["reference"])
            book = names.get(found.group(1)) if found else None
            if not book:
                raise ValueError(f"faith names: cannot read the reference {passage['reference']!r}")
            for verse in passage.get("verses") or []:
                verse["id"] = book * 1_000_000 + int(found.group(2)) * 1000 + int(verse["number"])
                verse.pop("text", None)
    joshua = data.get("joshua")
    if joshua:
        for verse in joshua.get("verses") or []:
            verse["id"] = names["Joshua"] * 1_000_000 + 1000 + int(verse["number"])
            verse.pop("text", None)


def _strip_learning(data: dict, names: dict[str, int]) -> None:
    for item in data.get("items") or []:
        for session in ((item.get("outline") or {}).get("sessions") or []):
            key = session.get("key")
            if key and "text" in key:
                found = _book_chapter_verse(key["ref"], names)
                if not found:
                    raise ValueError(f"learning: cannot read the reference {key['ref']!r}")
                key["id"] = found[0] * 1_000_000 + found[1] * 1000 + found[2]
                del key["text"]


def _strip_letter_group(data: dict) -> None:
    """A key verse's reason that only repeats the verse: the page shows the verse instead."""
    for letter in data.get("letters") or []:
        for verse in letter.get("keyVerses") or []:
            if only_quotes(verse.get("why") or "", verse["span"]):
                verse["why"] = ""


def _strip_letters_browse(data: dict) -> None:
    for version in data.get("translations") or []:
        if "verses" in version:
            version["books"] = sorted(version.pop("verses"))


def _strip_strongs(data: dict) -> None:
    for word in data.get("words") or []:
        for row in word.get("rows") or []:
            row["sample"].pop("text", None)
    for sample in (data.get("samples") or {}).values():
        sample.pop("text", None)
    for row in (data.get("love") or {}).get("john21") or []:
        row.pop("text", None)


def _strip_hebrew_psalm(data: dict) -> None:
    for stanza in (data.get("psalm") or {}).values():
        stanza.pop("text", None)


def _strip_sources() -> None:
    src = WEBSITE / "src"
    catalog = json.loads((WEBSITE / "data" / "catalog.json").read_text(encoding="utf-8"))
    names = {book["name"]: book["num"] for book in catalog["books"]}
    names["Psalm"] = names.get("Psalms", 19)
    for path in sorted((src / "data" / "people-pages").glob("*.json")):
        if path.name != "index.json":
            _rewrite_source(path, lambda data: strip_quoted(data, path.name))
    for path in sorted((src / "components" / "moses-page" / "data").glob("*.json")):
        def moses(data: dict) -> None:
            strip_verse_table(data, "verses")
            strip_verse_table(data, "kjv")
            for point in data.get("points") or []:
                if point.pop("text", None) is not None:
                    point["quoted"] = True
            strip_quoted(data, path.name)
            for node in (data.get("people") or {}).get("nodes") or []:
                for verse in node.get("verses") or []:
                    if isinstance(verse, dict) and verse.pop("text", None) is not None:
                        verse["quoted"] = True
        _rewrite_source(path, moses)
    for path in sorted((src / "data" / "long-memory").glob("*.json")):
        if path.name != "index.json":
            _rewrite_source(path, lambda data: [point.pop("text", None) for point in data.get("points") or []])
    for path in sorted((src / "data" / "apostle-pages").glob("*.json")):
        if path.name not in ("index.json", "books.json"):
            _rewrite_source(path, strip_apostle)
    for path in sorted((src / "data" / "who-ruled").glob("*.json")):
        _rewrite_source(path, strip_ruled_quotes)
    _rewrite_source(src / "data" / "faith-names.json", lambda data: _strip_faith_names(data, names))
    _rewrite_source(src / "data" / "resources" / "learning.json", lambda data: _strip_learning(data, names))
    _rewrite_source(src / "data" / "letters" / "browse.json", _strip_letters_browse)
    for path in sorted((src / "data" / "letters").glob("*.json")):
        if path.name not in ("browse.json", "overview.json"):
            _rewrite_source(path, _strip_letter_group)
    _rewrite_source(src / "pages" / "study" / "strongs" / "strongs-data.json", _strip_strongs)
    _rewrite_source(src / "pages" / "study" / "hebrew" / "hebrew-data.json", _strip_hebrew_psalm)
    for name in ("farming", "greek", "egypt", "hebrew", "home", "church-reading", "medieval"):
        path = src / "pages" / "study" / name / f"{name}-data.json"
        if path.exists():
            _rewrite_source(path, strip_study_verses)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    _strip_built_data()
    _strip_sources()
    print(f"verse wording removed; {len(Left.kept)} {{text, span}} kept because they are not word for word:")
    for line in Left.kept:
        print(" ", line)
