// Shared pieces of the Help for life mock-ups: how a contact becomes a link (as src/pages/resources/contact-links.ts),
// the categories and their colours, the crisis strip, the hero, and one collapsible row for a line or a place.
// Every word shown comes from window.LIFE (life.json); only the summaries below (ways, counts) are derived from it.
(() => {
  const LIFE = window.LIFE;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const plural = (n, one, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

  // One colour per kind of help, from the site's own book colours; used for the card, the pin and the row marker only.
  const CAT = {
    crisis: { short: "Crisis", line: "Help right now", color: "revelation", icon: "lifebuoy" },
    pregnancy: { short: "Pregnancy", line: "Pregnancy help", color: "acts", icon: "baby" },
    "after-abortion": { short: "After an abortion", line: "Healing", color: "gospels", icon: "heartHandshake" },
    "children-families": { short: "Babies & families", line: "Children and families", color: "prophets", icon: "users" },
    food: { short: "Food", line: "Food", color: "epistles", icon: "wheat" },
    grief: { short: "Grief", line: "Grief", color: "apocrypha", icon: "flower" },
    recovery: { short: "Recovery", line: "Addiction and recovery", color: "poetry", icon: "sprout" },
    abuse: { short: "Abuse", line: "Abuse and assault", color: "history", icon: "shield" },
    shelter: { short: "Shelter", line: "Shelter and meals", color: "poetry", icon: "house" },
  };
  const cat = (id) => CAT[id] ?? { short: id, line: id, color: "accent", icon: "handHeart" };
  const tone = (id) => `var(--${cat(id).color})`;

  function wayOf(kind) {
    const k = kind.toLowerCase();
    if (/chat/.test(k)) return "chat";
    if (/phone|call|tel|voice|line/.test(k)) return "call";
    if (/text|sms/.test(k)) return "text";
    if (/web|site|url|online/.test(k)) return "web";
    if (/mail/.test(k)) return "email";
    return "other";
  }
  const dialable = (value) => value.trim().replace(/(?!^\+)[^\d]/g, "");
  /** The keyword a text line asks for ("HOME", "GO", "START"), from its value or its note. */
  const keywordOf = (c) => (`${c.value} ${c.note ?? ""}`.match(/text\s+["“]?([A-Za-z]+)["”]?(?:\s+to|\s*$|["”])/i) ?? [])[1] ?? (c.value.match(/^\s*["“]?([A-Za-z]+)["”]?\s+to\s+/i) ?? [])[1];
  function hrefOf(c) {
    const way = wayOf(c.kind);
    if (way === "call" && /\d{3}/.test(c.value)) return `tel:${dialable(c.value)}`;
    if (way === "text" && /\d{3}/.test(c.value)) { const key = keywordOf(c); return `sms:${dialable(c.value.replace(/^.*\bto\b/i, ""))}${key && !/zip/i.test(key) ? `?&body=${encodeURIComponent(key.toUpperCase())}` : ""}`; }
    if (way === "email" && c.value.includes("@")) return `mailto:${c.value.trim()}`;
    if (/^https?:\/\//.test(c.value)) return c.value;
    return null;
  }
  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

  /** The first sentence of a summary; does not break after "U.S." or "St.". */
  function firstSentence(text = "") {
    const re = /([.!?])\s+(?=[A-Z0-9“"(])/g;
    let m;
    while ((m = re.exec(text))) {
      const before = text.slice(0, m.index).split(/\s/).at(-1);
      if (/^([A-Z]\.?)+$|^(St|Dr|Mr|Mrs|Ms|No|Ave|Blvd|Rd|E|W|N|S)$/.test(before)) continue;
      return text.slice(0, m.index + 1);
    }
    return text;
  }
  const WAY_WORD = { call: "Call", text: "Text", chat: "Chat", web: "Website", email: "Email" };
  /** "Call · Text · Chat · 24/7": the ways a line can be reached and when it answers. */
  function subtitle(entry) {
    const ways = [...new Set(entry.contact.map((c) => wayOf(c.kind)).filter((w) => w in WAY_WORD))].sort((a, b) => Object.keys(WAY_WORD).indexOf(a) - Object.keys(WAY_WORD).indexOf(b));
    return [ways.map((w) => WAY_WORD[w]).join(" · "), shortHours(entry.hours)].filter(Boolean).join("  ·  ");
  }
  const shortHours = (h) => (!h ? "" : /24\s*[/-]?\s*7|24-hour|24 hours/i.test(h) && h.length < 26 ? h.replace(/ helpline| hotline/i, "") : /^Office /.test(h) ? "" : h.length <= 28 ? h : "");
  const allHours = (e) => /24\s*\/\s*7|24-hour|answered 24/i.test(`${e.hours ?? ""} ${e.contact.map((c) => c.note ?? "").join(" ")}`);
  const costOf = (e) => e.cost ?? null;

  /** The tap-to-call and tap-to-text buttons a row shows while it is still closed. */
  function quickActions(entry, max = 2) {
    const out = [];
    for (const c of entry.contact) {
      const way = wayOf(c.kind), href = hrefOf(c);
      if (!href || (way !== "call" && way !== "text")) continue;
      if (/tty|non-urgent|administ|office|headquarters/i.test(c.note ?? "")) continue;
      if (out.some((o) => o.way === way)) continue;
      const press = (c.note ?? "").match(/press (\d)/i);
      const key = way === "text" ? keywordOf(c) : null;
      const label = way === "call" ? `Call ${c.value}${press ? `, then ${press[1]}` : ""}` : key && !/zip/i.test(key) ? `Text ${key.toUpperCase()} to ${c.value.replace(/^.*\bto\b\s*/i, "")}` : `Text ${c.value}`;
      out.push({ way, href, label });
      if (out.length >= max) break;
    }
    return out;
  }
  const quickHtml = (entry, max) => quickActions(entry, max).map((q) => `<a class="quick" data-way="${q.way}" href="${esc(q.href)}">${icon(q.way === "call" ? "phone" : "text", 16)}<span>${esc(q.label)}</span></a>`).join("");

  function contactHtml(c) {
    const way = wayOf(c.kind), href = hrefOf(c);
    const shown = /^https?:\/\//.test(c.value) ? host(c.value) : c.value;
    const verb = WAY_WORD[way] ?? "";
    const body = `${icon({ call: "phone", text: "text", chat: "chat", email: "email" }[way] ?? "web", 18)}<strong>${esc(shown)}</strong><small>${esc([verb, c.note].filter(Boolean).join(" · "))}</small>`;
    if (!href) return `<p class="contact">${body}</p>`;
    const ext = href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : "";
    return `<a class="contact" data-way="${way}" href="${esc(href)}"${ext}>${body}</a>`;
  }
  const sameUrl = (a, b) => a.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") === b.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  /** Everything a row shows once opened: the whole summary, hours, every way to reach it, the finder and the source. */
  function detailHtml(e, { address } = {}) {
    const rest = e.summary && firstSentence(e.summary) !== e.summary ? e.summary.slice(firstSentence(e.summary).length).trim() : "";
    const locator = e.locator && !e.contact.some((c) => sameUrl(c.value, e.locator)) ? contactHtml({ kind: "web", value: e.locator, note: "Find local help" }) : "";
    return `${rest ? `<p class="rest">${esc(rest)}</p>` : ""}
      ${address && e.address && !/^No walk-in/.test(e.address) ? `<p class="addr">${icon("pin", 16)}<span>${esc(e.address)}</span></p>` : ""}
      ${address && e.address && /^No walk-in/.test(e.address) ? `<p class="addr muted">${icon("pin", 16)}<span>${esc(e.address.replace(/; reach it by phone, text or online/, ""))}</span></p>` : ""}
      ${e.hours ? `<p class="hours">${icon("clock", 16)}<span>${esc(e.hours)}</span></p>` : ""}
      <div class="contacts">${e.contact.map(contactHtml).join("")}${locator}</div>
      <p class="checked">Checked ${esc(e.checked)} on <a href="${esc(e.source)}" target="_blank" rel="noreferrer">${esc(host(e.source))}</a>${e.faith === true ? ' · <span class="faith">Faith-based</span>' : ""}</p>`;
  }

  /**
   * One collapsible row (a national line or a local place). Closed it shows the name, a subtitle, one sentence and the
   * cost; crisis rows (opts.quick) also keep their call/text buttons on the closed row, so nobody has to open anything.
   */
  function rowHtml(e, opts = {}) {
    const c = opts.cat ?? e.category;
    const cost = costOf(e);
    const sub = opts.sub ?? subtitle(e);
    const quick = opts.quick ? quickHtml(e, opts.quickMax ?? 2) : "";
    return `<li class="row" data-id="${esc(e.id)}" data-cat="${esc(c)}" style="--c: ${tone(c)}"${opts.open ? " data-open" : ""}>
      <button type="button" class="row-head" aria-expanded="${opts.open ? "true" : "false"}">
        ${opts.n != null ? `<b class="num" aria-hidden="true">${opts.n}</b>` : ""}
        <span class="row-name">${esc(e.name)}</span>
        <span class="row-sub">${esc(sub)}</span>
        <span class="row-sum">${esc(firstSentence(e.summary))}</span>
        <span class="row-cost${cost ? "" : " none"}">${cost ? `<b>${esc(cost)}</b>` : "Cost not stated on its page"}${e.faith === true ? '<i class="faith">Faith-based</i>' : ""}</span>
        <span class="chev" aria-hidden="true">${icon("chevron", 18)}</span>
      </button>
      ${quick ? `<div class="row-quick">${quick}</div>` : ""}
      <div class="row-body"${opts.open ? "" : " inert"}><div>${detailHtml(e, { address: opts.address })}</div></div>
    </li>`;
  }
  /** Rows open and close in place (one container can hold many). */
  function wireRows(root, { single = false, onToggle } = {}) {
    root.addEventListener("click", (ev) => {
      const head = ev.target.closest(".row-head");
      if (!head || !root.contains(head)) return;
      const row = head.closest(".row");
      const open = !row.hasAttribute("data-open");
      if (single && open) root.querySelectorAll(".row[data-open]").forEach((r) => r !== row && setOpen(r, false));
      setOpen(row, open);
      onToggle?.(row, open);
    });
  }
  function setOpen(row, open) {
    row.toggleAttribute("data-open", open);
    row.querySelector(".row-head").setAttribute("aria-expanded", String(open));
    row.querySelector(".row-body").inert = !open;
  }

  // ── Page pieces ────────────────────────────────────────────────────────────────────────────────────────────
  /** "Call 911" and "Call or text 988", only as the national data lists them. */
  function crisisStrip() {
    const all = LIFE.groups.flatMap((g) => g.entries).flatMap((e) => e.contact);
    const has = (n, way) => all.some((c) => wayOf(c.kind) === way && dialable(c.value) === n);
    const call911 = has("911", "call"), call988 = has("988", "call"), text988 = has("988", "text");
    return `<aside class="crisis" aria-label="Help right now">
      ${call911 ? `<p><span>In danger now?</span><a href="tel:911">${icon("phone", 18)}Call 911</a></p>` : ""}
      ${call988 || text988 ? `<p><span>Thinking of suicide or in crisis?</span>${call988 ? `<a href="tel:988">${icon("phone", 18)}Call 988</a>` : ""}${call988 && text988 ? "<span>or</span>" : ""}${text988 ? `<a href="sms:988">${icon("text", 18)}Text 988</a>` : ""}</p>` : ""}
      <p class="crisis-note">Both answer 24 hours a day.</p>
    </aside>`;
  }
  function crumbs() {
    return `<nav class="crumbs" aria-label="Resources sections"><a href="/resources">${icon("arrowLeft", 14)}Resources</a><a href="/resources/learning">Learning materials</a><a href="/resources/fellowships">Fellowships</a><a href="/resources/life" aria-current="page">Help for life</a></nav>`;
  }
  function hero() {
    const national = LIFE.groups.reduce((n, g) => n + g.entries.length, 0);
    const city = LIFE.city;
    return `<header class="hero">
      <div><p class="kick">Resources · 03</p><h1>Help for <em>life</em></h1></div>
      <div class="hero-side"><p>Free national lines for the hardest moments, and places in ${esc(city.name)} that help with pregnancy, food, shelter, abuse and grief. Every number can be tapped to call or text.</p>
        <dl class="stats"><div><dt>National lines</dt><dd>${national}</dd></div><div><dt>Places</dt><dd>${city.entries.length}</dd></div><div><dt>Local lines</dt><dd>${city.lines.length}</dd></div><div><dt>Checked</dt><dd>${esc(LIFE.checked)}</dd></div></dl></div>
    </header>`;
  }
  const sectionHead = (n, title, lead) => `<div class="sec-head"><span>${n}</span><h2>${title}</h2>${lead ? `<p>${lead}</p>` : ""}</div>`;
  function howMade() {
    return `<section class="how"><p>How this list is made: every number, address and hour is copied from the organisation’s own page, and each entry links to the page it was checked on. Numbers change; if one fails, the organisation’s page is the place to look. The Jacksonville map is drawn from the US Census Bureau’s TIGER/Line 2026 files; each place is located from its address by the Census Bureau geocoder.</p></section>`;
  }

  /** Per-category counts the cards show: lines, how many answer around the clock, and the ways to reach them. */
  function groupStats(g) {
    const n = g.entries.length;
    const always = g.entries.filter(allHours).length;
    const ways = new Set(g.entries.flatMap((e) => e.contact.map((c) => wayOf(c.kind))));
    const free = g.entries.filter((e) => /free/i.test(e.cost ?? "")).length;
    return { n, always, free, ways: ["call", "text", "chat"].filter((w) => ways.has(w)) };
  }
  const isCrisisGroup = (g) => g.id === "crisis";

  window.Life = { LIFE, esc, plural, CAT, cat, tone, wayOf, hrefOf, host, firstSentence, subtitle, quickActions, quickHtml, contactHtml, detailHtml, rowHtml, wireRows, setOpen, crisisStrip, crumbs, hero, sectionHead, howMade, groupStats, isCrisisGroup, allHours, WAY_WORD };
})();
