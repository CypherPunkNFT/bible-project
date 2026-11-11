// The puzzle maker's choices and the address that holds them (design §1 and §10): every value read from a link is
// checked against its list, so a link can only ever ask for a puzzle the page offers. Pure.
import { THEMES, type Level, type Size } from "@/pages/games/crossword/themes";

export type Kind = "search" | "cross";
export type From = "passage" | "theme";
export type { Level, Size };

export interface Settings {
  kind: Kind;
  from: From;
  /** The passage as typed, e.g. "Psalm 23". */
  ref: string;
  /** A crossword theme's id (src/pages/games/crossword/themes.ts). */
  theme: string;
  size: Size;
  level: Level;
  /** Null until the page has chosen one and written it into the address. */
  seed: number | null;
  /** The visitor's own title, or "" for the default. */
  title: string;
}

export const MAX_REF = 120;
export const MAX_TITLE = 60;
export const MAX_SEED = 2 ** 31 - 1;

export const DEFAULTS: Omit<Settings, "seed"> = { kind: "search", from: "passage", ref: "Psalm 23", theme: "jesus", size: "medium", level: "easy", title: "" };

/** Word-search grids (squares across and down) and the words hidden in each. */
export const SEARCH_GRID: Record<Size, { side: number; target: number }> = {
  small: { side: 10, target: 8 },
  medium: { side: 13, target: 12 },
  large: { side: 15, target: 18 },
};

const KINDS: readonly Kind[] = ["search", "cross"];
const FROMS: readonly From[] = ["passage", "theme"];
const SIZES: readonly Size[] = ["small", "medium", "large"];
const LEVELS: readonly Level[] = ["easy", "medium", "hard"];

const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Control characters and text-direction overrides, which would scramble a printed title. */
// eslint-disable-next-line no-control-regex -- removing control characters is the point
const UNSAFE = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

/** A title as typed: unsafe characters removed, at most MAX_TITLE characters (whole characters, never half of one). */
export const cleanTitle = (text: string): string => Array.from(text.replace(UNSAFE, "")).slice(0, MAX_TITLE).join("").trim();

export function readSeed(value: string | null): number | null {
  if (!value || !/^\d{1,10}$/.test(value)) return null;
  const seed = Number(value);
  return seed <= MAX_SEED ? seed : null;
}

/** The settings an address asks for; anything not on its list falls back to the default. */
export function readSettings(params: URLSearchParams): Settings {
  const theme = params.get("theme");
  return {
    kind: pick(params.get("kind"), KINDS, DEFAULTS.kind),
    from: pick(params.get("from"), FROMS, DEFAULTS.from),
    ref: (params.get("ref") ?? DEFAULTS.ref).replace(UNSAFE, "").slice(0, MAX_REF).trim() || DEFAULTS.ref,
    theme: THEMES.some((t) => t.id === theme) ? theme! : DEFAULTS.theme,
    size: pick(params.get("size"), SIZES, DEFAULTS.size),
    level: pick(params.get("level"), LEVELS, DEFAULTS.level),
    seed: readSeed(params.get("seed")),
    title: cleanTitle(params.get("title") ?? ""),
  };
}

/** The address for some settings: only what the source uses, and the title only when the visitor gave one. */
export function settingsParams(settings: Settings): Record<string, string> {
  return {
    kind: settings.kind,
    from: settings.from,
    ...(settings.from === "passage" ? { ref: settings.ref } : { theme: settings.theme }),
    size: settings.size,
    level: settings.level,
    ...(settings.seed !== null ? { seed: String(settings.seed) } : {}),
    ...(settings.title ? { title: settings.title } : {}),
  };
}

/** What decides the puzzle itself: everything but the title, so typing a title never makes a new one. */
export const puzzleKey = (settings: Settings): string => JSON.stringify(settingsParams({ ...settings, title: "" }));

/** A seed for a new puzzle. */
export const freshSeed = (): number => Math.floor(Math.random() * MAX_SEED);
