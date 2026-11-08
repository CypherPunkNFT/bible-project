"""Odd one out: the set checker and the build (scripts/build-odd-one-out.py; docs/features/odd-one-out/design.md 12)."""

import importlib.util
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS / "odd-one-out"))
from ooo_check import also_phrases, check_set  # noqa: E402
from ooo_construct import Builder, BuildError, check_veto, set_id  # noqa: E402
from ooo_model import Candidate, Item, Prop, Rule  # noqa: E402
from ooo_places_books import PLACE_CLASSES  # noqa: E402

BUILD = SCRIPTS / "build-odd-one-out.py"
SITE = SCRIPTS.parent
BOOK_WORDS = {"John", "James", "Peter", "Ruth", "Timothy"}
FAMOUS = {"easy": True, "medium": True, "hard": True}

RULES = {
    "followed-jesus": Rule("followed-jesus", "person", 2, True, "followed Jesus during his ministry",
                           "was not with Jesus during his ministry"),
    "the-twelve": Rule("the-twelve", "person", 2, True, "were among the Twelve Jesus chose", "was not one of the Twelve"),
    "woman": Rule("woman", "person", 1, True, "were women", "is the only man", "is the only woman", "were men"),
    "mountain": Rule("mountain", "place", 1, True, "are mountains or hills", "is not a mountain or hill",
                     "is the only mountain or hill", "are not mountains or hills"),
    "settlement": Rule("settlement", "place", 1, True, "are towns or cities", "is not a town or city",
                       "is the only town or city", "are not towns or cities"),
}
PROPS = {
    "followed-jesus": Prop("followed-jesus", "person", 2, "rule", lacks="was not with Jesus during his ministry"),
    "the-twelve": Prop("the-twelve", "person", 2, "rule", lacks="was not one of the Twelve"),
    "woman": Prop("woman", "person", 1, "rule", only="is the only woman", lacks="is the only man"),
    "tribe:Judah": Prop("tribe:Judah", "person", 3),
    "rel:sibling:john": Prop("rel:sibling:john", "person", 2, anchor="john"),
    "rel:sibling:james": Prop("rel:sibling:james", "person", 2, anchor="james"),
    "rel:sibling:andrew": Prop("rel:sibling:andrew", "person", 2, anchor="andrew"),
    "mountain": Prop("mountain", "place", 1, "rule"),
    "settlement": Prop("settlement", "place", 1, "rule"),
}


def person(pid: str, name: str, label: str | None = None, **values) -> Item:
    values = {key.replace("_", "-").replace("tribe-", "tribe:").replace("sib-", "rel:sibling:"): value
              for key, value in values.items()}
    return Item(pid, "person", name, label or name, "", f"/people/{pid}", 40004018, dict(FAMOUS), values=values)


def place(pid: str, name: str, **values) -> Item:
    return Item(pid, "place", name, name, "", f"/study/atlas/map?place={pid}", 1012008, dict(FAMOUS), values=values)


def judge(items, odd, rule, polarity="members-share", difficulty="easy", labels=None):
    return check_set(items, odd, RULES[rule], polarity, difficulty, PROPS, BOOK_WORDS, labels)


def apostles(**extra) -> list[Item]:
    return [person("peter", "Peter", followed_jesus=True, the_twelve=True, **extra.get("peter", {})),
            person("john", "John", "John son of Zebedee", followed_jesus=True, the_twelve=True, sib_james=True),
            person("james", "James", "James son of Zebedee", followed_jesus=True, the_twelve=True, sib_john=True),
            person("paul", "Paul", **extra.get("paul", {}))]


SPEC_LABELS = {"john": "John", "james": "James"}


def test_spec_example_passes_with_its_reason_and_the_twelve_as_also_true():
    verdict = judge(apostles(), "paul", "followed-jesus", labels=SPEC_LABELS)
    assert verdict.ok, verdict.reason
    assert "was not one of the Twelve" in also_phrases(verdict.also)


def test_known_ambiguous_set_is_rejected():
    items = [person("peter", "Peter", followed_jesus=True, the_twelve=True),
             person("andrew", "Andrew", followed_jesus=True, the_twelve=True),
             person("mary", "Mary Magdalene", followed_jesus=True, woman=True),
             person("paul", "Paul")]
    verdict = judge(items, "paul", "followed-jesus")
    assert not verdict.ok
    assert "singles out mary" in verdict.reason


def test_unknown_on_another_item_creates_a_rival():
    items = apostles(peter={"tribe:Judah": True})
    for item in items[1:]:
        item.values["tribe:Judah"] = None
    verdict = judge(items, "paul", "followed-jesus", labels=SPEC_LABELS)
    assert not verdict.ok and "tribe:Judah singles out peter" in verdict.reason


def test_unknown_never_singles_out_its_own_item():
    items = apostles()
    for item in items:
        item.values["tribe:Judah"] = None
    assert judge(items, "paul", "followed-jesus", labels=SPEC_LABELS).ok


def test_relation_anchored_on_a_member_is_skipped_but_one_outside_the_set_is_checked():
    assert judge(apostles(), "paul", "followed-jesus", labels=SPEC_LABELS).ok  # James and John are brothers
    items = apostles(peter={"rel:sibling:andrew": True})  # Andrew is not one of the four
    verdict = judge(items, "paul", "followed-jesus", labels=SPEC_LABELS)
    assert not verdict.ok and "rel:sibling:andrew singles out peter" in verdict.reason


def test_a_lone_qualified_label_is_a_rival():
    verdict = judge(apostles(), "paul", "followed-jesus", labels={"john": "John"})  # only James stays qualified
    assert not verdict.ok and "label:qualified singles out james" in verdict.reason


def test_three_shared_first_letters_are_a_rival_unless_the_fourth_is_the_odd_one():
    items = [person("andrew", "Andrew", followed_jesus=True, the_twelve=True),
             person("abraham", "Abraham"),
             person("aaron", "Aaron"),
             person("bart", "Bartholomew", followed_jesus=True, the_twelve=True)]
    items[1].values["followed-jesus"] = None
    rival = [person("andrew", "Andrew", followed_jesus=True, the_twelve=True),
             person("alpha", "Alphaeus", followed_jesus=True, the_twelve=True),
             person("bart", "Bartholomew", followed_jesus=True, the_twelve=True),
             person("amos", "Amos")]
    verdict = judge(rival, "amos", "followed-jesus")
    assert not verdict.ok and "label:first:A singles out bart" in verdict.reason
    fine = [person("andrew", "Andrew", followed_jesus=True, the_twelve=True),
            person("alpha", "Alphaeus", followed_jesus=True, the_twelve=True),
            person("amos", "Ananias", followed_jesus=True, the_twelve=True),
            person("paul", "Paul")]
    assert judge(fine, "paul", "followed-jesus").ok


def test_a_mount_typed_as_a_hill_is_not_a_different_kind_from_a_mountain():
    assert PLACE_CLASSES["hill"] == PLACE_CLASSES["mountain"] == PLACE_CLASSES["mountain range"]
    items = [place("hermon", "Hermon", mountain=True), place("zion", "Zion", mountain=True),
             place("tabor", "Tabor", mountain=True), place("bethel", "Bethel", settlement=True)]
    assert judge(items, "bethel", "mountain").ok


def test_a_giveaway_label_is_rejected():
    items = [place("bethel", "Bethel", settlement=True), place("hebron", "Hebron", settlement=True),
             place("shiloh", "Shiloh", settlement=True), place("carmel", "Mount Carmel", mountain=True)]
    verdict = judge(items, "carmel", "mountain", polarity="odd-only")
    assert not verdict.ok and "gives away" in verdict.reason


def test_the_same_name_twice_is_rejected():
    items = apostles()
    items[3] = person("john-baptist", "John", "John the Baptist")
    assert "share the name" in judge(items, "john-baptist", "followed-jesus").reason


def test_hard_allows_no_other_reason_and_medium_one():
    items = [person(pid, pid.title(), followed_jesus=True, the_twelve=True) for pid in ("andrew", "thomas", "philip")]
    items.append(person("paul", "Paul"))  # "not one of the Twelve" is the one other reason
    assert judge(items, "paul", "followed-jesus", difficulty="medium").ok
    assert not judge(items, "paul", "followed-jesus", difficulty="hard").ok
    assert not judge(apostles(), "paul", "followed-jesus", difficulty="medium", labels=SPEC_LABELS).ok


def builder(veto=None) -> Builder:
    rules = [RULES["followed-jesus"], RULES["the-twelve"], RULES["woman"]]
    return Builder("person", apostles(), PROPS, rules, BOOK_WORDS, veto or {})


def test_a_failing_seed_set_stops_the_build():
    seed = {"kind": "person", "difficulty": "easy", "rule": "followed-jesus", "polarity": "members-share",
            "items": ["peter", "john", "james", "paul"], "odd": "paul", "labels": {"john": "John"}}
    with pytest.raises(BuildError, match="fails its checks"):
        builder().add_seed(seed)


def test_a_stale_veto_stops_the_build():
    made = builder()
    made.keep(Candidate("person", "easy", ["peter", "john", "james", "paul"], "paul", "followed-jesus",
                        "members-share"), [])
    check_veto({set_id("followed-jesus", "members-share", ["peter", "john", "james", "paul"]): "test"}, [made])
    with pytest.raises(BuildError, match="ooo-000000"):
        check_veto({"ooo-000000": "no such set"}, [made])


def load_build():
    spec = importlib.util.spec_from_file_location("build_odd_one_out", BUILD)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_check_detects_changed_output(tmp_path):
    build = load_build()
    current, changed, missing = tmp_path / "a.json", tmp_path / "b.json", tmp_path / "c.json"
    current.write_text("same\n", encoding="utf-8")
    changed.write_text("old\n", encoding="utf-8")
    assert build.stale_outputs({current: "same\n", changed: "new\n", missing: "x\n"}) == [changed, missing]


@pytest.mark.skipif(not (SITE / "data" / "text" / "bsb" / "GEN").exists(), reason="Bible data not built")
def test_committed_sets_are_current():
    result = subprocess.run([sys.executable, str(BUILD), "--check"], capture_output=True, text=True, timeout=600)
    assert result.returncode == 0, result.stderr
