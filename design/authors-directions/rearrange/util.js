// Small shared pieces for the Rearrange page: names, monograms, family colours, links and a tiny event bus.
window.R = (() => {
  const people = AUTHORS.people;
  const links = AUTHORS.links;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bus = new EventTarget();

  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const tokens = (person) => person.name.split(/\s+/).filter(Boolean);
  const initials = (person) => { const t = tokens(person); return (t[0][0] + t[t.length - 1][0]).toUpperCase(); };
  const surname = (person) => { const t = tokens(person); return t[t.length - 1]; };
  const given = (person) => tokens(person).slice(0, -1).join(" ");
  const tone = (person) => `var(${familyOf(person).tone})`;
  const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
  const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

  // Documented links touching one person, each with the other person and which way it runs.
  const linksOf = (id) => links.filter((l) => l.from === id || l.to === id)
    .map((l) => ({ other: personById(l.from === id ? l.to : l.from), note: l.note, outgoing: l.from === id }));

  // A generated mark: a ring standing for 1500 to today with the person's own lifetime drawn in their family colour.
  function lifeRing(person, size = 64) {
    const r = 26, c = 32, start = 1500, span = THIS_YEAR - start;
    const angle = (year) => -Math.PI / 2 + ((year - start) / span) * Math.PI * 2;
    const point = (year) => [c + r * Math.cos(angle(year)), c + r * Math.sin(angle(year))];
    const [x1, y1] = point(person.born), [x2, y2] = point(lifeEnd(person));
    const large = (lifeEnd(person) - person.born) / span > 0.5 ? 1 : 0;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" style="--tone:${tone(person)}">
      <circle cx="32" cy="32" r="${r}" style="fill:none;stroke:var(--line);stroke-width:3"/>
      <path d="M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" style="fill:none;stroke:var(--tone);stroke-width:5;stroke-linecap:round"/>
      <text x="32" y="37.5" text-anchor="middle" style="fill:var(--ink);font: 600 15px var(--serif)">${initials(person)}</text></svg>`;
  }

  const mono = (person) => `<span class="mono" style="--tone:${tone(person)}">${initials(person)}</span>`;
  const dot = (person) => `<i class="dot" style="--tone:${tone(person)}"></i>`;

  // Opening a profile is owned by the drawer; everything else just asks for it.
  const open = (id) => bus.dispatchEvent(new CustomEvent("open", { detail: id }));
  const light = (id) => bus.dispatchEvent(new CustomEvent("light", { detail: id }));

  return { people, links, reduced, bus, esc, initials, surname, given, tone, plural, ordinal, linksOf, lifeRing, mono, dot, open, light };
})();
