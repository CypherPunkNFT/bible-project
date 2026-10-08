// Loading the two subpages' data. Each file is large (people.json is about 1.4 MB), so it is imported only when its
// page opens: Vite splits it into its own chunk, and the rest of the site never downloads it.
import { useEffect, useState } from "react";
import type { PeopleData, ScholarsData } from "@/data/teachers/pages-types";

type Load<T> = { data: T; error: null } | { data: null; error: Error | null };

function useLoaded<T>(load: () => Promise<{ default: unknown }>, what: string): Load<T> {
  const [state, setState] = useState<Load<T>>({ data: null, error: null });
  useEffect(() => {
    let live = true;
    load().then(
      (module) => { if (live) setState({ data: module.default as T, error: null }); },
      (error: unknown) => {
        console.error(`Teachers: could not load the ${what} data`, error);
        if (live) setState({ data: null, error: error instanceof Error ? error : new Error(String(error)) });
      },
    );
    return () => { live = false; };
  }, [load, what]);
  return state;
}

const loadPeople = () => import("@/data/teachers/people.json");
const loadScholars = () => import("@/data/teachers/scholars.json");
export const usePeopleData = () => useLoaded<PeopleData>(loadPeople, "preachers and authors");
export const useScholarsData = () => useLoaded<ScholarsData>(loadScholars, "scholars");
