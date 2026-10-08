// The face of the Teachers page: a headline, a short welcome, a search, the figures, and every teacher as a small
// mark on one gentle arc of time (left = the first birth, right = today), placed by the year they were born.
// Marks ease in one after another; pointing at one shows who they were; choosing one opens their profile.
window.Sections = window.Sections || {};
(() => {
  const people = AUTHORS.people;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const START = Math.floor(people[0].born / 100) * 100, END = THIS_YEAR;
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const tokens = (person) => person.name.split(/\s+/).filter(Boolean);
  const initials = (person) => { const t = tokens(person); return (t[0][0] + t[t.length - 1][0]).toUpperCase(); };
  const tone = (person) => `var(${familyOf(person).tone})`;
  const JUMPS = [["bible", "Through the Bible"], ["cities", "Where they served"], ["lives", "When they lived"], ["directory", "Everyone"]];
  // Three famous works the library holds and can open, across three centuries (kept only if the data still says so).
  const READS = [["Calvin", "Institutes"], ["Edwards", "Religious Affections"], ["Spurgeon", "Morning and Evening"]]
    .map(([short, title]) => { const p = people.find((x) => x.short === short); const k = p?.known.find((w) => w.t.includes(title) && w.inLibrary && w.u); return k && { p, k }; })
    .filter(Boolean);

  const el = {};
  let width = 0, positions = [], hotId = null, introDone = reduced;

  function figures() {
    const works = people.reduce((s, p) => s + p.works, 0), sermons = people.reduce((s, p) => s + (p.genres.sermon ?? 0), 0);
    const living = people.filter((p) => !p.died).length;
    return [["Teachers", people.length, `${living} still living`], ["Works", formatNumber(works), "in the library"],
      ["Sermons", formatNumber(sermons), "among those works"], ["Since", people[0].born, `${END - people[0].born} years to today`]]
      .map(([dt, dd, small]) => `<div><dt>${dt}</dt><dd>${dd}</dd><small>${small}</small></div>`).join("");
  }

  function html() {
    const first = people[0];
    const countWord = people.length === 47 ? "Forty-seven" : String(people.length);
    return `<div class="lnd">
      <div class="lnd-top">
        <div class="lnd-copy">
          <p class="kicker lnd-kicker">Teachers in the library</p>
          <h1 class="lnd-title">Five centuries of teachers.<br><em>One open Bible.</em></h1>
          <p class="lnd-lead">${countWord} pastors, preachers and missionaries, from ${esc(first.name)} in ${esc(first.places.at(-1)[0])} to teachers still living today.
            Their sermons and books are in the library. Find one you know, or meet someone new.</p>
          <div class="lnd-find">
            <label class="lnd-search">${icon("search", 17)}<input type="search" placeholder="Find a teacher or a city" aria-label="Find a teacher or a city"
              autocomplete="off" aria-controls="lnd-results" aria-expanded="false"></label>
            <ul class="lnd-results" id="lnd-results" role="listbox" aria-label="Matching teachers" hidden></ul>
          </div>
        </div>
        <dl class="lnd-figs">${figures()}</dl>
      </div>
      <div class="lnd-band">
        <p class="lnd-band-cap"><span class="lnd-pulse"></span>Each circle is one teacher, placed by the year they were born.</p>
        <svg class="lnd-art" aria-hidden="true"><g class="lnd-grid"></g><path class="lnd-arc" pathLength="1"/></svg>
        <div class="lnd-marks">${people.map((p) => `<button type="button" class="lnd-mark" data-id="${p.id}" style="--tone:${tone(p)}" aria-label="${esc(p.name)}, ${lifeLabel(p)}">
          <span class="lnd-in"><span class="lnd-disc">${initials(p)}</span></span></button>`).join("")}</div>
        <div class="lnd-tip" aria-hidden="true"></div>
        <div class="lnd-axis" aria-hidden="true"></div>
      </div>
      <div class="lnd-under">
        <ul class="lnd-legend">${FAMILIES.filter((f) => people.some((p) => familyOf(p).key === f.key)).map((f) => `<li><i style="background:var(${f.tone})"></i>${f.label}</li>`).join("")}</ul>
        <nav class="lnd-jump" aria-label="On this page">${JUMPS.map(([id, label]) => `<a href="#${id}">${label}${icon("arrowRight", 14)}</a>`).join("")}</nav>
      </div>
      ${READS.length ? `<div class="lnd-reads">
        <div class="lnd-reads-head"><p class="kicker">Start reading</p><p>${READS.length === 3 ? "Three" : READS.length} of their best-known works, ready to open.</p></div>
        <div class="lnd-read-grid">${READS.map(({ p, k }) => `<article class="lnd-read" style="--tone:${tone(p)}">
          <span class="lnd-read-year">${k.y}</span>
          <h3><a href="${esc(k.u)}" target="_blank" rel="noopener">${esc(k.t)}</a></h3>
          <div class="lnd-read-foot"><button type="button" data-id="${p.id}"><i></i>${esc(p.name)}</button><span class="lnd-read-go">Read${icon("arrowUp", 15)}</span></div>
        </article>`).join("")}</div></div>` : ""}
    </div>`;
  }

  // Marks sit on a gentle arc; where births crowd together they stack above and below it without touching.
  function layout() {
    const W = el.band.clientWidth;
    if (!W || W === width) return;
    width = W;
    const r = W < 560 ? 11 : W < 960 ? 15 : 18, gap = W < 560 ? 2 : 4, D = 2 * r + gap;
    const pad = r + (W < 560 ? 12 : 26), amp = W < 560 ? 10 : 22;
    const sx = (year) => pad + ((year - START) / (END - START)) * (W - 2 * pad);
    const lift = (x) => -amp * Math.sin(Math.PI * (x / W));
    const placed = [];
    for (const p of people) {
      const x = sx(p.born), near = placed.filter((q) => Math.abs(q.x - x) < D), cands = [0];
      for (const q of near) { const h = Math.sqrt(D * D - (q.x - x) ** 2); cands.push(q.off + h, q.off - h); }
      cands.sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
      const off = cands.find((c) => near.every((q) => Math.hypot(q.x - x, q.off - c) >= D - 0.01));
      placed.push({ p, x, off });
    }
    const top = W < 560 ? 52 : 58, bottom = W < 560 ? 40 : 44;
    const minOff = Math.min(...placed.map((q) => q.off + lift(q.x))) - r, maxOff = Math.max(...placed.map((q) => q.off + lift(q.x))) + r;
    const base = top - minOff, H = Math.ceil(base + maxOff + bottom);
    positions = placed.map((q) => ({ id: q.p.id, x: q.x, y: base + lift(q.x) + q.off, r }));
    el.band.style.height = `${H}px`;
    el.band.style.setProperty("--r", `${r}px`);
    positions.forEach((pos, i) => {
      const m = el.marks[i];
      m.style.setProperty("--x", `${pos.x.toFixed(1)}px`);
      m.style.setProperty("--y", `${pos.y.toFixed(1)}px`);
    });
    // The arc itself, the century lines and their labels.
    let d = "";
    for (let i = 0; i <= 48; i++) { const x = (W * i) / 48; d += `${i ? "L" : "M"}${x.toFixed(1)} ${(base + lift(x)).toFixed(1)}`; }
    el.arc.setAttribute("d", d);
    el.art.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const centuries = [];
    for (let y = START; y <= END; y += 100) centuries.push(y);
    el.grid.innerHTML = centuries.map((y) => `<line x1="${sx(y).toFixed(1)}" x2="${sx(y).toFixed(1)}" y1="${top - 22}" y2="${H - 26}"/>`).join("")
      + `<circle class="lnd-today" cx="${sx(END).toFixed(1)}" cy="${(base + lift(sx(END))).toFixed(1)}" r="3"/>`;
    el.axis.innerHTML = centuries.map((y) => `<span style="left:${sx(y).toFixed(1)}px">${y}</span>`).join("")
      + (W >= 560 ? `<span class="lnd-axis-now" style="left:${sx(END).toFixed(1)}px">Today</span>` : "");
    if (hotId) showTip(hotId);
  }

  function intro() {
    if (introDone) return;
    introDone = true;
    el.band.classList.add("lnd-ready");
    el.arc.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1400, easing: "cubic-bezier(.65,0,.35,1)", fill: "backwards" });
    el.marks.forEach((m, i) => m.firstElementChild.animate(
      [{ opacity: 0, transform: "translateY(14px) scale(.35)" }, { opacity: 1, transform: "none" }],
      { duration: 700, delay: 260 + i * 34, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }));
  }

  function showTip(id) {
    const p = personById(id), pos = positions.find((q) => q.id === id);
    if (!p || !pos) return;
    hotId = id;
    el.marks.forEach((m) => m.classList.toggle("lnd-hot", m.dataset.id === id));
    const fam = familyOf(p);
    el.tip.style.setProperty("--tone", tone(p));
    el.tip.innerHTML = `<p class="lnd-tip-fam">${esc(fam.label)}</p><p class="lnd-tip-name">${esc(p.name)}</p>
      <p class="lnd-tip-years">${lifeLabel(p)}${p.died ? "" : " · living"}</p><p class="lnd-tip-line">${esc(p.line)}</p>
      <p class="lnd-tip-go">Open profile${icon("arrowRight", 13)}</p>`;
    const W = width, tw = el.tip.offsetWidth, th = el.tip.offsetHeight;
    const x = Math.max(8, Math.min(W - tw - 8, pos.x - tw / 2));
    // Above the mark unless that would slide under the sticky header; then below it.
    const above = el.band.getBoundingClientRect().top + pos.y - pos.r - 14 - th >= 76;
    const y = above ? pos.y - pos.r - 14 - th : pos.y + pos.r + 14;
    el.tip.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    el.tip.classList.add("lnd-tip-on");
  }

  function hideTip() {
    hotId = null;
    el.marks.forEach((m) => m.classList.remove("lnd-hot"));
    el.tip.classList.remove("lnd-tip-on");
  }

  // Search: names and every town they lived in. Matching marks stay lit on the arc; the list offers them to open.
  let results = [], active = -1;
  function search() {
    const q = el.input.value.trim().toLowerCase();
    if (!q) results = [];
    else results = people.map((p) => {
      if (p.name.toLowerCase().includes(q)) return { p, why: "" };
      const town = p.places.find((pl) => pl[0].toLowerCase().includes(q));
      return town ? { p, why: town[0] } : null;
    }).filter(Boolean);
    el.band.classList.toggle("lnd-filtering", Boolean(q));
    const ids = new Set(results.map((r) => r.p.id));
    el.marks.forEach((m) => m.classList.toggle("lnd-match", ids.has(m.dataset.id)));
    active = results.length ? 0 : -1;
    renderResults(q);
  }

  function renderResults(q) {
    el.input.setAttribute("aria-expanded", String(Boolean(q)));
    el.results.hidden = !q;
    if (!q) return;
    el.results.innerHTML = results.length ? results.slice(0, 7).map((r, i) => `<li role="option" aria-selected="${i === active}"><button type="button" data-id="${r.p.id}" tabindex="-1">
        <i style="--tone:${tone(r.p)}"></i><span><b>${esc(r.p.name)}</b><small>${lifeLabel(r.p)}${r.why ? ` · lived in ${esc(r.why)}` : ""}</small></span>${icon("arrowRight", 14)}</button></li>`).join("")
        + (results.length > 7 ? `<li class="lnd-more">${results.length - 7} more lit on the arc below</li>` : "")
      : `<li class="lnd-more">No teacher or town matches “${esc(el.input.value.trim())}”.</li>`;
  }

  function open(id) { window.Teachers?.openProfile(id); }

  function wire(section) {
    el.band.addEventListener("pointerover", (e) => { const m = e.target.closest(".lnd-mark"); if (m && m.dataset.id !== hotId) showTip(m.dataset.id); });
    el.band.addEventListener("pointerleave", hideTip);
    el.band.addEventListener("focusin", (e) => { const m = e.target.closest(".lnd-mark"); if (m) showTip(m.dataset.id); });
    el.band.addEventListener("focusout", hideTip);
    el.band.addEventListener("click", (e) => { const m = e.target.closest(".lnd-mark"); if (m) open(m.dataset.id); });
    el.input.addEventListener("input", search);
    el.input.addEventListener("keydown", (e) => {
      const shown = Math.min(7, results.length);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!shown) return;
        e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + shown) % shown;
        renderResults(el.input.value.trim());
      } else if (e.key === "Enter" && active >= 0) { e.preventDefault(); open(results[active].p.id); }
      else if (e.key === "Escape") { el.input.value = ""; search(); }
    });
    el.results.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) open(b.dataset.id); });
    el.results.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-id]"); if (b) showTip(b.dataset.id); });
    el.results.addEventListener("pointerleave", hideTip);
    document.addEventListener("pointerdown", (e) => { if (!e.target.closest(".lnd-find") && el.input.value) { el.results.hidden = true; el.input.setAttribute("aria-expanded", "false"); } });
    el.input.addEventListener("focus", () => { if (el.input.value.trim()) renderResults(el.input.value.trim()); });
    section.querySelectorAll(".lnd-jump a").forEach((a) => a.addEventListener("click", (e) => {
      const target = document.getElementById(a.getAttribute("href").slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", a.getAttribute("href"));
    }));
    section.querySelector(".lnd-reads")?.addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (b) open(b.dataset.id); });
  }

  function mount(section) {
    section.innerHTML = html();
    el.band = section.querySelector(".lnd-band");
    el.marks = [...section.querySelectorAll(".lnd-mark")];
    el.tip = section.querySelector(".lnd-tip");
    el.axis = section.querySelector(".lnd-axis");
    el.art = section.querySelector(".lnd-art");
    el.arc = section.querySelector(".lnd-arc");
    el.grid = section.querySelector(".lnd-grid");
    el.input = section.querySelector(".lnd-search input");
    el.results = section.querySelector(".lnd-results");
    if (reduced) el.band.classList.add("lnd-ready");
    let raf = 0;
    new ResizeObserver(() => { raf ||= requestAnimationFrame(() => { raf = 0; layout(); }); }).observe(el.band);
    layout();
    wire(section);
    // Start the entrance once the band is on screen (it usually is, straight away).
    const io = new IntersectionObserver((entries) => { if (entries.some((x) => x.isIntersecting)) { io.disconnect(); intro(); } }, { threshold: 0.2 });
    io.observe(el.band);
  }

  Sections.landing = { mount };
})();
