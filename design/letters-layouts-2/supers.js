// The Letters home's second row: four ways in across all twenty-one letters, each a page like a collection's (title,
// figures bar, three rows of four cards), each card opening its section page at its part. Also the home page itself.
(() => {
  const O = LETTERS.overview, S = LETTERS.supers, G = LETTERS.groups;
  const ALL = Object.values(G).flatMap((g) => g.letters);
  const topicCount = Object.values(S.christ).reduce((n, s) => n + s.topics.length, 0), topicRefs = Object.values(S.christ).reduce((n, s) => n + s.topics.reduce((m, t) => m + t.n, 0), 0);
  const quotes = ALL.reduce((n, l) => n + l.otQuotes.length, 0), links = Object.values(S.grid).reduce((n, x) => n + x, 0) / 2;
  const questions = O.questions.length + Object.values(G).reduce((n, g) => n + g.questions.length, 0);
  const part = (id, card, lead, body) => ({ id, card, lead, body });
  const c = (art, tone, icon, eyebrow, title, text, foot, cta) => ({ art, tone, icon, eyebrow, title, text, foot, cta });
  const common = { crumb: "Across all twenty-one", bar: "custom", sources: "From the site's letters studies, Torrey's topics and OpenBible.info." };

  const SUPERS = {
    christ: { ...common, slug: "christ-in-the-letters", title: "Christ in the letters", right: "CHRIST IN THE LETTERS", tone: "gospels", kicker: "Across all twenty-one · Christ",
      h1: "Christ in the letters.", em: "Who he is, and what he did.", emblem: "cross", caption: "WHO HE IS · WHAT HE DID · LIFE IN HIM",
      intro: "Every letter speaks of Jesus Christ: the titles they give him, what they remember of his life, his death, rising and return, and what it means to live \"in Christ\".",
      figures: () => [["Topics", "from Torrey", topicCount], ["Passages", "in the letters", topicRefs.toLocaleString("en-US")], ["Better than…", "Hebrews", "10 steps"], ["The Lord's coming", "a shared thread", `${O.themes.find((t) => t.title === "The Lord's coming").letters.length} letters`]],
      sections: [
        { id: "who", art: "christ", tone: "gospels", title: "Who he is", lead: "The names the letters give him, who they say he is, and how Hebrews sets him above all.", parts: [
          part("titles", c("christ", "gospels", "cross", "His names", "His titles in the letters", "Lord, Son, High Priest, Mediator, Head: each title with the letters that use it.", "From Torrey's topics", "See the titles"), "Each title, with the passages in the letters that give it.", () => CH3.topics("christ-titles", "titles-and-offices")),
          part("person", c("glance", "prophets", "book", "His person", "The person of Christ", "His godhead and his manhood, his glory and his character, as the letters speak of them.", "From Torrey's topics", "Read about him"), "Who the letters say he is.", () => CH3.topics("christ-person", "person-of-christ")),
          part("better", c("hebrews", "gospels", "tent", "Step by step", "Better than…", "Hebrews' ten steps: better than prophets, angels, Moses and the old priesthood.", "10 steps", "Climb the steps"), "Each step of Hebrews' argument, and what Christ is better than.", () => CH.ladder("christ-better", G.hebrews.ladders.better)),
          part("melchizedek", c("compare", "acts", "compare", "Side by side", "A priest like Melchizedek", "Genesis 14 and Hebrews 7: the priest-king without beginning or end.", "5 paired passages", "Compare them"), "Genesis 14 beside Hebrews 7. Choose a ribbon to read both passages.", () => CH.ribbon("christ-melchizedek", [{ id: "m", ...G.hebrews.parallels.melchizedek }])),
        ] },
        { id: "did", art: "life", tone: "revelation", title: "What he did", lead: "His life as the letters remember it, his death, rising and return, and how the churches remembered him.", parts: [
          part("life", c("life", "prophets", "clock", "His life", "His life as the letters recall it", "His birth, his ministry and his example, as the letters mention them.", "From Torrey's topics", "Follow his life"), "What the letters remember of his life.", () => CH3.topics("christ-life", "life-and-ministry")),
          part("cross", c("christ", "revelation", "cross", "Cross and crown", "The cross, the rising and the return", "His death, resurrection, ascension and coming again.", "From Torrey's topics", "Read the passages"), "His death, his rising and his return, in the letters.", () => CH3.topics("christ-cross", "cross-resurrection-return")),
          part("coming", c("themes", "acts", "link", "A shared thread", "The Lord's coming", "The hope every collection holds: that he will come again.", "Across the collections", "Follow the thread"), "One of the threads that run through every collection.", () => CH3.theme("The Lord's coming")),
          part("table", c("glance", "epistles", "book", "Remembered together", "The Lord's table and baptism", "How the churches remembered him: the bread and the cup, and baptism into his name.", "From Torrey's topics", "Read the passages"), "The ordinances and fellowship of the churches, in the letters.", () => CH3.topics("christ-table", "ordinances-and-fellowship")),
        ] },
        { id: "life", art: "themes", tone: "poetry", title: "Life in him", lead: "What it means to be \"in Christ\": his people, his church, prayer, and faith that works.", parts: [
          part("in-christ", c("themes", "poetry", "link", "In Christ", "Believers and Christ", "Union with him: in him, with him, for him.", "From Torrey's topics", "Read the passages"), "How the letters speak of believers and Christ.", () => CH3.topics("christ-in", "believers-and-christ")),
          part("church", c("people", "acts", "users", "His body", "The church", "The church as his body, his bride and his household.", "From Torrey's topics", "Read the passages"), "The church, as the letters picture it.", () => CH3.topics("christ-church", "the-church")),
          part("prayer", c("john", "revelation", "lamp", "Prayer", "Prayer in the letters", "Prayer in his name: asking, giving thanks, praying for one another.", "From Torrey's topics", "Read the passages"), "Prayer, in the letters.", () => CH3.topics("christ-prayer", "prayer")),
          part("faith", c("themes", "history", "link", "A shared thread", "Faith that works", "Justified by faith, yet created for good works: Paul and James side by side.", "Across the collections", "Follow the thread"), "One of the threads that run through the collections.", () => CH3.theme("Faith that works")),
        ] },
      ] },
    came: { ...common, slug: "how-the-letters-came-to-be", title: "How the letters came to be", right: "HOW THE LETTERS CAME TO BE", tone: "prophets", kicker: "Across all twenty-one · Origins",
      h1: "How the letters came to be.", em: "Dictated, signed and carried.", emblem: "mail", caption: "IN TIME · ON THE ROAD · THE LETTER ITSELF",
      intro: "When the letters were written and in what order, where they were written and where they went, who carried them, and how an ancient letter was put together.",
      figures: () => [["Written", "widest range proposed", "AD 40–180"], ["Letters", "in four collections", 21], ["Named hands", "who wrote or carried", O.hands.length], ["Letters mentioned", "one letter naming another", O.letterLinks.length]],
      sections: [
        { id: "time", art: "when", tone: "prophets", title: "In time", lead: "When they were written, in what order, and who proposed each date.", parts: [
          part("when", c("when", "prophets", "clock", "In time", "When they were written", "All twenty-one on one line of years, coloured by collection.", "AD 40–180", "See the timeline"), "All twenty-one on one line of years, coloured by collection.", () => CH.years("all-when", { title: "When the letters were written", claim: "Each bar spans the widest range of dates the sources propose. No letter states its own date; 2 John and 3 John have no proposed date in these sources.", events: ALL.filter((l) => l.date.from).map((l) => ({ label: l.name, from: l.date.from, to: l.date.to, kind: { paul: "Paul's letters", hebrews: "Hebrews", general: "James, Peter & Jude", john: "The letters of John" }[O.groupOf[l.code]], refs: [] })) }, (e) => ({ "Paul's letters": "epistles", Hebrews: "gospels", "James, Peter & Jude": "acts", "The letters of John": "revelation" })[e.kind])),
          part("order", c("shape", "history", "bars", "In order", "Written order and Bible order", "The Bible puts Paul's letters first, longest to shortest; by date the order changes.", "21 letters", "See both orders"), "The order of the Bible beside the order of the earliest date proposed for each letter.", () => CH3.order("all-order")),
          part("paul-life", c("life", "epistles", "clock", "Paul's years", "Paul's life and letters", "His life on one line of years, each letter placed where it was written.", "AD 30–68", "See the timeline"), "Paul's life above the years, his letters below.", () => CH.years("all-paul-life", G.paul.timelines["pauls-life"], (e) => ({ life: "ink", journey: "prophets", prison: "revelation", letter: "epistles" })[e.kind] ?? "prophets")),
          part("dates", c("questions", "revelation", "split", "The debate", "Who dated each letter, and how", "Each letter's dating in a paragraph, with the scholars who proposed it.", "21 letters", "Read the dates"), "How each letter has been dated, and by whom.", () => CH3.facts("all-dates", "date", "when it was written")),
        ] },
        { id: "road", art: "where", tone: "poetry", title: "On the road", lead: "Where the letters were written, where they went, and the roads they travelled.", parts: [
          part("where", c("where", "poetry", "map", "On the map", "Where the letters went", "The places each collection's letters were sent to.", "Four collections", "Open the map"), "Toggle a collection to see the places its letters were sent. Click a place to read about it.", () => CH.map("all-where", [["paul", "letter-destinations", "Paul's letters"], ["hebrews", "destinations", "Hebrews"], ["general", "first-peter-provinces", "James, Peter & Jude"], ["john", "ephesus", "The letters of John"]].map(([g, id, title]) => ({ id: `${g}-${id}`, ...G[g].maps[id], title, route: false })))),
          part("from", c("glance", "prophets", "book", "Written from", "Where each was written", "Corinth, Ephesus, Rome or a prison cell: where each letter was written, and why that is thought.", "21 letters", "Read each one"), "Where each letter was written, and the reasons given.", () => CH3.facts("all-from", "writtenFrom", "where it was written")),
          part("travels", c("paul", "epistles", "route", "Carried", "How Paul's letters travelled", "Each of Paul's thirteen, from where it was written to where it went.", "13 routes", "Open the map"), "Each of Paul's letters, from where it was written to where it was sent.", () => CH3.travels("all-travels")),
          part("journeys", c("paul", "acts", "route", "The roads", "Paul's journeys and Silvanus's road", "The roads the letters' writers and couriers walked.", "Three journeys · Rome · Hort's route", "Open the map"), "Paul's journeys, the voyage to Rome, and the road Hort suggested for 1 Peter.", () => CH.map("all-journeys", [...["journey-1", "journey-2", "journey-3", "voyage-rome"].map((id) => ({ id, ...G.paul.maps[id] })), { id: "silvanus", ...G.general.maps["silvanus-route"] }])),
        ] },
        { id: "letter", art: "form", tone: "epistles", title: "The letter itself", lead: "How an ancient letter was built, and the hands that wrote and carried these ones.", parts: [
          part("form", c("form", "epistles", "mail", "An ancient letter", "How a letter was built", "The seven parts every letter of the day followed, from the greeting to the farewell.", "7 parts", "See the parts"), "The seven parts every letter of the day followed, with examples.", () => CH2.listDetail("all-form", O.letterForm, { title: (f) => f.part, body: (f) => f.claim, refs: (f) => f.examples, count: true })),
          part("secretaries", c("hands", "history", "pen", "The pen", "Secretaries and the writer's own hand", "Who took down the letters, and where the writer took the pen himself.", "Tertius · Silvanus · Paul's own hand", "Meet them"), "The secretaries named, and the places the writer wrote in his own hand.", () => CH2.hands("all-secretaries", ["secretary", "own-hand"], false)),
          part("carriers", c("onesimus", "acts", "mail", "The road", "Carriers and co-senders", "Phebe, Tychicus, Onesimus, Epaphroditus: who carried the letters, and who sent them with the writer.", "Phebe · Tychicus · More", "Meet them"), "Who carried the letters, and who joined the writer in sending them.", () => CH2.hands("all-carriers", ["carrier", "co-sender"], false)),
          part("mentions", c("compare", "prophets", "link", "Letters about letters", "Letters that mention letters", "Fourteen places where one letter speaks of another, some of them lost.", "14 mentions", "Read them"), "Where one letter speaks of another, including letters now lost.", () => CH3.letterLinks()),
        ] },
      ] },
    runs: { ...common, slug: "what-runs-through-them", title: "What runs through them", right: "WHAT RUNS THROUGH THEM", tone: "epistles", kicker: "Across all twenty-one · Shared",
      h1: "What runs through them.", em: "One Scripture, many voices.", emblem: "book", caption: "SCRIPTURE · WORDS · THREADS",
      intro: "The Old Testament the letters quote, the Greek words they lean on, and the threads, people and places that run from one collection into another.",
      figures: () => [["Quotations", "of the Old Testament", quotes], ["Quoted again", "Old Testament verses", [...new Set(ALL.flatMap((l) => l.otQuotes.map((q) => q.from)))].filter((f) => ALL.flatMap((l) => l.otQuotes).filter((q) => q.from === f).length > 1).length], ["Threads", "across the collections", O.themes.length], ["People", "in more than one collection", O.sharedPeople.length]],
      sections: [
        { id: "scripture", art: "ot", tone: "epistles", title: "Scripture", lead: "The Old Testament behind the letters: where it comes from, what is quoted again and again, and who quotes most.", parts: [
          part("ot", c("ot", "epistles", "book", "Old Testament", "The Old Testament behind them", "Every quotation traced from the book it comes from to the letters that quote it.", "Psalms · Isaiah · Genesis · More", "Follow the quotations"), "Click a book or a collection to see every passage.", () => CH2.flow("all-ot")),
          part("repeated", c("words", "prophets", "star", "Again and again", "Verses quoted more than once", "Genesis 15:6, Isaiah 28:16, Leviticus 19:18, Psalm 110:1: the verses the letters keep returning to.", "Most quoted first", "See the verses"), "The Old Testament verses quoted in more than one place in the letters.", () => CH3.repeated("all-repeated")),
          part("ot-people", c("people", "poetry", "users", "Old Testament people", "The Old Testament people they name", "Adam, Abraham, Sarah, Moses, Rahab, Elijah… named across the collections.", "10 people", "Meet them"), "The Old Testament people named in more than one collection.", () => CH3.otPeople("all-ot-people")),
          part("quoters", c("shape", "history", "bars", "Who quotes most", "Which letters quote most", "Romans and Hebrews lead; some letters quote none.", "21 letters", "See the counts"), "How many Old Testament quotations each letter makes.", () => CH3.quoteCounts("all-quoters")),
        ] },
        { id: "words", art: "words", tone: "gospels", title: "Words", lead: "The Greek words the letters lean on, letter by letter and collection by collection.", parts: [
          part("lean", c("words", "gospels", "star", "Greek words", "The words they lean on", "Each collection's key Greek words added together; a bigger star means more uses.", "Four collections", "See the words"), "Each collection's key words, side by side.", () => CH2.wordTable("all-words")),
          part("each", c("words", "prophets", "star", "Letter by letter", "Each letter's own words", "Choose any of the twenty-one to see the words it leans on.", "21 letters", "Choose a letter"), "The key Greek words of any one letter.", () => CH3.letterWords("all-each-words")),
          part("shared", c("themes", "acts", "link", "Shared words", "Words more than one collection leans on", "The key words that turn up in several collections at once.", "In three or more collections", "See them"), "Key words that three or more collections lean on.", () => CH2.wordTable("all-shared-words", 3)),
          part("only-here", c("glance", "revelation", "book", "Only here", "Words found nowhere else in the New Testament", "Greek words a single letter uses that no other New Testament book does.", "Hebrews has the most", "Choose a letter"), "Words only one letter uses, counted in the Greek text.", () => CH3.onlyHere("all-only-here")),
        ] },
        { id: "threads", art: "themes", tone: "acts", title: "Threads", lead: "The themes, people, places and topics that run from one collection into another.", parts: [
          part("share", c("themes", "acts", "link", "Shared threads", "What the collections share", "Ten threads that run through more than one collection.", "Faith that works · Holiness · More", "Follow a thread"), "Choose a thread to follow it.", () => CH2.listDetail("all-themes", O.themes, { title: (t) => t.title, body: (t) => t.claim, letters: (t) => t.letters, refs: (t) => t.refs })),
          part("people", c("people", "poetry", "users", "Names", "People who cross the collections", "Twenty-one people named in more than one collection.", "Timothy · Silas · Mark · More", "Meet them"), "Choose a name to see who they were and where they appear.", () => CH2.listDetail("all-people", O.sharedPeople, { title: (p) => p.name, body: (p) => p.claim, letters: (p) => p.letters })),
          part("places", c("where", "prophets", "map", "Places", "The places the letters name", "Every place the twenty-one name, from Rome to Babylon, and which letters name it.", "Most named first", "See the places"), "Every place the letters name, and where.", () => CH3.places("all-places")),
          part("topics", c("questions", "history", "tags", "Topics", "The Topics that draw most on the letters", "Which of the site's 623 topics cite the letters most.", "From the Topics library", "See the topics"), "The topics in the site's Topics library that cite the letters most.", () => CH3.topicsTop("all-topics")),
        ] },
      ] },
    closer: { ...common, slug: "look-closer", title: "Look closer", right: "LOOK CLOSER", tone: "prophets", kicker: "Across all twenty-one · Side by side",
      h1: "Look closer.", em: "Side by side, part by part.", emblem: "compare", caption: "SIDE BY SIDE · SHAPE · HOW THEY WERE READ",
      intro: "Set any two letters side by side, see the shape and length of each one, and follow how the church has read and received them.",
      figures: () => [["Side by side", "paired passages", "9 pairings"], ["Cross-references", "between the letters", links.toLocaleString("en-US")], ["Open questions", "every view shown", questions], ["Witnesses", "from Clement on", O.canon.length]],
      sections: [
        { id: "side", art: "compare", tone: "prophets", title: "Side by side", lead: "Any two letters, the nine pairings the studies hold, and how the letters link to each other and to the Gospels.", parts: [
          part("compare", c("compare", "prophets", "compare", "Side by side", "Compare any two letters", "Pick two. Each ribbon joins a verse in one to a verse in the other.", "OpenBible.info cross-references", "Choose two"), "Choose any two of the twenty-one.", () => CH2.compare("compare")),
          part("pairings", c("compare", "acts", "compare", "Nine pairings", "Every pairing in one place", "Ephesians and Colossians, Jude and 2 Peter, the Day of Atonement and more.", "9 pairings", "Choose one"), "All nine side-by-side pairings from the collections, in one place.", () => CH3.allParallels("all-pairings")),
          part("grid", c("canon", "epistles", "check", "Most linked", "Which letters are most linked", "Every pair of letters, shaded by how many cross-references join them.", "21 × 21", "See the grid"), "How many cross-references join each pair of letters.", () => CH3.grid("all-grid")),
          part("gospels", c("compare", "gospels", "compare", "Beside the Gospels", "The letters beside the Gospels and Acts", "How often each letter is linked to Matthew, Mark, Luke, John and Acts.", "21 × 5", "See the links"), "Cross-references from each letter to the Gospels and Acts.", () => CH3.gospels("all-gospels")),
        ] },
        { id: "shape", art: "shape", tone: "history", title: "Shape", lead: "Each letter as long as it is, what its parts do, how long it runs in Greek, and its key verses.", parts: [
          part("shapes", c("shape", "epistles", "bars", "Length", "All twenty-one, side by side", "Each letter as long as it is, cut into its section headings.", "2,767 verses · section headings", "See the shapes"), "Each letter, cut into its section headings.", () => CH2.shape("all-shape")),
          part("kinds", c("shape", "history", "bars", "Its parts", "What each part does", "Teaching, practice, warning, encouragement: each letter's parts, coloured by what they do.", "Teaching · Practice · More", "See the parts"), "Each letter's parts, coloured by what they do.", () => CH3.kinds("all-kinds")),
          part("greek", c("words", "gospels", "star", "In Greek", "Their length in Greek words", "Romans runs to 7,179 Greek words; 3 John to 219.", "Byzantine Greek text", "See the counts"), "Greek words in each letter.", () => CH3.greek("all-greek")),
          part("key-verses", c("glance", "prophets", "book", "Key verses", "Key verses, letter by letter", "The verses each letter turns on, with why each matters.", `${ALL.reduce((n, l) => n + l.keyVerses.length, 0)} key verses`, "Choose a letter"), "The key verses of any one letter, in the KJV.", () => CH3.keyVerses("all-key-verses")),
        ] },
        { id: "read", art: "questions", tone: "revelation", title: "How they were read", lead: "The questions readers have asked, how the letters were gathered and received, and one verse in every translation.", parts: [
          part("questions", c("questions", "history", "split", "Open questions", "Where readers have differed", "Every open question from all four collections and the letters as a whole.", `${questions} questions`, "Read the views"), "Each answer shown with the people who held it.", () => CH3.allQuestions("all-questions")),
          part("gathered", c("form", "epistles", "mail", "The collection", "How they were gathered and ordered", "From letters read aloud and swapped between churches to one ordered collection.", "From Marcion to the councils", "Read it"), "How the letters were gathered into a collection and put in order.", () => CH3.gathered()),
          part("received", c("canon", "revelation", "check", "The canon", "How they were received", "Witness by witness, when each letter was used, doubted and accepted.", `${O.canon.length} witnesses`, "See the witnesses"), "Witness by witness, across all twenty-one.", () => CH.canon("all-canon", O.canon, O.order.map((code) => ({ code, name: O.names[code] })))),
          part("translations", c("john", "poetry", "lamp", "In every tongue", "One verse in every translation", "Each letter's first key verse in all the site's translations, from Latin to Chinese.", "32 translations", "Choose a letter"), "One key verse from any letter, in every translation on the site.", () => CH3.translations("all-translations")),
        ] },
      ] },
  };
  for (const [k, col] of Object.entries(SUPERS)) COLL.register(k, col);

  // ── The Letters home: the four collections, then the four ways in ─────────────────────
  const wayCard = (k, art, eyebrow, text) => { const s = SUPERS[k]; return { art, tone: s.tone, icon: s.emblem, eyebrow, title: s.title, text, foot: s.sections.map((x) => x.title).join(" · "), cta: `Open ${s.title}`, href: `#/${s.slug}` }; };
  const ways = { id: "across", title: "Across all twenty-one", lead: "Four ways to read the letters together.", cards: [
    wayCard("christ", "christ", "The heart of it", "Who the letters say he is, what they remember of him, and life in him."),
    wayCard("came", "form", "Origins", "When and where they were written, who carried them, and how a letter was built."),
    wayCard("runs", "themes", "Shared", "The Old Testament they quote, the words they lean on, and the threads between them."),
    wayCard("closer", "compare", "Side by side", "Any two letters side by side, the shape of each, and how the church read them.")] };
  function home() {
    const rows = [HUB_ROWS[0], ways];
    return `
      <div class="topline"><a href="/study">${icon("arrowLeft", 15)}Back to Study</a><span>LETTERS</span></div>
      <header class="intro">
        <div class="intro-copy"><p class="kicker">Study · New Testament letters</p><h1>Twenty-one letters.<br><em>Read as they were sent.</em></h1>
          <p>Written to real churches and friends, dictated and signed, carried by hand and read aloud. Choose a collection to read its letters, or a way in to read across all twenty-one.</p></div>
        <div class="emblem" aria-hidden="true">${icon("mail", 120)}<span>WRITTEN · CARRIED · READ ALOUD</span></div>
      </header>
      <dl class="figures"><div><dt>Letters</dt><dd>21</dd></div><div><dt>Verses</dt><dd>2,767</dd></div><div><dt>Collections</dt><dd>4</dd></div><div><dt>Written</dt><dd>AD 40–180</dd></div></dl>
      <nav class="jump" aria-label="Sections">${rows.map((r, i) => `<a href="#row-${r.id}" onclick="document.getElementById('row-${r.id}').scrollIntoView({behavior:'smooth'});return false"><span>${pad2(i + 1)}</span>${r.title}</a>`).join("")}</nav>
      ${rowsHtml(rows)}
      <p class="sources-line">Public-domain works and the biblical text itself. <a href="${LIVE}">Where this page comes from →</a></p>`;
  }
  ROUTES[0] = [/^$/, home];

  // The old home cards' addresses land on their new place.
  const OLD = { "when-they-were-written": ["came", "time", "when"], "where-the-letters-went": ["came", "road", "where"], "how-a-letter-was-built": ["came", "letter", "form"],
    "who-wrote-and-carried-them": ["came", "letter", "secretaries"], "the-old-testament-behind-them": ["runs", "scripture", "ot"], "the-words-they-lean-on": ["runs", "words", "lean"],
    "what-the-groups-share": ["runs", "threads", "share"], "people-who-cross-the-groups": ["runs", "threads", "people"], "compare-any-two-letters": ["closer", "side", "compare"],
    "all-twenty-one-side-by-side": ["closer", "shape", "shapes"], "where-readers-have-differed": ["closer", "read", "questions"], "how-they-were-gathered-and-received": ["closer", "read", "received"] };
  for (const [old, [k, s, p]] of Object.entries(OLD)) ROUTES.push([new RegExp(`^${old}$`), () => { location.replace(`#/${SUPERS[k].slug}/${s}/${p}`); return ""; }]);
})();
