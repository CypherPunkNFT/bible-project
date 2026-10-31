#!/usr/bin/env python3
"""Download every raw source the site is built from, from its original publisher, into sources/.

    python scripts/fetch-sources.py            # everything (~310 MB), skips files already present
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
import subprocess
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from bible.other_sources import OTHER_SOURCES  # noqa: E402
from bible.paths import SITE  # noqa: E402
from bible.translations import TRANSLATIONS  # noqa: E402

USER_AGENT = "bible-project-fetch-sources/1.0 (+https://github.com/CYPKNFT/bible-project)"

# The STEPBible-Data files below are pinned to one commit, so a later fetch gets exactly these bytes.
# (TIPNR still tracks master, as it has since it was first fetched; its recorded checksum guards it.
# The pinned files and TIPNR can therefore drift apart — see SOURCES.md before building on both.)
STEPBIBLE_COMMIT = "94802ced31e63882ab42a86d79eb0017df4545e3"  # 2026-10-16


def stepbible(path: str) -> str:
    """Raw URL for one file in STEPBible-Data at the pinned commit (its names contain spaces and +)."""
    return f"https://raw.githubusercontent.com/STEPBible/STEPBible-Data/{STEPBIBLE_COMMIT}/{urllib.parse.quote(path)}"


# (checksum key in SOURCES.md, url, path under sources/, folder to unzip into or None)
DOWNLOADS = [
    (tid, f"https://ebible.org/Scriptures/{tid}_usfm.zip", f"ebible/{tid}/{tid}_usfm.zip", f"ebible/{tid}")
    for tid, *_ in TRANSLATIONS if tid not in OTHER_SOURCES
] + [
    (tid, url, f"converted/{tid}/{url.rsplit('/', 1)[-1]}", None) for tid, (_format, url) in OTHER_SOURCES.items()
] + [
    ("openbible", "https://a.openbible.info/data/cross-references.zip", "openbible/cross-references.zip", "openbible"),
    ("openbible-geo", "https://github.com/openbibleinfo/Bible-Geocoding-Data/archive/refs/heads/main.zip",
     "openbible-geo/Bible-Geocoding-Data.zip", "openbible-geo"),
    ("robertson-harmony", "https://www.gutenberg.org/files/36264/36264-h/36264-h.htm", "gutenberg/robertson-harmony-36264-h.htm", None),
    ("tipnr", "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Proper%20Nouns/"
     "TIPNR%20-%20Translators%20Individualised%20Proper%20Names%20with%20all%20References%20-%20STEPBible.org%20CC%20BY.txt",
     "stepbible/TIPNR.txt", None),
    ("torrey-xml", "https://ccel.org/ccel/t/torrey/ttt.xml", "ccel/ttt.xml", None),
    ("nave-xml", "https://ccel.org/ccel/n/nave/bible.xml", "ccel/bible.xml", None),
    ("easton-xml", "https://ccel.org/ccel/e/easton/ebd2.xml", "ccel/ebd2.xml", None),
    # Reference library, 2026-10-07 (SOURCES.md "Reference library"; how each is to be used: REFERENCE_LIBRARY.md beside this repository).
    ("isbe", "https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/ISBE.zip", "crosswire/ISBE.zip", "crosswire/ISBE"),
    ("smith-xml", "https://ccel.org/ccel/s/smith_w/bibledict.xml", "ccel/smith-bibledict.xml", None),
    ("hitchcock-xml", "https://ccel.org/ccel/h/hitchcock/bible_names.xml", "ccel/hitchcock-bible-names.xml", None),
    ("fausset-ocr", "https://archive.org/download/bibleencyclopedi0000arfa_c4x1/bibleencyclopedi0000arfa_c4x1_djvu.txt",
     "archive-org/fausset-bible-encyclopedia-1900.txt", None),
    ("theographic", "https://github.com/robertrouse/theographic-bible-metadata/archive/refs/heads/master.zip",
     "theographic/theographic-bible-metadata.zip", "theographic"),
    ("openbible-topics", "https://a.openbible.info/data/topic-scores.zip", "openbible-topics/topic-scores.zip", "openbible-topics"),
    ("strongs", "https://github.com/openscriptures/strongs/archive/refs/heads/master.zip", "openscriptures/strongs.zip", "openscriptures/strongs"),
    ("hebrew-lexicon", "https://github.com/openscriptures/HebrewLexicon/archive/refs/heads/master.zip",
     "openscriptures/HebrewLexicon.zip", "openscriptures/HebrewLexicon"),
    ("thayer-ocr", "https://archive.org/download/thayer-lexicon/Thayer%20lexicon_djvu.txt", "archive-org/thayer-lexicon-1889.txt", None),
    ("josephus-antiquities", "https://www.gutenberg.org/cache/epub/2848/pg2848.txt", "gutenberg/josephus-antiquities-2848.txt", None),
    ("josephus-wars", "https://www.gutenberg.org/cache/epub/2850/pg2850.txt", "gutenberg/josephus-wars-2850.txt", None),
    ("josephus-life", "https://www.gutenberg.org/cache/epub/2846/pg2846.txt", "gutenberg/josephus-life-2846.txt", None),
    ("josephus-apion", "https://www.gutenberg.org/cache/epub/2849/pg2849.txt", "gutenberg/josephus-apion-2849.txt", None),
    # The rest of STEPBible-Data, 2026-10-17 (SOURCES.md "Build source checksum registry"; what each is
    # for: Pages/Study/ORIGINAL-LANGUAGES-PLAN.md). ~140 MB. Repo names keep their own quirks — two
    # spaces in "TFLSJ  0-5624", "Morphhology" in TEGMC, "CC-BY" in TAGNT where the rest say "CC BY".
    ("tahot-gen-deu", stepbible("Translators Amalgamated OT+NT/TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt"),
     "stepbible/TAHOT-Gen-Deu.txt", None),
    ("tahot-jos-est", stepbible("Translators Amalgamated OT+NT/TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt"),
     "stepbible/TAHOT-Jos-Est.txt", None),
    ("tahot-job-sng", stepbible("Translators Amalgamated OT+NT/TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt"),
     "stepbible/TAHOT-Job-Sng.txt", None),
    ("tahot-isa-mal", stepbible("Translators Amalgamated OT+NT/TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt"),
     "stepbible/TAHOT-Isa-Mal.txt", None),
    ("tagnt-mat-jhn", stepbible("Translators Amalgamated OT+NT/TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt"),
     "stepbible/TAGNT-Mat-Jhn.txt", None),
    ("tagnt-act-rev", stepbible("Translators Amalgamated OT+NT/TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt"),
     "stepbible/TAGNT-Act-Rev.txt", None),
    ("tbesh", stepbible("Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt"),
     "stepbible/TBESH.txt", None),
    ("tbesg", stepbible("Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt"),
     "stepbible/TBESG.txt", None),
    ("tflsj", stepbible("Lexicons/TFLSJ  0-5624 - Translators Formatted full LSJ Bible lexicon - STEPBible.org CC BY.txt"),
     "stepbible/TFLSJ-0-5624.txt", None),
    ("tflsj-extra", stepbible("Lexicons/TFLSJ extra - Translators Formatted full LSJ Bible lexicon - STEPBible.org CC BY.txt"),
     "stepbible/TFLSJ-extra.txt", None),
    ("tvtms", stepbible("Versification/TVTMS - Translators Versification Traditions with Methodology for Standardisation"
                        " for Eng+Heb+Lat+Grk+Others - STEPBible.org CC BY.txt"), "stepbible/TVTMS.txt", None),
    ("tehmc", stepbible("Morphology codes/TEHMC - Translators Expansion of Hebrew Morphology Codes - STEPBible.org CC BY.txt"),
     "stepbible/TEHMC.txt", None),
    ("tegmc", stepbible("Morphology codes/TEGMC - Translators Expansion of Greek Morphhology Codes - STEPBible.org CC BY.txt"),
     "stepbible/TEGMC.txt", None),
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


def sources_root() -> Path:
    """Where downloads go: BIBLE_SOURCES, else whichever sources/ the build scripts already read.

    bible/paths.py prefers a sources/ inside this repository and falls back to one beside it (the
    original project layout). Downloading must land in whichever of the two already holds the files:
    creating the other one builds a second copy that then shadows the real one for every build
    script. A fresh clone has neither and gets sources/ inside the repository, as README.md says.
    """
    if os.environ.get("BIBLE_SOURCES"):
        return Path(os.environ["BIBLE_SOURCES"]).resolve()
    inside, beside = SITE / "sources", SITE.parent / "sources"
    has_inside, has_beside = inside.is_dir(), beside.is_dir()
    if has_inside and has_beside:
        print(f"warning: a sources/ folder exists both inside ({inside}) and beside ({beside}) the repository. "
              f"Using the one inside; the builds read that one too, so {beside} is now ignored.")
    return beside if has_beside and not has_inside else inside


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--force", action="store_true", help="download files that are already present again")
    args = parser.parse_args()
    root = sources_root()
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
    subprocess.run([sys.executable, str(Path(__file__).with_name("convert-other-bibles.py"))], check=True)
    print(f"sources ready in {root}")
    if changed:
        print(f"{len(changed)} file(s) differ from the copies this site was built from (the publisher updated them): {', '.join(changed)}")
        print("Build anyway with BIBLE_ACCEPT_SOURCE_CHANGES=1 set; the text may differ slightly from the live site.")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
