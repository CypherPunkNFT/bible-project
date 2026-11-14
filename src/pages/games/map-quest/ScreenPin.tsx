// Map quest's team game: the big screen pins for the teams with no phone (docs/features/team-play/design.md, 10.5). The
// leader picks the team (the first still to pin, by default); the choice stays until Lock in, and the map starts fresh
// for each team and place, so a pin never carries over to another team. Lock in pins for the team and place shown.
import { useEffect, useState, type CSSProperties } from "react";
import { teamTone } from "../kit";
import type { LonLat } from "./geo";
import { ERA_VIEWS } from "./pools";
import { QuestMap } from "./QuestMap";
import type { TeamRound } from "./team";

interface Props {
  round: TeamRound;
  /** The teams this screen pins for (no phone), in team order, that have not pinned this place yet. */
  waiting: string[];
  onPin: (team: string, place: number, pin: LonLat) => void;
}

export function ScreenPin({ round, waiting, onPin }: Props) {
  const [chosen, setChosen] = useState<string | null>(waiting[0] ?? null);
  const [pin, setPin] = useState<LonLat | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapTry, setMapTry] = useState(0);
  const team = chosen && waiting.includes(chosen) ? chosen : (waiting[0] ?? null);
  useEffect(() => { setPin(null); }, [team, round.index]); // a fresh pin for each team and place
  if (!team) return null;
  const teams = round.room.teams;
  const index = teams.findIndex((t) => t.id === team);
  const name = teams[index]?.name ?? "";
  const frame = ERA_VIEWS[round.era];
  return <section className="mq-team-here" aria-label="Pin for a team without a phone" style={{ "--_team": teamTone(index) } as CSSProperties}>
    <h3 className="mq-team-here-ask">{`Drop the pin for ${name} here.`}</h3>
    {waiting.length > 1 && <div className="mq-team-here-teams">
      {waiting.map((id) => {
        const n = teams.findIndex((t) => t.id === id);
        return <button key={id} type="button" aria-pressed={id === team} style={{ "--_team": teamTone(n) } as CSSProperties}
          onClick={() => setChosen(id)}>{teams[n]?.name}</button>;
      })}
    </div>}
    {mapFailed
      ? <div className="tp-error" role="alert">
          <p>The map would not load. You can reveal without this team's pin.</p>
          <button type="button" className="mq-button" onClick={() => { setMapFailed(false); setMapTry((n) => n + 1); }}>Try the map again</button>
        </div>
      : <div className="mq-team-map">
          <QuestMap key={`${round.index}-${team}-${mapTry}`} view={frame} viewKey={`${round.index}-${team}`} beginner={round.level === "beginner"}
            asked={round.ids[round.index]} pin={pin} onPin={setPin} reveal={null} onFail={() => setMapFailed(true)}
            label={`Map. Drop the pin for ${name}.`} />
        </div>}
    <button type="button" className="mq-button mq-primary" disabled={!pin} onClick={() => { if (pin) onPin(team, round.index, pin); }}>
      {`Lock in the pin for ${name}`}
    </button>
  </section>;
}
