import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bible.books import verse_id  # noqa: E402
from bible.opendata import osis_range  # noqa: E402
from bible.usfm import UsfmError, normalise_strongs, parse_book, plain_text  # noqa: E402


def parse(body: str, strongs: bool = True) -> dict:
    return parse_book("\\id TST test\n\\c 1\n" + body, "test.usfm", strongs, [])


def verse(body: str, strongs: bool = True) -> dict:
    return parse(body, strongs)["chapters"][0]["v"][0]


def test_nested_styles_stack_flags_and_strongs():
    runs = verse('\\v 1 \\wj Suffer \\+add \\+w it|strong="G2076"\\+w*\\+add* now\\wj*')["r"]
    assert ["it ", "aj", "G2076"] in runs or ["it", "aj", "G2076"] in runs
    assert all(isinstance(r, list) and "j" in r[1] for r in runs)


def test_strongs_dropped_when_not_kept():
    runs = verse('\\v 1 \\w stone|strong="H0069"\\w* fell', strongs=False)["r"]
    assert runs == ["stone fell"]


def test_strongs_normalised():
    assert normalise_strongs("H0069") == "H69"
    assert normalise_strongs("G2076, G1510") == "G2076 G1510"
    assert normalise_strongs("X12") is None


def test_footnote_stays_inline_and_drops_reference():
    runs = verse("\\v 4 between the light \\f + \\fr 1.4 \\ft Gr. note\\f*and the darkness.")["r"]
    assert runs == ["between the light ", {"f": "Gr. note"}, "and the darkness."]


def test_cross_reference_notes_dropped():
    runs = verse("\\v 1 word\\x - \\xo 1.1 \\xt Gen 1:1\\x* end")["r"]
    assert plain_text(runs) == "word end"


def test_heading_attaches_to_next_verse_and_paragraph_break():
    data = parse("\\s1 The Creation\n\\p\n\\v 1 In the beginning\n\\v 2 And")
    first = data["chapters"][0]["v"][0]
    assert first["h"] == [["s", "The Creation"]]
    assert first["r"][0] == {"b": "p"}


def test_poetry_break_mid_verse():
    runs = verse("\\q1\n\\v 3 Blessed are the poor,\n\\q2 for theirs is the Kingdom.")["r"]
    assert runs[0] == {"b": "q1"} and {"b": "q2"} in runs


def test_psalm_title_becomes_chapter_title():
    chapter = parse("\\d A Psalm of David.\n\\q1\n\\v 1 LORD, how")["chapters"][0]
    assert plain_text(chapter["t"]) == "A Psalm of David."
    assert plain_text(chapter["v"][0]["r"]) == "LORD, how"


@pytest.mark.parametrize("label", ["12a", "15-16", "1b"])
def test_lettered_and_ranged_verse_labels_kept(label):
    assert verse(f"\\v {label} text")["n"] == label


def test_divine_name_flag():
    assert verse("\\v 1 the \\nd LORD\\nd* said")["r"][1] == ["LORD", "n"]


def test_unknown_paragraph_marker_stops():
    with pytest.raises(UsfmError):
        parse("\\v 1 a\n\\zzz b")


def test_verse_id_and_osis_ranges():
    assert verse_id("DAN", 2, 34) == 27002034
    assert osis_range("Prov.8.22-Prov.8.30") == (20008022, 20008030)
    assert osis_range("Gen.1.1") == (1001001, 1001001)
