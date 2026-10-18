// 03 · Through the Psalms: the 150 psalms as tiles, each lit by how many of our hymns sing it; click one to see them, each
// opening its own page. The list is as tall as the tiles beside it and scrolls with the outside pill; it changes on
// click only (approved mock-up: design/hymn-directions/collection/psalms.js).
import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { OutsideScroll } from "@/components/OutsideScroll";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { bookIndexOf, chapterOf, hymnHref, type HymnCollection, type HymnEntry } from "@/lib/hymns";
import { SectionHead } from "@/pages/teachers/shared/Frame";
import { groupsById, plural, tone } from "./model";

export function Psalms({ collection }: { collection: HymnCollection }) {
  const { hymns, books } = collection;
  const groups = useMemo(() => groupsById(collection), [collection]);
  const narrow = useMediaQuery("(max-width: 899px)");
  const psa = books.findIndex((b) => b.code === "PSA");
  const byPsalm = useMemo(() => {
    const lists = Array.from({ length: 150 }, (): HymnEntry[] => []);
    for (const h of hymns) if (h.v && bookIndexOf(h.v) === psa) lists[chapterOf(h.v) - 1].push(h);
    return lists;
  }, [hymns, psa]);
  const max = Math.max(...byPsalm.map((l) => l.length));
  const sung = byPsalm.filter((l) => l.length).length;
  const [shown, setShown] = useState(22);
  const list = byPsalm[shown];

  const detail = <div className="bib-inner" style={tone("--poetry")}><p className="kicker">Poetry &amp; Wisdom</p>
    <h3>Psalm {shown + 1}<small>{books[psa].chapters[shown]} verses</small></h3>
    <p className="bib-note">{list.length ? `${plural(list.length, "hymn")} here sing this psalm.` : "No hymn here sings this psalm yet."}</p>
    {list.length > 0 && <><p className="bib-mini">Open a hymn</p><ul className="bib-titles">{list.map((h) =>
      <li key={h.id}><Link className="bib-work" to={hymnHref(h.id)}><span>{h.t}</span><ArrowRight size={13} strokeWidth={1.5} aria-hidden /></Link>
        <small>{h.r} · {groups.get(h.g)?.short} · {h.y}{h.m ? ` · metre ${h.m.replace(/,/g, ".")}` : ""}</small></li>)}</ul></>}
    <Link className="bib-read" to={`/read/kjv/PSA/${shown + 1}`}><BookOpen size={15} strokeWidth={1.5} aria-hidden />Read Psalm {shown + 1}<ArrowRight size={15} strokeWidth={1.5} aria-hidden /></Link></div>;

  return <div className="tp-sec-bible" style={tone("--poetry")}>
    <SectionHead num="03" kicker="The Psalms" title={<>Through <em>the Psalms</em></>}
      line={`${sung} of the 150 psalms have at least one hymn made from them here, most by Isaac Watts, who set the psalms "in the language of the New Testament": his are paraphrases, not translations. Choose a psalm to see how it was sung.`} />
    <div className="bib-grid">
      <div className="bib-card"><div className="ps-grid">{byPsalm.map((l, i) =>
        <button key={i} type="button" className={`ps-tile${i === shown ? " on" : ""}`} aria-pressed={i === shown} onClick={() => setShown(i)}
          style={{ "--k": l.length ? (0.35 + 0.65 * l.length / max).toFixed(2) : 0 } as CSSProperties} aria-label={`Psalm ${i + 1}, ${plural(l.length, "hymn")}`}>
          <span className="n">{i + 1}</span>{l.length > 0 && <small>{l.length} {l.length === 1 ? "hymn" : "hymns"}</small>}</button>)}</div></div>
      <aside className="bib-detail ps-detail" aria-live="polite">
        {narrow ? detail : <OutsideScroll label={`Hymns on Psalm ${shown + 1}`} className="bib-detail-scroll" frameClassName="bib-detail-frame" viewportClassName="bib-detail-viewport" resetKey={String(shown)}>{detail}</OutsideScroll>}
      </aside>
    </div>
  </div>;
}
