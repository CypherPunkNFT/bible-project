# Bible word counter

`/word-counter`, on the tools hub as **Bible word counter** (Study and reference). How many times a word or phrase
appears in the Berean Standard Bible, for the whole Bible and book by book, with every verse it is in, the matches
marked and each reference opening the reader at that verse. Built for sequence 41, step 4 (2026-11-09); the idea is
in `BibleProject/PROPOSED-IDEAS.md`.

## How it works

- **No server, no AI, nothing stored.** The first count reads every book of the BSB from the site's own plain-text
  files (`data/plain/bsb/<BOOK>.json`, the ones the search page reads, about 4 MB before compression), once per visit;
  the counting is done in the browser. The search lives only in the address (`?q=love&starts=1&case=1`), so a count can
  be shared or bookmarked.
- **Counting rules** ([count.ts](count.ts)): whole words, capitals ignored. `starts` also counts longer words that
  begin with it (love: loved, lovely); `case` makes capitals matter (LORD apart from Lord). A straight apostrophe
  matches the Bible's curly one; "God" counts "God’s" but "don" does not count "don’t". The words of a phrase must come
  in order with only spaces, commas, colons, dashes or quotation marks between them, never a full stop. Matches never
  overlap; a verse with it twice counts twice in Times and once in Verses.
- **Books that fail to load** are named on the page and left out of the counts, with a Try again button; they are
  never counted as "none".

| File | What is in it |
|---|---|
| [WordCounterPage.tsx](WordCounterPage.tsx) | The page: form, examples, loading, summary, notes. |
| [count.ts](count.ts) | The search pattern and the sums (pure, tested on the real Bible files). |
| [load.ts](load.ts) | Reading the BSB's books. |
| [BookBreakdown.tsx](BookBreakdown.tsx) | All the books with a bar each, Bible order or most first; a book filters the verses. |
| [VerseList.tsx](VerseList.tsx) | Every verse, drawn a window at a time (`useRowWindow`: the rows on screen and 50 above and below). |
| [art.tsx](art.tsx) | Its picture on the tools hub (an open Bible, a magnifying glass, tally marks), in the prophets colour. |
| [word-counter.css](word-counter.css) | Its styles (`wc-` classes). |

## Translation

The page's words are plain text in the page code, so the translation collector (`content/translation/extract.py
--pages`) picks them up; the one-word statistic label "Times" is registered in `content/translation/page-register.json`.
The verses and the example searches stay English (`translate="no"`): the counts are of the English BSB.

## Checks

`npm test` runs [count.test.ts](count.test.ts) (the rules, and counts on the real BSB files: "Jesus wept" once, in
John 11:35; no "God" in Esther), [WordCounterPage.test.tsx](WordCounterPage.test.tsx) (shared links, the form and the
address, the book breakdown and its filter, examples, not found, a long list drawn a window at a time, the registry
entry) and [WordCounterPage.offline.test.tsx](WordCounterPage.offline.test.tsx) (books that fail to load, and Try
again), with [test-kit.tsx](test-kit.tsx).
