// What the Help for life page derives from life.json: the colour and icon of each kind of help, how a contact becomes a
// tel:/sms:/web link, the short subtitle and first sentence a closed row shows, and the call/text buttons it keeps ready.
// Every word shown comes from the data; only these summaries are computed here.
import { Baby, Flower2, HandHeart, HeartHandshake, House, LifeBuoy, Shield, Sprout, Users, Wheat, type LucideIcon } from "lucide-react";
import type { City, Contact, Help, LifeData } from "@/data/resources";
import { dialable, wayOf as baseWay } from "../contact-links";

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
export const listOf = (words: string[]) => (words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`);

interface Kind { short: string; color: string; Icon: LucideIcon }
/** One colour per kind of help, from the site's book colours; used for the kind's disc, its pins and its row marker. */
const KINDS: Record<string, Kind> = {
  crisis: { short: "Crisis", color: "lf-green", Icon: LifeBuoy }, // green, life-affirming, not red (owner, 2026-10-08)
  pregnancy: { short: "Pregnancy", color: "acts", Icon: Baby },
  "after-abortion": { short: "After an abortion", color: "gospels", Icon: HeartHandshake },
  "children-families": { short: "Babies & families", color: "prophets", Icon: Users },
  food: { short: "Food", color: "epistles", Icon: Wheat },
  grief: { short: "Grief", color: "apocrypha", Icon: Flower2 },
  recovery: { short: "Recovery", color: "poetry", Icon: Sprout },
  abuse: { short: "Abuse", color: "history", Icon: Shield },
  shelter: { short: "Shelter", color: "poetry", Icon: House },
};
export const kindOf = (id: string): Kind => KINDS[id] ?? { short: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "), color: "accent", Icon: HandHeart };
export const tone = (id: string) => `var(--${kindOf(id).color})`;

export type Way = "call" | "text" | "chat" | "web" | "email" | "other";
export const wayOf = (kind: string): Way => (/chat/i.test(kind) ? "chat" : baseWay(kind));
export const WAY_WORD: Partial<Record<Way, string>> = { call: "Call", text: "Text", chat: "Chat", web: "Website", email: "Email" };
const WAY_ORDER = Object.keys(WAY_WORD);

/** The keyword a text line asks for ("HOME", "GO", "START"), from its value or its note. */
function keywordOf(c: Contact): string | undefined {
  return (`${c.value} ${c.note ?? ""}`.match(/text\s+["“]?([A-Za-z]+)["”]?(?:\s+to|\s*$|["”])/i) ?? [])[1] ?? (c.value.match(/^\s*["“]?([A-Za-z]+)["”]?\s+to\s+/i) ?? [])[1];
}
const usableKeyword = (key: string | undefined) => (key && !/zip/i.test(key) ? key.toUpperCase() : undefined);

export function hrefOf(c: Contact): string | null {
  const way = wayOf(c.kind);
  if (way === "call" && /\d{3}/.test(c.value)) return `tel:${dialable(c.value)}`;
  if (way === "text" && /\d{3}/.test(c.value)) {
    const key = usableKeyword(keywordOf(c));
    return `sms:${dialable(c.value.replace(/^.*\bto\b/i, ""))}${key ? `?&body=${encodeURIComponent(key)}` : ""}`;
  }
  if (way === "email" && c.value.includes("@")) return `mailto:${c.value.trim()}`;
  if (/^https?:\/\//.test(c.value)) return c.value;
  return null;
}

export const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
export const sameUrl = (a: string, b: string) => a.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") === b.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** The first sentence of a summary; does not break after "U.S." or "St.". */
export function firstSentence(text = "") {
  const re = /([.!?])\s+(?=[A-Z0-9“"(])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const words = text.slice(0, m.index).split(/\s/);
    if (/^([A-Z]\.?)+$|^(St|Dr|Mr|Mrs|Ms|No|Ave|Blvd|Rd|E|W|N|S)$/.test(words[words.length - 1])) continue;
    return text.slice(0, m.index + 1);
  }
  return text;
}
export const restOf = (text = "") => (firstSentence(text) === text ? "" : text.slice(firstSentence(text).length).trim());

const shortHours = (h?: string) => (!h ? "" : /24\s*[/-]?\s*7|24-hour|24 hours/i.test(h) && h.length < 26 ? h.replace(/ helpline| hotline/i, "") : /^Office /.test(h) ? "" : h.length <= 28 ? h : "");
const answersAlways = (e: Help) => /24\s*\/\s*7|24-hour|answered 24/i.test(`${e.hours ?? ""} ${e.contact.map((c) => c.note ?? "").join(" ")}`);

/** The ways a line can be reached, in a fixed order: call, text, chat, website, email. */
export const waysOf = (entry: Help) => [...new Set(entry.contact.map((c) => wayOf(c.kind)).filter((w) => w in WAY_WORD))].sort((a, b) => WAY_ORDER.indexOf(a) - WAY_ORDER.indexOf(b));
/** "Call · Text · Chat  ·  24/7". */
export const subtitle = (entry: Help) => [waysOf(entry).map((w) => WAY_WORD[w]).join(" · "), shortHours(entry.hours)].filter(Boolean).join("  ·  ");

export interface Quick { way: "call" | "text"; href: string; label: string }
/** The tap-to-call and tap-to-text buttons a row shows while it is still closed (never a TTY, office or admin number). */
export function quickActions(entry: Help, max = 2): Quick[] {
  const out: Quick[] = [];
  for (const c of entry.contact) {
    const way = wayOf(c.kind), href = hrefOf(c);
    if (!href || (way !== "call" && way !== "text")) continue;
    if (/tty|non-urgent|administ|office|headquarters/i.test(c.note ?? "")) continue;
    if (out.some((o) => o.way === way)) continue;
    const press = (c.note ?? "").match(/press (\d)/i);
    const key = way === "text" ? usableKeyword(keywordOf(c)) : undefined;
    const label = way === "call" ? `Call ${c.value}${press ? `, then ${press[1]}` : ""}` : key ? `Text ${key} to ${c.value.replace(/^.*\bto\b\s*/i, "")}` : `Text ${c.value}`;
    out.push({ way, href, label });
    if (out.length >= max) break;
  }
  return out;
}

/** What a kind's button in the left column says: how many answer around the clock, and the ways to reach them. */
export function groupStats(g: LifeData["groups"][number]) {
  const n = g.entries.length, always = g.entries.filter(answersAlways).length;
  const ways = new Set(g.entries.flatMap((e) => e.contact.map((c) => wayOf(c.kind))));
  const clock = always === n ? (n === 1 ? "Answers around the clock" : "All around the clock") : always ? `${always} around the clock` : "Set hours";
  const words = (["call", "text", "chat"] as Way[]).filter((w) => ways.has(w)).map((w) => WAY_WORD[w]).join(" · ");
  return { n, line: `${clock} · ${words || "Website"}` };
}

/** Great-circle distance in miles, and the compass direction from a to b. */
export function miles(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}
export function compass(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const east = (b.lon - a.lon) * Math.cos((a.lat * Math.PI) / 180), north = b.lat - a.lat;
  const deg = (Math.atan2(east, north) * 180) / Math.PI;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(((deg + 360) % 360) / 45) % 8];
}

/** The data files that draw each city; a verified city is shown only once both exist (resources.test.ts checks this). */
export const CITY_FILES = { "jacksonville-fl": { map: "jax-map", facts: "jax-facts" } } as const;
export const hasCityFiles = (id: string): id is keyof typeof CITY_FILES => id in CITY_FILES;

/** Kinds of place in a city, the commonest first. */
export const kindsIn = (city: City) => [...new Set(city.entries.map((e) => e.category))]
  .map((k) => [k, city.entries.filter((e) => e.category === k).length] as [string, number]).sort((a, b) => b[1] - a[1]);
