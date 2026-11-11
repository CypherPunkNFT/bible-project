// Team rows for the kit's chips, their colours, and the tally line screen readers hear (the audit's item 6).
import { teamScores } from './game';
import type { Run } from './types';

/** The teams' colours: the site's book colours, leaving out the game's own (Acts). */
export const TEAM_TONES=['var(--history)','var(--poetry)','var(--prophets)','var(--gospels)'];
export const teamTone=(index: number)=>TEAM_TONES[index%TEAM_TONES.length];
export const teamRows=(run: Run)=>run.teams.map((name,i)=>({id:String(i),name,score:teamScores(run)[i]}));
/** The old tally line, kept for screen readers: names and scores as one status. */
export const tallyText=(run: Run)=>run.teams.map((t,i)=>`${t}: ${teamScores(run)[i]}`).join(' · ');
