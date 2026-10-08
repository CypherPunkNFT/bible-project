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
  // The owner asked to try a different place for the section number in each section (2026-10-08), so they can pick one.
  // Every section writes the same heading (<header class="t-head"><span class="t-num">NN</span><div>kicker, h2, line</div>);
  // this moves the number into that section's variant. teachers.css styles each variant (.t-v-*).
  const NUMBER_STYLES = {
    bible: "sup",        // a small raised number after the title
    through: "pill",     // a filled pill before the kicker
    cities: "corner",    // a large pale numeral in the empty space to the right of the title
    lives: "kicker",     // in line with the kicker, above the title
    crossing: "ring",    // a small ring before the kicker
    handed: "rule",      // sitting on the section's top rule, like a tab
    sameyear: "ledger",  // at the end of the kicker row, joined by a hairline
    directory: "count",  // "08 / 08" in the top-right corner
  };
  function placeNumber(section, key) {
    const head = section.querySelector(".t-head"), num = head?.querySelector(".t-num");
    const style = NUMBER_STYLES[key];
    if (!head || !num || !style) return;
    const kicker = head.querySelector(".kicker"), title = head.querySelector("h2");
    head.classList.add("t-v", `t-v-${style}`);
    if (style === "sup") title.append(num);
    else if (style === "pill" || style === "kicker" || style === "ring") kicker.prepend(num);
    else if (style === "ledger") kicker.append(Object.assign(document.createElement("span"), { className: "t-fill" }), num);
    else if (style === "rule") section.prepend(num);
    else if (style === "count") num.textContent = `${num.textContent} / ${String(Object.keys(NUMBER_STYLES).length).padStart(2, "0")}`;
  }

  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap t-page";
  main.append(wrap);
  // The two sides of the Teachers page; Scholars is still being designed, so it opens the four Scholars directions.
  if (window.Sides) wrap.insertAdjacentHTML("afterbegin", Sides.html("preachers", { preachers: "#", scholars: "../../scholars-directions/scholars/" }));
  for (const [key, title] of ORDER) {
    const section = document.createElement("section");
    section.id = key;
    section.className = `t-sec t-sec-${key}`;
    section.setAttribute("aria-label", title);
    wrap.append(section);
    try {
      if (!Sections[key]) throw new Error(`section "${key}" did not register (expected ${key}.js to set Sections.${key})`);
      Sections[key].mount(section);
      placeNumber(section, key);
    } catch (error) {
      console.error(`Teachers page: the "${title}" section failed to draw`, error);
      section.innerHTML = `<p class="t-failed">This section could not be drawn.</p>`;
    }
  }
})();
