import { PARABLES, PARABLE_FORMS, PARABLE_ROOMS, PARABLE_GUIDE_URL, passageLabel, passageUrl } from '../../src/data/parables';
import { blocks, link, SITE } from './study-lib';
import type { PageContent } from './types';
import { PARABLE_DEEP_READINGS } from '../../src/data/parables-deep-reading';
import { PARABLE_PAGE_COPY as copy } from '../../src/data/parables-page-copy';
export function parablesPage(): PageContent {
  return {dir:'Study/parables-of-jesus',title:'The parables of Christ',markdown:blocks(
    `**Address:** ${link(PARABLE_GUIDE_URL)}`,
    copy.invitation,
    `## Ordinary things. Extraordinary kingdom.\n\n${PARABLES.length} studies of narrative parables, brief comparisons and related figurative teaching; ${PARABLE_ROOMS.length} thematic categories; three Gospel voices. The compact icon cards filter Stay with a story; they are not a separate study section. This is the collection size, not a universally agreed count of Jesus’ parables.`,
    `**Reading forms:** ${Object.entries(PARABLE_FORMS).map(([form,label])=>`${label}: ${PARABLES.filter(p=>p.form===form).length}`).join('; ')}. Narrative parables tell particular stories; brief comparisons use compact scenes or hypothetical examples; related figurative teaching identifies the returning spirit and the sheep-and-goats judgment scene. These are editorial labels with overlapping boundaries. Other images, including the narrow gate and the hen gathering her chicks, are not counted in this curated collection.`,
    ...PARABLE_ROOMS.map(r=>blocks(`## ${r.title}`,r.intro,...PARABLES.filter(p=>p.room===r.id).map(p=>blocks(
      `### ${p.title}`,p.question,`**Form:** ${PARABLE_FORMS[p.form]}`,
      `**${copy.readFirst}:** [Read ${passageLabel(p.passages[0])}](${SITE}${passageUrl(p.passages[0])})`,
      `**Audience:** ${p.audience}`,p.context,
      ...p.beats.map(([title,text])=>`**${title}:** ${text}`),`**${p.form==='narrative'?'Turning point':p.form==='comparison'?'Point of comparison':'Central emphasis'}:** ${p.hinge}`,p.close,
      ...(PARABLE_DEEP_READINGS[p.id] ?? []).map(note=>blocks(`#### ${note.title}`,note.text,`Sources: ${note.sources.map(source=>`[${source.label}](${source.href})`).join('; ')}.`)),
      `**Handle carefully:** ${p.caution}`,...p.passages.map(v=>`**${passageLabel(v)}** (${link(passageUrl(v))}): ${v.note}`),`**Reflection:** ${p.reflect}`
    )))),
    blocks('## Learning to listen',copy.listeningIntro,`[Read Matthew 13:10–17](${SITE}/read/kjv/MAT/13?hl=10-17)`,...copy.practices.map(([title,text])=>blocks(`### ${title}`,text))),
    '## Scope and sources\n\nOriginal reading guides grounded in the existing KJV corpus (Matthew, Mark, Luke). Inventory checked against all thirty chapters in the held 1847 edition of R. C. Trench, Notes on the Parables of Our Lord; Arland Hultgren, Preaching the Parables, Part One (Working Preacher, 2009), explains why shorter comparisons alter counts. Crossway’s Gospel chart was used as a supplementary reference check. Thematic groupings and story movements are editorial aids. Talents/minas and the two banquet stories remain separate. John’s shepherd and vine discourses are linked as related figurative teaching outside this Synoptic collection.',
    blocks('## Where this study comes from',copy.sourceText,copy.sourceInterpretation)
  )};
}
