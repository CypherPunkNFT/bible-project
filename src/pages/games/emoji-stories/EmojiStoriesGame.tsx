// /games/emoji-stories (design docs/features/emoji-stories/design.md): a Bible story told in emoji; name the story.
// Loads the three data files, keeps the device record and the round in progress, and switches between the start
// screen, the Daily, a Practice round, its end, and a room round. ?play=daily|practice|room opens a mode directly.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatList, plural } from "@/lib/site-format";
import { useSiteLanguage } from "@/lib/language";
import { useScrollTopOn, WinnerLine } from "../kit";
import { msUntilMidnight } from "./daily";
import { DailyPlay } from "./DailyScreen";
import { gameData, type GameData } from "./data";
import { choicesFor, dealRound, filterKey, isOffered, remember, roundScore, type Filter } from "./deal";
import { RoomChips, RoomPlay } from "./Room";
import { roomRows, type RoomTeam } from "./rules";
import { RoundPlay } from "./Round";
import { RoundEnd } from "./RoundEnd";
import { Start } from "./Start";
import { DEVICE_KEY, browserStore, canStore, readDevice, readRound, saveRound, writeDevice, type AnswerMode, type Device, type Round } from "./storage";
import type { DailySchedule, EmojiFile, StoryFile } from "./types";
import "../games.css";
import "./emoji-stories.css";

export default function EmojiStoriesGame() {
  const [data, setData] = useState<GameData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    document.title = "Emoji stories · Games · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  useEffect(() => {
    let live = true;
    setFailed(false);
    Promise.all([
      import("@/data/emoji-stories/stories.json"),
      import("@/data/emoji-stories/emoji.json"),
      import("@/data/emoji-stories/daily.json"),
    ])
      .then(([stories, emoji, daily]) => {
        if (live) setData(gameData(stories.default as StoryFile, emoji.default as EmojiFile, daily.default as DailySchedule));
      })
      .catch((error: unknown) => {
        console.error("Emoji stories: the puzzles could not be loaded", error);
        if (live) setFailed(true);
      });
    return () => { live = false; };
  }, [attempt]);
  return (
    <div className="es-page mx-auto max-w-3xl px-4 sm:px-6">
      <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
      {data ? <Game data={data} /> : failed ? (
        <p className="es-muted">The puzzles could not be loaded. <button type="button" className="es-link-button" onClick={() => setAttempt((n) => n + 1)}>Try again</button></p>
      ) : <p className="es-muted" role="status">Loading the puzzles…</p>}
    </div>
  );
}

type View = "start" | "daily" | "round";

function useToday(data: GameData): number {
  const [today, setToday] = useState(() => data.daily.numberOn(new Date()));
  useEffect(() => {
    const check = () => setToday(data.daily.numberOn(new Date()));
    let timer = window.setTimeout(function tick() { check(); timer = window.setTimeout(tick, msUntilMidnight(new Date()) + 1000); }, msUntilMidnight(new Date()) + 1000);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [data]);
  return today;
}

export function Game({ data }: { data: GameData }) {
  const [params] = useSearchParams();
  const language = useSiteLanguage();
  const local = useMemo(() => browserStore("localStorage"), []);
  const session = useMemo(() => browserStore("sessionStorage"), []);
  const [device, setDevice] = useState<Device>(() => readDevice(local, data.known));
  const [stored, setStored] = useState(() => canStore(local));
  const [round, setRound] = useState<Round | null>(() => readRound(session, data.known));
  const [filter, setFilter] = useState<Filter>({ difficulty: "mixed", testament: "both" });
  const today = useToday(data);
  const [dailyNumber, setDailyNumber] = useState(today);
  const [newDay, setNewDay] = useState(false);
  const [view, setView] = useState<View>(() => (round ? "round" : params.get("play") === "daily" ? "daily" : "start"));
  // The room's team tally lives here, in the page only, so it survives "Another round" and is never stored (§8.3).
  const [teams, setTeams] = useState<RoomTeam[]>([]);
  // A round restored from a reload: its result screen must not count up or celebrate again, and it has no "best before".
  const restored = useRef(round?.over ?? false);
  const bestBefore = useRef(0);
  // Every new screen opens at the top (the audit's phone fault): the view, the puzzle and the round's end are the key.
  useScrollTopOn(`${view}:${round?.mode ?? ""}:${round?.at ?? -1}:${round?.over ?? false}`);

  const save = useCallback((next: Device) => {
    setStored(writeDevice(local, next));
    setDevice(next);
  }, [local]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === DEVICE_KEY) setDevice(readDevice(local, data.known)); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [local, data]);

  // Practice and rooms answer the way the device last chose (Choices at first). The Daily opens on Typing every day
  // (Choices on a translated site); switching there is kept in that day's record only (§6.1).
  const practiceAnswer: AnswerMode = device.answer ?? "choices";
  const dailyAnswer: AnswerMode = language === "en" ? "typing" : "choices";
  const setAnswer = (answer: AnswerMode) => save({ ...device, answer });

  const changeRound = (next: Round | null) => {
    let updated = device;
    if (next && round && next.at !== round.at) {
      updated = { ...updated, recent: remember(updated.recent, [next.puzzles[next.at].id]) };
    }
    if (next?.over && !next.recorded) {
      if (next.mode === "practice") {
        const key = filterKey(next.filter);
        updated = { ...updated, best: { ...updated.best, [key]: Math.max(updated.best[key] ?? 0, roundScore(next)) } };
      }
      next = { ...next, recorded: true };
    }
    if (updated !== device) save(updated);
    saveRound(session, next?.mode === "practice" ? next : null);
    setRound(next);
    if (!next) setView("start");
  };
  const startRound = (mode: Round["mode"], chosen = filter) => {
    if (!isOffered(data.stories, chosen)) return;
    const seed = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
    const ids = dealRound(data.stories, chosen, device.recent, seed);
    const puzzles = ids.map((id, index) => ({
      id, choices: choicesFor(data.byId.get(id)!, data.stories, seed + index + 1), hints: 0, pick: null,
      clues: mode === "room" ? 1 : 0, choicesShown: false, revealed: false,
    }));
    const next: Round = { mode, filter: chosen, puzzles, at: 0, over: false, recorded: false };
    restored.current = false;
    bestBefore.current = device.best[filterKey(chosen)] ?? 0;
    save({ ...device, recent: remember(device.recent, [ids[0]]) });
    saveRound(session, mode === "practice" ? next : null);
    setRound(next);
    setView("round");
  };
  useEffect(() => {
    const play = params.get("play");
    if (!round && (play === "practice" || play === "room")) startRound(play);
    // Opening a mode from the address happens once, on arrival.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (view === "daily") {
    return <>
      <button type="button" className="es-secondary es-home" onClick={() => setView("start")}>Back to the start</button>
      <DailyPlay key={dailyNumber} data={data} n={dailyNumber} today={today} device={device} save={save} stored={stored}
        defaultAnswer={dailyAnswer} focusHeading={newDay} onNewDay={() => { setNewDay(true); setDailyNumber(today); }} />
    </>;
  }
  if (view === "round" && round) {
    if (round.over && round.mode === "practice") {
      const best = restored.current ? device.best[filterKey(round.filter)] ?? 0 : bestBefore.current;
      return <RoundEnd round={round} byId={data.byId} best={best} fresh={!restored.current} onAgain={() => startRound("practice", round.filter)} onHome={() => changeRound(null)} />;
    }
    if (round.over) {
      return <RoomEnd teams={teams} onAgain={() => startRound("room", round.filter)} onHome={() => { setTeams([]); changeRound(null); }} />;
    }
    return <>
      <button type="button" className="es-secondary es-home" onClick={() => { setTeams([]); changeRound(null); }}>Stop this round</button>
      {round.mode === "room"
        ? <RoomPlay data={data} round={round} teams={teams} onChange={changeRound} onTeams={setTeams} />
        : <RoundPlay data={data} round={round} answer={practiceAnswer} onChange={changeRound} />}
    </>;
  }
  return <Start data={data} device={device} today={today} filter={filter} answer={practiceAnswer} stored={stored}
    onFilter={setFilter} onAnswer={setAnswer} onDaily={() => { setNewDay(false); setDailyNumber(today); setView("daily"); }}
    onPractice={() => startRound("practice")} onRoom={() => startRound("room")} />;
}

/** The room's last screen: the winner (or the tied winners) and the tally when teams kept score, else the old line. */
function RoomEnd({ teams, onAgain, onHome }: { teams: readonly RoomTeam[]; onAgain: () => void; onHome: () => void }) {
  const rows = roomRows(teams);
  const top = Math.max(0, ...rows.map((row) => row.score));
  const names = top > 0 ? rows.filter((row) => row.score === top).map((row) => row.name) : [];
  return (
    <section className="es-end es-room-end" aria-labelledby="es-room-end-title">
      <h2 id="es-room-end-title" className="es-heading">That was the last story of the round.</h2>
      {names.length > 0 && <WinnerLine name={<bdi>{formatList(names)}</bdi>} label={plural(names.length, "Winner", "Winners")} className="es-winner" />}
      {rows.length > 0 && <RoomChips teams={teams} />}
      <p className="es-actions">
        <button type="button" className="es-primary" onClick={onAgain}>Another round</button>
        <button type="button" className="es-secondary" onClick={onHome}>Back to the start</button>
      </p>
    </section>
  );
}
