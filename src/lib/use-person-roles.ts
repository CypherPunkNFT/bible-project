import { useEffect, useMemo, useState } from "react";
import { assignRoles, type PersonRole } from "@/lib/people-roles";
import { loadEnglishPeople, type PersonRow } from "@/lib/study";

/**
 * Every person's role (king, prophet, priest…), read from the English descriptions whatever the page's language. The
 * role rules are English word rules, and on a translated page the rows hold translated descriptions, which match none
 * of them, so everyone read as "family" (sequence 27's mistake check, 4,240 flags). Until the English list arrives, the
 * roles are read from the rows given (right in English).
 */
export function usePersonRoles(people: PersonRow[]): Map<string, PersonRole> {
  const [english, setEnglish] = useState<PersonRow[] | null>(null);
  useEffect(() => {
    let live = true;
    loadEnglishPeople().then(
      (rows) => { if (live) setEnglish(rows); },
      (error) => console.error("People roles: could not load the English people list; roles read from the page's own text instead", error),
    );
    return () => { live = false; };
  }, []);
  return useMemo(() => {
    const ids = new Set(people.map((person) => person.id));
    return assignRoles(english ? english.filter((person) => ids.has(person.id)) : people);
  }, [english, people]);
}
