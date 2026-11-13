// Map quest on a team phone (docs/features/team-play/design.md, section 5 and Review 14, 16): the same blank map the
// game uses, kept for the whole game and re-framed for each place; drop a pin and Lock in. "Locked in" shows only once
// the big screen has the pin (it comes back in the view), so a pin lost on the way is simply locked in again. A locked
// pin can be moved and locked again until the reveal. After a reveal: this team's distance, points and standing.
import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/site-format";
import type { PhoneScreenProps } from "../team-play/TeamJoinPage";
import type { LonLat } from "./geo";
import { ERA_VIEWS } from "./pools";
import { QuestMap } from "./QuestMap";
import type { MapTeamView } from "./team";
import { distanceText, pointsText } from "./words";
import "./map-quest.css";

const isMapView = (view: unknown): view is MapTeamView => typeof view === "object" && view !== null && (view as MapTeamView).game === "map-quest";

const ordinal = (n: number) => {
  const tail = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${formatNumber(n)}${tail}`;
};

/** Seconds left, counted from when this view arrived (the two devices' clocks may differ). */
function useSecondsLeft(view: MapTeamView | null): number {
  const [now, setNow] = useState(() => Date.now());
  const [arrived, setArrived] = useState(() => Date.now());
  useEffect(() => { setArrived(Date.now()); setNow(Date.now()); }, [view]);
  const running = view?.phase === "place";
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);
  return view ? Math.max(0, Math.ceil((view.msLeft - (now - arrived)) / 1000)) : 0;
}

export default function MapTeamPhone({ view: raw, send }: PhoneScreenProps) {
  const view = isMapView(raw) ? raw : null;
  const [pin, setPin] = useState<LonLat | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const place = view?.place ?? -1;
  useEffect(() => { setPin(null); }, [place]); // a new place starts with no pin
  const seconds = useSecondsLeft(view);
  if (!view) return <p className="tp-big">Watch the big screen.</p>;
  if (view.phase === "lobby") return <p className="tp-big">You're in! The leader will start the first place soon.</p>;
  const counter = `Place ${formatNumber(view.place + 1)} of ${formatNumber(view.places)}`;
  const standing = view.standing && <p className="tp-hint">{`Your team is ${ordinal(view.standing.place)} of ${formatNumber(view.standing.of)}, with ${pointsText(view.standing.score)}.`}</p>;
  if (view.phase === "done") return <><p className="tp-big">That's all five places. See the big screen!</p>{standing}</>;
  if (view.phase === "reveal") {
    const away = view.result?.km == null ? null : distanceText(view.result.km);
    return <>
      <p className="tp-hint">{counter}</p>
      <p className="tp-big">{away === null ? `No pin for ${view.name}.` : `Your pin for ${view.name} was ${away} away.`}</p>
      <p className="tp-big"><b>{pointsText(view.result?.points ?? 0)}</b></p>
      {standing}
    </>;
  }
  const locked = view.pin;
  const shown = pin ?? locked;
  const changed = pin !== null && (!locked || pin[0] !== locked[0] || pin[1] !== locked[1]);
  return <>
    <p className="tp-hint">{`${counter} · ${seconds} s left`}</p>
    <h2 className="mq-team-phone-ask">Drop your pin: <b>{view.name}</b></h2>
    {mapFailed
      ? <div className="tp-error" role="alert">
          <p>The map would not load on this phone. The leader can reveal without your pin.</p>
          <button type="button" className="tp-button is-quiet" onClick={() => { setMapFailed(false); setMapKey((n) => n + 1); }}>Try the map again</button>
        </div>
      : <QuestMap key={mapKey} view={ERA_VIEWS[view.era]} viewKey={`${view.place}`} beginner={view.beginner} asked={view.id ?? undefined}
          pin={shown} onPin={setPin} reveal={null} onFail={() => setMapFailed(true)}
          label={`Map. Drop a pin where ${view.name} stood.`} />}
    <button type="button" className="tp-button" disabled={!shown || (!changed && Boolean(locked))}
      onClick={() => { if (shown) send({ pin: shown, place: view.place }); }}>
      {locked && !changed ? "Locked in. Move the pin to change it" : locked ? "Lock in the new pin" : "Lock in"}
    </button>
  </>;
}
