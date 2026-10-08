// Puts the page together: the hero and duet, then every section of the ruler page, then wires their strings.
window.mountPage = (main) => {
  main.innerHTML = [Duet.hero(), SecA.glance(), Duet.duet(), SecA.anointings(), SecA.verdict(), SecA.prophets(), SecA.tellings(),
    SecB.kingdom(), SecB.world(), SecB.dates(), SecB.questions(), SecB.sources()].join("");
  Duet.mount();
  SecA.mount();
  SecB.mount();
};
