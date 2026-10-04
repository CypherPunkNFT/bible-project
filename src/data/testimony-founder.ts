import type { TestimonyBranch } from "../lib/testimony-contract";

/** Empty-state anchor only. Lucas supplies his own story through the private founder invitation. */
export const founderBranch: TestimonyBranch = {
  rootId: "founder-lucas", ancestors: [], hasMore: false, total: 0,
  nodes: [{ id: "founder-lucas", parentId: null, name: "Lucas", title: "Every invitation begins somewhere.",
    blurb: "Lucas founded this website. His testimony will appear here when he shares it, and every invitation will grow from this one tree.",
    body: "", theme: "", happenedWhen: "", publishedAt: "", available: true, hasFullTestimony: false, childCount: 0 }],
};
