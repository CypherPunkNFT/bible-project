import { PARABLES, PARABLE_ROOMS, PARABLE_GUIDE_URL, passageLabel, passageUrl } from '../../src/data/parables';
import { blocks, link } from './study-lib';
import type { PageContent } from './types';
export function parablesPage(): PageContent {
  return {dir:'Study/parables-of-jesus',title:'The parables of Jesus',markdown:blocks(
    `**Address:** ${link(PARABLE_GUIDE_URL)}`,
    '## Ordinary things. Extraordinary kingdom.\n\nSixteen selected parables; four editorial reading paths; three Gospel voices. A selected collection, not an exhaustive count of Jesus’ parables.',
    ...PARABLE_ROOMS.map(r=>blocks(`## ${r.title}`,r.intro,...PARABLES.filter(p=>p.room===r.id).map(p=>blocks(
      `### ${p.title}`,p.question,`**Audience:** ${p.audience}`,p.context,
      ...p.beats.map(([title,text])=>`**${title}:** ${text}`),`**Turning point:** ${p.hinge}`,p.close,
      `**Handle carefully:** ${p.caution}`,...p.passages.map(v=>`**${passageLabel(v)}** (${link(passageUrl(v))}): ${v.note}`),`**Reflection:** ${p.reflect}`
    )))),
    '## Learning to listen\n\nAn open-book line illustration sits beside the introduction: Hear the story · Hold the question. Four numbered, always-visible cards form a two-column grid (one column on phones): Start with who is listening. Notice the surprise before solving the symbols. Let each Gospel keep its own voice. Bring the question back to your own life. Read Matthew 13:10–17 on why Jesus speaks in parables.',
    '## Sources\n\nOriginal reading guides grounded in the existing KJV corpus (Matthew, Mark, Luke). Thematic groupings and story movements are editorial aids, not chronology. No new outside scholarship or historical reconstruction is claimed.'
  )};
}
