# Bible verse cards (`/verse-cards`)

A visitor makes a picture of a verse from the Berean Standard Bible to post or send. Design and decisions:
[docs/features/verse-cards/design.md](../../../docs/features/verse-cards/design.md). The drawing is the shared
generator in [src/lib/verse-card/](../../lib/verse-card/README.md); this folder holds only the two pages.

| File | What it does |
|---|---|
| [VerseCardsPage.tsx](VerseCardsPage.tsx) | The routes: `/verse-cards` (start page) and `/verse-cards/<key>` (card page) |
| [StartPage.tsx](StartPage.tsx) | Type a reference, or choose today's verse or one of the six well-known verses |
| [quick.ts](quick.ts) | The six well-known verses, shared with the link-preview script |
| [reference.ts](reference.ts) | Reads a typed reference ("1 Cor 13:4-7", "jn 3.16") into verses, or says what to type |
| [today.ts](today.ts) | Today's verse from the verse-of-the-day widget's day file, refused unless it is one |
| [CardPage.tsx](CardPage.tsx) | The card, the verse, Read the chapter, Add the verse before / after, and the share panel |
| [load.ts](load.ts) | The passage's Berean words from the chapter's file; a verse the Berean leaves out is "missing" |
| [verse-cards.css](verse-cards.css) | The pages' own styles (the panel's are in `src/components/verse-card/`) |

A card's address is its permanent key, the sympathy feature's passage key: `/verse-cards/john-3-16`, with
`?look=night` when the design is not Paper. Nothing a visitor types ever goes into the address.

Entry points elsewhere on the site: the reader's verse panel ("Make a verse card"), the verse of the day page and the
random verse page ("Make a card of this verse"), and the Tools list.

Tests: [verse-cards.test.tsx](verse-cards.test.tsx) (the pages and the reader's button, with the real catalogue and
chapter files) and [previews.test.ts](previews.test.ts) (the link-preview list and pages).
