// What the converter shows, read from the address (?kind=money&unit=talent-coin&amount=10000) and written back into it.
// Only readChoice reads the address: an unknown kind or unit, or an amount that is not a plain number, gives the
// defaults, so a link never shows raw address text.
import { modernUnitsOf, parseAmount, type ModernUnit } from "./modern";
import { findUnit, isKind, type BibleUnit, type Kind } from "./units";

export const DEFAULT_UNIT: Record<Kind, string> = { length: "cubit", weight: "shekel", money: "denarius", dry: "ephah", liquid: "bath" };

export type Chosen = { bible: BibleUnit; modern?: never } | { modern: ModernUnit; bible?: never };

export interface Choice { kind: Kind; unit: Chosen; amount: number }

export const chosenSize = (unit: Chosen) => (unit.bible ?? unit.modern).size;

/** The converter's state from the address; anything unknown or not a plain number gives the defaults. */
export function readChoice(params: URLSearchParams): Choice {
  const kindText = params.get("kind") ?? "";
  const kind: Kind = isKind(kindText) ? kindText : "length";
  const unitId = params.get("unit") ?? "";
  const bible = findUnit(kind, unitId);
  const modern = bible ? undefined : modernUnitsOf(kind).find((unit) => unit.id === unitId);
  const unit: Chosen = bible ? { bible } : modern ? { modern } : { bible: findUnit(kind, DEFAULT_UNIT[kind])! };
  const amount = parseAmount(params.get("amount") ?? "") ?? 1;
  return { kind, unit, amount };
}

/** The address of a conversion, for links from examples and the unit tables. */
export const choiceSearch = (kind: Kind, unit: string, amount: number) =>
  `?${new URLSearchParams({ kind, unit, amount: String(amount) }).toString()}`;
