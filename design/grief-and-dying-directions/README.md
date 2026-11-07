# Grief and dying: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as step 24 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site, no card in the gallery yet (the run's last step adds it)
Open: http://127.0.0.1:8931/mockups/grief-and-dying-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/grief-and-dying/content.md) · Design: [design.md](../../content/studies/christian-life/grief-and-dying/design.md) · Limits and sources: [passage-notes.md](../../content/studies/christian-life/grief-and-dying/passage-notes.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 57, a Scripture & Theology study in Living the Christian Life. Its one habit: **before you ask what a grief passage explains, ask who is weeping, and to whom.** The study has no working.md; the page was made from content.md and passage-notes.md.

The page draws that habit before it teaches anything. In part 00, every mourner in the study (Abraham, Joseph, David, Jerusalem, the poet, the dying man) is joined by one fine line to the one their words go to: the one who died, the people standing by, or the Lord. Then five parts each pass through a figure made from their own passage. Part 01 has the days of mourning in Genesis. Part 02 has the Song of the Bow with its refrain lit, and David's cry with each "my son" marked. Part 03 is all 154 verses of Lamentations, showing that the hope stands in the middle of the book. Part 04 has the two men beside Jesus and the comma in Luke 23:43. Part 05 traces the Bible's words for now and then. After that come three questions readers bring beside a grave, and a close with Lamentations 3:19–33 printed in full. The full design is in [design.md](../../content/studies/christian-life/grief-and-dying/design.md).

## How it is built

[build-data.py](build-data.py) takes the study's content.md and [study_lists.py](study_lists.py), checks them against the site's Berean text and the outside sources held on this PC, and writes [data.js](data.js). It uses [scripture_text.py](scripture_text.py), a byte-for-byte copy of The good news mock-up's reader, plus [held.py](held.py), which reads the held confessions, and [figures.py](figures.py), which builds and proves each part's figure. Run it from the Website folder: `python design/grief-and-dying-directions/build-data.py`. Add `--check` to run every check and fail if data.js is stale, or `--selftest` to try the wrong inputs below. data.js is written to a temporary file first and moved into place, so a failed build never leaves half a file. It carries a fingerprint of content.md and of every .py file here, which is how `--check` knows when it is stale.

The page is [index.html](index.html), [js/gr.js](js/gr.js) (the page, its questions and the verse sheet), [js/figures.js](js/figures.js) (the six figures), [js/art.js](js/art.js) (the drawings) and [css/gr.css](css/gr.css). Like the earlier mock-ups, it borrows the frame from the Authors and Manuscripts mock-ups. Nothing under `src/` or `dist/` was touched. Neither were catalog.json, progress.json, MASTER-LIST.md or STUDIES.md.

One direction was built, because the text already existed.

## What the checks prove, and what they do not

- **By script on every build:**
  - Every non-blank line of content.md is placed on the page.
  - Every block quotation is word for word the Berean at its reference. One prints only the spoken words, without the verse's opening frame "Jesus said to her," (John 11:25–26), and the build proves the frame is exactly that.
  - Every reference exists, chapter and verse.
  - A quotation followed by its own reference, even later in the same sentence, is in that exact verse. Any other quotation is in a verse its paragraph cites or a passage the page prints there.
  - Links go only to this site.
  - The figures are proved too:
    - Each of the 11 voices in 00 is in its verse, word for word.
    - The sentence that reads that picture is checked against the voices: no Genesis or 2 Samuel voice goes to the Lord, and Lamentations and Luke each have one that does.
    - The forty, seventy and seven days are in their verses. Genesis 23:2–3 is proved to give no number of days.
    - The refrain "How the mighty have fallen" is found by script in exactly 2 Samuel 1:19, 25 and 27, as the study says, and the "my son"s in 2 Samuel 18:33 are counted.
    - The 154 verses of Lamentations are counted, and the hope of 3:21–24 is proved to contain the book's middle verse.
    - The moved-comma reading of Luke 23:43 is proved to have the Berean's words in the same order, differing only in punctuation. "Truly I tell you, today" is proved to occur in Luke only at 23:43.
    - Each "now and then" phrase is in its verse.
- **Quotations from outside Scripture:**
  - Eight are checked by script against copies held on this PC:
    - Five from the Baptist Faith and Message 2000, each searched only in the article it is credited to (articles III, IV, V, X and XV).
    - Three from the 1677 Second London Baptist Confession, each searched only in its chapter (10 and 31), with the confession's printed proof-text references removed before matching. This is the Text Creation Partnership's transcription, held in the teacher library.
  - Three are **not** checked: the Catechism of the Catholic Church, paragraphs 1030 and 2283. The Catechism is not held on this PC, so the page marks those quotations "not held on this PC". Compare them by eye before release.
- **Words in quotation marks that are not quotations** are on short named lists, each entry with its reason. The build fails if an entry is never used. These are:
  - the study's own terms ("seven" for shiva, "How" for Eikhah, "the art of dying");
  - two titles;
  - the word "selfish" as something people say of the dead;
  - "call to mind", the study's echo of Lamentations 3:21, where the Berean has "I call this to mind".
- **One misquotation in the study is kept, not hidden.** In part 05 the study quotes Philippians 1:23 as "to be with Christ, which is far better indeed"; the Berean has "to depart and be with Christ, which is far better indeed". A design job may not change the study's words, so the page keeps them and shows the Berean's wording beside them. The build proves the study's words are not in the verse and the Berean's are. **The study's text needs correcting before release.**
- **One named exception:** the study's "no one to comfort" is credited to five verses of Lamentations 1, and is in four of them. Lamentations 1:16 reads "no one nearby to comfort me". The exception is listed by name; the build fails if it is no longer needed.
- **Refused on purpose:** twenty-two wrong inputs, tried in memory without writing data.js (`--selftest`), were all refused, each for its own stated reason:
  1. a changed word in a block quotation;
  2. a block quotation under the wrong reference;
  3. a changed word in a quoted phrase;
  4. a quotation cited to the wrong verse;
  5. a reference that does not exist;
  6. a chapter that does not exist;
  7. a link that leaves the site;
  8. a link starting "//", which also leaves the site;
  9. a line the page cannot place;
  10. an italic word that is neither a named study nor a known term;
  11. a question's opening line not in its passage;
  12. a confession quotation searched in the wrong chapter;
  13. a quotation credited to five verses with its named exception removed;
  14. an own-term entry the text does not use;
  15. a misquotation entry that would hide a real match;
  16. a voice whose words are not in its verse;
  17. a voice that would make the picture's sentence false;
  18. the refrain credited to the wrong verses;
  19. a count of days under the wrong verse;
  20. the moved-comma reading changed in the lists but not the text;
  21. the moved-comma reading with a changed word, in both places;
  22. the hope said to stand at the middle of Lamentations when it does not.
- **By browser against the always-on preview:**
  - Tested at 1440, 390 and 320 wide, light and dark. Nothing goes past the right edge at any width, and there are no console errors.
  - The screenshots were looked at.
  - A verse link opens the verse in a sheet and puts it in the address. Escape or the close button shuts it and returns focus to the link. An address carrying a verse opens its sheet; one carrying an unknown verse does not.
  - By keyboard alone:
    - the three questions switch, and the open one is kept in the address;
    - the comma switch moves the comma;
    - a voice line in 00 opens its verse, and focus returns to it.
  - No element on the page shows a focus outline.
- **Not tested:** the reduced-motion version was checked by reading the stylesheet, not by turning the setting on. Also untested: 200% zoom, a screen reader and a real phone. Colour contrast was not measured.

## Could be confused with

**The good news** ([the-good-news-directions](../the-good-news-directions/README.md)) shares this page's build lineage, its reader and its verse sheet, so the two behave alike. They do not look alike. The good news is a ledger of seven verses and one road running down the page, in its own colour. Grief and dying is a map of voices and where they go, then five figures each made from its own passage, in History orange with the boundary field at Machpelah as its drawing. No other study in Living the Christian Life uses History orange.

## Links in the study

**content.md was not changed.** It has 17 "[check …]" notes. Sixteen are about wording, crisis numbers and sources, so they stay as written and show on the page as the study's own marks. The seventeenth asks to "link the suicide-bereavement entry once it is added". No such entry exists yet in the site's Help for life list ([life.json](../../src/data/resources/life.json) has bereavement services, but none for those bereaved by suicide), so there was nothing to link and the note stays. Every crisis number still carries its "check before publishing" mark. The ten studies the text names in italics link to their mock-ups. All ten exist on this PC as of this build. That includes *Chosen and kept: can I be sure?*, which a sister job in this run is building. The build warns if any of them loses its index.html.
