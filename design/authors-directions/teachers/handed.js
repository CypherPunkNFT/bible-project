// 06 · Who passed it to whom (ported from direction A, Lifelines): the documented teacher, colleague and influence
// links drawn as curves between lifelines. Pick a chain and it draws in one link at a time, with numbered notes beside it.
window.Sections = window.Sections || {};
(() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const plural = (n, one, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;
  function onResize(el, fn) {
    let lastWidth = 0, pending = 0;
    new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w === lastWidth) return;
      lastWidth = w;
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => fn(w));
    }).observe(el);
  }
  // One tooltip element for this section, moved with a transform.
  const tip = document.createElement("div");
  tip.className = "hand-tip";
  tip.setAttribute("role", "status");
  let tipW = 0, tipH = 0;
  const Tip = {
    show(html, x, y) {
      if (!tip.isConnected) document.body.append(tip);
      if (tip.dataset.html !== html) { tip.innerHTML = html; tip.dataset.html = html; tipW = tip.offsetWidth; tipH = tip.offsetHeight; }
      const left = x + 16 + tipW > innerWidth - 8 ? x - 16 - tipW : x + 16;
      const top = Math.min(innerHeight - tipH - 8, Math.max(8, y + 14));
      tip.style.transform = `translate(${Math.max(8, left)}px, ${top}px)`;
      tip.classList.add("show");
    },
    hide() { tip.classList.remove("show"); },
  };

  const LINKS = AUTHORS.links.map((l, k) => ({ ...l, k, a: personById(l.from), b: personById(l.to) }));
  const id = (s) => `author-${s}`;
  const CHAINS = [
    { key: "princeton", label: "The Princeton chain", ids: ["archibald-alexander", "charles-hodge", "b-b-warfield", "j-gresham-machen", "john-murray"] },
    { key: "geneva", label: "From Calvin's Geneva", ids: ["john-calvin", "heinrich-bullinger", "john-knox", "francis-turretin", "charles-hodge"] },
    { key: "dutch", label: "The Dutch line", ids: ["abraham-kuyper", "herman-bavinck", "louis-berkhof", "geerhardus-vos", "john-murray"] },
    { key: "awakening", label: "Whitefield and Edwards", ids: ["george-whitefield", "jonathan-edwards", "l13-david-brainerd", "john-newton", "j-c-ryle", "john-piper"] },
    { key: "puritans", label: "Puritans and their readers", ids: ["william-perkins", "william-ames", "richard-sibbes", "thomas-goodwin", "john-owen", "j-i-packer", "martyn-lloyd-jones"] },
    { key: "london", label: "Spurgeon's forebears", ids: ["john-bunyan", "john-gill", "charles-spurgeon"] },
    { key: "all", label: "All links" },
  ].map((c) => ({ ...c, ids: c.ids?.map(id) }));
  for (const c of CHAINS) if (c.ids) for (const x of c.ids) if (!personById(x)) throw new Error(`handed: chain "${c.key}" names ${x}, which is not in AUTHORS.people`);
  const linksOf = (chain) => (chain.ids ? LINKS.filter((l) => chain.ids.includes(l.from) && chain.ids.includes(l.to)) : [...LINKS])
    .sort((m, n) => m.a.born - n.a.born || m.b.born - n.b.born);
  const overlap = (l) => ({ s: Math.max(l.a.born, l.b.born), e: Math.min(lifeEnd(l.a), lifeEnd(l.b)) });
  const gapOf = (l) => { const { s, e } = overlap(l); return e < s ? l.b.born - lifeEnd(l.a) : 0; };

  // Lanes: people grouped by the links that join them (each group in birth order), so each chain reads as a staircase.
  function lanes() {
    const parent = new Map();
    const find = (x) => { while (parent.get(x) !== x) x = parent.get(x); return x; };
    for (const l of LINKS) for (const x of [l.from, l.to]) if (!parent.has(x)) parent.set(x, x);
    for (const l of LINKS) parent.set(find(l.from), find(l.to));
    const groups = new Map();
    for (const x of parent.keys()) { const r = find(x); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(personById(x)); }
    return [...groups.values()].map((g) => g.sort((m, n) => m.born - n.born)).sort((m, n) => m[0].born - n[0].born);
  }
  const LANES = lanes();

  let root, host, note, chips, svg, width = 0, chain = CHAINS[0], numbers = new Map();

  function linkPath(l, laneY, X) {
    const ya = laneY.get(l.from), yb = laneY.get(l.to), { s, e } = overlap(l);
    if (e >= s) { // lives overlapped: a bowed line between the two lanes, in their shared years
      const x = X((s + e) / 2), k = Math.max(10, Math.min(46, Math.abs(yb - ya) * 0.35));
      return { d: `M${x},${ya} C${x + k},${ya} ${x + k},${yb} ${x},${yb}`, x1: x, x2: x, ya, yb };
    }
    const x1 = X(lifeEnd(l.a)), x2 = X(l.b.born), m = (x2 - x1) / 2; // handed on across a gap: one death to the next birth
    return { d: `M${x1},${ya} C${x1 + m},${ya} ${x2 - m},${yb} ${x2},${yb}`, x1, x2, ya, yb };
  }

  function draw() {
    const W = width;
    if (!W) return;
    const narrow = W < 640, padL = narrow ? 56 : 74, padR = 12, top = 30, P = narrow ? 14 : 17, gap = narrow ? 8 : 12;
    const X = (y) => padL + ((y - 1500) / (THIS_YEAR - 1500)) * (W - padL - padR);
    const laneY = new Map();
    let y = top;
    for (const g of LANES) { for (const p of g) { laneY.set(p.id, y); y += P; } y += gap; }
    const H = y - gap + 6, parts = [];
    for (let c = 1500; c <= 2000; c += 100) parts.push(`<line x1="${X(c)}" x2="${X(c)}" y1="20" y2="${H}" stroke="var(--line)"/><text x="${X(c)}" y="12" text-anchor="middle" font-size="10" fill="var(--muted)">${c}</text>`);
    for (const g of LANES) for (const p of g) {
      const ly = laneY.get(p.id);
      parts.push(`<g class="hand-lane" data-id="${p.id}"><line x1="${X(p.born)}" x2="${X(lifeEnd(p))}" y1="${ly}" y2="${ly}" stroke="var(${familyOf(p).tone})" stroke-width="3" stroke-linecap="round"/>
        <text class="hand-who" data-person="${p.id}" x="${X(p.born) - 6}" y="${ly + 3.5}" text-anchor="end" font-size="${narrow ? 9.5 : 11}" fill="var(--ink)">${esc(p.short)}</text></g>`);
    }
    for (const l of LINKS) {
      const { d, x1, x2, ya, yb } = linkPath(l, laneY, X), mx = (x1 + x2) / 2 + (x1 === x2 ? Math.max(10, Math.min(46, Math.abs(yb - ya) * 0.35)) * 0.75 : 0);
      parts.push(`<g class="hand-link" data-k="${l.k}"><path class="hand-arc" d="${d}"/><circle cx="${x1}" cy="${ya}" r="2.6" fill="var(--accent)"/><circle cx="${x2}" cy="${yb}" r="2.6" fill="var(--accent)"/>
        <g class="hand-num" transform="translate(${mx},${(ya + yb) / 2})"><circle r="7.5"/><text text-anchor="middle" y="3.3"></text></g><path class="hand-hit" d="${d}"/></g>`);
    }
    host.innerHTML = `<svg class="hand-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Documented links between lives">${parts.join("")}</svg>`;
    svg = host.firstElementChild;
    applyChain(false);
  }

  // Highlight the chosen chain; number its links in order (matching the notes); optionally draw them in one by one.
  function applyChain(animate) {
    const list = linksOf(chain), on = new Set(list.map((l) => l.k)), people = new Set(chain.ids ?? []);
    numbers = new Map(chain.ids ? list.map((l, i) => [l.k, i + 1]) : []);
    svg.classList.toggle("focus", Boolean(chain.ids));
    svg.querySelectorAll(".hand-lane").forEach((g) => g.classList.toggle("on", people.has(g.dataset.id)));
    svg.querySelectorAll(".hand-link").forEach((g) => {
      const k = +g.dataset.k, n = numbers.get(k);
      g.classList.toggle("on", on.has(k));
      g.querySelector(".hand-arc").classList.toggle("on", Boolean(chain.ids) && on.has(k));
      g.querySelector(".hand-num").classList.toggle("on", Boolean(n));
      g.querySelector(".hand-num text").textContent = n ?? "";
    });
    if (!animate || REDUCED || !chain.ids) return;
    list.forEach((l, i) => { // the relay: each hand-off draws in after the one before
      const g = svg.querySelector(`.hand-link[data-k="${l.k}"]`), arc = g.querySelector(".hand-arc"), len = arc.getTotalLength();
      arc.style.strokeDasharray = `${len}`;
      arc.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 650, delay: 150 + i * 320, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      g.querySelector(".hand-num").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 500 + i * 320, fill: "backwards" });
    });
  }

  const who = (p) => `<button type="button" data-person="${p.id}">${esc(p.short)}</button>`;
  function writeNote() {
    const list = linksOf(chain);
    if (chain.ids) {
      note.innerHTML = `<h3>${esc(chain.label)}</h3><ol class="hand-steps">${list.map((l, i) => {
        const gap = gapOf(l), { s, e } = overlap(l);
        return `<li data-k="${l.k}" style="animation-delay:${i * 0.08}s"><span class="hand-n">${i + 1}</span><div class="hand-pair">${who(l.a)} <span>→</span> ${who(l.b)}</div><p>${esc(l.note)}</p>
          <span class="hand-gap">${gap > 0 ? `${plural(gap, "year")} between one life and the next` : `Lives overlapped ${plural(e - s, "year")}`}</span></li>`;
      }).join("")}</ol>`;
      return;
    }
    const across = LINKS.filter((l) => gapOf(l) > 0).sort((m, n) => gapOf(n) - gapOf(m)), longest = across[0];
    const people = new Set(LINKS.flatMap((l) => [l.from, l.to]));
    note.innerHTML = `<h3>All ${LINKS.length} links</h3><p>${LINKS.length} documented links join ${people.size} of the teachers here. ${across.length} of them reach across years when neither was alive; the longest, ${esc(longest.a.short)} to ${esc(longest.b.short)}, spans ${plural(gapOf(longest), "year")}.</p>
      <ol class="hand-steps plain">${across.map((l) => `<li data-k="${l.k}"><div class="hand-pair">${who(l.a)} <span>→</span> ${who(l.b)}</div><p>${esc(l.note)}</p><span class="hand-gap">${plural(gapOf(l), "year")} apart</span></li>`).join("")}</ol>`;
  }

  function setChain(key) {
    chain = CHAINS.find((c) => c.key === key);
    chips.querySelectorAll("[data-chain]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.chain === key)));
    applyChain(true);
    writeNote();
  }

  function showLink(g, x, y) {
    svg.querySelectorAll(".hand-arc.hot").forEach((a) => a.classList.remove("hot"));
    note.querySelectorAll("li.hot").forEach((li) => li.classList.remove("hot"));
    if (!g) { Tip.hide(); return; }
    const l = LINKS[+g.dataset.k];
    g.querySelector(".hand-arc").classList.add("hot");
    note.querySelector(`li[data-k="${l.k}"]`)?.classList.add("hot");
    const gap = gapOf(l);
    Tip.show(`<b>${esc(l.a.short)} → ${esc(l.b.short)}</b>${esc(l.note)}${gap > 0 ? `<br><small>${plural(gap, "year")} between one life and the next</small>` : ""}`, x, y);
  }

  Sections.handed = {
    mount(sectionEl) {
      root = sectionEl;
      root.innerHTML = `
        <header class="t-head"><span class="t-num">06</span><div><p class="kicker">Handed on</p>
          <h2>Who passed it <em>to whom</em></h2>
          <p>Each curve is a documented link: a teacher and a student, two colleagues, or a writer who shaped a later one. Where their lives overlapped the curve sits in their shared years; where they did not, it runs from one death to the next birth. Point at or tap a curve to read the link.</p></div></header>
        <div class="hand-chains"><span class="hand-lab">Follow</span>${CHAINS.map((c) => `<button type="button" class="hand-chip" data-chain="${c.key}" aria-pressed="${c === chain}">${esc(c.label)}<small>${linksOf(c).length}</small></button>`).join("")}</div>
        <div class="hand-grid"><div class="hand-card hand-chart"><div class="hand-host"></div></div><div class="hand-card hand-note" aria-live="polite"></div></div>`;
      host = root.querySelector(".hand-host");
      note = root.querySelector(".hand-note");
      chips = root.querySelector(".hand-chains");
      chips.addEventListener("click", (e) => { const c = e.target.closest("[data-chain]"); if (c) setChain(c.dataset.chain); });
      root.addEventListener("click", (e) => { const p = e.target.closest("[data-person]"); if (p) { Tip.hide(); window.Teachers?.openProfile?.(p.dataset.person); } });
      host.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") showLink(e.target.closest(".hand-link"), e.clientX, e.clientY); });
      host.addEventListener("pointerleave", () => showLink(null));
      host.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") showLink(e.target.closest(".hand-link"), e.clientX, e.clientY); });
      addEventListener("scroll", () => { if (tip.classList.contains("show")) showLink(null); }, { passive: true });
      onResize(host, (w) => { width = w; draw(); });
      width = host.clientWidth;
      draw();
      writeNote();
      // The first time the section comes into view, the chosen chain draws itself in, hand-off by hand-off.
      const seen = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { seen.disconnect(); applyChain(true); } }, { threshold: 0.35 });
      seen.observe(host);
    },
  };
})();
