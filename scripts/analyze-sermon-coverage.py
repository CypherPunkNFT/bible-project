"""L05: reproducible metadata coverage audit; no network or content ingestion.

Run from any directory: python -X utf8 scripts/analyze-sermon-coverage.py
Passage classifications in assessments.json are scoped human-readable review inputs,
not automatic judgments inferred from reference frequency or sermon titles.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "content/library"
OUT = LIB / "reports/sermon-coverage"
DATE = "2026-10-05"
CONTAINERS = {
    "work-bullinger-decades": "Aggregate reading record, not one sermon or a complete five-decade inventory.",
    "work-flavel-fountain": "Aggregate sermon-derived collection; individual units not indexed here.",
    "work-whitefield-sermons": "Selected anthology; do not double-count it alongside L03 sermon components.",
}


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def canon(books):
    return [b["num"] * 1_000_000 + c * 1000 + v
            for b in books for c, count in enumerate(b["chapters"], 1)
            for v in range(1, count + 1)]


def span(passage, ids, positions):
    """Use actual canonical verse order, never integer ranges across chapter gaps."""
    start, end = passage.get("start"), passage.get("end")
    if start not in positions or end not in positions or positions[start] > positions[end]:
        raise ValueError(f"Invalid canonical range: {start}-{end}")
    return set(ids[positions[start]:positions[end] + 1])


def collect(works, ids, positions, role):
    by_work, exceptions = {}, []
    for work in works:
        verses = set()
        for p in work.get("passages", []):
            if p.get("role") != role:
                continue
            if p.get("verification") != "verified" or p.get("numberingSystem") != "english":
                exceptions.append({"workId": work["id"], "passage": p, "reason": "Unverified mapping or unsupported numbering"})
                continue
            try:
                verses.update(span(p, ids, positions))
            except ValueError as exc:
                exceptions.append({"workId": work["id"], "passage": p, "reason": str(exc)})
        by_work[work["id"]] = verses
    return by_work, exceptions


def ranges(values):
    """Compact integers without treating a missing chapter/verse as covered."""
    result = []
    for value in sorted(set(values)):
        if result and value == result[-1][1] + 1:
            result[-1][1] = value
        else:
            result.append([value, value])
    return result


def labels(values):
    return ", ".join(str(a) if a == b else f"{a}–{b}" for a, b in ranges(values)) or "—"


def audit_series(series, works):
    results = []
    for s in series:
        members = s["members"]
        ids = [m["workId"] for m in members]
        positions = [m["position"] for m in members]
        expected = s.get("expectedCount")
        missing_positions = sorted(set(range(1, expected + 1)) - set(positions)) if expected is not None else None
        problems = []
        if len(ids) != len(set(ids)):
            problems.append("duplicate work membership")
        if len(positions) != len(set(positions)):
            problems.append("duplicate positions")
        if any(i not in works for i in ids):
            problems.append("unresolved work IDs")
        if expected is not None and len(ids) != expected:
            problems.append("member count differs from expected")
        if missing_positions:
            problems.append("missing catalog positions")
        if expected is not None and any(p < 1 or p > expected for p in positions):
            problems.append("position outside inventory bounds")
        kind = ("whole-biblical-book-pilot" if s["id"].startswith("series-l04-") else
                "published-volume-inventory" if s["id"].startswith("series-spurgeon-") else
                "bounded-historical-collection")
        results.append({"id": s["id"], "title": s["title"], "inventoryKind": kind,
                        "declaredCompleteness": s["completeness"], "expectedCount": expected,
                        "memberCount": len(ids), "missingPositions": missing_positions,
                        "declaredMissing": s.get("missing", []), "problems": problems,
                        "inventoryEvidence": s.get("inventoryEvidence", [])})
    return results


def availability(work_id, works, assets_by_work):
    """A component can be readable inside a parent volume without its own asset."""
    seen, queue, assets = set(), [work_id], {}
    while queue:
        current = queue.pop()
        if current in seen:
            continue
        seen.add(current)
        for a in assets_by_work.get(current, []):
            assets[a["id"]] = a
        queue.extend(r["targetId"] for r in works[current].get("related", [])
                     if r["relation"] == "is-part-of" and r["targetId"] in works)
    if any(a.get("acquisitionStatus") == "downloaded" for a in assets.values()):
        return "downloaded-direct-or-parent"
    if assets:
        return "source-record-only"
    return "no-direct-or-parent-asset-record"


def main():
    books = read(ROOT / "content/apologetics/scripture-index.json")["books"]
    ids = canon(books)
    positions = {v: i for i, v in enumerate(ids)}
    all_works = {w["id"]: w for w in (read(p) for p in sorted((LIB / "catalog/works").glob("*.json")))}
    sermons = [w for w in all_works.values() if w["genre"] == "sermon"]
    units = [w for w in sermons if w["role"] == "core-teaching" and w["id"] not in CONTAINERS]
    units_by_id = {w["id"]: w for w in units}
    authors = {a["id"]: a for a in read(LIB / "authors.json")["authors"]}
    author_ids = {w["id"]: sorted({c["authorId"] for c in w["creators"]
                                 if c["role"] in ("author", "preacher", "speaker")}) for w in units}
    for work_id, creators in author_ids.items():
        if not creators or any(authors[a]["eligibility"] != "eligible" for a in creators):
            raise ValueError(f"Core eligibility needs review: {work_id}")
    main_text, exceptions = collect(units, ids, positions, "main-text")
    exposition, exp_exceptions = collect(units, ids, positions, "substantial-exposition")
    citations, citation_exceptions = collect(units, ids, positions, "citation")
    canonical_exp_works = sum(bool(v) for v in exposition.values())
    reviews = read(OUT / "assessments.json")
    assets = {a["id"]: a for a in (read(p) for p in sorted((LIB / "catalog/assets").glob("*.json")))}
    seen_reviews = set()
    for review in reviews["assessments"]:
        wid = review["workId"]
        if wid not in units_by_id or wid in seen_reviews:
            raise ValueError(f"Invalid or duplicate review: {wid}")
        seen_reviews.add(wid)
        if assets[review["assetId"]]["sha256"] != review["sha256"]:
            raise ValueError(f"Reviewed asset changed: {wid}")
        for p in review["passages"]:
            verses = span(p, ids, positions)
            if review["classification"] == "substantial-exposition":
                exposition[wid].update(verses)
        for p in review["incidentalCitations"]:
            citations[wid].update(span(p, ids, positions))
    total_main = set().union(*main_text.values())
    total_exp = set().union(*exposition.values())
    global_authors = Counter(a for creators in author_ids.values() for a in creators)
    rows = []
    for b in books:
        n = b["num"]
        universe = {v for v in ids if v // 1_000_000 == n}
        assigned, exp = total_main & universe, total_exp & universe
        work_ids = sorted(wid for wid, vs in main_text.items() if vs & universe)
        preachers = Counter(a for wid in work_ids for a in author_ids[wid])
        leader, leader_count = preachers.most_common(1)[0] if preachers else (None, 0)
        chapters = []
        for chapter, count in enumerate(b["chapters"], 1):
            base = n * 1_000_000 + chapter * 1000
            covered = {v - base for v in assigned if base < v <= base + count}
            assessed = {v - base for v in exp if base < v <= base + count}
            chapters.append({"chapter": chapter, "verseCount": count,
                             "mainTextVerseCount": len(covered), "mainTextRanges": ranges(covered),
                             "noMainTextRanges": ranges(set(range(1, count + 1)) - covered),
                             "assessedExpositionRanges": ranges(assessed)})
        rows.append({"book": b["name"], "bookNum": n, "unitCount": len(work_ids), "workIds": work_ids,
                     "verseCount": len(universe), "mainTextVerseCount": len(assigned),
                     "mainTextPercent": round(100 * len(assigned) / len(universe), 2),
                     "assessedExpositionVerseCount": len(exp),
                     "chapterCount": len(chapters), "chaptersWithMainText": sum(c["mainTextVerseCount"] > 0 for c in chapters),
                     "chaptersWithoutMainText": [c["chapter"] for c in chapters if not c["mainTextVerseCount"]],
                     "authorCounts": dict(preachers.most_common()), "authorCount": len(preachers),
                     "dominantAuthorId": leader, "dominantAuthorPercent": round(100 * leader_count / len(work_ids), 2) if work_ids else None,
                     "chapters": chapters})
    series = audit_series([read(p) for p in sorted((LIB / "catalog/series").glob("*.json"))], all_works)
    editions = {e["id"]: e for e in (read(p) for p in sorted((LIB / "catalog/editions").glob("*.json")))}
    assets_by_work = defaultdict(list)
    for a in assets.values():
        assets_by_work[editions[a["editionId"]]["workId"]].append(a)
    availability_counts = Counter(availability(w["id"], all_works, assets_by_work) for w in units)
    candidates = read(OUT / "gap-resources.json")
    benefits = []
    for r in candidates["resources"]:
        if authors[r["authorId"]]["eligibility"] != "eligible":
            raise ValueError(f"Candidate author ineligible: {r['id']}")
        target = set().union(*(span(p, ids, positions) for p in r["targetRanges"]))
        benefits.append({"id": r["id"], "targetVerseCount": len(target) if target else None,
                         "currentlyUnassignedMainTextVerses": len(target - total_main) if target else None,
                         "includedInCurrentCoverage": False})
    summary = {
        "checkedOn": DATE, "catalogWorks": len(all_works), "sermonGenreRecords": len(sermons),
        "coreSermonUnits": len(units), "excludedContainers": CONTAINERS,
        "excludedHistoricalContextSermons": sum(w["role"] == "historical-context" for w in sermons),
        "canonicalVerseCount": len(ids), "canonicalChapterCount": sum(len(b["chapters"]) for b in books),
        "booksWithMappedMainText": sum(bool(r["unitCount"]) for r in rows),
        "worksWithMappedMainText": sum(bool(v) for v in main_text.values()),
        "worksWithoutMappedMainText": [wid for wid, vs in main_text.items() if not vs],
        "worksWithoutAnyPassageRecord": [w["id"] for w in units if not w.get("passages")],
        "unresolvedMainTextAssignments": len(exceptions),
        "assignedUniqueVerses": len(total_main), "assignedVersePercent": round(100 * len(total_main) / len(ids), 2),
        "chaptersWithoutMappedMainText": sum(len(r["chaptersWithoutMainText"]) for r in rows),
        "canonicalSubstantialExpositionWorks": canonical_exp_works,
        "targetedBodyReviews": len(reviews["assessments"]), "assessedExpositionVerses": len(total_exp),
        "worksWithoutBodyReviewInThisAudit": len(units) - len(seen_reviews),
        "assessedIncidentalCitationAssignments": sum(len(r["incidentalCitations"]) for r in reviews["assessments"]),
        "authorCounts": dict(global_authors.most_common()),
        "booksWithOneMappedAuthor": [r["book"] for r in rows if r["authorCount"] == 1],
        "booksAtLeast80PercentOneAuthor": [r["book"] for r in rows if (r["dominantAuthorPercent"] or 0) >= 80],
        "availability": dict(availability_counts), "seriesRecords": len(series),
        "seriesKinds": dict(Counter(s["inventoryKind"] for s in series)),
        "seriesWithMembershipProblems": [s["id"] for s in series if s["problems"] or s["declaredMissing"]],
        "candidateBenefits": benefits, "newCatalogWorks": 0, "downloadedAssets": 0,
    }
    inputs = [Path(__file__), ROOT / "content/apologetics/scripture-index.json", LIB / "authors.json",
              OUT / "assessments.json", OUT / "gap-resources.json"]
    for folder in ("works", "editions", "assets", "series"):
        inputs.extend(sorted((LIB / f"catalog/{folder}").glob("*.json")))
    manifest = [{"path": str(p.relative_to(ROOT)).replace("\\", "/"),
                 "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(inputs)]
    manifest_bytes = json.dumps(manifest, sort_keys=True).encode()
    summary["inputFingerprint"] = hashlib.sha256(manifest_bytes).hexdigest()
    write(OUT / "input-manifest.json", {"checkedOn": DATE, "inputs": manifest})
    write(OUT / "summary.json", summary)
    write(OUT / "book-coverage.json", {"metric": "source-assigned main texts; not estimated substantial exposition", "books": rows})
    write(OUT / "series-audit.json", {"series": series})
    write(OUT / "passage-exceptions.json", {"mainText": exceptions, "exposition": exp_exceptions, "citation": citation_exceptions})
    report(summary, rows, authors, reviews, candidates, series)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def report(s, rows, authors, reviews, candidates, series):
    top = next(iter(s["authorCounts"]))
    top_count = s["authorCounts"][top]
    lines = ["# Sermon coverage audit — all 66 books", "", f"Checked {DATE}. L05 bounded catalog audit and gap research.", "",
        f"The catalog reaches **all {s['booksWithMappedMainText']} books by main-text assignment**, but it is not a complete exposition library. "
        f"Its **{s['coreSermonUnits']:,} core sermon units** are highly concentrated: {authors[top]['name']} supplies **{top_count:,} ({100*top_count/s['coreSermonUnits']:.1f}%)**. "
        f"Main-text ranges span **{s['assignedUniqueVerses']:,}/{s['canonicalVerseCount']:,} verses ({s['assignedVersePercent']}%)**; "
        f"**{s['chaptersWithoutMappedMainText']} chapters** have no mapped main text. This percentage measures bibliographic assignments, not how much Scripture has been substantially explained.", "",
        "## What the evidence supports", "",
        f"- {s['sermonGenreRecords']:,} sermon-genre records minus {s['excludedHistoricalContextSermons']} historical-context sermons and three collection/container records yield {s['coreSermonUnits']:,} core units. "
        "These are catalogued published units, not distinct delivered occasions. Newton's author-abridged discourses, intended-for-pulpit texts, and posthumous collections keep their original classifications in L03.",
        f"- {s['worksWithMappedMainText']:,} units have at least one verified main-text mapping; {len(s['worksWithoutMappedMainText'])} have none. {s['unresolvedMainTextAssignments']} main-text assignments remain unresolved; "
        f"{len(s['worksWithoutAnyPassageRecord'])} individual units have no passage record. See [exact exceptions](passage-exceptions.json) and [summary](summary.json).",
        f"- The canonical catalog contains {s['canonicalSubstantialExpositionWorks']} works with an explicit substantial-exposition mapping. A targeted, AI-assisted review of four existing texts establishes two narrowly bounded verse treatments, one application-dominant sermon and one book-level thematic survey. "
        f"The other {s['worksWithoutBodyReviewInThisAudit']:,} units are **unassessed here**, not judged non-expository. No statistical estimate is extrapolated from this purposive sample.",
        "- A supporting quotation is a citation, not passage coverage. Source-assigned main texts, assessed exposition, thematic surveys and incidental citations remain separate. A main-text label alone cannot certify exposition; a small main-text span can also understate a sermon’s actual scope.",
        "- Counts use unique work IDs and canonical verse unions. Multiple formats, edition copies and overlapping passage assignments do not multiply coverage. Different numbered sermons with repeated titles remain distinct. Published-work identity still depends on the acquisition inventories; undiscovered duplicate occasions cannot be ruled out.",
        "- English/KJV chapter and verse numbering comes from the project's 66-book Scripture index. Cross-chapter ranges enumerate actual verses. Other numbering systems and unresolved references are excluded with an exception, never silently guessed.", "",
        "## Reviewed examples: the limits of the metadata", "",
        "Substantial exposition means sustained explanation of a passage’s language, argument or narrative and its application. It need not be verse-by-verse, but a passing quotation or transferred analogy does not establish contextual exposition. These are passage-treatment judgments, not full theological or transcription reviews.", "",
        "| Existing sermon | Assessment | Evidence and limit |", "|---|---|---|"]
    for r in reviews["assessments"]:
        lines.append(f"| [{r['title']}]({r['sourceUrl']}) | {r['classification']}: {', '.join(p['reference'] for p in r['passages'])} | {r['locator']}. {r['basis']} |")
    lines += ["", "The brief James 1:17 quotation in sermon 0001 is recorded as incidental, adding no exposition coverage to James. Citation indexing is illustrative, not exhaustive. [Assessment records](assessments.json) pin each judgment to the retained asset SHA-256; they do not rewrite the source PDF or silently promote the canonical editorial state.", "",
        "## Where acquisition and review will help most", "",
        "1. **Ezra, Obadiah, 2 John and 3 John:** only one mapped core sermon apiece. Ezra 4:14 is application-dominant in the inspected sermon. The 3 John treatment establishes verse 4, not the whole letter. Prioritize contextual units across the remaining passages, and a second preacher for each book.",
        "2. **Esther and Philemon:** two mapped units each. Esther already has a broader thematic survey, so its low main-text count must not be read as proof that the narrative is absent. Whole-letter Philemon exposition and an explicitly mapped Esther sequence remain priorities.",
        "3. **Long historical and legal books:** Leviticus, Numbers, Deuteronomy and Chronicles have low assigned-verse density and many untouched chapters. Seek continuous contextual treatment of laws, genealogies, covenant obligations and narrative transitions, rather than another isolated familiar verse.",
        "4. **Short prophetic books:** Haggai 1 has no mapped main text; chapter 2 has five mapped verses. Obadiah is represented only by verse 17. The verified resources below address missing spans and author diversity, while retaining each preacher’s interpretations. Haggai 2:4–5 already appears in an unresolved Spurgeon reference (sermon 1918): not every unmapped verse is a missing resource.",
        "5. **Review before claiming completion:** Ruth and 2 Peter have full main-text span coverage through the L04 pilots. Review their bodies before calling either book fully expounded. Prioritize body review of the sole-book witnesses and broad chapter labels next.", "",
        "## Preacher concentration", "", "| Author | Core sermon units | Share |", "|---|---:|---:|"]
    for aid, count in s["authorCounts"].items():
        lines.append(f"| {authors[aid]['name']} | {count:,} | {100*count/s['coreSermonUnits']:.2f}% |")
    lines += ["", f"**{len(s['booksWithOneMappedAuthor'])} books** have only one mapped author: " + ", ".join(s["booksWithOneMappedAuthor"]) + ".",
        f"**{len(s['booksAtLeast80PercentOneAuthor'])} books** receive at least 80% of mapped units from one author. Book-level shares and work IDs are in [book-coverage.json](book-coverage.json). "
        "This is acquisition imbalance, not a judgment on preacher quality. The next broad historical acquisition should add Calvin/Perkins and other eligible voices, while targeted Piper additions solve immediate holes. Adding Piper alone would merely shift the concentration over time.", "",
        "## Series completeness and holdings gaps", "",
        f"All **{s['seriesRecords']}** recorded series were checked for expected counts, duplicate memberships/positions, unresolved work IDs and missing ordinals. "
        f"**{len(s['seriesWithMembershipProblems'])}** have membership problems or declared missing entries. [Full series audit with inventory sources](series-audit.json).",
        "The 64 Spurgeon series records represent 63 published-volume inventories plus their volume collection; the 17 L03 records are bounded historical divisions. They are not 81 continuous biblical-book sermon series. The two L04 records are complete four-part Ruth and twelve-part 2 Peter source inventories. None of these facts establishes an author-wide or body-reviewed exposition corpus.", "",
        "| Incomplete or unestablished unit | Known boundary and next action |", "|---|---|",
        "| L02 Puritan components | Acquisitions reached Calvin, Perkins, Owen, Sibbes, Watson and Flavel volumes 1–3; Flavel volume 4 interrupted the queue. Goodwin, Bunyan and Boston remain planned. Index and reconcile retained scans; do not count raw files as sermon units. [Checkpoint](../puritan-sermons/REPORT.md). |",
        "| Perkins Jude exposition | L02 identified 66 sermons in the acquired edition. The component catalog is unfinished: eligible future sermon units, not 66 current coverage records. Preserve print/OCR page alignment before mapping passages. |",
        "| Bullinger / Flavel aggregate links | Existing collection-level records lack component inventories; Bullinger's linked volume does not establish all five decades. Expected missing-unit counts are unknown. |",
        "| Historic author corpora | L03 completed selected editions/divisions, not exhaustive Edwards, Whitefield, Newton or Ryle bibliographies. Review their documented expansion gaps and original/posthumous distinctions. [L03 report](../historic-preaching/REPORT.md). |",
        "| Modern author breadth | L04 has no admitted individual sermon series for Ferguson, Packer or Murray; source availability and completeness remain to be established. MLJ Trust database retrieval requires prior written permission. These are catalog/access gaps, not claims that sermons do not exist. [L04 report](../modern-preaching/REPORT.md). |",
        "| Piper Minor Prophets | Two relevant 1982 messages are verified below; no complete series contents census was performed. Expected total and missing positions remain unknown. |", "",
        "Availability is independent of exposition and inventory completeness. Current units by asset relationship: " + "; ".join(f"{k}: {v:,}" for k, v in s["availability"].items()) + ". "
        "Parent-volume assets count as availability for embedded sermons; this avoids falsely reporting historical components as unacquired. Status comes from the asset catalog, not a fresh integrity check of every source byte, and it does not grant republication rights.", "",
        "## Verified gap-filling discoveries", "",
        "All authors below are eligible in the shared registry. These are **discovery records outside the baseline**, not newly acquired or published sermons. [Structured resource records and next actions](gap-resources.json).", "",
        "| Resource | Passage and contribution | Acquisition boundary |", "|---|---|---|"]
    for r in candidates["resources"]:
        lines.append(f"| [{r['title']}]({r['url']}) — {authors[r['authorId']]['name']}, {r['date']} | {r['sourceAssignedText']}. {r['contribution']} | {r['method']} |")
    benefit_total = sum(b['currentlyUnassignedMainTextVerses'] or 0 for b in s['candidateBenefits'])
    lines += ["", f"The three Piper bodies were inspected at the named headings recorded in the discovery register. Together their narrow targets contain **{benefit_total} currently unassigned main-text verses**, but zero have been added to this snapshot. Two of those verses (Haggai 2:4–5) already have an unresolved catalog reference, so this is not a claim of thirty wholly absent passage treatments. "
        "The [Desiring God policy](https://www.desiringgod.org/permissions) supports source links and qualified sharing; entire textual republication and audio re-upload are not granted here. "
        "The [Calvin library record](https://commons.ptsem.edu/id/sermonsofmiohnca1583calv) verifies an English 1583 edition with a No Known Copyright label; its contents and source-specific download conditions still need checking. No modern curated edition was copied.", "",
        "No qualifying complete Esther, 2 John, 3 John or Philemon sermon series was established by this bounded search. Those gaps remain open. General articles, quoted excerpts from an eligible preacher inside someone else’s sermon, and sermons by unregistered preachers were not substituted for qualifying corpora.", "",
        "## All 66 books", "",
        "**Units** counts sermons with a verified source-assigned main text in the book; a multi-book sermon can appear in several rows. **Span** is unique assigned verses, not exposition. **Reviewed exp.** is the narrow assessed exposition layer (zero means not established, not absent). Empty chapters have no mapped main text; exact remaining verse ranges are in [book-coverage.json](book-coverage.json).", "",
        "| Book | Units | Main-text span | Chapters touched | Authors | Reviewed exp. verses | Chapters with no mapped main text |",
        "|---|---:|---:|---:|---:|---:|---|"]
    for r in rows:
        lines.append(f"| {r['book']} | {r['unitCount']} | {r['mainTextVerseCount']}/{r['verseCount']} ({r['mainTextPercent']:.1f}%) | {r['chaptersWithMainText']}/{r['chapterCount']} | {r['authorCount']} | {r['assessedExpositionVerseCount']} | {labels(r['chaptersWithoutMainText'])} |")
    lines += ["", "## Reproduce and resume", "",
        "Run `python -X utf8 scripts/analyze-sermon-coverage.py` from Website, then `python -X utf8 -m unittest discover -s scripts/tests -p test_sermon_coverage.py` and `node scripts/validate-library.mjs`. "
        "The generator reads catalog works, editions, assets, series, the author registry, canonical verse counts, and the two explicit review/discovery inputs. [Input hashes](input-manifest.json) and [summary fingerprint](summary.json) make the evidence boundary reproducible. It performs no network calls.", "",
        "Next: (1) reconcile unresolved main-text assignments; (2) body-review sole-book witnesses and the Ruth/2 Peter pilots; (3) admit the three official sermon links with full L04 recording metadata; (4) finish L02 component indexing and collate Calvin's Deuteronomy edition; (5) search for continuous Esther and short-epistle series across other eligible ministries. Preserve dates, rights, uncertain identities and disagreements at every step.", "",
        "This report is saved in the collection desk. It changes neither website publication selection nor search ingestion. All-book reach, acquisition completeness, substantial exposition, text quality and permission to publish are separate claims.", ""]
    (OUT / "REPORT.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
