"""The grant research, as one JSON document for the local /data_grants/ page (printed to stdout).

Reads the owner's grant research markdown (Redeemer Forge, Inc. grants, Bible Project funding, the
formation checklist) with the Grants Dashboard's own read-only parser, so both views read the files
the same way. Writes nothing: the local preview runs this, checks the JSON and keeps it in memory.

    python -I -B -X utf8 scripts/build-grant-research.py [--projects DIR] [--dashboard DIR]

--projects   the Jarvis/Projects folder (default: three folders above this Website)
--dashboard  the Grants Dashboard folder (default: <projects>/Websites/GrantsDashboard)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

WEBSITE = Path(__file__).resolve().parent.parent
# Every markdown file in these folders is shown as a document, registered in the dashboard or not.
DOCUMENT_FOLDERS = (
    ("RedeemerForgeInc/Grants", "Redeemer Forge, Inc. — grants"),
    ("BibleProject/AppDevelopment/Grants", "Bible Project — funding"),
)
EXTRA_DOCUMENTS = (("RedeemerForgeInc/Legal/Formation/FILING_CHECKLIST.md", "Formation"),)
LEAD_FIELDS = ("about", "amount", "deadline", "eligibility", "fit", "funder_open", "open_to_us", "status", "verified")


class BuildError(Exception):
    """A failure worth one plain line on the page."""


def load_dashboard(dashboard_dir: Path):
    package = dashboard_dir / "dashboard"
    if not (package / "extract.py").is_file():
        raise BuildError(f"Grants Dashboard parser not found: expected dashboard/extract.py under {dashboard_dir.name}")
    sys.path.append(str(dashboard_dir))  # appended, so nothing in that folder can stand in for a standard module
    from dashboard import config, extract, mdlines, mdparse
    return config, extract, mdlines, mdparse


def read_file(file_id: str, label: str, relative: str, group: str, projects: Path, mdlines, mdparse) -> dict:
    path = projects / relative
    base = {"id": file_id, "label": label, "name": path.name, "relative": relative, "group": group}
    try:
        data = path.read_bytes()
    except OSError as error:
        return {**base, "error": f"Could not read {path.name}: {error.strerror or error}", "blocks": []}
    try:
        doc = mdlines.parse_bytes(data, path.name)
        blocks = mdparse.parse_blocks(doc.texts)
    except Exception as error:  # noqa: BLE001 — one unreadable file must not blank the page; it is named on it instead
        message = getattr(error, "message", None) or repr(error)
        return {**base, "error": f"Could not parse {path.name}: {message}", "blocks": []}
    modified = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(timespec="seconds")
    return {**base, "error": None, "modified": modified, "lines": doc.texts, "blocks": blocks}


def collect_files(projects: Path, config, mdlines, mdparse) -> dict[str, dict]:
    group_of = {folder: group for folder, group in DOCUMENT_FOLDERS}
    files, seen = {}, set()
    for source in config.SOURCES:
        folder = source.relative.rsplit("/", 1)[0]
        group = group_of.get(folder, "Formation")
        files[source.id] = read_file(source.id, source.label, source.relative, group, projects, mdlines, mdparse)
        seen.add(source.relative.lower())
    for folder, group in DOCUMENT_FOLDERS:
        directory = projects / folder
        if not directory.is_dir():
            raise BuildError(f"Research folder missing: {folder}")
        for path in sorted(directory.glob("*.md")):
            relative = f"{folder}/{path.name}"
            if relative.lower() in seen:
                continue
            file_id = "doc-" + re.sub(r"[^0-9a-z]+", "-", relative.lower()).strip("-")
            files[file_id] = read_file(file_id, path.stem.replace("_", " ").title(), relative, group, projects, mdlines, mdparse)
            seen.add(relative.lower())
    for relative, group in EXTRA_DOCUMENTS:
        if relative.lower() not in seen:
            file_id = "doc-" + re.sub(r"[^0-9a-z]+", "-", relative.lower()).strip("-")
            files[file_id] = read_file(file_id, Path(relative).stem.replace("_", " ").title(), relative, group, projects, mdlines, mdparse)
    return files


def link_host(link: str | None) -> str:
    if not link:
        return ""
    host = urlsplit(link).hostname or ""
    return host.removeprefix("www.")


def organisation_keys(leads: list[dict]) -> dict[str, str]:
    """Each funder key -> the key it is grouped under. Only whole-word prefix/suffix name matches whose
    links do not point at different sites are grouped; everything else stays its own organisation."""
    hosts: dict[str, set[str]] = {}
    for lead in leads:
        hosts.setdefault(lead["key"], set()).update(filter(None, [link_host(lead.get("link"))]))
    keys = sorted(hosts, key=len)
    parent = {key: key for key in keys}

    def root(key: str) -> str:
        while parent[key] != key:
            key = parent[key]
        return key

    for index, short in enumerate(keys):
        for long in keys[index + 1:]:
            if not short or root(long) != long:
                continue
            if not (long.startswith(short + " ") or long.endswith(" " + short)):
                continue
            if hosts[short] and hosts[long] and not hosts[short] & hosts[long]:
                continue
            parent[long] = root(short)
    return {key: root(key) for key in keys}


def lead_record(lead: dict, organisation: str) -> dict:
    return {
        "id": lead["id"], "file": lead["file"], "line": lead["line"], "section": lead["section"],
        "kind": lead["kind"], "name": lead["name"], "name_raw": lead["name_raw"].strip(),
        "key": lead["key"], "org": organisation,
        "cells": {field: lead["cells"][field]["raw"].strip() for field in LEAD_FIELDS if field in lead["cells"]},
        "dates": lead["dates"], "date_from_text": lead["date_from_text"],
        "letter": lead["letter"], "funder_open": lead["funder_open"], "open_to_us": lead["open_to_us"],
        "programs": lead["programs"], "tracks": lead["tracks"], "link": lead.get("link"),
    }


def organisations(leads: list[dict], org_of: dict[str, str]) -> dict[str, dict]:
    found: dict[str, dict] = {}
    for lead in leads:
        org = found.setdefault(org_of[lead["key"]], {"names": [], "keys": []})
        if lead["name"] not in org["names"]:
            org["names"].append(lead["name"])
        if lead["key"] not in org["keys"]:
            org["keys"].append(lead["key"])
    for org in found.values():
        org["name"] = max(org["names"], key=len) if len(org["keys"]) > 1 else org["names"][0]
    return found


def tracker(todo: dict) -> list[dict]:
    """The owner's own status and notes per funder, from TODO.md's lead tracker."""
    rows = (todo.get("tracker") or {}).get("rows") or []
    return [{key: row[key] for key in ("name", "key", "status", "notes", "updated")} for row in rows]


def build(projects: Path, dashboard_dir: Path, today: date) -> dict:
    config, extract, mdlines, mdparse = load_dashboard(dashboard_dir)
    files = collect_files(projects, config, mdlines, mdparse)
    model = extract.build(files, today)
    org_of = organisation_keys(model["leads"])
    todo = model["todo"]
    for file in files.values():
        file.pop("lines", None)
    return {
        "version": 1,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "documents": list(files.values()),
        "leads": [lead_record(lead, org_of[lead["key"]]) for lead in model["leads"]],
        "organisations": organisations(model["leads"], org_of),
        "unclassified": model["unclassified"],
        "universities": [{key: card[key] for key in ("rank", "title", "place", "name", "first_block", "last_block")}
                         for card in model["universities"]],
        "listings": [{key: table[key] for key in ("block", "group", "subgroup")} for table in model["listings"]],
        "formation": model["formation"],
        "todo": {"sections": [{"heading": section["heading"], "items": [
            {key: item.get(key) for key in ("text", "checked", "due", "scheduled", "done")} for item in section["items"]]}
            for section in todo["sections"]]},
        "tracker": tracker(todo),
        "ids": {"todo": config.TODO_ID, "universities": "universities", "listings": config.LISTINGS_FILE,
                "readiness": config.READINESS_FILE, "filing": config.FILING_FILE, "readme": "readme"},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--projects", type=Path, default=WEBSITE.parent.parent)
    parser.add_argument("--dashboard", type=Path, default=None)
    args = parser.parse_args()
    projects = args.projects.resolve()
    dashboard_dir = (args.dashboard or projects / "Websites" / "GrantsDashboard").resolve()
    try:
        research = build(projects, dashboard_dir, datetime.now().astimezone().date())
    except BuildError as error:
        print(f"grant research: {error}", file=sys.stderr)
        return 2
    sys.stdout.write(json.dumps(research, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
