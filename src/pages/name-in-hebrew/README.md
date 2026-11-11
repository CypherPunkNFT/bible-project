# Your name in Hebrew, Greek and Aramaic

`/name-in-hebrew`, on the tools hub as **Your name in Hebrew, Greek and Aramaic** (Family and life events, beside
Biblical baby names). Type a name and see it in Hebrew, Greek and Aramaic (Syriac letters, with the square letters
under them), spelled by sound and marked as approximate; for a Bible name, also as Scripture writes it, with its
meaning, how sure that meaning is, and a link to its baby-names page. Built for sequence 41, step 8 (job 859,
2026-11-09); design and its three reviews: `docs/features/name-in-hebrew/design.md`.

## How it works

- **No server, no AI, nothing stored.** Spelling by sound is fixed rules in the browser. The name lives only in the
  address (`?name=David`), so a result can be shared; nothing is saved or sent.
- **Bible names** come from the Biblical baby names data (`data/baby-names/`, through `useBabyNames.ts`, sharing its
  cache): the index gives the meaning at once; the one name file gives the original spellings and any caution. Only a
  slug taken from the index is ever fetched. While the index loads there is no verdict; if it fails, the spellings by
  sound still show, with Try again.
- **Where each spelling comes from** is said on it: *In the Bible* (the Hebrew of an Old Testament name, the Greek of a
  New Testament one or the Greek form Strong's gives), *The Hebrew name behind it* (James: Jacob), *The Aramaic name in
  the Bible* (Cephas, Thomas, Tabitha, Yeshua, with their verses), *The Hebrew letters, in Aramaic script*, *The Bible
  word* (Grace, Faith, God), or *By sound*. Names of God (God, LORD, Yahweh, Christ…) and Jesus typed as the Bible
  spells it get no spelling by sound.
- **By sound**: English spelling → sounds (`sounds.ts`, with a list of names whose spelling misleads the rules in
  `sounds.json`), then sounds → letters (`transliterate.ts`): Hebrew as Israelis write foreign names today, Greek as
  Greeks do today, Aramaic with its 22 old letters.

| File | What is in it |
|---|---|
| [NameInHebrewPage.tsx](NameInHebrewPage.tsx) | The page: form, examples, result, notes. |
| [NameMeaning.tsx](NameMeaning.tsx) | The meaning, or a plain "isn't spelled this way in the Bible". |
| [ScriptCard.tsx](ScriptCard.tsx) | One card: each spelling, its source, its letters one by one, Copy. |
| [PrintCard.tsx](PrintCard.tsx) | The printable card (the life-event print module). |
| [bible-spelling.ts](bible-spelling.ts) | Finding a name in the Bible and choosing Scripture's spellings (pure, tested). |
| [input.ts](input.ts), [sounds.ts](sounds.ts), [transliterate.ts](transliterate.ts) | Cleaning what is typed, English → sounds, sounds → letters (pure, tested). |
| [useNameFiles.ts](useNameFiles.ts) | Loading the name files found. |
| [sounds.json](sounds.json), [letters.json](letters.json) | The rule tables and letter names (JSON, so the translation collector never takes them for page text). |
| [aramaic-names.json](aramaic-names.json) | The four Aramaic names Scripture gives, by hand, with verses. |
| [hebrew-behind.json](hebrew-behind.json), [bible-words.json](bible-words.json) | Built by `scripts/name-in-hebrew/build_name_forms.py` from Strong's and the baby-name files; rebuild after the baby-name data changes. |
| [word-texts.ts](word-texts.ts) | What the page says about each Bible word. |
| [fonts/](fonts/) | The Syriac font file and its licence (SIL OFL 1.1). |
| [art.tsx](art.tsx) | Its picture on the tools hub, in the revelation colour. |
| [name-in-hebrew.css](name-in-hebrew.css) | Its styles (`nh-` classes) and the Syriac `@font-face`. |

## Translation

The page's words are plain text in the page code, collected by `content/translation/extract.py --pages`;
`english_build_check.py` finds nothing unregistered. Spellings, letter names, the typed name and the example names are
`translate="no"`: they are names, and the translator would otherwise turn "Grace" into another language's word. The
three example names the collector flagged are ruled English on purpose in `content/translation/unregistered-reviewed.json`.

## Checks

`npm test` runs [transliterate.test.ts](transliterate.test.ts) (the input rule, the sound rules, each script's letters),
[bible-spelling.test.ts](bible-spelling.test.ts) (Scripture's spellings on the real baby-name files: David, John,
Jesus, Peter, Melchi, Amos, Daniel; every Bible word's verse checked against the Berean) and
[NameInHebrewPage.test.tsx](NameInHebrewPage.test.tsx) (shared links, the form, aliases, names of God, the offline
case and Try again, Copy, Print, the registry entry). The last two need the git-ignored `data/baby-names/`, as the
baby-names tests do.
