/*
 * Bible Guide: verse of the day for church websites, version 1.
 * How to paste it in: https://bibleguide.io/verse-of-the-day
 *
 * It finds each <div class="bibleguide-verse">, fetches today's verse file (/widget/v1/days/YYYY-MM-DD.json, by
 * the visitor's own date) and shows the Berean Standard Bible verse in a Shadow DOM, so no styles clash.
 *
 * What it never does: load any other script, font, image or stylesheet; read or write cookies or browser storage;
 * read anything from the page except its own div's data- attributes and the font and colour it inherits; send
 * anything anywhere except the one or two file requests below. No HTML from any file is ever parsed: all text is set
 * with textContent. If anything fails, the two plain links inside the div stay as they are.
 */
(function () {
  "use strict";

  // A second copy (the snippet pasted twice) only looks for new divs.
  if (window.__bibleGuideVerse) {
    try { window.__bibleGuideVerse.scan(); } catch (error) { /* never break the page */ }
    return;
  }

  var HOME = "https://bibleguide.io";
  var ORIGIN = scriptOrigin();
  var OPTIONS = {
    style: ["plain", "card"],
    theme: ["auto", "light", "dark"],
    font: ["site", "serif", "sans"],
    size: ["standard", "compact"],
    heading: ["verse-of-the-day", "todays-verse", "none"],
    align: ["start", "center"]
  };
  var HEADINGS = { "verse-of-the-day": "Verse of the day", "todays-verse": "Today's verse" };
  var ACCENT = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
  var DATE = /^\d{4}-\d{2}-\d{2}$/;
  var LINK = /^\/(read|countdowns)\/[A-Za-z0-9\/?=._-]+$/;
  var REFERENCE = /^(?:[1-3] )?[A-Z][A-Za-z]+(?: [A-Za-z]+){0,2} \d{1,3}:\d{1,3}(?:[–-]\d{1,3})?(?:, \d{1,3}(?:[–-]\d{1,3})?)*[ab]?$/;
  var DAY_KEYS = ["v", "date", "text", "reference", "translation", "read", "season"];
  var SEASON_KEYS = ["label", "link", "linkText"];
  var ENTRY_KEYS = ["text", "reference", "read"];
  var MIN_FONT_PX = 14;

  // Card colours are the site's surface and ink, light and dark; both reach 4.5:1 contrast.
  var CSS = [
    ":host{display:block;container-type:inline-size}",
    "figure{margin:0;line-height:1.5}",
    "figure.center{text-align:center}",
    "figure.serif{font-family:Georgia,'Times New Roman',serif}",
    "figure.sans{font-family:system-ui,'Segoe UI',Roboto,sans-serif}",
    "figure.card{background:#fffdf8;color:#1f1b16;border:1px solid #d9cfbd;border-radius:10px;padding:1.1em 1.25em;--bgv-muted:#6b6255;--bgv-rule:#d9cfbd}",
    "figure.card.dark{background:#1b1916;color:#ece6da;border-color:#36322c;--bgv-muted:#a39a8b;--bgv-rule:#36322c}",
    "figure.frame-plain.light,figure.frame-plain.auto{color:#1f1b16}",
    "figure.frame-plain.dark{color:#ece6da}",
    "@media (prefers-color-scheme:dark){figure.card.auto{background:#1b1916;color:#ece6da;border-color:#36322c;--bgv-muted:#a39a8b;--bgv-rule:#36322c}figure.frame-plain.auto{color:#ece6da}}",
    ".heading{margin:0 0 .3em;font-size:.72em;letter-spacing:.09em;text-transform:uppercase;color:var(--bgv-muted,inherit);opacity:var(--bgv-soft,1)}",
    ".date{margin:0 0 .5em;font-size:.85em;color:var(--bgv-muted,inherit);opacity:var(--bgv-soft,1)}",
    "figure.plain{--bgv-soft:.78}",
    "blockquote{margin:0;max-width:36em;font-size:1.2em;line-height:1.45}",
    "figure.center blockquote{margin-inline:auto}",
    "figcaption{margin-top:.5em;font-size:.92em}",
    "a{color:var(--bgv-accent,inherit);text-decoration:underline;text-underline-offset:.18em}",
    ".ref{font-weight:600}",
    ".season{margin:.35em 0 0;font-size:.85em}",
    ".credit{margin:.8em 0 0;padding-top:.5em;border-top:1px solid var(--bgv-rule,currentColor);font-size:.78em}",
    "figure.plain .credit{border-top-color:color-mix(in srgb,currentColor 25%,transparent)}",
    "figure.compact .heading,figure.compact .date,figure.compact .season{display:none}",
    "figure.compact blockquote{font-size:1.08em}",
    "@container (max-width:259px){.heading,.date,.season{display:none}}",
    "@media (prefers-reduced-motion:no-preference){figure{animation:bgv-in 150ms ease-out}}",
    "@keyframes bgv-in{from{opacity:0}to{opacity:1}}"
  ].join("\n");

  var dayRequests = {};
  var poolRequest = null;
  var done = typeof WeakSet === "function" ? new WeakSet() : null;
  var live = [];
  var shownDate = null;
  var timer = null;
  var stopped = false;

  /** The origin this file was loaded from, so its requests and links go back there (design 4.5). */
  function scriptOrigin() {
    try {
      var script = document.currentScript;
      var url = script && script.src ? new URL(script.src, location.href) : null;
      if (url && (url.protocol === "https:" || url.protocol === "http:")) return url.origin;
    } catch (error) { /* fall through to the live site */ }
    return HOME;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /** The visitor's own date, from the device's local year, month and day. */
  function todayKey() {
    var now = new Date();
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  }

  function dayNumber(key) {
    return Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / 86400000;
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function hasOnly(value, keys) {
    var own = Object.keys(value);
    return own.length === keys.length && keys.every(function (key) { return Object.prototype.hasOwnProperty.call(value, key); });
  }

  function isText(value, max) { return typeof value === "string" && value.length > 0 && value.length <= max; }

  /** The shape check of design 4.5: only these keys, these types and lengths, and links back into the site only. */
  function isEntry(value) {
    return isPlainObject(value) && hasOnly(value, ENTRY_KEYS) && isText(value.text, 400) &&
      isText(value.reference, 60) && REFERENCE.test(value.reference) && isText(value.read, 120) && LINK.test(value.read);
  }

  function isSeason(value) {
    return value === null || (isPlainObject(value) && hasOnly(value, SEASON_KEYS) && isText(value.label, 80) &&
      isText(value.link, 120) && LINK.test(value.link) && isText(value.linkText, 60));
  }

  function isDay(value) {
    return isPlainObject(value) && hasOnly(value, DAY_KEYS) && value.v === 1 && typeof value.date === "string" &&
      DATE.test(value.date) && value.translation === "BSB" && isSeason(value.season) &&
      isEntry({ text: value.text, reference: value.reference, read: value.read });
  }

  function isPool(value) {
    return isPlainObject(value) && value.v === 1 && typeof value.lastDate === "string" && DATE.test(value.lastDate) &&
      typeof value.next === "number" && Math.floor(value.next) === value.next && Array.isArray(value.entries) &&
      value.entries.length > 0 && value.entries.every(isEntry) && isDay(value.longest);
  }

  /** A JSON file, or null. A missing file arrives as the site's page with status 200, so the type is checked. */
  function getJson(path) {
    return fetch(ORIGIN + path, { credentials: "omit", referrerPolicy: "no-referrer" }).then(function (response) {
      var type = response.headers.get("content-type") || "";
      return response.status === 200 && /json/i.test(type) ? response.json() : null;
    }).catch(function () { return null; });
  }

  /** The pool rule: carry the rotation on from the schedule's last day, never a negative index. */
  function fromPool(date) {
    if (!poolRequest) poolRequest = getJson("/widget/v1/pool.json").then(function (pool) { return isPool(pool) ? pool : null; });
    return poolRequest.then(function (pool) {
      if (!pool) return null;
      var length = pool.entries.length;
      var index = (((pool.next + dayNumber(date) - dayNumber(pool.lastDate) - 1) % length) + length) % length;
      var entry = pool.entries[index];
      return { v: 1, date: date, text: entry.text, reference: entry.reference, translation: "BSB", read: entry.read, season: null };
    });
  }

  /** The verse for a date: its day file, else the pool rule; one request per date for all widgets. */
  function dayFor(date) {
    if (!dayRequests[date]) {
      dayRequests[date] = getJson("/widget/v1/days/" + date + ".json").then(function (day) {
        return isDay(day) && day.date === date ? day : fromPool(date);
      }).catch(function () { return null; });
    }
    return dayRequests[date];
  }

  /** The element's options: its data- attributes, or in the frame page the page's query string (design 5.1). */
  function readOptions(element) {
    var inFrame = element.hasAttribute("data-frame");
    var query = inFrame ? new URLSearchParams(location.search) : null;
    var read = function (name) { return inFrame ? query.get(name) : element.getAttribute("data-" + name); };
    var options = { frame: inFrame };
    Object.keys(OPTIONS).forEach(function (name) {
      var value = read(name);
      options[name] = OPTIONS[name].indexOf(value) >= 0 ? value : OPTIONS[name][0];
    });
    if (inFrame && options.font === "site") options.font = "serif";
    var accent = read("accent");
    options.accent = accent && ACCENT.test(accent) ? accent : null;
    return options;
  }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.setAttribute("class", className);
    if (text) node.textContent = text;
    return node;
  }

  function link(path, text, className) {
    var anchor = make("a", className, text);
    anchor.setAttribute("href", ORIGIN + path);
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener");
    return anchor;
  }

  /** "Monday 9 November" or "Monday, November 9", in the page's language if it has one, else the browser's. */
  function dateLine(date) {
    var when = new Date(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
    var format = { weekday: "long", day: "numeric", month: "long" };
    try { return new Intl.DateTimeFormat(document.documentElement.lang || undefined, format).format(when); } catch (error) {
      return new Intl.DateTimeFormat(undefined, format).format(when);
    }
  }

  function addStyles(root) {
    var canAdopt = typeof ShadowRoot === "function" && "adoptedStyleSheets" in ShadowRoot.prototype &&
      typeof CSSStyleSheet === "function" && "replaceSync" in CSSStyleSheet.prototype;
    if (canAdopt) {
      var sheet = new CSSStyleSheet();
      sheet.replaceSync(CSS);
      root.adoptedStyleSheets = [sheet];
    } else {
      root.appendChild(make("style", null, CSS));
    }
  }

  /** Draws a day into the element's Shadow DOM, which hides the fallback links. */
  function draw(element, day) {
    var options = readOptions(element);
    var root = element.shadowRoot || element.attachShadow({ mode: "open" });
    while (root.firstChild) root.removeChild(root.firstChild);
    addStyles(root);
    var classes = [options.style, options.theme, options.size, options.font, options.align];
    if (options.frame && options.style === "plain") classes.push("frame-plain");
    var figure = make("figure", classes.join(" "));
    figure.setAttribute("lang", "en");
    if (options.accent) figure.style.setProperty("--bgv-accent", options.accent);
    if (options.size === "standard" && options.heading !== "none") figure.appendChild(make("p", "heading", HEADINGS[options.heading]));
    if (options.size === "standard") figure.appendChild(make("p", "date", dateLine(day.date)));
    var quote = make("blockquote", null, day.text);
    quote.setAttribute("translate", "no");
    quote.setAttribute("dir", "ltr");
    figure.appendChild(quote);
    var caption = make("figcaption");
    caption.setAttribute("dir", "ltr");
    caption.appendChild(link(day.read, day.reference + " (BSB)", "ref"));
    figure.appendChild(caption);
    if (day.season && options.size === "standard") {
      var season = make("p", "season", day.season.label + " · ");
      season.appendChild(link(day.season.link, day.season.linkText));
      figure.appendChild(season);
    }
    var credit = make("p", "credit");
    credit.appendChild(link("/verse-of-the-day", "Bible Guide"));
    figure.appendChild(credit);
    root.appendChild(figure);
    if (options.frame) fitFrame(figure, quote);
  }

  /** The frame cannot grow: step the verse down to 14px, then drop the date and season. */
  function fitFrame(figure, quote) {
    var overflows = function () { return document.documentElement.scrollHeight > window.innerHeight + 1; };
    var size = parseFloat(window.getComputedStyle(quote).fontSize) || 0;
    while (overflows() && size > MIN_FONT_PX) {
      size = Math.max(MIN_FONT_PX, size * 0.94);
      quote.style.fontSize = size + "px";
    }
    if (!overflows()) return;
    ["date", "season"].forEach(function (name) {
      var node = figure.querySelector("." + name);
      if (node && overflows()) node.style.display = "none";
    });
  }

  /** Renders today's verse, or a given day (the builder's longest-verse preview), shape-checked first. */
  function render(element, day) {
    try {
      if (done) done.add(element);
      if (day !== undefined) {
        if (!isDay(day)) return Promise.resolve(null);
        draw(element, day);
        return Promise.resolve(day);
      }
      var date = todayKey();
      return dayFor(date).then(function (found) {
        if (!found || stopped) return null;
        draw(element, found);
        return found;
      }).catch(function () { return null; });
    } catch (error) {
      return Promise.resolve(null);
    }
  }

  /** Every div not yet drawn, except those the builder page draws itself (data-bibleguide-manual). */
  function scan() {
    var found = document.querySelectorAll("div.bibleguide-verse");
    for (var i = 0; i < found.length; i++) {
      var element = found[i];
      if ((done && done.has(element)) || element.hasAttribute("data-bibleguide-manual")) continue;
      live.push(element);
      render(element);
    }
    shownDate = todayKey();
    schedule();
  }

  /** A new day: draw today's verse again in every widget this script found. */
  function refresh() {
    timer = null;
    if (stopped) return;
    shownDate = todayKey();
    live.forEach(function (element) { render(element); });
    schedule();
  }

  /** One timer to a minute past the visitor's next midnight, kept only while the page is visible (design 3.3). */
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (stopped || !live.length || document.visibilityState === "hidden") return;
    var now = new Date();
    var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    timer = setTimeout(refresh, midnight - now.getTime() + 60000);
  }

  function onVisibility() {
    if (document.visibilityState === "hidden") {
      if (timer) clearTimeout(timer);
      timer = null;
    } else if (shownDate !== todayKey()) {
      refresh();
    } else {
      schedule();
    }
  }

  function onResize() {
    live.forEach(function (element) {
      var root = element.shadowRoot;
      var figure = root && root.querySelector("figure");
      var quote = root && root.querySelector("blockquote");
      if (!figure || !quote) return;
      quote.style.fontSize = "";
      Array.prototype.forEach.call(root.querySelectorAll(".date,.season"), function (node) { node.style.display = ""; });
      fitFrame(figure, quote);
    });
  }

  function start() {
    try {
      scan();
      document.addEventListener("visibilitychange", onVisibility);
      if (document.querySelector("div.bibleguide-verse[data-frame]")) window.addEventListener("resize", onResize);
    } catch (error) { /* never break the page */ }
  }

  /** Internal: lets the builder page draw its previews and the tests tidy up. Not offered to churches. */
  window.__bibleGuideVerse = {
    version: 1,
    origin: ORIGIN,
    render: render,
    scan: scan,
    isDay: isDay,
    isPool: isPool,
    options: OPTIONS,
    stop: function () {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
