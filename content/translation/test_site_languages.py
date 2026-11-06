"""site_languages.py reads the one language file as strictly as the site does (src/lib/site-languages-check.ts).

    python -m pytest content/translation/test_site_languages.py -q      (from Website; no model, no network)
"""
import json
import sys
from pathlib import Path

import pytest

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import site_languages  # noqa: E402

REAL = json.loads(site_languages.FILE.read_text(encoding="utf-8"))
MADE_UP = {"code": "en-XA", "folder": "en-xa", "bible": None, "name": "[Ëñĝļîšħ]", "englishName": "Made-up left to right",
           "dir": "ltr", "script": "Latn", "plurals": ["one", "other"], "digits": "latn", "font": None, "released": False,
           "pseudo": True}
# The real file's languages without one under the made-up code (job 4 added the real made-up languages, en-XA among them),
# so each planted fault below is the only thing wrong with its copy.
OTHERS = [entry for entry in REAL["languages"] if entry["code"] != MADE_UP["code"]]


def written(tmp_path: Path, data) -> Path:
    path = tmp_path / "site-languages.json"
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return path


def with_change(index: int, **changes) -> dict:
    data = json.loads(json.dumps(REAL))
    data["languages"][index].update(changes)
    return data


def test_the_real_file_is_sound_and_its_folders_are_the_translated_languages() -> None:
    assert site_languages.problems_in(REAL) == []
    expected = [entry["folder"] for entry in REAL["languages"] if entry["folder"] and not entry["pseudo"]]
    assert site_languages.folders() == expected and expected
    assert site_languages.source().code == "en"
    for folder in expected:
        assert site_languages.by_folder(folder).folder == folder


FAULTS = {
    "released written as a string": with_change(1, released="false"),
    "a folder that leaves data/i18n": with_change(1, folder="../es"),
    "a folder with a line break": with_change(1, folder="es\n"),
    "a Bible id with a slash": with_change(1, bible="rvr/x"),
    "an unknown field": with_change(1, extra=1),
    "a direction that is neither": with_change(1, dir="down"),
    "a font that closes its CSS rule": with_change(1, font="serif; }"),
    "plurals without other": with_change(1, plurals=["one"]),
    "an empty menu name": with_change(1, name=" "),
    "a made-up language marked released": {**REAL, "languages": OTHERS + [{**MADE_UP, "released": True}]},
    "a code twice, ignoring case": {**REAL, "languages": OTHERS + [{**MADE_UP, "code": "ES", "folder": "es2"}]},
    "two source languages": {**REAL, "languages": OTHERS + [{**MADE_UP, "folder": None, "bible": "bsb"}]},
    "an unknown top-level field": {**REAL, "extra": []},
}


@pytest.mark.parametrize("fault", list(FAULTS))
def test_every_planted_fault_is_refused(tmp_path: Path, fault: str) -> None:
    with pytest.raises(ValueError, match="is not sound, so no tool may use it"):
        site_languages.read(written(tmp_path, FAULTS[fault]))


def test_half_written_json_is_named(tmp_path: Path) -> None:
    path = tmp_path / "site-languages.json"
    path.write_text('{"languages": [', encoding="utf-8")
    with pytest.raises(ValueError, match="not valid JSON"):
        site_languages.read(path)


def test_a_made_up_language_is_left_out_unless_asked(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    path = written(tmp_path, {**REAL, "languages": OTHERS + [MADE_UP]})
    monkeypatch.setattr(site_languages, "languages", lambda: site_languages.read(path))
    assert "en-xa" not in site_languages.folders()
    assert site_languages.folders(pseudo=True)[-1] == "en-xa"
    assert site_languages.by_folder("en-xa").pseudo
    with pytest.raises(ValueError, match="not a language folder"):
        site_languages.by_folder("klingon")
