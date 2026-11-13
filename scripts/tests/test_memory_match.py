"""Memory card match: the pair checker and the build (scripts/build-memory-match.py; docs/features/memory-match/design.md 14)."""

import copy
import subprocess
import sys
from collections import Counter
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS / "memory-match"))
from mm_build import (
    BuildError,
    Sources,
    content_words,
    first_name,
    make_id,
)
from mm_pairs import document, load_characters, load_pairs

BUILD = SCRIPTS / "build-memory-match.py"
SITE = SCRIPTS.parent

PEOPLE = {
    "daniel-ezk-14-14": {"id": "daniel-ezk-14-14", "n": "Daniel", "o": [], "c": 72},
    "noah-gen-5-29": {"id": "noah-gen-5-29", "n": "Noah", "o": [], "c": 47},
    "aaron-exo-4-14": {"id": "aaron-exo-4-14", "n": "Aaron", "o": [], "c": 333},
    "nathan-2sa-7-2": {"id": "nathan-2sa-7-2", "n": "Nathan", "o": [], "c": 30},
    "paul-act-7-58": {"id": "paul-act-7-58", "n": "Paul", "o": ["Saul"], "c": 182},
    "ananias-act-9-10": {"id": "ananias-act-9-10", "n": "Ananias", "o": [], "c": 5},
    "joshua-exo-17-9": {"id": "joshua-exo-17-9", "n": "Joshua", "o": [], "c": 189},
}
BIBLE = {
    "DAN": {"6:21": "Then Daniel spoke with the king.", "6:22": "My God sent His angel and shut the mouths of the lions.",
            "6:23": "So Daniel was lifted out of the den."},
    "GEN": {"6:13": "Then God said to Noah,", "6:14": "Make yourself an ark of gopher wood."},
    "NUM": {"17:8": "the staff of Aaron had sprouted, put forth buds, blossomed, and produced almonds."},
    "2SA": {"12:7": "Then Nathan said to David, “You are that man!”"},
    "ACT": {"9:3": "As Saul drew near to Damascus, a light from heaven flashed around him.",
            "9:10": "In Damascus there was a disciple named Ananias.", "9:11": "Go to the house on Straight Street."},
    "JOS": {"6:20": "the wall collapsed", "6:21": "they took the city of Jericho"},
}
CHARACTERS = {
    "daniel": {"label": "Daniel", "person": "daniel-ezk-14-14"},
    "noah": {"label": "Noah", "person": "noah-gen-5-29"},
    "aaron": {"label": "Aaron", "person": "aaron-exo-4-14"},
    "nathan": {"label": "Nathan", "person": "nathan-2sa-7-2"},
    "paul": {"label": "Paul", "person": "paul-act-7-58"},
    "ananias-of-damascus": {"label": "Ananias of Damascus", "person": "ananias-act-9-10"},
    "joshua": {"label": "Joshua", "person": "joshua-exo-17-9"},
    "good-samaritan": {"label": "The good Samaritan", "person": None, "parable": True},
}
PAIRS = [
    {"who": "daniel", "story": "the lions' den", "ref": "DAN 6:21-23", "check": "den", "tier": 1, "decks": ["prophets"],
     "keyVerse": "DAN 6:22"},
    {"who": "noah", "story": "the ark and the flood", "ref": "GEN 6:13-14", "check": "ark", "tier": 1, "decks": ["beginnings"]},
    {"who": "aaron", "story": "his staff sprouted almonds", "ref": "NUM 17:8", "check": "almonds", "tier": 2,
     "decks": ["beginnings"]},
    {"who": "nathan", "story": "“You are that man!”", "ref": "2SA 12:7", "check": "man", "tier": 2, "decks": ["judges-kings"]},
    {"who": "paul", "story": "blinded on the Damascus road", "ref": "ACT 9:3", "check": "Damascus", "tier": 1,
     "decks": ["church"], "notWith": ["ananias-of-damascus"]},
    {"who": "ananias-of-damascus", "story": "sent to Straight Street", "ref": "ACT 9:10-11", "check": "Straight",
     "tier": 3, "decks": ["church"]},
    {"who": "joshua", "story": "the walls of Jericho", "ref": "JOS 6:20-21", "check": "wall", "tier": 1, "decks": ["beginnings"]},
]


@pytest.fixture
def sources() -> Sources:
    return Sources(copy.deepcopy(PEOPLE), {"paul-act-7-58": "paul"}, copy.deepcopy(BIBLE), Counter({"Daniel": 9}))


def build(sources: Sources, characters: dict | None = None, pairs: list | None = None, mixed_ok: bool = True) -> dict:
    """Check made-up inputs; the Mixed-deck size rule is relaxed, since the sample has only seven pairs."""
    import mm_build
    original = dict(mm_build.BOARD_PAIRS), mm_build.HARD_DEEP_PAIRS
    if mixed_ok:
        mm_build.BOARD_PAIRS.update({"easy": 0, "medium": 0, "hard": 0})
        mm_build.HARD_DEEP_PAIRS = 0
    try:
        chars = load_characters(copy.deepcopy(characters or CHARACTERS), sources)
        return document(chars, load_pairs(copy.deepcopy(pairs or PAIRS)), sources)[0]
    finally:
        mm_build.BOARD_PAIRS.update(original[0])
        mm_build.HARD_DEEP_PAIRS = original[1]


def with_pair(index: int, **changes) -> list[dict]:
    pairs = copy.deepcopy(PAIRS)
    pairs[index].update(changes)
    return pairs


def test_the_sample_builds_with_links_ids_and_verse_ids(sources):
    doc = build(sources)
    daniel = next(p for p in doc["pairs"] if p["who"] == "daniel")
    assert daniel["ref"] == "Daniel 6:21–23"
    assert daniel["readerHref"] == "/read/bsb/DAN/6?hl=21-23"
    assert daniel["keyVerse"] == "Daniel 6:22" and daniel["keyVerseId"] == 27006022
    assert "keyQuote" not in daniel and "lions." not in str(doc)  # verse ids only, never wording (design 5.4)
    assert doc["characters"]["paul"]["href"] == "/people/paul"
    assert doc["characters"]["daniel"]["href"] == "/people/daniel-ezk-14-14"
    assert doc["characters"]["joshua"] == {"label": "Joshua", "href": "/people/joshua-exo-17-9", "first": "joshua"}
    assert "good-samaritan" not in doc["characters"]  # a who card with no pair is not shipped


def test_a_missing_check_word_fails(sources):
    with pytest.raises(BuildError, match="check word 'budded'"):
        build(sources, pairs=with_pair(2, check="budded", story="his staff budded"))


def test_an_unknown_person_id_fails(sources):
    characters = copy.deepcopy(CHARACTERS)
    characters["noah"]["person"] = "noah-gen-0-0"
    with pytest.raises(BuildError, match="noah-gen-0-0"):
        build(sources, characters=characters)


def test_a_label_that_does_not_name_its_person_fails(sources):
    characters = copy.deepcopy(CHARACTERS)
    characters["noah"]["person"] = "aaron-exo-4-14"
    with pytest.raises(BuildError, match="no word of the label"):
        build(sources, characters=characters)


def test_a_story_naming_its_own_character_fails(sources):
    with pytest.raises(BuildError, match="names its own character"):
        build(sources, pairs=with_pair(1, story="Noah's ark"))


def test_a_capitalised_word_shared_with_another_who_card_needs_a_link(sources):
    pairs = copy.deepcopy(PAIRS)
    del pairs[4]["notWith"]
    with pytest.raises(BuildError, match="Damascus is also in the who card 'Ananias of Damascus'"):
        build(sources, pairs=pairs)


def test_a_key_verse_outside_the_passage_fails(sources):
    with pytest.raises(BuildError, match="outside the passage"):
        build(sources, pairs=with_pair(0, keyVerse="DAN 6:24"))


def test_a_quotation_that_is_not_bsb_wording_fails(sources):
    with pytest.raises(BuildError, match="not BSB wording"):
        build(sources, pairs=with_pair(3, story="“You are the man!”"))


def test_a_not_with_name_that_is_not_a_who_card_fails(sources):
    with pytest.raises(BuildError, match="'eli', which is not a who card"):
        build(sources, pairs=with_pair(1, notWith=["eli"]))


def test_removing_the_spec_pair_fails(sources):
    with pytest.raises(BuildError, match="Daniel / the lions' den"):
        build(sources, pairs=PAIRS[1:])


@pytest.mark.parametrize("story, problem", [
    ("a very long story label that goes on", "longer than 30"),
    ("Noahic flood", "lower case"),
])
def test_card_text_rules(sources, story, problem):
    with pytest.raises(BuildError, match=problem):
        build(sources, pairs=with_pair(1, story=story))


def test_long_words_need_soft_hyphens(sources):
    characters = copy.deepcopy(CHARACTERS)
    characters["noah"]["label"] = "Noahnoahnoahnoah"
    with pytest.raises(BuildError, match="soft hyphens"):
        build(sources, characters=characters)


def test_a_reference_the_bsb_does_not_have_fails(sources):
    with pytest.raises(BuildError, match="not in the BSB text"):
        build(sources, pairs=with_pair(1, ref="GEN 6:13-15"))


def test_not_with_comes_out_symmetric(sources):
    doc = build(sources)
    by_who = {p["who"]: p for p in doc["pairs"]}
    assert by_who["paul"]["notWith"] == ["ananias-of-damascus"]
    assert by_who["ananias-of-damascus"]["notWith"] == ["paul"]


@pytest.mark.parametrize("story, words", [
    ("the walls of Jericho", ["wall", "jericho"]),
    ("the writing on the wall", ["writing", "wall"]),
    ("the angel's announcement", ["angel", "announcement"]),
    ("angels in the night fields", ["angel", "night", "field"]),
    ("“Wherever you go, I will go”", ["wherever", "go", "will"]),
    ("the lions' den", ["lion", "den"]),
])
def test_content_words(story, words):
    assert content_words(story) == words


@pytest.mark.parametrize("label, first", [
    ("King Saul", "saul"), ("Mary, mother of Jesus", "mary"), ("Lot's wife", "lot"), ("The good Samaritan", "good"),
    ("Joseph of Arimathea", "joseph"), ("Nebu­chad­nezzar", "nebuchadnezzar"),
])
def test_first_names(label, first):
    assert first_name(label) == first


def test_ids_are_stable(sources):
    assert make_id("daniel", "the lions' den") == make_id("daniel", "the lions' den")
    assert [p["id"] for p in build(sources)["pairs"]] == [p["id"] for p in build(sources)["pairs"]]
    assert build(sources)["stamp"] == build(sources)["stamp"]


def test_check_passes_on_the_real_site_data():
    result = subprocess.run([sys.executable, str(BUILD), "--check"], capture_output=True, text=True, encoding="utf-8", check=False)
    assert result.returncode == 0, result.stderr


def test_check_detects_changed_output(tmp_path, monkeypatch):
    import importlib.util
    spec = importlib.util.spec_from_file_location("build_memory_match", BUILD)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    stale = tmp_path / "pairs.json"
    stale.write_text("{}", encoding="utf-8")
    assert module.stale_outputs({stale: "{}"}) == []
    assert module.stale_outputs({stale: '{"changed": true}'}) == [stale]
    assert module.stale_outputs({tmp_path / "missing.json": "{}"}) == [tmp_path / "missing.json"]


@pytest.mark.parametrize(("book", "testament", "deck"), [
    ("PSA", "ot", "psalms"), ("PRO", "ot", "law-prophets-wisdom"), ("GEN", "ot", "law-prophets-wisdom"),
    ("ISA", "ot", "law-prophets-wisdom"), ("JHN", "nt", "gospels"), ("ROM", "nt", "letters"), ("REV", "nt", "letters"),
])
def test_a_verse_category_follows_its_book(book: str, testament: str, deck: str) -> None:
    from mm_verses import VERSE_DECKS, deck_of
    assert deck_of(book, testament) == deck
    assert deck in {key for key, _ in VERSE_DECKS}
