// What the passage study counts from the open Manuscripts collection: the records that hold Galatians, Romans or Mark
// (the mock-up's data.js held exactly these), the oldest dated copy of a book, and the gap between writing and copy.
import type { MsRecord } from "@/lib/manuscripts";
import { isDated, type MsIndex } from "../manuscripts/model";
import type { CaseId, Reading } from "./evidence";

/** Book index (0–65) of each case: Mark, Romans, Galatians. */
export const BOOK_OF: Record<CaseId, number> = { galatians: 47, romans: 44, mark: 40 };
const STUDY_BOOKS = new Set(Object.values(BOOK_OF));

const cache = new WeakMap<MsIndex, MsRecord[]>();
/** The open records holding at least one of the study's three books. */
export function studyRecords(index: MsIndex): MsRecord[] {
  let list = cache.get(index);
  if (!list) {
    list = index.data.records.filter((r) => r.b?.some((b) => STUDY_BOOKS.has(b)));
    cache.set(index, list);
  }
  return list;
}
export const recordsFor = (index: MsIndex, book: number) => studyRecords(index).filter((r) => r.b?.includes(book));

/** Dated records whose span is at most two centuries: a record dated "2nd–10th century" has no middle anyone has claimed. */
export const narrowlyDated = (r: MsRecord): r is MsRecord & { e: number; l: number } => isDated(r) && r.l - r.e <= 200;

/** The oldest narrowly dated copy of a book. */
export function oldestOf(index: MsIndex, book: number) {
  const dated = recordsFor(index, book).filter(narrowlyDated);
  if (!dated.length) throw new Error(`passage study: no dated open record holds book ${book} (${index.data.books[book]?.name ?? "unknown"})`);
  return dated.reduce((a, b) => (b.e < a.e ? b : a));
}

/** Years between when a book was written (an approximate editorial range) and its oldest dated copy. */
export function gapOf(index: MsIndex, book: number) {
  const written = index.data.written[String(book)];
  if (!written) throw new Error(`passage study: the collection gives no writing date for book ${book}`);
  const [w0, w1] = written, oldest = oldestOf(index, book);
  return { oldest, from: Math.max(0, oldest.e - w1), to: Math.max(0, oldest.l - w0) };
}

/** The desk's three kinds of witness line: a manuscript, an editor's text, a leaf that does not survive. */
export const kindClass = (row: Reading) => (row.layer === "Critical edition" ? "is-edition" : row.layer === "No surviving text" ? "is-lost" : "is-ms");
export const isLost = (row: Reading) => row.layer === "No surviving text";
