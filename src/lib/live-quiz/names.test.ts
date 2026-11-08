import { checkName, friendlyName, isBlockedName, isFriendlyName, normaliseName } from "./names";

describe("player names", () => {
  it("trims, normalises and strips invisible characters", () => {
    expect(normaliseName("  Sam\u200b \u0007 B  ")).toBe("Sam B");
    expect(normaliseName("Ｓａｍ")).toBe("Sam");
  });

  it("accepts 1–16 characters with a letter or digit", () => {
    expect(checkName("Sam", "typed")).toEqual({ ok: true, name: "Sam" });
    expect(checkName("\u200b\u200b", "typed")).toEqual({ ok: false, error: "name-invalid" });
    expect(checkName("x".repeat(17), "typed")).toEqual({ ok: false, error: "name-invalid" });
    expect(checkName("!!!", "typed")).toEqual({ ok: false, error: "name-invalid" });
    expect(checkName("يوسف", "typed").ok).toBe(true);
  });

  it("blocks obvious words, masked ones too, without blocking ordinary names", () => {
    expect(isBlockedName("sh1t head")).toBe(true);
    expect(isBlockedName("Big Dick")).toBe(true);
    for (const name of ["Dickens", "Cassie", "Hannah", "Shelley", "Matthew"]) expect(isBlockedName(name)).toBe(false);
  });

  it("generates picker names the room will accept", () => {
    let seed = 0;
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 50; i++) {
      const name = friendlyName(random);
      expect(isFriendlyName(name)).toBe(true);
      expect(checkName(name, "picker")).toEqual({ ok: true, name });
    }
    expect(isFriendlyName("Gentle Dove Extra")).toBe(false);
  });
});
