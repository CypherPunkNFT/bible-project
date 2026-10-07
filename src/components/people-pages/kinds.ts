import type { OpenQuestion as LetterQuestion } from "@/data/letters/types";
import type { EventKind, OpenQuestion, Realm, Ruler, RulerKind } from "@/data/people-pages/types";
import type { RulerSummary } from "@/lib/people-pages-index";

/**
 * How each kind of ruler is shown (Research/People/PRESENTATION.md §3.10): its glow colour (the Letters pages' --lg),
 * the name of its page, and the words for its verdict and events. Women rulers share the kings' gold; nothing is
 * styled differently for them.
 */
const EMPIRE_GLOW: Partial<Record<Realm, string>> = {
  egypt: "var(--history)", aram: "var(--acts)", assyria: "var(--prophets)", babylon: "var(--gospels)", persia: "var(--poetry)", rome: "var(--apocrypha)", other: "var(--history)",
};

export function glowFor(kind: RulerKind, realm: Realm): string {
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

type Sex = "M" | "F" | "G" | "";

/** The second half of the person ↔ page switch. */
export function aspectLabel(kind: RulerKind): string {
  return kind === "judge" ? "As judge" : kind === "leader" ? "As leader" : kind === "governor" ? "As governor" : kind === "herod" || kind === "roman" ? "The rule" : "The reign";
}

/** The page's own heading: "The reign", "Her time as judge", "His governorship". */
export function pageHeading(kind: RulerKind, sex: Sex): string {
  const their = sex === "F" ? "Her" : "His";
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
  empire: "Empire of the day", tribes: "Leaders & judges", united: "United kingdom", israel: "Israel", judah: "Judah", governors: "Governors", rome: "Herods & Rome",
};

/** The lane a ruler sits in on the guide's ribbon. */
export function laneOf(ruler: Pick<RulerSummary, "kind" | "realm">): keyof typeof LANE_LABEL {
  if (ruler.kind === "foreign") return "empire";
  if (ruler.kind === "governor") return "governors";
  if (ruler.kind === "herod" || ruler.kind === "roman" || ruler.realm === "rome") return "rome";
  if (ruler.realm === "united" || ruler.realm === "israel" || ruler.realm === "judah") return ruler.realm;
  return "tribes";
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

/** The two letters on a medallion, as on the prophets' medallions (ProphetsMockup.tsx). */
export const initials = (name: string) => name.replace(/[^A-Za-z]/g, "").slice(0, 2);

/** The Letters "open questions" cards take a list of letters each question concerns; these pages have none. */
export const asLetterQuestions = (questions: OpenQuestion[]): LetterQuestion[] => questions.map((q) => ({ ...q, letters: [] }));
