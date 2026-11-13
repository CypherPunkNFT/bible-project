// What came first?: the difficulty bands of each pair category (design §4.1–§4.7). The build counts pairs per band with
// these, and the game deals by them. Who lived first's bands are Who's older?'s own (§6.3 there), unchanged.
import { BANDS, type Band } from "../whos-older/pairing.ts";
import type { Order, PairCategory } from "./order.ts";

export { BANDS, type Band };

const WHOS_OLDER_FAMILY_KINDS = ["parent", "grandparent", "created-first"];

/** Easy, Medium or Hard for one askable pair of a category. */
export function bandOf(category: PairCategory, order: Order): Band {
  const { first, second, reason } = order;
  const bothFamous = first.tier === 1 && second.tier === 1;
  const bothKnown = first.tier <= 2 && second.tier <= 2;
  const gap = reason.kind === "windows" ? reason.gap : 0;
  switch (category) {
    case "lived":
      if (reason.kind === "fact") return bothFamous && WHOS_OLDER_FAMILY_KINDS.includes(reason.fact.kind) ? "medium" : "hard";
      if (!first.shown && !second.shown) return bothFamous ? "medium" : "hard";
      if (bothFamous && gap >= 400) return "easy";
      return bothKnown && gap >= 100 ? "medium" : "hard";
    case "happened":
      if (reason.kind === "fact") return bothFamous && !reason.fact.close ? "medium" : "hard";
      if (bothFamous && gap >= 400) return "easy";
      return bothKnown && gap >= 100 ? "medium" : "hard";
    case "ruled":
      // The judges' "before Saul" facts span whole eras (Gideon and Pilate), so they band by fame alone.
      if (reason.kind === "fact" && reason.fact.kind === "expanded") return bothFamous ? "easy" : bothKnown ? "medium" : "hard";
      if (reason.kind === "fact") return bothFamous && reason.fact.kind === "succession" ? "medium" : "hard";
      if (bothKnown && gap >= 300) return "easy";
      return bothKnown && gap >= 50 ? "medium" : "hard";
    case "built":
      // A small pool with few famous items: two well-known items 400 years apart are Easy (Noah's ark, Nehemiah's wall).
      if (reason.kind === "fact") return bothFamous ? "medium" : "hard";
      if (bothKnown && gap >= 400) return "easy";
      return bothKnown && gap >= 100 ? "medium" : "hard";
    case "died":
      if (reason.kind === "fact") return bothFamous ? "medium" : "hard";
      if (bothFamous && gap >= 400) return "easy";
      return bothKnown && gap >= 100 ? "medium" : "hard";
    case "went": {
      const apart = reason.kind === "position" ? reason.apart : 1;
      if (!bothKnown || apart <= 2) return "hard";
      return apart >= 6 ? "easy" : "medium";
    }
    case "books": {
      const apart = reason.kind === "position" ? reason.apart : 1;
      if (first.testament !== second.testament || apart >= 20) return "easy";
      return apart >= 6 ? "medium" : "hard";
    }
  }
}
