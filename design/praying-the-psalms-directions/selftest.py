"""Prove build-data.py refuses wrong input. Each case changes the study text in memory and must raise BuildError.
Nothing is written: data.js is compared before and after, byte for byte."""
from scripture_text import BuildError

# (what is wrong, the exact text to find in content.md, what to put in its place)
CASES = [
    ("a changed word in a block quotation", "Everything must be fulfilled that is written about Me", "Everything must be fulfilled that is spoken about Me"),
    ("a block quotation under the wrong reference", "\nPsalm 150:6 · BSB", "\nPsalm 150:5 · BSB"),
    ("a changed word in a quoted phrase", '"The LORD is my shepherd; I shall not want" (23:1 · BSB)', '"The LORD is my shepherd; I shall not lack" (23:1 · BSB)'),
    ("a quote cited to the wrong verse", '"You turned my mourning into dancing" (30:11 · BSB)', '"You turned my mourning into dancing" (30:12 · BSB)'),
    ("a reference that does not exist", "(Matthew 26:30 · BSB)", "(Matthew 26:80 · BSB)"),
    ("a psalm that does not exist", "Psalm 53 is almost the same as Psalm 14", "Psalm 153 is almost the same as Psalm 14"),
    ("a link that leaves the site", "Prayer as a subject has its own studies", "Prayer as a subject has [its own studies](https://example.com/)"),
    ("a protocol-relative link", "Prayer as a subject has its own studies", "Prayer as a subject has [its own studies](//example.com/)"),
    ("a count changed in the text", "116 of the 150 psalms carry a heading and 34 do not", "117 of the 150 psalms carry a heading and 33 do not"),
    ("a wrong list of writers' psalms", "**Asaph**, in 12 (Psalms 50 and 73–83)", "**Asaph**, in 12 (Psalms 50 and 74–84)"),
    ("a bare reference with no book or quotation", "Hebrews of the Son above the angels (1:5)", "Hebrews of the Son above the angels (1:6)"),
    ("a changed word in a psalm heading", "When Nathan the prophet came to him", "When Gad the prophet came to him"),
    ("a changed outside quotation", "An Anatomy of all the Parts of the Soul", "An Anatomy of every Part of the Soul"),
    ("one quoted word with nothing bound to it", '"Hallel" is Hebrew for praise', '"Hosanna" is Hebrew for praise'),
    ("a line the page could not place", "\n## 01 Five books and their blessings", "\n#### A stray heading\n\n## 01 Five books and their blessings"),
]


def run_selftest(build, content_path, out_path) -> int:
    text = content_path.read_text(encoding="utf-8")
    before = out_path.read_bytes() if out_path.exists() else None
    build(text)  # the true text must pass, or the cases below prove nothing
    refused = 0
    for name, find, replace in CASES:
        if text.count(find) != 1:
            print(f"selftest: case {name!r} cannot be applied: its text is found {text.count(find)} times")
            return 1
        try:
            build(text.replace(find, replace))
        except BuildError as error:
            refused += 1
            print(f"selftest: refused {name}: {str(error).splitlines()[0][:150]}")
            continue
        except Exception as error:  # a crash is not a refusal
            print(f"selftest: FAILED: {name} crashed with {type(error).__name__}: {error}")
            return 1
        print(f"selftest: FAILED: {name} was accepted")
        return 1
    import study_lists  # a count the text states, made wrong in the list it is checked against, must be refused too
    saved = study_lists.CLAIMS[3]["value"]
    study_lists.CLAIMS[3]["value"] = saved + 1
    try:
        build(text)
    except BuildError as error:
        refused += 1
        print(f"selftest: refused a count that differs from the Berean's: {str(error)[:150]}")
    else:
        print("selftest: FAILED: a count that differs from the Berean's was accepted")
        return 1
    finally:
        study_lists.CLAIMS[3]["value"] = saved
    after = out_path.read_bytes() if out_path.exists() else None
    if before != after:
        print("selftest: FAILED: data.js changed during the self-test")
        return 1
    print(f"selftest: all {refused} wrong inputs refused; data.js untouched")
    return 0
