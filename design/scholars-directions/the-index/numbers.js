// The index · by the numbers: scholars per field, per era, per faith and how many this site uses. Every row is also a
// filter for the catalogue: clicking it sets that filter and brings the catalogue into view. The darker part of a bar
// is how many of that group the catalogue is showing right now.
window.IX.numbers = (() => {
  const { S, esc, eraParts, shapeIcon, on } = IX;
  let root;
  const count = (key, value) => S.scholars.filter((s) => s[key] === value).length;
  const max = (key, labels) => Math.max(...Object.keys(labels).map((v) => count(key, v)));

  const bars = (key, labels, explain) => {
    const top = max(key, labels);
    return `<ul class="num-bars">${Object.entries(labels).map(([value, label]) => {
      const n = count(key, value);
      return `<li><button type="button" class="num-row" data-facet="${key}" data-value="${value}" aria-pressed="false"${key === "field" ? ` style="--tone: var(${IX.TONE[value]})"` : ""}>
        <span class="num-l">${key === "field" ? shapeIcon(value, 12) : ""}${esc(key === "era" ? eraParts(value)[0] : label)}</span>
        <span class="num-track"><i style="width:${n / top * 100}%"></i><b style="width:${n / top * 100}%"></b></span>
        <span class="num-n"><b>${n}</b></span></button></li>`;
    }).join("")}</ul><p class="num-explain">${explain}</p>`;
  };
  const eraDots = () => `<ul class="num-dots">${Object.keys(S.eras).map((era) => {
    const [name, span] = eraParts(era), people = S.scholars.filter((s) => s.era === era);
    return `<li><button type="button" class="num-row num-dotrow" data-facet="era" data-value="${era}" aria-pressed="false">
      <span class="num-l">${esc(name)} <small>${esc(span)}</small></span><span class="num-n"><b>${people.length}</b></span>
      <span class="num-dotset">${people.map((s) => `<i data-id="${s.id}" style="--tone: var(${IX.TONE[s.field]})" title="${esc(s.short)}"></i>`).join("")}</span></button></li>`;
  }).join("")}</ul><p class="num-explain">One dot per scholar, coloured by field and placed in the age they were born. Click an age to filter.</p>`;
  const used = () => {
    const live = S.scholars.filter((s) => s.site?.status === "in-use").length, held = S.scholars.filter((s) => s.site?.status === "held").length;
    return `<button type="button" class="num-row num-site" data-used aria-pressed="false">
        <span class="num-big"><b>${live}</b><span>of ${S.scholars.length} are used live on this site</span></span>
        <span class="num-grid">${S.scholars.map((s) => `<i class="${s.site?.status || "none"}" data-id="${s.id}" title="${esc(s.short)}"></i>`).join("")}</span>
        <span class="num-key"><span><i class="in-use"></i>Used live ${live}</span><span><i class="held"></i>In the library ${held}</span><span><i class="none"></i>Not yet ${S.scholars.length - live - held}</span></span>
      </button><p class="num-explain">One square per scholar. Click to show only the ones this site uses.</p>`;
  };

  function mount(section) {
    root = section;
    section.innerHTML = `<header class="ix-head"><p class="kicker">03 · By the numbers</p><h2>The index, <em>counted</em></h2>
        <p>How the thirty-five fall by field, age and faith. Every bar is also a filter: click one to narrow the catalogue above.</p></header>
      <div class="num-strip">
        <div class="num-card"><h3>By field</h3>${bars("field", S.fields, "Scholars in each field. The darker part is how many the catalogue is showing now.")}</div>
        <div class="num-card"><h3>By age</h3>${eraDots()}</div>
        <div class="num-card"><h3>By faith</h3>${bars("faith", S.faiths, "Every scholar is labelled for what they were, Christian or not.")}</div>
        <div class="num-card"><h3>On this site</h3>${used()}</div>
      </div>`;
    section.addEventListener("click", (event) => {
      const row = event.target.closest(".num-row");
      if (!row) return;
      if (row.hasAttribute("data-used")) IX.gallery.setUsed(!IX.gallery.state.used);
      else IX.gallery.toggle(row.dataset.facet, row.dataset.value);
      IX.gallery.reveal();
    });
  }

  // Repaint the "showing now" parts whenever the catalogue changes. Widths only; no rebuild.
  on("filter", (state) => {
    if (!root) return;
    const shown = new Set(state.visible);
    for (const row of root.querySelectorAll(".num-bars .num-row")) {
      const { facet, value } = row.dataset;
      const total = count(facet, value), now = S.scholars.filter((s) => s[facet] === value && shown.has(s.id)).length;
      row.querySelector("b").style.transform = `scaleX(${total ? now / total : 0})`;
      row.querySelector(".num-n").innerHTML = now === total ? `<b>${total}</b>` : `<b>${now}</b> of ${total}`;
      row.setAttribute("aria-pressed", String(state[facet].has(value)));
    }
    for (const row of root.querySelectorAll(".num-dotrow")) row.setAttribute("aria-pressed", String(state.era.has(row.dataset.value)));
    for (const dot of root.querySelectorAll("[data-id]")) dot.classList.toggle("off", !shown.has(dot.dataset.id));
    root.querySelector(".num-site").setAttribute("aria-pressed", String(state.used));
  });
  return { mount };
})();
