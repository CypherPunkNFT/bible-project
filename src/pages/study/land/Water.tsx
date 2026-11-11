// 04 · Water: spring, well, cistern and Hezekiah's tunnel as four cards with their own miniature, each opening its record.
import { plural } from "@/lib/site-format";
import { D, firstSentence } from "./model";
import { Head, Opener, T } from "./parts";

const MINI: Record<string, string> = {
  springs: "M6 30h36M14 30c0-8 4-12 10-16 6 4 10 8 10 16M24 14v-6M20 10l4-4 4 4",
  wells: "M10 12h28M14 12v20h20V12M24 12V6M20 6h8M18 32v-8h12v8",
  cisterns: "M6 10h36M10 10c0 14 4 22 14 22s14-8 14-22M18 6v4M30 6v4M14 24h20",
  tunnel: "M4 14c8 0 10 10 18 10s10-12 22-10M4 22c8 0 10 10 18 10s10-12 22-10",
};

export function Water() {
  const items = D.water.items;
  return <>
    <Head num="04" kicker={<>Water</>} title="Where the water is." turn="Where the town is." lead={<p><T text={D.water.lead} /></p>} />
    <ul className="ls-cards">{items.map((w, i) => <li key={w.id}>
      <Opener openKey={`water:${w.id}`}>
        <span className="ls-card-k">{`Water · ${String(i + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`}</span>
        <svg className="ls-mini" viewBox="0 0 48 36" aria-hidden="true"><path d={MINI[w.id] ?? MINI.springs} /></svg>
        <span className="ls-card-t">{w.name}</span>
        <span className="ls-card-d">{firstSentence(w.inference)}</span>
        <span className="ls-card-p">{plural(w.verses.length, "{n} verse", "{n} verses")} · <span>evidence, inference and limit</span></span>
        <span className="ls-card-v">Open the record →</span>
      </Opener>
    </li>)}</ul>
  </>;
}
