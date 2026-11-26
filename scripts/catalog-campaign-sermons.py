"""Sermons campaign: catalogue newly acquired sermons, one work per sermon, with the main text the source prints.

Reads content/library/reports/sermons-campaign/<preacher>/acquisition-manifest.json (written by the acquisition
runs; held files under ../sources/library with provenance.json) and writes work / edition / asset records to
content/library/catalog/. A collected volume (Moody's Gutenberg books) is one work + edition + asset, and each
sermon in it is a work that `is-part-of` the volume. A passage is recorded only where the source prints one;
misprinted references, unbounded ranges ("beginning at the fifth verse") and quotations printed without a
reference are listed in the run report, never looked up.

A run that records rights per held file (Morgan) is followed file by file: an "unknown" never takes the preacher's
public-domain label and gets no asset record. graham-transcripts reads the owner's Graham transcripts report instead.

Usage (from Website/): python -X utf8 scripts/catalog-campaign-sermons.py wesley moody maclaren morgan graham-transcripts [graham]
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
                   edition="Historic printed sermon text", policy="https://www.gutenberg.org/policy/terms_of_use.html",
                   ocr_texts=True, catalogued="2026-11-26", quality="Ten random entries checked against the held file at acquisition; the text is "
                   "archive.org's existing OCR full text, not proofread."),
    # Whisper transcripts of BGEA "Billy Graham Classics" recordings the owner supplied, from their own report; works only:
    # the held files sit below yt-transcripts/ and cannot be moved to the library/<source>/<asset>/ layout an asset needs.
    # "graham" stays free for the billygraham.org pages held under source-billy-graham, which have no manifest yet.
    "graham-transcripts": dict(author="author-billy-graham", era="twentieth-century", rights="restricted-license",
                               edition="Automatic transcription of a BGEA recording", policy="https://billygraham.org/legal-permissions",
                               catalogued="2026-11-26", manifest=LIBRARY / "reports" / "graham-transcripts-20261010" / "acquisition-manifest.json"),
}
TRANSCRIPT_TITLE = re.compile(r"^Billy Graham |\s+Billy Graham Classic(?:s| Sermon)$")
HELD_RIGHTS = {"public-domain", "unknown"}  # the values an acquisition run records per held file

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


# Morgan's main texts are archive.org OCR: each quotation ends in its reference ('…murder." — Exodus xx. 13,'), quotation
# marks come out as " ** *' ^^, and digits as letters ("Exodus xx. i6", "Rev. ii:8-ii"). A reference is read only when every
# piece is legible exactly as printed; one illegible piece leaves the whole sermon unplaced, never corrected.
OCR_QUOTES = re.compile(r"[\"“”‘’*^()—]+|''")
OCR_REFERENCE = re.compile(r"(?:(?P<n>[1-3]|i{1,3}|I{1,3}) )?(?P<book>[A-Z][a-z]+|[A-Z]{2,})\.?,? (?P<chapter>[ivxlc]+|[IVXLC]+|\d+)"
                           r"(?:(?:[.:,] ?| )(?P<verses>\d+(?:-\d+)?[aAbB]?(?:, ?\d+(?:-\d+)?)*(?:; ?\d+(?:-\d+)?)*))?")
OCR_VERSES = re.compile(r"Ver(?:s|se|ses)?\.? (?P<verses>\d+(?:-\d+)?(?:, ?\d+(?:-\d+)?)*)")  # "— Ver. 53": the chapter just named
OCR_PROSE = {"Ephesians, chapter v., 15 to 18, inclusive": "Ephesians 5:15-18"}
# A text printed under the heading that the sermon itself says is not its text.
NOT_THE_TEXT = {
    "https://archive.org/details/lessons-of-the-welsh-revival-g-campbell-morgan": "printed under the heading, but the sermon says 'I have not read these words as a text, but as an introduction to what I desire to say'",
}


def ocr_references(printed):
    """(references, problem) from one OCR main text: the short pieces between quotation marks that look like references."""
    text = re.sub(r"(\w)- (\w)", r"\1\2", printed)  # line-end hyphens: "Jere- miah"
    for prose, reference in OCR_PROSE.items():
        if text.startswith(prose):
            return [reference], None
    found, last = [], None
    for piece in OCR_QUOTES.split(text):
        piece = re.sub(r"\s*R\.\s?V\.?$", "", piece.lstrip(" .,;:-").rstrip(" .,;:"))
        piece = re.sub(r"\s+:\s*", ": ", piece)  # "Rev. ii : 1-7"
        tail = re.search(r"[.?!] ((?:[1-3iI] )?[A-Z][A-Za-z]+\.?,? [ivxlcIVXLC\d]+[.:,]? ?[\d, -]*)$", piece)
        piece = tail.group(1).rstrip(" ,") if tail and len(piece) > 40 else piece  # "…unto His death. Phil. iii. 10." prints no quotes
        if not piece or len(piece) > 40 or not re.search(r"\d|\b[ivxlcIVXLC]+\b", piece) or not re.match(r"[A-Z0-9]|i ", piece):
            continue  # quotation text, not a reference
        relative, match = OCR_VERSES.fullmatch(piece), OCR_REFERENCE.fullmatch(piece)
        if relative and last:
            found.append(f"{last}:{relative['verses']}")
        elif match:
            number = {"i": "1", "ii": "2", "iii": "3"}.get(match["n"].lower(), match["n"]) if match["n"] else None
            chapter = match["chapter"] if match["chapter"].isdigit() else str(roman(match["chapter"]))
            last = " ".join(filter(None, [number, match["book"].title(), chapter]))
            verses_printed = re.sub(r"[aAbB]$", "", match["verses"] or "")  # "1-3A": the whole of verse 3
            found.append(f"{last}:{verses_printed}" if verses_printed else last)
        else:
            return [], f"printed reference not legible in the OCR text: '{piece}'"
    return (found, None) if found else ([], f"no reference printed (quotation only): {printed[:80]}")


def ocr_main_text(entry, verses, locator):
    """(passages, problem) for a Morgan entry, as main_text gives for the others."""
    printed = entry.get("mainText")
    if not printed:
        return [], "no text stated by the source"
    if entry["url"] in NOT_THE_TEXT:
        return [], NOT_THE_TEXT[entry["url"]]
    references, problem = ocr_references(printed)
    if problem:
        return [], problem
    try:
        found = [p for reference in references for p in sermon_passages.passages(reference, verses, locator)]
    except RefError as error:
        return [], f"{'; '.join(references)}: {error}"
    for p in found:  # keep the source's own wording in the locator
        p["locator"] += f"; printed: {' '.join(printed.split()[-12:])}"
    return found, None


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
    if "publication date" in (date.get("label") or ""):  # a weekly's issue date (Morgan's Westminster Pulpit), not a preaching day
        return [dict(event="original-publication", value=date["value"], precision=precision,
                     label=date.get("label"), evidence=[ev(url, "Printed with the sermon", "Issue date as printed by the source; not the preaching date.")])]
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
                evidence=[ev(url, entry.get("locator") or "Sermon page",
                             entry.get("evidenceNote") or "Acquired by the sermons campaign; see its acquisition manifest.")])
    return work


def edition(ident, work_id, cfg, url):
    record = common("edition", ident)
    record.update(workId=work_id, label=cfg["edition"], languages=["en"], contributors=[], publisher=None, dates=[],
                  abridgment="unknown", modernization="unknown", evidence=[ev(url, "Held source file", "Edition as acquired.")])
    return record


def asset(asset_id, edition_id, cfg, rights):
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
                  rights=dict(category=rights, jurisdiction="United States", licenseId=None, licenseUrl=prov.get("policyUrl") or cfg["policy"],
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


def held_rights(manifest):
    """{assetId: (rightsCategory, rightsNote)} where the run recorded rights per held file (Morgan's "sources" is a dict of
    hosts, each with a "held" list); empty when it did not (Wesley has no "sources", Moody and Maclaren a list)."""
    sources = manifest.get("sources")
    held = [h for host in sources.values() if isinstance(host, dict) for h in host.get("held", [])] if isinstance(sources, dict) else []
    rights = {h["assetId"]: (h.get("rightsCategory"), h.get("rightsNote")) for h in held}
    odd = {asset_id: category for asset_id, (category, _) in rights.items() if category not in HELD_RIGHTS}
    if odd:
        sys.exit(f"held files with rights other than {sorted(HELD_RIGHTS)} in the acquisition manifest: {odd}")
    return rights


def transcript_sermons(manifest):
    """The owner's Graham transcripts report (one entry per file) as campaign entries, one per transcript. Nothing is
    taken from the transcript itself: a text Graham announces aloud sits in an unverified machine transcript."""
    sermons = []
    for entry in manifest["files"]:
        if entry["textKind"] != "sermon-transcript":
            continue
        held = Path(entry["path"]).resolve()
        if not held.is_relative_to(SOURCES.resolve()) or not held.is_file():
            sys.exit(f"transcript not held under {SOURCES}: {entry['path']}")
        relative = held.relative_to(SOURCES.resolve()).as_posix()
        sermons.append(dict(
            title=TRANSCRIPT_TITLE.sub("", entry["title"]), url="https://billygraham.org/", mainText=None,
            locator="BGEA's own site; no BGEA page for this sermon was located",
            evidenceNote="Transcript listed in content/library/reports/graham-transcripts-20261010/acquisition-manifest.json.",
            notes=f"Recording title: '{entry['title']}' (BGEA 'Billy Graham Classics'). Automatic transcription "
                  f"({entry['sourceMetadata']['model']}) of a recording the owner supplied; the source records its accuracy as not "
                  "verified, so the text is not Graham's checked verbatim words. Rights: copyright Billy Graham Evangelistic "
                  "Association; held for private study only; the site links to BGEA and does not host the text or audio. "
                  f"Held file: {relative} (sha256 {entry['sha256']})."))
    return sermons


def rights_noted(work, category):
    """A work from a held file whose rights the acquisition could not establish says so; it gets no asset record."""
    if category == "unknown":
        work["notes"].append("Rights of the held file are unknown (no US public-domain basis verified at acquisition); "
                             "no asset record until resolved. See rightsUnknown in this preacher's catalogue-run.json.")
    return work


def catalogue(name, verses):
    global TODAY, REVIEW  # records carry the day their preacher was catalogued, not the campaign's first day
    cfg = PREACHERS[name]
    manifest = read(cfg.get("manifest", REPORTS / name / "acquisition-manifest.json"))
    if "files" in manifest:
        manifest = dict(sermons=transcript_sermons(manifest))
    rights = held_rights(manifest)
    TODAY = cfg.get("catalogued", "2026-10-08")
    REVIEW = dict(REVIEW, date=TODAY)
    counts, unplaced, volumes, unknown = Counter(), [], {}, {}
    width = max(3, len(str(len(manifest["sermons"]))))
    per_file = Counter(e.get("assetId") for e in manifest["sermons"] if e.get("book"))
    for index, entry in enumerate(manifest["sermons"], 1):
        number = entry.get("number") or index
        ident = f"work-sermons-{name}-{number:0{width}d}"
        locator = f"{entry['url']}; {entry.get('mainTextLocator') or 'printed text'}"
        passages, problem = (ocr_main_text(entry, verses, locator) if cfg.get("ocr_texts")
                             else main_text(entry, verses, locator, cfg.get("quoted_heading", False)))
        if problem:
            unplaced.append(dict(workId=ident, title=entry["title"], reason=problem))
        counts["placed" if passages else "listed without a passage"] += 1
        asset_id = entry.get("assetId")
        held = asset_id and next(SOURCES.glob(f"library/*/{asset_id}/provenance.json"), None)
        if rights and asset_id and asset_id not in rights:
            sys.exit(f"{ident}: held file {asset_id} has no rights recorded in the acquisition manifest")
        category, rights_note = rights.get(asset_id, (cfg["rights"], None))
        if category == "unknown":
            unknown.setdefault(asset_id, dict(assetId=asset_id, rightsNote=rights_note, works=[]))["works"].append(ident)
        if entry.get("book") and per_file[asset_id] > 1:  # a sermon inside a held volume of several
            volume = volumes.setdefault(asset_id, dict(title=entry["book"], url=entry["url"], members=[], rights=category))
            volume["members"].append(ident)
            related = [dict(relation="is-part-of", targetId=f"work-sermons-{name}-book-{volume_key(name, asset_id)}", locator=entry.get("locator"))]
            save(rights_noted(sermon_work(ident, entry, cfg, passages, related), category))
        else:
            save(rights_noted(sermon_work(ident, entry, cfg, passages), category))
            if held and asset_id.startswith(f"asset-sermons-{name}"):  # reused older holdings keep their own records
                save(edition(f"edition-sermons-{name}-{number:0{width}d}", ident, cfg, entry["url"]))
                if category != "unknown":  # an unknown never borrows the preacher's rights; the validator refuses it too
                    save(asset(asset_id, f"edition-sermons-{name}-{number:0{width}d}", cfg, category))
    for asset_id, volume in volumes.items():
        key = volume_key(name, asset_id)
        work = common("work", f"work-sermons-{name}-book-{key}")
        work.update(title=re.sub(r"\s*\((?:Project Gutenberg #\d+|CCEL|Internet Archive [^)]+)\)$", "", volume["title"]), alternateTitles=[],
                    creators=[dict(authorId=cfg["author"], role="author")], genre="collected-works", role="core-teaching",
                    collections=["sermons"], subjects=[], occasions=[], audiences=["general"], depth="unknown", era=cfg["era"],
                    dates=[], passages=[], related=[dict(relation="has-part", targetId=m, locator=None) for m in volume["members"]],
                    externalIds=dict(officialDestination=[volume["url"]]), evidence=[ev(volume["url"], "Book landing page", "Held as one file; sermons catalogued separately.")])
        save(rights_noted(work, volume["rights"]))
        save(edition(f"edition-sermons-{name}-book-{key}", work["id"], cfg, volume["url"]))
        if volume["rights"] != "unknown":
            save(asset(asset_id, f"edition-sermons-{name}-book-{key}", cfg, volume["rights"]))
        else:
            unknown[asset_id]["works"].append(work["id"])
        counts["volumes"] += 1
    report = dict(preacher=name, generatedBy="scripts/catalog-campaign-sermons.py", generatedOn=TODAY, counts=dict(counts), unplaced=unplaced)
    if unknown:
        report["rightsUnknown"] = list(unknown.values())
    (REPORTS / name).mkdir(exist_ok=True)
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
