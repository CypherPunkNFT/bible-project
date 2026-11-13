// Memory card match: the playing-card art. A back is an ivory rim around a framed, patterned panel with an oval seal in
// the middle (memory-match.css, "The playing-card back"). Who cards are teal with a bust in the seal, Story cards wine
// red with an open book. Hard deals one plain navy back with a star for both kinds, so a back never gives the kind away.
// The same emblems sit in the corners of a face-up card, like a suit.
type Kind = "who" | "story";

/** A small emblem drawn in currentColor: a bust for Who, an open book for Story, an eight-point star for a plain back. */
export function Emblem({ kind }: { kind: Kind | null }) {
  return <svg className="mm-emblem" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {kind === "who" && <>
      <circle cx="12" cy="8.2" r="4.2" fill="currentColor" />
      <path d="M3.8 21.5c0-4.6 3.7-7.8 8.2-7.8s8.2 3.2 8.2 7.8z" fill="currentColor" />
    </>}
    {kind === "story" && <>
      <path d="M11.2 6.6C9.3 5.3 6.7 4.9 3 5.1v12.8c3.7-.2 6.3.2 8.2 1.4z" fill="currentColor" />
      <path d="M12.8 6.6c1.9-1.3 4.5-1.7 8.2-1.5v12.8c-3.7-.2-6.3.2-8.2 1.4z" fill="currentColor" />
    </>}
    {kind === null && <path fill="currentColor" d="M12 2 13.61 8.12 19.07 4.93 15.88 10.39 22 12 15.88 13.61 19.07 19.07 13.61 15.88 12 22 10.39 15.88 4.93 19.07 8.12 13.61 2 12 8.12 10.39 4.93 4.93 10.39 8.12Z" />}
  </svg>;
}

/** The patterned panel and seal of a card back. kind null = the plain Hard back, with no word on it. */
export function CardBack({ kind }: { kind: Kind | null }) {
  const label = kind === "who" ? "Who" : kind === "story" ? "Story" : null;
  return <span className={`mm-back is-${kind ?? "plain"}`}>
    <span className="mm-back__seal">
      <Emblem kind={kind} />
      {label && <span className="mm-back__label">{label}</span>}
    </span>
  </span>;
}
