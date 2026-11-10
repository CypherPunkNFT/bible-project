// Bible Jeopardy's category picker (design 3.2): every category under the test page's shelves and groups, then the Old
// and New Testament books, each with its question count. About 125 rows at most, so the list is drawn whole in a
// scrolling panel. Columns left empty are filled by "Surprise me" when the board is built.
import { formatNumber } from "@/lib/site-format";
import { SHELVES } from "../../questions/test/themes";
import { MIN_CANDIDATES, type Category } from "./categories";

interface Props {
  categories: Category[];
  counts: Map<string, number> | null;
  chosen: string[];
  limit: number;
  onChange: (chosen: string[]) => void;
}

export function CategoryPicker({ categories, counts, chosen, limit, onChange }: Props) {
  const byGroup = new Map<string, Category[]>();
  for (const category of categories) byGroup.set(category.group, [...(byGroup.get(category.group) ?? []), category]);
  const toggle = (id: string) => onChange(chosen.includes(id) ? chosen.filter((other) => other !== id) : [...chosen, id]);
  const row = (category: Category) => {
    const count = counts?.get(category.id) ?? null;
    const tooFew = count !== null && count < MIN_CANDIDATES;
    const on = chosen.includes(category.id);
    return <li key={category.id} className={tooFew ? "is-greyed" : ""}>
      <label>
        <input type="checkbox" checked={on} disabled={tooFew || (!on && chosen.length >= limit)} onChange={() => toggle(category.id)} />
        <span className="jp-pick-title">{category.title}</span>
        <span className="jp-pick-count">{count === null ? "…" : formatNumber(count)}</span>
      </label>
      {tooFew && <small>Too few questions with these settings</small>}
    </li>;
  };
  const books = (testament: "OT" | "NT") => categories.filter((category) => category.kind === "book" && category.testament === testament);
  return <div className="jp-picker">
    <p className="jp-hint" aria-live="polite">{`${formatNumber(chosen.length)} of ${formatNumber(limit)} chosen`}</p>
    <div className="jp-picker-list">
      {SHELVES.map((shelf) => <section key={shelf.id}>
        <h3>{shelf.title}</h3>
        {shelf.groups.map((group) => {
          const list = byGroup.get(group.id);
          return list ? <div key={group.id}><h4>{group.title}</h4><ul>{list.map(row)}</ul></div> : null;
        })}
      </section>)}
      {books("OT").length > 0 && <section><h3>Old Testament books</h3><ul>{books("OT").map(row)}</ul></section>}
      {books("NT").length > 0 && <section><h3>New Testament books</h3><ul>{books("NT").map(row)}</ul></section>}
    </div>
  </div>;
}
