import { describe, expect, it } from "vitest";
import { hashDistance, variantStatus, type Decision, type ShotManifest, type Template } from "./review-data";

const template: Template = {
  id: "ruler", area: "people", name: "Ruler page", what: "", address: "/people/<id>/rule", instances: 2, sources: [], sourceHash: "aaaa", signature: null,
  variants: [{ id: "judge", name: "Judge", what: "", instances: 2, samples: [{ id: "typical", label: "Typical", url: "/people/x/rule", why: "" }] }],
};
const variant = template.variants[0];
const shots = (hash: string): ShotManifest => ({
  schema: 1, commit: "c", takenAt: "", base: "",
  images: { "ruler/judge/typical": Object.fromEntries(["desktop-light", "desktop-dark", "phone-light", "phone-dark"].map((k) => [k, { full: "", crop: null, thumb: "", hash, height: 1, clipped: false }])) },
});
const decision = (over: Partial<Decision>): Decision => ({
  id: "1", template: "ruler", variant: "judge", viewport: "all", theme: "all", status: "accepted", note: "", at: "2026-10-08T00:00:00Z", commit: "c", sourceHash: "aaaa",
  shotHashes: Object.fromEntries(["desktop-light", "desktop-dark", "phone-light", "phone-dark"].map((k) => [`typical/${k}`, "0000000000000000"])), ...over,
});

describe("design review status", () => {
  it("counts differing bits between two hashes", () => {
    expect(hashDistance("0000000000000000", "0000000000000000")).toBe(0);
    expect(hashDistance("0000000000000000", "000000000000000f")).toBe(4);
    expect(hashDistance("00", "0000")).toBe(64);
  });

  it("is not reviewed with no decisions, accepted once accepted for all views", () => {
    expect(variantStatus([], shots("0000000000000000"), template, variant).status).toBe("not-reviewed");
    expect(variantStatus([decision({})], shots("0000000000000000"), template, variant).status).toBe("accepted");
  });

  it("stays not reviewed when only the phone was accepted", () => {
    expect(variantStatus([decision({ viewport: "phone" })], shots("0000000000000000"), template, variant).status).toBe("not-reviewed");
  });

  it("needs changes when the newest decision for any view says so", () => {
    const later = decision({ id: "2", status: "needs-changes", note: "too tight", theme: "dark", at: "2026-10-09T00:00:00Z" });
    expect(variantStatus([decision({}), later], shots("0000000000000000"), template, variant).status).toBe("needs-changes");
  });

  it("is changed since accepted when the code or the screenshots moved", () => {
    expect(variantStatus([decision({ sourceHash: "bbbb" })], shots("0000000000000000"), template, variant).status).toBe("changed");
    expect(variantStatus([decision({})], shots("ffffffffffffffff"), template, variant).status).toBe("changed");
    expect(variantStatus([decision({})], shots("0000000000000003"), template, variant).status).toBe("accepted"); // 2 bits: the same picture
  });
});
