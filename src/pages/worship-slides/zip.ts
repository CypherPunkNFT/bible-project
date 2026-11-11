// A zip file written in the browser, every entry stored as it is (no compression): what a PowerPoint file is inside, and
// how the slide pictures are downloaded together. PNG pictures are compressed already and a deck's XML is small, so
// storing costs little and needs no library. The layout is PKWARE's APPNOTE: a local header before each entry, then the
// central directory, then its end record. Names are UTF-8 (flag bit 11). Zip64 is not needed: a deck stays far below 4 GB.

export interface ZipEntry { name: string; data: Uint8Array }

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** The CRC-32 a zip records for each entry (the one gzip and PNG use too). */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS time and date, as zip headers keep them (two-second steps, years from 1980). */
export function dosDateTime(when: Date): { time: number; date: number } {
  const year = Math.max(1980, Math.min(2107, when.getFullYear()));
  return {
    time: (when.getHours() << 11) | (when.getMinutes() << 5) | Math.floor(when.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate(),
  };
}

const UTF8_NAMES = 0x0800;
const VERSION = 20;

/** The zip file as pieces to hand to `new Blob(...)`, entries in the order given (a PowerPoint file wants
 *  [Content_Types].xml first). Each entry's bytes are used as they are, never copied into one big array. */
export function makeZip(entries: readonly ZipEntry[], when = new Date()): Uint8Array[] {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(when);
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry.name || entry.name.startsWith("/") || entry.name.includes("\\") || seen.has(entry.name)) {
      throw new Error(`zip: entry name "${entry.name}" is empty, absolute, uses a backslash or is repeated`);
    }
    seen.add(entry.name);
  }
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const local = new Uint8Array(30 + name.length);
    const head = new DataView(local.buffer);
    head.setUint32(0, 0x04034b50, true);
    head.setUint16(4, VERSION, true);
    head.setUint16(6, UTF8_NAMES, true);
    head.setUint16(8, 0, true); // stored
    head.setUint16(10, time, true);
    head.setUint16(12, date, true);
    head.setUint32(14, crc, true);
    head.setUint32(18, entry.data.length, true);
    head.setUint32(22, entry.data.length, true);
    head.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(local, entry.data);

    const record = new Uint8Array(46 + name.length);
    const line = new DataView(record.buffer);
    line.setUint32(0, 0x02014b50, true);
    line.setUint16(4, VERSION, true);
    line.setUint16(6, VERSION, true);
    line.setUint16(8, UTF8_NAMES, true);
    line.setUint16(12, time, true);
    line.setUint16(14, date, true);
    line.setUint32(16, crc, true);
    line.setUint32(20, entry.data.length, true);
    line.setUint32(24, entry.data.length, true);
    line.setUint16(28, name.length, true);
    // extra, comment, disk, internal and external attributes stay 0
    line.setUint32(42, offset, true);
    record.set(name, 46);
    central.push(record);
    offset += local.length + entry.data.length;
  }
  const centralSize = central.reduce((sum, record) => sum + record.length, 0);
  const end = new Uint8Array(22);
  const tail = new DataView(end.buffer);
  tail.setUint32(0, 0x06054b50, true);
  tail.setUint16(8, entries.length, true);
  tail.setUint16(10, entries.length, true);
  tail.setUint32(12, centralSize, true);
  tail.setUint32(16, offset, true);
  return [...parts, ...central, end];
}

/** The pieces joined into one array: for tests, and anything that needs the bytes rather than a Blob. */
export function joinParts(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) { out.set(part, at); at += part.length; }
  return out;
}
