// Section 03: ten jobs laid across the twelve months, each marked with the kinds of evidence behind it, each opening its record. Below
// them, the photograph taken at Gezer itself: the same hill, and not the same evidence.
import { D, months, monthBars, seasonNames } from "./model";
import { JobArt } from "./JobArt";
import { Head, KindMark, Picture } from "./parts";

function MonthHeader() {
  return <div className="fy-strip fy-strip-head" aria-hidden="true">{months().map((m) => <span key={m}><b>{m}</b><i>{m[0]}</i></span>)}</div>;
}

export function Jobs({ picked, onOpen }: { picked: string | null; onOpen: (key: string) => void }) {
  return <>
    <Head num="03" kicker="The work" title={<>Ten jobs.<em> Four kinds of witness.</em></>}
      lead="Each bar is where the stone or the passages put the job, on this study's placing. The small marks say what stands behind it. Open a job for its record." />
    <ul className="fy-kinds">{D.evidenceKinds.map((k) => <li key={k.id}><KindMark kind={k.id} /><span><b>{k.word}.</b> {k.note}</span></li>)}</ul>
    <div className="fy-chart">
      <div className="fy-jobrow fy-jobrow-head"><span /><MonthHeader /></div>
      <ol>{D.jobs.map((job) => <li key={job.id}>
        <button type="button" className="fy-jobrow" aria-pressed={picked === job.id} onClick={() => onOpen(`job:${job.id}`)}>
          <span className="fy-jobname">
            <JobArt id={job.id} />
            <span><strong>{job.name}</strong><small>{job.line}</small>
              <span className="fy-jobkinds">{job.witness.map((kind) => <KindMark key={kind} kind={kind} />)}<span className="fy-sr">Evidence: {job.witness.map((kind) => D.evidenceKinds.find((k) => k.id === kind)?.word).join(", ")}. Placed at {seasonNames(job.seasons)}.</span></span>
            </span>
          </span>
          <span className="fy-strip" aria-hidden="true">{monthBars(job.seasons).map((bar) => <i key={bar.start} className="fy-bar" style={{ gridColumn: `${bar.start + 1} / span ${bar.months}` }} />)}</span>
        </button>
      </li>)}</ol>
    </div>
    <p className="fy-caption">Each column runs from the middle of one month to the middle of the next. Grapes appear in two places because the stone does not settle where they fall.</p>
    <div className="fy-sameplace">
      <Picture id="winnow" />
      <div>
        <p className="fy-kicker">Same hill. Not the same evidence.</p>
        <h3>Gezer, October 1934.</h3>
        <p className="fy-para">A man throws threshed grain into the wind with a wooden fork. Beside him someone works a sieve, and a motor car waits behind them. This is the hill that gave up the stone, three thousand years later.</p>
        <p className="fy-para">It shows what the work can look like, and that helps a reader to picture Ruth 3. It does not show that anyone at Iron Age Gezer did it this way, and the people in it were working in their own time and for their own reasons.</p>
      </div>
    </div>
  </>;
}
