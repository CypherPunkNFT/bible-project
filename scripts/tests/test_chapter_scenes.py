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
