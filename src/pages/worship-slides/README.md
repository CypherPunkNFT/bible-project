# Worship slide maker

`/worship-slides`, on the tools hub as **Worship slide maker** (Sharing and churches, for churches and pastors). Any
verse or passage of the Berean Standard Bible as clean slides for a service, a small group or a livestream, downloaded
as pictures (PNG, one or all in a zip) or as a PowerPoint file. Built for sequence 41, step 11 (job 862, 2026-11-09);
the idea is in `BibleProject/PROPOSED-IDEAS.md`.

## How it works

- **No server, no AI, no generated pictures, nothing stored.** Every slide is drawn in the browser from fixed templates
  ([templates.ts](templates.ts)). The reference and the choices live only in the address
  (`?ref=Psalm+23&layout=left&theme=dawn&numbers=1`), checked against the lists in templates.ts
  ([options.ts](options.ts)), with only the choices that differ from the defaults written.
- **Reading the reference** reuses the citation generator's reader ([../citation-generator/parse.ts](../citation-generator/parse.ts):
  "Ps 23; 91:1-4", "Gen 1:31-2:3", "Jude 3"), against the Berean's books and chapters. [load.ts](load.ts) then reads
  the chapters one file at a time, cuts each range to the verses the Berean really has (John 3:99 finds nothing, Matthew
  17:21 is left out as the Berean leaves it out), and stops at 250 verses.
- **Slides** ([slides.ts](slides.ts)): one verse per slide, or as many verses as fit the text size's letter budget,
  never mixing two passages of the reference. A verse too long for a slide is cut at a sentence end, else a clause,
  else between words. An optional title slide names the passage ("Psalm 23", "Psalms 23; 91:1–4") over "Berean
  Standard Bible"; each verse slide can carry its reference.
- **Layout** ([layout.ts](layout.ts), pure): the text box for the layout (centred, left under a short line, or a lower
  third band for a livestream), words wrapped with each verse number glued to its first word, the letters shrunk step
  by step until the lines fit. Both the pictures and the PowerPoint file read this one layout.
- **Pictures** ([draw.ts](draw.ts), [export.ts](export.ts)): drawn on a canvas in the site's own typefaces (Literata,
  Archivo), after waiting up to three seconds for them to load; 1920 × 1080 (16:9) or 1440 × 1080 (4:3). One canvas is
  reused for every full-size picture. The see-through background leaves the PNG transparent, to lay over video.
- **PowerPoint** ([pptx.ts](pptx.ts), [zip.ts](zip.ts)): written by hand, no library. The smallest set of Office Open
  XML parts (content types, relationships, presentation, one master, one blank layout, a theme, the slides, document
  properties) in a stored zip. Every verse is a real text box the team can edit, set in Georgia or Arial (fonts every
  computer has) at the layout's size less 8%, with PowerPoint's shrink-to-fit on. All text is XML-escaped.
  Checked on 2026-11-09 with the pptx skill's XSD validator (`.claude/skills/pptx/scripts/office/validate.py`) and
  python-pptx: decks for every background, both shapes and all layouts, including one made in the browser, passed.
- **Previews** ([SlideGrid.tsx](SlideGrid.tsx)) are windowed: 50 rows above and below the visible area
  (`src/lib/row-window.ts`), so Psalm 119's 177 slides never draw at once.

| File | What is in it |
|---|---|
| [WorshipSlidesPage.tsx](WorshipSlidesPage.tsx) | The page: reference box, examples, choices, status, downloads, notes. |
| [Choices.tsx](Choices.tsx) | Layout, font, background, slide shape, verses on a slide, text size, and the three switches. |
| [SlideGrid.tsx](SlideGrid.tsx) | The windowed previews, each with Save picture. |
| [templates.ts](templates.ts) | Every choice: layouts, fonts (site font and PowerPoint font), backgrounds, shapes, sizes. |
| [options.ts](options.ts) | Reading and writing the address. |
| [load.ts](load.ts) | Reading the passage from the Berean files. |
| [slides.ts](slides.ts) | Sharing verses between slides; references and titles (pure). |
| [layout.ts](layout.ts) | Where everything sits on a slide (pure, takes a measure). |
| [draw.ts](draw.ts) | Drawing a laid-out slide on a canvas; the canvas-backed measure. |
| [export.ts](export.ts) | File names, saving a file, one picture, all pictures zipped, waiting for fonts. |
| [pptx.ts](pptx.ts) | The PowerPoint file's parts. |
| [zip.ts](zip.ts) | A stored zip writer with CRC-32. |
| [art.tsx](art.tsx) | Its picture on the tools hub (a projection screen and a projector), in the prophets colour. |
| [worship-slides.css](worship-slides.css) | Its styles (`ws-` classes). |

## Translation

The page's words, the choice labels (under `label`) and the drawing's description are plain text in the page code, so
the translation collector (`content/translation/extract.py --pages`) picks them up. Font family names and the PowerPoint
file's internal shape names are ruled code in `content/translation/unregistered-reviewed.json`. The verses, the
references on the slides and "Berean Standard Bible" stay English: the slides quote the BSB.

## Checks

`npm test` runs [slides.test.ts](slides.test.ts) (references, titles, cutting, sharing verses), [layout.test.ts](layout.test.ts)
(wrapping, shrinking, verse numbers, each layout, 4:3), [pptx.test.ts](pptx.test.ts) (CRC-32, DOS dates, the zip read
back, XML escaping, every part declared and well-formed for each layout, shape and background), [load.test.ts](load.test.ts)
(the Berean files: whole psalm, across chapters, missing verses, the 250 cap, failure; the address; file names) and
[WorshipSlidesPage.test.tsx](WorshipSlidesPage.test.tsx) (arrival, typing, examples, choices in the address, errors,
Try again, the three downloads, the registry entry and route), with [test-kit.tsx](test-kit.tsx).
