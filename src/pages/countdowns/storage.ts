// Read marks and personal countdowns, kept in this browser only and never sent anywhere (design 6.4). The record is
// rebuilt field by field on every read, so damaged or hand-edited data comes back sound and never breaks the page.
import { useCallback, useEffect, useRef, useState } from "react";
import { dayNumber, parseDateKey } from "./calendar";

export const STORAGE_KEY = "bp-countdowns";
const EVENT = "bp-countdowns";
const DAY_KEY = /^[a-z0-9-]{1,20}$/;
const RUN_ID = /^([a-z0-9-]{1,40}):(\d{4}-\d{2}-\d{2})$/;
const MINE_ID = /^[a-z0-9]{1,16}$/;
const MAX_KEYS = 60;
const MAX_MINE = 10;
const MAX_NAME = 60;
/** Runs whose target is further past than this are tidied away on save. */
const KEEP_DAYS = 400;

export interface MyCountdown { id: string; occasion: string; date: string; name: string; read: string[] }
export interface CountdownRecord { v: 1; runs: Record<string, { read: string[] }>; mine: MyCountdown[] }

export const emptyRecord = (): CountdownRecord => ({ v: 1, runs: {}, mine: [] });

const readKeys = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((key): key is string => typeof key === "string" && DAY_KEY.test(key)))].slice(0, MAX_KEYS) : [];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** A sound record from whatever was stored: unknown fields dropped, every field checked (design 6.4). */
export function rebuildRecord(value: unknown): CountdownRecord {
  const record = emptyRecord();
  if (!isObject(value)) return record;
  if (isObject(value.runs)) {
    for (const [id, run] of Object.entries(value.runs)) {
      const match = RUN_ID.exec(id);
      if (!match || !parseDateKey(match[2]) || !isObject(run)) continue;
      record.runs[id] = { read: readKeys(run.read) };
    }
  }
  if (Array.isArray(value.mine)) {
    for (const item of value.mine) {
      if (record.mine.length >= MAX_MINE) break;
      if (!isObject(item) || typeof item.id !== "string" || !MINE_ID.test(item.id)) continue;
      if (typeof item.occasion !== "string" || !DAY_KEY.test(item.occasion)) continue;
      if (typeof item.date !== "string" || !parseDateKey(item.date)) continue;
      if (record.mine.some((other) => other.id === item.id)) continue;
      const name = typeof item.name === "string" ? item.name.slice(0, MAX_NAME) : "";
      record.mine.push({ id: item.id, occasion: item.occasion, date: item.date, name, read: readKeys(item.read) });
    }
  }
  return record;
}

/** The stored record, or an empty one (with a warning) when what is stored cannot be read. `localStorage` is read inside
 *  the try, because a browser that blocks site data throws on the very read of it. */
export function loadRecord(storage?: Pick<Storage, "getItem">): CountdownRecord {
  try {
    const raw = (storage ?? localStorage).getItem(STORAGE_KEY);
    return raw === null ? emptyRecord() : rebuildRecord(JSON.parse(raw));
  } catch (error) {
    console.warn("countdowns: saved read marks unreadable; starting empty", error);
    return emptyRecord();
  }
}

/** The record without runs whose target is more than 400 days before today. */
export function tidyRecord(record: CountdownRecord, todayN: number): CountdownRecord {
  const runs: CountdownRecord["runs"] = {};
  for (const [id, run] of Object.entries(record.runs)) {
    const target = parseDateKey(RUN_ID.exec(id)?.[2] ?? "");
    if (target && todayN - dayNumber(target) <= KEEP_DAYS) runs[id] = run;
  }
  return { ...record, runs };
}

/** Saves the record; false when the browser refuses (a private window, full or blocked storage). */
export function saveRecord(record: CountdownRecord, todayN: number, storage?: Pick<Storage, "setItem">): boolean {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(tidyRecord(rebuildRecord(record), todayN)));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
    return true;
  } catch (error) {
    console.warn("countdowns: could not save read marks", error);
    return false;
  }
}

const toggled = (keys: string[], key: string) => (keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]);

/** Marks a day read in a run, or clears the mark. Only ever done by the visitor's own press (design 6.4). */
export function toggleRunRead(record: CountdownRecord, runId: string, key: string): CountdownRecord {
  const read = toggled(record.runs[runId]?.read ?? [], key);
  return { ...record, runs: { ...record.runs, [runId]: { read } } };
}

/** Marks a day read in a personal countdown, or clears it. */
export function toggleMineRead(record: CountdownRecord, id: string, key: string): CountdownRecord {
  return { ...record, mine: record.mine.map((item) => (item.id === id ? { ...item, read: toggled(item.read, key) } : item)) };
}

/** A random local id for a personal countdown, so a moved date keeps its ticks. */
export const newMineId = (): string => Math.random().toString(36).slice(2, 10) || "mine";

/** Adds or updates a personal countdown (a moved date keeps its id and ticks); null when ten are already kept. */
export function putMine(record: CountdownRecord, item: Omit<MyCountdown, "read"> & { read?: string[] }): CountdownRecord | null {
  const existing = record.mine.find((mine) => mine.id === item.id);
  if (!existing && record.mine.length >= MAX_MINE) return null;
  const next: MyCountdown = { ...item, name: item.name.slice(0, MAX_NAME), read: item.read ?? existing?.read ?? [] };
  return { ...record, mine: existing ? record.mine.map((mine) => (mine.id === item.id ? next : mine)) : [...record.mine, next] };
}

export const removeMine = (record: CountdownRecord, id: string): CountdownRecord => ({ ...record, mine: record.mine.filter((item) => item.id !== id) });

export interface CountdownProgress {
  record: CountdownRecord;
  /** Applies a change and saves it. */
  update: (change: (record: CountdownRecord) => CountdownRecord | null) => void;
  /** false when this browser refuses storage: marks then last only for this visit. */
  saving: boolean;
}

/** The record, kept in step with other open tabs (the storage event) and other components (a page event). */
export function useCountdownProgress(todayN: number): CountdownProgress {
  const [record, setRecord] = useState<CountdownRecord>(loadRecord);
  const [saving, setSaving] = useState(true);
  const latest = useRef({ record, saving });

  useEffect(() => {
    const refresh = () => {
      if (!latest.current.saving) return;
      const fresh = loadRecord();
      latest.current = { ...latest.current, record: fresh };
      setRecord(fresh);
    };
    const onStorage = (event: StorageEvent) => (event.key === STORAGE_KEY || event.key === null) && refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback(
    (change: (record: CountdownRecord) => CountdownRecord | null) => {
      // Read the stored record afresh, so a change made in another tab a moment ago is not overwritten; when storage is
      // refused, the marks of this visit live only in memory.
      const next = change(latest.current.saving ? loadRecord() : latest.current.record);
      if (!next) return;
      const saved = saveRecord(next, todayN);
      latest.current = { record: next, saving: saved };
      setRecord(next);
      setSaving(saved);
    },
    [todayN],
  );

  return { record, update, saving };
}
