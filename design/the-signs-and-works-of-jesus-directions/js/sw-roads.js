// Section 03. What each account says people did next, in its own words, under three columns. "Not recorded" is said where the account gives nothing.
(() => {
  if (!window.SWK) return;
  const { h, phrase, page, sectionHead, runs, accountIds } = SWK;
  const { study, roadColumns, roads } = window.SW;
  const cell = (column, items) => h("div", { class: "sw-road-cell" },
    h("p", { class: "sw-road-label" }, column.name),
    items.length ? h("ul", {}, items.map((item) => h("li", {}, phrase(item)))) : h("p", { class: "sw-f-none" }, "Not recorded"));
  const row = (road) => {
    const account = accountIds.get(road.account);
    return h("li", { class: "sw-road" },
      h("p", { class: "sw-road-name" }, h("button", { type: "button", "data-account": account.id, onclick: (event) => SWK.openAccount(account.id, null, event.currentTarget) }, account.name)),
      roadColumns.map((column) => cell(column, road[column.id])));
  };
  page.append(h("section", { class: "t-sec sw-roads", id: "responses" },
    sectionHead("03", "The same deed.", "Not the same response.", runs(study.roadsLead)),
    h("div", { class: "sw-road-head", "aria-hidden": "true" }, h("span", {}), roadColumns.map((column) => h("span", {}, column.name))),
    h("ol", { class: "sw-road-list" }, roads.map(row)),
    h("p", { class: "sw-reads" }, runs(study.roadsReads)),
    h("div", { class: "sw-flag sw-flag-care" }, h("p", { class: "sw-flag-label" }, "Care"), h("p", {}, runs(study.roadsCare)))));
})();
