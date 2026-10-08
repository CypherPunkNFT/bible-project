// The land: the 3D table as the page's centrepiece. Three views (Campaign, Places, Powers), the crystals by kind
// beside it (tap a kind to filter the crystals on the land), a calm timeline stepping the campaign's turns, a tiny
// legend of the controls, and the warm glass panel. Every change of view is one Clock animation the ticker can slow.
(() => {
  const MOVE_ROLE = { march: "david", pursuit: "david", flight: "david", circuit: "david", procession: "ark", gift: "ally", enemy: "enemy" };
  const MOVE_NAME = { march: "march", pursuit: "pursuit", flight: "flight", circuit: "circuit", procession: "procession", gift: "gifts", enemy: "enemy march" };
  const TURN_CRYSTALS = { 1: ["anointed-samuel", "jesse"], 2: ["goliath"], 3: ["adullam"], 4: ["ziklag", "amalek"] };
  const R = Math.PI / 180;
  const coarse = () => matchMedia("(pointer: coarse)").matches;

  window.Land = {};
  Land.mount = (root) => {
    const turns = DV.turns, phases = DV.phases;
    const counts = Object.fromEntries(DV.kinds.map((k) => [k.id, DV.crystals.filter((c) => c.kind === k.id).length]));
    root.innerHTML = `
      <div class="ld-stage" id="land-stage">
        <div class="ld-table"></div>
        <div class="ld-kinds" aria-label="Crystals by kind">
          <p class="ld-label">Crystals by kind <span>· tap to filter</span></p>
          <div class="ld-chips" role="group" aria-label="Show one kind">${DV.kinds.map((k) => `<button type="button" class="kchip" data-kind="${k.id}" aria-pressed="false" style="--c: var(--k-${k.id})" title="${esc(k.label)}: ${counts[k.id]} on the land, shaped as ${esc(k.shape.toLowerCase())}">
            <span class="kchip-gem">${Crystals.svg(k.id, 30)}</span><span class="kchip-name">${esc(k.label)}</span><b>${counts[k.id]}</b></button>`).join("")}</div>
        </div>
        <div class="ld-modes" role="tablist" aria-label="What the land shows">${[["campaign", "Campaign", "swords"], ["places", "Places", "pin"], ["powers", "Powers", "globe"]].map(([id, l, i]) => `<button type="button" role="tab" data-mode="${id}" aria-selected="${id === "campaign"}">${icon(i, 16)}<span>${l}</span></button>`).join("")}</div>
        <p class="ld-legend" aria-label="How to move the land">${coarse() ? "Drag to move · Pinch to zoom · Twist to turn" : "Scroll to zoom · Drag to move · Right-drag to turn"}</p>
        <p class="ld-hover" hidden></p>
        <nav class="ld-time" aria-label="The campaign, turn by turn"></nav>
      </div>
      <aside class="ld-panel" aria-live="polite"><div class="dp-scroll"></div></aside>`;
    const stage = root.querySelector(".ld-stage"), panel = root.querySelector(".dp-scroll"), timeline = root.querySelector(".ld-time"), hover = root.querySelector(".ld-hover");
    const table = LandTable(root.querySelector(".ld-table"));
    const xyOf = (id) => DV.atlas[id]?.xy;
    const onBoard = ([x, y]) => x >= 0 && y >= 0 && x <= DV.map.w && y <= DV.map.h;
    const S = { mode: "campaign", turn: -1, kind: null, sel: null, auto: false, autoTimer: 0, userMoved: false, pieces: [], oldPieces: [], moves: [], pins: [], focusCam: null, focusPoints: [] };
    const CR = DV.crystals.filter((c) => onBoard(xyOf(c.placeId))).map((c, i) => ({ ...c, key: c.id, x: xyOf(c.placeId)[0], y: xyOf(c.placeId)[1], rise: 0, from: 0, target: 1, active: false, dim: false, selected: false, seed: i * 1.7 }));
    const crByKey = new Map(CR.map((c) => [c.key, c]));

    function region() {
      const r = stage.getBoundingClientRect(), wide = r.width >= 1024, phone = r.width < 641;
      if (wide) {
        const k = root.querySelector(".ld-kinds").getBoundingClientRect(), p = root.querySelector(".ld-panel").getBoundingClientRect();
        const x = k.right - r.left + 24, w = p.left - r.left - 24 - x;
        return { x, y: 70, w: Math.max(200, w), h: Math.max(200, r.height - 70 - 112) };
      }
      const top = phone ? 112 : 120, bottom = phone ? 104 : 112;
      return { x: 16, y: top, w: Math.max(120, r.width - 32), h: Math.max(120, r.height - top - bottom) };
    }
    const camFor = (points, extra = {}) => { S.focusOpts = extra; const pts = points.filter(onBoard); return table.viewFor(pts.length ? pts : table.boardCorners(), region(), extra); };
    table.onResize = () => { if (!S.userMoved && S.focusPoints.length) { S.focusCam = camFor(S.focusPoints, S.focusOpts); if (S.idle) table.setCam(S.focusCam); } };
    table.onUserMove = () => { S.userMoved = true; };
    table.onRecentre = () => { if (!S.focusCam) return; S.userMoved = false; S.focusCam = camFor(S.focusPoints, S.focusOpts); table.controls.glideTo(S.focusCam); };
    table.onCrystal = (key) => selectCrystal(key);
    table.onHover = (key, x, y) => {
      const c = key && crByKey.get(key);
      hover.hidden = !c;
      if (c) { hover.innerHTML = `<b>${esc(c.label)}</b><span>${esc(DV.atlas[c.placeId].name)}</span>`; hover.style.transform = `translate(${x + 14}px, ${y + 10}px)`; }
    };
    let reservedCache = null;
    table.reserved = () => {
      if (reservedCache) return reservedCache;
      const o = stage.getBoundingClientRect();
      reservedCache = [".ld-kinds", ".ld-modes", ".ld-time", ".ld-legend"].map((sel) => stage.querySelector(sel)?.getBoundingClientRect()).filter((r) => r && r.width).map((r) => [r.left - o.left - 6, r.top - o.top - 6, r.right - o.left + 6, r.bottom - o.top + 6]);
      requestAnimationFrame(() => { reservedCache = null; });
      return reservedCache;
    };

    // ── Crystals: targets, then an eased rise from where each stands ──
    function aimCrystals(fn) { CR.forEach((c) => { c.from = c.rise; Object.assign(c, { active: false, dim: false, selected: false, quiet: false }, fn(c)); }); }
    function stepCrystals(p, a = 0.12, b = 0.7) {
      CR.forEach((c, i) => { const s = a + (i / CR.length) * 0.15, k = easeOut(span(p, s, b + 0.15 * (i / CR.length))); c.rise = c.from + (c.target - c.from) * k; });
    }
    const sceneOf = (extra = {}) => ({ crystals: CR, pieces: [], moves: [], pins: [], peakLabels: table.cam.zoom > 2.4, ...extra });
    function fly(from, p, a = 0, b = 0.4) { if (!S.userMoved) table.setCam(table.lerpCam(from, S.focusCam, easeInOut(span(p, a, b)))); }

    // ── Overview: every crystal standing ──
    function overview() {
      stopAuto(); S.mode = "campaign"; S.turn = -1; S.kind = null; S.sel = null; S.userMoved = false; S.idle = false; syncUi();
      S.focusPoints = CR.map((c) => [c.x, c.y]);
      S.focusCam = camFor(S.focusPoints, { yaw: -8 * R, pitch: 48 * R, minSpan: 300 });
      aimCrystals(() => ({ target: 1, active: true, quiet: true }));
      const from = { ...table.cam };
      panel.innerHTML = LandPanel.overview(); renderTimeline();
      Clock.run({ label: "The land: every crystal rises", duration: 2600, frame: (p) => { fly(from, p); stepCrystals(p); table.setScene(sceneOf()); },
        moving: (p) => [p < 0.4 ? "camera settles on the land" : "", p > 0.12 && p < 0.85 ? "crystals rise at their places" : ""].filter(Boolean), done: () => { S.idle = true; } });
    }

    // ── Campaign turns ──
    function piecesOf(t) {
      const groups = {};
      t.pieces.forEach((p, i) => (groups[p.place] ??= []).push(i));
      const SPREAD = { 1: [[0, 0]], 2: [[-0.9, 0], [0.9, 0]], 3: [[-1.2, 0.2], [1.2, 0.2], [0, -1.1]] };
      return t.pieces.map((p, i) => { const g = groups[p.place], o = (SPREAD[g.length] ?? SPREAD[1])[g.indexOf(i)] ?? [0, 0];
        return { key: `${t.n}-${i}`, x: xyOf(p.place)[0], y: xyOf(p.place)[1], role: p.role, icon: p.icon, label: p.label, place: DV.atlas[p.place].name, offset: o, side: o[0] < 0 ? "left" : "", falls: p.falls, rise: 0 }; });
    }
    const movesOf = (t) => t.moves.map((m, i) => ({ key: `${t.n}-${i}`, pts: m.path.map(xyOf), path: m.path, kind: m.kind, role: m.role ?? MOVE_ROLE[m.kind] ?? "david", label: m.label, halt: m.halt, stops: m.stops, draw: 0 }));
    function pinsFor(t) {
      const here = new Set(t.pieces.map((p) => p.place)), seen = new Set(), pins = [];
      for (const x of turns.slice(0, t.n - 1)) { x.pieces.forEach((p) => seen.add(p.place)); x.moves.forEach((m) => m.path.forEach((id) => seen.add(id))); }
      for (const id of seen) if (!here.has(id) && onBoard(xyOf(id))) pins.push({ key: `v-${id}`, x: xyOf(id)[0], y: xyOf(id)[1], state: "visited", role: "place" });
      for (const m of t.moves) m.path.forEach((id, k) => { if (here.has(id) || !onBoard(xyOf(id)) || pins.some((p) => p.key === `c-${id}`)) return; pins.push({ key: `c-${id}`, id, x: xyOf(id)[0], y: xyOf(id)[1], state: "current", role: "place", label: "", stop: k, move: m }); });
      return pins;
    }
    const turnCrystals = (t) => new Set([...(TURN_CRYSTALS[t.n] ?? []), ...t.events.map((e) => `ev-${e}`)]);
    function goTurn(i) {
      i = Math.max(0, Math.min(turns.length - 1, i));
      clearTimeout(S.autoTimer);
      const t = turns[i];
      S.oldPieces = S.mode === "campaign" && S.turn >= 0 && S.turn !== i ? S.pieces.map((p) => ({ ...p, key: `old-${p.key}` })) : [];
      S.mode = "campaign"; S.turn = i; S.kind = null; S.sel = null; S.userMoved = false; S.idle = false; syncUi();
      S.pieces = piecesOf(t); S.moves = movesOf(t); S.pins = pinsFor(t);
      S.focusPoints = [...t.pieces.map((p) => xyOf(p.place)), ...t.moves.flatMap((m) => m.path.map(xyOf))];
      const yaw = (t.n === 1 ? -16 : -12 + ((t.n * 7) % 5) * 5) * R;
      S.focusCam = camFor(S.focusPoints, { yaw, pitch: (t.n === 1 ? 54 : 50) * R, minSpan: t.n === 1 ? 1250 : 125 });
      const mine = turnCrystals(t);
      aimCrystals((c) => (mine.has(c.key) ? { target: 1, active: true } : { target: 0.4, dim: true }));
      const from = { ...table.cam };
      panel.innerHTML = LandPanel.turn(t); panel.scrollTop = 0; renderTimeline();
      const waypoints = t.moves.some((m) => m.stops), dur = waypoints ? 5200 : t.moves.length > 2 ? 4200 : 3200;
      Clock.run({ label: `Turn ${t.n}: ${t.title}`, duration: dur, frame: (p) => frameTurn(t, from, p), moving: (p) => movingNow(t, p),
        done: () => { S.idle = true; if (S.auto && S.mode === "campaign") S.autoTimer = setTimeout(() => (S.turn < turns.length - 1 ? goTurn(S.turn + 1) : stopAuto()), 3200); } });
    }
    const moveDraw = (m, j, n, p, waypoints) => {
      const a = waypoints ? 0.36 : 0.42 + j * (0.24 / Math.max(1, n)), b = waypoints ? 0.97 : Math.min(0.98, a + 0.5);
      let d = span(p, a, b);
      if (m.halt) d = d < 0.4 ? (d / 0.4) * 0.55 : d < 0.62 ? 0.55 : 0.55 + ((d - 0.62) / 0.38) * 0.45;
      return { d: easeInOut(d), holding: m.halt && span(p, a, b) >= 0.4 && span(p, a, b) < 0.62 };
    };
    function frameTurn(t, from, p) {
      fly(from, p, 0, 0.36);
      const oldRise = 1 - easeOut(span(p, 0, 0.2));
      S.oldPieces.forEach((pc) => { pc.rise = Math.min(pc.rise, 1) * oldRise; });
      S.pieces.forEach((pc, i) => { const a = 0.26 + i * 0.05; pc.rise = Math.max(0, easeBack(span(p, a, a + 0.22))); if (pc.falls) { const f = span(p, 0.86, 1); pc.fallen = f > 0; if (f > 0) pc.rise = 1 - 0.78 * easeOut(f); } });
      stepCrystals(p, 0.2, 0.6);
      const waypoints = t.moves.some((m) => m.stops);
      S.moves.forEach((m, j) => {
        const { d, holding } = moveDraw(m, j, S.moves.length, p, waypoints);
        m.draw = d; m.tipLabel = holding ? esc(m.halt) : d > 0 && d < 1 && m.label ? esc(m.label) : "";
        if (m.stops) {
          const lens = []; let tot = 0;
          for (let k = 0; k < m.pts.length - 1; k++) { lens.push(tot); tot += Math.hypot(m.pts[k + 1][0] - m.pts[k][0], m.pts[k + 1][1] - m.pts[k][1]); }
          lens.push(tot);
          const reached = lens.filter((l) => l <= d * tot + 0.01).length - 1;
          if (d > 0 && d < 1) m.tipLabel = esc(DV.atlas[m.path[Math.max(0, reached)]].name);
          S.pins.forEach((pin) => { if (pin.move?.path === m.path) { pin.label = pin.stop <= reached ? `<b>${esc(DV.atlas[pin.id].name)}</b>` : ""; pin.state = pin.stop <= reached ? "current" : "visited"; } });
          panel.querySelectorAll(".dp-step").forEach((el) => el.classList.toggle("is-reached", Number(el.dataset.k) <= reached));
        } else S.pins.forEach((pin) => { if (pin.move?.path === m.path) pin.label = d > 0.98 || pin.stop === 0 ? esc(DV.atlas[pin.id].name) : ""; });
      });
      table.setScene(sceneOf({ pieces: [...S.oldPieces, ...S.pieces], moves: S.moves, pins: S.pins }));
    }
    function movingNow(t, p) {
      const out = [];
      if (p < 0.36) out.push("camera flies to the turn");
      if (p < 0.2 && S.oldPieces.length) out.push("last turn's pieces sink");
      S.pieces.forEach((pc, i) => { const a = 0.26 + i * 0.05; if (p >= a && p < a + 0.22) out.push(`${pc.label} rises`); if (pc.falls && p >= 0.86) out.push(`${pc.label}: the piece falls`); });
      if (p > 0.2 && p < 0.75) out.push("the turn's crystals rise, the rest dim");
      S.moves.forEach((m) => { if (m.draw > 0 && m.draw < 1) out.push(`${MOVE_NAME[m.kind]}: ${m.path.map((id) => DV.atlas[id].name).join(" → ")}`); });
      return out;
    }

    // ── Crystals by kind, and one crystal ──
    function setKind(id) {
      if (!id || S.kind === id) { overview(); return; }
      stopAuto(); S.kind = id; S.sel = null; S.userMoved = false; S.idle = false; syncUi();
      const list = CR.filter((c) => c.kind === id);
      S.focusPoints = list.map((c) => [c.x, c.y]);
      S.focusCam = camFor(S.focusPoints, { minSpan: 160, pitch: 50 * R });
      aimCrystals((c) => (c.kind === id ? { target: 1, active: true } : { target: 0 }));
      const from = { ...table.cam }, k = DV.kinds.find((x) => x.id === id);
      panel.innerHTML = LandPanel.kind(k, list); panel.scrollTop = 0;
      Clock.run({ label: `Crystals: ${k.label}`, duration: 2200, frame: (p) => { fly(from, p, 0, 0.45); stepCrystals(p, 0.05, 0.6); table.setScene(sceneOf()); },
        moving: (p) => [p < 0.45 ? "camera" : "", p < 0.8 ? `${k.label} crystals rise; the others sink` : ""].filter(Boolean), done: () => { S.idle = true; } });
    }
    function selectCrystal(key) {
      const c = crByKey.get(key);
      if (!c) return;
      stopAuto(); S.sel = key; S.userMoved = false; S.idle = false;
      S.focusPoints = [[c.x, c.y]]; S.focusCam = camFor(S.focusPoints, { minSpan: 230, pitch: 50 * R });
      const keepKind = S.kind;
      aimCrystals((x) => (x.key === key ? { target: 1, selected: true, active: true } : keepKind ? (x.kind === keepKind ? { target: 1, active: true, dim: true } : { target: 0 }) : { target: 0.6, dim: true }));
      const from = { ...table.cam };
      panel.innerHTML = LandPanel.crystal(c); panel.scrollTop = 0;
      Clock.run({ label: `Crystal: ${c.label}`, duration: 1600, frame: (p) => { fly(from, p, 0, 0.6); stepCrystals(p, 0, 0.55); table.setScene(sceneOf({ pieces: S.mode === "campaign" && S.turn >= 0 && !keepKind ? S.pieces : [] })); },
        moving: (p) => [p < 0.6 ? "camera flies to the crystal" : "", "the crystal lifts; the rest dim"], done: () => { S.idle = true; } });
    }

    // ── Places and powers ──
    function showPlaces(selected = null) {
      stopAuto(); S.mode = "places"; S.kind = null; S.sel = null; S.idle = false; syncUi();
      const list = DV.places.map((p, i) => ({ ...p, i, xy: xyOf(p.placeId) }));
      const pins = list.filter((p) => onBoard(p.xy)).map((p) => ({ key: `pl-${p.i}`, x: p.xy[0], y: p.xy[1], state: "all", role: p.placeId === DV.person.capital.placeId ? "david" : "place", label: `<button type="button" data-place-i="${p.i}">${esc(p.name)}</button>`, button: true }));
      S.focusPoints = list.filter((p) => onBoard(p.xy)).map((p) => p.xy);
      const sel = selected !== null ? list[selected] : null;
      S.focusCam = sel && onBoard(sel.xy) ? camFor([sel.xy], { minSpan: 90 }) : camFor(S.focusPoints, { yaw: -4 * R, pitch: 48 * R });
      S.userMoved = false;
      aimCrystals((c) => (sel && c.placeId === sel.placeId ? { target: 1, active: true } : { target: 0.45, dim: true }));
      const from = { ...table.cam }, sorted = [...pins].sort((a, b) => a.y - b.y);
      Clock.run({ label: sel ? `Place: ${sel.name}` : "Every place of the reign", duration: 2200,
        frame: (p) => { fly(from, p, 0, 0.5); stepCrystals(p, 0.1, 0.6); const shown = sorted.filter((_, k) => p >= 0.25 + (k / sorted.length) * 0.6); table.setScene(sceneOf({ peakLabels: true, pins: shown.map((pin) => (sel && pin.key === `pl-${sel.i}` ? { ...pin, state: "current", role: "david" } : pin)) })); },
        moving: (p) => [p < 0.5 ? "camera" : "", p < 0.85 ? "places light up north to south" : ""].filter(Boolean), done: () => { S.idle = true; } });
      panel.innerHTML = LandPanel.places(sel); panel.scrollTop = 0;
    }
    function showPowers(selected = null) {
      stopAuto(); S.mode = "powers"; S.kind = null; S.sel = null; S.idle = false; syncUi();
      const pieces = [];
      DV.powers.forEach((pw, i) => pw.places.forEach((id, k) => { const xy = xyOf(id); if (!onBoard(xy)) return; pieces.push({ key: `pw-${i}-${k}`, x: xy[0], y: xy[1], role: "power", icon: "flag", label: pw.places.length > 1 ? `${pw.power.split(" (")[0]} · ${DV.atlas[id].name}` : pw.power, place: DV.atlas[id].name, rise: 0, height: selected === i ? 84 : 56 }); }));
      S.focusPoints = pieces.map((p) => [p.x, p.y]);
      const sel = selected !== null ? DV.powers[selected] : null;
      S.focusCam = sel ? camFor(sel.places.map(xyOf), { minSpan: 120 }) : camFor(S.focusPoints, { yaw: 4 * R, pitch: 50 * R });
      S.userMoved = false;
      aimCrystals((c) => (c.kind === "court" || c.kind === "battle" ? { target: 0.55, dim: true } : { target: 0.3, dim: true }));
      const from = { ...table.cam };
      Clock.run({ label: sel ? `Power: ${sel.power}` : "The powers of the day", duration: 2400,
        frame: (p) => { fly(from, p, 0, 0.45); stepCrystals(p, 0.05, 0.5); pieces.forEach((pc, k) => { pc.rise = Math.max(0, easeBack(span(p, 0.3 + k * 0.04, 0.55 + k * 0.04))); }); table.setScene(sceneOf({ pieces, peakLabels: true })); },
        moving: (p) => [p < 0.45 ? "camera" : "", ...pieces.filter((pc, k) => p >= 0.3 + k * 0.04 && p < 0.55 + k * 0.04).map((pc) => `${pc.label} rises`)].filter(Boolean), done: () => { S.idle = true; } });
      panel.innerHTML = LandPanel.powers(sel); panel.scrollTop = 0;
    }

    // ── The timeline: a fine line of the 27 turns in their five phases ──
    function renderTimeline() {
      const t = S.turn >= 0 ? turns[S.turn] : null;
      timeline.innerHTML = `
        <button type="button" class="tl-step" data-turn="prev" aria-label="Previous turn" ${!t || S.turn === 0 ? "disabled" : ""}>${icon("chevronLeft", 18)}</button>
        <div class="tl-mid">
          <p class="tl-now">${t ? `<span class="tl-n">${t.n}<small> / ${turns.length}</small></span><span class="tl-t">${esc(t.title)}</span><span class="tl-ref">${esc(refText(t.verse))}</span>` : `<span class="tl-n">${turns.length}<small> turns</small></span><span class="tl-t">The campaign, from Bethlehem to the city of David</span>`}</p>
          <div class="tl-line">${phases.map((p) => { const mine = turns.filter((x) => x.phase === p.id); return `<div class="tl-phase ${t && p.id === t.phase ? "is-on" : ""}" style="flex:${mine.length}"><div class="tl-dots">${mine.map((x) => `<button type="button" data-turn="${x.n - 1}" class="${t && x.n - 1 < S.turn ? "is-past" : t && x.n - 1 === S.turn ? "is-now" : ""} ${x.anointing ? "is-oil" : ""}" aria-label="Turn ${x.n}: ${esc(x.title)}" title="${x.n}. ${esc(x.title)}"></button>`).join("")}</div><span>${esc(p.name)}</span></div>`; }).join("")}</div>
        </div>
        <button type="button" class="tl-step" data-turn="next" aria-label="${t ? "Next turn" : "Begin with turn 1"}" ${t && S.turn === turns.length - 1 ? "disabled" : ""}>${icon("chevronRight", 18)}</button>
        <button type="button" class="tl-play ${S.auto ? "is-on" : ""}" data-turn="auto" aria-pressed="${S.auto}" aria-label="${S.auto ? "Pause the turns" : "Play the turns one after another"}" title="${S.auto ? "Pause" : "Play the turns"}">${icon(S.auto ? "pause" : "play", 14)}</button>`;
    }
    function stopAuto() { if (S.auto) { S.auto = false; clearTimeout(S.autoTimer); } }
    function setAuto(v) { S.auto = v; clearTimeout(S.autoTimer); if (v) goTurn(S.turn < 0 || S.turn >= turns.length - 1 ? 0 : S.turn + 1); else renderTimeline(); }
    function syncUi() {
      root.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === S.mode)));
      root.querySelectorAll(".kchip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === S.kind)));
      stage.dataset.view = S.mode;
      if (S.mode !== "campaign" || S.kind) renderTimeline();
    }

    // ── Events ──
    root.addEventListener("click", (e) => {
      const tb = e.target.closest("[data-turn]");
      if (tb) { const v = tb.dataset.turn; if (v === "prev") goTurn(S.turn - 1); else if (v === "next") goTurn(S.turn < 0 ? 0 : S.turn + 1); else if (v === "auto") setAuto(!S.auto); else goTurn(Number(v)); return; }
      const md = e.target.closest("button[data-mode]");
      if (md) { const m = md.dataset.mode; if (m === "campaign") (S.turn >= 0 ? goTurn(S.turn) : overview()); else if (m === "places") showPlaces(); else showPowers(); return; }
      const kc = e.target.closest(".kchip");
      if (kc) { setKind(kc.dataset.kind); return; }
      if (e.target.closest("[data-kind-clear]")) { overview(); return; }
      if (e.target.closest("[data-crystal-clear]")) { if (S.kind) { const k = S.kind; S.kind = null; setKind(k); } else if (S.turn >= 0) goTurn(S.turn); else overview(); return; }
      const cr = e.target.closest("[data-crystal]");
      if (cr) { selectCrystal(cr.dataset.crystal); return; }
      const pl = e.target.closest("[data-place-i]");
      if (pl) { showPlaces(Number(pl.dataset.placeI)); return; }
      const pw = e.target.closest("[data-power]");
      if (pw) { showPowers(Number(pw.dataset.power)); return; }
      const oc = e.target.closest("[data-open-cat]");
      if (oc) { Reign.open(oc.dataset.openCat, Number(oc.dataset.openEvent)); return; }
      const tok = e.target.closest(".tb-token");
      if (tok) {
        const key = tok.dataset.key.replace(/^pc-/, "");
        if (key.startsWith("pw-")) { showPowers(Number(key.split("-")[1])); return; }
        const row = panel.querySelector(`[data-piece="${key}"]`);
        if (row) { panel.querySelectorAll(".dp-pieces li").forEach((li) => li.classList.toggle("is-on", li === row)); row.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" }); }
      }
    });
    stage.addEventListener("keydown", (e) => {
      if (S.mode !== "campaign") return;
      if (e.key === "ArrowRight") { e.preventDefault(); goTurn(S.turn + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goTurn(S.turn - 1); }
    });

    table.setCam(camFor(table.boardCorners(), { yaw: -8 * R, pitch: 48 * R }));
    overview();
    const toStage = () => stage.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
    Object.assign(Land, {
      goTurn: (i) => { toStage(); goTurn(i); },
      showPlaces: (i = null) => { toStage(); showPlaces(i); },
      showPowers: (i = null) => { toStage(); showPowers(i); },
      table, state: S,
    });
  };
})();
