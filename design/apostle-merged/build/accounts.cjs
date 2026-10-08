// "One moment, several accounts": the moments of his story that more than one book tells, each account in its own
// KJV words. Chosen from the data, not curated: the calling when two or more books tell it, then the moments whose
// passages lie in the most books, then (for the Twelve) the four lists. A spec may name its own choice.
const LIST_SPAN = { MAT: [40010002, 40010004], MRK: [41003016, 41003019], LUK: [42006014, 42006016], ACT: [44001013, 44001013] };
const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
const LIST_ONLY = /^(Mark 3|Luke 6|Acts 1)\b/;

function build({ a, key, P, ordered, nameOf, codeOf, span, fail }) {
  const byKey = Object.fromEntries(ordered.map((e) => [e.key, e]));
  const booksOf = (refs) => new Set(refs.map((r) => codeOf(r[0])));
  const cand = [];
  const callingTold = a.calling.length >= 2 && a.calling.some((c) => !LIST_ONLY.test(c.label));
  if (callingTold) cand.push("call");
  const generic = (e) => /^(Chosen as one of the Twelve|Sent out with the Twelve)/.test(e.title);
  const multi = ordered.filter((e) => e.type === "moment" && booksOf(e.refs).size >= 2).sort((x, y) => booksOf(y.refs).size - booksOf(x.refs).size || x.i - y.i);
  cand.push(...multi.filter((e) => !generic(e)).map((e) => e.key));
  const lists = (a.lists ?? []).length >= 2;
  let pick = P.accounts ?? cand.slice(0, lists ? 3 : 4).concat(lists ? ["lists"] : []);
  if (pick.length < 2) pick = pick.concat(multi.filter((e) => generic(e)).map((e) => e.key)).slice(0, 3);

  return pick.map((id) => {
    let cols, title;
    if (id === "call") {
      title = key === "paul" ? "The call, told four times" : key === "matthew" ? "The call at the tax office" : "The call";
      cols = a.calling.map((c) => ({ label: c.label, spans: [c.quote.span] }));
    } else if (id === "lists") {
      title = "One man, four lists";
      cols = a.lists.map((l) => ({ label: `${nameOf(l.span[0])} ${Math.floor((l.span[0] % 1e6) / 1e3)} · ${ORD[l.position]}`, spans: [LIST_SPAN[l.book]], mark: l.span[0] }));
    } else {
      const e = byKey[id];
      if (!e) { fail(`${key}: account ${id} unknown`); return null; }
      title = e.title;
      const byBook = new Map();
      for (const r of e.refs) { const c = codeOf(r[0]); if (!byBook.has(c)) byBook.set(c, []); byBook.get(c).push(r); }
      cols = [...byBook].map(([, rs]) => ({ label: nameOf(rs[0][0]), spans: rs }));
    }
    const out = cols.map((c) => ({ label: c.label, spans: c.spans, mark: c.mark ?? null, book: Math.floor(c.spans[0][0] / 1e6),
      verses: c.spans.flatMap((r) => { try { return span(r).slice(0, 12).map((x) => ({ id: x.id, text: x.text })); } catch (err) { fail(`${key} account ${id}: ${err.message}`); return []; } }) }));
    if (out.length < 2) { fail(`${key}: account ${id} has ${out.length} account`); return null; }
    return { id, title, cols: out };
  }).filter(Boolean);
}
module.exports = { build };
