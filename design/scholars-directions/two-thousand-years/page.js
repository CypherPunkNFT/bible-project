// The page: the site frame, the switch between the two sides of Teachers, the headline, then the sections in order of
// importance — the timeline (main event), the chain of hands, gaps and crowds, and the directory. One failing section
// never stops the others.
(() => {
  const { scholars, fields, fmt, esc } = { ...Yrs, fields: Yrs.D.fields };
  const ORDER = [["timeline", "Two thousand years of scholars"], ["chain", "How the text reached you"], ["gaps", "Gaps and crowds"], ["directory", "Every scholar"]];

  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap yr-page";
  main.append(wrap);

  const first = scholars.reduce((a, s) => (s.born < a.born ? s : a)), last = scholars.reduce((a, s) => (s.died > a.died ? s : a));
  const inUse = scholars.filter((s) => s.site?.status === "in-use").length, held = scholars.filter((s) => s.site?.status === "held").length;
  const figs = [["Scholars", scholars.length, `in ${Object.keys(fields).length} fields of study`], ["Years", fmt(last.died - first.born), `from ${first.short} to ${last.short}`],
    ["On this site", inUse, "power live features"], ["In the library", held, "held for planned features"]];
  wrap.insertAdjacentHTML("beforeend", `${Sides.html("scholars")}
    <header class="yr-hero">
      <div><p class="kicker yr-kicker">Scholars of the Bible</p>
        <h1>Two thousand years of <em>looking closely.</em></h1>
        <p class="yr-lead">Historians, translators, archaeologists, theologians and the makers of reference books, from ${esc(first.short)} in ${esc(first.place[0])} to ${esc(last.short)} in ${esc(last.place[0])}. Christian or not, each is labelled for what they were, and several of their books power this site.</p></div>
      <dl class="yr-figs">${figs.map(([label, value, note]) => `<div><dt>${label}</dt><dd>${value}</dd><small>${esc(note)}</small></div>`).join("")}</dl>
    </header>`);

  for (const [key, title] of ORDER) {
    const section = document.createElement("section");
    section.id = key;
    section.className = `yr-sec yr-sec-${key}`;
    section.setAttribute("aria-label", title);
    wrap.append(section);
    try {
      if (!Yrs.sections[key]) throw new Error(`section "${key}" did not register (expected ${key}.js to set Yrs.sections.${key})`);
      Yrs.sections[key].mount(section);
    } catch (error) {
      console.error(`Two thousand years: the "${title}" section failed to draw`, error);
      section.innerHTML = `<p class="yr-failed">This section could not be drawn.</p>`;
    }
  }
})();
