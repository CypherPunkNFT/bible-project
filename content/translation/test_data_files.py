"""The data files of stage 5, job 12 (collect_new.py, page_data.py, apply.py's phrase lists, unregistered.py, the
rulings file): each proven on a made-up site-translation folder or on the site's own data. Each test was proven by
putting its fault back and watching it fail.

    python -m pytest content/translation/test_data_files.py -q      (from Website; no model, no network)
"""
import argparse
import json
import sys
from pathlib import Path

import pytest

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import apply  # noqa: E402
import build_nets  # noqa: E402
import collect_new  # noqa: E402
import english_baseline  # noqa: E402
import extract  # noqa: E402
import page_data  # noqa: E402
import retarget_collect  # noqa: E402
import unregistered  # noqa: E402


def write(root: Path, relative: str, text: str) -> None:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, "utf-8", newline="\n")


def folder(tmp_path: Path, chunks: dict[str, tuple[str, list[str]]]) -> Path:
    """A made-up site-translation folder: chunk number -> (kind, its English texts)."""
    out = tmp_path / "SiteTranslation"
    index = []
    for chunk, (kind, texts) in chunks.items():
        write(out, f"in/{chunk}.json", json.dumps({"kind": kind, "strings": {extract.string_id(kind, t): t for t in texts}}))
        index.append({"chunk": chunk, "kind": kind, "strings": len(texts), "words": len(texts)})
    write(out, "chunks.json", json.dumps(index))
    return out


def by_id(texts_by_kind: dict[str, list[str]]) -> dict[str, dict[str, str]]:
    return {kind: {extract.string_id(kind, text): text for text in texts} for kind, texts in texts_by_kind.items()}


def test_sources_append_only_new_text_and_apologetics_leaves_out_page_text(tmp_path: Path,
                                                                          monkeypatch: pytest.MonkeyPatch) -> None:
    out = folder(tmp_path, {"0001": ("page", ["Held by the pages"]), "0002": ("museum", ["Already collected"])})
    monkeypatch.setattr(extract, "collect", lambda: by_id({
        "museum": ["Already collected", "A new museum field"],
        "apologetics": ["Held by the pages", "A new reading caution"]}))
    args = argparse.Namespace(out=out, dry_run=True)
    assert collect_new.sources(args) == {"A new reading caution"}
    assert sorted(path.name for path in (out / "in").iterdir()) == ["0001.json", "0002.json"]  # a dry run writes nothing
    args.dry_run = False
    assert collect_new.sources(args) == {"A new reading caution"}
    assert extract.held_texts(out, "museum") == {"Already collected", "A new museum field"}
    assert extract.held_texts(out, "apologetics") == {"A new reading caution"}
    assert not (out / retarget_collect.SNAPSHOT).exists()  # without retarget: no snapshot of every content text
    assert collect_new.sources(args) == set()  # a rerun appends nothing


def test_page_data_leaves_out_text_the_phrase_lists_already_hold(tmp_path: Path,
                                                                  monkeypatch: pytest.MonkeyPatch) -> None:
    out = folder(tmp_path, {"0001": ("peopletext", ["Moses"]), "0002": ("page", ["Read the text"]),
                            "0003": ("studytext", ["Aaron"])})
    monkeypatch.setattr(page_data, "data_strings", lambda site, walk: {
        "peopledata": ["Moses", "Drawn out of the water"], "studydata": ["Read the text", "Aaron", "Used in this study"]})
    collect_new.page_data_texts(argparse.Namespace(out=out, dry_run=False))
    assert extract.held_texts(out, "peopledata") == {"Drawn out of the water"}
    assert extract.held_texts(out, "studydata") == {"Used in this study"}


def test_the_moses_page_and_circles_explorer_text_is_collected() -> None:
    found = page_data.data_strings(extract.SITE, extract.walk)
    moses, circles = set(found["peopledata"]), set(found["studydata"])
    scenes = json.loads((extract.SITE / page_data.MOSES / "moses.json").read_text("utf-8"))["scenes"]
    assert scenes[0]["title"] in moses
    assert "Stephen’s telling" in moses  # "Acts 7 · Stephen’s telling" is also shown split, as a title of its own
    assert {"Scripture studies", "Read the text", "Used in this study", "The first called"} <= circles
    assert {"Study categories", "Works explorer"} <= circles  # template.html's labels
    assert {"Holy Land", "Great Sea", "approximate"} <= circles  # the old maps page (data.js)
    # Titles, authors, citation locators and descriptions no page shows stay out.
    assert not {"Illustrated Bible Dictionary (3rd edition)", "Andrew A. Bonar",
                "Dictionary articles accompanying the topics."} & circles


def test_page_html_text_and_labels_are_collected_with_entities_decoded() -> None:
    found = page_data.html_strings('<section aria-label="Works explorer"><h2>Where the works &amp; readers meet</h2>'
                                   '<button title="Close the map">&times;</button><span>12</span>'
                                   '<a href="#">Open original source &#8599;</a></section>')  # the JSX rules skip this one
    assert {"Works explorer", "Where the works & readers meet", "Close the map", "Open original source ↗"} <= set(found)
    assert not any("&amp;" in text or text == "12" for text in found)


def test_a_generated_script_is_read_as_the_data_it_sets(tmp_path: Path) -> None:
    write(tmp_path, "data.js", '// Generated.\nwindow.OLDMAPS = {"subjects": [{"label": "The Holy Land"}]};\n')
    assert page_data.read_data(tmp_path / "data.js") == {"subjects": [{"label": "The Holy Land"}]}
    write(tmp_path, "two.js", 'window.A = {"a": 1};\nwindow.B = {"b": 2};\n')
    with pytest.raises(SystemExit, match="more than one value"):
        page_data.read_data(tmp_path / "two.js")


def test_the_phrase_lists_take_the_new_kinds_and_the_older_kind_wins(tmp_path: Path) -> None:
    chunks = {"0001": ("peopletext", ["Moses", "Aaron"]), "0002": ("peopledata", ["Moses", "Drawn out of the water"]),
              "0003": ("studydata", ["Used in this study"]), "0004": ("sources", ["Primary source"])}
    out = folder(tmp_path, chunks)
    translated = {kind: {extract.string_id(kind, text): f"{kind}: {text}" for text in texts}
                  for kind, texts in chunks.values()}
    lists = apply.phrase_lists(out, translated)
    assert lists["ui-people.json"] == {"Moses": "peopletext: Moses", "Aaron": "peopletext: Aaron",
                                       "Drawn out of the water": "peopledata: Drawn out of the water"}
    assert lists["ui-study.json"] == {"Used in this study": "studydata: Used in this study"}
    assert lists["sources.json"] == {"Primary source": "sources: Primary source"}


def test_a_field_page_data_names_is_not_reported_unnamed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    write(tmp_path, "data/study/people.json", json.dumps([{
        "n": "Aaron the priest of Israel", "o": ["Aaron son of Amram the Levite"], "x": "A field no rule names yet"}]))
    person = ("person", "data/study/people.json", False, (), {"[].b"}, set(), set())
    names = ("studydata", "data/study/people.json", False, (), {"[].n", "[].o[]"}, set(), set())
    monkeypatch.setattr(unregistered, "SITE", tmp_path)
    monkeypatch.setattr(unregistered, "SPECS", [person, names])
    assert [line.split("`")[1] for line in unregistered.unread_fields(person, set())] == ["[].x"]


def test_the_rulings_file_is_well_formed_and_names_fields_the_rules_read() -> None:
    path = HERE / "unregistered-reviewed.json"
    root = extract.SITE
    english_baseline.rulings(path, root)  # each refuses a malformed entry
    build_nets.net_rulings(path, root)
    entries = json.loads(path.read_text("utf-8"))
    globs = {spec[1] for spec in unregistered.SPECS}
    fields = [entry["item"] for entry in entries if entry["check"] == "fields"]
    assert len(fields) == len(set(fields))
    assert all(entry["why"].strip() for entry in entries)
    assert all(item.split(" ", 1)[0] in globs for item in fields)


def test_the_teachers_labels_and_the_other_page_data_of_job_19_are_collected() -> None:
    found = page_data.data_strings(extract.SITE, extract.walk)
    study, site = set(found["studydata"]), set(found["sitedata"])
    assert {"Reformed", "Treatises and chapters", "The 1500s"} <= study  # teachers.json labels, one or two words
    assert {"systematic-theology", "systematic theology"} <= study  # a genre as the work page and the profile print it
    assert {"Christ the High Priest", "Set the Hebrew beside its Greek versions"} <= study  # letters home, scholars
    assert {"river", "body of water"} <= site  # what kind of place, under its name on the atlas
    # Names after the Bible's time, titles of works and quotations of the catalogue stay out.
    assert not {"W. F. Albright", "Evidences of the Christian Religion", "Codex Athous Dionysiou"} & (study | site)


def test_every_field_a_job_19_rule_names_reads_some_text() -> None:
    """A path written the wrong way (".labels.*.*" when the second level is not a wild key) reads nothing and says
    nothing; the letters files share one field list, so they are judged together."""
    import page_data_specs
    named: dict[str, set[str]] = {}
    seen: dict[str, set[str]] = {}
    for spec in page_data_specs.STUDY_DATA + page_data_specs.PEOPLE_DATA + page_data_specs.SITE_DATA:
        group = "letters" if spec[1].startswith("src/data/letters/") else spec[1]
        named.setdefault(group, set()).update(spec[4])
        for path in sorted(extract.SITE.glob(spec[1])):
            unregistered.all_strings(page_data.read_data(path), "", spec,
                                     lambda field, _text, group=group: seen.setdefault(group, set()).add(field))
    assert {group: fields - seen.get(group, set()) for group, fields in named.items() if fields - seen.get(group, set())} == {}


def test_the_new_page_data_kinds_skip_only_what_their_pages_load_and_site_data_joins_ui_json_last(
        tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    out = folder(tmp_path, {"0001": ("page", ["Read the text"]), "0002": ("studytext", ["A river of the plain"]),
                            "0003": ("sitedata", ["Read the text", "body of water"])})
    monkeypatch.setattr(page_data, "data_strings", lambda site, walk: {
        "sitedata": ["Read the text", "A river of the plain", "river"], "studydata": ["A river of the plain", "Reformed"]})
    collect_new.page_data_texts(argparse.Namespace(out=out, dry_run=False))
    # A study chunk's text is collected again for ui.json: the atlas and Resources pages never load ui-study.json.
    assert extract.held_texts(out, "sitedata") == {"Read the text", "body of water", "A river of the plain", "river"}
    assert extract.held_texts(out, "studydata") == {"Reformed"}
    translated = {"sitedata": {extract.string_id("sitedata", text): f"site: {text}"
                               for text in ("Read the text", "body of water")}}
    ui = {"Read the text": "page: Read the text"}
    apply.add_site_data(ui, out, translated)
    assert ui == {"Read the text": "page: Read the text", "body of water": "site: body of water"}


@pytest.mark.parametrize("entry, problem", [
    ({"item": "public/content/", "why": "x", "files": 1}, "names no file or folder"),
    ({"item": "src/pages/App.tsx", "why": "x"}, "names no file or folder"),
    ({"item": "data/places.json", "why": ""}, "a reason"),
    ({"item": "data/no-such-file.json", "why": "x"}, "no such file"),
    ({"item": "data/places-by-book", "why": "x"}, "no such file"),  # a folder without its "/" would match data/places-by-bookX
    ({"item": "data/places-by-book/", "why": "x"}, "how many it held"),
    ({"item": "data/../data/places.json", "why": "x"}, "a plain path"),
])
def test_a_files_ruling_must_name_one_real_file_or_counted_folder(entry: dict, problem: str) -> None:
    assert problem in unregistered.files_ruling_problem({"check": "files", **entry})


def test_a_counted_folder_ruling_stands_and_reports_files_added_since() -> None:
    count = unregistered.json_files_under("data/places-by-book/")
    ruling = {"check": "files", "item": "data/places-by-book/", "why": "names of places", "files": count}
    assert unregistered.files_ruling_problem(ruling) is None
    assert unregistered.files_ruling_problem({"check": "files", "item": "data/places.json", "why": "x"}) is None
    assert unregistered.grown_folders([ruling]) == []
    assert "now" in unregistered.grown_folders([{**ruling, "files": count - 1}])[0]


def test_every_files_ruling_in_the_rulings_file_stands() -> None:
    entries = unregistered.files_rulings()
    assert entries and [problem for entry in entries if (problem := unregistered.files_ruling_problem(entry))] == []


def test_content_files_the_page_code_imports_are_content_files_too(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    write(tmp_path, "content/teachers/evidence.json", "{}")
    write(tmp_path, "content/research/a-1.json", "{}")
    write(tmp_path, "content/research/a-2.json", "{}")
    write(tmp_path, "content/notes/never-imported.json", "{}")
    write(tmp_path, "src/pages/x/Page.tsx", 'import evidence from "../../../content/teachers/evidence.json";\n'
                                            'const all = import.meta.glob<Research>("/content/research/a-*.json");\n'
                                            'import other from "@/data/content/elsewhere.json";\n')
    monkeypatch.setattr(unregistered, "SITE", tmp_path)
    found = {path.relative_to(tmp_path.resolve()).as_posix() for path in unregistered.bundled_content_files()}
    assert found == {"content/teachers/evidence.json", "content/research/a-1.json", "content/research/a-2.json"}
    listed = {path.resolve().relative_to(tmp_path.resolve()).as_posix() for path in unregistered.content_files()}
    assert found <= listed and "content/notes/never-imported.json" not in listed
