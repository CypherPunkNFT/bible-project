import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage } from "./page-translator";

afterEach(() => vi.unstubAllGlobals());

const STRINGS: Record<string, string> = {
  Matthew: "Mateo",
  "{n} proof-texts": "{n} textos de prueba",
  "Long Memory": "Memoria larga",
  Ahab: "Acab",
  "King of Israel": "Rey de Israel",
  "{n} years": "{n} años",
  "The vision of four beasts": "La visión de las cuatro bestias",
};

describe("the page translator with a piece that opens or closes a line", () => {
  it("translates what follows a leading dot or precedes a trailing one, and keeps the dot", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => STRINGS })));
    const add = (id: string, text: string) => Object.assign(document.body.appendChild(document.createElement("span")), { id, textContent: text });
    add("reference", "· Matthew 4:18–20");
    add("count", "· 74 proof-texts");
    add("title", "Long Memory ·");
    add("unknown", "· nothing known here");
    add("icon", "❝ The vision of four beasts");
    add("commas", "Ahab, King of Israel, 22 years");
    add("half", "Ahab, King of Israel, who did evil");

    await chooseSiteLanguage("es");
    expect(document.getElementById("icon")!.textContent).toBe("❝ La visión de las cuatro bestias");
    expect(document.getElementById("commas")!.textContent).toBe("Acab, Rey de Israel, 22 años");
    expect(document.getElementById("half")!.textContent).toBe("Ahab, King of Israel, who did evil");
    expect(document.getElementById("reference")!.textContent).toBe("· Mateo 4:18–20");
    expect(document.getElementById("count")!.textContent).toBe("· 74 textos de prueba");
    expect(document.getElementById("title")!.textContent).toBe("Memoria larga ·");
    expect(document.getElementById("unknown")!.textContent).toBe("· nothing known here");
  });
});
