// Section 04: the quest for the historical Jesus as seven stages on one track, in order and not to scale: each stage
// carries its years in words, never as a point. Each is told in its holders' terms; the evangelical answer stands beside
// it, and the site's own word is marked as the site's.
import { plainText } from "@/pages/study/check-notes/checked";
import { D, findStage } from "./model";
import { Head, SiteWord, Text } from "./parts";

type Change = (values: Record<string, string | null>) => void;

export function Quest({ stageId, onChange }: { stageId: string | null; onChange: Change }) {
  const chosen = findStage(stageId);
  const { stages, answer } = D.quest;
  return <>
    <Head num="04" kicker="The quest" title={<>Two pictures.<em> One set of sources.</em></>} lead={D.quest.lead} />
    <div className="nb-track" role="group" aria-label="The seven stages, in order, not to scale">
      {stages.map((stage, i) => <button key={stage.id} type="button" aria-pressed={stage.id === chosen.id} onClick={() => onChange({ stage: stage.id })}>
        <span className="nb-track-n">{String(i + 1).padStart(2, "0")}</span>
        <span className="nb-track-name">{stage.name}</span>
        <small>{plainText(stage.years)}</small>
      </button>)}
    </div>
    <p className="nb-caption">The stages stand in order, at equal spacing, not on a scale of years. Each gives its years in words.</p>
    <div className="nb-quest">
      <article className="nb-stage" aria-live="polite">
        <p className="nb-kicker">{chosen.name} · {plainText(chosen.years)}</p>
        <p className="nb-stage-who"><Text text={chosen.who} /></p>
        <p className="nb-sidehead">As its holders put it</p>
        <p className="nb-para"><Text text={chosen.held} /></p>
        <p className="nb-sidehead">What followed</p>
        <p className="nb-para nb-muted"><Text text={chosen.note} /></p>
      </article>
      <div className="nb-answer">
        <p className="nb-kicker">{answer.head}</p>
        <ol>{answer.points.map((point) => <li key={point}><Text text={point} /></li>)}</ol>
      </div>
    </div>
    <SiteWord text={answer.stance} />
  </>;
}
