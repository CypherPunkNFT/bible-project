// One scholar's row in the heat grid: the name (opens the profile), then one shaded square per site area.
import { memo, type CSSProperties } from "react";
import type { NamedPerson } from "./model";
import { Mark } from "../marks/Mark";
import { AREAS } from "./model";

interface RowProps { scholar: NamedPerson; weights: number[]; hot: boolean }

export const Row = memo(function Row({ scholar, weights, hot }: RowProps) {
  return <li data-id={scholar.id} className={hot ? "nmd-hot" : undefined}>
    <button type="button" className="nmd-name" data-scholar={scholar.id}>{scholar.profile ? <Mark scholar={scholar.profile} size={22} /> : <span aria-hidden="true">{scholar.name.split(/\s+/).slice(0,2).map(w=>w[0]).join("")}</span>}<span>{scholar.short}</span></button>
    {AREAS.map(([area, tone], i) => <a key={area} href={scholar.records.find(r=>r.area===area)?.uses[0]?.address} title={`${scholar.mentions[area] ?? 0} distinct content pages: ${scholar.name}`} aria-label={`${scholar.name}: ${scholar.mentions[area] ?? 0} pages in ${area}`} className={`nmd-cell${weights[i] ? "" : " nmd-none"}`} data-area={area} data-col={i + 1}
      style={{ "--tone": `var(${tone})`, "--w": `${(14 + weights[i] * 78).toFixed(0)}%` } as CSSProperties} />)}
  </li>;
});
