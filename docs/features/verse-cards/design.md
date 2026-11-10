# Shareable verse cards: research and design

**Feature:** entry 4 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md), "Shareable verse cards: good-looking verse images for social media, each linking back to the site."
**Step:** research and design (step 14 of sequence 32, "Bible Guide chain C"). One review follows in step 15, which corrects this document in place and adds a Review section at the end. Implementation is step 16. Birthday verses (steps 17–19) are the first other feature to reuse the generator.
**Rules followed:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md), the site's [AGENTS.md](../../../AGENTS.md), the [doctrinal foundation](../../../../DOCTRINAL-FOUNDATION.md) (the Berean Standard Bible everywhere) and the sources register [SOURCES.md](../../../SOURCES.md).
**Tools hub entry:** already present as `verse-cards`, "Shareable verse cards", status `coming-soon`, category "Sharing and churches", in [registry.ts](../../../src/pages/tools/registry.ts).
**Date:** 2026-11-10.

## 1. What we are building, in one paragraph

A visitor reading the Bible taps a verse, chooses **Make a verse card**, and gets a good-looking picture of that verse (or a short run of verses) from the Berean Standard Bible, ready to post or send: square for a chat or a feed, portrait for Instagram, tall for a story or a phone background, or wide for X, Facebook and email. They pick one of six designs and, if they want, add one short line of their own ("Praying for you, Sam"). The picture is drawn **on their own phone or computer**: nothing is uploaded, nothing is stored, nothing costs anything to run. Every picture carries the reference, "Berean Standard Bible" and **bibleguide.io**; every message it is shared with carries a permanent link such as `https://bibleguide.io/verse-cards/john-3-16`, which opens a page showing the same card, the verse in its chapter, and a button to make your own. The drawing code is one shared generator that takes a plain description of a card, so birthday verses, life-event cards, sympathy cards, countdown days, prayers and "when you're…" pages can all hand it their own card and get the same quality of picture and the same share buttons. Link-preview pictures (the image a chat app shows under a pasted link) are made ahead of time, by the same drawing code, for the fixed lists of verses the site already curates.

## 2. Research

### 2.1 What other Bible sites and apps do

| Product | How a verse becomes a picture | Backgrounds and styles | How it links back | What we take or avoid |
|---|---|---|---|---|
| [YouVersion Bible App, Verse Images](https://help.youversion.com/l/en/article/x2qwuszjaf-verse-images) | In the reader, select verses, choose **Image**, pick a background, adjust, **Save** or **Share** | Stock photographs or the user's own photo; shape choice; artist-made images for each verse of the day | "bible.com"-style mark on the picture; images also appear in the app's community feed | **Take:** the flow starts in the reader at the selected verse, with one tap. **Avoid:** stock photographs (licence tracking and a large download for each), and a feed of other people's images (needs accounts and moderation). |
| [YouVersion Verse of the Day image](https://help.youversion.com/l/en/article/d8039sdr5a-verse-of-the-day-image-ios) | A ready-made picture for each day's verse, plus "Create Image" | Artist-made | App link | **Take:** "make a card of today's verse" from the verse-of-the-day page (section 7.3). |
| [Bible Loop: Verse Art](https://help.youversion.com/l/en/article/p8gh5ma4mk-verse-art) | Pictures saved to the device; shared from the phone's gallery | Templates | None inside the app | Confirms people share from their gallery: the picture itself must carry the address. |
| Canva and similar design apps | Free-form design from templates | Unlimited | None | Too many choices for a person who just wants to send a verse; we offer six designs and four sizes. |
| Wallpaper apps (e.g. those reviewed by [FaithLock](https://www.getfaithlock.com/resources/best-bible-verse-wallpaper-apps)) | Verse pictures sized for a phone's lock screen | Photographs | None | The tall story size doubles as a phone background (section 4.3); a reviewer counted "square only" as a weakness of YouVersion's images. |

What the good ones share, and this design keeps: start from the verse, very few choices, a picture that looks finished with no effort, and the phone's own share sheet. What Bible Guide adds: a modern translation that is free to print on a picture (the Berean Standard Bible is in the public domain, already registered in [SOURCES.md](../../../SOURCES.md)), a permanent link to the verse in its chapter, and no account, upload or tracking.

### 2.2 Sizes each platform wants (checked 2026-11-10)

| Where it goes | Best size | Notes that shape the layout |
|---|---|---|
| Instagram feed | **1080 × 1350** (4:5) | Still the size that works everywhere, including scheduling apps. Since 2025 the profile grid shows **3:4** tiles and crops a 4:5 post by a thin strip on each side, so the words stay inside a centred 3:4 area ([FeedHive](https://www.feedhive.com/blog/instagram-post-size), [Neal Schaffer](https://nealschaffer.com/instagram-post-size/), [Influencer Marketing Hub](https://influencermarketinghub.com/instagram-image-sizes/)). |
| Instagram, Facebook and WhatsApp stories and status, TikTok, Reels covers, phone backgrounds | **1080 × 1920** (9:16) | The top ~250 px and bottom ~340 px are covered by the app's own bars and reply box; the words stay between them. |
| Facebook feed, WhatsApp and iMessage chats, Instagram square | **1080 × 1080** (1:1) | Shows whole in every feed and chat. The default. |
| X (Twitter), Facebook link-style posts, email, a church slide | **1200 × 630** (1.91:1) | Also the shape of a link preview (2.3), so the same layout serves both. |
| Pinterest | 1000 × 1500 (2:3) | **Not at launch**: a fifth size for a small audience. The layout handles any size, so adding it later is one line (section 4.3). |

### 2.3 Link previews (the picture a chat shows under a pasted link)

- A link preview comes from the page's `og:image` tag, read by the chat app's robot, which does **not** run the page's JavaScript. The tag must be in the HTML the server sends.
- WhatsApp's own rules: the `<head>` must sit in the first 300 KB of the HTML; the picture must be under **600 KB**, at least 300 px wide and no wider than 4:1. Community testing says images over ~300 KB are often skipped, so we aim under 300 KB ([Meta's WhatsApp link-preview docs](https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews/), [OpenGraph.to](https://www.opengraph.to/articles/og-image-too-large)). SVG is not accepted.
- Facebook, LinkedIn and X want 1200 × 630; X needs `twitter:card` `summary_large_image`, already in [index.html](../../../index.html).
- Apps remember a preview **by its address** for weeks. A changed design therefore needs a new file name, which is why the site's own preview script, [og-image.mjs](../../../scripts/og-image.mjs), refuses to overwrite a picture.
- Today every Bible Guide page shares the one site picture (`share-bible-guide-2026-10-23.png`). The ready-made copies of main pages that [shell.ts](../../../scripts/seo/shell.ts) writes for search engines rewrite the title, description and address, **not** `og:image`.

### 2.4 The phone's share sheet with a picture (Web Share)

- `navigator.share({ files })` hands a picture to the phone's share sheet: Instagram, WhatsApp, Messages, Facebook, Save Image. It works in Safari on iPhone, iPad and Mac and in Chrome on Android, and in Chrome and Edge on Windows and ChromeOS. Desktop Firefox has no share sheet at all; Firefox on Android shares text and links but not files. A browser can share text yet refuse files, so file support is checked on its own with `navigator.canShare({ files: [file] })` ([W3C Web Share](https://www.w3.org/TR/2022/WD-web-share-20220607), [MDN](https://mdn2.netlify.app/en-us/docs/web/api/navigator/share/), [LogRocket](https://blog.logrocket.com/advanced-guide-web-share-api-navigator-share/)).
- `share()` only works straight after a tap ("transient activation"). If the picture takes too long to make after the tap, the browser refuses with `NotAllowedError` and nothing opens, and this shows up only on slow phones ([DEV Community](https://dev.to/yanwang/three-things-that-bit-us-moving-a-document-scanner-fully-into-the-browser-15cc)). **So the full-size picture is made before the tap** (section 6.2).
- When the visitor cancels, the promise rejects with `AbortError`: that is not an error and shows nothing.
- With a file, some apps drop a separate `url` field, or send it as a second message; Instagram ignores text altogether. The link therefore goes **inside the text** and on the picture itself.
- In-app browsers (Instagram's, Facebook's, TikTok's) often have no share sheet and block downloads. There, pressing and holding an ordinary picture on the page still offers "Save image", so the finished card is also shown as a plain `<img>`.
- iPhone Safari saves a downloaded file to **Files**, not Photos. Photos is reached through Share → Save Image, so on iPhone the Share button comes first.
- Copying a picture: `navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })])` works in Chrome, Edge and Safari, and in Firefox since version 127. Safari requires the `ClipboardItem` to be built **inside** the tap, holding a promise of the picture.

### 2.5 Where to draw the picture: on the visitor's device or on Cloudflare

| | **A. In the browser, on a canvas** (chosen for the pictures people share) | **B. On the Worker, on request** (not chosen now) | **C. Ahead of time, at release** (chosen for link previews) |
|---|---|---|---|
| How | The generator lays out the words and paints them on a `<canvas>`; `toBlob` makes the PNG | A route such as `/cards/og/john-3-16.png` lays the card out with Satori and paints it with resvg (WebAssembly), cached at Cloudflare | A script opens the same browser generator in headless Edge (as [og-image.mjs](../../../scripts/og-image.mjs) already does) and saves a PNG for each verse in a fixed list |
| Cost to run | **$0.** The visitor's device does the work | Inside the owner's paid Workers plan ($5 a month, which includes 10 million requests and 30 million CPU-milliseconds). One picture is roughly 50–150 CPU-ms when first made and free once cached, so even 10,000 previews a month use about 1.5 million of the included 30 million. Above the allowance Cloudflare charges $0.02 per million CPU-ms and $0.30 per million requests. Realistic cost **$0**, but metered | **$0.** A few minutes of the owner's PC at release; static files are free to serve on Workers |
| New code to trust | None: canvas is built into every browser; the site's [worship slides](../../../src/pages/worship-slides/draw.ts) already draw verses this way | Satori and resvg-wasm (both MPL-2.0, to register), fonts bundled into the Worker (~1 MB), a **second** drawing code that must match the browser's, and new code in the front-door Worker that every page goes through | Playwright and Edge, already used for the site's preview picture and tests |
| Covers | Every verse, every design, every size, with the visitor's own line | Every verse, as a link preview | Only verses in the curated lists (2,000 files at most, section 8.3) |
| Works offline or when Cloudflare is slow | Yes, once the page and the verse are loaded | No | n/a |

**Decision:** A for the picture a visitor makes, C for link previews. A costs nothing, has no new dependency, already works on this site, and keeps a visitor's words on their own device. C reuses A's exact drawing code, so a preview always matches the card. B would add the only metered, cloud-only part of the feature in order to give link previews to verses nobody curated, which a pasted link does not need: the message already carries the verse in its own words, and the link opens it. B stays a documented later option (section 13), and building it would go through the cost gate first.

### 2.6 What the site already has that we reuse

| Piece | Where | Used for |
|---|---|---|
| Canvas drawing of verses, PNG out, file download, waiting for fonts | [worship-slides/draw.ts](../../../src/pages/worship-slides/draw.ts) (`canvasMeasure`, `canvasPng`), [worship-slides/export.ts](../../../src/pages/worship-slides/export.ts) (`saveFile`, `fileStem`, the `useFontsReady` pattern), [worship-slides/layout.ts](../../../src/pages/worship-slides/layout.ts) (wrap and shrink to fit, measurement passed in so tests need no browser) | Imported read-only where they are generic (`canvasMeasure`, `canvasPng`, `saveFile`, `fileStem`); the card's own layout follows the slide layout's pattern but is its own file, because a card has a heading, a personal line and a footer that slides do not |
| The site's typefaces | `@fontsource-variable/literata` and `@fontsource-variable/archivo` in [package.json](../../../package.json) | Scripture in Literata, small text and the bold design in Archivo; both SIL Open Font Licence and already registered |
| Reading a Berean verse | [random-verse/load.ts](../../../src/pages/random-verse/load.ts) (`loadChapterPlain` from [data.ts](../../../src/lib/data.ts)) | Loading the chosen verses' words |
| Permanent readable verse keys | [data/sympathy/card-keys.ts](../../../src/data/sympathy/card-keys.ts) (`KEY_BOOKS`, a fixed table that may never change, and `passageKey`) | The link address `john-3-16`, read-only import |
| Typing a reference | [citation-generator/parse.ts](../../../src/pages/citation-generator/parse.ts) (`parseReference`) | The reference box on /verse-cards |
| Site origin | `SITE_ORIGIN` in [page-head.ts](../../../src/lib/page-head.ts) | Every link is built from it, never from the address the page is open at |
| Copy and share with fallbacks | [random-verse/VerseCard.tsx](../../../src/pages/random-verse/VerseCard.tsx) (share sheet, copy, "Press and hold to copy") | The same pattern and wording for the text and link buttons |
| Book section colours | `--history`, `--poetry`, `--prophets`, `--gospels`, `--acts`, `--epistles`, `--revelation` in [index.css](../../../src/index.css); `sectionOfNum` in [refs.ts](../../../src/lib/refs.ts) | The "Book colour" design (4.2) |
| Preview pictures in a headless browser | [og-image.mjs](../../../scripts/og-image.mjs) | The pattern for the link-preview script (8.2) |
| The reader's verse panel | [VersePanel.tsx](../../../src/components/reader/VersePanel.tsx) | Where **Make a verse card** goes (7.1) |

### 2.7 Features waiting for this generator

Five built features each wrote a "switch to the shared generator later" section, and each already builds a plain card description. Their wishes set the generator's interface:

| Feature | Its description today | What it asked for |
|---|---|---|
| Life-event packs ([design 7.4](../life-event-packs/design.md)) | `CardDescription` in [CardSheet.tsx](../../../src/pages/life-events/CardSheet.tsx): verse, second verse, heading, names, date, message, ornament, colour, page address | "Share as image" on the pack page; printing stays in that feature |
| Sympathy ([design 7.5](../sympathy/design.md)) | `SympathyCard` and `MessageCard` ([message.ts](../../../src/pages/sympathy/message.ts)), styles plain, olive, morning, lily | "Save as image" in the message tab; a link-preview image for the recipient card page |
| Countdowns ([design 8.4](../countdowns/design.md)) | `CardDescription` in [card.ts](../../../src/pages/countdowns/card.ts), looks advent, christmas, lent, palm, easter, plain | "Save as image" in the share panel; link previews for day pages |
| Prayers for occasions ([design 6.4](../occasion-prayers/design.md)) | `PrayerCard` in [message.ts](../../../src/pages/occasion-prayers/message.ts) | "Save as image" of a prayer or its featured verse; a preview per occasion page |
| What the Bible says when you're… ([design 8.3](../when-youre/design.md)) | `VerseCardDescription` in [message.ts](../../../src/pages/when-youre/message.ts) | "Save as image"; a preview per topic page |
| Verse of the day ([design, section 13](../verse-widget/design.md)) | the day's passage key | "Make a card of today's verse" |
| Birthday verses (steps 17–19, not designed yet) | none yet | A card for every date of the year |

The common core is: a passage (words and reference), an optional heading, optional short personal lines, a page to link back to, and a look. Section 9 shows how each one maps onto it.

## 3. The generator: one description in, a picture out

### 3.1 Where it lives

- [src/lib/verse-card/](../../../src/lib/verse-card/): the generator itself, with no knowledge of any feature. Plain TypeScript except one React hook.
- [src/components/verse-card/](../../../src/components/verse-card/): the ready-made **share panel** (preview, design and size choices, share buttons) that any page can drop in.
- [src/pages/verse-cards/](../../../src/pages/verse-cards/): this feature's own pages (/verse-cards and /verse-cards/:key).

Dependencies point one way: features import the generator; the generator imports nothing from a feature except the two read-only helpers named in 2.6 (the fixed verse-key table and the generic canvas helpers). No feature imports another feature through it.

### 3.2 The card description

```ts
/** Everything needed to draw one card, anywhere. Plain data: no functions, no page state. */
export interface CardSpec {
  /** The Scripture, already read from the Berean by the caller. */
  passage: { text: string; reference: string };          // "For God so loved the world…", "John 3:16"
  /** A short line above the verse, written by the feature, never by a visitor: "Happy birthday", "Day 12 of Advent". */
  heading?: string;                                       // at most 40 characters
  /** Up to two short lines below the verse: a visitor's own words, names, a date. Drawn on the picture only. */
  lines?: string[];                                       // at most 2, each at most 60 characters
  /** The page the card belongs to. Its address goes in the share text; the picture prints "bibleguide.io". */
  link: string;                                           // absolute, built from SITE_ORIGIN
  look: LookId;                                           // one of section 4.2, or a feature look (9.2)
  ornament?: OrnamentId;                                  // optional small line drawing (4.2)
}

export type SizeId = "square" | "portrait" | "story" | "wide";
```

Rules the generator enforces, in `cardProblems(spec)`, which returns plain sentences (empty when the card is fine):

- `passage.text` and `passage.reference` are non-empty; text over **600 characters** is refused ("too long for a card: choose fewer verses").
- `link` must start with `SITE_ORIGIN`; anything else is refused, so no feature can put another site's address on a Bible Guide card.
- `heading` and `lines` are trimmed, control characters removed, and refused over their limits (the page's input boxes enforce the same limits first, so the visitor never meets this refusal).
- An unknown `look` or `ornament` falls back to the default design with a console warning naming what was asked for.

The footer ("Berean Standard Bible · bibleguide.io") is **not** part of the description: the generator always draws it, so no feature can forget the link back or the version.

### 3.3 The functions

| Function | File | What it does |
|---|---|---|
| `layoutCard(spec, size, measure)` | `layout.ts` | Pure. Places heading, verse, reference, lines and footer for one size; returns positioned lines and `fits: boolean`. Measurement is passed in (a canvas on the page, a fixed width per letter in tests), as in the slide layout |
| `fitSizes(spec, measure)` | `layout.ts` | Which of the four sizes the card fits and at what letter size, so the size buttons can say "too long for this size" (rare, 4.3) and suggest the size where the words are largest |
| `drawCard(context, layout, look, scale)` | `draw.ts` | Paints a layout on a canvas: background, ornament, words. One function for the small preview (scale < 1) and the full picture (scale 1) |
| `renderCard(spec, size)` | `render.ts` | Waits for the fonts, lays out, draws on a reused canvas, returns `{ blob, fileName, width, height }`, or throws an error naming the size and what failed |
| `useCardPicture(spec, size)` | `render.ts` | React hook: renders in the background after each change (150 ms after the last one) and keeps the newest finished picture, so Share needs no waiting (6.2) |
| `shareText(spec)` | `share.ts` | "John 3:16 (BSB)\nhttps://bibleguide.io/verse-cards/john-3-16": what goes with the picture |
| `sharePicture(picture, text)`, `copyPicture(promise)`, `savePicture(picture)` | `share.ts` | The three ways out, each with the checks and fallbacks of 6.3, returning a plain outcome (`"shared" \| "cancelled" \| "saved" \| "copied" \| "retry" \| "manual"`) for the panel to show |
| `cardKey(ref)`, `refFromKey(key)`, `cardPageUrl(key, look)` | `links.ts` | The permanent link (5.1) |

### 3.4 The share panel component

`<CardSharePanel spec={…} sizes={…} looks={…} allowLine={…} />` in [src/components/verse-card/](../../../src/components/verse-card/):

- a live preview of the card at the chosen size (the canvas, drawn at screen size, with `role="img"` and an `aria-label` holding the verse, reference and the visitor's line, so a screen reader hears what is on the picture);
- the design choices (small swatches with the design's name), the size choices (four buttons named by use: "Square · chats and feeds", "Portrait · Instagram", "Story · stories and phone backgrounds", "Wide · X, Facebook, email"), each disabled with "Too long for this size" when `fitSizes` says so;
- optionally, one text box "Add a line (optional)", 60 characters, when the feature passes `allowLine`;
- the buttons of 6.1 and a status line (`role="status"`).

A feature that wants its own controls can skip the panel and call `renderCard` and the share functions directly; the link-preview script (8.2) does exactly that.

## 4. How the cards look

### 4.1 Design rules

From the owner's approved and refused design notes ([design/README.md](../../../design/README.md)): no glow, no boxes around the words, no neon or game look, one focal point. The verse is the picture. Words float on a calm background with at most one thin rule or one small line drawing. Scripture is set in Literata; the reference, the visitor's line and the footer in Archivo. Text is centred. Every design passes WCAG AA contrast (4.5:1) for all its text, checked by a test against the colours in `looks.ts`.

### 4.2 The six designs at launch

| Id | Name | Background | Words | Detail |
|---|---|---|---|---|
| `paper` | Paper (default) | warm off-white `#F6F1E7` | dark ink `#2A2420`, reference in bronze `#8A6A35` | a short thin rule between verse and reference |
| `night` | Night | deep navy `#1B2340` | cream `#F7F3EA`, gold reference `#D9C48F` | a small line-drawn star above the verse |
| `dawn` | Dawn | navy-violet blending to warm orange, corner to corner (`#35264A` → `#C0704A`) | warm white `#FFFAF2`, reference `#FFDDB3` | a flat low sun arc at the bottom edge, no glow |
| `olive` | Olive | deep green `#1F3A2E` | `#F1EFE6`, reference `#CBD6A0` | a small olive sprig |
| `book` | Book colour | the colour of the verse's part of the Bible (history, poetry, prophets, Gospels, Acts, letters, Revelation), the light-theme values in [index.css](../../../src/index.css) | white, reference in that colour's light box tint | none; the colour is the identity |
| `bold` | Bold | black | white, Archivo 700, larger and tighter, for stories | a short white rule |

The first four reuse the colours of the worship-slides themes the owner has already seen ([templates.ts](../../../src/pages/worship-slides/templates.ts)), so the site's verse pictures look like one family. Ornaments are small SVG path strings drawn with `Path2D`, made in this feature's folder (star, sprig, sun arc, rule); none is a downloaded picture, so no new source is registered.

Photographic or painted backgrounds are **not** at launch: stock photographs bring licence tracking for every picture, and the chapter-scene paintings in [initiatives/chapter-scenes](../../../initiatives/chapter-scenes/README.md) are neither drawn nor published yet. When the owner publishes them, "the scene of this chapter behind its verse" is a natural seventh design (section 13).

### 4.3 The four sizes and their safe areas

| Id | Pixels | Words kept inside | Starting verse size → smallest |
|---|---|---|---|
| `square` | 1080 × 1080 | 96 px margin all round | 64 px → 34 px |
| `portrait` | 1080 × 1350 | 130 px left and right (the centred 3:4 area of the Instagram grid), 110 px top and bottom | 66 px → 34 px |
| `story` | 1080 × 1920 | 96 px left and right; top 260 px and bottom 360 px left clear for the apps' bars | 72 px → 36 px |
| `wide` | 1200 × 630 | 80 px left and right, 56 px top and bottom | 52 px → 26 px |

The smallest sizes keep the words readable on a phone (34 px on a 1080-wide picture is about 12 points on a phone screen). With the 600-character limit of 3.2, a passage on its own fits every size at or above these sizes; a size is reported "too long" only when a long passage meets a heading and two personal lines in the small `wide` card.

Sizes are a table in `sizes.ts`; adding Pinterest's 1000 × 1500 later is one row and one button.

### 4.4 Layout rules

- **Order, top to bottom:** heading (if any), ornament (if any), verse, reference, the visitor's lines (if any), footer. The block of heading-to-lines is centred vertically in the safe area; the footer sits at the bottom of the safe area.
- **Shrink to fit:** the verse starts at its size's starting size and shrinks in steps of 2 px until heading, verse, reference and lines fit; line height 1.35. Lines are balanced (no single word left alone on the last line where moving one word up fixes it). If it still does not fit at the smallest size, `fits` is false and the size is offered as "too long". **The generator never cuts a verse or adds "…"**: a card always shows the whole of what its reference says.
- **The verse's own punctuation is kept**, including the Berean's inner quotation marks; no outer quotation marks are added (the reference beneath says what it is). Straight quotes and apostrophes in the source become curly ones for print.
- **LORD and GOD** in capitals (the Berean's way of showing the divine name) are drawn in small capitals, as printed Bibles do.
- **Several verses** are joined with a space and drawn without verse numbers; the reference shows the range ("Proverbs 3:5–6").
- **Reference** in the same form the rest of the site writes it (`formatRange`), with an en dash for ranges, followed by nothing: the version is in the footer.
- **Footer:** "Berean Standard Bible · bibleguide.io", small, in the design's reference colour at 80 per cent opacity. Every design and every feature gets it.
- **The visitor's line** is drawn in Archivo italic, one size, and wraps to two lines at most.

## 5. The link back

### 5.1 The permanent address

`https://bibleguide.io/verse-cards/<key>`, with `?look=<id>` when the design is not the default.

- The key is the sympathy feature's permanent passage key: book word, chapter, first verse, last verse if a range (`john-3-16`, `proverbs-3-5-6`, `1-corinthians-13-4-7`). It is computed from the fixed table `KEY_BOOKS` in [card-keys.ts](../../../src/data/sympathy/card-keys.ts), which a test there already forbids changing, so a link in someone's messages keeps working for years. `refFromKey` in this feature's `links.ts` reads it back; it accepts only the 66 books, one chapter, and a range that runs forward.
- **Size, the visitor's line, names and anything else typed never go in the link.** A link carries only the verses and the design.
- Readable keys rather than `JHN.3.16`: the address is readable aloud, and the dot form would look like a file extension to the static file server that serves ready-made pages (8.3).
- Unknown or malformed keys open the /verse-cards start page with "We couldn't find that verse" and the reference box, rather than an error page.

### 5.2 What the link opens: the card page

One page, `/verse-cards/:key`, for the person who receives a card and the person making one:

1. The card, large, in the link's design (portrait on a phone, square on a computer: the size is the reader's screen, not the sender's choice).
2. The verse as text, with "Read John 3" opening the reader at the verse, shaded (`/read/bsb/JHN/3?hl=16`, the address [random-verse](../../../src/pages/random-verse/VerseCard.tsx) and the verse-of-the-day use).
3. The share panel (3.4) under a heading "Make your own card of this verse", with the design already set to the link's.
4. A short line under it: "Cards are drawn on your device. Nothing you type is sent or saved."

The page is light: it loads the chosen chapter's Berean file and the generator, nothing else.

### 5.3 The start page

`/verse-cards`: a heading, one sentence, a reference box ("Type a verse, such as John 3:16 or Psalm 23:1–3"), today's verse of the day as one quick choice, and six well-known verses as quick choices (John 3:16, Jeremiah 29:11, Philippians 4:13, Proverbs 3:5–6, Isaiah 40:31, Romans 8:28), plus "Or tap any verse while reading" with a link to the reader. Choosing one goes to its card page. No long list, so the long-list rule does not apply.

## 6. Sharing

### 6.1 The buttons, in order

| Button | Shown when | What happens |
|---|---|---|
| **Share picture** | `navigator.canShare({ files: [file] })` is true (phones, Safari, Chrome and Edge on Windows) | The share sheet with the PNG and the share text (2.4). Done → "Shared"; cancelled → nothing |
| **Save picture** | always | Downloads `John-3-16-Bible-Guide.png` (`fileStem` of the reference). On iPhone it adds "Saved to Files. To put it in Photos, use Share picture → Save Image." |
| **Copy picture** | `ClipboardItem` and `navigator.clipboard.write` exist and `canShare` is false (mostly computers) | Copies the picture to paste into a chat or a document |
| **Copy link** | always | Copies the card page address (5.1). "Copied" |
| **Copy text** | always | Copies "For God so loved the world… — John 3:16 (BSB)" and the link, the format every verse tool on the site already copies |

Share text with a picture: `John 3:16 (BSB)` and the card page address, on two lines. The verse words are not repeated, because they are on the picture.

### 6.2 Making the picture before the tap

`useCardPicture` renders the full-size PNG in the background 150 ms after the last change of design, size or line, keeping the newest one. A full-size card takes about 20–80 ms on a phone, so it is almost always ready before the visitor reaches the button. If it is not (a very slow phone), the tap waits for it, and if the browser then refuses with `NotAllowedError`, the button changes to **"Your picture is ready: tap to share"**, whose tap calls `share()` with nothing to wait for.

### 6.3 When things fail

| What fails | What the visitor sees |
|---|---|
| No share sheet, or no file sharing | Share picture is not shown; Save picture and Copy picture are |
| Download blocked (in-app browsers) | The finished picture appears below the buttons as a plain image: "Press and hold the picture to save it" |
| Clipboard refused | The text (or link) appears selected in a box: "Press and hold to copy", the site's existing wording |
| The canvas makes no picture (very old browsers, memory) | "This browser could not make the picture. Copy the text instead." with Copy text kept working; the error, naming the size, goes to the console |
| Fonts slow to load | The picture is drawn after the fonts load, or after 3 seconds with what loaded (the worship-slides rule), never with a fallback font silently mid-way: the preview shows "Loading the lettering…" until then |

## 7. Where people start a card

### 7.1 From the reader (the main way in)

In [VersePanel.tsx](../../../src/components/reader/VersePanel.tsx), the panel that opens when a verse is tapped, one button under "Show this verse in every version": **Make a verse card** (an image icon from `lucide-react`, already a dependency). It links to `/verse-cards/<key>` for the selected verse.

- Shown only for the 66 books and for versions numbered like the English Bibles (`translation.numbering === "english"`), because the card always quotes the Berean and must show the same verse the reader tapped. In other versions, in the Apocrypha, or where the Berean has no such verse (Matthew 17:21 and the other verses modern translations leave in footnotes), the button is not shown.
- When the reader is open in another version, the button reads **Make a verse card (Berean)**, so nobody is surprised that the words differ from what they were reading.
- The reader selects one verse at a time. On the card page, two small buttons, **Add the verse before** and **Add the verse after**, extend the range inside the chapter (up to the 600-character limit, after which they are disabled with "That is as much as a card can hold").

This is the only change to a shared component: one link, about 10 lines. Re-read the file just before editing it.

### 7.2 From the Tools hub

The registry entry is set `status: "live"`, `path: "/verse-cards"` ([registry.ts](../../../src/pages/tools/registry.ts)), and the route added in [App.tsx](../../../src/App.tsx). That is its navigation entry; no header tab is added.

### 7.3 From the verse of the day and the random verse

Each gets one link, **Make a card of this verse**, to `/verse-cards/<key>`: the verse-of-the-day page ([VerseOfTheDayPage.tsx](../../../src/pages/verse-of-the-day/VerseOfTheDayPage.tsx), this chain's own step 13, which planned it) and the random verse card ([VerseCard.tsx](../../../src/pages/random-verse/VerseCard.tsx)). Each is a one-line, additive change; if the implementer finds either file being changed by another job at the time, that link waits and is reported, rather than risking a clash.

## 8. Link-preview pictures

### 8.1 What gets one

A card page's ready-made HTML carries an `og:image` of its card when the verse is in a curated list:

1. every passage of the verse-of-the-day schedule (428 passages today, [schedule.json](../../../src/data/verse-of-the-day/schedule.json));
2. the six quick choices of 5.3;
3. later, the 366 birthday verses (steps 17–19), and each adopting feature's own list (9.3).

Only the default design gets a preview: a link with `?look=dawn` still shows the Paper card in a chat (crawlers ignore the query; the page itself opens in Dawn). Personal lines and names **never** appear in a preview, because previews are public files that chat apps cache; this is also the rule for the sympathy recipient page (9.2).

All other verses keep the site's own preview picture. Their links still work and the message still carries the reference.

### 8.2 How they are made

A script, `scripts/verse-cards/previews.mjs`, modelled on [og-image.mjs](../../../scripts/og-image.mjs):

1. reads the lists, and the Berean text for each passage from the site's own files;
2. compiles a tiny page that imports `renderCard` from [src/lib/verse-card/](../../../src/lib/verse-card/), opens it in headless Edge with Playwright (both already in the project), and asks it for each card at the `wide` size (1200 × 630) as PNG;
3. writes `cards/preview/v1/<key>.png` into the **release package**, not into git and not into `public/` (about 430 files of roughly 60–120 KB, about 40 MB; the test fails any file over 300 KB);
4. writes `cards/preview/v1/index.json` listing the keys it made.

`v1` is the design version. Any change to how cards look bumps it to `v2`, because chat apps keep an old picture for an old address (2.3).

### 8.3 How the page's HTML names its picture

- [shell.ts](../../../scripts/seo/shell.ts) gets one **additive, optional** field, `image?: { url: string; alt: string }`, in the head it fills: when present it replaces the `og:image`, `twitter:image` and both `alt` tags; when absent nothing changes. This is the feature's one change to the shared release scripts.
- For each key in `index.json`, a ready-made copy `verse-cards/<key>.html` is written with the verse's title ("John 3:16: a verse card | Bible Guide"), a description of the verse's first words, the canonical address and the preview picture. The static file server answers `/verse-cards/john-3-16` with it, as it already does for the 1,681 main pages.
- **File budget:** about 430 pictures and 430 pages now, and about 2,000 files in all once birthdays and the other features add theirs, against the release's ~43,800 files and its 99,500 limit ([build.ts](../../../scripts/seo/build.ts)). The script prints its file count, and stops with an error naming the count if a list would push the release past the limit.
- **When it runs:** at release, after the package is prepared. Step 16 builds and tests the script and runs it locally on the six quick choices; adding it to the release preparation is a one-line call done at the next release the owner approves (no release happens in this sequence).

## 9. Reuse by the other card features

### 9.1 The pattern: a small adapter in each feature

Each feature keeps its own card description (they are already tested and some are part of their links) and adds one pure function in its own folder that turns it into a `CardSpec`. The generator never learns what a birthday or a funeral is.

```ts
// src/pages/when-youre/card-spec.ts (example)
export const toCardSpec = (card: VerseCardDescription): CardSpec => ({
  passage: { text: card.text, reference: card.reference },
  link: `${SITE_ORIGIN}/when-youre/${card.page}#${card.key}`,
  look: "paper",
});
```

Then the feature drops in `<CardSharePanel spec={toCardSpec(card)} />` (with the sizes and looks it wants), or calls `renderCard` for a single "Save as image" button. Each adopting feature runs its own small step, touching only its files, after step 16 is done; none of that is in step 16, which builds this feature only (the build rules' "touch only the current feature's own files").

### 9.2 Feature looks

A feature with its own visual identity (sympathy's olive, morning and lily; countdowns' Advent and Lent; life events' pack colours) registers extra looks through `registerLook({ id, name, background, text, accent, ornament })` from its own folder, with the same contrast test applied. Built-in looks cannot be replaced. This keeps one drawing code while letting a sympathy card look like the sympathy feature.

### 9.3 Feature by feature

| Feature | `passage` | `heading` | `lines` | `link` | Look | Preview list |
|---|---|---|---|---|---|---|
| **Birthday verses** (steps 17–19) | the date's verse | "Happy birthday" | optional "Dear Anna" from a box, never in the link | the date page, `/birthday-verses/<month>-<day>` (to be fixed by its design) | the date's month colour or the six built-in looks | all 366 dates, default look |
| **Life-event packs** | the card verse (`verse`); a second verse is not drawn on images, it stays on paper | `heading` | names and date | `pageUrl` | `registerLook` from the pack `colour` and `ornament` | the packs' card verses |
| **Sympathy** | the passage | none on images by default ("With sympathy" if the visitor ticks it) | recipient and sender names only if typed | `cardUrl(key, style)` | olive, morning, lily, plain registered | each passage key; the recipient page's preview is the verse only, never names |
| **Countdowns** | the day's verse | the day line ("Day 12 of Advent") | none | the day page | advent, christmas, lent, palm, easter registered | every day of each occasion |
| **Prayers for occasions** | the featured verse (prayers are too long for an image at readable size; the prayer itself stays in the text message, as its design foresaw) | the occasion ("Before surgery") | none | the occasion page and anchor | paper | each occasion |
| **When you're…** | the verse | none | none | topic page and verse anchor | paper | each topic's featured verse |
| **Verse of the day** | today's passage | none | none | the card page | default | already in 8.1 |
| **Baby names** (later idea in its design) | the verse naming the person | the name and its meaning | none | the name page | book colour | not needed |

Birthday verses can therefore be built by: choosing 366 verses, writing the adapter, and using the panel. No new drawing code.

## 10. Building it (step 16)

### 10.1 Files

New:
- `src/lib/verse-card/` — `spec.ts` (types, `cardProblems`), `looks.ts` (the six looks, `registerLook`, ornaments), `sizes.ts`, `layout.ts`, `draw.ts`, `render.ts` (`renderCard`, `useCardPicture`, font wait), `share.ts`, `links.ts`, `README.md` (how a feature uses the generator: the adapter, the panel, looks, previews), and tests beside them.
- `src/components/verse-card/CardSharePanel.tsx` and its CSS.
- `src/pages/verse-cards/` — `VerseCardsPage.tsx` (routes for start page and card page), `StartPage.tsx`, `CardPage.tsx`, `load.ts` (reading the passage's Berean words), `verse-cards.css`, tests, `README.md`.
- `scripts/verse-cards/previews.mjs` and its test.

Changed (small, additive):
- [registry.ts](../../../src/pages/tools/registry.ts): the entry goes live with its path.
- [App.tsx](../../../src/App.tsx): one route, `/verse-cards/*`, lazily loaded like the other tools.
- [VersePanel.tsx](../../../src/components/reader/VersePanel.tsx): the reader's button (7.1).
- [VerseOfTheDayPage.tsx](../../../src/pages/verse-of-the-day/VerseOfTheDayPage.tsx) and [random-verse/VerseCard.tsx](../../../src/pages/random-verse/VerseCard.tsx): one link each (7.3).
- [shell.ts](../../../scripts/seo/shell.ts): the optional `image` field (8.3).
- [page-head.ts](../../../src/lib/page-head.ts): one `ROUTE_TITLES` entry, `"/verse-cards": "Bible Verse Cards: Free Verse Pictures to Share"`, as the other tools have (`/random-verse`, `/verse-of-the-day`).
- [SOURCES.md](../../../SOURCES.md): one line saying the feature uses no new source (Berean text, the site's own typefaces, ornaments drawn here).

### 10.2 Order of work

1. Links and spec (`links.ts`, `spec.ts`) with tests; then layout with tests (no browser needed).
2. Looks, sizes, drawing, rendering; a test kit that runs the drawing against a recording fake context.
3. Share functions with fakes for `navigator.share`, `canShare`, the clipboard and downloads.
4. The panel, then the two pages, then the route and registry entry.
5. The reader button and the two one-line links.
6. The preview script and the `shell.ts` field, run on the six quick choices.
7. Look at the start page, a card page at all four sizes and all six designs, and the reader button, on the always-on preview at http://127.0.0.1:8931 (never a new dev server, per the project's notes), at 390 × 844 and 1440 × 900, light and dark; save screenshots.
8. The site's tests and build.

## 11. Tests

- **Links:** every one of the 66 books round-trips through `cardKey` and `refFromKey`; ranges; refusal of cross-chapter ranges, backward ranges, verse 0, unknown books, the Apocrypha; keys are identical to sympathy's `passageKey` for the same passage.
- **Spec:** limits on text, heading and lines; control characters removed; a link not starting with `SITE_ORIGIN` refused; unknown look falls back with a warning.
- **Layout (fixed-width measure):** John 3:16 fits all four sizes at a large size; Esther 8:9 (the Bible's longest verse) fits every size at a smaller size, never below the minimum; a 600-character passage with a heading and two lines reports `wide` as too long rather than cutting it; no line wider than its safe area; the footer always present; LORD drawn as small capitals; a lone last word avoided.
- **Looks:** every built-in and every registered look passes 4.5:1 contrast for text, reference and footer.
- **Drawing:** the fake context receives the words in order and the footer text "Berean Standard Bible · bibleguide.io" for every look and size.
- **Share:** file sharing used only when `canShare({ files })` is true; `AbortError` is silent; `NotAllowedError` gives "retry"; download refused gives "manual"; the share text holds the reference and the card address and no visitor line.
- **Privacy:** typed lines and names never appear in the link, the share text, the preview list or the page's address.
- **Pages:** a card page for a valid key shows the card, the verse and "Read John 3" with the right reader address; a bad key shows the start page with its message; the reader button appears for the Berean and the KJV, not for a version with other numbering or for the Apocrypha.
- **Registry:** the tool is live and its path is routed.
- **Preview script:** on the six quick choices, PNGs 1200 × 630, each under 300 KB; the HTML copy carries the right `og:image`; a page without a preview is unchanged.

## 12. Edge cases

| Case | What happens |
|---|---|
| A very long verse (Esther 8:9, about 90 words) | Drawn smaller to fit, never below the size's minimum; the story and portrait sizes keep it largest, and the panel suggests them when the verse is long. Never cut |
| Several verses over 600 characters | "Add the verse after" disabled with "That is as much as a card can hold"; a key in a link that exceeds it opens the first verse alone, with a note |
| A verse the Berean leaves out (Matthew 17:21) | Reader button hidden; a link to it opens the start page: "The Berean Standard Bible has no verse Matthew 17:21" |
| Psalm titles (verse 0 in some data) | Not offered; keys start at verse 1 |
| Site shown in another language | The card is always the English Berean, as every verse tool on the site does (Berean everywhere); the page's own words are translated like the rest of the site, the picture is not |
| The reader open in a right-to-left version | Button reads "Make a verse card (Berean)"; the card is English, left to right |
| The visitor types emoji or another script in their line | Drawn with the browser's fonts if Literata or Archivo lack the letters; tested not to break the layout; 60-character limit counts characters as the visitor sees them |
| The visitor types something offensive in their line | Nothing is published or stored: the picture exists only on their device, so the site holds nothing to moderate |
| Two quick changes in a row | Only the newest picture is kept; an older render finishing late is thrown away |
| Phone low on memory | One canvas reused; set to 0 × 0 when the panel closes (the worship-slides habit) |
| Dark mode | The page follows the site's theme; the card's design does not change with it (a shared picture must look the same to everyone) |
| Printing the page | Cards are for screens; the print style hides the panel. Printable cards stay in the life-event and sympathy features |
| A link with `?look=` naming no design | Opens in Paper |
| An old link after a design is retired | Retired look ids map to their nearest replacement in `looks.ts`; a test holds every id ever published |
| Offline after the page loaded | Making and saving still work; sharing depends on the phone |
| Preview image fails to build for one passage | The script reports the passage and why, skips it, and that page keeps the site's preview |

## 13. Decisions this design makes, and what is left for the owner

Made here, as the obvious choices:
- Pictures are drawn on the visitor's device; nothing is uploaded or stored; no running cost.
- Link previews are made ahead of time for curated verses only, with the same drawing code.
- Six drawn designs, four sizes, one optional personal line; the footer with the version and the site's address is always drawn.
- The link is `/verse-cards/<key>` using the sympathy feature's permanent keys.
- The reader's verse panel gets a "Make a verse card" button.

Nothing in this feature needs an owner decision: it spends no money, publishes nothing until a release the owner approves, and uses no new source.

Later options, each needing the owner's word when raised:
- **Previews for every verse**, drawn on the Worker (2.5, option B). Realistic cost $0 inside the paid plan but metered and cloud-only, so it would go through the cost gate.
- **The chapter-scene paintings as backgrounds**, once the owner has the pictures made and decides to publish them.
- **A Pinterest size** (one row).

## 14. Out of scope for this build

Photograph or uploaded backgrounds; a gallery or feed of other people's cards; accounts or saved cards; animated cards or video; printing (life events and sympathy own paper); QR codes on images (pointless on the phone that shows them; printed cards already have them); translations of the card text other than the Berean; analytics of shares; the other features' "Save as image" adoption (each is its own small step after this one, section 9.1); adding the preview script to the release preparation (done at the next approved release, 8.3).
