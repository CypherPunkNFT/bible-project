import { ArrowRight, ArrowUpRight, Compass } from "lucide-react";
import { useId, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { atlasDestination } from "./routes";
import SUMMARY from "./old-maps-summary.json";
import "./old-maps.css";

// The Atlas's ninth destination: historical maps of the biblical world (Research/HistoricalMaps). The owner approved the
// card and the Study card on 2026-10-19 (design/old-maps-directions/?d=atlas, parts 1 and 4); the collection page itself
// is still being chosen among directions A, B and C, so /study/atlas/old-maps shows a short preview until then.

const fmt = (n: number) => n.toLocaleString("en-GB");

/** A sheet with a compass rose; drawn to sit with the lucide icons the other eight destinations use. */
export function OldMapIcon({ size = 24, strokeWidth = 1.5, className }: { size?: number | string; strokeWidth?: number | string; className?: string; "aria-hidden"?: boolean }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M4 4.5 18 3l1.2 15.5-2.7 2.5L5 21.5z" /><path d="M19.2 18.5l-2.7 2.5q.8-2 2.7-2.5z" /><circle cx="11.5" cy="12" r="3.6" />
    <path d="M11.5 7.2v1.2M11.5 15.6v1.2M6.7 12h1.2M15.1 12h1.2" /><path d="m10.6 12.9 2.4-2.4-1.5 3.3z" fill="currentColor" />
  </svg>;
}

export const OLD_MAPS = {
  id: "old-maps", title: "Old maps", eyebrow: "See how it was drawn", icon: OldMapIcon, color: "epistles",
  description: "The Holy Land, Jerusalem and the lands of the Bible as mapmakers drew them, from medieval manuscripts to measured surveys. Open any map at full size, with its maker, its library and its credit.",
  detail: `${fmt(SUMMARY.maps)} maps · ${fmt(SUMMARY.makers)} mapmakers · ${SUMMARY.earliest}–${SUMMARY.latest}`, action: "Open the old maps",
} as const;

const ROSE = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
  const long = a % 90 === 0, r = long ? 21 : 13, rad = (a * Math.PI) / 180;
  const x = (r * Math.sin(rad)).toFixed(1), y = (-r * Math.cos(rad)).toFixed(1);
  const lx = (3.2 * Math.sin(rad + Math.PI / 2)).toFixed(1), ly = (-3.2 * Math.cos(rad + Math.PI / 2)).toFixed(1);
  return { d: `M${lx} ${ly}L${x} ${y}L${-lx} ${-ly}Z`, opacity: long ? .35 : .12 };
});
const RHUMBS = [-62, -38, -14, 14, 38, 62, 160, 200].map((a) => { const rad = (a * Math.PI) / 180; return `M0 0L${(150 * Math.cos(rad)).toFixed(0)} ${(150 * Math.sin(rad)).toFixed(0)}`; });
const HILLS = [[226, 58], [240, 70], [222, 84], [244, 96], [228, 138], [252, 142], [262, 60], [258, 84]];

/** The card drawing: a curled sheet with a coast, the Jordan and its two lakes, Jerusalem, a cartouche and a slowly turning rose. */
export function OldMapsArtwork() {
  const sea = `old-maps-sea-${useId().replace(/:/g, "")}`;
  return <svg className="places-artwork places-artwork-old-maps" viewBox="0 0 480 185" fill="none" aria-hidden="true" focusable="false">
    <path d="M120 20L378 12 388 162 130 172Z" fill="currentColor" fillOpacity=".04" stroke="currentColor" strokeOpacity=".28" />
    <path d="M96 30L364 22 370 138 342 166 104 172Z" fill="var(--surface)" stroke="currentColor" />
    <path d="M370 138L342 166Q352 146 370 138Z" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeLinejoin="round" />
    <path d="M104 37L357 30 362 132 336 160 111 165Z" stroke="currentColor" strokeOpacity=".3" />
    <clipPath id={sea}><path d="M-44 -70H40C34 -50 44 -38 38 -24S30 4 32 18 22 44 18 61H-38Z" /></clipPath>
    <g transform="translate(150 104)"><g clipPath={`url(#${sea})`} stroke="currentColor" strokeOpacity=".22" strokeWidth=".8">{RHUMBS.map((d) => <path key={d} d={d} />)}</g></g>
    <path d="M190 36C184 52 194 60 186 76S178 102 180 116 170 142 166 160" stroke="currentColor" strokeWidth="1.4" />
    <path d="M186 36C180 52 190 60 182 76S174 102 176 116 166 142 162 160" stroke="currentColor" strokeOpacity=".3" />
    <g className="old-maps-rose"><circle r="25" stroke="currentColor" strokeOpacity=".35" /><circle r="17" stroke="currentColor" strokeOpacity=".2" />
      {ROSE.map(({ d, opacity }) => <path key={d} d={d} fill="currentColor" fillOpacity={opacity} stroke="currentColor" strokeWidth=".9" />)}
      <circle r="2.2" fill="currentColor" /><text y="-28" textAnchor="middle" fill="currentColor" fontSize="7" letterSpacing="1">N</text></g>
    <g className="old-maps-ship" stroke="currentColor" strokeLinejoin="round"><path d="M116 64h24l-4 5h-16z" fill="currentColor" fillOpacity=".14" /><path d="M128 64V48" /><path d="M128 49l8 11h-8z" fill="currentColor" fillOpacity=".1" /><path d="M128 51l-6 9h6" /></g>
    <g stroke="currentColor" strokeOpacity=".55" strokeLinecap="round">{HILLS.map(([x, y]) => <g key={`${x}-${y}`}><path d={`M${x - 7} ${y}l7-8 7 8`} /><path d={`M${x - 2} ${y - 3}l2-2`} opacity=".6" /></g>)}</g>
    <path d="M302 36C298 48 306 56 301 66" stroke="currentColor" strokeOpacity=".7" /><ellipse cx="301" cy="72" rx="5" ry="7.5" fill="currentColor" fillOpacity=".14" stroke="currentColor" />
    <path d="M301 80C306 92 297 100 304 110S300 118 304 122" stroke="currentColor" strokeOpacity=".7" /><ellipse cx="305" cy="136" rx="7" ry="15" fill="currentColor" fillOpacity=".14" stroke="currentColor" />
    <g transform="translate(272 112)" stroke="currentColor"><circle r="8" fill="var(--surface)" /><path d="M-5 -3v-5h3v3h4v-3h3v5M-1 -10l1-3 1 3" /><circle r="2" fill="currentColor" /></g>
    <path d="M312 40h40q6 0 6 7v8q0 7-6 7h-40q-6 0-6-7v-8q0-7 6-7z" fill="var(--surface)" stroke="currentColor" /><path d="M306 47q-6 0-6 4t6 4M358 47q6 0 6 4t-6 4" stroke="currentColor" strokeOpacity=".6" />
    <text x="332" y="54" textAnchor="middle" fill="currentColor" fontSize="5.6" letterSpacing="1">TERRA SANCTA</text>
    <path d="M232 152h48M232 149v6M256 150v4M280 149v6" stroke="currentColor" /><path d="M232 152h12" stroke="currentColor" strokeWidth="2.4" />
  </svg>;
}

/** The Atlas home's third row: one wide card, since old maps span every age the other eight cover. */
export function OldMapsRow({ style }: { style: CSSProperties }) {
  return <>
    <div className="places-section-heading places-row-heading old-maps-row"><h2>How it was drawn<span className="old-maps-new">New</span></h2><span>Twelve centuries of maps of the biblical world</span></div>
    <Link to={atlasDestination(OLD_MAPS.id)} className="places-destination-card old-maps-card" data-places-morph style={style} aria-labelledby="places-card-old-maps">
      <div className="places-card-top"><OldMapIcon size={18} strokeWidth={1.5} /><span>{OLD_MAPS.eyebrow}</span><ArrowUpRight size={19} aria-hidden /></div>
      <div className="old-maps-card-body">
        <OldMapsArtwork />
        <div className="places-card-copy"><span className="places-card-number">09</span><h2 id="places-card-old-maps">{OLD_MAPS.title}</h2><p>{OLD_MAPS.description}</p>
          <div className="places-card-foot"><span>{OLD_MAPS.detail}</span><strong>{OLD_MAPS.action}<ArrowRight size={15} aria-hidden /></strong></div></div>
        <div className="old-maps-fan" aria-hidden="true">{SUMMARY.fan.map((map) => <img key={map.src} src={map.src} alt="" loading="lazy" />)}</div>
      </div>
    </Link>
  </>;
}

/** /study/atlas/old-maps until the owner chooses the collection's design: what it is, three sheets, and what comes next. */
export function OldMapsPreview() {
  return <>
    <header className="places-destination-intro history-intro"><div><p className="places-kicker">How it was drawn</p><h1>The biblical world, as it was drawn.</h1>
      <p>{`${fmt(SUMMARY.maps)} maps of the Holy Land, Jerusalem and the lands around them, from a plan of Jerusalem's churches dated about ${SUMMARY.earliest} to the surveys of the ${Math.floor(SUMMARY.latest / 10) * 10}s, by ${fmt(SUMMARY.makers)} mapmakers, from ${SUMMARY.libraries} libraries.`}</p></div>
      <OldMapsArtwork /></header>
    <section className="old-maps-preview" aria-label="Three of the maps">
      {SUMMARY.fan.map((map) => <a key={map.src} href={map.url} target="_blank" rel="noreferrer" className="old-maps-sheet">
        <img src={map.src} alt={`${map.title}, ${map.year}`} loading="lazy" />
        <span className="old-maps-year">{map.year}</span><strong>{map.maker}</strong><small>{map.credit} · {map.licence}</small></a>)}
    </section>
    <div className="places-next-build old-maps-next"><Compass size={18} aria-hidden /><p>The full collection is being designed: every map through time, by subject and by mapmaker, each opening at full size with its library and its credit.</p></div>
  </>;
}
