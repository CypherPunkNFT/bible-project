"""Bible twenty questions: which stage owns each value (design §5.2-§5.4).

Order: Jesus's hand file; then a hand correction of a data value (corrections.source.json); then a final data value (yes or
no); everything else is the model's to decide. Shared by tq_items.py (what to ask) and tq_build.py (what to ship).
"""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from tq_data import ERAS, NT, SITE, data_values  # noqa: E402
from ooo_data import load_person, read_json  # noqa: E402

JESUS = "jesus-isa-7-14"
# What the model may answer per tag group (design §4.2). Books: data owns "no" (never named), so the model picks yes or unsure.
# Family facts are rarely denied by Scripture, so "no" needs a verse that states it; otherwise the merge turns it to unsure.
BOOK_TAGS_YES_UNSURE = ("books",)
FAMILY_NEEDS_VERSE_FOR_NO = ("married", "children", "tribe-judah", "tribe-benjamin", "levite", "twin", "long-life")
# Era tags that stay unsure for people whose dating the site marks as unsettled (design §5.2), so the model is not asked.
LOCKED_ERA = {"eli-1sa-1-3", "samuel-1sa-1-20", "job-job-1-1"}
ERA_TAGS = ("era-flood", "era-patriarchs", "era-exodus", "era-conquest", "era-judges", "era-first-kings", "era-divided", "era-exile")


def load_corrections() -> dict:
    return read_json(HERE / "corrections.source.json")


def settled_values(src, tags: list[dict], entry: dict, pool_ids: set, corrections: dict, refs) -> dict:
    """{tag: {"v", "by", "ref"/"src"}} for every tag the model must not decide. Raises on a stale correction."""
    pid, person = entry["id"], load_person(entry["id"])
    data = data_values(src, pid, person, pool_ids)
    tag_by_id = {t["id"]: t for t in tags}
    settled = {}
    for tag, (letter, evidence) in data.items():
        if letter in "yn":
            settled[tag] = {"v": letter, "by": "data", **({"ref": evidence} if isinstance(evidence, int) else {"src": evidence} if evidence else {})}
    for tag, rows in corrections["values"].items():
        if pid not in rows:
            continue
        if tag not in tag_by_id:
            raise SystemExit(f"corrections.source.json names an unknown tag {tag}")
        if tag_by_id[tag]["source"] != "data" and tag not in ("met-jesus",):
            raise SystemExit(f"corrections.source.json: {tag} is not a data-owned tag; corrections may only fix data values")
        letter, reason, *verse = rows[pid]
        if data.get(tag, ("?", None))[0] == letter:
            raise SystemExit(f"corrections.source.json: {entry['label']} · {tag} = {letter} already comes from the data; the correction is stale")
        value = {"v": letter, "by": "hand", "src": reason}
        if verse:
            parsed = refs.parse(verse[0])
            if parsed is None:
                raise SystemExit(f"corrections.source.json: {entry['label']} · {tag}: cannot read verse {verse[0]!r}")
            value["ref"] = parsed
        settled[tag] = value
    if pid in LOCKED_ERA:
        for tag in ERA_TAGS:
            settled.setdefault(tag, {"v": "?", "by": "hand", "src": "dating unsettled (design §5.2)"})
    if data.get("israelite", ("",))[0] == "?" and person.get("e") in ("Before the Flood", "Patriarchs"):
        for tag in ("israelite", "foreign"):  # design §4.2: before Israel existed both stay unsure; the model is not asked
            settled.setdefault(tag, {"v": "?", "by": "hand", "src": "before Jacob's sons (design §4.2)"})
    return settled


def asked_tags(tags: list[dict], settled: dict) -> list[dict]:
    """The tags the model decides for this person, each with the values it may give."""
    asked = []
    for tag in tags:
        if tag["id"] in settled:
            continue
        if tag["group"] in BOOK_TAGS_YES_UNSURE:
            allowed = "yes or unsure (never no: the person IS named in this book; yes means they take part in its events)"
        elif tag["id"] in FAMILY_NEEDS_VERSE_FOR_NO:
            allowed = "yes, no or unsure; no only with a verse that states it, otherwise unsure"
        else:
            allowed = "yes, no or unsure"
        asked.append({**tag, "allowed": allowed})
    return asked


def era_of(person: dict) -> str:
    era = person.get("e", "")
    return era if era in ERAS else "unsettled"


__all__ = ["JESUS", "NT", "SITE", "asked_tags", "era_of", "load_corrections", "settled_values"]
