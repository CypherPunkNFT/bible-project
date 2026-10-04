/** Optional labels chosen by the writer, never inferred from their story. */
export const TESTIMONY_THEMES: readonly string[] = ["An invitation", "New beginnings", "Community", "Prayer", "Questions", "Grace", "Hope", "Belonging", "Trust"];
export const MAX_TESTIMONY_CHARACTERS = 100_000;
export const MAX_TESTIMONY_REQUEST_BYTES = 1_048_576;
export const MAX_TESTIMONY_BLURB = 600;
export const testimonyWordCount = (text: string) => text.trim() ? text.trim().split(/\s+/u).length : 0;

export interface TestimonyNode {
  id: string;
  parentId: string | null;
  name: string;
  title: string;
  blurb: string;
  body: string;
  theme: string;
  publishedAt: string;
  happenedWhen: string;
  available?: boolean;
  childCount?: number;
  hasFullTestimony?: boolean;
}

export interface TestimonySubmission {
  name: string;
  title: string;
  blurb: string;
  body: string;
  theme: string;
  happenedWhen: string;
  publicConsent: boolean;
}

export function validateTestimony(input: TestimonySubmission): string | null {
  if (input.name.trim().length < 2 || input.name.trim().length > 60) return "Use a public name between 2 and 60 characters.";
  if (input.title.trim().length < 5 || input.title.trim().length > 120) return "Give your story a title between 5 and 120 characters.";
  if (input.blurb.trim().length < 20 || input.blurb.trim().length > MAX_TESTIMONY_BLURB) return "Write a short blurb between 20 and 600 characters.";
  if (input.body.length > MAX_TESTIMONY_CHARACTERS) return "Keep your full testimony within 100,000 characters.";
  if (input.theme && !TESTIMONY_THEMES.includes(input.theme)) return "Choose one of the story themes, or leave it open.";
  if (input.happenedWhen.trim().length > 80) return "Keep when it happened to 80 characters or fewer.";
  if (!input.publicConsent) return "Confirm that you want your story to be publicly readable.";
  return null;
}

export function formatTestimonyDate(iso: string): string {
  if (!iso) return "Not shared";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
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

/** Called by the server before committing every public revision. */
export interface PublicationInput {
  authorId: string;
  revisionId: string;
  title: string;
  blurb: string;
  body: string;
  theme: string;
  happenedWhen: string;
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
