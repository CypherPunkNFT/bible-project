// The card's QR code, drawn as SVG squares from the existing `qrcode` package (no image, no network). It always points at
// the public page address it is given; null when the code cannot be made, and the card then prints without it.
import QRCode from "qrcode";

export function qrModules(url: string): { size: number; path: string } | null {
  try {
    const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
    const parts: string[] = [];
    for (let row = 0; row < modules.size; row++) {
      for (let column = 0; column < modules.size; column++) if (modules.get(row, column)) parts.push(`M${column} ${row}h1v1h-1z`);
    }
    return { size: modules.size, path: parts.join("") };
  } catch (error) {
    console.warn(`life-events: the QR code for ${url} could not be made; the card prints without it`, error);
    return null;
  }
}
