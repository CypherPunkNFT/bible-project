// Study page (live): four drawings for the Study page's Questions & Answers card (QuizDoor.tsx), each a 580 × 250 line drawing in
// the card's gold, labelled like the other cards' drawings. The card shows the first; /quiz_door_mockup
// (QuizDoorMockupPage.tsx) shows all four in a 2 × 2 grid for the owner to choose (owner, 2026-10-24: "a two-by-two grid … focusing on the drawing").
// Styles: quiz-door.css (quiz-mark, quiz-q, quiz-tile-mark) and hub.css (art-label).
import type { CSSProperties } from "react";

const ground = "var(--art-ground)";

/** A label's lead: a short line from the drawing to a small ring, and the label beside the ring. A lead given its
 *  length as stretch hangs from the drawing and grows as the drawing rises (quiz-door.css, quiz-lead-stretch). */
function Lead({ d, ring, label, at, anchor, stretch }: { d: string; ring: [number, number]; label: string; at: [number, number]; anchor?: "middle"; stretch?: number }) {
  return <>
    <path d={d} stroke="currentColor" opacity=".4" className={stretch ? "quiz-lead-stretch" : undefined} style={stretch ? { "--lead-length": stretch } as CSSProperties : undefined}/><circle cx={ring[0]} cy={ring[1]} r="3" fill={ground} stroke="currentColor" opacity=".4"/>
    <text x={at[0]} y={at[1]} textAnchor={anchor} className="art-label">{label}</text>
  </>;
}

/** 1, the cards: a question card on two others, three choices with the right one ticked. */
export function CardsArt() {
  return <svg viewBox="0 0 580 250" fill="none">
    <ellipse cx="290" cy="132" rx="215" ry="88" stroke="currentColor" opacity=".08"/>
    <path d="M88 204H492" stroke="currentColor" opacity=".18"/>
    <g className="quiz-cards">
      <rect x="196" y="52" width="196" height="140" rx="9" transform="rotate(-7 294 122)" fill={ground} stroke="currentColor" opacity=".35"/>
      <rect x="196" y="52" width="196" height="140" rx="9" transform="rotate(4 294 122)" fill={ground} stroke="currentColor" opacity=".5"/>
      <g className="quiz-front">
        <rect x="190" y="46" width="208" height="150" rx="10" fill={ground} stroke="currentColor" strokeWidth="1.3"/>
        <text x="214" y="98" className="quiz-mark">?</text>
        <g stroke="currentColor" opacity=".45"><path d="M252 72H372"/><path d="M252 82H352"/><path d="M252 92H330"/></g>
        <g stroke="currentColor"><circle cx="220" cy="125" r="6" opacity=".45"/><path d="M234 125H330" opacity=".3"/><circle cx="220" cy="148" r="6" fill="currentColor" fillOpacity=".16"/><path d="M216.5 148l2.5 2.5 5-5" strokeWidth="1.4"/><path d="M234 148H352" opacity=".6"/><circle cx="220" cy="171" r="6" opacity=".45"/><path d="M234 171H318" opacity=".3"/></g>
      </g>
    </g>
    <Lead d="M106 70H168" ring={[106, 70]} label="ASK" at={[74, 56]}/>
    <Lead d="M412 92H468" ring={[468, 92]} label="ANSWER" at={[440, 78]}/>
    <Lead d="M294 212V226" ring={[294, 229]} label="REMEMBER" at={[294, 249]} anchor="middle"/>
  </svg>;
}

/** 2, the catechism page: an old printed page, its question marked Q. and its answer A., the answer proved from Scripture. */
export function CatechismArt() {
  return <svg viewBox="0 0 580 250" fill="none">
    <ellipse cx="290" cy="128" rx="215" ry="88" stroke="currentColor" opacity=".08"/>
    <path d="M88 210H492" stroke="currentColor" opacity=".18"/>
    <g className="quiz-cards">
      <rect x="216" y="34" width="156" height="170" rx="3" transform="rotate(-5 294 119)" fill={ground} stroke="currentColor" opacity=".35"/>
      <g className="quiz-front">
        <rect x="210" y="28" width="168" height="178" rx="3" fill={ground} stroke="currentColor" strokeWidth="1.3"/>
        <text x="294" y="46" textAnchor="middle" className="art-label">CATECHISM</text>
        <path d="M226 54H362" stroke="currentColor" opacity=".3"/>
        <text x="226" y="82" className="quiz-q">Q.</text>
        <g stroke="currentColor" opacity=".45"><path d="M250 72H362"/><path d="M250 82H336"/></g>
        <text x="226" y="122" className="quiz-q">A.</text>
        <g stroke="currentColor" opacity=".7"><path d="M250 112H362"/><path d="M250 122H356"/><path d="M250 132H364"/><path d="M250 142H318"/></g>
        <path d="M226 160H362" stroke="currentColor" opacity=".2"/>
        <g stroke="currentColor"><circle cx="236" cy="181" r="9" fill="currentColor" fillOpacity=".12"/><path d="M236 175V187M231 179.5H241" strokeWidth="1.2"/></g>
        <g stroke="currentColor" opacity=".4"><path d="M254 177H330"/><path d="M254 186H306"/></g>
      </g>
    </g>
    <Lead d="M108 77H204" ring={[108, 77]} label="ASK" at={[76, 63]}/>
    <Lead d="M384 122H462" ring={[462, 122]} label="ANSWER" at={[434, 108]}/>
    <Lead d="M294 212V226" ring={[294, 229]} label="PROVE" at={[294, 249]} anchor="middle"/>
  </svg>;
}

/** 3, the open Bible: the question on the left page, threaded across to the verse it asks about, lit on the right. */
export function OpenBibleArt() {
  const lines = [86, 98, 110, 134, 146, 158, 170];
  return <svg viewBox="0 0 580 250" fill="none">
    <ellipse cx="290" cy="132" rx="215" ry="88" stroke="currentColor" opacity=".08"/>
    <path d="M88 212H492" stroke="currentColor" opacity=".18"/>
    <g className="quiz-cards">
      <path d="M146 76Q218 58 290 74Q362 58 434 76V206Q362 190 290 204Q218 190 146 206Z" fill={ground} stroke="currentColor" opacity=".35" transform="translate(0 6)"/>
      <g className="quiz-front">
        <path d="M150 72Q220 54 290 70V200Q220 184 150 202Z" fill={ground} stroke="currentColor" strokeWidth="1.3"/>
        <path d="M290 70Q360 54 430 72V202Q360 184 290 200Z" fill={ground} stroke="currentColor" strokeWidth="1.3"/>
        <text x="172" y="124" className="quiz-mark">?</text>
        <g stroke="currentColor" opacity=".45"><path d="M210 96H272"/><path d="M210 106H262"/><path d="M210 116H268"/></g>
        <g stroke="currentColor" opacity=".25"><path d="M172 150H272"/><path d="M172 162H266"/><path d="M172 174H252"/></g>
        <g stroke="currentColor" opacity=".3">{lines.map((y) => <path key={y} d={`M306 ${y}H414`}/>)}</g>
        <rect x="302" y="116" width="116" height="12" rx="2" fill="currentColor" fillOpacity=".14"/>
        <path d="M306 122H414" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M206 128C236 150 262 106 300 122" stroke="currentColor" strokeDasharray="3 4" opacity=".8"/>
        <circle cx="300" cy="122" r="2.5" fill="currentColor"/>
      </g>
    </g>
    <Lead d="M220 214V226" ring={[220, 229]} label="THE QUESTION" at={[220, 249]} anchor="middle"/>
    <Lead d="M360 214V226" ring={[360, 229]} label="THE VERSE" at={[360, 249]} anchor="middle"/>
  </svg>;
}

/** 4, the board: twelve question tiles; three answered, one lifted as it is opened. */
export function BoardArt() {
  const answered = new Set([1, 7, 8]), lifted = 5;
  const tiles = Array.from({ length: 12 }, (_, i) => ({ i, x: 171 + (i % 4) * 62, y: 44 + Math.floor(i / 4) * 50 }));
  const tile = ({ i, x, y }: (typeof tiles)[number]) => <g key={i} className={i === lifted ? "quiz-front" : undefined} transform={i === lifted ? "translate(-5 -9)" : undefined}>
    {i === lifted && <rect x={x + 5} y={y + 9} width="52" height="40" rx="6" stroke="currentColor" opacity=".25"/>}
    <rect x={x} y={y} width="52" height="40" rx="6" fill={answered.has(i) ? "currentColor" : ground} fillOpacity={answered.has(i) ? .1 : 1}
      stroke="currentColor" strokeWidth={i === lifted ? 1.4 : 1} opacity={i === lifted || answered.has(i) ? 1 : .45}/>
    {answered.has(i) ? <path d={`M${x + 20} ${y + 20}l4.5 4.5 8-9`} stroke="currentColor" strokeWidth="1.4"/>
      : <text x={x + 26} y={y + 26} textAnchor="middle" className="quiz-tile-mark" opacity={i === lifted ? 1 : .55}>?</text>}
  </g>;
  return <svg viewBox="0 0 580 250" fill="none">
    <ellipse cx="290" cy="128" rx="215" ry="88" stroke="currentColor" opacity=".08"/>
    <path d="M88 204H492" stroke="currentColor" opacity=".18"/>
    <g className="quiz-cards">{tiles.filter((t) => t.i !== lifted).map(tile)}{tile(tiles[lifted])}</g>
    <Lead d="M106 64H166" ring={[106, 64]} label="START ANYWHERE" at={[74, 50]}/>
    <Lead d="M424 114H470" ring={[470, 114]} label="ANSWERED" at={[430, 100]}/>
    <Lead d="M294 200V226" ring={[294, 229]} label="OPEN ONE" at={[294, 249]} anchor="middle"/>
  </svg>;
}

/** 5, the open Bible and the board merged: the Bible on the left, a 2 × 2 board of tiles beside it; the tile being
 *  opened is threaded across to the verse it asks about, lit on the right-hand page (owner, 2026-10-24). */
export function BibleBoardArt() {
  const verse = [84, 96, 108, 132, 144, 156, 168, 180];
  const tiles = [{ x: 372, y: 66, mark: "lifted" }, { x: 448, y: 66, mark: "check" }, { x: 372, y: 130, mark: "check" }, { x: 448, y: 130, mark: "?" }];
  return <svg viewBox="0 0 580 250" fill="none">
    <g className="quiz-cards">
      <path d="M66 74Q133 56 200 72Q267 56 334 74V204Q267 188 200 202Q133 188 66 204Z" fill={ground} stroke="currentColor" opacity=".35" transform="translate(0 5)"/>
      <path d="M70 72Q135 54 200 68V198Q135 182 70 200Z" fill={ground} stroke="currentColor" strokeWidth="1.3"/>
      <path d="M200 68Q265 54 330 72V200Q265 182 200 198Z" fill={ground} stroke="currentColor" strokeWidth="1.3"/>
      <text x="88" y="120" className="quiz-mark">?</text>
      <g stroke="currentColor" opacity=".45"><path d="M124 92H184"/><path d="M124 102H176"/><path d="M124 112H182"/></g>
      <g stroke="currentColor" opacity=".25"><path d="M88 146H184"/><path d="M88 158H178"/><path d="M88 170H164"/></g>
      <g stroke="currentColor" opacity=".3">{verse.map((y) => <path key={y} d={`M214 ${y}H318`}/>)}</g>
      <rect x="210" y="114" width="112" height="12" rx="2" fill="currentColor" fillOpacity=".14"/>
      <path d="M214 120H318" stroke="currentColor" strokeWidth="1.3"/>
      {tiles.map(({ x, y, mark }) => {
        const lifted = mark === "lifted", done = mark === "check";
        return <g key={`${x}-${y}`} className={lifted ? "quiz-front" : undefined} transform={lifted ? "translate(-5 -8)" : undefined}>
          {lifted && <rect x={x + 5} y={y + 8} width="64" height="52" rx="7" stroke="currentColor" opacity=".25"/>}
          <rect x={x} y={y} width="64" height="52" rx="7" fill={done ? "currentColor" : ground} fillOpacity={done ? .1 : 1} stroke="currentColor" strokeWidth={lifted ? 1.4 : 1} opacity={lifted || done ? 1 : .45}/>
          {done ? <path d={`M${x + 25} ${y + 26}l5 5 9-10`} stroke="currentColor" strokeWidth="1.4"/>
            : <text x={x + 32} y={y + 33} textAnchor="middle" className="quiz-tile-mark" opacity={lifted ? 1 : .55}>?</text>}
        </g>;
      })}
      <path d="M367 84C344 84 346 120 324 120" stroke="currentColor" strokeDasharray="3 4" opacity=".8"/>
      <circle cx="322" cy="120" r="2.5" fill="currentColor"/>
    </g>
    <Lead d="M265 201V226" ring={[265, 229]} label="THE VERSE" at={[265, 249]} anchor="middle" stretch={25}/>
    <Lead d="M442 184V226" ring={[442, 229]} label="THE QUESTIONS" at={[442, 249]} anchor="middle" stretch={42}/>
    <Lead d="M136 201V226" ring={[136, 229]} label="ASK" at={[136, 249]} anchor="middle" stretch={25}/>
  </svg>;
}
