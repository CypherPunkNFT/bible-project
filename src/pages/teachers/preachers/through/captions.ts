// The sentences under the ring: how spoke length is drawn, the longest spoke, what the year slider counts, and, for a
// teacher without one, the honest one-line reason there is no year playback.
import type { Book } from "@/data/teachers/pages-types";
import { formatNumber } from "../../shared/people";
import { SPURGEON } from "../bible/model";
import { plural } from "../bible/words";
import type { ThroughModel, Timeline, Track } from "./model";

export function ringCaption(model: ThroughModel, track: Track, timeline: Timeline | null, books: Book[]) {
  let caption = `Spoke length grows with the square root of the count, so small books stay visible. The longest spoke is ${books[track.top].name}, with ${plural(track.max, "work")}.`;
  if (!track.person) caption += ` Spurgeon's ${formatNumber(model.byId.get(SPURGEON)?.works ?? 0)} sermons are most of these, so this ring is mostly his.`;
  if (track.person && timeline) {
    const undated = track.person.passages.filter((w) => !w.d).length, outside = track.person.passages.length - track.dated.length - undated;
    caption += ` The slider counts the ${formatNumber(track.dated.length)} works dated ${timeline.first}–${timeline.last}; ${formatNumber(undated)} have no date${outside ? ` and ${outside} carry a date outside their working life` : ""}, so they appear only at “All”.`;
  }
  return caption;
}

/** Who to choose for year playback, named from the data (today only Spurgeon's works are dated enough). */
function playersLine(model: ThroughModel) {
  const players = model.teachers.filter((t) => t.timeline && t.person);
  if (players.length === 1 && players[0].id === SPURGEON) return "Choose Spurgeon to play his sermons through the years: most of them carry the date he preached them.";
  if (!players.length) return "No teacher's works here carry enough dates to play through the years.";
  return `Choose ${players.map((t) => t.person?.short).join(" or ")} to play their works through the years: most of them carry a date.`;
}

/** Why there is no year slider for this choice (empty when there is one). */
export function noPlaybackReason(model: ThroughModel, track: Track) {
  const p = track.person;
  if (track.timeline) return "";
  if (!p) return playersLine(model);
  if (!track.anyDate) return `${p.short}'s works here carry no dates, so there is no year playback.`;
  if (track.datedCount < track.works / 2) return `Only ${formatNumber(track.datedCount)} of ${p.short}'s ${formatNumber(track.works)} works here carry a date, too few to play through the years.`;
  return track.yearCount === 1 ? `${p.short}'s works here all come from one year, so there is no year playback.` : `${p.short}'s works here come from only ${track.yearCount} different years, too few to play through.`;
}
