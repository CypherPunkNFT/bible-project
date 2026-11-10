"""Codex-drawn themes: kept apart from the FLUX maker, listed in a manifest, imported into the Studio once verified."""
import hashlib
import sys
from pathlib import Path

import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import chapter_scenes  # noqa: E402
import codex_pictures  # noqa: E402
import scene_pictures  # noqa: E402
from test_chapter_scenes import GOOD  # noqa: E402

THEMES = [{"id": "photographic", "name": "Photo", "description": "d", "style": ""},
          {"id": "paint", "name": "Paint", "description": "d", "style": "Painterly.", "engine": "codex"}]


@pytest.fixture
def pictures(tmp_path):
    store = chapter_scenes.Store(tmp_path / "scenes.sqlite3")
    store.put("PSA:117", "haiku", {"scenes": [GOOD, dict(GOOD, title="second")]})
    return scene_pictures.Pictures(store, THEMES)


def test_codex_theme_is_not_the_flux_makers_and_has_its_own_hash(pictures):
    assert pictures.flux_ids == ["photographic"] and pictures.ids == ["photographic", "paint"]
    paint = next(s for s in pictures.states() if s["theme"] == "paint")
    text = scene_pictures.picture_text("Painterly.", GOOD["prompt"])
    assert paint["text"] == text and paint["sha"] != scene_pictures.picture_hash(text)
    assert paint["sha"] == scene_pictures.picture_hash(text, scene_pictures.ENGINES["codex"])


def test_unknown_engine_is_refused(tmp_path):
    path = tmp_path / "themes.json"
    path.write_text('[{"id": "x", "name": "X", "description": "d", "style": "", "engine": "dalle"}]', encoding="utf-8")
    with pytest.raises(ValueError, match="engine"):
        scene_pictures.load_themes(path)


def test_manifest_then_verified_import_reaches_the_studio(pictures):
    path = codex_pictures.build_manifest(pictures, "paint", None)
    entries = codex_pictures.load(path)
    assert [e["id"] for e in entries] == ["haiku/PSA-117-0", "haiku/PSA-117-1"]
    assert {e["status"] for e in entries} == {"pending"} and entries[0]["prompt"].startswith("Painterly.\n\nScene: ")
    # The runner saves a 3:2 picture and marks it verified; the second stays pending.
    original = Path(entries[0]["output"])
    original.parent.mkdir(parents=True)
    Image.new("RGB", (1536, 1024), (200, 150, 90)).save(original)
    entries[0].update(status="verified", file_sha256=hashlib.sha256(original.read_bytes()).hexdigest())
    codex_pictures.write(path, entries)
    codex_pictures.import_verified(pictures, "paint")
    assert [e["status"] for e in codex_pictures.load(path)] == ["in_studio", "pending"]
    fresh = [(s["scene"]) for s in pictures.states(theme_ids=["paint"]) if s["fresh"]]
    assert fresh == [0]
    with Image.open(pictures.dir / scene_pictures.picture_name("paint", "PSA:117", "haiku", 0)) as image:
        assert image.size == (1344, 768)
    with Image.open(pictures.dir / scene_pictures.picture_name("paint", "PSA:117", "haiku", 0, thumb=True)) as image:
        assert image.size == scene_pictures.THUMB_SIZE
    # Rebuilding keeps the run fields of an unchanged entry.
    codex_pictures.build_manifest(pictures, "paint", None)
    assert [e["status"] for e in codex_pictures.load(path)] == ["in_studio", "pending"]


def test_a_changed_file_is_not_imported(pictures):
    path = codex_pictures.build_manifest(pictures, "paint", None)
    entries = codex_pictures.load(path)
    original = Path(entries[0]["output"])
    original.parent.mkdir(parents=True)
    Image.new("RGB", (1536, 1024)).save(original)
    entries[0].update(status="verified", file_sha256="0" * 64)
    codex_pictures.write(path, entries)
    codex_pictures.import_verified(pictures, "paint")
    entry = codex_pictures.load(path)[0]
    assert entry["status"] == "verified" and "SHA256" in entry["last_error"]


def test_flux_theme_refused_by_codex_script(pictures):
    with pytest.raises(SystemExit):
        codex_pictures.build_manifest(pictures, "photographic", None)


def test_section_keys_runs_first_to_last_and_refuses_unknown(tmp_path):
    path = tmp_path / "sections.json"
    path.write_text('[{"section": 1, "first": "GEN:49", "last": "EXO:2"}]', encoding="utf-8")
    assert codex_pictures.section_keys(1, path) == {"GEN:49", "GEN:50", "EXO:1", "EXO:2"}
    with pytest.raises(SystemExit):
        codex_pictures.section_keys(2, path)


def test_real_sections_cover_every_chapter_once():
    keys = [codex_pictures.section_keys(n) for n in range(1, 8)]
    assert sum(len(k) for k in keys) == len(set().union(*keys)) == len(chapter_scenes.all_keys()) == 1189


def test_section_manifest_lives_in_its_folder_and_carries_the_single_run(pictures):
    legacy = codex_pictures.build_manifest(pictures, "paint", None)
    entries = codex_pictures.load(legacy)
    entries[1].update(status="blocked", attempts=3, last_error="moderation_blocked")
    codex_pictures.write(legacy.with_name(codex_pictures.LEGACY), entries)
    path = codex_pictures.build_manifest(pictures, "paint", {"PSA:117"}, section=4)
    assert path.parent.name == "section-4"
    section = codex_pictures.load(path)
    assert all(Path(e["output"]).is_relative_to(path.parent / "originals") for e in section)
    assert [(e["status"], e["attempts"]) for e in section] == [("pending", 0), ("blocked", 3)]
    # The section's own manifest wins on a rebuild.
    section[1].update(status="pending", attempts=0)
    codex_pictures.write(path, section)
    codex_pictures.build_manifest(pictures, "paint", {"PSA:117"}, section=4)
    assert [e["status"] for e in codex_pictures.load(path)] == ["pending", "pending"]
    assert codex_pictures.build_manifest(pictures, "paint", {"GEN:1"}, section=5) and \
        codex_pictures.load(codex_pictures.folder(pictures, "paint", 5) / "manifest.json") == []


def test_review_counts_only_for_the_picture_as_drawn_now(pictures):
    state = next(s for s in pictures.states(theme_ids=["paint"]) if s["scene"] == 0)
    with pytest.raises(ValueError, match="No paint picture"):
        pictures.review(theme="paint", key="PSA:117", writer="haiku", scene=0, verdict="ok")
    drawn = dict(theme="paint", key="PSA:117", writer="haiku", scene=0, sha=state["sha"], seed=1, seconds=0.0)
    pictures.save(**drawn, made_at="2026-11-10T10:00:00")
    (pictures.dir / scene_pictures.picture_name("paint", "PSA:117", "haiku", 0)).parent.mkdir(parents=True)
    (pictures.dir / scene_pictures.picture_name("paint", "PSA:117", "haiku", 0)).write_bytes(b"x")
    assert pictures.review(theme="paint", key="PSA:117", writer="haiku", scene=0, verdict="ok", note="ignored") == \
        {"verdict": "ok", "note": ""}
    assert pictures.gallery("paint")[0][8:] == ["ok", ""] and pictures.gallery("paint")[1][8:] == [None, None]
    pictures.review(theme="paint", key="PSA:117", writer="haiku", scene=0, verdict="flagged", note=" wrong hand ")
    assert pictures.gallery("paint")[0][8:] == ["flagged", "wrong hand"]
    # A redraw is unreviewed again.
    pictures.save(**drawn, made_at="2026-11-11T10:00:00")
    assert pictures.gallery("paint")[0][8:] == [None, None]
    for bad in ({"verdict": "maybe"}, {"verdict": "ok", "scene": "0"}, {"verdict": "flagged", "note": "x" * 1001}):
        with pytest.raises(ValueError):
            pictures.review(**{"theme": "paint", "key": "PSA:117", "writer": "haiku", "scene": 0, **bad})


def test_gallery_runs_in_verse_order_within_a_chapter(tmp_path):
    store = chapter_scenes.Store(tmp_path / "scenes.sqlite3")
    store.put("GEN:5", "haiku", {"scenes": [dict(GOOD, title="main", verse_start=28, verse_end=29),
                                            dict(GOOD, title="first", verse_start=3, verse_end=5)]})
    pictures = scene_pictures.Pictures(store, THEMES)
    assert [(i[3], i[2]) for i in pictures.gallery("paint")] == [("first", 1), ("main", 0)]
