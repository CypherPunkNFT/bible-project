import {
  Activity, Anchor, Apple, Baby, Ban, Bird, BookOpen, BookText, Briefcase, Building, Building2, CalendarDays, Castle, Church, Clock, Cloud, CloudRain,
  Coins, Columns3, Compass, Cross, Crown, DoorOpen, Droplets, Eye, Feather, Fish, Flag, Flame, Flower, Flower2, Footprints, Gavel, Gem, GitFork, Globe2,
  Hammer, HandHeart, HandHelping, Handshake, Hash, Heart, HeartCrack, HeartHandshake, HeartPulse, Home, Hourglass, House, Infinity as InfinityIcon, Key,
  Lamp, Landmark, Languages, Leaf, Library, Link, ListChecks, LogOut, MapPin, Megaphone, MessageCircleHeart, MessageSquareWarning, Moon,
  Mountain, MountainSnow, Music, Music4, Network, PenTool, Pickaxe, PawPrint, PersonStanding, Puzzle, Pyramid, Route, Scale, Scroll, ScrollText, Send,
  Shapes, Shield, ShieldHalf, Ship, Shirt, Skull, Smile, Sparkles, Sprout, Star, Stethoscope, Sun, Sunrise, Swords, Tent, TentTree, TreeDeciduous,
  Trees, Triangle, Undo2, User, UserRound, Users, UsersRound, UserX, Utensils, WandSparkles, Waves, Wheat, Wind, Wine, type LucideIcon,
} from "lucide-react";

/** Each topic family's icon and colour, drawn from the site's reading-chart palette (src/index.css), so both themes work. */
const STYLE: Record<string, { icon: LucideIcon; tone: string }> = {
  god: { icon: Sun, tone: "epistles" },
  christ: { icon: Crown, tone: "gospels" },
  scripture: { icon: ScrollText, tone: "prophets" },
  salvation: { icon: Heart, tone: "revelation" },
  "christian-life": { icon: BookOpen, tone: "poetry" },
  sin: { icon: Flame, tone: "history" },
  church: { icon: Church, tone: "acts" },
  society: { icon: Home, tone: "history" },
  "worship-in-israel": { icon: Landmark, tone: "epistles" },
  peoples: { icon: Globe2, tone: "prophets" },
  creation: { icon: Leaf, tone: "poetry" },
  "last-things": { icon: Hourglass, tone: "apocrypha" },
  religions: { icon: Eye, tone: "history" },
  symbols: { icon: Key, tone: "prophets" },
  "people-early": { icon: TentTree, tone: "epistles" },
  "people-kings": { icon: Castle, tone: "revelation" },
  "people-prophets": { icon: Megaphone, tone: "prophets" },
  "people-nt": { icon: Fish, tone: "gospels" },
  "people-women": { icon: Flower, tone: "acts" },
  "people-nations": { icon: Pyramid, tone: "history" },
  "people-genealogies": { icon: Network, tone: "apocrypha" },
  "places-cities": { icon: Building, tone: "history" },
  "places-landscape": { icon: MountainSnow, tone: "poetry" },
  "home-life": { icon: Utensils, tone: "epistles" },
  trades: { icon: Coins, tone: "acts" },
  war: { icon: Swords, tone: "revelation" },
  health: { icon: Stethoscope, tone: "poetry" },
  learning: { icon: Library, tone: "prophets" },
};

/** The families gathered into sections for the Topics home, in reading order. */
export const TOPIC_SECTIONS: { id: string; title: string; description: string; categories: string[] }[] = [
  { id: "god-and-his-word", title: "God and his word", description: "Who God is, how he speaks in Scripture, and the pictures and patterns that point to Christ.", categories: ["god", "scripture", "symbols"] },
  { id: "jesus-and-his-church", title: "Jesus and his church", description: "The person and work of Christ, the people around him and the first believers, and the church he gathers.", categories: ["christ", "people-nt", "church"] },
  { id: "sin-and-salvation", title: "Sin, salvation and the life to come", description: "What went wrong, how God puts it right, how the saved now live, and what lies beyond death.", categories: ["sin", "salvation", "christian-life", "last-things"] },
  { id: "worship-and-religion", title: "Worship and other gods", description: "The worship God gave Israel, and the gods and practices of the nations.", categories: ["worship-in-israel", "religions"] },
  { id: "people-of-the-bible", title: "People of the Bible", description: "Patriarchs, kings, prophets and women of faith, the rulers of the nations, and every name in the family lists.", categories: ["people-early", "people-kings", "people-prophets", "people-women", "people-nations", "people-genealogies"] },
  { id: "places-of-the-bible", title: "Places of the Bible", description: "The nations and tribes, every city and town, and the mountains, waters and wildernesses of the story.", categories: ["peoples", "places-cities", "places-landscape"] },
  { id: "life-in-the-world", title: "Life in the Bible's world", description: "Home, work and government, war and health, music and learning, and the creatures of everyday life.", categories: ["society", "home-life", "trades", "war", "health", "learning", "creation"] },
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
};

export function categoryStyle(id: string): { Icon: LucideIcon; color: string; tab: string; box: string } {
  const style = STYLE[id] ?? { icon: BookOpen, tone: "apocrypha" };
  return { Icon: style.icon, color: `var(--${style.tone})`, tab: `var(--${style.tone}-tab)`, box: `var(--${style.tone}-box)` };
}

export const groupIcon = (id: string): LucideIcon => GROUP_ICON[id] ?? BookOpen;

/** The short line above each family's name on its card. */
export const FAMILY_EYEBROW: Record<string, string> = {
  god: "Who God is", christ: "The Son", scripture: "God speaks", church: "His people gathered",
  sin: "What went wrong", salvation: "Made right", "christian-life": "Walking in faith", "last-things": "What lies ahead",
  "worship-in-israel": "Tabernacle & temple", peoples: "Tribes & empires", society: "Home & community", creation: "The world he made",
  religions: "The gods of the nations", symbols: "Pictures of the gospel", "people-early": "In the beginning", "people-kings": "Thrones & armies",
  "people-prophets": "Thus says the Lord", "people-nt": "Followers of the Way", "people-women": "Women of faith", "people-nations": "Pharaohs & emperors",
  "people-genealogies": "Every name remembered", "places-cities": "Town by town", "places-landscape": "The lie of the land", "home-life": "Daily bread",
  trades: "Work & the marketplace", war: "Battles & sieges", health: "Sickness & healing", learning: "Songs & scrolls",
};

export const sectionOf = (categoryId: string) => TOPIC_SECTIONS.find((section) => section.categories.includes(categoryId));
