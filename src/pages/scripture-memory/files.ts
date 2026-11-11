// Scripture memory: the pieces of import that are not drawn on screen (design §5 and §9): reading a chosen file in the
// browser, and the result written as one whole sentence per count, never pieced together.
import { plural } from "@/lib/site-format";

/** A chosen file's text, read in the browser (FileReader works in every browser the site supports). */
export function readFileText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Scripture memory: the file reader failed without an error"));
    reader.readAsText(file);
  });
}

/** The import result, one whole sentence per count (never pieced together). */
export function importLines(added: number, updated: number, same: number, skipped: number, full: number): string[] {
  const lines: string[] = [];
  if (added) lines.push(plural(added, "Added {n} verse.", "Added {n} verses."));
  if (updated) lines.push(plural(updated, "{n} verse was further along in the file and was updated.", "{n} verses were further along in the file and were updated."));
  if (same) lines.push(plural(same, "{n} verse was already up to date.", "{n} verses were already up to date."));
  if (skipped) lines.push(plural(skipped, "{n} entry could not be read and was skipped.", "{n} entries could not be read and were skipped."));
  if (full) lines.push(plural(full, "{n} verse was not added: the list is full.", "{n} verses were not added: the list is full."));
  return lines.length ? lines : ["The file had no verses in it, so nothing was changed."];
}
