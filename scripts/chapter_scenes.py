"""Key scenes for illustration, per Bible chapter: inputs, the checks and the store. Claude Haiku writes them through
BatchRunner (writer "haiku", all 1,189 chapters, 2026-11-09). Docs: initiatives/chapter-scenes/README.md. Nothing here
writes the chapter-summary database.

python scripts/chapter_scenes.py items --out DIR [--pilot]          one .txt per chapter, for BatchRunner
python scripts/chapter_scenes.py import --writer haiku --runs DIR   checks and stores BatchRunner results
python scripts/chapter_scenes.py status
Pictures of the scenes, by theme: scene_pictures.py (store) and codex_pictures.py (Codex-drawn themes).
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import threading
from contextlib import closing
from pathlib import Path

import chapter_summary_studio as studio

DOCS = studio.SITE / "initiatives" / "chapter-scenes"
STORE = studio.SITE / ".local" / "chapter-scene-studio" / "scenes.sqlite3"
SUMMARIES = studio.OUTPUT / "claude" / "summaries-v3.sqlite3"
PILOT = ["GEN:22", "EXO:14", "LEV:16", "1CH:1", "1SA:17", "PSA:23", "PSA:117", "EZK:1", "MRK:4", "JHN:11", "ROM:8", "REV:21"]
TEXT_FIELDS = ["title", "moment", "why", "viewpoint", "focal_point", "foreground", "midground", "background", "light",
               "mood", "prompt"]
ENUMS = {"kind": {"event", "imagery", "vision", "setting"}, "shot": {"wide", "medium", "close"}}
FIELDS = TEXT_FIELDS + list(ENUMS) + ["verse_start", "verse_end", "people", "from_text", "added", "avoid"]


def all_keys() -> list[str]:
    return [f"{b['code']}:{n}" for b in studio.books() for n in range(1, len(b["chapters"]) + 1)]


def scene_limit(code: str, chapter: int) -> int:
    """The owner's rule: up to 3 scenes, fewer for shorter chapters (by BSB word count)."""
    words = next(b for b in studio.books() if b["code"] == code)["chapters"][chapter - 1][1]
    return 1 if words < 250 else 2 if words < 450 else 3


def summaries() -> dict:
    with closing(sqlite3.connect(f"file:{SUMMARIES.as_posix()}?mode=ro", uri=True)) as db:
        return {key: json.loads(payload) for key, payload in db.execute("SELECT key, payload FROM summaries")}


def item_text(key: str, summary: dict | None) -> str:
    code, chapter = key.split(":")[0], int(key.split(":")[1])
    book = next(b for b in studio.books() if b["code"] == code)
    scripture = studio.source(code, chapter)
    numbers = sorted(studio.verse_numbers(scripture))
    gaps = sorted(set(range(numbers[0], numbers[-1] + 1)) - set(numbers))
    lines = [f"BOOK: {book['name']}, chapter {chapter}", f"SCENE LIMIT: {scene_limit(code, chapter)}",
             f"VERSES: {numbers[0]}-{numbers[-1]}" + (f" (the BSB has no verse {', '.join(map(str, gaps))})" if gaps else "")]
    if summary:
        lines += ["", f"SUMMARY TITLE: {summary['title']}", f"SUMMARY: {summary['summary']}", "OUTLINE:"]
        lines += [f"- vv. {p['verse_start']}-{p['verse_end']} {p['heading']}: {p['text']}" for p in summary["outline"]]
    return "\n".join(lines + ["", "BSB TEXT:", scripture["text"]])


def words(text: str) -> int:
    return len(text.split())


def check_scene(scene: dict, valid: set[int], where: str) -> dict:
    missing = [f for f in FIELDS if f not in scene]
    if missing:
        raise ValueError(f"{where} is missing {missing}")
    clean = {}
    for field in TEXT_FIELDS:
        if not isinstance(scene[field], str) or not scene[field].strip():
            raise ValueError(f"{where}: {field} must be non-empty text, got {scene[field]!r}")
        clean[field] = scene[field].strip()
    for field, allowed in ENUMS.items():
        if scene[field] not in allowed:
            raise ValueError(f"{where}: {field} must be one of {sorted(allowed)}, got {scene[field]!r}")
        clean[field] = scene[field]
    start, end = scene["verse_start"], scene["verse_end"]
    if type(start) is not int or type(end) is not int or start > end or start not in valid or end not in valid:
        raise ValueError(f"{where}: verses {start}-{end} are not an ordered range of this chapter's verses "
                         f"({min(valid)}-{max(valid)})")
    if words(clean["prompt"]) < 25:
        raise ValueError(f"{where}: prompt has {words(clean['prompt'])} words; it needs 60-160")
    people = scene["people"]
    if not isinstance(people, list) or any(not isinstance(p, dict) or not str(p.get("who", "")).strip()
                                           or type(p.get("count")) is not int or p["count"] < 0
                                           or not isinstance(p.get("action"), str) for p in people):
        raise ValueError(f"{where}: people must be a list of {{who, count (whole number), action}}")
    facts = scene["from_text"]
    if not isinstance(facts, list) or any(not isinstance(f, dict) or not str(f.get("detail", "")).strip()
                                          or f.get("verse") not in valid for f in facts):
        raise ValueError(f"{where}: every from_text entry needs a detail and a verse of this chapter")
    for field in ("added", "avoid"):
        if not isinstance(scene[field], list) or any(not isinstance(x, str) or not x.strip() for x in scene[field]):
            raise ValueError(f"{where}: {field} must be a list of non-empty text")
    return {**clean, "verse_start": start, "verse_end": end,
            "people": [{"who": p["who"].strip(), "count": p["count"], "action": p["action"].strip()} for p in people],
            "from_text": [{"detail": f["detail"].strip(), "verse": f["verse"]} for f in facts],
            "added": [x.strip() for x in scene["added"]], "avoid": [x.strip() for x in scene["avoid"]]}


def check(answer, key: str) -> tuple[list[dict], list[str]]:
    """The script checks: shape, the scene limit, verse ranges inside the chapter, filled fields, distinct moments.
    Returns (scenes, notes). Scenes past the limit are dropped (they come last, in order of importance) and a prompt
    outside 60-160 words is kept; both are noted for the owner rather than failing the chapter."""
    code, chapter = key.split(":")[0], int(key.split(":")[1])
    limit, valid = scene_limit(code, chapter), studio.verse_numbers(studio.source(code, chapter))
    scenes = answer.get("scenes") if isinstance(answer, dict) else None
    if not isinstance(scenes, list) or not scenes:
        raise ValueError("needs a JSON object with a non-empty \"scenes\" list")
    notes = [f"returned {len(scenes)} scenes against a limit of {limit}; kept the first {limit}"] if len(scenes) > limit else []
    clean = [check_scene(s if isinstance(s, dict) else {}, valid, f"scene {i + 1}") for i, s in enumerate(scenes[:limit])]
    ranges = [(s["verse_start"], s["verse_end"]) for s in clean]
    if len(set(ranges)) < len(ranges):
        raise ValueError(f"two scenes use the same verses {ranges}; each scene must be a different moment")
    notes += [f"scene {i + 1} prompt has {words(s['prompt'])} words (asked 60-160)"
              for i, s in enumerate(clean) if not 60 <= words(s["prompt"]) <= 160]
    return clean, notes


class Store:
    def __init__(self, path: Path = STORE):
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        with closing(self.connect()) as db, db:
            db.execute("CREATE TABLE IF NOT EXISTS scenes (key TEXT, writer TEXT, payload TEXT NOT NULL, "
                       "PRIMARY KEY (key, writer))")
            db.execute("CREATE TABLE IF NOT EXISTS failures (key TEXT, writer TEXT, error TEXT NOT NULL, "
                       "PRIMARY KEY (key, writer))")

    def connect(self):
        return sqlite3.connect(self.path, timeout=30)

    def put(self, key: str, writer: str, payload: dict) -> None:
        with self.lock, closing(self.connect()) as db, db:
            db.execute("INSERT OR REPLACE INTO scenes VALUES (?,?,?)", (key, writer, json.dumps(payload, ensure_ascii=False)))
            db.execute("DELETE FROM failures WHERE key=? AND writer=?", (key, writer))

    def fail(self, key: str, writer: str, error: str) -> None:
        with self.lock, closing(self.connect()) as db, db:
            db.execute("INSERT OR REPLACE INTO failures VALUES (?,?,?)", (key, writer, error))

    def done(self, writer: str) -> set[str]:
        with closing(self.connect()) as db:
            return {k for (k,) in db.execute("SELECT key FROM scenes WHERE writer=?", (writer,))}

    def chapter(self, key: str) -> dict:
        with closing(self.connect()) as db:
            return {w: json.loads(p) for w, p in db.execute("SELECT writer, payload FROM scenes WHERE key=?", (key,))}

    def keys(self) -> dict:
        with closing(self.connect()) as db:
            result = {}
            for key, writer in db.execute("SELECT key, writer FROM scenes"):
                result.setdefault(key, []).append(writer)
            return result

    def counts(self) -> dict:
        with closing(self.connect()) as db:
            return {"stored": dict(db.execute("SELECT writer, count(*) FROM scenes GROUP BY writer").fetchall()),
                    "failed": dict(db.execute("SELECT writer, count(*) FROM failures GROUP BY writer").fetchall())}


def parse(text: str):
    text = re.sub(r"^\s*```(?:json)?\s*|\s*```\s*$", "", text.strip())
    start, end = text.find("{"), text.rfind("}")
    try:
        return json.loads(text[start:end + 1], strict=False) if start >= 0 else None
    except json.JSONDecodeError:
        return None


def write_items(keys: list[str], out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    notes = summaries()
    for key in keys:
        (out / f"{key.replace(':', '_')}.txt").write_text(item_text(key, notes.get(key)), encoding="utf-8")
    print(f"Wrote {len(keys)} inputs to {out}")


def import_runs(writer: str, runs: Path, model: str) -> None:
    """BatchRunner writes OUT/<item>.json with the CLI's JSON; the answer is in structured_output (or result)."""
    store, counts = Store(), {"ok": 0, "failed": 0}
    for path in sorted(runs.glob("*.json")):
        key = path.stem.replace("_", ":", 1)
        if key not in set(all_keys()):
            continue
        raw = json.loads(path.read_text(encoding="utf-8"))
        answer = raw.get("structured_output") or parse(raw.get("result") or "")
        try:
            if (raw.get("num_turns") or 1) > 1:
                raise ValueError(f"{raw['num_turns']} turns: the call ran past --max-output and BatchRunner kept only "
                                 "the last turn; rerun with a bigger cap")
            scenes, notes = check(answer, key)
        except ValueError as exc:
            store.fail(key, writer, str(exc))
            counts["failed"] += 1
            print(f"{key}: failed: {exc}")
            continue
        store.put(key, writer, {"scenes": scenes, "notes": notes, "writer": writer, "model": model,
                                "turns": raw.get("num_turns"), "cost_usd": raw.get("total_cost_usd"),
                                "written_at": studio.now()})
        counts["ok"] += 1
    print(f"Imported {counts['ok']}, failed {counts['failed']} ({writer}).")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=["items", "import", "status"])
    parser.add_argument("--pilot", action="store_true", help="only the 12 pilot chapters")
    parser.add_argument("--out", type=Path)
    parser.add_argument("--runs", type=Path, help="BatchRunner output folder, for import")
    parser.add_argument("--writer", default="haiku")
    parser.add_argument("--model", default="claude-haiku-5-5")
    args = parser.parse_args()
    keys = PILOT if args.pilot else all_keys()
    if args.command == "status":
        print(json.dumps(Store().counts(), indent=1))
    elif args.command == "items":
        write_items(keys, args.out)
    else:
        import_runs(args.writer, args.runs, args.model)


if __name__ == "__main__":
    main()
