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
}
export interface Area {
    id: string;
    title: string;
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
        "lead": "Explore the Bible’s books, follow its teaching, and consider the life it calls us to lead. Choose a subject. Find a place to begin.",
        "tone": "epistles",
        "other": "academic",
        "otherLine": "Explore the world behind the passage.",
        "areas": [
            {
                "id": "books",
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
                "title": "God & the Christian Faith",
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
                "title": "Living the Christian Life",
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
                    ]
                ]
            },
            {
                "id": "people",
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
        "lead": "Explore the history, texts, languages and scholarship surrounding the Bible. Follow a question into the sources, their interpretation and their limits.",
        "tone": "history",
        "other": "theology",
        "otherLine": "Return to the passage and its teaching.",
        "areas": [
            {
                "id": "history",
                "title": "Biblical history & archaeology",
                "short": "Events, places & surviving records",
                "art": "inscription",
                "tone": "history",
                "hint": "Read ancient accounts beside material evidence, and ask what each can establish.",
                "heading": "A world recorded.<br><em>A past to investigate.</em>",
                "intro": "Begin with a historical question. Compare the biblical narrative with an ancient account, then examine the setting, source and limits of the comparison.",
                "featured": {
                    "kind": "Guide",
                    "title": "Rulers in the biblical world",
                    "text": "Follow rulers and their settings, then open the biblical passages and the people they connect.",
                    "href": "/study/people?view=rulers",
                    "meta": "People · Kingdoms · Scripture",
                    "art": "inscription"
                },
                "group": "Explore the setting and source",
                "items": [
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
                "title": "Manuscripts & textual history",
                "short": "The surviving witnesses",
                "art": "manuscript",
                "tone": "prophets",
                "hint": "Identify a manuscript, compare what survives and follow a textual question.",
                "heading": "The text survives<br><em>in witnesses.</em>",
                "intro": "Each manuscript has a date, a history and a particular scope. Look closely at one witness, then consider how it contributes to a larger textual question.",
                "featured": {
                    "kind": "Question",
                    "title": "Has the Bible been changed?",
                    "text": "Explore the existing discussion of surviving manuscripts, textual transmission and the evidence behind the question.",
                    "href": "/apologetics/study/manuscripts",
                    "meta": "Manuscripts · Transmission · Evidence",
                    "art": "manuscript"
                },
                "group": "Transmission and reception",
                "items": [
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
                        "Versions & languages",
                        "/study/versions"
                    ]
                ]
            },
            {
                "id": "languages",
                "title": "Languages & translation",
                "short": "Words, meaning & editions",
                "art": "languages",
                "tone": "poetry",
                "hint": "Explore language in context, compare editions and meet the people who translated them.",
                "heading": "Words in context.<br><em>Meaning in view.</em>",
                "intro": "Compare editions, examine words within their passages, and discover the reference scholarship that supports careful reading.",
                "featured": {
                    "kind": "Collection",
                    "title": "Versions & languages",
                    "text": "See the editions in time, compare their coverage and choose a text to read.",
                    "href": "/study/versions",
                    "meta": "Editions · Coverage · Reading",
                    "art": "languages"
                },
                "group": "Look more closely",
                "items": [
                    {
                        "kind": "Guide",
                        "title": "Words across the letters",
                        "text": "Explore the Greek words the Letters guides bring into view.",
                        "href": "/study/letters/what-runs-through-them/words"
                    },
                    {
                        "kind": "Tool",
                        "title": "Versions through time",
                        "text": "Place the collection’s editions on a timeline.",
                        "href": "/study/versions#timeline"
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
                        "Choose a reading edition",
                        "/library"
                    ],
                    [
                        "Compare the letters",
                        "/study/letters/look-closer"
                    ]
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


export const THEOLOGY_TOOLS = [
    {title: "Topics", text: "Find a subject and its passages.", href: "/topics", icon: "search"},
    {title: "Cross-references", text: "Follow connections across Scripture.", href: "/study/references", icon: "branch"},
    {title: "Bible structure", text: "Explore books, forms and chapters.", href: "/study/structure", icon: "book"},
    {title: "Versions & translations", text: "Compare editions and their contents.", href: "/study/versions", icon: "book"},
    {title: "Atlas", text: "Explore places and journeys.", href: "/study/atlas", icon: "map"},
] as const;
