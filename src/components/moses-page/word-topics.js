import { mountTopicControls } from './chapter-topics.js';

const scriptureWarningIcon='<svg class="scripture-warning-icon" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 10 18H2Z M12 9v5"/><circle cx="12" cy="17" r=".7" fill="currentColor" stroke="none"/></svg>';

function scriptureHeading(title) {
  const heading=document.createElement('h4');
  if(title==='No prophet like him:')heading.className='word-gold-heading';
  if(title.startsWith('What Scripture does not say')) {
    heading.className='scripture-silence-heading';
    heading.innerHTML=scriptureWarningIcon;
    heading.append(document.createTextNode(title));
    return heading.outerHTML;
  }
  const match=title.match(/^(.+?\s\d+(?:[–-]\d+)?)(\s*·\s*)(.*)$/);
  if(match) {
    const reference=document.createElement('span');
    reference.className='word-scripture-title';
    reference.textContent=match[1];
    heading.append(reference,document.createTextNode(match[2]+match[3]));
  } else heading.textContent=title;
  return heading.outerHTML;
}

// Reorganize the existing rendered passages; retain their exact text and links.
export function mountWordTopics(root, signal) {
  const word=root.querySelector('#mg-word');
  const columns=word.querySelector('.mx-word-cols');
  const [call,how,message,speaking]=columns.children;
  const passages=[...how.querySelectorAll('.claim')];
  const calls=[...call.querySelectorAll('.lg-call')];
  const messages=[...message.querySelectorAll('.claim')];
  const detail=(title,html)=>'<div class="word-detail">'+scriptureHeading(title)+'<div class="word-detail-copy">'+html+'</div></div>';
  const grid=(items)=>'<div class="word-reading-grid">'+items.join('')+'</div>';
  const groups=[
    {key:'signs',title:'The call and the word',tone:'var(--midian)',sections:[
      {title:'The call',html:grid(calls.map(item=>detail(item.querySelector('b').textContent,item.outerHTML)))},
      {title:'How God spoke',html:grid([...passages.slice(0,3).map((item,i)=>detail(['Face to face','Mouth to mouth','At the tabernacle'][i],item.outerHTML)), '<details class="word-language"><summary>The language Scripture uses</summary>'+passages[4].outerHTML+'</details>'])},
      {title:'Speaking to Israel',html:'<div class="word-speaking-grid">'+detail('Between the LORD and the people',passages[3].outerHTML)+[...speaking.querySelectorAll('.claim')].map(item=>detail(item.querySelector('.claim-theme').textContent,item.outerHTML)).join('')+'</div>'},
    ]},
    {key:'accounts',title:'The message',tone:'var(--egypt)',sections:[
      {title:'He proclaimed',html:grid(messages.filter((_,i)=>i!==4).map(item=>detail(item.querySelector('.claim-theme').textContent,item.outerHTML)))},
      {title:'He wrote and he sang',html:'<div class="word-two-rows word-reading-prose">'+detail('He wrote',passages[5].outerHTML)+detail('He sang',passages[6].outerHTML)+'</div>'},
    ]},
    {key:'prophet',title:'A prophet like Moses',tone:'var(--wild)',sections:[]},
  ];
  const like=word.querySelector('.mx-like');
  const likeCopy=like.cloneNode(true);likeCopy.querySelector('.lg-h').remove();
  likeCopy.querySelector('[data-askq="moses-prophet-like-me"]')?.remove();
  const close=word.querySelector('.mx-close');
  groups[2].sections.push(
    {title:'Moses, Peter and Stephen',html:'<div class="word-two-rows">'+detail(messages[4].querySelector('.claim-theme').textContent,messages[4].outerHTML)+'<div class="word-comparison">'+likeCopy.innerHTML+'</div></div>'},
    {title:'No prophet like him:',html:'<div class="word-two-rows"><div class="word-detail">'+close.querySelector('figure').outerHTML+'</div>'+detail('What Scripture does not say',close.querySelector('ul').outerHTML)+'</div>'},
  );
  like.remove();close.remove();
  columns.setAttribute('aria-label','The word: calling, message and the prophet like Moses');
  mountTopicControls(columns,groups,'moses-word-topics',signal);
  columns.classList.add('word-topics','word-consolidated');
  columns.querySelector('.horizontal-groups').setAttribute('aria-label','The word topics');
}
