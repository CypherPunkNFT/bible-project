// The test page's themed tests (owner, 2026-10-22: "we need thematic collections of questions", not the sources they
// were gathered from), in three levels: four shelves, each with its groups (owner: "it should be rulers, it should be
// prophets, it should be apostles, it should be women of the faith, it should be exile and return"), each group with
// its tests. Each test gathers questions by the tags the bank already carries: the people, places and subjects a
// question is about (scripts/question_model_tags.py), its topic, and the books it is tied to. A question belongs to a
// test when any of the test's tags match, and, where a test names `within`, it is tied to one of those books. A test
// with fewer than MIN_THEME questions is not shown, nor a group or shelf left with none.
import type { TestQuestion } from "./engine";

export interface Theme {
  id: string;
  title: string;
  line: string;
  people?: string[];
  places?: string[];
  subjects?: RegExp;
  topics?: string[];
  books?: string[];
  question?: RegExp;
  within?: string[];
}
export interface Group { id: string; title: string; line: string; themes: Theme[] }
export interface Shelf {
  id: string;
  /** The shelf's colour, taken by its groups and tests too (the book map's colours). */
  tone: string;
  title: string;
  line: string;
  groups: Group[];
}

export const MIN_THEME = 12;
const GOSPELS = ["MAT", "MRK", "LUK", "JHN"];
const OLD_HISTORY = ["1SA", "2SA", "1KI", "2KI", "1CH", "2CH"];

export const SHELVES: Shelf[] = [
  { id: "lives", tone: "history", title: "Lives", line: "The people of the Bible, one life at a time", groups: [
    { id: "patriarchs", title: "The patriarchs", line: "Abraham to Joseph", themes: [
      { id: "abraham", title: "Abraham and Sarah", line: "The call, the promise and the son of laughter", people: ["Abraham", "Abram", "Sarah", "Sarai", "Hagar", "Ishmael", "Lot"], subjects: /^abraham$/ },
      { id: "jacob", title: "Isaac and Jacob", line: "Twins, a birthright, a ladder and a limp", people: ["Isaac", "Rebekah", "Jacob", "Esau", "Rachel", "Leah", "Laban"], within: ["GEN"] },
      { id: "joseph", title: "Joseph", line: "The coat, the pit, Pharaoh's dreams", people: ["Joseph"], subjects: /^joseph$/, within: ["GEN"] },
    ] },
    { id: "leaders", title: "Leaders and judges", line: "Moses to Samuel", themes: [
      { id: "moses", title: "Moses", line: "From the basket in the reeds to Mount Nebo", people: ["Moses", "Aaron", "Miriam"], subjects: /^moses$|miracles of moses/ },
      { id: "joshua", title: "Joshua", line: "Jericho, Rahab and the land divided", people: ["Joshua", "Caleb", "Rahab"], books: ["JOS"] },
      { id: "judges", title: "Heroes of the judges", line: "Gideon, Deborah, Samson and the days without a king", people: ["Samson", "Delilah", "Gideon", "Deborah", "Jephthah", "Ehud", "Barak"], subjects: /^judges$|judges of israel|samson/ },
      { id: "samuel", title: "Samuel", line: "Hannah's prayer, Eli's house and the voice in the night", people: ["Samuel", "Hannah", "Eli", "Elkanah"], within: ["1SA"] },
    ] },
    { id: "rulers", title: "Kings and rulers", line: "Saul to the fall of Jerusalem", themes: [
      { id: "saul", title: "Saul", line: "The first king, tall and troubled", people: ["Saul", "Jonathan"], subjects: /^saul$/, within: OLD_HISTORY },
      { id: "david", title: "David", line: "Shepherd, giant-killer, king and psalmist", people: ["David", "Goliath", "Bathsheba", "Absalom"], subjects: /^david$|goliath/ },
      { id: "solomon", title: "Solomon", line: "Wisdom, the temple and a divided heart", people: ["Solomon"], subjects: /^solomon$/ },
      { id: "kings", title: "Kings of Israel and Judah", line: "Jeroboam to Zedekiah, the good and the bad", people: ["Jeroboam", "Rehoboam", "Ahab", "Jezebel", "Jehu", "Joash", "Jehoshaphat", "Hezekiah", "Josiah", "Manasseh", "Athaliah", "Asa", "Ahaziah", "Jehoram"], subjects: /kings of (israel|judah)|northern kingdom|divided kingdom/ },
    ] },
    { id: "prophets", title: "Prophets", line: "The men who spoke for God", themes: [
      { id: "elijah", title: "Elijah and Elisha", line: "Fire on Carmel, a still small voice, a double portion", people: ["Elijah", "Elisha", "Naaman"], subjects: /elijah|elisha/ },
      { id: "isaiah", title: "Isaiah and Jeremiah", line: "The suffering servant and the weeping prophet", people: ["Isaiah", "Jeremiah"], books: ["ISA", "JER", "LAM"] },
      { id: "daniel", title: "Daniel", line: "The king's food, the furnace and the lions' den", people: ["Daniel", "Shadrach", "Meshach", "Abednego", "Nebuchadnezzar", "Belshazzar"], within: ["DAN"] },
      { id: "jonah", title: "Jonah and the twelve", line: "The great fish, and the shorter prophets", people: ["Jonah", "Hosea", "Joel", "Amos", "Micah", "Habakkuk", "Haggai", "Zechariah", "Malachi"], subjects: /minor prophets|jonah/, within: ["HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"] },
    ] },
    { id: "women", title: "Women of faith", line: "Mothers, judges, queens and followers", themes: [
      { id: "mothers", title: "Mothers of Israel", line: "Eve, Sarah, Rebekah, Rachel and Leah", people: ["Eve", "Sarah", "Sarai", "Rebekah", "Rachel", "Leah", "Hagar", "Jochebed"] },
      { id: "ruth", title: "Ruth and Naomi", line: "Where you go I will go", people: ["Ruth", "Naomi", "Boaz"], books: ["RUT"] },
      { id: "courage", title: "Women of courage", line: "Deborah, Rahab, Hannah, Abigail and Esther", people: ["Deborah", "Rahab", "Hannah", "Abigail", "Esther", "Jael", "Miriam"] },
      { id: "followers", title: "Women around Jesus", line: "Mary, Elizabeth, Martha and Mary Magdalene", people: ["Mary", "Elizabeth", "Martha", "Mary Magdalene", "Anna", "Lydia", "Priscilla", "Dorcas", "Tabitha"] },
    ] },
    { id: "apostles", title: "Apostles", line: "The twelve and the one born out of time", themes: [
      { id: "peter", title: "Peter", line: "Fisherman, denier, rock of the church", people: ["Peter", "Simon Peter"], subjects: /^peter$/ },
      { id: "paul", title: "Paul", line: "The road to Damascus and the journeys after it", people: ["Paul", "Saul of Tarsus", "Barnabas", "Silas", "Timothy"], subjects: /^paul$|missionary journey/ },
      { id: "twelve", title: "John and the twelve", line: "The beloved disciple, Thomas, Andrew and the rest", people: ["John", "James", "Andrew", "Thomas", "Philip", "Matthew", "Judas", "Judas Iscariot"], subjects: /^apostles$|^disciples$/ },
    ] },
  ] },
  { id: "stories", tone: "gospels", title: "Stories", line: "The great events, from the garden to the empty tomb", groups: [
    { id: "beginnings", title: "Beginnings", line: "The first chapters of Genesis", themes: [
      { id: "creation", title: "Creation and the fall", line: "In the beginning, the garden, the serpent", people: ["Adam", "Eve", "Cain", "Abel", "Seth"], subjects: /^creation$|garden of eden|fall of man|^(the )?fall$|cain and abel|original sin/ },
      { id: "flood", title: "Noah and the flood", line: "The ark, the rain and the rainbow", people: ["Noah", "Shem", "Ham", "Japheth"], subjects: /flood|noah/ },
    ] },
    { id: "exodus", title: "Out of Egypt", line: "Slavery, rescue and forty years", themes: [
      { id: "plagues", title: "The plagues and the sea", line: "Ten plagues, the Passover and the parted sea", books: ["EXO"], subjects: /plague|passover|red sea|^exodus$/ },
      { id: "wilderness", title: "In the wilderness", line: "Manna, the bronze serpent and forty years", books: ["NUM"], subjects: /wilderness|manna/ },
    ] },
    { id: "kingdom", title: "The land and the kingdom", line: "From Jericho to a divided throne", themes: [
      { id: "promised-land", title: "Into the promised land", line: "Jericho, Joshua and the twelve tribes", books: ["JOS"], subjects: /jericho|tribes of israel|twelve tribes/ },
      { id: "temple", title: "The tabernacle and the temple", line: "The tent in the desert, and the house Solomon built", subjects: /^temple$|tabernacle|ark of the covenant/ },
    ] },
    { id: "exile", title: "Exile and return", line: "Babylon, Persia and the walls rebuilt", themes: [
      { id: "babylon", title: "Carried to Babylon", line: "The fall of Jerusalem and the years away", subjects: /exile|captivity|babylon/ },
      { id: "esther", title: "Esther", line: "For such a time as this", books: ["EST"], people: ["Esther", "Mordecai", "Haman", "Ahasuerus"] },
      { id: "return", title: "The return", line: "Ezra, Nehemiah and the walls rebuilt", books: ["EZR", "NEH"], people: ["Ezra", "Nehemiah", "Cyrus", "Zerubbabel"] },
    ] },
    { id: "jesus", title: "The life of Jesus", line: "Bethlehem to the empty tomb", themes: [
      { id: "nativity", title: "The birth of Jesus", line: "Bethlehem, shepherds, angels and wise men", subjects: /birth of jesus|nativity|jesus'? birth|virgin birth|christ's birth|wise men|magi|incarnation/, within: GOSPELS },
      { id: "john-baptist", title: "John the Baptist", line: "A voice crying in the wilderness", people: ["John the Baptist"], subjects: /john the baptist|baptism of jesus/ },
      { id: "miracles", title: "Miracles", line: "Water into wine, the blind who see, the dead raised", subjects: /miracle|healing|walking on water|feeding/, within: GOSPELS },
      { id: "cross", title: "The cross", line: "The last supper, Gethsemane and Golgotha", places: ["Golgotha", "Calvary", "Gethsemane"], subjects: /crucif|last supper|^cross$/, within: GOSPELS },
      { id: "risen", title: "The empty tomb", line: "The third day, and the forty after", subjects: /resurrection|ascension|tomb|post-resurrection/, within: [...GOSPELS, "ACT", "1CO"] },
    ] },
    { id: "church", title: "The early church", line: "Pentecost and the journeys out", themes: [
      { id: "pentecost", title: "Pentecost and the first church", line: "Tongues of fire, Stephen and the first believers", books: ["ACT"], subjects: /early church|pentecost/ },
      { id: "journeys", title: "The missionary journeys", line: "Antioch to Rome", subjects: /missionary journey/, people: ["Barnabas", "Silas", "Timothy"] },
    ] },
  ] },
  { id: "teaching", tone: "epistles", title: "Teaching", line: "What Christians believe, a question at a time", groups: [
    { id: "god", title: "God", line: "Father, Son and Holy Spirit", themes: [
      { id: "god", title: "God and his word", line: "Who God is and how he speaks", topics: ["god"] },
      { id: "christ", title: "Jesus Christ", line: "Who he is: God made man", subjects: /^christ$|^jesus christ$|incarnation|deity of christ/ },
      { id: "spirit", title: "The Holy Spirit", line: "The Spirit's gifts, fruit and work", subjects: /holy spirit|holy ghost|spiritual gifts|fruit of the spirit|trinity/ },
    ] },
    { id: "law", title: "Law and sin", line: "What God asks, and how we fall short", themes: [
      { id: "commandments", title: "The Ten Commandments", line: "The law given on Sinai, one word at a time", topics: ["law"], subjects: /commandment/ },
      { id: "sin", title: "Sin and forgiveness", line: "What went wrong, and how it is put right", topics: ["sin"], subjects: /^sin$|forgiveness|repentance|temptation/ },
    ] },
    { id: "salvation", title: "Salvation", line: "What Christ has done", themes: [
      { id: "grace", title: "Saved by grace", line: "Grace, justification and redemption", topics: ["salvation"], subjects: /salvation|^grace$|justification|redemption|atonement/ },
      { id: "faith", title: "Faith", line: "Believing God, and living by it", subjects: /^faith$|trust|^conversion$/ },
    ] },
    { id: "life", title: "Christian life", line: "Prayer, worship and the church", themes: [
      { id: "prayer", title: "Prayer", line: "The Lord's Prayer and the life of prayer", topics: ["prayer"], subjects: /prayer/ },
      { id: "sacraments", title: "Baptism and the Lord's Supper", line: "The water and the bread and the cup", subjects: /baptism|lord's supper|communion|sacrament/ },
      { id: "worship", title: "Worship and the church", line: "Praise, the sabbath and the people of God", topics: ["church-life"], subjects: /^worship$|^praise$|^church$|sabbath/ },
    ] },
    { id: "words", title: "Words of Jesus", line: "What he taught, and how", themes: [
      { id: "parables", title: "The parables", line: "The sower, the lost sheep, the good Samaritan", subjects: /parabl/ },
      { id: "sermon", title: "The Sermon on the Mount", line: "The beatitudes, salt and light", subjects: /sermon on the mount|beatitude|jesus'? teaching/ },
    ] },
    { id: "last", title: "Last things", line: "Death, judgement and what comes after", themes: [
      { id: "life-to-come", title: "Death and the life to come", line: "Heaven, hell and eternal life", topics: ["last-things"], subjects: /heaven|^hell$|eternal life|^death$/ },
      { id: "second-coming", title: "Christ's return", line: "The second coming and the end of the age", books: ["REV"], subjects: /second coming|christ's return|end times|judgment/ },
    ] },
  ] },
  { id: "know", tone: "prophets", title: "Know your Bible", line: "The book itself: its books, places and numbers", groups: [
    { id: "books", title: "The books", line: "Sixty-six books, and who wrote them", themes: [
      { id: "books", title: "The books of the Bible", line: "Their names and their order", topics: ["the-bible"], subjects: /books of the bible|canon/ },
      { id: "authors", title: "Who wrote it", line: "Moses, David, Luke, Paul and the rest", subjects: /biblical authorship|epistles|gospels/ },
    ] },
    { id: "wisdom", title: "Poetry and wisdom", line: "Songs, proverbs and hard questions", themes: [
      { id: "psalms", title: "The Psalms", line: "Songs of praise, lament and trust", books: ["PSA"] },
      { id: "proverbs", title: "Proverbs, Job and Ecclesiastes", line: "Wise sayings and the search for meaning", books: ["PRO", "JOB", "ECC", "SNG"], topics: ["wisdom"] },
    ] },
    { id: "facts", title: "Facts and figures", line: "Where, how many, and whose son", themes: [
      { id: "places", title: "Places of the Bible", line: "Cities, rivers, mountains and seas", question: /^(where|in what (city|town|land|country)|which (city|town|mountain|river|sea|country)|what (city|town|mountain|river|sea|country))\b/i },
      { id: "numbers", title: "By the numbers", line: "How many, how old, how long", question: /\bhow (many|old|long|much)\b/i },
      { id: "families", title: "Families and family trees", line: "Fathers, sons and the long genealogies", subjects: /genealogy/ },
    ] },
  ] },
];

export const THEMES = SHELVES.flatMap((s) => s.groups.flatMap((g) => g.themes));
export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? null;

const meets = (list: string[] | undefined, values: string[] | null | undefined) => Boolean(list && values?.some((v) => list.includes(v)));

export function inTheme(theme: Theme, q: TestQuestion): boolean {
  if (theme.within && !q.books.some((b) => theme.within!.includes(b))) return false;
  return meets(theme.people, q.people) || meets(theme.places, q.places) || meets(theme.books, q.books)
    || Boolean(theme.topics && q.topic && theme.topics.includes(q.topic))
    || Boolean(theme.subjects && q.subjects?.some((s) => theme.subjects!.test(s)))
    || Boolean(theme.question?.test(q.question));
}
