// The share panel's buttons (design 6.1–6.3): Share picture, Save picture, Copy picture, Copy link, Copy text, each shown
// only where it can work, with a status line and the site's usual fallbacks: a box to copy by hand, and the picture shown
// to press and hold where downloads are blocked. Share uses the picture already made, straight from the tap.
import { useEffect, useRef, useState } from "react";
import { renderCard, type CardPicture } from "@/lib/verse-card/render";
import { canCopyPicture, canShareFiles, copyPicture, copyText, copyWords, isAppleMobile, savePicture, sharePicture, shareText, type ShareOutcome } from "@/lib/verse-card/share";
import type { SizeId } from "@/lib/verse-card/sizes";
import type { CardSpec } from "@/lib/verse-card/spec";

const SAVED_ON_IPHONE = "Saved to Files. To put it in Photos, use Share picture, then Save Image.";
const STILL_MAKING = "The picture is still being made. Try again in a moment.";

export function ShareButtons({ spec, size, picture, failed }: { spec: CardSpec; size: SizeId; picture: CardPicture | null; failed: boolean }) {
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState<string | null>(null);
  const [pressAndHold, setPressAndHold] = useState<string | null>(null);
  const [retry, setRetry] = useState(false);
  const sharing = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [{ share, copy }] = useState(() => ({ share: canShareFiles(), copy: canCopyPicture() }));
  const words = shareText(spec);

  const cardKey = JSON.stringify([words, size, spec.look, spec.lines]);
  useEffect(() => { setStatus(""); setRetry(false); setPressAndHold(null); }, [cardKey]);
  useEffect(() => { if (manual !== null) { textarea.current?.focus(); textarea.current?.select(); } }, [manual]);
  useEffect(() => () => { if (pressAndHold) URL.revokeObjectURL(pressAndHold); }, [pressAndHold]);

  const show = (outcome: ShareOutcome, done: string, fallback: () => void) => {
    if (outcome === "shared" || outcome === "copied" || outcome === "saved") setStatus(done);
    else if (outcome === "retry") { setRetry(true); setStatus(""); }
    else if (outcome === "manual") fallback();
  };
  const onShare = () => {
    if (!picture) { setRetry(true); setStatus(STILL_MAKING); return; }
    if (sharing.current) return;
    sharing.current = true;
    setRetry(false);
    void sharePicture(picture, words).then((outcome) => show(outcome, "Shared", () => setStatus("Sharing did not work here. Save the picture instead.")))
      .finally(() => { sharing.current = false; });
  };
  const onSave = () => {
    if (!picture) { setStatus(STILL_MAKING); return; }
    show(savePicture(picture), isAppleMobile(navigator.userAgent, navigator.maxTouchPoints ?? 0) ? SAVED_ON_IPHONE : "Saved", () => {
      setPressAndHold(URL.createObjectURL(picture.blob));
      setStatus("");
    });
  };
  const onCopyPicture = () => {
    const blob = picture ? Promise.resolve(picture.blob) : renderCard(spec, size).then((made) => made.blob);
    void copyPicture(blob).then((outcome) => show(outcome, "Picture copied", () => setStatus("Copying the picture did not work here. Save it instead.")));
  };
  const onCopyWords = (text: string, done: string) => { void copyWords(text).then((outcome) => show(outcome, done, () => setManual(text))); };

  return (
    <div className="vc-buttons">
      <div className="vc-actions">
        {share && <button type="button" className="vc-primary" onClick={onShare} disabled={failed}>
          {retry && picture ? "Your picture is ready: tap to share" : retry ? "Making the picture…" : "Share picture"}
        </button>}
        <button type="button" className={share ? "" : "vc-primary"} onClick={onSave} disabled={failed}>Save picture</button>
        {copy && <button type="button" onClick={onCopyPicture} disabled={failed}>Copy picture</button>}
        <button type="button" onClick={() => onCopyWords(spec.link, "Link copied")}>Copy link</button>
        <button type="button" onClick={() => onCopyWords(copyText(spec), "Copied")}>Copy text</button>
      </div>
      <p role="status" className="vc-status">{failed ? "This browser could not make the picture. Copy the text instead." : status}</p>
      {manual !== null && <label className="vc-manual">Press and hold to copy<textarea ref={textarea} readOnly value={manual} /></label>}
      {pressAndHold && <figure className="vc-hold">
        <img src={pressAndHold} alt={`The verse card picture of ${spec.passage.reference}`} />
        <figcaption>Press and hold the picture to save it.</figcaption>
      </figure>}
    </div>
  );
}
