"""Resolve all writable state into this instance, never the Fortress knowledge stores."""
import json
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
    temporary = file.with_suffix(file.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(file)
