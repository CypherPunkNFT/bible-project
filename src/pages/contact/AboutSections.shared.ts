// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { ART } from "./conviction-art";
export const CONVICTIONS: { numeral: string; title: string; text: string; verse: number; reference: string; art: keyof typeof ART }[] = [
  { numeral: "I", title: "For the glory of God.", text: "Not for attention, and not for a name. Every page is offered back to the One it is about.", verse: 46010031, reference: "1 Corinthians 10:31", art: "cross" },
  { numeral: "II", title: "Free, always.", text: "There is no subscription and nothing to buy. What the Church received as a gift should be passed on as one.", verse: 40010008, reference: "Matthew 10:8", art: "bowl" },
  { numeral: "III", title: "Open to everyone.", text: "Believer or skeptic, scholar or simply curious: the door is open to anyone who wants to come in.", verse: 23055001, reference: "Isaiah 55:1", art: "door" },
  { numeral: "IV", title: "Gathered in one place.", text: "Scripture, the creeds, the teachers and the hard questions, scattered for centuries, brought into one source and linked together.", verse: 20004007, reference: "Proverbs 4:7", art: "books" },
];
