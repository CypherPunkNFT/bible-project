// 03 · Rain: the year as one bar, October to September, with the record's three rains on it; the fall of rain from north to
// south in the record's own figures; Deuteronomy 11 beside a drawing of the Nile; then wind, dew, drought, the storm god and
// prayer for rain, each a record in three parts.
import { D, LD, MONTH_SHORT, phraseByLabel, rainSpan } from "./model";
import { Head, Opener, StudyLink, T, ThreeParts, VerseRef, VerseRefs } from "./parts";

function YearBar() {
  return <figure className="ls-year">
    <div className="ls-year-bar" role="img" aria-label={`The rainy season: ${D.climate.rains.map((r) => `${r.name}, ${r.months}`).join("; ")}. May to September is dry.`}>
      {MONTH_SHORT.map((m, i) => <span key={m} className="ls-month" style={{ gridColumn: `${i + 1}` }}>{m}</span>)}
      {D.climate.rains.map((r, i) => {
        const span = rainSpan(r.months);
        return span && <span key={r.id} className={`ls-rain ls-rain-${i}`} style={{ gridColumn: `${span.from + 1} / ${span.to + 1}` }}>{r.name}</span>;
      })}
      <span className="ls-dry" style={{ gridColumn: "8 / 13" }}>Dry: no rain to speak of</span>
    </div>
    <figcaption className="ls-caption">The season, in the record's months. Single years swing widely: rain that comes late or stops early is what Scripture records as drought and famine.</figcaption>
  </figure>;
}

function Gradient() {
  const max = Math.max(...LD.figures.rain.map((r) => r.mm));
  return <figure className="ls-grad">
    <ul>{LD.figures.rain.map((r) => <li key={r.id}>
      <span className="ls-grad-place">{r.place}</span>
      <span className="ls-grad-bar" aria-hidden="true"><i style={{ width: `${(r.mm / max) * 100}%` }} /></span>
      <span className="ls-grad-mm">{r.words} mm</span>
    </li>)}</ul>
    <figcaption className="ls-caption">Average yearly rainfall, north to south and west to east, in the record's rounded figures. Long-term averages: the
      years averaged are not yet printed (the record asks for them before publishing).</figcaption>
  </figure>;
}

function Nile() {
  return <svg className="ls-nile" viewBox="0 0 160 120" aria-hidden="true">
    <path d="M18 112c10-20 4-40 14-60s4-30 10-48" className="ls-line" />
    <path d="M8 112c10-20 4-40 14-60s4-30 10-48M30 112c10-20 4-40 14-60s4-30 10-48" opacity=".3" />
    <path d="M44 70h24M44 86h30M44 54h18" strokeDasharray="3 4" opacity=".6" />
    <path d="M100 40c-8 0-13-5-13-11s5-10 11-10c2-7 8-11 15-11 8 0 14 5 16 12 6 0 10 5 10 10s-4 10-10 10Z" />
    <path d="M100 50l-4 9M112 50l-4 9M124 50l-4 9M106 64l-3 8M118 64l-3 8" strokeDasharray="3 4" opacity=".6" />
    <path d="M86 112c10-14 18-26 30-26s20 12 34 26" />
  </svg>;
}

export function Rain() {
  const eg = D.egyptAndCanaan;
  const more = D.faith.items.filter((f) => f.id === "rain-and-gods" || f.id === "prayer-for-rain");
  const parts = [["Winds", D.climate.winds], ["Dew", D.climate.dew], ["Drought", D.climate.drought]] as const;
  return <>
    <Head num="03" kicker="Rain" title="Rain from the sky." turn="Not from the river." lead={<p><T text={D.climate.lead} /></p>} />
    <YearBar />
    <div className="ls-rains">{D.climate.rains.map((r) => <div key={r.id}><h3>{r.name} <small>{r.months}</small></h3><ThreeParts evidence={r.evidence} inference={r.inference} limit={r.limit} /></div>)}</div>
    <div className="ls-two">
      <Gradient />
      <div><p className="ls-kicker">What the figures do</p><p className="ls-para"><T text={D.climate.gradient.evidence} /></p><p className="ls-para"><T text={D.climate.gradient.inference} /></p><p className="ls-caption"><T text={D.climate.gradient.limit} /></p></div>
    </div>
    <div className="ls-egypt">
      <Nile />
      <div>
        <p className="ls-kicker">{eg.head}</p>
        {eg.verses.map((label) => phraseByLabel.get(label) && <blockquote key={label} className="ls-verse"><p>“{phraseByLabel.get(label)!.phrase}”</p><cite><VerseRef label={label} />, Berean Standard Bible</cite></blockquote>)}
        <ThreeParts evidence={eg.evidence} background={eg.background} inference={eg.inference} limit={eg.limit} />
        <VerseRefs labels={eg.verses} />
      </div>
    </div>
    <div className="ls-trio">{parts.map(([name, part]) => <div key={name}><h3>{name}</h3><ThreeParts {...part} /></div>)}</div>
    <VerseRefs labels={D.climate.verses} />
    <ul className="ls-list">{more.map((f) => <li key={f.id}><Opener openKey={`faith:${f.id}`}><span className="ls-card-t">{f.name}</span><span className="ls-card-v">Open the record →</span></Opener></li>)}</ul>
    <StudyLink title="The farming year (29)" />
  </>;
}
