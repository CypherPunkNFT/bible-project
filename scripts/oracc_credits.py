"""The credit and licence of each Oracc text the acquired library hosts (/teachers/works), from Oracc's own catalogues.

Oracc (the Open Richly Annotated Cuneiform Corpus, https://oracc.museum.upenn.edu) exports every project as JSON, and
every file of that export carries the same header line: "This data is released under the CC0 license". The held
texts copied that line into both their licence and their credit, so 7,709 hosted pages named nobody (source
permissions register, content/library/reports/source-permissions-20261127/REPORT.md, bucket 2). The texts themselves
say otherwise: each text's entry in its project's catalogue.json carries a `credits` line naming its editors and
stating "The annotated edition is released under the Creative Commons Attribution Share-Alike license 3.0. Please
cite this page as http://oracc.org/…", and Oracc's reuse page (doc/help/visitingoracc/reusingoracc, read 2026-11-27)
says "The Oracc default license is the Creative Commons Attribution Share-Alike license", project terms first. So a
hosted text is credited to Oracc, its project and its editors, under the licence its own credits name, or Oracc's
default where they name none (counted and printed). A credit naming any other licence stops the run.

Each text's first reading page also printed the header as "LICENSE: …CC0 license"; that line now names the licence
too. Reads the held project zips (KnowledgeBase/Biblical Historical Sources/**.zip,
Research/Artifacts/raw/oracc/*.zip) only; no network. build-acquired-teachers.py calls `apply` on every record it
builds; `--refresh` applies it to the unpacked library already built and re-packs it, changing only the licence,
licence link and credit of records that carry the export header and that one line of their first page, never which
texts are hosted.

    python scripts/oracc_credits.py --refresh
"""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
import zipfile
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
ZIP_FOLDERS = [ROOT / "KnowledgeBase" / "Biblical Historical Sources", ROOT / "Research" / "Artifacts" / "raw" / "oracc"]
UNPACKED = SITE / ".local/teacher-library-unpacked"

EXPORT_HEADER = "This data is released under the CC0 license"
HEADER_LINE = "LICENSE: " + EXPORT_HEADER
# Hosted texts with no catalogue entry in any held zip on 2026-11-27 (riao/ria4 Q000000, riao/ria5 Q004703,
# saao/saa03 Q009249, saao/saa08 X000005, saao/saa18 X238658). More means a zip has gone missing.
EXPECTED_UNHELD = 5
LICENCE = "CC BY-SA 3.0"
LICENCE_URL = "https://creativecommons.org/licenses/by-sa/3.0/"
HOSTS = {"oracc.museum.upenn.edu", "oracc.org", "www.oracc.org"}
BY_SA_3 = re.compile(r"Creative Commons Attribution[- ]Share[- ]?Alike licen[cs]e,? (?:version )?3\.0|CC[- ]BY[- ]SA[- ]3\.0", re.I)
ANY_LICENCE = re.compile(r"Creative Commons|\bCC[- ]?(?:BY|0)\b|licen[cs]e", re.I)
TITLE = re.compile(r"^([a-z0-9]+(?:/[a-z0-9]+)*) ([PQX]\d{6})$")
TEXT_ID = re.compile(r"^[PQX]\d{6}$")
# Oracc's umbrella projects, named as each presents itself (metadata.json, config.name and abbrev).
PROJECTS = {
    "rinap": "Royal Inscriptions of the Neo-Assyrian Period (RINAP)",
    "saao": "State Archives of Assyria online (SAAo)",
    "riao": "Royal Inscriptions of Assyria online (RIAo)",
    "ribo": "Royal Inscriptions of Babylonia online (RIBo)",
    "aemw": "Akkadian in the Eastern Mediterranean World (AEMW)",
}


def is_oracc(url: str | None) -> bool:
    try:
        return bool(url) and (urlsplit(url).hostname or "").lower() in HOSTS
    except ValueError:
        return False


def clean(credits: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html.unescape(credits))
    return re.sub(r"\s+", " ", text).strip().lstrip(">").strip()


class OraccCredits:
    """Every held catalogue entry's credits by (project path, text id), and each project's abbreviation and name."""

    def __init__(self, folders: list[Path] = ZIP_FOLDERS):
        self.credits: dict[tuple[str, str], str] = {}
        self.exported: dict[tuple[str, str], tuple] = {}
        self.names: dict[str, tuple[str, str]] = {}
        self.disagreements: list[str] = []
        self.unreadable: list[str] = []
        self.counts: Counter = Counter()
        self.by_id: dict[str, list[tuple[str, str]]] = {}
        for folder in folders:
            # The zips sit directly in the folder or one level down (KnowledgeBase/.../02 Assyrian Archives/*.zip);
            # walking the whole tree would read ~190,000 files on every library build.
            for path in sorted({*folder.glob("*.zip"), *folder.glob("*/*.zip")}) if folder.is_dir() else []:
                self._read_zip(path)
        for project, text_id in self.credits:
            self.by_id.setdefault(text_id, []).append((project, text_id))

    def _read_zip(self, path: Path) -> None:
        try:
            archive = zipfile.ZipFile(path)
        except (zipfile.BadZipFile, OSError):
            self.unreadable.append(str(path))
            return
        with archive:
            for name in archive.namelist():
                base = name.rsplit("/", 1)[-1]
                if base not in {"catalogue.json", "metadata.json"}:
                    continue
                try:
                    data = json.loads(archive.read(name).decode("utf-8-sig"))
                except (ValueError, UnicodeDecodeError, zipfile.BadZipFile, OSError, EOFError):
                    self.unreadable.append(f"{path.name}:{name}")
                    continue
                if not isinstance(data, dict):
                    if base == "catalogue.json":
                        self.unreadable.append(f"{path.name}:{name}")
                    continue
                folder = name.rsplit("/", 1)[0] if "/" in name else ""
                exported = archive.getinfo(name).date_time
                if base == "metadata.json":
                    config = data.get("config") or {}
                    project = str(data.get("project") or "")
                    if project and isinstance(config.get("abbrev"), str):
                        title = re.sub(r"^[a-z0-9]+(?:/[a-z0-9]+)*/", "", clean(str(config.get("name") or "")))
                        self.names.setdefault(project, (config["abbrev"], title))
                    continue
                for text_id, member in (data.get("members") or {}).items():
                    project = str(member.get("project") or "")
                    project = project if "/" in project else folder  # SAAo members say only "saa01"
                    if not member.get("credits") or not TEXT_ID.match(text_id):
                        continue
                    credits = clean(str(member["credits"]))
                    known = self.credits.get((project, text_id))
                    if known and known != credits:
                        self.disagreements.append(f"{project} {text_id} ({path.name})")
                    # Held zips were exported at different times; the newest export's credit is the one the cited
                    # Oracc page shows.
                    if not known or exported >= self.exported[(project, text_id)]:
                        self.credits[(project, text_id)] = credits
                        self.exported[(project, text_id)] = exported

    def _credits_for(self, project: str, text_id: str) -> str | None:
        found = self.credits.get((project, text_id))
        if found:
            return found
        # "rinap Q006333" names only the umbrella project: take it when every sub-project's entry agrees.
        candidates = {self.credits[(p, i)] for p, i in self.by_id.get(text_id, [])
                      if p == project or p.startswith(project + "/")}
        return candidates.pop() if len(candidates) == 1 else None

    def check(self, rows: list[tuple[str, str | None]]) -> None:
        """Credit every Oracc text about to be built, before anything is written, and stop if the held zips are
        missing or damaged: without them each text would lose its editors' names and nobody would notice. `rows` are
        (title, source url) pairs; the counts are printed and then reset for the build itself."""
        if not self.credits:
            raise SystemExit(f"No Oracc catalogue entries read from {', '.join(map(str, ZIP_FOLDERS))}: the held Oracc "
                             "zips are missing, so the texts would lose their editors' credits. Restore them first")
        if self.unreadable:
            raise SystemExit(f"Oracc zips that could not be read: {self.unreadable[:5]}. Restore or re-download them")
        # Once per text: the held manifests list most texts more than once.
        for title, url in {title: url for title, url in rows}.items():
            self.rights(title, url)
        unheld = self.counts["Oracc's default licence (no catalogue entry held)"]
        print("Oracc credits:", dict(self.counts))
        self.counts.clear()
        if unheld > EXPECTED_UNHELD:
            raise SystemExit(f"{unheld} Oracc texts have no catalogue entry in the held zips (expected at most "
                             f"{EXPECTED_UNHELD}): a zip is probably missing, so their editors would go uncredited")

    def rights(self, title: str, url: str | None) -> dict | None:
        """The licence, licence link and credit for one Oracc text, or None for anything else."""
        if not is_oracc(url):
            return None
        match = TITLE.match(title.strip())
        if not match:
            raise SystemExit(f"Oracc record {title!r} ({url}): expected a title '<project> <text id>'")
        project, text_id = match.groups()
        top = project.split("/")[0]
        abbrev, name = self.names.get(project, ("", ""))
        where = PROJECTS.get(top, top.upper())
        if abbrev and abbrev not in where:
            where += f", {abbrev}" + (f" ({name})" if name and name != abbrev else "")
        own = self._credits_for(project, text_id)
        stated = "CC BY-SA 3.0 (Creative Commons Attribution-ShareAlike 3.0), "
        if own and BY_SA_3.search(own):
            self.counts["licence stated by the text"] += 1
            stated += "as this edition's credits on Oracc state"
        elif own and ANY_LICENCE.search(own):
            raise SystemExit(f"Oracc {project} {text_id}: its credits name a licence other than CC BY-SA 3.0, so it is not "
                             f"relabelled: {own[:300]}")
        else:
            self.counts["Oracc's default licence (the text's credits name none)" if own
                        else "Oracc's default licence (no catalogue entry held)"] += 1
            stated += "Oracc's default licence for its editions"
        credit = f"From Oracc, the Open Richly Annotated Cuneiform Corpus: {where}, text {text_id}."
        if own:
            credit += f" {own}" + ("" if own.endswith((".", "/")) else ".")
        else:
            credit += " Edited by the project's scholars, named on the source page."
        credit += " Shown on Bible Guide as plain text with its glosses, under the same licence."
        return {"licence": LICENCE, "licenseUrl": LICENCE_URL, "credit": credit, "stated": stated}


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")


def apply(index: OraccCredits, record: dict, text: Path) -> bool:
    """Credit one unpacked library record if it is an Oracc text still carrying the export header, and correct the
    header's LICENSE line on its first reading page (text/<id>/0.json), which readers see too. Never touches
    availability or pages."""
    if record.get("licence") != EXPORT_HEADER or not is_oracc(record.get("sourceUrl")):
        return False
    rights = index.rights(record["title"], record["sourceUrl"])
    record.update({k: rights[k] for k in ("licence", "licenseUrl", "credit")})
    page = text / "0.json"
    if record.get("availability") == "on-site-text" and page.is_file():
        data = json.loads(page.read_text(encoding="utf-8"))
        first = data["blocks"][0]
        if HEADER_LINE in first["text"][:600]:
            first["text"] = first["text"].replace(HEADER_LINE, "LICENSE: " + rights["stated"], 1)
            write_json(page, data)
    return True


def shards(folder: Path) -> list[Path]:
    return sorted(p for p in folder.iterdir() if p.suffix == ".json") if folder.is_dir() else []


def packed_records() -> dict:
    rows: dict = {}
    for path in shards(SITE / "public/content/teacher-library/records"):
        rows.update(json.loads(path.read_text(encoding="utf-8")))
    return rows


def refresh(index: OraccCredits) -> Counter:
    """Apply the credits to the unpacked library (.local/teacher-library-unpacked, the packer's only input), then
    re-pack it with scripts/pack-teacher-library.py, whose page bundles are named by their content. The packed records
    must come out the same as before apart from the Oracc credits and the bundle names."""
    before = packed_records()
    unpacked: dict = {}
    for path in shards(UNPACKED / "records"):
        unpacked.update(json.loads(path.read_text(encoding="utf-8")))
    stale = [rid for rid in before.keys() | unpacked.keys()
             if {k: v for k, v in before.get(rid, {}).items() if k != "pageBundles"} != unpacked.get(rid)]
    if stale:
        raise SystemExit(f"The packed library differs from the unpacked one in {len(stale)} records (e.g. {stale[:3]}), so "
                         "re-packing would lose those changes; nothing was written. If an earlier refresh stopped before "
                         "packing, run scripts/pack-teacher-library.py and then this again")
    # Every credit first, so a text that cannot be credited stops the run before anything is written.
    index.check([(r["title"], r.get("sourceUrl")) for r in unpacked.values()
                 if r.get("licence") == EXPORT_HEADER and is_oracc(r.get("sourceUrl"))])
    changed: Counter = Counter()
    for path in shards(UNPACKED / "records"):
        rows = json.loads(path.read_text(encoding="utf-8"))
        hits = [rid for rid, record in rows.items() if apply(index, record, UNPACKED / "text" / rid)]
        for rid in hits:
            changed[rows[rid]["availability"]] += 1
        if hits:
            write_json(path, rows)
    subprocess.run([sys.executable, str(SITE / "scripts/pack-teacher-library.py")], check=True, cwd=SITE)
    after = packed_records()
    if set(before) != set(after):
        raise SystemExit(f"re-packing changed the set of records: {len(before)} before, {len(after)} after")
    for rid, old in before.items():
        new = after[rid]
        moved = {k for k in old.keys() | new.keys() if old.get(k) != new.get(k)}
        if moved - {"licence", "licenseUrl", "credit", "pageBundles"} or (moved - {"pageBundles"} and old.get("licence") != EXPORT_HEADER):
            raise SystemExit(f"re-packing changed {rid} beyond the Oracc credit: {sorted(moved)}. The packed copy is "
                             "already replaced (it is generated, not in git): rebuild it from the unpacked library")
        if len(old.get("pageBundles") or []) != len(new.get("pageBundles") or []):
            raise SystemExit(f"re-packing changed the page count of {rid}; the packed copy is already replaced")
    return changed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--refresh", action="store_true", help="apply the credits to the library already built")
    args = parser.parse_args()
    index = OraccCredits()
    print(json.dumps({"catalogue entries": len(index.credits), "projects named": len(index.names),
                      "unreadable": index.unreadable, "disagreements": len(index.disagreements)}, indent=1))
    if args.refresh:
        print(json.dumps(refresh(index), indent=1))


if __name__ == "__main__":
    sys.exit(main())
