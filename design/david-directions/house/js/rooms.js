// The rooms of the house: every section of the ruler page, below the tree. Each room links back to the tree
// ("Show on the tree") so the picture and the detail stay one page. Part one: glance, anointings, events, lists,
// verdict, two accounts, prophets, the nation.
(() => {
  const KIND = { personal: ["Family & person", "users"], battle: ["War", "swords"], alliance: ["Alliance & tribute", "link"], worship: ["Worship", "harp"], prophecy: ["Prophecy", "message"], building: ["Building", "house"], other: ["Other", "sparkle"] };
  const onTree = (i, text = "Show on the tree") => `<button type="button" class="on-tree" data-tree="${i}">${icon("tree", 15)}${text}</button>`;
  window.onTree = onTree;
  const room = (id, n, glyph, title, lead, body, cls = "") => `<section class="room ${cls}" id="${id}" aria-labelledby="${id}-h">
    <header class="room-head"><span class="room-n">${String(n).padStart(2, "0")}</span><span class="room-glyph">${icon(glyph, 30, 1.4)}</span>
      <div><h2 id="${id}-h">${title}</h2><p>${lead}</p></div></header>${body}</section>`;
  window.room = room;

  function glance() {
    const P = H.person, sam = P.records.find((r) => r.book === "samuel"), kings = P.records.find((r) => r.book === "kings");
    const sons = (list) => H.tree.filter((n) => n.role === "son" && !n.daughter && !H.people[n.id].custom && (list === "chronicles" || !H.chronicles.chroniclesOnly.includes(n.id))).length;
    const tiles = [
      ["Age at accession", `${sam.age.years}`, refLink(sam.age.span)],
      ["Reigned", `${P.reign.years} years`, `7 years 6 months in Hebron · 33 in Jerusalem · ${refLink(P.reign.refs[0])}`],
      ["Capital", P.capital.name, esc(P.capital.note)],
      ["Verdict", "✓ Right", `“${esc(kings.verdict.text.split(",")[0])} …” · ${refLink(kings.verdict.span)}`],
      ["Prophets", H.prophets.map((p) => p.person.name).join(" · "), H.prophets.map((p) => refLink(p.claim.refs[0])).join(" · ")],
      ["Sons named", `${sons("samuel")} / ${sons("chronicles")}`, `in 2 Samuel / in 1 Chronicles 3 · ${refLink([10003002, 10005016])} · ${refLink([13003001, 13003009])}`],
    ];
    return `<div class="glance wrap">${tiles.map(([k, v, s]) => `<div class="g-tile"><span>${k}</span><b>${esc(v)}</b><small>${s}</small></div>`).join("")}</div>`;
  }

  function anointings() {
    const where = [["Bethlehem", "by Samuel", "anointed"], ["Hebron", "by the men of Judah", "judah"], ["Hebron", "by the elders of Israel", "all-israel"]];
    const cols = where.map(([place, by, step], i) => `<article class="oil-col"><div class="vial" style="--fill:${(i + 1) / 3}">${icon("drop", 40, 1.3)}<b>${i + 1}</b></div>
      <h3>${place}</h3><p class="oil-by">${by}</p>${claim(H.accession[i])}${onTree(H.stepById[step].index)}</article>`).join("");
    return room("anointings", 1, "drop", "Three anointings", "Samuel's horn of oil, then Judah's, then all Israel's: the crown came to David three times. The three drops on David's node fill as you scrub.",
      `<div class="oil-row">${cols}</div><div class="oil-notes">${claim(H.accession[3])}${claim(H.accession[4])}</div>`);
  }

  function events() {
    const kinds = Object.keys(KIND).filter((k) => H.events.some((e) => e.kind === k));
    const lanes = kinds.map((k) => `<div class="lane" style="--k: var(--k-${k})"><span class="lane-name">${icon(KIND[k][1], 18)}${KIND[k][0]}</span>
      <div class="lane-chips">${H.events.map((e, i) => e.kind === k ? `<button type="button" class="ev-chip" data-ev="${i}" style="--o:${i}">${esc(e.label)}</button>` : "").join("")}</div></div>`).join("");
    return room("events", 2, "swords", "The reign, event by event", `All ${H.events.length} events in the ruler file, in lanes by kind and left to right in the order the text tells them. Scripture dates only three of them.`,
      `<div class="lanes glass">${lanes}<div class="ev-axis"><span>2 Samuel 2</span><span>the order of the telling →</span><span>1 Kings 2</span></div></div><div class="ev-detail glass" id="ev-detail"></div>`);
  }
  function eventDetail(i) {
    const e = H.events[i], [name] = KIND[e.kind];
    document.querySelectorAll(".ev-chip").forEach((c) => c.classList.toggle("is-on", +c.dataset.ev === i));
    const box = document.getElementById("ev-detail");
    box.innerHTML = `<div class="ev-in"><p class="kicker" style="--tone: var(--k-${e.kind})">${icon(KIND[e.kind][1], 14)} ${name}${e.year ? ` · year ${e.year}` : " · undated"}${e.place ? ` · ${icon("pin", 13)} ${esc(e.place)}` : ""}</p>
      <h3>${esc(e.label)}</h3>${claim(e.claim)}${onTree(e.step)}</div>`;
  }

  function lists() {
    const verse = (v) => `<blockquote class="cap-kjv"><p>“${esc(v.text)}”</p><footer>${chip("kjv")}<span class="refs">${refLink(v.span)}</span></footer></blockquote>`;
    const col = (list, title) => { const vs = H.chronicles.verses.filter((v) => v.list === list); return `<div class="list-col list-${list}"><h3>${title}</h3>${verse(vs[0])}${expander(vs.slice(1).map(verse).join(""), { closed: `The sons, as ${title} lists them`, opened: "Show less" })}
      <button type="button" class="list-switch" data-list="${list}">${icon("tree", 15)}Draw the tree from this list</button></div>`; };
    return room("lists", 3, "list", "One family, two lists", "2 Samuel and 1 Chronicles name David's brothers and sons differently: Chileab is Daniel, Bath-sheba is Bath-shua, and Chronicles adds Nogah and a second Eliphelet. The tree can be drawn from either list; it never merges them.",
      `<div class="lists-grid">${col("samuel", "1–2 Samuel")}${col("chronicles", "1 Chronicles")}</div>`);
  }

  function verdict() {
    const kings = H.person.records.find((r) => r.book === "kings"), chron = H.person.records.find((r) => r.book === "chronicles");
    const leaves = H.verdictNotes.map((c, i) => `<li class="leaf-note" style="--i:${i}"><i></i>${claim(c)}</li>`).join("");
    return room("verdict", 4, "scale", "The verdict", "Kings judges every king against the LORD's ways; David is the measure the later kings are held to. The page adds no verdict of its own.",
      `<div class="verdict-grid"><figure class="verdict-quote glass"><span class="v-mark">✓<small>did that which was right</small></span>
          <blockquote>“${esc(kings.verdict.text)}”</blockquote><figcaption>${refLink(kings.verdict.span)} · KJV ${chip("scripture")}</figcaption>
          <div class="v-end"><div><span>Kings</span>${claim(kings.death)}<p class="v-burial">“${esc(kings.burial.text)}” ${refLink(kings.burial.span)}</p></div><div><span>Chronicles</span>${claim(chron.death)}</div></div></figure>
        <ol class="vine">${leaves}</ol></div>`);
  }

  function twoAccounts() {
    const tabs = H.twoAccounts.map((t, i) => `<button type="button" class="ta-tab" data-ta="${i}" aria-pressed="${i === 0}"><b>${String(i + 1).padStart(2, "0")}</b>${esc(t.topic)}</button>`).join("");
    return room("two-accounts", 5, "split", "Samuel and Kings beside Chronicles", `${H.twoAccounts.length} places where the two accounts of David's reign differ. Each is shown side by side, as each book tells it, and never merged.`,
      `<div class="ta glass"><div class="ta-tabs" role="group" aria-label="Topics">${tabs}</div><div class="ta-pane" id="ta-pane"></div></div>`);
  }
  function showAccount(i) {
    const t = H.twoAccounts[i];
    document.querySelectorAll(".ta-tab").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.ta === i)));
    document.getElementById("ta-pane").innerHTML = `<div class="ta-in"><h3>${esc(t.topic)}</h3><div class="ta-pair">
      <div class="ta-side ta-sam"><span>${t.first.text.startsWith("1 Kings") ? "1 Kings" : "1–2 Samuel"}</span>${claim(t.first)}</div>
      <div class="ta-seam" aria-hidden="true"></div>
      <div class="ta-side ta-chr"><span>${t.second.text.startsWith("1 Kings and") ? "1 Kings and 1 Chronicles" : "1 Chronicles"}</span>${claim(t.second)}</div></div></div>`;
  }

  function prophets() {
    const stepOf = { "Samuel": "anointed", "Gad": "census", "Nathan": "the-man" };
    const cards = H.prophets.map((p) => `<article class="voice glass"><div class="voice-medal">${esc(p.person.name[0])}</div><h3>${esc(p.person.name)}</h3>
      <blockquote>“${esc(p.quote.text)}”<footer>${refLink(p.quote.span)} · KJV</footer></blockquote>${claim(p.claim)}
      <div class="voice-foot">${onTree(H.stepById[stepOf[p.person.name]].index, "Find on the tree")}<a class="ref" href="/people/${esc(p.person.personId)}">Person page</a></div></article>`).join("");
    return room("prophets", 6, "message", "The prophets beside him", "Samuel anointed him, Gad was “David's seer”, and Nathan brought both the promise and the rebuke. All three stand on the tree as the court.", `<div class="voices">${cards}</div>`);
  }

  function nation() {
    const lens = [["worship", "Worship", "harp"], ["building", "Building", "house"], ["alliances", "Alliances & tribute", "link"], ["people", "The people", "users"]];
    return room("nation", 7, "users", "What the nation did", "Four lenses on the kingdom under David. Choosing one replaces the text at once.",
      `<div class="lens glass"><div class="lens-bar" role="group" aria-label="Lens">${lens.map(([k, name, ic], i) => `<button type="button" data-lens="${k}" aria-pressed="${i === 0}">${icon(ic, 20)}<span>${name}</span><em>${H.nation[k].length}</em></button>`).join("")}</div><div class="lens-body" id="lens-body"></div></div>`);
  }
  const showLens = (k) => {
    document.querySelectorAll("[data-lens]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lens === k)));
    document.getElementById("lens-body").innerHTML = H.nation[k].map((c) => claim(c)).join("");
  };

  function index() {
    const rooms = [["anointings", "Anointings"], ["events", "Events"], ["lists", "Two lists"], ["verdict", "Verdict"], ["two-accounts", "Two accounts"], ["prophets", "Prophets"], ["nation", "The nation"],
      ["places", "Places"], ["world", "World stage"], ["dating", "Dating"], ["questions", "Questions"], ["not-said", "Not said"], ["story", "His story"], ["passages", "Passages"], ["sources", "Sources"]];
    return `<nav class="rooms-nav wrap" aria-label="Rooms of the house"><span>${icon("house", 16)} Rooms of the house</span>${rooms.map(([id, name]) => `<a href="#${id}">${name}</a>`).join("")}</nav>`;
  }

  function mount(main) {
    main.insertAdjacentHTML("beforeend", `${glance()}${index()}<div class="rooms wrap">${anointings()}${events()}${lists()}${verdict()}${twoAccounts()}${prophets()}${nation()}${Rooms2.html()}</div>`);
    eventDetail(0); showAccount(0); showLens("worship"); Rooms2.after();
    main.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tree], [data-ev], [data-ta], [data-lens], .list-switch");
      if (!t) return;
      if (t.dataset.tree !== undefined) Stage.show(+t.dataset.tree);
      else if (t.dataset.ev !== undefined) eventDetail(+t.dataset.ev);
      else if (t.dataset.ta !== undefined) showAccount(+t.dataset.ta);
      else if (t.dataset.lens) showLens(t.dataset.lens);
      else if (t.classList.contains("list-switch")) Stage.show(Stage.step); // the stage's own [data-list] handler switches the list
    });
  }
  window.Rooms = { mount };
})();
