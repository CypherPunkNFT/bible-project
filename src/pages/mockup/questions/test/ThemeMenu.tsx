// The theme menu in the themes mock-up's three versions, drawn by one component so a switch between them is a makeover,
// not a reload (owner, 2026-10-23: "everything that I have open to transform in whatever visual it's supposed to be…
// not a teleporting"). What is open and chosen stays; every shelf, group and test keeps its element and glides to its
// place in the new version. A: as the menu is (ThemeShelves.tsx). B: its three rows in one bordered box sharing their
// borders, like the apologetics pages' two-row menu. C: an accordion; the shelves stack as bars, an open shelf unfolds
// its groups under it and an open group its tests, each a step in, by layout alone. Styles: themes-mockup.css.
import { ArrowRight, Check } from "lucide-react";
import { LayoutGroup, motion, MotionConfig, type Transition } from "framer-motion";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { TestRecord } from "../../../questions/test/record";
import { chosenIn, homeOf, iconOf, plural, shelfMeta, shownShelves, toneOf } from "../../../questions/test/shelf-model";

export type MenuVersion = "a" | "b" | "c";
interface Props { version: MenuVersion; counts: Map<string, number>; selected: string; onChoose: (id: string) => void; record: TestRecord }

const GLIDE: Transition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };
// A row opened by a click slides in; a switch of version never remounts it, so it only glides.
const ENTER = { opacity: 0, y: -8 }, SHOWN = { opacity: 1, y: 0 };

export function ThemeMenu({ version, counts, selected, onChoose, record }: Props) {
  const shelves = shownShelves(counts);
  const [open, setOpen] = useState(() => homeOf(selected));
  const s = shelves.findIndex(({ shelf }) => shelf.id === open.shelf), openShelf = shelves[s];
  const g = openShelf ? openShelf.groups.findIndex(({ group }) => group.id === open.group) : -1, openGroup = openShelf?.groups[g];
  // One element tree for all three versions, so nothing is rebuilt on a switch. C lays every cell out in one column,
  // and these orders fold the open shelf's groups in under it and the open group's tests under that.
  const shelfAt = (i: number) => i * 100, groupAt = (j: number) => s * 100 + 1 + j * 10;
  return <MotionConfig transition={GLIDE}><LayoutGroup>
    <motion.div layout className={`th tm-menu is-${version}`}>
      <ul className="th-shelves">{shelves.map(({ shelf, groups }, i) => {
        const on = i === s;
        return <MenuCell key={shelf.id} layoutId={`s-${shelf.id}`} order={shelfAt(i)} icon={shelf.id} n={i} title={shelf.title} line={shelf.line} on={on}
          open="Open the shelf" style={toneOf(shelf.tone)} meta={shelfMeta(groups)} chosen={chosenIn(groups, selected)}
          onClick={() => setOpen({ shelf: on ? "" : shelf.id, group: "" })} />;
      })}</ul>
      {openShelf && <div className="th-rows" style={toneOf(openShelf.shelf.tone)}>
        <motion.ul key={`g-${openShelf.shelf.id}`} initial={ENTER} animate={SHOWN} className="th-shelves is-small th-groups"
          style={{ "--cols": openShelf.groups.length } as CSSProperties}>
          {openShelf.groups.map(({ group, themes }, j) => {
            const on = j === g;
            return <MenuCell key={group.id} layoutId={`g-${group.id}`} order={groupAt(j)} icon={group.id} n={j} title={group.title} line={group.line} on={on}
              open="Open the group" meta={plural(themes.length, "test")} chosen={chosenIn([{ themes }], selected)}
              onClick={() => setOpen({ ...open, group: on ? "" : group.id })} />;
          })}
        </motion.ul>
        {openGroup && <motion.ul key={`t-${openGroup.group.id}`} initial={ENTER} animate={SHOWN} className="th-shelves is-small th-tests"
          style={{ "--cols": openGroup.themes.length, "--o": groupAt(g) + 5 } as CSSProperties}>
          {openGroup.themes.map(({ theme, n }, i) => {
            const on = theme.id === selected, mark = record[theme.id];
            return <MenuCell key={theme.id} layoutId={`t-${theme.id}`} icon={openGroup.group.id} n={i} title={theme.title} line={theme.line} on={on} press
              open={on ? "Chosen" : "Choose the test"} onClick={() => onChoose(on ? "" : theme.id)}
              meta={<>{n.toLocaleString()} questions · <span className={mark ? "th-best" : undefined}>{mark ? `Best ${mark.best} of ${mark.of}` : "Not taken yet"}</span></>} />;
          })}
        </motion.ul>}
      </div>}
    </motion.div>
  </LayoutGroup></MotionConfig>;
}

interface CellProps {
  layoutId: string; order?: number; icon: string; n: number; title: string; line: string; meta: ReactNode; chosen?: string; open: string; on: boolean
  onClick: () => void; style?: CSSProperties; press?: boolean
}

/** One cell of the menu, the same as ThemeShelves' Cell, kept as one element through every version. */
function MenuCell({ layoutId, order, icon, n, title, line, meta, chosen, open, on, onClick, style, press }: CellProps) {
  const Icon = iconOf(icon);
  return <motion.li layoutId={layoutId} layout style={{ ...style, "--o": order } as CSSProperties}>
    <button type="button" className={on ? "is-open" : undefined} aria-expanded={press ? undefined : on} aria-pressed={press ? on : undefined} onClick={onClick}>
      <motion.span layout="position" className="th-shelf-top"><span className="th-shelf-icon"><Icon size={24} strokeWidth={1.4} aria-hidden /></span><span className="tm-n">{String(n + 1).padStart(2, "0")}</span></motion.span>
      <motion.strong layout="position">{title}</motion.strong>
      <motion.span layout="position" className="th-shelf-line">{line}</motion.span>
      <motion.span layout="position" className="th-shelf-meta">{meta}</motion.span>
      {chosen && <motion.span layout="position" className="th-shelf-chosen"><Check size={13} strokeWidth={2} aria-hidden />{chosen}</motion.span>}
      <motion.span layout="position" className="th-shelf-open">{open} <ArrowRight size={14} aria-hidden /></motion.span>
    </button>
  </motion.li>;
}
