// "One text, many voices": the chapters the most different people took as a main text. Choosing one fans out a card
// per person (their count and any titles on this page) and marks where in the chapter each titled sermon starts.
PB.mountVoices = (root) => {
  const { chapterName, readHref, escapeHtml: esc, plural, verseOf } = PB;
  const picks = PB.cells.filter((c) => c.voices >= 3).sort((a, b) => b.voices - a.voices || b.total - a.total || a.i - b.i);
  let chosen = picks[0];

  const dots = (cell) => Object.keys(cell.counts).map((id) => `<i style="background: var(${familyOf(personById(id)).tone})"></i>`).join("");
  root.innerHTML = `
    <p class="section-line">${picks.length} chapters have works by three or more different people in the library. The dots are the people, coloured by their church family.</p>
    <div class="pick-strip" role="listbox" aria-label="Chapters">${picks.map((c) => `<button type="button" class="pick" role="option" data-pick="${c.i}" aria-selected="${c === chosen}">
      <b>${chapterName(c)}</b><span class="pick-dots">${dots(c)}</span><small>${c.voices} people · ${plural(c.total, "work")}</small></button>`).join("")}</div>
    <div class="verse-panel"><div class="verse-head"><h3 id="voices-title"></h3><a class="read-link small" id="voices-read" href="#">${icon("book", 14)}<span></span>${icon("arrowRight", 14)}</a></div>
      <div class="verse-rule-box"><svg id="verse-rule" viewBox="0 0 1000 64" preserveAspectRatio="none" aria-hidden="true"></svg><div class="verse-dots" id="verse-dots"></div><div class="verse-labels" id="verse-labels"></div></div>
      <p class="caption" id="verse-caption"></p></div>
    <div class="voice-stage" id="voice-stage"></div>`;

  const stage = root.querySelector("#voice-stage");

  function titlesFor(cell, personId) {
    return (PB.titles.get(cell.key) ?? []).filter(({ person }) => person.id === personId).map(({ sermon }) => sermon);
  }

  // A ruler for the chapter's verses, with a dot where each titled sermon's text begins.
  function drawRule(cell) {
    const svg = root.querySelector("#verse-rule");
    const x = (verse) => 12 + ((verse - 1) / Math.max(1, cell.verses - 1)) * 976;
    const ticks = Array.from({ length: cell.verses }, (_, i) => `<line x1="${x(i + 1)}" x2="${x(i + 1)}" y1="52" y2="${(i + 1) % 5 === 0 ? 44 : 48}" stroke="var(--line)" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`).join("");
    const stacks = {};
    const marks = (PB.titles.get(cell.key) ?? []).map(({ person, sermon }) => {
      const verse = verseOf(sermon.v), level = (stacks[verse] = (stacks[verse] ?? 0) + 1) - 1;
      return `<i style="left: ${(x(verse) / 10).toFixed(2)}%; top: ${32 - Math.min(level, 5) * 8}px; background: var(${familyOf(person).tone})" title="${esc(person.short)}: ${esc(sermon.t)} (${esc(sermon.r)})"></i>`;
    }).join("");
    svg.innerHTML = `<line x1="12" x2="988" y1="52" y2="52" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>${ticks}`;
    root.querySelector("#verse-dots").innerHTML = marks;
    // Verse numbers as HTML so they do not stretch with the ruler.
    const marksAt = [1, ...Array.from({ length: Math.floor(cell.verses / 5) }, (_, i) => (i + 1) * 5)].filter((v) => v <= cell.verses && (cell.verses - v >= 3 || v === 1));
    if (cell.verses > 1) marksAt.push(cell.verses);
    root.querySelector("#verse-labels").innerHTML = marksAt.map((v) => `<span style="left: ${(x(v) / 10).toFixed(2)}%">${v}</span>`).join("");
    const titled = (PB.titles.get(cell.key) ?? []).length;
    root.querySelector("#verse-caption").textContent = titled
      ? `Each dot is a titled sermon on this page, placed at the verse its text begins. ${cell.total - titled > 0 ? `${plural(cell.total - titled, "other work")} on this chapter ${cell.total - titled === 1 ? "has" : "have"} no title here, so no dot.` : ""}`
      : "None of the works on this chapter have a title on this page, so there are no dots.";
  }

  function cardHtml(cell, id, count) {
    const person = personById(id);
    const list = titlesFor(cell, id);
    const shown = list.slice(0, 4);
    return `<article class="voice-card" style="--tone: var(${familyOf(person).tone})">
      <div class="voice-top"><button type="button" class="name-btn" data-person="${id}">${esc(person.name)}</button><span>${PB.years(person)}</span></div>
      <p class="voice-count"><b>${count}</b>${count === 1 ? "work" : "works"} on ${chapterName(cell)}</p>
      ${shown.length ? `<ul>${shown.map((s) => `<li><span>${esc(s.t)}</span><small>${esc(s.r)}${s.d ? ` · ${s.d.slice(0, 4)}` : ""}</small></li>`).join("")}</ul>`
        : `<p class="voice-empty">No titles on this page: ${id === PB.SPURGEON ? "these are not listed as sermons in the library" : person.sermons.length ? `they are not among the first ${person.sermons.length} of their sermons listed here` : "none of their works on it are listed as sermons in the library"}.</p>`}
      ${list.length > shown.length ? `<p class="voice-more">and ${plural(list.length - shown.length, "more")}</p>` : ""}
    </article>`;
  }

  function choose(cell, animate) {
    chosen = cell;
    for (const b of root.querySelectorAll("[data-pick]")) b.setAttribute("aria-selected", String(Number(b.dataset.pick) === cell.i));
    root.querySelector("#voices-title").innerHTML = `${chapterName(cell)} <small>${cell.verses} verses · ${cell.voices} people</small>`;
    const read = root.querySelector("#voices-read");
    read.href = readHref(cell); read.querySelector("span").textContent = `Read ${chapterName(cell)}`;
    drawRule(cell);
    const entries = Object.entries(cell.counts).sort((a, b) => personById(a[0]).born - personById(b[0]).born);
    stage.innerHTML = entries.map(([id, count]) => cardHtml(cell, id, count)).join("");
    stage.dataset.count = String(entries.length);
    if (animate && !PB.reducedMotion()) fanIn();
  }

  // Cards arrive from one point above the stage, fanned like a hand of cards, then settle into place one by one.
  function fanIn() {
    const cards = [...stage.children];
    const stageBox = stage.getBoundingClientRect();
    const middle = (cards.length - 1) / 2;
    cards.forEach((card, i) => {
      const box = card.getBoundingClientRect();
      const dx = stageBox.left + stageBox.width / 2 - (box.left + box.width / 2);
      card.animate([
        { transform: `translate(${dx * 0.75}px, -36px) rotate(${(i - middle) * 7}deg) scale(.9)`, opacity: 0 },
        { transform: `translate(${dx * 0.2}px, -8px) rotate(${(i - middle) * 2}deg) scale(.98)`, opacity: 1, offset: 0.6 },
        { transform: "none", opacity: 1 },
      ], { duration: 620, delay: i * 70, easing: "cubic-bezier(.16, 1, .3, 1)", fill: "backwards" });
    });
  }

  root.addEventListener("click", (event) => {
    const pick = event.target.closest("[data-pick]");
    if (!pick) return;
    const cell = PB.cells[Number(pick.dataset.pick)];
    if (cell !== chosen) choose(cell, true);
  });
  choose(chosen, false);
};
