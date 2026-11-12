import { motifOf } from "./motif";

describe("motifOf", () => {
  it("reads a crown for kings, waves for the Flood and a cross for the crucifixion", () => {
    expect(motifOf("David is made king at Hebron")).toBe("crown");
    expect(motifOf("The Flood")).toBe("waves");
    expect(motifOf("Jesus is crucified")).toBe("cross");
    expect(motifOf("Israel leaves Egypt")).toBe("card");
  });
  it("prefers the rarer word: a crucifixion in Jerusalem is a cross, not a temple", () => {
    expect(motifOf("Jesus is crucified outside Jerusalem")).toBe("cross");
    expect(motifOf("Solomon begins building the temple")).toBe("temple");
    expect(motifOf("The Ten Commandments at Sinai")).toBe("mountain");
  });
  it("never throws on an empty label", () => {
    expect(motifOf("")).toBe("card");
  });
});
