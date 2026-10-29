// The complete catalogue download with the book loader and its percentage (owner, 2026-10-29), shared by the
// "Download complete catalogue" link and the "Download complete table & works" button.
//
// The link keeps its own address, which a Pages Function serves as the joined zip, for middle-click, "Save link as"
// and readers without scripts. A plain click fetches the same release parts here instead, so the page can show how
// far along it is and check each part's SHA-256. If that cannot run (offline part, an old browser), the link's own
// address is downloaded as before; a part that fails its check is reported and never handed over by another route.
import type { MouseEvent } from "react";
import { downloadBusy, runDownload } from "@/components/download/download";
import { ExportIntegrityError, POPULATION_BASE, downloadPopulationExport } from "../population";

export const EXPORT_ADDRESS = `${POPULATION_BASE}/scholars-library-export.zip`;
const LABEL = "Downloading the complete catalogue";

/** Download the export from the link's own address, as the browser would (not through the click handler). */
function downloadFromAddress(address: string) {
  const link = document.createElement("a");
  link.href = address;
  link.download = "scholars-library-export.zip";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Run the download with the panel. Resolves to an error message for the reader, or "" when it went (or was
 *  passed to the address). */
export async function downloadCompleteCatalogue(address = EXPORT_ADDRESS): Promise<string> {
  try {
    await runDownload(LABEL, report => downloadPopulationExport(report));
    return "";
  } catch (error) {
    if (error instanceof ExportIntegrityError) return `${error.message} The download was stopped; please try again later.`;
    downloadFromAddress(address);
    return "";
  }
}

/** onClick for a link to the export: a plain left click runs the download here; any other click is the link's own. */
export function onExportLinkClick(event: MouseEvent<HTMLAnchorElement>, onError: (message: string) => void) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (downloadBusy()) return;
  onError("");
  void downloadCompleteCatalogue(event.currentTarget.href).then(onError);
}
