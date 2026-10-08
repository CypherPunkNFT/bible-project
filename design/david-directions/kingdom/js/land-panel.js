// The warm glass panel beside the land: what the table is showing, in words, with its verses and evidence.
// Renderers only; land.js decides when each is shown.
(() => {
  const ROLE_NAME = { david: "David's side", enemy: "Against him", ally: "Friendly power", prophet: "Prophet", ark: "Worship", rival: "Rival for the throne", house: "House of Saul", power: "Power of the day" };
  const kindOf = (id) => DV.kinds.find((k) => k.id === id);
  const conf = (c) => `${c >= 0.8 ? "sure" : c >= 0.45 ? "likely" : "uncertain"} place`;
  const tags = (list) => list.filter(Boolean).length ? `<p class="dp-tags">${list.filter(Boolean).join('<span aria-hidden="true">·</span>')}</p>` : "";

  function reignLine(t) {
    const total = 40.5, heb = 7.5;
    const mark = t.yearN ? `<i class="rl-mark" style="left:${(Math.min(total, t.yearN - (t.yearN === 1 ? 1 : 0.5)) / total) * 100}%"></i>` : "";
    const note = t.yearN ? `${esc(t.year)} of forty · ${refLink([10005004, 10005005])}` : t.year === "Before the reign" ? "Before the reign began" : t.year === "In the Hebron years" ? `During the years at Hebron · ${refLink(10003001)}` : "Scripture does not give the year of the reign";
    return `<div class="rl ${t.yearN ? "" : "is-undated"} ${t.year === "Before the reign" ? "is-before" : ""}"><div class="rl-track"><span class="rl-heb" style="width:${(heb / total) * 100}%"></span><span class="rl-jer"></span>${mark}</div>
      <p><span>Hebron · 7 years 6 months</span><span>Jerusalem · 33 years</span></p><small>${note}</small></div>`;
  }
  const twoAcc = (i) => { const a = DV.twoAccounts[i]; return `<div class="dp-two"><h4>${esc(a.topic)}</h4><div class="two">${claim(a.first, "two-a")}${claim(a.second, "two-b")}</div></div>`; };
  const question = (id) => { const q = DV.questionById[id]; return `<div class="dp-q"><h4>${esc(q.question)}</h4>${q.views.map((v) => `<div class="view"><b>${esc(v.label)}</b><small>Held by ${esc(v.holders)}</small>${claim(v.argument)}</div>`).join("")}</div>`; };
  const prophet = (i) => { const p = DV.prophets[i]; return `<div class="dp-prophet"><span class="medal">${esc(p.person.name[0])}</span><div><b>${esc(p.person.name)}</b>${quoteSpan(p.quote)}${claim(p.claim)}</div></div>`; };

  window.LandPanel = {
    overview() {
      const placed = DV.crystals.length;
      return `<article class="dp">
        <p class="dp-top"><span>The land of the reign</span><span>${DV.turns.length} turns · ${DV.places.length} places · ${DV.powers.length} powers</span></p>
        <h2>Where it happened</h2>
        <p class="dp-lead">${placed} moments of David's life stand on the land as crystals, each where Scripture sets it, in its kind's colour and shape. Choose a kind to see only those, or touch a crystal to read it.</p>
        <button type="button" class="dp-begin" data-turn="0">${icon("play", 15)}Begin the campaign<small>27 turns, Bethlehem to the city of David</small></button>
        <p class="dp-note">${icon("info", 14)}<span>One event has no place of its own and stands nowhere: ${DV.unplaced.map(esc).join(", ")}. No borders are drawn; Scripture names places, not frontiers. Peaks mark mountains the Atlas names, not to scale.</span></p>
      </article>`;
    },
    turn(t) {
      const ph = DV.phases.find((p) => p.id === t.phase);
      const more = (t.differ ?? []).map(twoAcc);
      return `<article class="dp dp-turn" style="--tone: var(--r-${t.pieces[0]?.role ?? "david"})">
        <p class="dp-top"><span>Turn <b>${t.n}</b> of ${DV.turns.length}</span><span>${esc(ph.name)} · ${esc(ph.books)}</span></p>
        <h2>${esc(t.title)}</h2>
        ${tags([t.anointing && `${icon("oil", 13)}Anointing ${t.anointing} of 3`, t.hebron && `${icon("hourglass", 13)}Seven years and six months (2 Samuel 5:5)`, t.chroniclesOnly && `${icon("book", 13)}Chronicles alone`, t.sin && `${icon("eye", 13)}The matter of Uriah`])}
        ${reignLine(t)}
        ${kjv(t.verse, "kjv-lg")}
        <div class="dp-claims">${t.claims.map((c) => claim(c)).join("")}</div>
        ${(t.extraVerses ?? []).map((v) => kjv(v, "kjv-sm")).join("")}
        <h3 class="dp-h">On the table</h3>
        <ul class="dp-pieces">${t.pieces.map((p, i) => { const a = DV.atlas[p.place]; return `<li data-piece="${t.n}-${i}" class="r-${p.role}"><span class="dp-pi">${icon(p.icon, 16)}</span><div><b>${esc(p.label)}</b><small>${esc(ROLE_NAME[p.role] ?? p.role)} · ${esc(a.name)} · ${conf(a.confidence)}</small>${p.verse ? `<q>${esc(DV.verses[p.verse])}</q> ${refLink(p.verse)}` : ""}</div></li>`; }).join("")}</ul>
        ${t.moves.filter((m) => m.stops).map((m) => `<h3 class="dp-h">${m.kind === "circuit" ? "The count's circuit" : "The way, place by place"}</h3><ol class="dp-route">${m.path.map((id, k) => `<li class="dp-step" data-k="${k}"><b>${esc(DV.atlas[id].name)}</b>${m.stops?.[k] ? `<q>${esc(DV.verses[m.stops[k]])}</q> ${refLink(m.stops[k])}` : ""}</li>`).join("")}</ol>`).join("")}
        ${(t.offboard ?? []).map((o) => `<p class="dp-off">${icon("arrowRight", 15)}<span><b>${esc(o.label)}</b> ${esc(o.note)} ${refLink(o.verse)}</span></p>`).join("")}
        ${more.length ? expander(`Samuel${t.n >= 26 ? " and Kings" : ""} and Chronicles differ here (${more.length})`, more.join(""), { ico: "split", cls: "dp-x" }) : ""}
        ${(t.questions ?? []).length ? expander("An open question", t.questions.map(question).join(""), { ico: "help", cls: "dp-x" }) : ""}
        ${(t.prophets ?? []).length ? expander(`The prophet${t.prophets.length > 1 ? "s" : ""} in this turn`, t.prophets.map(prophet).join(""), { ico: "scroll", cls: "dp-x" }) : ""}
        ${(t.notSaid ?? []).map((i) => `<p class="dp-note">${icon("info", 14)}<span>${esc(DV.notSaid[i])}</span></p>`).join("")}
      </article>`;
    },
    kind(k, list) {
      return `<article class="dp" style="--tone: var(--k-${k.id})">
        <p class="dp-top"><span>Crystals by kind</span><span>${list.length} on the land</span></p>
        <div class="dp-kindhead"><span class="dp-gem">${Crystals.svg(k.id, 44)}</span><div><h2>${esc(k.label)}</h2><p>Shaped as ${esc(k.shape.toLowerCase())}. Touch one to read it.</p></div></div>
        <ol class="dp-moments">${list.map((c) => `<li><button type="button" data-crystal="${esc(c.key)}"><b>${esc(c.label)}</b><small>${esc(DV.atlas[c.placeId].name)}${c.before ? " · before the reign" : ""} · ${esc(refText(c.verse))}</small></button></li>`).join("")}</ol>
        <button type="button" class="dp-back" data-kind-clear>${icon("arrowLeft", 15)}Show every kind</button>
      </article>`;
    },
    crystal(c) {
      const k = kindOf(c.kind), m = c.event !== undefined ? DV.moments[c.event] : null, cat = m ? DV.cats.find((x) => x.id === m.cat) : null;
      return `<article class="dp" style="--tone: var(--k-${c.kind})">
        <p class="dp-top"><span>${esc(k.label)}${m?.year ? ` · reign year ${m.year}` : c.before ? " · before the reign" : ""}</span><span>${esc(DV.atlas[c.placeId].name)} · ${conf(DV.atlas[c.placeId].confidence)}</span></p>
        <div class="dp-kindhead"><span class="dp-gem">${Crystals.svg(c.kind, 44)}</span><div><h2>${esc(c.label)}</h2></div></div>
        ${kjv(c.verse, "kjv-lg")}
        ${claim(c.claim)}
        ${cat ? `<button type="button" class="dp-begin" data-open-cat="${cat.id}" data-open-event="${c.event}">${icon(cat.icon, 15)}Read it in “${esc(cat.title)}”<small>the reign, below</small></button>` : ""}
        <button type="button" class="dp-back" data-crystal-clear>${icon("arrowLeft", 15)}Back</button>
      </article>`;
    },
    places(sel) {
      const cap = DV.person.capital;
      return `<article class="dp" style="--tone: var(--r-david)">
        <p class="dp-top"><span>The kingdom's places</span><span>${DV.places.length} named in the reign</span></p>
        <h2>${sel ? esc(sel.name) : "Every place of the reign"}</h2>
        ${sel ? `<p class="dp-lead">${esc(sel.note)} · ${refList(sel.refs)}</p><p class="dp-sub">${esc(DV.atlas[sel.placeId].type)} in the Atlas · ${conf(DV.atlas[sel.placeId].confidence)}</p>` : `<p class="dp-lead">No borders are drawn: only the places the text names.</p>`}
        <p class="dp-cap">${icon("crown", 15)}<span><b>Capital: ${esc(cap.name)}.</b> ${esc(cap.note)} ${refList(cap.refs)}</span></p>
        <ul class="dp-placelist">${DV.places.map((p, i) => `<li class="${sel?.i === i ? "is-on" : ""}"><button type="button" data-place-i="${i}"><b>${esc(p.name)}</b><small>${esc(p.note)}</small></button></li>`).join("")}</ul>
      </article>`;
    },
    powers(sel) {
      return `<article class="dp" style="--tone: var(--r-power)">
        <p class="dp-top"><span>On the world stage</span><span>${DV.powers.length} powers</span></p>
        <h2>${sel ? esc(sel.power) : "The powers of the day"}</h2>
        <p class="dp-sub">Each stands at its city or land as the Atlas places it.</p>
        ${(sel ? [sel] : DV.powers).map((pw) => `<div class="dp-power"><button type="button" data-power="${DV.powers.indexOf(pw)}"><b>${esc(pw.power)}</b>${pw.rulers.length ? `<small>${pw.rulers.map((r) => esc(r.name)).join(" · ")}</small>` : ""}</button>${claim(pw.claim)}${pw.rulers.filter((r) => r.note).map((r) => `<p class="dp-note">${icon("info", 14)}<span>${esc(r.name)}: ${esc(r.note)}</span></p>`).join("")}</div>`).join("")}
        ${sel ? `<button type="button" class="dp-back" data-mode="powers">${icon("arrowLeft", 15)}All the powers</button>` : ""}
      </article>`;
    },
  };
})();
