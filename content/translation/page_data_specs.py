"""The content files stage 5 job 19 gave a collecting rule: the teachers' pages and the other prose no rule read before
(unregistered.py --check fields listed them). Spec tuples as extract.SOURCES writes them: kind, glob, record map, parents
whose keys are ids, plain paths, stanzas, mixed paragraphs. page_data.py adds them to PAGE_DATA.

Each names only the text the site wrote for its readers: labels, notes, lines, questions, reasons. Titles of published
works, people's and places' names, citations, licences and credits stay as published, as in SOURCES; each such field is
ruled out with its reason in unregistered-reviewed.json, and so is every file no rule here reads.

  studydata  merged into ui-study.json, which /study and /teachers pages load (src/lib/page-translator.ts PAGE_FILES)
  peopledata merged into ui-people.json, which /people pages load
  sitedata   merged into ui.json, for pages that load nothing else (Resources, the Bible reader, Apologetics, the
             source directory, the atlas); a text ui.json already has keeps its translation
"""
STUDY_DATA_KIND = "studydata"
SITE_DATA_KIND = "sitedata"

TEACHERS = "src/data/teachers/"
LETTER_FIELDS = {
    ".title", ".tagline", ".intro[].text", ".collection[].text", ".canon[].who", ".canon[].claim.text",
    ".christ.*.title", ".christ.*.topics[].title", ".christ.*.topics[].points[].text", ".flows[].title",
    ".flows[].claim.text", ".groupings[].label", ".groupings[].claim.text", ".hands[].note", ".ladders[].title",
    ".ladders[].claim.text", ".ladders[].steps[].label", ".ladders[].steps[].better", ".ladders[].steps[].note",
    ".letterForm[].part", ".letterForm[].claim.text", ".letterLinks[].label", ".letterLinks[].to",
    ".letterLinks[].claim.text", ".letters[].author.text", ".letters[].date.text", ".letters[].occasion.text",
    ".letters[].recipients.text", ".letters[].writtenFrom.text", ".letters[].keyVerses[].why",
    ".letters[].otQuotes[].note", ".letters[].outline[].title", ".letters[].people[].note", ".letters[].places[].note",
    ".letters[].themes[].text", ".letters[].words[].gloss", ".letters[].words[].note", ".maps[].title",
    ".maps[].claim.text", ".maps[].stops[].note", ".networks[].title", ".networks[].claim.text",
    ".networks[].edges[].label", ".networks[].nodes[].note", ".parallels[].title", ".parallels[].claim.text",
    ".parallels[].pairs[].kind", ".parallels[].pairs[].note", ".questions[].question", ".questions[].views[].label",
    ".questions[].views[].argument.text", ".sharedPeople[].claim.text", ".themes[].title", ".themes[].claim.text",
    ".timelines[].title", ".timelines[].claim.text", ".timelines[].events[].label", ".topicsTop[].title",
    # Who holds each view, in the site's words ("J. B. Mayor (1892), who examines all three theories"), and the labels
    # of people, places and ancient lists: Bible names take each language's Bible form, as the people list's do.
    ".questions[].views[].holders", ".canon[].label", ".letters[].people[].name", ".letters[].places[].name",
    ".maps[].stops[].name", ".networks[].nodes[].label", ".hands[].name", ".sharedPeople[].name", ".letterLinks[].from",
    ".parallels[].right.label"}

STUDY_DATA = [
    # The teachers' pages (/teachers/preachers-and-authors, /teachers/scholars and their drawers).
    (STUDY_DATA_KIND, TEACHERS + "teachers.json", False, ("traditions", "genres", "eras", "rules"), {
        ".labels.traditions.*", ".labels.genres.*", ".labels.eras.*", ".rules.*", ".notListed[].reason",
        ".teachers[].basis.author", ".teachers[].basis.preacher",
        ".teachers[].basis.scholar", ".teachers[].eraBasis", ".teachers[].evidence.locator",
        ".teachers[].cited[].citedOn[].page", ".teachers[].apologetics[].studies[].label"}, set(), set()),
    (STUDY_DATA_KIND, TEACHERS + "scholars.json", False, ("faiths", "fields", "eras"), {
        ".faiths.*", ".fields.*", ".eras.*", ".scholars[].line", ".scholars[].site.note", ".scholars[].writings.label",
        ".finds[].line", ".chain.about", ".chain.steps[][]"}, set(), set()),
    (STUDY_DATA_KIND, TEACHERS + "people.json", False, (), {
        ".people[].line", ".people[].notable[].s", ".links[].note"}, set(), set()),
    # The letters pages (/study/letters/...; browse.json is the letters home's Christ topics and top words): the parts
    # the study chats' batches have not taken already go here.
    *((STUDY_DATA_KIND, f"src/data/letters/{name}", False, ("christ",), LETTER_FIELDS, set(), set())
      for name in ("*-letters.json", "hebrews.json", "overview.json", "browse.json")),
    # The study pages that read data/study/ (study.ts loadStudy): Names of God, the gospel harmony (also on the apostle
    # pages, so it is collected for ui-people.json too, below), the letters list, miracles, prophets.
    (STUDY_DATA_KIND, "data/study/names.json", False, (), {
        ".groups[].label", ".groups[].names[].name", ".groups[].names[].note"}, set(), set()),
    (STUDY_DATA_KIND, "data/study/harmony.json", False, (), {
        ".parts[].title", ".parts[].sections[].title", ".parts[].sections[].items[].title"}, set(), set()),
    (STUDY_DATA_KIND, "data/study/letters.json", False, (), {
        "[].recipients", "[].author", "[].sections[].title"}, set(), set()),
    (STUDY_DATA_KIND, "data/study/miracles.json", False, (), {
        ".christ[].title", ".evil[].title", ".servants[].who", ".servants[].items[].title"}, set(), set()),
    (STUDY_DATA_KIND, "data/study/prophets.json", False, (), {"[].brief", "[].era", "[].king"}, set(), set()),
    # The Names of God page's own list (src/components/names/NamesOfGod.tsx).
    (STUDY_DATA_KIND, "src/data/faith-names.json", False, (), {
        ".entries[].name", ".entries[].note", ".entries[].category", ".entries[].source"}, set(), set()),
    (STUDY_DATA_KIND, "src/data/faith-names-approved.json", False, ("names",), {".names.*"}, set(), set()),
    # The manuscripts pages: when and where each was written, its language and script, and the site's notes on a record
    # it corrects. What the open catalogue says it holds (".records[].c") is quoted as written ("The catalogue says").
    (STUDY_DATA_KIND, "data/manuscripts/collection.json", False, ("images",), {
        ".records[].d", ".records[].la", ".records[].sc", ".records[].dw", ".records[].f", ".records[].why",
        ".records[].bwhy", ".excluded[].why", ".holders[].country"}, set(), set()),
    # Files of content/ the teachers' pages import (unregistered.py bundled_content_files): the discoveries' roles and
    # notes, the site-evidence features and the pages each source is used on, the writings' category labels.
    (STUDY_DATA_KIND, "content/teachers/discovery-evidence.json", False, ("cases",), {
        ".cases.*.date", ".cases.*.role", ".cases.*.context", ".cases.*.site.label", ".cases.*.site.note"}, set(), set()),
    (STUDY_DATA_KIND, "content/teachers/feature-usage.json", False, (), {
        ".features[].label", ".features[].sources[].uses[].page", ".features[].sources[].uses[].consultation"},
     set(), set()),
    (STUDY_DATA_KIND, "content/teachers/writings/index.json", False, (), {"[].categories[]", "[].collection"},
     set(), set()),
    (STUDY_DATA_KIND, "content/teachers/writings/*-*.json", False, (), {
        ".categories[]", ".collection", ".writings[].categories[]"}, set(), set()),
    # /study/long-memory.
    (STUDY_DATA_KIND, "src/data/long-memory/*.json", False, (), {
        ".lenses.memory[].title", ".lenses.moments[].title", ".lenses.words[].title", ".people[].line",
        ".people[].role"}, set(), set()),
]

# The apostle pages (/people/...) show the gospel harmony's section titles too (ApostleSections.tsx, GospelStrip.tsx).
PEOPLE_DATA_KIND = "peopledata"
PEOPLE_DATA = [
    (PEOPLE_DATA_KIND, "data/study/harmony.json", False, (), {
        ".parts[].title", ".parts[].sections[].title", ".parts[].sections[].items[].title"}, set(), set()),
]

# Another chat's game, not committed when its rule was written (2026-11-08): a tree without it skips the rule
# (page_data.data_strings) instead of stopping, as a release tree made before that commit would.
MAP_QUEST_DISPUTED = "src/data/map-quest/disputed.json"
OPTIONAL_DATA = {MAP_QUEST_DISPUTED}

SITE_DATA = [
    # Resources > Learning: the catalogue's own words, and each open workbook's description, ages and conditions.
    (SITE_DATA_KIND, "src/data/resources/learning-catalogue.json", False, (), {
        ".audiences[].name", ".audiences[].age", ".audiences[].how", ".audiences[].line", ".items[].title",
        ".items[].sub", ".items[].builtFrom[].title", ".kinds[].name", ".kinds[].plural", ".series[].name",
        ".series[].line", ".series[].type", ".tracks[].name", ".tracks[].short", ".tracks[].from"}, set(), set()),
    (SITE_DATA_KIND, "src/data/resources/open-workbooks.json", False, (), {
        "[].description", "[].ages", "[].linkOnly", "[].rights.conditions"}, set(), set()),
    # The Bible reader's "who ruled" panel: why a chapter is dated to a reign, and its notes.
    (SITE_DATA_KIND, "src/data/who-ruled/*.json", False, ("rulers", "chapters"), {
        ".rulers.*.name", ".rulers.*.title", ".rulers.*.dates.label", ".chapters.*.rulers[].title[].quote",
        ".chapters.*.rulers[].dated[].note",
        ".chapters.*.rulers[].dated[].why", ".chapters.*.rulers[].title[].note", ".chapters.*.statements[].note",
        ".chapters.*.statements[].why", ".headings[].note", ".none[].note", ".related[].note"}, set(), set()),
    # The Apologetics pages' reading list: what each source is for, and how to read it.
    (SITE_DATA_KIND, "public/content/reading-sources.json", False, (), {"[].role", "[].note"}, set(), set()),
    # The source directory's reading cautions (src/components/sources/SourceCatalogue.tsx); today each is also a reading
    # list note.
    (SITE_DATA_KIND, "public/content/sources/facets.json", False, ("records",), {".records.*.caution"}, set(), set()),
    # What kind of place each is ("river", "body of water"), shown under its name on the atlas and the topic pages
    # (components/atlas/PlacePanel.tsx, VectorAtlasMap.tsx, pages/TopicPage.tsx). The names stay as written.
    (SITE_DATA_KIND, "data/places.json", False, (), {"[].type"}, set(), set()),
    # The Muslim world explorer (Apologetics, Worldviews): each country's name and region, and each people group's
    # religion. The people groups' and languages' names stay as the source records them.
    (SITE_DATA_KIND, "content/missions/muslim-world.json", False, (), {
        ".countries[].name", ".countries[].region", ".countries[].examples[].religion"}, set(), set()),
    # The debate viewer's turn headings ("Transcript heading", "Paul Newby (Moderator)") and its note on where each
    # transcript came from and what it covers; the section titles are page strings already
    # (extract.debate_section_titles), so only what they miss is added.
    (SITE_DATA_KIND, "content/apologetics/transcripts/index.json", True, (), {
        ".*.segments[].speaker", ".*.sections[].title", ".*.provenance", ".*.coverage"}, set(), set()),
    # Map quest's note on each place whose site is disputed (src/pages/games/map-quest/Play.tsx). Its data is bundled
    # with the page so the daily puzzle never waits on a file, so the screen is swapped rather than a copy read. The
    # place and site names stay as written, as on the atlas.
    (SITE_DATA_KIND, MAP_QUEST_DISPUTED, False, (), {"[].note"}, set(), set()),
]


def teacher_genres(site) -> list[str]:
    """The kinds of work the teachers' pages print as they are: the catalogue's genre keys (labels.genres in
    teachers.json, and each teacher profile's works), as the work page shows them ("systematic-theology") and as the
    profile's work list does ("systematic theology", ProfileWorks.tsx)."""
    import json
    genres = dict.fromkeys(json.loads((site / TEACHERS / "teachers.json").read_text("utf-8"))["labels"]["genres"])
    for path in sorted((site / "public/content/teacher-profiles").glob("*.json")):
        genres.update(dict.fromkeys(work["genre"] for work in json.loads(path.read_text("utf-8"))
                                    if isinstance(work, dict) and isinstance(work.get("genre"), str)))
    return list(dict.fromkeys(form for genre in genres for form in (genre, genre.replace("-", " "))))
