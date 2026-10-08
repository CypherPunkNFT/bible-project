// Small read-outs the Built / Fields / Named / Directory sections write the same way: a field's tone, a life's years
// as the mock-ups print them ("c. 37–100"), a faith, a list in words.
import type { Field, Scholar, ScholarsData } from "@/data/teachers/pages-types";
import { FIELD_TONE } from "../marks/shapes";

/** A field's colour token ("--history"), the same pairing as the shared marks. */
export const toneOf = (field: Field) => FIELD_TONE[field] ?? "--accent";
export const yearsOf = (s: Scholar) => `${s.circa ? "c. " : ""}${s.born}–${s.died}`;
export const faithOf = (data: ScholarsData, s: Scholar) => data.faiths[s.faith] ?? data.faiths.unrecorded;
/** "a", "a and b", "a, b and c". */
export const listWords = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
