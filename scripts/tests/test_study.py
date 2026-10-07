"""Study-resource parsers, checked against the real sources (skipped when the Bible data is not built)."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bible.paths import SOURCES  # noqa: E402
from bible.study_harmony import parse_harmony, parse_miracles, sentence_case  # noqa: E402
from bible.study_people import parse_people, people_period, readable_name  # noqa: E402
from bible.study_prophets import build_prophets  # noqa: E402
from bible.study_refs import TORREY_OVERRIDES, RefError, Verses, format_range, parse_refs  # noqa: E402
from bible.study_torrey import parse_evil_agents, parse_servants  # noqa: E402

SITE = Path(__file__).resolve().parents[2]
DATA = SITE / "data"
pytestmark = pytest.mark.skipif(not (DATA / "plain" / "kjv" / "GEN.json").exists(), reason="Bible data not built")


@pytest.fixture(scope="module")
def verses() -> Verses:
    return Verses(DATA)


@pytest.fixture(scope="module")
def people(verses):
    return parse_people((SOURCES / "stepbible" / "TIPNR.txt").read_text(encoding="utf-8"), verses)[0]


@pytest.mark.parametrize("text, expected", [
    ("Matt. 21:1-11, 14-17", ["Matthew 21:1-11", "Matthew 21:14-17"]),
    ("Luke 3:19-20; 4:14", ["Luke 3:19-20", "Luke 4:14"]),
    ("Matt. 9:35-11:1", ["Matthew 9:35-11:1"]),
    ("Luke 12.", ["Luke 12:1-59"]),
    ("Matt. 24, 25", ["Matthew 24:1-51", "Matthew 25:1-46"]),
    ("Isaiah 1:1", ["Isaiah 1:1"]),
    ("I John 1:1", ["1 John 1:1"]),
    ("Matthew 6:26,32", ["Matthew 6:26", "Matthew 6:32"]),
    ("Matt. 4:23 f.", ["Matthew 4:23-24"]),
])
def test_reference_styles(verses, text, expected):
    assert [format_range(*r) for r in parse_refs(text, verses)] == expected


def test_torrey_jud_is_judges_and_bad_verses_fail(verses):
    assert format_range(*parse_refs("Jud 4:4", verses, overrides=TORREY_OVERRIDES)[0]) == "Judges 4:4"
    with pytest.raises(RefError):
        parse_refs("Jude 1:30", verses)


def test_robertson_contents_match_the_printed_book(verses):
    source = (SOURCES / "gutenberg" / "robertson-harmony-36264-h.htm").read_text(encoding="cp1252")
    harmony = parse_harmony(source, verses, set())
    sections = [s for p in harmony["parts"] for s in p["sections"]]
    assert len(harmony["parts"]) == 14  # Parts I-XIV
    assert len(sections) == 185  # §1-184 with §128 printed as 128a and 128b
    by_n = {s["n"]: s for s in sections}
    assert set(by_n["72"]["refs"]) == {"MRK", "MAT", "LUK", "JHN"}  # feeding of the five thousand
    assert len(by_n["128b"]["refs"]["MAT"]) == 2  # Matt. 21:1-11, 14-17
    assert "also" in by_n["184"]["refs"]  # Acts 1:9-12
    miracles = parse_miracles(source)
    assert len(miracles) == 35 and all(m["section"] in by_n for m in miracles)


def test_sentence_case():
    assert sentence_case("THE BARREN FIG TREE CURSED, AND THE SECOND CLEANSING OF THE TEMPLE", set()) == \
        "The barren fig tree cursed, and the second cleansing of the Temple"


def test_torrey_servants_and_correction(verses):
    source = (SOURCES / "ccel" / "ttt.xml").read_text(encoding="utf-8")
    used: list[dict] = []
    groups = parse_servants(source, verses, used)
    workers = [g["who"] for g in groups]
    assert "Samson" in workers and "Elisha" in workers  # Samson's heading is mis-tagged in the source
    blind = next(i for g in groups if g["who"] == "Elisha" for i in g["items"] if i["title"].startswith("Syrians smitten"))
    assert format_range(*blind["refs"][0]) == "2 Kings 6:18"
    assert len(used) == 1
    assert [i["title"] for i in parse_evil_agents(source, verses, [])] == ["Magicians of Egypt", "Witch of Endor", "Simon Magus"]


def test_people_and_family_links(people):
    assert len(people) == 3130
    by_id = {p["id"]: p for p in people}
    assert sum(1 for p in people if p["name"] == "Zechariah") == 29
    david = by_id["david-rut-4-17"]
    assert "jesse-rut-4-17" in david["parents"] and "absalom-2sa-3-3" in david["children"]
    assert by_id["elijah-1ki-17-1"]["era"] == "Divided Monarchy" and "Elias" in by_id["elijah-1ki-17-1"]["names"]


def test_prophets_hand_list(people, verses):
    prophets = build_prophets(people, verses)
    ids = {p["id"] for p in prophets}
    assert {"amos-amo-1-1", "moses-exo-2-10", "deborah-jdg-4-4", "huldah-2ki-22-14"} <= ids
    assert "deborah-gen-35-8" not in ids  # Rebekah's nurse, mislabelled "Prophetess" in the source
    assert sum(1 for p in prophets if p["kind"] == "writing") == 16
    order = [p["id"] for p in prophets]
    assert order.index("samuel-1sa-1-20") < order.index("elijah-1ki-17-1") < order.index("jeremiah-2ch-35-25")

def test_people_periods_split_exile_return_and_the_new_testament():
    assert people_period("Patriarchs", [1012001]) == "patriarchs"
    assert people_period("Egypt and Wilderness", [2019001]) == "exodus"
    assert people_period("Exile and Return", [15002001]) == "return"  # Ezra 2
    assert people_period("Exile and Return", [13009002]) == "return"  # 1 Chronicles 9, the returned
    assert people_period("Exile and Return", [27001006]) == "exile"  # Daniel 1
    assert people_period("New Testament", [42001005]) == "life-of-christ"  # Luke 1
    assert people_period("New Testament", [44006005]) == "early-church"  # Acts 6
    assert people_period("New Testament", [23007014, 40001001]) == "life-of-christ"  # Jesus: Isaiah 7:14, then Matthew 1
    assert people_period("New Testament", []) == "early-church"
    assert people_period("", [1001001]) == ""


def test_people_names_are_readable(people):
    by_id = {p["id"]: p["name"] for p in people}
    assert by_id["mary-magdalene-mat-27-56"] == "Mary Magdalene"
    assert by_id["daughter1-of-lot-gen-19-37"] == "First daughter of Lot"
    assert by_id["motherinlaw-of-peter-mat-8-14"] == "Mother-in-law of Peter"
    assert by_id["unnamed-2-1ki-2-27"] == "Unnamed descendant of Ithamar the son of Aaron (2 of 4)"
    assert not [name for name in by_id.values() if "_" in name or "#" in name]
    assert readable_name("Queen_of_Sheba") == "Queen of Sheba"


def test_jesus_is_in_the_life_of_christ(people):
    jesus = next(p for p in people if p["id"] == "jesus-isa-7-14")
    assert people_period(jesus["era"], jesus["refs"]) == "life-of-christ"

