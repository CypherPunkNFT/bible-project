// What the page says about each holy day (design, "The days" and "Review"): its name, a short explanation, how its date
// is worked out and its key passages. Passages are verse ids through the life-event helper `p`; their words come from
// the Berean files when a day is opened, never from here. Western and Orthodox customs are described, not commanded:
// the closing note on the page gives the site's own (Baptist) view.
import { p, type LifeEventPassage } from "@/data/life-events/types";
import type { HolyDayKey, Tradition } from "./dates";

export interface HolyDayText {
  name: string;
  /** Two or three sentences: what it remembers and how it is kept. */
  explanation: string;
  /** How its date is worked out, in one sentence. */
  reckoning: string;
  passages: LifeEventPassage[];
}

export const TRADITION_LABELS: Record<Tradition, string> = {
  western: "Western churches",
  orthodox: "Orthodox churches",
  feast: "Biblical feasts",
};

const read = (reference: string, note: string) => p(reference, "reading", note);

export const HOLY_DAYS: Record<HolyDayKey, HolyDayText> = {
  epiphany: {
    name: "Epiphany",
    explanation: "Remembers the wise men who came from the east to worship the child Jesus, the first Gentiles to honour him. Its name means “appearing”: Christ shown to the nations.",
    reckoning: "Always 6 January, the twelfth day after Christmas.",
    passages: [read("MAT 2:1-2", "The wise men ask for the King of the Jews."), read("MAT 2:10-11", "They worship him and bring their gifts."), read("ISA 60:3", "Nations will come to your light.")],
  },
  "ash-wednesday": {
    name: "Ash Wednesday: Lent begins",
    explanation: "Many churches begin Lent today: forty days, Sundays not counted, of prayer, fasting and turning from sin before Easter, recalling Jesus' forty days in the wilderness. Some mark the forehead with ashes as a sign of repentance. Forgiveness rests on Christ's finished work, not on anything given up.",
    reckoning: "Forty-six days before Western Easter, so always a Wednesday between 4 February and 10 March.",
    passages: [read("JOL 2:12-13", "Return to Me with all your heart."), read("PSA 51:10-12", "Create in me a clean heart."), read("MAT 4:1-2", "Jesus fasts forty days in the wilderness.")],
  },
  "palm-sunday": {
    name: "Palm Sunday",
    explanation: "Remembers Jesus riding into Jerusalem on a donkey while the crowds spread branches and cried “Hosanna”. It opens Holy Week, the last week before his death and resurrection.",
    reckoning: "The Sunday before Western Easter.",
    passages: [read("MAT 21:8-9", "The crowds welcome the Son of David."), read("ZEC 9:9", "Your King comes to you, humble and riding on a donkey.")],
  },
  "maundy-thursday": {
    name: "Maundy Thursday",
    explanation: "Remembers the night Jesus was betrayed: he washed his disciples' feet, gave them the new command to love one another, and instituted the Lord's Supper, the ordinance his church keeps in memory of his death until he comes.",
    reckoning: "The Thursday before Western Easter.",
    passages: [read("JHN 13:34-35", "A new commandment: love one another."), read("1CO 11:23-26", "Do this in remembrance of Me.")],
  },
  "good-friday": {
    name: "Good Friday",
    explanation: "Remembers the crucifixion of Jesus, who bore the sins of his people and died in their place. Christians call it good because his death opened the way to God.",
    reckoning: "The Friday before Western Easter.",
    passages: [read("ISA 53:5-6", "He was pierced for our transgressions."), read("JHN 19:28-30", "Jesus says, “It is finished.”"), read("1PE 2:24", "He bore our sins in his body on the tree.")],
  },
  easter: {
    name: "Easter Sunday",
    explanation: "The day Christians celebrate the bodily resurrection of Jesus from the dead on the first day of the week, the heart of the gospel. Every Lord's Day remembers it too.",
    reckoning: "The first Sunday after the church's full moon on or after 21 March, reckoned on the Gregorian calendar: always between 22 March and 25 April.",
    passages: [read("MAT 28:5-6", "He has risen, just as He said!"), read("1CO 15:3-4", "Christ died, was buried and was raised."), read("1CO 15:20", "Christ, the firstfruits of those who have fallen asleep.")],
  },
  ascension: {
    name: "Ascension Day",
    explanation: "Remembers Jesus being taken up into heaven forty days after his resurrection, with the promise that he will come again in the same way.",
    reckoning: "Thirty-nine days after Western Easter, so always a Thursday.",
    passages: [read("ACT 1:9-11", "This same Jesus will come back."), read("LUK 24:50-51", "He blessed them and was carried up into heaven.")],
  },
  pentecost: {
    name: "Pentecost",
    explanation: "Remembers the Holy Spirit coming on the disciples in Jerusalem at the Feast of Weeks, and the first preaching of the gospel to the crowds gathered there. Many call it the birthday of the church.",
    reckoning: "The seventh Sunday after Western Easter, forty-nine days later.",
    passages: [read("ACT 2:1-4", "They were all filled with the Holy Spirit."), read("JOL 2:28", "I will pour out my Spirit on all people."), read("ACT 2:38-39", "Repent and be baptized.")],
  },
  advent: {
    name: "First Sunday of Advent",
    explanation: "Advent means “coming”. The four Sundays before Christmas look back to the first coming of Christ and ahead to his return. In the Western churches the church year begins here.",
    reckoning: "The fourth Sunday before Christmas: the Sunday from 27 November to 3 December.",
    passages: [read("ISA 9:6", "For unto us a child is born."), read("GAL 4:4-5", "When the time had fully come, God sent His Son."), read("REV 22:20", "Yes, I am coming soon.")],
  },
  christmas: {
    name: "Christmas Day",
    explanation: "Celebrates the birth of Jesus in Bethlehem: the eternal Son of God made man. Scripture does not give the date of his birth, and Western churches have kept 25 December since at least the fourth century.",
    reckoning: "Always 25 December, whatever day of the week it falls on.",
    passages: [read("LUK 2:10-11", "A Savior has been born to you."), read("JHN 1:14", "The Word became flesh."), read("ISA 7:14", "The virgin will be with child and will give birth to a son.")],
  },
  "orthodox-christmas": {
    name: "Christmas (Julian calendar)",
    explanation: "The Russian, Serbian, Georgian, Ukrainian and Jerusalem Orthodox churches, among others, still date the year by the old Julian calendar, so their 25 December falls in January on ours. Most Greek Orthodox churches keep 25 December.",
    reckoning: "25 December on the Julian calendar, which runs behind ours: 7 January from 1901 to 2100, 8 January from 2101 to 2200.",
    passages: [read("LUK 2:6-7", "She gave birth to her firstborn, a Son."), read("MAT 1:23", "Immanuel: God with us.")],
  },
  "clean-monday": {
    name: "Clean Monday: Great Lent begins",
    explanation: "Orthodox churches begin Great Lent on a Monday, seven weeks before Pascha, with a strict fast and prayers of repentance. The name speaks of a clean start, in heart as well as in food.",
    reckoning: "Forty-eight days before Orthodox Easter.",
    passages: [read("MAT 6:16-18", "When you fast, do not be somber."), read("ISA 58:6-7", "The fast the Lord has chosen.")],
  },
  pascha: {
    name: "Pascha (Orthodox Easter)",
    explanation: "Orthodox churches celebrate the resurrection with the greeting “Christ is risen!” and the answer “He is risen indeed!” Pascha is the Greek form of the Hebrew word for Passover.",
    reckoning: "Reckoned like Western Easter but on the Julian calendar, then carried over to ours, so it falls on the same day or up to five weeks later.",
    passages: [read("LUK 24:5-6", "Why do you look for the living among the dead?"), read("ROM 6:9", "Death no longer has dominion over Him.")],
  },
  "orthodox-pentecost": {
    name: "Pentecost (Orthodox)",
    explanation: "Orthodox churches celebrate the coming of the Holy Spirit fifty days after Pascha, and with it the Holy Trinity.",
    reckoning: "Forty-nine days after Orthodox Easter.",
    passages: [read("ACT 2:1-4", "They were all filled with the Holy Spirit."), read("JHN 14:26", "The Advocate, the Holy Spirit, will teach you all things.")],
  },
  purim: {
    name: "Purim",
    explanation: "Remembers how God saved the Jews of Persia from Haman's plot through Esther and Mordecai. The book of Esther itself appoints these days of feasting and gifts to the poor.",
    reckoning: "14 Adar on the Hebrew calendar (Adar II in a leap year).",
    passages: [read("EST 9:20-22", "Days of feasting and joy."), read("EST 4:14", "For such a time as this.")],
  },
  passover: {
    name: "Passover and Unleavened Bread",
    explanation: "Remembers the night the Lord passed over the houses marked with the lamb's blood and brought Israel out of Egypt. The lamb was killed at twilight on 14 Nisan and eaten that night, the start of 15 Nisan. Then came seven days of bread without yeast. Jesus kept the Passover with his disciples, and Paul calls him our Passover lamb.",
    reckoning: "15 to 21 Nisan on the Hebrew calendar, as Jewish communities keep it today. The Passover meal is eaten the evening before the first day.",
    passages: [read("EXO 12:13-14", "When I see the blood, I will pass over you."), read("LEV 23:5-6", "The Lord's Passover and the Feast of Unleavened Bread."), read("1CO 5:7-8", "Christ, our Passover lamb, has been sacrificed.")],
  },
  firstfruits: {
    name: "Firstfruits",
    explanation: "Israel brought the first sheaf of the barley harvest to the Lord before eating any of it. Jewish custom counts it from 16 Nisan, while others read “the day after the Sabbath” as the Sunday in the feast, the day Christ rose as the firstfruits of the dead.",
    reckoning: "16 Nisan on the Hebrew calendar, the day after the first day of Unleavened Bread.",
    passages: [read("LEV 23:10-11", "Bring the first sheaf of your harvest."), read("1CO 15:20", "Christ, the firstfruits of those who have fallen asleep.")],
  },
  weeks: {
    name: "Feast of Weeks (Shavuot)",
    explanation: "A harvest feast seven weeks after Firstfruits, when Israel brought two loaves from the new wheat. Jewish tradition also remembers the giving of the Law at Sinai. On this feast, called Pentecost in Greek, the Holy Spirit came on the church.",
    reckoning: "6 Sivan on the Hebrew calendar, fifty days counted from Firstfruits.",
    passages: [read("LEV 23:15-16", "Count off fifty days."), read("DEU 16:10-11", "Rejoice before the Lord your God."), read("ACT 2:1", "When the day of Pentecost came.")],
  },
  trumpets: {
    name: "Feast of Trumpets (Rosh Hashanah)",
    explanation: "A day of rest announced with trumpet blasts at the start of the seventh month. Jewish communities keep it, over two days, as the new year. Christians often think of the trumpet that will sound at the Lord's return.",
    reckoning: "1 Tishri on the Hebrew calendar.",
    passages: [read("LEV 23:24-25", "A sacred assembly announced by trumpet blasts."), read("1TH 4:16", "The Lord himself will descend with the trumpet of God.")],
  },
  atonement: {
    name: "Day of Atonement (Yom Kippur)",
    explanation: "The one day each year when the high priest entered the Most Holy Place with blood to make atonement for the people's sins, a day of fasting and humbling. The letter to the Hebrews shows Christ entering heaven itself with his own blood, once for all.",
    reckoning: "10 Tishri on the Hebrew calendar.",
    passages: [read("LEV 16:29-30", "Atonement will be made for you, to cleanse you."), read("HEB 9:11-12", "He entered the Most Holy Place once for all."), read("HEB 10:10", "Sanctified through the sacrifice of the body of Jesus Christ.")],
  },
  tabernacles: {
    name: "Feast of Tabernacles (Sukkot)",
    explanation: "Seven days living in shelters of branches, remembering Israel's years in the wilderness and giving thanks for the harvest, with a sacred assembly on the eighth day. On its last great day Jesus cried out, “If anyone is thirsty, let him come to Me and drink.”",
    reckoning: "15 to 22 Tishri on the Hebrew calendar, the eighth day included.",
    passages: [read("LEV 23:42-43", "You are to dwell in booths for seven days."), read("LEV 23:36", "On the eighth day you are to hold a sacred assembly."), read("JHN 7:37-38", "Streams of living water.")],
  },
  dedication: {
    name: "Feast of Dedication (Hanukkah)",
    explanation: "Remembers the cleansing and rededication of the temple in 164 BC after the Greek king Antiochus defiled it, told in 1 Maccabees, which is not part of the Protestant Bible. John records Jesus in the temple courts at this feast in winter.",
    reckoning: "25 Kislev on the Hebrew calendar, for eight days.",
    passages: [read("JHN 10:22-23", "The Feast of Dedication in Jerusalem."), read("JHN 10:27-28", "My sheep listen to My voice.")],
  },
};
