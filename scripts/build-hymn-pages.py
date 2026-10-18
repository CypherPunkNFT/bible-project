"""Build the data behind every hymn page (/study/hymns/<hymn>) and the reader's "Sung on this chapter" card.

One template (src/pages/study/hymns/HymnPage.tsx) serves all 1,228 hymns; this script fills it. For each hymn: its words
and facts, its heading verse, the line that echoes it, its place in its book, the verses its lines echo (only those that
passed both model runs and every script check: Research/Hymns/pipeline/checked.json), the passage it draws on most
when it has no heading, and where hymnals place it (Hymnary.org metadata, where we have it).

Every verse is SHOWN in the Berean Standard Bible, from the site's data/plain/bsb; the matching was done in the King James
wording these authors read (scripts/hymns/). The short words beside a verse in the margin are cut by this script from the
BSB verse itself (the clause sharing most words with the line); no model writes any page text.

Reads Research/Hymns (read only) and data/plain/bsb. Writes data/hymns/pages/index.json, data/hymns/pages/<n>.json
(bundles of 25 hymns, to keep the release under the host's file limit) and data/hymns/by-book/<CODE>.json. These are
generated and not in git; scripts/build-hymn-collection.py writes the other files under data/hymns/.

    python scripts/build-hymn-pages.py            # write
    python scripts/build-hymn-pages.py --check    # fail if the written data is missing or stale
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "hymns"))

from hymns_common import CHECKED_FILE, CORPUS, HYMNS_FILE, NAME_OF, OSIS_TO_CODE, SECTION_OF, STOP, WEBSITE, read_json, ref_label, stems, verse_text, write_json  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
OUT = WEBSITE / "data" / "hymns"
BUNDLE = 25
SHOWN_VERSES = 4
AUTHOR_DATES = {"Isaac Watts": "1674–1748", "John Newton": "1725–1807", "William Cowper": "1731–1800"}
GROUP_TONE = {"psalms": "poetry", "hss": "epistles", "divine": "acts", "newton": "history", "cowper": "prophets"}
WORDS_MAX = 12


def first_line_key(line: str) -> str:
    letters = re.sub(r"[^a-z]", "", line.lower())
    return letters.replace("our", "or").replace("awe", "aw")[:36]


def bsb(code: str, chapter: int, first: int, last: int) -> list[dict]:
    out = []
    for n in range(first, last + 1):
        text = verse_text("bsb", code, chapter, n)
        if text:
            out.append({"n": n, "text": text})
    return out


def passage(code: str, chapter: int, first: int | None, last: int | None) -> dict | None:
    """A passage in the BSB; a whole chapter carries its first verses only (the reader holds the rest)."""
    if first is None:
        verses = bsb(code, chapter, 1, 200)
        return {"ref": ref_label(code, chapter), "code": code, "chapter": chapter, "whole": True, "count": len(verses),
                "verses": verses[:SHOWN_VERSES]} if verses else None
    verses = bsb(code, chapter, first, last or first)
    return {"ref": ref_label(code, chapter, first, last), "code": code, "chapter": chapter, "whole": False,
            "count": len(verses), "verses": verses} if verses else None


def clauses_of(text: str) -> list[str]:
    return [c.strip() for c in re.split(r"(?<=[,;:.!?—])[”’\"']?\s+", text) if c.strip()]


def margin_words(line: str, text: str, kjv: str) -> str:
    """The words beside a verse in the margin, cut from the BSB verse itself: the run of one or two clauses sharing most
    words with the hymn's line; when the BSB shares none (its modern wording, "curtain" for "veil"), the clause standing
    where the KJV's matching clause stands. At most WORDS_MAX words."""
    line_stems = {s for s in stems(line) if s not in STOP}

    def shared(clause: str) -> int:
        return len(line_stems & {s for s in stems(clause) if s not in STOP})

    clauses = clauses_of(text)
    windows = clauses + [f"{a} {b}" for a, b in zip(clauses, clauses[1:])]
    best = max(windows, key=lambda c: (shared(c), -len(c))) if windows else text
    if windows and not shared(best):
        old = clauses_of(kjv)
        at = max(range(len(old)), key=lambda i: shared(old[i])) if old else 0
        best = clauses[min(len(clauses) - 1, round(at * len(clauses) / max(1, len(old))))]
    words = best.strip("“”‘’\"' ").rstrip(",;:.!?—”’").split()
    if len(words) > WORDS_MAX:
        words = words[:WORDS_MAX] + ["…"]
    return " ".join(words).strip("“”‘’\"'").rstrip(",;:.!?—”’")


def same_start(a: str, b: str) -> bool:
    """Two first-line keys for one hymn: Hymnary often runs the first two lines together, so one key starts the other."""
    return min(len(a), len(b)) >= 16 and (a.startswith(b) or b.startswith(a))


def hymnary() -> tuple[list[tuple[str, dict]], list[tuple[str, int]]]:
    """Hymnary.org records keyed by first line (metadata only), and how many hymnals print each first line."""
    records = [(first_line_key(r.get("first_line") or ""), r) for r in
               (read_json(p) for p in sorted((CORPUS / "normalized" / "scripture-index").glob("hymnary-*.json")))]
    counts: dict[str, int] = {}
    for path in (CORPUS / "raw" / "hymnary").glob("*.json"):
        if path.name.startswith("_"):
            continue
        for first, h in read_json(path).items():
            key = first_line_key(first)
            n = int(h.get("number of hymnals") or 0)
            counts[key] = max(counts.get(key, 0), n)
    return records, list(counts.items())


def placed_of(record: dict | None) -> list[dict]:
    """Every passage Hymnary's editors tie the hymn to, grouped by book in Bible order, each with its first BSB verses."""
    if not record:
        return []
    books: dict[str, list[dict]] = {}
    for r in record.get("scripture_references") or []:
        start, end = r.get("start") or {}, r.get("end") or {}
        code = OSIS_TO_CODE.get(start.get("book") or "")
        if not r.get("parsed") or not code or not start.get("chapter"):
            continue
        chapter = int(start["chapter"])
        first = int(start["verse"]) if start.get("verse") else None
        last = int(end["verse"]) if first and end.get("verse") and int(end.get("chapter") or chapter) == chapter else first
        p = passage(code, chapter, first, last)
        if not p:
            continue
        ref = f"{chapter}" + (f":{first}" + (f"–{last}" if last and last != first else "") if first else "")
        if any(x["ref"] == ref for x in books.get(code, [])):
            continue
        books.setdefault(code, []).append({"ref": ref, "label": p["ref"], "code": code, "chapter": chapter, "first": first or 1,
                                           "whole": first is None, "count": p["count"], "verses": p["verses"][:SHOWN_VERSES]})
    order = list(NAME_OF)
    return [{"book": NAME_OF[c], "code": c, "tone": SECTION_OF[c], "refs": refs} for c, refs in sorted(books.items(), key=lambda kv: order.index(kv[0]))]


def heading_of(hymn: dict, checked: dict | None) -> dict | None:
    """The printed heading verse in the BSB, unless run 1 judged it not to fit; with the line that echoes it."""
    h = hymn.get("heading")
    if not h or not h["ranges"] or (checked and checked["heading"]["fits"] == "no"):
        return None
    parts = [p for p in (passage(r["code"], r["chapter"], r["first"], r["last"]) for r in h["ranges"]) if p]
    if not parts:
        return None
    first = parts[0]
    verses = [v for p in parts if p["code"] == first["code"] and p["chapter"] == first["chapter"] for v in p["verses"]]
    line = None
    n = (checked or {}).get("heading", {}).get("line") or 0
    if n:
        flat = [(s, l) for s, st in enumerate(hymn["stanzas"]) for l in range(len(st))]
        if 1 <= n <= len(flat):
            line = {"stanza": flat[n - 1][0], "line": flat[n - 1][1]}
    return {"label": h["label"], "passage": {**first, "ref": h["label"], "verses": verses}, "line": line}


def echoes_of(hymn: dict, checked: dict | None) -> list[dict]:
    out = []
    for e in (checked or {}).get("echoes") or []:
        p = passage(e["code"], e["chapter"], e["first"], e["last"])
        if not p:
            continue
        line = hymn["stanzas"][e["stanza"]][e["line"]]
        out.append({"stanza": e["stanza"], "line": e["line"], "ref": p["ref"], "code": e["code"], "chapter": e["chapter"],
                    "verses": p["verses"], "words": margin_words(line, " ".join(v["text"] for v in p["verses"]),
                                                                 " ".join(verse_text("kjv", e["code"], e["chapter"], n) or "" for n in range(e["first"], e["last"] + 1))),
                    "kind": "shared" if e["source"] == "matched" else "echo"})
    out.sort(key=lambda e: (e["stanza"], e["line"]))
    return out


def page_of(hymn: dict, checked: dict | None, books: dict[str, list[dict]], hymnary_data: tuple) -> dict:
    records, counts = hymnary_data
    key = first_line_key(hymn["firstLine"])
    hymnals = max((n for k, n in counts if same_start(k, key)), default=0)
    # Of the Hymnary records for this first line, the one with the most passages (a "with refrain" variant has fewer).
    record = max((r for k, r in records if same_start(k, key)), key=lambda r: len(r.get("scripture_references") or []), default=None)
    subtitle = next((t for t in (hymn["title"], hymn["subject"]) if t and first_line_key(t) != key), "")
    heading = heading_of(hymn, checked)
    main = None
    if not heading and checked and checked.get("mainPassage"):
        m = checked["mainPassage"]
        p = passage(m["code"], m["chapter"], m["verse"], m["verse"])
        if p:
            main = {"label": p["ref"], "passage": p}
    part = books[hymn["part"]]
    return {
        "id": hymn["id"], "firstLine": hymn["firstLine"], "subtitle": subtitle, "author": hymn["author"],
        "authorDates": AUTHOR_DATES.get(hymn["author"], ""), "year": hymn["year"], "group": hymn["group"],
        "collection": hymn["collection"], "partLabel": hymn["partLabel"], "number": hymn["number"],
        "meter": hymn["metre"], "meterName": hymn["metreName"], "stanzas": hymn["stanzas"],
        "heading": heading, "mainPassage": main, "echoes": echoes_of(hymn, checked),
        "book": {"label": hymn["partLabel"], "here": next(i for i, t in enumerate(part) if t["id"] == hymn["id"]), "ticks": part},
        "hymnals": hymnals or None, "placed": placed_of(record),
        "hymnary": (record or {}).get("source", {}).get("hymn_url") or "",
        "source": hymn["source"],
    }


def by_book(pages: list[dict]) -> dict[str, dict]:
    """Per book, per chapter: the hymns written on it (heading), then the hymns with a line echoing a verse in it."""
    out: dict[str, dict] = {}
    for p in pages:
        entry = {"id": p["id"], "t": p["firstLine"], "a": p["author"], "y": p["year"]}
        on = set()
        if p["heading"]:
            h = p["heading"]["passage"]
            out.setdefault(h["code"], {}).setdefault(str(h["chapter"]), {"on": [], "echo": []})["on"].append({**entry, "r": p["heading"]["label"]})
            on.add((h["code"], h["chapter"]))
        seen = set()
        for e in p["echoes"]:
            where = (e["code"], e["chapter"])
            if where in on or where in seen:
                continue
            seen.add(where)
            out.setdefault(e["code"], {}).setdefault(str(e["chapter"]), {"on": [], "echo": []})["echo"].append({**entry, "r": e["ref"]})
    return out


def build(checked_file: Path) -> dict[str, object]:
    every = read_json(HYMNS_FILE)["hymns"]
    # The same hymn under a second spelling gets no page of its own; its address sends readers to the kept one.
    aliases = {h["id"]: h["duplicateOf"] for h in every if h.get("duplicateOf")}
    hymns = [h for h in every if not h.get("duplicateOf")]
    checked_all = read_json(checked_file) if checked_file.exists() else {"hymns": []}
    checked = {h["id"]: h for h in checked_all["hymns"]}
    books: dict[str, list[dict]] = {}
    for h in hymns:
        tone = SECTION_OF[h["heading"]["ranges"][0]["code"]] if (h.get("heading") or {}).get("ranges") else GROUP_TONE[h["group"]]
        books.setdefault(h["part"], []).append({"n": h["number"], "id": h["id"], "t": h["firstLine"], "a": h["author"], "tone": tone,
                                                "order": h["order"]})
    for part in books.values():
        part.sort(key=lambda t: t["order"])
        for t in part:
            del t["order"]
    data = hymnary()
    pages = [page_of(h, checked.get(h["id"]), books, data) for h in hymns]
    files: dict[str, object] = {}
    index = {"schema": "bibleproject.hymn-pages/v1", "count": len(pages), "echoesChecked": bool(checked), "bundles": {}, "aliases": aliases}
    for start in range(0, len(pages), BUNDLE):
        n = start // BUNDLE
        chunk = pages[start:start + BUNDLE]
        files[f"pages/{n}.json"] = {p["id"]: p for p in chunk}
        for p in chunk:
            index["bundles"][p["id"]] = n
    files["pages/index.json"] = index
    for code, chapters in by_book(pages).items():
        files[f"by-book/{code}.json"] = chapters
    stats = Counter()
    for p in pages:
        stats["with heading"] += bool(p["heading"])
        stats["with echoes"] += bool(p["echoes"])
        stats["echoes"] += len(p["echoes"])
        stats["with main passage"] += bool(p["mainPassage"])
        stats["text only"] += not (p["heading"] or p["echoes"] or p["mainPassage"])
        stats["with hymnal placings"] += bool(p["placed"])
    print(f"{len(pages)} hymn pages ({len(aliases)} more addresses lead to one of them) in {len(pages) // BUNDLE + 1} bundles; " + ", ".join(f"{k} {v}" for k, v in stats.items())
          + f"; echoes checked: {'yes' if checked else 'not yet (no ' + checked_file.name + ')'}")
    return files


def text_of(data: object) -> str:
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--check", action="store_true", help="fail if the written data is missing or stale")
    parser.add_argument("--checked", type=Path, default=CHECKED_FILE, help="the checked echoes (a pilot's, to try the pages)")
    args = parser.parse_args()
    files = build(args.checked)
    if args.check:
        stale = [name for name, data in files.items() if not (OUT / name).exists() or (OUT / name).read_text(encoding="utf-8") != text_of(data)]
        if stale:
            raise SystemExit(f"hymn page data is stale or missing: {len(stale)} files, e.g. {stale[:3]}; run scripts/build-hymn-pages.py")
        print("hymn page data is up to date")
        return
    for folder in ("pages", "by-book"):
        if (OUT / folder).exists():
            shutil.rmtree(OUT / folder)
    for name, data in files.items():
        write_json(OUT / name, data, compact=True)
    digest = hashlib.sha256("".join(text_of(files[k]) for k in sorted(files)).encode()).hexdigest()[:16]
    print(f"wrote {len(files)} files under {OUT} (sha256 {digest})")


if __name__ == "__main__":
    main()
