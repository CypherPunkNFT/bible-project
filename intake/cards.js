// The cards: one per intake, largest first.
(async () => {
  let data;
  try {
    const response = await fetch('/data_intake/catalogue.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`catalogue answered ${response.status}`);
    data = await response.json();
  } catch (error) {
    $('cards').replaceChildren(node('p', `The intake list could not be read: ${error.message}`, 'empty'));
    return;
  }
  const intakes = [...data.intakes].sort((a, b) => b.bytes - a.bytes);
  const sum = (key) => intakes.reduce((s, x) => s + x[key], 0);
  $('stats').replaceChildren(stat(count(intakes.length), 'Intakes'), stat(count(sum('sources')), 'Sources'),
    stat(count(sum('files')), 'Files'), stat(size(sum('bytes')), 'On disk'));
  const fragment = document.createDocumentFragment();
  for (const x of intakes) {
    const card = node('a', null, 'card');
    card.href = `/data_intake/${x.slug}/`;
    const meta = node('div', null, 'meta');
    meta.append(node('span', `${count(x.files)} files`), node('span', `${count(x.sources)} sources`));
    card.append(node('h2', x.title), node('div', size(x.bytes), 'size'), meta, typeBar(x.by_type, true),
      node('div', `Job ${x.jobs.join(' · ')}`, 'jobs'));
    fragment.append(card);
  }
  $('cards').replaceChildren(fragment);
})();
