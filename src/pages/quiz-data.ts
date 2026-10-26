// The homepage quiz's twelve questions, its verdicts and the 66 books it is drawn across (HomeQuiz.tsx).
// Every verse is the KJV, checked word for word against the site's reader (2026-10-22).
export type Scene = "shelf" | "waters" | "hourglass" | "tents" | "whirlwind" | "crown" | "lamp" | "scroll" | "loaves" | "tomb" | "colonnade" | "letters" | "verdict";

export interface Question { scene: Scene; part: string; ask: string; options: string[]; answer: number; why: string; verse: string; ref: string; read: string }

export const QUESTIONS: Question[] = [
  { scene: "shelf", part: "The whole Bible", ask: "How many books are in the Bible?", options: ["59", "66", "72", "73"], answer: 1,
    why: "Thirty-nine in the Old Testament and twenty-seven in the New, in the Protestant canon.",
    verse: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness", ref: "2 Timothy 3:16", read: "2TI/3?hl=16" },
  { scene: "waters", part: "Old Testament", ask: "What did God create on the first day?", options: ["The sun and moon", "Light", "Dry land", "The firmament"], answer: 1,
    why: "Light came first; the sun and moon were not made until the fourth day.",
    verse: "And God said, Let there be light: and there was light.", ref: "Genesis 1:3", read: "GEN/1?hl=3" },
  { scene: "hourglass", part: "Old Testament", ask: "Who lived the longest of anyone in the Bible?", options: ["Adam", "Noah", "Methuselah", "Enoch"], answer: 2,
    why: "Nine hundred and sixty-nine years. His father Enoch, by contrast, did not die at all: God took him.",
    verse: "And all the days of Methuselah were nine hundred sixty and nine years: and he died.", ref: "Genesis 5:27", read: "GEN/5?hl=27" },
  { scene: "tents", part: "Old Testament", ask: "How long did Israel wander in the wilderness?", options: ["Seven years", "Twelve years", "Forty years", "Seventy years"], answer: 2,
    why: "A year for each of the forty days the spies searched the land.",
    verse: "After the number of the days in which ye searched the land, even forty days, each day for a year, shall ye bear your iniquities, even forty years, and ye shall know my breach of promise.", ref: "Numbers 14:34", read: "NUM/14?hl=34" },
  { scene: "whirlwind", part: "Old Testament", ask: "Who was taken up to heaven by a whirlwind?", options: ["Enoch", "Elisha", "Moses", "Elijah"], answer: 3,
    why: "Elisha watched him go, and took up the mantle that fell from him.",
    verse: "…and Elijah went up by a whirlwind into heaven.", ref: "2 Kings 2:11", read: "2KI/2?hl=11" },
  { scene: "crown", part: "Old Testament", ask: "Which of these books never names God?", options: ["Ruth", "Esther", "Jonah", "Nehemiah"], answer: 1,
    why: "Yet his hand is over every turn of it.",
    verse: "…and who knoweth whether thou art come to the kingdom for such a time as this?", ref: "Esther 4:14", read: "EST/4?hl=14" },
  { scene: "lamp", part: "Old Testament", ask: "Which is the longest chapter in the Bible?", options: ["Isaiah 53", "Numbers 7", "Psalm 119", "1 Chronicles 6"], answer: 2,
    why: "176 verses on God's word, in twenty-two stanzas, one for each letter of the Hebrew alphabet.",
    verse: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105", read: "PSA/119?hl=105" },
  { scene: "scroll", part: "The whole Bible", ask: "In which languages was the Bible first written?", options: ["Hebrew and Latin", "Hebrew, Aramaic and Greek", "Greek and Latin", "Aramaic alone"], answer: 1,
    why: "Hebrew for most of the Old Testament, Aramaic for parts of Daniel and Ezra, Greek for the New. Daniel changes language mid-chapter, here.",
    verse: "Then spake the Chaldeans to the king in Syriack, O king, live for ever: tell thy servants the dream, and we will shew the interpretation.", ref: "Daniel 2:4", read: "DAN/2?hl=4" },
  { scene: "loaves", part: "New Testament", ask: "How many loaves fed the five thousand?", options: ["Two", "Five", "Seven", "Twelve"], answer: 1,
    why: "Five loaves and two fishes, and twelve baskets of fragments left over.",
    verse: "And they say unto him, We have here but five loaves, and two fishes.", ref: "Matthew 14:17", read: "MAT/14?hl=17" },
  { scene: "tomb", part: "New Testament", ask: "What is the shortest verse in the King James Bible?", options: ["“Rejoice evermore.”", "“Jesus wept.”", "“Pray without ceasing.”", "“Remember Lot's wife.”"], answer: 1,
    why: "Two words, at the grave of Lazarus, moments before he called him out.",
    verse: "Jesus wept.", ref: "John 11:35", read: "JHN/11?hl=35" },
  { scene: "colonnade", part: "New Testament", ask: "Where were the disciples first called Christians?", options: ["Jerusalem", "Antioch", "Rome", "Corinth"], answer: 1,
    why: "Barnabas and Saul taught there a whole year, and the name followed.",
    verse: "And the disciples were called Christians first in Antioch.", ref: "Acts 11:26", read: "ACT/11?hl=26" },
  { scene: "letters", part: "New Testament", ask: "Who wrote the most books of the New Testament?", options: ["John", "Luke", "Peter", "Paul"], answer: 3,
    why: "Thirteen letters bear his name, Romans to Philemon. Luke wrote more words, across his Gospel and Acts.",
    verse: "Paul, a servant of Jesus Christ, called to be an apostle, separated unto the gospel of God", ref: "Romans 1:1", read: "ROM/1?hl=1" },
];

export const VERDICTS = [
  { least: 12, title: "Every one. Like the Bereans.", verse: "They received the word with all readiness of mind, and searched the scriptures daily.", ref: "Acts 17:11", read: "ACT/17?hl=11" },
  { least: 8, title: "Well read, and worth reading on.", verse: "Thy word have I hid in mine heart, that I might not sin against thee.", ref: "Psalm 119:11", read: "PSA/119?hl=11" },
  { least: 4, title: "A good start. Keep searching.", verse: "Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me.", ref: "John 5:39", read: "JHN/5?hl=39" },
  { least: 0, title: "Every reader starts somewhere.", verse: "Open thou mine eyes, that I may behold wondrous things out of thy law.", ref: "Psalm 119:18", read: "PSA/119?hl=18" },
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
