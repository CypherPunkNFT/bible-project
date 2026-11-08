// The day card (design 7.5): drawn in HTML and CSS, with the day line taken from the entry rather than today's date, so it
// is true for that day whenever it is opened. It builds a plain card description first, which the shared verse-card
// generator (chain C, not yet designed) can take for "Save as image" and link previews later (design 8.4).
import type { CardDescription, CardLook } from "./card";

/** Small line ornaments, one per look: a star (Numbers 24:17; Matthew 2:2), a palm branch, a sunrise, a plain rule. */
export function CardOrnament({ look }: { look: CardLook }) {
  const common = { className: "cd-ornament", viewBox: "0 0 48 24", fill: "none", stroke: "currentColor", strokeWidth: 1.2, "aria-hidden": true } as const;
  if (look === "advent" || look === "christmas") {
    return <svg {...common}><path d="M24 3l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L24 17.3 18.1 21l1.7-6.7-5.3-4.4 6.9-.5z" /><path d="M4 12h8M36 12h8" /></svg>;
  }
  if (look === "palm") {
    return <svg {...common}><path d="M10 20C18 14 28 9 40 5" /><path d="M16 16l-4-6M21 13l-3-7M26 10.5l-2-7M31 8.5l-.5-6M18 15.5l2 5M23 12.5l3 5M28 10l4 4.5M33 7.7l5 3" /></svg>;
  }
  if (look === "easter") {
    return <svg {...common}><path d="M6 19h36" /><path d="M14 19a10 10 0 0 1 20 0" /><path d="M24 4v4M12.5 8.5l2.6 2.8M35.5 8.5l-2.6 2.8M6.5 14l3.4 1.2M41.5 14l-3.4 1.2" /></svg>;
  }
  return <svg {...common}><path d="M8 12h32" /><circle cx="24" cy="12" r="1.6" fill="currentColor" stroke="none" /></svg>;
}

export function DayCard({ card }: { card: CardDescription | null }) {
  if (!card) return <figure className="cd-card cd-card-waiting" aria-busy="true"><figcaption>Loading the day's verse…</figcaption></figure>;
  return (
    <figure className={`cd-card cd-look-${card.look}`} data-card-key={`${card.occasion}/${card.key}`}>
      <CardOrnament look={card.look} />
      <p className="cd-card-line">{card.line}</p>
      <blockquote className="scripture cd-card-verse" lang="en">“{card.verse}”</blockquote>
      <figcaption>
        <span className="cd-card-reference">{card.reference}</span>
        <span className="cd-card-address">{card.address}</span>
      </figcaption>
    </figure>
  );
}
