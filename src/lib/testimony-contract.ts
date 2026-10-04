import type { TestimonyNode } from "./testimonies";

export interface TestimonyAccount { person: TestimonyNode; state: "public" | "withdrawn" | "draft"; owner: boolean; version: number; blocked: boolean }
export interface TestimonyBranch { nodes: TestimonyNode[]; ancestors: TestimonyNode[]; rootId: string | null; hasMore: boolean; total: number }
export interface TestimonyInvite { id: string; url: string; expiresAt: string }
export interface InvitationWelcome { name: string; personId: string | null; root: boolean }
export interface InvitationStatus { id: string; createdAt: string; expiresAt: string; used: boolean; revoked: boolean }
export interface TestimonyReport { id: string; personId: string; name: string; title: string; reason: string; createdAt: string }
