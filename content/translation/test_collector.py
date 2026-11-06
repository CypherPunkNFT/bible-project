"""The collector's fixes of stage 5, job 11 (extract.py, page_rules.py, retarget_collect.py): each gap it closed proven
on small made-up code or a made-up site-translation folder. Each test was proven by putting its fault back and watching
it fail.

    python -m pytest content/translation/test_collector.py -q      (from Website; no model, no network)
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import pytest

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import extract  # noqa: E402
import page_rules  # noqa: E402
import retarget_collect  # noqa: E402
from test_english_build_check import commit, run, site, write  # noqa: E402, F401


def found(source: str, suffix: str = ".ts") -> list[str]:
    return page_rules.strings_in(page_rules.without_comments(source), suffix)


@pytest.mark.parametrize("source, suffix, wanted", [
    ('const m = { key: "x", group: "Lanternlight", kind: "Chart" };', ".ts", {"Lanternlight", "Chart"}),
    ('<dt>{ruler.verdictTone === "none" ? "Scripture says" : "Verdict"}</dt>', ".tsx", {"Verdict"}),
    ('const t = n > 1\n  ? `Told in ${n} books`\n  : "Passage";', ".ts", {"Passage"}),
    ('const r = role ?? "Ruler"; const s = x || "Record";', ".ts", {"Ruler", "Record"}),
    ("aria-controls={`sw-answer-${i}`} onClick={f}>{answer === i ? 'Close the explanation' : 'Examine the evidence'}",
     ".tsx", {"Examine the evidence"}),
    ('bar: [["Letters", "in four collections", n]]', ".ts", {"in four collections"}),
    ("const label = n ? '(not stated)' : x;", ".ts", {"(not stated)"}),
    ('<p>{name}, the only account</p><span>By {author}</span><i>{pct}% of the book</i>', ".tsx",
     {", the only account", "By", "% of the book"}),
    ('<p>{name}, the only account</p>', ".jsx", {", the only account"}),
    ('el.innerHTML = `<p>Named as his ${rel} in the family list &amp; more</p><b>${icon("x")} Topics</b>`;', ".js",
     {"Named as his {n} in the family list & more", "Topics"}),
    ('const msg = "Load more, please";', ".mjs", {"Load more, please"}),
])
def test_a_gap_of_the_first_rules_is_collected(source: str, suffix: str, wanted: set[str]) -> None:
    assert wanted <= set(found(source, suffix))


def test_a_paragraph_over_400_characters_is_collected() -> None:
    paragraph = "In the beginning the word was spoken, and it was heard by many. " * 8
    assert paragraph.strip() in found(f'export const text = "{paragraph.strip()}";')


@pytest.mark.parametrize("source, suffix, unwanted", [
    ("const t = { aliases: 'the salt of the earth' };", ".ts", "the salt of the earth"),
    ('const BOOK = { "song of solomon": "song of songs" };', ".ts", "song of songs"),
    ('const v = { v: "kasihilah sesamamu seperti dirimu sendiri" };', ".ts", "kasihilah sesamamu seperti dirimu sendiri"),
    ('type K = "Chart" | "Guide"; if (kind === "Verdict") {}', ".ts", "Verdict"),
    ('document.querySelectorAll("p,pre,li");', ".js", "p,pre,li"),
    ('const p = `M${x} ${y} L${x + 4} ${y}`; const q = "Read more";', ".js", "M${x} ${y} L${x + 4} ${y}"),
])
def test_code_and_text_no_reader_sees_stay_out(source: str, suffix: str, unwanted: str) -> None:
    assert unwanted not in found(source, suffix)
    assert not any("${" in text for text in found(source, suffix))


def test_nested_templates_are_one_string_each() -> None:
    source = 'const a = `outer ${cond ? `inner ${x}` : "Plain words here"} end`; const b = "After the template";'
    bodies = [body for _, _, _, body in page_rules.string_literals(source)]
    assert "Plain words here" in bodies and "After the template" in bodies


@pytest.fixture
def tree(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """A made-up site's src/ for page_files: one file per case, each holding its own name as text."""
    for relative in ("src/pages/A.tsx", "src/lib/b.ts", "src/pages/c.js", "src/pages/d.mjs", "src/pages/e.jsx",
                     "src/generated/f.ts", "src/pages/questions/test/G.tsx", "src/test/h.ts", "src/pages/i.test.ts",
                     "src/dev/j.ts", "src/pages/mockup/k.tsx", "src/pages/places/old-maps-collection/data.js"):
        write(tmp_path, relative, f'export const label = "{Path(relative).stem} page text";\n')
    monkeypatch.setattr(extract, "SITE", tmp_path)
    return tmp_path


def test_page_files_reads_javascript_generated_code_and_the_questions_test_page(tree: Path) -> None:
    names = {path.relative_to(tree).as_posix() for path in extract.page_files()}
    assert names == {"src/pages/A.tsx", "src/lib/b.ts", "src/pages/c.js", "src/pages/d.mjs", "src/pages/e.jsx",
                     "src/generated/f.ts", "src/pages/questions/test/G.tsx"}
    assert "src/generated/f.ts" not in {path.relative_to(tree).as_posix()
                                        for path in extract.page_files(include_generated=False)}
    assert "f page text" in extract.page_strings() and "c page text" in extract.page_strings()


def test_the_study_drafts_are_no_longer_collected() -> None:
    assert [kind for kind, _, _ in extract.DOCUMENTS] == ["transcript"]


def test_the_build_check_leaves_generated_code_out_and_reads_javascript(site: Path) -> None:  # noqa: F811
    write(site, "src/generated/topics.ts", 'export const hint = { tip: "Wayfarersong" };\n')
    result = run(site)
    assert result.returncode == 0, result.stdout + result.stderr
    write(site, "src/pages/legacy.js", 'export const hint = { tip: "Wayfarersong" };\n')
    commit(site)
    result = run(site)
    assert result.returncode == 1 and "src/pages/legacy.js" in result.stdout, result.stdout + result.stderr


# --- Carrying a translation over when the English is edited (retarget_collect.py) -------------------------------------
OLD = "Open the chapter and read every verse slowly"
NEW = "Open the chapter and read each verse slowly"
OTHER = "A completely different sentence about maps"


def folder(tmp_path: Path, collected: list[str] | None = None) -> Path:
    """A made-up site-translation folder: one page chunk with OLD and OTHER, Spanish translations, and the snapshot."""
    out = tmp_path / "SiteTranslation"
    strings = {extract.string_id("page", OLD): OLD, extract.string_id("page", OTHER): OTHER}
    write(out, "in/0001.json", json.dumps({"kind": "page", "strings": strings}))
    write(out, "chunks.json", json.dumps([{"chunk": "0001", "kind": "page", "strings": 2, "words": 15}]))
    write(out, "out/es/0001.json", json.dumps({key: f"es: {text}" for key, text in strings.items()}))
    if collected is not None:
        write(out, retarget_collect.SNAPSHOT, json.dumps({"page": collected}))
    return out


def append(out: Path, texts: list[str], dry_run: bool = False, skip: frozenset[str] = frozenset()) -> list[str]:
    return extract.append(out, "page", texts, retarget=True, dry_run=dry_run, skip=skip)


def test_edited_english_keeps_its_translation_and_is_flagged_for_a_recheck(tmp_path: Path) -> None:
    out = folder(tmp_path, [OLD, OTHER])
    started = {name: (out / name).read_bytes() for name in ("in/0001.json", "chunks.json", retarget_collect.SNAPSHOT)}
    assert append(out, [NEW, OTHER]) == []
    old_id, new_id = extract.string_id("page", OLD), extract.string_id("page", NEW)
    strings = json.loads((out / "in/0001.json").read_text("utf-8"))["strings"]
    assert list(strings) == [old_id, new_id, extract.string_id("page", OTHER)] and strings[new_id] == NEW
    assert json.loads((out / "out/es/0001.json").read_text("utf-8"))[new_id] == f"es: {OLD}"
    flags = json.loads((out / "review/es/source-fixes/0001.json").read_text("utf-8"))["flags"]
    assert [(f["id"], f["by"], f["serious"]) for f in flags] == [(new_id, "collect", True)]
    assert json.loads((out / "chunks.json").read_text("utf-8"))[0]["strings"] == 3
    assert json.loads((out / retarget_collect.SNAPSHOT).read_text("utf-8"))["page"] == sorted([NEW, OTHER])
    before = {path: path.read_bytes() for path in out.rglob("*.json")}
    assert append(out, [NEW, OTHER]) == []  # a second run changes nothing
    assert {path: path.read_bytes() for path in out.rglob("*.json")} == before
    for name, data in started.items():  # a run cut short after the translations and flags, before the chunk itself
        (out / name).write_bytes(data)
    assert append(out, [NEW, OTHER]) == []
    assert {path: path.read_bytes() for path in out.rglob("*.json")} == before


@pytest.mark.parametrize("new", [
    "Do not open the chapter and read every verse slowly",   # a negation
    "Close the chapter and read every verse slowly",          # a listed opposite
    "Open the chapter and unread every verse slowly",         # a word and its un- form
    "Open the chapter and read every verse 3 times slowly",   # a number added
    "Something else entirely, about the coming harvest",      # not close
])
def test_an_unrelated_or_opposite_text_is_new_not_an_edit(tmp_path: Path, new: str) -> None:
    out = folder(tmp_path, [OLD, OTHER])
    assert append(out, [new, OTHER]) == [new]
    assert not (out / "review").exists()
    assert extract.string_id("page", new) not in json.loads((out / "out/es/0001.json").read_text("utf-8"))


def test_two_equally_close_edits_carry_nothing(tmp_path: Path) -> None:
    out = folder(tmp_path, [OLD, OTHER])
    first, second = f"{OLD}.", f"{OLD}!"  # one character added each: equally close
    assert sorted(append(out, [first, second, OTHER])) == sorted([first, second])
    assert not (out / "review").exists()


def test_only_text_collected_last_time_can_have_been_edited(tmp_path: Path) -> None:
    out = folder(tmp_path)  # no snapshot yet: the first collection carries nothing and writes one
    assert append(out, [NEW, OTHER]) == [NEW]
    assert not (out / "review").exists()
    assert json.loads((out / retarget_collect.SNAPSHOT).read_text("utf-8"))["page"] == sorted([NEW, OTHER])
    out = folder(tmp_path / "second", [OTHER])  # OLD was put in by another tool, not by the collector
    assert append(out, [NEW, OTHER]) == [NEW]


def test_a_dry_run_writes_nothing(tmp_path: Path) -> None:
    out = folder(tmp_path, [OLD, OTHER])

    def digest() -> str:
        return hashlib.sha256(b"".join(p.as_posix().encode() + p.read_bytes()
                                       for p in sorted(out.rglob("*")) if p.is_file())).hexdigest()
    before = digest()
    assert append(out, [NEW, OTHER, "A brand new line of page text"], dry_run=True) == ["A brand new line of page text"]
    assert digest() == before


def test_uncommitted_changes_stop_the_carrying(tmp_path: Path) -> None:
    out = folder(tmp_path, [OLD, OTHER])
    subprocess.run(["git", "-C", str(out), "init", "-q"], check=True)
    commit(out, "start")
    write(out, "out/es/0001.json", json.dumps({"x": "a translation another chat is still writing"}))
    with pytest.raises(retarget_collect.Refused):
        append(out, [NEW, OTHER])
    assert extract.string_id("page", NEW) not in (out / "in/0001.json").read_text("utf-8")


def test_pages_leave_out_text_an_apologetics_chunk_holds(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    out = folder(tmp_path, [OLD, OTHER])
    held = "Is the resurrection a historical event"
    write(out, "in/0002.json", json.dumps({"kind": "apologetics", "strings": {"abc": held}}))
    index = json.loads((out / "chunks.json").read_text("utf-8")) + [{"chunk": "0002", "kind": "apologetics",
                                                                      "strings": 1, "words": 6}]
    write(out, "chunks.json", json.dumps(index))
    monkeypatch.setattr(extract, "page_strings", lambda: [OLD, OTHER, held, "A line only the pages show"])
    monkeypatch.setattr(extract, "resource_page_strings", lambda: [])
    monkeypatch.setattr(extract, "debate_section_titles", lambda: [])
    monkeypatch.setattr(extract, "ruled_not_text", lambda: set())
    extract.collect_more(argparse.Namespace(out=out, pages=True, sections=False, resources=False, documents=False,
                                            dry_run=False))
    appended = json.loads((out / "in/0003.json").read_text("utf-8"))["strings"]
    assert list(appended.values()) == ["A line only the pages show"]


def test_a_dry_run_needs_something_to_collect(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sys, "argv", ["extract.py", "--dry-run"])
    with pytest.raises(SystemExit) as stopped:
        extract.main()
    assert stopped.value.code == 2


def test_the_language_nets_parse_plain_javascript_as_javascript() -> None:
    import build_nets
    files = {"src/pages/legacy.js": "export const card = (n) => <p>{n} chapters</p>;\n",
             "src/pages/old.jsx": "export const Card = ({ n }) => <p>{n} verses</p>;\n",
             "src/pages/run.mjs": "const total = items.length;\nexport default total;\n"}
    assert build_nets.run_node(files)["errors"] == {}
