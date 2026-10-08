// 03 · Handed on: the documented teacher, colleague and influence links drawn as curves between lives.
window.Relay = (() => {
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
  for (const c of CHAINS) if (c.ids) for (const x of c.ids) if (!personById(x)) throw new Error(`relay: chain "${c.key}" names ${x}, which is not in AUTHORS.people`);
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

  let root, host, note, chips, svg, width = 0, chain = CHAINS[0];

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
      parts.push(`<g class="lane" data-id="${p.id}"><line x1="${X(p.born)}" x2="${X(lifeEnd(p))}" y1="${ly}" y2="${ly}" stroke="var(${familyOf(p).tone})" stroke-width="3" stroke-linecap="round"/>
        <text class="who" data-person="${p.id}" x="${X(p.born) - 6}" y="${ly + 3.5}" text-anchor="end" font-size="${narrow ? 9.5 : 11}" fill="var(--ink)">${L.esc(p.short)}</text></g>`);
    }
    for (const l of LINKS) {
      const ya = laneY.get(l.from), yb = laneY.get(l.to), { s, e } = overlap(l);
      let d, x1, x2;
      if (e >= s) { // lives overlapped: a bowed line between the two lanes, in their shared years
        x1 = x2 = X((s + e) / 2);
        const k = Math.max(10, Math.min(46, Math.abs(yb - ya) * 0.35));
        d = `M${x1},${ya} C${x1 + k},${ya} ${x2 + k},${yb} ${x2},${yb}`;
      } else { // handed on across a gap: from the end of one life to the start of the next
        x1 = X(lifeEnd(l.a)); x2 = X(l.b.born);
        const m = (x2 - x1) / 2;
        d = `M${x1},${ya} C${x1 + m},${ya} ${x2 - m},${yb} ${x2},${yb}`;
      }
      parts.push(`<g class="link" data-k="${l.k}"><path class="arc" d="${d}"/><circle cx="${x1}" cy="${ya}" r="2.6" fill="var(--accent)"/><circle cx="${x2}" cy="${yb}" r="2.6" fill="var(--accent)"/><path class="hit" d="${d}"/></g>`);
    }
    host.innerHTML = `<svg class="relay-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Documented links between lives">${parts.join("")}</svg>`;
    svg = host.firstElementChild;
    applyChain(false);
  }

  function applyChain(animate) {
    const on = new Set(linksOf(chain).map((l) => l.k)), people = new Set(chain.ids ?? []);
    svg.classList.toggle("focus", Boolean(chain.ids));
    svg.querySelectorAll(".lane").forEach((g) => g.classList.toggle("on", people.has(g.dataset.id)));
    const ordered = linksOf(chain).map((l) => svg.querySelector(`.link[data-k="${l.k}"]`));
    svg.querySelectorAll(".link").forEach((g) => g.querySelector(".arc").classList.toggle("on", Boolean(chain.ids) && on.has(+g.dataset.k)));
    if (!animate || L.REDUCED || !chain.ids) return;
    ordered.forEach((g, i) => { // the relay: each hand-off draws in after the one before
      const arc = g.querySelector(".arc"), len = arc.getTotalLength();
      arc.style.strokeDasharray = `${len}`;
      arc.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 650, delay: 150 + i * 320, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
    });
  }

  const who = (p) => `<button type="button" data-person="${p.id}">${L.esc(p.short)}</button>`;
  function writeNote() {
    const list = linksOf(chain);
    if (chain.ids) {
      note.innerHTML = `<h3>${L.esc(chain.label)}</h3><ol class="steps">${list.map((l, i) => {
        const gap = gapOf(l), { s, e } = overlap(l);
        return `<li style="animation-delay:${i * 0.08}s"><div class="pair">${who(l.a)} <span>→</span> ${who(l.b)}</div><p>${L.esc(l.note)}</p>
          <span class="gap">${gap > 0 ? `${L.plural(gap, "year")} between one life and the next` : `Lives overlapped ${L.plural(e - s, "year")}`}</span></li>`;
      }).join("")}</ol>`;
      return;
    }
    const across = LINKS.filter((l) => gapOf(l) > 0).sort((m, n) => gapOf(n) - gapOf(m)), longest = across[0];
    const people = new Set(LINKS.flatMap((l) => [l.from, l.to]));
    note.innerHTML = `<h3>All ${LINKS.length} links</h3><p>${LINKS.length} documented links join ${people.size} of the people here. ${across.length} of them reach across years when neither was alive; the longest, ${L.esc(longest.a.short)} to ${L.esc(longest.b.short)}, spans ${L.plural(gapOf(longest), "year")}.</p>
      <ol class="steps">${across.map((l) => `<li><div class="pair">${who(l.a)} <span>→</span> ${who(l.b)}</div><p>${L.esc(l.note)}</p><span class="gap">${L.plural(gapOf(l), "year")} apart</span></li>`).join("")}</ol>`;
  }

  function setChain(key) {
    chain = CHAINS.find((c) => c.key === key);
    chips.querySelectorAll("[data-chain]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.chain === key)));
    applyChain(true);
    writeNote();
  }

  function showLink(g, x, y) {
    svg.querySelectorAll(".arc.hot").forEach((a) => a.classList.remove("hot"));
    if (!g) { L.Tip.hide(); return; }
    const l = LINKS[+g.dataset.k];
    g.querySelector(".arc").classList.add("hot");
    const gap = gapOf(l);
    L.Tip.show(`<b>${L.esc(l.a.short)} → ${L.esc(l.b.short)}</b>${L.esc(l.note)}${gap > 0 ? `<br><small>${L.plural(gap, "year")} between one life and the next</small>` : ""}`, x, y);
  }

  function mount(container) {
    root = document.createElement("section");
    root.className = "sec";
    root.innerHTML = `${L.head("03", "Handed on", "Who passed it <em>to whom</em>", "Each curve is a documented link: a teacher and a student, two colleagues, or a writer who shaped a later one. Where their lives overlapped the curve sits in their shared years; where they did not, it runs from one death to the next birth. Point at a curve to read the link.")}
      <div class="chains"><span class="lab">Follow</span>${CHAINS.map((c) => `<button type="button" class="chip" data-chain="${c.key}" aria-pressed="${c === chain}">${L.esc(c.label)}<small>${linksOf(c).length}</small></button>`).join("")}</div>
      <div class="relay-grid"><div class="card relay-card"><div class="relay-host"></div></div><div class="card relay-note" aria-live="polite"></div></div>`;
    container.append(root);
    host = root.querySelector(".relay-host");
    note = root.querySelector(".relay-note");
    chips = root.querySelector(".chains");
    chips.addEventListener("click", (e) => { const c = e.target.closest("[data-chain]"); if (c) setChain(c.dataset.chain); });
    root.addEventListener("click", (e) => { const p = e.target.closest("[data-person]"); if (p) L.Profile.open(p.dataset.person); });
    host.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") showLink(e.target.closest(".link"), e.clientX, e.clientY); });
    host.addEventListener("pointerleave", () => showLink(null));
    host.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") showLink(e.target.closest(".link"), e.clientX, e.clientY); });
    addEventListener("scroll", () => { if (document.querySelector(".arc.hot")) showLink(null); }, { passive: true });
    L.onResize(host, (w) => { width = w; draw(); });
    width = host.clientWidth;
    draw();
    writeNote();
    // The first time the section comes into view, the chosen chain draws itself in, hand-off by hand-off.
    const seen = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { seen.disconnect(); applyChain(true); } }, { threshold: 0.35 });
    seen.observe(host);
  }
  return { mount };
})();
