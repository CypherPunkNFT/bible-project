// Homepage (live; first tried on home_mockup, home_mockup2): which cities' files the "Close to home" map (NearbyStage.tsx) already has. A city
// opens in three steps, each with one job (owner, 2026-10-23: "loading" must mean the information is not here yet):
// 1. its two files (facts and map) are read: here, for every city in the background once the section comes near;
// 2. its map is drawn, hidden, when the visitor shows they may open it (NearbyStage.tsx);
// 3. the zoom.
// The ring on a dot shows only while step 1 is still running for the city clicked. While the ticker simulates a slow
// connection every city's files take SLOW_NET_MS to arrive, and what was read before is forgotten, as on a first visit.
import { loadResource } from "@/data/resources/index";
import { CITY_FILES } from "@/pages/resources/life/format";
import { SLOW_NET_MS, zoomClock } from "./nearby-clock";

type Id = keyof typeof CITY_FILES;

const here = new Set<string>(), reading = new Map<string, Promise<boolean>>();
let queue: Id[] = [], working = false, era = 0;

const sleep = (ms: number) => new Promise<void>((done) => window.setTimeout(done, ms));
/** Runs `next` when the page is idle (Safari has no requestIdleCallback: a short timer there). */
function idle(next: () => void) {
  const whenIdle = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
  if (whenIdle) window.requestIdleCallback(next, { timeout: 1000 }); else window.setTimeout(next, 50);
}

export const hasFiles = (id: string) => here.has(id);

/** Reads a city's files (or joins the reading already under way). Resolves true once both are here. */
export function readCity(id: Id): Promise<boolean> {
  if (here.has(id)) return Promise.resolve(true);
  const known = reading.get(id);
  if (known) return known;
  const files = CITY_FILES[id], mine = era;
  const read = Promise.all([loadResource(files.facts), loadResource(files.map), zoomClock.state.slowNet ? sleep(SLOW_NET_MS) : null])
    .then(([facts, map]) => Boolean(facts && map), (e: unknown) => { console.error(`Close to home: could not read the files of ${id}`, e); return false; })
    .then((ok) => {
      if (mine !== era) return false;
      reading.delete(id);
      if (ok) here.add(id);
      return ok;
    });
  reading.set(id, read);
  return read;
}

/** Reads every given city's files in the background, one after another, in this order (ahead of any still waiting). */
export function readAll(order: Id[]) {
  queue = [...new Set([...order, ...queue])].filter((id) => !here.has(id));
  if (working) return;
  working = true;
  const mine = era;
  const next = () => {
    const id = queue.shift();
    if (!id || mine !== era) { working = false; return; }
    void readCity(id).then(() => idle(next));
  };
  idle(next);
}

/** Forgets every city's files: the simulated slow connection starts as a first visit. */
export function forgetAll() {
  era++;
  here.clear();
  reading.clear();
  queue = [];
  working = false;
}
