import {
  Activity, Anchor, Apple, Baby, Ban, Bird, BookOpen, BookText, Briefcase, Building2, CalendarDays, Castle, Church, Clock, Cloud, CloudRain,
  Coins, Columns3, Compass, Cross, Crown, DoorOpen, Droplets, Eye, Feather, Fish, Flag, Flame, Flower, Flower2, Footprints, Gavel, Gem, GitFork, Globe2,
  Hammer, HandHeart, HandHelping, Handshake, Hash, Heart, HeartCrack, HeartHandshake, HeartPulse, Home, Hourglass, House, Infinity as InfinityIcon, Key,
  Lamp, Landmark, Languages, Leaf, Library, Link, ListChecks, LogOut, MapPin, Megaphone, MessageCircleHeart, MessageSquareWarning, Moon,
  Mountain, MountainSnow, Music, Music4, PenTool, Pickaxe, PawPrint, PersonStanding, Puzzle, Pyramid, Route, Scale, Scroll, ScrollText, Send,
  Shapes, Shield, ShieldHalf, Ship, Shirt, Skull, Smile, Sparkles, Sprout, Star, Stethoscope, Sun, Sunrise, Swords, Tent, TentTree, TreeDeciduous,
  Trees, Triangle, Undo2, User, UserRound, Users, UsersRound, UserX, Utensils, WandSparkles, Waves, Wheat, Wind, Wine, BookCopy, BookMarked, Scale as ScaleIcon,
  Sunrise as SunriseIcon, type LucideIcon,
} from "lucide-react";

/** Each topic family's icon and colour, drawn from the site's reading-chart palette (src/index.css), so both themes work. */
const STYLE: Record<string, { icon: LucideIcon; tone: string }> = {
  god: { icon: Sun, tone: "epistles" }, "god-works": { icon: Sparkles, tone: "epistles" }, "god-names": { icon: InfinityIcon, tone: "epistles" },
  spirit: { icon: Wind, tone: "poetry" }, "bible-books": { icon: BookCopy, tone: "prophets" }, scripture: { icon: ScrollText, tone: "prophets" },
  symbols: { icon: Key, tone: "prophets" },
  christ: { icon: Crown, tone: "gospels" }, "christ-titles": { icon: BookMarked, tone: "gospels" }, "christ-life": { icon: Footprints, tone: "gospels" },
  "christ-miracles": { icon: Sparkles, tone: "gospels" }, "christ-teaching": { icon: Sprout, tone: "gospels" }, "christ-cross": { icon: Cross, tone: "gospels" },
  "people-nt": { icon: Fish, tone: "gospels" }, church: { icon: Church, tone: "acts" },
  sin: { icon: Flame, tone: "history" }, vices: { icon: Ban, tone: "history" }, judgment: { icon: Gavel, tone: "history" },
  salvation: { icon: Heart, tone: "revelation" }, "christian-life": { icon: BookOpen, tone: "poetry" }, devotion: { icon: MessageCircleHeart, tone: "poetry" },
  trials: { icon: CloudRain, tone: "poetry" }, "last-things": { icon: Hourglass, tone: "apocrypha" },
  "worship-in-israel": { icon: Landmark, tone: "epistles" }, priesthood: { icon: Lamp, tone: "epistles" }, sacrifices: { icon: Flame, tone: "epistles" },
  feasts: { icon: CalendarDays, tone: "epistles" }, law: { icon: ScaleIcon, tone: "epistles" }, religions: { icon: Eye, tone: "history" },
  "era-beginning": { icon: Sprout, tone: "epistles" }, "era-patriarchs": { icon: TentTree, tone: "epistles" }, "era-exodus": { icon: Footprints, tone: "epistles" },
  "era-judges": { icon: Shield, tone: "revelation" }, "era-kingdom": { icon: Crown, tone: "revelation" }, "era-kings": { icon: Castle, tone: "revelation" },
  "era-exile": { icon: Route, tone: "prophets" }, "people-women": { icon: Flower, tone: "acts" }, "people-nations": { icon: Pyramid, tone: "history" },
  jerusalem: { icon: Castle, tone: "history" }, judah: { icon: Mountain, tone: "history" }, "samaria-galilee": { icon: Fish, tone: "history" },
  "transjordan-coast": { icon: Anchor, tone: "history" }, "egypt-sinai": { icon: Pyramid, tone: "history" }, empires: { icon: Building2, tone: "history" },
  peoples: { icon: Globe2, tone: "prophets" }, "places-landscape": { icon: MountainSnow, tone: "poetry" },
  family: { icon: Home, tone: "history" }, society: { icon: Gavel, tone: "history" }, trades: { icon: Coins, tone: "acts" }, crafts: { icon: Gem, tone: "acts" },
  "home-life": { icon: Utensils, tone: "epistles" }, war: { icon: Swords, tone: "revelation" }, health: { icon: Stethoscope, tone: "poetry" },
  learning: { icon: Library, tone: "prophets" }, creation: { icon: Leaf, tone: "poetry" },
};

/** The families gathered into sections for the Topics home, in reading order. */
export const TOPIC_SECTIONS: { id: string; title: string; description: string; categories: string[] }[] = [
  { id: "god-and-his-word", title: "God and his word", description: "Who God is and what he does, his names, the Holy Spirit, and the Bible: its books, its story and its pictures.", categories: ["god", "god-works", "god-names", "spirit", "bible-books", "scripture", "symbols"] },
  { id: "jesus-and-his-church", title: "Jesus and his church", description: "Who Jesus is, his names, life, miracles, parables and cross, the people around him, and the church he gathers.", categories: ["christ", "christ-titles", "christ-life", "christ-miracles", "christ-teaching", "christ-cross", "people-nt", "church"] },
  { id: "sin-and-salvation", title: "Sin, salvation and the life to come", description: "What went wrong and its judgment, how God puts it right, how the saved now live, and what lies beyond death.", categories: ["sin", "vices", "judgment", "salvation", "christian-life", "devotion", "trials", "last-things"] },
  { id: "worship-and-religion", title: "Worship and other gods", description: "The worship God gave Israel, its priests, offerings, feasts and law, and the gods and practices of the nations.", categories: ["worship-in-israel", "priesthood", "sacrifices", "feasts", "law", "religions"] },
  { id: "people-of-the-bible", title: "People of the Bible", description: "Everyone in the Old Testament story, era by era, with the women of the Bible and the rulers of the nations.", categories: ["era-beginning", "era-patriarchs", "era-exodus", "era-judges", "era-kingdom", "era-kings", "era-exile", "people-women", "people-nations"] },
  { id: "places-of-the-bible", title: "Places of the Bible", description: "Jerusalem, the land region by region, the empires around it, its nations and tribes, and its mountains and waters.", categories: ["jerusalem", "judah", "samaria-galilee", "transjordan-coast", "egypt-sinai", "empires", "peoples", "places-landscape"] },
  { id: "life-in-the-world", title: "Life in the Bible's world", description: "Family, government and law, work and crafts, home, war and health, music and learning, and the created world.", categories: ["family", "society", "trades", "crafts", "home-life", "war", "health", "learning", "creation"] },
];

/** One icon per group, so each reads as its own card. */
const GROUP_ICON: Record<string, LucideIcon> = {
  "the-godhead": Triangle, "attributes-of-god": Gem, "works-of-god": Sparkles, "holy-spirit": Wind, "names-of-god": InfinityIcon,
  "person-of-christ": User, "titles-and-offices": Crown, "life-and-ministry": Footprints, "cross-resurrection-return": Cross, "believers-and-christ": Link,
  "word-of-god": BookOpen, prophecy: Megaphone, "language-and-learning": Languages,
  "sin-and-the-fall": Apple, "grace-and-redemption": HandHeart, "faith-and-repentance": Undo2, "justification-and-adoption": Scale, "sanctification-and-perseverance": Mountain,
  "gods-people": Users, "graces-of-the-heart": Flower2, "godly-conduct": HeartHandshake, "obedience-and-duties": ListChecks, prayer: MessageCircleHeart,
  "worship-and-devotion": Music, "trials-and-afflictions": CloudRain, "joy-peace-comfort": Smile,
  "sins-of-the-heart": HeartCrack, "sins-of-speech": MessageSquareWarning, "sins-of-conduct": Ban, "turning-from-god": LogOut, "idolatry-and-false-worship": Shapes,
  "the-ungodly": UserX, "judgment-on-sin": Gavel,
  "the-church": Church, "ministry-and-mission": Send, "ordinances-and-fellowship": Wine,
  "marriage-and-family": Heart, "work-and-wealth": Briefcase, "government-and-justice": Landmark, "neighbours-and-the-poor": HandHelping, "crime-and-punishment": Gavel,
  "tabernacle-and-temple": Tent, "priests-and-levites": Lamp, "sacrifices-and-offerings": Flame, "feasts-and-sabbaths": CalendarDays, "law-and-covenant": ScrollText,
  "holy-things-and-vessels": Columns3, "vows-and-cleanness": Droplets,
  "tribes-of-israel": Flag, "israel-and-the-jews": Star, "leaders-and-servants-of-god": Shield, "neighbouring-nations": Handshake, "empires-and-gentiles": Building2, "lands-and-places": MapPin,
  "land-animals": PawPrint, "birds-fish-creeping-things": Bird, "plants-and-trees": TreeDeciduous, "heavens-and-earth": Moon, "waters-and-weather": Waves,
  "farming-and-food": Wheat, "homes-and-buildings": House, "dress-and-customs": Shirt, "materials-and-crafts": Hammer, "war-and-weapons": Swords,
  "body-and-health": HeartPulse, "time-and-seasons": Clock,
  "death-and-the-grave": Skull, "resurrection-and-judgment": Sunrise, "heaven-and-hell": Cloud, "angels-and-spirits": Feather,
  "false-gods-and-idols": Shapes, "magic-and-divination": WandSparkles, "pagan-practices": Flame,
  "types-and-shadows": Puzzle, "figures-and-metaphors": Sprout, "parables-and-allegories": BookText, "signs-and-numbers": Hash,
  "first-generations": Sprout, patriarchs: TentTree, "exodus-generation": Footprints, "conquest-and-judges": Shield,
  "kings-of-judah": Crown, "kings-of-israel": Castle, "court-and-officials": Scroll, "mighty-men": ShieldHalf,
  "prophets-and-seers": Megaphone, priests: Lamp, "levites-and-singers": Music4,
  "jesus-family": Baby, "the-apostles": Fish, "followers-and-friends": Footprints, "early-church-people": Send, "nt-rulers-and-opponents": Gavel,
  "matriarchs-and-mothers": Baby, "queens-and-royal-women": Crown, "prophetesses-and-leaders": Megaphone, "women-in-the-gospels-and-church": Flower2, "other-women": UserRound,
  "foreign-kings": Pyramid, "foreign-figures": Compass,
  "line-of-judah": Crown, "line-of-levi": Lamp, "line-of-benjamin": GitFork, "northern-tribes": Flag, "lines-of-the-nations": Globe2, "returned-exiles": Route, "other-names": UsersRound,
  "judah-and-jerusalem": Castle, "central-hill-country": Mountain, "galilee-and-the-north": Fish, "coast-and-philistia": Anchor, "beyond-the-jordan": Trees,
  "egypt-and-sinai": Pyramid, "syria-and-mesopotamia": Building2, "asia-minor-greece-rome": Columns3,
  "mountains-and-hills": MountainSnow, "rivers-and-seas": Waves, "valleys-and-plains": Wheat, wilderness: Sun, "wells-springs-pools": Droplets, landmarks: DoorOpen,
  occupations: Pickaxe, "money-and-measures": Coins, "travel-and-ships": Ship,
  "armies-and-soldiers": PersonStanding, "battles-and-sieges": Swords,
  "sickness-and-healing": Activity,
  "music-and-instruments": Music4, "writing-and-learning": PenTool,
  "books-law": ScrollText, "books-history": Castle, "books-poetry": Music4, "books-prophets": Megaphone, "books-gospels": Fish, "books-letters": Send,
  "bible-making": BookCopy, "miracles-overview": Sparkles, "miracles-healing": HandHeart, "miracles-nature": Waves, "miracles-demons": ShieldHalf,
  "miracles-raising": SunriseIcon, "parables-of-jesus": Sprout, "jerusalem-city": Castle, "jerusalem-landmarks": DoorOpen,
  ...Object.fromEntries(["beginning", "patriarchs", "exodus", "judges", "kingdom", "kings", "exile"].flatMap((era) => [
    [`${era}-leaders`, Crown], [`${era}-holy`, Lamp], [`${era}-officials`, ShieldHalf], [`${era}-families`, UsersRound]])),
};

export function categoryStyle(id: string): { Icon: LucideIcon; color: string; tab: string; box: string } {
  const style = STYLE[id] ?? { icon: BookOpen, tone: "apocrypha" };
  return { Icon: style.icon, color: `var(--${style.tone})`, tab: `var(--${style.tone}-tab)`, box: `var(--${style.tone}-box)` };
}

export const groupIcon = (id: string): LucideIcon => GROUP_ICON[id] ?? BookOpen;

/** The short line above each family's name on its card. */
export const FAMILY_EYEBROW: Record<string, string> = {
  god: "His nature", "god-works": "God at work", "god-names": "How he is called", spirit: "The Comforter", "bible-books": "Genesis to Revelation",
  scripture: "God speaks", symbols: "Pictures of the gospel", christ: "The Son", "christ-titles": "Messiah, Lord, King", "christ-life": "Born, lived, taught",
  "christ-miracles": "Signs and wonders", "christ-teaching": "Stories that teach", "christ-cross": "Died, rose, returns", "people-nt": "Followers of the Way",
  church: "His people gathered", sin: "What went wrong", vices: "Sins named", judgment: "God judges", salvation: "Made right", "christian-life": "Walking in faith",
  devotion: "Drawing near", trials: "In suffering", "last-things": "What lies ahead", "worship-in-israel": "Where God dwelt", priesthood: "Those who served",
  sacrifices: "Blood and fire", feasts: "Appointed times", law: "Commandments", religions: "The gods of the nations", "era-beginning": "Genesis 1–11",
  "era-patriarchs": "Genesis 12–50", "era-exodus": "Exodus to Deuteronomy", "era-judges": "Joshua to Ruth", "era-kingdom": "1 Samuel to 1 Kings 11",
  "era-kings": "1 Kings 12 to 2 Kings", "era-exile": "Daniel to Nehemiah", "people-women": "Women of faith", "people-nations": "Pharaohs and emperors",
  jerusalem: "The holy city", judah: "The southern hills", "samaria-galilee": "The central hills and the north", "transjordan-coast": "East and west",
  "egypt-sinai": "Out of Egypt", empires: "The wider world", peoples: "Tribes and nations", "places-landscape": "The lie of the land", family: "Home and household",
  society: "Rulers and courts", trades: "Work and the marketplace", crafts: "Gold, gems and spices", "home-life": "Daily bread", war: "Battles and sieges",
  health: "Sickness and healing", learning: "Songs and scrolls", creation: "The world he made",
};

/** Where a family's subject is studied in depth elsewhere on the site. */
export const FAMILY_STUDY: Record<string, { label: string; to: string }[]> = {
  "god-names": [{ label: "Names & descriptions of God: 302 names", to: "/study/names" }],
  "christ-life": [{ label: "Jesus & the Gospels: 185 events, harmonised", to: "/study/gospels" }],
  "christ-miracles": [{ label: "Miracles & encounters: the 35 miracles of Jesus", to: "/study/miracles" }],
  "bible-books": [{ label: "The shape of the Bible", to: "/study/structure" }, { label: "Letters & their message", to: "/study/letters" }],
  "people-nt": [{ label: "People & genealogies", to: "/study/people" }],
  "people-women": [{ label: "People & genealogies", to: "/study/people" }], "people-nations": [{ label: "People & genealogies", to: "/study/people" }],
  ...Object.fromEntries(["beginning", "patriarchs", "exodus", "judges", "kingdom", "kings", "exile"].map((era) => [`era-${era}`, [{ label: "People & genealogies: everyone, era by era", to: "/study/people" }]])),
  ...Object.fromEntries(["jerusalem", "judah", "samaria-galilee", "transjordan-coast", "egypt-sinai", "empires", "places-landscape"].map((id) => [id, [{ label: "The atlas map", to: "/study/atlas/map" }]])),
};

export const sectionOf = (categoryId: string) => TOPIC_SECTIONS.find((section) => section.categories.includes(categoryId));
