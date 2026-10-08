// The reign at a glance, the three anointings (a chord of three strings), the verdict, the prophets who spoke to him
// (call and answer), and the two tellings (Samuel and Kings beside Chronicles, never merged).
(() => {
  const head = (id, kick, title, lead, ico) => `<header class="sec-intro" id="${id}-head"><p class="kicker">${icon(ico, 16)}${kick}</p><h2>${title}</h2>${lead ? `<p class="lead">${lead}</p>` : ""}</header>`;
  window.secHead = head;

  function glance() {
    const a = D.about, mc = D.dates.find((d) => d.system === "thiele-mcfall");
    const cell = (k, big, small, extra = "") => `<div class="gl"><small>${k}</small><b>${big}</b><span>${small}</span>${extra}</div>`;
    return `<section class="glance"><div class="wrap"><div class="gl-row">
      ${cell("Reigned", `${a.reign.years} years`, "7 years 6 months in Hebron · 33 in Jerusalem", `<em>${refList(a.reign.refs.slice(0, 1), true)}</em>`)}
      ${cell("Capital", "Hebron → Jerusalem", "“the city of David”", `<em>${refList(a.capital.refs, true)}</em>`)}
      ${cell("Succession", "3rd king", `after <a href="/people/${a.predecessor.id}/rule">${esc(a.predecessor.name)}</a> · before <a href="/people/${a.successor.id}/rule">${esc(a.successor.name)}</a>`)}
      ${cell("Verdict", `${icon("check", 22, 2.2)}Right`, "“save only in the matter of Uriah the Hittite”", `<em>${refLink(D.verdict.quote.span, true)}</em>`)}
      ${cell("Prophets", D.prophets.map((p) => esc(p.person.name)).join(" · "), "who anointed, counselled and rebuked him", `<em><a href="#prophets-head">The call and answer ↓</a></em>`)}
      ${cell("Dates", `c. ${mc.from}–${mc.to} BC`, "McFall's figures; other schemes differ", `<em><a href="#dates-head">All the views ↓</a></em>`)}
    </div>
    <nav class="jumps" aria-label="Sections">${[["duet", "The duet"], ["anoint-head", "Three anointings"], ["verdict-head", "The verdict"], ["prophets-head", "Prophets"], ["tellings-head", "Two tellings"], ["kingdom-head", "Kingdom"], ["world-head", "World stage"], ["dates-head", "Dates"], ["questions-head", "Open questions"], ["sources-head", "Passages & sources"]]
      .map(([id, l]) => `<a href="#${id}">${l}</a>`).join("")}</nav></div></section>`;
  }

  function anointings() {
    const rows = D.anointings.map((x, i) => `<div class="an" data-i="${i}">
        <div class="an-l"><span class="an-n">${["I", "II", "III"][i]}</span><div><b>${esc(x.where)}</b><small>by ${esc(x.by)}</small></div></div>
        <div class="an-track" style="--reach:${[0.42, 0.7, 1][i]}"><i class="an-a"></i><i class="an-b"></i>
          <p class="an-whom">${esc(x.whom)}</p>
          <p class="an-verse">${esc(x.verse.text)} <a class="ref" href="${refHref(x.verse.ref)}">${esc(refText(x.verse.ref, true))}</a></p></div>
      </div>`).join("");
    return `<section class="sec" id="anoint"><div class="wrap">
      ${head("anoint", "The three anointings", "Anointed three times. <em>A chord, not a single note.</em>", "1–2 Samuel record three anointings, each wider than the last: among his brothers, over Judah, over Israel. Touch a string to sound it.", "horn")}
      <div class="chord" id="chord">${rows}</div>
      <div class="an-notes">${claim(D.accession[3])}${claim(D.accession[4])}</div>
    </div></section>`;
  }

  function verdict() {
    const q = D.verdict.quote.text, cut = q.indexOf("save only");
    return `<section class="sec verdict-sec"><div class="wrap">
      ${head("verdict", "The verdict", "How Kings measures him", "The Bible's own words, quoted as written. The page adds no verdict of its own.", "scroll")}
      <figure class="verdict glass">
        <span class="v-badge">${icon("check", 26, 2)}Right, with one exception named</span>
        <blockquote><p>“${esc(q.slice(0, cut).trim())}</p><p class="v-save"><i aria-hidden="true"></i>${esc(q.slice(cut))}.”</p></blockquote>
        <figcaption>${refLink(D.verdict.quote.span)} · KJV</figcaption>
      </figure>
      <div class="v-notes">${D.verdict.notes.map((n) => claim(n, "v-note")).join("")}</div>
    </div></section>`;
  }

  function prophets() {
    const rows = D.prophets.map((p, i) => {
      const reply = D.replies[p.person.personId];
      return `<div class="pr" data-i="${i}">
        <div class="pr-call"><div class="pr-who"><span class="pr-mono">${esc(p.person.name[0])}</span><div><small>The prophet</small><a href="/people/${p.person.personId}">${esc(p.person.name)}</a></div></div>
          <p class="pr-q">“${esc(p.quote.text)}”</p><p class="pr-qref">${refLink(p.quote.span)} · KJV</p>${claim(p.claim)}<i class="pr-a"></i></div>
        <div class="pr-reply ${reply ? "" : "is-silent"}"><i class="pr-b"></i><small>${reply ? "David answers" : "His answer"}</small>
          ${reply ? `<p class="pr-r">“${esc(reply.text)}”</p><p class="pr-qref">${refLink(reply.ref)} · KJV</p>` : `<p class="pr-none">The record gives no reply from David in his own words.</p>`}</div>
      </div>`;
    }).join("");
    return `<section class="sec" id="prophets"><div class="wrap">
      ${head("prophets", "Prophets of the reign", "Voices that spoke to him, <em>and what he said back</em>", "Samuel, Gad and Nathan, each with the line that stands for their part, and David's answer where the record gives it in his own words.", "message")}
      <div class="call" id="call">${rows}</div>
    </div></section>`;
  }

  function tellings() {
    const recs = D.about.records;
    const rec = (r) => {
      const name = { samuel: "1–2 Samuel", kings: "1 Kings", chronicles: "1 Chronicles" }[r.book];
      const items = [];
      if (r.age) items.push(`<li><small>Age at accession</small><b>${r.age.years}</b>${refLink(r.age.span, true)}</li>`);
      if (r.length) items.push(`<li><small>Years</small><b>${r.length.years}</b>${refLink(r.length.span, true)}</li>`);
      if (r.capital) items.push(`<li><small>Capital</small><b class="sm">${esc(r.capital.name)}</b>${refLink(r.capital.span, true)}</li>`);
      if (r.death) items.push(`<li class="wide"><small>His death</small><p>${esc(r.death.text)}</p>${refList(r.death.refs, true)}</li>`);
      if (r.burial) items.push(`<li class="wide"><small>Burial</small><p>“${esc(r.burial.text)}”</p>${refLink(r.burial.span, true)}</li>`);
      if (r.sourcesCited) items.push(`<li class="wide"><small>Its sources, named</small><p>“${esc(r.sourcesCited.text)}”</p>${refLink(r.sourcesCited.span, true)}</li>`);
      return `<div class="rc" data-book="${r.book}"><h4>${name}</h4><ul>${items.join("")}</ul></div>`;
    };
    const rows = D.twoAccounts.map((t, i) => `<div class="tw" data-i="${i}">
        <div class="tw-a">${claim(t.first)}<i class="tw-da"></i></div>
        <div class="tw-topic"><span>${esc(t.topic)}</span></div>
        <div class="tw-b"><i class="tw-db"></i>${claim(t.second)}</div></div>`).join("");
    return `<section class="sec" id="tellings"><div class="wrap">
      ${head("tellings", "Two tellings", "Samuel and Kings, <em>beside Chronicles</em>", "Three books keep the count of his reign. Where they tell the same thing differently, both are shown side by side, each with its verses. Nothing is merged.", "split")}
      <div class="rcs">${recs.map(rec).join("")}</div>
      <div class="tw-head"><span>1–2 Samuel · 1 Kings</span><span>${D.twoAccounts.length} places they differ</span><span>1 Chronicles</span></div>
      <div class="tws" id="tws">${rows}</div>
    </div></section>`;
  }

  // Strings for these sections, and their plucks.
  function mount() {
    const chord = new Strings.Layer(document.getElementById("chord"), "chord-strings");
    document.querySelectorAll("#chord .an").forEach((row, i) => chord.add(row.querySelector(".an-a"), row.querySelector(".an-b"), { id: `an-${i}`, orient: "h", label: `Anointing ${["I", "II", "III"][i]} (${D.anointings[i].where})`, freq: [5, 6.5, 8][i], amp: 12 }));
    document.getElementById("chord").addEventListener("pointerover", (e) => {
      const row = e.target.closest(".an");
      if (row && row.dataset.hot !== "1") { document.querySelectorAll(".an[data-hot]").forEach((x) => delete x.dataset.hot); row.dataset.hot = "1"; Strings.pluck([`an-${row.dataset.i}`], `Anointing ${Number(row.dataset.i) + 1}`, { duration: 2200 }); }
    });
    once(document.getElementById("chord"), () => Strings.pluck(["an-0", "an-1", "an-2"], "The three anointings, struck as a chord", { duration: 2600, stagger: 320 }));

    const call = new Strings.Layer(document.getElementById("call"), "call-strings");
    document.querySelectorAll("#call .pr").forEach((row, i) => call.add(row.querySelector(".pr-a"), row.querySelector(".pr-b"), { id: `pr-${i}`, label: `${D.prophets[i].person.name} and David`, loose: !D.replies[D.prophets[i].person.personId], reach: 0.5, cls: D.replies[D.prophets[i].person.personId] ? "call-s" : "loose call-s", freq: 6 }));
    hoverPluck(document.getElementById("call"), ".pr", "pr", (i) => `${D.prophets[i].person.name} speaks; David answers`);

    const tws = new Strings.Layer(document.getElementById("tws"), "tw-strings");
    document.querySelectorAll("#tws .tw").forEach((row, i) => tws.add(row.querySelector(".tw-da"), row.querySelector(".tw-db"), { id: `tw-${i}`, label: D.twoAccounts[i].topic, beat: true, freq: 5, amp: 6, cls: "tw-s" }));
    hoverPluck(document.getElementById("tws"), ".tw", "tw", (i) => `Two tellings: ${D.twoAccounts[i].topic} (two tones, beating)`);
  }
  function hoverPluck(host, sel, prefix, label) {
    const go = (e) => {
      const row = e.target.closest(sel);
      if (!row || row.dataset.hot === "1") return;
      host.querySelectorAll(`${sel}[data-hot]`).forEach((x) => delete x.dataset.hot);
      row.dataset.hot = "1";
      Strings.pluck([`${prefix}-${row.dataset.i}`], label(Number(row.dataset.i)), { duration: 2400 });
    };
    host.addEventListener("pointerover", go);
    host.addEventListener("click", (e) => { const row = e.target.closest(sel); if (row && !e.target.closest("a")) { delete row.dataset.hot; go(e); } });
  }
  function once(elm, fn) {
    const io = new IntersectionObserver((entries) => { if (entries.some((x) => x.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: "-30% 0px -30% 0px" });
    io.observe(elm);
  }
  window.once = once;
  window.hoverPluck = hoverPluck;
  window.SecA = { glance, anointings, verdict, prophets, tellings, mount };
})();
