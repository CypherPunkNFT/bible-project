// The merged apostle page's presentation of each reviewed apostle record (src/data/people-pages/apostles-1/2.json):
// short titles for the hero facts and the Acts records, the cinema chapters and the drawing each scene uses, the
// landing's drawing and its one KJV line, and which reviewed questions from the church and Letters data belong on
// his page. Nothing here adds a fact: titles shorten records already in the data, every quoted line is checked against
// the KJV word for word by extract.cjs, and every question comes from reviewed data.
//
// Chapter slides: { e: entry key, art: scene name, v: verse to quote (must lie in the entry) }. Entry keys: "fact.home",
// "fact.trade", "fact.family.N", "mN" (moments), "aN" (Acts and letters). Period IV is drawn from the tradition data.
const G = (file, person, id) => ({ src: "church", file, person, id });
const L = (file, id) => ({ src: "letters", file, id });

const UPPER = "In the upper room", SILENT = "Never named again";
const PERSONS = {
  peter: {
    names: ["Simon", "Peter", "Cephas", "Simeon", "Bar-jona"],
    facts: { home: "From Bethsaida; a house at Capernaum", trade: "A fisherman with Andrew", "family.0": "Andrew’s brother", "family.1": "The son of Jona", "family.2": "A married man", "family.3": "Children, says Clement" },
    acts: ["Choosing a twelfth apostle", "Pentecost", "The lame man at the temple gate", "Arrested with John", "Ananias and Sapphira; the council", "Sent to Samaria",
      "Lydda and Joppa", "Cornelius at Caesarea", "Prison, and the angel", "The council at Jerusalem", "Paul stays fifteen days; the pillars", "Withstood at Antioch",
      "A wife on his travels; “I of Cephas”", "“By Silvanus … at Babylon”"],
    landing: { art: "peter", line: [40016019, "I will give unto thee the keys of the kingdom of heaven"], also: [40004018, "casting a net into the sea: for they were fishers"] },
    chapters: [
      { title: "A fisherman of Bethsaida", slides: [{ e: "fact.trade", art: "nets" }, { e: "fact.home", art: "house" }] },
      { title: "Three years beside Jesus", slides: [{ e: "m1", art: "catch", v: 42005006 }, { e: "m8", art: "rock" }, { e: "m22", art: "firecock" }, { e: "m26", art: "shore", v: 43021009 }] },
      { title: "Jerusalem to Caesarea", slides: [{ e: "a1", art: "tongues" }, { e: "a2", art: "gate" }, { e: "a7", art: "sheet", v: 44010011 }, { e: "a8", art: "chains", v: 44012007 }] },
    ],
    accounts: ["call", "m8", "m10", "m22"],
    ids: ["Simon, Cephas, Peter: why three names?", "Jona, Jonas or John: who was his father?", "Is the “Simeon” of Acts 15:14 Peter?"],
    extra: [G("church-jerusalem", "mark-act-12-12", "mark-gospel-peter"), L("general-letters", "second-peter-authorship"), L("general-letters", "babylon"),
      L("general-letters", "silvanus"), L("general-letters", "jude-or-peter-first"), L("general-letters", "dates")],
  },
  andrew: {
    names: ["Andrew"],
    facts: { home: "From Bethsaida; a house at Capernaum", trade: "A fisherman with Simon", "family.0": "Simon Peter’s brother" },
    acts: [UPPER],
    landing: { art: "andrew", line: [43006009, "There is a lad here, which hath five barley loaves, and two small fishes"], also: [43001041, "He first findeth his own brother Simon"] },
    chapters: [
      { title: "A fisherman of Bethsaida", slides: [{ e: "fact.trade", art: "nets" }, { e: "fact.family.0", art: "dwell" }] },
      { title: "The first to follow", slides: [{ e: "m0", art: "dwell", v: 43001039 }, { e: "m1", art: "lake" }, { e: "m5", art: "loaves", v: 43006009 }, { e: "m6", art: "greeks", v: 43012022 }] },
      { title: "One verse in Acts", slides: [{ e: "a0", art: "upper" }] },
    ],
    ids: ["Who was the other disciple with Andrew?"],
  },
  jamesz: {
    names: ["James"],
    facts: { home: "Fishing near Capernaum", trade: "In his father’s boat", "family.0": "Son of Zebedee", "family.1": "His mother’s request", "family.2": "Salome? An inference", "family.3": "Cousins of Jesus? A view", "family.4": "John’s brother" },
    acts: [UPPER, "Killed with the sword"],
    landing: { art: "jamesz", line: [41003017, "Boanerges, which is, The sons of thunder"], also: [44012002, "he killed James the brother of John with the sword"] },
    chapters: [
      { title: "Zebedee’s boat", slides: [{ e: "fact.trade", art: "mending" }, { e: "fact.family.1", art: "cup" }] },
      { title: "One of the three", slides: [{ e: "m2", art: "thunder", v: 41003017 }, { e: "m5", art: "mountain" }, { e: "m7", art: "cup", v: 40020022 }, { e: "m9", art: "garden" }] },
      { title: "The first of the Twelve to die", slides: [{ e: "a1", art: "sword", v: 44012002 }] },
    ],
    ids: ["Which James is this?", "Why “James the Greater”?", "What does “Boanerges” mean?"],
  },
  johnz: {
    names: ["John"],
    facts: { home: "Fishing near Capernaum", trade: "In his father’s boat", "family.0": "Son of Zebedee", "family.1": "His mother’s request", "family.2": "Salome? An inference", "family.3": "Cousins of Jesus? A view", "family.4": "James’s brother" },
    acts: [UPPER, "The lame man at the temple gate", "Before the council", "Sent to Samaria", "“Pillars” at Jerusalem", "Patmos"],
    landing: { art: "johnz", line: [43020004, "the other disciple did outrun Peter, and came first to the sepulchre"], also: [43019027, "Behold thy mother"] },
    chapters: [
      { title: "Zebedee’s boat", slides: [{ e: "fact.trade", art: "mending" }] },
      { title: "The disciple at the supper", slides: [{ e: "m5", art: "mountain" }, { e: "m11", art: "lamp", v: 43013023 }, { e: "m13", art: "cross", v: 43019027 }, { e: "m14", art: "tomb", v: 43020004 }, { e: "m15", art: "shore", v: 43021007 }] },
      { title: "With Peter in Jerusalem", slides: [{ e: "a1", art: "gate" }, { e: "a3", art: "villages", v: 44008025 }, { e: "a5", art: "island", v: 66001009 }] },
    ],
    ids: ["Is John the “disciple whom Jesus loved”?", "Do the early writers name the beloved disciple?", "Was John the unnamed disciple with Andrew?", "The John of Galatians and of Revelation"],
    extra: [L("john-letters", "authorship"), L("john-letters", "date")],
  },
  philip: {
    names: ["Philip"],
    facts: { home: "Of Bethsaida", "family.0": "No family named", "family.1": "Married, says Clement" },
    acts: [UPPER],
    landing: { art: "philip", line: [43012021, "Sir, we would see Jesus"], also: [43001046, "Come and see"] },
    chapters: [
      { title: "Of Bethsaida", slides: [{ e: "fact.home", art: "town" }] },
      { title: "“Come and see”", slides: [{ e: "m0", art: "comesee", v: 43001046 }, { e: "m3", art: "loaves", v: 43006007 }, { e: "m4", art: "greeks", v: 43012021 }, { e: "m5", art: "lamp", v: 43014008 }] },
      { title: "One verse in Acts", slides: [{ e: "a0", art: "upper" }] },
    ],
    ids: ["Which Philip is this?", "Did the apostle preach in Samaria?"],
  },
  bartholomew: {
    names: ["Bartholomew", "Nathanael"],
    facts: { home: "No home given; Nathanael of Cana", "family.0": "“Son of Talmai”" },
    acts: [UPPER],
    landing: { art: "bartholomew", line: [43001048, "when thou wast under the fig tree, I saw thee"], note: "Nathanael’s fig tree: on this page only if Bartholomew is Nathanael, an identification first written down about 850." },
    chapters: [
      { title: "A name, and a town", slides: [{ e: "fact.family.0", art: "scroll" }, { e: "fact.home", art: "town" }] },
      { title: "Bartholomew, and perhaps Nathanael", slides: [{ e: "m0", art: "figtree", v: 43001048 }, { e: "m1", art: "scroll" }, { e: "m3", art: "shore", v: 43021002 }] },
      { title: "One verse in Acts", slides: [{ e: "a0", art: "upper" }] },
    ],
    ids: ["Where does each name appear?", "Why does Bartholomew stand beside Philip?", "Who first made the two one man?"],
  },
  thomas: {
    names: ["Thomas", "Didymus"],
    facts: { "family.0": "Called Didymus, “twin”" },
    acts: [UPPER],
    landing: { art: "thomas", line: [43020027, "Reach hither thy finger, and behold my hands"], also: [43020028, "My Lord and my God"] },
    chapters: [
      { title: "Called Didymus", slides: [{ e: "fact.family.0", art: "scroll" }] },
      { title: "“Except I shall see”", slides: [{ e: "m2", art: "bethany", v: 43011016 }, { e: "m3", art: "lamp", v: 43014005 }, { e: "m5", art: "door", v: 43020026 }, { e: "m6", art: "shore", v: 43021002 }] },
      { title: "One verse in Acts", slides: [{ e: "a0", art: "upper" }] },
    ],
    ids: ["“Judas Thomas”: another name?"],
  },
  matthew: {
    names: ["Matthew", "Levi"],
    facts: { home: "A tax office near Capernaum", trade: "A publican", "family.0": "Son of Alphaeus", "family.1": "“The son” is supplied" },
    acts: [UPPER, SILENT],
    landing: { art: "matthew", line: [40009009, "sitting at the receipt of custom"], also: [40009009, "Follow me"] },
    chapters: [
      { title: "At the receipt of custom", slides: [{ e: "fact.trade", art: "receipt" }, { e: "fact.home", art: "lake" }] },
      { title: "“Follow me”", slides: [{ e: "m0", art: "road", v: 40009009 }, { e: "m1", art: "feast", v: 40009010 }, { e: "m3", art: "sandals" }] },
      { title: "One verse in Acts", slides: [{ e: "a0", art: "upper" }, { e: "a1", art: "silence" }] },
    ],
    ids: ["Is Matthew the Levi of Mark and Luke?", "Matthew in one Gospel, Levi in two", "Brother of James son of Alphaeus?"],
  },
  jamesa: {
    names: ["James"],
    facts: { "family.0": "Son of Alphaeus", "family.1": "“The son” is supplied" },
    acts: [UPPER, SILENT, "Another James leads at Jerusalem"],
    landing: { art: "jamesa", line: [40010003, "James the son of Alphaeus"] },
    chapters: [
      { title: "A name, and a father", slides: [{ e: "fact.family.0", art: "scroll" }] },
      { title: "Ninth in every list", slides: [{ e: "m0", art: "scroll" }, { e: "m1", art: "sandals" }] },
      { title: "One verse in Acts", slides: [{ e: "a0", art: "upper" }, { e: "a2", art: "temple" }] },
    ],
    ids: ["Which James is this page about?", "Is he “James the less”?"],
    extra: [G("church-jerusalem", "james-mat-13-55", "james-apostle"), G("church-jerusalem", "james-mat-13-55", "brothers-of-the-lord"), L("general-letters", "which-james")],
  },
  thaddaeus: {
    names: ["Thaddaeus", "Lebbaeus", "Judas"],
    notWith: { m2: ["iscariot"] }, // John 14:22 names Iscariot only to say this Judas is not he.
    facts: { "family.0": "“Judas of James”" },
    acts: [UPPER, SILENT],
    landing: { art: "thaddaeus", line: [43014022, "Lord, how is it that thou wilt manifest thyself unto us, and not unto the world?"] },
    chapters: [
      { title: "A name, and a relation", slides: [{ e: "fact.family.0", art: "scroll" }] },
      { title: "One question", slides: [{ e: "m0", art: "scroll" }, { e: "m1", art: "sandals" }, { e: "m2", art: "lamp", v: 43014022 }] },
      { title: "One verse in Acts", slides: [{ e: "a0", art: "upper" }, { e: "a1", art: "silence" }] },
    ],
    ids: ["Why two names in the lists?", "Is “Judas not Iscariot” this man?", "Lebbaeus, Thaddaeus, or both?"],
    extra: [L("general-letters", "jude-identity")],
  },
  simonz: {
    names: ["Simon"],
    facts: {},
    acts: [UPPER, SILENT],
    landing: { art: "simonz", line: [42006015, "Simon called Zelotes"], also: [40010004, "Simon the Canaanite"] },
    chapters: [
      { title: "Two names for one word", slides: [] },
      { title: "In the lists", slides: [{ e: "m0", art: "scroll" }, { e: "m1", art: "sandals" }] },
      { title: "One verse in Acts", slides: [{ e: "a0", art: "upper" }, { e: "a1", art: "silence" }] },
    ],
    ids: ["What does “Canaanite” mean here?", "Was he one of the Zealot party?", "Kananitēs or Kananaios?"],
  },
  iscariot: {
    names: ["Judas", "Iscariot"],
    facts: { home: "“Iscariot”: of Kerioth?", trade: "He had the bag", "family.0": "Son of Simon", "family.1": "Whose name is Iscariot?" },
    acts: ["“Guide to them that took Jesus”", "“His own place”"],
    landing: { art: "iscariot", line: [43012006, "was a thief, and had the bag"], also: [40026015, "they covenanted with him for thirty pieces of silver"] },
    chapters: [
      { title: "The son of Simon", slides: [{ e: "fact.trade", art: "bag", v: 43012006 }, { e: "fact.home", art: "hills" }] },
      { title: "One of the Twelve", slides: [{ e: "m3", art: "ointment", v: 43012005 }, { e: "m4", art: "coins", v: 40026015 }, { e: "m8", art: "garden" }, { e: "m9", art: "field", v: 40027007 }] },
      { title: "His place filled", slides: [{ e: "a0", art: "upper" }, { e: "a1", art: "lots" }] },
    ],
    ids: ["Why is he always named with the betrayal?"],
  },
  matthias: {
    names: ["Matthias"],
    facts: {},
    acts: ["Numbered with the eleven", SILENT],
    landing: { art: "matthias", line: [44001026, "the lot fell upon Matthias"] },
    chapters: [
      { title: "Before Acts 1", slides: [] },
      { title: "The condition he met", slides: [{ e: "m0", art: "river", v: 44001022 }] },
      { title: "Chosen by lot", slides: [{ e: "a0", art: "lots", v: 44001026 }, { e: "a1", art: "silence" }] },
    ],
    periods: { 2: { title: "With Jesus", sub: "Only the condition Peter set (Acts 1:21–22)" } },
    ids: ["Was Matthias Nathanael?"],
  },
  paul: {
    names: ["Saul", "Paul"],
    facts: { home: "Born at Tarsus, brought up in Jerusalem", trade: "A tentmaker", "family.0": "Of the tribe of Benjamin", "family.1": "A Pharisee, son of a Pharisee", "family.2": "A Roman citizen from birth", "family.3": "His sister’s son", "family.4": "“My kinsmen”" },
    acts: ["At Stephen’s stoning", "Making havock of the church", "Damascus, Arabia, the basket", "Fifteen days with Peter", "A year at Antioch",
      "The first journey", "The council at Jerusalem", "The second journey", "Three years at Ephesus", "Seized, held, heard", "Shipwreck, and Rome",
      "His own list of sufferings", "The prisons", "Plans for Spain", "Journeys in the letters"],
    order: ["fact.home", "fact.trade", "fact.family.0", "fact.family.1", "fact.family.2", "fact.family.3", "fact.family.4", "a0", "a1", "m0", "m1", "a2", "a3", "m2", "a4", "a5", "a6", "a7", "m3", "a8", "a9", "m4", "a10", "a11", "m5", "a12", "a13", "a14"],
    period: (e) => (e.type === "fact" || e.key === "a0" || e.key === "a1" ? 1 : ["m0", "m1", "a2", "a3", "m2"].includes(e.key) ? 2 : e.type === "trad" ? 4 : 3),
    periods: { 1: { title: "Before the call", sub: "Tarsus, Jerusalem, the persecutor" }, 2: { title: "The call", sub: "Damascus, Arabia, Jerusalem, Tarsus" }, 3: { title: "The church in Acts", sub: "Three journeys, arrest, Rome; the letters" } },
    pool: "paul",
    landing: { art: "paul", line: [44009003, "there shined round about him a light from heaven"] },
    chapters: [
      { title: "Saul of Tarsus", slides: [{ e: "fact.home", art: "city" }, { e: "a0", art: "garments", v: 44007058 }, { e: "a1", art: "letters", v: 44009002 }] },
      { title: "The road to Damascus", slides: [{ e: "m0", art: "light" }, { e: "a2", art: "basket", v: 44009025 }] },
      { title: "Journeys, chains, letters", slides: [{ e: "a5", art: "ship", v: 44013004 }, { e: "a7", art: "tents", v: 44018003 }, { e: "a10", art: "storm", v: 44027020 }, { e: "a12", art: "chains" }, { e: "a14", art: "parchments", v: 55004013 }] },
    ],
    accounts: ["call", "a2", "a3", "a6"],
    ids: ["Saul and Paul: one man?", "When does Saul become Paul?", "An apostle, but not of the Twelve?"],
    extra: [L("paul-letters", "authorship-disputed"), L("paul-letters", "release"), L("paul-letters", "imprisonment"), L("paul-letters", "second-thessalonians"),
      L("paul-letters", "corinthian-letters"), L("paul-letters", "romans-16"), L("paul-letters", "ephesians-destination"), L("paul-letters", "galatia-north-south"),
      L("hebrews", "authorship"), L("overview", "earliest"), G("church-pauls-circle", "titus-2co-2-13", "titus-visit"), G("church-pauls-circle", "titus-2co-2-13", "titus-circumcised"),
      G("church-pauls-circle", "priscilla-act-18-2", "pa-vow"), G("church-jerusalem", "mark-act-12-12", "mark-perga")],
  },
};

// Which group each reviewed question belongs to on "What readers still ask" (anything not listed is placed by its
// wording in extract.cjs).
const QGROUP = {
  "peter-rome": "ended", "peter-antioch": "happened", "andrew-field": "ended", "james-spain": "ended", "john-death": "ended", "john-revelation": "writings",
  "philip-hierapolis": "ended", "bartholomew-nathanael": "who", "thomas-field": "ended", "matthew-levi": "who", "matthew-james-brothers": "who", "matthew-gospel": "writings",
  "james-lords-brother": "who", "alphaeus-clopas": "who", "thaddaeus-judas": "who", "judas-brother-or-son": "who", "judas-jude": "writings", "simon-identity": "who",
  "judas-death": "ended", "judas-field": "happened", "paul-voice": "happened", "paul-release": "ended", "paul-dates": "happened",
  "mark-gospel-peter": "writings", "james-apostle": "who", "brothers-of-the-lord": "who", "titus-visit": "happened", "titus-circumcised": "happened", "pa-vow": "happened", "mark-perga": "happened", release: "ended",
};

module.exports = { PERSONS, QGROUP };
