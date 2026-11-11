// The name files (data/baby-names/names/<slug>.json) for the Bible names found, through the baby-name pages' own
// loader and cache. Only slugs taken from the names index are asked for, never one built from what was typed.
import { useMemo, useState } from "react";
import type { NameDocument } from "@/data/baby-names";
import { loadNameDocument } from "@/pages/baby-names/useBabyNames";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import type { Found } from "./bible-spelling";

export function useNameFiles(found: readonly Found[] | null): { state: AsyncState<Map<string, NameDocument>>; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const slugs = useMemo(() => [...new Set((found ?? []).flatMap((entry) => (entry.type === "name" ? [entry.row.s] : [])))], [found]);
  const state = useAsync(
    () => Promise.all(slugs.map(loadNameDocument)).then((documents) => new Map(documents.map((document) => [document.slug, document]))),
    `name-in-hebrew:${slugs.join(",")}:${attempt}`,
  );
  return { state, retry: () => setAttempt((value) => value + 1) };
}
