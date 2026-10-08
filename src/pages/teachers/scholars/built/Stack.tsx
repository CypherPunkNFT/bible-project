// The phone form of "Built on their work": one list per feature, each book branching off the feature's rail.
import type { CSSProperties } from "react";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { faithOf, toneOf, yearsOf } from "./labels";
import type { Model } from "./model";
import { Mark } from "../marks/Mark";

export function Stack({ data, model }: { data: ScholarsData; model: Model }) {
  return <div className="blt-stack">
    {model.features.map((f) => <div key={f.id} className={`blt-st-group${f.planned ? " blt-planned" : ""}`} style={{ "--tone": `var(${f.tone})` } as CSSProperties}>
      <h3><i />{f.name}<small>{f.sub}</small></h3>
      <ul>
        {model.links.filter((l) => l.f === f).map(({ s }) => <li key={s.id}>
          <button type="button" data-scholar={s.id}>
            <span className="blt-st-work">{s.works[0][0]} <em>{s.works[0][1]}</em></span>
            <span className="blt-st-who" style={{ "--tone": `var(${toneOf(s.field)})` } as CSSProperties}>
              <Mark scholar={s} size={24} />
              <span><b>{s.name}</b><small>{yearsOf(s)} · {faithOf(data, s)}</small></span>
            </span>
          </button>
        </li>)}
      </ul>
    </div>)}
  </div>;
}
