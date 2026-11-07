// Section 01. Every meeting on one plate: who moved first, and the last thing the record says of the person. What you are carrying lights the meetings that held it; nothing is hidden.
// A meeting opens its record in the sheet. Every line is written under its drawing, so nothing depends on pointing.
(() => {
  if (!window.ENK) return;
  const { h, drawing, phrase, plain, runs, refLink, page, sectionHead, roving } = ENK;
  const { study, meetings, rows, columns, carry, numbers } = window.EN;
  const carriesTag = (meeting, tag) => meeting.carry.some((item) => item.id === tag);
  const columnTitle = new Map(columns.map((c) => [c.id, c.title]));
  const rowTitle = new Map(rows.map((r) => [r.id, r.title]));

  const readline = h("p", { class: "en-readline", "aria-hidden": "true" }, "Point at a meeting to read how it began and ended.");
  const describe = (m) => `${m.name}. ${rowTitle.get(m.row)}: “${m.first.t}” (${m.first.label}). ${columnTitle.get(m.column)}: “${m.end.t}” (${m.end.label}).`;
  const pointed = (m) => { readline.textContent = describe(m); };
  const mark = (m) => h("button", { type: "button", class: "en-meet", "data-meeting": m.id, "data-group": m.group, onclick: (event) => ENK.openMeeting(m.id, event.currentTarget), onmouseenter: () => pointed(m), onfocus: () => pointed(m), "aria-label": `${describe(m)} Open the record.` },
    drawing(m.art, "en-meet-art"),
    h("span", { class: "en-meet-text" },
      h("span", { class: "en-meet-name" }, m.name),
      h("span", { class: "en-meet-last" }, `“${m.end.t}”`),
      h("span", { class: "en-meet-col" }, columnTitle.get(m.column)),
      m.later.length ? h("span", { class: "en-meet-back" }, "Seen again") : null));

  const buttons = [];
  const grid = h("div", { class: "en-plate", role: "group", "aria-label": `All ${numbers.meetings} meetings, by who moved first and how the record ends` },
    h("span", { class: "en-corner", "aria-hidden": "true" }, "Who moved first ↓ · How the record ends →"),
    columns.map((column) => h("div", { class: "en-col-head" }, h("h3", {}, column.title), h("p", {}, column.note), h("span", { class: "en-tally" }, `${numbers.columns[column.id]} of ${numbers.meetings}`))),
    rows.map((row) => [
      h("div", { class: `en-row-head en-row-${row.id}` }, h("h3", {}, row.title), h("p", {}, row.note), h("span", { class: "en-tally" }, `${numbers.rows[row.id]} of ${numbers.meetings}`)),
      columns.map((column) => {
        const held = meetings.filter((m) => m.row === row.id && m.column === column.id).map((m) => { const button = mark(m); buttons.push(button); return button; });
        return h("div", { class: `en-cell en-row-${row.id}${held.length ? "" : " is-empty"}` }, held);
      }),
    ]));
  roving(buttons);

  const chips = carry.map((item) => h("button", { type: "button", class: "en-chip", "data-carry": item.id, "aria-pressed": "false", onclick: () => { ENK.setView({ carry: ENK.state.carry === item.id ? "" : item.id }); sync(); } },
    drawing(item.art, "en-chip-art"),
    h("span", { class: "en-chip-title" }, item.title),
    h("span", { class: "en-chip-count" }, `${numbers.carry[item.id]} meetings`)));
  const carryLine = h("p", { class: "en-carry-line", role: "status" });
  function sync() {
    const chosen = ENK.state.carry;
    chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.carry === chosen)));
    buttons.forEach((button) => {
      const meeting = ENK.meetingIds.get(button.dataset.meeting);
      button.classList.toggle("is-lit", Boolean(chosen) && carriesTag(meeting, chosen));
      button.classList.toggle("is-quiet", Boolean(chosen) && !carriesTag(meeting, chosen));
    });
    const lit = chosen ? meetings.filter((m) => carriesTag(m, chosen)) : [];
    carryLine.textContent = chosen ? `${ENK.carryIds.get(chosen).title}: ${lit.map((m) => m.name).join(" · ")}. Choose it again to clear.` : "";
  }
  ENK.syncers.push(sync);

  page.append(h("section", { class: "t-sec en-grid-sec", id: "meetings" },
    sectionHead("01", "Who moved first.", "Where the record stops.", runs(study.gridLead)),
    h("p", { class: "en-carry-lead" }, runs(study.carryLead)),
    h("div", { class: "en-chips", role: "group", "aria-label": "What you are carrying" }, chips),
    carryLine,
    grid,
    readline,
    h("p", { class: "en-reads" }, runs(study.gridReads)),
    h("p", { class: "en-note" }, runs(study.gridCare))));
  sync();

  const line = (label, content) => (content ? h("div", { class: "en-line" }, h("dt", {}, label), h("dd", {}, content)) : null);
  ENK.drawMeeting = (body, m) => {
    const reading = ENK.readings.get(m.group);
    body.replaceChildren(...[
      h("p", { class: "en-small" }, "A meeting"),
      drawing(m.art, "en-sheet-art"),
      h("h3", { tabindex: "-1" }, m.name),
      h("p", { class: "en-sheet-who" }, m.who, " · ", refLink(m.read, m.readLabel)),
      h("dl", { class: "en-record" }, [
        line(rowTitle.get(m.row), [phrase(m.first), m.alsoFirst ? [" and ", phrase(m.alsoFirst)] : null]),
        line("What is asked", m.asked ? phrase(m.asked) : "Nothing is asked of Him here."),
        line("What Jesus says", phrase(m.said)),
        line(columnTitle.get(m.column), phrase(m.end)),
        line("The record does not say", runs(m.unsaid)),
        line("What was at stake", m.carry.map((item) => h("span", { class: "en-stake" }, h("span", { class: "en-stake-kind" }, `${ENK.carryIds.get(item.id).title}: `), phrase(item)))),
        line("Seen again", m.later.length ? [m.later.map((item) => h("span", { class: "en-stake" }, phrase(item))), m.laterNote ? h("span", { class: "en-stake" }, runs(m.laterNote)) : null] : "Not seen again, as far as the record lets us tell."),
      ]),
      h("p", { class: "en-sheet-links" },
        h("a", { href: `?reading=${m.group}#readings`, onclick: (event) => { event.preventDefault(); ENK.showReading(m.group); } }, `Read it with the group: ${plain([reading.title])} →`),
        m.people.map(([name, slug]) => h("a", { href: `/people/${slug}` }, `${name} on the People page →`))),
      h("p", { class: "en-note" }, "Written by this site from Scripture. Which row and column it sits in is this study's reading. The script proves these words are in these verses, not that the reading is right."),
    ].filter(Boolean));
  };
})();
