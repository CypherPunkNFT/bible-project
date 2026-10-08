// The campaign: the war table played turn by turn. Each turn flies the camera, raises its pieces and draws its moves
// (one Clock animation the ticker can slow and step); the dispatch panel carries the turn's text, verses and evidence.
// Two more views use the same table: every place of the reign, and the powers of the day.
(() => {
  const ROLE_NAME = { david: "David's side", enemy: "Against him", ally: "Friendly power", prophet: "Prophet", ark: "Worship", rival: "Rival for the throne", house: "House of Saul", power: "Power of the day" };
  const MOVE_ROLE = { march: "david", pursuit: "david", flight: "david", circuit: "david", procession: "ark", gift: "ally", enemy: "enemy" };
  const MOVE_NAME = { march: "march", pursuit: "pursuit", flight: "flight", circuit: "circuit", procession: "procession", gift: "gifts", enemy: "enemy march" };
  const R = Math.PI / 180;

  window.Game = {};
  Game.mount = (root) => {
    const turns = DV.turns, phases = DV.phases;
    root.innerHTML = `
      <div class="wt-stage" id="table">
        <div class="wt-table"></div>
        <div class="wt-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <header class="wt-title">
          <span class="kicker">${icon("crown", 15)}${esc(DV.person.title)}</span>
          <h1>David</h1>
          <p>${esc(DV.person.tagline)}</p>
        </header>
        <div class="wt-modes" role="tablist" aria-label="What the table shows">
          ${[["campaign", "Campaign", "swords"], ["places", "Places", "pin"], ["powers", "Powers", "globe"]].map(([id, l, i]) => `<button type="button" role="tab" data-mode="${id}" aria-selected="${id === "campaign"}">${icon(i, 18)}<span>${l}</span></button>`).join("")}
        </div>
        <div class="wt-cam" aria-label="Move the table">
          <button type="button" data-cam="zin" aria-label="Zoom in" title="Zoom in">${icon("zoomIn", 19)}</button>
          <button type="button" data-cam="zout" aria-label="Zoom out" title="Zoom out">${icon("zoomOut", 19)}</button>
          <button type="button" data-cam="rl" aria-label="Turn the table left" title="Turn left">${icon("rotL", 18)}</button>
          <button type="button" data-cam="rr" aria-label="Turn the table right" title="Turn right">${icon("rotR", 18)}</button>
          <button type="button" data-cam="up" aria-label="Look more from above" title="Flatter">${icon("chevronUp", 19)}</button>
          <button type="button" data-cam="down" aria-label="Look more from the side" title="Steeper">${icon("chevronDown", 19)}</button>
          <button type="button" data-cam="fit" aria-label="Back to this turn's view" title="Recentre">${icon("target", 18)}</button>
        </div>
        <nav class="wt-turnbar" aria-label="Turns"></nav>
      </div>
      <aside class="wt-dispatch" aria-live="polite"><div class="dp-scroll"></div></aside>`;
    const stage = root.querySelector(".wt-stage"), dispatch = root.querySelector(".dp-scroll"), turnbar = root.querySelector(".wt-turnbar");
    const table = WarTable(root.querySelector(".wt-table"));
    const xyOf = (id) => DV.atlas[id]?.xy;
    const onBoard = ([x, y]) => x >= 0 && y >= 0 && x <= DV.map.w && y <= DV.map.h;

    const S = { mode: "campaign", turn: 0, prevCam: null, userMoved: false, auto: false, autoTimer: 0, pieces: [], oldPieces: [], moves: [], pins: [], offboard: [], focusCam: null };

    function region() {
      const r = stage.getBoundingClientRect(), wide = r.width >= 1024;
      const right = wide ? Math.min(460, r.width * 0.34) : 0;
      const phone = r.width < 641, top = wide ? 150 : phone ? 118 : 128, bottom = wide ? 150 : phone ? 205 : 150;
      return { x: wide ? 110 : 16, y: top, w: Math.max(120, r.width - right - (wide ? 140 : phone ? 84 : 100)), h: Math.max(120, r.height - top - bottom) };
    }
    table.rightInset = 0;
    table.onResize = () => { table.rightInset = stage.getBoundingClientRect().width >= 1024 ? Math.min(460, stage.getBoundingClientRect().width * 0.34) : 0; if (!S.userMoved && S.focusCam) { S.focusCam = camFor(S.focusPoints, S.focusOpts); if (!Clock.active || S.idle) table.setCam(S.focusCam); } };
    table.onUserMove = () => { S.userMoved = true; };
    // Labels keep out from under the HUD (title, modes, camera buttons, turn bar).
    let reservedCache = null;
    table.reserved = () => {
      if (reservedCache) return reservedCache;
      const o = stage.getBoundingClientRect();
      reservedCache = [".wt-title", ".wt-modes", ".wt-cam", ".wt-turnbar"].map((sel) => stage.querySelector(sel)?.getBoundingClientRect()).filter(Boolean).map((r) => [r.left - o.left - 6, r.top - o.top - 6, r.right - o.left + 6, r.bottom - o.top + 6]);
      requestAnimationFrame(() => { reservedCache = null; });
      return reservedCache;
    };

    function camFor(points, extra = {}) {
      S.focusOpts = extra;
      const pts = points.filter(onBoard);
      return table.viewFor(pts.length ? pts : table.boardCorners(), region(), extra);
    }

    // ── Scene building ──
    function piecesOf(t) {
      // Pieces that share a place stand side by side, their names on the outside.
      const groups = {};
      t.pieces.forEach((p, i) => (groups[p.place] ??= []).push(i));
      const SPREAD = { 1: [[0, 0]], 2: [[-0.9, 0], [0.9, 0]], 3: [[-1.2, 0.2], [1.2, 0.2], [0, -1.1]] };
      return t.pieces.map((p, i) => {
        const g = groups[p.place], k = g.indexOf(i), o = (SPREAD[g.length] ?? SPREAD[1])[k] ?? [0, 0];
        return { key: `${t.n}-${i}`, x: xyOf(p.place)[0], y: xyOf(p.place)[1], role: p.role, icon: p.icon, label: p.label, place: DV.atlas[p.place].name, offset: o, side: o[0] < 0 ? "left" : "", falls: p.falls, rise: 0, src: p };
      });
    }
    function movesOf(t) {
      return t.moves.map((m, i) => ({ key: `${t.n}-${i}`, pts: m.path.map(xyOf), path: m.path, kind: m.kind, role: m.role ?? MOVE_ROLE[m.kind] ?? "david", label: m.label, halt: m.halt, stops: m.stops, draw: 0 }));
    }
    const visitedBefore = (n) => {
      const seen = new Map();
      for (const t of turns.slice(0, n)) {
        for (const p of t.pieces) seen.set(p.place, true);
        for (const m of t.moves) m.path.forEach((id) => seen.set(id, true));
      }
      return [...seen.keys()];
    };
    function pinsFor(t) {
      const here = new Set(t.pieces.map((p) => p.place));
      const pins = visitedBefore(t.n - 1).filter((id) => !here.has(id) && onBoard(xyOf(id))).map((id) => ({ key: `v-${id}`, x: xyOf(id)[0], y: xyOf(id)[1], state: "visited", role: "place" }));
      for (const m of t.moves) m.path.forEach((id, k) => { if (here.has(id) || !onBoard(xyOf(id))) return; if (pins.some((p) => p.key === `c-${id}`)) return; pins.push({ key: `c-${id}`, id, x: xyOf(id)[0], y: xyOf(id)[1], state: "current", role: "place", label: "", stop: k, move: m }); });
      return pins;
    }

    // ── Campaign turns ──
    function goTurn(i, { instant = false } = {}) {
      i = Math.max(0, Math.min(turns.length - 1, i));
      clearTimeout(S.autoTimer);
      S.mode = "campaign"; syncModes();
      const t = turns[i];
      S.oldPieces = S.turn === i && S.pieces.length ? [] : S.pieces.map((p) => ({ ...p, key: `old-${p.key}`, active: false }));
      S.turn = i; S.userMoved = false; S.idle = false;
      S.pieces = piecesOf(t); S.moves = movesOf(t); S.pins = pinsFor(t);
      S.offboard = (t.offboard ?? []).map((o) => ({ ...o, x: xyOf(o.place)[0], y: xyOf(o.place)[1], show: 0 }));
      S.focusPoints = [...t.pieces.map((p) => xyOf(p.place)), ...t.moves.flatMap((m) => m.path.map(xyOf))];
      const yaw = (t.n === 1 ? -16 : -12 + ((t.n * 7) % 5) * 5) * R;
      S.focusCam = camFor(S.focusPoints, { yaw, pitch: (t.n === 1 ? 58 : 54) * R, minSpan: t.n === 1 ? 1250 : 125 });
      const from = { ...table.cam };
      renderDispatch(t);
      renderTurnbar();
      stage.dataset.mood = t.sin ? "sin" : t.n === turns.length ? "end" : "";
      const waypoints = t.moves.some((m) => m.stops), dur = waypoints ? 5200 : t.moves.length > 2 ? 4200 : 3200;
      Clock.run({
        label: `Turn ${t.n}: ${t.title}`,
        duration: instant ? 1 : dur,
        frame: (p) => frameTurn(t, from, p, dur),
        moving: (p) => movingNow(t, p),
        done: () => { S.idle = true; if (S.auto && S.mode === "campaign") S.autoTimer = setTimeout(() => { if (S.turn < turns.length - 1) goTurn(S.turn + 1); else setAuto(false); }, 3200); },
      });
    }
    // Where each move's tip is at time p (0..1 of the turn), with the procession's halt.
    const moveDraw = (m, j, n, p, waypoints) => {
      const a = waypoints ? 0.36 : 0.42 + j * (0.24 / Math.max(1, n)), b = waypoints ? 0.97 : Math.min(0.98, a + 0.5);
      let d = span(p, a, b);
      if (m.halt) d = d < 0.4 ? (d / 0.4) * 0.55 : d < 0.62 ? 0.55 : 0.55 + ((d - 0.62) / 0.38) * 0.45;
      return { d: easeInOut(d), holding: m.halt && span(p, a, b) >= 0.4 && span(p, a, b) < 0.62 };
    };
    function frameTurn(t, from, p) {
      const camT = easeInOut(span(p, 0, 0.36));
      if (!S.userMoved) table.setCam(table.lerpCam(from, S.focusCam, camT));
      const oldRise = 1 - easeOut(span(p, 0, 0.2));
      S.oldPieces.forEach((pc) => { pc.rise = pc.fallen ? Math.min(pc.rise, 0.25) * oldRise : oldRise; });
      S.pieces.forEach((pc, i) => {
        const a = 0.26 + i * 0.05;
        pc.rise = Math.max(0, easeBack(span(p, a, a + 0.22)));
        pc.active = p > 0.3;
        if (pc.falls) { const f = span(p, 0.86, 1); if (f > 0) { pc.fallen = true; pc.rise = 1 - 0.78 * easeOut(f); } else pc.fallen = false; }
      });
      const waypoints = t.moves.some((m) => m.stops);
      S.moves.forEach((m, j) => {
        const { d, holding } = moveDraw(m, j, S.moves.length, p, waypoints);
        m.draw = d;
        m.tipLabel = holding ? esc(m.halt) : d > 0 && d < 1 && m.label ? esc(m.label) : "";
        if (m.stops) {
          // pins along the path light up as the tip passes them
          const lens = []; let tot = 0;
          for (let k = 0; k < m.pts.length - 1; k++) { const l = Math.hypot(m.pts[k + 1][0] - m.pts[k][0], m.pts[k + 1][1] - m.pts[k][1]); lens.push(tot); tot += l; }
          lens.push(tot);
          const reached = lens.filter((l) => l <= d * tot + 0.01).length - 1;
          m.reached = reached;
          if (d > 0 && d < 1) m.tipLabel = esc(DV.atlas[m.path[Math.max(0, reached)]].name);
          S.pins.forEach((pin) => { if (pin.move?.path === m.path) { pin.label = pin.stop <= reached ? `<b>${esc(DV.atlas[pin.id].name)}</b>` : ""; pin.state = pin.stop <= reached ? "current" : "visited"; } });
          dispatch.querySelectorAll(".dp-step").forEach((el) => el.classList.toggle("is-reached", Number(el.dataset.k) <= reached));
        } else {
          S.pins.forEach((pin) => { if (pin.move?.path === m.path) pin.label = d > 0.98 || pin.stop === 0 ? esc(DV.atlas[pin.id].name) : ""; });
        }
      });
      S.offboard.forEach((o) => { o.show = span(p, 0.5, 0.8); });
      table.setScene({ pieces: [...S.oldPieces, ...S.pieces], moves: S.moves, pins: S.pins, offboard: p > 0.5 ? S.offboard : [], peakLabels: table.cam.zoom > 2.4 });
    }
    function movingNow(t, p) {
      const out = [];
      if (p < 0.36) out.push("camera flies to the turn");
      if (p < 0.2 && S.oldPieces.length) out.push("last turn's pieces sink");
      S.pieces.forEach((pc, i) => { const a = 0.26 + i * 0.05; if (p >= a && p < a + 0.22) out.push(`${pc.label} rises`); if (pc.falls && p >= 0.86) out.push(`${pc.label}: the piece falls`); });
      S.moves.forEach((m) => { if (m.draw > 0 && m.draw < 1) out.push(`${MOVE_NAME[m.kind]}: ${m.path.map((id) => DV.atlas[id].name).join(" → ")}`); });
      return out;
    }

    // ── The dispatch panel ──
    const phaseOf = (t) => phases.find((ph) => ph.id === t.phase);
    function reignBar(t) {
      const total = 40.5, heb = 7.5;
      const mark = t.yearN ? `<i class="rb-mark ${t.yearN > 30 ? "is-end" : t.yearN < 5 ? "is-start" : ""}" style="left:${(Math.min(total, t.yearN - (t.yearN === 1 ? 1 : 0.5)) / total) * 100}%"><b>${esc(t.year)}</b></i>` : "";
      const note = t.yearN ? "" : t.year === "Before the reign" ? "Before the reign began." : t.year === "In the Hebron years" ? "During the years at Hebron (2 Samuel 3:1)." : "Scripture does not give the year of the reign.";
      return `<div class="rb ${t.yearN ? "" : "is-undated"} ${t.year === "Before the reign" ? "is-before" : ""}">
        <div class="rb-track"><span class="rb-heb" style="width:${(heb / total) * 100}%" title="Hebron: seven years and six months">Hebron</span><span class="rb-jer">Jerusalem · 33 years</span>${mark}</div>
        <small>${note ? `${icon("calendar", 13)} ${note}` : `${icon("calendar", 13)} ${esc(t.year)} of forty (${refLink([10005004, 10005005])})`}</small></div>`;
    }
    function pieceRows(t) {
      return `<ul class="dp-pieces">${t.pieces.map((p, i) => {
        const a = DV.atlas[p.place];
        return `<li data-piece="${t.n}-${i}" class="r-${p.role}"><span class="dp-pi">${icon(p.icon, 18)}</span><div><b>${esc(p.label)}</b><small>${esc(ROLE_NAME[p.role] ?? p.role)} · ${esc(a.name)} <span class="conf" title="How sure the Atlas is of this place">${conf(a.confidence)}</span></small>${p.verse ? `<q>${esc(DV.verses[p.verse])}</q> ${refLink(p.verse)}` : ""}</div></li>`;
      }).join("")}</ul>`;
    }
    const conf = (c) => `<i style="--c:${Math.round(c * 100)}%"></i>${c >= 0.8 ? "sure" : c >= 0.45 ? "likely" : "uncertain"} place`;
    function routeLog(m) {
      return `<ol class="dp-route">${m.path.map((id, k) => `<li class="dp-step" data-k="${k}"><b>${esc(DV.atlas[id].name)}</b>${m.stops?.[k] ? `<q>${esc(DV.verses[m.stops[k]])}</q> ${refLink(m.stops[k])}` : ""}</li>`).join("")}</ol>`;
    }
    const twoAcc = (i) => { const a = DV.twoAccounts[i]; return `<div class="dp-two"><h4>${icon("split", 15)}${esc(a.topic)}</h4><div class="two">${claim(a.first, "two-a")}${claim(a.second, "two-b")}</div></div>`; };
    const question = (id) => { const q = DV.questionById[id]; return `<div class="dp-q"><h4>${icon("help", 15)}${esc(q.question)}</h4>${q.views.map((v) => `<div class="view"><b>${esc(v.label)}</b><small>Held by ${esc(v.holders)}</small>${claim(v.argument)}</div>`).join("")}</div>`; };
    const prophet = (i) => { const p = DV.prophets[i]; return `<div class="dp-prophet"><span class="medal">${esc(p.person.name[0])}</span><div><b>${esc(p.person.name)}</b>${quoteSpan(p.quote)}${claim(p.claim)}</div></div>`; };
    function renderDispatch(t) {
      const ph = phaseOf(t);
      const anoint = t.anointing ? `<span class="tag is-gold">${icon("oil", 14)}Anointing ${t.anointing} of 3</span>` : "";
      const chron = t.chroniclesOnly ? `<span class="tag">${icon("book", 14)}Chronicles alone</span>` : "";
      const heb = t.hebron ? `<span class="tag is-gold">${icon("hourglass", 14)}Hebron: seven years and six months (2 Samuel 5:5)</span>` : "";
      const sin = t.sin ? `<span class="tag is-red">${icon("eye", 14)}The matter of Uriah</span>` : "";
      const evs = t.events.length ? `<p class="dp-evs">${icon("list", 14)}Event${t.events.length > 1 ? "s" : ""} ${t.events.map((e) => e + 1).join(", ")} of ${DV.events.length} on David's reign page · <a href="#codex" data-codex="events">see them all</a></p>` : "";
      const more = [];
      (t.differ ?? []).forEach((i) => more.push(twoAcc(i)));
      const qs = (t.questions ?? []).map(question).join("");
      dispatch.innerHTML = `<article class="dp dp-turn" style="--tone: var(--r-${t.pieces[0]?.role ?? "david"})">
        <div class="dp-top"><span>Turn <b>${t.n}</b> of ${turns.length}</span><span>${esc(ph.name)} · ${esc(ph.books)}</span></div>
        <div class="dp-head"><span class="badge">${icon(t.icon, 30, 1.5)}</span><div><h2>${esc(t.title)}</h2><div class="dp-tags">${anoint}${heb}${chron}${sin}</div></div></div>
        ${reignBar(t)}
        ${kjv(t.verse)}
        <div class="dp-claims">${t.claims.map((c) => claim(c)).join("")}</div>
        ${(t.extraVerses ?? []).map((v) => kjv(v, "kjv-sm")).join("")}
        <h3 class="dp-h">${icon("pin", 15)}On the table</h3>${pieceRows(t)}
        ${t.moves.filter((m) => m.stops).map((m) => `<h3 class="dp-h">${icon("route", 15)}${m.kind === "circuit" ? "The count's circuit" : "The way, place by place"}</h3>${routeLog(m)}`).join("")}
        ${(t.offboard ?? []).map((o) => `<div class="dp-off">${icon("arrowRight", 16)}<div><b>${esc(o.label)}</b><p>${esc(o.note)}</p>${refLink(o.verse)}</div></div>`).join("")}
        ${more.length ? expander(`Samuel${t.n >= 26 ? " and Kings" : ""} and Chronicles differ here (${more.length})`, more.join(""), { ico: "split", cls: "dp-x" }) : ""}
        ${qs ? expander("An open question", qs, { ico: "help", cls: "dp-x" }) : ""}
        ${(t.prophets ?? []).length ? expander(`The prophet${t.prophets.length > 1 ? "s" : ""} in this turn`, t.prophets.map(prophet).join(""), { ico: "scroll", cls: "dp-x", open: false }) : ""}
        ${(t.notSaid ?? []).map((i) => `<p class="dp-not">${icon("info", 14)}${esc(DV.notSaid[i])}</p>`).join("")}
        ${evs}
        <p class="dp-key">${icon("map", 14)}<span>Reading the table: arcs join places in the order the text tells them; Scripture names the places, not the roads. No borders are drawn. Peaks mark mountains the Atlas names, not to scale. Each place shows how sure the Atlas is of it.</span></p>
      </article>`;
      dispatch.scrollTop = 0;
      dispatch.parentElement.classList.remove("dp-enter"); void dispatch.offsetWidth; dispatch.parentElement.classList.add("dp-enter");
    }

    function renderTurnbar() {
      const t = turns[S.turn], ph = phaseOf(t);
      turnbar.innerHTML = `
        <button type="button" class="tb-step" data-turn="prev" aria-label="Previous turn" ${S.turn === 0 ? "disabled" : ""}>${icon("chevronLeft", 22)}</button>
        <div class="tb-mid">
          <div class="tb-now"><span class="tb-n">Turn ${t.n}<small>/${turns.length}</small></span><span class="tb-ph">${esc(ph.name)}</span><span class="tb-t">${esc(t.title)}</span></div>
          <div class="tb-track">${phases.map((p) => { const mine = turns.filter((x) => x.phase === p.id); return `<div class="tb-phase ${p.id === t.phase ? "is-on" : ""}" style="flex:${mine.length}"><span>${esc(p.name)}</span><div>${mine.map((x) => `<button type="button" data-turn="${x.n - 1}" class="${x.n - 1 < S.turn ? "is-past" : x.n - 1 === S.turn ? "is-now" : ""} ${x.anointing ? "is-oil" : ""}" aria-label="Turn ${x.n}: ${esc(x.title)}" title="${x.n}. ${esc(x.title)}"></button>`).join("")}</div></div>`; }).join("")}</div>
        </div>
        <button type="button" class="tb-auto ${S.auto ? "is-on" : ""}" data-turn="auto" aria-pressed="${S.auto}" title="Play the turns one after another">${icon(S.auto ? "pause" : "play", 18)}<span>${S.auto ? "Pause" : "Auto"}</span></button>
        <button type="button" class="tb-next" data-turn="next" ${S.turn === turns.length - 1 ? "disabled" : ""}><span>Next turn</span>${icon("chevronRight", 22)}</button>`;
    }
    function setAuto(v) { S.auto = v; clearTimeout(S.autoTimer); renderTurnbar(); if (v && !Clock.active) goTurn(S.turn + 1); else if (v) goTurn(S.turn + 1 < turns.length ? S.turn + 1 : 0); }

    // ── Places and powers ──
    function syncModes() { root.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === S.mode))); stage.dataset.mode = S.mode; }
    function showPlaces(selected = null) {
      clearTimeout(S.autoTimer); S.auto = false;
      S.mode = "places"; syncModes(); S.idle = false; stage.dataset.mood = "";
      const list = DV.places.map((p, i) => ({ ...p, i, xy: xyOf(p.placeId) }));
      const pins = list.filter((p) => onBoard(p.xy)).map((p) => ({ key: `pl-${p.i}`, x: p.xy[0], y: p.xy[1], state: "all", role: p.placeId === DV.person.capital.placeId ? "david" : "place", label: `<button type="button" data-place-i="${p.i}">${esc(p.name)}</button>`, button: true }));
      const off = list.filter((p) => !onBoard(p.xy)).map((p) => ({ label: p.name, x: p.xy[0], y: p.xy[1], show: 1 }));
      S.focusPoints = list.filter((p) => onBoard(p.xy)).map((p) => p.xy);
      const sel = selected !== null ? list[selected] : null;
      S.focusCam = sel && onBoard(sel.xy) ? camFor([sel.xy], { minSpan: 90 }) : camFor(S.focusPoints, { yaw: -4 * R, pitch: 50 * R });
      S.userMoved = false;
      const from = { ...table.cam };
      const sorted = [...pins].sort((a, b) => a.y - b.y);
      Clock.run({ label: sel ? `Place: ${sel.name}` : "Every place of the reign", duration: 2200,
        frame: (p) => { if (!S.userMoved) table.setCam(table.lerpCam(from, S.focusCam, easeInOut(span(p, 0, 0.5)))); const shown = sorted.filter((_, k) => p >= 0.25 + (k / sorted.length) * 0.6); table.setScene({ pins: shown.map((pin) => (sel && pin.key === `pl-${sel.i}` ? { ...pin, state: "current", role: "david" } : pin)), offboard: off, peakLabels: true, pieces: sel && onBoard(sel.xy) ? [{ key: "sel", x: sel.xy[0], y: sel.xy[1], role: "david", icon: "pin", label: sel.name, rise: easeBack(span(p, 0.4, 0.8)) }] : [] }); },
        moving: (p) => [p < 0.5 ? "camera" : "", p < 0.85 ? "places light up north to south" : ""].filter(Boolean), done: () => { S.idle = true; } });
      const cap = DV.person.capital;
      dispatch.innerHTML = `<article class="dp" style="--tone: var(--r-david)">
        <div class="dp-top"><span>${icon("pin", 14)} The kingdom</span><span>${DV.places.length} places named in the reign</span></div>
        <div class="dp-head"><span class="badge">${icon("castle", 30, 1.5)}</span><div><h2>${sel ? esc(sel.name) : "Every place of the reign"}</h2><div class="dp-tags"><span class="tag">${icon("info", 14)}No borders: only named places</span></div></div></div>
        ${sel ? `<div class="dp-place"><p>${esc(sel.note)}</p><p>${refList(sel.refs)}</p><p class="conf-line">${esc(DV.atlas[sel.placeId].type)} · <span class="conf">${conf(DV.atlas[sel.placeId].confidence)}</span> in the Atlas</p>${onBoard(sel.xy) ? "" : "<p>This place lies off the table.</p>"}</div>` : ""}
        <div class="dp-cap"><b>${icon("crown", 15)} Capital: ${esc(cap.name)}</b><p>${esc(cap.note)}</p><p>${refList(cap.refs)}</p></div>
        <ul class="dp-placelist">${DV.places.map((p, i) => `<li class="${sel?.i === i ? "is-on" : ""}"><button type="button" data-place-i="${i}"><b>${esc(p.name)}</b><small>${esc(p.note)}</small></button>${refList(p.refs)}</li>`).join("")}</ul>
      </article>`;
      dispatch.scrollTop = 0;
    }
    function showPowers(selected = null) {
      clearTimeout(S.autoTimer); S.auto = false;
      S.mode = "powers"; syncModes(); S.idle = false; stage.dataset.mood = "";
      const pieces = [];
      DV.powers.forEach((pw, i) => pw.places.forEach((id, k) => { const xy = xyOf(id); pieces.push({ key: `pw-${i}-${k}`, x: xy[0], y: xy[1], role: "power", icon: "flag", label: pw.places.length > 1 ? `${pw.power.split(" (")[0]} · ${DV.atlas[id].name}` : pw.power, place: DV.atlas[id].name, rise: 0, i, active: selected === i, height: selected === i ? 96 : 64 }); }));
      S.focusPoints = pieces.map((p) => [p.x, p.y]);
      const sel = selected !== null ? DV.powers[selected] : null;
      S.focusCam = sel ? camFor(sel.places.map(xyOf), { minSpan: 120 }) : camFor(S.focusPoints, { yaw: 4 * R, pitch: 52 * R });
      S.userMoved = false;
      const from = { ...table.cam };
      Clock.run({ label: sel ? `Power: ${sel.power}` : "The powers of the day", duration: 2400,
        frame: (p) => { if (!S.userMoved) table.setCam(table.lerpCam(from, S.focusCam, easeInOut(span(p, 0, 0.45)))); pieces.forEach((pc, k) => { pc.rise = Math.max(0, easeBack(span(p, 0.3 + k * 0.04, 0.55 + k * 0.04))); }); table.setScene({ pieces, peakLabels: true }); },
        moving: (p) => [p < 0.45 ? "camera" : "", ...pieces.filter((pc, k) => p >= 0.3 + k * 0.04 && p < 0.55 + k * 0.04).map((pc) => `${pc.label} rises`)].filter(Boolean), done: () => { S.idle = true; } });
      dispatch.innerHTML = `<article class="dp" style="--tone: var(--r-power)">
        <div class="dp-top"><span>${icon("globe", 14)} On the world stage</span><span>${DV.powers.length} powers</span></div>
        <div class="dp-head"><span class="badge">${icon("globe", 30, 1.5)}</span><div><h2>${sel ? esc(sel.power) : "The powers of the day"}</h2><div class="dp-tags"><span class="tag">${icon("info", 14)}Each stands at its city or land as the Atlas places it</span></div></div></div>
        ${(sel ? [sel] : DV.powers).map((pw) => `<div class="dp-power"><button type="button" data-power="${DV.powers.indexOf(pw)}"><b>${esc(pw.power)}</b>${pw.rulers.length ? `<small>${pw.rulers.map((r) => esc(r.name)).join(" · ")}</small>` : ""}</button>${claim(pw.claim)}${pw.rulers.filter((r) => r.note).map((r) => `<p class="dp-not">${icon("info", 14)}${esc(r.name)}: ${esc(r.note)}</p>`).join("")}</div>`).join("")}
        ${sel ? `<button type="button" class="dp-back" data-mode="powers">${icon("arrowLeft", 15)}All the powers</button>` : ""}
      </article>`;
      dispatch.scrollTop = 0;
    }

    // ── Events ──
    root.addEventListener("click", (e) => {
      const tb = e.target.closest("[data-turn]");
      if (tb) {
        const v = tb.dataset.turn;
        if (v === "prev") goTurn(S.turn - 1); else if (v === "next") goTurn(S.turn + 1); else if (v === "auto") setAuto(!S.auto); else goTurn(Number(v));
        return;
      }
      const md = e.target.closest("[data-mode]");
      if (md) { const m = md.dataset.mode; if (m === "campaign") goTurn(S.turn); else if (m === "places") showPlaces(); else showPowers(); return; }
      const cm = e.target.closest("[data-cam]");
      if (cm) {
        const c = cm.dataset.cam;
        if (c === "zin") table.nudge({ zoom: 1.45 }); else if (c === "zout") table.nudge({ zoom: 1 / 1.45 });
        else if (c === "rl") table.nudge({ yaw: -15 }); else if (c === "rr") table.nudge({ yaw: 15 });
        else if (c === "up") table.nudge({ pitch: -8 }); else if (c === "down") table.nudge({ pitch: 8 });
        else if (c === "fit" && S.focusCam) { S.userMoved = false; const from = { ...table.cam }, to = S.focusCam, t0 = performance.now(); const step = (now) => { const k = easeInOut(clamp01((now - t0) / 600)); table.setCam(table.lerpCam(from, to, k)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
        return;
      }
      const pl = e.target.closest("[data-place-i]");
      if (pl) { showPlaces(Number(pl.dataset.placeI)); return; }
      const pw = e.target.closest("[data-power]");
      if (pw) { showPowers(Number(pw.dataset.power)); return; }
      const tok = e.target.closest(".tb-token");
      if (tok) {
        const key = tok.dataset.key.replace(/^pc-/, "");
        if (key.startsWith("pw-")) { showPowers(Number(key.split("-")[1])); return; }
        const row = dispatch.querySelector(`[data-piece="${key}"]`);
        if (row) { dispatch.querySelectorAll(".dp-pieces li").forEach((li) => li.classList.toggle("is-on", li === row)); row.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" }); }
      }
    });
    stage.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight" && S.mode === "campaign") { e.preventDefault(); goTurn(S.turn + 1); }
      if (e.key === "ArrowLeft" && S.mode === "campaign") { e.preventDefault(); goTurn(S.turn - 1); }
    });

    // The first view: the whole board, then the first turn.
    table.setCam(camFor(table.boardCorners(), { yaw: -8 * R, pitch: 50 * R }));
    goTurn(0);
    Game.goTurn = (i) => { stage.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); goTurn(i); };
    Game.showPlaces = (i = null) => { stage.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); showPlaces(i); };
    Game.showPowers = (i = null) => { stage.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); showPowers(i); };
    Game.turnOfEvent = (e) => turns.findIndex((t) => t.events.includes(e));
    return () => { clearTimeout(S.autoTimer); table.destroy(); };
  };
})();
