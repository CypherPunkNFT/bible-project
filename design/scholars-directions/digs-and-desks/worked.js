// 02 · Where they worked: every scholar's city on the Mediterranean-to-Britain map, one dot each, coloured by field.
// An era stepper fades out everyone outside that age and reframes the map; the scholars who worked in America sit in a
// small inset cut from the world map, beside the list of who was at work in that age.
(() => {
  const { S, esc, years, tone, pt, MapStage, eraParts } = DD;
  const ERAS = ["all", ...Object.keys(S.eras)];
  const eraLabel = (key) => (key === "all" ? ["All ages", `All ${S.scholars.length}`] : eraParts(key));
  const inEra = (s, era) => era === "all" || s.era === era;
  const abroad = S.scholars.filter((s) => !pt("med", s.id));

  function insetHtml() {
    const pts = abroad.map((s) => pt("world", s.id)), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 34, h = w / 2, x = Math.min(...xs) - 17, y = (Math.max(...ys) + Math.min(...ys)) / 2 - h / 2;
    const cities = {};
    for (const s of abroad) (cities[s.place[0]] ||= []).push(s);
    return `<svg class="dd-inset-map" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="Map of the eastern United States with the scholars who worked there">
        <rect class="dd-water" x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}"/><use href="#dd-land-world" class="dd-landpath"/>
        ${abroad.map((s) => { const p = pt("world", s.id); return `<circle class="dd-inset-dot" data-sid="${s.id}" cx="${p[0]}" cy="${p[1]}" r="${(w / 120).toFixed(2)}" style="--tone:${tone(s)}"/>`; }).join("")}</svg>
      <ul class="dd-cities">${Object.entries(cities).map(([city, people]) => `<li><span>${esc(city)}</span>${people.map((s) =>
        `<button type="button" class="dd-name" data-sid="${s.id}" data-era="${s.era}" style="--tone:${tone(s)}"><i></i>${esc(s.short)}</button>`).join("")}</li>`).join("")}</ul>`;
  }

  function addDots(stage) {
    const groups = {};
    for (const s of S.scholars) { const p = pt("med", s.id); if (p) (groups[p.join(",")] ||= { p, people: [] }).people.push(s); }
    const dots = [], labels = [];
    for (const g of Object.values(groups)) {
      const n = g.people.length, ring = n > 1 ? 6 + n : 0;
      g.people.forEach((s, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n, el = document.createElement("button");
        el.type = "button"; el.className = "dd-mk dd-dot"; el.dataset.sid = s.id; el.style.setProperty("--tone", tone(s));
        el.setAttribute("aria-label", `${s.name}, ${s.place[0]}`);
        el.innerHTML = "<i></i>";
        dots.push(stage.add({ el, x: g.p[0], y: g.p[1], dx: ring * Math.cos(a), dy: ring * Math.sin(a), s }));
      });
      const el = document.createElement("div");
      el.className = "dd-mk dd-mk-city"; el.innerHTML = `<span class="dd-lab">${esc(g.people[0].place[0])}</span>`;
      labels.push(stage.add({ el, x: g.p[0], y: g.p[1], label: el.firstElementChild, gap: ring + 9, people: g.people, labelLeft: g.p[0] < 260 && g.p[0] > 200 && g.p[1] > 140 }));
    }
    return { dots, labels };
  }

  DD.mountWorked = (host) => {
    const fields = Object.entries(S.fields);
    host.insertAdjacentHTML("beforeend", `<section class="dd-sec dd-worked" id="worked">
      <div class="dd-head"><p class="kicker" style="--tone:var(--prophets)">02 · Where they worked</p><h2>Where they worked, <em style="--tone:var(--prophets)">age by age.</em></h2>
        <p>Each dot is one scholar, in the city where they mainly worked, coloured by their field. Step through the ages to see who was at work where.</p></div>
      <div class="dd-eras"><button type="button" class="dd-era-step" data-dir="-1" aria-label="Earlier age">${icon("arrowLeft", 16)}</button>
        <div class="dd-era-track"><span class="dd-era-pill" aria-hidden="true"></span>${ERAS.map((key) => { const [name, range] = eraLabel(key);
          return `<button type="button" class="dd-era" data-era="${key}" aria-pressed="false"><b>${esc(name)}</b><small>${esc(range)}</small></button>`; }).join("")}</div>
        <button type="button" class="dd-era-step" data-dir="1" aria-label="Later age">${icon("arrowRight", 16)}</button></div>
      <div class="dd-worked-grid">
        <figure class="dd-medcard"><div class="dd-stages dd-stages-med"><div class="dd-tip" hidden></div></div>
          <ul class="dd-legend">${fields.map(([key, label]) => `<li style="--tone:var(${DD.FIELD_TONE[key]})"><i></i>${esc(label)}</li>`).join("")}</ul></figure>
        <aside class="dd-side">
          <div class="dd-age"><p class="dd-age-h" aria-live="polite"></p><ul class="dd-age-list"></ul></div>
          <div class="dd-atlantic"><p class="kicker">Across the Atlantic</p><p class="dd-atl-note"></p>${insetHtml()}</div>
        </aside>
      </div></section>`);
    const sec = host.lastElementChild, stagesEl = sec.querySelector(".dd-stages-med"), tip = sec.querySelector(".dd-tip");
    const stage = new MapStage(stagesEl, "med", { minW: 220, cls: "dd-on-stage" });
    const { dots, labels } = addDots(stage);
    stagesEl.append(tip);
    let era = null;

    function setEra(next) {
      if (next === era) return;
      era = next;
      const people = S.scholars.filter((s) => inEra(s, era)), local = people.filter((s) => pt("med", s.id)), cities = new Set(people.map((s) => s.place[0]));
      for (const d of dots) d.el.classList.toggle("dd-dim", !inEra(d.s, era));
      for (const l of labels) { const n = l.people.filter((s) => inEra(s, era)).length; l.hideLabel = n === 0; l.priority = n; }
      sec.querySelectorAll(".dd-era").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.era === era)));
      const btn = sec.querySelector(`.dd-era[data-era="${era}"]`), pill = sec.querySelector(".dd-era-pill");
      pill.style.width = `${btn.offsetWidth}px`; pill.style.transform = `translateX(${btn.offsetLeft}px)`;
      const track = sec.querySelector(".dd-era-track");
      track.scrollTo({ left: btn.offsetLeft - track.clientWidth / 2 + btn.offsetWidth / 2, behavior: DD.reduced() ? "auto" : "smooth" });
      const [name] = eraLabel(era);
      sec.querySelector(".dd-age-h").innerHTML = `<b>${people.length} scholars</b> · ${esc(name)}, in ${cities.size} ${cities.size === 1 ? "city" : "cities"}`;
      sec.querySelector(".dd-age-list").innerHTML = people.map((s) => `<li><button type="button" class="dd-row" data-sid="${s.id}" style="--tone:${tone(s)}"><i></i>
        <span><b>${esc(s.name)}</b><small>${esc(s.place[0])} · ${years(s)}</small></span><em>${esc(DD.faith(s))}</em></button></li>`).join("");
      const away = people.filter((s) => !pt("med", s.id));
      sec.querySelector(".dd-atl-note").textContent = away.length ? `${away.length} worked in America${era === "all" ? ", all in the modern age" : ""}.` : "No one in this age worked across the Atlantic.";
      sec.querySelectorAll(".dd-atlantic [data-sid]").forEach((el) => el.classList.toggle("dd-dim", !inEra(DD.byId[el.dataset.sid], era)));
      tip.hidden = true;
      stage.fly(local.length ? stage.fit(local.map((s) => pt("med", s.id)), 60, era === "all" ? 1000 : 220) : stage.cam);
    }

    function showTip(d) {
      const s = d.s;
      tip.style.setProperty("--tone", tone(s));
      tip.innerHTML = `<p class="kicker">${esc(DD.field(s))}</p><b>${esc(s.name)}</b><small>${years(s)} · ${esc(s.place[0])}</small><em>${esc(DD.faith(s))}</em>`;
      tip.hidden = false;
      const w = tip.offsetWidth, h = tip.offsetHeight, x = Math.min(stage.cw - w - 8, Math.max(8, d.sx - w / 2)), y = d.sy - h - 14 < 8 ? d.sy + 14 : d.sy - h - 14;
      tip.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`;
    }
    const hot = (id, on) => { const d = dots.find((x) => x.s.id === id); if (d) d.el.classList.toggle("dd-hot", on); sec.querySelectorAll(`.dd-inset-dot[data-sid="${id}"]`).forEach((c) => c.classList.toggle("dd-hot", on)); };

    stagesEl.addEventListener("pointerover", (e) => { const el = e.target.closest(".dd-dot"); if (el && e.pointerType !== "touch") showTip(dots.find((d) => d.el === el)); });
    stagesEl.addEventListener("pointerout", (e) => { if (e.target.closest(".dd-dot")) tip.hidden = true; });
    sec.addEventListener("pointerover", (e) => { const r = e.target.closest(".dd-row, .dd-name"); if (r) hot(r.dataset.sid, true); });
    sec.addEventListener("pointerout", (e) => { const r = e.target.closest(".dd-row, .dd-name"); if (r) hot(r.dataset.sid, false); });
    sec.addEventListener("click", (e) => {
      const who = e.target.closest("[data-sid]"), b = e.target.closest(".dd-era"), step = e.target.closest(".dd-era-step");
      if (who) DD.openProfile(who.dataset.sid);
      else if (b) setEra(b.dataset.era);
      else if (step) setEra(ERAS[Math.min(ERAS.length - 1, Math.max(0, ERAS.indexOf(era) + Number(step.dataset.dir)))]);
    });
    stage.jump(stage.fit(dots.map((d) => [d.x, d.y]), 60, 1000));
    setEra("all");
    new ResizeObserver(() => { const btn = sec.querySelector(".dd-era[aria-pressed='true']"), pill = sec.querySelector(".dd-era-pill"); if (btn) { pill.style.width = `${btn.offsetWidth}px`; pill.style.transform = `translateX(${btn.offsetLeft}px)`; } }).observe(sec.querySelector(".dd-era-track"));
  };
})();
