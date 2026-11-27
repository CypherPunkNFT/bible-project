# Apologetics fields: the article card, the field page and the nine format pages (mock-ups)

Step 4 of [APOLOGETICS-FIELDS.md](../../../Plans/APOLOGETICS-FIELDS.md) (sequence 60, job 41af35ef, 2026-11-27). The card follows
[APOLOGETICS-FIELDS-CARD.md](../../../Plans/APOLOGETICS-FIELDS-CARD.md) value for value. The owner chose not to wait for their
look before building (owner decision 2), so step 5 builds from these; they stay here, in the gallery and on the board for
the owner to see. **Nothing on the live site changed.**

## Where to look

| What | Address (local preview) |
|---|---|
| Design review board, type "Apologetics fields: card, field page and format pages (mock-ups)": 24 designs, each at desktop 1440 and phone 400, light and dark | http://127.0.0.1:8931/review |
| Gallery cards (section "Apologetics - Fields") | http://127.0.0.1:8931/mockups/ |
| The card sheet: all eleven types, every state, contrast measured on the page | http://127.0.0.1:8931/mockups/apologetics-fields/field/?view=card |
| Field page, Jesus & resurrection / Suffering & doubt | [field/](field/) · `?field=doubt` |
| Format pages | [formats/](formats/) · `?format=essay\|objections\|debate-guide\|timeline\|figure\|reading\|glossary\|faq\|case-study` (essay: `&part=1..7`) |

Every view takes `?surface=app` for the phone app's version (status bar, the app's header, the card's app values: icon 80 px on
phones and 96 on tablets, no fade mask, a 40 px save target, pressed instead of hover) and `?theme=light|dark`; otherwise it
follows the site's saved theme (`bp-theme`).

## Files

- [shared/](shared/): `base.css` (the site's tokens from src/index.css, a drawn copy of the header and Apologetics navigation,
  the card), `frame.js` (frame, the type table of the plan's part C §5, the card), `icons.js` (lucide 1.11.0 shapes, the
  version site and app use), `theme.js`, and the site's Archivo and Literata fonts.
- [field/](field/): `data.js` (real titles from the plan's part B), `field.js` (the page), `card-sheet.js`, `field.css`.
- [formats/](formats/): `content.js` (one sample per format), `formats.js` (one renderer per format), `formats.css`.

## Decisions taken in the mock-up (for the owner and for step 5)

- **Small format groups share a row.** A group of one or two articles takes only that many of the three columns, so ten
  formats do not become ten near-empty bands (the "no endless scroll" rule).
- **"Start here" and the groups hide while searching or filtering**; the filter's counts follow the search.
- **No focus ring.** The card plan's focus row names a 2px outline, but the owner's rule (checked on every page by the board)
  forbids one; the mock-up shows focus as the card's border in the field colour plus an underlined title.
- **Format pages keep today's study-page frame** (back link, header, body, right-hand rail that drops below on phones). Their
  "related" area is left out: the new card goes on field pages first (owner decision 8).
- **Jesus & resurrection shows 19 articles, not 20.** The Craig–Ehrman debate case study is left out: the owner asked that the
  debate case studies not be touched (owner decision 4). The case-study sample is the end of Mark instead.

## Contrast measured (eyebrow .61rem in the field colour on the card's wash; AA needs 4.5:1)

| Colour | Field | Light (rest / hover) | Dark (rest / hover) |
|---|---|---|---|
| accent | God & reality | 5.35 / 5.07 | 8.04 / 7.41 |
| gospels | Jesus & resurrection | 6.91 / 6.48 | 6.84 / 6.38 |
| history | Bible & reliability, Reformed theology | 5.25 / 4.96 | 6.92 / 6.44 |
| poetry | Suffering & doubt | 5.28 / 4.98 | 7.79 / 7.20 |
| prophets | Religions & worldviews | 6.30 / 5.95 | 7.24 / 6.71 |
| epistles | Faith & witness | 5.11 / 4.81 | 9.45 / 8.60 |

All pass, including the two the plan flagged (epistles and poetry). Muted text on the wash measures 5.4–5.5:1 light and
5.6–5.7:1 dark. Note: the card plan says Reformed theology uses the epistles colour; the topic file gives it `history`.

## Sample text

Scripture is the Berean Standard Bible from the site's own data (`data/text/bsb`). Tacitus is Church & Brodribb (held at
`sources/archive-org/tacitus-annals-church-brodribb-1884.txt`, OCR slips corrected), Hume is the Gutenberg *Enquiry*
(`sources/gutenberg/hume-enquiry-9662.txt`). The Baptist Faith and Message is paraphrased, not quoted (in copyright). Modern
books are named as "described, not quoted". All other wording is drafted to show the shape; the real articles are written,
sourced and reviewed in steps 7–12. Minutes come from each article's target length; source counts are illustrative.
