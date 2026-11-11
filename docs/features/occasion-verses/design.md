# Occasion verse picker: design

Sequence 41, step 9 (job 860), 2026-11-09. The idea and its rule are in
[PROPOSED-IDEAS.md](../../../../PROPOSED-IDEAS.md): **every occasion-based verse feature (weddings, baptisms,
confirmations, birthdays, life events, funerals and any future occasion) is ONE tool, this one.** New occasions extend it.
Three reviews ran on the first draft before any code; their corrections are applied below and listed under **Review**.

## 1. What it is

One page, `/occasion-verses`, on the Tools hub as **Occasion verse picker** (Family and life events). The visitor picks
an occasion, sees its Berean Standard Bible passages grouped by the part of the service or the use they suit, adds the
ones they want to **Our list** (the readings for a service, a program or a card), copies or prints that list, and for
the occasions where it fits prints a **keepsake certificate** with a chosen verse.

No AI, no server, no account, nothing stored. The occasion and the list live only in the address
(`?o=wedding&list=genesis-2-18-24,1-corinthians-13-4-8a`), so a list can be bookmarked or sent. Names, dates and the
church on a certificate are never saved, never put in the address or the page title, and never sent anywhere: the
fields sit outside any `<form>`, have no `name` attribute and `autocomplete="off"`.

## 2. What it folds in (and does not rebuild)

| Source | State on 2026-11-09 | How it enters the picker |
|---|---|---|
| Life-event verse packs (sequence 33, steps 1–3), `src/data/life-events/` | Live at `/life-events`, 15 packs | An adapter turns every pack into an occasion with the pack's own passages, notes, context, explainer and sub-headings. A pack added later appears by itself. |
| Funeral and sympathy pages (sequence 33, steps 4–6), `src/data/sympathy/` | Live at `/sympathy` | The 47 funeral readings, already labelled by part of the service, become **Funeral service**; the hub set and the twelve loss pages become occasions under "Funerals and loss", with their explainers, the suicide page's help strip, and the labels "For a believer" and "Often better a few weeks on". |
| Birthday verses | **Not built.** It is sequence 32 (chain C), steps 17–19, all "not started" (the brief said 33). | A **Birthday** occasion now, with a short hand-picked set, and a slot for a verse per date (section 6). |
| Wedding by part of the service | New here | The wedding pack's passages, unchanged, arranged by part through an overlay, plus extra passages (section 4). |
| Confirmation | New here | Hand-written, honest about Baptist practice (section 5). |

The existing pages stay as they are and stay the place to make their folded and small cards: each occasion links to
its full page ("Make a card on the wedding page", "Funeral readings list"). The picker does not copy their card makers.

## 3. The shared model

Data in `src/data/occasion-verses/` (no `@/` imports, so build scripts can read it); the page in
`src/pages/occasion-verses/`.

```ts
type OccasionGroup = "wedding" | "faith" | "life" | "loss";
interface OccasionSection { id: string; title: string; what?: string; passages: SympathyPassage[] }
interface Occasion {
  slug: string; group: OccasionGroup; title: string; intro: string;
  explainer?: { title: string; paragraphs: string[] };
  helpStrip?: true;
  sections: OccasionSection[];
  more: { href: string; title: string }[];
  certificate?: "wedding" | "baptism" | "profession" | "dedication";
}
```

A passage is the sympathy passage (the life-event passage plus `believer`, `later`, `servicePart`): verse ids only.
Words come from the Berean files through the life-event helpers (`assemblePassage`, `passageReference`, `readHref`), so
the picker shows the same text as the pack pages.

**Keys.** A passage's key is the site's existing permanent key, `passageKey()` from `src/data/sympathy/card-keys.ts`
(`psalm-23-1-6`, `1-corinthians-13-4-8a`), so a funeral-list link's keys work here too. The picker's own committed list,
`kept-keys.ts`, is held by a test: a key may never disappear. A second test checks that every occurrence of one key has
the same verses, skips and partial-verse words, since the key does not carry them.

**Slugs.** Life-event packs keep their slugs; the hub set is `sympathy`, a loss page `sympathy-<slug>`; funeral
`funeral`; the picker's own `confirmation` and `birthday`. Slugs are unique (tested). The wedding occasion is the pack
itself with its overlay, so there is no clash.

Groups, in page order: **Weddings and marriage** (wedding, engagement, anniversary), **Faith** (baptism, confirmation or
profession of faith, new believer, baby dedication, ordination, sending a missionary), **Birthdays and milestones**
(birthday, expecting, new baby, adoption, first day of school, graduation, new job, retirement), **Funerals and loss**
(funeral service, sympathy, the twelve loss pages).

Life-event roles become sections: reading → "Readings for the service", card → "Short verses for a card or program",
blessing → "A blessing to close". Funeral readings are grouped by part, in the funeral page's own order and words.
A pack's sub-heading (`group`, e.g. "For deacons") shows above its passage.

## 4. Wedding, by part of the service

Baptist weddings have no fixed order, so the page says: "Only a suggestion: the couple and the pastor shape the
service." Every passage of the wedding pack is placed in one part (tested), with its pack note; extra passages carry
their own notes.

1. **Welcome and opening words**: PSA 118:24, PSA 34:3, PSA 100:1-5
2. **Scripture readings**: the pack's nine readings, and GEN 1:26-28, PSA 127:1, PSA 128:1-4, ROM 12:9-18, JHN 2:1-11, JHN 15:9-12
3. **The message to the couple**: MRK 10:6-9, MAT 7:24-27, PHP 2:1-4, COL 3:14, 1JN 4:19
4. **Vows and rings**: SNG 8:6 (the whole verse), SNG 6:3, PRO 3:3-4, MRK 10:9, RUT 1:16-17's context note kept
5. **Prayer over the couple**: PHP 1:9-11, ROM 15:5-6, 1TH 3:12-13, EPH 3:16-19 (EPH 3:14 opens with "…" in the Berean)
6. **Pronouncement and benediction**: NUM 6:24-26, ROM 15:13, 2CO 13:14, HEB 13:20-21, JUD 1:24-25
7. **Programs, invitations and cards**: the pack's card verses (ECC 4:12b, 1CO 13:7, PRO 18:22) and 1CO 16:14

## 5. Confirmation or profession of faith

The site's voice is Southern Baptist (DOCTRINAL-FOUNDATION.md, Article 7). The introduction says plainly: Lutheran,
Anglican, Methodist, Catholic and some Reformed churches confirm young people baptized as infants. Baptist churches do
not confirm: a believer confesses Christ in baptism by immersion and joins the church, and someone confirmed after
infant baptism would be asked to be baptized as a believer before joining a Baptist church. The verses here suit a young
person's own confession of faith. Readings: ROM 10:9-10, 2TI 3:14-17, JOS 24:14-15, MAT 16:13-17, EPH 2:8-10,
ROM 12:1-2. Short verses: 1TI 4:12, PHP 1:6, ROM 1:16, MAT 10:32, 1CO 16:13, JOS 24:15b. Blessing: 2TH 2:16-17.
The certificate's title is **Profession of faith** by default; **Confirmation** is offered, labelled "for churches that
confirm".

## 6. Birthday

Sections: **For a child** (PSA 139:13-14, PSA 139:16, LUK 2:52), **For any age** (PSA 118:24, PSA 90:12, PSA 16:11,
LAM 3:22-23, PSA 65:11, PHP 1:3, PSA 23:6), **For an older friend** (ISA 46:4, PSA 92:12-14, PSA 71:17-18, PRO 16:31),
**A blessing** (NUM 6:24-26). Left out on purpose, as verses often taken beyond what they say: JER 1:5 (a prophet's call),
JER 29:11 (a promise to the exiles), PSA 20:4 (a prayer for a king going to battle), 3JN 1:2 (a letter's greeting, used by
prosperity teaching), ZEP 3:17 (to Jerusalem; the life-event packs already note it).

**The per-date slot, for sequence 32.** `src/data/occasion-verses/birthday-by-date.ts` exports
`BIRTHDAY_BY_DATE: Record<"MM-DD", LifeEventPassage>`, each built with `p()` so it has a note and a bad reference fails
when the file loads. It is empty now. A **date field** ("Your verse for your birthday") appears only when all 366 dates,
02-29 included, are filled; the date is read from the field's own "MM-DD", never through a time zone, shown with the
site's date formatter, and never put in the address. Its card would use the life-event card maker. Sequence 32's step 19
promises a separate page per date; under the one-tool rule its work should fill this file instead (noted for the owner).

## 7. Certificates

Four, chosen by the occasion: **baptism** ("having professed faith in Jesus Christ, was baptized by immersion"),
**profession of faith / confirmation** (section 5), **baby dedication** (the parents' promise before the church to raise
their child to know the Lord; the sheet says "a dedication, not a baptism"), and the **wedding keepsake** (no word
"certificate", no witness lines; "bride" and "groom"; "a keepsake, not a marriage licence or legal record"). The visitor
fills in names, the date, the church and optionally the pastor's name; picks one verse of the occasion up to 320
characters; chooses Letter or A4; and prints. Signature lines are blank. Print waits until the verse's words have
loaded and says why while it waits. Where printing is not available (in-app browsers) the button is replaced by a line
saying to open the page in a browser.

**One print at a time.** The page has one `usePrintSheet`; a `sheet` state ("list", "certificate" or none) mounts only
that sheet's `PrintPortal`, and sets the paper and margin before `print()`. Tested: the two sheets never print together.

## 8. Our list

Each passage has an **Add to our list** check box, as on the funeral page. The list, in the order added, shows each
reference and its part, with Up, Down and Remove; after a move the focus stays on the moved row and a polite live region
says "Moved to 2 of 5". **Copy as text** gives each passage as part, reference and words, then the Berean credit line, as
the funeral page's does; **Print readers' sheet** uses the funeral page's `ReadersSheet`. The list keeps passages from
any occasion. Keys are read from `?list=` capped at 1,500 characters, known keys only (aliases resolved), each once,
first 30; the address is rewritten without the rest (replacing, never adding, a history entry). Words for the list are
kept in a map that only grows; only keys not yet loaded are fetched, so reordering loads nothing. Copy and Print wait
until every entry has its words.

## 9. Loading, addresses and long lists

- Sections, references and the check boxes come from the data shipped with the page; only the words are fetched, per
  passage with `Promise.allSettled`. A book that fails shows one line, "Some passages could not be loaded", with
  **Try again**, and the rest still show. Each Berean book is fetched once per visit and shared.
- No `o` (or an unknown one) shows the occasion chooser; an unknown one is cleaned from the address. Choosing an
  occasion adds a history entry, so Back returns to the chooser; list edits replace. The page reads the occasion and list
  from the address on every render. `o` is looked up in a `Map`.
- Long lists: the passage list is drawn with the site's `useRowWindow` (about 50 rows above and below the visible area,
  more as the reader scrolls, no "load more"). Section headings are rows with their own row keys. Tests give the list a
  measured size so the window draws.

## 10. Words and translation

All page words are plain text in `src/pages/occasion-verses/` and `src/data/occasion-verses/`, so
`content/translation/extract.py --pages` collects them. No sentence is assembled from pieces; counts use the site's
`plural()`; dates use `formatDate`. Status words ("Copied") are registered in `content/translation/page-register.json`
as the random verse did. Verse words stay English (`translate="no"`, `.scripture lang="en"`): they are the Berean. The
page title goes in `src/lib/page-head.ts`; the page joins the site inventory (`scripts/design-review/site-map-rest.ts`)
so the sitemap and prerender list it. `english_build_check.py` is run before finishing.

## 11. Mobile and accessibility

Single column under 48rem: the list follows the passages, with a sticky "Our list (n)" link that jumps to it; the
certificate form is one column. Check boxes are real inputs with labels; the occasion chooser is a list of links.

## 12. Files outside the tool's folders

One route line in `src/App.tsx`, one title in `src/lib/page-head.ts`, one entry in `src/pages/tools/registry.ts`, one
inventory line in `scripts/design-review/site-map-rest.ts`, and the "Copied" lines in the translation register.
The hub keeps the existing Life events, Sympathy and Birthday verses cards, because the hub's test holds the owner's
approved list of ten by name; folding them into this card is left for the owner (noted in the report).

## Review

Three reviews on 2026-11-09, before any code: security and correctness, reliability, and fit with the site.
Corrections applied above:

- **Print (critical):** two print sheets on one page would both print, and the last-written page rule would win. Fixed
  with one print hook and one mounted sheet at a time (section 7).
- **Wedding slug clash and lost wording (critical):** the live wedding pack already uses `wedding`; rewriting it would
  have dropped its notes. Now the pack itself, arranged by part through an overlay (section 4).
- **Keys:** the draft invented a second key format; now the site's permanent `passageKey`, with a kept-keys test and a
  test that one key never names two different excerpts (section 3).
- **Privacy:** certificate fields outside any form, no names in the address or page title (sections 1, 7).
- **Confirmation:** "Orthodox" removed (they chrismate infants at baptism); the Baptist position stated plainly; the
  certificate defaults to "Profession of faith" (section 5).
- **Pastoral content kept:** explainers, the suicide page's help strip, sub-headings and labels carried (section 2).
- **Wedding order:** no lectionary order; a suggestion only, as the funeral page says (section 4).
- **Loading:** one failed book no longer blanks an occasion; the list loads only new words (sections 8, 9).
- **Birthday:** per-date slot built with `p()`, complete-only, time-zone safe, never in the address; three more verses
  left out with reasons (section 6).
- **Translation and inventory:** no assembled sentences, plurals and dates through the site helpers, sitemap entry
  (section 10).
- **Our list:** the funeral page's pattern and sheet reused, focus kept after a move (section 8).
- **Not taken:** removing the Life events and Birthday verses hub cards (the hub test holds them by name; left for the
  owner); windowing only above a threshold (the shared brief asks for windowing, so tests measure the list instead).
