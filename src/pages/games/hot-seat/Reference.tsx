// Hot seat: a question's Bible reference. On the recap and the final list it opens the passage in the site's BSB
// reader in a new tab, so the game is never lost (design §6.5). During the turn it is plain text, so a tap cannot leave.
// The book is written out in full from the bank's book list (the bank abbreviates unevenly: "1 Sam 16:11" beside
// "Ephesians 5:6"); the page provides the names through BookNames, and without them the bank's text is shown as is.
import { ArrowUpRight } from "lucide-react";
import { useContext } from "react";
import { BookNames } from "./book-names";
import type { FrozenQuestion } from "./deal";
import { fullReference, readerLink } from "./display";

export function Reference({ q, plain = false }: { q: Pick<FrozenQuestion, "reference" | "link">; plain?: boolean }) {
  const names = useContext(BookNames);
  if (!q.reference) return null;
  const text = fullReference(q.reference, q.link, names);
  if (plain || !q.link) return <span className="hs-ref">{text}</span>;
  return <a className="hs-ref" href={readerLink(q.link)} target="_blank" rel="noopener">
    {text}<ArrowUpRight size={13} strokeWidth={1.6} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span>
  </a>;
}
