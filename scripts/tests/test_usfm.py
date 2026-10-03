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


def test_scribal_letter_tags_stripped_letters_kept():
    body = "\\v 4  'l s=\"H8085\"'שְׁמַ֖'seg type=\"x-large\"'ע'seg''/l' \\w יִשְׂרָאֵ֑ל|strong=\"H3478\"\\w*"
    text = plain_text(verse(body, strongs=False)["r"])
    assert text.startswith("שְׁמַ֖ע")
    assert '="' not in text and "'" not in text


@pytest.mark.parametrize("reference", ["(इब्रा. 1:10, इब्रा. 11:3)", "(लूका 2: 41)"])
def test_bracketed_reference_in_bold_italic_becomes_a_footnote(reference):
    runs = verse(f"\\v 1 आदि में परमेश्वर ने आकाश और पृथ्वी की सृष्टि की। \\bdit {reference} \\bdit* \n")["r"]
    assert plain_text(runs) == "आदि में परमेश्वर ने आकाश और पृथ्वी की सृष्टि की।"
    assert {"f": reference} in runs


def test_bold_italic_quotation_stays_text():
    runs = verse("\\v 4 γέγραπται· \\bdit οὐκ ἐπ᾽ ἄρτῳ μόνῳ ζήσεται ἄνθρωπος\\bdit*")["r"]
    assert plain_text(runs) == "γέγραπται· οὐκ ἐπ᾽ ἄρτῳ μόνῳ ζήσεται ἄνθρωπος"


def test_keyword_alone_in_a_paragraph_is_a_speaker_heading():
    data = parse("\\v 1 सुलैमान का श्रेष्ठगीत\n\\p \\k वधू\\k* \n\\q1\n\\v 2 वह मुझ को")
    first, second = data["chapters"][0]["v"]
    assert plain_text(first["r"]) == "सुलैमान का श्रेष्ठगीत"
    assert second["h"] == [["sp", "वधू"]]


def test_book_introduction_outline_title_ignored():
    # As in the Hindi IRV: the introduction comes after the book title and before chapter 1.
    body = "\\id TST test\n\\mt1 उत्पत्ति\n\\is1 लेखक\n\\ip परिचय (प्रेरि. 7:22)\n\\iot रूपरेखा\n\\io1 1. सृष्टि \\ior 1:1\\ior*\n"
    data = parse_book(body + "\\c 1\n\\p\n\\v 1 आदि में", "t.usfm", False, [])
    assert plain_text(data["chapters"][0]["v"][0]["r"]) == "आदि में"
    assert "t" not in data["chapters"][0]


def test_plain_italic_only_when_asked():
    body = "\\id TST test\n\\c 1\n\\v 1 \\it “उजियाला हो,”\\it* तो उजियाला हो गया।"
    plain = parse_book(body, "t.usfm", False, [], plain_italic=True)["chapters"][0]["v"][0]["r"]
    styled = parse_book(body, "t.usfm", False, [])["chapters"][0]["v"][0]["r"]
    assert plain == ["“उजियाला हो,” तो उजियाला हो गया।"]
    assert ["“उजियाला हो,”", "i"] in styled


def test_heading_after_last_verse_kept_as_chapter_end():
    data = parse("\\v 27 To God only wise, be glory.\n\\s1 Written to the Romans from Corinthus.\n")
    assert data["chapters"][0]["e"] == [["s", "Written to the Romans from Corinthus."]]


def test_verse_id_and_osis_ranges():
    assert verse_id("DAN", 2, 34) == 27002034
    assert osis_range("Prov.8.22-Prov.8.30") == (20008022, 20008030)
    assert osis_range("Gen.1.1") == (1001001, 1001001)
