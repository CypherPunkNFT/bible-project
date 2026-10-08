// G · The thread. Every recorded exchange between the apostle and Jesus, and later with others, as a message history:
// Jesus' words on the left in red letters, the apostle's on the right, everyone else named. Every line is word for
// word from the KJV with its verse (checked at build time). Where the Gospels word an exchange differently, the
// exchange splits into tabs, one per Gospel. Tradition arrives after Scripture as forwarded reports that say who
// reported them and when; the open questions are polls that count no votes. Tap any message for its passage.
(() => {
  const BOOK_TAB = { MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John", "1CO": "1 Corinthians" };
  const LAYER_C = { scripture: "var(--l-scripture)", text: "var(--l-text)", "early-church": "var(--l-early)", tradition: "var(--l-tradition)", scholars: "var(--l-scholars)" };
  const initialOf = (name = "") => (name.replace(/^(the|a|an|one of the|another|they,?|that|his)\s+/i, "").match(/[A-Z]/)?.[0] ?? name[0] ?? "?");

  // ── The flow of entries: thread items in story order, plus any event the thread does not quote ──
  function buildFlow() {
    const ev = Object.fromEntries(P.events.map((e) => [e.key, e]));
    const rankOf = (key) => {
      if (ev[key]) return ev[key].i;
      const c = P.calling[Number(key.slice(1))];
      const host = P.events.find((e) => e.callings.includes(c));
      const firstMoment = P.events.find((e) => e.kind === "moment");
      return host ? host.i + .5 : (firstMoment?.i ?? 0) + .6; // an account with no moment of its own follows the first moment
    };
    const groups = P.thread.map((g) => ({ ...g, entries: g.items.map((it) => ({ type: "item", key: it.key, item: it, rank: rankOf(it.key) })) }));
    const byId = Object.fromEntries(groups.map((g) => [g.id, g]));
    const ensure = (id, title, sub) => byId[id] ?? (byId[id] = groups[groups.push({ id, title, sub, entries: [] }) - 1]);
    for (const e of P.events) {
      if (P.threadByKey[e.key] || e.kind === "ending" || e.kind === "tradition") continue;
      const gid = e.kind === "moment" ? "jesus" : e.movement === "acts" ? "acts" : "letters";
      ensure(gid, gid === "letters" ? "In the letters" : gid === "acts" ? "In Acts" : "With Jesus", "").entries.push({ type: "event", key: e.key, e, rank: e.i });
    }
    const ORDER = ["jesus", "acts", "letters"];
    groups.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
    groups.forEach((g) => g.entries.sort((a, b) => a.rank - b.rank));
    return groups;
  }

  // ── Messages ──
  function avatar(line) {
    if (line.who === "j") return `<span class="ava is-j">${icon("cross", 16, 2)}</span>`;
    if (line.who === "s") return `<span class="ava is-s">${esc(P.initial)}</span>`;
    if (line.who === "v") return `<span class="ava is-v">${icon("sparkle", 16)}</span>`;
    return `<span class="ava">${esc(initialOf(line.name))}</span>`;
  }
  function messages(key, tab, lines) {
    let prev = null;
    return lines.map((l, li) => {
      const data = `data-key="${esc(key)}" data-tab="${tab}" data-li="${li}"`;
      if (l.who === "n") { prev = null; return `<div class="narr" ${data}><q>${esc(l.t)}</q><span class="v">${esc(verseText(l.v))}</span></div>`; }
      const id = `${l.who}|${l.name ?? ""}`, first = id !== prev;
      prev = id;
      return `<div class="msg is-${l.who} ${first ? "is-first" : ""}">${avatar(l)}<button type="button" class="bub" ${data}>${first ? `<span class="who">${esc(speaker(l))}</span>` : ""}<q>${esc(l.t)}</q><span class="v">${esc(verseText(l.v))} · KJV</span></button></div>`;
    }).join("");
  }
  function separator(key) {
    const e = P.events.find((x) => x.key === key);
    if (key.startsWith("c")) { const c = P.calling[Number(key.slice(1))]; return `<div class="th-sep"><p class="t"><i>The call</i>${esc(c.label)}</p><p class="r">${refLink(c.quote.span)}</p></div>`; }
    if (!e) return "";
    const tag = e.h ? `§${esc(e.h.n)}` : e.kind === "moment" ? "Moment" : e.movement === "acts" ? "Acts" : "Letters";
    const title = e.kind === "moment" ? e.label : e.src.text.split(/(?<=[.”])\s/)[0];
    const notes = e.callings.filter((c) => c.claim && c.claim.layer !== "scripture").map((c) => `<div class="th-note">${esc(c.claim.text)}${claimFoot(c.claim)}</div>`).join("");
    return `<div class="th-sep"><p class="t"><i>${tag}</i>${esc(title)}</p><p class="r">${refList(e.refs.slice(0, 4))}</p></div>${notes}`;
  }
  function itemHTML(entry, tabs) {
    if (entry.type === "event") { const e = entry.e; return `<div class="evt" data-key="${e.key}">${e.kind === "moment" ? `<b>${esc(e.label)}</b>` : esc(e.src.text)}${claimFoot(e.kind === "moment" ? { layer: "scripture", refs: e.refs } : e.src)}</div>`; }
    const it = entry.item, k = tabs[it.key] ?? 0;
    const e = P.events.find((x) => x.key === it.key);
    const words = e && e.kind !== "moment" ? `<div class="evt">${esc(e.src.text)}${claimFoot(e.src)}</div>` : "";
    if (!it.tabs) return `${separator(it.key)}<div class="th-msgs">${messages(it.key, 0, it.lines)}</div>${words}`;
    const bar = `<div class="th-tabs" role="tablist">${it.tabs.map((t, i) => `<button type="button" data-thtab="${esc(it.key)}:${i}" aria-pressed="${i === k}">${esc(t.label ?? BOOK_TAB[t.book] ?? t.book)}</button>`).join("")}</div>
      <p class="th-tabs-note">${it.tabs.length} accounts word this differently · each tab is that book's own wording</p>`;
    return `${separator(it.key)}${bar}<div class="th-msgs" data-msgs="${esc(it.key)}">${messages(it.key, k, it.tabs[k].lines)}</div>${words}`;
  }
  function endingHTML() {
    const reports = P.ending.tradition.map((c, i) => ({ c, i, y: yearOf(c.when) })).sort((a, b) => (a.y ?? 9999) - (b.y ?? 9999));
    const sys = P.ending.scripture.map((c) => `<div class="evt is-system">${esc(c.text)}${claimFoot(c)}</div>`).join("");
    const fwd = reports.map(({ c }) => `<article class="fwd" style="--c:${LAYER_C[c.layer]}"><header>${icon("forward", 14)}Forwarded report<span>· ${esc(yearBadge(c.when).big)}</span></header><h4>${esc(c.who)}</h4><p>${esc(c.text)}</p>${claimFoot({ ...c, who: null })}<p class="claim-who" style="margin-top:.3rem">${esc(c.when)}</p></article>`).join("");
    return `<div class="th-group" id="th-end" data-group="end" style="--c: var(--l-tradition)"><span>${icon("forward", 15)}After Scripture</span><small>Scripture's last word first; then what others reported, oldest first</small></div>
      ${sys}<div class="evt is-system"><b>Scripture ends here.</b> Everything below came later, and each report says who gave it and when.</div>${fwd}`;
  }
  function pollsHTML() {
    return `<div class="th-group" id="th-q" data-group="q" style="--c: var(--l-scholars)"><span>${icon("poll", 15)}Open questions</span><small>Polls with no votes: the page gives no verdict</small></div>
      ${P.questions.map((q) => `<article class="poll"><header>${icon("help", 14)}Open question</header><h4>${esc(q.question)}</h4><ul>${q.views.map((v) => `<li style="--c:${LAYER_C[v.argument.layer] ?? "var(--muted)"}"><button type="button" data-poll>${"<i></i>"}<span><b>${esc(v.label)}</b><small>${esc(v.holders)}</small></span></button><div class="arg">${esc(v.argument.text)}${claimFoot(v.argument)}</div></li>`).join("")}</ul><footer>Tap a view to read its case. No view is counted or chosen.</footer></article>`).join("")}`;
  }

  // ── The details pane: context for a tapped message, otherwise members, pinned calls, links and sources ──
  function contextHTML(key, tab, li) {
    const it = P.threadByKey[key];
    const lines = it ? (it.tabs ? it.tabs[tab].lines : it.lines) : [];
    const line = lines[li];
    const e = P.events.find((x) => x.key === key);
    const title = e ? (e.kind === "moment" ? e.label : e.src.text) : P.calling[Number(key.slice(1))]?.label ?? "";
    const sub = e?.h ? `§${e.h.n} in Robertson's harmony · ${e.h.title}` : e ? MOVEMENTS[e.movement].name : "The call";
    let passage = "";
    if (e?.kind === "moment") {
      const book = it?.tabs?.[tab]?.book;
      const mine = e.refs.filter((r) => !book || laneOfRef(r) === ({ MAT: "MAT", MRK: "MRK", LUK: "LUK", JHN: "JHN", "1CO": "EP" }[book] ?? laneOfRef(r)));
      const others = e.refs.filter((r) => !mine.includes(r));
      passage = mine.map((r) => `<h5>${esc(refText(r))}</h5>${Object.keys(P.verses).map(Number).filter((id) => id >= r[0] && id <= r[1]).sort((a, b) => a - b).map((id) => `<p class="${line && id === line.v ? "is-hit" : ""}"><sup>${id % 1000}</sup>${esc(P.verses[id])}</p>`).join("")}`).join("");
      if (others.length) passage += `<h5>Parallels</h5><p>${refList(others)}</p>`;
    } else if (line) passage = `<p class="is-hit"><sup>${line.v % 1000}</sup>${esc(line.t)}</p>${e ? `<h5>In our words</h5><p>${esc(e.src.text)}</p>` : ""}`;
    const refs = e ? e.refs : [P.calling[Number(key.slice(1))]?.quote.span].filter(Boolean);
    return `<div class="ctx"><button type="button" class="x" data-ctx="close" aria-label="Close">${icon("x", 14)}</button><h3>Context</h3><h4>${esc(title)}</h4><p class="sub">${esc(sub)}</p>
      <div class="passage">${passage}</div><div class="claim-foot">${chip(e?.layer ?? "scripture")}${refs[0] ? `<a class="read-link" href="${refHref(refs[0])}">${icon("open", 14)}Read the passage</a>` : ""}</div></div>`;
  }
  function detailsHTML() {
    return `<div class="sec ctx-slot"><p class="hint">${icon("info", 18)}Tap any message to see its passage and its parallels in the other Gospels.</p></div>
      <div class="sec"><h3>Members · ${P.companions.length}</h3><div class="members">${P.companions.map((c) => `<div class="member"><span class="ava" style="--c:${LAYER_C[c.claim.layer]}">${esc(initialOf(c.person.name))}</span><div><b><a href="${personHref(c.person.personId)}">${esc(c.person.name)}</a></b>${esc(c.claim.text)}${claimFoot(c.claim)}</div></div>`).join("")}</div></div>
      <div class="sec"><h3>Pinned · how he was called</h3><div class="pinned">${P.calling.map((c) => `<div><b>${esc(c.label)}</b>${esc(c.quote.text)} <span class="mono" style="font-style:normal;font-size:.68rem">${refLink(c.quote.span)}</span></div>`).join("")}</div></div>
      <div class="sec links"><h3>Shared links · his writings</h3>${P.writings.length ? P.writings.map((w) => `<a href="${writingHref(w)}">${icon("scroll", 18)}${esc(w.title)}</a>`).join("") : `<p>No book of the Bible bears his name.</p>`}</div>
      <div class="sec"><h3>Not in the record</h3><ul class="th-nots">${P.notSaid.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
      <div class="sec"><h3>Sources</h3>${sourceList("th-src")}</div>`;
  }

  DIRECTIONS.thread = {
    name: "The thread", letter: "G", swatch: "#5b7cff",
    mount(main) {
      const narrow = matchMedia("(max-width: 759px)").matches;
      const groups = buildFlow(), tabs = {};
      const lineCount = (g) => g.entries.reduce((n, en) => n + (en.item ? (en.item.tabs ? en.item.tabs[0].lines : en.item.lines).filter((l) => l.who !== "n").length : 0), 0);
      const total = groups.reduce((n, g) => n + lineCount(g), 0);
      const selfLines = P.thread.flatMap((g) => g.items.flatMap((it) => (it.tabs ? it.tabs[0].lines : it.lines))).filter((l) => l.who === "s").length;
      const convs = [...groups.map((g) => ({ id: g.id, title: g.title, sub: g.sub ?? "", n: lineCount(g) || g.entries.length, c: g.id === "jesus" ? "var(--jesus-edge)" : "var(--tone)", ava: g.id === "jesus" ? `<span class="ava lg is-j">${icon("cross", 18, 2)}</span>` : `<span class="ava lg">${icon(g.id === "acts" ? "users" : "scroll", 18)}</span>` })),
        { id: "end", title: "After Scripture", sub: `${P.ending.tradition.length} forwarded reports`, n: P.ending.tradition.length, c: "var(--l-tradition)", ava: `<span class="ava lg is-t">${icon("forward", 18)}</span>` },
        { id: "q", title: "Open questions", sub: `${P.questions.length} polls, no votes`, n: P.questions.length, c: "var(--l-scholars)", ava: `<span class="ava lg is-q">${icon("poll", 18)}</span>` }];
      const story = P.story?.short ? `<div class="story">${esc(P.story.short)}${claimFoot({ layer: "story" })}</div>` : "";
      const scarce = isScarce() ? `<div class="evt is-system"><b>Scripture tells little about him.</b> ${esc(P.notSaid[0])} The thread is short because the record is.</div>` : "";
      main.innerHTML = `<div class="th-wrap">${topline()}
        <div class="th-app glass">
          <aside class="th-pane th-rail"><div class="th-prof"><div class="th-ava-xl ${isScarce() ? "is-quiet" : ""}">${esc(P.initial)}</div><h1>${esc(P.name)}</h1><p class="aka">also ${esc(P.otherNames.join(", "))}</p><p class="bio">${esc(P.tagline)}</p>${story}
            <div class="th-stats"><div><b>${P.moments.length}</b><span>moments</span></div><div><b>${selfLines}</b><span>his lines</span></div><div><b>${P.ending.tradition.length}</b><span>reports</span></div></div></div>
            <nav class="th-convs" aria-label="Conversations"><h2>Conversations</h2>${convs.map((c) => `<button type="button" class="th-conv" data-go="${c.id}" style="--c:${c.c}">${c.ava}<span><b>${esc(c.title)}</b><small>${esc(c.sub)}</small></span><em>${c.n}</em></button>`).join("")}</nav></aside>
          <section class="th-pane th-main"><div class="th-bar"><span class="ava is-s">${esc(P.initial)}</span><div><b class="bar-t">${esc(groups[0]?.title ?? "")}</b><small class="bar-s">${total} recorded lines · every one word for word from the KJV</small></div><span class="k">G · The thread</span></div>
            <div class="th-flow">${scarce}${groups.map((g) => `<div class="th-group" id="th-${g.id}" data-group="${g.id}" style="--c:${g.id === "jesus" ? "var(--jesus-edge)" : "var(--tone)"}"><span>${g.id === "jesus" ? icon("cross", 15, 2) : icon(g.id === "acts" ? "users" : "scroll", 15)}${esc(g.title)}</span><small>${esc(g.sub ?? "")}</small></div>${g.entries.map((en) => `<div class="th-item" data-item="${esc(en.key)}">${itemHTML(en, tabs)}</div>`).join("")}`).join("")}
              ${endingHTML()}${pollsHTML()}</div></section>
          <aside class="th-pane th-info">${detailsHTML()}</aside>
        </div><div class="ctx-sheet glass"></div></div>`;

      const app = main.querySelector(".th-app"), flow = main.querySelector(".th-main"), slot = main.querySelector(".ctx-slot"), sheet = main.querySelector(".ctx-sheet");
      const reveal = (nodes, label) => {
        if (!nodes.length) return;
        nodes.forEach((n) => { n.style.opacity = "0"; n.style.transform = "translateY(10px)"; });
        Clock.run({
          label, duration: Math.min(1600, 260 + nodes.length * 140),
          frame(p) { nodes.forEach((n, k) => { const a = (k / nodes.length) * .8, q = easeOut(span01(p, a, a + .2)); n.style.opacity = q >= 1 ? "" : String(q); n.style.transform = q >= 1 ? "" : `translateY(${((1 - q) * 10).toFixed(1)}px)`; }); },
          moving: (p) => [`message ${Math.min(nodes.length, Math.floor(p * nodes.length / .8) + 1)} of ${nodes.length}, arriving`],
        });
      };
      main.addEventListener("click", (e) => {
        const go = e.target.closest("[data-go]");
        if (go) { main.querySelector(`#th-${go.dataset.go}`)?.scrollIntoView({ block: "start" }); return; }
        const tb = e.target.closest("[data-thtab]");
        if (tb) {
          const [key, i] = tb.dataset.thtab.split(":"); tabs[key] = Number(i);
          const it = P.threadByKey[key], box = main.querySelector(`[data-msgs="${key}"]`);
          tb.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === tb)));
          box.innerHTML = messages(key, tabs[key], it.tabs[tabs[key]].lines);
          reveal([...box.children], `${it.tabs[tabs[key]].label ?? BOOK_TAB[it.tabs[tabs[key]].book]}'s wording arrives`);
          return;
        }
        const poll = e.target.closest("[data-poll]");
        if (poll) { poll.parentElement.classList.toggle("is-open"); return; }
        if (e.target.closest('[data-ctx="close"]')) { app.classList.remove("has-ctx"); main.querySelectorAll(".msg.is-sel").forEach((m) => m.classList.remove("is-sel")); slot.innerHTML = `<p class="hint">${icon("info", 18)}Tap any message to see its passage and its parallels in the other Gospels.</p>`; sheet.innerHTML = ""; return; }
        const b = e.target.closest("[data-key][data-li]");
        if (b) {
          main.querySelectorAll(".msg.is-sel").forEach((m) => m.classList.remove("is-sel"));
          b.closest(".msg")?.classList.add("is-sel");
          const html = contextHTML(b.dataset.key, Number(b.dataset.tab), Number(b.dataset.li));
          if (narrow) sheet.innerHTML = html; else slot.innerHTML = html;
          app.classList.add("has-ctx");
          if (!narrow) main.querySelector(".th-info").scrollTo({ top: 0 });
        }
      });
      // Which conversation is on screen.
      const bar = main.querySelector(".bar-t");
      const io = new IntersectionObserver((entries) => {
        for (const en of entries) if (en.isIntersecting) {
          const id = en.target.dataset.group;
          main.querySelectorAll(".th-conv").forEach((c) => c.setAttribute("aria-current", String(c.dataset.go === id)));
          bar.textContent = convs.find((c) => c.id === id)?.title ?? "";
        }
      }, { root: narrow ? null : flow, rootMargin: "0px 0px -70% 0px" });
      main.querySelectorAll(".th-group").forEach((g) => io.observe(g));
      // The opening: the first messages arrive one by one.
      reveal([...main.querySelectorAll(".th-flow .msg, .th-flow .narr")].slice(0, 10), "The first messages arrive");
      return () => io.disconnect();
    },
  };
})();
