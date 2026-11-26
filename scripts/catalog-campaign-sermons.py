"""Sermons campaign: catalogue newly acquired sermons, one work per sermon, with the main text the source prints.

Reads content/library/reports/sermons-campaign/<preacher>/acquisition-manifest.json (written by the acquisition
runs; held files under ../sources/library with provenance.json) and writes work / edition / asset records to
content/library/catalog/. A collected volume (Moody's Gutenberg books) is one work + edition + asset, and each
sermon in it is a work that `is-part-of` the volume. A passage is recorded only where the source prints one;
misprinted references, unbounded ranges ("beginning at the fifth verse") and quotations printed without a
reference are listed in the run report, never looked up.

Usage (from Website/): python -X utf8 scripts/catalog-campaign-sermons.py wesley moody maclaren [graham]
"""

import argparse
import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.paths import SITE, SOURCES  # noqa: E402
from bible.study_refs import RefError, Verses  # noqa: E402

_spec = importlib.util.spec_from_file_location("sermon_passages", Path(__file__).with_name("sermon-passages.py"))
sermon_passages = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sermon_passages)

LIBRARY = SITE / "content" / "library"
CATALOG = LIBRARY / "catalog"
REPORTS = LIBRARY / "reports" / "sermons-campaign"
FORMATS = json.loads((LIBRARY / "vocabulary.json").read_text(encoding="utf-8"))["formats"]  # else "other", e.g. "ThML (XML)"
TODAY = "2026-10-08"
REVIEW = dict(date=TODAY, reviewer="Claude", kind="ai-assisted", scope="Sermons campaign: identity, held file and printed main text; not a full-text proofread.")

PREACHERS = {
    "wesley": dict(author="author-john-wesley", era="eighteenth-century", rights="public-domain",
                   edition="Wesley Center Online HTML, Thomas Jackson edition (1872)", policy="https://wesley.nnu.edu/"),
    "moody": dict(author="author-d-l-moody", era="nineteenth-century", rights="public-domain",
                  edition="Project Gutenberg HTML", policy="https://www.gutenberg.org/policy/terms_of_use.html"),
    "graham": dict(author="author-billy-graham", era="twentieth-century", rights="restricted-license",
                   edition="Billy Graham Evangelistic Association published sermon", policy="https://billygraham.org/"),
    "macarthur": dict(author="author-john-macarthur", era="twentieth-century", rights="restricted-license",
                      edition="Grace to You official sermon transcript", policy="https://www.gty.org/"),
    "maclaren": dict(author="author-alexander-maclaren", era="nineteenth-century", rights="public-domain",
                     edition="CCEL Expositions of Holy Scripture", policy="https://ccel.org/", quoted_heading=True,
                     catalogued="2026-11-26", quality="Ten random entries checked against the held file when catalogued."),
    "morgan": dict(author="author-g-campbell-morgan", era="twentieth-century", rights="public-domain",
                   edition="Historic printed sermon text", policy="https://www.gutenberg.org/policy/terms_of_use.html"),
}

# Moody names some passages in words; each conversion is the sermon's own wording, written out so it can be checked.
PROSE = {
    "the 23d chapter of Luke": "Luke 23",
    "Paul’s first letter to the Corinthians, thirteenth chapter": "1 Corinthians 13",
    "the twenty-fifth chapter of Exodus": "Exodus 25",
    "the first epistle of John, fifth chapter, fourth and fifth verses": "1 John 5:4-5",
    "the seventh chapter of Genesis, first verse": "Genesis 7:1",
    "the fifth chapter of Daniel": "Daniel 5",
    "the twenty-second chapter of Genesis": "Genesis 22",
    "the eighteenth chapter of the Gospel of St. Luke": "Luke 18",
}
MISPRINT = re.compile(r"misprint|th(e|ese) words are at|likely .{0,20}(error|typo)", re.I)
# Misprints the acquisition run did not flag, found by checking each quoted text against the KJV verses its printed
# reference names; listed like the flagged ones, never corrected.
UNFLAGGED_MISPRINTS = {
    "https://ccel.org/ccel/maclaren/iicor_tim/iicor_tim.iii.v.i.html": "'1 Tim. 1. 6', but the words quoted are 1 Timothy 1:5",
    "https://ccel.org/ccel/maclaren/gen_num/gen_num.iii.iv.xiii.html": "'NUM. xiii. 8', but 'Balaam also the son of Beor they slew' is Numbers 31:8",
    "https://ccel.org/ccel/maclaren/matt2/matt2.iii.xliv.html": "'1 COR. xv. 4', but 'seen of above five hundred brethren' is 1 Corinthians 15:6",
    "https://ccel.org/ccel/maclaren/ezek_matt1/ezek_matt1.iii.l.html": "'MATT. viii. 14', but the words quoted are Matthew 8:1-4",
}


def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save(record):
    folder = {"work": "works", "edition": "editions", "asset": "assets"}[record["kind"]]
    path = CATALOG / folder / f"{record['id']}.json"
    path.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def common(kind, ident, notes=None):
    return {"$schema": "../../schema.json", "schemaVersion": 1, "kind": kind, "id": ident, "editorialState": "catalogued",
            "notes": notes or [], "reviews": [REVIEW]}


def ev(url, locator, note):
    return {"url": url, "locator": locator, "note": note, "checkedOn": TODAY}


def roman(text):
    values, total = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100}, 0
    digits = [values[c] for c in text.lower()]
    for i, value in enumerate(digits):
        total += -value if i + 1 < len(digits) and value < digits[i + 1] else value
    return total


def printed_reference(main_text):
    """The reference part of what the source printed: quotations dropped, Roman chapters and "2.8" made "2:8"."""
    text = re.sub(r"“[^”]*”", " ", main_text).replace("—", " ")
    text = text.strip().strip("().").strip()
    text = PROSE.get(text, text)
    text = re.sub(r"^[A-Z]{3,}\b", lambda m: m.group(0).title(), text)  # "NUMBERS xxiii. 10"
    text = re.sub(r"\b([ivxlc]+)\.\s*(?=\d)", lambda m: f"{roman(m.group(1))}:", text, flags=re.I)
    text = re.sub(r"(?<=[a-z.] )([ivxlc]+)\.?$", lambda m: str(roman(m.group(1))), text, flags=re.I)
    return re.sub(r"(\d)\.(\d)", r"\1:\2", text).strip(" .)")


def heading_references(heading):
    """Maclaren prints each text in full, its apostrophes and all, then its reference, one line per text
    ("‘…spider’s web.’—JOB viii. 14."): each line's reference as printed, version notes ("(R.V.)") dropped."""
    found = []
    for line in heading.splitlines():
        parts = re.split(r"—|’[\s.]*(?=[1-3]?\s?[A-Z]{2})", line)  # "…’ACTS iv. 26" prints no dash
        reference = re.sub(r"\(?\b[AR]\.\s?V\.(?: margin)?\)?", " ", parts[-1]).strip(" .()")
        if len(parts) > 1 and re.search(r"\d|\b[ivxlc]+\b", reference):
            found.append(reference)
    return found


def roman_chapter(reference):
    """One heading reference evened out for printed_reference. Its chapters are always Roman, so the printer's slips
    are read as such ("MATT, v. 5", "MATT.xxii. 34", "ACTS xii 13", "ISAIAH liii, 2") and an Arabic number after ";"
    is more verses ("1 COR. xv. 20, 21; 50-58"); a one-chapter book prints only the verse ("PHILEMON 9")."""
    text = re.sub(r"\b[A-Z]{2,}\b", lambda m: m.group(0).title(), re.sub(r"^ST\.\s+", "", reference))
    text = re.sub(r"^([1-3]?\s?[A-Za-z]+)[.,]\s*(?=[ivxlc]+\b)", r"\1. ", text)
    text = re.sub(r"\b([ivxlc]+)[.,]?\s+(?=\d)", r"\1. ", text)
    text = re.sub(r";\s*(?=\d+(?:-\d+)?\s*(?:[;,]|$))", ", ", text)
    return re.sub(r"^((?:Philemon|Jude|Obadiah|[23] John)\.?)\s+(?=\d+\D*$)", r"\1 1:", text)


def main_text(entry, verses, locator, quoted_heading=False):
    """(passages, problem): passages only from a printed reference; otherwise the reason it is left unplaced."""
    printed = entry.get("mainText")
    if not printed:
        return [], "no text stated by the source"
    if MISPRINT.search(f"{entry.get('mainTextLocator') or ''} {entry.get('notes') or ''}"):
        return [], f"printed reference flagged as a misprint: {printed}"
    if entry["url"] in UNFLAGGED_MISPRINTS:
        return [], f"printed reference is a misprint: {UNFLAGGED_MISPRINTS[entry['url']]}"
    if quoted_heading:
        lines = heading_references(printed)
        if not lines:
            return [], f"no reference printed after the quoted text: {printed[:80]}"
        printed, pieces = "; ".join(lines), [roman_chapter(line) for line in lines]
        if any(not re.search(r"\b[ivxlc]+\b|:", piece) or re.search(r"\d\.\s*\d", piece) for piece in pieces):  # "1 Tim. 1. 6"
            return [], f"chapter not printed in Roman numerals, as everywhere else in these volumes: {printed}"
        references = [printed_reference(piece) for piece in pieces]  # one line, one text: no book carries over
    else:
        references = [printed_reference(printed)]
    reference = "; ".join(references)
    if not re.search(r"\d", reference):
        return [], f"no reference printed (quotation or unbounded range): {printed[:80]}"
    try:
        found = [p for piece in references for p in sermon_passages.passages(piece, verses, locator)]
    except RefError as error:
        return [], f"{printed[:80]}: {error}"
    modern = re.fullmatch(r"[1-3]? ?[A-Z][a-z]+\.? \d+:\d+(?:[-–]\d+)?(?:, \d+)*", printed)
    for p in found:  # show a modern reference; keep the source's own wording in the locator
        p["reference"] = printed if modern else reference
        p["locator"] += "" if modern else f"; printed: {printed[:120]}"
    return found, None


def delivery(entry, url):
    date = entry.get("date")
    if not date or not date.get("value"):
        return []
    precision = {"circa-year": "circa"}.get(date.get("precision"), date.get("precision") or "unknown")
    return [dict(event="delivery", value=date["value"], precision=precision,
                 label=date.get("label"), evidence=[ev(url, "Printed with the sermon", "Preaching date as printed by the source.")])]


def sermon_work(ident, entry, cfg, passages, related=None):
    url = entry["url"]
    notes = [n for n in (entry.get("series"), entry.get("place") and f"Place: {entry['place']}", entry.get("notes")) if n]
    work = common("work", ident, notes)
    work.update(title=entry["title"], alternateTitles=[], creators=[dict(authorId=cfg["author"], role="preacher")],
                genre="sermon", role="core-teaching", collections=["sermons"], subjects=[], occasions=[],
                audiences=["general"], depth="unknown", era=cfg["era"], dates=delivery(entry, url), passages=passages,
                related=related or [], externalIds=dict(officialDestination=[url]),
                evidence=[ev(url, entry.get("locator") or "Sermon page", "Acquired by the sermons campaign; see its acquisition manifest.")])
    return work


def edition(ident, work_id, cfg, url):
    record = common("edition", ident)
    record.update(workId=work_id, label=cfg["edition"], languages=["en"], contributors=[], publisher=None, dates=[],
                  abridgment="unknown", modernization="unknown", evidence=[ev(url, "Held source file", "Edition as acquired.")])
    return record


def asset(asset_id, edition_id, cfg):
    prov_file = next(SOURCES.glob(f"library/*/{asset_id}/provenance.json"))
    prov = read(prov_file)
    actions = {k: "unknown" for k in ["download", "host", "redistribute", "adapt", "transcribe", "embed", "indexMetadata", "indexFullText"]}
    actions.update(download="allowed", indexMetadata="allowed")
    record = common("asset", asset_id)
    form = prov.get("format") or "html"
    form = {"txt": "text"}.get(form, form)
    record.update(editionId=edition_id, sourceId=prov_file.parent.parent.name, canonicalUrl=prov["url"], finalUrl=prov.get("finalUrl"),
                  format=form if form in FORMATS else "other", mediaKind="text", acquisitionStatus="downloaded", storage="raw",
                  relativePath=prov["relativePath"], sha256=prov["sha256"], byteCount=prov["byteCount"], mimeType=prov.get("mimeType"),
                  retrievedAt=re.sub(r"\+00:00$", "Z", prov["retrievedAt"]),
                  rights=dict(category=cfg["rights"], jurisdiction="United States", licenseId=None, licenseUrl=prov.get("policyUrl") or cfg["policy"],
                              attribution="Author and host credited; the site links to the original page.", conditions=[], conditionsMet=False,
                              actions=actions, evidence=[ev(prov["url"], "Host terms recorded in the acquisition TERMS.md", "Private noncommercial reading; no public hosting.")],
                              unresolved=["No public hosting or public full-text index; the site links to the original."], review=REVIEW),
                  fullTextIndexed=False,
                  processing=dict(parentAssetId=None, method="none", tool=None, toolVersion=None, parameters=None, date=None, note="Original bytes unchanged."),
                  quality=dict(state="sampled", reviewedBy="Claude", reviewedOn=TODAY, note=cfg.get("quality", "Ten random entries checked against the held file at acquisition.")))
    return record


def volume_key(name, asset_id):
    """Moody's volumes are keyed by Gutenberg number (pg30449); later preachers by the whole asset suffix."""
    return asset_id.rsplit("-", 1)[-1] if name == "moody" else asset_id.removeprefix(f"asset-sermons-{name}-")


def catalogue(name, verses):
    global TODAY, REVIEW  # records carry the day their preacher was catalogued, not the campaign's first day
    cfg, manifest = PREACHERS[name], read(REPORTS / name / "acquisition-manifest.json")
    TODAY = cfg.get("catalogued", "2026-10-08")
    REVIEW = dict(REVIEW, date=TODAY)
    counts, unplaced, volumes = Counter(), [], {}
    width = max(3, len(str(len(manifest["sermons"]))))
    per_file = Counter(e.get("assetId") for e in manifest["sermons"] if e.get("book"))
    for index, entry in enumerate(manifest["sermons"], 1):
        number = entry.get("number") or index
        ident = f"work-sermons-{name}-{number:0{width}d}"
        passages, problem = main_text(entry, verses, f"{entry['url']}; {entry.get('mainTextLocator') or 'printed text'}",
                                      cfg.get("quoted_heading", False))
        if problem:
            unplaced.append(dict(workId=ident, title=entry["title"], reason=problem))
        counts["placed" if passages else "listed without a passage"] += 1
        asset_id = entry.get("assetId")
        held = asset_id and next(SOURCES.glob(f"library/*/{asset_id}/provenance.json"), None)
        if entry.get("book") and per_file[asset_id] > 1:  # a sermon inside a held volume of several
            volume = volumes.setdefault(asset_id, dict(title=entry["book"], url=entry["url"], members=[]))
            volume["members"].append(ident)
            related = [dict(relation="is-part-of", targetId=f"work-sermons-{name}-book-{volume_key(name, asset_id)}", locator=entry.get("locator"))]
            save(sermon_work(ident, entry, cfg, passages, related))
        else:
            save(sermon_work(ident, entry, cfg, passages))
            if held and asset_id.startswith(f"asset-sermons-{name}"):  # reused older holdings keep their own records
                save(edition(f"edition-sermons-{name}-{number:0{width}d}", ident, cfg, entry["url"]))
                save(asset(asset_id, f"edition-sermons-{name}-{number:0{width}d}", cfg))
    for asset_id, volume in volumes.items():
        key = volume_key(name, asset_id)
        work = common("work", f"work-sermons-{name}-book-{key}")
        work.update(title=re.sub(r"\s*\((?:Project Gutenberg #\d+|CCEL)\)$", "", volume["title"]), alternateTitles=[],
                    creators=[dict(authorId=cfg["author"], role="author")], genre="collected-works", role="core-teaching",
                    collections=["sermons"], subjects=[], occasions=[], audiences=["general"], depth="unknown", era=cfg["era"],
                    dates=[], passages=[], related=[dict(relation="has-part", targetId=m, locator=None) for m in volume["members"]],
                    externalIds=dict(officialDestination=[volume["url"]]), evidence=[ev(volume["url"], "Book landing page", "Held as one file; sermons catalogued separately.")])
        save(work)
        save(edition(f"edition-sermons-{name}-book-{key}", work["id"], cfg, volume["url"]))
        save(asset(asset_id, f"edition-sermons-{name}-book-{key}", cfg))
        counts["volumes"] += 1
    report = dict(preacher=name, generatedBy="scripts/catalog-campaign-sermons.py", generatedOn=TODAY, counts=dict(counts), unplaced=unplaced)
    (REPORTS / name / "catalogue-run.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("preachers", nargs="+", choices=sorted(PREACHERS))
    args = parser.parse_args()
    verses = Verses(SITE / "data")
    for name in args.preachers:
        report = catalogue(name, verses)
        print(name, report["counts"], "unplaced:", len(report["unplaced"]))


if __name__ == "__main__":
    main()
