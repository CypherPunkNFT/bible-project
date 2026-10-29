// Serves the complete scholars catalogue zip at its single address. The zip is over Pages' 25 MiB per-file limit, so the
// release ships it only as parts (scripts/prepare-population-hosting.mjs); without this the address fell through to
// the site's index.html. The parts are joined in the runtime, so a download costs almost no Worker CPU.
type Assets = { fetch: typeof fetch };
interface ZipPart { file: string; bytes: number }

const BASE = "/content/scholar-population/";
const NAME = "scholars-library-export.zip";
const PART = /^scholars-library-export\.part-(\d+)\.bin$/;

const problem = (status: number, message: string, extra: HeadersInit = {}) =>
  new Response(message + "\n", { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...extra } });

/** A static file fetched by address alone, so the visitor's Range or caching headers can never return part of it. */
const asset = (assets: Assets, request: Request, file: string) => assets.fetch(new Request(new URL(BASE + file, request.url)));

const isHtml = (response: Response) => (response.headers.get("Content-Type") ?? "").includes("text/html");

/** The parts in order, or the reason the manifest cannot be trusted. */
function checkedParts(manifest: { zipParts?: ZipPart[]; zipBytes?: number }): ZipPart[] | string {
  const parts = manifest.zipParts ?? [];
  for (const [i, part] of parts.entries()) {
    if (PART.exec(part.file)?.[1] !== String(i)) return `Part ${i} is listed as "${part.file}"; expected scholars-library-export.part-${i}.bin.`;
    if (!Number.isSafeInteger(part.bytes) || part.bytes <= 0) return `Part ${part.file} has an invalid size: ${part.bytes}.`;
  }
  const total = parts.reduce((sum, part) => sum + part.bytes, 0);
  return total === manifest.zipBytes ? parts : `The parts add up to ${total} bytes; the manifest expects ${manifest.zipBytes}.`;
}

/** Without parts (local builds keep the original zip) the original is served, but never the HTML fallback page. */
async function original(assets: Assets, request: Request): Promise<Response> {
  const response = await asset(assets, request, NAME);
  if (response.status === 200 && !isHtml(response)) return response;
  await response.body?.cancel();
  return problem(503, "The complete catalogue is not in this release (no zip and no zip parts).");
}

export async function servePopulationExport(request: Request, assets: Assets, waitUntil: (work: Promise<unknown>) => void): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return problem(405, "Only GET and HEAD are allowed.", { Allow: "GET, HEAD" });
  const hosting = await asset(assets, request, "hosting.json");
  if (hosting.status !== 200 || isHtml(hosting)) { await hosting.body?.cancel(); return original(assets, request); }
  const parts = checkedParts(await hosting.json());
  if (typeof parts === "string") return problem(500, "The catalogue manifest is inconsistent: " + parts);
  if (!parts.length) return original(assets, request);
  const total = parts.reduce((sum, part) => sum + part.bytes, 0);
  const headers = { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${NAME}"`, "Content-Length": String(total),
    "Cache-Control": "no-cache", "Accept-Ranges": "none", "X-Content-Type-Options": "nosniff" };
  if (request.method === "HEAD") return new Response(null, { headers });
  // Every part is checked before the 200 goes out: a missing part must be an error, not a download that stops short.
  const responses = await Promise.all(parts.map((part) => asset(assets, request, part.file)));
  const bad = responses.findIndex((response) => response.status !== 200 || isHtml(response));
  if (bad >= 0) {
    await Promise.all(responses.map((response) => response.body?.cancel()));
    return problem(502, `Catalogue part ${parts[bad].file} could not be read (status ${responses[bad].status}, ${responses[bad].headers.get("Content-Type")}).`);
  }
  // A fixed length makes a short or long join fail the download rather than finish as a corrupt file.
  const { readable, writable } = new FixedLengthStream(total);
  waitUntil((async () => {
    for (const response of responses) await response.body!.pipeTo(writable, { preventClose: true });
    await writable.close();
  })().catch(async (error: unknown) => {
    console.error("Catalogue zip stream failed:", error);
    await Promise.all(responses.map((response) => response.body?.cancel().catch(() => undefined)));
    await writable.abort(error).catch(() => undefined);
  }));
  return new Response(readable, { headers });
}
