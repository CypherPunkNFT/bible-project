// The family's chosen funeral readings (design 5.6): ticked in service order, reordered by hand, and kept in the page's
// own address as ?list=<keys> (replacing the history entry, never adding one), so a reload, a dropped tab or a trip to a
// hymn page and back keeps the list. The address holds only reading keys: no names, nothing typed.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FUNERAL_READINGS, funeralReadingByKey, passageKey } from "@/data/sympathy";

const ORDER = new Map(FUNERAL_READINGS.map((passage, index) => [passageKey(passage), index]));

/** The keys of a ?list= value: known readings only (aliases resolved), each once, in the order given; and how many were not. */
export function readList(raw: string | null): { keys: string[]; skipped: number } {
  const keys: string[] = [];
  let skipped = 0;
  for (const part of (raw ?? "").split(",").map((item) => item.trim()).filter(Boolean)) {
    const passage = funeralReadingByKey(part);
    if (!passage) { skipped++; continue; }
    const key = passageKey(passage);
    if (!keys.includes(key)) keys.push(key);
  }
  return { keys, skipped };
}

/** Where a newly ticked reading goes: after the last chosen reading that comes before it in the service. */
export function insertInServiceOrder(keys: string[], key: string): string[] {
  const rank = ORDER.get(key) ?? Number.MAX_SAFE_INTEGER;
  let at = 0;
  keys.forEach((existing, index) => { if ((ORDER.get(existing) ?? 0) <= rank) at = index + 1; });
  return [...keys.slice(0, at), key, ...keys.slice(at)];
}

export function useReadingList() {
  const [search] = useSearchParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  // Read once, when the page opens: the note about skipped keys must outlive the address being rewritten without them.
  const [initial] = useState(() => readList(search.get("list")));
  const [keys, setKeys] = useState<string[]>(initial.keys);

  const listParam = keys.join(",");
  useEffect(() => {
    if ((search.get("list") ?? "") === listParam) return;
    // Written by hand so the commas stay commas (keys hold only a-z, 0-9 and "-"); any other parameter is kept.
    const others = new URLSearchParams(search);
    others.delete("list");
    const query = [others.toString(), listParam ? `list=${listParam}` : ""].filter(Boolean).join("&");
    navigate({ search: query ? `?${query}` : "", hash }, { replace: true, preventScrollReset: true });
  }, [listParam, search, hash, navigate]);

  const toggle = useCallback((key: string) => {
    setKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : insertInServiceOrder(current, key)));
  }, []);
  const move = useCallback((key: string, step: -1 | 1) => {
    setKeys((current) => {
      const index = current.indexOf(key);
      const target = index + step;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);
  const chosen = useMemo(() => new Set(keys), [keys]);
  return { keys, chosen, skipped: initial.skipped, toggle, move };
}
