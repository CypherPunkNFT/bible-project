// Hymns card · six directions at real size. Each direction is a copy of the site's real Living the Christian Life section
// (captured in section.js, styled by the site's own rules in live-section.css), with only the Hymns card's drawing
// replaced. The Hymns card takes the Topics card's box (study-wide), so both cards have the same size and dimensions.
(() => {
  const { esc } = HC;
  const main = Frame.mount();
  document.querySelectorAll(".site-header .nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "/study"));
  // The live site's header has no Atlas link (Atlas moved under Study); the borrowed frame still draws one.
  document.querySelectorAll('.site-header .nav a[href*="atlas"]').forEach((a) => a.remove());
  main.innerHTML = `<div class="m2-head"><a href="/mockups/">← All mock-ups</a>
      <h1>The Hymns card, <em>at real size</em></h1>
      <p>The same six drawings as the first Hymns card page, each placed in a copy of the real Study section beside the real
      Topics card, at the site's own sizes. Only the Hymns drawing changes from one to the next.</p></div>
    <div class="study-experience"><div class="branch" id="m2-list"></div></div>`;
  const list = document.getElementById("m2-list");

  // First, the owner's pick refined (2026-10-18): 03 with a much larger disc, "150 psalms" as its only caption, and a smaller
  // description; then the six as they were.
  const psalter = CARD_ART.find((d) => d.id === "psalter");
  if (!psalter) throw new Error('hymns card 2: direction "psalter" (03) did not register; expected ../hymns-card-directions/art-psalter-lines.js');
  const entries = [{ ...psalter, key: "psalter-larger", num: "03", label: "The Psalter, turning · larger", idea: "Your pick, refined at the site's exact card size: the disc larger, its lower-left edge just off the “s” of Hymns, no caption, the turning arm and the Psalm 119 tick shorter, and both descriptions smaller at the bottom of the cards.", big: true },
    ...CARD_ART.map((d, i) => ({ ...d, key: d.id, num: String(i + 1).padStart(2, "0") }))];

  // The owner's refinements to 03 (2026-10-18), on the drawing ../hymns-card-directions/art-psalter-lines.js made: no caption;
  // the lone long tick (Psalm 119, 21 hymns) shortened to TICK_CAP; the turning arm just long enough to pass it; the drawing
  // cropped to the disc, so it draws as large as the box allows. Geometry as that file has it: centre (110, 103), ticks from r 58.
  const CX = 110, CY = 103, INNER = 58, TICK_CAP = 26, ARM = INNER + TICK_CAP + 6;
  function refinePsalter(art) {
    art.querySelector(".art-note")?.remove();
    const svg = art.querySelector(".psalter svg");
    for (const tick of svg.querySelectorAll(".tick")) {
      const x1 = +tick.getAttribute("x1"), y1 = +tick.getAttribute("y1"), x2 = +tick.getAttribute("x2"), y2 = +tick.getAttribute("y2");
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len <= TICK_CAP) continue;
      tick.setAttribute("x2", (x1 + (x2 - x1) * TICK_CAP / len).toFixed(1));
      tick.setAttribute("y2", (y1 + (y2 - y1) * TICK_CAP / len).toFixed(1));
    }
    // The "119" mark follows its shortened tick, just inside the arm's reach.
    const label = [...svg.querySelectorAll(".tick-label")].find((el) => el.textContent === "119");
    if (label) {
      const a = ((119 - 0.5) * 2.4 - 90) * Math.PI / 180, r = INNER + TICK_CAP + 12;
      label.setAttribute("x", (CX + r * Math.cos(a)).toFixed(1));
      label.setAttribute("y", (CY + r * Math.sin(a) - 3).toFixed(1));
    }
    const arm = svg.querySelector(".arm");
    arm.querySelector("path").setAttribute("d", `M${CX} ${CY - 20} V${CY - ARM}`);
    arm.querySelector("circle").setAttribute("cy", String(CY - ARM));
    const edge = ARM + 4;
    svg.setAttribute("viewBox", `${CX - edge} ${CY - edge} ${edge * 2} ${edge * 2}`);
  }

  // The disc's south-west edge sits just off the "s" of the card's "Hymns" title (owner, 2026-10-18): the title's last letter
  // is measured, and the disc placed so the point 45° below-left on its tick ring lands GAP px above and right of it.
  const RING = INNER + TICK_CAP, GAP = 5;
  function placeDisc(card) {
    const art = card.querySelector(".study-art"), svg = art.querySelector(".psalter svg"), title = card.querySelector("h2");
    if (!svg || !title.firstChild) return;
    const range = document.createRange();
    range.setStart(title.firstChild, title.textContent.length - 1); range.setEnd(title.firstChild, title.textContent.length);
    const s = range.getBoundingClientRect(), box = art.getBoundingClientRect(), size = svg.getBoundingClientRect().width;
    const ring = RING * size / ((ARM + 4) * 2), diag = ring * Math.SQRT1_2;
    const cx = s.right + GAP + diag, cy = s.top - GAP - diag;
    let left = cx - box.left - size / 2, top = cy - box.top - size / 2;
    svg.style.left = `${left}px`; svg.style.top = `${top}px`;
    // Then close the gap to the nearest real tick in that corner (they are shorter than the full ring), along the diagonal.
    const centre = svg.querySelector('circle[r="2.4"]').getBoundingClientRect(), mid = { x: centre.left + centre.width / 2, y: centre.top + centre.height / 2 };
    const nearest = Math.min(...[...svg.querySelectorAll(".tick")].map((tick) => tick.getBoundingClientRect())
      .filter((b) => b.left < mid.x && b.bottom > mid.y).map((b) => Math.hypot(b.left - s.right, b.bottom - s.top)));
    if (Number.isFinite(nearest) && nearest > GAP) {
      const step = (nearest - GAP) * Math.SQRT1_2;
      left -= step; top += step;
      svg.style.left = `${left}px`; svg.style.top = `${top}px`;
    }
  }

  entries.forEach((d) => {
    const wrap = document.createElement("div");
    wrap.id = d.key;
    if (d.big) wrap.className = "m2-big";
    wrap.innerHTML = `<div class="m2-label"><b>${d.num}</b><div><strong>${esc(d.label)}</strong><span>${esc(d.idea)}</span></div></div>${LIVE_SECTION}`;
    const section = wrap.querySelector(".subject-collection");
    // A crop of the real section: its heading and the two cards; the list of links below them is left out.
    section.querySelectorAll(".theology-topic-links, .support-links").forEach((el) => el.remove());
    // Ids must stay unique with six copies on one page.
    section.querySelectorAll("[id]").forEach((el) => { el.id = `${el.id}-${d.key}`; });
    section.id = `section-${d.key}`;
    section.querySelectorAll("[aria-labelledby]").forEach((el) => el.setAttribute("aria-labelledby", `${el.getAttribute("aria-labelledby")}-${d.key}`));
    const card = section.querySelector(".study-hymns-resource");
    if (!card) throw new Error(`hymns card 2: the captured section has no Hymns card (.study-hymns-resource); recapture section.js`);
    card.classList.add("study-wide");
    const art = card.querySelector(".study-art");
    art.className = `study-art art art-${d.id}`;
    art.innerHTML = d.art();
    if (d.big) {
      refinePsalter(art);
      const place = () => placeDisc(card);
      requestAnimationFrame(place);
      document.fonts.ready.then(place, (error) => console.warn("hymns card 2: fonts did not report ready", error));
      new ResizeObserver(place).observe(card);
    }
    list.append(wrap);
    Promise.resolve(d.start(wrap)).catch((error) => console.error(`hymns card 2: direction "${d.id}" stopped`, error));
  });
})();
