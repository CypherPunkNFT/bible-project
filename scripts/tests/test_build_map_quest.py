"""build-map-quest.py's filters (design §3-§5) on tiny hand-made OpenBible rows."""

import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "build-map-quest.py"


@pytest.fixture(scope="module")
def bmq():
    spec = importlib.util.spec_from_file_location("build_map_quest", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def row(place_id, name, sites, verses=("Josh.6.1",), types=("settlement",)):
    """sites: [(lon, lat, votes)] in OpenBible's order."""
    return {
        "id": place_id, "friendly_id": name, "types": list(types), "verses": [{"osis": ref} for ref in verses],
        "identifications": [{"description": f"<modern id=\"m{i}\">Site {i}</modern>", "score": {"vote_total": votes},
                             "resolutions": [{"lonlat": f"{lon},{lat}"}]} for i, (lon, lat, votes) in enumerate(sites)],
    }


def test_keeps_point_like_places_with_a_credible_location(bmq):
    rows = [
        row("a1", "Town", [(35.0, 31.0, 500)]),
        row("a2", "Region", [(35.0, 31.0, 500)], types=("region",)),
        row("a3", "Doubtful", [(35.0, 31.0, 120), (35.01, 31.0, 100)]),  # credible votes total 220 < 300
        row("a4", "Unnamed", [(35.0, 31.0, 500)], verses=()),
    ]
    assert [p["id"] for p in bmq.read_candidates(rows)] == ["a1"]


def test_credible_sites_and_dispute_width(bmq):
    near = bmq.read_candidates([row("a1", "Emmaus", [(35.16, 31.79, 204), (34.99, 31.84, 219), (35.19, 31.69, -10)])])[0]
    assert near["lon"] == 35.16  # the first site in OpenBible's list, as the atlas shows
    assert near["alts"] == [[34.99, 31.84]]  # the negative-vote site is not credible
    assert near["wide"] is False
    wide = bmq.read_candidates([row("a2", "Ophir", [(42.5, 18.2, 190), (43.1, 11.6, 143)])])[0]
    assert wide["wide"] is True


def test_one_place_per_name_merges_the_same_place_in_another_period(bmq):
    places = bmq.read_candidates([
        row("old", "Jericho 1", [(35.4446, 31.8717, 500)], verses=("Josh.6.1", "Josh.6.2")),
        row("new", "Jericho 2", [(35.4362, 31.8519, 500)], verses=("Luke.19.1",)),
        row("far", "Jericho 3", [(36.5, 33.0, 500)], verses=("Gen.1.1",)),
    ])
    kept = bmq.one_per_name(places)
    assert [p["id"] for p in kept] == ["old"]
    assert 42019001 in kept[0]["verses"] and 1001001 not in kept[0]["verses"]


def test_aliases_on_the_same_spot_are_dropped_but_near_neighbours_stay(bmq):
    places = bmq.read_candidates([
        row("big", "Jerusalem", [(35.2342, 31.7767, 500)], verses=("Josh.10.1", "Josh.10.3")),
        row("alias", "Jebus", [(35.2350, 31.7770, 500)]),
        row("near", "Bethany", [(35.2610, 31.7710, 500)]),
    ])
    assert sorted(p["id"] for p in bmq.drop_aliases(places)) == ["big", "near"]


def test_eras_follow_the_verses(bmq):
    assert bmq.era_tags([1012001], False) == ["abraham"]
    assert bmq.era_tags([1005001], False) == []
    assert bmq.era_tags([6006001, 11001001, 40001001], False) == ["exodus", "kingdoms", "jesus"]
    assert bmq.era_tags([44012001], False) == []
    assert bmq.era_tags([44013001], False) == ["paul"]
    assert bmq.era_tags([1001001], True) == ["paul"]


def test_curation_must_name_playable_places(bmq):
    rows = [row("a1", "Town", [(35.0, 31.0, 500)])]
    with pytest.raises(bmq.CurationError, match="not a playable place"):
        bmq.playable_places(rows, {"beginner": [{"id": "zzz"}]}, set(), set())
    with pytest.raises(bmq.CurationError, match="does not name the place"):
        bmq.playable_places(rows, {"beginner": [{"id": "a1", "verse": 1001001}]}, set(), set())
    record = bmq.playable_places(rows, {"beginner": [{"id": "a1"}]}, {"a1"}, set())[0]
    assert (record["tier"], record["scope"], record["atlas"], record["verse"]) == (1, "holy", True, 6006001)


def test_widely_disputed_names_leave_normal_play_whole(bmq):
    rows = [
        row("famous", "Kadesh 1", [(34.4, 30.6, 500), (36.0, 33.0, 400)], verses=("Num.20.1", "Num.20.14")),
        row("minor", "Kadesh 2", [(35.5, 33.1, 500)], verses=("Josh.12.22",)),
    ]
    assert bmq.playable_places(rows, {}, set(), set()) == []
