// Page assembly: the site frame, the introduction and figures, then the four sections in order of importance.
(() => {
  const main = Frame.mount();
  const P = R.people;
  const works = P.reduce((s, p) => s + p.works, 0), sermons = P.reduce((s, p) => s + (p.genres.sermon ?? 0), 0);
  const living = P.filter((p) => !p.died).length;

  const head = (n, tone, kicker, title, lead) => `<header class="part-head" style="--tone:var(${tone})">
      <span class="part-num">${n}</span><div><p class="kicker">${kicker}</p><h2>${title}</h2><p>${lead}</p></div></header>`;

  main.innerHTML = `<div class="wrap">
    <header class="intro">
      <div class="intro-copy">
        <p class="kicker">Preachers and writers in the library</p>
        <h1>Forty-seven voices. <em>One library.</em></h1>
        <p>The pastors, teachers and missionaries whose sermons and books are in the library, from Bullinger in Zürich to preachers still
          living today. Rearrange them to see when they lived, which family of churches they belonged to, what they left and who knew whom.</p>
      </div>
      <dl class="figures">
        <div><dt>People</dt><dd>${P.length}</dd></div>
        <div><dt>Their works in the library</dt><dd>${formatNumber(works)}</dd></div>
        <div><dt>Of which sermons</dt><dd>${formatNumber(sermons)}</dd></div>
        <div><dt>Born</dt><dd>${P[0].born}–${P[P.length - 1].born}</dd></div>
      </dl>
    </header>

    <section class="part hero-part" id="arrange">
      ${head("01", "--accent", `One set of people · five arrangements`, "Rearrange the forty-seven", `Every tile is one person, coloured by family of churches. Choose a question and they move to answer it. ${living} are still living.`)}
      <div id="stage-host"></div>
      <ul class="legend">${FAMILIES.map((f) => `<li><i style="background:var(${f.tone})"></i>${f.label}</li>`).join("")}</ul>
    </section>

    <section class="part" id="works">
      ${head("02", "--epistles", "Five centuries of books", "Their best-known works, in order", "The titles each person is best remembered for, from the 1540s to today. Each card says whether the library already holds it.")}
      <div id="works-host"></div>
    </section>

    <section class="part" id="same-year">
      ${head("03", "--poetry", "Side by side", "Same year, different worlds", "Pick a year to see who was alive and where each of them was living.")}
      <div id="year-host"></div>
    </section>

    <section class="part part-small" id="directory">
      ${head("04", "--prophets", "Everyone, A to Z", "Directory", "All 47 by surname. Choose a name to open the profile.")}
      <div id="dir-host"></div>
    </section>
  </div>`;

  Stage.mount(document.getElementById("stage-host"));
  WorksTimeline.mount(document.getElementById("works-host"));
  SameYear.mount(document.getElementById("year-host"));
  Directory.mount(document.getElementById("dir-host"));
  Drawer.mount();
})();
