// Decorative previews shared by the Study landing and its local contents cards.
import type { StudyCollectionId } from "@/data/study-collections";
import type { StudyIllustration } from "@/data/study-sections";
import "@/pages/study/study.css";

export function StudyMiniature({ kind }: { kind: StudyCollectionId }) {
  return <svg className="study-miniature" viewBox="0 0 240 70" fill="none" aria-hidden="true">
    {kind === "references" && <>{[30, 46, 68, 92, 115, 142, 165, 196].map((end, i) => <path key={end} d={`M8 59 Q${end / 2 + 8} ${52 - i * 9} ${end + 25} 59`} stroke="currentColor" opacity={.2 + i * .09} />)}<path d="M8 64H231" stroke="currentColor" strokeWidth="3" opacity=".7" /></>}
    {kind === "structure" && Array.from({ length: 48 }, (_, i) => <rect key={i} x={8 + i % 16 * 14} y={12 + Math.floor(i / 16) * 17} width="10" height="12" rx="2" fill="currentColor" opacity={.2 + i % 7 * .1} />)}
    {kind === "gospels" && [12, 20, 17, 43, 34, 54, 31, 22, 42, 59, 48, 15, 28, 39, 20, 9].map((height, i) => <rect key={i} x={8 + i * 14} y={64 - height} width="10" height={height} rx="2" fill="currentColor" opacity={.25 + height / 90} />)}
    {kind === "versions" && <><path d="M8 48H230" stroke="currentColor" opacity=".4" />{[20, 67, 109, 157, 191, 219].map((x, i) => <g key={x}><path d={`M${x} 48V${i % 2 ? 18 : 32}`} stroke="currentColor" /><circle cx={x} cy={i % 2 ? 18 : 32} r="4" fill="currentColor" opacity={.4 + i * .1} /></g>)}</>}
    {kind === "people" && <><path d="M120 18V35H45V52M120 35V52M120 35H195V52" stroke="currentColor" opacity=".5" />{[[120, 12], [45, 58], [120, 58], [195, 58]].map(([x, y]) => <circle key={x + ':' + y} cx={x} cy={y} r="8" fill="currentColor" fillOpacity=".2" stroke="currentColor" />)}</>}
    {kind === "places" && <><path d="M15 50Q60 0 105 40T225 15" stroke="currentColor" strokeDasharray="3 4" />{[[15, 50], [75, 24], [140, 42], [225, 15]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="9" fill="currentColor" opacity=".15" /><circle cx={x} cy={y} r="3" fill="currentColor" /></g>)}</>}
    {kind === "miracles" && <>{[24, 45, 66, 87].map((r) => <ellipse key={r} cx="120" cy="36" rx={r} ry={r / 3} stroke="currentColor" opacity={1 - r / 110} />)}<path d="M120 16V56M110 36H130" stroke="currentColor" /></>}
    {kind === "letters" && <>{[175, 130, 210, 95].map((w, i) => <g key={w}><rect x="12" y={9 + i * 15} width={w} height="9" rx="2" fill="currentColor" opacity=".3" /><path d={`M${w / 3 + 12} ${9 + i * 15}v9M${w * .7 + 12} ${9 + i * 15}v9`} stroke="currentColor" /></g>)}</>}
    {kind === "names" && <>{[80, 120, 160].map((x, i) => <circle key={x} cx={x} cy="35" r="28" stroke="currentColor" opacity={.3 + i * .2} />)}<path d="M40 35H200" stroke="currentColor" opacity=".25" /></>}
  </svg>;
}

export function StudySectionPreview({ kind }: { kind: StudyIllustration }) {
  const shared: Partial<Record<StudyIllustration, StudyCollectionId>> = { arcs: "references", speech: "gospels", timeline: "versions", people: "people", places: "places", miracles: "miracles", letters: "letters", names: "names" };
  if (shared[kind]) return <StudyMiniature kind={shared[kind]!} />;
  return <svg className="study-miniature" viewBox="0 0 240 70" fill="none" aria-hidden="true">
    {/* Everyone in the Bible: a crowd of people, a few marked in the colours of who they were (king, prophet, priest…). */}
    {kind === "everyone" && Array.from({ length: 33 }, (_, i) => { const col = i % 11, row = Math.floor(i / 11), tones = ["var(--epistles)", "var(--prophets)", "var(--acts)", "var(--poetry)"]; const marked = [3, 9, 14, 20, 26, 30].indexOf(i); return <g key={i}><circle cx={20 + col * 20} cy={14 + row * 21} r="4.5" fill={marked >= 0 ? tones[marked % 4] : "currentColor"} opacity={marked >= 0 ? 1 : .35} /><path d={`M${13 + col * 20} ${27 + row * 21}Q${20 + col * 20} ${18 + row * 21} ${27 + col * 20} ${27 + row * 21}`} stroke={marked >= 0 ? tones[marked % 4] : "currentColor"} opacity={marked >= 0 ? .9 : .3} /></g>; })}
    {kind === "portraits" && [112, 83, 91, 64].map((x, i) => <g key={i} style={{ color: ["var(--gospels)", "var(--history)", "var(--poetry)", "var(--epistles)"][i] }}><path d={`M20 ${11 + i * 16}H220`} stroke="currentColor" strokeWidth="4" opacity=".25" /><rect x={x} y={6 + i * 16} width="7" height="10" rx="1" fill="currentColor" /></g>)}
    {(kind === "matrix" || kind === "coverage") && Array.from({ length: 60 }, (_, i) => <rect key={i} x={54 + i % 10 * 14} y={3 + Math.floor(i / 10) * 11} width="11" height="8" rx="1" fill="currentColor" opacity={kind === "coverage" ? (i % 10 > 6 && i % 3 === 0 ? .12 : .65) : (.15 + ((i * 7) % 9) / 12)} />)}
    {kind === "sections" && <>{[67, 33, 47, 22, 43].map((w, i, all) => <rect key={i} x={14 + all.slice(0, i).reduce((n, x) => n + x + 3, 0)} y="24" width={w} height="23" rx="2" fill="currentColor" opacity={.3 + i * .15} />)}<path d="M14 56H230" stroke="currentColor" opacity=".2" /></>}
    {kind === "sizes" && [185, 135, 155, 90, 65].map((w, i) => <rect key={i} x="28" y={6 + i * 12} width={w} height="8" rx="2" fill="currentColor" opacity={.85 - i * .12} />)}
    {kind === "chapters" && Array.from({ length: 18 }, (_, i) => <g key={i}><rect x={44 + i % 9 * 17} y={14 + Math.floor(i / 9) * 23} width="14" height="18" rx="2" fill="currentColor" opacity={.2 + i % 5 * .13} /><text x={51 + i % 9 * 17} y={27 + Math.floor(i / 9) * 23} textAnchor="middle" fill="currentColor" fontSize="8">{i + 1}</text></g>)}
    {kind === "teaching" && <><path d="M120 18Q76 6 35 17V57Q77 46 120 58Q163 46 205 57V17Q163 6 120 18V58Z" stroke="currentColor" opacity=".7" />{[27, 36, 45].map(y => <g key={y}><path d={`M49 ${y}Q79 ${y - 7} 106 ${y}`} stroke="currentColor" opacity=".4" /><path d={`M134 ${y}Q163 ${y - 7} 192 ${y}`} stroke="currentColor" opacity=".4" /></g>)}</>}
    {kind === "harmony" && <>{[38, 92, 148, 202].map((x, i) => <g key={x}><circle cx={x} cy="13" r="4" fill="currentColor" opacity={.4 + i * .15} /><path d={`M${x} 17Q${x} 43 120 58`} stroke="currentColor" opacity={.4 + i * .15} /></g>)}<circle cx="120" cy="58" r="5" fill="currentColor" /></>}
    {/* Rulers through time: three lanes of reigns, the top one splitting in two (the divided kingdom); one reign in king gold under a crown. */}
    {kind === "rulers" && <>
      {[[14, 36], [39, 64], [67, 96]].map(([a, b]) => <rect key={a} x={a} y={21} width={b - a} height={6} rx={2} fill="currentColor" opacity=".35" />)}
      <path d="M96 24Q106 24 110 17M96 24Q106 24 110 31" stroke="currentColor" opacity=".55" />
      {[[112, 128], [131, 152], [155, 192], [195, 228]].map(([a, b]) => <rect key={a} x={a} y={14} width={b - a} height={6} rx={2} fill={a === 155 ? "var(--epistles)" : "currentColor"} opacity={a === 155 ? 1 : .35} />)}
      {[[112, 146], [149, 160], [163, 199], [202, 228]].map(([a, b]) => <rect key={a} x={a} y={28} width={b - a} height={6} rx={2} fill="currentColor" opacity=".35" />)}
      <path d="M166 10L167 4L170 7L173.5 3L177 7L180 4L181 10Z" stroke="var(--epistles)" strokeLinejoin="round" />
      {[[14, 58], [62, 84], [88, 150], [154, 228]].map(([a, b]) => <rect key={a} x={a} y={46} width={b - a} height={4} rx={2} fill="currentColor" opacity=".22" />)}
      {[[14, 40], [44, 96], [100, 170], [174, 228]].map(([a, b]) => <rect key={a} x={a} y={58} width={b - a} height={4} rx={2} fill="currentColor" opacity=".16" />)}
    </>}
    {/* The apostles: twelve around a cross, one dashed (Judas), one beyond the ring on a dashed arc (Paul). */}
    {kind === "apostles" && <>
      <path d="M114 35H126M120 29V43" stroke="currentColor" opacity=".7" />
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2, x = 120 + Math.cos(a) * 34, y = 35 + Math.sin(a) * 26;
        return i === 11 ? <circle key={i} cx={x} cy={y} r="3.4" stroke="currentColor" strokeDasharray="1.6 1.6" opacity=".7" />
          : <circle key={i} cx={x} cy={y} r="3.4" fill={i === 0 || i === 3 ? "var(--role-disciple)" : "currentColor"} opacity={i === 0 || i === 3 ? 1 : .45} />; })}
      <path d="M157 30Q178 16 199 30" stroke="currentColor" strokeDasharray="3 3" opacity=".55" />
      <circle cx="203" cy="33" r="4.2" fill="currentColor" opacity=".75" />
    </>}
    {kind === "prophets" && <><path d="M18 43H222" stroke="currentColor" opacity=".3" />{[29, 61, 85, 112, 156, 184, 209].map((x, i) => <g key={x}><path d={`M${x} 43V${i % 2 ? 18 : 29}`} stroke="currentColor" /><circle cx={x} cy={i % 2 ? 18 : 29} r="4" fill="currentColor" opacity={.4 + i * .08} /></g>)}</>}
  </svg>;
}
