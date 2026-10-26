// The Support page's common questions, shared by /support (SupportPage.tsx) and its mock-up versions.
import { Bookmark, Gift, PencilLine, ShieldCheck, Trash2, WifiOff, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const link = (to: string, label: string) => <Link to={to} className="text-accent underline-offset-4 hover:underline">{label}</Link>;

export const QUESTIONS: { question: string; answer: ReactNode }[] = [
  { question: "Is Bible Guide free?", answer: "Yes. The website and the app are free, with no ads, no subscription and no account." },
  { question: "I found a mistake. How do I report it?", answer: <>Press "Suggest a correction" on that page and describe what is wrong; the page address is sent with it. Or write to us with the page address.</> },
  { question: "Does the app work without internet?", answer: "The Bible itself does, in every version the app carries. Study pages download the first time you open them and then work offline. The audio Bible can be downloaded book by book from its page on bibleguide.io and played without a connection; videos need one." },
  { question: "Where are my bookmarks and notes?", answer: "On your own device. They are not shared between devices, and deleting the app or clearing your browser removes them." },
  { question: "How do I delete my testimony?", answer: "Open your private access link and choose Delete my testimony. Your name, story, its earlier versions and its place on the map are deleted for good." },
  { question: "What information do we collect?", answer: <>Very little, and nothing for advertising. The {link("/privacy", "Privacy Policy")} says exactly what and why.</> },
];

/** One entry per QUESTIONS item, in the same order: its icon, a short tile label and words a search should find. */
export const META: { icon: LucideIcon; label: string; words: string }[] = [
  { icon: Gift, label: "Is it free?", words: "free cost price subscription ads account pay" },
  { icon: PencilLine, label: "Report a mistake", words: "mistake error typo wrong report correction fix" },
  { icon: WifiOff, label: "Offline in the app", words: "offline internet app connection download listen audio phone" },
  { icon: Bookmark, label: "Bookmarks and notes", words: "bookmarks notes saved device sync lost phone browser" },
  { icon: Trash2, label: "Delete a testimony", words: "testimony story remove withdraw delete link" },
  { icon: ShieldCheck, label: "Information we collect", words: "privacy collect data information tracking" },
];
