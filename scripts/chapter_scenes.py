"""Key scenes for illustration, per Bible chapter: inputs, the local writer, the checks and the store.
Docs: initiatives/chapter-scenes/README.md. Nothing here writes the chapter-summary database.

python scripts/chapter_scenes.py items --out DIR [--pilot]          one .txt per chapter, for BatchRunner
python scripts/chapter_scenes.py local [--pilot] [--jobs 16]        local Qwen (HyperQwen :18020) writes, stored as "qwen"
python scripts/chapter_scenes.py import --writer haiku --runs DIR   checks and stores BatchRunner results
python scripts/chapter_scenes.py status
Pictures for the scenes: scripts/chapter_pictures.py (run with the image venv).
A chapter already stored for a writer is skipped; --redo writes it again.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import sys
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path

import chapter_summary_studio as studio

DOCS = studio.SITE / "initiatives" / "chapter-scenes"
STORE = studio.SITE / ".local" / "chapter-scene-studio" / "scenes.sqlite3"
SUMMARIES = studio.OUTPUT / "claude" / "summaries-v3.sqlite3"
URL = "http://127.0.0.1:18020/v1/chat/completions"
PILOT = ["GEN:22", "EXO:14", "LEV:16", "1CH:1", "1SA:17", "PSA:23", "PSA:117", "EZK:1", "MRK:4", "JHN:11", "ROM:8", "REV:21"]
TEXT_FIELDS = ["title", "moment", "why", "viewpoint", "focal_point", "foreground", "midground", "background", "light",
               "mood", "prompt"]
ENUMS = {"kind": {"event", "imagery", "vision", "setting"}, "shot": {"wide", "medium", "close"}}
FIELDS = TEXT_FIELDS + list(ENUMS) + ["verse_start", "verse_end", "people", "from_text", "added", "avoid"]
# How every picture is made; part of each picture's hash, so a change here remakes them all.
PICTURE_WIDTH, PICTURE_HEIGHT, PICTURE_STEPS = 1344, 768, 16
RECIPE = f"FLUX.3 Image Klein bf16 (unsloth mirror) | {PICTURE_WIDTH}x{PICTURE_HEIGHT} | {PICTURE_STEPS} steps"


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
            db.execute("CREATE TABLE IF NOT EXISTS pictures (key TEXT, writer TEXT, scene INTEGER, file TEXT NOT NULL, "
                       "prompt_sha256 TEXT NOT NULL, seed INTEGER NOT NULL, recipe TEXT NOT NULL, seconds REAL, "
                       "made_at TEXT NOT NULL, PRIMARY KEY (key, writer, scene))")
            db.execute("PRAGMA journal_mode=WAL")  # the picture maker writes while the Studio reads
        self.pictures_dir = path.parent / "pictures"

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

    def save_picture(self, key: str, writer: str, scene: int, sha: str, seed: int, seconds: float, made_at: str):
        with self.lock, closing(self.connect()) as db, db:
            db.execute("INSERT OR REPLACE INTO pictures VALUES (?,?,?,?,?,?,?,?,?)",
                       (key, writer, scene, picture_name(key, writer, scene), sha, seed, RECIPE, seconds, made_at))

    def _picture_states(self, key: str | None = None):
        """Every stored scene as (key, writer, index, prompt, current hash, picture is up to date). A picture is up to
        date only when its row's hash matches the scene's current prompt and recipe and its file exists."""
        where, args = ("WHERE key=?", (key,)) if key else ("", ())
        with closing(self.connect()) as db:
            made = {(k, w, i): sha for k, w, i, sha in
                    db.execute(f"SELECT key, writer, scene, prompt_sha256 FROM pictures {where}", args)}
            rows = db.execute(f"SELECT key, writer, payload FROM scenes {where} ORDER BY key, writer", args).fetchall()
        for k, w, payload in rows:
            for i, scene in enumerate(json.loads(payload)["scenes"]):
                sha = picture_hash(scene["prompt"])
                fresh = made.get((k, w, i)) == sha and (self.pictures_dir / picture_name(k, w, i)).is_file()
                yield k, w, i, scene["prompt"], sha, fresh

    def pending_pictures(self) -> list[tuple[str, str, int, str, str]]:
        """Scenes whose picture is missing or out of date: (key, writer, index, prompt, hash)."""
        return [s[:5] for s in self._picture_states() if not s[5]]

    def picture_urls(self, key: str) -> dict:
        """{writer: {scene index: URL}} for the chapter's up-to-date pictures; ?v= changes when a picture is remade."""
        urls: dict = {}
        for _, w, i, _, sha, fresh in self._picture_states(key):
            if fresh:
                urls.setdefault(w, {})[i] = f"/pictures/{picture_name(key, w, i)}?v={sha[:8]}"
        return urls

    def counts(self) -> dict:
        with closing(self.connect()) as db:
            return {"stored": dict(db.execute("SELECT writer, count(*) FROM scenes GROUP BY writer").fetchall()),
                    "failed": dict(db.execute("SELECT writer, count(*) FROM failures GROUP BY writer").fetchall())}


def picture_hash(prompt: str) -> str:
    """Identifies a picture's input: the scene's prompt plus the recipe. A rewritten prompt no longer matches."""
    return hashlib.sha256(f"{RECIPE}\n{prompt}".encode("utf-8")).hexdigest()


def picture_name(key: str, writer: str, scene: int) -> str:
    """Where a scene's picture lives under the pictures folder, e.g. haiku/1SA-17-0.webp (scene is 0-based)."""
    code, chapter = key.split(":")
    return f"{writer}/{code}-{chapter}-{scene}.webp"


def parse(text: str):
    text = re.sub(r"^\s*```(?:json)?\s*|\s*```\s*$", "", text.strip())
    start, end = text.find("{"), text.rfind("}")
    try:
        return json.loads(text[start:end + 1], strict=False) if start >= 0 else None
    except json.JSONDecodeError:
        return None


def ask_local(system: str, messages: list[dict]) -> str:
    body = {"model": "qwen3.8-27b", "max_tokens": 6000, "temperature": 0.4,
            "chat_template_kwargs": {"enable_thinking": False},
            "messages": [{"role": "system", "content": system}, *messages]}
    request = urllib.request.Request(URL, json.dumps(body).encode("utf-8"), {"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=900) as response:
        reply = json.loads(response.read().decode("utf-8"))["choices"][0]
    if reply.get("finish_reason") == "length":
        raise ValueError("the answer ran past 6,000 tokens and was cut off")
    return reply["message"]["content"]


def write_local(key: str, system: str, summary: dict | None, store: Store) -> str:
    """One chapter with the local model: one try, then one retry that is told what failed the checks."""
    messages, started, error = [{"role": "user", "content": item_text(key, summary)}], time.monotonic(), ""
    for attempt in (1, 2):
        reply = ask_local(system, messages)
        try:
            scenes, notes = check(parse(reply), key)
        except ValueError as exc:
            error = str(exc)
            messages += [{"role": "assistant", "content": reply},
                         {"role": "user", "content": f"Your answer failed a check: {error}. Answer again with the "
                                                     "complete corrected JSON only."}]
            continue
        store.put(key, "qwen", {"scenes": scenes, "notes": notes, "writer": "qwen", "model": "qwen3.8-27b (local, thinking off)",
                                "attempts": attempt, "seconds": round(time.monotonic() - started, 1),
                                "written_at": studio.now()})
        return "ok"
    store.fail(key, "qwen", error)
    return f"failed: {error}"


def run_local(keys: list[str], jobs: int) -> None:
    urllib.request.urlopen(URL.replace("chat/completions", "models"), timeout=10).close()
    system, notes, store = (DOCS / "scene-task.md").read_text(encoding="utf-8"), summaries(), Store()
    failures_in_a_row, lock = [0], threading.Lock()

    def one(key: str) -> None:
        if failures_in_a_row[0] >= 3:
            return
        try:
            result = write_local(key, system, notes.get(key), store)
        except OSError as exc:
            with lock:
                failures_in_a_row[0] += 1
            result = f"connection failed: {exc}"
            store.fail(key, "qwen", result)
        else:
            with lock:
                failures_in_a_row[0] = 0
        print(f"{key}: {result}", flush=True)

    with ThreadPoolExecutor(jobs) as pool:
        list(pool.map(one, keys))
    if failures_in_a_row[0] >= 3:
        sys.exit("Stopped: three connection failures in a row; is HyperQwen still running on :18020?")


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
    parser.add_argument("command", choices=["items", "local", "import", "status"])
    parser.add_argument("--pilot", action="store_true", help="only the 12 pilot chapters")
    parser.add_argument("--redo", action="store_true", help="write chapters already stored for this writer again")
    parser.add_argument("--jobs", type=int, default=16)
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
    elif args.command == "import":
        import_runs(args.writer, args.runs, args.model)
    else:
        done = set() if args.redo else Store().done("qwen")
        run_local([k for k in keys if k not in done], args.jobs)


if __name__ == "__main__":
    main()
