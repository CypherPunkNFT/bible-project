# Biblical converter: design

Sequence 41, step 1 (orchestrator job 842, 2026-11-09). Spec: PROPOSED-IDEAS.md, "Biblical converter (Tools)": one
converter for everything biblical — measurements (cubits, spans, reeds, stadia, Sabbath day's journey), weights
(shekels, talents, minas), money (denarii, shekels, talents into today's dollars, with a day's wage for context), dry
and liquid volumes, and anything else found. Answers searches like "how big was Noah's ark". Brief adds: show sources,
and say where values are scholarly estimates.

## 1. Where the numbers come from

Every modern equivalent is the **Berean Standard Bible's own footnote** for a verse that uses the unit (public domain,
already registered: `sources/ebible/engbsb`). The Berean prints a modern size for nearly every biblical measure, so the
tool needs no outside reference work and its numbers always agree with the Bible text the site quotes. Where Scripture
itself fixes a ratio (twenty gerahs to a shekel, Exodus 30:13; six long cubits to a reed, Ezekiel 40:5; a hundred
drachmas to a mina, Luke 19:13 note; the omer a tenth of an ephah, Exodus 16:36; the bath equal to the ephah, Ezekiel
45:11), the ratio is used and cited.

| Kind | Base | Unit (value in base) | Berean note |
|---|---|---|---|
| Length | metre | finger 0.0185 · handbreadth 0.074 · span 0.2286 · cubit 0.4572 · long cubit 0.533 · fathom 1.83 · reed 3.2 · stadion 185 · Roman mile 1480 · Sabbath day's journey 914.4 | Jer 52:21 · Ex 25:25 · Ex 28:16 · Gen 6:15 · Ezek 40:5 · Acts 27:28 · Ezek 40:5 · Luke 24:13 · Matt 5:41 · Acts 1:12 |
| Weight | gram | gerah 0.57 · beka 5.7 · pim 7.6 · shekel 11.4 · litra 340 · mina 570 (50 shekels) · talent 34,200 | Ex 30:13 · Ex 38:26 · 1 Sam 13:21 · Ex 30:13 · John 12:3 · Ezek 45:12 · 2 Sam 12:30 |
| Money | denarius (a labourer's day's wage) | lepton 1/128 · kodrantes 1/64 · assarion 1/16 · denarius 1 · drachma 1 · didrachma 2 · stater / shekel 4 · mina 100 · talent 6,000 | Mark 12:42 · Matt 5:26 · Matt 10:29 · Matt 20:2 · Luke 15:8 · Matt 17:24 · Matt 17:27 · Luke 19:13 · Matt 18:24 |
| Dry | litre | kab 1.22 · omer 2.2 · seah 7.3 · ephah 22 · lethech 110 · homer / cor 220 · choenix 0.91 | 2 Kgs 6:25 · Ex 16:16 · Gen 18:6 · Ex 16:36 · Hos 3:2 · Ezek 45:11 · Rev 6:6 |
| Liquid | litre | log 0.31 · hin 3.67 · bath 22 · metretes 39.4 | Lev 14:10 · Ex 29:40 · Isa 5:10 · John 2:6 |

Modern units shown beside them: centimetre, metre, kilometre, inch, foot, yard, mile; gram, kilogram, ounce, pound;
litre, US dry quart, US bushel; litre, US cup, US quart, US gallon. Money's modern units are **days' wages** and **US
dollars**.

### Estimates and disagreements (shown on the page, beside the unit)

Every biblical unit carries a confidence: **fixed by Scripture** (only a ratio to another unit), **close estimate**
(archaeology agrees within a few per cent: the shekel from inscribed stone weights, the common cubit), or **scholarly
estimate** (sizes differ by more than that). Notes the page states, all checkable against the Berean's own notes:
- **Cubit:** the common cubit is about 18 inches (45.7 cm); Ezekiel's "long cubit" adds a handbreadth (about 21 inches).
  The Berean uses 18 inches throughout; others use 17.5 to 20.6 inches.
- **Mina:** 50 shekels as a rule (Exodus 38:25–26 makes a talent 3,000 shekels), but 60 in Ezekiel 45:12.
- **Bath:** the Berean's Old Testament notes use about 22 litres (5.8 gallons), but its note on Luke 16:6 makes a
  bath about 33 litres: estimates really do differ, and the tool says so.
- **Pim:** known only from excavated stone weights (about 7–8 g); the Berean calls it "possibly" two-thirds of a shekel.
- **Sabbath day's journey:** 2,000 cubits comes from Jewish tradition built on Numbers 35:5 and Joshua 3:4, not from a
  verse that defines it.
- **Money:** the denarius is a day's wage (Matt 20:2), so the tool converts money **by work, not by metal**. A coin's
  silver is worth a few dollars today, which tells a reader nothing about what it bought. Old Testament silver was
  weighed, not coined, and wages differed: a priest's yearly pay in Judges 17:10 was ten shekels. The shekel's value
  of four days' wages is its New Testament exchange (the stater, Matt 17:27) and is marked as an estimate for earlier
  times.
- **Today's dollars:** the reader sets what a day's work earns where they live. The default is **$120** (8 hours at $15),
  shown as an editable field, never presented as a fact.

## 2. The page

Route **`/converter`** (its own address, like the other tools), title "Bible Measurements Converter: Cubits, Shekels,
Talents and Denarii". Sections, in the games/tools design language (st- and gm- classes, numbered sections):

1. **Hero:** kicker "Tools", heading, one-line lede, the tool's drawing (a balance with weights beside a measuring rod).
2. **01 Convert.** Five tabs (Length, Weight, Money, Dry measures, Liquid measures). An amount field and a unit choice
   (biblical units first, then modern ones, so it converts both ways). The result: one large line in metric and US
   units, then every unit of that kind with its value. Money adds the day's-wage field and shows days' wages and
   dollars. The unit's confidence and note are shown under the result. The amount and unit live in the address
   (`?unit=cubit&amount=300`), so any result can be linked and the back button works.
3. **02 Measurements in the Bible:** about 15 famous ones, each a row: Noah's ark, Goliath's height and armour,
   Solomon's temple, Og's bed, the bronze sea, the Sabbath day's journey, Emmaus, the New Jerusalem, the jars at Cana,
   thirty pieces of silver, the widow's two coins, the talents, the unforgiving servant, Mary's perfume, Ruth's
   gleaning, the manna. Choosing one fills the converter, shows the converted sizes, and quotes the verse in the Berean
   (loaded on choice from the site's own Berean files, one book at a time, with Retry on failure) with a "Read in
   context" link.
4. **03 Every unit:** one table per kind: name, how it relates to other units, metric, US, confidence, a verse link.
5. **04 Where these numbers come from:** the Berean footnotes, the ratios Scripture gives, the notes on disagreement,
   and the day's-wage choice.

Lists: about 45 units and 16 examples, short enough to render whole; the "about 50 rows each side" rule for long lists
is not triggered.

## 3. Code

All new files under `src/pages/converter/` (own folder, no shared file but the lines below):
- `units.ts` — the units table (pure data, numbers and English text), `convert()`, `formatAmount()`.
- `examples.ts` — the famous measurements (verse ids BBCCCVVV, parts of amount + unit).
- `ConverterPage.tsx` (routes), `Converter.tsx`, `Examples.tsx`, `UnitTables.tsx`, `Sources.tsx`, `art.tsx`,
  `converter.css`.
- Tests: `units.test.ts` (every unit converts round-trip, every Berean value matches its footnote within rounding,
  ratios Scripture gives hold, examples resolve to real units), `converter-page.test.tsx` (renders, converts, address
  state, money wage field, an example quotes the Berean via the life-events test kit's `serveBerean`, failure shows
  Retry).

Shared lines: one lazy import and one route in `src/App.tsx`; one title in `src/lib/page-head.ts`; one registry entry
in `src/pages/tools/registry.ts` (status live, path `/converter`, art imported from the tool's own folder so the
shared `art/` files are not touched), plus a "Study and reference" category if no sister has added one; one section
in `Website/SOURCES.md`; register page text the collector misses in `content/translation/page-register.json`.

Rules kept: no runtime AI, nothing sent anywhere, nothing stored (the wage is not saved); Berean quotations only;
numbers through `formatNumber` and counts through `plural` so the language nets stay clean; `npm test` (vitest),
`npm run build` (with the English build check) run before finishing. Never deployed.

## Review (three reviews before code, 2026-11-09)

Security and correctness, reliability, and edge cases were each reviewed once against the Berean notes and the code.
What changed in the plan because of them (the sections above are kept as first written; where they disagree, this wins):

- **Values corrected:** kab 1.24 L (a quarter kab is 0.31 L, 2 Kings 6:25), pim 7 g as the Berean gives it, hin 3.68 L
  (four quarter hins of 0.92 L). The **cor** is its own entry: 220 L by Ezekiel 45:14 (ten baths, like the homer) but
  about 350 L in the Berean note on Luke 16:7, so it is a scholarly estimate, like the bath (22 L or 33 L). The lethech
  is said to come from the Berean's alternative reading in its Hosea 3:2 note. The 50-shekel mina cites the Berean note
  on Ezekiel 45:12 ("elsewhere, the common mina was 50 shekels"). "The Berean uses 18 inches throughout" is wrong
  (Ezekiel 40–48 uses 21) and is not said. Claims with no source in the Berean ("others use 17.5 to 20.6 inches",
  "archaeology agrees within a few per cent") are dropped.
- **Every Berean note is stored word for word in units.ts** with its verse, and the tests check each unit's number
  against its own note. The project's USFM copy is checked too, but only when it is present (it is not in git).
- **Money and weight are kept apart.** The Greek mina (100 drachmas) and talent (6,000 drachmas: the Berean's "about
  twenty years' wages", at about 300 working days a year, an assumption the page states) are coin counts. Old Testament
  silver was weighed: the silver shekel is valued at four days' wages from the New Testament exchange (the four-drachma
  stater "worth approximately one shekel", Matthew 17:27) and marked an estimate, and a talent of silver (3,000 shekels)
  is shown as about 12,000 days, also an estimate. The thirty pieces of silver and Goliath's height (the Berean's other
  reading: four cubits and a span, about 6 feet 9 inches) are marked as estimates with their reasons.
- **Address:** `?kind=money&unit=talent&amount=10000`. The unit is looked up only among its kind's own units (a Map);
  an unknown kind or unit, or an amount that is not a plain number (digits with one decimal point or comma, at most
  1e12, not negative) falls back to the defaults. Typing replaces the address entry; choosing an example adds one. The
  raw address text is never shown. The day's wage is not in the address, and the page says a shared link uses the
  reader's own wage.
- **Numbers:** about three significant figures, trailing zeros dropped; "≈" or "about" before any estimate; modern units
  through `formatNumber(n, { style: "unit" })` (metre, foot, …, litre, gallon), quarts, cups and bushels through
  `plural()` with both forms written out, dollars through `formatNumber` currency, compact above a million. A
  coin worth less than a day shows the work time it stood for (minutes or hours of an eight-hour day).
- **"Anything else found":** old English names are shown beside the units (mite, farthing, penny, pound, firkin), plus
  the gomed (Judges 3:16) and a short "no fixed size" list with no invented numbers: a day's journey (Luke 2:44), a
  stone's throw (Luke 22:41), a bowshot (Genesis 21:16), a yoke of land (1 Samuel 14:14, Isaiah 5:10).
- **Accessibility and phones:** the kind choice is a group of pressed buttons; units are a native select with "In the
  Bible" and "Today" groups; the result is a polite live region; wide tables sit in a labelled, focusable scroll area.
- **Verse loading** follows countdowns' usePassages (a retry count in the key); a verse the Berean lacks shows its
  reference and link alone.
- **Tools page:** its test pins the count at ten, which any new tool breaks; it now checks that the approved ten are all
  still there instead. The new category is key `"study"`, "Study and reference", for the sister study tools too; the
  converter takes the `history` colour. Tools in one category need different colours (a test), and there are seven, so
  later sisters may need to sit in other categories.
