// The floating A, B, C, D pill for comparing versions of part of the page. A version opens with ?creation-view=b, ?new-view=b or
// ?readings-view=b in the address; without it the page is untouched. Only the comparison files use this.
(() => {
  if (!window.HZ) return;
  HZ.pill = (param, keys, show) => {
    const start = new URLSearchParams(location.search).get(param);
    if (!start) return false;
    const buttons = new Map();
    function choose(key) {
      show(key);
      buttons.forEach((button, name) => button.setAttribute("aria-pressed", String(name === key)));
      const params = new URLSearchParams(location.search);
      params.set(param, key);
      history.replaceState(history.state, "", `?${params}`);
    }
    const pill = document.createElement("div");
    pill.className = "hz-pill";
    keys.forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = key.toUpperCase();
      button.addEventListener("click", () => choose(key));
      buttons.set(key, button);
      pill.append(button);
    });
    document.body.append(pill);
    choose(keys.includes(start) ? start : keys[0]);
    window.scrollTo(0, document.querySelector(".hz-slider").getBoundingClientRect().top + scrollY - 76);
    return true;
  };
  HZ.viewPill = (param, at, views) => {
    if (!new URLSearchParams(location.search).has(param)) return;
    HZ.setView({ at });
    const view = document.querySelector(`.hz-stop[data-at="${at}"] .hz-view`);
    HZ.pill(param, Object.keys(views), (key) => { view.innerHTML = views[key]; });
    const pill = document.querySelector(".hz-pill");
    HZ.onView(() => { pill.hidden = HZ.currentStop() !== at; });
  };
})();
