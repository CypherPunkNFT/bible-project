// Direction D, four biblical scenes in a 2 × 2 grid (owner, 2026-10-20). Each card shows the drawing as it would sit
// beside the contact form, the heading it would carry, and its verse; "Open the full page" shows it in place (../lamp/?v=).
(() => {
  const main = ContactMock.mount("lamp");
  const cards = Object.entries(LAMP_SCENES).map(([key, scene]) => `<article class="lv-card">
      <figure class="lp-scene lv-scene">${scene.draw()}</figure>
      <div class="lv-copy">
        <p class="lv-label"><span>${scene.numeral}</span>${scene.title}</p>
        <h2>${scene.h1}</h2>
        <p class="lv-line">${scene.line}</p>
        <blockquote>“${scene.verse}”<cite>${scene.ref} · KJV</cite></blockquote>
        <a class="lv-open" href="../lamp/?v=${key}">Open the full page<span>${icon("arrowRight", 15)}</span></a>
      </div>
    </article>`).join("");

  main.insertAdjacentHTML("beforeend", `<div class="lv">
    <header class="lv-head">
      <p class="lp-eyebrow">D · The lamp in the window · four scenes</p>
      <h1>A light in the dark,<em>four times in Scripture.</em></h1>
      <p>The same page each time: the contact form beside a night drawing that loops slowly, then the work, the builder and the
        reason. Only the scene, its heading and its verse change.</p>
    </header>
    <div class="lv-grid">${cards}</div>
  </div>`);
})();
