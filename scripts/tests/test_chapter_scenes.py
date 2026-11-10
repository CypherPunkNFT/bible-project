"""Checks for chapter_scenes.py (the script checks on a writer's answer) and chapter_scenes_view.py (the page wiring)."""
import hashlib
import json
import msvcrt
import sqlite3
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import chapter_scenes  # noqa: E402
import chapter_pictures_runner  # noqa: E402
import chapter_scenes_view  # noqa: E402
import chapter_summary_studio  # noqa: E402
import scene_pictures  # noqa: E402

GOOD = {"title": "t", "kind": "event", "verse_start": 1, "verse_end": 2, "moment": "m", "why": "w", "shot": "wide",
        "viewpoint": "v", "focal_point": "f", "foreground": "a", "midground": "b", "background": "c", "people": [],
        "light": "l", "mood": "m", "from_text": [{"detail": "d", "verse": 2}], "added": [], "avoid": [],
        "prompt": " ".join(["word"] * 80)}


def test_scene_limits_follow_chapter_length():
    assert chapter_scenes.scene_limit("PSA", 117) == 1
    assert chapter_scenes.scene_limit("1SA", 17) == 3
    assert len(chapter_scenes.all_keys()) == 1189


def test_good_answer_passes_without_notes():
    scenes, notes = chapter_scenes.check({"scenes": [GOOD]}, "PSA:117")
    assert len(scenes) == 1 and notes == []


def test_extra_scenes_are_trimmed_and_noted():
    second = dict(GOOD, verse_start=1, verse_end=1)
    scenes, notes = chapter_scenes.check({"scenes": [GOOD, second]}, "PSA:117")
    assert len(scenes) == 1 and "limit of 1" in notes[0]


@pytest.mark.parametrize("answer, message", [
    (None, "non-empty"),
    ({"scenes": [dict(GOOD, verse_end=28)]}, "verses 1-28"),
    ({"scenes": [dict(GOOD, verse_start=21, verse_end=21)]}, "verses 21-21"),  # the BSB has no Matthew 17:21
    ({"scenes": [dict(GOOD, kind="painting")]}, "kind"),
    ({"scenes": [GOOD, dict(GOOD)]}, "same verses"),
    ({"scenes": [dict(GOOD, from_text=[{"detail": "x", "verse": 99}])]}, "from_text"),
    ({"scenes": [dict(GOOD, people=[{"who": "crowd", "count": "many", "action": "watch"}])]}, "people"),
    ({"scenes": [dict(GOOD, prompt="too short")]}, "prompt"),
])
def test_bad_answers_are_rejected(answer, message):
    with pytest.raises(ValueError, match=message):
        chapter_scenes.check(answer, "MAT:17")


def test_view_installs_once_into_the_studio_page():
    html = chapter_scenes_view.install(chapter_summary_studio.HTML)
    for part in ('id="scenes-panel"', 'data-pipeline="scenes"', 'id="summaries-side"', 'id="scenes-top"', "renderScenes", 'id="theme-list"', 'id="gallery"', 'id="lightbox"'):
        assert html.count(part) >= 1
    with pytest.raises(ValueError, match="Studio page changed"):
        chapter_scenes_view.install(html)


def test_scenes_route_rejects_unknown_chapter():
    with pytest.raises(ValueError, match="Unknown chapter"):
        chapter_scenes_view.answer("key=XYZ:1")


THEMES = [{"id": "photographic", "name": "Photo", "description": "d", "style": ""},
          {"id": "toon", "name": "Toon", "description": "d", "style": "A cartoon."}]


def make_pictures(tmp_path, prompt=GOOD["prompt"]):
    store = chapter_scenes.Store(tmp_path / "scenes.sqlite3")
    store.put("PSA:117", "haiku", {"scenes": [dict(GOOD, prompt=prompt)]})
    return scene_pictures.Pictures(store, THEMES)


def add_picture(pictures, theme="photographic", prompt=GOOD["prompt"], scene=0):
    style = next(t["style"] for t in THEMES if t["id"] == theme)
    path = pictures.dir / scene_pictures.picture_name(theme, "PSA:117", "haiku", scene)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"webp")
    pictures.save(theme=theme, key="PSA:117", writer="haiku", scene=scene, seed=1, seconds=6.3,
                  sha=scene_pictures.picture_hash(scene_pictures.picture_text(style, prompt)), made_at="2026-11-07")


def test_photographic_hash_is_unchanged_from_before_themes():
    old = hashlib.sha256(f"{scene_pictures.RECIPE}\n{GOOD['prompt']}".encode("utf-8")).hexdigest()
    assert scene_pictures.RECIPE == "FLUX.3 Image Klein bf16 (unsloth mirror) | 1344x768 | 16 steps"
    assert scene_pictures.picture_hash(scene_pictures.picture_text("", GOOD["prompt"])) == old
    assert scene_pictures.picture_text("A cartoon.", "x") == "A cartoon.\n\nScene: x"


def test_a_picture_counts_only_in_its_theme_for_the_current_prompt_and_an_existing_file(tmp_path):
    pictures = make_pictures(tmp_path)
    assert [(j["theme"], j["scene"]) for j in pictures.pending()] == [("photographic", 0), ("toon", 0)]
    add_picture(pictures)
    add_picture(pictures, scene=4)  # an orphan row (index past the scenes) is ignored
    assert [j["theme"] for j in pictures.pending()] == ["toon"]
    urls = pictures.chapter("PSA:117")["haiku"][0]["photographic"]
    assert urls["full"].startswith("/pictures/photographic/haiku/PSA-117-0.webp?v=") and urls["thumb"] == urls["full"]
    thumb = pictures.dir / scene_pictures.picture_name("photographic", "PSA:117", "haiku", 0, thumb=True)
    thumb.parent.mkdir(parents=True)
    thumb.write_bytes(b"webp")
    assert "/thumbs/" in pictures.chapter("PSA:117")["haiku"][0]["photographic"]["thumb"]
    assert [(t["id"], t["made"], t["total"]) for t in pictures.summary()] == [("photographic", 1, 1), ("toon", 0, 1)]
    assert [i[:3] for i in pictures.gallery("photographic")] == [["PSA:117", "haiku", 0]]
    pictures.store.put("PSA:117", "haiku", {"scenes": [dict(GOOD, prompt=GOOD["prompt"] + " again")]})  # rewritten
    assert len(pictures.pending(["photographic"])) == 1 and pictures.chapter("PSA:117") == {}
    pictures.store.put("PSA:117", "haiku", {"scenes": [GOOD]})
    (pictures.dir / "photographic" / "haiku" / "PSA-117-0.webp").unlink()  # file gone, row still there
    assert len(pictures.pending(["photographic"])) == 1
    assert pictures.gallery("photographic") == [["PSA:117", "haiku", 0, GOOD["title"], 1, 2, None, None]]  # listed, not drawn


def test_the_table_from_before_themes_is_refused(tmp_path):
    store = chapter_scenes.Store(tmp_path / "scenes.sqlite3")
    with sqlite3.connect(store.path) as db:
        db.execute("CREATE TABLE pictures (key TEXT, writer TEXT, scene INTEGER, file TEXT)")
    with pytest.raises(RuntimeError, match="migration"):
        scene_pictures.Pictures(store, THEMES)


@pytest.mark.parametrize("bad", ["con", "-x", "../x", "Toon", "a" * 32, "photographic"])
def test_theme_ids_must_be_safe_and_unique(tmp_path, bad):
    path = tmp_path / "themes.json"
    path.write_text(json.dumps(THEMES + [dict(THEMES[1], id=bad)]), encoding="utf-8")
    with pytest.raises(ValueError, match="theme id"):
        scene_pictures.load_themes(path)


def test_unknown_theme_is_refused(tmp_path):
    with pytest.raises(ValueError, match="Unknown theme"):
        make_pictures(tmp_path).gallery("nope")


@pytest.mark.parametrize("raw", [
    "/pictures/photographic/haiku/../../scenes.sqlite3", "/pictures/photographic/haiku/%2e%2e/PSA-117-0.webp",
    "/pictures/photographic/haiku/PSA-117-0.WEBP", "/pictures/photographic/other/PSA-117-0.webp",
    "/pictures/not-a-theme/haiku/PSA-117-0.webp", "/pictures/haiku/PSA-117-0.webp",
    "/pictures/photographic/haiku/4AB-117-0.webp", "/pictures/photographic/haiku/PSA-117-0.webp\n",
    "/pictures/photographic/haiku/PSA-١١٧-0.webp", "/pictures/photographic/haiku/PSA-117-12.webp",
    "/pictures/photographic/haiku/PSA-117-1.webp", "/pictures/photographic/haiku/thumbs/PSA-117-0.webp",
])
def test_picture_route_serves_only_made_pictures(tmp_path, raw):
    add_picture(make_pictures(tmp_path))
    assert chapter_scenes_view.picture_file(raw, tmp_path / "pictures") is None


def test_picture_route_finds_a_made_picture(tmp_path):
    # The route checks the real themes.json, so use its theme (2026-11-10: Painterly realism only).
    path = tmp_path / "pictures" / "painterly-realism" / "haiku" / "PSA-117-0.webp"
    path.parent.mkdir(parents=True)
    path.write_bytes(b"webp")
    found = chapter_scenes_view.picture_file("/pictures/painterly-realism/haiku/PSA-117-0.webp", tmp_path / "pictures")
    assert found == path.resolve()
    assert chapter_scenes_view.picture_file("/pictures/painterly-realism/qwen/PSA-117-0.webp", tmp_path / "pictures") is None


def test_the_lock_probe_sees_a_run_holding_the_lock(tmp_path):
    assert chapter_pictures_runner.lock_held(tmp_path) is False
    with open(tmp_path / ".lock", "a+", encoding="utf-8") as run:
        run.seek(0)
        msvcrt.locking(run.fileno(), msvcrt.LK_NBLCK, 1)
        assert chapter_pictures_runner.lock_held(tmp_path) is True
        run.seek(0)
        msvcrt.locking(run.fileno(), msvcrt.LK_UNLCK, 1)
    assert chapter_pictures_runner.lock_held(tmp_path) is False


def test_runner_refuses_unknown_themes_and_paths():
    with pytest.raises(ValueError, match="Unknown theme"):
        chapter_pictures_runner.start("--keys=GEN:1")
    with pytest.raises(ValueError, match="Unknown picture request"):
        chapter_pictures_runner.handle_post("/api/pictures/other", {})


def test_picture_maker_imports_without_torch_and_seeds_the_same_in_every_theme():
    import chapter_pictures  # noqa: F401  (torch is imported only inside run())
    assert "torch" not in sys.modules
    assert scene_pictures.seed_for("PSA:117", "haiku", 0) == scene_pictures.seed_for("PSA:117", "haiku", 0)
    assert scene_pictures.seed_for("PSA:117", "haiku", 0) != scene_pictures.seed_for("PSA:117", "qwen", 0)
