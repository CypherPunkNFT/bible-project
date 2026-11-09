import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseSiteLanguage, watchShadowRoot } from "./page-translator";

afterEach(() => vi.unstubAllGlobals());

const STRINGS: Record<string, string> = {
  "Even on the dating systems that bring them closest, {n} was born at least {n} before {n}.": "Incluso según los sistemas de datación que los sitúan más cerca, {n} nació al menos {n} antes que {n}.",
  'plural:["{n} year","{n} years"]': JSON.stringify({ one: "{n} año", many: "{n} años", other: "{n} años" }),
  "Open the profile of {n}": "Abrir el perfil de {n}",
  "Dated copies of {n} per century": "Copias fechadas de {n} por siglo",
  "{n} questions": "{n} preguntas",
  "{n} versions": "{n} versiones",
  Romans: "Romanos",
  "Moses: his life": "Moisés: su vida",
};

describe("the page translator with lines built around a value", () => {
  it("fills names and known words into a known line, leaves plain English alone, and enters a handed-in shadow root", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => STRINGS })));
    const add = (tag: string, id: string, text: string) => Object.assign(document.body.appendChild(document.createElement(tag)), { id, textContent: text });
    add("button", "name", "Open the profile of Thomas Watson").setAttribute("aria-label", "Open the profile of Thomas Watson");
    add("p", "known", "Dated copies of Romans per century");
    add("p", "number", "12 versions");
    add("p", "prose", "There are many hard questions");
    add("p", "own-plural", "Even on the dating systems that bring them closest, Moisés was born at least 1200 años before Pedro.");
    add("p", "unknown-plural", "Even on the dating systems that bring them closest, Moisés was born at least 1200 bananas before Pedro.");
    add("p", "unsafe-prose", "Even on the dating systems that bring them closest, Moisés was born at least many hard years before Pedro.");
    const host = document.body.appendChild(document.createElement("div"));
    const shadow = host.attachShadow({ mode: "open" });
    shadow.appendChild(Object.assign(document.createElement("h1"), { textContent: "Moses: his life" }));
    watchShadowRoot(shadow);

    await chooseSiteLanguage("es");
    expect(document.getElementById("name")!.textContent).toBe("Abrir el perfil de Thomas Watson");
    expect(document.getElementById("name")!.getAttribute("aria-label")).toBe("Abrir el perfil de Thomas Watson");
    expect(document.getElementById("known")!.textContent).toBe("Copias fechadas de Romanos por siglo");
    expect(document.getElementById("number")!.textContent).toBe("12 versiones");
    expect(document.getElementById("prose")!.textContent).toBe("There are many hard questions");
    expect(document.getElementById("own-plural")!.textContent).toBe("Incluso según los sistemas de datación que los sitúan más cerca, Moisés nació al menos 1200 años antes que Pedro.");
    expect(document.getElementById("unknown-plural")!.textContent).toBe("Even on the dating systems that bring them closest, Moisés was born at least 1200 bananas before Pedro.");
    expect(document.getElementById("unsafe-prose")!.textContent).toBe("Even on the dating systems that bring them closest, Moisés was born at least many hard years before Pedro.");
    expect(shadow.querySelector("h1")!.textContent).toBe("Moisés: su vida");

    // Words a sealed page writes later are swapped too.
    const later = shadow.appendChild(Object.assign(document.createElement("p"), { textContent: "Open the profile of Aaron" }));
    await new Promise((settled) => setTimeout(settled));
    expect(later.textContent).toBe("Abrir el perfil de Aaron");

    await chooseSiteLanguage("en");
    expect(document.getElementById("name")!.textContent).toBe("Open the profile of Thomas Watson");
    expect(shadow.querySelector("h1")!.textContent).toBe("Moses: his life");
  });
});
