/**
 * Content corrections: the labels a visitor can choose, and the email a correction becomes.
 * Shared by the floating correction button (src/components/corrections/) and the mail handler
 * (server/contact.ts), so the page and the server agree on what a correction is.
 */
export const CORRECTION_LABELS = [
  "Spelling or typo",
  "Wrong fact or date",
  "Scripture reference",
  "Missing or broken link",
  "Wording or clarity",
  "Something else",
] as const;

export type CorrectionLabel = (typeof CORRECTION_LABELS)[number];

export interface Correction {
  label: string;
  /** The page's path, query and hash, captured when the visitor opened the form. */
  page: string;
  title: string;
  message: string;
  email: string;
}

export const CORRECTION_SUBJECT = "Content correction";
const PAGE_PATH = /^\/(?!\/)[^\s]{0,299}$/;

export const isCorrectionLabel = (value: string): value is CorrectionLabel => (CORRECTION_LABELS as readonly string[]).includes(value);

/** Why a correction cannot be sent, or null when it is complete. */
export function correctionProblem(correction: Correction): string | null {
  if (!isCorrectionLabel(correction.label)) return "Please choose what kind of correction this is.";
  if (!PAGE_PATH.test(correction.page)) return "The page address could not be read.";
  if (!correction.message.trim()) return "Please describe the correction.";
  return null;
}

/** The email for a correction: "Content correction: <label>", with the page as a fixed line. */
export function composeCorrection(correction: Correction, origin: string): { subject: string; text: string } {
  return {
    subject: `${CORRECTION_SUBJECT}: ${correction.label}`,
    text: [
      `Correction: ${correction.label}`,
      `Page: ${origin}${correction.page}`,
      `Page title: ${correction.title || "(none)"}`,
      "",
      correction.message.trim(),
      "",
      "—",
      `Email: ${correction.email || "(none given)"}`,
      "Sent with the correction button.",
    ].join("\n"),
  };
}
