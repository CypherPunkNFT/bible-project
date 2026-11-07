# New Testament history: design record

The page: `/study/new-testament-history` (not yet built). Its evidence and limits: [the research record](../43-new-testament-history.json). Its verses, years and counts: a data build still to be written, `scripts/build-nt-history-study.py`.

## What this page is for

A reader hears that there is no evidence Jesus existed, that Luke got the census wrong, or that "the Jews killed Jesus". They meet three different Herods in three chapters and are told they are one man. This page lets them leave able to do five things:

- say which Herod a verse means;
- name the four outside writers and what each can and cannot show;
- set out the birth and death years with their holders;
- tell a fixed point in Paul's life from a reckoning built on it;
- tell the revolt from Josephus while knowing where Josephus was standing.

The question it carries: what fixes this date — a ruler, a record, or a reckoning?

## The material's own shape

The New Testament dates itself by naming rulers. Luke 3:1–2 is the clearest case. It names seven people to fix one year: Tiberius, Pilate, Antipas, Philip, Lysanias, Annas and Caiaphas. Luke 2:1–2, Acts 12, Acts 18:12 and Acts 24:27 work the same way. Each name is a thread that can be followed out of the Bible into coins, inscriptions and the historians.

So the page's shape is a synchronism: rulers as lanes, and each New Testament anchor as a line crossing them. Where the line meets a lane, that ruler fixes it. Then the question becomes whether that ruler's own date is a fixed point or a reckoning.

## Directions, and one honest gap

The study standard asks for three or four mock-ups and a stop for the owner to choose. That stop is not possible inside a remote job. So three directions were weighed in writing, one is recommended, and the choice is the owner's.

1. **A lattice of reigns (recommended).** There are four lanes: Rome, Herod's family, the governors of Judea, and the New Testament. Every reign is a bar, drawn as a range where the record gives a range. Choosing an anchor (Luke 3:1, the forty-six years, Gallio, Festus) draws a vertical line and lights each ruler it touches. Each ruler's bar is marked solid where an outside record fixes it and hatched where it is reckoned. Disputed years are drawn twice and labelled, never merged:
   - Herod's death in 4 BC or 1 BC;
   - the cross in AD 30 or 33.

   The central comparison is visible at once (A5). The form is Luke's own.
2. **A map of changing rule.** Galilee, Judea, Perea and the tetrarchies are recoloured as the years pass. It shows why Antipas tried Jesus in Luke. It was rejected as the lead because the borders are known only roughly, and a map over borders the records do not draw would be more precise than its sources (rule 8). It belongs in part to The land of the Bible, which this page links.
3. **A family tree of the Herods.** It is the familiar way in, and readers want it. It was rejected as the lead because it explains kinship, not time, and the question here is time. A tree also invites the swaying-tree motion the owner has ruled out. It survives as the static "Which Herod?" card set in section 02.

Against the site's other studies: Manuscripts has a dot field on one line of time, and Israel among the empires has its own empire timeline. The lattice differs from both. Its lanes are offices, not traditions or empires. Its unit is the crossing line, not the dot. And its reading is "who fixes this year", not "what survives". Between the Testaments, its nearest neighbour in this field, is told as steps. This page must not look like that study, so steps appear only inside the record sheet.

## Behaviour

The view lives in the address:

- `anchor`: the chosen crossing line;
- `ruler`: the chosen bar;
- `view`, for the two chronology questions: `birth=early|late`, `cross=30|33`, defaulting to both shown;
- `open`: the record sheet.

An unknown value falls back to the default. The lanes are a list first, keyboard-navigable at a 44-pixel target. The drawing repeats the list for a pointer and stays out of the tab order. The record sheet opens from the right, as everywhere, with the three parts kept apart:

- what the record says;
- what this study infers;
- where it stops.

The only motion is the header orbit and two sparkles, and both stop under reduced motion.

## Headline voice

- Concept line: Kings · Governors · Witnesses · Years.
- Title: New Testament history, with the turn "from Herod to the fall of Jerusalem" in gold italic.
- Motto: "Seven names. / One year."
- Hero drawing: a coin of Herod's style, a broken inscription and a scroll edge, labelled "Illustrative forms · not facsimiles".
- Figures bar, true counts with captions:
  - "135 years — 63 BC to AD 73, no year zero";
  - "6 rulers of Herod's family — named in the New Testament";
  - "4 outside writers — non-Christian, before about AD 120";
  - "2 dates shown — for the cross, neither chosen".

  A count of governors is held back until the Marcellus and Marullus question is checked.

| Section | Headline | What it does | Depth |
|---|---|---|---|
| Opening | | Trail, title, drawing, figures bar, outcomes | Way in |
| 01 The lattice | Seven names. *One year.* | Luke 3:1–2 as the first crossing line, then every anchor; bars solid or hatched by kind of date | Whole |
| 02 Which Herod? | One name. *Six rulers.* | Six cards with title, years, territory and verses; each opens its record | Item |
| 03 Rome arrives | A judge between brothers. *A master of the land.* | Pompey to Herod's death, carried from 34 and reworked into records | Item |
| 04 Witnesses outside | Four writers. *No believers among them.* | Josephus (two records), Tacitus, Pliny, Suetonius; three views on the Josephus paragraph, not chosen | Comparison |
| 05 The years of Jesus | Two births. *Two Fridays.* | Anchors, then views with holders; the census of Luke 2:1–2 with four readings, the error view marked as others' | Debate |
| 06 The trial | Named people. *Never a people.* | Council, Pilate, Antipas, each with its limit; the guilt paragraph in the site's voice | Consequence |
| 07 Paul's fixed points | Five rulers. *One spine.* | Aretas, Agrippa, Gallio, Felix, Festus; the reconstruction drawn as ranges | Scale change |
| 08 The revolt | A witness. *On the other side.* | 66 to Masada; Jewish mourning on the ninth of Av first, then Luke 21:20 | Item |
| 09 Claims | Four things often said. *One test each.* | Four claims with tests | Discernment |
| 10 Where it stops | A selection, stated. *The text stays.* | Words to keep apart, reach, reading trail, credits, closing question, way back to Academic studies | Trail |

## Where the evidence cannot go

- **No single year for the birth or the cross.** Both views are drawn, at equal weight, with holders.
- **No Bethlehem killing on an outside lane.** It is in Matthew alone, and the page says so without calling it doubtful.
- **No borders drawn more finely than the records.**
- **Masada's end is Josephus's account,** told in one plain sentence with no detail, under the site's safe-messaging rule.
- **Only three Bible phrases appear.** Berean wording was supplied for Matthew 2:1, Luke 1:5 and John 2:20 only. Every other verse is a reference that opens the reader until the build supplies its phrase from the held text.

## Doctrine

Scripture is held as "truth, without any mixture of error" (article I), stated once at the stance, beside the chronology.

- Where inerrantists differ on dates, the page does not choose.
- The view that Luke erred, and the view that the Gospels postdate 70 because prophecy is impossible, are described as others' views with the answer.
- The guilt for Christ's death is never laid on the Jewish people. Jewish mourning for the temple is described in Jewish terms before the Christian reading of Luke 21.
- Why Christ died links to the theology study The cross, and is not argued here.

## What is checked

The build will prove three things:

- every verse exists in the Berean;
- every bar's years match the record;
- disputed dates are drawn twice.

Every outside quotation must be checked against the held public-domain text before release; the research file lists each one. None of this proves a reading or a reckoning right.
