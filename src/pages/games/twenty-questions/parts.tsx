// Bible twenty questions: small pieces both modes share. The turn trail (design §11.2, on the kit's progress trail:
// ink dots for questions, gold diamonds for guesses, so colour is never the only signal), the person's summary and
// link (§8 step 5), a verse note whose words load from the reader's Bible (§10.2, §11.7), and the Quit button with
// its site-styled confirm.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { formatNumber } from "@/lib/site-format";
import { verseReference } from "@/lib/verses";
import { ConfirmDialog, ProgressTrail, type TrailMark } from "../kit";
import type { TqPerson } from "./engine";
import { personHref } from "./shared";

interface TrailProps {
  kinds: readonly ("q" | "g")[];
  limit: number;
  /** The guess is coming: the trail pulses while the site makes up its mind. */
  thinking?: boolean;
  /** The game is over: the marks fill gold one after another. */
  won?: boolean;
  className?: string;
}

/** One mark per turn: a question (a round ink dot) or a guess (a gold diamond), with the turn written under it. */
export function Trail({ kinds, limit, thinking = false, won = false, className = "" }: TrailProps) {
  const now = Math.min(kinds.length + 1, limit);
  const marks: TrailMark[] = Array.from({ length: limit }, (_, i) => kinds[i] === "g" ? "part" : kinds[i] ? "right" : i === kinds.length && !won ? "current" : "empty");
  const tones = kinds.map((kind) => (kind === "g" ? "var(--tq-gold)" : "var(--ink)"));
  const label = `Turn ${formatNumber(now)} of ${formatNumber(limit)}`;
  return <div className={`tq-trail${thinking ? " is-thinking" : ""}${won ? " is-won" : ""}${className ? ` ${className}` : ""}`}>
    <ProgressTrail marks={marks} tones={tones} shape="dots" label={label} size=".7rem" />
    {!won && <p className="tq-turn">{label}</p>}
  </div>;
}

export function PersonSummary({ person, onLeave }: { person: TqPerson; onLeave?: () => void }) {
  return <div className="tq-person">
    <p className="tq-person-name">{person.label}</p>
    {person.b && <p className="tq-person-brief">{person.b}</p>}
    {person.s && person.s !== person.b && <p className="tq-person-story">{person.s}</p>}
    <Link className="tq-link" to={personHref(person)} onClick={onLeave}><span>Read about</span> <span>{person.label}</span></Link>
  </div>;
}

/** The verse behind one note: its reference, then its words from the reader's Bible when they load. */
export function VerseNote({ verse }: { verse: number }) {
  const catalog = useCatalog();
  return <blockquote className="tq-verse">
    <p><Verse id={verse} /></p>
    <footer>{verseReference(catalog, verse)}</footer>
  </blockquote>;
}

/** Quit, behind the kit's confirm. `onOpen` tells the mode a dialog is up, so its letter keys stay quiet. */
export function QuitButton({ onQuit, onOpen }: { onQuit: () => void; onOpen?: (open: boolean) => void }) {
  const [asking, setAsking] = useState(false);
  const set = (open: boolean) => { setAsking(open); onOpen?.(open); };
  return <>
    <button type="button" className="tq-quiet" onClick={() => set(true)}>Quit</button>
    <ConfirmDialog open={asking} title="Quit this game?" confirmLabel="Yes, quit" cancelLabel="Keep playing" danger
      onConfirm={() => { set(false); onQuit(); }} onCancel={() => set(false)}>
      <p className="tq-small">Your turns so far will be lost.</p>
    </ConfirmDialog>
  </>;
}
