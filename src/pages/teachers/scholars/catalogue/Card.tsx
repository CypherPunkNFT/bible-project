// One catalogue card: the scholar's mark, site badge, name, years and place, field and faith, key work and their life on
// a line from year 0 to today. The whole card is one button that opens the profile, grown out of the card.
import { memo, type CSSProperties } from "react";
import type { Scholar, ScholarsData } from "@/data/teachers/pages-types";
import { NOW, yearPct, years } from "../marks/facts";
import { Mark } from "../marks/Mark";
import { toneStyle } from "../marks/shapes";

// `row` and `pinned` serve the virtualized catalogue (Catalogue.tsx): its row number, and the place of a card kept
// drawn outside the drawn rows because it holds focus.
interface CardProps { data: ScholarsData; s: Scholar; order: number | undefined; onOpen: (id: string, origin: Element | null) => void; cardRef: (el: HTMLElement | null) => void; row?: number; pinned?: CSSProperties }

export const Card = memo(function Card({ data, s, order, onOpen, cardRef, row, pinned }: CardProps) {
  const [title, year] = s.works[0] ?? ["", 0];
  return <article ref={cardRef} className="cat-card" data-id={s.id} data-row={row} data-pinned={pinned ? "" : undefined} hidden={order === undefined}
    style={{ ...toneStyle(s.field), order: order ?? 0, ...pinned }}>
    <div className="cat-card-top"><Mark scholar={s} size={54} className="cat-mark" />
      {s.site && (s.site.status === "in-use" ? <span className="cat-badge cat-badge-used"><i />Used on this site</span> : <span className="cat-badge cat-badge-held">In the library</span>)}</div>
    <h3 className="cat-card-name">{s.name}</h3>
    <p className="cat-card-meta"><span>{years(s)}</span><span>{s.place[0]}</span></p>
    <p className="cat-card-tags"><span className="cat-field">{data.fields[s.field]}</span><span className="cat-faith">{data.faiths[s.faith]}</span>{s.tags?.map(tag => <span key={tag} className="cat-field">{tag}</span>)}</p>
    {title && <div className="cat-card-work"><span>Key work</span><b>{title}</b><em>{year}</em></div>}
    <div className="cat-lb" role="img" aria-label={`Life: ${years(s)}, shown on a line from year 0 to ${NOW}`}>
      <div className="cat-lb-track"><b style={{ left: yearPct(s.born), width: `max(4px, calc(${yearPct(s.died ?? NOW)} - ${yearPct(s.born)}))` }} /></div></div>
    <button type="button" className="cat-card-hit" aria-label={`Open the profile of ${s.name}`} onClick={(e) => onOpen(s.id, e.currentTarget.parentElement)} />
  </article>;
});
