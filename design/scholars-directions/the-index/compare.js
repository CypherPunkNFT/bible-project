// The index · side by side: pick two scholars and read them across the same facts, with a line showing whether
// (and for how long) their lives overlapped. "Compare side by side" in a profile sends that scholar here.
window.IX.compare = (() => {
  const { S, esc, tone, get, years, lived, eraParts, mark, shapeIcon, siteBadge, on, emit, reduced } = IX;
  const PAIRS = [["westcott", "hort"], ["josephus", "tacitus"], ["jerome", "augustine"], ["erasmus", "tyndale"], ["nave", "torrey"]];
  const pick = { a: "westcott", b: "hort" };
  let root;

  const options = (selected) => Object.keys(S.eras).map((era) => `<optgroup label="${esc(eraParts(era)[0])}">${S.scholars.filter((s) => s.era === era)
    .map((s) => `<option value="${s.id}"${s.id === selected ? " selected" : ""}>${esc(s.name)} (${esc(years(s))})</option>`).join("")}</optgroup>`).join("");
  const slot = (key) => `<div class="cmp-slot" data-slot="${key}"><span class="cmp-mark"></span>
    <label class="cmp-select"><span class="kicker">${key === "a" ? "First" : "Second"} scholar</span><select aria-label="${key === "a" ? "First" : "Second"} scholar">${options(pick[key])}</select></label></div>`;

  function mount(section) {
    root = section;
    section.innerHTML = `<header class="ix-head"><p class="kicker">02 · Side by side</p><h2>Any two scholars, <em>the same questions</em></h2>
        <p>Choose two people to set their lives, fields, faith and work beside each other. The line shows whether their lives overlapped.</p></header>
      <div class="cmp">
        <div class="cmp-pick">${slot("a")}<button type="button" class="cmp-swap" aria-label="Swap the two">${icon("arrowLeft", 14)}${icon("arrowRight", 14)}</button>${slot("b")}</div>
        <div class="cmp-pairs"><span>Try</span>${PAIRS.map(([a, b]) => `<button type="button" data-a="${a}" data-b="${b}">${esc(get(a).short)} &amp; ${esc(get(b).short)}</button>`).join("")}</div>
        <div class="cmp-over"></div>
        <div class="cmp-rows"></div>
      </div>`;
    section.querySelectorAll("select").forEach((sel) => sel.addEventListener("change", () => { pick[sel.closest(".cmp-slot").dataset.slot] = sel.value; render(); }));
    section.querySelector(".cmp-swap").addEventListener("click", () => { [pick.a, pick.b] = [pick.b, pick.a]; render(); });
    section.querySelector(".cmp-pairs").addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (btn) { pick.a = btn.dataset.a; pick.b = btn.dataset.b; render(); }
    });
    section.querySelector(".cmp-rows").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-open]");
      if (btn) emit("open", btn.dataset.open, btn);
    });
    render(true);
  }

  // ── The overlap line ────────────────────────────────────────────────────────────────────────
  function overlap(a, b) {
    const about = a.circa || b.circa ? "about " : "";
    const from = Math.max(a.born, b.born), to = Math.min(a.died, b.died);
    if (to > from) return { both: true, from, to, text: `Their lives overlapped by ${about}${to - from} years, from ${from} to ${to}.` };
    const [first, second] = a.died <= b.born ? [a, b] : [b, a];
    const gap = second.born - first.died;
    return { both: false, from: first.died, to: second.born, text: gap === 0 ? `${second.short} was born the year ${first.short} died.` : `Their lives did not overlap: ${about}${gap.toLocaleString("en")} years lie between ${first.short}'s death and ${second.short}'s birth.` };
  }
  function overlapHtml(a, b) {
    const o = overlap(a, b);
    const lo = Math.min(a.born, b.born), hi = Math.max(a.died, b.died), pad = Math.max(8, (hi - lo) * .06);
    const x0 = lo - pad, x1 = hi + pad, at = (y) => `${((y - x0) / (x1 - x0) * 100).toFixed(2)}%`;
    const stepYears = [10, 20, 25, 50, 100, 200, 250, 500].find((n) => (x1 - x0) / n <= 8) || 500;
    const ticks = [];
    for (let y = Math.ceil(x0 / stepYears) * stepYears; y <= x1; y += stepYears) ticks.push(y);
    // The name sits inside a wide bar; beside a narrow one, on whichever side has room.
    const lane = (s) => {
      const left = (s.born - x0) / (x1 - x0) * 100, width = (s.died - s.born) / (x1 - x0) * 100;
      const place = width > 34 ? "in" : left + width < 52 ? "right" : "left";
      return `<div class="cmp-lane" style="--tone: ${tone(s)}"><b class="cmp-${place}" style="left:${left.toFixed(2)}%; width:${width.toFixed(2)}%"><span>${esc(s.short)} <em>${esc(years(s))}</em></span></b></div>`;
    };
    const whole = (y) => `${(y / IX.NOW * 100).toFixed(2)}%`;
    return `<p class="cmp-verdict ${o.both ? "yes" : "no"}">${esc(o.text)}</p>
      <div class="cmp-whole" aria-hidden="true"><i style="left:${whole(x0)}; width:max(3px, calc(${whole(Math.min(x1, IX.NOW))} - ${whole(Math.max(0, x0))}))"></i><span style="left:0">0</span><span style="left:${whole(1000)}">1000</span><span style="right:0">${IX.NOW}</span></div>
      <div class="cmp-zoom" role="img" aria-label="${esc(o.text)}">
        <div class="cmp-band ${o.both ? "yes" : "no"}" style="left:${at(o.from)}; width:calc(${at(o.to)} - ${at(o.from)})"><span>${o.both ? "Together" : "Apart"}</span></div>
        ${ticks.map((y) => `<span class="cmp-tick" style="left:${at(y)}">${y}</span>`).join("")}
        ${lane(a)}${lane(b)}
      </div>
      <p class="cmp-explain">The top strip is the whole span from the time of Christ to today; the lanes below zoom in on these two lives.</p>`;
  }

  // ── The rows ────────────────────────────────────────────────────────────────────────────
  const named = (s) => {
    const areas = Object.entries(s.mentions).sort((x, y) => y[1] - x[1]).map(([area]) => area);
    return areas.length ? areas.map((area) => `<span class="cmp-chip">${esc(area)}</span>`).join("") : `<span class="muted">Not named yet</span>`;
  };
  const ROWS = [
    ["Lived", (s) => `${esc(years(s))}<small>lived ${esc(lived(s))}</small>`, null],
    ["Field", (s) => `<span class="cmp-field" style="--tone: ${tone(s)}">${shapeIcon(s.field, 14)}${esc(S.fields[s.field])}</span>`, "field"],
    ["Faith", (s) => esc(S.faiths[s.faith]), "faith"],
    ["Era", (s) => { const [name, span] = eraParts(s.era); return `${esc(name)}<small>${esc(span)}</small>`; }, "era"],
    ["Worked in", (s) => esc(s.place[0]), (s) => s.place[0]],
    ["Key works", (s) => s.works.map(([title, year]) => `<span class="cmp-work"><b>${esc(title)}</b> ${year}</span>`).join(""), null],
    ["On this site", (s) => s.site ? `${siteBadge(s)}<small>${esc(s.site.note)}</small>` : `<span class="muted">Not used yet</span>`, (s) => s.site?.status || "none"],
    ["Named on the site in", named, null],
  ];
  function rowsHtml(a, b) {
    const same = (key, s) => typeof key === "function" ? key(s) : s[key];
    return `<div class="cmp-row cmp-row-head"><div class="cmp-cell">${nameBtn(a)}</div><div class="cmp-label"></div><div class="cmp-cell">${nameBtn(b)}</div></div>`
      + ROWS.map(([label, value, key]) => {
        const match = key && same(key, a) === same(key, b);
        return `<div class="cmp-row"><div class="cmp-cell">${value(a)}</div><div class="cmp-label"><span>${label}</span>${match ? `<em>Same</em>` : ""}</div><div class="cmp-cell">${value(b)}</div></div>`;
      }).join("");
  }
  const nameBtn = (s) => `<button type="button" class="cmp-name" data-open="${s.id}" style="--tone: ${tone(s)}">${esc(s.name)}${icon("arrowUp", 14)}</button>`;

  function render(first) {
    const a = get(pick.a), b = get(pick.b);
    for (const key of ["a", "b"]) {
      const el = root.querySelector(`[data-slot="${key}"]`), s = get(pick[key]);
      el.querySelector("select").value = s.id;
      el.querySelector(".cmp-mark").innerHTML = IX.mark(s, 46);
      el.style.setProperty("--tone", tone(s));
    }
    root.querySelector(".cmp-over").innerHTML = overlapHtml(a, b);
    root.querySelector(".cmp-rows").innerHTML = rowsHtml(a, b);
    root.querySelectorAll(".cmp-pairs button").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.a === pick.a && btn.dataset.b === pick.b)));
    if (!first && !reduced()) {
      root.querySelectorAll(".cmp-lane b, .cmp-band").forEach((el) => el.animate([{ transform: "scaleX(.6)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" }));
      root.querySelector(".cmp-rows").animate([{ opacity: .3 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
    }
  }

  on("compare", (id) => {
    if (pick.b === id) pick.b = pick.a;
    pick.a = id;
    if (pick.a === pick.b) pick.b = S.scholars.find((s) => s.id !== id).id;
    render();
    root.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  });
  return { mount };
})();
