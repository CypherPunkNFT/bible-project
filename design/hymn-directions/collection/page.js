// The Hymns collection page (/study/hymns): the site frame with Study selected, then each section in order. Each
// section lives in its own file and registers as Sections.<key>; one failing section never stops the others.
(() => {
  const ORDER = [["landing", "Hymns"], ["bible", "The whole Bible"], ["through", "Hymns through the Bible"], ["psalms", "Through the Psalms"], ["history", "Their history"], ["cards", "Every hymn · cards"], ["list", "Every hymn · list"]];
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  const header = Frame.header;
  Frame.header = function studyHeader() {
    return header().replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
      <span class="sep"`);
  };
  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap t-page";
  main.append(wrap);
  for (const [key, title] of ORDER) {
    const section = document.createElement("section");
    section.id = key;
    section.className = `t-sec t-sec-${key}${key === "cards" ? " hy-cat" : ""}`;
    section.setAttribute("aria-label", title);
    wrap.append(section);
    try {
      if (!Sections[key]) throw new Error(`section "${key}" did not register (expected ${key}.js to set Sections.${key})`);
      Sections[key].mount(section);
    } catch (error) {
      console.error(`Hymns page: the "${title}" section failed to draw`, error);
      section.innerHTML = `<p class="t-failed">This section could not be drawn.</p>`;
    }
  }
})();
