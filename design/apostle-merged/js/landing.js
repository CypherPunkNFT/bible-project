// The full-screen landing, unique for each apostle: his own drawing across the whole first screen, the name, one
// KJV line (the verse the drawing shows), and the key figures as one thin bar beneath. The person switcher sits at
// the top right: the Twelve in the order of Matthew 10, a divider, then Matthias and Paul.
window.Landing = (() => {
  const VIEW = "0 0 1600 900", NARROW = "620 60 980 820";
  function switcher(d) {
    const i = WHO.findIndex((w) => w.id === d.id), prev = WHO[(i + WHO.length - 1) % WHO.length], next = WHO[(i + 1) % WHO.length];
    const item = (w, n) => `<li><a href="?who=${w.id}" data-who="${w.id}" ${w.id === d.id ? 'aria-current="page"' : ""}><span class="n">${n}</span>${esc(w.name)}</a></li>`;
    return `<div class="who">
      <a class="who-step" href="?who=${prev.id}" data-who="${prev.id}" aria-label="Previous: ${esc(prev.name)}">${icon("chevronLeft", 16)}</a>
      <button type="button" class="who-btn" aria-haspopup="true" aria-expanded="false"><span class="who-of">${i < 12 ? `${i + 1} of the Twelve` : i === 12 ? "Chosen by lot" : "Apostle to the Gentiles"}</span><b>${esc(d.short)}</b>${icon("chevronDown", 14)}</button>
      <a class="who-step" href="?who=${next.id}" data-who="${next.id}" aria-label="Next: ${esc(next.name)}">${icon("chevronRight", 16)}</a>
      <div class="who-menu" role="menu"><p class="who-h">The Twelve · Matthew 10:2–4</p><ol>${WHO.slice(0, 12).map((w, k) => item(w, k + 1)).join("")}</ol>
        <p class="who-h who-div">After the Twelve</p><ol>${WHO.slice(12).map((w) => item(w, w.key === "matthias" ? "Acts 1" : "Acts 9")).join("")}</ol></div></div>`;
  }
  function html(d) {
    const p2 = d.periods[1].entries.length;
    const alt = d.alt?.[0];
    const line = d.landing.line, also = d.landing.also;
    const figs = [[d.verseCount, "verses that name him", alt ? `+ ${alt.count} that name ${alt.name}` : ""], [p2, d.key === "paul" ? "records of the call" : d.key === "matthias" ? "record of following Jesus" : "records with Jesus", ""],
      [d.rows.length, "named beside him", ""], [d.trad.length, "sources outside Scripture", "on how it ends"]];
    return `<section class="land" data-sec="landing" aria-label="${esc(d.name)}">
      <div class="land-art">${Kit.svg(VIEW, LANDING[d.landing.art](d), "landing plot")}</div>
      <div class="land-veil" aria-hidden="true"></div>
      <div class="land-top"><a class="back" href="/study/people?view=apostles">${icon("arrowLeft", 14)}Back to the apostles</a>${switcher(d)}</div>
      <div class="land-text">
        <p class="kicker rule">${esc(d.title)}</p>
        <h1 class="${d.short.length > 7 ? "long" : ""}">${esc(d.short)}${d.epithet ? `<em>${esc(d.epithet)}</em>` : ""}</h1>
        <blockquote class="land-line"><p>“${esc(line.t)}”</p><footer>${refLink([line.v, line.v])} · KJV${also ? ` <span class="land-also">· “${esc(also.t)}” ${refLink([also.v, also.v])}</span>` : ""}</footer></blockquote>
        ${d.landing.note ? `<p class="land-note">${esc(d.landing.note)}</p>` : ""}
        <p class="aka">${d.otherNames.length ? `Also called ${d.otherNames.map(esc).join(" · ")}` : esc(d.tagline)}</p>
      </div>
      <dl class="land-bar">${figs.map(([n, t, s]) => `<div><dd>${n}</dd><dt>${t}${s ? `<small>${esc(s)}</small>` : ""}</dt></div>`).join("")}</dl>
    </section>`;
  }
  function mount(host, d) {
    host.insertAdjacentHTML("beforeend", html(d));
    const sec = host.lastElementChild, svgEl = sec.querySelector(".land-art svg"), btn = sec.querySelector(".who-btn"), menu = sec.querySelector(".who-menu");
    const fit = () => { const narrow = innerWidth < 760; svgEl.setAttribute("viewBox", narrow ? NARROW : VIEW); svgEl.setAttribute("preserveAspectRatio", narrow ? "xMidYMid meet" : "xMaxYMax meet"); };
    fit();
    const close = (e) => { if (!e || !e.target.closest(".who")) { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } };
    btn.addEventListener("click", () => { const open = !menu.classList.contains("open"); menu.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); });
    document.addEventListener("click", close);
    addEventListener("resize", fit);
    return () => { document.removeEventListener("click", close); removeEventListener("resize", fit); };
  }
  return { mount };
})();
