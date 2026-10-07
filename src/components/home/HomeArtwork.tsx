import { TopicsArtwork } from "@/pages/topics/TopicsArtwork";
import { PlacesArtwork } from "@/pages/places/PlacesArtwork";

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
