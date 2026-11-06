"""The build check for new unregistered English (english_build_check.py, english_baseline.py): each rule proven on a small
made-up site in a temporary git repository, then once on the real site.

    python -m pytest content/translation/test_english_build_check.py -q      (from Website; no model, no network)
"""
import json
import subprocess
import sys
from pathlib import Path

import pytest

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import english_baseline  # noqa: E402
import english_build_check  # noqa: E402
import site_languages  # noqa: E402

SCRIPT = HERE / "english_build_check.py"
BASELINE = english_build_check.BASELINE
PAGE = "src/pages/TestPage.tsx"
LABEL = "Wayfarersong"  # one word under a key the collector does not read, so unregistered
PLANTED = f'export const card = {{ hint: "{LABEL}" }};\n'
CLEAN = 'export const card = { title: "Registered heading" };\n'


def git(root: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True)


def commit(root: Path, message: str = "change") -> None:
    git(root, "add", "-A")
    git(root, "-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-q", "-m", message)


def as_started(root: Path) -> None:
    """Fold the changes into the first commit, as if the baseline had held them from the start."""
    git(root, "add", "-A")
    git(root, "-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-q", "--amend", "--no-edit")


def write(root: Path, relative: str, text: str) -> None:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, "utf-8", newline="\n")


def baseline(code: dict | None = None, reading: list | None = None, widenings: list | None = None) -> str:
    return json.dumps({"about": ["test"], "widenings": widenings or [], "code": code or {}, "reading": reading or []})


@pytest.fixture
def site(tmp_path: Path) -> Path:
    """A made-up site: one page, the two data files the collector reads, a phrase list per language, the page-head
    rules and TRANSLATED_DATA the language nets read (one listed folder, translated everywhere), an empty baseline and
    no rulings, committed."""
    root = tmp_path / "site"
    write(root, PAGE, CLEAN)
    write(root, "src/data/resources/life.json", '{"cities": []}')
    write(root, "content/apologetics/transcripts/index.json", "{}")
    write(root, "src/lib/page-head.ts", 'export const SITE_NAME = "Bible Guide";\n')
    write(root, "src/lib/language.ts", 'const TRANSLATED_DATA = ["topics/"];\nexport const listed = TRANSLATED_DATA;\n')
    write(root, "data/topics/chapters/1.json", "{}")
    for folder in site_languages.folders():
        write(root, f"data/i18n/{folder}/ui.json", '{"Known heading": "x", "Bible Guide": "x"}')
        write(root, f"data/i18n/{folder}/topics/chapters/1.json", "{}")
    write(root, english_build_check.RULINGS, "[]")
    write(root, BASELINE, baseline())
    git(root, "init", "-q")
    commit(root, "start")
    return root


def run(root: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(SCRIPT), "--root", str(root), *args], capture_output=True,
                          encoding="utf-8", check=False)


def test_a_planted_label_fails_with_its_file_line_and_how_to_register_it(site: Path) -> None:
    write(site, PAGE, "// a page\n\n" + PLANTED)
    result = run(site)
    assert result.returncode == 1, result.stdout + result.stderr
    assert f'"{LABEL}"' in result.stdout and f"{PAGE}:3" in result.stdout
    assert "to register it: put it under a key the collector reads" in result.stdout
    assert "extract.py --pages" in result.stdout and "unregistered-reviewed.json" in result.stdout
    write(site, PAGE, CLEAN)
    assert run(site).returncode == 0


def test_the_line_is_where_the_label_stands_not_an_earlier_mention(site: Path) -> None:
    write(site, PAGE, f"/* {LABEL} is the old name */\nconst x = 1;\n{PLANTED}")
    assert f"{PAGE}:3" in run(site).stdout


def test_a_second_copy_of_a_known_label_is_new(site: Path) -> None:
    write(site, BASELINE, baseline({LABEL: 1}))
    write(site, PAGE, PLANTED)
    as_started(site)
    assert run(site).returncode == 0
    write(site, PAGE, PLANTED + PLANTED.replace("card", "card2"))
    result = run(site)
    assert result.returncode == 1 and "the baseline allows 1 of these" in result.stdout


def test_a_moved_file_keeps_its_known_text(site: Path) -> None:
    write(site, BASELINE, baseline({LABEL: 1}))
    write(site, PAGE, PLANTED)
    as_started(site)
    (site / PAGE).rename(site / "src/pages/Moved.tsx")
    assert run(site).returncode == 0


def test_a_ruling_with_a_reason_is_honoured_and_one_without_is_refused(site: Path) -> None:
    write(site, PAGE, PLANTED)
    write(site, english_build_check.RULINGS, json.dumps([{"check": "code", "file": PAGE, "item": LABEL, "why": "a code name"}]))
    assert run(site).returncode == 0
    write(site, english_build_check.RULINGS, json.dumps([{"check": "code", "item": LABEL, "why": " "}]))
    result = run(site)
    assert result.returncode == 2 and "non-empty why" in result.stderr


@pytest.mark.parametrize("item", ["", "src/", "src", "src/pages/Missing.tsx"])
def test_a_file_ruling_that_covers_everything_or_nothing_is_refused(site: Path, item: str) -> None:
    write(site, english_build_check.RULINGS, json.dumps([{"check": "code-files", "item": item, "why": "r"}]))
    assert run(site).returncode == 2


def test_no_phrase_lists_at_all_is_refused(site: Path) -> None:
    for folder in site_languages.folders():
        (site / f"data/i18n/{folder}/ui.json").unlink()
    result = run(site)
    assert result.returncode == 2 and "ui.json" in result.stderr


def test_a_check_that_breaks_says_so_and_does_not_read_as_new_english(site: Path) -> None:
    (site / "src/data/resources/life.json").unlink()
    result = run(site)
    assert result.returncode == 3 and "life.json" in result.stderr


def test_a_baseline_grown_in_the_working_copy_is_refused(site: Path) -> None:
    write(site, BASELINE, baseline({"Some text": 1}))
    result = run(site)
    assert result.returncode == 1 and "THE BASELINE GREW" in result.stdout and "Some text" in result.stdout


def test_a_baseline_grown_in_a_commit_is_refused_until_a_commit_shrinks_it(site: Path) -> None:
    write(site, BASELINE, baseline({"Some text": 1}))
    commit(site, "grow")
    result = run(site)
    assert result.returncode == 1 and "against" in result.stdout
    write(site, BASELINE, baseline())
    commit(site, "shrink back")
    assert run(site).returncode == 0


def test_growth_recorded_as_a_widening_with_its_exact_count_is_allowed(site: Path) -> None:
    widening = {"date": "2026-11-06", "reason": "the net now reads .js files", "added": 2}
    write(site, BASELINE, baseline({"Some text": 2}, widenings=[widening]))
    assert run(site).returncode == 0
    write(site, BASELINE, baseline({"Some text": 3}, widenings=[widening]))
    assert run(site).returncode == 1


def test_shrink_only_removes_and_waits_for_unsaved_page_files(site: Path) -> None:
    write(site, BASELINE, baseline({LABEL: 2, "Gone text": 1}, reading=["Known heading", "Still English"]))
    write(site, PAGE, PLANTED)
    as_started(site)
    write(site, PAGE, PLANTED + "\n")
    assert run(site, "--shrink").returncode == 2
    git(site, "checkout", "--", PAGE)
    assert run(site, "--shrink").returncode == 0
    after = json.loads((site / BASELINE).read_text("utf-8"))
    assert after["code"] == {LABEL: 1} and after["reading"] == ["Still English"]


def test_shrink_refuses_while_the_baseline_has_grown_so_it_cannot_hide_the_growth(site: Path) -> None:
    write(site, BASELINE, baseline({LABEL: 1}))
    write(site, PAGE, PLANTED)
    commit(site, "a label, with the baseline grown by hand")
    grown = (site / BASELINE).read_text("utf-8")
    result = run(site, "--shrink")
    assert result.returncode == 2 and "history check" in result.stderr and LABEL in result.stderr
    assert (site / BASELINE).read_text("utf-8") == grown
    write(site, BASELINE, baseline())
    write(site, PAGE, CLEAN)
    commit(site, "growth taken back out")
    write(site, BASELINE, baseline({"Uncommitted": 1}))
    assert run(site, "--shrink").returncode == 2
    widening = {"date": "2026-11-06", "reason": "a wider net", "added": 1}
    write(site, BASELINE, baseline({LABEL: 1}, widenings=[widening]))
    write(site, PAGE, PLANTED)
    commit(site, "grown with its widening")
    assert run(site, "--shrink").returncode == 0


def test_the_release_path_judges_only_what_the_picked_commits_add(site: Path) -> None:
    write(site, PAGE, PLANTED)
    commit(site, "a label already live")
    live = subprocess.run(["git", "-C", str(site), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    (site / PAGE).rename(site / "src/pages/Moved.tsx")
    commit(site, "move")
    assert run(site, "--since", live).returncode == 0
    write(site, "src/pages/Other.tsx", PLANTED.replace(LABEL, "Pilgrimsong"))
    commit(site, "new label")
    result = run(site, "--since", live)
    assert result.returncode == 1 and "src/pages/Other.tsx:1" in result.stdout and LABEL not in result.stdout


def test_growth_rule_counts_each_added_place() -> None:
    old = {"about": [], "widenings": [], "code": {"A": 1}, "reading": ["R"]}
    new = {"about": [], "widenings": [], "code": {"A": 2, "B": 1}, "reading": ["R", "S"]}
    assert english_baseline.growth(old, new, "x")[0] == "x, code: 3 more than before, 0 recorded in widenings"
    assert english_baseline.growth(new, old, "x") == []


def test_the_real_site_has_nothing_new_against_its_baseline() -> None:
    result = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, encoding="utf-8", check=False)
    assert result.returncode == 0, result.stdout[-3000:] + result.stderr
