// One icon per children's lesson, shown inside its circle on the path (owner, 2026-10-24: "the circle itself should be
// an icon", the number outside it). Bible lessons by their number in Hurlbut's course; the "What we believe" sets by
// their set number. Each picks the one thing a child would remember from the lesson.
import {
  Anchor, Apple, BookOpen, BrickWall, Castle, Cat, Church, CloudLightning, Coins, Compass, Cross, Crosshair, Crown, DoorOpen,
  Droplet, Droplets, Ear, Eye, Feather, Fish, Flag, Flame, Gavel, Gem, Globe, Grape, Hammer, HandHeart, Heart, HeartHandshake,
  Hourglass, House, Key, Landmark, Leaf, Link, ListChecks, Lock, Mail, Map, MessageCircle, Mountain, MountainSnow, Music,
  PersonStanding, Rainbow, Route, Sailboat, Scale, Scroll, Shield, Shirt, Signpost, Smile, Sparkles, Star, Sun, Sunrise, Sword,
  Swords, Tent, TreeDeciduous, TreePalm, Users, Waves, Wheat, Wine, Zap, Baby, Footprints, type LucideIcon,
} from "lucide-react";
import type { Lesson } from "./data";

const STORIES: Record<number, LucideIcon> = {
  1: TreePalm, 2: Rainbow, 3: Tent, 4: Signpost, 5: Users, 6: Sparkles, 7: Wheat, 8: Shirt,
  9: Baby, 10: Waves, 11: Mountain, 12: BrickWall, 13: Flag, 19: Map,
  14: Shield, 15: Swords, 16: Ear, 17: Crown, 18: Users, 20: Sword, 21: Music, 22: Crosshair, 23: Hourglass, 24: Castle,
  25: TreeDeciduous, 26: Scale, 27: Landmark, 28: ListChecks, 29: Route, 30: Flame, 31: Flame,
  32: Droplets, 33: Fish, 34: Footprints, 35: Crown, 36: Scroll, 37: Link, 38: Cat, 39: Hammer, 40: Gem, 41: Hourglass, 42: Users,
  43: Feather, 44: Baby, 45: Star, 46: BookOpen, 47: Droplets, 48: Sun, 49: Wine, 50: Droplet, 51: House, 52: Sparkles,
  53: BookOpen, 54: HandHeart, 55: CloudLightning, 56: Heart, 57: Lock, 58: Wheat, 59: MountainSnow, 60: Users, 61: Eye,
  62: HeartHandshake, 63: DoorOpen, 64: MessageCircle, 65: Smile, 66: Coins, 67: TreePalm, 68: Landmark, 69: Leaf,
  74: Fish, 75: Users, 76: Map,
  70: Grape, 71: Gavel, 72: Cross, 73: Sunrise,
  77: Flame, 78: Key, 79: Signpost, 80: Zap, 81: Anchor, 82: Globe, 83: Route, 84: Compass, 85: Link, 86: Sailboat, 87: Mail,
  88: Church,
};

const BELIEF: Record<number, LucideIcon> = {
  1: Sun, 2: Globe, 3: PersonStanding, 4: Apple, 5: Heart, 6: Cross, 7: HandHeart, 8: Crown, 9: Smile, 10: MessageCircle,
  11: Grape, 12: Sunrise,
};

export const lessonIcon = (lesson: Lesson): LucideIcon =>
  (lesson.part.track === "belief" ? BELIEF[lesson.n] : STORIES[lesson.n]) ?? BookOpen;
