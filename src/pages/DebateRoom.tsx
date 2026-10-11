import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ApBack, TopicArt } from '@/components/ApologeticsParts';
import { AP_EDITORIAL, DEBATES } from '@/data/apologetics-library';
import { AP_BASE } from '@/lib/apologetics-links';
import { DebateCard } from '@/components/apologetics/DebateCard';
import './debate-room.css';

const root = AP_BASE + '/debates';
const speakersOf = (speakers: string) => speakers.split(' · ');

export default function DebateRoom() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const collectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (location.hash !== '#collection') return;
    // Each waypoint is a new navigation, even when its destination hash (or URL) is unchanged.
    const frame = requestAnimationFrame(() => {
      collectionRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
      collectionRef.current?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.hash]);
  const topics = [
    { id: 'god', title: 'Does God exist?', description: 'Reason, evidence and the foundations of belief.', question: 'What would count as a reason to believe?', art: 0, debates: ['craig-hitchens', 'bahnsen-stein', 'craig-krauss'] },
    { id: 'science', title: 'Science & faith', description: 'The universe, explanation and the reach of science.', question: 'Can science settle the question of God?', art: 4, debates: ['lennox-dawkins', 'craig-krauss'] },
    { id: 'resurrection', title: 'Jesus & the resurrection', description: 'Historical testimony, miracles and rival explanations.', question: 'What happened after the crucifixion?', art: 1, debates: ['craig-ehrman', 'craig-ally-resurrection'] },
    { id: 'suffering', title: 'Evil & suffering', description: 'Moral judgment, human pain and the goodness of God.', question: 'How can goodness and suffering coexist?', art: 3, debates: ['craig-grayling', 'lennox-shermer'] },
    { id: 'islam', title: 'Christianity & Islam', description: 'The identity of Jesus, the Trinity and the oneness of God.', question: 'Where do the two faiths part company?', art: 2, debates: ['craig-ally-god', 'craig-ally-resurrection'] },
  ];
  const debaters = [
    { name: 'William Lane Craig', initials: 'WC', title: 'Arguments, history & explanation', description: 'Follow arguments for God, the historical case for the resurrection, and exchanges about Christian and Islamic belief.' },
    { name: 'John Lennox', initials: 'JL', title: 'Science, belief & the human question', description: 'Explore whether scientific explanation leaves room for God, then turn to the moral and personal questions raised by suffering.' },
    { name: 'Greg Bahnsen', initials: 'GB', title: 'The foundations of reasoning', description: 'Examine the assumptions beneath an argument: logic, morality and what makes a rational exchange possible.' },
  ];
  const featured = [
    { id: 'lennox-dawkins', title: 'Begin with a big question', text: 'Science, belief and the claims of The God Delusion. Read the argument alongside the recording.' },
    { id: 'craig-ehrman', title: 'Examine the historical case', text: 'What can historical method establish about a miracle? Follow the disagreement over evidence and explanation.' },
    { id: 'bahnsen-stein', title: 'Go beneath the argument', text: 'A different approach: ask what each worldview must assume before the debate can even begin.' },
  ];
  const benefits = [
    { title: 'See a claim take shape.', text: 'A debate asks someone to state a case, give reasons and explain how the conclusion follows.' },
    { title: 'Hear the strongest challenge.', text: 'Rebuttals reveal disputed premises, competing explanations and questions an opening speech can leave unanswered.' },
    { title: 'Find your next question.', text: 'Use the exchange to identify a source to check, an idea to study or a question to carry into conversation.' },
  ];
  const method = [
    { title: 'Name the question.', text: 'Write down the actual motion and define the key terms. Notice when either speaker moves to a different question.' },
    { title: 'Map both cases.', text: 'List each speaker’s premises and conclusion. Try to restate the other person’s position in words they would recognise.' },
    { title: 'Check the hinge.', text: 'Find the premise or source on which the disagreement turns. Pause the recording and open the transcript or cited text.' },
    { title: 'Form a measured response.', text: 'Distinguish what was established from what still needs work. Record your question in the guide’s reflection box.' },
  ];
  const speakers = [...new Set(DEBATES.flatMap(debate => speakersOf(debate.speakers)))].sort();
  const partners = speakers.filter(name => !debaters.some(debater => debater.name === name));
  const topic = params.get('topic') ?? '', speaker = params.get('speaker') ?? '', query = params.get('q') ?? '';
  const selectedTopic = topics.find(item => item.id === topic);
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = DEBATES.filter(debate => (!topic || selectedTopic?.debates.includes(debate.id)) && (!speaker || speakersOf(debate.speakers).includes(speaker)) && words.every(word => `${debate.title} ${debate.speakers} ${debate.lens} ${debate.description} ${debate.setting}`.toLocaleLowerCase().includes(word)));
  const waypoint = (key: string, value: string) => `${root}?${new URLSearchParams({ [key]: value })}#collection`;
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: key === 'q', preventScrollReset: true });
  };
  const clear = () => setParams({}, { preventScrollReset: true });
  const returnState = { debateReturn: root + location.search + '#collection' };

  return <div className="dr-room">
    <ApBack />
    <header className="dr-hero">
      <div className="dr-hero-copy"><p className="ap-eyebrow">Apologetics / The debate room</p><h1>Ideas meet<br /><em>in the open.</em></h1><p className="dr-lead">Great questions deserve a careful hearing. Explore Christian debates, hear the objections and follow the reasoning wherever it needs to be examined.</p><a className="ap-button ap-button-solid" href="#collection">Explore the debates <ArrowDown size={16} /></a></div>
      <div className="dr-hero-art" aria-hidden="true"><svg viewBox="0 0 420 350" fill="none"><circle cx="210" cy="160" r="135" /><circle cx="210" cy="160" r="109" strokeDasharray="2 7" /><path d="M70 294h280M102 294V186l67-15v123m149 0V186l-67-15v123M90 185l78-20 13 15-79 20Zm240 0-78-20-13 15 79 20ZM123 175v-38q0-14 15-14h19m140 52v-38q0-14-15-14h-19" /><path d="M174 90q36-35 72 0m-61 18q25-24 50 0m-38 19q13-12 26 0" /><circle cx="210" cy="144" r="4" fill="currentColor" /><path d="M187 267q12-7 23 0 11-7 23 0v31q-12-7-23 0-11-7-23 0Zm23 0v31" /></svg><span>Listen closely. Think carefully.<br />Keep the question open to examination.</span></div>
    </header>
    <div className="dr-orientation"><div className="dr-counts"><span><strong>{DEBATES.length}</strong> exchanges</span><span><strong>{speakers.length}</strong> voices</span><span><strong>{topics.length}</strong> topic routes</span></div><nav aria-label="Debate room contents"><a href="#topics">Topics</a><a href="#debaters">Debaters</a><a href="#collection">All debates</a><a href="#listening">How to listen</a></nav></div>

    <section className="dr-section dr-purpose" aria-labelledby="dr-purpose-title"><div><p className="ap-eyebrow">What a debate offers</p><h2 id="dr-purpose-title">An argument<br />under examination.</h2><p>Debates put convictions into conversation. Their real value comes when we slow down enough to distinguish a persuasive performance from a sound argument.</p></div><div className="dr-benefits">{benefits.map((item, index) => <article key={item.title}><span className="dr-number">0{index + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div></section>

    <section className="dr-section" aria-labelledby="dr-featured-title"><div className="ap-section-heading"><div><p className="ap-eyebrow">Three ways into the room</p><h2 id="dr-featured-title">Choose an exchange to begin.</h2></div><a href="#collection">Browse all {DEBATES.length} <ArrowRight size={15} /></a></div><div className="dr-featured">{featured.map((item, index) => {
      const debate = DEBATES.find(entry => entry.id === item.id)!;
      return <Link key={item.id} className={'dr-feature dr-feature-' + index} to={root + '/' + item.id} state={returnState}><div className="dr-feature-top"><span className="ap-eyebrow">{item.title}</span><ArrowUpRight size={20} /></div><TopicArt index={[0, 1, 5][index]} /><h3>{debate.title}</h3><strong>{debate.speakers}</strong><p>{item.text}</p><span className="dr-feature-foot"><BookOpen size={14} /> Transcript & guide <span>Open exchange <ArrowRight size={14} /></span></span></Link>;
    })}</div></section>

    <section className="dr-section" id="topics" aria-labelledby="dr-topics-title"><p className="ap-eyebrow">Follow a question</p><h2 id="dr-topics-title">Topics are a way in.</h2><p className="dr-section-intro">Start with the question that matters to you. Some exchanges belong to more than one conversation.</p><div className="dr-topics">{topics.map((item, index) => <Link to={waypoint('topic', item.id)} key={item.id}><span className="dr-number">0{index + 1}</span><TopicArt index={item.art} /><div><h3>{item.title}</h3><p>{item.description}</p><strong>{item.question}</strong></div><span className="dr-topic-count">{DEBATES.filter(debate => item.debates.includes(debate.id)).length} debates <ArrowRight size={16} /></span></Link>)}</div></section>

    <section className="dr-section" id="debaters" aria-labelledby="dr-debaters-title"><p className="ap-eyebrow">People & approaches</p><h2 id="dr-debaters-title">Meet the Christian debaters.</h2><p className="dr-section-intro">Three voices represented in this collection, with different ways of approaching the questions. Explore their exchanges and examine each case on its merits.</p><div className="dr-debaters">{debaters.map(debater => <article key={debater.name}><span className="dr-monogram" aria-hidden="true">{debater.initials}</span><h3>{debater.name}</h3><p className="dr-debater-focus">{debater.title}</p><p>{debater.description}</p><Link to={waypoint('speaker', debater.name)}>Explore {DEBATES.filter(debate => speakersOf(debate.speakers).includes(debater.name)).length} {debater.name === 'Greg Bahnsen' ? 'exchange' : 'exchanges'} <ArrowRight size={15} /></Link></article>)}</div><div className="dr-partners"><div><h3>Across the conversation</h3><p>Meet the other voices in these exchanges.</p></div><nav aria-label="Other debate speakers">{partners.map(name => <Link key={name} to={waypoint('speaker', name)}>{name}<ArrowUpRight size={12} /></Link>)}</nav></div></section>

    <section ref={collectionRef} className="dr-section" id="collection" aria-labelledby="dr-collection-title"><p className="ap-eyebrow">The complete collection</p><h2 id="dr-collection-title" tabIndex={-1}>Find your next debate.</h2><p className="dr-section-intro">Every guide connects the question, the speakers, a transcript source and a YouTube recording, with prompts for your own study.</p><div className="dr-filters"><label className="dr-search"><Search size={18} /><span className="sr-only">Search debates</span><input type="search" placeholder="Search a name, question or idea…" value={query} onChange={event => change('q', event.target.value)} /></label><label>Topic<select aria-label="Topic" value={topic} onChange={event => change('topic', event.target.value)}><option value="">All topics</option>{topic && !selectedTopic && <option value={topic}>Unknown topic</option>}{topics.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label>Speaker<select aria-label="Speaker" value={speaker} onChange={event => change('speaker', event.target.value)}><option value="">All speakers</option>{speaker && !speakers.includes(speaker) && <option value={speaker}>Unknown speaker</option>}{speakers.map(name => <option value={name} key={name}>{name}</option>)}</select></label></div><div className="dr-results"><p role="status">{visible.length} of {DEBATES.length} debates{selectedTopic ? ' · ' + selectedTopic.title : ''}{speaker ? ' · ' + speaker : ''}</p>{(topic || speaker || query) && <button type="button" onClick={clear}>Clear search & filters</button>}</div>
      <div className="ap-debate-list dr-list">{visible.map(debate => <DebateCard key={debate.id} debate={debate} index={DEBATES.indexOf(debate)} returnState={returnState} />)}</div>
      {!visible.length && <div className="ap-empty"><Search size={26} /><h3>No debates match these filters.</h3><p>Try a broader search or return to the full collection.</p><button className="ap-button" type="button" onClick={clear}>Show all debates <ArrowRight size={15} /></button></div>}
      <div className="dr-source-note"><BookOpen size={21} /><div><h3>Read with the source in view.</h3><p>Transcripts are hosted by the linked publishers. Some omit sections or contain uncertain wording; each guide records known coverage limits. Use the recording to check the exchange in context.</p><p>{AP_EDITORIAL.debateIndexNote}</p><Link to={AP_BASE + '/sources'}>Explore the source room <ArrowRight size={14} /></Link></div></div>
    </section>

    <section className="dr-section dr-listening" id="listening" aria-labelledby="dr-listening-title"><p className="ap-eyebrow">A practice worth developing</p><h2 id="dr-listening-title">Listen with a pencil in hand.</h2><p className="dr-section-intro">Let the exchange become a study. These four habits help you follow both speakers fairly and decide what to examine next.</p><ol>{method.map((item, index) => <li key={item.title}><span className="dr-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></li>)}</ol></section>
    <section className="dr-next"><div><p className="ap-eyebrow">Carry the learning forward</p><h2>From the debate<br />to a conversation.</h2><p>A public exchange can sharpen a question. Patient, truthful conversation gives you a place to explore it with someone.</p></div><div><Link to={AP_BASE + '/practice'}>Practise a thoughtful response <ArrowUpRight size={19} /></Link><Link to={AP_BASE + '/questions'}>Study the questions underneath <ArrowUpRight size={19} /></Link><Link to={AP_BASE + '/paths'}>Follow a guided learning path <ArrowUpRight size={19} /></Link></div></section>
  </div>;
}
