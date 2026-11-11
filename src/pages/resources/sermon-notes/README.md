# Sermon notes sheet (/resources/sermon-notes)

A printable page for following a sermon, in the Resources section (owner's brief, 2026-11-09, orchestrator job 847:
"Resources section, not the Tools page"). The Resources station lists it under its three doorways in a row of
**Printables**, so the owner-approved doorways are unchanged; the phone app's Resources screen has the same row and
opens this page on bibleguide.io.

- **Two sheets.** For adults: date, church, speaker, title, passage, the main point, a notes area that fills the rest of
  the page, other verses, questions to look into, what it shows about God, how I will respond, a prayer. For children:
  name, date, passage, the sermon's name, a large box to draw in, one thing I learned about God, something I can do this
  week, and "Dear God, thank you for".
- **Optional fields.** The sermon's title and passage go on the sheet when typed (at most 80 characters, control and
  direction characters removed, `translate="no"`); empty, they are lines to write on.
- **Paper.** US Letter or A4 (chosen by the browser's language, changeable). One page on either: the sheet is drawn at
  true size, and the notes area or drawing box takes whatever height is left, with extra lines clipped, never run on.
  Ruled lines are borders, not backgrounds, so they print with background graphics off.
- **Printing and PDF.** Print uses the shared print module ([print-sheet.ts](../../life-events/print-sheet.ts),
  [PrintPortal.tsx](../../life-events/PrintPortal.tsx)) unchanged; the browser's own dialog saves a PDF. In-app browsers
  without a print dialog get a line saying to open the page in a browser.
- **Nothing stored.** No form, no address parameters, no storage, no server, no AI. What is typed lives in the page's
  memory until it is left.

Files: [SermonNotesPage.tsx](SermonNotesPage.tsx) (choices, preview, print), [SermonSheet.tsx](SermonSheet.tsx) (the
two sheets), [fields.ts](fields.ts), [sermon-notes.css](sermon-notes.css), tests
[SermonNotesPage.test.tsx](SermonNotesPage.test.tsx); the one-page check in a real browser is
[e2e/sermon-notes-print.spec.ts](../../../../e2e/sermon-notes-print.spec.ts) (run by hand, like the sympathy cards').
Its station row: `Printables` in [ResourcesPage.tsx](../../ResourcesPage.tsx), styled by
[printables.css](../printables.css).
