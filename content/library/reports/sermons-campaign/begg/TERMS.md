# Terms checked before acquiring Alistair Begg's wider Truth For Life archive (2026-11-26)

Copies of the pages quoted here, as fetched at 09:52 UTC on 26 November 2026, are in [raw/terms/](raw/terms/)
(sha256: robots.txt `8108455f…f706`, policies.html `54a1466f…38d8`, sitemap.xml `0a0ae880…aad`, sitemap-sermons.xml `e4db840c…c7f2c8`).
The reading agrees with the review job 1489 recorded in [sources.json](../../../sources.json) (`source-truth-for-life`, reviewed 2026-11-26).

## Copyright policy — https://www.truthforlife.org/about/policies/

- Audio and Video Content: "You may duplicate and distribute copies of Alistair's sermons without prior permission as long as you:
  Do not alter or edit the content in any way / Do not charge for the material (even to recover your fee) / … Copyright [message year]
  by Truth For Life. Used with Permission." … "Your use of this Content is provided under an irrevocable, nonexclusive and
  royalty-free right to use such Content subject to these terms."
- Web Content: "You may post written content from www.truthforlife.org on your website as long as you: Do not edit the content in
  any way / Include a link to the original article and our homepage / Provide the appropriate credit for the content: 'Copyright
  Truth For Life. Used with Permission. www.truthforlife.org.'"
- "We reserve the right to revoke or modify these permissions at any time."
- Nothing on the page addresses automated access.

## robots.txt — https://www.truthforlife.org/robots.txt

`User-agent: *` disallows only filtered listing addresses (`?month=`, `?year=`, `?topic=`, `?scripture=`, `?type=`, `?sort=`,
`?page=`, `?q=` and the like), `/blog/flashdrive/`, `/flashdrive/`, `/donate/paypal/thank-you`. No `Crawl-delay` for `*`
(Swiftbot alone gets 1 s; YandexBot is shut out). It declares `Content-Signal: search=yes, ai-train=yes, ai-input=yes` and
`Sitemap: https://www.truthforlife.org/sitemap.xml`.

## What was requested

- robots.txt, the policy page, sitemap.xml and sitemap-sermons.xml (the site's own index: **3,082 sermon addresses**). The
  sermon listing at /resources/sermons/ is filled in by script and its paged listings are disallowed, so it was not used.
- One request per sermon address not already held, at least 2 s apart, user agent
  `BibleProjectLibrary/1.0 (noncommercial personal research; source-preserving)`, robots.txt checked for every address.
  The run stops on 401/403/429/503 and never retries around a block. Ledger: [progress/checkpoint.json](progress/checkpoint.json).

## Use

Private noncommercial study and cataloguing: each held page is kept byte for byte with its provenance (url, sha256,
retrievedAt). The site links to the original page and does not re-host the text or audio; the permission to copy does not
change that, and it can be revoked. Pages by other speakers are not kept.
