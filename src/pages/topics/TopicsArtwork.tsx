import type { ReactElement } from "react";

/** Decorative line drawings for the twelve topic families, in the Atlas card style (src/pages/places/PlacesArtwork.tsx). */
export function TopicsArtwork({ kind }: { kind: string }) {
  return <svg className={`topics-artwork topics-artwork-${kind}`} viewBox="0 0 480 185" fill="none" aria-hidden="true" focusable="false">
    {ART[kind] ?? ART.scripture}
  </svg>;
}

const ray = (cx: number, cy: number, r1: number, r2: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `M${(cx + r1 * Math.cos(a)).toFixed(1)} ${(cy + r1 * Math.sin(a)).toFixed(1)}L${(cx + r2 * Math.cos(a)).toFixed(1)} ${(cy + r2 * Math.sin(a)).toFixed(1)}`;
};

const ART: Record<string, ReactElement> = {
  // A radiant circle around the triangle of the Godhead.
  god: <>
    <g stroke="currentColor" opacity=".12"><ellipse cx="240" cy="92" rx="200" ry="70" /><ellipse cx="240" cy="92" rx="140" ry="48" /><path d="M30 92H450" /></g>
    <g stroke="currentColor" opacity=".55">{Array.from({ length: 24 }, (_, i) => <path key={i} d={ray(240, 92, 56, i % 2 ? 70 : 84, i * 15)} />)}</g>
    <circle cx="240" cy="92" r="46" fill="var(--surface)" stroke="currentColor" />
    <circle cx="240" cy="92" r="38" stroke="currentColor" strokeOpacity=".3" />
    <path d="M240 62L266 107H214Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.6" />
    {[[240, 62], [266, 107], [214, 107]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.5" fill="currentColor" />)}
    {[[80, 40], [400, 36], [120, 150], [372, 148], [60, 100], [420, 104]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i < 2 ? 2.2 : 1.6} fill="currentColor" opacity=".5" />)}
  </>,
  // The cross on the hill, morning breaking behind it.
  christ: <>
    <g stroke="currentColor" opacity=".16" strokeDasharray="3 5"><path d="M150 132A90 90 0 0 1 330 132" /><path d="M110 132A130 130 0 0 1 370 132" /><path d="M70 132A170 170 0 0 1 410 132" /></g>
    <path d="M40 160Q240 92 440 160" fill="currentColor" fillOpacity=".07" stroke="currentColor" strokeOpacity=".55" />
    <path d="M20 168H460" stroke="currentColor" opacity=".25" />
    <path d="M240 126V30M216 54H264" stroke="currentColor" strokeWidth="3" />
    <path d="M172 139V88M160 100H184M308 139V88M296 100H320" stroke="currentColor" strokeWidth="1.6" opacity=".5" />
    <path d="M222 24L230 12 240 20 250 12 258 24Z" stroke="currentColor" opacity=".7" />
    <circle cx="384" cy="142" r="14" fill="var(--surface)" stroke="currentColor" strokeOpacity=".6" /><path d="M362 156V138Q362 120 384 120Q406 120 406 138V156" stroke="currentColor" strokeOpacity=".35" />
  </>,
  // An unrolled scroll with its columns of writing.
  scripture: <>
    <path d="M118 40H362V146H118Z" fill="currentColor" fillOpacity=".06" stroke="currentColor" strokeOpacity=".45" />
    <g stroke="currentColor" opacity=".5">{[0, 1, 2].map((c) => Array.from({ length: 7 }, (_, r) => <path key={`${c}-${r}`} d={`M${140 + c * 76} ${58 + r * 12}H${140 + c * 76 + (r % 3 === 2 ? 40 : 58)}`} />))}</g>
    {[100, 380].map((x) => <g key={x}><rect x={x - 12} y="30" width="24" height="126" rx="12" fill="var(--surface)" stroke="currentColor" /><path d={`M${x} 18V30M${x} 156V168`} stroke="currentColor" strokeWidth="3" /><circle cx={x} cy="16" r="4" fill="currentColor" /><circle cx={x} cy="170" r="4" fill="currentColor" /></g>)}
    <path d="M30 176H450" stroke="currentColor" opacity=".18" />
  </>,
  // A gathering place: people coming in from both sides.
  church: <>
    <path d="M30 160H450M70 170H410" stroke="currentColor" opacity=".22" />
    <path d="M190 160V84L240 46 290 84V160Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" />
    <path d="M240 46V22M231 31H249" stroke="currentColor" strokeWidth="2" />
    <circle cx="240" cy="88" r="12" stroke="currentColor" /><path d="M240 76V100M228 88H252" stroke="currentColor" strokeOpacity=".5" />
    <path d="M224 160V130Q240 112 256 130V160" fill="var(--surface)" stroke="currentColor" />
    <path d="M150 160V106L190 84M330 160V106L290 84" stroke="currentColor" strokeOpacity=".4" />
    <g stroke="currentColor" strokeDasharray="3 5" opacity=".55"><path d="M40 140Q120 120 222 152" /><path d="M440 140Q360 120 258 152" /></g>
    {[[60, 136], [96, 129], [132, 129], [420, 136], [384, 129], [348, 129]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y - 10} r="4" fill="currentColor" /><path d={`M${x - 6} ${y + 4}Q${x} ${y - 8} ${x + 6} ${y + 4}`} stroke="currentColor" /></g>)}
  </>,
  // The tree, its fruit, and the serpent.
  sin: <>
    <path d="M30 164H450" stroke="currentColor" opacity=".25" /><path d="M180 172L214 164 232 176 262 162 300 172" stroke="currentColor" opacity=".4" />
    <path d="M232 164V100Q232 90 220 80M248 164V100Q248 88 262 78M240 100V70" stroke="currentColor" strokeWidth="1.6" />
    <path d="M150 82Q140 40 190 34Q210 8 250 18Q292 6 312 38Q350 46 334 84Q330 106 290 102Q262 116 240 104Q210 116 186 102Q154 104 150 82Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".6" />
    {[[188, 64], [222, 46], [276, 52], [304, 76], [258, 86], [204, 88]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 2 ? 7 : 5} fill={i === 2 ? "currentColor" : "var(--surface)"} stroke="currentColor" />)}
    <path d="M206 160Q262 150 232 136Q206 126 252 116Q282 108 262 92Q254 86 270 80" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="272" cy="79" r="3" fill="currentColor" /><path d="M276 78L284 74M276 79L284 82" stroke="currentColor" />
  </>,
  // The broken chain, with light breaking through.
  salvation: <>
    <g stroke="currentColor" opacity=".18">{Array.from({ length: 12 }, (_, i) => <path key={i} d={ray(240, 96, 30, 150, i * 30 + 15)} />)}</g>
    <g stroke="currentColor" strokeWidth="2">{[70, 118, 166].map((x, i) => <rect key={x} x={x} y={i % 2 ? 86 : 80} width={i % 2 ? 40 : 52} height={i % 2 ? 20 : 32} rx={i % 2 ? 10 : 16} fill="var(--surface)" />)}{[262, 310, 358].map((x, i) => <rect key={x} x={x} y={i % 2 ? 80 : 86} width={i % 2 ? 52 : 40} height={i % 2 ? 32 : 20} rx={i % 2 ? 16 : 10} fill="var(--surface)" />)}</g>
    <path d="M210 80H222Q230 80 230 88M210 112H222Q230 112 230 104M270 80H258Q250 80 250 88M270 112H258Q250 112 250 104" stroke="currentColor" strokeWidth="2" />
    <g stroke="currentColor" strokeWidth="1.5">{[-60, -30, 0, 30, 60].map((d) => <path key={d} d={ray(240, 96, 12, 26, d - 90)} />)}{[-60, -30, 0, 30, 60].map((d) => <path key={`b${d}`} d={ray(240, 96, 12, 26, d + 90)} />)}</g>
    <path d="M40 160H440" stroke="currentColor" opacity=".2" />
  </>,
  // A lamp lighting the path ahead (Psalm 119:105).
  "christian-life": <>
    <path d="M118 66L60 170H300Z" fill="currentColor" fillOpacity=".06" />
    <path d="M200 176Q236 140 292 124T452 92M262 176Q284 146 318 132T456 100" stroke="currentColor" strokeOpacity=".45" />
    <path d="M20 112Q120 104 230 108T460 94" stroke="currentColor" opacity=".15" />
    {[[246, 160], [268, 147], [298, 136], [328, 124], [360, 115], [392, 107]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={5 - i * 0.5} ry={2.6 - i * 0.25} transform={`rotate(-20 ${x} ${y})`} fill="currentColor" opacity={0.85 - i * 0.12} />)}
    <path d="M86 66Q86 50 118 50Q148 50 152 62L172 58Q164 76 142 80Q118 86 96 80Q86 76 86 66Z" fill="var(--surface)" stroke="currentColor" strokeWidth="1.6" />
    <path d="M110 50Q104 44 112 40" stroke="currentColor" /><path d="M172 58Q166 44 172 32Q180 44 172 58Z" fill="currentColor" />
    <g stroke="currentColor" opacity=".5">{[-150, -120, -90, -60, -30].map((d) => <path key={d} d={ray(172, 44, 18, 30, d)} />)}</g>
  </>,
  // An hourglass beneath the stars, the sun rising on a new day.
  "last-things": <>
    {[[60, 30], [110, 52], [170, 22], [300, 30], [350, 18], [420, 46], [250, 40], [400, 92]].map(([x, y], i) => <path key={i} d={`M${x - 4} ${y}H${x + 4}M${x} ${y - 4}V${y + 4}`} stroke="currentColor" opacity=".55" />)}
    <path d="M30 150H450" stroke="currentColor" opacity=".3" />
    <path d="M300 150A56 56 0 0 1 412 150" fill="currentColor" fillOpacity=".1" stroke="currentColor" />
    <g stroke="currentColor" opacity=".45">{[-170, -150, -130, -110, -90, -70, -50, -30, -10].map((d) => <path key={d} d={ray(356, 150, 66, 82, d)} />)}</g>
    <path d="M128 46H192M128 154H192M134 46Q134 92 158 100Q134 108 134 154M186 46Q186 92 162 100Q186 108 186 154" stroke="currentColor" strokeWidth="1.6" />
    <path d="M140 60Q160 78 180 60M142 154Q144 128 160 120Q176 128 178 154Z" fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeOpacity=".5" />
    <path d="M160 100V118" stroke="currentColor" strokeDasharray="2 3" />
    <path d="M60 168H420" stroke="currentColor" opacity=".15" />
  </>,
  // The tabernacle court: tent, altar and rising smoke.
  "worship-in-israel": <>
    <path d="M40 146L130 96H350L440 146Z" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeOpacity=".4" />
    <g stroke="currentColor" opacity=".45">{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${130 + i * 22} 96V84`} />)}<path d="M130 84H350" /></g>
    <path d="M276 104V62L318 50 342 62V100M276 62L300 74 342 62M300 74V108" fill="var(--surface)" stroke="currentColor" />
    <path d="M140 126H190V150H140ZM140 126L134 120M190 126L196 120M140 150L134 156M190 150L196 156" fill="var(--surface)" stroke="currentColor" strokeWidth="1.6" />
    <path d="M152 120Q140 100 158 88Q172 76 160 58Q178 72 172 90Q166 104 178 118" stroke="currentColor" strokeOpacity=".6" />
    <ellipse cx="232" cy="134" rx="16" ry="6" stroke="currentColor" /><path d="M232 140V150M222 152H242" stroke="currentColor" />
    <path d="M20 166H460" stroke="currentColor" opacity=".2" />
  </>,
  // The camp of Israel: twelve banners around the tent of meeting.
  peoples: <>
    <ellipse cx="200" cy="96" rx="128" ry="62" stroke="currentColor" strokeDasharray="3 5" opacity=".45" />
    <path d="M182 108V84L200 74 218 84V108Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
    {Array.from({ length: 12 }, (_, i) => { const a = (i * 30 + 15) * Math.PI / 180; const x = 200 + 128 * Math.cos(a); const y = 96 + 62 * Math.sin(a); return <g key={i}><path d={`M${x.toFixed(1)} ${(y + 8).toFixed(1)}V${(y - 16).toFixed(1)}`} stroke="currentColor" /><path d={`M${x.toFixed(1)} ${(y - 16).toFixed(1)}h12l-4 4 4 4h-12`} fill="currentColor" fillOpacity={i % 3 === 0 ? 0.8 : 0.25} stroke="currentColor" /></g>; })}
    <path d="M360 150H452M372 150V134H440V150M384 134V118H428V134M396 118V102H416V118" fill="currentColor" fillOpacity=".06" stroke="currentColor" strokeOpacity=".45" />
    <path d="M20 170H460" stroke="currentColor" opacity=".18" />
  </>,
  // A household: a flat-roofed home, its vine, and the family at the table.
  society: <>
    <path d="M30 156H450" stroke="currentColor" opacity=".3" />
    <path d="M70 156V74H200V156M64 74H206M70 88H200" fill="currentColor" fillOpacity=".06" stroke="currentColor" />
    <path d="M118 156V122Q135 104 152 122V156" fill="var(--surface)" stroke="currentColor" /><path d="M90 100H110V116H90ZM160 100H180V116H160Z" stroke="currentColor" strokeOpacity=".6" />
    <path d="M200 120H232V156M206 140H232" stroke="currentColor" strokeOpacity=".4" />
    <path d="M206 74Q226 50 250 64T296 56" stroke="currentColor" strokeOpacity=".55" />{[[230, 60], [262, 64], [288, 54]].map(([x, y]) => <circle key={x} cx={x} cy={y + 8} r="4" fill="currentColor" opacity=".55" />)}
    <path d="M286 134H420M300 134V156M406 134V156" stroke="currentColor" strokeWidth="1.6" />
    {[[312, 116], [346, 110], [380, 116], [410, 120]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y - 10} r={i === 3 ? 4 : 5} fill="currentColor" /><path d={`M${x - 8} ${y + 14}Q${x} ${y - 6} ${x + 8} ${y + 14}`} stroke="currentColor" /></g>)}
  </>,
  // Heavens and earth: sun and moon, mountains, birds, a tree and the sea.
  creation: <>
    <circle cx="96" cy="46" r="16" fill="currentColor" fillOpacity=".15" stroke="currentColor" />
    <g stroke="currentColor" opacity=".5">{Array.from({ length: 8 }, (_, i) => <path key={i} d={ray(96, 46, 22, 30, i * 45)} />)}</g>
    <path d="M396 30A16 16 0 1 0 410 54A13 13 0 1 1 396 30Z" fill="currentColor" fillOpacity=".2" stroke="currentColor" />
    {[[300, 26], [340, 52], [440, 70], [170, 20]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill="currentColor" opacity=".55" />)}
    <path d="M30 128L110 70 152 104 212 52 286 120 330 90 380 128" fill="currentColor" fillOpacity=".07" stroke="currentColor" strokeOpacity=".6" />
    <path d="M190 68L212 52 232 70" stroke="currentColor" strokeOpacity=".4" />
    <g stroke="currentColor" strokeWidth="1.4"><path d="M244 44Q250 38 256 44Q262 38 268 44" /><path d="M276 62Q280 58 284 62Q288 58 292 62" /></g>
    <path d="M406 128V100" stroke="currentColor" strokeWidth="1.6" /><circle cx="406" cy="90" r="16" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
    <g stroke="currentColor"><path d="M20 140Q50 132 80 140T140 140T200 140T260 140T320 140T380 140T440 140" strokeOpacity=".6" /><path d="M40 156Q70 148 100 156T160 156T220 156T280 156T340 156T400 156T460 156" strokeOpacity=".35" /><path d="M20 172Q50 164 80 172T140 172T200 172T260 172T320 172T380 172T440 172" strokeOpacity=".2" /></g>
  </>,
};
