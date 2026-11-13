// Who ruled first? (category 3, design §4.3): the one place a fact reaches more than its own pair. Joshua and the
// judges have no years; Acts 13:19–21 says God gave Israel judges until Samuel and only then a king, Saul. So each of
// them is before Saul and before every ruler who certainly began after Saul: a window wholly after Saul's, or a direct
// order fact from Saul. The build and the game expand the facts with this same function.
import type { Fact, Item, Span } from "../order.ts";

export interface BeforeSaul { ids: string[]; saul: string; refs: Span[]; why: string }

export function expandBeforeSaul(items: readonly Item[], facts: readonly Fact[], rule: BeforeSaul): Fact[] {
  const saul = items.find((item) => item.id === rule.saul);
  if (!saul) return [];
  const early = new Set(rule.ids);
  const afterSaul = new Set(facts.filter((f) => f.first === saul.id).map((f) => f.second));
  const targets = items.filter((item) => !early.has(item.id) && (item.id === saul.id || afterSaul.has(item.id)
    || (saul.hi !== null && item.lo !== null && item.lo > saul.hi)));
  const present = new Set(items.map((item) => item.id));
  return rule.ids.filter((id) => present.has(id)).flatMap((id) => targets.map((target) => ({
    first: id, second: target.id, kind: "expanded", refs: rule.refs, why: rule.why, derived: true,
  })));
}
