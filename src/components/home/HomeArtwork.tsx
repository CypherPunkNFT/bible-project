import { TopicsArtwork } from "@/pages/topics/TopicsArtwork";
import { PlacesArtwork } from "@/pages/places/PlacesArtwork";

/** Five distinct miniature compositions for the opening collection cards. */
export function CollectionArtwork({ kind }: { kind: string }) {
  if (kind === "Atlas") return <PlacesArtwork kind="atlas" />;
  if (kind === "Study") return <PlacesArtwork kind="gospels" />;
  if (kind === "Topics") return <svg viewBox="0 0 480 185" fill="none" aria-hidden="true">
    <ellipse cx="240" cy="94" rx="162" ry="62" stroke="currentColor" opacity=".3" /><path d="M85 50Q240 160 394 50M85 137Q240 25 394 137" stroke="currentColor" opacity=".4" />
    {([[103, 48, "GRACE"], [377, 48, "FAITH"], [103, 140, "PRAYER"], [377, 140, "HOPE"]] as const).map(([x, y, label]) => <g key={label}><rect x={x - 45} y={y - 14} width="90" height="28" rx="5" fill="var(--surface)" stroke="currentColor" strokeOpacity=".6" /><text x={x} y={y + 4} textAnchor="middle" fontSize="10" letterSpacing="1.4" fill="currentColor">{label}</text></g>)}
    <circle cx="240" cy="94" r="35" fill="var(--surface)" stroke="currentColor" /><circle cx="240" cy="94" r="28" stroke="currentColor" opacity=".25" /><path d="M222 105V81Q231 77 240 82Q249 77 258 81V105Q249 101 240 106Q231 101 222 105ZM240 83V105" stroke="currentColor" strokeWidth="1.5" />
  </svg>;
  if (kind === "Apologetics") return <svg viewBox="0 0 480 185" fill="none" aria-hidden="true">
    <circle cx="240" cy="94" r="65" stroke="currentColor" opacity=".35" /><circle cx="240" cy="94" r="44" stroke="currentColor" strokeDasharray="2 5" opacity=".5" /><ellipse cx="240" cy="94" rx="152" ry="44" transform="rotate(-16 240 94)" stroke="currentColor" opacity=".5" />
    <path d="M240 20V48M119 130L200 107M356 130L280 107" stroke="currentColor" opacity=".4" /><path d="M226 78H254M240 66V110" stroke="currentColor" strokeWidth="2" />
    {[[240, 20], [113, 131], [363, 131]].map(([x,y]) => <g key={x}><circle cx={x} cy={y} r="9" fill="var(--surface)" stroke="currentColor" /><circle cx={x} cy={y} r="3" fill="currentColor" /></g>)}
    <text x="82" y="163" fontSize="9" letterSpacing="1.5" fill="currentColor">REASON</text><text x="334" y="163" fontSize="9" letterSpacing="1.5" fill="currentColor">WITNESS</text>
  </svg>;
  return <svg viewBox="0 0 480 185" fill="none" aria-hidden="true">
    <path d="M83 41Q161 19 240 45Q319 19 397 41V149Q318 127 240 151Q161 127 83 149Z" fill="currentColor" fillOpacity=".07" stroke="currentColor" strokeWidth="1.6" /><path d="M74 52V158Q157 138 240 160Q323 138 406 158V52M240 46V150" stroke="currentColor" opacity=".55" />
    {[0,1,2,3,4].map((i) => <g key={i} stroke="currentColor" opacity={.65-i*.08}><path d={`M105 ${64+i*15}Q158 ${50+i*15} 218 ${68+i*15}`} /><path d={`M262 ${68+i*15}Q317 ${50+i*15} 375 ${64+i*15}`} /></g>)}
    <path d="M341 32V104L352 94 363 103V33" fill="currentColor" opacity=".75" />
  </svg>;
}

export function HomeArtwork({ kind }: { kind: string }) {
  if (kind === "cities" || kind === "journeys" || kind === "gospels" || kind === "atlas") return <PlacesArtwork kind={kind} />;
  if (kind === "connections") return <svg viewBox="0 0 480 185" fill="none" aria-hidden="true"><path d="M30 154H450" stroke="currentColor" strokeWidth="3" />{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M30 150Q${90 + i * 16} ${126 - i * 18} ${114 + i * 40} 150`} stroke="currentColor" strokeWidth="1.5" opacity={.28 + i * .08} />)}<circle cx="30" cy="151" r="4" fill="currentColor" /></svg>;
  if (kind === "structure") return <svg viewBox="0 0 480 185" aria-hidden="true">{Array.from({ length: 66 }, (_, i) => <rect key={i} x={31 + i % 22 * 19} y={55 + Math.floor(i / 22) * 26} width="14" height="19" rx="3" fill="currentColor" opacity={.25 + (i * 13 % 11) / 16} />)}</svg>;
  return <TopicsArtwork kind={kind} />;
}

/** An illustrated book, with the actual opening of John in the KJV. */
export function OpenBible() {
  return <div className="home-open-bible" aria-hidden="true">
    <div className="home-book-left"><small>THE GOSPEL ACCORDING TO</small><b>John</b><span>1</span><p>In the beginning was the Word, and the Word was with God, and the Word was God.</p><i /><i /><i /><small className="home-book-ref">JOHN 1:1 · KING JAMES VERSION</small></div>
    <div className="home-book-right"><span className="home-ribbon" /><small>THE WORD MADE FLESH</small><i /><i /><i /><i /><i /><i /><i /><i /><i /><div className="home-book-seal">α <span>✦</span> ω</div></div>
  </div>;
}

export function BibleShelf() {
  return <div className="home-bible-shelf" aria-hidden="true">{["Genesis", "Exodus", "Psalms", "Isaiah", "Matthew", "Romans", "Revelation"].map((book, i) => <div key={book} style={{ background: `color-mix(in srgb, var(--${["history", "history", "poetry", "prophets", "gospels", "epistles", "revelation"][i]}) 24%, var(--surface))`, borderColor: `var(--${["history", "history", "poetry", "prophets", "gospels", "epistles", "revelation"][i]})`, height: `${140 + [8, 8, -8, 28, 8, -8, 8][i]}px` }}><span>{book}</span></div>)}</div>;
}

export function QuestionOrbit() {
  return <svg className="home-question-orbit" viewBox="0 0 540 360" fill="none" aria-hidden="true">
    <circle cx="270" cy="180" r="142" stroke="currentColor" opacity=".3" /><circle cx="270" cy="180" r="108" stroke="currentColor" strokeDasharray="2 7" opacity=".5" /><ellipse cx="270" cy="180" rx="226" ry="66" transform="rotate(-24 270 180)" stroke="currentColor" opacity=".2" />
    <path d="M270 41V104M137 263L206 220M402 263L334 220" stroke="currentColor" opacity=".5" />
    {([[270, 38, "SCRIPTURE"], [131, 270, "REASON"], [408, 270, "WITNESS"]] as const).map(([x, y, label]) => <g key={label}><circle cx={x} cy={y} r="5" fill="currentColor" /><text x={x} y={y + (label === "SCRIPTURE" ? -18 : 27)} textAnchor="middle" fill="currentColor" fontSize="10" letterSpacing="2">{label}</text></g>)}
    <text x="270" y="162" textAnchor="middle" fill="currentColor" fontSize="26">✦</text><text x="270" y="196" textAnchor="middle" fill="var(--ink)" fontFamily="Literata, Georgia, serif" fontSize="26">Faith seeking</text><text x="270" y="231" textAnchor="middle" fill="var(--ink)" fontFamily="Literata, Georgia, serif" fontSize="26">understanding.</text>
  </svg>;
}
