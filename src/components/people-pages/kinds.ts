import type { OpenQuestion as LetterQuestion } from "@/data/letters/types";
import type { EventKind, OpenQuestion, ProphetEra as ProphetEraId, ProphetKind, Realm, Ruler, RulerKind } from "@/data/people-pages/types";
import { prophetEra, type ProphetEra } from "@/lib/prophet-eras";
import type { RulerSummary, SpecialPage } from "@/lib/people-pages-index";

/**
 * How each kind of ruler is shown (Research/People/PRESENTATION.md §3.10): its glow colour (the Letters pages' --lg),
 * the name of its page, and the words for its verdict and events. Women rulers share the kings' gold; nothing is
 * styled differently for them.
 */
const EMPIRE_GLOW: Partial<Record<Realm, string>> = {
  egypt: "var(--history)", aram: "var(--acts)", assyria: "var(--prophets)", babylon: "var(--gospels)", persia: "var(--poetry)", rome: "var(--apocrypha)", other: "var(--history)",
};

/** The realms beyond Israel: each has its own lane on the time lines (Rome, shared with the Herods, is apart). */
export const WORLD_REALMS: Realm[] = ["egypt", "aram", "assyria", "babylon", "persia", "other"];

type RulerLike = { kind: RulerKind; realm: Realm; title: string };

/** A king or reigning queen of another nation (the queen of Sheba, Candace, the queens of Persia); not Athaliah. */
export const isForeign = (r: Pick<RulerLike, "kind" | "realm">) => r.kind === "foreign" || (r.kind === "queen" && WORLD_REALMS.includes(r.realm));

/** A king's wife who did not reign (Esther, Vashti), as the data's own title says ("wife of King Ahasuerus"). */
export const isConsort = (r: Pick<RulerLike, "kind" | "title">) => r.kind === "queen" && /\bwife of\b/i.test(r.title);

export function glowFor(kind: RulerKind, realm: Realm): string {
  if (kind === "queen" && WORLD_REALMS.includes(realm)) return EMPIRE_GLOW[realm] ?? "var(--history)";
  switch (kind) {
    case "judge": return "var(--pp-judge)";
    case "foreign": return EMPIRE_GLOW[realm] ?? "var(--history)";
    case "governor": return "var(--poetry)";
    case "herod": return "var(--revelation)";
    case "roman": return "var(--apocrypha)";
    default: return "var(--epistles)";
  }
}

export const APOSTLE_GLOW = "var(--role-disciple)";

/**
 * The prophets' colour on Prophets through time (the Prophets section's blue, tone "prophets"); the prophets Scripture
 * says were not sent keep the guide's quiet grey (tone "apocrypha", drawn dashed there).
 */
export const prophetGlow = (kind: ProphetKind) => (kind === "false" ? "var(--apocrypha)" : "var(--prophets)");

/** The glow of one special page: the ruler's kind, the apostles' purple, the prophets' blue. */
export function pageGlow(page: SpecialPage): string {
  return page.aspect === "rule" ? glowFor(page.summary.kind, page.summary.realm) : page.aspect === "mission" ? APOSTLE_GLOW : prophetGlow(page.summary.kind);
}

/** The prophet pages' eras, as the bands of Prophets through time (src/lib/prophet-eras.ts) name and date them. */
const ERA_BAND: Record<ProphetEraId, string> = {
  wilderness: "Egypt and Wilderness", judges: "Judges", united: "United Monarchy", divided: "Divided Monarchy", exile: "Exile and Return", nt: "New Testament",
};
export const prophetEraBand = (era: ProphetEraId): ProphetEra => prophetEra(ERA_BAND[era]);

/** What Scripture calls them, for the hero and the entry card ("Seer", "Prophetess"). A prophet Scripture says was not
 *  sent is named by the page's title, in the text's own words, never by a label of ours. */
export function prophetCalled(kind: ProphetKind, sex: "M" | "F" | "G" | ""): string {
  switch (kind) {
    case "prophetess": return "Prophetess";
    case "seer": return "Seer";
    case "singer": return "Prophesied with harps";
    case "nt": return sex === "F" ? "Prophetess" : sex === "G" ? "Prophets" : "Prophet";
    default: return sex === "F" ? "Prophetess" : sex === "G" ? "Prophets" : "Prophet";
  }
}

type Sex = "M" | "F" | "G" | "";

/** "his", "her" or "their" (a page about a couple), and the matching object word. */
export const pronouns = (sex: Sex | undefined) => (sex === "G" ? { their: "their", them: "them" } : sex === "F" ? { their: "her", them: "her" } : { their: "his", them: "him" });

/** The second half of the person ↔ page switch. */
export function aspectLabel(ruler: Pick<RulerLike, "kind" | "title">): string {
  const { kind } = ruler;
  if (isConsort(ruler)) return "As queen";
  return kind === "judge" ? "As judge" : kind === "leader" ? "As leader" : kind === "governor" ? "As governor" : kind === "herod" || kind === "roman" ? "The rule" : "The reign";
}

/** The page's own heading: "The reign", "Her time as judge", "His governorship", "Her time as queen". */
export function pageHeading(ruler: Pick<RulerLike, "kind" | "title">, sex: Sex): string {
  const { kind } = ruler;
  const their = sex === "F" ? "Her" : "His";
  if (isConsort(ruler)) return `${their} time as queen`;
  if (kind === "judge") return `${their} time as judge`;
  if (kind === "leader") return `${their} time as leader`;
  if (kind === "governor") return `${their} governorship`;
  if (kind === "roman" || kind === "herod") return `${their} rule`;
  return "The reign";
}

export const REALM_LABEL: Record<Realm, string> = {
  tribes: "The tribes of Israel", united: "The united kingdom", israel: "Israel (the north)", judah: "Judah (the south)", egypt: "Egypt",
  aram: "Aram (Syria)", assyria: "Assyria", babylon: "Babylon", persia: "Persia", rome: "Rome", other: "The nations",
};

/** Short lane names for the ribbons. */
export const LANE_LABEL: Record<string, string> = {
  egypt: "Egypt", aram: "Aram", assyria: "Assyria", babylon: "Babylon", persia: "Persia", other: "Other nations",
  tribes: "Leaders & judges", united: "United kingdom", israel: "Israel", judah: "Judah", governors: "Governors", rome: "Herods & Rome",
};

/**
 * The lane a ruler sits in on the time lines: their realm's own lane (a queen in her realm's, Athaliah in Judah's), the
 * governors after the exile together, and the Herods with the Romans.
 */
export function laneOf(ruler: Pick<RulerSummary, "kind" | "realm">): string {
  if (ruler.kind === "governor") return "governors";
  if (ruler.kind === "herod" || ruler.kind === "roman" || ruler.realm === "rome") return "rome";
  return ruler.realm;
}

export const VERDICT: Record<Ruler["verdictTone"], { symbol: string; label: string; spoken: string }> = {
  right: { symbol: "✓", label: "Did right", spoken: "did right in the eyes of the LORD" },
  evil: { symbol: "✕", label: "Did evil", spoken: "did evil in the eyes of the LORD" },
  mixed: { symbol: "◐", label: "Mixed", spoken: "a mixed verdict" },
  none: { symbol: "●", label: "No verdict formula", spoken: "no regnal verdict in Scripture" },
};

export const EVENT_MARK: Record<EventKind, { symbol: string; label: string }> = {
  battle: { symbol: "⚔", label: "Battle" }, alliance: { symbol: "⇄", label: "Alliance or tribute" }, building: { symbol: "⌂", label: "Building" },
  reform: { symbol: "▲", label: "Reform" }, worship: { symbol: "✶", label: "Worship" }, personal: { symbol: "✚", label: "Personal" },
  prophecy: { symbol: "❝", label: "Prophecy" }, other: { symbol: "•", label: "Event" },
};

export function ordinal(n: number): string {
  const tens = n % 100, ones = n % 10;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ones === 1 ? "st" : ones === 2 ? "nd" : ones === 3 ? "rd" : "th";
  return `${n}${suffix}`;
}

/** "41 years", "6 months", "7 days", "2 years 6 months": a reign's length as the text gives it. */
export function reignLength(r: { years?: number; months?: number; days?: number }): string {
  const parts = [r.years && `${r.years} ${r.years === 1 ? "year" : "years"}`, r.months && `${r.months} ${r.months === 1 ? "month" : "months"}`, r.days && `${r.days} ${r.days === 1 ? "day" : "days"}`];
  return parts.filter(Boolean).join(" ");
}

/**
 * The "Two accounts" heading, by the kind of ruler: Kings and Chronicles for the kings of the two kingdoms; Samuel–Kings
 * and Chronicles for the united kingdom; for the Herods and Rome, the Gospels, Acts and Josephus; for other nations,
 * Scripture and the records outside it.
 */
export function accountsHeading(ruler: Pick<RulerLike, "kind" | "realm">): { title: string; lead: string; rails?: [string, string] } {
  const apart = "Shown side by side and never blended. Neither is corrected by the other.";
  if (ruler.realm === "united") return { title: "Where Samuel–Kings and Chronicles differ", lead: `The two histories of the kingdom. ${apart}`, rails: ["Samuel–Kings", "Chronicles"] };
  if (ruler.realm === "israel" || ruler.realm === "judah") return { title: "Where Kings and Chronicles differ", lead: `The two histories of the kingdoms. ${apart}`, rails: ["Kings", "Chronicles"] };
  if (ruler.kind === "herod" || ruler.kind === "roman" || ruler.realm === "rome") return { title: "Where the accounts differ", lead: `The Gospels, Acts and Josephus. ${apart}` };
  if (isForeign(ruler) || ruler.kind === "governor") return { title: "Where the accounts differ", lead: `Scripture and the records outside it. ${apart}` };
  return { title: "Where the accounts differ", lead: `Two tellings of the same events. ${apart}` };
}

/** The two letters on a medallion, as on the prophets' medallions (ProphetsMockup.tsx). */
export const initials = (name: string) => name.replace(/[^A-Za-z]/g, "").slice(0, 2);

/** The Letters "open questions" cards take a list of letters each question concerns; these pages have none. */
export const asLetterQuestions = (questions: OpenQuestion[]): LetterQuestion[] => questions.map((q) => ({ ...q, letters: [] }));
