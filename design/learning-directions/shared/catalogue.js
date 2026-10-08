// The Learning materials division as one catalogue: who it is for, what kind, what about, the series, and every item.
// The plan behind it: Research/Resources/LEARNING.md section 6 ("Division plan"). Only "Moses: three forties" is real;
// every other item is PLANNED: a title and the site pages it would be written from, nothing more. Never give a planned
// item a download, a page count or sample pages.
(() => {
  // Ages (one per item) and settings (filters across ages). Shown together as seven doors.
  const AUDIENCES = [
    { id: "little", name: "Little ones", age: "3–5", how: "Read aloud by a grown-up", art: "hand", tone: "--poetry",
      line: "One passage, told simply, with large drawings and a single verse." },
    { id: "children", name: "Children", age: "6–11", how: "With a leader or a parent", art: "backpack", tone: "--history",
      line: "Lessons, activity pages and maps that keep every answer in a verse." },
    { id: "teens", name: "Teens", age: "12–17", how: "Alone or in a youth group", art: "compass", tone: "--prophets",
      line: "Short series that take real questions seriously and read the text closely." },
    { id: "young", name: "Young adults", age: "18–25", how: "Alone, with friends, on campus", art: "lamp", tone: "--gospels",
      line: "Reading plans and workbooks for building a life on the word." },
    { id: "adults", name: "Adults", age: "18 and up", how: "Alone or in a group", art: "book", tone: "--epistles",
      line: "Workbooks with space to write, built from the site's reviewed pages." },
    { id: "families", name: "Families", age: "Together", how: "At home, across ages", art: "house", tone: "--acts", setting: true,
      line: "Evenings at the table: a passage, a few questions, verses to learn together." },
    { id: "leaders", name: "Leaders", age: "Who teach", how: "Sunday school, youth, small groups", art: "staff", tone: "--revelation", setting: true,
      line: "Every leader guide, and every item that comes with one." },
  ];

  const KINDS = [
    { id: "story", name: "Read-aloud story", plural: "Read-aloud stories", glyph: "story" },
    { id: "activity", name: "Activity pages", plural: "Activity pages", glyph: "activity" },
    { id: "cards", name: "Memory-verse cards", plural: "Memory-verse cards", glyph: "cards" },
    { id: "lesson", name: "Lessons", plural: "Lessons", glyph: "lesson" },
    { id: "workbook", name: "Workbook", plural: "Workbooks", glyph: "workbook" },
    { id: "plan", name: "Reading plan", plural: "Reading plans", glyph: "plan" },
    { id: "devotional", name: "Family devotional", plural: "Family devotionals", glyph: "devotional" },
    { id: "maps", name: "Charts and maps", plural: "Charts and maps", glyph: "maps" },
    { id: "guide", name: "Leader guide", plural: "Leader guides", glyph: "guide" },
  ];

  const TRACKS = [
    { id: "people", name: "People of the Bible", short: "People", from: "The person pages and their sourced stories", path: "/study/people" },
    { id: "books", name: "Books of the Bible", short: "Books", from: "Bible structure and the reader", path: "/study/structure" },
    { id: "story", name: "The big story", short: "Big story", from: "The Topics eras, from the beginning to the return", path: "/topics" },
    { id: "jesus", name: "Jesus", short: "Jesus", from: "The Gospel harmony, the miracles, the life of Jesus", path: "/study/harmony" },
    { id: "places", name: "Places", short: "Places", from: "The Atlas and its journeys", path: "/study/atlas" },
    { id: "letters", name: "Letters", short: "Letters", from: "The Letters study", path: "/study/letters" },
    { id: "defend", name: "Defending the faith", short: "Defending", from: "Apologetics studies and paths (teens and up)", path: "/apologetics" },
    { id: "teachers", name: "Teachers of the church", short: "Teachers", from: "The Teachers page and the library", path: "/teachers" },
    { id: "life", name: "Life and faith", short: "Life & faith", from: "Topics: prayer, trials, family and more", path: "/topics" },
  ];

  const SERIES = [
    { id: "moses", name: "Moses at every age", type: "One subject, every age",
      line: "The same reviewed story of Moses, told at each age: a story to hear, pages to colour, lessons, the workbook, evenings at home." },
    { id: "year", name: "A year through the Bible", type: "An ordered path",
      line: "Fifty-two children's lessons in four quarters, in the order of the Topics eras, then Jesus and his church." },
    { id: "lives", name: "Lives", type: "A shelf of workbooks",
      line: "Workbooks on single lives, each shaped the way Scripture shapes that life." },
    { id: "jesus", name: "Following Jesus", type: "An ordered path",
      line: "From his birth at the family table to all 185 events of the harmony, one step per age." },
    { id: "questions", name: "Questions, step by step", type: "Apologetics paths as group courses",
      line: "The site's apologetics paths, turned into sessions a group can lead." },
  ];

  const P = (path, title) => ({ path, title });
  const MOSES = [P("/people/moses-exo-2-10", "Moses: his story"), P("/people/moses-exo-2-10/rule", "Moses: leader of Israel"), P("/people/moses-exo-2-10/word", "Moses: the prophet")];

  // status: "ready" (checked, built, downloadable) or "planned" (a title and its sources only).
  const ITEMS = [
    { id: "moses-three-forties", status: "ready", title: "Moses: three forties", sub: "An eight-session study of his life, from the river to mount Nebo",
      audience: "adults", kind: "workbook", track: "people", series: [["moses", 4], ["lives", 2]], sessions: 8, minutes: 60, guide: false, pages: 42,
      builtFrom: MOSES, review: "Checked 2026-10-08: 56 questions, 27 key verses and every quotation matched word for word to the King James text." },

    // Little ones
    { id: "moses-basket", title: "Drawn out of the water", sub: "The baby in the basket, read aloud", audience: "little", kind: "story", track: "people", series: [["moses", 1]],
      builtFrom: [P("/people/moses-exo-2-10", "Moses: his story (Exodus 2:1–10)")] },
    { id: "noah-ark", title: "Noah builds the ark", sub: "A read-aloud story with one verse", audience: "little", kind: "story", track: "story",
      builtFrom: [P("/people/noah-gen-5-29", "Noah: his story"), P("/topics/c/era-beginning", "Topics: In the beginning")] },
    { id: "every-living-thing", title: "Every living thing", sub: "Animals, birds and trees to colour, each with its verse", audience: "little", kind: "activity", track: "life",
      builtFrom: [P("/topics/c/creation", "Topics: Creation and nature")] },
    { id: "first-verses", title: "First verses", sub: "Short verses to say together", audience: "little", kind: "cards", track: "life",
      builtFrom: [P("/topics/c/devotion", "Topics: Prayer and devotion")] },

    // Children
    { id: "year-q1", title: "In the beginning", sub: "Quarter 1: Adam to Joseph", audience: "children", kind: "lesson", track: "story", series: [["year", 1]], sessions: 13, minutes: 30, guide: true,
      builtFrom: [P("/topics/c/era-beginning", "Topics: In the beginning"), P("/topics/c/era-patriarchs", "Topics: The patriarchs")] },
    { id: "year-q2", title: "Out of Egypt", sub: "Quarter 2: Moses to the judges", audience: "children", kind: "lesson", track: "story", series: [["year", 2]], sessions: 13, minutes: 30, guide: true,
      builtFrom: [P("/topics/c/era-exodus", "Topics: Exodus and wilderness"), P("/topics/c/era-judges", "Topics: Joshua and the judges")] },
    { id: "year-q3", title: "Kings and prophets", sub: "Quarter 3: Samuel to the return", audience: "children", kind: "lesson", track: "story", series: [["year", 3]], sessions: 13, minutes: 30, guide: true,
      builtFrom: [P("/topics/c/era-kingdom", "Topics: The united kingdom"), P("/topics/c/era-kings", "Topics: Kings of Israel and Judah"), P("/topics/c/era-exile", "Topics: Exile and return")] },
    { id: "year-q4", title: "Jesus and his church", sub: "Quarter 4: the Gospels and Acts", audience: "children", kind: "lesson", track: "story", series: [["year", 4]], sessions: 13, minutes: 30, guide: true,
      builtFrom: [P("/people/jesus-isa-7-14", "Jesus: his life"), P("/study/apostles", "The apostles")] },
    { id: "moses-activity", title: "Moses: three forties activity pack", sub: "Colour the three forties, trace the road, match the signs", audience: "children", kind: "activity", track: "people", series: [["moses", 2]],
      builtFrom: [...MOSES.slice(0, 1), P("/study/miracles", "Miracles: Moses and Aaron")] },
    { id: "miracles-cards", title: "The miracles of Jesus", sub: "Thirty-five miracles, one page each", audience: "children", kind: "activity", track: "jesus", series: [["jesus", 2]],
      builtFrom: [P("/study/miracles", "The miracles of Jesus (35)")] },
    { id: "elijah-elisha", title: "Elijah and Elisha", sub: "Lessons on two prophets of the north", audience: "children", kind: "lesson", track: "people", guide: true,
      builtFrom: [P("/people/elijah-1ki-17-1", "Elijah: his story"), P("/people/elisha-1ki-19-16", "Elisha: his story")] },
    { id: "who-judged", title: "Who judged Israel?", sub: "A wall chart from Othniel to Samuel", audience: "children", kind: "maps", track: "people",
      builtFrom: [P("/study/rulers", "Rulers: the judges")] },
    { id: "sixty-six", title: "The sixty-six books in order", sub: "Cards to learn the books by their sections", audience: "children", kind: "cards", track: "books",
      builtFrom: [P("/study/structure", "Bible structure")] },
    { id: "where-jesus-walked", title: "Where Jesus walked", sub: "Maps of Galilee and Judea to colour", audience: "children", kind: "maps", track: "places",
      builtFrom: [P("/study/atlas", "Atlas"), P("/topics/c/samaria-galilee", "Topics: Samaria and Galilee")] },

    // Teens
    { id: "moses-who-am-i", title: "Moses: “Who am I?”", sub: "Four lessons on the first two forties", audience: "teens", kind: "lesson", track: "people", series: [["moses", 3]], sessions: 4, minutes: 45, guide: true,
      builtFrom: [MOSES[0], MOSES[2]] },
    { id: "honest-questions", title: "Honest questions", sub: "Suffering, silence, harm done, the resurrection", audience: "teens", kind: "lesson", track: "defend", series: [["questions", 1]], sessions: 5, minutes: 45, guide: true,
      builtFrom: [P("/apologetics/paths/honest-questions", "Path: Walk through honest doubt")] },
    { id: "bible-changed", title: "Has the Bible been changed?", sub: "One session on the manuscripts", audience: "teens", kind: "lesson", track: "defend", sessions: 1, minutes: 45, guide: true,
      builtFrom: [P("/apologetics/study/manuscripts", "Study: Has the Bible been changed beyond recognition?")] },
    { id: "parables", title: "The parables of Jesus", sub: "What he told, and to whom", audience: "teens", kind: "workbook", track: "jesus", series: [["jesus", 3]],
      builtFrom: [P("/topics/c/christ-teaching", "Topics: Parables and teaching")] },
    { id: "david", title: "David", sub: "Shepherd, king and psalmist", audience: "teens", kind: "workbook", track: "people", series: [["lives", 3]],
      builtFrom: [P("/people/david-rut-4-17", "David: his story"), P("/people/david-rut-4-17/rule", "David: his reign")] },
    { id: "pauls-journeys", title: "Paul's journeys", sub: "His roads as printable maps, with the letters he wrote", audience: "teens", kind: "maps", track: "places",
      builtFrom: [P("/study/atlas/journeys?focus=paul", "Atlas: Paul's journeys")] },

    // Young adults
    { id: "harmony-plan", title: "Jesus in 185 events", sub: "The four Gospels side by side, in order", audience: "young", kind: "plan", track: "jesus", series: [["jesus", 4]],
      builtFrom: [P("/study/harmony", "Gospel harmony (185 events)")] },
    { id: "twenty-one-letters", title: "Twenty-one letters", sub: "Who wrote them, to whom, and why", audience: "young", kind: "workbook", track: "letters",
      builtFrom: [P("/study/letters", "The letters of the New Testament")] },
    { id: "read-evidence", title: "Learn to examine the evidence", sub: "Scripture, manuscripts, canon, miracles, resurrection", audience: "young", kind: "lesson", track: "defend", series: [["questions", 2]], sessions: 6, minutes: 50, guide: true,
      builtFrom: [P("/apologetics/paths/read-evidence", "Path: Learn to examine the evidence")] },
    { id: "apostles", title: "The apostles", sub: "Fourteen lives, from the nets to the ends of the earth", audience: "young", kind: "workbook", track: "people", series: [["lives", 4]],
      builtFrom: [P("/study/apostles", "The apostles"), P("/people/peter-mat-4-18", "Peter: his story")] },
    { id: "voices-plan", title: "Five centuries of voices", sub: "A year of reading with the teachers in the library", audience: "young", kind: "plan", track: "teachers",
      builtFrom: [P("/teachers", "Teachers")] },

    // Adults
    { id: "patriarchs", title: "Abraham, Isaac and Jacob", sub: "Three lives and one promise", audience: "adults", kind: "workbook", track: "people", series: [["lives", 1]],
      builtFrom: [P("/people/abraham-gen-11-26", "Abraham: his story"), P("/people/isaac-gen-17-19", "Isaac: his story"), P("/people/israel-gen-25-26", "Jacob (Israel): his story")] },
    { id: "muslim-neighbour", title: "Talk with a Muslim neighbour", sub: "Six sessions for a group", audience: "adults", kind: "lesson", track: "defend", series: [["questions", 3]], sessions: 6, minutes: 60, guide: true,
      builtFrom: [P("/apologetics/paths/muslim-neighbour", "Path: Talk with a Muslim neighbour")] },
    { id: "bible-in-a-year", title: "The whole Bible in a year", sub: "Every chapter, with a box to tick", audience: "adults", kind: "plan", track: "books",
      builtFrom: [P("/library", "Books and reading progress"), P("/study/structure", "Bible structure")] },
    { id: "kings-chart", title: "Kings of Israel and Judah", sub: "Every reign on one printable chart", audience: "adults", kind: "maps", track: "people",
      builtFrom: [P("/study/rulers", "Rulers")] },
    { id: "atlas-pack", title: "Maps of the Bible lands", sub: "The Atlas's maps, ready to print", audience: "adults", kind: "maps", track: "places",
      builtFrom: [P("/study/atlas", "Atlas")] },
    { id: "trials-comfort", title: "Trials and comfort", sub: "What Scripture says to the afflicted", audience: "adults", kind: "workbook", track: "life",
      builtFrom: [P("/topics/c/trials", "Topics: Trials and comfort")] },
    { id: "reformed-foundations", title: "Explore the Reformed faith", sub: "With the historic writers beside the text", audience: "adults", kind: "lesson", track: "teachers", sessions: 6, minutes: 60, guide: true,
      builtFrom: [P("/apologetics/paths/reformed-foundations", "Path: Explore the Reformed faith"), P("/teachers", "Teachers")] },

    // Families
    { id: "moses-evenings", title: "Moses: eight evenings", sub: "One evening for each session of the workbook", audience: "families", kind: "devotional", track: "people", series: [["moses", 5]],
      builtFrom: [...MOSES.slice(0, 1), P("/resources/learning", "Moses: three forties (workbook)")] },
    { id: "birth-of-jesus", title: "The birth of Jesus", sub: "Evenings from the Gospels for the weeks before Christmas", audience: "families", kind: "devotional", track: "jesus", series: [["jesus", 1]],
      builtFrom: [P("/people/jesus-isa-7-14", "Jesus: his life"), P("/study/harmony", "Gospel harmony")] },
    { id: "praying-together", title: "Praying together", sub: "What Scripture teaches about prayer, for the table", audience: "families", kind: "devotional", track: "life",
      builtFrom: [P("/topics/c/devotion", "Topics: Prayer and devotion")] },
    { id: "table-verses", title: "Verses for the table", sub: "Cards to learn together, one a week", audience: "families", kind: "cards", track: "life",
      builtFrom: [P("/topics/c/family", "Topics: Marriage and family")] },

    // Leaders
    { id: "moses-leader", title: "Moses: leader guide", sub: "For the teen lessons and the workbook in a group", audience: "leaders", kind: "guide", track: "people", series: [["moses", 6]],
      builtFrom: [...MOSES.slice(0, 1), P("/resources/learning", "Moses: three forties (workbook)")] },
    { id: "year-leader", title: "A year through the Bible: leader guide", sub: "Aims, timings and answers for all 52 lessons", audience: "leaders", kind: "guide", track: "story", series: [["year", 5]],
      builtFrom: [P("/topics", "Topics: the eras")] },
    { id: "asking-questions", title: "Asking good questions", sub: "Observe, interpret, reflect: how every question here is made", audience: "leaders", kind: "guide", track: "books",
      builtFrom: [P("/resources/learning", "Moses: three forties, “How to use this workbook”")] },
    { id: "questions-leader", title: "Leading hard conversations", sub: "For the apologetics courses", audience: "leaders", kind: "guide", track: "defend", series: [["questions", 4]],
      builtFrom: [P("/apologetics/study/conversation", "Study: How do we defend the faith without becoming combative?")] },
  ];
  for (const item of ITEMS) { item.status ??= "planned"; item.series ??= []; }

  const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  const A = byId(AUDIENCES), K = byId(KINDS), T = byId(TRACKS), S = byId(SERIES), I = byId(ITEMS);
  const inSeries = (sid) => ITEMS.filter((it) => it.series.some(([s]) => s === sid)).sort((a, b) => a.series.find(([s]) => s === sid)[1] - b.series.find(([s]) => s === sid)[1]);
  // Leaders also see every item that comes with a leader guide; Families every devotional and every story or card set.
  const forAudience = (aid) => ITEMS.filter((it) => it.audience === aid || (aid === "leaders" && it.guide));

  window.LEARN = { AUDIENCES, KINDS, TRACKS, SERIES, ITEMS, A, K, T, S, I, inSeries, forAudience,
    ready: ITEMS.filter((it) => it.status === "ready"), planned: ITEMS.filter((it) => it.status === "planned") };
})();
