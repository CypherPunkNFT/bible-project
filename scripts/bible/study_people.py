"""STEP Bible's TIPNR (CC BY 4.0): every person in the Bible -> the People and Prophets pages.

Family members are written in TIPNR as text keys ("Terah@Gen.11.24-Luk"). Each key is resolved against the
records' own keys; a key that matches no person is dropped and counted (most point at places or other names).
Descriptions are reduced to plain text here; nothing is ever rendered as HTML.
"""

import html
import re
from collections import Counter

from .study_refs import RefError, Verses, normalise_book

RECORD = re.compile(r"^\$=+\s*PERSON\(s\)", re.M)
ERA = re.compile(r"living (?:at the time (?:of )?|in the time of |before )(.+?)\s*$")
# TIPNR's era phrases -> one fixed list, in time order (index = sort key for the Prophets timeline).
ERAS = ["Before the Flood", "Patriarchs", "Egypt and Wilderness", "Conquest", "Judges", "United Monarchy",
        "Divided Monarchy", "Exile and Return", "New Testament"]
ERA_ALIASES = {"before the flood": "Before the Flood", "the patriarchs": "Patriarchs", "patriarchs": "Patriarchs",
               "israel's monarchy": "Judges", "the new testament": "New Testament"}


def _plain(text: str) -> str:
    text = re.sub(r"<ref=\"[^\"]*\">([^<]*)</ref>", r"\1", text)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"[ \t]+", " ", html.unescape(text)).strip()


def _cols(line: str) -> list[str]:
    """Tab-separated fields without the long run of empty columns TIPNR pads every line with."""
    cols = line.split("\t")
    while cols and not cols[-1].strip():
        cols.pop()
    return cols


def _era(raw: str) -> str:
    """TIPNR's phrase -> the first matching era in ERAS ('United Monarchyand Divided Monarchy' -> 'United
    Monarchy'; 'the time before the Flood' -> 'Before the Flood'; "Israel's Monarchy" -> 'Judges')."""
    raw = re.sub(r"(?<=[a-z])and ", " and ", raw)
    raw = re.sub(r"\s+", " ", raw).strip(" ,.").removeprefix("the time ").strip()
    if raw.lower() in ERA_ALIASES:
        return ERA_ALIASES[raw.lower()]
    for era in ERAS:
        if raw.lower().startswith(era.lower()):
            return era
    return ""


def _slug(key: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", key.lower()).strip("-")


def _base_key(key: str) -> str:
    """'Terah@Gen.11.24-Luk' / 'Terah@Gen.11.24(?)' -> 'Terah@Gen.11.24' (name + first reference)."""
    key = re.sub(r"\((?:\?|d\??|a|f)\)", "", key).strip()
    name, _, ref = key.partition("@")
    ref = re.match(r"[1-3]?[A-Za-z]+\.\d+\.\d+", ref)
    return f"{name.strip()}@{ref.group(0)}" if ref else name.strip()


def _ref_id(ref: str, verses: Verses) -> int | None:
    """'1Ki.17.23a' -> verse id; 'LXX …' (Greek Old Testament only) -> None."""
    ref = ref.strip()
    m = re.fullmatch(r"([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)[a-z]?", ref)
    if not m:
        return None
    try:
        return verses.check(normalise_book(m.group(1)), int(m.group(2)), int(m.group(3)))
    except RefError:
        return None


def _family(field: str) -> list[str]:
    return [k.strip() for k in re.split(r"[,+]", field) if "@" in k]


def parse_people(source: str, verses: Verses) -> tuple[list[dict], dict]:
    chunks = RECORD.split(source)[1:]
    records = []
    for chunk in chunks:
        chunk = re.split(r"^\$=", chunk, maxsplit=1, flags=re.M)[0]  # stop at the next record of any kind
        lines = [line.rstrip("\r") for line in chunk.split("\n")]
        lines = [line for line in lines[1:] if line.strip("\t ")]  # line 0 = rest of the marker line
        if not lines or "UnifiedName" in lines[0]:
            continue  # the file's own field documentation
        head = _cols(lines[0])
        if len(head) < 9 or "=" not in head[0]:
            raise ValueError(f"TIPNR: unexpected person header {lines[0][:80]!r}")
        key = head[0].split("=")[0].strip()
        fields = {n: "" for n in ("Briefest", "Brief", "Short", "Article")}
        names: list[str] = []
        refs: set[int] = set()
        skipped_refs = 0
        for line in lines[1:]:
            if line.startswith("@"):
                label, _, value = line[1:].partition("=")
                if label in fields:
                    fields[label] = _plain(value.split("\t")[0])
            elif line.startswith("– ") and not line.startswith("– Total"):
                cols = _cols(line)
                if len(cols) >= 4 and cols[3].strip():
                    names.append(re.sub(r"\s*=.*$", "", cols[3].split(";")[0]).strip())
                for ref in cols[-1].split(";"):
                    if not ref.strip():
                        continue
                    vid = _ref_id(ref, verses)
                    if vid is None:
                        skipped_refs += 1
                    else:
                        refs.add(vid)
        description = head[1].strip()
        era = ERA.search(description)
        records.append({
            "key": key,
            "base": _base_key(key),
            "id": _slug(_base_key(key)),
            "name": key.split("@")[0].strip(),
            "names": [],
            "names_raw": names,
            "sex": head[8].strip(),
            "description": description,
            "era": _era(era.group(1)) if era else "",
            "tribe": "" if head[6].strip() in ("", ">") else head[6].strip(),
            "parents_raw": _family(head[2]),
            "siblings_raw": _family(head[3]),
            "partners_raw": _family(head[4]),
            "children_raw": _family(head[5]),
            "brief": fields["Brief"] or fields["Briefest"],
            "short": fields["Short"],
            "article": fields["Article"],
            "refs": sorted(refs),
            "skipped_refs": skipped_refs,
        })
    return _link(records)


def _link(records: list[dict]) -> tuple[list[dict], dict]:
    by_base: dict[str, list[dict]] = {}
    for record in records:
        by_base.setdefault(record["base"], []).append(record)
    duplicates = {base: len(rs) for base, rs in by_base.items() if len(rs) > 1}
    for base, rs in by_base.items():
        if len(rs) > 1:  # same name + first verse: keep ids distinct with a counter
            for index, record in enumerate(rs[1:], start=2):
                record["id"] = f"{record['id']}-{index}"
    unresolved: Counter = Counter()
    for record in records:
        for field in ("parents", "siblings", "partners", "children"):
            ids = []
            for key in record.pop(f"{field}_raw"):
                matches = by_base.get(_base_key(key), [])
                if len(matches) == 1:
                    ids.append(matches[0]["id"])
                else:
                    unresolved["ambiguous" if matches else "not a person"] += 1
            record[field] = ids
        record["names"] = sorted({n for n in record.pop("names_raw") if n and n != record["name"]})
    ids = Counter(r["id"] for r in records)
    clashes = [i for i, n in ids.items() if n > 1]
    if clashes:
        raise ValueError(f"TIPNR: {len(clashes)} person ids are shared by two people, e.g. {clashes[:3]}")
    report = {"persons": len(records), "duplicate_keys": len(duplicates), "family_links_dropped": dict(unresolved),
              "refs_skipped": sum(r["skipped_refs"] for r in records)}
    return records, report

# The People table's periods (owner, 2026-10-06): TIPNR's eras, with Exile/Return and Life of Christ/Early church split by
# the book of a person's first mention. Ids match src/lib/people-periods.ts.
PERIOD_BY_ERA = {"Before the Flood": "early-world", "Patriarchs": "patriarchs", "Egypt and Wilderness": "exodus",
                 "Conquest": "conquest", "Judges": "judges", "United Monarchy": "united-kingdom",
                 "Divided Monarchy": "divided-kingdom"}
RETURN_BOOKS = {15, 16, 17, 37, 38, 39}  # Ezra, Nehemiah, Esther, Haggai, Zechariah, Malachi


def people_period(era: str, first_ref: int) -> str:
    """One period id for a person ('' when TIPNR gives no era). first_ref is book*1e6 + chapter*1e3 + verse."""
    book, chapter = first_ref // 1_000_000, first_ref // 1_000 % 1_000
    if era == "Exile and Return":
        return "return" if book in RETURN_BOOKS or (book == 13 and chapter == 9) else "exile"
    if era == "New Testament":
        return "life-of-christ" if 40 <= book <= 43 else "early-church"
    return PERIOD_BY_ERA.get(era, "")

