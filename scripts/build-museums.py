"""Build the Museum-Grade Archaeology page data from the artifacts research corpus.

Reads Research/Artifacts/ (built by its own tools; never written to here) and the project's 140-row
archaeology catalogue, and writes:

    data/museums/index.json            the museum cards
    data/museums/<slug>.json           one file per carded museum, including the Coming soon ones
    public/images/museums/<slug>/*.jpg resized derivatives of openly licensed photographs only
    public/images/museums/manifest.json  per-file licence, credit, size and source hash

`data/` is generated and git-ignored, as all the site's data is. `public/images/museums/` is
committed, like public/images/listen/, because a clone has no access to the 590 MB of originals —
which is also why the image manifest, not the originals, is the authority for what each page shows.

    py -3.12 scripts/build-museums.py           # write
    py -3.12 scripts/build-museums.py --check   # fail if the output is missing or stale
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

# 19 holder strings in the cuneiform catalogue are not ASCII, and this machine's console is cp1252.
# Without this, naming one of them in a message raises UnicodeEncodeError part-way through a run.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from museums import model  # noqa: E402
from museums.registry import (  # noqa: E402
    COLLECTIONS, COMING_SOON, GROUP_COLLECTIONS, GROUP_HOLDERS, GROUP_SOON, HOLDERS, PLACEHOLDERS,
    UNRECORDED_SLUG, holder_index,
)

WEBSITE = Path(__file__).resolve().parent.parent
PROJECT = WEBSITE.parent
CORPUS = PROJECT / "Research" / "Artifacts"
CATALOGUE = PROJECT / "KnowledgeBase" / "Biblical Archaeology" / "discovery-catalog.json"
OUT = WEBSITE / "data" / "museums"
IMAGES = WEBSITE / "public" / "images" / "museums"
SIDECAR = IMAGES / "manifest.json"

SCHEMA = "bibleproject.museums/v1"

# At most this many object records travel to the browser for one museum. The Met alone holds 35,836,
# and a page is for reading, not for shipping a catalogue; the true total is printed beside the cut.
OBJECT_CAP = 120
# Below this many audited or museum-stated records, a museum's list falls back to including the bare
# place-name matches as well, each labelled as the search hit it is, so no card opens an empty page.
PREFERRED_FLOOR = 12
# The fallback is capped far lower than the cap above. The Israel Museum has six audited objects and
# fifty-eight catalogue rows for seals; listing all of them buries the Tel Dan stele under a wall of
# near-identical entries, which is exactly the endless scroll the design notes rule out.
FALLBACK_CAP = 24
# Derivatives per museum. Named objects are always photographed; this caps the rest.
PHOTO_CAP = 12
VIEW_PX, VIEW_Q = 820, 74
THUMB_PX, THUMB_Q = 280, 72


# --- writing ----------------------------------------------------------------------------------------
def guarded(path: Path, root: Path) -> Path:
    """Every write goes through here: a path built from museum data must stay inside its own folder."""
    resolved = path.resolve()
    if not resolved.is_relative_to(root.resolve()):
        raise SystemExit(f"build-museums: refusing to write outside {root}: {path}")
    return resolved


def write_json(path: Path, root: Path, payload: object) -> None:
    """Written to a neighbour and renamed, so the preview server never serves half a file."""
    target = guarded(path, root)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(target.suffix + ".tmp")
    # newline="" keeps the "\n" written here as a bare LF. Python's text mode would otherwise turn it
    # into CRLF on Windows, so the committed image manifest would churn its whole 1,268 lines on every
    # run and show up as a change on a machine that had built nothing.
    with open(temporary, "w", encoding="utf-8", newline="") as handle:
        handle.write(json.dumps(payload, ensure_ascii=False, indent=1))
    os.replace(temporary, target)


# --- the corpus -------------------------------------------------------------------------------------
def source_files() -> list[Path]:
    return sorted((CORPUS / "normalized" / "objects").glob("*.json"))


def catalogue_rows() -> dict[str, dict]:
    if not CATALOGUE.exists():
        return {}
    entries = json.loads(CATALOGUE.read_text(encoding="utf-8")).get("entries", [])
    # 49 of the 140 rows — the Tel Dan stele, the Mesha stele and the Cyrus cylinder among them — were
    # audited before the reach and the limit were split into two fields, and state both in one
    # sentence under `scope_and_limit`. Without that fallback the best-known objects on the page would
    # show a catalogue heading with nothing under it.
    return {
        row["id"]: {
            "id": row["id"],
            "name": row.get("discovery_or_collection") or "",
            "category": row.get("category") or "",
            "supported": row.get("supported_proposition") or "",
            "unsupported": row.get("unsupported_extension") or "",
            "scope": row.get("scope_and_limit") or "",
            "passages": row.get("biblical_passages_or_topic") or "",
            "assessment": row.get("claim_assessment") or "",
        }
        for row in entries if row.get("id")
    }


def each_record():
    """One source file at a time, so the 72 MB Met file is not held beside the other six."""
    for path in source_files():
        for record in json.loads(path.read_text(encoding="utf-8")):
            yield record
        del record
    notables = CORPUS / "normalized" / "notables.json"
    if notables.exists():
        for record in json.loads(notables.read_text(encoding="utf-8")):
            record = dict(record)
            record["_notable"] = True
            yield record


# --- which card a record belongs to ------------------------------------------------------------------
def assign(record: dict, exact: dict[str, str], prefixes: list[tuple[str, str]]) -> list[str]:
    """The holder cards a record belongs to. Empty when its source records no institution."""
    recorded = str(record.get("museum") or "").strip()
    if recorded.casefold() in PLACEHOLDERS:
        return []
    parts = model.holder_parts(recorded)
    found, unresolved = [], False
    for part in parts:
        bare = model.strip_doubt(part)
        if bare.casefold() in PLACEHOLDERS:
            continue
        slug = exact.get(bare.casefold())
        if slug is None:
            slug = next((s for prefix, s in prefixes if bare.casefold().startswith(prefix)), None)
        if slug is None:
            unresolved = True
        elif slug not in found:
            found.append(slug)
    # A string naming two institutions is only split when both are known; otherwise it is one
    # unrecognised holder and belongs in the "other holders" list, not half-filed.
    return found if not (unresolved and len(parts) > 1) else ([] if unresolved else found)


def shape(record: dict, rows: dict[str, dict], photos: dict[str, dict]) -> dict:
    relevance = record.get("biblical_relevance") or {}
    basis = str(relevance.get("basis") or "none")
    recorded = str(record.get("museum") or "").strip()
    key = model.file_id(str(record.get("museum_slug") or "?"), str(record.get("object_id") or "?"))
    matched = [{**rows[ba], "match": model.catalogue_match(record, rows[ba]["name"])}
               for ba in relevance.get("ba_ids") or [] if ba in rows]
    identity = "object" if any(row["match"] == "object" for row in matched) else "related"
    shaped = {
        "id": key,
        "title": str(record.get("title") or "Untitled object"),
        "accession": str(record.get("accession_number") or ""),
        "recorded_as": recorded,
        "holder_uncertain": model.is_uncertain(recorded),
        "date": model.date_display(record),
        "culture": str(record.get("culture") or ""),
        "period": str(record.get("period") or ""),
        "findspot": str(record.get("findspot") or ""),
        "medium": str(record.get("medium") or ""),
        "dimensions": str(record.get("dimensions") or ""),
        "description": model.trim(record.get("description"), 420),
        "credit": str(record.get("credit_line") or ""),
        "basis": basis,
        "basis_label": model.basis_label(basis, identity),
        "people": list(relevance.get("people") or [])[:6],
        "places": list(relevance.get("places") or [])[:6],
        "source_url": str(record.get("source_url") or ""),
        "record_url": str(record.get("record_url") or ""),
        "licence": str(record.get("licence") or ""),
        "catalogue": matched,
    }
    if key in photos:
        shaped["photo"] = photos[key]
    if record.get("_notable"):
        shaped["why"] = str((record.get("extra") or {}).get("why_it_matters") or "")
    return shaped


def choose(records: list[dict]) -> tuple[list[dict], int]:
    """The records a museum page lists, and how many it holds in total."""
    records.sort(key=model.sort_key)
    preferred = [r for r in records if model.rank(r) <= 2]
    if len(preferred) >= PREFERRED_FLOOR:
        return preferred[:OBJECT_CAP], len(records)
    return records[:max(FALLBACK_CAP, len(preferred))], len(records)


# --- images -----------------------------------------------------------------------------------------
def load_sidecar() -> dict[str, dict]:
    if not SIDECAR.exists():
        return {}
    return json.loads(SIDECAR.read_text(encoding="utf-8")).get("files", {})


def derive(record: dict, key: str, held: dict[str, dict]) -> dict | None:
    """A photograph's committed derivatives, generating them when the original is to hand.

    The manifest is the authority: once a derivative exists, a run without the 590 MB of originals
    reproduces exactly the same page data.

    A derivative is filed under the source the record came from, never under the card showing it. One
    tablet sits under both the catalogue that recorded it and the museum that holds it, and both pages
    then serve the same file rather than a second copy of the same bytes.
    """
    licence = model.image_licence(record)
    if licence is None:
        return None
    credit = model.credit_line(record, licence)
    image = record.get("image") or {}
    folder = str(record.get("museum_slug") or "source")
    entry_key = f"{folder}/{key}"
    entry = held.get(entry_key)
    view_rel, thumb_rel = f"{folder}/{key}.jpg", f"{folder}/{key}-t.jpg"
    view, thumb = IMAGES / view_rel, IMAGES / thumb_rel
    if entry is None or not view.exists() or not thumb.exists():
        original = CORPUS / str(image.get("local_path") or "")
        if not str(image.get("local_path") or "") or not original.exists():
            return None
        from PIL import Image, ImageOps  # imported here so --check needs no Pillow
        with Image.open(original) as opened:
            flat = ImageOps.exif_transpose(opened)
            if flat.mode != "RGB":
                flat = flat.convert("RGB")
            sizes = {}
            for rel, path, box, quality in ((view_rel, view, VIEW_PX, VIEW_Q),
                                            (thumb_rel, thumb, THUMB_PX, THUMB_Q)):
                copy = flat.copy()
                copy.thumbnail((box, box), Image.LANCZOS)
                target = guarded(path, IMAGES)
                target.parent.mkdir(parents=True, exist_ok=True)
                temporary = target.with_suffix(".tmp")
                copy.save(temporary, "JPEG", quality=quality, optimize=True, progressive=True)
                with Image.open(temporary) as check:
                    check.verify()  # never commit a truncated JPEG
                os.replace(temporary, target)
                sizes[rel] = (copy.width, copy.height, target.stat().st_size)
        entry = {
            "raw_id": str(record.get("object_id") or ""),
            "view": view_rel, "thumb": thumb_rel,
            "width": sizes[view_rel][0], "height": sizes[view_rel][1],
            "bytes": sizes[view_rel][2] + sizes[thumb_rel][2],
            "thumb_width": sizes[thumb_rel][0], "thumb_height": sizes[thumb_rel][1],
            "licence": image.get("licence"), "licence_url": image.get("licence_url") or "",
            "credit": credit, "share_alike": licence in model.SHARE_ALIKE,
            "commons_page": image.get("commons_page") or "",
            "source_sha256": image.get("sha256") or "",
        }
        held[entry_key] = entry
    return {
        "view": f"/images/museums/{entry['view']}", "thumb": f"/images/museums/{entry['thumb']}",
        "width": entry["width"], "height": entry["height"],
        "thumb_width": entry["thumb_width"], "thumb_height": entry["thumb_height"],
        "licence": entry["licence"], "licence_url": entry["licence_url"],
        "credit": entry["credit"], "share_alike": entry["share_alike"],
        "commons_page": entry["commons_page"],
    }


def prune(held: dict[str, dict]) -> int:
    """Derivatives the manifest no longer lists are deleted, so a tracked folder cannot creep."""
    wanted = {IMAGES / entry["view"] for entry in held.values()}
    wanted |= {IMAGES / entry["thumb"] for entry in held.values()}
    removed = 0
    for path in sorted(IMAGES.rglob("*.jpg")):
        if path not in wanted:
            guarded(path, IMAGES).unlink()
            removed += 1
    for folder in sorted(IMAGES.iterdir(), reverse=True):
        if folder.is_dir() and not any(folder.iterdir()):
            guarded(folder, IMAGES).rmdir()
    return removed


# --- the build ---------------------------------------------------------------------------------------
def cards() -> list[dict]:
    out = []
    for entry in COLLECTIONS:
        out.append({**entry, "group": GROUP_COLLECTIONS,
                    "sources": [entry["source"], *entry.get("extra_sources", [])]})
    for entry in HOLDERS:
        out.append({**entry, "group": GROUP_HOLDERS})
    out.append({
        "slug": UNRECORDED_SLUG, "group": GROUP_HOLDERS, "kind": "unrecorded", "emblem": "unrecorded",
        "name": "Holding institution not recorded", "place": "—",
        "lead": "Half of the named objects reach us with no holder recorded anywhere in our sources, and "
                "nearly half of the photographs are among them. Several are famous enough that their "
                "museum is common knowledge — but common knowledge is not a record, and an object is not "
                "filed under a museum here on a guess. They are gathered on this page instead, with "
                "everything our sources do say about them.",
    })
    for entry in COMING_SOON:
        out.append({**entry, "group": GROUP_SOON})
    return out


def build() -> dict:
    rows = catalogue_rows()
    exact, prefixes = holder_index()
    registry = {card["slug"]: card for card in cards()}
    by_card: dict[str, list[dict]] = {slug: [] for slug in registry}
    unrecorded_named: list[dict] = []
    other_holders: dict[str, int] = {}
    source_of: dict[str, str] = {}
    for card in registry.values():
        for source in card.get("sources", ()):
            source_of[source] = card["slug"]

    # The Met, Cleveland and the Art Institute are both a collection we fetched from and the museum
    # holding the objects, so their own names must not also appear in the list of institutions that
    # have no card.
    own_name = {card["name"].casefold() for card in registry.values() if card.get("also_holder")}

    total = 0
    for record in each_record():
        total += 1
        slug = source_of.get(str(record.get("museum_slug") or ""))
        holders = assign(record, exact, prefixes)
        # One card at most once: the Met is both the collection a record came from and the institution
        # its own catalogue names as the holder, so it matches on both counts.
        targets = [slug] if slug else []
        targets += [holder for holder in holders if holder not in targets]
        for target in targets:
            by_card[target].append(record)
        if not holders:
            recorded = str(record.get("museum") or "").strip()
            if recorded.casefold() in PLACEHOLDERS:
                if record.get("_notable"):
                    unrecorded_named.append(record)
            elif recorded.casefold() not in own_name:
                other_holders[recorded] = other_holders.get(recorded, 0) + 1
    by_card[UNRECORDED_SLUG] = unrecorded_named

    held = load_sidecar()
    # Counted as distinct objects, not as rows on cards: one tablet appears under the catalogue that
    # recorded it and again under the museum that holds it, and adding those would overstate both.
    index_cards, matched_rows = [], set()
    photographed: set[str] = set()
    with_catalogue_row: set[str] = set()
    for slug, card in registry.items():
        records = by_card[slug]
        listed, count = choose(records)
        photos: dict[str, dict] = {}
        quota = PHOTO_CAP
        for record in listed:
            key = model.file_id(str(record.get("museum_slug") or "?"), str(record.get("object_id") or "?"))
            notable = bool(record.get("_notable"))
            if key in photos or (quota <= 0 and not notable):
                continue
            photo = derive(record, key, held)
            if photo:
                photos[key] = photo
                if not notable:
                    quota -= 1
        objects = [shape(r, rows, photos) for r in listed]
        for o in objects:
            # Only a row that is about THIS object counts. A name match is shown, never counted.
            for row in (r for r in o["catalogue"] if r["match"] == "object"):
                matched_rows.add(row["id"])
                with_catalogue_row.add(o["id"])
            if "photo" in o:
                photographed.add(o["photo"]["view"])
        state = GROUP_SOON if card["group"] == GROUP_SOON else ("held" if count else "empty")
        page = {
            "schema": SCHEMA, "slug": slug, "name": card["name"], "place": card.get("place", ""),
            "kind": card["kind"], "group": card["group"], "state": state,
            "emblem": card.get("emblem") or f"kind-{card['kind']}",
            "lead": card.get("lead", ""), "note": card.get("note", ""),
            "why_coming_soon": card.get("why_coming_soon", ""),
            "totals": {
                "records": count, "listed": len(objects), "photographs": sum(1 for o in objects if "photo" in o),
                "catalogue_rows": len({row["id"] for o in objects for row in o["catalogue"]
                                       if row["match"] == "object"}),
                "with_findspot": sum(1 for o in objects if o["findspot"]),
                "with_date": sum(1 for o in objects if o["date"]),
            },
            "recorded_as": sorted({o["recorded_as"] for o in objects if o["recorded_as"]})[:12],
            "objects": objects,
        }
        write_json(OUT / f"{slug}.json", OUT, page)
        index_cards.append({
            "slug": slug, "name": card["name"], "place": card.get("place", ""), "kind": card["kind"],
            "group": card["group"], "state": state, "emblem": page["emblem"],
            "lead": model.trim(card.get("lead", ""), 230),
            "records": count, "listed": len(objects), "photographs": page["totals"]["photographs"],
            "catalogue_rows": page["totals"]["catalogue_rows"],
            "thumb": next((o["photo"]["thumb"] for o in objects if "photo" in o), ""),
        })

    manifest = CORPUS / "manifest.json"
    index = {
        "schema": SCHEMA,
        "generated": json.loads(manifest.read_text(encoding="utf-8")).get("generated", ""),
        "corpus_sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
        "counts": {
            "cards": len(index_cards), "records_in_corpus": total,
            "catalogue_rows_matched": len(matched_rows), "catalogue_rows": len(rows),
            "photographs": len(photographed), "objects_with_catalogue_row": len(with_catalogue_row),
            "institutions_recorded": len(other_holders) + sum(
                1 for c in index_cards if c["group"] == GROUP_HOLDERS and c["slug"] != UNRECORDED_SLUG),
        },
        "cards": index_cards,
        "other_holders": [{"name": name, "records": n}
                          for name, n in sorted(other_holders.items(), key=lambda kv: (-kv[1], kv[0]))],
    }
    write_json(OUT / "index.json", OUT, index)
    write_json(SIDECAR, IMAGES, {
        "about": "Resized derivatives of openly licensed photographs from Research/Artifacts. Written by "
                 "scripts/build-museums.py; the authority for what each page shows, so the page data "
                 "rebuilds identically without the 590 MB of originals.",
        "files": held,
    })
    removed = prune(held)
    bytes_held = sum(entry["bytes"] for entry in held.values())
    print(f"build-museums: {len(index_cards)} cards, {total:,} records read, "
          f"{len(photographed)} photographs shown, {len(held)} derivatives "
          f"({bytes_held / 1_048_576:.1f} MB), {removed} pruned")
    return index


def check() -> int:
    if not OUT.exists() or not (OUT / "index.json").exists():
        print(f"build-museums: {OUT / 'index.json'} is missing. Run `npm run museums`.", file=sys.stderr)
        return 1
    index = json.loads((OUT / "index.json").read_text(encoding="utf-8"))
    problems = []
    if index.get("schema") != SCHEMA:
        problems.append(f"index schema is {index.get('schema')!r}, expected {SCHEMA!r}")
    known = {card["slug"] for card in cards()}
    present = {card["slug"] for card in index.get("cards", [])}
    if known != present:
        problems.append(f"the registry and the built index disagree: {sorted(known ^ present)}")
    held = load_sidecar()
    for slug in present:
        page = OUT / f"{slug}.json"
        if not page.exists():
            problems.append(f"no page data for {slug}")
            continue
        for obj in json.loads(page.read_text(encoding="utf-8")).get("objects", []):
            photo = obj.get("photo")
            if not photo:
                continue
            for key in ("view", "thumb"):
                path = IMAGES / photo[key].removeprefix("/images/museums/")
                if not path.exists():
                    problems.append(f"{slug}: {photo[key]} is referenced but not on disk")
            if not str(photo.get("credit") or "").strip():
                problems.append(f"{slug}: {obj['id']} shows a photograph with no credit")
    for key, entry in held.items():
        for which in ("view", "thumb"):
            path = IMAGES / entry[which]
            if not path.exists():
                problems.append(f"manifest lists {entry[which]}, which is not on disk")
        if str(entry.get("licence") or "").strip().casefold() not in model.OPEN_IMAGE_LICENCES:
            problems.append(f"manifest entry {key} has licence {entry.get('licence')!r}, which is not open")
    if problems:
        print("\n".join(f"build-museums: {p}" for p in problems), file=sys.stderr)
        return 1
    if not CORPUS.exists():
        print(f"build-museums: {len(present)} cards present and consistent. "
              f"The corpus is not on this machine, so freshness was not re-checked.")
        return 0
    print(f"build-museums: {len(present)} cards, {len(held)} derivatives, all present and consistent.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the output instead of writing it")
    arguments = parser.parse_args()
    if arguments.check:
        return check()
    if not CORPUS.exists():
        print(f"build-museums: the artifacts corpus is not at {CORPUS}; nothing to build.", file=sys.stderr)
        return 0
    if not source_files():
        raise SystemExit(f"build-museums: no normalized object files under {CORPUS / 'normalized' / 'objects'}")
    build()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
