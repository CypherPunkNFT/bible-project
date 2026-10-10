import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const file=path.join(dir,'preview.tsx');
let s=fs.readFileSync(file,'utf8');
const replacements=[
 ['The globe, country profiles and people-group directory remain together on the existing Christianity & Islam page. Open its atlas section.','Explore countries, communities and the places your neighbours call home. Follow the globe into country profiles and people groups.'],
 ['Open the atlas on the existing page','Explore the Muslim world'],
 ['The existing page / Continue your study','Across beliefs / Examine the claims'],
 ['The complete page you already use: twelve questions, the paired source reader, four reading stages, the Muslim-world globe and connected studies.','Who is God? Who is Jesus? How are we forgiven? Explore twelve questions with Scripture and the relevant Qur’anic passages beside each answer.'],
 ['Open the existing Christianity & Islam page','Explore the collection'],
 ['<span>Same page. Same address. All sections together.</span>',''],
 ['A new study guide / Alongside Christianity & Islam','Understanding · Faith · Conversation'],
 ['Return to the passages behind a claim. Follow references into the existing reading desk.','Return to the passages behind a claim. Read the texts and follow their connections.'],
 ['A proposed home for conversion research and carefully attributed accounts.','Explore personal accounts of faith, the questions people ask and the experiences that shape their journeys.'],
 ['A proposed reading guide for debates, arguments, replies and the questions that remain.','Follow the arguments, consider serious replies and examine the questions that remain.'],
 ['A proposed foundation article to orient the whole collection.','Begin with the beliefs, texts and practices that shape Muslim life.'],
 ['Suggested reading / Proposed collection','Follow the subject / Suggested reading'],
 ["'Article outline'","'Read the guide'"],
 ['Hospitality, honest questions and care without conditions. Preview the proposed guide.','Hospitality, honest questions and care without conditions. Begin with the person.'],
 ['Use the existing four-stage reading plan, with passage context and biblical counterparts.','Follow four stages of reading, with passage context and biblical counterparts.'],
 ['Explore how testimony and research will connect to patient pastoral care.','Read personal accounts with attention to their context and the care a person needs.'],
 ['See how the planned library will connect claims and serious replies.','Examine the grounds for a claim and consider the strongest replies.'],
 ['A home for primary passages, connected Christian studies, and the deeper articles that will grow from the research.','Read primary passages, follow connected Christian studies and explore the questions in greater depth.'],
 ["['planned','Proposed articles']","['planned','Articles & guides']"],
 ['Proposed article · Open the outline and its connected reading.','Read the guide and follow its connections to the texts and questions.'],
 ['Link primary passages and further reading. The research still requires complete recording review before making whole-event judgments.','Return to the primary passages and consider the complete exchange. Ask which premises have been established and which questions still need an answer.'],
 [' / Proposed article',' / Reading & reflection'],
 ['<p>This article preview shows the intended reading experience, section structure and connections. Its full researched text remains to be authored.</p><span className="concept-draft">Sample outline · For design review</span>','<p>{articleIntros[id] ?? "Read the sources in context, clarify the terms and follow the questions into a thoughtful conversation."}</p>'],
 ['From the existing reading desk','Read in context'],
 ['const [details,setDetails]=useState(false);',''],
 ["+' · Local design preview'","+' · Apologetics · Bible Project'"],
 ["view==='article'?'Article preview'","view==='article'?'Reading & reflection'"],
 ['Preview the new Islam study guide','Explore the Islam study guide'],
 ['<p>The Christianity & Islam card below still opens the existing page.</p>','<p>Understand the tradition, examine the claims and prepare for a thoughtful conversation.</p>'],
];
for(const [a,b] of replacements){if(!s.includes(a))throw Error('Missing copy: '+a);s=s.replaceAll(a,b)}
const start=s.indexOf('<div className="concept-review">');
const end=s.indexOf('<div className="ap-masthead">',start);
if(start<0||end<0)throw Error('Review banner not found');
s=s.slice(0,start)+s.slice(end);
const intros=`const articleIntros:Record<string,string>={
 intro:'Find your bearings in Islamic belief and life. Begin with the sources, the vocabulary and the questions that help you understand your neighbour.',
 sources:'A careful reading begins with context. Learn to distinguish what a text says, how it is interpreted and what a person believes.',
 friendship:'Listen with care, speak with conviction and make room for a friendship that can hold an honest conversation about faith.',
 journeys:'Read personal accounts with care. Consider how relationships, experiences, texts and arguments feature in a person’s journey toward Christian faith.',
 debates:'Follow the question beneath the exchange. Examine the claims, their supporting reasons and the replies each participant offers.',
 gospel:'Open a Gospel together. Follow the passage, ask what it reveals about Jesus and give each person space to respond.',
};\n`;
s=s.replace('function Go(',intros+'\nfunction Go(');
fs.writeFileSync(file,s);
const build=path.join(dir,'build.mjs');
fs.writeFileSync(build,fs.readFileSync(build,'utf8').replace('Christianity & Islam · Local design preview','Islam study guide · Apologetics · Bible Project'));
const verify=path.join(dir,'verify-preservation.mjs');
fs.writeFileSync(verify,fs.readFileSync(verify,'utf8').replaceAll('Open the existing Christianity & Islam page','Explore the collection'));
console.log('Removed development commentary and applied reader-facing copy.');
