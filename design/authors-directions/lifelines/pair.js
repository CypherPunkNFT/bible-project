// 02 · Two lives side by side: pick any two people; their lives line up, shared years and shared cities light up.
window.Pair = (() => {
  const PEOPLE = AUTHORS.people;
  const st = { a: "author-john-calvin", b: "author-john-knox" };
  let root, svgHost, say, width = 0;

  // Cities where both lived at the same time (from the year each arrived until they moved on or died).
  function sharedPlaces(p, q) {
    const out = [];
    for (const x of L.stays(p)) for (const y of L.stays(q)) {
      if (x.name !== y.name) continue;
      const start = Math.max(x.start, y.start), end = Math.min(x.end, y.end);
      if (end > start) out.push({ name: x.name, start, until: Math.min(x.until, y.until) });
    }
    return out.sort((m, n) => m.start - n.start);
  }
  const span = (s) => (s.until > s.start ? `from ${s.start} until ${s.until}` : `in ${s.start}`);
  const ageAt = (p, year) => (year === p.born ? `${L.esc(p.short)} was born there` : `${L.esc(p.short)} was ${p.circa ? "about " : ""}${year - p.born}`);

  function sentence(p, q) {
    const s = Math.max(p.born, q.born), e = Math.min(lifeEnd(p), lifeEnd(q));
    const link = AUTHORS.links.find((l) => (l.from === p.id && l.to === q.id) || (l.from === q.id && l.to === p.id));
    const note = link ? `<span class="link-note">On record between them: ${L.esc(link.note)}</span>` : "";
    const A = `<b>${L.esc(p.short)}</b>`, B = `<b>${L.esc(q.short)}</b>`;
    if (e < s) {
      const [first, second] = lifeEnd(p) < q.born ? [p, q] : [q, p];
      const gap = second.born - first.died;
      return `${L.esc(first.short)} died in ${first.died}, ${gap === 0 ? "the same year" : `${L.plural(gap, "year")} before`} ${L.esc(second.short)} was born. Their lives never overlapped.${note}`;
    }
    const years = e - s;
    let text = !p.died && !q.died ? `${A} and ${B} have both been alive since ${s}.`
      : years === 0 ? `${A} and ${B} were both alive only in ${s}.`
      : `${A} and ${B} were both alive for ${L.plural(years, "year")}, from ${s} to ${e}.`;
    const shared = sharedPlaces(p, q);
    if (shared.length) {
      const first = shared[0];
      text += ` They lived in the same city: ${shared.slice(0, 3).map((x, i, all) => (i && all[i - 1].name === x.name ? `again ${span(x)}` : `${L.esc(x.name)} ${span(x)}`)).join(", and ")}. In ${first.start}, ${ageAt(p, first.start)} and ${ageAt(q, first.start)}.`;
    } else text += " The places on record never put them in the same city at the same time.";
    return text + note;
  }

  // ── The drawing: two lives, cut into the places they lived; the shared years marked on the axis. ──
  function draw() {
    const p = personById(st.a), q = personById(st.b), W = width;
    if (!W) return;
    const lo = Math.floor((Math.min(p.born, q.born) - 3) / 10) * 10, hi = Math.ceil((Math.max(lifeEnd(p), lifeEnd(q)) + 3) / 10) * 10;
    const pad = 6, X = (y) => pad + ((y - lo) / (hi - lo)) * (W - pad * 2);
    const rows = [{ p, y: 28, label: 16 }, { p: q, y: 78, label: 112 }], H = 168, barH = 18;
    const parts = [];
    const s = Math.max(p.born, q.born), e = Math.min(lifeEnd(p), lifeEnd(q));
    if (e >= s) parts.push(`<rect class="fade" x="${X(s)}" y="${rows[0].y - 6}" width="${Math.max(2, X(e) - X(s))}" height="${rows[1].y - rows[0].y + barH + 12}" rx="8" fill="var(--accent)" fill-opacity=".07"/>`);
    for (const sp of sharedPlaces(p, q)) {
      const x1 = X(sp.start), x2 = Math.max(x1 + 3, X(sp.until === sp.start ? sp.start + 1 : sp.until));
      parts.push(`<g class="fade" style="animation-delay:.45s"><rect x="${x1}" y="${rows[0].y - 4}" width="${x2 - x1}" height="${rows[1].y - rows[0].y + barH + 8}" rx="6" fill="var(--accent)" fill-opacity=".16" stroke="var(--accent)" stroke-width="1.2"/>
        <text x="${(x1 + x2) / 2}" y="${(rows[0].y + barH + rows[1].y) / 2 + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--accent)">${L.esc(sp.name)}</text></g>`);
    }
    rows.forEach((r, k) => {
      const tone = `var(${familyOf(r.p).tone})`;
      const segs = L.stays(r.p).map((sg, i) => {
        const x1 = X(sg.start), x2 = X(sg.last ? lifeEnd(r.p) : sg.end), w = Math.max(1.5, x2 - x1 - (sg.last ? 0 : 1.5));
        const fits = sg.name.length * 6.3 + 12 < w;
        return `<rect x="${x1}" y="${r.y}" width="${w}" height="${barH}" rx="4" fill="${tone}" fill-opacity="${i % 2 ? 0.72 : 1}"><title>${L.esc(sg.name)}, from ${sg.start}</title></rect>
          ${fits ? `<text x="${x1 + 7}" y="${r.y + 12.5}" font-size="10.5" font-weight="600" fill="var(--page)" pointer-events="none">${L.esc(sg.name)}</text>` : ""}`;
      }).join("");
      const first = r.p.places[0][3], unknownYears = first > r.p.born
        ? `<rect x="${X(r.p.born)}" y="${r.y + 0.5}" width="${Math.max(1, X(first) - X(r.p.born) - 1.5)}" height="${barH - 1}" rx="4" fill="none" stroke="${tone}" stroke-dasharray="3 3"><title>Where they lived before ${first} is not recorded</title></rect>` : "";
      const nx = Math.min(Math.max(X(r.p.born), pad), W - 180);
      parts.push(`<g class="grow" style="animation-delay:${k * 0.12}s">${unknownYears}${segs}</g>
        <text class="who" data-person="${r.p.id}" x="${nx}" y="${r.label}" font-size="13" fill="var(--ink)" style="cursor:pointer"><tspan font-weight="600">${L.esc(r.p.name)}</tspan><tspan fill="var(--muted)" dx="8">${lifeLabel(r.p)}${r.p.died ? "" : "today"}</tspan></text>`);
    });
    // Axis with the shared years in accent.
    const ay = 140, step = [10, 20, 25, 50, 100].find((t) => ((W - pad * 2) * t) / (hi - lo) >= 46) ?? 100;
    parts.push(`<line x1="${pad}" x2="${W - pad}" y1="${ay}" y2="${ay}" stroke="var(--line)"/>`);
    for (let y = Math.ceil(lo / step) * step; y <= hi; y += step) parts.push(`<line x1="${X(y)}" x2="${X(y)}" y1="${ay}" y2="${ay + 5}" stroke="var(--line)"/><text x="${X(y)}" y="${ay + 18}" text-anchor="middle" font-size="10" fill="var(--muted)">${y}</text>`);
    if (e >= s) parts.push(`<line class="fade" x1="${X(s)}" x2="${Math.max(X(s) + 2, X(e))}" y1="${ay}" y2="${ay}" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>`);
    svgHost.innerHTML = `<svg class="pair-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${L.esc(p.name)} and ${L.esc(q.name)} on one timeline">${parts.join("")}</svg>`;
    say.innerHTML = sentence(p, q);
  }

  function options(selected, other) {
    const byCentury = new Map();
    for (const p of PEOPLE) { const c = Math.floor(p.born / 100) * 100; if (!byCentury.has(c)) byCentury.set(c, []); byCentury.get(c).push(p); }
    return [...byCentury].map(([c, list]) => `<optgroup label="Born in the ${c}s">${list.map((p) => `<option value="${p.id}"${p.id === selected ? " selected" : ""}${p.id === other ? " disabled" : ""}>${L.esc(p.name)}</option>`).join("")}</optgroup>`).join("");
  }
  function sync() {
    for (const [key, other] of [["a", "b"], ["b", "a"]]) {
      const sel = root.querySelector(`select[data-k="${key}"]`);
      sel.innerHTML = options(st[key], st[other]);
      sel.parentElement.style.setProperty("--tone", L.toneVar(personById(st[key])));
    }
    root.querySelectorAll(".suggest [data-a]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.a === st.a && c.dataset.b === st.b)));
    draw();
  }
  function choose(a, b) { st.a = a; st.b = b; sync(); }

  // Suggested pairs: people who really shared a city, longest first, no one twice; Calvin and Knox lead.
  function suggestions() {
    const all = [];
    for (let i = 0; i < PEOPLE.length; i++) for (let j = i + 1; j < PEOPLE.length; j++) {
      const sh = sharedPlaces(PEOPLE[i], PEOPLE[j]);
      if (sh.length) all.push({ a: PEOPLE[i], b: PEOPLE[j], place: sh[0].name, years: sh.reduce((n, x) => n + Math.max(1, x.until - x.start), 0) });
    }
    all.sort((m, n) => n.years - m.years);
    const used = new Set(["author-john-calvin", "author-john-knox"]), out = [all.find((x) => x.a.id === "author-john-calvin" && x.b.id === "author-john-knox")];
    for (const x of all) { if (out.length >= 6) break; if (used.has(x.a.id) || used.has(x.b.id)) continue; used.add(x.a.id); used.add(x.b.id); out.push(x); }
    return out.filter(Boolean);
  }

  function mount(container) {
    root = document.createElement("section");
    root.className = "sec";
    root.innerHTML = `${L.head("02", "Two lives side by side", "Did their lives <em>cross?</em>", "Choose any two people. Their lives line up on one timeline, cut into the places they lived; the years they were both alive are shaded, and any city they shared at the same time is marked.")}
      <div class="pair-pick">
        <label class="picker"><i class="dot"></i><select data-k="a" aria-label="First person"></select></label>
        <span class="and">and</span>
        <label class="picker"><i class="dot"></i><select data-k="b" aria-label="Second person"></select></label>
        <button type="button" class="round swap" aria-label="Swap the two people" title="Swap"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/></svg></button>
      </div>
      <div class="suggest"><span class="lab">They shared a city:</span>${suggestions().map((x) => `<button type="button" class="chip" data-a="${x.a.id}" data-b="${x.b.id}" aria-pressed="false">${L.esc(x.a.short)} &amp; ${L.esc(x.b.short)}<small>${L.esc(x.place)}</small></button>`).join("")}</div>
      <div class="card pair-card"><p class="pair-say" aria-live="polite"></p><div class="pair-host"></div></div>`;
    container.append(root);
    svgHost = root.querySelector(".pair-host");
    say = root.querySelector(".pair-say");
    root.querySelectorAll("select").forEach((sel) => sel.addEventListener("change", () => { st[sel.dataset.k] = sel.value; sync(); }));
    root.querySelector(".swap").addEventListener("click", () => choose(st.b, st.a));
    root.querySelector(".suggest").addEventListener("click", (e) => { const c = e.target.closest("[data-a]"); if (c) choose(c.dataset.a, c.dataset.b); });
    svgHost.addEventListener("click", (e) => { const t = e.target.closest("[data-person]"); if (t) L.Profile.open(t.dataset.person); });
    L.onResize(svgHost, (w) => { width = w; draw(); });
    width = svgHost.clientWidth;
    sync();
  }
  return { mount, sharedPlaces };
})();
