import './parables-card.css';

/** Original engraved vignettes: growth, discovery and welcome. */
export function ParablesPreview() {
  return <div className="study-parables-art" aria-hidden="true">
    <svg viewBox="0 0 540 260" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <defs><radialGradient id="parable-card-light"><stop stopColor="currentColor" stopOpacity=".12"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs>
      <ellipse cx="270" cy="132" rx="258" ry="124" fill="url(#parable-card-light)" stroke="none"/>
      <path d="M24 203Q127 173 232 194T516 179M31 213Q135 186 252 205T509 194" opacity=".16"/>
      <path d="M159 128H211M328 128H377" strokeDasharray="2 7" opacity=".35"/>
      <g strokeWidth="1.2">
        <path d="M36 182V91a64 64 0 0 1 128 0v91M43 180V93a57 57 0 0 1 114 0v87" opacity=".18"/>
        <path d="M100 181V71M100 145Q66 144 66 113Q95 113 100 145ZM100 119Q129 117 130 87Q103 88 100 119ZM100 97Q77 93 79 70Q98 74 100 97Z" fill="currentColor" fillOpacity=".05"/>
        <path d="M82 173Q71 153 55 152M119 179Q123 156 142 145M58 188Q96 177 140 189" opacity=".5"/>
        <path d="M75 126l18 13M120 98l-15 15M86 80l10 12" opacity=".35"/>
        <ellipse cx="77" cy="192" rx="3" ry="1.5" transform="rotate(-30 77 192)"/><ellipse cx="113" cy="196" rx="3" ry="1.5" transform="rotate(25 113 196)"/>
        <path d="M248 169q-25-19-34-48l25-16 13 8 18-20 18 20 13-8 25 16q-9 29-34 48Z" fill="currentColor" fillOpacity=".04"/>
        <path d="M218 123l37 42m-16-55 23 52m8-63v61m30-50-23 52m45-39-37 42" opacity=".35"/>
        <path d="M248 170q22 16 44 0M238 185q32 9 64 0" opacity=".6"/>
        <circle cx="270" cy="149" r="18" fill="var(--surface)"/><circle cx="270" cy="149" r="13" opacity=".18"/><path d="M260 146q1-8 8-9" strokeWidth="2" opacity=".65"/>
        <path d="M270 54v14m-7-7h14M229 80l4 6m74-6-4 6" opacity=".5"/>
        <path d="M389 185V101a50 50 0 0 1 100 0v84M401 185v-82a38 38 0 0 1 76 0v82"/>
        <path d="M401 185V103q0-34 38-38v108Z" fill="currentColor" fillOpacity=".08"/>
        <path d="M412 164v-59q0-19 17-25v75ZM381 186h117m-105 8h93m-83 8h70M440 176q-17 22-16 40" opacity=".4"/>
        <circle cx="429" cy="128" r="2" fill="currentColor" stroke="none"/>
        <path d="M450 101h16m-16 7h16m-16 7h16" opacity=".16"/>
        <path d="M382 148h-9m118-24h11m-6 39h12M405 59l-5-9m39-7V31m32 27 6-9" opacity=".3"/>
      </g>
      <g stroke="none" fill="currentColor" textAnchor="middle" fontSize="10" letterSpacing="2.5"><text x="100" y="237">A SEED</text><text x="270" y="237">A TREASURE</text><text x="440" y="237">AN OPEN DOOR</text></g>
    </svg>
  </div>;
}
