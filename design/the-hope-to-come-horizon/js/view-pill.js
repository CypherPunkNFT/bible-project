// The floating A, B, C, D pill for comparing versions of one reading's view. A version opens with ?creation-view=b or ?new-view=b in the
// address; without it the page is untouched. Only the comparison files use this.
(() => {
  if (!window.HZ) return;
  HZ.viewPill = (param, at, views) => {
    const start = new URLSearchParams(location.search).get(param);
    if (!start) return;
    const view = document.querySelector(`.hz-stop[data-at="${at}"] .hz-view`);
    const buttons = new Map();
    function choose(key) {
      view.innerHTML = views[key];
      buttons.forEach((button, name) => button.setAttribute("aria-pressed", String(name === key)));
      const params = new URLSearchParams(location.search);
      params.set(param, key);
      history.replaceState(history.state, "", `?${params}`);
    }
    const pill = document.createElement("div");
    pill.className = "hz-pill";
    Object.keys(views).forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = key.toUpperCase();
      button.addEventListener("click", () => choose(key));
      buttons.set(key, button);
      pill.append(button);
    });
    document.body.append(pill);
    HZ.setView?.({ at });
    choose(views[start] ? start : "a");
    window.scrollTo(0, document.querySelector(".hz-rail").getBoundingClientRect().top + scrollY - 76);
  };
})();
