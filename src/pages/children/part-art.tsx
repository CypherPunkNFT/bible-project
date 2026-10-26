// A part's drawing on the children's page (the path, the lesson panel, the Sunday card and the parents' course). Most
// parts use a drawing from the homepage quiz's set (QuizScenes.tsx); two have their own, drawn the same way in its
// 320 × 240 space with its classes (home-quiz.css .qs-*), because the quiz's drawings belong to its questions
// (owner, 2026-10-25: Exodus showed Elijah's whirlwind and chariot of fire, and the cross showed the tear of "Jesus wept").
import type { ReactNode } from "react";
import { QuizScene } from "../QuizScenes";
import type { Part } from "./data";

const OWN: Record<string, ReactNode> = {
  // Exodus: the way through the sea between its two walls of water, the pillar of fire going before, Moses with his staff.
  egypt: <>
    <path className="qs-faint" d="M20 206Q160 200 300 206" />
    <path className="qs-paper" d="M24 204V118Q24 70 66 62Q104 56 112 88Q116 104 102 108Q92 110 94 98L118 204Z" />
    <path className="qs-faint" d="M40 204V124Q40 92 64 86M56 204V132Q56 108 74 106" />
    <path className="qs-paper" d="M296 204V118Q296 70 254 62Q216 56 208 88Q204 104 218 108Q228 110 226 98L202 204Z" />
    <path className="qs-faint" d="M280 204V124Q280 92 256 86M264 204V132Q264 108 246 106" />
    <path className="qs-faint" d="M128 204L150 120M192 204L170 120" />
    <path className="qs-dots" d="M160 160V124" />
    <g className="qs-flicker" style={{ transformOrigin: "162px 104px" }}>
      <path className="qs-accent" d="M150 104C142 86 154 74 158 58C162 72 168 76 170 86C174 76 178 72 180 62C188 80 188 96 176 106Z" />
    </g>
    <path className="qs-paper" d="M152 202L156 180Q160 177 164 180L168 202Z" /><circle className="qs-paper" cx="160" cy="172" r="6" />
    <path d="M164 186L174 170M174 202L180 150" />
  </>,
  // The cross and the empty tomb: three crosses on the hill, the middle one large, under a few faint stars.
  cross: <>
    <g className="qs-twinkle qs-faint"><circle cx="52" cy="46" r="1.4" /><circle cx="104" cy="28" r="1" /><circle cx="226" cy="34" r="1.4" /><circle cx="276" cy="58" r="1" /><circle cx="292" cy="26" r="1.2" /></g>
    <path className="qs-faint" d="M160 22V30M134 32L139 38M186 32L181 38" />
    <path d="M20 206Q160 176 300 206" />
    <rect className="qs-paper" x="153" y="42" width="14" height="150" rx="1.5" /><rect className="qs-paper" x="120" y="74" width="80" height="12" rx="1.5" />
    <rect className="qs-paper" x="74" y="104" width="9" height="93" rx="1.5" /><rect className="qs-paper" x="56" y="122" width="45" height="8" rx="1.5" />
    <rect className="qs-paper" x="237" y="104" width="9" height="93" rx="1.5" /><rect className="qs-paper" x="219" y="122" width="45" height="8" rx="1.5" />
  </>,
};

/** The part's own drawing, or its quiz drawing. */
export function PartArt({ part }: { part: Part }) {
  const own = OWN[part.id];
  if (!own) return <QuizScene scene={part.scene} />;
  return <svg className="qs-scene" viewBox="0 0 320 240" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{own}</svg>;
}
