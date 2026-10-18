// Drawings for the Old maps mock-ups. The eight Atlas card drawings are copied from the site's PlacesArtwork.tsx
// (decorative, not maps) so the Atlas home excerpt looks like the real one; the ninth, "Old maps", is new: a map sheet
// with a sea, a compass rose and rhumb lines, a ship, the Jordan with its two lakes, a walled city, a cartouche and a
// scale bar. Its compass rose turns slowly back and forth and the ship rides the swell, on a loop.
window.Art = (() => {
  const W = (inner, cls = "") => `<svg class="places-artwork ${cls}" viewBox="0 0 480 185" fill="none" aria-hidden="true" focusable="false">${inner}</svg>`;
  const dots = (list, fn) => list.map(fn).join("");

  const CARDS = {
    atlas: () => W(`<g stroke="currentColor" opacity=".1"><path d="M30 42H450M30 91H450M30 140H450M96 15V175M192 15V175M288 15V175M384 15V175"/><ellipse cx="240" cy="95" rx="195" ry="73"/><ellipse cx="240" cy="95" rx="155" ry="53"/></g>
      <path d="M58 22L152 18 184 34 198 28 232 41 260 32 292 45 316 41 343 62 374 59 411 81 413 139 381 169 306 163 278 151 238 148 196 156 158 149 132 159 76 139 54 112 79 95 106 100 129 91 141 104 161 109 183 105 198 121 237 126 275 118 304 129 337 115 343 92 319 80 295 83 277 70 252 75 230 63 205 74 183 65 171 71 145 56 104 62 82 49Z" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-opacity=".5"/>
      <g stroke="currentColor" stroke-width="1.5">${dots([[106, 55], [165, 69], [218, 64], [284, 78], [337, 96], [324, 129], [374, 145]], ([x, y], i) => `<g><circle cx="${x}" cy="${y}" r="${i === 4 ? 13 : 8}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${i === 4 ? 5 : 3}" fill="currentColor"/></g>`)}</g>
      <path d="M346 94H395M324 134V156H281" stroke="currentColor" opacity=".6"/><g fill="currentColor" font-size="8" letter-spacing="2"><text x="399" y="96">E</text><text x="239" y="159">EXPLORE</text></g>`),
    journeys: () => W(`<g stroke="currentColor" opacity=".09">${[0, 1, 2, 3].map((i) => `<path d="M20 ${90 + i * 14}Q100 ${-10 + i * 14} 210 ${100 + i * 14}T465 ${65 + i * 14}"/>`).join("")}</g>
      <path d="M48 136C97 134 75 39 138 53S189 154 253 119 289 31 339 49 360 119 433 57" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 5"/>
      <path d="M48 136C97 134 75 39 138 53S189 154 253 119" stroke="currentColor" stroke-width="2"/>
      ${dots([[48, 136], [138, 53], [253, 119], [339, 49], [433, 57]], ([x, y], i) => `<g><circle cx="${x}" cy="${y}" r="${i === 2 ? 17 : 10}" fill="var(--surface)" stroke="currentColor" stroke-opacity="${i > 2 ? .4 : .8}"/><circle cx="${x}" cy="${y}" r="${i === 2 ? 6 : 3.5}" fill="currentColor" opacity="${i > 2 ? .4 : 1}"/></g>`)}
      <g fill="currentColor" font-size="8" letter-spacing="2"><text x="24" y="163">CALLED</text><text x="113" y="28">SENT</text><text x="229" y="158">ONWARD</text></g><path d="M246 88L253 78 260 88" stroke="currentColor" opacity=".65"/>`),
    cities: () => W(`<g stroke="currentColor" opacity=".13"><path d="M40 148L238 58 438 148 240 185Z M62 137L240 173 417 138 M91 124L240 154 389 125 M131 106L240 133 350 107"/><path d="M99 156L280 73M162 169L338 99M207 179L392 123M376 162L184 83M318 174L126 111"/></g>
      <path d="M88 124V79L107 70 143 78V112M88 79L123 89 143 78M123 89V133M320 121V82L344 70 385 81V128M320 82L361 94 385 81M361 94V145" fill="currentColor" fill-opacity=".08" stroke="currentColor" stroke-opacity=".6"/>
      <path d="M178 127V68L240 38 302 68V127L240 152Z" fill="var(--surface)" stroke="currentColor"/><path d="M178 68L240 89 302 68M240 89V152M195 60L240 17 285 60 240 77Z" fill="currentColor" fill-opacity=".12" stroke="currentColor"/>
      <g stroke="currentColor" stroke-opacity=".65"><path d="M189 83V122M204 89V129M220 95V136M255 94V136M271 89V129M287 83V121M195 60L240 44 285 60"/></g><path d="M55 151H77M403 151H426" stroke="currentColor"/><circle cx="55" cy="151" r="2" fill="currentColor"/><circle cx="426" cy="151" r="2" fill="currentColor"/>`),
    gospels: () => W(`<g stroke="currentColor" stroke-opacity=".12"><path d="M43 140L110 57 153 102 193 64 258 136M262 133L320 69 364 99 402 58 450 141"/><path d="M73 143L110 98 135 126M368 140L405 104 428 141"/></g>
      ${dots([34, 73, 112, 151], (y, i) => `<g><text x="25" y="${y + 3}" fill="currentColor" opacity=".7" font-size="8" letter-spacing="1.5">${["MATTHEW", "MARK", "LUKE", "JOHN"][i]}</text><path d="M103 ${y}C170 ${y} 167 91 242 91S345 ${y} 427 ${y}" stroke="currentColor" stroke-width="1.2" opacity="${.35 + i * .15}"/><circle cx="427" cy="${y}" r="3.5" fill="currentColor" opacity="${.4 + i * .15}"/></g>`)}
      <circle cx="242" cy="91" r="26" fill="var(--surface)" stroke="currentColor"/><circle cx="242" cy="91" r="19" stroke="currentColor" stroke-opacity=".25"/><path d="M242 77V106M232 87H252" stroke="currentColor" stroke-width="2"/>`),
    "early-church": () => W(`<path d="M80 157V75Q80 15 145 15H335Q400 15 400 75V157M105 157V80Q105 39 149 39H331Q375 39 375 80V157" stroke="currentColor" opacity=".25"/>
      <path d="M150 157V96Q150 58 185 58Q220 58 220 96V157M260 157V96Q260 58 295 58Q330 58 330 96V157" stroke="currentColor" opacity=".45"/>
      <path d="M213 147V113H267V147M202 147H278M226 113V88M254 113V88" stroke="currentColor" stroke-width="2"/>
      <path d="M226 88Q217 77 226 67Q235 77 226 88ZM254 88Q245 77 254 67Q263 77 254 88Z" fill="currentColor" opacity=".8"/>
      <path d="M120 165H360M155 174H325" stroke="currentColor" opacity=".35"/><circle cx="240" cy="32" r="4" fill="currentColor"/>`),
    "catholic-orthodox": () => W(`<path d="M44 151H438M75 161H405" stroke="currentColor" opacity=".25"/>
      <path d="M86 151V91L144 44 202 91V151M111 151V104H178V151M132 151V120Q144 105 156 120V151M144 44V20M137 29H151" fill="currentColor" fill-opacity=".07" stroke="currentColor"/>
      <path d="M290 151V92H395V151M304 92Q289 66 317 48Q337 30 343 22Q350 38 367 48Q395 66 381 92M343 22V9M335 16H351M325 151V121Q343 102 360 121V151" fill="currentColor" fill-opacity=".1" stroke="currentColor"/>
      <path d="M175 164Q240 192 314 164M199 118Q244 80 288 118" stroke="currentColor" stroke-dasharray="3 5" opacity=".6"/><circle cx="243" cy="102" r="7" fill="var(--surface)" stroke="currentColor"/>`),
    reformation: () => W(`<path d="M110 158V28H265V158M98 28H278M98 158H278M110 53H265M187 28V86M164 86H210V101H164Z" stroke="currentColor" stroke-width="2"/>
      <path d="M187 59H226L241 49M124 139H250L233 118H141Z" fill="currentColor" fill-opacity=".12" stroke="currentColor"/>
      <path d="M291 42L370 30 392 135 313 151ZM300 55L378 42M312 77L366 68M316 92L370 83M320 107L374 98M323 121L356 116" stroke="currentColor" opacity=".7"/>
      <path d="M60 171H420M137 148H236" stroke="currentColor" opacity=".25"/><path d="M296 155L379 143" stroke="currentColor" opacity=".5"/>`),
    missions: () => W(`<ellipse cx="240" cy="93" rx="150" ry="77" stroke="currentColor" opacity=".4"/><ellipse cx="240" cy="93" rx="80" ry="77" stroke="currentColor" opacity=".18"/>
      <path d="M90 93H390M105 61H375M105 125H375M240 16V170" stroke="currentColor" opacity=".18"/>
      <path d="M137 110Q200 7 285 58T351 117M176 53Q183 147 298 140M137 110Q216 168 351 117" stroke="currentColor" stroke-dasharray="3 5" opacity=".65"/>
      ${dots([[137, 110], [176, 53], [240, 93], [285, 58], [298, 140], [351, 117]], ([x, y]) => `<g><circle cx="${x}" cy="${y}" r="11" fill="var(--surface)" stroke="currentColor" stroke-opacity=".45"/><circle cx="${x}" cy="${y}" r="4" fill="currentColor"/></g>`)}`),
    "old-maps": () => W(oldMapInner(), "om-art-oldmaps"),
  };

  // The new drawing. Rays and rhumb lines leave the compass rose; the rose (and only it) turns on a slow loop.
  function oldMapInner() {
    const rose = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const long = a % 90 === 0, r = long ? 21 : 13, rad = (a * Math.PI) / 180;
      const x = (r * Math.sin(rad)).toFixed(1), y = (-r * Math.cos(rad)).toFixed(1);
      const lx = (3.2 * Math.sin(rad + Math.PI / 2)).toFixed(1), ly = (-3.2 * Math.cos(rad + Math.PI / 2)).toFixed(1);
      return `<path d="M${lx} ${ly}L${x} ${y}L${-lx} ${-ly}Z" fill="currentColor" fill-opacity="${long ? .35 : .12}" stroke="currentColor" stroke-width=".9"/>`;
    }).join("");
    const rhumbs = [-62, -38, -14, 14, 38, 62, 160, 200].map((a) => {
      const rad = (a * Math.PI) / 180;
      return `<path d="M0 0L${(150 * Math.cos(rad)).toFixed(0)} ${(150 * Math.sin(rad)).toFixed(0)}"/>`;
    }).join("");
    const hills = [[226, 58], [240, 70], [222, 84], [244, 96], [228, 138], [252, 142], [262, 60], [258, 84]].map(([x, y]) => `<path d="M${x - 7} ${y}l7-8 7 8"/><path d="M${x - 2} ${y - 3}l2-2" opacity=".6"/>`).join("");
    return `<path d="M120 20L378 12 388 162 130 172Z" fill="currentColor" fill-opacity=".04" stroke="currentColor" stroke-opacity=".28"/>
      <path d="M96 30L364 22 370 138 342 166 104 172Z" fill="var(--surface)" stroke="currentColor"/>
      <path d="M370 138L342 166Q352 146 370 138Z" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-linejoin="round"/>
      <path d="M104 37L357 30 362 132 336 160 111 165Z" stroke="currentColor" stroke-opacity=".3"/>
      <g transform="translate(150 104)"><g clip-path="url(#om-sea)" stroke="currentColor" stroke-opacity=".22" stroke-width=".8">${rhumbs}</g></g>
      <clipPath id="om-sea"><path d="M-44 -70H40C34 -50 44 -38 38 -24S30 4 32 18 22 44 18 61H-38Z"/></clipPath>
      <path d="M190 36C184 52 194 60 186 76S178 102 180 116 170 142 166 160" stroke="currentColor" stroke-width="1.4"/>
      <path d="M186 36C180 52 190 60 182 76S174 102 176 116 166 142 162 160" stroke="currentColor" stroke-opacity=".3"/>
      <g class="om-rose" transform="translate(150 104)"><circle r="25" stroke="currentColor" stroke-opacity=".35"/><circle r="17" stroke="currentColor" stroke-opacity=".2"/>${rose}<circle r="2.2" fill="currentColor"/><text y="-28" text-anchor="middle" fill="currentColor" font-size="7" letter-spacing="1">N</text></g>
      <g class="om-ship" stroke="currentColor" stroke-linejoin="round"><path d="M116 64h24l-4 5h-16z" fill="currentColor" fill-opacity=".14"/><path d="M128 64V48"/><path d="M128 49l8 11h-8z" fill="currentColor" fill-opacity=".1"/><path d="M128 51l-6 9h6"/></g>
      <g stroke="currentColor" stroke-opacity=".55" stroke-linecap="round">${hills}</g>
      <path d="M302 36C298 48 306 56 301 66" stroke="currentColor" stroke-opacity=".7"/><ellipse cx="301" cy="72" rx="5" ry="7.5" fill="currentColor" fill-opacity=".14" stroke="currentColor"/>
      <path d="M301 80C306 92 297 100 304 110S300 118 304 122" stroke="currentColor" stroke-opacity=".7"/><ellipse cx="305" cy="136" rx="7" ry="15" fill="currentColor" fill-opacity=".14" stroke="currentColor"/>
      <g transform="translate(272 112)" stroke="currentColor"><circle r="8" fill="var(--surface)"/><path d="M-5 -3v-5h3v3h4v-3h3v5M-1 -10l1-3 1 3"/><circle r="2" fill="currentColor"/></g>
      <path d="M312 40h40q6 0 6 7v8q0 7-6 7h-40q-6 0-6-7v-8q0-7 6-7z" fill="var(--surface)" stroke="currentColor"/><path d="M306 47q-6 0-6 4t6 4M358 47q6 0 6 4t-6 4" stroke="currentColor" stroke-opacity=".6"/>
      <text x="332" y="54" text-anchor="middle" fill="currentColor" font-size="6.5" letter-spacing="1.6">TERRA SANCTA</text>
      <path d="M232 152h48M232 149v6M256 150v4M280 149v6" stroke="currentColor"/><path d="M232 152h12" stroke="currentColor" stroke-width="2.4"/>`;
  }

  // The tile row (icons copied from the site's lucide set; "Old maps" is a new one: a sheet with a compass rose).
  const LUCIDE = {
    map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    landmark: '<path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
    bookOpen: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    church: '<path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9"/><path d="M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14"/>',
    split: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>',
    scrollText: '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
    earth: '<path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/>',
    oldMaps: '<path d="M4 4.5 18 3l1.2 15.5-2.7 2.5L5 21.5z"/><path d="M19.2 18.5l-2.7 2.5q.8-2 2.7-2.5z"/><circle cx="11.5" cy="12" r="3.6"/><path d="M11.5 7.2v1.2M11.5 15.6v1.2M6.7 12h1.2M15.1 12h1.2"/><path d="m10.6 12.9 2.4-2.4-1.5 3.3z" fill="currentColor"/>',
  };
  const TILES = [
    { id: "atlas", title: "Atlas", color: "poetry", icon: LUCIDE.map, href: "/study/atlas/map" },
    { id: "journeys", title: "Journeys", color: "accent", icon: LUCIDE.route, href: "/study/atlas/journeys" },
    { id: "cities", title: "Ancient Cities", color: "history", icon: LUCIDE.landmark, href: "/study/atlas/cities" },
    { id: "gospels", title: "Gospel Events", color: "gospels", icon: LUCIDE.bookOpen, href: "/study/atlas/gospels" },
    { id: "early-church", title: "The Early Church", color: "gospels", icon: LUCIDE.church, href: "/study/atlas/early-church" },
    { id: "catholic-orthodox", title: "Apostolic Church", color: "prophets", icon: LUCIDE.split, href: "/study/atlas/catholic-orthodox" },
    { id: "reformation", title: "The Reformation", color: "history", icon: LUCIDE.scrollText, href: "/study/atlas/reformation" },
    { id: "missions", title: "Global Missions", color: "poetry", icon: LUCIDE.earth, href: "/study/atlas/missions" },
    { id: "old-maps", title: "Old maps", color: "epistles", icon: LUCIDE.oldMaps, href: "?d=a" },
  ];

  return { CARDS, TILES, LUCIDE, card: (id) => CARDS[id]() };
})();
