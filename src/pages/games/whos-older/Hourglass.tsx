// Who's older?: the hourglass between the two cards, drawn like the hub tile's (art/scenes-family.tsx) in the game's
// colour. Its sand trickles in a slow loop and the glass turns over at the end of each loop, so it never stops; a new
// `turn` (each round) starts the loop again. Decoration only: it is hidden from readers.
export function Hourglass({ turn = 0, className = "" }: { turn?: number; className?: string }) {
  return <svg key={turn} className={`wo-glass${className ? ` ${className}` : ""}`} viewBox="0 0 24 40" aria-hidden="true" focusable="false">
    <path className="wo-glass-frame" d="M3 2H21M3 38H21" />
    <path className="wo-glass-frame" d="M4 2V5M20 2V5M4 38V35M20 38V35" />
    <path className="wo-glass-bulb" d="M5 3C5 13 11 17 12 20C13 17 19 13 19 3Z" />
    <path className="wo-glass-bulb" d="M5 37C5 27 11 23 12 20C13 23 19 27 19 37Z" />
    <path className="wo-sand wo-sand-top" d="M6.5 9C7.5 14 11 17 12 19.5C13 17 16.5 14 17.5 9Z" />
    <path className="wo-sand wo-sand-stream" d="M11.6 20.5H12.4V35H11.6Z" />
    <path className="wo-sand wo-sand-bottom" d="M6 36.5C6.5 31 10 27 12 24.5C14 27 17.5 31 18 36.5Z" />
  </svg>;
}
