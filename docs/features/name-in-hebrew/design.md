# Your name in Hebrew, Greek and Aramaic — design

Sequence 41, step 8 (job 859, 2026-11-09). Idea: `BibleProject/PROPOSED-IDEAS.md` (Tools, batch 2) and the demand
research in `BibleProject/docs/research/bible-tools-demand.md` (rank 2: "No tool found that does all three").

## 1. What the visitor gets

Address `/name-in-hebrew` (the phrase people search; the page title names all three languages). One box: "Your name".
Type a name, press **Show**; the name goes into the address (`?name=David`) so a result can be shared or bookmarked.
Example chips: David, Sarah, John, Mary, Jesus, Peter, Emma, Olivia, Michael.

Four cards, side by side on wide screens, stacked on phones:

| Card | Script | Direction |
|---|---|---|
| Hebrew | square Hebrew letters | right to left |
| Greek | Greek alphabet | left to right |
| Aramaic | the same square letters (Aramaic was written in them; the Hebrew "square script" is Aramaic's) | right to left |
| Aramaic, Syriac script | Estrangela Syriac letters | right to left |

Each card can carry two lines:
- **As the Bible writes it** — only when the name is a Bible name and the original spelling is known (§3). Hebrew with
  its vowel points, Greek as in the Greek New Testament / Strong's, Aramaic as the Hebrew consonants (no points) in
  square and Syriac letters, or a hand-checked Aramaic form where Scripture itself gives one (§3.3).
- **By sound** — always. Spelled by sound from the English spelling, rule by rule (§4).

Under each spelling, its letters one by one with their names (right to left for Hebrew/Syriac: "ד dalet · ו vav · ד
dalet"), so a visitor can check and copy it. A **Copy** button per spelling (clipboard API; quietly hidden when absent).

A plain notice above the cards, always: "Spelled by sound, so it is approximate. Hebrew, Greek and Aramaic have sounds
English lacks and lack some English has, and there is more than one fair way to write most names. Before a tattoo or
an engraving, ask someone who reads the language."

**Meaning.** If the name is in the Bible (§3.1): its meaning headline and how sure it is (Given in the Bible /
Probable / Uncertain, the baby-names labels), who bore it (one line), how many verses name it, and a link "Everything
about the name David" to `/baby-names/david`. If it is not: "Emma is not a name in the Bible, so it has no biblical
meaning here. The spellings below are by sound only." No invented meanings, ever.

**Print.** A Print button prints one card (the name, the four spellings, the meaning line, the approximate note) through
the life-event print module (`PrintPortal`, `usePrintSheet`, `canPrint`, `defaultPaper`), hidden where printing does not work.

No long lists on this page, so the 50-rows-each-side rule has nothing to apply to.

## 2. Privacy and cost
Everything runs in the browser. The only network reads are the site's own baby-name files (`/data/baby-names/index.json`,
about 320 KB, once per visit, and one `names/<slug>.json` for a Bible name), through the baby-names page's own loaders
(`loadNamesIndex`, `loadNameDocument` in `src/pages/baby-names/useBabyNames.ts`), so both pages share one cached copy.
Nothing is stored. No AI, no server. The name lives only in the address.

## 3. Bible names
### 3.1 Finding the name
`nameSlug(input)` (the baby-names slug rule). Found in `index.names` → that row; else in `index.aliases` → the row it
points to (so "Elias" finds Elijah, shown as "Elias is another spelling of Elijah"). Otherwise not a Bible name.
Input: trimmed, at most 40 characters, letters (any Latin with accents, apostrophe, hyphen, space) only; anything else
is dropped with a note "Only letters are spelled". Two words (e.g. "Mary Magdalene") are tried whole first, then the
sound spelling is done word by word.

### 3.2 Original spellings
From the name file's `originals[0]` (and the others listed, if more than one person/word, shown as "also"):
- `script: "he"` → Hebrew = `word` (pointed). Greek = first form of `greek[0].word` if present.
- `script: "grc"` → Greek = `word`. Hebrew = the Hebrew word of the first `H` number in `meaning.chain` (e.g. John:
  G2491 → H3110 יוֹחָנָן), from a small table built once from Strong's Hebrew dictionary (§5). None → sound only.
- Aramaic square = the Hebrew spelling with points and cantillation removed (U+0591–U+05C7), letters only; Syriac = those
  consonants mapped letter for letter (final forms to plain) to Syriac (U+0710–U+072C). Labelled honestly: "Aramaic
  keeps the Hebrew letters; the Aramaic Bible (the Peshitta) may spell it a little differently."

### 3.3 Hand-checked Aramaic forms (where Scripture gives the Aramaic)
A small cited table, `aramaic-forms.ts`:
- **Jesus** — Yeshua: Hebrew יֵשׁוּעַ (Strong's H3442, the form of Joshua's name in Nehemiah 8:17 and the late books),
  Aramaic ישוע / ܝܫܘܥ (as the Peshitta writes it). Overrides the H3091 chain.
- **Peter** — Cephas, Aramaic כיפא / ܟܐܦܐ: "You will be called Cephas (which is translated as Peter)" (John 1:42, BSB).
- **Thomas** — Aramaic for "twin", תאומא / ܬܐܘܡܐ: "Thomas called Didymus" (John 11:16, BSB; Didymus is Greek for twin).
- **Tabitha** — טביתא / ܛܒܝܬܐ: "Tabitha (which is translated as Dorcas)" (Acts 9:36, BSB).
Each shows its verse reference linked to the reader. The verses are quoted only by reference, not by text, to keep the
BSB wording rule simple.

## 4. Spelling by sound (rule-based, `transliterate.ts`, pure and tested)
Two stages:
1. **English spelling → sounds.** Lower-case, accents folded, then a longest-match scan with English name rules:
   doubled letters single; `ph`→f; `th`→th; `sh`, `sch`→sh; `ch`, `tch`→ch (as in Charles); `ck`, `q`, `c` before a/o/u/
   consonant → k; `c` before e/i/y → s; `g` before e/y → j, else g; `gh` at the start → g, elsewhere silent; `kn`/`wr`
   at the start → n/r; `x` → ks (at the start, z); `qu` → kw; `wh` → w; `j` → j; `y` before a vowel at the start → y,
   otherwise the vowel i; `tz`/`ts`→ts. Vowels: a, e, i, o, u; `ee`/`ea`/`ie` → i; `oo` → u; `ai`/`ay`/`ei`/`ey` → ei;
   `oa` → o; `au`/`aw` → o; `ou`/`ow` → au at the end, o mid; `oi`/`oy` → oi; a final silent e after one consonant makes
   the vowel before it long (Kate → k-ei-t, Mike → m-ai-k, Rose → r-o-z, Luke → l-u-k). A small table of ~80 common
   English names whose spelling misleads the rules (Michael, Stephen, Sophia, Chloe, Zoe, Charlotte, Isaiah, Leah …)
   gives their sounds directly; it is data, not code, and tested.
2. **Sounds → each script**, one table per script:
   - Hebrew (modern Israeli conventions for foreign names): b ב, v ו (וו inside a word), g ג, j ג׳, d ד, h ה, w ו (וו
     inside), z ז, zh ז׳, kh ח, t ט, y י, k ק, l ל, m מ, n נ, s ס, f פ, p פ, ts צ, ch צ׳, sh ש, r ר, th ת׳, dh ד׳.
     Vowels: a and e unwritten inside a word; i י; o, u ו; ei, ai יי; oi וי; au או. A word starting with a vowel takes
     א first; a vowel after a vowel takes א between. Final a → ה, final e → ה, final i → י, final o/u → ו. Final forms
     ך ם ן ף ץ at the end.
   - Aramaic (square and Syriac): the same letters, but no ׳ marks (they are modern Hebrew): j → ג, ch → צ, zh → ז,
     th → ת, dh → ד, v → ב, f → פ; t → ט; final a → א (the Aramaic ending); final e → א; else as Hebrew. Square
     letters take final forms; Syriac mapping as in §3.2.
   - Greek (Koine-style letters, no accents): b β (μπ is modern, so not used), v β, g γ, j τζ, d δ, h nothing, w ου,
     z ζ, kh χ, t τ, y ι, k κ, l λ, m μ, n ν, s σ, f φ, p π, ts τσ, ch τσ, sh σ, zh ζ, r ρ, th θ, dh δ, ks ξ, ps ψ.
     Vowels a α, e ε, i ι, o ο, u ου, ei ει, ai αϊ, oi οϊ, au αου. Final σ → ς. First letter capital.
The letter-name lists are tables too (Hebrew, Greek, Syriac).

## 5. Data built once
`scripts/name-in-hebrew/build_hebrew_forms.py` reads the Greek-origin name files in `data/baby-names/names/` and Strong's
Hebrew (`../sources/openscriptures/HebrewLexicon/HebrewLexicon-master/HebrewStrong.xml`, already registered: text public
domain, edition CC BY 4.0, Open Scriptures), and writes `src/pages/name-in-hebrew/hebrew-forms.json`:
`{ "H3110": "יוֹחָנָן", … }` for every H number that is the first in some Greek name's chain, plus H3442. A few KB,
bundled with the page. Credit line on the page: "Hebrew and Greek spellings: Strong's Concordance (Open Scriptures
edition); people and meanings: the site's Biblical baby names."

## 6. Fonts
Hebrew: the site's Noto Serif Hebrew (already loaded site-wide). Greek: Literata (the site's serif has a Greek subset).
Syriac: new — `@fontsource/noto-sans-syriac` 5.3.0 (SIL OFL 1.1, free, no service), imported only by this page's CSS so
only this page downloads it (the Syriac subset only, via the package's per-subset CSS if it has one). Registered in
`Website/SOURCES.md`. Without it most phones and Windows have no Syriac font and show boxes.

## 7. Files
All new, in `src/pages/name-in-hebrew/`: `NameInHebrewPage.tsx` (page), `ScriptCard.tsx`, `NameMeaning.tsx`,
`PrintCard.tsx`, `transliterate.ts` (+ `sounds.ts` English rules, `scripts.ts` per-script tables, `common-names.ts`),
`aramaic-forms.ts`, `bible-spelling.ts` (§3), `hebrew-forms.json`, `art.tsx` (hub picture), `name-in-hebrew.css`,
`README.md`, tests: `transliterate.test.ts`, `bible-spelling.test.ts`, `NameInHebrewPage.test.tsx`.
Shared, one line each: `src/App.tsx` (lazy import + route), `src/lib/page-head.ts` (title), `src/pages/tools/registry.ts`
(import + live entry, category `family` beside Biblical baby names, a tone no other family tool uses: `revelation`),
`content/translation/page-register.json` (only words the collector misses), `Website/SOURCES.md` (font + Strong's use),
`package.json` (the font dependency).

## 8. Translation
Page text is plain JSX text, which `content/translation/extract.py --pages` collects; table data shown on screen (card
titles "Hebrew", "Greek", letter names?) — letter names and the spellings are marked `translate="no"` (they are names,
not English prose). One-word labels the collector skips are registered in `page-register.json`, as the word counter did.
Run `py -3.12 content/translation/english_build_check.py` to prove nothing unregistered.

## 9. Tests
- `transliterate.test.ts`: fixed expectations for ~25 names in each script (David, Sarah, Emma, Olivia, Michael, Kate,
  Charlotte, Chloe, Liam, Noah, Zoe, Jack, Sophia, Harper, Mia …), final forms, vowel-start aleph, hiatus aleph, no
  Latin letters left in any output, Greek final sigma, Syriac only Syriac letters, empty and junk input.
- `bible-spelling.test.ts`: David (Hebrew דָּוִד, Aramaic דוד/ܕܘܕ, Greek Δαυείδ), John (H3110 יוֹחָנָן via the
  table), Jesus override, Peter override, every entry in hebrew-forms.json is Hebrew letters only.
- `NameInHebrewPage.test.tsx` (stubbed fetch serving the real baby-name files): shared link `?name=David` shows the
  meaning and a link to /baby-names/david; a non-Bible name says so; the form writes `?name=`; alias finds its name;
  the registry entry is live at the page's address.

## Review (three cycles, 2026-11-09) — what changed

Three independent reviews ran before any code: security and correctness, reliability and failure modes, edge cases and
product fit. Where this section and the body above disagree, this section wins.

**Layout.** Three cards, not four: **Hebrew**, **Greek**, **Aramaic** (the Aramaic card shows the Syriac spelling and,
under it, the same name in square Aramaic letters). The square-Aramaic card was a near-copy of the Hebrew one.

**Honest labels** (cycles 1 and 3):
- "In the Bible": only a spelling Scripture itself uses: the Hebrew of a Hebrew-origin name, the Greek of a New
  Testament name or the Greek form Strong's gives.
- "The Hebrew name behind it": a New Testament name's Hebrew original from Strong's chain (James → יַעֲקֹב, "Jacob"),
  with that original's English name. Kept only when Strong's tags the entry a proper name (`pos` starts `n-pr`; Melchi's
  מֶלֶךְ "king" is dropped) and the name file has no Hebrew original of its own (Amos/Amon quirk).
- Aramaic derived from a Hebrew spelling: "The Hebrew letters, written in Aramaic script". No claim about the Peshitta
  (no Peshitta text is in the project's sources, so none is cited). Sin (U+05C2 dot) maps to ܣ before points are removed.
- Hand-checked Aramaic names that Scripture itself gives, keyed by Strong's number: G2424 Jesus → Yeshua (H3442
  יֵשׁוּעַ, Nehemiah 8:17), G4074 Peter and G2786 Cephas → כיפא / ܟܐܦܐ (John 1:42), G2381 Thomas → תאומא / ܬܐܘܡܐ
  (John 11:16), G5000 Tabitha → טביתא / ܛܒܝܬܐ (Acts 9:36). Labelled "The Aramaic name in the Bible" with the verse.
- Every `word` is split on ", " (first form used; Daniel, Iddo); spaces and the maqaf (U+05BE) are word breaks;
  cantillation (U+0591–U+05AF, U+05BD, U+05C0, U+05C3) is removed from the pointed line.
- At most one "also" spelling, only when it belongs to different people and differs in its bare letters.

**Bible words and names of God** (cycle 3, critical): God, Lord, Yahweh, Jehovah, YHWH, Elohim, Christ, Messiah,
Christian, and the word-names Grace, Faith, Hope, Joy, Peace, Love, Amen, Hosanna, Selah are never told "not in the
Bible". A small table (`bible-words.json`, built from Strong's) gives the Hebrew and Greek word and a verse reference.
Names of God get no by-sound line; word-names keep it ("Grace" as a name, by sound) under the Bible word.

**Meaning** (cycles 2 and 3): from the index row (`m`, `l`, `w`, `c`, `x`, `f`), so it shows without the name file. The
name file adds the originals and its `caution` (Delilah, Jezebel…), shown under the meaning. Labels as the name pages
word them; "Meaning uncertain" shown once, with no badge. `x` → "(for the best-known bearer)". Aliases: "Found under
Elijah (also written Elias)". Not found: "Emma isn't spelled this way in the Bible (only exact Bible spellings are
matched), so there is no biblical meaning to show. The spellings below are by sound only." Two words not found whole:
each word looked up.

**Loading and failure** (cycle 2): the by-sound spellings are worked out at once and never wait for the network. While
the index loads: no verdict. Index failed: "We couldn't check the Bible names just now" + Try again. Name file failed:
meaning stays, "The original spelling couldn't be loaded" + Try again. The name file is fetched only with the slug from
the index row.

**Input** (cycle 1): fold ß æ ø ł đ þ œ ı before the slug; keep Latin letters (`\p{Script=Latin}`), spaces, hyphens
and apostrophes; drop everything else (direction marks included) and say "Only Latin letters are spelled"; cap 40 code
points after normalising; same filter for `?name=` and the form; ALL CAPS shown in title case. The echoed name sits in
`<bdi translate="no">`.

**Sound rules** (cycles 1 and 3): the tables (English rules' exceptions, the common-names list, each script's letters,
the letter names) live in JSON, so the translation collector never mistakes them for page text. Added: final -y/-ey
after a consonant → i; final -ow → o; y before one consonant + vowel/silent e → ai; -iel → y-e-l; chr/chl → kr/kl;
ew → u; igh → ai; final -es after one consonant → silent e + z; final h after a vowel silent; gi + vowel → j;
apostrophes dropped; hyphen splits words. Accented names (José, Jesús) are looked up in the common-names list before
folding; Spanish rows use kh for j. Hebrew: final p stays פ (only f takes ף); the final-vowel rule wins over the
vowel-after-vowel א (Olivia אוליביה); v is ו at the start and ב inside or at the end (modern usage: סטיבן); an initial
vowel gets one א. Greek follows how Greek writes foreign names today (b μπ, d ντ, g γκ, j τζ, ch τσ), not Koine, and
"ay" is εϊ; the label says so. One sentence added to the notice: a spelling by sound may happen to spell a Hebrew word;
it does not carry that word's meaning.

**Fonts** (cycle 2): no new npm dependency (sister jobs have uncommitted package edits). The one Syriac file from
`@fontsource/noto-sans-syriac` 5.3.0 (`noto-sans-syriac-syriac-400-normal.woff2`, 16,932 bytes, SHA-256
`b3cd4308…68ba23`) and its OFL licence are copied into the page folder with an `@font-face` limited to U+0700–074F.
Printing waits for the faces with `useFontsReady`, asked with sample text so the unicode-range subsets really load.

**Translation** (cycle 2): sentences that carry a name are each one template string; counts use `plural()`; the name,
example chips, spellings and letter names are `translate="no"` (the translator would otherwise turn "Grace" into another
language's word). Labels in `.ts` that the collector misses go in `page-register.json`. `english_build_check.py` is
judged on this page's files only (it fails today on sister jobs' unfinished pages).

**Tests** add an offline case (index 503 → sound spellings still show, Try again recovers), a Melchi/proper-name check,
Daniel's two forms, Moses' one "also", the Bible-words verse references against the BSB files, God and Grace, and the
exact 22 Syriac letters. `window.print` is stubbed. The page tests read the git-ignored `data/baby-names/`, as the
baby-names tests already do.

**Registry**: category `family` (beside Biblical baby names), tone `revelation` (free in that category); the family
category's line gains "your name in Hebrew".
