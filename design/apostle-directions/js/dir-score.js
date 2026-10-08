// E · The score. The life as a musical score: Matthew, Mark, Luke, John, Acts and the letters are staves, and after a
// double bar the coda holds what came after Scripture. Every event he is in is a note, the Gospels in the order of
// Robertson's harmony (the 185 sections show as faint ticks). A playhead moves along it; the scene at the playhead
// opens large above the staves. Filled notes are Scripture; hollow notes are early writers; dashed, later tradition.
(() => {
  const LANE_C = { MAT: "var(--lane-mat)", MRK: "var(--lane-mrk)", LUK: "var(--lane-luk)", JHN: "var(--lane-jhn)", ACT: "var(--lane-act)", EP: "var(--lane-ep)", TR: "var(--lane-tr)" };
  const BOOK_LANE = { MAT: "MAT", MRK: "MRK", LUK: "LUK", JHN: "JHN", "1CO": "EP" };
  const LAYER_C = { scripture: "var(--l-scripture)", text: "var(--l-text)", "early-church": "var(--l-early)", tradition: "var(--l-tradition)", scholars: "var(--l-scholars)" };
  const MOV = ["gospels", "acts", "letters", "fine", "coda"];
  const pad2 = (n) => String(n).padStart(2, "0");

  // ── Geometry: where every note sits for a given width ──
  function layout(width) {
    const narrow = width < 640;
    const G = narrow ? 26 : 112, R = narrow ? 6 : 16, top = narrow ? 30 : 42, LH = narrow ? 23 : 27, bottom = narrow ? 22 : 26;
    const laneY = Object.fromEntries(LANES.map((l, i) => [l.id, top + i * LH + LH / 2]));
    const H = top + LANES.length * LH + bottom, inner = width - G - R;
    const ev = P.events, by = Object.fromEntries(MOV.map((m) => [m, ev.filter((e) => e.movement === m)]));
    const MIN = { gospels: 16, acts: 7, letters: 4, fine: 3, coda: 6 }, EMPTY = { gospels: 4, acts: 3, letters: 3, fine: 2, coda: 2 };
    const weight = Object.fromEntries(MOV.map((m) => [m, by[m].length ? Math.max(by[m].length + 2, MIN[m]) : EMPTY[m]]));
    const total = MOV.reduce((s, m) => s + weight[m], 0);
    const mv = {}; let at = G;
    for (const m of MOV) { const w = (inner * weight[m]) / total; mv[m] = { x0: at, x1: at + w, w }; at += w; }
    const anchors = {};
    for (const m of MOV) {
      const list = by[m], n = list.length, { x0, x1, w } = mv[m], pad = Math.min(narrow ? 7 : 14, w * .1), a = x0 + pad, b = x1 - pad;
      list.forEach((e, k) => {
        if (m === "gospels") e.u = e.h.ord / 184;
        else if (m === "acts") { const id = e.refs.filter((r) => bookOf(r[0]) === 44).map((r) => r[0]).sort((p, q) => p - q)[0]; const ch = Math.floor((id % 1e6) / 1e3), v = id % 1e3; e.u = clamp01((ch - 1 + Math.min(v, 50) / 50) / 28); }
        else e.u = n === 1 ? .5 : k / (n - 1);
        e.x = a + e.u * (b - a);
      });
      const g = Math.min(narrow ? 5.6 : 12, n ? (b - a) / Math.max(1, n - 1) : 0);
      for (let k = 1; k < n; k++) list[k].x = Math.max(list[k].x, list[k - 1].x + g);
      if (n && list[n - 1].x > b) { list[n - 1].x = b; for (let k = n - 2; k >= 0; k--) list[k].x = Math.min(list[k].x, list[k + 1].x - g); }
      if (n && list[0].x < a) { list[0].x = a; for (let k = 1; k < n; k++) list[k].x = Math.max(list[k].x, list[k - 1].x + g); }
      anchors[m] = [[0, a], ...list.map((e) => [e.u, e.x]), [1, b]].sort((p, q) => p[0] - q[0]);
    }
    const warp = (m, u) => { const A = anchors[m]; for (let k = 1; k < A.length; k++) if (u <= A[k][0]) { const [u0, x0] = A[k - 1], [u1, x1] = A[k]; return u1 === u0 ? x1 : x0 + ((u - u0) / (u1 - u0)) * (x1 - x0); } return A[A.length - 1][1]; };
    return { narrow, G, R, top, LH, H, width, laneY, mv, warp, by };
  }

  // ── The SVG ──
  function scoreSVG(L) {
    const { narrow, G, top, LH, H, width, laneY, mv, warp, by } = L;
    const yTop = top - 6, yBot = top + LANES.length * LH + 2, sp = narrow ? 2.6 : 3.4;
    const o = [];
    // Lane names and staves (five hairlines, the middle one tinted).
    for (const l of LANES) {
      const y = laneY[l.id];
      o.push(`<text class="lane-name" data-lane="${l.id}" style="--c:${LANE_C[l.id]}" x="${narrow ? 2 : 4}" y="${y + 3.5}">${narrow ? l.short : l.name}</text>`);
      for (let k = -2; k <= 2; k++) o.push(`<line class="${k === 0 ? "staff-mid" : "staff"}" style="--c:${LANE_C[l.id]}" x1="${G}" x2="${width - L.R}" y1="${(y + k * sp).toFixed(1)}" y2="${(y + k * sp).toFixed(1)}"/>`);
    }
    // The harmony's 185 sections as faint ticks on each Gospel that tells them, and the part bar lines.
    const gm = mv.gospels;
    let lastPartX = -99;
    if (gm.w > 40) {
      HARMONY.forEach((s, ord) => {
        const x = warp("gospels", ord / 184);
        s.books.forEach((b) => { const lane = { MAT: "MAT", MRK: "MRK", LUK: "LUK", JHN: "JHN" }[b]; if (lane) o.push(`<line class="htick" style="--c:${LANE_C[lane]}" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${laneY[lane] - sp * 1.4}" y2="${laneY[lane] + sp * 1.4}"/>`); });
        if (ord > 0 && HARMONY[ord - 1].part !== s.part) {
          const xb = warp("gospels", (ord - .5) / 184);
          o.push(`<line class="bar-line" x1="${xb.toFixed(1)}" x2="${xb.toFixed(1)}" y1="${laneY.MAT - 2 * sp}" y2="${laneY.JHN + 2 * sp}"/>`);
          if (!narrow && xb - lastPartX > 16) { lastPartX = xb; o.push(`<text class="part-num" x="${(xb + 2).toFixed(1)}" y="${top - 10}">${s.part}</text>`); }
        }
      });
    }
    // Acts' 28 chapters as ticks on the Acts staff.
    if (mv.acts.w > 30) for (let ch = 1; ch <= 28; ch++) { const x = warp("acts", (ch - .5) / 28); o.push(`<line class="htick" style="--c:${LANE_C.ACT}" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${laneY.ACT - sp * 1.4}" y2="${laneY.ACT + sp * 1.4}"/>`); }
    // Movement bar lines and labels.
    MOV.forEach((m, k) => {
      const { x0, w } = mv[m];
      if (k > 0) o.push(`<line class="bar-line is-move ${m === "coda" ? "is-thick" : ""}" x1="${x0.toFixed(1)}" x2="${x0.toFixed(1)}" y1="${yTop}" y2="${yBot}"/>${m === "coda" ? `<line class="bar-line is-move" x1="${(x0 - 5).toFixed(1)}" x2="${(x0 - 5).toFixed(1)}" y1="${yTop}" y2="${yBot}"/>` : ""}`);
      const label = narrow || w < 120 ? MOVEMENTS[m].roman : `${MOVEMENTS[m].roman}<tspan> · ${MOVEMENTS[m].name.split(":")[0]}</tspan>`;
      if (MOVEMENTS[m].roman.length * (narrow ? 6.6 : 7.4) < w - 6) o.push(`<text class="move-label" x="${(x0 + (k ? 6 : 2)).toFixed(1)}" y="${narrow ? 12 : 16}">${label}</text>`);
    });
    // Tacet: a staff with nothing to play in its own movement.
    if (!by.gospels.length) { const { x0, x1 } = mv.gospels; o.push(`<text class="tacet" text-anchor="middle" x="${((x0 + x1) / 2).toFixed(1)}" y="${((laneY.MRK + laneY.LUK) / 2 + 4).toFixed(1)}">tacet</text>`); }
    if (!by.acts.length) { const { x0, x1 } = mv.acts; o.push(`<text class="tacet" text-anchor="middle" x="${((x0 + x1) / 2).toFixed(1)}" y="${laneY.ACT + 4}">tacet</text>`); }
    // Where Acts stops naming him: the rest of the Acts staff is silent.
    const actsIds = P.passages.filter((r) => bookOf(r[0]) === 44).map((r) => r[1] ?? r[0]); // where Acts names him
    if (by.acts.length && actsIds.length) {
      const lastCh = Math.floor((Math.max(...actsIds) % 1e6) / 1e3), xa = Math.max(...by.acts.map((e) => e.x)) + 10, xb = mv.acts.x1 - 6;
      if (lastCh < 28 && xb - xa > (narrow ? 34 : 70)) o.push(`<text class="tacet" text-anchor="middle" x="${((xa + xb) / 2).toFixed(1)}" y="${laneY.ACT + 4}">${narrow ? "tacet" : `tacet · Acts ${lastCh + 1}–28`}</text>`);
    }
    if (!by.letters.length) { const { x0, x1 } = mv.letters; o.push(`<text class="tacet" text-anchor="middle" x="${((x0 + x1) / 2).toFixed(1)}" y="${laneY.EP + 4}">tacet</text>`); }
    // Years under the coda.
    let lastYearX = -99;
    by.coda.forEach((e) => { if (e.x - lastYearX < (narrow ? 18 : 30)) return; lastYearX = e.x; o.push(`<text class="year" text-anchor="middle" x="${e.x.toFixed(1)}" y="${H - (narrow ? 6 : 9)}">${esc(yearBadge(e.src.when).big)}</text>`); });
    // The notes, one column per event.
    const rx = narrow ? 3.5 : 5.2, ry = narrow ? 2.6 : 3.7, stem = narrow ? 11 : 16;
    for (const e of P.events) {
      const ys = e.lanes.map((l) => laneY[l]).sort((a, b) => a - b);
      const c0 = LANE_C[e.lanes[0]] ?? LANE_C.TR;
      const cls = e.kind === "tradition" ? (e.layer === "tradition" ? "is-hollow is-dashed" : "is-hollow") : "";
      const jesus = e.thread && (e.thread.lines ?? e.thread.tabs.flatMap((t) => t.lines)).some((l) => l.who === "j");
      const x = e.x.toFixed(1);
      o.push(`<g class="col" data-i="${e.i}"><rect class="hit" x="${(e.x - 6).toFixed(1)}" width="12" y="${yTop}" height="${yBot - yTop}"/>`);
      if (ys.length > 1) o.push(`<line class="chord" style="--c:${c0}" x1="${x}" x2="${x}" y1="${ys[0]}" y2="${ys[ys.length - 1]}"/>`);
      e.lanes.forEach((l, k) => {
        const y = laneY[l];
        o.push(`<g class="note ${cls}" style="--c:${LANE_C[l]}"><ellipse class="head" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(-22 ${x} ${y})"/><line class="stem" x1="${(e.x + rx - .6).toFixed(1)}" x2="${(e.x + rx - .6).toFixed(1)}" y1="${y - 1}" y2="${y - stem}"/>${jesus && y === ys[0] ? `<circle class="jmark" cx="${(e.x + rx - .6).toFixed(1)}" cy="${y - stem - 3.5}" r="${narrow ? 1.6 : 2.2}"/>` : ""}</g>`);
      });
      o.push(`</g>`);
    }
    // The playhead.
    o.push(`<g class="ph"><line class="ph-glow" x1="0" x2="0" y1="${yTop - 4}" y2="${yBot + 4}"/><line class="ph-line" x1="0" x2="0" y1="${yTop - 4}" y2="${yBot + 4}"/><circle class="ph-handle-ring" cx="0" cy="${yTop - 10}" r="${narrow ? 7 : 9}"/><circle class="ph-handle" cx="0" cy="${yTop - 10}" r="${narrow ? 3.4 : 4.2}"/></g>`);
    return `<svg class="sc-svg" viewBox="0 0 ${width} ${H}" width="${width}" height="${H}" role="img" aria-label="${esc(P.first)}'s life as a score: ${P.events.length} notes on seven staves">${o.join("")}</svg>`;
  }

  // ── The scene at the playhead ──
  function stage(e, tab) {
    const c = e.kind === "tradition" ? LANE_C.TR : LANE_C[e.lanes[0]] ?? "var(--tone)";
    const mvName = `${MOVEMENTS[e.movement].roman} · ${MOVEMENTS[e.movement].name}`;
    const sec = e.h ? `<p class="st-sec">§${esc(e.h.n)} in Robertson's harmony · <b>${esc(e.h.title)}</b></p>` : e.kind === "tradition" ? `<p class="st-sec"><b>${esc(e.src.who)}</b> · ${esc(e.src.when)}</p>` : "";
    const isClaim = e.kind !== "moment";
    const label = e.kind === "tradition" ? e.src.who : e.label;
    const lanes = e.lanes.map((l) => `<span style="--c:${LANE_C[l]}">${esc(LANES.find((x) => x.id === l).name)}</span>`).join("");
    let right = "";
    const t = e.thread;
    if (t) {
      const tabs = t.tabs ?? [{ lines: t.lines }];
      const k = Math.min(tab, tabs.length - 1);
      right += t.tabs ? `<div class="st-tabs" role="tablist">${t.tabs.map((x, i) => `<button type="button" data-tab="${i}" aria-pressed="${i === k}" style="--c:${LANE_C[BOOK_LANE[x.book]] ?? LANE_C.ACT}"><i></i>${esc(tabLabel(x))}</button>`).join("")}</div>` : "";
      right += `<div class="st-body">${dialogue(tabs[k].lines)}`;
    } else right += `<div class="st-body">`;
    if (e.kind === "tradition") right += `<p class="st-claim kjv-q">${esc(e.src.text)}</p>`;
    if (isClaim && t) right += `<div class="st-note"><h4>In our words</h4>${esc(e.src.text)}</div>`;
    if (isClaim && !t && e.kind !== "tradition") right += `<p class="st-claim">${esc(e.src.text)}</p>`;
    for (const cl of e.callings) if (cl.claim) right += `<div class="st-note"><h4>${esc(cl.label)}</h4>${esc(cl.claim.text)}${claimFoot(cl.claim)}</div>`;
    right += `</div>`;
    const foot = isClaim ? claimFoot(e.src) : `<div class="claim-foot">${chip("scripture")}<span>${refList(e.refs)}</span></div>`;
    const read = e.refs.length ? `<a class="read-link" href="${refHref(e.refs[0])}">${icon("open", 14)}Read the passage</a>` : "";
    return `<div class="st-left" style="--c:${c}">
        <p class="st-num">${pad2(e.i + 1)}<small>/ ${P.events.length}</small></p>
        <p class="st-move">${esc(mvName)}</p>${sec}
        <h2 class="st-label ${isClaim && e.kind !== "tradition" ? "is-long" : ""}">${esc(label)}</h2>
        ${lanes ? `<div class="st-lanes">${lanes}</div>` : ""}
      </div>
      <div class="st-right">${right}<div class="st-foot">${foot}${read}</div></div>`;
  }

  // ── The sections below the score ──
  const head = (glyph, k, h, d) => `<header class="sc-sec-head"><span class="sc-glyph">${icon(glyph, 28, 1.4)}</span><div><p class="k">${k}</p><h2>${h}</h2>${d ? `<p class="d">${d}</p>` : ""}</div></header>`;
  function sections() {
    const laneOfSpan = (s) => LANE_C[laneOfRef(s)] ?? LANE_C.EP;
    const overture = `<section class="sc-sec">${head("music", "Overture", "The call, as each account tells it", P.calling.length > 1 ? "Each book gives the call in its own words. Played side by side, the accounts are the score's opening bars." : "")}
      <div class="ov-grid">${P.calling.map((c) => `<article class="ov-card glass" style="--c:${laneOfSpan(c.quote.span)}"><h3>${esc(c.label)}</h3><blockquote>${esc(c.quote.text)} <span class="mono" style="font-size:.7rem;font-style:normal">${refLink(c.quote.span)} · KJV</span></blockquote>${c.claim ? claimHTML(c.claim) : ""}</article>`).join("")}</div></section>`;
    const strip = (comp) => {
      const W = 300, on = new Set(P.events.filter((e) => comp.claim.refs?.some((cr) => e.refs.some((r) => overlaps(r, cr)))).map((e) => e.i));
      const xs = P.events.map((e) => e.x), x0 = Math.min(...xs), x1 = Math.max(...xs);
      return `<svg class="ens-strip" viewBox="0 0 ${W} 18" preserveAspectRatio="none" aria-label="${on.size} of the score's notes"><line x1="0" x2="${W}" y1="9" y2="9" stroke="var(--sc-staff)"/>${P.events.map((e) => `<circle class="d ${on.has(e.i) ? "is-on" : ""}" cx="${(((e.x - x0) / (x1 - x0 || 1)) * (W - 8) + 4).toFixed(1)}" cy="9" r="${on.has(e.i) ? 3.2 : 1.6}"/>`).join("")}</svg>`;
    };
    const ensemble = `<section class="sc-sec">${head("users", "Ensemble", "Who plays alongside him", "Each line marks where that companion's verses fall in the score above.")}
      <div class="ens">${P.companions.map((c) => `<div class="ens-row"><h3><a href="${personHref(c.person.personId)}">${esc(c.person.name)}</a><small>${esc(LAYER[c.claim.layer])}</small></h3><div><p>${esc(c.claim.text)}</p>${claimFoot(c.claim)}</div>${strip(c)}</div>`).join("")}</div></section>`;
    const coda = [...P.ending.tradition].map((c, i) => ({ c, i, y: yearOf(c.when) })).sort((a, b) => (a.y ?? 9999) - (b.y ?? 9999));
    const finecoda = `<section class="sc-sec">${head("hourglass", "Fine and coda", "How the story ends", "Scripture's last bars on the left; what later writers said, by date, on the right. They are never blended.")}
      <div class="fc-grid"><div class="fc-col fc-fine glass" style="--tone: var(--lane-jhn)"><h3>Fine <span>Scripture</span></h3>${P.ending.scripture.map((c) => claimHTML(c)).join("")}</div>
      <div class="fc-col fc-coda glass" style="--tone: var(--lane-tr)"><h3>Coda <span>After Scripture</span></h3><ol>${coda.map(({ c, y }) => `<li><b>${esc(yearBadge(c.when).big)}<small>${esc(yearBadge(c.when).small)}</small></b><div><p>${esc(c.text)}</p>${claimFoot(c)}</div></li>`).join("")}</ol></div></div></section>`;
    const questions = `<section class="sc-sec">${head("help", "Unresolved", "Open questions", "Each view is a voice of its own, with who holds it. The page gives no verdict.")}
      <div class="uq">${P.questions.map((q) => `<article class="uq-card glass"><h3>${esc(q.question)}</h3><div class="uq-voices">${q.views.map((v) => `<div class="uq-voice" style="--c:${LAYER_C[v.argument.layer] ?? "var(--muted)"}"><h4>${esc(v.label)}</h4><p class="h">${esc(v.holders)}</p><p>${esc(v.argument.text)}</p>${claimFoot(v.argument)}</div>`).join("")}</div></article>`).join("")}</div></section>`;
    const rests = `<section class="sc-sec">${head("rest", "Rests", "What Scripture does not say", "")}<ul class="rests">${P.notSaid.map((s) => `<li>${icon("rest", 18)}<span>${esc(s)}</span></li>`).join("")}</ul></section>`;
    const notes = `<section class="sc-sec">${head("library", "Programme notes", "His writings and our sources", "")}
      <div class="notes-grid"><div class="parts">${P.writings.length ? P.writings.map((w) => `<a href="${writingHref(w)}">${icon("scroll", 22)}<span>${esc(w.title)}</span>${icon("arrowUp", 15)}</a>`).join("") : `<p class="none">No writing in the Bible bears his name. Whether he is the Jude of the letter of Jude is one of the open questions above.</p>`}</div>
      <div>${sourceList()}</div></div></section>`;
    return overture + ensemble + finecoda + questions + rests + notes;
  }

  function hero() {
    const scarce = isScarce() ? `<p class="sc-scarce">${icon("info", 18)}<span><b>Scripture tells little about him.</b> ${esc(P.notSaid[0])}</span></p>` : "";
    const keyRow = P.lists.length ? `<div class="sc-key-row">${P.lists.map((l) => `<div class="sc-key-cell" style="--c:${LANE_C[l.book] ?? LANE_C.ACT}"><b>${l.position}</b><span>${esc({ MAT: "Matthew 10", MRK: "Mark 3", LUK: "Luke 6", ACT: "Acts 1" }[l.book])}</span><em>${esc(l.name)}</em></div>`).join("")}</div>` : `<p class="sc-key-none">Not in the lists of the Twelve. ${esc(P.identifications.at(-1)?.text ?? "")}</p>`;
    const n = (m) => P.events.filter((e) => e.movement === m).length;
    return `<header class="sc-hero">
      <div><p class="sc-kicker">E · The score · ${esc(P.title)}</p>
        <h1 style="--fit: ${Math.round(290 / (P.first.length * .6))}px">${esc(P.first)}${P.name !== P.first ? `<small>${esc(P.name)}</small>` : ""}</h1>
        <p class="sc-aka">${P.otherNames.map((x) => `<span>${esc(x)}</span>`).join("")}</p>
        <p class="sc-tag">${esc(P.tagline)}</p>${scarce}</div></header>
      <div class="sc-key glass"><h2>${P.lists.length ? "Key signature · his place in each list of the Twelve" : "Key signature"}</h2>${keyRow}
        <div class="sc-tempo"><span><b>${n("gospels")}</b> in the Gospels</span><span><b>${n("acts")}</b> in Acts</span><span><b>${n("letters")}</b> in the letters</span><span><b>${n("coda")}</b> after Scripture</span><span><b>${P.verseCount}</b> verses name him</span></div></div>`;
  }

  const legend = `<div class="sc-legend"><span><svg width="12" height="10"><ellipse cx="6" cy="5" rx="4.6" ry="3.3" fill="currentColor" transform="rotate(-22 6 5)"/></svg>Scripture</span>
    <span><svg width="12" height="10"><ellipse cx="6" cy="5" rx="4.4" ry="3.1" fill="none" stroke="currentColor" stroke-width="1.4" transform="rotate(-22 6 5)"/></svg>Early church</span>
    <span><svg width="12" height="10"><ellipse cx="6" cy="5" rx="4.4" ry="3.1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 1.6" transform="rotate(-22 6 5)"/></svg>Later tradition</span>
    <span><svg width="8" height="8"><circle cx="4" cy="4" r="2.6" fill="var(--jesus)"/></svg>Jesus speaks</span></div>`;

  DIRECTIONS.score = {
    name: "The score", letter: "E", swatch: "#8b6cff",
    mount(main) {
      const ev = P.events;
      const start = Math.max(0, ev.findIndex((e) => e.thread && e.kind === "moment"));
      let cur = start, L = null, dragging = false;
      const tabs = {};
      layout(1200); // gives every event an x for the ensemble strips; draw() lays it out again at the real width
      main.innerHTML = `<div class="sc-wrap">${topline()}<div class="sc-top">${hero()}<div class="sc-inst">
        <section class="sc-stage glass" aria-live="polite"></section>
        <section class="sc-score glass"><div class="sc-svg-host" tabindex="0"></div>
          <div class="sc-transport"><div class="sc-btns"><button type="button" class="sc-btn" data-sc="prev" aria-label="Previous note">${icon("skipBack", 16)}</button>
            <button type="button" class="sc-btn is-play" data-sc="play">${icon("play", 15)}<span>Play</span></button>
            <button type="button" class="sc-btn" data-sc="next" aria-label="Next note">${icon("skipForward", 16)}</button></div>
            <span class="sc-pos"></span>${legend}</div></section></div></div>
        ${sections()}</div>`;
      const host = main.querySelector(".sc-svg-host"), stageEl = main.querySelector(".sc-stage"), pos = main.querySelector(".sc-pos"), playBtn = main.querySelector('[data-sc="play"]');
      let ph = null;
      const placeHead = (x) => ph?.setAttribute("transform", `translate(${x.toFixed(1)} 0)`);
      function setCur(i, { keepHead = false } = {}) {
        cur = Math.max(0, Math.min(ev.length - 1, i));
        const e = ev[cur];
        stageEl.style.setProperty("--c", e.kind === "tradition" ? LANE_C.TR : LANE_C[e.lanes[0]] ?? "var(--tone)");
        stageEl.innerHTML = stage(e, tabs[e.key] ?? 0);
        host.querySelectorAll(".col.is-on").forEach((c) => c.classList.remove("is-on"));
        host.querySelector(`.col[data-i="${cur}"]`)?.classList.add("is-on");
        host.querySelectorAll(".lane-name").forEach((t) => t.classList.toggle("is-lit", e.lanes.includes(t.dataset.lane)));
        if (!keepHead) placeHead(e.x);
        pos.innerHTML = `Note <b>${cur + 1}</b> of ${ev.length} · ${esc(MOVEMENTS[e.movement].name.split(":")[0])}`;
      }
      function draw() {
        const w = Math.round(host.getBoundingClientRect().width);
        if (!w || (L && L.width === w)) return;
        L = layout(w);
        host.innerHTML = scoreSVG(L);
        ph = host.querySelector(".ph");
        setCur(cur);
      }
      const nearest = (x) => ev.reduce((best, e) => (Math.abs(e.x - x) < Math.abs(ev[best].x - x) ? e.i : best), 0);
      const xOf = (clientX) => { const r = host.getBoundingClientRect(); return Math.max(L.G, Math.min(L.width - L.R, clientX - r.left)); };
      host.addEventListener("pointerdown", (e) => { if (!L) return; dragging = true; stopPlay(); host.setPointerCapture(e.pointerId); const x = xOf(e.clientX); placeHead(x); setCur(nearest(x), { keepHead: true }); });
      host.addEventListener("pointermove", (e) => { if (!dragging) return; const x = xOf(e.clientX); placeHead(x); const n = nearest(x); if (n !== cur) setCur(n, { keepHead: true }); });
      const end = () => { if (!dragging) return; dragging = false; placeHead(ev[cur].x); };
      host.addEventListener("pointerup", end); host.addEventListener("pointercancel", end);
      host.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { setCur(cur + 1); e.preventDefault(); } if (e.key === "ArrowLeft") { setCur(cur - 1); e.preventDefault(); } });

      // Playback through Clock, so the ticker can slow, pause and scrub it.
      let playing = false;
      const setPlayBtn = () => { playBtn.innerHTML = `${icon(playing ? "pause" : "play", 15)}<span>${playing ? "Pause" : "Play"}</span>`; };
      function stopPlay() { if (playing) { playing = false; Clock.stop(); setPlayBtn(); } }
      function play() {
        const from = cur >= ev.length - 1 ? 0 : cur;
        const xs = ev.slice(from).map((e) => e.x), steps = xs.length - 1;
        if (steps < 1) return;
        playing = true; setPlayBtn();
        Clock.run({
          label: `Playing ${P.first}'s score from note ${from + 1}`, duration: steps * 650,
          frame(p) {
            const f = p * steps, k = Math.min(steps - 1, Math.floor(f)), x = xs[k] + (xs[k + 1] - xs[k]) * easeInOut(f - k);
            placeHead(x);
            const n = from + Math.round(f);
            if (n !== cur) setCur(n, { keepHead: true });
          },
          moving: (p) => [`playhead at note ${from + Math.round(p * steps) + 1}`, "scene above the staves"],
          done() { playing = false; setPlayBtn(); },
        });
      }
      main.addEventListener("click", (e) => {
        const b = e.target.closest("[data-sc]");
        if (b) { const a = b.dataset.sc; if (a === "play") (playing ? stopPlay() : play()); else { stopPlay(); setCur(cur + (a === "next" ? 1 : -1)); } return; }
        const t = e.target.closest(".st-tabs [data-tab]");
        if (t) { tabs[ev[cur].key] = Number(t.dataset.tab); setCur(cur); }
      });
      draw();
      // The opening: the staves draw left to right and the notes land.
      const cols = [...host.querySelectorAll(".col")];
      Clock.run({
        label: "The staves draw and the notes land", duration: 1100,
        frame(p) {
          const svg = host.querySelector("svg");
          if (!svg) return;
          svg.style.clipPath = `inset(0 ${((1 - easeOut(span01(p, 0, .7))) * 100).toFixed(1)}% 0 0)`;
          cols.forEach((c, k) => { const q = easeOut(span01(p, .15 + (k / cols.length) * .6, .3 + (k / cols.length) * .6)); c.style.transform = q >= 1 ? "" : `translateY(${((1 - q) * -14).toFixed(1)}px)`; c.style.opacity = q >= 1 ? "" : String(q); });
        },
        moving: (p) => [p < .7 ? "the staves, drawing left to right" : "", p > .15 ? "the notes, landing in order" : ""].filter(Boolean),
      });
      const ro = new ResizeObserver(() => { const before = L?.width; draw(); if (L && L.width !== before) host.querySelectorAll(".col").forEach((c) => { c.style.transform = ""; c.style.opacity = ""; }); });
      ro.observe(host);
      return () => { ro.disconnect(); stopPlay(); };
    },
  };
})();
