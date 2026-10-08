// One scholar's row in the heat grid: the name (opens the profile), then one shaded square per site area.
import { memo, type CSSProperties } from "react";
import type { Scholar } from "@/data/teachers/pages-types";
import { Mark } from "../marks/Mark";
import { AREAS } from "./model";

interface RowProps { scholar: Scholar; weights: number[]; hot: boolean }

export const Row = memo(function Row({ scholar, weights, hot }: RowProps) {
  return <li data-id={scholar.id} className={hot ? "nmd-hot" : undefined}>
    <button type="button" className="nmd-name" data-scholar={scholar.id}><Mark scholar={scholar} size={22} /><span>{scholar.short}</span></button>
    {AREAS.map(([area, tone], i) => <span key={area} className={`nmd-cell${weights[i] ? "" : " nmd-none"}`} data-area={area} data-col={i + 1}
      style={{ "--tone": `var(${tone})`, "--w": `${(14 + weights[i] * 78).toFixed(0)}%` } as CSSProperties} />)}
  </li>;
});
