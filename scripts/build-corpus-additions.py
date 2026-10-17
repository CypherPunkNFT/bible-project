"""Add the Christian writers corpus's missing pieces to the /data_acquisition desk.

Reads D:/FortressOfSolitude/christian-writers-corpus (Fortress job 727d55dd, 16 Oct 2026) and writes
public/data_acquisition/corpus-additions.json plus reading texts in public/data_acquisition/texts/.
Only what the desk did not already have is added: McClintock & Strong volumes 11 and 12 (the
supplements), Catholic Encyclopedia volume 6 (the desk's own download of it failed), and the
Wikipedia/Wikidata list of candidate people. scripts/apply-corpus-additions.mjs merges the records
into catalogue.json, and build-data-acquisition.mjs calls it on every rebuild.

Usage: python scripts/build-corpus-additions.py [--corpus PATH]
"""
import argparse
import hashlib
import html
import json
import re
import shutil
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

WEBSITE = Path(__file__).resolve().parent.parent
OUT = WEBSITE / "public" / "data_acquisition"
ADDITIONS = OUT / "corpus-additions.json"
MCCLINTOCK_VOLUMES = {11, 12}
CATHOLIC_VOLUMES = {6}
DEFAULT_CORPUS = Path("D:/FortressOfSolitude/christian-writers-corpus")
MAX_TEXT_BYTES = 24 * 1024 * 1024  # Cloudflare Pages refuses files over 25 MiB



def record_id(key):
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(record, text):
    """Save a reading text for a record and fill in its textUrl/textBytes."""
    data = text.encode("utf-8")
    if len(data) > MAX_TEXT_BYTES:
        raise ValueError(f"{record['collection']} {record['subtitle']}: text is {len(data):,} bytes, "
                         f"over the {MAX_TEXT_BYTES:,}-byte hosting limit; split it first")
    (OUT / "texts" / f"{record['id']}.txt").write_bytes(data)
    record["textUrl"] = f"texts/{record['id']}.txt"
    record["textBytes"] = len(data)


def copy_text(record, source):
    if source.stat().st_size > MAX_TEXT_BYTES:
        raise ValueError(f"{source}: {source.stat().st_size:,} bytes is over the hosting limit")
    shutil.copyfile(source, OUT / "texts" / f"{record['id']}.txt")
    record["textUrl"] = f"texts/{record['id']}.txt"
    record["textBytes"] = source.stat().st_size


def review(reason, coverage="pending", known_gap=False, saved=True):
    """Completeness block in version 1's shape. Nothing here has passed a full-coverage check."""
    result = {"status": "INCOMPLETE", "reviewState": "known-gap" if known_gap else "unverified",
              "reason": reason,
              "steps": {"saved": "done" if saved else "pending",
                        "coverage": "blocked" if known_gap else coverage,
                        "compared": "pending", "complete": "pending"}}
    return result


def base_record(key, collection, group, category, subtitle, fmt, source_url, note, status="downloaded"):
    return {"id": record_id(key), "collection": collection, "group": group, "category": category,
            "subtitle": subtitle, "format": fmt, "status": status, "bytes": None, "textUrl": None,
            "sourceUrl": source_url, "note": note, "quality": None, "problem": None,
            "filename": None, "readPriority": 0}


# ── McClintock & Strong ──────────────────────────────────────────────────────

def mcclintock(corpus, verification):
    spans = {s["volume"]: s for s in verification["McClintock & Strong"]["spans"]}
    records = []
    for meta_path in sorted((corpus / "mcclintock-strong").glob("vol*.metadata.json")):
        meta = load_json(meta_path)
        volume = int(meta_path.name[3:5])
        if volume not in MCCLINTOCK_VOLUMES:
            continue
        span = spans.get(volume, {})
        label = f"Volume {volume}" + (" (supplement)" if volume > 10 else "")
        text_file = meta_path.with_name(meta_path.name.replace(".metadata.json", "_djvu.txt"))
        r = base_record(f"mcclintock/{volume}", "McClintock & Strong · Cyclopaedia", "McClintock-Strong",
                        "Encyclopedias", label, "TXT", f"https://archive.org/details/{meta['identifier']}",
                        f"Internet Archive OCR, item {meta['identifier']} ({meta.get('year') or 'year not recorded'}). "
                        "Public domain (1867–1887).")
        r["bytes"] = text_file.stat().st_size
        r["filename"] = f"mcclintock-strong-volume-{volume:02d}.txt"
        r["quality"] = ("Raw OCR of 1860s–1880s typography: expect long-s confusions, broken hyphenation "
                        "and mangled Greek and Hebrew.")
        r["completeness"] = review(
            f"Volume identity checked by its running headwords: {span.get('headwords', '?')} headwords, "
            f"first {span.get('first', '?')}, last {span.get('last', '?')} (OCR spelling kept). "
            "The ten main volumes run A to Z with no gap. Page-by-page coverage has not been verified.",
            coverage="sampled")
        copy_text(r, text_file)
        records.append(r)
    return records


# ── Catholic Encyclopedia (Wikisource wikitext → plain text, one file per volume) ──

DROP_TEMPLATES = {"ce13", "header", "similar", "import enwiki", "subpagename", "rule", "missing image",
                  "hebrew missing", "smaller block/s", "smaller block/e", "default sort", "defaultsort"}
WORD_TEMPLATES = {"bc": "B.C.", "ad": "A.D.", "'": "'", "ae": "æ", "!": "|", "gap": " "}
TRANSCLUDED = "[Article text is on Wikisource's scanned-page transcription and is not held in this corpus.]"


def replace_template(match):
    parts = match.group(1).split("|")
    name = parts[0].strip().lower()
    if name in WORD_TEMPLATES:
        return WORD_TEMPLATES[name]
    if name in DROP_TEMPLATES:
        return ""
    positional = [p for p in parts[1:] if not re.match(r"^\s*\w[\w ]*=", p)]
    return positional[-1].strip() if positional else ""


def link_text(match):
    target, _, label = match.group(1).partition("|")
    if re.match(r"^\s*(file|image|category):", target, re.I):
        return ""
    return (label or target.split("/")[-1]).strip()


def strip_wikitext(text):
    text = re.sub(r"<ref[^>/]*/>|<ref[^>]*>.*?</ref>", "", text, flags=re.S)
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = re.sub(r"^\{\|.*?^\|\}", "", text, flags=re.S | re.M)  # tables
    for _ in range(6):  # nested templates, innermost first
        text, count = re.subn(r"\{\{([^{}]*)\}\}", replace_template, text)
        if not count:
            break
    text = re.sub(r"\[\[([^\[\]]*)\]\]", link_text, text)
    text = re.sub(r"\[https?://\S+ ([^\]]*)\]", r"\1", text)
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"'{2,}", "", text)
    text = re.sub(r"^(=+)\s*(.*?)\s*\1\s*$", lambda m: m.group(2).upper(), text, flags=re.M)
    text = html.unescape(text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def catholic_pages(corpus):
    """Group article pages by printed volume; redirects are counted and skipped."""
    volumes, redirects, transcluded = defaultdict(list), 0, defaultdict(int)
    with (corpus / "catholic-encyclopedia-1913" / "pages.jsonl").open(encoding="utf-8") as pages:
        for line in pages:
            page = json.loads(line)
            wikitext = page["wikitext"]
            if wikitext.lstrip().upper().startswith("#REDIRECT"):
                redirects += 1
                continue
            head = wikitext[:800]
            volume = re.search(r"\|\s*volume\s*=\s*(\d+)", head)
            contributor = re.search(r"\|\s*contributor\s*=\s*([^\n|]*)", head)
            title = page["title"].split("/", 1)[-1] if "/" in page["title"] else page["title"]
            number = int(volume.group(1)) if volume else 0
            text = strip_wikitext(wikitext)
            if "<pages " in wikitext and len(text) < 200:
                transcluded[number] += 1
                text = TRANSCLUDED
            volumes[number].append((title, (contributor.group(1).strip() if contributor else ""), text))
    return volumes, redirects, transcluded


def catholic(corpus):
    volumes, redirects, transcluded = catholic_pages(corpus)
    collection, group = "The Catholic Encyclopedia", "Catholic-Encyclopedia"
    records = []
    for volume in sorted(CATHOLIC_VOLUMES):
        pages = sorted(volumes[volume], key=lambda p: p[0].lower())
        label = f"Volume {volume}"
        body = "\n\n\n".join(f"■ {title}" + (f"\n({contributor})" if contributor else "") + f"\n\n{text}"
                             for title, contributor, text in pages)
        r = base_record(f"catholic/{volume}", collection, group, "Encyclopedias", label, "TXT",
                        "https://en.wikisource.org/wiki/Catholic_Encyclopedia_(1913)",
                        f"{len(pages):,} Wikisource pages, from the English Wikisource dump. 1913 text public domain; "
                        "Wikisource markup CC BY-SA 4.0 (attribution: English Wikisource contributors).")
        r.update(filename=f"catholic-encyclopedia-volume-{volume:02d}-wikisource.txt",
                 quality="Wiki markup stripped automatically; tables and images are dropped. Articles are in title order.")
        missing = transcluded[volume]
        gap = (f"{missing:,} of {len(pages):,} articles are only pointers to Wikisource's scanned-page transcription, "
               "which this corpus did not collect; they are marked in the text. " if missing else "")
        r["completeness"] = review(
            gap + f"Every Catholic Encyclopedia page in the full Wikisource dump was taken ({redirects:,} redirects "
            "skipped). Whether Wikisource holds every article of the printed volume has not been checked.",
            coverage="done", known_gap=bool(missing))
        if missing:
            r["problem"] = f"{missing:,} articles have no text in this corpus (scanned-page transcriptions not collected)."
        write_text(r, body)
        r["bytes"] = r["textBytes"]
        records.append(r)
    return records


# ── Wikipedia & Wikidata candidate people ────────────────────────────────────

def year(values):
    if not values:
        return ""
    match = re.match(r"^([+-]?\d+)-", values[0])
    return str(int(match.group(1))) if match else ""


def wikidata(corpus):
    folder = corpus / "wikipedia-wikidata"
    rows = [json.loads(line) for line in (folder / "wikidata-metadata.jsonl").read_text(encoding="utf-8").splitlines() if line]
    rows.sort(key=lambda row: (row.get("label") or row["wikipedia_title"]).lower())
    lines = []
    for row in rows:
        dates = f"{year(row.get('birth'))}–{year(row.get('death'))}".strip("–")
        lines.append(" · ".join(part for part in (
            row.get("label") or row["wikipedia_title"], dates, row.get("description") or "",
            ", ".join(row.get("occupations") or []), f"{row.get('sitelinks', 0)} Wikipedias", row["qid"]) if part))
    collection, group = "Wikipedia & Wikidata · candidate people", "Wikidata"
    note = ("Ten Wikipedia category trees crawled to depth 2, each person matched to Wikidata. Wikidata is CC0; "
            "Wikipedia titles CC BY-SA 4.0. A wide net that needs human curation — it includes false positives.")
    people = base_record("wikidata/people", collection, group, "People", "Candidate people (A–Z)", "TXT",
                         "https://www.wikidata.org/", note)
    people.update(filename="wikidata-candidate-people.txt",
                  quality="One line per person: name · dates · description · occupations · Wikipedia count · Wikidata id. "
                          "Sorted by name; not ranked.")
    people["completeness"] = review(f"{len(rows):,} Wikidata records for 10,993 crawled titles; 47 titles had no Wikidata item.")
    write_text(people, f"{len(rows):,} candidate people\n\n" + "\n".join(lines))
    theologians = base_record("wikidata/list", collection, group, "People", "Wikipedia: List of Christian theologians",
                              "TXT", "https://en.wikipedia.org/wiki/List_of_Christian_theologians",
                              "The Wikipedia list page as wikitext, markup stripped. CC BY-SA 4.0, Wikipedia contributors.")
    theologians.update(filename="wikipedia-list-of-christian-theologians.txt")
    theologians["completeness"] = review("Saved whole as one page.")
    write_text(theologians, strip_wikitext((folder / "list-of-christian-theologians.wikitext").read_text(encoding="utf-8")))
    for r in (people, theologians):
        r["bytes"] = r["textBytes"]
    return [people, theologians]


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    corpus = parser.parse_args().corpus.resolve()
    if not (corpus / ".corpus-root").exists():
        raise SystemExit(f"Not a corpus folder (no .corpus-root marker): {corpus}")
    verification = load_json(corpus / "volume-verification.json")
    (OUT / "texts").mkdir(parents=True, exist_ok=True)
    records = mcclintock(corpus, verification) + catholic(corpus) + wikidata(corpus)
    for r in records:
        r["addedFrom"] = "christian-writers-corpus"
    ADDITIONS.write_text(json.dumps({
        "source": "christian-writers-corpus (Fortress job 727d55dd, collected 2026-10-16)",
        "generatedAt": datetime.now(timezone.utc).isoformat(), "records": records},
        ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(records)} records, {sum(r.get('textBytes') or 0 for r in records) / 1e6:.1f} MB of text -> {ADDITIONS}")


if __name__ == "__main__":
    main()
