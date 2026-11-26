"""Sermons campaign: record the publisher-stated main Bible text of sermons the library already holds.

Writes content/library/passage-overlays/<name>.json (work id -> passages, plus genre corrections), which
scripts/teacher-pages/people.ts merges over the catalogue. The overlay exists because most of these works are
untracked reconciled records (Pages/Teachers/SERMONS-CAMPAIGN.md, "Git safety"); it never edits them.

  begg      Truth For Life pages: <meta ... scripture_ref content="2 Corinthians 12:1–10">; source-begg folders carry
            provenance.json, the source-truth-for-life folders only `original` (address found by its sha256 in the
            ready-text-completion acquisition manifest)
  piper     Desiring God messages: the header list after "Scripture:"; Ask Pastor John episodes -> genre interview.
            Message pages the collector fetched but kept no asset for (it found under 150 words of text, or
            several speakers) are read from its verified cache, listed in reports/modern-texts/piper-results.json
  spurgeon  catalogued opening-Scripture headings left "unmapped" (e.g. "Romans 8:26, 27")

Never infers a passage from a title: a work gets a passage only when its source states one, checked against our KJV.
Every sermon still without a main text is listed in its overlay's "unplaced" (with the reason observed) or
"unresolved" (a stated text we could not read), so a gap in the source is not mistaken for an oversight.
Usage (from Website/): python -X utf8 scripts/sermon-passages.py [--check]
"""

import argparse
import hashlib
import html
import json
import re
import sys
from collections import Counter
from itertools import chain
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.paths import SITE, SOURCES  # noqa: E402
from bible.study_refs import RefError, Verses, normalise_book, parse_refs  # noqa: E402

LIBRARY = SITE / "content" / "library"
OVERLAYS = LIBRARY / "passage-overlays"
HELD = SOURCES / "library"
TODAY = "2026-10-08"  # first run: kept in the Spurgeon locators it wrote
GENERATED = "2026-11-26"
READY_MANIFEST = LIBRARY / "reports" / "ready-text-completion" / "acquisition-manifest.json"
PIPER_RESULTS = LIBRARY / "reports" / "modern-texts" / "piper-results.json"
PIPER_CACHE = SITE / ".local" / "library" / "run-modern-texts-2026-10-05" / "http"  # modern_texts_common.CACHE
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


def manifest_sermon_urls():
    """sha256 -> address for the Truth For Life sermon pages fetched without a provenance.json (ready-text-completion)."""
    by_hash = {}
    for entry in read(READY_MANIFEST)["files"]:
        url = entry.get("finalUrl") or entry.get("url") or ""
        if re.match(r"https://(www\.)?truthforlife\.org/resources/sermon/", url) and entry.get("sha256"):
            by_hash.setdefault(entry["sha256"], set()).add(url)
    return {sha: urls.pop() for sha, urls in by_hash.items() if len(urls) == 1}  # one hash, two addresses: ambiguous


def held_pages(source_ids, counts):
    """(address, asset id, page text) for each held HTML page of these sources."""
    by_hash = None
    for source in source_ids:
        for folder in sorted(p for p in (HELD / source).iterdir() if p.is_dir()):
            originals = sorted(f for f in folder.iterdir() if f.name.startswith("original") and f.suffix not in (".pdf", ".epub"))
            if not originals:
                continue
            data = originals[0].read_bytes()
            text = data.decode("utf-8", errors="replace")
            if (folder / "provenance.json").exists():
                prov = read(folder / "provenance.json")
                url = next((prov[key] for key in ("url", "finalUrl", "sourcePage") if prov.get(key)), None)
            else:
                by_hash = manifest_sermon_urls() if by_hash is None else by_hash
                url = by_hash.get(hashlib.sha256(data).hexdigest())
                if not url:
                    counts["held file with no provenance and no manifest match"] += 1
                    continue
            if url:
                yield norm(url), f"held asset {folder.name}", url, text, None


def piper_cached_pages(counts):
    """Message pages the collector fetched but kept no asset for, from its cache; the 5th item says why it gave no text."""
    for url, record in sorted(read(PIPER_RESULTS).items()):
        if "/messages/" not in url or record.get("status") not in ("no-substantial-text", "author-review"):
            continue
        body = PIPER_CACHE / (hashlib.sha256(url.encode()).hexdigest() + ".body")
        data = body.read_bytes()  # missing cache is an error: a rerun must not quietly drop what it placed
        meta = read(body.with_suffix(".json"))
        sha = hashlib.sha256(data).hexdigest()
        if sha != meta["sha256"]:
            raise ValueError(f"collector cache for {url} changed: expected sha256 {meta['sha256']}, found {sha}")
        authors = record.get("authors") or []
        if "John Piper" not in authors:
            counts["fetched page not credited to John Piper"] += 1
            continue
        if record["status"] == "author-review":
            kind = f"page by several speakers ({', '.join(authors)})"
        else:  # under 150 words; 0 can also mean the collector's selectors predate the site's redesign
            kind = f"page the collector found {record.get('bodyWordCount', 0)} words of text on"
        counts["page fetched but not kept as an asset"] += 1
        yield (norm(url), f"{kind}, fetched {meta['retrievedAt'][:10]}, sha256 {sha}, not kept as an asset", url,
               data.decode("utf-8", errors="replace"), f"{kind} has no 'Scripture:' header link")


def begg_refs(text):
    return [html.unescape(m).strip() for m in re.findall(r'<meta[^>]*scripture_ref[^>]*content="([^"]*)"', text) if m.strip()]


def begg_no_text(text):
    """What a Truth For Life page shows where the text goes, e.g. "Selected Scriptures"."""
    lead = re.search(r"class=scripture-reference-lead>(.*?)\(ID:", text, re.DOTALL)
    if not lead:
        return "held page states no Bible text and has no scripture-reference line"
    shown = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<svg.*?</svg>|<\?xml[^>]*>", "", lead.group(1), flags=re.DOTALL)))).strip()
    return f"publisher states no single text: the page's scripture line reads \"{shown}\"" if shown else "held page's scripture line is empty"


def piper_refs(text):
    # the "Scripture:" that heads the link list, not one in the page title ("Singing, Suffering, and Scripture: …");
    # pages fetched after the site's redesign put "<!-- -->" between the label and the link
    block = re.search(r'Scripture:\s*(?:<!--.*?-->\s*)?(<a[^>]*data-grouping-type="Scripture".*?)(?:Topic:|</li>)', text, re.DOTALL)
    return [html.unescape(m).strip() for m in re.findall(r'data-grouping-type="Scripture"[^>]*>([^<]+)<', block.group(1))] if block else []


def clean(reference):
    """Source punctuation -> the parser's: en/em dashes, "and" between references, "8. 9" typo for "8, 9"."""
    ref = reference.replace("–", "-").replace("—", "-").replace(" ", " ")
    ref = re.sub(r"^(Jam|Eccles)\.", lambda m: {"Jam": "James", "Eccles": "Ecclesiastes"}[m.group(1)], ref)  # older abbreviations
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


def from_pages(name, sources, read_refs, no_text, label, works, addresses, verses, copies, extra=None):
    """Place each held page's stated text; also returns, per work, why a held page gave none.

    `extra(counts)` yields further pages after the held ones; one is skipped for a sermon a held page already gave."""
    entries, unresolved, counts, reasons, conflicts, spans = {}, [], Counter(), {}, [], {}
    seen = set()
    for work_id, keep in copies.items():
        if works[work_id][0] == name:
            entries[work_id] = dict(duplicateOf=keep)
            counts["duplicate record marked"] += 1
    pages = chain(held_pages(sources, counts), extra(counts) if extra else ())
    for address, asset_id, url, text, why_none in pages:
        work_id = addresses.get(address)
        if not work_id or works[work_id][0] != name:
            counts["held page with no catalogue work"] += 1
            continue
        work_id = copies.get(work_id, work_id)
        work = works[work_id][1]
        if why_none and work_id in seen:
            counts["unkept page of a sermon already read from a held page"] += 1
            continue
        refs = read_refs(text)
        if work_id in spans:  # a second held copy of a sermon placed this run: it must state the same text
            counts["second held copy of a placed sermon"] += 1
            try:
                same = [[p["start"], p["end"]] for ref in refs for p in passages(ref, verses, "")] == spans[work_id]
            except RefError:
                same = False
            if not same:
                conflicts.append(dict(workId=work_id, asset=asset_id, reference=refs, placedFrom=entries[work_id]["passages"][0]["locator"]))
            continue
        if has_main(work) or work_id in entries:
            counts["second held copy of a placed sermon" if work_id in seen else "already placed"] += 1
            seen.add(work_id)
            continue
        seen.add(work_id)
        if not refs:
            counts["page states no Bible text"] += 1
            reasons.setdefault(work_id, dict(reason=why_none or no_text(text), locator=f"{url} ({asset_id})"))
            continue
        found = []
        try:
            for ref in refs:
                found += passages(ref, verses, f"{url}; {label} ({asset_id})")
        except RefError as error:
            unresolved.append(dict(workId=work_id, reference=refs, reason=str(error)))
            continue
        entries[work_id] = dict(passages=found)
        spans[work_id] = [[p["start"], p["end"]] for p in found]
        reasons.pop(work_id, None)
        counts["placed"] += 1
    return entries, unresolved, counts, reasons, conflicts


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


def unplaced(name, works, entries, unresolved, reasons):
    """Every sermon of this preacher still without a main text and not in "unresolved", with the reason seen."""
    listed = {u["workId"] for u in unresolved}
    out = []
    for work_id, (owner, work) in sorted(works.items()):
        entry = entries.get(work_id, {})
        if owner != name or work_id in listed or entry.get("duplicateOf") or entry.get("passages") or has_main(work):
            continue
        if entry.get("genre", work.get("genre")) != "sermon":
            continue
        row = dict(workId=work_id, title=work.get("title"))
        if work_id in reasons:
            row.update(reasons[work_id])
        elif name == "spurgeon":
            urls = sorted(u for u in sermon_urls(work) if u)
            numbered = any(re.search(r"/sermon/chs\d+\.pdf$", u) for u in urls)
            row["reason"] = ("no opening-Scripture heading is catalogued for this sermon" if numbered else
                             f"no opening-Scripture heading is catalogued; the record's address, {', '.join(urls) or 'none'}, "
                             "is a Spurgeon Gems site file, not one of the numbered sermons (chsNNNN.pdf)")
        else:
            row["reason"] = "no held page found at this record's address"
        out.append(row)
    return out


def overlay(name, method, entries, unresolved, counts, left=(), conflicts=()):
    data = {"kind": "passage-overlay", "name": name, "generatedBy": "scripts/sermon-passages.py", "generatedOn": GENERATED,
            "method": method, "counts": dict(sorted(counts.items())), "unresolved": unresolved,
            "unplaced": list(left), "works": dict(sorted(entries.items()))}
    if conflicts:
        data["conflictingCopies"] = list(conflicts)
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="report counts; write nothing")
    args = parser.parse_args()
    verses = Verses(SITE / "data")
    works, addresses = load_works()
    copies = duplicates(works, addresses)
    out = {}
    e, u, c, r, x = from_pages("begg", ["source-begg", "source-truth-for-life"], begg_refs, begg_no_text,
                               "Truth For Life page meta scripture_ref", works, addresses, verses, copies)
    out["begg"] = overlay("begg", "Publisher-assigned scripture_ref metadata on each held Truth For Life sermon page; second records of one sermon marked duplicateOf.",
                          e, u, c, unplaced("begg", works, e, u, r), x)
    e, u, c, r, x = from_pages("piper", ["source-desiring-god"], piper_refs, lambda _text: "held page has no 'Scripture:' header link",
                               "Desiring God page header 'Scripture:'", works, addresses, verses, copies, piper_cached_pages)
    c["genre corrected to interview"] = piper_interviews(works, e)
    out["piper"] = overlay("piper", "Publisher's 'Scripture:' header list on each held Desiring God message page, and on message pages fetched but not kept as assets; Ask Pastor John episodes relabelled interview.",
                           e, u, c, unplaced("piper", works, e, u, r), x)
    e, u, c = spurgeon(works, verses)
    out["spurgeon"] = overlay("spurgeon", "Opening Scripture headings already catalogued but left unmapped (verse lists such as '8:26, 27').",
                              e, u, c, unplaced("spurgeon", works, e, u, {}))
    for name, data in out.items():
        print(name, data["counts"], "unresolved:", len(data["unresolved"]), "unplaced:", len(data["unplaced"]),
              "conflicting copies:", len(data.get("conflictingCopies", [])))
        if not args.check:
            OVERLAYS.mkdir(exist_ok=True)
            (OVERLAYS / f"{name}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
