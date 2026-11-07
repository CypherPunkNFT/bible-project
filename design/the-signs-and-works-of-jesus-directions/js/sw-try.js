// Inside section 01. Three accounts that are not on the cords, verses unmarked. The reader chooses, then asks to see this study's marks. No score, nothing kept, nothing in the address.
(() => {
  if (!window.SWK) return;
  const { h, runs, refLink, verseLabel, verseKey, kindIds } = SWK;
  const { study, tries } = window.SW;
  const holder = document.getElementById("try-holder");
  const tryView = (account) => {
    const picks = new Set();
    const tiles = account.verses.map((verse) => h("button", {
      type: "button", class: "sw-try-verse", "aria-pressed": "false",
      "aria-label": `${verseLabel(account, verse)}: ${verse.t}`,
      onclick: (event) => {
        const key = verseKey(verse);
        if (picks.has(key)) picks.delete(key); else picks.add(key);
        event.currentTarget.setAttribute("aria-pressed", String(picks.has(key)));
      },
    }, h("sup", {}, String(verse.v)), verse.t));
    const result = h("div", { class: "sw-try-result", hidden: true });
    const reveal = h("button", { type: "button", class: "sw-try-reveal", "aria-expanded": "false", onclick: (event) => {
      const open = result.hidden;
      result.hidden = !open;
      event.currentTarget.setAttribute("aria-expanded", String(open));
      event.currentTarget.textContent = open ? "Hide this study's marks" : "Show this study's marks";
      if (open) {
        result.replaceChildren(
          SWK.cordStill(account),
          h("ol", { class: "sw-try-marks" }, account.verses.map((verse) => h("li", {}, h("span", { class: `sw-v sw-k-${verse.k}`, "aria-hidden": "true" }, h("span", { class: "sw-v-mark" })), `${verse.v}: ${kindIds.get(verse.k).short}`))),
          h("p", { class: "sw-note" }, "This is one reading, not an answer key. If you marked differently, ask what each verse is doing."));
      }
    } }, "Show this study's marks");
    return h("section", { class: "sw-try-item" },
      h("h4", {}, account.name, " ", h("span", { class: "sw-at" }, refLink(account.read, account.label))),
      h("div", { class: "sw-try-verses" }, tiles),
      reveal, result);
  };
  holder.replaceWith(h("details", { class: "sw-try" },
    h("summary", {}, "Try it: find the deed in an unmarked account"),
    h("p", { class: "sw-try-lead" }, runs(study.tryLead)),
    h("div", { class: "sw-try-grid" }, tries.map(tryView))));
})();
