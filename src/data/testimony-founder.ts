import type { TestimonyBranch, TestimonyPin } from "../lib/testimony-contract";

/** Empty-state anchor only. Lucas supplies his own story through the private founder invitation. */
export const founderBranch: TestimonyBranch = {
  rootId: "founder-lucas", ancestors: [], hasMore: false, total: 0,
  nodes: [{ id: "founder-lucas", parentId: null, name: "Lucas", title: "Every invitation begins somewhere.",
    blurb: "Lucas founded this website. His testimony will appear here when he shares it, and every invitation will grow from this one tree.",
    body: "", theme: "", happenedWhen: "", publishedAt: "", available: true, hasFullTestimony: false, childCount: 0 }],
};

/** Lucas's place on the world map while the collection is empty (his choice: Jacksonville, Florida). */
export const founderPin: TestimonyPin = { id: "founder-lucas", name: "Lucas", title: founderBranch.nodes[0].title, theme: "", publishedAt: "",
  city: "Jacksonville", region: "Florida", country: "US", latitude: 30.3, longitude: -81.7 };
