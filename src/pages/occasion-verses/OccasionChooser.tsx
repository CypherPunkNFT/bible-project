// The occasions, by group (design 3): links, so each choice is its own address and Back returns here.
import { Link } from "react-router-dom";
import { OCCASION_GROUPS, OCCASIONS, type Occasion } from "@/data/occasion-verses";
import { writeAddress } from "./address";

export function OccasionChooser({ current, keys }: { current: Occasion | undefined; keys: string[] }) {
  return (
    <nav className="ov-chooser" aria-label="Occasions">
      {OCCASION_GROUPS.map((group) => {
        const occasions = OCCASIONS.filter((occasion) => occasion.group === group.id);
        if (!occasions.length) return null;
        return (
          <section key={group.id} className="ov-group-block">
            <h2>{group.title}</h2>
            <ul>
              {occasions.map((occasion) => (
                <li key={occasion.slug}>
                  <Link to={{ search: writeAddress({ occasion, keys }) }} className="ov-chip" aria-current={occasion === current ? "page" : undefined}>
                    {occasion.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
