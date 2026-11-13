// The big screen's join panel for team play (docs/features/team-play/design.md, section 3): the QR code, the address
// and code to type, each team with whether its phone is here, a Free button per held team (so another phone can take
// it), and the game's Start. `JoinStrip` is the same information in one line, shown during play so a late or replaced
// phone can still join. The QR and link carry only /team/<code>, never the laptop's token (Review 8).
import QRCode from "qrcode";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { TeamStatus } from "@/lib/team-room/protocol";
import { teamTone } from "../kit";
import { joinAddress, joinUrl } from "./host";
import type { SocketStatus } from "./useTeamRoom";
import "./team-play.css";

const STATE_TEXT: Record<TeamStatus["state"], string> = { open: "Waiting for a phone", held: "Phone joined", away: "Phone away" };

/** "48 213": easier to read off a projector. */
const groupedCode = (code: string) => `${code.slice(0, 2)} ${code.slice(2)}`;

function useQr(url: string): string | null {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1f1b16", light: "#ffffff" } })
      .then((value) => { if (active) setQr(value); })
      .catch((error: unknown) => console.warn("team-play: the QR code could not be drawn", error));
    return () => { active = false; };
  }, [url]);
  return qr;
}

interface TeamListProps { teams: TeamStatus[]; onFree: (team: string) => void; compact?: boolean }

function TeamList({ teams, onFree, compact = false }: TeamListProps) {
  return <ul className={`tp-teams${compact ? " is-compact" : ""}`} aria-label="Teams">
    {teams.map((team, n) => <li key={team.id} className="tp-team" data-state={team.state} style={{ "--_team": teamTone(n) } as CSSProperties}>
      <span className="tp-dot" aria-hidden="true" />
      <span className="tp-team-name" dir="auto">{team.name}</span>
      <span className="tp-team-state">{STATE_TEXT[team.state]}</span>
      {team.state !== "open" && <button type="button" className="tp-free" onClick={() => onFree(team.id)}
        title={`Let another phone take ${team.name}`}>Free</button>}
    </li>)}
  </ul>;
}

export function ConnectionNote({ status }: { status: SocketStatus }) {
  if (status === "open" || status === "connecting") return null;
  const text = status === "unsupported" ? "This browser cannot run team games."
    : status === "closed" ? "This team game has ended or was opened on another screen."
      : "Reconnecting to the team phones…";
  return <p className="tp-note" role="status">{text}</p>;
}

interface LobbyProps {
  code: string;
  teams: TeamStatus[];
  status: SocketStatus;
  onFree: (team: string) => void;
  /** The game's Start (and anything else it wants beside it). */
  children: ReactNode;
}

export function Lobby({ code, teams, status, onFree, children }: LobbyProps) {
  const qr = useQr(joinUrl(code));
  const joined = teams.filter((team) => team.state === "held").length;
  return <section className="tp-lobby" aria-label="Join with team phones">
    <div className="tp-lobby-join">
      <div>
        <p className="tp-join">One phone per team: go to <b>{joinAddress()}</b> and enter</p>
        <p className="tp-code" aria-label={`Game code ${code}`}>{groupedCode(code)}</p>
        <p className="tp-hint">Or scan the code with the phone's camera.</p>
      </div>
      {qr && <img className="tp-qr" src={qr} alt={`QR code that opens ${joinUrl(code)}`} />}
    </div>
    <ConnectionNote status={status} />
    <TeamList teams={teams} onFree={onFree} />
    <p className="tp-hint">{joined === teams.length ? "Every team has a phone." : `${joined} of ${teams.length} teams have a phone. You can start anyway: tap for a team on this screen.`}</p>
    <div className="tp-actions">{children}</div>
  </section>;
}

export function JoinStrip({ code, teams, status, onFree }: Omit<LobbyProps, "children">) {
  return <div className="tp-strip">
    <p className="tp-strip-join">Team phones: <b>{joinAddress()}</b> · <b className="tp-strip-code">{groupedCode(code)}</b></p>
    <TeamList teams={teams} onFree={onFree} compact />
    <ConnectionNote status={status} />
  </div>;
}
