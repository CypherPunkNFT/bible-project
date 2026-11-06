// The source directory in the reader's language (source-words.ts): the shown words are swapped, everything else stays
// as the English build made it.
import { expect, it } from 'vitest';
import { translateDirectory, translateEntries } from './source-words';
import type { Directory, SourceEntry } from './types';

const words = {
  'Bible texts': 'Textos bíblicos', 'Editions of Scripture': 'Ediciones de la Escritura', Book: 'Libro',
  Held: 'En la biblioteca', 'Primary text': 'Texto principal', 'Read online': 'Leer en línea', Topics: 'Temas',
  'Topic pages': 'Páginas de temas',
};
const entry: SourceEntry = {
  id: 'abc', title: 'Book', author: 'Held', categories: ['bible'], kind: 'Book', status: 'Held', role: 'Primary text',
  links: [{ name: 'Read online', url: 'https://example.org/read', sourceId: 'ccel' }],
  citedOn: [{ feature: 'Topics', page: 'Topic pages', address: '/topics' }],
};
const directory = { collections: [{ id: 'bible', label: 'Bible texts', definition: 'Editions of Scripture' }] } as Directory;

it('swaps the words a reader sees and keeps titles, authors, ids and links as published', () => {
  const [shown] = translateEntries([entry], words)!;
  expect(shown).toMatchObject({ kind: 'Libro', status: 'En la biblioteca', role: 'Texto principal' });
  expect(shown.links[0]).toEqual({ name: 'Leer en línea', url: 'https://example.org/read', sourceId: 'ccel' });
  expect(shown.citedOn).toEqual([{ feature: 'Temas', page: 'Páginas de temas', address: '/topics' }]);
  expect({ id: shown.id, title: shown.title, author: shown.author, categories: shown.categories })
    .toEqual({ id: 'abc', title: 'Book', author: 'Held', categories: ['bible'] });
  expect(translateDirectory(directory, words).collections).toEqual([
    { id: 'bible', label: 'Textos bíblicos', definition: 'Ediciones de la Escritura' }]);
  expect(entry.kind).toBe('Book'); // the English records are left as they were: the facets are checked against them
});

it('keeps the English where a word has no translation, and everything in English without words', () => {
  expect(translateEntries([{ ...entry, kind: 'Pamphlet' }], words)![0].kind).toBe('Pamphlet');
  expect(translateEntries([entry], null)).toEqual([entry]);
  expect(translateDirectory(directory, null)).toBe(directory);
  expect(translateEntries(null, words)).toBeNull();
});
