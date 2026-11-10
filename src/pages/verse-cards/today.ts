// Today's verse of the day as one quick choice on the start page (design 5.3), read from the widget's own small day file
// (public/widget/v1/days/<date>.json) for the visitor's own date. Anything unexpected hides the choice.
import { useEffect, useState } from "react";
import { keyFromReadPath } from "@/lib/verse-card/links";

export interface TodayVerse { key: string; reference: string }

/** "2026-11-10" in the visitor's own time zone, as the widget counts days. */
export const localDate = (now: Date) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

/** The day file's verse as a card key, or null for anything that is not a day file. */
export function todayFromDayFile(value: unknown): TodayVerse | null {
  if (!value || typeof value !== "object") return null;
  const day = value as Record<string, unknown>;
  if (day.v !== 1 || typeof day.read !== "string" || typeof day.reference !== "string" || day.reference.length > 60) return null;
  const key = keyFromReadPath(day.read);
  return key ? { key, reference: day.reference } : null;
}

export function useTodayVerse(): TodayVerse | null {
  const [today, setToday] = useState<TodayVerse | null>(null);
  useEffect(() => {
    let wanted = true;
    fetch(`/widget/v1/days/${localDate(new Date())}.json`)
      .then((response) => (response.ok && /json/.test(response.headers.get("content-type") ?? "") ? response.json() : null))
      .then((value: unknown) => { if (wanted) setToday(todayFromDayFile(value)); })
      .catch(() => { if (wanted) setToday(null); });
    return () => { wanted = false; };
  }, []);
  return today;
}
