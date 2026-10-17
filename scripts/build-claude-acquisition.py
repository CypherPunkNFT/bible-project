"""Build version 2 ("Claude data acquisition") of the /data_acquisition desk.

Reads the Christian writers corpus (D:/FortressOfSolitude/christian-writers-corpus, Fortress
job 727d55dd, 16 Oct 2026) and writes public/data_acquisition/claude/catalogue.json plus one
plain-text reading file per volume under claude/texts/. The page script is a copy of version 1's
desk.js, so the record shape here matches the one that version 1's catalogue uses.

Copyrighted pages (editorial lists, the Christian History Institute issue) are listed with their
source link only; their text is not republished.

Usage: python scripts/build-claude-acquisition.py [--corpus PATH]
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
OUT = WEBSITE / "public" / "data_acquisition" / "claude"
DEFAULT_CORPUS = Path("D:/FortressOfSolitude/christian-writers-corpus")
MAX_TEXT_BYTES = 24 * 1024 * 1024  # Cloudflare Pages refuses files over 25 MiB

ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9,
         "X": 10, "XI": 11, "XII": 12, "XIII": 13}


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


def review(reason, coverage="pending", known_gap=False, evidence=False, saved=True):
    """Completeness block in version 1's shape. Nothing here has passed a full-coverage check."""
    result = {"status": "INCOMPLETE", "reviewState": "known-gap" if known_gap else "unverified",
              "reason": reason,
              "steps": {"saved": "done" if saved else "pending",
                        "coverage": "blocked" if known_gap else coverage,
                        "compared": "pending", "complete": "pending"}}
    if evidence:
        result["evidenceUrl"] = "./volume-verification.json"
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
        span = spans.get(volume, {})
        label = f"Volume {volume}" + (" (supplement)" if volume > 10 else "")
        text_file = meta_path.with_name(meta_path.name.replace(".metadata.json", "_djvu.txt"))
        r = base_record(f"mcclintock/{volume}", "McClintock & Strong — Cyclopaedia", "McClintock-Strong",
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
            coverage="sampled", evidence=True)
        copy_text(r, text_file)
        records.append(r)
    return records


# ── New Schaff-Herzog ────────────────────────────────────────────────────────

def schaff(corpus, verification):
    spans = {s["volume"]: s for s in verification["Schaff-Herzog (Internet Archive volumes)"]["spans"]}
    collection, group = "New Schaff–Herzog Encyclopedia", "Schaff-Herzog"
    records = []
    for path in sorted((corpus / "schaff-herzog" / "ccel").glob("encyc*.txt")):
        volume = int(path.stem[5:])
        r = base_record(f"schaff/ccel/{volume}", collection, group, "Encyclopedias", f"Volume {volume}", "TXT",
                        f"https://www.ccel.org/ccel/schaff/encyc{volume:02d}",
                        "CCEL proofread transcription. Public domain text (1908–1914); CCEL's own markup was not used.")
        r.update(bytes=path.stat().st_size, filename=f"schaff-herzog-volume-{volume:02d}.txt", readPriority=2,
                 quality="Proofread transcription (CCEL), not raw OCR.",
                 representationLabel="CCEL proofread text")
        r["completeness"] = review("CCEL proofread transcription, saved whole. Full article coverage against "
                                   "the printed volume has not been verified.")
        copy_text(r, path)
        records.append(r)
    for meta_path in sorted((corpus / "schaff-herzog" / "internet-archive").glob("vol*.metadata.json")):
        records.extend(schaff_ia_volume(corpus, meta_path, spans, collection, group))
    return sorted(records, key=lambda r: int(r["subtitle"].split()[1]))


def schaff_ia_volume(corpus, meta_path, spans, collection, group):
    meta = load_json(meta_path)
    volume = int(meta_path.name[3:5])
    span = spans.get(volume, {})
    text_file = meta_path.with_name(meta_path.name.replace(".metadata.json", "_djvu.txt"))
    r = base_record(f"schaff/ia/{volume}", collection, group, "Encyclopedias", f"Volume {volume}", "TXT",
                    f"https://archive.org/details/{meta['identifier']}",
                    f"Internet Archive OCR, item {meta['identifier']} ({meta.get('year') or 'year not recorded'}). "
                    "Taken here because CCEL never transcribed this volume.")
    r.update(bytes=text_file.stat().st_size, filename=f"schaff-herzog-volume-{volume:02d}-archive-ocr.txt",
             readPriority=1, quality="Raw OCR of 1900s typography.", representationLabel="Internet Archive OCR")
    r["completeness"] = review(
        f"Volume identity checked on the title page: \"{span.get('volume_statement', '?')}\" read "
        f"{span.get('statement_occurrences', '?')} times, printed span {span.get('printed_alphabetical_span', '?')}. "
        "Page-by-page coverage has not been verified.", coverage="sampled", evidence=True)
    copy_text(r, text_file)
    stub = base_record(f"schaff/ccel-stub/{volume}", collection, group, "Encyclopedias", f"Volume {volume}", "XML",
                       f"https://www.ccel.org/ccel/s/schaff/encyc{volume:02d}.xml",
                       "CCEL returns a page-index placeholder for this volume, with no article text.",
                       status="failed")
    stub["problem"] = "Placeholder only (about 130 KB of page index). Replaced by the Internet Archive OCR."
    return [r, stub]


# ── Wace & Smith ─────────────────────────────────────────────────────────────

def wace(corpus):
    folder = corpus / "wace-smith-dictionary-of-christian-biography"
    collection, group = "Wace & Smith — Dictionary of Christian Biography", "Christian-Biography"
    note = "Complete work (1877–1887) from CCEL. Public domain text."
    text = base_record("wace/txt", collection, group, "Encyclopedias", "Complete work", "TXT",
                       "https://www.ccel.org/ccel/wace/biodict", note)
    text.update(bytes=(folder / "biodict.txt").stat().st_size, filename="wace-smith-biodict.txt", readPriority=1,
                quality="CCEL plain-text rendering.")
    text["completeness"] = review("Saved as one CCEL text. Entry-by-entry coverage has not been verified.")
    copy_text(text, folder / "biodict.txt")
    records = [text]
    for fmt, name in (("PDF", "biodict.pdf"), ("XML", "biodict.xml")):
        r = base_record(f"wace/{fmt}", collection, group, "Encyclopedias", "Complete work", fmt,
                        f"https://www.ccel.org/ccel/w/wace/{name}",
                        f"Held in the corpus as {name}; the reading text above comes from the TXT rendering.")
        r["bytes"] = (folder / name).stat().st_size
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
    collection, group = "The Catholic Encyclopedia (1913)", "Catholic-Encyclopedia"
    records = []
    for volume in sorted(volumes, key=lambda v: (v == 0, v)):
        pages = sorted(volumes[volume], key=lambda p: p[0].lower())
        label = "Front matter and contents pages" if volume == 0 else f"Volume {volume}" + (" (index)" if volume == 16 else "")
        body = "\n\n\n".join(f"■ {title}" + (f"\n({contributor})" if contributor else "") + f"\n\n{text}"
                             for title, contributor, text in pages)
        r = base_record(f"catholic/{volume}", collection, group, "Encyclopedias", label, "TXT",
                        "https://en.wikisource.org/wiki/Catholic_Encyclopedia_(1913)",
                        f"{len(pages):,} Wikisource pages, from the English Wikisource dump. 1913 text public domain; "
                        "Wikisource markup CC BY-SA 4.0 (attribution: English Wikisource contributors).")
        r.update(filename=f"catholic-encyclopedia-{'front-matter' if volume == 0 else f'volume-{volume:02d}'}.txt",
                 quality="Wiki markup stripped automatically; tables and images are dropped. Articles are in title order.")
        missing = transcluded[volume]
        gap = (f"{missing:,} of {len(pages):,} articles are only pointers to Wikisource's scanned-page transcription, "
               "which this corpus did not collect; they are marked in the text. " if missing else "")
        r["completeness"] = review(
            gap + f"Every Catholic Encyclopedia page in the full Wikisource dump was taken ({redirects:,} redirects "
            "skipped). Whether Wikisource holds every article of the printed volume has not been checked.",
            coverage="done" if volume else "pending", known_gap=bool(missing))
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
    collection, group = "Wikipedia & Wikidata — candidate people", "Wikidata"
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


# ── Reference pages held but not republished ─────────────────────────────────

def editorial_lists(manifest):
    source = next(s for s in manifest["sources"] if s["source"].startswith("Editorial ranking lists"))
    records = []
    for page in source["per_page_notes"]:
        slug = page["slug"].split(".wayback")[0]
        r = base_record(f"lists/{slug}", "Editorial ranking lists", "Editorial-lists", "Scholar lists",
                        slug.replace("-", " ").capitalize(), "HTML", page["url"],
                        f"{page['note']} Held privately in the corpus as served; the publisher's copyright has no "
                        "reuse grant, so the page is not republished here.")
        r["bytes"] = page["bytes"]
        r["completeness"] = review("Held as a saved web page only; no reading text is published.", saved=False)
        records.append(r)
    return records


def held_elsewhere(corpus):
    chi = base_record("chi/116", "Christian History issue 116 — Writings That Changed Church History", "CHI",
                      "Publisher references", "Full issue (Top 25 classics)", "PDF",
                      "https://christianhistoryinstitute.org/st/magazine_pdfs/ch-116sec.pdf",
                      "The publisher's free full-issue PDF. © Christian History Institute, all rights reserved, so "
                      "it is held privately and not republished here.")
    chi["bytes"] = (corpus / "christian-history-institute" / "ch-116-writings-that-changed-church-history.pdf").stat().st_size
    chi["completeness"] = review("Held as the publisher's PDF only; no reading text is published.", saved=False)
    ct = base_record("ct/books-of-the-century", "Christianity Today — Books of the Century", "Christianity-Today",
                     "Publisher references", "Books of the Century (2000) and Top 50 (2006)", "HTML",
                     "https://www.christianitytoday.com/2000/04/books-of-century/",
                     "Not fetched by policy: the site's robots.txt names Claude and other AI crawlers in a "
                     "Disallow: / rule. A person needs to collect it by hand.", status="identified")
    ct["completeness"] = review("Not collected: manual collection required.", saved=False)
    return [chi, ct]


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    corpus = parser.parse_args().corpus.resolve()
    if not (corpus / ".corpus-root").exists():
        raise SystemExit(f"Not a corpus folder (no .corpus-root marker): {corpus}")
    manifest = load_json(corpus / "manifest.json")
    verification = load_json(corpus / "volume-verification.json")
    texts = OUT / "texts"
    if texts.exists():
        shutil.rmtree(texts)  # generated output only; rebuilt in full below
    texts.mkdir(parents=True)
    shutil.copyfile(corpus / "volume-verification.json", OUT / "volume-verification.json")
    records = (schaff(corpus, verification) + mcclintock(corpus, verification) + catholic(corpus)
               + wace(corpus) + wikidata(corpus) + editorial_lists(manifest) + held_elsewhere(corpus))
    now = datetime.now(timezone.utc).isoformat()
    catalogue = {
        "schema": 1, "generatedAt": now, "receiptUpdatedAt": manifest["built"],
        "scope": "Christian writers corpus, collected 16 October 2026. Counts are files/representations, not books or authors.",
        "activity": "No downloads running. This page does not start or retry downloads.",
        "records": records,
        "completenessReview": {
            "updatedAt": now,
            "scope": "Volume identity is checked for McClintock & Strong and the Internet Archive Schaff–Herzog volumes; "
                     "page-by-page coverage is not yet checked for any work."},
    }
    (OUT / "catalogue.json").write_text(json.dumps(catalogue, ensure_ascii=False, indent=1), encoding="utf-8")
    with_text = [r for r in records if r.get("textUrl")]
    print(f"{len(records)} records, {len(with_text)} reading texts, "
          f"{sum(r['textBytes'] for r in with_text) / 1e6:.1f} MB -> {OUT}")


if __name__ == "__main__":
    main()
