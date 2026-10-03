import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { sectionColor } from "@/lib/sections";

/** Which version carries which book: one row per version, one square per book. */
export function CoverageMatrix() {
  const catalog = useCatalog();
  const [hover, setHover] = useState("");
  const books = catalog.books.filter((b) => catalog.translations.some((t) => t.books[b.code]));

  return (
    <div>
      <p className="mb-3 min-h-[1.25rem] text-sm text-muted" aria-live="polite">
        {hover || "Filled = the version has that book. The last block is the Apocrypha. Point at a square."}
      </p>
      <div className="overflow-x-auto pb-2">
        <table className="border-separate border-spacing-[2px] text-xs">
          <tbody>
            {catalog.translations.map((t) => (
              <tr key={t.slug}>
                <th scope="row" className="pe-2 text-right font-semibold">
                  <Link to="/versions" className="hover:text-accent" title={t.name}>
                    {t.abbr}
                  </Link>
                </th>
                {books.map((b) => {
                  const has = !!t.books[b.code];
                  return (
                    <td
                      key={b.code}
                      onMouseEnter={() => setHover(`${t.abbr} — ${b.name}: ${has ? `${t.books[b.code].length} chapters` : "not included"}`)}
                      className="h-3 w-3 min-w-[12px] rounded-[2px]"
                      style={{ background: has ? sectionColor(b.section) : "transparent", boxShadow: has ? undefined : "inset 0 0 0 1px var(--line)" }}
                    >
                      <span className="sr-only">{has ? `${b.name} included` : `${b.name} not included`}</span>
                    </td>
                  );
                })}
                <td className="ps-2 text-muted">{Object.keys(t.books).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
