// Reading a download's body while counting the bytes, for the download panel's percentage.

/** Read `response`'s body to the end, calling `onBytes` with the bytes received so far. With `expected`, the bytes go
 *  straight into one buffer of that size (no second copy on phones) and a longer body is refused. */
export async function readWithProgress(response: Response, onBytes: (received: number) => void, expected?: number): Promise<Uint8Array<ArrayBuffer>> {
  if (!response.body) {
    const all = new Uint8Array(await response.arrayBuffer());
    onBytes(all.byteLength);
    return all;
  }
  const reader = response.body.getReader();
  const fixed = expected !== undefined && expected >= 0 ? new Uint8Array(expected) : null;
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (fixed) {
      if (received + value.byteLength > fixed.byteLength) {
        await reader.cancel();
        throw new Error(`The download is longer than the expected ${fixed.byteLength.toLocaleString()} bytes.`);
      }
      fixed.set(value, received);
    } else chunks.push(value);
    received += value.byteLength;
    onBytes(received);
  }
  if (fixed) return received === fixed.byteLength ? fixed : fixed.subarray(0, received);
  const all = new Uint8Array(received);
  let at = 0;
  for (const chunk of chunks) { all.set(chunk, at); at += chunk.byteLength; }
  return all;
}

/** A Content-Length usable as a total: present, positive, and of the bytes as they arrive (not compressed). */
export function knownLength(response: Response): number | null {
  if (response.headers.get("content-encoding")) return null;
  const length = Number(response.headers.get("content-length"));
  return Number.isFinite(length) && length > 0 ? length : null;
}
