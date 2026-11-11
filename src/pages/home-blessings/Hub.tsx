// The hub, /blessings (design 5.3): the heading and introduction, four groups of link cards (the children's group drawn
// as its own warmer band), the links to the neighbouring features and the source line. Every card's first line comes from
// the data, so no Bible book loads to draw the menu.
import { Link } from "react-router-dom";
import { BLESSING_PAGES, GROUPS, OLDER_TEXTS, pagePath, type BlessingPage } from "@/data/home-blessings";
import { Ornament } from "@/pages/life-events/Ornament";
import { SourceLines } from "./BlessingPage";

/** The first words of a page's featured item, for its card. */
export function firstLine(page: BlessingPage): string {
  const item = page.items[0];
  const text = page.stations ? page.stations[0].prayer
    : item.kind === "written" ? item.text.split("\n")[0]
      : item.kind === "older" ? OLDER_TEXTS[item.id].lines[0]
        : item.kind === "scripture" ? item.setting ?? ""
          : item.prompts[0];
  // A blessing for someone drops its "[name]" here; a line cut mid-verse ends with an ellipsis, not a comma.
  const words = text.replace(/,? \[name\]/g, "").split(/\s+/);
  const shown = words.length <= 12 ? words.join(" ") : `${words.slice(0, 12).join(" ").replace(/[,;:.]$/, "")}…`;
  return shown.replace(/[,;:]$/, "…");
}

function PageCard({ page }: { page: BlessingPage }) {
  return (
    <li>
      <Link to={pagePath(page)}>
        <strong>{page.label}</strong>
        <span>{firstLine(page)}</span>
      </Link>
    </li>
  );
}

export function Hub() {
  return (
    <article className="hb-hub">
      <h1>Blessings for the Home</h1>
      <p className="hb-intro">
        Words to bless your home, give thanks at the table and pray with your children at bedtime: blessings from Scripture, graces families have said for centuries, and short new ones, every one ready to print.
      </p>
      {GROUPS.map((group) => {
        const pages = BLESSING_PAGES.filter((page) => page.group === group.id);
        const children = group.id === "children";
        return (
          <section key={group.id} className={`hb-group${children ? " hb-band" : ""}`} aria-labelledby={`hb-group-${group.id}`}>
            <h2 id={`hb-group-${group.id}`}>
              {children && <Ornament name="star" colour="currentColor" size={28} />}
              {group.title}
            </h2>
            {children && (
              <>
                <p>Graces and bedtime prayers to say with your children, a card they can fill in, and colouring pages.</p>
                <p className="hb-band-link">For Bible questions made for children, try the <Link to="/study/questions/children">children's Bible questions</Link>.</p>
              </>
            )}
            <ul className="hb-grid">{pages.map((page) => <PageCard key={page.slug} page={page} />)}</ul>
          </section>
        );
      })}
      <section className="hb-more" aria-labelledby="hb-else-title">
        <h2 id="hb-else-title">Looking for something else?</h2>
        <ul>
          <li><Link to="/prayers">Prayers for life's occasions, including a prayer for moving day</Link></li>
          <li><Link to="/life-events">Verses and printable cards for life's big days</Link></li>
          <li><Link to="/when-youre">What the Bible says when you're…</Link></li>
        </ul>
      </section>
      <SourceLines older />
    </article>
  );
}
