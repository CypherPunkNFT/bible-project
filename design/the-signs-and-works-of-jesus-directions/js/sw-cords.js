// Section 01. One cord per account, one touching length per verse, all to one scale. A sticky readout, a lens over the kinds, and the sheet that lists an account verse by verse.
(() => {
  if (!window.SWK) return;
  const { h, runs, refLink, page, sectionHead, verseLabel, verseKey, kindIds } = SWK;
  const { study, accounts, kinds } = window.SW;
  const kindWord = (id) => kindIds.get(id).short;

  // A cord drawn with no buttons, for a reading's opening. The words beside it say what it shows.
  SWK.cordStill = (account) => h("span", { class: "sw-cord-still", "aria-hidden": "true" }, account.verses.map((verse) => h("span", { class: `sw-v sw-k-${verse.k}` }, h("span", { class: "sw-v-mark" }))));
  const tallyLine = (account) => `${account.tally.before} before · ${account.tally.deed} the deed · ${account.tally.after} after`;
  SWK.tallyLine = tallyLine;

  const legendItem = (kind) => h("span", { class: "sw-legend-item" }, h("span", { class: `sw-v sw-k-${kind.id}`, "aria-hidden": "true" }, h("span", { class: "sw-v-mark" })), kind.short);

  // The sticky readout. Pointer or focus fills it; on a touch screen the first tap fills it and it offers the way into the account.
  const readout = h("div", { class: "sw-readout", "aria-live": "polite" });
  const blank = () => readout.replaceChildren(h("p", { class: "sw-readout-idle" }, "Point at a verse, tap it or move to it with the arrow keys, and it appears here."));
  blank();
  const touchOnly = matchMedia("(hover: none)");
  function fillReadout(account, verse, button) {
    const open = h("button", { type: "button", class: "sw-readout-open", "data-mark": "open", onclick: (event) => SWK.openAccount(account.id, verseKey(verse), button ?? event.currentTarget) }, "Open the whole account →");
    readout.replaceChildren(
      h("p", { class: "sw-readout-head" }, h("strong", {}, verseLabel(account, verse)), ` · ${account.name} · ${kindWord(verse.k)}`),
      h("p", { class: "sw-readout-text" }, verse.t),
      open);
  }

  const threads = [];
  function verseButton(account, verse) {
    return h("button", {
      type: "button", class: `sw-v sw-k-${verse.k}`, "data-mark": verse.k, "data-account": account.id, "data-verse": verseKey(verse),
      "aria-label": `${verseLabel(account, verse)}, ${kindWord(verse.k)}`,
      onmouseenter: () => fillReadout(account, verse, null),
      onfocus: () => fillReadout(account, verse, null),
      onclick: (event) => {
        if (touchOnly.matches && !event.currentTarget.classList.contains("is-read")) {
          document.querySelectorAll(".sw-v.is-read").forEach((other) => other.classList.remove("is-read"));
          event.currentTarget.classList.add("is-read");
          fillReadout(account, verse, event.currentTarget);
          return;
        }
        SWK.openAccount(account.id, verseKey(verse), event.currentTarget);
      },
    }, h("span", { class: "sw-v-mark" }));
  }
  function threadRow(account) {
    const buttons = account.verses.map((verse) => verseButton(account, verse));
    threads.push(buttons);
    return h("li", { class: "sw-thread" },
      h("div", { class: "sw-thread-head" },
        h("button", { type: "button", class: "sw-thread-name", "data-account": account.id, onclick: (event) => SWK.openAccount(account.id, null, event.currentTarget) }, account.name),
        h("span", { class: "sw-thread-ref" }, refLinkOnBand(account)),
        h("span", { class: "sw-thread-tally" }, tallyLine(account))),
      h("div", { class: "sw-cord-line", role: "group", "aria-label": `${account.name}, ${account.label}: ${account.verses.length} verses, ${tallyLine(account)}` }, buttons));
  }
  const refLinkOnBand = (account) => refLink(account.read, account.label);

  // One tab stop for each cord: Left and Right walk the cord, Up and Down move between cords at the same place.
  function wireKeys() {
    threads.forEach((buttons, row) => {
      buttons.forEach((button, index) => {
        button.tabIndex = index === 0 ? 0 : -1;
        button.addEventListener("focus", () => buttons.forEach((b) => { b.tabIndex = b === button ? 0 : -1; }));
        button.addEventListener("keydown", (event) => {
          let target = null;
          if (event.key === "ArrowRight") target = buttons[index + 1];
          if (event.key === "ArrowLeft") target = buttons[index - 1];
          if (event.key === "Home") target = buttons[0];
          if (event.key === "End") target = buttons[buttons.length - 1];
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const other = threads[row + (event.key === "ArrowDown" ? 1 : -1)];
            if (other) target = other[Math.min(index, other.length - 1)];
          }
          if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) event.preventDefault();
          target?.focus();
        });
      });
    });
  }

  // The lens: one kind stays full and the rest go faint, and the words say what the lens shows.
  const lensText = h("p", { class: "sw-lens-text" });
  const lensButton = (id, label) => h("button", { type: "button", class: "sw-lens-button", "data-lens": id, "aria-pressed": "false", onclick: () => { SWK.setView({ lens: id }); syncLens(); } }, label);
  const lensButtons = [lensButton("", "All"), ...kinds.map((kind) => lensButton(kind.id, kind.name))];
  const band = h("div", { class: "sw-band" });
  function syncLens() {
    const lens = SWK.state.lens;
    band.dataset.lens = lens;
    for (const button of lensButtons) button.setAttribute("aria-pressed", String(button.dataset.lens === lens));
    lensText.replaceChildren(...(lens ? runs(kindIds.get(lens).lens) : runs(study.threadReads)));
  }
  band.append(
    h("div", { class: "sw-lens", role: "group", "aria-label": "Choose a kind of verse to see where it falls" }, lensButtons),
    h("div", { class: "sw-legend" }, kinds.map(legendItem)),
    readout,
    h("ol", { class: "sw-threads" }, accounts.map(threadRow)));
  wireKeys();
  syncLens();
  SWK.syncers.push(syncLens);

  // The sheet's list of every verse, with the chosen one marked in words as well as by its border.
  SWK.drawAccount = (body, account, chosen) => {
    body.replaceChildren(
      h("p", { class: "sw-small" }, "The whole account"),
      h("h3", { tabindex: "-1" }, account.name),
      h("p", { class: "sw-sheet-ref" }, refLink(account.read, account.label), ` · ${account.verses.length} verses · ${tallyLine(account)}`),
      h("p", { class: "sw-note" }, "Each verse is sorted by what it mostly does. That sorting is this study's reading."),
      h("ol", { class: "sw-verse-list" }, account.verses.map((verse) => {
        const isChosen = verseKey(verse) === chosen;
        return h("li", { class: `sw-verse${isChosen ? " is-chosen" : ""}`, "aria-current": isChosen ? "true" : null },
          h("span", { class: "sw-verse-tag" }, h("span", { class: `sw-v sw-k-${verse.k}`, "aria-hidden": "true" }, h("span", { class: "sw-v-mark" })), isChosen ? `${kindWord(verse.k)} · the verse you chose` : kindWord(verse.k)),
          h("p", {}, h("sup", {}, String(verse.v)), verse.t));
      })),
      h("p", { class: "sw-sheet-links" }, h("a", { href: `/read/bsb/${account.code}/${account.verses[0].c}` }, `Open ${account.label.replace(/ \d+:.*/, "")} ${account.verses[0].c} in the reader →`)));
  };

  page.append(h("section", { class: "t-sec sw-cords", id: "cords" },
    sectionHead("01", "Where the deed falls,", "and what stands around it", runs(study.threadLead)),
    band,
    h("p", { class: "sw-reads" }, lensText),
    h("div", { class: "sw-flag sw-flag-care" }, h("p", { class: "sw-flag-label" }, "How the verses were sorted"), h("p", {}, runs(study.threadCare))),
    h("div", { id: "try-holder" })));
})();
