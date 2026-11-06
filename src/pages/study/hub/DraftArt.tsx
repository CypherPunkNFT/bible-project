// The draft icon: the artwork on every card for a study whose text is written and whose page is not built yet.
// A line drawing in the same hand as the Academic cards' drawings (360 × 180, one stroke weight, the card's colour):
// a written sheet whose last lines are still dashed, a pencil resting at the unfinished line, a sheet behind it, and a
// small "Draft" tag. Used on the Scripture & Theology and Academic hubs alike, so a draft looks the same on both.
import "./academic-cards.css";

export const DRAFT_CAPTION = "Written · Page to come";

const WRITTEN_LINES = [58, 68, 78, 88, 98, 108, 118];
const LINE_WIDTHS = [86, 80, 88, 72, 84, 78, 64];

export function DraftArtwork({ caption = DRAFT_CAPTION }: { caption?: string }) {
  return <div className="study-art academic-card-art draft-card-art" aria-hidden="true">
    <svg viewBox="0 0 360 180" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="180" cy="158" rx="112" ry="10" opacity=".08" />
      <g className="academic-art-object">
        <g transform="rotate(-7 180 92)" opacity=".4">
          <path d="M122 30h112v128H122Z" fill="currentColor" fillOpacity=".04" />
        </g>
        <path d="M130 24h96l18 18v118H130Z" fill="var(--surface)" />
        <path d="M226 24v18h18" opacity=".55" />
        <path d="M142 42h50" strokeWidth="2.2" />
        {WRITTEN_LINES.map((y, i) => <path key={y} d={`M142 ${y}h${LINE_WIDTHS[i]}`} opacity={i % 3 === 0 ? .75 : .4} />)}
        <path d="M150 88h40" strokeWidth="1" opacity=".9" />
        <path d="m196 93 4-5 4 5M200 88v-8m-5 0h10" opacity=".7" />
        <path d="M142 128h74" strokeDasharray="3 5" opacity=".55" />
        <path d="M142 138h44" strokeDasharray="3 5" opacity=".4" />
        <g transform="rotate(-50 205 128)">
          <path d="M205 122h62v12h-62Z" fill="var(--surface)" />
          <path d="M255 122v12m5-12v12" opacity=".55" />
          <path d="M267 122h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7" fill="currentColor" fillOpacity=".12" />
          <path d="m205 122-14 6 14 6Z" fill="var(--surface)" />
          <path d="m196 126-5 2 5 2Z" fill="currentColor" />
          <path d="M205 128h50" opacity=".25" />
        </g>
        <g transform="rotate(-8 108 128)">
          <rect x="84" y="119" width="50" height="17" rx="3" fill="var(--surface)" />
          {/* Inline style, because the cards' stylesheet sets every card drawing's text to 12px serif. */}
          <text x="109" y="131" fill="currentColor" stroke="none" style={{ fontSize: "8.5px", letterSpacing: "2.2px", fontFamily: "var(--font-sans, system-ui)" }}>DRAFT</text>
        </g>
      </g>
    </svg>
    <span className="study-art-note">{caption}</span>
  </div>;
}
