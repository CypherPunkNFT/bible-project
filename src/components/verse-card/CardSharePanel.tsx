// The ready-made share panel any page can drop in (docs/features/verse-cards/design.md 3.4): a live preview, the designs,
// the sizes (each saying when the words are too long for it), an optional line of the visitor's own, and the share
// buttons. The visitor's line is drawn on the picture only: it never reaches the link or the share text.
import { useMemo, useState } from "react";
import { canvasMeasure } from "@/lib/verse-card/canvas";
import { fitSizes } from "@/lib/verse-card/layout";
import { BUILT_IN_LOOKS, LOOK_IDS, type Look, type LookId } from "@/lib/verse-card/looks";
import { SIZES, SIZE_IDS, type SizeId } from "@/lib/verse-card/sizes";
import { MAX_LINE, MAX_LINES, cardProblems, type CardSpec } from "@/lib/verse-card/spec";
import { useCardFonts, useCardPicture } from "@/lib/verse-card/use-card-picture";
import { CardCanvas } from "./CardCanvas";
import { ShareButtons } from "./ShareButtons";
import "./verse-card.css";

interface Props {
  /** The feature's card, without the visitor's line. */
  spec: CardSpec;
  sizes?: readonly SizeId[];
  looks?: readonly (LookId | Look)[];
  /** Offer "Add a line (optional)". */
  allowLine?: boolean;
  initialSize?: SizeId;
  /** The card's address for a design (the card page puts the design in its link); the spec's own link otherwise. */
  linkForLook?: (look: string) => string;
  onLookChange?: (look: string) => void;
}

const lookId = (look: LookId | Look) => (typeof look === "string" ? look : look.id);
const lookOf = (look: LookId | Look): Look => (typeof look === "string" ? BUILT_IN_LOOKS[look] : look);
const swatch = (look: Look) => (typeof look.background === "string" ? look.background : `linear-gradient(135deg, ${look.background.from}, ${look.background.to})`);

export function CardSharePanel({ spec, sizes = SIZE_IDS, looks = LOOK_IDS, allowLine = false, initialSize, linkForLook, onLookChange }: Props) {
  const startLook = looks.find((look) => lookId(look) === lookId(spec.look)) ?? looks[0];
  const [look, setLook] = useState<LookId | Look>(startLook);
  const [size, setSize] = useState<SizeId>(initialSize && sizes.includes(initialSize) ? initialSize : sizes[0]);
  const [line, setLine] = useState("");
  const room = allowLine && (spec.lines?.length ?? 0) < MAX_LINES;
  const card = useMemo<CardSpec>(() => ({
    ...spec,
    look,
    link: linkForLook ? linkForLook(lookId(look)) : spec.link,
    lines: room && line.trim() ? [...(spec.lines ?? []), line] : spec.lines,
  }), [spec, look, linkForLook, room, line]);
  const problems = cardProblems(card);
  const usable = problems.length === 0;
  const fontLoads = useCardFonts(usable ? card : null);
  const fit = useMemo(() => {
    if (!usable || fontLoads < 0) return null; // measured again each time more lettering has loaded: the widths change
    const measuring = document.createElement("canvas").getContext("2d");
    return fitSizes(card, canvasMeasure(measuring), sizes);
  }, [card, sizes, usable, fontLoads]);
  const fits = (id: SizeId) => fit?.fits.find((entry) => entry.id === id)?.fits ?? false;
  // A size the words no longer fit shows the size where they are largest, and comes back when they fit again.
  const shownSize = fit && !fits(size) && fit.best ? fit.best : size;
  const { picture, error } = useCardPicture(usable && fits(shownSize) ? card : null, shownSize);

  const chooseLook = (next: LookId | Look) => { setLook(next); onLookChange?.(lookId(next)); };

  if (!usable) return <p className="vc-problem" role="alert">{problems.join(" ")}</p>;
  return (
    <div className="vc-panel">
      <CardCanvas spec={card} size={shownSize} className={`vc-preview vc-${shownSize}`} />
      <div className="vc-controls">
        <fieldset className="vc-choices">
          <legend>Design</legend>
          {looks.map((choice) => {
            const shown = lookOf(choice);
            return <button key={shown.id} type="button" className="vc-look" aria-pressed={lookId(look) === shown.id} onClick={() => chooseLook(choice)}>
              <span className="vc-swatch" style={{ background: swatch(shown), color: shown.text }} aria-hidden>Aa</span>
              <span>{shown.name}</span>
            </button>;
          })}
        </fieldset>
        <fieldset className="vc-choices vc-sizes">
          <legend>Size</legend>
          {sizes.map((id) => (
            <button key={id} type="button" className="vc-size" aria-pressed={shownSize === id} disabled={!fits(id)} onClick={() => setSize(id)}>
              <span>{SIZES[id].label}</span>
              {!fits(id) && <small>Too long for this size</small>}
            </button>
          ))}
        </fieldset>
        {room && <label className="vc-line">
          <span>Add a line (optional)</span>
          <input type="text" value={line} maxLength={MAX_LINE} onChange={(event) => setLine(event.target.value)} placeholder="Praying for you, Sam" />
        </label>}
        <ShareButtons spec={card} size={shownSize} picture={picture} failed={error !== null} />
      </div>
    </div>
  );
}
