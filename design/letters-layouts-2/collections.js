// Layout 2's four collections. Each collection page: title, a figures-style bar (also the letter picker), and three rows
// of four cards; each card opens its section's page (four parts, one under another) scrolled to that card's part.
(() => {
  const G = LETTERS.groups;
  const chosen = { paul: "Romans", hebrews: "Hebrews", general: "James", john: "1 John" };
  ACTIONS.cletter = (arg) => { const [c, name] = arg.split("|"); chosen[c] = name; };
  const letterOf = (c) => G[c].letters.find((l) => l.name === chosen[c]) ?? G[c].letters[0];
  const dates = (l) => (l.date.from ? `AD ${l.date.from}${l.date.to && l.date.to !== l.date.from ? `–${l.date.to}` : ""}` : "Not dated");
  const net = (c, id) => G[c].networks[id], tl = (c, id) => G[c].timelines[id], par = (c, ...ids) => ids.map((id) => ({ id, ...G[c].parallels[id] }));
  const maps = (c, ...ids) => ids.map((id) => ({ id, ...G[c].maps[id] }));
  const LIFE_TONES = { life: "ink", journey: "prophets", prison: "revelation", letter: "epistles" };

  // The four parts every letter's "Inside" section shows, for whichever letter is chosen.
  const insideParts = (c, what) => [
    { id: "glance", card: { art: "glance", tone: "epistles", icon: "book", eyebrow: "At a glance", title: () => `${letterOf(c).name} at a glance`, text: "Who wrote it, to whom, from where and when, with its key verses and themes.", foot: "Key verses · Themes", cta: "Read the overview" },
      lead: "Who wrote it, to whom, from where, when and why; its key verses and its themes.", body: () => CH.glance(`${c}-glance-${letterOf(c).code}`, letterOf(c)) },
    { id: "shape", card: { art: "shape", tone: "history", icon: "bars", eyebrow: "Its shape", title: "How it is built", text: "The letter cut into its sections, and its outline in our own words.", foot: "Teaching · Practice · Personal", cta: "See the outline" },
      lead: "The letter cut into its parts, in our own words, coloured by what each part does.", body: () => CH.outline(`${c}-shape-${letterOf(c).code}`, letterOf(c)) },
    { id: "words", card: { art: "words", tone: "gospels", icon: "star", eyebrow: "Greek words", title: "The words it leans on", text: "Its key Greek words as stars; choose one for every verse.", foot: "Every verse behind each star", cta: "See the words" },
      lead: "Its key Greek words, counted in the Greek text.", body: () => CH.words(`${c}-words-${letterOf(c).code}`, letterOf(c)) },
    what === "people"
      ? { id: "names", card: { art: "people", tone: "poetry", icon: "users", eyebrow: "Who and where", title: () => `People and places in ${letterOf(c).name}`, text: "Everyone the letter names, and every place, with where it names them.", foot: "People · Places", cta: "See the names" },
        lead: "Everyone and everywhere the letter names.", body: () => CH.peoplePlaces(`${c}-names`, letterOf(c)) }
      : { id: "ot", card: { art: "ot", tone: "epistles", icon: "book", eyebrow: "Old Testament", title: () => `The Old Testament behind ${letterOf(c).name}`, text: "Each quotation linked to the passage it comes from.", foot: "Psalms · Isaiah · More", cta: "Follow the quotations" },
        lead: "Each quotation, linked to the passage it comes from.", body: () => CH.oldTestament(`${c}-ot`, letterOf(c)) },
  ];
  const readParts = (c, first) => [
    ...first,
    { id: "questions", card: { art: "questions", tone: "history", icon: "split", eyebrow: "Open questions", title: "Where readers have differed", text: "Each answer shown with the people who held it.", foot: `${G[c].questions.length} questions`, cta: "Read the views" },
      lead: `${G[c].questions.length} questions about ${c === "hebrews" ? "this letter" : "these letters"}, each answer with the people who held it.`, body: () => CH.questions(`${c}-questions`, G[c].questions) },
    { id: "canon", card: { art: "canon", tone: "revelation", icon: "check", eyebrow: "The canon", title: c === "hebrews" ? "How it was received" : "How they were received", text: "Witness by witness, when each letter was used, doubted and accepted.", foot: `${G[c].canon.length} witnesses`, cta: "See the witnesses" },
      lead: "Witness by witness, when each letter was quoted, used and accepted.", body: () => CH.canon(`${c}-canon`, G[c].canon, G[c].letters) },
  ];

  const COLLECTIONS = {
    paul: {
      slug: "paul", title: "Paul's letters", right: "PAUL'S LETTERS", tone: "epistles", kicker: "Thirteen letters · Paul", h1: "Paul's letters.", em: "Written on the road.",
      intro: "Letters to young churches and to friends, from his first visit to Thessalonica to his last days in Rome. Choose a letter, then a card.",
      emblem: "route", caption: "EARLY · MAJOR · PRISON · PASTORAL", bar: "groups", sources: "Each letter's people and places, and this page's sources, open from its overview card.",
      sections: [
        { id: "story", art: "paul", tone: "epistles", title: "Paul's story", lead: "The journeys, the years, and the friends who travelled with him.", parts: [
          { id: "map", card: { art: "paul", tone: "epistles", icon: "route", eyebrow: "On the map", title: "Journeys and destinations", text: "Each journey drawn leg by leg, with the places his letters were sent.", foot: "Three journeys · the voyage to Rome", cta: "Open the map" },
            lead: "Choose a journey to follow it; the rings mark where his letters went.", body: () => CH.map("paul-map", maps("paul", "journey-1", "journey-2", "journey-3", "voyage-rome", "letter-destinations")) },
          { id: "time", card: { art: "life", tone: "prophets", icon: "clock", eyebrow: "In time", title: "Paul's life and letters", text: "His life on one line of years, each letter placed where it was written.", foot: "From his calling to Rome", cta: "See the timeline" },
            lead: "His life on one line of years, and each letter where it was written.", body: () => CH.years("paul-time", tl("paul", "pauls-life"), (e) => LIFE_TONES[e.kind] ?? "prophets") },
          { id: "companions", card: { art: "people", tone: "poetry", icon: "users", eyebrow: "Companions", title: "His companions over time", text: "Who travelled and wrote with him, and when.", foot: "Timothy · Silas · Luke · More", cta: "Meet them" },
            lead: "The people who travelled and worked with him.", body: () => CH.network("paul-companions", net("paul", "companions"), "paul") },
          { id: "onesimus", card: { art: "onesimus", tone: "acts", icon: "mail", eyebrow: "A story in letters", title: "The story of Onesimus", text: "A runaway slave sent home with a letter from Rome to Colossae.", foot: "Philemon · Colossians", cta: "Follow the story" },
            lead: "A runaway sent home with a letter, from Paul's prison to Philemon's house.", body: () => CH.steps("paul-onesimus", tl("paul", "onesimus")) },
        ] },
        { id: "inside", art: "glance", tone: "prophets", title: () => `Inside ${chosen.paul}`, lead: "Choose any of the thirteen; these four cards follow it.", picker: true, parts: insideParts("paul") },
        { id: "side", art: "compare", tone: "poetry", title: "Side by side, and how they were read", lead: "Pairs of letters, the people Paul greets, and how the church received them.", parts: readParts("paul", [
          { id: "ephcol", card: { art: "compare", tone: "prophets", icon: "compare", eyebrow: "Twin letters", title: "Ephesians and Colossians", text: "Two letters written close together, passage against passage.", foot: "31 paired passages", cta: "Compare them" },
            lead: "Thirty-one passages that run in parallel. Choose a ribbon to read both side by side.", body: () => CH.ribbon("paul-ephcol", par("paul", "ephesians-colossians")) },
          { id: "romans16", card: { art: "people", tone: "poetry", icon: "users", eyebrow: "Romans 16", title: "The people of Paul's greetings", text: "Every name in Romans 16, and where else Scripture names them.", foot: "Phebe · Priscilla and Aquila · More", cta: "Meet them" },
            lead: "Every name in Romans 16, and how the chapter links them.", body: () => CH.network("paul-romans16", net("paul", "romans-16"), "paul") },
        ]) },
      ],
    },
    hebrews: {
      slug: "hebrews", title: "Hebrews", right: "HEBREWS", tone: "gospels", kicker: "One long sermon · Hebrews", h1: "Hebrews.", em: "A better covenant.",
      intro: G.hebrews.tagline, emblem: "tent", caption: "SERMON · LETTER · UNSIGNED", bar: "figures", sources: "The letter's people and places are under Inside Hebrews.",
      sections: [
        { id: "argument", art: "hebrews", tone: "gospels", title: "The argument", lead: "How the sermon makes its case: Christ better at every step, read against the Law it fulfils.", parts: [
          { id: "better", card: { art: "hebrews", tone: "gospels", icon: "tent", eyebrow: "Step by step", title: "Better than…", text: "Ten steps up the argument: better than prophets, angels, Moses and the old priesthood.", foot: "10 steps", cta: "Climb the steps" },
            lead: "Each step of the argument, and what it is better than.", body: () => CH.ladder("hebrews-better", G.hebrews.ladders.better) },
          { id: "shape", card: { art: "shape", tone: "history", icon: "bars", eyebrow: "Its shape", title: "How it is built", text: "Teaching, warning and encouragement, part by part.", foot: "22 parts", cta: "See the outline" },
            lead: "The sermon cut into its parts, coloured by teaching, warning and encouragement.", body: () => CH.outline("hebrews-shape", G.hebrews.letters[0]) },
          { id: "atonement", card: { art: "compare", tone: "prophets", icon: "compare", eyebrow: "Side by side", title: "The Day of Atonement and Hebrews 9", text: "Leviticus 16 read beside the high priest's single entry with his own blood.", foot: `${G.hebrews.parallels["day-of-atonement"].pairs.length} paired passages`, cta: "Compare them" },
            lead: "Leviticus 16 beside Hebrews 9. Choose a ribbon to read both passages.", body: () => CH.ribbon("hebrews-atonement", par("hebrews", "day-of-atonement")) },
          { id: "melchizedek", card: { art: "compare", tone: "acts", icon: "compare", eyebrow: "Side by side", title: "Melchizedek", text: "Genesis 14 and Hebrews 7: the priest-king without beginning or end.", foot: `${G.hebrews.parallels.melchizedek.pairs.length} paired passages`, cta: "Compare them" },
            lead: "Genesis 14 beside Hebrews 7. Choose a ribbon to read both passages.", body: () => CH.ribbon("hebrews-melchizedek", par("hebrews", "melchizedek")) },
        ] },
        { id: "inside", art: "glance", tone: "prophets", title: "Inside Hebrews", lead: "The letter at a glance, its hall of faith, the words it leans on and the Old Testament behind it.", parts: [
          insideParts("hebrews")[0],
          { id: "faith", card: { art: "life", tone: "poetry", icon: "clock", eyebrow: "Hebrews 11", title: "The hall of faith", text: "From Abel to the prophets, each example in the order of the story.", foot: `${G.hebrews.timelines["hall-of-faith"].events.length} examples`, cta: "Walk the hall" },
            lead: "Each example of faith, in the order of the Old Testament story.", body: () => CH.steps("hebrews-faith", tl("hebrews", "hall-of-faith")) },
          insideParts("hebrews")[2], insideParts("hebrews")[3],
        ] },
        { id: "read", art: "questions", tone: "history", title: "Its readers, and how it was read", lead: "Where the first readers may have lived, who is named, and how the church received the letter.", parts: readParts("hebrews", [
          { id: "readers", card: { art: "where", tone: "poetry", icon: "map", eyebrow: "On the map", title: "Where the first readers may have lived", text: "Five places proposed, each with the people who proposed it.", foot: "Jerusalem · Rome · More", cta: "Open the map" },
            lead: "Five places proposed for the first readers. Click a pin to see who proposed it.", body: () => CH.map("hebrews-readers", maps("hebrews", "destinations")) },
          insideParts("hebrews", "people")[3],
        ]) },
      ],
    },
    general: {
      slug: "james-peter-and-jude", title: "James, Peter & Jude", right: "JAMES, PETER & JUDE", tone: "acts", kicker: "Four letters · James, Peter & Jude", h1: "James, Peter & Jude.", em: "To believers far from home.",
      intro: G.general.tagline, emblem: "globe", caption: "JAMES · 1 PETER · 2 PETER · JUDE", bar: "letters", sources: "Each letter's people and places are under its overview card.",
      sections: [
        { id: "writers", art: "general", tone: "acts", title: "The writers and their readers", lead: "Two brothers of Jesus and an apostle, and the scattered believers they wrote to.", parts: [
          { id: "family", card: { art: "people", tone: "poetry", icon: "users", eyebrow: "The family", title: "The family of Jesus", text: "James and Jude, named among the brothers of Jesus, and the family around them.", foot: "James · Joses · Juda · Simon", cta: "Meet them" },
            lead: "The family of Jesus, as the Gospels and the letters name them.", body: () => CH.network("general-family", net("general", "jesus-family"), "jesus") },
          { id: "james", card: { art: "life", tone: "prophets", icon: "clock", eyebrow: "A life in steps", title: "James, the Lord's brother", text: "From unbelief to leading the church at Jerusalem, step by step.", foot: `${G.general.timelines["jesus-family"].events.length} steps`, cta: "Follow his story" },
            lead: "James, the Lord's brother, through the story.", body: () => CH.steps("general-james", tl("general", "jesus-family")) },
          { id: "provinces", card: { art: "where", tone: "acts", icon: "map", eyebrow: "On the map", title: "The five regions of 1 Peter", text: "Pontus, Galatia, Cappadocia, Asia and Bithynia: where Peter's readers lived.", foot: "5 regions", cta: "Open the map" },
            lead: "The five regions 1 Peter is written to.", body: () => CH.map("general-provinces", maps("general", "first-peter-provinces")) },
          { id: "babylon", card: { art: "paul", tone: "epistles", icon: "route", eyebrow: "On the map", title: "Babylon, and Silvanus's road", text: "Two candidates for the \"Babylon\" Peter writes from, and the road the letter may have taken.", foot: "Rome or Mesopotamia · Hort's route", cta: "Open the map" },
            lead: "Where \"Babylon\" may be, and the route Hort suggested for the letter.", body: () => CH.map("general-babylon", maps("general", "silvanus-route", "babylon")) },
        ] },
        { id: "inside", art: "glance", tone: "prophets", title: () => `Inside ${chosen.general}`, lead: "Choose any of the four; these four cards follow it.", picker: true, parts: insideParts("general") },
        { id: "side", art: "compare", tone: "poetry", title: "Side by side, and how they were read", lead: "The passages they share, the questions readers have asked, and how the church received them.", parts: readParts("general", [
          { id: "jude2pe", card: { art: "compare", tone: "prophets", icon: "compare", eyebrow: "Twin letters", title: "Jude and 2 Peter", text: "A run of the same material, passage against passage.", foot: `${G.general.parallels["jude-second-peter"].pairs.length} paired passages`, cta: "Compare them" },
            lead: "Jude beside 2 Peter. Choose a ribbon to read both passages.", body: () => CH.ribbon("general-jude2pe", par("general", "jude-second-peter")) },
          { id: "james-echoes", card: { art: "compare", tone: "acts", icon: "compare", eyebrow: "Echoes", title: "James beside Jesus and Peter", text: "James and the Sermon on the Mount, and the material James shares with 1 Peter.", foot: "Sermon on the Mount · 1 Peter", cta: "Compare them" },
            lead: "James beside the Sermon on the Mount, or beside 1 Peter.", body: () => CH.ribbon("general-james-echoes", par("general", "james-sermon", "james-first-peter")) },
        ]) },
      ],
    },
    john: {
      slug: "the-letters-of-john", title: "The letters of John", right: "THE LETTERS OF JOHN", tone: "revelation", kicker: "Three letters · John", h1: "The letters of John.", em: "Light, love and truth.",
      intro: G.john.tagline, emblem: "lamp", caption: "1 JOHN · 2 JOHN · 3 JOHN", bar: "letters", sources: "Each letter's people and places are under its overview card.",
      sections: [
        { id: "elder", art: "john", tone: "revelation", title: "The elder and his churches", lead: "Where the letters were read, who 3 John names, and the questions readers still ask.", parts: [
          { id: "ephesus", card: { art: "where", tone: "poetry", icon: "map", eyebrow: "On the map", title: "Ephesus and the churches of Asia", text: "Where tradition places John and the churches he wrote to.", foot: "Ephesus · Asia", cta: "Open the map" },
            lead: "Ephesus and the churches of Asia, by tradition.", body: () => CH.map("john-ephesus", maps("john", "ephesus")) },
          { id: "whos-who", card: { art: "people", tone: "acts", icon: "users", eyebrow: "3 John", title: "Who's who in 3 John", text: "The elder, Gaius, Diotrephes, Demetrius and the travelling brothers.", foot: "Gaius · Diotrephes · Demetrius", cta: "Meet them" },
            lead: "Everyone in 3 John, and how the letter links them.", body: () => CH.network("john-whos-who", net("john", "third-john"), "elder") },
          { id: "witnesses", card: { art: "when", tone: "prophets", icon: "clock", eyebrow: "In time", title: "The three heavenly witnesses", text: "How the words of 1 John 5:7 entered the printed Bible, witness by witness.", foot: "AD 258 – 1883", cta: "See the timeline" },
            lead: "How \"the three that bear record in heaven\" entered the printed Bible.", body: () => CH.years("john-witnesses", tl("john", "three-witnesses"), (e) => ({ disputed: "history", latin: "revelation", greek: "prophets", print: "epistles", defence: "acts", critics: "poetry" })[e.kind] ?? "prophets") },
          { id: "questions", card: { art: "questions", tone: "history", icon: "split", eyebrow: "Open questions", title: "Where readers have differed", text: "Each answer shown with the people who held it.", foot: `${G.john.questions.length} questions`, cta: "Read the views" },
            lead: `${G.john.questions.length} questions about these letters, each answer with the people who held it.`, body: () => CH.questions("john-questions", G.john.questions) },
        ] },
        { id: "inside", art: "glance", tone: "prophets", title: () => `Inside ${chosen.john}`, lead: "Choose any of the three; these four cards follow it.", picker: true, parts: insideParts("john") },
        { id: "side", art: "compare", tone: "poetry", title: "Side by side, and how they were received", lead: "The letters beside the Gospel and beside each other, and how the church received them.", parts: [
          { id: "gospel", card: { art: "compare", tone: "prophets", icon: "compare", eyebrow: "Beside the Gospel", title: "1 John and the Gospel of John", text: "The same words and ideas, passage against passage.", foot: `${G.john.parallels["gospel-bridge"].pairs.length} paired passages`, cta: "Compare them" },
            lead: "1 John beside the Gospel of John. Choose a ribbon to read both passages.", body: () => CH.ribbon("john-gospel", par("john", "gospel-bridge")) },
          { id: "echoes", card: { art: "compare", tone: "acts", icon: "compare", eyebrow: "Echoes", title: "2 John's echoes of 1 John", text: "The short letter repeating the long one.", foot: `${G.john.parallels["second-first"].pairs.length} paired passages`, cta: "Compare them" },
            lead: "2 John beside 1 John. Choose a ribbon to read both passages.", body: () => CH.ribbon("john-echoes", par("john", "second-first")) },
          { id: "twins", card: { art: "compare", tone: "poetry", icon: "compare", eyebrow: "Twin notes", title: "2 John and 3 John", text: "The formulas the two short notes share.", foot: `${G.john.parallels["twin-letters"].pairs.length} paired passages`, cta: "Compare them" },
            lead: "2 John beside 3 John. Choose a ribbon to read both passages.", body: () => CH.ribbon("john-twins", par("john", "twin-letters")) },
          readParts("john", [])[1],
        ] },
      ],
    },
  };

  // ── The figures-style bar under the title: Paul's groups, each letter, or Hebrews's figures ─────
  const pick = (c, name) => `<button type="button" class="chip" data-act="cletter" data-arg="${c}|${name}" aria-pressed="${name === chosen[c]}">${name}</button>`;
  function bar(c) {
    const col = COLLECTIONS[c], letters = G[c]?.letters ?? [], style = `style="--tone: var(--${col.tone})"`;
    if (col.bar === "groups") return `<dl class="figures letter-groups" ${style}>${G[c].groupings.map((g) => {
      const ls = g.letters.map((code) => letters.find((l) => l.code === code)), from = Math.min(...ls.map((l) => l.date.from)), to = Math.max(...ls.map((l) => l.date.to));
      const order = letters.filter((l) => g.letters.includes(l.code)); // the site's canonical order within the group
      return `<div><dt>${g.label}</dt><small>${ls.length} letters · ${ls.reduce((s, l) => s + l.verses, 0).toLocaleString("en-US")} verses</small><dd>AD ${from}–${to}</dd>
        <div class="chips">${order.map((l) => pick(c, l.name)).join("")}</div></div>`;
    }).join("")}</dl>`;
    if (col.bar === "letters") return `<dl class="figures letter-groups" ${style}>${letters.map((l) => `<div><dt>${l.name}</dt><small>${l.verses} verses</small><dd>${dates(l)}</dd>
      <div class="chips"><button type="button" class="chip" data-act="cletter" data-arg="${c}|${l.name}" aria-pressed="${l.name === chosen[c]}">Inside ${l.name}</button></div></div>`).join("")}</dl>`;
    if (col.bar === "custom") return `<dl class="figures letter-groups" ${style}>${col.figures().map(([dt, small, dd]) => `<div><dt>${dt}</dt><small>${small}</small><dd>${dd}</dd></div>`).join("")}</dl>`;
    const l = letters[0];
    return `<dl class="figures letter-groups" ${style}>
      <div><dt>Length</dt><small>${l.outline.length} parts</small><dd>${l.verses} verses</dd></div>
      <div><dt>Old Testament</dt><small>quotations</small><dd>${l.otQuotes.length}</dd></div>
      <div><dt>Key verses</dt><small>${l.themes.length} themes</small><dd>${l.keyVerses.length}</dd></div>
      <div><dt>Written</dt><small>widest range proposed</small><dd>${dates(l)}</dd></div></dl>`;
  }

  const titleOf = (x) => (typeof x === "function" ? x() : x);
  const partHref = (col, s, p) => `#/${col.slug}/${s.id}/${p.id}`;
  const scrollTo = (id) => setTimeout(() => document.getElementById(`part-${id}`)?.scrollIntoView(), 50);

  function collectionPage(c) {
    const col = COLLECTIONS[c];
    const rows = col.sections.map((s) => ({ id: s.id, title: titleOf(s.title), lead: s.lead, cards: s.parts.map((p) => ({ ...p.card, title: titleOf(p.card.title), href: partHref(col, s, p) })) }));
    return `
      ${crumbs([col.crumb ?? "The four collections"], col.right)}
      <header class="intro intro-to-groups" style="--tone: var(--${col.tone})">
        <div class="intro-copy"><p class="kicker">${col.kicker}</p><h1>${col.h1}<br><em>${col.em}</em></h1><p>${col.intro}</p></div>
        <div class="emblem" aria-hidden="true">${icon(col.emblem, 120)}<span>${col.caption}</span></div>
      </header>
      ${bar(c)}
      ${rowsHtml(rows, true)}
      <p class="sources-line">${col.sources} <a href="${LIVE}">Where this page comes from →</a></p>`;
  }

  function sectionPage(c, sectionId) {
    const col = COLLECTIONS[c], s = col.sections.find((x) => x.id === sectionId) ?? col.sections[0], n = col.sections.indexOf(s) + 1, others = col.sections.filter((x) => x !== s);
    const pager = (x) => `<a href="#/${col.slug}/${x.id}" style="--tone: var(--${x.tone})">${art(x.art, "mini")}<span><small>Section</small><b>${titleOf(x.title)}</b></span></a>`;
    return `
      ${crumbs([`<a href="#/${col.slug}">${col.title}</a>`, titleOf(s.title)], `SECTION ${pad2(n)} OF ${pad2(col.sections.length)}`)}
      <header class="chapter-head" style="--tone: var(--${s.tone})"><div><p class="kicker">${col.title} · ${s.parts.map((p) => p.card.eyebrow).join(" · ")}</p><h1>${titleOf(s.title)}</h1><p>${s.lead.replace("these four cards follow it", "all four parts below follow it")}</p></div>${art(s.art)}</header>
      ${s.picker ? bar(c) : ""}
      <nav class="jump" aria-label="In this section">${s.parts.map((p, i) => `<a href="#part-${p.id}" onclick="document.getElementById('part-${p.id}').scrollIntoView({behavior:'smooth'});return false"><span>${pad2(i + 1)}</span>${titleOf(p.card.title)}</a>`).join("")}</nav>
      ${s.parts.map((p, i) => `
        <section class="part" id="part-${p.id}" style="--tone: var(--${p.card.tone})">
          <div class="part-head"><span class="part-num">${pad2(i + 1)}</span><div><p class="kicker">${icon(p.card.icon, 14)} ${p.card.eyebrow}</p><h2>${titleOf(p.card.title)}</h2><p>${p.lead}</p></div>${art(p.card.art, "part-art")}</div>
          ${p.body()}
        </section>`).join("")}
      <nav class="pager" aria-label="Other sections">${others.map(pager).join("")}</nav>`;
  }

  /** Add a collection-shaped page (a collection, or one of the four ways in) and its addresses. */
  function register(c, col) {
    COLLECTIONS[c] = col;
    const ids = col.sections.map((s) => s.id).join("|");
    ROUTES.push([new RegExp(`^${col.slug}$`), () => collectionPage(c)],
      [new RegExp(`^${col.slug}\\/(${ids})(?:\\/([a-z0-9-]+))?$`), (m) => { if (m[2]) scrollTo(m[2]); return sectionPage(c, m[1]); }]);
  }
  for (const [c, col] of Object.entries(COLLECTIONS)) register(c, col);
  window.COLL = { register, partHref, COLLECTIONS };
})();
