// Section 01: the stone itself, its seven lines as written, and the wheel they make. A chosen season lights its line and its arc, and
// shows what the word means, what is in doubt, and where Scripture has the same word.
import { D, findSeason, monthSpan, type Season } from "./model";
import { Cite, Head, He, Picture, Quote } from "./parts";
import { Wheel, WheelKey } from "./Wheel";

function Chosen({ season }: { season: Season }) {
  return <div className="fy-chosen" aria-live="polite">
    <p className="fy-kicker">{monthSpan(season)}, on this study's placing</p>
    <div className="fy-chosen-parts">
      <div>
        <h3>{season.reading}</h3>
        <p className="fy-sayit"><He>{season.hebrew}</He> <span className="fy-translit">{season.translit}</span></p>
        <p className="fy-para">{season.work}</p>
        <p className="fy-doubt"><b>In doubt:</b> {season.doubt}</p>
      </div>
      <div>
        <p className="fy-kicker fy-kicker-gap">The same word in Scripture</p>
        <p className="fy-para">{season.sameWord.note}</p>
        <Quote label={season.sameWord.verse} />
      </div>
    </div>
    <Cite ids={season.sources} />
  </div>;
}

export function Stone({ seasonId, onSeason }: { seasonId: string | null; onSeason: (id: string) => void }) {
  const season = findSeason(seasonId);
  return <>
    <Head num="01" kicker="The stone" title={<>Seven lines.<em> Eight seasons, twelve months.</em></>}
      lead="The tablet counts by the job: two months of this, one month of that. Pick a season, and see where it falls on the stone and on the year." />
    <div className="fy-stone">
      <div className="fy-tablet">
        <Picture id="stone" lazy={false} />
        <ol className="fy-lines" aria-label="The seven lines, in modern square letters">
          {D.lines.map((line) => <li key={line.n} className={line.seasons.includes(season.id) ? "on" : ""}><small>{line.n}</small><He>{line.hebrew}</He></li>)}
        </ol>
        <p className="fy-caption">Square letters stand in for the stone's older script. The word for sowing breaks across lines 1 and 2.</p>
      </div>
      <div className="fy-yearwheel">
        <Wheel lit={[season.id]} chosen={season.id} centre={[season.short, `${season.months} ${season.months === 1 ? "month" : "months"}`]} onPick={onSeason}
          label={`The year as a wheel of eight seasons, starting with ingathering at the top. Now lit: ${season.reading}, ${monthSpan(season)} on this study's placing.`} />
        <WheelKey />
      </div>
      <ol className="fy-seasons">{D.seasons.map((s, i) => <li key={s.id}>
        <button type="button" aria-pressed={s.id === season.id} onClick={() => onSeason(s.id)}><b>{i + 1}</b><span>{s.short}<small>{s.months} {s.months === 1 ? "month" : "months"}</small></span></button>
      </li>)}</ol>
    </div>
    <Chosen season={season} />
    <div className="fy-aboutstone">
      <div>
        <p className="fy-kicker">The object</p>
        <ul className="fy-facts">{D.stoneFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
        <p className="fy-kicker fy-kicker-gap">What was it for? Five proposals, none settled</p>
        <ul className="fy-facts">{D.purposes.map((p) => <li key={p.name}><b>{p.name}.</b> {p.held}</li>)}</ul>
      </div>
      <div>
        <p className="fy-kicker">Three placings of one undated list</p>
        <p className="fy-para">{D.placing.note}</p>
        <Cite ids={D.placing.sources} />
      </div>
      <div className="fy-labelphoto"><Picture id="label" /></div>
    </div>
  </>;
}
