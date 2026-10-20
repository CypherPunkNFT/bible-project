// Chapter 05, "Translate": the translation projects listed in full on the left (one click each), the chosen one's record on the right.
import dossier from '../../../../content/academic-research/05-from-manuscript-to-printed-bible.json';
import { Cites, SectionHeading } from './PrintRoomShared';
import { TranslationContext } from './PrintRoomInvestigations';
import { usePrintState } from './usePrintState';

const { translations } = dossier;

export function TranslationDesk() {
  const [translation, setTranslation] = usePrintState('translation', 0);
  const t = translations[translation] ?? translations[0];
  return <section id="translation-desk" className="pr-translations"><SectionHeading n="05" kicker="Translate" title={<>At another desk, <em>a different decision</em></>} text="A translation renders a text into another language. Its source choices, wording and printing history must be investigated separately."/>
    <div className="pr-translation-workbench">
      <div className="pr-translation-selector"><p className="pr-translation-label" id="pr-translation-label">Choose a translation project</p>
        <div className="pr-translation-list" role="group" aria-labelledby="pr-translation-label">{translations.map((item, i) =>
          <button type="button" key={item.id} aria-pressed={i === translation} aria-controls="pr-translation-record" onClick={() => setTranslation(i)}><span>{item.date}</span>{item.name}</button>)}</div>
        <p>A selected European sequence, not a census of Bible translation. Jewish, Catholic and Protestant editing histories also overlap without becoming one chain.</p></div>
      <div id="pr-translation-record" className="pr-translation-record" aria-live="polite"><p className="pr-kicker">{t.date}</p><h3>{t.name}</h3><dl><div><dt>Source / revision base</dt><dd>{t.source}</dd></div><div><dt>Translation decision</dt><dd>{t.decision}</dd></div><div><dt>Physical publication</dt><dd>{t.production}</dd></div></dl><p>{t.text}</p><Cites ids={t.sourceIds}/></div>
    </div>
    <TranslationContext/>
  </section>;
}
