// Foundations: the Scholars side of the Teachers page, starting from this site. The frame, a short opening, then each
// section in order; one failing section never stops the others.
(() => {
  const { D, esc } = Sc;
  const ORDER = [["flow", "Built on their work"], ["named", "Where the site names them"], ["fields", "Five ways to study the Bible"], ["directory", "All the scholars"]];

  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap sc-page";
  main.append(wrap);

  const inUse = D.scholars.filter((s) => s.site?.status === "in-use").length;
  const held = D.scholars.filter((s) => s.site?.status === "held").length;
  const first = D.scholars[0], last = D.scholars.reduce((a, b) => (b.died > a.died ? b : a));
  const figures = [
    ["Scholars", D.scholars.length, `lived between ${first.circa ? "c. " : ""}${first.born} and ${last.died}`],
    ["In use", inUse, "behind live features"],
    ["In the library", held, "planned for features"],
    ["Fields", Object.keys(D.fields).length, "ways of studying"],
  ];
  wrap.insertAdjacentHTML("beforeend", `${Sides.html("scholars")}
    <section class="sc-intro" aria-label="Scholars">
      <div class="sc-intro-text">
        <p class="kicker sc-intro-kicker">Scholars behind the site</p>
        <h1>You have been reading<br><em>their work</em> all&nbsp;along.</h1>
        <p class="sc-lead">The Topics pages, the Gospel harmony, the miracles and the Letters study all stand on books by scholars of the past.
          Follow each feature back to the book and the person behind it, then meet all ${D.scholars.length}: historians, translators, archaeologists,
          theologians and makers of reference books, Christian or not, each labelled for what they were.</p>
      </div>
      <dl class="sc-figs">${figures.map(([label, value, note]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd><small>${esc(note)}</small></div>`).join("")}</dl>
    </section>`);

  ORDER.forEach(([key, title]) => {
    const section = document.createElement("section");
    section.id = key;
    section.className = `sc-sec sc-sec-${key}`;
    section.setAttribute("aria-label", title);
    wrap.append(section);
    try {
      if (!Sections[key]) throw new Error(`section "${key}" did not register (expected ${key}.js to set Sections.${key})`);
      Sections[key].mount(section);
    } catch (error) {
      console.error(`Scholars page: the "${title}" section failed to draw`, error);
      section.innerHTML = `<p class="sc-failed">This section could not be drawn.</p>`;
    }
  });
})();
