// The leader page's helpers that are not screens: the question pool for the leader's choices (setup and "play
// again" share it), creating a room, and the join code as the projector shows it.
import type { QuestionBank } from "@/lib/data";
import { poolOf, type PickFilters } from "@/lib/live-quiz/pick";
import type { QuizQuestion, RoomSettings } from "@/lib/live-quiz/protocol";
import type { TestQuestion } from "@/pages/questions/test/engine";
import { inTheme, themeById } from "@/pages/questions/test/themes";

/** The pool for the leader's choices, the theme included: shared by setup and "play again". */
export function poolFor(bank: QuestionBank, filters: PickFilters, themeId: string) {
  const theme = themeById(themeId);
  return poolOf(bank.questions, filters, theme ? (q) => inTheme(theme, q as TestQuestion) : undefined);
}

export interface CreateRequest { questions: QuizQuestion[]; settings: RoomSettings }

/** Sends a new room to the server; a message the leader can act on if it fails. */
export async function createRoom(request: CreateRequest): Promise<{ code: string; roomId: string; token: string }> {
  const local = /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname);
  let response: Response;
  try {
    response = await fetch("/api/live-quiz/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) });
  } catch (error) {
    console.warn("live-quiz: creating a room failed", error);
    throw new Error(local ? "The live-game server isn't running on this PC — run npm run live-quiz:dev" : "The game could not be created. Check the connection and try again.");
  }
  const body = await response.json().catch(() => null) as { code?: string; roomId?: string; token?: string; error?: string } | null;
  if (response.ok && body?.code && body.roomId && body.token) return { code: body.code, roomId: body.roomId, token: body.token };
  if (local && (!body || response.status >= 500)) throw new Error("The live-game server isn't running on this PC — run npm run live-quiz:dev");
  throw new Error(body?.error ?? "The game could not be created. Please try again.");
}

/** "482913" as "482 913": easier to read off a projector. */
export const groupedCode = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;
