import {
  Apple, Ban, Bird, BookOpen, Briefcase, Building2, CalendarDays, Church, Clock, Cloud, CloudRain, Cross, Crown, Feather, Flag, Flame, Flower2, Footprints,
  Gavel, Gem, Globe2, Hammer, HandHeart, HandHelping, Handshake, Heart, HeartCrack, HeartHandshake, HeartPulse, Home, Hourglass, House, Lamp, Landmark,
  Languages, Leaf, Link, ListChecks, LogOut, MapPin, Megaphone, MessageCircleHeart, MessageSquareWarning, Moon, Mountain, Music, PawPrint, Scale, ScrollText,
  Send, Shapes, Shield, Shirt, Skull, Smile, Sparkles, Star, Sun, Sunrise, Swords, Tent, TreeDeciduous, Triangle, Undo2, User, Users, UserX, Waves, Wheat,
  Wind, Wine, type LucideIcon,
} from "lucide-react";

/** Each topic category's icon and colour, drawn from the site's reading-chart palette (src/index.css), so both themes work. */
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
};

/** The families gathered into four sections for the Topics home, in reading order. */
export const TOPIC_SECTIONS: { id: string; title: string; description: string; categories: string[] }[] = [
  { id: "god-and-his-word", title: "God and his word", description: "Who God is, the person and work of Christ, the Scriptures, and the people he gathers.", categories: ["god", "christ", "scripture", "church"] },
  { id: "sin-and-salvation", title: "Sin, salvation and the life to come", description: "What went wrong, how God puts it right, how the saved now live, and what lies beyond death.", categories: ["sin", "salvation", "christian-life", "last-things"] },
  { id: "israel-and-the-nations", title: "Israel and the nations", description: "The worship God gave Israel, and the tribes, nations and empires of the story.", categories: ["worship-in-israel", "peoples"] },
  { id: "life-in-the-world", title: "Life in the Bible's world", description: "Home, work and government, and the land, creatures and customs of everyday life.", categories: ["society", "creation"] },
];

/** One icon per group, so each reads as its own card. */
const GROUP_ICON: Record<string, LucideIcon> = {
  "the-godhead": Triangle, "attributes-of-god": Gem, "works-of-god": Sparkles, "holy-spirit": Wind,
  "person-of-christ": User, "titles-and-offices": Crown, "life-and-ministry": Footprints, "cross-resurrection-return": Cross, "believers-and-christ": Link,
  "word-of-god": BookOpen, prophecy: Megaphone, "language-and-learning": Languages,
  "sin-and-the-fall": Apple, "grace-and-redemption": HandHeart, "faith-and-repentance": Undo2, "justification-and-adoption": Scale, "sanctification-and-perseverance": Mountain,
  "gods-people": Users, "graces-of-the-heart": Flower2, "godly-conduct": HeartHandshake, "obedience-and-duties": ListChecks, prayer: MessageCircleHeart,
  "worship-and-devotion": Music, "trials-and-afflictions": CloudRain, "joy-peace-comfort": Smile,
  "sins-of-the-heart": HeartCrack, "sins-of-speech": MessageSquareWarning, "sins-of-conduct": Ban, "turning-from-god": LogOut, "idolatry-and-false-worship": Shapes,
  "the-ungodly": UserX, "judgment-on-sin": Gavel,
  "the-church": Church, "ministry-and-mission": Send, "ordinances-and-fellowship": Wine,
  "marriage-and-family": Heart, "work-and-wealth": Briefcase, "government-and-justice": Landmark, "neighbours-and-the-poor": HandHelping,
  "tabernacle-and-temple": Tent, "priests-and-levites": Lamp, "sacrifices-and-offerings": Flame, "feasts-and-sabbaths": CalendarDays, "law-and-covenant": ScrollText,
  "tribes-of-israel": Flag, "israel-and-the-jews": Star, "leaders-and-servants-of-god": Shield, "neighbouring-nations": Handshake, "empires-and-gentiles": Building2, "lands-and-places": MapPin,
  "land-animals": PawPrint, "birds-fish-creeping-things": Bird, "plants-and-trees": TreeDeciduous, "heavens-and-earth": Moon, "waters-and-weather": Waves,
  "farming-and-food": Wheat, "homes-and-buildings": House, "dress-and-customs": Shirt, "materials-and-crafts": Hammer, "war-and-weapons": Swords,
  "body-and-health": HeartPulse, "time-and-seasons": Clock,
  "death-and-the-grave": Skull, "resurrection-and-judgment": Sunrise, "heaven-and-hell": Cloud, "angels-and-spirits": Feather,
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
};

export const sectionOf = (categoryId: string) => TOPIC_SECTIONS.find((section) => section.categories.includes(categoryId));
