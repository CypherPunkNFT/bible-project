// Memory card match: the shelf above the grid where found pairs land (the audit's item 3, the Ravensburger pile). One
// slot per pair from the deal, so the shelf never changes height and a flight has a fixed target; each slot fills with
// a small card in the pair's colour, in the order found, after its two cards fly up from the board. The whole shelf is
// one button (a tap target at any width) that opens the pairs as plain text under it: the who, the story and the
// reference, no link, so nothing leads away from a live board (design 10). It replaces the "Pairs found" list.
import { useState, type CSSProperties } from "react";
import { plural } from "@/lib/site-format";
import { teamTone } from "../kit";
import type { PairInfo, PairsFile } from "./deal";
import { toneColor } from "./tones";

export interface ShelfPair {
  pair: PairInfo;
  tone: number;
  /** The player who took it, in pass and play. */
  player: number | null;
  /** Still on its way: its slot is held, the card itself is not drawn yet. */
  arriving: boolean;
}

interface ShelfProps {
  data: PairsFile;
  pairs: readonly ShelfPair[];
  total: number;
  players: number;
  /** The slot element the flying cards aim for, by its place on the shelf. */
  slotRef: (place: number, element: HTMLSpanElement | null) => void;
}

export function Shelf({ data, pairs, total, players, slotRef }: ShelfProps) {
  const [open, setOpen] = useState(false);
  const landed = pairs.filter((entry) => !entry.arriving);
  return <div className="mm-shelf" style={{ "--mm-pairs": total } as CSSProperties}>
    <button type="button" className="mm-shelf__row" aria-expanded={open} onClick={() => setOpen((o) => !o)}
      aria-label={plural(landed.length, "{n} pair found, read them", "{n} pairs found, read them")}>
      {Array.from({ length: total }, (_, place) => {
        const entry = pairs[place];
        const style = entry ? ({ "--pair": toneColor(entry.tone), "--team": entry.player === null ? undefined : teamTone(entry.player) } as CSSProperties) : undefined;
        const classes = `mm-shelf__slot${entry ? (entry.arriving ? " is-arriving" : " is-filled") : ""}`;
        return <span key={place} ref={(el) => slotRef(place, el)} className={classes} style={style} aria-hidden="true">
          {entry && !entry.arriving && <>
            {players > 1 && entry.player !== null && <span className="mm-shelf__dot" />}
            <span className="mm-shelf__who">{data.characters[entry.pair.who].label}</span>
          </>}
        </span>;
      })}
    </button>
    {open && <ul className="mm-shelf__list">
      {landed.length === 0 && <li className="mm-note">None yet.</li>}
      {landed.map(({ pair }) => <li key={pair.id}>
        <strong>{data.characters[pair.who].label}</strong> — {pair.story} · <span className="mm-ref">{pair.ref}</span>
      </li>)}
    </ul>}
  </div>;
}
