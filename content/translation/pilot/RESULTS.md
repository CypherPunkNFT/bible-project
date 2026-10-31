# Translation pilot: Haiku and the local model, scored blind

50 real items from every part of the site (page text, people, topics, chapter summaries, quiz questions, sources, museums, creeds, hymns, debates), translated into Spanish and Brazilian Portuguese by each translator with the same instructions. Claude Opus 5.5 scored every pair without knowing which translator was which (1 to 10 each for accuracy, fluency and Bible and doctrinal terms; 7 = publishable with small edits).

## Spanish

| | Accuracy | Fluency | Terms | Items won | Items scoring 7+ on all three | Mechanical problems |
|---|---|---|---|---|---|---|
| Haiku | 8.7 | 8.5 | 8.9 | 43 | 45 of 50 | 3 |
| Local (Qwen) | 7.8 | 6.9 | 7.6 | 6 | 26 of 50 | 3 |

Ties: 1.

By kind of text (average of the three scores):

| Kind | Haiku | Local |
|---|---|---|
| page | 9.2 | 8.3 |
| person | 8.8 | 7.7 |
| topic | 8.4 | 7.7 |
| summary | 8.9 | 7.4 |
| question | 9.5 | 8.6 |
| directory | 8.3 | 6.4 |
| museum | 8.8 | 7.6 |
| creed | 8.4 | 6.7 |
| hymn | 7.0 | 5.7 |
| debate | 8.5 | 7.1 |

Worst errors the reviewer found:

- Local (Qwen), 45-hymn (scored 1/1/1): all keys: no translation was supplied, only the placeholder "(no usable answer)", so all content and keys are missing
- Local (Qwen), 33-directory (scored 3/7/4): work1.title to work12.title: titles of English works should stay as they are, but all are translated into Spanish (e.g. "Una defensa de la doctrina reformada de la predestinación"), so readers cannot match them to the actual catalogued works
- Local (Qwen), 23-summary (scored 7/5/6): summary: grammar error, indicative instead of the required subjunctive after 'suplica... que' changes the sense and reads as a mistake ('que no peca'; should be 'que no peque')
- Haiku, 32-directory (scored 5/6/7): work1.genre to work12.genre: all twelve values are left in English ("text", "treatise") instead of "texto" and "tratado"
- Local (Qwen), 38-creed (scored 6/5/7): 3.text: section II reverses the sense of 'so much as in a general or obscure way' (meaning 'not even') with 'más que de manera general u oscura', implying that creation and providence do reveal Christ and grace in a general way; this alters the doctrine of the article
- Local (Qwen), 20-summary (scored 7/6/6): summary: misspelled demonym ("nínivitas" should be "ninivitas")
- Local (Qwen), 40-creed (scored 8/4/7): 5.text: misspelling of a key biblical word, repeated ('apóstlo', 'apóstlos').
- Haiku, 42-hymn (scored 7/5/7): stanza4: "toma a su cargo a los pecadores" shifts the sense somewhat, though it is a tolerable rendering of "for sinners undertakes"; it also uses "viviéramos" where the English has "may live"

## Brazilian Portuguese

| | Accuracy | Fluency | Terms | Items won | Items scoring 7+ on all three | Mechanical problems |
|---|---|---|---|---|---|---|
| Haiku | 8.7 | 8.4 | 8.8 | 43 | 46 of 50 | 4 |
| Local (Qwen) | 7.7 | 6.8 | 7.2 | 5 | 28 of 50 | 3 |

Ties: 2.

By kind of text (average of the three scores):

| Kind | Haiku | Local |
|---|---|---|
| page | 8.9 | 7.8 |
| person | 8.9 | 7.3 |
| topic | 7.9 | 7.8 |
| summary | 8.7 | 7.5 |
| question | 9.5 | 8.8 |
| directory | 9.6 | 4.8 |
| museum | 8.7 | 8.4 |
| creed | 7.9 | 6.3 |
| hymn | 7.6 | 5.2 |
| debate | 8.3 | 6.8 |

Worst errors the reviewer found:

- Local (Qwen), 45-hymn (scored 1/1/1): whole text: no translation was supplied, only the placeholder "(no usable answer)", so all keys and content are missing
- Local (Qwen), 32-directory (scored 3/4/2): work1.title: "providence" is mistranslated as "provisão divina" / "provisões de Deus"; it should be "providência", and this changes a core doctrinal term (same error in work4, work9, work10 and work11 titles)
- Local (Qwen), 33-directory (scored 3/6/4): work1.title through work12.title: titles of English works are translated although they must stay as they are (e.g. "Uma Defesa da Doutrina Reformada da Predestinação"), so the catalogue titles no longer match the actual works
- Local (Qwen), 40-creed (scored 6/3/4): 5.text: gross and pervasive gender error in the key doctrinal term: 'DOS BONS OBRAS', 'os bons obras são necessários', 'excluídos', 'misturados' instead of 'as boas obras' (feminine), in the title and throughout
- Local (Qwen), 38-creed (scored 5/5/5): 3.text: section II reverses the meaning: "senão de uma maneira geral ou obscura" says nature and providence do reveal Christ in a general or obscure way, whereas the English denies even that ("so much as in a general or obscure way")
- Local (Qwen), 48-debate (scored 5/4/6): p2: "uma conta alternativa" mistranslates "account" as a bill or calculation; it should be "relato" or "explicação"
- Local (Qwen), 01-page (scored 5/7/4): s11: "Mesaque" is the wrong person; it is the Portuguese name of Meshach, Daniel's companion, not Mesha king of Moab ("Messa" or "Mesa")
- Local (Qwen), 14-person (scored 8/5/5): article: "regnaria" is not a Portuguese word; it should be "reinaria"

## Cost and time

- Spanish: Haiku $0.024 at list price (billed to the Max plan); local model 153 s for all 50 items, 16,334 tokens written, $0.
- Brazilian Portuguese: Haiku $0.025 at list price (billed to the Max plan); local model 138 s for all 50 items, 16,273 tokens written, $0.
