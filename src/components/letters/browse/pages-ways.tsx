import type { Span } from "@/data/letters/types";
import { CanonLanes } from "../CanonLanes";
import { ClaimText } from "../LetterParts";
import { CompareLetters } from "../CompareLetters";
import { FlowChart } from "../FlowChart";
import { BetterLadder, OpenQuestions, WordConstellation } from "../LetterBlocks";
import { LetterMap } from "../LetterMap";
import { ParallelRibbon } from "../ParallelRibbon";
import { LetterShape } from "../LetterShape";
import { TimelineStrip } from "../TimelineStrip";
import { FiguresBar } from "./bars";
import { GROUP_KEYS, type LettersData } from "./data";
import type { CardDef, PageDef, PartDef } from "./frame";
import { ClaimChooser, FactsList, Hands, LetterBars, LetterLinks, OrderSlope, OtPeople, PlacesNamed, RepeatedQuotes, ThemeDetail, TopicList, TopicsTop } from "./parts-across";
import { allFlow, allLettersTimeline, destinationLayers, groupWordColumns, travelLayers } from "./builders";
import { GospelsGrid, KeyVerses, KindBars, LetterWordsChooser, LinkGrid, OnlyHere, RibbonChooser, Translations } from "./parts-charts";

const card = (art: string, tone: string, icon: CardDef["icon"], eyebrow: string, title: string, text: string, foot: string, cta: string): CardDef => ({ art, tone, icon, eyebrow, title, text, foot, cta });
const part = (id: string, c: CardDef, lead: string, body: PartDef["body"]): PartDef => ({ id, card: c, lead, body });

/** The four ways in across all twenty-one letters; label turns a span into "Romans 4:3". */
export function wayPages(data: LettersData, label: (span: Span) => string): Record<string, PageDef> {
  const O = data.overview, B = data.browse, G = data.groups;
  const common = { crumb: "Across all twenty-one", citations: O.citations };
  const topicCount = Object.values(B.christ).reduce((n, s) => n + s.topics.length, 0), topicRefs = Object.values(B.christ).reduce((n, s) => n + s.topics.reduce((m, t) => m + t.n, 0), 0);
  const quotes = data.letters.flatMap((l) => l.otQuotes), repeated = [...new Set(quotes.map((q) => label(q.from)))].filter((f) => quotes.filter((q) => label(q.from) === f).length > 1).length;
  const questions = [...O.questions, ...GROUP_KEYS.flatMap((k) => G[k].questions.map((q) => ({ ...q, question: `${G[k].title} · ${q.question}` })))];
  const links = Object.values(B.grid).reduce((n, x) => n + x, 0) / 2, coming = O.themes.find((t) => t.title === "The Lord's coming");
  const parallels = GROUP_KEYS.flatMap((k) => G[k].parallels.map((p) => ({ ...p, id: `${k}-${p.id}` })));
  const greek = (code: string) => data.letter(code).greekWords ?? B.greekWords[code] ?? 0;
  const melchizedek = G.hebrews.parallels.find((p) => p.id === "melchizedek")!;
  return {
    "christ-in-the-letters": { ...common, slug: "christ-in-the-letters", title: "Christ in the letters", right: "CHRIST IN THE LETTERS", tone: "gospels", kicker: "Across all twenty-one · Christ",
      h1: "Christ in the letters.", em: "Who he is, and what he did.", emblem: "cross", caption: "WHO HE IS · WHAT HE DID · LIFE IN HIM",
      intro: "Every letter speaks of Jesus Christ: the titles they give him, what they remember of his life, his death, rising and return, and what it means to live \"in Christ\".",
      bar: <FiguresBar items={[["Topics", "from Torrey", topicCount], ["Passages", "in the letters", topicRefs.toLocaleString("en-US")], ["Better than…", "Hebrews", "10 steps"], ["The Lord's coming", "a shared thread", `${coming?.letters.length ?? 0} letters`]]} />,
      sections: [
        { id: "who", art: "christ", tone: "gospels", title: "Who he is", lead: "The names the letters give him, who they say he is, and how Hebrews sets him above all.", parts: [
          part("titles", card("christ", "gospels", "cross", "His names", "His titles in the letters", "Lord, Son, High Priest, Mediator, Head: each title with the letters that use it.", "From Torrey's topics", "See the titles"), "Each title, with the passages in the letters that give it.", <TopicList data={data} subcategory="titles-and-offices" />),
          part("person", card("glance", "prophets", "book", "His person", "The person of Christ", "His godhead and his manhood, his glory and his character, as the letters speak of them.", "From Torrey's topics", "Read about him"), "Who the letters say he is.", <TopicList data={data} subcategory="person-of-christ" />),
          part("better", card("hebrews", "gospels", "tent", "Step by step", "Better than…", "Hebrews' ten steps: better than prophets, angels, Moses and the old priesthood.", "10 steps", "Climb the steps"), "Each step of Hebrews' argument, and what Christ is better than.", <BetterLadder ladder={G.hebrews.ladders[0]} />),
          part("melchizedek", card("compare", "acts", "compare", "Side by side", "A priest like Melchizedek", "Genesis 14 and Hebrews 7: the priest-king without beginning or end.", `${melchizedek.pairs.length} paired passages`, "Compare them"), "Genesis 14 beside Hebrews 7. Click a ribbon to keep it.", <ParallelRibbon parallel={melchizedek} />),
        ] },
        { id: "did", art: "life", tone: "revelation", title: "What he did", lead: "His life as the letters remember it, his death, rising and return, and how the churches remembered him.", parts: [
          part("life", card("life", "prophets", "clock", "His life", "His life as the letters recall it", "His birth, his ministry and his example, as the letters mention them.", "From Torrey's topics", "Follow his life"), "What the letters remember of his life.", <TopicList data={data} subcategory="life-and-ministry" />),
          part("cross", card("christ", "revelation", "cross", "Cross and crown", "The cross, the rising and the return", "His death, resurrection, ascension and coming again.", "From Torrey's topics", "Read the passages"), "His death, his rising and his return, in the letters.", <TopicList data={data} subcategory="cross-resurrection-return" />),
          part("coming", card("themes", "acts", "link", "A shared thread", "The Lord's coming", "The hope every collection holds: that he will come again.", "Across the collections", "Follow the thread"), "One of the threads that run through every collection.", <ThemeDetail data={data} title="The Lord's coming" />),
          part("table", card("glance", "epistles", "book", "Remembered together", "The Lord's table and baptism", "How the churches remembered him: the bread and the cup, and baptism into his name.", "From Torrey's topics", "Read the passages"), "The ordinances and fellowship of the churches, in the letters.", <TopicList data={data} subcategory="ordinances-and-fellowship" />),
        ] },
        { id: "life", art: "themes", tone: "poetry", title: "Life in him", lead: "What it means to be \"in Christ\": his people, his church, prayer, and faith that works.", parts: [
          part("in-christ", card("themes", "poetry", "link", "In Christ", "Believers and Christ", "Union with him: in him, with him, for him.", "From Torrey's topics", "Read the passages"), "How the letters speak of believers and Christ.", <TopicList data={data} subcategory="believers-and-christ" />),
          part("church", card("people", "acts", "users", "His body", "The church", "The church as his body, his bride and his household.", "From Torrey's topics", "Read the passages"), "The church, as the letters picture it.", <TopicList data={data} subcategory="the-church" />),
          part("prayer", card("john", "revelation", "lamp", "Prayer", "Prayer in the letters", "Prayer in his name: asking, giving thanks, praying for one another.", "From Torrey's topics", "Read the passages"), "Prayer, in the letters.", <TopicList data={data} subcategory="prayer" />),
          part("faith", card("themes", "history", "link", "A shared thread", "Faith that works", "Justified by faith, yet created for good works: Paul and James side by side.", "Across the collections", "Follow the thread"), "One of the threads that run through the collections.", <ThemeDetail data={data} title="Faith that works" />),
        ] },
      ] },
    "how-the-letters-came-to-be": { ...common, slug: "how-the-letters-came-to-be", title: "How the letters came to be", right: "HOW THE LETTERS CAME TO BE", tone: "prophets", kicker: "Across all twenty-one · Origins",
      h1: "How the letters came to be.", em: "Dictated, signed and carried.", emblem: "mail", caption: "IN TIME · ON THE ROAD · THE LETTER ITSELF",
      intro: "When the letters were written and in what order, where they were written and where they went, who carried them, and how an ancient letter was put together.",
      bar: <FiguresBar items={[["Written", "widest range proposed", "AD 40–180"], ["Letters", "in four collections", data.letters.length], ["Named hands", "who wrote or carried", O.hands.length], ["Letters mentioned", "one letter naming another", O.letterLinks.length]]} />,
      sections: [
        { id: "time", art: "when", tone: "prophets", title: "In time", lead: "When they were written, in what order, and who proposed each date.", parts: [
          part("when", card("when", "prophets", "clock", "In time", "When they were written", "All twenty-one on one line of years.", "AD 40–180", "See the timeline"), "All twenty-one on one line of years.", <TimelineStrip timeline={allLettersTimeline(data)} />),
          part("order", card("shape", "history", "bars", "In order", "Written order and Bible order", "The Bible puts Paul's letters first, longest to shortest; by date the order changes.", "21 letters", "See both orders"), "The order of the Bible beside the order of the earliest date proposed for each letter.", <OrderSlope data={data} />),
          part("paul-life", card("life", "epistles", "clock", "Paul's years", "Paul's life and letters", "His life on one line of years, each letter placed where it was written.", "AD 30–68", "See the timeline"), "Paul's life, and his letters where they were written.", <TimelineStrip timeline={G.paul.timelines.find((t) => t.id === "pauls-life")!} />),
          part("dates", card("questions", "revelation", "split", "The debate", "Who dated each letter, and how", "Each letter's dating in a paragraph, with the scholars who proposed it.", "21 letters", "Read the dates"), "How each letter has been dated, and by whom.", <FactsList data={data} field="date" heading="when it was written" />),
        ] },
        { id: "road", art: "where", tone: "poetry", title: "On the road", lead: "Where the letters were written, where they went, and the roads they travelled.", parts: [
          part("where", card("where", "poetry", "map", "On the map", "Where the letters went", "The places each collection's letters were sent to.", "Four collections", "Open the map"), "Toggle a collection to see the places its letters were sent.", <LetterMap layers={destinationLayers(data)} title="Where the letters went" />),
          part("from", card("glance", "prophets", "book", "Written from", "Where each was written", "Corinth, Ephesus, Rome or a prison cell: where each letter was written, and why that is thought.", "21 letters", "Read each one"), "Where each letter was written, and the reasons given.", <FactsList data={data} field="writtenFrom" heading="where it was written" />),
          part("travels", card("paul", "epistles", "route", "Carried", "How Paul's letters travelled", "Each of Paul's thirteen, from where it was written to where it went.", "13 routes", "Open the map"), "Each of Paul's letters, from where it was written to where it was sent.", <LetterMap layers={travelLayers(data)} title="How Paul's letters travelled" />),
          part("journeys", card("paul", "acts", "route", "The roads", "Paul's journeys and Silvanus's road", "The roads the letters' writers and couriers walked.", "Three journeys · Rome · Hort's route", "Open the map"), "Paul's journeys, the voyage to Rome, and the road Hort suggested for 1 Peter. Play one to draw it leg by leg.",
            <LetterMap layers={[...G.paul.maps.filter((m) => m.route), ...G.general.maps.filter((m) => m.id === "silvanus-route")]} title="Paul's journeys and Silvanus's road" />),
        ] },
        { id: "letter", art: "form", tone: "epistles", title: "The letter itself", lead: "How an ancient letter was built, and the hands that wrote and carried these ones.", parts: [
          part("form", card("form", "epistles", "mail", "An ancient letter", "How a letter was built", "The seven parts every letter of the day followed, from the greeting to the farewell.", "7 parts", "See the parts"), "The seven parts every letter of the day followed, with examples.",
            <ClaimChooser data={data} items={O.letterForm} title={(f) => f.part} refs={(f) => f.examples} />),
          part("secretaries", card("hands", "history", "pen", "The pen", "Secretaries and the writer's own hand", "Who took down the letters, and where the writer took the pen himself.", "Tertius · Silvanus · Paul's own hand", "Meet them"), "The secretaries named, and the places the writer wrote in his own hand.", <Hands data={data} roles={["secretary", "own-hand"]} />),
          part("carriers", card("onesimus", "acts", "mail", "The road", "Carriers and co-senders", "Phebe, Tychicus, Onesimus, Epaphroditus: who carried the letters, and who sent them with the writer.", "Phebe · Tychicus · More", "Meet them"), "Who carried the letters, and who joined the writer in sending them.", <Hands data={data} roles={["carrier", "co-sender"]} />),
          part("mentions", card("compare", "prophets", "link", "Letters about letters", "Letters that mention letters", "Fourteen places where one letter speaks of another, some of them lost.", `${O.letterLinks.length} mentions`, "Read them"), "Where one letter speaks of another, including letters now lost.", <LetterLinks data={data} />),
        ] },
      ] },
    "what-runs-through-them": { ...common, slug: "what-runs-through-them", title: "What runs through them", right: "WHAT RUNS THROUGH THEM", tone: "epistles", kicker: "Across all twenty-one · Shared",
      h1: "What runs through them.", em: "One Scripture, many voices.", emblem: "book", caption: "SCRIPTURE · WORDS · THREADS",
      intro: "The Old Testament the letters quote, the Greek words they lean on, and the threads, people and places that run from one collection into another.",
      bar: <FiguresBar items={[["Quotations", "of the Old Testament", quotes.length], ["Quoted again", "Old Testament passages", repeated], ["Threads", "across the collections", O.themes.length], ["People", "in more than one collection", O.sharedPeople.length]]} />,
      sections: [
        { id: "scripture", art: "ot", tone: "epistles", title: "Scripture", lead: "The Old Testament behind the letters: where it comes from, what is quoted again and again, and who quotes most.", parts: [
          part("ot", card("ot", "epistles", "book", "Old Testament", "The Old Testament behind them", "Every quotation traced from the book it comes from to the letters that quote it.", "Psalms · Isaiah · Genesis · More", "Follow the quotations"), "Click a book or a collection to keep it and list every passage.", <FlowChart flow={allFlow(data)} />),
          part("repeated", card("words", "prophets", "star", "Again and again", "Passages quoted more than once", "Genesis 15:6, Isaiah 28:16, Leviticus 19:18, Psalm 110:1: the passages the letters keep returning to.", "Most quoted first", "See them"), "The Old Testament passages quoted in more than one place in the letters.", <RepeatedQuotes data={data} label={label} />),
          part("ot-people", card("people", "poetry", "users", "Old Testament people", "The Old Testament people they name", "Adam, Abraham, Sarah, Moses, Rahab, Elijah… named across the collections.", "10 people", "Meet them"), "The Old Testament people named in more than one collection.", <OtPeople data={data} />),
          part("quoters", card("shape", "history", "bars", "Who quotes most", "Which letters quote most", "Romans and Hebrews lead; some letters quote none.", "21 letters", "See the counts"), "How many Old Testament quotations each letter makes.",
            <LetterBars data={data} value={(c) => data.letter(c).otQuotes.length} hint="Quotations in each letter. Click a letter to list them."
              detail={(c) => (data.letter(c).otQuotes.length ? data.letter(c).otQuotes.map((q) => `${label(q.at)} quotes ${label(q.from)}`).join(" · ") : "no Old Testament quotation")} />),
        ] },
        { id: "words", art: "words", tone: "gospels", title: "Words", lead: "The Greek words the letters lean on, letter by letter and collection by collection.", parts: [
          part("lean", card("words", "gospels", "star", "Greek words", "The words they lean on", "Each collection's key Greek words added together; a bigger star means more uses.", "Four collections", "See the words"), "Each collection's key words, side by side. Choose a star to see every verse behind it.", <WordConstellation {...groupWordColumns(data)} />),
          part("each", card("words", "prophets", "star", "Letter by letter", "Each letter's own words", "Choose any of the twenty-one to see the words it leans on.", "21 letters", "Choose a letter"), "The key Greek words of any one letter.", <LetterWordsChooser data={data} />),
          part("shared", card("themes", "acts", "link", "Shared words", "Words more than one collection leans on", "The key words that turn up in several collections at once.", "In three or more collections", "See them"), "Key words that three or more collections lean on.", <WordConstellation {...groupWordColumns(data, 3)} />),
          part("only-here", card("glance", "revelation", "book", "Only here", "Words found nowhere else in the New Testament", "Greek words a single letter uses that no other New Testament book does.", "Hebrews has the most", "Choose a letter"), "Words only one letter uses, counted in the Greek text.", <OnlyHere data={data} />),
        ] },
        { id: "threads", art: "themes", tone: "acts", title: "Threads", lead: "The themes, people, places and topics that run from one collection into another.", parts: [
          part("share", card("themes", "acts", "link", "Shared threads", "What the collections share", "Ten threads that run through more than one collection.", "Faith that works · Holiness · More", "Follow a thread"), "Choose a thread to follow it.", <ClaimChooser data={data} items={O.themes} title={(t) => t.title} letters={(t) => t.letters} />),
          part("people", card("people", "poetry", "users", "Names", "People who cross the collections", "Twenty-one people named in more than one collection.", "Timothy · Silas · Mark · More", "Meet them"), "Choose a name to see who they were and where they appear.", <ClaimChooser data={data} items={O.sharedPeople} title={(p) => p.name} letters={(p) => p.letters} />),
          part("places", card("where", "prophets", "map", "Places", "The places the letters name", "Every place the twenty-one name, from Rome to Babylon, and which letters name it.", "Most named first", "See the places"), "Every place the letters name, and where.", <PlacesNamed data={data} />),
          part("topics", card("questions", "history", "tags", "Topics", "The Topics that draw most on the letters", "Which of the site's topics cite the letters most.", "From the Topics library", "See the topics"), "The topics in the site's Topics library that cite the letters most.", <TopicsTop data={data} />),
        ] },
      ] },
    "look-closer": { ...common, slug: "look-closer", title: "Look closer", right: "LOOK CLOSER", tone: "prophets", kicker: "Across all twenty-one · Side by side",
      h1: "Look closer.", em: "Side by side, part by part.", emblem: "compare", caption: "SIDE BY SIDE · SHAPE · HOW THEY WERE READ",
      intro: "Set any two letters side by side, see the shape and length of each one, and follow how the church has read and received them.",
      bar: <FiguresBar items={[["Side by side", "paired passages", `${parallels.length} pairings`], ["Cross-references", "between the letters", links.toLocaleString("en-US")], ["Open questions", "every view shown", questions.length], ["Witnesses", "from Clement on", O.canon.length]]} />,
      sections: [
        { id: "side", art: "compare", tone: "prophets", title: "Side by side", lead: "Any two letters, the nine pairings the studies hold, and how the letters link to each other and to the Gospels.", parts: [
          part("compare", card("compare", "prophets", "compare", "Side by side", "Compare any two letters", "Pick two. Each ribbon joins a verse in one to a verse in the other.", "OpenBible.info cross-references", "Choose two"), "Choose any two of the twenty-one. Each ribbon joins a verse in one to a verse in the other, wherever readers have linked them.", <CompareLetters initial={["GAL", "JAS"]} curated={parallels} />),
          part("pairings", card("compare", "acts", "compare", "Nine pairings", "Every pairing in one place", "Ephesians and Colossians, Jude and 2 Peter, the Day of Atonement and more.", `${parallels.length} pairings`, "Choose one"), "All the side-by-side pairings from the collections, in one place.", <RibbonChooser parallels={parallels} />),
          part("grid", card("canon", "epistles", "check", "Most linked", "Which letters are most linked", "Every pair of letters, shaded by how many cross-references join them.", "21 × 21", "See the grid"), "How many cross-references join each pair of letters.", <LinkGrid data={data} />),
          part("gospels", card("compare", "gospels", "compare", "Beside the Gospels", "The letters beside the Gospels and Acts", "How often each letter is linked to Matthew, Mark, Luke, John and Acts.", "21 × 5", "See the links"), "Cross-references from each letter to the Gospels and Acts.", <GospelsGrid data={data} />),
        ] },
        { id: "shape", art: "shape", tone: "history", title: "Shape", lead: "Each letter as long as it is, what its parts do, how long it runs in Greek, and its key verses.", parts: [
          part("shapes", card("shape", "epistles", "bars", "Length", "All twenty-one, side by side", "Each letter as long as it is, cut into its section headings.", "Section headings", "See the shapes"), "Each letter, cut into its section headings.", <LetterShape letters={data.letters} selected="" onSelect={() => undefined} outline={false} />),
          part("kinds", card("shape", "history", "bars", "Its parts", "What each part does", "Teaching, practice, warning, encouragement: each letter's parts, coloured by what they do.", "Teaching · Practice · More", "See the parts"), "Each letter's parts, coloured by what they do.", <KindBars data={data} />),
          part("greek", card("words", "gospels", "star", "In Greek", "Their length in Greek words", "Romans runs to 7,179 Greek words; 3 John to 219.", "Byzantine Greek text", "See the counts"), "Greek words in each letter (Hebrews counted in the Byzantine text the same way).",
            <LetterBars data={data} value={greek} format={(n) => n.toLocaleString("en-US")} hint="Greek words in each letter. Click a letter." detail={(c) => `${greek(c).toLocaleString("en-US")} Greek words in ${data.letter(c).verses} verses`} />),
          part("key-verses", card("glance", "prophets", "book", "Key verses", "Key verses, letter by letter", "The verses each letter turns on, with why each matters.", `${data.letters.reduce((n, l) => n + l.keyVerses.length, 0)} key verses`, "Choose a letter"), "The key verses of any one letter, in the KJV.", <KeyVerses data={data} />),
        ] },
        { id: "read", art: "questions", tone: "revelation", title: "How they were read", lead: "The questions readers have asked, how the letters were gathered and received, and one verse in every translation.", parts: [
          part("questions", card("questions", "history", "split", "Open questions", "Where readers have differed", "Every open question from all four collections and the letters as a whole.", `${questions.length} questions`, "Read the views"), "Each answer shown with the people who held it.", <OpenQuestions questions={questions} />),
          part("gathered", card("form", "epistles", "mail", "The collection", "How they were gathered and ordered", "From letters read aloud and swapped between churches to one ordered collection.", "From Marcion to the councils", "Read it"), "How the letters were gathered into a collection and put in order.",
            <div className="lb-panel lb-gathered">{O.collection.map((c) => <ClaimText key={c.text} claim={c} />)}</div>),
          part("received", card("canon", "revelation", "check", "The canon", "How they were received", "Witness by witness, when each letter was used, doubted and accepted.", `${O.canon.length} witnesses`, "See the witnesses"), "Witness by witness, across all twenty-one.", <CanonLanes events={O.canon} letters={data.letters} />),
          part("translations", card("john", "poetry", "lamp", "In every tongue", "One verse in every translation", "Each letter's first key verse in all the site's translations, from Latin to Chinese.", `${B.translations.length} translations`, "Choose a letter"), "One key verse from any letter, in every translation on the site.", <Translations data={data} />),
        ] },
      ] },
  };
}
