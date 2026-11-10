// The page's side of picture-making (design 6.2): the full-size PNG is made in the background 150 ms after the last change
// of design, size or line, and only the newest one is kept, so Share hands over a finished picture straight after the
// tap. `useCardFonts` tells a preview when the lettering is ready to draw.
import { useEffect, useMemo, useRef, useState } from "react";
import { cardFontsReady, cardLetters, releaseCanvas, renderCard, type CardPicture } from "./render";
import type { SizeId } from "./sizes";
import { resolveCard, type CardSpec } from "./spec";

export interface PictureState {
  /** The picture of exactly this card and size, or null while it is being made. */
  picture: CardPicture | null;
  /** A sentence for the visitor when the browser could not make the picture. */
  error: string | null;
}

export const NO_PICTURE = "This browser could not make the picture. Copy the text instead.";

/** The newest finished picture of `spec` at `size`; null spec makes nothing. */
export function useCardPicture(spec: CardSpec | null, size: SizeId, delayMs = 150): PictureState {
  const key = spec ? JSON.stringify([spec, size]) : "";
  const [done, setDone] = useState<{ key: string; picture: CardPicture | null; error: string | null }>({ key: "", picture: null, error: null });
  const latest = useRef(spec);
  latest.current = spec;
  useEffect(() => {
    const current = latest.current;
    if (!current) return;
    let wanted = true;
    const timer = window.setTimeout(() => {
      renderCard(current, size)
        .then((picture) => { if (wanted) setDone({ key, picture, error: null }); })
        .catch((error: unknown) => {
          console.error(`verse card: the ${size} picture could not be made`, error);
          if (wanted) setDone({ key, picture: null, error: NO_PICTURE });
        });
    }, delayMs);
    return () => { wanted = false; window.clearTimeout(timer); };
  }, [key, size, delayMs]);
  useEffect(() => releaseCanvas, []);
  return done.key === key ? { picture: done.picture, error: done.error } : { picture: null, error: null };
}

/** Counts finished lettering waits for the live preview: 0 until the card's fonts first load (or three seconds pass),
 *  then one more each time new letters have loaded, so the preview redraws without flickering back to "Loading". */
export function useCardFonts(spec: CardSpec | null): number {
  const card = useMemo(() => { try { return spec ? resolveCard(spec, () => {}) : null; } catch { return null; } }, [spec]);
  const letters = card ? cardLetters(card) : "";
  const [loads, setLoads] = useState(0);
  const latest = useRef(card);
  latest.current = card;
  useEffect(() => {
    const current = latest.current;
    if (!current) return;
    let wanted = true;
    void cardFontsReady(current).finally(() => { if (wanted) setLoads((count) => count + 1); });
    return () => { wanted = false; };
  }, [letters]);
  return loads;
}
