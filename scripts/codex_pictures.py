#!/usr/bin/env python3
"""Pictures drawn by headless Codex (its built-in image tool, on the owner's ChatGPT login) for a theme whose
themes.json entry says "engine": "codex". This script does not call Codex. It writes the list of pictures to draw
(the manifest) and, once a picture is verified, brings it into the Studio like a FLUX picture.
Docs: initiatives/chapter-scenes/CODEX_IMAGES.md (the run instructions) and README.md (Pictures; Themes).

python scripts/codex_pictures.py manifest --theme painterly-realism --section 3   one section's scenes
python scripts/codex_pictures.py import --theme painterly-realism --section 3     its "verified" entries into the Studio
python scripts/codex_pictures.py status --theme painterly-realism [--section 3]

Sections (2026-11-10): the chapters are cut into 7 runs that go at the same time, fixed in
initiatives/chapter-scenes/sections.json. Each has its own folder, codex/<theme>/section-<N>/, holding its manifest,
runner, batch logs and originals (a Codex worker may write only inside its own folder). Without --section the
manifest is codex/<theme>/manifest.json (the single run before sections).
Statuses: pending (to draw), generated (file saved, not checked), verified (checked by the runner), in_studio
(imported here), blocked.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import chapter_scenes
import scene_pictures

RUN_FIELDS = ("status", "attempts", "session_id", "artifact", "file_sha256", "last_error")
BATCH_SIZE = 3
SECTIONS_FILE = chapter_scenes.DOCS / "sections.json"
LEGACY = "manifest-before-sections.json"  # the single run's manifest, kept when the sections were cut


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def codex_theme(pictures: scene_pictures.Pictures, theme_id: str) -> dict:
    theme = pictures.theme(theme_id)
    if theme.get("engine") != "codex":
        sys.exit(f"Theme {theme_id!r} is drawn by the FLUX maker (chapter_pictures.py), not by Codex.")
    return theme


def folder(pictures: scene_pictures.Pictures, theme_id: str, section: int | None = None) -> Path:
    base = pictures.store.path.parent / "codex" / theme_id
    return base / f"section-{section}" if section else base


def section_keys(section: int, path: Path = SECTIONS_FILE) -> set[str]:
    """The chapters of one section: every key from its first to its last, in Bible order."""
    sections = {s["section"]: s for s in json.loads(path.read_text(encoding="utf-8"))}
    if section not in sections:
        sys.exit(f"Unknown section {section}; {path.name} has sections {sorted(sections)}")
    keys = chapter_scenes.all_keys()
    first, last = keys.index(sections[section]["first"]), keys.index(sections[section]["last"])
    return set(keys[first:last + 1])


def load(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8")) if path.is_file() else []


def write(path: Path, entries: list[dict]) -> None:
    """Whole file, temp name then rename, so a reader never sees half of it."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temp.write_text(json.dumps(entries, indent=1, ensure_ascii=False), encoding="utf-8")
    os.replace(temp, path)


def build_manifest(pictures: scene_pictures.Pictures, theme_id: str, keys: set[str] | None,
                   section: int | None = None) -> Path:
    """One entry per scene; an entry whose prompt is unchanged keeps its run fields, a changed one starts again.
    A section's first build takes the run fields from the single run's manifest (kept as LEGACY)."""
    codex_theme(pictures, theme_id)
    base = folder(pictures, theme_id, section)
    path = base / "manifest.json"
    old = {e["id"]: e for e in load(folder(pictures, theme_id) / LEGACY)} if section else {}
    old.update({e["id"]: e for e in load(path)})
    order = {k: i for i, k in enumerate(chapter_scenes.all_keys())}
    states = sorted((s for s in pictures.states(theme_ids=[theme_id]) if not keys or s["key"] in keys),
                    key=lambda s: (order.get(s["key"], 0), s["writer"], s["scene"]))
    entries = []
    for n, state in enumerate(states):
        code, chapter = state["key"].split(":")
        image_id = f"{state['writer']}/{code}-{chapter}-{state['scene']}"
        entry = {"id": image_id, "key": state["key"], "writer": state["writer"], "scene": state["scene"],
                 "title": state["title"], "verses": state["verses"], "prompt": state["text"], "sha": state["sha"],
                 "output": str(base / "originals" / f"{image_id}.png"),
                 "status": "pending", "batch": f"b{n // BATCH_SIZE + 1:03d}", "attempts": 0, "session_id": None,
                 "artifact": None, "file_sha256": None, "last_error": None}
        previous = old.get(image_id)
        if previous and previous.get("sha") == state["sha"]:
            entry.update({f: previous.get(f) for f in RUN_FIELDS})
        if state["fresh"]:
            entry["status"] = "in_studio"
        entries.append(entry)
    write(path, entries)
    return path


def studio_copy(source: Path):
    """The picture centre-cropped to 16:9 and sized like the FLUX pictures (1344 x 768)."""
    from PIL import Image
    with Image.open(source) as image:
        image = image.convert("RGB")
    width, height = image.size
    if width / height > 16 / 9:
        crop_w = round(height * 16 / 9)
        box = ((width - crop_w) // 2, 0, (width - crop_w) // 2 + crop_w, height)
    else:
        crop_h = round(width * 9 / 16)
        box = (0, (height - crop_h) // 2, width, (height - crop_h) // 2 + crop_h)
    return image.crop(box).resize((scene_pictures.WIDTH, scene_pictures.HEIGHT), Image.LANCZOS)


def save_webp(image, path: Path, size=None, quality: int = 90) -> None:
    from PIL import Image
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.stem}.{os.getpid()}.tmp")
    (image.resize(size, Image.LANCZOS) if size else image).save(temp, "WEBP", quality=quality)
    os.replace(temp, path)


def import_verified(pictures: scene_pictures.Pictures, theme_id: str, section: int | None = None) -> None:
    codex_theme(pictures, theme_id)
    path = folder(pictures, theme_id, section) / "manifest.json"
    entries = load(path)
    if not entries:
        sys.exit(f"No manifest at {path}; run the manifest command first.")
    current = {(s["key"], s["writer"], s["scene"]): s["sha"] for s in pictures.states(theme_ids=[theme_id])}
    counts = {"imported": 0, "skipped": 0}
    for entry in entries:
        if entry["status"] != "verified":
            continue
        source = Path(entry["output"])
        problem = None
        if current.get((entry["key"], entry["writer"], entry["scene"])) != entry["sha"]:
            problem = "the scene's prompt changed after this picture was made; rebuild the manifest and redraw it"
        elif not source.is_file():
            problem = f"verified but the file is missing: {source}"
        elif entry.get("file_sha256") and hashlib.sha256(source.read_bytes()).hexdigest() != entry["file_sha256"]:
            problem = f"the file no longer matches its recorded SHA256: {source}"
        if problem:
            entry["last_error"] = problem
            counts["skipped"] += 1
            print(f"{entry['id']}: not imported: {problem}")
            continue
        image = studio_copy(source)
        args = (theme_id, entry["key"], entry["writer"], entry["scene"])
        save_webp(image, pictures.dir / scene_pictures.picture_name(*args))
        save_webp(image, pictures.dir / scene_pictures.picture_name(*args, thumb=True), scene_pictures.THUMB_SIZE, 82)
        pictures.save(theme=theme_id, key=entry["key"], writer=entry["writer"], scene=entry["scene"], sha=entry["sha"],
                      seed=0, seconds=0.0, made_at=now())
        entry["status"] = "in_studio"
        counts["imported"] += 1
        write(path, entries)
    write(path, entries)
    print(f"Imported {counts['imported']} into the Studio, {counts['skipped']} not imported ({theme_id}).")


def status(pictures: scene_pictures.Pictures, theme_id: str, section: int | None = None) -> None:
    codex_theme(pictures, theme_id)
    entries = load(folder(pictures, theme_id, section) / "manifest.json")
    tally: dict[str, int] = {}
    for entry in entries:
        tally[entry["status"]] = tally.get(entry["status"], 0) + 1
    made = sum(1 for s in pictures.states(theme_ids=[theme_id]) if s["fresh"])
    print(json.dumps({"manifest": tally, "in_studio_all_chapters": made}, indent=1))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=["manifest", "import", "status"])
    parser.add_argument("--theme", required=True, help="a themes.json id whose engine is codex")
    parser.add_argument("--pilot", action="store_true", help="manifest: only the 12 pilot chapters")
    parser.add_argument("--keys", default="", help="manifest: comma-separated chapters such as GEN:22,1SA:17")
    parser.add_argument("--section", type=int, help="one section of sections.json (its own folder and manifest)")
    args = parser.parse_args()
    pictures = scene_pictures.Pictures()
    if args.command == "manifest":
        if args.section:
            keys = section_keys(args.section)
        else:
            keys = set(chapter_scenes.PILOT) if args.pilot else {k.strip() for k in args.keys.split(",") if k.strip()}
        unknown = keys - set(chapter_scenes.all_keys())
        if unknown:
            sys.exit(f"Unknown chapters {sorted(unknown)}; expected keys such as GEN:22")
        path = build_manifest(pictures, args.theme, keys or None, args.section)
        print(f"Manifest: {path} ({len(load(path))} pictures)")
    elif args.command == "import":
        import_verified(pictures, args.theme, args.section)
    else:
        status(pictures, args.theme, args.section)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
