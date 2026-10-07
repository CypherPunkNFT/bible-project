# Letters pages: every quotation checked against the real words

**Date:** 2026-10-07 · **Owner's request:** "make sure the words we quote are the words they wrote" (no printed scans) ·
**Texts used:** the readable-text copies listed in [WORKS.md](WORKS.md) (this mission's library), the site's own King James
text, and nothing else except the two web pages named under "Left open".

## What was checked

Every passage inside quotation marks in the five Letters data files
([overview.json](../../../../../src/data/letters/overview.json), [paul-letters.json](../../../../../src/data/letters/paul-letters.json),
[hebrews.json](../../../../../src/data/letters/hebrews.json), [general-letters.json](../../../../../src/data/letters/general-letters.json),
[john-letters.json](../../../../../src/data/letters/john-letters.json)): **1,096 quoted passages**. Each was searched for in the
text of every work its claim cites (spacing, line breaks, hyphens split across lines and garbled Greek ignored), then in
the King James Bible, then in every other held work. Every passage not found word for word was read by hand.

| Result | Count |
|---|---:|
| King James wording, word for word (Scripture quoted as Scripture) | 643 |
| Found word for word in a work the claim cites | 348 |
| Found, with only footnote numbers or a clipped ending different | 7 |
| Found word for word in the work a note names (the note carries no citation list) | 5 |
| The King James Bible's printed closing notes ("sent by Phebe", "from Corinthus", "from Philippi") | 4 |
| Lightfoot's 1891 translations of Clement and Ignatius, found word for word (see "Left open") | 3 |
| **Misquoted: wrong or missing words, now corrected** | **10** |
| **Words belonging to a different work than the one credited, now credited correctly** | **2** |
| **Not found in any cited work, now replaced with the source's real words** | **1** |
| Not quotations: word meanings, names of views, book titles | 25 |
| Not quotations: article and section titles inside the citation entries | 48 |

57 of the word-for-word matches are in the 1915 encyclopedia (International Standard Bible Encyclopedia, ISBE) articles,
in line with the earlier ISBE check (commit `a25e76bf`).

## Every fix (before → after)

**Misquotes corrected**

1. Overview, how the letters were collected: Polycarp sends "the Epistles of Ignatius ... and all the rest which we have by
   us" → "... and all the rest [of his Epistles] which we have by us" (the translator's bracket had been dropped).
2. Overview, Ignatius in the early witnesses: ("Where is the wise? Where is the disputer?") → ("Where is the wise man? where
   the disputer?"), the wording of the cited Ante-Nicene Fathers translation. (Paul's page keeps the first wording: it cites
   Lightfoot's translation, which reads exactly that.)
3. Overview, Tertullian: as from "a comrade of the apostles" → as from a "comrade of the apostles" (his words are "one
   particular comrade of the apostles").
4. Overview, the name "catholic": Theodoret's "not addressed to single churches, but generally to the faithful" → "... but
   generally (katholou) to the faithful", as Pratt (ISBE) prints it.
5. Overview, Cain: Abel's sacrifice was "more excellent than Cain" → Abel offered "a more excellent sacrifice than Cain"
   (Hebrews 11:4).
6. Overview, Christ's coming: Christ "shall appear the second time" → Christ will "appear the second time" (Hebrews 9:28
   reads "shall he appear").
7. Paul, where 2 Corinthians was written: when he "was come into Macedonia" → when "we were come into Macedonia"
   (2 Corinthians 7:5).
8. Paul, Irenaeus: "the Second to the Corinthians" → "the second Epistle to the Corinthians".
9. James, Peter and Jude, the faith-and-works question: "justified by works, and not by faith only" → "by works a man is
   justified, and not by faith only" (James 2:24).
10. Letters of John, the heavenly witnesses question: "the three that bear record in heaven" → the "three that bear record
    in heaven" (1 John 5:7 reads "there are three").

**Credited to the right work**

11. Paul, who wrote the pastoral letters: Tertullian's "all treat of ecclesiastical discipline" was credited only to
    Eusebius, Schaff and two ISBE articles; Tertullian's Against Marcion (the cited 1885 translation) is now credited too.
12. Paul, was he released: "farthest bounds of the West" is Lightfoot's translation of Clement, but this view cites only
    Conybeare and Howson → now their own words: Clement's "extremity of the West" (Conybeare and Howson's rendering) may
    simply mean Rome: Wieseler translated the words as the sovereign of Rome, and Schrader argued they cannot mean Spain
    because Paul was not martyred there.

**Not found anywhere**

13. Paul, 2 Thessalonians: Walker never wrote "watch, for it may be soon" → Jesus' own teaching, Walker notes, holds
    together the call to "watch, for in such an hour as they think not the Son of man cometh" and the warning that "the end
    is not yet". Walker's citation now reads "checked against CrossWire's digital ISBE (1915), 2026-10-07".

## The 16 claims left open by the ISBE check

| # | Claim | Settled how |
|---|---|---|
| 1 | Walker on 2 Thessalonians | Fix 13 above; his citation note updated. |
| 2 | Renan's four copies of one circular letter, credited to Moule | Moule never mentions it. Lightfoot's Philippians (1878, already cited on the page) does: Renan "supposes that an editor has combined four copies of the same encyclical letter". The claim now cites Lightfoot instead of Moule. |
| 3 | An Ephesian imprisonment argued from Philemon's request for a lodging | No held work makes that argument. Removed from Philemon's "written from" and from the Ephesus answer to the prison question. What the sources do say is put in its place: Robertson (ISBE) reported in 1915 "a growing opinion" for Ephesus (Deissmann, Lisco, Albertz, Bacon); Robertson is now cited and named among those who hold it. |
| 4 | "Robertson gives 52-53" for 1 and 2 Thessalonians | 52-53 is his figure when he follows Lightfoot's grouping; his own chronology ends the Corinth stay by the autumn of 52, more probably 51, so the letters "cannot be later than this date". Both date notes now say so; 2 Thessalonians' date range starts at 51. |
| 5 | Riggs on Clement: "Romans and 1 Corinthians" | Now "Romans, Corinthians", his words. |
| 6 | Riggs on Origen: James and Jude together | Now: Riggs says Origen gives "sure witness to Jude" but wavers over James. |
| 7 | Theodoret's quotation drops "(katholou)" | Fix 4 above. |
| 8 | Hebrews as a "synagogue sermon in Acts" with no source | The verse is now named in the text (Acts 13:15, already in the claim's verse list). |
| 9 | Rees on "I" and "we" under the case against Priscilla and Aquila | Rees answers Harnack, who read the change between "I" and "we" as two writers. Now: Harnack's argument is under "For", and Rees answers Harnack that Paul too moves between "I" and "we", in Romans for one. |
| 10 | Counts of "hope" (1 Peter) and "full knowledge" (2 Peter) credited to Moorehead (ISBE) | Recounted in the site's Greek texts (Tischendorf, the Textus Receptus and the King James Strong's tags agree: hope 3 and to hope 2; full knowledge 4 and knowledge 3). Both counts are now credited to the site's Greek text; Moorehead keeps "the epistle of hope" and the key words. |
| 11 | Chase's date for Jude "about 80" | Moorehead gives Chase "not later than 80". Both places now say so; Mayor and Lumby keep "about 80" (Mayor: "nearer 80 than 70"). |
| 12 | Erasmus's dates 1516-1522, in neither cited article | The dates are in Schaff's list of commentaries (History of the Christian Church, vol. 1, § 100): Erasmus's annotated Greek New Testament 1516, his Paraphrase 1522, and Cajetan's commentary 1531. The claim now says "At the Reformation" (Hayes and Moorehead's words) and gives those dates from Schaff, now cited. |
| 13 | Counts of "truth" in 2 John credited to Law | Confirmed (5 in 2 John, 9 in 1 John) and credited to the site's Greek text; Law keeps "the keynote". |
| 14 | Law on 3 John 10 | Law reads it as a threat of expulsion, Plummer as expulsion, Brooke leaves it open; the claim now says each. |
| 15 | "(As reported by Law)" on "I wrote unto the church" | Law reports Zahn, Schmiedel and Findlay; Brooke's own book gives Harnack's reasons and his own (both cited). The note now says that. |
| 16 | Law says 1 John names no one but the Lord, against "Cain is the only person named" | Law is no longer cited for that claim; it now rests on Plummer (Cain "the typical instance" of a brother's hate) and Westcott (one of two "archetypal patterns"). |

## Left open

- **Lightfoot's 1891 translations of 1 Clement and Ignatius are not in the library.** The works table maps both citations to
  the Ante-Nicene Fathers volume, whose wording differs. The three quotations from them were checked against the
  earlychristianwritings.com transcriptions the page links (read, not stored). **Closed 2026-10-07:** both are now held (1 Clement, To the Ephesians and To the Smyrnaeans; [REPORT.md](REPORT.md#addendum-2026-10-07), WORKS.md rows 79-80).
- The card lead "How "the three that bear record in heaven" entered the printed Bible" in
  [pages-collections.tsx](../../../../../src/components/letters/browse/pages-collections.tsx) has the same small slip as fix 10;
  it is page code, not data, and was left for the next page change.
- Mayor's 1907 Jude and 2 Peter text file (archive.org) contains a passage of Lightfoot's Philippians; it did not affect any
  result.
