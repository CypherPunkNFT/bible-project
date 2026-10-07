#!/usr/bin/env python3
"""Build the Study pages' data (Harmony, Miracles, Letters, People, Prophets, Names) into data/study/.

    python scripts/build-study.py                      # read the KJV/BSB from data/, write data/study/
    python scripts/build-study.py --data-root data.new # what build-data.py does before its swap

Checks every study source's checksum against SOURCES.md first. Each output file is written to a temp file
and moved into place (retried if Windows has it open), then index.json gets a new stamp the site fetches with.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.paths import SOURCES  # noqa: E402
from bible.study_harmony import describe, parse_harmony, parse_miracles  # noqa: E402
from bible.study_home import build_home  # noqa: E402
from bible.study_letters import build_letters  # noqa: E402
from bible.people_corrections import CorrectionError, apply_people_corrections  # noqa: E402
from bible.people_stories import StoryError, apply_people_stories, load_stories  # noqa: E402
from bible.study_names import build_names  # noqa: E402
from bible.study_people import parse_people, people_period  # noqa: E402
from bible.study_prophets import build_prophets  # noqa: E402
from bible.study_refs import Verses  # noqa: E402
from bible.study_torrey import parse_evil_agents, parse_servants  # noqa: E402

SITE = Path(__file__).resolve().parents[1]
FILES = {
    "robertson-harmony": SOURCES / "gutenberg" / "robertson-harmony-36264-h.htm",
    "tipnr": SOURCES / "stepbible" / "TIPNR.txt",
    "torrey-xml": SOURCES / "ccel" / "ttt.xml",
    "faith-names": SOURCES / "cypherpunk-faith" / "faith-names.json",
    "faith-names-approved": SOURCES / "cypherpunk-faith" / "faith-names-approved.json",
}


def recorded_checksums() -> dict[str, str]:
    table = (SITE / "SOURCES.md").read_text(encoding="utf-8")
    return {m.group(1): m.group(2) for m in re.finditer(r"^\| \[([\w-]+)\]\([^)]*\) \|.*\| ([0-9a-f]{16}) \|$", table, re.M)}


def source_changed(message: str) -> None:
    """A source differs from the recorded copy: stop, unless BIBLE_ACCEPT_SOURCE_CHANGES=1 (fresh public clones)."""
    if os.environ.get("BIBLE_ACCEPT_SOURCE_CHANGES") == "1":
        print(f"warning: {message}")
        return
    raise SystemExit(f"{message} (set BIBLE_ACCEPT_SOURCE_CHANGES=1 to build from it anyway)")


def check_sources() -> None:
    recorded = recorded_checksums()
    for key, path in FILES.items():
        if key not in recorded:
            raise SystemExit(f"checksum: {key} ({path.name}) is not listed in SOURCES.md")
        actual = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
        if actual != recorded[key]:
            source_changed(f"checksum: {path} is {actual}, SOURCES.md records {recorded[key]} — the source changed")


def write_json(path: Path, value) -> int:
    """Temp file + os.replace, retried: the always-on preview may have the old file open for a moment."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    data = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    temp.write_text(data, encoding="utf-8")
    for attempt in range(10):
        try:
            os.replace(temp, path)
            return len(data.encode("utf-8"))
        except PermissionError:
            if attempt == 9:
                raise SystemExit(f"could not replace {path}: still locked after 10 tries (is something reading it?)")
            time.sleep(0.3)
    return 0


SAFE_PERSON_ID = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
# Owner's corrections to TIPNR (2026-10-07): tribes and peoples flagged as groups ("g", left out of Everyone in the Bible),
# a period for each person TIPNR gives no era, and fixes to STEP's text, names, verses and family links plus records the
# site added ("fixes", "added": scripts/bible/people_corrections.py; format in content/people/README.md).
PEOPLE_CORRECTIONS = SITE / "content" / "people" / "catalogue-corrections.json"
# The site's own sourced life stories (owner, 2026-10-07): each replaces STEP's AI-adapted story on the person page
# (scripts/bible/people_stories.py; format in content/people/stories/README.md).
PEOPLE_STORIES = SITE / "content" / "people" / "stories"


def people_files(people: list[dict]) -> tuple[list[dict], dict[str, dict]]:
    """A slim list for the People index and search (name, other names, one line, mention count) + one small file per
    person with everything else, loaded only when that person is opened."""
    corrections = json.loads(PEOPLE_CORRECTIONS.read_text(encoding="utf-8"))
    groups, periods = set(corrections["groups"]), corrections["periods"]
    unknown = (groups | set(periods)) - {p["id"] for p in people}
    if unknown:
        raise SystemExit(f"people corrections: {len(unknown)} ids are not in TIPNR, e.g. {sorted(unknown)[:3]} ({PEOPLE_CORRECTIONS})")
    rows, detail = [], {}
    for p in people:
        if not SAFE_PERSON_ID.match(p["id"]):
            raise SystemExit(f"people: id {p['id']!r} cannot be a file name")
        books = Counter(ref // 1_000_000 for ref in p["refs"])
        period = (periods[p["id"]]["period"] if p["id"] in periods
                  else p.get("period_fix") or people_period(p["era"], p["refs"]))
        row = {"id": p["id"], "n": p["name"], "o": p["names"], "b": p["brief"] or p["description"], "c": len(p["refs"]), "p": period}
        if p["id"] in groups:
            row["g"] = 1
        rows.append(row)
        detail[p["id"]] = {
            "s": p["sex"][:1], "d": p["description"], "e": p["era"], "t": p["tribe"], "b": p["brief"],
            "pa": p["parents"], "si": p["siblings"], "sp": p["partners"], "ch": p["children"],
            "k": {str(num): count for num, count in sorted(books.items())}, "f": p["refs"][0] if p["refs"] else 0,
            "short": p["short"], "article": p["article"], "refs": p["refs"],
        }
        # fx: the fields this site changed in STEP's record (their licence asks that changes be shown); same: the person
        # this record duplicates; note: the site's own one-line note; added: a record the site made, not STEP.
        detail[p["id"]].update({key: p[key] for key in ("fx", "same", "note", "added") if p.get(key)})
    return rows, detail


def build(data_root: Path, out: Path) -> dict:
    check_sources()
    verses = Verses(data_root)
    robertson = FILES["robertson-harmony"].read_text(encoding="cp1252")
    people, people_report = parse_people(FILES["tipnr"].read_text(encoding="utf-8"), verses)
    try:
        people_report["corrections"] = apply_people_corrections(
            people, json.loads(PEOPLE_CORRECTIONS.read_text(encoding="utf-8")), verses, SAFE_PERSON_ID)
    except CorrectionError as error:
        raise SystemExit(f"{error} ({PEOPLE_CORRECTIONS})") from error
    names_for_case = {p["name"].lower() for p in people if p["sex"] in ("Male", "Female")}
    harmony = parse_harmony(robertson, verses, names_for_case)
    christ = parse_miracles(robertson)
    sections = {s["n"] for part in harmony["parts"] for s in part["sections"]}
    missing = [m for m in christ if m["section"] not in sections]
    if missing:
        raise SystemExit(f"miracles: Robertson's list points at sections that do not exist: {missing}")
    corrections: list[dict] = []
    torrey = FILES["torrey-xml"].read_text(encoding="utf-8")
    miracles = {"christ": christ, "servants": parse_servants(torrey, verses, corrections),
                "evil": parse_evil_agents(torrey, verses, corrections)}
    letters = build_letters(data_root, verses)
    prophets = build_prophets(people, verses)
    names = build_names(FILES["faith-names"].parent, verses)
    home = build_home(data_root, verses)
    rows, detail = people_files(people)
    try:
        people_report["stories"] = apply_people_stories(detail, *load_stories(PEOPLE_STORIES))
    except StoryError as error:
        raise SystemExit(f"{error} ({PEOPLE_STORIES})") from error

    sizes = {
        "harmony.json": write_json(out / "harmony.json", harmony),
        "miracles.json": write_json(out / "miracles.json", miracles),
        "letters.json": write_json(out / "letters.json", letters),
        "people.json": write_json(out / "people.json", rows),
        "prophets.json": write_json(out / "prophets.json", prophets),
        "names.json": write_json(out / "names.json", names),
        "home.json": write_json(out / "home.json", home),
    }
    for person_id, record in detail.items():
        sizes[f"people/{person_id}.json"] = write_json(out / "people" / f"{person_id}.json", record)
    stamp = hashlib.sha256(str(time.time()).encode()).hexdigest()[:10]
    report = {
        "harmony": describe(harmony),
        "miracles": f"Christ {len(christ)}, servants {sum(len(g['items']) for g in miracles['servants'])} in "
                    f"{len(miracles['servants'])} groups, evil agents {len(miracles['evil'])}",
        "letters": f"{len(letters)} letters, {sum(len(l['sections']) for l in letters)} sections",
        "people": people_report,
        "prophets": f"{len(prophets)} ({Counter(p['kind'] for p in prophets)})",
        "names": {g["key"]: len(g["names"]) for g in names["groups"]},
        "corrections": len(corrections),
        "largest_kb": max(sizes.values()) // 1024,
    }
    write_json(out / "index.json", {"stamp": stamp, "corrections": corrections, "report": report})
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--data-root", default=str(SITE / "data"), help="folder holding plain/kjv and text/bsb")
    args = parser.parse_args()
    root = Path(args.data_root).resolve()
    report = build(root, root / "study")
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
