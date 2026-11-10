// Section 03: the letters Canaan's rulers wrote to Pharaoh. A schematic map sized by surviving letters, then a short reader: the edition's real
// signs over its dictionary glosses, with this study's own plain rendering. This reader and its renderings stay under the edition's licence,
// and the page says so. The signs are hidden from screen readers in favour of the plain rendering.
import { COAST, cityRadius, D, EG, ext, findCity, findPassage, MAP, mapPoint, signParts, verseByLabel, type Word } from "./model";
import { Head, Picture, Quote, VerseLink } from "./parts";
import { formatNumber, plural } from "@/lib/site-format";

function Signs({ text }: { text: string }) {
  return <>{signParts(text).map((part, i) => part.kind === "sup" ? <sup key={i}>{part.value}</sup> : part.kind === "sub" ? <sub key={i}>{part.value}</sub> : <span key={i}>{part.value}</span>)}</>;
}

const TAG_WORD = new Map([["c", "Canaanite"], ["e", "Egyptian"]]);

function Pair({ word }: { word: Word }) {
  const language = word.l ? TAG_WORD.get(word.l) : undefined;
  return <span className={`eg-word${word.d ? " dmg" : ""}${word.l ? " tagged" : ""}`}>
    <span className="eg-signs" translate="no"><Signs text={word.t} /></span>
    <span className="eg-gloss">{word.g}{language && <em> · {language}</em>}</span>
  </span>;
}

function CityMap({ cityId, onCity }: { cityId: string; onCity: (id: string) => void }) {
  const coast = COAST.map(([lon, lat]) => mapPoint(lon, lat).map((n) => n.toFixed(1)).join(" ")).join("L");
  return <svg className="eg-map" viewBox={`0 0 ${MAP.width} ${MAP.height}`} role="img" aria-label="A simplified map of the coast from Byblos down to Ashkelon, with twelve places as dots, larger where more letters survive. The list beside it gives each.">
    <path className="eg-coast" d={`M${coast}`} />
    <text className="eg-sea" x="30" y="205">The Great Sea</text>
    {D.letters.cities.map((c) => {
      const [x, y] = mapPoint(c.lon, c.lat), on = c.id === cityId;
      return <g key={c.id} className={`eg-citydot${on ? " on" : ""}`} onClick={() => onCity(c.id)}>
        <circle cx={x} cy={y} r={cityRadius(EG.letters.cities[c.id]?.letters ?? 0)} />
        {on && <text x={x + 14} y={y + 4}>{c.name}</text>}
      </g>;
    })}
  </svg>;
}

export function Letters({ cityId, letterId, onChange }: { cityId: string | null; letterId: string | null; onChange: (values: Record<string, string | null>) => void }) {
  const city = findCity(cityId), passage = findPassage(letterId);
  const data = EG.letters.cities[city.id], lines = EG.passages[passage.id] ?? [];
  const { canaanite, clientLetters, unplaced } = EG.letters;
  return <>
    <Head num="03" kicker="Letters from Canaan" title={<>Seven times and seven times.<em> In clay.</em></>} lead={D.letters.lead} />
    <div className="eg-places">
      <div><CityMap cityId={city.id} onCity={(id) => onChange({ city: id })} /><p className="eg-caption">{D.letters.countNote} {`Coast simplified, places approximate. Of ${formatNumber(clientLetters)} letters with text, ${formatNumber(unplaced)} cannot be placed at all.`}</p></div>
      <ul className="eg-citylist">{D.letters.cities.map((c) => <li key={c.id}>
        <button type="button" aria-pressed={c.id === city.id} onClick={() => onChange({ city: c.id })}><span>{c.name}</span><small>{EG.letters.cities[c.id]?.letters ?? 0}</small></button>
      </li>)}</ul>
      <div className="eg-cityrecord" aria-live="polite">
        <p className="eg-kicker">{plural(data?.letters ?? 0, "{n} letter in the edition", "{n} letters in the edition")}</p>
        <h3>{city.name}</h3>
        <p className="eg-para">{city.note}</p>
        {data && data.writers.length > 0 && <ul className="eg-writers">{data.writers.map(([who, n]) => <li key={who}>{who}<small>{n}</small></li>)}</ul>}
        <Quote label={city.verse} />
        {city.letter && <button type="button" className="eg-tolink" onClick={() => { onChange({ letter: city.letter! }); document.getElementById("reader")?.scrollIntoView(); }}>{`Read a letter from ${city.name} below ↓`}</button>}
      </div>
    </div>

    <h3 id="reader" className="eg-subhead">Read a line yourself</h3>
    <div className="eg-judges" role="group" aria-label="Which passage to read">
      {D.letters.passages.map((p) => <button key={p.id} type="button" aria-pressed={p.id === passage.id} onClick={() => onChange({ letter: p.id })}><strong>{p.ea}</strong><small>{p.title}</small></button>)}
    </div>
    <div className="eg-reader">
      <div>
        <p className="eg-kicker">{passage.from}</p>
        <div className="eg-tablet" aria-hidden="true">{lines.map((line) => <p key={line.label} className="eg-tabletline"><span className="eg-linelabel">{line.label.replace(/^o 0*/, "front ").replace(/^r 0*/, "back ")}</span>{line.words.map((w, i) => <Pair key={i} word={w} />)}</p>)}</div>
        <p className="eg-kicker eg-kicker-gap">In plain words, this study's rendering</p>
        <p className="eg-plain">{passage.plain}</p>
        <p className="eg-caption">Each English word beneath the signs is the edition's dictionary gloss, so it can read oddly: the word glossed “skull” in these letters is often just “upon”. A dotted line marks a word partly damaged or restored; the editors' half-brackets are left out here. Marked words are those the edition tags as Canaanite or Egyptian.</p>
        <p className="eg-licence">Signs and glosses: <a href="https://oracc.museum.upenn.edu/aemw/amarna/" {...ext}>edition by Jacob Lauinger and Tyler Yoder</a>, reformatted for this page. This reader and its plain renderings are shared under <a href="https://creativecommons.org/licenses/by-sa/3.0/" {...ext}>CC BY-SA 3.0</a>.</p>
      </div>
      <div>
        <p className="eg-kicker">Beside it in Scripture</p>
        <ul className="eg-beside">{passage.beside.map((b) => <li key={b.verse}><Quote label={b.verse} /><p>{b.note}</p></li>)}</ul>
        <p className="eg-doubt"><b>Where this stops.</b> {passage.limit}</p>
      </div>
    </div>

    <div className="eg-canaan">
      <div>
        <h3 className="eg-subhead">Canaan's own words, showing through</h3>
        <p className="eg-para">{`The writers wrote in Akkadian, as diplomats did, but their own speech shows through. The edition tags ${formatNumber(canaanite.words)} words across ${formatNumber(canaanite.letters)} letters as Canaanite. That is only the edition's tagging: scholars see Canaanite in the grammar of far more. Some of these words look like Scripture's Hebrew.`}</p>
        <table className="eg-cognates">
          <thead><tr><th scope="col">In the letter</th><th scope="col">Gloss</th><th scope="col">Hebrew word</th><th scope="col">Where to see it</th></tr></thead>
          <tbody>{D.letters.cognates.map((c) => <tr key={c.id}>
            <td><span translate="no" className="eg-signs"><Signs text={c.cuneiform} /></span><small>{c.letter}</small></td><td>{c.gloss}</td>
            <td><span className="eg-he" lang="he" dir="rtl">{c.hebrew}</span> <span className="eg-translit">{c.translit}</span></td>
            <td><VerseLink label={c.verse} /><small>{verseByLabel.has(c.verse) ? `${c.strongs} in the site's tagged King James, on “${c.english}”` : ""}</small></td>
          </tr>)}</tbody>
        </table>
        <p className="eg-caption">The Strong's number proves which Hebrew word stands in the verse. Setting it next to the letter's word is this study's comparison of the sounds, and shows the two languages were close kin, nothing more.</p>
      </div>
      <Picture id="tablet" />
    </div>
  </>;
}
