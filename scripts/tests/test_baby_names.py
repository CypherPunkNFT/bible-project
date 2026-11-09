"""Biblical baby names: the build's own rules (scripts/bible/build_baby_names.py; docs/features/baby-names/design.md 7.2).

Unit tests use small hand-made Strong's entries and notes; the output tests read data/baby-names/, which the build
writes (run it first: py -3.12 scripts/bible/build_baby_names.py). The checks on what visitors see are repeated in
Vitest (src/data/baby-names/baby-names-data.test.ts), which the site's own test command runs.
"""

import json
import re
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS / "bible" / "baby-names"))
sys.path.insert(0, str(SCRIPTS))

from bn_assemble import RESERVED, BuildError, add_reviewed_identities, decided_spelling, slug_of  # noqa: E402
from bn_meaning import (GIVEN, PROBABLE, PROBABLE_HEDGED, UNCERTAIN, UNCERTAIN_HEADLINE, choose_meaning,  # noqa: E402
                        clean_headline, follow_chain, origin_of, parse_note, strongs_meaning, themes_for)
from bn_sources import BereanNote, NameLine, StrongEntry, strong_base  # noqa: E402

SITE = SCRIPTS.parent
OUT = SITE / "data" / "baby-names"
INPUTS = SCRIPTS / "bible" / "baby-names"


def entry(sid: str, source: str, meaning: str = "", is_name: bool = True) -> StrongEntry:
    return StrongEntry(id=sid, word="", translit="", is_name=is_name, source=source, meaning=meaning)


# Strong's wording as the Open Scriptures and Petersen editions print it, cut to what the rules read.
LEXICON = {e.id: e for e in [
    entry("H2584", "from H2603; favored;", "Channah, an Israelitess"),
    entry("H8283", "the same as H8282;", "Sarah, Abraham's wife"),
    entry("H8282", "feminine of H8269;", "a mistress, i.e. female noble", is_name=False),
    entry("H3076", "from H3068 and H2603; Jehovah-favored;", "Jehochanan, the name of eight Israelites"),
    entry("H3110", "a form of H3076;", "Jochanan, the name of nine Israelites"),
    entry("G2491", "of Hebrew origin (H3110);", "Joannes (i.e. Jochanan), the name of four Israelites"),
    entry("H3290", "from H6117; heel-catcher (i.e. supplanter);", "Jaakob, the Israelitish patriarch"),
    entry("G2384", "of Hebrew origin (H3290);", "Jacob (i.e. Ja'akob), the progenitor of the Israelites"),
    entry("G2385", "the same as G2384 Græcized;", "Jacobus, the name of three Israelites"),
    entry("H472", "from H410 and H7651; God of (the) oath;", "Elisheba, the wife of Aaron"),
    entry("G1665", "of Hebrew origin (H472);", "Elisabet, an Israelitess"),
    entry("G4735", "from an apparently primary stepho (to twine or wreathe);", "a chaplet (as a badge of royalty)", is_name=False),
    entry("G4736", "the same as G4735;", "Stephanus, a Christian"),
    entry("H5833", "feminine of H5828;", "aid", is_name=False),
    entry("H5830", "a variation of H5833;", "Ezra, an Israelite"),
    entry("H5146", "the same as H5118; rest;", "Noach, the patriarch of the flood"),
    entry("H635", "of Persian derivation;", "Ester, the Jewish heroine"),
    entry("H452", "or prolonged אֵלִיָּהוּ; from H410 and H3050; God of Jehovah;", "Elijah, the name of the prophet"),
    entry("H7327", "probably for H7468; friend;", "Ruth, a Moabitess"),
]}


@pytest.mark.parametrize("strongs, chain_end", [
    ("H8283", "H8282"), ("G2491", "H3076"), ("G2385", "H3290"), ("G1665", "H472"), ("G4736", "G4735"), ("H5830", "H5833"),
])
def test_pointers_are_followed_to_a_gloss(strongs, chain_end):
    chain, last = follow_chain(strongs, LEXICON)
    assert chain[-1] == chain_end and last is LEXICON[chain_end]
    assert len(chain) <= 4


def test_gloss_examples_from_the_design():
    assert strongs_meaning("H2584", LEXICON).headline == "favored"
    assert strongs_meaning("G2491", LEXICON).headline == "favored by the LORD"
    assert strongs_meaning("G2385", LEXICON).headline == "heel-catcher (i.e. supplanter)"
    assert strongs_meaning("G1665", LEXICON).headline == "God of the oath"


def test_a_chain_ending_on_an_ordinary_word_is_a_draft_for_the_hand_check():
    sarah = strongs_meaning("H8283", LEXICON)
    assert sarah.headline == UNCERTAIN_HEADLINE and sarah.label == UNCERTAIN and sarah.needs_check
    assert strongs_meaning("G4736", LEXICON).needs_check
    assert strongs_meaning("H5830", LEXICON).needs_check


def test_unknown_meanings_say_so_with_the_language():
    esther = strongs_meaning("H635", LEXICON)
    assert (esther.headline, esther.label, esther.origin) == (UNCERTAIN_HEADLINE, UNCERTAIN, "Persian")


def test_strongs_hedge_is_kept_in_the_label():
    assert "probably" in strongs_meaning("H7327", LEXICON).label


def test_clean_up_never_leaves_jehovah_or_reference_numbers():
    assert clean_headline("Jehovah-saved;") == "saved by the LORD"
    assert clean_headline("God of Jehovah") == "God of the LORD"
    assert "H2603" not in clean_headline("favored H2603")
    assert strongs_meaning("H452", LEXICON).headline == "God of the LORD"


def test_bible_note_means_is_the_headline_and_sounds_like_is_only_wordplay():
    noah = parse_note(BereanNote(1005029, "Noah sounds like the Hebrew for rest or comfort.", "Noah", "H5146"))
    assert noah == [{"name": "Noah", "kind": "sounds", "text": "Noah sounds like the Hebrew for rest or comfort.", "hedged": False}]
    meaning = choose_meaning("H5146", LEXICON, [{**noah[0], "verse": 1005029}], None)
    assert meaning.headline == "rest" and meaning.wordplay["verse"] == 1005029 and meaning.bible_note is None
    reuben = parse_note(BereanNote(1029032, "Reuben means Look, a son and also sounds like the Hebrew for He has seen my misery.", "", ""))
    means = next(n for n in reuben if n["kind"] == "means")
    assert means["text"] == "Look, a son"
    assert next(n for n in reuben if n["kind"] == "sounds")["text"] == "Reuben means Look, a son and also sounds like the Hebrew for He has seen my misery."
    seth = parse_note(BereanNote(1004025, "Seth probably means granted or appointed.", "Seth", "H8352"))
    chosen = choose_meaning("H5146", LEXICON, [{**seth[0], "verse": 1004025}], None)
    assert chosen.label == PROBABLE and chosen.headline == "granted or appointed"
    hannah = choose_meaning("H2584", LEXICON, [{"name": "Hannah", "kind": "means", "text": "grace", "hedged": False, "verse": 1}], None)
    assert hannah.label == GIVEN


def test_override_wins_and_keeps_its_citation():
    override = {"headline": "princess", "label": "Probable", "cite": "Strong's H8283"}
    meaning = choose_meaning("H8283", LEXICON, [], override)
    assert (meaning.headline, meaning.source, meaning.cite) == ("princess", "override", "Strong's H8283")


def test_themes_come_from_the_headline_only_and_skip_negatives():
    themes = json.loads((INPUTS / "themes.json").read_text(encoding="utf-8"))["themes"]
    assert themes_for("favored by the LORD", themes) == ["god", "grace"]
    assert themes_for(UNCERTAIN_HEADLINE, themes) == []
    assert themes_for("she has not received mercy", themes) == []
    assert themes_for("beloved", themes) == ["love"]
    # Inflected forms found missing in the 150-name review (job 836): Samson, Barak, Hosea, Menahem, Ammishaddai.
    assert themes_for("sunlight", themes) == ["light"] and themes_for("lightning", themes) == ["light"]
    assert themes_for("deliverer", themes) == ["help"] and themes_for("comforter", themes) == ["peace"]
    assert themes_for("people of the Almighty", themes) == ["god"]


def test_glosses_starting_with_for_are_kept_and_hedges_along_a_chain_count():
    """'force of God' is a gloss, not a 'for H…' derivation; 'a form for N' and 'probably a shortened form of N' are
    pointers, and a hedge on any step labels the meaning hedged (job 836)."""
    lexicon = {**LEXICON, **{e.id: e for e in [
        entry("H6274", "from the same as H6273 and H410; force of God;", "Othniel, an Israelite"),
        entry("H4509", "from H4480 and H3225; from (the) right hand;", "Minjamin, the name of two Israelites"),
        entry("H4326", "a form for H4509;", "Mijamin, the name of three Israelites"),
        entry("H4993", "from H4991 and H3050; gift of Jah;", "Mattithjah, the name of four Israelites"),
        entry("G3161", "of Hebrew origin (H4993);", "Mattathias (i.e. Mattithjah), an Israelite and a Christian"),
        entry("G3158", "probably a shortened form of G3161;", "Matthat (i.e. Mattithjah), the name of two Israelites"),
    ]}}
    assert (strongs_meaning("H6274", lexicon).headline, strongs_meaning("H6274", lexicon).label) == ("force of God", PROBABLE)
    assert strongs_meaning("H4326", lexicon).chain == ["H4326", "H4509"]
    matthat = strongs_meaning("G3158", lexicon)
    assert (matthat.headline, matthat.label, matthat.chain) == ("gift of the LORD", PROBABLE_HEDGED, ["G3158", "G3161", "H4993"])
    assert strongs_meaning("H7327", lexicon).headline == "friend"  # 'probably for H7468; friend;' stays a derivation


def test_slug_rule():
    assert slug_of("Maher-shalal-hash-baz") == "maher-shalal-hash-baz"
    assert slug_of("Zaphenath-paneah") == "zaphenath-paneah"
    assert slug_of("Jesús") == "jesus"
    assert strong_base("H0085") == "H85" and strong_base("G3137J") == "G3137"


def test_every_override_cites_a_source():
    overrides = json.loads((INPUTS / "meaning-overrides.json").read_text(encoding="utf-8"))["overrides"]
    assert overrides
    for key, value in overrides.items():
        assert re.search(r"Strong's [HG]\d+|Brown-Driver-Briggs|Easton|[1-3]? ?[A-Z][a-z]+ \d+:\d+", value["cite"]), key
        assert value["label"] in (GIVEN, PROBABLE, PROBABLE_HEDGED, UNCERTAIN), key


# ---- the built output ----------------------------------------------------------------------------------------

@pytest.fixture(scope="module")
def built():
    if not (OUT / "index.json").exists():
        pytest.skip("data/baby-names/ is not built; run py -3.12 scripts/bible/build_baby_names.py")
    index = json.loads((OUT / "index.json").read_text(encoding="utf-8"))
    load = lambda slug: json.loads((OUT / "names" / f"{slug}.json").read_text(encoding="utf-8"))  # noqa: E731
    return index, load


def test_slugs_unique_and_unreserved(built):
    index, _ = built
    slugs = [row["s"] for row in index["names"]]
    assert len(slugs) == len(set(slugs)) and not set(slugs) & RESERVED
    assert all(slug == slug_of(row["n"]) for slug, row in zip(slugs, index["names"]))
    assert not set(index["aliases"]) & set(slugs)


def test_every_person_linked_exists(built):
    index, load = built
    people = {p["id"] for p in json.loads((SITE / "data" / "study" / "people.json").read_text(encoding="utf-8"))}
    for row in index["names"]:
        for bearer in load(row["s"])["bearers"]:
            assert bearer["id"] in people, (row["s"], bearer["id"])


def test_no_jehovah_and_no_headline_from_hitchcock(built):
    index, load = built
    for row in index["names"]:
        assert "Jehovah" not in row["m"], row["s"]
        doc = load(row["s"])
        for block in doc["originals"]:
            assert block["meaning"]["source"] in ("override", "bible", "strongs", "none")
            if block["hitchcock"]:
                assert block["hitchcock"] != block["meaning"]["headline"]


def test_every_full_name_has_a_verse_to_quote(built):
    index, load = built
    for row in index["names"]:
        if row["f"]:
            doc = load(row["s"])
            assert doc["verses"], row["s"]
            assert all(b["keyVerses"] for b in doc["bearers"]), row["s"]


def test_hard_cases_from_the_design(built):
    index, load = built
    noah, jesus, mary = load("noah"), load("jesus"), load("mary")
    assert len(noah["originals"]) == 2 and noah["gender"] == "both"
    assert {b["strongs"] for b in noah["originals"]} == {"H5146", "H5270"}
    assert jesus["testament"] == "nt"
    assert len(mary["bearers"]) == 6 and mary["originals"][0]["meaning"]["headline"] == UNCERTAIN_HEADLINE
    assert "miriam" in [r["slug"] for r in mary["related"]["otherTestament"]]
    assert index["aliases"].get("elias", [""])[0] == "elijah"


def test_excluded_names_have_no_page(built):
    index, _ = built
    excluded = json.loads((INPUTS / "excluded.json").read_text(encoding="utf-8"))["names"]
    slugs = {row["s"] for row in index["names"]} | set(index["aliases"])
    for item in excluded:
        assert slug_of(item["name"]) not in slugs, item["name"]


# ---- reviewed decisions (job 824): foreign origins, identities, verse moves, hand-checked drafts ---------------

def test_foreign_names_are_never_called_hebrew_or_greek():
    assert origin_of(entry("H5623", "of foreign derivation;", "Sargon, an Assyrian king")) == "other"
    assert origin_of(entry("G2582", "of foreign origin;", "Candace, an Egyptian queen")) == "other"
    assert origin_of(entry("H635", "of Persian derivation;")) == "Persian"
    assert origin_of(entry("H2584", "from H2603; favored;")) == "Hebrew"


def test_a_reviewed_identity_becomes_a_checked_name_line():
    people, plain, lexicon = {"sargon-isa-20-1": {}}, {23020001: "when Sargon king of Assyria sent him"},         {"H5623": entry("H5623", "of foreign derivation;", "Sargon")}
    tipnr: dict = {}
    item = {"strongs": "H5623", "spelling": "Sargon", "refs": [23020001], "reason": "site-added"}
    add_reviewed_identities(tipnr, {"sargon-isa-20-1": item}, people, lexicon, plain)
    assert [(line.strongs, line.forms, line.refs) for line in tipnr["sargon-isa-20-1"].lines] == [("H5623", ["Sargon"], [23020001])]
    for broken in ({**item, "reason": ""}, {**item, "strongs": "H9999999"}, {**item, "spelling": "Sargonid"}, {**item, "refs": []}):
        with pytest.raises(BuildError):
            add_reviewed_identities({}, {"sargon-isa-20-1": broken}, people, lexicon, plain)
    with pytest.raises(BuildError, match="TIPNR now has"):
        add_reviewed_identities({"sargon-isa-20-1": object()}, {"sargon-isa-20-1": item}, people, lexicon, plain)


def test_a_reviewed_decision_can_move_one_verse_but_not_invent_or_empty_a_line():
    line = NameLine("Named", ["Ahasuerus", "Xerxes"], "H325", "", [17001001, 27009001])
    log: list[str] = []
    assert decided_spelling("k", line, {"dropRefs": [27009001], "reason": "his own person"}, {}, log) == ("", [17001001])
    assert decided_spelling("k", line, {"exclude": True, "reason": "title"}, {}, log) == (None, [])
    for bad in ({"dropRefs": [1], "reason": "x"}, {"dropRefs": [17001001, 27009001], "reason": "x"},
                {"reason": "x"}, {"exclude": True}, {"spelling": "Xerxes", "refs": [17001001], "reason": "x"}):
        with pytest.raises(BuildError):
            decided_spelling("k", line, bad, {17001001: "King Ahasuerus"}, log)


def _supported(headline: str, evidence: str) -> list[str]:
    """Words of a headline missing from its citation and explanation (after Jehovah/Jah -> LORD)."""
    evidence = re.sub(r"\bJehovah\b|\bJah\b", "LORD", evidence).lower()
    stop = {"a", "an", "the", "of", "or", "and", "is", "his", "her", "he", "will", "i", "have", "up", "my", "whose"}
    words = [w.removesuffix("'s") for w in re.findall(r"[^\W\d_][\w'-]*", headline.lower())]
    return [w for w in words if w not in stop and not re.search(rf"\b{re.escape(w)}\b", evidence)]


def test_reviewed_headlines_use_only_words_their_sources_give():
    overrides = json.loads((INPUTS / "meaning-overrides.json").read_text(encoding="utf-8"))["overrides"]
    reviewed = {k: v for k, v in overrides.items() if v.get("reviewed") and v["label"] != UNCERTAIN}
    assert len(reviewed) > 150
    for key, value in reviewed.items():
        if value["label"] == GIVEN:
            continue  # a shortened Berean note: its full text is quoted on the page beside it
        assert _supported(value["headline"], value["cite"] + " " + value.get("explanation", "")) == [], key


def test_every_flagged_draft_in_the_build_is_settled_by_a_reviewed_override(built):
    """A Strong's chain that ends on an ordinary word (or a gloss too long for a headline) is only a draft (design 3.3
    rule 3); every one on a built page is settled by a hand-checked override or comes from the Bible's own note."""
    hebrew = SITE.parent / "sources" / "openscriptures" / "HebrewLexicon" / "HebrewLexicon-master" / "HebrewStrong.xml"
    greek = SITE.parent / "sources" / "openscriptures" / "strongs" / "strongs-master" / "greek" / "StrongsGreekDictionaryXML_1.4" / "strongsgreek.xml"
    if not hebrew.exists() or not greek.exists():
        pytest.skip("the Strong's dictionaries are not on this PC")
    from bn_sources import read_greek_strongs, read_hebrew_strongs
    lexicon = {**read_hebrew_strongs(hebrew), **read_greek_strongs(greek)}
    index, load = built
    unsettled = [f"{row['n']}|{block['strongs']}" for row in index["names"] for block in load(row["s"])["originals"]
                 if strongs_meaning(block["strongs"], lexicon).needs_check and block["meaning"]["source"] not in ("override", "bible")]
    assert unsettled == [], "add a reviewed override to meaning-overrides.json for: " + ", ".join(unsettled)


def test_reviewed_identities_and_verse_moves_in_the_build(built):
    _, load = built
    assert [b["id"] for b in load("sargon")["bearers"]] == ["sargon-isa-20-1"]
    assert load("sargon")["originals"][0]["language"] == "other"
    xerxes = {b["id"]: b for b in load("xerxes")["bearers"]}
    assert set(xerxes) == {"ahasuerus-ezr-4-6", "ahasuerus-dan-9-1"}
    assert 27009001 not in xerxes["ahasuerus-ezr-4-6"]["keyVerses"] and xerxes["ahasuerus-dan-9-1"]["keyVerses"] == [27009001]
    assert xerxes["ahasuerus-ezr-4-6"]["verseCount"] == 28 and xerxes["ahasuerus-dan-9-1"]["verseCount"] == 1
    assert load("candace")["gender"] == "girl"
