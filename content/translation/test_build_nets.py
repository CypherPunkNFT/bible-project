"""The build check's language nets (build_nets.py, language_nets.mjs; stage 4 job 9): each net proven by planting one
finding on a small made-up site in a temporary git repository and watching the check name its file and line.

    python -m pytest content/translation/test_build_nets.py -q      (from Website; no model, no network; needs node)
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from english_baseline import NETS  # noqa: E402
from test_english_build_check import BASELINE, PAGE, as_started, commit, run, site, write  # noqa: E402, F401

RULINGS = "content/translation/unregistered-reviewed.json"
LANGUAGE = "src/lib/language.ts"


def baseline(**sections: dict) -> str:
    """A baseline holding every language-net section (empty unless given)."""
    return json.dumps({"about": ["test"], "widenings": [], "code": {}, "reading": [],
                       **{net: sections.get(net, {}) for net in NETS}})


@pytest.fixture
def nets(site: Path) -> Path:  # noqa: F811 - the shared fixture from test_english_build_check
    """The made-up site with every language-net section in its baseline from the start."""
    write(site, BASELINE, baseline())
    as_started(site)
    return site


PLANTS = {
    "pieced, JSX": ("pieced", PAGE, "export const P = (d: number, t: number) => <p>\n  {d} of {t} debates\n</p>;\n", 2,
                    "{n} of {n} debates"),
    "pieced, joined": ("pieced", "src/pages/Joined.ts", 'export const s = (n: number, t: number) => "Page " + n + " of " + t;\n',
                       1, "Page {n} of {n}"),
    "plural": ("plural", "src/pages/Plural.ts", '\nexport const w = (n: number) => n === 1 ? "book" : "books";\n', 2,
               '{n} === 1 ? "book" : "books"'),
    "plural helper call": ("plural", "src/pages/Helper.ts", ("export const plural = (n: number, one: string, many: string) => "
                           'n === 1 ? one : many;\nexport const x = (count: number) => plural(count, "record", "records");\n'),
                           2, 'plural({n}, "record", "records")'),
    "format, fixed": ("format", "src/pages/Fixed.ts", 'export const f = (n: number) => n.toLocaleString("en-US");\n', 1,
                      '{n}.toLocaleString("en-US")'),
    "format, browser": ("format", "src/pages/Browser.ts", "export const f = (d: Date) =>\n  d.toLocaleDateString();\n", 2,
                        "{n}.toLocaleDateString()"),
    # Stage 5 job 15: the page translator swaps the head, so a title is a finding only for a word the collector never
    # registers (here one word beside a value), in a page or in page-head.ts.
    "title": ("title", "src/pages/Titled.ts", 'declare const name: string;\ndocument.title = `${name} · Newsection · Bible Guide`;\n',
              2, "`${{n}} · Newsection · Bible Guide`"),
    "title in page-head": ("title", "src/lib/page-head.ts", ('export const SITE_NAME = "Bible Guide";\nconst SECTIONS = '
                           '{ fresh: "Freshsection" };\n'), 2, '"Freshsection"'),
    "title joined": ("title", "src/pages/Joined.ts", 'declare const t: string;\ndocument.title = t + " · Newsection";\n', 2,
                     '{n} + " · Newsection"'),
    "data read in English": ("data", "src/pages/Reads.ts", 'declare const load: (p: string) => void;\nload("newdata/x.json");\n',
                             2, "read in English: newdata/x.json"),
}


@pytest.mark.parametrize("plant", PLANTS.values(), ids=PLANTS.keys())
def test_a_planted_finding_fails_with_its_file_and_line(nets: Path, plant: tuple) -> None:
    net, file, source, line, key = plant
    write(nets, "data/newdata/x.json", "{}")
    write(nets, file, source)
    result = run(nets)
    assert result.returncode == 1, result.stdout + result.stderr
    assert f"NEW {net.upper()} FINDINGS" in result.stdout and key in result.stdout and f"{file}:{line}" in result.stdout
    assert "To fix:" in result.stdout and f'"check": "{net}"' in result.stdout


def test_a_listed_folder_without_a_translated_copy_fails_at_its_line(nets: Path) -> None:
    write(nets, LANGUAGE, '// the translated data\nconst TRANSLATED_DATA = ["topics/", "hymns/"];\n')
    write(nets, "data/hymns/songs/1.json", "{}")
    result = run(nets)
    assert result.returncode == 1 and "listed with no translated copy: hymns/songs/" in result.stdout
    assert f"{LANGUAGE}:2" in result.stdout


@pytest.mark.parametrize("source", [
    "export const P = (d: number, t: number) => <p>{`${d} of ${t} debates`}</p>;\n",
    "declare const siteLanguage: () => string;\nexport const f = (n: number) => n.toLocaleString(siteLanguage());\n",
    'document.title = "Bible Guide";\n',
    'document.title = "New page · Bible Guide";\n',
    'declare const name: string;\ndocument.title = `${name} · Known heading · Bible Guide`;\n',
    'declare const t: string;\ndocument.title = [t, "Known heading", "Bible Guide"].filter(Boolean).join(" · ");\n',
    'export const n = (count: number) => <p className={count === 1 ? "one-col" : "many-cols"}>Text</p>;\n',
])
def test_the_right_forms_pass(nets: Path, source: str) -> None:
    write(nets, PAGE, source)
    result = run(nets)
    assert result.returncode == 0, result.stdout + result.stderr


def test_renaming_or_reformatting_a_known_finding_is_not_new(nets: Path) -> None:
    write(nets, BASELINE, baseline(plural={'{n} === 1 ? "book" : "books"': 1}))
    write(nets, PAGE, 'export const w = (n: number) => n === 1 ? "book" : "books";\n')
    as_started(nets)
    write(nets, PAGE, "export const w = (count: number) =>\n  (count===1\n    ? 'book'\n    : 'books');\n")
    assert run(nets).returncode == 0


def test_a_second_copy_of_a_known_finding_is_new(nets: Path) -> None:
    write(nets, BASELINE, baseline(format={"{n}.toLocaleString()": 1}))
    write(nets, PAGE, "export const f = (n: number) => n.toLocaleString();\n")
    as_started(nets)
    write(nets, "src/pages/Second.ts", "export const g = (m: number) => m.toLocaleString();\n")
    result = run(nets)
    assert result.returncode == 1 and "the baseline allows 1 of these" in result.stdout
    assert result.stdout.index("src/pages/Second.ts:1") < result.stdout.index(f"{PAGE}:1")  # the new place first


def test_text_beyond_ascii_survives_the_round_trip(nets: Path) -> None:
    write(nets, PAGE, "export const P = (n: number) => <p>{n} años · ‘días’</p>;\n")
    result = run(nets)
    assert result.returncode == 1 and "{n} años · ‘días’" in result.stdout


def test_a_ruling_needs_its_file_and_reason_and_never_covers_page_head_titles(nets: Path) -> None:
    write(nets, PAGE, 'export const f = (n: number) => n.toLocaleString("en-US");\n')
    ruling = {"check": "format", "item": '{n}.toLocaleString("en-US")', "why": "an English-only export"}
    write(nets, RULINGS, json.dumps([{**ruling, "file": PAGE}]))
    assert run(nets).returncode == 0
    write(nets, RULINGS, json.dumps([ruling]))
    assert run(nets).returncode == 2
    write(nets, RULINGS, json.dumps([{"check": "title-files", "item": "src/lib/page-head.ts", "why": "r"}]))
    assert run(nets).returncode == 2


@pytest.mark.parametrize("missing, code", [("src/lib/page-head.ts", 2), (LANGUAGE, 2)])
def test_a_missing_input_is_refused_not_passed(nets: Path, missing: str, code: int) -> None:
    (nets / missing).unlink()
    result = run(nets)
    assert result.returncode == code and Path(missing).name in result.stderr


def test_a_committed_file_that_does_not_parse_stops_the_check_and_an_unsaved_one_is_left_out(nets: Path) -> None:
    write(nets, "src/pages/Broken.ts", "export const x = (;\n")
    result = run(nets)
    assert result.returncode == 0 and "does not parse" in result.stdout
    commit(nets, "broken")
    result = run(nets)
    assert result.returncode == 3 and "Broken.ts does not parse" in result.stderr


def test_without_node_the_check_fails_and_says_so(nets: Path) -> None:
    git_folder = str(Path(shutil.which("git")).parent)
    result = subprocess.run([sys.executable, str(Path(__file__).with_name("english_build_check.py")), "--root", str(nets)],
                            capture_output=True, encoding="utf-8", check=False, env={**os.environ, "PATH": git_folder})
    assert result.returncode == 3 and "node was not found" in result.stderr


def test_the_release_path_judges_only_what_the_picked_commits_add(nets: Path) -> None:
    write(nets, PAGE, 'export const w = (n: number) => n === 1 ? "book" : "books";\n')
    commit(nets, "a plural already live")
    live = subprocess.run(["git", "-C", str(nets), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    (nets / PAGE).rename(nets / "src/pages/Moved.tsx")
    commit(nets, "move")
    assert run(nets, "--since", live).returncode == 0
    write(nets, LANGUAGE, 'const TRANSLATED_DATA = ["topics/", "hymns/"];\n')
    write(nets, "data/hymns/songs/1.json", "{}")
    commit(nets, "claim a folder with no copy")
    result = run(nets, "--since", live)
    assert result.returncode == 1 and "listed with no translated copy: hymns/songs/" in result.stdout
    assert '{n} === 1 ? "book" : "books"' not in result.stdout


def test_sections_are_added_once_with_an_exact_widening_and_never_dropped(site: Path) -> None:  # noqa: F811
    write(site, PAGE, 'export const w = (n: number) => n === 1 ? "book" : "books";\n')
    commit(site, "a plural before the nets")
    assert run(site).returncode == 1  # a job-8 baseline holds no language-net section
    assert run(site, "--add-sections", "the language nets begin").returncode == 0
    held = json.loads((site / BASELINE).read_text("utf-8"))
    assert held["plural"] == {'{n} === 1 ? "book" : "books"': 1}
    assert {"section": "plural", "added": 1} in [{k: w[k] for k in ("section", "added")} for w in held["widenings"]]
    assert run(site).returncode == 0
    commit(site, "sections")
    assert run(site, "--add-sections", "again").returncode == 2
    del held["plural"]
    write(site, BASELINE, json.dumps(held))
    result = run(site)
    assert result.returncode == 1 and "section plural was dropped" in result.stdout


def test_shrink_drops_fixed_findings_from_the_language_nets(nets: Path) -> None:
    write(nets, BASELINE, baseline(format={"{n}.toLocaleString()": 2, "{n}.toLocaleString(\"en\")": 1}))
    write(nets, PAGE, "export const f = (n: number) => n.toLocaleString();\n")
    as_started(nets)
    assert run(nets, "--shrink").returncode == 0
    assert json.loads((nets / BASELINE).read_text("utf-8"))["format"] == {"{n}.toLocaleString()": 1}
