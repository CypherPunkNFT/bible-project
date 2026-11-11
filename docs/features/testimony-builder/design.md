# Testimony builder: design

Orchestrator job d5fbf59039244159ab3cf4ec8328e444 (2026-11-11). The owner's brief: *a carefully crafted guided form
that helps a person write their personal Christian testimony, then turns their answers into a printable testimony
sheet. Intricate and thoughtful, with helpful guidance text and examples per question. Each answer becomes a headed
section of the finished testimony; the result is a clean, printable sheet with a print view and a way to copy or
download it. Client-side only, drafts in browser storage, no accounts.*

It is a tool, not a game, and it is private: nothing a person writes leaves their browser. It is a different thing
from the site's **Testimonies** page (`/testimonies`), where people publish a testimony on the testimony tree through
the site's service. This tool helps someone *write* theirs; at the end it points to that page for anyone who wants to
share it there. Its questions grew from the owner's own interview questions (`BibleProject/Testimony/INTERVIEW.md`).

## 1. Where it lives

| What | Where |
|---|---|
| Address | `/testimony-builder` (route in `src/App.tsx`, title in `src/lib/page-head.ts`) |
| Code | `src/pages/testimony-builder/`, every file its own, `tb-` CSS classes |
| Tools hub | one entry in `src/pages/tools/registry.ts`: slug `testimony-builder`, live, picture in the tool's own folder (`art.tsx`, `testimony-art.ts`) |
| Category | a new hub category, `witness` ("Your story of faith"): the sharing category already holds seven tools, one per book colour, so the colour test (`tools.test.tsx`) sends an eighth to another category, and no existing one fits a testimony. The category list is in the registry, the same file the entry goes in. The app copies categories with the list (`App/scripts/site_tools_hub.py`), so it needs no code of its own. |
| Storage | `localStorage["bp-testimony-builder"]`, nothing else |

## 2. The questions

Eighteen prompts in five parts. The first fifteen are the testimony itself, each one a headed section of the sheet;
the last three are the sheet's title block. Every prompt is optional: the sheet shows only what was answered. Each
prompt has a short **heading** (the section's title on the sheet), the **question**, **guidance** (why it matters and
what to put in, two to four sentences) and an **example** (a few sentences in an ordinary voice, plainly marked as an
example, never copied into the answer). The texts are data in `questions.ts`, each string under 400 characters so the
translation collector takes it whole.

| # | Part | Heading on the sheet | The question |
|---|---|---|---|
| 1 | Before | Where I began | Where did you grow up, and what was home like? What did you believe about God then? |
| 2 | Before | What I was living for | Before you knew Christ, what were you chasing, leaning on, or hoping would make you whole? |
| 3 | Before | What was missing | Was there a hard season, a habit, a fear or an emptiness that shaped you? |
| 4 | The turning | Who pointed me to Jesus | Who, or what event, helped bring you to Christ? |
| 5 | The turning | The day everything changed | Where were you and what was happening when you were saved? Tell it like a scene. |
| 6 | The turning | What I came to see | What did you come to see about yourself, and about Jesus: your sin, the cross, His grace? |
| 7 | The turning | A passage God used | Was there a verse or passage God used? What did it mean to you right then? |
| 8 | The turning | What I let go of | What did you have to let go of, and what did it cost? |
| 9 | Since then | My life now | What is your life like now? What is different from before? |
| 10 | Since then | How things are changing | How are things still changing in your life? Where are you still growing? |
| 11 | Since then | When God proved faithful | Tell about a time since then when God proved faithful. |
| 12 | Since then | My church family | What does your church family mean to you now? |
| 13 | To the reader | If you are where I was | If someone reading this is where you once were, what would you tell them? |
| 14 | To the reader | A verse to leave you with | Which verse would you leave them with? |
| 15 | To the reader | What the Lord has done for me | In one sentence, what has the Lord done for you? |
| 16 | On the page | (name) | Your name as readers will see it (up to 60 characters). |
| 17 | On the page | (title) | A title for your testimony (up to 120 characters). |
| 18 | On the page | (when) | When did it happen? For example "the summer of 2014" or "at nineteen" (up to 80 characters). |

Each long answer is at most 4,000 characters (about 600 words; a whole testimony of fifteen full answers is still
within what a browser's storage takes). A counter shows what is left once an answer passes 3,500. Questions 7 and 14
ask for a reference and the words in the person's own hand: the page does not look verses up, so no request is made
and the person is free to quote the Bible they read. A note under both reminds them that the site quotes the Berean
Standard Bible, in modern English, and links to the reader to check the wording.

The guidance is one voice throughout: Christ is the hero of the story, not the sin; be honest, be specific, keep the
hard parts to what you are willing for a stranger to read; no church words without saying what they mean; a testimony
read aloud in three to five minutes is about the length of the fifteen answers written short. The Baptist Faith and
Message (article IV, salvation) stands behind the wording about repentance, faith, grace and the new birth; the page
says nothing a Baptist congregation would not.

## 3. The page

Tools-hub design (the games' hero and numbered shelves, `games.css`), like the tithe calculator and the Scripture
memory helper:

1. **Write** (`#write`): the guided form, **one question at a time**, with its part name, its number of eighteen, the
   question, the guidance, the example (in a quiet aside, with "Example" as its heading), the answer box, and Previous
   and Next. Beside the box, a **list of all eighteen questions** grouped by part: each a button that opens it, marked
   when answered, the open one marked current (`aria-current`). The list is the form's progress; a line above it says
   "7 of 18 answered". The answer box is a plain `textarea` that grows with its text. The first question opens by
   default; the page remembers which question was open in the draft so a return lands where the person left off.
2. **Your testimony** (`#sheet`): the finished sheet drawn from the draft: the title (or "My testimony" if none), the
   name and the when-line beneath it, then each answered question as a section with its heading and the answer's
   paragraphs (blank lines split paragraphs; nothing else is interpreted). A footer line names Bible Guide and the
   date the sheet was made. Above it the actions: **Print**, **Copy** (plain text, with the HTML version for a word
   processor where the clipboard takes it, as the citation generator's `CopyCitation` does; a box to copy by hand when
   the clipboard is blocked), **Download as text** (`my-testimony-YYYY-MM-DD.txt`) and **Download as a web page**
   (`my-testimony-YYYY-MM-DD.html`, a self-contained file with its own small stylesheet, so it opens and prints
   anywhere and can be dropped into a word processor). A paper choice (Letter or A4) sits beside Print, defaulting as
   the life-events sheets do (`defaultPaper`). When nothing is answered, the sheet says so and the actions are
   disabled.
3. **Keep your draft** (`#keep`): the draft is saved as the person types (debounced about half a second, and on
   blur), so nothing is lost on a closed tab. **Save a draft file** downloads the draft as JSON
   (`bible-guide-testimony-draft-YYYY-MM-DD.json`, `{ kind: "bible-guide-testimony-draft", v: 1, saved, answers }`),
   **Open a draft file** reads one back (replacing the draft after a confirm when the current one is not empty), and
   **Start over** clears everything (asks first). A sentence says where the draft lives and that nothing is sent.
4. **Writing it well** (`#guide`): the short guide to a good testimony (seven points), how to use it (read aloud,
   give it to a friend to read, a baptism, a small group, a letter), and two links: **Share it on the testimony
   tree** (`/testimonies`), with the tree's limits stated so a person knows what to shorten (a title of 120
   characters, a summary of 600, which this tool's question 15 and the "Before, the turning, since" headings help
   with), and the Bible reader. The privacy paragraph and the Berean credit line close the page.

The hero quotes Mark 5:19 ("Go home to your own people…"), loaded from the Berean at run time through the converter's
`useVerseText` (verse ids only in code, as the build's verse-wording check requires), with a quiet loading line and a
Retry when it fails; the page works without it.

## 4. Storage

`storage.ts`, after the Scripture memory helper's (`src/pages/scripture-memory/storage.ts`):

- `browserStore()` probes `localStorage`; when it is blocked the page works for the visit and says the draft will
  not be kept.
- The record is `{ v: 1, saved: <ISO date>, open: <question id>, answers: { <id>: <text> } }`. Everything read, from
  storage or from a file, is **rebuilt field by field**: unknown ids dropped, non-strings dropped, each text cut to its
  limit, control characters other than newline and tab removed, `open` must be a known id. A record from a newer
  version (`v` > 1) is shown but never written over (a banner says to reload). Nothing from a file is ever copied into
  an object by key: the known ids are walked, not the file's keys.
- Saves re-read the stored record first and write the merged result, so two open tabs do not wipe each other's
  answers (last write per question wins). The `storage` event refreshes the page from another tab's save.
- A failed save (quota, blocked) is said on the page once, with Save a draft file as the way out.
- Import: at most 1 MB, must parse as JSON with that `kind`; a file that is not a draft is refused with a sentence and
  nothing changes. `readFileText` is imported from the Scripture memory helper's `files.ts`, not copied.

## 5. The sheet's text

`sheet.ts` turns a draft into the three outputs from one model, `sheetSections(draft)`: the title block and the
answered sections in question order, paragraphs split on blank lines, every line trimmed, runs of blank lines
collapsed.

- **Plain text**: title, a line with the name and when, a blank line, then each section as its heading in capitals,
  a blank line, the paragraphs, a blank line; the footer line last. Line endings `\n`.
- **HTML**: `<article>` with `<h1>`, a `<p class="by">`, `<section><h2>…</h2><p>…</p></section>` per section, and
  the footer; every text run escaped (`&`, `<`, `>`, `"`). The downloaded web page wraps it in a document with a
  `<style>` of a few rules (serif, 42em measure, print margins) and `<meta charset>`; no script, no external file.
- **On screen and in print**: the same sections drawn by React (`Sheet.tsx`) inside the print portal
  (`src/pages/life-events/PrintPortal.tsx`, `usePrintSheet` from `print-sheet.ts`, imported), with a real page margin
  (`18mm`) because a testimony runs over several pages; headings keep with their first paragraph (`break-after:
  avoid`), sections may break inside. The on-screen preview is the same component outside the portal.

Nothing is ever interpreted as markup: a `<` in an answer prints as `<`.

## 6. Translation

All fixed words are JSX text, attributes, `heading:`/`text:`/`description:` entries or whole template sentences, the
forms `content/translation/extract.py --pages` collects; counts use `plural()` from `src/lib/site-format.ts`
("{n} of 18 answered" is one whole sentence with the count placed by `plural`). A person's own answers are their own
language and are never translated. The verse stays the English Berean in every language.

## 7. Tests

- `questions.test.ts`: eighteen prompts, ids unique and address-safe, every testimony prompt has a heading, a
  question, guidance and an example, every string under 400 characters, limits as designed.
- `sheet.test.ts`: only answered sections, question order, paragraph splitting and trimming, the plain text and HTML
  shapes, HTML escaping of a hostile answer, the default title, file names.
- `storage.test.ts`: rebuild from damaged, hostile and oversized data, unknown ids dropped, newer version shown not
  written, blocked and full storage, the draft file's shape, import refusals.
- `TestimonyBuilderPage.test.tsx`: the first question open with its guidance and example; typing saves (after the
  debounce, with fake timers) and the sheet shows the headed section; Next, Previous and the question list; the
  progress sentence; copy (clipboard mocked, and the hand-copy box when blocked); the two downloads (Blob and anchor
  mocked); Print adds the marker and calls `window.print`; Save and Open a draft file; Start over asks; a blocked
  store's warning; the registry entry is live with a route and sits in its own category.

## 8. What is not done

No account, no sending, no AI. No verse lookup in the answers. No sharing to the testimony tree from here (the tree
has its own form and its own rules); the page only links there. No PDF file: the browser's Print to PDF is the PDF.

## 9. What the three reviews changed (before any code)

Reviewed 2026-11-11 by three agents: security and correctness, reliability and failure modes, and platform and edge
cases. No finding was left open; where this section and the sections above disagree, this section is what was built.

- **The new category is code, not just data** (§1). Widening `Category` in the registry breaks the typecheck until
  `src/pages/tools/art/doors.tsx` gets a `witness` door (tone `acts`, one of the two door colours left; a figure of an
  open hand holding out a letter) and `src/pages/mockup/ToolsMockupPage.tsx` lists it in `DOOR_ORDER` with the short
  title "Your story". The category row in `src/pages/tools/README.md` and the "four categories" line at the top of
  `ToolsPage.tsx` are updated. The tile's tone is `acts` too.
- **Saving never holds the only copy** (§3.3, §4). The latest draft lives in a ref; the debounce only delays the
  write. It is flushed synchronously on `pagehide`, on `visibilitychange` to hidden, when the page unmounts and when
  the open question changes. Every tick retries a failed save; the first failure shows one `role="status"` line with
  Save a draft file inside it, the next success removes it, and while the last save has failed (or storage is blocked)
  and the draft is not empty, `beforeunload` asks before leaving. `navigator.storage.persist()` is asked once, best
  effort. The page says plainly that a browser may clear its storage (Safari after seven days without a visit,
  private windows when they close) and keeps Save a draft file in the Write shelf as well as in Keep.
- **No merge that brings deleted answers back** (§4). A save writes this tab's whole answer set over the stored one;
  there is no per-question merge and no tombstone. Another tab's save (`storage` event) is applied to every answer
  except the one with unsaved local edits, which this tab keeps and then saves; which question is open is **per tab**
  (`sessionStorage`), never read from another tab. `event.key === null` and `newValue === null` (Start over elsewhere)
  are handled: the form empties, the open question stays, and a line says so.
- **A newer record is read-only** (§4). When `v` is newer than this page knows, every field is `readOnly`, Copy,
  Download and Save a draft file still work, and the banner says to reload.
- **The person's words are never translated or interpreted** (§5, §6). Every element holding their text (title block,
  paragraphs) carries `translate="no"` and `dir="auto"`, headings stay outside so they translate. No `lang` on the
  on-screen sheet (the page translator treats `[lang]` as Scripture and would skip the headings). HTML output escapes
  `& < > " '`, turns single newlines into `<br>` after escaping, puts no user text in attributes or the `<title>`, and
  the downloaded page starts its `<head>` with `<meta charset="utf-8">` and a `Content-Security-Policy` of
  `default-src 'none'; style-src 'unsafe-inline'`. On screen, `white-space: pre-line` and `overflow-wrap: anywhere`.
  Copy, text and HTML fixed words go through `phrase()` (`src/lib/phrase-memory.ts`) so a translated site's downloads
  match its screen; `sheetSections(draft, say)` takes the translator as a function so the tests stay pure.
- **Questions 16 to 18 are single-line inputs** (§2, §3.1), `maxLength` 60, 120 and 80 (the testimony tree's own
  limits); the rebuild turns newlines in them into spaces. Question 15 is limited to 600, the tree's summary length,
  so it can be pasted there. "Answered" means trimmed text is not empty, and the same test drives the count, the list
  marks, the sheet and the disabled actions; the actions need at least one of questions 1 to 15 answered. Cuts to a
  limit never split a surrogate pair; the counter counts UTF-16 units like `maxLength`.
- **Focus and the list** (§3.1). Next, Previous and a list button move focus to the question heading (`tabIndex=-1`,
  `scrollIntoView` then `focus({ preventScroll: true })`); nothing moves focus on first load, a `storage` event or
  Open a draft file. On the last question Next reads "Read your testimony" and goes to the sheet. The textarea is
  labelled by the question and described by the guidance and the counter. The list is `<nav aria-label="Questions">`
  with one `<ol>` per part, `aria-current="step"` on the open question and a visually hidden ", answered" in a done
  button's name; the three title-block questions have list labels of their own. "{n} of 18 answered" is plain text.
- **Layout** (§3.1). The tool adds its own `tb-layout`: two columns from 48rem (list sticky at `top: 5.5rem`, under
  the sticky header, with its own scroll), one column below it with the list in a closed `<details>` summarised by
  the progress sentence, and the example in a closed `<details>` on phones. Inputs at `font-size: 1rem`, buttons at
  least 44px tall, the textarea grows with `field-sizing: content` (a `scrollHeight` fallback) between 8 rows and 60vh.
- **Print as the other sheets print** (§3.2, §5). `canPrint()` hides Print in in-app browsers and shows "Open this
  page in your browser to print" with Copy; `useFontsReady` holds Print until the sheet's faces load. `Sheet.tsx` takes
  a heading level (h3 on screen under the shelf's h2, h1 in the portal and the file) and carries no `id`, as it is in
  the DOM twice; a `break-inside: avoid` wrapper keeps each heading with its first paragraph. The portal is always
  mounted so Ctrl+P prints the current text. Download helper and rich copy are the tool's own (`files.ts`): right
  MIME types with `charset=utf-8`, anchor appended and clicked, `revokeObjectURL` after a delay, and the copy-by-hand
  box when `createObjectURL` or the clipboard is missing. "Copied" is announced in a `role="status"` line. File names
  use the local date (`localDate` from the Scripture memory helper's `storage.ts`), never the title.
- **The hero** (§3). The verse is Mark 5:19 (id 41005019) loaded with the converter's `useVerseText`
  (`src/pages/converter/verse.ts`), as the tithe calculator loads its passages: it has the error state and Retry the
  design asks for, which `src/lib/useVerseText.ts` (chapter-only, no error state) does not; it shows the whole verse (code may not cut a verse's words), in a `<blockquote
  className="scripture" lang="en">` with a reader link, inside a block with a reserved `min-height` so the form never
  jumps. The lede is a paragraph of at least 60 characters so the page description (`usePageHead`) never takes a
  person's answer.
- **Strings the collector and the checks accept** (§2, §6). No `;`, `=`, backslash escape or leading punctuation in a
  prompt string; the first character is a word character; curly quotes inside. Examples quote Scripture only inside
  the writer's own sentence, never as a stand-alone verse (the build's verse-wording check). "Question {n} of 18",
  "{n} of 18 answered" and the counter are whole template sentences through `plural()`; the footer date is
  `formatDate(now, { dateStyle: "long" })` worked out when an action is pressed. `questions.test.ts` checks the
  prompts against the collector's rules.
- **Tests** (§7). Fake timers in the debounce tests fake `setTimeout` and `Date` and advance with
  `vi.advanceTimersByTimeAsync` inside `act`; `serveBerean()` (life-events `test-kit.tsx`) serves the hero verse,
  with one test for the failed load; clipboard and `URL.createObjectURL` are stubbed as the citation and memory tests
  do; the sheet is queried `within` its region; a save failure is tested by making `setItem` throw after the first
  render; `pagehide` before the debounce ends must leave the text in storage. The route test stays in
  `tools.test.tsx`. Check command: `npx vitest run src/pages/testimony-builder src/pages/tools`.
- **Also added**: the tool's `README.md` in the house shape; the sitemap entry in
  `scripts/design-review/site-map-rest.ts`; the App side (`App/scripts/site_tools_hub.py` `TOOLS_SOURCES` gains the
  two art files, the registry is re-synced, and the tool's picture is captured for the app's hub).
- **Not taken:** a "Use theirs / Keep mine" dialogue for a cross-tab conflict (this tab's unsaved edit simply wins
  and a line says the other tab changed it); a timed nudge to save a file (a standing sentence does the same);
  `beforeunload` while saves succeed (nothing is at risk); a BOM on the text file (modern editors read UTF-8 without
  it, and a BOM breaks pasting into some forms).
