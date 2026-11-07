# The early church: design record

The page: `/study/the-early-church` (to build). Its evidence and limits: [the research record](../21-the-early-church.json). Its verses and counts: a data build to write, `scripts/build-early-church-study.py`.

## What this page is for

A reader hears that Nicaea chose the Bible, that Constantine made Christianity the state religion, or that the churches that broke away denied Christ. They have no way to test these claims. They leave able to tell an early Christian writing from Scripture and say what each kind of writing can show. They can date a writer only as closely as the evidence allows, tell the four councils as events and quote what each decided, and say how Baptist confessions weigh those decisions. The question it carries: who wrote this, when, and for whom, and what has the retelling added?

## The material's own shape

These centuries are known through kinds of documents, and each kind belongs to a stage of the story. A letter carried by a messenger. A church manual. A prisoner's letters. A martyr's account written by the survivors. A defence addressed to an emperor. A teacher's long book. An emperor's letter. The life of a monk. A council's few decided words. The reader learns the period by learning what each kind of writing can bear. So the page is built as a document case: one drawer per kind, in the order the kinds appear. Each drawer opens its records in three parts.

## Directions, and one honest gap

The study standard asks for three or four directions built as mock-ups, then a stop for the owner to choose. That stop is not possible inside a remote job, because the owner cannot answer mid-job. So three directions were weighed in writing, one is recommended, and the choice is the owner's to overturn on sight.

1. **The document case (recommended).** Eight drawers along a track from 64 to 451. Each drawer is drawn as its object in the study's line hand: a folded letter, a small codex, a chain, a scroll held out to a throne, a wax-sealed rescript, a reed hut, a council's bench. Each drawer sits under the period band its documents belong to, and every date is drawn as a range. Choosing a drawer opens its records below. The pattern is visible at once (rule A5): the kinds of witness change as the church's situation changes. Prison letters and acts of martyrs give way to imperial letters and council definitions.
2. **A map of cities.** Rome, Antioch, Smyrna, Lyon, Carthage, Alexandria, Nicaea, Hippo. It is easy to grasp. Rejected as the lead because the dots would measure where writings survived, not where the church was strong. The Persian and Ethiopian churches would vanish from it. It survives as a small map inside the councils section, showing where each council met and which regions did not receive it.
3. **A succession tree of bishops from the apostles.** Rejected. The evidence cannot bear it. Irenaeus's list of Rome's bishops comes about a century after its first names. Clement's own letter names no single bishop. A tree would also present as settled the very question the Baptist history study treats as unsupported.

## Against its neighbours

Taken on the site already: three lists side by side (the canon), a dot field (manuscripts), threads between rulers (Egypt), a glossed page (how the church has read the Bible), a wheel (farming), a house (home). The medieval church, its direct neighbour on this shelf, must not echo the case. That study should take its shape from its own material. Here the case is the body's one figure. The councils section uses a reception band instead: four council markers, with a row for each family of churches beneath them, showing how many of the four it receives. The Church of the East receives two, the Oriental Orthodox three, and the rest four. Each row says so in words as well as by length.

## Headline voice

Concept line: Letters · Martyrs · Councils. Title: The early church, with the turn *from Nero to Chalcedon*. Motto: "Written in prison. / Settled in council."

| Section | Headline | What it does | Depth |
|---|---|---|---|
| Opening | | Trail, title, drawing of a folded letter and a council bench under one arch, four true figures, outcomes | Way in |
| The case | Eight kinds of writing. *One church changing.* | The document case on its track; four period bands; choosing a drawer opens its part | Whole |
| 01 | The apostles die. *Their letters stay.* | Nero, Clement, the Didache, Ignatius, Polycarp | Item |
| 02 | Not a crime. *A name.* | Pliny's procedure, Perpetua, Decius's certificates, the Great Persecution | Item |
| 03 | Written for outsiders. *Kept by insiders.* | Justin's Sunday, the letter to Diognetus | Item |
| 04 | Three teachers. *Three cities.* | Irenaeus, Tertullian, Origen; baptism in the first centuries; the canon in a sentence and a link | Item |
| 05 | The persecutor's heir. *The church's patron.* | The two accounts of 312 side by side, the agreement of 313, Theodosius in 380 | Comparison |
| 06 | The persecution ends. *The desert fills.* | Antony, Pachomius, Basil and Macrina | Item |
| 07 | Four questions. *Four councils.* | Each council: its question, who called it, the decided words quoted, who stayed outside; the reception band and small map; links to The Trinity and The person of Christ | Scale change |
| 08 | Command what you will. *Give what you command.* | Augustine's life; the argument with Pelagius; link to Election | Item |
| How a creed came | Scripture first. *Councils after.* | Four steps from 1 Corinthians 15 to the Baptist preamble | Thread |
| Claims | Four things often said. *One test each.* | Four claims, each with a three-part record and a test | Discernment |
| Where it stops | A selection, stated. *The witnesses stay.* | Confused words, reach, reading trail, credits, closing question, way back to Academic studies | Trail |

## Behaviour

The view lives in the address. `drawer` holds the open kind of writing, `council` the chosen council, and `open` the record sheet. Unknown values fall back to the default. Focus returns to the opener after a sheet closes. The drawers are a visible list of buttons at 44 pixels. The drawing repeats them for a pointer and is kept out of the tab order. Motion is limited to the slow orbit and two sparkles in the header, and it stops for reduced motion. Records open one at a time, never as a wall of cards.

## Where the evidence cannot go

- **No point dates before 250** unless a source gives a day. The Didache, Clement, Ignatius and Polycarp are drawn as ranges, and their argued alternatives are shown as fainter ranges with the holders named.
- **No lines of influence or succession** except where a source states one. Irenaeus heard Polycarp, by his own account.
- **The losing sides speak through their opponents.** Every record of Nestorius, Pelagius or Arius says so.
- **Every quotation from an early writer or council is flagged for checking** against its named public-domain translation. The build can check the site's held Chalcedon text, the creeds collection and the Berean. It cannot check the fathers until their texts are held.

## Doctrine

This is an Academic study, so the councils are told as events and their doctrine is never argued. The theology studies The Trinity and The person of Christ teach it from Scripture, and every council record links them. The churches that did not receive Ephesus or Chalcedon are described by their own names and in their own words where read. The 1973 Coptic and Roman declaration gets one sentence. The site's stance appears once, in its own panel. Scripture is the sole authority, and confessions are "only guides". Article XVII says "A free church in a free state", which marks Theodosius's laws as history, not a model. Infant baptism's early evidence is reported fairly, and the Baptist reading is linked to the theology study Baptism.

## What is checked

The build will prove three things. Every verse exists in the Berean with its stated phrase. Every quotation from Chalcedon, the 1973 declaration, Philaret, Westminster and the 1689 Confession matches the site's held text. Every link route resolves. It will also list every source with the status "check" as blocking release until a person has compared the quotation. None of this proves a historical reading is right.
