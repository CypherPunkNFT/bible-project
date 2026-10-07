"""The site's own corrections to STEP Bible's people (content/people/catalogue-corrections.json, keys "fixes" and
"added"; the format is described in content/people/README.md).

STEP's licence (CC BY 4.0) lets us change their data if the change is shown to readers, so every corrected person
carries "fx", the list of their fields this site changed. A record this site added carries "added" instead.
Every correction names why it was made and the verse that shows it. A correction that no longer matches STEP's text
(a newer TIPNR) stops the build rather than being skipped, so nothing is silently lost or applied twice.
"""

from .study_refs import RefError, Verses, parse_refs

TEXT_FIELDS = ("brief", "short", "article", "description")
PERIODS = {"early-world", "patriarchs", "exodus", "conquest", "judges", "united-kingdom", "divided-kingdom", "exile",
           "return", "life-of-christ", "early-church"}
# Each family field and the field that holds the link the other way round.
FAMILY = {"parents": "children", "children": "parents", "siblings": "siblings", "partners": "partners"}
FIX_KEYS = {"why", "evidence", "period", "names", "refs", "family", "same", "note", *TEXT_FIELDS}
ADDED_KEYS = {"why", "evidence", "name", "names", "sex", "description", "era", "period", "tribe", "brief", "short",
              "article", "refs", "note", *FAMILY}


class CorrectionError(ValueError):
    pass


def _verse_ids(refs: list[str], verses: Verses, where: str) -> list[int]:
    """['Isa 20:1', 'Jer 22:11'] -> verse ids (single verses only, so nothing is moved by accident)."""
    ids = []
    for ref in refs:
        try:
            spans = parse_refs(ref, verses)
        except RefError as error:
            raise CorrectionError(f"{where}: reference {ref!r} cannot be read ({error})") from error
        for start, end in spans:
            if start != end:
                raise CorrectionError(f"{where}: {ref!r} is a range; list each verse that moves")
            ids.append(start)
    return ids


def _check_evidence(entry: dict, verses: Verses, where: str) -> None:
    if not str(entry.get("why", "")).strip():
        raise CorrectionError(f"{where}: every correction needs a one-line 'why'")
    evidence = str(entry.get("evidence", "")).strip()
    if not evidence:
        raise CorrectionError(f"{where}: every correction needs an 'evidence' verse")
    try:
        parse_refs(evidence, verses)
    except RefError as error:
        raise CorrectionError(f"{where}: evidence {evidence!r} cannot be read ({error})") from error


def _edit_text(current: str, edit, where: str) -> str:
    """A string replaces the whole field; a list of [old, new] pairs edits it in place (each old must occur once)."""
    if isinstance(edit, str):
        return edit
    text = current
    for pair in edit:
        if not (isinstance(pair, list) and len(pair) == 2):
            raise CorrectionError(f"{where}: an edit is [old text, new text], got {pair!r}")
        old, new = pair
        found = text.count(old)
        if found != 1:
            raise CorrectionError(f"{where}: expected the text {old[:60]!r} once in STEP's text, found it {found} times "
                                  "(has TIPNR changed?)")
        text = text.replace(old, new)
    return text


def _mark(person: dict, field: str) -> None:
    if person.get("added"):
        return
    fx = person.setdefault("fx", [])
    if field not in fx:
        fx.append(field)


def _edit_family(person: dict, family: dict, by_id: dict[str, dict], where: str) -> None:
    for field, change in family.items():
        if field not in FAMILY:
            raise CorrectionError(f"{where}: unknown family field {field!r} (expected one of {sorted(FAMILY)})")
        back = FAMILY[field]
        for other_id in change.get("remove", []):
            if other_id not in person[field]:
                raise CorrectionError(f"{where}: {other_id} is not in {field} (has TIPNR changed?)")
            person[field].remove(other_id)
            other = by_id[other_id]
            if person["id"] in other[back]:
                other[back].remove(person["id"])
                _mark(other, "family")
        for other_id in change.get("add", []):
            if other_id not in by_id:
                raise CorrectionError(f"{where}: {other_id} is not a person")
            if other_id not in person[field]:
                person[field].append(other_id)
            other = by_id[other_id]
            if person["id"] not in other[back]:
                other[back].append(person["id"])
                _mark(other, "family")
        _mark(person, "family")


def _apply_fix(person: dict, fix: dict, by_id: dict[str, dict], verses: Verses) -> None:
    where = f"people fixes: {person['id']}"
    unknown = set(fix) - FIX_KEYS
    if unknown:
        raise CorrectionError(f"{where}: unknown keys {sorted(unknown)} (expected some of {sorted(FIX_KEYS)})")
    _check_evidence(fix, verses, where)
    for field in TEXT_FIELDS:
        if field in fix:
            person[field] = _edit_text(person[field], fix[field], f"{where} {field}")
            _mark(person, field)
    if "period" in fix:
        if fix["period"] not in PERIODS:
            raise CorrectionError(f"{where}: period {fix['period']!r} is not one of {sorted(PERIODS)}")
        person["period_fix"] = fix["period"]
        _mark(person, "period")
    if "names" in fix:
        names = person["names"]
        for name in fix["names"].get("remove", []):
            if name not in names:
                raise CorrectionError(f"{where}: other name {name!r} is not listed (has TIPNR changed?)")
            names.remove(name)
        names.extend(n for n in fix["names"].get("add", []) if n not in names)
        names.sort()
        _mark(person, "names")
    if "refs" in fix:
        refs = set(person["refs"])
        for vid in _verse_ids(fix["refs"].get("remove", []), verses, where):
            if vid not in refs:
                raise CorrectionError(f"{where}: verse {vid} is not in this person's verses (has TIPNR changed?)")
            refs.discard(vid)
        refs.update(_verse_ids(fix["refs"].get("add", []), verses, where))
        person["refs"] = sorted(refs)
        _mark(person, "refs")
    if "family" in fix:
        _edit_family(person, fix["family"], by_id, where)
    if "same" in fix:
        if fix["same"] not in by_id or fix["same"] == person["id"]:
            raise CorrectionError(f"{where}: 'same' must name another person, got {fix['same']!r}")
        person["same"] = fix["same"]
    if "note" in fix:
        person["note"] = fix["note"]


def _added_person(new_id: str, entry: dict, verses: Verses) -> dict:
    where = f"people added: {new_id}"
    unknown = set(entry) - ADDED_KEYS
    if unknown:
        raise CorrectionError(f"{where}: unknown keys {sorted(unknown)} (expected some of {sorted(ADDED_KEYS)})")
    _check_evidence(entry, verses, where)
    if entry.get("period") not in PERIODS:
        raise CorrectionError(f"{where}: period {entry.get('period')!r} is not one of {sorted(PERIODS)}")
    return {
        "id": new_id, "name": entry["name"], "names": sorted(entry.get("names", [])), "sex": entry["sex"],
        "description": entry["description"], "era": entry.get("era", ""), "tribe": entry.get("tribe", ""),
        "brief": entry["brief"], "short": entry["short"], "article": entry["article"],
        "refs": sorted(set(_verse_ids(entry["refs"], verses, where))), "skipped_refs": 0,
        "parents": [], "siblings": [], "partners": [], "children": [],
        "period_fix": entry["period"], "added": 1, **({"note": entry["note"]} if entry.get("note") else {}),
    }


def apply_people_corrections(people: list[dict], corrections: dict, verses: Verses, safe_id) -> dict:
    """Add the site's new records, then apply the fixes, in place. Returns a short report for the build log."""
    by_id = {p["id"]: p for p in people}
    added = corrections.get("added", {})
    for new_id, entry in added.items():
        if new_id in by_id:
            raise CorrectionError(f"people added: {new_id} already exists in TIPNR; correct it under 'fixes' instead")
        if not safe_id.match(new_id):
            raise CorrectionError(f"people added: id {new_id!r} cannot be a file name")
        person = _added_person(new_id, entry, verses)
        people.append(person)
        by_id[new_id] = person
    for new_id, entry in added.items():  # family links once every new record exists
        family = {field: {"add": entry[field]} for field in FAMILY if entry.get(field)}
        _edit_family(by_id[new_id], family, by_id, f"people added: {new_id}")
    fixes = corrections.get("fixes", {})
    missing = sorted(set(fixes) - set(by_id))
    if missing:
        raise CorrectionError(f"people fixes: {len(missing)} ids are not people, e.g. {missing[:3]}")
    for person_id, fix in fixes.items():
        _apply_fix(by_id[person_id], fix, by_id, verses)
    return {"added": len(added), "fixed": len(fixes), "marked": sum(1 for p in people if p.get("fx"))}
