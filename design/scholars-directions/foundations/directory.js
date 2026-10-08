// 04 · All the scholars: a compact list by era. Each row gives years, faith and field, and a mark when the site uses
// their work (filled: a live feature; ring: in the library, planned). Every row opens the profile.
Sections.directory = (() => {
  const { D, esc, years, faith, field, tone, status } = Sc;
  const MARK = { "in-use": "Used by a live feature", held: "In the library, planned" };

  const rowHtml = (s) => {
    const st = status(s);
    return `<li><button type="button" data-scholar="${s.id}" style="--tone: var(${tone(s)})">
      <i class="dr-dot" aria-hidden="true"></i><span class="dr-nm">${esc(s.name)}</span><span class="dr-yr">${esc(years(s))}</span>
      <span class="dr-meta">${esc(faith(s))} · ${esc(field(s))}</span>
      ${st ? `<span class="sc-use sc-use-${st} dr-mark" title="${MARK[st]}" aria-label="${MARK[st]}"></span>` : `<span class="dr-mark" aria-hidden="true"></span>`}</button></li>`;
  };

  function mount(section) {
    const groups = Object.entries(D.eras).map(([key, label]) => [label, D.scholars.filter((s) => s.era === key)]).filter(([, list]) => list.length);
    section.innerHTML = `${Sc.head("04", "Directory", `All ${D.scholars.length} <em>scholars</em>`,
      "By era, with years, faith and field. Click any name for the full profile.")}
      <ul class="dr-key"><li><span class="sc-use sc-use-in-use"></span>A live feature on this site uses their work</li><li><span class="sc-use sc-use-held"></span>Their book is in the library, planned</li></ul>
      <div class="dr-list">${groups.map(([label, list]) => `<div class="dr-group"><h3>${esc(label)}<span>${list.length}</span></h3><ul>${list.map(rowHtml).join("")}</ul></div>`).join("")}</div>`;
  }
  return { mount };
})();
