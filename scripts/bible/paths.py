"""Where the raw downloads live, for every build script.

In order: the BIBLE_SOURCES environment variable; a `sources/` folder inside this repository (what
scripts/fetch-sources.py creates for anyone who cloned it); otherwise `../sources` beside the repository
(the original project layout).
"""

import os
from pathlib import Path

SITE = Path(__file__).resolve().parents[2]


def sources_dir() -> Path:
    override = os.environ.get("BIBLE_SOURCES")
    if override:
        return Path(override).resolve()
    inside = SITE / "sources"
    return inside if inside.is_dir() else SITE.parent / "sources"


SOURCES = sources_dir()
