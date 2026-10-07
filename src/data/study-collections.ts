import { BookOpen, Crown, Layers, Mail, Map, Network, Quote, Sparkles, Users } from "lucide-react";

export const STUDY_COLLECTIONS = [
  { id: "gospels", path: "/study/gospels", label: "Jesus & the Gospels", lens: "Life & teaching", color: "gospels", icon: Quote, related: ["gospels", "miracles", "references", "people"] },
  { id: "references", path: "/study/references", label: "Connections in Scripture", lens: "Passages in conversation", color: "poetry", icon: Network, related: ["references", "structure", "gospels", "names"] },
  { id: "structure", path: "/study/structure", label: "The shape of the Bible", lens: "Books & literary forms", color: "history", icon: BookOpen, related: ["structure", "letters", "versions", "references"] },
  { id: "people", path: "/study/people", label: "People & genealogies", lens: "Lives & lineages", color: "history", icon: Users, related: ["people", "places", "gospels", "letters"] },
  { id: "places", path: "/study/atlas", label: "Places & journeys", lens: "The world of the Bible", color: "poetry", icon: Map, related: ["places", "people", "gospels", "references"] },
  { id: "miracles", path: "/study/miracles", label: "Miracles & encounters", lens: "Signs & wonders", color: "acts", icon: Sparkles, related: ["miracles", "gospels", "people", "names"] },
  { id: "letters", path: "/study/letters", label: "Letters & their message", lens: "Words to communities", color: "epistles", icon: Mail, related: ["letters", "structure", "people", "references"] },
  { id: "names", path: "/study/names", label: "Names & descriptions of God", lens: "His character, revealed", color: "revelation", icon: Crown, related: ["names", "references", "gospels", "miracles"] },
  { id: "versions", path: "/study/versions", label: "Versions & languages", lens: "Editions & contents", color: "acts", icon: Layers, related: ["versions", "structure", "references", "gospels"] },
] as const;

export type StudyCollectionId = (typeof STUDY_COLLECTIONS)[number]["id"];
