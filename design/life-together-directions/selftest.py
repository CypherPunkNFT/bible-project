"""The refusal tests for build-data.py. Each wrong input is made in memory from the real content.md and lists, handed to
the real build, and must be refused with the expected message. The unchanged input must pass. No file is written:
data.js is hashed before and after, and the lists are compared before and after, so a case cannot leak into the next."""
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


def set_root(lists: dict, index: int, **fields) -> None:
    lists["ROOTS"][index] = {**lists["ROOTS"][index], **fields}


CASES = [
    ("a changed word in a block quotation", text_case("> Carry one another’s burdens, and in this way", "> Carry one another’s burdens, and in that way"), "not word for word"),
    ("a block quotation under the wrong reference", text_case("Hebrews 10:24 · BSB", "Hebrews 10:25 · BSB"), "not word for word"),
    ("a changed word in a quoted phrase", text_case('"Love never fails"', '"Love never ends"'), "quoted words"),
    ("a quotation cited to the wrong verse, though the phrase is in the part's main readings",
     text_case('"Love never fails" (1 Corinthians 13:8)', '"Love never fails" (1 Corinthians 13:7)'), "quoted words"),
    ("a quotation that drops the verse's “not”", text_case('"takes no pleasure in evil, but rejoices in the truth"', '"pleasure in evil"'), "quoted words"),
    ("pieces of a quotation stitched from two verses", text_case('"Love never fails"', '"Love is patient … the greatest of these is love"'), "quoted words"),
    ("a reference that does not exist", text_case("(Galatians 6:3)", "(Galatians 6:30)"), "does not resolve"),
    ("a chapter that does not exist", text_case("Most people hear 1 Corinthians 13 at weddings", "Most people hear 1 Corinthians 17 at weddings"), "does not resolve"),
    ("a link that leaves the site", text_case("*The Holy Spirit* takes the question up.", "[The Holy Spirit](https://example.com/) takes the question up."), "only links to this site"),
    ("a link written to climb out of the site", text_case("*The Holy Spirit* takes the question up.", "[The Holy Spirit](/mockups/../../x) takes the question up."), "only links to this site"),
    ("a line the page cannot place", text_case("Concepts: One another", "Stray line before the study\n\nConcepts: One another"), "outside any section"),
    ("curly double quotes the build could not check", text_case('"Keeps no account of wrongs"', "“Keeps no account of wrongs”"), "curly double quotes"),
    ("a stated count the readings do not bear out", text_case("The study walks eight passages", "The study walks nine passages"), "walks 9 passages"),
    ("a gift that is not in its verse", list_case(lambda lists: set_root(lists, 0, gift=("John 13:34", "As I loved you"))), "should be in John 13:34"),
    ("a gift at the wrong stated depth", list_case(lambda lists: set_root(lists, 4, depth=0)), "verses from the command"),
    ("a gift taken from another book", list_case(lambda lists: set_root(lists, 2, gift=("John 13:34", "As I have loved you"), depth=0)), "another book"),
    ("a pairing the study does not name", list_case(lambda lists: set_root(lists, 1, gift=("Galatians 6:2", "the law of Christ"), depth=0, study_says="The law of Christ is the gift.")), "not in content.md"),
    ("a study link that leaves the design folder", list_case(lambda lists: lists["STUDY_LINKS"].__setitem__("The Holy Spirit", "../../src-directions")), "not a mock-up folder"),
    ("a crisis number the site's list does not hold", list_case(lambda lists: lists.__setitem__("CRISIS", [("988", "brazil-cvv")])), "crisis line"),
    ("a crisis number found only inside a longer number", list_case(lambda lists: lists.__setitem__("CRISIS", [("800 911", None)])), "crisis line"),
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
