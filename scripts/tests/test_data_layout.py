"""The built data is laid out in small pieces (layout 2): a page downloads only what it shows."""

import json
from pathlib import Path

import pytest

DATA = Path(__file__).resolve().parents[2] / "data"
pytestmark = pytest.mark.skipif(not (DATA / "catalog.json").exists(), reason="Bible data not built")


def read(relative: str):
    return json.loads((DATA / relative).read_text(encoding="utf-8"))


def test_catalog_is_layout_3():
    assert read("catalog.json")["format"] == 3


def test_every_catalogued_chapter_is_in_its_five_chapter_text_file():
    catalog = read("catalog.json")
    missing = []
    for t in catalog["translations"]:
        for code, chapters in t["books"].items():
            files = {}
            for k in range((len(chapters) + 4) // 5):
                files.update(read(f"text/{t['slug']}/{code}/{k}.json"))
            missing += [f"{t['slug']}/{code}/{c}" for c in chapters if c not in files]
    assert missing == []


def test_text_is_chunked_and_whole_book_text_is_gone():
    chunk = read("text/kjv/PSA/23.json")  # chapters 116-120
    assert list(chunk) == ["116", "117", "118", "119", "120"] and len(chunk["119"]["v"]) == 176
    assert not (DATA / "text" / "kjv" / "PSA.json").exists()
    assert (DATA / "plain" / "kjv" / "PSA.json").exists()  # search still reads whole books


def test_the_whole_site_stays_under_cloudflares_20000_files():
    count = sum(1 for p in DATA.rglob("*") if p.is_file())
    assert count < 17000, count


def test_cross_references_one_file_per_kjv_chapter_with_only_its_verses():
    refs = read("xref/PSA/23.json")
    assert refs and all(key.startswith("23:") for key in refs)
    assert (DATA / "xref" / "OBA" / "1.json").exists()
    assert not (DATA / "xref" / "PSA.json").exists()


def test_places_by_book_hold_only_that_books_verses():
    rows = read("places-by-book/GEN.json")
    assert rows and all(1_000_000 <= v < 2_000_000 for row in rows for v in row["verses"])
    assert set(rows[0]) == {"id", "name", "verses"}


def test_people_list_is_slim_and_each_person_has_a_file():
    people = read("study/people.json")
    assert set(people[0]) == {"id", "n", "o", "b", "c"}
    detail = read(f"study/people/{people[0]['id']}.json")
    assert {"pa", "k", "refs", "article"} <= set(detail)
