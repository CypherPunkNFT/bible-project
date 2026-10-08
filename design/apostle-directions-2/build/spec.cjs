// This site's presentation of the reviewed apostle records: short titles, the four periods of the ring, the kinds of
// moment (the crystals), the cinema chapters and their drawings, the objects Scripture names, and the place icons.
// Nothing here adds a fact: every title shortens a record already in apostles-1/2.json, and every object carries the
// verse that names it (extract.cjs checks each quoted phrase against the KJV word for word).

// The Twelve and the people who travel with them, by the site's person ids (data/study/people/<id>.json).
const PEOPLE = {
  peter: ["peter-mat-4-18", "Peter"], andrew: ["andrew-mat-4-18", "Andrew"], jamesz: ["james-mat-4-21", "James son of Zebedee"],
  johnz: ["john-mat-4-21", "John son of Zebedee"], philip: ["philip-mat-10-3", "Philip"], bartholomew: ["bartholomew-mat-10-3", "Bartholomew"],
  thomas: ["thomas-mat-10-3", "Thomas"], matthew: ["matthew-mat-9-9", "Matthew"], jamesa: ["james-mat-10-3", "James son of Alphaeus"],
  thaddaeus: ["judas-mat-10-3", "Thaddaeus"], simonz: ["simon-mat-10-4", "Simon the Zealot"], iscariot: ["judas-mat-10-4", "Judas Iscariot"],
  nathanael: ["nathanael-jhn-1-45", "Nathanael"], matthias: ["matthias-act-1-23", "Matthias"],
  paul: ["paul-act-7-58", "Paul"], barnabas: ["barnabas-act-4-36", "Barnabas"], silas: ["silas-act-15-22", "Silas (Silvanus)"],
  timothy: ["timothy-act-16-1", "Timothy"], luke: ["luke-2co-13-13", "Luke"], mark: ["mark-act-12-12", "John Mark"], titus: ["titus-2co-2-13", "Titus"],
  aquila: ["aquila-act-18-2", "Aquila"], priscilla: ["priscilla-act-18-2", "Priscilla"], aristarchus: ["aristarchus-act-19-29", "Aristarchus"],
  tychicus: ["tychicus-act-20-4", "Tychicus"], trophimus: ["trophimus-act-20-4", "Trophimus"], epaphroditus: ["epaphroditus-php-2-25", "Epaphroditus"],
  onesimus: ["onesimus-col-4-9", "Onesimus"], demas: ["demas-col-4-14", "Demas"], ananias: ["ananias-act-9-10", "Ananias of Damascus"],
  gamaliel: ["gamaliel-act-5-34", "Gamaliel"], stephen: ["stephen-act-6-5", "Stephen"], jameslord: ["james-mat-13-55", "James, the Lord’s brother"],
  apollos: ["apollos-act-18-24", "Apollos"], cornelius: ["cornelius-act-10-1", "Cornelius"], lydia: ["lydia-act-16-14", "Lydia"],
  agabus: ["agabus-act-11-28", "Agabus"], philipev: ["philip-act-6-5", "Philip the evangelist"],
};
const TWELVE = ["peter", "andrew", "jamesz", "johnz", "philip", "bartholomew", "thomas", "matthew", "jamesa", "thaddaeus", "simonz", "iscariot"];

// Kinds of moment: the crystals. Icons are drawn in js/icons.js; tones are the site's section colours.
const KINDS = {
  called: { label: "Called and sent", icon: "net", tone: "--gospels" },
  saw: { label: "Beside Jesus", icon: "eye", tone: "--poetry" },
  words: { label: "His own words", icon: "quote", tone: "--epistles" },
  faltered: { label: "Faltering and rebuked", icon: "wave", tone: "--revelation" },
  risen: { label: "The risen Lord", icon: "sunrise", tone: "--prophets" },
  leading: { label: "Speaking for the church", icon: "flame", tone: "--acts" },
  journeys: { label: "Journeys", icon: "route", tone: "--history" },
  prison: { label: "Arrest and prison", icon: "chain", tone: "--revelation" },
  letters: { label: "In the letters", icon: "scroll", tone: "--epistles" },
  persecutor: { label: "The persecutor", icon: "stone", tone: "--revelation" },
  lord: { label: "The Lord speaks to him", icon: "sunrise", tone: "--prophets" },
  apostles: { label: "With the apostles", icon: "people", tone: "--gospels" },
  lists: { label: "Named in the lists", icon: "list", tone: "--gospels" },
  silence: { label: "Where Scripture falls silent", icon: "silence", tone: "--muted" },
};

const PERSONS = {
  peter: {
    id: "peter-mat-4-18", short: "Peter", names: ["Simon", "Peter", "Cephas", "Simeon", "Bar-jona"],
    pool: [...TWELVE.filter((k) => k !== "peter"), "nathanael", "matthias", "paul", "mark", "cornelius", "silas", "jameslord"],
    facts: [["home", "From Bethsaida; a house at Capernaum"], ["trade", "A fisherman with Andrew"], ["family.0", "Andrew’s brother"], ["family.1", "The son of Jona"], ["family.2", "A married man"]],
    actTitles: ["Choosing a twelfth apostle", "Pentecost", "The lame man at the temple gate", "Arrested with John", "Ananias and Sapphira; the council", "Sent to Samaria",
      "Lydda and Joppa", "Cornelius at Caesarea", "Prison, and the angel", "The council at Jerusalem", "Paul stays fifteen days; the pillars", "Withstood at Antioch",
      "A wife on his travels; “I of Cephas”", "“By Silvanus … at Babylon”"],
    order: null, // Gospel moments in the harmony's order, then Acts and the letters as recorded
    period: (e) => (e.type === "fact" ? 1 : e.type === "moment" ? 2 : e.type === "act" ? 3 : 4),
    periods: [
      { n: "I", title: "Before the call", sub: "Home, trade and family" },
      { n: "II", title: "With Jesus", sub: "The Gospels, in the harmony’s order" },
      { n: "III", title: "The church in Acts", sub: "Acts 1–15 and the letters" },
      { n: "IV", title: "After Scripture", sub: "Tradition, by who said it and when" },
    ],
    kinds: { called: ["m0", "m1", "m3", "m5", "m16"], saw: ["m2", "m4", "m10", "m11", "m14", "m18"], words: ["m7", "m8", "m12", "m13", "m15"],
      faltered: ["m6", "m9", "m17", "m19", "m20", "m21", "m22"], risen: ["m23", "m24", "m25", "m26"], leading: ["a0", "a1", "a2", "a4", "a9"],
      journeys: ["a5", "a6", "a7"], prison: ["a3", "a8"], letters: ["a10", "a11", "a12", "a13"] },
    accounts: [{ id: "call", title: "The first meeting and the call", from: "calling" }, { id: "m8", title: "“Thou art the Christ”" },
      { id: "m10", title: "On the mountain" }, { id: "m22", title: "The denial" }],
    pairDefault: "paul",
    hero: { art: "lake", caption: "Simon and Andrew “casting a net into the sea: for they were fishers.”", ref: [40004018, 40004018] },
    chapters: [
      { period: 1, title: "A fisherman of Bethsaida", slides: [{ fact: "trade", art: "nets" }, { fact: "home", art: "house" }, { fact: "family.2", art: "house" }] },
      { period: 2, title: "Three years beside Jesus", slides: [{ entry: "m1", art: "catch", verse: 42005006 }, { entry: "m6", art: "waves" }, { entry: "m8", art: "rock" },
        { entry: "m10", art: "mountain" }, { entry: "m22", art: "firecock" }, { entry: "m26", art: "shore", verse: 43021009 }] },
      { period: 3, title: "Jerusalem to Caesarea", slides: [{ entry: "a1", art: "tongues" }, { entry: "a2", art: "gate" }, { entry: "a7", art: "sheet", verse: 44010011 }, { entry: "a8", art: "chains", verse: 44012007 }] },
      { period: 4, title: "What Scripture leaves open", slides: [{ ending: "scripture.0", art: "girded" }, { trad: [0, 2, 5], art: "rome" }] },
    ],
    objects: [
      { name: "The nets", art: "o-net", verses: [[40004018, "casting a net into the sea"], [43021011, "drew the net to land full of great fishes"]] },
      { name: "Simon’s ship", art: "o-ship", verses: [[42005003, "one of the ships, which was Simon’s"]] },
      { name: "The piece of money", art: "o-coin", verses: [[40017027, "thou shalt find a piece of money"]] },
      { name: "The keys", art: "o-keys", verses: [[40016019, "the keys of the kingdom of heaven"]] },
      { name: "The sword", art: "o-sword", verses: [[43018010, "Simon Peter having a sword drew it"]] },
      { name: "The fire of coals", art: "o-fire", verses: [[43018018, "who had made a fire of coals"], [43021009, "they saw a fire of coals there"]] },
      { name: "The cock", art: "o-cock", verses: [[40026034, "before the cock crow"], [40026074, "immediately the cock crew"]] },
      { name: "The fisher’s coat", art: "o-coat", verses: [[43021007, "he girt his fisher’s coat unto him"]] },
      { name: "The great sheet", art: "o-sheet", verses: [[44010011, "a great sheet knit at the four corners"]] },
      { name: "The two chains", art: "o-chains", verses: [[44012006, "bound with two chains"], [44012007, "his chains fell off from his hands"]] },
      { name: "The iron gate", art: "o-gate", verses: [[44012010, "the iron gate that leadeth unto the city"]] },
    ],
  },
  paul: {
    id: "paul-act-7-58", short: "Paul", names: ["Saul", "Paul"],
    pool: ["barnabas", "silas", "timothy", "luke", "mark", "titus", "aquila", "priscilla", "aristarchus", "tychicus", "trophimus", "epaphroditus", "onesimus",
      "demas", "ananias", "gamaliel", "stephen", "peter", "jameslord", "apollos", "lydia", "agabus", "philipev"],
    facts: [["home", "Born at Tarsus, brought up in Jerusalem"], ["trade", "A tentmaker"], ["family.0", "Of the tribe of Benjamin"], ["family.1", "A Pharisee, son of a Pharisee"], ["family.2", "A Roman citizen from birth"]],
    actTitles: ["At Stephen’s stoning", "Making havock of the church", "Damascus, Arabia, the basket", "Fifteen days with Peter", "A year at Antioch",
      "The first journey", "The council at Jerusalem", "The second journey", "Three years at Ephesus", "Seized, held, heard", "Shipwreck, and Rome",
      "His own list of sufferings", "The prisons", "Plans for Spain", "Journeys in the letters"],
    // Story order: Acts as told, the Lord's words to him placed where Acts (or the letter) sets them.
    order: ["fact.home", "fact.trade", "fact.family.0", "fact.family.1", "fact.family.2", "a0", "a1", "m0", "m1", "a2", "a3", "m2", "a4", "a5", "a6", "a7", "m3", "a8", "a9", "m4", "a10", "a11", "m5", "a12", "a13", "a14"],
    period: (e) => (e.type === "fact" || e.key === "a0" || e.key === "a1" ? 1 : ["m0", "m1", "a2", "a3", "m2"].includes(e.key) ? 2 : e.type === "trad" ? 4 : 3),
    periods: [
      { n: "I", title: "Before the call", sub: "Tarsus, Jerusalem, the persecutor" },
      { n: "II", title: "The call", sub: "Damascus, Arabia, Jerusalem, Tarsus" },
      { n: "III", title: "The church in Acts", sub: "Three journeys, arrest, Rome; the letters" },
      { n: "IV", title: "After Scripture", sub: "Tradition, by who said it and when" },
    ],
    kinds: { persecutor: ["a0", "a1"], lord: ["m0", "m1", "m2", "m3", "m4", "m5"], apostles: ["a3", "a6"], journeys: ["a2", "a4", "a5", "a7", "a8", "a13", "a14"],
      prison: ["a9", "a10", "a11", "a12"] },
    accounts: [{ id: "call", title: "The call, told four times", from: "calling" }, { id: "a2", title: "Damascus and the basket" },
      { id: "a3", title: "After three years, Jerusalem" }, { id: "a6", title: "The council at Jerusalem" }],
    pairDefault: "peter",
    hero: { art: "road", caption: "“There shined round about him a light from heaven.”", ref: [44009003, 44009003] },
    chapters: [
      { period: 1, title: "Saul of Tarsus", slides: [{ fact: "home", art: "city" }, { entry: "a0", art: "garments" }, { entry: "a1", art: "letters" }] },
      { period: 2, title: "The road to Damascus", slides: [{ entry: "m0", art: "light" }, { entry: "a2", art: "basket", verse: 44009025 }, { entry: "a3", art: "city" }] },
      { period: 3, title: "Journeys, chains, letters", slides: [{ entry: "a5", art: "ship", verse: 44013004 }, { entry: "a7", art: "tents", verse: 44018003 }, { entry: "a10", art: "storm", verse: 44027020 }, { entry: "a12", art: "chains" }, { entry: "a14", art: "parchments", verse: 55004013 }] },
      { period: 4, title: "What Scripture leaves open", slides: [{ entry: "a13", art: "westroad", verse: 45015024 }, { trad: [0, 3, 4], art: "rome" }] },
    ],
    objects: [
      { name: "The clothes at Stephen’s death", art: "o-clothes", verses: [[44007058, "laid down their clothes at a young man’s feet"], [44022020, "kept the raiment of them that slew him"]] },
      { name: "Letters to Damascus", art: "o-letters", verses: [[44009002, "desired of him letters to Damascus"]] },
      { name: "The basket", art: "o-basket", verses: [[44009025, "let him down by the wall in a basket"], [47011033, "through a window in a basket was I let down by the wall"]] },
      { name: "The stocks", art: "o-stocks", verses: [[44016024, "made their feet fast in the stocks"]] },
      { name: "Tents", art: "o-tent", verses: [[44018003, "by their occupation they were tentmakers"]] },
      { name: "Handkerchiefs and aprons", art: "o-cloth", verses: [[44019012, "handkerchiefs or aprons"]] },
      { name: "Four anchors", art: "o-anchor", verses: [[44027029, "they cast four anchors out of the stern"]] },
      { name: "The viper", art: "o-viper", verses: [[44028003, "there came a viper out of the heat"]] },
      { name: "This chain", art: "o-chains", verses: [[44028020, "for the hope of Israel I am bound with this chain"]] },
      { name: "The cloke", art: "o-coat", verses: [[55004013, "The cloke that I left at Troas with Carpus"]] },
      { name: "The parchments", art: "o-parchment", verses: [[55004013, "and the books, but especially the parchments"]] },
    ],
  },
  thaddaeus: {
    id: "judas-mat-10-3", short: "Thaddaeus", names: ["Thaddaeus", "Lebbaeus", "Judas"],
    pool: TWELVE.filter((k) => k !== "thaddaeus"),
    // John 14:22 names Iscariot only to say this Judas is not he (Iscariot had gone out, John 13:30).
    notWith: { m2: ["iscariot"] },
    facts: [["family.0", "“Judas of James”"]],
    actTitles: ["In the upper room", "Never named again"],
    order: null,
    period: (e) => (e.type === "fact" ? 1 : e.type === "moment" ? 2 : e.type === "act" ? 3 : 4),
    periods: [
      { n: "I", title: "Before the call", sub: "Only a name and a relation" },
      { n: "II", title: "With Jesus", sub: "Three moments" },
      { n: "III", title: "The church in Acts", sub: "One verse: Acts 1:13" },
      { n: "IV", title: "After Scripture", sub: "Tradition, late and divided" },
    ],
    kinds: { lists: ["m0", "m1", "a0"], words: ["m2"], silence: ["a1"] },
    accounts: [{ id: "lists", title: "One man, four lists", from: "lists" }],
    pairDefault: "simonz",
    hero: { art: "scroll", caption: "“Judas saith unto him, not Iscariot, Lord, how is it that thou wilt manifest thyself unto us, and not unto the world?”", ref: [43014022, 43014022] },
    chapters: [
      { period: 1, title: "A name, and a relation", slides: [{ fact: "family.0", art: "blank" }] },
      { period: 2, title: "One of the Twelve", slides: [{ entry: "m0", art: "scroll", verse: 42006016 }, { entry: "m1", art: "sandals", verse: 40010003 }, { entry: "m2", art: "lamp" }] },
      { period: 3, title: "One verse in Acts", slides: [{ entry: "a0", art: "upper" }, { entry: "a1", art: "blank" }] },
      { period: 4, title: "What tradition adds", slides: [{ trad: [0, 1, 2], art: "eastroad" }] },
    ],
    objects: [],
  },
};

// Place icons, by the site's place id (anything not listed is a city).
const PLACE_KIND = {
  a562fcc: "lake", a91b732: "town", af2161c: "town", ab7bf48: "town", a2c5cc7: "town", ae023a9: "port", a58735e: "port", a282dce: "region", a83a43e: "region",
  a0f4ea8: "region", afa863b: "port", a314765: "port", aff04b8: "town", a91c509: "port", a55027d: "port", a57835d: "island", ac405c0: "region", a26aa94: "island",
  a3f0f69: "region", ab9696f: "region", ae425aa: "town", af0719d: "town", aa401a9: "town", a62fe31: "town",
};

module.exports = { PEOPLE, TWELVE, KINDS, PERSONS, PLACE_KIND };
