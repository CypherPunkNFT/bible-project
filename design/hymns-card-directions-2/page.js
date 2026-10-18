// Hymns card · six directions at real size. Each direction is a copy of the site's real Living the Christian Life section
// (captured in section.js, styled by the site's own rules in live-section.css), with only the Hymns card's drawing
// replaced. The Hymns card takes the Topics card's box (study-wide), so both cards have the same size and dimensions.
(() => {
  const { esc } = HC;
  const main = Frame.mount();
  document.querySelectorAll(".site-header .nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "/study"));
  // The live site's header has no Atlas link (Atlas moved under Study); the borrowed frame still draws one.
  document.querySelectorAll('.site-header .nav a[href*="atlas"]').forEach((a) => a.remove());
  main.innerHTML = `<div class="m2-head"><a href="/mockups/">← All mock-ups</a>
      <h1>The Hymns card, <em>at real size</em></h1>
      <p>The same six drawings as the first Hymns card page, each placed in a copy of the real Study section beside the real
      Topics card, at the site's own sizes. Only the Hymns drawing changes from one to the next.</p></div>
    <div class="study-experience"><div class="branch" id="m2-list"></div></div>`;
  const list = document.getElementById("m2-list");

  CARD_ART.forEach((d, i) => {
    const wrap = document.createElement("div");
    wrap.id = d.id;
    wrap.innerHTML = `<div class="m2-label"><b>${String(i + 1).padStart(2, "0")}</b><div><strong>${esc(d.label)}</strong><span>${esc(d.idea)}</span></div></div>${LIVE_SECTION}`;
    const section = wrap.querySelector(".subject-collection");
    // A crop of the real section: its heading and the two cards; the list of links below them is left out.
    section.querySelectorAll(".theology-topic-links, .support-links").forEach((el) => el.remove());
    // Ids must stay unique with six copies on one page.
    section.querySelectorAll("[id]").forEach((el) => { el.id = `${el.id}-${d.id}`; });
    section.id = `section-${d.id}`;
    section.querySelectorAll("[aria-labelledby]").forEach((el) => el.setAttribute("aria-labelledby", `${el.getAttribute("aria-labelledby")}-${d.id}`));
    const card = section.querySelector(".study-hymns-resource");
    if (!card) throw new Error(`hymns card 2: the captured section has no Hymns card (.study-hymns-resource); recapture section.js`);
    card.classList.add("study-wide");
    const art = card.querySelector(".study-art");
    art.className = `study-art art art-${d.id}`;
    art.innerHTML = d.art();
    list.append(wrap);
    Promise.resolve(d.start(wrap)).catch((error) => console.error(`hymns card 2: direction "${d.id}" stopped`, error));
  });
})();
