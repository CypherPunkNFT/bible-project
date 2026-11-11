// The help directory (resources/life.json) for the "when you're..." pages, read once per page with a Retry. A failed read
// leaves the directory empty, which every help block answers with the number-free fallback (design 6.1).
import { useEffect, useState } from "react";
import { loadResource, type LifeData } from "@/data/resources";

export function useHelpDirectory() {
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<LifeData | null>(null);
  useEffect(() => {
    let live = true;
    loadResource("life").then(
      (value) => { if (live) setData(value); },
      (error: unknown) => {
        console.warn("when-youre: the help directory (life.json) could not be read; the fallback help is shown", error);
        if (live) setData(null);
      },
    );
    return () => { live = false; };
  }, [attempt]);
  return { entries: new Map((data?.groups ?? []).flatMap((group) => group.entries).map((entry) => [entry.id, entry])), retry: () => setAttempt((n) => n + 1) };
}

export type HelpDirectory = ReturnType<typeof useHelpDirectory>;
