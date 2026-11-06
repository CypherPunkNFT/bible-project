# The good news: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-06, in the study-plan chat, on the owner's "go ahead" · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/the-good-news-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/god-and-christian-faith/the-good-news/content.md) · Design: [design.md](../../content/studies/god-and-christian-faith/the-good-news/design.md) · Plan: [StudyPlan.md](../../../Pages/Topics/StudyPlan/StudyPlan.md), study 54 · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study for someone who is not a Christian, or is not sure. Its one new move: **read the gospel as news before advice.** A ledger of seven verses puts what God has done on the left and what it calls for on the right, then six parts run down one thread, like a road home, from who God is to what happens next.

**Built into the site on 2026-11-06** at `/study/the-good-news` ([GoodNewsPage.tsx](../../src/pages/study/good-news/GoodNewsPage.tsx)), after the owner's go-ahead. The home page's fifth start choice, "I'm not a Christian, or I'm not sure", leads there. build-data.py writes the live page's data too ([good-news-data.json](../../src/pages/study/good-news/good-news-data.json)), so one checked build feeds both. Not yet released to the live site.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) (a copy of the A new creation mock-up's reader), takes the study's content.md and [study_lists.py](study_lists.py), checks them against the site's Berean text, and writes [data.js](data.js). Run it from the Website folder: `python design/the-good-news-directions/build-data.py`. Add `--check` to run the checks and fail if data.js is stale. The page is [index.html](index.html), [js/gn.js](js/gn.js), [js/art.js](js/art.js) and [css/gn.css](css/gn.css), with the frame borrowed from the Authors and Manuscripts mock-ups. Nothing under `src/` was touched.

One direction was built, as with the earlier study mock-ups, because the text already existed.

## What the checks prove, and what they do not

- **By script on every build:** every non-blank line of content.md is placed on the page; every block quotation is word for word the Berean at its reference; every reference exists, with no gap in a range; a quotation followed by its own reference is in that exact verse; any other quotation is in a verse its paragraph cites, its section's main readings, or the passage printed just above it; links go only to this site. Each ledger row's two phrases are in their verses, and the open row is proved open ("went in" is not in Luke 15:29–32). The Luke 15 counts (100, 10, 2), each search phrase and each celebration phrase are in their verses. Two stated facts are tested: the hired-servant request is in Luke 15:19 and not in 15:21, and Luke 23:39–49 has no baptism.
- **Refused on purpose:** seven wrong inputs, tried in memory without writing data.js, were all refused: a changed word in a block quotation, a block quotation under the wrong reference, a changed word in a quoted phrase, a quote cited to the wrong verse, a reference that does not exist, an outside link, and a line the page could not place.
- **Not checked by script:** the five phrases from outside Scripture, four from the Baptist Faith and Message 2000 (articles IV, VII and XI) and one from Luther's Small Catechism. Neither is held in full on this PC. They match the published texts as far as this chat knows them; compare by eye before release. Words the study uses as its own terms ("good news", "servant", "All") are on a short named list in study_lists.py.
- **By browser against the always-on preview:** 1440, 1280, 390 and 320 wide; light and dark. Nothing past the right edge at 320, no console errors. A verse link opens the verse in a sheet and puts it in the address; Escape closes it and returns focus to the link.
- **Not tested:** 200% zoom, a screen reader, a real phone. Colour contrast was not measured.

## Links in the study

The draft's open link notes were resolved in content.md: the Trinity article, four apologetics answers (why there is anything, Jesus, the cross, the resurrection), the apologetics page on other beliefs, the home page's map of churches, and Help for life for crisis lines outside the four named countries. The four crisis numbers in the text (988, 024, 800 911 2000, 188) match the checked entries in [life.json](../../src/data/resources/life.json). Named studies with a mock-up on this PC link to it; the rest are named in italics, because they are not pages yet.
