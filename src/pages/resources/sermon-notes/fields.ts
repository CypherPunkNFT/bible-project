// The two fields a visitor may fill in (the sermon's title and passage), as they go on the printed sheet.
export const MAX_FIELD = 80;

/** Control characters and text-direction overrides, which would scramble a printed line. */
// eslint-disable-next-line no-control-regex -- removing control characters is the point
const UNSAFE = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

/** What was typed, as it goes on the sheet: safe characters only, at most MAX_FIELD of them, trimmed. */
export const cleanField = (text: string) => Array.from(text.replace(UNSAFE, "")).slice(0, MAX_FIELD).join("").trim();
