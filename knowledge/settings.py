"""Resolve all writable state into this instance, never the Fortress knowledge stores."""
import json
import os
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load(config_path=None):
    file = Path(config_path or ROOT / "config.json").resolve()
    data = json.loads(file.read_text(encoding="utf-8-sig"))
    for key in ("state_dir", "site_dir", "sources_dir"):
        data[key] = (file.parent / data[key]).resolve()
    state = data["state_dir"]
    # Require a dedicated Bible instance; a mistyped path cannot write into the shared KB.
    if state.name != "KnowledgeBase" or state.parent.name != "BibleProject":
        raise ValueError("state_dir must be the dedicated BibleProject/KnowledgeBase directory")
    data["db"] = state / "knowledge.sqlite3"
    data["vectors"] = state / "vectors"
    data["embedding"]["gpu_lock"] = (file.parent / data["embedding"]["gpu_lock"]).resolve()
    return data


def write_json(file, value):
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(prefix=file.name + ".", suffix=".tmp", dir=file.parent)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2)
        # Windows readers/antivirus can briefly deny replacement of an open file.
        # Keep the previous valid JSON visible and retry the atomic rename.
        for attempt in range(30):
            try:
                temporary.replace(file)
                return
            except PermissionError:
                if attempt == 29:
                    raise
                time.sleep(min(.01 * 2**attempt, .2))
    finally:
        temporary.unlink(missing_ok=True)
