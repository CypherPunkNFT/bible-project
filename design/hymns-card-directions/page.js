// Hymns card · six directions, two across and three down. Each is the live Study card (eyebrow, art, title,
// description, source) with a new drawing, and the shorter description running the card's full width.
(() => {
  const { H, fmt, esc } = HC;
  const DESCRIPTION = `${fmt(H.counts.distinct)} hymns by Isaac Watts, John Newton and William Cowper, each beside the chapter it was written on. Begin with Amazing Grace and every verse its lines echo.`;
  const SOURCE = "Watts, Newton & Cowper · CCEL & Project Gutenberg";

  const card = (direction) => `<div class="card"><a class="card-link" href="/study/hymns" aria-label="Hymns">
      <div class="card-top">The faith, sung</div>
      <div class="art art-${direction.id}">${direction.art()}</div>
      <div class="card-copy"><h2>Hymns</h2><p>${esc(DESCRIPTION)}</p>
        <div class="card-foot"><span>${esc(SOURCE)}</span><span class="card-open">${icon("arrowUp", 20)}</span></div></div>
    </a></div>`;

  const main = Frame.mount();
  document.querySelectorAll(".site-header .nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "/study"));
  main.innerHTML = `<a class="back" href="/mockups/">← All mock-ups</a>
    <div class="intro"><div><p class="eyebrow">Study · Living the Christian Life</p><h1>The Hymns card, <em>six ways</em></h1></div>
      <p>Six new drawings for the Hymns card under "Follow Christ. Live the Word." Each card keeps the site's card and now
      has a shorter description that runs the full width. Every number in the drawings comes from the hymn collection itself.</p></div>
    <ol class="directions">${CARD_ART.map((d, i) => `<li class="direction" id="${d.id}">
      <div class="direction-label"><b>${String(i + 1).padStart(2, "0")}</b><div><strong>${esc(d.label)}</strong><span>${esc(d.idea)}</span></div></div>
      ${card(d)}</li>`).join("")}</ol>`;

  CARD_ART.forEach((d) => {
    const root = document.getElementById(d.id);
    Promise.resolve(d.start(root)).catch((error) => console.error(`hymns card: direction "${d.id}" stopped`, error));
  });
})();
