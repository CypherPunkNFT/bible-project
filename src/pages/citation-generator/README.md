# Bible citation generator

`/citation-generator`, on the tools hub as **Bible citation generator** (Study and reference). Type a Bible reference,
pick the version and the style, and copy each line: MLA, APA, Chicago, Turabian or SBL, for any of the versions the
site serves (all 160 in `data/catalog.json`). Built for sequence 41, step 6 (2026-11-09); the idea is in
`BibleProject/PROPOSED-IDEAS.md`.

## How it works

- **No server, no AI, nothing stored.** Everything is worked out in the browser from the site's catalogue (the
  versions' names, short names, years, books and chapters). The reference, version and style sit in the address
  (`?ref=John+3%3A16&v=bsb&style=mla`) so a citation can be shared; a printed Bible's publisher, city and year stay on
  the page only.
- **Reading a reference** ([parse.ts](parse.ts)): full names, the three styles' abbreviations and common short forms
  ("Jn", "1Cor", "I John", "Song of Songs", "Qoh"); a short name that fits several books ("Ez", "Ph") is refused with
  the candidates named. `;` starts a new chapter, `,` goes on in the same one (`1 Cor 13:4-7, 13`, `Ps 23; 91:1-4`);
  ranges may cross chapters (`Gen 1:1-2:3`); hyphens, dashes and "to" all make a range. In a one-chapter book every
  number is a verse (`Jude 3` = `Jude 1:3`). Psalm 151 goes to its own book in the versions that have it. The book and
  chapter are checked against the chosen version; verses are not (the catalogue has no verse counts), and a version
  numbered other than the English way gets a warning.
- **The styles** ([styles.ts](styles.ts), book names in [abbreviations.ts](abbreviations.ts)):

| Style | Lines | Book names, joins, ranges |
|---|---|---|
| MLA 9 | Works Cited (`*Berean Standard Bible*. 2023. *Bible Guide*, bibleguide.io/read. Accessed 9 Nov. 2026.`), first in-text `(*Berean Standard Bible*, John 3.16)`, later `(John 3.16)` | appendix 1 abbreviations (`Gen.`, `1 Kgs.`, `Song of Sg.`), `3.16`, hyphen |
| APA 7 | Reference (`*Berean Standard Bible*. (2023). Bible Guide. https://bibleguide.io/read`), in-text every time `(*Berean Standard Bible*, 2023, John 3:16)` | full names (`Psalm 23`, `Psalms 23; 91`), `3:16`, en dash |
| Chicago | First note `John 3:16 (BSB).`, later notes `John 3:16.`, author-date `(John 3:16 BSB)`, bibliography (marked usually left out) | traditional (`Gen.`, `1 Kings`, `Pss.`), `3:16`, en dash |
| Turabian 9 | as Chicago, the first note spelling out the version `(Berean Standard Bible)` | as Chicago |
| SBL 2 | Said once: `Unless otherwise noted, Scripture quotations are from the Berean Standard Bible (BSB).`, note `John 3:16.`, in-text `(John 3:16)`, beside another version `(John 3:16 BSB)` | SBL (`Gen`, `1 Kgs`, `Phlm`, `Pss`), `3:16`, en dash |

- **Versions.** The year is the catalogue's (shown on the Versions page). A version dated before 1950 is an older
  work republished on the site: APA gives `(n.d.)` and `(Original work published 1611)`, and `1611/n.d.` in the text.
  Only English versions use their short name (BSB, KJV); any other is named in full by its own title, without the
  site's "(Spanish)" label, and APA adds `[Spanish Bible]`. Book names stay English in every version: these are
  English-language styles. A printed Bible's details replace the site (MLA and APA take publisher and year; Chicago
  and Turabian also the city).
- **Copying** ([CopyCitation.tsx](CopyCitation.tsx)): with the italics as HTML where the browser allows, else plain
  text, else a box to copy by hand. "Copy all" copies every line of the style.

Sources checked for the forms: MLA Style Center and the MLA Handbook's Bible appendix; APA Style's religious works
pages; The Chicago Manual of Style (notes and parenthetical citations of Scripture, traditional abbreviations);
Turabian's notes example; The SBL Handbook of Style, 2nd ed., 8.3 (plan review, 2026-11-09).

| File | What is in it |
|---|---|
| [CitationPage.tsx](CitationPage.tsx) | The page: form, version list by language, style choice, printed-Bible details, the lines, notes. |
| [parse.ts](parse.ts) | Reading a reference and checking it against the version (pure, tested on the real catalogue). |
| [styles.ts](styles.ts) | The five styles' lines, as runs of plain and italic text. |
| [abbreviations.ts](abbreviations.ts) | The styles' book abbreviations, MLA's months, APA's original-date phrase, typed short names. English on purpose. |
| [CopyCitation.tsx](CopyCitation.tsx) | The Copy button. |
| [art.tsx](art.tsx) | Its picture on the tools hub (a Bible, a written page with a footnote, a pen), in the epistles colour. |
| [citation-generator.css](citation-generator.css) | Its styles (`cg-` classes). |

## Translation

The page's words (headings, labels, notes, error messages, the lines' names) are plain text in the page code, so the
translation collector (`content/translation/extract.py --pages`) picks them up. The citations themselves stay English
(`translate="no"`); [abbreviations.ts](abbreviations.ts) is ruled English on purpose in
`content/translation/unregistered-reviewed.json` (check `code-files`).

## Checks

`npm test` runs [parse.test.ts](parse.test.ts) (names, ranges, lists, one-chapter books, Psalm 151, the version's
books and chapters, errors), [styles.test.ts](styles.test.ts) (each style's exact lines, older and non-English
versions, printed Bibles, every version the site serves) and [CitationPage.test.tsx](CitationPage.test.tsx) (the
page, the address, every version offered, errors, the numbering warning, printed details kept off the address,
copying and its fallback, the registry entry).
