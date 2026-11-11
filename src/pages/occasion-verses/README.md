# Occasion verse picker

`/occasion-verses`, on the tools hub as **Occasion verse picker** (Family and life events). The **one** tool for every
occasion's verses (owner's rule in `BibleProject/PROPOSED-IDEAS.md`): weddings by part of the service, baptisms,
confirmations, birthdays, the life-event packs and the funeral and sympathy pages. A new occasion extends this tool;
it never becomes a tool of its own. Built for sequence 41, step 9 (job 860, 2026-11-09). Design and its three reviews:
[docs/features/occasion-verses/design.md](../../../docs/features/occasion-verses/design.md).

## How it works

- **Occasions** come from `src/data/occasion-verses/index.ts`. The life-event packs (`src/data/life-events/`) and the
  funeral and sympathy sets (`src/data/sympathy/`) are read through adapters, so a pack or loss page added there appears
  here by itself; the picker's own data is the wedding's parts of the service (`wedding.ts`, an overlay on the wedding
  pack, which keeps every pack note), confirmation (`faith.ts`) and birthday (`birthday.ts`).
- **No server, no AI, nothing stored.** The occasion and Our list live only in the address
  (`?o=wedding&list=genesis-2-18-24,psalm-23-1-6`). List keys are the site's permanent passage keys
  (`passageKey` in `src/data/sympathy/card-keys.ts`), so a funeral-list link's keys work here too.
- **Words** are fetched per passage from the Berean files and kept for the visit; one book that fails leaves the rest
  shown, with Try again. References, notes and check boxes come from the data at once.
- **Long lists** are drawn with the site's `useRowWindow` (about 50 rows above and below the screen).
- **Certificates** (baptism, profession of faith or confirmation, baby dedication, wedding keepsake): fields outside any
  form, never saved, never in the address or title. One print at a time: only the chosen sheet is mounted.
- **Birthday by date:** [birthday-by-date.ts](../../data/occasion-verses/birthday-by-date.ts) holds a verse for every
  one of the 366 dates (filled in sequence 32 step 19). Under the passages of the Birthday occasion, "Your verse for
  your birthday" ([BirthdayDateField.tsx](../birthday-verses/BirthdayDateField.tsx)) offers Month and Day, shows that
  date's reference and note, adds its verse to Our list by its passage key (the date never enters the address), and
  links to the date's own page and card at `/birthday-verses/<month>-<day>` ([birthday verses](../birthday-verses/README.md)).
  Every date's verse is therefore also a list key ([index.ts](../../data/occasion-verses/index.ts)).

| File | What is in it |
|---|---|
| [OccasionVersesPage.tsx](OccasionVersesPage.tsx) | The page: the address, the occasion, printing one sheet at a time. |
| [OccasionChooser.tsx](OccasionChooser.tsx) | The occasions as links, by group. |
| [PassageRows.tsx](PassageRows.tsx) | An occasion's sections and passages, windowed. |
| [OurList.tsx](OurList.tsx) | Our list: order, remove, copy, print the readers' sheet (the funeral page's `ReadersSheet`). |
| [CertificateMaker.tsx](CertificateMaker.tsx), [CertificateSheet.tsx](CertificateSheet.tsx) | The certificate's fields, and the printed sheet. |
| [usePassageWords.ts](usePassageWords.ts) | References, reader links and the Berean words, loaded once. |
| [address.ts](address.ts) | Reading and writing the address (pure). |
| [text.ts](text.ts), [copy.tsx](copy.tsx) | The list as text, the certificate date, copying and the copy-by-hand box. |
| [art.tsx](art.tsx) | Its picture on the tools hub, in the Acts colour. |
| [occasion-verses.css](occasion-verses.css) | Its styles (`ov-` on screen, `ovc-` on the certificate). |

## Translation

Every word is plain text in this folder and `src/data/occasion-verses/`, so `content/translation/extract.py --pages`
collects it; the build's English check (`english_build_check.py`) found nothing unregistered on 2026-11-09. Verse words
stay English (`translate="no"`): they are the Berean. Names typed on a certificate are `translate="no"`.

## Checks

`npm test` runs [address.test.ts](address.test.ts), [OccasionVersesPage.test.tsx](OccasionVersesPage.test.tsx) (with
[test-kit.tsx](test-kit.tsx)) and `src/data/occasion-verses/occasion-data.test.ts`: every pack and set folded in, every
wedding-pack passage placed, every passage in the Berean, one key one excerpt, the committed keys, the birthday slot,
the address checks, Our list across occasions, Copy and copy by hand, a failed book, the certificate's privacy, one
print at a time, and the Tools hub entry.
