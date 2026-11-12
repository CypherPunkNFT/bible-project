import { hashName, identityOf, SYMBOLS, TONES } from "./identity";

describe("a player's symbol and colour", () => {
  it("come from the name alone, the same every time and whatever the case", () => {
    expect(identityOf("Gentle Dove")).toEqual(identityOf("gentle dove"));
    expect(identityOf("Ruth")).toEqual(identityOf("Ruth"));
    expect(hashName("Ruth")).not.toBe(hashName("Boaz"));
  });

  it("always land on a known symbol and a site colour, for any script", () => {
    for (const name of ["Ruth", "Boaz", "Naomi", "Иван", "مريم", "😀", ""]) {
      const { symbol, tone } = identityOf(name);
      expect(SYMBOLS).toContain(symbol);
      expect(TONES).toContain(tone);
    }
  });

  it("spread a room of names over more than one symbol and colour", () => {
    const names = ["Ruth", "Boaz", "Naomi", "Sam", "Ann", "Peter", "Mary", "John", "Esther", "Daniel", "Hannah", "Levi"];
    expect(new Set(names.map((n) => identityOf(n).symbol)).size).toBeGreaterThan(3);
    expect(new Set(names.map((n) => identityOf(n).tone)).size).toBeGreaterThan(2);
  });
});
