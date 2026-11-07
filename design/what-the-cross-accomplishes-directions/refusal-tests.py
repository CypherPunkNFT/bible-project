"""Refusal tests for build-data.py: feed it wrong inputs in memory and confirm each is refused for the expected reason.
Run from Website/: python design/what-the-cross-accomplishes-directions/refusal-tests.py   Writes nothing; exit 1 if any slips through."""
import copy, importlib.util, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("build_data", HERE / "build-data.py")
bd = importlib.util.module_from_spec(spec); spec.loader.exec_module(bd)
real = bd.CONTENT.read_text(encoding="utf-8")
before = (HERE / "data.js").read_bytes()

class Fake:
    def __init__(self, text): self.text = text
    def read_text(self, encoding=None): return self.text
    def read_bytes(self): return self.text.encode()
    name = "content.md"

def swap(old, new):
    assert old in real, old
    return real.replace(old, new, 1)

cases = [
    ("changed word in a block quotation", swap("ransom for many.\n", "ransom for all.\n"), None, "not word for word the Berean at Mark 10:45"),
    ("block quotation under the wrong reference", swap("Mark 10:45 · BSB", "Mark 10:44 · BSB"), None, "not word for word the Berean at Mark 10:44"),
    ("changed word in a quoted phrase", swap('"Very rarely"', '"Very seldom"'), None, "quoted words 'Very seldom'"),
    ("quote cited to the wrong verse", swap('"a piece of broiled fish" in front of them (Luke 24:42–43)', '"a piece of broiled fish" in front of them (Luke 24:40–41)'), None, "quoted words 'a piece of broiled fish' are not in Luke 24:40–41"),
    ("reference that does not exist", swap("(Leviticus 5:11)", "(Leviticus 5:99)"), None, "does not resolve in the Berean: Leviticus 5:99"),
    ("outside link", swap("(/apologetics/study/cross)", "(https://example.com/cross)"), None, "only links to this site"),
    ("protocol-relative outside link", swap("(/apologetics/study/cross)", "(//example.com/cross)"), None, "only links to this site"),
    ("a line the page cannot place", real.replace("## 01 One sacrifice", "Stray line before the parts.\n\n## 01 One sacrifice", 1), None, "does not know how to place"),
    ("a picture's limit not in the study", real, ("PICTURES", 1, "stops", "Mark names the one who was paid."), "is not, word for word, in part 02"),
    ("a witness not in the verse", real, ("WITNESSES", "paul", 3, "who", "Jude"), "'Jude' is not in 1 Corinthians 15:7"),
    ("a study link to a missing mock-up", real, ("STUDY_LINKS", "Knowing God", "/mockups/knowing-god-directions/"), "not on this PC"),
    ("a fact the verse contradicts", real, ("FACTS", 3, "not_in", [("Mark 10:35–45", "ransom")]), "should not be in Mark 10:35–45"),
]
saved = {k: copy.deepcopy(getattr(bd.lists, k)) for k in ("PICTURES", "WITNESSES", "STUDY_LINKS", "FACTS")}
failures = 0
for name, text, patch, expected in cases:
    for k, v in saved.items(): setattr(bd.lists, k, copy.deepcopy(v))
    if patch:
        target = getattr(bd.lists, patch[0])
        *path, key, value = patch[1:]
        for p in path: target = target[p]
        target[key] = value
    bd.CONTENT = Fake(text)
    try:
        bd.build(); result = "NOT REFUSED"
    except bd.BuildError as error:
        result = "refused as expected" if expected in str(error) else f"refused for another reason: {error}"
    failures += result != "refused as expected"
    print(f"{name}: {result}")
bd.CONTENT = Fake(real)
for k, v in saved.items(): setattr(bd.lists, k, v)
bd.build()
print("unchanged input still builds; data.js untouched:", (HERE / "data.js").read_bytes() == before)
sys.exit(1 if failures else 0)
