"""Names of God: the owner's approved list from his CypherPunk NFT Faith page (snapshot in sources/cypherpunk-faith/),
in his three groups and his order. Verse text is not copied; the page shows our own KJV text for each reference.
"""

import json
from pathlib import Path

from .study_refs import RefError, Verses, parse_refs

GROUPS = (("father", "The Father"), ("son", "The Son"), ("spirit", "The Holy Spirit"))
EXPECTED = {"father": 106, "son": 124, "spirit": 72}


def build_names(folder: Path, verses: Verses) -> dict:
    entries = json.loads((folder / "faith-names.json").read_text(encoding="utf-8"))["entries"]
    approved = json.loads((folder / "faith-names-approved.json").read_text(encoding="utf-8"))
    by_id = {e["id"]: e for e in entries}
    display = approved.get("names", {})
    groups = []
    for key, label in GROUPS:
        ids = approved["groups"][key]
        if len(ids) != EXPECTED[key]:
            raise ValueError(f"names: the owner's {key!r} group has {len(ids)} names, expected {EXPECTED[key]} — "
                             "the Faith page changed; re-check before updating EXPECTED")
        names = []
        for name_id in ids:
            entry = by_id.get(name_id)
            if entry is None:
                raise ValueError(f"names: approved id {name_id!r} has no entry in faith-names.json")
            refs = []
            for passage in entry["passages"]:
                try:
                    refs.extend(parse_refs(passage["reference"], verses))
                except RefError as error:
                    raise ValueError(f"names: {name_id}: {error}") from error
            names.append({"id": name_id, "name": display.get(name_id, entry["name"]), "note": entry.get("note", ""),
                          "refs": refs})
        groups.append({"key": key, "label": label, "names": names})
    return {"groups": groups}
