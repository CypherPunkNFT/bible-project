# Navigation: implementation step 6

Implemented 11 October 2026 after authorization to do the next step. The existing study route and original local preview remain in use. Search matching, typography and wider editorial flow remain for their later steps.

## Changes

The URL now retains the selected study, category, search text, Gospel passage and story moment. Returning from the Bible reader, reloading, opening a copied link and using browser Back/Forward therefore restore the reading context. Passage identifiers include book, chapter and verse range, so repeated passages within one Gospel remain distinct.

The parameters are `parable`, `theme`, `q`, `passage` and `moment`, alongside the existing `guide=parables`. For example, `?guide=parables&parable=lamp&theme=field&q=lamp&passage=LUK-11-33-33&moment=2` opens the lamp study's third moment and Luke 11:33 within the kingdom category. Unknown study/category/passage values and invalid moment numbers fall back safely. Search typing replaces the current history entry instead of adding an entry for each keystroke; deliberate selections create history entries. Existing unrelated URL parameters are preserved.

Selecting another study clears its predecessor's passage and moment. Category changes clear the query and select a study in that category when necessary. The matching rules themselves are unchanged. “Choose another story” now focuses the search field and scrolls to the picker; selecting a story focuses its heading and scrolls to the reading. Focus indicators and the scroll offset account for keyboard use and the sticky header.

## Verification

The browser suite covers a fully specified direct URL, reload, Bible-reader return, passage Back/Forward, invalid parameters, reset on study selection and focus transfer in both directions. It runs alongside the existing checks for all 57 studies, 96 Gospel ranges, category layout and overflow at desktop, tablet and phone widths in both themes. Final execution results are recorded in the handoff. No publication; step 7 and later work await separate authorization.
