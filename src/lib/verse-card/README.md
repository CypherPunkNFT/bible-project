# The verse card generator

One plain description of a card in, a picture out. Drawn on the visitor's own device on a `<canvas>`: nothing is
uploaded, stored or paid for. Design: [docs/features/verse-cards/design.md](../../../docs/features/verse-cards/design.md).
The Shareable verse cards pages ([src/pages/verse-cards/](../../pages/verse-cards/README.md)) are its first user;
birthday verses, life events, sympathy, countdowns, prayers and "when you're…" can each adopt it with one small
adapter, without new drawing code.

## Files

| File | What it holds |
|---|---|
| [spec.ts](spec.ts) | `CardSpec` (the description), `cardProblems` (plain sentences, empty when the card is fine), `resolveCard` (the cleaned card with its look and ornament) |
| [looks.ts](looks.ts) | The six built-in designs, `lookProblems` (4.5:1 contrast for every text colour, both ends of a gradient), the fixed book-to-part table for the Book colour design, retired design ids |
| [ornaments.ts](ornaments.ts) | The small line drawings (star, sprig, sun arc) as SVG path strings, drawn here, no downloaded picture |
| [sizes.ts](sizes.ts) | The four sizes, their safe areas and letter sizes |
| [layout.ts](layout.ts) | `layoutCard` and `fitSizes`: pure, measurement passed in, so tests need no browser |
| [draw.ts](draw.ts) | `drawCard`: paints a layout on any canvas context, at any scale |
| [render.ts](render.ts) | `renderCard` (fonts, layout, one reused canvas, PNG) and the `useCardPicture` hook (the full picture made 150 ms after the last change, so Share never waits) |
| [share.ts](share.ts) | `shareText`, `copyText`, and the three ways out: `sharePicture`, `copyPicture`, `savePicture`, each returning a plain outcome |
| [links.ts](links.ts) | The permanent card address `/verse-cards/<key>`: `cardKey`, `refFromKey`, `cardPageUrl`, `keyFromReadPath`, `lookFromQuery` |
| [canvas.ts](canvas.ts) | The canvas, file and font helpers, re-exported from the worship slides where they are generic |

The ready-made share panel (preview, design and size choices, the buttons) is
[src/components/verse-card/CardSharePanel.tsx](../../components/verse-card/CardSharePanel.tsx).

## Using it from another feature

1. **Write an adapter** in your own folder that turns your card into a `CardSpec`:

   ```ts
   export const toCardSpec = (card: MyCard): CardSpec => ({
     passage: { text: card.text, reference: card.reference, book: card.book },
     heading: "Happy birthday",                 // written by the feature, at most 40 characters
     link: `${SITE_ORIGIN}/birthday-verses/${card.date}`,
     look: "paper",
   });
   ```

2. **Drop in the panel**: `<CardSharePanel spec={toCardSpec(card)} allowLine />`. Pass `sizes` or `looks` to offer
   fewer. Or skip the panel and call `renderCard(spec, "square")` and `savePicture` for a single "Save as image" button.
3. **Your own design**: pass a `Look` object (colours as `#rrggbb`, optional ornament id or SVG path) in `spec.look`,
   and test it with `lookProblems(look)` returning `[]`. A look whose id is one of the six built-in ids is refused.

Rules the generator keeps for every feature: the footer "Berean Standard Bible · bibleguide.io" is always drawn; the
link must be on `SITE_ORIGIN`; a verse is never cut or shrunk below readable (a size it does not fit reports
`fits: false`); what a visitor types is drawn on the picture only, never put in a link or the share text.

## Link previews

[scripts/verse-cards/previews.mjs](../../../scripts/verse-cards/previews.mjs) draws the 1200 × 630 preview picture of
each curated verse with this same code in headless Edge, at release, into the release package, with a ready-made
`verse-cards/<key>.html` that names it. The list and the pages are in
[preview-pages.ts](../../../scripts/verse-cards/preview-pages.ts), tested by
[previews.test.ts](../../pages/verse-cards/previews.test.ts). To try it without a release:
`bun scripts/verse-cards/previews.mjs .local/verse-card-previews --quick` (copy `dist/index.html` into that folder
first). On 2026-11-10 it drew the start page's six verses in about 2.5 seconds, 69 to 119 KB each.
Adding it to the release preparation is one line, done at the next release the owner approves.

## Measured

Time to make the full-size PNG of John 3:16 in the Dawn design with a visitor's line (the gradient makes the
heaviest pictures), measured 2026-11-10 in headless Edge on the owner's PC, the middle of three runs after one warm-up.
"Slowed" uses Edge's own CPU slow-down, a stand-in for an older phone; a real phone was not measured.

| Size | Full speed | CPU slowed 4× | CPU slowed 6× | PNG |
|---|---|---|---|---|
| Square 1080 × 1080 | 28 ms | 160 ms | 262 ms | 1.2 MB |
| Portrait 1080 × 1350 | 33 ms | 150 ms | 280 ms | 1.4 MB |
| Story 1080 × 1920 | 39 ms | 189 ms | 357 ms | 1.7 MB |
| Wide 1200 × 630 | 17 ms | 83 ms | 164 ms | 0.8 MB |

Even slowed six times, the picture is ready well under half a second after the last change, before a visitor reaches
the Share button, so `useCardPicture`'s 150 ms wait stands. The Paper design's pictures are much smaller (the six link
previews are 69 to 119 KB).
