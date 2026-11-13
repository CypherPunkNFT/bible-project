// /team and /team/:code: a team phone's page (docs/features/team-play/design.md, section 3). A short address outside
// /games so it can be read off a projector. Steps: the five-digit code, the team, then that game's phone screen, which
// draws whatever view the big screen sends. A six-digit code is a live quiz's, so it goes on to /play/<code> (Review 18).
import { lazy, Suspense, useCallback, useEffect, useState, type ComponentType, type CSSProperties, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isTeamCode, type RoomInfo, type TeamGame } from "@/lib/team-room/protocol";
import { teamTone } from "../kit";
import { readSeat, useTeamPhone } from "./phone";
import "./team-play.css";

/** What every game's phone screen is given. */
export interface PhoneScreenProps { view: unknown; team: string; send: (data: unknown) => void }

const SCREENS: Record<TeamGame, ComponentType<PhoneScreenProps>> = {
  "memory-match": lazy(() => import("../memory-match/TeamPhone")),
  "map-quest": lazy(() => import("../map-quest/TeamPhone")),
};

const teamIndex = (team: string) => Math.max(0, Number(team.slice(1)) - 1);

async function lookUp(code: string): Promise<RoomInfo | null> {
  const response = await fetch(`/api/team-room/rooms/${code}`, { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as RoomInfo;
}

/** Keeps the screen awake during a game where the browser allows it, asking again when the tab comes back. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then((l) => { lock = l; }, (error: unknown) => console.warn("team-play: the screen could not be kept awake", error));
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => { document.removeEventListener("visibilitychange", request); void lock?.release(); };
  }, [active]);
}

function CodeStep({ error, onCode }: { error?: string; onCode: (code: string) => void }) {
  const [code, setCode] = useState("");
  const digits = code.replace(/\D/g, "");
  const submit = (event: FormEvent) => { event.preventDefault(); onCode(digits); };
  return <form className="tp-phone" onSubmit={submit}>
    <h1>Join a team game</h1>
    <label htmlFor="tp-code" className="tp-hint">Game code from the big screen</label>
    <input id="tp-code" className="tp-code-input" inputMode="numeric" autoComplete="off" pattern="[0-9 ]*" maxLength={7} value={code}
      onChange={(e) => setCode(e.target.value)} placeholder="12 345" />
    {error && <p className="tp-error" role="alert">{error}</p>}
    <button type="submit" className="tp-button" disabled={digits.length !== 5 && digits.length !== 6}>Join</button>
  </form>;
}

function TeamStep({ info, note, onTeam }: { info: RoomInfo; note?: string; onTeam: (team: string) => void }) {
  return <div className="tp-phone">
    <h1>Which team are you?</h1>
    <p className="tp-hint">One phone per team. This phone becomes your team's controller.</p>
    {note && <p className="tp-error" role="alert">{note}</p>}
    <ul className="tp-pick">
      {info.teams.map((team, n) => <li key={team.id}>
        <button type="button" disabled={team.state !== "open"} onClick={() => onTeam(team.id)} style={{ "--_team": teamTone(n) } as CSSProperties}>
          <span dir="auto">{team.name}</span>
          {team.state !== "open" && <small>{team.state === "held" ? "Has a phone" : "Phone away"}</small>}
        </button>
      </li>)}
    </ul>
  </div>;
}

interface PlayingProps { code: string; info: RoomInfo; wanted: string | null; onBack: (note?: string) => void }

function Playing({ code, info, wanted, onBack }: PlayingProps) {
  const back = useCallback(() => onBack(), [onBack]);
  const phone = useTeamPhone(code, wanted, back);
  useWakeLock(Boolean(phone.seat));
  const { problem } = phone;
  useEffect(() => {
    if (problem && problem.code !== "ended") onBack(problem.message);
  }, [problem, onBack]);
  if (problem?.code === "ended") return <div className="tp-phone"><p className="tp-big">This game has ended. Thanks for playing!</p></div>;
  if (phone.status === "closed") return <div className="tp-phone"><p className="tp-big">This team is open in another tab.</p></div>;
  if (!phone.seat) return <div className="tp-phone"><p className="tp-big">Joining…</p></div>;
  const Screen = SCREENS[info.game!];
  const tone = { "--_team": teamTone(teamIndex(phone.seat.team)) } as CSSProperties;
  return <div className="tp-phone" style={tone}>
    <p className="tp-phone-bar"><span dir="auto">{phone.seat.name}</span>
      <small>{phone.status !== "open" ? "Reconnecting…" : !phone.hostOnline ? "Waiting for the big screen" : "Connected"}</small></p>
    {phone.view === null ? <p className="tp-big">You're in. Watch the big screen.</p>
      : <Suspense fallback={<p className="tp-big">Loading…</p>}>
        <Screen view={phone.view} team={phone.seat.team} send={phone.sendInput} />
      </Suspense>}
  </div>;
}

type Step =
  | { at: "code"; error?: string }
  | { at: "checking"; code: string; note?: string }
  | { at: "team"; code: string; info: RoomInfo; note?: string }
  | { at: "playing"; code: string; info: RoomInfo; wanted: string | null };

export default function TeamJoinPage() {
  useEffect(() => { document.title = "Join a team game · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const { code: fromLink } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(() => (fromLink && isTeamCode(fromLink) ? { at: "checking", code: fromLink } : { at: "code" }));

  const checking = step.at === "checking" ? step.code : null;
  const checkingNote = step.at === "checking" ? step.note : undefined;
  useEffect(() => {
    if (!checking) return;
    let live = true;
    lookUp(checking).then((info) => {
      if (!live) return;
      if (!info?.exists || !info.game) return setStep({ at: "code", error: "No game with that code. Check the big screen." });
      setStep(readSeat(checking) ? { at: "playing", code: checking, info, wanted: null } : { at: "team", code: checking, info, note: checkingNote });
    }).catch((error: unknown) => {
      console.warn(`team-play: could not look up game ${checking}`, error);
      if (live) setStep({ at: "code", error: "The game could not be reached. Check the internet connection and try again." });
    });
    return () => { live = false; };
  }, [checking, checkingNote]);

  const onCode = (code: string) => {
    if (code.length === 6) return navigate(`/play/${code}`); // a live quiz's code
    if (!isTeamCode(code)) return setStep({ at: "code", error: "A team game's code has five digits." });
    navigate(`/team/${code}`, { replace: true });
    setStep({ at: "checking", code });
  };

  const backToTeams = useCallback((note?: string) => {
    setStep((current) => (current.at === "playing" ? { at: "checking", code: current.code, note } : current));
  }, []);

  return <div className="mx-auto max-w-2xl px-4">
    {step.at === "code" && <CodeStep error={step.error} onCode={onCode} />}
    {step.at === "checking" && <div className="tp-phone"><p className="tp-big">Finding the game…</p></div>}
    {step.at === "team" && <TeamStep info={step.info} note={step.note}
      onTeam={(team) => setStep({ at: "playing", code: step.code, info: step.info, wanted: team })} />}
    {step.at === "playing" && <Playing code={step.code} info={step.info} wanted={step.wanted} onBack={backToTeams} />}
  </div>;
}
