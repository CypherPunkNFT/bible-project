// The homepage quiz's twelve questions, its verdicts and the 66 books it is drawn across (HomeQuiz.tsx).
// Every verse is the Berean Standard Bible, taken from the site's own text (2026-10-31).
export type Scene = "shelf" | "waters" | "hourglass" | "tents" | "whirlwind" | "crown" | "lamp" | "scroll" | "loaves" | "tomb" | "colonnade" | "letters" | "verdict";

export interface Question { scene: Scene; part: string; ask: string; options: string[]; answer: number; why: string; verse: string; ref: string; read: string }

export const QUESTIONS: Question[] = [
  { scene: "shelf", part: "The whole Bible", ask: "How many books are in the Bible?", options: ["59", "66", "72", "73"], answer: 1,
    why: "Thirty-nine in the Old Testament and twenty-seven in the New, in the Protestant canon.",
    verse: "All Scripture is God-breathed and is useful for instruction, for conviction, for correction, and for training in righteousness", ref: "2 Timothy 3:16", read: "2TI/3?hl=16" },
  { scene: "waters", part: "Old Testament", ask: "What did God create on the first day?", options: ["The sun and moon", "Light", "Dry land", "The firmament"], answer: 1,
    why: "Light came first; the sun and moon were not made until the fourth day.",
    verse: "And God said, “Let there be light,” and there was light.", ref: "Genesis 1:3", read: "GEN/1?hl=3" },
  { scene: "hourglass", part: "Old Testament", ask: "Who lived the longest of anyone in the Bible?", options: ["Adam", "Noah", "Methuselah", "Enoch"], answer: 2,
    why: "Nine hundred and sixty-nine years. His father Enoch, by contrast, did not die at all: God took him.",
    verse: "So Methuselah lived a total of 969 years, and then he died.", ref: "Genesis 5:27", read: "GEN/5?hl=27" },
  { scene: "tents", part: "Old Testament", ask: "How long did Israel wander in the wilderness?", options: ["Seven years", "Twelve years", "Forty years", "Seventy years"], answer: 2,
    why: "A year for each of the forty days the spies searched the land.",
    verse: "In keeping with the forty days you spied out the land, you shall bear your guilt forty years—a year for each day—and you will experience My alienation.", ref: "Numbers 14:34", read: "NUM/14?hl=34" },
  { scene: "whirlwind", part: "Old Testament", ask: "Who was taken up to heaven by a whirlwind?", options: ["Enoch", "Elisha", "Moses", "Elijah"], answer: 3,
    why: "Elisha watched him go, and took up the mantle that fell from him.",
    verse: "…and Elijah went up into heaven in a whirlwind.", ref: "2 Kings 2:11", read: "2KI/2?hl=11" },
  { scene: "crown", part: "Old Testament", ask: "Which of these books never names God?", options: ["Ruth", "Esther", "Jonah", "Nehemiah"], answer: 1,
    why: "Yet his hand is over every turn of it.",
    verse: "…And who knows if perhaps you have come to the kingdom for such a time as this?", ref: "Esther 4:14", read: "EST/4?hl=14" },
  { scene: "lamp", part: "Old Testament", ask: "Which is the longest chapter in the Bible?", options: ["Isaiah 53", "Numbers 7", "Psalm 119", "1 Chronicles 6"], answer: 2,
    why: "176 verses on God's word, in twenty-two stanzas, one for each letter of the Hebrew alphabet.",
    verse: "Your word is a lamp to my feet and a light to my path.", ref: "Psalm 119:105", read: "PSA/119?hl=105" },
  { scene: "scroll", part: "The whole Bible", ask: "In which languages was the Bible first written?", options: ["Hebrew and Latin", "Hebrew, Aramaic and Greek", "Greek and Latin", "Aramaic alone"], answer: 1,
    why: "Hebrew for most of the Old Testament, Aramaic for parts of Daniel and Ezra, Greek for the New. Daniel changes language mid-chapter, here.",
    verse: "Then the astrologers answered the king in Aramaic, “O king, may you live forever! Tell your servants the dream, and we will give the interpretation.”", ref: "Daniel 2:4", read: "DAN/2?hl=4" },
  { scene: "loaves", part: "New Testament", ask: "How many loaves fed the five thousand?", options: ["Two", "Five", "Seven", "Twelve"], answer: 1,
    why: "Five loaves and two fish, and twelve basketfuls of broken pieces left over.",
    verse: "“We have here only five loaves of bread and two fish,” they answered.", ref: "Matthew 14:17", read: "MAT/14?hl=17" },
  { scene: "tomb", part: "New Testament", ask: "What is the shortest verse in the Berean Bible?", options: ["“Rejoice at all times.”", "“Jesus wept.”", "“Pray without ceasing.”", "“Remember Lot’s wife!”"], answer: 1,
    why: "Two words, at the grave of Lazarus, moments before he called him out.",
    verse: "Jesus wept.", ref: "John 11:35", read: "JHN/11?hl=35" },
  { scene: "colonnade", part: "New Testament", ask: "Where were the disciples first called Christians?", options: ["Jerusalem", "Antioch", "Rome", "Corinth"], answer: 1,
    why: "Barnabas and Saul taught there a whole year, and the name followed.",
    verse: "The disciples were first called Christians at Antioch.", ref: "Acts 11:26", read: "ACT/11?hl=26" },
  { scene: "letters", part: "New Testament", ask: "Who wrote the most books of the New Testament?", options: ["John", "Luke", "Peter", "Paul"], answer: 3,
    why: "Thirteen letters bear his name, Romans to Philemon. Luke wrote more words, across his Gospel and Acts.",
    verse: "Paul, a servant of Christ Jesus, called to be an apostle, and set apart for the gospel of God", ref: "Romans 1:1", read: "ROM/1?hl=1" },
];

export const VERDICTS = [
  { least: 12, title: "Every one. Like the Bereans.", verse: "They received the message with great eagerness and examined the Scriptures every day.", ref: "Acts 17:11", read: "ACT/17?hl=11" },
  { least: 8, title: "Well read, and worth reading on.", verse: "I have hidden Your word in my heart that I might not sin against You.", ref: "Psalm 119:11", read: "PSA/119?hl=11" },
  { least: 4, title: "A good start. Keep searching.", verse: "You pore over the Scriptures because you presume that by them you possess eternal life. These are the very words that testify about Me.", ref: "John 5:39", read: "JHN/5?hl=39" },
  { least: 0, title: "Every reader starts somewhere.", verse: "Open my eyes that I may see wondrous things from Your law.", ref: "Psalm 119:18", read: "PSA/119?hl=18" },
];

// The 66 books: code (as the reader uses), name and chapters (1,189 in all).
export const BOOKS: [code: string, name: string, chapters: number][] = [
  ["GEN", "Genesis", 50], ["EXO", "Exodus", 40], ["LEV", "Leviticus", 27], ["NUM", "Numbers", 36], ["DEU", "Deuteronomy", 34],
  ["JOS", "Joshua", 24], ["JDG", "Judges", 21], ["RUT", "Ruth", 4], ["1SA", "1 Samuel", 31], ["2SA", "2 Samuel", 24],
  ["1KI", "1 Kings", 22], ["2KI", "2 Kings", 25], ["1CH", "1 Chronicles", 29], ["2CH", "2 Chronicles", 36], ["EZR", "Ezra", 10],
  ["NEH", "Nehemiah", 13], ["EST", "Esther", 10], ["JOB", "Job", 42], ["PSA", "Psalms", 150], ["PRO", "Proverbs", 31],
  ["ECC", "Ecclesiastes", 12], ["SNG", "Song of Solomon", 8], ["ISA", "Isaiah", 66], ["JER", "Jeremiah", 52],
  ["LAM", "Lamentations", 5], ["EZK", "Ezekiel", 48], ["DAN", "Daniel", 12], ["HOS", "Hosea", 14], ["JOL", "Joel", 3],
  ["AMO", "Amos", 9], ["OBA", "Obadiah", 1], ["JON", "Jonah", 4], ["MIC", "Micah", 7], ["NAM", "Nahum", 3], ["HAB", "Habakkuk", 3],
  ["ZEP", "Zephaniah", 3], ["HAG", "Haggai", 2], ["ZEC", "Zechariah", 14], ["MAL", "Malachi", 4], ["MAT", "Matthew", 28],
  ["MRK", "Mark", 16], ["LUK", "Luke", 24], ["JHN", "John", 21], ["ACT", "Acts", 28], ["ROM", "Romans", 16],
  ["1CO", "1 Corinthians", 16], ["2CO", "2 Corinthians", 13], ["GAL", "Galatians", 6], ["EPH", "Ephesians", 6],
  ["PHP", "Philippians", 4], ["COL", "Colossians", 4], ["1TH", "1 Thessalonians", 5], ["2TH", "2 Thessalonians", 3],
  ["1TI", "1 Timothy", 6], ["2TI", "2 Timothy", 4], ["TIT", "Titus", 3], ["PHM", "Philemon", 1], ["HEB", "Hebrews", 13],
  ["JAS", "James", 5], ["1PE", "1 Peter", 5], ["2PE", "2 Peter", 3], ["1JN", "1 John", 5], ["2JN", "2 John", 1],
  ["3JN", "3 John", 1], ["JUD", "Jude", 1], ["REV", "Revelation", 22],
];
export const OLD_TESTAMENT = 39;
