export const PORTRAIT_GOSPELS = [
  { key: "MAT", name: "Matthew", color: "var(--gospels)" },
  { key: "MRK", name: "Mark", color: "var(--history)" },
  { key: "LUK", name: "Luke", color: "var(--poetry)" },
  { key: "JHN", name: "John", color: "var(--epistles)" },
] as const;

export type PortraitGospel = (typeof PORTRAIT_GOSPELS)[number]["key"];
export interface GospelPortrait {
  event: string;
  title: string;
  question: string;
  invitation: string;
  observations: Partial<Record<PortraitGospel, string>>;
}

/** Original reading prompts, checked against the cited KJV passages; event boundaries are Robertson's. */
export const GOSPEL_PORTRAITS: GospelPortrait[] = [
  {
    event: "24", title: "At the Jordan", question: "How does the ministry begin?",
    invitation: "Read the words and actions around the baptism. Notice who speaks, what Jesus is doing, and what comes next in each account.",
    observations: {
      MAT: "Matthew includes John's objection and Jesus' answer about fulfilling righteousness (3:14–15).",
      MRK: "Mark moves directly from Jesus' arrival and baptism to the opened heavens, the Spirit and the heavenly voice (1:9–11).",
      LUK: "Luke says Jesus was praying, then moves toward his age and genealogy (3:21–23).",
    },
  },
  {
    event: "25", title: "In the wilderness", question: "What does each account choose to tell?",
    invitation: "Compare the length and sequence of these passages. Matthew and Luke narrate the temptations in different orders; Mark gives a brief account.",
    observations: {
      MAT: "After the temptation concerning bread, Matthew places the temple scene before the mountain and kingdoms (4:3–10).",
      MRK: "Two verses mention the Spirit, forty days, Satan, wild beasts and ministering angels (1:12–13).",
      LUK: "After bread and the kingdoms, Luke ends the sequence of temptations at the temple in Jerusalem (4:3–12).",
    },
  },
  {
    event: "72", title: "Bread for the crowd", question: "One meal. What does each Gospel bring into view?",
    invitation: "Begin before the food is distributed. Compare how the crowd is received and how the disciples enter the conversation.",
    observations: {
      MAT: "Jesus has compassion on the crowd and heals their sick before the disciples raise the question of food (14:14–15).",
      MRK: "The returning apostles seek rest; Jesus sees the crowd as sheep without a shepherd and teaches them (6:30–34).",
      LUK: "Jesus receives the crowd, speaks of God's kingdom and heals those in need (9:11).",
      JHN: "John places the meal near Passover and names Philip and Andrew; a boy has five barley loaves and two fish (6:4–9).",
    },
  },
  {
    event: "85", title: "On the mountain", question: "What surrounds the revelation of glory?",
    invitation: "Read the shared scene alongside the details each narrator develops. Follow the conversation, the disciples' response and Jesus' actions.",
    observations: {
      MAT: "The disciples fall on their faces in fear; Jesus touches them and tells them not to be afraid (17:6–7).",
      MRK: "Mark explains Peter's suggestion by saying he did not know what to say, because they were afraid (9:5–6).",
      LUK: "Jesus goes up to pray. Moses and Elijah speak of his coming departure, to be accomplished at Jerusalem (9:28–31).",
    },
  },
  {
    event: "128b", title: "Entering Jerusalem", question: "How is Jesus received by the city?",
    invitation: "Read the entry in each Gospel's setting. Robertson also groups Matthew's temple healings with this event; the separate passage blocks make that choice visible.",
    observations: {
      MAT: "The city asks who Jesus is. The grouped passages also include healings and children crying out in the temple (21:10–11, 14–17).",
      MRK: "The account ends with Jesus looking around the temple and returning to Bethany because it is evening (11:11).",
      LUK: "Alongside the public praise, Luke records Jesus weeping over Jerusalem (19:37–44).",
      JHN: "John looks back from the disciples' later understanding: they remembered these things after Jesus was glorified (12:16).",
    },
  },
  {
    event: "141", title: "The costly anointing", question: "Where does the account place this act of devotion?",
    invitation: "Watch the markers on the map: John places the anointing before the entry into Jerusalem; Matthew and Mark narrate it later. Compare their narrative arrangements without turning the diagram into a calendar.",
    observations: {
      MAT: "The disciples object to the expense; Jesus interprets the act in relation to his burial (26:8–12).",
      MRK: "Jesus defends the woman's action and speaks of her anointing his body beforehand for burial (14:6–9).",
      JHN: "John names Mary, describes her anointing Jesus' feet, and identifies Judas as the objector (12:3–8).",
    },
  },
  {
    event: "167", title: "Laid in the tomb", question: "Who acts after Jesus' death?",
    invitation: "Follow the people who request, prepare and bury the body. The different passage lengths reflect the boundaries of this harmony entry.",
    observations: {
      MAT: "Matthew identifies Joseph as a rich man and a disciple, and describes his own new tomb (27:57–60).",
      MRK: "Joseph approaches Pilate boldly; Pilate checks Jesus' death with the centurion (15:43–45).",
      LUK: "Luke says Joseph had not consented to the council's decision and action (23:50–51).",
      JHN: "Nicodemus joins Joseph and brings myrrh and aloes for the burial (19:38–40).",
    },
  },
  {
    event: "171", title: "At the empty tomb", question: "How does the discovery unfold?",
    invitation: "Compare discovery, message and response. This harmony entry includes only John 20:1; use Read the chapter in context to follow John's unfolding account, or explore the following harmony entries.",
    observations: {
      MAT: "The women leave with fear and great joy and run to tell the disciples (28:8).",
      MRK: "This selected passage ends with the women trembling, amazed and afraid (16:8).",
      LUK: "The women are reminded of Jesus' earlier words, and they remember them (24:6–8).",
      JHN: "Mary Magdalene finds the stone removed while it is still dark. Read onward for her report and the disciples' visit (20:1–10).",
    },
  },
];
