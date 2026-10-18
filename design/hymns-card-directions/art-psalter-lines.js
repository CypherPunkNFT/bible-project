// Directions 03 (The Psalter, turning) and 04 (First lines).
(() => {
  const { fmt, reduced, sleep, clean, esc, psalmCounts, findHymn, BOOK_OF_GROUP } = HC;

  // 03 · The 150 psalms round a disc like the grooves of a record; an arm stops on a psalm and reads out the hymn sung on it.
  const STOPS = [
    [1, "Blest is the man who shuns the place"], [8, "O Lord, our Lord, how wondrous great"], [19, "The heavens declare thy glory"],
    [23, "My shepherd will supply my need"], [46, "God is the refuge of his saints"], [51, "Show pity, Lord, O Lord, forgive"],
    [72, "Jesus shall reign where'er the sun"], [84, "How pleasant, how divinely fair"], [90, "Our God, our help in ages past"],
    [98, "Joy to the world"], [100, "Sing to the Lord with joyful voice"], [103, "Bless, O my soul, the living God"],
    [117, "From all that dwell below the skies"], [119, "Blest are the undefiled in heart"], [121, "Up to the hills I lift mine eyes"],
    [136, "Give to our God immortal praise"], [146, "I'll praise my Maker with my breath"], [148, "Loud hallelujahs to the Lord"],
  ];
  const CX = 110, CY = 103, INNER = 58, REACH = 40;
  const angleOf = (psalm) => (psalm - 0.5) * 2.4; // degrees clockwise from the top

  CARD_ART.push({
    id: "psalter",
    label: "The Psalter, turning",
    idea: "The 150 psalms round a disc like the grooves of a record, each mark as long as the hymns sung on that psalm. An arm moves from psalm to psalm and reads out the hymn: Psalm 90 is \"Our God, our help in ages past\", Psalm 98 is \"Joy to the world\".",
    art() {
      const counts = psalmCounts(), max = Math.max(...counts);
      const ticks = counts.map((n, i) => {
        const a = (angleOf(i + 1) - 90) * Math.PI / 180, len = n ? 4 + (n / max) * REACH : 2;
        const x1 = CX + INNER * Math.cos(a), y1 = CY + INNER * Math.sin(a), x2 = CX + (INNER + len) * Math.cos(a), y2 = CY + (INNER + len) * Math.sin(a);
        return `<line class="tick" data-psalm="${i + 1}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="${n ? (0.32 + 0.6 * n / max).toFixed(2) : 0.14}"/>`;
      }).join("");
      const tip = (psalm, extra) => { const a = (angleOf(psalm) - 90) * Math.PI / 180, r = INNER + 4 + (counts[psalm - 1] / max) * REACH + extra; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };
      const marks = [[1, 7, 3], [119, -10, -6]].map(([p, extra, lift]) => { const [x, y] = tip(p, extra); return `<text class="tick-label" x="${x.toFixed(1)}" y="${(y + lift).toFixed(1)}" text-anchor="middle">${p}</text>`; }).join("");
      const grooves = [24, 29, 34, 39, 44, 49, 54].map((r) => `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="currentColor" stroke-opacity="${r === 54 ? 0.3 : 0.12}"/>`).join("");
      return `<div class="psalter"><svg viewBox="0 0 220 206" role="img" aria-label="Hymns sung on each of the 150 psalms">
          ${grooves}<circle cx="${CX}" cy="${CY}" r="19" fill="currentColor" fill-opacity=".13"/>
          <text x="${CX}" y="${CY - 2}" text-anchor="middle" font-size="6.5" letter-spacing="1.2" fill="var(--muted)" font-family="var(--sans)">PSALMS</text>
          <text x="${CX}" y="${CY + 8}" text-anchor="middle" font-size="6" fill="var(--muted)" font-family="var(--sans)">Watts · 1719</text>
          ${ticks}${marks}<g class="arm"><path d="M${CX} ${CY - 20} V${CY - INNER - REACH - 4}" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round"/>
          <circle cx="${CX}" cy="${CY - INNER - REACH - 4}" r="2.6" fill="var(--ink)"/></g>
          <circle cx="${CX}" cy="${CY}" r="2.4" fill="var(--ink)"/></svg>
        <div class="psalter-read"><small class="fade">Psalm</small><div class="num fade"><b>90</b><span></span></div><q class="fade"></q><p class="fade"></p></div></div>
        <span class="art-note">The 150 psalms · each mark as long as the hymns sung on it</span>`;
    },
    async start(root) {
      const counts = psalmCounts(), read = root.querySelector(".psalter-read"), arm = root.querySelector(".arm");
      const stops = STOPS.map(([psalm, first]) => ({ psalm, hymn: findHymn(first, psalm) })).filter((s) => s.hymn);
      let turned = 0;
      const show = ({ psalm, hymn }) => {
        read.querySelector(".num b").textContent = psalm;
        read.querySelector(".num span").textContent = `${counts[psalm - 1]} ${counts[psalm - 1] === 1 ? "hymn" : "hymns"} sung on it`;
        read.querySelector("q").textContent = clean(hymn.t);
        read.querySelector("p").textContent = `${hymn.a} · ${hymn.y}`;
        root.querySelectorAll(".tick.on").forEach((t) => t.classList.remove("on"));
        root.querySelector(`.tick[data-psalm="${psalm}"]`).classList.add("on");
        const target = angleOf(psalm);
        turned += ((target - (turned % 360)) + 360) % 360; // always clockwise, like a turning record
        arm.style.transform = `rotate(${turned}deg)`;
      };
      if (reduced) { show(stops.find((s) => s.psalm === 90)); return; }
      for (let i = 0; ; i = (i + 1) % stops.length) {
        read.classList.add("swap");
        await sleep(450);
        show(stops[i]);
        read.classList.remove("swap");
        await sleep(3300);
      }
    },
  });

  // 04 · Six first lines, written word by word at singing pace, each joined to the verse it was written on (KJV).
  const FIRST_LINES = [
    { first: "Amazing grace", verse: "Who am I, O LORD God … that thou hast brought me hitherto?", ref: "1 Chronicles 17:16" },
    { first: "When I survey the wondrous cross", verse: "God forbid that I should glory, save in the cross of our Lord Jesus Christ", ref: "Galatians 6:14" },
    { first: "Our God, our help in ages past", verse: "Lord, thou hast been our dwelling place in all generations.", ref: "Psalm 90:1" },
    { first: "Joy to the world", verse: "Make a joyful noise unto the LORD, all the earth", ref: "Psalm 98:4" },
    { first: "There is a fountain filled with blood", verse: "In that day there shall be a fountain opened … for sin and for uncleanness.", ref: "Zechariah 13:1" },
    { first: "How sweet the name of Jesus sounds", verse: "thy name is as ointment poured forth", ref: "Song of Songs 1:3" },
  ];

  CARD_ART.push({
    id: "first-lines",
    label: "First lines",
    idea: "Six of the best-known first lines, written out word by word at the pace they are sung, each then joined by a thin line to the verse the writer set it on. The year sits large and faint behind.",
    art() {
      return `<div class="first"><span class="first-year" aria-hidden="true"></span>
          <p class="first-line"></p><div class="first-who"></div>
          <div class="first-join"><span class="rule"></span><blockquote></blockquote></div>
          <div class="first-dots">${FIRST_LINES.map(() => "<i></i>").join("")}</div></div>
        <span class="art-note">First lines, and the verses they were written on</span>`;
    },
    async start(root) {
      const box = root.querySelector(".first"), line = box.querySelector(".first-line"), who = box.querySelector(".first-who");
      const join = box.querySelector(".first-join"), quote = join.querySelector("blockquote"), year = box.querySelector(".first-year");
      const dots = [...box.querySelectorAll(".first-dots i")];
      const items = FIRST_LINES.map((f) => ({ ...f, hymn: findHymn(f.first) })).filter((f) => f.hymn);
      const set = (item, i) => {
        const words = clean(item.hymn.t).split(" ");
        line.innerHTML = words.map((w) => `<span>${esc(w)}</span>`).join(" ");
        who.textContent = `${item.hymn.a} · ${BOOK_OF_GROUP[item.hymn.g]}, ${item.hymn.y}`;
        quote.innerHTML = `“${esc(item.verse)}”<cite>${esc(item.ref)}</cite>`;
        year.textContent = item.hymn.y;
        dots.forEach((d, j) => d.classList.toggle("on", j === i));
        return [...line.children];
      };
      if (reduced) { set(items[0], 0).forEach((w) => w.classList.add("in")); join.classList.add("in"); return; }
      for (let i = 0; ; i = (i + 1) % items.length) {
        box.classList.add("out");
        await sleep(i === 0 && !line.children.length ? 0 : 600);
        const words = set(items[i], i);
        join.classList.remove("in");
        box.classList.remove("out");
        for (const w of words) { w.classList.add("in"); await sleep(380); }
        await sleep(350);
        join.classList.add("in");
        await sleep(5200);
      }
    },
  });
})();
