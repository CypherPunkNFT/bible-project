"""Page text registered by hand (page_register.py, page-register.json) and the rulings scoped to one file
(english_baseline.scoped_rulings): each rule proven on a small made-up site, then once on the real site (stage 5 job 13).

    python -m pytest content/translation/test_page_register.py -q      (from Website; no model, no network)
"""
import json
import sys
from pathlib import Path

import pytest

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import english_baseline  # noqa: E402
import extract  # noqa: E402
import page_register  # noqa: E402
import unregistered  # noqa: E402
from test_english_build_check import BASELINE, PAGE, as_started, baseline, run, write  # noqa: E402
import test_english_build_check  # noqa: E402

LABEL = "Wayfarersong"
SHOWN = f'export const card = {{ hint: "{LABEL}" }};\n'
OTHER = "src/pages/Other.tsx"


def register(root: Path, *groups: tuple[str, list[str]], why: str = "a label the page shows") -> None:
    data = {"about": ["test"], "register": [{"file": file, "why": why, "texts": texts} for file, texts in groups]}
    write(root, page_register.REGISTER, json.dumps(data))


def rulings(root: Path, *entries: dict) -> None:
    write(root, "content/translation/unregistered-reviewed.json", json.dumps(list(entries)))


@pytest.fixture
def site(tmp_path: Path) -> Path:
    """test_english_build_check's made-up site in a temporary git repository."""
    return test_english_build_check.site.__wrapped__(tmp_path)


@pytest.fixture
def made_up(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.setattr(extract, "SITE", tmp_path)
    write(tmp_path, PAGE, SHOWN)
    write(tmp_path, OTHER, SHOWN)
    return tmp_path


def test_a_registered_text_is_collected_from_its_own_file_only(made_up: Path) -> None:
    register(made_up, (PAGE, [LABEL]))
    assert LABEL in extract.page_strings([made_up / PAGE])
    assert LABEL not in extract.page_strings([made_up / OTHER])


def test_a_text_the_file_no_longer_shows_does_nothing_and_is_listed_stale(made_up: Path) -> None:
    register(made_up, (PAGE, [LABEL, "Gone label"]), ("src/pages/Removed.tsx", ["Any"]))
    assert extract.page_strings([made_up / PAGE]).count("Gone label") == 0
    assert page_register.stale(made_up) == [f"{PAGE}: Gone label", "src/pages/Removed.tsx: Any"]


def test_presence_is_exact_not_a_substring(made_up: Path) -> None:
    register(made_up, (PAGE, ["Wayfarer"]))
    assert "Wayfarer" not in extract.page_strings([made_up / PAGE])


def test_a_template_jsx_text_and_a_dotted_piece_count_as_shown(made_up: Path) -> None:
    write(made_up, PAGE, 'export const A = () => <p title={`Back to ${hub}`}>Hidden label <b>{n}</b> more</p>;\n'
                         'export const B = { title: "Orthodox perspective · The Orthodox Faith" };\n'
                         '// "In a comment" is not shown\n')
    register(made_up, (PAGE, ["Back to {n}", "Hidden label", "more", "Orthodox perspective", "In a comment"]))
    assert page_register.texts_for(made_up, made_up / PAGE) == ["Back to {n}", "Hidden label", "more", "Orthodox perspective"]


@pytest.mark.parametrize("group, expected", [
    ({"file": PAGE, "why": " ", "texts": [LABEL]}, "the reason"),
    ({"file": "content/x.json", "why": "w", "texts": [LABEL]}, "under src/"),
    ({"file": "src/../secret.ts", "why": "w", "texts": [LABEL]}, "no .."),
    ({"file": PAGE, "why": "w", "texts": []}, "one or more"),
    ({"file": PAGE, "why": "w", "texts": ["Tom &amp; Jerry"]}, "entity"),
    ({"file": PAGE, "why": "w", "texts": [" Padded"]}, "single spaces"),
    ({"file": PAGE, "why": "w", "texts": ["{n} and {n} of {n} in {n}"]}, "at most 3 values"),
    ({"file": PAGE, "texts": [LABEL]}, "exactly file, why and texts"),
])
def test_a_registration_that_is_not_as_expected_is_refused(made_up: Path, group: dict, expected: str) -> None:
    write(made_up, page_register.REGISTER, json.dumps({"register": [group]}))
    with pytest.raises(page_register.Refused, match=expected):
        page_register.registrations(made_up)


def test_the_build_check_takes_a_registration_only_where_the_file_shows_it(site: Path) -> None:
    write(site, PAGE, SHOWN)
    write(site, OTHER, "export const nothing = 1;\n")
    register(site, (OTHER, [LABEL]))
    assert run(site).returncode == 1
    register(site, (PAGE, [LABEL]))  # once in the phrase list it is translated wherever it shows, so known everywhere
    write(site, OTHER, SHOWN)
    assert run(site).returncode == 0


def test_a_code_ruling_that_names_a_file_holds_for_that_file_only(site: Path) -> None:
    write(site, PAGE, SHOWN)
    write(site, OTHER, SHOWN)
    rulings(site, {"check": "code", "file": OTHER, "item": LABEL, "why": "a code name in this file"})
    result = run(site)
    assert result.returncode == 1 and f"{PAGE}:1" in result.stdout and f"{OTHER}:1" not in result.stdout
    rulings(site, {"check": "code", "file": OTHER, "item": LABEL, "why": "a code name in this file"},
            {"check": "code", "file": PAGE, "item": LABEL, "why": "a code name in this file"})
    assert run(site).returncode == 0


def test_a_one_or_two_word_code_ruling_must_name_its_file(site: Path) -> None:
    rulings(site, {"check": "code", "item": LABEL, "why": "a code name"})
    result = run(site)
    assert result.returncode == 2 and "must name its file" in result.stderr


def test_a_later_ruling_names_its_job_and_is_counted(site: Path) -> None:
    write(site, PAGE, SHOWN)
    rulings(site, {"check": "later", "file": PAGE, "item": LABEL, "why": "a month name"})
    result = run(site)
    assert result.returncode == 2 and "job" in result.stderr
    rulings(site, {"check": "later", "file": PAGE, "item": LABEL, "job": "14", "why": "a month name"})
    result = run(site)
    assert result.returncode == 0 and "job 14 1" in result.stdout


def test_shrink_drops_a_reading_text_once_it_is_registered_or_ruled(site: Path) -> None:
    write(site, BASELINE, baseline(reading=["Still English", "Ruled text", LABEL]))
    write(site, "src/generated/data.ts", SHOWN)  # the content build's file: left out of the net, read for the reading
    register(site, ("src/generated/data.ts", [LABEL]))
    rulings(site, {"check": "reading", "item": "Ruled text", "why": "built at run time"})
    as_started(site)
    assert run(site, "--shrink").returncode == 0
    assert json.loads((site / BASELINE).read_text("utf-8"))["reading"] == ["Still English"]


def test_unregistered_check_code_honours_a_ruling_for_its_file_only(made_up: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(unregistered, "SITE", made_up)
    monkeypatch.setattr(unregistered, "registered_page_text", lambda: set())
    skip = {"code": set(), "code-files": set(), "scoped": {unregistered.scoped_key(OTHER, LABEL)}}
    report = "\n".join(unregistered.check_code(skip))
    assert f"{PAGE}:1" in report and f"{OTHER}:1" not in report


def test_the_real_site_has_no_stale_registration_and_valid_rulings() -> None:
    assert page_register.stale(extract.SITE) == []
    english_baseline.scoped_rulings(HERE / "unregistered-reviewed.json")
    english_baseline.rulings(HERE / "unregistered-reviewed.json", extract.SITE)
