// The drawings for Faith under pressure, all in one hand: one thin stroke, round caps, a faint wash, the Epistles gold as
// the study's colour, slow loops. Nothing here shows a storm clearing or a summit reached: the study promises neither. Fixed
// strings written here, never built from data. Illustrative only.
window.FPArt = (() => {
  const scene = (body) => `<svg viewBox="0 0 320 130" aria-hidden="true">${body}</svg>`;
  const stars = `<path class="sk-star" d="M26 22h8m-4-4v8"/><path class="sk-star sk-star-2" d="M292 16h8m-4-4v8"/><path class="sk-star sk-star-3" d="M268 44h6m-3-3v6"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="ms-orbit" cx="210" cy="170" rx="196" ry="128"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="210" cy="170" rx="160" ry="150" transform="rotate(-18 210 170)"/>
      <circle class="fp-halo" cx="210" cy="168" r="118"/>
      <g class="fp-wind"><path d="M40 92c30-10 52 8 84-2"/><path d="M28 132c24-8 40 4 62 0"/><path d="M300 76c28-8 50 6 82-2"/><path d="M332 118c20-6 34 4 56 0"/></g>
      <circle class="fp-glow" cx="210" cy="166" r="44"/>
      <g class="fp-lamp"><path class="fp-gold fp-flame" d="M210 134c10 14 14 22 14 30a14 14 0 0 1-28 0c0-8 4-16 14-30Z"/>
        <path class="fp-gold" d="M210 152c4 6 6 10 6 13a6 6 0 0 1-12 0c0-3 2-7 6-13Z"/>
        <path d="M190 190h40l-6 14h-28Z"/><path d="M204 204v6h12v-6"/></g>
      <path class="fp-hand" d="M138 250c-18-40-22-84-6-118 5-10 16-7 16 4l-2 44 10-58c2-11 17-10 17 2l-4 58 12-46c3-11 17-8 16 4l-10 70c-2 16-10 34-18 40"/>
      <path class="fp-hand" d="M282 250c18-40 22-84 6-118-5-10-16-7-16 4l2 44-10-58c-2-11-17-10-17 2l4 58-12-46c-3-11-17-8-16 4l10 70c2 16 10 34 18 40"/>
      <path class="fp-faint" d="M120 274H300M150 284H270"/>
      <path class="ms-mark fp-spark" d="M42 56h10m-5-5v10M372 252h10m-5-5v10M360 46h8m-4-4v8"/>
    </svg>`,
    cards: {
      // One tree on a hill in the wind, its roots going down further than its branches go up.
      trials: scene(`${stars}<path d="M0 92c60-8 110-22 160-22s100 14 160 22"/><path class="sk-faint" d="M0 118c80-6 240-6 320 0"/>
        <g class="sk-wind"><path d="M18 40c24-8 42 6 70-2"/><path d="M8 62c20-6 34 3 52 0"/><path d="M226 34c26-8 44 5 76-2"/><path d="M252 56c18-5 30 3 50 0"/></g>
        <g><path class="sk-gold" d="M160 70V30"/><path class="sk-gold" d="M160 56c-12-4-22-14-26-26M160 46c10-4 20-12 26-24M160 38c-5-6-9-14-9-22M160 34c6-5 10-12 11-20"/>
          <path class="sk-wash-gold" d="M126 34c6-16 22-26 34-26s30 8 36 24c-10 12-24 20-36 20s-26-6-34-18Z"/></g>
        <path d="M160 70c-2 10-12 20-30 28M160 70c2 12 8 26 4 42M160 70c4 10 16 18 34 26M146 86c-10 2-18 8-24 16M176 86c8 4 14 12 18 20M161 92c-6 8-10 16-10 24"/>`),
      // A road that bends away toward a cliff edge, and a dotted way out through a door in the rock.
      temptation: scene(`<path class="sk-star" d="M26 22h8m-4-4v8"/><path class="sk-star sk-star-2" d="M150 12h8m-4-4v8"/><path d="M0 120H320"/>
        <path class="sk-wash" d="M226 120V46l60-20 34 8v86Z"/><path d="M226 120V46l60-20 34 8"/>
        <path d="M0 110c60-2 100-8 130-30 14-10 30-30 60-46"/><path d="M0 120c70-2 124-10 158-36 16-12 34-28 60-42"/>
        <path class="sk-faint" d="M190 34l8-8M204 42l8-8"/>
        <path class="sk-path" d="M120 104c30-6 66-8 112-6"/>
        <path class="sk-glow" d="M242 120V88a14 14 0 0 1 28 0v32Z"/><path class="sk-gold" d="M242 120V88a14 14 0 0 1 28 0v32"/>
        <circle cx="100" cy="86" r="5"/><path d="M100 91v12M100 95l-7 5M100 95l7 5M100 103l-5 12M100 103l5 12"/>
        <path class="sk-gold" d="M234 96h-10M228 92l-4 4 4 4"/>`),
      // Two open hands lifted, a small lamp set between them, what is carried rising away.
      anxiety: scene(`${stars}<path class="sk-faint" d="M60 124H260"/>
        <path d="M70 122c-12-22-14-44-6-60 3-6 9-4 9 2l-1 22 6-30c1-6 9-5 9 1l-2 30 6-24c2-6 9-4 8 2l-5 36c-1 8-5 16-9 21"/>
        <path d="M250 122c12-22 14-44 6-60-3-6-9-4-9 2l1 22-6-30c-1-6-9-5-9 1l2 30-6-24c-2-6-9-4-8 2l5 36c1 8 5 16 9 21"/>
        <circle class="sk-glow" cx="160" cy="76" r="24"/>
        <path class="sk-gold" d="M160 58c7 9 9 14 9 19a9 9 0 0 1-18 0c0-5 2-10 9-19Z"/><path class="sk-wash-gold" d="M160 58c7 9 9 14 9 19a9 9 0 0 1-18 0c0-5 2-10 9-19Z"/>
        <path d="M146 92h28l-4 9h-20ZM155 101v4h10v-4"/>
        <path class="sk-rise" d="M140 46c-5-8 5-12 0-20"/><path class="sk-rise sk-rise-2" d="M160 40c-5-8 5-12 0-20"/><path class="sk-rise sk-rise-3" d="M180 46c-5-8 5-12 0-20"/>`),
      // A small lamp and one person standing, with thrown words as dashes and a high wall on each side.
      opposition: scene(`${stars}<path d="M0 120H320"/>
        <path class="sk-wash" d="M14 120V50l26-8 26 8v70Z"/><path d="M14 120V50l26-8 26 8v70M14 70h52M14 94h52M40 50v20M28 70v24M52 70v24M40 94v26"/>
        <path class="sk-wash" d="M254 120V50l26-8 26 8v70Z"/><path d="M254 120V50l26-8 26 8v70M254 70h52M254 94h52M280 50v20M268 70v24M292 70v24M280 94v26"/>
        <g class="sk-wind"><path d="M72 48h40M76 62h28M216 42h34M222 58h26"/></g>
        <circle class="sk-gold" cx="160" cy="64" r="6"/><path class="sk-gold" d="M160 70v22M160 76l-11 8M160 76l11 8M160 92l-7 26M160 92l7 26"/>
        <circle class="sk-glow" cx="186" cy="84" r="16"/>
        <path class="sk-gold" d="M186 72c5 6 6 10 6 13a6 6 0 0 1-12 0c0-3 1-7 6-13Z"/><path d="M178 94h16l-2 5h-12Z"/><path class="sk-gold" d="M171 84l7 8"/>`),
      // Two people side by side at a grave at evening, one with a hand on the other, stars coming out.
      grief: scene(`${stars}<path class="sk-star sk-star-2" d="M70 30h6m-3-3v6"/><path class="sk-star sk-star-3" d="M150 14h6m-3-3v6"/><path class="sk-star" d="M214 26h6m-3-3v6"/>
        <path d="M0 120H320"/><path class="sk-faint" d="M0 104c70-10 130-12 190-6s90 6 130-2"/>
        <path class="sk-wash" d="M192 120c4-14 18-22 42-22s38 8 42 22Z"/><path d="M192 120c4-14 18-22 42-22s38 8 42 22"/>
        <path class="sk-faint" d="M208 120c2-3 4-5 6-6M254 120c-2-3-4-5-6-6M234 110c-2 3-2 6 0 10"/>
        <circle cx="104" cy="64" r="6"/><path d="M104 70c-8 3-10 12-10 20v14h18l3 16M94 104v16"/>
        <circle class="sk-gold" cx="140" cy="60" r="6"/><path class="sk-gold" d="M140 66c8 3 10 12 10 22v16h-18l-3 16M150 104v16"/>
        <path class="sk-gold" d="M133 76c-6 0-14 0-20 2"/>
        <path class="sk-path" d="M154 88c14-4 28-4 44 2"/>`),
      // A plain bowl with a little in it, an open hand, a jar, a few loaves.
      contentment: scene(`${stars}<path d="M0 120H320"/>
        <path class="sk-wash" d="M34 120c-8-12-8-40 0-52h44c8 12 8 40 0 52Z"/><path d="M34 120c-8-12-8-40 0-52h44c8 12 8 40 0 52ZM38 68V58h36v10M34 58h44"/><path class="sk-faint" d="M31 84h50"/>
        <path class="sk-gold" d="M112 88h96c0 18-18 30-48 30s-48-12-48-30Z"/><path class="sk-wash-gold" d="M112 88h96c0 18-18 30-48 30s-48-12-48-30Z"/><path class="sk-gold" d="M146 120h28"/>
        <path class="sk-gold" d="M130 88c0-10 10-15 20-15s20 5 20 15M158 88c0-8 8-12 16-12s16 4 16 12"/><path class="sk-gold" d="M138 80c3-2 7-2 10 0M172 82c3-2 6-2 9 0"/>
        <circle class="sk-glow" cx="160" cy="84" r="22"/>
        <path d="M304 74c-16-6-30-6-44 0l-16 8c-6 4-2 11 5 9l16-3 20 2 19 8"/><path class="sk-faint" d="M250 96c10 4 18 4 28 2"/>
        <path class="sk-rise" d="M150 62c-4-6 4-9 0-14"/><path class="sk-rise sk-rise-2" d="M170 60c-4-6 4-9 0-14"/>`),
    },
    land: `<svg viewBox="0 0 1200 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g class="fp-sky"><circle cx="90" cy="30" r="1"/><circle cx="240" cy="16" r="1"/><circle cx="410" cy="38" r="1"/><circle cx="560" cy="14" r="1"/><circle cx="720" cy="34" r="1"/><circle cx="880" cy="20" r="1"/><circle cx="1060" cy="36" r="1"/></g>
      <path d="M0 132c120-44 220-52 340-22s190 28 300-8 240-52 360-14 140 34 200 22"/>
      <path class="fp-faint" d="M0 152c180-24 320-22 480-6s320 10 720-20"/>
      <path d="M0 165H1200"/>
      <path d="M560 165V124l42-28 42 28v41M586 165v-24h22v24"/>
      <path class="fp-gold fp-window" d="M618 132h14v14h-14Z"/>
      <path class="fp-faint" d="M150 120v-30M150 98c-10-2-14-8-14-14 8 0 14 4 14 10 0-8 6-14 14-14 0 8-6 16-14 18"/>
      <path class="fp-faint" d="M980 110V82M980 90c-9-2-13-7-13-13 7 0 13 4 13 9 0-7 6-13 13-13 0 8-5 15-13 17"/>
      <path class="fp-gold fp-road" d="M20 160H540M664 160H1180" stroke-dasharray="3 9"/>
    </svg>`,
  };
})();
