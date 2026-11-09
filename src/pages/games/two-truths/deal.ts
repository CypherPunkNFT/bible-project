import type { Deck, Recent, Round, Statement } from './types';

export function compatible(a: Statement, b: Statement): boolean {
  return a.id !== b.id && a.who === b.who && a.topic !== b.topic && !a.clash?.includes(b.id) && !b.clash?.includes(a.id);
}
export function combinations(statements: readonly Statement[]): Statement[][] {
  const active = statements.filter(s => s.reviewed === true && !s.retired);
  const truths = active.filter(s => s.kind === 'truth');
  return active.filter(s => s.kind === 'lie').flatMap(lie => truths.flatMap((a, i) =>
    truths.slice(i + 1).filter(b => compatible(a, b) && compatible(a, lie) && compatible(b, lie)).map(b => [a, b, lie])));
}
export function eligiblePeople(deck: Deck) {
  return deck.people.filter(p => {
    const rows = deck.statements.filter(s => s.who === p.id && s.reviewed === true && !s.retired);
    return rows.filter(s => s.kind === 'truth').length >= 3 && rows.filter(s => s.kind === 'lie').length >= 2 && combinations(rows).length > 0;
  });
}
const pick = <T,>(items: readonly T[], rng: () => number): T => items[Math.floor(rng() * items.length)];
/** Preferences can relax; correctness and unique people within a run cannot. */
export function deal(deck: Deck, recent: Recent, used: readonly string[] = [], rng = Math.random): Round | null {
  const candidates = eligiblePeople(deck).filter(p => !used.includes(p.id)).map(p => ({
    person: p, options: combinations(deck.statements.filter(s => s.who === p.id && !s.retired)),
  })).filter(p => p.options.length);
  if (!candidates.length) return null;
  const freshPeople = candidates.filter(p => !recent.people.includes(p.person.id));
  const person = pick(freshPeople.length ? freshPeople : candidates, rng);
  const unseenLies = person.options.filter(r => !recent.statements.includes(r[2].id));
  const eligible = unseenLies.length ? unseenLies : person.options;
  const lies = [...new Map(eligible.map(r=>[r[2].id,r[2]])).values()];
  const lie = pick(lies, rng);
  const options = person.options.filter(r => r[2].id === lie.id);
  const leastSeen = Math.min(...options.map(r => r.slice(0, 2).filter(s => recent.statements.includes(s.id)).length));
  const rows = pick(options.filter(r => r.slice(0, 2).filter(s => recent.statements.includes(s.id)).length === leastSeen), rng).slice();
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return { who: person.person.id, ids: rows.map(s => s.id), pick: null, revealed: false, awards: [] };
}
