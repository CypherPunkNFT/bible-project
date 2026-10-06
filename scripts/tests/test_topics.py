"""build-topics.py: Torrey's headings and references (scripts/build-topics.py)."""
import importlib.util
from pathlib import Path

import pytest

spec = importlib.util.spec_from_file_location("build_topics", Path(__file__).resolve().parents[1] / "build-topics.py")
topics = importlib.util.module_from_spec(spec)
spec.loader.exec_module(topics)


@pytest.mark.parametrize(("raw", "expected"), [
    ("Holy Spirit, The, is God", "The Holy Spirit is God"),
    ("Asher, the Tribe Of", "The Tribe of Asher"),
    ("Affliction, Consolation Under", "Consolation under Affliction"),
    ("Afflicted, Duty Toward The", "Duty toward the Afflicted"),
    ("Anointing, Sacred", "Sacred Anointing"),
    ("Jordan, the River", "The River Jordan"),
    ("Christ, the King", "Christ the King"),
    ("Asp, or Adder", "Asp, or Adder"),
    ("Prayer", "Prayer"),
])
def test_natural_title(raw, expected):
    assert topics.natural_title(raw) == expected


@pytest.mark.parametrize(("parsed", "expected"), [
    ("|John|10|7|0|0", [43010007, 43010007]),
    ("|Lev|16|12|16|15", [3016012, 3016015]),
    ("|Heb|10|19|10|22", [58010019, 58010022]),
    ("|Nope|1|1|0|0", None),
])
def test_span(parsed, expected):
    assert topics.span(parsed) == expected


def test_all_topics_parse_with_every_reference():
    parsed = topics.parse_torrey()
    assert len(parsed) == 623
    assert len({t["id"] for t in parsed}) == 623
    total = sum(len(p["refs"]) + sum(len(i["refs"]) for i in p.get("items", [])) for t in parsed for p in t["points"])
    assert total == 38572
    assert {t["id"]: t["title"] for t in parsed}["beasts"] == "Beasts"
