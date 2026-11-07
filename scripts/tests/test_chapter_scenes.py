"""Checks for chapter_scenes.py (the script checks on a writer's answer) and chapter_scenes_view.py (the page wiring)."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import chapter_scenes  # noqa: E402
import chapter_scenes_view  # noqa: E402
import chapter_summary_studio  # noqa: E402

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
    for part in ('id="scenes-panel"', 'data-pipeline="scenes"', 'id="summaries-side"', 'id="scenes-top"', "renderScenes"):
        assert html.count(part) >= 1
    with pytest.raises(ValueError, match="Studio page changed"):
        chapter_scenes_view.install(html)


def test_scenes_route_rejects_unknown_chapter():
    with pytest.raises(ValueError, match="Unknown chapter"):
        chapter_scenes_view.answer("key=XYZ:1")


def make_store(tmp_path, prompt=GOOD["prompt"]):
    store = chapter_scenes.Store(tmp_path / "scenes.sqlite3")
    store.put("PSA:117", "haiku", {"scenes": [dict(GOOD, prompt=prompt)]})
    return store


def add_picture(store, prompt=GOOD["prompt"], scene=0):
    path = store.pictures_dir / chapter_scenes.picture_name("PSA:117", "haiku", scene)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"webp")
    store.save_picture("PSA:117", "haiku", scene, chapter_scenes.picture_hash(prompt), 1, 6.3, "2026-11-07T00:00:00+00:00")


def test_picture_counts_only_for_the_current_prompt_and_an_existing_file(tmp_path):
    store = make_store(tmp_path)
    assert [p[:3] for p in store.pending_pictures()] == [("PSA:117", "haiku", 0)]
    add_picture(store)
    add_picture(store, scene=4)  # an orphan row (index past the scenes) is ignored
    assert store.pending_pictures() == []
    assert store.picture_urls("PSA:117") == {"haiku": {0: "/pictures/haiku/PSA-117-0.webp?v="
                                                       + chapter_scenes.picture_hash(GOOD["prompt"])[:8]}}
    store.put("PSA:117", "haiku", {"scenes": [dict(GOOD, prompt=GOOD["prompt"] + " again")]})  # scene rewritten
    assert len(store.pending_pictures()) == 1 and store.picture_urls("PSA:117") == {}
    store.put("PSA:117", "haiku", {"scenes": [GOOD]})
    (store.pictures_dir / "haiku" / "PSA-117-0.webp").unlink()  # file gone, row still there
    assert len(store.pending_pictures()) == 1 and store.picture_urls("PSA:117") == {}


@pytest.mark.parametrize("raw", [
    "/pictures/haiku/../scenes.sqlite3", "/pictures/haiku/%2e%2e/PSA-117-0.webp", "/pictures/haiku/PSA-117-0.WEBP",
    "/pictures/other/PSA-117-0.webp", "/pictures/haiku/4AB-117-0.webp", "/pictures/haiku/PSA-117-0.webp\n",
    "/pictures/haiku/PSA-١١٧-0.webp", "/pictures/haiku/PSA-117-12.webp", "/pictures/haiku/PSA-117-1.webp",
])
def test_picture_route_serves_only_made_pictures(tmp_path, raw):
    add_picture(make_store(tmp_path))
    assert chapter_scenes_view.picture_file(raw, tmp_path / "pictures") is None


def test_picture_route_finds_a_made_picture(tmp_path):
    add_picture(make_store(tmp_path))
    found = chapter_scenes_view.picture_file("/pictures/haiku/PSA-117-0.webp", tmp_path / "pictures")
    assert found == (tmp_path / "pictures" / "haiku" / "PSA-117-0.webp").resolve()


def test_picture_maker_imports_without_torch_and_seeds_repeatably():
    import chapter_pictures
    assert chapter_pictures.seed_for("PSA:117", "haiku", 0) == chapter_pictures.seed_for("PSA:117", "haiku", 0)
    assert chapter_pictures.seed_for("PSA:117", "haiku", 0) != chapter_pictures.seed_for("PSA:117", "qwen", 0)
