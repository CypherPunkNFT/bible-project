// Section 04. Scripture on these works in three voices: Jesus, older Scripture with who draws each link, and the apostles.
(() => {
  if (!window.SWK) return;
  const { h, phrase, page, sectionHead, runs } = SWK;
  const { study, voices } = window.SW;
  const plainVoice = (voice) => h("section", { class: "sw-voice" }, h("h3", {}, voice.title), h("ul", {}, voice.items.map((item) => h("li", {}, phrase(item)))));
  const olderVoice = (voice) => h("section", { class: "sw-voice sw-voice-older" }, h("h3", {}, voice.title), h("ul", {}, voice.items.map((item) => h("li", {},
    h("span", { class: "sw-older-by" }, item.by),
    h("span", { class: "sw-older-then" }, phrase(item.then)),
    h("span", { class: "sw-older-now" }, phrase(item.now))))));
  page.append(h("section", { class: "t-sec sw-voices", id: "scripture" },
    sectionHead("04", "Scripture", "reads these works too", runs(study.scriptureLead)),
    h("div", { class: "sw-voice-grid" }, plainVoice(voices.jesus), olderVoice(voices.older), plainVoice(voices.apostles)),
    h("p", { class: "sw-reads" }, runs(study.scriptureReads))));
})();
