// A · Lifeline. The Authors "Lifelines" way: a plain hero with four figures; 01 the life ring; 02 who was with him,
// his records in story order with every companion as a line that lights where a verse names them together;
// 03 did their paths cross (dir-a-paths.js); 04 the mission globe; 05 the questions as floating words.
(() => {
  const intro = (d) => {
    const told = d.scripture.length - d.entries.filter((e) => e.type === "fact").length;
    const p2 = d.periods[1];
    return `<section class="intro">
      <div><p class="kicker rule">${esc(d.title)} · from Scripture first</p>
        <h1>${esc(d.short)}. <em>${plural(told, "moment")} in Scripture.</em></h1>
        <p class="lede">${esc(d.story ?? d.tagline)}</p>
        <p class="aka">Also called ${d.otherNames.map(esc).join(" · ")}</p></div>
      <dl class="figures">
        <div><dt>Verses that name him</dt><dd>${d.verseCount}</dd></div>
        <div><dt>${esc(p2.title)}</dt><dd>${p2.entries.length}<small> ${p2.entries.length === 1 ? "record" : "records"}</small></dd></div>
        <div><dt>Named beside him</dt><dd>${d.rows.length}<small> people</small></dd></div>
        <div><dt>Sources outside Scripture</dt><dd>${d.trad.length}<small> on how it ends</small></dd></div>
      </dl></section>`;
  };

  // ── 01 · The ring, with the chosen part's records beside it ──
  function ringSection(wrap, d) {
    const sec = document.createElement("section");
    sec.className = "sec";
    sec.innerHTML = `${secHead("01", "His life in four parts", "How much does Scripture <em>tell?</em>", "Scripture gives no years for his life, so the ring is divided by how much is recorded, with one bead for each record. The last part is tradition and is drawn dashed. Choose a part to read it.")}
      <div class="a-ring"><div class="a-ring-art"></div><div class="a-ring-list"></div></div>`;
    wrap.append(sec);
    const art = sec.querySelector(".a-ring-art"), list = sec.querySelector(".a-ring-list");
    let sel = d.periods.findIndex((p) => p.entries.length === Math.max(...d.periods.slice(0, 3).map((x) => x.entries.length))) + 1;
    const draw = () => {
      art.innerHTML = Ring.svg(d, sel, { size: 440 });
      const p = d.periods[sel - 1], ents = p.entries.map((k) => d.byKey[k]);
      list.style.setProperty("--tone", PERIOD_TONE[sel]);
      list.innerHTML = `<p class="kicker">${p.n} · ${esc(p.sub)}</p><h3>${esc(p.title)}</h3>
        ${ents.length ? `<ol class="a-recs ${sel === 4 ? "trad" : ""}">${ents.map((e) => `<li><button type="button" data-open="${esc(e.key)}"><span class="t">${esc(e.title)}</span><small>${e.type === "trad" ? esc(whenShort(e.when)) : e.refs[0] ? esc(refText(e.refs[0])) : ""}</small></button></li>`).join("")}</ol>` : `<p class="plain-line">Scripture records nothing here.</p>`}
        ${sel === 1 && ents.length <= 1 ? `<p class="plain-line">Scripture gives no home, trade or family for him beyond this.</p>` : ""}`;
    };
    Ring.bind(art, d, (p, key) => { sel = p; draw(); if (key) Sheet.open(entrySheet(d.byKey[key]), PERIOD_TONE[p]); });
    list.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) Sheet.open(entrySheet(d.byKey[b.dataset.open]), PERIOD_TONE[sel]); });
    draw();
  }

  // ── 02 · Who was with him ──
  function withSection(wrap, d, onRow) {
    const sec = document.createElement("section");
    sec.className = "sec";
    sec.innerHTML = `${secHead("02", "Story order, not years", "Who was <em>with him?</em>", `Every record of ${esc(d.short)} in Scripture, left to right in story order${d.who === "paul" ? " (Acts as told, with the Lord's words to him where Acts or his letter sets them)" : " (the Gospels in the order of Robertson's harmony, then Acts and the letters)"}. Each line below is a person; it lights where a verse of that record names them. Point at a column to see what happens; choose a name to compare the two.`)}
      <div class="a-chart-scroll"><div class="a-chart"></div></div>
      <p class="a-now" aria-live="polite"></p>
      <p class="a-key"><span><i class="k-dot"></i>named in the passage</span><span><i class="k-ring"></i>writes it himself, in a letter</span><span><i class="k-line"></i>from first to last mention</span></p>`;
    wrap.append(sec);
    const host = sec.querySelector(".a-chart"), now = sec.querySelector(".a-now");
    const cols = d.scripture;
    const groups = [["The Twelve", d.rows.filter((r) => r.twelve)], ["Others named with him", d.rows.filter((r) => !r.twelve)]].filter(([, rs]) => rs.length);
    let width = 0, hot = -1;
    const say = (e) => {
      const names = Object.keys(e.with).map((k) => d.rowByKey[k]?.name).filter(Boolean);
      now.innerHTML = `<b>${ROMAN[e.period]} · ${esc(e.title)}</b>${e.h ? ` <span class="muted">harmony §${esc(e.h.n)}</span>` : ""}<br><span class="muted">${names.length ? `Named with him: ${names.map(esc).join(", ")}.` : "No companion is named in these verses."}</span> ${refList(e.refs, 3)} <button type="button" class="a-read" data-open="${esc(e.key)}">Read it</button>`;
    };
    function draw() {
      if (!width) return;
      const W = Math.max(width, 760), left = 168, right = 10, top = 46, rowH = 20, gapH = 26;
      const step = (W - left - right) / cols.length, X = (i) => left + step * (i + .5);
      let y = top + 6;
      const o = [];
      // Period bands.
      d.periods.slice(0, 3).forEach((p, pi) => {
        const idx = cols.map((e, i) => (e.period === pi + 1 ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) return;
        const x0 = left + step * idx[0], x1 = left + step * (idx.at(-1) + 1);
        const label = (x1 - x0) > p.title.length * 7.5 + 40 ? `${p.n} · ${esc(p.title)}` : p.n;
        o.push(`<rect class="band ${pi % 2 ? "alt" : ""}" x="${x0}" y="${top - 30}" width="${x1 - x0}" height="100%"><title>${p.n} · ${esc(p.title)}</title></rect><text class="band-t" x="${x0 + 6}" y="${top - 16}" style="fill:${PERIOD_TONE[pi + 1]}">${label}</text>`);
      });
      // The apostle himself: every record.
      o.push(`<text class="rl me" x="0" y="${y + 4}">${esc(d.short)}</text>`);
      cols.forEach((e, i) => o.push(`<circle class="me-dot" cx="${X(i)}" cy="${y}" r="3.2" style="fill:${PERIOD_TONE[e.period]}"/>`));
      y += rowH + 8;
      for (const [label, rows] of groups) {
        o.push(`<text class="gl" x="0" y="${y + 2}">${esc(label.toUpperCase())}</text>`); y += gapH - 8;
        for (const r of rows) {
          const hits = cols.map((e, i) => (e.with[r.key] ? i : -1)).filter((i) => i >= 0);
          o.push(`<g class="row" data-row="${r.key}"><rect class="row-hit" x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}"/><text class="rl" x="0" y="${y + 4}">${esc(r.name)}</text>`);
          if (hits.length > 1) o.push(`<line class="span" x1="${X(hits[0])}" x2="${X(hits.at(-1))}" y1="${y}" y2="${y}"/>`);
          hits.forEach((i) => o.push(`<circle class="${cols[i].writer === r.key ? "wr" : "hitdot"}" cx="${X(i)}" cy="${y}" r="4"/>`));
          o.push(`</g>`); y += rowH;
        }
        y += 8;
      }
      const H = y + 6;
      cols.forEach((e, i) => o.push(`<rect class="colhit" data-col="${i}" x="${left + step * i}" y="${top - 6}" width="${step}" height="${H - top}"/>`));
      host.innerHTML = `<svg class="a-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g class="hl"></g>${o.join("")}</svg>`;
      host.dataset.left = left; host.dataset.step = step;
    }
    const highlight = (i) => {
      hot = i;
      const g = host.querySelector(".hl"); if (!g) return;
      const left = +host.dataset.left, step = +host.dataset.step;
      g.innerHTML = i < 0 ? "" : `<rect class="col-on" x="${left + step * i}" y="10" width="${step}" height="100%"/>`;
    };
    host.addEventListener("pointermove", (e) => {
      const c = e.target.closest("[data-col]");
      if (!c) return;
      const i = Number(c.dataset.col), en = cols[i];
      if (i !== hot) { highlight(i); say(en); }
      const names = Object.keys(en.with).map((k) => d.rowByKey[k]?.name).filter(Boolean);
      Tip.show(`<b>${esc(en.title)}</b><small>${en.refs[0] ? esc(refText(en.refs[0])) : ""}${names.length ? ` · with ${esc(names.slice(0, 4).join(", "))}${names.length > 4 ? "…" : ""}` : ""}</small>`, e.clientX, e.clientY);
    });
    host.addEventListener("pointerleave", () => Tip.hide());
    host.addEventListener("click", (e) => {
      const r = e.target.closest("[data-row]");
      if (r && e.target.closest(".rl")) { onRow(r.dataset.row); return; }
      const c = e.target.closest("[data-col]"); if (c) { highlight(Number(c.dataset.col)); say(cols[Number(c.dataset.col)]); }
    });
    now.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) Sheet.open(entrySheet(d.byKey[b.dataset.open]), PERIOD_TONE[d.byKey[b.dataset.open].period]); });
    const stop = onResize(sec.querySelector(".a-chart-scroll"), (w) => { width = w; draw(); highlight(hot); });
    width = sec.querySelector(".a-chart-scroll").clientWidth; draw();
    const first = cols.findIndex((e) => Object.keys(e.with).length > 2);
    highlight(Math.max(0, first)); say(cols[Math.max(0, first)]);
    return stop;
  }

  DIRECTIONS.a = {
    mount(main, d) {
      const wrap = document.createElement("div");
      wrap.className = "wrap";
      wrap.innerHTML = topline() + intro(d);
      main.append(wrap);
      const stops = [];
      ringSection(wrap, d);
      const paths = PathsCross.mount(wrap, d);
      stops.push(withSection(wrap, d, (key) => { paths.choose(key); paths.el.scrollIntoView({ behavior: "smooth", block: "start" }); }));
      wrap.append(paths.el);
      const mission = Mission.mount(main, d, { num: "04", title: "Where did he <em>go?</em>", sub: `Every journey Scripture gives ${esc(d.short)}, as solid routes; where Scripture stops, tradition's routes are dashed and labelled with who said it and when. Drag the earth to turn it, scroll to come closer, and choose a route or a place.` });
      const tail = document.createElement("div");
      tail.className = "wrap";
      tail.innerHTML = `<section class="sec">${secHead("05", "Open questions", "What readers still <em>ask</em>", "The questions this page cannot settle, with the answers given and who gives them. Choose a question.")}<div class="q-host"></div></section>`;
      main.append(tail);
      stops.push(Questions.mount(tail.querySelector(".q-host"), d));
      return () => { stops.forEach((s) => s?.()); mission.cleanup(); };
    },
  };
})();
