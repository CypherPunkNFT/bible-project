"""Historic sermons, second round (job 4b5ae800, 2026-11-26): sermons the library already holds as one record each.

Writes ONE overlay, content/library/passage-overlays/historic-sermons-20261126.json, read by the Teachers build
(scripts/teacher-pages/people.ts); no work record is edited and no held file is touched.
  singles  a book that prints one sermon and is catalogued as one record (Goodwin, Watson, Charnock, Knox, Perkins's
           Zephaniah): genre "sermon", and its main text where the book prints it, read and checked the way
           scripts/catalog-historic-sermons.py reads a sermon (never from a title).
  Bunyan   his 18 sermon-form discourses (plan.json): one record per discourse is marked "sermon"; every other record of
           the same discourse (reprints, extracts, translations) gets duplicateOf that record. A record whose title shows
           a second work bound with it (a compound volume) is left as it is and listed.
The run stops if an id it would write is already in another overlay file (that file would silently win or lose), if a
duplicateOf target is missing or is itself marked a duplicate or not-by, or if a single's held file has no record.

Usage (from Website/): python -X utf8 scripts/relabel-historic-sermons.py [--dry-run]
"""

import argparse
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

_spec = importlib.util.spec_from_file_location("catalog_historic_sermons", Path(__file__).with_name("catalog-historic-sermons.py"))
chs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(chs)
from bible.study_refs import RefError, Verses  # noqa: E402

OVERLAYS = chs.LIBRARY / "passage-overlays"
OUT = OVERLAYS / "historic-sermons-20261126.json"
REPORT = chs.REPORTS / "historic-splitting-20261126" / "relabel-run.json"
SINGLES = [  # (preacher, TCP id, division type, what to say)
    ("goodwin", "A85436", "sermon", None), ("goodwin", "A85443", "sermon", None),
    ("goodwin", "A85440", None, "the sermon prints only 'TEXT. Ver. 5.' and, in its introduction, 'Chap. 5. ver. 1.': no book is named, so no passage is recorded"),
    ("goodwin", "A85431", "part", "one sermon printed in two parts ('I. PART.', 'II. PART.'); the same sermon is appended to the Ephesians e-book as 'Part I' and 'Part II'"),
    ("watson", "A65295", "sermon", None), ("watson", "A65307", "sermon", None), ("watson", "A65297", "sermon", None),
    ("watson", "A65301", "sermon", "also printed as Seven Sermons VI (TCP A65313), which gets no record of its own"),
    ("watson", "A65304", "sermon", None), ("watson", "A65312", "sermon", None), ("watson", "A96098", "sermon", None),
    ("watson", "A96103", "sermon", None), ("charnock", "A32722", "sermon", None), ("knox", "A04931", "sermon", None),
    ("perkins", "A73023", "sermon", "the title page says 'preached in 2. sermons'; the book prints the text undivided, so it is one record"),
]
AUTHORS = {"goodwin": "author-thomas-goodwin", "watson": "author-thomas-watson", "charnock": "author-stephen-charnock",
           "knox": "author-john-knox", "perkins": "author-william-perkins"}
# Bunyan: a record belongs to a discourse when its title begins with the discourse's title (an article or "Of" before it
# allowed), or it is an extract or translation that names it. Hand-checked against every title on 2026-11-26.
BUNYAN = "author-john-bunyan"
DISCOURSES = {
    "heavenly-footman": r"(?:\[heavenly footman\. \w+\]\.?\s*)?(?:the\s+)?heavenly.?foot|a race for eternal life: being an extract from the heavenly footman",
    "few-sighs": r"(?:a\s+|some\s+)?(?:few\s+)?sighs from hell", "come-and-welcome": r"come,? (?:and|&) welcome",
    "barren-fig-tree": r"(?:the\s+)?barren fig", "water-of-life": r"(?:the\s+)?water of life",
    "acceptable-sacrifice": r"(?:the\s+)?acceptable sacrifice", "greatness-soul": r"(?:of\s+)?(?:the\s+)?greatness of the soul",
    "jerusalem-sinner": r"(?:the\s+)?jerusalem.sinner", "holy-life": r"(?:a\s+)?holy life",
    "saved-by-grace": r"saved by grace|cadwedigaeth trwy ras: .*from saved by grace", "strait-gate": r"(?:the\s+)?strait gate",
    "light-for-them": r"light for them", "saints-knowledge": r"(?:all loves excelling: )?(?:the\s+)?saint'?s'? knowledge",
    "last-sermon": r"(?:mr\.?\s+)?(?:john\s+)?bunyan'?s last sermon", "complete-saviour": r"christ\W+a\s+compleat|christ\W+a\s+complete",
    "israels-hope": r"israel'?s hope", "pauls-departure": r"paul'?s departure", "desire-righteous": r"(?:the\s+)?desire of the righteous",
}
# A second work bound in the same volume: left as it is. "In which is added" (Jerusalem Sinner) is Bunyan's own answer
# to objections inside the book, not a second work; nor is "together with the way he runs in" (the Heavenly Footman's
# subtitle). "Saved by grace ; justification, the law and grace unfolded, also ..." binds four works.
COMPOUND = re.compile(r"(?:to|unto) which (?:is|are) (?:added|appended)|no way to heaven|pharisee|;\s*the\s|sighs from hell, and"
                      r"|;\s*justification", re.I)


def other_overlays():
    """{work id: [file, ...]} and the entries of every overlay file except the one this script writes."""
    seen, entries = {}, {}
    for path in sorted(OVERLAYS.glob("*.json")):
        if path == OUT:
            continue
        for ident, entry in json.loads(path.read_text(encoding="utf-8"))["works"].items():
            seen.setdefault(ident, []).append(path.name)
            entries[ident] = entry
    return seen, entries


def single_entry(preacher, tcp, kind, say, owners, verses):
    path = chs.held_path(dict(tcp=tcp))
    sha = hashlib.sha256(path.read_bytes()).hexdigest()
    ident = owners.get(sha[:12])
    if not ident:
        sys.exit(f"{tcp}: no catalogue record holds this file (sha256 {sha[:12]}); nothing to mark")
    work = json.loads((chs.CATALOG / "works" / f"{ident}.json").read_text(encoding="utf-8"))
    if work["creators"][0]["authorId"] != AUTHORS[preacher]:
        sys.exit(f"{ident}: first-named creator is {work['creators'][0]['authorId']}, not {AUTHORS[preacher]}")
    entry = dict(title=work["title"][:120], genre="sermon", heldFile=path.relative_to(chs.SOURCES).as_posix(), sha256=sha)
    rows = chs.texts.tei_sermons(path, kind) if kind else []
    if kind and not rows:
        sys.exit(f"{tcp}: no <div type=\"{kind}\"> in the held file")
    reference, printed, problem = chs.main_text(dict(tcp=tcp, mode="bibl"), rows[0]) if rows else (None, None, say)
    if reference:
        try:
            passages = chs.sermon_passages.passages(reference, verses, f"TCP {tcp}, first <div type=\"{kind}\">; {printed}")
            misprint = chs.quoted_check(passages, rows[0]["lead"]) or chs.strict_check(passages, rows[0]["lead"])
            if misprint:
                problem = f"{printed}; misprint, not corrected: {misprint}"
            else:
                entry.update(passages=passages, printed=printed)
        except RefError as error:
            problem = f"{printed}: {error}"
    if problem:
        entry["unplaced"] = problem
    if say and say != problem:
        entry["note"] = say
    return ident, entry


def bunyan_entries(seen, entries):
    """{id: entry} for the discourses, and the compound volumes and other-overlay records left alone."""
    works = {}
    for path in (chs.CATALOG / "works").glob("*.json"):
        work = json.loads(path.read_text(encoding="utf-8"))
        if (work.get("creators") or [{}])[0].get("authorId") == BUNYAN:
            works[work["id"]] = work
    addresses = json.loads((chs.SITE / ".local/teacher-library/teacher-input.json").read_text(encoding="utf-8"))["addresses"]
    out, left, groups = {}, [], {}
    for key, pattern in DISCOURSES.items():
        group = [w for w in works.values() if re.match(r"^\W*(?:" + pattern + ")", w["title"], re.I)]
        for work in group:
            others = [k for k, p in DISCOURSES.items() if k != key and re.search(p, work["title"], re.I)]
            if COMPOUND.search(work["title"]) or others:
                left.append(dict(workId=work["id"], discourse=key, title=work["title"][:160], reason="compound volume: a second work is bound with it"))
        group = [w for w in group if not any(x["workId"] == w["id"] for x in left)]
        def rank(w):
            placed = any(p.get("role") == "main-text" for p in entries.get(w["id"], {}).get("passages", []) + w.get("passages", []))
            return (not placed, w["id"] not in addresses, w["id"])
        group.sort(key=rank)
        if not group:
            sys.exit(f"bunyan {key}: no single record of the discourse found")
        canonical = group[0]["id"]
        groups[key] = dict(canonical=canonical, title=group[0]["title"][:120], records=len(group))
        for work in group:
            if work["id"] in seen and work["id"] != canonical:
                left.append(dict(workId=work["id"], discourse=key, title=work["title"][:160], reason=f"already in {seen[work['id']]}"))
                continue
            out[work["id"]] = dict(genre="sermon") if work["id"] == canonical else dict(duplicateOf=canonical)
    return out, left, groups, works


def guard(entries, seen, other):
    """Stop on an id another overlay file also names, or a duplicateOf target that is missing or itself a duplicate."""
    clash = sorted(i for i in entries if i in seen)
    if clash:
        sys.exit(f"ids already in another overlay file (add 'genre' there by hand, or leave them): {[(i, seen[i]) for i in clash[:8]]}")
    for ident, entry in entries.items():
        target = entry.get("duplicateOf")
        if target and (not (chs.CATALOG / "works" / f"{target}.json").is_file() or "duplicateOf" in entries.get(target, {})
                       or "notBy" in other.get(target, {}) or "duplicateOf" in other.get(target, {})):
            sys.exit(f"{ident}: duplicateOf {target}, which is missing, a duplicate itself, or marked not by its author")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="read and check everything; write nothing")
    args = parser.parse_args()
    seen, other = other_overlays()
    owners, verses = chs.containers(), Verses(chs.SITE / "data")
    entries = dict(single_entry(*spec, owners, verses) for spec in SINGLES)
    bunyan, left, groups, works = bunyan_entries(seen, other)
    entries.update(bunyan)
    # A record another overlay file already names keeps that file's entry, which must itself say "sermon" (set by hand).
    elsewhere = {i: dict(file=seen[i], ours=entries.pop(i)) for i in list(entries) if i in seen and other[i].get("genre") == "sermon"}
    guard(entries, seen, other)
    dropped = sum(1 for e in bunyan.values() if "duplicateOf" in e)
    counts = dict(singles=len(SINGLES), singlesPlaced=sum(1 for e in entries.values() if e.get("passages")),
                  bunyanDiscourses=len(groups), bunyanDuplicatesLinked=dropped, bunyanLeftAlone=len(left),
                  bunyanRecordsBefore=len(works), bunyanRecordsOnPageAfter=len(works) - dropped)
    overlay = dict(kind="passage-overlay", name=OUT.stem, generatedBy="scripts/relabel-historic-sermons.py (job 4b5ae800)",
                   generatedOn=chs.TODAY, method=__doc__.split("\n\n")[1].strip(), counts=counts, works=entries)
    report = dict(generatedBy="scripts/relabel-historic-sermons.py", generatedOn=chs.TODAY, counts=counts, bunyanDiscourses=groups,
                  bunyanLeftAlone=left, setInOtherOverlay=elsewhere, unplaced=[dict(workId=i, title=e["title"], reason=e["unplaced"]) for i, e in entries.items() if e.get("unplaced")])
    print(json.dumps(counts))
    for ident, row in elsewhere.items():
        print("   set in", row["file"], ident, "| ours:", {k: v for k, v in row["ours"].items() if k in ("printed", "unplaced", "duplicateOf")})
    for row in report["unplaced"] + left:
        print("  ", row["workId"], "|", row.get("discourse", ""), "|", row["reason"][:150])
    if not args.dry_run:
        chs.sources.write_json(OUT, overlay)
        chs.sources.write_json(REPORT, report)


if __name__ == "__main__":
    main()
