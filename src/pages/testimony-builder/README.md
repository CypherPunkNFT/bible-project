# Testimony builder

`/testimony-builder`, on the tools hub as **Testimony builder** (Your story of faith, a category added for it). Eighteen
guided questions, one at a time, each with guidance and an example, help a person write their own story of coming to
Christ; the answers become a clean testimony sheet to print, copy or download. Built for orchestrator job
d5fbf59039244159ab3cf4ec8328e444 (2026-11-11); the design and what its three reviews changed are in
[docs/features/testimony-builder/design.md](../../../docs/features/testimony-builder/design.md).

It is not the **Testimonies** page (`/testimonies`), where people publish a testimony on the testimony tree through the
site's service. This tool is private: nothing a person writes leaves their browser. Its last shelf links to the tree for
anyone who wants to share there, with the tree's limits said plainly. The questions grew from the owner's own interview
questions (`BibleProject/Testimony/INTERVIEW.md`).

## How it works

- **Questions** ([questions.ts](questions.ts)): five parts (Before Christ, The turning, Life since, To the reader, On the
  page). Fifteen story questions, each with the heading its answer gets on the sheet, and three single-line questions
  for the title block (name 60, title 120, when 80 characters, the testimony tree's own limits). Long answers hold up
  to 4,000 characters; the one-sentence answer 600, the tree's summary length. Every prompt is optional: the sheet
  shows only what was answered.
- **Writing** ([QuestionForm.tsx](QuestionForm.tsx), [QuestionList.tsx](QuestionList.tsx)): one question at a time,
  with Previous and Next (the last reads "Read your testimony" and goes to the sheet), and a list of all eighteen
  beside it, marked when answered, the open one the current step. A question opened by a button takes focus at its
  heading; the first on load does not. Which question is open is kept per tab (`sessionStorage`).
- **Saving** ([useDraft.ts](useDraft.ts), [storage.ts](storage.ts)): `localStorage["bp-testimony-builder"]` only,
  `{ v: 1, saved, answers }`, written half a second after typing stops and at once when the tab is hidden, closed or
  left. Everything read is rebuilt field by field under the known ids (control characters out, limits kept, no split
  emoji). Another tab's save is followed, except for the answer being written here, which wins and is then saved. A
  record from a newer version makes the form read-only. A failed save is said once and retried; while the browser
  cannot keep the draft, leaving the page asks first.
- **The sheet** ([sheet.ts](sheet.ts), [SheetView.tsx](SheetView.tsx), [SheetPanel.tsx](SheetPanel.tsx)): the title
  (or "My testimony"), the name and when, then each answered question under its heading, paragraphs split on blank
  lines. Print uses the life-events print portal (`PrintPortal`, `usePrintSheet`, an 18 mm page margin, hidden in
  in-app browsers, held until the fonts load); Copy puts plain text and HTML on the clipboard; Download saves a text
  file or a self-contained web page (no script, a policy that forbids one). Every text run is escaped, the person's
  words carry `translate="no"` and `dir="auto"`, and the fixed words go through the page translator so a translated
  site's files match its screen.
- **The draft as a file** ([KeepPanel.tsx](KeepPanel.tsx), [files.ts](files.ts)), as buttons in the sheet's action row
  next to Download as a web page (owner, 2026-11-11; there is no Keep your draft shelf and the shelves carry no
  numbers): Save a draft (`bible-guide-testimony-draft-YYYY-MM-DD.json`, the answers only), Open a draft (at most 1 MB,
  must be a draft from this page, replaces the draft after asking), Start over (asks first); the plain truth about
  browser storage closes the page under Writing it well.
- **The hero** quotes Mark 5:19 from the Berean (verse id only, loaded through the converter's `useVerseText` with
  its Retry), with a link to the reader.

| File | What is in it |
|---|---|
| [TestimonyBuilderPage.tsx](TestimonyBuilderPage.tsx) | The page: hero and verse, the three shelves (Write your testimony, Download your testimony, Writing it well), which question is open. |
| [questions.ts](questions.ts) | The eighteen prompts and their limits. |
| [lines.ts](lines.ts) | The counted sentences ("Question 7 of 18", "7 of 18 answered", the counter), whole, through `plural()`. |
| [QuestionForm.tsx](QuestionForm.tsx), [QuestionList.tsx](QuestionList.tsx) | The open question and the list of all of them. |
| [useDraft.ts](useDraft.ts), [storage.ts](storage.ts) | The draft in the page and in the browser; draft files. |
| [sheet.ts](sheet.ts), [SheetView.tsx](SheetView.tsx), [SheetPanel.tsx](SheetPanel.tsx) | The finished sheet as text, HTML and on screen or paper, and its actions. |
| [KeepPanel.tsx](KeepPanel.tsx), [files.ts](files.ts), [Guide.tsx](Guide.tsx) | The draft as a file (its buttons and notes); downloads, copying and reading a file; writing it well. |
| [art.tsx](art.tsx), [testimony-art.ts](testimony-art.ts) | Its picture on the tools hub, in the acts colour. |
| [testimony-builder.css](testimony-builder.css) | Its styles (`tb-` classes), on screen and in print. |

## Translation

All its words are JSX text, attributes, `heading:`/`text:`/`title:` entries, plain string literals under 400 characters
or whole template sentences through `plural()`, the forms `content/translation/extract.py --pages` collects
(`questions.test.ts` checks the prompts against the collector's rules). A person's own answers are never translated
(`translate="no"`); the verse stays the English Berean in every language.

## Checks

`npx vitest run src/pages/testimony-builder src/pages/tools` runs [questions.test.ts](questions.test.ts),
[sheet.test.ts](sheet.test.ts) (sections, text, HTML, escaping of hostile text, the downloaded page's guard, the
translator, file names), [storage.test.ts](storage.test.ts) (rebuilding from damaged and hostile data, limits, blocked
and full storage, draft files and their refusals) and [TestimonyBuilderPage.test.tsx](TestimonyBuilderPage.test.tsx)
(the open question, saving after a pause and on pagehide, moving and the list, the sheet, copy, downloads, print,
draft files, start over, another tab's save, a failed save, a blocked store, the verse and its Retry, the registry
entry), with the hub's own tests.
