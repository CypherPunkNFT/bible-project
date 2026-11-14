// Map quest as a team game, on the big screen (docs/features/team-play/design.md, section 5 and Review 13-16): the
// lobby, then for each of the five places its name and countdown while teams pin on their phones, then every team's
// pin revealed on the map with the points, then the final standings. The round lives in team.ts and is saved after
// every change by the page; this screen turns it into views for the phones and buttons for the leader.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { formatList, formatNumber } from "@/lib/site-format";
import { teamTone } from "../kit";
import type { TeamStatus } from "@/lib/team-room/protocol";
import { useTeamHost } from "../team-play/host";
import { JoinStrip, Lobby } from "../team-play/Lobby";
import { ERA_VIEWS } from "./pools";
import type { LonLat } from "./geo";
import { QuestMap } from "./QuestMap";
import { ScreenPin } from "./ScreenPin";
import type { RevealShape } from "./quest-style";
import {
  addPin, nextPlace, placeResults, questionsOf, readPin, readyToReveal, resolvedTeamColor, reveal, standings, startPlace, teamView, type TeamRound,
} from "./team";
import { distanceText, pointsText } from "./words";

interface Props { round: TeamRound; onChange: (round: TeamRound) => void; onAgain: () => void; onEnd: () => void }

const TICK_MS = 500;

/** Each team's pin and line in its colour, then the true place (or river, or region) once, in ink, on top. */
function revealShapes(round: TeamRound): RevealShape[] {
  const question = questionsOf(round)[round.index];
  const ink = (typeof document !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue("--ink").trim()) || "#222";
  const teams = placeResults(round, round.index, question).flatMap((result): RevealShape[] => {
    if (!result.pin || !result.site) return [];
    const color = resolvedTeamColor(result.index);
    return [{ pin: result.pin, scored: result.site, others: [], color, pinColor: color }];
  });
  const [first, ...rest] = question.sites;
  const truth: RevealShape = question.shape
    ? { pin: first, scored: first, others: [], color: ink, pinColor: ink, area: question.shape }
    : { pin: first, scored: first, others: rest, color: ink, pinColor: ink };
  return [...teams, truth];
}

function useSecondsLeft(deadline: number, running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function TeamGame({ round, onChange, onAgain, onEnd }: Props) {
  const roundRef = useRef(round);
  roundRef.current = round;
  const pushRef = useRef<(team?: string) => void>(() => {});

  // Pins from phones and from this screen both build on the newest round, set at once, so two at the same moment both stay.
  const commit = useCallback((next: TeamRound) => { roundRef.current = next; onChange(next); }, [onChange]);
  const onInput = useCallback((team: string, data: unknown) => {
    const pin = readPin(data);
    const next = pin ? addPin(roundRef.current, team, pin.place, pin.pin) : roundRef.current;
    if (next !== roundRef.current) commit(next);
    else pushRef.current(team); // a stale or refused pin: that phone gets the screen as it is now
  }, [commit]);

  const host = useTeamHost(round.room, onInput);
  const { sendView, teams } = host;
  const connected = host.socket.status === "open";
  // A team with no phone (never joined, or freed) pins on this screen, as does every team while this screen is offline.
  const pinsHere = (team: string) => !connected || (teams.find((t) => t.id === team)?.state ?? "open") === "open";
  const pinHere = (team: string, place: number, pin: LonLat) => {
    if (pinsHere(team)) commit(addPin(roundRef.current, team, place, pin)); // refused if that team's phone joined meanwhile
  };
  pushRef.current = (only?: string) => {
    const now = Date.now();
    for (const team of roundRef.current.room.teams) if (!only || only === team.id) sendView(team.id, teamView(roundRef.current, team.id, now));
  };
  useEffect(() => { pushRef.current(); }, [round, sendView]);

  // The place ends when time is up or every expected team has pinned; checked on a tick and after every pin.
  const placing = round.phase === "place";
  useEffect(() => {
    if (!placing) return;
    const check = () => { if (readyToReveal(roundRef.current, Date.now())) onChange(reveal(roundRef.current)); };
    check();
    const id = window.setInterval(check, TICK_MS);
    return () => window.clearInterval(id);
  }, [placing, round, onChange]);

  const seconds = useSecondsLeft(round.deadline, placing);
  const strip = <JoinStrip code={round.room.code} teams={teams} status={host.socket.status} onFree={host.free} />;
  const finish = () => { host.end(); onEnd(); };

  if (host.gone) {
    return <section className="mq-team"><p className="mq-team-note">This team game has ended or was opened on another screen.</p>
      <button type="button" className="mq-button mq-primary" onClick={onEnd}>Back to the game home</button></section>;
  }
  if (round.phase === "lobby") {
    return <Lobby code={round.room.code} teams={teams} status={host.socket.status} onFree={host.free}>
      <button type="button" className="mq-button mq-primary" onClick={() => onChange(startPlace(round, 0, Date.now()))}>Start the first place</button>
      <button type="button" className="mq-button" onClick={finish}>Cancel</button>
    </Lobby>;
  }
  if (round.phase === "done") return <><Final round={round} onAgain={onAgain} onEnd={finish} />{strip}</>;
  const question = questionsOf(round)[round.index];
  const counter = `Place ${formatNumber(round.index + 1)} of ${formatNumber(round.ids.length)}`;
  if (round.phase === "place") {
    const pinned = round.pins[round.index] ?? {};
    const waiting = round.room.teams.filter((team) => !(team.id in pinned) && pinsHere(team.id)).map((team) => team.id);
    return <PlaceScreen round={round} teams={teams} counter={counter} name={question.name} seconds={seconds} strip={strip}
      onReveal={() => onChange(reveal(round))}>
      <ScreenPin round={round} waiting={waiting} onPin={pinHere} />
    </PlaceScreen>;
  }
  return <Reveal round={round} counter={counter} strip={strip} onNext={() => onChange(nextPlace(round, Date.now()))} />;
}

interface PlaceProps {
  round: TeamRound; teams: TeamStatus[]; counter: string; name: string; seconds: number; strip: ReactNode; onReveal: () => void;
  /** The pin map for teams with no phone (outside the live region, so it is not read out on every change). */
  children: ReactNode;
}

function PlaceScreen({ round, teams, counter, name, seconds, strip, onReveal, children }: PlaceProps) {
  const pinned = round.pins[round.index] ?? {};
  const onPhone = (id: string) => teams.find((t) => t.id === id)?.state === "held";
  return <section className="mq-team">
    {strip}
    <div className="mq-team" aria-live="polite">
      <p className="mq-team-count">{counter}</p>
      <h2 className="mq-team-ask">Where is <span>{name}</span>?</h2>
      <p className="mq-team-clock" aria-label={`${seconds} seconds left`}>{seconds}</p>
      <ul className="mq-team-pins" aria-label="Who has pinned">
        {round.room.teams.map((team, n) => <li key={team.id} style={{ "--_team": teamTone(n) } as CSSProperties} data-pinned={team.id in pinned}>
          <span dir="auto">{team.name}</span><b>{team.id in pinned ? "Pinned" : onPhone(team.id) ? "Thinking…" : "Pins here"}</b>
        </li>)}
      </ul>
    </div>
    {children}
    <button type="button" className="mq-button" onClick={onReveal}>Reveal now</button>
  </section>;
}

function Reveal({ round, counter, strip, onNext }: { round: TeamRound; counter: string; strip: ReactNode; onNext: () => void }) {
  const [mapFailed, setMapFailed] = useState(false);
  const question = questionsOf(round)[round.index];
  const shapes = useMemo(() => revealShapes(round), [round]);
  const results = placeResults(round, round.index, question).sort((a, b) => b.points - a.points);
  const last = round.index + 1 >= round.ids.length;
  return <section className="mq-team">
    {strip}
    <p className="mq-team-count">{counter}</p>
    <h2 className="mq-team-ask"><span>{question.name}</span></h2>
    {!mapFailed && <div className="mq-team-map">
      {/* A fresh map per place: the map reads `summary` once, when it starts (Review 16). */}
      <QuestMap key={`reveal-${round.index}`} view={ERA_VIEWS[round.era]} viewKey={`reveal-${round.index}`} beginner={false} pin={null}
        onPin={() => undefined} reveal={null} summary={shapes} onFail={() => setMapFailed(true)} label={`Every team's pin for ${question.name}, and where it was`} />
    </div>}
    <ol className="mq-team-results">
      {results.map((result) => <li key={result.id} style={{ "--_team": teamTone(result.index) } as CSSProperties}>
        <span dir="auto">{result.name}</span>
        <span>{result.km === null ? "No pin" : distanceText(result.km)}</span>
        <b>{pointsText(result.points)}</b>
      </li>)}
    </ol>
    <Standings round={round} />
    <button type="button" className="mq-button mq-primary" onClick={onNext}>{last ? "See the final standings" : "Next place"}</button>
  </section>;
}

function Standings({ round }: { round: TeamRound }) {
  return <ol className="mq-team-standings" aria-label="Standings">
    {standings(round).map((row) => <li key={row.id} style={{ "--_team": teamTone(row.index) } as CSSProperties}>
      <span className="mq-team-place">{formatNumber(row.place)}</span><span dir="auto">{row.name}</span><b>{formatNumber(row.score)}</b>
    </li>)}
  </ol>;
}

function Final({ round, onAgain, onEnd }: { round: TeamRound; onAgain: () => void; onEnd: () => void }) {
  const table = standings(round);
  // Two different sentences (one winner, or a tie between named teams), not a count, so no plural forms are needed.
  const [first, ...tied] = table.filter((row) => row.place === 1).map((row) => row.name);
  return <section className="mq-team">
    <h2 className="mq-team-ask">{tied.length > 0
      ? <>A shared win: <span>{formatList([first, ...tied])}</span></>
      : <><span>{first}</span> wins!</>}</h2>
    <Standings round={round} />
    <div className="mq-team-actions">
      <button type="button" className="mq-button mq-primary" onClick={onAgain}>Five more places</button>
      <button type="button" className="mq-button" onClick={onEnd}>Finish</button>
    </div>
  </section>;
}
