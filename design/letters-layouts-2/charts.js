// Layout 2's charts, drawn for any collection from window.LETTERS. Clicking keeps an item and shows its details; ✕ lets
// it go. Everything lives inside window.CH so nothing clashes with the shared site.js names.
window.CH = (() => {
  const ui = {}; // per chart: { kept, choice, hidden }
  const st = (key) => (ui[key] ??= { kept: null, choice: null, hidden: new Set() });
  Object.assign(ACTIONS, {
    ckeep: (arg) => { const [key, v] = splitArg(arg); st(key).kept = v === "" ? null : v; },
    cchoose: (arg) => { const [key, v] = splitArg(arg); st(key).choice = v; st(key).kept = null; },
    ctoggle: (arg) => { const [key, v] = splitArg(arg); const h = st(key).hidden; h.has(v) ? h.delete(v) : h.add(v); },
  });
  const splitArg = (arg) => { const i = arg.indexOf("|"); return [arg.slice(0, i), arg.slice(i + 1)]; };
  const keepX = (key) => `<button type="button" class="keep-x" data-act="ckeep" data-arg="${key}|" aria-label="Let go">✕</button>`;
  const refsLine = (list, limit = 8) => list?.length ? `<span class="refs">${list.slice(0, limit).map((r) => `<a href="/read">${r}</a>`).join("")}${list.length > limit ? `<span>+${list.length - limit} more</span>` : ""}</span>` : "";
  const tip = (html, hint) => `<p class="tip">${html || hint}</p>`;
  const caption = (text) => (text ? `<p class="caption">${text}</p>` : "");
  const TONES = ["epistles", "prophets", "poetry", "revelation", "acts", "gospels", "history"];
  const short = (s, n = 46) => (s.length > n ? `${s.slice(0, n - 2).trimEnd()}…` : s);

  // ── Maps: routes to choose between, pins to show or hide ───────────────────────────────
  function map(key, maps) {
    const s = st(key), routes = maps.filter((m) => m.route), pins = maps.filter((m) => !m.route);
    s.choice ??= routes[0]?.id ?? null;
    const all = maps.flatMap((m) => m.pts), xs = all.map((p) => p[1]), ys = all.map((p) => p[2]), pad = 16;
    let [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
    if (x1 - x0 < 140) { const c = (x0 + x1) / 2; x0 = c - 70; x1 = c + 70; }
    const w = x1 - x0, h = Math.max(y1 - y0, w / 2.1); y0 -= (h - (y1 - y0)) / 2; y1 = y0 + h;
    const k = w / 1000, chosen = routes.find((m) => m.id === s.choice);
    const tone = (m) => `var(--${TONES[maps.indexOf(m) % TONES.length]})`;
    const seen = new Set(), stops = chosen ? chosen.pts.filter(([n]) => !seen.has(n) && seen.add(n)) : [];
    const shownPins = pins.filter((m) => !s.hidden.has(m.id));
    const kept = s.kept !== null ? shownPins.flatMap((m) => m.pts.map((p) => ({ p, m }))).find(({ p }) => p[0] === s.kept) : null;
    const pinLabels = routes.length === 0;
    const labels = placeLabels([...stops, ...(pinLabels ? shownPins.flatMap((m) => m.pts) : [])], k, x1 - w * 0.2);
    return `<div class="panel">
      <div class="chips-row">${routes.map((m) => `<button type="button" class="chip" style="--tone: ${tone(m)}" data-act="cchoose" data-arg="${key}|${m.id}" aria-pressed="${m.id === s.choice}">${m.title}${m.years ? ` <span class="chip-sub">AD ${m.years[0]}–${m.years[1]}</span>` : ""}</button>`).join("")}
        ${pins.length > (routes.length ? 0 : 1) ? pins.map((m) => `<button type="button" class="chip" style="--tone: ${tone(m)}" data-act="ctoggle" data-arg="${key}|${m.id}" aria-pressed="${!s.hidden.has(m.id)}">○ ${m.title}</button>`).join("") : ""}</div>
      <svg class="chart map" viewBox="${x0} ${y0} ${w} ${h}" role="img" aria-label="${maps.map((m) => m.title).join("; ")}">
        <path d="${LETTERS.land}" fill="color-mix(in srgb, var(--epistles) 9%, var(--surface))" stroke="var(--line)" stroke-width="${1.8 * k}"/>
        ${routes.map((m) => `<polyline points="${m.pts.map((p) => `${p[1]},${p[2]}`).join(" ")}" fill="none" stroke="${tone(m)}" stroke-width="${(m === chosen ? 2.6 : 1.4) * k}"
          stroke-dasharray="${m === chosen ? "none" : `${5 * k} ${4 * k}`}" stroke-linejoin="round" opacity="${m === chosen ? 1 : .3}"/>`).join("")}
        ${shownPins.map((m) => m.pts.map((p) => `<g style="cursor:pointer" data-act="ckeep" data-arg="${key}|${p[0]}"><circle cx="${p[1]}" cy="${p[2]}" r="${(pinLabels ? 6 : 7) * k}" fill="${pinLabels ? tone(m) : "none"}" fill-opacity=".85"
          stroke="${tone(m)}" stroke-width="${1.6 * k}"/>${kept?.p === p ? `<circle cx="${p[1]}" cy="${p[2]}" r="${12 * k}" fill="none" stroke="var(--ink)" stroke-width="${1.2 * k}"/>` : ""}</g>`).join("")).join("")}
        ${stops.map(([, x, y]) => `<circle cx="${x}" cy="${y}" r="${3.4 * k}" fill="${tone(chosen)}" stroke="var(--surface)" stroke-width="${1.2 * k}"/>`).join("")}
        ${labels.map(({ name, x, y, end }) => `<text x="${end ? x - 7 * k : x + 7 * k}" y="${y + 3 * k}" text-anchor="${end ? "end" : "start"}"
          style="font: ${10.5 * k}px var(--sans); fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: ${3 * k}px; pointer-events: none">${name}</text>`).join("")}
      </svg>
      ${kept ? tip(`<b style="color:var(--ink)">${kept.p[0]}</b>${keepX(key)} · ${kept.m.title}${kept.p[3] ? ` · ${kept.p[3]}` : ""}`)
        : chosen ? tip(`<b style="color:var(--ink)">${chosen.title}</b>${chosen.years ? ` · AD ${chosen.years[0]}–${chosen.years[1]}` : ""} · ${stops.length} places<br><span class="route-line">${chosen.pts.map((p) => p[0]).filter((n, i, a) => n !== a[i - 1]).join(" → ")}</span>`)
        : tip("", "Click a place to see who proposed it.")}
      ${caption([chosen?.claim, ...shownPins.map((m) => m.claim)].filter(Boolean)[0])}
      <p class="caption">Places from OpenBible.info (CC BY); land outline from Natural Earth.</p></div>`;
  }

  // ── A timeline of years: one lane, or life above and letters below ─────────────────────
  function years(key, tl, toneOf = () => "prophets") {
    const s = st(key), ev = tl.events, lo = Math.min(...ev.map((e) => e.from)), hi = Math.max(...ev.map((e) => e.to ?? e.from));
    const span = Math.max(1, hi - lo), W = 1000, PAD = 30, ROW = 21, x = (y) => PAD + ((y - lo) / span) * (W - 2 * PAD - 230);
    const pack = (list) => { const ends = []; return list.map((e) => { const x0 = x(e.from), x1 = Math.max(x(e.to ?? e.from), x0 + 8) + (labelled ? short(e.label, 34).length * 6.2 + 14 : 0); let r = ends.findIndex((end) => end + 4 < x0); if (r < 0) { r = ends.length; ends.push(x1); } else ends[r] = x1; return r; }); };
    const lanes = ev.some((e) => e.kind === "letter") ? [ev.filter((e) => e.kind !== "letter"), ev.filter((e) => e.kind === "letter")] : [ev];
    let labelled = lanes.length === 1, top = 40, svg = "";
    lanes.forEach((lane, li) => {
      labelled = lanes.length === 1 || li === 1;
      const rows = pack(lane);
      if (li === 1) { svg += `<text x="${PAD}" y="${top + 8}" style="font: 600 11px var(--sans); letter-spacing: .14em; fill: var(--epistles)">HIS LETTERS</text>`; top += 18; }
      lane.forEach((e, i) => {
        const id = ev.indexOf(e), x0 = x(e.from), x1 = Math.max(x(e.to ?? e.from), x0 + 8), y = top + rows[i] * ROW, on = String(id) === s.kept;
        svg += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="13" rx="6.5" fill="var(--${toneOf(e)})" opacity="${s.kept === null ? (e.kind === "life" ? .45 : .8) : on ? 1 : .2}" style="cursor:pointer" data-act="ckeep" data-arg="${key}|${id}"/>`;
        if (labelled) svg += `<text x="${x1 + 6}" y="${y + 10.5}" style="font: 600 11px var(--sans); fill: var(--ink); pointer-events: none">${short(e.label, 34)}</text>`;
      });
      top += (Math.max(-1, ...rows) + 1) * ROW + 24;
    });
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((t) => span / t <= 9) ?? 1000, ticks = [];
    for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);
    const kept = s.kept !== null ? ev[Number(s.kept)] : null, kinds = [...new Set(ev.map((e) => e.kind).filter(Boolean))];
    return `<div class="panel">${kinds.length > 1 ? `<div class="legend">${kinds.map((kind) => `<span><i style="background: var(--${toneOf({ kind })})"></i>${kind}</span>`).join("")}</div>` : ""}
      <svg class="chart" viewBox="0 0 ${W} ${top}" role="img" aria-label="${tl.title}">
        ${ticks.map((t) => `<path d="M${x(t)} 24V${top - 10}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${x(t)}" y="16" text-anchor="middle" style="font: 11px var(--sans); fill: var(--muted)">AD ${t}</text>`).join("")}${svg}
      </svg>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.label}</b>${keepX(key)} · AD ${kept.from}${kept.to && kept.to !== kept.from ? `–${kept.to}` : ""}${refsLine(kept.refs)}` : "", "Each bar spans the years the sources give. Click a bar to see its verses.")}
      ${caption(tl.claim)}</div>`;
  }

  // ── A story in numbered steps ─────────────────────────────────────────────────────────
  function steps(key, tl) {
    const s = st(key), kept = s.kept !== null ? tl.events[Number(s.kept)] : null;
    return `<div class="panel"><ol class="steps">${tl.events.map((e, i) => `<li><button type="button" data-act="ckeep" data-arg="${key}|${i}" aria-pressed="${String(i) === s.kept}"><span>${i + 1}</span>${e.label}</button></li>`).join("")}</ol>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.label}</b>${keepX(key)}${kept.kind ? ` · ${kept.kind}` : ""}${refsLine(kept.refs)}` : "", "Click a step to read its verses.")}${caption(tl.claim)}</div>`;
  }

  // ── A network around one person ───────────────────────────────────────────────────────
  function network(key, net, centre = net.nodes[0].id) {
    const s = st(key), W = 1000, H = net.nodes.length > 20 ? 560 : net.nodes.length > 8 ? 440 : 340, cx = W / 2, cy = H / 2;
    const others = net.nodes.filter((n) => n.id !== centre), two = others.length > 20, groups = [...new Set(net.nodes.map((n) => n.group))];
    const at = new Map([[centre, [cx, cy]]]);
    others.forEach((n, i) => { const a = (i / others.length) * Math.PI * 2 - Math.PI / 2, r = two ? [165, 245][i % 2] : Math.min(170, H / 2 - 50); at.set(n.id, [cx + Math.cos(a) * r * 1.75, cy + Math.sin(a) * r]); });
    const kept = s.kept, linked = new Set(kept ? net.edges.flatMap((e) => (e.from === kept || e.to === kept ? [e.from, e.to] : [])) : []);
    const node = kept ? net.nodes.find((n) => n.id === kept) : null, edges = kept ? net.edges.filter((e) => e.from === kept || e.to === kept) : [];
    const tone = (g) => `var(--${TONES[groups.indexOf(g) % TONES.length]})`;
    return `<div class="panel"><div class="legend">${groups.map((g) => `<span><i style="background: ${tone(g)}"></i>${g ?? ""}</span>`).join("")}</div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${net.title}">
        ${net.edges.map((e) => { const a = at.get(e.from), b = at.get(e.to); if (!a || !b) return ""; const on = !kept || e.from === kept || e.to === kept;
          return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--epistles)" stroke-width="${on && kept ? 1.6 : 1}" opacity="${on ? (kept ? .8 : .3) : .05}"/>`; }).join("")}
        ${net.nodes.map((n) => { const [x, y] = at.get(n.id), isC = n.id === centre, dim = kept && kept !== n.id && !linked.has(n.id), left = x < cx - 40;
          return `<g opacity="${dim ? .25 : 1}" style="cursor:pointer" data-act="ckeep" data-arg="${key}|${n.id}"><circle cx="${x}" cy="${y}" r="${isC ? 15 : 6.5}" fill="${tone(n.group)}" stroke="var(--surface)" stroke-width="1.5"/>
            <text x="${isC ? x : left ? x - 11 : x + 11}" y="${isC ? y + 32 : y + 4}" text-anchor="${isC ? "middle" : left ? "end" : "start"}" style="font: ${isC || kept === n.id ? "600 13px" : "12px"} var(--sans); fill: ${kept === n.id || isC ? "var(--ink)" : "var(--muted)"}">${n.label}</text></g>`; }).join("")}
      </svg>
      ${tip(node ? `<b style="color:var(--ink)">${node.label}</b>${keepX(key)}${node.note ? ` · ${node.note}` : ""}${edges.filter((e) => e.label).slice(0, 3).map((e) => ` · “${e.label}”`).join("")}${refsLine(node.refs)}` : "", "Click a name to see who they were and how the text links them.")}
      ${caption(net.claim)}</div>`;
  }

  // ── A ladder of comparisons (Hebrews: "Better than…") ──────────────────────────────────
  function ladder(key, l) {
    const s = st(key), kept = s.kept !== null ? l.steps[Number(s.kept)] : null;
    return `<div class="panel"><ol class="ladder">${l.steps.map((x, i) => `<li><button type="button" data-act="ckeep" data-arg="${key}|${i}" aria-pressed="${String(i) === s.kept}">
      <span class="ladder-n">${pad2(i + 1)}</span><span class="ladder-old">${x.label}</span><span class="ladder-arrow">→</span><span class="ladder-new">${x.better}</span></button></li>`).join("")}</ol>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.label} → ${kept.better}</b>${keepX(key)} · ${kept.note}${refsLine(kept.refs)}` : "", "Click a step to read where the letter says it.")}${caption(l.claim)}</div>`;
  }

  // ── Two texts side by side, joined by ribbons ─────────────────────────────────────────
  function ribbon(key, parallels, { weightLabel = "shared words" } = {}) {
    const s = st(key), par = parallels.find((p) => p.id === s.choice) ?? parallels[0];
    const W = 1000, PAD = 30, TOP = 58, BOTTOM = 232, H = 290;
    const axis = (rail) => {
      const before = (c) => rail.chapters.slice(0, c - 1).reduce((a, b) => a + b, 0), start = before(rail.start[0]) + rail.start[1] - 1;
      const total = before(rail.end[0]) + rail.end[1] - start;
      return { at: ([c, v]) => PAD + ((before(c) + v - 1 - start) / total) * (W - 2 * PAD), total,
        ticks: rail.chapters.map((_, i) => i + 1).filter((c) => c >= rail.start[0] && c <= rail.end[0]).map((c) => [c, PAD + ((Math.max(before(c), start) - start) / total) * (W - 2 * PAD)]) };
    };
    const top = axis(par.left), bottom = axis(par.right);
    const kinds = [...new Set(par.pairs.map((p) => p.kind).filter(Boolean))];
    const filter = s.hidden.size ? [...s.hidden][0] : "all";
    // Passages without a kind (some charts label only a few) keep the chart's own colour.
    const toneOf = (p) => `var(--${kinds.includes(p.kind) ? TONES[kinds.indexOf(p.kind) % TONES.length] : "prophets"})`;
    const floor = Math.max(6, Math.min(22, 180 / par.pairs.length));
    const seg = (ax, [a, b]) => { const x0 = ax.at(a), x1 = ax.at(b) + 3, w = Math.max(floor, x1 - x0), l = Math.min(W - PAD - w, Math.max(PAD, (x0 + x1) / 2 - w / 2)); return [l, l + w]; };
    const fewTicks = (t) => (t.length > 12 ? t.filter((_, i) => i % Math.ceil(t.length / 12) === 0) : t);
    const ticks = (ax, y, below) => fewTicks(ax.ticks).map(([c, x]) => `<path d="M${x} ${y - 9}V${y + 15}" stroke="var(--line)"/><text x="${x + 4}" y="${below ? y + 26 : y - 12}" style="font: 11px var(--sans); fill: var(--muted)">ch. ${c}</text>`).join("");
    const shown = par.pairs.map((p, i) => ({ p, i })).filter(({ p }) => filter === "all" || p.kind === filter);
    const kept = s.kept !== null ? par.pairs[Number(s.kept)] : null;
    const ribbons = shown.map(({ p, i }) => {
      const [a0, a1] = seg(top, p.l), [b0, b1] = seg(bottom, p.r), mid = (TOP + BOTTOM) / 2, on = String(i) === s.kept;
      return `<path d="M${a0},${TOP} L${a1},${TOP} C${a1},${mid} ${b1},${mid} ${b1},${BOTTOM} L${b0},${BOTTOM} C${b0},${mid} ${a0},${mid} ${a0},${TOP} Z" fill="${toneOf(p)}" opacity="${on ? .85 : s.kept === null ? .3 : .14}" style="cursor:pointer" data-act="ckeep" data-arg="${key}|${i}"/>
        <rect x="${a0}" y="${TOP - 6}" width="${a1 - a0}" height="6" rx="2" fill="${toneOf(p)}"/><rect x="${b0}" y="${BOTTOM}" width="${b1 - b0}" height="6" rx="2" fill="${toneOf(p)}"/>`;
    }).join("");
    return `<div class="panel">
      ${parallels.length > 1 ? `<div class="chips-row">${parallels.map((p) => `<button type="button" class="chip" style="--tone: var(--prophets)" data-act="cchoose" data-arg="${key}|${p.id}" aria-pressed="${p === par}">${p.title}</button>`).join("")}</div>` : ""}
      ${kinds.length > 1 ? `<div class="chips-row"><button type="button" class="chip" style="--tone: var(--ink)" data-act="ckind" data-arg="${key}|all" aria-pressed="${filter === "all"}">All · ${par.pairs.length}</button>${kinds.map((k) => `<button type="button" class="chip" style="--tone: ${toneOf({ kind: k })}" data-act="ckind" data-arg="${key}|${k}" aria-pressed="${filter === k}">${KIND_NAMES[k] ?? k.replace(/-/g, " ")} · ${par.pairs.filter((p) => p.kind === k).length}</button>`).join("")}</div>` : ""}
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${par.title}">
        <text x="${PAD}" y="20" style="font: 600 13px var(--sans); fill: var(--ink)">${par.left.label} · ${par.left.verses} verses</text>
        <text x="${PAD}" y="${H - 6}" style="font: 600 13px var(--sans); fill: var(--ink)">${par.right.label} · ${par.right.verses} verses</text>
        <rect x="${PAD}" y="${TOP - 6}" width="${W - 2 * PAD}" height="6" rx="3" fill="var(--line)"/><rect x="${PAD}" y="${BOTTOM}" width="${W - 2 * PAD}" height="6" rx="3" fill="var(--line)"/>
        ${ticks(top, TOP - 3, false)}${ticks(bottom, BOTTOM + 3, true)}${ribbons}
      </svg>
      ${kept ? `${tip(`<b style="color:var(--ink)">${kept.left}</b> with <b style="color:var(--ink)">${kept.right}</b>${keepX(key)}${kept.note ? ` · ${kept.note}` : ""}${kept.weight ? ` · ${kept.weight} ${weightLabel}` : ""}`)}
        ${kept.lt ? `<div class="pair-text"><blockquote class="quote">${kept.lt}<cite>${kept.left} · KJV</cite></blockquote><blockquote class="quote">${kept.rt}<cite>${kept.right} · KJV</cite></blockquote></div>` : ""}`
        : tip("", `${par.pairs.length} passages. Click a ribbon to read both side by side.`)}
      ${caption(par.claim)}</div>`;
  }
  const KIND_NAMES = { greeting: "Greetings", "christ-church": "Christ and the church", "new-life": "The new life", household: "The household", tychicus: "Tychicus sent" };
  ACTIONS.ckind = (arg) => { const [key, v] = splitArg(arg); const s = st(key); s.hidden = new Set(v === "all" ? [] : [v]); s.kept = null; };

  // ── One letter: at a glance, its shape, its words, its Old Testament, its people ───────
  const FACT_TABS = [["author", "Who wrote it"], ["recipients", "To whom"], ["writtenFrom", "From where"], ["date", "When"], ["occasion", "Why"]];
  function glance(key, l) {
    const s = st(key); s.choice ??= "author";
    const vi = Math.min(Number(s.kept ?? 0), l.keyVerses.length - 1), v = l.keyVerses[vi];
    return `<dl class="figures">
        <div><dt>Verses</dt><dd>${l.verses}</dd></div><div><dt>${l.greekWords ? "Greek words" : "Chapters"}</dt><dd>${l.greekWords ? l.greekWords.toLocaleString("en-US") : l.outline.length}</dd></div>
        <div><dt>Key verses</dt><dd>${l.keyVerses.length}</dd></div><div><dt>Themes</dt><dd>${l.themes.length}</dd></div>
      </dl>
      <div class="glance-grid">
        <div class="panel"><p class="panel-label">The letter</p>
          <div class="tabs">${FACT_TABS.map(([id, name]) => `<button type="button" class="tab" data-act="cchoose" data-arg="${key}|${id}" aria-pressed="${id === s.choice}">${name}</button>`).join("")}</div>
          <p class="fact">${l.facts[s.choice]}</p></div>
        <div class="panel"><p class="panel-label">Key verses</p>
          <div class="verse-list">${l.keyVerses.map((k, i) => `<button type="button" class="tab" data-act="ckeep" data-arg="${key}|${i}" aria-pressed="${i === vi}">${k.ref.replace(`${l.name} `, "")}</button>`).join("")}</div>
          <blockquote class="quote">“${v.text}”<cite>${v.ref} · KJV</cite></blockquote><p class="fact" style="margin-top:.6rem">${v.why}</p></div>
      </div>
      <div class="panel" style="margin-top:1rem"><p class="panel-label">Themes</p><ol class="themes">${l.themes.map((t) => `<li>${t}</li>`).join("")}</ol></div>`;
  }
  const KIND_TONES = { teaching: "prophets", practice: "poetry", personal: "acts", praise: "epistles", defence: "history", appeal: "acts", "church order": "gospels", charge: "revelation",
    answer: "prophets", worship: "epistles", encouragement: "poetry", correction: "history", warning: "revelation", prayer: "gospels" };
  function outline(key, l) {
    const s = st(key), parts = l.outline, kinds = [...new Set(parts.map((p) => p.kind).filter(Boolean))], kept = s.kept !== null ? parts[Number(s.kept)] : null;
    return `<div class="panel">${kinds.length ? `<div class="legend">${kinds.map((k) => `<span><i style="background: var(--${KIND_TONES[k] ?? "epistles"})"></i>${k}</span>`).join("")}</div>` : ""}
      <div class="outline">${parts.map((p, i) => `<button type="button" style="flex-grow:${p.verses}; --tone: var(--${KIND_TONES[p.kind] ?? "epistles"})" data-act="ckeep" data-arg="${key}|${i}" aria-pressed="${String(i) === s.kept}"><span>${p.title}</span></button>`).join("")}</div>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.title}</b>${keepX(key)} · ${kept.ref} · ${kept.verses} verses${kept.kind ? ` · ${kept.kind}` : ""}` : "", `${l.name} in ${parts.length} parts, each as long as it is, in our own words. Click a part to see where it runs.`)}</div>`;
  }
  function words(key, l) {
    const s = st(key), most = Math.max(...l.words.map((w) => w.count)), kept = s.kept !== null ? l.words[Number(s.kept)] : null;
    return `<div class="panel"><div class="word-grid">${l.words.map((w, i) => { const r = 4 + 14 * Math.sqrt(w.count / most);
      return `<button type="button" data-act="ckeep" data-arg="${key}|${i}" aria-pressed="${String(i) === s.kept}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="${r + 4}" fill="var(--gospels)" opacity=".15"/><circle cx="20" cy="20" r="${r}" fill="var(--gospels)"/></svg>
        <span><b>${w.gloss}</b><small>${w.greek} ${w.translit} · ${w.strongs}</small></span><em>${w.count}</em></button>`; }).join("")}</div>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.gloss}</b> <span>(${kept.greek}, ${kept.translit})</span>${keepX(key)} · ${kept.note ?? ""}` : "", "A bigger star means more uses. Click a word to see where it gathers.")}</div>`;
  }
  function oldTestament(key, l) {
    if (!l.otQuotes.length) return `<div class="panel"><p class="fact">${l.name} quotes no Old Testament passage.</p></div>`;
    return `<div class="panel"><ul class="ot-list">${l.otQuotes.map((q) => `<li><a href="/read">${q.at}</a> <span>quotes</span> <a href="/read">${q.from}</a>${q.note ? `<small>${q.note}</small>` : ""}</li>`).join("")}</ul></div>`;
  }
  function peoplePlaces(key, l) {
    const item = (x) => `<li><b>${x.name}</b>${x.implied ? ` <span class="muted">(implied)</span>` : ""}${x.note ? `<small>${x.note}</small>` : ""}${refsLine(x.refs, 3)}</li>`;
    return `<div class="panel two-lists"><div><p class="panel-label">People named · ${l.people.length}</p><ul class="name-list">${l.people.map(item).join("")}</ul></div>
      <div><p class="panel-label">Places named · ${l.places.length}</p><ul class="name-list">${l.places.map(item).join("")}</ul></div></div>`;
  }

  // ── How they were read: open questions, and acceptance witness by witness ─────────────
  function questions(key, list) {
    const s = st(key), qi = Number(s.choice ?? 0), q = list[qi];
    return `<div class="panel q-layout">
      <ol class="q-list">${list.map((x, i) => `<li><button type="button" data-act="cchoose" data-arg="${key}|${i}" aria-pressed="${i === qi}">${x.question}</button></li>`).join("")}</ol>
      <div><p class="panel-label">${q.views.length} views · this page does not choose between them</p>
        <div class="views">${q.views.map((v) => `<article><h4>${v.label}</h4><p>${v.argument}</p><small>${v.holders}</small></article>`).join("")}</div></div></div>`;
  }
  const STATUS = { accepted: ["Accepted", 1], used: ["Quoted or used", .55], doubted: ["Doubted", 0], omitted: ["Left out", .15] };
  const mark = (s) => `<i title="${STATUS[s][0]}" style="${s === "doubted" ? "background:none; border:2px solid var(--revelation)" : `opacity:${STATUS[s][1]}`}"></i>`;
  function canon(key, list, letters) {
    const s = st(key), kept = s.kept !== null ? list[Number(s.kept)] : null;
    return `<div class="panel"><div class="canon-wrap"><table class="canon">
      <thead><tr><th></th>${list.map((w, i) => `<th><button type="button" data-act="ckeep" data-arg="${key}|${i}" aria-pressed="${String(i) === s.kept}"><b>${w.year}</b>${w.label}</button></th>`).join("")}</tr></thead>
      <tbody>${letters.map((l) => `<tr><th>${l.name}</th>${list.map((w, i) => `<td class="${String(i) === s.kept ? "on" : ""}">${w.status[l.code] ? mark(w.status[l.code]) : ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <div class="legend" style="margin-top:.8rem">${Object.keys(STATUS).map((st2) => `<span>${mark(st2)}${STATUS[st2][0]}</span>`).join("")}</div>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.label}</b>${keepX(key)} · about AD ${kept.year} · ${kept.who}<br><span class="fact">${kept.claim}</span>` : "", "Click a witness to read what they say.")}</div>`;
  }

  return { map, years, steps, network, ladder, ribbon, glance, outline, words, oldTestament, peoplePlaces, questions, canon, kit: { st, keepX, refsLine, tip, caption, splitArg, TONES, short }, reset: (prefix) => Object.keys(ui).filter((k) => k.startsWith(prefix)).forEach((k) => { ui[k].kept = null; }) };
})();
