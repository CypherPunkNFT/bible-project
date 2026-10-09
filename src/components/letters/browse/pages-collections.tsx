import type { Letter, LetterGroup } from "@/data/letters/types";
import { CanonLanes } from "../CanonLanes";
import { BetterLadder, OpenQuestions, WordConstellation } from "../LetterBlocks";
import { CompareLetters } from "../CompareLetters";
import { FlowChart } from "../FlowChart";
import { LetterMap } from "../LetterMap";
import { ParallelRibbon } from "../ParallelRibbon";
import { PeopleCards } from "../PeopleCards";
import { TimelineStrip } from "../TimelineStrip";
import { FiguresBar, GroupsBar, LettersBar, LettersLinkBar } from "./bars";
import { dates } from "./builders";
import type { GroupKey, LettersData } from "./data";
import { BASE, type CardDef, type PageDef, type PartDef } from "./frame";
import { Glance, LetterWords, OtList, OutlineBar, PeoplePlaces } from "./parts-letter";
import { NetworkChooser } from "./parts-charts";
import { CollectionOt, LettersLook, WriterLife } from "./parts-writers";

export type Chosen = Record<GroupKey, [Letter, (code: string) => void]>;
const card = (art: string, tone: string, icon: CardDef["icon"], eyebrow: string, title: string, text: string, foot: string, cta: string): CardDef => ({ art, tone, icon, eyebrow, title, text, foot, cta });
const part = (id: string, c: CardDef, lead: string, body: PartDef["body"]): PartDef => ({ id, card: c, lead, body });

/** What a collection adds to its "Inside" cards: its own Old Testament chart, and the Bible's headings beside the outline. */
interface InsideExtras { flow?: LetterGroup["flows"][number]; collection?: string; headings?: boolean }

/** The four parts every collection's "Inside" section shows, for the chosen letter. */
function inside(l: Letter, fourth: "ot" | "names" = "ot", extras: InsideExtras = {}): PartDef[] {
  const { flow, collection, headings } = extras;
  return [
    part("glance", card("glance", "epistles", "book", "At a glance", `${l.name} at a glance`, "Who wrote it, to whom, from where and when, with its key verses and themes.", "Key verses · Themes · People · Places", "Read the overview"),
      "Who wrote it, to whom, from where, when and why; who and where it names; its key verses and its themes.", <Glance key={l.code} letter={l} />),
    part("shape", card("shape", "history", "bars", "Its shape", "How it is built", headings ? "Its outline in our own words, beside the Bible's own section headings." : "The letter cut into its sections, and its outline in our own words.", "Teaching · Practice · Personal", "See the outline"),
      headings ? "The letter cut into its parts, in our own words, coloured by what each part does; beneath, each part beside the Bible's section headings inside it."
        : "The letter cut into its parts, in our own words, coloured by what each part does.", <OutlineBar key={l.code} letter={l} headings={headings} />),
    part("words", card("words", "gospels", "star", "Greek words", "The words it leans on", "Its key Greek words as stars; choose one for every verse.", "Every verse behind each star", "See the words"),
      "Its key Greek words, counted in the Greek text. Click one to list every verse it appears in.", <LetterWords key={l.code} letter={l} />),
    fourth === "names"
      ? part("names", card("people", "poetry", "users", "Who and where", `People and places in ${l.name}`, "Everyone the letter names, and every place, with where it names them.", "People · Places", "See the names"), "Everyone and everywhere the letter names.", <PeoplePlaces letter={l} />)
      : part("ot", card("ot", "epistles", "book", "Old Testament", `The Old Testament behind ${l.name}`, flow ? (collection === l.name ? `The Old Testament books ${l.name} quotes, then each quotation.` : `Where the quotations in ${collection} come from, then each one in ${l.name}.`) : "Each quotation linked to the passage it comes from.", "Psalms · Isaiah · More", "Follow the quotations"),
        flow ? `Where the quotations in ${collection} come from, book by book. Click a book or ${collection === l.name ? "a chapter" : "a letter"} to keep it. Below, each quotation in ${l.name}, linked to the passage it comes from.` : "Each quotation, linked to the passage it comes from.",
        <>{flow && <FlowChart flow={flow} />}<OtList key={l.code} letter={l} /></>),
  ];
}

/** Open questions and reception, the last two parts of each collection's third section. */
function read(data: LettersData, k: GroupKey): PartDef[] {
  const g = data.groups[k], one = g.letters.length === 1;
  return [
    part("questions", card("questions", "history", "split", "Open questions", "Where readers have differed", "Each answer shown with the people who held it.", `${g.questions.length} questions`, "Read the views"),
      `${g.questions.length} questions about ${one ? "this letter" : "these letters"}. Each answer is shown with the people who held it; this page does not choose between them.`, <OpenQuestions questions={g.questions} />),
    part("canon", card("canon", "revelation", "check", "The canon", one ? "How it was received" : "How they were received", "Witness by witness, when each letter was used, doubted and accepted.", `${g.canon.length} witnesses`, "See the witnesses"),
      "Witness by witness, when each letter was quoted, used and accepted.", <CanonLanes events={g.canon} letters={g.letters} />),
  ];
}

export function collectionPages(data: LettersData, chosen: Chosen): Record<string, PageDef> {
  const G = data.groups;
  const extras = (k: GroupKey, collection: string): InsideExtras => ({ flow: G[k].flows.find((f) => f.id === "ot-sources"), collection, headings: true });
  // James, Peter and Jude open with a short life of each writer; the others with the collection's own introduction.
  const top = (k: GroupKey) => ({ about: G[k].writers?.some((w) => w.intro?.length) ? undefined : G[k].intro, writers: G[k].writers, tall: `tall-${k}` });
  const map = (k: GroupKey, ...ids: string[]) => ids.flatMap((id) => G[k].maps.filter((m) => m.id === id));
  const tl = (k: GroupKey, id: string) => G[k].timelines.find((t) => t.id === id)!, net = (k: GroupKey, id: string) => G[k].networks.find((n) => n.id === id)!;
  const par = (k: GroupKey, id: string) => G[k].parallels.find((p) => p.id === id)!;
  const common = (k: GroupKey) => ({ crumb: "The four collections", citations: G[k].citations, intro: G[k].tagline });
  const [paulLetter, choosePaul] = chosen.paul, [johnLetter, chooseJohn] = chosen.john;
  const GEN = `${BASE}/james-peter-and-jude`, GEN_TITLE = "James, Peter & Jude";
  const writer = (k: GroupKey, id: string) => G[k].writers!.find((w) => w.id === id)!;
  const heb = G.hebrews.letters[0];
  return {
    paul: { ...common("paul"), ...top("paul"), slug: "paul", title: "Paul's letters", right: "PAUL'S LETTERS", tone: "epistles", kicker: "Thirteen letters · Paul", h1: "Paul's letters.", em: "Written on the road.",
      intro: "Letters to young churches and to friends, from his first visit to Thessalonica to his last days in Rome. Choose a letter, then a card.",
      emblem: "route", caption: "EARLY · MAJOR · PRISON · PASTORAL", bar: <GroupsBar data={data} group="paul" chosen={paulLetter} choose={choosePaul} />,
      sections: [
        { id: "story", art: "paul", tone: "epistles", title: "Paul's story", lead: "The journeys, the years, and the friends who travelled with him.", parts: [
          part("map", card("paul", "epistles", "route", "On the map", "Journeys and destinations", "Each journey drawn leg by leg, with the places his letters were sent.", "Three journeys · the voyage to Rome", "Open the map"),
            "Toggle a journey or a set of places; play a journey to draw it leg by leg.", <LetterMap layers={map("paul", "journey-1", "journey-2", "journey-3", "voyage-rome", "letter-destinations", "pastoral-movements")} title="Paul's journeys and the letters' destinations" />),
          part("time", card("life", "prophets", "clock", "In time", "Paul's life and letters", "His life on one line of years, each letter placed where it was written.", "From his calling to Rome", "See the timeline"),
            "His life on one line of years, and each letter where it was written.", <TimelineStrip timeline={tl("paul", "pauls-life")} />),
          part("companions", card("people", "poetry", "users", "Companions", "His companions over time", "Who travelled and wrote with him, and when.", "Timothy · Silas · Luke · More", "Meet them"),
            "The people who travelled and worked with him, and the people of the prison letters.", <NetworkChooser networks={[net("paul", "companions"), net("paul", "prison-letters")]} />),
          part("onesimus", card("onesimus", "acts", "mail", "A story in letters", "The story of Onesimus", "A runaway slave sent home with a letter from Rome to Colossae.", "Philemon · Colossians", "Follow the story"),
            "A runaway sent home with a letter, from Paul's prison to Philemon's house.", <TimelineStrip timeline={tl("paul", "onesimus")} />),
        ] },
        { id: "inside", art: "glance", tone: "prophets", picker: true, title: `Inside ${paulLetter.name}`, lead: "Choose any of the thirteen; these four cards follow it.",
          parts: inside(paulLetter, "ot", extras("paul", "Paul's letters")) },
        { id: "side", art: "compare", tone: "poetry", title: "Side by side, and how they were read", lead: "Pairs of letters, the people Paul greets, and how the church received them.", parts: [
          part("ephcol", card("compare", "prophets", "compare", "Twin letters", "Ephesians and Colossians", "Two letters written close together, passage against passage.", "31 paired passages", "Compare them"),
            "Thirty-one passages that run in parallel. Click a ribbon to keep it.", <ParallelRibbon parallel={par("paul", "ephesians-colossians")} />),
          part("romans16", card("people", "poetry", "users", "Romans 16", "The people of Paul's greetings", "Every name in Romans 16, and where else Scripture names them.", "Phebe · Priscilla and Aquila · More", "Meet them"),
            "Every name in Romans 16. Choose a person to see who they were and where else Scripture names them.", <PeopleCards network={net("paul", "romans-16")} />),
          ...read(data, "paul"),
        ] },
      ] },
    hebrews: { ...common("hebrews"), ...top("hebrews"), slug: "hebrews", title: "Hebrews", right: "HEBREWS", tone: "gospels", kicker: "One long sermon · Hebrews", h1: "Hebrews.", em: "A better covenant.",
      emblem: "tent", caption: "SERMON · LETTER · UNSIGNED",
      bar: <FiguresBar items={[["Length", `${heb.outline.length} parts`, `${heb.verses} verses`], ["Old Testament", "quotations", heb.otQuotes.length], ["Key verses", `${heb.themes.length} themes`, heb.keyVerses.length], ["Written", "widest range proposed", dates(heb)]]} />,
      sections: [
        { id: "argument", art: "hebrews", tone: "gospels", title: "The argument", lead: "How the sermon makes its case: Christ better at every step, read against the Law it fulfils.", parts: [
          part("better", card("hebrews", "gospels", "tent", "Step by step", "Better than…", "Ten steps up the argument: better than prophets, angels, Moses and the old priesthood.", "10 steps", "Climb the steps"),
            "Each step of the argument, and what it is better than.", <BetterLadder ladder={G.hebrews.ladders[0]} />),
          part("shape", card("shape", "history", "bars", "Its shape", "How it is built", "Teaching, warning and encouragement, part by part.", `${heb.outline.length} parts`, "See the outline"),
            "The sermon cut into its parts, coloured by teaching, warning and encouragement; beneath, each part beside the Bible's section headings inside it.", <OutlineBar letter={heb} headings />),
          part("atonement", card("compare", "prophets", "compare", "Side by side", "The Day of Atonement and Hebrews 9", "Leviticus 16 read beside the high priest's single entry with his own blood.", `${par("hebrews", "day-of-atonement").pairs.length} paired passages`, "Compare them"),
            "Leviticus 16 beside Hebrews 9. Click a ribbon to keep it.", <ParallelRibbon parallel={par("hebrews", "day-of-atonement")} />),
          part("melchizedek", card("compare", "acts", "compare", "Side by side", "Melchizedek", "Genesis 14 and Hebrews 7: the priest-king without beginning or end.", `${par("hebrews", "melchizedek").pairs.length} paired passages`, "Compare them"),
            "Genesis 14 beside Hebrews 7. Click a ribbon to keep it.", <ParallelRibbon parallel={par("hebrews", "melchizedek")} />),
        ] },
        { id: "inside", art: "glance", tone: "prophets", title: "Inside Hebrews", lead: "The letter at a glance, its hall of faith, the words it leans on and the Old Testament behind it.", parts: [
          inside(heb)[0],
          part("faith", card("life", "poetry", "clock", "Hebrews 11", "The hall of faith", "From Abel to the prophets, each example in the order of the story.", `${tl("hebrews", "hall-of-faith").events.length} examples`, "Walk the hall"),
            "Each example of faith, in the order of the Old Testament story.", <TimelineStrip timeline={tl("hebrews", "hall-of-faith")} />),
          inside(heb)[2], inside(heb, "ot", extras("hebrews", "Hebrews"))[3],
        ] },
        { id: "read", art: "questions", tone: "history", title: "Its readers, and how it was read", lead: "Where the first readers may have lived, who is named, and how the church received the letter.", parts: [
          part("readers", card("where", "poetry", "map", "On the map", "Where the first readers may have lived", "Five places proposed, each with the people who proposed it.", "Jerusalem · Rome · More", "Open the map"),
            "Five places proposed for the first readers. Click a pin to see who proposed it.", <LetterMap layers={map("hebrews", "destinations")} title="Where the first readers may have lived" />),
          inside(heb, "names")[3], ...read(data, "hebrews"),
        ] },
      ] },
    // James, Peter & Jude (owner, 2026-10-07): the writers first, one card each, then the family they came from; then a
    // deeper look inside each letter, and the Old Testament behind all four; then the letters side by side.
    general: { ...common("general"), ...top("general"), slug: "james-peter-and-jude", title: "James, Peter & Jude", right: "JAMES, PETER & JUDE", tone: "acts", kicker: "Four letters · James, Peter & Jude", h1: "James, Peter & Jude.", em: "To believers far from home.",
      emblem: "globe", caption: "JAMES · 1 PETER · 2 PETER · JUDE",
      bar: <LettersLinkBar data={data} group="general" to={(code) => ({ JAS: { path: `${GEN}/inside/james`, label: "James at a glance" }, "1PE": { path: `${GEN}/inside/peter`, label: "1 Peter at a glance" }, "2PE": { path: `${GEN}/inside/peter`, label: "2 Peter at a glance" }, JUD: { path: `${GEN}/inside/jude`, label: "Jude at a glance" } })[code] ?? { path: `${GEN}/inside`, label: "Inside the letters" }} />,
      sections: [
        { id: "writers", art: "general", tone: "acts", title: "The writers", lead: "Who wrote them: James and Jude, brothers of Jesus, and the apostle Peter; then the family they came from.", parts: [
          part("james", card("life", "prophets", "users", "The writer", "James, the Lord's brother", "From unbelief to leading the church at Jerusalem, step by step.", `${tl("general", "jesus-family").events.length} steps · his own page`, "Follow his life"),
            "James's life in the story, step by step. His own page has the rest.", <WriterLife writer={writer("general", "james-mat-13-55")} timeline={tl("general", "jesus-family")} from={GEN_TITLE} />),
          part("peter", card("life", "acts", "users", "The writer", "Peter, the apostle", "From fisherman to the first preacher of the church, step by step.", `${tl("general", "peter-life").events.length} steps · his own page`, "Follow his life"),
            "Peter's life in the story, step by step. His own page has the rest.", <WriterLife writer={writer("general", "peter-mat-4-18")} timeline={tl("general", "peter-life")} from={GEN_TITLE} />),
          part("jude", card("life", "poetry", "users", "The writer", "Jude, the Lord's brother", "The youngest brother, who came to faith after the resurrection, step by step.", `${tl("general", "jude-life").events.length} steps · his own page`, "Follow his life"),
            "Jude's life in the story, step by step. His own page has the rest.", <WriterLife writer={writer("general", "jude-mat-13-55")} timeline={tl("general", "jude-life")} from={GEN_TITLE} />),
          part("family", card("people", "history", "users", "The family", "The family of Jesus", "James and Jude, named among the brothers of Jesus, and the family around them.", "James · Joses · Juda · Simon", "Meet them"),
            "The family of Jesus, as the Gospels and the letters name them.", <PeopleCards network={net("general", "jesus-family")} />),
        ] },
        { id: "inside", art: "glance", tone: "prophets", title: "Inside the letters", lead: "A deeper look at each: who wrote it and to whom, how it is built, the words it leans on and the Old Testament behind it.", parts: [
          part("james", card("glance", "epistles", "book", "At a glance", "James at a glance", "Who wrote it and to whom, how it is built, its key words and its Old Testament quotations.", "Faith that works", "Look inside"),
            "James, all in one place: the letter at a glance, how it is built, the words it leans on and the Old Testament behind it.", <LettersLook letters={G.general.letters.filter((l) => l.code === "JAS")} />),
          part("peter", card("glance", "acts", "book", "At a glance", "Peter at a glance", "1 Peter and 2 Peter, each in full, with where his readers lived and where he wrote from.", "1 Peter · 2 Peter · the map", "Look inside"),
            "1 Peter and 2 Peter, each in full; then where Peter's readers lived, and the \"Babylon\" he wrote from.", <LettersLook letters={G.general.letters.filter((l) => l.code === "1PE" || l.code === "2PE")}
              after={<><h3 className="lb-look-head">Where his readers lived</h3><LetterMap layers={map("general", "first-peter-provinces")} title="The five regions of 1 Peter's readers" />
                <h3 className="lb-look-head">Where he wrote from, and how the letter travelled</h3><LetterMap layers={map("general", "silvanus-route", "babylon")} title={"\"Babylon\" and the road the letter may have taken"} /></>} />),
          part("jude", card("glance", "poetry", "book", "At a glance", "Jude at a glance", "Who wrote it and to whom, how it is built, its key words and its Old Testament quotations.", "Contend for the faith", "Look inside"),
            "Jude, all in one place: the letter at a glance, how it is built, the words it leans on and the Old Testament behind it.", <LettersLook letters={G.general.letters.filter((l) => l.code === "JUD")} />),
          part("ot", card("ot", "epistles", "book", "Old Testament", "The Old Testament behind James, Peter & Jude", "Where all four letters' quotations come from, then each one, letter by letter.", "Psalms · Isaiah · More", "Follow the quotations"),
            "Where the quotations in all four letters come from, book by book; click a book or a letter to keep it. Then every quotation, letter by letter.",
            <CollectionOt flow={G.general.flows.find((f) => f.id === "ot-sources")!} letters={G.general.letters} />),
        ] },
        { id: "side", art: "compare", tone: "poetry", title: "Side by side, and how they were read", lead: "The passages they share, the questions readers have asked, and how the church received them.", parts: [
          part("compare", card("compare", "prophets", "compare", "Side by side", "Any two, side by side", "Pick two of the four letters, or James and Matthew's Gospel: the strongest links between them, with the notes where scholars pair the passages.", "Jude and 2 Peter · James and 1 Peter · James and the Sermon on the Mount", "Choose two"),
            "Click two to compare them; click one again to let it go, or a third to swap it in. Click a connection to read both passages side by side.",
            <CompareLetters initial={["JUD", "2PE"]} curated={G.general.parallels} choices={[...G.general.letters.map((l) => ({ code: l.code })), { code: "MAT", label: "Matthew (the Sermon on the Mount)", tone: "gospels" }]} />),
          part("words", card("words", "gospels", "star", "Greek words", "The words they lean on, side by side", "Each letter's key Greek words in one chart: which words they share and which belong to one alone.", "James · 1 Peter · 2 Peter · Jude", "See the words"),
            "The key Greek words of all four letters together, a column for each. Choose a star to see every verse behind it.", <WordConstellation letters={G.general.letters} />),
          ...read(data, "general"),
        ] },
      ] },
    john: { ...common("john"), ...top("john"), slug: "the-letters-of-john", title: "The letters of John", right: "THE LETTERS OF JOHN", tone: "revelation", kicker: "Three letters · John", h1: "The letters of John.", em: "Light, love and truth.",
      emblem: "lamp", caption: "1 JOHN · 2 JOHN · 3 JOHN", bar: <LettersBar data={data} group="john" chosen={johnLetter} choose={chooseJohn} />,
      sections: [
        { id: "elder", art: "john", tone: "revelation", title: "The elder and his churches", lead: "Where the letters were read, who 3 John names, and the questions readers still ask.", parts: [
          part("ephesus", card("where", "poetry", "map", "On the map", "Ephesus and the churches of Asia", "Where tradition places John and the churches he wrote to.", "Ephesus · Asia", "Open the map"),
            "Ephesus and the churches of Asia, by tradition.", <LetterMap layers={map("john", "ephesus")} title="Ephesus and the churches of Asia" />),
          part("whos-who", card("people", "acts", "users", "3 John", "Who's who in 3 John", "The elder, Gaius, Diotrephes, Demetrius and the travelling brothers.", "Gaius · Diotrephes · Demetrius", "Meet them"),
            "Everyone in 3 John, and how the letter links them.", <PeopleCards network={net("john", "third-john")} />),
          part("witnesses", card("when", "prophets", "clock", "In time", "The three heavenly witnesses", "How the words of 1 John 5:7 entered the printed Bible, witness by witness.", "AD 258 – 1883", "See the timeline"),
            "How the \"three that bear record in heaven\" entered the printed Bible.", <TimelineStrip timeline={tl("john", "three-witnesses")} />),
          read(data, "john")[0],
        ] },
        { id: "inside", art: "glance", tone: "prophets", picker: true, title: `Inside ${johnLetter.name}`, lead: "Choose any of the three; these four cards follow it.", parts: inside(johnLetter, "ot", extras("john", "John's letters")) },
        { id: "side", art: "compare", tone: "poetry", title: "Side by side, and how they were received", lead: "The letters beside the Gospel and beside each other, and how the church received them.", parts: [
          part("gospel", card("compare", "prophets", "compare", "Beside the Gospel", "1 John and the Gospel of John", "The same words and ideas, passage against passage.", `${par("john", "gospel-bridge").pairs.length} paired passages`, "Compare them"),
            "1 John beside the Gospel of John. Click a ribbon to keep it.", <ParallelRibbon parallel={par("john", "gospel-bridge")} />),
          part("echoes", card("compare", "acts", "compare", "Echoes", "2 John's echoes of 1 John", "The short letter repeating the long one.", `${par("john", "second-first").pairs.length} paired passages`, "Compare them"),
            "2 John beside 1 John. Click a ribbon to keep it.", <ParallelRibbon parallel={par("john", "second-first")} />),
          part("twins", card("compare", "poetry", "compare", "Twin notes", "2 John and 3 John", "The formulas the two short notes share.", `${par("john", "twin-letters").pairs.length} paired passages`, "Compare them"),
            "2 John beside 3 John. Click a ribbon to keep it.", <ParallelRibbon parallel={par("john", "twin-letters")} />),
          read(data, "john")[1],
        ] },
      ] },
  };
}
