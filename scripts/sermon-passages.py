"""Sermons campaign: record the publisher-stated main Bible text of sermons the library already holds.

Writes content/library/passage-overlays/<name>.json (work id -> passages, plus genre corrections), which
scripts/teacher-pages/people.ts merges over the catalogue. The overlay exists because most of these works are
untracked reconciled records (Pages/Teachers/SERMONS-CAMPAIGN.md, "Git safety"); it never edits them.

  begg      Truth For Life pages: <meta ... scripture_ref content="2 Corinthians 12:1–10">
  piper     Desiring God messages: the header list after "Scripture:"; Ask Pastor John episodes -> genre interview
  spurgeon  catalogued opening-Scripture headings left "unmapped" (e.g. "Romans 8:26, 27")

Never infers a passage from a title: a work gets a passage only when its source states one, checked against our KJV.
Usage (from Website/): python -X utf8 scripts/sermon-passages.py [--check]
"""

import argparse
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.paths import SITE, SOURCES  # noqa: E402
from bible.study_refs import RefError, Verses, normalise_book, parse_refs  # noqa: E402

LIBRARY = SITE / "content" / "library"
OVERLAYS = LIBRARY / "passage-overlays"
HELD = SOURCES / "library"
TODAY = "2026-10-08"
AUTHORS = {"begg": "author-alistair-begg", "piper": "author-john-piper", "spurgeon": "author-charles-spurgeon"}


def norm(url):
    if not url:
        return None
    return url.split("#")[0].split("?")[0].rstrip("/").replace("http://", "https://").replace("://www.", "://").lower()


def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def has_main(work):
    return any(p.get("role") == "main-text" and p.get("start") for p in work.get("passages") or [])


def load_works():
    """Works of the three preachers, plus every address each one is known by (work → edition → asset)."""
    works = {}
    for file in (LIBRARY / "catalog" / "works").glob("*.json"):
        work = read(file)
        creators = {c["authorId"] for c in work.get("creators") or []}
        name = next((k for k, a in AUTHORS.items() if a in creators), None)
        if name:
            works[work["id"]] = (name, work)
    edition_work = {}
    for file in (LIBRARY / "catalog" / "editions").glob("*.json"):
        edition = read(file)
        if edition.get("workId") in works:
            edition_work[edition["id"]] = edition["workId"]
    addresses = {}
    for file in (LIBRARY / "catalog" / "assets").glob("*.json"):
        asset = read(file)
        work_id = edition_work.get(asset.get("editionId"))
        for url in (asset.get("canonicalUrl"), asset.get("finalUrl")) if work_id else ():
            if norm(url):
                addresses.setdefault(norm(url), work_id)
    for work_id, (_name, work) in sorted(works.items()):
        for url in sermon_urls(work):
            addresses.setdefault(url, work_id)
    return works, addresses


def sermon_urls(work):
    urls = {norm(u) for values in (work.get("externalIds") or {}).values()
            for u in (values if isinstance(values, list) else [values]) if isinstance(u, str) and u.startswith("http")}
    return urls | {norm(e.get("url")) for e in work.get("evidence") or [] if e.get("url")}


def duplicates(works, addresses):
    """Two records of one preacher with the same sermon address are one sermon: keep the placed one, else the first."""
    groups = {}
    for work_id, (name, work) in works.items():
        for url in sermon_urls(work):
            if re.search(r"/(sermon|messages)/", url or ""):
                groups.setdefault((name, url), set()).add(work_id)
    found = {}
    for (_name, url), ids in groups.items():
        if len(ids) < 2:
            continue
        placed = sorted(i for i in ids if has_main(works[i][1]))
        keep = placed[0] if placed else addresses.get(url, min(ids))
        for other in ids - {keep}:
            found.setdefault(other, keep)
    return found


def held_pages(source_ids):
    """(address, asset id, page text) for each held HTML page of these sources."""
    for source in source_ids:
        for prov_file in sorted((HELD / source).glob("*/provenance.json")):
            prov = read(prov_file)
            originals = [f for f in prov_file.parent.iterdir() if f.name.startswith("original") and f.suffix not in (".pdf", ".epub")]
            if not originals:
                continue
            text = originals[0].read_text(encoding="utf-8", errors="replace")
            for key in ("url", "finalUrl", "sourcePage"):
                if prov.get(key):
                    yield norm(prov[key]), prov_file.parent.name, prov.get(key), text
                    break


def begg_refs(text):
    return [html.unescape(m).strip() for m in re.findall(r'<meta[^>]*scripture_ref[^>]*content="([^"]*)"', text) if m.strip()]


def piper_refs(text):
    block = re.search(r"Scripture:(.*?)(?:Topic:|</li>)", text, re.DOTALL)
    return [html.unescape(m).strip() for m in re.findall(r'data-grouping-type="Scripture"[^>]*>([^<]+)<', block.group(1))] if block else []


def clean(reference):
    """Source punctuation -> the parser's: en/em dashes, "and" between references, "8. 9" typo for "8, 9"."""
    ref = reference.replace("–", "-").replace("—", "-").replace(" ", " ")
    ref = re.sub(r"(\d)\.\s+(\d)", r"\1, \2", ref)
    ref = re.sub(r":\s+(?=\d)", ":", ref)
    ref = re.sub(r"(\d:\d+(?:-\d+)?);\s*(?=\d+(?:-\d+)?\s*(?:$|[;,]))", r"\1, ", ref)  # "43:1-4; 22-25": verses, not chapters
    ref = re.sub(r"\s+and\s+(?=\d+:)", "; ", ref)  # "Luke 7:50 and 18:42": another chapter
    return re.sub(r"\s+and\s+(?=\d)", ", ", ref)  # "Judges 18:7 and 27-28": more verses


def whole_book(reference, verses):
    """A source stating a whole book ("Obadiah") -> its first to last verse."""
    try:
        code = normalise_book(reference)
    except RefError:
        return None
    last = max(verses.sizes.get(code) or {0: 0})
    return [[verses.check(code, 1, 1), verses.check(code, last, verses.last_verse(code, last))]] if last else None


def passages(reference, verses, locator):
    """One printed reference -> catalogue passages; adjacent pieces ("8:26, 27") merge into one span."""
    spans = []
    for start, end in whole_book(reference, verses) or parse_refs(clean(reference), verses):
        if spans and start == spans[-1][1] + 1:
            spans[-1][1] = end
        else:
            spans.append([start, end])
    return [dict(reference=reference, numberingSystem="english", role="main-text", start=s, end=e,
                 verification="verified", locator=locator) for s, e in spans]


def from_pages(name, sources, read_refs, label, works, addresses, verses, copies):
    entries, unresolved, counts = {}, [], Counter()
    for work_id, keep in copies.items():
        if works[work_id][0] == name:
            entries[work_id] = dict(duplicateOf=keep)
            counts["duplicate record marked"] += 1
    for address, asset_id, url, text in held_pages(sources):
        work_id = addresses.get(address)
        if not work_id or works[work_id][0] != name:
            counts["held page with no catalogue work"] += 1
            continue
        work_id = copies.get(work_id, work_id)
        work = works[work_id][1]
        if has_main(work) or work_id in entries:
            counts["already placed"] += 1
            continue
        refs = read_refs(text)
        if not refs:
            counts["page states no Bible text"] += 1
            continue
        found = []
        try:
            for ref in refs:
                found += passages(ref, verses, f"{url}; {label} (held asset {asset_id})")
        except RefError as error:
            unresolved.append(dict(workId=work_id, reference=refs, reason=str(error)))
            continue
        entries[work_id] = dict(passages=found)
        counts["placed"] += 1
    return entries, unresolved, counts


def spurgeon(works, verses):
    entries, unresolved, counts = {}, [], Counter()
    for work_id, (name, work) in sorted(works.items()):
        pending = [p for p in work.get("passages") or [] if p.get("role") == "main-text" and not p.get("start")]
        if name != "spurgeon" or has_main(work) or not pending:
            continue
        try:
            found = []
            for p in {p["reference"]: p for p in pending}.values():  # one heading catalogued twice is one passage
                found += passages(p["reference"], verses, f"{p.get('locator') or 'catalogue heading'}; mapped {TODAY}")
        except RefError as error:
            unresolved.append(dict(workId=work_id, reference=[p["reference"] for p in pending], reason=str(error)))
            continue
        entries[work_id] = dict(passages=found)
        counts["placed"] += 1
    return entries, unresolved, counts


def piper_interviews(works, entries):
    """Ask Pastor John podcast answers are catalogued as sermons; they are interviews."""
    moved = 0
    for work_id, (name, work) in works.items():
        urls = " ".join(e.get("url") or "" for e in work.get("evidence") or [])
        if name == "piper" and work.get("genre") == "sermon" and "desiringgod.org/interviews/" in urls:
            entries.setdefault(work_id, {})["genre"] = "interview"
            moved += 1
    return moved


def overlay(name, method, entries, unresolved, counts):
    return {"kind": "passage-overlay", "name": name, "generatedBy": "scripts/sermon-passages.py", "generatedOn": TODAY,
            "method": method, "counts": dict(sorted(counts.items())), "unresolved": unresolved,
            "works": dict(sorted(entries.items()))}


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="report counts; write nothing")
    args = parser.parse_args()
    verses = Verses(SITE / "data")
    works, addresses = load_works()
    copies = duplicates(works, addresses)
    out = {}
    e, u, c = from_pages("begg", ["source-begg"], begg_refs, "Truth For Life page meta scripture_ref", works, addresses, verses, copies)
    out["begg"] = overlay("begg", "Publisher-assigned scripture_ref metadata on each held Truth For Life sermon page; second records of one sermon marked duplicateOf.", e, u, c)
    e, u, c = from_pages("piper", ["source-desiring-god"], piper_refs, "Desiring God page header 'Scripture:'", works, addresses, verses, copies)
    c["genre corrected to interview"] = piper_interviews(works, e)
    out["piper"] = overlay("piper", "Publisher's 'Scripture:' header list on each held Desiring God message page; Ask Pastor John episodes relabelled interview.", e, u, c)
    e, u, c = spurgeon(works, verses)
    out["spurgeon"] = overlay("spurgeon", "Opening Scripture headings already catalogued but left unmapped (verse lists such as '8:26, 27').", e, u, c)
    for name, data in out.items():
        print(name, data["counts"], "unresolved:", len(data["unresolved"]))
        if not args.check:
            OVERLAYS.mkdir(exist_ok=True)
            (OVERLAYS / f"{name}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
