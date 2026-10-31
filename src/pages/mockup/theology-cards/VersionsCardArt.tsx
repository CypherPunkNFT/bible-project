// Four drawings tried for the Versions & languages card (owner, 2026-10-29): two of books, two of languages. Every
// phrase is the opening of Genesis 1:1 as the library's own edition prints it (data/text/<edition>/GEN). Still under
// reduced motion (theology-cards.css).
import type { CSSProperties } from "react";

/** "In the beginning" in 17 of the library's 140 languages: the phrase, its language, its edition, and where it floats. */
const BEGINNINGS: { text: string; lang: string; edition: string; left: number; top: number }[] = [
  { text: "בְּרֵאשִׁית", lang: "he", edition: "WLC", left: 6, top: 4 },
  { text: "Ἐν ἀρχῇ", lang: "grc", edition: "LXX", left: 28, top: 3 },
  { text: "In principio", lang: "la", edition: "VUL", left: 50, top: 3 },
  { text: "In the bigynnyng", lang: "enm", edition: "WYC", left: 75, top: 11 },
  { text: "En el principio", lang: "es", edition: "RVR", left: 2, top: 21 },
  { text: "Au commencement", lang: "fr", edition: "LSG", left: 77, top: 22 },
  { text: "Am Anfang", lang: "de", edition: "LUT", left: 3, top: 41 },
  { text: "Nel principio", lang: "it", edition: "RIV", left: 83, top: 43 },
  { text: "No princípio", lang: "pt", edition: "BPM", left: 4, top: 62 },
  { text: "В начале", lang: "ru", edition: "SYN", left: 14, top: 77 },
  { text: "فِي ٱلْبَدْءِ", lang: "ar", edition: "SVD", left: 38, top: 78 },
  { text: "در ابتدا", lang: "fa", edition: "OPV", left: 60, top: 78 },
  { text: "आदि में", lang: "hi", edition: "IRV", left: 84, top: 62 },
  { text: "起初", lang: "zh-Hans", edition: "CUV", left: 40, top: 19 },
  { text: "初めに", lang: "ja", edition: "JFB", left: 29, top: 65 },
  { text: "Ban đầu", lang: "vi", edition: "BTT", left: 61, top: 65 },
];

/** Books: the stack of editions, now the real card's drawing (src/pages/study/VersionsCardArt.tsx). */
export { VersionsStackArt as StackArt } from "@/pages/study/VersionsCardArt";

/** Books: four open books, each at Genesis 1:1, from the Hebrew to the English. */
const OPEN = [
  { phrase: "בְּרֵאשִׁית", language: "Hebrew", rtl: true },
  { phrase: "Ἐν ἀρχῇ", language: "Greek" },
  { phrase: "In principio", language: "Latin" },
  { phrase: "In the beginning", language: "English" },
];

export function OpenBooksArt() {
  return <div className="study-art tc-art" aria-hidden="true">
    <svg viewBox="0 0 480 170" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {OPEN.map((book, i) => {
        const c = 66 + i * 116, y = 24;
        const lines = [0, 1, 2, 3, 4];
        return <g key={book.language} className="tc-open" style={{ animationDelay: `${i * 1.2}s` } as CSSProperties}>
          <path d={`M${c} ${y + 4} C${c - 14} ${y - 1} ${c - 36} ${y - 1} ${c - 50} ${y + 5} L${c - 51} ${y + 62} C${c - 36} ${y + 56} ${c - 14} ${y + 56} ${c} ${y + 61} Z`} strokeWidth={1.1} />
          <path d={`M${c} ${y + 4} C${c + 14} ${y - 1} ${c + 36} ${y - 1} ${c + 50} ${y + 5} L${c + 51} ${y + 62} C${c + 36} ${y + 56} ${c + 14} ${y + 56} ${c} ${y + 61} Z`} strokeWidth={1.1} />
          <path d={`M${c - 51} ${y + 65} C${c - 36} ${y + 59} ${c - 14} ${y + 59} ${c} ${y + 64} C${c + 14} ${y + 59} ${c + 36} ${y + 59} ${c + 51} ${y + 65}`} strokeWidth={0.7} opacity={0.5} />
          {lines.map((n) => <path key={n} d={book.rtl ? `M${c + 42} ${y + 14 + n * 8} h${-(30 - (n % 2) * 8)}` : `M${c - 42} ${y + 14 + n * 8} h${30 - (n % 2) * 8}`} strokeWidth={0.8} opacity={n ? 0.4 : 0.9} />)}
          {lines.map((n) => <path key={n} d={book.rtl ? `M${c - 8} ${y + 14 + n * 8} h${-(30 - ((n + 1) % 2) * 8)}` : `M${c + 8} ${y + 14 + n * 8} h${30 - ((n + 1) % 2) * 8}`} strokeWidth={0.8} opacity={0.4} />)}
          <text x={c} y={y + 96} className="tc-phrase" stroke="none">{book.phrase}</text>
          <text x={c} y={y + 116} className="tc-language" stroke="none">{book.language.toUpperCase()}</text>
        </g>;
      })}
    </svg>
    <span className="study-art-note">Genesis 1:1, from the Hebrew to the English</span>
  </div>;
}

/** Languages: "In the beginning" in the middle, the same words in the other sixteen drifting around it. Words on the right
 *  hang from the right edge, so a narrow card never cuts them off. */
export function BeginningsArt() {
  return <div className="study-art tc-art tc-beginnings" aria-hidden="true">
    {BEGINNINGS.map((b, i) => <span key={b.edition} lang={b.lang} className="tc-beginning" style={{ ...(b.left >= 70 ? { right: `${Math.max(2, 84 - b.left)}%` } : { left: `${b.left}%` }), top: `${b.top}%`, animationDelay: `-${(i * 1.7) % 9}s, -${(i * 1.1) % 5}s` }}>{b.text}</span>)}
    <strong lang="en">In the beginning</strong>
    <span className="study-art-note">Genesis 1:1 in 17 of the library’s 140 languages</span>
  </div>;
}

/** Languages: each language's own name in two arcs over an open book, lighting in turn. */
const AUTONYMS: [string, string][] = [
  ["עברית", "he"], ["Ελληνικά", "el"], ["Latina", "la"], ["English", "en"], ["Español", "es"], ["Français", "fr"],
  ["Deutsch", "de"], ["Italiano", "it"], ["Português", "pt"], ["Русский", "ru"], ["العربية", "ar"], ["فارسی", "fa"],
  ["हिन्दी", "hi"], ["中文", "zh"], ["日本語", "ja"], ["Tiếng Việt", "vi"],
];

export function ArcArt() {
  const spineTop = 112;
  return <div className="study-art tc-art" aria-hidden="true">
    <svg viewBox="0 0 480 170" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {AUTONYMS.map(([name, lang], i) => {
        // Two arcs, alternating, so neighbours never share one line of text.
        const angle = Math.PI * (1 - (i + 0.5) / AUTONYMS.length), outer = i % 2 === 0;
        const x = 240 + Math.cos(angle) * (outer ? 218 : 150), y = 152 - Math.sin(angle) * (outer ? 138 : 92);
        return <g key={lang} className="tc-arc" style={{ animationDelay: `${(i * 0.45).toFixed(2)}s` }}>
          <path d={`M240 ${spineTop} L${240 + (x - 240) * 0.72} ${spineTop + (y - spineTop) * 0.72}`} strokeWidth={0.6} opacity={0.3} />
          <text x={x} y={y + 4} lang={lang} className="tc-autonym" stroke="none">{name}</text>
        </g>;
      })}
      <path d="M240 116 C226 110 202 110 184 117 L183 154 C202 148 226 148 240 153 Z" strokeWidth={1.1} style={{ fill: "var(--surface)" }} />
      <path d="M240 116 C254 110 278 110 296 117 L297 154 C278 148 254 148 240 153 Z" strokeWidth={1.1} style={{ fill: "var(--surface)" }} />
      {[0, 1, 2].map((n) => <path key={n} d={`M192 ${124 + n * 7} h38 M250 ${124 + n * 7} h38`} strokeWidth={0.8} opacity={0.45} />)}
    </svg>
    <span className="study-art-note">Every language in the library, by its own name</span>
  </div>;
}
