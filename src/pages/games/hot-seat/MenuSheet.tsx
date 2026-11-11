// Hot seat: the menu (design §6.8), a sheet over any game screen; opening it pauses a running turn. Resume, How to play
// and End game sit at the top where they are always on screen; then players (add, remove, change group) and settings
// (applied from the next turn). End game asks first in the site's own dialog, never the browser's grey box.
import { Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NAME_MAX } from "@/lib/live-quiz/names";
import { ConfirmDialog } from "../kit";
import { MAX_PLAYERS, type Session, type Settings } from "./game";
import { GROUPS, type Group } from "./pool";
import { GameSettings } from "./Setup";

interface Props {
  session: Session;
  onClose: () => void;
  onAddPlayer: (name: string, group: Group) => void;
  onRemovePlayer: (id: string) => void;
  onSetGroup: (id: string, group: Group) => void;
  onSettings: (change: Partial<Settings>) => void;
  onHow: () => void;
  onEnd: () => void;
}

export function MenuSheet(props: Props) {
  const { session } = props;
  const [name, setName] = useState("");
  const [group, setGroup] = useState<Group>("adults");
  const [ending, setEnding] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const latestClose = useRef(props.onClose);
  latestClose.current = props.onClose;
  useEffect(() => {
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); latestClose.current(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const active = session.players.filter((p) => !p.left);
  const seated = session.current?.playerId;
  const add = () => { props.onAddPlayer(name, group); setName(""); };
  return <div className="hs-sheet-back" onClick={props.onClose}>
    <div className="hs-sheet" role="dialog" aria-modal="true" aria-labelledby="hs-menu-title" onClick={(event) => event.stopPropagation()}>
      <div className="hs-sheet-head">
        <h2 id="hs-menu-title">Menu</h2>
        <button ref={close} type="button" className="hs-icon" onClick={props.onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="hs-row hs-menu-actions">
        <button type="button" className="hs-primary" onClick={props.onClose}>Resume</button>
        <button type="button" className="hs-secondary" onClick={props.onHow}>How to play</button>
        <button type="button" className="hs-secondary is-danger" onClick={() => setEnding(true)}>End game</button>
      </div>

      <h3>Players</h3>
      <ul className="hs-menu-players">{active.map((p) => <li key={p.id}>
        <span className="hs-cut">{p.name}</span>
        <select value={p.group} aria-label="Age group" onChange={(event) => props.onSetGroup(p.id, event.target.value as Group)}>
          {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
        <button type="button" className="hs-icon" onClick={() => props.onRemovePlayer(p.id)} disabled={p.id === seated} aria-label="Remove"><Trash2 size={16} aria-hidden="true" /></button>
      </li>)}</ul>
      <p className="hs-note">A new group applies from that player's next turn. A new player joins from the next round with 0 points.</p>
      {active.length < MAX_PLAYERS && <div className="hs-add">
        <input type="text" value={name} maxLength={NAME_MAX} aria-label="New player's name" placeholder="New player" onChange={(event) => setName(event.target.value)} />
        <select value={group} aria-label="New player's age group" onChange={(event) => setGroup(event.target.value as Group)}>
          {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
        <button type="button" className="hs-secondary" onClick={add}>Add player</button>
      </div>}

      <h3>Settings</h3>
      <p className="hs-note">Changes apply from the next turn.</p>
      <GameSettings settings={session.settings} onSettings={props.onSettings} />
      <ConfirmDialog open={ending} title="End this game now?" confirmLabel="End game" cancelLabel="Keep playing" danger
        onConfirm={() => { setEnding(false); props.onEnd(); }} onCancel={() => setEnding(false)} className="hs-confirm">
        <p>The standings so far are kept.</p>
      </ConfirmDialog>
    </div>
  </div>;
}
