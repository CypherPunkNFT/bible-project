// The combined Scholars page (the Scholars side of Teachers): the site frame, the two-sided switch, then each section in
// the owner's order. Every section lives in its own file and registers Sections.<key> = { mount(sectionElement) };
// one failing section never stops the others.
window.Sections = window.Sections || {};
(() => {
  const ORDER = [
    ["landing", "Scholars"],
    ["catalogue", "The catalogue"],
    ["built", "Built on their work"],
    ["discoveries", "The discoveries"],
    ["fields", "Five ways to study the Bible"],
    ["named", "Where the site names them"],
    ["numbers", "By the numbers"],
    ["directory", "All the scholars"],
  ];
  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap s-page";
  main.append(wrap);
  wrap.insertAdjacentHTML("afterbegin", Sides.html("scholars", { preachers: "../../authors-directions/teachers/", scholars: "#" }));
  for (const [key, title] of ORDER) {
    const section = document.createElement("section");
    section.id = key;
    section.className = `s-sec s-sec-${key}`;
    section.setAttribute("aria-label", title);
    wrap.append(section);
    try {
      if (!Sections[key]) throw new Error(`section "${key}" did not register (expected ${key}.js to set Sections.${key})`);
      Sections[key].mount(section);
    } catch (error) {
      console.error(`Scholars page: the "${title}" section failed to draw`, error);
      section.innerHTML = `<p class="s-failed">This section could not be drawn.</p>`;
    }
  }
})();
