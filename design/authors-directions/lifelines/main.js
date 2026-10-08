// Authors · Lifelines: the page, top to bottom. Time is the spine; the first section is the main event.
(() => {
  const main = Frame.mount();
  const people = AUTHORS.people, first = people[0];
  const works = people.reduce((n, p) => n + p.works, 0);
  const centuries = ["", "One", "Two", "Three", "Four", "Five", "Six"][Math.floor((THIS_YEAR - first.born) / 100)] ?? "Five";
  const wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.innerHTML = `
    <section class="intro">
      <div><p class="kicker rule">The voices in the library</p>
        <h1>${centuries} centuries. <em>${people.length} lives.</em></h1>
        <p class="lede">The preachers and writers whose works are in the library, from the Reformation to today. Move through the years to see who was alive together, where they lived, and how the faith was handed from one to the next.</p></div>
      <dl class="figures">
        <div><dt>People</dt><dd>${people.length}</dd></div>
        <div><dt>Their works in the library</dt><dd>${formatNumber(works)}</dd></div>
        <div><dt>Years covered</dt><dd>${first.born}<small> to today</small></dd></div>
        <div><dt>Documented links</dt><dd>${AUTHORS.links.length}</dd></div>
      </dl>
    </section>`;
  main.append(wrap);
  for (const part of [Hero, Pair, Relay, Sundays, Directory]) {
    try { part.mount(wrap); } catch (error) { console.error("Authors page: a section failed to draw", error); }
  }
})();
