"""The refusal tests for build-data.py (adapted from the Life together mock-up's). Each wrong input is made in memory
from the real content.md and lists, handed to the real build, and must be refused with the expected message. The
unchanged input must pass. No file is written: data.js is hashed before and after, and the lists are compared before
and after, so a case cannot leak into the next."""
import copy
import hashlib

from scripture_text import BuildError


def text_case(old: str, new: str):
    def mutate(text: str, lists: dict) -> tuple:
        if text.count(old) != 1:
            raise AssertionError(f"self-test setup: {old[:50]!r} should be in content.md once, found {text.count(old)}")
        return text.replace(old, new), copy.deepcopy(lists)
    return mutate


def list_case(change):
    def mutate(text: str, lists: dict) -> tuple:
        changed = copy.deepcopy(lists)
        change(changed)
        return text, changed
    return mutate


def set_item(lists: dict, name: str, index: int, **fields) -> None:
    lists[name][index] = {**lists[name][index], **fields}


CASES = [
    ("a changed word in a block quotation", text_case("> For as often as you eat this bread", "> For as often as you eat the bread"), "not word for word"),
    ("a block quotation under the wrong reference", text_case("Exodus 12:14 · BSB", "Exodus 12:13 · BSB"), "not word for word"),
    ("a changed word in a quoted phrase", text_case('"wait for one another"', '"wait for each other"'), "quoted words"),
    ("a quotation cited to the wrong verse, though it is in the part's readings",
     text_case('(Matthew 3:14). John', '(Matthew 3:15). John'), "quoted words"),
    ("a quotation that drops the verse's “not”", text_case('"not the removal of dirt from the body"', '"the removal of dirt from the body"'), "quoted words"),
    ("pieces of a quotation stitched from two verses with no reference of their own",
     text_case('"praying and singing hymns to God"', '"praying and singing... were baptized"'), "quoted words"),
    ("a reference that does not exist", text_case("(Luke 23:43)", "(Luke 23:63)"), "does not resolve"),
    ("a panel row whose quotation is outside its own reference", text_case("9. Acts 18:8. ", "9. Acts 18:7. "), "quoted words"),
    ("a range over a gap that is not a known omission", text_case("**Main readings:** Mark 14:12–26;", "**Main readings:** Mark 9:43–45;"), "gap in"),
    ("a link that leaves the site", text_case("Read more in *Covenants and promises*.", "Read more in [Covenants and promises](https://example.com/)."), "only links to this site"),
    ("a link written to climb out of the site", text_case("Read more in *Covenants and promises*.", "Read more in [Covenants and promises](/mockups/../../x)."), "only links to this site"),
    ("a line the page cannot place", text_case("Concepts: Water", "Stray line before the study\n\nConcepts: Water"), "outside any section"),
    ("curly double quotes the build could not check", text_case('"Blood of the covenant"', "“Blood of the covenant”"), "curly double quotes"),
    ("an outside quotation changed so the held copy no longer has it",
     list_case(lambda lists: lists["OUTSIDE_QUOTES"].__setitem__("is necessary to the due administration of this ordinance", ("Second London Baptist Confession (1677), 29.3", "lbc", "29.3"))), "not in the held copy"),
    ("a confession quotation moved to the wrong article", list_case(lambda lists: lists["OUTSIDE_QUOTES"].__setitem__("a church ordinance", ("Baptist Faith and Message 2000, article VIII", "bfm", "VIII"))), "not in the held copy"),
    ("a commentary quotation looked for in the wrong note", list_case(lambda lists: lists["OUTSIDE_QUOTES"].__setitem__(
        "is not explicitly stated", ("Jamieson, Fausset and Brown", "jfb", "Crispus"))), "is not in the held copy"),
    ("a proof text the confession does not print", list_case(lambda lists: lists["HELD_FACTS"].__setitem__(0, ("proof", "Col.2.13-Col.2.14", "wcf", "28.4", "x"))), "not among the references"),
    ("a stated count the panel does not bear out", text_case("Acts tells of ten baptisms", "Acts tells of nine baptisms"), "baptisms, but its panel"),
    ("a panel name not in its row's text", list_case(lambda lists: set_item(lists, "PANEL", 1, word="was filled with the Spirit")), "not in the row's text"),
    ("a household drawn as believing where the verse does not say so", list_case(lambda lists: set_item(lists, "PANEL", 6, household=("Acts 16:15", "her household believed"))), "should be in Acts 16:15"),
    ("a household drawn as left open where the passage says it believed", list_case(lambda lists: set_item(lists, "PANEL", 7, household="silent")), "does not bear that out"),
    ("a sign answer that is not in its verse", list_case(lambda lists: set_item(lists, "SIGNS", 0, before=("Acts 8:12", "when they were baptized"))), "should be in Acts 8:12"),
    ("a sign the study does not say", list_case(lambda lists: set_item(lists, "SIGNS", 1, study_says="Before them came the Passover.")), "not in content.md"),
    ("a text patch the study no longer needs", list_case(lambda lists: lists["TEXT_PATCHES"].__setitem__(0, {**lists["TEXT_PATCHES"][0], "old": "Paul and Silas had been flogged"})), "text patch"),
    ("a study link that leaves the design folder", list_case(lambda lists: lists["STUDY_LINKS"].__setitem__("Covenants and promises", "../../src-directions")), "not a mock-up folder"),
    ("a crisis number the site's list does not hold", list_case(lambda lists: lists.__setitem__("CRISIS", [("988", "brazil-cvv")])), "crisis line"),
]


def run_selftest(build_from, bible: dict, text: str, lists: dict, life: dict, out_path) -> str:
    before = hashlib.sha256(out_path.read_bytes()).hexdigest() if out_path.exists() else None
    lists_before = repr(lists)
    build_from(bible, text, lists, life)  # the positive control: the real input must pass
    refused = []
    for name, mutate, expected in CASES:
        changed_text, changed_lists = mutate(text, lists)
        try:
            build_from(bible, changed_text, changed_lists, life)
        except BuildError as error:
            if expected not in str(error):
                raise AssertionError(f"self-test {name!r}: refused, but for another reason: {error}") from error
            refused.append(name)
            continue
        raise AssertionError(f"self-test {name!r}: the build accepted it")
    after = hashlib.sha256(out_path.read_bytes()).hexdigest() if out_path.exists() else None
    if before != after:
        raise AssertionError("self-test changed data.js; it must run in memory only")
    if repr(lists) != lists_before:
        raise AssertionError("self-test changed the real lists; every case must work on a copy")
    return f"build-data: self-test: the real input passes, and all {len(refused)} wrong inputs were refused"
