import './creeds-card.css';

/** Original engraved vignettes in the Parables card's manner: the faith spoken (the Shema scroll), confessed (a council
 * church) and taught (an open catechism). The dotted thread drifts left to right and each scene inks in turn, slowly. */
export function CreedsPreview() {
  return <div className="study-creeds-art" aria-hidden="true">
    <svg viewBox="0 0 540 260" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 206Q140 186 270 200T516 190M34 214Q150 196 270 209T506 200" opacity=".16"/>
      <path className="creeds-thread" d="M150 146H220M320 146H390" strokeDasharray="2 7" opacity=".4"/>
      <g strokeWidth="1.2">
        <g className="creeds-scene">
          <path d="M36 186V95a64 64 0 0 1 128 0v91M43 184V97a57 57 0 0 1 114 0v87" opacity=".18"/>
          <path d="M74 106Q100 101 126 106V176Q100 171 74 176Z" fill="currentColor" fillOpacity=".05"/>
          <path d="M62 104h12v74H62ZM126 104h12v74h-12Z" fill="var(--surface)"/>
          <path d="M68 104V94m0 94v-10M132 104V94m0 94v-10M64 94h8m-8 94h8m56-94h8m-8 94h8M65 112h6m-6 58h6m58-58h6m-6 58h6" opacity=".55"/>
          <path d="M120 116H90" strokeWidth="2.2" opacity=".75"/>
          <path d="M120 127H82m38 8H86m34 8H80m40 8H92m28 8H84m36 8H98" opacity=".38"/>
        </g>
        <g className="creeds-scene">
          <path d="M270 52v14m-7-7h14M246 70l-5-5m53 5 5-5" opacity=".45"/>
          <path d="M270 74v-6M246 106a24 24 0 0 1 48 0" fill="currentColor" fillOpacity=".04"/>
          <path d="M256 99v-4m14 2v-6m14 8v-4" opacity=".4"/>
          <path d="M224 128L270 106L316 128Z" fill="var(--surface)"/>
          <path d="M262 122h16" opacity=".4"/>
          <path d="M226 134H314M224 128H316"/>
          <path d="M236 182V134m18 48V134m32 48V134m18 48V134M231 138h10m8 0h10m22 0h10m8 0h10M231 178h10m8 0h10m22 0h10m8 0h10" opacity=".7"/>
          <path d="M262 182V162a8 8 0 0 1 16 0v20Z" fill="currentColor" fillOpacity=".08"/>
          <path d="M220 186H320M214 193H326" opacity=".6"/>
        </g>
        <g className="creeds-scene">
          <path d="M389 186V102a51 51 0 0 1 102 0v84M401 186v-83a39 39 0 0 1 78 0v83" opacity=".18"/>
          <path d="M440 128Q416 118 394 124V170Q416 164 440 174Q464 164 486 170V124Q464 118 440 128Z" fill="var(--surface)"/>
          <path d="M440 128V174M394 170v5Q416 169 440 179Q464 169 486 175v-5" opacity=".7"/>
          <path d="M417 138h17m-34 9h34m-34 8h30m-30 8h24M465 138h15m-32 9h32m-32 8h28m-28 8h22" opacity=".35"/>
          <path d="M444 176q3 10-1 20" opacity=".5"/>
          <path d="M408 102l-5-8m37-4V80m32 22 5-8" opacity=".3"/>
        </g>
      </g>
      <g className="creeds-letter" stroke="none" fill="currentColor"><text x="404" y="141">Q.</text><text x="452" y="141">A.</text></g>
      <g className="creeds-label" stroke="none" fill="currentColor"><text x="100" y="236">HEAR, O ISRAEL</text><text x="270" y="236">WE BELIEVE</text><text x="440" y="236">QUESTION &amp; ANSWER</text></g>
      <g className="creeds-source" stroke="none" fill="currentColor"><text x="100" y="251">THE SHEMA</text><text x="270" y="251">NICENE CREED · 381</text><text x="440" y="251">WESTMINSTER · 1647</text></g>
    </svg>
  </div>;
}
