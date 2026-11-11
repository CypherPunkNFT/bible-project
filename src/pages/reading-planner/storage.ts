// Progress, kept in this browser only and never sent anywhere (design 4). Nothing is saved until the visitor ticks a day:
// then the plan's settings and the days ticked are kept under one key. The record is rebuilt field by field on every
// read, so damaged or hand-edited data comes back sound or not at all, and never breaks the page.
import { useCallback, useEffect, useRef, useState } from "react";
import { parseDateKey } from "@/pages/countdowns/calendar";
import { MAX_PACE, PACE_UNITS, SPEEDS, type PaceUnit, type PlanSettings, type Speed } from "./planner";

export const STORAGE_KEY = "bp-reading-planner";
const EVENT = "bp-reading-planner";
const BOOK_CODE = /^[1-3A-Z]{3}$/;
const SIGNATURE = /^[0-9a-f]{8}$/;
/** More days than any plan has (one chapter a day through the whole Bible is 1,189). */
const MAX_DAY = 1189;

export interface KeptPlan { v: 1; settings: PlanSettings; /** planner.ts planSignature of the plan the ticks belong to. */ signature: string; read: number[] }

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Sorted whole numbers from `min` to `max`, each once, at most `limit` of them. */
const wholeNumbers = (value: unknown, min: number, max: number, limit: number): number[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((n): n is number => Number.isInteger(n) && n >= min && n <= max))].sort((a, b) => a - b).slice(0, limit)
    : [];

/** Sound settings from whatever was stored, or null when any field is missing or wrong (design 4: drop the whole plan
 *  rather than draw a broken one). Book codes are checked against `bookCodes`. */
export function rebuildSettings(value: unknown, bookCodes: ReadonlySet<string>): PlanSettings | null {
  if (!isObject(value)) return null;
  const books = Array.isArray(value.books)
    ? [...new Set(value.books.filter((code): code is string => typeof code === "string" && BOOK_CODE.test(code) && bookCodes.has(code)))]
    : [];
  const weekdays = wholeNumbers(value.weekdays, 0, 6, 7);
  const { mode, start, finish, pace, unit, speed } = value;
  if (books.length === 0 || weekdays.length === 0) return null;
  if (mode !== "finish" && mode !== "pace") return null;
  if (typeof start !== "string" || !parseDateKey(start) || typeof finish !== "string" || !parseDateKey(finish)) return null;
  if (typeof pace !== "number" || !Number.isInteger(pace) || pace < 1 || pace > MAX_PACE) return null;
  if (!PACE_UNITS.includes(unit as PaceUnit) || !SPEEDS.includes(speed as Speed)) return null;
  return { books, mode, start, finish, pace, unit: unit as PaceUnit, weekdays, speed: speed as Speed };
}

/** A sound kept plan from whatever was stored, or null. */
export function rebuildKept(value: unknown, bookCodes: ReadonlySet<string>): KeptPlan | null {
  if (!isObject(value) || value.v !== 1) return null;
  const settings = rebuildSettings(value.settings, bookCodes);
  if (!settings || typeof value.signature !== "string" || !SIGNATURE.test(value.signature)) return null;
  return { v: 1, settings, signature: value.signature, read: wholeNumbers(value.read, 1, MAX_DAY, MAX_DAY) };
}

/** The kept plan, or null. `localStorage` is read inside the try, because a browser that blocks site data throws on the
 *  very read of it. */
export function loadKept(bookCodes: ReadonlySet<string>, storage?: Pick<Storage, "getItem">): KeptPlan | null {
  try {
    const raw = (storage ?? localStorage).getItem(STORAGE_KEY);
    return raw === null ? null : rebuildKept(JSON.parse(raw), bookCodes);
  } catch (error) {
    console.warn("reading planner: saved progress unreadable; starting without it", error);
    return null;
  }
}

/** Saves the kept plan, or forgets it (null); false when the browser refuses (a private window, full or blocked storage). */
export function saveKept(kept: KeptPlan | null, storage?: Pick<Storage, "setItem" | "removeItem">): boolean {
  try {
    const target = storage ?? localStorage;
    if (kept) target.setItem(STORAGE_KEY, JSON.stringify(kept));
    else target.removeItem(STORAGE_KEY);
    if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
    return true;
  } catch (error) {
    console.warn("reading planner: could not save progress", error);
    return false;
  }
}

/** Ticks a day on this plan, or clears its tick. Ticking a day of a different plan replaces the kept one. */
export function toggleDay(kept: KeptPlan | null, settings: PlanSettings, signature: string, n: number): KeptPlan {
  const read = kept && kept.signature === signature ? kept.read : [];
  const next = read.includes(n) ? read.filter((day) => day !== n) : [...read, n].sort((a, b) => a - b);
  return { v: 1, settings, signature, read: next };
}

export interface KeptProgress {
  kept: KeptPlan | null;
  /** Applies a change (null forgets the plan) and saves it. */
  update: (change: (kept: KeptPlan | null) => KeptPlan | null) => void;
  /** false when this browser refuses storage: ticks then last only for this visit. */
  saving: boolean;
}

/** The kept plan, in step with other open tabs (the storage event) and other parts of the page (a page event). */
export function useKeptPlan(bookCodes: ReadonlySet<string>): KeptProgress {
  const [kept, setKept] = useState<KeptPlan | null>(() => loadKept(bookCodes));
  const [saving, setSaving] = useState(true);
  const latest = useRef({ kept, saving, bookCodes });
  latest.current.bookCodes = bookCodes;

  useEffect(() => {
    const refresh = () => {
      if (!latest.current.saving) return;
      const fresh = loadKept(latest.current.bookCodes);
      latest.current = { ...latest.current, kept: fresh };
      setKept(fresh);
    };
    const onStorage = (event: StorageEvent) => (event.key === STORAGE_KEY || event.key === null) && refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((change: (kept: KeptPlan | null) => KeptPlan | null) => {
    // Read the stored plan afresh, so a tick made in another tab a moment ago is not overwritten; when storage is refused,
    // the ticks of this visit live only in memory.
    const current = latest.current.saving ? loadKept(latest.current.bookCodes) : latest.current.kept;
    const next = change(current);
    const saved = saveKept(next);
    latest.current = { ...latest.current, kept: next, saving: saved };
    setKept(next);
    setSaving(saved);
  }, []);

  return { kept, update, saving };
}
