// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { type QuestionBank } from "@/lib/data";
import { DIFFICULTIES, type Filters } from "./model";
export interface Chosen { key: keyof Filters | "theme"; label: string }

export function choiceInWords(f: Filters, bank: QuestionBank, bookNames: Record<string, string>, themeTitle?: string): Chosen[] {
  const topic = f.topic === "none" ? "Other questions" : bank.topics.find((t) => t.id === f.topic)?.title;
  const parts: [Chosen["key"], string | false | undefined][] = [["theme", themeTitle], ["book", f.book && (bookNames[f.book] ?? f.book)], ["topic", f.topic && topic],
    ["testament", f.testament && (f.testament === "OT" ? "Old Testament" : "New Testament")], ["collection", f.collection],
    ["difficulty", f.difficulty && DIFFICULTIES.find(([id]) => id === f.difficulty)?.[1]], ["choices", f.choices && "Multiple choice only"],
    ["search", f.search.trim() && `“${f.search.trim()}”`]];
  return parts.flatMap(([key, label]) => (label ? [{ key, label }] : []));
}
