// The caption bar above the ribbons: a fixed two-line strip that says what is lit, so hovering never moves the page.
import type { ScholarsData } from "@/data/teachers/pages-types";
import { faithOf, listWords, yearsOf } from "./labels";
import type { Focus, Model } from "./model";

export function Caption({ data, model, focus }: { data: ScholarsData; model: Model; focus: Focus | null }) {
  if (!focus || (!focus.f && !focus.s)) return <span className="blt-cap-hint">Hover a ribbon, feature or name to follow its recorded source. Names without profiles open the source.</span>;
  const { f, s } = focus;
  if (f && s) {
    const [title, year] = s.works[0];
    return <><b>{title}</b> ({year}) <span className="blt-arrow">→</span> <b>{f.name}</b><span className="blt-cap-note">{s.name}: {s.site?.note}</span></>;
  }
  if (f) {
    const books = model.links.filter((l) => l.f === f).map((l) => l.s.works[0][0]);
    return f.planned
      ? <><b>{books.length} source records in the library</b>, listed in the bibliography<span className="blt-cap-note">{listWords(books)}.</span></>
      : <><b>{f.name}</b> · {books.length === 1 ? "one source shown" : `${books.length} leading sources shown`}<span className="blt-cap-note">{listWords(books)}.</span></>;
  }
  if (!s) return null;
  return <><b>{s.name}</b> · {yearsOf(s)} · {faithOf(data, s)}<span className="blt-cap-note">{s.site?.note}</span></>;
}
