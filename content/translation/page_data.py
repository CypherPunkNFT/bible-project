"""Text the pages show from data bundled with their code, collected for the phrase lists (stage 5, job 12).

The page translator swaps it on screen, like page text, but it goes into the phrase list of the pages that show it
rather than ui.json, which every page waits for before its first paint:
  peopledata  the Moses page's own text (src/components/moses-page/data/, drawn inside its shadow root, which it hands
              to the translator); apply.py merges it into ui-people.json, which /people pages load
  studydata   the circles explorer (its template.html and the labels of public/circles/catalogue.json, inside its shadow
              root), the old maps page's labels (src/pages/places/old-maps-collection/data.js, at /study/atlas/old-maps)
              and the people list's names (data/study/people.json); apply.py merges it into ui-study.json, which
              /study and /teachers pages load

The bundled files themselves are never rewritten: their code looks things up by the English (the Moses map's sides, the
merged chapters' keys). Only the screen is swapped. Scripture quotations are left out, as everywhere: a record quoting a
verse holds no text of its own. Citations (authors, works, pages) stay as published.

`extract.py --page-data` appends the new texts; texts any page, study or people chunk already holds are left out, so
nothing is translated twice (most of the Moses text is already in ui-people.json).
"""
import html
import json
import re
from pathlib import Path

from page_rules import jsx_prose, strings_in, translatable

PEOPLE_DATA_KIND = "peopledata"
STUDY_DATA_KIND = "studydata"
KINDS = (PEOPLE_DATA_KIND, STUDY_DATA_KIND)
# The chunk kinds whose texts reach the same phrase lists: a text one of them holds is not collected again.
HELD_KINDS = ("page", "studytext", "peopletext", PEOPLE_DATA_KIND, STUDY_DATA_KIND)

MOSES = "src/components/moses-page/data/"
OLD_MAPS = "src/pages/places/old-maps-collection/data.js"
# Spec tuples as extract.SOURCES writes them: kind, glob, record map, parents whose keys are ids, plain paths, stanzas,
# mixed paragraphs.
PAGE_DATA = [
    (PEOPLE_DATA_KIND, MOSES + "moses.json", False, ("nation",), {
        ".person.prophetTitle", ".person.leaderTagline", ".person.prophetTagline", ".forties[].name", ".family[].name",
        ".family[].role", ".companions[].name", ".companions[].claim.text", ".companions[].note", ".opponents[].name",
        ".opponents[].claim.text", ".opponents[].power", ".prophetsWith[].claim.text", ".scenes[].title",
        ".scenes[].placeName", ".scenes[].lines[].text", ".scenes[].more[].text", ".scenes[].more[].theme",
        ".scenes[].tradition[].text", ".scenes[].tradition[].when", ".plagues[].word", ".word.call[].label",
        ".word.call[].claim.text", ".word.how[].text", ".word.message[].theme", ".word.message[].claim.text",
        ".word.words[].to", ".word.words[].claim.text", ".word.signs[].label", ".word.signs[].claim.text",
        ".word.fulfilment[].word.text", ".word.fulfilment[].reported.text", ".word.speaking[].theme",
        ".word.speaking[].text", ".leader.scriptureSays[].text", ".leader.accession[].text", ".leader.events[].label",
        ".leader.events[].claim.text", ".leader.nation.*[].text", ".leader.worldStage[].power",
        ".leader.worldStage[].rulers[].name", ".leader.worldStage[].claim.text", ".leader.verdictNotes[].text",
        ".leader.dates[].label", ".leader.dates[].note", ".leader.outside[].name", ".leader.outside[].date",
        ".leader.outside[].claim.text", ".leader.twoAccounts[].topic", ".leader.twoAccounts[].first.text",
        ".leader.twoAccounts[].second.text", ".ending.scripture[].text", ".ending.tradition[].text",
        ".ending.tradition[].when", ".questions[].question", ".questions[].views[].label",
        ".questions[].views[].argument.text", ".notSaid[]", ".map.route[].name", ".map.markers[].name",
        ".map.labels[].name", ".map.key"}, set(), set()),
    (PEOPLE_DATA_KIND, MOSES + "merged.json", False, ("questionTitles",), {
        ".chapters[].title", ".chapters[].years", ".chapters[].road", ".chapters[].timeline[].title",
        ".people.rings[].label", ".people.groups[].label", ".people.nodes[].label", ".people.nodes[].role",
        ".people.nodes[].claims[].text", ".people.nodes[].note", ".people.nodes[].verses[].basis",
        ".atlas.stretches[].label", ".atlas.stretches[].years", ".atlas.stretches[].line", ".questionTitles.*"},
     set(), set()),
    (STUDY_DATA_KIND, "public/circles/catalogue.json", False, ("leaderWorks",), {
        ".categories[].label", ".categories[].tag", ".studies[].label", ".studies[].works[].kind", ".leaders[].kind",
        ".leaders[].line", ".works[].records[].uses[].page"}, set(), set()),
    # The old maps page: its subjects, the modern map's places and waters, and how sure a date is. Map titles, makers,
    # libraries, credits and licences stay as published (catalogue metadata); a script, read by read_data below.
    (STUDY_DATA_KIND, OLD_MAPS, False, (), {
        ".subjects[].label", ".subjects[].short", ".lands[].label", ".levant.places[].n", ".levant.waters[].n",
        ".lands[].outline.places[].n", ".lands[].outline.waters[].n", ".maps[].yc"}, set(), set()),
    # The people list's names ("Also called" too): already in the study phrase lists, so this adds only new people.
    (STUDY_DATA_KIND, "data/study/people.json", False, (), {"[].n", "[].o[]"}, set(), set()),
]
# Page HTML a page fills a shadow root with: its text between tags and its label attributes, entities decoded.
PAGE_HTML = ["src/pages/study/circles/template.html"]
# A Moses label is shown whole in one place and split at " · " in another (word-topics.js scriptureHeading shows
# "Exodus 3 · The bush at Horeb" as its reference, then its title), so each piece after the first is collected too.
BETWEEN_TAGS = re.compile(r">([^<>]+)<")


def html_strings(source: str) -> list[str]:
    """The text a page HTML file shows: between tags, and in its attributes (aria-label, title, placeholder, alt), which
    the JSX rules take as quoted text."""
    found = strings_in(source, ".jsx")
    found += [text for text in BETWEEN_TAGS.findall(source) if jsx_prose(html.unescape(text).strip())]
    texts = (" ".join(html.unescape(text).split()) for text in found)
    return list(dict.fromkeys(text for text in texts if translatable(text)))


def read_data(path: Path):
    """A data file's value: JSON, or a generated script that sets one global to it (`window.OLDMAPS = {...};`)."""
    text = path.read_text("utf-8")
    if path.suffix != ".js":
        return json.loads(text)
    start = re.search(r"^window\.\w+ = ", text, re.MULTILINE)
    if not start:
        raise SystemExit(f"page_data.py: {path} does not set a global to its data (window.NAME = ...); update read_data")
    value, end = json.JSONDecoder().raw_decode(text, start.end())
    if text[end:].strip() != ";":
        raise SystemExit(f"page_data.py: {path} holds more than one value; expected only `window.NAME = {{...}};`")
    return value


def data_strings(site: Path, walk) -> dict[str, list[str]]:
    """kind -> the texts its bundled files show, each once, in file order. `walk` is extract.walk."""
    found: dict[str, dict[str, None]] = {kind: {} for kind in KINDS}
    for spec in PAGE_DATA:
        files = sorted(site.glob(spec[1]))
        if not files:
            raise SystemExit(f"page_data.py: no files match {spec[1]}; the page's data moved, update PAGE_DATA")
        texts = found[spec[0]]
        for path in files:
            walk(read_data(path), "", spec, lambda text: texts.setdefault(text))
    for relative in PAGE_HTML:
        found[STUDY_DATA_KIND].update(dict.fromkeys(html_strings((site / relative).read_text("utf-8"))))
    moses = found[PEOPLE_DATA_KIND]
    for text in list(moses):
        if " · " in text:
            moses.update(dict.fromkeys(piece for piece in text.split(" · ")[1:] if translatable(piece)))
    return {kind: list(texts) for kind, texts in found.items()}
