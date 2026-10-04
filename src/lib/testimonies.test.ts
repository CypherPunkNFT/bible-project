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
  it("requires separate publication and connection consent", () => {
    const input = { name: "A guest", title: "A sample story", body: "This is fictional sample text for testing the invitation flow. It is long enough to meet the written story minimum.", publicConsent: true, connectionConsent: true };
    expect(validateTestimony(input)).toBeNull();
    expect(validateTestimony({ ...input, publicConsent: false })).toMatch(/publicly/);
    expect(validateTestimony({ ...input, connectionConsent: false })).toMatch(/connection/);
    expect(validateTestimony({ ...input, body: "brief" })).toMatch(/80/);
    expect(validateTestimony({ ...input, body: "x".repeat(12001) })).toMatch(/12,000/);
  });
  it("publishes by the owner's chosen policy without claiming an AI review occurred", async () => {
    const decision = await immediatePublication.evaluate({ authorId: "a", revisionId: "r", title: "A sample", body: "Sample", contentHash: "digest" });
    expect(decision).toEqual({ action: "publish", provider: "disabled", policyVersion: "immediate-v1" });
  });
});
