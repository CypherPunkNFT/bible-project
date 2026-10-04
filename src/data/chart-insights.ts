import type { Span } from "@/lib/study";
import type { SectionId } from "@/lib/types";

export interface PassageEntry { title: string; refs: Span[] }

/** An editorial reading selection, not an exhaustive census or a claim about fulfilled predictions. */
export const PROPHECY_PASSAGES: PassageEntry[] = [
  { title: "A blessing for all families", refs: [[1012001, 1012003]] },
  { title: "A star out of Jacob", refs: [[4024015, 4024019]] },
  { title: "A prophet like Moses", refs: [[5018015, 5018019]] },
  { title: "An enduring house and kingdom", refs: [[10007012, 10007016]] },
  { title: "The nations remember the Lord", refs: [[19022027, 19022031]] },
  { title: "A king and priest", refs: [[19110001, 19110007]] },
  { title: "Swords into ploughshares", refs: [[23002001, 23002005]] },
  { title: "A child and a kingdom of peace", refs: [[23009001, 23009007]] },
  { title: "The suffering servant", refs: [[23052013, 23053012]] },
  { title: "A new covenant", refs: [[24031031, 24031034]] },
  { title: "A new heart and a new spirit", refs: [[26036024, 26036028]] },
  { title: "The Son of man receives a kingdom", refs: [[27007009, 27007014]] },
  { title: "The Spirit poured out", refs: [[29002028, 29002032]] },
  { title: "A ruler from Bethlehem", refs: [[33005002, 33005005]] },
  { title: "Your king comes in humility", refs: [[38009009, 38009010]] },
  { title: "Jesus foretells his death and resurrection", refs: [[40016021, 40016023]] },
  { title: "The temple and the coming of the Son of man", refs: [[40024001, 40024035]] },
  { title: "Witnesses to the ends of the earth", refs: [[44001006, 44001011]] },
  { title: "The Lord's coming and the resurrection", refs: [[52004013, 52004018]] },
  { title: "New heavens and a new earth", refs: [[61003008, 61003013]] },
  { title: "God dwells with his people", refs: [[66021001, 66021008]] },
];

export const SECTION_INSIGHTS: Partial<Record<SectionId, { why: string; read: string; thread: string; ref: Span }>> = {
  history: { why: "Called History because these books carry the story from creation to Israel's return from exile. This broad reading band includes the Torah: narrative, law, covenant and genealogy sit together.", read: "Notice repeated choices and their consequences. A story can show a person's failure without endorsing it; laws and speeches need their place in the covenant story.", thread: "God forms a people through whom all families of the earth will be blessed.", ref: [1012001, 1012003] },
  poetry: { why: "Poetry & Wisdom brings together prayer, song, dialogue, proverbs and reflection. These books give language to worship, suffering, love and the search for a faithful life.", read: "Read paired lines together: the second may echo, intensify or challenge the first. A proverb offers wisdom for discernment; Job and Ecclesiastes resist easy formulas.", thread: "Faith speaks honestly to God, including when life does not make sense.", ref: [19013001, 19013006] },
  prophets: { why: "Prophets are called to speak God's message into the life of his people. Their books weave warning, accusation, lament and hope; prophecy includes far more than forecasting.", read: "Ask who is addressed and what covenant failure is named. Attend to poetic images, justice, exile and restoration before treating an oracle as a timetable.", thread: "Judgment and mercy meet in the promise of a renewed covenant and transformed hearts.", ref: [24031031, 24031034] },
  gospels: { why: "Gospel means good news. Four accounts tell of Jesus' life, death and resurrection; Acts follows the risen Jesus' witnesses as the message crosses borders.", read: "Read each account as a whole, then compare shared scenes. Differences of emphasis help reveal what each author wants the reader to notice.", thread: "The story centres on Jesus and opens outward toward every nation.", ref: [42024044, 42024049] },
  epistles: { why: "Epistles are letters addressed to communities and individuals. Their teaching answers concrete questions about belief, worship, conflict, suffering and life together.", read: "Follow the argument through the whole paragraph. Ask who is speaking, to whom, and why; connect instructions with the good news that grounds them.", thread: "What God has done in Christ takes shape in a people's shared life of love.", ref: [49004001, 49004006] },
  revelation: { why: "Revelation names an unveiling. This book combines a letter to seven churches, prophecy and apocalyptic visions rich in images drawn from earlier Scripture.", read: "Trace the symbols' scriptural echoes and listen to the churches' situation. Its visions call readers to endurance, worship and hope.", thread: "The Lamb's victory leads toward God dwelling with his people and the healing of creation.", ref: [66021001, 66021005] },
};

export const TEACHINGS: (PassageEntry & { theme: string; invitation: string; notice: string })[] = [
  { theme: "The kingdom", title: "Who is called blessed?", invitation: "Jesus turns our expectations of the good life upside down.", notice: "Matthew names poverty of spirit and hunger for righteousness; Luke addresses the poor and hungry directly. Read each setting before drawing the accounts together.", refs: [[40005003, 40005012], [42006020, 42006026]] },
  { theme: "Prayer", title: "Teach us to pray.", invitation: "Begin with the Father; bring daily bread, forgiveness and dependence into the same prayer.", notice: "Matthew places this prayer within teaching about public piety. Luke begins with a disciple's request and continues with persistence in asking.", refs: [[40006009, 40006015], [42011001, 42011013]] },
  { theme: "Mercy", title: "Who became a neighbour?", invitation: "A question about the limits of obligation becomes a call to active compassion.", notice: "Follow the movement from seeing to acting. At the end, Jesus asks who became a neighbour, then tells the questioner to do likewise.", refs: [[42010025, 42010037]] },
  { theme: "Parables", title: "The joy of finding the lost.", invitation: "One sheep matters; restoration is a reason to rejoice.", notice: "Matthew's setting concerns the little ones. Luke's setting answers criticism of Jesus welcoming sinners. The shared image serves each conversation.", refs: [[40018010, 40018014], [42015001, 42015007]] },
  { theme: "Love", title: "The heart of the commandments.", invitation: "Love for God and love for neighbour belong together.", notice: "Jesus joins Deuteronomy 6:5 and Leviticus 19:18. Mark continues with the scribe's response; Matthew stresses the Law and the Prophets.", refs: [[40022034, 40022040], [41012028, 41012034]] },
  { theme: "Abiding", title: "The vine and its branches.", invitation: "Fruitfulness grows from remaining in Christ.", notice: "Watch how abiding, love, obedience and joy belong to the same passage. The vine is an image of relationship and dependence.", refs: [[43015001, 43015012]] },
  { theme: "Forgiveness", title: "A father runs to meet his son.", invitation: "The welcome of the father exposes the resentment of the elder brother.", notice: "Read both sons' stories. The ending leaves the elder brother with an invitation to enter the celebration.", refs: [[42015011, 42015032]] },
  { theme: "Watchfulness", title: "Stay awake. Keep watch.", invitation: "Uncertainty about the hour becomes a call to faithful readiness.", notice: "The point of these closing warnings is watchfulness. Read them within each Gospel's larger discourse about the temple and the coming of the Son of man.", refs: [[40024036, 40024044], [41013032, 41013037], [42021034, 42021036]] },
];
