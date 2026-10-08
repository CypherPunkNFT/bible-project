// The constellation field: one person at the centre and rings of points around him, drawn only from the data it is
// given, so the same component serves any person page (D draws Moses' people, places, moments and words with it; H draws
// the kinds of people around him). Data:
//   { center: "Moses", rings: [{ key, label, r? }], groups: [{ key, label, tone }],
//     nodes: [{ id, ring, group, label, mark?: "initial"|"diamond"|"numeral"|"dot"|"solid", numeral?, links: [ids] }] }
// Each ring runs in group order clockwise from the top. Choosing a point draws its links and fills the panel.
(() => {
  const C = 500;
  const short = (s, n = 26) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const toneOf = (data, n) => { const g = data.groups.find((x) => x.key === n.group); return g ? (g.tone.startsWith("var(") ? g.tone : `var(--${g.tone})`) : "var(--accent)"; };

  // Positions: radius per ring (given, or spread from 165 to 465), points in group order with a gap at the top for the ring's name.
  function layout(data) {
    const rings = data.rings.map((r, k) => ({ ...r, r: r.r ?? (data.rings.length === 1 ? 300 : 165 + (300 * k) / (data.rings.length - 1)) }));
    const order = data.groups.map((g) => g.key), byId = {};
    rings.forEach((ring, k) => {
      const list = data.nodes.filter((n) => n.ring === ring.key).sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
      // stagger (0..1): each ring starts a little further round, so a label on one ring does not land on a point of the next.
      const base = data.stagger ? .2 + ((k * data.stagger) % 1) * .6 : .5;
      list.forEach((n, i) => { const a = (-90 + 9 + (342 * (i + base)) / list.length) * Math.PI / 180; n.x = C + Math.cos(a) * ring.r; n.y = C + Math.sin(a) * ring.r; n.angle = a; n.tone = toneOf(data, n); });
    });
    data.nodes.forEach((n) => { byId[n.id] = n; });
    data.nodes.forEach((n) => { n.linked = (n.links ?? []).map((id) => byId[id]).filter(Boolean); });
    return { rings, byId };
  }

  const mark = (n) => {
    const m = n.mark ?? "dot";
    if (m === "diamond") return `<rect class="cs-dot" x="-6" y="-6" width="12" height="12" rx="2" transform="rotate(45)"/>`;
    const r = m === "numeral" ? 11 : m === "initial" ? 9 : 6;
    const text = m === "numeral" ? `<text class="cs-ico" y="5">${esc(n.numeral ?? "")}</text>` : m === "initial" ? `<text class="cs-ico" y="4">${esc(n.label[0])}</text>` : "";
    return `<circle class="cs-dot" r="${r}"/>${text}`;
  };

  window.Constellation = {
    // The field's svg (a square, 1000 units) and its legend.
    field(data, { label = `${data.center} and everyone around him`, cls = "" } = {}) {
      const { rings } = layout(data);
      return `<svg class="cs-svg ${cls}" viewBox="0 0 1000 1000" role="group" aria-label="${esc(label)}">
        <defs><radialGradient id="cs-core-${cls || "x"}"><stop offset="0" class="cs-core1"/><stop offset="1" class="cs-core2"/></radialGradient></defs>
        <circle cx="${C}" cy="${C}" r="490" fill="url(#cs-core-${cls || "x"})"/>
        ${rings.map((r) => `<circle class="cs-ring" data-ring="${r.key}" cx="${C}" cy="${C}" r="${r.r}" pathLength="1"/><text class="cs-ringlabel" x="${C}" y="${C - r.r + 4}">${esc(r.label)}</text>`).join("")}
        <g class="cs-spokes">${data.nodes.map((n) => `<line data-for="${n.id}" x1="${C}" y1="${C}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`).join("")}</g>
        <g class="cs-links"></g>
        <g class="cs-nodes">${data.nodes.map((n) => `<g class="cs-node is-${n.ring} m-${n.mark ?? "dot"} ${n.mark === "numeral" ? "is-big" : ""}" data-node="${esc(n.id)}" data-type="${n.ring}" data-group="${n.group}" style="--tone:${n.tone}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(n.label)}">
          <circle class="cs-halo" r="${n.mark === "numeral" ? 22 : 14}"/>${mark(n)}
          <text class="cs-label" text-anchor="${Math.cos(n.angle) < -.2 ? "end" : Math.cos(n.angle) > .2 ? "start" : "middle"}" x="${(Math.cos(n.angle) * (n.mark === "numeral" ? 18 : 14)).toFixed(1)}" y="${(Math.sin(n.angle) * (n.mark === "numeral" ? 22 : 16) + 4).toFixed(1)}">${esc(short(n.short ?? n.label))}</text></g>`).join("")}</g>
        <g class="cs-core" data-node="core"><circle r="62" class="cs-core-halo" cx="${C}" cy="${C}"/><circle r="46" cx="${C}" cy="${C}"/><text x="${C}" y="${C + 8}">${esc(data.center)}</text></g>
      </svg>`;
    },
    legend(data, { marks = {} } = {}) {
      return `<ul class="cs-legend">${data.rings.map((r) => `<li class="is-${r.key} m-${marks[r.key] ?? "dot"}"><i></i>${esc(r.label)}</li>`).join("")}<li class="cs-legend-acts">${data.groups.filter((g) => data.nodes.some((n) => n.group === g.key)).map((g) => `<span style="--tone:${toneOf(data, { group: g.key })}">${esc(g.label)}</span>`).join("")}</li></ul>`;
    },
    // Wires a drawn field: choosing, links, the bloom, filters by ring and by group, and labels kept inside the field.
    wire(svg, data, { panel, panelHtml, coreHtml, afterSelect, onSelect, scrollPanel = () => innerWidth < 960 } = {}) {
      const { rings, byId } = layout(data);
      const linksG = svg.querySelector(".cs-links"), ringEls = [...svg.querySelectorAll(".cs-ring")];
      const nodeEls = Object.fromEntries([...svg.querySelectorAll(".cs-node")].map((g) => [g.dataset.node, g]));
      let cleanup = null, selected = null;
      const select = (id, scroll = false) => {
        cleanup?.(); cleanup = null;
        selected = id === "core" ? null : byId[id] ?? null;
        const near = new Set(selected?.linked.map((m) => m.id) ?? []);
        svg.querySelectorAll(".cs-node").forEach((g) => { g.classList.toggle("is-on", g.dataset.node === id); g.classList.toggle("is-linked", near.has(g.dataset.node)); });
        svg.classList.toggle("has-sel", !!selected);
        linksG.innerHTML = selected ? selected.linked.map((m) => `<path pathLength="1" style="--tone:${m.tone}" d="M${selected.x.toFixed(1)},${selected.y.toFixed(1)}Q${C + (selected.x + m.x - 2 * C) * .18},${C + (selected.y + m.y - 2 * C) * .18} ${m.x.toFixed(1)},${m.y.toFixed(1)}"/>`).join("") : "";
        if (panel) {
          panel.style.setProperty("--tone", selected ? selected.tone : "var(--accent)");
          panel.innerHTML = selected ? panelHtml(selected) : coreHtml();
          panel.classList.remove("is-in"); void panel.offsetWidth; panel.classList.add("is-in");
          cleanup = afterSelect?.(selected, panel) ?? null;
          if (scroll && scrollPanel()) panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        onSelect?.(selected);
        requestAnimationFrame(fitLabels);
      };
      // The bloom: rings draw, then the points fly out from the centre ring by ring (q is 0..1, for the clock).
      const bloomFrame = (q) => {
        ringEls.forEach((r, k) => r.style.setProperty("--p", easeInOut(span(q, k * .08, k * .08 + .4)).toFixed(3)));
        data.nodes.forEach((n) => { const k = rings.findIndex((r) => r.key === n.ring), t = easeOut(span(q, .15 + k * .15, .6 + k * .13));
          nodeEls[n.id].setAttribute("transform", `translate(${(C + (n.x - C) * t).toFixed(1)} ${(C + (n.y - C) * t).toFixed(1)}) scale(${(.3 + .7 * t).toFixed(3)})`); });
      };
      const bloomMoving = (q) => [q < .48 && "rings drawing", ...rings.map((r, k) => q > .15 + k * .15 && q < .6 + k * .13 && `${r.label.toLowerCase()} flying out`)].filter(Boolean);
      const setRing = (key) => { svg.dataset.only = key; data.nodes.forEach((n) => nodeEls[n.id].classList.toggle("is-out", key !== "all" && n.ring !== key)); };
      const setGroup = (key) => { const now = svg.dataset.group === key ? "" : key; svg.dataset.group = now; data.nodes.forEach((n) => nodeEls[n.id].classList.toggle("is-faded", !!now && n.group !== now)); return now; };
      // Labels that would run off the field turn inward (matters at phone sizes, where labels are larger).
      const fitLabels = () => data.nodes.forEach((n) => {
        const t = nodeEls[n.id].querySelector(".cs-label"), base = t.dataset.anchor ?? (t.dataset.anchor = t.getAttribute("text-anchor")), bx = t.dataset.x ?? (t.dataset.x = t.getAttribute("x"));
        t.setAttribute("text-anchor", base); t.setAttribute("x", bx);
        const box = t.getBBox();
        if (box.width && n.x + box.x + box.width > 996) { t.setAttribute("text-anchor", "end"); t.setAttribute("x", String(-Math.abs(Number(bx)))); }
        else if (box.width && n.x + box.x < 4) { t.setAttribute("text-anchor", "start"); t.setAttribute("x", String(Math.abs(Number(bx)))); }
      });
      const onClick = (e) => { const g = e.target.closest(".cs-node, .cs-core"); if (g && svg.contains(g)) select(g.dataset.node); };
      const onKey = (e) => { const g = e.target.closest?.(".cs-node"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(g.dataset.node); } };
      svg.addEventListener("click", onClick); svg.addEventListener("keydown", onKey); addEventListener("resize", fitLabels);
      return { byId, select, bloomFrame, bloomMoving, setRing, setGroup, fitLabels, get selected() { return selected; },
        related: (n) => n.linked, destroy() { cleanup?.(); svg.removeEventListener("click", onClick); svg.removeEventListener("keydown", onKey); removeEventListener("resize", fitLabels); } };
    },
  };
})();
