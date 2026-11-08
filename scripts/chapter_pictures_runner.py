"""The Studio's side of picture runs, plus the gallery list. Standard library only.
  POST /api/pictures/start {"theme": ID}   starts chapter_pictures.py --theme=ID with the image venv's Python
  POST /api/pictures/stop                  ends the run (its whole process tree); finished pictures are kept
  GET  /api/pictures/state                 the run as the maker reports it in pictures/.run.json, checked against its lock
  GET  /api/gallery?theme=ID               the theme's pictures in Bible order
A run's state never depends on this process: a restarted Studio finds a run that is still going through the lock and
the run file, and can stop it. Docs: initiatives/chapter-scenes/README.md (Themes and the gallery).
"""
from __future__ import annotations

import json
import msvcrt
import os
import subprocess
import threading
import time
import urllib.parse
from pathlib import Path

import chapter_summary_studio as studio
import scene_pictures

VENV_PYTHON = studio.SITE / ".local" / "flux3-venv" / "Scripts" / "python.exe"
MAKER = Path(__file__).resolve().with_name("chapter_pictures.py")
TASKKILL = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "taskkill.exe"
STARTING_GRACE = 30  # seconds a just-started child may take to take the lock
_spawn = threading.Lock()
_child: dict = {}  # the last child this Studio started: process, theme, started (monotonic)


def lock_held(pictures_dir: Path) -> bool:
    """True while a picture run holds pictures/.lock (probed for an instant; the maker retries if it collides)."""
    path = pictures_dir / ".lock"
    if not path.is_file():
        return False
    with open(path, "a+", encoding="utf-8") as handle:
        handle.seek(0)
        try:
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            return True
        handle.seek(0)
        msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        return False


def read_run(pictures_dir: Path) -> dict:
    try:
        return json.loads((pictures_dir / ".run.json").read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}


def log_tail(theme: str) -> str:
    """The last non-empty line of the theme's log (read from its end only)."""
    path = studio.SITE / ".local" / "chapter-scene-studio" / f"pictures-{theme}.log"
    if not path.is_file():
        return ""
    with open(path, "rb") as handle:
        handle.seek(max(0, path.stat().st_size - 4096))
        lines = [line.strip() for line in handle.read().decode("utf-8", "replace").splitlines()
                 if line.strip() and "it/s]" not in line and "s/it]" not in line]  # skip progress bars
    return lines[-1] if lines else ""


def starting() -> bool:
    process = _child.get("process")
    return bool(process and process.poll() is None and time.monotonic() - _child["started"] < STARTING_GRACE)


def state(pictures_dir: Path | None = None) -> dict:
    pictures_dir = pictures_dir or scene_pictures.Pictures().dir
    run = read_run(pictures_dir)
    if lock_held(pictures_dir):
        return {**run, "running": True}
    if starting():
        return {"running": True, "state": "starting", "themes": [_child["theme"]], "done": 0, "total": 0,
                "message": "Loading the image model…"}
    if run.get("state") == "running":  # the run ended without saying so: stopped from here, or it crashed
        last = log_tail(run["themes"][0]) if run.get("themes") else ""
        run = {**run, "state": "stopped", "message": f"Stopped after {run.get('done', 0)} of {run.get('total', 0)}."
               + (f" Last log line: {last}" if last and "Traceback" not in last else "")}
    process = _child.get("process")
    if process and process.poll() not in (None, 0) and not run:
        run = {"state": "stopped", "message": log_tail(_child["theme"]) or f"The picture maker exited ({process.poll()})."}
    return {**run, "running": False}


def start(theme_id) -> dict:
    pictures = scene_pictures.Pictures()
    theme = pictures.theme(theme_id)["id"]  # only an id from themes.json reaches the command line
    if not VENV_PYTHON.is_file():
        raise ValueError(f"The image environment is missing ({VENV_PYTHON}); it is set up once, see the README.")
    with _spawn:
        if lock_held(pictures.dir) or starting():
            raise ValueError("A picture run is already going; stop it first or wait for it to finish.")
        (pictures.dir / ".run.json").unlink(missing_ok=True)
        log = open(studio.SITE / ".local" / "chapter-scene-studio" / f"pictures-{theme}.log", "a", encoding="utf-8")
        try:
            process = subprocess.Popen(
                [str(VENV_PYTHON), str(MAKER), f"--theme={theme}"], cwd=studio.SITE, stdin=subprocess.DEVNULL,
                stdout=log, stderr=subprocess.STDOUT, env={**os.environ, "PYTHONUTF8": "1", "PYTHONUNBUFFERED": "1"},
                creationflags=subprocess.CREATE_NO_WINDOW | subprocess.CREATE_NEW_PROCESS_GROUP)
        finally:
            log.close()  # the child keeps its own handle
        _child.update(process=process, theme=theme, started=time.monotonic())
    return state(pictures.dir)


def stop() -> dict:
    pictures_dir = scene_pictures.Pictures().dir
    pids = []
    if lock_held(pictures_dir) and read_run(pictures_dir).get("pid"):
        pids.append(int(read_run(pictures_dir)["pid"]))  # written by the process that holds the lock
    process = _child.get("process")
    if process and process.poll() is None:
        pids.append(process.pid)
    for pid in pids:  # /T: the venv's python.exe is a launcher with the real interpreter as its child
        subprocess.run([str(TASKKILL), "/PID", str(pid), "/T", "/F"], capture_output=True, check=False)
    _child.clear()
    time.sleep(0.5)
    return state(pictures_dir)


def handle_get(path: str, query: str) -> dict:
    if path == "/api/pictures/state":
        return state()
    if path == "/api/gallery":
        theme = urllib.parse.parse_qs(query).get("theme", [""])[0]
        return {"theme": theme, "items": scene_pictures.Pictures().gallery(theme)}
    raise ValueError(f"Unknown picture request {path!r}")


def handle_post(path: str, body: dict) -> dict:
    if path == "/api/pictures/start":
        return start(body.get("theme"))
    if path == "/api/pictures/stop":
        return stop()
    raise ValueError(f"Unknown picture request {path!r}")
