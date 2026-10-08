// The combined Teachers page: the site frame, then each section in the owner's order. Every section lives in its own
// file and registers itself as Sections.<key> = { mount(sectionElement) }; one failing section never stops the others.
window.Sections = window.Sections || {};
(() => {
  const ORDER = [
    ["landing", "Teachers"],
    ["bible", "The whole Bible"],
    ["through", "Teachers through the Bible"],
    ["cities", "Cities that gathered them"],
    ["lives", "Who was alive at the same time"],
    ["crossing", "Did their lives cross?"],
    ["handed", "Who passed it to whom"],
    ["sameyear", "Same year, different worlds"],
    ["directory", "Everyone, by where they served"],
  ];
  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap t-page";
  main.append(wrap);
  for (const [key, title] of ORDER) {
    const section = document.createElement("section");
    section.id = key;
    section.className = `t-sec t-sec-${key}`;
    section.setAttribute("aria-label", title);
    wrap.append(section);
    try {
      if (!Sections[key]) throw new Error(`section "${key}" did not register (expected ${key}.js to set Sections.${key})`);
      Sections[key].mount(section);
    } catch (error) {
      console.error(`Teachers page: the "${title}" section failed to draw`, error);
      section.innerHTML = `<p class="t-failed">This section could not be drawn.</p>`;
    }
  }
})();
