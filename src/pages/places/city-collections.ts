import { Church, Crown, Footprints, Landmark, ScrollText, ShieldCheck, Ship, Sun, Tent, Waves, Bell } from "lucide-react";

/** `place` is the atlas place name; `placeId` pins one atlas entry when several places share that name. */
export type CityChoice = { id: string; title: string; subtitle: string; place: string; placeId?: string };
const city = (title: string, subtitle: string, place = title, placeId?: string) => ({ title, subtitle, place, ...(placeId ? { placeId } : {}) });

// Shared identities: a city can belong to several collections without becoming a different place.
const CITIES = {
  ephesus: city("Ephesus", "The gospel in a city"),
  smyrna: city("Smyrna", "Faithfulness under pressure"),
  pergamum: city("Pergamum", "Witness & compromise"),
  thyatira: city("Thyatira", "Love, service & discernment"),
  sardis: city("Sardis", "A call to wake up"),
  philadelphia: city("Philadelphia", "An open door"),
  laodicea: city("Laodicea", "Wealth & spiritual need"),
  jerusalem: city("Jerusalem", "Worship & kingdom"),
  hebron: city("Hebron", "Patriarchs & David's reign"),
  shechem: city("Shechem", "Covenant & divided loyalties"),
  samaria: city("Samaria", "The northern capital"),
  bethel: city("Bethel", "A vision & a royal shrine"),
  shiloh: city("Shiloh", "The sanctuary & Samuel"),
  beersheba: city("Beersheba", "Wells, oaths & journeys"),
  bethlehem: city("Bethlehem", "Ruth, David & Jesus"),
  nazareth: city("Nazareth", "Jesus' hometown"),
  capernaum: city("Capernaum", "Beside the sea"),
  bethsaida: city("Bethsaida", "Disciples & signs"),
  cana: city("Cana", "Water into wine"),
  bethany: city("Bethany", "Martha, Mary & Lazarus"),
  jericho: city("Jericho", "An encounter with Zacchaeus"),
  antioch: city("Antioch in Syria", "A sending community", "Antioch"),
  philippi: city("Philippi", "Lydia & the jailer"),
  thessalonica: city("Thessalonica", "A church awaiting Christ"),
  corinth: city("Corinth", "A church & its questions"),
  athens: city("Athens", "Paul at the Areopagus"),
  rome: city("Rome", "At the imperial capital"),
  lystra: city("Lystra", "Healing & mistaken worship"),
  babylon: city("Babylon", "Exile & imperial power"),
  nineveh: city("Nineveh", "Jonah & a city's repentance"),
  susa: city("Susa", "Esther at the Persian court"),
  damascus: city("Damascus", "Aram & Saul's turning point"),
  tyre: city("Tyre", "Trade, wealth & prophetic warning"),
  sidon: city("Sidon", "A city on the coast"),
  joppa: city("Joppa", "Jonah's flight & Peter's vision"),
  caesarea: city("Caesarea", "Cornelius & Paul's hearings"),
  troas: city("Troas", "A call toward Macedonia"),
  puteoli: city("Puteoli", "Paul arrives in Italy"),
  kedesh: city("Kedesh", "Refuge in Galilee"),
  bezer: city("Bezer", "Refuge in Reuben"),
  ramoth: city("Ramoth-gilead", "Refuge in Gilead"),
  golan: city("Golan", "Refuge in Bashan"),
  ur: city("Ur", "Ancestral origins"),
  haran: city("Haran", "Family, departure & promise"),
  pithom: city("Pithom", "Store city & forced labor"),
  rameses: city("Rameses", "Labor & departure"),
  // The Exodus Succoth in Egypt, not the Succoth by the Jordan (the more often named place of that name).
  succoth: city("Succoth", "The first encampment from Rameses", "Succoth", "aa28709"),
  sodom: city("Sodom", "Judgment & Lot's rescue"),
  gomorrah: city("Gomorrah", "A city of the plain"),
  zoar: city("Zoar", "Spared at Lot's request"),
  chorazin: city("Chorazin", "Witness without repentance"),
} satisfies Record<string, Omit<CityChoice, "id">>;

const choices = (...ids: (keyof typeof CITIES)[]): CityChoice[] => ids.map((id) => ({ id, ...CITIES[id] }));

export const CITY_COLLECTIONS = [
  {
    id: "seven-churches", title: "The Seven Churches", subtitle: "Letters, witness & endurance", icon: Church, color: "gospels",
    description: "Seven cities in Roman Asia, seven messages in Revelation. Explore the setting of each church and the call addressed to it.",
    passage: { label: "Revelation 1:11", path: "/read/kjv/REV/1?hl=11" },
    cities: choices("ephesus", "smyrna", "pergamum", "thyatira", "sardis", "philadelphia", "laodicea"),
  },
  {
    id: "israel-judah", title: "Ancient Israel & Judah", subtitle: "Covenant, worship & kingdom", icon: Crown, color: "history",
    description: "Cities and towns in the story of Israel and Judah: ancestral promises, places of worship, royal capitals, and the consequences of divided loyalties.",
    passage: { label: "2 Samuel 5:1–10", path: "/read/kjv/2SA/5?hl=1-10" },
    cities: choices("jerusalem", "hebron", "shechem", "samaria", "bethel", "shiloh", "beersheba", "bethlehem"),
  },
  {
    id: "gospel-places", title: "Where Jesus Walked", subtitle: "Towns & cities of the Gospels", icon: Footprints, color: "accent",
    description: "Follow the Gospel accounts into homes, streets, synagogues, and the temple. Discover how each setting helps you read an encounter more closely.",
    passage: { label: "Matthew 4:12–17", path: "/read/kjv/MAT/4?hl=12-17" },
    cities: choices("bethlehem", "nazareth", "cana", "capernaum", "bethsaida", "jericho", "bethany", "jerusalem"),
  },
  {
    id: "apostolic-cities", title: "Cities of the Apostles", subtitle: "Acts, letters & new communities", icon: ScrollText, color: "poetry",
    description: "Trace the spread of the gospel through the cities of Acts and the letters. Connect local encounters with the communities that received the message.",
    passage: { label: "Acts 13:1–3", path: "/read/kjv/ACT/13?hl=1-3" },
    cities: choices("antioch", "philippi", "thessalonica", "athens", "corinth", "ephesus", "lystra", "rome"),
  },
  {
    id: "pagan-cities", title: "The Pagan World", subtitle: "Temples, idols & encounters", icon: Sun, color: "epistles",
    description: "Explore cities through their encounters with other gods and cults in Scripture. This lens describes particular settings, not every inhabitant or every era of a city's life.",
    passage: { label: "Acts 17:16–34", path: "/read/kjv/ACT/17?hl=16-34" },
    cities: choices("athens", "ephesus", "lystra", "corinth", "babylon", "nineveh", "sidon"),
  },
  {
    id: "empires-exile", title: "Empires & Exile", subtitle: "Power, displacement & faithfulness", icon: Landmark, color: "prophets",
    description: "Enter the cities of imperial and regional power. Read stories of conquest, exile, courage, and faithfulness alongside the rulers and courts in their setting.",
    passage: { label: "Daniel 1:1–7", path: "/read/kjv/DAN/1?hl=1-7" },
    cities: choices("babylon", "nineveh", "susa", "damascus", "rome", "jerusalem"),
  },
  {
    id: "ports-trade", title: "Ports & Trade", subtitle: "Sea routes, commerce & crossings", icon: Ship, color: "poetry",
    description: "See how coastlines connected the biblical world. Explore the ports where merchants traded, travelers embarked, and the gospel crossed into new regions.",
    passage: { label: "Acts 28:11–15", path: "/read/kjv/ACT/28?hl=11-15" },
    cities: choices("tyre", "sidon", "joppa", "caesarea", "troas", "puteoli"),
  },
  {
    id: "cities-refuge", title: "Cities of Refuge", subtitle: "Justice, protection & due process", icon: ShieldCheck, color: "accent",
    description: "The six cities named in Joshua 20 offered protection for someone accused of an unintentional killing while the case was heard. Explore their geography and purpose.",
    passage: { label: "Joshua 20:1–9", path: "/read/kjv/JOS/20?hl=1-9" },
    cities: choices("kedesh", "shechem", "hebron", "bezer", "ramoth", "golan"),
  },
  {
    id: "patriarchs", title: "Patriarchs & Promises", subtitle: "Places of covenant & belonging", icon: Tent, color: "history",
    description: "Enter the places associated with Abraham, Isaac, Jacob, and their households. Explore the local stories of family, wells, altars, and promise; follow their movement between places in Journeys.",
    passage: { label: "Genesis 12:1–9", path: "/read/kjv/GEN/12?hl=1-9" },
    cities: choices("ur", "haran", "shechem", "bethel", "hebron", "beersheba"),
  },
  {
    id: "egypt-exodus", title: "Egypt & the Exodus", subtitle: "Oppression, departure & deliverance", icon: Waves, color: "poetry",
    description: "Begin with the store cities named in Exodus and the first encampment after departure. Explore each place in the biblical account; the unfolding wilderness itinerary belongs in Journeys. Ancient site identifications remain a separate question.",
    passage: { label: "Exodus 1:8–14", path: "/read/kjv/EXO/1?hl=8-14" },
    cities: choices("pithom", "rameses", "succoth"),
  },
  {
    id: "warned-spared", title: "Cities Warned & Spared", subtitle: "Judgment, repentance & mercy", icon: Bell, color: "revelation",
    description: "How does a community respond to God? Read Nineveh's repentance, the destruction of Sodom and Gomorrah, Zoar's reprieve, and Jesus' warnings and comparisons. Each city keeps its own setting and outcome.",
    passage: { label: "Matthew 11:20–24", path: "/read/kjv/MAT/11?hl=20-24" },
    cities: choices("nineveh", "sodom", "gomorrah", "zoar", "chorazin", "bethsaida", "capernaum", "tyre", "sidon"),
  },
];
