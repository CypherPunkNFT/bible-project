"""Sermons campaign: catalogue newly acquired sermons, one work per sermon, with the main text the source prints.

Reads content/library/reports/sermons-campaign/<preacher>/acquisition-manifest.json (written by the acquisition
runs; held files under ../sources/library with provenance.json) and writes work / edition / asset records to
content/library/catalog/. A collected volume (Moody's Gutenberg books) is one work + edition + asset, and each
sermon in it is a work that `is-part-of` the volume. A passage is recorded only where the source prints one;
misprinted references, unbounded ranges ("beginning at the fifth verse") and quotations printed without a
reference are listed in the run report, never looked up.

Usage (from Website/): python -X utf8 scripts/catalog-campaign-sermons.py wesley moody [graham]
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
TODAY = "2026-10-08"
REVIEW = dict(date=TODAY, reviewer="Claude", kind="ai-assisted", scope="Sermons campaign: identity, held file and printed main text; not a full-text proofread.")

PREACHERS = {
    "wesley": dict(author="author-john-wesley", source="source-wesley-center", era="eighteenth-century", rights="public-domain",
                   edition="Wesley Center Online HTML, Thomas Jackson edition (1872)", policy="https://wesley.nnu.edu/"),
    "moody": dict(author="author-d-l-moody", source="source-gutenberg", era="nineteenth-century", rights="public-domain",
                  edition="Project Gutenberg HTML", policy="https://www.gutenberg.org/policy/terms_of_use.html"),
    "graham": dict(author="author-billy-graham", source="source-billy-graham", era="twentieth-century", rights="restricted-license",
                   edition="Billy Graham Evangelistic Association published sermon", policy="https://billygraham.org/"),
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


def main_text(entry, verses, locator):
    """(passages, problem): passages only from a printed reference; otherwise the reason it is left unplaced."""
    printed = entry.get("mainText")
    if not printed:
        return [], "no text stated by the source"
    if MISPRINT.search(f"{entry.get('mainTextLocator') or ''} {entry.get('notes') or ''}"):
        return [], f"printed reference flagged as a misprint: {printed}"
    reference = printed_reference(printed)
    if not re.search(r"\d", reference):
        return [], f"no reference printed (quotation or unbounded range): {printed[:80]}"
    try:
        found = sermon_passages.passages(reference, verses, locator)
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
    prov = read(next(SOURCES.glob(f"library/*/{asset_id}/provenance.json")))
    actions = {k: "unknown" for k in ["download", "host", "redistribute", "adapt", "transcribe", "embed", "indexMetadata", "indexFullText"]}
    actions.update(download="allowed", indexMetadata="allowed")
    record = common("asset", asset_id)
    record.update(editionId=edition_id, sourceId=cfg["source"], canonicalUrl=prov["url"], finalUrl=prov.get("finalUrl"),
                  format=prov.get("format") or "html", mediaKind="text", acquisitionStatus="downloaded", storage="raw",
                  relativePath=prov["relativePath"], sha256=prov["sha256"], byteCount=prov["byteCount"], mimeType=prov.get("mimeType"),
                  retrievedAt=re.sub(r"\+00:00$", "Z", prov["retrievedAt"]),
                  rights=dict(category=cfg["rights"], jurisdiction="United States", licenseId=None, licenseUrl=prov.get("policyUrl") or cfg["policy"],
                              attribution="Author and host credited; the site links to the original page.", conditions=[], conditionsMet=False,
                              actions=actions, evidence=[ev(prov["url"], "Host terms recorded in the acquisition TERMS.md", "Private noncommercial reading; no public hosting.")],
                              unresolved=["No public hosting or public full-text index; the site links to the original."], review=REVIEW),
                  fullTextIndexed=False,
                  processing=dict(parentAssetId=None, method="none", tool=None, toolVersion=None, parameters=None, date=None, note="Original bytes unchanged."),
                  quality=dict(state="sampled", reviewedBy="Claude", reviewedOn=TODAY, note="Ten random entries checked against the held file at acquisition."))
    return record


def catalogue(name, verses):
    cfg, manifest = PREACHERS[name], read(REPORTS / name / "acquisition-manifest.json")
    counts, unplaced, volumes = Counter(), [], {}
    for index, entry in enumerate(manifest["sermons"], 1):
        number = entry.get("number") or index
        ident = f"work-sermons-{name}-{number:03d}"
        passages, problem = main_text(entry, verses, f"{entry['url']}; {entry.get('mainTextLocator') or 'printed text'}")
        if problem:
            unplaced.append(dict(workId=ident, title=entry["title"], reason=problem))
        counts["placed" if passages else "listed without a passage"] += 1
        asset_id = entry.get("assetId")
        held = asset_id and next(SOURCES.glob(f"library/*/{asset_id}/provenance.json"), None)
        if entry.get("book"):  # a sermon inside a held volume
            volume = volumes.setdefault(asset_id, dict(title=entry["book"], url=entry["url"], members=[]))
            volume["members"].append(ident)
            related = [dict(relation="is-part-of", targetId=f"work-sermons-{name}-book-{asset_id.rsplit('-', 1)[-1]}", locator=entry.get("locator"))]
            save(sermon_work(ident, entry, cfg, passages, related))
        else:
            save(sermon_work(ident, entry, cfg, passages))
            if held and asset_id.startswith(f"asset-sermons-{name}"):  # reused older holdings keep their own records
                save(edition(f"edition-sermons-{name}-{number:03d}", ident, cfg, entry["url"]))
                save(asset(asset_id, f"edition-sermons-{name}-{number:03d}", cfg))
    for asset_id, volume in volumes.items():
        key = asset_id.rsplit("-", 1)[-1]
        work = common("work", f"work-sermons-{name}-book-{key}")
        work.update(title=re.sub(r"\s*\(Project Gutenberg #\d+\)$", "", volume["title"]), alternateTitles=[],
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
