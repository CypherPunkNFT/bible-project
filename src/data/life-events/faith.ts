// Faith: new believer, baptism, ordination, sending a missionary. Notes written for each event (design 4.2–4.4).
import { p, type LifeEvent } from "./types";

const JOSHUA_CONTEXT =
  "Said to Joshua as he led Israel into the land; the courage it calls for rests on God's presence, which the New Testament promises to every believer (Matthew 28:20).";

export const FAITH_EVENTS: LifeEvent[] = [
  {
    slug: "new-believer",
    family: "faith",
    heading: "Bible Verses for a New Christian",
    short: "New believer",
    intro:
      "These Bible verses for a new Christian are for someone who has just trusted in Jesus Christ, and for the friend, parent or church member who wants to encourage them. The readings explain what has happened: saved by grace through faith, held in the Good Shepherd's hand, given eternal life. The short verses are for a card or a Bible's flyleaf. Each passage is in the Berean Standard Bible, with a line on why it matters at the start of the Christian life.",
    passages: [
      p("EPH 2:8-10", "reading", "Saved by grace through faith, not by works, and made for the good works God prepared."),
      p("JHN 10:27-29", "reading", "Christ's sheep hear his voice, and no one can snatch them out of his hand or the Father's."),
      p("1JN 5:11-13", "reading", "Written so that those who believe may know that they have eternal life."),
      p("JHN 3:3", "card", "Jesus on being born again, the new beginning every believer has had."),
      p("JHN 3:16", "card", "The gospel in one verse, for the day someone first believes it."),
      p("2CO 5:17", "card", "In Christ, a new creation: the old has passed away."),
      p("ROM 10:9-10", "card", "Confessing Jesus as Lord and believing God raised him from the dead."),
      p("LUK 15:7", "card", "Heaven's joy over one sinner who repents."),
      p("PHP 1:6", "card", "God will finish the good work he has begun."),
      p("ROM 8:1", "card", "No condemnation for those who are in Christ Jesus."),
      p("1PE 2:2", "card", "Like a newborn, crave the pure milk of God's word and grow."),
      p("PSA 40:2-3", "card", "Lifted from the pit, set on a rock, with a new song to sing."),
    ],
    card: { heading: "Welcome to the family of God", inside: "Rejoicing with you, and praying for you as you grow in Christ.", names: 1, date: false, ornament: "sunrise" },
    topics: [{ slug: "new-birth", title: "The New Birth" }, { slug: "regeneration", title: "Regeneration" }, { slug: "salvation", title: "Salvation" }],
    related: ["baptism", "missionary"],
  },
  {
    slug: "baptism",
    family: "faith",
    heading: "Bible Verses for Baptism",
    short: "Baptism",
    intro:
      "These Bible verses for baptism are for a believer being baptized, and for the church and family celebrating with them. Baptism is how a person who has trusted in Christ confesses him in public, and the readings show what it pictures: dying to the old life, being raised to walk in a new one, belonging to Christ. There are readings for the service, short verses for a card, and honest notes on two passages that are often misread. Each is in the Berean Standard Bible.",
    passages: [
      p("MAT 28:18-20", "reading", "The Great Commission: make disciples, baptize them, and teach them to obey."),
      p("ROM 6:3-4", "reading", "Buried with Christ through baptism and raised to walk in newness of life: what immersion pictures."),
      p("ACT 2:38-41", "reading", "The first Christian baptisms at Pentecost: about three thousand who embraced the message.", {
        context: "Forgiveness comes to those who repent and trust in Jesus' name; baptism is how they confessed him in public. It is \"those who embraced his message\" who were baptized (2:41), which is why Baptists baptize believers.",
      }),
      p("ACT 8:35-38", "reading", "Philip tells the Ethiopian the good news, and the eunuch, believing, is baptized on the road.", { skip: [37] }),
      p("MAT 3:13-17", "reading", "Jesus himself is baptized, and the Father speaks his delight in the Son."),
      p("1PE 3:21", "reading", "What baptism means and what it does not.", {
        context: "The water \"symbolizes\" the baptism that saves, which Peter says is \"not the removal of dirt from the body, but the pledge of a clear conscience toward God\", and it saves \"through the resurrection of Jesus Christ\": baptism pictures the salvation faith receives.",
      }),
      p("ACT 16:30-34", "reading", "The jailer asks what he must do to be saved, believes, and is baptized that night with his believing household."),
      p("GAL 3:26-27", "card", "All who were baptized into Christ have clothed themselves with Christ."),
      p("COL 2:12", "card", "Buried with him in baptism, raised with him through faith."),
      p("2CO 5:17", "card", "A new creation in Christ, the life baptism announces."),
      p("GAL 2:20", "card", "Crucified with Christ, and now Christ lives in me."),
      p("ROM 6:4", "card", "Raised to walk in newness of life."),
    ],
    card: { heading: "On your baptism", inside: "Rejoicing with you as you follow Christ in baptism.", names: 1, date: true, ornament: "water" },
    topics: [{ slug: "baptism", title: "Baptism" }, { slug: "new-birth", title: "The New Birth" }, { slug: "regeneration", title: "Regeneration" }],
    related: ["new-believer", "baby-dedication"],
  },
  {
    slug: "ordination",
    family: "faith",
    heading: "Bible Verses for an Ordination",
    short: "Ordination of a pastor or deacon",
    intro:
      "These Bible verses for an ordination are for the service at which a church recognizes a pastor or a deacon, and for the cards and gifts that mark the day. The readings set out the qualifications and charge of each office, from Paul's letters to Timothy and Titus and from the choosing of the Seven in Acts. The short verses suit a card for the one being ordained. Each passage is in the Berean Standard Bible, with a line on why it belongs at an ordination.",
    explainer: {
      title: "What ordination is in a Baptist church",
      text: "In a Baptist church, ordination is the congregation's recognition, by the laying on of hands, of a calling God has already given (Acts 13:3; 1 Timothy 4:14). It does not give a minister a different standing before God. The office of pastor is limited to men, as Scripture qualifies it. Deacons are servants the congregation recognizes for its practical and caring work (Acts 6:3–6); the readings for deacons are given as Scripture sets them out.",
    },
    passages: [
      p("1TI 3:1-7", "reading", "The qualifications of an overseer, read so the church and the pastor both hear them."),
      p("TIT 1:5-9", "reading", "An elder who holds firmly to the trustworthy word, able to encourage and to correct."),
      p("2TI 4:1-5", "reading", "Paul's solemn charge: preach the word, in season and out of season."),
      p("1PE 5:1-4", "reading", "Shepherd God's flock willingly, as examples, awaiting the Chief Shepherd."),
      p("ACT 13:2-3", "reading", "The church at Antioch fasts, prays and lays hands on those the Spirit has called."),
      p("1TI 4:14-16", "reading", "Do not neglect the gift given by the laying on of hands; watch your life and doctrine."),
      p("ACT 6:1-6", "reading", "The church chooses seven servants, and the apostles pray and lay hands on them.", { group: "For deacons" }),
      p("1TI 3:8-13", "reading", "The qualifications of deacons, and the good standing gained by those who serve well.", { group: "For deacons" }),
      p("ACT 20:28", "card", "Keep watch over the flock God bought with his own blood."),
      p("JER 3:15", "card", "Shepherds after God's own heart, who feed his people with knowledge."),
      p("2TI 2:15", "card", "A worker who correctly handles the word of truth."),
      p("ISA 6:8", "card", "\"Here am I. Send me!\": the answer to a call."),
      p("EPH 4:11-12", "card", "Christ's gift of pastors and teachers to equip the saints for ministry."),
    ],
    card: { heading: "On your ordination", inside: "Thanking God for his call on your life, and praying for your ministry.", names: 1, date: true, ornament: "lamp" },
    topics: [{ slug: "ordination", title: "Ordination" }, { slug: "minister-christian", title: "Christian Minister" }, { slug: "pastor", title: "Pastor" }, { slug: "deacon", title: "Deacon" }],
    related: ["missionary", "baptism"],
  },
  {
    slug: "missionary",
    family: "faith",
    heading: "Bible Verses for Missionaries",
    short: "Sending a missionary",
    intro:
      "These Bible verses for missionaries are for the day a church commissions and sends out one of its own, and for the cards, prayers and farewells that go with them. The readings carry the Great Commission and the sending of Paul and Barnabas; the short verses are for a card to pack in a suitcase; and Aaron's blessing sends them on their way. Each passage is in the Berean Standard Bible, with a line on why it fits a sending.",
    passages: [
      p("MAT 28:18-20", "reading", "The Great Commission, with Christ's promise to be with his people always."),
      p("ACT 13:2-3", "reading", "The first sending: the church prays, lays hands on Barnabas and Saul, and sends them off."),
      p("ROM 10:14-15", "reading", "How will they hear without someone sent? Beautiful are the feet of those who bring good news."),
      p("3JN 1:6-8", "reading", "Send them on their way in a manner worthy of God: the church's part in every mission."),
      p("ACT 1:8", "card", "Witnesses to the ends of the earth, in the Spirit's power."),
      p("ISA 6:8", "card", "Isaiah's answer, \"Here am I. Send me!\", for one who has said the same."),
      p("ISA 52:7", "card", "How beautiful the feet of those who bring good news."),
      p("PSA 96:3", "card", "Declare his glory among the nations."),
      p("JOS 1:9", "card", "Be strong and courageous: the Lord goes with you wherever you go.", { context: JOSHUA_CONTEXT }),
      p("2CO 5:20", "card", "Ambassadors for Christ, pleading for others to be reconciled to God."),
      p("ACT 20:24", "card", "Finishing the race and testifying to the gospel of God's grace."),
      p("PSA 139:9-10", "card", "Even at the far side of the sea, his hand will guide and hold."),
      p("NUM 6:24-26", "blessing", "Aaron's blessing, to send the missionary out with."),
    ],
    card: { heading: "Go with God", inside: "Sending you with our love and our prayers.", names: 1, date: false, ornament: "path" },
    topics: [{ slug: "missions", title: "Missions" }, { slug: "minister-christian", title: "Christian Minister" }],
    related: ["ordination", "new-believer"],
  },
];
