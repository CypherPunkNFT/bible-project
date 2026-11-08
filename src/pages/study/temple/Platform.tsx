// 03 Herod's platform: a schematic outline (not a survey) with the finds whose record names a side marked on it, the others listed
// as having no place on the platform; the sanctuary somewhere on top, unplaced. Each find opens its record. Then Josephus's two
// start years side by side, and where the record stops on the platform.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, sideOf, tagsOf } from "./model";
import { useOpen } from "./open";
import { Head, Prose, Tags } from "./parts";

const OUTLINE = "M44 22 256 12 246 338 62 330Z";
const SPOT: Record<"west" | "southwest" | "east", [number, number][]> = {
  west: [[52, 178]], southwest: [[64, 318], [82, 334]], east: [[248, 262]],
};

function spots(): Map<string, [number, number]> {
  const used: Record<string, number> = {};
  const out = new Map<string, [number, number]>();
  for (const f of D.ground.finds) {
    const side = sideOf(f.id);
    if (!side) continue;
    const index = used[side] ?? 0;
    used[side] = index + 1;
    out.set(f.id, SPOT[side][Math.min(index, SPOT[side].length - 1)]);
  }
  return out;
}

export function Platform({ chosen, onChoose }: { chosen: string | null; onChoose: (id: string) => void }) {
  const open = useOpen();
  const placed = spots();
  const choose = (id: string) => { onChoose(id); open(`find:${id}`); };
  const herod = D.houses.find((h) => h.id === "herod");
  return <>
    <Head num="03" kicker="Herod's platform" title="Seen from below." turn="Never dug above." lead={<Prose text={D.ground.lead} />} />
    <div className="tw-platform">
      <figure className="tw-platform-fig">
        <svg viewBox="0 0 300 360" role="img" aria-label="A schematic outline of Herod's platform, with finds marked on its western, south-western and eastern sides; the top, where the sanctuary stood, carries no mark.">
          <path className="tw-outline" d={OUTLINE} />
          <text className="tw-plan-label" x="150" y="160" textAnchor="middle">The sanctuary stood</text>
          <text className="tw-plan-label" x="150" y="176" textAnchor="middle">somewhere up here.</text>
          <text className="tw-plan-label tw-muted-t" x="150" y="196" textAnchor="middle">Its place is not known.</text>
          <text className="tw-axis-t" x="150" y="354" textAnchor="middle">south</text>
          <text className="tw-axis-t" x="150" y="8" textAnchor="middle">north</text>
          {[...placed].map(([id, [x, y]]) => <rect key={id} className={`tw-find-mark${chosen === id ? " on" : ""}`} x={x - 6} y={y - 6} width="12" height="12"
            onClick={() => choose(id)} aria-hidden="true" />)}
        </svg>
        <figcaption className="tw-caption">Schematic: the walls' shape, not a survey. A find is marked only where its record names the side it came from.</figcaption>
      </figure>
      <ul className="tw-finds" aria-label="Finds around the platform">
        {D.ground.finds.map((f) => <li key={f.id}>
          <button type="button" className={`tw-find${placed.has(f.id) ? "" : " tw-unplaced"}`} aria-pressed={chosen === f.id} data-opener={`find:${f.id}`}
            aria-haspopup="dialog" onClick={() => choose(f.id)}>
            <i aria-hidden="true" /><span><Checked text={f.name} /></span>
            <small>{placed.has(f.id) ? `On the ${sideOf(f.id) === "southwest" ? "south-western corner" : `${sideOf(f.id)}ern side`}` : "No place on the platform"}</small>
          </button>
          <Tags kinds={tagsOf(`find:${f.id}`)} />
        </li>)}
      </ul>
    </div>
    {herod && <div className="tw-start">
      <p className="tw-kicker">When did Herod begin? Josephus gives two years</p>
      <div className="tw-start-pair">
        <p><b>Antiquities 15.380</b>Herod's eighteenth year, about 20/19 BC</p>
        <p><b>Jewish War 1.401</b>Herod's fifteenth year</p>
      </div>
      <p className="tw-para"><Prose text={herod.limit} /></p>
    </div>}
  </>;
}
