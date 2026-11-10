// The ways a card leaves the page (design 6.1–6.3), each with its checks and fallbacks, each returning a plain outcome
// for the panel to show. What goes with a picture is the reference and the card's address, never the visitor's own
// line: that is drawn on the picture only.
import { saveFile } from "./canvas";
import type { CardPicture } from "./render";
import type { CardSpec } from "./spec";

export type ShareOutcome = "shared" | "cancelled" | "saved" | "copied" | "retry" | "manual";

/** "John 3:16 (BSB)" and the card's address, on two lines: what goes with the picture. */
export const shareText = (spec: Pick<CardSpec, "passage" | "link">) => `${spec.passage.reference.trim()} (BSB)\n${spec.link}`;

/** "For God so loved the world… — John 3:16 (BSB)" and the link: the format every verse tool on the site copies. */
export const copyText = (spec: Pick<CardSpec, "passage" | "link">) => `${spec.passage.text.trim()} — ${spec.passage.reference.trim()} (BSB)\n${spec.link}`;

function outcomeOf(error: unknown): ShareOutcome {
  const name = error instanceof Error || (typeof error === "object" && error !== null && "name" in error) ? (error as { name: string }).name : "";
  if (name === "AbortError") return "cancelled";
  if (name === "NotAllowedError") return "retry";
  console.warn("verse card: sharing did not work", error);
  return "manual";
}

function pictureFile(picture: CardPicture): File | null {
  try {
    return new File([picture.blob], picture.fileName, { type: "image/png" });
  } catch {
    return null;
  }
}

/** True where the phone's share sheet takes picture files (phones, Safari, Chrome and Edge on Windows). */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([new Uint8Array(1)], "card.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

/** Opens the share sheet with the picture. Must be called straight from the tap, with the picture already made: the
 *  browser allows a share only right after a tap. A refusal for being too late gives "retry". */
export function sharePicture(picture: CardPicture, text: string): Promise<ShareOutcome> {
  const file = pictureFile(picture);
  if (!file || typeof navigator.share !== "function") return Promise.resolve("manual");
  try {
    return navigator.share({ files: [file], text }).then(() => "shared" as const, outcomeOf);
  } catch (error) {
    return Promise.resolve(outcomeOf(error));
  }
}

/** True on a computer (a mouse or trackpad) whose browser can copy pictures. */
export function canCopyPicture(): boolean {
  return typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function"
    && typeof window.matchMedia === "function" && window.matchMedia("(pointer: fine)").matches;
}

/** Copies the picture. The clipboard item is made straight away, holding a promise of the picture, as Safari needs. */
export function copyPicture(picture: Promise<Blob>): Promise<ShareOutcome> {
  try {
    return navigator.clipboard.write([new ClipboardItem({ "image/png": picture })]).then(() => "copied" as const, outcomeOf);
  } catch (error) {
    return Promise.resolve(outcomeOf(error));
  }
}

/** Copies words; "manual" when the browser refuses, so the page shows them to copy by hand. */
export async function copyWords(text: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator.clipboard?.writeText !== "function") return "manual";
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "manual";
  }
}

/** Instagram's, Facebook's and TikTok's own browsers, which block downloads. */
export const isInAppBrowser = (agent: string) => /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Line\//.test(agent);

/** iPhone and iPad, where a download goes to Files rather than Photos. */
export const isAppleMobile = (agent: string, touchPoints: number) => /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && touchPoints > 1);

/** Downloads the picture; "manual" where downloads are blocked, so the page shows it to press and hold. */
export function savePicture(picture: CardPicture): ShareOutcome {
  if (isInAppBrowser(navigator.userAgent)) return "manual";
  try {
    saveFile(picture.blob, picture.fileName);
    return "saved";
  } catch (error) {
    console.warn(`verse card: the download of ${picture.fileName} did not start`, error);
    return "manual";
  }
}
