/** What opens when a city is chosen: the church addressed there (with its passage) and the city itself. */
export interface CityDetail { churchTitle: string; church: string; city: string; passage: { label: string; path: string } }

// Summaries of each letter in Revelation 2–3 and the city's well-attested setting; quotations follow the KJV.
export const CITY_DETAILS: Record<string, CityDetail> = {
  ephesus: {
    churchTitle: "The church in Ephesus", passage: { label: "Revelation 2:1–7", path: "/read/kjv/REV/2?hl=1-7" },
    church: "Christ commends the church's hard work, its endurance, and its refusal to tolerate false apostles. Yet it has left its first love, and he calls it to remember, repent and do the first works.",
    city: "A leading port and the largest city of Roman Asia, home to the great temple of Artemis. Paul taught here for more than two years, and the silversmiths' riot filled its theatre (Acts 19).",
  },
  smyrna: {
    churchTitle: "The church in Smyrna", passage: { label: "Revelation 2:8–11", path: "/read/kjv/REV/2?hl=8-11" },
    church: "Christ knows its tribulation and poverty, yet calls it rich. He tells it not to fear the suffering to come: \"Be thou faithful unto death, and I will give thee a crown of life.\" No rebuke is given.",
    city: "A wealthy harbour city north of Ephesus and an early centre of emperor worship; today's İzmir. Its bishop Polycarp was martyred here in the second century.",
  },
  pergamum: {
    churchTitle: "The church in Pergamos", passage: { label: "Revelation 2:12–17", path: "/read/kjv/REV/2?hl=12-17" },
    church: "It holds fast Christ's name where \"Satan's seat is\", even after the death of his faithful witness Antipas. But it tolerates some who hold the teaching of Balaam and of the Nicolaitans.",
    city: "A former royal capital on a high acropolis, with a great altar of Zeus, a renowned sanctuary of Asclepius and one of the ancient world's great libraries.",
  },
  thyatira: {
    churchTitle: "The church in Thyatira", passage: { label: "Revelation 2:18–29", path: "/read/kjv/REV/2?hl=18-29" },
    church: "Praised for its love, service, faith and patience, its last works more than the first. Yet it allows \"that woman Jezebel\", who leads Christ's servants into immorality and idolatry.",
    city: "An inland city known for its trade guilds, among them the dyers. Lydia, the seller of purple whom Paul met at Philippi, came from here (Acts 16:14).",
  },
  sardis: {
    churchTitle: "The church in Sardis", passage: { label: "Revelation 3:1–6", path: "/read/kjv/REV/3?hl=1-6" },
    church: "It has a name that it lives, but is dead. It must watch, strengthen what remains and repent. A few there have not defiled their garments and will walk with Christ in white.",
    city: "The old capital of the kingdom of Lydia, famed for its wealth and for a citadel thought impregnable that still fell by surprise. An earthquake badly damaged it in AD 17.",
  },
  philadelphia: {
    churchTitle: "The church in Philadelphia", passage: { label: "Revelation 3:7–13", path: "/read/kjv/REV/3?hl=7-13" },
    church: "It has little strength, yet it has kept Christ's word and not denied his name. Before it he sets an open door that no one can shut. No rebuke is given.",
    city: "A younger city on the road east into the interior, shaken again and again by earthquakes, including the great one of AD 17.",
  },
  laodicea: {
    churchTitle: "The church of the Laodiceans", passage: { label: "Revelation 3:14–22", path: "/read/kjv/REV/3?hl=14-22" },
    church: "Neither cold nor hot, but lukewarm. It says \"I am rich\", yet is \"wretched, and miserable, and poor, and blind, and naked\". It is counselled to buy from Christ gold, white raiment and eyesalve.",
    city: "A prosperous banking and textile city in the Lycus valley, known for its black wool and a school of medicine; its water arrived by aqueduct. Paul mentions the church there (Colossians 4:16).",
  },
};
