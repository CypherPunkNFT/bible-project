#!/usr/bin/env python3
"""Download every raw source the site is built from, from its original publisher, into sources/.

    python scripts/fetch-sources.py            # everything (~135 MB), skips files already present
    python scripts/fetch-sources.py --force    # download again

Then: python scripts/build-data.py && python scripts/build-study.py (see README.md).

Each file is checked against the checksum recorded in SOURCES.md. Publishers (eBible.org above all) update
files in place, so a fresh download can differ from the copy this site was built from; that is reported, and
the build scripts then stop unless BIBLE_ACCEPT_SOURCE_CHANGES=1 is set. The Names of God lists are the site
owner's own selection and are not published elsewhere, so they ship in bundled-sources/ and are copied in.
"""

import argparse
import hashlib
import os
import re
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.paths import SITE  # noqa: E402
from bible.translations import TRANSLATIONS  # noqa: E402

USER_AGENT = "bible-project-fetch-sources/1.0 (+https://github.com/CYPKNFT/bible-project)"

# (checksum key in SOURCES.md, url, path under sources/, folder to unzip into or None)
DOWNLOADS = [
    (tid, f"https://ebible.org/Scriptures/{tid}_usfm.zip", f"ebible/{tid}/{tid}_usfm.zip", f"ebible/{tid}")
    for tid, *_ in TRANSLATIONS
] + [
    ("openbible", "https://a.openbible.info/data/cross-references.zip", "openbible/cross-references.zip", "openbible"),
    ("openbible-geo", "https://github.com/openbibleinfo/Bible-Geocoding-Data/archive/refs/heads/main.zip",
     "openbible-geo/Bible-Geocoding-Data.zip", "openbible-geo"),
    ("robertson-harmony", "https://www.gutenberg.org/files/36264/36264-h/36264-h.htm", "gutenberg/robertson-harmony-36264-h.htm", None),
    ("tipnr", "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Proper%20Nouns/"
     "TIPNR%20-%20Translators%20Individualised%20Proper%20Names%20with%20all%20References%20-%20STEPBible.org%20CC%20BY.txt",
     "stepbible/TIPNR.txt", None),
    ("torrey-xml", "https://ccel.org/ccel/t/torrey/ttt.xml", "ccel/ttt.xml", None),
]
BUNDLED = [("faith-names", "cypherpunk-faith/faith-names.json"), ("faith-names-approved", "cypherpunk-faith/faith-names-approved.json")]


def recorded_checksums() -> dict[str, str]:
    table = (SITE / "SOURCES.md").read_text(encoding="utf-8")
    return {m.group(1): m.group(2) for m in re.finditer(r"^\| \[([\w-]+)\]\([^)]*\) \|.*\| ([0-9a-f]{16}) \|$", table, re.M)}


def download(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    partial = target.with_suffix(target.suffix + ".part")
    with urllib.request.urlopen(request, timeout=120) as response, partial.open("wb") as out:
        shutil.copyfileobj(response, out)
    partial.replace(target)


def checksum(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--force", action="store_true", help="download files that are already present again")
    args = parser.parse_args()
    # Downloads always go inside this repository (or wherever BIBLE_SOURCES points).
    root = Path(os.environ["BIBLE_SOURCES"]).resolve() if os.environ.get("BIBLE_SOURCES") else SITE / "sources"
    root.mkdir(parents=True, exist_ok=True)
    recorded = recorded_checksums()
    changed = []
    for key, url, relative, unzip_to in DOWNLOADS:
        target = root / relative
        if args.force or not target.exists():
            print(f"downloading {key} …", flush=True)
            download(url, target)
        if unzip_to:
            with zipfile.ZipFile(target) as archive:
                archive.extractall(root / unzip_to)
        if checksum(target) != recorded.get(key):
            changed.append(key)
    for key, relative in BUNDLED:
        source = SITE / "bundled-sources" / relative
        (root / relative).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, root / relative)
        if checksum(root / relative) != recorded.get(key):
            changed.append(key)
    print(f"sources ready in {root}")
    if changed:
        print(f"{len(changed)} file(s) differ from the copies this site was built from (the publisher updated them): {', '.join(changed)}")
        print("Build anyway with BIBLE_ACCEPT_SOURCE_CHANGES=1 set; the text may differ slightly from the live site.")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
