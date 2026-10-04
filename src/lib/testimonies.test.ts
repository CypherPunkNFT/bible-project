import { describe, expect, it } from "vitest";
import { TESTIMONY_DEMO } from "@/data/testimony-demo";
import { immediatePublication, testimonyBranch, testimonyPath, validateTestimony } from "./testimonies";

describe("testimony design contract", () => {
  it("follows invitation ancestry and selects only the chosen branch", () => {
    expect(testimonyPath(TESTIMONY_DEMO, "noah").map((n) => n.name)).toEqual(["Daniel", "Maya", "Joseph", "Noah"]);
    expect(testimonyBranch(TESTIMONY_DEMO, "maya").map((n) => n.id)).toEqual(["maya", "joseph", "ruth", "noah"]);
    expect(testimonyBranch(TESTIMONY_DEMO, "missing")).toEqual([]);
  });
  it("stops traversal if damaged data contains a cycle", () => {
    const nodes = TESTIMONY_DEMO.map((n) => n.id === "daniel" ? { ...n, parentId: "noah" } : n);
    expect(testimonyPath(nodes, "noah")).toHaveLength(4);
    expect(testimonyBranch(nodes, "daniel")).toHaveLength(9);
  });
  it("requires a confirmed publish action while the connection comes from the invitation", () => {
    const input = { name: "A guest", title: "A sample story", blurb: "A short introduction to this fictional story.", body: "This is fictional sample text for testing the invitation flow. It is long enough to meet the written story minimum.", theme: "", happenedWhen: "", publicConsent: true };
    expect(validateTestimony(input)).toBeNull();
    expect(validateTestimony({ ...input, publicConsent: false })).toMatch(/publicly/);
    expect(validateTestimony({ ...input, body: "" })).toBeNull();
    expect(validateTestimony({ ...input, blurb: "brief" })).toMatch(/20 and 600/);
    expect(validateTestimony({ ...input, blurb: "x".repeat(601) })).toMatch(/20 and 600/);
    expect(validateTestimony({ ...input, body: "faith ".repeat(5000) })).toBeNull();
    expect(validateTestimony({ ...input, body: "x".repeat(100001) })).toMatch(/100,000/);
    expect(validateTestimony({ ...input, theme: "Hope", happenedWhen: "Around 2020" })).toBeNull();
    expect(validateTestimony({ ...input, theme: "Unknown label" })).toMatch(/story themes/);
    expect(validateTestimony({ ...input, happenedWhen: "x".repeat(81) })).toMatch(/80/);
  });
  it("publishes by the owner's chosen policy without claiming an AI review occurred", async () => {
    const decision = await immediatePublication.evaluate({ authorId: "a", revisionId: "r", title: "A sample", blurb: "An introduction", body: "Sample", theme: "", happenedWhen: "", contentHash: "digest" });
    expect(decision).toEqual({ action: "publish", provider: "disabled", policyVersion: "immediate-v1" });
  });
});
