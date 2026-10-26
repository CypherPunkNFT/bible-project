// The reader's own record on the test page: per themed test (or "own" for a test of their own), the best score, how
// many times it was taken, and when last. Kept in this browser only; the page works the same without it.
import { useState } from "react";

export interface Mark { best: number; of: number; taken: number; last: string }
export type TestRecord = { [key: string]: Mark };

const KEY = "bp-test-record";

function read(): TestRecord {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return value && typeof value === "object" ? (value as TestRecord) : {};
  } catch (error) {
    console.warn("The test record could not be read from this browser:", error);
    return {};
  }
}

/** The record, and `save(key, right, of)` to add a finished test to it. */
export function useRecord() {
  const [record, setRecord] = useState<TestRecord>(read);
  const save = (key: string, right: number, of: number) => setRecord((all) => {
    const was = all[key];
    const better = !was || right / of > was.best / was.of;
    const next = { ...all, [key]: { best: better ? right : was.best, of: better ? of : was.of, taken: (was?.taken ?? 0) + 1, last: new Date().toISOString() } };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (error) { console.warn("The test record could not be saved in this browser:", error); }
    return next;
  });
  return { record, save };
}
