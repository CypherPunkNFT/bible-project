// E · Doors and stacks: one item's page. It is A's workbook view as it stands (for Moses: the cover with real pages
// fanned behind it, both downloads, sample pages that open the page viewer, the eight sessions, the series), with its
// links kept in E and the way back leading to that age's open door. E has no audience page: the ages open on the front.
(() => {
  const { icon } = Frame;

  function item(wrap, id) {
    DIRS.a.item(wrap, id);
    const aud = LEARN.A[LEARN.I[id].audience];
    wrap.querySelector(".crumbs .here").textContent = "Direction E · Doors and stacks";
    const back = wrap.querySelector(".sh-back");
    back.setAttribute("href", `#e/${aud.id}`);
    back.innerHTML = `${icon("arrowLeft", 14)}Back to the ${aud.name.toLowerCase()} door`;
    DIRS.e.retarget(wrap);
  }

  Object.assign(DIRS.e, { item });
})();
