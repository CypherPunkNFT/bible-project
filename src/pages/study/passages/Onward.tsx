// Sections 07 and 08 (mock-up direction A's cabinet and the shared closing): the six witnesses of this study as objects,
// each opening its open record (its own Commons picture, or our drawing of its form); then further reading, the site's
// related studies, what remains to be checked, the source register and the closing line.
import { Link } from "react-router-dom";
import { useMs } from "../manuscripts/context";
import { formatNumber } from "../manuscripts/model";
import { FormArt } from "../manuscripts/parts";
import { cabinet, furtherReading, heads, hero, licence, recordsNote, register, remains, sources, studies, type SourceId } from "./evidence";
import { studyRecords } from "./model";
import { Cite, Head } from "./parts";
import { Rich } from "./Rich";

export function Cabinet({ num }: { num: string }) {
  const { index } = useMs();
  return <>
    <Head num={num} kicker={heads.cabinet.kicker} title={heads.cabinet.title} lead={heads.cabinet.lead} />
    <div className="a-cab">{cabinet.map(({ rec, siglum, role }) => {
      const r = index.byId.get(rec);
      if (!r) { console.error(`passage study: the cabinet names record ${rec}, which the open collection does not hold`); return null; }
      const im = r.im ? index.data.images[r.im] : undefined;
      return <button key={rec} type="button" className="a-cab-item" data-open={rec}>
        <span className="a-cab-fig">{im ? <img src={im.src} alt="" /> : <FormArt record={r} />}</span>
        <span className="a-cab-sig">{siglum ?? r.g}</span><b>{r.n}</b><small>{r.d}{siglum ? ` · GA ${r.g}` : ""}</small>
        <span className="a-cab-role">{role}</span>
      </button>;
    })}</div>
  </>;
}

export function Closing({ num }: { num: string }) {
  const { index } = useMs();
  return <>
    <Head num={num} kicker={heads.close.kicker} title={heads.close.title} />
    <div className="pm-close">
      <div><p className="on-k">Read further</p><nav className="on-links pm-paths" aria-label="Further reading">{furtherReading.map((p) =>
        <a key={p.k} href={sources[p.src].url} target="_blank" rel="noopener noreferrer"><small>{p.k}</small><b>{p.title}</b><span>{p.text}</span><em>{p.by} ↗</em></a>)}</nav></div>
      <div><p className="on-k">On this site</p><nav className="on-links" aria-label="Related studies">{studies.map(([href, k, t, line]) =>
        <Link key={href} to={href}><small>{k}</small><b>{t}</b><span>{line}</span></Link>)}</nav></div>
      <div className="pm-remains"><p className="on-k">What remains to be checked</p><p>{remains}</p>
        <details className="sr-more pm-register"><summary>Source register &amp; reading conventions</summary>
          {register.map((p) => <p key={p.slice(0, 24)}><Rich text={p} /></p>)}
          <Cite ids={Object.keys(sources) as SourceId[]} />
          <p><Rich text={licence} /></p>
          <p>{recordsNote.replace("{n}", formatNumber(studyRecords(index).length))}</p>
        </details>
      </div>
    </div>
    <p className="pm-end"><Rich text={hero.end} /></p>
  </>;
}
