import type { LineString } from "geojson";
import { clampPadding } from "./frame";
import { alongLine, revealFeatures } from "./quest-style";
import { WATER_NAMES, waterNameFeatures } from "./water-names";

type Pt = [number, number];

describe("the reveal's shapes", () => {
  const shape = { pin: [35, 32] as Pt, scored: [36, 33] as Pt, others: [[37, 34] as Pt], color: "#123456" };

  it("draws nothing for no reveal", () => {
    const features = revealFeatures(null);
    expect(features.line.features).toHaveLength(0);
    expect(features.sites.features).toHaveLength(0);
    expect(features.pins.features).toHaveLength(0);
  });

  it("draws the line part of the way while it is being drawn, and all the way when done", () => {
    expect(alongLine([35, 32], [36, 33], 0.5)).toEqual([35.5, 32.5]);
    const half = revealFeatures(shape, 0.5);
    expect((half.line.features[0].geometry as LineString).coordinates).toEqual([[35, 32], [35.5, 32.5]]);
    const whole = revealFeatures(shape);
    expect((whole.line.features[0].geometry as LineString).coordinates).toEqual([[35, 32], [36, 33]]);
    expect(whole.line.features[0].properties).toEqual({ color: "#123456" });
  });

  it("marks the scored site apart from the others, and draws one line and one pin per reveal in the summary", () => {
    const one = revealFeatures(shape);
    expect(one.sites.features.map((f) => f.properties?.scored)).toEqual([false, true]);
    const many = revealFeatures([shape, shape, shape]);
    expect(many.line.features).toHaveLength(3);
    expect(many.pins.features).toHaveLength(3);
    expect(many.sites.features).toHaveLength(6);
  });

  it("draws a river or region whole in the result's colour, with no site dot", () => {
    const area = { type: "LineString" as const, coordinates: [[35.5, 31], [35.5, 33]] };
    const features = revealFeatures({ ...shape, others: [], area });
    expect(features.areas.features).toHaveLength(1);
    expect(features.areas.features[0]).toMatchObject({ geometry: area, properties: { color: "#123456" } });
    expect(features.sites.features).toHaveLength(0);
    expect(revealFeatures(shape).areas.features).toHaveLength(0);
  });
});

describe("the padding around a framed answer", () => {
  it("passes small padding through untouched", () => {
    expect(clampPadding({ top: 48, right: 48, bottom: 48, left: 420 }, 1200, 600)).toEqual({ top: 48, right: 48, bottom: 48, left: 420 });
  });
  it("shrinks padding that would leave no room for the map", () => {
    const pad = clampPadding({ top: 40, bottom: 250, left: 32, right: 32 }, 358, 300);
    expect(pad.top + pad.bottom).toBeLessThanOrEqual(180);
    expect(pad.left + pad.right).toBe(64);
  });
});

describe("the Beginner water names", () => {
  it("is a feature per name, each with the zoom it appears from", () => {
    const features = waterNameFeatures().features;
    expect(features).toHaveLength(WATER_NAMES.length);
    expect(features.map((f) => f.properties?.name)).toContain("Sea of Galilee");
    for (const f of features) expect(typeof f.properties?.from).toBe("number");
  });

  it("leaves out the water being asked, so Beginner never names the answer", () => {
    const galilee = WATER_NAMES.find((water) => water.name === "Sea of Galilee")!;
    const names = waterNameFeatures(galilee.placeId).features.map((f) => f.properties?.name);
    expect(names).not.toContain("Sea of Galilee");
    expect(names).toHaveLength(WATER_NAMES.length - 1);
  });
});
