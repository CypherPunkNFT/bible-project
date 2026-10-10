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
                "title": "Books & passages",
                "short": "Read in context",
                "art": "books",
                "tone": "epistles",
                "hint": "Understand a book’s shape, follow its message and read its passages together.",
                "heading": "A passage belongs<br>to <em>a larger story.</em>",
                "intro": "Begin with the shape of the biblical library. Then enter a book, read a letter, or follow a passage’s connections.",
                "featured": {
                    "kind": "Collection",
                    "title": "Letters & their message",
                    "text": "Twenty-one letters. Explore who they address, how their arguments unfold and what they teach.",
                    "href": "/study/letters",
                    "meta": "Four collections · Four ways in",
                    "art": "letters"
                },
                "group": "Get your bearings",
                "items": [
                    {
                        "kind": "Tool",
                        "title": "The shape of the Bible",
                        "text": "Explore its sections, books and chapters.",
                        "href": "/study/structure"
                    },
                    {
                        "kind": "Guide",
                        "title": "Christ in the letters",
                        "text": "Who he is, what he did and life in him.",
                        "href": "/study/letters/christ-in-the-letters"
                    },
                    {
                        "kind": "Tool",
                        "title": "Connections in Scripture",
                        "text": "Follow references from one passage to another.",
                        "href": "/study/references"
                    }
                ],
                "support": [
                    [
                        "Open the Bible",
                        "/bible"
                    ],
                    [
                        "Choose an edition",
                        "/study/versions"
                    ]
                ]
            },
            {
                "id": "jesus",
                "title": "Jesus & the Gospels",
                "short": "Follow his life & teaching",
                "art": "gospels",
                "tone": "gospels",
                "hint": "Read each Gospel in its own voice, then bring the accounts into conversation.",
                "heading": "Four accounts.<br><em>One life.</em>",
                "intro": "Meet Jesus through the portraits, teaching and encounters the Gospel writers give us. Compare the accounts without losing each writer’s voice.",
                "featured": {
                    "kind": "Guide",
                    "title": "Four Gospel portraits",
                    "text": "Explore what Matthew, Mark, Luke and John each bring into view.",
                    "href": "/study/gospels#portraits",
                    "meta": "Matthew · Mark · Luke · John",
                    "art": "gospels"
                },
                "group": "Follow the accounts",
                "items": [
                    {
                        "kind": "Guide",
                        "title": "Teaching journeys",
                        "text": "Hear the teaching within its narrative setting.",
                        "href": "/study/gospels#jesus"
                    },
                    {
                        "kind": "Collection",
                        "title": "Miracles & encounters",
                        "text": "Read the signs, the people and the passages together.",
                        "href": "/study/miracles"
                    },
                    {
                        "kind": "Comparison",
                        "title": "The Gospel harmony",
                        "text": "Follow an event across the accounts that tell it.",
                        "href": "/study/gospels#harmony"
                    }
                ],
                "support": [
                    [
                        "Christ in the letters",
                        "/study/letters/christ-in-the-letters"
                    ],
                    [
                        "Where Jesus speaks",
                        "/study/gospels#speech"
                    ]
                ]
            },
            {
                "id": "doctrine",
                "title": "God & Christian doctrine",
                "short": "Trace what Scripture teaches",
                "art": "doctrine",
                "tone": "revelation",
                "hint": "Begin with God’s names and character, then follow a teaching through its passages.",
                "heading": "Know his character.<br><em>Follow his teaching.</em>",
                "intro": "Move from the words of Scripture to the beliefs they express. Read the passages behind a doctrine and consider how they belong together.",
                "featured": {
                    "kind": "Collection",
                    "title": "Names & descriptions of God",
                    "text": "Explore the names and titles of the Father, the Son and the Holy Spirit, with their biblical passages.",
                    "href": "/study/names",
                    "meta": "Names · Character · Scripture",
                    "art": "doctrine"
                },
                "group": "Follow a teaching",
                "items": [
                    {
                        "kind": "Collection",
                        "title": "Topics in Scripture",
                        "text": "Bring a subject’s passages together and read in context.",
                        "href": "/topics"
                    },
                    {
                        "kind": "Question",
                        "title": "Does the Trinity mean three gods?",
                        "text": "Follow the existing Apologetics discussion and its sources.",
                        "href": "/apologetics/study/god"
                    },
                    {
                        "kind": "Question",
                        "title": "How does covenant theology connect the Bible?",
                        "text": "Explore a theological account of the connections.",
                        "href": "/apologetics/study/covenant"
                    }
                ],
                "support": [
                    [
                        "Grace and good works",
                        "/apologetics/study/grace"
                    ],
                    [
                        "Cross-reference tools",
                        "/study/references"
                    ]
                ]
            },
            {
                "id": "life",
                "title": "Prayer & Christian life",
                "short": "Bring the Word into life",
                "art": "prayer",
                "tone": "poetry",
                "hint": "Consider prayer, assurance and the ordinary practice of faith through Scripture.",
                "heading": "Read with attention.<br><em>Respond with your life.</em>",
                "intro": "Let a passage give shape to prayer and practice. Connect what you believe with how you live, hope and care for others.",
                "featured": {
                    "kind": "Guide",
                    "title": "Life in Christ",
                    "text": "Explore the life the New Testament letters describe, and connect belief with prayer and practice.",
                    "href": "/study/letters/christ-in-the-letters/life",
                    "meta": "Faith · Prayer · Christian life",
                    "art": "prayer"
                },
                "group": "Continue in Scripture",
                "items": [
                    {
                        "kind": "Question",
                        "title": "Assurance in a struggling Christian life",
                        "text": "Read the existing discussion of promise, faith and assurance.",
                        "href": "/apologetics/study/assurance"
                    },
                    {
                        "kind": "Collection",
                        "title": "Prayer, faith and hope in Topics",
                        "text": "Find a theme and follow its passages.",
                        "href": "/topics"
                    }
                ],
                "support": [
                    [
                        "Grace and good works",
                        "/apologetics/study/grace"
                    ],
                    [
                        "The question of suffering",
                        "/apologetics/study/suffering"
                    ]
                ]
            },
            {
                "id": "people",
                "title": "People & writers of Scripture",
                "short": "Meet the people behind the pages",
                "art": "writers",
                "tone": "history",
                "hint": "Follow a life, meet a writer and open the books associated with them.",
                "heading": "Meet a writer.<br><em>Follow the words.</em>",
                "intro": "The biblical books come to us through many voices. Explore their lives and settings, while keeping tradition, attribution and anonymity in view.",
                "featured": {
                    "kind": "Collection",
                    "title": "People & genealogies",
                    "text": "Follow the families, prophets, rulers and apostles through the biblical narrative.",
                    "href": "/study/people",
                    "meta": "Lives · Families · Scripture",
                    "art": "writers"
                },
                "group": "Lives within the story",
                "items": [
                    {
                        "kind": "Guide",
                        "title": "The prophets",
                        "text": "Explore the people, settings and messages of prophecy.",
                        "href": "/study/people?view=prophets"
                    },
                    {
                        "kind": "Guide",
                        "title": "The apostles",
                        "text": "Meet the apostles and follow their work.",
                        "href": "/study/people?view=apostles"
                    },
                    {
                        "kind": "Collection",
                        "title": "Paul and his letters",
                        "text": "Read the letters alongside their writer and recipients.",
                        "href": "/study/letters/paul"
                    }
                ],
                "support": [
                    [
                        "Follow Paul in the Atlas",
                        "/study/atlas/journeys?focus=paul&lens=story"
                    ],
                    [
                        "People & families",
                        "/study/people?view=families"
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
