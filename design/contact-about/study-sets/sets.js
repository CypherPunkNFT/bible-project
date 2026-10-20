// Twelve study-style contact themes in three sets of four (owner, 2026-10-20), each set a 2 × 2 grid. A card shows the
// hero as it would look (drawing, kicker, heading, caption); "Open the full page" shows the whole page (../study-style/?v=).
(() => {
  const main = ContactMock.mount("study-sets");
  const card = (theme) => `<article class="st-card">
      <figure class="ss-art st-art">${SS_ART[theme.key]()}</figure>
      <div class="st-copy">
        <p class="ss-kicker">${theme.kicker}</p>
        <h3>${theme.h1[0]}<em>${theme.h1[1]}</em></h3>
        <p class="st-cap"><b>${theme.cap[0]}</b> ${theme.cap[1]}</p>
        <a class="st-open" href="../study-style/?v=${theme.key}">Open the full page<span>${icon("arrowRight", 15)}</span></a>
      </div>
    </article>`;

  main.insertAdjacentHTML("beforeend", `<div class="st">
    <header class="st-head">
      <p class="ss-kicker">E · Study style · twelve themes</p>
      <h1>One page, in the manner<em>of the studies.</em></h1>
      <p>Built like Manuscripts, A passage through the manuscripts and The surviving witnesses: a large title, two short lines, one
        tilted drawing with its caption, a bar of figures, then two numbered sections, the project and the person who builds it.
        Only the hero changes from theme to theme.</p>
      <nav class="st-jump" aria-label="Sets">${SS_SETS.map((set) => `<a href="#set-${set.numeral}"><b>${set.numeral}</b>${set.title}</a>`).join("")}</nav>
    </header>
    ${SS_SETS.map((set) => `<section class="st-set" id="set-${set.numeral}">
      <header><p class="ss-eyebrow"><span>Set ${set.numeral}</span> · ${set.title}</p><p class="st-set-line">${set.line}</p></header>
      <div class="st-grid">${set.themes.map(card).join("")}</div>
    </section>`).join("")}
  </div>`);
})();
