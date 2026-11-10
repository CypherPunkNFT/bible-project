// Hot seat: a question's Bible reference. On the recap and the final list it opens the passage in the site's BSB
// reader in a new tab, so the game is never lost (design §6.5). During the turn it is plain text, so a tap cannot leave.
import { ArrowUpRight } from "lucide-react";
import type { FrozenQuestion } from "./deal";
import { readerLink } from "./display";

export function Reference({ q, plain = false }: { q: Pick<FrozenQuestion, "reference" | "link">; plain?: boolean }) {
  if (!q.reference) return null;
  if (plain || !q.link) return <span className="hs-ref">{q.reference}</span>;
  return <a className="hs-ref" href={readerLink(q.link)} target="_blank" rel="noopener">
    {q.reference}<ArrowUpRight size={13} strokeWidth={1.6} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span>
  </a>;
}
