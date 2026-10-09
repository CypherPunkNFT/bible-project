"""Create held library assets from staged downloads (never overwrites).

Usage: python -X utf8 -I hold.py PLAN.json LIBRARYDIR RESULT.json
PLAN.json: list of {"stagedFile", "headersFile", "title", "slug", "sourcePage"}.
For each entry: makes LIBRARYDIR/asset-sermons-graham-<slug>/ (fails if it exists),
writes original.<ext> (byte copy of the staged response) and provenance.json.
RESULT.json: list of {"slug", "assetId", "sha256", "byteCount", "relativePath"}.
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

POLICY_URL = "https://billygraham.org/legal-permissions"


def as_utc_z(stamp):
    """'2026-10-08T12:00:00.123+00:00' -> '2026-10-08T12:00:00.123Z' (ISO UTC with Z)."""
    parsed = datetime.fromisoformat(stamp).astimezone(timezone.utc)
    return parsed.isoformat(timespec="seconds").replace("+00:00", "Z")


def build_one(entry, library):
    staged = Path(entry["stagedFile"])
    sidecar = json.loads(Path(entry["headersFile"]).read_text("utf-8"))
    body = staged.read_bytes()
    headers = sidecar["headers"]
    mime = headers.get("Content-Type", "").split(";")[0].strip()
    ext = {"application/pdf": "pdf", "text/html": "html"}.get(mime)
    if ext is None:
        raise ValueError(f"{staged}: unexpected Content-Type {mime!r}, expected pdf or html")
    asset_id = f"asset-sermons-graham-{entry['slug']}"
    folder = library / asset_id
    folder.mkdir(parents=False, exist_ok=False)  # never reuse a folder
    original = folder / f"original.{ext}"
    with original.open("xb") as fh:  # exclusive create: never overwrite
        fh.write(body)
    sha = hashlib.sha256(body).hexdigest()
    rel = f"library/source-billy-graham/{asset_id}/original.{ext}"
    provenance = {
        "url": sidecar["url"],
        "finalUrl": sidecar["finalUrl"],
        "mimeType": mime,
        "byteCount": len(body),
        "sha256": sha,
        "retrievedAt": as_utc_z(sidecar["retrievedAt"]),
        "headers": headers,
        "assetId": asset_id,
        "author": "Billy Graham",
        "title": entry["title"],
        "format": ext,
        "relativePath": rel,
        "sourcePage": entry["sourcePage"],
        "textKind": "official-sermon-transcript",
        "rightsCategory": "restricted-license",
        "useScope": "private-noncommercial-reading",
        "publicHostingAllowed": False,
        "publicFullTextIndexAllowed": False,
        "policyUrl": POLICY_URL,
    }
    with (folder / "provenance.json").open("x", encoding="utf-8") as fh:
        json.dump(provenance, fh, indent=2, ensure_ascii=False)
    return {"slug": entry["slug"], "assetId": asset_id, "sha256": sha,
            "byteCount": len(body), "relativePath": rel}


def main():
    plan = json.loads(Path(sys.argv[1]).read_text("utf-8"))
    library, result_path = Path(sys.argv[2]), Path(sys.argv[3])
    results = json.loads(result_path.read_text("utf-8")) if result_path.exists() else []
    done = {r["slug"] for r in results}
    for entry in plan:
        if entry["slug"] in done:
            continue
        results.append(build_one(entry, library))
        result_path.write_text(json.dumps(results, indent=1), "utf-8")
        print("held", results[-1]["assetId"])


if __name__ == "__main__":
    main()
