// B · Doors by age, front page. A full-screen landing of seven line-art doors (arches for the five ages, square
// doorways for the two settings), the key figures as one bar beneath, then the subjects as interactive lanes that run
// through every door; choosing a series draws its route across them.
(() => {
  const { esc, plural } = Frame;
  const { AUDIENCES, TRACKS, ITEMS, SERIES } = LEARN;

  // An arch for an age, a lintel doorway for a setting. viewBox 100 x 160.
  const frame = (setting) => setting
    ? `<svg class="frame" viewBox="0 0 100 160" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="1.2" vector-effect="non-scaling-stroke" aria-hidden="true">
        <path class="fill" d="M14 160 V30 H86 V160 Z" stroke="none"/><path d="M6 160 V22 H94 V160" vector-effect="non-scaling-stroke"/><path d="M14 160 V30 H86 V160" opacity=".5" vector-effect="non-scaling-stroke"/>
        <path d="M2 22 H98 M2 16 H98" vector-effect="non-scaling-stroke"/><path d="M0 160 H100" vector-effect="non-scaling-stroke"/></svg>`
    : `<svg class="frame" viewBox="0 0 100 160" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
        <path class="fill" d="M14 160 V54 A36 36 0 0 1 86 54 V160 Z" stroke="none"/><path d="M6 160 V52 A44 44 0 0 1 94 52 V160" vector-effect="non-scaling-stroke"/><path d="M14 160 V54 A36 36 0 0 1 86 54 V160" opacity=".5" vector-effect="non-scaling-stroke"/>
        <path d="M45 9 L50 4 L55 9" vector-effect="non-scaling-stroke"/><path d="M0 160 H100" vector-effect="non-scaling-stroke"/></svg>`;
  const door = (a, href, extra = "", count = !extra) => `<a class="door${a.setting ? " setting" : ""}" href="${href}" data-aud="${a.id}" style="--tone: var(${a.tone})">
      <span class="arch">${frame(a.setting)}<span class="glow"></span>${count ? `<span class="cnt">${LEARN.forAudience(a.id).length}<small>titles</small></span>` : ""}${ART.audience(a.art)}</span><b>${a.name}</b><small>${a.setting ? a.age : `Ages ${a.age}`}</small>${extra}</a>`;

  const doorHint = (a) => {
    const items = LEARN.forAudience(a.id), kinds = [...new Set(items.map((i) => LEARN.K[i.kind].plural.toLowerCase()))];
    return `<b>${a.name}${a.setting ? "" : `, ${a.age}`}.</b> ${a.line} <span class="muted">${plural(items.length, "title")}: ${kinds.slice(0, 4).join(", ")}${kinds.length > 4 ? " and more" : ""}.</span>`;
  };

  function lanes(wrap) {
    const head = `<span></span>${AUDIENCES.map((a) => `<span class="colh${a.setting ? " setting" : ""}" style="--tone: var(${a.tone})">${ART.audience(a.art)}${a.name}</span>`).join("")}`;
    const rows = TRACKS.map((t) => `<span class="rowh">${ART.track(t.id, 18)}${t.name}</span>${AUDIENCES.map((a) => {
      const here = LEARN.forAudience(a.id).filter((it) => it.track === t.id);
      return `<span class="cell${a.setting ? " setting" : ""}">${here.map((it) => `<a class="pt ${it.status}" href="#b/item/${it.id}" data-id="${it.id}" data-home="${it.audience === a.id}" style="--tone: var(${LEARN.A[it.audience].tone})" aria-label="${esc(it.title)}"></a>`).join("")}</span>`;
    }).join("")}`).join("");
    wrap.insertAdjacentHTML("beforeend", `<section class="sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>Every subject <em>runs through every door</em></h2>
      <p>One lane for each subject, one point for each title, under the door it belongs to. Filled is ready; open is planned. Point at one to read it; choose a series to see its route.</p></div></div>
      <div class="lanes-tools"><span class="lab">Series</span>${SERIES.map((s) => `<button type="button" class="chip" data-series="${s.id}" aria-pressed="false">${s.name}</button>`).join("")}</div>
      <div class="lanes-scroll"><div class="lanes">${head}${rows}<svg class="route" aria-hidden="true"></svg></div></div>
      <p class="hint-line" data-lane>${plural(ITEMS.length, "title")} across ${TRACKS.length} subjects. <span class="muted">Leaders also see each title that comes with a leader guide, so those appear twice.</span></p></section>`);
    const grid = wrap.querySelector(".lanes"), svg = grid.querySelector(".route"), hint = wrap.querySelector("[data-lane]"), base = hint.innerHTML;
    let current = null;
    const centre = (el) => { const r = el.getBoundingClientRect(), g = grid.getBoundingClientRect(); return [r.left - g.left + r.width / 2, r.top - g.top + r.height / 2]; };
    function draw() {
      grid.querySelectorAll(".pt").forEach((p) => p.classList.toggle("dim", !!current && !LEARN.I[p.dataset.id].series.some(([s]) => s === current)));
      if (!current) { svg.innerHTML = ""; return; }
      const pts = LEARN.inSeries(current).map((it) => grid.querySelector(`.pt[data-id="${it.id}"][data-home="true"]`)).filter(Boolean).map(centre);
      const d = pts.map(([x, y], i) => (i ? (() => { const [px, py] = pts[i - 1], mx = (px + x) / 2; return `C${mx} ${py} ${mx} ${y} ${x} ${y}`; })() : `M${x} ${y}`)).join(" ");
      const [lx, ly] = pts[0];
      svg.innerHTML = `<path d="${d}"/><text x="${lx + 12}" y="${ly - 12}">${esc(LEARN.S[current].name)}</text>`;
    }
    wrap.querySelectorAll("[data-series]").forEach((b) => b.addEventListener("click", () => {
      current = b.getAttribute("aria-pressed") === "true" ? null : b.dataset.series;
      wrap.querySelectorAll("[data-series]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.series === current)));
      hint.innerHTML = current ? `<b>${LEARN.S[current].name}</b> · ${LEARN.S[current].type}. ${LEARN.S[current].line}` : base;
      draw();
    }));
    addEventListener("resize", draw);
    grid.addEventListener("pointerover", (e) => { const p = e.target.closest(".pt"); if (p) hint.innerHTML = DIRS.a.hintFor(LEARN.I[p.dataset.id]); });
    grid.addEventListener("pointerleave", () => { hint.innerHTML = current ? `<b>${LEARN.S[current].name}</b> · ${LEARN.S[current].line}` : base; });
  }

  function front(wrap) {
    const ages = AUDIENCES.filter((a) => !a.setting), settings = AUDIENCES.filter((a) => a.setting);
    wrap.innerHTML = `${Frame.crumbs("Direction B · Doors by age")}
      <section class="dr-land"><div class="dr-sky" aria-hidden="true"></div>
        <div class="dr-head"><p class="kicker">Resources · Learning materials</p><h1>Choose <em>a door.</em></h1><p>Five doors by age, and two for the people who use these together. Behind each are the workbooks, lessons and pages written for that reader, every one from the site's own reviewed pages.</p></div>
        <div class="doors">${ages.map((a) => door(a, `#b/age/${a.id}`)).join("")}${settings.map((a) => door(a, `#b/age/${a.id}`)).join("")}</div>
        <p class="hint-line dr-hint" data-door>Point at a door to see what is behind it.</p>
        <div class="dr-bar"><div><b>${LEARN.ready.length}</b><span>Ready to print</span></div><div><b>${LEARN.planned.length}</b><span>Planned</span></div><div><b>${TRACKS.length}</b><span>Subjects</span></div><div><b>${SERIES.length}</b><span>Series</span></div><div><b>2</b><span>Paper sizes</span></div></div>
      </section>`;
    const hint = wrap.querySelector("[data-door]"), base = hint.innerHTML;
    wrap.querySelectorAll(".doors .door").forEach((d) => {
      d.addEventListener("pointerenter", () => { hint.innerHTML = doorHint(LEARN.A[d.dataset.aud]); });
      d.addEventListener("pointerleave", () => { hint.innerHTML = base; });
    });
    lanes(wrap);
  }

  DIRS.b = { name: "Doors by age", defaultAge: "little", front, door, frame, lanes, doorHint }; // lanes and doorHint are also drawn by E
})();
