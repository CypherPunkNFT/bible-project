"""The refusal tests for build-data.py. Each wrong input is made in memory from the real content.md and lists, handed to
the real build, and must be refused with the expected message. The unchanged input must pass. No file is written:
data.js is hashed before and after, and the run fails if it changed."""
import copy
import hashlib

from scripture_text import BuildError


def text_case(old: str, new: str):
    def mutate(text: str, lists: dict) -> tuple:
        if text.count(old) != 1:
            raise AssertionError(f"self-test setup: {old[:50]!r} should be in content.md once, found {text.count(old)}")
        return text.replace(old, new), lists
    return mutate


def list_case(change):
    def mutate(text: str, lists: dict) -> tuple:
        changed = copy.deepcopy(lists)
        change(changed)
        return text, changed
    return mutate


def set_verb(lists: dict, column: int, row: int, entry: tuple) -> None:
    lists["VERB_CHART"][column]["verbs"][row] = entry


CASES = [
    ("a changed word in a block quotation", text_case("made us alive with Christ even when we were dead", "made us alive with Christ even though we were dead"), "not word for word"),
    ("a block quotation under the wrong reference", text_case("Ephesians 2:8–9 · BSB", "Ephesians 2:7–8 · BSB"), "not word for word"),
    ("a changed word in a quoted phrase", text_case('"used to walk"', '"used to run"'), "quoted words"),
    ("a quotation cited to the wrong verse", text_case('"this man, rather than the Pharisee, went home justified" (Luke 18:14)', '"this man, rather than the Pharisee, went home justified" (Luke 18:13)'), "quoted words"),
    ("a quotation that drops the verse's “not”", text_case('"Not by works" (Ephesians 2:9)', '"by works" (Ephesians 2:9)'), "quoted words"),
    ("a reference that does not exist", text_case("(Ephesians 2:1)", "(Ephesians 2:23)"), "does not resolve"),
    ("a link that leaves the site", text_case("Read more in *The good news*.", "Read more in [The good news](https://example.com/)."), "only links to this site"),
    ("a link written to slip past a leading slash", text_case("Read more in *The good news*.", "Read more in [The good news](//example.com/)."), "only links to this site"),
    ("a line the page cannot place", text_case("Concepts: Gift", "Stray line before the study\n\nConcepts: Gift"), "outside any section"),
    ("a verb that is not in its verse", list_case(lambda lists: set_verb(lists, 0, 0, ("Ephesians 2:2", "you used to run", "people"))), "should be in Ephesians 2:2"),
    ("a turn that does not begin with “But”", list_case(lambda lists: lists["VERB_CHART"][4].update(hinge=("Galatians 4:5", "to redeem those under the law"))), "begins with “But”"),
    ("a crisis number given for the wrong country", list_case(lambda lists: lists.__setitem__("CRISIS", [("Spain", "188", "brazil-cvv")])), "crisis line"),
    ("the Galatians 3:28 quotation as content.md has it, unpatched", list_case(lambda lists: lists.__setitem__("TEXT_PATCHES", [])), "quoted words"),
    ("a patch that no longer matches content.md", text_case("there is neither male nor female", "there is neither male nor female at all"), "text patch"),
]


def run_selftest(build_from, bible: dict, text: str, lists: dict, life: dict, out_path) -> str:
    before = hashlib.sha256(out_path.read_bytes()).hexdigest() if out_path.exists() else None
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
    return f"build-data: self-test: the real input passes, and all {len(refused)} wrong inputs were refused"
