import type { Letter, LetterGroup } from "@/data/letters/types";
import { CanonLanes } from "../CanonLanes";
import { BetterLadder, OpenQuestions } from "../LetterBlocks";
import { FlowChart } from "../FlowChart";
import { LetterMap } from "../LetterMap";
import { ParallelRibbon } from "../ParallelRibbon";
import { PeopleCards } from "../PeopleCards";
import { TimelineStrip } from "../TimelineStrip";
import { FiguresBar, GroupsBar, LettersBar } from "./bars";
import { dates } from "./builders";
import type { GroupKey, LettersData } from "./data";
import type { CardDef, PageDef, PartDef } from "./frame";
import { Glance, LetterWords, OtList, OutlineBar, PeoplePlaces } from "./parts-letter";
import { NetworkChooser, RibbonChooser } from "./parts-charts";

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
  const [paulLetter, choosePaul] = chosen.paul, [genLetter, chooseGen] = chosen.general, [johnLetter, chooseJohn] = chosen.john;
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
    general: { ...common("general"), ...top("general"), slug: "james-peter-and-jude", title: "James, Peter & Jude", right: "JAMES, PETER & JUDE", tone: "acts", kicker: "Four letters · James, Peter & Jude", h1: "James, Peter & Jude.", em: "To believers far from home.",
      emblem: "globe", caption: "JAMES · 1 PETER · 2 PETER · JUDE", bar: <LettersBar data={data} group="general" chosen={genLetter} choose={chooseGen} />,
      sections: [
        { id: "writers", art: "general", tone: "acts", title: "The writers and their readers", lead: "Two brothers of Jesus and an apostle, and the scattered believers they wrote to.", parts: [
          part("family", card("people", "poetry", "users", "The family", "The family of Jesus", "James and Jude, named among the brothers of Jesus, and the family around them.", "James · Joses · Juda · Simon", "Meet them"),
            "The family of Jesus, as the Gospels and the letters name them.", <PeopleCards network={net("general", "jesus-family")} />),
          part("james", card("life", "prophets", "clock", "A life in steps", "James, the Lord's brother", "From unbelief to leading the church at Jerusalem, step by step.", `${tl("general", "jesus-family").events.length} steps`, "Follow his story"),
            "James, the Lord's brother, through the story.", <TimelineStrip timeline={tl("general", "jesus-family")} />),
          part("provinces", card("where", "acts", "map", "On the map", "The five regions of 1 Peter", "Pontus, Galatia, Cappadocia, Asia and Bithynia: where Peter's readers lived.", "5 regions", "Open the map"),
            "The five regions 1 Peter is written to.", <LetterMap layers={map("general", "first-peter-provinces")} title="The five regions of 1 Peter's readers" />),
          part("babylon", card("paul", "epistles", "route", "On the map", "Babylon, and Silvanus's road", "Two candidates for the \"Babylon\" Peter writes from, and the road the letter may have taken.", "Rome or Mesopotamia · Hort's route", "Open the map"),
            "Where \"Babylon\" may be, and the route Hort suggested for the letter.", <LetterMap layers={map("general", "silvanus-route", "babylon")} title="Babylon, and Silvanus's road" />),
        ] },
        { id: "inside", art: "glance", tone: "prophets", picker: true, title: `Inside ${genLetter.name}`, lead: "Choose any of the four; these four cards follow it.", parts: inside(genLetter, "ot", extras("general", "James, Peter & Jude")) },
        { id: "side", art: "compare", tone: "poetry", title: "Side by side, and how they were read", lead: "The passages they share, the questions readers have asked, and how the church received them.", parts: [
          part("jude2pe", card("compare", "prophets", "compare", "Twin letters", "Jude and 2 Peter", "A run of the same material, passage against passage.", `${par("general", "jude-second-peter").pairs.length} paired passages`, "Compare them"),
            "Jude beside 2 Peter. Click a ribbon to keep it.", <ParallelRibbon parallel={par("general", "jude-second-peter")} />),
          part("james-echoes", card("compare", "acts", "compare", "Echoes", "James beside Jesus and Peter", "James and the Sermon on the Mount, and the material James shares with 1 Peter.", "Sermon on the Mount · 1 Peter", "Compare them"),
            "James beside the Sermon on the Mount, or beside 1 Peter.", <RibbonChooser parallels={[par("general", "james-sermon"), par("general", "james-first-peter")]} />),
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
