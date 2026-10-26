"""build-data.py swaps in a whole new data/ folder; what the other build scripts wrote there must survive it."""

import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "build-data.py"


@pytest.fixture
def build_data(tmp_path, monkeypatch):
    spec = importlib.util.spec_from_file_location("build_data", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, "SITE", tmp_path)
    monkeypatch.setattr(module, "OUT_FINAL", tmp_path / "data")
    monkeypatch.setattr(module, "OUT", tmp_path / "data.new")
    return module


def test_other_scripts_output_survives_the_swap(build_data, tmp_path):
    live, new = tmp_path / "data", tmp_path / "data.new"
    (live / "topics" / "chapters").mkdir(parents=True)
    (live / "topics" / "chapters" / "PSA.json").write_text("{}", encoding="utf-8")
    (live / "text").mkdir()
    (live / "text" / "old.json").write_text("old", encoding="utf-8")
    (live / "xref-arcs.json").write_text("[1]", encoding="utf-8")
    (new / "text").mkdir(parents=True)
    (new / "text" / "new.json").write_text("new", encoding="utf-8")

    assert build_data.keep_other_builds() == ["topics", "xref-arcs.json"]
    build_data.swap_into_place()

    assert (live / "topics" / "chapters" / "PSA.json").read_text(encoding="utf-8") == "{}"
    assert (live / "xref-arcs.json").read_text(encoding="utf-8") == "[1]"
    assert [p.name for p in (live / "text").iterdir()] == ["new.json"]  # what this build writes is replaced
    assert not new.exists() and not (tmp_path / "data.old").exists()


def test_first_build_has_nothing_to_keep(build_data, tmp_path):
    (tmp_path / "data.new").mkdir()
    assert build_data.keep_other_builds() == []
