#!/usr/bin/env python3
"""Download the whole Bibles listed in bible/other_sources.py and write each as plain USFM in sources/converted/<id>/.

    python scripts/convert-other-bibles.py            # skips downloads already present, always rewrites the USFM
    python scripts/convert-other-bibles.py --only lao_bib

Only the Bible's words, verse numbers, headings and poetry lines carry over; footnotes are left out.
"""

import argparse
import json
import re
import shutil
import sys
import tempfile
import urllib.request
import xml.etree.ElementTree as ElementTree
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.books import BOOK_NUMBER  # noqa: E402
from bible.other_sources import OTHER_SOURCES  # noqa: E402
from bible.paths import SOURCES  # noqa: E402

USER_AGENT = "bible-project-fetch-sources/1.0 (+https://github.com/CYPKNFT/bible-project)"
OSIS_BOOKS = dict(zip(
    "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan "
    "Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess "
    "1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev".split(),
    "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN "
    "HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH "
    "1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split()))


def clean(text: str) -> str:
    """No source's words may be read as a USFM marker."""
    return re.sub(r"\s+", " ", text.replace("\\", " ")).strip()


def write_books(folder: Path, books: dict[str, list[str]]) -> None:
    for old in folder.glob("*.usfm"):
        old.unlink()
    for code, lines in books.items():
        (folder / f"{BOOK_NUMBER[code]:03}-{code}.usfm").write_text("\n".join([f"\\id {code}", *lines, ""]), encoding="utf-8")


def from_helloao(path: Path) -> dict[str, list[str]]:
    books: dict[str, list[str]] = {}
    for book in json.loads(path.read_text(encoding="utf-8"))["books"]:
        if book["id"] not in BOOK_NUMBER:
            raise SystemExit(f"{path}: unknown book {book['id']!r}; expected a code from scripts/bible/books.py")
        lines: list[str] = []
        for chapter in book["chapters"]:
            lines += [f"\\c {chapter['chapter']['number']}", "\\p"]
            for item in chapter["chapter"]["content"]:
                lines += helloao_item(item)
        books[book["id"]] = label_split_verses(split_flattened_chapters(lines) if len(book["chapters"]) == 1 else lines)
    return books


def label_split_verses(lines: list[str]) -> list[str]:
    """Two texts print Zechariah 4:10 in two places (they reorder the passage). Name the parts 10a and 10b, so both are kept."""
    out: list[str] = []
    seen: dict[str, int] = {}
    for line in lines:
        if line.startswith("\\c "):
            seen = {}
        match = re.match(r"\\v (\d+)(.*)", line, re.S)
        if match:
            number = match.group(1)
            if number in seen:
                first = seen[number]
                out[first] = re.sub(r"^\\v \d+", f"\\\\v {number}a", out[first])
                line = f"\\v {number}b{match.group(2)}"
            else:
                seen[number] = len(out)
        out.append(line)
    return out


def split_flattened_chapters(lines: list[str]) -> list[str]:
    """Three catalogue entries file a whole book under chapter 1; its verse numbers still restart at each real chapter."""
    out, chapter = [], 1
    for line in lines:
        if re.match(r"\\v 1(\s|$)", line) and any(earlier.startswith("\\v ") for earlier in out):
            chapter += 1
            out += [f"\\c {chapter}", "\\p"]
        out.append(line)
    return out


def helloao_item(item: dict) -> list[str]:
    if item["type"] == "heading":
        return [f"\\s1 {clean(' '.join(item['content']))}"]
    if item["type"] == "hebrew_subtitle":
        words = [part if isinstance(part, str) else part.get("text", "") for part in item["content"]]
        return [f"\\d {clean(' '.join(words))}"]
    if item["type"] == "line_break":
        return ["\\b"]
    if item["type"] != "verse":
        raise SystemExit(f"helloao: unknown content type {item['type']!r}; expected heading, hebrew_subtitle, line_break or verse")
    lines, words = [f"\\v {item['number']}"], ""
    for part in item["content"]:
        if isinstance(part, str):
            words += f" {clean(part)}"
        elif "text" in part:
            text = clean(part["text"])
            if part.get("poem"):
                lines[-1] += words
                words = ""
                lines += [f"\\q{min(part['poem'], 3)}", ""]
            words += f" \\wj {text}\\wj*" if part.get("wordsOfJesus") else f" {text}"
        elif "noteId" not in part and "lineBreak" not in part:
            raise SystemExit(f"helloao: unknown verse part {part!r}; expected text, a note or a line break")
    lines[-1] += words
    return [line.strip() if not line.startswith("\\v") else line for line in lines if line]


def local_name(element: ElementTree.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def from_osis(path: Path) -> dict[str, list[str]]:
    """OSIS verses come as containers or as start/end milestones; collect the words between them either way."""
    verses: dict[str, dict[str, dict[str, list[str]]]] = {}
    current: list[list[str] | None] = [None]

    def open_verse(reference: str) -> None:
        book, chapter, verse = reference.split(" ")[0].split(".")[:3]
        if book not in OSIS_BOOKS:
            current[0] = None  # outside the 66 books: this collection's extras are not offered
            return
        current[0] = verses.setdefault(OSIS_BOOKS[book], {}).setdefault(chapter, {}).setdefault(verse, [])

    def walk(element: ElementTree.Element) -> None:
        name = local_name(element)
        if name in ("note", "title", "header"):
            return
        if name == "verse" and element.get("eID"):
            current[0] = None
            return
        container = name == "verse" and element.get("osisID") and not element.get("sID")
        if name == "verse" and element.get("osisID"):
            open_verse(element.get("osisID"))
        if current[0] is not None and element.text:
            current[0].append(element.text)
        for child in element:
            walk(child)
            if current[0] is not None and child.tail:
                current[0].append(child.tail)
        if container:
            current[0] = None

    walk(ElementTree.parse(path).getroot())
    return {code: [line for number, chapter in chapters.items()
                   for line in (f"\\c {number}", "\\p", *(f"\\v {n} {clean(''.join(words))}" for n, words in chapter.items()))]
            for code, chapters in verses.items()}


def from_usfx(path: Path) -> dict[str, list[str]]:
    books: dict[str, list[str]] = {}
    for book in ElementTree.parse(path).getroot().iter():
        if local_name(book) != "book" or book.get("id") not in BOOK_NUMBER:
            continue
        lines, words = [], ""
        state = {"open": False}

        def flush() -> None:
            nonlocal words
            if state["open"]:
                lines[-1] += f" {clean(words)}"
            words = ""

        def walk(element: ElementTree.Element) -> None:
            nonlocal words
            name = local_name(element)
            if name in ("f", "x", "h", "toc", "id", "ide", "rem", "fig", "s", "d", "mt", "cl", "cp"):
                return
            if name == "c":
                flush()
                state["open"] = False
                lines.extend((f"\\c {element.get('id')}", "\\p"))
            elif name == "v":
                flush()
                lines.append(f"\\v {element.get('id')}")
                state["open"] = True
            elif name == "ve":
                flush()
                state["open"] = False
            if state["open"] and element.text:
                words += element.text
            for child in element:
                walk(child)
                if state["open"] and child.tail:
                    words += child.tail

        walk(book)
        flush()
        books[book.get("id")] = lines
    return books


def from_sword(path: Path) -> dict[str, list[str]]:
    from pysword.modules import SwordModules  # only this source needs it: pip install pysword==0.2.8

    with tempfile.TemporaryDirectory() as temporary:
        modules = SwordModules(str(path))
        found = modules.parse_modules()
        bible = modules.get_bible_from_module(next(iter(found)))
        books: dict[str, list[str]] = {}
        structure = bible.get_structure().get_books()
        for book in structure["ot"] + structure["nt"]:
            if book.osis_name not in OSIS_BOOKS:
                continue  # the 66 books only: an empty slot for Tobit and the like in the module's verse scheme
            lines: list[str] = []
            for chapter, length in enumerate(book.chapter_lengths, start=1):
                lines += [f"\\c {chapter}", "\\p"]
                for verse in range(1, length + 1):
                    text = bible.get(books=[book.osis_name], chapters=[chapter], verses=[verse], clean=True)
                    if clean(text):
                        lines.append(f"\\v {verse} {clean(text)}")
            books[OSIS_BOOKS[book.osis_name]] = lines
        del temporary
    return books


CONVERTERS = {"helloao": from_helloao, "sword": from_sword}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--only", help="convert just this id")
    args = parser.parse_args()
    for tid, (kind, url) in OTHER_SOURCES.items():
        if args.only and tid != args.only:
            continue
        folder = SOURCES / "converted" / tid
        folder.mkdir(parents=True, exist_ok=True)
        download = folder / url.rsplit("/", 1)[-1]
        if not download.exists():
            partial = download.with_suffix(download.suffix + ".part")
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=300) as response, partial.open("wb") as out:
                shutil.copyfileobj(response, out)
            partial.replace(download)
        convert = from_usfx if download.name.endswith(".usfx.xml") else from_osis if kind == "osis" else CONVERTERS[kind]
        books = convert(download)
        write_books(folder, books)
        print(f"{tid}: {len(books)} books", flush=True)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
