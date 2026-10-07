/**
 * What each person in "Everyone in the Bible" was, read from their own one-line description (the `b` field of
 * data/study/people.json): king, prophet, priest, Levite, judge, leader, warrior, disciple, a nation, or someone
 * known through their family.
 *
 * Only words about the person count. "Father-in-law of King Jehoahaz" is family, not a king: a clause that opens with
 * a family word ("son of…", "wife of…") describes a relative, and "King Josiah's secretary" names the king only to
 * place the person. An "a…" aside right after a relative describes that relative when it is their role ("Father of
 * Othniel, a judge of Israel"), while "Son of David, king of Israel" stays the person's own. Otherwise the first role named about the person wins ("Prophet and judge" is a prophet).
 */

export type PersonRole = "king" | "prophet" | "priest" | "levite" | "judge" | "leader" | "warrior" | "disciple" | "nation" | "family";

/** Colours from the site's palette (both themes), chosen so no two roles look alike; judge, disciple and family use their own (people-catalog.css, owner's picks). */
export const PERSON_ROLES: { id: PersonRole; label: string; color: string; note: string }[] = [
  { id: "king", label: "King", color: "var(--epistles)", note: "Kings, queens and emperors" },
  { id: "prophet", label: "Prophet", color: "var(--prophets)", note: "Prophets, prophetesses and seers" },
  { id: "priest", label: "Priest", color: "var(--acts)", note: "Priests and high priests" },
  { id: "levite", label: "Levite", color: "var(--revelation)", note: "Levites, singers, gatekeepers and temple servants" },
  { id: "judge", label: "Judge", color: "var(--role-judge)", note: "The judges of Israel" },
  { id: "leader", label: "Leader", color: "var(--poetry)", note: "Patriarchs, leaders, officials and elders" },
  { id: "warrior", label: "Warrior", color: "var(--history)", note: "Warriors, commanders and mighty men" },
  { id: "disciple", label: "Disciple", color: "var(--role-disciple)", note: "Apostles, disciples and early believers" },
  { id: "nation", label: "Nation", color: "color-mix(in srgb, var(--prophets) 40%, var(--apocrypha))", note: "Tribes, clans and peoples" },
  { id: "family", label: "Family", color: "var(--role-family)", note: "Known through their family line" },
];

export const roleColor = (role: PersonRole) => PERSON_ROLES.find((r) => r.id === role)?.color ?? "var(--apocrypha)";

/** Role words, tried within each clause; the earliest match in the clause wins. */
const RULES: [PersonRole, RegExp][] = [
  ["king", /\b(king|queen|pharaoh|emperor|caesar|tetrarch|monarch|ruled|reigned)s?\b/],
  ["prophet", /\b(prophet|prophetess|seer|prophesied)s?\b/],
  ["priest", /\b(high priest|priest|priestly)s?\b/],
  ["levite", /\b(levite|levitical|gatekeeper|doorkeeper|singer|musician|temple servant|porter|kohathite|merarite|gershonite)s?\b/],
  ["judge", /\bjudges?\b/],
  ["warrior", /\b(warrior|mighty m[ae]n|commander|captain|soldier|army|general|fought|archer|bodyguard)s?\b/],
  ["disciple", /\b(apostle|disciple|follower of jesus|believer|christian|co-worker|coworker|fellow worker|evangelist|deacon|church)s?\b/],
  ["leader", /\b(leader|chief|head of|elder|official|officer|governor|prince|overseer|secretary|scribe|counselor|counsellor|steward|administrator|patriarch|ruler|led|spy|spies|vizier|advisor|adviser)s?\b/],
  ["nation", /^(an? |the )?([a-z-]+ )?(people|tribe|tribes|clan|clans|nation|nations|inhabitants|kingdom|region|descendants)\b|\bpeople group\b/],
];

const KIN = "son|sons|daughter|daughters|father|mother|wife|wives|husband|brother|sister|grandson|granddaughter|grandfather|grandmother|descendant|ancestor|uncle|aunt|nephew|niece|cousin|father-in-law|mother-in-law|son-in-law|daughter-in-law|brother-in-law|sister-in-law|firstborn|child|children|concubine|widow|heir|offspring";
/** Family words for the next generation, who can hold the same role as the relative named. */
const HEIRS = /\b(son|sons|daughter|daughters|grandson|granddaughter|descendant|heir|offspring|firstborn|child|children)\b/;
/** A clause about a relative: "son of…", "Eldest son of…", "David's son…", "Moses' brother…". */
const FAMILY_OPENING = new RegExp(`^(an? |the )?((eldest|youngest|second|third|fourth|fifth|older|younger|only|twin|first|last|beloved|rebellious|[a-z-]+'s?) )?(${KIN})\\b`);

/** Mentions that only place the person ("King Josiah's secretary", "during Hezekiah's reign", "under King Saul"). */
const PLACING = /\b(king|queen|pharaoh|prophet|priest|judge|apostle) [a-z]+'s\b|\b(during|under|in|of|to|for|by|with|against|from|served|serving|before|after|whom|reign of|time of|days of) (the )?(evil |wicked |good )?(king|queen|pharaoh|prophet|priest|high priest|judge|apostles?|emperor|caesar)s?\b( [a-z]+)?/g;

/** Roles that come with the name, whatever the description says. */
const BY_NAME: Record<string, PersonRole> = { Pharaoh: "king", Caesar: "king", Herod: "king", Jesus: "king" };

/** One person's role; `relativeRoles` gives the roles known for a name, to recognise asides about a relative. */
export function roleOf(description: string, name = "", relativeRoles?: (name: string) => Set<PersonRole> | undefined): PersonRole {
  const byName = BY_NAME[name.replace(/_/g, " ")];
  if (byName) return byName;
  const clauses = description.replace(/’/g, "'").split(/[,;.:()]| and /).map((c) => c.trim()).filter(Boolean);
  let relative = "", heir = false;
  for (const text of clauses) {
    const clause = text.toLowerCase();
    const kin = FAMILY_OPENING.exec(clause);
    if (kin) { relative = /\bof ([A-Z][\w-]+)/.exec(text)?.[1] ?? ""; heir = HEIRS.test(kin[0]); continue; }
    const own = clause.replace(PLACING, " ");
    let best: { role: PersonRole; at: number } | null = null;
    for (const [role, pattern] of RULES) {
      const found = own.match(pattern);
      if (found && (best === null || (found.index ?? 0) < best.at)) best = { role, at: found.index ?? 0 };
    }
    // An aside naming the relative's own role is about the relative ("Wife of Hadar, king of Edom", "Father of Saul, the
    // first king of Israel"). A son or descendant may hold the same role ("Son of David, king of Israel" is Solomon's own),
    // so after those only an "a…" aside is taken as the relative's ("Son of Samuel, a corrupt judge" stays the son's,
    // as Samuel is known as a prophet).
    // After a wife, mother, father and the like, an aside about a relative not otherwise known is taken as theirs too.
    if (!best) continue; // a clause naming no role keeps the relative in view ("Mother of Jehoahaz and Zedekiah, kings…")
    const known = relative ? relativeRoles?.(relative) : undefined;
    const aboutRelative = !!relative && (heir ? /^an? /.test(clause) && !!known?.has(best.role) : known ? known.has(best.role) : true);
    relative = "";
    if (aboutRelative) continue;
    return best.role;
  }
  return "family";
}

/** Every person's role, read in two passes so asides about a named relative can be recognised. */
export function assignRoles<T extends { id: string; n: string; b: string }>(people: T[]): Map<string, PersonRole> {
  const known = new Map<string, Set<PersonRole>>();
  for (const person of people) {
    const role = roleOf(person.b, person.n);
    if (role === "family") continue;
    const roles = known.get(person.n) ?? new Set<PersonRole>();
    roles.add(role);
    known.set(person.n, roles);
  }
  return new Map(people.map((person) => [person.id, roleOf(person.b, person.n, (name) => known.get(name))]));
}
