"""Pictures of the key scenes, by theme (art style): the theme list, the exact text each picture is drawn from, its
hash, the file names and the pictures table in scenes.sqlite3. Standard library only, because the Studio (system Python)
and the picture maker (the image venv) both use it.
Docs: initiatives/chapter-scenes/README.md (sections Pictures; Themes and the gallery).
"""
from __future__ import annotations

import hashlib
import json
import re
from contextlib import closing
from pathlib import Path

import chapter_scenes

THEMES_FILE = chapter_scenes.DOCS / "themes.json"
THEME_ID = re.compile(r"[a-z0-9][a-z0-9-]{0,30}")
RESERVED = {"con", "prn", "aux", "nul", *(f"com{i}" for i in range(10)), *(f"lpt{i}" for i in range(10))}
WIDTH, HEIGHT, STEPS = 1344, 768, 16
THUMB_SIZE = (480, 270)  # 16:9 at the gallery's tile size
# How every picture is made; part of each picture's hash, so a change here redraws them all. Keep this exact text:
# the photographic pictures of 2026-11-07 were hashed with it.
RECIPE = f"FLUX.3 Image Klein bf16 (unsloth mirror) | {WIDTH}x{HEIGHT} | {STEPS} steps"
SCHEMA = ("CREATE TABLE IF NOT EXISTS pictures (key TEXT, writer TEXT, scene INTEGER, theme TEXT, file TEXT NOT NULL, "
          "prompt_sha256 TEXT NOT NULL, seed INTEGER NOT NULL, recipe TEXT NOT NULL, seconds REAL, made_at TEXT NOT NULL, "
          "PRIMARY KEY (key, writer, scene, theme))")


def load_themes(path: Path = THEMES_FILE) -> list[dict]:
    """themes.json, checked: every id is safe as a folder name and in a URL, and unique."""
    themes = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(themes, list) or not themes:
        raise ValueError(f"{path.name}: expected a non-empty list of themes")
    seen: set[str] = set()
    for theme in themes:
        if not isinstance(theme, dict) or not all(isinstance(theme.get(f), str) for f in ("id", "name", "description", "style")):
            raise ValueError(f"{path.name}: each theme needs text fields id, name, description and style; got {theme!r}")
        tid = theme["id"]
        if not THEME_ID.fullmatch(tid) or tid in RESERVED or tid in seen:
            raise ValueError(f"{path.name}: theme id {tid!r} is repeated or not lowercase letters, digits and dashes")
        seen.add(tid)
    return themes


def picture_text(style: str, prompt: str) -> str:
    """The exact text the image model reads. With no style it is the prompt alone (the photographic pictures)."""
    return f"{style}\n\nScene: {prompt}" if style else prompt


def picture_hash(text: str) -> str:
    return hashlib.sha256(f"{RECIPE}\n{text}".encode("utf-8")).hexdigest()


def seed_for(key: str, writer: str, scene: int) -> int:
    """One seed per scene, the same in every theme, so themes differ by style alone."""
    return int.from_bytes(hashlib.sha256(f"{key}|{writer}|{scene}".encode("utf-8")).digest()[:4], "big")


def picture_name(theme: str, key: str, writer: str, scene: int, thumb: bool = False) -> str:
    """e.g. flat-cartoon/haiku/1SA-17-0.webp, or flat-cartoon/haiku/thumbs/1SA-17-0.webp (scene is 0-based)."""
    code, chapter = key.split(":")
    return f"{theme}/{writer}/{'thumbs/' if thumb else ''}{code}-{chapter}-{scene}.webp"


class Pictures:
    """The pictures table beside the scenes. Refuses the table as it was before themes (no theme column)."""

    def __init__(self, store: chapter_scenes.Store | None = None, themes: list[dict] | None = None):
        self.store = store or chapter_scenes.Store()
        self.dir = self.store.path.parent / "pictures"
        self.themes = themes or load_themes()
        self.ids = [t["id"] for t in self.themes]
        with closing(self.store.connect()) as db, db:
            columns = [row[1] for row in db.execute("PRAGMA table_info(pictures)")]
            if columns and "theme" not in columns:
                raise RuntimeError("The pictures table has no theme column yet; run the one-off themes migration "
                                   "(initiatives/chapter-scenes/README.md) with the Studio stopped.")
            db.execute(SCHEMA)
            db.execute("PRAGMA journal_mode=WAL")  # the picture maker writes while the Studio reads

    def theme(self, theme_id) -> dict:
        for theme in self.themes:
            if theme["id"] == theme_id:
                return theme
        raise ValueError(f"Unknown theme {theme_id!r}; expected one of {', '.join(self.ids)}")

    def save(self, *, theme: str, key: str, writer: str, scene: int, sha: str, seed: int, seconds: float,
             made_at: str) -> None:
        with closing(self.store.connect()) as db, db:
            db.execute("INSERT OR REPLACE INTO pictures (key, writer, scene, theme, file, prompt_sha256, seed, recipe, "
                       "seconds, made_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                       (key, writer, scene, theme, picture_name(theme, key, writer, scene), sha, seed, RECIPE,
                        seconds, made_at))

    def states(self, key: str | None = None, theme_ids: list[str] | None = None):
        """Every scene in every theme as a dict: theme, key, writer, scene, title, verses, text, sha, fresh. A picture
        is fresh only while its row's hash matches the text it would be drawn from now and its file exists."""
        where, args = ("WHERE key=?", (key,)) if key else ("", ())
        with closing(self.store.connect()) as db:
            made = {row[:4]: row[4] for row in
                    db.execute(f"SELECT theme, key, writer, scene, prompt_sha256 FROM pictures {where}", args)}
            rows = db.execute(f"SELECT key, writer, payload FROM scenes {where}", args).fetchall()
        for theme in self.themes:
            if theme_ids and theme["id"] not in theme_ids:
                continue
            for k, writer, payload in rows:
                for index, scene in enumerate(json.loads(payload)["scenes"]):
                    text = picture_text(theme["style"], scene["prompt"])
                    sha = picture_hash(text)
                    fresh = (made.get((theme["id"], k, writer, index)) == sha
                             and (self.dir / picture_name(theme["id"], k, writer, index)).is_file())
                    yield {"theme": theme["id"], "key": k, "writer": writer, "scene": index, "title": scene["title"],
                           "verses": [scene["verse_start"], scene["verse_end"]], "text": text, "sha": sha,
                           "fresh": fresh}

    def pending(self, theme_ids: list[str] | None = None) -> list[dict]:
        return [s for s in self.states(theme_ids=theme_ids) if not s["fresh"]]

    def urls(self, state: dict) -> dict:
        """The picture's URL and its small version's (the full one until a small one exists); ?v= changes on a redraw."""
        name = picture_name(state["theme"], state["key"], state["writer"], state["scene"])
        thumb = picture_name(state["theme"], state["key"], state["writer"], state["scene"], thumb=True)
        version = f"?v={state['sha'][:8]}"
        full = f"/pictures/{name}{version}"
        return {"full": full, "thumb": f"/pictures/{thumb}{version}" if (self.dir / thumb).is_file() else full}

    def chapter(self, key: str) -> dict:
        """{writer: {scene index: {theme: urls}}} for the chapter's fresh pictures."""
        result: dict = {}
        for state in self.states(key):
            if state["fresh"]:
                result.setdefault(state["writer"], {}).setdefault(state["scene"], {})[state["theme"]] = self.urls(state)
        return result

    def summary(self) -> list[dict]:
        """Each theme with its counts and a sample picture, for the side panel (one pass; not for polling)."""
        counts = {tid: {"made": 0, "total": 0, "sample": None} for tid in self.ids}
        for state in self.states():
            count = counts[state["theme"]]
            count["total"] += 1
            if state["fresh"]:
                count["made"] += 1
                count["sample"] = count["sample"] or self.urls(state)["thumb"]
        return [{"id": t["id"], "name": t["name"], "description": t["description"], **counts[t["id"]]}
                for t in self.themes]

    def gallery(self, theme_id: str) -> list[list]:
        """The theme's fresh pictures in Bible order: [key, writer, scene, title, first verse, last verse, full, thumb]."""
        self.theme(theme_id)
        order = {k: i for i, k in enumerate(chapter_scenes.all_keys())}
        items = [s for s in self.states(theme_ids=[theme_id]) if s["fresh"]]
        items.sort(key=lambda s: (order.get(s["key"], 0), s["writer"], s["scene"]))
        return [[s["key"], s["writer"], s["scene"], s["title"], *s["verses"], *self.urls(s).values()] for s in items]
