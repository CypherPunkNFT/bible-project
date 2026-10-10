# RB01 download TODO

Failed requests: 3. Unattempted catalogue items: 649.
Unattempted items are deferred work, not download failures. Full IDs, metadata URLs and errors are in `failed-downloads.json`.
The supplementary Latin/abbreviated authority search is also deferred (`filters/ia-latin-variants.json`).

- [ ] `anexpositionepi03willgoog` — HTTP Error 500: Internal Server Error
- [ ] `atreatiseonsabb00owengoog` — HTTP Error 500: Internal Server Error
- [ ] `bim_early-english-books-1641-1700_a-piller-set-up-to-keep_keach-benjamin_1670` — HTTP Error 500: Internal Server Error

Resume through the shared collector using `filters/ia.json`; held IDs and hashes are skipped. Do not retry hard failures during the next run unless requested.
