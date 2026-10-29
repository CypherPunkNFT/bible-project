import { Download } from "lucide-react";
import { useState } from "react";
import { prepareScriptureDownload } from "@/lib/scripture-download";
import { runDownload } from "@/components/download/download";
import type { Catalog, Translation } from "@/lib/types";

export function ScriptureDownload({ catalog, version }: { catalog: Catalog; version: Translation }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    setStatus("Preparing download…");
    try {
      // The shared download panel (book loader, percentage, then "Done") shows if this takes more than a moment.
      const ran = await runDownload(`Downloading the ${version.name}`, async report => {
        const blob = await prepareScriptureDownload(catalog, version, (done, total) => {
          setStatus(`Preparing ${done} of ${total} books…`);
          report(total > 0 ? done / total : null);
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${version.slug}-bible.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      });
      setStatus(ran ? "Download ready · TXT" : "Another download is in progress. Try again when it is done.");
    } catch {
      setFailed(true);
      setStatus("Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div>
    <button type="button" onClick={download} disabled={busy} aria-label={`Download ${version.name} as text`}
      title="Free download · UTF-8 text (.txt)"
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-line px-2.5 py-1 hover:bg-surface-2 disabled:cursor-wait disabled:opacity-60">
      <Download className="h-3.5 w-3.5" aria-hidden /> {busy ? "Preparing…" : failed ? "Retry download" : "Download"}
    </button>
    <span role="status" className="mt-1 block max-w-40 text-xs text-muted">{status}</span>
  </div>;
}
