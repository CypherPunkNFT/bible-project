// Contact & About mock-ups (owner, 2026-10-20): four directions for /contact, each about the project's purpose and the
// man who builds it, not the site's features. Shared here: the switcher between the four, the contact form, and facts.
(() => {
  const DIRECTIONS = [
    ["letter", "A", "A letter"],
    ["front-matter", "B", "Front matter"],
    ["convictions", "C", "Convictions"],
    ["lamp", "D", "The lamp in the window"],
    ["study-sets", "E", "Study style · 12 themes"],
    ["merged", "F", "Merged: grace, convictions, letter"],
  ];

  // Everything said about Lucas comes from the owner (2026-10-19) or his own Saint Laurent pages (about.html, faith.html).
  window.ABOUT = {
    name: "Lucas Campbell Saint Laurent",
    first: "Lucas",
    role: "Founder and sole developer",
    place: "Jacksonville, Florida",
    church: "serves on the greet team at his church",
    forge: "leads RedeemerForge, a faith-based program for young people",
    address: "amen@bibleproject.io",
    personalSite: "#", // his personal site: not live yet
    faithPage: "#", // his faith page: not live yet
  };

  window.ContactMock = {
    // The pill switcher under the site header, linking the four directions.
    switcher(current) {
      return `<nav class="cm-switch" aria-label="Contact page directions">
        <span class="cm-switch-label">Contact &amp; About · mock-ups</span>
        ${DIRECTIONS.map(([slug, letter, label]) => `<a href="../${slug}/" class="${slug === current ? "is-on" : ""}"><b>${letter}</b>${label}</a>`).join("")}
      </nav>`;
    },

    // The contact form. `tone` picks a class for each direction's styling; nothing is sent from a mock-up.
    form(tone = "", button = "Send message") {
      return `<form class="cm-form ${tone}" onsubmit="event.preventDefault(); this.querySelector('.cm-note').hidden = false;">
        <div class="cm-row">
          <label>Your name <span>(optional)</span><input autocomplete="name" maxlength="80"></label>
          <label>Your email <span>(to get a reply)</span><input type="email" autocomplete="email" maxlength="200"></label>
        </div>
        <label>Message<textarea rows="4" required maxlength="4000"></textarea></label>
        <div class="cm-send"><button type="submit">${icon("mail", 16)}${button}</button>
          <span>or write to <a href="mailto:${ABOUT.address}">${ABOUT.address}</a></span></div>
        <p class="cm-note" hidden>Mock-up only: nothing was sent.</p>
      </form>`;
    },

    mount(current) {
      const main = Frame.mount();
      document.querySelectorAll(".nav a.active").forEach((link) => link.classList.remove("active"));
      main.insertAdjacentHTML("afterbegin", ContactMock.switcher(current));
      return main;
    },
  };

  if (!window.ICONS.mail) window.ICONS.mail = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>';
})();
