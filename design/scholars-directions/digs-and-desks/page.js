// Digs and desks: the page itself. The site frame, the switch between the two sides of Teachers, a short intro with four
// figures, then the four sections in order of importance.
(() => {
  const { S, esc } = DD;
  const main = Frame.mount();
  DD.defineLand();
  const used = S.scholars.filter((s) => s.site?.status === "in-use").length, held = S.scholars.filter((s) => s.site?.status === "held").length;
  const cities = new Set(S.scholars.map((s) => s.place[0])).size, finds = [...S.finds].sort((a, b) => a.year - b.year);
  const first = S.scholars[0], last = S.scholars.at(-1);
  main.innerHTML = `<div class="wrap dd-page">
    ${Sides.html("scholars")}
    <header class="dd-intro">
      <div><p class="kicker dd-intro-kicker">Scholars of the Bible's world</p>
        <h1>Where they dug, <em>where they wrote.</em></h1>
        <p class="dd-lead">Historians, translators, archaeologists and the makers of reference books, from ${esc(first.name)} to ${esc(last.name)}. Some were Christians, some were not; each is labelled for what they were. Start with what they found in the ground and in old libraries, then see where each of them worked.</p></div>
      <dl class="dd-figs">
        <div><dt>Scholars</dt><dd>${S.scholars.length}</dd><small>${esc(first.short)} to ${esc(last.short)}</small></div>
        <div><dt>Discoveries</dt><dd>${finds.length}</dd><small>${finds[0].year} to ${finds.at(-1).year}</small></div>
        <div><dt>Cities</dt><dd>${cities}</dd><small>where they worked</small></div>
        <div><dt>On this site</dt><dd>${used}</dd><small>used today, ${held} more in the library</small></div>
      </dl>
    </header>
    <div class="dd-sections"></div></div>`;
  const host = main.querySelector(".dd-sections");
  for (const [name, mount] of [["discoveries", DD.mountHero], ["where they worked", DD.mountWorked], ["from the dig", DD.mountLink], ["directory", DD.mountDirectory]]) {
    try { mount(host); } catch (error) {
      console.error(`Digs and desks: the ${name} section failed to draw`, error);
      host.insertAdjacentHTML("beforeend", `<p class="dd-failed">The ${esc(name)} section could not be drawn.</p>`);
    }
  }
  DD.mountDrawer();
})();
