"""Build the Manuscripts page's data (/study/manuscripts) from the open catalogue corpus.

    data/manuscripts/collection.json      every record the page shows, the holders, the books, the land outline and the
                                          summary counts (git-ignored, like all the site's generated data)
    public/images/manuscripts/<id>.jpg    the 29 openly licensed pictures, resized to 560 px (committed, like the museum
                                          pictures, because a clone has no access to the originals)
    public/images/manuscripts/manifest.json  each picture's licence, credit, Commons page and the SHA-256 of its original

Reads Research/Manuscripts/normalized/manuscripts/wikidata.json (CC0 + CC BY-SA), etcbc-dss.json (CC BY-NC; its scrolls
carry dates from Wikipedia, CC BY-SA, and Popovic et al. 2025, CC BY), syriaca.json (CC BY 3.0), the corpus's pinned
identities (tools/wikidata-pinned.json) and image licences (raw/commons/_harvest.json), and the Natural Earth land outline
(public domain) from the world-atlas package. csntm.json is all rights reserved and is never opened.

The record rules are the approved mock-up's (design/manuscripts-directions/build-data.py), kept in scripts/manuscripts/.
Run from Website/:  py -3.12 scripts/build-manuscripts.py   (bun run manuscripts)
"""
from __future__ import annotations

import datetime
import hashlib
import io
import json
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
SITE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SITE / "scripts" / "manuscripts"))

from ms_map import land_paths  # noqa: E402
from ms_records import (GA_KIND, IMAGE_TO_WITNESS, credit_name, dss_record, holder_table, load, summarise,  # noqa: E402
                        syriaca_record, wikidata_record)
from ms_tables import BOOKS, CATHOLIC, CODE_INDEX, EXCLUDED, GOSPELS, PAUL, WRITTEN  # noqa: E402

CORPUS = SITE.parent / "Research" / "Manuscripts"
NORMALIZED = CORPUS / "normalized" / "manuscripts"
ATLAS = SITE / "node_modules" / "world-atlas" / "land-50m.json"
OUT = SITE / "data" / "manuscripts"
IMAGES = SITE / "public" / "images" / "manuscripts"
FORBIDDEN = "csntm.json"  # all rights reserved: never read


def write_if_changed(path: Path, data: bytes) -> bool:
    """Writes only when the bytes differ, so a rebuild does not churn the committed pictures."""
    if path.exists() and path.read_bytes() == data:
        return False
    path.write_bytes(data)
    return True


def build_images(by_qid: dict, by_siglum: dict) -> dict:
    harvest = load(CORPUS / "raw" / "commons" / "_harvest.json")
    IMAGES.mkdir(parents=True, exist_ok=True)
    images, manifest, written = {}, [], 0
    for item in harvest["held"]:
        qid = item["qid"]
        target = by_siglum.get(IMAGE_TO_WITNESS[qid]) if qid in IMAGE_TO_WITNESS else by_qid.get(qid)
        if target is None:
            print(f"  image skipped (its record is left out): {item['commons_file']}")
            continue
        source = CORPUS / "images" / item["stored_as"]
        if not source.exists():
            raise FileNotFoundError(f"image for {qid}: expected the original at {source}, found nothing")
        key = target["i"]
        with Image.open(source) as img:
            img = img.convert("RGB")
            img.thumbnail((560, 560), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, "JPEG", quality=72, optimize=True, progressive=True)
            width, height = img.size
        jpeg = buffer.getvalue()
        written += write_if_changed(IMAGES / f"{key}.jpg", jpeg)
        target["im"] = key
        credit = credit_name(qid, item["attribution"])
        if not item.get("licence"):
            raise ValueError(f"image for {qid} ({item['commons_file']}): no licence recorded; it cannot be shown")
        images[key] = {"w": width, "h": height, "src": f"/images/manuscripts/{key}.jpg", "file": item["commons_file"], "page": item["commons_page"],
                       "lic": item["licence"], "by": credit, "via": None if qid not in IMAGE_TO_WITNESS else item["name"]}
        manifest.append({"file": f"{key}.jpg", "bytes": len(jpeg), "licence": item["licence"], "credit": credit,
                         "commons_file": item["commons_file"], "commons_page": item["commons_page"],
                         "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest()})
    text = json.dumps({"built_by": "scripts/build-manuscripts.py", "source": "Research/Manuscripts/raw/commons/_harvest.json",
                       "images": manifest}, ensure_ascii=False, indent=1) + "\n"
    write_if_changed(IMAGES / "manifest.json", text.encode("utf-8"))
    print(f"pictures: {len(images)} ({written} rewritten)")
    return images


def main() -> None:
    wikidata = load(NORMALIZED / "wikidata.json")["records"]
    etcbc = load(NORMALIZED / "etcbc-dss.json")["records"]
    pinned = {e["qid"]: e for e in load(CORPUS / "tools" / "wikidata-pinned.json")["entries"] if e.get("qid")}
    problems = {"pinned_traditions_restored": 0, "no_kind": [], "dates_reparsed": 0, "dates_year_as_century": 0,
                "dates_unreadable": [], "dates_from_notes": 0, "contents_unread": [], "holders_unplaced": 0,
                "dss_plates_left_out": 0, "dss_not_judaean": []}
    records = [r for r in (wikidata_record(rec, pinned, problems) for rec in wikidata) if r]
    records += [r for r in (dss_record(rec, problems) for rec in etcbc) if r]
    syriaca_path = NORMALIZED / "syriaca.json"
    assert syriaca_path.name != FORBIDDEN
    if syriaca_path.exists():
        records += [syriaca_record(rec, problems) for rec in load(syriaca_path)["records"]]
    seen: dict[tuple, str] = {}
    for r in records:
        if r["k"] in GA_KIND.values() and r.get("g"):
            key = (r["k"], r["g"])
            if key in seen:
                print(f"  duplicate siglum {key}: {seen[key]} and {r['n']}")
            seen[key] = r["n"]
    by_qid = {r["i"]: r for r in records if r["src"] == "wd"}
    by_siglum = {(r["k"], r.get("g")): r for r in records if r.get("g")}
    images = build_images(by_qid, by_siglum)
    data = {
        "built": datetime.date.today().isoformat(), "books": [{"code": c, "name": n, "ch": ch, "sec": s} for c, n, ch, s in BOOKS],
        "groups": {"gospels": [CODE_INDEX[c] for c in GOSPELS], "paul": [CODE_INDEX[c] for c in PAUL], "catholic": [CODE_INDEX[c] for c in CATHOLIC]},
        "written": {str(CODE_INDEX[c]): list(v) for c, v in WRITTEN.items()},
        "counts": summarise(records, images), "holders": holder_table(records), "images": images,
        "excluded": [{"n": next((r["name"] for r in wikidata if r["identifiers"]["wikidata_qid"] == q), q), "why": why} for q, why in EXCLUDED.items()],
        "map": land_paths(ATLAS), "records": records,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    (OUT / "collection.json").write_text(text, encoding="utf-8", newline="\n")
    print(f"data/manuscripts/collection.json: {len(records)} records, {len(images)} pictures, {len(data['holders'])} placed holders, "
          f"{len(text.encode('utf-8')) / 1e6:.2f} MB")
    print(json.dumps(data["counts"], ensure_ascii=False))
    for key, value in problems.items():
        print(f"  {key}: {len(value)}  e.g. {value[:8]}" if isinstance(value, list) else f"  {key}: {value}")


if __name__ == "__main__":
    main()
