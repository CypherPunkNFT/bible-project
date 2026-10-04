export interface TestimonyNode {
  id: string;
  parentId: string | null;
  name: string;
  title: string;
  body: string;
  theme: string;
}

export interface TestimonySubmission {
  name: string;
  title: string;
  body: string;
  publicConsent: boolean;
  connectionConsent: boolean;
}

export function validateTestimony(input: TestimonySubmission): string | null {
  if (input.name.trim().length < 2 || input.name.trim().length > 60) return "Use a public name between 2 and 60 characters.";
  if (input.title.trim().length < 5 || input.title.trim().length > 120) return "Give your story a title between 5 and 120 characters.";
  if (input.body.trim().length < 80 || input.body.trim().length > 12000) return "Write between 80 and 12,000 characters for your story.";
  if (!input.publicConsent) return "Confirm that you want your story to be publicly readable.";
  if (!input.connectionConsent) return "Confirm the invitation connection shown above.";
  return null;
}

/** A parent's path, not a claim about conversion, spiritual authority or biological ancestry. */
export function testimonyPath(nodes: TestimonyNode[], id: string): TestimonyNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: TestimonyNode[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id); path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

export function testimonyBranch(nodes: TestimonyNode[], id: string): TestimonyNode[] {
  const result: TestimonyNode[] = [];
  const queue = [id];
  const seen = new Set<string>();
  const children = new Map<string, TestimonyNode[]>();
  for (const node of nodes) if (node.parentId) children.set(node.parentId, [...children.get(node.parentId) ?? [], node]);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (let i = 0; i < queue.length; i++) {
    if (seen.has(queue[i])) continue;
    seen.add(queue[i]);
    const node = byId.get(queue[i]);
    if (!node) continue;
    result.push(node); queue.push(...(children.get(node.id) ?? []).map((n) => n.id));
  }
  return result;
}

/** Contract only. A production handler must call this before committing a public revision. */
export interface PublicationInput {
  authorId: string;
  revisionId: string;
  title: string;
  body: string;
  contentHash: string;
}
export type PublicationDecision =
  | { action: "publish"; provider: "disabled" | "external"; policyVersion: string }
  | { action: "hold" | "reject"; provider: "external"; policyVersion: string; reasonCode: string };
export interface PublicationCheck { evaluate(input: PublicationInput): Promise<PublicationDecision> }

/** Owner's chosen policy: immediate publication. No AI call or claim that a story was reviewed. */
export const immediatePublication: PublicationCheck = {
  async evaluate() { return { action: "publish", provider: "disabled", policyVersion: "immediate-v1" }; },
};
