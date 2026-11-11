// The passages on giving that /tithe-calculator opens in the Berean (Scripture.tsx), as verse ids only: the build's
// verse-wording check forbids verse text in code, and giving.test.ts checks each id holds the words it is chosen for.

export interface Passage {
  /** First and last verse, BBCCCVVV, in one book. */
  from: number;
  to?: number;
  note: string;
}

/** In Bible order. Exported for the test that checks each id holds the words it is chosen for. */
export const PASSAGES: readonly Passage[] = [
  { from: 1014020, note: "Abram gives Melchizedek a tenth of everything, long before the law of Moses." },
  { from: 1028022, note: "Jacob vows to give God a tenth of all that God gives him." },
  { from: 3027030, note: "In the law of Moses, the tithe of the land belongs to the LORD and is holy." },
  { from: 39003010, note: "Through Malachi, God calls Israel to bring the full tithe into the storehouse." },
  { from: 40023023, note: "Jesus tells the Pharisees to practise justice, mercy and faithfulness, without neglecting their tithes." },
  { from: 41012043, to: 41012044, note: "Jesus measures the widow's two small coins by what they cost her, not by their size." },
  { from: 44020035, note: "Paul reminds the church of the Lord Jesus' words: it is more blessed to give than to receive." },
  { from: 46016002, note: "Paul asks each believer to set aside a portion of his income on the first day of every week." },
  { from: 47008012, note: "A gift is measured by what one has, not by what one does not have." },
  { from: 47009007, note: "Each one gives what he has decided in his heart, not out of regret or compulsion." },
];
