// The test page's themed tests (owner, 2026-10-22: "we need thematic collections of questions", not the sources they
// were gathered from). Each theme gathers questions by the tags the bank already carries: the people, places and
// subjects a question is about (scripts/question_model_tags.py), its topic, and the books it is tied to. A question
// belongs to a theme when any of the theme's tags match, and, where a theme names `within`, it is tied to one of
// those books. A theme with fewer than MIN_THEME questions is not shown.
import type { TestQuestion } from "./engine";

export interface Theme {
  id: string;
  title: string;
  line: string;
  /** The section colour the card takes (the book map's colours). */
  tone: string;
  people?: string[];
  places?: string[];
  subjects?: RegExp;
  topics?: string[];
  books?: string[];
  question?: RegExp;
  within?: string[];
}
export interface Shelf { id: string; title: string; line: string; themes: Theme[] }

export const MIN_THEME = 12;
const GOSPELS = ["MAT", "MRK", "LUK", "JHN"];

export const SHELVES: Shelf[] = [
  { id: "lives", title: "Lives", line: "The people of the Bible, one life at a time", themes: [
    { id: "abraham", title: "Abraham and Sarah", line: "The call, the promise and the son of laughter", tone: "history", people: ["Abraham", "Abram", "Sarah", "Sarai", "Hagar", "Ishmael", "Lot"], subjects: /abraham/ },
    { id: "jacob", title: "Jacob and Esau", line: "Twins, a birthright, a ladder and a limp", tone: "history", people: ["Jacob", "Esau", "Rachel", "Leah", "Laban", "Rebekah", "Isaac"], within: ["GEN"] },
    { id: "joseph", title: "Joseph and his brothers", line: "The coat, the pit, Pharaoh's dreams", tone: "history", people: ["Joseph"], subjects: /^joseph$/, within: ["GEN"] },
    { id: "moses", title: "Moses", line: "From the basket in the reeds to Mount Nebo", tone: "history", people: ["Moses", "Aaron", "Miriam"], subjects: /^moses$|miracles of moses/ },
    { id: "david", title: "David", line: "Shepherd, giant-killer, king and psalmist", tone: "history", people: ["David", "Goliath", "Jonathan", "Bathsheba", "Absalom"], subjects: /^david$|goliath/ },
    { id: "elijah", title: "Elijah and Elisha", line: "Fire on Carmel, a still small voice, a double portion", tone: "prophets", people: ["Elijah", "Elisha", "Ahab", "Jezebel", "Naaman"], subjects: /elijah|elisha/ },
    { id: "daniel", title: "Daniel in Babylon", line: "The king's food, the furnace and the lions' den", tone: "prophets", people: ["Daniel", "Shadrach", "Meshach", "Abednego", "Nebuchadnezzar", "Belshazzar", "Darius"], within: ["DAN"] },
    { id: "women", title: "Women of faith", line: "Ruth, Hannah, Esther, Mary and many more", tone: "poetry", people: ["Eve", "Sarah", "Rebekah", "Rachel", "Leah", "Miriam", "Rahab", "Deborah", "Ruth", "Naomi", "Hannah", "Abigail", "Esther", "Mary", "Elizabeth", "Martha", "Mary Magdalene", "Anna", "Lydia", "Priscilla", "Dorcas", "Tabitha", "Jael"] },
    { id: "peter", title: "Peter", line: "Fisherman, denier, rock of the church", tone: "gospels", people: ["Peter", "Simon Peter", "Simon"], subjects: /^peter$/ },
    { id: "paul", title: "Paul", line: "The road to Damascus and the journeys after it", tone: "epistles", people: ["Paul", "Saul of Tarsus", "Barnabas", "Silas", "Timothy"], subjects: /^paul$|missionary journey/ },
    { id: "john-baptist", title: "John the Baptist", line: "A voice crying in the wilderness", tone: "gospels", people: ["John the Baptist"], subjects: /john the baptist|baptism of jesus/ },
    { id: "judges", title: "Heroes of the judges", line: "Gideon, Deborah, Samson and the days without a king", tone: "history", people: ["Samson", "Delilah", "Gideon", "Deborah", "Jephthah", "Ehud", "Barak"], subjects: /judges of israel|samson/ },
  ] },
  { id: "stories", title: "Stories", line: "The great events, from the garden to the empty tomb", themes: [
    { id: "creation", title: "Creation and the fall", line: "In the beginning, the garden, the serpent", tone: "history", people: ["Adam", "Eve", "Cain", "Abel", "Seth"], subjects: /^creation$|garden of eden|fall of man|^(the )?fall$/ },
    { id: "flood", title: "Noah and the flood", line: "The ark, the rain and the rainbow", tone: "history", people: ["Noah", "Shem", "Ham", "Japheth"], subjects: /flood|noah/ },
    { id: "exodus", title: "Out of Egypt", line: "Plagues, the Passover and the parted sea", tone: "history", books: ["EXO"], subjects: /plague|passover|red sea|exodus/ },
    { id: "promised-land", title: "Into the promised land", line: "Jericho, Joshua and the twelve tribes", tone: "history", books: ["JOS"], people: ["Joshua", "Rahab", "Caleb"], subjects: /jericho|tribes of israel|twelve tribes/ },
    { id: "kings", title: "The kings", line: "Saul to Zedekiah, Israel and Judah", tone: "history", books: ["1KI", "2KI"], people: ["Saul", "Solomon", "Rehoboam", "Jeroboam", "Ahab", "Hezekiah", "Josiah", "Jehu", "Manasseh"], subjects: /kings of|kingdom(s)? of israel|northern kingdom|southern kingdom|united kingdom/, within: ["1SA", "2SA", "1KI", "2KI", "1CH", "2CH"] },
    { id: "exile", title: "Exile and return", line: "Babylon, Persia and the walls rebuilt", tone: "prophets", books: ["EZR", "NEH", "EST"], people: ["Ezra", "Nehemiah", "Esther", "Mordecai", "Cyrus", "Zerubbabel"], subjects: /exile|captivity/ },
    { id: "nativity", title: "The birth of Jesus", line: "Bethlehem, shepherds, angels and wise men", tone: "gospels", subjects: /birth of jesus|nativity|jesus'? birth|virgin birth|christ's birth|wise men|magi/ },
    { id: "miracles", title: "Miracles", line: "Water into wine, the blind who see, the dead raised", tone: "gospels", subjects: /miracle|healing|walking on water|feeding/ },
    { id: "parables", title: "The parables", line: "The sower, the lost sheep, the good Samaritan", tone: "gospels", subjects: /parabl/ },
    { id: "cross", title: "The cross and the empty tomb", line: "The last supper, Golgotha and the third day", tone: "gospels", places: ["Golgotha", "Calvary", "Gethsemane"], subjects: /crucif|resurrection of jesus|jesus resurrection|^resurrection$|^cross$|easter|tomb|last supper|post-resurrection/, within: [...GOSPELS, "ACT", "1CO"] },
    { id: "church", title: "The early church", line: "Pentecost, the apostles and the first believers", tone: "epistles", books: ["ACT"], subjects: /early church|pentecost|great commission/ },
  ] },
  { id: "teaching", title: "Teaching", line: "What Christians believe, a question at a time", themes: [
    { id: "god", title: "God and his word", line: "Who God is and how he speaks", tone: "prophets", topics: ["god"] },
    { id: "commandments", title: "The Ten Commandments", line: "The law given on Sinai, one word at a time", tone: "history", topics: ["law"], subjects: /commandment/ },
    { id: "prayer", title: "Prayer", line: "The Lord's Prayer and the life of prayer", tone: "poetry", topics: ["prayer"], subjects: /prayer/ },
    { id: "salvation", title: "Saved by grace", line: "Faith, grace and what Christ has done", tone: "gospels", topics: ["salvation"], subjects: /salvation|^grace$|justification|redemption|atonement/ },
    { id: "sin", title: "Sin and forgiveness", line: "What went wrong, and how it is put right", tone: "revelation", topics: ["sin"], subjects: /^sin$|forgiveness|repentance/ },
    { id: "spirit", title: "The Holy Spirit", line: "The Spirit's gifts, fruit and work", tone: "epistles", subjects: /holy spirit|spiritual gifts|fruit of the spirit|gifts of the spirit/ },
    { id: "sacraments", title: "Baptism and the Lord's Supper", line: "The water and the bread and the cup", tone: "epistles", topics: ["church-life"], subjects: /baptism|lord's supper|communion|sacrament/ },
    { id: "last-things", title: "Death and the life to come", line: "Heaven, judgement and Christ's return", tone: "revelation", topics: ["last-things"], books: ["REV"], subjects: /heaven|^hell$|second coming|christ's return|judgment/ },
  ] },
  { id: "know", title: "Know your Bible", line: "The book itself: its books, places and numbers", themes: [
    { id: "books", title: "The books of the Bible", line: "Who wrote what, and in what order", tone: "history", topics: ["the-bible"], subjects: /books of the bible|biblical authorship|canon/ },
    { id: "places", title: "Places of the Bible", line: "Cities, rivers, mountains and seas", tone: "prophets", question: /^(where|in what (city|town|land|country)|which (city|town|mountain|river|sea|country)|what (city|town|mountain|river|sea|country))\b/i },
    { id: "prophets", title: "The prophets", line: "Isaiah to Malachi, and what they foretold", tone: "prophets", people: ["Isaiah", "Jeremiah", "Ezekiel", "Hosea", "Joel", "Amos", "Obadiah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"], subjects: /prophet|prophec/ },
    { id: "wisdom", title: "Psalms and wisdom", line: "Songs, proverbs and the search for meaning", tone: "poetry", topics: ["wisdom"] },
    { id: "numbers", title: "By the numbers", line: "How many, how old, how long", tone: "revelation", question: /\bhow (many|old|long|much)\b/i },
  ] },
];

export const THEMES = SHELVES.flatMap((s) => s.themes);
export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? null;

const meets = (list: string[] | undefined, values: string[] | null | undefined) => Boolean(list && values?.some((v) => list.includes(v)));

export function inTheme(theme: Theme, q: TestQuestion): boolean {
  if (theme.within && !q.books.some((b) => theme.within!.includes(b))) return false;
  return meets(theme.people, q.people) || meets(theme.places, q.places) || meets(theme.books, q.books)
    || Boolean(theme.topics && q.topic && theme.topics.includes(q.topic))
    || Boolean(theme.subjects && q.subjects?.some((s) => theme.subjects!.test(s)))
    || Boolean(theme.question?.test(q.question));
}
