// Getting the testimony out of the browser (design §3.2, §3.3 and §9): a file download with the right type, a copy to
// the clipboard with its formatted version where the browser takes it, and reading a chosen draft file. Each says when
// the browser cannot do it, so the page can offer the text to copy by hand instead. Nothing here sends anything anywhere.
export { readFileText } from "@/pages/scripture-memory/files";

export type FileType = "text/plain;charset=utf-8" | "text/html;charset=utf-8" | "application/json";

/** Saves `text` as a file through a Blob download; false where this browser has no object URLs (some in-app browsers). */
export function download(name: string, text: string, type: FileType): boolean {
  if (typeof URL.createObjectURL !== "function" || typeof URL.revokeObjectURL !== "function") return false;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/** Copies `plain` (and `html` too where the browser takes both); false when the clipboard is blocked or missing. */
export async function copyText(plain: string, html: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      })]);
      return true;
    }
  } catch (error) {
    console.warn("Testimony builder: the clipboard refused the formatted testimony; copying it as plain text", error);
  }
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(plain);
    return true;
  } catch (error) {
    console.warn("Testimony builder: the clipboard refused the testimony; showing it to copy by hand", error);
    return false;
  }
}
