/** Directory IDs only: contact values stay in resources/life.json. */
export const URGENT_HELP = {
  "thinking-of-suicide": ["988-lifeline", "crisis-text-line", "emergency-911", "veterans-crisis-line", "find-a-helpline"],
  abused: ["emergency-911", "domestic-violence-hotline", "childhelp-hotline", "rainn-hotline", "find-a-helpline"],
} as const;

export type UrgentTopic = keyof typeof URGENT_HELP;
export const FALLBACK_HELP = "If you are in immediate danger, use your local emergency number. If you are thinking of suicide or self-harm, reach out to a crisis service or a trusted person now.";
export const DEVICE_SAFETY = "This device or internet connection may be monitored. Quick exit and private browsing do not erase all traces. If possible, use a safer device to contact an advocate.";

/** The directory's counselling pair (pastoral, design 6.4), and the clinical treatment locator offered beside it. */
export const COUNSELLING = ["focus-on-the-family-counseling", "acbc-find-a-counselor"];
export const CLINICAL = "findtreatment-gov";
export const COMMUNITY = "211-united-way";
export const FOOD = "feeding-america-locator";

/** Local navigation aid, never a diagnosis. Normalise spelling without retaining the input. */
export const normaliseFeeling = (value: string): string => value.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function urgentMatches(value: string): UrgentTopic[] {
  const normal = normaliseFeeling(value);
  const matches: UrgentTopic[] = [];
  if (/\b(suicid\w*|kill myself|end my life|want to die|self ?harm\w*|cutting|hurt myself)\b/.test(normal)) matches.push("thinking-of-suicide");
  if (/\b(abuse\w*|abusive|domestic violence|hits me|hurts me|afraid of my (husband|wife|partner))\b/.test(normal)) matches.push("abused");
  return matches;
}
