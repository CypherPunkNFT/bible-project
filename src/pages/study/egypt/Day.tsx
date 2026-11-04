// Section 02: the Great Hymn to the Aten beside Psalm 104. Two staves show each text's own running order, with eight themes marked at their
// true places, so the reordering can be seen rather than toggled. The psalm's stave is verse order, not the hours of a day. Then the four
// places they part, and who has said what, without choosing among them.
import { D, findTheme, hymnX, psalmX, STAVES } from "./model";
import { Cite, Head, OldText, Picture, Quote, ReadVerses } from "./parts";

const HYMN_Y = 42, PSALM_Y = 112;

function Staves({ themeId, onTheme }: { themeId: string; onTheme: (id: string) => void }) {
  return <svg className="eg-staves" viewBox={`0 0 ${STAVES.width} 150`} role="img" aria-label="Two parallel lines. The upper is the hymn, in Breasted's eleven strophes. The lower is Psalm 104, in its 35 verses. Eight numbered marks stand on each, in a different order on each line. The list beneath names them.">
    <text className="eg-staff-head" x={STAVES.left} y={HYMN_Y - 22}>The hymn, in Breasted's strophes</text>
    <text className="eg-staff-head" x={STAVES.left} y={PSALM_Y + 32}>Psalm 104, verse by verse</text>
    <path className="eg-staff" d={`M${STAVES.left} ${HYMN_Y}H${STAVES.right}M${STAVES.left} ${PSALM_Y}H${STAVES.right}`} />
    {D.strophes.map((s, i) => <path key={s} className="eg-tick" d={`M${hymnX(i)} ${HYMN_Y - 5}v10`} />)}
    {Array.from({ length: 35 }, (_, i) => <path key={i} className="eg-tick" d={`M${psalmX(i + 1)} ${PSALM_Y - 3}v6`} />)}
    {D.themes.map((t) => {
      const on = t.id === themeId;
      return <g key={t.id} className={`eg-note${on ? " on" : ""}`} onClick={() => onTheme(t.id)}>
        {on && <path className="eg-note-join" d={`M${hymnX(t.strophe)} ${HYMN_Y}L${psalmX(t.psalmAt)} ${PSALM_Y}`} />}
        <circle cx={hymnX(t.strophe)} cy={HYMN_Y} r="9" /><text x={hymnX(t.strophe)} y={HYMN_Y + 4} textAnchor="middle">{t.num}</text>
        <circle cx={psalmX(t.psalmAt)} cy={PSALM_Y} r="9" /><text x={psalmX(t.psalmAt)} y={PSALM_Y + 4} textAnchor="middle">{t.num}</text>
      </g>;
    })}
  </svg>;
}

export function Day({ themeId, onTheme }: { themeId: string | null; onTheme: (id: string) => void }) {
  const theme = findTheme(themeId);
  return <>
    <Head num="02" kicker="Two songs, eight themes" title={<>The same morning.<em> A different order.</em></>}
      lead="The Great Hymn to the Aten is on the wall of the tomb of Ay, a courtier of Pharaoh Akhenaten, in the middle of the 14th century BC. It sings to the sun's disc. Psalm 104 sings to the LORD. Read them together and eight themes stand out. Mark each where it falls, and you can see that neither text is following the other." />
    <Staves themeId={theme.id} onTheme={onTheme} />
    <p className="eg-caption">Only verses 19 to 23 of the psalm run like a day. The whole stave is the psalm's order, not the sun's journey. The eight themes are this study's own choice, and another reader could pick differently.</p>
    <ol className="eg-themes">{D.themes.map((t) => <li key={t.id}>
      <button type="button" aria-pressed={t.id === theme.id} onClick={() => onTheme(t.id)}><b>{t.num}</b><span>{t.name}</span></button>
    </li>)}</ol>
    <div className="eg-pair" aria-live="polite">
      <div><p className="eg-kicker">The hymn · {D.strophes[theme.strophe]}</p><OldText who="Breasted's translation of 1912. Line breaks are run together here">{theme.hymn}</OldText></div>
      <div><p className="eg-kicker">The psalm</p>{theme.verses.map((label) => <Quote key={label} label={label} />)}</div>
    </div>
    <p className="eg-para eg-pairnote">{theme.note}</p>

    <h3 className="eg-subhead">Where they part</h3>
    <ul className="eg-partings">{D.partings.map((p) => <li key={p.id}>
      <h4>{p.head}</h4>
      <p className="eg-part-hymn"><small>Hymn</small>{p.hymn}</p>
      <p className="eg-part-psalm"><small>Psalm</small>{p.psalm}</p>
      <p className="eg-part-note">{p.note}</p>
      <ReadVerses labels={p.verses} />
    </li>)}</ul>

    <div className="eg-views">
      <div>
        <h3 className="eg-subhead">What has been said</h3>
        <p className="eg-para">How the two are related is unsettled, and this page does not settle it. Buys's 2019 survey reports John Day saying there is no agreement on how to explain the likeness.</p>
        <dl className="eg-viewlist">{D.psalmViews.map((v) => <div key={v.who}><dt>{v.who}</dt><dd>{v.held}</dd></div>)}</dl>
        <p className="eg-caption">Each is reported through Buys, and none was read directly for this page.</p>
        <Cite ids={["breasted", "buys", "wiki-hymn"]} />
        <p className="eg-para eg-aten"><b>One odd meeting.</b> In Griffith's translation, the chapter of Amenemope about riches growing wings goes on to say “Thou shalt pray to the Aten when he rises”. The word also just means the sun's disc, and that book comes long after Akhenaten, so it tells us nothing about his hymn. It does show the sun being prayed to inside the very chapter set beside Proverbs 23:4-5, a verse that names no such thing.</p>
      </div>
      <Picture id="hymn" />
    </div>
  </>;
}
