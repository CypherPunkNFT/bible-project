"""Writes src/pages/mockup/drafts/draft-numbers.json: the values of the {{placeholders}} in the rewritten study drafts.

Four rewritten drafts (Who do you say I am, Encounters with Jesus, The signs and works of Jesus, Rulers and their
choices) write counts as {{meetings}}, {{stormDeed}} and so on, which their design mock-ups fill from their own data.
The draft reader at /study/drafts_mockup/<slug> shows the same words, so it reads them from here. Three mock-ups keep
the words in data.js under "words"; Rulers keeps raw numbers, so its words are made here the way its build-data.py
makes them. Run from Website/:  py -3.12 scripts/build-draft-numbers.py
"""
import json
import re
import sys
from pathlib import Path

WEBSITE = Path(__file__).resolve().parent.parent
DESIGN = WEBSITE / "design"
OUT = WEBSITE / "src" / "pages" / "mockup" / "drafts" / "draft-numbers.json"
WORDED = {"who-do-you-say-that-i-am": "who-do-you-say-that-i-am-directions",
          "encounters-with-jesus": "encounters-with-jesus-directions",
          "the-signs-and-works-of-jesus": "the-signs-and-works-of-jesus-directions"}
NUMBER_WORDS = {2: "two", 3: "three", 6: "six", 8: "eight", 15: "fifteen", 18: "eighteen", 20: "twenty", 39: "thirty-nine"}


def read_data(folder: str) -> dict:
    path = DESIGN / folder / "data.js"
    text = path.read_text(encoding="utf-8")
    match = re.match(r"\s*window\.\w+\s*=\s*", text)
    if not match:
        sys.exit(f"{path}: expected it to start with 'window.<NAME> = ', found {text[:40]!r}")
    return json.loads(text[match.end():].rstrip().rstrip(";"))


def word_of(number: int) -> str:
    if number not in NUMBER_WORDS:
        sys.exit(f"Rulers: no written form for the count {number}; add it to NUMBER_WORDS")
    return NUMBER_WORDS[number]


def rulers_words() -> dict:
    numbers = read_data("rulers-and-their-choices-directions")["numbers"]
    if numbers["longYears"] != 55:
        sys.exit(f"Rulers: the draft writes the longest reign as fifty-five years; the data says {numbers['longYears']}")
    return {"rulers": word_of(numbers["rulersCount"]), "judah": word_of(numbers["judah"]), "tied": word_of(numbers["tiedCount"]),
            "afterJeroboam": word_of(numbers["afterCount"]), "david": word_of(numbers["davidCount"]),
            "davidAs": word_of(numbers["davidAsCount"]), "davidNot": word_of(numbers["davidCount"] - numbers["davidAsCount"]),
            "longest": "fifty-five years", "drawnLong": word_of(numbers["shortCount"]), "right": word_of(numbers["rightCount"]),
            "rightNoted": word_of(numbers["notedCount"]), "rightPlain": word_of(numbers["plainCount"])}


def main() -> None:
    values = {slug: {key: str(value) for key, value in read_data(folder)["words"].items()} for slug, folder in WORDED.items()}
    values["rulers-and-their-choices"] = rulers_words()
    OUT.write_text(json.dumps(values, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {OUT.relative_to(WEBSITE)}: {sum(len(v) for v in values.values())} values for {len(values)} drafts")


if __name__ == "__main__":
    main()
