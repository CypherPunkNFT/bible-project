// Our own line art for the Learning division: one drawing per audience (120 x 80, strokes only), plus small glyphs
// for the kinds of material and the subject tracks (24 x 24). Parts with a class starting "mv-" move on a slow loop
// (shared/learn.css); the ticker (shared/ticker.js) can slow, pause and step them.
(() => {
  const ground = (x1 = 8, x2 = 112, y = 72) => `<path d="M${x1} ${y} H${x2}" opacity=".55"/>`;
  const AUD = {
    // Little ones: a small cupped hand holding a sprout that sways.
    hand: `${ground()}
      <path d="M26 58 C34 64 52 67 70 64 C80 62 88 58 92 52"/>
      <path d="M92 52 C95 48 94 44 90 44 C87 44 85 47 83 50"/>
      <path d="M83 50 C86 46 86 41 82 41 C79 41 77 44 75 48"/>
      <path d="M75 48 C77 44 76 40 72 40.5 C69 41 68 44 67 48"/>
      <path d="M67 48 C68 45 67 42 64 42.5 C61 43 60 46 60 50"/>
      <path d="M26 58 C30 54 36 52 44 52 C50 52 55 51 60 50"/>
      <path d="M26 58 C20 58 14 56 6 56" /><path d="M36 64 C26 66 16 66 8 64" />
      <path d="M44 52 C40 47 34 46 31 48" opacity=".7"/>
      <path d="M40 60 C50 62 62 62 72 59" opacity=".35"/>
      <ellipse cx="58" cy="52.5" rx="5" ry="1.6" opacity=".6"/>
      <g class="mv-sway" style="transform-origin:58px 52px">
        <path d="M58 52 C58 44 57 36 59 28"/>
        <path d="M58.4 40 C52 40 47 36 46 30 C52 30 57 34 58.4 40 Z"/>
        <path d="M58.6 34 C64 33 69 28 70 22 C64 23 59 28 58.6 34 Z"/>
        <path d="M58.4 40 L51 34.5" opacity=".5"/><path d="M58.6 34 L66 26" opacity=".5"/>
        <path d="M59 28 C59 25 60 23 61 22" />
      </g>
      <g class="mv-drift" opacity=".7"><circle cx="78" cy="20" r=".9"/><circle cx="40" cy="22" r=".7"/><circle cx="86" cy="30" r=".6"/></g>`,
    // Children: a backpack with a pencil and a rolled page, and a swinging name tag.
    backpack: `${ground()}
      <path d="M40 72 V36 C40 26 48 20 60 20 C72 20 80 26 80 36 V72 Z"/>
      <path d="M52 20 C52 13 68 13 68 20"/>
      <path d="M44 50 H76 V66 C76 69 74 70 72 70 H48 C46 70 44 69 44 66 Z"/>
      <path d="M44 56 H76" opacity=".6"/><path d="M58 53.5 h4" />
      <path d="M48 28 C52 25 68 25 72 28" opacity=".5"/>
      <path d="M40 40 C34 42 33 56 36 68" opacity=".6"/><path d="M80 40 C86 42 87 56 84 68" opacity=".6"/>
      <path d="M66 22 L71 6 L73.4 6.8 L68.4 22.6"/><path d="M71 6 L72.6 3 L73.4 6.8" />
      <path d="M50 22 C48 15 50 10 55 9 C58 9 59 12 57 14 C55 16 53 14 54 12" />
      <g class="mv-swing" style="transform-origin:76px 36px">
        <path d="M76 36 L80 46"/><rect x="77" y="46" width="9" height="6" rx="1" transform="rotate(-18 81 49)"/>
      </g>
      <path d="M22 72 C22 66 26 63 30 63 C34 63 36 67 36 72" opacity=".45"/>
      <path d="M90 72 l4 -8 l4 8" opacity=".45"/><path d="M96 72 l3 -5 l3 5" opacity=".45"/>`,
    // Teens: a compass; the needle searches and settles.
    compass: `${ground()}
      <circle cx="60" cy="42" r="24"/><circle cx="60" cy="42" r="20.5" opacity=".55"/>
      <path d="M60 15 V12 M60 69 v3 M33 42 h-3 M87 42 h3"/>
      ${Array.from({ length: 24 }, (_, i) => { const a = (i * Math.PI) / 12, r1 = i % 6 ? 19 : 17, r2 = 20.5;
        return `<path d="M${(60 + Math.sin(a) * r1).toFixed(2)} ${(42 - Math.cos(a) * r1).toFixed(2)} L${(60 + Math.sin(a) * r2).toFixed(2)} ${(42 - Math.cos(a) * r2).toFixed(2)}" opacity=".6"/>`; }).join("")}
      <path d="M57.5 5 L60 9 L62.5 5" />
      <g class="mv-needle" style="transform-origin:60px 42px">
        <path d="M60 25 L64 42 L60 59 L56 42 Z"/><path d="M60 25 L64 42 L56 42 Z" fill="currentColor" opacity=".18"/>
      </g>
      <circle cx="60" cy="42" r="1.6"/>
      <path d="M10 72 C18 70 22 66 30 66" opacity=".4"/><path d="M90 66 C98 66 102 70 110 72" opacity=".4"/>`,
    // Young adults: a clay lamp whose flame lights the path ahead (Psalm 119:105).
    lamp: `${ground(8, 112, 64)}
      <path d="M36 50 C36 44 44 41 54 41 C64 41 72 44 72 50 C72 56 64 59 54 59 C44 59 36 56 36 50 Z"/>
      <ellipse cx="54" cy="44.5" rx="11" ry="2.8"/><circle cx="54" cy="44.5" r="1.4"/>
      <path d="M70 46 L88 44.5 C92 44.3 93 48.5 90 50 L70 54" />
      <circle cx="30" cy="48" r="5.5"/><path d="M35 46.5 L37.5 47.5 M35 50 L37 51" />
      <path d="M46 59 C47 62 61 62 62 59" opacity=".7"/><path d="M44 52 C50 55 60 55 66 52" opacity=".35"/>
      <g class="mv-flame" style="transform-origin:90px 45px">
        <path d="M90 45 C86 40 87 34 90 27 C93 34 94 40 90 45 Z"/>
        <path d="M90 43 C88.5 40 89 37 90 34 C91 37 91.5 40 90 43 Z" opacity=".6"/>
      </g>
      <g class="mv-glow"><path d="M82 30 l-3 -3 M98 30 l3 -3 M90 22 v-4 M80 38 h-4 M100 38 h4" /></g>
      <g class="mv-steps"><path d="M80 64 C88 68 96 70 112 72" stroke-dasharray="2 4" opacity=".8"/><path d="M84 64 C92 70 100 74 108 78" stroke-dasharray="2 4" opacity=".45"/></g>`,
    // Adults: an open book, a ribbon, and a page that turns.
    book: `${ground()}
      <path d="M60 30 C50 24 34 22 18 24 V66 C34 64 50 66 60 72"/>
      <path d="M60 30 C70 24 86 22 102 24 V66 C86 64 70 66 60 72"/>
      <path d="M60 30 V72"/>
      <path d="M14 28 V70 C30 68 48 70 60 75 C72 70 90 68 106 70 V28" opacity=".45"/>
      ${[34, 40, 46, 52, 58].map((y) => `<path d="M24 ${y - 2} C34 ${y - 4} 46 ${y - 3} 54 ${y}" opacity=".45"/><path d="M66 ${y} C74 ${y - 3} 86 ${y - 4} 96 ${y - 2}" opacity=".45"/>`).join("")}
      <path d="M90 23 V38 L93 35 L96 38 V23.4" />
      <g class="mv-page" style="transform-origin:60px 50px"><path d="M60 30 C68 26 80 24 92 25 C90 38 90 54 92 66 C80 65 68 66 60 72"/></g>`,
    // Families: a house with a lit window, a table seen through the door, and smoke on the wind.
    house: `${ground()}
      <path d="M28 72 V40 L60 16 L92 40 V72"/><path d="M22 44 L60 14 L98 44"/>
      <path d="M76 26 V16 H83 V31"/>
      <path d="M52 72 V52 C52 48 56 46 60 46 C64 46 68 48 68 52 V72"/>
      <rect x="35" y="48" width="11" height="10"/><path d="M40.5 48 v10 M35 53 h11" opacity=".6"/>
      <rect x="74" y="48" width="11" height="10"/><path d="M79.5 48 v10 M74 53 h11" opacity=".6"/>
      <rect x="75.6" y="49.6" width="7.8" height="6.8" fill="currentColor" opacity=".12" class="mv-light" stroke="none"/>
      <path d="M55 62 h10 M57 62 v8 M63 62 v8" opacity=".55"/>
      <g class="mv-smoke"><path d="M79.5 13 C77 9 82 7 79.5 3 C77 0 81 -2 80 -5" stroke-dasharray="2 3"/></g>
      <path d="M8 72 C10 66 14 64 18 64 C16 60 20 56 24 58" opacity=".45"/><path d="M104 72 C104 62 110 60 112 66" opacity=".45"/>`,
    // Leaders: a shepherd's crook and a small flock (John 21:15–17).
    staff: `${ground()}
      <path d="M38 72 V22 C38 12 50 10 52 18 C53 22 50 25 47 23"/>
      <g class="mv-graze" style="transform-origin:66px 66px">
        <path d="M56 66 C54 60 58 56 63 57 C66 53 73 54 75 58 C80 58 82 63 79 66 Z"/>
        <path d="M60 66 v5 M74 66 v5" /><path d="M57 60 C51 58 47 61 48 65 C49 68 53 68 56 66"/><path d="M51 59.5 L48 57" /><circle cx="51" cy="63" r=".5" fill="currentColor"/>
      </g>
      <path d="M84 66 C83 61 86 58 90 59 C92 56 97 57 98 60 C102 61 103 65 100 67 Z" opacity=".75"/>
      <path d="M87 67 v4 M97 67 v4" opacity=".75"/><path d="M85 62 C80 60 77 63 78 66 C79 69 82 68 84 66" opacity=".75"/><path d="M80 61 L77.5 59" opacity=".75"/>
      <path d="M14 72 C20 70 24 68 30 68" opacity=".4"/>
      <g class="mv-drift" opacity=".55"><path d="M80 22 c2 -2 4 -2 6 0 c2 -2 4 -2 6 0" /><path d="M96 30 c1.5 -1.5 3 -1.5 4.5 0 c1.5 -1.5 3 -1.5 4.5 0" /></g>`,
  };

  const GLYPH = {
    // kinds
    story: '<path d="M12 7v13"/><path d="M3 18V5c3-1 6-1 9 2 3-3 6-3 9-2v13c-3-1-6-1-9 2-3-3-6-3-9-2z"/><path d="M17 2.5v2M19.5 3.5l-1.2 1.4M14.5 3.5l1.2 1.4" opacity=".7"/>',
    activity: '<rect x="3" y="4" width="13" height="17" rx="1"/><path d="M6 9c2-2 4 2 6 0M6 14h7" opacity=".7"/><path d="M21 3l-6.5 13-1.5 3 .5-3.5L20 2.2z"/>',
    cards: '<rect x="7" y="3" width="13" height="17" rx="1.5"/><path d="M4 6.5V19a2 2 0 0 0 2 2h10" opacity=".6"/><path d="M10 8h7M10 11h7M10 14h4" opacity=".7"/>',
    lesson: '<path d="M3 4h18v11H3z"/><path d="M8 20l4-5 4 5"/><path d="M6 8h7M6 11h4" opacity=".7"/>',
    workbook: '<rect x="5" y="3" width="15" height="18" rx="1"/><path d="M3 6h3M3 10h3M3 14h3M3 18h3"/><path d="M9 8h8M9 11h8M9 14h5" opacity=".7"/>',
    plan: '<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M6.5 14l1.2 1.2 2-2.2M13.5 14l1.2 1.2 2-2.2M6.5 18l1.2 1.2 2-2.2" opacity=".8"/>',
    devotional: '<path d="M3 13h18"/><path d="M5 13v7M19 13v7"/><path d="M8 13c0-3 1.8-4.5 4-4.5s4 1.5 4 4.5"/><path d="M12 8.5V6M12 6c-1-1-1-2.2 0-3.3 1 1.1 1 2.3 0 3.3z"/>',
    maps: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14" opacity=".6"/>',
    guide: '<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 2.5h6v3H9z"/><path d="M8 10l1.2 1.2L11.5 9M8 15l1.2 1.2 2.3-2.2M13.5 10h3M13.5 15h3" opacity=".8"/>',
    // tracks
    people: '<circle cx="8.5" cy="7" r="3"/><path d="M3 20c0-4 2.5-6.5 5.5-6.5S14 16 14 20"/><circle cx="16.5" cy="8.5" r="2.4" opacity=".7"/><path d="M15.5 13.6c3 .1 5.5 2.3 5.5 6.4" opacity=".7"/>',
    books: '<path d="M4 20V5h4v15M8 20V8h4v12M13 20l2.5-13 3.8.8L16.8 21"/><path d="M3 20h18"/>',
    bigstory: '<path d="M4 21c5 0 4-6 8-6s3-6 8-6"/><circle cx="4" cy="21" r="1.2" fill="currentColor"/><path d="M20 3.5l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
    jesus: '<path d="M2 12c4-6 11-6 16 0-5 6-12 6-16 0z"/><path d="M18 12l4-3.5v7z"/><circle cx="7" cy="11" r=".6" fill="currentColor"/>',
    places: '<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
    letters: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6M9 11h4" opacity=".7"/>',
    defend: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
    teachers: '<path d="M12.7 19a2 2 0 0 0 1.4-.6l6.2-6.2a6 6 0 0 0-8.5-8.5L5.6 9.9A2 2 0 0 0 5 11.3V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>',
    life: '<path d="M12 21V9"/><path d="M12 13c-4 0-7-2.5-7-7 4 0 7 2.5 7 7zM12 10c0-4 2.5-7 7-7 0 4.5-3 7-7 7z"/>',
  };
  const TRACK_GLYPH = { people: "people", books: "books", story: "bigstory", jesus: "jesus", places: "places", letters: "letters", defend: "defend", teachers: "teachers", life: "life" };

  window.ART = {
    audience(name, cls = "") {
      return `<svg class="aud-art ${cls}" viewBox="0 -8 120 88" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${AUD[name]}</svg>`;
    },
    glyph(name, size = 20, sw = 1.4) {
      return `<svg class="glyph" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[name]}</svg>`;
    },
    kind(id, size, sw) { return ART.glyph(LEARN.K[id].glyph, size, sw); },
    track(id, size, sw) { return ART.glyph(TRACK_GLYPH[id], size, sw); },
    // A cover in the house design (the Moses cover): the real image when ready, an outline marked Planned when not.
    cover(it, cls = "") {
      if (it.status === "ready") return `<img class="cover-img ${cls}" src="shared/pages/p01.png" alt="Cover of ${Frame.esc(it.title)}">`;
      const [name, rest] = it.title.includes(":") ? it.title.split(/:\s*/) : [it.title, ""];
      const a = LEARN.A[it.audience];
      return `<div class="sketch ${cls}" style="--tone: var(${a.tone})" role="img" aria-label="Planned: ${Frame.esc(it.title)}"><span class="k">${LEARN.K[it.kind].name}</span>
        <span><span class="n">${Frame.esc(name)}</span>${rest ? `<span class="s" style="display:block">${Frame.esc(rest)}</span>` : ""}</span>
        <span class="ico">${ART.track(it.track, 30, 1.1)}</span><span class="p">Planned</span></div>`;
    },
    moses(name, cls = "") {
      return `<svg class="moses-art ${cls}" viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MOSES_ART[name]}</svg>`;
    },
  };
})();
