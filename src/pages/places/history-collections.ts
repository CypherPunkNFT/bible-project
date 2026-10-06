import { Church, Globe2, ScrollText, Split } from "lucide-react";

export type HistoryTopic = { id: string; title: string; subtitle: string; question: string; places: string[]; threads: string[] };
const topic = (id: string, title: string, subtitle: string, question: string, places: string[], threads: string[]): HistoryTopic => ({ id, title, subtitle, question, places, threads });

// Editorial navigation outlines. Dates, routes, and historical map layers are not reconstructed here.
export const HISTORY_COLLECTIONS = [
  {
    id: "early-church", title: "The Early Church", eyebrow: "After the apostles", icon: Church, color: "gospels",
    description: "Discover communities learning to live, worship, and confess their faith through persecution, debate, and change.",
    detail: "Communities · Worship · Councils", action: "Explore the early church",
    heading: "After the apostles. A living church.",
    intro: "Explore the people, practices, and questions of the early Christian centuries. Read communities in their own setting and encounter the writings they left behind.",
    choose: "Where will you begin?",
    topics: [
      topic("communities", "After the Apostles", "Letters & local communities", "How did communities maintain their faith and relationships after the apostles?", ["Antioch", "Smyrna", "Rome"], ["Letters between churches", "Local leadership and shared life", "Continuity, memory, and testimony"]),
      topic("witness", "Witness & Persecution", "Faith under pressure", "What did faithfulness cost, and how were its witnesses remembered?", ["Smyrna", "Lyon", "Carthage"], ["Accounts of trials and martyrdom", "Imperial and local pressures", "Memory, courage, and disputed responses"]),
      topic("worship", "Worship & Daily Life", "Gathering, prayer & belonging", "What can early Christian writings tell us about life inside a community?", ["Rome", "Antioch", "Alexandria"], ["Baptism and the shared meal", "Prayer, teaching, and care for neighbors", "Descriptions of practice in their own period"]),
      topic("scripture", "Scripture & Interpretation", "Reading, teaching & transmission", "How did Christians read, copy, and interpret the Scriptures?", ["Alexandria", "Caesarea", "Antioch"], ["Manuscripts and translation", "Interpretive approaches", "The reception of Christian writings"]),
      topic("councils", "Councils & Creeds", "Confession & contested language", "Why did particular words about Christ and the Trinity matter so much?", ["Nicaea", "Constantinople", "Chalcedon"], ["Questions behind the councils", "Creeds and their vocabulary", "Reception, disagreement, and enduring divisions"]),
      topic("desert", "Desert & Monastery", "Prayer, discipline & community", "How did withdrawal from city life create new forms of Christian community?", ["Egypt", "Sinai", "Cappadocia"], ["Solitude and communal life", "Rules, practices, and spiritual counsel", "The relationship between monastery and city"]),
    ],
    sources: [
      { title: "Early Christian writings · Ante-Nicene Fathers", url: "https://www.ccel.org/fathers" },
      { title: "An Orthodox account of church history", url: "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history" },
    ],
  },
  {
    id: "catholic-orthodox", title: "Apostolic Church", eyebrow: "Shared roots, distinct traditions", icon: Split, color: "prophets",
    description: "Explore the development of Catholic and Orthodox Christianity through its worship, centers of authority, divisions, and encounters.",
    detail: "Traditions · Authority · Communion", action: "Explore the traditions",
    heading: "Shared roots. Distinct traditions.",
    intro: "Discover how Catholic and Orthodox Christians understand their history, worship, and continuity with the apostles. Follow developments over centuries, with each tradition's claims identified in its own voice.",
    choose: "What would you like to understand?",
    topics: [
      topic("roots", "Shared Roots", "Scripture, creeds & early communities", "What inheritance do these traditions share, and how does each understand continuity?", ["Jerusalem", "Antioch", "Rome", "Alexandria", "Constantinople"], ["Apostolic continuity", "Scripture and the creeds", "Early centers and relationships"]),
      topic("catholic", "Catholic Christianity", "Communion, councils & the papacy", "How did Catholic institutions and understandings of authority develop?", ["Rome", "Avignon", "Trent"], ["The role of the bishop of Rome", "Councils and reform", "Latin and Eastern Catholic traditions"]),
      topic("eastern", "Eastern Orthodoxy", "Councils, icons & liturgy", "How do Orthodox churches express unity through their shared faith and worship?", ["Constantinople", "Thessalonica", "Mount Athos"], ["Councils and local churches", "Icons and their defense", "Liturgy and spiritual practice"]),
      topic("oriental", "Oriental Orthodox Churches", "Ancient communities & Christology", "How do the Oriental Orthodox traditions differ from Eastern Orthodoxy?", ["Alexandria", "Etchmiadzin", "Aksum"], ["The reception of Chalcedon", "Coptic, Armenian, Syriac, and other traditions", "Distinct histories and later dialogue"]),
      topic("separation", "Separation & Encounter", "A relationship across centuries", "How did disagreements become divisions, and what has made dialogue possible?", ["Rome", "Constantinople", "Lyon", "Florence"], ["Authority, language, and theological disputes", "Political conflict and broken communion", "Reunion attempts and modern dialogue"]),
      topic("worship", "Worship & Spiritual Life", "Theology as lived practice", "What can worship reveal about a tradition's understanding of God and the church?", ["Rome", "Constantinople", "Sinai"], ["Sacraments and liturgical life", "Monastic traditions", "Sacred art and the church calendar"]),
    ],
    sources: [
      { title: "Catholic–Orthodox joint declaration · 1965", url: "https://www.vatican.va/content/paul-vi/en/speeches/1965/documents/hf_p-vi_spe_19651207_common-declaration.html" },
      { title: "Catholic perspective · Unitatis redintegratio", url: "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_unitatis-redintegratio_en.html" },
      { title: "Orthodox perspective · The Orthodox Faith", url: "https://www.oca.org/orthodoxy/the-orthodox-faith/church-history" },
    ],
  },
  {
    id: "reformation", title: "The Reformation", eyebrow: "Read the questions that changed Europe", icon: ScrollText, color: "history",
    description: "Explore reform movements and their disagreements. Bring cities, printing, Scripture, and the arguments themselves into view.",
    detail: "Movements · Scripture · Reform", action: "Explore the Reformation",
    heading: "Words that changed the church.",
    intro: "Enter the debates behind the Reformation. Explore what reformers and their opponents argued, which Scriptures they read, and how faith, print, and political power met.",
    choose: "Choose a movement or setting",
    topics: [
      topic("before", "Before the Reformation", "Earlier calls for reform", "Which questions and reform efforts preceded the sixteenth century?", ["Oxford", "Prague", "Constance"], ["Calls for renewal", "Scripture and church authority", "Reform, condemnation, and memory"]),
      topic("luther", "Luther & Germany", "Indulgences, faith & authority", "How did a dispute over indulgences develop into a wider conflict about the church?", ["Wittenberg", "Worms", "Augsburg"], ["Indulgences and repentance", "Justification and the reading of Scripture", "Confession, translation, and political protection"]),
      topic("swiss", "The Swiss Reformations", "Zurich, Geneva & their neighbors", "Where did reformers agree, and why did they disagree with one another?", ["Zurich", "Geneva", "Basel"], ["Reformed worship", "The Lord's Supper", "Church order and civic life"]),
      topic("radical", "The Radical Reformation", "Baptism, discipleship & community", "What happened when reform challenged both established churches and civic authority?", ["Zurich", "Schleitheim", "Strasbourg"], ["Believers' baptism", "Discipleship and the gathered church", "Different movements, persecution, and survival"]),
      topic("britain", "Britain & Ireland", "Crown, church & confession", "How did political authority and religious conviction reshape these churches differently?", ["London", "Edinburgh", "Dublin"], ["Royal authority and reform", "Worship and confessional change", "Local responses and contested settlements"]),
      topic("catholic-reform", "Catholic Reform & Trent", "Renewal & doctrinal response", "How did Catholics pursue reform and respond to Protestant challenges?", ["Trent", "Rome", "Ingolstadt"], ["The Council of Trent", "Education and new religious orders", "Reform within Catholic life"]),
    ],
    sources: [
      { title: "Lutheran–Catholic commemoration of the Reformation", url: "https://lutheranworld.org/resources/document-together-hope-joint-catholic-lutheran-commemoration-500-years-reformation" },
      { title: "Reformed churches · World Council of Churches", url: "https://www.oikoumene.org/church-families/reformed-churches" },
      { title: "Anabaptist beginnings · Mennonite World Conference", url: "https://mwc-cmm.org/en/stories/how-mennonites-came-be/" },
      { title: "Council of Trent · Decrees in English translation", url: "https://www.papalencyclicals.net/councils/trent/the-complete-text.htm" },
    ],
  },
  {
    id: "missions", title: "Global Missions", eyebrow: "Across languages and cultures", icon: Globe2, color: "poetry",
    description: "Explore how communities receive and share the gospel. Meet local believers, translators, and missionaries within the worlds they inhabit.",
    detail: "Regions · Languages · Communities", action: "Explore missions",
    heading: "A worldwide church. Many local stories.",
    intro: "Start with a region, then explore communities, languages, and encounters across time. Follow the growth of local churches alongside missionary work, with both its witness and its historical tensions in view.",
    choose: "Choose a region",
    topics: [
      topic("africa", "Africa", "Ancient roots & local movements", "How do ancient Christian traditions and newer local movements shape this region's stories?", ["Egypt & the Horn of Africa", "West & Central Africa", "East & Southern Africa"], ["Local leadership and communities", "Languages and Bible translation", "Mission, colonial power, and independent churches"]),
      topic("asia", "Asia", "Languages, cultures & encounter", "How have Christian communities expressed their faith within diverse Asian cultures?", ["South Asia", "East Asia", "Southeast Asia"], ["Local teachers and translators", "Encounters with other religious traditions", "Community, opposition, and adaptation"]),
      topic("middle-east", "The Middle East", "Continuity, encounter & endurance", "How do long-established Christian communities understand witness in their own homelands?", ["The Levant", "Mesopotamia", "The Arabian Peninsula"], ["Ancient churches and living traditions", "Languages and changing political worlds", "Community continuity and migration"]),
      topic("europe", "Europe", "Conversion, renewal & sending", "How have Europe's communities both received and sent Christian witness?", ["The Mediterranean", "Northern Europe", "Eastern Europe"], ["Monasteries and local communities", "Translation and religious change", "Renewal movements and sending networks"]),
      topic("americas", "The Americas", "Encounter, power & local voices", "How do Indigenous, settler, and migrant experiences change the telling of mission history?", ["North America", "Central America & the Caribbean", "South America"], ["Indigenous Christians and interpreters", "Mission and colonial institutions", "Migration, renewal, and local churches"]),
      topic("pacific", "The Pacific", "Islands, languages & communities", "What comes into view when island communities tell the story themselves?", ["Polynesia", "Melanesia", "Micronesia & Australasia"], ["Island teachers and local networks", "Scripture in local languages", "Community change and cultural continuity"]),
    ],
    sources: [
      { title: "Regional churches · World Council of Churches", url: "https://www.oikoumene.org/member-churches" },
      { title: "African Instituted churches · Local leadership and identity", url: "https://www.oikoumene.org/church-families/african-instituted-churches" },
      { title: "The Nature and Mission of the Church · Ecumenical study", url: "https://oikoumene.org/resources/documents/the-nature-and-mission-of-the-church-a-stage-on-the-way-to-a-common-statement" },
    ],
  },
] as const;

export type HistoryId = typeof HISTORY_COLLECTIONS[number]["id"];
