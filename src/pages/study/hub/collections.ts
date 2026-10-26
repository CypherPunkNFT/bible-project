import type { StudyResourceId } from "../StudyResourceCards";
export type BranchId = "theology" | "academic";
export interface Reading {
    kind: string;
    title: string;
    text: string;
    href: string;
    meta?: string;
    art?: string;
    preview?: boolean;
    outline?: boolean;
    /** A finished collection or directory rather than a study, promoted to the card grid as one. */
    collection?: boolean;
    /** A fixed card colour (a section token: history, poetry, prophets…), so reordering cards does not repaint them. */
    tone?: string;
}
export interface Area {
    id: string;
    title: string;
    titleLines?: [string, string];
    short: string;
    art: string;
    tone: string;
    hint: string;
    heading: string;
    intro: string;
    featured: Reading;
    group: string;
    items: Reading[];
    support: string[][];
    cards?: StudyResourceId[];
    writers?: boolean;
    planned?: string[];
}
export interface Branch {
    label: string;
    kicker: string;
    heading: string;
    lead: string;
    tone: string;
    other: BranchId;
    otherLine: string;
    areas: Area[];
}
// Public subject catalogue. Local research drafts remain outside these navigation records.
export const STUDY_BRANCHES: Record<BranchId, Branch> = {
    "theology": {
        "label": "Scripture & Theology",
        "kicker": "Begin with the passage",
        "heading": "Read. Understand.<br><em>Live the Word.</em>",
        "lead": "Explore the Bible’s books, follow its teaching, and consider the life it calls us to lead.",
        "tone": "epistles",
        "other": "academic",
        "otherLine": "Explore the world behind the passage.",
        "areas": [
            {
                "id": "books",
                "cards": ["letters", "structure", "references", "versions"],
                "title": "Explore the Bible",
                "short": "Read in context",
                "art": "books",
                "tone": "epistles",
                "hint": "Books, passages, letters and the shape of the biblical story.",
                "heading": "Every book.<br><em>A place in the story.</em>",
                "intro": "Find a biblical book, understand its setting and literary form, then follow its message through the passages.",
                "featured": {
                    "kind": "Collection",
                    "title": "Books of the Bible",
                    "text": "Find the books of the Old and New Testaments, with introductions and passages.",
                    "href": "/topics/c/bible-books",
                    "art": "books"
                },
                "group": "Explore the collections",
                "items": [
                    {
                        "kind": "Collection",
                        "title": "Letters & their message",
                        "text": "Explore all 21 New Testament letters, their writers, recipients and unfolding arguments.",
                        "href": "/study/letters",
                        "art": "letters"
                    },
                    {
                        "kind": "Collection",
                        "title": "Law & beginnings",
                        "text": "Read the books of the Law, from Genesis to Deuteronomy.",
                        "href": "/topics/c/bible-books?group=books-law",
                        "art": "books"
                    },
                    {
                        "kind": "Collection",
                        "title": "History",
                        "text": "Follow Israel’s story through its historical books.",
                        "href": "/topics/c/bible-books?group=books-history",
                        "art": "books"
                    },
                    {
                        "kind": "Collection",
                        "title": "Poetry & wisdom",
                        "text": "Explore the Psalms, wisdom writings and their literary voices.",
                        "href": "/topics/c/bible-books?group=books-poetry",
                        "art": "prayer"
                    },
                    {
                        "kind": "Collection",
                        "title": "The prophetic books",
                        "text": "Read the books of the prophets and follow their messages.",
                        "href": "/topics/c/bible-books?group=books-prophets",
                        "art": "manuscript"
                    }
                ],
                "support": [
                    [
                        "Read the Bible",
                        "/bible"
                    ],
                    [
                        "Gospels & Acts",
                        "/topics/c/bible-books?group=books-gospels"
                    ]
                ]
            },
            {
                "id": "jesus",
                "cards": ["gospels", "parables", "miracles"],
                "title": "Jesus Christ",
                "short": "Follow his life & teaching",
                "art": "gospels",
                "tone": "gospels",
                "hint": "His life, identity, teaching, miracles, cross and resurrection.",
                "heading": "Meet Jesus.<br><em>Follow his life.</em>",
                "intro": "Read the four Gospel accounts, explore Jesus’ identity and teaching, and trace his work throughout Scripture.",
                "featured": {
                    "kind": "Collection",
                    "title": "Jesus & the Gospels",
                    "text": "Four portraits, teaching journeys and an event-by-event harmony of the accounts.",
                    "href": "/study/gospels",
                    "art": "gospels"
                },
                "group": "Explore the collections",
                "items": [
                    {
                        "kind": "Collection",
                        "title": "Who Jesus is",
                        "text": "Explore the person of Christ and the passages that reveal his identity.",
                        "href": "/topics/c/christ",
                        "art": "doctrine"
                    },
                    {
                        "kind": "Collection",
                        "title": "Parables & teaching",
                        "text": "Read the parables and their passages in context.",
                        "href": "/topics/c/christ-teaching",
                        "art": "manuscript"
                    },
                    {
                        "kind": "Collection",
                        "title": "Miracles & encounters",
                        "text": "Explore Jesus’ miracles, with connections to wonders elsewhere in Scripture.",
                        "href": "/study/miracles",
                        "art": "prayer"
                    },
                    {
                        "kind": "Collection",
                        "title": "Cross, resurrection & return",
                        "text": "Follow the biblical passages on his death, resurrection and promised return.",
                        "href": "/topics/c/christ-cross",
                        "art": "gospels"
                    },
                    {
                        "kind": "Collection",
                        "title": "Christ in the letters",
                        "text": "Explore his person, work and the life of those who belong to him.",
                        "href": "/study/letters/christ-in-the-letters",
                        "art": "letters"
                    }
                ],
                "support": [
                    [
                        "Compare the Gospel accounts",
                        "/study/gospels#harmony"
                    ],
                    [
                        "Names & titles of Jesus",
                        "/topics/c/christ-titles"
                    ]
                ]
            },
            {
                "id": "doctrine",
                "cards": ["topics", "names", "theology-articles", "creeds"],
                "title": "God & Christian Faith",
                "titleLines": ["God &", "Christian Faith"],
                "short": "Trace what Scripture teaches",
                "art": "doctrine",
                "tone": "revelation",
                "hint": "God’s character, salvation, covenant, the church and Christian belief.",
                "heading": "Know God.<br><em>Explore the faith.</em>",
                "intro": "Begin with Scripture’s witness to God, then follow the passages behind Christian teaching and belief.",
                "featured": {
                    "kind": "Collection",
                    "title": "Names & descriptions of God",
                    "text": "Explore the names and titles of the Father, the Son and the Holy Spirit.",
                    "href": "/study/names",
                    "art": "doctrine"
                },
                "group": "Explore the collections",
                "items": [
                    {
                        "kind": "Collection",
                        "title": "Who God is",
                        "text": "The Godhead, Trinity and attributes of God, gathered from Scripture.",
                        "href": "/topics/c/god",
                        "art": "doctrine"
                    },
                    {
                        "kind": "Collection",
                        "title": "The Holy Spirit",
                        "text": "Read the passages on the Spirit’s person and work.",
                        "href": "/topics/c/spirit",
                        "art": "prayer"
                    },
                    {
                        "kind": "Collection",
                        "title": "Salvation",
                        "text": "Grace, redemption, faith, repentance, justification and sanctification.",
                        "href": "/topics/c/salvation",
                        "art": "gospels"
                    },
                    {
                        "kind": "Collection",
                        "title": "Law & covenant",
                        "text": "Explore law, covenant and the relationships they describe.",
                        "href": "/topics/c/law",
                        "art": "manuscript"
                    },
                    {
                        "kind": "Collection",
                        "title": "The church & its mission",
                        "text": "The church, ministry, mission, ordinances and fellowship.",
                        "href": "/topics/c/church",
                        "art": "church"
                    }
                ],
                "support": [
                    [
                        "Sin & temptation",
                        "/topics/c/sin"
                    ],
                    [
                        "Resurrection & judgment",
                        "/topics/c/judgment"
                    ],
                    [
                        "Death, heaven & hell",
                        "/topics/c/last-things"
                    ],
                    [
                        "What God does",
                        "/topics/c/god-works"
                    ]
                ]
            },
            {
                "id": "life",
                "cards": ["topics", "hymns"],
                "title": "Living the Christian Life",
                "titleLines": ["Living the", "Christian Life"],
                "short": "Bring the Word into life",
                "art": "prayer",
                "tone": "poetry",
                "hint": "Prayer, worship, relationships, suffering, hope and everyday obedience.",
                "heading": "Follow Christ.<br><em>Live the Word.</em>",
                "intro": "Explore the passages that shape prayer, character, relationships and the ordinary practice of faith.",
                "featured": {
                    "kind": "Guide",
                    "title": "Life in Christ",
                    "text": "Follow the life the New Testament letters describe, from belief to daily practice.",
                    "href": "/study/letters/christ-in-the-letters/life",
                    "art": "prayer"
                },
                "group": "Explore the collections",
                "items": [
                    {
                        "kind": "Collection",
                        "title": "Prayer & worship",
                        "text": "Open the Scripture collections on prayer, worship and devotion.",
                        "href": "/topics/c/devotion",
                        "art": "prayer"
                    },
                    {
                        "kind": "Collection",
                        "title": "Character & obedience",
                        "text": "Explore Christian virtues, conduct and the responsibilities of faith.",
                        "href": "/topics/c/christian-life",
                        "art": "doctrine"
                    },
                    {
                        "kind": "Collection",
                        "title": "Marriage, family & neighbours",
                        "text": "Read Scripture on family life and care for neighbours and the poor.",
                        "href": "/topics/c/family",
                        "art": "writers"
                    },
                    {
                        "kind": "Collection",
                        "title": "Suffering, hope & comfort",
                        "text": "Follow passages on trials, affliction, joy, peace and comfort.",
                        "href": "/topics/c/trials",
                        "art": "prayer"
                    },
                    {
                        "kind": "Collection",
                        "title": "Service & witness",
                        "text": "Explore the biblical passages on ministry and mission.",
                        "href": "/topics/c/church?group=ministry-and-mission",
                        "art": "church"
                    }
                ],
                "support": [
                    [
                        "Faith & repentance",
                        "/topics/c/salvation?group=faith-and-repentance"
                    ],
                    [
                        "Work & wealth",
                        "/topics/c/trades?group=work-and-wealth"
                    ],
                    [
                        "The catechisms",
                        "/study/creeds"
                    ]
                ]
            },
            {
                "id": "people",
                "cards": ["people", "memory"],
                "title": "People of Scripture",
                "short": "Meet the people behind the pages",
                "art": "writers",
                "tone": "history",
                "hint": "Writers, prophets, apostles, rulers, women, men and their families.",
                "heading": "Meet the people.<br><em>Follow their stories.</em>",
                "intro": "Explore the lives and relationships within Scripture, then meet its writers and the books associated with them.",
                "featured": {
                    "kind": "Collection",
                    "title": "People & genealogies",
                    "text": "Follow biblical lives, families and their connections through the story.",
                    "href": "/study/people",
                    "art": "writers"
                },
                "group": "Explore the collections",
                "items": [
                    {
                        "kind": "Directory",
                        "title": "Writers & their books",
                        "text": "Meet the writers in the directory below, then open their existing person pages.",
                        "href": "/study/theology?area=people#writer-preview",
                        "art": "manuscript"
                    },
                    {
                        "kind": "Collection",
                        "title": "Prophets",
                        "text": "Explore the named prophets and the eras in which Scripture places them.",
                        "href": "/study/people?view=prophets",
                        "art": "writers"
                    },
                    {
                        "kind": "Collection",
                        "title": "Apostles",
                        "text": "Meet the apostles and follow their lives and work.",
                        "href": "/study/people?view=apostles",
                        "art": "writers"
                    },
                    {
                        "kind": "Collection",
                        "title": "Kings & rulers",
                        "text": "Explore the rulers named in the biblical story.",
                        "href": "/study/people?view=rulers",
                        "art": "writers"
                    },
                    {
                        "kind": "Collection",
                        "title": "Women of the Bible",
                        "text": "Mothers, leaders, prophetesses and women of the Gospels and early church.",
                        "href": "/topics/c/people-women",
                        "art": "writers"
                    }
                ],
                "support": [
                    [
                        "Families & genealogies",
                        "/study/people?view=families"
                    ],
                    [
                        "Paul and his letters",
                        "/study/letters/paul"
                    ],
                    [
                        "People of the New Testament",
                        "/topics/c/people-nt"
                    ]
                ],
                "writers": true
            }
        ]
    },
    "academic": {
        "label": "Academic Studies",
        "kicker": "Follow the sources",
        "heading": "Enter the world.<br><em>Understand the evidence.</em>",
        "lead": "Explore the history, texts and languages behind the Bible, and weigh the evidence.",
        "tone": "history",
        "other": "theology",
        "otherLine": "Return to the passage and its teaching.",
        "areas": [
            {
                "id": "history",
                "title": "History & archaeology",
                "short": "Events, places & surviving records",
                "art": "inscription",
                "tone": "history",
                "hint": "Read ancient accounts beside material evidence, and ask what each can establish.",
                "heading": "A world recorded.<br><em>A past to investigate.</em>",
                "intro": "Begin with a historical question. Compare the biblical narrative with an ancient account, then examine the setting, source and limits of the comparison.",
                "featured": {
                    "kind": "Methods study",
                    "title": "From discovery to history",
                    "text": "Learn how historians read archaeology and inscriptions through worked examples from the biblical world.",
                    "href": "/study/from-discovery-to-history",
                    "meta": "Preserved evidence · Reconstruction · Interpretation",
                    "art": "inscription"
                },
                "group": "Explore the setting and source",
                "items": [
                    {"kind": "Study landing", "title": "Mesha and the world of Moab", "text": "Illustrated landing for a historical study of Mesha and Moab.", "href": "/study/mesha-and-the-world-of-moab", "outline": true},
                    {"kind": "Study landing", "title": "Lachish under siege", "text": "Illustrated landing for a historical study of Lachish and the campaign.", "href": "/study/lachish-under-siege", "outline": true},
                    {"kind": "Study landing", "title": "Cyrus, restoration and return", "text": "Illustrated landing for a historical study of imperial restoration and return.", "href": "/study/cyrus-restoration-and-return", "outline": true},
                    {
                        "kind": "Museum collections",
                        "title": "Museum-Grade Archaeology",
                        "text": "Open the museums themselves: real object records from collections that publish openly, with dates, findspots and photographs under their own licences.",
                        "href": "/study/museum-archaeology",
                        "meta": "Museums · Objects · Open licences",
                        "art": "museum",
                        "collection": true,
                        "tone": "poetry"
                    },
                    {
                        "kind": "Map collection",
                        "title": "Old maps of the Holy Land",
                        "text": "Historical maps of the biblical world, 680 to 1928, from ten libraries. Open any map at full size, with its maker, its library and its credit.",
                        "href": "/study/atlas/old-maps",
                        "meta": "Maps · Mapmakers · Libraries",
                        "collection": true,
                        "tone": "epistles"
                    },
                    {"kind": "Interactive study", "title": "Israel among the empires", "text": "Trace tribute, conquest, exile and return through synchronized maps and primary evidence.", "href": "/study/israel-among-the-empires", "art": "inscription", "tone": "prophets"},
                    {"kind": "Interactive archaeology", "title": "Cities through their layers", "text": "Explore Jericho, Lachish, Jerusalem and Corinth through selected phases, finds and disputed interpretations.", "href": "/study/cities-through-their-layers", "art": "inscription", "tone": "epistles"},
                    {"kind": "Interactive journey", "title": "The world of Jesus & the apostles", "text": "Explore eight connected settings, from Galilean households and Jerusalem to Caesarea, Corinth, Ephesus and travel toward Rome.", "href": "/study/world-of-jesus-apostles", "art": "city", "tone": "gospels"},
                    {"kind": "Guide", "title": "Rulers in the biblical world", "text": "Follow rulers and their settings, then open the biblical passages and the people they connect.", "href": "/study/people?view=rulers"},
                    {
                        "kind": "Atlas",
                        "title": "Places behind the narrative",
                        "text": "Find a place and open the passages associated with it.",
                        "href": "/study/atlas/map"
                    }
                ],
                "support": [
                    [
                        "Meet the historians",
                        "/teachers/scholars"
                    ],
                    [
                        "Questions and arguments",
                        "/apologetics"
                    ]
                ]
            },
            {
                "id": "texts",
                "title": "The Bible: formation & transmission",
                "short": "The surviving witnesses",
                "art": "manuscript",
                "tone": "prophets",
                "hint": "Identify a manuscript, compare what survives and follow a textual question.",
                "heading": "The text survives<br><em>in witnesses.</em>",
                "intro": "Each manuscript has a date, a history and a particular scope. Look closely at one witness, then consider how it contributes to a larger textual question.",
                "featured": {
                    "kind": "Study",
                    "title": "The surviving witnesses",
                    "text": "Why the manuscripts matter: examine six of them in their own photographs, count how many survive and how close they come to the writing, and reunite the scattered leaves of a codex.",
                    "href": "/study/surviving-witnesses",
                    "meta": "Manuscripts · Transmission · Evidence",
                    "art": "manuscript"
                },
                "group": "Transmission and reception",
                "items": [
                    {
                        "kind": "Manuscript collection",
                        "title": "Manuscripts",
                        "text": "Every dated copy through time and book by book, the libraries that keep them now, and over five thousand open catalogue records to open one by one.",
                        "href": "/study/manuscripts",
                        "meta": "Witnesses · Dates · Libraries",
                        "art": "manuscript"
                    },
                    {
                        "kind": "Interactive study",
                        "title": "A passage through the manuscripts",
                        "text": "Compare actual readings, inspect corrections and distinguish missing pages from omitted words.",
                        "href": "/study/passage-through-manuscripts",
                        "art": "manuscript"
                    },
                    {
                        "kind": "Study",
                        "title": "From manuscript to printed Bible",
                        "text": "Enter the print room: reveal a page’s layers, trace an edition’s sources, and separate editing from translation.",
                        "href": "/study/from-manuscript-to-printed-bible"
                    },
                    {
                        "kind": "Interactive study",
                        "title": "How the canon took shape",
                        "text": "Inspect historical lists in their own time and place, follow disputed writings, and compare Jewish and Christian collections.",
                        "href": "/study/how-the-canon-took-shape",
                        "meta": "Timeline · Reception · Traditions",
                        "art": "books"
                    },
                    {
                        "kind": "Study",
                        "title": "The Dead Sea Scrolls",
                        "text": "Meet ancient manuscripts, compare scribal hands and psalms, and follow the evidence behind dates, joins and scholarly debates.",
                        "href": "/study/dead-sea-scrolls"
                    },
                    {
                        "kind": "Guide",
                        "title": "How the letters were read",
                        "text": "Explore reception, questions and comparison.",
                        "href": "/study/letters/look-closer/read"
                    }
                ],
                "support": [
                    [
                        "The question of the canon",
                        "/apologetics/study/canon"
                    ],
                    [
                        "Compare editions & choose a reading text",
                        "/study/versions"
                    ]
                ]
            },
            {
                "id": "languages",
                "title": "Languages & translation",
                "short": "Translation choices, words & textual scholarship",
                "art": "languages",
                "tone": "poetry",
                "hint": "Investigate how texts were edited and translated, and how words carry meaning in their passages.",
                "heading": "Examine the wording.<br><em>Understand the choices.</em>",
                "intro": "Study the evidence behind editions and translations: how texts reached print, how words work in context, and why readings and renderings differ.",
                "featured": {
                    "kind": "Study",
                    "title": "From manuscript to printed Bible",
                    "text": "Enter the print room: examine source texts, editorial decisions and the editions that carried Scripture into print.",
                    "href": "/study/from-manuscript-to-printed-bible",
                    "meta": "Source texts · Editing · Printing",
                    "art": "manuscript"
                },
                "group": "Explore language and interpretation",
                "items": [
                    {
                        "kind": "Guide",
                        "title": "Words across the letters",
                        "text": "Explore the Greek words the Letters guides bring into view.",
                        "href": "/study/letters/what-runs-through-them/words"
                    },
                    {
                        "kind": "People",
                        "title": "Translators and reference scholars",
                        "text": "Meet the scholars and the work behind the reading tools.",
                        "href": "/teachers/scholars"
                    }
                ],
                "support": [
                    [
                        "Compare editions & choose a reading text",
                        "/study/versions"
                    ],
                    [
                        "Compare the letters",
                        "/study/letters/look-closer"
                    ]
                ],
                "planned": [
                    "Why translations differ",
                    "Words in their passages"
                ]
            },
            {
                "id": "culture",
                "title": "Ancient cultures & daily life",
                "short": "Life behind the passage",
                "art": "city",
                "tone": "epistles",
                "hint": "Enter the cities, journeys and social settings in which people lived and wrote.",
                "heading": "People lived here.<br><em>Their words had a setting.</em>",
                "intro": "Letters were written, carried and read in real communities. Explore those journeys and cities before returning to the words themselves.",
                "featured": {
                    "kind": "Guide",
                    "title": "How the letters came to be",
                    "text": "Explore when letters were written, where they travelled and how an ancient letter was formed.",
                    "href": "/study/letters/how-the-letters-came-to-be",
                    "meta": "Dates · Travel · Letter form",
                    "art": "letters"
                },
                "group": "Enter the world around the text",
                "items": [
                    {
                        "kind": "Atlas",
                        "title": "Ancient cities",
                        "text": "Explore a city’s setting and biblical connections.",
                        "href": "/study/atlas/cities"
                    },
                    {
                        "kind": "Guide",
                        "title": "The letter itself",
                        "text": "Consider the shape, writing and carrying of an ancient letter.",
                        "href": "/study/letters/how-the-letters-came-to-be/letter"
                    },
                    {
                        "kind": "Journey",
                        "title": "Paul: places and letters",
                        "text": "Connect his correspondence with the places in its story.",
                        "href": "/study/atlas/journeys?focus=paul&lens=letters"
                    }
                ],
                "support": [
                    [
                        "Find a place",
                        "/study/atlas/map"
                    ],
                    [
                        "Meet the people",
                        "/study/people"
                    ]
                ]
            },
            {
                "id": "church",
                "title": "Christian thought & church history",
                "short": "People, ideas & their reception",
                "art": "church",
                "tone": "gospels",
                "hint": "Follow Christian reading and teaching through writers, works and communities.",
                "heading": "A long conversation.<br><em>Writers worth meeting.</em>",
                "intro": "Explore how Christian texts were read, how questions developed and who contributed to the discussion. Begin with a guide, then follow its people and works.",
                "featured": {
                    "kind": "Guide",
                    "title": "How the letters were read",
                    "text": "Consider the questions readers have asked and how these letters were received.",
                    "href": "/study/letters/look-closer/read",
                    "meta": "Reading · Questions · Reception",
                    "art": "church"
                },
                "group": "Follow their work",
                "items": [
                    {
                        "kind": "People",
                        "title": "Scholars",
                        "text": "Historians, theologians and the makers of reference works.",
                        "href": "/teachers/scholars"
                    },
                    {
                        "kind": "People",
                        "title": "Preachers & authors",
                        "text": "Explore the people who taught, preached and wrote.",
                        "href": "/teachers/preachers-and-authors"
                    },
                    {
                        "kind": "Reading outline",
                        "title": "The early church",
                        "text": "Browse the existing topic outlines and their source links.",
                        "href": "/study/atlas/early-church",
                        "outline": true
                    }
                ],
                "support": [
                    [
                        "The Reformation: an outline",
                        "/study/atlas/reformation"
                    ],
                    [
                        "Christian traditions: an outline",
                        "/study/atlas/catholic-orthodox"
                    ]
                ],
                "planned": [
                    "Shared roots",
                    "Oriental Orthodox churches",
                    "Separation & encounter",
                    "Worship & spiritual life"
                ]
            }
        ]
    }
};
