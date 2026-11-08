// The funeral readings page (design 4.2, 5.6): 47 passages grouped by where a service commonly uses them. Baptist churches
// have no fixed funeral service, so this is a suggestion for the family and pastor to change freely; no liturgy is invented.
import { HOPE_WITH_GRIEF } from "./family";
import { sp, type ServicePart, type SympathyPassage } from "./types";

export const FUNERAL_PATH_SLUG = "funeral-readings";

export const FUNERAL_HEADING = "Bible Readings for a Funeral";
export const FUNERAL_INTRO =
  "These Bible readings for a funeral are arranged in the order a service often uses them: opening words, psalms and Old Testament readings, New Testament readings, words at the graveside, and a closing blessing. The order is only a suggestion; the family and the pastor shape the service. Tick the readings you would like, put them in order, and print a large-type sheet for the readers, or send the list to your pastor. Every reading is in the Berean Standard Bible.";

export const SERVICE_PARTS: { id: ServicePart; title: string; what: string }[] = [
  { id: "opening", title: "Opening words", what: "Spoken as the service begins." },
  { id: "old-testament", title: "Psalms and Old Testament", what: "Read by family or friends, or by the pastor." },
  { id: "new-testament", title: "New Testament", what: "Often read just before the message." },
  { id: "graveside", title: "At the graveside", what: "Short words for the burial or committal." },
  { id: "blessing", title: "Closing blessing", what: "Spoken over everyone as the service ends." },
];

const opening = (reference: string, note: string, extras: { part?: string; believer?: boolean } = {}) =>
  sp(reference, "reading", note, { ...extras, servicePart: "opening" });
const oldTestament = (reference: string, note: string, context?: string) => sp(reference, "reading", note, { context, servicePart: "old-testament" });
const newTestament = (reference: string, note: string, extras: { believer?: boolean; context?: string } = {}) =>
  sp(reference, "reading", note, { ...extras, servicePart: "new-testament" });
const graveside = (reference: string, note: string, extras: { part?: string; believer?: boolean; context?: string } = {}) =>
  sp(reference, "reading", note, { ...extras, servicePart: "graveside" });
const blessing = (reference: string, note: string) => sp(reference, "blessing", note, { servicePart: "blessing" });

export const FUNERAL_READINGS: SympathyPassage[] = [
  opening("JHN 11:25b", "Jesus's words to Martha at her brother's grave, the traditional opening of a Christian funeral.",
    { part: "I am the resurrection and the life. Whoever believes in Me will live, even though he dies." }),
  opening("DEU 33:27a", "The everlasting arms underneath all who gather.", { part: "The eternal God is your dwelling place, and underneath are the everlasting arms." }),
  opening("LAM 3:22-23", "Mercies new every morning: faithfulness spoken into grief."),
  opening("PSA 46:1", "God our refuge and strength, ever present in trouble."),
  opening("MAT 5:4", "Jesus's blessing on those who mourn."),
  opening("2CO 1:3-4", "The God of all comfort, who comforts us in every trouble."),
  opening("JOB 19:25", "I know that my Redeemer lives: Job's confession from the depths."),
  opening("PSA 121:1-2", "Lifting our eyes to the hills: our help comes from the LORD."),
  opening("ROM 14:8", "Whether we live or die, we belong to the Lord.", { believer: true }),
  oldTestament("PSA 23:1-6", "The shepherd psalm, the reading most often chosen for a funeral."),
  oldTestament("PSA 90:1-12", "God our dwelling place in every generation, and the brevity of life.",
    "Moses' psalm, read at funerals for centuries because it is honest about how short life is and ends in prayer: \"teach us to number our days\"."),
  oldTestament("PSA 121:1-8", "The LORD who watches over your coming and going, now and forevermore."),
  oldTestament("PSA 46:1-11", "God our refuge when the earth gives way. Be still, and know."),
  oldTestament("PSA 139:1-12", "God knows each of us completely, and no darkness hides anyone from him."),
  oldTestament("PSA 103:8-18", "Our days are like grass, but the LORD's loving devotion is from everlasting to everlasting."),
  oldTestament("ECC 3:1-11", "A time for everything, a time to be born and a time to die.",
    "A poem on every season of life, hard ones included; it ends with God who \"has set eternity in the hearts of men\"."),
  oldTestament("ISA 25:6-9", "The feast on the mountain, where God swallows up death and wipes away every tear."),
  oldTestament("ISA 40:28-31", "The everlasting God who gives strength to the weary."),
  oldTestament("LAM 3:22-26", "The LORD's mercies never fail; it is good to wait quietly for him."),
  oldTestament("JOB 19:25-27", "I know that my Redeemer lives, and in my flesh I will see God."),
  newTestament("JHN 14:1-6", "Do not let your hearts be troubled: Jesus the way, the truth and the life."),
  newTestament("JHN 11:17-27", "Jesus with Martha after her brother's death: I am the resurrection and the life."),
  newTestament("JHN 6:37-40", "Everyone the Father gives to Jesus will come to him, and he will raise them up at the last day."),
  newTestament("ROM 8:31-39", "If God is for us, who can be against us? Nothing can separate us from his love."),
  newTestament("ROM 14:7-9", "None of us lives or dies to himself; Christ is Lord of the dead and the living."),
  newTestament("1CO 15:20-26", "Christ the firstfruits of those who have fallen asleep; the last enemy to be destroyed is death."),
  newTestament("1CO 15:51-57", "Death is swallowed up in victory, through our Lord Jesus Christ."),
  newTestament("2CO 4:16-18", "We do not lose heart: what is seen is temporary, what is unseen is eternal."),
  newTestament("2CO 5:1-8", "A building from God, eternal in the heavens.", { believer: true }),
  newTestament("1TH 4:13-18", "Grieving with hope, and the Lord's coming for his people.", { believer: true, context: HOPE_WITH_GRIEF }),
  newTestament("PHP 3:20-21", "Our citizenship is in heaven, and Christ will transform our lowly bodies."),
  newTestament("2TI 4:6-8", "The good fight fought, the race finished, the faith kept.", { believer: true }),
  newTestament("REV 7:13-17", "The Lamb will be their shepherd, and God will wipe away every tear."),
  newTestament("REV 21:1-7", "A new heaven and a new earth, where death will be no more."),
  graveside("JHN 11:25-26", "I am the resurrection and the life: words to stand on beside the grave."),
  graveside("1CO 15:42-44", "Sown perishable, raised imperishable.", { believer: true }),
  graveside("1CO 15:55-57", "Where, O Death, is your victory? Thanks be to God."),
  graveside("PSA 103:15-18", "Our days are like grass, but the LORD's loving devotion endures."),
  graveside("REV 14:13", "Blessed are the dead who die in the Lord, for they will rest from their labors.", { believer: true }),
  graveside("JOB 1:21b", "Job's words of trust in his grief.", {
    part: "Naked I came from my mother’s womb, and naked I will return. The LORD gave, and the LORD has taken away. Blessed be the name of the LORD.”",
    context: "Job's own words in his grief: a mourner's confession of trust, which belongs to the one who says it, not a thing to tell someone else.",
  }),
  graveside("GEN 3:19b", "Dust to dust, the words most often spoken at a committal.", {
    part: "For dust you are, and to dust you shall return.”",
    context: "Spoken after the fall; read at a graveside alongside the answer the resurrection gives (1 Corinthians 15:22).",
  }),
  blessing("NUM 6:24-26", "Aaron's blessing: the LORD bless you and keep you."),
  blessing("2CO 13:14", "The grace of the Lord Jesus Christ, the love of God and the fellowship of the Holy Spirit."),
  blessing("HEB 13:20-21", "The God of peace, who brought back from the dead our Lord Jesus."),
  blessing("JUD 1:24-25", "To him who is able to keep you from stumbling."),
  blessing("ROM 15:13", "May the God of hope fill you with all joy and peace."),
  blessing("2TH 2:16-17", "Eternal comfort and good hope, by grace."),
];

/** "Readings for a particular life" (design 4.2): links, not repeated text. `href` is a loss page or a reading on this page. */
export const PARTICULAR_LIVES: { title: string; items: { reference: string; href: string }[] }[] = [
  {
    title: "A believer of long faith",
    items: [
      { reference: "2TI 4:6-8", href: "#reading-2-timothy-4-6-8" },
      { reference: "PSA 92:12-15", href: "/sympathy/loss-of-grandparent" },
      { reference: "PRO 31:25-31", href: "/sympathy/loss-of-mother" },
      { reference: "MAT 25:21", href: "/sympathy/loss-of-grandparent" },
    ],
  },
  { title: "A child", items: [{ reference: "MRK 10:13-16", href: "/sympathy/loss-of-baby" }, { reference: "ISA 40:11", href: "/sympathy/loss-of-child" }] },
  { title: "A sudden death", items: [{ reference: "PSA 46:1-11", href: "#reading-psalm-46-1-11" }] },
  {
    title: "Someone whose faith the family did not know",
    items: [
      { reference: "PSA 139:1-12", href: "#reading-psalm-139-1-12" },
      { reference: "PSA 90:1-12", href: "#reading-psalm-90-1-12" },
      { reference: "JHN 11:17-27", href: "#reading-john-11-17-27" },
    ],
  },
];

export const PARTICULAR_FAITH_NOTE =
  "For someone whose faith the family did not know, these passages speak to the mourners about God and about Christ's word to them, without claiming anything about the one who died.";

/** Hymns from the site's collection that are often sung at funerals (design 2.4); pages at /study/hymns/<id>. */
export const FUNERAL_HYMNS: { id: string; title: string }[] = [
  { id: "ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound", title: "Amazing Grace" },
  { id: "gutenberg-watts-psalms-90-2-our-god-our-help-in-ages-past", title: "Our God, Our Help in Ages Past" },
  { id: "ccel-watts-psalms-hymns-ps-54-my-shepherd-will-supply-my-need", title: "My Shepherd Will Supply My Need" },
  { id: "gutenberg-watts-psalms-23-3-the-lord-my-shepherd-is", title: "The Lord My Shepherd Is" },
  { id: "gutenberg-watts-hymns-2-66-there-is-a-land-of-pure-delight", title: "There Is a Land of Pure Delight" },
];
